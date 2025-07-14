import { createClient, RedisClientType } from 'redis'
import { AWSConfig } from './config.js'
import { logger } from './logger.js'
import { LRUCache } from 'lru-cache'

export interface CacheOptions {
  ttl?: number
  prefix?: string
}

export class CacheManager {
  private redisClient?: RedisClientType
  private localCache: LRUCache<string, any>
  private prefix: string
  private isRedisEnabled: boolean
  
  constructor(private config: AWSConfig) {
    this.prefix = `love-claude:${config.projectId}:`
    this.isRedisEnabled = config.options.enableCache && !!config.options.cacheEndpoint
    
    // Initialize local LRU cache as fallback
    this.localCache = new LRUCache<string, any>({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes default
      updateAgeOnGet: true,
      updateAgeOnHas: true
    })
  }
  
  async initialize(): Promise<void> {
    if (!this.isRedisEnabled) {
      logger.info('Using local cache only')
      return
    }
    
    try {
      this.redisClient = createClient({
        url: this.config.options.cacheEndpoint,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 attempts')
              return false
            }
            return Math.min(retries * 100, 3000)
          }
        }
      })
      
      this.redisClient.on('error', (err) => {
        logger.error('Redis client error', { error: err })
      })
      
      this.redisClient.on('connect', () => {
        logger.info('Redis connected')
      })
      
      await this.redisClient.connect()
    } catch (error) {
      logger.warn('Failed to connect to Redis, using local cache', { error })
      this.isRedisEnabled = false
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit()
    }
    this.localCache.clear()
  }
  
  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefix + key
    
    // Check local cache first
    const localValue = this.localCache.get(prefixedKey)
    if (localValue !== undefined) {
      return localValue
    }
    
    // Try Redis if available
    if (this.redisClient?.isReady) {
      try {
        const value = await this.redisClient.get(prefixedKey)
        if (value) {
          const parsed = JSON.parse(value)
          // Update local cache
          this.localCache.set(prefixedKey, parsed)
          return parsed
        }
      } catch (error) {
        logger.error('Redis get error', { error, key })
      }
    }
    
    return null
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const prefixedKey = this.prefix + key
    const ttlSeconds = ttl || this.config.options.cacheTTL || 300
    
    // Always set in local cache
    this.localCache.set(prefixedKey, value, { ttl: ttlSeconds * 1000 })
    
    // Try Redis if available
    if (this.redisClient?.isReady) {
      try {
        await this.redisClient.setEx(
          prefixedKey,
          ttlSeconds,
          JSON.stringify(value)
        )
      } catch (error) {
        logger.error('Redis set error', { error, key })
      }
    }
  }
  
  async delete(key: string): Promise<void> {
    const prefixedKey = this.prefix + key
    
    // Delete from local cache
    this.localCache.delete(prefixedKey)
    
    // Try Redis if available
    if (this.redisClient?.isReady) {
      try {
        await this.redisClient.del(prefixedKey)
      } catch (error) {
        logger.error('Redis delete error', { error, key })
      }
    }
  }
  
  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      // Clear by pattern
      const keys = [...this.localCache.keys()].filter(k => 
        k.startsWith(this.prefix + pattern)
      )
      keys.forEach(k => this.localCache.delete(k))
      
      if (this.redisClient?.isReady) {
        try {
          const redisKeys = await this.redisClient.keys(this.prefix + pattern + '*')
          if (redisKeys.length > 0) {
            await this.redisClient.del(redisKeys)
          }
        } catch (error) {
          logger.error('Redis clear error', { error, pattern })
        }
      }
    } else {
      // Clear all
      this.localCache.clear()
      
      if (this.redisClient?.isReady) {
        try {
          const keys = await this.redisClient.keys(this.prefix + '*')
          if (keys.length > 0) {
            await this.redisClient.del(keys)
          }
        } catch (error) {
          logger.error('Redis clear all error', { error })
        }
      }
    }
  }
  
  async healthCheck(): Promise<{ status: string; details?: any }> {
    const localStats = {
      size: this.localCache.size,
      calculatedSize: this.localCache.calculatedSize
    }
    
    if (!this.isRedisEnabled) {
      return {
        status: 'healthy',
        details: { local: localStats }
      }
    }
    
    try {
      if (this.redisClient?.isReady) {
        await this.redisClient.ping()
        return {
          status: 'healthy',
          details: {
            local: localStats,
            redis: 'connected'
          }
        }
      }
    } catch (error) {
      // Redis not healthy, but we can still use local cache
    }
    
    return {
      status: 'degraded',
      details: {
        local: localStats,
        redis: 'disconnected'
      }
    }
  }
  
  // Cache decorators
  static cacheable(options?: CacheOptions) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (!descriptor || typeof descriptor.value !== 'function') {
        return descriptor
      }
      
      const originalMethod = descriptor.value
      
      descriptor.value = async function(...args: any[]) {
        const cache = (this as any).cache as CacheManager
        if (!cache) {
          return originalMethod.apply(this, args)
        }
        
        // Generate cache key
        const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`
        
        // Try to get from cache
        const cached = await cache.get(cacheKey)
        if (cached !== null) {
          return cached
        }
        
        // Execute method and cache result
        const result = await originalMethod.apply(this, args)
        await cache.set(cacheKey, result, options?.ttl)
        
        return result
      }
      
      return descriptor
    }
  }
}