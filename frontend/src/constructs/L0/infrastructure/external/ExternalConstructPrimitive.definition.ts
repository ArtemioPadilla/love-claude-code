/**
 * External Construct Primitive Definition
 * Platform construct definition for the External Construct primitive
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'

export const externalConstructPrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-external-construct-primitive',
  name: 'External Construct Primitive',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L0,
  description: 'Foundation primitive for integrating external packages, services, and dependencies into the platform',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'integration', 'external', 'sandbox'],
  tags: [
    'external',
    'integration',
    'npm',
    'docker',
    'mcp',
    'api',
    'sandbox',
    'primitive',
    'foundation'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'external-package-loading',
    'sandbox-execution',
    'resource-isolation',
    'event-driven-communication',
    'health-monitoring',
    'crash-recovery',
    'resource-tracking'
  ],
  
  inputs: [
    {
      name: 'source',
      type: 'ExternalSource',
      required: true,
      description: 'External package/service source configuration'
    },
    {
      name: 'sandbox',
      type: 'SandboxConfig',
      required: false,
      description: 'Sandbox execution environment configuration'
    },
    {
      name: 'resources',
      type: 'ResourceConfig',
      required: false,
      description: 'Resource limits and monitoring configuration'
    },
    {
      name: 'lifecycle',
      type: 'LifecycleConfig',
      required: false,
      description: 'Lifecycle hooks and event handlers'
    },
    {
      name: 'recovery',
      type: 'RecoveryConfig',
      required: false,
      description: 'Crash recovery and restart policies'
    },
    {
      name: 'communication',
      type: 'CommunicationConfig',
      required: false,
      description: 'Inter-process communication configuration'
    }
  ],
  
  outputs: [
    {
      name: 'instance',
      type: 'any',
      description: 'The loaded external instance'
    },
    {
      name: 'state',
      type: 'ExternalConstructState',
      description: 'Current state of the external construct'
    },
    {
      name: 'metrics',
      type: 'ResourceMetrics',
      description: 'Resource usage metrics'
    },
    {
      name: 'events',
      type: 'EventEmitter',
      description: 'Event emitter for external construct events'
    },
    {
      name: 'health',
      type: 'HealthStatus',
      description: 'Health check status'
    },
    {
      name: 'logs',
      type: 'LogStream',
      description: 'Log stream from the external construct'
    }
  ],
  
  events: [
    {
      name: 'onInitialize',
      description: 'Fired when external construct starts initializing'
    },
    {
      name: 'onReady',
      description: 'Fired when external construct is ready for use'
    },
    {
      name: 'onError',
      description: 'Fired when an error occurs'
    },
    {
      name: 'onCrash',
      description: 'Fired when external construct crashes'
    },
    {
      name: 'onRecover',
      description: 'Fired when recovering from a crash'
    },
    {
      name: 'onStop',
      description: 'Fired when external construct is stopping'
    },
    {
      name: 'onDestroy',
      description: 'Fired when external construct is destroyed'
    },
    {
      name: 'onMessage',
      description: 'Fired when receiving message from external construct'
    },
    {
      name: 'onResourceLimit',
      description: 'Fired when approaching resource limits'
    }
  ],
  
  configuration: {
    source: {
      type: 'npm',
      identifier: '@example/package',
      version: 'latest'
    },
    sandbox: {
      enabled: true,
      policies: {
        network: 'restricted',
        filesystem: 'read-only',
        cpu: 0.5,
        memory: '512MB',
        timeout: 30000
      }
    },
    resources: {
      monitoring: true,
      limits: {
        cpu: 1.0,
        memory: '1GB',
        disk: '100MB'
      }
    },
    recovery: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      strategy: 'exponential-backoff'
    }
  },
  
  examples: [
    {
      name: 'NPM Package Integration',
      description: 'Load and use an NPM package',
      code: `const externalConstruct = new ExternalConstructPrimitive({
  source: {
    type: 'npm',
    identifier: 'lodash',
    version: '^4.17.21'
  },
  sandbox: {
    enabled: true,
    policies: {
      network: 'none',
      filesystem: 'none'
    }
  }
})

await externalConstruct.initialize()
const _ = externalConstruct.getInstance()
const result = await externalConstruct.execute('sortBy', data, 'name')`
    },
    {
      name: 'Docker Container Integration',
      description: 'Connect to a Docker container',
      code: `const externalConstruct = new ExternalConstructPrimitive({
  source: {
    type: 'docker',
    identifier: 'redis:alpine',
    version: 'latest'
  },
  sandbox: {
    enabled: true,
    policies: {
      network: 'host-only',
      cpu: 0.5,
      memory: '256MB'
    }
  },
  lifecycle: {
    onReady: async (instance) => {
      console.log('Redis container ready')
    }
  }
})`
    },
    {
      name: 'MCP Server Integration',
      description: 'Connect to an MCP server',
      code: `const externalConstruct = new ExternalConstructPrimitive({
  source: {
    type: 'mcp',
    identifier: 'mcp-server-filesystem',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem']
    }
  },
  communication: {
    protocol: 'stdio',
    encoding: 'json'
  },
  recovery: {
    enabled: true,
    maxRetries: 5
  }
})`
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: true,
    testCoverage: 90
  },
  
  security: {
    authentication: false,
    encryption: false,
    inputValidation: true,
    outputSanitization: true,
    sandboxing: true,
    resourceIsolation: true
  },
  
  performance: {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(n)',
    averageResponseTime: 'Depends on external',
    throughput: 'Depends on external'
  },
  
  monitoring: {
    metrics: ['cpu-usage', 'memory-usage', 'execution-time', 'error-rate', 'health-status'],
    logs: ['initialization', 'errors', 'lifecycle-events', 'resource-usage'],
    traces: ['execution-flow', 'external-calls']
  },
  
  dependencies: [], // L0 primitives have no dependencies
  
  relatedConstructs: [
    'platform-l0-docker-container-primitive',
    'platform-l0-websocket-primitive',
    'platform-l1-managed-external-construct',
    'platform-l1-sandboxed-npm-package'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'ai-assisted',
    vibeCodingPercentage: 0,
    builtWith: [],
    canBuildConstructs: false
  },
  
  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  }
}