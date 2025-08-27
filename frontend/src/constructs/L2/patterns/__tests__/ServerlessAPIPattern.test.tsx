/**
 * Tests for Serverless API Pattern L2 Pattern Construct
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ServerlessAPIPattern, createServerlessAPIPattern, serverlessAPIPatternDefinition } from '../ServerlessAPIPattern'
import { ConstructType, ConstructLevel } from '../../../types'

// Mock the L1 constructs
vi.mock('../../../L1/infrastructure', () => ({
  ManagedContainer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    restart: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn().mockResolvedValue('{"statusCode":200,"body":{"message":"Success"}}'),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      serviceId: 'api-123',
      baseUrl: 'https://api.example.com'
    }),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  EncryptedDatabase: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  AuthenticatedWebSocket: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  CDNStorage: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  SecureAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    verifyToken: vi.fn().mockResolvedValue({ valid: true }),
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

describe('ServerlessAPIPattern', () => {
  let api: ServerlessAPIPattern
  let mockConfig: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    mockConfig = {
      name: 'test-api',
      region: 'us-east-1',
      functions: [
        {
          name: 'hello-function',
          runtime: 'nodejs18',
          handler: 'index.handler',
          memory: 256,
          timeout: 30,
          environment: {
            NODE_ENV: 'production'
          },
          triggers: [
            {
              type: 'http',
              config: {
                path: '/hello',
                method: 'GET'
              }
            }
          ]
        },
        {
          name: 'process-queue',
          runtime: 'python3.11',
          handler: 'main.handler',
          memory: 512,
          timeout: 60,
          triggers: [
            {
              type: 'queue',
              config: {
                queue: 'processing-queue'
              }
            }
          ]
        }
      ],
      api: {
        routes: [
          {
            path: '/hello',
            method: 'GET',
            function: 'hello-function',
            auth: false,
            rateLimit: 100
          },
          {
            path: '/secure',
            method: 'POST',
            function: 'hello-function',
            auth: true,
            validation: {
              body: { type: 'object' }
            }
          }
        ],
        basePath: '/api/v1',
        stage: 'prod',
        throttle: {
          burstLimit: 5000,
          rateLimit: 2000
        }
      },
      database: {
        type: 'dynamodb',
        tables: [
          {
            name: 'users',
            partitionKey: 'userId',
            sortKey: 'createdAt'
          }
        ]
      },
      storage: {
        buckets: [
          {
            name: 'uploads',
            public: false,
            lifecycle: {
              rules: [
                {
                  expiration: { days: 30 }
                }
              ]
            }
          }
        ]
      },
      events: [
        {
          name: 'user-created',
          source: 'api',
          targets: ['process-queue']
        }
      ],
      monitoring: {
        tracing: true,
        logging: 'info',
        alarms: [
          {
            metric: 'error-rate',
            threshold: 5,
            action: 'notify'
          }
        ]
      },
      scaling: {
        minConcurrency: 1,
        maxConcurrency: 100,
        reservedConcurrency: 10
      }
    }
    
    api = new ServerlessAPIPattern()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with provided configuration', async () => {
      await api.initialize(mockConfig)
      
      const outputs = api.getOutputs()
      expect(outputs.status).toBe('active')
      expect(outputs.apiUrl).toBe('https://api.example.com')
      expect(outputs.functions).toHaveLength(2)
      expect(outputs.capabilities.database).toBe(true)
      expect(outputs.capabilities.storage).toBe(true)
      expect(outputs.capabilities.events).toBe(true)
      expect(outputs.capabilities.monitoring).toBe(true)
      expect(outputs.capabilities.scaling).toBe(true)
    })

    it('should handle minimal configuration', async () => {
      const minimalConfig = {
        name: 'minimal-api',
        functions: [
          {
            name: 'simple-function',
            runtime: 'nodejs18',
            handler: 'index.handler',
            memory: 128,
            timeout: 15
          }
        ]
      }
      
      await api.initialize(minimalConfig)
      
      const outputs = api.getOutputs()
      expect(outputs.status).toBe('active')
      expect(outputs.functions).toHaveLength(1)
      expect(outputs.capabilities.database).toBe(false)
      expect(outputs.capabilities.storage).toBe(false)
    })

    it('should emit initialized event', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      await api.initialize(mockConfig)
      
      expect(emitSpy).toHaveBeenCalledWith('initialized', expect.objectContaining({
        status: 'active',
        apiId: expect.any(String)
      }))
    })

    it('should deploy all functions', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      await api.initialize(mockConfig)
      
      expect(emitSpy).toHaveBeenCalledWith('functionDeployed', expect.objectContaining({
        name: 'hello-function',
        status: 'active'
      }))
      expect(emitSpy).toHaveBeenCalledWith('functionDeployed', expect.objectContaining({
        name: 'process-queue',
        status: 'active'
      }))
    })
  })

  describe('function management', () => {
    beforeEach(async () => {
      await api.initialize(mockConfig)
    })

    it('should invoke function successfully', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      const event = { test: 'data' }
      
      const result = await api.invokeFunction('hello-function', event)
      
      expect(emitSpy).toHaveBeenCalledWith('functionInvokeStart', {
        function: 'hello-function',
        event
      })
      expect(emitSpy).toHaveBeenCalledWith('functionInvokeComplete', expect.objectContaining({
        function: 'hello-function',
        result: expect.any(Object)
      }))
      expect(result).toEqual({ statusCode: 200, body: { message: 'Success' } })
    })

    it('should handle function invocation errors', async () => {
      const container = api['functionContainers'].get('hello-function') as any
      container.exec.mockRejectedValueOnce(new Error('Execution failed'))
      
      await expect(api.invokeFunction('hello-function', {}))
        .rejects.toThrow('Execution failed')
    })

    it('should deploy new function', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      const newFunction = {
        name: 'new-function',
        runtime: 'nodejs18' as const,
        handler: 'new.handler',
        memory: 256,
        timeout: 30
      }
      
      await api.deployNewFunction(newFunction)
      
      expect(emitSpy).toHaveBeenCalledWith('functionDeployStart', {
        function: 'new-function'
      })
      expect(emitSpy).toHaveBeenCalledWith('functionDeployComplete', {
        function: 'new-function'
      })
      
      const outputs = api.getOutputs()
      expect(outputs.functions).toHaveLength(3)
    })

    it('should update existing function', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      await api.updateFunction('hello-function', {
        memory: 512,
        environment: { UPDATED: 'true' }
      })
      
      expect(emitSpy).toHaveBeenCalledWith('functionUpdateStart', {
        function: 'hello-function'
      })
      expect(emitSpy).toHaveBeenCalledWith('functionUpdateComplete', {
        function: 'hello-function'
      })
    })

    it('should delete function', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      await api.deleteFunction('hello-function')
      
      expect(emitSpy).toHaveBeenCalledWith('functionDeleteStart', {
        function: 'hello-function'
      })
      expect(emitSpy).toHaveBeenCalledWith('functionDeleteComplete', {
        function: 'hello-function'
      })
      
      const outputs = api.getOutputs()
      expect(outputs.functions).toHaveLength(1)
    })

    it('should test function with event', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      const testEvent = { test: true }
      
      const result = await api.testFunction('hello-function', testEvent)
      
      expect(emitSpy).toHaveBeenCalledWith('functionTestStart', {
        function: 'hello-function'
      })
      expect(emitSpy).toHaveBeenCalledWith('functionTestComplete', expect.objectContaining({
        function: 'hello-function',
        result: expect.any(Object)
      }))
      expect(result).toBeDefined()
    })

    it('should prevent concurrent deployments', async () => {
      const newFunction1 = {
        name: 'func1',
        runtime: 'nodejs18' as const,
        handler: 'func1.handler',
        memory: 128,
        timeout: 15
      }
      const newFunction2 = {
        name: 'func2',
        runtime: 'nodejs18' as const,
        handler: 'func2.handler',
        memory: 128,
        timeout: 15
      }
      
      const promise1 = api.deployNewFunction(newFunction1)
      const promise2 = api.deployNewFunction(newFunction2)
      
      await expect(promise2).rejects.toThrow('Deployment already in progress')
      await promise1
    })
  })

  describe('metrics and monitoring', () => {
    beforeEach(async () => {
      await api.initialize(mockConfig)
    })

    it('should collect metrics periodically', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      
      // Invoke functions to generate metrics
      await api.invokeFunction('hello-function', {})
      await api.invokeFunction('hello-function', {})
      await api.invokeFunction('process-queue', {})
      
      // Fast-forward time
      vi.advanceTimersByTime(30000)
      
      expect(emitSpy).toHaveBeenCalledWith('metricsCollected', expect.objectContaining({
        totalInvocations: 3,
        totalErrors: 0,
        successRate: 100
      }))
    })

    it('should track function metrics', async () => {
      await api.invokeFunction('hello-function', {})
      await api.invokeFunction('hello-function', {})
      
      const metrics = api.getFunctionMetrics('hello-function')
      expect(metrics?.invocations).toBe(2)
      expect(metrics?.errors).toBe(0)
      expect(metrics?.duration).toBeGreaterThan(0)
    })

    it('should calculate costs', async () => {
      await api.invokeFunction('hello-function', {})
      
      const metrics = api.getFunctionMetrics('hello-function')
      expect(metrics?.cost).toBeGreaterThan(0)
    })

    it('should handle function errors in metrics', async () => {
      const container = api['functionContainers'].get('hello-function') as any
      container.exec.mockRejectedValueOnce(new Error('Function error'))
      
      try {
        await api.invokeFunction('hello-function', {})
      } catch {
        // Expected to fail - testing error metrics
      }
      
      const metrics = api.getFunctionMetrics('hello-function')
      expect(metrics?.errors).toBe(1)
      
      // Check success rate
      vi.advanceTimersByTime(30000)
      const allMetrics = api.getAllMetrics()
      expect(allMetrics.overall.successRate).toBeLessThan(100)
    })
  })

  describe('triggers', () => {
    beforeEach(async () => {
      await api.initialize(mockConfig)
    })

    it('should set up schedule triggers', async () => {
      const scheduleConfig = {
        ...mockConfig,
        functions: [{
          name: 'scheduled',
          runtime: 'nodejs18' as const,
          handler: 'scheduled.handler',
          memory: 128,
          timeout: 15,
          triggers: [{
            type: 'schedule' as const,
            config: { rate: 60000 } // 1 minute
          }]
        }]
      }
      
      const scheduledApi = new ServerlessAPIPattern()
      const emitSpy = vi.spyOn(scheduledApi, 'emit')
      await scheduledApi.initialize(scheduleConfig)
      
      // Fast-forward time
      vi.advanceTimersByTime(60000)
      
      expect(emitSpy).toHaveBeenCalledWith('functionInvokeStart', expect.objectContaining({
        function: 'scheduled'
      }))
    })

    it('should handle queue triggers', async () => {
      const emitSpy = vi.spyOn(api, 'emit')
      const eventBus = api['eventBus'] as any
      
      // Simulate queue message
      const handler = eventBus.on.mock.calls.find(
        (call: any) => call[0] === 'queue:processing-queue'
      )?.[1]
      
      if (handler) {
        await handler({ message: 'test' })
        
        expect(emitSpy).toHaveBeenCalledWith('functionInvokeStart', expect.objectContaining({
          function: 'process-queue'
        }))
      }
    })
  })

  describe('API routes', () => {
    beforeEach(async () => {
      await api.initialize(mockConfig)
    })

    it('should handle authenticated routes', async () => {
      const req = {
        headers: { authorization: 'Bearer token' },
        body: { data: 'test' },
        query: {}
      }
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }
      
      const route = mockConfig.api.routes.find((r: any) => r.auth)
      const handler = api['createRouteHandler'](route)
      
      await handler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalled()
    })

    it('should reject unauthenticated requests', async () => {
      const authService = api['authService'] as any
      authService.verifyToken.mockResolvedValueOnce(null)
      
      const req = {
        headers: {},
        body: {},
        query: {}
      }
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }
      
      const route = mockConfig.api.routes.find((r: any) => r.auth)
      const handler = api['createRouteHandler'](route)
      
      await handler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })
  })

  describe('BaseConstruct implementation', () => {
    it('should return correct type', () => {
      expect(api.getType()).toBe(ConstructType.PATTERN)
    })

    it('should return correct level', () => {
      expect(api.getLevel()).toBe(ConstructLevel.L2)
    })

    it('should return configuration', async () => {
      await api.initialize(mockConfig)
      const config = api.getConfig()
      
      expect(config.name).toBe('test-api')
      expect(config.functions).toHaveLength(2)
      expect(config.api?.routes).toHaveLength(2)
    })

    it('should handle destroy', async () => {
      await api.initialize(mockConfig)
      
      const emitSpy = vi.spyOn(api, 'emit')
      await api.destroy()
      
      expect(emitSpy).toHaveBeenCalledWith('destroyed', {})
    })
  })

  describe('factory function', () => {
    it('should create instance with factory function', () => {
      const instance = createServerlessAPIPattern({
        name: 'factory-api'
      })
      
      expect(instance).toBeInstanceOf(ServerlessAPIPattern)
      expect(instance.getType()).toBe(ConstructType.PATTERN)
    })
  })

  describe('registry definition', () => {
    it('should have correct definition properties', () => {
      expect(serverlessAPIPatternDefinition.id).toBe('platform-l2-serverless-api-pattern')
      expect(serverlessAPIPatternDefinition.name).toBe('Serverless API Pattern')
      expect(serverlessAPIPatternDefinition.type).toBe(ConstructType.PATTERN)
      expect(serverlessAPIPatternDefinition.level).toBe(ConstructLevel.L2)
      expect(serverlessAPIPatternDefinition.category).toBe('backend')
    })

    it('should have correct capabilities', () => {
      expect(serverlessAPIPatternDefinition.capabilities).toContain('serverless-functions')
      expect(serverlessAPIPatternDefinition.capabilities).toContain('api-gateway')
      expect(serverlessAPIPatternDefinition.capabilities).toContain('event-driven')
      expect(serverlessAPIPatternDefinition.capabilities).toContain('auto-scaling')
    })

    it('should have correct dependencies', () => {
      expect(serverlessAPIPatternDefinition.dependencies).toContain('platform-l1-managed-container')
      expect(serverlessAPIPatternDefinition.dependencies).toContain('platform-l1-rest-api-service')
      expect(serverlessAPIPatternDefinition.dependencies).toContain('platform-l1-encrypted-database')
    })

    it('should create instance from definition', () => {
      const instance = serverlessAPIPatternDefinition.createInstance({
        name: 'definition-api'
      })
      
      expect(instance).toBeInstanceOf(ServerlessAPIPattern)
    })
  })

  describe('edge cases', () => {
    it('should handle empty functions configuration', async () => {
      await api.initialize({
        name: 'empty-api',
        functions: []
      })
      
      const outputs = api.getOutputs()
      expect(outputs.status).toBe('active')
      expect(outputs.functions).toHaveLength(0)
    })

    it('should handle function not found errors', async () => {
      await api.initialize(mockConfig)
      
      await expect(api.invokeFunction('non-existent', {}))
        .rejects.toThrow('Function non-existent not found')
      
      await expect(api.updateFunction('non-existent', {}))
        .rejects.toThrow('Function non-existent not found')
    })

    it('should handle inactive function invocation', async () => {
      await api.initialize(mockConfig)
      
      const func = api.getOutputs().functions.find(f => f.name === 'hello-function')
      if (func) {
        func.status = 'error'
      }
      
      await expect(api.invokeFunction('hello-function', {}))
        .rejects.toThrow('Function hello-function is not active')
    })
  })
})