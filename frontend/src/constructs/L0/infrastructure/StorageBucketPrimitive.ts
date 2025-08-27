import { L0InfrastructureConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Storage Bucket Primitive Construct
 * Raw in-memory file storage with no persistence, validation, or security
 * Just basic file upload/download operations
 */
export class StorageBucketPrimitive extends L0InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-storage-bucket-primitive',
    name: 'Storage Bucket Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Infrastructure,
    description: 'Raw in-memory file storage with no persistence or validation',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'storage', 'files'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['storage', 'bucket', 'primitive', 'files'],
    inputs: [
      {
        name: 'bucketName',
        type: 'string',
        description: 'Name of the storage bucket',
        required: true
      },
      {
        name: 'maxFileSize',
        type: 'number',
        description: 'Maximum file size in bytes (0 = unlimited)',
        required: false,
        defaultValue: 0
      }
    ],
    outputs: [
      {
        name: 'bucketId',
        type: 'string',
        description: 'Unique bucket ID'
      },
      {
        name: 'fileCount',
        type: 'number',
        description: 'Number of files in bucket'
      },
      {
        name: 'totalSize',
        type: 'number',
        description: 'Total size of all files in bytes'
      },
      {
        name: 'lastOperation',
        type: 'StorageOperation',
        description: 'Information about last operation'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'In-Memory Storage'
    },
    examples: [
      {
        title: 'Basic File Storage',
        description: 'Simple file upload and download',
        code: `const bucket = new StorageBucketPrimitive()
await bucket.initialize({
  bucketName: 'uploads'
})
await bucket.deploy()

// Upload file
const fileId = await bucket.upload({
  name: 'document.txt',
  content: 'Hello World',
  type: 'text/plain'
})

// Download file
const file = await bucket.download(fileId)
console.log(file.content) // 'Hello World'`,
        language: 'typescript'
      },
      {
        title: 'File Management',
        description: 'Managing multiple files',
        code: `const bucket = new StorageBucketPrimitive()
await bucket.initialize({
  bucketName: 'images',
  maxFileSize: 10 * 1024 * 1024 // 10MB
})

// Upload multiple files
await bucket.upload({ name: 'photo1.jpg', content: imageData1 })
await bucket.upload({ name: 'photo2.jpg', content: imageData2 })

// List all files
const files = await bucket.listFiles()
console.log(files.length) // 2

// Delete file
await bucket.delete(files[0].id)`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 CDNStorage for production',
      'No data persistence (in-memory only)',
      'No file validation or virus scanning',
      'No access control or permissions',
      'No encryption or compression'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 25,
      canBuildConstructs: false
    }
  }

  private bucketId?: string
  private files: Map<string, StoredFile> = new Map()
  private lastOperation?: StorageOperation
  private nextFileId: number = 1

  constructor() {
    super(StorageBucketPrimitive.definition)
  }

  /**
   * Simulated deploy for L0 - creates in-memory bucket
   */
  async deploy(): Promise<void> {
    const bucketName = this.getInput<string>('bucketName')
    if (!bucketName) {
      throw new Error('Bucket name is required')
    }

    // Simulate bucket creation
    this.bucketId = `bucket-${bucketName}-${Date.now()}`
    
    // Set outputs
    this.setOutput('bucketId', this.bucketId)
    this.setOutput('fileCount', 0)
    this.setOutput('totalSize', 0)
    
    console.log(`Storage bucket '${bucketName}' created`)
  }

  /**
   * Upload a file to the bucket
   */
  async upload(file: FileUpload): Promise<string> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    // Check file size limit
    const maxFileSize = this.getInput<number>('maxFileSize') || 0
    const fileSize = this.getFileSize(file.content)
    
    if (maxFileSize > 0 && fileSize > maxFileSize) {
      throw new Error(`File size ${fileSize} exceeds limit of ${maxFileSize} bytes`)
    }

    // Generate file ID
    const fileId = `file-${this.nextFileId++}`
    
    // Store file
    const storedFile: StoredFile = {
      id: fileId,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: fileSize,
      content: file.content,
      uploadedAt: new Date(),
      metadata: file.metadata || {}
    }
    
    this.files.set(fileId, storedFile)
    
    // Update outputs
    this.updateStats()
    
    this.lastOperation = {
      type: 'upload',
      timestamp: new Date(),
      fileId,
      fileName: file.name,
      success: true,
      size: fileSize
    }
    this.setOutput('lastOperation', this.lastOperation)

    return fileId
  }

  /**
   * Download a file from the bucket
   */
  async download(fileId: string): Promise<StoredFile | null> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    const file = this.files.get(fileId)
    
    this.lastOperation = {
      type: 'download',
      timestamp: new Date(),
      fileId,
      fileName: file?.name,
      success: !!file,
      size: file?.size
    }
    this.setOutput('lastOperation', this.lastOperation)

    return file ? { ...file } : null
  }

  /**
   * List all files in the bucket
   */
  async listFiles(): Promise<FileInfo[]> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    const fileList = Array.from(this.files.values()).map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: file.uploadedAt,
      metadata: { ...file.metadata }
    }))
    
    this.lastOperation = {
      type: 'list',
      timestamp: new Date(),
      success: true,
      count: fileList.length
    }
    this.setOutput('lastOperation', this.lastOperation)

    return fileList
  }

  /**
   * Delete a file from the bucket
   */
  async delete(fileId: string): Promise<boolean> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    const file = this.files.get(fileId)
    const existed = this.files.delete(fileId)
    
    if (existed) {
      this.updateStats()
    }
    
    this.lastOperation = {
      type: 'delete',
      timestamp: new Date(),
      fileId,
      fileName: file?.name,
      success: existed,
      size: file?.size
    }
    this.setOutput('lastOperation', this.lastOperation)

    return existed
  }

  /**
   * Delete all files from the bucket
   */
  async clear(): Promise<number> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    const count = this.files.size
    this.files.clear()
    this.nextFileId = 1
    
    this.updateStats()
    
    this.lastOperation = {
      type: 'clear',
      timestamp: new Date(),
      success: true,
      count
    }
    this.setOutput('lastOperation', this.lastOperation)

    return count
  }

  /**
   * Check if file exists
   */
  async exists(fileId: string): Promise<boolean> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    return this.files.has(fileId)
  }

  /**
   * Get file metadata without downloading content
   */
  async getMetadata(fileId: string): Promise<FileInfo | null> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    const file = this.files.get(fileId)
    if (!file) return null

    return {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: file.uploadedAt,
      metadata: { ...file.metadata }
    }
  }

  /**
   * Update file metadata
   */
  async updateMetadata(fileId: string, metadata: Record<string, any>): Promise<boolean> {
    if (!this.bucketId) {
      throw new Error('Bucket not deployed')
    }

    const file = this.files.get(fileId)
    if (!file) return false

    file.metadata = { ...file.metadata, ...metadata }
    
    this.lastOperation = {
      type: 'update',
      timestamp: new Date(),
      fileId,
      fileName: file.name,
      success: true
    }
    this.setOutput('lastOperation', this.lastOperation)

    return true
  }

  /**
   * Get bucket statistics
   */
  getStats(): BucketStats {
    const totalSize = Array.from(this.files.values())
      .reduce((sum, file) => sum + file.size, 0)

    return {
      bucketId: this.bucketId || '',
      bucketName: this.getInput<string>('bucketName') || '',
      fileCount: this.files.size,
      totalSize,
      maxFileSize: this.getInput<number>('maxFileSize') || 0,
      lastOperation: this.lastOperation
    }
  }

  /**
   * Get file size
   */
  private getFileSize(content: any): number {
    if (typeof content === 'string') {
      return new Blob([content]).size
    } else if (content instanceof ArrayBuffer) {
      return content.byteLength
    } else if (content instanceof Uint8Array) {
      return content.byteLength
    } else {
      // Fallback: convert to string and measure
      return new Blob([JSON.stringify(content)]).size
    }
  }

  /**
   * Update bucket statistics
   */
  private updateStats(): void {
    const stats = this.getStats()
    this.setOutput('fileCount', stats.fileCount)
    this.setOutput('totalSize', stats.totalSize)
  }
}

/**
 * File upload interface
 */
export interface FileUpload {
  name: string
  content: string | ArrayBuffer | Uint8Array
  type?: string
  metadata?: Record<string, any>
}

/**
 * Stored file interface
 */
export interface StoredFile {
  id: string
  name: string
  type: string
  size: number
  content: string | ArrayBuffer | Uint8Array
  uploadedAt: Date
  metadata: Record<string, any>
}

/**
 * File info without content
 */
export interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: Date
  metadata: Record<string, any>
}

/**
 * Storage operation info
 */
export interface StorageOperation {
  type: 'upload' | 'download' | 'delete' | 'clear' | 'list' | 'update'
  timestamp: Date
  fileId?: string
  fileName?: string
  success: boolean
  size?: number
  count?: number
}

/**
 * Bucket statistics
 */
export interface BucketStats {
  bucketId: string
  bucketName: string
  fileCount: number
  totalSize: number
  maxFileSize: number
  lastOperation?: StorageOperation
}

// Export factory function
export const createStorageBucketPrimitive = () => new StorageBucketPrimitive()

// Export definition for catalog
export const storageBucketPrimitiveDefinition = StorageBucketPrimitive.definition