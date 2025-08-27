import { L0InfrastructureConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Database Table Primitive Construct
 * Raw in-memory table with no persistence, indexing, or validation
 * Just basic CRUD operations on records
 */
export class DatabaseTablePrimitive extends L0InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-database-table-primitive',
    name: 'Database Table Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Infrastructure,
    description: 'Raw in-memory table with no persistence or validation',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'database', 'storage'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['database', 'table', 'primitive', 'storage'],
    inputs: [
      {
        name: 'tableName',
        type: 'string',
        description: 'Name of the database table',
        required: true
      },
      {
        name: 'primaryKey',
        type: 'string',
        description: 'Primary key field name',
        required: false,
        defaultValue: 'id'
      },
      {
        name: 'autoIncrement',
        type: 'boolean',
        description: 'Auto-increment primary key',
        required: false,
        defaultValue: true
      }
    ],
    outputs: [
      {
        name: 'tableId',
        type: 'string',
        description: 'Unique table ID'
      },
      {
        name: 'recordCount',
        type: 'number',
        description: 'Number of records in table'
      },
      {
        name: 'lastInsertId',
        type: 'string | number',
        description: 'ID of last inserted record'
      },
      {
        name: 'lastOperation',
        type: 'OperationInfo',
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
        title: 'Basic Table',
        description: 'Simple table with auto-increment ID',
        code: `const usersTable = new DatabaseTablePrimitive()
await usersTable.initialize({
  tableName: 'users'
})
await usersTable.deploy()

// Insert record
const id = await usersTable.insert({
  name: 'John Doe',
  email: 'john@example.com'
})`,
        language: 'typescript'
      },
      {
        title: 'Custom Primary Key',
        description: 'Table with custom primary key',
        code: `const productsTable = new DatabaseTablePrimitive()
await productsTable.initialize({
  tableName: 'products',
  primaryKey: 'sku',
  autoIncrement: false
})

await productsTable.insert({
  sku: 'PROD-001',
  name: 'Widget',
  price: 9.99
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 EncryptedDatabase for production',
      'No data persistence (in-memory only)',
      'No indexes or query optimization',
      'No validation or constraints',
      'No transactions or ACID properties'
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
      timeToCreate: 30,
      canBuildConstructs: false
    }
  }

  private tableId?: string
  private records: Map<string | number, any> = new Map()
  private lastInsertId?: string | number
  private lastOperation?: OperationInfo
  private nextId: number = 1

  constructor() {
    super(DatabaseTablePrimitive.definition)
  }

  /**
   * Simulated deploy for L0 - creates in-memory table
   */
  async deploy(): Promise<void> {
    const tableName = this.getInput<string>('tableName')
    if (!tableName) {
      throw new Error('Table name is required')
    }

    // Simulate table creation
    this.tableId = `table-${tableName}-${Date.now()}`
    
    // Set outputs
    this.setOutput('tableId', this.tableId)
    this.setOutput('recordCount', 0)
    
    console.log(`Database table '${tableName}' created`)
  }

  /**
   * Insert a record into the table
   */
  async insert(record: any): Promise<string | number> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    const primaryKey = this.getInput<string>('primaryKey') || 'id'
    const autoIncrement = this.getInput<boolean>('autoIncrement') !== false

    let id: string | number

    if (autoIncrement && !record[primaryKey]) {
      // Auto-generate ID
      id = this.nextId++
      record = { ...record, [primaryKey]: id }
    } else {
      // Use provided ID
      id = record[primaryKey]
      if (!id) {
        throw new Error(`Primary key '${primaryKey}' is required`)
      }
    }

    // Check for duplicate
    if (this.records.has(id)) {
      throw new Error(`Record with ${primaryKey}='${id}' already exists`)
    }

    // Store record
    this.records.set(id, { ...record })
    this.lastInsertId = id

    // Update outputs
    this.setOutput('recordCount', this.records.size)
    this.setOutput('lastInsertId', id)
    
    this.lastOperation = {
      type: 'insert',
      timestamp: new Date(),
      recordId: id,
      success: true
    }
    this.setOutput('lastOperation', this.lastOperation)

    return id
  }

  /**
   * Find a record by ID
   */
  async findById(id: string | number): Promise<any | null> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    const record = this.records.get(id)
    
    this.lastOperation = {
      type: 'select',
      timestamp: new Date(),
      recordId: id,
      success: !!record
    }
    this.setOutput('lastOperation', this.lastOperation)

    return record ? { ...record } : null
  }

  /**
   * Find all records (no filtering in L0)
   */
  async findAll(): Promise<any[]> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    const allRecords = Array.from(this.records.values()).map(r => ({ ...r }))
    
    this.lastOperation = {
      type: 'select',
      timestamp: new Date(),
      success: true,
      count: allRecords.length
    }
    this.setOutput('lastOperation', this.lastOperation)

    return allRecords
  }

  /**
   * Update a record by ID
   */
  async update(id: string | number, updates: any): Promise<boolean> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    const existing = this.records.get(id)
    if (!existing) {
      this.lastOperation = {
        type: 'update',
        timestamp: new Date(),
        recordId: id,
        success: false
      }
      this.setOutput('lastOperation', this.lastOperation)
      return false
    }

    const primaryKey = this.getInput<string>('primaryKey') || 'id'
    
    // Merge updates (preserving primary key)
    const updated = {
      ...existing,
      ...updates,
      [primaryKey]: id
    }
    
    this.records.set(id, updated)
    
    this.lastOperation = {
      type: 'update',
      timestamp: new Date(),
      recordId: id,
      success: true
    }
    this.setOutput('lastOperation', this.lastOperation)

    return true
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string | number): Promise<boolean> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    const existed = this.records.has(id)
    this.records.delete(id)
    
    this.setOutput('recordCount', this.records.size)
    
    this.lastOperation = {
      type: 'delete',
      timestamp: new Date(),
      recordId: id,
      success: existed
    }
    this.setOutput('lastOperation', this.lastOperation)

    return existed
  }

  /**
   * Delete all records
   */
  async truncate(): Promise<number> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    const count = this.records.size
    this.records.clear()
    this.nextId = 1
    
    this.setOutput('recordCount', 0)
    this.setOutput('lastInsertId', undefined)
    
    this.lastOperation = {
      type: 'truncate',
      timestamp: new Date(),
      success: true,
      count
    }
    this.setOutput('lastOperation', this.lastOperation)

    return count
  }

  /**
   * Count records in table
   */
  async count(): Promise<number> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    return this.records.size
  }

  /**
   * Get table statistics
   */
  getStats(): TableStats {
    return {
      tableId: this.tableId || '',
      tableName: this.getInput<string>('tableName') || '',
      recordCount: this.records.size,
      primaryKey: this.getInput<string>('primaryKey') || 'id',
      autoIncrement: this.getInput<boolean>('autoIncrement') !== false,
      lastInsertId: this.lastInsertId,
      lastOperation: this.lastOperation
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string | number): Promise<boolean> {
    if (!this.tableId) {
      throw new Error('Table not deployed')
    }

    return this.records.has(id)
  }

  /**
   * Get all record IDs
   */
  getIds(): (string | number)[] {
    return Array.from(this.records.keys())
  }
}

/**
 * Operation information for tracking
 */
export interface OperationInfo {
  type: 'insert' | 'select' | 'update' | 'delete' | 'truncate'
  timestamp: Date
  recordId?: string | number
  success: boolean
  count?: number
}

/**
 * Table statistics
 */
export interface TableStats {
  tableId: string
  tableName: string
  recordCount: number
  primaryKey: string
  autoIncrement: boolean
  lastInsertId?: string | number
  lastOperation?: OperationInfo
}

// Export factory function
export const createDatabaseTablePrimitive = () => new DatabaseTablePrimitive()

// Export definition for catalog
export const databaseTablePrimitiveDefinition = DatabaseTablePrimitive.definition