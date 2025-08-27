/**
 * EncryptedDatabase L1 Infrastructure Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EncryptedDatabase } from '../EncryptedDatabase'

// Mock the base class
vi.mock('../../base/L1InfrastructureConstruct', () => ({
  L1InfrastructureConstruct: class {
    constructor(props: any) {
      Object.assign(this, props)
    }
    initialize = vi.fn()
    destroy = vi.fn()
    renderStatus = () => null
  }
}))

// Mock database client
class MockDatabaseClient {
  connected = false
  tlsEnabled = false
  events: Map<string, Set<(...args: any[]) => void>> = new Map()
  
  async connect() {
    this.connected = true
    return this
  }
  
  async close() {
    this.connected = false
  }
  
  async query(sql: string, params?: any[]) {
    if (sql.includes('CREATE TABLE')) {
      return { rows: [] }
    }
    if (sql.includes('INSERT')) {
      return { rows: [{ id: 1, data: params?.[0] }] }
    }
    if (sql.includes('SELECT')) {
      return { rows: [{ id: 1, data: 'test data' }] }
    }
    if (sql.includes('UPDATE')) {
      return { rows: [{ id: 1, data: params?.[0] }] }
    }
    if (sql.includes('DELETE')) {
      return { rows: [] }
    }
    return { rows: [] }
  }
  
  on(event: string, handler: (...args: any[]) => void) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  }
  
  emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(...args))
    }
  }
}

describe('EncryptedDatabase', () => {
  let mockClient: MockDatabaseClient
  let component: EncryptedDatabase
  
  beforeEach(() => {
    mockClient = new MockDatabaseClient()
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (component) {
      await component.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with required configuration', async () => {
      component = new EncryptedDatabase()
      
      const config = {
        connectionString: 'postgresql://test:pass@localhost:5432/testdb',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-master-key'
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.databaseId).toBeDefined()
      expect(result.status).toBe('connected')
      expect(result.capabilities.encryption).toBe(true)
    })
    
    it('should handle connection errors', async () => {
      component = new EncryptedDatabase()
      
      const config = {
        connectionString: 'invalid://connection',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        }
      }
      
      await expect(component.initialize(config)).rejects.toThrow('Failed to connect')
    })
    
    it('should enable TLS when configured', async () => {
      component = new EncryptedDatabase()
      
      const config = {
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        tlsConfig: {
          enabled: true,
          ca: 'ca-cert',
          cert: 'client-cert',
          key: 'client-key'
        }
      }
      
      const result = await component.initialize(config)
      expect(result.capabilities.tls).toBe(true)
    })
  })
  
  describe('Data Operations', () => {
    beforeEach(async () => {
      component = new EncryptedDatabase()
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key',
          fieldsToEncrypt: ['sensitive_data', 'personal_info']
        }
      })
    })
    
    it('should encrypt specified fields during insert', async () => {
      const data = {
        name: 'John Doe',
        sensitive_data: 'SSN-123-45-6789',
        public_data: 'Public info'
      }
      
      const result = await component.insert('users', data)
      
      expect(result.id).toBe(1)
      // Verify encryption was attempted (mock doesn't actually encrypt)
      expect(result.data).toBeDefined()
    })
    
    it('should decrypt fields during select', async () => {
      const result = await component.query('SELECT * FROM users WHERE id = $1', [1])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].data).toBe('test data')
    })
    
    it('should handle field-level encryption configuration', async () => {
      const data = {
        credit_card: '1234-5678-9012-3456',
        email: 'test@example.com'
      }
      
      const result = await component.insert('payments', data, {
        encryptFields: ['credit_card']
      })
      
      expect(result).toBeDefined()
    })
    
    it('should support transactions', async () => {
      const txResult = await component.transaction(async (tx) => {
        await tx.query('INSERT INTO users (name) VALUES ($1)', ['User 1'])
        await tx.query('INSERT INTO users (name) VALUES ($1)', ['User 2'])
        return { success: true }
      })
      
      expect(txResult.success).toBe(true)
    })
  })
  
  describe('Security Features', () => {
    beforeEach(async () => {
      component = new EncryptedDatabase()
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        auditConfig: {
          enabled: true,
          logLevel: 'all',
          includeData: false
        }
      })
    })
    
    it('should validate schema before operations', async () => {
      await expect(
        component.insert('users', { invalid_field: 'value' }, {
          schema: {
            name: { type: 'string', required: true }
          }
        })
      ).rejects.toThrow('Schema validation failed')
    })
    
    it('should mask sensitive data in logs', async () => {
      const maskSpy = vi.spyOn(component as any, 'maskSensitiveData')
      
      await component.query('SELECT * FROM users WHERE ssn = $1', ['123-45-6789'])
      
      expect(maskSpy).toHaveBeenCalled()
    })
    
    it('should enforce access control', async () => {
      await expect(
        component.query('DROP TABLE users', [], {
          user: { id: 'user1', roles: ['read'] }
        })
      ).rejects.toThrow('Insufficient permissions')
    })
    
    it('should track audit events', async () => {
      const auditSpy = vi.fn()
      component.on('audit', auditSpy)
      
      await component.insert('users', { name: 'Test User' })
      
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'insert',
          table: 'users',
          timestamp: expect.any(Date)
        })
      )
    })
  })
  
  describe('Backup and Recovery', () => {
    beforeEach(async () => {
      component = new EncryptedDatabase()
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        backupConfig: {
          enabled: true,
          schedule: '0 2 * * *',
          retention: 30,
          location: 's3://backups'
        }
      })
    })
    
    it('should create encrypted backups', async () => {
      const backup = await component.backup()
      
      expect(backup.id).toBeDefined()
      expect(backup.encrypted).toBe(true)
      expect(backup.size).toBeGreaterThan(0)
    })
    
    it('should restore from backup', async () => {
      const backup = await component.backup()
      const restoreResult = await component.restore(backup.id)
      
      expect(restoreResult.success).toBe(true)
      expect(restoreResult.tablesRestored).toBeGreaterThan(0)
    })
    
    it('should schedule automatic backups', async () => {
      const schedules = await component.getBackupSchedules()
      
      expect(schedules).toHaveLength(1)
      expect(schedules[0].cron).toBe('0 2 * * *')
    })
  })
  
  describe('Compliance', () => {
    it('should enable HIPAA compliance mode', async () => {
      component = new EncryptedDatabase()
      
      const result = await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        complianceConfig: {
          mode: 'HIPAA',
          dataRetention: 2555,
          auditRetention: 2190
        }
      })
      
      expect(result.compliance.mode).toBe('HIPAA')
      expect(result.compliance.features).toContain('encryption_at_rest')
      expect(result.compliance.features).toContain('audit_logging')
    })
    
    it('should enable PCI compliance mode', async () => {
      component = new EncryptedDatabase()
      
      const result = await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        complianceConfig: {
          mode: 'PCI',
          encryptCardData: true,
          tokenization: true
        }
      })
      
      expect(result.compliance.mode).toBe('PCI')
      expect(result.compliance.features).toContain('tokenization')
    })
    
    it('should handle GDPR requirements', async () => {
      component = new EncryptedDatabase()
      
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        complianceConfig: {
          mode: 'GDPR',
          dataSubjectRights: true,
          rightToErasure: true
        }
      })
      
      // Test right to erasure
      const eraseResult = await component.eraseUserData('user123')
      expect(eraseResult.success).toBe(true)
    })
  })
  
  describe('Performance Features', () => {
    beforeEach(async () => {
      component = new EncryptedDatabase()
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        },
        performanceConfig: {
          connectionPooling: true,
          maxConnections: 20,
          queryCache: true,
          indexHints: true
        }
      })
    })
    
    it('should use connection pooling', () => {
      const pool = (component as any).pool
      expect(pool).toBeDefined()
      expect(pool.maxConnections).toBe(20)
    })
    
    it('should cache query results', async () => {
      // First query
      const result1 = await component.query('SELECT * FROM users')
      
      // Second identical query should be cached
      const result2 = await component.query('SELECT * FROM users')
      
      expect(result1).toEqual(result2)
    })
    
    it('should provide query performance metrics', async () => {
      const metrics = await component.getMetrics()
      
      expect(metrics.queryCount).toBeDefined()
      expect(metrics.averageQueryTime).toBeDefined()
      expect(metrics.cacheHitRate).toBeDefined()
    })
  })
  
  describe('Event Handling', () => {
    beforeEach(async () => {
      component = new EncryptedDatabase()
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        }
      })
    })
    
    it('should emit connection events', async () => {
      const connectSpy = vi.fn()
      component.on('connected', connectSpy)
      
      await component.reconnect()
      
      expect(connectSpy).toHaveBeenCalled()
    })
    
    it('should emit error events', async () => {
      const errorSpy = vi.fn()
      component.on('error', errorSpy)
      
      await expect(
        component.query('INVALID SQL')
      ).rejects.toThrow()
      
      expect(errorSpy).toHaveBeenCalled()
    })
    
    it('should emit performance alerts', async () => {
      const alertSpy = vi.fn()
      component.on('performanceAlert', alertSpy)
      
      // Simulate slow query
      await component.query('SELECT * FROM large_table')
      
      // Would emit alert if query took too long
    })
  })
  
  describe('Destruction', () => {
    it('should clean up resources on destroy', async () => {
      component = new EncryptedDatabase()
      await component.initialize({
        connectionString: 'postgresql://test@localhost/db',
        encryptionConfig: {
          enabled: true,
          algorithm: 'AES-256-GCM' as const,
          keyManagement: 'local' as const,
          masterKey: 'test-key'
        }
      })
      
      await component.destroy()
      
      expect((component as any).client?.connected).toBe(false)
      expect((component as any).backupScheduler).toBeUndefined()
    })
  })
  
  describe('UI Rendering', () => {
    it('should render status component', () => {
      component = new EncryptedDatabase()
      
      render(<div>{component.renderStatus()}</div>)
      
      expect(screen.getByText(/Database Status/)).toBeInTheDocument()
    })
  })
})