import * as pulumi from '@pulumi/pulumi';
import { ConstructLevel, BaseConstructArgs, ConstructMetadata, SecurityConsideration, CostEstimate } from './types';
import { L1Construct } from './L1Construct';

/**
 * L2 Construct - Pattern constructs for common solutions
 * 
 * L2 constructs implement complete patterns that combine multiple resources:
 * - API + Database patterns
 * - Authentication + User management
 * - File processing pipelines
 * - Event-driven architectures
 * 
 * @example
 * ```typescript
 * class L2ApiPattern extends L2Construct {
 *   public readonly api: L1ApiGateway;
 *   public readonly database: L1Database;
 *   public readonly functions: L1Function[];
 *   
 *   constructor(name: string, args: L2ApiPatternArgs, opts?: pulumi.ComponentResourceOptions) {
 *     super("lcc:patterns:L2ApiPattern", name, args, opts);
 *     
 *     // Create complete API infrastructure
 *     this.api = new L1ApiGateway(...);
 *     this.database = new L1Database(...);
 *     this.functions = this.createFunctions(...);
 *   }
 * }
 * ```
 */
export abstract class L2Construct extends pulumi.ComponentResource {
  /** Construct metadata */
  public readonly constructMetadata: Partial<ConstructMetadata>;
  
  /** Construct level (always L2) */
  public readonly level = ConstructLevel.L2;
  
  /** Child L1 constructs */
  protected childConstructs: L1Construct[] = [];
  
  /** Pattern configuration */
  protected patternConfig: any;
  
  /** Cost tracking */
  protected costEstimate: CostEstimate = {
    baseMonthly: 0,
    usageFactors: []
  };
  
  constructor(
    type: string,
    name: string,
    args: BaseConstructArgs,
    opts?: pulumi.ComponentResourceOptions,
    constructMetadata?: Partial<ConstructMetadata>
  ) {
    const internalOpts = {
      ...opts,
      transformations: [
        (args: any) => {
          // Add pattern-level tags
          if (args.props.tags) {
            args.props.tags = {
              ...args.props.tags,
              'lcc:construct-level': 'L2',
              'lcc:pattern-name': name,
              'lcc:pattern-type': type,
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
      level: ConstructLevel.L2,
      ...constructMetadata
    };
  }
  
  /**
   * Initialize the pattern with all required resources
   */
  protected abstract initializePattern(args: any): void;
  
  /**
   * Get the construct definition for documentation
   */
  public abstract getDefinition(): Promise<any>;
  
  /**
   * Get all child constructs
   */
  public getChildConstructs(): L1Construct[] {
    return this.childConstructs;
  }
  
  /**
   * Create and register an L1 construct as part of this pattern
   */
  protected createL1Construct<T extends L1Construct>(
    type: new (...args: any[]) => T,
    name: string,
    args: any,
    opts?: pulumi.ComponentResourceOptions
  ): T {
    const construct = new type(name, args, { ...opts, parent: this });
    this.childConstructs.push(construct);
    return construct;
  }
  
  /**
   * Apply pattern-specific optimizations
   */
  protected applyPatternOptimizations(): void {
    // Override in subclasses for specific optimizations
  }
  
  /**
   * Calculate and update cost estimate
   */
  protected updateCostEstimate(): void {
    // Aggregate costs from child constructs
    this.costEstimate.baseMonthly = this.childConstructs.reduce((total, child) => {
      // In real implementation, would get cost from child
      return total + 0;
    }, 0);
  }
  
  /**
   * Get the current cost estimate
   */
  public getCostEstimate(): CostEstimate {
    return this.costEstimate;
  }
  
  /**
   * Validate pattern configuration
   */
  protected validatePatternConfig(config: any): void {
    if (!config) {
      throw new Error('Pattern configuration is required for L2 constructs');
    }
    // Additional validation in subclasses
  }
  
  /**
   * Wire up connections between child constructs
   */
  protected abstract wireConnections(): void;
  
  /**
   * Register pattern outputs
   */
  protected registerPatternOutputs(outputs: Record<string, pulumi.Output<any>>): void {
    this.registerOutputs({
      pattern: this.constructMetadata.name,
      level: 'L2',
      ...outputs
    });
  }
  
  /**
   * Get pattern health checks
   */
  public getHealthChecks(): pulumi.Output<any>[] {
    // Override in subclasses to provide health check endpoints
    return [];
  }
  
  /**
   * Get monitoring configuration
   */
  public getMonitoringConfig(): any {
    return {
      pattern: this.constructMetadata.name,
      metrics: this.getPatternMetrics(),
      alarms: this.getPatternAlarms()
    };
  }
  
  /**
   * Define pattern-specific metrics
   */
  protected getPatternMetrics(): any[] {
    // Override in subclasses
    return [];
  }
  
  /**
   * Define pattern-specific alarms
   */
  protected getPatternAlarms(): any[] {
    // Override in subclasses
    return [];
  }
}