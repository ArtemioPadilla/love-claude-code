/**
 * External Integration Patterns (L2)
 * 
 * Collection of patterns for integrating external tools and services
 * with security, isolation, and management capabilities.
 */

export * from './ExternalLibraryPattern'
export * from './MCPServerIntegrationPattern'
export * from './ContainerizedServicePattern'
export * from './APIAggregationPattern'
export * from './PluginSystemPattern'

// Re-export pattern classes for easy access
export { ExternalLibraryPattern } from './ExternalLibraryPattern'
export { MCPServerIntegrationPattern } from './MCPServerIntegrationPattern'
export { ContainerizedServicePattern } from './ContainerizedServicePattern'
export { APIAggregationPattern } from './APIAggregationPattern'
export { PluginSystemPattern } from './PluginSystemPattern'