import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { L2Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { LambdaFunction, S3Bucket, DynamoDBTable } from '@love-claude-code/providers'

export interface EventDrivenPipelineArgs {
  /**
   * Pipeline name
   */
  pipelineName: pulumi.Input<string>
  
  /**
   * Pipeline stages
   */
  stages: Array<{
    name: string
    type: 'transform' | 'filter' | 'aggregate' | 'enrich' | 'validate'
    handler: {
      code: pulumi.AssetOrArchive
      handler: pulumi.Input<string>
      runtime?: pulumi.Input<aws.lambda.Runtime>
      timeout?: pulumi.Input<number>
      memorySize?: pulumi.Input<number>
    }
    retryPolicy?: {
      maxAttempts?: number
      backoffRate?: number
    }
    dlq?: boolean
  }>
  
  /**
   * Input configuration
   */
  input: {
    type: 's3' | 'kinesis' | 'sqs' | 'sns' | 'eventbridge'
    config: any
  }
  
  /**
   * Output configuration
   */
  output: {
    type: 's3' | 'dynamodb' | 'kinesis' | 'sns' | 'http'
    config: any
  }
  
  /**
   * Enable monitoring dashboard
   */
  enableMonitoring?: pulumi.Input<boolean>
  
  /**
   * Enable X-Ray tracing
   */
  enableTracing?: pulumi.Input<boolean>
  
  /**
   * Batch processing configuration
   */
  batchConfig?: {
    maxBatchSize?: pulumi.Input<number>
    maxLatency?: pulumi.Input<number>
  }
  
  /**
   * Error handling strategy
   */
  errorHandling?: {
    strategy: 'retry' | 'dlq' | 'skip'
    notificationEmail?: pulumi.Input<string>
  }
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L2 construct for an event-driven data processing pipeline
 */
export class EventDrivenPipeline extends L2Construct {
  public readonly inputQueue: aws.sqs.Queue
  public readonly stages: Map<string, LambdaFunction> = new Map()
  public readonly stageQueues: Map<string, aws.sqs.Queue> = new Map()
  public readonly dlqQueues: Map<string, aws.sqs.Queue> = new Map()
  public readonly outputBucket?: S3Bucket
  public readonly outputTable?: DynamoDBTable
  public readonly dashboard?: aws.cloudwatch.Dashboard
  
  constructor(name: string, args: EventDrivenPipelineArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:patterns:L2EventDrivenPipeline', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L2',
      'love-claude-code:pattern': 'event-driven-pipeline',
      ...args.tags
    }
    
    // Create input queue
    this.inputQueue = this.createInputQueue(name, args.input, defaultTags)
    
    // Create pipeline stages
    this.createPipelineStages(name, args.stages, defaultTags)
    
    // Create output resources
    this.createOutputResources(name, args.output, defaultTags)
    
    // Wire up the pipeline
    this.connectPipeline(name, args)
    
    // Create monitoring if enabled
    if (args.enableMonitoring) {
      this.dashboard = this.createMonitoringDashboard(name, defaultTags)
    }
    
    // Apply pattern best practices
    this.applyPatternBestPractices()
    
    // Register outputs
    this.registerOutputs({
      inputQueueUrl: this.inputQueue.url,
      stages: Array.from(this.stages.keys()),
      dashboardUrl: this.dashboard?.dashboardArn
    })
  }
  
  private createInputQueue(
    name: string,
    input: EventDrivenPipelineArgs['input'],
    tags: Record<string, string>
  ): aws.sqs.Queue {
    const dlq = new aws.sqs.Queue(`${name}-input-dlq`, {
      name: `${name}-input-dlq`,
      messageRetentionSeconds: 1209600, // 14 days
      tags
    }, { parent: this })
    
    const queue = new aws.sqs.Queue(`${name}-input`, {
      name: `${name}-input`,
      visibilityTimeoutSeconds: 300,
      messageRetentionSeconds: 345600, // 4 days
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlq.arn,
        maxReceiveCount: 3
      }),
      tags
    }, { parent: this })
    
    // Configure input source
    switch (input.type) {
      case 's3':
        this.configureS3Input(name, queue, input.config, tags)
        break
      case 'kinesis':
        this.configureKinesisInput(name, queue, input.config, tags)
        break
      case 'sns':
        this.configureSnsInput(name, queue, input.config, tags)
        break
      case 'eventbridge':
        this.configureEventBridgeInput(name, queue, input.config, tags)
        break
    }
    
    return queue
  }
  
  private configureS3Input(
    name: string,
    queue: aws.sqs.Queue,
    config: any,
    tags: Record<string, string>
  ): void {
    // Create S3 bucket for input if not provided
    const bucket = config.bucketName ? 
      aws.s3.getBucket({ bucket: config.bucketName }) :
      new S3Bucket(`${name}-input-bucket`, {
        bucketName: `${name}-input-${Date.now()}`,
        enableVersioning: true,
        tags
      }, { parent: this })
    
    // Allow S3 to send messages to SQS
    const queuePolicy = new aws.sqs.QueuePolicy(`${name}-input-queue-policy`, {
      queueUrl: queue.url,
      policy: pulumi.all([queue.arn, bucket.bucketArn]).apply(([queueArn, bucketArn]) => 
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sqs:SendMessage',
            Resource: queueArn,
            Condition: {
              ArnLike: {
                'aws:SourceArn': bucketArn
              }
            }
          }]
        })
      )
    }, { parent: this })
    
    // Configure S3 event notification
    new aws.s3.BucketNotification(`${name}-input-notification`, {
      bucket: bucket.bucketName,
      queues: [{
        queueArn: queue.arn,
        events: config.events || ['s3:ObjectCreated:*'],
        filterPrefix: config.prefix,
        filterSuffix: config.suffix
      }]
    }, { parent: this, dependsOn: [queuePolicy] })
  }
  
  private configureKinesisInput(
    name: string,
    queue: aws.sqs.Queue,
    config: any,
    tags: Record<string, string>
  ): void {
    // Implementation for Kinesis input
  }
  
  private configureSnsInput(
    name: string,
    queue: aws.sqs.Queue,
    config: any,
    tags: Record<string, string>
  ): void {
    // Implementation for SNS input
  }
  
  private configureEventBridgeInput(
    name: string,
    queue: aws.sqs.Queue,
    config: any,
    tags: Record<string, string>
  ): void {
    // Implementation for EventBridge input
  }
  
  private createPipelineStages(
    name: string,
    stages: EventDrivenPipelineArgs['stages'],
    tags: Record<string, string>
  ): void {
    stages.forEach((stage, index) => {
      // Create DLQ if enabled
      let dlq: aws.sqs.Queue | undefined
      if (stage.dlq) {
        dlq = new aws.sqs.Queue(`${name}-${stage.name}-dlq`, {
          name: `${name}-${stage.name}-dlq`,
          messageRetentionSeconds: 1209600, // 14 days
          tags
        }, { parent: this })
        this.dlqQueues.set(stage.name, dlq)
      }
      
      // Create stage queue
      const stageQueue = new aws.sqs.Queue(`${name}-${stage.name}-queue`, {
        name: `${name}-${stage.name}`,
        visibilityTimeoutSeconds: (stage.handler.timeout || 60) * 6,
        messageRetentionSeconds: 345600, // 4 days
        redrivePolicy: dlq ? JSON.stringify({
          deadLetterTargetArn: dlq.arn,
          maxReceiveCount: stage.retryPolicy?.maxAttempts || 3
        }) : undefined,
        tags
      }, { parent: this })
      this.stageQueues.set(stage.name, stageQueue)
      
      // Create Lambda function
      const lambda = new LambdaFunction(`${name}-${stage.name}`, {
        functionName: `${name}-${stage.name}`,
        runtime: stage.handler.runtime || 'nodejs18.x',
        handler: stage.handler.handler,
        code: stage.handler.code,
        timeout: stage.handler.timeout || 60,
        memorySize: stage.handler.memorySize || 512,
        environment: {
          STAGE_NAME: stage.name,
          STAGE_TYPE: stage.type,
          NEXT_QUEUE_URL: index < stages.length - 1 ? 
            pulumi.interpolate`${this.stageQueues.get(stages[index + 1].name)?.url}` : 
            'OUTPUT'
        },
        tracingConfig: args.enableTracing ? 'Active' : undefined,
        reservedConcurrentExecutions: 100,
        tags
      }, { parent: this })
      
      this.stages.set(stage.name, lambda)
      
      // Configure Lambda to process from queue
      new aws.lambda.EventSourceMapping(`${name}-${stage.name}-trigger`, {
        eventSourceArn: stageQueue.arn,
        functionName: lambda.functionName,
        batchSize: args.batchConfig?.maxBatchSize || 10,
        maximumBatchingWindowInSeconds: args.batchConfig?.maxLatency
      }, { parent: this })
      
      // Grant Lambda permissions to read from queue and write to next queue
      this.grantQueuePermissions(lambda, stageQueue, stages, index)
    })
  }
  
  private grantQueuePermissions(
    lambda: LambdaFunction,
    currentQueue: aws.sqs.Queue,
    stages: EventDrivenPipelineArgs['stages'],
    currentIndex: number
  ): void {
    // Grant read permissions for current queue
    const readPolicy = new aws.iam.Policy(`${lambda.function.name}-sqs-read`, {
      policy: pulumi.output({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'sqs:ReceiveMessage',
            'sqs:DeleteMessage',
            'sqs:GetQueueAttributes'
          ],
          Resource: currentQueue.arn
        }]
      }).apply(JSON.stringify)
    }, { parent: this })
    
    new aws.iam.RolePolicyAttachment(`${lambda.function.name}-sqs-read-attach`, {
      role: lambda.role,
      policyArn: readPolicy.arn
    }, { parent: this })
    
    // Grant write permissions for next queue
    if (currentIndex < stages.length - 1) {
      const nextQueue = this.stageQueues.get(stages[currentIndex + 1].name)
      if (nextQueue) {
        const writePolicy = new aws.iam.Policy(`${lambda.function.name}-sqs-write`, {
          policy: pulumi.output({
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: nextQueue.arn
            }]
          }).apply(JSON.stringify)
        }, { parent: this })
        
        new aws.iam.RolePolicyAttachment(`${lambda.function.name}-sqs-write-attach`, {
          role: lambda.role,
          policyArn: writePolicy.arn
        }, { parent: this })
      }
    }
  }
  
  private createOutputResources(
    name: string,
    output: EventDrivenPipelineArgs['output'],
    tags: Record<string, string>
  ): void {
    switch (output.type) {
      case 's3':
        this.outputBucket = new S3Bucket(`${name}-output`, {
          bucketName: output.config.bucketName || `${name}-output-${Date.now()}`,
          enableVersioning: true,
          lifecycleRules: output.config.lifecycleRules,
          tags
        }, { parent: this })
        break
        
      case 'dynamodb':
        this.outputTable = new DynamoDBTable(`${name}-output`, {
          tableName: output.config.tableName || `${name}-output`,
          partitionKey: output.config.partitionKey,
          sortKey: output.config.sortKey,
          billingMode: 'PAY_PER_REQUEST',
          streamEnabled: true,
          tags
        }, { parent: this })
        break
    }
  }
  
  private connectPipeline(name: string, args: EventDrivenPipelineArgs): void {
    // Connect input to first stage
    if (args.stages.length > 0) {
      const firstStageQueue = this.stageQueues.get(args.stages[0].name)
      if (firstStageQueue) {
        // Create Lambda to move messages from input to first stage
        const connector = new LambdaFunction(`${name}-input-connector`, {
          functionName: `${name}-input-connector`,
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          code: new pulumi.asset.AssetArchive({
            'index.js': new pulumi.asset.StringAsset(`
              const AWS = require('aws-sdk');
              const sqs = new AWS.SQS();
              
              exports.handler = async (event) => {
                const targetQueueUrl = process.env.TARGET_QUEUE_URL;
                
                for (const record of event.Records) {
                  await sqs.sendMessage({
                    QueueUrl: targetQueueUrl,
                    MessageBody: record.body
                  }).promise();
                }
              };
            `)
          }),
          timeout: 60,
          environment: {
            TARGET_QUEUE_URL: firstStageQueue.url
          },
          tags: defaultTags
        }, { parent: this })
        
        new aws.lambda.EventSourceMapping(`${name}-input-connector-trigger`, {
          eventSourceArn: this.inputQueue.arn,
          functionName: connector.functionName,
          batchSize: 10
        }, { parent: this })
      }
    }
    
    // Connect last stage to output
    const lastStage = args.stages[args.stages.length - 1]
    const lastLambda = this.stages.get(lastStage.name)
    if (lastLambda) {
      this.grantOutputPermissions(lastLambda, args.output)
    }
  }
  
  private grantOutputPermissions(
    lambda: LambdaFunction,
    output: EventDrivenPipelineArgs['output']
  ): void {
    switch (output.type) {
      case 's3':
        if (this.outputBucket) {
          const s3Policy = new aws.iam.Policy(`${lambda.function.name}-s3-write`, {
            policy: pulumi.output({
              Version: '2012-10-17',
              Statement: [{
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: pulumi.interpolate`${this.outputBucket.bucketArn}/*`
              }]
            }).apply(JSON.stringify)
          }, { parent: this })
          
          new aws.iam.RolePolicyAttachment(`${lambda.function.name}-s3-write-attach`, {
            role: lambda.role,
            policyArn: s3Policy.arn
          }, { parent: this })
        }
        break
        
      case 'dynamodb':
        if (this.outputTable) {
          const dynamoPolicy = new aws.iam.Policy(`${lambda.function.name}-dynamo-write`, {
            policy: pulumi.output({
              Version: '2012-10-17',
              Statement: [{
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:BatchWriteItem'
                ],
                Resource: this.outputTable.tableArn
              }]
            }).apply(JSON.stringify)
          }, { parent: this })
          
          new aws.iam.RolePolicyAttachment(`${lambda.function.name}-dynamo-write-attach`, {
            role: lambda.role,
            policyArn: dynamoPolicy.arn
          }, { parent: this })
        }
        break
    }
  }
  
  private createMonitoringDashboard(
    name: string,
    tags: Record<string, string>
  ): aws.cloudwatch.Dashboard {
    const widgets = [
      // Pipeline overview
      {
        type: 'metric',
        properties: {
          metrics: Array.from(this.stages.keys()).map(stageName => [
            'AWS/Lambda',
            'Invocations',
            'FunctionName',
            `${name}-${stageName}`
          ]),
          period: 300,
          stat: 'Sum',
          region: aws.getRegion().then(r => r.name),
          title: 'Pipeline Stage Invocations'
        }
      },
      // Error rates
      {
        type: 'metric',
        properties: {
          metrics: Array.from(this.stages.keys()).map(stageName => [
            'AWS/Lambda',
            'Errors',
            'FunctionName',
            `${name}-${stageName}`
          ]),
          period: 300,
          stat: 'Sum',
          region: aws.getRegion().then(r => r.name),
          title: 'Pipeline Stage Errors'
        }
      },
      // Queue depths
      {
        type: 'metric',
        properties: {
          metrics: Array.from(this.stageQueues.entries()).map(([stageName, queue]) => [
            'AWS/SQS',
            'ApproximateNumberOfMessagesVisible',
            'QueueName',
            `${name}-${stageName}`
          ]),
          period: 300,
          stat: 'Average',
          region: aws.getRegion().then(r => r.name),
          title: 'Queue Depths'
        }
      }
    ]
    
    return new aws.cloudwatch.Dashboard(`${name}-dashboard`, {
      dashboardName: `${name}-pipeline-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: widgets.map((widget, index) => ({
          ...widget,
          x: (index % 2) * 12,
          y: Math.floor(index / 2) * 6,
          width: 12,
          height: 6
        }))
      })
    }, { parent: this })
  }
  
  protected applyPatternBestPractices(): void {
    this.patternConsiderations = [
      {
        pattern: 'Event-Driven Pipeline',
        description: 'Scalable data processing pipeline with SQS and Lambda',
        benefits: [
          'Decoupled architecture',
          'Independent scaling of stages',
          'Built-in retry and error handling',
          'Pay-per-use pricing',
          'Easy to add/remove stages'
        ],
        tradeoffs: [
          'Added latency between stages',
          'Complex debugging across services',
          'SQS message size limits',
          'Potential for message duplication'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l2-event-driven-pipeline',
      level: ConstructLevel.L2,
      name: 'Event-Driven Pipeline Pattern',
      description: 'Scalable event-driven data processing pipeline',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'data-processing',
      tags: ['aws', 'sqs', 'lambda', 'pipeline', 'event-driven', 'pattern'],
      providers: [CloudProvider.AWS]
    }
  }
}