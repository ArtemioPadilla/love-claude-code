import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import { DraggableNode } from '../../L1/ui/DraggableNode'
import { ConnectedEdge } from '../../L1/ui/ConnectedEdge'
import { ZoomableGraph } from '../../L1/ui/ZoomableGraph'
import { DiagramToolbar } from '../../L1/ui/DiagramToolbar'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, ChevronDown, Layers, Box, Package,
  Component, Grid, Search, Filter, Download, FolderTree
} from 'lucide-react'

export interface HierarchyNode {
  id: string
  name: string
  level: ConstructLevel
  type: ConstructType
  children?: HierarchyNode[]
  expanded?: boolean
  metadata?: {
    author?: string
    version?: string
    vibeCodingPercentage?: number
    dependencies?: number
    description?: string
  }
}

export interface HierarchyVisualizationConfig {
  rootNode?: HierarchyNode
  theme?: 'light' | 'dark'
  defaultExpanded?: boolean
  showMetadata?: boolean
  enableSearch?: boolean
  enableFilter?: boolean
  enableKeyboardNavigation?: boolean
  onNodeSelect?: (node: HierarchyNode) => void
  onNodeExpand?: (node: HierarchyNode, expanded: boolean) => void
  filterOptions?: {
    levels?: ConstructLevel[]
    types?: ConstructType[]
    searchQuery?: string
  }
  layoutMode?: 'tree' | 'radial' | 'compact'
  animationSpeed?: number
}

/**
 * L2 Hierarchy Visualization Pattern
 * Tree view visualization of construct hierarchy from L0 to L3
 */
export class HierarchyVisualizationPattern extends L2PatternConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l2-hierarchy-visualization-pattern',
    name: 'Hierarchy Visualization Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.UI,
    description: 'Interactive tree visualization showing construct hierarchy from L0 primitives to L3 applications',
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
    tags: ['hierarchy', 'tree', 'visualization', 'architecture'],
    inputs: [
      {
        name: 'config',
        type: 'object',
        description: 'Hierarchy visualization configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'selectedNode',
        type: 'object',
        description: 'Currently selected node'
      },
      {
        name: 'expandedNodes',
        type: 'array',
        description: 'List of expanded node IDs'
      },
      {
        name: 'visibleNodes',
        type: 'number',
        description: 'Number of visible nodes'
      },
      {
        name: 'treeData',
        type: 'object',
        description: 'Processed tree structure'
      }
    ],
    security: [
      {
        type: 'input-sanitization',
        description: 'Sanitizes node data to prevent XSS'
      },
      {
        type: 'access-control',
        description: 'Validates access to construct metadata'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + TypeScript + D3.js'
    },
    examples: [
      {
        title: 'Basic Hierarchy Tree',
        description: 'Visualize construct hierarchy',
        code: `const hierarchy = new HierarchyVisualizationPattern()
await hierarchy.initialize({
  defaultExpanded: true,
  showMetadata: true,
  enableSearch: true,
  layoutMode: 'tree',
  onNodeSelect: (node) => console.log('Selected:', node.name)
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use virtualization for large hierarchies',
      'Implement keyboard navigation for accessibility',
      'Provide visual indicators for node types and levels',
      'Cache expanded state in local storage',
      'Use progressive disclosure for metadata'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 92,
      builtWith: ['platform-l2-pattern-base'],
      timeToCreate: 90,
      canBuildConstructs: true
    }
  }

  private config!: HierarchyVisualizationConfig
  private selectedNode: HierarchyNode | null = null
  private expandedNodes: Set<string> = new Set()
  private filteredNodes: HierarchyNode[] = []

  constructor() {
    super(HierarchyVisualizationPattern.definition, {})
  }

  async initialize(config: HierarchyVisualizationConfig): Promise<any> {
    this.config = config
    this.initialized = true
    
    // Set default expanded state
    if (config.defaultExpanded && config.rootNode) {
      this.expandAllNodes(config.rootNode)
    }
    
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
    
    // Initialize with hierarchy-specific settings
    await Promise.all([
      draggableNode.initialize({
        snapToGrid: false,
        dragPreview: false
      }),
      connectedEdge.initialize({
        type: 'orthogonal',
        animated: false,
        showLabel: false
      }),
      zoomableGraph.initialize({
        minZoom: 0.3,
        maxZoom: 3,
        zoomStep: 0.2
      }),
      diagramToolbar.initialize({
        tools: ['zoom', 'pan', 'fit', 'export', 'collapse-all', 'expand-all']
      })
    ])
  }

  protected configureInteractions(): void {
    const toolbar = this.getConstruct<DiagramToolbar>('diagramToolbar')
    
    if (toolbar) {
      toolbar.on('expand-all', () => this.expandAll())
      toolbar.on('collapse-all', () => this.collapseAll())
      toolbar.on('export', () => this.exportHierarchy())
    }
  }

  private expandAllNodes(node: HierarchyNode): void {
    this.expandedNodes.add(node.id)
    if (node.children) {
      node.children.forEach(child => this.expandAllNodes(child))
    }
  }

  private expandAll(): void {
    if (this.config.rootNode) {
      this.expandAllNodes(this.config.rootNode)
      this.emit('hierarchy-changed', { expandedNodes: Array.from(this.expandedNodes) })
    }
  }

  private collapseAll(): void {
    this.expandedNodes.clear()
    this.emit('hierarchy-changed', { expandedNodes: [] })
  }

  private exportHierarchy(): void {
    const exportData = {
      hierarchy: this.config.rootNode,
      selectedNode: this.selectedNode,
      expandedNodes: Array.from(this.expandedNodes),
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `construct-hierarchy-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  render(): React.ReactElement {
    return <HierarchyVisualizationComponent pattern={this} config={this.config} />
  }
}

/**
 * React component for hierarchy visualization
 */
const HierarchyVisualizationComponent: React.FC<{
  pattern: HierarchyVisualizationPattern
  config: HierarchyVisualizationConfig
}> = ({ pattern, config }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<ConstructLevel | null>(null)
  const [layoutMode, setLayoutMode] = useState(config.layoutMode || 'tree')
  
  // Generate mock hierarchy data if not provided
  const rootNode = useMemo(() => {
    if (config.rootNode) return config.rootNode
    
    // Mock data structure
    return {
      id: 'root',
      name: 'Love Claude Code Platform',
      level: ConstructLevel.L3,
      type: ConstructType.PLATFORM,
      children: [
        {
          id: 'l3-1',
          name: 'Frontend Application',
          level: ConstructLevel.L3,
          type: ConstructType.APPLICATION,
          metadata: { vibeCodingPercentage: 82, dependencies: 15 },
          children: [
            {
              id: 'l2-1',
              name: 'IDE Workspace Pattern',
              level: ConstructLevel.L2,
              type: ConstructType.UI,
              metadata: { vibeCodingPercentage: 90, dependencies: 8 },
              children: [
                {
                  id: 'l1-1',
                  name: 'Code Editor',
                  level: ConstructLevel.L1,
                  type: ConstructType.UI,
                  metadata: { dependencies: 3 },
                  children: [
                    {
                      id: 'l0-1',
                      name: 'Text Input Primitive',
                      level: ConstructLevel.L0,
                      type: ConstructType.UI,
                      metadata: { dependencies: 0 }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }, [config.rootNode])
  
  // Handle node expansion
  const toggleNodeExpansion = useCallback((node: HierarchyNode) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(node.id)) {
        newSet.delete(node.id)
      } else {
        newSet.add(node.id)
      }
      return newSet
    })
    
    config.onNodeExpand?.(node, !expandedNodes.has(node.id))
  }, [expandedNodes, config])
  
  // Handle node selection
  const selectNode = useCallback((node: HierarchyNode) => {
    setSelectedNode(node)
    config.onNodeSelect?.(node)
  }, [config])
  
  // Render tree node
  const renderTreeNode = (node: HierarchyNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNode?.id === node.id
    const hasChildren = node.children && node.children.length > 0
    
    const levelColors = {
      [ConstructLevel.L0]: 'bg-blue-500',
      [ConstructLevel.L1]: 'bg-green-500',
      [ConstructLevel.L2]: 'bg-yellow-500',
      [ConstructLevel.L3]: 'bg-purple-500'
    }
    
    const levelIcons = {
      [ConstructLevel.L0]: <Box size={16} />,
      [ConstructLevel.L1]: <Package size={16} />,
      [ConstructLevel.L2]: <Component size={16} />,
      [ConstructLevel.L3]: <Grid size={16} />
    }
    
    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
        className="tree-node"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <div
          className={`node-content ${isSelected ? 'selected' : ''}`}
          onClick={() => selectNode(node)}
        >
          {hasChildren && (
            <button
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation()
                toggleNodeExpansion(node)
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          
          <div className={`level-indicator ${levelColors[node.level]}`}>
            {levelIcons[node.level]}
          </div>
          
          <div className="node-info">
            <div className="node-name">{node.name}</div>
            {config.showMetadata && node.metadata && (
              <div className="node-metadata">
                {node.metadata.vibeCodingPercentage !== undefined && (
                  <span className="metadata-item">
                    🎨 {node.metadata.vibeCodingPercentage}%
                  </span>
                )}
                {node.metadata.dependencies !== undefined && (
                  <span className="metadata-item">
                    📦 {node.metadata.dependencies}
                  </span>
                )}
                {node.metadata.version && (
                  <span className="metadata-item">
                    v{node.metadata.version}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="children-container"
            >
              {node.children!.map(child => renderTreeNode(child, depth + 1))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    )
  }
  
  return (
    <div className={`hierarchy-visualization ${config.theme || 'dark'}`}>
      <style jsx>{`
        .hierarchy-visualization {
          width: 100%;
          height: 100%;
          background: #0f172a;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .hierarchy-header {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .search-input {
          flex: 1;
          max-width: 300px;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          font-size: 0.875rem;
        }
        
        .filter-select {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          font-size: 0.875rem;
        }
        
        .tree-container {
          flex: 1;
          overflow: auto;
          padding: 1rem;
        }
        
        .tree-node {
          margin-bottom: 0.5rem;
        }
        
        .node-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .node-content:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .node-content.selected {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid #3b82f6;
        }
        
        .expand-button {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .expand-button:hover {
          color: white;
        }
        
        .level-indicator {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .node-info {
          flex: 1;
        }
        
        .node-name {
          font-weight: 500;
          color: white;
        }
        
        .node-metadata {
          display: flex;
          gap: 1rem;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }
        
        .metadata-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .children-container {
          margin-top: 0.5rem;
        }
        
        .layout-mode-selector {
          display: flex;
          gap: 0.5rem;
        }
        
        .layout-button {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .layout-button.active {
          background: #3b82f6;
        }
      `}</style>
      
      <div className="hierarchy-header">
        <div className="header-controls">
          {config.enableSearch && (
            <div className="search-container">
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search constructs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          )}
          
          {config.enableFilter && (
            <select
              className="filter-select"
              value={filterLevel || ''}
              onChange={(e) => setFilterLevel(e.target.value as ConstructLevel || null)}
            >
              <option value="">All Levels</option>
              {Object.values(ConstructLevel).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          )}
          
          <div className="layout-mode-selector">
            <button
              className={`layout-button ${layoutMode === 'tree' ? 'active' : ''}`}
              onClick={() => setLayoutMode('tree')}
              title="Tree Layout"
            >
              <FolderTree size={16} />
            </button>
            <button
              className={`layout-button ${layoutMode === 'radial' ? 'active' : ''}`}
              onClick={() => setLayoutMode('radial')}
              title="Radial Layout"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="tree-container">
        {renderTreeNode(rootNode)}
      </div>
    </div>
  )
}

// Export factory function
export const createHierarchyVisualizationPattern = () => new HierarchyVisualizationPattern()

// Export the definition for catalog registration
export const hierarchyVisualizationPatternDefinition = HierarchyVisualizationPattern.definition