import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  GetObjectCommandOutput,
  StorageClass
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  StorageProvider,
  FileMetadata,
  FileInfo,
  FileListResult
} from '../types.js'
import { AWSConfig, getAWSClientConfig } from './utils/config.js'
import { MetricsCollector, trackPerformance } from './utils/metrics.js'
import { logger } from './utils/logger.js'
import { withRetry, CircuitBreaker } from './utils/retry.js'
import { CacheManager } from './utils/cache.js'
import { Readable } from 'stream'
import crypto from 'crypto'
import mime from 'mime-types'

export class AWSStorageProvider implements StorageProvider {
  private client: S3Client
  private bucketName: string
  private cache: CacheManager
  private circuitBreaker: CircuitBreaker
  private bucketCreated = false
  
  constructor(
    private config: AWSConfig,
    private metrics: MetricsCollector
  ) {
    this.client = new S3Client({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.s3,
      forcePathStyle: !!config.endpoints?.s3 // Required for LocalStack
    })
    
    this.bucketName = `${config.options.s3BucketPrefix}${config.projectId}`.toLowerCase()
    this.cache = new CacheManager(config)
    this.circuitBreaker = new CircuitBreaker()
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    await this.ensureBucket()
    
    logger.info('AWS Storage provider initialized', {
      bucket: this.bucketName,
      storageClass: this.config.options.s3StorageClass,
      encryption: this.config.options.s3Encryption
    })
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  private async ensureBucket(): Promise<void> {
    if (this.bucketCreated) return
    
    try {
      await this.client.send(new CreateBucketCommand({
        Bucket: this.bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: this.config.region !== 'us-east-1' ? this.config.region : undefined
        }
      }))
      logger.info(`Created S3 bucket: ${this.bucketName}`)
    } catch (error: any) {
      if (error.name !== 'BucketAlreadyExists' && error.name !== 'BucketAlreadyOwnedByYou') {
        throw error
      }
    }
    
    this.bucketCreated = true
  }
  
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }
  
  @trackPerformance
  async upload(path: string, file: Buffer | Uint8Array, metadata?: FileMetadata): Promise<FileInfo> {
    await this.ensureBucket()
    
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file)
    const contentType = metadata?.contentType || mime.lookup(path) || 'application/octet-stream'
    const etag = crypto.createHash('md5').update(buffer).digest('hex')
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      ContentEncoding: metadata?.contentEncoding,
      CacheControl: metadata?.cacheControl || 'max-age=3600',
      Metadata: metadata?.metadata,
      StorageClass: this.config.options.s3StorageClass as StorageClass,
      ServerSideEncryption: this.config.options.s3Encryption === 'AES256' ? 'AES256' : undefined,
      SSEKMSKeyId: this.config.options.s3Encryption === 'aws:kms' ? this.config.options.s3KmsKeyId : undefined
    })
    
    await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    const fileInfo: FileInfo = {
      path,
      size: buffer.length,
      contentType,
      etag,
      lastModified: new Date(),
      metadata: metadata?.metadata
    }
    
    // Cache metadata
    await this.cache.set(`file:${path}`, fileInfo, 3600) // 1 hour
    
    return fileInfo
  }
  
  @trackPerformance
  async download(path: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: path
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    if (!response.Body) {
      throw new Error('No body in response')
    }
    
    return this.streamToBuffer(response.Body as Readable)
  }
  
  @trackPerformance
  async getUrl(path: string, options?: { expiresIn?: number }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: path
    })
    
    const expiresIn = options?.expiresIn || 3600 // 1 hour default
    
    // Cache signed URLs (with shorter TTL than expiry)
    const cacheKey = `url:${path}:${expiresIn}`
    const cached = await this.cache.get<string>(cacheKey)
    if (cached) {
      return cached
    }
    
    const url = await getSignedUrl(this.client, command, { expiresIn })
    
    // Cache for 90% of expiry time
    await this.cache.set(cacheKey, url, Math.floor(expiresIn * 0.9))
    
    return url
  }
  
  @trackPerformance
  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: path
    })
    
    await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    // Clear cache
    await Promise.all([
      this.cache.delete(`file:${path}`),
      this.cache.clear(`url:${path}:`)
    ])
  }
  
  @trackPerformance
  async list(prefix: string, options?: { maxResults?: number; pageToken?: string }): Promise<FileListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: options?.maxResults || 1000,
      ContinuationToken: options?.pageToken
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    const files: FileInfo[] = await Promise.all(
      (response.Contents || []).map(async (object) => {
        // Try cache first
        const cached = await this.cache.get<FileInfo>(`file:${object.Key}`)
        if (cached) {
          return cached
        }
        
        return {
          path: object.Key!,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
          etag: object.ETag?.replace(/"/g, ''),
          contentType: 'application/octet-stream' // Would need HEAD request for actual type
        }
      })
    )
    
    return {
      files,
      nextPageToken: response.NextContinuationToken
    }
  }
  
  @trackPerformance
  async move(sourcePath: string, destinationPath: string): Promise<void> {
    // Copy then delete
    await this.copy(sourcePath, destinationPath)
    await this.delete(sourcePath)
  }
  
  @trackPerformance
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourcePath}`,
      Key: destinationPath,
      StorageClass: this.config.options.s3StorageClass as StorageClass,
      ServerSideEncryption: this.config.options.s3Encryption === 'AES256' ? 'AES256' : undefined
    })
    
    await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    // Clear destination cache
    await this.cache.delete(`file:${destinationPath}`)
  }
  
  @trackPerformance
  @CacheManager.cacheable({ ttl: 3600 })
  async getMetadata(path: string): Promise<FileInfo> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: path
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    return {
      path,
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      etag: response.ETag?.replace(/"/g, ''),
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // List with limit 1 to test connection
      await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1
      }))
      
      return {
        status: 'healthy',
        details: {
          bucket: this.bucketName,
          cacheStatus: await this.cache.healthCheck(),
          circuitBreaker: this.circuitBreaker.status
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}