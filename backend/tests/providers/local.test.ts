import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LocalProvider } from '../../src/providers/local/index.js'
import { ProviderConfig } from '../../src/providers/types.js'
import path from 'path'
import { promises as fs } from 'fs'

describe('LocalProvider', () => {
  let provider: LocalProvider
  const testProjectId = 'test-project-' + Date.now()
  const testDataPath = path.join('./test-data', testProjectId)
  
  const config: ProviderConfig = {
    type: 'local',
    projectId: testProjectId,
    options: {
      databasePath: './test-data/db',
      storagePath: './test-data/storage',
      functionsPath: './test-data/functions',
      realtimePort: 8002
    }
  }
  
  beforeEach(async () => {
    provider = new LocalProvider()
    await provider.initialize(config)
  })
  
  afterEach(async () => {
    await provider.shutdown()
    // Clean up test data
    await fs.rm('./test-data', { recursive: true, force: true })
  })
  
  describe('Auth Provider', () => {
    it('should sign up a new user', async () => {
      const { user, token } = await provider.auth.signUp(
        'test@example.com',
        'password123',
        'Test User'
      )
      
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(token).toBeTruthy()
    })
    
    it('should sign in an existing user', async () => {
      await provider.auth.signUp('test@example.com', 'password123')
      
      const { user, token } = await provider.auth.signIn(
        'test@example.com',
        'password123'
      )
      
      expect(user.email).toBe('test@example.com')
      expect(token).toBeTruthy()
    })
    
    it('should verify a valid token', async () => {
      const { token } = await provider.auth.signUp(
        'test@example.com',
        'password123'
      )
      
      const user = await provider.auth.verifyToken(token)
      expect(user.email).toBe('test@example.com')
    })
  })
  
  describe('Database Provider', () => {
    it('should create and retrieve a document', async () => {
      const doc = await provider.database.create('users', {
        name: 'Test User',
        email: 'test@example.com'
      })
      
      expect(doc.id).toBeTruthy()
      expect(doc.name).toBe('Test User')
      
      const retrieved = await provider.database.get('users', doc.id)
      expect(retrieved).toEqual(doc)
    })
    
    it('should query documents', async () => {
      await provider.database.create('users', { name: 'Alice', age: 25 })
      await provider.database.create('users', { name: 'Bob', age: 30 })
      await provider.database.create('users', { name: 'Charlie', age: 35 })
      
      const results = await provider.database.query('users', [
        { field: 'age', operator: '>', value: 25 }
      ])
      
      expect(results).toHaveLength(2)
      expect(results.map(r => r.name)).toContain('Bob')
      expect(results.map(r => r.name)).toContain('Charlie')
    })
    
    it('should handle transactions', async () => {
      const result = await provider.database.transaction(async (tx) => {
        tx.create('users', { name: 'Test User' })
        tx.create('posts', { title: 'Test Post' })
        return 'success'
      })
      
      expect(result).toBe('success')
      
      const users = await provider.database.list('users')
      expect(users.items).toHaveLength(1)
      
      const posts = await provider.database.list('posts')
      expect(posts.items).toHaveLength(1)
    })
  })
  
  describe('Storage Provider', () => {
    it('should upload and download files', async () => {
      const content = Buffer.from('Hello, world!')
      const fileInfo = await provider.storage.upload(
        'test.txt',
        content,
        { contentType: 'text/plain' }
      )
      
      expect(fileInfo.path).toBe('test.txt')
      expect(fileInfo.size).toBe(content.length)
      
      const downloaded = await provider.storage.download('test.txt')
      expect(downloaded.toString()).toBe('Hello, world!')
    })
    
    it('should list files', async () => {
      await provider.storage.upload('file1.txt', Buffer.from('Content 1'))
      await provider.storage.upload('file2.txt', Buffer.from('Content 2'))
      await provider.storage.upload('dir/file3.txt', Buffer.from('Content 3'))
      
      const result = await provider.storage.list('')
      expect(result.files).toHaveLength(3)
      
      const dirResult = await provider.storage.list('dir/')
      expect(dirResult.files).toHaveLength(1)
    })
  })
  
  describe('Functions Provider', () => {
    it('should deploy and invoke a function', async () => {
      const functionCode = `
        exports.handler = async (event, context) => {
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Hello from function',
              input: event.body
            })
          }
        }
      `
      
      await provider.functions.deploy(
        {
          name: 'test-function',
          handler: 'handler',
          runtime: 'nodejs18',
          timeout: 3000
        },
        functionCode
      )
      
      const result = await provider.functions.invoke('test-function', { test: true })
      expect(result.statusCode).toBe(200)
      expect(result.body.statusCode).toBe(200)
      
      const body = JSON.parse(result.body.body)
      expect(body.message).toBe('Hello from function')
      expect(body.input).toEqual({ test: true })
    })
  })
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await provider.healthCheck()
      expect(health.status).toBe('healthy')
      expect(health.details.auth.status).toBe('healthy')
      expect(health.details.database.status).toBe('healthy')
      expect(health.details.storage.status).toBe('healthy')
      expect(health.details.functions.status).toBe('healthy')
    })
  })
})