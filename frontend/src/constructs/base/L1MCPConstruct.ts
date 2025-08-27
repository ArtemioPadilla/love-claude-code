/**
 * Base class for L1 MCP Infrastructure constructs
 * Provides MCP-specific functionality on top of L1InfrastructureConstruct
 */

import { L1InfrastructureConstruct } from './L1Construct'
import { ConstructDefinition } from '../types'

export interface MCPAuthConfig {
  /** Authentication method */
  method: 'jwt' | 'oauth' | 'apiKey' | 'custom'
  /** Token validation endpoint */
  validationEndpoint?: string
  /** Public key for JWT validation */
  publicKey?: string
  /** OAuth provider configuration */
  oauthConfig?: {
    provider: string
    clientId: string
    clientSecret?: string
    scopes: string[]
  }
  /** API key header name */
  apiKeyHeader?: string
  /** Custom validation function */
  customValidator?: (token: string) => Promise<boolean>
}

export interface MCPRateLimitConfig {
  /** Enable rate limiting */
  enabled: boolean
  /** Rate limit window in milliseconds */
  windowMs: number
  /** Maximum requests per window */
  maxRequests: number
  /** Rate limit by */
  limitBy: 'ip' | 'user' | 'apiKey' | 'custom'
  /** Custom key extractor */
  keyExtractor?: (request: any) => string
  /** Skip successful requests */
  skipSuccessful?: boolean
  /** Skip failed requests */
  skipFailed?: boolean
}

export interface MCPEncryptionConfig {
  /** Enable encryption */
  enabled: boolean
  /** Encryption algorithm */
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305'
  /** Key rotation interval in milliseconds */
  keyRotationInterval?: number
  /** Key derivation function */
  kdf?: 'pbkdf2' | 'scrypt' | 'argon2'
  /** Iterations for KDF */
  iterations?: number
}

export interface MCPMonitoringConfig {
  /** Enable monitoring */
  enabled: boolean
  /** Metrics to collect */
  metrics: Array<'latency' | 'throughput' | 'errors' | 'connections' | 'custom'>
  /** Metrics export interval */
  exportInterval?: number
  /** Custom metrics collector */
  customCollector?: () => Record<string, number>
}

export interface MCPSecurityHeaders {
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'X-XSS-Protection'?: string
  'Strict-Transport-Security'?: string
  'Content-Security-Policy'?: string
  [key: string]: string | undefined
}

/**
 * Base class for L1 MCP constructs
 */
export abstract class L1MCPConstruct extends L1InfrastructureConstruct {
  protected authConfig?: MCPAuthConfig
  protected rateLimitConfig?: MCPRateLimitConfig
  protected encryptionConfig?: MCPEncryptionConfig
  protected monitoringConfig?: MCPMonitoringConfig
  protected securityHeaders: MCPSecurityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }

  constructor(definition: ConstructDefinition) {
    super(definition)
    this.initializeMCPFeatures()
  }

  /**
   * Initialize MCP-specific features
   */
  protected initializeMCPFeatures(): void {
    // Set default configurations
    this.authConfig = {
      method: 'jwt',
      apiKeyHeader: 'X-API-Key'
    }

    this.rateLimitConfig = {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      limitBy: 'ip'
    }

    this.encryptionConfig = {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 86400000, // 24 hours
      kdf: 'pbkdf2',
      iterations: 100000
    }

    this.monitoringConfig = {
      enabled: true,
      metrics: ['latency', 'throughput', 'errors', 'connections'],
      exportInterval: 60000 // 1 minute
    }
  }

  /**
   * Configure authentication
   */
  configureAuth(config: Partial<MCPAuthConfig>): void {
    this.authConfig = { ...this.authConfig, ...config } as MCPAuthConfig
  }

  /**
   * Configure rate limiting
   */
  configureRateLimit(config: Partial<MCPRateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config } as MCPRateLimitConfig
  }

  /**
   * Configure encryption
   */
  configureEncryption(config: Partial<MCPEncryptionConfig>): void {
    this.encryptionConfig = { ...this.encryptionConfig, ...config } as MCPEncryptionConfig
  }

  /**
   * Configure monitoring
   */
  configureMonitoring(config: Partial<MCPMonitoringConfig>): void {
    this.monitoringConfig = { ...this.monitoringConfig, ...config } as MCPMonitoringConfig
  }

  /**
   * Set security headers
   */
  setSecurityHeaders(headers: MCPSecurityHeaders): void {
    this.securityHeaders = { ...this.securityHeaders, ...headers }
  }

  /**
   * Validate authentication token
   */
  async validateAuth(token: string): Promise<boolean> {
    if (!this.authConfig) return false

    switch (this.authConfig.method) {
      case 'jwt':
        return this.validateJWT(token)
      case 'oauth':
        return this.validateOAuth(token)
      case 'apiKey':
        return this.validateAPIKey(token)
      case 'custom':
        return this.authConfig.customValidator ? 
          await this.authConfig.customValidator(token) : false
      default:
        return false
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.rateLimitConfig?.enabled) {
      return { allowed: true, remaining: -1 }
    }

    // This would be implemented with actual rate limiting logic
    // For now, return a mock response
    return { allowed: true, remaining: 50 }
  }

  /**
   * Encrypt data
   */
  async encrypt(data: string): Promise<string> {
    if (!this.encryptionConfig?.enabled) return data

    // This would be implemented with actual encryption
    // For now, return base64 encoded data
    return Buffer.from(data).toString('base64')
  }

  /**
   * Decrypt data
   */
  async decrypt(data: string): Promise<string> {
    if (!this.encryptionConfig?.enabled) return data

    // This would be implemented with actual decryption
    // For now, return base64 decoded data
    return Buffer.from(data, 'base64').toString()
  }

  /**
   * Collect metrics
   */
  async collectMetrics(): Promise<Record<string, number>> {
    const baseMetrics = await super.getMetrics()

    if (!this.monitoringConfig?.enabled) return baseMetrics

    const mcpMetrics: Record<string, number> = {
      ...baseMetrics,
      mcp_auth_validations: 0,
      mcp_rate_limit_hits: 0,
      mcp_encryption_operations: 0,
      mcp_active_connections: 0
    }

    if (this.monitoringConfig.customCollector) {
      const customMetrics = this.monitoringConfig.customCollector()
      Object.assign(mcpMetrics, customMetrics)
    }

    return mcpMetrics
  }

  /**
   * Get security configuration summary
   */
  getSecurityConfig(): Record<string, any> {
    return {
      ...super.getSecurityConfig(),
      mcp: {
        authentication: this.authConfig,
        rateLimit: this.rateLimitConfig,
        encryption: this.encryptionConfig,
        headers: this.securityHeaders
      }
    }
  }

  /**
   * Health check with MCP-specific checks
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    const baseHealth = await super.healthCheck()

    const mcpHealth = {
      auth: this.authConfig?.method ? 'enabled' : 'disabled',
      rateLimit: this.rateLimitConfig?.enabled ? 'enabled' : 'disabled',
      encryption: this.encryptionConfig?.enabled ? 'enabled' : 'disabled',
      monitoring: this.monitoringConfig?.enabled ? 'enabled' : 'disabled'
    }

    return {
      status: baseHealth.status,
      details: {
        ...baseHealth.details,
        mcp: mcpHealth
      }
    }
  }

  // Protected helper methods

  protected async validateJWT(token: string): Promise<boolean> {
    // Mock JWT validation - would use real JWT library
    return token.split('.').length === 3
  }

  protected async validateOAuth(token: string): Promise<boolean> {
    // Mock OAuth validation - would call OAuth provider
    return token.startsWith('Bearer ')
  }

  protected async validateAPIKey(key: string): Promise<boolean> {
    // Mock API key validation - would check against database
    return key.length > 20
  }

  /**
   * Generate secure random key
   */
  protected generateSecureKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Log security event
   */
  protected logSecurityEvent(event: string, details: Record<string, any>): void {
    console.log(`[MCP Security] ${event}:`, details)
    this.emit('security-event', { event, details, timestamp: new Date() })
  }
}