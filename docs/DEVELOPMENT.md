# Development Environment Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [IDE Setup](#ide-setup)

## Prerequisites

### Required Software
- **Node.js**: v20.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Optional but Recommended
- **Docker**: For containerized development ([Download](https://www.docker.com/))
- **Make**: For simplified commands (pre-installed on macOS/Linux)
- **VS Code**: Recommended IDE ([Download](https://code.visualstudio.com/))

### System Requirements
- **OS**: macOS, Linux, or Windows (with WSL2 recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 2GB free space
- **Ports**: 3000, 8000, 8001 should be available

## Quick Start

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code

# Install dependencies
make install
# or without make:
# npm install

# Start development environment
make dev
# or without make:
# npm run dev

# Open http://localhost:3000
```

That's it! The local provider runs with zero configuration.

## Detailed Setup

### 1. Repository Setup

```bash
# Clone with SSH (recommended if you have SSH keys set up)
git clone git@github.com:love-claude-code/love-claude-code.git

# Or clone with HTTPS
git clone https://github.com/love-claude-code/love-claude-code.git

cd love-claude-code
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm install

# Or install separately
cd frontend && npm install
cd ../backend && npm install
cd ../mcp-server && npm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your settings (optional)
# All settings can be configured in the app UI
```

#### Environment Variables (Optional)

```bash
# .env.local

# Provider Configuration (default: local)
PROVIDER_TYPE=local

# Local Provider Settings
LOCAL_DATA_PATH=./data
JWT_SECRET=your-secret-key-here

# API Configuration
API_PORT=8000
REALTIME_PORT=8001
FRONTEND_PORT=3000

# Optional: External Services
ANTHROPIC_API_KEY=your-api-key  # Can be set in app
```

### 4. Database Setup

#### Local Provider (Default)
No setup required! Uses JSON file storage automatically.

#### PostgreSQL (Optional for Local Provider)
```bash
# Using Docker
docker run -d \
  --name love-claude-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=loveclaudecode \
  -p 5432:5432 \
  postgres:15

# Or install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download installer from postgresql.org
```

#### Firebase Provider
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulator
make firebase-emulator
# or
firebase emulators:start
```

#### AWS Provider
```bash
# Start LocalStack
make localstack
# or
docker-compose -f docker-compose.providers.yml up localstack
```

## Development Workflow

### Starting Development Servers

#### All-in-One Development
```bash
# Start everything (recommended)
make dev
# or
npm run dev
```

This starts:
- Frontend dev server (http://localhost:3000)
- Backend API server (http://localhost:8000)
- WebSocket server (http://localhost:8001)
- MCP servers (if configured)

#### Individual Services
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# MCP servers only
npm run dev:mcp
```

### Code Organization

```
love-claude-code/
├── frontend/          # React application
├── backend/           # Node.js backend
├── mcp-server/        # MCP integration servers
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
└── docker/            # Docker configurations
```

### Making Changes

1. **Frontend Changes**: Edit files in `frontend/src/`
   - Hot reload works automatically
   - See changes instantly at http://localhost:3000

2. **Backend Changes**: Edit files in `backend/src/`
   - Server restarts automatically with nodemon
   - API available at http://localhost:8000

3. **MCP Changes**: Edit files in `mcp-server/src/`
   - Restart required: `npm run dev:mcp`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# Push to GitHub
git push origin feature/amazing-feature

# Create pull request on GitHub
```

## Common Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=Chat.test.tsx

# Run in watch mode
npm run test:watch
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix lint issues
npm run lint:fix

# Format with Prettier
npm run format

# Type checking
npm run type-check
```

### Building for Production

```bash
# Build everything
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend
```

### Using Different Providers

#### Local Provider (Default)
```bash
# No configuration needed
npm run dev
```

#### Firebase Provider
```bash
# Set environment
export PROVIDER_TYPE=firebase

# Start Firebase emulator
npm run firebase:emulator

# Start development
npm run dev
```

#### AWS Provider
```bash
# Set environment
export PROVIDER_TYPE=aws

# Start LocalStack
npm run localstack

# Start development
npm run dev
```

### Working with MCP

```bash
# Build MCP servers
cd mcp-server && npm run build

# Test MCP tools
npm run test:mcp

# Run MCP in standalone mode
npm run mcp:start
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev:frontend
```

#### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Reset database
npm run db:reset
```

#### Build Failures
```bash
# Clear build artifacts
npm run clean

# Rebuild
npm run build
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Debug specific module
DEBUG=express:* npm run dev:backend
```

## IDE Setup

### VS Code (Recommended)

1. **Install Extensions**:
   ```json
   {
     "recommendations": [
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "ms-vscode.vscode-typescript-next",
       "bradlc.vscode-tailwindcss",
       "formulahendry.auto-rename-tag",
       "usernamehw.errorlens",
       "eamodio.gitlens"
     ]
   }
   ```

2. **Workspace Settings**:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "typescript.updateImportsOnFileMove.enabled": "always",
     "tailwindCSS.experimental.classRegex": [
       ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
     ]
   }
   ```

### WebStorm/IntelliJ

1. Enable ESLint: `Preferences → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint`
2. Enable Prettier: `Preferences → Languages & Frameworks → JavaScript → Prettier`
3. Set up file watchers for automatic formatting

### Debugging

#### VS Code Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## Performance Tips

### Development Performance

1. **Use Production React DevTools**: Install the production build of React DevTools for better performance
2. **Disable Source Maps**: Set `GENERATE_SOURCEMAP=false` for faster builds
3. **Use SWC**: Consider using SWC instead of Babel for faster transpilation

### Hot Reload Optimization

```bash
# Faster hot reload
FAST_REFRESH=true npm run dev:frontend

# Skip type checking in development
TSC_COMPILE_ON_ERROR=true npm run dev
```

## Advanced Configuration

### Custom Webpack Configuration

```javascript
// frontend/vite.config.ts
export default defineConfig({
  // Your custom configuration
  optimizeDeps: {
    include: ['specific-heavy-dependency']
  }
})
```

### Environment-Specific Settings

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm run dev

# Production
NODE_ENV=production npm run build
```

## Resources

- [Project README](../README.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Discord Community](https://discord.gg/love-claude-code)

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search [GitHub Issues](https://github.com/love-claude-code/love-claude-code/issues)
3. Ask in [Discord](https://discord.gg/love-claude-code)
4. Create a new issue with:
   - Your environment (OS, Node version)
   - Steps to reproduce
   - Error messages
   - What you've tried

Happy coding! 🚀