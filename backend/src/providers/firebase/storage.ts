import { Storage, Bucket, File } from 'firebase-admin/storage'
import {
  StorageProvider,
  StorageObject,
  StorageOptions,
  UploadOptions
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { FirebaseMetricsCollector, trackFirebasePerformance } from './utils/metrics.js'
import { FirebaseCacheManager } from './utils/cache.js'
import { withFirebaseRetry, retryableFirebase, FirebaseCircuitBreaker } from './utils/retry.js'
import { logger } from '../aws/utils/logger.js'
import * as mime from 'mime-types'
import { v4 as uuidv4 } from 'uuid'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { unlink } from 'fs/promises'

export class FirebaseStorageProvider implements StorageProvider {
  private storage: Storage
  private bucket: Bucket
  private cache: FirebaseCacheManager
  private circuitBreaker: FirebaseCircuitBreaker
  private readonly urlExpiry = 3600 // 1 hour
  
  constructor(
    private services: FirebaseServices,
    private config: FirebaseConfig,
    private metrics: FirebaseMetricsCollector
  ) {
    this.storage = services.storage
    this.bucket = this.storage.bucket(config.storageBucket)
    this.cache = new FirebaseCacheManager(config)
    this.circuitBreaker = new FirebaseCircuitBreaker()
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // Test bucket access
    try {
      const [exists] = await this.bucket.exists()
      if (!exists && !this.config.useEmulator) {
        throw new Error(`Storage bucket ${this.config.storageBucket} does not exist`)
      }
      
      logger.info('Firebase Storage provider initialized', {
        bucket: this.config.storageBucket
      })
    } catch (error) {
      logger.error('Failed to initialize Firebase Storage', { error })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  private getObjectKey(key: string): string {
    // Ensure key doesn't start with /
    return key.startsWith('/') ? key.slice(1) : key
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async upload(
    key: string, 
    body: Buffer | NodeJS.ReadableStream, 
    options?: UploadOptions
  ): Promise<StorageObject> {
    const objectKey = this.getObjectKey(key)
    const file = this.bucket.file(objectKey)
    
    try {
      const metadata: any = {
        contentType: options?.contentType || mime.lookup(key) || 'application/octet-stream',
        cacheControl: options?.cacheControl || this.config.options?.storageCacheControl,
        metadata: {
          ...options?.metadata,
          uploadedAt: new Date().toISOString(),
          uploadId: uuidv4()
        }
      }
      
      // Handle buffer vs stream
      if (Buffer.isBuffer(body)) {
        await this.circuitBreaker.execute(() =>
          file.save(body, { metadata })
        )
      } else {
        // For streams, we need to use a different approach
        const stream = file.createWriteStream({ metadata })
        await pipeline(body as NodeJS.ReadableStream, stream)
      }
      
      // Get file metadata
      const [fileMetadata] = await file.getMetadata()
      
      const storageObject: StorageObject = {
        key: objectKey,
        size: parseInt(fileMetadata.size || '0'),
        lastModified: new Date(fileMetadata.updated || fileMetadata.timeCreated),
        etag: fileMetadata.etag || fileMetadata.md5Hash,
        contentType: fileMetadata.contentType,
        metadata: fileMetadata.metadata
      }
      
      // Clear URL cache for this key
      await this.cache.delete(`url:${objectKey}`)
      
      await this.metrics.recordSuccess('Upload', { 
        size: String(storageObject.size) 
      })
      
      return storageObject
    } catch (error: any) {
      logger.error('Upload failed', { error, key: objectKey })
      await this.metrics.recordError('Upload', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async download(key: string): Promise<Buffer> {
    const objectKey = this.getObjectKey(key)
    const file = this.bucket.file(objectKey)
    
    try {
      const [exists] = await file.exists()
      if (!exists) {
        throw new Error(`Object not found: ${objectKey}`)
      }
      
      const [buffer] = await this.circuitBreaker.execute(() =>
        file.download()
      )
      
      await this.metrics.recordSuccess('Download', { 
        size: String(buffer.length) 
      })
      
      return buffer
    } catch (error: any) {
      logger.error('Download failed', { error, key: objectKey })
      await this.metrics.recordError('Download', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async delete(key: string): Promise<void> {
    const objectKey = this.getObjectKey(key)
    const file = this.bucket.file(objectKey)
    
    try {
      await this.circuitBreaker.execute(() =>
        file.delete({ ignoreNotFound: true })
      )
      
      // Clear caches
      await this.cache.delete(`url:${objectKey}`)
      await this.cache.delete(`metadata:${objectKey}`)
      
      await this.metrics.recordSuccess('Delete')
    } catch (error: any) {
      logger.error('Delete failed', { error, key: objectKey })
      await this.metrics.recordError('Delete', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async list(prefix?: string, options?: StorageOptions): Promise<StorageObject[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: prefix ? this.getObjectKey(prefix) : undefined,
        maxResults: options?.maxKeys,
        autoPaginate: false
      })
      
      const objects = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata()
          
          return {
            key: file.name,
            size: parseInt(metadata.size || '0'),
            lastModified: new Date(metadata.updated || metadata.timeCreated),
            etag: metadata.etag || metadata.md5Hash,
            contentType: metadata.contentType,
            metadata: metadata.metadata
          } as StorageObject
        })
      )
      
      await this.metrics.recordSuccess('List', { 
        count: String(objects.length) 
      })
      
      return objects
    } catch (error: any) {
      logger.error('List failed', { error, prefix })
      await this.metrics.recordError('List', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  @FirebaseCacheManager.cacheable({ ttl: 300 })
  async getMetadata(key: string): Promise<StorageObject | null> {
    const objectKey = this.getObjectKey(key)
    const file = this.bucket.file(objectKey)
    
    try {
      const [exists] = await file.exists()
      if (!exists) {
        return null
      }
      
      const [metadata] = await file.getMetadata()
      
      const storageObject: StorageObject = {
        key: objectKey,
        size: parseInt(metadata.size || '0'),
        lastModified: new Date(metadata.updated || metadata.timeCreated),
        etag: metadata.etag || metadata.md5Hash,
        contentType: metadata.contentType,
        metadata: metadata.metadata
      }
      
      await this.metrics.recordSuccess('GetMetadata')
      
      return storageObject
    } catch (error: any) {
      logger.error('Get metadata failed', { error, key: objectKey })
      await this.metrics.recordError('GetMetadata', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const objectKey = this.getObjectKey(key)
    const expiry = expiresIn || this.urlExpiry
    
    // Check cache
    const cacheKey = `url:${objectKey}:${expiry}`
    const cached = await this.cache.get<string>(cacheKey)
    if (cached) {
      return cached
    }
    
    const file = this.bucket.file(objectKey)
    
    try {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiry * 1000)
      })
      
      // Cache the URL (with some buffer before expiry)
      const cacheTtl = Math.max(expiry - 300, 60) // Cache for expiry - 5 minutes, min 1 minute
      await this.cache.set(cacheKey, url, cacheTtl)
      
      await this.metrics.recordSuccess('GetSignedUrl')
      
      return url
    } catch (error: any) {
      logger.error('Get signed URL failed', { error, key: objectKey })
      await this.metrics.recordError('GetSignedUrl', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async copy(sourceKey: string, destKey: string): Promise<StorageObject> {
    const sourceObjectKey = this.getObjectKey(sourceKey)
    const destObjectKey = this.getObjectKey(destKey)
    
    const sourceFile = this.bucket.file(sourceObjectKey)
    const destFile = this.bucket.file(destObjectKey)
    
    try {
      await this.circuitBreaker.execute(() =>
        sourceFile.copy(destFile)
      )
      
      // Get metadata of the copied file
      const [metadata] = await destFile.getMetadata()
      
      const storageObject: StorageObject = {
        key: destObjectKey,
        size: parseInt(metadata.size || '0'),
        lastModified: new Date(metadata.updated || metadata.timeCreated),
        etag: metadata.etag || metadata.md5Hash,
        contentType: metadata.contentType,
        metadata: metadata.metadata
      }
      
      await this.metrics.recordSuccess('Copy')
      
      return storageObject
    } catch (error: any) {
      logger.error('Copy failed', { error, sourceKey, destKey })
      await this.metrics.recordError('Copy', error)
      throw error
    }
  }
  
  // Stream operations for large files
  async uploadStream(key: string, options?: UploadOptions): Promise<NodeJS.WritableStream> {
    const objectKey = this.getObjectKey(key)
    const file = this.bucket.file(objectKey)
    
    const metadata: any = {
      contentType: options?.contentType || mime.lookup(key) || 'application/octet-stream',
      cacheControl: options?.cacheControl || this.config.options?.storageCacheControl,
      metadata: {
        ...options?.metadata,
        uploadedAt: new Date().toISOString()
      }
    }
    
    return file.createWriteStream({ metadata })
  }
  
  async downloadStream(key: string): Promise<NodeJS.ReadableStream> {
    const objectKey = this.getObjectKey(key)
    const file = this.bucket.file(objectKey)
    
    const [exists] = await file.exists()
    if (!exists) {
      throw new Error(`Object not found: ${objectKey}`)
    }
    
    return file.createReadStream()
  }
  
  // Batch operations
  async deleteMany(keys: string[]): Promise<void> {
    const deletePromises = keys.map(key => this.delete(key))
    
    const results = await Promise.allSettled(deletePromises)
    
    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      logger.warn('Some deletions failed', { 
        failed: failed.length, 
        total: keys.length 
      })
    }
  }
  
  // Make bucket public (for development/testing)
  async makeBucketPublic(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Making bucket public is only allowed in development')
    }
    
    await this.bucket.makePublic({ includeFiles: true })
    logger.warn('Storage bucket made public - DEVELOPMENT ONLY')
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Test bucket access
      const [exists] = await this.bucket.exists()
      
      const cacheHealth = await this.cache.healthCheck()
      
      return {
        status: 'healthy',
        details: {
          bucketExists: exists,
          bucket: this.config.storageBucket,
          cache: cacheHealth,
          circuitBreaker: this.circuitBreaker.status,
          metrics: this.metrics.getSummary()
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