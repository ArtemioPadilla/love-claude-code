/**
 * Interactive Dependency Graph Component
 * 
 * Visualizes construct dependencies using React Flow with hierarchical layout
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { 
  Package, Info, ChevronDown, ChevronRight, Search,
  Filter, Download, Maximize2, Eye, EyeOff
} from 'lucide-react'
import { ConstructLevel, PlatformConstructDefinition } from '../types'
import { DependencyGraph as DependencyGraphType, dependencyResolver } from '../utils/dependencyResolver'
import { GraphNode, GraphEdge, LEVEL_COLORS } from '../types/dependencyGraph'

interface DependencyGraphProps {
  constructId: string
  onNodeClick?: (constructId: string) => void
  height?: string | number
}

/**
 * Custom node component for constructs
 */
const ConstructNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded)
  const levelConfig = LEVEL_COLORS[data.level as ConstructLevel]
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`px-4 py-3 rounded-lg border-2 ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: levelConfig.bg,
        borderColor: levelConfig.border,
        color: levelConfig.text,
        minWidth: '200px'
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Node Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span className="font-semibold">{data.label}</span>
        </div>
        {data.dependencyCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
              data.onToggleExpand?.()
            }}
            className="p-1 hover:bg-black/10 rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {/* Node Info */}
      <div className="text-xs opacity-80">
        <div>{data.type}</div>
        <div className="flex items-center gap-2 mt-1">
          <span>{data.level}</span>
          {data.dependencyCount > 0 && (
            <span>• {data.dependencyCount} deps</span>
          )}
          {data.primitiveCount > 0 && (
            <span>• {data.primitiveCount} L0s</span>
          )}
        </div>
      </div>
      
      {/* Expanded Description */}
      {isExpanded && data.description && (
        <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-70">
          {data.description}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  )
}

const nodeTypes = {
  constructNode: ConstructNode
}

/**
 * Main dependency graph component
 */
export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  constructId,
  onNodeClick,
  height = '600px'
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showLabels, setShowLabels] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<ConstructLevel | null>(null)
  const [graphData, setGraphData] = useState<DependencyGraphType | null>(null)
  
  // Build graph data
  useEffect(() => {
    const data = dependencyResolver.resolveDependencies(constructId)
    if (data) {
      setGraphData(data)
      const { nodes: graphNodes, edges: graphEdges } = buildGraphLayout(data)
      setNodes(graphNodes)
      setEdges(graphEdges)
    }
  }, [constructId, setNodes, setEdges])
  
  // Filter nodes based on search and level
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = !searchQuery || 
        node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = !filterLevel || node.data.level === filterLevel
      return matchesSearch && matchesLevel
    })
  }, [nodes, searchQuery, filterLevel])
  
  // Filter edges to only show those connected to visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id))
    return edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
  }, [edges, filteredNodes])
  
  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id)
    }
  }, [onNodeClick])
  
  // Export graph as SVG
  const handleExport = useCallback(() => {
    // Implementation would go here
    console.log('Export graph as SVG')
  }, [])
  
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height }}>
      {/* Toolbar */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search constructs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Level Filter */}
          <select
            value={filterLevel || ''}
            onChange={(e) => setFilterLevel(e.target.value as ConstructLevel || null)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
          >
            <option value="">All Levels</option>
            {Object.values(ConstructLevel).map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={showLabels ? 'Hide edge labels' : 'Show edge labels'}
            >
              {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Export as SVG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {graphData && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            <span>Total Dependencies: {graphData.totalDependencies}</span>
            <span>•</span>
            <span>Max Depth: {graphData.maxDepth}</span>
            <span>•</span>
            <span>
              By Level: {Object.entries(graphData.dependenciesByLevel)
                .map(([level, count]) => `${level}: ${count}`)
                .join(', ')}
            </span>
          </div>
        )}
      </div>
      
      {/* Graph */}
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => LEVEL_COLORS[node.data.level as ConstructLevel].bg}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

/**
 * Build hierarchical layout for the dependency graph
 */
function buildGraphLayout(graph: DependencyGraphType): {
  nodes: Node[]
  edges: Edge[]
} {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const levelGroups: Map<number, Node[]> = new Map()
  
  // Build nodes recursively
  const processNode = (
    node: any,
    x: number = 0,
    y: number = 0,
    parentId?: string
  ) => {
    const nodeId = node.id
    
    // Create React Flow node
    const rfNode: Node = {
      id: nodeId,
      type: 'constructNode',
      position: { x, y },
      data: {
        label: node.name,
        level: node.level,
        type: node.type,
        description: node.description,
        isExpanded: false,
        dependencyCount: node.dependencies.length,
        primitiveCount: node.dependencies.filter((d: any) => d.level === ConstructLevel.L0).length
      }
    }
    
    nodes.push(rfNode)
    
    // Group by level for layout
    const depthNodes = levelGroups.get(node.depth) || []
    depthNodes.push(rfNode)
    levelGroups.set(node.depth, depthNodes)
    
    // Create edge from parent
    if (parentId) {
      edges.push({
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#4B5563', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4B5563'
        }
      })
    }
    
    // Process children
    node.dependencies.forEach((child: any, index: number) => {
      const childX = x + (index - node.dependencies.length / 2) * 250
      const childY = y + 150
      processNode(child, childX, childY, nodeId)
    })
  }
  
  // Start from root
  processNode(graph.root, 0, 0)
  
  // Adjust positions to prevent overlap
  levelGroups.forEach((levelNodes, depth) => {
    const totalWidth = levelNodes.length * 250
    const startX = -totalWidth / 2
    
    levelNodes.forEach((node, index) => {
      node.position = {
        x: startX + index * 250,
        y: depth * 200
      }
    })
  })
  
  return { nodes, edges }
}