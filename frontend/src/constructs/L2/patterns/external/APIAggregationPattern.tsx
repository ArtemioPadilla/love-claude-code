/**
 * API Aggregation Pattern (L2)
 * 
 * Orchestrates multiple GraphQL and REST APIs with unified schema,
 * caching, and request batching. Provides a single interface to multiple APIs.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  CloudProvider 
} from '../../../types'
import { Box, Text, Badge, Progress, Alert, Button } from '../../../L1/ui/ThemedComponents'

export interface APIEndpoint {
  id: string
  name: string
  type: 'rest' | 'graphql'
  url: string
  headers?: Record<string, string>
  authentication?: {
    type: 'none' | 'apiKey' | 'bearer' | 'oauth2' | 'basic'
    credentials?: any
  }
  rateLimit?: {
    requests: number
    window: number // milliseconds
  }
  timeout?: number
  retries?: number
  priority?: number // Higher priority APIs are tried first
}

export interface GraphQLSchema {
  types: string
  queries: string
  mutations?: string
  subscriptions?: string
}

export interface RESTSchema {
  endpoints: Array<{
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    parameters?: Array<{
      name: string
      type: string
      required?: boolean
      location: 'path' | 'query' | 'body' | 'header'
    }>
    response?: any
  }>
}

export interface DataTransform {
  source: string // API endpoint ID
  target: string // Unified schema field
  transform?: (data: any) => any
}

export interface CachePolicy {
  enabled: boolean
  ttl: number
  invalidateOn?: string[] // Events that invalidate cache
  keyStrategy?: 'url' | 'custom'
  maxSize?: number
}

export interface BatchingConfig {
  enabled: boolean
  maxBatchSize: number
  batchWindow: number // milliseconds
  strategy: 'size' | 'time' | 'both'
}

export interface APIAggregationConfig {
  endpoints: APIEndpoint[]
  unifiedSchema?: {
    graphql?: GraphQLSchema
    rest?: RESTSchema
  }
  transforms?: DataTransform[]
  caching: CachePolicy
  batching: BatchingConfig
  fallback: {
    enabled: boolean
    strategy: 'priority' | 'roundRobin' | 'random'
    retryFailedAPIs: boolean
  }
  monitoring: {
    trackLatency: boolean
    trackErrors: boolean
    trackUsage: boolean
  }
}

export interface APIRequest {
  id?: string
  endpoint?: string // Specific endpoint ID, or auto-select
  query?: string // GraphQL query
  path?: string // REST path
  method?: string
  params?: any
  headers?: Record<string, string>
  priority?: 'low' | 'normal' | 'high'
}

export interface APIResponse {
  success: boolean
  data?: any
  error?: string
  metadata: {
    endpoint: string
    latency: number
    cached: boolean
    timestamp: Date
  }
}

export interface APIMetrics {
  endpoint: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  cacheHitRate: number
  lastError?: string
  lastErrorTime?: Date
}

/**
 * API Aggregation Pattern Implementation
 */
export class APIAggregationPattern extends L2PatternConstruct {
  private static metadata: PlatformConstructDefinition = {
    id: 'platform-l2-api-aggregation-pattern',
    name: 'API Aggregation Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.PATTERN,
    description: 'Pattern for aggregating multiple GraphQL and REST APIs',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'api', 'integration'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['api', 'graphql', 'rest', 'aggregation', 'pattern'],
    dependencies: [
      'platform-l1-graphql-client',
      'platform-l1-rest-client',
      'platform-l1-cache-manager'
    ],
    inputs: [
      {
        name: 'config',
        type: 'APIAggregationConfig',
        description: 'API aggregation configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'unifiedAPI',
        type: 'object',
        description: 'Unified API interface'
      },
      {
        name: 'metrics',
        type: 'Map<string, APIMetrics>',
        description: 'API performance metrics'
      }
    ],
    security: [
      {
        aspect: 'api-keys',
        description: 'Manages multiple API credentials',
        severity: 'high',
        recommendations: [
          'Store API keys securely',
          'Use environment variables',
          'Rotate keys regularly',
          'Implement key encryption'
        ]
      },
      {
        aspect: 'data-leakage',
        description: 'Aggregates data from multiple sources',
        severity: 'medium',
        recommendations: [
          'Validate data transformations',
          'Implement access controls',
          'Audit data flows',
          'Mask sensitive data'
        ]
      }
    ],
    cost: {
      baseMonthly: 20,
      usageFactors: [
        { name: 'apiCallsPerMonth', unitCost: 0.0001 },
        { name: 'cacheStorageGB', unitCost: 0.5 },
        { name: 'dataTransferGB', unitCost: 0.1 }
      ]
    },
    examples: [
      {
        title: 'Aggregate Multiple APIs',
        description: 'Combine data from multiple APIs into unified interface',
        code: `const apiAggregator = new APIAggregationPattern({
  config: {
    endpoints: [
      {
        id: 'users-api',
        name: 'User Service',
        type: 'rest',
        url: 'https://api.users.com',
        authentication: { type: 'bearer', credentials: { token: 'xxx' } },
        priority: 1
      },
      {
        id: 'products-api',
        name: 'Product Service',
        type: 'graphql',
        url: 'https://api.products.com/graphql',
        authentication: { type: 'apiKey', credentials: { key: 'yyy' } },
        priority: 2
      }
    ],
    transforms: [
      {
        source: 'users-api',
        target: 'user',
        transform: (data) => ({
          id: data.user_id,
          name: data.full_name,
          email: data.email_address
        })
      }
    ],
    caching: {
      enabled: true,
      ttl: 300000, // 5 minutes
      invalidateOn: ['user-updated', 'product-updated']
    },
    batching: {
      enabled: true,
      maxBatchSize: 10,
      batchWindow: 100,
      strategy: 'both'
    }
  }
})

// Make unified query
const response = await apiAggregator.query({
  query: \`
    query GetUserWithProducts($userId: ID!) {
      user(id: $userId) {
        id
        name
        products {
          id
          name
          price
        }
      }
    }
  \`,
  variables: { userId: '123' }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Implement proper error handling and fallbacks',
      'Use caching to reduce API calls',
      'Batch requests when possible',
      'Monitor API rate limits',
      'Transform data consistently',
      'Version your unified schema',
      'Document data mappings clearly'
    ],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 90,
      generatedBy: 'Agent 4: External Integration Specialist'
    }
  }

  private config: APIAggregationConfig
  private endpointClients: Map<string, any> = new Map()
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private metrics: Map<string, APIMetrics> = new Map()
  private requestBatch: Array<{
    request: APIRequest
    resolve: (response: APIResponse) => void
    reject: (error: Error) => void
  }> = []
  private batchTimer?: NodeJS.Timer
  private rateLimiters: Map<string, any> = new Map()
  private schemaResolver?: any

  constructor(config: APIAggregationConfig) {
    super(APIAggregationPattern.metadata, { config })
    this.config = config
  }

  async initialize(config: any): Promise<void> {
    await this.beforeCompose()
    await this.composePattern()
    this.configureInteractions()
    await this.afterCompose()
    this.initialized = true
  }

  protected async composePattern(): Promise<void> {
    // Initialize endpoint clients
    for (const endpoint of this.config.endpoints) {
      const client = await this.createEndpointClient(endpoint)
      this.endpointClients.set(endpoint.id, client)
      
      // Initialize metrics
      this.metrics.set(endpoint.id, {
        endpoint: endpoint.id,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        cacheHitRate: 0
      })
      
      // Initialize rate limiter
      if (endpoint.rateLimit) {
        this.rateLimiters.set(endpoint.id, {
          tokens: endpoint.rateLimit.requests,
          lastRefill: Date.now(),
          ...endpoint.rateLimit
        })
      }
    }

    // Initialize schema resolver if unified schema provided
    if (this.config.unifiedSchema) {
      this.schemaResolver = await this.createSchemaResolver()
    }

    // Start batch processor if enabled
    if (this.config.batching.enabled) {
      this.startBatchProcessor()
    }

    // Set up cache invalidation
    if (this.config.caching.enabled && this.config.caching.invalidateOn) {
      for (const event of this.config.caching.invalidateOn) {
        this.on(event, () => this.invalidateCache())
      }
    }
  }

  protected configureInteractions(): void {
    // Monitor performance
    if (this.config.monitoring.trackLatency || this.config.monitoring.trackErrors) {
      this.on('api-called', (data) => {
        const metrics = this.metrics.get(data.endpoint)
        if (metrics) {
          metrics.totalRequests++
          
          if (data.success) {
            metrics.successfulRequests++
          } else {
            metrics.failedRequests++
            if (data.error) {
              metrics.lastError = data.error
              metrics.lastErrorTime = new Date()
            }
          }
          
          // Update average latency
          const prevAvg = metrics.averageLatency
          const count = metrics.totalRequests
          metrics.averageLatency = (prevAvg * (count - 1) + data.latency) / count
          
          // Update cache hit rate
          if (data.cached) {
            const hits = metrics.cacheHitRate * (count - 1) + 1
            metrics.cacheHitRate = hits / count
          } else {
            const hits = metrics.cacheHitRate * (count - 1)
            metrics.cacheHitRate = hits / count
          }
        }
      })
    }

    // Handle fallbacks
    if (this.config.fallback.enabled) {
      this.on('endpoint-failed', async (data) => {
        if (this.config.fallback.retryFailedAPIs) {
          await this.handleEndpointFailure(data.endpoint, data.request)
        }
      })
    }
  }

  /**
   * Create endpoint client
   */
  private async createEndpointClient(endpoint: APIEndpoint): Promise<any> {
    const baseConfig = {
      url: endpoint.url,
      headers: endpoint.headers || {},
      timeout: endpoint.timeout || 30000,
      retries: endpoint.retries || 3
    }

    // Apply authentication
    if (endpoint.authentication && endpoint.authentication.type !== 'none') {
      await this.applyAuthentication(baseConfig, endpoint.authentication)
    }

    // Create appropriate client
    if (endpoint.type === 'graphql') {
      return this.createGraphQLClient(baseConfig)
    } else {
      return this.createRESTClient(baseConfig)
    }
  }

  /**
   * Apply authentication to client config
   */
  private async applyAuthentication(config: any, auth: APIEndpoint['authentication']): Promise<void> {
    switch (auth!.type) {
      case 'apiKey': {
        config.headers['X-API-Key'] = auth!.credentials.key
        break
      }
      case 'bearer': {
        config.headers['Authorization'] = `Bearer ${auth!.credentials.token}`
        break
      }
      case 'basic': {
        const basic = Buffer.from(
          `${auth!.credentials.username}:${auth!.credentials.password}`
        ).toString('base64')
        config.headers['Authorization'] = `Basic ${basic}`
        break
      }
      case 'oauth2': {
        // In real implementation, would handle OAuth flow
        const token = await this.getOAuth2Token(auth!.credentials)
        config.headers['Authorization'] = `Bearer ${token}`
        break
      }
    }
  }

  /**
   * Create GraphQL client
   */
  private createGraphQLClient(config: any): any {
    // Simulated GraphQL client
    return {
      query: async (query: string, variables?: any) => {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          body: JSON.stringify({ query, variables })
        })
        
        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.statusText}`)
        }
        
        const result = await response.json()
        if (result.errors) {
          throw new Error(result.errors[0].message)
        }
        
        return result.data
      }
    }
  }

  /**
   * Create REST client
   */
  private createRESTClient(config: any): any {
    // Simulated REST client
    return {
      request: async (method: string, path: string, data?: any) => {
        const url = `${config.url}${path}`
        const options: RequestInit = {
          method,
          headers: config.headers
        }
        
        if (data) {
          if (method === 'GET') {
            // Add query parameters
            const params = new URLSearchParams(data)
            return fetch(`${url}?${params}`, options)
          } else {
            options.headers['Content-Type'] = 'application/json'
            options.body = JSON.stringify(data)
          }
        }
        
        const response = await fetch(url, options)
        
        if (!response.ok) {
          throw new Error(`REST request failed: ${response.statusText}`)
        }
        
        return response.json()
      }
    }
  }

  /**
   * Create schema resolver
   */
  private async createSchemaResolver(): Promise<any> {
    // In a real implementation, would create GraphQL schema resolver
    // that maps unified schema to individual APIs
    return {
      resolve: async (query: string, variables: any) => {
        // Parse query and determine which APIs to call
        const apis = this.determineRequiredAPIs(query)
        const results = await this.callMultipleAPIs(apis, query, variables)
        return this.mergeResults(results)
      }
    }
  }

  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    const processBatch = () => {
      if (this.requestBatch.length === 0) return
      
      const batch = this.requestBatch.splice(0, this.config.batching.maxBatchSize)
      this.executeBatch(batch)
    }

    // Process based on strategy
    if (this.config.batching.strategy === 'time' || this.config.batching.strategy === 'both') {
      this.batchTimer = setInterval(processBatch, this.config.batching.batchWindow)
    }

    // Check batch size
    if (this.config.batching.strategy === 'size' || this.config.batching.strategy === 'both') {
      this.on('request-added', () => {
        if (this.requestBatch.length >= this.config.batching.maxBatchSize) {
          processBatch()
        }
      })
    }
  }

  /**
   * Execute batch of requests
   */
  private async executeBatch(batch: typeof this.requestBatch): Promise<void> {
    // Group by endpoint
    const grouped = new Map<string, typeof batch>()
    
    for (const item of batch) {
      const endpoint = item.request.endpoint || this.selectEndpoint(item.request)
      if (!grouped.has(endpoint)) {
        grouped.set(endpoint, [])
      }
      grouped.get(endpoint)!.push(item)
    }

    // Execute per endpoint
    for (const [endpoint, requests] of grouped.entries()) {
      try {
        const results = await this.executeBatchForEndpoint(endpoint, requests)
        
        // Resolve individual requests
        for (let i = 0; i < requests.length; i++) {
          requests[i].resolve(results[i])
        }
      } catch (error) {
        // Reject all requests in this batch
        for (const request of requests) {
          request.reject(error)
        }
      }
    }
  }

  /**
   * Execute batch for specific endpoint
   */
  private async executeBatchForEndpoint(
    endpointId: string, 
    batch: typeof this.requestBatch
  ): Promise<APIResponse[]> {
    const endpoint = this.config.endpoints.find(e => e.id === endpointId)
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`)
    }

    const client = this.endpointClients.get(endpointId)
    if (!client) {
      throw new Error(`Client for ${endpointId} not initialized`)
    }

    // For GraphQL, can batch queries
    if (endpoint.type === 'graphql') {
      const queries = batch.map(b => b.request.query || '').filter(q => q)
      if (queries.length > 0) {
        // Combine queries
        const batchQuery = `{ ${queries.join('\n')} }`
        const result = await client.query(batchQuery)
        
        // Split results
        return batch.map((_, i) => ({
          success: true,
          data: result[`query${i}`],
          metadata: {
            endpoint: endpointId,
            latency: 0,
            cached: false,
            timestamp: new Date()
          }
        }))
      }
    }

    // For REST, execute sequentially (could be parallelized)
    const results: APIResponse[] = []
    for (const item of batch) {
      try {
        const result = await this.executeRequest(item.request)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          metadata: {
            endpoint: endpointId,
            latency: 0,
            cached: false,
            timestamp: new Date()
          }
        })
      }
    }

    return results
  }

  /**
   * Get OAuth2 token
   */
  private async getOAuth2Token(credentials: any): Promise<string> {
    // Simplified OAuth2 implementation
    // In reality, would handle full OAuth flow
    return 'mock-oauth-token'
  }

  /**
   * Query unified API
   */
  async query(request: APIRequest): Promise<APIResponse> {
    // Check cache first
    if (this.config.caching.enabled) {
      const cached = this.getFromCache(request)
      if (cached) {
        return cached
      }
    }

    // Add to batch if batching enabled
    if (this.config.batching.enabled) {
      return new Promise((resolve, reject) => {
        this.requestBatch.push({ request, resolve, reject })
        this.emit('request-added', { request })
      })
    }

    // Execute directly
    return this.executeRequest(request)
  }

  /**
   * Execute single request
   */
  private async executeRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now()
    const endpointId = request.endpoint || this.selectEndpoint(request)
    
    try {
      // Check rate limit
      if (!this.checkRateLimit(endpointId)) {
        throw new Error('Rate limit exceeded')
      }

      const endpoint = this.config.endpoints.find(e => e.id === endpointId)
      if (!endpoint) {
        throw new Error(`Endpoint ${endpointId} not found`)
      }

      const client = this.endpointClients.get(endpointId)
      if (!client) {
        throw new Error(`Client for ${endpointId} not initialized`)
      }

      let data: any

      if (endpoint.type === 'graphql' && request.query) {
        data = await client.query(request.query, request.params)
      } else if (endpoint.type === 'rest' && request.path) {
        data = await client.request(
          request.method || 'GET',
          request.path,
          request.params
        )
      } else {
        throw new Error('Invalid request format')
      }

      // Apply transforms
      if (this.config.transforms) {
        data = this.applyTransforms(data, endpointId)
      }

      const response: APIResponse = {
        success: true,
        data,
        metadata: {
          endpoint: endpointId,
          latency: Date.now() - startTime,
          cached: false,
          timestamp: new Date()
        }
      }

      // Cache successful response
      if (this.config.caching.enabled) {
        this.addToCache(request, response)
      }

      // Track metrics
      this.emit('api-called', {
        endpoint: endpointId,
        success: true,
        latency: response.metadata.latency,
        cached: false
      })

      return response

    } catch (error) {
      const response: APIResponse = {
        success: false,
        error: error.message,
        metadata: {
          endpoint: endpointId,
          latency: Date.now() - startTime,
          cached: false,
          timestamp: new Date()
        }
      }

      // Track metrics
      this.emit('api-called', {
        endpoint: endpointId,
        success: false,
        latency: response.metadata.latency,
        error: error.message
      })

      // Handle fallback
      if (this.config.fallback.enabled) {
        this.emit('endpoint-failed', {
          endpoint: endpointId,
          request,
          error: error.message
        })
      }

      throw error
    }
  }

  /**
   * Select endpoint based on request
   */
  private selectEndpoint(request: APIRequest): string {
    // If GraphQL query, prefer GraphQL endpoints
    if (request.query) {
      const graphqlEndpoints = this.config.endpoints
        .filter(e => e.type === 'graphql')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      
      if (graphqlEndpoints.length > 0) {
        return graphqlEndpoints[0].id
      }
    }

    // If REST path, prefer REST endpoints
    if (request.path) {
      const restEndpoints = this.config.endpoints
        .filter(e => e.type === 'rest')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      
      if (restEndpoints.length > 0) {
        return restEndpoints[0].id
      }
    }

    // Fallback to highest priority
    const sorted = [...this.config.endpoints]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    return sorted[0].id
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(endpointId: string): boolean {
    const limiter = this.rateLimiters.get(endpointId)
    if (!limiter) return true

    const now = Date.now()
    const elapsed = now - limiter.lastRefill
    const refillTokens = (elapsed / limiter.window) * limiter.requests
    
    limiter.tokens = Math.min(limiter.requests, limiter.tokens + refillTokens)
    limiter.lastRefill = now

    if (limiter.tokens >= 1) {
      limiter.tokens--
      return true
    }

    return false
  }

  /**
   * Apply data transforms
   */
  private applyTransforms(data: any, endpointId: string): any {
    const transforms = this.config.transforms?.filter(t => t.source === endpointId)
    if (!transforms || transforms.length === 0) return data

    const transformed = { ...data }

    for (const transform of transforms) {
      if (transform.transform) {
        transformed[transform.target] = transform.transform(data)
      } else {
        transformed[transform.target] = data
      }
    }

    return transformed
  }

  /**
   * Get from cache
   */
  private getFromCache(request: APIRequest): APIResponse | null {
    const key = this.getCacheKey(request)
    const cached = this.cache.get(key)
    
    if (cached && (Date.now() - cached.timestamp) < this.config.caching.ttl) {
      return {
        success: true,
        data: cached.data,
        metadata: {
          endpoint: request.endpoint || 'cached',
          latency: 0,
          cached: true,
          timestamp: new Date()
        }
      }
    }

    return null
  }

  /**
   * Add to cache
   */
  private addToCache(request: APIRequest, response: APIResponse): void {
    const key = this.getCacheKey(request)
    this.cache.set(key, {
      data: response.data,
      timestamp: Date.now()
    })

    // Check cache size
    if (this.config.caching.maxSize && this.cache.size > this.config.caching.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, entries.length - this.config.caching.maxSize)
      for (const [key] of toRemove) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache key
   */
  private getCacheKey(request: APIRequest): string {
    if (this.config.caching.keyStrategy === 'custom') {
      return JSON.stringify(request)
    }
    
    // URL-based key
    if (request.query) {
      return `graphql:${request.query}:${JSON.stringify(request.params || {})}`
    } else if (request.path) {
      return `rest:${request.method || 'GET'}:${request.path}:${JSON.stringify(request.params || {})}`
    }
    
    return JSON.stringify(request)
  }

  /**
   * Invalidate cache
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      // Remove matching keys
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Clear all
      this.cache.clear()
    }
    
    this.emit('cache-invalidated', { pattern })
  }

  /**
   * Determine required APIs for query
   */
  private determineRequiredAPIs(query: string): string[] {
    // Simple implementation - in reality would parse GraphQL query
    // and determine which APIs contain required data
    return this.config.endpoints
      .filter(e => e.type === 'graphql')
      .map(e => e.id)
  }

  /**
   * Call multiple APIs
   */
  private async callMultipleAPIs(
    apis: string[], 
    query: string, 
    variables: any
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>()
    
    // Call APIs in parallel
    const promises = apis.map(async (api) => {
      try {
        const response = await this.query({
          endpoint: api,
          query,
          params: variables
        })
        results.set(api, response.data)
      } catch (error) {
        console.error(`Failed to call ${api}:`, error)
        results.set(api, null)
      }
    })
    
    await Promise.all(promises)
    return results
  }

  /**
   * Merge results from multiple APIs
   */
  private mergeResults(results: Map<string, any>): any {
    // Simple merge - in reality would use schema to properly merge
    const merged: any = {}
    
    for (const [api, data] of results.entries()) {
      if (data) {
        Object.assign(merged, data)
      }
    }
    
    return merged
  }

  /**
   * Handle endpoint failure
   */
  private async handleEndpointFailure(
    failedEndpoint: string, 
    request: APIRequest
  ): Promise<void> {
    // Try fallback endpoints
    const otherEndpoints = this.config.endpoints
      .filter(e => e.id !== failedEndpoint)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    for (const endpoint of otherEndpoints) {
      try {
        const newRequest = { ...request, endpoint: endpoint.id }
        await this.executeRequest(newRequest)
        
        console.log(`Fallback to ${endpoint.id} successful`)
        return
      } catch (error) {
        console.error(`Fallback to ${endpoint.id} failed:`, error)
      }
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): Map<string, APIMetrics> {
    return new Map(this.metrics)
  }

  /**
   * Get unified schema
   */
  getUnifiedSchema(): any {
    return this.config.unifiedSchema
  }

  /**
   * Render the pattern UI
   */
  render(): React.ReactElement {
    return <APIAggregationPatternComponent pattern={this} />
  }

  async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
    }
    
    this.cache.clear()
    this.endpointClients.clear()
    this.metrics.clear()
    this.requestBatch = []
    
    await super.destroy()
  }
}

/**
 * React component for API Aggregation Pattern
 */
const APIAggregationPatternComponent: React.FC<{ pattern: APIAggregationPattern }> = ({ pattern }) => {
  const [metrics, setMetrics] = useState<Map<string, APIMetrics>>(new Map())
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [testQuery, setTestQuery] = useState(`{
  user(id: "123") {
    id
    name
    email
  }
}`)

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(pattern.getMetrics())
    }

    pattern.on('api-called', updateMetrics)
    updateMetrics()

    return () => {
      pattern.off('api-called', updateMetrics)
    }
  }, [pattern])

  const handleTestQuery = async () => {
    setQueryError(null)
    setQueryResult(null)

    try {
      const response = await pattern.query({
        query: testQuery
      })
      setQueryResult(response)
    } catch (error) {
      setQueryError(error.message)
    }
  }

  const handleInvalidateCache = () => {
    pattern.invalidateCache()
  }

  return (
    <Box className="api-aggregation-pattern p-6">
      <Text variant="h3" className="mb-4">API Aggregation</Text>

      {/* API Endpoints */}
      <Box className="mb-6">
        <Text variant="h4" className="mb-3">Connected APIs</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(metrics.entries()).map(([id, metric]) => {
            const endpoint = pattern['config'].endpoints.find(e => e.id === id)
            if (!endpoint) return null

            const successRate = metric.totalRequests > 0
              ? (metric.successfulRequests / metric.totalRequests * 100).toFixed(1)
              : '0'

            return (
              <Box key={id} className="p-4 border rounded-lg">
                <div className="mb-3">
                  <Text variant="body1" className="font-medium">{endpoint.name}</Text>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={endpoint.type === 'graphql' ? 'primary' : 'secondary'}>
                      {endpoint.type.toUpperCase()}
                    </Badge>
                    <Text variant="caption" className="text-gray-600">
                      {endpoint.url}
                    </Text>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Text variant="caption" className="text-gray-500">Total Requests</Text>
                    <Text variant="body2">{metric.totalRequests}</Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Success Rate</Text>
                    <Text variant="body2" className={
                      parseFloat(successRate) >= 90 ? 'text-green-600' : 
                      parseFloat(successRate) >= 70 ? 'text-yellow-600' : 
                      'text-red-600'
                    }>
                      {successRate}%
                    </Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Avg Latency</Text>
                    <Text variant="body2">{Math.round(metric.averageLatency)}ms</Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Cache Hit Rate</Text>
                    <Text variant="body2">{(metric.cacheHitRate * 100).toFixed(1)}%</Text>
                  </div>
                </div>

                {metric.lastError && (
                  <Alert variant="error" className="mt-3">
                    <Text variant="caption">Last Error: {metric.lastError}</Text>
                    {metric.lastErrorTime && (
                      <Text variant="caption" className="text-xs">
                        {new Date(metric.lastErrorTime).toLocaleTimeString()}
                      </Text>
                    )}
                  </Alert>
                )}
              </Box>
            )
          })}
        </div>
      </Box>

      {/* Query Tester */}
      <Box className="mb-6 p-4 border rounded-lg">
        <Text variant="h4" className="mb-3">Test Query</Text>
        <textarea
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          className="w-full h-32 p-2 border rounded font-mono text-sm"
          placeholder="Enter GraphQL query..."
        />
        <div className="mt-3 flex gap-2">
          <Button onClick={handleTestQuery}>Execute Query</Button>
          <Button variant="secondary" onClick={handleInvalidateCache}>
            Clear Cache
          </Button>
        </div>

        {/* Query Result */}
        {queryResult && (
          <Box className="mt-4 p-3 bg-gray-50 rounded">
            <Text variant="caption" className="text-gray-600 mb-1">
              Response from: {queryResult.metadata.endpoint} 
              ({queryResult.metadata.latency}ms)
              {queryResult.metadata.cached && ' [CACHED]'}
            </Text>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(queryResult.data, null, 2)}
            </pre>
          </Box>
        )}

        {/* Query Error */}
        {queryError && (
          <Alert variant="error" className="mt-4">
            {queryError}
          </Alert>
        )}
      </Box>

      {/* Cache Status */}
      <Box className="p-4 bg-gray-50 rounded-lg">
        <Text variant="h4" className="mb-2">Cache Status</Text>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Text variant="caption" className="text-gray-500">Cache Size</Text>
            <Text variant="body2">{pattern['cache'].size} items</Text>
          </div>
          <div>
            <Text variant="caption" className="text-gray-500">TTL</Text>
            <Text variant="body2">{pattern['config'].caching.ttl / 1000}s</Text>
          </div>
          <div>
            <Text variant="caption" className="text-gray-500">Strategy</Text>
            <Text variant="body2">{pattern['config'].caching.keyStrategy || 'url'}</Text>
          </div>
        </div>
      </Box>
    </Box>
  )
}

// Export component separately
export const APIAggregationPatternComponent = APIAggregationPattern