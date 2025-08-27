import { BaseConstruct } from './BaseConstruct'
import { ConstructLevel } from '../types'

/**
 * Base class for L1 Configured constructs
 * Provides configuration capabilities for L1 constructs
 */
export abstract class L1ConfiguredConstruct extends BaseConstruct {
  protected configuration: Map<string, any> = new Map()
  
  constructor(definition: any) {
    super(definition)
    
    // Ensure proper level
    if (this.level !== ConstructLevel.L1) {
      throw new Error(`Construct ${this.id} must be level L1`)
    }
  }
  
  /**
   * Configure the construct with options
   */
  configure(options: Record<string, any>): void {
    for (const [key, value] of Object.entries(options)) {
      this.configuration.set(key, value)
    }
    
    // Emit configuration change event
    this.emit('configured', {
      constructId: this.id,
      options,
      timestamp: new Date()
    })
  }
  
  /**
   * Get configuration value
   */
  protected getConfig<T = any>(key: string, defaultValue?: T): T | undefined {
    return this.configuration.get(key) ?? defaultValue
  }
  
  /**
   * Get all configuration
   */
  getConfiguration(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of this.configuration) {
      result[key] = value
    }
    return result
  }
  
  /**
   * Clear all configuration
   */
  clearConfiguration(): void {
    this.configuration.clear()
    this.emit('configuration-cleared', {
      constructId: this.id,
      timestamp: new Date()
    })
  }
}

/**
 * Base class for L1 UI constructs
 * Enhanced components with security, themes, and best practices
 */
export abstract class L1UIConstruct extends L1ConfiguredConstruct {
  constructor(definition: any) {
    super(definition)
    // Level check is now handled by L1ConfiguredConstruct
  }

  /**
   * L1 constructs can track their enhancements over L0
   */
  getEnhancements(): string[] {
    const enhancements: string[] = []
    
    // Check security features
    if (this.metadata.security && this.metadata.security.length > 0) {
      enhancements.push('security')
    }
    
    // Check for theme support
    if (this.inputs.has('theme')) {
      enhancements.push('themes')
    }
    
    // Check for validation
    if (this.definition.inputs.some(i => i.validation)) {
      enhancements.push('validation')
    }
    
    // Check for monitoring/metrics
    if (this.definition.outputs.some(o => o.name.includes('count') || o.name.includes('stats'))) {
      enhancements.push('metrics')
    }
    
    return enhancements
  }

  // Event functionality now inherited from BaseConstruct
}

/**
 * Base class for L1 Infrastructure constructs
 * Enhanced infrastructure with monitoring, security, and resilience
 */
export abstract class L1InfrastructureConstruct extends L1ConfiguredConstruct {
  constructor(definition: any) {
    super(definition)
    // Level check is now handled by L1ConfiguredConstruct
  }

  /**
   * Health check support for L1 infrastructure
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    // Default implementation - override in subclasses
    return {
      status: 'healthy',
      details: {
        timestamp: new Date(),
        uptime: process.uptime ? process.uptime() : 0
      }
    }
  }

  /**
   * Metrics collection for L1 infrastructure
   */
  async getMetrics(): Promise<Record<string, number>> {
    // Default implementation - override in subclasses
    return {
      requestCount: 0,
      errorCount: 0,
      latencyMs: 0
    }
  }

  /**
   * Security configuration for L1 infrastructure
   */
  getSecurityConfig(): Record<string, any> {
    return {
      encryption: true,
      authentication: true,
      authorization: true,
      rateLimit: true
    }
  }
}