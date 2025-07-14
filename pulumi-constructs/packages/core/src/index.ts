/**
 * @module @love-claude-code/pulumi-core
 * 
 * Core abstractions for Love Claude Code Pulumi constructs
 */

// Export base types
export * from './base/types';

// Export base construct classes
export { L0Construct } from './base/L0Construct';
export { L1Construct } from './base/L1Construct';
export { L2Construct } from './base/L2Construct';
export { L3Construct } from './base/L3Construct';

// Export provider abstractions
export {
  ProviderConfig,
  IStorage,
  IDatabase,
  ICompute,
  IAuth,
  IApiGateway,
  ProviderAbstraction,
  ProviderRegistry,
  MultiProviderResource,
  IProviderCostCalculator
} from './providers/ProviderAbstraction';

// Export utilities
export * from './utils/validation';
export * from './utils/tagging';
export * from './utils/cost';

// Version
export const VERSION = '0.1.0';