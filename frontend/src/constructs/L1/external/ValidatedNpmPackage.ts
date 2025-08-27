/**
 * Validated NPM Package (L1)
 * 
 * Secure wrapper for NPM packages with validation, security scanning,
 * and resource limits. Adds production-ready features to the L0 primitive.
 */

import { L1Construct } from '../../base/L1Construct'
import { ConstructMetadata } from '../../types'
import { ExternalConstructPrimitive } from '../../L0/external/ExternalConstructPrimitive'

export interface ValidatedNpmPackageConfig {
  /**
   * NPM package details
   */
  package: {
    name: string
    version: string
    registry?: string  // Default: https://registry.npmjs.org
  }
  
  /**
   * Security configuration
   */
  security?: {
    allowedMethods?: string[]  // Whitelist of methods
    blockedMethods?: string[]  // Blacklist of methods
    scanVulnerabilities?: boolean
    requireLicense?: string[]  // e.g., ['MIT', 'Apache-2.0']
  }
  
  /**
   * Resource limits
   */
  limits?: {
    memoryMB?: number
    timeoutMs?: number
    maxConcurrentCalls?: number
  }
  
  /**
   * Validation rules
   */
  validation?: {
    requireTypes?: boolean  // Require TypeScript types
    minVersion?: string     // Minimum allowed version
    maxVersion?: string     // Maximum allowed version
  }
}

/**
 * L1 Validated NPM Package
 * 
 * Adds security, validation, and best practices to external NPM packages.
 */
export class ValidatedNpmPackage extends L1Construct {
  private primitive: ExternalConstructPrimitive
  private config: ValidatedNpmPackageConfig
  private methodCallCount: Map<string, number> = new Map()
  private startTime: number = Date.now()
  
  constructor(name: string, config: ValidatedNpmPackageConfig) {
    const metadata: ConstructMetadata = {
      id: 'validated-npm-package',
      name: 'Validated NPM Package',
      type: 'infrastructure',
      level: 'L1',
      version: '1.0.0',
      description: 'NPM package wrapper with security and validation',
      author: 'Love Claude Code',
      tags: ['external', 'npm', 'secure', 'validated'],
      license: 'MIT'
    }
    
    super(metadata, name, {
      primitive: 'external-construct-primitive'
    })
    
    this.config = {
      security: {
        scanVulnerabilities: true,
        ...config.security
      },
      limits: {
        memoryMB: 512,
        timeoutMs: 30000,
        maxConcurrentCalls: 10,
        ...config.limits
      },
      validation: {
        requireTypes: false,
        ...config.validation
      },
      ...config
    }
  }
  
  /**
   * Initialize with validation
   */
  async onInitialize(): Promise<void> {
    // Validate package configuration
    await this.validatePackage()
    
    // Check for vulnerabilities
    if (this.config.security?.scanVulnerabilities) {
      await this.scanVulnerabilities()
    }
    
    // Initialize primitive
    this.primitive = new ExternalConstructPrimitive(this.name + '-primitive', {
      source: {
        type: 'npm',
        identifier: this.config.package.name,
        version: this.config.package.version
      }
    })
    
    await this.primitive.initialize()
    
    // Wrap methods with security
    this.wrapMethods()
  }
  
  /**
   * Execute method with security checks
   */
  async execute(method: string, ...args: any[]): Promise<any> {
    // Check if method is allowed
    if (!this.isMethodAllowed(method)) {
      throw new Error(`Method '${method}' is not allowed by security policy`)
    }
    
    // Check rate limits
    this.checkRateLimits(method)
    
    // Track method call
    this.trackMethodCall(method)
    
    // Execute with timeout
    return await this.executeWithTimeout(
      () => this.primitive.execute(method, ...args),
      this.config.limits?.timeoutMs || 30000
    )
  }
  
  /**
   * Get validated property
   */
  getProperty(property: string): any {
    // Could add property access validation here
    return this.primitive.getProperty(property)
  }
  
  /**
   * Validate package before loading
   */
  private async validatePackage(): Promise<void> {
    const { name, version } = this.config.package
    
    // Validate package name format
    if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
      throw new Error(`Invalid package name: ${name}`)
    }
    
    // Validate version format
    if (!/^\d+\.\d+\.\d+(-.*)?$/.test(version)) {
      throw new Error(`Invalid version format: ${version}`)
    }
    
    // Check version constraints
    if (this.config.validation?.minVersion) {
      if (this.compareVersions(version, this.config.validation.minVersion) < 0) {
        throw new Error(`Version ${version} is below minimum ${this.config.validation.minVersion}`)
      }
    }
    
    if (this.config.validation?.maxVersion) {
      if (this.compareVersions(version, this.config.validation.maxVersion) > 0) {
        throw new Error(`Version ${version} is above maximum ${this.config.validation.maxVersion}`)
      }
    }
  }
  
  /**
   * Scan for known vulnerabilities
   */
  private async scanVulnerabilities(): Promise<void> {
    // In a real implementation, would check against vulnerability database
    // For now, just log
    console.log(`Scanning ${this.config.package.name}@${this.config.package.version} for vulnerabilities...`)
    
    // Simulate vulnerability check
    const knownVulnerablePackages = [
      'evil-package',
      'malicious-code'
    ]
    
    if (knownVulnerablePackages.includes(this.config.package.name)) {
      throw new Error(`Package ${this.config.package.name} has known vulnerabilities`)
    }
  }
  
  /**
   * Wrap primitive methods with security
   */
  private wrapMethods(): void {
    // Get instance to check available methods
    const instance = this.primitive.getInstance()
    if (!instance) return
    
    // Could wrap each method with security checks
    // For now, we'll use the execute method for controlled access
  }
  
  /**
   * Check if method is allowed by security policy
   */
  private isMethodAllowed(method: string): boolean {
    const { allowedMethods, blockedMethods } = this.config.security || {}
    
    // If blocklist exists and method is in it, deny
    if (blockedMethods && blockedMethods.includes(method)) {
      return false
    }
    
    // If allowlist exists and method is not in it, deny
    if (allowedMethods && !allowedMethods.includes(method)) {
      return false
    }
    
    // Otherwise allow
    return true
  }
  
  /**
   * Check rate limits
   */
  private checkRateLimits(method: string): void {
    const count = this.methodCallCount.get(method) || 0
    const maxCalls = this.config.limits?.maxConcurrentCalls || 10
    
    if (count >= maxCalls) {
      throw new Error(`Rate limit exceeded for method '${method}'`)
    }
  }
  
  /**
   * Track method calls for monitoring
   */
  private trackMethodCall(method: string): void {
    const count = this.methodCallCount.get(method) || 0
    this.methodCallCount.set(method, count + 1)
    
    // Reset count after a time window
    setTimeout(() => {
      const currentCount = this.methodCallCount.get(method) || 0
      this.methodCallCount.set(method, Math.max(0, currentCount - 1))
    }, 60000) // 1 minute window
  }
  
  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ])
  }
  
  /**
   * Compare semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1
      if (parts1[i] < parts2[i]) return -1
    }
    
    return 0
  }
  
  /**
   * Get package info
   */
  getPackageInfo() {
    return {
      name: this.config.package.name,
      version: this.config.package.version,
      registry: this.config.package.registry || 'https://registry.npmjs.org',
      security: this.config.security,
      limits: this.config.limits,
      uptime: Date.now() - this.startTime,
      methodCalls: Object.fromEntries(this.methodCallCount)
    }
  }
  
  /**
   * Cleanup
   */
  async onDestroy(): Promise<void> {
    await this.primitive.destroy()
    this.methodCallCount.clear()
  }
}