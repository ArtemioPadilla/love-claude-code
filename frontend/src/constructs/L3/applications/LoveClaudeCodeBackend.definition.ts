import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  CloudProvider
} from '../../types';

export const LoveClaudeCodeBackendDefinition: PlatformConstructDefinition = {
  // Basic metadata
  id: 'love-claude-code-backend',
  name: 'Love Claude Code Backend',
  level: ConstructLevel.L3,
  type: ConstructType.Application,
  description: 'Complete Love Claude Code backend application with multi-provider support, Claude AI integration, and self-referential capabilities',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  // Categories and tags
  categories: ['backend', 'application', 'full-stack'],
  tags: [
    'multi-provider',
    'ai-powered',
    'self-referential',
    'serverless',
    'microservices',
    'real-time',
    'claude-integration',
    'auto-scaling'
  ],
  
  // Supported providers
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  // Self-referential metadata
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'vibe-coded',
    vibeCodingPercentage: 95,
    conversationId: 'backend-l3-creation',
    builtWith: [
      'multi-provider-abstraction',
      'microservice-backend',
      'serverless-api-pattern',
      'claude-integration-pattern',
      'websocket-streaming-pattern',
      'monitoring-observability',
      'deployment-pipeline'
    ],
    timeToCreate: 45,
    canBuildConstructs: true
  },
  
  // Platform capabilities
  platformCapabilities: {
    canSelfDeploy: true,
    canSelfUpdate: true,
    canSelfTest: true,
    platformVersion: '1.0.0'
  },
  
  // Inputs
  inputs: [
    {
      name: 'provider',
      type: 'ProviderType',
      description: 'Cloud provider to use (local, firebase, or aws)',
      required: false,
      defaultValue: 'local',
      validation: {
        enum: ['local', 'firebase', 'aws']
      }
    },
    {
      name: 'environment',
      type: 'string',
      description: 'Deployment environment',
      required: false,
      defaultValue: 'development',
      validation: {
        enum: ['development', 'staging', 'production']
      }
    },
    {
      name: 'features',
      type: 'object',
      description: 'Feature flags for enabling/disabling capabilities',
      required: false,
      defaultValue: {
        multiProvider: true,
        claudeIntegration: true,
        webSocketStreaming: true,
        monitoring: true,
        autoScaling: true
      }
    },
    {
      name: 'claudeConfig',
      type: 'object',
      description: 'Claude AI configuration for development and production',
      required: false,
      defaultValue: {
        development: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        },
        production: {
          provider: 'bedrock',
          models: {
            simple: 'claude-3-haiku',
            complex: 'claude-3-5-sonnet'
          }
        }
      }
    },
    {
      name: 'scaling',
      type: 'object',
      description: 'Auto-scaling configuration',
      required: false,
      defaultValue: {
        minInstances: 1,
        maxInstances: 100,
        targetCPU: 70
      }
    }
  ],
  
  // Outputs
  outputs: [
    {
      name: 'apiEndpoint',
      type: 'string',
      description: 'API endpoint URL for the deployed backend'
    },
    {
      name: 'websocketEndpoint',
      type: 'string',
      description: 'WebSocket endpoint for real-time features'
    },
    {
      name: 'healthEndpoint',
      type: 'string',
      description: 'Health check endpoint'
    },
    {
      name: 'metrics',
      type: 'object',
      description: 'Real-time application metrics'
    },
    {
      name: 'providerConfig',
      type: 'object',
      description: 'Current provider configuration'
    }
  ],
  
  // Dependencies
  dependencies: [
    {
      constructId: 'platform-l2-multi-provider-abstraction',
      version: '^1.0.0',
      optional: false
    },
    {
      constructId: 'platform-l2-microservice-backend',
      version: '^1.0.0',
      optional: false
    },
    {
      constructId: 'platform-l2-serverless-api-pattern',
      version: '^1.0.0',
      optional: false
    },
    // TODO: Future pattern
    // {
    //   constructId: 'platform-l2-claude-integration-pattern',
    //   version: '^1.0.0',
    //   optional: false
    // },
    // TODO: Future pattern
    // {
    //   constructId: 'platform-l2-websocket-streaming-pattern',
    //   version: '^1.0.0',
    //   optional: true
    // },
    // TODO: Future pattern
    // {
    //   constructId: 'platform-l2-monitoring-observability',
    //   version: '^1.0.0',
    //   optional: true
    // },
    {
      constructId: 'platform-l2-deployment-pipeline',
      version: '^1.0.0',
      optional: false
    }
  ],
  
  // Security considerations
  security: [
    {
      aspect: 'api-authentication',
      description: 'Secure API authentication using JWT/OAuth based on provider',
      severity: 'critical',
      recommendations: [
        'Use strong JWT secrets',
        'Implement refresh token rotation',
        'Enable MFA for production',
        'Use API key rotation'
      ]
    },
    {
      aspect: 'data-encryption',
      description: 'Encryption at rest and in transit',
      severity: 'high',
      recommendations: [
        'Enable TLS 1.3 for all endpoints',
        'Encrypt sensitive data in database',
        'Use KMS for key management',
        'Implement field-level encryption'
      ]
    },
    {
      aspect: 'claude-api-security',
      description: 'Secure handling of Claude API keys',
      severity: 'critical',
      recommendations: [
        'Store API keys in secrets manager',
        'Use IAM roles for Bedrock',
        'Implement rate limiting',
        'Monitor API usage'
      ]
    },
    {
      aspect: 'provider-isolation',
      description: 'Isolation between different provider implementations',
      severity: 'medium',
      recommendations: [
        'Use separate environments per provider',
        'Implement provider-specific security policies',
        'Regular security audits',
        'Monitor cross-provider access'
      ]
    }
  ],
  
  // Cost estimation
  cost: {
    baseMonthly: 50,
    usageFactors: [
      {
        name: 'api-requests',
        unit: '1M requests',
        costPerUnit: 1.50,
        typicalUsage: 10
      },
      {
        name: 'claude-tokens',
        unit: '1M tokens',
        costPerUnit: 3.00,
        typicalUsage: 50
      },
      {
        name: 'storage-gb',
        unit: 'GB',
        costPerUnit: 0.10,
        typicalUsage: 100
      },
      {
        name: 'bandwidth-gb',
        unit: 'GB',
        costPerUnit: 0.09,
        typicalUsage: 500
      },
      {
        name: 'compute-hours',
        unit: 'hours',
        costPerUnit: 0.05,
        typicalUsage: 730
      }
    ],
    notes: [
      'Costs vary significantly by provider',
      'Local provider has minimal costs',
      'Firebase includes generous free tier',
      'AWS costs scale with usage',
      'Claude API costs depend on model selection'
    ]
  },
  
  // C4 diagram metadata
  c4: {
    type: 'System',
    technology: 'Node.js, TypeScript, Multi-Provider',
    position: {
      x: 0,
      y: 0
    }
  },
  
  // C4 relationships
  relationships: [
    {
      from: 'love-claude-code-backend',
      to: 'love-claude-code-frontend',
      description: 'Provides API and real-time services',
      technology: 'REST API, WebSocket'
    },
    {
      from: 'love-claude-code-backend',
      to: 'claude-api',
      description: 'Sends prompts and receives AI responses',
      technology: 'HTTPS, Streaming'
    },
    {
      from: 'love-claude-code-backend',
      to: 'provider-services',
      description: 'Uses provider-specific services',
      technology: 'Provider SDKs'
    }
  ],
  
  // Examples
  examples: [
    {
      title: 'Deploy with Local Provider',
      description: 'Deploy the backend using the local provider for development',
      code: `
import { createLoveClaudeCodeBackend } from '@/constructs/L3/applications/LoveClaudeCodeBackend';

// Create backend instance
const backend = createLoveClaudeCodeBackend({
  name: 'my-backend',
  description: 'Development backend'
});

// Initialize with local provider
await backend.initialize({
  provider: 'local',
  environment: 'development',
  features: {
    claudeIntegration: true,
    webSocketStreaming: true,
    monitoring: false
  }
});

// Start development server
await backend.startDevelopment();
console.log('Backend running at http://localhost:8000');
      `,
      language: 'typescript'
    },
    {
      title: 'Deploy to AWS with Auto-scaling',
      description: 'Deploy the backend to AWS with production configuration',
      code: `
import { createLoveClaudeCodeBackend } from '@/constructs/L3/applications/LoveClaudeCodeBackend';

const backend = createLoveClaudeCodeBackend();

// Configure for AWS production
backend.setEnvironment('production');
await backend.initialize({
  provider: 'aws',
  environment: 'production',
  features: {
    multiProvider: true,
    claudeIntegration: true,
    webSocketStreaming: true,
    monitoring: true,
    autoScaling: true
  },
  claudeConfig: {
    production: {
      provider: 'bedrock',
      models: {
        simple: 'claude-3-haiku',
        complex: 'claude-3-5-sonnet'
      }
    }
  },
  scaling: {
    minInstances: 2,
    maxInstances: 100,
    targetCPU: 70
  }
});

// Build and deploy
await backend.build();
await backend.deploy('aws');

// Get endpoints
const config = backend.exportConfiguration();
console.log('API Endpoint:', config.apiEndpoint);
console.log('WebSocket:', config.websocketEndpoint);
      `,
      language: 'typescript'
    },
    {
      title: 'Migrate Between Providers',
      description: 'Migrate the backend from Firebase to AWS',
      code: `
import { createLoveClaudeCodeBackend } from '@/constructs/L3/applications/LoveClaudeCodeBackend';

const backend = createLoveClaudeCodeBackend();

// Start with Firebase
await backend.initialize({
  provider: 'firebase',
  environment: 'production'
});

// Export current data
const currentConfig = backend.exportConfiguration();
console.log('Current provider:', currentConfig.provider);

// Migrate to AWS
await backend.migrateProvider('firebase', 'aws');

// Verify migration
const newConfig = backend.exportConfiguration();
console.log('New provider:', newConfig.provider);

// Check health
const health = await backend.getHealthStatus();
console.log('Health status:', health.status);
      `,
      language: 'typescript'
    },
    {
      title: 'Monitor Backend Health',
      description: 'Monitor backend health and metrics in real-time',
      code: `
import { createLoveClaudeCodeBackend } from '@/constructs/L3/applications/LoveClaudeCodeBackend';

const backend = createLoveClaudeCodeBackend();

// Initialize backend
await backend.initialize({
  provider: 'aws',
  environment: 'production',
  features: {
    monitoring: true
  }
});

// Get health status
const health = await backend.getHealthStatus();
console.log('Overall Status:', health.status);
console.log('Components:', health.components);

// Get metrics
const metrics = await backend.getMetrics();
console.log('API Requests:', metrics.api.requests.total);
console.log('Claude Usage:', metrics.claude.tokens);
console.log('Resource Usage:', metrics.resources);

// Monitor continuously
setInterval(async () => {
  const currentHealth = await backend.getHealthStatus();
  if (currentHealth.status !== 'healthy') {
    console.warn('Backend degraded:', currentHealth);
    // Send alert
  }
}, 60000); // Check every minute
      `,
      language: 'typescript'
    }
  ],
  
  // Best practices
  bestPractices: [
    'Always use environment variables for sensitive configuration',
    'Implement proper error handling and circuit breakers',
    'Use caching to reduce API calls and improve performance',
    'Monitor Claude API usage to control costs',
    'Implement rate limiting for all endpoints',
    'Use structured logging for debugging',
    'Set up alerts for critical issues',
    'Regularly rotate API keys and secrets',
    'Test provider migrations in staging first',
    'Use auto-scaling to handle traffic spikes',
    'Implement graceful shutdown for deployments',
    'Use health checks for load balancer configuration'
  ],
  
  // Deployment configuration
  deployment: {
    requiredProviders: ['docker', 'kubernetes'],
    configSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['local', 'firebase', 'aws']
        },
        environment: {
          type: 'string',
          enum: ['development', 'staging', 'production']
        },
        region: {
          type: 'string',
          default: 'us-west-2'
        },
        scaling: {
          type: 'object',
          properties: {
            minInstances: { type: 'number', minimum: 1 },
            maxInstances: { type: 'number', maximum: 1000 },
            targetCPU: { type: 'number', minimum: 50, maximum: 90 }
          }
        }
      },
      required: ['provider', 'environment']
    },
    environmentVariables: [
      'DATABASE_URL',
      'REDIS_URL',
      'AUTH_SECRET',
      'ANTHROPIC_API_KEY',
      'AWS_REGION',
      'FIREBASE_PROJECT_ID'
    ],
    preDeploymentChecks: [
      'Validate environment variables',
      'Check provider credentials',
      'Run unit tests',
      'Run integration tests',
      'Validate configuration'
    ],
    postDeploymentChecks: [
      'Health check endpoints',
      'Verify API responses',
      'Check WebSocket connectivity',
      'Validate Claude integration',
      'Monitor initial metrics'
    ]
  },
  
  // UI configuration
  ui: {
    icon: 'server',
    previewConfig: {
      showMetrics: true,
      showHealth: true,
      showProviders: true,
      refreshInterval: 5000
    },
    formSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          title: 'Provider',
          enum: ['local', 'firebase', 'aws'],
          default: 'local'
        },
        environment: {
          type: 'string',
          title: 'Environment',
          enum: ['development', 'staging', 'production'],
          default: 'development'
        },
        features: {
          type: 'object',
          title: 'Features',
          properties: {
            claudeIntegration: { type: 'boolean', title: 'Claude AI Integration', default: true },
            webSocketStreaming: { type: 'boolean', title: 'WebSocket Streaming', default: true },
            monitoring: { type: 'boolean', title: 'Monitoring & Analytics', default: true },
            autoScaling: { type: 'boolean', title: 'Auto-scaling', default: true }
          }
        }
      }
    }
  }
};