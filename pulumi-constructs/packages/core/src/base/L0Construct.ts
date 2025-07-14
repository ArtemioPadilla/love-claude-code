import * as pulumi from '@pulumi/pulumi';
import { ConstructLevel, BaseConstructArgs, ConstructMetadata } from './types';

/**
 * L0 Construct - Primitive cloud resources
 * 
 * L0 constructs are direct mappings to cloud provider resources with minimal abstraction.
 * They provide maximum control but require explicit configuration of all properties.
 * 
 * @example
 * ```typescript
 * class L0S3Bucket extends L0Construct {
 *   constructor(name: string, args: S3BucketArgs, opts?: pulumi.CustomResourceOptions) {
 *     super("aws:s3:Bucket", name, args, opts);
 *   }
 * }
 * ```
 */
export abstract class L0Construct extends pulumi.CustomResource {
  /** Construct metadata */
  public readonly constructMetadata: Partial<ConstructMetadata>;
  
  /** Construct level (always L0) */
  public readonly level = ConstructLevel.L0;
  
  constructor(
    type: string,
    name: string,
    args: any,
    opts?: pulumi.CustomResourceOptions,
    constructMetadata?: Partial<ConstructMetadata>
  ) {
    // Ensure resource has proper tags
    const taggedArgs = {
      ...args,
      tags: {
        ...args.tags,
        'lcc:construct-level': 'L0',
        'lcc:construct-name': name,
        'lcc:managed-by': 'love-claude-code'
      }
    };
    
    super(type, name, taggedArgs, opts);
    
    this.constructMetadata = {
      level: ConstructLevel.L0,
      ...constructMetadata
    };
  }
  
  /**
   * Get the construct definition for documentation
   */
  public abstract getDefinition(): Promise<any>;
  
  /**
   * Validate the construct configuration
   */
  protected validateArgs(args: any): void {
    // Override in subclasses for specific validation
  }
  
  /**
   * Apply security best practices
   * L0 constructs have minimal security defaults
   */
  protected applySecurityDefaults(args: any): any {
    return args;
  }
}