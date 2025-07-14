import { EventEmitter } from 'events'
import { logger } from '../aws/utils/logger.js'

export interface MetricData {
  name: string
  value: number
  unit?: string
  timestamp: Date
  dimensions?: Record<string, string>
  metadata?: Record<string, any>
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  details?: any
  lastChecked: Date
}

export interface MonitoringConfig {
  enableMetrics?: boolean
  enableHealthChecks?: boolean
  metricsInterval?: number
  healthCheckInterval?: number
  customDimensions?: Record<string, string>
}

/**
 * Unified monitoring service for all providers
 */
export class UnifiedMonitoringService extends EventEmitter {
  private metrics: MetricData[] = []
  private healthChecks: Map<string, HealthCheckResult> = new Map()
  private metricsInterval?: NodeJS.Timeout
  private healthCheckInterval?: NodeJS.Timeout
  private config: Required<MonitoringConfig>
  
  constructor(config: MonitoringConfig = {}) {
    super()
    
    this.config = {
      enableMetrics: true,
      enableHealthChecks: true,
      metricsInterval: 60000, // 1 minute
      healthCheckInterval: 300000, // 5 minutes
      customDimensions: {},
      ...config
    }
    
    if (this.config.enableMetrics) {
      this.startMetricsCollection()
    }
    
    if (this.config.enableHealthChecks) {
      this.startHealthChecks()
    }
  }
  
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.publishMetrics()
    }, this.config.metricsInterval)
  }
  
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, this.config.healthCheckInterval)
  }
  
  async recordMetric(metric: Omit<MetricData, 'timestamp'>): Promise<void> {
    if (!this.config.enableMetrics) return
    
    const fullMetric: MetricData = {
      ...metric,
      timestamp: new Date(),
      dimensions: {
        ...this.config.customDimensions,
        ...metric.dimensions
      }
    }
    
    this.metrics.push(fullMetric)
    this.emit('metric', fullMetric)
    
    // Keep only last hour of metrics
    const oneHourAgo = new Date(Date.now() - 3600000)
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
  }
  
  async recordHealthCheck(service: string, result: Omit<HealthCheckResult, 'lastChecked'>): Promise<void> {
    if (!this.config.enableHealthChecks) return
    
    const fullResult: HealthCheckResult = {
      ...result,
      lastChecked: new Date()
    }
    
    this.healthChecks.set(service, fullResult)
    this.emit('health', { service, ...fullResult })
    
    if (result.status === 'unhealthy') {
      logger.error(`Health check failed for ${service}`, result.details)
    }
  }
  
  private async publishMetrics(): Promise<void> {
    const summary = this.getMetricsSummary()
    
    logger.info('Metrics summary', summary)
    this.emit('metrics-summary', summary)
    
    // In production, send to monitoring service
    if (process.env.MONITORING_ENDPOINT) {
      try {
        await fetch(process.env.MONITORING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: this.metrics,
            summary,
            timestamp: new Date()
          })
        })
      } catch (error) {
        logger.error('Failed to publish metrics', { error })
      }
    }
  }
  
  private async performHealthChecks(): Promise<void> {
    // Emit event to trigger health checks
    this.emit('perform-health-checks')
    
    // Check overall system health
    const unhealthyServices = Array.from(this.healthChecks.entries())
      .filter(([_, result]) => result.status === 'unhealthy')
    
    if (unhealthyServices.length > 0) {
      logger.warn('Unhealthy services detected', {
        count: unhealthyServices.length,
        services: unhealthyServices.map(([name]) => name)
      })
    }
  }
  
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {}
    
    for (const metric of this.metrics) {
      const key = metric.name
      if (!summary[key]) {
        summary[key] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
          unit: metric.unit
        }
      }
      
      summary[key].count++
      summary[key].sum += metric.value
      summary[key].min = Math.min(summary[key].min, metric.value)
      summary[key].max = Math.max(summary[key].max, metric.value)
      summary[key].avg = summary[key].sum / summary[key].count
    }
    
    return summary
  }
  
  getHealthStatus(): Record<string, HealthCheckResult> {
    return Object.fromEntries(this.healthChecks)
  }
  
  getMetrics(since?: Date): MetricData[] {
    if (!since) {
      return [...this.metrics]
    }
    return this.metrics.filter(m => m.timestamp > since)
  }
  
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    // Publish final metrics
    await this.publishMetrics()
    
    this.removeAllListeners()
  }
}

/**
 * Performance tracking decorator
 */
export function trackPerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  if (!descriptor || typeof descriptor.value !== 'function') {
    return descriptor
  }
  
  const originalMethod = descriptor.value
  
  descriptor.value = async function(...args: any[]) {
    const startTime = Date.now()
    const monitoring = (this as any).monitoring as UnifiedMonitoringService | undefined
    
    try {
      const result = await originalMethod.apply(this, args)
      
      if (monitoring) {
        await monitoring.recordMetric({
          name: `${target.constructor.name}.${propertyKey}.Duration`,
          value: Date.now() - startTime,
          unit: 'Milliseconds'
        })
        
        await monitoring.recordMetric({
          name: `${target.constructor.name}.${propertyKey}.Success`,
          value: 1,
          unit: 'Count'
        })
      }
      
      return result
    } catch (error) {
      if (monitoring) {
        await monitoring.recordMetric({
          name: `${target.constructor.name}.${propertyKey}.Duration`,
          value: Date.now() - startTime,
          unit: 'Milliseconds'
        })
        
        await monitoring.recordMetric({
          name: `${target.constructor.name}.${propertyKey}.Error`,
          value: 1,
          unit: 'Count',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
      
      throw error
    }
  }
  
  return descriptor
}

/**
 * Create monitoring-aware class wrapper
 */
export function withMonitoring<T extends new(...args: any[]) => any>(
  Base: T,
  serviceName: string
) {
  return class extends Base {
    monitoring: UnifiedMonitoringService
    
    constructor(...args: any[]) {
      super(...args)
      this.monitoring = new UnifiedMonitoringService({
        customDimensions: { service: serviceName }
      })
      
      // Auto-register health check
      if (typeof (this as any).healthCheck === 'function') {
        this.monitoring.on('perform-health-checks', async () => {
          const result = await (this as any).healthCheck()
          await this.monitoring.recordHealthCheck(serviceName, result)
        })
      }
    }
  }
}