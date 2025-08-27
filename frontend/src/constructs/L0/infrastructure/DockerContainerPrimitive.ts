import { L0InfrastructureConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Docker Container Primitive Construct
 * Raw Docker container with no management, monitoring, or health checks
 * Just a basic container definition and runtime
 */
export class DockerContainerPrimitive extends L0InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-docker-container-primitive',
    name: 'Docker Container Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Infrastructure,
    description: 'Raw Docker container with no management or monitoring',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'container', 'runtime'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['docker', 'container', 'primitive', 'runtime'],
    inputs: [
      {
        name: 'image',
        type: 'string',
        description: 'Docker image name (e.g., nginx:latest)',
        required: true
      },
      {
        name: 'command',
        type: 'string[]',
        description: 'Command to run in container',
        required: false
      },
      {
        name: 'environment',
        type: 'Record<string, string>',
        description: 'Environment variables',
        required: false,
        defaultValue: {}
      },
      {
        name: 'ports',
        type: 'PortMapping[]',
        description: 'Port mappings (host:container)',
        required: false,
        defaultValue: []
      },
      {
        name: 'volumes',
        type: 'VolumeMount[]',
        description: 'Volume mounts',
        required: false,
        defaultValue: []
      }
    ],
    outputs: [
      {
        name: 'containerId',
        type: 'string',
        description: 'Docker container ID'
      },
      {
        name: 'status',
        type: 'ContainerStatus',
        description: 'Current container status'
      },
      {
        name: 'logs',
        type: 'string[]',
        description: 'Container output logs'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Container',
      technology: 'Docker'
    },
    examples: [
      {
        title: 'Basic Container',
        description: 'Simple Docker container',
        code: `const container = new DockerContainerPrimitive()
await container.initialize({
  image: 'nginx:latest',
  ports: [{ host: 8080, container: 80 }]
})
await container.deploy()`,
        language: 'typescript'
      },
      {
        title: 'Container with Environment',
        description: 'Container with env vars and command',
        code: `const container = new DockerContainerPrimitive()
await container.initialize({
  image: 'node:18-alpine',
  command: ['node', 'server.js'],
  environment: {
    NODE_ENV: 'production',
    PORT: '3000'
  },
  ports: [{ host: 3000, container: 3000 }],
  volumes: [
    { host: './app', container: '/app' }
  ]
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 ManagedContainer for production',
      'No health checks or restart policies',
      'No resource limits or monitoring',
      'Direct Docker API usage only'
    ],
    deployment: {
      requiredProviders: ['docker'],
      configSchema: {
        dockerHost: {
          type: 'string',
          description: 'Docker daemon host',
          default: 'unix:///var/run/docker.sock'
        }
      },
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 35,
      canBuildConstructs: false
    }
  }

  private containerId?: string
  private status: ContainerStatus = 'created'
  private logs: string[] = []

  constructor() {
    super(DockerContainerPrimitive.definition)
  }

  /**
   * Simulated deploy for L0 - in real implementation would use Docker API
   */
  async deploy(): Promise<void> {
    // Validate required inputs
    const image = this.getInput<string>('image')
    if (!image) {
      throw new Error('Docker image is required')
    }

    // Simulate container creation
    this.containerId = `container-${Date.now()}`
    this.status = 'running'
    
    // Set outputs
    this.setOutput('containerId', this.containerId)
    this.setOutput('status', this.status)
    this.setOutput('logs', this.logs)
    
    // Add initial log
    this.logs.push(`Starting container from image: ${image}`)
    
    // Handle port mappings
    const ports = this.getInput<PortMapping[]>('ports') || []
    ports.forEach(port => {
      this.logs.push(`Mapping port ${port.host} -> ${port.container}`)
    })

    // Handle volumes
    const volumes = this.getInput<VolumeMount[]>('volumes') || []
    volumes.forEach(volume => {
      this.logs.push(`Mounting volume ${volume.host} -> ${volume.container}`)
    })

    // Handle environment
    const environment = this.getInput<Record<string, string>>('environment') || {}
    Object.entries(environment).forEach(([key, value]) => {
      this.logs.push(`Setting environment: ${key}=***`)
    })

    // Handle command
    const command = this.getInput<string[]>('command')
    if (command) {
      this.logs.push(`Running command: ${command.join(' ')}`)
    }

    this.logs.push('Container started successfully')
  }

  /**
   * Stop the container
   */
  async stop(): Promise<void> {
    if (this.status === 'running') {
      this.status = 'stopped'
      this.logs.push('Container stopped')
      this.setOutput('status', this.status)
    }
  }

  /**
   * Start a stopped container
   */
  async start(): Promise<void> {
    if (this.status === 'stopped') {
      this.status = 'running'
      this.logs.push('Container started')
      this.setOutput('status', this.status)
    }
  }

  /**
   * Remove the container
   */
  async remove(): Promise<void> {
    if (this.status !== 'removed') {
      this.status = 'removed'
      this.logs.push('Container removed')
      this.setOutput('status', this.status)
    }
  }

  /**
   * Get container logs
   */
  getLogs(): string[] {
    return [...this.logs]
  }

  /**
   * Execute command in container
   */
  async exec(command: string[]): Promise<string> {
    if (this.status !== 'running') {
      throw new Error('Container is not running')
    }
    
    const cmdStr = command.join(' ')
    this.logs.push(`Executing: ${cmdStr}`)
    
    // Simulated output
    const output = `Output from: ${cmdStr}`
    this.logs.push(output)
    
    return output
  }
}

/**
 * Port mapping interface
 */
export interface PortMapping {
  host: number
  container: number
  protocol?: 'tcp' | 'udp'
}

/**
 * Volume mount interface
 */
export interface VolumeMount {
  host: string
  container: string
  readOnly?: boolean
}

/**
 * Container status type
 */
export type ContainerStatus = 'created' | 'running' | 'stopped' | 'removed'

// Export factory function
export const createDockerContainerPrimitive = () => new DockerContainerPrimitive()

// Export definition for catalog
export const dockerContainerPrimitiveDefinition = DockerContainerPrimitive.definition