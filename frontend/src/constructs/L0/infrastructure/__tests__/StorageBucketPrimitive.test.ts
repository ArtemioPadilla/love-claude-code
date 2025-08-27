import { describe, it, expect, beforeEach } from 'vitest'
import { StorageBucketPrimitive } from '../StorageBucketPrimitive'

describe('L0: StorageBucketPrimitive', () => {
  let construct: StorageBucketPrimitive

  beforeEach(() => {
    construct = new StorageBucketPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required bucket name', async () => {
      await construct.initialize({
        bucketName: 'test-bucket'
      })
      
      expect(construct.metadata.id).toBe('platform-l0-storage-bucket-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default maxFileSize of 0 (unlimited)', async () => {
      await construct.initialize({
        bucketName: 'test-bucket'
      })
      
      expect(construct.getInput('maxFileSize')).toBe(0)
    })

    it('should accept custom maxFileSize', async () => {
      await construct.initialize({
        bucketName: 'test-bucket',
        maxFileSize: 10 * 1024 * 1024 // 10MB
      })
      
      expect(construct.getInput('maxFileSize')).toBe(10485760)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(25)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Deployment', () => {
    it('should deploy successfully with bucket name', async () => {
      await construct.initialize({ bucketName: 'uploads' })
      
      await expect(construct.deploy()).resolves.not.toThrow()
      
      const outputs = construct.getOutputs()
      expect(outputs.bucketId).toBeDefined()
      expect(outputs.bucketId).toMatch(/^bucket-uploads-\d+$/)
      expect(outputs.fileCount).toBe(0)
      expect(outputs.totalSize).toBe(0)
    })

    it('should fail deployment without bucket name', async () => {
      await construct.initialize({})
      
      await expect(construct.deploy()).rejects.toThrow('Bucket name is required')
    })
  })

  describe('Upload Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ bucketName: 'uploads' })
      await construct.deploy()
    })

    it('should upload text files', async () => {
      const fileId = await construct.upload({
        name: 'document.txt',
        content: 'Hello World',
        type: 'text/plain'
      })
      
      expect(fileId).toMatch(/^file-\d+$/)
      expect(construct.getOutputs().fileCount).toBe(1)
      expect(construct.getOutputs().totalSize).toBeGreaterThan(0)
    })

    it('should upload binary files', async () => {
      const binaryData = new Uint8Array([0, 1, 2, 3, 4])
      
      const fileId = await construct.upload({
        name: 'data.bin',
        content: binaryData,
        type: 'application/octet-stream'
      })
      
      expect(fileId).toBeDefined()
      expect(construct.getOutputs().fileCount).toBe(1)
      expect(construct.getOutputs().totalSize).toBe(5)
    })

    it('should upload with metadata', async () => {
      const fileId = await construct.upload({
        name: 'image.jpg',
        content: 'fake-image-data',
        type: 'image/jpeg',
        metadata: {
          width: 800,
          height: 600,
          author: 'Test User'
        }
      })
      
      const file = await construct.download(fileId)
      expect(file?.metadata).toEqual({
        width: 800,
        height: 600,
        author: 'Test User'
      })
    })

    it('should respect file size limit', async () => {
      await construct.initialize({
        bucketName: 'limited',
        maxFileSize: 10 // 10 bytes
      })
      await construct.deploy()
      
      await expect(construct.upload({
        name: 'large.txt',
        content: 'This is a very large file content'
      })).rejects.toThrow(/exceeds limit/)
    })

    it('should handle unlimited file size', async () => {
      const largeContent = 'A'.repeat(1000000) // 1MB
      
      const fileId = await construct.upload({
        name: 'large.txt',
        content: largeContent
      })
      
      expect(fileId).toBeDefined()
    })

    it('should fail upload before deployment', async () => {
      const undeployed = new StorageBucketPrimitive()
      await undeployed.initialize({ bucketName: 'test' })
      
      await expect(undeployed.upload({
        name: 'test.txt',
        content: 'test'
      })).rejects.toThrow('Bucket not deployed')
    })
  })

  describe('Download Operations', () => {
    let fileId: string

    beforeEach(async () => {
      await construct.initialize({ bucketName: 'downloads' })
      await construct.deploy()
      
      fileId = await construct.upload({
        name: 'test.txt',
        content: 'Test content',
        type: 'text/plain'
      })
    })

    it('should download existing file', async () => {
      const file = await construct.download(fileId)
      
      expect(file).toBeDefined()
      expect(file?.name).toBe('test.txt')
      expect(file?.content).toBe('Test content')
      expect(file?.type).toBe('text/plain')
      expect(file?.size).toBeGreaterThan(0)
      expect(file?.uploadedAt).toBeInstanceOf(Date)
    })

    it('should return null for non-existent file', async () => {
      const file = await construct.download('non-existent')
      
      expect(file).toBeNull()
    })

    it('should return copy of file (not reference)', async () => {
      const file1 = await construct.download(fileId)
      const file2 = await construct.download(fileId)
      
      if (file1 && file2) {
        file1.name = 'modified.txt'
        expect(file2.name).toBe('test.txt')
      }
    })
  })

  describe('List Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ bucketName: 'files' })
      await construct.deploy()
    })

    it('should list all files', async () => {
      await construct.upload({ name: 'file1.txt', content: 'Content 1' })
      await construct.upload({ name: 'file2.txt', content: 'Content 2' })
      await construct.upload({ name: 'file3.txt', content: 'Content 3' })
      
      const files = await construct.listFiles()
      
      expect(files).toHaveLength(3)
      expect(files[0].name).toBe('file1.txt')
      expect(files[1].name).toBe('file2.txt')
      expect(files[2].name).toBe('file3.txt')
    })

    it('should return empty array when no files', async () => {
      const files = await construct.listFiles()
      
      expect(files).toEqual([])
    })

    it('should not include file content in list', async () => {
      await construct.upload({ name: 'test.txt', content: 'Secret content' })
      
      const files = await construct.listFiles()
      
      expect(files[0]).not.toHaveProperty('content')
      expect(files[0]).toHaveProperty('id')
      expect(files[0]).toHaveProperty('name')
      expect(files[0]).toHaveProperty('size')
    })
  })

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ bucketName: 'deletions' })
      await construct.deploy()
    })

    it('should delete existing file', async () => {
      const fileId = await construct.upload({ name: 'delete-me.txt', content: 'temp' })
      
      const success = await construct.delete(fileId)
      
      expect(success).toBe(true)
      expect(construct.getOutputs().fileCount).toBe(0)
      expect(await construct.exists(fileId)).toBe(false)
    })

    it('should return false for non-existent file', async () => {
      const success = await construct.delete('non-existent')
      
      expect(success).toBe(false)
    })

    it('should update stats after deletion', async () => {
      const id1 = await construct.upload({ name: 'file1.txt', content: '12345' })
      const id2 = await construct.upload({ name: 'file2.txt', content: '67890' })
      
      expect(construct.getOutputs().fileCount).toBe(2)
      expect(construct.getOutputs().totalSize).toBe(10)
      
      await construct.delete(id1)
      
      expect(construct.getOutputs().fileCount).toBe(1)
      expect(construct.getOutputs().totalSize).toBe(5)
    })

    it('should clear all files', async () => {
      await construct.upload({ name: 'file1.txt', content: 'content1' })
      await construct.upload({ name: 'file2.txt', content: 'content2' })
      await construct.upload({ name: 'file3.txt', content: 'content3' })
      
      const count = await construct.clear()
      
      expect(count).toBe(3)
      expect(construct.getOutputs().fileCount).toBe(0)
      expect(construct.getOutputs().totalSize).toBe(0)
      expect(await construct.listFiles()).toEqual([])
    })
  })

  describe('Utility Methods', () => {
    let fileId: string

    beforeEach(async () => {
      await construct.initialize({ bucketName: 'utils' })
      await construct.deploy()
      
      fileId = await construct.upload({
        name: 'test.txt',
        content: 'Test',
        metadata: { version: 1 }
      })
    })

    it('should check if file exists', async () => {
      expect(await construct.exists(fileId)).toBe(true)
      expect(await construct.exists('non-existent')).toBe(false)
    })

    it('should get file metadata without content', async () => {
      const metadata = await construct.getMetadata(fileId)
      
      expect(metadata).toBeDefined()
      expect(metadata?.name).toBe('test.txt')
      expect(metadata?.size).toBe(4)
      expect(metadata?.metadata.version).toBe(1)
      expect(metadata).not.toHaveProperty('content')
    })

    it('should return null metadata for non-existent file', async () => {
      const metadata = await construct.getMetadata('non-existent')
      
      expect(metadata).toBeNull()
    })

    it('should update file metadata', async () => {
      const success = await construct.updateMetadata(fileId, {
        version: 2,
        lastModified: new Date()
      })
      
      expect(success).toBe(true)
      
      const metadata = await construct.getMetadata(fileId)
      expect(metadata?.metadata.version).toBe(2)
      expect(metadata?.metadata.lastModified).toBeInstanceOf(Date)
    })

    it('should fail updating metadata for non-existent file', async () => {
      const success = await construct.updateMetadata('non-existent', { test: true })
      
      expect(success).toBe(false)
    })

    it('should provide bucket statistics', async () => {
      const stats = construct.getStats()
      
      expect(stats.bucketId).toMatch(/^bucket-utils-\d+$/)
      expect(stats.bucketName).toBe('utils')
      expect(stats.fileCount).toBe(1)
      expect(stats.totalSize).toBe(4)
      expect(stats.maxFileSize).toBe(0)
      expect(stats.lastOperation?.type).toBe('upload')
    })
  })

  describe('Operation Tracking', () => {
    beforeEach(async () => {
      await construct.initialize({ bucketName: 'tracking' })
      await construct.deploy()
    })

    it('should track upload operations', async () => {
      await construct.upload({ name: 'test.txt', content: 'Hello' })
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('upload')
      expect(lastOp.fileName).toBe('test.txt')
      expect(lastOp.success).toBe(true)
      expect(lastOp.size).toBe(5)
      expect(lastOp.timestamp).toBeInstanceOf(Date)
    })

    it('should track download operations', async () => {
      const fileId = await construct.upload({ name: 'test.txt', content: 'Hello' })
      await construct.download(fileId)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('download')
      expect(lastOp.fileId).toBe(fileId)
      expect(lastOp.success).toBe(true)
    })

    it('should track failed download operations', async () => {
      await construct.download('non-existent')
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('download')
      expect(lastOp.success).toBe(false)
    })

    it('should track delete operations', async () => {
      const fileId = await construct.upload({ name: 'test.txt', content: 'Hello' })
      await construct.delete(fileId)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('delete')
      expect(lastOp.fileId).toBe(fileId)
      expect(lastOp.fileName).toBe('test.txt')
      expect(lastOp.success).toBe(true)
    })

    it('should track list operations', async () => {
      await construct.upload({ name: 'file1.txt', content: 'content1' })
      await construct.upload({ name: 'file2.txt', content: 'content2' })
      await construct.listFiles()
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('list')
      expect(lastOp.success).toBe(true)
      expect(lastOp.count).toBe(2)
    })

    it('should track clear operations', async () => {
      await construct.upload({ name: 'file1.txt', content: 'content1' })
      await construct.upload({ name: 'file2.txt', content: 'content2' })
      await construct.clear()
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('clear')
      expect(lastOp.success).toBe(true)
      expect(lastOp.count).toBe(2)
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should have no persistence', async () => {
      await construct.initialize({ bucketName: 'test' })
      await construct.deploy()
      
      await construct.upload({ name: 'test.txt', content: 'data' })
      expect(await construct.listFiles()).toHaveLength(1)
      
      // Create new instance - data is lost
      const newBucket = new StorageBucketPrimitive()
      await newBucket.initialize({ bucketName: 'test' })
      await newBucket.deploy()
      
      expect(await newBucket.listFiles()).toEqual([])
    })

    it('should have no validation', async () => {
      await construct.initialize({ bucketName: 'test' })
      await construct.deploy()
      
      // Should accept any file names and types
      await expect(construct.upload({ name: '', content: '' })).resolves.toBeDefined()
      await expect(construct.upload({ name: '../../../etc/passwd', content: 'hack' })).resolves.toBeDefined()
      await expect(construct.upload({ name: 'file.exe', content: 'virus' })).resolves.toBeDefined()
    })

    it('should have no encryption', async () => {
      await construct.initialize({ bucketName: 'test' })
      await construct.deploy()
      
      const fileId = await construct.upload({
        name: 'secret.txt',
        content: 'sensitive data'
      })
      
      const file = await construct.download(fileId)
      expect(file?.content).toBe('sensitive data') // Stored in plain text
    })

    it('should have no access control', async () => {
      await construct.initialize({ bucketName: 'test' })
      
      // No authentication or authorization methods
      expect(construct).not.toHaveProperty('setPermissions')
      expect(construct).not.toHaveProperty('checkAccess')
      expect(construct).not.toHaveProperty('createSignedUrl')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await construct.initialize({ bucketName: 'edge-cases' })
      await construct.deploy()
    })

    it('should handle various content types', async () => {
      // String content
      const id1 = await construct.upload({ name: 'text.txt', content: 'Hello' })
      expect(await construct.download(id1)).toHaveProperty('content', 'Hello')
      
      // ArrayBuffer content
      const buffer = new ArrayBuffer(8)
      const id2 = await construct.upload({ name: 'buffer.bin', content: buffer })
      const file2 = await construct.download(id2)
      expect(file2?.content).toBeInstanceOf(ArrayBuffer)
      
      // Uint8Array content
      const uint8 = new Uint8Array([1, 2, 3])
      const id3 = await construct.upload({ name: 'uint8.bin', content: uint8 })
      const file3 = await construct.download(id3)
      expect(file3?.content).toBeInstanceOf(Uint8Array)
    })

    it('should handle empty files', async () => {
      const fileId = await construct.upload({ name: 'empty.txt', content: '' })
      
      const file = await construct.download(fileId)
      expect(file?.content).toBe('')
      expect(file?.size).toBe(0)
    })

    it('should handle files with no type', async () => {
      const fileId = await construct.upload({
        name: 'unknown',
        content: 'data'
      })
      
      const file = await construct.download(fileId)
      expect(file?.type).toBe('application/octet-stream')
    })

    it('should handle large number of files', async () => {
      const fileIds = []
      for (let i = 0; i < 1000; i++) {
        const id = await construct.upload({
          name: `file${i}.txt`,
          content: `content${i}`
        })
        fileIds.push(id)
      }
      
      expect(await construct.listFiles()).toHaveLength(1000)
      expect(construct.getOutputs().fileCount).toBe(1000)
    })

    it('should handle deeply nested metadata', async () => {
      const fileId = await construct.upload({
        name: 'nested.txt',
        content: 'data',
        metadata: {
          level1: {
            level2: {
              level3: {
                value: 'deep'
              }
            }
          }
        }
      })
      
      const metadata = await construct.getMetadata(fileId)
      expect(metadata?.metadata.level1.level2.level3.value).toBe('deep')
    })

    it('should handle special characters in file names', async () => {
      const specialNames = [
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        'file.multiple.dots.txt',
        'файл.txt', // Cyrillic
        '文件.txt', // Chinese
        '🎉emoji.txt'
      ]
      
      for (const name of specialNames) {
        const id = await construct.upload({ name, content: 'test' })
        const file = await construct.download(id)
        expect(file?.name).toBe(name)
      }
    })
  })
})