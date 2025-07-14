import { EventEmitter } from 'events'
import { logger } from '../../aws/utils/logger.js'

export interface FirebaseMetric {
  name: string
  value: number
  unit?: string
  timestamp: Date
  dimensions?: Record<string, string>
  metadata?: Record<string, any>
}

export class FirebaseMetricsCollector extends EventEmitter {
  private metrics: FirebaseMetric[] = []
  private buffer: FirebaseMetric[] = []
  private flushInterval?: NodeJS.Timeout
  private readonly maxBufferSize = 100
  private readonly flushIntervalMs = 60000 // 1 minute
  
  constructor(private projectId: string) {
    super()
    this.startFlushInterval()
  }
  
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch(err => 
        logger.error('Failed to flush metrics', { error: err })
      )
    }, this.flushIntervalMs)
  }
  
  async record(metric: Omit<FirebaseMetric, 'timestamp'>): Promise<void> {
    const fullMetric: FirebaseMetric = {
      ...metric,
      timestamp: new Date(),
      dimensions: {
        ...metric.dimensions,
        ProjectId: this.projectId
      }
    }
    
    this.buffer.push(fullMetric)
    this.emit('metric', fullMetric)
    
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush()
    }
  }
  
  async recordSuccess(operation: string, dimensions?: Record<string, string>): Promise<void> {
    await this.record({
      name: `${operation}.Success`,
      value: 1,
      unit: 'Count',
      dimensions
    })
  }
  
  async recordError(operation: string, error: Error, dimensions?: Record<string, string>): Promise<void> {
    await this.record({
      name: `${operation}.Error`,
      value: 1,
      unit: 'Count',
      dimensions: {
        ...dimensions,
        ErrorType: error.name,
        ErrorMessage: error.message.substring(0, 100)
      }
    })
  }
  
  async recordLatency(operation: string, latencyMs: number, dimensions?: Record<string, string>): Promise<void> {
    await this.record({
      name: `${operation}.Latency`,
      value: latencyMs,
      unit: 'Milliseconds',
      dimensions
    })
  }
  
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return
    
    const metricsToFlush = [...this.buffer]
    this.buffer = []
    
    try {
      // In production, send to Google Cloud Monitoring
      // For now, just log them
      logger.info('Flushing Firebase metrics', {
        count: metricsToFlush.length,
        metrics: metricsToFlush.slice(0, 5) // Log first 5 for debugging
      })
      
      // Store metrics for later analysis
      this.metrics.push(...metricsToFlush)
      
      // Keep only last hour of metrics
      const oneHourAgo = new Date(Date.now() - 3600000)
      this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    } catch (error) {
      logger.error('Failed to flush metrics', { error })
      // Put metrics back in buffer for retry
      this.buffer.unshift(...metricsToFlush)
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flush()
  }
  
  getMetrics(since?: Date): FirebaseMetric[] {
    if (!since) {
      return [...this.metrics]
    }
    return this.metrics.filter(m => m.timestamp > since)
  }
  
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {}
    
    for (const metric of this.metrics) {
      const key = metric.name
      if (!summary[key]) {
        summary[key] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0
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
}

// Performance tracking decorator for Firebase operations
export function trackFirebasePerformance(
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
    const metrics = (this as any).metrics as FirebaseMetricsCollector
    
    try {
      const result = await originalMethod.apply(this, args)
      
      if (metrics) {
        await metrics.recordLatency(
          propertyKey,
          Date.now() - startTime
        )
        await metrics.recordSuccess(propertyKey)
      }
      
      return result
    } catch (error) {
      if (metrics) {
        await metrics.recordLatency(
          propertyKey,
          Date.now() - startTime
        )
        await metrics.recordError(propertyKey, error as Error)
      }
      throw error
    }
  }
  
  return descriptor
}