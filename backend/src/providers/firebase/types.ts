import { App } from 'firebase-admin/app'
import { Auth } from 'firebase-admin/auth'
import { Firestore } from 'firebase-admin/firestore'
import { Storage } from 'firebase-admin/storage'
import { Database } from 'firebase-admin/database'
import { Messaging } from 'firebase-admin/messaging'

export interface FirebaseConfig {
  projectId: string
  credentials?: any
  databaseURL?: string
  storageBucket?: string
  useEmulator?: boolean
  emulatorHost?: string
  emulatorPorts?: {
    auth?: number
    firestore?: number
    database?: number
    storage?: number
    functions?: number
    pubsub?: number
  }
  options?: {
    enableOfflinePersistence?: boolean
    cacheSizeBytes?: number
    maxRetries?: number
    retryDelay?: number
    functionsRegion?: string
    storageCacheControl?: string
  }
}

export interface FirebaseServices {
  app: App
  auth: Auth
  firestore: Firestore
  storage: Storage
  database: Database
  messaging: Messaging
}

export interface EmulatorConfig {
  host: string
  ports: {
    auth: number
    firestore: number
    database: number
    storage: number
    functions: number
    pubsub: number
  }
}