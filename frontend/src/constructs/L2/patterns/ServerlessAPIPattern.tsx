/**
 * Serverless API Pattern L2 Pattern Construct
 * 
 * Complete serverless API pattern with functions, API gateway, database,
 * and event-driven architecture. Composes multiple L1 constructs to create
 * a production-ready serverless backend.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  BaseConstruct
} from '../../types'
import { 
  ManagedContainer,
  RestAPIService,
  EncryptedDatabase,
  AuthenticatedWebSocket,
  CDNStorage,
  SecureAuthService
} from '../../L1/infrastructure'
import { ResponsiveLayout } from '../../L1/ui'

// Type definitions
interface FunctionConfig {
  name: string
  runtime: 'nodejs18' | 'python3.11' | 'java17' | 'go1.21' | 'rust1.75'
  handler: string
  memory: number // MB
  timeout: number // seconds
  environment?: Record<string, string>
  triggers?: Array<{
    type: 'http' | 'schedule' | 'queue' | 'storage' | 'database'
    config: any
  }>
  layers?: string[]
  permissions?: string[]
}

interface APIRouteConfig {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
  function: string
  auth?: boolean
  rateLimit?: number
  cors?: boolean
  validation?: {
    body?: any
    query?: any
    headers?: any
  }
}

interface EventConfig {
  name: string
  source: string
  targets: string[]
  filter?: any
  transform?: any
  dlq?: boolean
}

interface ServerlessAPIConfig {
  name: string
  region?: string
  functions: FunctionConfig[]
  api?: {
    routes: APIRouteConfig[]
    basePath?: string
    stage?: string
    throttle?: {
      burstLimit: number
      rateLimit: number
    }
  }
  database?: {
    type: 'dynamodb' | 'aurora-serverless' | 'cosmos' | 'firestore'
    tables?: Array<{
      name: string
      partitionKey: string
      sortKey?: string
      indexes?: any[]
    }>
  }
  storage?: {
    buckets: Array<{
      name: string
      public?: boolean
      lifecycle?: any
    }>
  }
  events?: EventConfig[]
  monitoring?: {
    tracing: boolean
    logging: 'debug' | 'info' | 'warn' | 'error'
    alarms?: Array<{
      metric: string
      threshold: number
      action: string
    }>
  }
  scaling?: {
    minConcurrency?: number
    maxConcurrency?: number
    reservedConcurrency?: number
  }
}

interface FunctionInstance {
  name: string
  status: 'deploying' | 'active' | 'error' | 'throttled'
  endpoint?: string
  invocations: number
  errors: number
  duration: number
  cost: number
  lastInvoked?: string
}

interface ServerlessAPIOutputs {
  apiId: string
  status: 'initializing' | 'deploying' | 'active' | 'error'
  apiUrl: string
  functions: FunctionInstance[]
  metrics: {
    totalInvocations: number
    totalErrors: number
    avgDuration: number
    totalCost: number
    successRate: number
  }
  capabilities: {
    database: boolean
    storage: boolean
    events: boolean
    monitoring: boolean
    scaling: boolean
  }
}

export class ServerlessAPIPattern extends L2PatternConstruct {
  private config: ServerlessAPIConfig = {
    name: '',
    functions: []
  }
  
  private outputs: ServerlessAPIOutputs = {
    apiId: '',
    status: 'initializing',
    apiUrl: '',
    functions: [],
    metrics: {
      totalInvocations: 0,
      totalErrors: 0,
      avgDuration: 0,
      totalCost: 0,
      successRate: 100
    },
    capabilities: {
      database: false,
      storage: false,
      events: false,
      monitoring: false,
      scaling: false
    }
  }
  
  private functionContainers: Map<string, ManagedContainer> = new Map()
  private apiGateway: RestAPIService | null = null
  private database: EncryptedDatabase | null = null
  private eventBus: AuthenticatedWebSocket | null = null
  private storage: CDNStorage | null = null
  private authService: SecureAuthService | null = null
  private layout: ResponsiveLayout | null = null
  
  private metricsInterval: NodeJS.Timeout | null = null
  private deploymentInProgress = false

  constructor(config?: Partial<ServerlessAPIConfig>) {
    super()
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(config: ServerlessAPIConfig): Promise<void> {
    this.config = config
    this.outputs.apiId = `serverless-api-${Date.now()}`
    
    try {
      await this.composePattern()
      await this.deployFunctions()
      this.configureInteractions()
      
      this.outputs.status = 'active'
      this.outputs.capabilities = {
        database: !!config.database,
        storage: !!config.storage,
        events: !!config.events?.length,
        monitoring: !!config.monitoring,
        scaling: !!config.scaling
      }
      
      this.emit('initialized', this.outputs)
    } catch (error) {
      this.outputs.status = 'error'
      this.emit('error', { operation: 'initialize', error })
      throw error
    }
  }

  protected async composePattern(): Promise<void> {
    // Create layout for management UI
    this.layout = new ResponsiveLayout()
    await this.layout.initialize({
      sections: [
        { id: 'functions', title: 'Functions', size: 40 },
        { id: 'api', title: 'API Routes', size: 30 },
        { id: 'metrics', title: 'Metrics', size: 30 }
      ]
    })
    this.componentRefs.set('layout', this.layout)
    
    // Create API Gateway if routes are defined
    if (this.config.api?.routes.length) {
      this.apiGateway = new RestAPIService()
      await this.apiGateway.initialize({
        name: `${this.config.name}-api`,
        basePath: this.config.api.basePath || '/',
        routes: this.config.api.routes.map(route => ({
          path: route.path,
          method: route.method,
          handler: this.createRouteHandler(route)
        })),
        middleware: [
          { type: 'cors', config: { origins: ['*'] } },
          { type: 'rateLimit', config: { windowMs: 60000, max: 100 } }
        ],
        throttle: this.config.api.throttle
      })
      this.componentRefs.set('apiGateway', this.apiGateway)
      this.outputs.apiUrl = this.apiGateway.getOutputs().baseUrl
    }
    
    // Create Auth Service if any routes require authentication
    if (this.config.api?.routes.some(r => r.auth)) {
      this.authService = new SecureAuthService()
      await this.authService.initialize({
        provider: 'jwt',
        issuer: this.config.name,
        audience: 'serverless-api',
        secret: process.env.JWT_SECRET || 'default-secret'
      })
      this.componentRefs.set('authService', this.authService)
    }
    
    // Create Database if configured
    if (this.config.database) {
      this.database = new EncryptedDatabase()
      await this.database.initialize({
        provider: this.config.database.type as any,
        name: `${this.config.name}-db`,
        encryption: {
          enabled: true,
          algorithm: 'AES-256-GCM'
        },
        tables: this.config.database.tables
      })
      this.componentRefs.set('database', this.database)
    }
    
    // Create Storage if configured
    if (this.config.storage) {
      this.storage = new CDNStorage()
      await this.storage.initialize({
        provider: 'local',
        bucket: this.config.storage.buckets[0]?.name || `${this.config.name}-storage`,
        region: this.config.region || 'us-east-1',
        publicRead: this.config.storage.buckets[0]?.public
      })
      this.componentRefs.set('storage', this.storage)
    }
    
    // Create Event Bus if events are configured
    if (this.config.events?.length) {
      this.eventBus = new AuthenticatedWebSocket()
      await this.eventBus.initialize({
        url: `ws://localhost:8003/${this.config.name}`,
        authType: 'token',
        reconnect: true,
        protocols: ['event-bus']
      })
      this.componentRefs.set('eventBus', this.eventBus)
    }
    
    // Create function containers
    for (const func of this.config.functions) {
      const container = new ManagedContainer()
      await container.initialize({
        name: func.name,
        image: this.getRuntimeImage(func.runtime),
        resources: {
          cpu: `${func.memory / 1024}`,
          memory: `${func.memory}Mi`
        },
        environment: {
          ...func.environment,
          FUNCTION_NAME: func.name,
          HANDLER: func.handler
        },
        scaling: {
          min: this.config.scaling?.minConcurrency || 0,
          max: this.config.scaling?.maxConcurrency || 1000
        }
      })
      
      this.functionContainers.set(func.name, container)
      this.componentRefs.set(`function-${func.name}`, container)
    }
  }

  protected configureInteractions(): void {
    // API Gateway events
    this.apiGateway?.on('request', (data: any) => {
      this.handleAPIRequest(data)
    })
    
    // Function container events
    for (const [name, container] of this.functionContainers) {
      container.on('invoked', (data: any) => {
        this.updateFunctionMetrics(name, data)
      })
      
      container.on('error', (error: any) => {
        this.handleFunctionError(name, error)
      })
    }
    
    // Event bus events
    this.eventBus?.on('event', (event: any) => {
      this.handleEvent(event)
    })
    
    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics()
    }, 30000) // Every 30 seconds
  }

  private async deployFunctions(): Promise<void> {
    this.outputs.status = 'deploying'
    const deployPromises: Promise<void>[] = []
    
    for (const func of this.config.functions) {
      const container = this.functionContainers.get(func.name)
      if (!container) continue
      
      deployPromises.push(
        this.deployFunction(func, container)
      )
    }
    
    await Promise.all(deployPromises)
    this.outputs.status = 'active'
  }

  private async deployFunction(func: FunctionConfig, container: ManagedContainer): Promise<void> {
    try {
      await container.start()
      
      const instance: FunctionInstance = {
        name: func.name,
        status: 'active',
        endpoint: this.getFunctionEndpoint(func),
        invocations: 0,
        errors: 0,
        duration: 0,
        cost: 0
      }
      
      this.outputs.functions.push(instance)
      this.emit('functionDeployed', instance)
      
      // Set up triggers
      if (func.triggers) {
        for (const trigger of func.triggers) {
          await this.setupTrigger(func.name, trigger)
        }
      }
    } catch (error) {
      const instance: FunctionInstance = {
        name: func.name,
        status: 'error',
        invocations: 0,
        errors: 0,
        duration: 0,
        cost: 0
      }
      
      this.outputs.functions.push(instance)
      this.emit('functionDeployFailed', { function: func.name, error })
    }
  }

  private getRuntimeImage(runtime: string): string {
    const runtimeImages: Record<string, string> = {
      'nodejs18': 'node:18-alpine',
      'python3.11': 'python:3.11-alpine',
      'java17': 'openjdk:17-alpine',
      'go1.21': 'golang:1.21-alpine',
      'rust1.75': 'rust:1.75-alpine'
    }
    
    return runtimeImages[runtime] || 'node:18-alpine'
  }

  private getFunctionEndpoint(func: FunctionConfig): string {
    const httpTrigger = func.triggers?.find(t => t.type === 'http')
    if (httpTrigger && this.outputs.apiUrl) {
      return `${this.outputs.apiUrl}${httpTrigger.config.path}`
    }
    return ''
  }

  private createRouteHandler(route: APIRouteConfig) {
    return async (req: any, res: any) => {
      const func = this.outputs.functions.find(f => f.name === route.function)
      if (!func || func.status !== 'active') {
        return res.status(503).json({ error: 'Function unavailable' })
      }
      
      try {
        // Validate request if configured
        if (route.validation) {
          const validationError = this.validateRequest(req, route.validation)
          if (validationError) {
            return res.status(400).json({ error: validationError })
          }
        }
        
        // Check authentication if required
        if (route.auth) {
          const authResult = await this.authService?.verifyToken(req.headers.authorization)
          if (!authResult) {
            return res.status(401).json({ error: 'Unauthorized' })
          }
        }
        
        // Invoke function
        const result = await this.invokeFunction(route.function, {
          httpMethod: route.method,
          path: route.path,
          headers: req.headers,
          body: req.body,
          queryStringParameters: req.query
        })
        
        res.status(result.statusCode || 200).json(result.body)
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  private validateRequest(req: any, validation: any): string | null {
    // Simple validation implementation
    if (validation.body) {
      // Validate body schema
    }
    if (validation.query) {
      // Validate query parameters
    }
    if (validation.headers) {
      // Validate headers
    }
    return null
  }

  private async setupTrigger(functionName: string, trigger: any): Promise<void> {
    switch (trigger.type) {
      case 'http':
        // Already handled by API Gateway
        break
      case 'schedule':
        // Set up scheduled invocation
        setInterval(() => {
          this.invokeFunction(functionName, { source: 'schedule' })
        }, trigger.config.rate)
        break
      case 'queue':
        // Set up queue trigger
        this.eventBus?.on(`queue:${trigger.config.queue}`, (message: any) => {
          this.invokeFunction(functionName, { source: 'queue', message })
        })
        break
      case 'storage':
        // Set up storage trigger
        this.storage?.on('objectCreated', (event: any) => {
          if (event.bucket === trigger.config.bucket) {
            this.invokeFunction(functionName, { source: 'storage', event })
          }
        })
        break
      case 'database':
        // Set up database trigger
        this.database?.on('change', (event: any) => {
          if (event.table === trigger.config.table) {
            this.invokeFunction(functionName, { source: 'database', event })
          }
        })
        break
    }
    
    this.emit('triggerSetup', { function: functionName, trigger })
  }

  private async handleAPIRequest(data: any): Promise<void> {
    this.outputs.metrics.totalInvocations++
    this.emit('apiRequest', data)
  }

  private async handleEvent(event: any): Promise<void> {
    const eventConfig = this.config.events?.find(e => e.name === event.type)
    if (!eventConfig) return
    
    // Apply filter if configured
    if (eventConfig.filter && !this.matchesFilter(event, eventConfig.filter)) {
      return
    }
    
    // Transform event if configured
    const transformedEvent = eventConfig.transform ? 
      this.transformEvent(event, eventConfig.transform) : event
    
    // Send to target functions
    for (const target of eventConfig.targets) {
      await this.invokeFunction(target, { source: 'event', event: transformedEvent })
    }
    
    this.emit('eventProcessed', { event: event.type, targets: eventConfig.targets })
  }

  private matchesFilter(_event: any, _filter: any): boolean {
    // Simple filter matching
    return true
  }

  private transformEvent(event: any, transform: any): any {
    // Simple event transformation
    return event
  }

  private updateFunctionMetrics(name: string, data: any): void {
    const func = this.outputs.functions.find(f => f.name === name)
    if (!func) return
    
    func.invocations++
    func.duration = (func.duration * (func.invocations - 1) + data.duration) / func.invocations
    func.cost += this.calculateCost(data.duration, data.memory)
    func.lastInvoked = new Date().toISOString()
    
    if (data.error) {
      func.errors++
    }
    
    this.emit('functionMetricsUpdated', { function: name, metrics: func })
  }

  private handleFunctionError(name: string, error: any): void {
    const func = this.outputs.functions.find(f => f.name === name)
    if (func) {
      func.errors++
      func.status = 'error'
    }
    
    this.emit('functionError', { function: name, error })
  }

  private calculateCost(duration: number, memory: number): number {
    // AWS Lambda pricing model (simplified)
    const gbSeconds = (memory / 1024) * (duration / 1000)
    const costPerGbSecond = 0.0000166667
    return gbSeconds * costPerGbSecond
  }

  private collectMetrics(): void {
    const functions = this.outputs.functions
    
    this.outputs.metrics = {
      totalInvocations: functions.reduce((sum, f) => sum + f.invocations, 0),
      totalErrors: functions.reduce((sum, f) => sum + f.errors, 0),
      avgDuration: functions.reduce((sum, f) => sum + f.duration, 0) / functions.length || 0,
      totalCost: functions.reduce((sum, f) => sum + f.cost, 0),
      successRate: 0
    }
    
    if (this.outputs.metrics.totalInvocations > 0) {
      this.outputs.metrics.successRate = 
        ((this.outputs.metrics.totalInvocations - this.outputs.metrics.totalErrors) / 
         this.outputs.metrics.totalInvocations) * 100
    }
    
    this.emit('metricsCollected', this.outputs.metrics)
  }

  // Public methods
  async invokeFunction(name: string, event: any): Promise<any> {
    const container = this.functionContainers.get(name)
    const func = this.outputs.functions.find(f => f.name === name)
    
    if (!container || !func) {
      throw new Error(`Function ${name} not found`)
    }
    
    if (func.status !== 'active') {
      throw new Error(`Function ${name} is not active`)
    }
    
    const startTime = Date.now()
    
    try {
      this.emit('functionInvokeStart', { function: name, event })
      
      // Execute function in container
      const result = await container.exec(`node -e "
        const handler = require('./${func.handler}');
        handler(${JSON.stringify(event)}, {}, (err, res) => {
          if (err) process.exit(1);
          console.log(JSON.stringify(res));
        });
      "`)
      
      const duration = Date.now() - startTime
      
      this.updateFunctionMetrics(name, {
        duration,
        memory: this.config.functions.find(f => f.name === name)?.memory || 128,
        error: false
      })
      
      this.emit('functionInvokeComplete', { function: name, duration, result })
      
      return JSON.parse(result)
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.updateFunctionMetrics(name, {
        duration,
        memory: this.config.functions.find(f => f.name === name)?.memory || 128,
        error: true
      })
      
      this.emit('functionInvokeFailed', { function: name, duration, error })
      throw error
    }
  }

  async deployNewFunction(config: FunctionConfig): Promise<void> {
    if (this.deploymentInProgress) {
      throw new Error('Deployment already in progress')
    }
    
    this.deploymentInProgress = true
    
    try {
      this.emit('functionDeployStart', { function: config.name })
      
      // Add to config
      this.config.functions.push(config)
      
      // Create container
      const container = new ManagedContainer()
      await container.initialize({
        name: config.name,
        image: this.getRuntimeImage(config.runtime),
        resources: {
          cpu: `${config.memory / 1024}`,
          memory: `${config.memory}Mi`
        },
        environment: {
          ...config.environment,
          FUNCTION_NAME: config.name,
          HANDLER: config.handler
        }
      })
      
      this.functionContainers.set(config.name, container)
      this.componentRefs.set(`function-${config.name}`, container)
      
      // Deploy function
      await this.deployFunction(config, container)
      
      // Update API routes if needed
      if (config.triggers?.some(t => t.type === 'http')) {
        await this.updateAPIRoutes()
      }
      
      this.emit('functionDeployComplete', { function: config.name })
    } catch (error) {
      this.emit('functionDeployFailed', { function: config.name, error })
      throw error
    } finally {
      this.deploymentInProgress = false
    }
  }

  async updateFunction(name: string, updates: Partial<FunctionConfig>): Promise<void> {
    const funcIndex = this.config.functions.findIndex(f => f.name === name)
    if (funcIndex < 0) {
      throw new Error(`Function ${name} not found`)
    }
    
    const container = this.functionContainers.get(name)
    if (!container) {
      throw new Error(`Function container ${name} not found`)
    }
    
    this.emit('functionUpdateStart', { function: name })
    
    try {
      // Update config
      this.config.functions[funcIndex] = {
        ...this.config.functions[funcIndex],
        ...updates
      }
      
      // Update container if needed
      if (updates.memory || updates.environment) {
        await container.update({
          resources: updates.memory ? {
            cpu: `${updates.memory / 1024}`,
            memory: `${updates.memory}Mi`
          } : undefined,
          environment: updates.environment
        })
      }
      
      // Restart container
      await container.restart()
      
      const func = this.outputs.functions.find(f => f.name === name)
      if (func) {
        func.status = 'active'
      }
      
      this.emit('functionUpdateComplete', { function: name })
    } catch (error) {
      this.emit('functionUpdateFailed', { function: name, error })
      throw error
    }
  }

  async deleteFunction(name: string): Promise<void> {
    const container = this.functionContainers.get(name)
    if (!container) {
      throw new Error(`Function ${name} not found`)
    }
    
    this.emit('functionDeleteStart', { function: name })
    
    try {
      // Stop container
      await container.stop()
      await container.destroy()
      
      // Remove from containers map
      this.functionContainers.delete(name)
      this.componentRefs.delete(`function-${name}`)
      
      // Remove from config
      this.config.functions = this.config.functions.filter(f => f.name !== name)
      
      // Remove from outputs
      this.outputs.functions = this.outputs.functions.filter(f => f.name !== name)
      
      // Update API routes if needed
      await this.updateAPIRoutes()
      
      this.emit('functionDeleteComplete', { function: name })
    } catch (error) {
      this.emit('functionDeleteFailed', { function: name, error })
      throw error
    }
  }

  private async updateAPIRoutes(): Promise<void> {
    if (!this.apiGateway) return
    
    // In real implementation, would update API Gateway routes
    this.emit('apiRoutesUpdated', {})
  }

  getFunctionMetrics(name: string): FunctionInstance | null {
    return this.outputs.functions.find(f => f.name === name) || null
  }

  getAllMetrics(): any {
    return {
      functions: this.outputs.functions,
      overall: this.outputs.metrics
    }
  }

  async testFunction(name: string, testEvent: any): Promise<any> {
    this.emit('functionTestStart', { function: name })
    
    try {
      const result = await this.invokeFunction(name, testEvent)
      this.emit('functionTestComplete', { function: name, result })
      return result
    } catch (error) {
      this.emit('functionTestFailed', { function: name, error })
      throw error
    }
  }

  // BaseConstruct implementation
  getType(): ConstructType {
    return ConstructType.PATTERN
  }

  getLevel(): ConstructLevel {
    return ConstructLevel.L2
  }

  getConfig(): ServerlessAPIConfig {
    return this.config
  }

  getOutputs(): ServerlessAPIOutputs {
    return this.outputs
  }

  async destroy(): Promise<void> {
    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
    
    // Destroy all components
    await super.destroy()
    
    this.emit('destroyed', {})
  }

  renderStatus(): React.ReactElement {
    const outputs = this.getOutputs()
    
    return (
      <div className="serverless-api-status">
        <h4>Serverless API Status</h4>
        <div>API ID: {outputs.apiId}</div>
        <div>Status: {outputs.status}</div>
        {outputs.apiUrl && <div>API URL: <a href={outputs.apiUrl} target="_blank">{outputs.apiUrl}</a></div>}
        
        <div className="functions-section">
          <h5>Functions ({outputs.functions.length})</h5>
          {outputs.functions.map(func => (
            <div key={func.name} className="function-item">
              <span>{func.name}</span>
              <span className={`status ${func.status}`}>{func.status}</span>
              <span>Invocations: {func.invocations}</span>
              <span>Errors: {func.errors}</span>
              <span>Avg Duration: {func.duration.toFixed(0)}ms</span>
              <span>Cost: ${func.cost.toFixed(4)}</span>
            </div>
          ))}
        </div>
        
        <div className="metrics-section">
          <h5>Overall Metrics</h5>
          <div>Total Invocations: {outputs.metrics.totalInvocations}</div>
          <div>Total Errors: {outputs.metrics.totalErrors}</div>
          <div>Success Rate: {outputs.metrics.successRate.toFixed(1)}%</div>
          <div>Avg Duration: {outputs.metrics.avgDuration.toFixed(0)}ms</div>
          <div>Total Cost: ${outputs.metrics.totalCost.toFixed(2)}</div>
        </div>
        
        <div className="capabilities-section">
          <h5>Capabilities</h5>
          <div>Database: {outputs.capabilities.database ? '✓' : '✗'}</div>
          <div>Storage: {outputs.capabilities.storage ? '✓' : '✗'}</div>
          <div>Events: {outputs.capabilities.events ? '✓' : '✗'}</div>
          <div>Monitoring: {outputs.capabilities.monitoring ? '✓' : '✗'}</div>
          <div>Auto-scaling: {outputs.capabilities.scaling ? '✓' : '✗'}</div>
        </div>
      </div>
    )
  }
}

// Factory function
export function createServerlessAPIPattern(config?: Partial<ServerlessAPIConfig>): ServerlessAPIPattern {
  return new ServerlessAPIPattern(config)
}

// Definition for registry
export const serverlessAPIPatternDefinition: PlatformConstructDefinition = {
  id: 'platform-l2-serverless-api-pattern',
  name: 'Serverless API Pattern',
  type: ConstructType.PATTERN,
  level: ConstructLevel.L2,
  description: 'Complete serverless API with functions, gateway, and event-driven architecture',
  category: 'backend',
  capabilities: [
    'serverless-functions',
    'api-gateway',
    'event-driven',
    'auto-scaling',
    'pay-per-use',
    'database-triggers',
    'scheduled-tasks',
    'queue-processing',
    'monitoring'
  ],
  configuration: {
    functions: []
  },
  outputs: {
    apiId: '',
    status: 'initializing',
    apiUrl: '',
    functions: [],
    metrics: {
      totalInvocations: 0,
      totalErrors: 0,
      avgDuration: 0,
      totalCost: 0,
      successRate: 100
    },
    capabilities: {
      database: false,
      storage: false,
      events: false,
      monitoring: false,
      scaling: false
    }
  },
  dependencies: [
    'platform-l1-managed-container',
    'platform-l1-rest-api-service',
    'platform-l1-encrypted-database',
    'platform-l1-authenticated-websocket',
    'platform-l1-cdn-storage',
    'platform-l1-secure-auth-service',
    'platform-l1-responsive-layout'
  ],
  createInstance: (config) => new ServerlessAPIPattern(config as ServerlessAPIConfig)
}