import { LRUCache } from 'lru-cache'
import { createClient, RedisClientType } from 'redis'
import { logger } from '../aws/utils/logger.js'

export interface CacheOptions {
  ttl?: number
  keyPrefix?: string
  compress?: boolean
}

export interface CacheConfig {
  provider?: 'memory' | 'redis' | 'hybrid'
  redisUrl?: string
  maxMemorySize?: number
  defaultTTL?: number
  enableCompression?: boolean
}

/**
 * Unified cache manager for all providers
 */
export class UnifiedCacheManager {
  private lruCache: LRUCache<string, any>
  private redisClient?: RedisClientType
  private initialized = false
  private config: Required<CacheConfig>
  
  constructor(config: CacheConfig = {}) {
    this.config = {
      provider: 'hybrid',
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 300, // 5 minutes
      enableCompression: false,
      ...config
    }
    
    // Always initialize LRU cache
    this.lruCache = new LRUCache({
      max: this.config.maxMemorySize,
      maxSize: this.config.maxMemorySize,
      sizeCalculation: (value) => {
        return Buffer.byteLength(JSON.stringify(value))
      },
      ttl: this.config.defaultTTL * 1000,
      updateAgeOnGet: true,
      updateAgeOnHas: true
    })
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    // Initialize Redis if configured
    if (this.config.provider !== 'memory' && this.config.redisUrl) {
      try {
        this.redisClient = createClient({
          url: this.config.redisUrl,
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries > 5) {
                logger.error('Redis reconnection limit reached')
                return false
              }
              return Math.min(retries * 100, 3000)
            }
          }
        })
        
        this.redisClient.on('error', (err) => {
          logger.error('Redis error', { error: err })
        })
        
        this.redisClient.on('connect', () => {
          logger.info('Redis connected')
        })
        
        this.redisClient.on('ready', () => {
          logger.info('Redis ready')
        })
        
        await this.redisClient.connect()
      } catch (error) {
        logger.warn('Failed to connect to Redis, falling back to memory cache', { error })
        this.redisClient = undefined
      }
    }
    
    this.initialized = true
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryValue = this.lruCache.get(key)
    if (memoryValue !== undefined) {
      return memoryValue as T
    }
    
    // Try Redis if available
    if (this.redisClient?.isReady) {
      try {
        const redisValue = await this.redisClient.get(key)
        if (redisValue) {
          const parsed = JSON.parse(redisValue)
          // Populate memory cache
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
    const ttlSeconds = ttl || this.config.defaultTTL
    
    // Set in memory cache
    this.lruCache.set(key, value, { ttl: ttlSeconds * 1000 })
    
    // Set in Redis if available
    if (this.redisClient?.isReady) {
      try {
        const serialized = JSON.stringify(value)
        await this.redisClient.setEx(key, ttlSeconds, serialized)
      } catch (error) {
        logger.warn('Redis set failed', { error, key })
      }
    }
  }
  
  async delete(key: string): Promise<void> {
    // Delete from memory cache
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
  
  async deletePattern(pattern: string): Promise<void> {
    // Delete from memory cache
    const keys = Array.from(this.lruCache.keys())
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    keys.forEach(key => {
      if (regex.test(key)) {
        this.lruCache.delete(key)
      }
    })
    
    // Delete from Redis if available
    if (this.redisClient?.isReady) {
      try {
        const redisKeys = await this.redisClient.keys(pattern)
        if (redisKeys.length > 0) {
          await this.redisClient.del(redisKeys)
        }
      } catch (error) {
        logger.warn('Redis pattern delete failed', { error, pattern })
      }
    }
  }
  
  async clear(): Promise<void> {
    // Clear memory cache
    this.lruCache.clear()
    
    // Clear Redis if available (be careful in production!)
    if (this.redisClient?.isReady && process.env.NODE_ENV === 'development') {
      try {
        await this.redisClient.flushAll()
      } catch (error) {
        logger.warn('Redis clear failed', { error })
      }
    }
  }
  
  async has(key: string): Promise<boolean> {
    if (this.lruCache.has(key)) {
      return true
    }
    
    if (this.redisClient?.isReady) {
      try {
        const exists = await this.redisClient.exists(key)
        return exists === 1
      } catch (error) {
        logger.warn('Redis exists check failed', { error, key })
      }
    }
    
    return false
  }
  
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = []
    const missingKeys: number[] = []
    
    // Check memory cache first
    keys.forEach((key, index) => {
      const value = this.lruCache.get(key)
      if (value !== undefined) {
        results[index] = value as T
      } else {
        results[index] = null
        missingKeys.push(index)
      }
    })
    
    // Try Redis for missing keys
    if (missingKeys.length > 0 && this.redisClient?.isReady) {
      try {
        const redisKeys = missingKeys.map(i => keys[i]).filter(Boolean) as string[]
        const redisValues = await this.redisClient.mGet(redisKeys)
        
        redisValues.forEach((value, i) => {
          if (value) {
            const parsed = JSON.parse(value)
            const originalIndex = missingKeys[i]
            if (originalIndex !== undefined && keys[originalIndex]) {
              results[originalIndex] = parsed
              // Populate memory cache
              this.lruCache.set(keys[originalIndex], parsed)
            }
          }
        })
      } catch (error) {
        logger.warn('Redis mget failed', { error })
      }
    }
    
    return results
  }
  
  async mset(items: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    // Set in memory cache
    items.forEach(({ key, value, ttl }) => {
      this.lruCache.set(key, value, { ttl: (ttl || this.config.defaultTTL) * 1000 })
    })
    
    // Set in Redis if available
    if (this.redisClient?.isReady) {
      try {
        const pipeline = this.redisClient.multi()
        
        items.forEach(({ key, value, ttl }) => {
          pipeline.setEx(key, ttl || this.config.defaultTTL, JSON.stringify(value))
        })
        
        await pipeline.exec()
      } catch (error) {
        logger.warn('Redis mset failed', { error })
      }
    }
  }
  
  getStats() {
    const stats: any = {
      memory: {
        size: this.lruCache.size,
        calculatedSize: this.lruCache.calculatedSize,
        maxSize: this.config.maxMemorySize
      }
    }
    
    if (this.redisClient) {
      stats.redis = {
        connected: this.redisClient.isReady
      }
    }
    
    return stats
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    const details = this.getStats()
    
    if (this.redisClient) {
      try {
        await this.redisClient.ping()
        details.redis.ping = 'pong'
      } catch (error) {
        details.redis.error = error instanceof Error ? error.message : 'Unknown'
      }
    }
    
    return {
      status: 'healthy',
      details
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.redisClient?.isReady) {
      await this.redisClient.quit()
    }
    this.initialized = false
  }
}

/**
 * Cache decorator for automatic caching
 */
export function cacheable(options: CacheOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const cache = (this as any).cache as UnifiedCacheManager | undefined
      if (!cache) {
        return originalMethod.apply(this, args)
      }
      
      // Generate cache key
      const keyPrefix = options.keyPrefix || `${target.constructor.name}.${propertyKey}`
      const key = `${keyPrefix}:${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = await cache.get(key)
      if (cached !== null) {
        return cached
      }
      
      // Execute method and cache result
      const result = await originalMethod.apply(this, args)
      
      // Don't cache null/undefined results unless explicitly allowed
      if (result !== null && result !== undefined) {
        await cache.set(key, result, options.ttl)
      }
      
      return result
    }
    
    return descriptor
  }
}

/**
 * Cache invalidation decorator
 */
export function invalidatesCache(patterns: string[]) {
  return function(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args)
      
      const cache = (this as any).cache as UnifiedCacheManager | undefined
      if (cache) {
        // Invalidate all matching patterns
        for (const pattern of patterns) {
          await cache.deletePattern(pattern)
        }
      }
      
      return result
    }
    
    return descriptor
  }
}