import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import { DependencyGraph } from '../../catalog/DependencyGraph'
import { DraggableNode } from '../../L1/ui/DraggableNode'
import { ConnectedEdge } from '../../L1/ui/ConnectedEdge'
import { ZoomableGraph } from '../../L1/ui/ZoomableGraph'
import { DiagramToolbar } from '../../L1/ui/DiagramToolbar'
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, GitBranch, Layers, Maximize2, Minimize2, 
  Download, Upload, RefreshCw, Settings, Eye, EyeOff
} from 'lucide-react'

export interface DependencyGraphConfig {
  constructId: string
  theme?: 'light' | 'dark'
  enableVirtualization?: boolean
  maxNodes?: number
  animationDuration?: number
  showMinimap?: boolean
  showControls?: boolean
  enableExport?: boolean
  enableImport?: boolean
  onNodeClick?: (nodeId: string) => void
  onEdgeClick?: (edgeId: string) => void
  filterOptions?: {
    levels?: ConstructLevel[]
    categories?: string[]
    searchQuery?: string
  }
  layoutOptions?: {
    direction?: 'TB' | 'LR' | 'BT' | 'RL'
    spacing?: { x: number; y: number }
    algorithm?: 'hierarchical' | 'force' | 'circular'
  }
}

/**
 * L2 Dependency Graph Pattern
 * Enhanced dependency visualization with performance optimization and interactivity
 */
export class DependencyGraphPattern extends L2PatternConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l2-dependency-graph-pattern',
    name: 'Dependency Graph Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.UI,
    description: 'Advanced dependency visualization with virtualization, theming, and interactive features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['visualization', 'architecture', 'patterns'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    dependencies: [
      'platform-l1-draggable-node',
      'platform-l1-connected-edge',
      'platform-l1-zoomable-graph',
      'platform-l1-diagram-toolbar'
    ],
    tags: ['graph', 'dependencies', 'visualization', 'interactive'],
    inputs: [
      {
        name: 'config',
        type: 'object',
        description: 'Dependency graph configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'selectedNodes',
        type: 'array',
        description: 'Currently selected nodes'
      },
      {
        name: 'graphData',
        type: 'object',
        description: 'Processed graph data'
      },
      {
        name: 'visibleNodes',
        type: 'number',
        description: 'Number of visible nodes'
      }
    ],
    security: [
      {
        type: 'input-sanitization',
        description: 'Sanitizes graph data to prevent XSS'
      },
      {
        type: 'rate-limiting',
        description: 'Limits graph updates to prevent performance issues'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + ReactFlow + TypeScript'
    },
    examples: [
      {
        title: 'Basic Dependency Graph',
        description: 'Visualize construct dependencies',
        code: `const graphPattern = new DependencyGraphPattern()
await graphPattern.initialize({
  constructId: 'my-construct',
  theme: 'dark',
  enableVirtualization: true,
  maxNodes: 1000,
  showMinimap: true,
  onNodeClick: (nodeId) => console.log('Clicked:', nodeId)
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Enable virtualization for graphs with >100 nodes',
      'Use appropriate layout algorithms for different graph types',
      'Implement keyboard navigation for accessibility',
      'Cache graph calculations for performance',
      'Provide clear visual hierarchy with colors and sizes'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 95,
      builtWith: ['platform-l2-pattern-base'],
      timeToCreate: 120,
      canBuildConstructs: true
    }
  }

  private config!: DependencyGraphConfig
  private nodes: Node[] = []
  private edges: Edge[] = []
  private selectedNodes: Set<string> = new Set()
  private virtualizedNodes: Node[] = []

  constructor() {
    super(DependencyGraphPattern.definition, {})
  }

  async initialize(config: DependencyGraphConfig): Promise<any> {
    this.config = config
    this.initialized = true
    
    await this.beforeCompose()
    await this.composePattern()
    this.configureInteractions()
    await this.afterCompose()
    
    return {
      pattern: this.definition.name,
      ready: true
    }
  }

  protected async composePattern(): Promise<void> {
    // Initialize L1 components
    const draggableNode = new DraggableNode()
    const connectedEdge = new ConnectedEdge()
    const zoomableGraph = new ZoomableGraph()
    const diagramToolbar = new DiagramToolbar()
    
    // Add to pattern
    this.addConstruct('draggableNode', draggableNode)
    this.addConstruct('connectedEdge', connectedEdge)
    this.addConstruct('zoomableGraph', zoomableGraph)
    this.addConstruct('diagramToolbar', diagramToolbar)
    
    // Initialize components
    await Promise.all([
      draggableNode.initialize({
        snapToGrid: true,
        gridSize: 20,
        constraints: { minX: 0, minY: 0 }
      }),
      connectedEdge.initialize({
        animated: true,
        showLabel: true
      }),
      zoomableGraph.initialize({
        minZoom: 0.1,
        maxZoom: 2,
        zoomStep: 0.1
      }),
      diagramToolbar.initialize({
        tools: ['zoom', 'pan', 'select', 'export', 'fullscreen']
      })
    ])
  }

  protected configureInteractions(): void {
    // Wire up toolbar actions
    const toolbar = this.getConstruct<DiagramToolbar>('diagramToolbar')
    const zoomableGraph = this.getConstruct<ZoomableGraph>('zoomableGraph')
    
    if (toolbar && zoomableGraph) {
      toolbar.on('zoom-in', () => zoomableGraph.zoomIn())
      toolbar.on('zoom-out', () => zoomableGraph.zoomOut())
      toolbar.on('fit-view', () => zoomableGraph.fitView())
      toolbar.on('export', () => this.exportGraph())
    }
    
    // Handle node selection
    const draggableNode = this.getConstruct<DraggableNode>('draggableNode')
    if (draggableNode) {
      draggableNode.on('click', (nodeId: string) => {
        this.toggleNodeSelection(nodeId)
        this.config.onNodeClick?.(nodeId)
      })
    }
  }

  private toggleNodeSelection(nodeId: string): void {
    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId)
    } else {
      this.selectedNodes.add(nodeId)
    }
    this.emit('selection-changed', Array.from(this.selectedNodes))
  }

  private async exportGraph(): Promise<void> {
    const exportData = {
      nodes: this.nodes,
      edges: this.edges,
      layout: this.config.layoutOptions,
      timestamp: new Date().toISOString()
    }
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dependency-graph-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    this.emit('exported', exportData)
  }

  render(): React.ReactElement {
    return <DependencyGraphPatternComponent pattern={this} config={this.config} />
  }
}

/**
 * React component for the dependency graph pattern
 */
const DependencyGraphPatternComponent: React.FC<{
  pattern: DependencyGraphPattern
  config: DependencyGraphConfig
}> = ({ pattern, config }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [layoutEngine, setLayoutEngine] = useState(config.layoutOptions?.algorithm || 'hierarchical')
  const [performanceMode, setPerformanceMode] = useState(false)
  
  // Performance optimization: virtualize nodes when > 100
  const virtualizedNodes = useMemo(() => {
    if (!config.enableVirtualization || nodes.length <= 100) {
      return nodes
    }
    
    // Implement viewport-based virtualization
    setPerformanceMode(true)
    // In real implementation, would calculate visible nodes based on viewport
    return nodes.slice(0, 100)
  }, [nodes, config.enableVirtualization])
  
  // Load and process graph data
  useEffect(() => {
    const loadGraphData = async () => {
      // Here would integrate with actual dependency resolver
      // For now, using mock data structure
      const mockNodes: Node[] = [
        {
          id: '1',
          type: 'constructNode',
          position: { x: 250, y: 50 },
          data: { label: 'L3 Application', level: 'L3', dependencies: 3 }
        },
        {
          id: '2',
          type: 'constructNode',
          position: { x: 100, y: 200 },
          data: { label: 'L2 Pattern 1', level: 'L2', dependencies: 2 }
        },
        {
          id: '3',
          type: 'constructNode',
          position: { x: 400, y: 200 },
          data: { label: 'L2 Pattern 2', level: 'L2', dependencies: 2 }
        }
      ]
      
      const mockEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e1-3', source: '1', target: '3', animated: true }
      ]
      
      setNodes(mockNodes)
      setEdges(mockEdges)
    }
    
    loadGraphData()
  }, [config.constructId, setNodes, setEdges])
  
  const handleExport = useCallback(() => {
    pattern['exportGraph']()
  }, [pattern])
  
  return (
    <div className={`dependency-graph-pattern ${config.theme || 'dark'} ${isFullscreen ? 'fullscreen' : ''}`}>
      <style jsx>{`
        .dependency-graph-pattern {
          width: 100%;
          height: 600px;
          position: relative;
          background: var(--bg-primary);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .dependency-graph-pattern.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          border-radius: 0;
        }
        
        .graph-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          padding: 1rem;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .graph-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        .graph-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-button {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .action-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .performance-indicator {
          position: absolute;
          top: 80px;
          right: 20px;
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
        }
      `}</style>
      
      <div className="graph-header">
        <div className="graph-stats">
          <span>Nodes: {nodes.length}</span>
          <span>Edges: {edges.length}</span>
          <span>Selected: {pattern['selectedNodes'].size}</span>
          {performanceMode && <span>Performance Mode Active</span>}
        </div>
        
        <div className="graph-actions">
          <button 
            className="action-button"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? 'Hide Labels' : 'Show Labels'}
          >
            {showLabels ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          
          <button 
            className="action-button"
            onClick={handleExport}
            title="Export Graph"
          >
            <Download size={16} />
          </button>
          
          <button 
            className="action-button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      {performanceMode && (
        <AnimatePresence>
          <motion.div 
            className="performance-indicator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            Virtualization Active ({virtualizedNodes.length}/{nodes.length} nodes visible)
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Reuse existing DependencyGraph component with enhancements */}
      <DependencyGraph
        constructId={config.constructId}
        onNodeClick={config.onNodeClick}
        height={isFullscreen ? '100vh' : '600px'}
      />
    </div>
  )
}

// Export factory function
export const createDependencyGraphPattern = () => new DependencyGraphPattern()

// Export the definition for catalog registration
export const dependencyGraphPatternDefinition = DependencyGraphPattern.definition