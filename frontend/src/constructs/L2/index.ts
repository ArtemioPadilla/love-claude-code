/**
 * L2 Pattern Constructs Index
 * 
 * Export all L2 patterns that compose L1 configured constructs
 * into domain-specific, reusable patterns.
 */

// Export all patterns
export * from './patterns'

// Export base L2 construct if needed by external consumers
export { L2PatternConstruct } from '../base/L2PatternConstruct'