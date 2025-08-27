/**
 * Tests for Static Site Hosting L2 Pattern Construct
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StaticSiteHosting, createStaticSiteHosting, staticSiteHostingDefinition } from '../StaticSiteHosting'
import { ConstructType, ConstructLevel } from '../../../types'

// Mock the L1 constructs
vi.mock('../../../L1/infrastructure', () => ({
  CDNStorage: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    upload: vi.fn().mockResolvedValue('https://cdn.example.com/file'),
    invalidate: vi.fn().mockResolvedValue(undefined),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      storageId: 'storage-123',
      cdnUrl: 'https://cdn.example.com'
    }),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  ManagedContainer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn().mockResolvedValue('Build complete'),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  SecureAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock('../../../L1/ui', () => ({
  ResponsiveLayout: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  ProjectFileExplorer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock the base class
vi.mock('../../base/L2PatternConstruct', () => ({
  L2PatternConstruct: class {
    componentRefs = new Map()
    
    on(_event: string, _handler: (...args: any[]) => void) {
      // Mock event handling
    }
    
    emit(_event: string, _data: any) {
      // Mock event emission
    }
    
    async destroy() {
      // Mock destroy
    }
  }
}))

describe('StaticSiteHosting', () => {
  let hosting: StaticSiteHosting
  let mockConfig: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    mockConfig = {
      name: 'test-site',
      domain: 'example.com',
      customDomains: ['www.example.com'],
      source: {
        type: 'local',
        path: './dist'
      },
      build: {
        enabled: true,
        command: 'npm run build',
        outputDir: 'dist',
        environment: {
          NODE_ENV: 'production'
        }
      },
      cdn: {
        provider: 'cloudflare',
        caching: {
          defaultTTL: 3600,
          maxTTL: 86400,
          patterns: [
            { path: '*.html', ttl: 300 },
            { path: '*.css', ttl: 86400, compress: true },
            { path: '*.js', ttl: 86400, compress: true }
          ]
        },
        compression: true,
        minification: true
      },
      ssl: {
        enabled: true,
        certificate: 'auto'
      },
      redirects: [
        { from: '/old-page', to: '/new-page', type: 301 }
      ],
      headers: [
        {
          path: '/*',
          headers: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      ],
      errorPages: {
        '404': '/404.html',
        '500': '/error.html'
      },
      authentication: {
        enabled: true,
        type: 'basic'
      },
      analytics: {
        enabled: true,
        provider: 'google'
      }
    }
    
    hosting = new StaticSiteHosting()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with provided configuration', async () => {
      await hosting.initialize(mockConfig)
      
      const outputs = hosting.getOutputs()
      expect(outputs.status).toBe('live')
      expect(outputs.primaryUrl).toBe('example.com')
      expect(outputs.cdnUrl).toBe('https://cdn.example.com')
      expect(outputs.customUrls).toContain('www.example.com')
      expect(outputs.capabilities.ssl).toBe(true)
      expect(outputs.capabilities.customDomains).toBe(true)
      expect(outputs.capabilities.authentication).toBe(true)
      expect(outputs.capabilities.analytics).toBe(true)
      expect(outputs.capabilities.building).toBe(true)
    })

    it('should handle minimal configuration', async () => {
      const minimalConfig = {
        name: 'minimal-site',
        source: { type: 'local' },
        cdn: { provider: 'cloudflare' }
      }
      
      await hosting.initialize(minimalConfig)
      
      const outputs = hosting.getOutputs()
      expect(outputs.status).toBe('live')
      expect(outputs.primaryUrl).toBe(outputs.cdnUrl)
      expect(outputs.capabilities.ssl).toBe(false)
      expect(outputs.capabilities.authentication).toBe(false)
      expect(outputs.capabilities.building).toBe(false)
    })

    it('should emit initialized event', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.initialize(mockConfig)
      
      expect(emitSpy).toHaveBeenCalledWith('initialized', expect.objectContaining({
        status: 'live',
        siteId: expect.any(String)
      }))
    })

    it('should perform initial deployment', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.initialize(mockConfig)
      
      expect(emitSpy).toHaveBeenCalledWith('deploymentStarted', expect.any(Object))
      expect(emitSpy).toHaveBeenCalledWith('deploymentCompleted', expect.any(Object))
      
      const outputs = hosting.getOutputs()
      expect(outputs.currentDeployment).toBeDefined()
      expect(outputs.deploymentHistory).toHaveLength(1)
    })
  })

  describe('deployment', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
    })

    it('should deploy site successfully', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      const deploymentId = await hosting.deploy()
      
      expect(deploymentId).toMatch(/^deploy-\d+$/)
      expect(emitSpy).toHaveBeenCalledWith('deploymentStarted', { deploymentId })
      expect(emitSpy).toHaveBeenCalledWith('buildStarted', {})
      expect(emitSpy).toHaveBeenCalledWith('buildCompleted', {})
      expect(emitSpy).toHaveBeenCalledWith('deploymentCompleted', expect.objectContaining({
        id: deploymentId,
        status: 'live'
      }))
      
      const outputs = hosting.getOutputs()
      expect(outputs.currentDeployment?.id).toBe(deploymentId)
      expect(outputs.deploymentHistory).toHaveLength(2) // Initial + new
    })

    it('should skip build when requested', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.deploy({ skipBuild: true })
      
      expect(emitSpy).not.toHaveBeenCalledWith('buildStarted', expect.any(Object))
      expect(emitSpy).toHaveBeenCalledWith('deploymentCompleted', expect.any(Object))
    })

    it('should handle deployment errors', async () => {
      // Mock CDN upload to fail
      const mockCDN = hosting['cdnStorage'] as any
      mockCDN.upload.mockRejectedValueOnce(new Error('Upload failed'))
      
      await expect(hosting.deploy()).rejects.toThrow()
      
      const outputs = hosting.getOutputs()
      const failedDeployment = outputs.deploymentHistory[0]
      expect(failedDeployment.status).toBe('failed')
    })

    it('should prevent concurrent deployments', async () => {
      const promise1 = hosting.deploy()
      const promise2 = hosting.deploy()
      
      await expect(promise2).rejects.toThrow('Deployment already in progress')
      await promise1
    })
  })

  describe('rollback', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
      // Create multiple deployments
      await hosting.deploy()
      await hosting.deploy()
    })

    it('should rollback to previous version', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      const outputs = hosting.getOutputs()
      const previousVersion = outputs.deploymentHistory[1].version
      
      await hosting.rollback(previousVersion)
      
      expect(emitSpy).toHaveBeenCalledWith('rollbackStarted', { version: previousVersion })
      expect(emitSpy).toHaveBeenCalledWith('rollbackCompleted', { version: previousVersion })
      
      expect(outputs.currentDeployment?.version).toBe(previousVersion)
    })

    it('should handle rollback errors', async () => {
      await expect(hosting.rollback('v999')).rejects.toThrow('Deployment version v999 not found')
    })
  })

  describe('domain management', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
    })

    it('should update primary domain', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.updateDomain('newdomain.com')
      
      expect(emitSpy).toHaveBeenCalledWith('domainUpdated', { domain: 'newdomain.com' })
      
      const outputs = hosting.getOutputs()
      expect(outputs.primaryUrl).toBe('newdomain.com')
    })

    it('should add custom domains', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.addCustomDomain('blog.example.com')
      
      expect(emitSpy).toHaveBeenCalledWith('customDomainAdded', { domain: 'blog.example.com' })
      
      const config = hosting.getConfig()
      expect(config.customDomains).toContain('blog.example.com')
    })
  })

  describe('SSL management', () => {
    beforeEach(async () => {
      const configWithoutSSL = { ...mockConfig, ssl: undefined }
      await hosting.initialize(configWithoutSSL)
    })

    it('should enable auto SSL', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.enableSSL()
      
      expect(emitSpy).toHaveBeenCalledWith('sslEnabled', { type: 'auto' })
      
      const outputs = hosting.getOutputs()
      expect(outputs.capabilities.ssl).toBe(true)
    })

    it('should enable custom SSL', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      const certificate = { cert: 'CERT_CONTENT', key: 'KEY_CONTENT' }
      await hosting.enableSSL(certificate)
      
      expect(emitSpy).toHaveBeenCalledWith('sslEnabled', { type: 'custom' })
      
      const config = hosting.getConfig()
      expect(config.ssl?.certificate).toBe('custom')
      expect(config.ssl?.customCert).toBe('CERT_CONTENT')
    })
  })

  describe('configuration management', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
    })

    it('should add redirects', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.setRedirect('/old', '/new', 302)
      
      expect(emitSpy).toHaveBeenCalledWith('redirectAdded', {
        from: '/old',
        to: '/new',
        type: 302
      })
      
      const config = hosting.getConfig()
      expect(config.redirects).toContainEqual({
        from: '/old',
        to: '/new',
        type: 302
      })
    })

    it('should set custom headers', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      const headers = { 'Cache-Control': 'max-age=3600' }
      await hosting.setHeaders('/*.css', headers)
      
      expect(emitSpy).toHaveBeenCalledWith('headersUpdated', {
        path: '/*.css',
        headers
      })
    })

    it('should set error pages', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.setErrorPage('404', '/custom-404.html')
      
      expect(emitSpy).toHaveBeenCalledWith('errorPageSet', {
        code: '404',
        path: '/custom-404.html'
      })
    })
  })

  describe('metrics and analytics', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
    })

    it('should collect metrics periodically', async () => {
      const initialMetrics = hosting.getMetrics()
      
      // Fast-forward time
      vi.advanceTimersByTime(60000)
      
      const updatedMetrics = hosting.getMetrics()
      expect(updatedMetrics.views).toBeGreaterThan(initialMetrics.views)
      expect(updatedMetrics.visitors).toBeGreaterThan(initialMetrics.visitors)
      expect(updatedMetrics.bandwidth).toBeGreaterThan(initialMetrics.bandwidth)
    })

    it('should emit metrics updates', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      
      vi.advanceTimersByTime(60000)
      
      expect(emitSpy).toHaveBeenCalledWith('metricsUpdated', expect.objectContaining({
        views: expect.any(Number),
        visitors: expect.any(Number)
      }))
    })

    it('should collect analytics when enabled', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      
      vi.advanceTimersByTime(300000) // 5 minutes
      
      expect(emitSpy).toHaveBeenCalledWith('analyticsUpdated', expect.objectContaining({
        topPages: expect.any(Array),
        referrers: expect.any(Array),
        devices: expect.any(Object)
      }))
    })
  })

  describe('cache management', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
    })

    it('should purge entire cache', async () => {
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.purgeCache()
      
      expect(emitSpy).toHaveBeenCalledWith('cachePurged', { paths: undefined })
      
      const mockCDN = hosting['cdnStorage'] as any
      expect(mockCDN.invalidate).toHaveBeenCalledWith(['/*'])
    })

    it('should purge specific paths', async () => {
      const paths = ['/index.html', '/styles.css']
      await hosting.purgeCache(paths)
      
      const mockCDN = hosting['cdnStorage'] as any
      expect(mockCDN.invalidate).toHaveBeenCalledWith(paths)
    })
  })

  describe('deployment history', () => {
    beforeEach(async () => {
      await hosting.initialize(mockConfig)
      // Create multiple deployments
      for (let i = 0; i < 15; i++) {
        await hosting.deploy()
      }
    })

    it('should return limited deployment history', () => {
      const history = hosting.getDeploymentHistory(5)
      expect(history).toHaveLength(5)
      
      const fullHistory = hosting.getDeploymentHistory(100)
      expect(fullHistory).toHaveLength(16) // Initial + 15
    })

    it('should return deployments in reverse chronological order', () => {
      const history = hosting.getDeploymentHistory()
      expect(history[0].version).toMatch(/^v16$/)
      expect(history[1].version).toMatch(/^v15$/)
    })
  })

  describe('BaseConstruct implementation', () => {
    it('should return correct type', () => {
      expect(hosting.getType()).toBe(ConstructType.PATTERN)
    })

    it('should return correct level', () => {
      expect(hosting.getLevel()).toBe(ConstructLevel.L2)
    })

    it('should return configuration', async () => {
      await hosting.initialize(mockConfig)
      const config = hosting.getConfig()
      
      expect(config.name).toBe('test-site')
      expect(config.domain).toBe('example.com')
      expect(config.cdn.provider).toBe('cloudflare')
    })

    it('should handle destroy', async () => {
      await hosting.initialize(mockConfig)
      
      const emitSpy = vi.spyOn(hosting, 'emit')
      await hosting.destroy()
      
      expect(emitSpy).toHaveBeenCalledWith('destroyed', {})
    })
  })

  describe('factory function', () => {
    it('should create instance with factory function', () => {
      const instance = createStaticSiteHosting({
        name: 'factory-site'
      })
      
      expect(instance).toBeInstanceOf(StaticSiteHosting)
      expect(instance.getType()).toBe(ConstructType.PATTERN)
    })
  })

  describe('registry definition', () => {
    it('should have correct definition properties', () => {
      expect(staticSiteHostingDefinition.id).toBe('platform-l2-static-site-hosting')
      expect(staticSiteHostingDefinition.name).toBe('Static Site Hosting')
      expect(staticSiteHostingDefinition.type).toBe(ConstructType.PATTERN)
      expect(staticSiteHostingDefinition.level).toBe(ConstructLevel.L2)
      expect(staticSiteHostingDefinition.category).toBe('hosting')
    })

    it('should have correct capabilities', () => {
      expect(staticSiteHostingDefinition.capabilities).toContain('cdn-distribution')
      expect(staticSiteHostingDefinition.capabilities).toContain('ssl-tls')
      expect(staticSiteHostingDefinition.capabilities).toContain('custom-domains')
      expect(staticSiteHostingDefinition.capabilities).toContain('auto-deployment')
    })

    it('should have correct dependencies', () => {
      expect(staticSiteHostingDefinition.dependencies).toContain('platform-l1-cdn-storage')
      expect(staticSiteHostingDefinition.dependencies).toContain('platform-l1-rest-api-service')
      expect(staticSiteHostingDefinition.dependencies).toContain('platform-l1-managed-container')
    })

    it('should create instance from definition', () => {
      const instance = staticSiteHostingDefinition.createInstance({
        name: 'definition-site'
      })
      
      expect(instance).toBeInstanceOf(StaticSiteHosting)
    })
  })

  describe('edge cases', () => {
    it('should handle empty source files', async () => {
      await hosting.initialize(mockConfig)
      
      // Mock getSourceFiles to return empty array
      hosting['getSourceFiles'] = vi.fn().mockResolvedValue([])
      
      const deploymentId = await hosting.deploy()
      
      const outputs = hosting.getOutputs()
      expect(outputs.currentDeployment?.fileCount).toBe(0)
    })

    it('should handle build failures', async () => {
      await hosting.initialize(mockConfig)
      
      const mockContainer = hosting['buildContainer'] as any
      mockContainer.exec.mockRejectedValueOnce(new Error('Build failed'))
      
      await expect(hosting.deploy()).rejects.toThrow('Build failed')
    })
  })
})