import * as pulumi from '@pulumi/pulumi';
import { ConstructLevel, BaseConstructArgs, ConstructMetadata, SecurityConsideration, CostEstimate, DeploymentConfig } from './types';
import { L2Construct } from './L2Construct';
import { L1Construct } from './L1Construct';

/**
 * L3 Construct - Complete application constructs
 * 
 * L3 constructs represent full applications combining multiple L2 patterns:
 * - E-commerce platforms
 * - SaaS applications  
 * - Content management systems
 * - Analytics dashboards
 * 
 * @example
 * ```typescript
 * class L3EcommerceApp extends L3Construct {
 *   public readonly frontend: L2StaticWebsite;
 *   public readonly api: L2ApiPattern;
 *   public readonly auth: L2AuthService;
 *   public readonly payments: L2PaymentService;
 *   
 *   constructor(name: string, args: L3EcommerceArgs, opts?: pulumi.ComponentResourceOptions) {
 *     super("lcc:apps:L3EcommerceApp", name, args, opts);
 *     
 *     // Create complete e-commerce infrastructure
 *     this.frontend = new L2StaticWebsite(...);
 *     this.api = new L2ApiPattern(...);
 *     this.auth = new L2AuthService(...);
 *     this.payments = new L2PaymentService(...);
 *     
 *     // Wire everything together
 *     this.wireApplication();
 *   }
 * }
 * ```
 */
export abstract class L3Construct extends pulumi.ComponentResource {
  /** Construct metadata */
  public readonly constructMetadata: Partial<ConstructMetadata>;
  
  /** Construct level (always L3) */
  public readonly level = ConstructLevel.L3;
  
  /** Child L2 patterns */
  protected patterns: L2Construct[] = [];
  
  /** Direct L1 constructs (if any) */
  protected directConstructs: L1Construct[] = [];
  
  /** Application configuration */
  protected applicationConfig: any;
  
  /** Deployment configuration */
  protected deploymentConfig: DeploymentConfig;
  
  /** Total cost estimate */
  protected totalCostEstimate: CostEstimate = {
    baseMonthly: 0,
    usageFactors: []
  };
  
  /** Application endpoints */
  protected endpoints: Record<string, pulumi.Output<string>> = {};
  
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
          // Add application-level tags
          if (args.props.tags) {
            args.props.tags = {
              ...args.props.tags,
              'lcc:construct-level': 'L3',
              'lcc:application-name': name,
              'lcc:application-type': type,
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
      level: ConstructLevel.L3,
      ...constructMetadata
    };
    
    this.deploymentConfig = {
      requiredProviders: [],
      configSchema: {}
    };
  }
  
  /**
   * Initialize the complete application
   */
  protected abstract initializeApplication(args: any): void;
  
  /**
   * Wire all patterns together into a cohesive application
   */
  protected abstract wireApplication(): void;
  
  /**
   * Get the construct definition for documentation
   */
  public abstract getDefinition(): Promise<any>;
  
  /**
   * Create and register an L2 pattern
   */
  protected createPattern<T extends L2Construct>(
    type: new (...args: any[]) => T,
    name: string,
    args: any,
    opts?: pulumi.ComponentResourceOptions
  ): T {
    const pattern = new type(name, args, { ...opts, parent: this });
    this.patterns.push(pattern);
    return pattern;
  }
  
  /**
   * Get all patterns in this application
   */
  public getPatterns(): L2Construct[] {
    return this.patterns;
  }
  
  /**
   * Get all constructs (patterns + direct constructs)
   */
  public getAllConstructs(): (L1Construct | L2Construct)[] {
    return [...this.patterns, ...this.directConstructs];
  }
  
  /**
   * Calculate total cost across all patterns
   */
  protected calculateTotalCost(): void {
    this.totalCostEstimate.baseMonthly = this.patterns.reduce((total, pattern) => {
      const patternCost = pattern.getCostEstimate();
      return total + patternCost.baseMonthly;
    }, 0);
    
    // Aggregate usage factors
    const factorMap = new Map<string, any>();
    this.patterns.forEach(pattern => {
      const patternCost = pattern.getCostEstimate();
      patternCost.usageFactors.forEach(factor => {
        if (factorMap.has(factor.name)) {
          const existing = factorMap.get(factor.name);
          existing.typicalUsage = (existing.typicalUsage || 0) + (factor.typicalUsage || 0);
        } else {
          factorMap.set(factor.name, { ...factor });
        }
      });
    });
    
    this.totalCostEstimate.usageFactors = Array.from(factorMap.values());
  }
  
  /**
   * Get the total cost estimate
   */
  public getTotalCostEstimate(): CostEstimate {
    this.calculateTotalCost();
    return this.totalCostEstimate;
  }
  
  /**
   * Get application endpoints
   */
  public getEndpoints(): Record<string, pulumi.Output<string>> {
    return this.endpoints;
  }
  
  /**
   * Register application endpoints
   */
  protected registerEndpoints(endpoints: Record<string, pulumi.Output<string>>): void {
    this.endpoints = { ...this.endpoints, ...endpoints };
  }
  
  /**
   * Get deployment configuration
   */
  public getDeploymentConfig(): DeploymentConfig {
    // Aggregate required providers from all patterns
    const providers = new Set<string>();
    this.patterns.forEach(pattern => {
      // In real implementation, would get from pattern metadata
      providers.add('aws');
    });
    
    this.deploymentConfig.requiredProviders = Array.from(providers);
    return this.deploymentConfig;
  }
  
  /**
   * Perform pre-deployment validation
   */
  public async validateDeployment(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Validate all patterns
    for (const pattern of this.patterns) {
      try {
        // Pattern-specific validation
        await pattern.getDefinition();
      } catch (error) {
        errors.push(`Pattern ${pattern.constructor.name}: ${error}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get application health dashboard configuration
   */
  public getHealthDashboard(): any {
    return {
      application: this.constructMetadata.name,
      patterns: this.patterns.map(p => ({
        name: p.constructor.name,
        healthChecks: p.getHealthChecks()
      })),
      endpoints: this.endpoints
    };
  }
  
  /**
   * Register application outputs
   */
  protected registerApplicationOutputs(outputs: Record<string, pulumi.Output<any>>): void {
    this.registerOutputs({
      application: this.constructMetadata.name,
      level: 'L3',
      endpoints: this.endpoints,
      ...outputs
    });
  }
  
  /**
   * Generate application documentation
   */
  public async generateDocumentation(): Promise<string> {
    const patterns = await Promise.all(
      this.patterns.map(p => p.getDefinition())
    );
    
    return `
# ${this.constructMetadata.name}

${this.constructMetadata.description}

## Architecture

This L3 application consists of ${this.patterns.length} patterns:

${patterns.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Endpoints

${Object.entries(this.endpoints).map(([name, endpoint]) => `- ${name}: ${endpoint}`).join('\n')}

## Deployment

Required providers: ${this.deploymentConfig.requiredProviders.join(', ')}

## Cost Estimate

Base monthly cost: $${this.totalCostEstimate.baseMonthly}
    `;
  }
}