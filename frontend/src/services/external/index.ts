/**
 * External Integration Services
 * 
 * Services for managing external integrations including security scanning,
 * resource monitoring, license checking, and version management.
 */

export * from './SecurityScanner'
export * from './ResourceMonitor'
export * from './ExternalIntegrationManager'
export * from './LicenseChecker'
export * from './VersionManager'

// Re-export singleton instances for convenience
export { securityScanner } from './SecurityScanner'
export { resourceMonitor } from './ResourceMonitor'
export { integrationManager } from './ExternalIntegrationManager'
export { licenseChecker } from './LicenseChecker'
export { versionManager } from './VersionManager'