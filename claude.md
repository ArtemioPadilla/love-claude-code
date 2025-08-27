# CLAUDE.md - Love Claude Code Technical Documentation

## Quick Links
- [**📋 Todo List**](./claude-todo.md) - Current development tasks and progress
- [**🏗️ Architecture**](./docs/ARCHITECTURE.md) - System design
- [**🎯 Platform Vision**](./docs/PLATFORM_VISION.md) - Future roadmap
- [**📖 Construct Guidelines**](./docs/CONSTRUCT_LEVEL_GUIDELINES.md) - Development standards

## Project Overview
Love Claude Code is a web-based IDE that combines AI-powered code generation with real-time preview capabilities. The platform integrates Claude's conversational AI with a modern development environment for seamless code creation, editing, and deployment.

**Core Mission**: Enable developers to build applications through natural conversation with Claude while maintaining full control over their codebase.

## Tech Stack & Versions
```
Frontend:
- React 18.2+ with TypeScript 5.3+
- Vite 5.0+ (build tool and dev server)
- CodeMirror 6.0+ (code editor, NOT Monaco - 43% smaller bundle)
- Tailwind CSS 3.4+ (styling framework)
- Zustand 4.0+ (state management)
- Split.js (resizable panes)
- Framer Motion (animations)
- Recharts (data visualization)
- ReactFlow (architecture diagrams)
- Lucide React (icon library)

Backend - Multi-Provider Architecture:
- Node.js 20+ with TypeScript
- Provider abstraction layer for multi-cloud support
- Shared utilities: caching, monitoring, resilience patterns

Local Provider:
- PostgreSQL + JSON file storage
- JWT authentication
- File system storage
- Node.js function execution
- WebSocket server

Firebase Provider:
- Firebase Admin SDK 12.0+
- Firestore (with offline persistence)
- Firebase Auth
- Cloud Storage
- Cloud Functions
- Realtime Database
- Firebase Cloud Messaging

AWS Provider:
- AWS SDK v3 (modular)
- Cognito (authentication)
- DynamoDB (database)
- S3 (storage)
- Lambda (functions)
- API Gateway + WebSocket
- SES/SNS (notifications)
- CloudWatch (monitoring)

Enterprise Features:
- Redis + LRU cache (hybrid caching)
- Circuit breakers (resilience)
- Retry logic with exponential backoff
- Unified metrics collection
- Health checks and monitoring

AI Integration:
- Anthropic Claude API (development)
- AWS Bedrock Claude models (production)
- WebSocket streaming for real-time responses
- Claude 3.5 Sonnet + Claude 3 Haiku

DevOps:
- Docker with multi-stage builds
- Docker Compose for full-stack development
- LocalStack (AWS local development)
- Firebase Emulator Suite
- GitHub Actions (CI/CD)
- Prometheus + Grafana (monitoring)
```

## Project Structure
```
love-claude-code/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Editor/       # CodeMirror editor components
│   │   │   ├── Chat/         # Claude chat interface
│   │   │   ├── Preview/      # Live app preview
│   │   │   ├── Layout/       # Layout and navigation
│   │   │   ├── LandingPage/  # Landing page with features
│   │   │   ├── DocumentationCenter/ # Full documentation site
│   │   │   ├── Navigation/   # Navigation state management
│   │   │   ├── ConstructBuilder/ # Visual construct IDE
│   │   │   ├── ConstructMarketplace/ # Construct sharing hub
│   │   │   ├── TDD/          # Test-driven development UI
│   │   │   └── SpecificationEditor/ # Spec creation tools
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Zustand state stores
│   │   ├── services/         # API and external service calls
│   │   ├── utils/            # Helper functions and utilities
│   │   ├── types/            # TypeScript type definitions
│   │   └── constructs/       # Self-referential construct system
│   │       ├── types/        # Construct type definitions
│   │       ├── base/         # Base construct classes
│   │       ├── L0/           # Primitive constructs
│   │       │   ├── ui/       # UI primitives
│   │       │   └── infrastructure/ # Infrastructure primitives
│   │       ├── L1/           # Configured constructs
│   │       │   ├── ui/       # UI components
│   │       │   ├── infrastructure/ # Infrastructure components
│   │       │   └── external/ # External integrations
│   │       ├── L2/           # Pattern constructs
│   │       └── L3/           # Application constructs
│   ├── public/               # Static assets
│   └── tests/                # Frontend tests
├── backend/                  # Backend services
│   ├── src/
│   │   ├── providers/        # Multi-cloud provider implementations
│   │   │   ├── local/        # Local development provider
│   │   │   │   ├── auth.ts          # JWT authentication
│   │   │   │   ├── database.ts      # PostgreSQL/JSON storage
│   │   │   │   ├── storage.ts       # File system storage
│   │   │   │   ├── functions.ts     # Node.js execution
│   │   │   │   ├── realtime.ts      # WebSocket server
│   │   │   │   └── index.ts         # Provider orchestration
│   │   │   ├── firebase/     # Firebase provider
│   │   │   │   ├── auth.ts          # Firebase Auth
│   │   │   │   ├── database.ts      # Firestore
│   │   │   │   ├── storage.ts       # Cloud Storage
│   │   │   │   ├── functions.ts     # Cloud Functions
│   │   │   │   ├── realtime.ts      # Realtime Database
│   │   │   │   ├── notifications.ts # FCM
│   │   │   │   └── index.ts         # Provider orchestration
│   │   │   ├── aws/          # AWS provider
│   │   │   │   ├── auth.ts          # Cognito
│   │   │   │   ├── database.ts      # DynamoDB
│   │   │   │   ├── storage.ts       # S3
│   │   │   │   ├── functions.ts     # Lambda
│   │   │   │   ├── realtime.ts      # API Gateway WebSocket
│   │   │   │   ├── notifications.ts # SES/SNS
│   │   │   │   └── index.ts         # Provider orchestration
│   │   │   ├── shared/       # Shared utilities
│   │   │   │   ├── cache.ts         # Hybrid caching
│   │   │   │   ├── monitoring.ts    # Metrics & health
│   │   │   │   ├── resilience.ts    # Circuit breakers
│   │   │   │   └── index.ts         # Utility exports
│   │   │   ├── types.ts      # Provider interfaces
│   │   │   └── factory.ts    # Provider factory pattern
│   │   ├── api/              # REST API endpoints
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helper functions
│   └── tests/                # Backend tests
├── infrastructure/           # AWS CDK infrastructure code
│   ├── stacks/               # CDK stack definitions
│   ├── constructs/           # Reusable CDK constructs
│   └── config/               # Environment configurations
├── docker/                   # Docker configurations
│   ├── nginx/                # Reverse proxy configs
│   ├── prometheus/           # Metrics collection
│   ├── grafana/              # Monitoring dashboards
│   └── *.Dockerfile          # Service-specific Dockerfiles
├── constructs/               # Construct catalog definitions
│   └── catalog/              # YAML construct definitions
│       ├── L0/               # L0 construct catalog
│       │   ├── ui/           # UI primitive definitions
│       │   └── infrastructure/ # Infrastructure primitive definitions
│       ├── L1/               # L1 construct catalog
│       ├── L2/               # L2 construct catalog
│       └── L3/               # L3 construct catalog
├── scripts/                  # Build & deployment scripts
│   ├── localstack/           # AWS local development setup
│   ├── postgres/             # Database initialization
│   └── firebase/             # Firebase emulator setup
└── docs/                     # Technical documentation
```

## Core Development Commands

### Setup and Installation
```bash
# Initial setup
npm install                   # Install all dependencies
npm run setup                 # Initialize development environment
npm run dev                   # Start development servers

# Environment setup
cp .env.example .env.local    # Copy environment template
# Configure API keys in .env.local
```

### Development Workflow
```bash
# Frontend development
npm run dev:frontend          # Start React dev server (port 3000)
npm run build:frontend        # Build for production
npm run test:frontend         # Run frontend tests

# Backend development  
npm run dev:backend           # Start backend services locally
npm run build:backend         # Build backend services
npm run test:backend          # Run backend tests

# Full stack development
npm run dev                   # Start both frontend and backend
npm run test                  # Run all tests
npm run lint                  # Lint all code
npm run type-check            # TypeScript type checking
```

### Infrastructure & Deployment
```bash
# Local infrastructure (Docker)
npm run docker:build          # Build all containers
npm run docker:up             # Start local infrastructure
npm run docker:down           # Stop local infrastructure

# AWS deployment
npm run deploy:dev            # Deploy to development environment
npm run deploy:staging        # Deploy to staging environment
npm run deploy:prod           # Deploy to production environment

# Infrastructure management
npm run infra:diff            # Show infrastructure changes
npm run infra:deploy          # Deploy infrastructure changes
npm run infra:destroy         # Destroy infrastructure (careful!)
```

## Repository Etiquette & Git Workflow

### Branch Naming Convention
```
feature/ISSUE-123-add-claude-streaming
bugfix/ISSUE-456-fix-editor-crash
hotfix/security-patch-auth
release/v1.2.0
```

### Commit Message Format
Follow conventional commits:
```
feat(editor): add syntax highlighting for Python
fix(chat): resolve streaming connection timeout
docs(readme): update installation instructions
refactor(api): simplify authentication flow
test(editor): add unit tests for file operations
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all checks pass (`npm run check-all`)
4. Create PR with descriptive title and context
5. Request review from relevant team members
6. Merge using "Squash and merge" (not rebase)

## Core Files & Utilities

### Essential Files to Understand
- `frontend/src/stores/editorStore.ts` - Central editor state management
- `frontend/src/services/claudeApi.ts` - Claude API integration layer  
- `frontend/src/components/Editor/EditorCore.tsx` - Main editor component
- `backend/lambda/claude/streaming.ts` - Claude streaming implementation
- `backend/shared/types.ts` - Shared TypeScript definitions
- `infrastructure/stacks/MainStack.ts` - Primary infrastructure stack

### Construct System Files
- `frontend/src/constructs/types/index.ts` - Construct type definitions and interfaces
- `frontend/src/constructs/base/BaseConstruct.ts` - Base class for all constructs
- `frontend/src/constructs/base/L0Construct.ts` - L0 primitive base classes
- `frontend/src/constructs/base/L1Construct.ts` - L1 component base classes (UI/Infrastructure)
- `frontend/src/constructs/base/L1ExternalConstruct.ts` - L1 external integration base class
- `frontend/src/constructs/base/L2Construct.ts` - L2 pattern base class
- `frontend/src/constructs/L0/ui/CodeEditorPrimitive.tsx` - Example L0 UI construct
- `frontend/src/constructs/L1/external/PlaywrightMCPIntegration.tsx` - Example L1 external construct
- `frontend/src/constructs/catalog/ConstructCatalog.tsx` - Visual construct catalog with dependencies
- `frontend/src/constructs/utils/dependencyResolver.ts` - Dependency graph resolution
- `constructs/catalog/L0/ui/*.yaml` - L0 construct catalog definitions
- `constructs/catalog/L1/external/*.yaml` - L1 external construct definitions
- `docs/CONSTRUCT_LEVEL_GUIDELINES.md` - Development guidelines for each level
- `docs/EXTERNAL_CONSTRUCTS.md` - External integration system design

### Key Utilities
- `frontend/src/utils/codeParser.ts` - Parse and analyze code structure
- `frontend/src/utils/claudeContext.ts` - Manage conversation context
- `backend/shared/security.ts` - Security utilities and validation
- `backend/shared/claude.ts` - Claude API wrapper and error handling
- `backend/src/services/claude.ts` - Claude service with dynamic config
- `frontend/src/services/tdd/SpecificationParser.ts` - Natural language spec parsing
- `frontend/src/services/tdd/TestGenerator.ts` - Automatic test generation
- `frontend/src/components/TDD/TDDWorkflow.tsx` - Visual TDD interface

## Multi-Provider Architecture

### Provider Pattern
The backend now uses a provider abstraction pattern that allows switching between different cloud backends:

```typescript
// Provider interface example
interface BackendProvider {
  type: ProviderType // 'local' | 'firebase' | 'aws'
  auth: AuthProvider
  database: DatabaseProvider
  storage: StorageProvider
  realtime: RealtimeProvider
  functions: FunctionProvider
}

// Using providers
const provider = await getProvider({
  type: 'local',
  projectId: 'my-project'
})

const user = await provider.auth.signUp(email, password)
```

### Provider Features
- **Local Provider**: Zero-config development with JSON storage
- **Firebase Provider**: Rapid prototyping with real-time sync
- **AWS Provider**: Production-ready with fine-grained control

### In-App Settings Management
All credentials and API keys can now be configured through the app UI:

```typescript
// Settings stored encrypted in backend
interface Settings {
  general: {
    theme: 'light' | 'dark'
    language: string
  }
  ai: {
    apiKey?: string // Encrypted at rest
    model: string
    temperature: number
  }
  providers: {
    default: ProviderType
    firebase?: FirebaseConfig
    aws?: AWSConfig
  }
}
```

## Todo List Management

**IMPORTANT**: All development tasks are tracked in [claude-todo.md](./claude-todo.md). This is the single source of truth for platform development tasks.

### Using the Todo List
- Check `claude-todo.md` at the start of each session
- Update task status as you work (pending → in_progress → completed)
- Add new tasks as they are discovered
- Reference task IDs in commit messages
- The todo list follows the platform vision and roadmap

### Todo Categories
1. **Immediate Priorities**: User-requested features and critical fixes
2. **Phase 1-4**: Aligned with platform development roadmap
3. **Priority Levels**: 🔴 HIGH, 🟡 MEDIUM, 🟢 LOW

## Development Patterns & Best Practices

### React/Frontend Patterns
```typescript
// Use Zustand for state management
const useEditorStore = create<EditorState>((set, get) => ({
  // State and actions
}));

// Custom hooks for complex logic
const useClaudeChat = () => {
  // Chat logic abstraction
};

// Component composition over inheritance
const Editor = () => (
  <EditorLayout>
    <EditorTabs />
    <EditorContent />
    <EditorSidebar />
  </EditorLayout>
);
```

### Backend/API Patterns
```typescript
// Lambda function structure
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Validate input
    // Process request
    // Return response
  } catch (error) {
    return handleError(error);
  }
};

// Error handling
const handleError = (error: unknown): APIGatewayProxyResult => {
  // Standardized error response
};
```

### Testing Patterns
- Unit tests: Test individual functions and components
- Integration tests: Test API endpoints and database interactions  
- E2E tests: Test complete user workflows with Playwright
- Mock external services (Claude API, AWS services) in tests

## Claude Integration Guidelines

### API Usage Patterns
```typescript
// Streaming responses
const stream = await claude.createStream({
  messages: conversationHistory,
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4000
});

// Context management
const context = buildClaudeContext({
  codebase: currentProject,
  conversation: chatHistory,
  userPreferences: settings
});
```

### Hybrid Claude Integration
```python
class HybridClaudeClient:
    def __init__(self, environment="development"):
        if environment == "development":
            self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        elif environment == "production":
            self.client = AnthropicBedrock(
                aws_region=os.getenv("AWS_REGION", "us-west-2")
            )
```

### Rate Limiting & Cost Management
- Development: Direct Anthropic API with rate limiting
- Production: AWS Bedrock with intelligent model routing
  - Simple queries → Haiku ($0.25/1M tokens)
  - Complex tasks → Sonnet ($3.00/1M tokens)
- Cache responses when possible to reduce API calls
- Implement request queueing for high-volume scenarios
- Context window: 180,000 tokens with smart truncation

## Security Considerations

### Code Execution Sandbox
- All user code runs in isolated Docker containers
- Resource limits: 512MB RAM, 0.5 CPU, 30-second timeout
- Network restrictions: no external access except approved APIs
- File system: temporary, cleaned after execution

### API Key Management
- Store user API keys in AWS Secrets Manager
- Encrypt sensitive data at rest and in transit
- Implement proper authentication and authorization
- Never log or expose API keys in responses

## "Do Not Touch" Guidelines

### Forbidden Actions
❌ **DO NOT** modify these without explicit approval:
- `infrastructure/stacks/SecurityStack.ts` - Security configurations
- `backend/shared/auth.ts` - Authentication logic
- Any file in `docker/security/` - Container security settings
- Production environment variables or secrets

❌ **DO NOT** implement these patterns:
- Direct database access from frontend
- Storing API keys in localStorage or cookies
- Synchronous code execution (must be sandboxed)
- Hard-coded environment-specific values

❌ **DO NOT** skip these requirements:
- Security review for any auth-related changes
- Performance testing for editor interactions
- Accessibility checks for UI components
- Type checking for all TypeScript code

### Legacy Code Protection
- `frontend/src/legacy/` - Working legacy components, refactor carefully
- Database migration files - Never modify existing migrations
- Published API contracts - Maintain backward compatibility

## Troubleshooting Guide

### Common Issues

#### Editor Performance
- **Symptom**: Editor feels sluggish or unresponsive
- **Solutions**:
  - Check CodeMirror extension loading, disable unnecessary features
  - Reduce syntax highlighting for very large files
  - Enable virtual scrolling for files > 10,000 lines
  - Clear editor cache: `localStorage.removeItem('editor-cache')`

#### Claude API Timeouts
- **Symptom**: Claude responses timeout or fail
- **Solutions**:
  - Implement exponential backoff with retry
  - Check rate limits in response headers
  - Reduce context size for long conversations
  - Use streaming responses for better UX

#### Container Build Failures
- **Symptom**: Docker build fails or images won't start
- **Solutions**:
  ```bash
  # Clear Docker cache
  docker system prune -a
  # Check base image versions
  docker pull node:20-alpine
  # Rebuild with no cache
  docker-compose build --no-cache
  ```

#### TypeScript Errors
- **Symptom**: Type errors in IDE or build
- **Solutions**:
  ```bash
  # Check for type errors
  npm run type-check
  # Clean TypeScript cache
  rm -rf frontend/tsconfig.tsbuildinfo
  rm -rf backend/tsconfig.tsbuildinfo
  # Ensure proper imports
  npm run lint:fix
  ```

#### WebSocket Connection Issues
- **Symptom**: Real-time features not working
- **Solutions**:
  - Check WebSocket port (8001) is not blocked
  - Verify authentication token is valid
  - Check browser console for connection errors
  - Try disabling browser extensions

### Development Environment Reset
```bash
# Nuclear option - complete reset
npm run clean                 # Clean all build artifacts
rm -rf node_modules           # Remove dependencies
rm -rf .next .turbo          # Remove build caches
rm -rf data storage          # Remove local data (backup first!)
npm install                   # Reinstall everything
npm run setup                 # Reinitialize environment
```

### Performance Debugging

#### Frontend Performance
- Use React DevTools Profiler to identify slow components
- Enable "Highlight Updates" to see unnecessary re-renders
- Check bundle size with `npm run analyze`
- Monitor network waterfall for slow API calls

#### Backend Performance
- Enable debug logging: `DEBUG=* npm run dev:backend`
- Use Node.js `--inspect` flag for profiling
- Monitor database query times
- Check for N+1 query problems

#### Claude API Performance
- Monitor token usage in responses
- Cache common responses when appropriate
- Use appropriate model for the task (Haiku for simple, Sonnet for complex)
- Implement request queuing for rate limits

## Multi-Provider Architecture Patterns

### Provider Implementation Guidelines

When implementing a new provider or modifying existing ones:

1. **Interface Compliance**: All providers MUST implement the common interfaces in `backend/src/providers/types.ts`
2. **Error Handling**: Use provider-specific error mapping to common error types
3. **Configuration**: Support both environment variables and in-app settings
4. **Testing**: Include unit tests and integration tests with emulators/local services

### Provider Pattern Examples

#### Authentication Pattern
```typescript
// All auth providers must implement:
interface AuthProvider {
  signUp(credentials: UserCredentials): Promise<User>
  signIn(credentials: UserCredentials): Promise<{ user: User; token: string }>
  signOut(userId: string): Promise<void>
  verifyToken(token: string): Promise<AuthToken>
  // ... other required methods
}
```

#### Database Pattern with Caching
```typescript
// Use shared cache decorator for read operations
@cacheable({ ttl: 300 })
async get(table: string, id: string): Promise<DatabaseItem | null> {
  // Implementation
}

// Invalidate cache on writes
@invalidatesCache(['query:*', 'get:*'])
async update(table: string, id: string, updates: Partial<DatabaseItem>) {
  // Implementation
}
```

#### Resilience Pattern
```typescript
// Use circuit breaker for external calls
async invoke(name: string, payload: any): Promise<any> {
  return this.circuitBreaker.execute(() =>
    withRetry(() => this.lambdaClient.send(command), {
      maxRetries: 3,
      retryableErrors: ['ThrottlingException', 'ServiceException']
    })
  )
}
```

### Shared Utilities Usage

#### Monitoring
```typescript
import { UnifiedMonitoringService, trackPerformance } from '../shared/monitoring.js'

class MyProvider {
  private monitoring = new UnifiedMonitoringService()
  
  @trackPerformance
  async someMethod() {
    // Method automatically tracked for latency and errors
  }
}
```

#### Caching
```typescript
import { UnifiedCacheManager, cacheable } from '../shared/cache.js'

class MyProvider {
  private cache = new UnifiedCacheManager({
    provider: 'hybrid', // Uses Redis + LRU
    defaultTTL: 300
  })
  
  @cacheable({ ttl: 600 })
  async getData(id: string) {
    // Result automatically cached
  }
}
```

#### Resilience
```typescript
import { CircuitBreaker, withRetry, bulkhead } from '../shared/resilience.js'

class MyProvider {
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000
  })
  
  @bulkhead({ maxConcurrent: 10 })
  async processRequest() {
    // Limits concurrent executions
  }
}
```

### Testing Providers

Each provider should have:

1. **Unit Tests**: Test individual methods with mocked dependencies
2. **Integration Tests**: Test with emulators/local services
3. **Contract Tests**: Ensure interface compliance
4. **Performance Tests**: Verify caching and optimization

Example test structure:
```typescript
describe('Provider Contract Tests', () => {
  testProviderContract(LocalProvider)
  testProviderContract(FirebaseProvider)
  testProviderContract(AWSProvider)
})
```

## MCP (Model Context Protocol) Integration

Love Claude Code includes a comprehensive MCP server for provider management, enabling Claude to understand and assist with backend provider selection and configuration.

### MCP Architecture

The MCP system provides tools for:
- Analyzing project requirements
- Comparing provider capabilities
- Estimating costs
- Planning migrations between providers
- Checking provider health
- Managing provider configurations

### Available MCP Tools

1. **analyze_project_requirements** - Analyzes project needs and generates requirements profile
2. **list_providers** - Lists available providers with capabilities
3. **get_provider_config** - Retrieves current provider configuration
4. **compare_providers** - Provides detailed provider comparison
5. **estimate_costs** - Estimates costs based on requirements
6. **switch_provider** - Switches active provider with migration options
7. **migrate_data** - Plans or executes data migration
8. **check_provider_health** - Checks provider health status

### MCP Usage Patterns

#### For Provider Selection
```typescript
// Claude can help users choose providers by:
// 1. Analyzing their requirements
const requirements = await mcp.analyzeProjectRequirements({
  projectType: 'fullstack',
  expectedUsers: 50000,
  features: ['auth', 'realtime', 'storage'],
  budget: 'medium'
})

// 2. Comparing options
const comparison = await mcp.compareProviders({
  providers: ['local', 'firebase', 'aws'],
  requirements
})

// 3. Estimating costs
const costs = await mcp.estimateCosts({ requirements })
```

#### For Provider Migration
```typescript
// Plan migration
const plan = await mcp.migrateData({
  projectId: 'my-project',
  fromProvider: 'local',
  toProvider: 'firebase',
  execute: false
})

// Execute migration
const result = await mcp.migrateData({
  projectId: 'my-project',
  fromProvider: 'local',
  toProvider: 'firebase',
  execute: true,
  options: {
    includeUsers: true,
    includeData: true,
    includeFiles: true
  }
})
```

### MCP Integration Points

1. **Chat Interface**: Claude can use MCP tools to answer provider-related questions
2. **Settings UI**: Visual provider management using MCP data
3. **CLI Commands**: Direct MCP tool invocation from command line
4. **API Endpoints**: REST endpoints wrapping MCP functionality

### MCP Best Practices

1. **User Control**: MCP provides recommendations but users make final decisions
2. **Transparency**: Always show what MCP tools are being used
3. **Error Handling**: Gracefully handle provider unavailability
4. **Cost Awareness**: Always include cost estimates in recommendations
5. **Migration Safety**: Never auto-execute migrations without explicit approval

For detailed MCP documentation, see:
- [MCP Provider System Documentation](./docs/MCP_PROVIDER_SYSTEM.md)
- [Frontend MCP Integration Guide](./docs/FRONTEND_MCP.md)

## External Integration Patterns

### External Construct Architecture

Love Claude Code supports integration with external tools and services through a dedicated construct hierarchy:

#### L0 External Primitives
```typescript
// NPM Package Primitive - Wraps external NPM packages
const npmPackage = new NpmPackagePrimitive({
  packageName: '@playwright/test',
  version: '^1.40.0'
})

// Docker Service Primitive - Manages containerized services
const dockerService = new DockerServicePrimitive({
  imageName: 'apache/airflow:2.8.0',
  ports: { '8080': '8080' }
})
```

#### L1 External Constructs
All L1 external constructs extend `L1ExternalConstruct` and provide:
- Security validation and API key management
- Connection pooling and health checks
- Rate limiting and retry logic
- Monitoring and metrics collection

#### Available External Integrations

1. **PlaywrightMCPIntegration** - Browser automation and testing
   - Navigate to URLs, click elements, take screenshots
   - Extract page content and validate UI states
   - Run automated browser tests

2. **AirflowIntegration** - Workflow orchestration
   - Create and manage DAGs
   - Monitor task execution
   - Schedule and trigger workflows

3. **SupersetIntegration** - Business intelligence
   - Create dashboards and charts
   - Query databases and visualize data
   - Share insights with teams

4. **GrafanaIntegration** - Monitoring and observability
   - Create monitoring dashboards
   - Set up alerts and notifications
   - Visualize metrics from multiple sources

### External Integration Best Practices

1. **Security**: Always encrypt API keys and use secure connections
2. **Error Handling**: Implement robust retry logic with circuit breakers
3. **Performance**: Use connection pooling and caching where appropriate
4. **Monitoring**: Track integration health and performance metrics
5. **Documentation**: Provide clear examples and configuration guides

## Recent Updates (January 2025)

### Self-Referential Platform Development
- **Platform Vision**: Established Love Claude Code as a self-referential platform that builds itself (82% vibe-coded, 18% traditionally coded)
- **Construct Hierarchy**: Implemented L0→L1→L2→L3 construct system with strict layering
- **Construct Implementation Progress** (Verified January 2025): 
  - L0 Primitives: 27 constructs (12 UI, 7 Infrastructure, 4 MCP, 4-6 External Integration)
  - L1 Components: 29 constructs (10 UI including diagram components, 13 Infrastructure, 6 External)
  - L2 Patterns: 22 constructs (12 core + 3 visualization + 2 MCP + 5 external integration patterns)
  - L3 Applications: 5 complete applications (Frontend, Backend, MCP Server, Platform, Architecture Visualizer)
  - **Total**: 83 constructs fully implemented (27.7% above original target of 65)
- **New L0 Primitives**: Graph, Layout Engine, NPM Package, Docker Service, Node/Edge primitives
- **New L1 Components**: Secure MCP Server, Authenticated Tool Registry, Rate-Limited RPC, Encrypted WebSocket, Draggable Node, Connected Edge, Zoomable Graph, Diagram Toolbar
- **New L2 Patterns**: MCP Server Pattern, Tool Orchestration Pattern, MCP Client Pattern, Distributed MCP Pattern, Dependency Graph Pattern, Hierarchy Visualization Pattern, Interactive Diagram Pattern, External Library Pattern, MCP Server Integration Pattern, Containerized Service Pattern, API Aggregation Pattern, Plugin System Pattern
- **Construct Guidelines**: Comprehensive development guidelines for each construct level
- **Self-Referential Metadata**: All platform constructs track their development method and vibe-coding percentage

### External Integration System
- **External Construct Base**: L1ExternalConstruct base class for all external integrations
- **NPM Package Integration**: ValidatedNpmPackage construct with security scanning and version management
- **MCP Server Integrations**: 
  - PlaywrightMCPIntegration - Browser automation and testing
  - AirflowIntegration - Workflow orchestration with DAG management
  - SupersetIntegration - Business intelligence dashboards and analytics
  - GrafanaIntegration - Monitoring and observability dashboards
- **Docker Service Support**: Docker service primitive for containerized tools
- **External Service Management**: Authentication, connection pooling, health checks
- **Security Features**: API key encryption, rate limiting, connection validation
- **UI Components**: React components for each integration with visual management

### Website and Documentation Transformation
- **Beautiful Landing Page**: New landing page with hero section, feature showcase, and provider comparison
- **Dedicated Documentation Center**: Full documentation website with 19 comprehensive sections
- **Interactive Visualizations**: Added architecture diagrams (ReactFlow) and provider comparison charts (Recharts)
- **Navigation System**: New navigation bar with Home, Projects, Documentation, and Features sections
- **Responsive Design**: Fully responsive documentation and landing pages with mobile optimization
- **New Documentation Sections**:
  - Construct System Guide - Complete guide to L0/L1/L2/L3 hierarchy
  - Construct Builder Guide - Using the visual construct IDE
  - Visual Composer Guide - Drag-and-drop programming
  - Marketplace Guide - Publishing and discovering constructs
  - Enterprise Guide - SSO, RBAC, and team management
  - Self-Hosting Guide - Platform deployment and updates
  - Performance Guide - Metrics and monitoring dashboards
  - Construct Development Guide - End-to-end construct creation
  - External Integration Guide - Using third-party tools

### TDD/SDD Infrastructure
- **Test-Driven Development**: Complete TDD workflow with specification parsing
- **Specification Parser**: Natural language to formal spec conversion
- **Test Generator**: Automatic test generation from specifications
- **TDD Workflow Component**: Visual TDD interface integrated into navigation
- **Test Templates**: Pre-built templates for common test scenarios
- **Code Coverage**: Integrated coverage reporting for all constructs
- **Continuous Testing**: Real-time test execution during development

### Enterprise Features
- **SSO Integration**: SAML 2.0 and OAuth 2.0 support
- **RBAC System**: Role-based access control with team management
- **Audit Logging**: Comprehensive activity tracking and compliance
- **Multi-tenancy**: Project isolation and resource management
- **API Rate Limiting**: Token bucket algorithm with configurable limits
- **Encryption**: AES-256-GCM with ECDHE key exchange
- **Performance Dashboard**: Real-time metrics with Prometheus integration
- **Cost Analytics**: Usage tracking and budget alerts

### Platform Enhancements
- **Construct Creation Wizard**: 5-step guided construct creation with validation
- **Visual Construct Composer**: Drag-and-drop interface for building constructs
- **Construct Marketplace**: Community hub for sharing and discovering constructs
- **Built with Itself Showcase**: Interactive demos showing self-referential development
- **Architecture Diagrams**: Visual representation of construct dependencies using ReactFlow
- **Dependency Graph**: Automatic visualization of construct relationships
- **Construct Documentation**: Auto-generated docs from construct metadata
- **Construct Testing**: Integrated testing framework for construct validation
- **Construct Versioning**: Semantic versioning support for construct updates

### Developer Experience
- **Monaco Editor Integration**: Enhanced code editing with IntelliSense
- **Live Preview Updates**: Real-time preview refresh with hot module replacement
- **Construct Templates**: Pre-built templates for common patterns
- **Code Generation**: AI-powered code generation from descriptions
- **Import Resolution**: Automatic import management for constructs
- **Type Safety**: Full TypeScript support with strict typing
- **Performance Monitoring**: Built-in performance profiling tools
- **Debug Tools**: Integrated debugging for construct development

### Navigation Improvements
- **Project Title Display**: Current project name now shows in header with breadcrumb navigation
- **Back to Projects Button**: Explicit navigation button with arrow icon for returning to projects page
- **Multiple Navigation Options**: Logo click, project name click, back button, and File menu option
- **Mobile Responsive**: Compact project indicator on mobile devices

### Chat UI Enhancements
- **Responsive Chat Panel**: Dynamic text sizing and layout for narrow widths
- **Font Scaling**: Automatic font size adjustment in compact mode (< 300px width)
- **Dynamic Placeholders**: Context-aware placeholder text based on panel width
- **Microphone Button**: Now visible in all modes with appropriate sizing

### Editor Panel Fixes
- **Panel Sizing**: Corrected panel size distribution to ensure editor visibility
- **Height Issues**: Fixed vertical space allocation between editor and terminal
- **Resize Constraints**: Proper min/max sizes for all panels

### MCP UI Testing Server
- **New MCP Server**: Dedicated server for UI interaction and testing
- **DOM Inspection**: Tools for inspecting elements, styles, and layout
- **Screenshot Capability**: Capture page states for visual testing
- **Interaction Tools**: Click, type, and navigate programmatically
- **Layout Validation**: Automatic detection of layout issues

### MCP Provider Server Fixes
- **Fixed Dependencies**: Added @modelcontextprotocol/sdk to backend
- **Import Corrections**: Fixed compareProviders import issues
- **TypeScript Fixes**: Resolved compilation errors for MCP servers
- **Direct Execution**: Provider server now runs via tsx for development
- **Configuration Updates**: Updated mcp.json with absolute paths

### Construct Development Features
- **ConstructBuilder Component**: Visual construct development with real-time preview
- **Construct Marketplace**: Browse, install, and share community constructs
- **Construct Showcase**: Interactive demos and examples for all constructs
- **Architecture Diagrams**: Visual representation of construct dependencies using ReactFlow
- **Dependency Graph**: Automatic visualization of construct relationships
- **Construct Documentation**: Auto-generated docs from construct metadata

### TDD Guard and Vibe Coding Safety (January 2025)
- **TDD Guard Integration**: Real-time enforcement of Test-Driven Development
- **Vibe Coding Safety Service**: Comprehensive AI-assisted development safety
- **Security Scanning**: Automatic detection of hardcoded secrets and vulnerabilities
- **Quality Gates**: Enforced coverage, complexity, and duplication thresholds
- **Claude Code Hooks**: Integration with PreToolUse hooks for file operation validation
- **Phase Tracking**: Visual indicators for Red→Green→Refactor cycle
- **Safety Metrics**: Real-time monitoring of TDD compliance and safety violations
- **Documentation**: Complete guides in VIBE_CODING_SAFETY.md and TDD_GUARD_INTEGRATION.md
- **Construct Testing**: Integrated testing framework for construct validation
- **Construct Versioning**: Semantic versioning support for construct updates

## AI-Assisted Development Notes

When working with Claude on this codebase:

1. **Always provide context**: Include relevant file contents and project structure
2. **Be specific about constraints**: Mention security requirements, performance needs
3. **Reference existing patterns**: Point to similar implementations in the codebase
4. **Test thoroughly**: AI-generated code should be tested before integration
5. **Review security implications**: All AI suggestions should be security-reviewed
6. **Follow provider patterns**: When implementing provider-specific features

### Useful Prompts for Claude
```
"Review this component for accessibility issues and suggest improvements"
"Optimize this API endpoint for better performance"
"Add comprehensive error handling to this function"
"Write tests for this component covering edge cases"
"Refactor this code to follow our established patterns"
"Implement caching for this provider method following our patterns"
"Add circuit breaker protection to this external API call"
```

## MCP UI Testing Server

### Overview
The MCP UI Testing Server enables Claude to interact with and inspect the Love Claude Code UI programmatically. This provides better feedback for development and testing.

### Available Tools

1. **inspectElement** - Get detailed information about a DOM element
   ```typescript
   inspectElement({ selector: "#editor" })
   // Returns: element properties, position, styles, visibility
   ```

2. **getPageScreenshot** - Capture the current page state
   ```typescript
   getPageScreenshot({ fullPage: true })
   // Returns: base64 encoded screenshot with metadata
   ```

3. **clickElement** - Interact with UI elements
   ```typescript
   clickElement({ selector: "button.primary" })
   ```

4. **typeInElement** - Input text into forms
   ```typescript
   typeInElement({ selector: "input#search", text: "test query" })
   ```

5. **navigateTo** - Navigate between pages
   ```typescript
   navigateTo({ url: "/projects" })
   ```

6. **checkElementVisible** - Verify element visibility
   ```typescript
   checkElementVisible({ selector: ".modal" })
   // Returns: visibility state, viewport position, dimensions
   ```

7. **getComputedStyles** - Get CSS styles
   ```typescript
   getComputedStyles({ selector: ".header", properties: ["height", "backgroundColor"] })
   ```

8. **validateLayout** - Check for layout issues
   ```typescript
   validateLayout()
   // Returns: overflow issues, overlapping elements, viewport problems
   ```

### Setup
1. Install dependencies: `cd mcp-server && npm install`
2. Build the server: `npm run build`
3. Configure Claude to use the MCP server (see mcp.json)

### Usage in Development
The MCP server launches a headless browser and connects to your local development server. Use it to:
- Verify UI changes without manual inspection
- Test responsive layouts programmatically
- Capture screenshots for documentation
- Validate accessibility and layout issues

---

## Quick Reference Links

### Documentation
- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and technical decisions
- [Development Guide](./docs/DEVELOPMENT.md) - Setting up your development environment
- [Testing Guide](./docs/TESTING.md) - Writing and running tests
- [API Reference](./docs/API.md) - Complete API documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment procedures

### Self-Referential Platform
- [Platform Vision](./docs/PLATFORM_VISION.md) - Vision for the self-building platform
- [Self-Referential Architecture](./docs/SELF_REFERENTIAL_ARCHITECTURE.md) - Meta-development principles
- [Construct Level Guidelines](./docs/CONSTRUCT_LEVEL_GUIDELINES.md) - L0, L1, L2, L3 development guidelines

### Provider Guides
- [Local Provider](./docs/LOCAL_PROVIDER.md) - Zero-config local development
- [Firebase Provider](./docs/FIREBASE_PROVIDER.md) - Firebase integration guide
- [AWS Provider](./docs/AWS_PROVIDER.md) - AWS deployment and configuration

### MCP Documentation
- [MCP Provider System](./docs/MCP_PROVIDER_SYSTEM.md) - Understanding MCP integration
- [MCP API Reference](./docs/MCP_API.md) - MCP REST endpoints
- [Frontend MCP Guide](./docs/FRONTEND_MCP.md) - Implementing MCP in the UI

### Contributing
- [Contributing Guidelines](./docs/CONTRIBUTING.md) - How to contribute to the project
- [Code of Conduct](./docs/CODE_OF_CONDUCT.md) - Community guidelines

---

*This CLAUDE.md file should be updated as the project evolves. When adding new patterns, tools, or constraints, update this documentation to keep Claude's context current and accurate.*

### 100% Task Completion Update (January 2025)
- **All 239 Tasks Completed**: Platform achieved 100% task completion through agent parallelization
- **New Constructs Added**: 17 new constructs (3 L1 dev tools, 9 L2 patterns, 1 L3 app)
- **TypeScript Fixes**: All compilation errors resolved, build now succeeds
- **Enhanced Security**: Comprehensive sandbox improvements with firewall and credential vault
- **MCP Tools**: 5 new MCP tools for deployment, analysis, debugging, and profiling
- **Visualization System**: 4 new L2 patterns for interactive diagrams and visualizations
- **External Integration Services**: Complete security scanner, resource monitor, license checker, version manager
- **Documentation**: Complete video tutorials, case studies, migration guides, and educational content
- **Development Velocity**: 10x improvement achieved through agent parallelization

*Last Updated: January 2025*