import {
  StorageProvider,
  FileMetadata,
  FileInfo,
  FileListResult,
  ProviderConfig
} from '../types.js'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import mime from 'mime-types'

/**
 * Local storage provider using file system
 */
export class LocalStorageProvider implements StorageProvider {
  private config: ProviderConfig
  private storagePath: string
  private metadataPath: string
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.storagePath = path.join(
      config.options?.storagePath || './data/storage',
      config.projectId
    )
    this.metadataPath = path.join(this.storagePath, '.metadata')
  }
  
  async initialize(): Promise<void> {
    // Ensure storage directories exist
    await fs.mkdir(this.storagePath, { recursive: true })
    await fs.mkdir(this.metadataPath, { recursive: true })
  }
  
  async shutdown(): Promise<void> {
    // Nothing to do for local storage
  }
  
  private getFullPath(filePath: string): string {
    // Normalize and secure the path
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '')
    return path.join(this.storagePath, normalized)
  }
  
  private getMetadataPath(filePath: string): string {
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '')
    return path.join(this.metadataPath, `${normalized}.json`)
  }
  
  private async saveMetadata(filePath: string, metadata: FileInfo): Promise<void> {
    const metaPath = this.getMetadataPath(filePath)
    await fs.mkdir(path.dirname(metaPath), { recursive: true })
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2))
  }
  
  private async loadMetadata(filePath: string): Promise<FileInfo | null> {
    try {
      const metaPath = this.getMetadataPath(filePath)
      const data = await fs.readFile(metaPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  
  async upload(filePath: string, file: Buffer | Uint8Array, metadata?: FileMetadata): Promise<FileInfo> {
    const fullPath = this.getFullPath(filePath)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    
    // Write file
    await fs.writeFile(fullPath, file)
    
    // Calculate etag
    const etag = crypto.createHash('md5').update(file).digest('hex')
    
    // Create file info
    const fileInfo: FileInfo = {
      path: filePath,
      size: file.length,
      contentType: metadata?.contentType || mime.lookup(filePath) || 'application/octet-stream',
      etag,
      lastModified: new Date(),
      metadata: metadata?.metadata
    }
    
    // Save metadata
    await this.saveMetadata(filePath, fileInfo)
    
    return fileInfo
  }
  
  async download(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath)
    return await fs.readFile(fullPath)
  }
  
  async getUrl(filePath: string, options?: { expiresIn?: number }): Promise<string> {
    // For local storage, return a URL that the backend can serve
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.API_PORT || 8000}`
    return `${baseUrl}/api/v1/storage/${this.config.projectId}/${encodeURIComponent(filePath)}`
  }
  
  async delete(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath)
    const metaPath = this.getMetadataPath(filePath)
    
    await Promise.all([
      fs.unlink(fullPath).catch(() => {}),
      fs.unlink(metaPath).catch(() => {})
    ])
  }
  
  async list(prefix: string, options?: { maxResults?: number; pageToken?: string }): Promise<FileListResult> {
    const fullPrefix = this.getFullPath(prefix)
    const files: FileInfo[] = []
    
    async function* walkDir(dir: string): AsyncGenerator<string> {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory()) {
          if (entry.name !== '.metadata') {
            yield* walkDir(fullPath)
          }
        } else {
          yield fullPath
        }
      }
    }
    
    try {
      const startIndex = parseInt(options?.pageToken || '0')
      let index = 0
      const maxResults = options?.maxResults || 1000
      
      for await (const fullPath of walkDir(path.dirname(fullPrefix))) {
        if (!fullPath.startsWith(fullPrefix)) continue
        
        if (index >= startIndex && files.length < maxResults) {
          const relativePath = path.relative(this.storagePath, fullPath)
          const metadata = await this.loadMetadata(relativePath)
          
          if (metadata) {
            files.push(metadata)
          } else {
            // Generate metadata on the fly if missing
            const stat = await fs.stat(fullPath)
            files.push({
              path: relativePath,
              size: stat.size,
              lastModified: stat.mtime,
              contentType: mime.lookup(fullPath) || 'application/octet-stream'
            })
          }
        }
        
        index++
        if (files.length >= maxResults) {
          break
        }
      }
      
      return {
        files,
        nextPageToken: files.length >= maxResults ? String(startIndex + files.length) : undefined
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return { files: [] }
      }
      throw error
    }
  }
  
  async move(sourcePath: string, destinationPath: string): Promise<void> {
    const sourceFullPath = this.getFullPath(sourcePath)
    const destFullPath = this.getFullPath(destinationPath)
    const sourceMetaPath = this.getMetadataPath(sourcePath)
    const destMetaPath = this.getMetadataPath(destinationPath)
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destFullPath), { recursive: true })
    await fs.mkdir(path.dirname(destMetaPath), { recursive: true })
    
    // Move file and metadata
    await Promise.all([
      fs.rename(sourceFullPath, destFullPath),
      fs.rename(sourceMetaPath, destMetaPath).catch(() => {})
    ])
    
    // Update metadata path
    const metadata = await this.loadMetadata(destinationPath)
    if (metadata) {
      metadata.path = destinationPath
      await this.saveMetadata(destinationPath, metadata)
    }
  }
  
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const sourceFullPath = this.getFullPath(sourcePath)
    const destFullPath = this.getFullPath(destinationPath)
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destFullPath), { recursive: true })
    
    // Copy file
    await fs.copyFile(sourceFullPath, destFullPath)
    
    // Copy metadata
    const metadata = await this.loadMetadata(sourcePath)
    if (metadata) {
      metadata.path = destinationPath
      metadata.lastModified = new Date()
      await this.saveMetadata(destinationPath, metadata)
    }
  }
  
  async getMetadata(filePath: string): Promise<FileInfo> {
    const fullPath = this.getFullPath(filePath)
    const metadata = await this.loadMetadata(filePath)
    
    if (metadata) {
      return metadata
    }
    
    // Generate metadata on the fly
    const stat = await fs.stat(fullPath)
    const buffer = await fs.readFile(fullPath)
    const etag = crypto.createHash('md5').update(buffer).digest('hex')
    
    return {
      path: filePath,
      size: stat.size,
      contentType: mime.lookup(fullPath) || 'application/octet-stream',
      etag,
      lastModified: stat.mtime
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      await fs.access(this.storagePath)
      const stats = await fs.stat(this.storagePath)
      return {
        status: 'healthy',
        details: { 
          path: this.storagePath,
          writable: true
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: 'Cannot access storage directory' }
      }
    }
  }
}