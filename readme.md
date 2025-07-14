business_plan.md 
# Love Claude Code 💜

<div align="center">
  <h3>The AI-first development platform that transforms conversations into code</h3>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.2%2B-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
  [![Claude Powered](https://img.shields.io/badge/Claude-3.5_Sonnet-8B5CF6?style=flat)](https://www.anthropic.com/)
  [![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-FF6B6B)](https://modelcontextprotocol.io/)
  
  [**🚀 Get Started**](#-quick-start) • [**📖 Documentation**](/docs) • [**🎯 Features**](#-features-that-developers-love) • [**🌐 Providers**](#-multi-cloud-architecture)

</div>

---

## 🆕 Recent Updates (January 2025)

### 🎨 Complete Website Overhaul
- **Beautiful Landing Page**: New landing page with hero section, feature showcase, and provider comparison
- **Documentation Center**: Full documentation website with sidebar navigation, search, and interactive examples
- **Interactive Visualizations**: Architecture diagrams (ReactFlow) and provider comparison charts (Recharts)
- **Navigation System**: New navigation bar with Home, Projects, Documentation, and Features sections

### 🎯 Navigation & Project Management
- **Project Dashboard**: New project management interface with create, open, and delete functionality
- **Breadcrumb Navigation**: Clear project context in header with multiple navigation options
- **Quick Access**: Back button, project name click, and File menu navigation

### 💬 Enhanced Chat Experience
- **Responsive Design**: Automatic layout adjustment for narrow panels
- **Smart Text Scaling**: Font sizes adapt to panel width for better readability
- **Improved Input**: Dynamic placeholders and always-visible microphone button

### 🛠️ Developer Experience
- **Fixed Editor Visibility**: Resolved panel sizing issues for proper editor display
- **Better Terminal Layout**: Improved space distribution between editor and terminal
- **In-App Documentation**: Comprehensive help system with F1 keyboard shortcut

### 🤖 Model Context Protocol (MCP)
- **Dual MCP Integration**: Main app servers for UI testing and provider management
- **User App MCP**: Enable Claude interactions in your own projects
- **Visual Tool Management**: Configure MCP tools through project settings
- **Auto-Start with Dev**: MCP servers start automatically with `make dev`
- **Fixed Provider Server**: Resolved dependencies and TypeScript issues for reliable MCP operation

---

## ✨ What is Love Claude Code?

Love Claude Code is a revolutionary web-based IDE that seamlessly integrates **Claude's conversational AI** with a complete development environment. Instead of writing code line by line, developers describe what they want to build in natural language, and Claude generates, refines, and deploys production-ready applications in real-time.

### 🎯 Core Philosophy
> **"From Conversation to Code to Deployment in Minutes, Not Hours"**

We believe the future of software development is conversational. Why struggle with syntax when you can simply describe your vision and watch it come to life?

---

## 🚀 Features That Developers Love

### 🤖 **AI-First Development**
- **Conversational Coding**: Describe features in plain English, get production code
- **Model Context Protocol (MCP)**: Enable Claude to interact with your apps through custom tools
- **Intelligent Context**: Claude understands your entire codebase and project history
- **Real-time Streaming**: Watch your code generate live as you type
- **Smart Suggestions**: Proactive architecture and optimization recommendations

### 🎨 **Modern Development Experience**
- **Dual-Pane Interface**: Code editor alongside AI chat for seamless workflow
- **Live Preview**: See your changes instantly with hot reload
- **Multi-Language Support**: React, Vue, Node.js, Python, and more
- **Git Integration**: Full version control with automated commit messages

### 👥 **Built for Teams**
- **Real-time Collaboration**: Google Docs-style editing with your team
- **Smart Conflict Resolution**: AI-powered merge conflict resolution
- **Shared Context**: Team knowledge base that Claude learns from
- **Role-based Access**: Granular permissions and workspace management

### 🛡️ **Enterprise Ready**
- **Secure Code Execution**: Sandboxed containers with resource limits
- **SOC2 Compliance**: Enterprise-grade security from day one
- **Private Claude Instances**: Dedicated AI for your organization
- **Audit Logging**: Complete activity tracking and compliance reporting

---

## 🎥 See It In Action

### 🌟 Beautiful Landing Page
Experience our new landing page with smooth animations, feature showcases, and provider comparisons.

### 📚 Comprehensive Documentation Center
<div align="center">
  <table>
    <tr>
      <td align="center">
        <strong>Interactive Architecture Diagram</strong><br>
        <em>Visualize system components with ReactFlow</em>
      </td>
      <td align="center">
        <strong>Provider Comparison Charts</strong><br>
        <em>Compare costs and features with Recharts</em>
      </td>
    </tr>
    <tr>
      <td align="center">
        <strong>API Reference</strong><br>
        <em>Complete REST API documentation</em>
      </td>
      <td align="center">
        <strong>Getting Started Guide</strong><br>
        <em>Step-by-step onboarding</em>
      </td>
    </tr>
  </table>
</div>

### 💻 Development Experience
- **AI Chat + Code Editor**: Side-by-side development with Claude
- **Live Preview**: See changes instantly as you code
- **Multi-Provider Support**: Switch between Local, Firebase, and AWS backends

---

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Docker (optional, for containerized development)
- Make (optional, for simplified commands)

### 🔒 Security First
Before getting started, please review our [Security Policy](./SECURITY.md) for best practices on handling credentials and secrets. Never commit API keys or passwords!

### 1. Clone and Install

```bash
git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code

# Copy environment template
cp .env.example .env.local
cp .env.docker.example .env  # For Docker users

make install  # or npm install
```

### 2. Quick Start (Zero Configuration!)

```bash
# Start with local provider - no external services needed!
make dev  # or npm run dev

# Open http://localhost:3000
# All credentials can be configured in the app settings
```

### 🐳 Full Stack Development (All Providers)

```bash
# Start complete development environment with all providers
docker-compose -f docker-compose.providers.yml up

# This includes:
# - Frontend (port 3000)
# - Backend with all providers (port 8080)
# - PostgreSQL for local provider
# - LocalStack for AWS emulation
# - Firebase emulator suite
# - Redis for caching
# - Monitoring (Prometheus + Grafana)
# - Email testing (Mailhog)
```

### 3. Configure In-App Settings

1. Open [http://localhost:3000](http://localhost:3000)
2. Sign up with your email (stored locally)
3. Go to Settings → AI Settings
4. Add your Anthropic API key
5. Select your preferred backend provider

### 4. Create Your First Project

1. Click "New Project" 
2. Choose your backend provider (Local, Firebase, or AWS)
3. Describe what you want to build
4. Watch Claude generate your application!

### 🎯 Provider Quick Start

#### Local Development (Default)
```bash
# No configuration needed!
make dev-local  # Everything runs locally
```

#### Firebase Development
```bash
# Start Firebase emulator
make firebase-emulator

# Configure Firebase project in app settings
make dev-firebase
```

#### AWS Development
```bash
# Start LocalStack
make localstack

# Configure AWS credentials in app settings
make dev-aws
```

---

## 🌐 Multi-Cloud Architecture

Love Claude Code's unique provider abstraction allows you to start simple and scale globally:

### 🏠 Local Provider (Zero Config!)
Perfect for learning and prototyping
- ✅ No setup required
- ✅ File-based storage
- ✅ Runs on your machine
- ✅ Zero cloud costs
- 📊 Best for: 1-10 users

### 🔥 Firebase Provider
Rapid deployment with real-time features
- ✅ One-click setup
- ✅ Real-time sync
- ✅ Built-in authentication
- ✅ Global CDN
- 📊 Best for: 10-100K users
- 💰 ~$150/month for 10K users

### ☁️ AWS Provider
Enterprise-scale with complete control
- ✅ Unlimited scalability
- ✅ Fine-grained control
- ✅ Cost optimization
- ✅ Global infrastructure
- 📊 Best for: 100K+ users
- 💰 ~$300/month for 10K users

### 🔄 Switch Anytime
```bash
# Start with Local
make dev

# Ready for users? Switch to Firebase
npm run switch-provider firebase

# Going big? Migrate to AWS
npm run migrate-to aws
```

---

## 🤖 Model Context Protocol (MCP)

Love Claude Code includes comprehensive MCP integration at two levels:

### 1. Main App MCP Servers

**UI Testing Server** - Test and automate the Love Claude Code interface:
- Take screenshots of your development environment
- Inspect DOM elements and styles
- Automate UI interactions
- Validate layouts and responsiveness

**Provider Management Server** - Intelligent backend provider selection:
- Analyze project requirements
- Compare providers (Local, Firebase, AWS)
- Estimate costs based on usage
- Plan and execute migrations

### 2. User App MCP

Enable Claude to interact with YOUR applications:
- ✅ Check "Enable MCP" when creating projects
- 🛠️ Configure tools via Project Settings → MCP tab
- 🎯 Pre-built tools for auth, data, and UI
- ⚡ Create custom tools for your app's needs

### Quick Example

```javascript
// Your app's custom MCP tool
{
  name: 'create_blog_post',
  description: 'Create a new blog post',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      content: { type: 'string' },
      tags: { type: 'array' }
    }
  }
}
```

Then in Claude: *"Create a blog post about MCP integration"*

---

## 🏗️ Architecture

Love Claude Code now supports **multiple cloud providers** and **local development**, allowing you to choose the best backend for your needs.

<div align="center">
  
```mermaid
graph TB
    subgraph "Frontend"
        UI[React + TypeScript]
        Editor[CodeMirror 6]
        Chat[Claude Chat Interface]
        Preview[Live Preview]
        Settings[In-App Settings]
    end
    
    subgraph "Provider Abstraction"
        Factory[Provider Factory]
        Interface[Common Interfaces]
        Shared[Shared Utilities]
    end
    
    subgraph "Local Provider"
        LocalAuth[JWT Auth]
        LocalDB[PostgreSQL/JSON]
        LocalStorage[File System]
        LocalFunctions[Node.js Functions]
        LocalRealtime[WebSocket Server]
    end
    
    subgraph "Firebase Provider"
        FirebaseAuth[Firebase Auth]
        Firestore[Firestore DB]
        FirebaseStorage[Cloud Storage]
        CloudFunctions[Cloud Functions]
        FirebaseRealtime[Realtime DB]
        FCM[Cloud Messaging]
    end
    
    subgraph "AWS Provider"
        Cognito[AWS Cognito]
        DynamoDB[DynamoDB]
        S3[S3 Storage]
        Lambda[Lambda Functions]
        AppSync[AppSync/WebSocket]
        SES[SES/SNS]
    end
    
    subgraph "Enterprise Features"
        Monitoring[Unified Monitoring]
        Cache[Hybrid Cache]
        Resilience[Circuit Breakers]
    end
    
    UI --> Factory
    Factory --> Interface
    Interface --> LocalAuth
    Interface --> FirebaseAuth
    Interface --> Cognito
    
    Shared --> Monitoring
    Shared --> Cache
    Shared --> Resilience
    
    Settings --> Factory
```

</div>

### 🌐 Multi-Cloud Support

Love Claude Code features a **revolutionary provider abstraction layer** that lets you deploy your applications to any cloud provider or run entirely locally - all from the same codebase!

#### Provider Comparison

| Provider | Best For | Key Features | Infrastructure | Status |
|----------|----------|--------------|----------------|--------|
| **Local** | Development & Testing | • Zero configuration<br>• No external dependencies<br>• File-based storage<br>• Built-in auth | PostgreSQL, File System, Node.js | ✅ Production Ready |
| **Firebase** | Rapid Prototyping | • Real-time sync<br>• Auto-scaling<br>• Google integration<br>• Built-in analytics | Firestore, Cloud Storage, Cloud Functions | ✅ Production Ready |
| **AWS** | Enterprise & Scale | • Fine-grained control<br>• Compliance ready<br>• Global infrastructure<br>• Advanced monitoring | DynamoDB, S3, Lambda, Cognito | ✅ Production Ready |

#### 🔧 Unified Provider Interface

All providers implement the same interfaces, ensuring **write once, deploy anywhere**:

```typescript
interface BackendProvider {
  auth: AuthProvider        // User management, JWT tokens, sessions
  database: DatabaseProvider // Document storage, queries, transactions  
  storage: StorageProvider   // File upload/download, streaming
  realtime: RealtimeProvider // WebSockets, pub/sub, presence
  functions: FunctionProvider // Serverless compute, scheduled jobs
  notifications?: NotificationProvider // Email, SMS, push (optional)
}
```

#### 🚀 Enterprise Features

Every provider includes production-ready features out of the box:

- **🛡️ Resilience**: Circuit breakers, retry logic, bulkheads
- **📊 Monitoring**: Unified metrics, health checks, distributed tracing
- **⚡ Performance**: Multi-layer caching (Redis + LRU), connection pooling
- **🔒 Security**: Encryption at rest, secure credentials, audit logging
- **📈 Scalability**: Auto-scaling, load balancing, rate limiting

### 🧱 Tech Stack

| Layer | Technology | Why We Chose It |
|-------|------------|----------------|
| **Frontend** | React 18 + TypeScript | Type safety, modern hooks, excellent ecosystem |
| **Editor** | CodeMirror 6 | 43% smaller than Monaco, better mobile support |
| **Styling** | Tailwind CSS | Rapid prototyping, consistent design system |
| **State** | Zustand | Lightweight, no boilerplate, TypeScript native |
| **Backend** | Node.js + TypeScript | Shared language, great AWS integration |
| **Infrastructure** | AWS CDK | Infrastructure as code, type-safe cloud resources |
| **Database** | Aurora + DynamoDB | Relational + NoSQL for different access patterns |
| **AI** | Claude + AWS Bedrock | Best reasoning, enterprise deployment options |
| **MCP** | Model Context Protocol | Enables Claude to understand and manage providers |
| **Deployment** | Docker + ECS | Containerized, scalable, cost-effective |

### 🤖 MCP (Model Context Protocol) Integration

Love Claude Code includes a powerful MCP server that enables Claude to understand your infrastructure needs and help you make informed decisions about backend providers.

**What can Claude help with?**
- 🔍 **Analyze Requirements**: Understand your project needs and constraints
- 📊 **Compare Providers**: See detailed comparisons of Local, Firebase, and AWS
- 💰 **Estimate Costs**: Get accurate cost projections based on usage
- 🔄 **Plan Migrations**: Create step-by-step migration plans between providers
- 🏥 **Monitor Health**: Check provider status and performance
- ⚙️ **Manage Config**: Handle provider settings through conversation

**Example Claude Interactions:**
```
You: "I need a backend for my e-commerce app with 100k users"
Claude: *analyzes requirements and recommends Firebase for rapid development*

You: "How much would it cost to run this on AWS vs Firebase?"
Claude: *provides detailed cost breakdown for both providers*

You: "Help me migrate from local development to Firebase"
Claude: *creates migration plan with estimated timeline*
```

---

## 📁 Project Structure

```
love-claude-code/
├── 📂 frontend/                 # React application
│   ├── 📂 src/
│   │   ├── 📂 components/       # UI components
│   │   │   ├── 📂 Editor/       # Code editor components
│   │   │   ├── 📂 Chat/         # Claude chat interface
│   │   │   ├── 📂 Preview/      # Live app preview
│   │   │   └── 📂 Layout/       # App layout & navigation
│   │   ├── 📂 hooks/            # Custom React hooks
│   │   ├── 📂 stores/           # Zustand state stores
│   │   ├── 📂 services/         # API clients
│   │   ├── 📂 utils/            # Helper functions
│   │   └── 📂 types/            # TypeScript definitions
│   └── 📂 tests/                # Frontend tests
├── 📂 backend/                  # Backend services
│   ├── 📂 src/
│   │   ├── 📂 providers/        # Multi-cloud provider implementations
│   │   │   ├── 📂 local/        # Local development provider
│   │   │   ├── 📂 firebase/     # Firebase provider
│   │   │   ├── 📂 aws/          # AWS provider
│   │   │   └── 📂 shared/       # Shared utilities (cache, monitoring)
│   │   ├── 📂 api/              # REST API endpoints
│   │   ├── 📂 services/         # Business logic
│   │   └── 📂 utils/            # Helper functions
│   └── 📂 tests/                # Backend tests
├── 📂 infrastructure/           # AWS CDK code
│   ├── 📂 stacks/               # CDK stacks
│   ├── 📂 constructs/           # Reusable constructs
│   └── 📂 config/               # Environment configs
├── 📂 docker/                   # Docker configurations
│   ├── 📂 nginx/                # Nginx configs
│   ├── 📂 prometheus/           # Monitoring configs
│   └── 📂 grafana/              # Dashboard configs
├── 📂 scripts/                  # Build & deployment scripts
│   ├── 📂 localstack/           # AWS local development
│   ├── 📂 postgres/             # Database initialization
│   └── 📂 firebase/             # Firebase setup
└── 📂 docs/                     # Documentation
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start all services
npm run dev:frontend          # Frontend only (port 3000)
npm run dev:backend           # Backend only (port 8000)

# Testing
npm run test                  # Run all tests
npm run test:frontend         # Frontend tests only
npm run test:backend          # Backend tests only
npm run test:e2e              # End-to-end tests

# Building
npm run build                 # Build for production
npm run build:frontend        # Build frontend only
npm run build:backend         # Build backend only

# Deployment
npm run deploy:dev            # Deploy to development
npm run deploy:staging        # Deploy to staging
npm run deploy:prod           # Deploy to production

# Utilities
npm run lint                  # Lint all code
npm run type-check            # TypeScript checking
npm run clean                 # Clean build artifacts
```

### Local Development with Docker

```bash
# Start local infrastructure
npm run docker:up

# Build and run everything in containers
npm run docker:build && npm run docker:dev

# View logs
npm run docker:logs

# Clean up
npm run docker:down
```

---

## 🧪 MCP UI Testing Server

Love Claude Code includes an MCP (Model Context Protocol) server for programmatic UI testing and interaction:

### Available Tools
- **inspectElement** - Get detailed element properties, styles, and position
- **getPageScreenshot** - Capture full page or viewport screenshots
- **clickElement** - Programmatically click UI elements
- **typeInElement** - Input text into forms and inputs
- **navigateTo** - Navigate between pages and views
- **checkElementVisible** - Verify element visibility and viewport position
- **getComputedStyles** - Inspect final CSS styles
- **validateLayout** - Detect layout issues, overflows, and overlaps

### Setup
```bash
cd mcp-server
npm install
npm run build
npm run start
```

### Usage
Configure your MCP client to connect to the server. The server will launch a browser instance and connect to your local development server for testing.

---

## 🚀 Deployment

Love Claude Code is designed for seamless deployment to AWS with infrastructure as code.

### One-Click AWS Deployment

```bash
# Configure AWS credentials
aws configure

# Deploy to your AWS account
npm run deploy:prod
```

### Manual Deployment Steps

1. **Infrastructure Setup**
   ```bash
   cd infrastructure
   npm run cdk:bootstrap
   npm run cdk:deploy
   ```

2. **Application Deployment**
   ```bash
   npm run build
   npm run deploy:app
   ```

3. **Environment Configuration**
   ```bash
   npm run config:prod
   ```

### Environment Variables

All sensitive configuration can now be managed through the in-app settings! The following are optional environment variables for advanced configuration:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PROVIDER_TYPE` | Default backend provider | ❌ | `local` |
| `JWT_SECRET` | Authentication secret | ❌ | Auto-generated |
| `ALLOWED_ORIGINS` | CORS origins | ❌ | `*` |
| `LOG_LEVEL` | Logging level | ❌ | `info` |
| `API_PORT` | Backend API port | ❌ | `8000` |
| `REALTIME_PORT` | WebSocket server port | ❌ | `8001` |

#### Provider-Specific Variables

**Local Provider** (default, no config needed):
- `LOCAL_DATA_PATH` - Data storage path (default: `./data`)

**Firebase Provider**:
- Configure through in-app settings or:
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_API_KEY` - Firebase web API key

**AWS Provider**:
- Configure through in-app settings or:
- `AWS_REGION` - AWS deployment region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

---

## 🤝 Contributing

We love contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes Love Claude Code better for everyone.

### 🐛 Found a Bug?

1. Check if it's already reported in [Issues](https://github.com/love-claude-code/love-claude-code/issues)
2. Create a new issue with detailed reproduction steps
3. Include your environment details and error logs

### 💡 Want to Add a Feature?

1. Open a [Discussion](https://github.com/love-claude-code/love-claude-code/discussions) first
2. Get feedback from maintainers and community
3. Fork the repo and create a feature branch
4. Submit a PR with tests and documentation

### 📖 Development Guidelines

```bash
# 1. Fork and clone the repo
git clone https://github.com/yourusername/love-claude-code.git

# 2. Create a feature branch
git checkout -b feature/amazing-new-feature

# 3. Make your changes and test
npm run test
npm run lint

# 4. Commit with conventional format
git commit -m "feat(editor): add syntax highlighting for Python"

# 5. Push and create PR
git push origin feature/amazing-new-feature
```

### Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **Prettier**: Automated code formatting
- **ESLint**: Enforced code quality rules
- **Tests**: Required for all new features
- **Documentation**: Update relevant docs with changes

---

## 📈 Roadmap

### ✅ Completed (2024)
- [x] Core IDE with Claude integration
- [x] Real-time code execution and preview
- [x] Project management system
- [x] User authentication and workspaces
- [x] Multi-provider architecture (Local, Firebase, AWS)
- [x] MCP (Model Context Protocol) integration
- [x] In-app documentation system
- [x] Responsive UI improvements

### 🏃‍♂️ Current Sprint (Q1 2025)
- [x] Complete documentation overhaul
- [ ] Multi-language template library
- [ ] Enhanced error handling and debugging
- [ ] Landing page and marketing site
- [ ] Interactive tutorials
- [ ] Performance optimizations

### 🚀 Next Up (Q2 2025)
- [ ] Real-time collaboration and multiplayer editing
- [ ] Advanced Git integration with branch management
- [ ] Custom Claude prompts and personas
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Plugin system architecture

### 🌟 Future Vision (Q3-Q4 2025)
- [ ] Enterprise SSO and RBAC
- [ ] Private Claude instances for teams
- [ ] Advanced analytics and insights
- [ ] Plugin marketplace
- [ ] Self-hosted enterprise edition
- [ ] Multi-cloud support (Azure, GCP)
- [ ] AI agent marketplace

### 💭 Community Ideas
- [ ] AI-powered code reviews
- [ ] Automated testing generation
- [ ] Performance monitoring integration
- [ ] Database schema designer
- [ ] API documentation generator
- [ ] Code migration tools
- [ ] Voice coding support
- [ ] AR/VR code visualization

---

## 🌟 Community

Join our growing community of developers who are shaping the future of AI-assisted development!

### 💬 Get Help & Share Ideas

- **[Discord](https://discord.gg/love-claude-code)** - Real-time chat with the community
- **[GitHub Discussions](https://github.com/love-claude-code/love-claude-code/discussions)** - Feature requests and Q&A
- **[Twitter](https://twitter.com/loveclaudecode)** - Updates and announcements
- **[YouTube](https://youtube.com/@loveclaudecode)** - Tutorials and demos

### 🏆 Contributors

<div align="center">
  
  [![Contributors](https://contrib.rocks/image?repo=love-claude-code/love-claude-code)](https://github.com/love-claude-code/love-claude-code/graphs/contributors)
  
  *Thank you to all our amazing contributors!*
  
</div>

### 🌟 Getting Help

Need assistance? We're here to help!

### 📚 Documentation
- **[Complete Documentation](./docs/)** - Start here for comprehensive guides
- **[API Reference](./docs/API.md)** - REST API documentation
- **[Development Guide](./docs/DEVELOPMENT.md)** - Set up your dev environment
- **[Troubleshooting](./CLAUDE.md#troubleshooting-guide)** - Common issues and solutions

### 💬 Community Support
- **[Discord Server](https://discord.gg/love-claude-code)** - Real-time chat with the community
- **[GitHub Discussions](https://github.com/love-claude-code/love-claude-code/discussions)** - Q&A and feature requests
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/love-claude-code)** - Tagged questions

### 🐛 Reporting Issues
- **[Bug Reports](https://github.com/love-claude-code/love-claude-code/issues/new?template=bug_report.md)** - Found a bug?
- **[Feature Requests](https://github.com/love-claude-code/love-claude-code/issues/new?template=feature_request.md)** - Suggest improvements

### 📧 Direct Support
- **Email**: support@love-claude-code.com
- **Enterprise**: enterprise@love-claude-code.com

## 📊 Project Stats

<div align="center">
  
  ![Alt](https://repobeats.axiom.co/api/embed/love-claude-code-stats.svg "Repobeats analytics image")
  
</div>

---

## 📜 License

Love Claude Code is open source software licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 Love Claude Code

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **[Anthropic](https://www.anthropic.com/)** for creating Claude, the AI that powers our platform
- **[AWS](https://aws.amazon.com/)** for providing the robust cloud infrastructure
- **[CodeMirror](https://codemirror.net/)** for the excellent code editor foundation
- **[React](https://reactjs.org/)** and the entire open source ecosystem
- **Our Community** for feedback, contributions, and spreading the love

---

<div align="center">
  
  **Made with 💜 by developers, for developers**
  
  [**⭐ Star us on GitHub**](https://github.com/love-claude-code/love-claude-code) • [**🚀 Try Love Claude Code**](https://love-claude-code.dev)
  
  *Building the future of software development, one conversation at a time*
  
</div>