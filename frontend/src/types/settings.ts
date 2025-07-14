export type ProviderType = 'local' | 'firebase' | 'aws'

export interface Settings {
  general: {
    theme: 'light' | 'dark' | 'system'
    language: string
    autoSave: boolean
  }
  ai: {
    apiKey?: string
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