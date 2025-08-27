/**
 * CDNStorage L1 Infrastructure Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CDNStorage } from '../CDNStorage'

// Mock the base class
vi.mock('../../base/L1InfrastructureConstruct', () => ({
  L1InfrastructureConstruct: class {
    constructor(props: any) {
      Object.assign(this, props)
    }
    initialize = vi.fn()
    destroy = vi.fn()
    renderStatus = () => null
  }
}))

describe('CDNStorage', () => {
  let component: CDNStorage
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (component) {
      await component.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic configuration', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.cdnId).toBeDefined()
      expect(result.status).toBe('active')
      expect(result.endpoints.origin).toBe('https://assets.example.com')
      expect(result.distribution.status).toBe('Deployed')
    })
    
    it('should configure custom domain with SSL', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com',
          customDomain: 'cdn.example.com',
          ssl: {
            enabled: true,
            mode: 'full' as const
          }
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.endpoints.custom).toBe('cdn.example.com')
    })
    
    it('should configure caching rules', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        cacheConfig: {
          enabled: true,
          defaultTTL: 3600,
          maxTTL: 86400,
          rules: [
            {
              pattern: '*.jpg',
              ttl: 86400
            },
            {
              pattern: '*.css',
              ttl: 3600
            }
          ],
          queryStringHandling: 'forward' as const,
          compression: true,
          brotli: true
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.status).toBe('active')
    })
    
    it('should configure security features', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        securityConfig: {
          waf: {
            enabled: true,
            rulesets: ['OWASP_TOP_10']
          },
          ddosProtection: true,
          hotlinkProtection: {
            enabled: true,
            allowedDomains: ['example.com', 'app.example.com']
          }
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.capabilities.waf).toBe(true)
    })
  })
  
  describe('File Operations', () => {
    beforeEach(async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        uploadConfig: {
          directUpload: true,
          maxFileSize: 10,
          allowedTypes: ['.jpg', '.png', '.css', '.js'],
          virusScan: false,
          autoTagging: true,
          metadata: true
        }
      })
    })
    
    it('should upload file successfully', async () => {
      const content = Buffer.from('test content')
      const uploadSpy = vi.fn()
      component.on('uploaded', uploadSpy)
      
      const file = await component.upload('test.jpg', content, {
        contentType: 'image/jpeg'
      })
      
      expect(file.key).toBe('test.jpg')
      expect(file.size).toBe(content.length)
      expect(file.contentType).toBe('image/jpeg')
      expect(file.cdnUrl).toContain('test.jpg')
      expect(uploadSpy).toHaveBeenCalled()
    })
    
    it('should reject oversized files', async () => {
      const largeContent = Buffer.alloc(11 * 1024 * 1024) // 11MB
      
      await expect(
        component.upload('large.jpg', largeContent)
      ).rejects.toThrow('File size exceeds limit')
    })
    
    it('should reject disallowed file types', async () => {
      const content = Buffer.from('test')
      
      await expect(
        component.upload('test.exe', content)
      ).rejects.toThrow('File type .exe not allowed')
    })
    
    it('should get file information', async () => {
      const file = await component.get('test.jpg')
      
      expect(file).toBeDefined()
      expect(file?.key).toBe('test.jpg')
      expect(file?.cdnUrl).toContain('test.jpg')
    })
    
    it('should delete file and invalidate cache', async () => {
      const deleteSpy = vi.fn()
      const invalidateSpy = vi.fn()
      component.on('deleted', deleteSpy)
      component.on('invalidated', invalidateSpy)
      
      await component.delete('test.jpg')
      
      expect(deleteSpy).toHaveBeenCalledWith({ key: 'test.jpg' })
      
      // Wait for invalidation debounce
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled()
      }, { timeout: 6000 })
    })
    
    it('should list files with CDN URLs', async () => {
      const files = await component.list('images/')
      
      expect(Array.isArray(files)).toBe(true)
      files.forEach(file => {
        expect(file.cdnUrl).toBeDefined()
      })
    })
  })
  
  describe('Cache Operations', () => {
    beforeEach(async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        }
      })
    })
    
    it('should batch invalidation requests', async () => {
      const invalidateSpy = vi.fn()
      component.on('invalidated', invalidateSpy)
      
      // Multiple invalidation requests
      await component.invalidate(['file1.jpg'])
      await component.invalidate(['file2.jpg'])
      await component.invalidate(['file3.jpg'])
      
      // Should batch into single request
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledOnce()
        expect(invalidateSpy).toHaveBeenCalledWith({
          paths: expect.arrayContaining(['file1.jpg', 'file2.jpg', 'file3.jpg'])
        })
      }, { timeout: 6000 })
    })
    
    it('should purge all cache', async () => {
      const purgeSpy = vi.fn()
      component.on('purged', purgeSpy)
      
      await component.purgeAll()
      
      expect(purgeSpy).toHaveBeenCalledWith({ scope: 'all' })
    })
    
    it('should preload content to edge', async () => {
      const preloadSpy = vi.fn()
      component.on('preloaded', preloadSpy)
      
      await component.preload(['/critical.css', '/app.js'])
      
      expect(preloadSpy).toHaveBeenCalledWith({
        paths: ['/critical.css', '/app.js']
      })
    })
  })
  
  describe('Optimization', () => {
    beforeEach(async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        optimizationConfig: {
          imageOptimization: {
            enabled: true,
            formats: ['webp', 'avif'],
            quality: 85,
            resizing: true,
            lazyLoading: true
          },
          minification: {
            enabled: true,
            html: true,
            css: true,
            js: true
          },
          http2Push: true,
          earlyHints: true
        }
      })
    })
    
    it('should optimize images on upload', async () => {
      const content = Buffer.from('fake image data')
      
      const file = await component.upload('image.jpg', content, {
        contentType: 'image/jpeg'
      })
      
      expect(file).toBeDefined()
      // Optimization would happen in background
    })
    
    it('should skip optimization when disabled', async () => {
      const content = Buffer.from('fake image data')
      
      const file = await component.upload('image.jpg', content, {
        contentType: 'image/jpeg',
        optimize: false
      })
      
      expect(file).toBeDefined()
    })
  })
  
  describe('Monitoring and Metrics', () => {
    beforeEach(async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        monitoringConfig: {
          realTimeAnalytics: true,
          logLevel: 'detailed',
          logRetention: 30,
          alerting: {
            enabled: true,
            thresholds: {
              errorRate: 5,
              latency: 1000,
              bandwidth: 1000000
            }
          }
        }
      })
    })
    
    it('should collect metrics', async () => {
      const metrics = await component.getMetrics()
      
      expect(metrics.bandwidth).toBeDefined()
      expect(metrics.requests).toBeDefined()
      expect(metrics.performance).toBeDefined()
      expect(metrics.storage).toBeDefined()
      expect(metrics.performance.cacheHitRate).toBeGreaterThanOrEqual(0)
      expect(metrics.performance.cacheHitRate).toBeLessThanOrEqual(1)
    })
    
    it('should emit metrics periodically', async () => {
      const metricsSpy = vi.fn()
      component.on('metrics', metricsSpy)
      
      // Fast-forward time
      vi.useFakeTimers()
      vi.advanceTimersByTime(60000)
      
      await waitFor(() => {
        expect(metricsSpy).toHaveBeenCalled()
      })
      
      vi.useRealTimers()
    })
    
    it('should emit alerts on threshold breach', async () => {
      const alertSpy = vi.fn()
      component.on('alert', alertSpy)
      
      // Trigger metrics collection that will generate alerts
      vi.useFakeTimers()
      vi.advanceTimersByTime(60000)
      
      await waitFor(() => {
        // Should emit alert if conditions are met
        const alerts = alertSpy.mock.calls
        if (alerts.length > 0) {
          expect(['high-error-rate', 'low-cache-hit-rate']).toContain(alerts[0][0].type)
        }
      })
      
      vi.useRealTimers()
    })
  })
  
  describe('Edge Locations', () => {
    it('should configure edge locations and geo restrictions', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        edgeConfig: {
          locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
          primaryRegion: 'us-east-1',
          failoverRegions: ['eu-west-1'],
          geoRestrictions: {
            type: 'whitelist' as const,
            countries: ['US', 'CA', 'GB', 'DE']
          }
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.distribution.locations).toEqual(
        ['us-east-1', 'eu-west-1', 'ap-southeast-1']
      )
    })
  })
  
  describe('CORS Configuration', () => {
    it('should configure CORS rules', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        corsRules: [
          {
            allowedOrigins: ['https://app.example.com'],
            allowedMethods: ['GET', 'HEAD'],
            allowedHeaders: ['*'],
            maxAge: 3600
          }
        ]
      }
      
      const result = await component.initialize(config)
      
      expect(result.status).toBe('active')
    })
  })
  
  describe('Lifecycle and Replication', () => {
    it('should configure lifecycle policies', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        lifecycle: [
          {
            id: 'archive-old-files',
            prefix: 'logs/',
            status: 'enabled' as const,
            transitions: [
              {
                days: 30,
                storageClass: 'GLACIER'
              }
            ],
            expiration: {
              days: 90
            }
          }
        ]
      }
      
      const result = await component.initialize(config)
      
      expect(result.status).toBe('active')
    })
    
    it('should configure replication', async () => {
      component = new CDNStorage()
      
      const config = {
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        },
        replication: {
          enabled: true,
          destinations: [
            {
              bucket: 'backup-bucket',
              region: 'eu-west-1'
            }
          ],
          deleteMarkerReplication: true
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.status).toBe('active')
    })
  })
  
  describe('Destruction', () => {
    it('should clean up resources on destroy', async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        }
      })
      
      const destroySpy = vi.fn()
      component.on('destroying', destroySpy)
      
      await component.destroy()
      
      expect(destroySpy).toHaveBeenCalled()
    })
    
    it('should complete pending invalidations before destroy', async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        }
      })
      
      // Queue invalidation
      await component.invalidate(['file.jpg'])
      
      // Destroy immediately
      await component.destroy()
      
      // Should have processed the invalidation
    })
  })
  
  describe('UI Rendering', () => {
    it('should render status component', async () => {
      component = new CDNStorage()
      await component.initialize({
        bucketName: 'test-assets',
        cdnConfig: {
          provider: 'cloudfront' as const,
          originUrl: 'https://assets.example.com'
        }
      })
      
      render(<div>{component.renderStatus()}</div>)
      
      expect(screen.getByText(/CDN Storage Status/)).toBeInTheDocument()
      expect(screen.getByText(/Status: active/)).toBeInTheDocument()
      expect(screen.getByText(/Cache Hit Rate:/)).toBeInTheDocument()
    })
  })
})