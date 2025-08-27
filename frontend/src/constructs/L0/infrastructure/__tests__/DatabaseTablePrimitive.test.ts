import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseTablePrimitive } from '../DatabaseTablePrimitive'

describe('L0: DatabaseTablePrimitive', () => {
  let construct: DatabaseTablePrimitive

  beforeEach(() => {
    construct = new DatabaseTablePrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required table name', async () => {
      await construct.initialize({
        tableName: 'users'
      })
      
      expect(construct.metadata.id).toBe('platform-l0-database-table-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default primary key if not provided', async () => {
      await construct.initialize({
        tableName: 'users'
      })
      
      expect(construct.getInput('primaryKey')).toBe('id')
    })

    it('should use default autoIncrement if not provided', async () => {
      await construct.initialize({
        tableName: 'users'
      })
      
      expect(construct.getInput('autoIncrement')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        tableName: 'products',
        primaryKey: 'sku',
        autoIncrement: false
      })
      
      expect(construct.getInput('tableName')).toBe('products')
      expect(construct.getInput('primaryKey')).toBe('sku')
      expect(construct.getInput('autoIncrement')).toBe(false)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ tableName: 'test' })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ tableName: 'test' })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(30)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ tableName: 'test' })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ tableName: 'test' })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Deployment', () => {
    it('should deploy successfully with table name', async () => {
      await construct.initialize({ tableName: 'users' })
      
      await expect(construct.deploy()).resolves.not.toThrow()
      
      const outputs = construct.getOutputs()
      expect(outputs.tableId).toBeDefined()
      expect(outputs.tableId).toMatch(/^table-users-\d+$/)
      expect(outputs.recordCount).toBe(0)
    })

    it('should fail deployment without table name', async () => {
      await construct.initialize({})
      
      await expect(construct.deploy()).rejects.toThrow('Table name is required')
    })
  })

  describe('Insert Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ tableName: 'users' })
      await construct.deploy()
    })

    it('should insert records with auto-increment ID', async () => {
      const id1 = await construct.insert({ name: 'John', email: 'john@example.com' })
      const id2 = await construct.insert({ name: 'Jane', email: 'jane@example.com' })
      
      expect(id1).toBe(1)
      expect(id2).toBe(2)
      expect(construct.getOutputs().recordCount).toBe(2)
      expect(construct.getOutputs().lastInsertId).toBe(2)
    })

    it('should insert records with provided ID when auto-increment is false', async () => {
      await construct.initialize({
        tableName: 'products',
        primaryKey: 'sku',
        autoIncrement: false
      })
      await construct.deploy()
      
      const id = await construct.insert({
        sku: 'PROD-001',
        name: 'Widget',
        price: 9.99
      })
      
      expect(id).toBe('PROD-001')
      expect(construct.getOutputs().lastInsertId).toBe('PROD-001')
    })

    it('should reject insert without primary key when auto-increment is false', async () => {
      await construct.initialize({
        tableName: 'products',
        autoIncrement: false
      })
      await construct.deploy()
      
      await expect(construct.insert({ name: 'Widget' }))
        .rejects.toThrow("Primary key 'id' is required")
    })

    it('should reject duplicate primary keys', async () => {
      await construct.insert({ id: 1, name: 'John' })
      
      await expect(construct.insert({ id: 1, name: 'Jane' }))
        .rejects.toThrow("Record with id='1' already exists")
    })

    it('should preserve all fields in inserted record', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
        metadata: { source: 'api' }
      }
      
      const id = await construct.insert(data)
      const record = await construct.findById(id)
      
      expect(record).toEqual({ id, ...data })
    })

    it('should fail insert before deployment', async () => {
      const undeployed = new DatabaseTablePrimitive()
      await undeployed.initialize({ tableName: 'test' })
      
      await expect(undeployed.insert({ name: 'Test' }))
        .rejects.toThrow('Table not deployed')
    })
  })

  describe('Select Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ tableName: 'users' })
      await construct.deploy()
      
      // Insert test data
      await construct.insert({ name: 'John', age: 30 })
      await construct.insert({ name: 'Jane', age: 25 })
      await construct.insert({ name: 'Bob', age: 35 })
    })

    it('should find record by ID', async () => {
      const record = await construct.findById(2)
      
      expect(record).toEqual({
        id: 2,
        name: 'Jane',
        age: 25
      })
    })

    it('should return null for non-existent ID', async () => {
      const record = await construct.findById(999)
      
      expect(record).toBeNull()
    })

    it('should find all records', async () => {
      const records = await construct.findAll()
      
      expect(records).toHaveLength(3)
      expect(records[0]).toEqual({ id: 1, name: 'John', age: 30 })
      expect(records[1]).toEqual({ id: 2, name: 'Jane', age: 25 })
      expect(records[2]).toEqual({ id: 3, name: 'Bob', age: 35 })
    })

    it('should return empty array when no records', async () => {
      await construct.truncate()
      
      const records = await construct.findAll()
      expect(records).toEqual([])
    })

    it('should return copies of records (not references)', async () => {
      const record1 = await construct.findById(1)
      const record2 = await construct.findById(1)
      
      record1.name = 'Modified'
      
      expect(record2.name).toBe('John')
    })
  })

  describe('Update Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ tableName: 'users' })
      await construct.deploy()
      await construct.insert({ name: 'John', age: 30, active: true })
    })

    it('should update existing record', async () => {
      const success = await construct.update(1, {
        age: 31,
        active: false
      })
      
      expect(success).toBe(true)
      
      const record = await construct.findById(1)
      expect(record).toEqual({
        id: 1,
        name: 'John',
        age: 31,
        active: false
      })
    })

    it('should preserve primary key during update', async () => {
      await construct.update(1, {
        id: 999,
        name: 'Jane'
      })
      
      const record = await construct.findById(1)
      expect(record.id).toBe(1)
      expect(record.name).toBe('Jane')
    })

    it('should return false for non-existent record', async () => {
      const success = await construct.update(999, { name: 'Test' })
      
      expect(success).toBe(false)
    })

    it('should handle partial updates', async () => {
      await construct.update(1, { age: 31 })
      
      const record = await construct.findById(1)
      expect(record.name).toBe('John')
      expect(record.age).toBe(31)
      expect(record.active).toBe(true)
    })
  })

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ tableName: 'users' })
      await construct.deploy()
      await construct.insert({ name: 'John' })
      await construct.insert({ name: 'Jane' })
    })

    it('should delete existing record', async () => {
      const success = await construct.delete(1)
      
      expect(success).toBe(true)
      expect(construct.getOutputs().recordCount).toBe(1)
      expect(await construct.findById(1)).toBeNull()
    })

    it('should return false for non-existent record', async () => {
      const success = await construct.delete(999)
      
      expect(success).toBe(false)
    })

    it('should truncate all records', async () => {
      const count = await construct.truncate()
      
      expect(count).toBe(2)
      expect(construct.getOutputs().recordCount).toBe(0)
      expect(await construct.findAll()).toEqual([])
    })

    it('should reset auto-increment after truncate', async () => {
      await construct.truncate()
      
      const id = await construct.insert({ name: 'New User' })
      expect(id).toBe(1)
    })
  })

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await construct.initialize({ tableName: 'users' })
      await construct.deploy()
    })

    it('should count records', async () => {
      expect(await construct.count()).toBe(0)
      
      await construct.insert({ name: 'John' })
      await construct.insert({ name: 'Jane' })
      
      expect(await construct.count()).toBe(2)
    })

    it('should check if record exists', async () => {
      await construct.insert({ name: 'John' })
      
      expect(await construct.exists(1)).toBe(true)
      expect(await construct.exists(999)).toBe(false)
    })

    it('should get all record IDs', async () => {
      await construct.insert({ name: 'John' })
      await construct.insert({ name: 'Jane' })
      await construct.insert({ name: 'Bob' })
      
      expect(construct.getIds()).toEqual([1, 2, 3])
    })

    it('should provide table statistics', async () => {
      await construct.insert({ name: 'John' })
      
      const stats = construct.getStats()
      
      expect(stats.tableId).toMatch(/^table-users-\d+$/)
      expect(stats.tableName).toBe('users')
      expect(stats.recordCount).toBe(1)
      expect(stats.primaryKey).toBe('id')
      expect(stats.autoIncrement).toBe(true)
      expect(stats.lastInsertId).toBe(1)
      expect(stats.lastOperation?.type).toBe('insert')
    })
  })

  describe('Operation Tracking', () => {
    beforeEach(async () => {
      await construct.initialize({ tableName: 'users' })
      await construct.deploy()
    })

    it('should track insert operations', async () => {
      await construct.insert({ name: 'John' })
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('insert')
      expect(lastOp.recordId).toBe(1)
      expect(lastOp.success).toBe(true)
      expect(lastOp.timestamp).toBeInstanceOf(Date)
    })

    it('should track select operations', async () => {
      await construct.findById(1)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('select')
      expect(lastOp.recordId).toBe(1)
      expect(lastOp.success).toBe(false) // Record doesn't exist
    })

    it('should track findAll operations', async () => {
      await construct.insert({ name: 'John' })
      await construct.insert({ name: 'Jane' })
      await construct.findAll()
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('select')
      expect(lastOp.success).toBe(true)
      expect(lastOp.count).toBe(2)
    })

    it('should track update operations', async () => {
      await construct.insert({ name: 'John' })
      await construct.update(1, { age: 31 })
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('update')
      expect(lastOp.recordId).toBe(1)
      expect(lastOp.success).toBe(true)
    })

    it('should track delete operations', async () => {
      await construct.delete(1)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('delete')
      expect(lastOp.recordId).toBe(1)
      expect(lastOp.success).toBe(false) // Record didn't exist
    })

    it('should track truncate operations', async () => {
      await construct.insert({ name: 'John' })
      await construct.insert({ name: 'Jane' })
      await construct.truncate()
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('truncate')
      expect(lastOp.success).toBe(true)
      expect(lastOp.count).toBe(2)
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ tableName: 'test' })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ tableName: 'test' })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should have no data validation', async () => {
      await construct.initialize({ tableName: 'test' })
      await construct.deploy()
      
      // Should accept any data types
      await expect(construct.insert({ data: null })).resolves.toBe(1)
      await expect(construct.insert({ data: undefined })).resolves.toBe(2)
      await expect(construct.insert({ data: '' })).resolves.toBe(3)
      await expect(construct.insert({ data: [] })).resolves.toBe(4)
      await expect(construct.insert({ data: {} })).resolves.toBe(5)
    })

    it('should have no persistence', async () => {
      await construct.initialize({ tableName: 'test' })
      await construct.deploy()
      
      await construct.insert({ name: 'Test' })
      expect(await construct.count()).toBe(1)
      
      // Create new instance - data is lost
      const newTable = new DatabaseTablePrimitive()
      await newTable.initialize({ tableName: 'test' })
      await newTable.deploy()
      
      expect(await newTable.count()).toBe(0)
    })

    it('should have no indexing', async () => {
      await construct.initialize({ tableName: 'test' })
      await construct.deploy()
      
      // No way to query by non-primary key fields
      await construct.insert({ name: 'John', email: 'john@example.com' })
      
      // Can only find by ID, not by other fields
      expect(await construct.findById(1)).toBeTruthy()
      expect(construct).not.toHaveProperty('findByEmail')
      expect(construct).not.toHaveProperty('findWhere')
    })

    it('should have no transactions', async () => {
      await construct.initialize({ tableName: 'test' })
      
      expect(construct).not.toHaveProperty('beginTransaction')
      expect(construct).not.toHaveProperty('commit')
      expect(construct).not.toHaveProperty('rollback')
    })
  })

  describe('Edge Cases', () => {
    it('should handle string primary keys', async () => {
      await construct.initialize({
        tableName: 'products',
        primaryKey: 'code',
        autoIncrement: false
      })
      await construct.deploy()
      
      await construct.insert({ code: 'ABC-123', name: 'Product' })
      const record = await construct.findById('ABC-123')
      
      expect(record).toEqual({
        code: 'ABC-123',
        name: 'Product'
      })
    })

    it('should handle mixed ID types', async () => {
      await construct.initialize({
        tableName: 'mixed',
        autoIncrement: false
      })
      await construct.deploy()
      
      await construct.insert({ id: 1, type: 'number' })
      await construct.insert({ id: '2', type: 'string' })
      
      expect(await construct.findById(1)).toEqual({ id: 1, type: 'number' })
      expect(await construct.findById('2')).toEqual({ id: '2', type: 'string' })
    })

    it('should handle large number of records', async () => {
      await construct.initialize({ tableName: 'stress' })
      await construct.deploy()
      
      // Insert many records
      for (let i = 0; i < 1000; i++) {
        await construct.insert({ index: i })
      }
      
      expect(await construct.count()).toBe(1000)
      expect(construct.getIds()).toHaveLength(1000)
    })

    it('should handle records with no fields except ID', async () => {
      await construct.initialize({ tableName: 'minimal' })
      await construct.deploy()
      
      const id = await construct.insert({})
      const record = await construct.findById(id)
      
      expect(record).toEqual({ id: 1 })
    })

    it('should handle deeply nested data', async () => {
      await construct.initialize({ tableName: 'nested' })
      await construct.deploy()
      
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      }
      
      await construct.insert(data)
      const record = await construct.findById(1)
      
      expect(record.level1.level2.level3.value).toBe('deep')
    })
  })
})