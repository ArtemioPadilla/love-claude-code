/**
 * Tool Registry Primitive Definition
 * Platform construct definition for the Tool Registry primitive
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { ToolRegistryPrimitive } from './ToolRegistryPrimitive'

export const toolRegistryPrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-tool-registry-primitive',
  name: 'Tool Registry Primitive',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L0,
  description: 'Raw tool registration and discovery mechanism for MCP (Model Context Protocol) tool management',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'registry', 'tools', 'mcp'],
  tags: [
    'tool-registry',
    'tool-discovery',
    'mcp',
    'registry',
    'primitive',
    'tool-management',
    'mcp-foundation'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'tool-registration',
    'tool-unregistration',
    'tool-discovery',
    'tool-search',
    'tool-categorization',
    'tool-validation',
    'tool-versioning',
    'usage-tracking',
    'import-export'
  ],
  
  inputs: [
    {
      name: 'initialTools',
      type: 'MCPTool[]',
      required: false,
      description: 'Initial tools to register on startup'
    },
    {
      name: 'validateTools',
      type: 'boolean',
      required: false,
      description: 'Enable tool validation before registration'
    },
    {
      name: 'supportedCategories',
      type: 'string[]',
      required: false,
      description: 'Allowed tool categories for validation'
    },
    {
      name: 'maxTools',
      type: 'number',
      required: false,
      description: 'Maximum number of tools allowed in registry'
    },
    {
      name: 'enableVersioning',
      type: 'boolean',
      required: false,
      description: 'Enable tool version management'
    }
  ],
  
  outputs: [
    {
      name: 'register',
      type: 'function',
      description: 'Function to register a new tool'
    },
    {
      name: 'unregister',
      type: 'function',
      description: 'Function to unregister a tool'
    },
    {
      name: 'get',
      type: 'function',
      description: 'Function to get a specific tool by name'
    },
    {
      name: 'getAll',
      type: 'function',
      description: 'Function to get all registered tools'
    },
    {
      name: 'getByCategory',
      type: 'function',
      description: 'Function to get tools by category'
    },
    {
      name: 'search',
      type: 'function',
      description: 'Function to search tools by query'
    },
    {
      name: 'updateStatus',
      type: 'function',
      description: 'Function to update tool status'
    },
    {
      name: 'has',
      type: 'function',
      description: 'Function to check if a tool exists'
    },
    {
      name: 'count',
      type: 'function',
      description: 'Function to get the number of registered tools'
    },
    {
      name: 'markUsed',
      type: 'function',
      description: 'Function to mark a tool as used'
    },
    {
      name: 'validate',
      type: 'function',
      description: 'Function to validate a tool definition'
    },
    {
      name: 'export',
      type: 'function',
      description: 'Function to export registry to JSON'
    },
    {
      name: 'import',
      type: 'function',
      description: 'Function to import registry from JSON'
    }
  ],
  
  events: [
    {
      name: 'onToolRegistered',
      description: 'Fired when a tool is successfully registered'
    },
    {
      name: 'onToolUnregistered',
      description: 'Fired when a tool is unregistered'
    },
    {
      name: 'onToolUpdated',
      description: 'Fired when a tool is updated'
    },
    {
      name: 'onToolInvoked',
      description: 'Fired when a tool is marked as used'
    },
    {
      name: 'onValidationError',
      description: 'Fired when tool validation fails'
    }
  ],
  
  configuration: {
    initialTools: [],
    validateTools: true,
    supportedCategories: [
      'data',
      'computation',
      'communication',
      'storage',
      'analysis',
      'visualization',
      'integration',
      'security',
      'monitoring'
    ],
    maxTools: 1000,
    enableVersioning: true
  },
  
  examples: [
    {
      name: 'Basic Tool Registration',
      description: 'Register and use a simple MCP tool',
      code: `<ToolRegistryPrimitive
  config={{
    validateTools: true
  }}
  onToolRegistered={(tool) => console.log('Registered:', tool.name)}
/>

// Usage:
const { register, get } = useToolRegistry()

// Register a tool
register({
  name: 'analyze_code',
  description: 'Analyzes code quality',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Code path to analyze'
    }
  },
  category: 'analysis'
})

// Get and use the tool
const tool = get('analyze_code')`,
      language: 'typescript',
      highlights: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24]
    },
    {
      name: 'Tool Discovery',
      description: 'Search and discover tools by category or query',
      code: `const { getByCategory, search } = useToolRegistry()

// Get all analysis tools
const analysisTools = getByCategory('analysis')

// Search for tools
const searchResults = search('code')

// Display tools
searchResults.forEach(tool => {
  console.log(\`\${tool.name}: \${tool.description}\`)
  console.log(\`  Used \${tool.usageCount} times\`)
  console.log(\`  Status: \${tool.status}\`)
})`,
      language: 'typescript',
      highlights: [3, 6, 10, 11, 12, 13]
    },
    {
      name: 'Import/Export Registry',
      description: 'Save and restore tool registry state',
      code: `const { export: exportRegistry, import: importRegistry } = useToolRegistry()

// Export current registry
const registryData = exportRegistry()
localStorage.setItem('mcp-tool-registry', registryData)

// Import registry from saved data
const savedData = localStorage.getItem('mcp-tool-registry')
if (savedData) {
  const success = importRegistry(savedData)
  console.log('Import successful:', success)
}`,
      language: 'typescript',
      highlights: [3, 4, 8, 9, 10]
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: false,
    testCoverage: 94
  },
  
  security: {
    authentication: false,
    encryption: false,
    inputValidation: true,
    outputSanitization: true
  },
  
  performance: {
    timeComplexity: 'O(1) for most operations, O(n) for search',
    spaceComplexity: 'O(n)', // n = number of tools
    averageResponseTime: '<1ms',
    throughput: '10000+ operations/second'
  },
  
  monitoring: {
    metrics: ['tool-count', 'registration-rate', 'usage-frequency', 'search-queries'],
    logs: ['registrations', 'unregistrations', 'validation-errors', 'searches'],
    traces: ['tool-lifecycle']
  },
  
  dependencies: [], // L0 primitives have no dependencies
  
  relatedConstructs: [
    'platform-l0-rpc-primitive',
    'platform-l1-mcp-tool-executor',
    'platform-l1-tool-permission-manager',
    'platform-l2-mcp-server-pattern'
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
    'Always validate tool definitions before registration',
    'Use categories to organize tools effectively',
    'Implement proper error handling for tool registration failures',
    'Track tool usage to identify popular and unused tools',
    'Regularly export registry for backup purposes',
    'Set reasonable limits on maximum tools to prevent memory issues',
    'Use semantic versioning for tools that support it',
    'Document tool parameters thoroughly for better discoverability',
    'Implement tool deprecation workflows for obsolete tools'
  ],
  
  deployment: {
    requiredProviders: [],
    configSchema: {
      type: 'object',
      properties: {
        validateTools: {
          type: 'boolean',
          default: true,
          description: 'Enable tool validation'
        },
        maxTools: {
          type: 'number',
          minimum: 10,
          maximum: 10000,
          default: 1000,
          description: 'Maximum tools allowed'
        },
        supportedCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed tool categories'
        }
      }
    },
    environmentVariables: ['TOOL_REGISTRY_MAX_SIZE', 'TOOL_VALIDATION_ENABLED'],
    preDeploymentChecks: ['memory-availability'],
    postDeploymentChecks: ['registry-initialization']
  },
  
  cost: {
    baseMonthly: 0,
    usageFactors: [
      {
        name: 'memory-usage',
        unit: 'MB',
        costPerUnit: 0.00001,
        typicalUsage: 10
      }
    ],
    notes: [
      'Tool registry is typically in-memory',
      'Cost is negligible for typical usage',
      'Consider persistent storage for large registries'
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'In-Memory Registry',
    external: false,
    position: {
      x: 200,
      y: 300
    }
  },
  
  relationships: [
    {
      from: 'platform-l0-tool-registry-primitive',
      to: 'platform-l1-mcp-tool-executor',
      description: 'Provides tools to',
      technology: 'In-memory reference',
      type: 'sync'
    }
  ]
}

export { ToolRegistryPrimitive }