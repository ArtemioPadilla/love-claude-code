import {
  LambdaClient,
  InvokeCommand,
  InvokeAsyncCommand,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  GetFunctionCommand,
  ListFunctionsCommand,
  DeleteFunctionCommand,
  PutFunctionConcurrencyCommand,
  InvocationType,
  Runtime,
  LogType
} from '@aws-sdk/client-lambda'
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  DescribeLogStreamsCommand
} from '@aws-sdk/client-cloudwatch-logs'
import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
  DeleteRuleCommand,
  RemoveTargetsCommand
} from '@aws-sdk/client-eventbridge'
import {
  FunctionProvider,
  InvokeOptions,
  LogOptions,
  LogEntry
} from '../types.js'
import { AWSConfig, getAWSClientConfig } from './utils/config.js'
import { MetricsCollector, trackPerformance } from './utils/metrics.js'
import { logger } from './utils/logger.js'
import { withRetry, CircuitBreaker } from './utils/retry.js'
import { CacheManager } from './utils/cache.js'
import { v4 as uuidv4 } from 'uuid'
import AdmZip from 'adm-zip'

export class AWSFunctionProvider implements FunctionProvider {
  private lambdaClient: LambdaClient
  private logsClient: CloudWatchLogsClient
  private eventBridgeClient: EventBridgeClient
  private functionPrefix: string
  private cache: CacheManager
  private circuitBreaker: CircuitBreaker
  private roleArn?: string
  
  constructor(
    private config: AWSConfig,
    private metrics: MetricsCollector
  ) {
    this.lambdaClient = new LambdaClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.lambda
    })
    
    this.logsClient = new CloudWatchLogsClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.cloudwatch
    })
    
    this.eventBridgeClient = new EventBridgeClient({
      ...getAWSClientConfig(config)
    })
    
    this.functionPrefix = config.options.lambdaFunctionPrefix || ''
    this.cache = new CacheManager(config)
    this.circuitBreaker = new CircuitBreaker()
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // Get or create IAM role for Lambda execution
    // In production, this should be pre-created via IaC
    this.roleArn = process.env.LAMBDA_ROLE_ARN || 
      `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/love-claude-lambda-role`
    
    logger.info('AWS Functions provider initialized', {
      functionPrefix: this.functionPrefix,
      timeout: this.config.options.lambdaTimeout,
      memorySize: this.config.options.lambdaMemorySize
    })
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  private getFunctionName(name: string): string {
    return `${this.functionPrefix}${name}`
  }
  
  private async ensureFunction(name: string, code?: Buffer): Promise<void> {
    const functionName = this.getFunctionName(name)
    
    try {
      await this.lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }))
      
      // Function exists, update code if provided
      if (code) {
        await this.lambdaClient.send(new UpdateFunctionCodeCommand({
          FunctionName: functionName,
          ZipFile: code
        }))
      }
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException' && code) {
        // Create function
        await this.createFunction(functionName, code)
      } else {
        throw error
      }
    }
  }
  
  private async createFunction(functionName: string, code: Buffer): Promise<void> {
    await this.lambdaClient.send(new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: Runtime.nodejs18x,
      Role: this.roleArn!,
      Handler: 'index.handler',
      Code: { ZipFile: code },
      Timeout: Math.floor((this.config.options.lambdaTimeout || 30000) / 1000),
      MemorySize: this.config.options.lambdaMemorySize || 512,
      Environment: {
        Variables: {
          NODE_ENV: process.env.NODE_ENV || 'production',
          PROJECT_ID: this.config.projectId
        }
      },
      TracingConfig: {
        Mode: this.config.options.enableXRay ? 'Active' : 'PassThrough'
      }
    }))
    
    // Set reserved concurrent executions to prevent runaway costs
    await this.lambdaClient.send(new PutFunctionConcurrencyCommand({
      FunctionName: functionName,
      ReservedConcurrentExecutions: 100
    }))
    
    logger.info(`Created Lambda function: ${functionName}`)
  }
  
  @trackPerformance
  async invoke(name: string, payload: any, options?: InvokeOptions): Promise<any> {
    const functionName = this.getFunctionName(name)
    
    // Check cache for idempotent requests
    const cacheKey = `invoke:${functionName}:${JSON.stringify(payload)}`
    if (options?.retries === 0) { // Only cache if no retries (idempotent)
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: InvocationType.RequestResponse,
      LogType: LogType.Tail,
      Payload: JSON.stringify(payload)
    })
    
    const startTime = Date.now()
    
    try {
      const response = await this.circuitBreaker.execute(() =>
        withRetry(
          () => this.lambdaClient.send(command),
          options?.retries ?? this.config.options.maxRetries
        )
      )
      
      if (response.StatusCode !== 200) {
        throw new Error(`Lambda invocation failed with status ${response.StatusCode}`)
      }
      
      if (response.FunctionError) {
        const errorPayload = JSON.parse(new TextDecoder().decode(response.Payload))
        throw new Error(errorPayload.errorMessage || 'Lambda function error')
      }
      
      const result = response.Payload ? 
        JSON.parse(new TextDecoder().decode(response.Payload)) : null
      
      // Log execution metrics
      if (response.LogResult) {
        const logs = Buffer.from(response.LogResult, 'base64').toString()
        const duration = logs.match(/Duration: (\d+\.\d+) ms/)?.[1]
        const memory = logs.match(/Max Memory Used: (\d+) MB/)?.[1]
        
        if (duration) {
          await this.metrics.record({
            name: 'LambdaDuration',
            value: parseFloat(duration),
            unit: 'Milliseconds',
            dimensions: { FunctionName: functionName }
          })
        }
        
        if (memory) {
          await this.metrics.record({
            name: 'LambdaMemoryUsed',
            value: parseInt(memory),
            unit: 'Bytes',
            dimensions: { FunctionName: functionName }
          })
        }
      }
      
      // Cache result if idempotent
      if (options?.retries === 0) {
        await this.cache.set(cacheKey, result, 300) // 5 minutes
      }
      
      return result
    } catch (error) {
      logger.error('Lambda invocation failed', {
        functionName,
        duration: Date.now() - startTime,
        error
      })
      throw error
    }
  }
  
  @trackPerformance
  async invokeAsync(name: string, payload: any): Promise<{ id: string }> {
    const functionName = this.getFunctionName(name)
    const invocationId = uuidv4()
    
    const command = new InvokeAsyncCommand({
      FunctionName: functionName,
      InvokeArgs: JSON.stringify({
        ...payload,
        _invocationId: invocationId
      })
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.lambdaClient.send(command), this.config.options.maxRetries)
    )
    
    if (response.Status !== 202) {
      throw new Error(`Async invocation failed with status ${response.Status}`)
    }
    
    return { id: invocationId }
  }
  
  @trackPerformance
  async schedule(name: string, schedule: string, payload?: any): Promise<{ id: string }> {
    const functionName = this.getFunctionName(name)
    const ruleName = `${functionName}-schedule-${uuidv4()}`
    
    // Create EventBridge rule
    await this.eventBridgeClient.send(new PutRuleCommand({
      Name: ruleName,
      ScheduleExpression: schedule, // e.g., "rate(5 minutes)" or "cron(0 12 * * ? *)"
      State: 'ENABLED',
      Description: `Scheduled invocation for ${functionName}`
    }))
    
    // Add Lambda as target
    await this.eventBridgeClient.send(new PutTargetsCommand({
      Rule: ruleName,
      Targets: [{
        Id: '1',
        Arn: `arn:aws:lambda:${this.config.region}:${process.env.AWS_ACCOUNT_ID}:function:${functionName}`,
        Input: JSON.stringify(payload || {})
      }]
    }))
    
    // Store schedule info
    await this.cache.set(`schedule:${ruleName}`, {
      functionName,
      schedule,
      payload,
      createdAt: new Date()
    }, 86400) // 24 hours
    
    return { id: ruleName }
  }
  
  @trackPerformance
  async unschedule(id: string): Promise<void> {
    // Remove targets first
    await this.eventBridgeClient.send(new RemoveTargetsCommand({
      Rule: id,
      Ids: ['1']
    }))
    
    // Delete rule
    await this.eventBridgeClient.send(new DeleteRuleCommand({
      Name: id
    }))
    
    // Clear cache
    await this.cache.delete(`schedule:${id}`)
  }
  
  @trackPerformance
  async getLogs(name: string, options?: LogOptions): Promise<LogEntry[]> {
    const functionName = this.getFunctionName(name)
    const logGroupName = `/aws/lambda/${functionName}`
    
    try {
      // Get latest log stream
      const streamsResponse = await this.logsClient.send(new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1
      }))
      
      if (!streamsResponse.logStreams?.length) {
        return []
      }
      
      const logStreamName = streamsResponse.logStreams[0].logStreamName!
      
      // Get log events
      const eventsResponse = await this.logsClient.send(new GetLogEventsCommand({
        logGroupName,
        logStreamName,
        startTime: options?.startTime?.getTime(),
        endTime: options?.endTime?.getTime(),
        limit: options?.limit || 100,
        filterPattern: options?.filter
      }))
      
      return (eventsResponse.events || []).map(event => ({
        timestamp: new Date(event.timestamp!),
        level: this.extractLogLevel(event.message || ''),
        message: event.message || '',
        metadata: {
          logStreamName,
          ingestionTime: event.ingestionTime
        }
      }))
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return []
      }
      throw error
    }
  }
  
  private extractLogLevel(message: string): LogEntry['level'] {
    if (message.includes('[ERROR]') || message.includes('ERROR')) return 'error'
    if (message.includes('[WARN]') || message.includes('WARNING')) return 'warn'
    if (message.includes('[DEBUG]') || message.includes('DEBUG')) return 'debug'
    return 'info'
  }
  
  // Helper method to create deployment package
  async createDeploymentPackage(name: string, code: string, handler: string = 'index.handler'): Promise<void> {
    const zip = new AdmZip()
    
    // Add main handler file
    zip.addFile('index.js', Buffer.from(code))
    
    // Add basic package.json
    zip.addFile('package.json', Buffer.from(JSON.stringify({
      name: name,
      version: '1.0.0',
      main: 'index.js'
    }, null, 2)))
    
    const zipBuffer = zip.toBuffer()
    
    // Ensure function exists or create it
    await this.ensureFunction(name, zipBuffer)
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // List functions to test connection
      const response = await this.lambdaClient.send(new ListFunctionsCommand({
        MaxItems: 1
      }))
      
      return {
        status: 'healthy',
        details: {
          functionPrefix: this.functionPrefix,
          functionsCount: response.Functions?.length || 0,
          cacheStatus: await this.cache.healthCheck(),
          circuitBreaker: this.circuitBreaker.status
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}