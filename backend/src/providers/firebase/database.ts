import { Firestore, CollectionReference, Query, Transaction, WriteBatch } from 'firebase-admin/firestore'
import {
  DatabaseProvider,
  QueryOptions,
  DatabaseItem,
  BatchOperation
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { FirebaseMetricsCollector, trackFirebasePerformance } from './utils/metrics.js'
import { FirebaseCacheManager } from './utils/cache.js'
import { withFirebaseRetry, retryableFirebase, FirebaseCircuitBreaker } from './utils/retry.js'
import { logger } from '../aws/utils/logger.js'
import { v4 as uuidv4 } from 'uuid'

export class FirestoreProvider implements DatabaseProvider {
  private firestore: Firestore
  private cache: FirebaseCacheManager
  private circuitBreaker: FirebaseCircuitBreaker
  private batchProcessor: WriteBatch | null = null
  private batchSize = 0
  private readonly maxBatchSize = 500 // Firestore limit
  
  constructor(
    private services: FirebaseServices,
    private config: FirebaseConfig,
    private metrics: FirebaseMetricsCollector
  ) {
    this.firestore = services.firestore
    this.cache = new FirebaseCacheManager(config)
    this.circuitBreaker = new FirebaseCircuitBreaker()
    
    // Configure Firestore settings
    if (config.options?.enableOfflinePersistence) {
      // Note: Offline persistence is a client-side feature
      // Server-side caching is handled by our cache layer
    }
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // Test connection
    try {
      await this.firestore.collection('_health').doc('check').set({
        timestamp: new Date(),
        test: true
      })
      await this.firestore.collection('_health').doc('check').delete()
      
      logger.info('Firestore provider initialized')
    } catch (error) {
      logger.error('Failed to initialize Firestore', { error })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    // Commit any pending batch operations
    if (this.batchProcessor && this.batchSize > 0) {
      await this.batchProcessor.commit()
    }
    
    await this.cache.shutdown()
    await this.firestore.terminate()
  }
  
  private getCollection(table: string): CollectionReference {
    return this.firestore.collection(table)
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async create(table: string, item: Omit<DatabaseItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseItem> {
    const id = item.id || uuidv4()
    const now = new Date()
    
    const fullItem: DatabaseItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now
    }
    
    try {
      await this.circuitBreaker.execute(async () => {
        await this.getCollection(table).doc(id).set(fullItem)
      })
      
      // Clear relevant caches
      await this.cache.delete(`query:${table}:*`)
      
      await this.metrics.recordSuccess('Create', { table })
      
      return fullItem
    } catch (error: any) {
      logger.error('Create failed', { error, table, id })
      await this.metrics.recordError('Create', error, { table })
      throw error
    }
  }
  
  @trackFirebasePerformance
  @FirebaseCacheManager.cacheable({ ttl: 300 })
  async get(table: string, id: string): Promise<DatabaseItem | null> {
    try {
      const doc = await this.getCollection(table).doc(id).get()
      
      if (!doc.exists) {
        return null
      }
      
      const data = doc.data() as DatabaseItem
      
      await this.metrics.recordSuccess('Get', { table })
      
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      }
    } catch (error: any) {
      logger.error('Get failed', { error, table, id })
      await this.metrics.recordError('Get', error, { table })
      throw error
    }
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async update(table: string, id: string, updates: Partial<DatabaseItem>): Promise<DatabaseItem> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    
    try {
      await this.circuitBreaker.execute(async () => {
        await this.getCollection(table).doc(id).update(updateData)
      })
      
      // Clear caches
      await this.cache.delete(`get:${table}:${id}`)
      await this.cache.delete(`query:${table}:*`)
      
      // Fetch updated item
      const updated = await this.get(table, id)
      if (!updated) {
        throw new Error('Item not found after update')
      }
      
      await this.metrics.recordSuccess('Update', { table })
      
      return updated
    } catch (error: any) {
      logger.error('Update failed', { error, table, id })
      await this.metrics.recordError('Update', error, { table })
      throw error
    }
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async delete(table: string, id: string): Promise<void> {
    try {
      await this.circuitBreaker.execute(async () => {
        await this.getCollection(table).doc(id).delete()
      })
      
      // Clear caches
      await this.cache.delete(`get:${table}:${id}`)
      await this.cache.delete(`query:${table}:*`)
      
      await this.metrics.recordSuccess('Delete', { table })
    } catch (error: any) {
      logger.error('Delete failed', { error, table, id })
      await this.metrics.recordError('Delete', error, { table })
      throw error
    }
  }
  
  @trackFirebasePerformance
  async query(table: string, options?: QueryOptions): Promise<DatabaseItem[]> {
    // Build cache key
    const cacheKey = `query:${table}:${JSON.stringify(options || {})}`
    
    // Check cache
    const cached = await this.cache.get<DatabaseItem[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    try {
      let query: Query = this.getCollection(table)
      
      // Apply filters
      if (options?.filters) {
        for (const filter of options.filters) {
          if (filter.operator === 'in' && Array.isArray(filter.value)) {
            // Firestore 'in' queries are limited to 10 values
            if (filter.value.length > 10) {
              // Split into multiple queries
              const results: DatabaseItem[] = []
              for (let i = 0; i < filter.value.length; i += 10) {
                const chunk = filter.value.slice(i, i + 10)
                const chunkQuery = this.getCollection(table).where(filter.field, 'in', chunk)
                const snapshot = await chunkQuery.get()
                results.push(...snapshot.docs.map(doc => ({
                  ...doc.data(),
                  id: doc.id
                } as DatabaseItem)))
              }
              return results
            }
          }
          
          query = query.where(filter.field, filter.operator as any, filter.value)
        }
      }
      
      // Apply sorting
      if (options?.sort) {
        for (const sort of options.sort) {
          query = query.orderBy(sort.field, sort.direction === 'desc' ? 'desc' : 'asc')
        }
      }
      
      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      
      if (options?.offset) {
        // Firestore doesn't support offset directly, use startAfter
        // This requires fetching offset documents first
        const offsetQuery = query.limit(options.offset)
        const offsetSnapshot = await offsetQuery.get()
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
          query = query.startAfter(lastDoc)
        }
      }
      
      const snapshot = await this.circuitBreaker.execute(() => query.get())
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        } as DatabaseItem
      })
      
      // Cache results
      await this.cache.set(cacheKey, items, 60) // 1 minute cache
      
      await this.metrics.recordSuccess('Query', { 
        table, 
        resultCount: String(items.length) 
      })
      
      return items
    } catch (error: any) {
      logger.error('Query failed', { error, table, options })
      await this.metrics.recordError('Query', error, { table })
      throw error
    }
  }
  
  @trackFirebasePerformance
  async count(table: string, options?: QueryOptions): Promise<number> {
    try {
      let query: Query = this.getCollection(table)
      
      // Apply filters
      if (options?.filters) {
        for (const filter of options.filters) {
          query = query.where(filter.field, filter.operator as any, filter.value)
        }
      }
      
      // Firestore now supports count() aggregation
      const snapshot = await query.count().get()
      const count = snapshot.data().count
      
      await this.metrics.recordSuccess('Count', { table })
      
      return count
    } catch (error: any) {
      logger.error('Count failed', { error, table, options })
      await this.metrics.recordError('Count', error, { table })
      throw error
    }
  }
  
  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.firestore.runTransaction(async (transaction: Transaction) => {
      const txWrapper = {
        get: async (table: string, id: string) => {
          const doc = await transaction.get(this.getCollection(table).doc(id))
          if (!doc.exists) return null
          return { ...doc.data(), id: doc.id } as DatabaseItem
        },
        create: async (table: string, item: Omit<DatabaseItem, 'id' | 'createdAt' | 'updatedAt'>) => {
          const id = uuidv4()
          const now = new Date()
          const fullItem = { ...item, id, createdAt: now, updatedAt: now }
          transaction.set(this.getCollection(table).doc(id), fullItem)
          return fullItem
        },
        update: async (table: string, id: string, updates: Partial<DatabaseItem>) => {
          transaction.update(this.getCollection(table).doc(id), {
            ...updates,
            updatedAt: new Date()
          })
        },
        delete: async (table: string, id: string) => {
          transaction.delete(this.getCollection(table).doc(id))
        }
      }
      
      return fn(txWrapper)
    })
  }
  
  @trackFirebasePerformance
  async batch(operations: BatchOperation[]): Promise<void> {
    try {
      // Process in chunks due to Firestore's 500 operations limit
      for (let i = 0; i < operations.length; i += this.maxBatchSize) {
        const chunk = operations.slice(i, i + this.maxBatchSize)
        const batch = this.firestore.batch()
        
        for (const op of chunk) {
          const docRef = this.getCollection(op.table).doc(op.id)
          
          switch (op.operation) {
            case 'create':
              const now = new Date()
              batch.set(docRef, {
                ...op.data,
                id: op.id,
                createdAt: now,
                updatedAt: now
              })
              break
              
            case 'update':
              batch.update(docRef, {
                ...op.data,
                updatedAt: new Date()
              })
              break
              
            case 'delete':
              batch.delete(docRef)
              break
          }
        }
        
        await this.circuitBreaker.execute(() => batch.commit())
      }
      
      // Clear caches
      const tables = new Set(operations.map(op => op.table))
      for (const table of tables) {
        await this.cache.delete(`query:${table}:*`)
      }
      
      await this.metrics.recordSuccess('Batch', { 
        operationCount: String(operations.length) 
      })
    } catch (error: any) {
      logger.error('Batch operation failed', { error, operationCount: operations.length })
      await this.metrics.recordError('Batch', error)
      throw error
    }
  }
  
  // Helper method for complex queries
  async queryWithPagination(
    table: string,
    options: QueryOptions & { pageSize: number; pageToken?: string }
  ): Promise<{ items: DatabaseItem[]; nextPageToken?: string }> {
    let query: Query = this.getCollection(table)
    
    // Apply filters and sorting
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.where(filter.field, filter.operator as any, filter.value)
      }
    }
    
    if (options.sort) {
      for (const sort of options.sort) {
        query = query.orderBy(sort.field, sort.direction === 'desc' ? 'desc' : 'asc')
      }
    }
    
    // Apply pagination
    query = query.limit(options.pageSize + 1) // Fetch one extra to check if there's more
    
    if (options.pageToken) {
      // Decode page token (should be the last document ID from previous page)
      const lastDocRef = this.getCollection(table).doc(options.pageToken)
      const lastDoc = await lastDocRef.get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      }
    }
    
    const snapshot = await query.get()
    const docs = snapshot.docs.slice(0, options.pageSize)
    const hasMore = snapshot.docs.length > options.pageSize
    
    const items = docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as DatabaseItem))
    
    return {
      items,
      nextPageToken: hasMore ? docs[docs.length - 1].id : undefined
    }
  }
  
  // Create indexes (Note: Firestore indexes are typically created via Firebase Console or CLI)
  async createIndex(table: string, fields: string[]): Promise<void> {
    logger.warn('Firestore indexes should be created via Firebase Console or CLI', {
      table,
      fields
    })
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Test Firestore connection
      await this.firestore.collection('_health').doc('check').set({
        timestamp: new Date(),
        test: true
      })
      await this.firestore.collection('_health').doc('check').delete()
      
      const cacheHealth = await this.cache.healthCheck()
      
      return {
        status: 'healthy',
        details: {
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