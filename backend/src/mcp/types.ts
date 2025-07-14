import { ProviderType, ProviderConfig, BackendProvider } from '../providers/types.js'

// Re-export for convenience
export type { ProviderType, BackendProvider }

// MCP Tool definitions
export interface MCPTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPToolResult {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

// Provider capability definitions
export interface ProviderCapabilities {
  name: string
  type: ProviderType
  description: string
  features: {
    auth: AuthFeatures
    database: DatabaseFeatures
    storage: StorageFeatures
    realtime: RealtimeFeatures
    functions: FunctionFeatures
    notifications?: NotificationFeatures
  }
  pricing: PricingModel
  limitations: Limitations
  bestFor: string[]
  notRecommendedFor: string[]
  regions: string[]
  compliance: string[] // GDPR, HIPAA, SOC2, etc.
  supportLevel: 'community' | 'professional' | 'enterprise'
}

export interface AuthFeatures {
  methods: string[] // email/password, OAuth, SSO, etc.
  mfa: boolean
  customDomains: boolean
  userLimit?: number
  sessionManagement: boolean
}

export interface DatabaseFeatures {
  type: 'document' | 'relational' | 'key-value' | 'hybrid'
  maxSize?: string
  backups: boolean
  replication: boolean
  transactions: boolean
  offline: boolean
  search: boolean
  realtime: boolean
}

export interface StorageFeatures {
  maxFileSize?: string
  totalStorage?: string
  cdn: boolean
  imageOptimization: boolean
  videoStreaming: boolean
  encryption: boolean
}

export interface RealtimeFeatures {
  protocol: 'websocket' | 'sse' | 'polling'
  maxConnections?: number
  presence: boolean
  history: boolean
  guaranteed: boolean
}

export interface FunctionFeatures {
  runtime: string[]
  maxExecutionTime?: number
  maxMemory?: string
  coldStart: boolean
  scheduling: boolean
  eventTriggers: string[]
}

export interface NotificationFeatures {
  email: boolean
  sms: boolean
  push: boolean
  inApp: boolean
  templates: boolean
  analytics: boolean
}

export interface PricingModel {
  model: 'free' | 'pay-as-you-go' | 'fixed' | 'tiered'
  freeTier?: {
    users?: number
    storage?: string
    bandwidth?: string
    functions?: number
    duration?: string // e.g., "30 days"
  }
  costs?: {
    perUser?: number
    perGB?: number
    perRequest?: number
    perFunction?: number
    minimum?: number
  }
  currency: string
}

export interface Limitations {
  rateLimit?: string
  concurrentUsers?: number
  apiCalls?: string
  customDomains?: number
  teamMembers?: number
}

// Project requirements analysis
export interface ProjectRequirements {
  projectType: 'web' | 'mobile' | 'desktop' | 'api' | 'hybrid'
  expectedUsers: number
  expectedTraffic: string // requests/month
  dataVolume: string // GB
  features: {
    authentication: boolean
    realtime: boolean
    fileStorage: boolean
    serverless: boolean
    notifications: boolean
    analytics: boolean
    search: boolean
    ml: boolean
  }
  compliance: string[]
  budget?: {
    monthly: number
    currency: string
  }
  preferredRegions?: string[]
  existingProvider?: ProviderType
}

// Provider recommendation
export interface ProviderRecommendation {
  provider: ProviderType
  score: number // 0-100
  reasoning: string[]
  pros: string[]
  cons: string[]
  estimatedCost: {
    monthly: number
    yearly: number
    currency: string
    breakdown: Record<string, number>
  }
  migrationEffort?: 'low' | 'medium' | 'high'
  alternativeProviders: Array<{
    provider: ProviderType
    reason: string
  }>
}

// Migration planning
export interface MigrationPlan {
  fromProvider: ProviderType
  toProvider: ProviderType
  effort: 'low' | 'medium' | 'high'
  estimatedTime: string
  steps: MigrationStep[]
  risks: string[]
  rollbackPlan: string
}

export interface MigrationStep {
  name: string
  description: string
  automated: boolean
  estimatedTime: string
  dependencies: string[]
  validation: string
}

// Provider health and metrics
export interface ProviderMetrics {
  provider: ProviderType
  timestamp: Date
  health: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number // percentage
  latency: {
    p50: number
    p95: number
    p99: number
  }
  errors: {
    rate: number
    types: Record<string, number>
  }
  usage: {
    users: number
    storage: string
    bandwidth: string
    functions: number
  }
  cost: {
    current: number
    projected: number
    trend: 'increasing' | 'stable' | 'decreasing'
  }
}

// Project provider configuration
export interface ProjectProviderConfig {
  projectId: string
  provider: ProviderType
  config: ProviderConfig
  costBudget?: {
    monthly: number
    alerts: boolean
    hardLimit: boolean
  }
  autoScaling?: {
    enabled: boolean
    minInstances?: number
    maxInstances?: number
    targetUtilization?: number
  }
  backup?: {
    provider: ProviderType
    syncInterval?: string
    failoverAutomatic: boolean
  }
  monitoring?: {
    enabled: boolean
    alertChannels: string[]
    metrics: string[]
  }
}