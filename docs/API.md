# Love Claude Code API Documentation

## Overview

The Love Claude Code API provides a RESTful interface for managing projects, files, AI interactions, and user settings. All API endpoints follow REST conventions and return JSON responses.

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://api.love-claude-code.com/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "expiresIn": 86400
}
```

### Using the Token

Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/register"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **AI endpoints**: 100 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705318800
```

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response:** `204 No Content`

#### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

### User Management

#### Get Current User

```http
GET /users/me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "settings": {
    "theme": "dark",
    "advancedMode": true
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Update User Profile

```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "settings": {
    "theme": "light"
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "settings": {
    "theme": "light",
    "advancedMode": true
  }
}
```

### Projects

#### List Projects

```http
GET /projects
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sort` (string): Sort field (createdAt, updatedAt, name)
- `order` (string): Sort order (asc, desc)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "project-123",
      "name": "My Awesome Project",
      "description": "A React application",
      "provider": "firebase",
      "hasMCP": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Create Project

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "A new React application",
  "provider": "local",
  "hasMCP": true,
  "template": "react-typescript"
}
```

**Response:** `201 Created`
```json
{
  "id": "project-456",
  "name": "New Project",
  "description": "A new React application",
  "provider": "local",
  "hasMCP": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Project Details

```http
GET /projects/:projectId
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "project-123",
  "name": "My Awesome Project",
  "description": "A React application",
  "provider": "firebase",
  "hasMCP": true,
  "settings": {
    "buildCommand": "npm run build",
    "startCommand": "npm start"
  },
  "stats": {
    "files": 42,
    "size": 1048576,
    "lastModified": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Project

```http
PATCH /projects/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

#### Delete Project

```http
DELETE /projects/:projectId
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### Files

#### Get File Tree

```http
GET /projects/:projectId/files
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "tree": [
    {
      "id": "file-1",
      "name": "src",
      "type": "folder",
      "path": "/src",
      "children": [
        {
          "id": "file-2",
          "name": "App.tsx",
          "type": "file",
          "path": "/src/App.tsx",
          "size": 2048,
          "language": "typescript"
        }
      ]
    }
  ]
}
```

#### Get File Content

```http
GET /projects/:projectId/files/:filePath
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "path": "/src/App.tsx",
  "content": "import React from 'react';\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;",
  "language": "typescript",
  "size": 120,
  "lastModified": "2024-01-15T10:30:00Z"
}
```

#### Create/Update File

```http
PUT /projects/:projectId/files/:filePath
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "import React from 'react';\n\nfunction App() {\n  return <div>Hello World!</div>;\n}\n\nexport default App;"
}
```

**Response:** `200 OK`
```json
{
  "path": "/src/App.tsx",
  "size": 121,
  "lastModified": "2024-01-15T10:35:00Z"
}
```

#### Delete File

```http
DELETE /projects/:projectId/files/:filePath
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### AI/Claude Integration

#### Send Message

```http
POST /projects/:projectId/claude/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Create a login form component",
  "context": {
    "currentFile": "/src/components/LoginForm.tsx",
    "openFiles": ["/src/App.tsx", "/src/index.css"]
  }
}
```

**Response:** `200 OK` (Streaming)
```
data: {"type":"token","content":"I'll"}
data: {"type":"token","content":" help"}
data: {"type":"token","content":" you"}
data: {"type":"code","language":"typescript","content":"import React..."}
data: {"type":"done"}
```

#### Get Conversation History

```http
GET /projects/:projectId/claude/history
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number): Number of messages (default: 50)
- `before` (string): Cursor for pagination

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "msg-123",
      "role": "user",
      "content": "Create a login form",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg-124",
      "role": "assistant",
      "content": "I'll help you create a login form...",
      "timestamp": "2024-01-15T10:30:15Z"
    }
  ],
  "hasMore": true,
  "cursor": "msg-100"
}
```

### Settings

#### Get Settings

```http
GET /settings
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "general": {
    "theme": "dark",
    "language": "en",
    "advancedMode": true
  },
  "ai": {
    "model": "claude-3-5-sonnet",
    "temperature": 0.7,
    "maxTokens": 4000
  },
  "providers": {
    "default": "local",
    "firebase": {
      "projectId": "my-project"
    }
  }
}
```

#### Update Settings

```http
PATCH /settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "general": {
    "theme": "light"
  },
  "ai": {
    "temperature": 0.8
  }
}
```

**Response:** `200 OK`

### MCP (Model Context Protocol)

#### List MCP Tools

```http
GET /projects/:projectId/mcp/tools
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "tools": [
    {
      "name": "create_user",
      "description": "Create a new user account",
      "inputSchema": {
        "type": "object",
        "properties": {
          "email": { "type": "string" },
          "name": { "type": "string" }
        }
      }
    }
  ]
}
```

#### Execute MCP Tool

```http
POST /projects/:projectId/mcp/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "tool": "create_user",
  "arguments": {
    "email": "newuser@example.com",
    "name": "New User"
  }
}
```

**Response:** `200 OK`
```json
{
  "result": {
    "id": "user-789",
    "email": "newuser@example.com",
    "name": "New User"
  }
}
```

## WebSocket API

For real-time features, connect to the WebSocket endpoint:

```
ws://localhost:8001/ws
wss://ws.love-claude-code.com/ws
```

### Authentication

Send authentication immediately after connection:

```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Message Types

#### File Updates

```json
{
  "type": "file:update",
  "projectId": "project-123",
  "path": "/src/App.tsx",
  "content": "...",
  "updatedBy": "user-456"
}
```

#### Collaboration Events

```json
{
  "type": "collaboration:cursor",
  "projectId": "project-123",
  "userId": "user-456",
  "file": "/src/App.tsx",
  "position": { "line": 10, "column": 15 }
}
```

#### AI Streaming

```json
{
  "type": "ai:token",
  "messageId": "msg-123",
  "content": "Here's"
}
```

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import { LoveClaudeCodeClient } from '@love-claude-code/sdk'

const client = new LoveClaudeCodeClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.love-claude-code.com'
})

// Create a project
const project = await client.projects.create({
  name: 'My Project',
  provider: 'local'
})

// Send a message to Claude
const response = await client.claude.sendMessage(project.id, {
  message: 'Create a React component'
})

// Stream the response
for await (const chunk of response) {
  console.log(chunk.content)
}
```

### Python

```python
from love_claude_code import Client

client = Client(api_key="your-api-key")

# List projects
projects = client.projects.list()

# Create a file
client.files.create(
    project_id="project-123",
    path="/src/new-file.py",
    content="print('Hello, World!')"
)
```

### cURL Examples

```bash
# Create a project
curl -X POST https://api.love-claude-code.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "provider": "local"}'

# Get file content
curl https://api.love-claude-code.com/api/v1/projects/PROJECT_ID/files/src%2FApp.tsx \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Versioning

The API uses URL versioning. The current version is `v1`. When breaking changes are introduced, a new version will be created.

Deprecated endpoints will include a `Deprecation` header:

```http
Deprecation: Sun, 01 Jan 2025 00:00:00 GMT
Link: <https://api.love-claude-code.com/api/v2/projects>; rel="successor-version"
```

## Support

For API support:

- [API Status Page](https://status.love-claude-code.com)
- [Developer Discord](https://discord.gg/love-claude-code-dev)
- [GitHub Issues](https://github.com/love-claude-code/love-claude-code/issues)
- Email: api-support@love-claude-code.com