/**
 * L1 Secure MCP Server - Configured MCP server with authentication
 * 
 * This L1 construct wraps L0 MCP primitives with security features including
 * authentication, authorization, rate limiting, and encrypted communication.
 */

import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  SecurityConsideration,
  ValidationRule 
} from '../../types'

export const secureMCPServerDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-secure-mcp-server',
  name: 'Secure MCP Server',
  description: 'MCP server with built-in authentication, authorization, and security features',
  level: ConstructLevel.L1,
  type: ConstructType.Infrastructure,
  category: 'mcp',
  version: '1.0.0',
  status: 'stable',
  author: {
    name: 'Love Claude Code Platform',
    email: 'platform@loveclaudecode.com'
  },
  
  dependencies: [
    // L0 MCP Primitives
    { constructId: 'platform-l0-websocket-primitive', level: ConstructLevel.L0, optional: false },
    { constructId: 'platform-l0-rpc-primitive', level: ConstructLevel.L0, optional: false },
    { constructId: 'platform-l0-tool-registry-primitive', level: ConstructLevel.L0, optional: false },
    { constructId: 'platform-l0-message-queue-primitive', level: ConstructLevel.L0, optional: false },
    // L0 Infrastructure Primitives for security
    { constructId: 'platform-l0-auth-token-primitive', level: ConstructLevel.L0, optional: false }
  ],
  
  inputs: [
    {
      name: 'authConfig',
      type: 'AuthenticationConfig',
      description: 'Authentication configuration including JWT settings',
      required: true,
      defaultValue: {
        jwtSecret: 'process.env.JWT_SECRET',
        tokenExpiry: '24h',
        refreshTokenExpiry: '7d'
      }
    },
    {
      name: 'rateLimitConfig',
      type: 'RateLimitConfig',
      description: 'Rate limiting configuration',
      required: false,
      defaultValue: {
        windowMs: 900000, // 15 minutes
        maxRequests: 100,
        maxWebSocketConnections: 10
      }
    },
    {
      name: 'tlsConfig',
      type: 'TLSConfig',
      description: 'TLS/SSL configuration for encrypted communication',
      required: false,
      defaultValue: {
        enabled: true,
        cert: 'path/to/cert.pem',
        key: 'path/to/key.pem'
      }
    },
    {
      name: 'corsConfig',
      type: 'CORSConfig',
      description: 'CORS configuration for browser-based clients',
      required: false,
      defaultValue: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['GET', 'POST'],
        allowCredentials: true
      }
    }
  ],
  
  outputs: [
    {
      name: 'server',
      type: 'SecureMCPServer',
      description: 'Configured MCP server instance with security features'
    },
    {
      name: 'authenticateRequest',
      type: '(token: string) => Promise<AuthResult>',
      description: 'Function to authenticate incoming requests'
    },
    {
      name: 'authorizeToolAccess',
      type: '(user: User, tool: string) => Promise<boolean>',
      description: 'Function to authorize tool access based on user permissions'
    },
    {
      name: 'rateLimiter',
      type: 'RateLimiter',
      description: 'Rate limiting middleware instance'
    },
    {
      name: 'securityMetrics',
      type: 'SecurityMetrics',
      description: 'Security metrics and monitoring data'
    }
  ],
  
  properties: [
    {
      name: 'isSecure',
      type: 'boolean',
      description: 'Whether the server is running with TLS enabled',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'activeConnections',
      type: 'number',
      description: 'Number of active authenticated connections',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'blockedRequests',
      type: 'number',
      description: 'Number of requests blocked by security measures',
      visibility: 'public',
      modifiable: false
    }
  ],
  
  methods: [
    {
      name: 'start',
      description: 'Start the secure MCP server',
      parameters: [
        { name: 'port', type: 'number', description: 'Port to listen on' },
        { name: 'host', type: 'string', description: 'Host to bind to', optional: true }
      ],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'stop',
      description: 'Stop the secure MCP server gracefully',
      parameters: [],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'addUser',
      description: 'Add a new authenticated user',
      parameters: [
        { name: 'userId', type: 'string', description: 'Unique user identifier' },
        { name: 'permissions', type: 'string[]', description: 'User permissions' }
      ],
      returnType: 'Promise<AuthToken>',
      visibility: 'public'
    },
    {
      name: 'revokeAccess',
      description: 'Revoke user access',
      parameters: [
        { name: 'userId', type: 'string', description: 'User to revoke' }
      ],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'updateRateLimits',
      description: 'Update rate limiting configuration',
      parameters: [
        { name: 'config', type: 'RateLimitConfig', description: 'New rate limit config' }
      ],
      returnType: 'void',
      visibility: 'public'
    }
  ],
  
  events: [
    {
      name: 'authenticationFailure',
      description: 'Emitted when authentication fails',
      payload: {
        ip: 'string',
        reason: 'string',
        timestamp: 'Date'
      }
    },
    {
      name: 'rateLimitExceeded',
      description: 'Emitted when rate limit is exceeded',
      payload: {
        userId: 'string',
        limit: 'number',
        window: 'number'
      }
    },
    {
      name: 'securityAlert',
      description: 'Emitted for security-related events',
      payload: {
        type: 'string',
        severity: 'string',
        details: 'any'
      }
    }
  ],
  
  constraints: {
    performance: {
      maxConcurrentConnections: 1000,
      maxRequestsPerSecond: 100,
      maxResponseTime: 500, // ms
      authenticationOverhead: 50 // ms
    },
    security: [
      {
        type: 'authentication',
        description: 'All requests must be authenticated with valid JWT tokens',
        level: 'required'
      },
      {
        type: 'encryption',
        description: 'All communication must be encrypted with TLS 1.3+',
        level: 'required'
      },
      {
        type: 'rate-limiting',
        description: 'Rate limiting must be enforced per user and IP',
        level: 'required'
      },
      {
        type: 'audit-logging',
        description: 'All security events must be logged for audit purposes',
        level: 'required'
      }
    ] as SecurityConsideration[],
    compatibility: {
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
      platforms: ['windows', 'macos', 'linux'],
      nodeVersion: '>=18.0.0'
    }
  },
  
  exampleUsage: `// Create a secure MCP server
const server = new SecureMCPServer({
  authConfig: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '24h',
    refreshTokenExpiry: '7d'
  },
  rateLimitConfig: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    maxWebSocketConnections: 10
  },
  tlsConfig: {
    enabled: true,
    cert: './certs/server.crt',
    key: './certs/server.key'
  }
})

// Start the server
await server.start(8443, '0.0.0.0')

// Add an authenticated user
const token = await server.addUser('user123', ['read', 'write', 'execute'])

// Handle security events
server.on('authenticationFailure', (event) => {
  console.error('Auth failure from', event.ip, ':', event.reason)
})

server.on('rateLimitExceeded', (event) => {
  console.warn('Rate limit exceeded for user', event.userId)
})

// Use the authentication middleware
const isAuthenticated = await server.authenticateRequest(request)

// Check tool access permissions
const canAccess = await server.authorizeToolAccess(userId, 'dangerous-tool')`,
  
  tests: {
    unit: [
      'Authentication token validation',
      'Rate limiting enforcement',
      'TLS handshake verification',
      'Permission checking logic',
      'Token refresh flow'
    ],
    integration: [
      'WebSocket upgrade with auth',
      'RPC call authentication',
      'Tool registry access control',
      'Message queue security',
      'Multi-user connection handling'
    ],
    e2e: [
      'Complete auth flow with client',
      'Rate limit testing under load',
      'Security event logging',
      'Graceful shutdown with active connections',
      'Token expiry and refresh'
    ]
  },
  
  monitoring: {
    metrics: [
      'authentication_success_rate',
      'authentication_failure_count',
      'rate_limit_violations',
      'active_authenticated_connections',
      'token_refresh_count',
      'security_alerts_triggered'
    ],
    logs: [
      'Authentication attempts',
      'Authorization decisions',
      'Rate limit violations',
      'Security alerts',
      'Connection lifecycle'
    ],
    alerts: [
      {
        name: 'High authentication failure rate',
        condition: 'auth_failure_rate > 0.1',
        severity: 'high'
      },
      {
        name: 'DDoS attack detected',
        condition: 'rate_limit_violations > 100/min',
        severity: 'critical'
      }
    ]
  },
  
  documentation: {
    examples: [
      {
        title: 'Basic Setup',
        code: `const server = new SecureMCPServer(config)
await server.start(8443)`
      },
      {
        title: 'Custom Authentication',
        code: `server.authenticateRequest = async (req) => {
  // Custom auth logic
  return validateCustomToken(req.headers.authorization)
}`
      }
    ],
    tutorials: [
      'Setting up JWT authentication',
      'Configuring rate limits',
      'Implementing custom authorization',
      'Monitoring security metrics'
    ],
    apiReference: 'https://docs.loveclaudecode.com/constructs/l1/secure-mcp-server'
  },
  
  metadata: {
    tags: ['mcp', 'security', 'authentication', 'rate-limiting', 'infrastructure'],
    changelog: [
      {
        version: '1.0.0',
        date: '2025-01-20',
        changes: ['Initial release with JWT auth, rate limiting, and TLS support']
      }
    ],
    requirements: [
      'Valid TLS certificates for production use',
      'Secure JWT secret management',
      'Redis for distributed rate limiting (optional)'
    ]
  }
}