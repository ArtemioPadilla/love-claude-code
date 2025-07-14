import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  ConnectionMode,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Layers, Package, Database, Globe, Server, 
  Cloud, Shield, Users, Zap, Settings,
  ZoomIn, ZoomOut, Maximize2, Download,
  Filter, Eye, EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { C4Node } from '../components/C4Node'
import { C4Legend } from '../components/C4Legend'
import { DiagramGenerator } from '../engine/DiagramGenerator'
import { ConstructComposition } from '../../constructs/types'

/**
 * C4 diagram levels
 */
export enum C4Level {
  CONTEXT = 'context',
  CONTAINER = 'container', 
  COMPONENT = 'component',
  CODE = 'code'
}

interface C4DiagramViewerProps {
  /** Initial diagram level */
  initialLevel?: C4Level
  /** Construct composition to visualize */
  composition?: ConstructComposition
  /** Project structure for auto-generation */
  projectStructure?: any
  /** Enable interactive features */
  interactive?: boolean
  /** Enable editing */
  editable?: boolean
  /** Custom node types */
  customNodeTypes?: NodeTypes
  /** Callback when diagram changes */
  onChange?: (nodes: Node[], edges: Edge[]) => void
}

/**
 * C4 Diagram Viewer component
 */
export const C4DiagramViewer: React.FC<C4DiagramViewerProps> = ({
  initialLevel = C4Level.CONTAINER,
  composition,
  projectStructure,
  interactive = true,
  editable = false,
  customNodeTypes,
  onChange
}) => {
  const [currentLevel, setCurrentLevel] = useState<C4Level>(initialLevel)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showLegend, setShowLegend] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [filters, setFilters] = useState({
    showExternal: true,
    showInternal: true,
    showRelationships: true
  })
  
  // Node types including custom ones
  const nodeTypes: NodeTypes = {
    system: C4SystemNode,
    container: C4ContainerNode,
    component: C4ComponentNode,
    person: C4PersonNode,
    ...customNodeTypes
  }
  
  // Generate diagram from composition or project structure
  useEffect(() => {
    if (composition) {
      const generator = new DiagramGenerator()
      const { nodes: generatedNodes, edges: generatedEdges } = 
        generator.generateFromComposition(composition, currentLevel)
      setNodes(generatedNodes)
      setEdges(generatedEdges)
    } else if (projectStructure) {
      const generator = new DiagramGenerator()
      const { nodes: generatedNodes, edges: generatedEdges } = 
        generator.generateFromProject(projectStructure, currentLevel)
      setNodes(generatedNodes)
      setEdges(generatedEdges)
    }
  }, [composition, projectStructure, currentLevel, setNodes, setEdges])
  
  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    
    // Drill down on double click
    if (event.detail === 2 && interactive) {
      handleDrillDown(node)
    }
  }, [interactive])
  
  // Drill down to next level
  const handleDrillDown = (node: Node) => {
    const levelOrder = [C4Level.CONTEXT, C4Level.CONTAINER, C4Level.COMPONENT, C4Level.CODE]
    const currentIndex = levelOrder.indexOf(currentLevel)
    
    if (currentIndex < levelOrder.length - 1) {
      setCurrentLevel(levelOrder[currentIndex + 1])
      // TODO: Filter diagram to show only selected node's children
    }
  }
  
  // Export diagram
  const handleExport = async (format: 'svg' | 'png' | 'json') => {
    // Implementation would export the diagram in the selected format
    console.log(`Exporting as ${format}`)
  }
  
  // Filter nodes based on settings
  const filteredNodes = nodes.filter(node => {
    if (!filters.showExternal && node.data.external) return false
    if (!filters.showInternal && !node.data.external) return false
    return true
  })
  
  const filteredEdges = filters.showRelationships ? edges : []
  
  // Notify parent of changes
  useEffect(() => {
    if (onChange && editable) {
      onChange(nodes, edges)
    }
  }, [nodes, edges, onChange, editable])
  
  return (
    <div className="h-full w-full bg-gray-900 relative">
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#4b5563" gap={16} />
        <Controls className="bg-gray-800 border border-gray-700" />
        
        {showMiniMap && (
          <MiniMap 
            className="bg-gray-800 border border-gray-700"
            nodeColor={(node) => {
              if (node.type === 'person') return '#10b981'
              if (node.data.external) return '#f59e0b'
              return '#3b82f6'
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
          />
        )}
        
        {/* Control Panel */}
        <Panel position="top-left">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
            {/* Level Selector */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Diagram Level</h3>
              <div className="flex gap-2">
                {Object.values(C4Level).map(level => (
                  <button
                    key={level}
                    onClick={() => setCurrentLevel(level)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      currentLevel === level
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filters */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Filters</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={filters.showExternal}
                    onChange={(e) => setFilters(f => ({ ...f, showExternal: e.target.checked }))}
                    className="rounded"
                  />
                  <span>External Systems</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={filters.showInternal}
                    onChange={(e) => setFilters(f => ({ ...f, showInternal: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Internal Systems</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={filters.showRelationships}
                    onChange={(e) => setFilters(f => ({ ...f, showRelationships: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Relationships</span>
                </label>
              </div>
            </div>
            
            {/* View Options */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                title="Toggle Legend"
              >
                {showLegend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowMiniMap(!showMiniMap)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                title="Toggle MiniMap"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Panel>
        
        {/* Export Panel */}
        <Panel position="top-right">
          <div className="bg-gray-800 rounded-lg p-2 border border-gray-700 flex gap-2">
            <button
              onClick={() => handleExport('svg')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            >
              SVG
            </button>
            <button
              onClick={() => handleExport('png')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            >
              PNG
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            >
              JSON
            </button>
          </div>
        </Panel>
        
        {/* Selected Node Info */}
        <AnimatePresence>
          {selectedNode && (
            <Panel position="bottom-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-sm"
              >
                <h3 className="font-medium mb-2">{selectedNode.data.label}</h3>
                {selectedNode.data.description && (
                  <p className="text-sm text-gray-400 mb-2">{selectedNode.data.description}</p>
                )}
                {selectedNode.data.technology && (
                  <p className="text-xs text-gray-500">
                    Technology: {selectedNode.data.technology}
                  </p>
                )}
                {interactive && currentLevel !== C4Level.CODE && (
                  <button
                    onClick={() => handleDrillDown(selectedNode)}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                  >
                    View Details →
                  </button>
                )}
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
      </ReactFlow>
      
      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-4 left-4"
          >
            <C4Legend level={currentLevel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * C4 System Node
 */
const C4SystemNode: React.FC<any> = ({ data, selected }) => (
  <C4Node
    data={data}
    selected={selected}
    icon={<Package className="w-5 h-5" />}
    bgColor={data.external ? 'bg-orange-900/50' : 'bg-blue-900/50'}
    borderColor={data.external ? 'border-orange-500' : 'border-blue-500'}
  />
)

/**
 * C4 Container Node
 */
const C4ContainerNode: React.FC<any> = ({ data, selected }) => {
  const icons: Record<string, React.ReactNode> = {
    WebApp: <Globe className="w-5 h-5" />,
    Database: <Database className="w-5 h-5" />,
    MessageBus: <Zap className="w-5 h-5" />,
    FileSystem: <Server className="w-5 h-5" />,
    MobileApp: <Package className="w-5 h-5" />
  }
  
  return (
    <C4Node
      data={data}
      selected={selected}
      icon={icons[data.containerType] || <Package className="w-5 h-5" />}
      bgColor="bg-indigo-900/50"
      borderColor="border-indigo-500"
    />
  )
}

/**
 * C4 Component Node
 */
const C4ComponentNode: React.FC<any> = ({ data, selected }) => (
  <C4Node
    data={data}
    selected={selected}
    icon={<Layers className="w-5 h-5" />}
    bgColor="bg-purple-900/50"
    borderColor="border-purple-500"
  />
)

/**
 * C4 Person Node
 */
const C4PersonNode: React.FC<any> = ({ data, selected }) => (
  <C4Node
    data={data}
    selected={selected}
    icon={<Users className="w-5 h-5" />}
    bgColor="bg-green-900/50"
    borderColor="border-green-500"
    shape="rounded"
  />
)