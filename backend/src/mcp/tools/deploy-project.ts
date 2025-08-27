import { MCPToolResult } from '../types.js'
import { getProvider } from '../../providers/factory.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

export interface DeployProjectArgs {
  projectId: string
  environment: 'development' | 'staging' | 'production'
  provider?: 'local' | 'firebase' | 'aws'
  options?: {
    version?: string
    autoScale?: boolean
    minInstances?: number
    maxInstances?: number
    region?: string
    skipTests?: boolean
    skipBackup?: boolean
  }
}

export async function deployProject(args: DeployProjectArgs): Promise<MCPToolResult> {
  try {
    const { projectId, environment, provider: providerType, options = {} } = args
    
    // Get provider instance
    const provider = await getProvider({
      type: providerType || 'firebase',
      projectId
    })
    
    // Pre-deployment checks
    const checks = await runPreDeploymentChecks(projectId, environment, options)
    if (!checks.passed) {
      return {
        success: false,
        error: 'Pre-deployment checks failed',
        data: { checks }
      }
    }
    
    // Create deployment configuration
    const deployConfig = {
      projectId,
      environment,
      version: options.version || await getNextVersion(projectId),
      timestamp: new Date().toISOString(),
      provider: providerType,
      config: {
        autoScale: options.autoScale ?? (environment === 'production'),
        minInstances: options.minInstances ?? 1,
        maxInstances: options.maxInstances ?? (environment === 'production' ? 10 : 3),
        region: options.region || 'us-central1'
      }
    }
    
    // Backup current deployment if not skipped
    if (!options.skipBackup && environment === 'production') {
      await createDeploymentBackup(projectId, environment)
    }
    
    // Deploy based on provider
    let deploymentResult: any
    
    switch (providerType) {
      case 'firebase':
        deploymentResult = await deployToFirebase(deployConfig, provider)
        break
        
      case 'aws':
        deploymentResult = await deployToAWS(deployConfig, provider)
        break
        
      case 'local':
        deploymentResult = await deployToLocal(deployConfig, provider)
        break
        
      default:
        throw new Error(`Unsupported provider: ${providerType}`)
    }
    
    // Post-deployment validation
    const validation = await validateDeployment(deployConfig, deploymentResult)
    
    return {
      success: true,
      data: {
        deployment: deploymentResult,
        validation,
        config: deployConfig,
        urls: {
          app: deploymentResult.url,
          dashboard: deploymentResult.dashboardUrl,
          logs: deploymentResult.logsUrl
        }
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    }
  }
}

async function runPreDeploymentChecks(
  _projectId: string,
  environment: string,
  options: any
): Promise<{ passed: boolean; checks: any[] }> {
  const checks = []
  
  // Check 1: Run tests if not skipped
  if (!options.skipTests) {
    try {
      await execAsync('npm test', {
        cwd: path.join(process.cwd(), 'frontend')
      })
      checks.push({
        name: 'Unit Tests',
        passed: true,
        message: 'All tests passed'
      })
    } catch (error) {
      checks.push({
        name: 'Unit Tests',
        passed: false,
        message: 'Tests failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Check 2: Build project
  try {
    await execAsync('npm run build', {
      cwd: path.join(process.cwd(), 'frontend')
    })
    checks.push({
      name: 'Build',
      passed: true,
      message: 'Build successful'
    })
  } catch (error) {
    checks.push({
      name: 'Build',
      passed: false,
      message: 'Build failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Check 3: Security scan
  try {
    const { stdout } = await execAsync('npm audit --production', {
      cwd: process.cwd()
    })
    const hasVulnerabilities = stdout.includes('found 0 vulnerabilities')
    checks.push({
      name: 'Security Audit',
      passed: hasVulnerabilities,
      message: hasVulnerabilities ? 'No vulnerabilities found' : 'Vulnerabilities detected'
    })
  } catch (error) {
    checks.push({
      name: 'Security Audit',
      passed: false,
      message: 'Security audit failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Check 4: Environment variables
  const requiredEnvVars = getRequiredEnvVars(environment)
  const missingVars = requiredEnvVars.filter(v => !process.env[v])
  checks.push({
    name: 'Environment Variables',
    passed: missingVars.length === 0,
    message: missingVars.length === 0 ? 'All required variables set' : `Missing: ${missingVars.join(', ')}`
  })
  
  const passed = checks.every(c => c.passed)
  return { passed, checks }
}

function getRequiredEnvVars(environment: string): string[] {
  const base = ['NODE_ENV']
  
  switch (environment) {
    case 'production':
      return [...base, 'FIREBASE_PROJECT_ID', 'AWS_REGION', 'SENTRY_DSN']
    case 'staging':
      return [...base, 'FIREBASE_PROJECT_ID', 'AWS_REGION']
    case 'development':
      return base
    default:
      return base
  }
}

async function getNextVersion(_projectId: string): Promise<string> {
  try {
    const packageJson = await fs.readFile(
      path.join(process.cwd(), 'frontend', 'package.json'),
      'utf-8'
    )
    const { version } = JSON.parse(packageJson)
    return version
  } catch {
    return '1.0.0'
  }
}

async function createDeploymentBackup(_projectId: string, environment: string): Promise<void> {
  const backupDir = path.join(process.cwd(), '.backups', environment)
  await fs.mkdir(backupDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(backupDir, `backup-${timestamp}.tar.gz`)
  
  await execAsync(`tar -czf ${backupPath} --exclude=node_modules --exclude=.git .`, {
    cwd: process.cwd()
  })
}

async function deployToFirebase(config: any, _provider: any): Promise<any> {
  // Deploy functions
  await execAsync('firebase deploy --only functions', {
    env: {
      ...process.env,
      FIREBASE_PROJECT: config.projectId
    }
  })
  
  // Deploy hosting
  await execAsync('firebase deploy --only hosting', {
    env: {
      ...process.env,
      FIREBASE_PROJECT: config.projectId
    }
  })
  
  return {
    provider: 'firebase',
    projectId: config.projectId,
    environment: config.environment,
    version: config.version,
    url: `https://${config.projectId}.web.app`,
    dashboardUrl: `https://console.firebase.google.com/project/${config.projectId}`,
    logsUrl: `https://console.firebase.google.com/project/${config.projectId}/functions/logs`,
    deployedAt: new Date().toISOString()
  }
}

async function deployToAWS(config: any, _provider: any): Promise<any> {
  // Deploy using AWS CDK
  await execAsync(`cdk deploy --require-approval never`, {
    cwd: path.join(process.cwd(), 'infrastructure'),
    env: {
      ...process.env,
      AWS_REGION: config.config.region,
      ENVIRONMENT: config.environment
    }
  })
  
  // Get stack outputs
  const { stdout } = await execAsync('cdk outputs --json', {
    cwd: path.join(process.cwd(), 'infrastructure')
  })
  
  const outputs = JSON.parse(stdout)
  
  return {
    provider: 'aws',
    projectId: config.projectId,
    environment: config.environment,
    version: config.version,
    url: outputs.AppUrl,
    dashboardUrl: outputs.DashboardUrl,
    logsUrl: outputs.LogsUrl,
    deployedAt: new Date().toISOString(),
    stackOutputs: outputs
  }
}

async function deployToLocal(config: any, _provider: any): Promise<any> {
  // Build and run Docker containers
  await execAsync('docker-compose build', {
    cwd: process.cwd()
  })
  
  await execAsync('docker-compose up -d', {
    cwd: process.cwd()
  })
  
  return {
    provider: 'local',
    projectId: config.projectId,
    environment: config.environment,
    version: config.version,
    url: 'http://localhost:3000',
    dashboardUrl: 'http://localhost:3000/admin',
    logsUrl: 'docker logs',
    deployedAt: new Date().toISOString()
  }
}

async function validateDeployment(_config: any, deployment: any): Promise<any> {
  const validations = []
  
  // Check if app is accessible
  try {
    const response = await fetch(deployment.url)
    validations.push({
      name: 'App Accessibility',
      passed: response.ok,
      status: response.status,
      message: response.ok ? 'App is accessible' : `HTTP ${response.status}`
    })
  } catch (error) {
    validations.push({
      name: 'App Accessibility',
      passed: false,
      message: 'App is not accessible',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Check health endpoint
  try {
    const response = await fetch(`${deployment.url}/api/health`)
    const health = await response.json() as { status?: string }
    validations.push({
      name: 'Health Check',
      passed: health?.status === 'healthy',
      message: `Health status: ${health?.status || 'unknown'}`
    })
  } catch (error) {
    validations.push({
      name: 'Health Check',
      passed: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  return {
    passed: validations.every(v => v.passed),
    validations,
    timestamp: new Date().toISOString()
  }
}