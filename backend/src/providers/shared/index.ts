// Export all shared utilities
export * from './monitoring.js'
export * from './cache.js'
export * from './resilience.js'

// Re-export commonly used utilities
export { logger } from '../aws/utils/logger.js'

/**
 * Shared utilities for all backend providers
 * 
 * This module provides enterprise-grade utilities that can be used
 * across all provider implementations:
 * 
 * 1. Monitoring - Unified metrics and health checks
 * 2. Caching - Hybrid memory/Redis caching with decorators
 * 3. Resilience - Retry, circuit breaker, bulkhead, and rate limiting
 * 
 * Usage example:
 * ```typescript
 * import { 
 *   UnifiedCacheManager, 
 *   UnifiedMonitoringService,
 *   withRetry,
 *   CircuitBreaker,
 *   cacheable,
 *   trackPerformance
 * } from '../shared/index.js'
 * 
 * class MyProvider {
 *   private cache = new UnifiedCacheManager()
 *   private monitoring = new UnifiedMonitoringService()
 *   private circuitBreaker = new CircuitBreaker()
 *   
 *   @trackPerformance
 *   @cacheable({ ttl: 300 })
 *   async getData(id: string) {
 *     return this.circuitBreaker.execute(() =>
 *       withRetry(() => this.fetchData(id))
 *     )
 *   }
 * }
 * ```
 */