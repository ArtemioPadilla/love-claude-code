# Practical Guide: Using Constructs in Love Claude Code

This guide provides hands-on examples and best practices for using the construct system in Love Claude Code.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Browsing the Construct Catalog](#browsing-the-construct-catalog)
3. [Deploying Your First Construct](#deploying-your-first-construct)
4. [Creating Custom Constructs](#creating-custom-constructs)
5. [Using MCP for Provider Selection](#using-mcp-for-provider-selection)
6. [Generating C4 Diagrams](#generating-c4-diagrams)
7. [Real-World Examples](#real-world-examples)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Love Claude Code installed and running
- At least one provider configured (Local is pre-configured)
- Basic understanding of cloud infrastructure concepts

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/love-claude-code/love-claude-code.git

# Install dependencies
npm install

# Start the development environment
npm run dev
```

## Browsing the Construct Catalog

### 1. Access the Catalog

Navigate to the Construct Catalog:
- Click "Constructs" in the main navigation
- Or press `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)

### 2. Understanding the Interface

```
┌─────────────────────────────────────────────┐
│  🔍 Search constructs...          [Filters] │
├─────────────────────────────────────────────┤
│  Showing 47 constructs                      │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │   L1    │ │   L2    │ │   L3    │      │
│  │  S3     │ │  API    │ │  SaaS   │      │
│  │ Bucket  │ │Pattern  │ │Platform │      │
│  └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────┘
```

### 3. Using Filters

Filter constructs by:
- **Level**: L0 (Primitive), L1 (Foundation), L2 (Patterns), L3 (Applications)
- **Provider**: AWS, Firebase, Local
- **Category**: Storage, Compute, Database, Network
- **Cost**: Free tier eligible, Pay-as-you-go
- **Features**: Specific capabilities like "realtime", "serverless"

### 4. Search Tips

```typescript
// Search examples:
"s3"              // Find all S3-related constructs
"realtime"        // Find real-time capable constructs
"L2 api"          // Find L2 API patterns
"firebase auth"   // Find Firebase authentication constructs
```

## Deploying Your First Construct

### Example: Deploy a Secure S3 Bucket

1. **Find the Construct**
   ```
   Search: "s3 bucket secure"
   Result: aws-l1-s3-bucket (L1 - Foundation)
   ```

2. **Click to View Details**
   - Read the description and security features
   - Check the cost estimate
   - Review required inputs

3. **Configure the Construct**
   ```typescript
   // Configuration appears in a modal
   {
     bucketName: "my-app-uploads",
     enableVersioning: true,
     enableEncryption: true,
     blockPublicAccess: true,
     lifecycleRules: [
       {
         id: "delete-old-versions",
         status: "Enabled",
         noncurrentVersionExpiration: { days: 30 }
       }
     ],
     tags: {
       Environment: "production",
       Project: "my-app"
     }
   }
   ```

4. **Preview the Deployment**
   - Click "Preview" to see what will be created
   - Review the Pulumi preview output
   - Check estimated costs

5. **Deploy**
   - Click "Deploy" to create the resources
   - Monitor progress in real-time
   - View outputs when complete

### Deployment Output Example
```
Outputs:
  bucketArn: "arn:aws:s3:::my-app-uploads"
  bucketName: "my-app-uploads"
  bucketUrl: "https://my-app-uploads.s3.amazonaws.com"
```

## Creating Custom Constructs

### Step 1: Define the Construct Metadata

Create a YAML file in `/catalog/custom/L2/my-custom-api.construct.yaml`:

```yaml
id: custom-secure-api
level: L2
metadata:
  name: Secure REST API
  description: Production-ready API with auth, rate limiting, and monitoring
  version: 1.0.0
  author: Your Name
  category: api
  tags:
    - api
    - secure
    - rate-limiting
    - monitoring
  documentation: |
    ## Overview
    This L2 construct creates a secure REST API with:
    - JWT authentication
    - Rate limiting
    - Request/response logging
    - CloudWatch monitoring
    - Auto-scaling

providers:
  - aws

inputs:
  apiName:
    type: string
    description: Name of the API
    required: true
  rateLimit:
    type: number
    description: Requests per minute per IP
    required: false
    default: 100
  enableAuth:
    type: boolean
    description: Enable JWT authentication
    required: false
    default: true

outputs:
  apiEndpoint:
    type: string
    description: API Gateway endpoint URL
  authorizerArn:
    type: string
    description: Lambda authorizer ARN

security:
  - type: authentication
    description: JWT-based authentication
    severity: low
    mitigation: Properly configured by default

costs:
  - provider: aws
    baseCost: 10
    usage:
      requests:
        cost: 0.0000001
        unit: request
```

### Step 2: Implement the Pulumi Construct

Create `/pulumi-constructs/packages/custom/src/L2/SecureAPI.ts`:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { L2Construct } from "@love-claude-code/core";

export interface SecureAPIArgs {
  apiName: string;
  rateLimit?: number;
  enableAuth?: boolean;
}

export class SecureAPI extends L2Construct {
  public readonly endpoint: pulumi.Output<string>;
  public readonly authorizerArn: pulumi.Output<string>;

  constructor(
    name: string, 
    args: SecureAPIArgs, 
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:L2:SecureAPI", name, {}, opts);

    // Create API Gateway
    const api = new aws.apigatewayv2.Api(`${name}-api`, {
      name: args.apiName,
      protocolType: "HTTP",
      corsConfiguration: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE"],
        allowHeaders: ["content-type", "authorization"],
      },
    }, { parent: this });

    // Create Lambda authorizer if auth enabled
    let authorizer: aws.apigatewayv2.Authorizer | undefined;
    if (args.enableAuth) {
      const authLambda = new aws.lambda.Function(`${name}-authorizer`, {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: "index.handler",
        code: new pulumi.asset.AssetArchive({
          "index.js": new pulumi.asset.StringAsset(`
            exports.handler = async (event) => {
              // JWT validation logic here
              const token = event.headers.authorization;
              const isValid = validateJWT(token);
              
              return {
                isAuthorized: isValid,
                context: { userId: "user123" }
              };
            };
          `),
        }),
      }, { parent: this });

      authorizer = new aws.apigatewayv2.Authorizer(`${name}-auth`, {
        apiId: api.id,
        authorizerType: "REQUEST",
        authorizerUri: authLambda.invokeArn,
        identitySources: ["$request.header.Authorization"],
      }, { parent: this });

      this.authorizerArn = authorizer.id;
    }

    // Create stage with throttling
    const stage = new aws.apigatewayv2.Stage(`${name}-stage`, {
      apiId: api.id,
      name: "$default",
      autoDeploy: true,
      throttleSettings: {
        rateLimit: args.rateLimit || 100,
        burstLimit: (args.rateLimit || 100) * 2,
      },
    }, { parent: this });

    // Add CloudWatch logging
    const logGroup = new aws.cloudwatch.LogGroup(`${name}-logs`, {
      retentionInDays: 7,
    }, { parent: this });

    // Output the endpoint
    this.endpoint = pulumi.interpolate`${api.apiEndpoint}`;

    this.registerOutputs({
      endpoint: this.endpoint,
      authorizerArn: this.authorizerArn,
    });
  }
}
```

### Step 3: Register the Construct

Add to `/pulumi-constructs/packages/custom/src/index.ts`:

```typescript
export { SecureAPI, SecureAPIArgs } from './L2/SecureAPI';
```

### Step 4: Use Your Custom Construct

```typescript
// In your application
import { SecureAPI } from '@love-claude-code/custom';

const api = new SecureAPI('my-api', {
  apiName: 'production-api',
  rateLimit: 1000,
  enableAuth: true
});

// Use the outputs
export const apiUrl = api.endpoint;
```

## Using MCP for Provider Selection

### Example Conversation with Claude

**You**: "I'm building a real-time chat application for 50,000 users. Which provider should I use?"

**Claude** will use MCP tools:

1. **Analyze Requirements**
   ```json
   {
     "tool": "analyze_project_requirements",
     "arguments": {
       "projectType": "fullstack",
       "expectedUsers": 50000,
       "features": ["auth", "realtime", "storage", "notifications"],
       "dataVolume": "high",
       "budget": "medium"
     }
   }
   ```

2. **Compare Providers**
   ```json
   {
     "tool": "compare_providers",
     "arguments": {
       "providers": ["firebase", "aws"],
       "requirements": { /* from step 1 */ }
     }
   }
   ```

3. **Estimate Costs**
   ```json
   {
     "tool": "estimate_costs",
     "arguments": {
       "requirements": { /* from step 1 */ },
       "providers": ["firebase", "aws"]
     }
   }
   ```

**Claude's Response**:
"Based on your requirements for a real-time chat app with 50k users:

**Recommended: Firebase** ($450-600/month)
- ✅ Built-in real-time database
- ✅ Easier implementation (2-3 weeks)
- ✅ Automatic scaling
- ✅ Integrated push notifications

**Alternative: AWS** ($350-500/month)
- ✅ More control and flexibility
- ✅ Better long-term cost optimization
- ⚠️ More complex setup (4-6 weeks)
- ⚠️ Requires more expertise

Would you like me to help you set up Firebase for your project?"

### Switching Providers

```typescript
// Current: Local provider
// Target: Firebase

// 1. Plan the migration
const plan = await mcp.migrate_data({
  projectId: 'chat-app',
  fromProvider: 'local',
  toProvider: 'firebase',
  execute: false
});

// 2. Review the plan
console.log(plan.steps);
// - Export users from PostgreSQL
// - Transform to Firebase Auth format
// - Upload to Firebase
// - Update app configuration
// - Test endpoints

// 3. Execute migration
if (confirm('Proceed with migration?')) {
  await mcp.migrate_data({
    projectId: 'chat-app',
    fromProvider: 'local',
    toProvider: 'firebase',
    execute: true,
    options: {
      includeUsers: true,
      includeData: true,
      dryRun: false
    }
  });
}
```

## Generating C4 Diagrams

### 1. Auto-Generate from Project

```typescript
// In the UI, click "Architecture" → "Generate Diagram"

const diagram = await generateC4Diagram({
  source: 'project',
  projectId: 'my-app',
  level: 'container'
});
```

### 2. Generate from Construct Composition

```typescript
// Create a composition
const composition = {
  id: 'ecommerce-platform',
  name: 'E-Commerce Platform',
  constructs: [
    {
      constructId: 'aws-l2-serverless-api',
      instanceName: 'api-gateway',
      position: { x: 100, y: 100 }
    },
    {
      constructId: 'aws-l1-dynamodb-table',
      instanceName: 'products-db',
      position: { x: 300, y: 100 }
    },
    {
      constructId: 'aws-l1-s3-bucket',
      instanceName: 'media-storage',
      position: { x: 100, y: 300 }
    }
  ],
  connections: [
    {
      from: 'api-gateway',
      to: 'products-db',
      type: 'reads/writes'
    },
    {
      from: 'api-gateway',
      to: 'media-storage',
      type: 'stores'
    }
  ]
};

// Generate diagram
const viewer = new C4DiagramViewer({
  composition,
  initialLevel: C4Level.CONTAINER,
  interactive: true
});
```

### 3. Navigate and Export

```typescript
// Interactive navigation
viewer.on('nodeClick', (node) => {
  if (node.canDrillDown) {
    viewer.drillDown(node);
  }
});

// Export options
await viewer.export('svg', 'architecture.svg');
await viewer.export('png', 'architecture.png');
await viewer.export('json', 'architecture.json');
```

## Real-World Examples

### Example 1: SaaS Application Stack

```typescript
// Using L3 Application Construct
const saas = new SaaSPlatform('my-saas', {
  name: 'ProjectManager Pro',
  domain: 'projectmanager.com',
  features: {
    authentication: true,
    multiTenancy: true,
    billing: true,
    analytics: true
  },
  scaling: {
    minInstances: 2,
    maxInstances: 10,
    targetCPU: 70
  }
});

// Outputs complete infrastructure
console.log(saas.apiEndpoint);     // https://api.projectmanager.com
console.log(saas.webAppUrl);       // https://app.projectmanager.com
console.log(saas.adminPanelUrl);   // https://admin.projectmanager.com
```

### Example 2: Microservices with Event-Driven Architecture

```typescript
// Compose multiple L2 patterns
const eventBus = new EventBus('main-bus');

const userService = new MicroService('user-service', {
  runtime: 'nodejs18.x',
  memory: 512,
  eventBus: eventBus.arn
});

const orderService = new MicroService('order-service', {
  runtime: 'python3.10',
  memory: 1024,
  eventBus: eventBus.arn
});

const notificationService = new MicroService('notification-service', {
  runtime: 'nodejs18.x',
  memory: 256,
  eventBus: eventBus.arn,
  triggers: ['order.created', 'user.registered']
});
```

### Example 3: Static Website with CDN

```typescript
// Simple L2 pattern
const website = new StaticWebsite('marketing-site', {
  domainName: 'example.com',
  indexDocument: 'index.html',
  errorDocument: 'error.html',
  cdn: {
    enabled: true,
    priceClass: 'PriceClass_100',
    caching: {
      defaultTTL: 3600,
      maxTTL: 86400
    }
  }
});

// Deploy content
await website.deployContent('./dist');
```

## Troubleshooting

### Common Issues and Solutions

1. **Construct Not Found**
   ```
   Error: Construct 'aws-l2-api' not found
   Solution: Check spelling, ensure provider is installed
   ```

2. **Provider Not Configured**
   ```
   Error: AWS credentials not found
   Solution: Configure provider in Settings → Providers
   ```

3. **Deployment Failed**
   ```
   Error: Resource limit exceeded
   Solution: Check AWS quotas, request increase if needed
   ```

4. **Cost Warnings**
   ```
   Warning: Estimated cost exceeds budget
   Solution: Review configuration, use smaller instance types
   ```

### Debug Mode

Enable debug logging:
```typescript
// In settings
{
  debug: {
    constructs: true,
    mcp: true,
    deployment: true
  }
}
```

### Getting Help

1. **In-App Help**: Press F1 for contextual help
2. **Ask Claude**: "Why is my deployment failing?"
3. **Check Logs**: View → Developer Tools → Console
4. **Community**: Discord server for real-time help

## Best Practices

1. **Start Small**: Begin with L1 constructs, compose into L2
2. **Use Preview**: Always preview before deploying
3. **Tag Resources**: Use consistent tagging for cost tracking
4. **Version Control**: Commit your construct compositions
5. **Monitor Costs**: Set up billing alerts
6. **Security First**: Use secure-by-default constructs
7. **Document Custom Constructs**: Follow the YAML schema

## Next Steps

- Explore the [Construct Catalog](../frontend/src/constructs/catalog)
- Read about [Provider Architecture](./MULTI_CLOUD_ARCHITECTURE.md)
- Learn about [MCP Integration](./MCP_PROVIDER_SYSTEM.md)
- Join our community for support and updates