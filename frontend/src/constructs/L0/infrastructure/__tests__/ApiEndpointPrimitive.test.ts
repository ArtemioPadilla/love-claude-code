import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiEndpointPrimitive, HttpMethod } from '../ApiEndpointPrimitive'

describe('L0: ApiEndpointPrimitive', () => {
  let construct: ApiEndpointPrimitive

  beforeEach(() => {
    construct = new ApiEndpointPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required inputs', async () => {
      const handler = vi.fn()
      
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler
      })
      
      expect(construct.metadata.id).toBe('platform-l0-api-endpoint-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default port if not provided', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      expect(construct.getInput('port')).toBe(3000)
    })

    it('should accept custom port', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'POST',
        handler: vi.fn(),
        port: 8080
      })
      
      expect(construct.getInput('port')).toBe(8080)
    })

    it('should accept all HTTP methods', async () => {
      const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      
      for (const method of methods) {
        const endpoint = new ApiEndpointPrimitive()
        await endpoint.initialize({
          path: '/api/test',
          method,
          handler: vi.fn()
        })
        
        expect(endpoint.getInput('method')).toBe(method)
      }
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(25)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Deployment', () => {
    it('should deploy successfully with all required inputs', async () => {
      await construct.initialize({
        path: '/api/users',
        method: 'GET',
        handler: async () => ({ users: [] })
      })
      
      await expect(construct.deploy()).resolves.not.toThrow()
      
      const outputs = construct.getOutputs()
      expect(outputs.endpointId).toBeDefined()
      expect(outputs.endpointId).toMatch(/^endpoint-\d+$/)
      expect(outputs.url).toBe('http://localhost:3000/api/users')
      expect(outputs.requestCount).toBe(0)
    })

    it('should fail deployment without path', async () => {
      await construct.initialize({
        method: 'GET',
        handler: vi.fn()
      })
      
      await expect(construct.deploy()).rejects.toThrow('Path is required')
    })

    it('should fail deployment without method', async () => {
      await construct.initialize({
        path: '/api/test',
        handler: vi.fn()
      })
      
      await expect(construct.deploy()).rejects.toThrow('Method is required')
    })

    it('should fail deployment without handler', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET'
      })
      
      await expect(construct.deploy()).rejects.toThrow('Handler is required')
    })

    it('should use custom port in URL', async () => {
      await construct.initialize({
        path: '/api/custom',
        method: 'POST',
        handler: vi.fn(),
        port: 8080
      })
      
      await construct.deploy()
      
      expect(construct.getOutputs().url).toBe('http://localhost:8080/api/custom')
    })
  })

  describe('Request Handling', () => {
    const handler = vi.fn()

    beforeEach(async () => {
      handler.mockClear()
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler
      })
      await construct.deploy()
    })

    it('should handle matching requests', async () => {
      handler.mockResolvedValue({ message: 'Success' })
      
      const response = await construct.handleRequest({
        method: 'GET',
        path: '/api/test',
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'Success' })
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should reject requests before deployment', async () => {
      const undeployed = new ApiEndpointPrimitive()
      await undeployed.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      await expect(undeployed.handleRequest({
        method: 'GET',
        path: '/api/test',
        headers: {},
        query: {}
      })).rejects.toThrow('Endpoint not deployed')
    })

    it('should return 405 for wrong method', async () => {
      const response = await construct.handleRequest({
        method: 'POST',
        path: '/api/test',
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(405)
      expect(response.body).toEqual({ error: 'Method not allowed' })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should return 404 for wrong path', async () => {
      const response = await construct.handleRequest({
        method: 'GET',
        path: '/api/wrong',
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Not found' })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should pass request to handler', async () => {
      handler.mockResolvedValue({ ok: true })
      
      const request = {
        method: 'GET' as HttpMethod,
        path: '/api/test',
        headers: { 'x-custom': 'value' },
        query: { page: '1' },
        body: null
      }
      
      await construct.handleRequest(request)
      
      expect(handler).toHaveBeenCalledWith(request)
    })

    it('should handle handler errors', async () => {
      handler.mockRejectedValue(new Error('Handler failed'))
      
      const response = await construct.handleRequest({
        method: 'GET',
        path: '/api/test',
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Internal server error' })
    })

    it('should track request count', async () => {
      handler.mockResolvedValue({})
      
      for (let i = 0; i < 5; i++) {
        await construct.handleRequest({
          method: 'GET',
          path: '/api/test',
          headers: {},
          query: {}
        })
      }
      
      expect(construct.getOutputs().requestCount).toBe(5)
    })

    it('should track last request info', async () => {
      handler.mockResolvedValue({})
      
      await construct.handleRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'user-agent': 'test' },
        query: {},
        body: { data: 'test' }
      })
      
      const lastRequest = construct.getOutputs().lastRequest
      expect(lastRequest).toBeDefined()
      expect(lastRequest.method).toBe('GET')
      expect(lastRequest.path).toBe('/api/test')
      expect(lastRequest.headers).toEqual({ 'user-agent': 'test' })
      expect(lastRequest.hasBody).toBe(true)
      expect(lastRequest.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Request Body Handling', () => {
    it('should handle POST with body', async () => {
      const handler = vi.fn(async (req) => ({
        received: req.body
      }))
      
      await construct.initialize({
        path: '/api/users',
        method: 'POST',
        handler
      })
      await construct.deploy()
      
      const response = await construct.handleRequest({
        method: 'POST',
        path: '/api/users',
        headers: {},
        query: {},
        body: { name: 'John', email: 'john@example.com' }
      })
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        received: { name: 'John', email: 'john@example.com' }
      })
    })

    it('should handle PUT with body', async () => {
      const handler = vi.fn(async (req) => ({
        updated: req.body
      }))
      
      await construct.initialize({
        path: '/api/users/123',
        method: 'PUT',
        handler
      })
      await construct.deploy()
      
      const response = await construct.handleRequest({
        method: 'PUT',
        path: '/api/users/123',
        headers: {},
        query: {},
        body: { name: 'Jane' }
      })
      
      expect(response.body).toEqual({
        updated: { name: 'Jane' }
      })
    })
  })

  describe('Statistics and Utilities', () => {
    beforeEach(async () => {
      await construct.initialize({
        path: '/api/stats',
        method: 'GET',
        handler: async () => ({ ok: true })
      })
      await construct.deploy()
    })

    it('should provide endpoint statistics', async () => {
      const stats = construct.getStats()
      
      expect(stats.endpointId).toMatch(/^endpoint-\d+$/)
      expect(stats.path).toBe('/api/stats')
      expect(stats.method).toBe('GET')
      expect(stats.requestCount).toBe(0)
      expect(stats.lastRequest).toBeUndefined()
      expect(stats.isDeployed).toBe(true)
    })

    it('should reset statistics', async () => {
      // Make some requests
      for (let i = 0; i < 3; i++) {
        await construct.handleRequest({
          method: 'GET',
          path: '/api/stats',
          headers: {},
          query: {}
        })
      }
      
      expect(construct.getStats().requestCount).toBe(3)
      expect(construct.getStats().lastRequest).toBeDefined()
      
      construct.resetStats()
      
      expect(construct.getStats().requestCount).toBe(0)
      expect(construct.getStats().lastRequest).toBeUndefined()
    })

    it('should check if endpoint matches request', () => {
      expect(construct.matches('GET', '/api/stats')).toBe(true)
      expect(construct.matches('POST', '/api/stats')).toBe(false)
      expect(construct.matches('GET', '/api/other')).toBe(false)
    })
  })

  describe('Test Helper - makeRequest', () => {
    it('should make simulated requests', async () => {
      const handler = vi.fn(async (req) => ({
        method: req.method,
        body: req.body,
        query: req.query
      }))
      
      await construct.initialize({
        path: '/api/echo',
        method: 'POST',
        handler
      })
      await construct.deploy()
      
      const response = await construct.makeRequest('POST', '/api/echo', {
        body: { test: true },
        headers: { 'content-type': 'application/json' },
        query: { debug: 'true' }
      })
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        method: 'POST',
        body: { test: true },
        query: { debug: 'true' }
      })
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: vi.fn()
      })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should have no input validation', async () => {
      const handler = vi.fn(async () => ({ ok: true }))
      
      await construct.initialize({
        path: '/api/test',
        method: 'POST',
        handler
      })
      await construct.deploy()
      
      // Should accept any input without validation
      const invalidInputs = [
        null,
        undefined,
        '',
        [],
        {},
        12345,
        true,
        false
      ]
      
      for (const body of invalidInputs) {
        const response = await construct.handleRequest({
          method: 'POST',
          path: '/api/test',
          headers: {},
          query: {},
          body
        })
        
        expect(response.status).toBe(200)
      }
    })

    it('should have no rate limiting', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: async () => ({ ok: true })
      })
      await construct.deploy()
      
      // Should handle unlimited requests
      const promises = []
      for (let i = 0; i < 1000; i++) {
        promises.push(construct.handleRequest({
          method: 'GET',
          path: '/api/test',
          headers: {},
          query: {}
        }))
      }
      
      const responses = await Promise.all(promises)
      expect(responses).toHaveLength(1000)
      expect(responses.every(r => r.status === 200)).toBe(true)
    })

    it('should have no CORS handling', async () => {
      await construct.initialize({
        path: '/api/test',
        method: 'GET',
        handler: async () => ({ ok: true })
      })
      await construct.deploy()
      
      const response = await construct.handleRequest({
        method: 'GET',
        path: '/api/test',
        headers: { origin: 'http://evil.com' },
        query: {}
      })
      
      // No CORS headers added
      expect(response.headers).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle paths with parameters (no parsing)', async () => {
      await construct.initialize({
        path: '/api/users/:id',
        method: 'GET',
        handler: async () => ({ user: 'test' })
      })
      await construct.deploy()
      
      // L0 does exact path matching only
      const response1 = await construct.handleRequest({
        method: 'GET',
        path: '/api/users/123',
        headers: {},
        query: {}
      })
      expect(response1.status).toBe(404)
      
      // Must match exactly
      const response2 = await construct.handleRequest({
        method: 'GET',
        path: '/api/users/:id',
        headers: {},
        query: {}
      })
      expect(response2.status).toBe(200)
    })

    it('should handle empty responses', async () => {
      await construct.initialize({
        path: '/api/empty',
        method: 'GET',
        handler: async () => undefined
      })
      await construct.deploy()
      
      const response = await construct.handleRequest({
        method: 'GET',
        path: '/api/empty',
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(200)
      expect(response.body).toBeUndefined()
    })

    it('should handle synchronous handlers', async () => {
      await construct.initialize({
        path: '/api/sync',
        method: 'GET',
        handler: (() => ({ sync: true })) as any // Sync function
      })
      await construct.deploy()
      
      const response = await construct.handleRequest({
        method: 'GET',
        path: '/api/sync',
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ sync: true })
    })

    it('should handle very long paths', async () => {
      const longPath = '/api/' + 'a'.repeat(1000)
      
      await construct.initialize({
        path: longPath,
        method: 'GET',
        handler: async () => ({ ok: true })
      })
      await construct.deploy()
      
      const response = await construct.handleRequest({
        method: 'GET',
        path: longPath,
        headers: {},
        query: {}
      })
      
      expect(response.status).toBe(200)
    })
  })
})