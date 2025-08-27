import { AuthMethod, AuthCredentials } from './auth'

export type ProviderType = 'local' | 'firebase' | 'aws'

export interface Settings {
  general: {
    theme: 'light' | 'dark' | 'system'
    language: string
    autoSave: boolean
    appName?: string
    autoSaveInterval?: number
  }
  ai: {
    authMethod: AuthMethod
    apiKey?: string
    oauthCredentials?: {
      accessToken: string
      refreshToken: string
      expiresAt: number
    }
    model: string
    temperature: number
    maxTokens: number
  }
  providers?: {
    default: ProviderType
    firebase?: {
      projectId: string
      apiKey: string
      authDomain: string
      storageBucket: string
    }
    aws?: {
      region: string
      accessKeyId: string
      secretAccessKey: string
    }
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
  }
}