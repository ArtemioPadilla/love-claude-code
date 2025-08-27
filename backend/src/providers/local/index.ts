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

import { LocalAuthProvider } from './auth.js'
import { LocalDatabaseProvider } from './database.js'
import { LocalStorageProvider } from './storage.js'
import { LocalRealtimeProvider } from './realtime.js'
import { LocalFunctionProvider } from './functions.js'
import { LocalDeploymentProvider } from './deployment.js'

/**
 * Local backend provider implementation
 * Uses local file system and SQLite for development and testing
 */
export class LocalProvider implements BackendProvider {
  type: ProviderType = 'local'
  
  auth!: AuthProvider
  database!: DatabaseProvider
  storage!: StorageProvider
  realtime!: RealtimeProvider
  functions!: FunctionProvider
  notifications?: NotificationProvider
  deployment?: DeploymentProvider
  
  private config!: ProviderConfig
  private initialized = false
  
  async initialize(config: ProviderConfig): Promise<void> {
    if (this.initialized) {
      throw new Error('Provider already initialized')
    }
    
    this.config = config
    
    // Initialize all sub-providers
    this.auth = new LocalAuthProvider(config)
    this.database = new LocalDatabaseProvider(config)
    this.storage = new LocalStorageProvider(config)
    this.realtime = new LocalRealtimeProvider(config)
    this.functions = new LocalFunctionProvider(config)
    this.deployment = new LocalDeploymentProvider(config)
    
    // Initialize each provider
    await Promise.all([
      this.auth.initialize?.(),
      this.database.initialize?.(),
      this.storage.initialize?.(),
      this.realtime.initialize?.(),
      // Functions provider initialization not in interface
      this.deployment.initialize?.(),
    ])
    
    this.initialized = true
    console.log(`Local provider initialized for project: ${config.projectId}`)
  }
  
  async shutdown(): Promise<void> {
    if (!this.initialized) return
    
    // Shutdown all sub-providers
    await Promise.all([
      this.auth.shutdown?.(),
      this.database.shutdown?.(),
      this.storage.shutdown?.(),
      this.realtime.shutdown?.(),
      // Functions provider shutdown not in interface
      this.deployment?.shutdown?.(),
    ])
    
    this.initialized = false
    console.log(`Local provider shutdown for project: ${this.config.projectId}`)
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        details: { error: 'Provider not initialized' }
      }
    }
    
    try {
      // Check each sub-provider
      const checks = await Promise.all([
        this.auth.healthCheck?.() ?? { status: 'healthy' },
        this.database.healthCheck?.() ?? { status: 'healthy' },
        this.storage.healthCheck?.() ?? { status: 'healthy' },
        this.realtime.healthCheck?.() ?? { status: 'healthy' },
        this.functions.healthCheck?.() ?? { status: 'healthy' },
        this.deployment?.healthCheck?.() ?? { status: 'healthy' },
      ])
      
      const unhealthy = checks.find(check => check.status === 'unhealthy')
      
      return {
        status: unhealthy ? 'unhealthy' : 'healthy',
        details: {
          auth: checks[0],
          database: checks[1],
          storage: checks[2],
          realtime: checks[3],
          functions: checks[4],
          deployment: checks[5],
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