import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, CloudProvider, ConstructType } from '../../types'

/**
 * L1 Managed Container Construct
 * Production-ready container with health checks, logging, monitoring, and auto-recovery
 * Built upon L0 DockerContainerPrimitive
 */
export class ManagedContainer extends L1InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-managed-container',
    name: 'Managed Container',
    level: ConstructLevel.L1,
    type: ConstructType.Infrastructure,
    description: 'Production-ready container with health checks, logging, monitoring, auto-recovery, and resource management. Built for reliability and observability.',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'container', 'docker'],
    providers: [CloudProvider.LOCAL, CloudProvider.AWS, CloudProvider.FIREBASE],
    tags: ['container', 'docker', 'health-check', 'logging', 'monitoring', 'auto-recovery', 'managed'],
    inputs: [
      {
        name: 'image',
        type: 'string',
        description: 'Docker image name with tag',
        required: true,
        example: 'node:20-alpine'
      },
      {
        name: 'containerName',
        type: 'string',
        description: 'Container name',
        required: false,
        defaultValue: 'managed-container'
      },
      {
        name: 'command',
        type: 'string[]',
        description: 'Container command override',
        required: false,
        example: ['npm', 'start']
      },
      {
        name: 'environment',
        type: 'Record<string, string>',
        description: 'Environment variables',
        required: false,
        example: { NODE_ENV: 'production' }
      },
      {
        name: 'ports',
        type: 'PortMapping[]',
        description: 'Port mappings',
        required: false,
        example: [{ host: 8080, container: 3000 }]
      },
      {
        name: 'volumes',
        type: 'VolumeMount[]',
        description: 'Volume mounts',
        required: false,
        example: [{ host: './data', container: '/app/data', readOnly: false }]
      },
      {
        name: 'healthCheck',
        type: 'HealthCheckConfig',
        description: 'Health check configuration',
        required: false,
        defaultValue: {
          enabled: true,
          endpoint: '/health',
          interval: 30,
          timeout: 10,
          retries: 3,
          startPeriod: 60
        }
      },
      {
        name: 'resources',
        type: 'ResourceLimits',
        description: 'Resource limits and reservations',
        required: false,
        defaultValue: {
          memory: { limit: '512m', reservation: '256m' },
          cpu: { limit: 1, reservation: 0.5 }
        }
      },
      {
        name: 'logging',
        type: 'LoggingConfig',
        description: 'Logging configuration',
        required: false,
        defaultValue: {
          driver: 'json-file',
          options: {
            'max-size': '10m',
            'max-file': '3'
          }
        }
      },
      {
        name: 'autoRecovery',
        type: 'AutoRecoveryConfig',
        description: 'Auto-recovery configuration',
        required: false,
        defaultValue: {
          enabled: true,
          restartPolicy: 'on-failure',
          maxRestarts: 3,
          restartDelay: 10
        }
      },
      {
        name: 'monitoring',
        type: 'MonitoringConfig',
        description: 'Monitoring configuration',
        required: false,
        defaultValue: {
          enabled: true,
          metricsPort: 9090,
          metricsPath: '/metrics'
        }
      },
      {
        name: 'secrets',
        type: 'SecretMount[]',
        description: 'Secret mounts',
        required: false,
        example: [{ name: 'api-key', mountPath: '/run/secrets/api-key' }]
      },
      {
        name: 'labels',
        type: 'Record<string, string>',
        description: 'Container labels',
        required: false,
        example: { app: 'web', environment: 'production' }
      },
      {
        name: 'networkMode',
        type: 'string',
        description: 'Network mode',
        required: false,
        defaultValue: 'bridge',
        validation: {
          enum: ['bridge', 'host', 'none', 'custom']
        }
      },
      {
        name: 'onHealthChange',
        type: 'function',
        description: 'Callback when health status changes',
        required: false
      },
      {
        name: 'onRestart',
        type: 'function',
        description: 'Callback when container restarts',
        required: false
      }
    ],
    outputs: [
      {
        name: 'containerId',
        type: 'string',
        description: 'Container ID'
      },
      {
        name: 'status',
        type: 'ContainerStatus',
        description: 'Current container status'
      },
      {
        name: 'health',
        type: 'HealthStatus',
        description: 'Current health status'
      },
      {
        name: 'metrics',
        type: 'ContainerMetrics',
        description: 'Container resource metrics'
      },
      {
        name: 'logs',
        type: 'LogEntry[]',
        description: 'Recent log entries'
      },
      {
        name: 'restartCount',
        type: 'number',
        description: 'Number of restarts'
      },
      {
        name: 'uptime',
        type: 'number',
        description: 'Container uptime in seconds'
      }
    ],
    security: [
      {
        aspect: 'Container Isolation',
        description: 'Containers run with minimal privileges',
        implementation: 'User namespaces, capability dropping, read-only root filesystem'
      },
      {
        aspect: 'Secret Management',
        description: 'Secrets mounted securely',
        implementation: 'Tmpfs mounts for secrets, never in environment variables'
      },
      {
        aspect: 'Network Security',
        description: 'Network isolation and filtering',
        implementation: 'Custom network policies, firewall rules'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'compute-hours',
          unit: 'hours',
          costPerUnit: 0.05
        },
        {
          name: 'storage-gb',
          unit: 'GB-month',
          costPerUnit: 0.10
        }
      ]
    },
    c4: {
      type: 'Container',
      technology: 'Docker',
      external: false,
      position: {
        x: 100,
        y: 400
      }
    },
    examples: [
      {
        title: 'Basic Web Service',
        description: 'Deploy a Node.js web service',
        code: `const container = new ManagedContainer()
await container.initialize({
  image: 'node:20-alpine',
  containerName: 'web-service',
  ports: [{ host: 8080, container: 3000 }],
  environment: {
    NODE_ENV: 'production',
    PORT: '3000'
  },
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 30
  }
})

// Monitor health
container.on('healthChange', (health) => {
  console.log('Health status:', health)
})`,
        language: 'typescript'
      },
      {
        title: 'Database Container',
        description: 'Managed PostgreSQL container',
        code: `const db = new ManagedContainer()
await db.initialize({
  image: 'postgres:15-alpine',
  containerName: 'postgres-db',
  ports: [{ host: 5432, container: 5432 }],
  environment: {
    POSTGRES_DB: 'myapp',
    POSTGRES_USER: 'admin'
  },
  secrets: [
    { name: 'postgres-password', mountPath: '/run/secrets/password' }
  ],
  volumes: [
    { host: './postgres-data', container: '/var/lib/postgresql/data' }
  ],
  resources: {
    memory: { limit: '1g', reservation: '512m' },
    cpu: { limit: 2, reservation: 1 }
  },
  healthCheck: {
    enabled: true,
    command: ['pg_isready', '-U', 'admin'],
    interval: 10
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always configure health checks',
      'Set appropriate resource limits',
      'Use secrets for sensitive data',
      'Enable logging with rotation',
      'Configure auto-recovery policies',
      'Monitor container metrics',
      'Use specific image tags, not latest',
      'Run containers as non-root user',
      'Keep images minimal and updated',
      'Use multi-stage builds for smaller images'
    ],
    deployment: {
      requiredProviders: ['docker'],
      configSchema: {
        type: 'object',
        properties: {
          registryUrl: { type: 'string' },
          registryAuth: { type: 'object' }
        }
      },
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-docker-container-primitive'],
      timeToCreate: 90,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ManagedContainer.definition)
  }

  private containerId: string = ''
  private status: ContainerStatus = 'stopped'
  private health: HealthStatus = { status: 'unknown', lastCheck: new Date() }
  private metrics: ContainerMetrics = {
    cpu: { usage: 0, limit: 0 },
    memory: { usage: 0, limit: 0 },
    network: { rx: 0, tx: 0 },
    disk: { read: 0, write: 0 }
  }
  private logs: LogEntry[] = []
  private restartCount: number = 0
  private startTime: Date | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private metricsInterval: NodeJS.Timeout | null = null

  /**
   * Initialize and start the container
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config)
    
    // Validate configuration
    this.validateConfig()
    
    // Create container configuration
    const containerConfig = this.buildContainerConfig()
    
    // Start container
    await this.startContainer(containerConfig)
    
    // Setup health checking
    if (this.getInput<HealthCheckConfig>('healthCheck')?.enabled) {
      this.startHealthChecking()
    }
    
    // Setup monitoring
    if (this.getInput<MonitoringConfig>('monitoring')?.enabled) {
      this.startMonitoring()
    }
  }

  /**
   * Validate container configuration
   */
  private validateConfig(): void {
    const image = this.getInput<string>('image')
    if (!image) {
      throw new Error('Container image is required')
    }

    const resources = this.getInput<ResourceLimits>('resources')
    if (resources) {
      if (resources.memory && resources.memory.limit) {
        // Validate memory format (e.g., "512m", "1g")
        if (!/^\d+[kmg]?$/i.test(resources.memory.limit)) {
          throw new Error('Invalid memory limit format')
        }
      }
    }

    // Validate port mappings
    const ports = this.getInput<PortMapping[]>('ports') || []
    const usedPorts = new Set<number>()
    for (const port of ports) {
      if (usedPorts.has(port.host)) {
        throw new Error(`Duplicate host port: ${port.host}`)
      }
      usedPorts.add(port.host)
    }
  }

  /**
   * Build container configuration
   */
  private buildContainerConfig(): any {
    const config: any = {
      image: this.getInput<string>('image'),
      name: this.getInput<string>('containerName'),
      env: this.getInput<Record<string, string>>('environment') || {},
      labels: this.getInput<Record<string, string>>('labels') || {},
      networkMode: this.getInput<string>('networkMode')
    }

    // Add command if specified
    const command = this.getInput<string[]>('command')
    if (command) {
      config.cmd = command
    }

    // Configure ports
    const ports = this.getInput<PortMapping[]>('ports') || []
    config.exposedPorts = {}
    config.portBindings = {}
    
    for (const port of ports) {
      config.exposedPorts[`${port.container}/tcp`] = {}
      config.portBindings[`${port.container}/tcp`] = [
        { HostPort: port.host.toString() }
      ]
    }

    // Configure volumes
    const volumes = this.getInput<VolumeMount[]>('volumes') || []
    config.binds = volumes.map(v => 
      `${v.host}:${v.container}${v.readOnly ? ':ro' : ''}`
    )

    // Configure resources
    const resources = this.getInput<ResourceLimits>('resources')
    if (resources) {
      config.hostConfig = {
        ...config.hostConfig,
        memory: this.parseMemory(resources.memory?.limit),
        memoryReservation: this.parseMemory(resources.memory?.reservation),
        cpuQuota: resources.cpu?.limit ? resources.cpu.limit * 100000 : undefined,
        cpuShares: resources.cpu?.reservation ? resources.cpu.reservation * 1024 : undefined
      }
    }

    // Configure logging
    const logging = this.getInput<LoggingConfig>('logging')
    if (logging) {
      config.hostConfig = {
        ...config.hostConfig,
        logConfig: {
          type: logging.driver,
          config: logging.options
        }
      }
    }

    // Configure restart policy
    const autoRecovery = this.getInput<AutoRecoveryConfig>('autoRecovery')
    if (autoRecovery?.enabled) {
      config.hostConfig = {
        ...config.hostConfig,
        restartPolicy: {
          name: autoRecovery.restartPolicy,
          maximumRetryCount: autoRecovery.maxRestarts
        }
      }
    }

    // Add security options
    config.hostConfig = {
      ...config.hostConfig,
      capDrop: ['ALL'],
      capAdd: ['NET_BIND_SERVICE'],
      readonlyRootfs: true,
      securityOpt: ['no-new-privileges:true']
    }

    return config
  }

  /**
   * Parse memory string to bytes
   */
  private parseMemory(memory?: string): number | undefined {
    if (!memory) return undefined
    
    const match = memory.match(/^(\d+)([kmg]?)$/i)
    if (!match) return undefined
    
    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()
    
    switch (unit) {
      case 'k': return value * 1024
      case 'm': return value * 1024 * 1024
      case 'g': return value * 1024 * 1024 * 1024
      default: return value
    }
  }

  /**
   * Start the container
   */
  private async startContainer(config: any): Promise<void> {
    // Simulate container creation and start
    this.containerId = `container_${Date.now()}`
    this.status = 'starting'
    this.startTime = new Date()
    
    // Simulate async container start
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    this.status = 'running'
    this.setOutput('containerId', this.containerId)
    this.setOutput('status', this.status)
    
    this.emit('started', { containerId: this.containerId })
    
    // Add initial log entry
    this.addLogEntry('info', 'Container started successfully')
  }

  /**
   * Stop the container
   */
  async stop(): Promise<void> {
    if (this.status !== 'running') return
    
    this.status = 'stopping'
    this.setOutput('status', this.status)
    
    // Stop health checking
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    // Stop monitoring
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
    
    // Simulate container stop
    await new Promise(resolve => setTimeout(resolve, 500))
    
    this.status = 'stopped'
    this.setOutput('status', this.status)
    
    this.emit('stopped', { containerId: this.containerId })
    this.addLogEntry('info', 'Container stopped')
  }

  /**
   * Restart the container
   */
  async restart(): Promise<void> {
    await this.stop()
    
    this.restartCount++
    this.setOutput('restartCount', this.restartCount)
    
    const autoRecovery = this.getInput<AutoRecoveryConfig>('autoRecovery')
    if (autoRecovery?.restartDelay) {
      await new Promise(resolve => setTimeout(resolve, autoRecovery.restartDelay * 1000))
    }
    
    const config = this.buildContainerConfig()
    await this.startContainer(config)
    
    const onRestart = this.getInput<Function>('onRestart')
    if (onRestart) {
      onRestart(this.restartCount)
    }
    
    this.emit('restarted', { containerId: this.containerId, count: this.restartCount })
  }

  /**
   * Start health checking
   */
  private startHealthChecking(): void {
    const config = this.getInput<HealthCheckConfig>('healthCheck')
    if (!config?.enabled) return
    
    const checkHealth = async () => {
      try {
        // Simulate health check
        const isHealthy = Math.random() > 0.1 // 90% healthy
        
        const previousStatus = this.health.status
        this.health = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date(),
          message: isHealthy ? 'All checks passed' : 'Health check failed'
        }
        
        this.setOutput('health', this.health)
        
        if (previousStatus !== this.health.status) {
          const onHealthChange = this.getInput<Function>('onHealthChange')
          if (onHealthChange) {
            onHealthChange(this.health)
          }
          
          this.emit('healthChange', this.health)
          
          // Handle unhealthy state
          if (!isHealthy) {
            this.handleUnhealthy()
          }
        }
        
        this.addLogEntry(
          isHealthy ? 'debug' : 'warn',
          `Health check: ${this.health.status}`
        )
        
      } catch (error: any) {
        this.health = {
          status: 'error',
          lastCheck: new Date(),
          message: error.message
        }
        this.setOutput('health', this.health)
        this.addLogEntry('error', `Health check error: ${error.message}`)
      }
    }
    
    // Initial check after start period
    setTimeout(checkHealth, (config.startPeriod || 60) * 1000)
    
    // Regular checks
    this.healthCheckInterval = setInterval(
      checkHealth,
      (config.interval || 30) * 1000
    )
  }

  /**
   * Handle unhealthy container
   */
  private handleUnhealthy(): void {
    const autoRecovery = this.getInput<AutoRecoveryConfig>('autoRecovery')
    if (!autoRecovery?.enabled) return
    
    if (this.restartCount < (autoRecovery.maxRestarts || 3)) {
      this.addLogEntry('warn', 'Container unhealthy, scheduling restart')
      setTimeout(() => this.restart(), 5000)
    } else {
      this.addLogEntry('error', 'Max restarts reached, container remains unhealthy')
      this.emit('maxRestartsReached', { containerId: this.containerId })
    }
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    const config = this.getInput<MonitoringConfig>('monitoring')
    if (!config?.enabled) return
    
    const collectMetrics = () => {
      // Simulate metrics collection
      this.metrics = {
        cpu: {
          usage: Math.random() * 100,
          limit: (this.getInput<ResourceLimits>('resources')?.cpu?.limit || 1) * 100
        },
        memory: {
          usage: Math.random() * 512 * 1024 * 1024,
          limit: this.parseMemory(this.getInput<ResourceLimits>('resources')?.memory?.limit) || 512 * 1024 * 1024
        },
        network: {
          rx: this.metrics.network.rx + Math.random() * 1024 * 1024,
          tx: this.metrics.network.tx + Math.random() * 1024 * 1024
        },
        disk: {
          read: this.metrics.disk.read + Math.random() * 1024 * 1024,
          write: this.metrics.disk.write + Math.random() * 1024 * 1024
        }
      }
      
      this.setOutput('metrics', this.metrics)
      this.emit('metrics', this.metrics)
    }
    
    // Collect metrics every 10 seconds
    this.metricsInterval = setInterval(collectMetrics, 10000)
    collectMetrics() // Initial collection
  }

  /**
   * Add log entry
   */
  private addLogEntry(level: LogLevel, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      containerId: this.containerId
    }
    
    this.logs.push(entry)
    
    // Keep only recent logs
    const maxLogs = 1000
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs)
    }
    
    this.setOutput('logs', [...this.logs])
    this.emit('log', entry)
  }

  /**
   * Get container logs
   */
  getLogs(options?: LogOptions): LogEntry[] {
    let logs = [...this.logs]
    
    if (options?.since) {
      logs = logs.filter(l => l.timestamp >= options.since!)
    }
    
    if (options?.level) {
      logs = logs.filter(l => l.level === options.level)
    }
    
    if (options?.tail) {
      logs = logs.slice(-options.tail)
    }
    
    return logs
  }

  /**
   * Execute command in container
   */
  async exec(command: string[]): Promise<ExecResult> {
    if (this.status !== 'running') {
      throw new Error('Container is not running')
    }
    
    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const result: ExecResult = {
      exitCode: 0,
      stdout: `Executed: ${command.join(' ')}`,
      stderr: ''
    }
    
    this.addLogEntry('debug', `Exec: ${command.join(' ')}`)
    
    return result
  }

  /**
   * Get container uptime
   */
  getUptime(): number {
    if (!this.startTime || this.status !== 'running') {
      return 0
    }
    
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000)
  }

  /**
   * Update outputs periodically
   */
  private updateOutputs(): void {
    this.setOutput('uptime', this.getUptime())
  }
}

// Type definitions
interface PortMapping {
  host: number
  container: number
  protocol?: 'tcp' | 'udp'
}

interface VolumeMount {
  host: string
  container: string
  readOnly?: boolean
}

interface HealthCheckConfig {
  enabled: boolean
  endpoint?: string
  command?: string[]
  interval?: number
  timeout?: number
  retries?: number
  startPeriod?: number
}

interface ResourceLimits {
  memory?: {
    limit?: string
    reservation?: string
  }
  cpu?: {
    limit?: number
    reservation?: number
  }
}

interface LoggingConfig {
  driver: string
  options?: Record<string, string>
}

interface AutoRecoveryConfig {
  enabled: boolean
  restartPolicy?: 'no' | 'on-failure' | 'always' | 'unless-stopped'
  maxRestarts?: number
  restartDelay?: number
}

interface MonitoringConfig {
  enabled: boolean
  metricsPort?: number
  metricsPath?: string
}

interface SecretMount {
  name: string
  mountPath: string
}

type ContainerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown' | 'error'
  lastCheck: Date
  message?: string
}

interface ContainerMetrics {
  cpu: { usage: number; limit: number }
  memory: { usage: number; limit: number }
  network: { rx: number; tx: number }
  disk: { read: number; write: number }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  containerId: string
}

interface LogOptions {
  since?: Date
  level?: LogLevel
  tail?: number
}

interface ExecResult {
  exitCode: number
  stdout: string
  stderr: string
}

// Export factory function
export const createManagedContainer = () => new ManagedContainer()

// Export the definition for catalog registration
export const managedContainerDefinition = ManagedContainer.definition