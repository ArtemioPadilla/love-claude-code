import { https, logger as functionsLogger, pubsub } from 'firebase-functions'
import { PubSub } from '@google-cloud/pubsub'
import fetch from 'node-fetch'
import {
  FunctionProvider,
  InvokeOptions,
  LogOptions,
  LogEntry
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { FirebaseMetricsCollector, trackFirebasePerformance } from './utils/metrics.js'
import { FirebaseCacheManager } from './utils/cache.js'
import { withFirebaseRetry, retryableFirebase, FirebaseCircuitBreaker } from './utils/retry.js'
import { logger } from '../aws/utils/logger.js'
import { v4 as uuidv4 } from 'uuid'

interface CloudFunctionEndpoint {
  name: string
  url: string
  region: string
  timeout: number
}

export class FirebaseFunctionProvider implements FunctionProvider {
  private pubsub: PubSub
  private cache: FirebaseCacheManager
  private circuitBreaker: FirebaseCircuitBreaker
  private functionEndpoints: Map<string, CloudFunctionEndpoint> = new Map()
  private readonly defaultTimeout = 540000 // 9 minutes (Cloud Functions max)
  
  constructor(
    private services: FirebaseServices,
    private config: FirebaseConfig,
    private metrics: FirebaseMetricsCollector
  ) {
    this.pubsub = new PubSub({ projectId: config.projectId })
    this.cache = new FirebaseCacheManager(config)
    this.circuitBreaker = new FirebaseCircuitBreaker()
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // If using emulator, configure endpoints
    if (this.config.useEmulator) {
      const functionsUrl = `http://${this.config.emulatorHost}:${this.config.emulatorPorts?.functions || 5001}`
      process.env.FUNCTIONS_EMULATOR_URL = functionsUrl
    }
    
    logger.info('Firebase Functions provider initialized', {
      projectId: this.config.projectId,
      region: this.config.options?.functionsRegion,
      useEmulator: this.config.useEmulator
    })
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  private getFunctionUrl(name: string): string {
    if (this.config.useEmulator) {
      return `${process.env.FUNCTIONS_EMULATOR_URL}/${this.config.projectId}/${this.config.options?.functionsRegion || 'us-central1'}/${name}`
    }
    
    return `https://${this.config.options?.functionsRegion || 'us-central1'}-${this.config.projectId}.cloudfunctions.net/${name}`
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async invoke(name: string, payload: any, options?: InvokeOptions): Promise<any> {
    const functionUrl = this.getFunctionUrl(name)
    
    // Check cache for idempotent requests
    const cacheKey = `invoke:${name}:${JSON.stringify(payload)}`
    if (options?.retries === 0) { // Only cache if no retries (idempotent)
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }
    
    try {
      const response = await this.circuitBreaker.execute(() =>
        withFirebaseRetry(
          async () => {
            const res = await fetch(functionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await this.getAuthToken()}`
              },
              body: JSON.stringify(payload),
              timeout: options?.timeout || this.config.options?.lambdaTimeout || 30000
            })
            
            if (!res.ok) {
              const error = await res.text()
              throw new Error(`Function invocation failed: ${res.status} - ${error}`)
            }
            
            return res.json()
          },
          { maxRetries: options?.retries ?? this.config.options?.maxRetries }
        )
      )
      
      // Cache result if idempotent
      if (options?.retries === 0) {
        await this.cache.set(cacheKey, response, 300) // 5 minutes
      }
      
      await this.metrics.recordSuccess('Invoke', { function: name })
      
      return response
    } catch (error: any) {
      logger.error('Function invocation failed', { error, name, functionUrl })
      await this.metrics.recordError('Invoke', error, { function: name })
      throw error
    }
  }
  
  @trackFirebasePerformance
  async invokeAsync(name: string, payload: any): Promise<{ id: string }> {
    const invocationId = uuidv4()
    const topicName = `function-${name}-async`
    
    try {
      // Publish to Pub/Sub topic
      const topic = this.pubsub.topic(topicName)
      const messageData = {
        invocationId,
        functionName: name,
        payload,
        timestamp: new Date().toISOString()
      }
      
      await topic.publishMessage({
        json: messageData,
        attributes: {
          functionName: name,
          invocationId
        }
      })
      
      await this.metrics.recordSuccess('InvokeAsync', { function: name })
      
      return { id: invocationId }
    } catch (error: any) {
      logger.error('Async function invocation failed', { error, name })
      await this.metrics.recordError('InvokeAsync', error, { function: name })
      throw error
    }
  }
  
  @trackFirebasePerformance
  async schedule(name: string, schedule: string, payload?: any): Promise<{ id: string }> {
    const scheduleId = `${name}-schedule-${uuidv4()}`
    const topicName = `scheduled-${name}`
    
    try {
      // Create or update Pub/Sub topic
      const topic = this.pubsub.topic(topicName)
      const [exists] = await topic.exists()
      if (!exists) {
        await topic.create()
      }
      
      // In production, you would use Cloud Scheduler API
      // For now, we'll store the schedule configuration
      await this.cache.set(`schedule:${scheduleId}`, {
        functionName: name,
        schedule,
        payload,
        topicName,
        createdAt: new Date()
      }, 86400) // 24 hours
      
      logger.info('Function scheduled', { name, schedule, scheduleId })
      
      await this.metrics.recordSuccess('Schedule', { function: name })
      
      return { id: scheduleId }
    } catch (error: any) {
      logger.error('Function scheduling failed', { error, name })
      await this.metrics.recordError('Schedule', error, { function: name })
      throw error
    }
  }
  
  @trackFirebasePerformance
  async unschedule(id: string): Promise<void> {
    try {
      const scheduleData = await this.cache.get<any>(`schedule:${id}`)
      if (!scheduleData) {
        throw new Error(`Schedule not found: ${id}`)
      }
      
      // Delete the schedule configuration
      await this.cache.delete(`schedule:${id}`)
      
      // In production, you would delete from Cloud Scheduler
      
      await this.metrics.recordSuccess('Unschedule')
    } catch (error: any) {
      logger.error('Function unscheduling failed', { error, id })
      await this.metrics.recordError('Unschedule', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async getLogs(name: string, options?: LogOptions): Promise<LogEntry[]> {
    try {
      // In production, you would use Cloud Logging API
      // For development, we'll return mock logs
      
      if (this.config.useEmulator) {
        // Emulator logs would be retrieved from local logs
        return this.getMockLogs(name, options)
      }
      
      // Use Google Cloud Logging API
      const logs = await this.fetchCloudLogs(name, options)
      
      await this.metrics.recordSuccess('GetLogs', { function: name })
      
      return logs
    } catch (error: any) {
      logger.error('Get logs failed', { error, name })
      await this.metrics.recordError('GetLogs', error, { function: name })
      throw error
    }
  }
  
  private async getAuthToken(): Promise<string> {
    // In production, get ID token for service account
    // For now, return a placeholder
    if (this.config.useEmulator) {
      return 'emulator-token'
    }
    
    // Use Application Default Credentials
    try {
      const { GoogleAuth } = await import('google-auth-library')
      const auth = new GoogleAuth()
      const client = await auth.getClient()
      const token = await client.getAccessToken()
      return token.token || ''
    } catch {
      return 'development-token'
    }
  }
  
  private async fetchCloudLogs(functionName: string, options?: LogOptions): Promise<LogEntry[]> {
    // This would use Google Cloud Logging API
    // Simplified implementation for now
    const logs: LogEntry[] = []
    
    // Mock implementation
    const mockLogs = this.getMockLogs(functionName, options)
    logs.push(...mockLogs)
    
    return logs
  }
  
  private getMockLogs(functionName: string, options?: LogOptions): LogEntry[] {
    const logs: LogEntry[] = []
    const now = new Date()
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug']
    
    // Generate mock logs
    for (let i = 0; i < (options?.limit || 10); i++) {
      const timestamp = new Date(now.getTime() - i * 60000) // 1 minute intervals
      
      if (options?.startTime && timestamp < options.startTime) break
      if (options?.endTime && timestamp > options.endTime) continue
      
      const level = levels[Math.floor(Math.random() * levels.length)]
      const message = `[${functionName}] Mock log entry ${i} - ${level.toUpperCase()}`
      
      if (options?.filter && !message.includes(options.filter)) continue
      
      logs.push({
        timestamp,
        level,
        message,
        metadata: {
          functionName,
          executionId: uuidv4(),
          region: this.config.options?.functionsRegion || 'us-central1'
        }
      })
    }
    
    return logs
  }
  
  // Helper method to deploy a function (development only)
  async deployFunction(name: string, code: string, handler: string = 'handler'): Promise<void> {
    if (!this.config.useEmulator) {
      throw new Error('Function deployment is only available in emulator mode')
    }
    
    // In emulator mode, functions are deployed differently
    // This is a placeholder for the actual implementation
    logger.info('Function deployment requested', { name, handler })
    
    // Store function metadata
    this.functionEndpoints.set(name, {
      name,
      url: this.getFunctionUrl(name),
      region: this.config.options?.functionsRegion || 'us-central1',
      timeout: this.defaultTimeout
    })
  }
  
  // Create an HTTP Cloud Function wrapper
  createHttpFunction(handler: (req: any, res: any) => Promise<void>): any {
    return https.onRequest(async (req, res) => {
      const startTime = Date.now()
      
      try {
        await handler(req, res)
        
        functionsLogger.info('HTTP function executed', {
          duration: Date.now() - startTime,
          method: req.method,
          path: req.path
        })
      } catch (error) {
        functionsLogger.error('HTTP function error', error)
        
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    })
  }
  
  // Create a Pub/Sub triggered function wrapper
  createPubSubFunction(handler: (message: any, context: any) => Promise<void>): any {
    return pubsub.topic('{topicName}').onPublish(async (message, context) => {
      const startTime = Date.now()
      
      try {
        const data = message.json || JSON.parse(Buffer.from(message.data, 'base64').toString())
        
        await handler(data, context)
        
        functionsLogger.info('Pub/Sub function executed', {
          duration: Date.now() - startTime,
          messageId: context.messageId,
          topic: context.topicName
        })
      } catch (error) {
        functionsLogger.error('Pub/Sub function error', error)
        throw error // Let Cloud Functions retry
      }
    })
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Test Pub/Sub connection
      const topic = this.pubsub.topic('health-check')
      const [exists] = await topic.exists()
      
      const cacheHealth = await this.cache.healthCheck()
      
      return {
        status: 'healthy',
        details: {
          projectId: this.config.projectId,
          region: this.config.options?.functionsRegion,
          useEmulator: this.config.useEmulator,
          cache: cacheHealth,
          circuitBreaker: this.circuitBreaker.status,
          metrics: this.metrics.getSummary()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}