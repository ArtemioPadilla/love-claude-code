import React, { useRef, useEffect, useState } from 'react'
import { L0ExternalConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * Resource isolation and monitoring interface
 */
interface ResourceMonitor {
  memory: {
    used: number
    limit: number
    peak: number
  }
  cpu: {
    usage: number
    limit: number
  }
  network: {
    requests: number
    bytesIn: number
    bytesOut: number
  }
  errors: string[]
}

/**
 * Sandbox configuration for external constructs
 */
interface SandboxConfig {
  memoryLimit: number // in MB
  cpuLimit: number // percentage (0-100)
  timeoutMs: number
  allowedDomains: string[]
  blockNetworkRequests: boolean
}

/**
 * L0 External Construct Primitive
 * Base wrapper for any external package or service
 * Provides sandbox execution, resource isolation, and monitoring
 */
export class ExternalConstructPrimitive extends L0ExternalConstruct {
  private resourceMonitor: ResourceMonitor = {
    memory: { used: 0, limit: 512, peak: 0 },
    cpu: { usage: 0, limit: 50 },
    network: { requests: 0, bytesIn: 0, bytesOut: 0 },
    errors: []
  }
  
  private sandboxConfig: SandboxConfig = {
    memoryLimit: 512, // 512MB default
    cpuLimit: 50, // 50% CPU
    timeoutMs: 30000, // 30 seconds
    allowedDomains: [],
    blockNetworkRequests: true
  }
  
  private performanceMarks: Map<string, number> = new Map()
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-external-construct-primitive',
    name: 'External Construct Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Pattern,
    description: 'Base wrapper for any external package with sandbox execution and resource monitoring',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'integration', 'wrapper'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['external', 'primitive', 'sandbox', 'isolation'],
    inputs: [
      {
        name: 'packageName',
        type: 'string',
        description: 'Name of the external package',
        required: true
      },
      {
        name: 'version',
        type: 'string',
        description: 'Package version',
        required: false,
        defaultValue: 'latest'
      },
      {
        name: 'config',
        type: 'object',
        description: 'Configuration for the external package',
        required: false,
        defaultValue: {}
      },
      {
        name: 'sandboxConfig',
        type: 'object',
        description: 'Sandbox configuration overrides',
        required: false,
        defaultValue: {}
      }
    ],
    outputs: [
      {
        name: 'instance',
        type: 'object',
        description: 'Sandboxed instance of the external package'
      },
      {
        name: 'monitor',
        type: 'object',
        description: 'Resource usage monitor'
      },
      {
        name: 'status',
        type: 'string',
        description: 'Current status (loading, ready, error)'
      }
    ],
    security: [
      {
        aspect: 'sandbox-isolation',
        description: 'External code runs in isolated sandbox',
        severity: 'high',
        recommendations: [
          'Configure appropriate resource limits',
          'Restrict network access to known domains',
          'Monitor resource usage continuously'
        ]
      },
      {
        aspect: 'resource-limits',
        description: 'Enforces memory and CPU limits',
        severity: 'medium',
        recommendations: [
          'Set appropriate limits based on package requirements',
          'Monitor for resource exhaustion',
          'Implement graceful degradation'
        ]
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'compute-time',
          unit: 'hours',
          costPerUnit: 0.0001,
          typicalUsage: 720
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'Sandbox Container'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Wrap an external package',
        code: `const external = new ExternalConstructPrimitive()
await external.initialize({
  packageName: 'lodash',
  version: '4.17.21',
  config: { compact: true }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always configure resource limits appropriately',
      'Monitor resource usage in production',
      'Use error boundaries to contain failures',
      'Validate external package inputs and outputs'
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
      builtWith: [],
      timeToCreate: 45,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ExternalConstructPrimitive.definition)
  }

  /**
   * Parse external resource definition
   */
  parseDefinition(input: string | object): any {
    if (typeof input === 'string') {
      try {
        return JSON.parse(input)
      } catch {
        return { packageName: input }
      }
    }
    return input
  }

  /**
   * Validate external resource configuration
   */
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    
    if (!config.packageName) {
      errors.push('Package name is required')
    }
    
    if (config.sandboxConfig) {
      if (config.sandboxConfig.memoryLimit && config.sandboxConfig.memoryLimit < 128) {
        errors.push('Memory limit must be at least 128MB')
      }
      if (config.sandboxConfig.cpuLimit && (config.sandboxConfig.cpuLimit < 1 || config.sandboxConfig.cpuLimit > 100)) {
        errors.push('CPU limit must be between 1 and 100')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Get the external resource configuration
   */
  getConfiguration(): any {
    return {
      package: {
        name: this.getInput<string>('packageName'),
        version: this.getInput<string>('version') || 'latest'
      },
      sandbox: this.sandboxConfig,
      monitor: this.resourceMonitor,
      config: this.getInput<object>('config') || {}
    }
  }

  /**
   * Start performance tracking
   */
  startPerformanceTracking(mark: string): void {
    this.performanceMarks.set(mark, performance.now())
  }

  /**
   * End performance tracking
   */
  endPerformanceTracking(mark: string): number {
    const start = this.performanceMarks.get(mark)
    if (!start) return 0
    
    const duration = performance.now() - start
    this.performanceMarks.delete(mark)
    return duration
  }

  /**
   * Update resource monitor
   */
  updateResourceMonitor(updates: Partial<ResourceMonitor>): void {
    if (updates.memory) {
      this.resourceMonitor.memory = { ...this.resourceMonitor.memory, ...updates.memory }
      if (this.resourceMonitor.memory.used > this.resourceMonitor.memory.peak) {
        this.resourceMonitor.memory.peak = this.resourceMonitor.memory.used
      }
    }
    if (updates.cpu) {
      this.resourceMonitor.cpu = { ...this.resourceMonitor.cpu, ...updates.cpu }
    }
    if (updates.network) {
      this.resourceMonitor.network = { ...this.resourceMonitor.network, ...updates.network }
    }
    if (updates.errors) {
      this.resourceMonitor.errors.push(...updates.errors)
    }
    
    this.setOutput('monitor', this.resourceMonitor)
  }

  /**
   * Create sandboxed instance
   */
  protected async createSandboxedInstance(): Promise<any> {
    // In a real implementation, this would create an actual sandbox
    // For now, we'll simulate the sandbox behavior
    const packageName = this.getInput<string>('packageName')
    const config = this.getInput<object>('config') || {}
    
    // Simulate loading
    this.setOutput('status', 'loading')
    
    // In production, this would use Web Workers or iframe sandboxing
    const sandboxedInstance = {
      package: packageName,
      config,
      execute: async (method: string, ...args: any[]) => {
        this.startPerformanceTracking(`execute-${method}`)
        
        try {
          // Simulate execution with resource monitoring
          this.updateResourceMonitor({
            memory: { used: Math.random() * 100 },
            cpu: { usage: Math.random() * 50 }
          })
          
          // In production, this would execute in the sandbox
          const result = { method, args, timestamp: Date.now() }
          
          const duration = this.endPerformanceTracking(`execute-${method}`)
          console.log(`Executed ${method} in ${duration}ms`)
          
          return result
        } catch (error) {
          this.updateResourceMonitor({
            errors: [`Execution error: ${error}`]
          })
          throw error
        }
      }
    }
    
    this.setOutput('status', 'ready')
    return sandboxedInstance
  }

  /**
   * Initialize the external construct
   */
  protected async onInitialize(): Promise<void> {
    const customConfig = this.getInput<object>('sandboxConfig') || {}
    this.sandboxConfig = { ...this.sandboxConfig, ...customConfig }
    
    const instance = await this.createSandboxedInstance()
    this.setOutput('instance', instance)
    this.setOutput('monitor', this.resourceMonitor)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ExternalConstructPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the external construct primitive
 */
const ExternalConstructPrimitiveComponent: React.FC<{ construct: ExternalConstructPrimitive }> = ({ construct }) => {
  const [monitor, setMonitor] = useState<ResourceMonitor>({
    memory: { used: 0, limit: 512, peak: 0 },
    cpu: { usage: 0, limit: 50 },
    network: { requests: 0, bytesIn: 0, bytesOut: 0 },
    errors: []
  })
  const [status, setStatus] = useState<string>('initializing')

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const currentMonitor = construct['getOutput']('monitor')
      const currentStatus = construct['getOutput']('status')
      
      if (currentMonitor) setMonitor(currentMonitor)
      if (currentStatus) setStatus(currentStatus)
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [construct])

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '4px', 
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>External Construct Monitor</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Memory:</strong> {monitor.memory.used}MB / {monitor.memory.limit}MB 
        (Peak: {monitor.memory.peak}MB)
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>CPU:</strong> {monitor.cpu.usage.toFixed(1)}% / {monitor.cpu.limit}%
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Network:</strong> {monitor.network.requests} requests, 
        {monitor.network.bytesIn} bytes in, {monitor.network.bytesOut} bytes out
      </div>
      
      {monitor.errors.length > 0 && (
        <div>
          <strong>Errors:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {monitor.errors.map((error, i) => (
              <li key={i} style={{ color: 'red' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Export factory function
export const createExternalConstructPrimitive = () => new ExternalConstructPrimitive()

// Export definition for catalog registration
export const externalConstructPrimitiveDefinition = ExternalConstructPrimitive.definition