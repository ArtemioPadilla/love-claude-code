import { logger } from './logger.js'

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  jitter?: boolean
  retryIf?: (error: any) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 10000,
  jitter: true,
  retryIf: (error) => {
    // Retry on transient errors
    const retryableErrors = [
      'ThrottlingException',
      'TooManyRequestsException',
      'RequestLimitExceeded',
      'ServiceUnavailable',
      'RequestTimeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ]
    
    return retryableErrors.some(errType => 
      error.name === errType || 
      error.code === errType ||
      error.message?.includes(errType)
    )
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions | number
): Promise<T> {
  const opts = typeof options === 'number' 
    ? { ...DEFAULT_OPTIONS, maxRetries: options }
    : { ...DEFAULT_OPTIONS, ...options }
  
  let lastError: any
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === opts.maxRetries || !opts.retryIf(error)) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      let delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      )
      
      // Add jitter to prevent thundering herd
      if (opts.jitter) {
        delay *= 0.5 + Math.random() * 0.5
      }
      
      logger.debug(`Retrying after ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime?: number
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly halfOpenRequests: number = 3
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        this.state = 'half-open'
        this.failures = 0
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      
      if (this.state === 'half-open') {
        this.failures = 0
        this.state = 'closed'
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      if (this.failures >= this.threshold) {
        this.state = 'open'
        logger.warn('Circuit breaker opened', {
          failures: this.failures,
          threshold: this.threshold
        })
      }
      
      throw error
    }
  }
  
  get status() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}