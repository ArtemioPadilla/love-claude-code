/**
 * Authenticated Tool Registry Definition
 * Platform construct definition for the Authenticated Tool Registry
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { AuthenticatedToolRegistry } from './AuthenticatedToolRegistry'

export const authenticatedToolRegistryDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-authenticated-tool-registry',
  name: 'Authenticated Tool Registry',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L1,
  description: 'Secure tool registry with JWT authentication, role-based access control, usage quotas, and comprehensive audit logging',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'mcp', 'tools', 'security', 'registry'],
  tags: [
    'tool-registry',
    'authentication',
    'jwt',
    'rbac',
    'role-based-access',
    'quotas',
    'rate-limiting',
    'audit-logging',
    'permissions',
    'secure',
    'managed'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'tool-management',
    'jwt-authentication',
    'role-based-access-control',
    'usage-quotas',
    'audit-logging',
    'permission-management',
    'quota-tracking',
    'tool-versioning',
    'access-control-lists',
    'usage-analytics'
  ],
  
  inputs: [
    {
      name: 'authEnabled',
      type: 'boolean',
      required: false,
      description: 'Enable authentication checks',
      defaultValue: true
    },
    {
      name: 'rbacEnabled',
      type: 'boolean',
      required: false,
      description: 'Enable role-based access control',
      defaultValue: true
    },
    {
      name: 'quotasEnabled',
      type: 'boolean',
      required: false,
      description: 'Enable usage quotas',
      defaultValue: true
    },
    {
      name: 'auditEnabled',
      type: 'boolean',
      required: false,
      description: 'Enable audit logging',
      defaultValue: true
    },
    {
      name: 'maxTools',
      type: 'number',
      required: false,
      description: 'Maximum number of tools allowed',
      defaultValue: 1000,
      validation: {
        min: 1,
        max: 10000
      }
    },
    {
      name: 'defaultQuota',
      type: 'number',
      required: false,
      description: 'Default quota per user per day',
      defaultValue: 100,
      validation: {
        min: 1,
        max: 10000
      }
    },
    {
      name: 'adminRoles',
      type: 'array',
      required: false,
      description: 'Roles that can register/manage tools',
      defaultValue: ['admin', 'tool-admin']
    },
    {
      name: 'auditRetentionDays',
      type: 'number',
      required: false,
      description: 'Days to retain audit logs',
      defaultValue: 30,
      validation: {
        min: 1,
        max: 365
      }
    },
    {
      name: 'authManager',
      type: 'object',
      required: false,
      description: 'External auth manager instance'
    }
  ],
  
  outputs: [
    {
      name: 'register',
      type: 'function',
      description: 'Register a new tool (requires admin role)'
    },
    {
      name: 'unregister',
      type: 'function',
      description: 'Unregister a tool (requires admin role)'
    },
    {
      name: 'get',
      type: 'function',
      description: 'Get a registered tool'
    },
    {
      name: 'list',
      type: 'function',
      description: 'List all registered tools'
    },
    {
      name: 'execute',
      type: 'function',
      description: 'Execute a tool with auth and quota checks'
    },
    {
      name: 'setPermissions',
      type: 'function',
      description: 'Set tool access permissions'
    },
    {
      name: 'getPermissions',
      type: 'function',
      description: 'Get tool permissions'
    },
    {
      name: 'canAccess',
      type: 'function',
      description: 'Check if user can access tool'
    },
    {
      name: 'setQuota',
      type: 'function',
      description: 'Set user quota'
    },
    {
      name: 'getQuota',
      type: 'function',
      description: 'Get user quota'
    },
    {
      name: 'checkQuota',
      type: 'function',
      description: 'Check quota availability'
    },
    {
      name: 'getAuditLogs',
      type: 'function',
      description: 'Get audit log entries'
    }
  ],
  
  events: [
    {
      name: 'onToolRegistered',
      description: 'Fired when a tool is registered'
    },
    {
      name: 'onToolExecuted',
      description: 'Fired when a tool is executed'
    },
    {
      name: 'onAuthFailure',
      description: 'Fired when authentication fails'
    },
    {
      name: 'onQuotaExceeded',
      description: 'Fired when quota is exceeded'
    },
    {
      name: 'onAuditLog',
      description: 'Fired when audit log entry is created'
    }
  ],
  
  configuration: {
    authEnabled: true,
    rbacEnabled: true,
    quotasEnabled: true,
    auditEnabled: true,
    maxTools: 1000,
    defaultQuota: 100,
    adminRoles: ['admin', 'tool-admin'],
    auditRetentionDays: 30
  },
  
  examples: [
    {
      name: 'Basic Authenticated Registry',
      description: 'Create a tool registry with authentication',
      code: `<AuthenticatedToolRegistry
  config={{
    authEnabled: true,
    rbacEnabled: false,
    quotasEnabled: false,
    auditEnabled: true,
    adminRoles: ['admin']
  }}
  onToolRegistered={(tool, userId) => {
    console.log(\`Tool \${tool.name} registered by \${userId}\`)
  }}
  onAuthFailure={(reason) => {
    console.error('Auth failed:', reason)
  }}
/>`,
      language: 'typescript'
    },
    {
      name: 'Full-Featured Registry',
      description: 'Registry with all security features enabled',
      code: `const registry = new AuthenticatedToolRegistry()

await registry.initialize({
  authEnabled: true,
  rbacEnabled: true,
  quotasEnabled: true,
  auditEnabled: true,
  defaultQuota: 50,
  adminRoles: ['admin', 'developer'],
  auditRetentionDays: 90
})

// Register a tool (requires admin token)
const tool = {
  name: 'code-analyzer',
  description: 'Analyzes code quality',
  version: '1.0.0',
  execute: async (params) => {
    // Tool implementation
  }
}

const registered = await registry.register(tool, adminToken)

// Set permissions
registry.setPermissions('code-analyzer', {
  toolName: 'code-analyzer',
  roles: ['developer', 'analyst'],
  allowAnonymous: false
})

// Set user quota
registry.setQuota({
  userId: 'user123',
  toolName: 'code-analyzer',
  limit: 10,
  used: 0,
  resetAt: new Date(Date.now() + 86400000),
  period: 'day'
})

// Execute with auth and quota checks
try {
  const result = await registry.execute(
    'code-analyzer',
    { path: '/src' },
    userToken
  )
} catch (error) {
  console.error('Execution failed:', error)
}`,
      language: 'typescript'
    },
    {
      name: 'Audit Log Analysis',
      description: 'Query and analyze audit logs',
      code: `// Get all failed authentication attempts
const authFailures = registry.getAuditLogs({
  action: 'execute',
  success: false
}).filter(log => log.error === 'Authentication failed')

console.log(\`Auth failures: \${authFailures.length}\`)

// Get tool usage by user
const userActivity = registry.getAuditLogs({
  userId: 'user123',
  action: 'execute',
  success: true
})

const toolUsage = userActivity.reduce((acc, log) => {
  acc[log.toolName] = (acc[log.toolName] || 0) + 1
  return acc
}, {})

console.log('Tool usage:', toolUsage)

// Clean up old logs
const removed = registry.cleanupAuditLogs()
console.log(\`Cleaned up \${removed} old audit entries\`)`,
      language: 'typescript'
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: true,
    testCoverage: 90
  },
  
  security: {
    authentication: true,
    encryption: false,
    inputValidation: true,
    outputSanitization: true
  },
  
  performance: {
    timeComplexity: 'O(1) for lookups, O(n) for listing',
    spaceComplexity: 'O(n) where n = number of tools',
    averageResponseTime: '<10ms',
    throughput: '10000+ operations/second'
  },
  
  monitoring: {
    metrics: [
      'tools_registered',
      'tools_executed',
      'auth_failures',
      'quota_exceeded',
      'audit_log_size',
      'permission_checks',
      'quota_checks'
    ],
    logs: [
      'tool-registration',
      'tool-execution',
      'authentication',
      'authorization',
      'quota-management'
    ],
    traces: ['tool-execution-flow', 'auth-check-flow']
  },
  
  dependencies: [
    {
      constructId: 'platform-l0-tool-registry-primitive',
      version: '1.0.0',
      optional: false
    }
  ],
  
  relatedConstructs: [
    'platform-l1-secure-mcp-server',
    'platform-l2-tool-orchestration-pattern',
    'platform-l0-tool-registry-primitive'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: ['platform-l0-tool-registry-primitive'],
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
    'Use RBAC to implement principle of least privilege',
    'Set appropriate quotas to prevent abuse',
    'Monitor audit logs for security events',
    'Regularly clean up old audit logs',
    'Use tool versioning for compatibility',
    'Document required roles for each tool',
    'Implement gradual quota increases for trusted users',
    'Set up alerts for repeated auth failures',
    'Use separate quotas for expensive operations'
  ],
  
  deployment: {
    requiredProviders: ['nodejs'],
    configSchema: {
      type: 'object',
      properties: {
        authEnabled: { type: 'boolean' },
        rbacEnabled: { type: 'boolean' },
        quotasEnabled: { type: 'boolean' },
        auditEnabled: { type: 'boolean' },
        maxTools: { type: 'number', minimum: 1 },
        defaultQuota: { type: 'number', minimum: 1 },
        adminRoles: { type: 'array', items: { type: 'string' } },
        auditRetentionDays: { type: 'number', minimum: 1 }
      }
    },
    environmentVariables: [
      'MCP_JWT_PUBLIC_KEY',
      'MCP_ADMIN_ROLES'
    ],
    preDeploymentChecks: [
      'validate-jwt-configuration',
      'check-storage-capacity'
    ],
    postDeploymentChecks: [
      'auth-test',
      'quota-test',
      'audit-log-test'
    ]
  },
  
  cost: {
    baseMonthly: 10,
    usageFactors: [
      {
        name: 'tools-registered',
        unit: '100 tools',
        costPerUnit: 1,
        typicalUsage: 5
      },
      {
        name: 'executions',
        unit: '1M executions',
        costPerUnit: 5,
        typicalUsage: 2
      },
      {
        name: 'audit-storage',
        unit: 'GB',
        costPerUnit: 0.10,
        typicalUsage: 10
      }
    ],
    notes: [
      'Costs increase with audit retention period',
      'RBAC checks add minimal overhead',
      'Consider archiving old audit logs to reduce storage costs'
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'Tool Registry Service',
    external: false,
    containerType: 'Service',
    position: {
      x: 600,
      y: 200
    }
  },
  
  relationships: [
    {
      from: 'platform-l1-authenticated-tool-registry',
      to: 'platform-l0-tool-registry-primitive',
      description: 'Wraps and secures',
      technology: 'Direct composition',
      type: 'sync'
    },
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l1-authenticated-tool-registry',
      description: 'Uses for tool management',
      technology: 'Function calls',
      type: 'sync'
    }
  ]
}

export { AuthenticatedToolRegistry }