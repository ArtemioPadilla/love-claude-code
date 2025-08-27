import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoveClaudeCodePlatform } from '../LoveClaudeCodePlatform'
import { ConstructLevel, CloudProvider } from '../../../types'

// Mock L3 applications
vi.mock('../LoveClaudeCodeFrontend', () => ({
  LoveClaudeCodeFrontend: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      name: 'test-frontend',
      url: 'http://localhost:3000',
      status: 'running'
    }),
    build: vi.fn().mockResolvedValue({ success: true }),
    deploy: vi.fn().mockResolvedValue({ url: 'https://app.example.com' }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

vi.mock('../LoveClaudeCodeBackend', () => ({
  LoveClaudeCodeBackend: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      apiUrl: 'http://localhost:3001',
      status: 'running'
    }),
    build: vi.fn().mockResolvedValue({ success: true }),
    deploy: vi.fn().mockResolvedValue({ apiUrl: 'https://api.example.com' }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

vi.mock('../LoveClaudeCodeMCPServer', () => ({
  LoveClaudeCodeMCPServer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      serverId: 'test-mcp',
      endpoints: { http: 'http://localhost:3010' }
    }),
    start: vi.fn().mockResolvedValue({ url: 'http://localhost:3010' }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

describe('LoveClaudeCodePlatform', () => {
  let platform: LoveClaudeCodePlatform

  beforeEach(() => {
    vi.clearAllMocks()
    platform = new LoveClaudeCodePlatform()
  })

  it('should have correct definition', () => {
    expect(LoveClaudeCodePlatform.definition).toMatchObject({
      id: 'platform-l3-love-claude-code-platform',
      name: 'Love Claude Code Platform',
      level: ConstructLevel.L3,
      description: expect.stringContaining('complete platform ecosystem')
    })
  })

  it('should initialize with default configuration', async () => {
    await platform.initialize({
      name: 'test-platform',
      environment: 'development'
    })

    const outputs = platform.getOutputs()
    expect(outputs.name).toBe('test-platform')
    expect(outputs.environment).toBe('development')
    expect(outputs.status).toBe('running')
    expect(outputs.components).toHaveProperty('frontend')
    expect(outputs.components).toHaveProperty('backend')
    expect(outputs.components).toHaveProperty('mcpServer')
  })

  it('should initialize all L3 applications', async () => {
    await platform.initialize({
      name: 'test-platform',
      deployment: {
        mode: 'local',
        provider: CloudProvider.LOCAL
      }
    })

    const outputs = platform.getOutputs()
    expect(outputs.components.frontend.status).toBe('running')
    expect(outputs.components.backend.status).toBe('running')
    expect(outputs.components.mcpServer.endpoints).toBeDefined()
  })

  it('should deploy the complete platform', async () => {
    await platform.initialize({
      name: 'prod-platform',
      environment: 'production',
      deployment: {
        mode: 'cloud',
        provider: CloudProvider.AWS
      }
    })

    const result = await platform.deployPlatform()

    expect(result).toMatchObject({
      success: true,
      frontend: { url: expect.stringContaining('https://') },
      backend: { apiUrl: expect.stringContaining('https://') },
      mcpServer: { endpoint: expect.any(String) }
    })
  })

  it('should perform health checks', async () => {
    await platform.initialize({
      name: 'health-test-platform'
    })

    const health = await platform.checkHealth()

    expect(health).toMatchObject({
      healthy: true,
      components: {
        frontend: { status: 'healthy' },
        backend: { status: 'healthy' },
        mcpServer: { status: 'healthy' }
      }
    })
  })

  it('should backup the platform', async () => {
    await platform.initialize({
      name: 'backup-test-platform'
    })

    const backup = await platform.backupPlatform()

    expect(backup).toMatchObject({
      id: expect.stringContaining('backup'),
      timestamp: expect.any(Date),
      components: expect.any(Object),
      configuration: expect.any(Object)
    })
  })

  it('should restore from backup', async () => {
    await platform.initialize({
      name: 'restore-test-platform'
    })

    const backup = await platform.backupPlatform()
    const result = await platform.restorePlatform(backup.id)

    expect(result.success).toBe(true)
  })

  it('should migrate between providers', async () => {
    await platform.initialize({
      name: 'migration-test',
      deployment: {
        mode: 'cloud',
        provider: CloudProvider.FIREBASE
      }
    })

    const result = await platform.migratePlatform({
      targetProvider: CloudProvider.AWS,
      includeData: true
    })

    expect(result).toMatchObject({
      success: true,
      fromProvider: CloudProvider.FIREBASE,
      toProvider: CloudProvider.AWS,
      migrationTime: expect.any(Number)
    })
  })

  it('should update the platform', async () => {
    await platform.initialize({
      name: 'update-test-platform'
    })

    const result = await platform.updatePlatform({
      version: '2.0.0',
      components: ['frontend', 'backend']
    })

    expect(result).toMatchObject({
      success: true,
      previousVersion: expect.any(String),
      newVersion: '2.0.0',
      updatedComponents: ['frontend', 'backend']
    })
  })

  it('should self-deploy the platform', async () => {
    await platform.initialize({
      name: 'self-deploy-test',
      selfReferential: {
        enableSelfDeployment: true
      }
    })

    const result = await platform.selfDeploy()

    expect(result).toMatchObject({
      success: true,
      deploymentId: expect.any(String),
      selfReferentialScore: 100
    })
  })

  it('should generate platform documentation', async () => {
    await platform.initialize({
      name: 'docs-test-platform'
    })

    const docs = await platform.generateDocumentation()

    expect(docs).toMatchObject({
      overview: expect.any(String),
      architecture: expect.any(Object),
      api: expect.any(Object),
      deployment: expect.any(Object)
    })
  })

  it('should manage extensions', async () => {
    await platform.initialize({
      name: 'extension-test',
      extensions: {
        enabled: true
      }
    })

    const extension = {
      name: 'test-extension',
      version: '1.0.0',
      hooks: {
        onDeploy: vi.fn()
      }
    }

    await platform.installExtension(extension)
    const installed = platform.getExtensions()

    expect(installed).toContainEqual(expect.objectContaining({
      name: 'test-extension'
    }))
  })

  it('should collect platform analytics', async () => {
    await platform.initialize({
      name: 'analytics-test',
      analytics: {
        enabled: true
      }
    })

    const analytics = await platform.getAnalytics()

    expect(analytics).toMatchObject({
      usage: expect.any(Object),
      performance: expect.any(Object),
      errors: expect.any(Array),
      trends: expect.any(Object)
    })
  })

  it('should support blue-green deployment', async () => {
    await platform.initialize({
      name: 'bg-test-platform',
      deployment: {
        strategy: 'blue-green'
      }
    })

    const result = await platform.deployPlatform()

    expect(result.deploymentStrategy).toBe('blue-green')
    expect(result.blueEnvironment).toBeDefined()
    expect(result.greenEnvironment).toBeDefined()
  })

  it('should evolve platform architecture', async () => {
    await platform.initialize({
      name: 'evolve-test',
      selfReferential: {
        enableEvolution: true
      }
    })

    const evolution = await platform.evolvePlatform({
      target: 'microservices',
      preserveData: true
    })

    expect(evolution).toMatchObject({
      success: true,
      previousArchitecture: expect.any(String),
      newArchitecture: 'microservices',
      migrationSteps: expect.any(Array)
    })
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Deployment failed')
    const frontend = platform['applications'].frontend as any
    frontend.deploy = vi.fn().mockRejectedValue(mockError)

    await platform.initialize({
      name: 'error-test-platform'
    })

    const result = await platform.deployPlatform()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Deployment failed')
  })

  it('should clean up resources on destroy', async () => {
    await platform.initialize({
      name: 'cleanup-test-platform'
    })

    await platform.destroy()

    const applications = platform['applications'] as any
    expect(applications.frontend.destroy).toHaveBeenCalled()
    expect(applications.backend.destroy).toHaveBeenCalled()
    expect(applications.mcpServer.destroy).toHaveBeenCalled()
  })
})