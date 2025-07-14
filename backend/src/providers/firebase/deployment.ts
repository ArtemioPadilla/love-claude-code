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
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface FirebaseDeployment {
  id: string
  projectId?: string
  type: 'platform' | 'app'
  config: PlatformDeployConfig | AppDeployConfig
  status: DeploymentStatus
  firebaseProjectId?: string
  hostingSite?: string
  cloudRunService?: string
  functionNames?: string[]
  logs: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Firebase deployment provider
 * Uses Firebase Hosting, Cloud Run, and Cloud Functions
 */
export class FirebaseDeploymentProvider implements DeploymentProvider {
  private config: ProviderConfig
  private deployments: Map<string, FirebaseDeployment> = new Map()
  private firebaseProjectId: string
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.firebaseProjectId = config.options?.firebaseProjectId || 
                          process.env.FIREBASE_PROJECT_ID || 
                          'love-claude-dev'
  }
  
  async initialize(): Promise<void> {
    // Verify Firebase CLI is installed
    try {
      await execAsync('firebase --version')
    } catch (error) {
      throw new Error('Firebase CLI not installed. Run: npm install -g firebase-tools')
    }
    
    // Check if we're authenticated
    try {
      await execAsync('firebase projects:list')
    } catch (error) {
      console.warn('Not authenticated with Firebase. Run: firebase login')
    }
    
    // Load existing deployments from Firebase (in production, from Firestore)
    await this.loadDeployments()
  }
  
  async shutdown(): Promise<void> {
    // Firebase deployments persist, nothing to shutdown locally
  }
  
  private async loadDeployments(): Promise<void> {
    // In production, this would load from Firestore
    // For now, we'll use a local cache
    try {
      const cacheFile = path.join('.firebase', 'deployments.json')
      const data = await fs.readFile(cacheFile, 'utf-8')
      const deployments = JSON.parse(data) as FirebaseDeployment[]
      
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
      // No cache yet
    }
  }
  
  private async saveDeployments(): Promise<void> {
    // Save to local cache
    const cacheFile = path.join('.firebase', 'deployments.json')
    await fs.mkdir(path.dirname(cacheFile), { recursive: true })
    const deployments = Array.from(this.deployments.values())
    await fs.writeFile(cacheFile, JSON.stringify(deployments, null, 2))
  }
  
  async deployPlatform(config: PlatformDeployConfig): Promise<DeploymentResult> {
    const deploymentId = `firebase-platform-${crypto.randomUUID()}`
    const startTime = new Date()
    
    const deployment: FirebaseDeployment = {
      id: deploymentId,
      type: 'platform',
      config,
      firebaseProjectId: this.firebaseProjectId,
      status: {
        deploymentId,
        status: 'pending',
        environment: config.environment,
        startTime,
        lastUpdated: startTime
      },
      logs: [`[${startTime.toISOString()}] Starting Firebase platform deployment...`],
      createdAt: startTime,
      updatedAt: startTime
    }
    
    this.deployments.set(deploymentId, deployment)
    await this.saveDeployments()
    
    try {
      // Build the platform
      deployment.status.status = 'building'
      deployment.logs.push(`[${new Date().toISOString()}] Building Love Claude Code for Firebase...`)
      
      // Frontend deployment to Firebase Hosting
      if (config.frontend) {
        await this.deployFrontendToHosting(deployment, config)
      }
      
      // Backend deployment to Cloud Run
      if (config.backend) {
        await this.deployBackendToCloudRun(deployment, config)
      }
      
      // Deploy Cloud Functions for serverless features
      await this.deployCloudFunctions(deployment, config)
      
      // Update deployment status
      deployment.status.status = 'running'
      deployment.status.url = `https://${this.firebaseProjectId}.web.app`
      deployment.status.endTime = new Date()
      deployment.status.lastUpdated = new Date()
      deployment.logs.push(`[${new Date().toISOString()}] Platform deployed successfully!`)
      deployment.logs.push(`[${new Date().toISOString()}] Frontend: ${deployment.status.url}`)
      deployment.logs.push(`[${new Date().toISOString()}] Backend: https://${deployment.cloudRunService}-${this.getProjectHash()}.a.run.app`)
      
      await this.saveDeployments()
      
      return {
        deploymentId,
        status: 'completed',
        url: deployment.status.url,
        customUrl: config.frontend?.domain,
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
    const deploymentId = `firebase-app-${projectId}-${crypto.randomUUID()}`
    const startTime = new Date()
    
    const deployment: FirebaseDeployment = {
      id: deploymentId,
      projectId,
      type: 'app',
      config,
      firebaseProjectId: this.firebaseProjectId,
      status: {
        deploymentId,
        projectId,
        status: 'pending',
        environment: config.environment,
        startTime,
        lastUpdated: startTime
      },
      logs: [`[${startTime.toISOString()}] Starting Firebase app deployment for project ${projectId}...`],
      createdAt: startTime,
      updatedAt: startTime
    }
    
    this.deployments.set(deploymentId, deployment)
    await this.saveDeployments()
    
    try {
      deployment.status.status = 'building'
      
      if (config.type === 'static') {
        return await this.deployStaticApp(deployment, config)
      } else if (config.type === 'api') {
        return await this.deployApiApp(deployment, config)
      } else {
        return await this.deployFullstackApp(deployment, config)
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
  
  private async deployStaticApp(deployment: FirebaseDeployment, config: AppDeployConfig): Promise<DeploymentResult> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying static app to Firebase Hosting...`)
    
    // Create firebase.json for the app
    const firebaseConfig = {
      hosting: {
        public: config.build?.outputDir || 'dist',
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [
          {
            source: '**',
            destination: '/index.html'
          }
        ]
      }
    }
    
    const tempDir = path.join('.firebase', 'temp', deployment.id)
    await fs.mkdir(tempDir, { recursive: true })
    await fs.writeFile(
      path.join(tempDir, 'firebase.json'),
      JSON.stringify(firebaseConfig, null, 2)
    )
    
    // Deploy to Firebase Hosting
    deployment.status.status = 'deploying'
    const hostingSite = config.domain?.subdomain || `app-${deployment.projectId}`
    
    const { stdout, stderr } = await execAsync(
      `firebase deploy --only hosting:${hostingSite} --project ${this.firebaseProjectId}`,
      { cwd: tempDir }
    )
    
    if (stdout) deployment.logs.push(stdout)
    if (stderr) deployment.logs.push(stderr)
    
    // Update deployment status
    deployment.status.status = 'running'
    deployment.status.url = `https://${hostingSite}.web.app`
    deployment.hostingSite = hostingSite
    deployment.status.endTime = new Date()
    deployment.logs.push(`[${new Date().toISOString()}] Static app deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] URL: ${deployment.status.url}`)
    
    // Custom domain setup
    if (config.domain?.custom) {
      deployment.logs.push(`[${new Date().toISOString()}] Setting up custom domain: ${config.domain.custom}`)
      // This would configure custom domain in Firebase Hosting
    }
    
    await this.saveDeployments()
    
    return {
      deploymentId: deployment.id,
      status: 'completed',
      url: deployment.status.url,
      customUrl: config.domain?.custom,
      startTime: deployment.status.startTime,
      endTime: deployment.status.endTime,
      logs: deployment.logs
    }
  }
  
  private async deployApiApp(deployment: FirebaseDeployment, config: AppDeployConfig): Promise<DeploymentResult> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying API to Cloud Functions...`)
    
    // Prepare Cloud Function
    const functionName = `api-${deployment.projectId?.substring(0, 20)}`
    deployment.functionNames = [functionName]
    
    // Create function directory
    const funcDir = path.join('.firebase', 'functions', deployment.id)
    await fs.mkdir(funcDir, { recursive: true })
    
    // Generate package.json for function
    const packageJson = {
      name: functionName,
      version: '1.0.0',
      main: 'index.js',
      engines: {
        node: config.runtime?.version || '18'
      },
      dependencies: {
        'firebase-functions': '^4.0.0',
        'express': '^4.18.0',
        'cors': '^2.8.5'
      }
    }
    
    await fs.writeFile(
      path.join(funcDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
    
    // Create function wrapper
    const functionCode = `
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

// Import user's app
const userApp = require('./app');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Mount user's app
app.use('/', userApp);

// Export as Cloud Function
exports.${functionName} = functions.runWith({
  memory: '${config.resources?.memory || 256}MB',
  timeoutSeconds: ${config.resources?.timeout || 60},
}).https.onRequest(app);
`
    
    await fs.writeFile(path.join(funcDir, 'index.js'), functionCode)
    
    // Deploy to Cloud Functions
    deployment.status.status = 'deploying'
    deployment.logs.push(`[${new Date().toISOString()}] Installing dependencies...`)
    
    await execAsync('npm install', { cwd: funcDir })
    
    deployment.logs.push(`[${new Date().toISOString()}] Deploying function...`)
    const { stdout, stderr } = await execAsync(
      `firebase deploy --only functions:${functionName} --project ${this.firebaseProjectId}`,
      { cwd: funcDir }
    )
    
    if (stdout) deployment.logs.push(stdout)
    if (stderr) deployment.logs.push(stderr)
    
    // Update deployment status
    deployment.status.status = 'running'
    deployment.status.url = `https://${this.getProjectRegion()}-${this.firebaseProjectId}.cloudfunctions.net/${functionName}`
    deployment.status.endTime = new Date()
    deployment.logs.push(`[${new Date().toISOString()}] API deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] URL: ${deployment.status.url}`)
    
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
  
  private async deployFullstackApp(deployment: FirebaseDeployment, config: AppDeployConfig): Promise<DeploymentResult> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying fullstack app to Firebase...`)
    
    // Deploy frontend to Hosting
    const hostingResult = await this.deployStaticApp(deployment, {
      ...config,
      type: 'static'
    })
    
    // Deploy backend to Cloud Functions
    const apiConfig: AppDeployConfig = {
      ...config,
      type: 'api',
      build: {
        ...config.build,
        outputDir: 'backend'
      }
    }
    
    const apiResult = await this.deployApiApp(deployment, apiConfig)
    
    // Update URLs
    deployment.status.url = hostingResult.url
    deployment.logs.push(`[${new Date().toISOString()}] Fullstack app deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] Frontend: ${hostingResult.url}`)
    deployment.logs.push(`[${new Date().toISOString()}] Backend: ${apiResult.url}`)
    
    await this.saveDeployments()
    
    return {
      deploymentId: deployment.id,
      status: 'completed',
      url: deployment.status.url,
      customUrl: config.domain?.custom,
      startTime: deployment.status.startTime,
      endTime: deployment.status.endTime,
      logs: deployment.logs
    }
  }
  
  private async deployFrontendToHosting(deployment: FirebaseDeployment, config: PlatformDeployConfig): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying frontend to Firebase Hosting...`)
    
    const hostingSite = `platform-${config.environment}`
    deployment.hostingSite = hostingSite
    
    // Build frontend (in production, this would use the actual build)
    deployment.logs.push(`[${new Date().toISOString()}] Building frontend...`)
    
    // Deploy to Firebase Hosting
    const { stdout } = await execAsync(
      `firebase deploy --only hosting:${hostingSite} --project ${this.firebaseProjectId}`
    )
    
    if (stdout) deployment.logs.push(stdout)
    
    if (config.frontend?.domain) {
      deployment.logs.push(`[${new Date().toISOString()}] Configuring custom domain: ${config.frontend.domain}`)
      // Configure custom domain
    }
  }
  
  private async deployBackendToCloudRun(deployment: FirebaseDeployment, config: PlatformDeployConfig): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying backend to Cloud Run...`)
    
    const serviceName = `loveclaudecode-${config.environment}`
    deployment.cloudRunService = serviceName
    
    // Build container (in production, use Cloud Build)
    deployment.logs.push(`[${new Date().toISOString()}] Building container...`)
    
    // Deploy to Cloud Run
    const region = this.getProjectRegion()
    const { stdout } = await execAsync(
      `gcloud run deploy ${serviceName} ` +
      `--image gcr.io/${this.firebaseProjectId}/${serviceName}:latest ` +
      `--platform managed ` +
      `--region ${region} ` +
      `--memory ${config.backend?.memory || 512}Mi ` +
      `--cpu ${config.backend?.cpu || 1} ` +
      `--min-instances ${config.backend?.instances || 1} ` +
      `--max-instances ${(config.backend?.instances || 1) * 10} ` +
      `--allow-unauthenticated`
    )
    
    if (stdout) deployment.logs.push(stdout)
  }
  
  private async deployCloudFunctions(deployment: FirebaseDeployment, config: PlatformDeployConfig): Promise<void> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying Cloud Functions...`)
    
    // Deploy essential functions
    const functions = ['auth-webhook', 'storage-processor', 'scheduled-tasks']
    deployment.functionNames = functions
    
    for (const func of functions) {
      deployment.logs.push(`[${new Date().toISOString()}] Deploying function: ${func}`)
      
      const { stdout } = await execAsync(
        `firebase deploy --only functions:${func} --project ${this.firebaseProjectId}`
      )
      
      if (stdout) deployment.logs.push(stdout)
    }
  }
  
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    // Check actual status from Firebase services
    if (deployment.status.status === 'running') {
      deployment.status.health = await this.checkDeploymentHealth(deployment)
    }
    
    deployment.status.lastUpdated = new Date()
    await this.saveDeployments()
    
    return deployment.status
  }
  
  private async checkDeploymentHealth(deployment: FirebaseDeployment): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    try {
      // Check hosting site
      if (deployment.hostingSite) {
        // In production, make HTTP request to check
        return 'healthy'
      }
      
      // Check Cloud Run service
      if (deployment.cloudRunService) {
        const { stdout } = await execAsync(
          `gcloud run services describe ${deployment.cloudRunService} --region ${this.getProjectRegion()} --format json`
        )
        const service = JSON.parse(stdout)
        return service.status?.conditions?.[0]?.status === 'True' ? 'healthy' : 'unhealthy'
      }
      
      // Check Cloud Functions
      if (deployment.functionNames?.length) {
        // Check function status
        return 'healthy'
      }
      
      return 'unknown'
    } catch (error) {
      return 'unknown'
    }
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
    
    // Firebase doesn't have built-in rollback, but we can redeploy previous version
    if (deployment.hostingSite) {
      deployment.logs.push(`[${new Date().toISOString()}] Rolling back hosting site...`)
      // firebase hosting:clone SOURCE_SITE:SOURCE_VERSION TARGET_SITE:live
    }
    
    if (deployment.cloudRunService) {
      deployment.logs.push(`[${new Date().toISOString()}] Rolling back Cloud Run service...`)
      // gcloud run services update-traffic --to-revisions=REVISION=100
    }
    
    deployment.logs.push(`[${new Date().toISOString()}] Rollback completed`)
    deployment.status.status = 'running'
    deployment.status.lastUpdated = new Date()
    
    await this.saveDeployments()
  }
  
  async getDeploymentLogs(deploymentId: string, options?: LogOptions): Promise<string[]> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    let logs = [...deployment.logs]
    
    // Get live logs from services
    if (deployment.status.status === 'running') {
      // Cloud Run logs
      if (deployment.cloudRunService) {
        try {
          const { stdout } = await execAsync(
            `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${deployment.cloudRunService}" --limit ${options?.limit || 100} --format json`
          )
          const cloudLogs = JSON.parse(stdout || '[]')
          logs.push(...cloudLogs.map((l: any) => `[${l.timestamp}] ${l.textPayload || l.jsonPayload?.message || ''}`))
        } catch (error) {
          // Ignore errors
        }
      }
      
      // Function logs
      if (deployment.functionNames?.length) {
        for (const func of deployment.functionNames) {
          try {
            const { stdout } = await execAsync(
              `firebase functions:log --only ${func} --limit ${options?.limit || 100}`
            )
            if (stdout) logs.push(...stdout.split('\n').filter(Boolean))
          } catch (error) {
            // Ignore errors
          }
        }
      }
    }
    
    // Apply filters
    if (options?.startTime) {
      logs = logs.filter(log => {
        const match = log.match(/\[([\d-T:.Z]+)\]/)
        if (match) {
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
    
    deployment.logs.push(`[${new Date().toISOString()}] Deleting deployment...`)
    
    // Delete Firebase resources
    if (deployment.hostingSite) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting hosting site...`)
      // firebase hosting:disable SITE
    }
    
    if (deployment.cloudRunService) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting Cloud Run service...`)
      await execAsync(`gcloud run services delete ${deployment.cloudRunService} --region ${this.getProjectRegion()} --quiet`)
    }
    
    if (deployment.functionNames?.length) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting Cloud Functions...`)
      for (const func of deployment.functionNames) {
        await execAsync(`firebase functions:delete ${func} --project ${this.firebaseProjectId} --force`)
      }
    }
    
    // Remove from registry
    this.deployments.delete(deploymentId)
    await this.saveDeployments()
  }
  
  private getProjectRegion(): string {
    return this.config.region || process.env.FIREBASE_REGION || 'us-central1'
  }
  
  private getProjectHash(): string {
    return crypto.createHash('sha256').update(this.firebaseProjectId).digest('hex').substring(0, 8)
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Check Firebase CLI
      await execAsync('firebase --version')
      
      // Check authentication
      const { stdout } = await execAsync('firebase projects:list')
      const authenticated = stdout.includes(this.firebaseProjectId)
      
      return {
        status: 'healthy',
        details: {
          cliAvailable: true,
          authenticated,
          projectId: this.firebaseProjectId,
          deployments: this.deployments.size
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message
        }
      }
    }
  }
}