// Re-export all enterprise types for convenience
export * from '../services/enterprise/enterpriseConfig'
export * from '../services/auth/ssoService'
export * from '../services/audit/auditService'

// Additional enterprise types
export interface EnterpriseFeatures {
  sso: boolean
  teams: boolean
  auditLogs: boolean
  advancedRBAC: boolean
  customRoles: boolean
  apiKeys: boolean
  webhooks: boolean
  dataExport: boolean
  dedicatedSupport: boolean
  slaGuarantee: boolean
}

export interface EnterpriseLimits {
  maxUsers: number
  maxTeams: number
  maxProjects: number
  maxConstructs: number
  maxStorageGB: number
  maxBandwidthGB: number
  maxComputeHours: number
  maxApiCalls: number
}

export interface EnterpriseSettings {
  features: EnterpriseFeatures
  limits: EnterpriseLimits
  branding: {
    customLogo?: string
    customColors?: {
      primary: string
      secondary: string
      accent: string
    }
    customDomain?: string
  }
  security: {
    enforceSSO: boolean
    mfaRequired: boolean
    ipWhitelist: string[]
    sessionTimeout: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
      expirationDays?: number
    }
  }
  integrations: {
    slack?: {
      enabled: boolean
      webhookUrl?: string
      channels?: string[]
    }
    github?: {
      enabled: boolean
      organization?: string
      repositories?: string[]
    }
    jira?: {
      enabled: boolean
      url?: string
      projectKey?: string
    }
  }
}

export interface EnterpriseBilling {
  plan: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom'
  billingCycle: 'monthly' | 'annual'
  amount: number
  currency: string
  nextBillingDate: Date
  paymentMethod?: {
    type: 'card' | 'invoice' | 'wire'
    last4?: string
    expiryDate?: string
  }
  invoices: {
    id: string
    date: Date
    amount: number
    status: 'paid' | 'pending' | 'failed'
    downloadUrl?: string
  }[]
}