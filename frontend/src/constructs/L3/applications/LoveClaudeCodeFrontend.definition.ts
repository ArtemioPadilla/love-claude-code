import { PlatformConstructDefinition, CloudProvider } from '../../types';

/**
 * Love Claude Code Frontend Application Definition
 * The complete frontend application that builds itself
 */
export const LoveClaudeCodeFrontendDefinition: PlatformConstructDefinition = {
  id: 'love-claude-code-frontend',
  name: 'Love Claude Code Frontend',
  level: 'L3',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  categories: ['frontend', 'application', 'ide', 'web'],
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  tags: [
    'ai-powered',
    'self-referential',
    'ide',
    'development-environment',
    'claude-integration',
    'react',
    'typescript',
    'vite',
    'real-time-collaboration',
    'multi-provider',
    'self-building'
  ],
  category: 'frontend',
  subcategory: 'application',
  description: 'Complete Love Claude Code frontend application - The self-building IDE powered by Claude',
  
  metadata: {
    status: 'stable',
    complexity: 'high',
    useCase: 'Complete AI-powered development environment',
    technicalRequirements: [
      'Node.js 20+',
      'React 18.2+',
      'TypeScript 5.3+',
      'Vite 5.0+',
      'Modern browser with ES2022 support'
    ],
    supportedFrameworks: ['react', 'typescript', 'vite', 'tailwind'],
    selfReferential: {
      builtBy: 'LoveClaudeCode',
      buildMethod: 'vibe-coding',
      vibePercentage: 100,
      capabilities: [
        'Self-modification',
        'Self-deployment',
        'Self-documentation',
        'Self-testing',
        'Construct generation'
      ]
    }
  },
  
  dependencies: [
    // L2 Pattern Dependencies
    { id: 'ide-workspace', level: 'L2', optional: false },
    { id: 'claude-conversation-system', level: 'L2', optional: false },
    { id: 'project-management-system', level: 'L2', optional: false },
    { id: 'realtime-collaboration', level: 'L2', optional: true },
    { id: 'construct-catalog-system', level: 'L2', optional: false },
    // TODO: Future L2 patterns
    // { id: 'documentation-center', level: 'L2', optional: false },
    // { id: 'theme-system', level: 'L2', optional: false },
    { id: 'multi-provider-system', level: 'L2', optional: false },
    // { id: 'analytics-system', level: 'L2', optional: true },
    // { id: 'monitoring-dashboard', level: 'L2', optional: true }
  ],
  
  properties: {
    // Application Configuration
    appName: {
      type: 'string',
      default: 'Love Claude Code',
      description: 'Application name'
    },
    version: {
      type: 'string',
      default: '1.0.0',
      description: 'Application version'
    },
    
    // Theme Configuration
    theme: {
      type: 'enum',
      values: ['light', 'dark', 'system'],
      default: 'dark',
      description: 'Default application theme'
    },
    
    // Provider Configuration
    defaultProvider: {
      type: 'enum',
      values: ['local', 'firebase', 'aws'],
      default: 'local',
      description: 'Default backend provider'
    },
    
    // Feature Flags
    features: {
      type: 'object',
      properties: {
        aiAssistant: { type: 'boolean', default: true },
        realTimeCollab: { type: 'boolean', default: true },
        constructCatalog: { type: 'boolean', default: true },
        multiProvider: { type: 'boolean', default: true },
        selfReferential: { type: 'boolean', default: true },
        documentation: { type: 'boolean', default: true },
        analytics: { type: 'boolean', default: true },
        monitoring: { type: 'boolean', default: true },
        offlineMode: { type: 'boolean', default: false },
        advancedDebugging: { type: 'boolean', default: false }
      }
    },
    
    // Build Configuration
    buildConfig: {
      type: 'object',
      properties: {
        mode: { type: 'enum', values: ['development', 'production'], default: 'development' },
        bundler: { type: 'enum', values: ['vite', 'webpack', 'esbuild'], default: 'vite' },
        target: { type: 'string', default: 'es2022' },
        sourceMaps: { type: 'boolean', default: true },
        minify: { type: 'boolean', default: false },
        analyze: { type: 'boolean', default: false }
      }
    },
    
    // Deployment Configuration
    deploymentConfig: {
      type: 'object',
      properties: {
        provider: { type: 'enum', values: ['vercel', 'aws', 'firebase', 'netlify'], default: 'vercel' },
        environment: { type: 'enum', values: ['development', 'staging', 'production'], default: 'development' },
        region: { type: 'string', default: 'us-west-2' },
        cdn: { type: 'boolean', default: true },
        ssl: { type: 'boolean', default: true },
        customDomain: { type: 'string', optional: true }
      }
    },
    
    // Development Server Configuration
    devServer: {
      type: 'object',
      properties: {
        port: { type: 'number', default: 3000 },
        host: { type: 'string', default: 'localhost' },
        open: { type: 'boolean', default: true },
        hot: { type: 'boolean', default: true },
        cors: { type: 'boolean', default: true }
      }
    },
    
    // API Configuration
    apiConfig: {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', default: 'http://localhost:8000' },
        timeout: { type: 'number', default: 30000 },
        retries: { type: 'number', default: 3 }
      }
    },
    
    // Claude Configuration
    claudeConfig: {
      type: 'object',
      properties: {
        model: { type: 'string', default: 'claude-3-5-sonnet-20241022' },
        maxTokens: { type: 'number', default: 4000 },
        temperature: { type: 'number', default: 0.7 },
        streaming: { type: 'boolean', default: true }
      }
    }
  },
  
  methods: {
    // Lifecycle Methods
    build: {
      description: 'Build the application for production',
      async: true,
      parameters: {
        watch: { type: 'boolean', optional: true, description: 'Watch for changes' },
        analyze: { type: 'boolean', optional: true, description: 'Analyze bundle size' }
      }
    },
    
    deploy: {
      description: 'Deploy the application to specified target',
      async: true,
      parameters: {
        target: { type: 'string', required: true, description: 'Deployment target' },
        environment: { type: 'string', optional: true, description: 'Target environment' }
      }
    },
    
    startDevelopment: {
      description: 'Start the development server',
      async: true
    },
    
    startProduction: {
      description: 'Start the production server',
      async: true
    },
    
    // Configuration Methods
    setEnvironment: {
      description: 'Set the application environment',
      parameters: {
        env: { type: 'enum', values: ['development', 'production'], required: true }
      }
    },
    
    exportConfiguration: {
      description: 'Export current application configuration',
      returns: 'object'
    },
    
    importConfiguration: {
      description: 'Import application configuration',
      parameters: {
        config: { type: 'object', required: true }
      }
    },
    
    // Health and Monitoring
    getHealthStatus: {
      description: 'Get application health status',
      async: true,
      returns: 'object'
    },
    
    getMetrics: {
      description: 'Get application metrics',
      async: true,
      returns: 'object'
    },
    
    // Pattern Management
    getPatterns: {
      description: 'Get all L2 patterns in the application',
      returns: 'array'
    },
    
    // Self-Referential Methods
    generateConstruct: {
      description: 'Generate a new construct using AI',
      async: true,
      parameters: {
        level: { type: 'enum', values: ['L0', 'L1', 'L2'], required: true },
        type: { type: 'string', required: true },
        requirements: { type: 'object', required: true }
      }
    },
    
    modifySelf: {
      description: 'Modify the application source code',
      async: true,
      parameters: {
        component: { type: 'string', required: true },
        changes: { type: 'object', required: true }
      }
    }
  },
  
  events: {
    onApplicationStart: {
      description: 'Fired when application starts'
    },
    onApplicationStop: {
      description: 'Fired when application stops'
    },
    onBuildComplete: {
      description: 'Fired when build completes',
      payload: { success: 'boolean', duration: 'number' }
    },
    onDeployComplete: {
      description: 'Fired when deployment completes',
      payload: { target: 'string', url: 'string' }
    },
    onPatternLoaded: {
      description: 'Fired when an L2 pattern is loaded',
      payload: { patternId: 'string' }
    },
    onConfigurationChange: {
      description: 'Fired when configuration changes',
      payload: { key: 'string', value: 'any' }
    },
    onSelfModification: {
      description: 'Fired when application modifies itself',
      payload: { component: 'string', changeType: 'string' }
    }
  },
  
  slots: {
    headerContent: {
      description: 'Custom header content',
      type: 'component'
    },
    footerContent: {
      description: 'Custom footer content',
      type: 'component'
    },
    customPatterns: {
      description: 'Additional L2 patterns to include',
      type: 'array'
    }
  },
  
  styling: {
    theme: {
      light: {
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937'
      },
      dark: {
        primaryColor: '#60A5FA',
        backgroundColor: '#111827',
        textColor: '#F3F4F6'
      }
    },
    responsive: true,
    customizable: true
  },
  
  examples: [
    {
      title: 'Basic Application Setup',
      description: 'Create and start the Love Claude Code frontend',
      code: `
import { createLoveClaudeCodeFrontend } from '@/constructs/L3/applications/LoveClaudeCodeFrontend';

// Create the application
const app = createLoveClaudeCodeFrontend({
  name: 'My Love Claude Code Instance',
  description: 'Custom instance of the self-building IDE'
});

// Configure features
app.importConfiguration({
  features: {
    realTimeCollab: true,
    analytics: false
  },
  theme: 'dark',
  defaultProvider: 'firebase'
});

// Start development server
await app.startDevelopment();
      `
    },
    {
      title: 'Production Deployment',
      description: 'Build and deploy to production',
      code: `
// Set production environment
app.setEnvironment('production');

// Build the application
await app.build({
  analyze: true
});

// Deploy to Vercel
await app.deploy('vercel', {
  environment: 'production'
});

// Check deployment health
const health = await app.getHealthStatus();
console.log('Deployment health:', health);
      `
    },
    {
      title: 'Self-Referential Features',
      description: 'Use the self-building capabilities',
      code: `
// Generate a new L1 construct
const newConstruct = await app.generateConstruct({
  level: 'L1',
  type: 'ui-component',
  requirements: {
    name: 'AnimatedButton',
    description: 'Button with hover animations',
    framework: 'react'
  }
});

// Modify the application itself
await app.modifySelf({
  component: 'theme-system',
  changes: {
    addTheme: {
      name: 'ocean',
      colors: {
        primary: '#006994',
        secondary: '#00A8CC'
      }
    }
  }
});
      `
    },
    {
      title: 'Multi-Provider Configuration',
      description: 'Configure multiple backend providers',
      code: `
// Configure providers
app.importConfiguration({
  providers: {
    local: {
      enabled: true,
      database: 'postgresql://localhost:5432/lcc'
    },
    firebase: {
      enabled: true,
      projectId: 'love-claude-code-prod',
      region: 'us-central1'
    },
    aws: {
      enabled: true,
      region: 'us-west-2',
      cognitoPoolId: 'us-west-2_xxxxx'
    }
  },
  defaultProvider: 'firebase'
});

// Switch provider at runtime
app.switchProvider('aws');
      `
    },
    {
      title: 'React Component Usage',
      description: 'Use as a React component',
      code: `
import React from 'react';
import { createLoveClaudeCodeFrontend } from '@/constructs/L3/applications/LoveClaudeCodeFrontend';

const app = createLoveClaudeCodeFrontend();

function App() {
  return (
    <app.Component 
      config={{
        theme: 'dark',
        features: {
          realTimeCollab: true
        }
      }}
    />
  );
}

export default App;
      `
    }
  ],
  
  documentation: {
    overview: `
The LoveClaudeCodeFrontend L3 construct represents the complete Love Claude Code frontend application.
This is the highest level construct that composes all L2 patterns into a fully functional,
self-referential development environment.

Key Features:
- Complete IDE functionality with AI assistance
- Multi-provider backend support (Local, Firebase, AWS)
- Real-time collaboration capabilities
- Self-referential construct system
- Built-in documentation and help
- Theme customization
- Analytics and monitoring

The application is designed to build itself, meaning it can:
- Generate its own constructs
- Modify its own source code
- Deploy itself to production
- Document its own features
- Test its own functionality
    `,
    
    bestPractices: [
      'Always validate configuration before building or deploying',
      'Use environment-specific configurations for development and production',
      'Enable monitoring and analytics in production',
      'Regularly check health status of all patterns',
      'Use the self-referential features responsibly',
      'Keep the application version updated',
      'Test provider switching in staging before production'
    ],
    
    troubleshooting: [
      {
        issue: 'Build fails with memory error',
        solution: 'Increase Node.js memory limit: NODE_OPTIONS="--max-old-space-size=4096" npm run build'
      },
      {
        issue: 'Provider switching fails',
        solution: 'Ensure all provider credentials are properly configured in settings'
      },
      {
        issue: 'Development server not starting',
        solution: 'Check if port 3000 is already in use, or configure a different port'
      },
      {
        issue: 'Patterns not loading',
        solution: 'Verify all L2 pattern dependencies are installed and properly configured'
      }
    ]
  }
};

export default LoveClaudeCodeFrontendDefinition;