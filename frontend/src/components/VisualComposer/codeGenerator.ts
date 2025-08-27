/**
 * Code Generator for Visual Construct Composer
 * 
 * Generates TypeScript/JavaScript code from visual compositions
 */

import { Node, Edge } from 'reactflow'
import { ConstructDisplay, ConstructLevel } from '../../constructs/types'

interface CompositionData {
  name: string
  nodes: Node<{
    construct: ConstructDisplay
    config: Record<string, any>
  }>[]
  edges: Edge[]
}

/**
 * Generate code from a visual composition
 */
export function generateCompositionCode(composition: CompositionData): string {
  const { name, nodes, edges } = composition
  
  // Build dependency graph
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const dependencies = buildDependencyGraph(nodes, edges)
  
  // Sort nodes by dependency order
  const sortedNodes = topologicalSort(nodes, dependencies)
  
  // Generate imports
  const imports = generateImports(sortedNodes)
  
  // Generate component code
  const componentCode = generateComponent(name, sortedNodes, edges, nodeMap)
  
  // Generate exports
  const exports = generateExports(name)
  
  return `${imports}\n\n${componentCode}\n\n${exports}`
}

/**
 * Build dependency graph from edges
 */
function buildDependencyGraph(
  nodes: Node[],
  edges: Edge[]
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  
  nodes.forEach(node => {
    graph.set(node.id, new Set())
  })
  
  edges.forEach(edge => {
    const deps = graph.get(edge.target)
    if (deps) {
      deps.add(edge.source)
    }
  })
  
  return graph
}

/**
 * Topological sort to determine proper initialization order
 */
function topologicalSort(
  nodes: Node[],
  dependencies: Map<string, Set<string>>
): Node[] {
  const sorted: Node[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  
  function visit(nodeId: string) {
    if (visited.has(nodeId)) return
    if (visiting.has(nodeId)) {
      throw new Error('Circular dependency detected')
    }
    
    visiting.add(nodeId)
    
    const deps = dependencies.get(nodeId)
    if (deps) {
      deps.forEach(depId => visit(depId))
    }
    
    visiting.delete(nodeId)
    visited.add(nodeId)
    
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      sorted.push(node)
    }
  }
  
  nodes.forEach(node => visit(node.id))
  
  return sorted
}

/**
 * Generate import statements
 */
function generateImports(nodes: Node[]): string {
  const imports: string[] = [
    `import React from 'react'`
  ]
  
  // Collect unique constructs
  const constructImports = new Map<string, Set<string>>()
  
  nodes.forEach(node => {
    const construct = node.data.construct.definition
    const level = construct.level
    const name = construct.name
    
    // Group by import path
    const importPath = `@/constructs/${level}/${construct.type}/${name}`
    
    if (!constructImports.has(importPath)) {
      constructImports.set(importPath, new Set())
    }
    
    constructImports.get(importPath)?.add(name)
  })
  
  // Generate import statements
  constructImports.forEach((names, path) => {
    const nameList = Array.from(names).join(', ')
    imports.push(`import { ${nameList} } from '${path}'`)
  })
  
  return imports.join('\n')
}

/**
 * Generate the main component code
 */
function generateComponent(
  name: string,
  nodes: Node[],
  edges: Edge[],
  nodeMap: Map<string, Node>
): string {
  const componentName = toPascalCase(name)
  
  let code = `export const ${componentName}: React.FC = () => {`
  
  // Generate state and refs if needed
  const stateCode = generateStateCode(nodes)
  if (stateCode) {
    code += `\n  ${stateCode}\n`
  }
  
  // Generate construct instances
  code += '\n  // Initialize constructs\n'
  nodes.forEach(node => {
    code += generateNodeInstance(node, edges, nodeMap)
  })
  
  // Generate connections
  const connectionCode = generateConnections(edges, nodeMap)
  if (connectionCode) {
    code += '\n  // Connect constructs\n'
    code += connectionCode
  }
  
  // Generate render method
  code += '\n  return (\n'
  code += generateRenderCode(nodes, edges)
  code += '\n  )\n'
  code += '}'
  
  return code
}

/**
 * Generate state management code
 */
function generateStateCode(nodes: Node[]): string {
  const stateVariables: string[] = []
  
  nodes.forEach(node => {
    const construct = node.data.construct.definition
    
    // Check if construct needs state
    if (construct.outputs?.some((o: any) => o.type.includes('state'))) {
      const varName = toCamelCase(node.data.construct.definition.name)
      stateVariables.push(`const [${varName}State, set${toPascalCase(varName)}State] = useState()`)
    }
  })
  
  return stateVariables.join('\n  ')
}

/**
 * Generate instance code for a node
 */
function generateNodeInstance(
  node: Node,
  edges: Edge[],
  nodeMap: Map<string, Node>
): string {
  const construct = node.data.construct.definition
  const config = node.data.config
  const varName = toCamelCase(construct.name) + '_' + node.id.substring(0, 6)
  
  // Find input connections
  const inputConnections = edges.filter(e => e.target === node.id)
  
  // Build props object
  const props: string[] = []
  
  // Add configured properties
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      props.push(`    ${key}: ${JSON.stringify(value)}`)
    }
  })
  
  // Add connected inputs
  inputConnections.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source)
    if (sourceNode) {
      const sourceVarName = toCamelCase(sourceNode.data.construct.definition.name) + '_' + edge.source.substring(0, 6)
      const targetHandle = edge.targetHandle?.replace('input-', '') || 'input'
      props.push(`    ${targetHandle}: ${sourceVarName}`)
    }
  })
  
  if (props.length > 0) {
    return `  const ${varName} = {\n${props.join(',\n')}\n  }\n`
  } else {
    return `  const ${varName} = {}\n`
  }
}

/**
 * Generate connection code
 */
function generateConnections(edges: Edge[], nodeMap: Map<string, Node>): string {
  const connections: string[] = []
  
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)
    
    if (sourceNode && targetNode) {
      const sourceVar = toCamelCase(sourceNode.data.construct.definition.name) + '_' + edge.source.substring(0, 6)
      const targetVar = toCamelCase(targetNode.data.construct.definition.name) + '_' + edge.target.substring(0, 6)
      const outputHandle = edge.sourceHandle?.replace('output-', '') || 'output'
      const inputHandle = edge.targetHandle?.replace('input-', '') || 'input'
      
      connections.push(`  // Connect ${sourceNode.data.construct.definition.name} -> ${targetNode.data.construct.definition.name}`)
      connections.push(`  ${targetVar}.${inputHandle} = ${sourceVar}.${outputHandle}`)
    }
  })
  
  return connections.join('\n')
}

/**
 * Generate render code
 */
function generateRenderCode(nodes: Node[], edges: Edge[]): string {
  // Find root nodes (no incoming edges)
  const rootNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  )
  
  if (rootNodes.length === 0 && nodes.length > 0) {
    // If no root nodes, render all nodes
    rootNodes.push(...nodes)
  }
  
  const renderLines: string[] = ['    <>']
  
  rootNodes.forEach(node => {
    const construct = node.data.construct.definition
    const varName = toCamelCase(construct.name) + '_' + node.id.substring(0, 6)
    
    renderLines.push(`      <${construct.name} {...${varName}} />`)
  })
  
  renderLines.push('    </>')
  
  return renderLines.join('\n')
}

/**
 * Generate exports
 */
function generateExports(name: string): string {
  const componentName = toPascalCase(name)
  return `export default ${componentName}`
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, _index) => word.toUpperCase())
    .replace(/\s+/g, '')
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}