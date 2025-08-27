/**
 * Rate Limited RPC L1 Infrastructure Construct
 * 
 * RPC service with token bucket rate limiting, per-user/per-IP tracking,
 * burst handling, and comprehensive rate limit headers.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { L1MCPConstruct } from '../../../base/L1MCPConstruct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel
} from '../../../types'

// Import L0 primitive
import { RPCPrimitive, RPCPrimitiveOutput, RPCRequest, RPCResponse } from '../../../L0/infrastructure/mcp/RPCPrimitive'

// Token bucket implementation
interface TokenBucket {
  tokens: number
  lastRefill: number
  capacity: number
  refillRate: number
}

// Rate limit configuration
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
  keyExtractor?: (request: RPCRequest) => string
  /** Skip successful requests */
  skipSuccessful?: boolean
  /** Skip failed requests */
  skipFailed?: boolean
  /** Include rate limit headers */
  includeHeaders?: boolean
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

export interface RateLimitMetrics {
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  uniqueClients: number
  averageTokensUsed: number
}

export interface RateLimitedRPCProps {
  endpoint: string
  rateLimitConfig: RateLimitConfig
  onRateLimitExceeded?: (key: string, status: RateLimitStatus) => void
  onRequest?: (request: RPCRequest) => void
  onResponse?: (response: RPCResponse) => void
  onError?: (error: any) => void
  timeout?: number
  maxRetries?: number
  headers?: Record<string, string>
}

export interface RateLimitedRPCOutput extends RPCPrimitiveOutput {
  /** Get rate limit status for a key */
  getRateLimitStatus: (key: string) => RateLimitStatus
  /** Reset rate limit for a key */
  resetRateLimit: (key: string) => void
  /** Get rate limit metrics */
  getMetrics: () => RateLimitMetrics
  /** Clear all rate limits */
  clearAllLimits: () => void
}

/**
 * Rate Limited RPC Component
 */
export const RateLimitedRPC: React.FC<RateLimitedRPCProps> = ({
  endpoint,
  rateLimitConfig,
  onRateLimitExceeded,
  onRequest,
  onResponse,
  onError,
  timeout = 30000,
  maxRetries = 3,
  headers = {}
}) => {
  // L0 primitive ref
  const rpcRef = useRef<RPCPrimitiveOutput | null>(null)

  // Token buckets for rate limiting
  const tokenBuckets = useRef<Map<string, TokenBucket>>(new Map())

  // Rate limit metrics
  const [metrics, setMetrics] = useState<RateLimitMetrics>({
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    uniqueClients: 0,
    averageTokensUsed: 0
  })

  // Extract rate limit key from request
  const extractKey = useCallback((request: RPCRequest): string => {
    if (rateLimitConfig.keyExtractor) {
      return rateLimitConfig.keyExtractor(request)
    }

    switch (rateLimitConfig.limitBy) {
      case 'ip':
        return request.headers?.['x-forwarded-for'] || 
               request.headers?.['x-real-ip'] || 
               'unknown-ip'
      case 'user':
        return request.headers?.['x-user-id'] || 
               request.params?.userId || 
               'anonymous'
      case 'apiKey':
        return request.headers?.['x-api-key'] || 
               request.headers?.['authorization'] || 
               'no-key'
      default:
        return 'default'
    }
  }, [rateLimitConfig])

  // Get or create token bucket
  const getTokenBucket = useCallback((key: string): TokenBucket => {
    let bucket = tokenBuckets.current.get(key)
    
    if (!bucket) {
      const capacity = rateLimitConfig.maxBurst || rateLimitConfig.maxRequests
      bucket = {
        tokens: capacity,
        lastRefill: Date.now(),
        capacity,
        refillRate: rateLimitConfig.refillRate || 
                   (rateLimitConfig.maxRequests / (rateLimitConfig.windowMs / 1000))
      }
      tokenBuckets.current.set(key, bucket)
      
      // Update unique clients metric
      setMetrics(prev => ({ ...prev, uniqueClients: tokenBuckets.current.size }))
    }
    
    return bucket
  }, [rateLimitConfig])

  // Refill tokens based on elapsed time
  const refillTokens = useCallback((bucket: TokenBucket): void => {
    const now = Date.now()
    const elapsed = (now - bucket.lastRefill) / 1000 // seconds
    const tokensToAdd = elapsed * bucket.refillRate
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }, [])

  // Check rate limit
  const checkRateLimit = useCallback((key: string): RateLimitStatus => {
    if (!rateLimitConfig.enabled) {
      return {
        allowed: true,
        limit: -1,
        remaining: -1,
        reset: new Date(Date.now() + rateLimitConfig.windowMs)
      }
    }

    const bucket = getTokenBucket(key)
    refillTokens(bucket)

    const allowed = bucket.tokens >= 1
    const tokensUsed = allowed ? 1 : 0

    if (allowed) {
      bucket.tokens -= tokensUsed
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
      status.retryAfter = Math.ceil((1 - bucket.tokens) / bucket.refillRate)
    }

    // Update metrics
    setMetrics(prev => {
      const totalRequests = prev.totalRequests + 1
      const allowedRequests = prev.allowedRequests + (allowed ? 1 : 0)
      const blockedRequests = prev.blockedRequests + (allowed ? 0 : 1)
      const totalTokensUsed = prev.averageTokensUsed * prev.totalRequests + tokensUsed
      
      return {
        totalRequests,
        allowedRequests,
        blockedRequests,
        uniqueClients: tokenBuckets.current.size,
        averageTokensUsed: totalTokensUsed / totalRequests
      }
    })

    return status
  }, [rateLimitConfig, getTokenBucket, refillTokens])

  // Get rate limit status
  const getRateLimitStatus = useCallback((key: string): RateLimitStatus => {
    const bucket = getTokenBucket(key)
    refillTokens(bucket)

    const reset = new Date(
      bucket.lastRefill + ((bucket.capacity - bucket.tokens) / bucket.refillRate) * 1000
    )

    return {
      allowed: bucket.tokens >= 1,
      limit: bucket.capacity,
      remaining: Math.floor(bucket.tokens),
      reset
    }
  }, [getTokenBucket, refillTokens])

  // Reset rate limit for a key
  const resetRateLimit = useCallback((key: string): void => {
    tokenBuckets.current.delete(key)
    setMetrics(prev => ({ ...prev, uniqueClients: tokenBuckets.current.size }))
  }, [])

  // Clear all rate limits
  const clearAllLimits = useCallback((): void => {
    tokenBuckets.current.clear()
    setMetrics({
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      uniqueClients: 0,
      averageTokensUsed: 0
    })
  }, [])

  // Add rate limit headers to response
  const addRateLimitHeaders = useCallback((response: RPCResponse, status: RateLimitStatus): RPCResponse => {
    if (!rateLimitConfig.includeHeaders) return response

    const headers = {
      'X-RateLimit-Limit': status.limit.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.reset.toISOString(),
      ...(status.retryAfter && { 'Retry-After': status.retryAfter.toString() })
    }

    return {
      ...response,
      headers: { ...response.headers, ...headers }
    }
  }, [rateLimitConfig.includeHeaders])

  // Wrap RPC call with rate limiting
  const wrappedCall = useCallback(async (request: RPCRequest): Promise<RPCResponse> => {
    const key = extractKey(request)
    const status = checkRateLimit(key)

    if (!status.allowed) {
      onRateLimitExceeded?.(key, status)
      
      const errorResponse: RPCResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32000,
          message: 'Rate limit exceeded',
          data: {
            limit: status.limit,
            remaining: status.remaining,
            reset: status.reset.toISOString(),
            retryAfter: status.retryAfter
          }
        }
      }

      return addRateLimitHeaders(errorResponse, status)
    }

    // Make the actual RPC call
    try {
      onRequest?.(request)
      const response = await rpcRef.current!.call(request)
      
      // Check if we should count this against rate limit
      const shouldCount = 
        (response.error && !rateLimitConfig.skipFailed) ||
        (!response.error && !rateLimitConfig.skipSuccessful)

      if (!shouldCount) {
        // Refund the token
        const bucket = getTokenBucket(key)
        bucket.tokens = Math.min(bucket.capacity, bucket.tokens + 1)
      }

      const enhancedResponse = addRateLimitHeaders(response, status)
      onResponse?.(enhancedResponse)
      
      return enhancedResponse
    } catch (error) {
      onError?.(error)
      throw error
    }
  }, [extractKey, checkRateLimit, onRateLimitExceeded, onRequest, onResponse, onError, 
      rateLimitConfig, getTokenBucket, addRateLimitHeaders])

  // Batch call with rate limiting
  const wrappedBatchCall = useCallback(async (requests: RPCRequest[]): Promise<RPCResponse[]> => {
    const results: RPCResponse[] = []
    
    for (const request of requests) {
      try {
        const response = await wrappedCall(request)
        results.push(response)
      } catch (error) {
        // Convert error to RPC response
        results.push({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error'
          }
        })
      }
    }
    
    return results
  }, [wrappedCall])

  // Cleanup token buckets periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const staleThreshold = rateLimitConfig.windowMs * 2
      
      for (const [key, bucket] of tokenBuckets.current.entries()) {
        if (now - bucket.lastRefill > staleThreshold && bucket.tokens >= bucket.capacity) {
          tokenBuckets.current.delete(key)
        }
      }
      
      setMetrics(prev => ({ ...prev, uniqueClients: tokenBuckets.current.size }))
    }, 60000) // Every minute

    return () => clearInterval(cleanupInterval)
  }, [rateLimitConfig.windowMs])

  // Create enhanced output
  const createOutput = useCallback((): RateLimitedRPCOutput => {
    const baseOutput = rpcRef.current!
    
    return {
      ...baseOutput,
      call: wrappedCall,
      batchCall: wrappedBatchCall,
      getRateLimitStatus,
      resetRateLimit,
      getMetrics: () => metrics,
      clearAllLimits
    }
  }, [wrappedCall, wrappedBatchCall, getRateLimitStatus, resetRateLimit, metrics, clearAllLimits])

  return (
    <RPCPrimitive
      config={{
        endpoint,
        timeout,
        maxRetries,
        headers
      }}
      onResponse={response => {
        // Base response handling if needed
      }}
      onError={error => {
        // Base error handling if needed
      }}
      ref={(output: any) => { 
        rpcRef.current = output
        // Expose enhanced output
        if (output) {
          Object.assign(output, createOutput())
        }
      }}
    />
  )
}

// Static construct class for registration
export class RateLimitedRPCConstruct extends L1MCPConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l1-rate-limited-rpc',
    name: 'Rate Limited RPC',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L1,
    description: 'RPC service with token bucket rate limiting and comprehensive tracking',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: [
      'rpc',
      'rate-limiting',
      'token-bucket',
      'burst-handling',
      'per-user-tracking',
      'rate-headers'
    ],
    dependencies: [
      'platform-l0-rpc-primitive'
    ]
  }

  component = RateLimitedRPC

  async initialize(config: RateLimitedRPCProps): Promise<void> {
    // Configure rate limiting
    this.configureRateLimit({
      enabled: config.rateLimitConfig.enabled,
      windowMs: config.rateLimitConfig.windowMs,
      maxRequests: config.rateLimitConfig.maxRequests,
      limitBy: config.rateLimitConfig.limitBy
    })

    // Configure monitoring
    this.configureMonitoring({
      enabled: true,
      metrics: ['throughput', 'latency', 'errors']
    })
  }

  async destroy(): Promise<void> {
    console.log('Destroying Rate Limited RPC')
  }
}

// Export the construct for registration
export const rateLimitedRPC = new RateLimitedRPCConstruct(RateLimitedRPCConstruct.metadata)