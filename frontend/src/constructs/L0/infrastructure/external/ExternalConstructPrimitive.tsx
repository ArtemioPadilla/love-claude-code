/**
 * External Construct Primitive (L0)
 * 
 * Foundation primitive for wrapping external packages, libraries, and services
 * as Love Claude Code constructs. This is the base for all external integrations.
 * 
 * Features:
 * - Sandbox execution environment
 * - Resource isolation and monitoring
 * - Event-driven communication
 * - Crash recovery mechanisms
 * - Health check interface
 * - Lifecycle management
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { L0InfrastructureConstruct } from '../../../base/L0Construct'
import { 
  PlatformConstructDefinition,
  ConstructType,
  ConstructLevel,
  CloudProvider
} from '../../../types'
import { externalConstructPrimitiveDefinition } from './ExternalConstructPrimitive.definition'

// Type definitions
export type ExternalSourceType = 'npm' | 'docker' | 'git' | 'url' | 'mcp' | 'api' | 'binary'

export interface ExternalSource {
  type: ExternalSourceType
  identifier: string  // package name, image, repo URL, etc.
  version?: string
  config?: Record<string, any>
}

export interface SandboxPolicy {
  network?: 'none' | 'restricted' | 'host-only' | 'full'
  filesystem?: 'none' | 'read-only' | 'restricted' | 'full'
  cpu?: number  // CPU cores limit (e.g., 0.5 = half core)
  memory?: string  // Memory limit (e.g., '512MB', '2GB')
  timeout?: number  // Execution timeout in ms
  env?: Record<string, string>  // Environment variables
}

export interface SandboxConfig {
  enabled: boolean
  policies?: SandboxPolicy
  isolation?: 'process' | 'container' | 'vm'
}

export interface ResourceLimits {
  cpu?: number
  memory?: string
  disk?: string
  network?: string  // bandwidth limit
}

export interface ResourceConfig {
  monitoring?: boolean
  limits?: ResourceLimits
  alertThresholds?: Partial<ResourceLimits>
}

export interface LifecycleHooks {
  onInitialize?: (instance: any) => Promise<void> | void
  onReady?: (instance: any) => Promise<void> | void
  onError?: (error: Error) => Promise<void> | void
  onStop?: () => Promise<void> | void
  onDestroy?: () => Promise<void> | void
}

export interface LifecycleConfig extends LifecycleHooks {
  autoStart?: boolean
  startTimeout?: number
  stopTimeout?: number
}

export interface RecoveryConfig {
  enabled?: boolean
  maxRetries?: number
  retryDelay?: number
  strategy?: 'immediate' | 'linear-backoff' | 'exponential-backoff'
  onRecoveryFailed?: (error: Error) => void
}

export interface CommunicationConfig {
  protocol?: 'stdio' | 'ipc' | 'websocket' | 'http' | 'grpc'
  encoding?: 'json' | 'msgpack' | 'protobuf' | 'raw'
  messageHandler?: (message: any) => void
}

export interface ExternalConstructConfig {
  source: ExternalSource
  sandbox?: SandboxConfig
  resources?: ResourceConfig
  lifecycle?: LifecycleConfig
  recovery?: RecoveryConfig
  communication?: CommunicationConfig
}

export type ExternalConstructState = 
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'crashed'
  | 'recovering'
  | 'destroyed'

export interface ResourceMetrics {
  cpu: number  // percentage
  memory: number  // bytes
  disk?: number  // bytes
  network?: {
    bytesIn: number
    bytesOut: number
  }
}

export interface HealthStatus {
  healthy: boolean
  lastCheck: Date
  details?: Record<string, any>
  errors?: Error[]
}

export interface ExternalConstructPrimitiveProps {
  config: ExternalConstructConfig
  onStateChange?: (state: ExternalConstructState) => void
  onMetricsUpdate?: (metrics: ResourceMetrics) => void
  onHealthCheck?: (health: HealthStatus) => void
  children?: React.ReactNode
}

/**
 * External Construct Primitive Component
 */
export const ExternalConstructPrimitive: React.FC<ExternalConstructPrimitiveProps> = ({
  config,
  onStateChange,
  onMetricsUpdate,
  onHealthCheck,
  children
}) => {
  const [state, setState] = useState<ExternalConstructState>('uninitialized')
  const [instance, setInstance] = useState<any>(null)
  const [metrics, setMetrics] = useState<ResourceMetrics>({
    cpu: 0,
    memory: 0
  })
  const [health, setHealth] = useState<HealthStatus>({
    healthy: true,
    lastCheck: new Date()
  })
  const [logs, setLogs] = useState<string[]>([])
  
  const processRef = useRef<any>(null)
  const metricsIntervalRef = useRef<NodeJS.Timeout>()
  const healthIntervalRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)
  const eventHandlersRef = useRef<Map<string, ((...args: any[]) => void)[]>>(new Map())

  // Update state and notify
  const updateState = useCallback((newState: ExternalConstructState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  // Add log entry
  const addLog = useCallback((message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toISOString()
    setLogs(prev => [...prev, `[${timestamp}] [${level.toUpperCase()}] ${message}`])
  }, [])

  // Initialize external construct
  const initialize = useCallback(async () => {
    try {
      updateState('initializing')
      addLog(`Initializing external construct: ${config.source.type}:${config.source.identifier}`)

      // Execute lifecycle hook
      await config.lifecycle?.onInitialize?.(null)

      // Load based on source type
      let loadedInstance: any = null
      
      switch (config.source.type) {
        case 'npm': {
          loadedInstance = await loadNpmPackage(config.source)
          break
        }
          
        case 'docker': {
          loadedInstance = await loadDockerContainer(config.source, config.sandbox)
          break
        }
          
        case 'mcp': {
          loadedInstance = await loadMCPServer(config.source, config.communication)
          break
        }
          
        case 'api': {
          loadedInstance = await loadAPIEndpoint(config.source)
          break
        }
          
        case 'git': {
          loadedInstance = await loadGitRepository(config.source)
          break
        }
          
        case 'url': {
          loadedInstance = await loadURLResource(config.source)
          break
        }
          
        case 'binary': {
          loadedInstance = await loadBinaryExecutable(config.source, config.sandbox)
          break
        }
          
        default: {
          throw new Error(`Unsupported source type: ${config.source.type}`)
        }
      }

      setInstance(loadedInstance)
      processRef.current = loadedInstance
      
      // Start monitoring if enabled
      if (config.resources?.monitoring) {
        startResourceMonitoring()
      }
      
      // Start health checks
      startHealthChecks()
      
      // Execute ready hook
      await config.lifecycle?.onReady?.(loadedInstance)
      
      updateState('ready')
      addLog('External construct initialized successfully')
      
    } catch (error) {
      addLog(`Initialization failed: ${error.message}`, 'error')
      await handleError(error as Error)
    }
  }, [config, updateState, addLog])

  // Load NPM package
  const loadNpmPackage = async (source: ExternalSource): Promise<any> => {
    addLog(`Loading NPM package: ${source.identifier}@${source.version || 'latest'}`)
    
    // In a real implementation, this would use dynamic import or a package loader
    // For now, simulate loading
    return {
      type: 'npm',
      package: source.identifier,
      version: source.version,
      loaded: true
    }
  }

  // Load Docker container
  const loadDockerContainer = async (source: ExternalSource, sandbox?: SandboxConfig): Promise<any> => {
    addLog(`Loading Docker container: ${source.identifier}:${source.version || 'latest'}`)
    
    return {
      type: 'docker',
      image: source.identifier,
      version: source.version,
      config: source.config,
      sandbox: sandbox
    }
  }

  // Load MCP server
  const loadMCPServer = async (source: ExternalSource, communication?: CommunicationConfig): Promise<any> => {
    addLog(`Loading MCP server: ${source.identifier}`)
    
    return {
      type: 'mcp',
      server: source.identifier,
      config: source.config,
      communication: communication
    }
  }

  // Load API endpoint
  const loadAPIEndpoint = async (source: ExternalSource): Promise<any> => {
    addLog(`Loading API endpoint: ${source.identifier}`)
    
    return {
      type: 'api',
      endpoint: source.identifier,
      config: source.config
    }
  }

  // Load Git repository
  const loadGitRepository = async (source: ExternalSource): Promise<any> => {
    addLog(`Loading Git repository: ${source.identifier}`)
    
    return {
      type: 'git',
      repository: source.identifier,
      version: source.version || 'main',
      config: source.config
    }
  }

  // Load URL resource
  const loadURLResource = async (source: ExternalSource): Promise<any> => {
    addLog(`Loading URL resource: ${source.identifier}`)
    
    return {
      type: 'url',
      url: source.identifier,
      config: source.config
    }
  }

  // Load binary executable
  const loadBinaryExecutable = async (source: ExternalSource, sandbox?: SandboxConfig): Promise<any> => {
    addLog(`Loading binary executable: ${source.identifier}`)
    
    return {
      type: 'binary',
      path: source.identifier,
      config: source.config,
      sandbox: sandbox
    }
  }

  // Start resource monitoring
  const startResourceMonitoring = useCallback(() => {
    metricsIntervalRef.current = setInterval(() => {
      // In real implementation, collect actual metrics
      const newMetrics: ResourceMetrics = {
        cpu: Math.random() * 100,
        memory: Math.random() * 1024 * 1024 * 512, // Random up to 512MB
        network: {
          bytesIn: Math.random() * 1024 * 1024,
          bytesOut: Math.random() * 1024 * 1024
        }
      }
      
      setMetrics(newMetrics)
      onMetricsUpdate?.(newMetrics)
      
      // Check resource limits
      if (config.resources?.limits) {
        checkResourceLimits(newMetrics)
      }
    }, 1000)
  }, [config.resources, onMetricsUpdate])

  // Check resource limits
  const checkResourceLimits = (currentMetrics: ResourceMetrics) => {
    const limits = config.resources?.limits
    if (!limits) return
    
    if (limits.cpu && currentMetrics.cpu > limits.cpu * 100) {
      emit('onResourceLimit', { resource: 'cpu', current: currentMetrics.cpu, limit: limits.cpu })
    }
    
    if (limits.memory) {
      const memoryLimit = parseMemoryString(limits.memory)
      if (currentMetrics.memory > memoryLimit) {
        emit('onResourceLimit', { resource: 'memory', current: currentMetrics.memory, limit: memoryLimit })
      }
    }
  }

  // Start health checks
  const startHealthChecks = useCallback(() => {
    healthIntervalRef.current = setInterval(async () => {
      const healthStatus = await performHealthCheck()
      setHealth(healthStatus)
      onHealthCheck?.(healthStatus)
    }, 5000)
  }, [onHealthCheck])

  // Perform health check
  const performHealthCheck = async (): Promise<HealthStatus> => {
    try {
      // In real implementation, check actual health
      const healthy = state === 'ready' || state === 'running'
      
      return {
        healthy,
        lastCheck: new Date(),
        details: {
          state,
          uptime: Date.now(),
          errors: []
        }
      }
    } catch (error) {
      return {
        healthy: false,
        lastCheck: new Date(),
        errors: [error as Error]
      }
    }
  }

  // Handle errors
  const handleError = async (error: Error) => {
    addLog(`Error occurred: ${error.message}`, 'error')
    emit('onError', error)
    
    await config.lifecycle?.onError?.(error)
    
    if (config.recovery?.enabled && retryCountRef.current < (config.recovery.maxRetries || 3)) {
      await attemptRecovery(error)
    } else {
      updateState('crashed')
      emit('onCrash', error)
    }
  }

  // Attempt recovery
  const attemptRecovery = async (error: Error) => {
    updateState('recovering')
    emit('onRecover', { attempt: retryCountRef.current + 1, error })
    
    const delay = calculateRetryDelay()
    addLog(`Attempting recovery in ${delay}ms (attempt ${retryCountRef.current + 1})`)
    
    setTimeout(async () => {
      retryCountRef.current++
      try {
        await initialize()
        retryCountRef.current = 0
      } catch (recoveryError) {
        if (retryCountRef.current >= (config.recovery?.maxRetries || 3)) {
          config.recovery?.onRecoveryFailed?.(recoveryError as Error)
          updateState('crashed')
        }
      }
    }, delay)
  }

  // Calculate retry delay
  const calculateRetryDelay = (): number => {
    const baseDelay = config.recovery?.retryDelay || 1000
    const strategy = config.recovery?.strategy || 'exponential-backoff'
    
    switch (strategy) {
      case 'immediate': {
        return 0
      }
      case 'linear-backoff': {
        return baseDelay * (retryCountRef.current + 1)
      }
      case 'exponential-backoff': {
        return baseDelay * Math.pow(2, retryCountRef.current)
      }
      default: {
        return baseDelay
      }
    }
  }

  // Stop external construct
  const stop = useCallback(async () => {
    try {
      updateState('stopping')
      addLog('Stopping external construct')
      
      await config.lifecycle?.onStop?.()
      
      // Clean up based on type
      if (processRef.current) {
        // Stop process/container/service
        processRef.current = null
      }
      
      updateState('stopped')
      addLog('External construct stopped')
      
    } catch (error) {
      addLog(`Error stopping: ${error.message}`, 'error')
      await handleError(error as Error)
    }
  }, [config.lifecycle, updateState, addLog])

  // Destroy external construct
  const destroy = useCallback(async () => {
    try {
      await stop()
      
      // Clear intervals
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current)
      }
      
      await config.lifecycle?.onDestroy?.()
      
      updateState('destroyed')
      emit('onDestroy')
      addLog('External construct destroyed')
      
    } catch (error) {
      addLog(`Error destroying: ${error.message}`, 'error')
    }
  }, [stop, config.lifecycle, updateState, addLog])

  // Event emitter functions
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const handlers = eventHandlersRef.current.get(event) || []
    handlers.push(handler)
    eventHandlersRef.current.set(event, handlers)
  }, [])

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    const handlers = eventHandlersRef.current.get(event) || []
    const filtered = handlers.filter(h => h !== handler)
    eventHandlersRef.current.set(event, filtered)
  }, [])

  const emit = useCallback((event: string, ...args: any[]) => {
    const handlers = eventHandlersRef.current.get(event) || []
    handlers.forEach(handler => handler(...args))
  }, [])

  // Parse memory string to bytes
  const parseMemoryString = (memory: string): number => {
    const match = memory.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2]?.toUpperCase() || 'B'
    
    const multipliers: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024
    }
    
    return value * (multipliers[unit] || 1)
  }

  // Initialize on mount
  useEffect(() => {
    if (config.lifecycle?.autoStart !== false) {
      initialize()
    }

    return () => {
      destroy()
    }
  }, [])

  // Re-initialize on config change
  useEffect(() => {
    if (state !== 'uninitialized' && state !== 'initializing') {
      destroy().then(() => {
        if (config.lifecycle?.autoStart !== false) {
          initialize()
        }
      })
    }
  }, [config.source.identifier, config.source.type])

  // Public API exposed to parent
  useEffect(() => {
    if (instance && children && React.isValidElement(children)) {
      const childProps = {
        instance,
        state,
        metrics,
        health,
        logs,
        on,
        off,
        emit,
        stop,
        destroy,
        execute: async (method: string, ...args: any[]) => {
          if (!instance) throw new Error('Instance not initialized')
          if (typeof instance[method] === 'function') {
            return await instance[method](...args)
          }
          throw new Error(`Method ${method} not found`)
        },
        getProperty: (property: string) => {
          if (!instance) throw new Error('Instance not initialized')
          return instance[property]
        },
        setProperty: (property: string, value: any) => {
          if (!instance) throw new Error('Instance not initialized')
          instance[property] = value
        }
      }
      
      return React.cloneElement(children as React.ReactElement, childProps)
    }
  }, [instance, state, metrics, health, logs, children, on, off, emit, stop, destroy])

  return <>{children}</>
}

/**
 * L0 External Construct Primitive Class
 */
export class ExternalConstructPrimitiveConstruct extends L0InfrastructureConstruct {
  static definition = externalConstructPrimitiveDefinition

  private config: ExternalConstructConfig
  private instance: any = null
  private state: ExternalConstructState = 'uninitialized'
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map()

  constructor() {
    super(ExternalConstructPrimitiveConstruct.definition)
  }

  /**
   * Initialize with configuration
   */
  async initialize(config: ExternalConstructConfig): Promise<void> {
    this.config = config
    this.setInput('source', config.source)
    this.setInput('sandbox', config.sandbox)
    this.setInput('resources', config.resources)
    this.setInput('lifecycle', config.lifecycle)
    this.setInput('recovery', config.recovery)
    this.setInput('communication', config.communication)
    
    await this.onInitialize()
  }

  /**
   * Initialize the external construct
   */
  protected async onInitialize(): Promise<void> {
    this.state = 'initializing'
    
    try {
      // Load external based on type
      switch (this.config.source.type) {
        case 'npm': {
          this.instance = await this.loadNpmPackage()
          break
        }
        case 'docker': {
          this.instance = this.getDockerReference()
          break
        }
        case 'mcp': {
          this.instance = this.getMCPConnection()
          break
        }
        default: {
          this.instance = this.getGenericReference()
        }
      }
      
      this.state = 'ready'
      this.setOutput('instance', this.instance)
      this.setOutput('state', this.state)
      
    } catch (error) {
      this.state = 'crashed'
      throw error
    }
  }

  /**
   * Get the infrastructure configuration
   */
  getConfiguration(): ExternalConstructConfig {
    return this.config
  }

  /**
   * Get the external instance
   */
  getInstance(): any {
    return this.instance
  }

  /**
   * Get current state
   */
  getState(): ExternalConstructState {
    return this.state
  }

  /**
   * Execute method on external instance
   */
  async execute(method: string, ...args: any[]): Promise<any> {
    if (!this.instance) {
      throw new Error('External instance not initialized')
    }
    
    if (typeof this.instance[method] === 'function') {
      return await this.instance[method](...args)
    }
    
    throw new Error(`Method ${method} not found`)
  }

  /**
   * Load NPM package
   */
  private async loadNpmPackage(): Promise<any> {
    const { identifier, version } = this.config.source
    
    try {
      // In browser environment, would use dynamic import
      // In Node.js environment:
      const module = await import(/* @vite-ignore */ identifier)
      return module.default || module
    } catch (error) {
      throw error
    }
  }

  /**
   * Get Docker reference
   */
  private getDockerReference(): any {
    return {
      type: 'docker',
      image: this.config.source.identifier,
      version: this.config.source.version,
      config: this.config.source.config,
      sandbox: this.config.sandbox
    }
  }

  /**
   * Get MCP connection
   */
  private getMCPConnection(): any {
    return {
      type: 'mcp',
      server: this.config.source.identifier,
      config: this.config.source.config,
      communication: this.config.communication
    }
  }

  /**
   * Get generic reference
   */
  private getGenericReference(): any {
    return {
      type: this.config.source.type,
      identifier: this.config.source.identifier,
      version: this.config.source.version,
      config: this.config.source.config
    }
  }

  /**
   * Clean up
   */
  protected async onDestroy(): Promise<void> {
    this.state = 'destroyed'
    this.instance = null
    this.eventHandlers.clear()
  }
}

// Export factory function
export const createExternalConstructPrimitive = () => new ExternalConstructPrimitiveConstruct()

// Export for registration
export const externalConstructPrimitive = new ExternalConstructPrimitiveConstruct()