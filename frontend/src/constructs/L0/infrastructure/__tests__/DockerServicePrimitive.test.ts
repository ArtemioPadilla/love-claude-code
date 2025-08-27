import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DockerServicePrimitive } from '../DockerServicePrimitive'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent 
} from '../../../../test-utils/constructTestUtils'
import { DockerServiceFactory } from '../../../../test-utils/testFactories'
import { ConstructLevel } from '../../../types'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number = 0
  onopen: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.({ type: 'open' })
    }, 10)
  }

  send(data: string) {
    const parsed = JSON.parse(data)
    // Simulate response
    setTimeout(() => {
      this.onmessage?.({
        type: 'message',
        data: JSON.stringify({
          id: parsed.id,
          type: 'response',
          status: 'success',
          data: {}
        })
      })
    }, 20)
  }

  close() {
    this.readyState = 3
    this.onclose?.({ type: 'close' })
  }
}

global.WebSocket = MockWebSocket as any

describe('DockerServicePrimitive', () => {
  let harness: ConstructTestHarness<DockerServicePrimitive>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'docker-service',
      name: 'Docker Service Primitive',
      level: ConstructLevel.L0,
      category: 'infrastructure'
    })
    harness = new ConstructTestHarness(DockerServicePrimitive, metadata)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize and connect to Docker', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      expect(harness.construct.isConnected()).toBe(true)
      harness.expectEvent('initialized')
    })

    it('should emit docker:connected event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'docker:connected')
      await harness.initialize()
      
      await expect(promise).resolves.toBeDefined()
    })

    it('should handle connection failure', async () => {
      // Override WebSocket to simulate failure
      const OriginalWebSocket = global.WebSocket
      global.WebSocket = class FailingWebSocket {
        constructor() {
          setTimeout(() => {
            this.onerror?.({ type: 'error', message: 'Connection failed' })
          }, 10)
        }
        onopen: any = null
        onerror: any = null
        close() {}
      } as any

      await expect(harness.initialize()).rejects.toThrow('Failed to connect to Docker daemon')
      
      global.WebSocket = OriginalWebSocket
    })
  })

  describe('service management', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should create a service', async () => {
      const config = DockerServiceFactory.createWebService()
      
      const serviceId = await harness.construct.createService(config)

      expect(serviceId).toBeDefined()
      expect(typeof serviceId).toBe('string')
      harness.expectEvent('service:created', { id: serviceId, config })
    })

    it('should start a service', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      harness.clearEvents()

      await harness.construct.startService(serviceId)

      harness.expectEvent('service:started', { id: serviceId })
    })

    it('should stop a service', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      await harness.construct.startService(serviceId)
      harness.clearEvents()

      await harness.construct.stopService(serviceId)

      harness.expectEvent('service:stopped', { id: serviceId })
    })

    it('should remove a service', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      harness.clearEvents()

      await harness.construct.removeService(serviceId)

      harness.expectEvent('service:removed', { id: serviceId })
      
      // Should not be able to get removed service
      expect(() => harness.construct.getService(serviceId)).toThrow()
    })

    it('should list all services', async () => {
      const web = DockerServiceFactory.createWebService()
      const db = DockerServiceFactory.createDatabaseService()
      
      const webId = await harness.construct.createService(web)
      const dbId = await harness.construct.createService(db)

      const services = harness.construct.listServices()

      expect(services).toHaveLength(2)
      expect(services.map(s => s.id)).toContain(webId)
      expect(services.map(s => s.id)).toContain(dbId)
    })

    it('should get service info', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)

      const info = harness.construct.getService(serviceId)

      expect(info.id).toBe(serviceId)
      expect(info.config).toEqual(config)
      expect(info.status).toBe('created')
    })

    it('should update service configuration', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      harness.clearEvents()

      const updates = {
        environment: {
          ...config.environment,
          NEW_VAR: 'value'
        }
      }

      await harness.construct.updateService(serviceId, updates)

      const updated = harness.construct.getService(serviceId)
      expect(updated.config.environment.NEW_VAR).toBe('value')
      harness.expectEvent('service:updated', { id: serviceId, updates })
    })
  })

  describe('service lifecycle', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should restart a service', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      await harness.construct.startService(serviceId)
      harness.clearEvents()

      await harness.construct.restartService(serviceId)

      const events = harness.getEventsByName('service:stopped')
      expect(events).toHaveLength(1)
      harness.expectEvent('service:started', { id: serviceId })
    })

    it('should handle service dependencies', async () => {
      const db = DockerServiceFactory.createDatabaseService()
      const dbId = await harness.construct.createService(db)

      const api = DockerServiceFactory.createServiceConfig({
        name: 'api-service',
        image: 'node:18',
        environment: {
          DB_HOST: 'postgres-db'
        },
        dependsOn: [dbId]
      })

      const apiId = await harness.construct.createService(api)
      
      // Starting API should start DB first
      await harness.construct.startService(apiId)

      const dbInfo = harness.construct.getService(dbId)
      expect(dbInfo.status).toBe('running')
    })
  })

  describe('logs and monitoring', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should get service logs', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      await harness.construct.startService(serviceId)

      // Simulate log streaming
      const logs: string[] = []
      const unsubscribe = harness.construct.streamLogs(serviceId, (log) => {
        logs.push(log)
      })

      // Simulate some logs
      harness.construct['ws']?.onmessage?.({
        type: 'message',
        data: JSON.stringify({
          type: 'log',
          serviceId,
          data: 'Service started successfully'
        })
      } as any)

      expect(logs).toContain('Service started successfully')
      
      unsubscribe()
    })

    it('should get service stats', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      await harness.construct.startService(serviceId)

      const stats = await harness.construct.getStats(serviceId)

      expect(stats).toHaveProperty('cpu')
      expect(stats).toHaveProperty('memory')
      expect(stats).toHaveProperty('network')
    })

    it('should monitor health checks', async () => {
      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)
      await harness.construct.startService(serviceId)

      const health = await harness.construct.checkHealth(serviceId)

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('checks')
    })
  })

  describe('networking', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should create a network', async () => {
      const networkId = await harness.construct.createNetwork({
        name: 'test-network',
        driver: 'bridge'
      })

      expect(networkId).toBeDefined()
      harness.expectEvent('network:created', { id: networkId })
    })

    it('should connect service to network', async () => {
      const networkId = await harness.construct.createNetwork({
        name: 'app-network',
        driver: 'bridge'
      })

      const config = DockerServiceFactory.createWebService()
      const serviceId = await harness.construct.createService(config)

      await harness.construct.connectToNetwork(serviceId, networkId)

      const service = harness.construct.getService(serviceId)
      expect(service.config.networks).toContain(networkId)
    })

    it('should list networks', async () => {
      await harness.construct.createNetwork({ name: 'net1', driver: 'bridge' })
      await harness.construct.createNetwork({ name: 'net2', driver: 'bridge' })

      const networks = harness.construct.listNetworks()

      expect(networks).toHaveLength(2)
      expect(networks.map(n => n.name)).toContain('net1')
      expect(networks.map(n => n.name)).toContain('net2')
    })
  })

  describe('volumes', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should create a volume', async () => {
      const volumeId = await harness.construct.createVolume({
        name: 'data-volume',
        driver: 'local'
      })

      expect(volumeId).toBeDefined()
      harness.expectEvent('volume:created', { id: volumeId })
    })

    it('should attach volume to service', async () => {
      const volumeId = await harness.construct.createVolume({
        name: 'db-data',
        driver: 'local'
      })

      const config = DockerServiceFactory.createDatabaseService()
      const serviceId = await harness.construct.createService({
        ...config,
        volumes: [
          { source: volumeId, target: '/var/lib/postgresql/data', type: 'volume' }
        ]
      })

      const service = harness.construct.getService(serviceId)
      expect(service.config.volumes[0].source).toBe(volumeId)
    })
  })

  describe('compose operations', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should deploy from compose config', async () => {
      const composeConfig = {
        version: '3.8',
        services: {
          web: DockerServiceFactory.createWebService(),
          db: DockerServiceFactory.createDatabaseService()
        },
        networks: {
          default: { driver: 'bridge' }
        }
      }

      const deployment = await harness.construct.deployCompose(composeConfig)

      expect(deployment.services).toHaveLength(2)
      expect(deployment.networks).toHaveLength(1)
      harness.expectEvent('compose:deployed', { services: 2, networks: 1 })
    })

    it('should export to compose format', async () => {
      const webId = await harness.construct.createService(
        DockerServiceFactory.createWebService()
      )
      const dbId = await harness.construct.createService(
        DockerServiceFactory.createDatabaseService()
      )

      const compose = harness.construct.exportToCompose([webId, dbId])

      expect(compose.version).toBe('3.8')
      expect(compose.services).toHaveProperty('web-service')
      expect(compose.services).toHaveProperty('postgres-db')
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate empty state', async () => {
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate services', async () => {
      await harness.construct.createService(DockerServiceFactory.createWebService())
      await harness.construct.createService(DockerServiceFactory.createDatabaseService())

      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
    })

    it('should detect invalid service configurations', async () => {
      const invalidConfig = {
        name: 'invalid',
        image: '', // Empty image
        ports: [{ container: -1, host: 80 }] // Invalid port
      }

      await expect(harness.construct.createService(invalidConfig as any))
        .rejects.toThrow()
    })
  })

  describe('disposal', () => {
    it('should stop all services and close connection', async () => {
      await harness.initialize()
      
      const webId = await harness.construct.createService(
        DockerServiceFactory.createWebService()
      )
      await harness.construct.startService(webId)

      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      expect(harness.construct.isConnected()).toBe(false)
      harness.expectEvent('disposed')
    })
  })
})