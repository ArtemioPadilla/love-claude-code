# Multi-Cloud Architecture Guide

Love Claude Code now supports multiple backend providers, allowing you to choose the best infrastructure for your needs - from zero-config local development to production-ready cloud deployments.

## Overview

The platform uses a provider abstraction pattern that allows seamless switching between:
- **Local Provider** - Zero-configuration development with file-based storage
- **Firebase Provider** - Rapid prototyping with Google's Backend-as-a-Service
- **AWS Provider** - Production-ready infrastructure with fine-grained control

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Editor    │  │     Chat     │  │     Settings     │  │
│  │             │  │              │  │  (Provider Cfg)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────┴────────────────────────────────┐
│                    Backend API Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Provider Factory & Router               │   │
│  └────────────┬─────────────┬─────────────┬────────────┘   │
│               │             │             │                 │
│  ┌────────────┴───┐ ┌──────┴──────┐ ┌───┴────────────┐   │
│  │ Local Provider │ │  Firebase   │ │  AWS Provider  │   │
│  │                │ │  Provider   │ │                │   │
│  │ • JSON DB     │ │ • Firestore │ │ • DynamoDB    │   │
│  │ • File System │ │ • Storage   │ │ • S3          │   │
│  │ • WebSocket   │ │ • Auth      │ │ • Cognito     │   │
│  │ • Node.js     │ │ • Functions │ │ • Lambda      │   │
│  └────────────────┘ └─────────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### 1. Local Development (Default)

No configuration needed! Just start coding:

```bash
# Using Make
make dev

# Or using npm
npm run dev
```

All data is stored locally in `./data` directory. Perfect for:
- Quick prototyping
- Offline development
- Learning the platform
- Testing features

### 2. Firebase Development

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start with Firebase provider
make dev-firebase

# Or with Docker
docker-compose --profile firebase up
```

Configure in Settings → Backend Providers:
- Project ID
- Web API Key
- Auth Domain

### 3. AWS Development

```bash
# Start LocalStack
make localstack

# Start with AWS provider
make dev-aws

# Or with Docker
docker-compose --profile aws up
```

Configure in Settings → Backend Providers:
- AWS Region
- Access Key ID
- Secret Access Key

## Provider Features Comparison

| Feature | Local | Firebase | AWS |
|---------|-------|----------|-----|
| **Authentication** | JWT (JSON file) | Firebase Auth | Cognito |
| **Database** | JSON files | Firestore | DynamoDB |
| **File Storage** | File system | Cloud Storage | S3 |
| **Realtime** | WebSocket | Realtime DB | AppSync |
| **Functions** | Node.js processes | Cloud Functions | Lambda |
| **Setup Time** | 0 seconds | 5 minutes | 15 minutes |
| **Cost** | Free | Free tier | Pay-as-you-go |
| **Scalability** | Single machine | Auto-scaling | Infinite |
| **Best For** | Development | Prototypes | Production |

## Provider Implementation Details

### Common Interface

All providers implement the same TypeScript interfaces:

```typescript
interface BackendProvider {
  type: ProviderType
  auth: AuthProvider
  database: DatabaseProvider
  storage: StorageProvider
  realtime: RealtimeProvider
  functions: FunctionProvider
  notifications?: NotificationProvider
}
```

### Using Providers in Code

```typescript
// Get the configured provider
const provider = await getProvider({
  type: settings.providers.default,
  projectId: currentProject.id
})

// Use provider services
const user = await provider.auth.signUp(email, password)
const doc = await provider.database.create('projects', projectData)
const url = await provider.storage.upload('file.txt', buffer)
```

## Configuration

### Environment Variables

```bash
# Default provider (optional)
PROVIDER_TYPE=local|firebase|aws

# Local provider
LOCAL_DATA_PATH=./data

# Firebase provider
FIREBASE_PROJECT_ID=my-project
FIREBASE_API_KEY=...

# AWS provider
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### In-App Settings

All credentials can be configured through the UI:
1. Click Settings icon
2. Go to "Backend Providers" tab
3. Select your provider
4. Enter credentials
5. Save

Credentials are encrypted at rest using AES-256.

## Docker Compose Profiles

```bash
# Start with local provider only
docker-compose up

# Start with Firebase emulator
docker-compose --profile firebase up

# Start with LocalStack
docker-compose --profile aws up

# Start with database tools
docker-compose --profile tools up
```

## Testing

### Provider Integration Tests

```bash
# Test all providers
make test-providers

# Test specific provider
cd backend
PROVIDER_TYPE=local npm run test:providers
```

### Test Coverage

- ✅ Authentication flows
- ✅ Database CRUD operations
- ✅ File storage operations
- ✅ Realtime messaging
- ✅ Function execution
- ✅ Error handling
- ✅ Provider switching

## Migration Guide

### From Local to Firebase

1. Export local data:
   ```bash
   npm run export:local
   ```

2. Configure Firebase provider in settings

3. Import data:
   ```bash
   npm run import:firebase
   ```

### From Firebase to AWS

1. Use Firebase export tools
2. Configure AWS provider
3. Run AWS import scripts

## Security Considerations

### Local Provider
- No network security (development only)
- Data stored in plain JSON files
- JWT secret in environment variable

### Firebase Provider
- Firebase Security Rules
- Encrypted at rest
- OAuth2 authentication
- Project-level isolation

### AWS Provider
- IAM policies
- VPC isolation
- KMS encryption
- CloudTrail auditing

## Troubleshooting

### Common Issues

**Local Provider**
- Check file permissions on data directory
- Ensure ports 8000/8001 are available
- Verify Node.js version 20+

**Firebase Provider**
- Verify Firebase CLI is installed
- Check project exists in Firebase Console
- Ensure emulator ports are free

**AWS Provider**
- Docker must be running for LocalStack
- Check AWS credentials are valid
- Verify LocalStack services started

### Debug Mode

```bash
# Enable debug logging
DEBUG=provider:* npm run dev

# Check provider health
curl http://localhost:8000/api/health
```

## Future Roadmap

### Planned Providers
- **Supabase** - Open source Firebase alternative
- **Azure** - Microsoft cloud integration
- **Google Cloud** - Native GCP services
- **Cloudflare** - Edge computing

### Planned Features
- Provider migration tools
- Multi-provider sync
- Provider cost estimation
- Automatic failover
- Provider-specific optimizations

## Contributing

To add a new provider:

1. Implement provider interfaces in `backend/src/providers/[name]/`
2. Add to provider factory
3. Create Docker compose profile
4. Add frontend configuration UI
5. Write integration tests
6. Update documentation

See `backend/src/providers/local/` for reference implementation.

---

*Last updated: {{ date }}*