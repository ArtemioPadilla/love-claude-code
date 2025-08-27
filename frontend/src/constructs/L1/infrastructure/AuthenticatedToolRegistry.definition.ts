/**
 * L1 Authenticated Tool Registry - Secure tool management with RBAC
 * 
 * This L1 construct wraps the L0 Tool Registry Primitive with comprehensive
 * authentication, authorization, and audit capabilities for enterprise-grade
 * tool management in MCP environments.
 */

import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  SecurityConsideration,
  CloudProvider
} from '../../types'

export const authenticatedToolRegistryDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-authenticated-tool-registry',
  name: 'Authenticated Tool Registry',
  description: 'Secure tool registry with JWT authentication, role-based access control, usage quotas, and comprehensive audit logging',
  level: ConstructLevel.L1,
  type: ConstructType.Infrastructure,
  category: 'mcp',
  version: '1.0.0',
  status: 'stable',
  author: 'Love Claude Code Platform',
  categories: ['infrastructure', 'security', 'mcp'],
  tags: ['mcp', 'security', 'authentication', 'rbac', 'audit', 'quota', 'tool-registry'],
  
  dependencies: [
    // L0 MCP Primitives
    { constructId: 'platform-l0-tool-registry-primitive', version: '1.0.0', optional: false },
    // L0 Infrastructure Primitives for security
    { constructId: 'platform-l0-auth-token-primitive', version: '1.0.0', optional: false },
    { constructId: 'platform-l0-storage-primitive', version: '1.0.0', optional: false }, // For audit logs
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'jwt-authentication',
    'role-based-access-control',
    'tool-permissions',
    'usage-quotas',
    'audit-logging',
    'user-management',
    'role-management',
    'permission-matrix',
    'usage-analytics',
    'security-monitoring'
  ],
  
  inputs: [
    {
      name: 'authConfig',
      type: 'AuthenticationConfig',
      description: 'JWT authentication configuration',
      required: true,
      defaultValue: {
        jwtSecret: 'process.env.JWT_SECRET',
        tokenExpiry: '8h',
        refreshTokenExpiry: '30d',
        issuer: 'authenticated-tool-registry'
      }
    },
    {
      name: 'rbacConfig',
      type: 'RBACConfig',
      description: 'Role-based access control configuration',
      required: false,
      defaultValue: {
        roles: {
          admin: {
            permissions: ['tool:*', 'user:*', 'audit:*'],
            quotas: { unlimited: true }
          },
          developer: {
            permissions: ['tool:read', 'tool:execute', 'tool:register'],
            quotas: { dailyExecutions: 1000, maxRegistrations: 50 }
          },
          viewer: {
            permissions: ['tool:read', 'audit:read:own'],
            quotas: { dailyExecutions: 100, maxRegistrations: 0 }
          }
        },
        defaultRole: 'viewer'
      }
    },
    {
      name: 'quotaConfig',
      type: 'QuotaConfig',
      description: 'Usage quota configuration',
      required: false,
      defaultValue: {
        globalDailyLimit: 10000,
        perUserDailyLimit: 1000,
        perToolDailyLimit: 5000,
        quotaResetTime: '00:00',
        enableQuotaEnforcement: true
      }
    },
    {
      name: 'auditConfig',
      type: 'AuditConfig',
      description: 'Audit logging configuration',
      required: false,
      defaultValue: {
        enableAuditLogging: true,
        retentionDays: 90,
        logLevel: 'info',
        sensitiveDataMasking: true,
        complianceMode: false
      }
    },
    {
      name: 'toolAccessRules',
      type: 'ToolAccessRule[]',
      description: 'Fine-grained tool access rules',
      required: false,
      defaultValue: []
    }
  ],
  
  outputs: [
    {
      name: 'registry',
      type: 'AuthenticatedToolRegistry',
      description: 'Authenticated tool registry instance with full security features'
    },
    {
      name: 'authenticateUser',
      type: 'Function',
      description: 'Function to authenticate users and issue JWT tokens'
    },
    {
      name: 'authorizeToolAccess',
      type: 'Function',
      description: 'Function to check if user has permission to access a tool'
    },
    {
      name: 'registerToolWithAuth',
      type: 'Function',
      description: 'Function to register a tool with authentication checks'
    },
    {
      name: 'executeToolWithAuth',
      type: 'Function',
      description: 'Function to execute a tool with authentication and quota checks'
    },
    {
      name: 'getUserQuotaStatus',
      type: 'Function',
      description: 'Function to get current quota usage for a user'
    },
    {
      name: 'getAuditLogs',
      type: 'Function',
      description: 'Function to retrieve audit logs with filtering'
    },
    {
      name: 'manageUserRoles',
      type: 'Function',
      description: 'Function to assign or revoke user roles'
    },
    {
      name: 'getToolPermissionMatrix',
      type: 'Function',
      description: 'Function to get permission matrix for tools and roles'
    },
    {
      name: 'securityMetrics',
      type: 'SecurityMetrics',
      description: 'Real-time security metrics and monitoring data'
    }
  ],
  
  properties: [
    {
      name: 'isAuthenticated',
      type: 'boolean',
      description: 'Whether authentication is currently enforced',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'activeUsers',
      type: 'number',
      description: 'Number of users with active sessions',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'totalToolExecutions',
      type: 'number',
      description: 'Total number of authenticated tool executions',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'securityIncidents',
      type: 'number',
      description: 'Number of security incidents detected',
      visibility: 'public',
      modifiable: false
    },
    {
      name: 'quotaViolations',
      type: 'number',
      description: 'Number of quota violations',
      visibility: 'public',
      modifiable: false
    }
  ],
  
  methods: [
    {
      name: 'initialize',
      description: 'Initialize the authenticated tool registry',
      parameters: [],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'createUser',
      description: 'Create a new user with specified role',
      parameters: [
        { name: 'username', type: 'string', description: 'Unique username' },
        { name: 'email', type: 'string', description: 'User email' },
        { name: 'role', type: 'string', description: 'Initial role', optional: true }
      ],
      returnType: 'Promise<{ userId: string; token: string }>',
      visibility: 'public'
    },
    {
      name: 'authenticateUser',
      description: 'Authenticate user and issue JWT token',
      parameters: [
        { name: 'username', type: 'string', description: 'Username' },
        { name: 'password', type: 'string', description: 'Password' }
      ],
      returnType: 'Promise<{ token: string; refreshToken: string }>',
      visibility: 'public'
    },
    {
      name: 'refreshToken',
      description: 'Refresh JWT token',
      parameters: [
        { name: 'refreshToken', type: 'string', description: 'Refresh token' }
      ],
      returnType: 'Promise<{ token: string; refreshToken: string }>',
      visibility: 'public'
    },
    {
      name: 'revokeAccess',
      description: 'Revoke user access',
      parameters: [
        { name: 'userId', type: 'string', description: 'User to revoke' },
        { name: 'reason', type: 'string', description: 'Revocation reason' }
      ],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'setUserRole',
      description: 'Update user role',
      parameters: [
        { name: 'userId', type: 'string', description: 'User ID' },
        { name: 'role', type: 'string', description: 'New role' }
      ],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'setToolPermissions',
      description: 'Set specific permissions for a tool',
      parameters: [
        { name: 'toolName', type: 'string', description: 'Tool name' },
        { name: 'permissions', type: 'ToolPermissions', description: 'Permission configuration' }
      ],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'getQuotaUsage',
      description: 'Get quota usage for a user',
      parameters: [
        { name: 'userId', type: 'string', description: 'User ID' }
      ],
      returnType: 'Promise<QuotaUsage>',
      visibility: 'public'
    },
    {
      name: 'resetQuota',
      description: 'Reset quota for a user',
      parameters: [
        { name: 'userId', type: 'string', description: 'User ID' }
      ],
      returnType: 'Promise<void>',
      visibility: 'public'
    },
    {
      name: 'queryAuditLogs',
      description: 'Query audit logs with filters',
      parameters: [
        { name: 'filters', type: 'AuditLogFilters', description: 'Query filters' }
      ],
      returnType: 'Promise<AuditLog[]>',
      visibility: 'public'
    }
  ],
  
  security: [
    {
      aspect: 'authentication',
      description: 'JWT-based authentication for all tool access',
      severity: 'critical',
      recommendations: 'Use strong JWT secrets, implement token refresh'
    },
    {
      aspect: 'authorization',
      description: 'Role-based access control (RBAC) for operations',
      severity: 'critical',
      recommendations: 'Follow principle of least privilege'
    },
    {
      aspect: 'audit-logging',
      description: 'Comprehensive audit trail for compliance',
      severity: 'high',
      recommendations: 'Archive logs regularly, implement tamper protection'
    },
    {
      aspect: 'quota-enforcement',
      description: 'Usage quotas to prevent abuse',
      severity: 'medium',
      recommendations: 'Monitor usage patterns, set appropriate limits'
    }
  ],
  
  cost: {
    baseMonthly: 5,
    usageFactors: [
      { name: 'users', unit: 'user/month', costPerUnit: 0.10 },
      { name: 'tool-executions', unit: '1000 executions', costPerUnit: 0.001 },
      { name: 'audit-storage', unit: 'GB/month', costPerUnit: 0.05 }
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'TypeScript/JWT'
  },
  
  examples: [
    {
      title: 'Basic Setup',
      description: 'Initialize authenticated tool registry',
      code: `const registry = new AuthenticatedToolRegistry({
  authConfig: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '8h'
  },
  rbacConfig: {
    roles: {
      admin: { permissions: ['tool:*'], quotas: { unlimited: true } },
      developer: { permissions: ['tool:read', 'tool:execute'], quotas: { dailyExecutions: 1000 } }
    }
  }
})
await registry.initialize()`,
      language: 'typescript'
    }
  ],
  
  bestPractices: [
    'Use strong JWT secrets and rotate them regularly',
    'Implement proper password hashing (bcrypt, argon2)',
    'Set appropriate token expiry times',
    'Regularly review role permissions',
    'Monitor quota usage patterns',
    'Archive audit logs for compliance'
  ],
  
  deployment: {
    requiredProviders: ['jwt', 'storage'],
    configSchema: {
      type: 'object',
      properties: {
        jwtSecret: { type: 'string', minLength: 32 },
        tokenExpiry: { type: 'string', pattern: '^\\d+[hmd]$' }
      },
      required: ['jwtSecret']
    },
    environmentVariables: ['JWT_SECRET', 'AUDIT_STORAGE_PATH']
  },
  
  events: [
    {
      name: 'authenticationSuccess',
      description: 'Emitted when user successfully authenticates',
      payload: {
        userId: 'string',
        role: 'string',
        timestamp: 'Date'
      }
    },
    {
      name: 'authenticationFailure',
      description: 'Emitted when authentication fails',
      payload: {
        username: 'string',
        reason: 'string',
        ip: 'string',
        timestamp: 'Date'
      }
    },
    {
      name: 'toolAccessGranted',
      description: 'Emitted when tool access is granted',
      payload: {
        userId: 'string',
        toolName: 'string',
        action: 'string',
        timestamp: 'Date'
      }
    },
    {
      name: 'toolAccessDenied',
      description: 'Emitted when tool access is denied',
      payload: {
        userId: 'string',
        toolName: 'string',
        action: 'string',
        reason: 'string',
        timestamp: 'Date'
      }
    },
    {
      name: 'quotaExceeded',
      description: 'Emitted when user exceeds quota',
      payload: {
        userId: 'string',
        quotaType: 'string',
        limit: 'number',
        current: 'number',
        timestamp: 'Date'
      }
    },
    {
      name: 'securityAlert',
      description: 'Emitted for security-related events',
      payload: {
        type: 'string',
        severity: 'string',
        userId: 'string',
        details: 'any',
        timestamp: 'Date'
      }
    },
    {
      name: 'roleChanged',
      description: 'Emitted when user role is changed',
      payload: {
        userId: 'string',
        oldRole: 'string',
        newRole: 'string',
        changedBy: 'string',
        timestamp: 'Date'
      }
    }
  ],
  
  constraints: {
    performance: {
      maxConcurrentUsers: 10000,
      authenticationLatency: 100, // ms
      authorizationLatency: 50, // ms
      auditLogWriteLatency: 200 // ms
    },
    compatibility: {
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
      platforms: ['windows', 'macos', 'linux'],
      nodeVersion: '>=18.0.0'
    }
  },
  
  exampleUsage: `// Initialize authenticated tool registry
const registry = new AuthenticatedToolRegistry({
  authConfig: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '8h',
    refreshTokenExpiry: '30d'
  },
  rbacConfig: {
    roles: {
      admin: {
        permissions: ['tool:*', 'user:*', 'audit:*'],
        quotas: { unlimited: true }
      },
      developer: {
        permissions: ['tool:read', 'tool:execute', 'tool:register'],
        quotas: { dailyExecutions: 1000, maxRegistrations: 50 }
      },
      viewer: {
        permissions: ['tool:read'],
        quotas: { dailyExecutions: 100 }
      }
    }
  },
  auditConfig: {
    enableAuditLogging: true,
    retentionDays: 90,
    complianceMode: true
  }
})

// Initialize the registry
await registry.initialize()

// Create a user
const { userId, token } = await registry.createUser(
  'john.doe',
  'john@example.com',
  'developer'
)

// Authenticate user
const { token, refreshToken } = await registry.authenticateUser(
  'john.doe',
  'securePassword123'
)

// Register a tool with authentication
const registered = await registry.registerToolWithAuth(token, {
  name: 'code-analyzer',
  description: 'Analyzes code quality and security',
  category: 'analysis',
  parameters: {
    path: { type: 'string', required: true }
  }
})

// Execute tool with auth and quota checks
const result = await registry.executeToolWithAuth(token, 'code-analyzer', {
  path: './src'
})

// Check quota status
const quotaStatus = await registry.getUserQuotaStatus(userId)
console.log('Daily executions:', quotaStatus.dailyExecutions.used, '/', quotaStatus.dailyExecutions.limit)

// Query audit logs (admin only)
const logs = await registry.queryAuditLogs({
  userId: userId,
  action: 'tool:execute',
  startDate: new Date(Date.now() - 86400000), // Last 24 hours
  limit: 100
})

// Handle security events
registry.on('authenticationFailure', (event) => {
  console.error('Auth failure:', event.username, 'from', event.ip)
  // Implement rate limiting or blocking logic
})

registry.on('quotaExceeded', (event) => {
  console.warn('Quota exceeded for user:', event.userId)
  // Send notification or take action
})`,
  
  tests: {
    unit: [
      'JWT token generation and validation',
      'Role-based permission checking',
      'Quota calculation and enforcement',
      'Audit log formatting and storage',
      'User management operations',
      'Tool permission matrix evaluation'
    ],
    integration: [
      'Authentication flow with token refresh',
      'Tool registration with permission checks',
      'Tool execution with quota enforcement',
      'Audit log querying and filtering',
      'Role assignment and permission updates',
      'Multi-user concurrent access'
    ],
    e2e: [
      'Complete user lifecycle (create, auth, use, revoke)',
      'Tool lifecycle with security checks',
      'Quota reset and enforcement over time',
      'Security incident detection and alerting',
      'Compliance audit trail generation'
    ]
  },
  
  monitoring: {
    metrics: [
      'authentication_success_rate',
      'authentication_failure_count',
      'authorization_checks_per_second',
      'quota_violations_count',
      'active_user_sessions',
      'tool_execution_rate',
      'audit_log_write_latency',
      'token_refresh_count',
      'security_alerts_triggered'
    ],
    logs: [
      'Authentication attempts',
      'Authorization decisions',
      'Tool registrations',
      'Tool executions',
      'Quota violations',
      'Role changes',
      'Security alerts',
      'Audit queries'
    ],
    alerts: [
      {
        name: 'High authentication failure rate',
        condition: 'auth_failure_rate > 0.2',
        severity: 'high'
      },
      {
        name: 'Unusual tool execution pattern',
        condition: 'tool_execution_spike > 10x_normal',
        severity: 'medium'
      },
      {
        name: 'Quota system overload',
        condition: 'quota_check_latency > 500ms',
        severity: 'high'
      }
    ]
  },
  
  documentation: {
    examples: [
      {
        title: 'Basic Setup',
        code: `const registry = new AuthenticatedToolRegistry(config)
await registry.initialize()`
      },
      {
        title: 'Custom Role Definition',
        code: `rbacConfig.roles.customRole = {
  permissions: ['tool:read', 'tool:execute:specific'],
  quotas: { dailyExecutions: 500 }
}`
      },
      {
        title: 'Fine-grained Tool Permissions',
        code: `await registry.setToolPermissions('sensitive-tool', {
  allowedRoles: ['admin'],
  requiresMFA: true,
  auditLevel: 'detailed'
})`
      }
    ],
    tutorials: [
      'Setting up JWT authentication',
      'Configuring RBAC for your organization',
      'Implementing custom quota policies',
      'Analyzing audit logs for security',
      'Migrating from unauthenticated registry'
    ],
    apiReference: 'https://docs.loveclaudecode.com/constructs/l1/authenticated-tool-registry'
  },
  
  metadata: {
    changelog: [
      {
        version: '1.0.0',
        date: '2025-01-23',
        changes: ['Initial release with JWT auth, RBAC, quotas, and audit logging']
      }
    ],
    requirements: [
      'Secure JWT secret management (e.g., AWS Secrets Manager)',
      'Persistent storage for audit logs',
      'Time synchronization for token validation',
      'Secure password storage mechanism'
    ]
  },

  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: ['platform-l0-tool-registry-primitive', 'platform-l0-auth-token-primitive'],
    canBuildConstructs: false
  },

  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  }
}