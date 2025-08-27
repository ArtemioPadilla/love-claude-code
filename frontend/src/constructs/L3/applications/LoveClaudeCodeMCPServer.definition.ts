/**
 * Love Claude Code MCP Server Definition
 * Platform construct definition for the Love Claude Code MCP Server
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../types'
import { LoveClaudeCodeMCPServer } from './LoveClaudeCodeMCPServer'

export const loveClaudeCodeMCPServerDefinition: PlatformConstructDefinition = {
  id: 'platform-l3-love-claude-code-mcp-server',
  name: 'Love Claude Code MCP Server',
  type: ConstructType.APPLICATION,
  level: ConstructLevel.L3,
  description: 'Complete Model Context Protocol (MCP) server for Love Claude Code platform management',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  categories: ['mcp', 'server', 'platform-management', 'integration'],
  tags: [
    'mcp-protocol',
    'provider-management',
    'construct-development',
    'platform-deployment',
    'ui-testing',
    'real-time-sync',
    'websocket',
    'rest-api',
    'grpc',
    'extensible',
    'self-referential',
    'monitoring',
    'auto-scaling'
  ],
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  category: 'application',
  
  capabilities: [
    'mcp-protocol',
    'provider-management',
    'construct-development',
    'platform-deployment',
    'ui-testing',
    'real-time-sync',
    'websocket',
    'rest-api',
    'grpc',
    'extensible',
    'self-referential',
    'monitoring',
    'auto-scaling'
  ],
  
  configuration: {
    name: 'Love Claude Code MCP Server',
    version: '1.0.0',
    deployment: {
      mode: 'local',
      scaling: {
        min: 1,
        max: 10
      }
    },
    tools: {
      providers: true,
      constructs: true,
      deployment: true,
      uiTesting: true,
      extensions: true
    },
    security: {
      authentication: 'token',
      encryption: true
    },
    logging: {
      level: 'info',
      destination: 'console'
    }
  },
  
  outputs: {
    serverId: '',
    status: 'initializing',
    endpoints: {},
    tools: {
      total: 0,
      categories: {},
      enabled: []
    },
    metrics: {
      uptime: 0,
      requestsServed: 0,
      activeConnections: 0,
      toolInvocations: {},
      errorRate: 0
    },
    capabilities: {
      realtime: true,
      batch: true,
      streaming: true,
      async: true
    }
  },
  
  dependencies: [
    // L2 Patterns that this L3 construct directly uses
    'platform-l2-serverless-api-pattern',
    'platform-l2-microservice-backend',
    'platform-l2-real-time-collaboration',
    
    // Note: The L2 patterns above use these L1 components:
    // - platform-l1-authenticated-websocket (for real-time)
    // - platform-l1-rest-api-service (for APIs)
    // - platform-l1-managed-container (for microservices)
    
    // Which in turn use these L0 MCP primitives:
    // - platform-l0-websocket-primitive
    // - platform-l0-rpc-primitive
    // - platform-l0-tool-registry-primitive
    // - platform-l0-message-queue-primitive
  ],
  
  npm: {
    package: '@love-claude-code/mcp-server',
    version: '1.0.0',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'ws': '^8.16.0',
      'express': '^4.18.2',
      '@grpc/grpc-js': '^1.9.0'
    }
  },
  
  github: {
    repository: 'love-claude-code/love-claude-code',
    path: 'frontend/src/constructs/L3/applications/LoveClaudeCodeMCPServer.tsx',
    issues: 'https://github.com/love-claude-code/love-claude-code/issues',
    discussions: 'https://github.com/love-claude-code/love-claude-code/discussions'
  },
  
  examples: [
    {
      title: 'Basic MCP Server Setup',
      description: 'Create and start a basic MCP server',
      code: `const mcpServer = new LoveClaudeCodeMCPServer({
  deployment: {
    mode: 'local'
  },
  tools: {
    providers: true,
    constructs: true
  }
})

await mcpServer.initialize()
console.log('MCP Server running at:', mcpServer.getEndpoints())`
    },
    {
      title: 'Execute MCP Tools',
      description: 'Execute tools via the MCP protocol',
      code: `// Analyze project requirements
const analysis = await mcpServer.executeTool('analyze_project_requirements', {
  projectType: 'web-app',
  expectedUsers: 10000,
  features: ['auth', 'storage', 'api']
})

// Compare providers
const comparison = await mcpServer.executeTool('compare_providers', {
  providers: ['local', 'firebase', 'aws'],
  requirements: analysis.data.requirements
})`
    },
    {
      title: 'Create Custom Extension',
      description: 'Extend the MCP server with custom tools',
      code: `const sdk = mcpServer.getSDK()

// Create a custom tool
sdk.createTool({
  name: 'custom_analysis',
  description: 'Custom project analysis',
  parameters: {
    input: { type: 'string', required: true }
  }
}, async (params) => {
  // Custom logic here
  return { result: 'Analysis complete' }
})

// Use the custom tool
const result = await mcpServer.executeTool('custom_analysis', {
  input: 'my-project'
})`
    }
  ],
  
  bestPractices: [
    'Implement proper authentication for production use',
    'Use rate limiting to prevent abuse',
    'Monitor tool execution metrics',
    'Implement request validation',
    'Use circuit breakers for external services',
    'Cache frequently accessed data',
    'Log all tool executions for audit',
    'Implement graceful shutdown',
    'Use health checks for monitoring',
    'Version your MCP tools properly'
  ],
  
  security: [
    'Authenticate all MCP requests',
    'Validate tool parameters strictly',
    'Implement rate limiting per client',
    'Use encryption for sensitive data',
    'Audit all tool executions',
    'Implement access control for tools',
    'Sanitize all user inputs',
    'Use secure WebSocket connections',
    'Implement request signing',
    'Monitor for suspicious activity'
  ],
  
  testing: {
    unit: {
      framework: 'jest',
      coverage: 90,
      focus: ['tool-validation', 'parameter-checking', 'error-handling']
    },
    integration: {
      framework: 'jest',
      coverage: 85,
      focus: ['pattern-integration', 'websocket-communication', 'api-endpoints']
    },
    e2e: {
      framework: 'playwright',
      coverage: 80,
      focus: ['tool-execution', 'real-time-sync', 'deployment-flow']
    }
  },
  
  monitoring: [
    {
      metric: 'uptime',
      type: 'gauge',
      unit: 'seconds'
    },
    {
      metric: 'requests_total',
      type: 'counter',
      unit: 'count'
    },
    {
      metric: 'tool_execution_duration',
      type: 'histogram',
      unit: 'milliseconds'
    },
    {
      metric: 'active_connections',
      type: 'gauge',
      unit: 'count'
    },
    {
      metric: 'error_rate',
      type: 'gauge',
      unit: 'percentage'
    }
  ],
  
  providerConfigurations: {
    aws: {
      services: ['API Gateway', 'Lambda', 'ECS', 'DynamoDB', 'CloudWatch'],
      infrastructure: 'CDK',
      cost: 'medium'
    },
    firebase: {
      services: ['Cloud Functions', 'Firestore', 'Cloud Run'],
      infrastructure: 'Firebase CLI',
      cost: 'low'
    },
    local: {
      services: ['Node.js', 'WebSocket Server', 'Local Storage'],
      infrastructure: 'Docker',
      cost: 'free'
    }
  },
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'vibe-coded',
    vibeCodingPercentage: 95,
    builtWith: ['claude-conversation-system', 'multi-provider-abstraction'],
    canBuildConstructs: true,
    timeToCreate: 180
  },
  
  performance: {
    startupTime: '<5s',
    requestLatency: '<100ms',
    throughput: '>1000 req/s',
    memoryUsage: '<512MB',
    cpuUsage: '<50%'
  },
  
  scalability: {
    horizontal: true,
    vertical: true,
    autoScaling: true,
    loadBalancing: true,
    caching: true
  },
  
  compatibility: {
    mcpVersion: '1.0.0',
    nodeVersion: '>=18.0.0',
    browsers: ['modern'],
    platforms: ['linux', 'macos', 'windows', 'docker']
  },
  
  roadmap: [
    {
      version: '1.1.0',
      features: ['GraphQL support', 'Plugin marketplace', 'Tool versioning']
    },
    {
      version: '1.2.0',
      features: ['Multi-tenancy', 'Tool composition', 'Visual tool builder']
    },
    {
      version: '2.0.0',
      features: ['AI-powered tool generation', 'Distributed execution', 'Tool federation']
    }
  ],
  
  createInstance: (config) => new LoveClaudeCodeMCPServer(config)
}