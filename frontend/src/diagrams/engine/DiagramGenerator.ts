import { Node, Edge, Position } from 'reactflow'
import { ConstructComposition, ConstructLevel, CloudProvider } from '../../constructs/types'
import { C4Level } from '../c4/C4DiagramViewer'

/**
 * Diagram generation engine
 */
export class DiagramGenerator {
  private nodeIdCounter = 0
  private edgeIdCounter = 0
  
  /**
   * Generate C4 diagram from construct composition
   */
  generateFromComposition(
    composition: ConstructComposition,
    level: C4Level
  ): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    switch (level) {
      case C4Level.CONTEXT:
        return this.generateContextDiagram(composition)
      
      case C4Level.CONTAINER:
        return this.generateContainerDiagram(composition)
      
      case C4Level.COMPONENT:
        return this.generateComponentDiagram(composition)
      
      case C4Level.CODE:
        return this.generateCodeDiagram(composition)
      
      default:
        return { nodes, edges }
    }
  }
  
  /**
   * Generate C4 diagram from project structure
   */
  generateFromProject(
    projectStructure: any,
    level: C4Level
  ): { nodes: Node[]; edges: Edge[] } {
    // Analyze project structure and generate appropriate diagram
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // This is a simplified implementation
    // In reality, would parse project files, dependencies, etc.
    
    return { nodes, edges }
  }
  
  /**
   * Generate context diagram
   */
  private generateContextDiagram(
    composition: ConstructComposition
  ): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Add user/person node
    nodes.push({
      id: this.getNodeId(),
      type: 'person',
      position: { x: 400, y: 50 },
      data: {
        label: 'User',
        description: 'System user'
      }
    })
    
    // Add main system node
    const systemNode: Node = {
      id: this.getNodeId(),
      type: 'system',
      position: { x: 400, y: 200 },
      data: {
        label: composition.name,
        description: composition.metadata?.description || 'Main system',
        external: false
      }
    }
    nodes.push(systemNode)
    
    // Add external systems based on providers
    const providers = new Set<CloudProvider>()
    composition.constructs.forEach(c => {
      // Would need to look up construct definition to get providers
      // For now, we'll simulate
      providers.add(CloudProvider.AWS)
    })
    
    let xOffset = 100
    providers.forEach(provider => {
      const providerNode: Node = {
        id: this.getNodeId(),
        type: 'system',
        position: { x: xOffset, y: 350 },
        data: {
          label: `${provider} Services`,
          description: `${provider} cloud services`,
          external: true
        }
      }
      nodes.push(providerNode)
      
      // Add edge from system to provider
      edges.push({
        id: this.getEdgeId(),
        source: systemNode.id,
        target: providerNode.id,
        type: 'smoothstep',
        data: {
          label: 'Uses',
          technology: 'HTTPS/API'
        }
      })
      
      xOffset += 200
    })
    
    // Add edge from user to system
    edges.push({
      id: this.getEdgeId(),
      source: nodes[0].id, // User node
      target: systemNode.id,
      type: 'smoothstep',
      data: {
        label: 'Uses',
        technology: 'Web Browser'
      }
    })
    
    return { nodes, edges }
  }
  
  /**
   * Generate container diagram
   */
  private generateContainerDiagram(
    composition: ConstructComposition
  ): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Group constructs by level
    const l1Constructs = composition.constructs.filter(c => 
      // Would check actual construct level
      true // Placeholder
    )
    
    const l2Constructs = composition.constructs.filter(c => 
      // Would check actual construct level
      false // Placeholder
    )
    
    // Layout algorithm
    const gridSize = Math.ceil(Math.sqrt(composition.constructs.length))
    let row = 0
    let col = 0
    
    composition.constructs.forEach((construct, index) => {
      const node: Node = {
        id: construct.instanceName,
        type: 'container',
        position: construct.position || {
          x: 100 + col * 250,
          y: 100 + row * 200
        },
        data: {
          label: construct.instanceName,
          description: `Instance of ${construct.constructId}`,
          technology: 'TypeScript',
          containerType: this.getContainerType(construct.constructId)
        }
      }
      nodes.push(node)
      
      // Update grid position
      col++
      if (col >= gridSize) {
        col = 0
        row++
      }
    })
    
    // Add edges based on connections
    composition.constructs.forEach(construct => {
      construct.connections?.forEach(connection => {
        edges.push({
          id: this.getEdgeId(),
          source: construct.instanceName,
          target: connection.targetInstance,
          type: 'smoothstep',
          data: {
            label: connection.type,
            type: connection.type === 'async' ? 'async' : 'sync'
          }
        })
      })
    })
    
    return { nodes, edges }
  }
  
  /**
   * Generate component diagram
   */
  private generateComponentDiagram(
    composition: ConstructComposition
  ): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // For component diagram, we'd show the internal components
    // of each container. This requires more detailed construct metadata
    
    // Simplified implementation
    composition.constructs.forEach((construct, index) => {
      // Add main component
      const mainNode: Node = {
        id: `${construct.instanceName}-main`,
        type: 'component',
        position: {
          x: 200 + (index % 3) * 300,
          y: 100 + Math.floor(index / 3) * 250
        },
        data: {
          label: `${construct.instanceName} Core`,
          description: 'Main component logic',
          technology: 'TypeScript'
        }
      }
      nodes.push(mainNode)
      
      // Add sub-components based on construct type
      if (construct.constructId.includes('api')) {
        // Add API components
        const routerNode: Node = {
          id: `${construct.instanceName}-router`,
          type: 'component',
          position: {
            x: mainNode.position.x - 100,
            y: mainNode.position.y + 100
          },
          data: {
            label: 'Router',
            description: 'API routing',
            technology: 'Express'
          }
        }
        nodes.push(routerNode)
        
        edges.push({
          id: this.getEdgeId(),
          source: mainNode.id,
          target: routerNode.id,
          type: 'smoothstep'
        })
      }
    })
    
    return { nodes, edges }
  }
  
  /**
   * Generate code diagram
   */
  private generateCodeDiagram(
    composition: ConstructComposition
  ): { nodes: Node[]; edges: Edge[] } {
    // Code-level diagrams would show classes, interfaces, etc.
    // This is typically generated from actual code analysis
    return { nodes: [], edges: [] }
  }
  
  /**
   * Auto-layout nodes
   */
  autoLayout(nodes: Node[], edges: Edge[]): Node[] {
    // Implement force-directed or hierarchical layout
    // For now, return nodes as-is
    return nodes
  }
  
  /**
   * Get container type based on construct ID
   */
  private getContainerType(constructId: string): string {
    if (constructId.includes('database')) return 'Database'
    if (constructId.includes('api')) return 'WebApp'
    if (constructId.includes('queue')) return 'MessageBus'
    if (constructId.includes('storage')) return 'FileSystem'
    return 'WebApp'
  }
  
  /**
   * Generate unique node ID
   */
  private getNodeId(): string {
    return `node-${++this.nodeIdCounter}`
  }
  
  /**
   * Generate unique edge ID
   */
  private getEdgeId(): string {
    return `edge-${++this.edgeIdCounter}`
  }
}