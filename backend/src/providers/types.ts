/**
 * Common interfaces for all backend providers (Firebase, AWS, Local)
 */

// Provider types
export type ProviderType = 'firebase' | 'aws' | 'local'

// Common user interface
export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

// Authentication interfaces
export interface AuthProvider {
  signUp(email: string, password: string, name?: string): Promise<{ user: User; token: string }>
  signIn(email: string, password: string): Promise<{ user: User; token: string }>
  signOut(userId: string): Promise<void>
  verifyToken(token: string): Promise<User>
  getCurrentUser(token: string): Promise<User | null>
  updateUser(userId: string, updates: Partial<User>): Promise<User>
  deleteUser(userId: string): Promise<void>
  
  // Optional lifecycle methods
  initialize?(): Promise<void>
  shutdown?(): Promise<void>
  healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

// Database interfaces
export interface DatabaseProvider {
  // Generic CRUD operations
  create<T>(collection: string, data: Omit<T, 'id'>): Promise<T & { id: string }>
  get<T>(collection: string, id: string): Promise<T | null>
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>
  delete(collection: string, id: string): Promise<void>
  
  // Query operations
  list<T>(collection: string, options?: QueryOptions): Promise<QueryResult<T>>
  query<T>(collection: string, filters: QueryFilter[]): Promise<T[]>
  
  // Batch operations
  batchCreate<T>(collection: string, items: Omit<T, 'id'>[]): Promise<(T & { id: string })[]>
  batchUpdate<T>(collection: string, updates: { id: string; data: Partial<T> }[]): Promise<void>
  batchDelete(collection: string, ids: string[]): Promise<void>
  
  // Transactions
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>
  
  // Optional lifecycle methods
  initialize?(): Promise<void>
  shutdown?(): Promise<void>
  healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: { field: string; direction: 'asc' | 'desc' }[]
  startAfter?: any
  endBefore?: any
}

export interface QueryFilter {
  field: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'contains' | 'array-contains'
  value: any
}

export interface QueryResult<T> {
  items: T[]
  total?: number
  nextPageToken?: string
}

export interface Transaction {
  get<T>(collection: string, id: string): Promise<T | null>
  create<T>(collection: string, data: Omit<T, 'id'>): void
  update<T>(collection: string, id: string, data: Partial<T>): void
  delete(collection: string, id: string): void
}

// Storage interfaces
export interface StorageProvider {
  upload(path: string, file: Buffer | Uint8Array, metadata?: FileMetadata): Promise<FileInfo>
  download(path: string): Promise<Buffer>
  getUrl(path: string, options?: { expiresIn?: number }): Promise<string>
  delete(path: string): Promise<void>
  list(prefix: string, options?: { maxResults?: number; pageToken?: string }): Promise<FileListResult>
  move(sourcePath: string, destinationPath: string): Promise<void>
  copy(sourcePath: string, destinationPath: string): Promise<void>
  getMetadata(path: string): Promise<FileInfo>
  
  // Optional lifecycle methods
  initialize?(): Promise<void>
  shutdown?(): Promise<void>
  healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

export interface FileMetadata {
  contentType?: string
  contentEncoding?: string
  cacheControl?: string
  metadata?: Record<string, string>
}

export interface FileInfo {
  path: string
  size: number
  contentType?: string
  etag?: string
  lastModified: Date
  metadata?: Record<string, string>
}

export interface FileListResult {
  files: FileInfo[]
  nextPageToken?: string
}

// Real-time interfaces
export interface RealtimeProvider {
  // WebSocket-like connections
  connect(userId: string): Promise<RealtimeConnection>
  
  // Pub/Sub
  subscribe(channel: string, callback: (message: any) => void): Promise<() => void>
  publish(channel: string, message: any): Promise<void>
  
  // Presence
  trackPresence(channel: string, userId: string, metadata?: any): Promise<() => void>
  getPresence(channel: string): Promise<PresenceInfo[]>
  
  // Optional lifecycle methods
  initialize?(): Promise<void>
  shutdown?(): Promise<void>
  healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

export interface RealtimeConnection {
  id: string
  send(message: any): Promise<void>
  onMessage(callback: (message: any) => void): void
  onDisconnect(callback: () => void): void
  disconnect(): Promise<void>
}

export interface PresenceInfo {
  userId: string
  connectedAt: Date
  metadata?: any
}

// Function/Lambda interfaces
export interface FunctionProvider {
  deploy(definition: FunctionDefinition, code: string): Promise<void>
  invoke(name: string, payload: any, options?: InvokeOptions): Promise<FunctionResult>
  list(): Promise<FunctionDefinition[]>
  get(name: string): Promise<FunctionDefinition | null>
  remove(name: string): Promise<void>
  getLogs(name: string, options?: LogOptions): Promise<string[]>
  getExecution(executionId: string): Promise<FunctionExecution | null>
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

export interface FunctionDefinition {
  name: string
  handler: string
  runtime?: string
  timeout?: number
  memory?: number
  environmentVariables?: Record<string, string>
  createdAt?: Date
  updatedAt?: Date
}

export interface FunctionResult {
  statusCode: number
  body: any
  headers: Record<string, string>
  executionId?: string
}

export interface FunctionExecution {
  id: string
  functionName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  startTime: Date
  endTime?: Date
  duration?: number
  result?: any
  error?: string
}

export interface InvokeOptions {
  timeout?: number
  retries?: number
}

export interface LogOptions {
  startTime?: Date
  endTime?: Date
  limit?: number
  filter?: string
}

export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  metadata?: any
}

// Email/Notification interfaces
export interface NotificationProvider {
  sendEmail(options: EmailOptions): Promise<{ id: string }>
  sendSMS(to: string, message: string): Promise<{ id: string }>
  sendPushNotification(userId: string, notification: PushNotification): Promise<{ id: string }>
}

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface PushNotification {
  title: string
  body: string
  data?: Record<string, any>
  icon?: string
  badge?: string
}

// Provider configuration
export interface ProviderConfig {
  type: ProviderType
  projectId: string
  region?: string
  credentials?: any
  endpoints?: Record<string, string>
  options?: Record<string, any>
}

// Deployment interfaces
export interface DeploymentProvider {
  // Deploy the Love Claude Code platform itself
  deployPlatform(config: PlatformDeployConfig): Promise<DeploymentResult>
  
  // Deploy a user's application
  deployApp(projectId: string, config: AppDeployConfig): Promise<DeploymentResult>
  
  // Get deployment status
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>
  
  // List deployments
  listDeployments(projectId?: string): Promise<DeploymentInfo[]>
  
  // Rollback a deployment
  rollback(deploymentId: string): Promise<void>
  
  // Get deployment logs
  getDeploymentLogs(deploymentId: string, options?: LogOptions): Promise<string[]>
  
  // Delete a deployment
  deleteDeployment(deploymentId: string): Promise<void>
  
  // Optional lifecycle methods
  initialize?(): Promise<void>
  shutdown?(): Promise<void>
  healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

export interface PlatformDeployConfig {
  environment: 'development' | 'staging' | 'production'
  version?: string
  frontend?: {
    domain?: string
    cdn?: boolean
  }
  backend?: {
    instances?: number
    memory?: number
    cpu?: number
  }
  database?: {
    backup?: boolean
    migrate?: boolean
  }
}

export interface AppDeployConfig {
  environment: 'development' | 'staging' | 'production'
  type: 'static' | 'api' | 'fullstack'
  source: {
    type: 'git' | 'upload' | 'build'
    path?: string
    branch?: string
    commit?: string
  }
  build?: {
    command?: string
    outputDir?: string
    environmentVariables?: Record<string, string>
  }
  runtime?: {
    engine?: 'nodejs' | 'python' | 'static'
    version?: string
  }
  resources?: {
    memory?: number
    cpu?: number
    timeout?: number
  }
  domain?: {
    custom?: string
    subdomain?: string
  }
  environmentVariables?: Record<string, string>
}

export interface DeploymentResult {
  deploymentId: string
  status: 'pending' | 'building' | 'deploying' | 'completed' | 'failed'
  url?: string
  customUrl?: string
  startTime: Date
  endTime?: Date
  logs?: string[]
  error?: string
}

export interface DeploymentStatus {
  deploymentId: string
  projectId?: string
  status: 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped'
  health?: 'healthy' | 'unhealthy' | 'unknown'
  url?: string
  customUrl?: string
  environment: string
  version?: string
  startTime: Date
  endTime?: Date
  lastUpdated: Date
  metrics?: {
    requests?: number
    errors?: number
    latency?: number
    uptime?: number
  }
}

export interface DeploymentInfo {
  deploymentId: string
  projectId?: string
  type: 'platform' | 'app'
  environment: string
  status: DeploymentStatus['status']
  url?: string
  createdAt: Date
  updatedAt: Date
}

// Main provider interface
export interface BackendProvider {
  type: ProviderType
  auth: AuthProvider
  database: DatabaseProvider
  storage: StorageProvider
  realtime: RealtimeProvider
  functions: FunctionProvider
  notifications?: NotificationProvider
  deployment?: DeploymentProvider
  
  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>
  shutdown(): Promise<void>
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}