import * as pulumi from '@pulumi/pulumi';
import { ConstructLevel, BaseConstructArgs, ConstructMetadata, SecurityConsideration } from './types';

/**
 * L1 Construct - Foundation constructs with sensible defaults
 * 
 * L1 constructs wrap cloud resources with:
 * - Security best practices enabled by default
 * - Sensible configuration defaults
 * - Helper methods for common operations
 * - Cross-provider abstractions where applicable
 * 
 * @example
 * ```typescript
 * class L1SecureStorage extends L1Construct {
 *   public readonly bucket: aws.s3.Bucket;
 *   
 *   constructor(name: string, args: L1StorageArgs, opts?: pulumi.ComponentResourceOptions) {
 *     super("lcc:storage:L1SecureStorage", name, args, opts);
 *     
 *     // Bucket with encryption, versioning, and secure policies
 *     this.bucket = new aws.s3.Bucket(...);
 *   }
 * }
 * ```
 */
export abstract class L1Construct extends pulumi.ComponentResource {
  /** Construct metadata */
  public readonly constructMetadata: Partial<ConstructMetadata>;
  
  /** Construct level (always L1) */
  public readonly level = ConstructLevel.L1;
  
  /** Security considerations applied */
  protected securityConsiderations: SecurityConsideration[] = [];
  
  constructor(
    type: string,
    name: string,
    args: BaseConstructArgs,
    opts?: pulumi.ComponentResourceOptions,
    constructMetadata?: Partial<ConstructMetadata>
  ) {
    const internalOpts = {
      ...opts,
      // Ensure all child resources are parented correctly
      transformations: [
        (args: any) => {
          // Add construct-level tags to all child resources
          if (args.props.tags) {
            args.props.tags = {
              ...args.props.tags,
              'lcc:construct-level': 'L1',
              'lcc:construct-name': name,
              'lcc:parent-construct': type,
              'lcc:managed-by': 'love-claude-code'
            };
          }
          return args;
        },
        ...(opts?.transformations || [])
      ]
    };
    
    super(type, name, args, internalOpts);
    
    this.constructMetadata = {
      level: ConstructLevel.L1,
      ...constructMetadata
    };
  }
  
  /**
   * Initialize the construct resources
   * Must be called in the constructor after super()
   */
  protected abstract initialize(args: any): void;
  
  /**
   * Get the construct definition for documentation
   */
  public abstract getDefinition(): Promise<any>;
  
  /**
   * Apply security best practices to the construct
   */
  protected applySecurityBestPractices(): void {
    // Override in subclasses to implement specific security measures
    this.securityConsiderations.push({
      aspect: 'default-security',
      description: 'L1 constructs include security best practices by default',
      severity: 'medium',
      recommendations: [
        'Review and adjust security settings based on your requirements',
        'Enable additional security features as needed'
      ]
    });
  }
  
  /**
   * Get applied security considerations
   */
  public getSecurityConsiderations(): SecurityConsideration[] {
    return this.securityConsiderations;
  }
  
  /**
   * Validate arguments with enhanced checking
   */
  protected validateArgs(args: any): void {
    if (!args) {
      throw new Error('Arguments are required for L1 constructs');
    }
    // Additional validation in subclasses
  }
  
  /**
   * Register outputs for the construct
   */
  protected registerConstructOutputs(outputs: Record<string, pulumi.Output<any>>): void {
    this.registerOutputs(outputs);
  }
  
  /**
   * Helper to create child resources with proper configuration
   */
  protected createChildResource<T extends pulumi.Resource>(
    type: new (...args: any[]) => T,
    name: string,
    args: any,
    opts?: pulumi.CustomResourceOptions
  ): T {
    return new type(name, args, { ...opts, parent: this });
  }
}