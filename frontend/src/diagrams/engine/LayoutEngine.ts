import { Node, Edge } from 'reactflow'

/**
 * Layout algorithms for automatic diagram arrangement
 */
export class LayoutEngine {
  /**
   * Apply hierarchical layout (top-down)
   */
  static hierarchical(nodes: Node[], edges: Edge[]): Node[] {
    // Build adjacency list
    const graph = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    
    nodes.forEach(node => {
      graph.set(node.id, [])
      inDegree.set(node.id, 0)
    })
    
    edges.forEach(edge => {
      graph.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    })
    
    // Find root nodes (no incoming edges)
    const roots = nodes.filter(node => inDegree.get(node.id) === 0)
    
    // Assign levels using BFS
    const levels = new Map<string, number>()
    const queue = roots.map(node => ({ id: node.id, level: 0 }))
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      levels.set(id, level)
      
      graph.get(id)?.forEach(childId => {
        if (!levels.has(childId)) {
          queue.push({ id: childId, level: level + 1 })
        }
      })
    }
    
    // Group nodes by level
    const nodesByLevel = new Map<number, Node[]>()
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(node)
    })
    
    // Position nodes
    const levelHeight = 150
    const nodeWidth = 250
    const horizontalGap = 50
    
    return nodes.map(node => {
      const level = levels.get(node.id) || 0
      const nodesInLevel = nodesByLevel.get(level) || []
      const indexInLevel = nodesInLevel.indexOf(node)
      const totalWidth = nodesInLevel.length * nodeWidth + (nodesInLevel.length - 1) * horizontalGap
      
      return {
        ...node,
        position: {
          x: 400 - totalWidth / 2 + indexInLevel * (nodeWidth + horizontalGap),
          y: 100 + level * levelHeight
        }
      }
    })
  }
  
  /**
   * Apply force-directed layout
   */
  static forceDirected(
    nodes: Node[], 
    edges: Edge[],
    iterations: number = 100
  ): Node[] {
    // Clone nodes to avoid mutation
    const layoutNodes = nodes.map(node => ({
      ...node,
      position: { ...node.position }
    }))
    
    // Force-directed parameters
    const k = 100 // Ideal spring length
    const c1 = 2 // Repulsion constant
    const c2 = 1 // Spring constant
    const c3 = 1 // Gravity constant
    
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>()
      
      // Initialize forces
      layoutNodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 })
      })
      
      // Repulsive forces between all nodes
      for (let i = 0; i < layoutNodes.length; i++) {
        for (let j = i + 1; j < layoutNodes.length; j++) {
          const node1 = layoutNodes[i]
          const node2 = layoutNodes[j]
          
          const dx = node2.position.x - node1.position.x
          const dy = node2.position.y - node1.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          const force = c1 * k * k / distance
          const fx = force * dx / distance
          const fy = force * dy / distance
          
          forces.get(node1.id)!.x -= fx
          forces.get(node1.id)!.y -= fy
          forces.get(node2.id)!.x += fx
          forces.get(node2.id)!.y += fy
        }
      }
      
      // Spring forces for connected nodes
      edges.forEach(edge => {
        const source = layoutNodes.find(n => n.id === edge.source)
        const target = layoutNodes.find(n => n.id === edge.target)
        
        if (source && target) {
          const dx = target.position.x - source.position.x
          const dy = target.position.y - source.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          const force = c2 * (distance - k)
          const fx = force * dx / distance
          const fy = force * dy / distance
          
          forces.get(source.id)!.x += fx
          forces.get(source.id)!.y += fy
          forces.get(target.id)!.x -= fx
          forces.get(target.id)!.y -= fy
        }
      })
      
      // Gravity towards center
      const centerX = 400
      const centerY = 300
      
      layoutNodes.forEach(node => {
        const dx = centerX - node.position.x
        const dy = centerY - node.position.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        
        forces.get(node.id)!.x += c3 * dx / distance
        forces.get(node.id)!.y += c3 * dy / distance
      })
      
      // Apply forces with damping
      const damping = 0.85
      layoutNodes.forEach(node => {
        const force = forces.get(node.id)!
        node.position.x += force.x * damping
        node.position.y += force.y * damping
      })
    }
    
    return layoutNodes
  }
  
  /**
   * Apply circular layout
   */
  static circular(nodes: Node[]): Node[] {
    const centerX = 400
    const centerY = 300
    const radius = 200
    
    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length
      
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      }
    })
  }
  
  /**
   * Apply grid layout
   */
  static grid(nodes: Node[], columns?: number): Node[] {
    const cols = columns || Math.ceil(Math.sqrt(nodes.length))
    const nodeWidth = 250
    const nodeHeight = 150
    const gap = 50
    
    return nodes.map((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      return {
        ...node,
        position: {
          x: 100 + col * (nodeWidth + gap),
          y: 100 + row * (nodeHeight + gap)
        }
      }
    })
  }
  
  /**
   * Detect and prevent overlapping nodes
   */
  static preventOverlap(nodes: Node[], minDistance: number = 100): Node[] {
    const adjustedNodes = [...nodes]
    let hasOverlap = true
    let iterations = 0
    const maxIterations = 50
    
    while (hasOverlap && iterations < maxIterations) {
      hasOverlap = false
      iterations++
      
      for (let i = 0; i < adjustedNodes.length; i++) {
        for (let j = i + 1; j < adjustedNodes.length; j++) {
          const node1 = adjustedNodes[i]
          const node2 = adjustedNodes[j]
          
          const dx = node2.position.x - node1.position.x
          const dy = node2.position.y - node1.position.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < minDistance) {
            hasOverlap = true
            
            // Move nodes apart
            const moveDistance = (minDistance - distance) / 2
            const moveX = moveDistance * dx / distance
            const moveY = moveDistance * dy / distance
            
            node1.position.x -= moveX
            node1.position.y -= moveY
            node2.position.x += moveX
            node2.position.y += moveY
          }
        }
      }
    }
    
    return adjustedNodes
  }
}