# MCP API Reference

## REST API Endpoints

The MCP functionality is exposed through REST API endpoints that wrap the MCP tools.

### Base URL
```
http://localhost:8000/api/mcp
```

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Analyze Project Requirements
Analyzes project needs and generates a requirements profile.

**POST** `/api/mcp/analyze-requirements`

**Request Body:**
```json
{
  "projectType": "fullstack",
  "expectedUsers": 50000,
  "features": ["auth", "realtime", "storage", "notifications"],
  "dataVolume": "medium",
  "compliance": ["GDPR", "SOC2"],
  "budget": "medium",
  "timeline": "short",
  "teamSize": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requirements": {
      "projectType": "fullstack",
      "expectedUsers": 50000,
      "features": ["auth", "realtime", "storage", "notifications"],
      "dataVolume": "medium",
      "compliance": ["GDPR", "SOC2"],
      "budget": "medium",
      "performanceNeeds": "high",
      "scalabilityNeeds": "medium"
    },
    "recommendations": [
      {
        "provider": "firebase",
        "score": 0.85,
        "reasons": [
          "Excellent real-time capabilities",
          "Built-in authentication",
          "Scales automatically"
        ]
      }
    ]
  }
}
```

### 2. List Providers
Lists available providers with their capabilities.

**POST** `/api/mcp/list-providers`

**Request Body:**
```json
{
  "filter": {
    "features": ["realtime", "auth"],
    "maxCost": 100,
    "compliance": ["GDPR"],
    "regions": ["us-east-1", "eu-west-1"]
  },
  "requirements": {
    "projectType": "web",
    "expectedUsers": 10000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "type": "firebase",
        "name": "Firebase",
        "description": "Google's app development platform",
        "score": 0.92,
        "capabilities": {
          "auth": { "supported": true, "features": ["email", "social", "mfa"] },
          "database": { "supported": true, "features": ["realtime", "offline"] },
          "storage": { "supported": true, "features": ["cdn", "streaming"] }
        }
      }
    ]
  }
}
```

### 3. Get Provider Configuration
Retrieves current provider configuration for a project.

**GET** `/api/mcp/projects/:projectId/provider-config`

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj_123",
    "provider": "firebase",
    "configuration": {
      "type": "firebase",
      "projectId": "my-firebase-project",
      "region": "us-central1",
      "credentials": "[REDACTED]"
    },
    "isDefault": false
  }
}
```

### 4. Compare Providers
Provides detailed comparison between multiple providers.

**POST** `/api/mcp/compare-providers`

**Request Body:**
```json
{
  "providers": ["local", "firebase", "aws"],
  "requirements": {
    "projectType": "fullstack",
    "expectedUsers": 50000,
    "features": ["auth", "database", "storage"]
  },
  "features": ["auth.mfa", "database.realtime", "storage.cdn"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": {
      "overview": [
        {
          "provider": "firebase",
          "name": "Firebase",
          "score": 0.85,
          "supportLevel": "professional",
          "pricingModel": "pay-as-you-go"
        }
      ],
      "features": [
        {
          "feature": "auth.mfa",
          "local": false,
          "firebase": true,
          "aws": true
        }
      ],
      "pricing": [
        {
          "provider": "firebase",
          "model": "pay-as-you-go",
          "freeTier": { "users": 10000, "storage": "5GB" },
          "estimatedCost": { "monthly": 25, "yearly": 300, "currency": "USD" }
        }
      ]
    },
    "summary": "Based on your requirements, Firebase scores highest...",
    "recommendation": "Firebase is recommended for your use case"
  }
}
```

### 5. Estimate Costs
Estimates costs across different providers.

**POST** `/api/mcp/estimate-costs`

**Request Body:**
```json
{
  "requirements": {
    "projectType": "web",
    "expectedUsers": 100000,
    "features": ["auth", "database", "storage", "functions"],
    "dataVolume": "high",
    "budget": "medium"
  },
  "providers": ["firebase", "aws"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimates": [
      {
        "provider": "firebase",
        "name": "Firebase",
        "pricing": {
          "model": "pay-as-you-go",
          "estimated": {
            "monthly": 150,
            "yearly": 1800,
            "currency": "USD",
            "breakdown": {
              "auth": 20,
              "database": 50,
              "storage": 30,
              "functions": 50
            }
          }
        },
        "freeTier": {
          "included": true,
          "limits": { "users": 10000, "storage": "5GB" }
        },
        "notes": [
          "Costs increase significantly after free tier",
          "Pay-as-you-go model scales with usage"
        ]
      }
    ],
    "summary": {
      "cheapest": { "provider": "firebase", "monthly": 150 },
      "mostExpensive": { "provider": "aws", "monthly": 250 },
      "recommendation": "For 100000 users and high data volume, Firebase would be most cost-effective"
    }
  }
}
```

### 6. Switch Provider
Switches the active provider for a project.

**POST** `/api/mcp/projects/:projectId/switch-provider`

**Request Body:**
```json
{
  "newProvider": "firebase",
  "migrate": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Provider switch initiated with migration",
    "migrationPlan": {
      "id": "mig_123",
      "steps": [
        {
          "name": "Export user data",
          "description": "Export all user accounts from local database",
          "estimatedTime": 300
        }
      ],
      "totalEstimatedTime": 1800,
      "risks": ["Potential data format incompatibilities"]
    },
    "nextSteps": [
      "Review the migration plan",
      "Backup your data",
      "Execute migration with migrate_data endpoint"
    ]
  }
}
```

### 7. Migrate Data
Plans or executes data migration between providers.

**POST** `/api/mcp/migrate`

**Request Body:**
```json
{
  "projectId": "proj_123",
  "fromProvider": "local",
  "toProvider": "firebase",
  "execute": false,
  "options": {
    "includeUsers": true,
    "includeData": true,
    "includeFiles": true,
    "dryRun": true
  }
}
```

**Response (Plan Only):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "mig_456",
      "fromProvider": "local",
      "toProvider": "firebase",
      "steps": [
        {
          "id": "step_1",
          "name": "Export user data",
          "type": "export",
          "source": "local.users",
          "destination": "firebase.auth",
          "estimatedTime": 300,
          "dependencies": []
        }
      ],
      "totalEstimatedTime": 1800,
      "dataSize": { "users": 50000, "documents": 100000, "files": 5000 },
      "risks": ["Authentication method differences"],
      "rollbackPlan": { "supported": true, "steps": [...] }
    },
    "message": "Migration plan created. Set execute=true to run migration."
  }
}
```

**Response (Execution):**
```json
{
  "success": true,
  "data": {
    "plan": { /* ... plan details ... */ },
    "result": {
      "success": true,
      "startedAt": "2024-01-20T10:00:00Z",
      "completedAt": "2024-01-20T10:30:00Z",
      "duration": 1800,
      "steps": [
        {
          "id": "step_1",
          "status": "completed",
          "duration": 300,
          "itemsProcessed": 50000
        }
      ],
      "summary": {
        "totalItems": 155000,
        "successfulItems": 155000,
        "failedItems": 0
      },
      "errors": []
    },
    "message": "Migration completed successfully"
  }
}
```

### 8. Check Provider Health
Checks the health status of providers.

**GET** `/api/mcp/health`

**Query Parameters:**
- `projectId` (optional): Check health for specific project

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "providers": {
      "local": {
        "status": "healthy",
        "latency": 5,
        "services": {
          "database": "healthy",
          "storage": "healthy",
          "auth": "healthy"
        }
      },
      "firebase": {
        "status": "healthy",
        "latency": 45,
        "services": {
          "firestore": "healthy",
          "auth": "healthy",
          "storage": "healthy"
        }
      },
      "aws": {
        "status": "degraded",
        "latency": 120,
        "services": {
          "dynamodb": "healthy",
          "s3": "degraded",
          "cognito": "healthy"
        }
      }
    },
    "summary": {
      "total": 3,
      "healthy": 2,
      "unhealthy": 1
    },
    "timestamp": "2024-01-20T10:00:00Z"
  }
}
```

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": "Provider not found",
  "code": "PROVIDER_NOT_FOUND",
  "details": {
    "provider": "unknown",
    "availableProviders": ["local", "firebase", "aws"]
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `PROVIDER_NOT_FOUND` | Specified provider doesn't exist | 404 |
| `INVALID_REQUIREMENTS` | Invalid project requirements | 400 |
| `MIGRATION_CONFLICT` | Migration already in progress | 409 |
| `PROVIDER_UNAVAILABLE` | Provider service is down | 503 |
| `INTERNAL_ERROR` | Server error | 500 |

## WebSocket Events

For real-time updates during migrations and long-running operations:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8001/mcp/events');
ws.send(JSON.stringify({ 
  type: 'auth', 
  token: 'your-jwt-token' 
}));
```

### Events

**Migration Progress:**
```json
{
  "type": "migration.progress",
  "data": {
    "migrationId": "mig_123",
    "currentStep": "step_2",
    "progress": 45,
    "message": "Exporting user data..."
  }
}
```

**Provider Status Change:**
```json
{
  "type": "provider.status",
  "data": {
    "provider": "aws",
    "oldStatus": "healthy",
    "newStatus": "degraded",
    "reason": "S3 experiencing high latency"
  }
}
```

## Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/analyze-requirements` | 100 | 1 hour |
| `/compare-providers` | 200 | 1 hour |
| `/estimate-costs` | 200 | 1 hour |
| `/switch-provider` | 10 | 1 hour |
| `/migrate` | 5 | 1 hour |
| `/health` | 1000 | 1 hour |

## SDK Examples

### JavaScript/TypeScript
```typescript
import { MCPClient } from '@love-claude-code/mcp-sdk';

const mcp = new MCPClient({
  baseUrl: 'http://localhost:8000',
  token: 'your-jwt-token'
});

// Analyze requirements
const requirements = await mcp.analyzeRequirements({
  projectType: 'fullstack',
  expectedUsers: 50000,
  features: ['auth', 'realtime']
});

// Compare providers
const comparison = await mcp.compareProviders({
  providers: ['firebase', 'aws'],
  requirements: requirements.data.requirements
});

// Estimate costs
const costs = await mcp.estimateCosts({
  requirements: requirements.data.requirements
});
```

### Python
```python
from love_claude_code import MCPClient

mcp = MCPClient(
    base_url='http://localhost:8000',
    token='your-jwt-token'
)

# Analyze requirements
requirements = mcp.analyze_requirements(
    project_type='fullstack',
    expected_users=50000,
    features=['auth', 'realtime']
)

# Compare providers
comparison = mcp.compare_providers(
    providers=['firebase', 'aws'],
    requirements=requirements['data']['requirements']
)
```

### cURL
```bash
# Analyze requirements
curl -X POST http://localhost:8000/api/mcp/analyze-requirements \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "fullstack",
    "expectedUsers": 50000,
    "features": ["auth", "realtime"]
  }'

# Check health
curl -X GET http://localhost:8000/api/mcp/health \
  -H "Authorization: Bearer your-jwt-token"
```