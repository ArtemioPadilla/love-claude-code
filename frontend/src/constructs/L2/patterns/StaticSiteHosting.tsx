/**
 * Static Site Hosting L2 Pattern Construct
 * 
 * Complete static website hosting pattern with CDN distribution, SSL/TLS,
 * custom domains, and automatic deployment. Composes multiple L1 constructs
 * to create a production-ready static site hosting solution.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  BaseConstruct
} from '../../types'
import { 
  CDNStorage,
  RestAPIService,
  ManagedContainer,
  SecureAuthService
} from '../../L1/infrastructure'
import { ResponsiveLayout, ProjectFileExplorer } from '../../L1/ui'

// Type definitions
interface StaticSiteConfig {
  name: string
  domain?: string
  customDomains?: string[]
  source: {
    type: 'local' | 'git' | 's3' | 'upload'
    path?: string
    repository?: string
    branch?: string
    bucket?: string
  }
  build?: {
    enabled: boolean
    command?: string
    outputDir?: string
    environment?: Record<string, string>
  }
  cdn: {
    provider: 'cloudfront' | 'cloudflare' | 'fastly' | 'bunny' | 'firebase'
    caching?: {
      defaultTTL?: number
      maxTTL?: number
      patterns?: Array<{
        path: string
        ttl: number
        compress?: boolean
      }>
    }
    compression?: boolean
    minification?: boolean
  }
  ssl?: {
    enabled: boolean
    certificate?: 'auto' | 'custom'
    customCert?: string
    customKey?: string
  }
  redirects?: Array<{
    from: string
    to: string
    type: 301 | 302
  }>
  headers?: Array<{
    path: string
    headers: Record<string, string>
  }>
  errorPages?: {
    '404'?: string
    '500'?: string
  }
  authentication?: {
    enabled: boolean
    type: 'basic' | 'oauth' | 'custom'
    config?: any
  }
  analytics?: {
    enabled: boolean
    provider: 'google' | 'plausible' | 'matomo' | 'custom'
    config?: any
  }
}

interface DeploymentInfo {
  id: string
  version: string
  timestamp: string
  status: 'deploying' | 'live' | 'failed' | 'rollback'
  url: string
  size: number
  fileCount: number
  buildTime?: number
  deployTime?: number
}

interface SiteMetrics {
  views: number
  visitors: number
  bandwidth: number
  requests: number
  cacheHitRate: number
  avgResponseTime: number
  errorRate: number
}

interface StaticSiteHostingOutputs {
  siteId: string
  status: 'initializing' | 'building' | 'deploying' | 'live' | 'error'
  primaryUrl: string
  cdnUrl: string
  customUrls: string[]
  currentDeployment?: DeploymentInfo
  deploymentHistory: DeploymentInfo[]
  metrics: SiteMetrics
  capabilities: {
    ssl: boolean
    customDomains: boolean
    authentication: boolean
    analytics: boolean
    building: boolean
  }
}

export class StaticSiteHosting extends L2PatternConstruct {
  private config: StaticSiteConfig = {
    name: '',
    source: { type: 'local' },
    cdn: {
      provider: 'cloudflare',
      compression: true,
      minification: true
    }
  }
  
  private outputs: StaticSiteHostingOutputs = {
    siteId: '',
    status: 'initializing',
    primaryUrl: '',
    cdnUrl: '',
    customUrls: [],
    deploymentHistory: [],
    metrics: {
      views: 0,
      visitors: 0,
      bandwidth: 0,
      requests: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
      errorRate: 0
    },
    capabilities: {
      ssl: false,
      customDomains: false,
      authentication: false,
      analytics: false,
      building: false
    }
  }
  
  private cdnStorage: CDNStorage | null = null
  private apiService: RestAPIService | null = null
  private buildContainer: ManagedContainer | null = null
  private authService: SecureAuthService | null = null
  private fileExplorer: ProjectFileExplorer | null = null
  private layout: ResponsiveLayout | null = null
  
  private deploymentInProgress = false
  private metricsInterval: NodeJS.Timeout | null = null
  private analyticsInterval: NodeJS.Timeout | null = null

  constructor(config?: Partial<StaticSiteConfig>) {
    super()
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(config: StaticSiteConfig): Promise<void> {
    this.config = config
    this.outputs.siteId = `site-${config.name}-${Date.now()}`
    
    try {
      await this.composePattern()
      await this.performInitialDeployment()
      this.configureInteractions()
      
      this.outputs.status = 'live'
      this.outputs.capabilities = {
        ssl: !!config.ssl?.enabled,
        customDomains: !!config.customDomains?.length,
        authentication: !!config.authentication?.enabled,
        analytics: !!config.analytics?.enabled,
        building: !!config.build?.enabled
      }
      
      this.emit('initialized', this.outputs)
    } catch (error) {
      this.outputs.status = 'error'
      this.emit('error', { operation: 'initialize', error })
      throw error
    }
  }

  protected async composePattern(): Promise<void> {
    // Create layout for management UI
    this.layout = new ResponsiveLayout()
    await this.layout.initialize({
      sections: [
        { id: 'files', title: 'Site Files', size: 30 },
        { id: 'preview', title: 'Live Preview', size: 40 },
        { id: 'deployments', title: 'Deployments', size: 30 }
      ]
    })
    this.componentRefs.set('layout', this.layout)
    
    // Create CDN storage
    this.cdnStorage = new CDNStorage()
    await this.cdnStorage.initialize({
      provider: this.config.cdn.provider,
      bucket: `${this.config.name}-static-site`,
      region: 'us-east-1',
      publicRead: true,
      optimization: {
        compression: this.config.cdn.compression ?? true,
        caching: true,
        minification: this.config.cdn.minification ?? true
      },
      customDomain: this.config.domain
    })
    this.componentRefs.set('cdnStorage', this.cdnStorage)
    this.outputs.cdnUrl = this.cdnStorage.getOutputs().cdnUrl
    this.outputs.primaryUrl = this.config.domain || this.outputs.cdnUrl
    
    // Create file explorer for site management
    this.fileExplorer = new ProjectFileExplorer()
    await this.fileExplorer.initialize({
      projectId: this.outputs.siteId,
      rootPath: '/',
      features: {
        upload: true,
        download: true,
        preview: true,
        search: true
      }
    })
    this.componentRefs.set('fileExplorer', this.fileExplorer)
    
    // Create API service for site management
    this.apiService = new RestAPIService()
    await this.apiService.initialize({
      name: `${this.config.name}-api`,
      routes: [
        {
          path: '/deploy',
          method: 'POST',
          handler: this.handleDeployRequest.bind(this)
        },
        {
          path: '/rollback/:version',
          method: 'POST',
          handler: this.handleRollbackRequest.bind(this)
        },
        {
          path: '/metrics',
          method: 'GET',
          handler: this.handleMetricsRequest.bind(this)
        }
      ],
      cors: {
        origins: ['*'],
        credentials: false
      }
    })
    this.componentRefs.set('apiService', this.apiService)
    
    // Create build container if building is enabled
    if (this.config.build?.enabled) {
      this.buildContainer = new ManagedContainer()
      await this.buildContainer.initialize({
        name: `${this.config.name}-builder`,
        image: 'node:18-alpine',
        resources: { cpu: '1000m', memory: '2Gi' },
        environment: this.config.build.environment || {}
      })
      this.componentRefs.set('buildContainer', this.buildContainer)
    }
    
    // Create auth service if authentication is enabled
    if (this.config.authentication?.enabled) {
      this.authService = new SecureAuthService()
      await this.authService.initialize({
        provider: 'jwt',
        issuer: this.config.domain || this.config.name,
        audience: 'static-site',
        secret: process.env.JWT_SECRET || 'default-secret'
      })
      this.componentRefs.set('authService', this.authService)
    }
  }

  protected configureInteractions(): void {
    // CDN events
    this.cdnStorage?.on('uploaded', (data: any) => {
      this.emit('fileUploaded', data)
    })
    
    this.cdnStorage?.on('invalidated', (data: any) => {
      this.emit('cacheInvalidated', data)
    })
    
    // File explorer events
    this.fileExplorer?.on('fileChanged', (data: any) => {
      if (this.config.source.type === 'local') {
        this.handleFileChange(data)
      }
    })
    
    // Build container events
    this.buildContainer?.on('buildComplete', (data: any) => {
      this.emit('buildCompleted', data)
    })
    
    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics()
    }, 60000) // Every minute
    
    // Start analytics if enabled
    if (this.config.analytics?.enabled) {
      this.analyticsInterval = setInterval(() => {
        this.collectAnalytics()
      }, 300000) // Every 5 minutes
    }
  }

  private async performInitialDeployment(): Promise<void> {
    const deploymentId = await this.deploy()
    
    // Wait for deployment to complete
    await new Promise<void>((resolve, reject) => {
      const checkStatus = setInterval(() => {
        const deployment = this.outputs.deploymentHistory.find(d => d.id === deploymentId)
        if (deployment) {
          if (deployment.status === 'live') {
            clearInterval(checkStatus)
            resolve()
          } else if (deployment.status === 'failed') {
            clearInterval(checkStatus)
            reject(new Error('Initial deployment failed'))
          }
        }
      }, 1000)
    })
  }

  private async handleDeployRequest(req: any, res: any): Promise<void> {
    try {
      const deploymentId = await this.deploy()
      res.json({ deploymentId, status: 'started' })
    } catch (error) {
      res.status(500).json({ error: 'Deployment failed' })
    }
  }

  private async handleRollbackRequest(req: any, res: any): Promise<void> {
    try {
      const { version } = req.params
      await this.rollback(version)
      res.json({ status: 'success' })
    } catch (error) {
      res.status(500).json({ error: 'Rollback failed' })
    }
  }

  private async handleMetricsRequest(req: any, res: any): Promise<void> {
    res.json(this.outputs.metrics)
  }

  private async handleFileChange(data: any): Promise<void> {
    // Auto-deploy on file change if configured
    if (this.config.source.type === 'local') {
      this.emit('fileChanged', data)
      // Could trigger auto-deploy here if configured
    }
  }

  private async collectMetrics(): Promise<void> {
    // Simulate metrics collection
    this.outputs.metrics = {
      views: this.outputs.metrics.views + Math.floor(Math.random() * 100),
      visitors: this.outputs.metrics.visitors + Math.floor(Math.random() * 50),
      bandwidth: this.outputs.metrics.bandwidth + Math.random() * 1024 * 1024,
      requests: this.outputs.metrics.requests + Math.floor(Math.random() * 1000),
      cacheHitRate: 0.85 + Math.random() * 0.1,
      avgResponseTime: 50 + Math.random() * 100,
      errorRate: Math.random() * 0.02
    }
    
    this.emit('metricsUpdated', this.outputs.metrics)
  }

  private async collectAnalytics(): Promise<void> {
    // Simulate analytics collection
    const analytics = {
      topPages: ['/index.html', '/about.html', '/blog/'],
      referrers: ['google.com', 'twitter.com', 'direct'],
      devices: { desktop: 60, mobile: 35, tablet: 5 }
    }
    
    this.emit('analyticsUpdated', analytics)
  }

  // Public methods
  async deploy(options?: { source?: string; skipBuild?: boolean }): Promise<string> {
    if (this.deploymentInProgress) {
      throw new Error('Deployment already in progress')
    }
    
    this.deploymentInProgress = true
    const deploymentId = `deploy-${Date.now()}`
    const startTime = Date.now()
    
    try {
      this.outputs.status = 'building'
      this.emit('deploymentStarted', { deploymentId })
      
      let buildTime = 0
      let sourceFiles: string[] = []
      
      // Build phase if enabled
      if (this.config.build?.enabled && !options?.skipBuild) {
        const buildStart = Date.now()
        await this.runBuild()
        buildTime = Date.now() - buildStart
        sourceFiles = await this.getBuiltFiles()
      } else {
        sourceFiles = await this.getSourceFiles(options?.source)
      }
      
      this.outputs.status = 'deploying'
      
      // Upload files to CDN
      const uploadPromises = sourceFiles.map(async (file) => {
        const content = await this.readFile(file)
        return this.cdnStorage?.upload(file, content, this.getContentType(file))
      })
      
      await Promise.all(uploadPromises)
      
      // Invalidate CDN cache
      await this.cdnStorage?.invalidate(['/*'])
      
      // Apply redirects and headers
      await this.applyConfiguration()
      
      const deployTime = Date.now() - startTime - buildTime
      
      // Create deployment record
      const deployment: DeploymentInfo = {
        id: deploymentId,
        version: `v${this.outputs.deploymentHistory.length + 1}`,
        timestamp: new Date().toISOString(),
        status: 'live',
        url: this.outputs.primaryUrl,
        size: sourceFiles.length * 1000, // Mock size
        fileCount: sourceFiles.length,
        buildTime,
        deployTime
      }
      
      this.outputs.currentDeployment = deployment
      this.outputs.deploymentHistory.unshift(deployment)
      this.outputs.status = 'live'
      
      this.emit('deploymentCompleted', deployment)
      return deploymentId
    } catch (error) {
      const deployment: DeploymentInfo = {
        id: deploymentId,
        version: `v${this.outputs.deploymentHistory.length + 1}`,
        timestamp: new Date().toISOString(),
        status: 'failed',
        url: '',
        size: 0,
        fileCount: 0
      }
      
      this.outputs.deploymentHistory.unshift(deployment)
      this.outputs.status = 'error'
      
      this.emit('deploymentFailed', { deploymentId, error })
      throw error
    } finally {
      this.deploymentInProgress = false
    }
  }

  async rollback(version: string): Promise<void> {
    const deployment = this.outputs.deploymentHistory.find(d => d.version === version)
    if (!deployment) {
      throw new Error(`Deployment version ${version} not found`)
    }
    
    this.emit('rollbackStarted', { version })
    
    try {
      // In real implementation, would restore files from versioned storage
      deployment.status = 'live'
      this.outputs.currentDeployment = deployment
      
      // Invalidate CDN cache
      await this.cdnStorage?.invalidate(['/*'])
      
      this.emit('rollbackCompleted', { version })
    } catch (error) {
      this.emit('rollbackFailed', { version, error })
      throw error
    }
  }

  async updateDomain(domain: string): Promise<void> {
    this.config.domain = domain
    
    // Update CDN configuration
    await this.cdnStorage?.updateConfig({ customDomain: domain })
    
    this.outputs.primaryUrl = domain
    this.outputs.customUrls = [domain, ...(this.config.customDomains || [])]
    
    this.emit('domainUpdated', { domain })
  }

  async addCustomDomain(domain: string): Promise<void> {
    if (!this.config.customDomains) {
      this.config.customDomains = []
    }
    
    this.config.customDomains.push(domain)
    this.outputs.customUrls = [this.config.domain || '', ...this.config.customDomains].filter(Boolean)
    
    this.emit('customDomainAdded', { domain })
  }

  async enableSSL(certificate?: { cert: string; key: string }): Promise<void> {
    this.config.ssl = {
      enabled: true,
      certificate: certificate ? 'custom' : 'auto',
      customCert: certificate?.cert,
      customKey: certificate?.key
    }
    
    this.outputs.capabilities.ssl = true
    
    this.emit('sslEnabled', { type: certificate ? 'custom' : 'auto' })
  }

  async setRedirect(from: string, to: string, type: 301 | 302 = 301): Promise<void> {
    if (!this.config.redirects) {
      this.config.redirects = []
    }
    
    this.config.redirects.push({ from, to, type })
    await this.applyConfiguration()
    
    this.emit('redirectAdded', { from, to, type })
  }

  async setHeaders(path: string, headers: Record<string, string>): Promise<void> {
    if (!this.config.headers) {
      this.config.headers = []
    }
    
    const existing = this.config.headers.findIndex(h => h.path === path)
    if (existing >= 0) {
      this.config.headers[existing].headers = { ...this.config.headers[existing].headers, ...headers }
    } else {
      this.config.headers.push({ path, headers })
    }
    
    await this.applyConfiguration()
    
    this.emit('headersUpdated', { path, headers })
  }

  async setErrorPage(code: '404' | '500', path: string): Promise<void> {
    if (!this.config.errorPages) {
      this.config.errorPages = {}
    }
    
    this.config.errorPages[code] = path
    await this.applyConfiguration()
    
    this.emit('errorPageSet', { code, path })
  }

  getDeploymentHistory(limit: number = 10): DeploymentInfo[] {
    return this.outputs.deploymentHistory.slice(0, limit)
  }

  getMetrics(): SiteMetrics {
    return this.outputs.metrics
  }

  async purgeCache(paths?: string[]): Promise<void> {
    await this.cdnStorage?.invalidate(paths || ['/*'])
    this.emit('cachePurged', { paths })
  }

  private async runBuild(): Promise<void> {
    if (!this.buildContainer || !this.config.build?.command) {
      return
    }
    
    this.emit('buildStarted', {})
    
    try {
      await this.buildContainer.exec(this.config.build.command)
      this.emit('buildCompleted', {})
    } catch (error) {
      this.emit('buildFailed', { error })
      throw error
    }
  }

  private async getSourceFiles(sourcePath?: string): Promise<string[]> {
    // Mock implementation - would scan source directory
    return [
      'index.html',
      'styles.css',
      'script.js',
      'favicon.ico',
      'robots.txt',
      'sitemap.xml'
    ]
  }

  private async getBuiltFiles(): Promise<string[]> {
    // Mock implementation - would scan build output directory
    const outputDir = this.config.build?.outputDir || 'dist'
    return [
      `${outputDir}/index.html`,
      `${outputDir}/bundle.js`,
      `${outputDir}/styles.css`,
      `${outputDir}/assets/logo.png`
    ]
  }

  private async readFile(path: string): Promise<Buffer> {
    // Mock implementation - would read actual file
    return Buffer.from(`Content of ${path}`)
  }

  private getContentType(file: string): string {
    const ext = file.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      txt: 'text/plain',
      xml: 'application/xml'
    }
    
    return contentTypes[ext || ''] || 'application/octet-stream'
  }

  private async applyConfiguration(): Promise<void> {
    // In real implementation, would apply redirects, headers, etc. to CDN
    this.emit('configurationApplied', {
      redirects: this.config.redirects?.length || 0,
      headers: this.config.headers?.length || 0,
      errorPages: Object.keys(this.config.errorPages || {}).length
    })
  }

  // BaseConstruct implementation
  getType(): ConstructType {
    return ConstructType.PATTERN
  }

  getLevel(): ConstructLevel {
    return ConstructLevel.L2
  }

  getConfig(): StaticSiteConfig {
    return this.config
  }

  getOutputs(): StaticSiteHostingOutputs {
    return this.outputs
  }

  async destroy(): Promise<void> {
    // Stop intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
    
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval)
      this.analyticsInterval = null
    }
    
    // Destroy all components
    await super.destroy()
    
    this.emit('destroyed', {})
  }

  renderStatus(): React.ReactElement {
    const outputs = this.getOutputs()
    
    return (
      <div className="static-site-hosting-status">
        <h4>Static Site Hosting Status</h4>
        <div>Site ID: {outputs.siteId}</div>
        <div>Status: {outputs.status}</div>
        <div>Primary URL: <a href={outputs.primaryUrl} target="_blank">{outputs.primaryUrl}</a></div>
        <div>CDN URL: <a href={outputs.cdnUrl} target="_blank">{outputs.cdnUrl}</a></div>
        
        {outputs.customUrls.length > 0 && (
          <div className="custom-domains">
            <h5>Custom Domains</h5>
            {outputs.customUrls.map(url => (
              <div key={url}><a href={`https://${url}`} target="_blank">{url}</a></div>
            ))}
          </div>
        )}
        
        {outputs.currentDeployment && (
          <div className="current-deployment">
            <h5>Current Deployment</h5>
            <div>Version: {outputs.currentDeployment.version}</div>
            <div>Deployed: {new Date(outputs.currentDeployment.timestamp).toLocaleString()}</div>
            <div>Files: {outputs.currentDeployment.fileCount}</div>
            <div>Build Time: {outputs.currentDeployment.buildTime}ms</div>
            <div>Deploy Time: {outputs.currentDeployment.deployTime}ms</div>
          </div>
        )}
        
        <div className="metrics">
          <h5>Metrics</h5>
          <div>Views: {outputs.metrics.views.toLocaleString()}</div>
          <div>Visitors: {outputs.metrics.visitors.toLocaleString()}</div>
          <div>Bandwidth: {(outputs.metrics.bandwidth / 1024 / 1024).toFixed(2)} MB</div>
          <div>Cache Hit Rate: {(outputs.metrics.cacheHitRate * 100).toFixed(1)}%</div>
          <div>Avg Response: {outputs.metrics.avgResponseTime.toFixed(0)}ms</div>
        </div>
        
        <div className="capabilities">
          <h5>Features</h5>
          <div>SSL/TLS: {outputs.capabilities.ssl ? '✓' : '✗'}</div>
          <div>Custom Domains: {outputs.capabilities.customDomains ? '✓' : '✗'}</div>
          <div>Authentication: {outputs.capabilities.authentication ? '✓' : '✗'}</div>
          <div>Analytics: {outputs.capabilities.analytics ? '✓' : '✗'}</div>
          <div>Build Pipeline: {outputs.capabilities.building ? '✓' : '✗'}</div>
        </div>
      </div>
    )
  }
}

// Factory function
export function createStaticSiteHosting(config?: Partial<StaticSiteConfig>): StaticSiteHosting {
  return new StaticSiteHosting(config)
}

// Definition for registry
export const staticSiteHostingDefinition: PlatformConstructDefinition = {
  id: 'platform-l2-static-site-hosting',
  name: 'Static Site Hosting',
  type: ConstructType.PATTERN,
  level: ConstructLevel.L2,
  description: 'Complete static website hosting with CDN, SSL, and automatic deployment',
  category: 'hosting',
  capabilities: [
    'cdn-distribution',
    'ssl-tls',
    'custom-domains',
    'auto-deployment',
    'caching',
    'compression',
    'redirects',
    'headers',
    'analytics'
  ],
  configuration: {
    source: { type: 'local' },
    cdn: {
      provider: 'cloudflare',
      compression: true,
      minification: true
    }
  },
  outputs: {
    siteId: '',
    status: 'initializing',
    primaryUrl: '',
    cdnUrl: '',
    customUrls: [],
    deploymentHistory: [],
    metrics: {
      views: 0,
      visitors: 0,
      bandwidth: 0,
      requests: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
      errorRate: 0
    },
    capabilities: {
      ssl: false,
      customDomains: false,
      authentication: false,
      analytics: false,
      building: false
    }
  },
  dependencies: [
    'platform-l1-cdn-storage',
    'platform-l1-rest-api-service',
    'platform-l1-managed-container',
    'platform-l1-secure-auth-service',
    'platform-l1-project-file-explorer',
    'platform-l1-responsive-layout'
  ],
  createInstance: (config) => new StaticSiteHosting(config as StaticSiteConfig)
}