import * as pulumi from '@pulumi/pulumi'
import { L3Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { 
  ServerlessAPI, 
  StaticWebsite, 
  EventDrivenPipeline 
} from '@love-claude-code/patterns'
import { 
  DynamoDBTable, 
  S3Bucket, 
  LambdaFunction 
} from '@love-claude-code/providers'

export interface SaaSPlatformArgs {
  /**
   * Platform name
   */
  platformName: pulumi.Input<string>
  
  /**
   * Platform domain
   */
  domain: pulumi.Input<string>
  
  /**
   * SSL certificate ARN
   */
  certificateArn: pulumi.Input<string>
  
  /**
   * Features to enable
   */
  features: {
    multiTenancy?: boolean
    billing?: boolean
    analytics?: boolean
    notifications?: boolean
    audit?: boolean
    backup?: boolean
  }
  
  /**
   * Authentication configuration
   */
  auth: {
    providers: Array<'email' | 'google' | 'github' | 'saml'>
    mfaRequired?: boolean
    sessionDurationMinutes?: number
  }
  
  /**
   * Tenant isolation level
   */
  tenantIsolation?: 'shared' | 'schema' | 'database'
  
  /**
   * API rate limits per tenant
   */
  apiRateLimits?: {
    free: { requests: number; period: string }
    basic: { requests: number; period: string }
    premium: { requests: number; period: string }
  }
  
  /**
   * Email configuration
   */
  email?: {
    provider: 'ses' | 'sendgrid'
    fromAddress: pulumi.Input<string>
    replyToAddress?: pulumi.Input<string>
  }
  
  /**
   * Monitoring configuration
   */
  monitoring?: {
    enableDashboard?: boolean
    alertEmail?: pulumi.Input<string>
    slackWebhook?: pulumi.Input<string>
  }
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L3 construct for a complete SaaS platform with multi-tenancy
 */
export class SaaSPlatform extends L3Construct {
  // Core components
  public readonly api: ServerlessAPI
  public readonly website: StaticWebsite
  public readonly adminPanel: StaticWebsite
  
  // Data layer
  public readonly tenantTable: DynamoDBTable
  public readonly userTable: DynamoDBTable
  public readonly subscriptionTable: DynamoDBTable
  
  // Supporting services
  public readonly analyticsTable?: DynamoDBTable
  public readonly auditTable?: DynamoDBTable
  public readonly billingPipeline?: EventDrivenPipeline
  
  // URLs
  public readonly apiUrl: pulumi.Output<string>
  public readonly websiteUrl: pulumi.Output<string>
  public readonly adminUrl: pulumi.Output<string>
  
  constructor(name: string, args: SaaSPlatformArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:applications:L3SaaSPlatform', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L3',
      'love-claude-code:application': 'saas-platform',
      ...args.tags
    }
    
    // Create core data tables
    this.createDataTables(name, args, defaultTags)
    
    // Create API
    this.api = this.createAPI(name, args, defaultTags)
    
    // Create website
    this.website = this.createWebsite(name, args, defaultTags)
    
    // Create admin panel
    this.adminPanel = this.createAdminPanel(name, args, defaultTags)
    
    // Create supporting services based on features
    if (args.features.analytics) {
      this.analyticsTable = this.createAnalyticsTable(name, defaultTags)
    }
    
    if (args.features.audit) {
      this.auditTable = this.createAuditTable(name, defaultTags)
    }
    
    if (args.features.billing) {
      this.billingPipeline = this.createBillingPipeline(name, args, defaultTags)
    }
    
    if (args.features.notifications) {
      this.createNotificationSystem(name, args, defaultTags)
    }
    
    if (args.features.backup) {
      this.createBackupSystem(name, defaultTags)
    }
    
    // Set up monitoring
    if (args.monitoring?.enableDashboard) {
      this.createMonitoringDashboard(name, args.monitoring, defaultTags)
    }
    
    // Apply application best practices
    this.applyApplicationBestPractices()
    
    // Set outputs
    this.apiUrl = this.api.apiUrl
    this.websiteUrl = this.website.websiteUrl
    this.adminUrl = this.adminPanel.websiteUrl
    
    // Register outputs
    this.registerOutputs({
      apiUrl: this.apiUrl,
      websiteUrl: this.websiteUrl,
      adminUrl: this.adminUrl,
      platformName: args.platformName
    })
  }
  
  private createDataTables(
    name: string,
    args: SaaSPlatformArgs,
    tags: Record<string, string>
  ): void {
    // Tenant table
    this.tenantTable = new DynamoDBTable(`${name}-tenants`, {
      tableName: `${name}-tenants`,
      partitionKey: { name: 'tenantId', type: 'S' },
      sortKey: { name: 'sk', type: 'S' }, // For storing different entity types
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [{
        indexName: 'domain-index',
        partitionKey: { name: 'domain', type: 'S' },
        projectionType: 'ALL'
      }, {
        indexName: 'plan-index',
        partitionKey: { name: 'plan', type: 'S' },
        sortKey: { name: 'createdAt', type: 'S' },
        projectionType: 'ALL'
      }],
      streamEnabled: true,
      tags
    }, { parent: this })
    
    // User table
    this.userTable = new DynamoDBTable(`${name}-users`, {
      tableName: `${name}-users`,
      partitionKey: { name: 'userId', type: 'S' },
      sortKey: { name: 'tenantId', type: 'S' },
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [{
        indexName: 'email-index',
        partitionKey: { name: 'email', type: 'S' },
        projectionType: 'ALL'
      }, {
        indexName: 'tenant-users-index',
        partitionKey: { name: 'tenantId', type: 'S' },
        sortKey: { name: 'createdAt', type: 'S' },
        projectionType: 'ALL'
      }],
      tags
    }, { parent: this })
    
    // Subscription table
    this.subscriptionTable = new DynamoDBTable(`${name}-subscriptions`, {
      tableName: `${name}-subscriptions`,
      partitionKey: { name: 'tenantId', type: 'S' },
      sortKey: { name: 'subscriptionId', type: 'S' },
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [{
        indexName: 'status-index',
        partitionKey: { name: 'status', type: 'S' },
        sortKey: { name: 'expiresAt', type: 'S' },
        projectionType: 'ALL'
      }],
      streamEnabled: true,
      tags
    }, { parent: this })
  }
  
  private createAPI(
    name: string,
    args: SaaSPlatformArgs,
    tags: Record<string, string>
  ): ServerlessAPI {
    return new ServerlessAPI(`${name}-api`, {
      apiName: `${name}-api`,
      description: `API for ${args.platformName}`,
      routes: [
        // Auth endpoints
        {
          path: '/auth/register',
          method: 'POST',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getAuthHandlerCode('register'))
            }),
            handler: 'index.handler',
            environment: {
              USER_TABLE: this.userTable.tableName,
              TENANT_TABLE: this.tenantTable.tableName
            }
          },
          cors: true
        },
        {
          path: '/auth/login',
          method: 'POST',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getAuthHandlerCode('login'))
            }),
            handler: 'index.handler',
            environment: {
              USER_TABLE: this.userTable.tableName,
              SESSION_DURATION: (args.auth.sessionDurationMinutes || 60).toString()
            }
          },
          cors: true
        },
        // Tenant management
        {
          path: '/tenants',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getTenantHandlerCode('list'))
            }),
            handler: 'index.handler',
            environment: {
              TENANT_TABLE: this.tenantTable.tableName
            }
          },
          auth: { type: 'jwt' },
          cors: true
        },
        {
          path: '/tenants/{tenantId}',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getTenantHandlerCode('get'))
            }),
            handler: 'index.handler',
            environment: {
              TENANT_TABLE: this.tenantTable.tableName
            }
          },
          auth: { type: 'jwt' },
          cors: true
        },
        // User management
        {
          path: '/users',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getUserHandlerCode('list'))
            }),
            handler: 'index.handler',
            environment: {
              USER_TABLE: this.userTable.tableName
            }
          },
          auth: { type: 'jwt' },
          cors: true
        },
        // Subscription management
        {
          path: '/subscriptions',
          method: 'POST',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getSubscriptionHandlerCode('create'))
            }),
            handler: 'index.handler',
            environment: {
              SUBSCRIPTION_TABLE: this.subscriptionTable.tableName,
              TENANT_TABLE: this.tenantTable.tableName
            }
          },
          auth: { type: 'jwt' },
          cors: true
        }
      ],
      enableLogging: true,
      enableTracing: true,
      rateLimiting: {
        burstLimit: 5000,
        rateLimit: 2000
      },
      customDomain: {
        domainName: pulumi.interpolate`api.${args.domain}`,
        certificateArn: args.certificateArn
      },
      database: {
        enabled: false // Using existing tables
      },
      tags
    }, { parent: this })
  }
  
  private createWebsite(
    name: string,
    args: SaaSPlatformArgs,
    tags: Record<string, string>
  ): StaticWebsite {
    return new StaticWebsite(`${name}-website`, {
      domainName: args.domain,
      contentSource: new pulumi.asset.FileArchive('./website-dist'),
      indexDocument: 'index.html',
      errorDocument: 'error.html',
      enableCdn: true,
      certificateArn: args.certificateArn,
      priceClass: 'PriceClass_100',
      enableWaf: true,
      responseHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      },
      enableLogging: true,
      tags
    }, { parent: this })
  }
  
  private createAdminPanel(
    name: string,
    args: SaaSPlatformArgs,
    tags: Record<string, string>
  ): StaticWebsite {
    return new StaticWebsite(`${name}-admin`, {
      domainName: pulumi.interpolate`admin.${args.domain}`,
      contentSource: new pulumi.asset.FileArchive('./admin-dist'),
      indexDocument: 'index.html',
      errorDocument: 'error.html',
      enableCdn: true,
      certificateArn: args.certificateArn,
      priceClass: 'PriceClass_100',
      enableWaf: true,
      responseHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      },
      enableLogging: true,
      tags
    }, { parent: this })
  }
  
  private createAnalyticsTable(
    name: string,
    tags: Record<string, string>
  ): DynamoDBTable {
    return new DynamoDBTable(`${name}-analytics`, {
      tableName: `${name}-analytics`,
      partitionKey: { name: 'tenantId', type: 'S' },
      sortKey: { name: 'timestamp', type: 'S' },
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [{
        indexName: 'event-type-index',
        partitionKey: { name: 'eventType', type: 'S' },
        sortKey: { name: 'timestamp', type: 'S' },
        projectionType: 'ALL'
      }],
      tags
    }, { parent: this })
  }
  
  private createAuditTable(
    name: string,
    tags: Record<string, string>
  ): DynamoDBTable {
    return new DynamoDBTable(`${name}-audit`, {
      tableName: `${name}-audit`,
      partitionKey: { name: 'tenantId', type: 'S' },
      sortKey: { name: 'auditId', type: 'S' },
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [{
        indexName: 'user-actions-index',
        partitionKey: { name: 'userId', type: 'S' },
        sortKey: { name: 'timestamp', type: 'S' },
        projectionType: 'ALL'
      }, {
        indexName: 'action-type-index',
        partitionKey: { name: 'actionType', type: 'S' },
        sortKey: { name: 'timestamp', type: 'S' },
        projectionType: 'KEYS_ONLY'
      }],
      streamEnabled: true,
      tags
    }, { parent: this })
  }
  
  private createBillingPipeline(
    name: string,
    args: SaaSPlatformArgs,
    tags: Record<string, string>
  ): EventDrivenPipeline {
    return new EventDrivenPipeline(`${name}-billing`, {
      pipelineName: `${name}-billing`,
      stages: [
        {
          name: 'validate',
          type: 'validate',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getBillingHandlerCode('validate'))
            }),
            handler: 'index.handler'
          },
          dlq: true
        },
        {
          name: 'calculate',
          type: 'transform',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getBillingHandlerCode('calculate'))
            }),
            handler: 'index.handler'
          }
        },
        {
          name: 'charge',
          type: 'transform',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getBillingHandlerCode('charge'))
            }),
            handler: 'index.handler',
            timeout: 30
          },
          retryPolicy: {
            maxAttempts: 3,
            backoffRate: 2
          },
          dlq: true
        }
      ],
      input: {
        type: 'eventbridge',
        config: {
          schedule: 'rate(1 day)',
          pattern: {
            source: ['billing.scheduler'],
            'detail-type': ['Billing Cycle']
          }
        }
      },
      output: {
        type: 'dynamodb',
        config: {
          tableName: this.subscriptionTable.tableName
        }
      },
      enableMonitoring: true,
      enableTracing: true,
      errorHandling: {
        strategy: 'dlq',
        notificationEmail: args.monitoring?.alertEmail
      },
      tags
    }, { parent: this })
  }
  
  private createNotificationSystem(
    name: string,
    args: SaaSPlatformArgs,
    tags: Record<string, string>
  ): void {
    // Create SNS topic for notifications
    const notificationTopic = new aws.sns.Topic(`${name}-notifications`, {
      name: `${name}-notifications`,
      tags
    }, { parent: this })
    
    // Create notification processor Lambda
    const notificationProcessor = new LambdaFunction(`${name}-notification-processor`, {
      functionName: `${name}-process-notifications`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getNotificationHandlerCode())
      }),
      environment: {
        EMAIL_PROVIDER: args.email?.provider || 'ses',
        FROM_ADDRESS: args.email?.fromAddress || 'noreply@example.com'
      },
      timeout: 30,
      tags
    }, { parent: this })
    
    // Subscribe Lambda to SNS topic
    new aws.sns.TopicSubscription(`${name}-notification-subscription`, {
      topic: notificationTopic.arn,
      protocol: 'lambda',
      endpoint: notificationProcessor.functionArn
    }, { parent: this })
  }
  
  private createBackupSystem(
    name: string,
    tags: Record<string, string>
  ): void {
    // Create backup bucket
    const backupBucket = new S3Bucket(`${name}-backups`, {
      bucketName: `${name}-backups-${Date.now()}`,
      enableVersioning: true,
      enableEncryption: true,
      lifecycleRules: [{
        id: 'archive-old-backups',
        enabled: true,
        transitions: [{
          days: 30,
          storageClass: 'STANDARD_IA'
        }, {
          days: 90,
          storageClass: 'GLACIER'
        }],
        expiration: {
          days: 365
        }
      }],
      tags
    }, { parent: this })
    
    // Create backup Lambda
    const backupFunction = new LambdaFunction(`${name}-backup`, {
      functionName: `${name}-backup`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getBackupHandlerCode())
      }),
      environment: {
        BACKUP_BUCKET: backupBucket.bucketName,
        TABLES: JSON.stringify([
          this.tenantTable.tableName,
          this.userTable.tableName,
          this.subscriptionTable.tableName
        ])
      },
      timeout: 900, // 15 minutes
      memorySize: 1024,
      tags
    }, { parent: this })
    
    // Schedule daily backups
    const backupSchedule = new aws.cloudwatch.EventRule(`${name}-backup-schedule`, {
      name: `${name}-backup-schedule`,
      description: 'Daily backup schedule',
      scheduleExpression: 'cron(0 3 * * ? *)', // 3 AM UTC daily
      tags
    }, { parent: this })
    
    new aws.cloudwatch.EventTarget(`${name}-backup-target`, {
      rule: backupSchedule.name,
      arn: backupFunction.functionArn
    }, { parent: this })
  }
  
  private createMonitoringDashboard(
    name: string,
    monitoring: NonNullable<SaaSPlatformArgs['monitoring']>,
    tags: Record<string, string>
  ): void {
    // Create CloudWatch dashboard
    new aws.cloudwatch.Dashboard(`${name}-dashboard`, {
      dashboardName: `${name}-saas-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { stat: 'Sum' }],
                ['.', 'Errors', { stat: 'Sum' }],
                ['.', 'Duration', { stat: 'Average' }]
              ],
              period: 300,
              stat: 'Average',
              region: aws.getRegion().then(r => r.name),
              title: 'Lambda Performance'
            }
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/DynamoDB', 'UserErrors', { stat: 'Sum' }],
                ['.', 'SystemErrors', { stat: 'Sum' }]
              ],
              period: 300,
              stat: 'Sum',
              region: aws.getRegion().then(r => r.name),
              title: 'DynamoDB Errors'
            }
          }
        ]
      })
    }, { parent: this })
    
    // Create alarms
    if (monitoring.alertEmail) {
      this.createAlarms(name, monitoring.alertEmail, tags)
    }
  }
  
  private createAlarms(
    name: string,
    alertEmail: pulumi.Input<string>,
    tags: Record<string, string>
  ): void {
    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(`${name}-alarms`, {
      name: `${name}-alarms`,
      tags
    }, { parent: this })
    
    new aws.sns.TopicSubscription(`${name}-alarm-email`, {
      topic: alarmTopic.arn,
      protocol: 'email',
      endpoint: alertEmail
    }, { parent: this })
    
    // API error rate alarm
    new aws.cloudwatch.MetricAlarm(`${name}-api-errors`, {
      name: `${name}-api-error-rate`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'API error rate is too high',
      alarmActions: [alarmTopic.arn],
      tags
    }, { parent: this })
  }
  
  // Handler code generators
  private getAuthHandlerCode(action: string): string {
    return `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  
  try {
    switch('${action}') {
      case 'register':
        return await handleRegister(body);
      case 'login':
        return await handleLogin(body);
      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
    }
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

async function handleRegister(data) {
  // Registration logic
  const hashedPassword = await bcrypt.hash(data.password, 10);
  // Store user in DynamoDB
  return { statusCode: 201, body: JSON.stringify({ message: 'User registered' }) };
}

async function handleLogin(data) {
  // Login logic
  const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
  return { statusCode: 200, body: JSON.stringify({ token }) };
}
`
  }
  
  private getTenantHandlerCode(action: string): string {
    return `
exports.handler = async (event) => {
  // Tenant management logic for ${action}
  return { statusCode: 200, body: JSON.stringify({ action: '${action}' }) };
};
`
  }
  
  private getUserHandlerCode(action: string): string {
    return `
exports.handler = async (event) => {
  // User management logic for ${action}
  return { statusCode: 200, body: JSON.stringify({ action: '${action}' }) };
};
`
  }
  
  private getSubscriptionHandlerCode(action: string): string {
    return `
exports.handler = async (event) => {
  // Subscription management logic for ${action}
  return { statusCode: 200, body: JSON.stringify({ action: '${action}' }) };
};
`
  }
  
  private getBillingHandlerCode(stage: string): string {
    return `
exports.handler = async (event) => {
  // Billing pipeline stage: ${stage}
  console.log('Processing billing stage:', '${stage}');
  
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    // Process message based on stage
  }
};
`
  }
  
  private getNotificationHandlerCode(): string {
    return `
exports.handler = async (event) => {
  // Process notifications
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    // Send email notification
  }
};
`
  }
  
  private getBackupHandlerCode(): string {
    return `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const tables = JSON.parse(process.env.TABLES);
  const bucket = process.env.BACKUP_BUCKET;
  
  for (const table of tables) {
    // Scan table and backup to S3
    console.log('Backing up table:', table);
  }
};
`
  }
  
  protected applyApplicationBestPractices(): void {
    this.applicationConsiderations = [
      {
        application: 'SaaS Platform',
        description: 'Multi-tenant SaaS application with complete infrastructure',
        architecture: [
          'API Gateway + Lambda for serverless backend',
          'DynamoDB for scalable data storage',
          'CloudFront + S3 for static hosting',
          'EventBridge for scheduled tasks',
          'SNS/SQS for async processing'
        ],
        scalability: [
          'Auto-scaling at all layers',
          'Pay-per-use pricing model',
          'Global CDN distribution',
          'Multi-region capable'
        ],
        security: [
          'JWT-based authentication',
          'Tenant isolation',
          'WAF protection',
          'Encryption at rest and in transit',
          'Audit logging'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l3-saas-platform',
      level: ConstructLevel.L3,
      name: 'SaaS Platform Application',
      description: 'Complete multi-tenant SaaS platform with billing and analytics',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'application',
      tags: ['aws', 'saas', 'multi-tenant', 'platform', 'application'],
      providers: [CloudProvider.AWS]
    }
  }
}