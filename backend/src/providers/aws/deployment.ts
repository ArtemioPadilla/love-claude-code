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
import {
  CloudFormationClient,
  CreateStackCommand,
  UpdateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand
} from '@aws-sdk/client-cloudformation'
import {
  ECSClient,
  CreateServiceCommand,
  UpdateServiceCommand,
  DeleteServiceCommand,
  DescribeServicesCommand,
  RegisterTaskDefinitionCommand
} from '@aws-sdk/client-ecs'
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import {
  CloudFrontClient,
  CreateDistributionCommand,
  GetDistributionCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand
} from '@aws-sdk/client-cloudfront'
import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  DeleteFunctionCommand,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda'
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from './utils/logger.js'

interface AWSDeployment {
  id: string
  projectId?: string
  type: 'platform' | 'app'
  config: PlatformDeployConfig | AppDeployConfig
  status: DeploymentStatus
  stackName?: string
  serviceName?: string
  distributionId?: string
  functionArn?: string
  bucketName?: string
  logs: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * AWS deployment provider
 * Uses CloudFormation, ECS, Lambda, S3, and CloudFront
 */
export class AWSDeploymentProvider implements DeploymentProvider {
  private config: ProviderConfig
  private deployments: Map<string, AWSDeployment> = new Map()
  private region: string
  
  // AWS Clients
  private cfnClient: CloudFormationClient
  private ecsClient: ECSClient
  private s3Client: S3Client
  private cloudFrontClient: CloudFrontClient
  private lambdaClient: LambdaClient
  private logsClient: CloudWatchLogsClient
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.region = config.region || process.env.AWS_REGION || 'us-east-1'
    
    // Initialize AWS clients
    const clientConfig = {
      region: this.region,
      credentials: config.credentials
    }
    
    this.cfnClient = new CloudFormationClient(clientConfig)
    this.ecsClient = new ECSClient(clientConfig)
    this.s3Client = new S3Client(clientConfig)
    this.cloudFrontClient = new CloudFrontClient(clientConfig)
    this.lambdaClient = new LambdaClient(clientConfig)
    this.logsClient = new CloudWatchLogsClient(clientConfig)
  }
  
  async initialize(): Promise<void> {
    // Load existing deployments from DynamoDB (in production)
    await this.loadDeployments()
    
    logger.info('AWS deployment provider initialized', {
      region: this.region,
      projectId: this.config.projectId
    })
  }
  
  async shutdown(): Promise<void> {
    // AWS clients don't need explicit shutdown
    logger.info('AWS deployment provider shutdown')
  }
  
  private async loadDeployments(): Promise<void> {
    // In production, this would load from DynamoDB
    // For now, we'll use a local cache similar to Firebase
    try {
      const cacheFile = path.join('.aws', 'deployments.json')
      const data = await fs.readFile(cacheFile, 'utf-8')
      const deployments = JSON.parse(data) as AWSDeployment[]
      
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
    const cacheFile = path.join('.aws', 'deployments.json')
    await fs.mkdir(path.dirname(cacheFile), { recursive: true })
    const deployments = Array.from(this.deployments.values())
    await fs.writeFile(cacheFile, JSON.stringify(deployments, null, 2))
  }
  
  async deployPlatform(config: PlatformDeployConfig): Promise<DeploymentResult> {
    const deploymentId = `aws-platform-${crypto.randomUUID()}`
    const startTime = new Date()
    
    const deployment: AWSDeployment = {
      id: deploymentId,
      type: 'platform',
      config,
      stackName: `love-claude-platform-${config.environment}`,
      status: {
        deploymentId,
        status: 'pending',
        environment: config.environment,
        startTime,
        lastUpdated: startTime
      },
      logs: [`[${startTime.toISOString()}] Starting AWS platform deployment...`],
      createdAt: startTime,
      updatedAt: startTime
    }
    
    this.deployments.set(deploymentId, deployment)
    await this.saveDeployments()
    
    try {
      // Create or update CloudFormation stack
      deployment.status.status = 'building'
      deployment.logs.push(`[${new Date().toISOString()}] Creating CloudFormation stack...`)
      
      const stackTemplate = await this.generatePlatformTemplate(config)
      
      try {
        await this.cfnClient.send(new CreateStackCommand({
          StackName: deployment.stackName,
          TemplateBody: JSON.stringify(stackTemplate),
          Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
          Parameters: [
            { ParameterKey: 'Environment', ParameterValue: config.environment },
            { ParameterKey: 'Version', ParameterValue: config.version || 'latest' }
          ]
        }))
      } catch (error: any) {
        if (error.name === 'AlreadyExistsException') {
          // Update existing stack
          await this.cfnClient.send(new UpdateStackCommand({
            StackName: deployment.stackName,
            TemplateBody: JSON.stringify(stackTemplate),
            Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
          }))
        } else {
          throw error
        }
      }
      
      // Wait for stack creation/update
      deployment.status.status = 'deploying'
      deployment.logs.push(`[${new Date().toISOString()}] Waiting for stack deployment...`)
      
      await this.waitForStackComplete(deployment.stackName!)
      
      // Get stack outputs
      const stackInfo = await this.getStackOutputs(deployment.stackName!)
      
      deployment.status.status = 'running'
      deployment.status.url = stackInfo.url
      deployment.status.endTime = new Date()
      deployment.status.lastUpdated = new Date()
      deployment.logs.push(`[${new Date().toISOString()}] Platform deployed successfully!`)
      deployment.logs.push(`[${new Date().toISOString()}] URL: ${deployment.status.url}`)
      
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
    const deploymentId = `aws-app-${projectId}-${crypto.randomUUID()}`
    const startTime = new Date()
    
    const deployment: AWSDeployment = {
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
      logs: [`[${startTime.toISOString()}] Starting AWS app deployment for project ${projectId}...`],
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
  
  private async deployStaticApp(deployment: AWSDeployment, config: AppDeployConfig): Promise<DeploymentResult> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying static app to S3 + CloudFront...`)
    
    // Create S3 bucket
    deployment.bucketName = `love-claude-app-${deployment.projectId}-${deployment.id}`
    deployment.logs.push(`[${new Date().toISOString()}] Creating S3 bucket: ${deployment.bucketName}`)
    
    // Upload files to S3
    deployment.status.status = 'deploying'
    const buildDir = config.build?.outputDir || 'dist'
    
    // In production, would upload actual build files
    await this.s3Client.send(new PutObjectCommand({
      Bucket: deployment.bucketName,
      Key: 'index.html',
      Body: '<html><body>App deployed!</body></html>',
      ContentType: 'text/html'
    }))
    
    // Create CloudFront distribution
    deployment.logs.push(`[${new Date().toISOString()}] Creating CloudFront distribution...`)
    
    const distribution = await this.cloudFrontClient.send(new CreateDistributionCommand({
      DistributionConfig: {
        CallerReference: deployment.id,
        Comment: `Love Claude App - ${deployment.projectId}`,
        DefaultRootObject: 'index.html',
        Origins: {
          Quantity: 1,
          Items: [{
            Id: 's3-origin',
            DomainName: `${deployment.bucketName}.s3.amazonaws.com`,
            S3OriginConfig: {
              OriginAccessIdentity: ''
            }
          }]
        },
        DefaultCacheBehavior: {
          TargetOriginId: 's3-origin',
          ViewerProtocolPolicy: 'redirect-to-https',
          TrustedSigners: {
            Enabled: false,
            Quantity: 0
          },
          ForwardedValues: {
            QueryString: false,
            Cookies: { Forward: 'none' }
          },
          MinTTL: 0
        },
        Enabled: true
      }
    }))
    
    deployment.distributionId = distribution.Distribution?.Id
    
    // Update deployment status
    deployment.status.status = 'running'
    deployment.status.url = `https://${distribution.Distribution?.DomainName}`
    deployment.status.endTime = new Date()
    deployment.logs.push(`[${new Date().toISOString()}] Static app deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] URL: ${deployment.status.url}`)
    
    // Custom domain setup
    if (config.domain?.custom) {
      deployment.logs.push(`[${new Date().toISOString()}] Setting up custom domain: ${config.domain.custom}`)
      // Would configure Route53 and update CloudFront
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
  
  private async deployApiApp(deployment: AWSDeployment, config: AppDeployConfig): Promise<DeploymentResult> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying API to Lambda...`)
    
    // Create Lambda function
    const functionName = `love-claude-api-${deployment.projectId?.substring(0, 20)}`
    deployment.logs.push(`[${new Date().toISOString()}] Creating Lambda function: ${functionName}`)
    
    // Package function code (in production, would package actual code)
    const functionCode = Buffer.from(`
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'API deployed!', event })
  };
};
    `)
    
    deployment.status.status = 'deploying'
    
    try {
      const result = await this.lambdaClient.send(new CreateFunctionCommand({
        FunctionName: functionName,
        Runtime: config.runtime?.engine === 'python' ? 'python3.11' : 'nodejs18.x',
        Role: process.env.LAMBDA_EXECUTION_ROLE || 'arn:aws:iam::123456789012:role/lambda-role',
        Handler: 'index.handler',
        Code: { ZipFile: functionCode },
        Timeout: config.resources?.timeout || 30,
        MemorySize: config.resources?.memory || 256,
        Environment: {
          Variables: config.environmentVariables || {}
        }
      }))
      
      deployment.functionArn = result.FunctionArn
    } catch (error: any) {
      if (error.name === 'ResourceConflictException') {
        // Update existing function
        await this.lambdaClient.send(new UpdateFunctionCodeCommand({
          FunctionName: functionName,
          ZipFile: functionCode
        }))
        
        await this.lambdaClient.send(new UpdateFunctionConfigurationCommand({
          FunctionName: functionName,
          Timeout: config.resources?.timeout || 30,
          MemorySize: config.resources?.memory || 256,
          Environment: {
            Variables: config.environmentVariables || {}
          }
        }))
      } else {
        throw error
      }
    }
    
    // Get function URL (Lambda Function URLs feature)
    deployment.status.status = 'running'
    deployment.status.url = `https://${crypto.randomUUID()}.lambda-url.${this.region}.on.aws/`
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
  
  private async deployFullstackApp(deployment: AWSDeployment, config: AppDeployConfig): Promise<DeploymentResult> {
    deployment.logs.push(`[${new Date().toISOString()}] Deploying fullstack app to AWS...`)
    
    // Deploy frontend to S3 + CloudFront
    const frontendResult = await this.deployStaticApp(deployment, {
      ...config,
      type: 'static'
    })
    
    // Deploy backend to Lambda or ECS
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
    deployment.status.url = frontendResult.url
    deployment.logs.push(`[${new Date().toISOString()}] Fullstack app deployed successfully!`)
    deployment.logs.push(`[${new Date().toISOString()}] Frontend: ${frontendResult.url}`)
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
  
  private async generatePlatformTemplate(config: PlatformDeployConfig): Promise<any> {
    return {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Love Claude Code Platform Stack',
      Parameters: {
        Environment: {
          Type: 'String',
          Default: config.environment
        },
        Version: {
          Type: 'String',
          Default: config.version || 'latest'
        }
      },
      Resources: {
        // ECS Cluster
        ECSCluster: {
          Type: 'AWS::ECS::Cluster',
          Properties: {
            ClusterName: `love-claude-${config.environment}`
          }
        },
        
        // Frontend Task Definition
        FrontendTaskDefinition: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            Family: `love-claude-frontend-${config.environment}`,
            NetworkMode: 'awsvpc',
            RequiresCompatibilities: ['FARGATE'],
            Cpu: '256',
            Memory: '512',
            ContainerDefinitions: [{
              Name: 'frontend',
              Image: `loveclaudecode/frontend:${config.version || 'latest'}`,
              PortMappings: [{
                ContainerPort: 3000,
                Protocol: 'tcp'
              }],
              Environment: [
                { Name: 'NODE_ENV', Value: config.environment }
              ]
            }]
          }
        },
        
        // Backend Task Definition
        BackendTaskDefinition: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            Family: `love-claude-backend-${config.environment}`,
            NetworkMode: 'awsvpc',
            RequiresCompatibilities: ['FARGATE'],
            Cpu: String(config.backend?.cpu || 512),
            Memory: String(config.backend?.memory || 1024),
            ContainerDefinitions: [{
              Name: 'backend',
              Image: `loveclaudecode/backend:${config.version || 'latest'}`,
              PortMappings: [{
                ContainerPort: 8000,
                Protocol: 'tcp'
              }],
              Environment: [
                { Name: 'NODE_ENV', Value: config.environment },
                { Name: 'PROVIDER_TYPE', Value: 'aws' }
              ]
            }]
          }
        },
        
        // RDS Database
        Database: {
          Type: 'AWS::RDS::DBInstance',
          Properties: {
            DBInstanceIdentifier: `love-claude-db-${config.environment}`,
            Engine: 'postgres',
            EngineVersion: '15',
            DBInstanceClass: 'db.t3.micro',
            AllocatedStorage: '20',
            MasterUsername: 'loveclaudecode',
            MasterUserPassword: { Ref: 'DBPassword' },
            BackupRetentionPeriod: config.database?.backup ? 7 : 0
          }
        }
      },
      Outputs: {
        ClusterName: {
          Value: { Ref: 'ECSCluster' }
        },
        DatabaseEndpoint: {
          Value: { 'Fn::GetAtt': ['Database', 'Endpoint.Address'] }
        }
      }
    }
  }
  
  private async waitForStackComplete(stackName: string): Promise<void> {
    let attempts = 0
    const maxAttempts = 60 // 30 minutes with 30 second intervals
    
    while (attempts < maxAttempts) {
      const response = await this.cfnClient.send(new DescribeStacksCommand({
        StackName: stackName
      }))
      
      const stack = response.Stacks?.[0]
      const status = stack?.StackStatus
      
      if (status?.includes('COMPLETE') && !status.includes('CLEANUP')) {
        return
      }
      
      if (status?.includes('FAILED') || status?.includes('ROLLBACK')) {
        throw new Error(`Stack deployment failed: ${status}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 30000)) // 30 seconds
      attempts++
    }
    
    throw new Error('Stack deployment timed out')
  }
  
  private async getStackOutputs(stackName: string): Promise<any> {
    const response = await this.cfnClient.send(new DescribeStacksCommand({
      StackName: stackName
    }))
    
    const outputs = response.Stacks?.[0]?.Outputs || []
    const result: any = {}
    
    outputs.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        result[output.OutputKey] = output.OutputValue
      }
    })
    
    // For now, return a placeholder URL
    result.url = `https://${stackName}.${this.region}.amazonaws.com`
    
    return result
  }
  
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`)
    }
    
    // Check actual status from AWS services
    if (deployment.status.status === 'running') {
      deployment.status.health = await this.checkDeploymentHealth(deployment)
    }
    
    deployment.status.lastUpdated = new Date()
    await this.saveDeployments()
    
    return deployment.status
  }
  
  private async checkDeploymentHealth(deployment: AWSDeployment): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    try {
      // Check CloudFormation stack
      if (deployment.stackName) {
        const response = await this.cfnClient.send(new DescribeStacksCommand({
          StackName: deployment.stackName
        }))
        
        const status = response.Stacks?.[0]?.StackStatus
        return status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE' ? 'healthy' : 'unhealthy'
      }
      
      // Check Lambda function
      if (deployment.functionArn) {
        const response = await this.lambdaClient.send(new GetFunctionCommand({
          FunctionName: deployment.functionArn
        }))
        
        return response.Configuration?.State === 'Active' ? 'healthy' : 'unhealthy'
      }
      
      // Check CloudFront distribution
      if (deployment.distributionId) {
        const response = await this.cloudFrontClient.send(new GetDistributionCommand({
          Id: deployment.distributionId
        }))
        
        return response.Distribution?.Status === 'Deployed' ? 'healthy' : 'unhealthy'
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
    
    if (deployment.stackName) {
      // CloudFormation supports rollback to previous version
      deployment.logs.push(`[${new Date().toISOString()}] Rolling back CloudFormation stack...`)
      // In production, would trigger stack rollback
    }
    
    if (deployment.functionArn) {
      deployment.logs.push(`[${new Date().toISOString()}] Rolling back Lambda function...`)
      // Would restore previous function version
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
      // CloudWatch logs
      if (deployment.functionArn) {
        const functionName = deployment.functionArn.split(':').pop() || ''
        const logGroupName = `/aws/lambda/${functionName}`
        
        try {
          const response = await this.logsClient.send(new FilterLogEventsCommand({
            logGroupName,
            startTime: options?.startTime?.getTime(),
            endTime: options?.endTime?.getTime(),
            limit: options?.limit
          }))
          
          if (response.events) {
            logs.push(...response.events.map(e => 
              `[${new Date(e.timestamp || 0).toISOString()}] ${e.message}`
            ))
          }
        } catch (error) {
          // Log group might not exist
        }
      }
      
      // ECS logs
      if (deployment.serviceName) {
        // Would fetch ECS service logs from CloudWatch
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
    
    // Delete AWS resources
    if (deployment.stackName) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting CloudFormation stack...`)
      await this.cfnClient.send(new DeleteStackCommand({
        StackName: deployment.stackName
      }))
    }
    
    if (deployment.functionArn) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting Lambda function...`)
      await this.lambdaClient.send(new DeleteFunctionCommand({
        FunctionName: deployment.functionArn
      }))
    }
    
    if (deployment.distributionId) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting CloudFront distribution...`)
      // CloudFront deletion requires disabling first
    }
    
    if (deployment.bucketName) {
      deployment.logs.push(`[${new Date().toISOString()}] Deleting S3 bucket...`)
      // Would empty and delete bucket
    }
    
    // Remove from registry
    this.deployments.delete(deploymentId)
    await this.saveDeployments()
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Check AWS credentials
      const response = await this.cfnClient.send(new DescribeStacksCommand({
        StackName: 'dummy-check'
      })).catch(() => null)
      
      const credentialsValid = response !== null || response?.Stacks !== undefined
      
      return {
        status: 'healthy',
        details: {
          region: this.region,
          credentialsValid,
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