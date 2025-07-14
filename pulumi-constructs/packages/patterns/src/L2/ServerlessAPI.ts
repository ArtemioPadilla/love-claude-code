import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { L2Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { LambdaFunction, DynamoDBTable } from '@love-claude-code/providers'

export interface ServerlessAPIArgs {
  /**
   * API name
   */
  apiName: pulumi.Input<string>
  
  /**
   * API description
   */
  description?: pulumi.Input<string>
  
  /**
   * API routes configuration
   */
  routes: Array<{
    path: pulumi.Input<string>
    method: pulumi.Input<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>
    handler: {
      code: pulumi.AssetOrArchive
      handler: pulumi.Input<string>
      runtime?: pulumi.Input<aws.lambda.Runtime>
      environment?: pulumi.Input<Record<string, string>>
    }
    auth?: {
      type: 'none' | 'api-key' | 'jwt'
      config?: any
    }
    cors?: boolean
  }>
  
  /**
   * Enable request/response logging
   */
  enableLogging?: pulumi.Input<boolean>
  
  /**
   * Enable X-Ray tracing
   */
  enableTracing?: pulumi.Input<boolean>
  
  /**
   * Rate limiting configuration
   */
  rateLimiting?: {
    burstLimit: pulumi.Input<number>
    rateLimit: pulumi.Input<number>
  }
  
  /**
   * Custom domain configuration
   */
  customDomain?: {
    domainName: pulumi.Input<string>
    certificateArn: pulumi.Input<string>
  }
  
  /**
   * Database configuration
   */
  database?: {
    enabled: boolean
    tables: Array<{
      name: string
      partitionKey: { name: string; type: 'S' | 'N' | 'B' }
      sortKey?: { name: string; type: 'S' | 'N' | 'B' }
      globalSecondaryIndexes?: any[]
    }>
  }
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L2 construct for a complete serverless API with Lambda, API Gateway, and DynamoDB
 */
export class ServerlessAPI extends L2Construct {
  public readonly api: aws.apigatewayv2.Api
  public readonly apiUrl: pulumi.Output<string>
  public readonly functions: Map<string, LambdaFunction> = new Map()
  public readonly tables: Map<string, DynamoDBTable> = new Map()
  public readonly authorizer?: aws.apigatewayv2.Authorizer
  
  constructor(name: string, args: ServerlessAPIArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:patterns:L2ServerlessAPI', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L2',
      'love-claude-code:pattern': 'serverless-api',
      ...args.tags
    }
    
    // Create API Gateway
    this.api = new aws.apigatewayv2.Api(`${name}-api`, {
      name: args.apiName,
      description: args.description,
      protocolType: 'HTTP',
      corsConfiguration: this.createCorsConfiguration(args.routes),
      tags: defaultTags
    }, { parent: this })
    
    // Create CloudWatch log group for API Gateway
    const logGroup = new aws.cloudwatch.LogGroup(`${name}-api-logs`, {
      name: pulumi.interpolate`/aws/apigateway/${this.api.name}`,
      retentionInDays: 30,
      tags: defaultTags
    }, { parent: this })
    
    // Create database tables if configured
    if (args.database?.enabled) {
      this.createDatabaseTables(name, args.database.tables, defaultTags)
    }
    
    // Create authorizer if needed
    const hasAuth = args.routes.some(r => r.auth && r.auth.type !== 'none')
    if (hasAuth) {
      this.authorizer = this.createAuthorizer(name, args.routes, defaultTags)
    }
    
    // Create routes and Lambda functions
    args.routes.forEach((route, index) => {
      this.createRoute(name, route, index, defaultTags)
    })
    
    // Create deployment and stage
    const deployment = new aws.apigatewayv2.Deployment(`${name}-deployment`, {
      apiId: this.api.id,
      description: 'Automated deployment',
      triggers: {
        redeployment: Date.now().toString()
      }
    }, { parent: this, dependsOn: Array.from(this.functions.values()) })
    
    const stage = new aws.apigatewayv2.Stage(`${name}-stage`, {
      apiId: this.api.id,
      name: '$default',
      deploymentId: deployment.id,
      autoDeploy: true,
      accessLogSettings: args.enableLogging ? {
        destinationArn: logGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          error: '$context.error.message'
        })
      } : undefined,
      defaultRouteSettings: {
        throttlingBurstLimit: args.rateLimiting?.burstLimit || 5000,
        throttlingRateLimit: args.rateLimiting?.rateLimit || 10000
      },
      tags: defaultTags
    }, { parent: this })
    
    // Configure custom domain if provided
    if (args.customDomain) {
      this.configureCustomDomain(name, args.customDomain, defaultTags)
    }
    
    // Apply pattern best practices
    this.applyPatternBestPractices()
    
    // Set outputs
    this.apiUrl = stage.invokeUrl
    
    // Register outputs
    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: this.api.id,
      functions: Array.from(this.functions.keys()),
      tables: Array.from(this.tables.keys())
    })
  }
  
  private createCorsConfiguration(routes: ServerlessAPIArgs['routes']): any {
    const hasCors = routes.some(r => r.cors)
    if (!hasCors) return undefined
    
    return {
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-api-key'],
      exposeHeaders: ['x-request-id'],
      maxAge: 86400
    }
  }
  
  private createDatabaseTables(
    name: string,
    tables: NonNullable<ServerlessAPIArgs['database']>['tables'],
    tags: Record<string, string>
  ): void {
    tables.forEach(tableConfig => {
      const table = new DynamoDBTable(`${name}-table-${tableConfig.name}`, {
        tableName: pulumi.interpolate`${name}-${tableConfig.name}`,
        partitionKey: tableConfig.partitionKey,
        sortKey: tableConfig.sortKey,
        billingMode: 'PAY_PER_REQUEST',
        enablePointInTimeRecovery: true,
        enableEncryption: true,
        globalSecondaryIndexes: tableConfig.globalSecondaryIndexes,
        streamEnabled: true,
        tags
      }, { parent: this })
      
      this.tables.set(tableConfig.name, table)
    })
  }
  
  private createAuthorizer(
    name: string,
    routes: ServerlessAPIArgs['routes'],
    tags: Record<string, string>
  ): aws.apigatewayv2.Authorizer {
    // Create JWT authorizer (simplified - in real implementation would be more configurable)
    const authorizerFunction = new LambdaFunction(`${name}-authorizer`, {
      functionName: pulumi.interpolate`${name}-jwt-authorizer`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
          exports.handler = async (event) => {
            // Simple JWT validation logic
            const token = event.headers.authorization;
            
            if (!token || !token.startsWith('Bearer ')) {
              return {
                isAuthorized: false,
                context: {}
              };
            }
            
            // In real implementation, validate JWT token
            return {
              isAuthorized: true,
              context: {
                userId: 'user123',
                email: 'user@example.com'
              }
            };
          };
        `)
      }),
      timeout: 10,
      memorySize: 128,
      tags
    }, { parent: this })
    
    return new aws.apigatewayv2.Authorizer(`${name}-authorizer`, {
      apiId: this.api.id,
      authorizerType: 'REQUEST',
      identitySources: ['$request.header.Authorization'],
      name: `${name}-jwt-authorizer`,
      authorizerUri: pulumi.interpolate`arn:aws:apigateway:${aws.getRegion().then(r => r.name)}:lambda:path/2015-03-31/functions/${authorizerFunction.functionArn}/invocations`,
      authorizerPayloadFormatVersion: '2.0',
      enableSimpleResponses: true
    }, { parent: this })
  }
  
  private createRoute(
    name: string,
    route: ServerlessAPIArgs['routes'][0],
    index: number,
    tags: Record<string, string>
  ): void {
    // Create Lambda function for route
    const functionName = `${name}-${route.method}-${index}`
    const lambdaFunction = new LambdaFunction(functionName, {
      functionName: pulumi.interpolate`${functionName}`,
      runtime: route.handler.runtime || 'nodejs18.x',
      handler: route.handler.handler,
      code: route.handler.code,
      timeout: 30,
      memorySize: 256,
      environment: {
        ...route.handler.environment,
        API_NAME: args.apiName,
        ROUTE_PATH: route.path,
        ROUTE_METHOD: route.method
      },
      tracingConfig: args.enableTracing ? 'Active' : undefined,
      tags
    }, { parent: this })
    
    this.functions.set(functionName, lambdaFunction)
    
    // Grant DynamoDB permissions if database is enabled
    if (args.database?.enabled) {
      this.grantDatabasePermissions(lambdaFunction)
    }
    
    // Create route
    const apiRoute = new aws.apigatewayv2.Route(`${name}-route-${index}`, {
      apiId: this.api.id,
      routeKey: pulumi.interpolate`${route.method} ${route.path}`,
      target: pulumi.interpolate`integrations/${
        new aws.apigatewayv2.Integration(`${name}-integration-${index}`, {
          apiId: this.api.id,
          integrationType: 'AWS_PROXY',
          integrationUri: lambdaFunction.functionArn,
          integrationMethod: 'POST',
          payloadFormatVersion: '2.0'
        }, { parent: this }).id
      }`,
      authorizationType: route.auth?.type === 'none' ? 'NONE' : 'CUSTOM',
      authorizerId: route.auth?.type !== 'none' ? this.authorizer?.id : undefined
    }, { parent: this })
    
    // Grant API Gateway permission to invoke Lambda
    new aws.lambda.Permission(`${name}-permission-${index}`, {
      action: 'lambda:InvokeFunction',
      function: lambdaFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`
    }, { parent: this })
  }
  
  private grantDatabasePermissions(lambdaFunction: LambdaFunction): void {
    const dynamoDbPolicy = new aws.iam.Policy(`${lambdaFunction.function.name}-dynamodb-policy`, {
      policy: pulumi.output({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem'
          ],
          Resource: Array.from(this.tables.values()).map(t => t.tableArn)
        }]
      }).apply(JSON.stringify)
    }, { parent: this })
    
    new aws.iam.RolePolicyAttachment(`${lambdaFunction.function.name}-dynamodb-attachment`, {
      role: lambdaFunction.role,
      policyArn: dynamoDbPolicy.arn
    }, { parent: this })
  }
  
  private configureCustomDomain(
    name: string,
    customDomain: NonNullable<ServerlessAPIArgs['customDomain']>,
    tags: Record<string, string>
  ): void {
    const domainName = new aws.apigatewayv2.DomainName(`${name}-domain`, {
      domainName: customDomain.domainName,
      domainNameConfiguration: {
        certificateArn: customDomain.certificateArn,
        endpointType: 'REGIONAL',
        securityPolicy: 'TLS_1_2'
      },
      tags
    }, { parent: this })
    
    new aws.apigatewayv2.ApiMapping(`${name}-mapping`, {
      apiId: this.api.id,
      domainName: domainName.domainName,
      stage: '$default'
    }, { parent: this })
  }
  
  protected applyPatternBestPractices(): void {
    this.patternConsiderations = [
      {
        pattern: 'Serverless API',
        description: 'RESTful API using API Gateway and Lambda',
        benefits: [
          'No server management',
          'Automatic scaling',
          'Pay-per-request pricing',
          'Built-in authentication and authorization'
        ],
        tradeoffs: [
          'Cold start latency',
          'Vendor lock-in',
          'Complex local development'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l2-serverless-api',
      level: ConstructLevel.L2,
      name: 'Serverless API Pattern',
      description: 'Complete serverless API with Lambda, API Gateway, and DynamoDB',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'api',
      tags: ['aws', 'serverless', 'api', 'lambda', 'apigateway', 'pattern'],
      providers: [CloudProvider.AWS]
    }
  }
}