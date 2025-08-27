import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MultiProviderAbstraction } from '../MultiProviderAbstraction'
import { CloudProvider } from '../../../types'

// Mock L1 constructs
vi.mock('../../../L1/infrastructure', () => ({
  EncryptedDatabase: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      databaseId: 'test-db',
      status: 'healthy',
      provider: CloudProvider.LOCAL
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  CDNStorage: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      storageId: 'test-storage',
      bucketName: 'test-bucket',
      cdnUrl: 'https://cdn.example.com'
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      serviceId: 'test-api',
      apiUrl: 'https://api.example.com',
      status: 'healthy'
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  AuthenticatedWebSocket: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      connectionId: 'test-ws',
      state: 'connected'
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  SecureAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      serviceId: 'test-auth',
      status: 'healthy'
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

describe('MultiProviderAbstraction', () => {
  let abstraction: MultiProviderAbstraction

  beforeEach(() => {
    vi.clearAllMocks()
    abstraction = new MultiProviderAbstraction()
  })

  it('should have correct definition', () => {
    expect(MultiProviderAbstraction.definition).toMatchObject({
      id: 'platform-l2-multi-provider-abstraction',
      name: 'Multi-Provider Abstraction Pattern',
      level: 'L2',
      description: expect.stringContaining('multi-cloud abstraction')
    })
  })

  it('should initialize with primary provider', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      services: {
        database: { encryption: { enabled: true } },
        storage: { cdnEnabled: true },
        auth: { mfaRequired: false }
      }
    })

    const outputs = abstraction.getOutputs()
    expect(outputs.primaryProvider).toBe(CloudProvider.LOCAL)
    expect(outputs.services).toBeDefined()
    expect(outputs.health.status).toBe('healthy')
  })

  it('should support hybrid deployment', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      providerMapping: {
        database: CloudProvider.AWS,
        storage: CloudProvider.AWS,
        auth: CloudProvider.FIREBASE,
        api: CloudProvider.LOCAL,
        websocket: CloudProvider.LOCAL
      },
      services: {
        database: { encryption: { enabled: true } },
        storage: { cdnEnabled: true },
        auth: { mfaRequired: true }
      }
    })

    const outputs = abstraction.getOutputs()
    expect(outputs.providerMapping).toBeDefined()
    expect(outputs.providerMapping.auth).toBe(CloudProvider.FIREBASE)
    expect(outputs.providerMapping.storage).toBe(CloudProvider.AWS)
  })

  it('should switch providers', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      services: {
        database: { encryption: { enabled: true } }
      }
    })

    await abstraction.switchProvider(CloudProvider.FIREBASE)

    const outputs = abstraction.getOutputs()
    expect(outputs.primaryProvider).toBe(CloudProvider.FIREBASE)
  })

  it('should handle provider failover', async () => {
    const mockEmit = vi.fn()
    abstraction.emit = mockEmit

    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      fallbackProviders: [CloudProvider.FIREBASE, CloudProvider.AWS],
      healthCheck: {
        enabled: true,
        interval: 1000,
        timeout: 500,
        failureThreshold: 2
      },
      services: {
        database: { encryption: { enabled: true } }
      }
    })

    // Simulate provider failure
    const healthCheck = abstraction['checkProviderHealth'] as any
    vi.spyOn(abstraction as any, 'checkProviderHealth').mockResolvedValueOnce(false)
    
    // Trigger health check failure
    await abstraction['performHealthCheck']()

    expect(mockEmit).toHaveBeenCalledWith('providerFailover', expect.objectContaining({
      from: CloudProvider.LOCAL,
      to: CloudProvider.FIREBASE
    }))
  })

  it('should plan provider migration', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      services: {
        database: { encryption: { enabled: true } },
        storage: { cdnEnabled: true }
      }
    })

    const plan = await abstraction.planMigration(CloudProvider.AWS)

    expect(plan).toMatchObject({
      from: CloudProvider.LOCAL,
      to: CloudProvider.AWS,
      services: expect.arrayContaining(['database', 'storage']),
      estimatedDuration: expect.any(Number),
      steps: expect.any(Array)
    })
  })

  it('should track costs across providers', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.AWS,
      costTracking: {
        enabled: true,
        budgetLimit: 1000,
        alertThreshold: 0.8
      },
      services: {
        database: { encryption: { enabled: true } },
        storage: { cdnEnabled: true },
        api: { rateLimit: { enabled: true } }
      }
    })

    const costs = await abstraction.getCostSummary()

    expect(costs).toMatchObject({
      total: expect.any(Number),
      byProvider: expect.any(Object),
      byService: expect.any(Object),
      trend: expect.any(String),
      budgetStatus: expect.any(Object)
    })
  })

  it('should provide unified database operations', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      services: {
        database: { encryption: { enabled: true } }
      }
    })

    const db = abstraction.getService('database')
    expect(db).toBeDefined()
    expect(db.getOutputs().status).toBe('healthy')
  })

  it('should provide unified storage operations', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.AWS,
      services: {
        storage: { cdnEnabled: true, region: 'us-west-2' }
      }
    })

    const storage = abstraction.getService('storage')
    expect(storage).toBeDefined()
    expect(storage.getOutputs().cdnUrl).toBe('https://cdn.example.com')
  })

  it('should handle provider-specific configurations', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.FIREBASE,
      providerConfigs: {
        firebase: {
          projectId: 'test-project',
          region: 'us-central1'
        },
        aws: {
          region: 'us-west-2',
          profile: 'test-profile'
        }
      },
      services: {
        database: { encryption: { enabled: true } },
        auth: { mfaRequired: true }
      }
    })

    const outputs = abstraction.getOutputs()
    expect(outputs.activeConfigs.firebase).toBeDefined()
    expect(outputs.activeConfigs.firebase.projectId).toBe('test-project')
  })

  it('should emit events for provider operations', async () => {
    const mockEmit = vi.fn()
    abstraction.emit = mockEmit

    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      services: {
        database: { encryption: { enabled: true } }
      }
    })

    expect(mockEmit).toHaveBeenCalledWith('providerInitialized', expect.objectContaining({
      provider: CloudProvider.LOCAL,
      services: expect.any(Array)
    }))
  })

  it('should clean up resources on destroy', async () => {
    await abstraction.initialize({
      primaryProvider: CloudProvider.LOCAL,
      services: {
        database: { encryption: { enabled: true } },
        storage: { cdnEnabled: true },
        auth: { mfaRequired: false },
        api: { rateLimit: { enabled: true } },
        websocket: { authToken: 'test-token' }
      }
    })

    await abstraction.destroy()

    // Verify all services were destroyed
    const services = abstraction['services'] as any
    expect(services.database.destroy).toHaveBeenCalled()
    expect(services.storage.destroy).toHaveBeenCalled()
    expect(services.auth.destroy).toHaveBeenCalled()
    expect(services.api.destroy).toHaveBeenCalled()
    expect(services.websocket.destroy).toHaveBeenCalled()
  })
})