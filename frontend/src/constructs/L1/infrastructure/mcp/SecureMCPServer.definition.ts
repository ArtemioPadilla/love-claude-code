/**
 * Secure MCP Server Definition
 * Platform construct definition for the Secure MCP Server
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { SecureMCPServer } from './SecureMCPServer'

export const secureMCPServerDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-secure-mcp-server',
  name: 'Secure MCP Server',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L1,
  description: 'Production-ready MCP server with JWT/OAuth authentication, rate limiting, encryption, and comprehensive monitoring',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'mcp', 'server', 'security'],
  tags: [
    'mcp-server',
    'authentication',
    'jwt',
    'oauth',
    'rate-limiting',
    'encryption',
    'monitoring',
    'tool-management',
    'websocket',
    'rpc',
    'secure',
    'production-ready'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'mcp-protocol',
    'jwt-authentication',
    'oauth-integration',
    'rate-limiting',
    'message-encryption',
    'tool-registry',
    'websocket-communication',
    'rpc-endpoints',
    'monitoring-metrics',
    'health-checks',
    'session-management',
    'permission-based-access'
  ],
  
  inputs: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Server name for identification'
    },
    {
      name: 'version',
      type: 'string',
      required: true,
      description: 'Server version'
    },
    {
      name: 'wsEndpoint',
      type: 'string',
      required: true,
      description: 'WebSocket endpoint URL'
    },
    {
      name: 'rpcEndpoint',
      type: 'string',
      required: true,
      description: 'RPC endpoint URL'
    },
    {
      name: 'auth',
      type: 'object',
      required: true,
      description: 'Authentication configuration',
      validation: {
        properties: {
          enabled: { type: 'boolean' },
          method: { enum: ['jwt', 'oauth', 'apiKey'] },
          publicKey: { type: 'string' },
          providers: { type: 'array' }
        }
      }
    },
    {
      name: 'rateLimit',
      type: 'object',
      required: true,
      description: 'Rate limiting configuration',
      validation: {
        properties: {
          enabled: { type: 'boolean' },
          windowMs: { type: 'number', min: 1000 },
          maxRequests: { type: 'number', min: 1 },
          maxBurst: { type: 'number' }
        }
      }
    },
    {
      name: 'encryption',
      type: 'object',
      required: true,
      description: 'Encryption configuration',
      validation: {
        properties: {
          enabled: { type: 'boolean' },
          algorithm: { enum: ['aes-256-gcm', 'aes-256-cbc'] },
          keyRotationInterval: { type: 'number' }
        }
      }
    },
    {
      name: 'tools',
      type: 'array',
      required: false,
      description: 'Initial tools to register'
    },
    {
      name: 'monitoring',
      type: 'boolean',
      required: false,
      description: 'Enable monitoring and metrics collection'
    }
  ],
  
  outputs: [
    {
      name: 'status',
      type: 'string',
      description: 'Server status: starting, running, stopped, error'
    },
    {
      name: 'executeTool',
      type: 'function',
      description: 'Execute a registered tool with authentication'
    },
    {
      name: 'registerTool',
      type: 'function',
      description: 'Register a new tool (requires admin role)'
    },
    {
      name: 'getMetrics',
      type: 'function',
      description: 'Get server metrics and statistics'
    },
    {
      name: 'stop',
      type: 'function',
      description: 'Stop the server gracefully'
    }
  ],
  
  events: [
    {
      name: 'onToolRegistered',
      description: 'Fired when a new tool is registered'
    },
    {
      name: 'onToolExecuted',
      description: 'Fired when a tool is successfully executed'
    },
    {
      name: 'onAuthFailure',
      description: 'Fired when authentication fails'
    },
    {
      name: 'onRateLimitExceeded',
      description: 'Fired when rate limit is exceeded'
    },
    {
      name: 'onError',
      description: 'Fired when an error occurs'
    }
  ],
  
  configuration: {
    name: 'Love Claude Code MCP Server',
    version: '1.0.0',
    wsEndpoint: 'ws://localhost:8080/mcp',
    rpcEndpoint: 'http://localhost:8081/mcp/rpc',
    auth: {
      enabled: true,
      method: 'jwt',
      publicKey: process.env.MCP_JWT_PUBLIC_KEY
    },
    rateLimit: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      maxBurst: 20
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 86400000 // 24 hours
    },
    monitoring: true
  },
  
  examples: [
    {
      name: 'Basic Secure MCP Server',
      description: 'Create a secure MCP server with JWT authentication',
      code: `<SecureMCPServer
  config={{
    name: 'My Secure MCP Server',
    version: '1.0.0',
    wsEndpoint: 'wss://api.example.com/mcp',
    rpcEndpoint: 'https://api.example.com/mcp/rpc',
    auth: {
      enabled: true,
      method: 'jwt',
      publicKey: process.env.JWT_PUBLIC_KEY
    },
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm'
    }
  }}
  onToolExecuted={(tool, result) => {
    console.log('Tool', tool, 'executed:', result)
  }}
  onAuthFailure={(reason) => {
    console.error('Auth failed:', reason)
  }}
/>`,
      language: 'typescript'
    },
    {
      name: 'OAuth-enabled MCP Server',
      description: 'MCP server with OAuth authentication',
      code: `const server = new SecureMCPServer({
  config: {
    name: 'OAuth MCP Server',
    version: '2.0.0',
    wsEndpoint: 'wss://mcp.example.com/ws',
    rpcEndpoint: 'https://mcp.example.com/rpc',
    auth: {
      enabled: true,
      method: 'oauth',
      providers: ['github', 'google']
    },
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 200,
      maxBurst: 50
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 43200000 // 12 hours
    },
    tools: [
      {
        name: 'analyze_code',
        description: 'Analyzes code quality',
        parameters: {
          path: { type: 'string', required: true }
        }
      }
    ]
  }
})

// Execute a tool
const result = await server.executeTool('analyze_code', {
  path: '/src/index.ts'
}, authToken)`,
      language: 'typescript'
    },
    {
      name: 'Monitoring and Metrics',
      description: 'Access server metrics and monitoring data',
      code: `const server = useSecureMCPServer(config)

// Get metrics periodically
setInterval(() => {
  const metrics = server.getMetrics()
  console.log('Server Metrics:', {
    uptime: \`\${Math.floor(metrics.uptime / 1000)}s\`,
    requests: metrics.totalRequests,
    authFailures: metrics.authFailures,
    rateLimitHits: metrics.rateLimitHits,
    activeConnections: metrics.activeConnections,
    tools: metrics.registeredTools,
    errors: metrics.executionErrors
  })
}, 60000)

// Monitor auth failures
server.on('onAuthFailure', (reason) => {
  alerting.send({
    level: 'warning',
    message: \`Authentication failure: \${reason}\`
  })
})`,
      language: 'typescript'
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: true,
    testCoverage: 85
  },
  
  security: {
    authentication: true,
    encryption: true,
    inputValidation: true,
    outputSanitization: true
  },
  
  performance: {
    timeComplexity: 'O(1) for most operations',
    spaceComplexity: 'O(n) where n = number of tools',
    averageResponseTime: '<50ms',
    throughput: '1000+ requests/second'
  },
  
  monitoring: {
    metrics: [
      'uptime',
      'total_requests',
      'auth_failures',
      'rate_limit_hits',
      'active_connections',
      'registered_tools',
      'execution_errors'
    ],
    logs: [
      'authentication',
      'tool-execution',
      'rate-limiting',
      'errors'
    ],
    traces: ['request-flow', 'tool-execution-path']
  },
  
  dependencies: [
    {
      constructId: 'platform-l0-websocket-primitive',
      version: '1.0.0',
      optional: false
    },
    {
      constructId: 'platform-l0-rpc-primitive',
      version: '1.0.0',
      optional: false
    },
    {
      constructId: 'platform-l0-tool-registry-primitive',
      version: '1.0.0',
      optional: false
    },
    {
      constructId: 'platform-l0-message-queue-primitive',
      version: '1.0.0',
      optional: false
    }
  ],
  
  relatedConstructs: [
    'platform-l1-authenticated-tool-registry',
    'platform-l1-rate-limited-rpc',
    'platform-l1-encrypted-websocket',
    'platform-l2-mcp-server-pattern'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: ['platform-l0-websocket-primitive', 'platform-l0-rpc-primitive'],
    canBuildConstructs: false
  },
  
  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  },
  
  bestPractices: [
    'Always enable authentication in production',
    'Use HTTPS/WSS endpoints for secure communication',
    'Configure appropriate rate limits based on expected load',
    'Enable encryption for sensitive data',
    'Monitor auth failures and rate limit hits',
    'Rotate encryption keys regularly',
    'Use strong JWT signing keys',
    'Implement proper session management',
    'Log all security events for audit',
    'Keep server version updated'
  ],
  
  deployment: {
    requiredProviders: ['nodejs', 'websocket'],
    configSchema: {
      type: 'object',
      required: ['name', 'version', 'wsEndpoint', 'rpcEndpoint'],
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        wsEndpoint: { type: 'string', format: 'uri' },
        rpcEndpoint: { type: 'string', format: 'uri' },
        auth: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { enum: ['jwt', 'oauth', 'apiKey'] }
          }
        }
      }
    },
    environmentVariables: [
      'MCP_JWT_PUBLIC_KEY',
      'MCP_JWT_PRIVATE_KEY',
      'MCP_OAUTH_CLIENT_ID',
      'MCP_OAUTH_CLIENT_SECRET',
      'MCP_ENCRYPTION_KEY'
    ],
    preDeploymentChecks: [
      'validate-jwt-keys',
      'test-websocket-connection',
      'verify-rpc-endpoint'
    ],
    postDeploymentChecks: [
      'health-check',
      'auth-test',
      'rate-limit-test'
    ]
  },
  
  cost: {
    baseMonthly: 50,
    usageFactors: [
      {
        name: 'websocket-connections',
        unit: '1000 concurrent',
        costPerUnit: 10,
        typicalUsage: 5
      },
      {
        name: 'rpc-requests',
        unit: '1M requests',
        costPerUnit: 2,
        typicalUsage: 10
      },
      {
        name: 'data-transfer',
        unit: 'GB',
        costPerUnit: 0.09,
        typicalUsage: 100
      }
    ],
    notes: [
      'Costs vary by deployment provider',
      'Consider using CDN for static assets',
      'Enable compression to reduce data transfer'
    ]
  },
  
  c4: {
    type: 'Container',
    technology: 'Node.js MCP Server',
    external: false,
    containerType: 'WebApp',
    position: {
      x: 400,
      y: 200
    }
  },
  
  relationships: [
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l0-websocket-primitive',
      description: 'Uses for real-time communication',
      technology: 'WebSocket',
      type: 'sync'
    },
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l0-rpc-primitive',
      description: 'Uses for tool execution',
      technology: 'JSON-RPC',
      type: 'sync'
    },
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l0-tool-registry-primitive',
      description: 'Uses for tool management',
      technology: 'In-memory',
      type: 'sync'
    },
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l0-message-queue-primitive',
      description: 'Uses for async messaging',
      technology: 'In-memory queue',
      type: 'async'
    }
  ]
}

export { SecureMCPServer }