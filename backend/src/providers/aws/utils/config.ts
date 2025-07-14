import { ProviderConfig } from '../../types.js'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { fromEnv, fromIni } from '@aws-sdk/credential-providers'

export interface AWSConfig extends ProviderConfig {
  type: 'aws'
  region: string
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  endpoints?: {
    dynamodb?: string
    s3?: string
    cognito?: string
    lambda?: string
    appsync?: string
    ses?: string
    sns?: string
    cloudwatch?: string
  }
  options: {
    // DynamoDB options
    dynamoTablePrefix?: string
    dynamoReadCapacity?: number
    dynamoWriteCapacity?: number
    dynamoOnDemand?: boolean
    
    // S3 options
    s3BucketPrefix?: string
    s3StorageClass?: 'STANDARD' | 'STANDARD_IA' | 'GLACIER' | 'DEEP_ARCHIVE'
    s3Encryption?: 'AES256' | 'aws:kms'
    s3KmsKeyId?: string
    
    // Cognito options
    cognitoUserPoolId?: string
    cognitoClientId?: string
    cognitoIdentityPoolId?: string
    
    // Lambda options
    lambdaFunctionPrefix?: string
    lambdaTimeout?: number
    lambdaMemorySize?: number
    
    // AppSync options
    appsyncApiId?: string
    appsyncApiUrl?: string
    
    // Monitoring options
    enableXRay?: boolean
    enableCloudWatch?: boolean
    cloudWatchNamespace?: string
    
    // Performance options
    maxRetries?: number
    retryMode?: 'standard' | 'adaptive'
    connectionTimeout?: number
    requestTimeout?: number
    
    // Caching options
    enableCache?: boolean
    cacheEndpoint?: string
    cacheTTL?: number
  }
}

export async function validateAWSConfig(config: ProviderConfig): Promise<AWSConfig> {
  // Ensure it's an AWS config
  if (config.type !== 'aws') {
    throw new Error('Invalid provider type for AWS provider')
  }
  
  // Set defaults
  const awsConfig: AWSConfig = {
    ...config,
    type: 'aws',
    region: config.region || process.env.AWS_REGION || 'us-east-1',
    options: {
      // DynamoDB defaults
      dynamoTablePrefix: config.options?.dynamoTablePrefix || `love-claude-${config.projectId}-`,
      dynamoOnDemand: config.options?.dynamoOnDemand ?? true,
      dynamoReadCapacity: config.options?.dynamoReadCapacity || 5,
      dynamoWriteCapacity: config.options?.dynamoWriteCapacity || 5,
      
      // S3 defaults
      s3BucketPrefix: config.options?.s3BucketPrefix || `love-claude-${config.projectId}-`,
      s3StorageClass: config.options?.s3StorageClass || 'STANDARD',
      s3Encryption: config.options?.s3Encryption || 'AES256',
      
      // Lambda defaults
      lambdaFunctionPrefix: config.options?.lambdaFunctionPrefix || `love-claude-${config.projectId}-`,
      lambdaTimeout: config.options?.lambdaTimeout || 30000,
      lambdaMemorySize: config.options?.lambdaMemorySize || 512,
      
      // Performance defaults
      maxRetries: config.options?.maxRetries || 3,
      retryMode: config.options?.retryMode || 'adaptive',
      connectionTimeout: config.options?.connectionTimeout || 5000,
      requestTimeout: config.options?.requestTimeout || 30000,
      
      // Monitoring defaults
      enableXRay: config.options?.enableXRay ?? true,
      enableCloudWatch: config.options?.enableCloudWatch ?? true,
      cloudWatchNamespace: config.options?.cloudWatchNamespace || 'LoveClaudeCode',
      
      // Caching defaults
      enableCache: config.options?.enableCache ?? true,
      cacheTTL: config.options?.cacheTTL || 300, // 5 minutes
      
      ...config.options
    }
  }
  
  // Load credentials if not provided
  if (!awsConfig.credentials) {
    try {
      // Try environment variables first
      const envCreds = fromEnv()
      awsConfig.credentials = await envCreds()
    } catch {
      try {
        // Fall back to AWS profile
        const profileCreds = fromIni()
        awsConfig.credentials = await profileCreds()
      } catch (error) {
        throw new Error('AWS credentials not found. Please provide credentials or configure AWS SDK.')
      }
    }
  }
  
  // Validate credentials by making a test call
  try {
    const sts = new STSClient({
      region: awsConfig.region,
      credentials: awsConfig.credentials
    })
    await sts.send(new GetCallerIdentityCommand({}))
  } catch (error) {
    throw new Error(`Invalid AWS credentials: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return awsConfig
}

export function getAWSClientConfig(config: AWSConfig) {
  return {
    region: config.region,
    credentials: config.credentials,
    maxAttempts: config.options.maxRetries,
    retryMode: config.options.retryMode,
    requestHandler: {
      connectionTimeout: config.options.connectionTimeout,
      requestTimeout: config.options.requestTimeout,
    }
  }
}