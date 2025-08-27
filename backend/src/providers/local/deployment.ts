import {
  DeploymentProvider,
  PlatformDeployConfig,
  AppDeployConfig,
  DeploymentResult,
  DeploymentStatus,
  DeploymentInfo,
  LogOptions,
  ProviderConfig
} from '../types.js'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'

const execAsync = promisify(exec)

interface Deployment {
  id: string
  projectId?: string
  type: 'platform' | 'app'
  config: PlatformDeployConfig | AppDeployConfig
  status: DeploymentStatus
  logs: string[]
  process?: any
  createdAt: Date
  updatedAt: Date
}

/**
 * Local deployment provider using Docker and local processes
 */
export class LocalDeploymentProvider implements DeploymentProvider {
  // Config removed as it was unused
  private deploymentPath: string
  private deployments: Map<string, Deployment> = new Map()
  // Docker compose template removed as unused
  
  constructor(config: ProviderConfig) {
    // Store deploymentPath directly from config
    this.deploymentPath = path.join(
      config.options?.deploymentPath || './data/deployments',
      config.projectId
    )
    
    // Docker compose template for deployments
    // Template would be defined here for generating docker-compose.yml files
  }
  
  async initialize(): Promise<void> {
    // Ensure deployment directory exists
    await fs.mkdir(this.deploymentPath, { recursive: true })
    
    // Load existing deployments
    await this.loadDeployments()
    
    // Check Docker availability
    try {
      await execAsync('docker --version')
    } catch (error) {
      console.warn('Docker not available. Limited deployment options.')
    }
  }
  
  async shutdown(): Promise<void> {
    // Stop all running deployments gracefully
    for (const deployment of this.deployments.values()) {
      if (deployment.status.status === 'running') {
        await this.stopDeployment(deployment.id)
      }
    }
  }
  
  private async loadDeployments(): Promise<void> {
    try {
      const manifestPath = path.join(this.deploymentPath, 'deployments.json')
      const data = await fs.readFile(manifestPath, 'utf-8')
      const deployments = JSON.parse(data) as Deployment[]
      
      deployments.forEach(dep => {
        this.deployments.set(dep.id, {
          ...dep,
          createdAt: new Date(dep.createdAt),
          updatedAt: new Date(dep.updatedAt),
          status: {
            ...dep.status,
            startTime: new Date(dep.status.startTime),
            endTime: dep.status.endTime ? new Date(dep.status.endTime) : undefined,
            lastUpdated: new Date(dep.status.lastUpdated)
          }
        })
      })
    } catch (error) {
      // No deployments yet
      if ((error as any).code !== 'ENOENT') {
        console.error('Error loading deployments:', error)
      }
    }
  }
  
  private async saveDeployments(): Promise<void> {
    const manifestPath = path.join(this.deploymentPath, 'deployments.json')
    const deployments = Array.from(this.deployments.values())
    await fs.writeFile(manifestPath, JSON.stringify(deployments, null, 2))
  }
  
  async deployPlatform(config: PlatformDeployConfig): Promise<DeploymentResult> {
    const deploymentId = `platform-${crypto.randomUUID()}`
    const startTime = new Date()
    
    const deployment: Deployment = {
      id: deploymentId,
      type: 'platform',
      config,
      status: {
        deploymentId,
        status: 'pending',
        environment: config.environment,
        startTime,
        lastUpdated: startTime
      },
      logs: [`[${startTime.toISOString()}] Starting platform deployment...`],
      createdAt: startTime,
      updatedAt: startTime
    }
    
    this.deployments.set(deploymentId, deployment)
    await this.saveDeployments()
    
    try {
      // Update status to building
      deployment.status.status = 'building'
      deployment.logs.push(`[${new Date().toISOString()}] Building Love Claude Code platform...`)
      
      // Create deployment directory
      const deployDir = path.join(this.deploymentPath, deploymentId)
      await fs.mkdir(deployDir, { recursive: true })
      
      // Generate docker-compose.yml for platform
      const dockerCompose = await this.generatePlatformDockerCompose(config, deploymentId)
      await fs.writeFile(path.join(deployDir, 'docker-compose.yml'), dockerCompose)
      
      // Copy necessary files (in production, this would pull from Git or registry)
      deployment.logs.push(`[${new Date().toISOString()}] Preparing deployment files...`)
      
      // Update status to deploying
      deployment.status.status = 'deploying'
      deployment.logs.push(`[${new Date().toISOString()}] Deploying platform...`)
      
      // Start the platform using docker-compose
      const port = this.getAvailablePort()
      const { stdout, stderr } = await execAsync(`docker-compose up -d`, {
        cwd: deployDir,
        env: {
          ...process.env,
          PORT: String(port),
          DEPLOYMENT_ID: deploymentId,
          ENVIRONMENT: config.environment
        }
      })
      
      if (stdout) deployment.logs.push(stdout)
      if (stderr) deployment.logs.push(stderr)
      
      // Update deployment status
      deployment.status.status = 'running'
      deployment.status.url = `http://localhost:${port}`
      deployment.status.endTime = new Date()
      deployment.status.lastUpdated = new Date()
      deployment.logs.push(`[${new Date().toISOString()}] Platform deployed successfully!`)
      deployment.logs.push(`[${new Date().toISOString()}] Access at: ${deployment.status.url}`)
      
      await this.saveDeployments()
      
      return {
        deploymentId,
        status: 'completed',
        url: deployment.status.url,
        startTime,
        endTime: deployment.status.endTime,
        logs: deployment.logs
      }
    } catch (error) {
      deployment.status.status = 'failed'
      deployment.status.endTime = new Date()
      deployment.logs.push(`[${new Date().toISOString()}] Deployment failed: ${(error as Error).message}`)
      await this.saveDeployments()
      
      return {
        deploymentId,
        status: 'failed',
        startTime,
        endTime: new Date(),
        logs: deployment.logs,
        error: (error as Error).message
      }
    }
  }
  
  async deployApp(projectId: string, config: AppDeployConfig): Promise<DeploymentResult> {
    const deploymentId = `app-${projectId}-${crypto.randomUUID()}`
    const startTime = new Date()
    
    const deployment: Deployment = {
      id: deploymentId,
      projectId,
      type: 'app',
      config,
      status: {
        deploymentId,
        projectId,
        status: 'pending',
        environment: config.environment,
        startTime,
        lastUpdated: startTime
      },
      logs: [`[${startTime.toISOString()}] Starting app deployment for project ${projectId}...`],
      createdAt: startTime,
      updatedAt: startTime
    }
    
    this.deployments.set(deploymentId, deployment)
    await this.saveDeployments()
    
    try {
      // Update status to building
      deployment.status.status = 'building'
      deployment.logs.push(`[${new Date().toISOString()}] Building application...`)
      
      // Create deployment directory
      const deployDir = path.join(this.deploymentPath, deploymentId)
      await fs.mkdir(deployDir, { recursive: true })
      
      // Handle different app types
      if (config.type === 'static') {
        return await this.deployStaticApp(deployment, deployDir, config)
      } else if (config.type === 'api') {
        return await this.deployApiApp(deployment, deployDir, config)
      } else {
        return await this.deployFullstackApp(deployment, deployDir, config)
      }
    } catch (error) {
      deployment.status.status = 'failed'
      deployment.status.endTime = new Date()
      deployment.logs.push(`[${new Date().toISOString()}] Deployment failed: ${(error as Error).message}`)
      await this.saveDeployments()
      
      return {
        deploymentId,
        status: 'failed',
        startTime,
        endTime: new Date(),
        logs: deployment.logs,
        error: (error as Error).message
      }
    }
  }
  
  private async deployStaticApp(deployment: Deployment, deployDir: string, config: AppDeployConfig): Promise<DeploymentResult> {
    const port = this.getAvailablePort()
    
    // Generate nginx config for static site
    const nginxConfig = `
server {
    listen ${port};
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`
    
    await fs.writeFile(path.join(deployDir, 'nginx.conf'), nginxConfig)
    
    // Generate Dockerfile for static site
    const dockerfile = `
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ${config.build?.outputDir || 'dist'} /usr/share/nginx/html
EXPOSE ${port}
`
    
    await fs.writeFile(path.join(deployDir, 'Dockerfile'), dockerfile)
    
    // Build and run the container
    deployment.status.status = 'deploying'
    deployment.logs.push(`[${new Date().toISOString()}] Building Docker image...`)
    
    const imageName = `love-claude-app-${deployment.id}`
    await execAsync(`docker build -t ${imageName} .`, { cwd: deployDir })
    
    deployment.logs.push(`[${new Date().toISOString()}] Starting container...`)
    await execAsync(`docker run -d -p ${port}:${port} --name ${deployment.id} ${imageName}`)
    
    // Update deployment status
    deployment.status.status = 'running'
    deployment.status.url = `http://localhost:${port}`
    deployment.status.endTime = new Date()
    deployment.status.lastUpdated = new Date()
    deployment.logs.push(`[${new Date().toISOString()}] Static app deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] Access at: ${deployment.status.url}`)
    
    await this.saveDeployments()
    
    return {
      deploymentId: deployment.id,
      status: 'completed',
      url: deployment.status.url,
      startTime: deployment.status.startTime,
      endTime: deployment.status.endTime,
      logs: deployment.logs
    }
  }
  
  private async deployApiApp(deployment: Deployment, deployDir: string, config: AppDeployConfig): Promise<DeploymentResult> {
    const port = this.getAvailablePort()
    
    // Generate Dockerfile based on runtime
    let dockerfile = ''
    if (config.runtime?.engine === 'nodejs') {
      dockerfile = `
FROM node:${config.runtime.version || '18'}-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE ${port}
CMD ["node", "index.js"]
`
    } else if (config.runtime?.engine === 'python') {
      dockerfile = `
FROM python:${config.runtime.version || '3.11'}-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${port}
CMD ["python", "app.py"]
`
    }
    
    await fs.writeFile(path.join(deployDir, 'Dockerfile'), dockerfile)
    
    // Build and run the container
    deployment.status.status = 'deploying'
    deployment.logs.push(`[${new Date().toISOString()}] Building API container...`)
    
    const imageName = `love-claude-api-${deployment.id}`
    await execAsync(`docker build -t ${imageName} .`, { cwd: deployDir })
    
    // Prepare environment variables
    const envVars = Object.entries(config.environmentVariables || {})
      .map(([k, v]) => `-e ${k}="${v}"`)
      .join(' ')
    
    deployment.logs.push(`[${new Date().toISOString()}] Starting API container...`)
    await execAsync(`docker run -d -p ${port}:${port} ${envVars} --name ${deployment.id} ${imageName}`)
    
    // Update deployment status
    deployment.status.status = 'running'
    deployment.status.url = `http://localhost:${port}`
    deployment.status.endTime = new Date()
    deployment.status.lastUpdated = new Date()
    deployment.logs.push(`[${new Date().toISOString()}] API deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] Access at: ${deployment.status.url}`)
    
    await this.saveDeployments()
    
    return {
      deploymentId: deployment.id,
      status: 'completed',
      url: deployment.status.url,
      startTime: deployment.status.startTime,
      endTime: deployment.status.endTime,
      logs: deployment.logs
    }
  }
  
  private async deployFullstackApp(deployment: Deployment, deployDir: string, config: AppDeployConfig): Promise<DeploymentResult> {
    // For fullstack apps, we'll use docker-compose
    const frontendPort = this.getAvailablePort()
    const backendPort = this.getAvailablePort()
    
    const dockerCompose = `
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "${frontendPort}:80"
    environment:
      - REACT_APP_API_URL=http://localhost:${backendPort}
    depends_on:
      - backend
      
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "${backendPort}:3000"
    environment:
      ${Object.entries(config.environmentVariables || {}).map(([k, v]) => `- ${k}=${v}`).join('\n      ')}
`
    
    await fs.writeFile(path.join(deployDir, 'docker-compose.yml'), dockerCompose)
    
    // Deploy using docker-compose
    deployment.status.status = 'deploying'
    deployment.logs.push(`[${new Date().toISOString()}] Starting fullstack deployment...`)
    
    await execAsync(`docker-compose up -d`, { cwd: deployDir })
    
    // Update deployment status
    deployment.status.status = 'running'
    deployment.status.url = `http://localhost:${frontendPort}`
    deployment.status.endTime = new Date()
    deployment.status.lastUpdated = new Date()
    deployment.logs.push(`[${new Date().toISOString()}] Fullstack app deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] Frontend: http://localhost:${frontendPort}`)
    deployment.logs.push(`[${new Date().toISOString()}] Backend: http://localhost:${backendPort}`)
    
    await this.saveDeployments()
    
    return {
      deploymentId: deployment.id,
      status: 'completed',
      url: deployment.status.url,
      startTime: deployment.status.startTime,
      endTime: deployment.status.endTime,
      logs: deployment.logs
    }
  }
  
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    // Check if container is still running
    if (deployment.status.status === 'running') {
      try {
        const { stdout } = await execAsync(`docker ps --filter "name=${deploymentId}" --format "{{.Status}}"`)
        if (!stdout.trim()) {
          deployment.status.status = 'stopped'
          deployment.status.health = 'unhealthy'
        } else {
          deployment.status.health = 'healthy'
        }
      } catch (error) {
        deployment.status.health = 'unknown'
      }
    }
    
    deployment.status.lastUpdated = new Date()
    await this.saveDeployments()
    
    return deployment.status
  }
  
  async listDeployments(projectId?: string): Promise<DeploymentInfo[]> {
    const deployments = Array.from(this.deployments.values())
      .filter(d => !projectId || d.projectId === projectId)
      .map(d => ({
        deploymentId: d.id,
        projectId: d.projectId,
        type: d.type,
        environment: (d.config as any).environment,
        status: d.status.status,
        url: d.status.url,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }))
    
    return deployments
  }
  
  async rollback(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    deployment.logs.push(`[${new Date().toISOString()}] Rolling back deployment...`)
    
    // Stop the current deployment
    await this.stopDeployment(deploymentId)
    
    // In a real implementation, we would restore the previous version
    deployment.logs.push(`[${new Date().toISOString()}] Rollback completed`)
    deployment.status.status = 'stopped'
    deployment.status.lastUpdated = new Date()
    
    await this.saveDeployments()
  }
  
  async getDeploymentLogs(deploymentId: string, options?: LogOptions): Promise<string[]> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    let logs = [...deployment.logs]
    
    // Get container logs if running
    if (deployment.status.status === 'running') {
      try {
        const { stdout } = await execAsync(`docker logs ${deploymentId} --tail ${options?.limit || 100}`)
        if (stdout) {
          logs.push(...stdout.split('\n').filter(Boolean))
        }
      } catch (error) {
        // Container might not exist
      }
    }
    
    // Apply filters
    if (options?.startTime) {
      logs = logs.filter(log => {
        const match = log.match(/\[([\d-T:.Z]+)\]/)
        if (match && match[1]) {
          return new Date(match[1]) >= options.startTime!
        }
        return false
      })
    }
    
    if (options?.limit) {
      logs = logs.slice(-options.limit)
    }
    
    return logs
  }
  
  async deleteDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    // Stop the deployment if running
    if (deployment.status.status === 'running') {
      await this.stopDeployment(deploymentId)
    }
    
    // Remove deployment directory
    const deployDir = path.join(this.deploymentPath, deploymentId)
    await fs.rm(deployDir, { recursive: true, force: true })
    
    // Remove from registry
    this.deployments.delete(deploymentId)
    await this.saveDeployments()
  }
  
  private async stopDeployment(deploymentId: string): Promise<void> {
    try {
      // Try docker first
      await execAsync(`docker stop ${deploymentId}`)
      await execAsync(`docker rm ${deploymentId}`)
    } catch (error) {
      // Container might not exist
    }
    
    try {
      // Try docker-compose
      const deployDir = path.join(this.deploymentPath, deploymentId)
      await execAsync(`docker-compose down`, { cwd: deployDir })
    } catch (error) {
      // Compose might not be used
    }
  }
  
  private getAvailablePort(): number {
    // In production, this would check for actually available ports
    return Math.floor(Math.random() * (9999 - 3001) + 3001)
  }
  
  private async generatePlatformDockerCompose(config: PlatformDeployConfig, deploymentId: string): Promise<string> {
    return `
version: '3.8'

services:
  frontend:
    image: loveclaudecode/frontend:${config.version || 'latest'}
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=${config.environment}
      - REACT_APP_API_URL=http://backend:8000
    labels:
      - "love-claude.deployment=${deploymentId}"
      - "love-claude.service=frontend"
    restart: unless-stopped

  backend:
    image: loveclaudecode/backend:${config.version || 'latest'}
    ports:
      - "\${BACKEND_PORT:-8000}:8000"
    environment:
      - NODE_ENV=${config.environment}
      - PROVIDER_TYPE=local
      - JWT_SECRET=\${JWT_SECRET:-development-secret}
    volumes:
      - backend-data:/data
    labels:
      - "love-claude.deployment=${deploymentId}"
      - "love-claude.service=backend"
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=loveclaudecode
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-development}
      - POSTGRES_DB=loveclaudecode_${config.environment}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    labels:
      - "love-claude.deployment=${deploymentId}"
      - "love-claude.service=database"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    labels:
      - "love-claude.deployment=${deploymentId}"
      - "love-claude.service=cache"
    restart: unless-stopped

${config.frontend?.cdn ? `
  nginx:
    image: nginx:alpine
    ports:
      - "\${NGINX_PORT:-80}:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    labels:
      - "love-claude.deployment=${deploymentId}"
      - "love-claude.service=proxy"
    restart: unless-stopped
` : ''}

volumes:
  backend-data:
  postgres-data:
  redis-data:

networks:
  default:
    name: loveclaudecode-${deploymentId}
`
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Check Docker availability
      await execAsync('docker --version')
      
      const runningDeployments = Array.from(this.deployments.values())
        .filter(d => d.status.status === 'running').length
      
      return {
        status: 'healthy',
        details: {
          deployments: this.deployments.size,
          running: runningDeployments,
          dockerAvailable: true
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: 'Docker not available',
          deployments: this.deployments.size
        }
      }
    }
  }
}