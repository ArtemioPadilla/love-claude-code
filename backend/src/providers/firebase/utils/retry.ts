import { logger } from '../../aws/utils/logger.js'
import { getRetryConfig } from './config.js'
import { FirebaseConfig } from '../types.js'

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error) => void
}

export async function withFirebaseRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3
  const baseDelay = options.retryDelay ?? 1000
  const retryableErrors = options.retryableErrors ?? [
    'UNAVAILABLE',
    'DEADLINE_EXCEEDED',
    'RESOURCE_EXHAUSTED',
    'INTERNAL'
  ]
  
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some(code => 
        error.code === code || 
        error.message?.includes(code) ||
        error.details?.includes(code)
      )
      
      if (!isRetryable || attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      
      logger.warn('Firebase operation failed, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error.message
      })
      
      if (options.onRetry) {
        options.onRetry(attempt + 1, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

export class FirebaseCircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      if (this.failures >= this.threshold) {
        this.state = 'open'
        logger.error('Circuit breaker opened', {
          failures: this.failures,
          threshold: this.threshold
        })
        
        // Schedule reset
        setTimeout(() => {
          this.state = 'half-open'
          logger.info('Circuit breaker moved to half-open')
        }, this.resetTimeout)
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
  }
}

// Retry decorator for Firebase operations
export function retryableFirebase(options: RetryOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      return withFirebaseRetry(
        () => originalMethod.apply(this, args),
        options
      )
    }
    
    return descriptor
  }
}

// Circuit breaker decorator
export function circuitBreaker(threshold = 5, timeout = 60000) {
  const breakers = new Map<string, FirebaseCircuitBreaker>()
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor
    }
    
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}`
      
      if (!breakers.has(key)) {
        breakers.set(key, new FirebaseCircuitBreaker(threshold, timeout))
      }
      
      const breaker = breakers.get(key)!
      return breaker.execute(() => originalMethod.apply(this, args))
    }
    
    return descriptor
  }
}