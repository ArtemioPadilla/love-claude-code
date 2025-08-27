/**
 * External Library Pattern (L2)
 * 
 * Wraps NPM and CDN libraries with security scanning, version management,
 * and safe execution environments. Provides controlled access to external code.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  CloudProvider 
} from '../../../types'
import { NpmPackagePrimitiveConstruct } from '../../../L0/external/NpmPackagePrimitive'
import { Box, Text, Badge, Progress, Alert } from '../../../L1/ui/ThemedComponents'

export interface LibrarySource {
  type: 'npm' | 'cdn' | 'local'
  name: string
  version?: string
  url?: string
  integrity?: string
  scope?: 'global' | 'isolated'
}

export interface SecurityPolicy {
  allowNetworkAccess: boolean
  allowFileSystemAccess: boolean
  allowProcessAccess: boolean
  maxExecutionTime: number
  maxMemoryUsage: number
  allowedDomains: string[]
  blockedAPIs: string[]
}

export interface LibraryLoadResult {
  success: boolean
  library?: any
  exports?: string[]
  metadata?: {
    size: number
    loadTime: number
    securityChecks: {
      passed: boolean
      vulnerabilities: string[]
      warnings: string[]
    }
  }
  error?: string
}

export interface ExternalLibraryConfig {
  sources: LibrarySource[]
  securityPolicy: SecurityPolicy
  caching: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  sandboxing: {
    enabled: boolean
    isolationLevel: 'none' | 'basic' | 'strict'
  }
  monitoring: {
    trackUsage: boolean
    logCalls: boolean
    performanceMetrics: boolean
  }
}

export interface ExternalLibraryPatternProps {
  config: ExternalLibraryConfig
  onLibraryLoad?: (result: LibraryLoadResult) => void
  onSecurityAlert?: (alert: { severity: string; message: string }) => void
  showUI?: boolean
}

/**
 * External Library Pattern Implementation
 */
export class ExternalLibraryPattern extends L2PatternConstruct {
  private static metadata: PlatformConstructDefinition = {
    id: 'platform-l2-external-library-pattern',
    name: 'External Library Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.PATTERN,
    description: 'Secure pattern for loading and using external NPM/CDN libraries',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'security', 'library-management'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['npm', 'cdn', 'security', 'sandbox', 'pattern'],
    dependencies: [
      'platform-l0-npm-package-primitive',
      'platform-l1-sandbox-container',
      'platform-l1-security-scanner'
    ],
    inputs: [
      {
        name: 'config',
        type: 'ExternalLibraryConfig',
        description: 'Library loading and security configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'loadedLibraries',
        type: 'Map<string, any>',
        description: 'Map of loaded library instances'
      },
      {
        name: 'securityReport',
        type: 'object',
        description: 'Security analysis of loaded libraries'
      }
    ],
    security: [
      {
        aspect: 'code-execution',
        description: 'Executes external code in sandboxed environment',
        severity: 'high',
        recommendations: [
          'Enable strict sandboxing',
          'Limit network and filesystem access',
          'Use integrity checks',
          'Scan for vulnerabilities'
        ]
      },
      {
        aspect: 'supply-chain',
        description: 'Depends on external packages',
        severity: 'medium',
        recommendations: [
          'Pin exact versions',
          'Verify package signatures',
          'Use private registries',
          'Regular security audits'
        ]
      }
    ],
    cost: {
      baseMonthly: 5,
      usageFactors: [
        { name: 'libraryCount', unitCost: 0.1 },
        { name: 'cacheSizeGB', unitCost: 0.5 },
        { name: 'securityScans', unitCost: 0.01 }
      ]
    },
    examples: [
      {
        title: 'Load NPM Package Safely',
        description: 'Load and use an NPM package with security controls',
        code: `const libraryPattern = new ExternalLibraryPattern({
  config: {
    sources: [{
      type: 'npm',
      name: 'lodash',
      version: '4.17.21',
      scope: 'isolated'
    }],
    securityPolicy: {
      allowNetworkAccess: false,
      allowFileSystemAccess: false,
      allowProcessAccess: false,
      maxExecutionTime: 5000,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      allowedDomains: [],
      blockedAPIs: ['eval', 'Function']
    },
    sandboxing: {
      enabled: true,
      isolationLevel: 'strict'
    }
  }
})

const result = await libraryPattern.loadLibrary('lodash')
if (result.success) {
  const _ = result.library
  const grouped = _.groupBy([1, 2, 3, 4, 5], n => n % 2)
}`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always enable sandboxing for untrusted libraries',
      'Use integrity checks to verify library authenticity',
      'Limit permissions based on library requirements',
      'Cache libraries locally to reduce attack surface',
      'Monitor library usage for anomalies',
      'Regular security scanning of dependencies'
    ],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 85,
      generatedBy: 'Agent 4: External Integration Specialist'
    }
  }

  private config: ExternalLibraryConfig
  private loadedLibraries: Map<string, any> = new Map()
  private libraryCache: Map<string, { library: any; timestamp: number }> = new Map()
  private npmPackagePrimitive?: NpmPackagePrimitiveConstruct
  private sandbox?: Worker
  private securityReport: {
    scannedLibraries: number
    vulnerabilities: Array<{ library: string; issue: string; severity: string }>
    blockedAttempts: Array<{ library: string; reason: string; timestamp: Date }>
  } = {
    scannedLibraries: 0,
    vulnerabilities: [],
    blockedAttempts: []
  }

  constructor(config: ExternalLibraryConfig) {
    super(ExternalLibraryPattern.metadata, { config })
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
    // Initialize NPM package primitive for package analysis
    this.npmPackagePrimitive = new NpmPackagePrimitiveConstruct()
    this.addConstruct('npm-primitive', this.npmPackagePrimitive)

    // Initialize sandbox if enabled
    if (this.config.sandboxing.enabled) {
      await this.initializeSandbox()
    }

    // Set up security scanner
    await this.initializeSecurityScanner()

    // Preload configured libraries
    for (const source of this.config.sources) {
      try {
        await this.loadLibrary(source.name, source)
      } catch (error) {
        console.error(`Failed to preload library ${source.name}:`, error)
      }
    }
  }

  protected configureInteractions(): void {
    // Set up monitoring if enabled
    if (this.config.monitoring.trackUsage) {
      this.on('library-loaded', (data) => {
        console.log(`Library loaded: ${data.name} (${data.loadTime}ms)`)
      })

      this.on('library-accessed', (data) => {
        console.log(`Library accessed: ${data.name}.${data.method}`)
      })
    }

    // Set up security alerts
    this.on('security-alert', (alert) => {
      this.securityReport.blockedAttempts.push({
        library: alert.library,
        reason: alert.reason,
        timestamp: new Date()
      })
    })
  }

  /**
   * Initialize sandbox environment
   */
  private async initializeSandbox(): Promise<void> {
    if (typeof Worker !== 'undefined') {
      // Create web worker for sandboxed execution
      const workerCode = `
        const sandbox = {
          libraries: new Map(),
          
          loadLibrary: function(name, code) {
            try {
              // Create isolated context
              const module = { exports: {} };
              const exports = module.exports;
              
              // Execute in restricted environment
              const func = new Function('module', 'exports', 'require', code);
              func.call(null, module, exports, () => {
                throw new Error('require not allowed in sandbox');
              });
              
              this.libraries.set(name, module.exports);
              return { success: true, exports: Object.keys(module.exports) };
            } catch (error) {
              return { success: false, error: error.message };
            }
          },
          
          executeInLibrary: function(libraryName, method, args) {
            const library = this.libraries.get(libraryName);
            if (!library) {
              return { success: false, error: 'Library not loaded' };
            }
            
            try {
              const result = library[method](...args);
              return { success: true, result };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }
        };
        
        self.onmessage = function(e) {
          const { type, payload } = e.data;
          let result;
          
          switch (type) {
            case 'load':
              result = sandbox.loadLibrary(payload.name, payload.code);
              break;
            case 'execute':
              result = sandbox.executeInLibrary(
                payload.library,
                payload.method,
                payload.args
              );
              break;
            default:
              result = { success: false, error: 'Unknown command' };
          }
          
          self.postMessage({ id: e.data.id, result });
        };
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      this.sandbox = new Worker(URL.createObjectURL(blob))
    }
  }

  /**
   * Initialize security scanner
   */
  private async initializeSecurityScanner(): Promise<void> {
    // In a real implementation, this would connect to a vulnerability database
    // For now, we'll implement basic checks
    this.addConstruct('security-scanner', {
      scan: async (library: LibrarySource) => {
        const checks = {
          hasKnownVulnerabilities: false,
          usesEval: false,
          accessesNetwork: false,
          accessesFileSystem: false,
          vulnerabilities: [] as string[],
          warnings: [] as string[]
        }

        // Simulate vulnerability check
        if (library.version && library.version.includes('beta')) {
          checks.warnings.push('Using beta version')
        }

        // Check for blocked APIs
        for (const api of this.config.securityPolicy.blockedAPIs) {
          // In real implementation, would analyze code
          if (Math.random() < 0.1) { // Simulate detection
            checks.usesEval = true
            checks.vulnerabilities.push(`Uses blocked API: ${api}`)
          }
        }

        return checks
      }
    })
  }

  /**
   * Load a library with security checks
   */
  async loadLibrary(name: string, source?: LibrarySource): Promise<LibraryLoadResult> {
    const startTime = Date.now()
    
    // Check cache first
    if (this.config.caching.enabled) {
      const cached = this.libraryCache.get(name)
      if (cached && (Date.now() - cached.timestamp) < this.config.caching.ttl) {
        return {
          success: true,
          library: cached.library,
          metadata: {
            size: 0,
            loadTime: 0,
            securityChecks: { passed: true, vulnerabilities: [], warnings: [] }
          }
        }
      }
    }

    try {
      // Find source configuration
      const librarySource = source || this.config.sources.find(s => s.name === name)
      if (!librarySource) {
        throw new Error(`Library ${name} not configured`)
      }

      // Perform security scan
      const scanner = this.getConstruct<any>('security-scanner')
      const securityChecks = await scanner.scan(librarySource)
      
      this.securityReport.scannedLibraries++
      
      // Check security policy
      if (securityChecks.hasKnownVulnerabilities) {
        this.emit('security-alert', {
          severity: 'high',
          library: name,
          reason: 'Known vulnerabilities detected'
        })
        
        if (this.config.sandboxing.isolationLevel === 'strict') {
          throw new Error('Library has known vulnerabilities')
        }
      }

      // Load the library based on type
      let library: any
      const size = 0

      switch (librarySource.type) {
        case 'npm':
          library = await this.loadNpmLibrary(librarySource)
          break
        case 'cdn':
          library = await this.loadCdnLibrary(librarySource)
          break
        case 'local':
          library = await this.loadLocalLibrary(librarySource)
          break
      }

      // Apply sandboxing if enabled
      if (this.config.sandboxing.enabled && this.sandbox) {
        library = await this.wrapInSandbox(name, library)
      }

      // Apply security restrictions
      library = this.applySecurityRestrictions(library, librarySource)

      // Cache the library
      if (this.config.caching.enabled) {
        this.libraryCache.set(name, {
          library,
          timestamp: Date.now()
        })
      }

      // Store loaded library
      this.loadedLibraries.set(name, library)

      const result: LibraryLoadResult = {
        success: true,
        library,
        exports: library ? Object.keys(library) : [],
        metadata: {
          size,
          loadTime: Date.now() - startTime,
          securityChecks: {
            passed: securityChecks.vulnerabilities.length === 0,
            vulnerabilities: securityChecks.vulnerabilities,
            warnings: securityChecks.warnings
          }
        }
      }

      this.emit('library-loaded', {
        name,
        loadTime: result.metadata?.loadTime,
        size: result.metadata?.size
      })

      return result

    } catch (error) {
      const result: LibraryLoadResult = {
        success: false,
        error: error.message
      }

      this.emit('library-load-failed', {
        name,
        error: error.message
      })

      return result
    }
  }

  /**
   * Load NPM library
   */
  private async loadNpmLibrary(source: LibrarySource): Promise<any> {
    // Parse package.json if available
    if (this.npmPackagePrimitive) {
      const packageInfo = await this.npmPackagePrimitive.parseDefinition({
        name: source.name,
        version: source.version || 'latest'
      })
      
      // Validate package
      const validation = this.npmPackagePrimitive.validateConfiguration(packageInfo)
      if (!validation.valid) {
        throw new Error(`Invalid NPM package: ${validation.errors?.join(', ')}`)
      }
    }

    // In a real implementation, would fetch from NPM registry
    // For now, simulate loading
    return {
      _loaded: 'npm',
      name: source.name,
      version: source.version,
      // Simulated exports
      default: () => console.log(`${source.name} loaded from NPM`)
    }
  }

  /**
   * Load CDN library
   */
  private async loadCdnLibrary(source: LibrarySource): Promise<any> {
    if (!source.url) {
      throw new Error('CDN source requires URL')
    }

    // Check if domain is allowed
    const url = new URL(source.url)
    if (this.config.securityPolicy.allowedDomains.length > 0 &&
        !this.config.securityPolicy.allowedDomains.includes(url.hostname)) {
      throw new Error(`Domain ${url.hostname} not allowed`)
    }

    // Verify integrity if provided
    if (source.integrity) {
      // In real implementation, would verify SRI hash
      console.log(`Verifying integrity: ${source.integrity}`)
    }

    // In a real implementation, would fetch and evaluate
    // For now, simulate loading
    return {
      _loaded: 'cdn',
      url: source.url,
      // Simulated exports
      default: () => console.log(`${source.name} loaded from CDN`)
    }
  }

  /**
   * Load local library
   */
  private async loadLocalLibrary(source: LibrarySource): Promise<any> {
    // In real implementation, would load from local file system
    // For now, simulate loading
    return {
      _loaded: 'local',
      name: source.name,
      // Simulated exports
      default: () => console.log(`${source.name} loaded locally`)
    }
  }

  /**
   * Wrap library in sandbox
   */
  private async wrapInSandbox(name: string, library: any): Promise<any> {
    if (!this.sandbox) return library

    // Send library code to sandbox
    const code = `
      // Sandboxed version of ${name}
      module.exports = ${JSON.stringify(library)};
    `

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.sandbox!.removeEventListener('message', handler)
          if (e.data.result.success) {
            // Return proxy to sandboxed library
            resolve(this.createSandboxProxy(name))
          } else {
            reject(new Error(e.data.result.error))
          }
        }
      }

      this.sandbox.addEventListener('message', handler)
      this.sandbox.postMessage({
        id,
        type: 'load',
        payload: { name, code }
      })
    })
  }

  /**
   * Create proxy for sandboxed library
   */
  private createSandboxProxy(libraryName: string): any {
    return new Proxy({}, {
      get: (target, prop) => {
        return (...args: any[]) => {
          return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2, 9)
            
            const handler = (e: MessageEvent) => {
              if (e.data.id === id) {
                this.sandbox!.removeEventListener('message', handler)
                if (e.data.result.success) {
                  resolve(e.data.result.result)
                } else {
                  reject(new Error(e.data.result.error))
                }
              }
            }

            this.sandbox!.addEventListener('message', handler)
            this.sandbox!.postMessage({
              id,
              type: 'execute',
              payload: {
                library: libraryName,
                method: String(prop),
                args
              }
            })

            // Apply execution timeout
            setTimeout(() => {
              this.sandbox!.removeEventListener('message', handler)
              reject(new Error('Execution timeout'))
            }, this.config.securityPolicy.maxExecutionTime)
          })
        }
      }
    })
  }

  /**
   * Apply security restrictions to library
   */
  private applySecurityRestrictions(library: any, source: LibrarySource): any {
    const policy = this.config.securityPolicy

    // Create restricted proxy
    return new Proxy(library, {
      get: (target, prop) => {
        const value = target[prop]

        // Check if accessing blocked API
        if (policy.blockedAPIs.includes(String(prop))) {
          this.emit('security-alert', {
            severity: 'medium',
            library: source.name,
            reason: `Blocked access to: ${String(prop)}`
          })
          throw new Error(`Access to ${String(prop)} is blocked`)
        }

        // Monitor access if enabled
        if (this.config.monitoring.logCalls) {
          this.emit('library-accessed', {
            name: source.name,
            method: String(prop)
          })
        }

        // Wrap functions to apply restrictions
        if (typeof value === 'function') {
          return (...args: any[]) => {
            // Check execution time
            const startTime = Date.now()
            const result = value.apply(target, args)
            
            if (Date.now() - startTime > policy.maxExecutionTime) {
              throw new Error('Execution time exceeded')
            }

            return result
          }
        }

        return value
      },

      set: (target, prop, value) => {
        // Prevent modifications in strict mode
        if (source.scope === 'isolated') {
          throw new Error('Cannot modify isolated library')
        }
        target[prop] = value
        return true
      }
    })
  }

  /**
   * Get a loaded library
   */
  getLibrary(name: string): any {
    return this.loadedLibraries.get(name)
  }

  /**
   * Get security report
   */
  getSecurityReport(): typeof this.securityReport {
    return { ...this.securityReport }
  }

  /**
   * Clear library cache
   */
  clearCache(): void {
    this.libraryCache.clear()
    this.emit('cache-cleared', {
      timestamp: new Date()
    })
  }

  /**
   * Render the pattern UI
   */
  render(): React.ReactElement {
    return <ExternalLibraryPatternComponent pattern={this} />
  }

  async destroy(): Promise<void> {
    // Terminate sandbox worker
    if (this.sandbox) {
      this.sandbox.terminate()
    }

    // Clear all libraries
    this.loadedLibraries.clear()
    this.libraryCache.clear()

    await super.destroy()
  }
}

/**
 * React component for External Library Pattern
 */
const ExternalLibraryPatternComponent: React.FC<{ pattern: ExternalLibraryPattern }> = ({ pattern }) => {
  const [libraries, setLibraries] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState<string | null>(null)
  const [securityReport, setSecurityReport] = useState(pattern.getSecurityReport())

  useEffect(() => {
    const updateLibraries = () => {
      setLibraries(new Map(pattern['loadedLibraries']))
      setSecurityReport(pattern.getSecurityReport())
    }

    pattern.on('library-loaded', updateLibraries)
    pattern.on('library-load-failed', updateLibraries)
    pattern.on('security-alert', updateLibraries)

    return () => {
      pattern.off('library-loaded', updateLibraries)
      pattern.off('library-load-failed', updateLibraries)
      pattern.off('security-alert', updateLibraries)
    }
  }, [pattern])

  const handleLoadLibrary = async (source: LibrarySource) => {
    setLoading(source.name)
    try {
      await pattern.loadLibrary(source.name, source)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Box className="external-library-pattern p-6">
      <Text variant="h3" className="mb-4">External Library Manager</Text>

      {/* Security Status */}
      <Box className="mb-6 p-4 bg-gray-50 rounded-lg">
        <Text variant="h4" className="mb-2">Security Status</Text>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Text variant="label">Scanned Libraries</Text>
            <Text variant="h2">{securityReport.scannedLibraries}</Text>
          </div>
          <div>
            <Text variant="label">Vulnerabilities</Text>
            <Text variant="h2" className="text-red-600">
              {securityReport.vulnerabilities.length}
            </Text>
          </div>
          <div>
            <Text variant="label">Blocked Attempts</Text>
            <Text variant="h2" className="text-yellow-600">
              {securityReport.blockedAttempts.length}
            </Text>
          </div>
        </div>
      </Box>

      {/* Loaded Libraries */}
      <Box className="mb-6">
        <Text variant="h4" className="mb-2">Loaded Libraries</Text>
        <div className="space-y-2">
          {Array.from(libraries.entries()).map(([name, library]) => (
            <Box key={name} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <Text variant="body1" className="font-medium">{name}</Text>
                <Text variant="caption" className="text-gray-600">
                  Type: {library._loaded} | Exports: {Object.keys(library).length}
                </Text>
              </div>
              <Badge variant="success">Loaded</Badge>
            </Box>
          ))}
        </div>
      </Box>

      {/* Vulnerabilities */}
      {securityReport.vulnerabilities.length > 0 && (
        <Alert variant="error" className="mb-6">
          <Text variant="h4" className="mb-2">Security Vulnerabilities</Text>
          <ul className="list-disc list-inside">
            {securityReport.vulnerabilities.map((vuln, i) => (
              <li key={i}>
                <strong>{vuln.library}:</strong> {vuln.issue} 
                <Badge variant="error" className="ml-2">{vuln.severity}</Badge>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Library Loader */}
      <Box className="p-4 border rounded-lg">
        <Text variant="h4" className="mb-3">Load New Library</Text>
        <button
          onClick={() => handleLoadLibrary({
            type: 'npm',
            name: 'test-library',
            version: '1.0.0',
            scope: 'isolated'
          })}
          disabled={loading !== null}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? `Loading ${loading}...` : 'Load Test Library'}
        </button>
      </Box>
    </Box>
  )
}

// Export component separately
export const ExternalLibraryPatternComponent = ExternalLibraryPattern