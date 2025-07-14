import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { L1Construct, SecurityConsideration, CostModel } from '@love-claude-code/core'
import { ConstructLevel, CloudProvider } from '@love-claude-code/core'

export interface LambdaFunctionArgs {
  /**
   * Function name
   */
  functionName?: pulumi.Input<string>
  
  /**
   * Runtime
   */
  runtime: pulumi.Input<aws.lambda.Runtime>
  
  /**
   * Handler
   */
  handler: pulumi.Input<string>
  
  /**
   * Function code
   */
  code: pulumi.AssetOrArchive
  
  /**
   * Memory size in MB
   */
  memorySize?: pulumi.Input<number>
  
  /**
   * Timeout in seconds
   */
  timeout?: pulumi.Input<number>
  
  /**
   * Environment variables
   */
  environment?: pulumi.Input<Record<string, string>>
  
  /**
   * VPC configuration
   */
  vpcConfig?: {
    subnetIds: pulumi.Input<string[]>
    securityGroupIds: pulumi.Input<string[]>
  }
  
  /**
   * Dead letter queue configuration
   */
  deadLetterConfig?: {
    targetArn: pulumi.Input<string>
  }
  
  /**
   * Tracing configuration
   */
  tracingConfig?: pulumi.Input<'Active' | 'PassThrough'>
  
  /**
   * Reserved concurrent executions
   */
  reservedConcurrentExecutions?: pulumi.Input<number>
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L1 construct for AWS Lambda function with security best practices
 */
export class LambdaFunction extends L1Construct {
  public readonly function: aws.lambda.Function
  public readonly role: aws.iam.Role
  public readonly functionArn: pulumi.Output<string>
  public readonly functionName: pulumi.Output<string>
  public readonly invokeArn: pulumi.Output<string>
  
  constructor(name: string, args: LambdaFunctionArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:lambda:L1Function', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L1',
      'love-claude-code:provider': 'aws',
      'love-claude-code:resource': 'lambda-function',
      ...args.tags
    }
    
    // Create execution role with least privilege
    this.role = new aws.iam.Role(`${name}-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          }
        }]
      }),
      tags: defaultTags
    }, { parent: this })
    
    // Attach basic execution policy
    new aws.iam.RolePolicyAttachment(`${name}-basic-execution`, {
      role: this.role,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }, { parent: this })
    
    // If VPC config provided, attach VPC execution policy
    if (args.vpcConfig) {
      new aws.iam.RolePolicyAttachment(`${name}-vpc-execution`, {
        role: this.role,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      }, { parent: this })
    }
    
    // If tracing enabled, attach X-Ray policy
    if (args.tracingConfig) {
      new aws.iam.RolePolicyAttachment(`${name}-xray`, {
        role: this.role,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      }, { parent: this })
    }
    
    // Create the Lambda function
    this.function = new aws.lambda.Function(`${name}-function`, {
      name: args.functionName,
      runtime: args.runtime,
      handler: args.handler,
      code: args.code,
      role: this.role.arn,
      
      // Configuration
      memorySize: args.memorySize || 256,
      timeout: args.timeout || 60,
      environment: args.environment ? {
        variables: args.environment
      } : undefined,
      
      // VPC configuration
      vpcConfig: args.vpcConfig ? {
        subnetIds: args.vpcConfig.subnetIds,
        securityGroupIds: args.vpcConfig.securityGroupIds
      } : undefined,
      
      // Dead letter queue
      deadLetterConfig: args.deadLetterConfig,
      
      // Tracing
      tracingConfig: args.tracingConfig ? {
        mode: args.tracingConfig
      } : undefined,
      
      // Concurrency
      reservedConcurrentExecutions: args.reservedConcurrentExecutions,
      
      tags: defaultTags
    }, { parent: this })
    
    // Apply security best practices
    this.applySecurityBestPractices()
    
    // Set outputs
    this.functionArn = this.function.arn
    this.functionName = this.function.name
    this.invokeArn = this.function.invokeArn
    
    // Register outputs
    this.registerOutputs({
      functionArn: this.functionArn,
      functionName: this.functionName,
      invokeArn: this.invokeArn,
      roleArn: this.role.arn
    })
  }
  
  protected applySecurityBestPractices(): void {
    this.securityConsiderations = [
      {
        type: 'access-control',
        description: 'Least privilege IAM role',
        recommendation: 'Add only necessary permissions to the execution role'
      },
      {
        type: 'monitoring',
        description: 'CloudWatch Logs enabled by default',
        recommendation: 'Enable X-Ray tracing and set up CloudWatch alarms'
      },
      {
        type: 'network',
        description: 'Optional VPC configuration',
        recommendation: 'Use VPC for functions that need private resource access'
      },
      {
        type: 'resilience',
        description: 'Dead letter queue support',
        recommendation: 'Configure DLQ for error handling and retry logic'
      }
    ]
  }
  
  public getCostModel(): CostModel {
    return {
      provider: CloudProvider.AWS,
      service: 'Lambda',
      baseCost: 0,
      usage: {
        requests: {
          cost: 0.20, // Per 1 million requests
          unit: 'million requests'
        },
        compute: {
          cost: 0.0000166667, // Per GB-second
          unit: 'GB-second'
        }
      }
    }
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l1-lambda-function',
      level: ConstructLevel.L1,
      name: 'AWS Lambda Function',
      description: 'Secure Lambda function with monitoring and error handling',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'compute',
      tags: ['aws', 'lambda', 'serverless', 'function', 'compute'],
      providers: [CloudProvider.AWS]
    }
  }
  
  /**
   * Grant invoke permissions to a principal
   */
  public grantInvoke(principal: aws.iam.IPrincipal): void {
    const policy = new aws.iam.Policy(`${this.function.name}-invoke-policy`, {
      policy: pulumi.output({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: 'lambda:InvokeFunction',
          Resource: this.function.arn
        }]
      }).apply(JSON.stringify)
    }, { parent: this })
    
    if (principal instanceof aws.iam.Role) {
      new aws.iam.RolePolicyAttachment(`${this.function.name}-invoke-attachment`, {
        role: principal,
        policyArn: policy.arn
      }, { parent: this })
    }
  }
}