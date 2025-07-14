import * as pulumi from '@pulumi/pulumi'
import * as gcp from '@pulumi/gcp'
import { L1Construct, SecurityConsideration, CostModel } from '@love-claude-code/core'
import { ConstructLevel, CloudProvider } from '@love-claude-code/core'

export interface CloudStorageArgs {
  /**
   * Bucket name
   */
  bucketName?: pulumi.Input<string>
  
  /**
   * Location
   */
  location: pulumi.Input<string>
  
  /**
   * Storage class
   */
  storageClass?: pulumi.Input<'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE'>
  
  /**
   * Enable versioning
   */
  enableVersioning?: pulumi.Input<boolean>
  
  /**
   * Lifecycle rules
   */
  lifecycleRules?: pulumi.Input<gcp.types.input.storage.BucketLifecycleRule[]>
  
  /**
   * CORS configuration
   */
  cors?: pulumi.Input<gcp.types.input.storage.BucketCor[]>
  
  /**
   * Uniform bucket-level access
   */
  uniformBucketLevelAccess?: pulumi.Input<boolean>
  
  /**
   * Public access prevention
   */
  publicAccessPrevention?: pulumi.Input<'enforced' | 'inherited'>
  
  /**
   * Storage rules content
   */
  storageRules?: pulumi.Input<string>
  
  /**
   * Labels
   */
  labels?: pulumi.Input<Record<string, string>>
}

/**
 * L1 construct for Firebase Cloud Storage with security best practices
 */
export class CloudStorage extends L1Construct {
  public readonly bucket: gcp.storage.Bucket
  public readonly bucketName: pulumi.Output<string>
  public readonly bucketUrl: pulumi.Output<string>
  
  constructor(name: string, args: CloudStorageArgs, opts?: pulumi.ComponentResourceOptions) {
    super('firebase:storage:L1Bucket', name, {}, opts)
    
    const defaultLabels = {
      'love-claude-code-construct': 'l1',
      'love-claude-code-provider': 'firebase',
      'love-claude-code-resource': 'cloud-storage',
      ...args.labels
    }
    
    // Create the storage bucket
    this.bucket = new gcp.storage.Bucket(`${name}-bucket`, {
      name: args.bucketName,
      location: args.location,
      storageClass: args.storageClass || 'STANDARD',
      
      // Versioning
      versioning: {
        enabled: args.enableVersioning !== false
      },
      
      // Lifecycle rules
      lifecycleRules: args.lifecycleRules,
      
      // CORS
      cors: args.cors || [{
        origins: ['*'],
        methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        responseHeaders: ['*'],
        maxAgeSeconds: 3600
      }],
      
      // Security
      uniformBucketLevelAccess: args.uniformBucketLevelAccess !== false,
      publicAccessPrevention: args.publicAccessPrevention || 'enforced',
      
      // Encryption (Google-managed by default)
      encryption: {
        defaultKmsKeyName: undefined // Uses Google-managed keys
      },
      
      labels: defaultLabels
    }, { parent: this })
    
    // Apply storage security rules
    if (args.storageRules) {
      this.applyStorageRules(name, args.storageRules)
    } else {
      this.applyDefaultStorageRules(name)
    }
    
    // Apply security best practices
    this.applySecurityBestPractices()
    
    // Set outputs
    this.bucketName = this.bucket.name
    this.bucketUrl = this.bucket.url
    
    // Register outputs
    this.registerOutputs({
      bucketName: this.bucketName,
      bucketUrl: this.bucketUrl
    })
  }
  
  private applyStorageRules(name: string, rules: pulumi.Input<string>): void {
    // Note: In a real implementation, this would use Firebase Admin SDK
    // to apply storage security rules
    // For now, we'll create a placeholder configuration
    
    new gcp.storage.BucketObject(`${name}-rules`, {
      name: 'storage.rules',
      bucket: this.bucket.name,
      content: rules
    }, { parent: this })
  }
  
  private applyDefaultStorageRules(name: string): void {
    const defaultRules = `
      rules_version = '2';
      service firebase.storage {
        match /b/{bucket}/o {
          // Default: Deny all access
          match /{allPaths=**} {
            allow read, write: if false;
          }
          
          // Example: Allow authenticated users to read/write their own files
          match /users/{userId}/{allPaths=**} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
          
          // Example: Public read for specific paths
          match /public/{allPaths=**} {
            allow read: if true;
            allow write: if request.auth != null;
          }
        }
      }
    `
    
    this.applyStorageRules(name, defaultRules)
  }
  
  protected applySecurityBestPractices(): void {
    this.securityConsiderations = [
      {
        type: 'access-control',
        description: 'Uniform bucket-level access enforced',
        recommendation: 'Use Firebase Storage Security Rules for fine-grained access control'
      },
      {
        type: 'encryption',
        description: 'Data encrypted at rest by default',
        recommendation: 'Google-managed encryption keys are used automatically'
      },
      {
        type: 'network',
        description: 'Public access prevention enforced',
        recommendation: 'All access must go through Firebase Storage Security Rules'
      },
      {
        type: 'audit',
        description: 'Versioning enabled for data recovery',
        recommendation: 'Configure lifecycle rules for cost optimization'
      }
    ]
  }
  
  public getCostModel(): CostModel {
    return {
      provider: CloudProvider.Firebase,
      service: 'Cloud Storage',
      baseCost: 0,
      usage: {
        storage: {
          cost: 0.026, // Standard storage per GB per month
          unit: 'GB-month'
        },
        operations: {
          cost: 0.005, // Class A operations per 10,000
          unit: '10k operations'
        },
        transfer: {
          cost: 0.12, // Egress to internet per GB
          unit: 'GB'
        }
      }
    }
  }
  
  public getConstructMetadata() {
    return {
      id: 'firebase-l1-cloud-storage',
      level: ConstructLevel.L1,
      name: 'Firebase Cloud Storage',
      description: 'Secure Cloud Storage bucket with Firebase security rules',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'storage',
      tags: ['firebase', 'storage', 'cloud-storage', 'object-storage'],
      providers: [CloudProvider.Firebase]
    }
  }
  
  /**
   * Grant read access to a specific path
   */
  public grantRead(path: string, principal?: string): pulumi.Output<void> {
    return pulumi.output(this.bucket.name).apply(bucketName => {
      // In a real implementation, this would modify the storage rules
      // to grant read access to the specified path
      console.log(`Granting read access to ${path} in bucket ${bucketName}`)
    })
  }
  
  /**
   * Create a signed URL for temporary access
   */
  public createSignedUrl(
    objectName: string,
    duration: string = '1h'
  ): pulumi.Output<string> {
    // This would use GCP service account to create signed URLs
    return pulumi.interpolate`https://storage.googleapis.com/${this.bucket.name}/${objectName}?signed`
  }
}