import React from 'react'
import { L0ExternalConstruct } from '../../base/L0Construct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType, 
  CloudProvider 
} from '../../types'

/**
 * Docker Service Primitive - L0 External Construct
 * 
 * Zero-dependency primitive for representing Docker containers and services.
 * Provides data structures for Dockerfile parsing, docker-compose configuration,
 * port mappings, volumes, and environment variables.
 * 
 * This is a pure data representation - no actual container runtime operations.
 */

// Type definitions
export interface DockerImage {
  name: string
  tag?: string
  registry?: string
  digest?: string
}

export interface DockerPort {
  container: number
  host?: number
  protocol?: 'tcp' | 'udp'
  interface?: string
}

export interface DockerVolume {
  type: 'bind' | 'volume' | 'tmpfs'
  source: string
  target: string
  readonly?: boolean
  options?: Record<string, any>
}

export interface DockerEnvironment {
  [key: string]: string | number | boolean
}

export interface DockerHealthcheck {
  test: string[] | string
  interval?: string
  timeout?: string
  retries?: number
  startPeriod?: string
}

export interface DockerNetworkConfig {
  name: string
  driver?: 'bridge' | 'host' | 'overlay' | 'none'
  aliases?: string[]
  ipv4Address?: string
  ipv6Address?: string
}

export interface DockerResourceLimits {
  cpus?: number
  memory?: string
  memorySwap?: string
  memoryReservation?: string
  cpuShares?: number
  cpuQuota?: number
  cpuPeriod?: number
  devices?: string[]
}

export interface DockerLogging {
  driver?: string
  options?: Record<string, string>
}

export interface DockerRestartPolicy {
  condition: 'no' | 'always' | 'on-failure' | 'unless-stopped'
  delay?: string
  maxAttempts?: number
  window?: string
}

export interface DockerServiceConfig {
  image: DockerImage
  command?: string | string[]
  entrypoint?: string | string[]
  workingDir?: string
  user?: string
  hostname?: string
  domainName?: string
  ports?: DockerPort[]
  volumes?: DockerVolume[]
  environment?: DockerEnvironment
  envFile?: string | string[]
  labels?: Record<string, string>
  networks?: DockerNetworkConfig[]
  healthcheck?: DockerHealthcheck
  resources?: DockerResourceLimits
  logging?: DockerLogging
  restart?: DockerRestartPolicy
  dependsOn?: string[] | Record<string, { condition: string }>
  links?: string[]
  externalLinks?: string[]
  extra_hosts?: string[]
  privileged?: boolean
  readOnly?: boolean
  stdin_open?: boolean
  tty?: boolean
  init?: boolean
  runtime?: string
}

export interface DockerfileInstruction {
  instruction: string
  arguments: string | string[]
  lineNumber?: number
}

export interface DockerfileStage {
  name?: string
  base: DockerImage
  instructions: DockerfileInstruction[]
}

export interface DockerComposeService {
  name: string
  config: DockerServiceConfig
}

export interface DockerComposeConfig {
  version?: string
  services: Map<string, DockerServiceConfig>
  networks?: Record<string, any>
  volumes?: Record<string, any>
  configs?: Record<string, any>
  secrets?: Record<string, any>
}

export interface DockerServicePrimitiveConfig {
  dockerfile?: string
  dockerCompose?: string | object
  service?: DockerServiceConfig
}

export interface DockerServicePrimitiveProps {
  config: DockerServicePrimitiveConfig
  onParse?: (result: { dockerfile?: DockerfileStage[]; compose?: DockerComposeConfig; service?: DockerServiceConfig }) => void
  onValidate?: (result: { valid: boolean; errors?: string[] }) => void
  showVisualization?: boolean
}

/**
 * Docker Service Primitive Component
 */
export const DockerServicePrimitive: React.FC<DockerServicePrimitiveProps> = ({
  config,
  onParse,
  onValidate,
  showVisualization = false
}) => {
  const [parsed, setParsed] = React.useState<any>(null)
  const [errors, setErrors] = React.useState<string[]>([])

  React.useEffect(() => {
    const construct = new DockerServicePrimitiveConstruct()
    
    try {
      const result: any = {}
      
      if (config.dockerfile) {
        result.dockerfile = construct.parseDockerfile(config.dockerfile)
      }
      
      if (config.dockerCompose) {
        const composeConfig = construct.parseDefinition(config.dockerCompose)
        result.compose = composeConfig
      }
      
      if (config.service) {
        result.service = config.service
      }
      
      const validation = construct.validateConfiguration(result)
      
      if (validation.valid) {
        setParsed(result)
        onParse?.(result)
        setErrors([])
      } else {
        setErrors(validation.errors || [])
        onValidate?.(validation)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setErrors([errorMessage])
      onValidate?.({ valid: false, errors: [errorMessage] })
    }
  }, [config])

  if (!showVisualization) {
    return null
  }

  return (
    <div className="docker-service-primitive">
      {errors.length > 0 && (
        <div className="errors">
          <h4>Validation Errors:</h4>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {parsed?.service && (
        <div className="service-info">
          <h3>Docker Service</h3>
          <div className="image">
            Image: {parsed.service.image.name}:{parsed.service.image.tag || 'latest'}
          </div>
          
          {parsed.service.ports && parsed.service.ports.length > 0 && (
            <div className="ports">
              <h4>Ports:</h4>
              <ul>
                {parsed.service.ports.map((port: any, i: number) => (
                  <li key={i}>
                    {port.host || '*'}:{port.container}/{port.protocol || 'tcp'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {parsed.service.volumes && parsed.service.volumes.length > 0 && (
            <div className="volumes">
              <h4>Volumes:</h4>
              <ul>
                {parsed.service.volumes.map((vol: any, i: number) => (
                  <li key={i}>
                    {vol.source} → {vol.target} ({vol.type})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {parsed?.compose && (
        <div className="compose-info">
          <h3>Docker Compose Services ({parsed.compose.services.size})</h3>
          <ul>
            {Array.from(parsed.compose.services.entries()).map((entry: [string, any]) => {
              const [name, service] = entry
              return (
              <li key={name}>
                <strong>{name}:</strong> {service.image.name}:{service.image.tag || 'latest'}
              </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Docker Service Primitive Construct Class
 */
export class DockerServicePrimitiveConstruct extends L0ExternalConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-docker-service-primitive',
    name: 'Docker Service Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.EXTERNAL,
    description: 'Zero-dependency primitive for Docker container and service configuration',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'container', 'docker'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['docker', 'container', 'service', 'compose', 'primitive'],
    inputs: [
      {
        name: 'dockerfile',
        type: 'string',
        description: 'Dockerfile content to parse',
        required: false
      },
      {
        name: 'dockerCompose',
        type: 'string | object',
        description: 'Docker Compose configuration',
        required: false
      },
      {
        name: 'service',
        type: 'DockerServiceConfig',
        description: 'Direct service configuration',
        required: false
      }
    ],
    outputs: [
      {
        name: 'serviceConfig',
        type: 'DockerServiceConfig',
        description: 'Parsed service configuration'
      },
      {
        name: 'composeConfig',
        type: 'DockerComposeConfig',
        description: 'Parsed compose configuration'
      },
      {
        name: 'dockerfile',
        type: 'DockerfileStage[]',
        description: 'Parsed Dockerfile stages'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'Docker'
    },
    examples: [
      {
        title: 'Parse Docker Compose',
        description: 'Parse a docker-compose.yml file',
        code: `const docker = new DockerServicePrimitiveConstruct()
const config = docker.parseDefinition({
  version: '3.8',
  services: {
    web: {
      image: 'nginx:alpine',
      ports: ['80:80'],
      volumes: ['./html:/usr/share/nginx/html:ro']
    }
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Validate port mappings for conflicts',
      'Ensure volume paths are properly formatted',
      'Check environment variable naming conventions',
      'Use for configuration only - no runtime operations'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      generatedBy: 'Claude'
    }
  }

  constructor() {
    super(DockerServicePrimitiveConstruct.definition)
  }

  /**
   * Parse Docker Compose or service definition
   */
  parseDefinition(input: string | object): DockerComposeConfig {
    let composeData: any
    
    if (typeof input === 'string') {
      // Simple YAML-like parsing (basic implementation)
      // In production, would use a proper YAML parser
      composeData = this.parseSimpleYaml(input)
    } else {
      composeData = input
    }

    const services = new Map<string, DockerServiceConfig>()
    
    if (composeData.services) {
      for (const [name, serviceData] of Object.entries(composeData.services)) {
        services.set(name, this.parseServiceConfig(serviceData as any))
      }
    }

    const config: DockerComposeConfig = {
      version: composeData.version,
      services,
      networks: composeData.networks,
      volumes: composeData.volumes,
      configs: composeData.configs,
      secrets: composeData.secrets
    }

    this.setOutput('composeConfig', config)
    return config
  }

  /**
   * Parse service configuration
   */
  private parseServiceConfig(data: any): DockerServiceConfig {
    const config: DockerServiceConfig = {
      image: this.parseImageString(data.image || 'unknown'),
      command: data.command,
      entrypoint: data.entrypoint,
      workingDir: data.working_dir,
      user: data.user,
      hostname: data.hostname,
      domainName: data.domainname,
      ports: this.parsePorts(data.ports),
      volumes: this.parseVolumes(data.volumes),
      environment: this.parseEnvironment(data.environment),
      envFile: data.env_file,
      labels: data.labels,
      networks: this.parseNetworks(data.networks),
      healthcheck: data.healthcheck,
      resources: this.parseResources(data.deploy?.resources),
      logging: data.logging,
      restart: this.parseRestartPolicy(data.restart),
      dependsOn: data.depends_on,
      links: data.links,
      externalLinks: data.external_links,
      extra_hosts: data.extra_hosts,
      privileged: data.privileged,
      readOnly: data.read_only,
      stdin_open: data.stdin_open,
      tty: data.tty,
      init: data.init,
      runtime: data.runtime
    }

    return config
  }

  /**
   * Parse image string
   */
  private parseImageString(imageStr: string): DockerImage {
    // Parse registry/name:tag format
    const parts = imageStr.split('/')
    let registry: string | undefined
    let nameAndTag: string
    
    if (parts.length > 2 || (parts.length === 2 && parts[0].includes('.'))) {
      registry = parts[0]
      nameAndTag = parts.slice(1).join('/')
    } else {
      nameAndTag = imageStr
    }
    
    const [name, tag] = nameAndTag.split(':')
    
    return {
      name: name || 'unknown',
      tag: tag || 'latest',
      registry
    }
  }

  /**
   * Parse port mappings
   */
  private parsePorts(ports?: any[]): DockerPort[] | undefined {
    if (!ports) return undefined
    
    return ports.map(port => {
      if (typeof port === 'string') {
        // Parse "host:container/protocol" format
        const match = port.match(/^(?:(\d+\.\d+\.\d+\.\d+):)?(?:(\d+):)?(\d+)(?:\/(tcp|udp))?$/)
        if (!match) return { container: 0 }
        
        return {
          interface: match[1],
          host: match[2] ? parseInt(match[2], 10) : undefined,
          container: parseInt(match[3], 10),
          protocol: (match[4] as 'tcp' | 'udp') || 'tcp'
        }
      } else if (typeof port === 'object') {
        return {
          container: port.target,
          host: port.published,
          protocol: port.protocol || 'tcp',
          interface: port.interface
        }
      }
      
      return { container: 0 }
    })
  }

  /**
   * Parse volume mappings
   */
  private parseVolumes(volumes?: any[]): DockerVolume[] | undefined {
    if (!volumes) return undefined
    
    return volumes.map(volume => {
      if (typeof volume === 'string') {
        // Parse "source:target:options" format
        const parts = volume.split(':')
        const readonly = parts[2]?.includes('ro')
        
        return {
          type: parts[0].startsWith('/') || parts[0].startsWith('.') ? 'bind' : 'volume',
          source: parts[0],
          target: parts[1] || parts[0],
          readonly
        }
      } else if (typeof volume === 'object') {
        return {
          type: volume.type || 'volume',
          source: volume.source,
          target: volume.target,
          readonly: volume.read_only,
          options: volume.volume?.options
        }
      }
      
      return { type: 'volume', source: '', target: '' }
    })
  }

  /**
   * Parse environment variables
   */
  private parseEnvironment(env?: any): DockerEnvironment | undefined {
    if (!env) return undefined
    
    if (Array.isArray(env)) {
      // Parse KEY=VALUE format
      const result: DockerEnvironment = {}
      env.forEach(item => {
        const [key, ...valueParts] = item.split('=')
        result[key] = valueParts.join('=')
      })
      return result
    } else if (typeof env === 'object') {
      return env
    }
    
    return undefined
  }

  /**
   * Parse networks
   */
  private parseNetworks(networks?: any): DockerNetworkConfig[] | undefined {
    if (!networks) return undefined
    
    if (Array.isArray(networks)) {
      return networks.map(net => ({ name: net }))
    } else if (typeof networks === 'object') {
      return Object.entries(networks).map(([name, config]: [string, any]) => ({
        name,
        aliases: config?.aliases,
        ipv4Address: config?.ipv4_address,
        ipv6Address: config?.ipv6_address
      }))
    }
    
    return undefined
  }

  /**
   * Parse resource limits
   */
  private parseResources(resources?: any): DockerResourceLimits | undefined {
    if (!resources) return undefined
    
    const limits = resources.limits || {}
    const reservations = resources.reservations || {}
    
    return {
      cpus: limits.cpus,
      memory: limits.memory,
      memorySwap: limits.memory_swap,
      memoryReservation: reservations.memory,
      cpuShares: limits.cpu_shares,
      cpuQuota: limits.cpu_quota,
      cpuPeriod: limits.cpu_period,
      devices: limits.devices
    }
  }

  /**
   * Parse restart policy
   */
  private parseRestartPolicy(restart?: any): DockerRestartPolicy | undefined {
    if (!restart) return undefined
    
    if (typeof restart === 'string') {
      return { condition: restart as any }
    } else if (typeof restart === 'object') {
      return {
        condition: restart.condition,
        delay: restart.delay,
        maxAttempts: restart.max_attempts,
        window: restart.window
      }
    }
    
    return undefined
  }

  /**
   * Parse Dockerfile
   */
  parseDockerfile(dockerfile: string): DockerfileStage[] {
    const lines = dockerfile.split('\n')
    const stages: DockerfileStage[] = []
    let currentStage: DockerfileStage | null = null
    
    lines.forEach((line, lineNumber) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      
      const match = trimmed.match(/^(\w+)\s+(.+)$/)
      if (!match) return
      
      const [, instruction, args] = match
      const upperInstruction = instruction.toUpperCase()
      
      if (upperInstruction === 'FROM') {
        // Start new stage
        const fromMatch = args.match(/^(.+?)(?:\s+AS\s+(.+))?$/)
        if (fromMatch) {
          const [, baseImage, stageName] = fromMatch
          currentStage = {
            name: stageName,
            base: this.parseImageString(baseImage),
            instructions: []
          }
          stages.push(currentStage)
        }
      } else if (currentStage) {
        // Add instruction to current stage
        currentStage.instructions.push({
          instruction: upperInstruction,
          arguments: this.parseDockerfileArgs(upperInstruction, args),
          lineNumber: lineNumber + 1
        })
      }
    })
    
    this.setOutput('dockerfile', stages)
    return stages
  }

  /**
   * Parse Dockerfile instruction arguments
   */
  private parseDockerfileArgs(instruction: string, args: string): string | string[] {
    // Handle JSON array format
    if (args.startsWith('[')) {
      try {
        return JSON.parse(args)
      } catch {
        return args
      }
    }
    
    // Handle special instructions
    switch (instruction) {
      case 'EXPOSE':
      case 'VOLUME':
        return args.split(/\s+/)
      case 'ENV':
      case 'LABEL':
        // Could be KEY=VALUE or KEY VALUE format
        return args
      default:
        return args
    }
  }

  /**
   * Generate Docker Compose entry
   */
  generateComposeEntry(service: DockerServiceConfig): string {
    const lines: string[] = []
    
    // Image
    lines.push(`  image: ${service.image.registry ? service.image.registry + '/' : ''}${service.image.name}:${service.image.tag || 'latest'}`)
    
    // Command
    if (service.command) {
      if (Array.isArray(service.command)) {
        lines.push(`  command: [${service.command.map(c => `"${c}"`).join(', ')}]`)
      } else {
        lines.push(`  command: ${service.command}`)
      }
    }
    
    // Ports
    if (service.ports && service.ports.length > 0) {
      lines.push('  ports:')
      service.ports.forEach(port => {
        const portStr = port.host ? `${port.host}:${port.container}` : `${port.container}`
        lines.push(`    - "${portStr}${port.protocol !== 'tcp' ? '/' + port.protocol : ''}"`)
      })
    }
    
    // Volumes
    if (service.volumes && service.volumes.length > 0) {
      lines.push('  volumes:')
      service.volumes.forEach(vol => {
        const volStr = `${vol.source}:${vol.target}${vol.readonly ? ':ro' : ''}`
        lines.push(`    - "${volStr}"`)
      })
    }
    
    // Environment
    if (service.environment) {
      lines.push('  environment:')
      Object.entries(service.environment).forEach(([key, value]) => {
        lines.push(`    ${key}: "${value}"`)
      })
    }
    
    // Networks
    if (service.networks && service.networks.length > 0) {
      lines.push('  networks:')
      service.networks.forEach(net => {
        lines.push(`    - ${net.name}`)
      })
    }
    
    // Restart
    if (service.restart) {
      lines.push(`  restart: ${service.restart.condition}`)
    }
    
    return lines.join('\n')
  }

  /**
   * Simple YAML parser (basic implementation)
   */
  private parseSimpleYaml(yaml: string): any {
    // This is a very basic YAML parser for demo purposes
    // In production, use a proper YAML parser library
    const result: any = {}
    const lines = yaml.split('\n')
    const stack: any[] = [result]
    const indentStack: number[] = [0]
    
    lines.forEach(line => {
      if (!line.trim() || line.trim().startsWith('#')) return
      
      const indent = line.length - line.trimStart().length
      const trimmed = line.trim()
      
      // Handle key: value
      const match = trimmed.match(/^([^:]+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        
        // Pop stack to correct level
        while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
          stack.pop()
          indentStack.pop()
        }
        
        const current = stack[stack.length - 1]
        
        if (!value) {
          // New object
          current[key] = {}
          stack.push(current[key])
          indentStack.push(indent)
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Inline array
          try {
            current[key] = JSON.parse(value)
          } catch {
            current[key] = value
          }
        } else {
          // Simple value
          current[key] = value.replace(/^["']|["']$/g, '')
        }
      } else if (trimmed.startsWith('- ')) {
        // Array item
        const value = trimmed.substring(2)
        const current = stack[stack.length - 1]
        
        if (!Array.isArray(current)) {
          // Convert to array
          const parent = stack[stack.length - 2]
          const key = Object.keys(parent).find(k => parent[k] === current)
          if (key) {
            parent[key] = []
            stack[stack.length - 1] = parent[key]
          }
        }
        
        if (Array.isArray(stack[stack.length - 1])) {
          stack[stack.length - 1].push(value.replace(/^["']|["']$/g, ''))
        }
      }
    })
    
    return result
  }

  /**
   * Validate Docker configuration
   */
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    // Validate service config
    if (config.service) {
      const serviceErrors = this.validateServiceConfig(config.service)
      errors.push(...serviceErrors)
    }

    // Validate compose config
    if (config.compose) {
      config.compose.services.forEach((service: DockerServiceConfig, name: string) => {
        const serviceErrors = this.validateServiceConfig(service, name)
        errors.push(...serviceErrors)
      })
    }

    // Validate Dockerfile
    if (config.dockerfile) {
      config.dockerfile.forEach((stage: DockerfileStage, index: number) => {
        if (!stage.base || !stage.base.name) {
          errors.push(`Dockerfile stage ${index + 1} missing base image`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate service configuration
   */
  private validateServiceConfig(service: DockerServiceConfig, name?: string): string[] {
    const errors: string[] = []
    const prefix = name ? `Service '${name}': ` : ''

    // Validate image
    if (!service.image || !service.image.name) {
      errors.push(`${prefix}Image name is required`)
    }

    // Validate ports
    if (service.ports) {
      service.ports.forEach((port, i) => {
        if (port.container < 1 || port.container > 65535) {
          errors.push(`${prefix}Invalid container port ${port.container}`)
        }
        if (port.host && (port.host < 1 || port.host > 65535)) {
          errors.push(`${prefix}Invalid host port ${port.host}`)
        }
      })
    }

    // Validate volumes
    if (service.volumes) {
      service.volumes.forEach((vol, i) => {
        if (!vol.source) {
          errors.push(`${prefix}Volume ${i + 1} missing source`)
        }
        if (!vol.target) {
          errors.push(`${prefix}Volume ${i + 1} missing target`)
        }
        if (!vol.target.startsWith('/')) {
          errors.push(`${prefix}Volume target must be absolute path: ${vol.target}`)
        }
      })
    }

    // Validate environment
    if (service.environment) {
      Object.keys(service.environment).forEach(key => {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
          errors.push(`${prefix}Invalid environment variable name: ${key}`)
        }
      })
    }

    // Validate resources
    if (service.resources) {
      if (service.resources.cpus && service.resources.cpus <= 0) {
        errors.push(`${prefix}CPU limit must be positive`)
      }
      if (service.resources.memory && !this.isValidMemoryString(service.resources.memory)) {
        errors.push(`${prefix}Invalid memory format: ${service.resources.memory}`)
      }
    }

    return errors
  }

  /**
   * Validate memory string format
   */
  private isValidMemoryString(memory: string): boolean {
    return /^\d+[bkmg]?$/i.test(memory)
  }

  /**
   * Get standardized configuration
   */
  getConfiguration(): DockerServicePrimitiveConfig {
    return {
      dockerfile: this.getInput('dockerfile'),
      dockerCompose: this.getInput('dockerCompose'),
      service: this.getInput('service')
    }
  }
}

// Factory function
export const createDockerServicePrimitive = () => new DockerServicePrimitiveConstruct()

// Export for registration
export const dockerServicePrimitive = new DockerServicePrimitiveConstruct()