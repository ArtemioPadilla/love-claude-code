import { LRUCache } from 'lru-cache'
import { createClient, RedisClientType } from 'redis'
import { logger } from '../../aws/utils/logger.js'
import { FirebaseConfig } from '../types.js'

export class FirebaseCacheManager {
  private lruCache: LRUCache<string, any>
  private redisClient?: RedisClientType
  private initialized = false
  private readonly defaultTTL = 300 // 5 minutes
  
  constructor(private config: FirebaseConfig) {
    // Initialize LRU cache with 100MB limit
    this.lruCache = new LRUCache({
      max: 100 * 1024 * 1024, // 100MB
      maxSize: 100 * 1024 * 1024,
      sizeCalculation: (value) => {
        return Buffer.byteLength(JSON.stringify(value))
      },
      ttl: this.defaultTTL * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      updateAgeOnHas: true
    })
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    // Try to connect to Redis if available
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = createClient({
          url: process.env.REDIS_URL
        })
        
        this.redisClient.on('error', (err) => {
          logger.error('Redis error', { error: err })
        })
        
        await this.redisClient.connect()
        logger.info('Firebase Redis cache connected')
      } catch (error) {
        logger.warn('Failed to connect to Redis, using LRU cache only', { error })
        this.redisClient = undefined
      }
    }
    
    this.initialized = true
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Try LRU cache first
    const lruValue = this.lruCache.get(key)
    if (lruValue !== undefined) {
      return lruValue as T
    }
    
    // Try Redis if available
    if (this.redisClient?.isReady) {
      try {
        const redisValue = await this.redisClient.get(key)
        if (redisValue) {
          const parsed = JSON.parse(redisValue)
          // Populate LRU cache
          this.lruCache.set(key, parsed)
          return parsed as T
        }
      } catch (error) {
        logger.warn('Redis get failed', { error, key })
      }
    }
    
    return null
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const ttlSeconds = ttl || this.defaultTTL
    
    // Set in LRU cache
    this.lruCache.set(key, value, { ttl: ttlSeconds * 1000 })
    
    // Set in Redis if available
    if (this.redisClient?.isReady) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value))
      } catch (error) {
        logger.warn('Redis set failed', { error, key })
      }
    }
  }
  
  async delete(key: string): Promise<void> {
    // Delete from LRU cache
    this.lruCache.delete(key)
    
    // Delete from Redis if available
    if (this.redisClient?.isReady) {
      try {
        await this.redisClient.del(key)
      } catch (error) {
        logger.warn('Redis delete failed', { error, key })
      }
    }
  }
  
  async clear(): Promise<void> {
    // Clear LRU cache
    this.lruCache.clear()
    
    // Clear Redis if available (be careful with this in production!)
    if (this.redisClient?.isReady && process.env.NODE_ENV === 'development') {
      try {
        await this.redisClient.flushAll()
      } catch (error) {
        logger.warn('Redis clear failed', { error })
      }
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.redisClient?.isReady) {
      await this.redisClient.quit()
    }
    this.initialized = false
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    const details: any = {
      lruCache: {
        size: this.lruCache.size,
        calculatedSize: this.lruCache.calculatedSize
      }
    }
    
    if (this.redisClient) {
      try {
        await this.redisClient.ping()
        details.redis = { status: 'connected' }
      } catch (error) {
        details.redis = { status: 'disconnected', error: error instanceof Error ? error.message : 'Unknown' }
      }
    }
    
    return {
      status: 'healthy',
      details
    }
  }
  
  // Cache decorator for automatic caching
  static cacheable(options: { ttl?: number; keyPrefix?: string } = {}) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (!descriptor || typeof descriptor.value !== 'function') {
        return descriptor
      }
      
      const originalMethod = descriptor.value
      
      descriptor.value = async function(...args: any[]) {
        const cache = (this as any).cache as FirebaseCacheManager
        if (!cache) {
          return originalMethod.apply(this, args)
        }
        
        // Generate cache key
        const keyPrefix = options.keyPrefix || propertyKey
        const key = `${keyPrefix}:${JSON.stringify(args)}`
        
        // Try to get from cache
        const cached = await cache.get(key)
        if (cached !== null) {
          return cached
        }
        
        // Execute method and cache result
        const result = await originalMethod.apply(this, args)
        await cache.set(key, result, options.ttl)
        
        return result
      }
      
      return descriptor
    }
  }
}

// Batch operations helper
export class FirebaseBatchProcessor<T> {
  private batch: T[] = []
  private timer?: NodeJS.Timeout
  
  constructor(
    private processor: (items: T[]) => Promise<void>,
    private maxBatchSize: number = 100,
    private maxWaitTime: number = 1000
  ) {}
  
  async add(item: T): Promise<void> {
    this.batch.push(item)
    
    if (this.batch.length >= this.maxBatchSize) {
      await this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush().catch(err => 
          logger.error('Batch flush failed', { error: err })
        )
      }, this.maxWaitTime)
    }
  }
  
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    
    if (this.batch.length === 0) return
    
    const items = [...this.batch]
    this.batch = []
    
    try {
      await this.processor(items)
    } catch (error) {
      logger.error('Batch processing failed', { error, itemCount: items.length })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    await this.flush()
  }
}