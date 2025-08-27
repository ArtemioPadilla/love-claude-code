/**
 * Tests for Love Claude Code MCP Server L3 Application Construct
 */

import { LoveClaudeCodeMCPServer, createLoveClaudeCodeMCPServer } from '../LoveClaudeCodeMCPServer'
import { loveClaudeCodeMCPServerDefinition } from '../LoveClaudeCodeMCPServer.definition'
import { ConstructType, ConstructLevel } from '../../../types'

describe('LoveClaudeCodeMCPServer', () => {
  let mcpServer: LoveClaudeCodeMCPServer

  beforeEach(() => {
    mcpServer = new LoveClaudeCodeMCPServer()
  })

  afterEach(async () => {
    if (mcpServer) {
      await mcpServer.destroy()
    }
  })

  describe('Basic Properties', () => {
    it('should have correct type and level', () => {
      expect(mcpServer.getType()).toBe(ConstructType.APPLICATION)
      expect(mcpServer.getLevel()).toBe(ConstructLevel.L3)
    })

    it('should have correct metadata', () => {
      const metadata = mcpServer.getMetadata()
      expect(metadata.id).toBe('love-claude-code-mcp-server')
      expect(metadata.name).toBe('Love Claude Code MCP Server')
      expect(metadata.type).toBe(ConstructType.APPLICATION)
      expect(metadata.level).toBe(ConstructLevel.L3)
    })

    it('should be self-referential', () => {
      const metadata = mcpServer.getMetadata()
      expect(metadata.selfReferential).toBeDefined()
      expect(metadata.selfReferential?.buildsItself).toBe(true)
      expect(metadata.selfReferential?.testsItself).toBe(true)
      expect(metadata.selfReferential?.improvesSelf).toBe(true)
    })
  })

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await mcpServer.initialize()
      
      const health = await mcpServer.getHealthStatus()
      expect(health.status).toBe('healthy')
      expect(health.components.server).toBe('running')
    })

    it('should initialize with custom config', async () => {
      const customServer = createLoveClaudeCodeMCPServer({
        deployment: {
          mode: 'remote',
          scaling: {
            min: 2,
            max: 20
          }
        },
        tools: {
          providers: true,
          constructs: false,
          deployment: true,
          uiTesting: false
        }
      })

      await customServer.initialize()
      
      const tools = customServer.getTools()
      const providerTools = customServer.getToolsByCategory('providers')
      const constructTools = customServer.getToolsByCategory('constructs')
      
      expect(providerTools.length).toBeGreaterThan(0)
      expect(constructTools.length).toBe(0)
      
      await customServer.destroy()
    })
  })

  describe('Tool Registry', () => {
    beforeEach(async () => {
      await mcpServer.initialize()
    })

    it('should register all tool categories when enabled', () => {
      const tools = mcpServer.getTools()
      expect(tools.length).toBeGreaterThan(0)
      
      const categories = ['providers', 'constructs', 'deployment', 'ui-testing']
      for (const category of categories) {
        const categoryTools = mcpServer.getToolsByCategory(category)
        expect(categoryTools.length).toBeGreaterThan(0)
      }
    })

    it('should have provider management tools', () => {
      const providerTools = mcpServer.getToolsByCategory('providers')
      const toolNames = providerTools.map(t => t.name)
      
      expect(toolNames).toContain('analyze_project_requirements')
      expect(toolNames).toContain('compare_providers')
      expect(toolNames).toContain('estimate_costs')
      expect(toolNames).toContain('switch_provider')
      expect(toolNames).toContain('migrate_data')
    })

    it('should have construct development tools', () => {
      const constructTools = mcpServer.getToolsByCategory('constructs')
      const toolNames = constructTools.map(t => t.name)
      
      expect(toolNames).toContain('create_construct')
      expect(toolNames).toContain('test_construct')
      expect(toolNames).toContain('validate_construct')
      expect(toolNames).toContain('publish_construct')
    })

    it('should have deployment tools', () => {
      const deploymentTools = mcpServer.getToolsByCategory('deployment')
      const toolNames = deploymentTools.map(t => t.name)
      
      expect(toolNames).toContain('deploy_platform')
      expect(toolNames).toContain('update_deployment')
      expect(toolNames).toContain('rollback_deployment')
    })

    it('should have UI testing tools', () => {
      const uiTools = mcpServer.getToolsByCategory('ui-testing')
      const toolNames = uiTools.map(t => t.name)
      
      expect(toolNames).toContain('inspect_element')
      expect(toolNames).toContain('get_page_screenshot')
      expect(toolNames).toContain('click_element')
      expect(toolNames).toContain('validate_layout')
    })
  })

  describe('Tool Execution', () => {
    beforeEach(async () => {
      await mcpServer.initialize()
    })

    it('should execute analyze_project_requirements tool', async () => {
      const result = await mcpServer.executeTool('analyze_project_requirements', {
        projectType: 'web-app',
        expectedUsers: 5000,
        features: ['auth', 'storage'],
        budget: 'medium'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.requirements).toBeDefined()
      expect(result.data.recommendations).toBeDefined()
    })

    it('should execute compare_providers tool', async () => {
      const result = await mcpServer.executeTool('compare_providers', {
        providers: ['local', 'firebase', 'aws']
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.comparison).toBeDefined()
      expect(result.data.comparison.providers).toEqual(['local', 'firebase', 'aws'])
    })

    it('should validate tool parameters', async () => {
      const result = await mcpServer.executeTool('create_construct', {
        // Missing required parameters
        type: 'ui'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing required parameter')
    })

    it('should handle unknown tools', async () => {
      const result = await mcpServer.executeTool('unknown_tool', {})
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Tool not found')
    })
  })

  describe('SDK and Extensions', () => {
    beforeEach(async () => {
      await mcpServer.initialize()
    })

    it('should provide SDK for tool development', () => {
      const sdk = mcpServer.getSDK()
      
      expect(sdk).toBeDefined()
      expect(sdk.createTool).toBeDefined()
      expect(sdk.removeTool).toBeDefined()
      expect(sdk.getTool).toBeDefined()
      expect(sdk.listTools).toBeDefined()
    })

    it('should allow creating custom tools via SDK', async () => {
      const sdk = mcpServer.getSDK()
      
      // Create custom tool
      sdk.createTool({
        name: 'custom_test_tool',
        description: 'A custom test tool',
        parameters: {
          input: { type: 'string', required: true }
        }
      }, async (params) => {
        return { output: `Processed: ${params.input}` }
      })

      // Execute custom tool
      const result = await mcpServer.executeTool('custom_test_tool', {
        input: 'test data'
      })

      expect(result.success).toBe(true)
      expect(result.data.output).toBe('Processed: test data')

      // Verify tool is in registry
      const tool = sdk.getTool('custom_test_tool')
      expect(tool).toBeDefined()
      expect(tool?.name).toBe('custom_test_tool')

      // Remove tool
      sdk.removeTool('custom_test_tool')
      const removedTool = sdk.getTool('custom_test_tool')
      expect(removedTool).toBeUndefined()
    })

    it('should support creating extensions', async () => {
      const extensionId = await mcpServer.createExtension('Test Extension', [
        {
          name: 'extension_tool_1',
          description: 'First extension tool',
          parameters: {}
        },
        {
          name: 'extension_tool_2',
          description: 'Second extension tool',
          parameters: {}
        }
      ])

      expect(extensionId).toMatch(/^ext-\d+$/)
      
      // Verify extension tools are registered
      const tools = mcpServer.getTools()
      const extensionTools = tools.filter(t => 
        t.name === 'extension_tool_1' || t.name === 'extension_tool_2'
      )
      expect(extensionTools.length).toBe(2)
    })
  })

  describe('Monitoring and Metrics', () => {
    beforeEach(async () => {
      await mcpServer.initialize()
    })

    it('should track metrics', async () => {
      // Execute some tools
      await mcpServer.executeTool('analyze_project_requirements', {
        projectType: 'web-app'
      })
      await mcpServer.executeTool('compare_providers', {
        providers: ['local', 'firebase']
      })

      const metrics = mcpServer.getMetrics()
      
      expect(metrics.requestsServed).toBeGreaterThan(0)
      expect(metrics.toolInvocations['analyze_project_requirements']).toBe(1)
      expect(metrics.toolInvocations['compare_providers']).toBe(1)
      expect(metrics.uptime).toBeGreaterThan(0)
    })

    it('should track error rate', async () => {
      // Execute invalid tool to generate error
      await mcpServer.executeTool('invalid_tool', {})
      
      const metrics = mcpServer.getMetrics()
      expect(metrics.errorRate).toBeGreaterThan(0)
    })
  })

  describe('Environment and Deployment', () => {
    beforeEach(async () => {
      await mcpServer.initialize()
    })

    it('should start in development mode', async () => {
      await mcpServer.startDevelopment()
      expect(mcpServer.getEnvironment()).toBe('development')
    })

    it('should start in production mode', async () => {
      await mcpServer.startProduction()
      expect(mcpServer.getEnvironment()).toBe('production')
    })

    it('should support local deployment', async () => {
      await mcpServer.deploy('local')
      const endpoints = mcpServer.getEndpoints()
      
      expect(endpoints.http).toContain('localhost')
      expect(endpoints.websocket).toContain('localhost')
    })

    it('should support cloud deployment', async () => {
      await mcpServer.deploy('cloud')
      // In real implementation, would verify cloud deployment
    })
  })

  describe('Pattern Composition', () => {
    beforeEach(async () => {
      await mcpServer.initialize()
    })

    it('should compose L2 patterns', () => {
      const patterns = mcpServer.getPatterns()
      expect(patterns.length).toBeGreaterThan(0)
      
      const patternNames = patterns.map(p => p.constructor.name)
      expect(patternNames).toContain('ServerlessAPIPattern')
      expect(patternNames).toContain('MicroserviceBackend')
      expect(patternNames).toContain('RealTimeCollaboration')
    })

    it('should not have L3 dependencies', () => {
      const dependencies = mcpServer.getDependencies()
      const l3Dependencies = dependencies.filter(d => d.level === 'L3')
      expect(l3Dependencies.length).toBe(0)
    })
  })

  describe('Definition Compliance', () => {
    it('should match the platform definition', () => {
      expect(loveClaudeCodeMCPServerDefinition.id).toBe('platform-l3-love-claude-code-mcp-server')
      expect(loveClaudeCodeMCPServerDefinition.type).toBe(ConstructType.APPLICATION)
      expect(loveClaudeCodeMCPServerDefinition.level).toBe(ConstructLevel.L3)
    })

    it('should have all required capabilities', () => {
      const capabilities = loveClaudeCodeMCPServerDefinition.capabilities
      expect(capabilities).toContain('mcp-protocol')
      expect(capabilities).toContain('provider-management')
      expect(capabilities).toContain('construct-development')
      expect(capabilities).toContain('self-referential')
    })

    it('should create instance from definition', () => {
      const instance = loveClaudeCodeMCPServerDefinition.createInstance({})
      expect(instance).toBeInstanceOf(LoveClaudeCodeMCPServer)
    })
  })

  describe('Self-Referential Features', () => {
    it('should be able to analyze itself', async () => {
      await mcpServer.initialize()
      
      // Use MCP server to analyze its own requirements
      const result = await mcpServer.executeTool('analyze_project_requirements', {
        projectType: 'mcp-server',
        expectedUsers: 1000,
        features: ['mcp-protocol', 'tool-execution', 'real-time', 'monitoring'],
        budget: 'high'
      })

      expect(result.success).toBe(true)
      expect(result.data.recommendations).toBeDefined()
    })

    it('should be able to validate itself as a construct', async () => {
      await mcpServer.initialize()
      
      // Validate MCP server as a construct
      const result = await mcpServer.executeTool('validate_construct', {
        constructId: 'platform-l3-love-claude-code-mcp-server',
        strict: true
      })

      expect(result.success).toBe(true)
      expect(result.data.validation.valid).toBe(true)
    })
  })
})