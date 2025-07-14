import {
  BackendProvider,
  ProviderType,
  ProviderConfig,
  AuthProvider,
  DatabaseProvider,
  StorageProvider,
  RealtimeProvider,
  FunctionProvider,
  NotificationProvider,
  DeploymentProvider
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { initializeFirebase, validateFirebaseConnection } from './utils/config.js'
import { FirebaseMetricsCollector } from './utils/metrics.js'
import { FirebaseAuthProvider } from './auth.js'
import { FirestoreProvider } from './database.js'
import { FirebaseStorageProvider } from './storage.js'
import { FirebaseRealtimeProvider } from './realtime.js'
import { FirebaseFunctionProvider } from './functions.js'
import { FirebaseNotificationProvider } from './notifications.js'
import { FirebaseDeploymentProvider } from './deployment.js'
import { logger } from '../aws/utils/logger.js'

export class FirebaseProvider implements BackendProvider {
  type: ProviderType = 'firebase'
  auth!: AuthProvider
  database!: DatabaseProvider
  storage!: StorageProvider
  realtime!: RealtimeProvider
  functions!: FunctionProvider
  notifications!: NotificationProvider
  deployment?: DeploymentProvider
  
  private services?: FirebaseServices
  private metrics?: FirebaseMetricsCollector
  private config?: FirebaseConfig
  private initialized = false
  
  async initialize(config: ProviderConfig): Promise<void> {
    if (this.initialized) {
      logger.warn('Firebase provider already initialized')
      return
    }
    
    try {
      // Convert provider config to Firebase config
      this.config = this.convertConfig(config)
      
      // Initialize metrics collector
      this.metrics = new FirebaseMetricsCollector(this.config.projectId)
      
      // Initialize Firebase services
      this.services = await initializeFirebase(this.config)
      
      // Validate connection
      await validateFirebaseConnection(this.services)
      
      // Initialize providers
      this.auth = new FirebaseAuthProvider(this.services, this.config, this.metrics)
      this.database = new FirestoreProvider(this.services, this.config, this.metrics)
      this.storage = new FirebaseStorageProvider(this.services, this.config, this.metrics)
      this.realtime = new FirebaseRealtimeProvider(this.services, this.config, this.metrics)
      this.functions = new FirebaseFunctionProvider(this.services, this.config, this.metrics)
      this.notifications = new FirebaseNotificationProvider(this.services, this.config, this.metrics)
      this.deployment = new FirebaseDeploymentProvider(config)
      
      // Initialize all providers
      await Promise.all([
        this.auth.initialize(),
        this.database.initialize(),
        this.storage.initialize(),
        this.realtime.initialize(),
        this.functions.initialize(),
        this.notifications.initialize(),
        this.deployment.initialize()
      ])
      
      this.initialized = true
      
      logger.info('Firebase provider initialized successfully', {
        projectId: this.config.projectId,
        useEmulator: this.config.useEmulator,
        services: Object.keys(this.services)
      })
      
      // Start metrics monitoring
      this.startMetricsMonitoring()
    } catch (error) {
      logger.error('Failed to initialize Firebase provider', { error })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    if (!this.initialized) return
    
    try {
      // Shutdown all providers
      await Promise.allSettled([
        this.auth?.shutdown(),
        this.database?.shutdown(),
        this.storage?.shutdown(),
        this.realtime?.shutdown(),
        this.functions?.shutdown(),
        this.notifications?.shutdown(),
        this.deployment?.shutdown()
      ])
      
      // Shutdown metrics
      await this.metrics?.shutdown()
      
      // Terminate Firebase app
      if (this.services?.app) {
        await this.services.app.delete()
      }
      
      this.initialized = false
      
      logger.info('Firebase provider shut down successfully')
    } catch (error) {
      logger.error('Error during Firebase provider shutdown', { error })
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
    
    const healthChecks = await Promise.allSettled([
      this.auth.healthCheck(),
      this.database.healthCheck(),
      this.storage.healthCheck(),
      this.realtime.healthCheck(),
      this.functions.healthCheck(),
      this.notifications.healthCheck(),
      this.deployment?.healthCheck() ?? Promise.resolve({ status: 'healthy' })
    ])
    
    const results: Record<string, any> = {
      auth: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : { status: 'unhealthy', error: healthChecks[0].reason },
      database: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : { status: 'unhealthy', error: healthChecks[1].reason },
      storage: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : { status: 'unhealthy', error: healthChecks[2].reason },
      realtime: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : { status: 'unhealthy', error: healthChecks[3].reason },
      functions: healthChecks[4].status === 'fulfilled' ? healthChecks[4].value : { status: 'unhealthy', error: healthChecks[4].reason },
      notifications: healthChecks[5].status === 'fulfilled' ? healthChecks[5].value : { status: 'unhealthy', error: healthChecks[5].reason },
      deployment: healthChecks[6].status === 'fulfilled' ? healthChecks[6].value : { status: 'unhealthy', error: healthChecks[6].reason }
    }
    
    const allHealthy = Object.values(results).every(r => r.status === 'healthy')
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      details: {
        ...results,
        metrics: this.metrics?.getSummary(),
        config: {
          projectId: this.config?.projectId,
          useEmulator: this.config?.useEmulator
        }
      }
    }
  }
  
  private convertConfig(config: ProviderConfig): FirebaseConfig {
    if (config.type !== 'firebase') {
      throw new Error('Invalid provider type for Firebase')
    }
    
    const firebaseConfig: FirebaseConfig = {
      projectId: config.projectId,
      credentials: config.credentials,
      databaseURL: config.options?.databaseURL,
      storageBucket: config.options?.storageBucket,
      useEmulator: config.options?.useEmulator || false,
      emulatorHost: config.options?.emulatorHost || 'localhost',
      emulatorPorts: config.options?.emulatorPorts,
      options: {
        enableOfflinePersistence: config.options?.enableOfflinePersistence ?? true,
        cacheSizeBytes: config.options?.cacheSizeBytes,
        maxRetries: config.options?.maxRetries ?? 3,
        retryDelay: config.options?.retryDelay ?? 1000,
        functionsRegion: config.options?.functionsRegion || 'us-central1',
        storageCacheControl: config.options?.storageCacheControl
      }
    }
    
    return firebaseConfig
  }
  
  private startMetricsMonitoring(): void {
    if (!this.metrics) return
    
    // Log metrics summary every 5 minutes
    setInterval(() => {
      const summary = this.metrics!.getSummary()
      logger.info('Firebase metrics summary', summary)
    }, 300000) // 5 minutes
    
    // Listen for metric events
    this.metrics.on('metric', (metric) => {
      // Could send to monitoring service here
      if (metric.name.includes('Error')) {
        logger.warn('Firebase operation error', metric)
      }
    })
  }
  
  // Utility methods for Firebase-specific features
  
  /**
   * Enable offline persistence for Firestore (client-side feature)
   */
  async enableOfflinePersistence(): Promise<void> {
    logger.info('Offline persistence is a client-side feature in Firebase')
  }
  
  /**
   * Get Firebase app instance for advanced operations
   */
  getApp() {
    return this.services?.app
  }
  
  /**
   * Get raw Firebase services for advanced operations
   */
  getServices() {
    return this.services
  }
  
  /**
   * Export data for backup
   */
  async exportData(path: string): Promise<void> {
    if (!this.database || !this.storage) {
      throw new Error('Database and storage providers required for export')
    }
    
    logger.info('Data export requested', { path })
    // Implementation would export Firestore and Storage data
  }
  
  /**
   * Import data from backup
   */
  async importData(path: string): Promise<void> {
    if (!this.database || !this.storage) {
      throw new Error('Database and storage providers required for import')
    }
    
    logger.info('Data import requested', { path })
    // Implementation would import Firestore and Storage data
  }
}

// Re-export types and utilities for convenience
export * from './types.js'
export { FirebaseMetricsCollector } from './utils/metrics.js'
export { FirebaseCacheManager } from './utils/cache.js'
export { FirebaseCircuitBreaker, withFirebaseRetry } from './utils/retry.js'