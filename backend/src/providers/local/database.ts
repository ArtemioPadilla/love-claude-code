import {
  DatabaseProvider,
  QueryOptions,
  QueryFilter,
  QueryResult,
  Transaction,
  ProviderConfig
} from '../types.js'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Local database provider using JSON file storage
 * Each collection is stored as a separate JSON file
 */
export class LocalDatabaseProvider implements DatabaseProvider {
  private config: ProviderConfig
  private dataPath: string
  private collections: Map<string, Map<string, any>> = new Map()
  private locks: Map<string, Promise<void>> = new Map()
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.dataPath = path.join(
      config.options?.databasePath || './data/db',
      config.projectId,
      'collections'
    )
  }
  
  async initialize(): Promise<void> {
    // Ensure data directory exists
    await fs.mkdir(this.dataPath, { recursive: true })
    
    // Load existing collections
    try {
      const files = await fs.readdir(this.dataPath)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const collectionName = path.basename(file, '.json')
          await this.loadCollection(collectionName)
        }
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }
  
  async shutdown(): Promise<void> {
    // Save all collections
    for (const [name, collection] of this.collections) {
      await this.saveCollection(name, collection)
    }
  }
  
  private async loadCollection(name: string): Promise<Map<string, any>> {
    let collection = this.collections.get(name)
    if (collection) return collection
    
    collection = new Map()
    const filePath = path.join(this.dataPath, `${name}.json`)
    
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const items = JSON.parse(data) as any[]
      items.forEach(item => collection!.set(item.id, item))
    } catch (error) {
      // Collection doesn't exist yet
      if ((error as any).code !== 'ENOENT') {
        console.error(`Error loading collection ${name}:`, error)
      }
    }
    
    this.collections.set(name, collection)
    return collection
  }
  
  private async saveCollection(name: string, collection: Map<string, any>): Promise<void> {
    const filePath = path.join(this.dataPath, `${name}.json`)
    const items = Array.from(collection.values())
    await fs.writeFile(filePath, JSON.stringify(items, null, 2))
  }
  
  private async withLock<T>(collectionName: string, fn: () => Promise<T>): Promise<T> {
    // Simple lock mechanism to prevent concurrent writes
    const existingLock = this.locks.get(collectionName)
    if (existingLock) {
      await existingLock
    }
    
    let resolve: () => void
    const lock = new Promise<void>(r => { resolve = r })
    this.locks.set(collectionName, lock)
    
    try {
      return await fn()
    } finally {
      this.locks.delete(collectionName)
      resolve!()
    }
  }
  
  async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<T & { id: string }> {
    return this.withLock(collectionName, async () => {
      const collection = await this.loadCollection(collectionName)
      const id = crypto.randomUUID()
      const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() }
      
      collection.set(id, item)
      await this.saveCollection(collectionName, collection)
      
      return item as T & { id: string }
    })
  }
  
  async get<T>(collectionName: string, id: string): Promise<T | null> {
    const collection = await this.loadCollection(collectionName)
    return collection.get(id) || null
  }
  
  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
    return this.withLock(collectionName, async () => {
      const collection = await this.loadCollection(collectionName)
      const existing = collection.get(id)
      
      if (!existing) {
        throw new Error(`Document ${id} not found in collection ${collectionName}`)
      }
      
      const updated = { ...existing, ...data, id, updatedAt: new Date() }
      collection.set(id, updated)
      await this.saveCollection(collectionName, collection)
      
      return updated as T
    })
  }
  
  async delete(collectionName: string, id: string): Promise<void> {
    return this.withLock(collectionName, async () => {
      const collection = await this.loadCollection(collectionName)
      collection.delete(id)
      await this.saveCollection(collectionName, collection)
    })
  }
  
  async list<T>(collectionName: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const collection = await this.loadCollection(collectionName)
    let items = Array.from(collection.values())
    
    // Apply ordering
    if (options?.orderBy) {
      items.sort((a, b) => {
        for (const order of options.orderBy!) {
          const aVal = this.getNestedValue(a, order.field)
          const bVal = this.getNestedValue(b, order.field)
          const cmp = this.compareValues(aVal, bVal)
          if (cmp !== 0) {
            return order.direction === 'asc' ? cmp : -cmp
          }
        }
        return 0
      })
    }
    
    // Apply pagination
    const total = items.length
    const offset = options?.offset || 0
    const limit = options?.limit || items.length
    
    items = items.slice(offset, offset + limit)
    
    return {
      items: items as T[],
      total,
      nextPageToken: offset + limit < total ? String(offset + limit) : undefined
    }
  }
  
  async query<T>(collectionName: string, filters: QueryFilter[]): Promise<T[]> {
    const collection = await this.loadCollection(collectionName)
    const items = Array.from(collection.values())
    
    return items.filter(item => {
      return filters.every(filter => {
        const value = this.getNestedValue(item, filter.field)
        return this.evaluateFilter(value, filter.operator, filter.value)
      })
    }) as T[]
  }
  
  async batchCreate<T>(collectionName: string, items: Omit<T, 'id'>[]): Promise<(T & { id: string })[]> {
    return this.withLock(collectionName, async () => {
      const collection = await this.loadCollection(collectionName)
      const created: (T & { id: string })[] = []
      
      for (const data of items) {
        const id = crypto.randomUUID()
        const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() }
        collection.set(id, item)
        created.push(item as T & { id: string })
      }
      
      await this.saveCollection(collectionName, collection)
      return created
    })
  }
  
  async batchUpdate<T>(collectionName: string, updates: { id: string; data: Partial<T> }[]): Promise<void> {
    return this.withLock(collectionName, async () => {
      const collection = await this.loadCollection(collectionName)
      
      for (const { id, data } of updates) {
        const existing = collection.get(id)
        if (existing) {
          collection.set(id, { ...existing, ...data, id, updatedAt: new Date() })
        }
      }
      
      await this.saveCollection(collectionName, collection)
    })
  }
  
  async batchDelete(collectionName: string, ids: string[]): Promise<void> {
    return this.withLock(collectionName, async () => {
      const collection = await this.loadCollection(collectionName)
      ids.forEach(id => collection.delete(id))
      await this.saveCollection(collectionName, collection)
    })
  }
  
  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    // Simple transaction implementation
    const operations: Array<() => Promise<void>> = []
    const cache = new Map<string, any>()
    
    const tx: Transaction = {
      async get<T>(collection: string, id: string): Promise<T | null> {
        const key = `${collection}:${id}`
        if (cache.has(key)) {
          return cache.get(key)
        }
        const value = await this.get<T>(collection, id)
        cache.set(key, value)
        return value
      },
      
      create<T>(collection: string, data: Omit<T, 'id'>): void {
        operations.push(async () => {
          await this.create(collection, data)
        })
      },
      
      update<T>(collection: string, id: string, data: Partial<T>): void {
        operations.push(async () => {
          await this.update(collection, id, data)
        })
      },
      
      delete(collection: string, id: string): void {
        operations.push(async () => {
          await this.delete(collection, id)
        })
      }
    }
    
    const result = await callback(tx)
    
    // Execute all operations
    for (const op of operations) {
      await op()
    }
    
    return result
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  private compareValues(a: any, b: any): number {
    if (a === b) return 0
    if (a === null || a === undefined) return 1
    if (b === null || b === undefined) return -1
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
    if (a < b) return -1
    if (a > b) return 1
    return 0
  }
  
  private evaluateFilter(value: any, operator: QueryFilter['operator'], filterValue: any): boolean {
    switch (operator) {
      case '=': return value === filterValue
      case '!=': return value !== filterValue
      case '<': return value < filterValue
      case '<=': return value <= filterValue
      case '>': return value > filterValue
      case '>=': return value >= filterValue
      case 'in': return Array.isArray(filterValue) && filterValue.includes(value)
      case 'not-in': return Array.isArray(filterValue) && !filterValue.includes(value)
      case 'contains': return String(value).includes(String(filterValue))
      case 'array-contains': return Array.isArray(value) && value.includes(filterValue)
      default: return false
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      await fs.access(this.dataPath)
      return {
        status: 'healthy',
        details: { collections: this.collections.size }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: 'Cannot access database directory' }
      }
    }
  }
}