# CLAUDE.md - Love Claude Code Technical Documentation

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

Backend:
- Node.js 20+ with TypeScript
- AWS CDK 2.0+ for infrastructure as code
- Lambda + API Gateway (serverless functions)
- ECS Fargate (containerized services)
- DynamoDB + Aurora Serverless (data layer)
- Redis (caching and sessions)

AI Integration:
- Anthropic Claude API (development)
- AWS Bedrock Claude models (production)
- WebSocket via AWS AppSync for streaming
- Claude 3.5 Sonnet + Claude 3 Haiku

DevOps:
- Docker with multi-stage builds
- GitHub Actions (CI/CD)
- AWS CloudFormation (infrastructure)
- CloudWatch + X-Ray (monitoring)
- gVisor for container security
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
│   │   │   └── Layout/       # Layout and navigation
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Zustand state stores
│   │   ├── services/         # API and external service calls
│   │   ├── utils/            # Helper functions and utilities
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   └── tests/                # Frontend tests
├── backend/                  # Backend services
│   ├── lambda/               # AWS Lambda functions
│   │   ├── api/              # REST API endpoints
│   │   ├── auth/             # Authentication handlers
│   │   └── claude/           # Claude integration
│   ├── ecs/                  # Containerized services
│   │   ├── code-executor/    # Code execution sandbox
│   │   ├── collaboration/    # Real-time collaboration
│   │   └── file-system/      # File management service
│   ├── shared/               # Shared utilities and types
│   └── tests/                # Backend tests
├── infrastructure/           # AWS CDK infrastructure code
│   ├── stacks/               # CDK stack definitions
│   ├── constructs/           # Reusable CDK constructs
│   └── config/               # Environment configurations
├── docs/                     # Technical documentation
└── docker/                  # Docker configurations
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

### Key Utilities
- `frontend/src/utils/codeParser.ts` - Parse and analyze code structure
- `frontend/src/utils/claudeContext.ts` - Manage conversation context
- `backend/shared/security.ts` - Security utilities and validation
- `backend/shared/claude.ts` - Claude API wrapper and error handling

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
**Editor Performance**: Check CodeMirror extension loading, disable unnecessary features
**Claude API Timeouts**: Implement exponential backoff, check rate limits
**Container Build Failures**: Clear Docker cache, check base image versions
**TypeScript Errors**: Run `npm run type-check`, ensure proper imports

### Development Environment Reset
```bash
# Nuclear option - complete reset
npm run clean                 # Clean all build artifacts
rm -rf node_modules           # Remove dependencies
npm install                   # Reinstall everything
npm run setup                 # Reinitialize environment
```

### Performance Debugging
- Use React DevTools Profiler for frontend performance
- CloudWatch logs and X-Ray for backend tracing
- CodeMirror performance extensions for editor optimization
- Monitor Claude API response times and token usage

## AI-Assisted Development Notes

When working with Claude on this codebase:

1. **Always provide context**: Include relevant file contents and project structure
2. **Be specific about constraints**: Mention security requirements, performance needs
3. **Reference existing patterns**: Point to similar implementations in the codebase
4. **Test thoroughly**: AI-generated code should be tested before integration
5. **Review security implications**: All AI suggestions should be security-reviewed

### Useful Prompts for Claude
```
"Review this component for accessibility issues and suggest improvements"
"Optimize this API endpoint for better performance"
"Add comprehensive error handling to this function"
"Write tests for this component covering edge cases"
"Refactor this code to follow our established patterns"
```

---

*This CLAUDE.md file should be updated as the project evolves. When adding new patterns, tools, or constraints, update this documentation to keep Claude's context current and accurate.*