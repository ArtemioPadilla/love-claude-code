/**
 * MCP Rate Limiter Utility Service
 * Shared rate limiting implementation for MCP components
 */

export interface RateLimitConfig {
  /** Enable rate limiting */
  enabled: boolean
  /** Rate limit window in milliseconds */
  windowMs: number
  /** Maximum requests per window */
  maxRequests: number
  /** Maximum burst size */
  maxBurst?: number
  /** Rate limit by */
  limitBy: 'ip' | 'user' | 'apiKey' | 'custom'
  /** Key extractor function */
  keyExtractor?: (context: any) => string
  /** Skip successful requests */
  skipSuccessful?: boolean
  /** Skip failed requests */
  skipFailed?: boolean
  /** Token bucket refill rate (tokens per second) */
  refillRate?: number
}

export interface RateLimitStatus {
  allowed: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

export interface TokenBucket {
  tokens: number
  lastRefill: number
  capacity: number
  refillRate: number
}

export interface RateLimitMetrics {
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  uniqueClients: number
  averageTokensUsed: number
  bucketStats: {
    active: number
    expired: number
  }
}

export class MCPRateLimiter {
  private config: RateLimitConfig
  private buckets: Map<string, TokenBucket> = new Map()
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    uniqueClients: 0,
    averageTokensUsed: 0,
    bucketStats: {
      active: 0,
      expired: 0
    }
  }
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Start cleanup interval
    if (config.enabled) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, Math.min(config.windowMs, 60000)) // Cleanup at least every minute
    }
  }

  /**
   * Extract rate limit key from context
   */
  private extractKey(context: any): string {
    if (this.config.keyExtractor) {
      return this.config.keyExtractor(context)
    }

    switch (this.config.limitBy) {
      case 'ip':
        return context.ip || 
               context.headers?.['x-forwarded-for'] || 
               context.headers?.['x-real-ip'] || 
               'unknown-ip'
      case 'user':
        return context.userId || 
               context.user?.id || 
               context.headers?.['x-user-id'] || 
               'anonymous'
      case 'apiKey':
        return context.apiKey || 
               context.headers?.['x-api-key'] || 
               context.headers?.['authorization'] || 
               'no-key'
      default:
        return 'default'
    }
  }

  /**
   * Get or create token bucket
   */
  private getBucket(key: string): TokenBucket {
    let bucket = this.buckets.get(key)
    
    if (!bucket) {
      const capacity = this.config.maxBurst || this.config.maxRequests
      bucket = {
        tokens: capacity,
        lastRefill: Date.now(),
        capacity,
        refillRate: this.config.refillRate || 
                   (this.config.maxRequests / (this.config.windowMs / 1000))
      }
      this.buckets.set(key, bucket)
      this.metrics.uniqueClients = this.buckets.size
      this.metrics.bucketStats.active++
    }
    
    return bucket
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now()
    const elapsed = (now - bucket.lastRefill) / 1000 // seconds
    const tokensToAdd = elapsed * bucket.refillRate
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  /**
   * Check if request is allowed
   */
  check(context: any = {}): RateLimitStatus {
    if (!this.config.enabled) {
      return {
        allowed: true,
        limit: -1,
        remaining: -1,
        reset: new Date(Date.now() + this.config.windowMs)
      }
    }

    const key = this.extractKey(context)
    const bucket = this.getBucket(key)
    this.refillTokens(bucket)

    const tokensNeeded = 1
    const allowed = bucket.tokens >= tokensNeeded

    if (allowed) {
      bucket.tokens -= tokensNeeded
    }

    const reset = new Date(
      bucket.lastRefill + ((bucket.capacity - bucket.tokens) / bucket.refillRate) * 1000
    )

    const status: RateLimitStatus = {
      allowed,
      limit: bucket.capacity,
      remaining: Math.floor(bucket.tokens),
      reset
    }

    if (!allowed) {
      status.retryAfter = Math.ceil((tokensNeeded - bucket.tokens) / bucket.refillRate)
    }

    // Update metrics
    this.metrics.totalRequests++
    if (allowed) {
      this.metrics.allowedRequests++
    } else {
      this.metrics.blockedRequests++
    }

    const totalTokensUsed = this.metrics.averageTokensUsed * (this.metrics.totalRequests - 1) + tokensNeeded
    this.metrics.averageTokensUsed = totalTokensUsed / this.metrics.totalRequests

    return status
  }

  /**
   * Consume tokens for a specific key
   */
  consume(key: string, tokens: number = 1): boolean {
    if (!this.config.enabled) return true

    const bucket = this.getBucket(key)
    this.refillTokens(bucket)

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens
      return true
    }

    return false
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): RateLimitStatus {
    if (!this.config.enabled) {
      return {
        allowed: true,
        limit: -1,
        remaining: -1,
        reset: new Date(Date.now() + this.config.windowMs)
      }
    }

    const bucket = this.getBucket(key)
    this.refillTokens(bucket)

    const reset = new Date(
      bucket.lastRefill + ((bucket.capacity - bucket.tokens) / bucket.refillRate) * 1000
    )

    return {
      allowed: bucket.tokens >= 1,
      limit: bucket.capacity,
      remaining: Math.floor(bucket.tokens),
      reset
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    if (this.buckets.has(key)) {
      this.buckets.delete(key)
      this.metrics.uniqueClients = this.buckets.size
      this.metrics.bucketStats.active--
    }
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    const count = this.buckets.size
    this.buckets.clear()
    this.metrics.uniqueClients = 0
    this.metrics.bucketStats.active = 0
    this.metrics.bucketStats.expired += count
  }

  /**
   * Get rate limiter metrics
   */
  getMetrics(): RateLimitMetrics {
    return { ...this.metrics }
  }

  /**
   * Clean up expired buckets
   */
  private cleanup(): void {
    const now = Date.now()
    const staleThreshold = this.config.windowMs * 2
    let cleaned = 0
    
    for (const [key, bucket] of this.buckets.entries()) {
      // Remove buckets that haven't been used and are at full capacity
      if (now - bucket.lastRefill > staleThreshold && 
          bucket.tokens >= bucket.capacity) {
        this.buckets.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      this.metrics.uniqueClients = this.buckets.size
      this.metrics.bucketStats.active -= cleaned
      this.metrics.bucketStats.expired += cleaned
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Restart cleanup interval if needed
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    if (this.config.enabled) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, Math.min(this.config.windowMs, 60000))
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.buckets.clear()
  }

  /**
   * Create a middleware function for Express-like frameworks
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const context = {
        ip: req.ip,
        headers: req.headers,
        user: req.user,
        userId: req.user?.id,
        apiKey: req.headers?.['x-api-key']
      }

      const status = this.check(context)

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', status.limit.toString())
      res.setHeader('X-RateLimit-Remaining', status.remaining.toString())
      res.setHeader('X-RateLimit-Reset', status.reset.toISOString())

      if (!status.allowed) {
        res.setHeader('Retry-After', status.retryAfter?.toString() || '60')
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: status.retryAfter
        })
      }

      next()
    }
  }

  /**
   * Create rate limit headers object
   */
  static createHeaders(status: RateLimitStatus): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': status.limit.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.reset.toISOString()
    }

    if (status.retryAfter) {
      headers['Retry-After'] = status.retryAfter.toString()
    }

    return headers
  }

  /**
   * Parse rate limit headers
   */
  static parseHeaders(headers: Record<string, string>): Partial<RateLimitStatus> {
    const status: Partial<RateLimitStatus> = {}

    if (headers['x-ratelimit-limit']) {
      status.limit = parseInt(headers['x-ratelimit-limit'], 10)
    }

    if (headers['x-ratelimit-remaining']) {
      status.remaining = parseInt(headers['x-ratelimit-remaining'], 10)
    }

    if (headers['x-ratelimit-reset']) {
      status.reset = new Date(headers['x-ratelimit-reset'])
    }

    if (headers['retry-after']) {
      status.retryAfter = parseInt(headers['retry-after'], 10)
    }

    return status
  }
}

// Export singleton instance with default config
export const defaultRateLimiter = new MCPRateLimiter({
  enabled: true,
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  maxBurst: 20,
  limitBy: 'ip'
})