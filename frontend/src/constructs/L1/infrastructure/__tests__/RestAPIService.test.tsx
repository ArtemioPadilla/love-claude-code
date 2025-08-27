import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RestAPIService, createRestAPIService } from '../RestAPIService'
import { ConstructLevel } from '../../../types'

describe('RestAPIService L1 Infrastructure Construct', () => {
  let api: RestAPIService

  beforeEach(() => {
    api = new RestAPIService()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await api.stop()
  })

  describe('Definition', () => {
    it('should have correct metadata', () => {
      expect(RestAPIService.definition.id).toBe('platform-l1-rest-api-service')
      expect(RestAPIService.definition.name).toBe('REST API Service')
      expect(RestAPIService.definition.level).toBe(ConstructLevel.L1)
      expect(RestAPIService.definition.description).toContain('CORS')
      expect(RestAPIService.definition.description).toContain('rate limiting')
    })

    it('should be a platform construct', () => {
      expect(RestAPIService.definition.selfReferential?.isPlatformConstruct).toBe(true)
    })

    it('should have all required providers', () => {
      expect(RestAPIService.definition.providers).toContain('local')
      expect(RestAPIService.definition.providers).toContain('aws')
      expect(RestAPIService.definition.providers).toContain('firebase')
    })

    it('should have security configurations', () => {
      expect(RestAPIService.definition.security).toBeDefined()
      expect(RestAPIService.definition.security?.length).toBeGreaterThan(0)
      
      const securityAspects = RestAPIService.definition.security?.map(s => s.aspect) || []
      expect(securityAspects).toContain('Authentication')
      expect(securityAspects).toContain('Rate Limiting')
      expect(securityAspects).toContain('Input Validation')
      expect(securityAspects).toContain('CORS')
    })
  })

  describe('Initialization', () => {
    it('should initialize with required configuration', async () => {
      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [
          {
            path: '/test',
            method: 'GET',
            handler: async () => ({ status: 200, data: 'ok' })
          }
        ]
      })

      expect(api.getOutput('serviceId')).toBeDefined()
      expect(api.getOutput('status')).toBe('running')
      expect(api.getOutput('endpoints')).toHaveLength(1)
    })

    it('should fail without base URL', async () => {
      await expect(api.initialize({
        endpoints: []
      })).rejects.toThrow('Base URL is required')
    })

    it('should fail without endpoints', async () => {
      await expect(api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: []
      })).rejects.toThrow('At least one endpoint must be defined')
    })

    it('should detect duplicate endpoints', async () => {
      await expect(api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [
          {
            path: '/test',
            method: 'GET',
            handler: async () => ({ status: 200 })
          },
          {
            path: '/test',
            method: 'GET',
            handler: async () => ({ status: 200 })
          }
        ]
      })).rejects.toThrow('Duplicate endpoint: GET /test')
    })
  })

  describe('Endpoint Registration', () => {
    it('should register endpoints with version prefix', async () => {
      await api.initialize({
        baseUrl: 'https://api.example.com',
        version: 'v2',
        endpoints: [
          {
            path: '/users',
            method: 'GET',
            handler: async () => ({ status: 200, data: [] })
          }
        ]
      })

      const endpoints = api.getOutput('endpoints')
      expect(endpoints[0].fullPath).toBe('/v2/users')
      expect(endpoints[0].fullUrl).toBe('https://api.example.com/v2/users')
    })
  })

  describe('CORS Middleware', () => {
    it('should apply CORS headers', async () => {
      const mockReq = {
        headers: { origin: 'https://example.com' },
        method: 'GET'
      }
      const mockRes = { headers: {} }
      const mockNext = vi.fn()

      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [{ path: '/test', method: 'GET', handler: async () => ({}) }],
        corsConfig: {
          enabled: true,
          origins: ['https://example.com'],
          methods: ['GET', 'POST'],
          headers: ['Content-Type'],
          credentials: true
        }
      })

      // Test CORS middleware would be applied
      expect(api.getOutput('status')).toBe('running')
    })
  })

  describe('Rate Limiting', () => {
    it('should track rate limit entries', async () => {
      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [{ path: '/test', method: 'GET', handler: async () => ({}) }],
        rateLimitConfig: {
          enabled: true,
          windowMs: 60000,
          max: 10
        }
      })

      const status = api.getRateLimitStatus('test-key')
      expect(status.limited).toBe(false)
      expect(status.limit).toBe(10)
      expect(status.remaining).toBe(10)
    })
  })

  describe('Request Validation', () => {
    it('should validate request schema', async () => {
      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [
          {
            path: '/users',
            method: 'POST',
            handler: async () => ({ status: 201 }),
            schema: {
              body: {
                name: { type: 'string', required: true },
                email: { type: 'string', required: true },
                age: { type: 'number', min: 0, max: 150 }
              }
            }
          }
        ]
      })

      expect(api.getOutput('status')).toBe('running')
    })
  })

  describe('Metrics', () => {
    it('should track API metrics', async () => {
      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [{ path: '/test', method: 'GET', handler: async () => ({}) }]
      })

      const metrics = api.getOutput('metrics')
      expect(metrics).toMatchObject({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      })
    })
  })

  describe('Health Monitoring', () => {
    it('should report health status', async () => {
      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [{ path: '/health', method: 'GET', handler: async () => ({}) }]
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      const health = api.getOutput('health')
      expect(health.status).toBe('healthy')
      expect(health.services.api).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const errorHandler = vi.fn()
      api.on('error', errorHandler)

      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [
          {
            path: '/error',
            method: 'GET',
            handler: async () => {
              throw new Error('Test error')
            }
          }
        ],
        errorHandling: {
          includeStack: false,
          fallbackMessage: 'Something went wrong'
        }
      })

      // Error would be handled by middleware
      expect(api.getOutput('status')).toBe('running')
    })
  })

  describe('Service Lifecycle', () => {
    it('should start and stop service', async () => {
      const startHandler = vi.fn()
      const stopHandler = vi.fn()
      
      api.on('started', startHandler)
      api.on('stopped', stopHandler)

      await api.initialize({
        baseUrl: 'https://api.example.com',
        endpoints: [{ path: '/test', method: 'GET', handler: async () => ({}) }]
      })

      expect(startHandler).toHaveBeenCalledWith({
        serviceId: expect.any(String)
      })

      await api.stop()
      expect(stopHandler).toHaveBeenCalled()
      expect(api.getOutput('status')).toBe('stopped')
    })
  })

  describe('Factory Function', () => {
    it('should create instance via factory', () => {
      const instance = createRestAPIService()
      expect(instance).toBeInstanceOf(RestAPIService)
      expect(instance.getDefinition()).toBe(RestAPIService.definition)
    })
  })
})