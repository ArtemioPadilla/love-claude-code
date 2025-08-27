import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoveClaudeCodeFrontend } from '../LoveClaudeCodeFrontend'
import { ConstructLevel, CloudProvider } from '../../../types'

// Mock L2 patterns
vi.mock('../../../L2/patterns', () => ({
  IDEWorkspace: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      workspaceId: 'test-workspace',
      layout: 'three-column',
      theme: 'dark'
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  ClaudeConversationSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      conversationId: 'test-conversation',
      model: 'claude-3-opus-20240229',
      streamingEnabled: true
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  ProjectManagementSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      projectId: 'test-project',
      activeProjects: 1,
      totalFiles: 10
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  RealTimeCollaboration: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      sessionId: 'test-session',
      connectedUsers: 1,
      syncEnabled: true
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  })),
  ConstructCatalogSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getOutputs: vi.fn().mockReturnValue({
      catalogId: 'test-catalog',
      totalConstructs: 50,
      marketplaceEnabled: true
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    emit: vi.fn()
  }))
}))

describe('LoveClaudeCodeFrontend', () => {
  let app: LoveClaudeCodeFrontend

  beforeEach(() => {
    vi.clearAllMocks()
    app = new LoveClaudeCodeFrontend()
  })

  it('should have correct definition', () => {
    expect(LoveClaudeCodeFrontend.definition).toMatchObject({
      id: 'platform-l3-love-claude-code-frontend',
      name: 'Love Claude Code Frontend',
      level: ConstructLevel.L3,
      description: expect.stringContaining('complete frontend application')
    })
  })

  it('should initialize with default configuration', async () => {
    await app.initialize({
      name: 'test-frontend',
      provider: CloudProvider.LOCAL
    })

    const outputs = app.getOutputs()
    expect(outputs.name).toBe('test-frontend')
    expect(outputs.version).toBeDefined()
    expect(outputs.status).toBe('running')
    expect(outputs.provider).toBe(CloudProvider.LOCAL)
  })

  it('should initialize all L2 patterns', async () => {
    await app.initialize({
      name: 'test-frontend',
      features: {
        ai: true,
        collaboration: true,
        marketplace: true,
        analytics: true,
        documentation: true
      }
    })

    const outputs = app.getOutputs()
    expect(outputs.patterns).toMatchObject({
      ideWorkspace: expect.any(Object),
      claudeConversation: expect.any(Object),
      projectManagement: expect.any(Object),
      collaboration: expect.any(Object),
      constructCatalog: expect.any(Object)
    })
  })

  it('should support custom configuration', async () => {
    await app.initialize({
      name: 'custom-frontend',
      provider: CloudProvider.FIREBASE,
      environment: 'production',
      features: {
        ai: true,
        collaboration: false,
        marketplace: true,
        analytics: true,
        documentation: false
      },
      theme: {
        mode: 'light',
        primaryColor: '#FF6B6B'
      },
      claudeConfig: {
        model: 'claude-3-haiku-20240307',
        maxTokens: 2000
      }
    })

    const outputs = app.getOutputs()
    expect(outputs.environment).toBe('production')
    expect(outputs.features.collaboration).toBe(false)
    expect(outputs.theme.mode).toBe('light')
  })

  it('should build the application', async () => {
    await app.initialize({
      name: 'build-test',
      environment: 'production'
    })

    const result = await app.build()

    expect(result).toMatchObject({
      success: true,
      outputPath: expect.stringContaining('dist'),
      size: expect.any(Number),
      buildTime: expect.any(Number)
    })
  })

  it('should deploy to different providers', async () => {
    await app.initialize({
      name: 'deploy-test',
      provider: CloudProvider.AWS
    })

    await app.build()
    const result = await app.deploy('vercel')

    expect(result).toMatchObject({
      success: true,
      url: expect.stringContaining('https://'),
      deploymentId: expect.any(String),
      provider: 'vercel'
    })
  })

  it('should start development server', async () => {
    await app.initialize({
      name: 'dev-test',
      environment: 'development'
    })

    const result = await app.startDevelopment()

    expect(result).toMatchObject({
      url: 'http://localhost:3000',
      hot: true,
      open: true
    })
  })

  it('should support hot reload', async () => {
    const mockEmit = vi.fn()
    app.emit = mockEmit

    await app.initialize({
      name: 'hot-reload-test',
      environment: 'development',
      development: {
        hot: true,
        port: 3001
      }
    })

    await app.startDevelopment()

    // Simulate file change
    const ideWorkspace = app['patterns'].ideWorkspace as any
    ideWorkspace.emit('fileChanged', { path: 'src/App.tsx' })

    expect(mockEmit).toHaveBeenCalledWith('hot-reload', expect.objectContaining({
      file: 'src/App.tsx'
    }))
  })

  it('should generate constructs through self-referential capabilities', async () => {
    await app.initialize({
      name: 'self-referential-test',
      features: {
        ai: true,
        marketplace: true
      }
    })

    const construct = await app.generateConstruct({
      type: 'ui',
      level: ConstructLevel.L1,
      description: 'A custom chart component'
    })

    expect(construct).toMatchObject({
      id: expect.stringContaining('construct'),
      level: ConstructLevel.L1,
      generated: true
    })
  })

  it('should export project configuration', async () => {
    await app.initialize({
      name: 'export-test',
      provider: CloudProvider.LOCAL
    })

    const config = await app.exportConfiguration()

    expect(config).toMatchObject({
      name: 'export-test',
      provider: CloudProvider.LOCAL,
      features: expect.any(Object),
      theme: expect.any(Object),
      claudeConfig: expect.any(Object)
    })
  })

  it('should run health checks', async () => {
    await app.initialize({
      name: 'health-test'
    })

    const health = await app.runHealthCheck()

    expect(health).toMatchObject({
      status: 'healthy',
      checks: {
        workspace: 'pass',
        claude: 'pass',
        projects: 'pass',
        catalog: 'pass'
      }
    })
  })

  it('should handle environment switching', async () => {
    await app.initialize({
      name: 'env-test',
      environment: 'development'
    })

    app.setEnvironment('production')

    const outputs = app.getOutputs()
    expect(outputs.environment).toBe('production')
  })

  it('should emit application lifecycle events', async () => {
    const mockEmit = vi.fn()
    app.emit = mockEmit

    await app.initialize({
      name: 'lifecycle-test'
    })

    expect(mockEmit).toHaveBeenCalledWith('application:initialized', expect.objectContaining({
      name: 'lifecycle-test'
    }))

    await app.build()
    expect(mockEmit).toHaveBeenCalledWith('application:built', expect.any(Object))

    await app.deploy('netlify')
    expect(mockEmit).toHaveBeenCalledWith('application:deployed', expect.any(Object))
  })

  it('should clean up resources on destroy', async () => {
    await app.initialize({
      name: 'cleanup-test',
      features: {
        ai: true,
        collaboration: true,
        marketplace: true,
        analytics: true,
        documentation: true
      }
    })

    await app.destroy()

    // Verify all patterns were destroyed
    const patterns = app['patterns'] as any
    expect(patterns.ideWorkspace.destroy).toHaveBeenCalled()
    expect(patterns.claudeConversation.destroy).toHaveBeenCalled()
    expect(patterns.projectManagement.destroy).toHaveBeenCalled()
    expect(patterns.collaboration.destroy).toHaveBeenCalled()
    expect(patterns.constructCatalog.destroy).toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Initialization failed')
    const IDEWorkspaceMock = vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockRejectedValue(mockError),
      destroy: vi.fn()
    }))

    vi.mocked(await import('../../../L2/patterns')).IDEWorkspace = IDEWorkspaceMock

    await expect(app.initialize({
      name: 'error-test'
    })).rejects.toThrow('Initialization failed')
  })
})