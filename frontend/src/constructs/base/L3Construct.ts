import { BaseConstruct } from './BaseConstruct';
import { 
  ConstructLevel, 
  ConstructMetadata, 
  ConstructDependency,
  L3ApplicationConstruct,
  L2PatternConstruct
} from '../types';

/**
 * Base class for L3 Application constructs
 * L3 constructs represent complete, production-ready applications
 * that compose multiple L2 patterns into working systems
 */
export abstract class L3Construct extends BaseConstruct implements L3ApplicationConstruct {
  
  // Application-specific properties
  protected _patterns: Map<string, L2PatternConstruct> = new Map();
  protected _environment: 'development' | 'production' = 'development';
  protected _buildConfig: Record<string, any> = {};
  protected _deploymentConfig: Record<string, any> = {};
  
  constructor(metadata: ConstructMetadata) {
    super({
      ...metadata,
      level: ConstructLevel.L3,
      type: 'Application' as any,
      inputs: [],
      outputs: [],
      security: [],
      cost: {
        baseMonthly: 0,
        usageFactors: []
      },
      c4: {
        type: 'System'
      },
      examples: [],
      bestPractices: [],
      deployment: {
        requiredProviders: [],
        configSchema: {}
      }
    });
    this.validateL3Constraints();
  }
  
  /**
   * Validate L3 specific constraints
   */
  protected validateL3Constraints(): void {
    // L3 constructs must have at least one L2 dependency
    const dependencies = this.definition.dependencies || [];
    const hasL2Dependency = dependencies.some((dep: any) => dep.level === 'L2');
    if (!hasL2Dependency && dependencies.length > 0) {
      console.warn(`L3 construct ${this.id} should compose L2 patterns`);
    }
    
    // L3 constructs cannot depend on other L3 constructs (to avoid circular dependencies)
    const hasL3Dependency = dependencies.some((dep: any) => dep.level === 'L3');
    if (hasL3Dependency) {
      throw new Error(`L3 construct ${this.id} cannot depend on other L3 constructs`);
    }
  }
  
  // Required methods from L3ApplicationConstruct interface
  getType() {
    return this.definition.type;
  }
  
  getLevel() {
    return ConstructLevel.L3;
  }
  
  get level(): ConstructLevel.L3 {
    return ConstructLevel.L3;
  }
  
  /**
   * Add a pattern to the application
   */
  protected addPattern(pattern: L2PatternConstruct): void {
    this._patterns.set(pattern.id, pattern);
  }
  
  /**
   * Get all patterns in the application
   */
  public getPatterns(): L2PatternConstruct[] {
    return Array.from(this._patterns.values());
  }
  
  /**
   * Set the application environment
   */
  public setEnvironment(env: 'development' | 'production'): void {
    this._environment = env;
    this.updateConfiguration();
  }
  
  /**
   * Get the current environment
   */
  public getEnvironment(): 'development' | 'production' {
    return this._environment;
  }
  
  /**
   * Update configuration based on environment
   */
  protected abstract updateConfiguration(): void;
  
  /**
   * Build the application
   */
  public abstract build(): Promise<void>;
  
  /**
   * Deploy the application
   */
  public abstract deploy(): Promise<void>;
  
  /**
   * Start the application in development mode
   */
  public abstract startDevelopment(): Promise<void>;
  
  /**
   * Start the application in production mode
   */
  public abstract startProduction(): Promise<void>;
  
  /**
   * Get application health status
   */
  public abstract getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, any>;
  }>;
  
  /**
   * Get application metrics
   */
  public abstract getMetrics(): Promise<Record<string, any>>;
  
  /**
   * Validate the application configuration
   */
  public validateConfiguration(): boolean {
    // Check all patterns are properly configured
    for (const pattern of this._patterns.values()) {
      if (!pattern.validate()) {
        console.error(`Pattern ${pattern.id} validation failed`);
        return false;
      }
    }
    
    // Check environment-specific configuration
    if (this._environment === 'production') {
      return this.validateProductionConfig();
    }
    
    return true;
  }
  
  /**
   * Validate production configuration
   */
  protected validateProductionConfig(): boolean {
    // Override in subclasses for specific validation
    return true;
  }
  
  /**
   * Get application version
   */
  public abstract getVersion(): string;
  
  /**
   * Get application metadata for self-referential tracking
   */
  public getApplicationMetadata(): Record<string, any> {
    return {
      ...this.metadata,
      patterns: Array.from(this._patterns.keys()),
      environment: this._environment,
      buildConfig: this._buildConfig,
      deploymentConfig: this._deploymentConfig,
      version: this.getVersion()
    };
  }
}