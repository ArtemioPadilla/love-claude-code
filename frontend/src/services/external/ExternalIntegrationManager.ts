/**
 * External Integration Manager
 * 
 * Coordinates all external integrations, managing their lifecycle,
 * security, resources, and inter-integration communication.
 */

import { SecurityScanner, SecurityScanResult } from './SecurityScanner'
import { ResourceMonitor, ResourceMetrics, ResourceLimits } from './ResourceMonitor'
import { LicenseChecker } from './LicenseChecker'
import { VersionManager } from './VersionManager'

export interface ExternalIntegration {
  id: string
  name: string
  type: 'library' | 'api' | 'container' | 'plugin' | 'mcp-server'
  status: 'unregistered' | 'registered' | 'active' | 'suspended' | 'error'
  metadata: {
    version?: string
    author?: string
    description?: string
    homepage?: string
    dependencies?: Record<string, string>
  }
  config: any
  security?: {
    lastScan?: SecurityScanResult
    permissions?: string[]
    trusted?: boolean
  }
  resources?: {
    limits?: ResourceLimits
    currentUsage?: ResourceMetrics
  }
  registeredAt?: Date
  lastActiveAt?: Date
  error?: string
}

export interface IntegrationPolicy {
  requireSecurityScan?: boolean
  requireLicenseCheck?: boolean
  autoUpdate?: boolean
  resourceLimits?: ResourceLimits
  allowedTypes?: ExternalIntegration['type'][]
  trustedSources?: string[]
  blacklist?: string[]
}

export interface IntegrationEvent {
  type: 'registered' | 'activated' | 'suspended' | 'error' | 'security-alert' | 'resource-alert'
  integrationId: string
  timestamp: Date
  details?: any
}

export class ExternalIntegrationManager {
  private integrations: Map<string, ExternalIntegration> = new Map()
  private policy: IntegrationPolicy
  private securityScanner: SecurityScanner
  private resourceMonitor: ResourceMonitor
  private licenseChecker?: LicenseChecker
  private versionManager?: VersionManager
  private eventHandlers: Map<string, Set<(event: IntegrationEvent) => void>> = new Map()
  private integrationHandlers: Map<string, any> = new Map()
  
  constructor(policy: IntegrationPolicy = {}) {
    this.policy = {
      requireSecurityScan: true,
      requireLicenseCheck: true,
      autoUpdate: false,
      ...policy
    }
    
    this.securityScanner = new SecurityScanner()
    this.resourceMonitor = new ResourceMonitor({
      alertThresholds: {
        cpu: 80,
        memory: 90,
        network: 80,
        storage: 95
      }
    })
    
    // Set up resource alerts
    this.resourceMonitor.onAlert((alert) => {
      const integration = Array.from(this.integrations.values())
        .find(i => i.id === alert.id.split('-')[0])
      
      if (integration) {
        this.emitEvent({
          type: 'resource-alert',
          integrationId: integration.id,
          timestamp: new Date(),
          details: alert
        })
      }
    })
  }
  
  /**
   * Register a new external integration
   */
  async register(integration: Omit<ExternalIntegration, 'status' | 'registeredAt'>): Promise<string> {
    // Check if already registered
    if (this.integrations.has(integration.id)) {
      throw new Error(`Integration ${integration.id} already registered`)
    }
    
    // Check blacklist
    if (this.policy.blacklist?.includes(integration.name)) {
      throw new Error(`Integration ${integration.name} is blacklisted`)
    }
    
    // Check allowed types
    if (this.policy.allowedTypes && !this.policy.allowedTypes.includes(integration.type)) {
      throw new Error(`Integration type ${integration.type} not allowed`)
    }
    
    // Perform security scan if required
    if (this.policy.requireSecurityScan) {
      const scanResult = await this.performSecurityScan(integration)
      if (!scanResult.passed) {
        throw new Error(`Security scan failed: ${scanResult.vulnerabilities.length} vulnerabilities found`)
      }
      integration.security = {
        lastScan: scanResult,
        trusted: this.isTrusted(integration)
      }
    }
    
    // Check license if required
    if (this.policy.requireLicenseCheck && this.licenseChecker) {
      const licenseResult = await this.licenseChecker.check(integration)
      if (!licenseResult.compatible) {
        throw new Error(`License ${licenseResult.license} is not compatible`)
      }
    }
    
    // Register the integration
    const registered: ExternalIntegration = {
      ...integration,
      status: 'registered',
      registeredAt: new Date()
    }
    
    this.integrations.set(integration.id, registered)
    
    this.emitEvent({
      type: 'registered',
      integrationId: integration.id,
      timestamp: new Date()
    })
    
    return integration.id
  }
  
  /**
   * Activate an integration
   */
  async activate(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }
    
    if (integration.status === 'active') {
      return
    }
    
    try {
      // Create handler based on type
      const handler = await this.createIntegrationHandler(integration)
      this.integrationHandlers.set(integrationId, handler)
      
      // Start resource monitoring if limits defined
      if (this.policy.resourceLimits || integration.resources?.limits) {
        this.startResourceMonitoring(integration)
      }
      
      integration.status = 'active'
      integration.lastActiveAt = new Date()
      
      this.emitEvent({
        type: 'activated',
        integrationId,
        timestamp: new Date()
      })
      
    } catch (error) {
      integration.status = 'error'
      integration.error = error.message
      
      this.emitEvent({
        type: 'error',
        integrationId,
        timestamp: new Date(),
        details: { error: error.message }
      })
      
      throw error
    }
  }
  
  /**
   * Suspend an integration
   */
  async suspend(integrationId: string, reason?: string): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }
    
    // Stop resource monitoring
    this.resourceMonitor.stopMonitoring(integrationId)
    
    // Clean up handler
    const handler = this.integrationHandlers.get(integrationId)
    if (handler && typeof handler.cleanup === 'function') {
      await handler.cleanup()
    }
    this.integrationHandlers.delete(integrationId)
    
    integration.status = 'suspended'
    
    this.emitEvent({
      type: 'suspended',
      integrationId,
      timestamp: new Date(),
      details: { reason }
    })
  }
  
  /**
   * Unregister an integration
   */
  async unregister(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      return
    }
    
    // Suspend if active
    if (integration.status === 'active') {
      await this.suspend(integrationId)
    }
    
    this.integrations.delete(integrationId)
  }
  
  /**
   * Perform security scan
   */
  private async performSecurityScan(integration: ExternalIntegration): Promise<SecurityScanResult> {
    switch (integration.type) {
      case 'library':
        return this.securityScanner.scanNpmPackage(
          integration.name,
          integration.metadata.version || 'latest'
        )
        
      case 'container': {
        const [image, tag] = integration.name.split(':')
        return this.securityScanner.scanDockerImage(image, tag || 'latest')
      }
        
      case 'api':
        return this.securityScanner.scanAPIEndpoint(integration.config.url)
        
      case 'plugin':
        return this.securityScanner.scanPluginCode(integration.config.code || '')
        
      case 'mcp-server':
        return this.securityScanner.scanAPIEndpoint(integration.config.endpoint)
        
      default:
        throw new Error(`Unknown integration type: ${integration.type}`)
    }
  }
  
  /**
   * Check if integration is from trusted source
   */
  private isTrusted(integration: ExternalIntegration): boolean {
    if (!this.policy.trustedSources) return false
    
    // Check various trust indicators
    const homepage = integration.metadata.homepage
    const author = integration.metadata.author
    
    return this.policy.trustedSources.some(source => 
      (homepage && homepage.includes(source)) ||
      (author && author.includes(source)) ||
      integration.name.startsWith(source)
    )
  }
  
  /**
   * Create integration handler
   */
  private async createIntegrationHandler(integration: ExternalIntegration): Promise<any> {
    // In real implementation, would create appropriate handler
    // based on integration type
    return {
      integration,
      start: async () => console.log(`Starting ${integration.id}`),
      stop: async () => console.log(`Stopping ${integration.id}`),
      cleanup: async () => console.log(`Cleaning up ${integration.id}`)
    }
  }
  
  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(integration: ExternalIntegration): void {
    const limits = integration.resources?.limits || this.policy.resourceLimits
    
    this.resourceMonitor.startMonitoring(
      integration.id,
      async () => {
        // In real implementation, would collect actual metrics
        return {
          cpu: {
            usage: Math.random() * 100,
            cores: 1,
            throttled: false
          },
          memory: {
            used: Math.random() * 1024 * 1024 * 100, // 0-100MB
            limit: 1024 * 1024 * 1024, // 1GB
            percentage: Math.random() * 100
          },
          network: {
            bytesIn: Math.random() * 1024 * 1024,
            bytesOut: Math.random() * 1024 * 1024,
            requestsPerSecond: Math.random() * 10,
            activeConnections: Math.floor(Math.random() * 10)
          },
          storage: {
            used: Math.random() * 1024 * 1024 * 10, // 0-10MB
            limit: 1024 * 1024 * 100, // 100MB
            operations: {
              reads: Math.floor(Math.random() * 100),
              writes: Math.floor(Math.random() * 50)
            }
          },
          timestamp: new Date()
        }
      },
      limits
    )
  }
  
  /**
   * Get integration by ID
   */
  getIntegration(integrationId: string): ExternalIntegration | undefined {
    return this.integrations.get(integrationId)
  }
  
  /**
   * Get all integrations
   */
  getAllIntegrations(): ExternalIntegration[] {
    return Array.from(this.integrations.values())
  }
  
  /**
   * Get integrations by type
   */
  getIntegrationsByType(type: ExternalIntegration['type']): ExternalIntegration[] {
    return Array.from(this.integrations.values())
      .filter(i => i.type === type)
  }
  
  /**
   * Get active integrations
   */
  getActiveIntegrations(): ExternalIntegration[] {
    return Array.from(this.integrations.values())
      .filter(i => i.status === 'active')
  }
  
  /**
   * Update integration configuration
   */
  async updateConfiguration(integrationId: string, config: any): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }
    
    const wasActive = integration.status === 'active'
    
    // Suspend if active
    if (wasActive) {
      await this.suspend(integrationId, 'Configuration update')
    }
    
    // Update config
    integration.config = { ...integration.config, ...config }
    
    // Re-scan if security scan required
    if (this.policy.requireSecurityScan) {
      const scanResult = await this.performSecurityScan(integration)
      integration.security = {
        ...integration.security,
        lastScan: scanResult
      }
    }
    
    // Reactivate if was active
    if (wasActive) {
      await this.activate(integrationId)
    }
  }
  
  /**
   * Check for updates
   */
  async checkForUpdates(integrationId: string): Promise<{
    hasUpdate: boolean
    currentVersion?: string
    latestVersion?: string
  }> {
    const integration = this.integrations.get(integrationId)
    if (!integration || !this.versionManager) {
      return { hasUpdate: false }
    }
    
    return this.versionManager.checkForUpdate(integration)
  }
  
  /**
   * Update integration
   */
  async updateIntegration(integrationId: string): Promise<void> {
    if (!this.policy.autoUpdate || !this.versionManager) {
      throw new Error('Updates not enabled')
    }
    
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`)
    }
    
    const wasActive = integration.status === 'active'
    
    // Suspend if active
    if (wasActive) {
      await this.suspend(integrationId, 'Update')
    }
    
    // Perform update
    await this.versionManager.update(integration)
    
    // Re-scan security
    if (this.policy.requireSecurityScan) {
      const scanResult = await this.performSecurityScan(integration)
      integration.security = {
        ...integration.security,
        lastScan: scanResult
      }
    }
    
    // Reactivate if was active
    if (wasActive) {
      await this.activate(integrationId)
    }
  }
  
  /**
   * Get resource usage for integration
   */
  getResourceUsage(integrationId: string): ResourceMetrics | null {
    return this.resourceMonitor.getCurrentMetrics(integrationId)
  }
  
  /**
   * Get resource history
   */
  getResourceHistory(integrationId: string, duration?: number): ResourceMetrics[] {
    return this.resourceMonitor.getMetricsHistory(integrationId, duration)
  }
  
  /**
   * Subscribe to events
   */
  on(event: IntegrationEvent['type'], handler: (event: IntegrationEvent) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    
    this.eventHandlers.get(event)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }
  
  /**
   * Emit event
   */
  private emitEvent(event: IntegrationEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event)
        } catch (error) {
          console.error(`Event handler error:`, error)
        }
      }
    }
    
    // Also emit to 'all' handlers
    const allHandlers = this.eventHandlers.get('*' as any)
    if (allHandlers) {
      for (const handler of allHandlers) {
        try {
          handler(event)
        } catch (error) {
          console.error(`Event handler error:`, error)
        }
      }
    }
  }
  
  /**
   * Get integration statistics
   */
  getStatistics(): {
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    securityIssues: number
    resourceAlerts: number
  } {
    const integrations = Array.from(this.integrations.values())
    
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let securityIssues = 0
    
    for (const integration of integrations) {
      // Count by type
      byType[integration.type] = (byType[integration.type] || 0) + 1
      
      // Count by status
      byStatus[integration.status] = (byStatus[integration.status] || 0) + 1
      
      // Count security issues
      if (integration.security?.lastScan && !integration.security.lastScan.passed) {
        securityIssues++
      }
    }
    
    // Count resource alerts
    const resourceAlerts = this.resourceMonitor.getAllAlerts().length
    
    return {
      total: integrations.length,
      byType,
      byStatus,
      securityIssues,
      resourceAlerts
    }
  }
  
  /**
   * Export integration data
   */
  exportData(): {
    integrations: ExternalIntegration[]
    policy: IntegrationPolicy
    statistics: any
    exportedAt: Date
  } {
    return {
      integrations: this.getAllIntegrations(),
      policy: this.policy,
      statistics: this.getStatistics(),
      exportedAt: new Date()
    }
  }
  
  /**
   * Clean up manager
   */
  async cleanup(): Promise<void> {
    // Suspend all active integrations
    const active = this.getActiveIntegrations()
    for (const integration of active) {
      await this.suspend(integration.id, 'Manager cleanup')
    }
    
    // Clear resource monitor
    this.resourceMonitor.clear()
    
    // Clear all data
    this.integrations.clear()
    this.integrationHandlers.clear()
    this.eventHandlers.clear()
  }
}

// Export singleton instance
export const integrationManager = new ExternalIntegrationManager()