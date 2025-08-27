/**
 * L0 Diagram Primitives
 * Foundation for all diagram visualization in the platform
 */

export { NodePrimitive, createNodePrimitive, nodePrimitiveDefinition } from './NodePrimitive'
export { EdgePrimitive, createEdgePrimitive, edgePrimitiveDefinition } from './EdgePrimitive'

// Re-export definition files for separate imports
export type { NodePrimitive as NodePrimitiveType } from './NodePrimitive'
export type { EdgePrimitive as EdgePrimitiveType } from './EdgePrimitive'