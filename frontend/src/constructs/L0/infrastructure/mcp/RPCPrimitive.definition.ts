/**
 * RPC Primitive Definition
 * Platform construct definition for the RPC primitive
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { RPCPrimitive } from './RPCPrimitive'

export const rpcPrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-rpc-primitive',
  name: 'RPC Primitive',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L0,
  description: 'Raw RPC (Remote Procedure Call) communication handling with request/response pattern and retry logic',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['networking', 'communication', 'api', 'mcp'],
  tags: [
    'rpc',
    'json-rpc',
    'remote-procedure-call',
    'api-client',
    'primitive',
    'mcp-foundation'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'rpc-calls',
    'batch-requests',
    'auto-retry',
    'timeout-handling',
    'request-cancellation',
    'json-rpc-2.0'
  ],
  
  inputs: [
    {
      name: 'endpoint',
      type: 'string',
      required: true,
      description: 'RPC endpoint URL'
    },
    {
      name: 'timeout',
      type: 'number',
      required: false,
      description: 'Request timeout in milliseconds'
    },
    {
      name: 'maxRetries',
      type: 'number',
      required: false,
      description: 'Maximum number of retry attempts'
    },
    {
      name: 'retryDelay',
      type: 'number',
      required: false,
      description: 'Base delay between retry attempts (ms)'
    },
    {
      name: 'headers',
      type: 'object',
      required: false,
      description: 'Custom request headers'
    },
    {
      name: 'method',
      type: 'string',
      required: false,
      description: 'HTTP method (POST, GET, PUT, DELETE)'
    },
    {
      name: 'contentType',
      type: 'string',
      required: false,
      description: 'Content-Type header value'
    }
  ],
  
  outputs: [
    {
      name: 'call',
      type: 'function',
      description: 'Function to make a single RPC call'
    },
    {
      name: 'batchCall',
      type: 'function',
      description: 'Function to make multiple RPC calls in batch'
    },
    {
      name: 'cancel',
      type: 'function',
      description: 'Function to cancel pending requests'
    },
    {
      name: 'pendingRequests',
      type: 'number',
      description: 'Number of currently pending requests'
    },
    {
      name: 'isCalling',
      type: 'boolean',
      description: 'Whether any RPC call is in progress'
    }
  ],
  
  events: [
    {
      name: 'onResponse',
      description: 'Fired when an RPC response is received'
    },
    {
      name: 'onError',
      description: 'Fired when an RPC error occurs'
    },
    {
      name: 'onRetrying',
      description: 'Fired when retrying a failed request'
    }
  ],
  
  configuration: {
    endpoint: 'http://localhost:3000/rpc',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    method: 'POST',
    contentType: 'application/json'
  },
  
  examples: [
    {
      name: 'Simple RPC Call',
      description: 'Basic RPC method invocation',
      code: `<RPCPrimitive
  config={{
    endpoint: 'http://localhost:3000/rpc'
  }}
  onResponse={(response) => console.log('Result:', response.result)}
  onError={(error) => console.error('Error:', error)}
/>

// Usage:
const { call } = useRPCPrimitive()
const response = await call({
  method: 'getUser',
  params: { id: 123 }
})`,
      language: 'typescript',
      highlights: [10, 11, 12]
    },
    {
      name: 'Batch RPC Calls',
      description: 'Execute multiple RPC calls in batch',
      code: `<RPCPrimitive
  config={{
    endpoint: 'http://localhost:3000/rpc',
    timeout: 60000
  }}
/>

// Usage:
const { batchCall } = useRPCPrimitive()
const responses = await batchCall([
  { method: 'getUser', params: { id: 1 } },
  { method: 'getUser', params: { id: 2 } },
  { method: 'getUser', params: { id: 3 } }
])`,
      language: 'typescript',
      highlights: [9, 10, 11, 12, 13]
    },
    {
      name: 'MCP Tool Invocation',
      description: 'Using RPC for MCP tool calls',
      code: `<RPCPrimitive
  config={{
    endpoint: 'ws://localhost:3000/mcp/rpc',
    headers: {
      'Authorization': 'Bearer token',
      'X-MCP-Version': '1.0'
    }
  }}
  onResponse={handleToolResponse}
/>

// MCP tool call
const response = await call({
  method: 'tool.invoke',
  params: {
    tool: 'analyze_project',
    arguments: { path: '/src' }
  }
})`,
      language: 'typescript',
      highlights: [13, 14, 15, 16, 17]
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: false,
    testCoverage: 92
  },
  
  security: {
    authentication: true,
    encryption: true, // HTTPS
    inputValidation: true,
    outputSanitization: false
  },
  
  performance: {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(n)', // n = number of pending requests
    averageResponseTime: 'Network dependent',
    throughput: 'Limited by endpoint'
  },
  
  monitoring: {
    metrics: ['request-count', 'response-time', 'error-rate', 'retry-count'],
    logs: ['requests', 'responses', 'errors', 'retries'],
    traces: ['request-flow']
  },
  
  dependencies: [], // L0 primitives have no dependencies
  
  relatedConstructs: [
    'platform-l0-websocket-primitive',
    'platform-l0-message-queue-primitive',
    'platform-l1-authenticated-rpc',
    'platform-l1-cached-rpc'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: [],
    canBuildConstructs: false
  },
  
  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  },
  
  bestPractices: [
    'Always set appropriate timeouts for RPC calls',
    'Implement proper error handling for network failures',
    'Use batch calls when making multiple requests to the same endpoint',
    'Set reasonable retry limits to avoid infinite loops',
    'Include request IDs for correlation in distributed systems',
    'Use HTTPS endpoints in production for security',
    'Monitor error rates and adjust retry strategies accordingly'
  ],
  
  deployment: {
    requiredProviders: [],
    configSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          format: 'uri',
          description: 'RPC endpoint URL'
        },
        timeout: {
          type: 'number',
          minimum: 1000,
          maximum: 300000,
          description: 'Request timeout in milliseconds'
        },
        maxRetries: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          description: 'Maximum retry attempts'
        }
      },
      required: ['endpoint']
    },
    environmentVariables: ['RPC_ENDPOINT', 'RPC_TIMEOUT', 'RPC_AUTH_TOKEN'],
    preDeploymentChecks: ['endpoint-reachability', 'auth-validation'],
    postDeploymentChecks: ['health-check', 'sample-rpc-call']
  },
  
  cost: {
    baseMonthly: 0,
    usageFactors: [
      {
        name: 'api-calls',
        unit: '1000 calls',
        costPerUnit: 0.004,
        typicalUsage: 50000
      },
      {
        name: 'data-transfer',
        unit: 'GB',
        costPerUnit: 0.09,
        typicalUsage: 10
      }
    ],
    notes: [
      'Cost depends on the RPC endpoint provider',
      'Additional costs for HTTPS certificates if self-hosted',
      'Consider caching to reduce API calls'
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'JSON-RPC Client',
    external: false,
    position: {
      x: 100,
      y: 300
    }
  },
  
  relationships: [
    {
      from: 'platform-l0-rpc-primitive',
      to: 'external-rpc-endpoint',
      description: 'Makes RPC calls to',
      technology: 'HTTP/HTTPS',
      type: 'sync'
    }
  ]
}

export { RPCPrimitive }