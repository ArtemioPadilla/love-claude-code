/**
 * L1 Rate-Limited RPC - RPC with token bucket rate limiting
 * 
 * This L1 construct wraps the L0 RPC primitive with comprehensive rate limiting
 * using the token bucket algorithm, supporting per-user and per-IP tracking.
 */

import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  SecurityConsideration,
  ValidationRule 
} from '../../types'

export const rateLimitedRPCDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-rate-limited-rpc',
  name: 'Rate-Limited RPC',
  description: 'RPC client with token bucket rate limiting, burst handling, and comprehensive monitoring',
  level: ConstructLevel.L1,
  type: ConstructType.Infrastructure,
  category: 'networking',
  version: '1.0.0',
  status: 'stable',
  author: {
    name: 'Love Claude Code Platform',
    email: 'platform@loveclaudecode.com'
  },
  
  dependencies: [
    // L0 RPC Primitive
    { constructId: 'platform-l0-rpc-primitive', level: ConstructLevel.L0, optional: false },
    // L0 Infrastructure for auth context
    { constructId: 'platform-l0-auth-token-primitive', level: ConstructLevel.L0, optional: true }
  ],
  
  inputs: [
    {
      name: 'bucketConfig',
      type: 'TokenBucketConfig',
      description: 'Token bucket configuration',
      required: true,
      defaultValue: {
        capacity: 100,          // Maximum tokens in bucket
        refillRate: 10,         // Tokens per second
        refillInterval: 100     // Refill interval in ms
      }
    },
    {
      name: 'burstConfig',
      type: 'BurstConfig',
      description: 'Burst handling configuration',
      required: false,
      defaultValue: {
        enabled: true,
        burstCapacity: 150,     // 50% extra for bursts
        burstRecoveryTime: 60000, // 1 minute recovery
        gracePeriod: 5000       // 5 second grace period
      }
    },
    {
      name: 'trackingConfig',
      type: 'TrackingConfig',
      description: 'User and IP tracking configuration',
      required: false,
      defaultValue: {
        trackUsers: true,
        trackIPs: true,
        userTTL: 3600000,       // 1 hour TTL
        ipTTL: 1800000,         // 30 minutes TTL
        cleanupInterval: 300000  // 5 minute cleanup
      }
    },
    {
      name: 'rateLimitHeaders',
      type: 'RateLimitHeaderConfig',
      description: 'Rate limit response headers configuration',
      required: false,
      defaultValue: {
        enabled: true,
        headerPrefix: 'X-RateLimit',
        includeRetryAfter: true,
        includePolicy: true
      }
    },
    {
      name: 'distributedConfig',
      type: 'DistributedConfig',
      description: 'Distributed rate limiting configuration (Redis)',
      required: false,
      defaultValue: {
        enabled: false,
        redisUrl: null,
        keyPrefix: 'ratelimit:',
        syncInterval: 1000
      }
    }
  ],
  
  outputs: [
    {
      name: 'client',
      type: 'RateLimitedRPCClient',
      description: 'Rate-limited RPC client instance'
    },
    {
      name: 'call',
      type: '(method: string, params?: any) => Promise<any>',
      description: 'Make a rate-limited RPC call'
    },
    {
      name: 'batchCall',
      type: '(calls: Array<{method: string, params?: any}>) => Promise<any[]>',
      description: 'Make multiple rate-limited RPC calls'
    },
    {
      name: 'getTokens',
      type: '(identifier: string) => number',
      description: 'Get available tokens for a user/IP'
    },
    {
      name: 'resetBucket',
      type: '(identifier: string) => void',
      description: 'Reset token bucket for a user/IP'
    },
    {
      name: 'metrics',
      type: 'RateLimitMetrics',
      description: 'Real-time rate limiting metrics'
    }
  ],
  
  properties: [
    {
      name: 'totalRequests',
      type: 'number',
      description: 'Total number of requests processed',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'limitedRequests',
      type: 'number',
      description: 'Number of rate-limited requests',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'activeUsers',
      type: 'number',
      description: 'Number of actively tracked users',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'activeIPs',
      type: 'number',
      description: 'Number of actively tracked IPs',
      visibility: 'public',
      modifiable: false
    }
  ],
  
  methods: [
    {
      name: 'configure',
      description: 'Configure rate limiting parameters',
      parameters: [
        { name: 'config', type: 'Partial<RateLimitConfig>', description: 'New configuration' }
      ],
      returnType: 'void',
      visibility: 'public'
    },
    {
      name: 'addWhitelist',
      description: 'Add user or IP to whitelist',
      parameters: [
        { name: 'identifier', type: 'string', description: 'User ID or IP address' },
        { name: 'type', type: "'user' | 'ip'", description: 'Identifier type' }
      ],
      returnType: 'void',
      visibility: 'public'
    },
    {
      name: 'removeWhitelist',
      description: 'Remove from whitelist',
      parameters: [
        { name: 'identifier', type: 'string', description: 'User ID or IP address' }
      ],
      returnType: 'void',
      visibility: 'public'
    },
    {
      name: 'addBlacklist',
      description: 'Add user or IP to blacklist',
      parameters: [
        { name: 'identifier', type: 'string', description: 'User ID or IP address' },
        { name: 'duration', type: 'number', description: 'Block duration in ms', optional: true }
      ],
      returnType: 'void',
      visibility: 'public'
    },
    {
      name: 'getBucketStatus',
      description: 'Get token bucket status for identifier',
      parameters: [
        { name: 'identifier', type: 'string', description: 'User ID or IP address' }
      ],
      returnType: 'TokenBucketStatus',
      visibility: 'public'
    },
    {
      name: 'exportMetrics',
      description: 'Export rate limiting metrics',
      parameters: [
        { name: 'format', type: "'json' | 'prometheus'", description: 'Export format', optional: true }
      ],
      returnType: 'string',
      visibility: 'public'
    }
  ],
  
  events: [
    {
      name: 'rateLimitExceeded',
      description: 'Emitted when rate limit is exceeded',
      payload: {
        identifier: 'string',
        type: "'user' | 'ip'",
        limit: 'number',
        retryAfter: 'number',
        requestInfo: 'any'
      }
    },
    {
      name: 'burstActivated',
      description: 'Emitted when burst capacity is used',
      payload: {
        identifier: 'string',
        normalCapacity: 'number',
        burstCapacity: 'number',
        tokensUsed: 'number'
      }
    },
    {
      name: 'bucketExhausted',
      description: 'Emitted when token bucket is empty',
      payload: {
        identifier: 'string',
        nextRefillTime: 'number',
        estimatedWaitTime: 'number'
      }
    },
    {
      name: 'blacklistTriggered',
      description: 'Emitted when blacklisted entity attempts request',
      payload: {
        identifier: 'string',
        type: "'user' | 'ip'",
        remainingBlockTime: 'number'
      }
    }
  ],
  
  constraints: {
    performance: {
      maxTrackedEntities: 10000,
      lookupTimeMs: 1,
      refillOverheadMs: 5,
      cleanupIntervalMs: 300000
    },
    security: [
      {
        type: 'rate-limiting',
        description: 'Token bucket algorithm prevents abuse and ensures fair usage',
        level: 'required'
      },
      {
        type: 'ddos-protection',
        description: 'Per-IP rate limiting provides DDoS protection',
        level: 'required'
      },
      {
        type: 'monitoring',
        description: 'Comprehensive metrics for detecting attack patterns',
        level: 'required'
      }
    ] as SecurityConsideration[],
    compatibility: {
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
      platforms: ['windows', 'macos', 'linux'],
      nodeVersion: '>=18.0.0'
    }
  },
  
  exampleUsage: `// Create rate-limited RPC client
const rpcClient = new RateLimitedRPC({
  bucketConfig: {
    capacity: 100,      // 100 requests
    refillRate: 10,     // 10 per second
    refillInterval: 100 // Check every 100ms
  },
  burstConfig: {
    enabled: true,
    burstCapacity: 150, // Allow bursts up to 150
    gracePeriod: 5000   // 5 second grace period
  },
  trackingConfig: {
    trackUsers: true,
    trackIPs: true,
    userTTL: 3600000   // Track users for 1 hour
  }
})

// Make rate-limited RPC calls
try {
  const response = await rpcClient.call({
    method: 'processData',
    params: { data: largeDataset },
    userId: 'user123',      // For user tracking
    clientIP: '192.168.1.1' // For IP tracking
  })
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log(\`Retry after \${error.retryAfter} seconds\`)
  }
}

// Monitor rate limiting
rpcClient.on('rateLimitExceeded', (event) => {
  console.warn(\`Rate limit hit for \${event.identifier}\`)
  // Could trigger alerts or adjust limits
})

// Check bucket status
const status = rpcClient.getBucketStatus('user123')
console.log(\`Tokens available: \${status.availableTokens}/\${status.capacity}\`)

// Whitelist power users
rpcClient.addWhitelist('premium-user-456', 'user')

// Temporarily block abusive IP
rpcClient.addBlacklist('10.0.0.1', 3600000) // 1 hour`,
  
  tests: {
    unit: [
      'Token bucket refill logic',
      'Rate limit calculation accuracy',
      'Burst capacity handling',
      'TTL and cleanup mechanisms',
      'Header generation',
      'Whitelist/blacklist functionality'
    ],
    integration: [
      'RPC calls with rate limiting',
      'User vs IP tracking',
      'Distributed rate limiting',
      'Grace period behavior',
      'Metric collection accuracy'
    ],
    e2e: [
      'Sustained load handling',
      'Burst traffic patterns',
      'Multi-user scenarios',
      'Recovery after exhaustion',
      'Attack simulation'
    ]
  },
  
  monitoring: {
    metrics: [
      'rpc_requests_total',
      'rpc_requests_limited',
      'token_buckets_active',
      'token_refills_per_second',
      'burst_activations',
      'blacklist_blocks',
      'average_tokens_available',
      'rate_limit_violations_per_minute'
    ],
    logs: [
      'Rate limit violations',
      'Burst activations',
      'Blacklist triggers',
      'Bucket exhaustions',
      'Configuration changes'
    ],
    alerts: [
      {
        name: 'High rate limit violations',
        condition: 'violations_per_minute > 100',
        severity: 'warning'
      },
      {
        name: 'Potential DDoS attack',
        condition: 'unique_ips_limited > 50 AND time_window < 60s',
        severity: 'critical'
      },
      {
        name: 'Token bucket memory pressure',
        condition: 'tracked_entities > 8000',
        severity: 'warning'
      }
    ]
  },
  
  documentation: {
    examples: [
      {
        title: 'Basic Rate Limiting',
        code: `const client = new RateLimitedRPC({
  bucketConfig: { capacity: 60, refillRate: 1 }
})`
      },
      {
        title: 'Custom Headers',
        code: `// Access rate limit info from headers
response.headers['X-RateLimit-Limit']
response.headers['X-RateLimit-Remaining']
response.headers['X-RateLimit-Reset']`
      },
      {
        title: 'Distributed Setup',
        code: `const client = new RateLimitedRPC({
  distributedConfig: {
    enabled: true,
    redisUrl: 'redis://localhost:6379'
  }
})`
      }
    ],
    tutorials: [
      'Understanding token bucket algorithm',
      'Configuring burst handling',
      'Setting up distributed rate limiting',
      'Monitoring and alerting best practices'
    ],
    apiReference: 'https://docs.loveclaudecode.com/constructs/l1/rate-limited-rpc'
  },
  
  metadata: {
    tags: ['rpc', 'rate-limiting', 'token-bucket', 'ddos-protection', 'infrastructure'],
    changelog: [
      {
        version: '1.0.0',
        date: '2025-01-23',
        changes: ['Initial release with token bucket rate limiting']
      }
    ],
    requirements: [
      'Redis for distributed rate limiting (optional)',
      'Accurate time synchronization for distributed setup',
      'Sufficient memory for tracking entities'
    ]
  }
}