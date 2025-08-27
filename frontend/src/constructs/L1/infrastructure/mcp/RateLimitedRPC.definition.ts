/**
 * Rate Limited RPC Definition
 * Platform construct definition for the Rate Limited RPC
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { RateLimitedRPC } from './RateLimitedRPC'

export const rateLimitedRPCDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-rate-limited-rpc',
  name: 'Rate Limited RPC',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L1,
  description: 'Production-ready RPC service with token bucket rate limiting, per-user/per-IP tracking, burst handling, and rate limit headers',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'mcp', 'rpc', 'rate-limiting'],
  tags: [
    'rpc',
    'json-rpc',
    'rate-limiting',
    'token-bucket',
    'burst-handling',
    'per-user-tracking',
    'per-ip-tracking',
    'rate-headers',
    'api-protection',
    'throttling'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'json-rpc-2.0',
    'token-bucket-algorithm',
    'burst-allowance',
    'per-client-tracking',
    'rate-limit-headers',
    'custom-key-extraction',
    'skip-rules',
    'metrics-collection',
    'batch-requests',
    'automatic-cleanup'
  ],
  
  inputs: [
    {
      name: 'endpoint',
      type: 'string',
      required: true,
      description: 'RPC endpoint URL',
      example: 'https://api.example.com/rpc'
    },
    {
      name: 'rateLimitConfig',
      type: 'object',
      required: true,
      description: 'Rate limiting configuration',
      validation: {
        properties: {
          enabled: { type: 'boolean' },
          windowMs: { type: 'number', min: 1000 },
          maxRequests: { type: 'number', min: 1 },
          maxBurst: { type: 'number', min: 1 },
          limitBy: { enum: ['ip', 'user', 'apiKey', 'custom'] },
          skipSuccessful: { type: 'boolean' },
          skipFailed: { type: 'boolean' },
          includeHeaders: { type: 'boolean' },
          refillRate: { type: 'number', min: 0.1 }
        }
      }
    },
    {
      name: 'timeout',
      type: 'number',
      required: false,
      description: 'Request timeout in milliseconds',
      defaultValue: 30000,
      validation: {
        min: 1000,
        max: 300000
      }
    },
    {
      name: 'maxRetries',
      type: 'number',
      required: false,
      description: 'Maximum retry attempts',
      defaultValue: 3,
      validation: {
        min: 0,
        max: 10
      }
    },
    {
      name: 'headers',
      type: 'object',
      required: false,
      description: 'Additional headers for requests'
    },
    {
      name: 'keyExtractor',
      type: 'function',
      required: false,
      description: 'Custom function to extract rate limit key from request'
    }
  ],
  
  outputs: [
    {
      name: 'call',
      type: 'function',
      description: 'Make a rate-limited RPC call'
    },
    {
      name: 'batchCall',
      type: 'function',
      description: 'Make multiple rate-limited RPC calls'
    },
    {
      name: 'getRateLimitStatus',
      type: 'function',
      description: 'Get current rate limit status for a key'
    },
    {
      name: 'resetRateLimit',
      type: 'function',
      description: 'Reset rate limit for a specific key'
    },
    {
      name: 'getMetrics',
      type: 'function',
      description: 'Get rate limiting metrics'
    },
    {
      name: 'clearAllLimits',
      type: 'function',
      description: 'Clear all rate limits'
    }
  ],
  
  events: [
    {
      name: 'onRateLimitExceeded',
      description: 'Fired when rate limit is exceeded'
    },
    {
      name: 'onRequest',
      description: 'Fired before sending request'
    },
    {
      name: 'onResponse',
      description: 'Fired after receiving response'
    },
    {
      name: 'onError',
      description: 'Fired when an error occurs'
    }
  ],
  
  configuration: {
    endpoint: 'https://api.example.com/rpc',
    rateLimitConfig: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      maxBurst: 20,
      limitBy: 'ip',
      includeHeaders: true,
      skipSuccessful: false,
      skipFailed: false
    },
    timeout: 30000,
    maxRetries: 3
  },
  
  examples: [
    {
      name: 'Basic Rate Limited RPC',
      description: 'Simple rate limiting by IP address',
      code: `<RateLimitedRPC
  endpoint="https://api.example.com/rpc"
  rateLimitConfig={{
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: 60, // 1 per second average
    limitBy: 'ip'
  }}
  onRateLimitExceeded={(key, status) => {
    console.log(\`Rate limit exceeded for \${key}\`)
    console.log(\`Retry after \${status.retryAfter} seconds\`)
  }}
/>`,
      language: 'typescript'
    },
    {
      name: 'Token Bucket with Burst',
      description: 'Allow burst traffic with token bucket algorithm',
      code: `const rpc = new RateLimitedRPC()

await rpc.initialize({
  endpoint: 'https://api.example.com/rpc',
  rateLimitConfig: {
    enabled: true,
    windowMs: 60000,
    maxRequests: 100,
    maxBurst: 50, // Allow 50 requests burst
    refillRate: 1.67, // 100 requests/minute
    limitBy: 'user',
    includeHeaders: true
  }
})

// Make RPC call
try {
  const response = await rpc.call({
    jsonrpc: '2.0',
    method: 'getUser',
    params: { id: 123 },
    id: 1,
    headers: { 'x-user-id': 'user123' }
  })
  
  // Rate limit headers included in response
  console.log('Remaining:', response.headers['X-RateLimit-Remaining'])
  console.log('Reset:', response.headers['X-RateLimit-Reset'])
} catch (error) {
  if (error.code === -32000) {
    console.error('Rate limit exceeded')
  }
}`,
      language: 'typescript'
    },
    {
      name: 'Custom Key Extraction',
      description: 'Use custom logic to determine rate limit key',
      code: `<RateLimitedRPC
  endpoint="https://api.example.com/rpc"
  rateLimitConfig={{
    enabled: true,
    windowMs: 3600000, // 1 hour
    maxRequests: 1000,
    limitBy: 'custom',
    keyExtractor: (request) => {
      // Rate limit by API key and method combination
      const apiKey = request.headers?.['x-api-key'] || 'anonymous'
      const method = request.method
      return \`\${apiKey}:\${method}\`
    },
    skipSuccessful: false,
    skipFailed: true // Don't count failures
  }}
  onRequest={(request) => {
    console.log(\`RPC call: \${request.method}\`)
  }}
  onResponse={(response) => {
    if (!response.error) {
      console.log('Success:', response.result)
    }
  }}
/>`,
      language: 'typescript'
    },
    {
      name: 'Monitoring and Metrics',
      description: 'Track rate limiting metrics',
      code: `const rpc = useRateLimitedRPC(config)

// Periodic metrics collection
setInterval(() => {
  const metrics = rpc.getMetrics()
  console.log('Rate Limit Metrics:', {
    total: metrics.totalRequests,
    allowed: metrics.allowedRequests,
    blocked: metrics.blockedRequests,
    blockRate: (metrics.blockedRequests / metrics.totalRequests * 100).toFixed(2) + '%',
    uniqueClients: metrics.uniqueClients,
    avgTokensUsed: metrics.averageTokensUsed.toFixed(2)
  })
  
  // Alert if block rate is too high
  if (metrics.blockedRequests / metrics.totalRequests > 0.1) {
    alert('High rate limit block rate detected!')
  }
}, 60000)

// Check specific client status
const status = rpc.getRateLimitStatus('user123')
if (status.remaining < 10) {
  console.warn(\`Low rate limit for user123: \${status.remaining} requests remaining\`)
}`,
      language: 'typescript'
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: true,
    testCoverage: 95
  },
  
  security: {
    authentication: false,
    encryption: true,
    inputValidation: true,
    outputSanitization: true
  },
  
  performance: {
    timeComplexity: 'O(1) for rate checks',
    spaceComplexity: 'O(n) where n = number of unique clients',
    averageResponseTime: '<5ms overhead',
    throughput: '10000+ requests/second'
  },
  
  monitoring: {
    metrics: [
      'total_requests',
      'allowed_requests',
      'blocked_requests',
      'unique_clients',
      'average_tokens_used',
      'bucket_refill_rate',
      'response_time'
    ],
    logs: [
      'rate-limit-exceeded',
      'bucket-creation',
      'bucket-cleanup',
      'errors'
    ],
    traces: ['request-flow', 'rate-limit-check']
  },
  
  dependencies: [
    {
      constructId: 'platform-l0-rpc-primitive',
      version: '1.0.0',
      optional: false
    }
  ],
  
  relatedConstructs: [
    'platform-l1-secure-mcp-server',
    'platform-l0-rpc-primitive',
    'platform-l2-mcp-server-pattern'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: ['platform-l0-rpc-primitive'],
    canBuildConstructs: false
  },
  
  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  },
  
  bestPractices: [
    'Set appropriate rate limits based on expected usage',
    'Use burst allowance for legitimate traffic spikes',
    'Include rate limit headers for client awareness',
    'Monitor block rates to detect attacks',
    'Use different limits for different API methods',
    'Implement gradual backoff for repeated violations',
    'Consider skipping failed requests from rate limit',
    'Clean up stale buckets periodically',
    'Log rate limit violations for analysis',
    'Provide clear error messages with retry information'
  ],
  
  deployment: {
    requiredProviders: ['nodejs'],
    configSchema: {
      type: 'object',
      required: ['endpoint', 'rateLimitConfig'],
      properties: {
        endpoint: { type: 'string', format: 'uri' },
        rateLimitConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            windowMs: { type: 'number', minimum: 1000 },
            maxRequests: { type: 'number', minimum: 1 },
            limitBy: { enum: ['ip', 'user', 'apiKey', 'custom'] }
          }
        }
      }
    },
    environmentVariables: [
      'RPC_ENDPOINT',
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX_REQUESTS'
    ],
    preDeploymentChecks: [
      'validate-endpoint-connectivity',
      'test-rate-limit-config'
    ],
    postDeploymentChecks: [
      'rate-limit-test',
      'metrics-collection-test'
    ]
  },
  
  cost: {
    baseMonthly: 5,
    usageFactors: [
      {
        name: 'requests',
        unit: '1M requests',
        costPerUnit: 0.50,
        typicalUsage: 10
      },
      {
        name: 'unique-clients',
        unit: '1000 clients',
        costPerUnit: 0.10,
        typicalUsage: 5
      }
    ],
    notes: [
      'Costs are minimal due to in-memory storage',
      'Consider Redis for distributed rate limiting',
      'Memory usage scales with unique clients'
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'Rate Limiter',
    external: false,
    containerType: 'Service',
    position: {
      x: 300,
      y: 300
    }
  },
  
  relationships: [
    {
      from: 'platform-l1-rate-limited-rpc',
      to: 'platform-l0-rpc-primitive',
      description: 'Wraps and rate limits',
      technology: 'Direct composition',
      type: 'sync'
    },
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l1-rate-limited-rpc',
      description: 'Uses for RPC communication',
      technology: 'Function calls',
      type: 'sync'
    }
  ]
}

export { RateLimitedRPC }