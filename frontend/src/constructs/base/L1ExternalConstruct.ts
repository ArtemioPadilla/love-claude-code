/**
 * Base class for L1 External constructs
 * Provides common functionality for external service integrations
 */

import { L1InfrastructureConstruct } from './L1Construct'
import { ConstructDefinition } from '../types'

export interface ExternalServiceConfig {
  /** Service name */
  name: string
  /** Service version */
  version?: string
  /** Service endpoint/URL */
  endpoint?: string
  /** Connection timeout in milliseconds */
  connectionTimeout?: number
  /** Request timeout in milliseconds */
  requestTimeout?: number
  /** Retry configuration */
  retry?: {
    maxAttempts: number
    backoffMultiplier?: number
    maxBackoffMs?: number
  }
}

export interface ExternalAuthConfig {
  /** Authentication type */
  type: 'none' | 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'custom'
  /** API key for apiKey auth */
  apiKey?: string
  /** Bearer token for bearer auth */
  bearerToken?: string
  /** Username for basic auth */
  username?: string
  /** Password for basic auth */
  password?: string
  /** OAuth2 configuration */
  oauth2?: {
    clientId: string
    clientSecret?: string
    tokenUrl: string
    scopes?: string[]
  }
  /** Custom auth handler */
  customAuth?: (request: any) => Promise<void>
}

export interface ExternalConnectionState {
  /** Connection status */
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  /** Last connection attempt */
  lastAttempt?: Date
  /** Last successful connection */
  lastConnected?: Date
  /** Connection error if any */
  error?: Error
  /** Number of retry attempts */
  retryCount: number
}

/**
 * Base class for L1 External constructs
 */
export abstract class L1ExternalConstruct extends L1InfrastructureConstruct {
  protected serviceConfig: ExternalServiceConfig
  protected authConfig: ExternalAuthConfig
  protected connectionState: ExternalConnectionState = {
    status: 'disconnected',
    retryCount: 0
  }
  
  // Connection lifecycle hooks
  protected onConnect?: () => Promise<void>
  protected onDisconnect?: () => Promise<void>
  protected onError?: (error: Error) => void
  
  constructor(definition: ConstructDefinition) {
    super(definition)
    
    // Initialize with default configs
    this.serviceConfig = {
      name: 'external-service',
      connectionTimeout: 30000,
      requestTimeout: 60000,
      retry: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 30000
      }
    }
    
    this.authConfig = {
      type: 'none'
    }
  }
  
  /**
   * Configure the external service
   */
  configureService(config: Partial<ExternalServiceConfig>): void {
    this.serviceConfig = { ...this.serviceConfig, ...config }
  }
  
  /**
   * Configure authentication
   */
  configureAuth(config: ExternalAuthConfig): void {
    this.authConfig = config
  }
  
  /**
   * Connect to the external service
   */
  async connect(): Promise<void> {
    if (this.connectionState.status === 'connected') {
      return
    }
    
    this.connectionState.status = 'connecting'
    this.connectionState.lastAttempt = new Date()
    
    try {
      // Perform connection with retry logic
      await this.performConnect()
      
      this.connectionState.status = 'connected'
      this.connectionState.lastConnected = new Date()
      this.connectionState.retryCount = 0
      
      // Call lifecycle hook
      if (this.onConnect) {
        await this.onConnect()
      }
      
      this.emit('connected', {
        service: this.serviceConfig.name,
        timestamp: new Date()
      })
    } catch (error) {
      this.connectionState.status = 'error'
      this.connectionState.error = error as Error
      
      // Call error hook
      if (this.onError) {
        this.onError(error as Error)
      }
      
      this.emit('connection-error', {
        service: this.serviceConfig.name,
        error: error,
        timestamp: new Date()
      })
      
      // Retry if configured
      if (this.shouldRetry()) {
        await this.retryConnection()
      } else {
        throw error
      }
    }
  }
  
  /**
   * Disconnect from the external service
   */
  async disconnect(): Promise<void> {
    if (this.connectionState.status !== 'connected') {
      return
    }
    
    try {
      await this.performDisconnect()
      
      this.connectionState.status = 'disconnected'
      
      // Call lifecycle hook
      if (this.onDisconnect) {
        await this.onDisconnect()
      }
      
      this.emit('disconnected', {
        service: this.serviceConfig.name,
        timestamp: new Date()
      })
    } catch (error) {
      this.emit('disconnect-error', {
        service: this.serviceConfig.name,
        error: error,
        timestamp: new Date()
      })
      throw error
    }
  }
  
  /**
   * Get connection state
   */
  getConnectionState(): ExternalConnectionState {
    return { ...this.connectionState }
  }
  
  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    return this.connectionState.status === 'connected'
  }
  
  /**
   * Perform the actual connection - must be implemented by subclasses
   */
  protected abstract performConnect(): Promise<void>
  
  /**
   * Perform the actual disconnection - must be implemented by subclasses
   */
  protected abstract performDisconnect(): Promise<void>
  
  /**
   * Apply authentication to a request
   */
  protected async applyAuth(request: any): Promise<void> {
    switch (this.authConfig.type) {
      case 'none':
        break
        
      case 'apiKey':
        if (this.authConfig.apiKey) {
          request.headers = request.headers || {}
          request.headers['X-API-Key'] = this.authConfig.apiKey
        }
        break
        
      case 'bearer':
        if (this.authConfig.bearerToken) {
          request.headers = request.headers || {}
          request.headers['Authorization'] = `Bearer ${this.authConfig.bearerToken}`
        }
        break
        
      case 'basic':
        if (this.authConfig.username && this.authConfig.password) {
          const auth = Buffer.from(`${this.authConfig.username}:${this.authConfig.password}`).toString('base64')
          request.headers = request.headers || {}
          request.headers['Authorization'] = `Basic ${auth}`
        }
        break
        
      case 'oauth2':
        // OAuth2 would require token management
        // This is a simplified version
        if (this.authConfig.oauth2) {
          const token = await this.getOAuth2Token()
          request.headers = request.headers || {}
          request.headers['Authorization'] = `Bearer ${token}`
        }
        break
        
      case 'custom':
        if (this.authConfig.customAuth) {
          await this.authConfig.customAuth(request)
        }
        break
    }
  }
  
  /**
   * Check if retry should be attempted
   */
  private shouldRetry(): boolean {
    const { retry } = this.serviceConfig
    return retry ? this.connectionState.retryCount < retry.maxAttempts : false
  }
  
  /**
   * Retry connection with exponential backoff
   */
  private async retryConnection(): Promise<void> {
    const { retry } = this.serviceConfig
    if (!retry) return
    
    this.connectionState.retryCount++
    
    // Calculate backoff time
    const backoffMs = Math.min(
      Math.pow(retry.backoffMultiplier || 2, this.connectionState.retryCount - 1) * 1000,
      retry.maxBackoffMs || 30000
    )
    
    this.emit('retry-scheduled', {
      service: this.serviceConfig.name,
      attempt: this.connectionState.retryCount,
      backoffMs,
      timestamp: new Date()
    })
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, backoffMs))
    
    // Attempt to connect again
    await this.connect()
  }
  
  /**
   * Get OAuth2 token (simplified)
   */
  private async getOAuth2Token(): Promise<string> {
    // In a real implementation, this would handle token refresh, etc.
    // For now, throw an error indicating OAuth2 needs implementation
    throw new Error('OAuth2 token management not implemented')
  }
  
  /**
   * Health check with external service status
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    const baseHealth = await super.healthCheck()
    
    const serviceHealth = {
      connected: this.isConnected(),
      connectionState: this.connectionState.status,
      lastConnected: this.connectionState.lastConnected,
      retryCount: this.connectionState.retryCount,
      error: this.connectionState.error?.message
    }
    
    // Determine overall status based on connection
    let status = baseHealth.status
    if (this.connectionState.status === 'error') {
      status = 'unhealthy'
    } else if (this.connectionState.status !== 'connected') {
      status = 'degraded'
    }
    
    return {
      status,
      details: {
        ...baseHealth.details,
        externalService: serviceHealth
      }
    }
  }
  
  /**
   * Get metrics including external service metrics
   */
  async getMetrics(): Promise<Record<string, number>> {
    const baseMetrics = await super.getMetrics()
    
    return {
      ...baseMetrics,
      external_retry_count: this.connectionState.retryCount,
      external_connection_status: this.connectionState.status === 'connected' ? 1 : 0,
      external_last_connected_age_ms: this.connectionState.lastConnected 
        ? Date.now() - this.connectionState.lastConnected.getTime() 
        : -1
    }
  }
  
  /**
   * Get security configuration including external service auth
   */
  getSecurityConfig(): Record<string, any> {
    return {
      ...super.getSecurityConfig(),
      externalService: {
        name: this.serviceConfig.name,
        authType: this.authConfig.type,
        hasAuth: this.authConfig.type !== 'none'
      }
    }
  }
}