import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { L1Construct, SecurityConsideration, CostModel } from '@love-claude-code/core'
import { ConstructLevel, CloudProvider } from '@love-claude-code/core'

export interface S3BucketArgs {
  /**
   * The name of the bucket
   */
  bucketName?: pulumi.Input<string>
  
  /**
   * Enable versioning for the bucket
   */
  enableVersioning?: pulumi.Input<boolean>
  
  /**
   * Enable server-side encryption
   */
  enableEncryption?: pulumi.Input<boolean>
  
  /**
   * KMS key ARN for encryption (if not provided, uses AWS managed key)
   */
  kmsKeyArn?: pulumi.Input<string>
  
  /**
   * Enable public access block
   */
  blockPublicAccess?: pulumi.Input<boolean>
  
  /**
   * Enable access logging
   */
  enableLogging?: pulumi.Input<boolean>
  
  /**
   * Target bucket for access logs
   */
  loggingTargetBucket?: pulumi.Input<string>
  
  /**
   * Lifecycle rules for the bucket
   */
  lifecycleRules?: pulumi.Input<aws.s3.BucketLifecycleConfigurationRule[]>
  
  /**
   * Tags to apply to the bucket
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L1 construct for AWS S3 bucket with security best practices
 */
export class S3Bucket extends L1Construct {
  public readonly bucket: aws.s3.Bucket
  public readonly bucketAcl: aws.s3.BucketAclV2
  public readonly bucketVersioning: aws.s3.BucketVersioningV2
  public readonly bucketEncryption: aws.s3.BucketServerSideEncryptionConfigurationV2
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock
  public readonly bucketArn: pulumi.Output<string>
  public readonly bucketName: pulumi.Output<string>
  
  constructor(name: string, args: S3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:s3:L1Bucket', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L1',
      'love-claude-code:provider': 'aws',
      'love-claude-code:resource': 's3-bucket',
      ...args.tags
    }
    
    // Create the bucket
    this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
      bucket: args.bucketName,
      tags: defaultTags
    }, { parent: this })
    
    // Configure ACL (private by default)
    this.bucketAcl = new aws.s3.BucketAclV2(`${name}-acl`, {
      bucket: this.bucket.id,
      acl: 'private'
    }, { parent: this })
    
    // Configure versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(`${name}-versioning`, {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: args.enableVersioning ? 'Enabled' : 'Suspended'
      }
    }, { parent: this })
    
    // Configure encryption
    const encryptionConfig: aws.s3.BucketServerSideEncryptionConfigurationV2Args = {
      bucket: this.bucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: args.kmsKeyArn ? {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: args.kmsKeyArn
        } : {
          sseAlgorithm: 'AES256'
        }
      }]
    }
    
    if (args.enableEncryption !== false) {
      this.bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `${name}-encryption`,
        encryptionConfig,
        { parent: this }
      )
    }
    
    // Configure public access block
    if (args.blockPublicAccess !== false) {
      this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-pab`, {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      }, { parent: this })
    }
    
    // Configure logging if requested
    if (args.enableLogging && args.loggingTargetBucket) {
      new aws.s3.BucketLoggingV2(`${name}-logging`, {
        bucket: this.bucket.id,
        targetBucket: args.loggingTargetBucket,
        targetPrefix: `logs/${name}/`
      }, { parent: this })
    }
    
    // Configure lifecycle rules
    if (args.lifecycleRules) {
      new aws.s3.BucketLifecycleConfigurationV2(`${name}-lifecycle`, {
        bucket: this.bucket.id,
        rules: args.lifecycleRules
      }, { parent: this })
    }
    
    // Apply security best practices
    this.applySecurityBestPractices()
    
    // Set outputs
    this.bucketArn = this.bucket.arn
    this.bucketName = this.bucket.id
    
    // Register outputs
    this.registerOutputs({
      bucketArn: this.bucketArn,
      bucketName: this.bucketName
    })
  }
  
  protected applySecurityBestPractices(): void {
    // Security considerations
    this.securityConsiderations = [
      {
        type: 'encryption',
        description: 'Server-side encryption enabled by default',
        recommendation: 'Consider using customer-managed KMS keys for sensitive data'
      },
      {
        type: 'access-control',
        description: 'Public access blocked by default',
        recommendation: 'Use IAM policies and bucket policies for fine-grained access control'
      },
      {
        type: 'audit',
        description: 'Versioning and logging available',
        recommendation: 'Enable versioning and logging for compliance requirements'
      }
    ]
  }
  
  public getCostModel(): CostModel {
    return {
      provider: CloudProvider.AWS,
      service: 'S3',
      baseCost: 0, // S3 has no base cost
      usage: {
        storage: {
          cost: 0.023, // Standard storage per GB per month
          unit: 'GB-month'
        },
        requests: {
          cost: 0.0004, // Per 1000 PUT/COPY/POST/LIST requests
          unit: '1000 requests'
        },
        transfer: {
          cost: 0.09, // Data transfer out per GB
          unit: 'GB'
        }
      }
    }
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l1-s3-bucket',
      level: ConstructLevel.L1,
      name: 'AWS S3 Bucket',
      description: 'Secure S3 bucket with encryption, versioning, and access controls',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'storage',
      tags: ['aws', 's3', 'storage', 'object-storage', 'secure-by-default'],
      providers: [CloudProvider.AWS]
    }
  }
}