import React, { useRef, useEffect, useState } from 'react'
import { L0ExternalConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * API authentication methods
 */
type AuthMethod = 'none' | 'api-key' | 'bearer' | 'oauth2' | 'basic'

/**
 * API request configuration
 */
interface APIRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  timeout?: number
}

/**
 * API response with metadata
 */
interface APIResponse<T = any> {
  data: T
  status: number
  headers: Record<string, string>
  latency: number
  cached: boolean
  timestamp: number
}

/**
 * Rate limit state
 */
interface RateLimitState {
  remaining: number
  limit: number
  reset: number
  retryAfter?: number
}

/**
 * API service state
 */
interface APIServiceState {
  baseUrl: string
  authConfigured: boolean
  rateLimits: RateLimitState
  cache: {
    hits: number
    misses: number
    size: number
  }
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageLatency: number
  }
}

/**
 * Cache entry
 */
interface CacheEntry {
  key: string
  response: APIResponse
  expiresAt: number
}

/**
 * L0 API Service Primitive
 * External API wrapper with authentication, rate limiting, caching, and retry logic
 */
export class APIServicePrimitive extends L0ExternalConstruct {
  private cache: Map<string, CacheEntry> = new Map()
  private retryQueue: Array<() => Promise<any>> = []
  private latencies: number[] = []
  
  private state: APIServiceState = {
    baseUrl: '',
    authConfigured: false,
    rateLimits: {
      remaining: -1,
      limit: -1,
      reset: 0
    },
    cache: {
      hits: 0,
      misses: 0,
      size: 0
    },
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0
    }
  }
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-api-service-primitive',
    name: 'API Service Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Pattern,
    description: 'External API wrapper supporting REST/GraphQL with auth, rate limiting, and caching',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'integration', 'api'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['api', 'rest', 'graphql', 'primitive', 'http'],
    inputs: [
      {
        name: 'baseUrl',
        type: 'string',
        description: 'Base URL for the API',
        required: true,
        validation: {
          pattern: '^https?://.*'
        }
      },
      {
        name: 'authMethod',
        type: 'string',
        description: 'Authentication method',
        required: false,
        defaultValue: 'none',
        validation: {
          enum: ['none', 'api-key', 'bearer', 'oauth2', 'basic']
        }
      },
      {
        name: 'authConfig',
        type: 'object',
        description: 'Authentication configuration',
        required: false,
        defaultValue: {}
      },
      {
        name: 'cacheConfig',
        type: 'object',
        description: 'Cache configuration',
        required: false,
        defaultValue: {
          enabled: true,
          ttl: 300, // 5 minutes
          maxSize: 100 // entries
        }
      },
      {
        name: 'retryConfig',
        type: 'object',
        description: 'Retry configuration',
        required: false,
        defaultValue: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        }
      }
    ],
    outputs: [
      {
        name: 'client',
        type: 'object',
        description: 'API client for making requests'
      },
      {
        name: 'state',
        type: 'object',
        description: 'Current API service state'
      },
      {
        name: 'rateLimits',
        type: 'object',
        description: 'Current rate limit status'
      }
    ],
    security: [
      {
        aspect: 'authentication',
        description: 'Supports multiple authentication methods',
        severity: 'high',
        recommendations: [
          'Use HTTPS for all API calls',
          'Store credentials securely',
          'Rotate API keys regularly',
          'Implement token refresh for OAuth2'
        ]
      },
      {
        aspect: 'rate-limiting',
        description: 'Respects API rate limits',
        severity: 'medium',
        recommendations: [
          'Monitor rate limit headers',
          'Implement backoff strategies',
          'Queue requests when rate limited'
        ]
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'api-calls',
          unit: '1000 calls',
          costPerUnit: 0.01,
          typicalUsage: 100
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'HTTP Client'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Make API requests with authentication',
        code: `const api = new APIServicePrimitive()
await api.initialize({
  baseUrl: 'https://api.example.com',
  authMethod: 'bearer',
  authConfig: {
    token: 'your-bearer-token'
  }
})

const client = api.getOutput('client')
const response = await client.get('/users')
console.log(response.data)`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always use HTTPS in production',
      'Implement proper error handling',
      'Cache responses when appropriate',
      'Monitor API usage and costs',
      'Implement circuit breakers for resilience'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 45,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(APIServicePrimitive.definition)
  }

  /**
   * Parse external resource definition
   */
  parseDefinition(input: string | object): any {
    if (typeof input === 'string') {
      try {
        const url = new URL(input)
        return { baseUrl: url.origin }
      } catch {
        return { baseUrl: input }
      }
    }
    return input
  }

  /**
   * Validate external resource configuration
   */
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    
    if (!config.baseUrl) {
      errors.push('Base URL is required')
    } else {
      try {
        new URL(config.baseUrl)
      } catch {
        errors.push('Invalid base URL')
      }
    }
    
    if (config.authMethod && config.authMethod !== 'none') {
      if (!config.authConfig) {
        errors.push(`Authentication config required for ${config.authMethod}`)
      } else {
        switch (config.authMethod) {
          case 'api-key':
            if (!config.authConfig.apiKey || !config.authConfig.headerName) {
              errors.push('API key and header name required')
            }
            break
          case 'bearer':
            if (!config.authConfig.token) {
              errors.push('Bearer token required')
            }
            break
          case 'basic':
            if (!config.authConfig.username || !config.authConfig.password) {
              errors.push('Username and password required')
            }
            break
          case 'oauth2':
            if (!config.authConfig.accessToken) {
              errors.push('OAuth2 access token required')
            }
            break
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Get the external resource configuration
   */
  getConfiguration(): any {
    return {
      api: {
        baseUrl: this.state.baseUrl,
        authMethod: this.getInput<AuthMethod>('authMethod') || 'none'
      },
      cache: this.getInput<any>('cacheConfig'),
      retry: this.getInput<any>('retryConfig'),
      state: this.state
    }
  }

  /**
   * Build authentication headers
   */
  private buildAuthHeaders(): Record<string, string> {
    const authMethod = this.getInput<AuthMethod>('authMethod') || 'none'
    const authConfig = this.getInput<any>('authConfig') || {}
    const headers: Record<string, string> = {}
    
    switch (authMethod) {
      case 'api-key':
        headers[authConfig.headerName || 'X-API-Key'] = authConfig.apiKey
        break
      case 'bearer':
        headers['Authorization'] = `Bearer ${authConfig.token}`
        break
      case 'basic': {
        const credentials = btoa(`${authConfig.username}:${authConfig.password}`)
        headers['Authorization'] = `Basic ${credentials}`
        break
      }
      case 'oauth2':
        headers['Authorization'] = `Bearer ${authConfig.accessToken}`
        break
    }
    
    return headers
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(config: APIRequestConfig): string {
    const params = config.params ? JSON.stringify(config.params) : ''
    return `${config.method}:${config.endpoint}:${params}`
  }

  /**
   * Get cached response if available
   */
  private getCachedResponse(key: string): APIResponse | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    this.state.cache.hits++
    return { ...entry.response, cached: true }
  }

  /**
   * Cache response
   */
  private cacheResponse(key: string, response: APIResponse): void {
    const cacheConfig = this.getInput<any>('cacheConfig') || {}
    if (!cacheConfig.enabled) return
    
    const ttl = (cacheConfig.ttl || 300) * 1000 // Convert to ms
    this.cache.set(key, {
      key,
      response,
      expiresAt: Date.now() + ttl
    })
    
    // Enforce max size
    const maxSize = cacheConfig.maxSize || 100
    if (this.cache.size > maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    this.state.cache.size = this.cache.size
  }

  /**
   * Update rate limit state from headers
   */
  private updateRateLimits(headers: Record<string, string>): void {
    const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining']
    const limit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit']
    const reset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset']
    const retryAfter = headers['retry-after']
    
    if (remaining) this.state.rateLimits.remaining = parseInt(remaining)
    if (limit) this.state.rateLimits.limit = parseInt(limit)
    if (reset) this.state.rateLimits.reset = parseInt(reset)
    if (retryAfter) this.state.rateLimits.retryAfter = parseInt(retryAfter)
    
    this.setOutput('rateLimits', this.state.rateLimits)
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest(config: APIRequestConfig): Promise<APIResponse> {
    const retryConfig = this.getInput<any>('retryConfig') || {}
    const maxRetries = retryConfig.maxRetries || 3
    const backoffMultiplier = retryConfig.backoffMultiplier || 2
    const initialDelay = retryConfig.initialDelay || 1000
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now()
        
        const response = await fetch(`${this.state.baseUrl}${config.endpoint}`, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            ...this.buildAuthHeaders(),
            ...config.headers
          },
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: AbortSignal.timeout(config.timeout || 30000)
        })
        
        const latency = Date.now() - startTime
        this.latencies.push(latency)
        if (this.latencies.length > 100) this.latencies.shift()
        
        const data = await response.json().catch(() => response.text())
        
        const apiResponse: APIResponse = {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          latency,
          cached: false,
          timestamp: Date.now()
        }
        
        this.updateRateLimits(apiResponse.headers)
        
        if (response.ok) {
          this.state.metrics.successfulRequests++
          this.updateMetrics()
          return apiResponse
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60')
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          continue
        }
        
        // Handle server errors with retry
        if (response.status >= 500 && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText}`)
        
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }
    
    this.state.metrics.failedRequests++
    this.updateMetrics()
    throw lastError || new Error('Request failed after retries')
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.state.metrics.totalRequests = 
      this.state.metrics.successfulRequests + this.state.metrics.failedRequests
    
    if (this.latencies.length > 0) {
      this.state.metrics.averageLatency = 
        this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
    }
    
    this.setOutput('state', this.state)
  }

  /**
   * Create API client
   */
  private createClient() {
    const makeRequestWithCache = async (config: APIRequestConfig): Promise<APIResponse> => {
      // Check cache for GET requests
      if (config.method === 'GET') {
        const cacheKey = this.getCacheKey(config)
        const cached = this.getCachedResponse(cacheKey)
        if (cached) return cached
        
        this.state.cache.misses++
      }
      
      const response = await this.makeRequest(config)
      
      // Cache successful GET responses
      if (config.method === 'GET' && response.status === 200) {
        const cacheKey = this.getCacheKey(config)
        this.cacheResponse(cacheKey, response)
      }
      
      return response
    }
    
    return {
      get: (endpoint: string, params?: any) => 
        makeRequestWithCache({ method: 'GET', endpoint, params }),
      
      post: (endpoint: string, body?: any) => 
        makeRequestWithCache({ method: 'POST', endpoint, body }),
      
      put: (endpoint: string, body?: any) => 
        makeRequestWithCache({ method: 'PUT', endpoint, body }),
      
      patch: (endpoint: string, body?: any) => 
        makeRequestWithCache({ method: 'PATCH', endpoint, body }),
      
      delete: (endpoint: string) => 
        makeRequestWithCache({ method: 'DELETE', endpoint }),
      
      request: (config: APIRequestConfig) => 
        makeRequestWithCache(config),
      
      clearCache: () => {
        this.cache.clear()
        this.state.cache.size = 0
      },
      
      getState: () => this.state,
      
      getRateLimits: () => this.state.rateLimits
    }
  }

  /**
   * Initialize the API service
   */
  protected async onInitialize(): Promise<void> {
    this.state.baseUrl = this.getInput<string>('baseUrl') || ''
    this.state.authConfigured = (this.getInput<AuthMethod>('authMethod') || 'none') !== 'none'
    
    const client = this.createClient()
    this.setOutput('client', client)
    this.setOutput('state', this.state)
    this.setOutput('rateLimits', this.state.rateLimits)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <APIServicePrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the API service primitive
 */
const APIServicePrimitiveComponent: React.FC<{ construct: APIServicePrimitive }> = ({ construct }) => {
  const [state, setState] = useState<APIServiceState>({
    baseUrl: '',
    authConfigured: false,
    rateLimits: { remaining: -1, limit: -1, reset: 0 },
    cache: { hits: 0, misses: 0, size: 0 },
    metrics: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0 }
  })

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const currentState = construct['getOutput']('state')
      if (currentState) setState(currentState)
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [construct])

  const cacheHitRate = state.cache.hits + state.cache.misses > 0
    ? ((state.cache.hits / (state.cache.hits + state.cache.misses)) * 100).toFixed(1)
    : '0.0'

  const successRate = state.metrics.totalRequests > 0
    ? ((state.metrics.successfulRequests / state.metrics.totalRequests) * 100).toFixed(1)
    : '100.0'

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '4px', 
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>API Service Status</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Base URL:</strong> {state.baseUrl}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Auth:</strong> {state.authConfigured ? 'Configured' : 'None'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Requests:</strong> {state.metrics.totalRequests} total 
        ({state.metrics.successfulRequests} successful, {state.metrics.failedRequests} failed)
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Success Rate:</strong> {successRate}%
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Avg Latency:</strong> {state.metrics.averageLatency.toFixed(2)}ms
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Cache:</strong> {state.cache.hits} hits, {state.cache.misses} misses 
        ({cacheHitRate}% hit rate)
      </div>
      
      {state.rateLimits.limit > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Rate Limit:</strong> {state.rateLimits.remaining}/{state.rateLimits.limit}
          {state.rateLimits.reset > 0 && (
            <span> (resets at {new Date(state.rateLimits.reset * 1000).toLocaleTimeString()})</span>
          )}
        </div>
      )}
    </div>
  )
}

// Export factory function
export const createAPIServicePrimitive = () => new APIServicePrimitive()

// Export definition for catalog registration
export const apiServicePrimitiveDefinition = APIServicePrimitive.definition