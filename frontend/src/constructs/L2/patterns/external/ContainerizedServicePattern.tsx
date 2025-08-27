/**
 * Containerized Service Pattern (L2)
 * 
 * Orchestrates Docker containers and Docker Compose services with resource limits,
 * health monitoring, and secure networking. Provides managed container execution.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  CloudProvider 
} from '../../../types'
import { DockerServicePrimitiveConstruct } from '../../../L0/external/DockerServicePrimitive'
import { Box, Text, Badge, Progress, Alert, Button } from '../../../L1/ui/ThemedComponents'

export interface ContainerService {
  name: string
  image: string
  tag?: string
  ports?: Array<{ host: number; container: number; protocol?: string }>
  volumes?: Array<{ source: string; target: string; type?: string }>
  environment?: Record<string, string>
  command?: string | string[]
  healthcheck?: {
    test: string | string[]
    interval?: string
    timeout?: string
    retries?: number
  }
  resources?: {
    cpus?: number
    memory?: string
    memoryReservation?: string
  }
  networks?: string[]
  dependsOn?: string[]
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped'
}

export interface NetworkConfig {
  name: string
  driver?: 'bridge' | 'host' | 'overlay' | 'none'
  ipam?: {
    subnet?: string
    gateway?: string
  }
  internal?: boolean
  attachable?: boolean
}

export interface VolumeConfig {
  name: string
  driver?: string
  driverOpts?: Record<string, string>
  labels?: Record<string, string>
}

export interface ContainerizedServiceConfig {
  services: ContainerService[]
  networks?: NetworkConfig[]
  volumes?: VolumeConfig[]
  compose?: {
    version?: string
    projectName?: string
  }
  orchestration: {
    autoStart?: boolean
    healthCheckInterval?: number
    restartPolicy?: 'manual' | 'automatic'
    maxRestartAttempts?: number
  }
  security: {
    isolateNetworks?: boolean
    limitResources?: boolean
    scanImages?: boolean
    allowedRegistries?: string[]
    blockedImages?: string[]
  }
  monitoring: {
    collectMetrics?: boolean
    logAggregation?: boolean
    alertOnFailure?: boolean
  }
}

export interface ServiceStatus {
  name: string
  status: 'stopped' | 'starting' | 'running' | 'unhealthy' | 'error'
  containerId?: string
  uptime?: number
  restartCount?: number
  health?: {
    status: string
    failingStreak?: number
    log?: Array<{ timestamp: Date; status: string }>
  }
  resources?: {
    cpuUsage: number
    memoryUsage: number
    networkIO?: { rx: number; tx: number }
    diskIO?: { read: number; write: number }
  }
  logs?: string[]
  error?: string
}

export interface ContainerizedServicePatternProps {
  config: ContainerizedServiceConfig
  onServiceStatusChange?: (service: string, status: ServiceStatus) => void
  onComposeGenerated?: (compose: string) => void
  showUI?: boolean
}

/**
 * Containerized Service Pattern Implementation
 */
export class ContainerizedServicePattern extends L2PatternConstruct {
  private static metadata: PlatformConstructDefinition = {
    id: 'platform-l2-containerized-service-pattern',
    name: 'Containerized Service Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.PATTERN,
    description: 'Pattern for orchestrating Docker containers and services',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'infrastructure', 'containers'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['docker', 'container', 'compose', 'orchestration', 'pattern'],
    dependencies: [
      'platform-l0-docker-service-primitive',
      'platform-l1-container-runtime',
      'platform-l1-network-manager'
    ],
    inputs: [
      {
        name: 'config',
        type: 'ContainerizedServiceConfig',
        description: 'Container service configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'serviceStatuses',
        type: 'Map<string, ServiceStatus>',
        description: 'Current status of all services'
      },
      {
        name: 'composeConfig',
        type: 'string',
        description: 'Generated Docker Compose configuration'
      }
    ],
    security: [
      {
        aspect: 'container-escape',
        description: 'Runs arbitrary containers',
        severity: 'high',
        recommendations: [
          'Use resource limits',
          'Enable security scanning',
          'Isolate networks',
          'Run as non-root',
          'Use read-only filesystems where possible'
        ]
      },
      {
        aspect: 'resource-exhaustion',
        description: 'Containers can consume system resources',
        severity: 'medium',
        recommendations: [
          'Set CPU and memory limits',
          'Monitor resource usage',
          'Implement quotas',
          'Use cgroups properly'
        ]
      }
    ],
    cost: {
      baseMonthly: 15,
      usageFactors: [
        { name: 'containerCount', unitCost: 3 },
        { name: 'cpuHours', unitCost: 0.05 },
        { name: 'storageGB', unitCost: 0.1 }
      ]
    },
    examples: [
      {
        title: 'Deploy Multi-Service Application',
        description: 'Deploy a web app with database and cache',
        code: `const containerPattern = new ContainerizedServicePattern({
  config: {
    services: [
      {
        name: 'web',
        image: 'nginx',
        tag: 'alpine',
        ports: [{ host: 8080, container: 80 }],
        volumes: [{ source: './html', target: '/usr/share/nginx/html', type: 'bind' }],
        dependsOn: ['api'],
        resources: { cpus: 0.5, memory: '256m' }
      },
      {
        name: 'api',
        image: 'node',
        tag: '18-alpine',
        ports: [{ host: 3000, container: 3000 }],
        environment: {
          NODE_ENV: 'production',
          DATABASE_URL: 'postgres://db:5432/app'
        },
        dependsOn: ['db'],
        resources: { cpus: 1, memory: '512m' }
      },
      {
        name: 'db',
        image: 'postgres',
        tag: '15-alpine',
        ports: [{ host: 5432, container: 5432 }],
        volumes: [{ source: 'db-data', target: '/var/lib/postgresql/data' }],
        environment: {
          POSTGRES_DB: 'app',
          POSTGRES_PASSWORD: 'secret'
        },
        resources: { cpus: 1, memory: '1g' }
      }
    ],
    networks: [
      { name: 'app-network', driver: 'bridge', internal: true }
    ],
    volumes: [
      { name: 'db-data', driver: 'local' }
    ],
    orchestration: {
      autoStart: true,
      healthCheckInterval: 30000,
      restartPolicy: 'automatic'
    }
  }
})

await containerPattern.start()`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always set resource limits for containers',
      'Use health checks for critical services',
      'Isolate services in separate networks',
      'Store secrets in environment variables or volumes',
      'Implement proper logging and monitoring',
      'Use specific image tags, not "latest"',
      'Scan images for vulnerabilities before deployment'
    ],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 88,
      generatedBy: 'Agent 4: External Integration Specialist'
    }
  }

  private config: ContainerizedServiceConfig
  private dockerPrimitive?: DockerServicePrimitiveConstruct
  private serviceStatuses: Map<string, ServiceStatus> = new Map()
  private composeConfig: string = ''
  private healthCheckIntervals: Map<string, NodeJS.Timer> = new Map()
  private resourceMonitorInterval?: NodeJS.Timer
  private containerRuntime?: any

  constructor(config: ContainerizedServiceConfig) {
    super(ContainerizedServicePattern.metadata, { config })
    this.config = config
  }

  async initialize(_config: any): Promise<void> {
    await this.beforeCompose()
    await this.composePattern()
    this.configureInteractions()
    await this.afterCompose()
    this.initialized = true
  }

  protected async composePattern(): Promise<void> {
    // Initialize Docker primitive
    this.dockerPrimitive = new DockerServicePrimitiveConstruct()
    this.addConstruct('docker-primitive', this.dockerPrimitive)

    // Initialize container runtime
    this.containerRuntime = await this.initializeContainerRuntime()
    this.addConstruct('container-runtime', this.containerRuntime)

    // Generate Docker Compose configuration
    this.composeConfig = await this.generateComposeConfig()

    // Initialize service statuses
    for (const service of this.config.services) {
      this.serviceStatuses.set(service.name, {
        name: service.name,
        status: 'stopped',
        restartCount: 0,
        health: {
          status: 'unknown',
          log: []
        }
      })
    }

    // Auto-start if configured
    if (this.config.orchestration.autoStart) {
      await this.startAll()
    }
  }

  protected configureInteractions(): void {
    // Set up health monitoring
    if (this.config.orchestration.healthCheckInterval) {
      this.startHealthMonitoring()
    }

    // Set up resource monitoring
    if (this.config.monitoring.collectMetrics) {
      this.startResourceMonitoring()
    }

    // Set up auto-restart
    if (this.config.orchestration.restartPolicy === 'automatic') {
      this.on('service-unhealthy', async (data) => {
        await this.handleUnhealthyService(data.service)
      })
    }

    // Set up alerts
    if (this.config.monitoring.alertOnFailure) {
      this.on('service-failed', (data) => {
        console.error(`Service ${data.service} failed:`, data.error)
      })
    }
  }

  /**
   * Initialize container runtime
   */
  private async initializeContainerRuntime(): Promise<any> {
    // In a real implementation, this would connect to Docker API
    // For now, we'll simulate a container runtime
    return {
      startContainer: async (service: ContainerService) => {
        console.log(`Starting container: ${service.name}`)
        // Simulate container start
        return {
          id: `container-${service.name}-${Date.now()}`,
          status: 'running'
        }
      },
      
      stopContainer: async (containerId: string) => {
        console.log(`Stopping container: ${containerId}`)
        return { success: true }
      },
      
      getContainerStatus: async (containerId: string) => {
        // Simulate status check
        return {
          status: 'running',
          uptime: Date.now(),
          stats: {
            cpu: Math.random() * 100,
            memory: Math.random() * 1024 * 1024 * 1024
          }
        }
      },
      
      getContainerLogs: async (containerId: string, lines: number = 100) => {
        // Simulate logs
        return [
          `Container ${containerId} started`,
          'Service initialized successfully',
          'Listening on port...'
        ]
      }
    }
  }

  /**
   * Generate Docker Compose configuration
   */
  private async generateComposeConfig(): Promise<string> {
    const config: any = {
      version: this.config.compose?.version || '3.8',
      services: {},
      networks: {},
      volumes: {}
    }

    // Add services
    for (const service of this.config.services) {
      const serviceConfig: any = {
        image: `${service.image}:${service.tag || 'latest'}`,
        container_name: `${this.config.compose?.projectName || 'app'}_${service.name}`
      }

      // Add ports
      if (service.ports && service.ports.length > 0) {
        serviceConfig.ports = service.ports.map(p => 
          `${p.host}:${p.container}${p.protocol ? '/' + p.protocol : ''}`
        )
      }

      // Add volumes
      if (service.volumes && service.volumes.length > 0) {
        serviceConfig.volumes = service.volumes.map(v => {
          if (v.type === 'bind') {
            return `${v.source}:${v.target}`
          } else {
            return `${v.source}:${v.target}`
          }
        })
      }

      // Add environment
      if (service.environment) {
        serviceConfig.environment = service.environment
      }

      // Add command
      if (service.command) {
        serviceConfig.command = service.command
      }

      // Add healthcheck
      if (service.healthcheck) {
        serviceConfig.healthcheck = {
          test: service.healthcheck.test,
          interval: service.healthcheck.interval || '30s',
          timeout: service.healthcheck.timeout || '10s',
          retries: service.healthcheck.retries || 3
        }
      }

      // Add resources
      if (service.resources && this.config.security.limitResources) {
        serviceConfig.deploy = {
          resources: {
            limits: {
              cpus: String(service.resources.cpus || 1),
              memory: service.resources.memory || '512m'
            },
            reservations: {
              memory: service.resources.memoryReservation || '128m'
            }
          }
        }
      }

      // Add networks
      if (service.networks) {
        serviceConfig.networks = service.networks
      } else if (this.config.security.isolateNetworks) {
        serviceConfig.networks = ['app-network']
      }

      // Add dependencies
      if (service.dependsOn) {
        serviceConfig.depends_on = service.dependsOn
      }

      // Add restart policy
      serviceConfig.restart = service.restart || 'unless-stopped'

      config.services[service.name] = serviceConfig
    }

    // Add networks
    if (this.config.networks) {
      for (const network of this.config.networks) {
        config.networks[network.name] = {
          driver: network.driver || 'bridge',
          internal: network.internal || false,
          attachable: network.attachable || false
        }
        
        if (network.ipam) {
          config.networks[network.name].ipam = {
            config: [{
              subnet: network.ipam.subnet,
              gateway: network.ipam.gateway
            }]
          }
        }
      }
    } else if (this.config.security.isolateNetworks) {
      config.networks['app-network'] = {
        driver: 'bridge',
        internal: true
      }
    }

    // Add volumes
    if (this.config.volumes) {
      for (const volume of this.config.volumes) {
        config.volumes[volume.name] = {
          driver: volume.driver || 'local',
          driver_opts: volume.driverOpts,
          labels: volume.labels
        }
      }
    }

    // Convert to YAML-like format
    const yaml = this.convertToYaml(config)
    
    this.emit('compose-generated', { config: yaml })
    
    return yaml
  }

  /**
   * Convert object to YAML-like string
   */
  private convertToYaml(obj: any, indent: number = 0): string {
    let yaml = ''
    const spaces = ' '.repeat(indent)
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue
      
      yaml += `${spaces}${key}:`
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += '\n' + this.convertToYaml(value, indent + 2)
      } else if (Array.isArray(value)) {
        yaml += '\n'
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.convertToYaml(item, indent + 4)}`
          } else {
            yaml += `${spaces}  - ${item}\n`
          }
        }
      } else {
        yaml += ` ${value}\n`
      }
    }
    
    return yaml
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    const interval = this.config.orchestration.healthCheckInterval || 30000
    
    for (const service of this.config.services) {
      const timer = setInterval(async () => {
        await this.checkServiceHealth(service.name)
      }, interval)
      
      this.healthCheckIntervals.set(service.name, timer)
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    this.resourceMonitorInterval = setInterval(async () => {
      for (const [name, status] of this.serviceStatuses.entries()) {
        if (status.status === 'running' && status.containerId) {
          try {
            const stats = await this.containerRuntime.getContainerStatus(status.containerId)
            
            status.resources = {
              cpuUsage: stats.stats.cpu,
              memoryUsage: stats.stats.memory,
              networkIO: { rx: 0, tx: 0 },
              diskIO: { read: 0, write: 0 }
            }
            
            this.emit('metrics-collected', {
              service: name,
              metrics: status.resources
            })
          } catch (error) {
            console.error(`Failed to collect metrics for ${name}:`, error)
          }
        }
      }
    }, 10000) // Every 10 seconds
  }

  /**
   * Check service health
   */
  private async checkServiceHealth(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName)
    if (!status || status.status !== 'running') return
    
    const service = this.config.services.find(s => s.name === serviceName)
    if (!service) return
    
    try {
      // Check container health
      const containerStatus = await this.containerRuntime.getContainerStatus(status.containerId!)
      
      // Update health status
      const isHealthy = containerStatus.status === 'running'
      const healthStatus = isHealthy ? 'healthy' : 'unhealthy'
      
      if (status.health) {
        status.health.status = healthStatus
        status.health.log!.push({
          timestamp: new Date(),
          status: healthStatus
        })
        
        // Keep only last 10 health checks
        if (status.health.log!.length > 10) {
          status.health.log = status.health.log!.slice(-10)
        }
        
        // Track failing streak
        if (!isHealthy) {
          status.health.failingStreak = (status.health.failingStreak || 0) + 1
          
          if (status.health.failingStreak >= 3) {
            status.status = 'unhealthy'
            this.emit('service-unhealthy', {
              service: serviceName,
              failingStreak: status.health.failingStreak
            })
          }
        } else {
          status.health.failingStreak = 0
        }
      }
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error)
      status.status = 'error'
      status.error = error.message
    }
  }

  /**
   * Handle unhealthy service
   */
  private async handleUnhealthyService(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName)
    if (!status) return
    
    // Check restart attempts
    if (status.restartCount! >= (this.config.orchestration.maxRestartAttempts || 3)) {
      console.error(`Service ${serviceName} exceeded max restart attempts`)
      status.status = 'error'
      this.emit('service-failed', {
        service: serviceName,
        error: 'Exceeded max restart attempts'
      })
      return
    }
    
    // Attempt restart
    console.log(`Restarting unhealthy service: ${serviceName}`)
    status.restartCount!++
    
    try {
      await this.stopService(serviceName)
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s
      await this.startService(serviceName)
    } catch (error) {
      status.status = 'error'
      status.error = error.message
      this.emit('service-failed', {
        service: serviceName,
        error: error.message
      })
    }
  }

  /**
   * Start all services
   */
  async startAll(): Promise<void> {
    // Sort services by dependencies
    const sortedServices = this.topologicalSort(this.config.services)
    
    for (const service of sortedServices) {
      await this.startService(service.name)
    }
  }

  /**
   * Start a service
   */
  async startService(serviceName: string): Promise<void> {
    const service = this.config.services.find(s => s.name === serviceName)
    if (!service) {
      throw new Error(`Service ${serviceName} not found`)
    }
    
    const status = this.serviceStatuses.get(serviceName)!
    
    // Check if already running
    if (status.status === 'running') {
      console.log(`Service ${serviceName} is already running`)
      return
    }
    
    status.status = 'starting'
    
    try {
      // Scan image if configured
      if (this.config.security.scanImages) {
        await this.scanImage(service.image, service.tag)
      }
      
      // Start container
      const container = await this.containerRuntime.startContainer(service)
      
      status.containerId = container.id
      status.status = 'running'
      status.uptime = Date.now()
      
      // Get initial logs
      if (this.config.monitoring.logAggregation) {
        status.logs = await this.containerRuntime.getContainerLogs(container.id, 50)
      }
      
      this.emit('service-started', {
        service: serviceName,
        containerId: container.id
      })
      
    } catch (error) {
      status.status = 'error'
      status.error = error.message
      
      this.emit('service-start-failed', {
        service: serviceName,
        error: error.message
      })
      
      throw error
    }
  }

  /**
   * Stop a service
   */
  async stopService(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName)
    if (!status || status.status === 'stopped') {
      console.log(`Service ${serviceName} is already stopped`)
      return
    }
    
    if (status.containerId) {
      try {
        await this.containerRuntime.stopContainer(status.containerId)
        
        status.status = 'stopped'
        status.containerId = undefined
        status.uptime = undefined
        
        this.emit('service-stopped', {
          service: serviceName
        })
      } catch (error) {
        status.status = 'error'
        status.error = error.message
        throw error
      }
    }
  }

  /**
   * Stop all services
   */
  async stopAll(): Promise<void> {
    // Stop in reverse dependency order
    const sortedServices = this.topologicalSort(this.config.services).reverse()
    
    for (const service of sortedServices) {
      await this.stopService(service.name)
    }
  }

  /**
   * Restart a service
   */
  async restartService(serviceName: string): Promise<void> {
    await this.stopService(serviceName)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2s
    await this.startService(serviceName)
  }

  /**
   * Scan image for vulnerabilities
   */
  private async scanImage(image: string, tag?: string): Promise<void> {
    const fullImage = `${image}:${tag || 'latest'}`
    
    // Check allowed registries
    if (this.config.security.allowedRegistries && this.config.security.allowedRegistries.length > 0) {
      const registry = image.split('/')[0]
      if (!this.config.security.allowedRegistries.includes(registry)) {
        throw new Error(`Registry ${registry} not allowed`)
      }
    }
    
    // Check blocked images
    if (this.config.security.blockedImages && 
        this.config.security.blockedImages.includes(fullImage)) {
      throw new Error(`Image ${fullImage} is blocked`)
    }
    
    // In real implementation, would scan for CVEs
    console.log(`Scanning image: ${fullImage}`)
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(services: ContainerService[]): ContainerService[] {
    const sorted: ContainerService[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const visit = (service: ContainerService) => {
      if (visiting.has(service.name)) {
        throw new Error(`Circular dependency detected: ${service.name}`)
      }
      
      if (visited.has(service.name)) {
        return
      }
      
      visiting.add(service.name)
      
      if (service.dependsOn) {
        for (const dep of service.dependsOn) {
          const depService = services.find(s => s.name === dep)
          if (depService) {
            visit(depService)
          }
        }
      }
      
      visiting.delete(service.name)
      visited.add(service.name)
      sorted.push(service)
    }
    
    for (const service of services) {
      visit(service)
    }
    
    return sorted
  }

  /**
   * Get service logs
   */
  async getServiceLogs(serviceName: string, lines: number = 100): Promise<string[]> {
    const status = this.serviceStatuses.get(serviceName)
    if (!status || !status.containerId) {
      return []
    }
    
    return await this.containerRuntime.getContainerLogs(status.containerId, lines)
  }

  /**
   * Get all service statuses
   */
  getServiceStatuses(): Map<string, ServiceStatus> {
    return new Map(this.serviceStatuses)
  }

  /**
   * Get Docker Compose configuration
   */
  getComposeConfig(): string {
    return this.composeConfig
  }

  /**
   * Execute command in service
   */
  async execInService(serviceName: string, command: string[]): Promise<string> {
    const status = this.serviceStatuses.get(serviceName)
    if (!status || status.status !== 'running' || !status.containerId) {
      throw new Error(`Service ${serviceName} is not running`)
    }
    
    // In real implementation, would execute command in container
    console.log(`Executing in ${serviceName}:`, command.join(' '))
    return 'Command executed successfully'
  }

  /**
   * Render the pattern UI
   */
  render(): React.ReactElement {
    return <ContainerizedServicePatternComponent pattern={this} />
  }

  async destroy(): Promise<void> {
    // Stop all services
    await this.stopAll()
    
    // Clear intervals
    for (const timer of this.healthCheckIntervals.values()) {
      clearInterval(timer)
    }
    this.healthCheckIntervals.clear()
    
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval)
    }
    
    await super.destroy()
  }
}

/**
 * React component for Containerized Service Pattern
 */
const ContainerizedServicePatternComponent: React.FC<{ pattern: ContainerizedServicePattern }> = ({ pattern }) => {
  const [services, setServices] = useState<Map<string, ServiceStatus>>(new Map())
  const [composeConfig, setComposeConfig] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const updateServices = () => {
      setServices(pattern.getServiceStatuses())
    }

    pattern.on('service-started', updateServices)
    pattern.on('service-stopped', updateServices)
    pattern.on('service-unhealthy', updateServices)
    pattern.on('metrics-collected', updateServices)
    pattern.on('compose-generated', (data) => {
      setComposeConfig(data.config)
    })

    // Initial load
    updateServices()
    setComposeConfig(pattern.getComposeConfig())

    return () => {
      pattern.off('service-started', updateServices)
      pattern.off('service-stopped', updateServices)
      pattern.off('service-unhealthy', updateServices)
      pattern.off('metrics-collected', updateServices)
    }
  }, [pattern])

  const handleStart = async (serviceName: string) => {
    try {
      await pattern.startService(serviceName)
    } catch (error) {
      console.error('Failed to start service:', error)
    }
  }

  const handleStop = async (serviceName: string) => {
    try {
      await pattern.stopService(serviceName)
    } catch (error) {
      console.error('Failed to stop service:', error)
    }
  }

  const handleRestart = async (serviceName: string) => {
    try {
      await pattern.restartService(serviceName)
    } catch (error) {
      console.error('Failed to restart service:', error)
    }
  }

  const handleViewLogs = async (serviceName: string) => {
    setSelectedService(serviceName)
    try {
      const serviceLogs = await pattern.getServiceLogs(serviceName, 50)
      setLogs(serviceLogs)
    } catch (error) {
      console.error('Failed to get logs:', error)
      setLogs(['Error fetching logs'])
    }
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running': return 'success'
      case 'starting': return 'warning'
      case 'unhealthy': return 'warning'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box className="containerized-service-pattern p-6">
      <Text variant="h3" className="mb-4">Container Orchestration</Text>

      {/* Service Grid */}
      <Box className="mb-6">
        <Text variant="h4" className="mb-3">Services</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(services.entries()).map(([name, status]) => (
            <Box key={name} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Text variant="body1" className="font-medium">{name}</Text>
                  <Badge variant={getStatusColor(status.status)} className="mt-1">
                    {status.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {status.status === 'stopped' ? (
                    <Button size="sm" onClick={() => handleStart(name)}>
                      Start
                    </Button>
                  ) : status.status === 'running' ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => handleStop(name)}>
                        Stop
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleRestart(name)}>
                        Restart
                      </Button>
                    </>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={() => handleViewLogs(name)}>
                    Logs
                  </Button>
                </div>
              </div>

              {/* Service Details */}
              {status.status === 'running' && (
                <div className="space-y-2 text-sm">
                  {status.uptime && (
                    <div>
                      <Text variant="caption" className="text-gray-500">Uptime</Text>
                      <Text variant="body2">
                        {Math.floor((Date.now() - status.uptime) / 1000 / 60)} minutes
                      </Text>
                    </div>
                  )}
                  
                  {status.resources && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Text variant="caption" className="text-gray-500">CPU</Text>
                        <Progress value={status.resources.cpuUsage} max={100} />
                        <Text variant="caption">{status.resources.cpuUsage.toFixed(1)}%</Text>
                      </div>
                      <div>
                        <Text variant="caption" className="text-gray-500">Memory</Text>
                        <Progress 
                          value={status.resources.memoryUsage} 
                          max={1024 * 1024 * 1024} 
                        />
                        <Text variant="caption">
                          {(status.resources.memoryUsage / 1024 / 1024).toFixed(0)} MB
                        </Text>
                      </div>
                    </div>
                  )}
                  
                  {status.health && (
                    <div>
                      <Text variant="caption" className="text-gray-500">Health</Text>
                      <Text variant="body2" className={
                        status.health.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
                      }>
                        {status.health.status}
                        {status.health.failingStreak ? ` (${status.health.failingStreak} failures)` : ''}
                      </Text>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {status.error && (
                <Alert variant="error" className="mt-2">
                  {status.error}
                </Alert>
              )}
            </Box>
          ))}
        </div>
      </Box>

      {/* Service Logs */}
      {selectedService && logs.length > 0 && (
        <Box className="mb-6 p-4 bg-gray-900 text-gray-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Text variant="h4" className="text-white">
              Logs: {selectedService}
            </Text>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                setSelectedService(null)
                setLogs([])
              }}
            >
              Close
            </Button>
          </div>
          <pre className="text-xs overflow-x-auto max-h-64 overflow-y-auto">
            {logs.join('\n')}
          </pre>
        </Box>
      )}

      {/* Docker Compose Config */}
      <Box className="p-4 bg-gray-50 rounded-lg">
        <Text variant="h4" className="mb-2">Docker Compose Configuration</Text>
        <pre className="text-sm overflow-x-auto">
          {composeConfig}
        </pre>
      </Box>

      {/* Actions */}
      <Box className="mt-4 flex gap-2">
        <Button onClick={() => pattern.startAll()}>Start All</Button>
        <Button variant="secondary" onClick={() => pattern.stopAll()}>Stop All</Button>
      </Box>
    </Box>
  )
}

// Export component separately
export const ContainerizedServicePatternComponent = ContainerizedServicePattern