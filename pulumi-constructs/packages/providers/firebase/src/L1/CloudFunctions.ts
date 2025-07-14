import * as pulumi from '@pulumi/pulumi'
import * as gcp from '@pulumi/gcp'
import { L1Construct, SecurityConsideration, CostModel } from '@love-claude-code/core'
import { ConstructLevel, CloudProvider } from '@love-claude-code/core'

export interface CloudFunctionArgs {
  /**
   * Function name
   */
  functionName?: pulumi.Input<string>
  
  /**
   * Runtime
   */
  runtime: pulumi.Input<string> // e.g., 'nodejs18', 'python311'
  
  /**
   * Entry point
   */
  entryPoint: pulumi.Input<string>
  
  /**
   * Source code
   */
  sourceCode: pulumi.AssetOrArchive
  
  /**
   * Memory allocation in MB
   */
  availableMemoryMb?: pulumi.Input<number>
  
  /**
   * Timeout in seconds
   */
  timeout?: pulumi.Input<number>
  
  /**
   * Environment variables
   */
  environmentVariables?: pulumi.Input<Record<string, string>>
  
  /**
   * Trigger type
   */
  trigger: {
    type: 'https' | 'pubsub' | 'storage' | 'firestore' | 'auth'
    config?: any
  }
  
  /**
   * VPC connector
   */
  vpcConnector?: pulumi.Input<string>
  
  /**
   * Service account email
   */
  serviceAccountEmail?: pulumi.Input<string>
  
  /**
   * Ingress settings
   */
  ingressSettings?: pulumi.Input<'ALLOW_ALL' | 'ALLOW_INTERNAL_ONLY' | 'ALLOW_INTERNAL_AND_GCLB'>
  
  /**
   * Max instances
   */
  maxInstances?: pulumi.Input<number>
  
  /**
   * Min instances
   */
  minInstances?: pulumi.Input<number>
  
  /**
   * Labels
   */
  labels?: pulumi.Input<Record<string, string>>
}

/**
 * L1 construct for Firebase Cloud Functions with security best practices
 */
export class CloudFunction extends L1Construct {
  public readonly function: gcp.cloudfunctionsv2.Function
  public readonly functionName: pulumi.Output<string>
  public readonly functionUrl: pulumi.Output<string | undefined>
  public readonly serviceAccount: gcp.serviceaccount.Account
  
  constructor(name: string, args: CloudFunctionArgs, opts?: pulumi.ComponentResourceOptions) {
    super('firebase:functions:L1Function', name, {}, opts)
    
    const defaultLabels = {
      'love-claude-code-construct': 'l1',
      'love-claude-code-provider': 'firebase',
      'love-claude-code-resource': 'cloud-function',
      ...args.labels
    }
    
    // Create service account with least privilege
    this.serviceAccount = new gcp.serviceaccount.Account(`${name}-sa`, {
      accountId: `${name}-function-sa`,
      displayName: `Service account for ${name} function`,
      description: 'Managed by Love Claude Code L1 construct'
    }, { parent: this })
    
    // Grant necessary roles to service account
    this.grantServiceAccountRoles(name)
    
    // Upload source code to bucket
    const bucket = new gcp.storage.Bucket(`${name}-source`, {
      name: `${name}-function-source-${Date.now()}`,
      location: 'US',
      uniformBucketLevelAccess: true,
      publicAccessPrevention: 'enforced',
      lifecycleRules: [{
        action: { type: 'Delete' },
        condition: { age: 7 }
      }]
    }, { parent: this })
    
    const sourceArchive = new gcp.storage.BucketObject(`${name}-source-archive`, {
      name: 'function-source.zip',
      bucket: bucket.name,
      source: args.sourceCode
    }, { parent: this })
    
    // Create the Cloud Function
    this.function = new gcp.cloudfunctionsv2.Function(`${name}-function`, {
      name: args.functionName || name,
      location: 'us-central1',
      
      buildConfig: {
        runtime: args.runtime,
        entryPoint: args.entryPoint,
        source: {
          storageSource: {
            bucket: bucket.name,
            object: sourceArchive.name
          }
        },
        environmentVariables: {
          'LOVE_CLAUDE_CODE_CONSTRUCT': 'L1',
          ...args.environmentVariables
        }
      },
      
      serviceConfig: {
        availableMemory: `${args.availableMemoryMb || 256}M`,
        timeoutSeconds: args.timeout || 60,
        environmentVariables: args.environmentVariables,
        maxInstanceCount: args.maxInstances || 100,
        minInstanceCount: args.minInstances || 0,
        serviceAccountEmail: args.serviceAccountEmail || this.serviceAccount.email,
        ingressSettings: args.ingressSettings || 'ALLOW_ALL',
        vpcConnector: args.vpcConnector
      },
      
      labels: defaultLabels
    }, { parent: this })
    
    // Configure trigger
    this.configureTrigger(name, args.trigger)
    
    // Apply security best practices
    this.applySecurityBestPractices()
    
    // Set outputs
    this.functionName = this.function.name
    this.functionUrl = this.function.url
    
    // Register outputs
    this.registerOutputs({
      functionName: this.functionName,
      functionUrl: this.functionUrl,
      serviceAccount: this.serviceAccount.email
    })
  }
  
  private grantServiceAccountRoles(name: string): void {
    // Basic roles for function execution
    new gcp.projects.IAMMember(`${name}-sa-logs`, {
      project: pulumi.output(gcp.organizations.getProject()).project,
      role: 'roles/logging.logWriter',
      member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`
    }, { parent: this })
    
    new gcp.projects.IAMMember(`${name}-sa-errors`, {
      project: pulumi.output(gcp.organizations.getProject()).project,
      role: 'roles/errorreporting.writer',
      member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`
    }, { parent: this })
  }
  
  private configureTrigger(name: string, trigger: CloudFunctionArgs['trigger']): void {
    switch (trigger.type) {
      case 'https':
        // HTTPS triggers are configured by default
        // Add IAM binding for public access if needed
        if (trigger.config?.allowUnauthenticated) {
          new gcp.cloudfunctionsv2.FunctionIamMember(`${name}-invoker`, {
            project: this.function.project,
            location: this.function.location,
            cloudFunction: this.function.name,
            role: 'roles/cloudfunctions.invoker',
            member: 'allUsers'
          }, { parent: this })
        }
        break
        
      case 'pubsub':
        // Configure Pub/Sub trigger
        if (trigger.config?.topic) {
          // This would configure a Pub/Sub trigger
        }
        break
        
      case 'storage':
        // Configure Storage trigger
        if (trigger.config?.bucket && trigger.config?.event) {
          // This would configure a Storage trigger
        }
        break
        
      case 'firestore':
        // Configure Firestore trigger
        if (trigger.config?.document) {
          // This would configure a Firestore trigger
        }
        break
        
      case 'auth':
        // Configure Auth trigger
        if (trigger.config?.event) {
          // This would configure an Auth trigger
        }
        break
    }
  }
  
  protected applySecurityBestPractices(): void {
    this.securityConsiderations = [
      {
        type: 'access-control',
        description: 'Dedicated service account with least privilege',
        recommendation: 'Grant only necessary permissions to the service account'
      },
      {
        type: 'network',
        description: 'Configurable ingress settings',
        recommendation: 'Restrict ingress to internal traffic when possible'
      },
      {
        type: 'monitoring',
        description: 'Automatic logging and error reporting',
        recommendation: 'Set up alerts for function errors and performance'
      },
      {
        type: 'scalability',
        description: 'Configurable instance limits',
        recommendation: 'Set appropriate max instances to prevent runaway costs'
      }
    ]
  }
  
  public getCostModel(): CostModel {
    return {
      provider: CloudProvider.Firebase,
      service: 'Cloud Functions',
      baseCost: 0,
      usage: {
        invocations: {
          cost: 0.40, // Per million invocations
          unit: 'million invocations'
        },
        compute: {
          cost: 0.0000025, // Per GB-second
          unit: 'GB-second'
        },
        memory: {
          cost: 0.0000100, // Per GB-hour
          unit: 'GB-hour'
        },
        transfer: {
          cost: 0.12, // Per GB egress
          unit: 'GB'
        }
      }
    }
  }
  
  public getConstructMetadata() {
    return {
      id: 'firebase-l1-cloud-function',
      level: ConstructLevel.L1,
      name: 'Firebase Cloud Function',
      description: 'Secure Cloud Function with configurable triggers and scaling',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'compute',
      tags: ['firebase', 'functions', 'serverless', 'compute', 'event-driven'],
      providers: [CloudProvider.Firebase]
    }
  }
  
  /**
   * Grant invoke permissions to a principal
   */
  public grantInvoke(member: string): pulumi.Output<void> {
    return pulumi.output(
      new gcp.cloudfunctionsv2.FunctionIamMember(`${this.function.name}-invoke-${member}`, {
        project: this.function.project,
        location: this.function.location,
        cloudFunction: this.function.name,
        role: 'roles/cloudfunctions.invoker',
        member: member
      }, { parent: this })
    ).apply(() => {})
  }
}