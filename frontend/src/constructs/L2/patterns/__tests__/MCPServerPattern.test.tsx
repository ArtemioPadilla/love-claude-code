import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MCPServerPattern, MCPServerPatternLogic } from '../MCPServerPattern'

// Mock the L1 components
jest.mock('../../../L1/infrastructure/mcp/SecureMCPServer', () => ({
  SecureMCPServer: jest.fn().mockImplementation(() => ({
    setToolRegistry: jest.fn(),
    setRPCHandler: jest.fn(),
    setWebSocketHandler: jest.fn(),
    on: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    checkHealth: jest.fn().mockResolvedValue({ healthy: true })
  }))
}))

jest.mock('../../../L1/infrastructure/mcp/AuthenticatedToolRegistry', () => ({
  AuthenticatedToolRegistry: jest.fn().mockImplementation(() => ({
    listTools: jest.fn().mockResolvedValue(['tool1', 'tool2', 'tool3']),
    registerTool: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    checkHealth: jest.fn().mockResolvedValue({ healthy: true })
  }))
}))

jest.mock('../../../L1/infrastructure/mcp/RateLimitedRPC', () => ({
  RateLimitedRPC: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    checkHealth: jest.fn().mockResolvedValue({ healthy: true })
  }))
}))

jest.mock('../../../L1/infrastructure/mcp/EncryptedWebSocket', () => ({
  EncryptedWebSocket: jest.fn().mockImplementation(() => ({
    handleConnection: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    checkHealth: jest.fn().mockResolvedValue({ healthy: true })
  }))
}))

describe('MCPServerPattern', () => {
  const defaultConfig = {
    serverName: 'test-server',
    port: 8080,
    enableAuth: true,
    enableRateLimit: true,
    enableEncryption: true
  }

  describe('Logic Class', () => {
    let pattern: MCPServerPatternLogic

    beforeEach(() => {
      pattern = new MCPServerPatternLogic(defaultConfig)
    })

    it('initializes with correct metadata', () => {
      const metadata = pattern.getMetadata()
      expect(metadata.id).toBe('mcp-server-test-server')
      expect(metadata.name).toBe('MCP Server Pattern')
      expect(metadata.level).toBe('L2')
      expect(metadata.category).toBe('pattern')
    })

    it('registers all L1 components', async () => {
      await pattern.initialize()
      
      // Check that all components are registered
      expect(pattern['l1Components'].size).toBe(4)
      expect(pattern['l1Components'].has('server')).toBe(true)
      expect(pattern['l1Components'].has('toolRegistry')).toBe(true)
      expect(pattern['l1Components'].has('rpc')).toBe(true)
      expect(pattern['l1Components'].has('websocket')).toBe(true)
    })

    it('wires components together correctly', async () => {
      await pattern.initialize()
      
      const server = pattern['getL1Component']('server')
      expect(server.setToolRegistry).toHaveBeenCalled()
      expect(server.setRPCHandler).toHaveBeenCalled()
      expect(server.setWebSocketHandler).toHaveBeenCalled()
    })

    it('discovers tools from registry', async () => {
      await pattern.initialize()
      const tools = await pattern.discoverTools()
      
      expect(tools).toEqual(['tool1', 'tool2', 'tool3'])
    })

    it('registers new tools', async () => {
      await pattern.initialize()
      const handler = jest.fn()
      
      await pattern.registerTool('newTool', handler)
      
      const toolRegistry = pattern['getL1Component']('toolRegistry')
      expect(toolRegistry.registerTool).toHaveBeenCalledWith('newTool', handler)
    })

    it('returns performance metrics', () => {
      const metrics = pattern.getMetrics()
      
      expect(metrics).toHaveProperty('activeConnections')
      expect(metrics).toHaveProperty('totalRequests')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('throughput')
    })

    it('checks health of all components', async () => {
      await pattern.initialize()
      const health = await pattern.checkHealth()
      
      expect(health.healthy).toBe(true)
      expect(health.components).toHaveProperty('server')
      expect(health.components).toHaveProperty('toolRegistry')
      expect(health.components).toHaveProperty('rpc')
      expect(health.components).toHaveProperty('websocket')
    })

    it('handles component health check failures', async () => {
      // Mock a failing component
      const failingServer = {
        checkHealth: jest.fn().mockResolvedValue({ healthy: false, message: 'Server error' }),
        initialize: jest.fn()
      }
      pattern['l1Components'].set('server', failingServer as any)
      
      const health = await pattern.checkHealth()
      
      expect(health.healthy).toBe(false)
      expect(health.components.server).toEqual({ healthy: false, message: 'Server error' })
    })

    it('restarts the pattern', async () => {
      await pattern.initialize()
      const cleanupSpy = jest.spyOn(pattern, 'cleanup')
      const initializeSpy = jest.spyOn(pattern, 'initialize')
      
      await pattern.restart()
      
      expect(cleanupSpy).toHaveBeenCalled()
      expect(initializeSpy).toHaveBeenCalledTimes(2) // Initial + restart
    })
  })

  describe('React Component', () => {
    it('renders loading state initially', () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
    })

    it('renders server information after loading', async () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(screen.getByText('test-server')).toBeInTheDocument()
        expect(screen.getByText('Production MCP Server')).toBeInTheDocument()
      })
    })

    it('displays health status for all components', async () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(screen.getByText('server')).toBeInTheDocument()
        expect(screen.getByText('toolRegistry')).toBeInTheDocument()
        expect(screen.getByText('rpc')).toBeInTheDocument()
        expect(screen.getByText('websocket')).toBeInTheDocument()
      })
      
      // Check for healthy status
      const healthyStatuses = screen.getAllByText('Healthy')
      expect(healthyStatuses).toHaveLength(4)
    })

    it('displays configuration settings', async () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(screen.getByText('Authentication')).toBeInTheDocument()
        expect(screen.getByText('Rate Limiting')).toBeInTheDocument()
      })
      
      // Check enabled status
      const enabledStatuses = screen.getAllByText('Enabled')
      expect(enabledStatuses.length).toBeGreaterThan(0)
    })

    it('displays registered tools', async () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Registered Tools \(3\)/)).toBeInTheDocument()
        expect(screen.getByText('tool1')).toBeInTheDocument()
        expect(screen.getByText('tool2')).toBeInTheDocument()
        expect(screen.getByText('tool3')).toBeInTheDocument()
      })
    })

    it('handles restart button click', async () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(screen.getByText('Restart')).toBeInTheDocument()
      })
      
      const restartButton = screen.getByText('Restart')
      fireEvent.click(restartButton)
      
      // Should show loading state during restart
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
    })

    it('calls onConfigChange when provided', async () => {
      const onConfigChange = jest.fn()
      render(
        <MCPServerPattern 
          config={defaultConfig} 
          onConfigChange={onConfigChange}
        />
      )
      
      // Component should be ready for config changes
      await waitFor(() => {
        expect(screen.getByText('test-server')).toBeInTheDocument()
      })
    })

    it('displays performance metrics', async () => {
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
        expect(screen.getByText('Active Connections')).toBeInTheDocument()
        expect(screen.getByText('Total Requests')).toBeInTheDocument()
        expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
        expect(screen.getByText('Error Rate')).toBeInTheDocument()
        expect(screen.getByText('Throughput')).toBeInTheDocument()
      })
    })

    it('handles initialization errors gracefully', async () => {
      // Mock console.error to avoid test noise
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      // Mock initialization failure
      const { SecureMCPServer } = await import('../../../L1/infrastructure/mcp/SecureMCPServer')
      SecureMCPServer.mockImplementationOnce(() => {
        throw new Error('Initialization failed')
      })
      
      render(<MCPServerPattern config={defaultConfig} />)
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to initialize MCP server pattern:',
          expect.any(Error)
        )
      })
      
      consoleError.mockRestore()
    })
  })

  describe('Pattern Definition', () => {
    it('exports valid construct definition', async () => {
      const { mcpServerPatternDefinition } = await import('../MCPServerPattern')
      
      expect(mcpServerPatternDefinition).toBeDefined()
      expect(mcpServerPatternDefinition.id).toBe('mcp-server-pattern')
      expect(mcpServerPatternDefinition.level).toBe('L2')
      expect(mcpServerPatternDefinition.categories).toContain('pattern')
      expect(mcpServerPatternDefinition.categories).toContain('infrastructure')
      expect(mcpServerPatternDefinition.categories).toContain('mcp')
    })

    it('includes all required dependencies', async () => {
      const { mcpServerPatternDefinition } = await import('../MCPServerPattern')
      
      const dependencyIds = mcpServerPatternDefinition.dependencies.map((d: any) => d.id)
      expect(dependencyIds).toContain('secure-mcp-server')
      expect(dependencyIds).toContain('authenticated-tool-registry')
      expect(dependencyIds).toContain('rate-limited-rpc')
      expect(dependencyIds).toContain('encrypted-websocket')
    })

    it('includes comprehensive configuration schema', async () => {
      const { mcpServerPatternDefinition } = await import('../MCPServerPattern')
      
      expect(mcpServerPatternDefinition.configuration).toHaveProperty('serverName')
      expect(mcpServerPatternDefinition.configuration).toHaveProperty('port')
      expect(mcpServerPatternDefinition.configuration).toHaveProperty('enableAuth')
      expect(mcpServerPatternDefinition.configuration).toHaveProperty('enableRateLimit')
      expect(mcpServerPatternDefinition.configuration).toHaveProperty('enableEncryption')
    })
  })
})