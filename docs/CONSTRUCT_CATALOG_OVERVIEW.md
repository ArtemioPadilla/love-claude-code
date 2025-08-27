# Love Claude Code - Construct Catalog & Infrastructure Documentation

## Table of Contents
1. [Construct Catalog System](#construct-catalog-system)
2. [Complete Construct List](#complete-construct-list)
3. [Pulumi Constructs Architecture](#pulumi-constructs-architecture)
4. [MCP Integration](#mcp-integration)
5. [C4 Diagram Support](#c4-diagram-support)
6. [Quick Start Guide](#quick-start-guide)
7. [Examples](#examples)

## Construct Catalog System

The Construct Catalog is a visual interface for browsing, searching, and deploying pre-built infrastructure components across multiple cloud providers.

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Construct Catalog UI                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │   Search    │ │   Filters   │ │    Sort     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────────────────────────────────────┐   │
│  │         Construct Explorer (Grid/List)       │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │   Construct Store     │
         │  (Zustand State Mgmt) │
         └───────────┬───────────┘
                     │
    ┌────────────────┴────────────────┐
    │        YAML Definitions         │
    │   /catalog/{provider}/{level}/  │
    └────────────────┬────────────────┘
                     │
         ┌───────────┴───────────┐
         │  Pulumi Constructs    │
         │ /pulumi-constructs/   │
         └───────────────────────┘
```

### Construct Statistics

**Total Constructs: 61**
- L0 Primitives: 25
- L1 Components: 20
- L2 Patterns: 12
- L3 Applications: 4

### Construct Levels

Following AWS CDK patterns, constructs are organized into four levels:

| Level | Description | Example | Count |
|-------|-------------|---------|-------|
| **L0** | Primitive cloud resources (direct mappings) | Raw S3 Bucket, EC2 Instance | 25 |
| **L1** | Foundation constructs with sensible defaults | Secure S3 Bucket, Configured Database | 20 |
| **L2** | Pattern constructs (common solutions) | Serverless API, Static Website | 12 |
| **L3** | Application constructs (complete solutions) | E-commerce Platform, SaaS Backend | 4 |

### Key Components

1. **ConstructCatalog.tsx** - Main catalog component with search and filters
2. **ConstructExplorer.tsx** - Grid/list view of constructs
3. **ConstructDetails.tsx** - Detailed view with deployment options
4. **ConstructComposer.tsx** - Visual composition of multiple constructs

### Construct Definition Schema

Each construct is defined in YAML format:

```yaml
id: aws-l1-s3-bucket
level: L1
metadata:
  name: AWS S3 Bucket
  description: Secure S3 bucket with encryption and versioning
  version: 1.0.0
  author: Love Claude Code
  category: storage
  tags: [aws, s3, storage, secure-by-default]
providers: [aws]
inputs:
  bucketName:
    type: string
    description: The name of the bucket
    required: false
outputs:
  bucketArn:
    type: string
    description: The ARN of the bucket
security:
  - type: encryption
    description: Server-side encryption enabled by default
costs:
  - provider: aws
    baseCost: 0
    usage:
      storage:
        cost: 0.023
        unit: GB-month
```

## Complete Construct List

### L0 Primitives (25 constructs)

#### UI Primitives (11)
- **CodeEditorPrimitive** - Base code editor with syntax highlighting
- **ChatMessagePrimitive** - Basic chat message display
- **FileTreePrimitive** - File system tree viewer
- **TerminalPrimitive** - Terminal emulator component
- **ButtonPrimitive** - Basic button component
- **ModalPrimitive** - Modal dialog primitive
- **PanelPrimitive** - Resizable panel container
- **TabPrimitive** - Tab navigation component
- **NodePrimitive** - Diagram node primitive
- **EdgePrimitive** - Diagram edge connector
- **GraphPrimitive** - Graph visualization primitive
- **LayoutEnginePrimitive** - Layout algorithm engine

#### Infrastructure Primitives (7)
- **DockerContainerPrimitive** - Docker container management
- **WebSocketServerPrimitive** - WebSocket server implementation
- **ApiEndpointPrimitive** - REST API endpoint
- **DatabaseTablePrimitive** - Database table abstraction
- **StorageBucketPrimitive** - Object storage bucket
- **AuthTokenPrimitive** - Authentication token handler
- **ExternalConstructPrimitive** - External integration base

#### MCP Infrastructure Primitives (4)
- **WebSocketPrimitive** - MCP WebSocket connection
- **RPCPrimitive** - Remote procedure call primitive
- **ToolRegistryPrimitive** - Tool registration system
- **MessageQueuePrimitive** - Message queue implementation

#### External Integration Primitives (3)
- **NpmPackagePrimitive** - NPM package integration
- **DockerServicePrimitive** - Docker service orchestration

### L1 Components (20 constructs)

#### UI Components (10)
- **SecureCodeEditor** - Enhanced editor with security features
- **AIChatInterface** - AI-powered chat interface
- **ProjectFileExplorer** - Project file management
- **IntegratedTerminal** - Full terminal integration
- **ResponsiveLayout** - Adaptive layout system
- **ThemedComponents** - Theme-aware component library
- **DraggableNode** - Draggable diagram nodes
- **ConnectedEdge** - Smart edge connections
- **ZoomableGraph** - Zoomable graph visualization
- **DiagramToolbar** - Diagram manipulation toolbar

#### Infrastructure Components (10)
- **ManagedContainer** - Managed Docker containers
- **AuthenticatedWebSocket** - Secure WebSocket connections
- **RestAPIService** - Complete REST API service
- **EncryptedDatabase** - Encrypted database wrapper
- **CDNStorage** - CDN-enabled storage
- **SecureAuthService** - Authentication service
- **SecureMCPServer** - Secure MCP server implementation
- **AuthenticatedToolRegistry** - Authenticated tool management
- **RateLimitedRPC** - Rate-limited RPC service
- **EncryptedWebSocket** - End-to-end encrypted WebSocket

### L2 Patterns (12 constructs)

- **IDEWorkspace** - Complete IDE workspace pattern
- **ClaudeConversationSystem** - Full Claude integration
- **ProjectManagementSystem** - Project management features
- **RealTimeCollaboration** - Real-time collaborative editing
- **DeploymentPipeline** - CI/CD deployment pattern
- **MicroserviceBackend** - Microservice architecture
- **StaticSiteHosting** - Static site deployment
- **ServerlessAPIPattern** - Serverless API architecture
- **MultiProviderAbstraction** - Multi-cloud abstraction
- **ConstructCatalogSystem** - Construct catalog implementation
- **MCPServerPattern** - Complete MCP server pattern
- **ToolOrchestrationPattern** - Multi-tool orchestration

### L3 Applications (4 constructs)

- **LoveClaudeCodeFrontend** - Complete frontend application
- **LoveClaudeCodeBackend** - Full backend implementation
- **LoveClaudeCodeMCPServer** - MCP server application
- **LoveClaudeCodePlatform** - Entire platform deployment

## Pulumi Constructs Architecture

### Directory Structure

```
pulumi-constructs/
├── packages/
│   ├── core/               # Base classes and types
│   │   └── src/
│   │       ├── base/       # L0-L3 base classes
│   │       └── utils/      # Utilities (cost, validation)
│   ├── providers/          # Provider implementations
│   │   ├── aws/
│   │   ├── firebase/
│   │   └── local/
│   ├── patterns/           # L2 pattern constructs
│   └── applications/       # L3 application constructs
└── automation/             # Deployment engine
    ├── deployment-engine.ts
    ├── preview-engine.ts
    └── stack-manager.ts
```

### Base Construct Classes

```typescript
// L0 - Direct cloud resource mapping
export abstract class L0Construct extends pulumi.ComponentResource {
  // Minimal abstraction over cloud resources
}

// L1 - Sensible defaults and best practices
export abstract class L1Construct extends pulumi.ComponentResource {
  // Opinionated defaults, security best practices
}

// L2 - Common architectural patterns
export abstract class L2Construct extends pulumi.ComponentResource {
  // Combines multiple L1 constructs
}

// L3 - Complete application solutions
export abstract class L3Construct extends pulumi.ComponentResource {
  // Full application stacks
}
```

### Provider Abstraction

Each provider implements the same interface:

```typescript
interface ConstructProvider {
  createBucket(args: BucketArgs): L1Bucket;
  createDatabase(args: DatabaseArgs): L1Database;
  createFunction(args: FunctionArgs): L1Function;
  // ... other resource types
}
```

## MCP Integration

The Model Context Protocol (MCP) integration enables Claude to understand and assist with infrastructure decisions.

### MCP Provider Tools

1. **analyze_project_requirements**
   - Analyzes project needs (users, features, budget)
   - Generates requirements profile
   
2. **list_providers**
   - Lists available backend providers
   - Shows capabilities and recommendations

3. **compare_providers**
   - Detailed feature comparison
   - Cost analysis
   - Compliance information

4. **estimate_costs**
   - Monthly cost projections
   - Usage-based pricing breakdowns

5. **switch_provider**
   - Changes active provider
   - Optional migration planning

6. **migrate_data**
   - Plans data migration
   - Executes migration with rollback

7. **check_provider_health**
   - Provider status monitoring
   - Service availability

### MCP UI Testing Tools

For UI interaction and testing:

- **getPageScreenshot** - Capture UI states
- **inspectElement** - DOM element details
- **clickElement** - Automated interactions
- **validateLayout** - Layout issue detection

### Example MCP Workflow

```javascript
// 1. Analyze requirements
const requirements = await mcp.analyze_project_requirements({
  projectType: 'fullstack',
  expectedUsers: 10000,
  features: ['auth', 'realtime', 'storage'],
  budget: 'medium'
});

// 2. Compare providers
const comparison = await mcp.compare_providers({
  providers: ['firebase', 'aws'],
  requirements
});

// 3. Get cost estimates
const costs = await mcp.estimate_costs({
  requirements,
  providers: ['firebase', 'aws']
});
```

## C4 Diagram Support

Love Claude Code includes interactive C4 architecture diagrams with automatic generation from constructs.

### C4 Diagram Levels

1. **Context** - System boundaries and external actors
2. **Container** - High-level technology choices
3. **Component** - Components within containers
4. **Code** - Classes and code organization

### Key Features

- **Interactive Navigation** - Drill down through diagram levels
- **Auto-Generation** - Create from project structure or constructs
- **Filtering** - Show/hide external systems, relationships
- **Export Options** - SVG, PNG, JSON formats
- **Real-time Updates** - Reflects current architecture

### C4 Metadata in Constructs

```typescript
interface C4Metadata {
  type: 'System' | 'Container' | 'Component' | 'Code';
  technology?: string;
  external?: boolean;
  containerType?: 'WebApp' | 'Database' | 'MessageBus';
  position?: { x: number; y: number };
}
```

### Diagram Generation

```typescript
// From construct composition
const diagram = DiagramGenerator.generateFromComposition(
  composition,
  C4Level.CONTAINER
);

// From project structure
const diagram = DiagramGenerator.generateFromProject(
  projectStructure,
  C4Level.CONTEXT
);
```

## Quick Start Guide

### 1. Browse the Construct Catalog

Navigate to the Construct Catalog from the main menu:
- Use filters to narrow by level (L0-L3)
- Filter by provider (AWS, Firebase, Local)
- Search by name, tags, or description
- Sort by popularity, cost, or update date

### 2. Deploy a Construct

```typescript
// Select a construct from the catalog
const s3Bucket = catalog.getConstruct('aws-l1-s3-bucket');

// Configure inputs
const config = {
  bucketName: 'my-secure-bucket',
  enableVersioning: true,
  enableEncryption: true
};

// Deploy
await s3Bucket.deploy(config);
```

### 3. Compose Multiple Constructs

Use the visual composer to combine constructs:

```typescript
const composition = new ConstructComposition('my-app');

// Add constructs
composition.add('api', 'aws-l2-serverless-api');
composition.add('storage', 'aws-l1-s3-bucket');
composition.add('database', 'aws-l1-dynamodb-table');

// Connect them
composition.connect('api', 'storage');
composition.connect('api', 'database');

// Deploy entire composition
await composition.deploy();
```

### 4. Generate C4 Diagrams

```typescript
// Open C4 Diagram Viewer
const viewer = new C4DiagramViewer({
  composition: myComposition,
  initialLevel: C4Level.CONTAINER,
  interactive: true
});

// Export diagram
await viewer.export('svg', 'architecture.svg');
```

## Examples

### Example 1: Deploying a Serverless API

```typescript
// Using L2 pattern construct
const api = new ServerlessAPI('my-api', {
  runtime: 'nodejs18.x',
  cors: true,
  authentication: 'jwt',
  database: 'dynamodb'
});

// Outputs
console.log(api.endpoint); // https://api.example.com
console.log(api.functionArn); // arn:aws:lambda:...
```

### Example 2: Multi-Provider Migration

```typescript
// Start with Local provider
const localProject = new Project('my-app', {
  provider: 'local'
});

// Analyze and migrate to Firebase
const plan = await mcp.migrate_data({
  projectId: 'my-app',
  fromProvider: 'local',
  toProvider: 'firebase',
  execute: false
});

// Review plan and execute
if (plan.approved) {
  await mcp.migrate_data({
    ...plan,
    execute: true
  });
}
```

### Example 3: Custom Construct Creation

```typescript
// Create a custom L2 construct
export class SecureWebApp extends L2Construct {
  constructor(name: string, args: SecureWebAppArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:patterns:SecureWebApp', name, {}, opts);
    
    // Compose from L1 constructs
    const bucket = new S3Bucket(`${name}-static`, {
      enableEncryption: true,
      blockPublicAccess: true
    }, { parent: this });
    
    const cdn = new CloudFront(`${name}-cdn`, {
      origin: bucket.websiteEndpoint,
      priceClass: 'PriceClass_100'
    }, { parent: this });
    
    const waf = new WAF(`${name}-waf`, {
      rules: ['SQLi', 'XSS', 'RateLimiting']
    }, { parent: this });
    
    // Register outputs
    this.registerOutputs({
      url: cdn.domainName,
      bucketName: bucket.bucketName
    });
  }
}
```

## Currently Implemented Constructs

### L0 Primitives (14 Total)
**UI Primitives:**
- **CodeEditorPrimitive** - Basic code editor with syntax highlighting
- **ChatMessagePrimitive** - Simple message display component
- **FileTreePrimitive** - Basic file tree display
- **TerminalPrimitive** - Raw terminal output display
- **ButtonPrimitive** - Basic button with minimal styling
- **ModalPrimitive** - Simple modal dialog
- **PanelPrimitive** - Layout panel container
- **TabPrimitive** - Basic tab component

**Infrastructure Primitives:**
- **DockerContainerPrimitive** - Docker container definition
- **WebSocketServerPrimitive** - WebSocket server configuration
- **APIEndpointPrimitive** - REST API endpoint definition
- **DatabaseTablePrimitive** - Database table schema
- **StorageBucketPrimitive** - Object storage bucket
- **AuthTokenPrimitive** - Authentication token handler

### L1 Enhanced Constructs (8 Implemented)
**UI Constructs:**
- **SecureCodeEditor** - Enhanced editor with XSS protection, themes, and security features
- **AIChatInterface** - AI chat with Claude integration, markdown support, and conversation management
- **ProjectFileExplorer** - File explorer with CRUD operations, search, and security features
- **IntegratedTerminal** - Terminal with command history, ANSI colors, themes, and command execution
- **ResponsiveLayout** - Flexible layout system with resizable panels, breakpoints, and persistence
- **ThemedComponents** - Complete UI component library with dark/light themes and customization

**Infrastructure Constructs:**
- **ManagedContainer** - Production-ready container with health checks, logging, monitoring, and auto-recovery
- **AuthenticatedWebSocket** - WebSocket with JWT auth, auto-reconnect, message queuing, and presence tracking

### Coming Soon
- **More L1 Infrastructure Constructs** - RestAPIService, EncryptedDatabase, CDNStorage, SecureAuthService
- **L2 Pattern Constructs** - Common architectural patterns (IDE workspace, API patterns)
- **L3 Application Constructs** - Complete application templates

## Best Practices

1. **Start with Higher-Level Constructs** - Use L2/L3 constructs when possible
2. **Understand Cost Implications** - Always check cost estimates before deployment
3. **Use MCP for Guidance** - Let Claude help with provider selection
4. **Version Your Infrastructure** - Track construct versions in your project
5. **Test Locally First** - Use the Local provider for development
6. **Document Custom Constructs** - Follow the YAML schema for consistency

## Additional Resources

- [MCP Provider System Documentation](./MCP_PROVIDER_SYSTEM.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Frontend MCP Integration](./FRONTEND_MCP.md)
- [Multi-Cloud Architecture](./MULTI_CLOUD_ARCHITECTURE.md)
- [API Reference](./MCP_API.md)

## Getting Help

- **In-App Documentation**: Press F1 or click Help
- **MCP Assistant**: Ask Claude about infrastructure choices
- **Community**: Join our Discord for support
- **Issues**: Report bugs on GitHub