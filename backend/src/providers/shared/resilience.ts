import { logger } from '../aws/utils/logger.js'

export interface RetryConfig {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[] | ((error: any) => boolean)
  onRetry?: (attempt: number, error: Error, delay: number) => void
}

export interface CircuitBreakerConfig {
  failureThreshold?: number
  resetTimeout?: number
  halfOpenRetries?: number
  onOpen?: () => void
  onClose?: () => void
  onHalfOpen?: () => void
}

export interface BulkheadConfig {
  maxConcurrent?: number
  maxQueueSize?: number
  timeout?: number
  onReject?: () => void
}

/**
 * Unified retry mechanism
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors,
    onRetry
  } = config
  
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if error is retryable
      if (retryableErrors) {
        const isRetryable = Array.isArray(retryableErrors)
          ? retryableErrors.some(err => error.code === err || error.message?.includes(err))
          : retryableErrors(error)
        
        if (!isRetryable || attempt === maxRetries) {
          throw error
        }
      } else if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay)
      const jitter = Math.random() * 0.3 * baseDelay // 30% jitter
      const delay = Math.floor(baseDelay + jitter)
      
      if (onRetry) {
        onRetry(attempt + 1, error, delay)
      }
      
      logger.warn('Operation failed, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error.message
      })
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private halfOpenRetries = 0
  private config: Required<CircuitBreakerConfig>
  
  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenRetries: 3,
      onOpen: () => {},
      onClose: () => {},
      onHalfOpen: () => {},
      ...config
    }
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open'
        this.halfOpenRetries = 0
        this.config.onHalfOpen()
        logger.info('Circuit breaker moved to half-open')
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      
      if (this.state === 'half-open') {
        this.halfOpenRetries++
        if (this.halfOpenRetries >= this.config.halfOpenRetries) {
          this.state = 'closed'
          this.failures = 0
          this.config.onClose()
          logger.info('Circuit breaker closed')
        }
      } else if (this.state === 'closed' && this.failures > 0) {
        // Reset failures on success
        this.failures = 0
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      if (this.state === 'half-open') {
        this.state = 'open'
        this.config.onOpen()
        logger.error('Circuit breaker reopened from half-open', {
          failures: this.failures
        })
      } else if (this.failures >= this.config.failureThreshold) {
        this.state = 'open'
        this.config.onOpen()
        logger.error('Circuit breaker opened', {
          failures: this.failures,
          threshold: this.config.failureThreshold
        })
      }
      
      throw error
    }
  }
  
  get status() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null
    }
  }
  
  reset(): void {
    this.state = 'closed'
    this.failures = 0
    this.lastFailureTime = 0
    this.halfOpenRetries = 0
    this.config.onClose()
  }
}

/**
 * Bulkhead implementation for resource isolation
 */
export class Bulkhead {
  private activeRequests = 0
  private queue: Array<{
    resolve: (value: any) => void
    reject: (error: any) => void
    fn: () => Promise<any>
  }> = []
  private config: Required<BulkheadConfig>
  
  constructor(config: BulkheadConfig = {}) {
    this.config = {
      maxConcurrent: 10,
      maxQueueSize: 100,
      timeout: 30000,
      onReject: () => {},
      ...config
    }
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.config.maxConcurrent) {
      if (this.queue.length >= this.config.maxQueueSize) {
        this.config.onReject()
        throw new Error('Bulkhead queue is full')
      }
      
      // Queue the request
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const index = this.queue.findIndex(item => item.resolve === resolve)
          if (index !== -1) {
            this.queue.splice(index, 1)
            reject(new Error('Bulkhead timeout'))
          }
        }, this.config.timeout)
        
        this.queue.push({
          resolve: (value) => {
            clearTimeout(timeoutId)
            resolve(value)
          },
          reject: (error) => {
            clearTimeout(timeoutId)
            reject(error)
          },
          fn
        })
      })
    }
    
    this.activeRequests++
    
    try {
      const result = await fn()
      this.processQueue()
      return result
    } catch (error) {
      this.processQueue()
      throw error
    } finally {
      this.activeRequests--
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.activeRequests >= this.config.maxConcurrent) {
      return
    }
    
    const item = this.queue.shift()
    if (!item) return
    
    this.activeRequests++
    
    try {
      const result = await item.fn()
      item.resolve(result)
    } catch (error) {
      item.reject(error)
    } finally {
      this.activeRequests--
      this.processQueue()
    }
  }
  
  get status() {
    return {
      activeRequests: this.activeRequests,
      queueSize: this.queue.length,
      maxConcurrent: this.config.maxConcurrent,
      maxQueueSize: this.config.maxQueueSize
    }
  }
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  
  constructor(
    private maxTokens: number,
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000 // milliseconds
  ) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }
  
  async acquire(tokens: number = 1): Promise<void> {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return
    }
    
    // Calculate wait time
    const tokensNeeded = tokens - this.tokens
    const waitTime = (tokensNeeded / this.refillRate) * 1000
    
    await new Promise(resolve => setTimeout(resolve, waitTime))
    
    this.refill()
    this.tokens -= tokens
  }
  
  tryAcquire(tokens: number = 1): boolean {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }
  
  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = (timePassed / 1000) * this.refillRate
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
  
  get status() {
    this.refill()
    return {
      tokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      refillRate: this.refillRate
    }
  }
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  ])
}

/**
 * Resilience decorators
 */
export function retryable(config: RetryConfig = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), config)
    }
    
    return descriptor
  }
}

export function circuitBreaker(config: CircuitBreakerConfig = {}) {
  const breakers = new Map<string, CircuitBreaker>()
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}`
      
      if (!breakers.has(key)) {
        breakers.set(key, new CircuitBreaker(config))
      }
      
      const breaker = breakers.get(key)!
      return breaker.execute(() => originalMethod.apply(this, args))
    }
    
    return descriptor
  }
}

export function bulkhead(config: BulkheadConfig = {}) {
  const bulkheads = new Map<string, Bulkhead>()
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}`
      
      if (!bulkheads.has(key)) {
        bulkheads.set(key, new Bulkhead(config))
      }
      
      const bulkhead = bulkheads.get(key)!
      return bulkhead.execute(() => originalMethod.apply(this, args))
    }
    
    return descriptor
  }
}

export function rateLimited(maxTokens: number, refillRate: number) {
  const limiters = new Map<string, RateLimiter>()
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}`
      
      if (!limiters.has(key)) {
        limiters.set(key, new RateLimiter(maxTokens, refillRate))
      }
      
      const limiter = limiters.get(key)!
      await limiter.acquire()
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}