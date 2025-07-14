# Local Provider Documentation

## Overview

The Local Provider is the default backend implementation for Love Claude Code, designed for zero-configuration development and self-hosted deployments. It provides a complete backend solution using local resources without requiring external cloud services.

## Features

- **Zero Configuration**: Works out of the box with sensible defaults
- **File-Based Storage**: JSON files for data persistence
- **JWT Authentication**: Secure token-based authentication
- **Local File System**: Direct file system access for project files
- **WebSocket Support**: Real-time updates via local WebSocket server
- **PostgreSQL Support**: Optional PostgreSQL for production use
- **No External Dependencies**: Everything runs locally

## Architecture

```mermaid
graph TB
    subgraph "Local Provider"
        Auth[JWT Auth Service]
        DB[Database Layer]
        FS[File Storage]
        Func[Function Runner]
        WS[WebSocket Server]
        
        subgraph "Storage Options"
            JSON[JSON Files]
            PG[PostgreSQL]
        end
        
        DB --> JSON
        DB --> PG
    end
    
    API[Backend API] --> Auth
    API --> DB
    API --> FS
    API --> Func
    API --> WS
```

## Quick Start

```bash
# No configuration needed!
npm run dev

# The local provider will:
# 1. Create data directory at ./data
# 2. Initialize JSON storage
# 3. Start all services
# 4. Be ready at http://localhost:8000
```

## Configuration

### Environment Variables

```bash
# .env.local

# Provider Type
PROVIDER_TYPE=local

# Storage Configuration
LOCAL_DATA_PATH=./data          # Where to store data files
LOCAL_STORAGE_PATH=./storage    # Where to store uploaded files

# Database Configuration (optional)
DATABASE_TYPE=json              # 'json' or 'postgres'
DATABASE_URL=postgresql://user:pass@localhost:5432/loveclaudecode

# Authentication
JWT_SECRET=your-secret-key-here # Auto-generated if not provided
JWT_EXPIRES_IN=7d              # Token expiration time

# Server Configuration
API_PORT=8000                  # API server port
REALTIME_PORT=8001            # WebSocket server port

# Function Execution
FUNCTION_TIMEOUT=30000        # Function execution timeout (ms)
FUNCTION_MEMORY_LIMIT=512     # Memory limit in MB
```

### Configuration File

```typescript
// backend/src/providers/local/config.ts
export const localProviderConfig = {
  storage: {
    dataPath: process.env.LOCAL_DATA_PATH || './data',
    storagePath: process.env.LOCAL_STORAGE_PATH || './storage',
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  database: {
    type: process.env.DATABASE_TYPE || 'json',
    jsonOptions: {
      pretty: true,
      compression: false,
    },
    postgresOptions: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production',
    },
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || generateSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: 10,
  },
  functions: {
    timeout: parseInt(process.env.FUNCTION_TIMEOUT || '30000'),
    memoryLimit: parseInt(process.env.FUNCTION_MEMORY_LIMIT || '512'),
  },
}
```

## Storage Options

### JSON Storage (Default)

Perfect for development and small deployments.

**Structure:**
```
data/
├── users/
│   ├── user-123.json
│   └── user-456.json
├── projects/
│   ├── project-abc.json
│   └── project-def.json
├── files/
│   └── project-abc/
│       └── src/
│           └── App.tsx
└── metadata.json
```

**Example User File:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "passwordHash": "$2b$10$...",
  "name": "John Doe",
  "settings": {
    "theme": "dark",
    "advancedMode": true
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### PostgreSQL Storage

Recommended for production deployments.

**Schema:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  provider VARCHAR(50) DEFAULT 'local',
  has_mcp BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  path VARCHAR(500) NOT NULL,
  content TEXT,
  language VARCHAR(50),
  size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, path)
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_path ON files(path);
```

**Migration from JSON to PostgreSQL:**
```bash
# Run migration script
npm run migrate:json-to-postgres

# Or manually
node scripts/migrate-to-postgres.js
```

## Authentication

The Local Provider uses JWT tokens for authentication.

### Implementation

```typescript
// backend/src/providers/local/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export class LocalAuthProvider implements AuthProvider {
  async signUp(credentials: UserCredentials): Promise<User> {
    const hashedPassword = await bcrypt.hash(credentials.password, 10)
    const user = await this.db.createUser({
      email: credentials.email,
      passwordHash: hashedPassword,
      name: credentials.name,
    })
    return user
  }

  async signIn(credentials: UserCredentials): Promise<AuthResult> {
    const user = await this.db.getUserByEmail(credentials.email)
    if (!user) throw new Error('User not found')
    
    const valid = await bcrypt.compare(credentials.password, user.passwordHash)
    if (!valid) throw new Error('Invalid password')
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.config.jwtSecret,
      { expiresIn: this.config.expiresIn }
    )
    
    return { user, token }
  }

  async verifyToken(token: string): Promise<AuthToken> {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as JWTPayload
      return {
        userId: payload.userId,
        email: payload.email,
        expires: new Date(payload.exp * 1000),
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }
}
```

## File Storage

Files are stored directly on the file system with proper organization.

### File Operations

```typescript
// backend/src/providers/local/storage.ts
export class LocalStorageProvider implements StorageProvider {
  private storagePath: string

  async uploadFile(
    bucket: string,
    key: string,
    data: Buffer,
    metadata?: FileMetadata
  ): Promise<FileInfo> {
    const filePath = path.join(this.storagePath, bucket, key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, data)
    
    return {
      key,
      size: data.length,
      contentType: metadata?.contentType || 'application/octet-stream',
      lastModified: new Date(),
      etag: createHash('md5').update(data).digest('hex'),
    }
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const filePath = path.join(this.storagePath, bucket, key)
    return await fs.readFile(filePath)
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const filePath = path.join(this.storagePath, bucket, key)
    await fs.unlink(filePath)
  }

  async listFiles(bucket: string, prefix?: string): Promise<FileInfo[]> {
    const bucketPath = path.join(this.storagePath, bucket)
    const files = await this.walkDirectory(bucketPath, prefix)
    return files
  }
}
```

### Project File Management

```typescript
// Managing project files
const storage = new LocalStorageProvider()

// Save a file
await storage.uploadFile(
  `projects/${projectId}`,
  'src/App.tsx',
  Buffer.from(fileContent),
  { contentType: 'text/typescript' }
)

// Read a file
const content = await storage.downloadFile(
  `projects/${projectId}`,
  'src/App.tsx'
)

// List project files
const files = await storage.listFiles(`projects/${projectId}`)
```

## Function Execution

The Local Provider executes functions in isolated Node.js processes.

### Implementation

```typescript
// backend/src/providers/local/functions.ts
import { spawn } from 'child_process'
import { VM } from 'vm2'

export class LocalFunctionProvider implements FunctionProvider {
  async invoke(name: string, payload: any): Promise<any> {
    // For simple functions, use VM2
    if (this.isSimpleFunction(name)) {
      return this.runInVM(name, payload)
    }
    
    // For complex functions, spawn process
    return this.runInProcess(name, payload)
  }

  private async runInVM(name: string, payload: any): Promise<any> {
    const vm = new VM({
      timeout: this.config.timeout,
      sandbox: {
        console,
        require: this.createSecureRequire(),
        payload,
      },
    })
    
    const code = await this.loadFunctionCode(name)
    return vm.run(code)
  }

  private async runInProcess(name: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [
        '--max-old-space-size=' + this.config.memoryLimit,
        'functions/' + name + '.js'
      ], {
        env: {
          ...process.env,
          FUNCTION_PAYLOAD: JSON.stringify(payload),
        },
      })
      
      let output = ''
      child.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(output))
        } else {
          reject(new Error(`Function failed with code ${code}`))
        }
      })
      
      // Kill process after timeout
      setTimeout(() => {
        child.kill('SIGTERM')
      }, this.config.timeout)
    })
  }
}
```

## Real-time Updates

WebSocket server for real-time functionality.

### WebSocket Server

```typescript
// backend/src/providers/local/realtime.ts
import { WebSocketServer } from 'ws'

export class LocalRealtimeProvider implements RealtimeProvider {
  private wss: WebSocketServer
  private connections: Map<string, Set<WebSocket>> = new Map()

  async initialize() {
    this.wss = new WebSocketServer({
      port: this.config.port,
      verifyClient: this.verifyClient.bind(this),
    })
    
    this.wss.on('connection', this.handleConnection.bind(this))
  }

  private async verifyClient(info: any, callback: Function) {
    const token = this.extractToken(info.req)
    if (!token) return callback(false, 401, 'Unauthorized')
    
    try {
      const auth = await this.authProvider.verifyToken(token)
      info.req.userId = auth.userId
      callback(true)
    } catch {
      callback(false, 401, 'Invalid token')
    }
  }

  private handleConnection(ws: WebSocket, req: any) {
    const userId = req.userId
    
    // Add to user's connections
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(ws)
    
    ws.on('message', (data) => this.handleMessage(ws, userId, data))
    ws.on('close', () => this.handleDisconnect(ws, userId))
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    const message = JSON.stringify({ channel, event, data })
    
    // Send to all subscribed users
    for (const [userId, connections] of this.connections) {
      if (this.isSubscribed(userId, channel)) {
        for (const ws of connections) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message)
          }
        }
      }
    }
  }
}
```

## Production Deployment

### Using PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'love-claude-api',
      script: './backend/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PROVIDER_TYPE: 'local',
        DATABASE_TYPE: 'postgres',
      },
    },
    {
      name: 'love-claude-ws',
      script: './backend/dist/websocket.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        REALTIME_PORT: 8001,
      },
    },
  ],
}
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # API endpoints
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket endpoints
    location /ws {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # File uploads
    client_max_body_size 50M;
}
```

### Systemd Service

```ini
# /etc/systemd/system/love-claude-code.service
[Unit]
Description=Love Claude Code API
After=network.target

[Service]
Type=forking
User=loveclaudecode
WorkingDirectory=/opt/love-claude-code
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

# Configuration
BACKUP_DIR="/backups/love-claude-code"
DATA_DIR="/opt/love-claude-code/data"
STORAGE_DIR="/opt/love-claude-code/storage"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$TIMESTAMP"

# Backup JSON data
if [ -d "$DATA_DIR" ]; then
  tar -czf "$BACKUP_DIR/$TIMESTAMP/data.tar.gz" -C "$DATA_DIR" .
fi

# Backup uploaded files
if [ -d "$STORAGE_DIR" ]; then
  tar -czf "$BACKUP_DIR/$TIMESTAMP/storage.tar.gz" -C "$STORAGE_DIR" .
fi

# Backup PostgreSQL if used
if [ "$DATABASE_TYPE" = "postgres" ]; then
  pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/$TIMESTAMP/database.sql.gz"
fi

# Keep only last 30 days of backups
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \;
```

### Recovery Process

```bash
#!/bin/bash
# restore.sh

# Configuration
BACKUP_PATH=$1
DATA_DIR="/opt/love-claude-code/data"
STORAGE_DIR="/opt/love-claude-code/storage"

# Stop services
pm2 stop all

# Restore data
tar -xzf "$BACKUP_PATH/data.tar.gz" -C "$DATA_DIR"
tar -xzf "$BACKUP_PATH/storage.tar.gz" -C "$STORAGE_DIR"

# Restore PostgreSQL if needed
if [ -f "$BACKUP_PATH/database.sql.gz" ]; then
  gunzip < "$BACKUP_PATH/database.sql.gz" | psql $DATABASE_URL
fi

# Start services
pm2 start all
```

## Performance Tuning

### Optimization Tips

1. **Use PostgreSQL for Production**: Better performance and scalability
2. **Enable Compression**: For JSON storage, enable compression
3. **Implement Caching**: Add Redis for frequently accessed data
4. **Optimize File Storage**: Use separate disk for file storage
5. **Monitor Resource Usage**: Track CPU, memory, and disk usage

### Caching Layer

```typescript
// Add caching to Local Provider
import { createClient } from 'redis'

export class CachedLocalProvider {
  private redis = createClient()
  private provider: LocalProvider

  async getUser(id: string): Promise<User | null> {
    // Check cache first
    const cached = await this.redis.get(`user:${id}`)
    if (cached) return JSON.parse(cached)
    
    // Get from provider
    const user = await this.provider.getUser(id)
    if (user) {
      await this.redis.setex(`user:${id}`, 3600, JSON.stringify(user))
    }
    
    return user
  }
}
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Fix permissions
   sudo chown -R $(whoami) ./data ./storage
   chmod -R 755 ./data ./storage
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :8000
   # Kill process or use different port
   ```

3. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   # Test connection
   psql -U postgres -h localhost
   ```

4. **File Upload Failures**
   ```bash
   # Check disk space
   df -h
   # Check file permissions
   ls -la ./storage
   ```

## Migration Guide

### From JSON to PostgreSQL

1. **Install PostgreSQL**
2. **Create database**
3. **Run migrations**
4. **Execute migration script**
5. **Update configuration**
6. **Restart services**

### From Local to Cloud Provider

1. **Export data using backup script**
2. **Configure new provider**
3. **Import data to new provider**
4. **Update environment variables**
5. **Test thoroughly**
6. **Switch DNS/routing**

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)