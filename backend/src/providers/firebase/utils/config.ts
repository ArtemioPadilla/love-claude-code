import { initializeApp, App, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getDatabase } from 'firebase-admin/database'
import { getMessaging } from 'firebase-admin/messaging'
import { FirebaseConfig, FirebaseServices, EmulatorConfig } from '../types.js'
import { logger } from '../../aws/utils/logger.js'

export class FirebaseConfigValidator {
  static validate(config: FirebaseConfig): void {
    if (!config.projectId) {
      throw new Error('Firebase project ID is required')
    }

    // Validate credentials if not using emulator
    if (!config.useEmulator && !config.credentials) {
      throw new Error('Firebase credentials are required when not using emulator')
    }

    // Validate emulator configuration
    if (config.useEmulator) {
      if (!config.emulatorHost) {
        config.emulatorHost = 'localhost'
      }
      if (!config.emulatorPorts) {
        config.emulatorPorts = getDefaultEmulatorPorts()
      }
    }

    // Set default options
    if (!config.options) {
      config.options = {}
    }
    config.options = {
      enableOfflinePersistence: true,
      cacheSizeBytes: 50 * 1024 * 1024, // 50MB
      maxRetries: 3,
      retryDelay: 1000,
      functionsRegion: 'us-central1',
      storageCacheControl: 'public, max-age=3600',
      ...config.options
    }
  }
}

export function getDefaultEmulatorPorts(): EmulatorConfig['ports'] {
  return {
    auth: 9099,
    firestore: 8080,
    database: 9000,
    storage: 9199,
    functions: 5001,
    pubsub: 8085
  }
}

export function getEmulatorConfig(config: FirebaseConfig): EmulatorConfig {
  const host = config.emulatorHost || 'localhost'
  const ports = config.emulatorPorts || getDefaultEmulatorPorts()
  
  return { host, ports }
}

export function configureEmulators(services: FirebaseServices, config: FirebaseConfig): void {
  if (!config.useEmulator) return
  
  const emulatorConfig = getEmulatorConfig(config)
  const { host, ports } = emulatorConfig
  
  // Configure Auth emulator
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${ports.auth}`
  
  // Configure Firestore emulator
  process.env.FIRESTORE_EMULATOR_HOST = `${host}:${ports.firestore}`
  
  // Configure Database emulator
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = `${host}:${ports.database}`
  
  // Configure Storage emulator
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${host}:${ports.storage}`
  
  // Configure Functions emulator
  process.env.FUNCTIONS_EMULATOR_HOST = `${host}:${ports.functions}`
  
  // Configure Pub/Sub emulator
  process.env.PUBSUB_EMULATOR_HOST = `${host}:${ports.pubsub}`
  
  logger.info('Firebase emulators configured', emulatorConfig)
}

export async function initializeFirebase(config: FirebaseConfig): Promise<FirebaseServices> {
  // Validate configuration
  FirebaseConfigValidator.validate(config)
  
  let app: App
  
  try {
    // Initialize Firebase Admin SDK
    const appConfig: any = {
      projectId: config.projectId
    }
    
    if (config.credentials) {
      appConfig.credential = cert(config.credentials)
    }
    
    if (config.databaseURL) {
      appConfig.databaseURL = config.databaseURL
    }
    
    if (config.storageBucket) {
      appConfig.storageBucket = config.storageBucket
    }
    
    app = initializeApp(appConfig, config.projectId)
    
    // Initialize services
    const services: FirebaseServices = {
      app,
      auth: getAuth(app),
      firestore: getFirestore(app),
      storage: getStorage(app),
      database: getDatabase(app),
      messaging: getMessaging(app)
    }
    
    // Configure emulators if enabled
    configureEmulators(services, config)
    
    // Configure Firestore settings
    if (config.options?.enableOfflinePersistence) {
      // Note: Offline persistence is primarily a client-side feature
      // Server-side caching will be handled by our cache layer
    }
    
    logger.info('Firebase services initialized', {
      projectId: config.projectId,
      useEmulator: config.useEmulator,
      services: Object.keys(services)
    })
    
    return services
  } catch (error) {
    logger.error('Failed to initialize Firebase', { error })
    throw error
  }
}

export async function validateFirebaseConnection(services: FirebaseServices): Promise<void> {
  try {
    // Test Auth connection
    await services.auth.listUsers(1)
    
    // Test Firestore connection
    await services.firestore.collection('_health').doc('check').set({
      timestamp: new Date(),
      test: true
    })
    
    // Clean up test document
    await services.firestore.collection('_health').doc('check').delete()
    
    logger.info('Firebase connection validated')
  } catch (error) {
    logger.error('Firebase connection validation failed', { error })
    throw error
  }
}

export function getRetryConfig(config: FirebaseConfig) {
  return {
    maxRetries: config.options?.maxRetries || 3,
    retryDelay: config.options?.retryDelay || 1000,
    retryableErrors: [
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'RESOURCE_EXHAUSTED',
      'INTERNAL'
    ]
  }
}