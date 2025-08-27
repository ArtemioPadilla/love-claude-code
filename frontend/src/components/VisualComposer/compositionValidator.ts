/**
 * Composition Validator
 * 
 * Validates visual construct compositions for correctness
 */

import { Node, Edge } from 'reactflow'
import { ConstructDisplay, ConstructLevel } from '../../constructs/types'

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  nodeValidations: Record<string, NodeValidation>
}

interface NodeValidation {
  valid: boolean
  errors: string[]
}

/**
 * Validate a composition
 */
export function validateComposition(
  nodes: Node<{
    construct: ConstructDisplay
    config: Record<string, any>
  }>[],
  edges: Edge[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    nodeValidations: {}
  }
  
  // Initialize node validations
  nodes.forEach(node => {
    result.nodeValidations[node.id] = { valid: true, errors: [] }
  })
  
  // Check for empty composition
  if (nodes.length === 0) {
    result.errors.push('Composition is empty. Add at least one construct.')
    result.valid = false
    return result
  }
  
  // Validate individual nodes
  nodes.forEach(node => {
    const nodeValidation = validateNode(node)
    result.nodeValidations[node.id] = nodeValidation
    
    if (!nodeValidation.valid) {
      result.valid = false
      nodeValidation.errors.forEach(error => {
        result.errors.push(`${node.data.construct.definition.name}: ${error}`)
      })
    }
  })
  
  // Validate connections
  const connectionValidation = validateConnections(nodes, edges)
  result.errors.push(...connectionValidation.errors)
  result.warnings.push(...connectionValidation.warnings)
  
  if (connectionValidation.errors.length > 0) {
    result.valid = false
  }
  
  // Check for circular dependencies
  const circularCheck = checkCircularDependencies(nodes, edges)
  if (!circularCheck.valid) {
    result.valid = false
    result.errors.push(...circularCheck.errors)
  }
  
  // Validate level constraints
  const levelValidation = validateLevelConstraints(nodes, edges)
  result.warnings.push(...levelValidation.warnings)
  
  if (levelValidation.errors.length > 0) {
    result.valid = false
    result.errors.push(...levelValidation.errors)
  }
  
  return result
}

/**
 * Validate individual node configuration
 */
function validateNode(
  node: Node<{
    construct: ConstructDisplay
    config: Record<string, any>
  }>
): NodeValidation {
  const validation: NodeValidation = { valid: true, errors: [] }
  const { construct, config } = node.data
  const definition = construct.definition
  
  // Check required inputs
  definition.inputs?.forEach(input => {
    if (input.required && !config[input.name]) {
      validation.errors.push(`Required property '${input.name}' is not configured`)
      validation.valid = false
    }
    
    // Validate property types
    if (config[input.name] !== undefined) {
      const value = config[input.name]
      const isValidType = validatePropertyType(value, input.type)
      
      if (!isValidType) {
        validation.errors.push(`Property '${input.name}' has invalid type. Expected ${input.type}`)
        validation.valid = false
      }
      
      // Validate against constraints
      if (input.validation) {
        const constraintErrors = validateConstraints(value, input.validation, input.name)
        validation.errors.push(...constraintErrors)
        if (constraintErrors.length > 0) {
          validation.valid = false
        }
      }
    }
  })
  
  return validation
}

/**
 * Validate property type
 */
function validatePropertyType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string': {
      return typeof value === 'string'
    }
    case 'number': {
      return typeof value === 'number' && !isNaN(value)
    }
    case 'boolean': {
      return typeof value === 'boolean'
    }
    case 'array': {
      return Array.isArray(value)
    }
    case 'object': {
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    }
    case 'function': {
      return typeof value === 'function' || typeof value === 'string' // Allow function strings
    }
    default: {
      return true // Unknown types pass validation
    }
  }
}

/**
 * Validate property constraints
 */
function validateConstraints(
  value: any,
  constraints: any,
  propertyName: string
): string[] {
  const errors: string[] = []
  
  if (constraints.min !== undefined && value < constraints.min) {
    errors.push(`${propertyName} must be at least ${constraints.min}`)
  }
  
  if (constraints.max !== undefined && value > constraints.max) {
    errors.push(`${propertyName} must be at most ${constraints.max}`)
  }
  
  if (constraints.pattern && typeof value === 'string') {
    const regex = new RegExp(constraints.pattern)
    if (!regex.test(value)) {
      errors.push(`${propertyName} does not match required pattern`)
    }
  }
  
  if (constraints.enum && !constraints.enum.includes(value)) {
    errors.push(`${propertyName} must be one of: ${constraints.enum.join(', ')}`)
  }
  
  return errors
}

/**
 * Validate connections between nodes
 */
function validateConnections(
  nodes: Node[],
  edges: Edge[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)
    
    if (!sourceNode || !targetNode) {
      errors.push('Invalid connection: node not found')
      return
    }
    
    const sourceConstruct = sourceNode.data.construct.definition
    const targetConstruct = targetNode.data.construct.definition
    
    // Extract handle names
    const outputName = edge.sourceHandle?.replace('output-', '') || 'default'
    const inputName = edge.targetHandle?.replace('input-', '') || 'default'
    
    // Find output and input definitions
    const output = sourceConstruct.outputs?.find((o: any) => o.name === outputName)
    const input = targetConstruct.inputs?.find((i: any) => i.name === inputName)
    
    if (!output) {
      errors.push(`Output '${outputName}' not found on ${sourceConstruct.name}`)
    }
    
    if (!input) {
      errors.push(`Input '${inputName}' not found on ${targetConstruct.name}`)
    }
    
    // Type compatibility check
    if (output && input && output.type !== input.type) {
      warnings.push(
        `Type mismatch: ${sourceConstruct.name}.${outputName} (${output.type}) → ` +
        `${targetConstruct.name}.${inputName} (${input.type})`
      )
    }
  })
  
  return { errors, warnings }
}

/**
 * Check for circular dependencies
 */
function checkCircularDependencies(
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const graph = new Map<string, Set<string>>()
  
  // Build adjacency list
  nodes.forEach(node => {
    graph.set(node.id, new Set())
  })
  
  edges.forEach(edge => {
    graph.get(edge.source)?.add(edge.target)
  })
  
  // DFS to detect cycles
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCycle(nodeId: string, path: string[] = []): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)
    
    const neighbors = graph.get(nodeId) || new Set()
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, [...path])) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor)
        const cycle = path.slice(cycleStart).concat(neighbor)
        const nodeNames = cycle.map(id => {
          const node = nodes.find(n => n.id === id)
          return node?.data.construct.definition.name || id
        })
        errors.push(`Circular dependency detected: ${nodeNames.join(' → ')}`)
        return true
      }
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // Check each unvisited node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      hasCycle(node.id)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate level constraints
 */
function validateLevelConstraints(
  nodes: Node[],
  edges: Edge[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  
  const levelOrder = {
    [ConstructLevel.L0]: 0,
    [ConstructLevel.L1]: 1,
    [ConstructLevel.L2]: 2,
    [ConstructLevel.L3]: 3
  }
  
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)
    
    if (!sourceNode || !targetNode) return
    
    const sourceLevel = sourceNode.data.construct.definition.level as ConstructLevel
    const targetLevel = targetNode.data.construct.definition.level as ConstructLevel
    
    const sourceLevelNum = levelOrder[sourceLevel]
    const targetLevelNum = levelOrder[targetLevel]
    
    // Higher level constructs should not depend on lower level ones
    if (sourceLevelNum > targetLevelNum + 1) {
      warnings.push(
        `${sourceNode.data.construct.definition.name} (${sourceLevel}) depends on ` +
        `${targetNode.data.construct.definition.name} (${targetLevel}). ` +
        `Consider using an intermediate level construct.`
      )
    }
    
    // L0 constructs should not depend on anything
    if (targetLevel === ConstructLevel.L0 && edges.some(e => e.target === targetNode.id)) {
      errors.push(
        `L0 primitive ${targetNode.data.construct.definition.name} cannot have dependencies`
      )
    }
  })
  
  return { errors, warnings }
}