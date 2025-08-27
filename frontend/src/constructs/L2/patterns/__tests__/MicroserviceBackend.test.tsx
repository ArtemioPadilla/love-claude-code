/**
 * Tests for Microservice Backend L2 Pattern Construct
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MicroserviceBackend, createMicroserviceBackend, microserviceBackendDefinition } from '../MicroserviceBackend'
import { ConstructType, ConstructLevel } from '../../../types'

// Mock the L1 constructs
vi.mock('../../../L1/infrastructure', () => ({
  ManagedContainer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    scale: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn().mockResolvedValue('command output'),
    getLogs: vi.fn().mockResolvedValue(['log line 1', 'log line 2']),
    getOutputs: vi.fn().mockReturnValue({
      containerId: 'container-123',
      status: 'running',
      endpoints: ['http://localhost:3000']
    }),
    on: vi.fn(),
    emit: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined)
  })),
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      serviceId: 'api-123',
      baseUrl: 'http://api.example.com'
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
  SecureAuthService: vi.fn().mockImplementation(() => ({
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
    upload: vi.fn().mockResolvedValue('https://cdn.example.com/file'),
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

describe('MicroserviceBackend', () => {
  let backend: MicroserviceBackend
  let mockConfig: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockConfig = {
      name: 'test-backend',
      domain: 'test.example.com',
      services: [
        {
          name: 'auth-service',
          version: '1.0.0',
          port: 3001,
          replicas: 2,
          resources: { cpu: '500m', memory: '512Mi' },
          environment: { NODE_ENV: 'production' }
        },
        {
          name: 'api-service',
          version: '1.0.0',
          port: 3002,
          replicas: 3,
          resources: { cpu: '1000m', memory: '1Gi' },
          environment: { NODE_ENV: 'production' },
          healthCheck: {
            path: '/health',
            interval: 30000,
            timeout: 5000
          }
        }
      ],
      gateway: {
        routes: [
          {
            path: '/auth/*',
            service: 'auth-service',
            methods: ['POST', 'GET'],
            authentication: true
          },
          {
            path: '/api/*',
            service: 'api-service',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            rateLimit: 100
          }
        ],
        cors: {
          origins: ['https://example.com'],
          credentials: true
        },
        timeout: 30000,
        retries: 3
      },
      serviceMesh: {
        enabled: true,
        provider: 'istio',
        tracing: true,
        mtls: true,
        circuitBreaker: {
          threshold: 5,
          timeout: 60000
        }
      },
      database: {
        type: 'postgres',
        sharding: true
      },
      messaging: {
        type: 'kafka',
        topics: ['events', 'logs']
      },
      monitoring: {
        provider: 'prometheus',
        dashboards: ['services', 'gateway']
      },
      autoscaling: {
        enabled: true,
        minReplicas: 1,
        maxReplicas: 10,
        targetCPU: 70,
        targetMemory: 80
      }
    }
    
    backend = new MicroserviceBackend()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with provided configuration', async () => {
      await backend.initialize(mockConfig)
      
      const outputs = backend.getOutputs()
      expect(outputs.status).toBe('running')
      expect(outputs.apiGatewayUrl).toBe('http://api.example.com')
      expect(outputs.services).toHaveLength(2)
      expect(outputs.capabilities.serviceMesh).toBe(true)
      expect(outputs.capabilities.tracing).toBe(true)
      expect(outputs.capabilities.autoscaling).toBe(true)
      expect(outputs.capabilities.messaging).toBe(true)
    })

    it('should handle minimal configuration', async () => {
      const minimalConfig = {
        name: 'minimal-backend',
        services: [
          {
            name: 'service1',
            version: '1.0.0',
            port: 3000,
            replicas: 1,
            resources: { cpu: '100m', memory: '128Mi' },
            environment: {}
          }
        ],
        gateway: {
          routes: [
            {
              path: '/*',
              service: 'service1',
              methods: ['GET']
            }
          ],
          cors: { origins: ['*'], credentials: false },
          timeout: 30000,
          retries: 3
        }
      }
      
      await backend.initialize(minimalConfig)
      
      const outputs = backend.getOutputs()
      expect(outputs.status).toBe('running')
      expect(outputs.services).toHaveLength(1)
      expect(outputs.capabilities.serviceMesh).toBe(false)
      expect(outputs.capabilities.messaging).toBe(false)
    })

    it('should emit initialized event', async () => {
      const emitSpy = vi.spyOn(backend, 'emit')
      await backend.initialize(mockConfig)
      
      expect(emitSpy).toHaveBeenCalledWith('initialized', expect.objectContaining({
        status: 'running',
        backendId: expect.any(String)
      }))
    })
  })

  describe('service management', () => {
    beforeEach(async () => {
      await backend.initialize(mockConfig)
    })

    it('should deploy a new service', async () => {
      const newService = {
        name: 'new-service',
        version: '1.0.0',
        port: 3003,
        replicas: 1,
        resources: { cpu: '250m', memory: '256Mi' },
        environment: { NODE_ENV: 'production' }
      }
      
      const deploymentId = await backend.deployService(newService)
      
      expect(deploymentId).toMatch(/^deploy-\d+$/)
      
      const outputs = backend.getOutputs()
      expect(outputs.services).toHaveLength(3)
      expect(outputs.services.find(s => s.name === 'new-service')).toBeDefined()
    })

    it('should update existing service', async () => {
      const updatedService = {
        name: 'auth-service',
        version: '2.0.0',
        port: 3001,
        replicas: 4,
        resources: { cpu: '1000m', memory: '1Gi' },
        environment: { NODE_ENV: 'production', DEBUG: 'true' }
      }
      
      await backend.deployService(updatedService)
      
      const outputs = backend.getOutputs()
      expect(outputs.services).toHaveLength(2)
    })

    it('should scale a service', async () => {
      const emitSpy = vi.spyOn(backend, 'emit')
      await backend.scaleService('auth-service', 5)
      
      expect(emitSpy).toHaveBeenCalledWith('scalingStarted', {
        service: 'auth-service',
        replicas: 5
      })
      expect(emitSpy).toHaveBeenCalledWith('scalingCompleted', {
        service: 'auth-service',
        replicas: 5
      })
    })

    it('should stop a service', async () => {
      await backend.stopService('auth-service')
      
      const outputs = backend.getOutputs()
      const service = outputs.services.find(s => s.name === 'auth-service')
      expect(service?.status).toBe('stopped')
    })

    it('should restart a service', async () => {
      const emitSpy = vi.spyOn(backend, 'emit')
      await backend.restartService('auth-service')
      
      expect(emitSpy).toHaveBeenCalledWith('serviceRestarted', {
        service: 'auth-service'
      })
      
      const outputs = backend.getOutputs()
      const service = outputs.services.find(s => s.name === 'auth-service')
      expect(service?.status).toBe('running')
    })

    it('should handle service not found errors', async () => {
      await expect(backend.scaleService('non-existent', 5))
        .rejects.toThrow('Service non-existent not found')
    })
  })

  describe('service operations', () => {
    beforeEach(async () => {
      await backend.initialize(mockConfig)
    })

    it('should get service logs', async () => {
      const logs = await backend.getServiceLogs('auth-service', 50)
      
      expect(logs).toEqual(['log line 1', 'log line 2'])
    })

    it('should execute command in service', async () => {
      const result = await backend.executeCommand('auth-service', 'echo test')
      
      expect(result).toBe('command output')
    })

    it('should get service metrics', () => {
      const metrics = backend.getServiceMetrics('auth-service')
      
      expect(metrics).toBeDefined()
      expect(metrics).toHaveProperty('cpu')
      expect(metrics).toHaveProperty('memory')
      expect(metrics).toHaveProperty('requests')
    })

    it('should get all metrics', () => {
      const metrics = backend.getAllMetrics()
      
      expect(metrics).toHaveProperty('services')
      expect(metrics).toHaveProperty('overall')
      expect(metrics.services).toHaveLength(2)
    })
  })

  describe('configuration updates', () => {
    beforeEach(async () => {
      await backend.initialize(mockConfig)
    })

    it('should enable service mesh', async () => {
      const backend2 = new MicroserviceBackend()
      await backend2.initialize({
        ...mockConfig,
        serviceMesh: undefined
      })
      
      expect(backend2.getOutputs().capabilities.serviceMesh).toBe(false)
      
      await backend2.enableServiceMesh({
        enabled: true,
        provider: 'linkerd',
        tracing: true,
        mtls: false,
        circuitBreaker: {
          threshold: 3,
          timeout: 30000
        }
      })
      
      expect(backend2.getOutputs().capabilities.serviceMesh).toBe(true)
      expect(backend2.getOutputs().capabilities.tracing).toBe(true)
    })

    it('should enable autoscaling', async () => {
      const backend2 = new MicroserviceBackend()
      await backend2.initialize({
        ...mockConfig,
        autoscaling: undefined
      })
      
      expect(backend2.getOutputs().capabilities.autoscaling).toBe(false)
      
      await backend2.enableAutoscaling({
        enabled: true,
        minReplicas: 2,
        maxReplicas: 8,
        targetCPU: 75,
        targetMemory: 85
      })
      
      expect(backend2.getOutputs().capabilities.autoscaling).toBe(true)
    })
  })

  describe('BaseConstruct implementation', () => {
    it('should return correct type', () => {
      expect(backend.getType()).toBe(ConstructType.PATTERN)
    })

    it('should return correct level', () => {
      expect(backend.getLevel()).toBe(ConstructLevel.L2)
    })

    it('should return configuration', async () => {
      await backend.initialize(mockConfig)
      const config = backend.getConfig()
      
      expect(config.name).toBe('test-backend')
      expect(config.services).toHaveLength(2)
      expect(config.gateway.routes).toHaveLength(2)
    })

    it('should handle destroy', async () => {
      await backend.initialize(mockConfig)
      
      const emitSpy = vi.spyOn(backend, 'emit')
      await backend.destroy()
      
      expect(emitSpy).toHaveBeenCalledWith('destroyed', {})
    })
  })

  describe('factory function', () => {
    it('should create instance with factory function', () => {
      const instance = createMicroserviceBackend({
        name: 'factory-backend'
      })
      
      expect(instance).toBeInstanceOf(MicroserviceBackend)
      expect(instance.getType()).toBe(ConstructType.PATTERN)
    })
  })

  describe('registry definition', () => {
    it('should have correct definition properties', () => {
      expect(microserviceBackendDefinition.id).toBe('platform-l2-microservice-backend')
      expect(microserviceBackendDefinition.name).toBe('Microservice Backend')
      expect(microserviceBackendDefinition.type).toBe(ConstructType.PATTERN)
      expect(microserviceBackendDefinition.level).toBe(ConstructLevel.L2)
      expect(microserviceBackendDefinition.category).toBe('backend')
    })

    it('should have correct capabilities', () => {
      expect(microserviceBackendDefinition.capabilities).toContain('api-gateway')
      expect(microserviceBackendDefinition.capabilities).toContain('service-mesh')
      expect(microserviceBackendDefinition.capabilities).toContain('distributed-tracing')
      expect(microserviceBackendDefinition.capabilities).toContain('auto-scaling')
    })

    it('should have correct dependencies', () => {
      expect(microserviceBackendDefinition.dependencies).toContain('platform-l1-managed-container')
      expect(microserviceBackendDefinition.dependencies).toContain('platform-l1-rest-api-service')
      expect(microserviceBackendDefinition.dependencies).toContain('platform-l1-encrypted-database')
    })

    it('should create instance from definition', () => {
      const instance = microserviceBackendDefinition.createInstance({
        name: 'definition-backend'
      })
      
      expect(instance).toBeInstanceOf(MicroserviceBackend)
    })
  })

  describe('edge cases', () => {
    it('should handle deployment while another is in progress', async () => {
      await backend.initialize(mockConfig)
      
      // Start first deployment
      const promise1 = backend.deployService({
        name: 'service1',
        version: '1.0.0',
        port: 4000,
        replicas: 1,
        resources: { cpu: '100m', memory: '128Mi' },
        environment: {}
      })
      
      // Try second deployment immediately
      const promise2 = backend.deployService({
        name: 'service2',
        version: '1.0.0',
        port: 4001,
        replicas: 1,
        resources: { cpu: '100m', memory: '128Mi' },
        environment: {}
      })
      
      await expect(promise2).rejects.toThrow('Deployment already in progress')
      await promise1 // Let first deployment complete
    })

    it('should handle empty services configuration', async () => {
      await backend.initialize({
        name: 'empty-backend',
        services: [],
        gateway: {
          routes: [],
          cors: { origins: ['*'], credentials: false },
          timeout: 30000,
          retries: 3
        }
      })
      
      const outputs = backend.getOutputs()
      expect(outputs.status).toBe('running')
      expect(outputs.services).toHaveLength(0)
      expect(outputs.metrics.uptime).toBe(0)
    })
  })
})