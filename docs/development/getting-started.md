# Getting Started with Love Claude Code

Welcome to Love Claude Code! This guide will help you set up your development environment and start building AI-powered applications in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** ([Download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **AWS CLI** ([Download](https://aws.amazon.com/cli/)) - for deployment
- **Docker** (optional, for local containerized development)

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local with your favorite editor
nano .env.local
```

Required environment variables:
```env
# Claude API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AWS Configuration (for production)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Application Configuration
NODE_ENV=development
PORT=3000
API_PORT=8000

# Database URLs (local development)
DATABASE_URL=postgresql://localhost:5432/loveclaudecode
REDIS_URL=redis://localhost:6379
```

### 4. Start Development Servers

```bash
# Start everything (recommended)
npm run dev

# Or start services individually:
npm run dev:frontend  # React app on http://localhost:3000
npm run dev:backend   # API server on http://localhost:8000
```

### 5. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000) and you should see the Love Claude Code interface!

## Project Structure Overview

```
love-claude-code/
├── frontend/          # React application
├── backend/           # Node.js API and services
├── infrastructure/    # AWS CDK infrastructure code
├── docker/           # Docker configurations
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Development Workflow

### 1. Understanding the Architecture

Love Claude Code uses a dual-pane interface:
- **Left pane**: Chat with Claude
- **Right pane**: Code editor and live preview

The frontend communicates with the backend API, which orchestrates:
- Claude API calls
- Code execution in sandboxed environments
- File management and persistence
- Real-time collaboration features

### 2. Making Your First Change

Let's add a simple feature to understand the codebase:

#### Frontend Change
Edit `frontend/src/components/Chat/ChatInterface.tsx`:
```typescript
// Add a welcome message
const WelcomeMessage = () => (
  <div className="p-4 text-center text-gray-500">
    Welcome to Love Claude Code! Ask me to build something amazing.
  </div>
);
```

#### Backend Change
Edit `backend/lambda/api/chat.ts`:
```typescript
// Add request logging
export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('Chat request received:', event.body);
  // ... existing code
};
```

### 3. Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:frontend
npm run test:backend
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### 4. Code Quality Checks

Before committing, ensure your code passes all checks:

```bash
# Run all checks
npm run check-all

# Individual checks
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run format        # Prettier
```

## Common Development Tasks

### Adding a New Component

```bash
# Use the component generator
npm run generate:component MyComponent

# Or create manually in frontend/src/components/
```

### Adding a New API Endpoint

1. Create handler in `backend/lambda/api/`
2. Update API Gateway configuration in `infrastructure/`
3. Add TypeScript types in `shared/types.ts`
4. Create frontend service in `frontend/src/services/`

### Working with Claude Integration

The Claude integration is centralized in:
- Frontend: `frontend/src/services/claudeApi.ts`
- Backend: `backend/lambda/claude/`

Example of making a Claude request:
```typescript
import { claudeApi } from '@/services/claudeApi';

const response = await claudeApi.sendMessage({
  message: "Build a React component for a todo list",
  context: currentProjectContext
});
```

### Database Operations

We use multiple databases for different purposes:
- **Aurora**: User data, project metadata
- **DynamoDB**: Session state, real-time collaboration
- **Redis**: Caching, temporary data

Example database query:
```typescript
import { db } from '@/lib/database';

const user = await db.user.findUnique({
  where: { email: 'user@example.com' }
});
```

## Debugging Tips

### Frontend Debugging

1. **React DevTools**: Install the browser extension
2. **Network tab**: Monitor API calls
3. **Console logs**: Use `console.log()` liberally during development
4. **Source maps**: Enabled by default in development

### Backend Debugging

1. **CloudWatch logs**: All Lambda logs are sent to CloudWatch
2. **Local debugging**: Use `npm run dev:backend:debug`
3. **API testing**: Use Postman or curl
4. **Database queries**: Enable query logging in development

### Common Issues

#### Port Already in Use
```bash
# Kill processes on specific ports
npx kill-port 3000 8000
```

#### Database Connection Issues
```bash
# Start local databases
npm run db:start

# Run migrations
npm run db:migrate
```

#### Claude API Rate Limits
- Check your API key usage in the Anthropic console
- Implement caching to reduce API calls
- Use the development mock mode: `CLAUDE_MOCK_MODE=true`

## Next Steps

### Learn More
- Read the [Technical Architecture](../technical/architecture.md)
- Explore the [API Reference](../technical/api-reference.md)
- Check out the [Security Guide](../technical/security.md)

### Start Building
1. Create a new project in the UI
2. Ask Claude to help you build features
3. Deploy your application with one click

### Join the Community
- [Discord](https://discord.gg/love-claude-code)
- [GitHub Discussions](https://github.com/love-claude-code/love-claude-code/discussions)
- [Twitter](https://twitter.com/loveclaudecode)

## Getting Help

If you run into issues:

1. Check the [Troubleshooting Guide](../troubleshooting.md)
2. Search [existing issues](https://github.com/love-claude-code/love-claude-code/issues)
3. Ask in our [Discord community](https://discord.gg/love-claude-code)
4. Create a [new issue](https://github.com/love-claude-code/love-claude-code/issues/new)

Happy coding! 🚀