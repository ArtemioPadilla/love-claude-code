/**
 * Plugin System Pattern (L2)
 * 
 * Enables dynamic plugin loading with sandboxing, dependency management,
 * and lifecycle hooks. Provides extensible architecture for third-party code.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  CloudProvider 
} from '../../../types'
import { Box, Text, Badge, Progress, Alert, Button } from '../../../L1/ui/ThemedComponents'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  main: string // Entry point
  type: 'javascript' | 'typescript' | 'wasm'
  dependencies?: Record<string, string>
  permissions?: PluginPermissions
  hooks?: string[] // Lifecycle hooks the plugin implements
  exports?: string[] // Exported functions/classes
  configuration?: PluginConfigSchema
}

export interface PluginPermissions {
  network?: boolean | string[] // True for all, or specific domains
  filesystem?: boolean | string[] // True for all, or specific paths
  system?: string[] // Specific system APIs
  plugins?: string[] // Can interact with specific other plugins
  ui?: boolean // Can render UI components
  storage?: {
    local?: boolean
    size?: number // Max storage in bytes
  }
}

export interface PluginConfigSchema {
  properties: Record<string, {
    type: string
    description?: string
    default?: any
    required?: boolean
    enum?: any[]
  }>
}

export interface PluginContext {
  api: {
    emit: (event: string, data?: any) => void
    on: (event: string, handler: (...args: any[]) => void) => void
    off: (event: string, handler: (...args: any[]) => void) => void
    getConfig: () => any
    setConfig: (config: any) => void
    log: (level: string, message: string, ...args: any[]) => void
  }
  storage: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    delete: (key: string) => Promise<void>
    clear: () => Promise<void>
  }
  ui?: {
    showNotification: (message: string, type?: string) => void
    showDialog: (options: any) => Promise<any>
    registerComponent: (name: string, component: any) => void
  }
  utils: {
    fetch: (url: string, options?: any) => Promise<Response>
    setTimeout: (fn: () => void, delay: number) => number
    clearTimeout: (id: number) => void
  }
}

export interface PluginInstance {
  manifest: PluginManifest
  status: 'unloaded' | 'loading' | 'loaded' | 'error' | 'disabled'
  exports?: any
  sandbox?: Worker
  context?: PluginContext
  error?: string
  metrics?: {
    loadTime?: number
    memoryUsage?: number
    cpuUsage?: number
    apiCalls?: number
    errors?: number
  }
  config?: any
}

export interface PluginHooks {
  onLoad?: () => Promise<void>
  onEnable?: () => Promise<void>
  onDisable?: () => Promise<void>
  onUnload?: () => Promise<void>
  onConfigChange?: (newConfig: any, oldConfig: any) => Promise<void>
  onMessage?: (message: any) => Promise<any>
}

export interface PluginSystemConfig {
  plugins: PluginManifest[]
  autoLoad?: boolean
  sandboxing: {
    enabled: boolean
    isolationLevel: 'none' | 'basic' | 'strict'
    timeout?: number
    memoryLimit?: number
  }
  repository?: {
    url: string
    autoUpdate?: boolean
    checkInterval?: number
  }
  permissions: {
    defaultAllow?: boolean
    requireSignature?: boolean
    trustedAuthors?: string[]
  }
  monitoring: {
    trackMetrics?: boolean
    logLevel?: 'error' | 'warn' | 'info' | 'debug'
    auditEvents?: boolean
  }
}

export interface PluginMessage {
  type: 'call' | 'event' | 'response' | 'error'
  pluginId: string
  data?: any
  error?: string
  requestId?: string
}

export interface PluginSystemPatternProps {
  config: PluginSystemConfig
  onPluginLoaded?: (plugin: PluginInstance) => void
  onPluginError?: (pluginId: string, error: Error) => void
  onPluginMessage?: (message: PluginMessage) => void
  showUI?: boolean
}

/**
 * Plugin System Pattern Implementation
 */
export class PluginSystemPattern extends L2PatternConstruct {
  private static metadata: PlatformConstructDefinition = {
    id: 'platform-l2-plugin-system-pattern',
    name: 'Plugin System Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.PATTERN,
    description: 'Pattern for dynamic plugin loading with isolation and lifecycle management',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'plugins', 'extensibility'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['plugin', 'extension', 'sandbox', 'lifecycle', 'pattern'],
    dependencies: [
      'platform-l1-sandbox-container',
      'platform-l1-permission-manager',
      'platform-l1-storage-provider'
    ],
    inputs: [
      {
        name: 'config',
        type: 'PluginSystemConfig',
        description: 'Plugin system configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'loadedPlugins',
        type: 'Map<string, PluginInstance>',
        description: 'Currently loaded plugins'
      },
      {
        name: 'pluginAPI',
        type: 'object',
        description: 'API for plugin interaction'
      }
    ],
    security: [
      {
        aspect: 'code-execution',
        description: 'Executes third-party plugin code',
        severity: 'critical',
        recommendations: [
          'Always use sandboxing',
          'Implement strict permissions',
          'Verify plugin signatures',
          'Audit plugin code',
          'Monitor runtime behavior'
        ]
      },
      {
        aspect: 'data-access',
        description: 'Plugins may access sensitive data',
        severity: 'high',
        recommendations: [
          'Implement granular permissions',
          'Isolate plugin storage',
          'Audit data access',
          'Encrypt sensitive data'
        ]
      }
    ],
    cost: {
      baseMonthly: 25,
      usageFactors: [
        { name: 'pluginCount', unitCost: 5 },
        { name: 'executionHours', unitCost: 0.1 },
        { name: 'storageGB', unitCost: 0.5 }
      ]
    },
    examples: [
      {
        title: 'Load and Use Plugin',
        description: 'Load a plugin and call its methods',
        code: `const pluginSystem = new PluginSystemPattern({
  config: {
    plugins: [{
      id: 'markdown-renderer',
      name: 'Markdown Renderer',
      version: '1.0.0',
      main: 'index.js',
      type: 'javascript',
      permissions: {
        ui: true,
        storage: { local: true, size: 1024 * 1024 }
      },
      hooks: ['onLoad', 'onMessage']
    }],
    sandboxing: {
      enabled: true,
      isolationLevel: 'strict',
      timeout: 5000,
      memoryLimit: 50 * 1024 * 1024
    },
    permissions: {
      defaultAllow: false,
      requireSignature: true
    }
  }
})

// Load plugin
await pluginSystem.loadPlugin('markdown-renderer')

// Call plugin method
const result = await pluginSystem.callPlugin(
  'markdown-renderer',
  'render',
  { markdown: '# Hello World' }
)`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always sandbox untrusted plugins',
      'Implement least-privilege permissions',
      'Version plugins and handle compatibility',
      'Monitor plugin resource usage',
      'Provide clear plugin API documentation',
      'Implement plugin dependency resolution',
      'Use event-based communication between plugins',
      'Audit plugins before allowing installation'
    ],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 87,
      generatedBy: 'Agent 4: External Integration Specialist'
    }
  }

  private config: PluginSystemConfig
  private plugins: Map<string, PluginInstance> = new Map()
  private sandboxes: Map<string, Worker> = new Map()
  private eventBus: Map<string, Set<Function>> = new Map()
  private pluginStorage: Map<string, Map<string, any>> = new Map()
  private permissionCache: Map<string, boolean> = new Map()
  private messageHandlers: Map<string, Function> = new Map()
  private auditLog: Array<{
    timestamp: Date
    pluginId: string
    action: string
    details?: any
  }> = []

  constructor(config: PluginSystemConfig) {
    super(PluginSystemPattern.metadata, { config })
    this.config = config
  }

  async initialize(config: any): Promise<void> {
    await this.beforeCompose()
    await this.composePattern()
    this.configureInteractions()
    await this.afterCompose()
    this.initialized = true
  }

  protected async composePattern(): Promise<void> {
    // Initialize plugin instances
    for (const manifest of this.config.plugins) {
      this.plugins.set(manifest.id, {
        manifest,
        status: 'unloaded'
      })
    }

    // Set up global event bus
    this.setupEventBus()

    // Set up permission system
    this.setupPermissionSystem()

    // Auto-load plugins if configured
    if (this.config.autoLoad) {
      for (const manifest of this.config.plugins) {
        try {
          await this.loadPlugin(manifest.id)
        } catch (error) {
          console.error(`Failed to auto-load plugin ${manifest.id}:`, error)
        }
      }
    }

    // Start repository update checker if configured
    if (this.config.repository?.autoUpdate) {
      this.startRepositoryUpdater()
    }
  }

  protected configureInteractions(): void {
    // Monitor plugin events
    if (this.config.monitoring.trackMetrics) {
      this.on('plugin-api-call', (data) => {
        const plugin = this.plugins.get(data.pluginId)
        if (plugin?.metrics) {
          plugin.metrics.apiCalls = (plugin.metrics.apiCalls || 0) + 1
        }
      })

      this.on('plugin-error', (data) => {
        const plugin = this.plugins.get(data.pluginId)
        if (plugin?.metrics) {
          plugin.metrics.errors = (plugin.metrics.errors || 0) + 1
        }
      })
    }

    // Audit events if configured
    if (this.config.monitoring.auditEvents) {
      this.on('plugin-loaded', (data) => this.audit(data.pluginId, 'loaded'))
      this.on('plugin-unloaded', (data) => this.audit(data.pluginId, 'unloaded'))
      this.on('plugin-enabled', (data) => this.audit(data.pluginId, 'enabled'))
      this.on('plugin-disabled', (data) => this.audit(data.pluginId, 'disabled'))
      this.on('plugin-api-call', (data) => 
        this.audit(data.pluginId, 'api-call', { method: data.method })
      )
    }
  }

  /**
   * Set up event bus for inter-plugin communication
   */
  private setupEventBus(): void {
    // Global event handlers
    this.on('plugin:*', (event, data) => {
      // Broadcast to all plugins
      for (const [id, plugin] of this.plugins.entries()) {
        if (plugin.status === 'loaded' && plugin.sandbox) {
          this.sendToPlugin(id, {
            type: 'event',
            pluginId: 'system',
            data: { event: event.substring(7), data }
          })
        }
      }
    })
  }

  /**
   * Set up permission system
   */
  private setupPermissionSystem(): void {
    // Permission check function
    this.addConstruct('permission-manager', {
      check: (pluginId: string, permission: string, resource?: string) => {
        const cacheKey = `${pluginId}:${permission}:${resource || ''}`
        
        if (this.permissionCache.has(cacheKey)) {
          return this.permissionCache.get(cacheKey)!
        }

        const plugin = this.plugins.get(pluginId)
        if (!plugin) return false

        const allowed = this.checkPermission(plugin.manifest, permission, resource)
        this.permissionCache.set(cacheKey, allowed)
        
        return allowed
      }
    })
  }

  /**
   * Check if plugin has permission
   */
  private checkPermission(
    manifest: PluginManifest, 
    permission: string, 
    resource?: string
  ): boolean {
    if (!manifest.permissions) {
      return this.config.permissions.defaultAllow || false
    }

    const [category, action] = permission.split('.')

    switch (category) {
      case 'network':
        if (manifest.permissions.network === true) return true
        if (Array.isArray(manifest.permissions.network) && resource) {
          return manifest.permissions.network.some(domain => 
            resource.includes(domain)
          )
        }
        return false

      case 'filesystem':
        if (manifest.permissions.filesystem === true) return true
        if (Array.isArray(manifest.permissions.filesystem) && resource) {
          return manifest.permissions.filesystem.some(path => 
            resource.startsWith(path)
          )
        }
        return false

      case 'system':
        return manifest.permissions.system?.includes(action) || false

      case 'plugins':
        return manifest.permissions.plugins?.includes(resource || '') || false

      case 'ui':
        return manifest.permissions.ui || false

      case 'storage':
        if (action === 'local') return manifest.permissions.storage?.local || false
        return false

      default:
        return false
    }
  }

  /**
   * Start repository updater
   */
  private startRepositoryUpdater(): void {
    const checkUpdates = async () => {
      try {
        // Fetch available plugins from repository
        const response = await fetch(`${this.config.repository!.url}/plugins.json`)
        const availablePlugins = await response.json()

        // Check for updates
        for (const available of availablePlugins) {
          const existing = this.plugins.get(available.id)
          if (existing && this.isNewerVersion(available.version, existing.manifest.version)) {
            this.emit('plugin-update-available', {
              pluginId: available.id,
              currentVersion: existing.manifest.version,
              newVersion: available.version
            })
          }
        }
      } catch (error) {
        console.error('Failed to check plugin updates:', error)
      }
    }

    // Initial check
    checkUpdates()

    // Schedule periodic checks
    setInterval(
      checkUpdates, 
      this.config.repository!.checkInterval || 3600000 // 1 hour default
    )
  }

  /**
   * Check if version is newer
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (v: string) => v.split('.').map(n => parseInt(n, 10))
    const newParts = parseVersion(newVersion)
    const currentParts = parseVersion(currentVersion)

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0
      const currentPart = currentParts[i] || 0
      
      if (newPart > currentPart) return true
      if (newPart < currentPart) return false
    }

    return false
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.status === 'loaded') {
      console.log(`Plugin ${pluginId} already loaded`)
      return
    }

    plugin.status = 'loading'
    const startTime = Date.now()

    try {
      // Create plugin context
      plugin.context = this.createPluginContext(pluginId)

      // Create sandbox if enabled
      if (this.config.sandboxing.enabled) {
        plugin.sandbox = await this.createSandbox(plugin)
        this.sandboxes.set(pluginId, plugin.sandbox)
      }

      // Load plugin code
      const code = await this.loadPluginCode(plugin.manifest)

      // Execute in sandbox or directly
      if (plugin.sandbox) {
        plugin.exports = await this.loadInSandbox(plugin, code)
      } else {
        plugin.exports = await this.loadDirectly(plugin, code)
      }

      // Call onLoad hook if exists
      if (plugin.manifest.hooks?.includes('onLoad')) {
        await this.callPluginHook(pluginId, 'onLoad')
      }

      plugin.status = 'loaded'
      plugin.metrics = {
        loadTime: Date.now() - startTime,
        memoryUsage: 0,
        cpuUsage: 0,
        apiCalls: 0,
        errors: 0
      }

      this.emit('plugin-loaded', { 
        pluginId,
        loadTime: plugin.metrics.loadTime
      })

    } catch (error) {
      plugin.status = 'error'
      plugin.error = error.message
      
      this.emit('plugin-load-failed', {
        pluginId,
        error: error.message
      })
      
      throw error
    }
  }

  /**
   * Create plugin context
   */
  private createPluginContext(pluginId: string): PluginContext {
    const plugin = this.plugins.get(pluginId)!
    
    return {
      api: {
        emit: (event: string, data?: any) => {
          if (!this.checkPermission(plugin.manifest, 'system.emit')) {
            throw new Error('Permission denied: system.emit')
          }
          this.emit(`plugin:${event}`, data)
          this.logPluginAction(pluginId, 'emit', { event })
        },
        
        on: (event: string, handler: (...args: any[]) => void) => {
          if (!this.checkPermission(plugin.manifest, 'system.on')) {
            throw new Error('Permission denied: system.on')
          }
          this.on(`plugin:${event}`, handler)
          this.logPluginAction(pluginId, 'on', { event })
        },
        
        off: (event: string, handler: (...args: any[]) => void) => {
          this.off(`plugin:${event}`, handler)
        },
        
        getConfig: () => plugin.config || {},
        
        setConfig: (config: any) => {
          const oldConfig = plugin.config
          plugin.config = config
          
          if (plugin.manifest.hooks?.includes('onConfigChange')) {
            this.callPluginHook(pluginId, 'onConfigChange', config, oldConfig)
          }
        },
        
        log: (level: string, message: string, ...args: any[]) => {
          if (this.shouldLog(level)) {
            console[level](`[Plugin:${pluginId}]`, message, ...args)
          }
        }
      },
      
      storage: {
        get: async (key: string) => {
          if (!this.checkPermission(plugin.manifest, 'storage.local')) {
            throw new Error('Permission denied: storage.local')
          }
          
          const storage = this.pluginStorage.get(pluginId) || new Map()
          return storage.get(key)
        },
        
        set: async (key: string, value: any) => {
          if (!this.checkPermission(plugin.manifest, 'storage.local')) {
            throw new Error('Permission denied: storage.local')
          }
          
          let storage = this.pluginStorage.get(pluginId)
          if (!storage) {
            storage = new Map()
            this.pluginStorage.set(pluginId, storage)
          }
          
          // Check storage limit
          const maxSize = plugin.manifest.permissions?.storage?.size || 1024 * 1024
          const currentSize = this.calculateStorageSize(storage)
          const valueSize = JSON.stringify(value).length
          
          if (currentSize + valueSize > maxSize) {
            throw new Error('Storage limit exceeded')
          }
          
          storage.set(key, value)
        },
        
        delete: async (key: string) => {
          const storage = this.pluginStorage.get(pluginId)
          storage?.delete(key)
        },
        
        clear: async () => {
          this.pluginStorage.delete(pluginId)
        }
      },
      
      ui: plugin.manifest.permissions?.ui ? {
        showNotification: (message: string, type?: string) => {
          this.emit('plugin-notification', {
            pluginId,
            message,
            type
          })
        },
        
        showDialog: async (options: any) => {
          return new Promise((resolve) => {
            this.emit('plugin-dialog', {
              pluginId,
              options,
              callback: resolve
            })
          })
        },
        
        registerComponent: (name: string, component: any) => {
          this.emit('plugin-component-registered', {
            pluginId,
            name,
            component
          })
        }
      } : undefined,
      
      utils: {
        fetch: async (url: string, options?: any) => {
          if (!this.checkPermission(plugin.manifest, 'network', url)) {
            throw new Error(`Permission denied: network access to ${url}`)
          }
          
          this.logPluginAction(pluginId, 'fetch', { url })
          return fetch(url, options)
        },
        
        setTimeout: (fn: () => void, delay: number) => {
          return setTimeout(() => {
            try {
              fn()
            } catch (error) {
              this.handlePluginError(pluginId, error)
            }
          }, Math.min(delay, this.config.sandboxing.timeout || 30000))
        },
        
        clearTimeout: (id: number) => {
          clearTimeout(id)
        }
      }
    }
  }

  /**
   * Create sandbox for plugin
   */
  private async createSandbox(plugin: PluginInstance): Promise<Worker> {
    const sandboxCode = `
      let pluginExports = {};
      let pluginContext = null;
      
      // Message handler
      self.onmessage = async function(e) {
        const { type, data, requestId } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'load': {
              // Create safe environment
              const safeGlobals = {
                console: {
                  log: (...args) => self.postMessage({
                    type: 'log',
                    level: 'log',
                    args
                  }),
                  error: (...args) => self.postMessage({
                    type: 'log',
                    level: 'error',
                    args
                  }),
                  warn: (...args) => self.postMessage({
                    type: 'log',
                    level: 'warn',
                    args
                  })
                },
                setTimeout: (fn, delay) => {
                  return setTimeout(fn, Math.min(delay, ${this.config.sandboxing.timeout || 30000}));
                },
                clearTimeout,
                Promise,
                JSON,
                Math,
                Date,
                RegExp,
                Array,
                Object,
                String,
                Number,
                Boolean
              };
              
              // Execute plugin code
              const func = new Function('exports', 'context', ...Object.keys(safeGlobals), data.code);
              func(pluginExports, data.context, ...Object.values(safeGlobals));
              
              result = { success: true, exports: Object.keys(pluginExports) };
              break;
            }
              
            case 'call': {
              const method = pluginExports[data.method];
              if (typeof method !== 'function') {
                throw new Error(\`Method \${data.method} not found\`);
              }
              
              result = await method(...(data.args || []));
              break;
            }
              
            case 'hook': {
              const hook = pluginExports[data.hook];
              if (typeof hook === 'function') {
                result = await hook(...(data.args || []));
              }
              break;
            }
              
            default:
              throw new Error(\`Unknown command: \${type}\`);
          }
          
          self.postMessage({
            type: 'response',
            requestId,
            success: true,
            result
          });
          
        } catch (error) {
          self.postMessage({
            type: 'response',
            requestId,
            success: false,
            error: error.message
          });
        }
      };
    `

    const blob = new Blob([sandboxCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))

    // Set up message handling
    worker.onmessage = (e) => {
      if (e.data.type === 'log') {
        if (this.shouldLog(e.data.level)) {
          console[e.data.level](`[Plugin:${plugin.manifest.id}]`, ...e.data.args)
        }
      }
    }

    return worker
  }

  /**
   * Load plugin code
   */
  private async loadPluginCode(manifest: PluginManifest): Promise<string> {
    // In real implementation, would fetch from file system or URL
    // For now, return mock code
    return `
      // Mock plugin: ${manifest.name}
      exports.onLoad = async function() {
        console.log('Plugin loaded: ${manifest.name}');
      };
      
      exports.process = function(input) {
        return { processed: true, input };
      };
      
      exports.onMessage = async function(message) {
        return { received: message };
      };
    `
  }

  /**
   * Load plugin in sandbox
   */
  private async loadInSandbox(plugin: PluginInstance, code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9)
      const timeout = setTimeout(() => {
        reject(new Error('Plugin load timeout'))
      }, this.config.sandboxing.timeout || 30000)

      const handler = (e: MessageEvent) => {
        if (e.data.requestId === requestId) {
          clearTimeout(timeout)
          plugin.sandbox!.removeEventListener('message', handler)
          
          if (e.data.success) {
            resolve(e.data.result)
          } else {
            reject(new Error(e.data.error))
          }
        }
      }

      plugin.sandbox!.addEventListener('message', handler)
      plugin.sandbox!.postMessage({
        type: 'load',
        requestId,
        data: {
          code,
          context: this.serializeContext(plugin.context!)
        }
      })
    })
  }

  /**
   * Load plugin directly (no sandbox)
   */
  private async loadDirectly(plugin: PluginInstance, code: string): Promise<any> {
    const exports = {}
    const func = new Function('exports', 'context', code)
    func(exports, plugin.context)
    return exports
  }

  /**
   * Serialize context for sandbox
   */
  private serializeContext(context: PluginContext): any {
    // Convert functions to message passing
    return {
      api: {
        emit: 'function',
        on: 'function',
        off: 'function',
        getConfig: 'function',
        setConfig: 'function',
        log: 'function'
      },
      storage: {
        get: 'function',
        set: 'function',
        delete: 'function',
        clear: 'function'
      },
      ui: context.ui ? {
        showNotification: 'function',
        showDialog: 'function',
        registerComponent: 'function'
      } : undefined,
      utils: {
        fetch: 'function',
        setTimeout: 'function',
        clearTimeout: 'function'
      }
    }
  }

  /**
   * Call plugin hook
   */
  private async callPluginHook(pluginId: string, hook: string, ...args: any[]): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.status !== 'loaded') {
      throw new Error(`Plugin ${pluginId} not loaded`)
    }

    if (plugin.sandbox) {
      return this.callInSandbox(plugin, hook, args)
    } else {
      const hookFn = plugin.exports[hook]
      if (typeof hookFn === 'function') {
        return hookFn(...args)
      }
    }
  }

  /**
   * Call method in sandbox
   */
  private async callInSandbox(
    plugin: PluginInstance, 
    method: string, 
    args: any[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9)
      const timeout = setTimeout(() => {
        reject(new Error('Plugin call timeout'))
      }, this.config.sandboxing.timeout || 30000)

      const handler = (e: MessageEvent) => {
        if (e.data.requestId === requestId) {
          clearTimeout(timeout)
          plugin.sandbox!.removeEventListener('message', handler)
          
          if (e.data.success) {
            resolve(e.data.result)
          } else {
            reject(new Error(e.data.error))
          }
        }
      }

      plugin.sandbox!.addEventListener('message', handler)
      plugin.sandbox!.postMessage({
        type: method.startsWith('on') ? 'hook' : 'call',
        requestId,
        data: {
          [method.startsWith('on') ? 'hook' : 'method']: method,
          args
        }
      })
    })
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.status === 'unloaded') {
      return
    }

    try {
      // Call onUnload hook if exists
      if (plugin.manifest.hooks?.includes('onUnload')) {
        await this.callPluginHook(pluginId, 'onUnload')
      }

      // Terminate sandbox
      if (plugin.sandbox) {
        plugin.sandbox.terminate()
        this.sandboxes.delete(pluginId)
      }

      // Clear plugin data
      plugin.status = 'unloaded'
      plugin.exports = undefined
      plugin.sandbox = undefined
      plugin.context = undefined
      this.pluginStorage.delete(pluginId)

      this.emit('plugin-unloaded', { pluginId })

    } catch (error) {
      console.error(`Error unloading plugin ${pluginId}:`, error)
      plugin.status = 'error'
      plugin.error = error.message
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.status !== 'loaded' && plugin.status !== 'disabled') {
      await this.loadPlugin(pluginId)
    }

    if (plugin.manifest.hooks?.includes('onEnable')) {
      await this.callPluginHook(pluginId, 'onEnable')
    }

    plugin.status = 'loaded'
    this.emit('plugin-enabled', { pluginId })
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.status !== 'loaded') {
      return
    }

    if (plugin.manifest.hooks?.includes('onDisable')) {
      await this.callPluginHook(pluginId, 'onDisable')
    }

    plugin.status = 'disabled'
    this.emit('plugin-disabled', { pluginId })
  }

  /**
   * Call a plugin method
   */
  async callPlugin(pluginId: string, method: string, ...args: any[]): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.status !== 'loaded') {
      throw new Error(`Plugin ${pluginId} not loaded`)
    }

    this.logPluginAction(pluginId, 'call', { method })
    
    try {
      const result = await this.callPluginHook(pluginId, method, ...args)
      
      this.emit('plugin-api-call', {
        pluginId,
        method,
        success: true
      })
      
      return result
    } catch (error) {
      this.emit('plugin-api-call', {
        pluginId,
        method,
        success: false,
        error: error.message
      })
      
      throw error
    }
  }

  /**
   * Send message to plugin
   */
  async sendToPlugin(pluginId: string, message: any): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.status !== 'loaded') {
      throw new Error(`Plugin ${pluginId} not loaded`)
    }

    if (plugin.manifest.hooks?.includes('onMessage')) {
      return this.callPluginHook(pluginId, 'onMessage', message)
    }
  }

  /**
   * Calculate storage size
   */
  private calculateStorageSize(storage: Map<string, any>): number {
    let size = 0
    for (const value of storage.values()) {
      size += JSON.stringify(value).length
    }
    return size
  }

  /**
   * Should log based on level
   */
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug']
    const configLevel = this.config.monitoring.logLevel || 'info'
    const configIndex = levels.indexOf(configLevel)
    const levelIndex = levels.indexOf(level)
    
    return levelIndex <= configIndex
  }

  /**
   * Log plugin action
   */
  private logPluginAction(pluginId: string, action: string, details?: any): void {
    this.emit('plugin-action', {
      pluginId,
      action,
      details,
      timestamp: new Date()
    })
  }

  /**
   * Handle plugin error
   */
  private handlePluginError(pluginId: string, error: Error): void {
    console.error(`Plugin error [${pluginId}]:`, error)
    
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.error = error.message
      if (plugin.metrics) {
        plugin.metrics.errors = (plugin.metrics.errors || 0) + 1
      }
    }
    
    this.emit('plugin-error', {
      pluginId,
      error: error.message
    })
  }

  /**
   * Audit plugin action
   */
  private audit(pluginId: string, action: string, details?: any): void {
    this.auditLog.push({
      timestamp: new Date(),
      pluginId,
      action,
      details
    })
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get audit log
   */
  getAuditLog(pluginId?: string): typeof this.auditLog {
    if (pluginId) {
      return this.auditLog.filter(entry => entry.pluginId === pluginId)
    }
    return [...this.auditLog]
  }

  /**
   * Install plugin from repository
   */
  async installPlugin(pluginId: string): Promise<void> {
    if (!this.config.repository) {
      throw new Error('No repository configured')
    }

    // Fetch plugin manifest
    const response = await fetch(`${this.config.repository.url}/plugins/${pluginId}/manifest.json`)
    if (!response.ok) {
      throw new Error(`Plugin ${pluginId} not found in repository`)
    }

    const manifest = await response.json() as PluginManifest
    
    // Add to plugins
    this.plugins.set(manifest.id, {
      manifest,
      status: 'unloaded'
    })
    
    // Load if auto-load enabled
    if (this.config.autoLoad) {
      await this.loadPlugin(manifest.id)
    }
    
    this.emit('plugin-installed', { pluginId: manifest.id })
  }

  /**
   * Render the pattern UI
   */
  render(): React.ReactElement {
    return <PluginSystemPatternComponent pattern={this} />
  }

  async destroy(): Promise<void> {
    // Unload all plugins
    for (const pluginId of this.plugins.keys()) {
      await this.unloadPlugin(pluginId)
    }
    
    // Clear all data
    this.plugins.clear()
    this.sandboxes.clear()
    this.pluginStorage.clear()
    this.permissionCache.clear()
    this.messageHandlers.clear()
    this.auditLog = []
    
    await super.destroy()
  }
}

/**
 * React component for Plugin System Pattern
 */
const PluginSystemPatternComponent: React.FC<{ pattern: PluginSystemPattern }> = ({ pattern }) => {
  const [plugins, setPlugins] = useState<PluginInstance[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    const updatePlugins = () => {
      setPlugins(pattern.getAllPlugins())
    }

    pattern.on('plugin-loaded', updatePlugins)
    pattern.on('plugin-unloaded', updatePlugins)
    pattern.on('plugin-enabled', updatePlugins)
    pattern.on('plugin-disabled', updatePlugins)
    pattern.on('plugin-error', updatePlugins)
    pattern.on('plugin-action', () => {
      if (selectedPlugin) {
        setAuditLog(pattern.getAuditLog(selectedPlugin))
      }
    })

    updatePlugins()

    return () => {
      pattern.off('plugin-loaded', updatePlugins)
      pattern.off('plugin-unloaded', updatePlugins)
      pattern.off('plugin-enabled', updatePlugins)
      pattern.off('plugin-disabled', updatePlugins)
      pattern.off('plugin-error', updatePlugins)
    }
  }, [pattern, selectedPlugin])

  const handleLoad = async (pluginId: string) => {
    try {
      await pattern.loadPlugin(pluginId)
    } catch (error) {
      console.error('Failed to load plugin:', error)
    }
  }

  const handleUnload = async (pluginId: string) => {
    try {
      await pattern.unloadPlugin(pluginId)
    } catch (error) {
      console.error('Failed to unload plugin:', error)
    }
  }

  const handleEnable = async (pluginId: string) => {
    try {
      await pattern.enablePlugin(pluginId)
    } catch (error) {
      console.error('Failed to enable plugin:', error)
    }
  }

  const handleDisable = async (pluginId: string) => {
    try {
      await pattern.disablePlugin(pluginId)
    } catch (error) {
      console.error('Failed to disable plugin:', error)
    }
  }

  const handleCallMethod = async (pluginId: string, method: string) => {
    try {
      const result = await pattern.callPlugin(pluginId, method, { test: true })
      setTestResult({ pluginId, method, result })
    } catch (error) {
      setTestResult({ pluginId, method, error: error.message })
    }
  }

  const getStatusColor = (status: PluginInstance['status']) => {
    switch (status) {
      case 'loaded': return 'success'
      case 'loading': return 'warning'
      case 'disabled': return 'default'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box className="plugin-system-pattern p-6">
      <Text variant="h3" className="mb-4">Plugin System</Text>

      {/* Plugin List */}
      <Box className="mb-6">
        <Text variant="h4" className="mb-3">Installed Plugins</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map((plugin) => (
            <Box 
              key={plugin.manifest.id} 
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedPlugin === plugin.manifest.id ? 'border-blue-500' : ''
              }`}
              onClick={() => setSelectedPlugin(plugin.manifest.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Text variant="body1" className="font-medium">
                    {plugin.manifest.name}
                  </Text>
                  <Text variant="caption" className="text-gray-600">
                    v{plugin.manifest.version} by {plugin.manifest.author || 'Unknown'}
                  </Text>
                </div>
                <Badge variant={getStatusColor(plugin.status)}>
                  {plugin.status}
                </Badge>
              </div>

              {plugin.manifest.description && (
                <Text variant="body2" className="text-gray-600 mb-3">
                  {plugin.manifest.description}
                </Text>
              )}

              {/* Plugin Actions */}
              <div className="flex gap-2 flex-wrap">
                {plugin.status === 'unloaded' && (
                  <Button size="sm" onClick={() => handleLoad(plugin.manifest.id)}>
                    Load
                  </Button>
                )}
                {plugin.status === 'loaded' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => handleUnload(plugin.manifest.id)}>
                      Unload
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDisable(plugin.manifest.id)}>
                      Disable
                    </Button>
                  </>
                )}
                {plugin.status === 'disabled' && (
                  <Button size="sm" onClick={() => handleEnable(plugin.manifest.id)}>
                    Enable
                  </Button>
                )}
              </div>

              {/* Plugin Metrics */}
              {plugin.metrics && plugin.status === 'loaded' && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <Text variant="caption" className="text-gray-500">Load Time</Text>
                    <Text variant="body2">{plugin.metrics.loadTime}ms</Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">API Calls</Text>
                    <Text variant="body2">{plugin.metrics.apiCalls}</Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Errors</Text>
                    <Text variant="body2" className={plugin.metrics.errors > 0 ? 'text-red-600' : ''}>
                      {plugin.metrics.errors}
                    </Text>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {plugin.error && (
                <Alert variant="error" className="mt-2">
                  {plugin.error}
                </Alert>
              )}
            </Box>
          ))}
        </div>
      </Box>

      {/* Plugin Details */}
      {selectedPlugin && (
        <Box className="mb-6 p-4 border rounded-lg">
          <Text variant="h4" className="mb-3">Plugin Details: {selectedPlugin}</Text>
          
          {(() => {
            const plugin = plugins.find(p => p.manifest.id === selectedPlugin)
            if (!plugin) return null

            return (
              <>
                {/* Permissions */}
                <div className="mb-4">
                  <Text variant="h5" className="mb-2">Permissions</Text>
                  <div className="space-y-1 text-sm">
                    {plugin.manifest.permissions?.network && (
                      <div>
                        <Badge variant="warning">Network</Badge>
                        {Array.isArray(plugin.manifest.permissions.network) && (
                          <span className="ml-2 text-gray-600">
                            {plugin.manifest.permissions.network.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    {plugin.manifest.permissions?.filesystem && (
                      <div>
                        <Badge variant="warning">Filesystem</Badge>
                        {Array.isArray(plugin.manifest.permissions.filesystem) && (
                          <span className="ml-2 text-gray-600">
                            {plugin.manifest.permissions.filesystem.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    {plugin.manifest.permissions?.ui && (
                      <Badge variant="primary">UI Access</Badge>
                    )}
                    {plugin.manifest.permissions?.storage?.local && (
                      <Badge variant="default">Local Storage</Badge>
                    )}
                  </div>
                </div>

                {/* Exported Methods */}
                {plugin.manifest.exports && plugin.manifest.exports.length > 0 && (
                  <div className="mb-4">
                    <Text variant="h5" className="mb-2">Methods</Text>
                    <div className="flex gap-2 flex-wrap">
                      {plugin.manifest.exports.map((method) => (
                        <Button
                          key={method}
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCallMethod(plugin.manifest.id, method)}
                          disabled={plugin.status !== 'loaded'}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Log */}
                <div>
                  <Text variant="h5" className="mb-2">Recent Activity</Text>
                  <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                    {auditLog.slice(-10).reverse().map((entry, i) => (
                      <div key={i} className="text-gray-600">
                        <span className="font-mono text-xs">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        {' '}
                        <span className="font-medium">{entry.action}</span>
                        {entry.details && (
                          <span className="text-gray-500">
                            {' '}({JSON.stringify(entry.details)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}
        </Box>
      )}

      {/* Test Result */}
      {testResult && (
        <Box className="p-4 bg-gray-50 rounded-lg">
          <Text variant="h4" className="mb-2">Method Call Result</Text>
          <Text variant="caption" className="text-gray-600">
            {testResult.pluginId}.{testResult.method}()
          </Text>
          <pre className="mt-2 text-sm overflow-x-auto">
            {testResult.error ? (
              <span className="text-red-600">Error: {testResult.error}</span>
            ) : (
              JSON.stringify(testResult.result, null, 2)
            )}
          </pre>
        </Box>
      )}
    </Box>
  )
}

// Export component separately
export const PluginSystemPatternComponent = PluginSystemPattern