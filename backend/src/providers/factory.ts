import { BackendProvider, ProviderConfig, ProviderType } from './types.js'
import { LocalProvider } from './local/index.js'
import { AWSProvider } from './aws/index.js'
import { FirebaseProvider } from './firebase/index.js'

// Provider registry
const providers = new Map<string, BackendProvider>()

/**
 * Get or create a backend provider instance
 * @param config Provider configuration
 * @returns Initialized backend provider
 */
export async function getProvider(config: ProviderConfig): Promise<BackendProvider> {
  const key = `${config.type}-${config.projectId}`
  
  // Return existing provider if already initialized
  if (providers.has(key)) {
    return providers.get(key)!
  }
  
  // Create new provider based on type
  let provider: BackendProvider
  
  switch (config.type) {
    case 'local':
      provider = new LocalProvider()
      break
      
    case 'firebase':
      provider = new FirebaseProvider()
      break
      
    case 'aws':
      provider = new AWSProvider()
      break
      
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
  
  // Initialize the provider
  await provider.initialize(config)
  
  // Cache the provider
  providers.set(key, provider)
  
  return provider
}

/**
 * Get provider configuration from environment or project settings
 * @param projectId Project identifier
 * @returns Provider configuration
 */
export function getProviderConfig(projectId: string): ProviderConfig {
  // Check for project-specific configuration first
  const projectConfig = getProjectConfig(projectId)
  if (projectConfig?.provider) {
    return projectConfig.provider
  }
  
  // Fall back to environment configuration
  const providerType = (process.env.BACKEND_PROVIDER || 'local') as ProviderType
  
  switch (providerType) {
    case 'local':
      return {
        type: 'local',
        projectId,
        options: {
          databasePath: process.env.LOCAL_DB_PATH || './data/db',
          storagePath: process.env.LOCAL_STORAGE_PATH || './data/storage',
        }
      }
      
    case 'firebase':
      return {
        type: 'firebase',
        projectId,
        credentials: process.env.FIREBASE_SERVICE_ACCOUNT 
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : undefined,
        options: {
          databaseURL: process.env.FIREBASE_DATABASE_URL,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          useEmulator: process.env.FIREBASE_USE_EMULATOR === 'true',
          emulatorHost: process.env.FIREBASE_EMULATOR_HOST || 'localhost',
        }
      }
      
    case 'aws':
      return {
        type: 'aws',
        projectId,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        options: {
          useLocalStack: process.env.AWS_USE_LOCALSTACK === 'true',
          localStackEndpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
          dynamoTablePrefix: `love-claude-${projectId}`,
          s3BucketPrefix: `love-claude-${projectId}`,
        }
      }
      
    default:
      throw new Error(`Unknown provider type: ${providerType}`)
  }
}

/**
 * Get project-specific configuration
 * This would typically come from a database or configuration file
 */
function getProjectConfig(projectId: string): any {
  // TODO: Implement project configuration loading
  // For now, return null to use environment defaults
  return null
}

/**
 * Clean up all provider instances
 */
export async function shutdownProviders(): Promise<void> {
  const shutdownPromises = Array.from(providers.values()).map(provider => 
    provider.shutdown().catch(err => 
      console.error(`Error shutting down provider: ${err}`)
    )
  )
  
  await Promise.all(shutdownPromises)
  providers.clear()
}

/**
 * Get health status of all active providers
 */
export async function getProvidersHealth(): Promise<Record<string, any>> {
  const health: Record<string, any> = {}
  
  for (const [key, provider] of providers.entries()) {
    try {
      health[key] = await provider.healthCheck()
    } catch (error) {
      health[key] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  return health
}

// Clean up providers on process exit
process.on('SIGINT', async () => {
  console.log('Shutting down providers...')
  await shutdownProviders()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down providers...')
  await shutdownProviders()
  process.exit(0)
})