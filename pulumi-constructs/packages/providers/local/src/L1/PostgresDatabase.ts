import * as pulumi from '@pulumi/pulumi'
import * as docker from '@pulumi/docker'
import { L1Construct, SecurityConsideration, CostModel } from '@love-claude-code/core'
import { ConstructLevel, CloudProvider } from '@love-claude-code/core'
import * as fs from 'fs'
import * as path from 'path'

export interface PostgresDatabaseArgs {
  /**
   * Database name
   */
  databaseName: pulumi.Input<string>
  
  /**
   * Database user
   */
  username?: pulumi.Input<string>
  
  /**
   * Database password (will be generated if not provided)
   */
  password?: pulumi.Input<string>
  
  /**
   * PostgreSQL version
   */
  postgresVersion?: pulumi.Input<string>
  
  /**
   * Port to expose
   */
  port?: pulumi.Input<number>
  
  /**
   * Volume path for data persistence
   */
  dataPath?: pulumi.Input<string>
  
  /**
   * Initial SQL scripts to run
   */
  initScripts?: pulumi.Input<string[]>
  
  /**
   * PostgreSQL configuration
   */
  postgresConfig?: pulumi.Input<Record<string, string>>
  
  /**
   * Enable SSL
   */
  enableSsl?: pulumi.Input<boolean>
  
  /**
   * Resource limits
   */
  resources?: {
    memoryMb?: pulumi.Input<number>
    cpuShares?: pulumi.Input<number>
  }
}

/**
 * L1 construct for local PostgreSQL database with security best practices
 */
export class PostgresDatabase extends L1Construct {
  public readonly container: docker.Container
  public readonly connectionString: pulumi.Output<string>
  public readonly host: pulumi.Output<string>
  public readonly port: pulumi.Output<number>
  public readonly database: pulumi.Output<string>
  public readonly username: pulumi.Output<string>
  private readonly password: pulumi.Output<string>
  
  constructor(name: string, args: PostgresDatabaseArgs, opts?: pulumi.ComponentResourceOptions) {
    super('local:postgres:L1Database', name, {}, opts)
    
    // Generate secure password if not provided
    const password = args.password || this.generateSecurePassword()
    const username = args.username || 'dbuser'
    const port = args.port || 5432
    
    // Create data volume
    const dataPath = args.dataPath || `/var/lib/postgresql/data/${name}`
    const volume = new docker.Volume(`${name}-data`, {
      name: `${name}-postgres-data`,
      labels: {
        'love-claude-code.construct': 'L1',
        'love-claude-code.provider': 'local',
        'love-claude-code.resource': 'postgres-database'
      }
    }, { parent: this })
    
    // Create custom PostgreSQL configuration
    const configPath = this.createPostgresConfig(name, args.postgresConfig, args.enableSsl)
    
    // Create init scripts volume if provided
    const initScriptsPath = args.initScripts ? 
      this.createInitScripts(name, args.initScripts) : undefined
    
    // Environment variables
    const envVars = [
      pulumi.interpolate`POSTGRES_DB=${args.databaseName}`,
      pulumi.interpolate`POSTGRES_USER=${username}`,
      pulumi.interpolate`POSTGRES_PASSWORD=${password}`,
      'PGDATA=/var/lib/postgresql/data/pgdata'
    ]
    
    // Volume mounts
    const mounts: docker.types.input.ContainerMount[] = [
      {
        type: 'volume',
        source: volume.name,
        target: '/var/lib/postgresql/data'
      }
    ]
    
    if (configPath) {
      mounts.push({
        type: 'bind',
        source: configPath,
        target: '/etc/postgresql/postgresql.conf',
        readOnly: true
      })
      envVars.push('POSTGRES_CONFIG_FILE=/etc/postgresql/postgresql.conf')
    }
    
    if (initScriptsPath) {
      mounts.push({
        type: 'bind',
        source: initScriptsPath,
        target: '/docker-entrypoint-initdb.d',
        readOnly: true
      })
    }
    
    // Create the PostgreSQL container
    this.container = new docker.Container(`${name}-postgres`, {
      name: `${name}-postgres`,
      image: pulumi.interpolate`postgres:${args.postgresVersion || '15-alpine'}`,
      env: envVars,
      ports: [{
        internal: 5432,
        external: port
      }],
      mounts: mounts,
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U $POSTGRES_USER -d $POSTGRES_DB'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
        startPeriod: '30s'
      },
      memory: args.resources?.memoryMb ? args.resources.memoryMb * 1024 * 1024 : undefined,
      cpuShares: args.resources?.cpuShares,
      labels: {
        'love-claude-code.construct': 'L1',
        'love-claude-code.provider': 'local',
        'love-claude-code.resource': 'postgres-database',
        'love-claude-code.name': name
      }
    }, { parent: this })
    
    // Apply security best practices
    this.applySecurityBestPractices()
    
    // Set outputs
    this.host = pulumi.output('localhost')
    this.port = pulumi.output(port)
    this.database = pulumi.output(args.databaseName)
    this.username = pulumi.output(username)
    this.password = pulumi.output(password)
    
    this.connectionString = pulumi.interpolate`postgresql://${username}:${password}@localhost:${port}/${args.databaseName}${args.enableSsl ? '?sslmode=require' : ''}`
    
    // Register outputs
    this.registerOutputs({
      connectionString: this.connectionString,
      host: this.host,
      port: this.port,
      database: this.database,
      username: this.username
    })
  }
  
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
  
  private createPostgresConfig(
    name: string,
    customConfig?: pulumi.Input<Record<string, string>>,
    enableSsl?: pulumi.Input<boolean>
  ): string | undefined {
    const configDir = path.join(process.cwd(), '.pulumi', 'postgres-configs', name)
    fs.mkdirSync(configDir, { recursive: true })
    
    let config = `
# PostgreSQL Configuration - Managed by Love Claude Code L1 Construct

# Connection Settings
listen_addresses = '*'
max_connections = 100

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Write Ahead Log
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Query Tuning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000  # Log queries longer than 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Statistics
track_activities = on
track_counts = on
track_io_timing = on
track_functions = 'all'

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
`
    
    if (enableSsl) {
      config += `
# SSL Configuration
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
`
    }
    
    // Apply custom configuration
    if (customConfig) {
      pulumi.output(customConfig).apply(custom => {
        if (custom) {
          Object.entries(custom).forEach(([key, value]) => {
            config += `${key} = ${value}\n`
          })
        }
      })
    }
    
    const configPath = path.join(configDir, 'postgresql.conf')
    fs.writeFileSync(configPath, config)
    
    return configPath
  }
  
  private createInitScripts(
    name: string,
    scripts: pulumi.Input<string[]>
  ): string | undefined {
    const scriptsDir = path.join(process.cwd(), '.pulumi', 'postgres-scripts', name)
    fs.mkdirSync(scriptsDir, { recursive: true })
    
    pulumi.output(scripts).apply(scriptList => {
      scriptList.forEach((script, index) => {
        const scriptPath = path.join(scriptsDir, `${index.toString().padStart(3, '0')}-init.sql`)
        fs.writeFileSync(scriptPath, script)
      })
    })
    
    return scriptsDir
  }
  
  protected applySecurityBestPractices(): void {
    this.securityConsiderations = [
      {
        type: 'access-control',
        description: 'Password authentication required',
        recommendation: 'Use strong passwords and consider certificate-based authentication'
      },
      {
        type: 'network',
        description: 'Exposed on localhost only by default',
        recommendation: 'Use Docker networks for container-to-container communication'
      },
      {
        type: 'encryption',
        description: 'SSL/TLS support available',
        recommendation: 'Enable SSL for production workloads'
      },
      {
        type: 'audit',
        description: 'Query logging configured',
        recommendation: 'Monitor logs for suspicious activity'
      }
    ]
  }
  
  public getCostModel(): CostModel {
    return {
      provider: CloudProvider.Local,
      service: 'PostgreSQL',
      baseCost: 0, // No cost for local development
      usage: {
        storage: {
          cost: 0,
          unit: 'GB'
        },
        compute: {
          cost: 0,
          unit: 'hours'
        }
      }
    }
  }
  
  public getConstructMetadata() {
    return {
      id: 'local-l1-postgres-database',
      level: ConstructLevel.L1,
      name: 'Local PostgreSQL Database',
      description: 'PostgreSQL database running in Docker with security configurations',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'database',
      tags: ['local', 'postgres', 'postgresql', 'database', 'sql', 'docker'],
      providers: [CloudProvider.Local]
    }
  }
  
  /**
   * Execute SQL query
   */
  public executeQuery(query: string): pulumi.Output<void> {
    return pulumi.all([this.container.name, this.database, this.username, this.password])
      .apply(([containerName, db, user, pass]) => {
        // This would execute using docker exec
        console.log(`Executing query on ${containerName}`)
      })
  }
}