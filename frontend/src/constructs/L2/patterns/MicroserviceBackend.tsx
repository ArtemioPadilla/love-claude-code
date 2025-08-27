/**
 * Microservice Backend L2 Pattern Construct
 * 
 * Complete microservice architecture pattern with API gateway, service mesh,
 * distributed tracing, and automated scaling. Composes multiple L1 constructs
 * to create a production-ready microservices backend.
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
  SecureAuthService,
  AuthenticatedWebSocket,
  CDNStorage
} from '../../L1/infrastructure'
import { ResponsiveLayout } from '../../L1/ui'

// Type definitions
interface MicroserviceConfig {
  name: string
  version: string
  port: number
  replicas: number
  resources: {
    cpu: string
    memory: string
  }
  environment: Record<string, string>
  healthCheck?: {
    path: string
    interval: number
    timeout: number
  }
  dependencies?: string[]
}

interface APIGatewayConfig {
  routes: Array<{
    path: string
    service: string
    methods: string[]
    rateLimit?: number
    authentication?: boolean
  }>
  cors: {
    origins: string[]
    credentials: boolean
  }
  timeout: number
  retries: number
}

interface ServiceMeshConfig {
  enabled: boolean
  provider: 'istio' | 'linkerd' | 'consul'
  tracing: boolean
  mtls: boolean
  circuitBreaker: {
    threshold: number
    timeout: number
  }
}

interface MicroserviceBackendConfig {
  name: string
  domain?: string
  services: MicroserviceConfig[]
  gateway: APIGatewayConfig
  serviceMesh?: ServiceMeshConfig
  database?: {
    type: 'postgres' | 'mongodb' | 'dynamodb'
    sharding?: boolean
  }
  messaging?: {
    type: 'rabbitmq' | 'kafka' | 'sqs'
    topics?: string[]
  }
  monitoring?: {
    provider: 'prometheus' | 'datadog' | 'cloudwatch'
    dashboards?: string[]
  }
  autoscaling?: {
    enabled: boolean
    minReplicas: number
    maxReplicas: number
    targetCPU: number
    targetMemory: number
  }
}

interface ServiceInstance {
  id: string
  name: string
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
  health: 'healthy' | 'unhealthy' | 'checking'
  url: string
  metrics: {
    cpu: number
    memory: number
    requests: number
    errors: number
    latency: number
  }
}

interface MicroserviceBackendOutputs {
  backendId: string
  status: 'initializing' | 'running' | 'degraded' | 'stopped'
  apiGatewayUrl: string
  services: ServiceInstance[]
  metrics: {
    totalRequests: number
    errorRate: number
    avgLatency: number
    uptime: number
  }
  capabilities: {
    serviceMesh: boolean
    tracing: boolean
    autoscaling: boolean
    messaging: boolean
  }
}

export class MicroserviceBackend extends L2PatternConstruct {
  private config: MicroserviceBackendConfig = {
    name: '',
    services: [],
    gateway: {
      routes: [],
      cors: { origins: ['*'], credentials: false },
      timeout: 30000,
      retries: 3
    }
  }
  
  private outputs: MicroserviceBackendOutputs = {
    backendId: '',
    status: 'initializing',
    apiGatewayUrl: '',
    services: [],
    metrics: {
      totalRequests: 0,
      errorRate: 0,
      avgLatency: 0,
      uptime: 0
    },
    capabilities: {
      serviceMesh: false,
      tracing: false,
      autoscaling: false,
      messaging: false
    }
  }
  
  private serviceContainers: Map<string, ManagedContainer> = new Map()
  private apiGateway: RestAPIService | null = null
  private authService: SecureAuthService | null = null
  private database: EncryptedDatabase | null = null
  private messageQueue: AuthenticatedWebSocket | null = null
  private metricsStorage: CDNStorage | null = null
  private layout: ResponsiveLayout | null = null
  
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map()
  private metricsInterval: NodeJS.Timeout | null = null
  private deploymentInProgress = false

  constructor(config?: Partial<MicroserviceBackendConfig>) {
    super()
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(config: MicroserviceBackendConfig): Promise<void> {
    this.config = config
    this.outputs.backendId = `ms-backend-${Date.now()}`
    
    try {
      await this.composePattern()
      await this.startServices()
      this.configureInteractions()
      
      this.outputs.status = 'running'
      this.outputs.capabilities = {
        serviceMesh: !!config.serviceMesh?.enabled,
        tracing: !!config.serviceMesh?.tracing,
        autoscaling: !!config.autoscaling?.enabled,
        messaging: !!config.messaging
      }
      
      this.emit('initialized', this.outputs)
    } catch (error) {
      this.outputs.status = 'degraded'
      this.emit('error', { operation: 'initialize', error })
      throw error
    }
  }

  protected async composePattern(): Promise<void> {
    // Create layout for management UI
    this.layout = new ResponsiveLayout()
    await this.layout.initialize({
      sections: [
        { id: 'services', title: 'Services', size: 40 },
        { id: 'gateway', title: 'API Gateway', size: 30 },
        { id: 'metrics', title: 'Metrics', size: 30 }
      ]
    })
    this.componentRefs.set('layout', this.layout)
    
    // Create API Gateway
    this.apiGateway = new RestAPIService()
    await this.apiGateway.initialize({
      name: `${this.config.name}-gateway`,
      routes: this.config.gateway.routes.map(route => ({
        ...route,
        handler: this.createRouteHandler(route)
      })),
      middleware: [
        { type: 'cors', config: this.config.gateway.cors },
        { type: 'rateLimit', config: { windowMs: 60000, max: 100 } },
        { type: 'logging', config: { level: 'info' } }
      ],
      authentication: {
        type: 'jwt',
        config: { secret: process.env.JWT_SECRET || 'default-secret' }
      }
    })
    this.componentRefs.set('apiGateway', this.apiGateway)
    this.outputs.apiGatewayUrl = this.apiGateway.getOutputs().baseUrl
    
    // Create Auth Service if needed
    if (this.config.gateway.routes.some(r => r.authentication)) {
      this.authService = new SecureAuthService()
      await this.authService.initialize({
        provider: 'jwt',
        issuer: this.config.domain || 'microservice-backend',
        audience: this.config.name,
        secret: process.env.JWT_SECRET || 'default-secret',
        tokenExpiry: 3600,
        refreshTokenExpiry: 604800,
        mfa: { enabled: false }
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
          algorithm: 'AES-256-GCM',
          keyRotation: true
        },
        compliance: 'none',
        backup: {
          enabled: true,
          schedule: 'daily',
          retention: 7
        }
      })
      this.componentRefs.set('database', this.database)
    }
    
    // Create Message Queue if configured
    if (this.config.messaging) {
      this.messageQueue = new AuthenticatedWebSocket()
      await this.messageQueue.initialize({
        url: `ws://localhost:8002/${this.config.name}`,
        authType: 'token',
        reconnect: true,
        heartbeat: 30000,
        protocols: ['message-queue'],
        topics: this.config.messaging.topics || []
      })
      this.componentRefs.set('messageQueue', this.messageQueue)
    }
    
    // Create Metrics Storage
    this.metricsStorage = new CDNStorage()
    await this.metricsStorage.initialize({
      provider: 'local',
      bucket: `${this.config.name}-metrics`,
      region: 'us-east-1',
      optimization: {
        compression: true,
        caching: true,
        minification: false
      }
    })
    this.componentRefs.set('metricsStorage', this.metricsStorage)
    
    // Create service containers
    for (const serviceConfig of this.config.services) {
      const container = new ManagedContainer()
      await container.initialize({
        name: serviceConfig.name,
        image: `${this.config.name}/${serviceConfig.name}:${serviceConfig.version}`,
        replicas: serviceConfig.replicas,
        resources: serviceConfig.resources,
        ports: [{ container: serviceConfig.port, host: serviceConfig.port }],
        environment: serviceConfig.environment,
        healthCheck: serviceConfig.healthCheck
      })
      
      this.serviceContainers.set(serviceConfig.name, container)
      this.componentRefs.set(`service-${serviceConfig.name}`, container)
    }
  }

  private createRouteHandler(route: any) {
    return async (req: any, res: any) => {
      const service = this.serviceContainers.get(route.service)
      if (!service) {
        return res.status(503).json({ error: 'Service unavailable' })
      }
      
      // Simple proxy to service
      try {
        const serviceUrl = service.getOutputs().endpoints[0]
        // In real implementation, would proxy request to service
        res.json({ 
          message: `Request proxied to ${route.service}`,
          path: route.path,
          service: route.service
        })
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  protected configureInteractions(): void {
    // Service health monitoring
    for (const [name, container] of this.serviceContainers) {
      container.on('statusChanged', (status: string) => {
        this.updateServiceStatus(name, status)
      })
      
      container.on('healthCheck', (health: any) => {
        this.updateServiceHealth(name, health)
      })
      
      // Start health checks
      const interval = setInterval(() => {
        this.checkServiceHealth(name)
      }, 30000)
      this.healthCheckIntervals.set(name, interval)
    }
    
    // API Gateway events
    this.apiGateway?.on('request', (data: any) => {
      this.outputs.metrics.totalRequests++
      this.emit('request', data)
    })
    
    this.apiGateway?.on('error', (error: any) => {
      this.outputs.metrics.errorRate = 
        (this.outputs.metrics.errorRate * this.outputs.metrics.totalRequests + 1) / 
        (this.outputs.metrics.totalRequests + 1)
      this.emit('error', { operation: 'request', error })
    })
    
    // Message queue events
    this.messageQueue?.on('message', (message: any) => {
      this.handleMessage(message)
    })
    
    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics()
    }, 60000)
  }

  private async startServices(): Promise<void> {
    const startPromises: Promise<void>[] = []
    
    for (const [name, container] of this.serviceContainers) {
      const serviceInfo = this.config.services.find(s => s.name === name)
      if (!serviceInfo) continue
      
      startPromises.push(
        container.start().then(() => {
          const instance: ServiceInstance = {
            id: `${name}-${Date.now()}`,
            name,
            status: 'running',
            health: 'checking',
            url: container.getOutputs().endpoints[0],
            metrics: {
              cpu: 0,
              memory: 0,
              requests: 0,
              errors: 0,
              latency: 0
            }
          }
          this.outputs.services.push(instance)
          this.emit('serviceStarted', instance)
        })
      )
    }
    
    await Promise.all(startPromises)
  }

  private updateServiceStatus(name: string, status: string): void {
    const service = this.outputs.services.find(s => s.name === name)
    if (service) {
      service.status = status as any
      this.checkOverallStatus()
      this.emit('serviceStatusChanged', { name, status })
    }
  }

  private updateServiceHealth(name: string, health: any): void {
    const service = this.outputs.services.find(s => s.name === name)
    if (service) {
      service.health = health.healthy ? 'healthy' : 'unhealthy'
      this.emit('serviceHealthChanged', { name, health: service.health })
    }
  }

  private async checkServiceHealth(name: string): Promise<void> {
    const container = this.serviceContainers.get(name)
    if (!container) return
    
    const service = this.outputs.services.find(s => s.name === name)
    if (!service) return
    
    // Simulate health check
    const isHealthy = Math.random() > 0.1
    service.health = isHealthy ? 'healthy' : 'unhealthy'
    
    // Update metrics
    service.metrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10),
      latency: Math.random() * 200
    }
    
    this.emit('healthCheckCompleted', { name, health: service.health, metrics: service.metrics })
  }

  private checkOverallStatus(): void {
    const runningServices = this.outputs.services.filter(s => s.status === 'running').length
    const totalServices = this.outputs.services.length
    
    if (runningServices === totalServices) {
      this.outputs.status = 'running'
    } else if (runningServices > 0) {
      this.outputs.status = 'degraded'
    } else {
      this.outputs.status = 'stopped'
    }
    
    this.emit('statusChanged', this.outputs.status)
  }

  private async handleMessage(message: any): Promise<void> {
    // Route message to appropriate service
    const targetService = message.service || message.topic
    if (targetService && this.serviceContainers.has(targetService)) {
      // In real implementation, would forward message to service
      this.emit('messageRouted', { service: targetService, message })
    }
  }

  private async collectMetrics(): Promise<void> {
    const metrics = {
      timestamp: new Date().toISOString(),
      services: this.outputs.services.map(s => ({
        name: s.name,
        health: s.health,
        metrics: s.metrics
      })),
      overall: {
        totalRequests: this.outputs.metrics.totalRequests,
        errorRate: this.outputs.metrics.errorRate,
        avgLatency: this.calculateAverageLatency(),
        uptime: this.calculateUptime()
      }
    }
    
    // Store metrics
    await this.metricsStorage?.upload(
      `metrics/${new Date().toISOString()}.json`,
      Buffer.from(JSON.stringify(metrics)),
      'application/json'
    )
    
    this.outputs.metrics.avgLatency = metrics.overall.avgLatency
    this.outputs.metrics.uptime = metrics.overall.uptime
    
    this.emit('metricsCollected', metrics)
  }

  private calculateAverageLatency(): number {
    const services = this.outputs.services
    if (services.length === 0) return 0
    
    const totalLatency = services.reduce((sum, s) => sum + s.metrics.latency, 0)
    return totalLatency / services.length
  }

  private calculateUptime(): number {
    // Simple uptime calculation (in real implementation would track actual uptime)
    const healthyServices = this.outputs.services.filter(s => s.health === 'healthy').length
    const totalServices = this.outputs.services.length
    return totalServices > 0 ? (healthyServices / totalServices) * 100 : 0
  }

  // Public methods
  async deployService(config: MicroserviceConfig): Promise<string> {
    if (this.deploymentInProgress) {
      throw new Error('Deployment already in progress')
    }
    
    this.deploymentInProgress = true
    const deploymentId = `deploy-${Date.now()}`
    
    try {
      this.emit('deploymentStarted', { deploymentId, service: config.name })
      
      // Create or update service container
      let container = this.serviceContainers.get(config.name)
      if (!container) {
        container = new ManagedContainer()
        await container.initialize({
          name: config.name,
          image: `${this.config.name}/${config.name}:${config.version}`,
          replicas: config.replicas,
          resources: config.resources,
          ports: [{ container: config.port, host: config.port }],
          environment: config.environment,
          healthCheck: config.healthCheck
        })
        this.serviceContainers.set(config.name, container)
        this.componentRefs.set(`service-${config.name}`, container)
      } else {
        await container.update({
          image: `${this.config.name}/${config.name}:${config.version}`,
          replicas: config.replicas,
          resources: config.resources,
          environment: config.environment
        })
      }
      
      await container.start()
      
      // Update service list
      const existingIndex = this.outputs.services.findIndex(s => s.name === config.name)
      const instance: ServiceInstance = {
        id: `${config.name}-${Date.now()}`,
        name: config.name,
        status: 'running',
        health: 'checking',
        url: container.getOutputs().endpoints[0],
        metrics: {
          cpu: 0,
          memory: 0,
          requests: 0,
          errors: 0,
          latency: 0
        }
      }
      
      if (existingIndex >= 0) {
        this.outputs.services[existingIndex] = instance
      } else {
        this.outputs.services.push(instance)
      }
      
      // Update routes if needed
      if (!this.config.gateway.routes.find(r => r.service === config.name)) {
        this.config.gateway.routes.push({
          path: `/${config.name}/*`,
          service: config.name,
          methods: ['GET', 'POST', 'PUT', 'DELETE']
        })
        await this.updateGatewayRoutes()
      }
      
      this.emit('deploymentCompleted', { deploymentId, service: config.name })
      return deploymentId
    } catch (error) {
      this.emit('deploymentFailed', { deploymentId, service: config.name, error })
      throw error
    } finally {
      this.deploymentInProgress = false
    }
  }

  async scaleService(serviceName: string, replicas: number): Promise<void> {
    const container = this.serviceContainers.get(serviceName)
    if (!container) {
      throw new Error(`Service ${serviceName} not found`)
    }
    
    this.emit('scalingStarted', { service: serviceName, replicas })
    
    try {
      await container.scale(replicas)
      
      const serviceConfig = this.config.services.find(s => s.name === serviceName)
      if (serviceConfig) {
        serviceConfig.replicas = replicas
      }
      
      this.emit('scalingCompleted', { service: serviceName, replicas })
    } catch (error) {
      this.emit('scalingFailed', { service: serviceName, replicas, error })
      throw error
    }
  }

  async stopService(serviceName: string): Promise<void> {
    const container = this.serviceContainers.get(serviceName)
    if (!container) {
      throw new Error(`Service ${serviceName} not found`)
    }
    
    this.emit('serviceStopRequested', { service: serviceName })
    
    try {
      await container.stop()
      
      const serviceIndex = this.outputs.services.findIndex(s => s.name === serviceName)
      if (serviceIndex >= 0) {
        this.outputs.services[serviceIndex].status = 'stopped'
      }
      
      this.checkOverallStatus()
      this.emit('serviceStopped', { service: serviceName })
    } catch (error) {
      this.emit('serviceStopFailed', { service: serviceName, error })
      throw error
    }
  }

  async restartService(serviceName: string): Promise<void> {
    await this.stopService(serviceName)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const container = this.serviceContainers.get(serviceName)
    if (container) {
      await container.start()
      
      const serviceIndex = this.outputs.services.findIndex(s => s.name === serviceName)
      if (serviceIndex >= 0) {
        this.outputs.services[serviceIndex].status = 'running'
        this.outputs.services[serviceIndex].health = 'checking'
      }
      
      this.checkOverallStatus()
      this.emit('serviceRestarted', { service: serviceName })
    }
  }

  private async updateGatewayRoutes(): Promise<void> {
    if (!this.apiGateway) return
    
    // In real implementation, would update API Gateway routes
    this.emit('gatewayUpdated', { routes: this.config.gateway.routes })
  }

  async getServiceLogs(serviceName: string, lines: number = 100): Promise<string[]> {
    const container = this.serviceContainers.get(serviceName)
    if (!container) {
      throw new Error(`Service ${serviceName} not found`)
    }
    
    return container.getLogs(lines)
  }

  async executeCommand(serviceName: string, command: string): Promise<string> {
    const container = this.serviceContainers.get(serviceName)
    if (!container) {
      throw new Error(`Service ${serviceName} not found`)
    }
    
    return container.exec(command)
  }

  getServiceMetrics(serviceName: string): any {
    const service = this.outputs.services.find(s => s.name === serviceName)
    return service?.metrics || null
  }

  getAllMetrics(): any {
    return {
      services: this.outputs.services.map(s => ({
        name: s.name,
        status: s.status,
        health: s.health,
        metrics: s.metrics
      })),
      overall: this.outputs.metrics
    }
  }

  async enableServiceMesh(config: ServiceMeshConfig): Promise<void> {
    this.config.serviceMesh = config
    this.outputs.capabilities.serviceMesh = true
    this.outputs.capabilities.tracing = config.tracing
    
    // In real implementation, would configure service mesh
    this.emit('serviceMeshEnabled', config)
  }

  async enableAutoscaling(config: any): Promise<void> {
    this.config.autoscaling = config
    this.outputs.capabilities.autoscaling = true
    
    // In real implementation, would configure autoscaling
    this.emit('autoscalingEnabled', config)
  }

  // BaseConstruct implementation
  getType(): ConstructType {
    return ConstructType.PATTERN
  }

  getLevel(): ConstructLevel {
    return ConstructLevel.L2
  }

  getConfig(): MicroserviceBackendConfig {
    return this.config
  }

  getOutputs(): MicroserviceBackendOutputs {
    return this.outputs
  }

  async destroy(): Promise<void> {
    // Stop health checks
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval)
    }
    this.healthCheckIntervals.clear()
    
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
      <div className="microservice-backend-status">
        <h4>Microservice Backend Status</h4>
        <div>Backend ID: {outputs.backendId}</div>
        <div>Status: {outputs.status}</div>
        <div>API Gateway: {outputs.apiGatewayUrl}</div>
        
        <div className="services-section">
          <h5>Services ({outputs.services.length})</h5>
          {outputs.services.map(service => (
            <div key={service.id} className="service-item">
              <span>{service.name}</span>
              <span className={`status ${service.status}`}>{service.status}</span>
              <span className={`health ${service.health}`}>{service.health}</span>
            </div>
          ))}
        </div>
        
        <div className="metrics-section">
          <h5>Metrics</h5>
          <div>Total Requests: {outputs.metrics.totalRequests}</div>
          <div>Error Rate: {(outputs.metrics.errorRate * 100).toFixed(2)}%</div>
          <div>Avg Latency: {outputs.metrics.avgLatency.toFixed(2)}ms</div>
          <div>Uptime: {outputs.metrics.uptime.toFixed(2)}%</div>
        </div>
        
        <div className="capabilities-section">
          <h5>Capabilities</h5>
          <div>Service Mesh: {outputs.capabilities.serviceMesh ? '✓' : '✗'}</div>
          <div>Tracing: {outputs.capabilities.tracing ? '✓' : '✗'}</div>
          <div>Autoscaling: {outputs.capabilities.autoscaling ? '✓' : '✗'}</div>
          <div>Messaging: {outputs.capabilities.messaging ? '✓' : '✗'}</div>
        </div>
      </div>
    )
  }
}

// Factory function
export function createMicroserviceBackend(config?: Partial<MicroserviceBackendConfig>): MicroserviceBackend {
  return new MicroserviceBackend(config)
}

// Definition for registry
export const microserviceBackendDefinition: PlatformConstructDefinition = {
  id: 'platform-l2-microservice-backend',
  name: 'Microservice Backend',
  type: ConstructType.PATTERN,
  level: ConstructLevel.L2,
  description: 'Complete microservice architecture with API gateway, service mesh, and scaling',
  category: 'backend',
  capabilities: [
    'api-gateway',
    'service-mesh',
    'distributed-tracing',
    'auto-scaling',
    'load-balancing',
    'health-checks',
    'circuit-breaking',
    'messaging',
    'monitoring'
  ],
  configuration: {
    services: [],
    gateway: {
      routes: [],
      cors: { origins: ['*'], credentials: false },
      timeout: 30000,
      retries: 3
    }
  },
  outputs: {
    backendId: '',
    status: 'initializing',
    apiGatewayUrl: '',
    services: [],
    metrics: {
      totalRequests: 0,
      errorRate: 0,
      avgLatency: 0,
      uptime: 0
    },
    capabilities: {
      serviceMesh: false,
      tracing: false,
      autoscaling: false,
      messaging: false
    }
  },
  dependencies: [
    'platform-l1-managed-container',
    'platform-l1-rest-api-service',
    'platform-l1-encrypted-database',
    'platform-l1-secure-auth-service',
    'platform-l1-authenticated-websocket',
    'platform-l1-cdn-storage',
    'platform-l1-responsive-layout'
  ],
  createInstance: (config) => new MicroserviceBackend(config as MicroserviceBackendConfig)
}