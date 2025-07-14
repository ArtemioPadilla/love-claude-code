import {
  BackendProvider,
  ProviderConfig,
  ProviderType,
  AuthProvider,
  DatabaseProvider,
  StorageProvider,
  RealtimeProvider,
  FunctionProvider,
  NotificationProvider,
  DeploymentProvider
} from '../types.js'

import { AWSAuthProvider } from './auth.js'
import { AWSDatabaseProvider } from './database.js'
import { AWSStorageProvider } from './storage.js'
import { AWSRealtimeProvider } from './realtime.js'
import { AWSFunctionProvider } from './functions.js'
import { AWSNotificationProvider } from './notifications.js'
import { AWSDeploymentProvider } from './deployment.js'
import { AWSConfig, validateAWSConfig } from './utils/config.js'
import { MetricsCollector } from './utils/metrics.js'
import { logger } from './utils/logger.js'

/**
 * AWS backend provider implementation
 * Uses AWS services: Cognito, DynamoDB, S3, Lambda, AppSync, SES/SNS
 */
export class AWSProvider implements BackendProvider {
  type: ProviderType = 'aws'
  
  auth!: AuthProvider
  database!: DatabaseProvider
  storage!: StorageProvider
  realtime!: RealtimeProvider
  functions!: FunctionProvider
  notifications?: NotificationProvider
  deployment?: DeploymentProvider
  
  private config!: AWSConfig
  private initialized = false
  private metrics!: MetricsCollector
  
  async initialize(config: ProviderConfig): Promise<void> {
    if (this.initialized) {
      throw new Error('Provider already initialized')
    }
    
    try {
      // Validate and enhance config
      this.config = await validateAWSConfig(config)
      
      // Initialize metrics collector
      this.metrics = new MetricsCollector(this.config)
      await this.metrics.initialize()
      
      // Initialize all sub-providers with shared config and metrics
      this.auth = new AWSAuthProvider(this.config, this.metrics)
      this.database = new AWSDatabaseProvider(this.config, this.metrics)
      this.storage = new AWSStorageProvider(this.config, this.metrics)
      this.realtime = new AWSRealtimeProvider(this.config, this.metrics)
      this.functions = new AWSFunctionProvider(this.config, this.metrics)
      this.notifications = new AWSNotificationProvider(this.config, this.metrics)
      this.deployment = new AWSDeploymentProvider(config)
      
      // Initialize each provider in parallel
      await Promise.all([
        this.auth.initialize(),
        this.database.initialize(),
        this.storage.initialize(),
        this.realtime.initialize(),
        this.functions.initialize(),
        this.notifications?.initialize(),
        this.deployment?.initialize(),
      ])
      
      this.initialized = true
      logger.info(`AWS provider initialized for project: ${config.projectId}`, {
        region: this.config.region,
        services: {
          auth: 'Cognito',
          database: 'DynamoDB',
          storage: 'S3',
          realtime: 'AppSync',
          functions: 'Lambda',
          notifications: 'SES/SNS',
          deployment: 'CloudFormation/ECS/Lambda'
        }
      })
    } catch (error) {
      logger.error('Failed to initialize AWS provider', { error })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    if (!this.initialized) return
    
    logger.info('Shutting down AWS provider')
    
    try {
      // Shutdown all sub-providers
      await Promise.all([
        this.auth.shutdown?.(),
        this.database.shutdown?.(),
        this.storage.shutdown?.(),
        this.realtime.shutdown?.(),
        this.functions.shutdown?.(),
        this.notifications?.shutdown?.(),
        this.deployment?.shutdown?.(),
      ])
      
      // Flush metrics before shutdown
      await this.metrics.flush()
      await this.metrics.shutdown()
      
      this.initialized = false
      logger.info(`AWS provider shutdown for project: ${this.config.projectId}`)
    } catch (error) {
      logger.error('Error during AWS provider shutdown', { error })
      throw error
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        details: { error: 'Provider not initialized' }
      }
    }
    
    try {
      // Perform health checks on all sub-providers
      const checks = await Promise.allSettled([
        this.auth.healthCheck(),
        this.database.healthCheck(),
        this.storage.healthCheck(),
        this.realtime.healthCheck(),
        this.functions.healthCheck(),
        this.notifications?.healthCheck(),
        this.deployment?.healthCheck(),
      ])
      
      const results = checks.map((check, index) => {
        const serviceName = ['auth', 'database', 'storage', 'realtime', 'functions', 'notifications', 'deployment'][index]
        if (check.status === 'fulfilled') {
          return { [serviceName]: check.value }
        } else {
          return {
            [serviceName]: {
              status: 'unhealthy',
              error: check.reason?.message || 'Health check failed'
            }
          }
        }
      })
      
      const unhealthy = results.some(r => 
        Object.values(r)[0]?.status === 'unhealthy'
      )
      
      return {
        status: unhealthy ? 'unhealthy' : 'healthy',
        details: {
          timestamp: new Date().toISOString(),
          region: this.config.region,
          services: Object.assign({}, ...results),
          metrics: await this.metrics.getHealthMetrics()
        }
      }
    } catch (error) {
      logger.error('Health check failed', { error })
      return {
        status: 'unhealthy',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}