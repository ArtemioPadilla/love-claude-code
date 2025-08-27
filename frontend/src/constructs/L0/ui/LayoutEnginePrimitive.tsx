import React, { useMemo, useEffect, useRef } from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * Layout types and interfaces
 */
export interface LayoutNode {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  fixed?: boolean
  group?: string
}

export interface LayoutEdge {
  source: string
  target: string
  weight?: number
}

export interface LayoutConfig {
  type: 'force' | 'hierarchical' | 'circular' | 'grid'
  width: number
  height: number
  padding?: number
  nodeSpacing?: number
  levelSpacing?: number
  iterations?: number
  gravity?: number
  charge?: number
  linkDistance?: number
  springStrength?: number
}

export interface LayoutResult {
  nodes: LayoutNode[]
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  }
}

/**
 * L0 Layout Engine Primitive Construct
 * Pure TypeScript layout algorithms with no dependencies
 * Implements force-directed, hierarchical, circular, and grid layouts
 */
export class LayoutEnginePrimitive extends L0UIConstruct {
  private nodes: Map<string, LayoutNode> = new Map()
  private edges: LayoutEdge[] = []
  private config: LayoutConfig
  private animationFrame: number | null = null
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-layout-engine-primitive',
    name: 'Layout Engine Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Pure TypeScript graph layout algorithms',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'visualization', 'layout'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['layout', 'primitive', 'algorithms', 'graph'],
    inputs: [
      {
        name: 'nodes',
        type: 'array',
        description: 'Nodes to layout',
        required: true,
        defaultValue: []
      },
      {
        name: 'edges',
        type: 'array',
        description: 'Edges between nodes',
        required: false,
        defaultValue: []
      },
      {
        name: 'layoutType',
        type: 'string',
        description: 'Type of layout algorithm',
        required: false,
        defaultValue: 'force',
        validation: {
          enum: ['force', 'hierarchical', 'circular', 'grid']
        }
      },
      {
        name: 'width',
        type: 'number',
        description: 'Layout area width',
        required: false,
        defaultValue: 800
      },
      {
        name: 'height',
        type: 'number',
        description: 'Layout area height',
        required: false,
        defaultValue: 600
      },
      {
        name: 'animate',
        type: 'boolean',
        description: 'Whether to animate layout changes',
        required: false,
        defaultValue: true
      }
    ],
    outputs: [
      {
        name: 'layoutResult',
        type: 'object',
        description: 'Calculated node positions and bounds'
      },
      {
        name: 'isCalculating',
        type: 'boolean',
        description: 'Whether layout is being calculated'
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
        title: 'Force-Directed Layout',
        description: 'Create a force-directed graph layout',
        code: `const layout = new LayoutEnginePrimitive()
await layout.initialize({
  nodes: [
    { id: 'A' },
    { id: 'B' },
    { id: 'C' }
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' }
  ],
  layoutType: 'force',
  width: 800,
  height: 600
})

// Calculate layout
const result = layout.calculateLayout()

// Get optimized positions
const positions = result.nodes`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 ResponsiveLayout for production',
      'No performance optimizations for very large graphs (1000+ nodes)',
      'Pure algorithms - no GPU acceleration'
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
      timeToCreate: 60,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(LayoutEnginePrimitive.definition)
    this.config = {
      type: 'force',
      width: 800,
      height: 600,
      padding: 50,
      nodeSpacing: 100,
      iterations: 100,
      gravity: 0.1,
      charge: -300,
      linkDistance: 100,
      springStrength: 0.1
    }
  }

  protected async onInitialize(): Promise<void> {
    const nodes = this.getInput<LayoutNode[]>('nodes') || []
    const edges = this.getInput<LayoutEdge[]>('edges') || []
    const layoutType = this.getInput<string>('layoutType') as LayoutConfig['type']
    const width = this.getInput<number>('width') || 800
    const height = this.getInput<number>('height') || 600
    
    // Initialize nodes
    nodes.forEach(node => {
      this.nodes.set(node.id, {
        ...node,
        x: node.x || Math.random() * width,
        y: node.y || Math.random() * height
      })
    })
    
    this.edges = edges
    this.config = {
      ...this.config,
      type: layoutType,
      width,
      height
    }
    
    // Calculate initial layout
    if (this.getInput<boolean>('animate')) {
      this.startAnimation()
    } else {
      this.calculateLayout()
    }
  }

  /**
   * Calculate layout based on the selected algorithm
   */
  calculateLayout(): LayoutResult {
    this.setOutput('isCalculating', true)
    
    let result: LayoutResult
    
    switch (this.config.type) {
      case 'force':
        result = this.forceDirectedLayout()
        break
      case 'hierarchical':
        result = this.hierarchicalLayout()
        break
      case 'circular':
        result = this.circularLayout()
        break
      case 'grid':
        result = this.gridLayout()
        break
      default:
        result = this.forceDirectedLayout()
    }
    
    this.setOutput('layoutResult', result)
    this.setOutput('isCalculating', false)
    
    return result
  }

  /**
   * Force-directed layout algorithm
   */
  private forceDirectedLayout(): LayoutResult {
    const nodes = Array.from(this.nodes.values())
    const { width, height, iterations = 100, gravity = 0.1, charge = -300, linkDistance = 100, springStrength = 0.1 } = this.config
    
    // Initialize velocities
    const velocities = new Map<string, { vx: number, vy: number }>()
    nodes.forEach(node => {
      velocities.set(node.id, { vx: 0, vy: 0 })
    })
    
    // Simulation loop
    for (let i = 0; i < iterations; i++) {
      // Apply forces
      nodes.forEach(node => {
        if (node.fixed) return
        
        const velocity = velocities.get(node.id)!
        
        // Gravity towards center
        const cx = width / 2
        const cy = height / 2
        velocity.vx += (cx - node.x) * gravity
        velocity.vy += (cy - node.y) * gravity
        
        // Repulsion between nodes
        nodes.forEach(other => {
          if (node.id === other.id) return
          
          const dx = node.x - other.x
          const dy = node.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = charge / (distance * distance)
          
          velocity.vx += (dx / distance) * force
          velocity.vy += (dy / distance) * force
        })
      })
      
      // Apply spring forces for edges
      this.edges.forEach(edge => {
        const source = this.nodes.get(edge.source)
        const target = this.nodes.get(edge.target)
        
        if (!source || !target) return
        
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (distance - linkDistance) * springStrength
        
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        
        if (!source.fixed) {
          const sourceVel = velocities.get(source.id)!
          sourceVel.vx += fx
          sourceVel.vy += fy
        }
        
        if (!target.fixed) {
          const targetVel = velocities.get(target.id)!
          targetVel.vx -= fx
          targetVel.vy -= fy
        }
      })
      
      // Update positions
      nodes.forEach(node => {
        if (node.fixed) return
        
        const velocity = velocities.get(node.id)!
        
        // Apply velocity damping
        velocity.vx *= 0.85
        velocity.vy *= 0.85
        
        // Update position
        node.x += velocity.vx
        node.y += velocity.vy
        
        // Keep within bounds
        node.x = Math.max(50, Math.min(width - 50, node.x))
        node.y = Math.max(50, Math.min(height - 50, node.y))
      })
    }
    
    return this.createLayoutResult()
  }

  /**
   * Hierarchical layout algorithm
   */
  private hierarchicalLayout(): LayoutResult {
    const nodes = Array.from(this.nodes.values())
    const { width, height, nodeSpacing = 100, levelSpacing = 150 } = this.config
    
    // Build adjacency list and find roots
    const children = new Map<string, string[]>()
    const parents = new Map<string, string>()
    const roots: string[] = []
    
    this.edges.forEach(edge => {
      const childList = children.get(edge.source) || []
      childList.push(edge.target)
      children.set(edge.source, childList)
      parents.set(edge.target, edge.source)
    })
    
    nodes.forEach(node => {
      if (!parents.has(node.id)) {
        roots.push(node.id)
      }
    })
    
    // Assign levels using BFS
    const levels = new Map<string, number>()
    const queue: { id: string, level: number }[] = roots.map(id => ({ id, level: 0 }))
    let maxLevel = 0
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      levels.set(id, level)
      maxLevel = Math.max(maxLevel, level)
      
      const nodeChildren = children.get(id) || []
      nodeChildren.forEach(childId => {
        if (!levels.has(childId)) {
          queue.push({ id: childId, level: level + 1 })
        }
      })
    }
    
    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>()
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0
      const levelNodes = nodesByLevel.get(level) || []
      levelNodes.push(node.id)
      nodesByLevel.set(level, levelNodes)
    })
    
    // Position nodes
    const levelHeight = maxLevel > 0 ? (height - 100) / maxLevel : height
    
    nodesByLevel.forEach((nodeIds, level) => {
      const y = 50 + level * levelHeight
      const nodeWidth = width / (nodeIds.length + 1)
      
      nodeIds.forEach((nodeId, index) => {
        const node = this.nodes.get(nodeId)!
        node.x = nodeWidth * (index + 1)
        node.y = y
      })
    })
    
    return this.createLayoutResult()
  }

  /**
   * Circular layout algorithm
   */
  private circularLayout(): LayoutResult {
    const nodes = Array.from(this.nodes.values())
    const { width, height } = this.config
    
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 50
    
    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
    })
    
    return this.createLayoutResult()
  }

  /**
   * Grid layout algorithm
   */
  private gridLayout(): LayoutResult {
    const nodes = Array.from(this.nodes.values())
    const { width, height, nodeSpacing = 100 } = this.config
    
    const cols = Math.floor(width / nodeSpacing)
    const rows = Math.ceil(nodes.length / cols)
    const cellWidth = width / cols
    const cellHeight = height / rows
    
    nodes.forEach((node, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      
      node.x = cellWidth * (col + 0.5)
      node.y = cellHeight * (row + 0.5)
    })
    
    return this.createLayoutResult()
  }

  /**
   * Create layout result with bounds
   */
  private createLayoutResult(): LayoutResult {
    const nodes = Array.from(this.nodes.values())
    
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x)
      maxY = Math.max(maxY, node.y)
    })
    
    return {
      nodes,
      bounds: {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      }
    }
  }

  /**
   * Update node positions
   */
  updatePositions(positions: { id: string, x: number, y: number }[]): void {
    positions.forEach(pos => {
      const node = this.nodes.get(pos.id)
      if (node) {
        node.x = pos.x
        node.y = pos.y
      }
    })
    
    this.setOutput('layoutResult', this.createLayoutResult())
  }

  /**
   * Optimize layout (additional iterations)
   */
  optimizeLayout(iterations: number = 50): void {
    const oldIterations = this.config.iterations
    this.config.iterations = iterations
    this.calculateLayout()
    this.config.iterations = oldIterations
  }

  /**
   * Start animation
   */
  private startAnimation(): void {
    const animate = () => {
      if (this.config.type === 'force') {
        this.config.iterations = 1
        this.calculateLayout()
      }
      
      this.animationFrame = requestAnimationFrame(animate)
    }
    
    animate()
  }

  /**
   * Stop animation
   */
  private stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  protected async onDestroy(): Promise<void> {
    this.stopAnimation()
    super.onDestroy()
  }

  /**
   * Get the raw primitive value
   */
  getPrimitive(): any {
    return this.createLayoutResult()
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <LayoutEnginePrimitiveComponent construct={this} />
  }
}

/**
 * React component for visualizing the layout
 */
const LayoutEnginePrimitiveComponent: React.FC<{ construct: LayoutEnginePrimitive }> = ({ construct }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const width = construct['getInput']<number>('width') || 800
  const height = construct['getInput']<number>('height') || 600
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height)
      
      const result = construct['getOutput']<LayoutResult>('layoutResult')
      if (!result) return
      
      const { nodes } = result
      const edges = (construct as any).edges as LayoutEdge[]
      
      // Draw edges
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source)
        const target = nodes.find(n => n.id === edge.target)
        
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })
      
      // Draw nodes
      nodes.forEach(node => {
        ctx.fillStyle = node.fixed ? '#ff6b6b' : '#4a90e2'
        ctx.beginPath()
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw label
        ctx.fillStyle = 'white'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.id, node.x, node.y)
      })
    }
    
    // Initial draw
    draw()
    
    // Redraw on updates
    const interval = setInterval(draw, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [construct, width, height])
  
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          border: '1px solid #ddd',
          display: 'block'
        }}
      />
    </div>
  )
}

// Export factory function
export const createLayoutEnginePrimitive = () => new LayoutEnginePrimitive()

// Export the definition for catalog registration
export const layoutEnginePrimitiveDefinition = LayoutEnginePrimitive.definition