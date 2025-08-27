import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConstructCatalogSystem } from '../ConstructCatalogSystem'
import { ConstructLevel } from '../../../types'

// Mock L1 constructs
vi.mock('../../../L1/infrastructure', () => ({
  EncryptedDatabase: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      databaseId: 'test-db',
      status: 'healthy',
      encryptionEnabled: true
    }),
    query: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue({ id: 'test-id' }),
    update: vi.fn().mockResolvedValue({ success: true }),
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
    upload: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/file.yaml' }),
    download: vi.fn().mockResolvedValue(Buffer.from('test content')),
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
    request: vi.fn().mockResolvedValue({ data: { results: [] } }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  SecureAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      serviceId: 'test-auth',
      status: 'healthy',
      capabilities: { mfa: true, oauth: true }
    }),
    verifyToken: vi.fn().mockResolvedValue({ valid: true, userId: 'test-user' }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

describe('ConstructCatalogSystem', () => {
  let catalog: ConstructCatalogSystem

  beforeEach(() => {
    vi.clearAllMocks()
    catalog = new ConstructCatalogSystem()
  })

  it('should have correct definition', () => {
    expect(ConstructCatalogSystem.definition).toMatchObject({
      id: 'platform-l2-construct-catalog-system',
      name: 'Construct Catalog System',
      level: 'L2',
      description: expect.stringContaining('meta-construct')
    })
  })

  it('should initialize with basic features', async () => {
    await catalog.initialize({
      name: 'test-catalog',
      features: {
        versioning: true,
        dependencies: true,
        marketplace: false,
        analytics: true,
        reviews: false,
        certification: false
      }
    })

    const outputs = catalog.getOutputs()
    expect(outputs.name).toBe('test-catalog')
    expect(outputs.features.versioning).toBe(true)
    expect(outputs.features.marketplace).toBe(false)
    expect(outputs.statistics).toBeDefined()
  })

  it('should register the catalog itself', async () => {
    await catalog.initialize({
      name: 'self-referential-catalog',
      features: {
        versioning: true,
        dependencies: true
      }
    })

    // The catalog should register itself
    const outputs = catalog.getOutputs()
    expect(outputs.statistics.totalConstructs).toBeGreaterThanOrEqual(1)
  })

  it('should register new constructs', async () => {
    await catalog.initialize({
      name: 'test-catalog',
      features: {
        versioning: true
      }
    })

    const result = await catalog.registerConstruct({
      id: 'test-construct',
      name: 'Test Construct',
      level: ConstructLevel.L1,
      version: '1.0.0',
      description: 'A test construct',
      author: 'test-author',
      categories: ['test'],
      tags: ['test', 'example']
    })

    expect(result.success).toBe(true)
    expect(result.constructId).toBe('test-construct')
  })

  it('should search constructs', async () => {
    const mockQuery = vi.fn().mockResolvedValue([
      {
        id: 'search-result-1',
        name: 'Chart Component',
        level: ConstructLevel.L1,
        score: 0.9
      }
    ])

    await catalog.initialize({
      name: 'test-catalog',
      features: {
        versioning: true
      },
      searchConfig: {
        fuzzySearch: true,
        maxResults: 10
      }
    })

    // Override the database query method
    const database = catalog['database'] as any
    database.query = mockQuery

    const results = await catalog.searchConstructs('chart')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Chart Component')
    expect(results[0].score).toBe(0.9)
  })

  it('should handle marketplace features', async () => {
    await catalog.initialize({
      name: 'marketplace-catalog',
      features: {
        marketplace: true,
        analytics: true
      },
      marketplaceConfig: {
        currency: 'USD',
        paymentProviders: ['stripe'],
        revenueShare: 0.7,
        trialPeriod: 14
      }
    })

    const outputs = catalog.getOutputs()
    expect(outputs.features.marketplace).toBe(true)
    expect(outputs.marketplaceStats).toBeDefined()
    expect(outputs.marketplaceStats.totalRevenue).toBe(0)
  })

  it('should add and retrieve reviews', async () => {
    await catalog.initialize({
      name: 'review-catalog',
      features: {
        reviews: true,
        analytics: true
      }
    })

    const review = await catalog.addReview('test-construct', {
      userId: 'user123',
      userName: 'Test User',
      rating: 5,
      comment: 'Excellent construct!'
    })

    expect(review.success).toBe(true)
    expect(review.reviewId).toBeDefined()
  })

  it('should track analytics', async () => {
    await catalog.initialize({
      name: 'analytics-catalog',
      features: {
        analytics: true
      }
    })

    await catalog.trackEvent('construct-viewed', {
      constructId: 'test-construct',
      userId: 'user123'
    })

    const analytics = await catalog.getAnalytics('test-construct')
    expect(analytics.views).toBeGreaterThanOrEqual(0)
  })

  it('should handle certification workflow', async () => {
    await catalog.initialize({
      name: 'cert-catalog',
      features: {
        certification: true
      },
      certificationConfig: {
        levels: ['basic', 'advanced', 'enterprise'],
        automate: true,
        validityPeriod: 365
      }
    })

    const result = await catalog.submitForCertification('test-construct', {
      level: 'basic',
      tests: {
        security: true,
        performance: true,
        compatibility: true
      }
    })

    expect(result.status).toBeDefined()
    expect(['pending', 'certified', 'failed']).toContain(result.status)
  })

  it('should resolve dependencies', async () => {
    await catalog.initialize({
      name: 'dep-catalog',
      features: {
        dependencies: true,
        versioning: true
      }
    })

    const dependencies = await catalog.resolveDependencies('test-construct', {
      'other-construct': '^1.0.0',
      'another-construct': '~2.1.0'
    })

    expect(dependencies).toBeDefined()
    expect(Array.isArray(dependencies)).toBe(true)
  })

  it('should handle construct updates', async () => {
    await catalog.initialize({
      name: 'update-catalog',
      features: {
        versioning: true,
        dependencies: true
      }
    })

    const update = await catalog.updateConstruct('test-construct', {
      version: '1.1.0',
      description: 'Updated description',
      changelog: 'Added new features'
    })

    expect(update.success).toBe(true)
    expect(update.newVersion).toBe('1.1.0')
  })

  it('should provide filter capabilities', async () => {
    await catalog.initialize({
      name: 'filter-catalog',
      features: {
        versioning: true
      }
    })

    const mockQuery = vi.fn().mockResolvedValue([
      { id: 'ui-construct', level: ConstructLevel.L1, categories: ['ui'] },
      { id: 'infra-construct', level: ConstructLevel.L1, categories: ['infrastructure'] }
    ])

    const database = catalog['database'] as any
    database.query = mockQuery

    const filters = {
      levels: [ConstructLevel.L1],
      categories: ['ui'],
      certified: false
    }

    const results = await catalog.filterConstructs(filters)
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
  })

  it('should emit events for catalog operations', async () => {
    const mockEmit = vi.fn()
    catalog.emit = mockEmit

    await catalog.initialize({
      name: 'event-catalog',
      features: {
        versioning: true
      }
    })

    expect(mockEmit).toHaveBeenCalledWith('catalogInitialized', expect.objectContaining({
      name: 'event-catalog',
      features: expect.any(Object)
    }))

    await catalog.registerConstruct({
      id: 'new-construct',
      name: 'New Construct',
      level: ConstructLevel.L0,
      version: '1.0.0'
    })

    expect(mockEmit).toHaveBeenCalledWith('constructRegistered', expect.objectContaining({
      constructId: 'new-construct'
    }))
  })

  it('should clean up resources on destroy', async () => {
    await catalog.initialize({
      name: 'cleanup-catalog',
      features: {
        versioning: true,
        marketplace: true,
        analytics: true
      }
    })

    await catalog.destroy()

    // Verify all services were destroyed
    const database = catalog['database'] as any
    const storage = catalog['storage'] as any
    const apiService = catalog['apiService'] as any
    const authService = catalog['authService'] as any

    expect(database.destroy).toHaveBeenCalled()
    expect(storage.destroy).toHaveBeenCalled()
    expect(apiService.destroy).toHaveBeenCalled()
    expect(authService.destroy).toHaveBeenCalled()
  })
})