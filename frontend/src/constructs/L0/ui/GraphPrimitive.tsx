import React, { useMemo } from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * Graph data structure types
 */
export interface GraphNode {
  id: string
  data?: any
  x?: number
  y?: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  weight?: number
  data?: any
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  directed: boolean
}

/**
 * L0 Graph Primitive Construct
 * Pure TypeScript graph data structure with algorithms
 * Zero external dependencies - built from scratch
 */
export class GraphPrimitive extends L0UIConstruct {
  private nodes: Map<string, GraphNode> = new Map()
  private adjacencyList: Map<string, Set<string>> = new Map()
  private edges: Map<string, GraphEdge> = new Map()
  private directed: boolean = false
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-graph-primitive',
    name: 'Graph Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Pure TypeScript graph data structure with algorithms',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'visualization', 'data-structure'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['graph', 'primitive', 'algorithms', 'visualization'],
    inputs: [
      {
        name: 'directed',
        type: 'boolean',
        description: 'Whether the graph is directed',
        required: false,
        defaultValue: false
      },
      {
        name: 'initialData',
        type: 'object',
        description: 'Initial graph data',
        required: false,
        defaultValue: { nodes: [], edges: [], directed: false }
      },
      {
        name: 'width',
        type: 'number',
        description: 'Canvas width',
        required: false,
        defaultValue: 800
      },
      {
        name: 'height',
        type: 'number',
        description: 'Canvas height',
        required: false,
        defaultValue: 600
      }
    ],
    outputs: [
      {
        name: 'graphData',
        type: 'object',
        description: 'Current graph data structure'
      },
      {
        name: 'nodeCount',
        type: 'number',
        description: 'Number of nodes in the graph'
      },
      {
        name: 'edgeCount',
        type: 'number',
        description: 'Number of edges in the graph'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'Pure TypeScript'
    },
    examples: [
      {
        title: 'Basic Graph Usage',
        description: 'Create and manipulate a graph',
        code: `const graph = new GraphPrimitive()
await graph.initialize({
  directed: true,
  initialData: {
    nodes: [
      { id: 'A', x: 100, y: 100 },
      { id: 'B', x: 200, y: 200 }
    ],
    edges: [
      { id: 'edge1', source: 'A', target: 'B', weight: 5 }
    ],
    directed: true
  }
})

// Add nodes and edges
graph.addNode({ id: 'C', x: 300, y: 100 })
graph.addEdge({ source: 'B', target: 'C', weight: 3 })

// Run algorithms
const path = graph.shortestPath('A', 'C')
const traversal = graph.bfs('A')`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 InteractiveGraph for production',
      'No performance optimizations for very large graphs',
      'Pure data structure - no visual styling'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 45,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(GraphPrimitive.definition)
  }

  protected async onInitialize(): Promise<void> {
    this.directed = this.getInput<boolean>('directed') || false
    const initialData = this.getInput<GraphData>('initialData')
    
    if (initialData) {
      // Initialize from data
      initialData.nodes.forEach(node => this.addNode(node))
      initialData.edges.forEach(edge => this.addEdge(edge))
    }
    
    this.updateOutputs()
  }

  /**
   * Add a node to the graph
   */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node)
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set())
    }
    this.updateOutputs()
  }

  /**
   * Remove a node from the graph
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId)
    this.adjacencyList.delete(nodeId)
    
    // Remove all edges connected to this node
    const edgesToRemove: string[] = []
    this.edges.forEach((edge, id) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgesToRemove.push(id)
      }
    })
    edgesToRemove.forEach(id => this.edges.delete(id))
    
    // Remove from other nodes' adjacency lists
    this.adjacencyList.forEach(neighbors => {
      neighbors.delete(nodeId)
    })
    
    this.updateOutputs()
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: Omit<GraphEdge, 'id'>): void {
    const id = edge.source + '->' + edge.target
    const fullEdge: GraphEdge = { id, ...edge }
    
    this.edges.set(id, fullEdge)
    
    // Update adjacency list
    const sourceNeighbors = this.adjacencyList.get(edge.source) || new Set()
    sourceNeighbors.add(edge.target)
    this.adjacencyList.set(edge.source, sourceNeighbors)
    
    if (!this.directed) {
      const targetNeighbors = this.adjacencyList.get(edge.target) || new Set()
      targetNeighbors.add(edge.source)
      this.adjacencyList.set(edge.target, targetNeighbors)
    }
    
    this.updateOutputs()
  }

  /**
   * Remove an edge from the graph
   */
  removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId)
    if (!edge) return
    
    this.edges.delete(edgeId)
    
    // Update adjacency list
    const sourceNeighbors = this.adjacencyList.get(edge.source)
    if (sourceNeighbors) {
      sourceNeighbors.delete(edge.target)
    }
    
    if (!this.directed) {
      const targetNeighbors = this.adjacencyList.get(edge.target)
      if (targetNeighbors) {
        targetNeighbors.delete(edge.source)
      }
    }
    
    this.updateOutputs()
  }

  /**
   * Get neighbors of a node
   */
  getNeighbors(nodeId: string): string[] {
    return Array.from(this.adjacencyList.get(nodeId) || [])
  }

  /**
   * Breadth-first search traversal
   */
  bfs(startId: string): string[] {
    const visited = new Set<string>()
    const queue = [startId]
    const result: string[] = []
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      
      if (!visited.has(nodeId)) {
        visited.add(nodeId)
        result.push(nodeId)
        
        const neighbors = this.getNeighbors(nodeId)
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push(neighbor)
          }
        })
      }
    }
    
    return result
  }

  /**
   * Depth-first search traversal
   */
  dfs(startId: string): string[] {
    const visited = new Set<string>()
    const result: string[] = []
    
    const dfsRecursive = (nodeId: string) => {
      visited.add(nodeId)
      result.push(nodeId)
      
      const neighbors = this.getNeighbors(nodeId)
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfsRecursive(neighbor)
        }
      })
    }
    
    dfsRecursive(startId)
    return result
  }

  /**
   * Find shortest path using Dijkstra's algorithm
   */
  shortestPath(startId: string, endId: string): string[] | null {
    const distances: Map<string, number> = new Map()
    const previous: Map<string, string | null> = new Map()
    const unvisited = new Set(this.nodes.keys())
    
    // Initialize distances
    this.nodes.forEach((_, id) => {
      distances.set(id, id === startId ? 0 : Infinity)
      previous.set(id, null)
    })
    
    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentId: string | null = null
      let minDistance = Infinity
      
      unvisited.forEach(id => {
        const distance = distances.get(id)!
        if (distance < minDistance) {
          minDistance = distance
          currentId = id
        }
      })
      
      if (currentId === null || minDistance === Infinity) break
      
      unvisited.delete(currentId)
      
      if (currentId === endId) {
        // Reconstruct path
        const path: string[] = []
        let current: string | null = endId
        
        while (current !== null) {
          path.unshift(current)
          current = previous.get(current)!
        }
        
        return path.length > 1 ? path : null
      }
      
      // Update distances to neighbors
      const neighbors = this.getNeighbors(currentId)
      neighbors.forEach(neighborId => {
        if (unvisited.has(neighborId)) {
          const edge = this.findEdge(currentId, neighborId)
          const weight = edge?.weight || 1
          const altDistance = distances.get(currentId)! + weight
          
          if (altDistance < distances.get(neighborId)!) {
            distances.set(neighborId, altDistance)
            previous.set(neighborId, currentId)
          }
        }
      })
    }
    
    return null
  }

  /**
   * Find an edge between two nodes
   */
  private findEdge(source: string, target: string): GraphEdge | undefined {
    return Array.from(this.edges.values()).find(edge => 
      edge.source === source && edge.target === target
    )
  }

  /**
   * Update outputs
   */
  private updateOutputs(): void {
    this.setOutput('graphData', this.getGraphData())
    this.setOutput('nodeCount', this.nodes.size)
    this.setOutput('edgeCount', this.edges.size)
  }

  /**
   * Get the current graph data
   */
  getGraphData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      directed: this.directed
    }
  }

  /**
   * Get the raw primitive value
   */
  getPrimitive(): any {
    return this.getGraphData()
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <GraphPrimitiveComponent construct={this} />
  }
}

/**
 * React component for visualizing the graph
 */
const GraphPrimitiveComponent: React.FC<{ construct: GraphPrimitive }> = ({ construct }) => {
  const width = construct['getInput']<number>('width') || 800
  const height = construct['getInput']<number>('height') || 600
  const graphData = construct.getGraphData()
  
  // Simple SVG visualization
  const svgContent = useMemo(() => {
    const { nodes, edges, directed } = graphData
    
    return (
      <>
        {/* Draw edges */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source)
          const targetNode = nodes.find(n => n.id === edge.target)
          
          if (!sourceNode || !targetNode) return null
          
          const x1 = sourceNode.x || 0
          const y1 = sourceNode.y || 0
          const x2 = targetNode.x || 0
          const y2 = targetNode.y || 0
          
          // Calculate arrow for directed graphs
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const arrowLength = 10
          const arrowX = x2 - 20 * Math.cos(angle)
          const arrowY = y2 - 20 * Math.sin(angle)
          
          return (
            <g key={edge.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#666"
                strokeWidth="2"
              />
              {directed && (
                <polygon
                  points={`${arrowX},${arrowY} ${arrowX - arrowLength * Math.cos(angle - Math.PI/6)},${arrowY - arrowLength * Math.sin(angle - Math.PI/6)} ${arrowX - arrowLength * Math.cos(angle + Math.PI/6)},${arrowY - arrowLength * Math.sin(angle + Math.PI/6)}`}
                  fill="#666"
                />
              )}
              {edge.weight !== undefined && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2}
                  textAnchor="middle"
                  fill="#333"
                  fontSize="12"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          )
        })}
        
        {/* Draw nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x || 0}
              cy={node.y || 0}
              r="20"
              fill="#4a90e2"
              stroke="#2c5aa0"
              strokeWidth="2"
            />
            <text
              x={node.x || 0}
              y={node.y || 0}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              {node.id}
            </text>
          </g>
        ))}
      </>
    )
  }, [graphData])
  
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <svg width={width} height={height} style={{ border: '1px solid #ddd' }}>
        {svgContent}
      </svg>
    </div>
  )
}

// Export factory function
export const createGraphPrimitive = () => new GraphPrimitive()

// Export the definition for catalog registration
export const graphPrimitiveDefinition = GraphPrimitive.definition