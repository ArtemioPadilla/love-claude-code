/**
 * L0 External Construct Primitives
 * 
 * These primitives provide wrappers for external tools and services,
 * enabling integration with third-party packages, APIs, and command-line tools.
 * 
 * All external constructs are sandboxed and monitored for security and performance.
 */

// Base external construct wrapper
export {
  ExternalConstructPrimitive,
  createExternalConstructPrimitive,
  externalConstructPrimitiveDefinition
} from './ExternalConstructPrimitive'

// MCP server integration
export {
  MCPServerPrimitive,
  createMCPServerPrimitive,
  mcpServerPrimitiveDefinition
} from './MCPServerPrimitive'

// API service wrapper
export {
  APIServicePrimitive,
  createAPIServicePrimitive,
  apiServicePrimitiveDefinition
} from './APIServicePrimitive'

// CLI tool wrapper
export {
  CLIToolPrimitive,
  createCLIToolPrimitive,
  cliToolPrimitiveDefinition
} from './CLIToolPrimitive'

// Import the definitions for the collection
import { externalConstructPrimitiveDefinition } from './ExternalConstructPrimitive'
import { mcpServerPrimitiveDefinition } from './MCPServerPrimitive'
import { apiServicePrimitiveDefinition } from './APIServicePrimitive'
import { cliToolPrimitiveDefinition } from './CLIToolPrimitive'

// Re-export all definitions as a collection
export const externalPrimitiveDefinitions = [
  externalConstructPrimitiveDefinition,
  mcpServerPrimitiveDefinition,
  apiServicePrimitiveDefinition,
  cliToolPrimitiveDefinition
]

// Helper function to register all external primitives
export function registerExternalPrimitives(registry: any): void {
  externalPrimitiveDefinitions.forEach(definition => {
    registry.register(definition)
  })
}