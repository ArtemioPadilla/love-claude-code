import { CloudWatchClient, PutMetricDataCommand, MetricDatum } from '@aws-sdk/client-cloudwatch'
import { AWSConfig, getAWSClientConfig } from './config.js'
import { logger } from './logger.js'

export interface Metric {
  name: string
  value: number
  unit: 'Count' | 'Milliseconds' | 'Bytes' | 'Percent' | 'None'
  dimensions?: Record<string, string>
  timestamp?: Date
}

export class MetricsCollector {
  private client: CloudWatchClient
  private namespace: string
  private buffer: MetricDatum[] = []
  private flushInterval?: NodeJS.Timeout
  private readonly maxBufferSize = 20 // CloudWatch limit
  private readonly flushIntervalMs = 60000 // 1 minute
  
  constructor(private config: AWSConfig) {
    this.client = new CloudWatchClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.cloudwatch
    })
    this.namespace = config.options.cloudWatchNamespace || 'LoveClaudeCode'
  }
  
  async initialize(): Promise<void> {
    if (!this.config.options.enableCloudWatch) {
      logger.info('CloudWatch metrics disabled')
      return
    }
    
    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush().catch(err => 
        logger.error('Failed to flush metrics', { error: err })
      )
    }, this.flushIntervalMs)
    
    logger.info('Metrics collector initialized', {
      namespace: this.namespace,
      flushInterval: this.flushIntervalMs
    })
  }
  
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flush()
  }
  
  async record(metric: Metric): Promise<void> {
    if (!this.config.options.enableCloudWatch) return
    
    const datum: MetricDatum = {
      MetricName: metric.name,
      Value: metric.value,
      Unit: metric.unit,
      Timestamp: metric.timestamp || new Date(),
      Dimensions: metric.dimensions ? 
        Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value })) : 
        []
    }
    
    // Add default dimensions
    datum.Dimensions?.push(
      { Name: 'ProjectId', Value: this.config.projectId },
      { Name: 'Region', Value: this.config.region },
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
    )
    
    this.buffer.push(datum)
    
    // Flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush()
    }
  }
  
  async recordLatency(operation: string, startTime: number, dimensions?: Record<string, string>): Promise<void> {
    const duration = Date.now() - startTime
    await this.record({
      name: `${operation}Latency`,
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        Operation: operation,
        ...dimensions
      }
    })
  }
  
  async recordError(operation: string, error: Error, dimensions?: Record<string, string>): Promise<void> {
    await this.record({
      name: 'Errors',
      value: 1,
      unit: 'Count',
      dimensions: {
        Operation: operation,
        ErrorType: error.name,
        ...dimensions
      }
    })
  }
  
  async recordSuccess(operation: string, dimensions?: Record<string, string>): Promise<void> {
    await this.record({
      name: 'Success',
      value: 1,
      unit: 'Count',
      dimensions: {
        Operation: operation,
        ...dimensions
      }
    })
  }
  
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return
    
    const metrics = [...this.buffer]
    this.buffer = []
    
    try {
      await this.client.send(new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metrics
      }))
      
      logger.debug('Flushed metrics to CloudWatch', { count: metrics.length })
    } catch (error) {
      logger.error('Failed to send metrics to CloudWatch', { error })
      // Put metrics back in buffer if there's room
      if (this.buffer.length + metrics.length <= this.maxBufferSize * 2) {
        this.buffer.unshift(...metrics)
      }
    }
  }
  
  async getHealthMetrics(): Promise<any> {
    return {
      bufferSize: this.buffer.length,
      maxBufferSize: this.maxBufferSize,
      enabled: this.config.options.enableCloudWatch
    }
  }
}

// Performance tracking decorator
export function trackPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  if (!descriptor || typeof descriptor.value !== 'function') {
    return descriptor
  }
  
  const originalMethod = descriptor.value
  
  descriptor.value = async function(...args: any[]) {
    const metrics = (this as any).metrics as MetricsCollector
    if (!metrics) {
      return originalMethod.apply(this, args)
    }
    
    const startTime = Date.now()
    const operation = `${target.constructor.name}.${propertyKey}`
    
    try {
      const result = await originalMethod.apply(this, args)
      await metrics.recordSuccess(operation)
      await metrics.recordLatency(operation, startTime)
      return result
    } catch (error) {
      await metrics.recordError(operation, error as Error)
      await metrics.recordLatency(operation, startTime)
      throw error
    }
  }
  
  return descriptor
}