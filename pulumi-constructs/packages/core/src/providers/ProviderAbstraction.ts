import * as pulumi from '@pulumi/pulumi';
import { CloudProvider } from '../base/types';

/**
 * Base provider configuration
 */
export interface ProviderConfig {
  /** Provider type */
  provider: CloudProvider;
  /** Region or location */
  region?: string;
  /** Project ID (for GCP/Firebase) */
  projectId?: string;
  /** Additional provider-specific configuration */
  config?: Record<string, any>;
}

/**
 * Cross-provider resource interfaces
 */

/**
 * Storage interface for cross-provider object storage
 */
export interface IStorage {
  /** Create a storage bucket/container */
  createBucket(name: string, config?: any): pulumi.Output<string>;
  /** Upload an object */
  uploadObject(bucket: string, key: string, content: pulumi.Output<string>): pulumi.Output<string>;
  /** Get object URL */
  getObjectUrl(bucket: string, key: string): pulumi.Output<string>;
  /** Enable versioning */
  enableVersioning(bucket: string): void;
  /** Set lifecycle rules */
  setLifecycleRules(bucket: string, rules: any[]): void;
}

/**
 * Database interface for cross-provider databases
 */
export interface IDatabase {
  /** Create a database instance */
  createDatabase(name: string, config?: any): pulumi.Output<string>;
  /** Create a table/collection */
  createTable(database: string, table: string, schema?: any): pulumi.Output<string>;
  /** Enable backups */
  enableBackups(database: string, config?: any): void;
  /** Set scaling configuration */
  setScaling(database: string, config?: any): void;
}

/**
 * Compute interface for cross-provider functions
 */
export interface ICompute {
  /** Create a serverless function */
  createFunction(name: string, code: pulumi.asset.Asset, config?: any): pulumi.Output<string>;
  /** Set function triggers */
  setTriggers(functionName: string, triggers: any[]): void;
  /** Configure environment variables */
  setEnvironment(functionName: string, env: Record<string, string>): void;
  /** Set resource limits */
  setResourceLimits(functionName: string, limits: any): void;
}

/**
 * Authentication interface
 */
export interface IAuth {
  /** Create user pool/auth instance */
  createUserPool(name: string, config?: any): pulumi.Output<string>;
  /** Configure identity providers */
  configureProviders(pool: string, providers: any[]): void;
  /** Set password policies */
  setPasswordPolicy(pool: string, policy: any): void;
  /** Enable MFA */
  enableMFA(pool: string, config?: any): void;
}

/**
 * API Gateway interface
 */
export interface IApiGateway {
  /** Create API gateway */
  createApi(name: string, config?: any): pulumi.Output<string>;
  /** Add route */
  addRoute(api: string, path: string, method: string, target: string): void;
  /** Configure CORS */
  configureCors(api: string, config: any): void;
  /** Add authorizer */
  addAuthorizer(api: string, authorizer: any): void;
}

/**
 * Abstract provider factory
 */
export abstract class ProviderAbstraction {
  protected config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    this.config = config;
  }
  
  /** Get storage service */
  abstract getStorage(): IStorage;
  
  /** Get database service */
  abstract getDatabase(): IDatabase;
  
  /** Get compute service */
  abstract getCompute(): ICompute;
  
  /** Get auth service */
  abstract getAuth(): IAuth;
  
  /** Get API gateway service */
  abstract getApiGateway(): IApiGateway;
  
  /** Get provider-specific service */
  abstract getCustomService(service: string): any;
  
  /** Validate provider configuration */
  protected validateConfig(): void {
    if (!this.config.provider) {
      throw new Error('Provider type is required');
    }
  }
  
  /** Get provider type */
  public getProviderType(): CloudProvider {
    return this.config.provider;
  }
  
  /** Get region/location */
  public getRegion(): string | undefined {
    return this.config.region;
  }
}

/**
 * Provider registry for managing multiple providers
 */
export class ProviderRegistry {
  private static providers = new Map<CloudProvider, typeof ProviderAbstraction>();
  
  /**
   * Register a provider implementation
   */
  static register(provider: CloudProvider, implementation: typeof ProviderAbstraction): void {
    this.providers.set(provider, implementation);
  }
  
  /**
   * Get a provider implementation
   */
  static getProvider(config: ProviderConfig): ProviderAbstraction {
    const ProviderClass = this.providers.get(config.provider);
    if (!ProviderClass) {
      throw new Error(`Provider ${config.provider} not registered`);
    }
    return new (ProviderClass as any)(config);
  }
  
  /**
   * Check if provider is registered
   */
  static hasProvider(provider: CloudProvider): boolean {
    return this.providers.has(provider);
  }
  
  /**
   * Get all registered providers
   */
  static getRegisteredProviders(): CloudProvider[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Multi-provider resource wrapper
 * Allows using different providers for different resources in the same construct
 */
export class MultiProviderResource {
  private providers: Map<string, ProviderAbstraction> = new Map();
  
  /**
   * Add a provider with an alias
   */
  addProvider(alias: string, provider: ProviderAbstraction): void {
    this.providers.set(alias, provider);
  }
  
  /**
   * Get a provider by alias
   */
  getProvider(alias: string): ProviderAbstraction {
    const provider = this.providers.get(alias);
    if (!provider) {
      throw new Error(`Provider with alias ${alias} not found`);
    }
    return provider;
  }
  
  /**
   * Use a specific provider for a resource
   */
  withProvider<T>(alias: string, fn: (provider: ProviderAbstraction) => T): T {
    const provider = this.getProvider(alias);
    return fn(provider);
  }
}

/**
 * Provider cost calculator interface
 */
export interface IProviderCostCalculator {
  /** Calculate storage costs */
  calculateStorageCost(sizeGB: number, requestsPerMonth: number): number;
  
  /** Calculate compute costs */
  calculateComputeCost(invocationsPerMonth: number, avgDurationMs: number, memoryMB: number): number;
  
  /** Calculate database costs */
  calculateDatabaseCost(storageGB: number, readUnits: number, writeUnits: number): number;
  
  /** Get free tier limits */
  getFreeTierLimits(): any;
}