import * as pulumi from '@pulumi/pulumi'
import { L3Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { StaticWebsite } from '@love-claude-code/patterns'
import { PostgresDatabase } from '@love-claude-code/providers'
import * as docker from '@pulumi/docker'

export interface ContentManagementSystemArgs {
  /**
   * CMS name
   */
  cmsName: pulumi.Input<string>
  
  /**
   * Domain configuration
   */
  domain?: {
    primary: pulumi.Input<string>
    admin?: pulumi.Input<string>
    api?: pulumi.Input<string>
  }
  
  /**
   * CMS features
   */
  features: {
    multiLanguage?: boolean
    versioning?: boolean
    workflow?: boolean
    seo?: boolean
    analytics?: boolean
    search?: boolean
    comments?: boolean
    forms?: boolean
  }
  
  /**
   * Content types to support
   */
  contentTypes: Array<{
    name: string
    fields: Array<{
      name: string
      type: 'text' | 'richtext' | 'image' | 'video' | 'file' | 'date' | 'number' | 'boolean' | 'relation'
      required?: boolean
      validation?: any
    }>
    permissions?: {
      create?: string[]
      read?: string[]
      update?: string[]
      delete?: string[]
    }
  }>
  
  /**
   * User roles
   */
  roles?: Array<{
    name: string
    permissions: string[]
  }>
  
  /**
   * Media configuration
   */
  media?: {
    maxFileSizeMb?: number
    allowedTypes?: string[]
    imageOptimization?: boolean
    cdn?: boolean
  }
  
  /**
   * Database configuration
   */
  database?: {
    type: 'postgres' | 'mysql' | 'sqlite'
    connectionString?: pulumi.Input<string>
  }
  
  /**
   * Caching configuration
   */
  caching?: {
    enabled?: boolean
    ttl?: number
    redis?: {
      host?: pulumi.Input<string>
      port?: pulumi.Input<number>
    }
  }
  
  /**
   * Email configuration
   */
  email?: {
    smtp?: {
      host: pulumi.Input<string>
      port: pulumi.Input<number>
      user: pulumi.Input<string>
      password: pulumi.Input<string>
    }
  }
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L3 construct for a headless CMS with local/Docker deployment
 */
export class ContentManagementSystem extends L3Construct {
  // Core components
  public readonly database: PostgresDatabase
  public readonly apiContainer: docker.Container
  public readonly adminContainer: docker.Container
  public readonly frontendWebsite?: StaticWebsite
  
  // Supporting services
  public readonly redisContainer?: docker.Container
  public readonly searchContainer?: docker.Container
  
  // URLs
  public readonly apiUrl: pulumi.Output<string>
  public readonly adminUrl: pulumi.Output<string>
  public readonly databaseConnectionString: pulumi.Output<string>
  
  constructor(name: string, args: ContentManagementSystemArgs, opts?: pulumi.ComponentResourceOptions) {
    super('local:applications:L3ContentManagementSystem', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L3',
      'love-claude-code:application': 'cms',
      ...args.tags
    }
    
    // Create network for containers
    const network = new docker.Network(`${name}-network`, {
      name: `${name}-cms-network`
    }, { parent: this })
    
    // Create database
    this.database = this.createDatabase(name, args, network)
    
    // Create Redis cache if enabled
    if (args.caching?.enabled) {
      this.redisContainer = this.createRedisCache(name, network)
    }
    
    // Create search engine if enabled
    if (args.features.search) {
      this.searchContainer = this.createSearchEngine(name, network)
    }
    
    // Create API container
    this.apiContainer = this.createAPIContainer(name, args, network)
    
    // Create admin panel container
    this.adminContainer = this.createAdminContainer(name, args, network)
    
    // Create frontend website if domain is provided
    if (args.domain?.primary) {
      this.frontendWebsite = this.createFrontendWebsite(name, args, defaultTags)
    }
    
    // Create nginx reverse proxy
    this.createReverseProxy(name, args, network)
    
    // Apply application best practices
    this.applyApplicationBestPractices()
    
    // Set outputs
    this.apiUrl = pulumi.output(`http://localhost:8080/api`)
    this.adminUrl = pulumi.output(`http://localhost:8080/admin`)
    this.databaseConnectionString = this.database.connectionString
    
    // Register outputs
    this.registerOutputs({
      apiUrl: this.apiUrl,
      adminUrl: this.adminUrl,
      databaseConnectionString: this.databaseConnectionString,
      cmsName: args.cmsName
    })
  }
  
  private createDatabase(
    name: string,
    args: ContentManagementSystemArgs,
    network: docker.Network
  ): PostgresDatabase {
    const dbType = args.database?.type || 'postgres'
    
    return new PostgresDatabase(`${name}-db`, {
      databaseName: `${name}_cms`,
      username: 'cms_user',
      postgresVersion: '15',
      enableSsl: false,
      resources: {
        memoryMb: 512,
        cpuShares: 512
      },
      initScripts: [
        this.generateDatabaseSchema(args),
        this.generateInitialData(args)
      ],
      postgresConfig: {
        'max_connections': '200',
        'shared_buffers': '256MB',
        'effective_cache_size': '1GB',
        'log_statement': 'all',
        'log_duration': 'on'
      }
    }, { parent: this })
  }
  
  private generateDatabaseSchema(args: ContentManagementSystemArgs): string {
    const tables = [`
-- Core tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'editor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  metadata JSONB DEFAULT '{}',
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`]
    
    // Generate tables for each content type
    args.contentTypes.forEach(contentType => {
      const tableName = contentType.name.toLowerCase().replace(/\s+/g, '_')
      const fields = contentType.fields.map(field => {
        let sqlType = 'TEXT'
        switch (field.type) {
          case 'number': sqlType = 'NUMERIC'; break
          case 'date': sqlType = 'TIMESTAMP'; break
          case 'boolean': sqlType = 'BOOLEAN'; break
          case 'richtext': sqlType = 'TEXT'; break
          case 'image':
          case 'video':
          case 'file': sqlType = 'INTEGER REFERENCES media(id)'; break
          case 'relation': sqlType = 'INTEGER'; break
        }
        return `  ${field.name.toLowerCase().replace(/\s+/g, '_')} ${sqlType}${field.required ? ' NOT NULL' : ''}`
      }).join(',\n')
      
      tables.push(`
CREATE TABLE IF NOT EXISTS ${tableName} (
  id SERIAL PRIMARY KEY,
${fields},
  status VARCHAR(50) DEFAULT 'draft',
  author_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);`)
      
      // Add versioning table if enabled
      if (args.features.versioning) {
        tables.push(`
CREATE TABLE IF NOT EXISTS ${tableName}_versions (
  id SERIAL PRIMARY KEY,
  ${tableName}_id INTEGER REFERENCES ${tableName}(id),
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  author_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`)
      }
    })
    
    // Add indexes
    tables.push(`
-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
`)
    
    args.contentTypes.forEach(contentType => {
      const tableName = contentType.name.toLowerCase().replace(/\s+/g, '_')
      tables.push(`CREATE INDEX idx_${tableName}_status ON ${tableName}(status);`)
      tables.push(`CREATE INDEX idx_${tableName}_author ON ${tableName}(author_id);`)
      tables.push(`CREATE INDEX idx_${tableName}_published ON ${tableName}(published_at);`)
    })
    
    return tables.join('\n\n')
  }
  
  private generateInitialData(args: ContentManagementSystemArgs): string {
    const inserts = [`
-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
  ('admin', '["*"]'),
  ('editor', '["content.create", "content.update", "content.read", "media.upload"]'),
  ('author', '["content.create", "content.read", "media.upload"]'),
  ('viewer', '["content.read"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
  ('admin@example.com', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;
`]
    
    // Add any custom roles
    if (args.roles) {
      args.roles.forEach(role => {
        inserts.push(`
INSERT INTO roles (name, permissions) VALUES
  ('${role.name}', '${JSON.stringify(role.permissions)}')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;`)
      })
    }
    
    return inserts.join('\n')
  }
  
  private createRedisCache(
    name: string,
    network: docker.Network
  ): docker.Container {
    return new docker.Container(`${name}-redis`, {
      name: `${name}-redis`,
      image: 'redis:7-alpine',
      command: ['redis-server', '--appendonly', 'yes'],
      networksAdvanced: [{
        name: network.name,
        aliases: ['redis']
      }],
      restart: 'unless-stopped',
      volumes: [{
        volumeName: `${name}-redis-data`,
        containerPath: '/data'
      }],
      healthcheck: {
        test: ['CMD', 'redis-cli', 'ping'],
        interval: '10s',
        timeout: '5s',
        retries: 5
      }
    }, { parent: this })
  }
  
  private createSearchEngine(
    name: string,
    network: docker.Network
  ): docker.Container {
    return new docker.Container(`${name}-search`, {
      name: `${name}-meilisearch`,
      image: 'getmeili/meilisearch:v1.0',
      environment: [
        'MEILI_MASTER_KEY=masterKey123',
        'MEILI_ENV=development'
      ],
      networksAdvanced: [{
        name: network.name,
        aliases: ['search']
      }],
      ports: [{
        internal: 7700,
        external: 7700
      }],
      restart: 'unless-stopped',
      volumes: [{
        volumeName: `${name}-search-data`,
        containerPath: '/meili_data'
      }]
    }, { parent: this })
  }
  
  private createAPIContainer(
    name: string,
    args: ContentManagementSystemArgs,
    network: docker.Network
  ): docker.Container {
    // Build API image
    const apiImage = new docker.Image(`${name}-api-image`, {
      imageName: `${name}-cms-api:latest`,
      build: {
        context: './cms-api',
        dockerfile: 'Dockerfile',
        args: {
          NODE_ENV: 'production'
        }
      },
      skipPush: true
    }, { parent: this })
    
    return new docker.Container(`${name}-api`, {
      name: `${name}-cms-api`,
      image: apiImage.imageName,
      environment: [
        pulumi.interpolate`DATABASE_URL=${this.database.connectionString}`,
        `JWT_SECRET=your-secret-key-here`,
        `NODE_ENV=production`,
        `PORT=3000`,
        args.caching?.enabled ? `REDIS_URL=redis://redis:6379` : '',
        args.features.search ? `MEILISEARCH_URL=http://search:7700` : '',
        args.features.search ? `MEILISEARCH_KEY=masterKey123` : '',
        args.email?.smtp ? pulumi.interpolate`SMTP_HOST=${args.email.smtp.host}` : '',
        args.email?.smtp ? pulumi.interpolate`SMTP_PORT=${args.email.smtp.port}` : '',
        args.email?.smtp ? pulumi.interpolate`SMTP_USER=${args.email.smtp.user}` : '',
        args.email?.smtp ? pulumi.interpolate`SMTP_PASS=${args.email.smtp.password}` : ''
      ].filter(env => env !== ''),
      networksAdvanced: [{
        name: network.name,
        aliases: ['api']
      }],
      restart: 'unless-stopped',
      dependsOn: [this.database.container],
      healthcheck: {
        test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        startPeriod: '40s'
      }
    }, { parent: this })
  }
  
  private createAdminContainer(
    name: string,
    args: ContentManagementSystemArgs,
    network: docker.Network
  ): docker.Container {
    // Build admin panel image
    const adminImage = new docker.Image(`${name}-admin-image`, {
      imageName: `${name}-cms-admin:latest`,
      build: {
        context: './cms-admin',
        dockerfile: 'Dockerfile',
        args: {
          API_URL: 'http://api:3000',
          NODE_ENV: 'production'
        }
      },
      skipPush: true
    }, { parent: this })
    
    return new docker.Container(`${name}-admin`, {
      name: `${name}-cms-admin`,
      image: adminImage.imageName,
      environment: [
        'API_URL=http://api:3000',
        'NODE_ENV=production',
        'PORT=4000'
      ],
      networksAdvanced: [{
        name: network.name,
        aliases: ['admin']
      }],
      restart: 'unless-stopped',
      dependsOn: [this.apiContainer]
    }, { parent: this })
  }
  
  private createFrontendWebsite(
    name: string,
    args: ContentManagementSystemArgs,
    tags: Record<string, string>
  ): StaticWebsite {
    return new StaticWebsite(`${name}-frontend`, {
      domainName: args.domain!.primary,
      contentSource: new pulumi.asset.FileArchive('./cms-frontend-dist'),
      indexDocument: 'index.html',
      errorDocument: '404.html',
      enableCdn: true,
      certificateArn: pulumi.output('arn:aws:acm:us-east-1:123456789012:certificate/example'),
      responseHeaders: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff'
      },
      tags
    }, { parent: this })
  }
  
  private createReverseProxy(
    name: string,
    args: ContentManagementSystemArgs,
    network: docker.Network
  ): docker.Container {
    const nginxConfig = `
upstream api {
    server api:3000;
}

upstream admin {
    server admin:4000;
}

server {
    listen 80;
    server_name localhost;
    
    # API routes
    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin panel
    location /admin {
        proxy_pass http://admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy";
        add_header Content-Type text/plain;
    }
    
    # Media files
    location /media {
        alias /var/www/media;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`
    
    return new docker.Container(`${name}-nginx`, {
      name: `${name}-nginx`,
      image: 'nginx:alpine',
      networksAdvanced: [{
        name: network.name,
        aliases: ['nginx']
      }],
      ports: [{
        internal: 80,
        external: 8080
      }],
      volumes: [
        {
          hostPath: pulumi.interpolate`${process.cwd()}/nginx.conf`,
          containerPath: '/etc/nginx/conf.d/default.conf'
        },
        {
          volumeName: `${name}-media`,
          containerPath: '/var/www/media'
        }
      ],
      restart: 'unless-stopped',
      dependsOn: [this.apiContainer, this.adminContainer]
    }, { parent: this })
  }
  
  protected applyApplicationBestPractices(): void {
    this.applicationConsiderations = [
      {
        application: 'Headless CMS',
        description: 'Flexible content management system with API-first approach',
        architecture: [
          'PostgreSQL for structured content storage',
          'Redis for caching layer',
          'Meilisearch for full-text search',
          'Docker containers for portability',
          'Nginx reverse proxy',
          'RESTful API with JWT auth'
        ],
        scalability: [
          'Horizontal scaling with container orchestration',
          'Database connection pooling',
          'Redis caching for performance',
          'CDN for media delivery'
        ],
        security: [
          'JWT-based authentication',
          'Role-based access control',
          'Input validation and sanitization',
          'SQL injection prevention',
          'HTTPS enforcement',
          'Rate limiting'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'local-l3-cms',
      level: ConstructLevel.L3,
      name: 'Content Management System',
      description: 'Headless CMS with flexible content types and API-first design',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'application',
      tags: ['local', 'cms', 'headless', 'content', 'docker', 'application'],
      providers: [CloudProvider.Local]
    }
  }
}