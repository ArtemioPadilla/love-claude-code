import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Position,
  Handle,
  NodeProps,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Package, Plus, Save, Play, Trash2, Settings,
  Code2, Layers, GitBranch, Database, Cloud,
  Zap, Shield, Globe, Link2, X
} from 'lucide-react'
import { ConstructDisplay, ConstructLevel, ConstructComposition } from '../types'
import { motion, AnimatePresence } from 'framer-motion'

interface ConstructComposerProps {
  onSave?: (composition: ConstructComposition) => void
  onDeploy?: (composition: ConstructComposition) => void
  availableConstructs: ConstructDisplay[]
}

/**
 * Visual construct composition tool
 */
export const ConstructComposer: React.FC<ConstructComposerProps> = ({
  onSave,
  onDeploy,
  availableConstructs
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showConstructPalette, setShowConstructPalette] = useState(false)
  const [compositionName, setCompositionName] = useState('My Composition')
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4b5563' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4b5563'
      }
    }, eds))
  }, [setEdges])
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      const constructId = event.dataTransfer.getData('constructId')
      const construct = availableConstructs.find(c => c.definition.id === constructId)
      
      if (!construct || !reactFlowWrapper.current || !reactFlowInstance) return
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })
      
      const newNode: Node = {
        id: `${Date.now()}`,
        type: 'constructNode',
        position,
        data: {
          construct,
          label: construct.definition.name,
          config: {}
        }
      }
      
      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, availableConstructs]
  )
  
  const handleSave = () => {
    const composition: ConstructComposition = {
      id: Date.now().toString(),
      name: compositionName,
      constructs: nodes.map(node => ({
        constructId: node.data.construct.definition.id,
        instanceName: node.id,
        position: node.position,
        config: node.data.config || {},
        connections: edges
          .filter(edge => edge.source === node.id)
          .map(edge => ({
            targetInstance: edge.target,
            type: 'data-flow',
            config: {}
          }))
      })),
      metadata: {
        description: `Composition of ${nodes.length} constructs`,
        tags: ['composed'],
        author: 'current-user'
      }
    }
    
    onSave?.(composition)
  }
  
  const handleDeploy = () => {
    const composition: ConstructComposition = {
      id: Date.now().toString(),
      name: compositionName,
      constructs: nodes.map(node => ({
        constructId: node.data.construct.definition.id,
        instanceName: node.id,
        position: node.position,
        config: node.data.config || {},
        connections: edges
          .filter(edge => edge.source === node.id)
          .map(edge => ({
            targetInstance: edge.target,
            type: 'data-flow',
            config: {}
          }))
      }))
    }
    
    onDeploy?.(composition)
  }
  
  const nodeTypes: NodeTypes = {
    constructNode: ConstructNode
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Package className="w-6 h-6 text-blue-500" />
          <input
            type="text"
            value={compositionName}
            onChange={(e) => setCompositionName(e.target.value)}
            className="bg-gray-700 px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Composition name"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConstructPalette(!showConstructPalette)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Construct
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleDeploy}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Deploy
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Construct Palette */}
        <AnimatePresence>
          {showConstructPalette && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-gray-700 overflow-y-auto"
            >
              <ConstructPalette constructs={availableConstructs} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#4b5563" gap={16} />
            <Controls className="bg-gray-800 border border-gray-700" />
            <MiniMap 
              className="bg-gray-800 border border-gray-700"
              nodeColor="#1f2937"
              maskColor="rgba(0, 0, 0, 0.8)"
            />
          </ReactFlow>
        </div>
        
        {/* Properties Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-700 overflow-y-auto"
            >
              <PropertiesPanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)}
                onUpdate={(config) => {
                  setNodes(nodes => nodes.map(n => 
                    n.id === selectedNode.id 
                      ? { ...n, data: { ...n.data, config } }
                      : n
                  ))
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Construct palette component
 */
const ConstructPalette: React.FC<{ constructs: ConstructDisplay[] }> = ({ constructs }) => {
  const onDragStart = (event: React.DragEvent, construct: ConstructDisplay) => {
    event.dataTransfer.setData('constructId', construct.definition.id)
    event.dataTransfer.effectAllowed = 'move'
  }
  
  // Group constructs by level
  const constructsByLevel = constructs.reduce((acc, construct) => {
    const level = construct.definition.level
    if (!acc[level]) acc[level] = []
    acc[level].push(construct)
    return acc
  }, {} as Record<ConstructLevel, ConstructDisplay[]>)
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Available Constructs</h3>
      <div className="space-y-6">
        {Object.entries(constructsByLevel).map(([level, constructs]) => (
          <div key={level}>
            <h4 className="text-sm font-medium text-gray-400 mb-2">{level} Constructs</h4>
            <div className="space-y-2">
              {constructs.map(construct => (
                <div
                  key={construct.definition.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, construct)}
                  className="bg-gray-800 rounded-lg p-3 cursor-move hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${getLevelColor(level as ConstructLevel)}`}>
                      {getConstructIcon(construct.definition.categories[0])}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{construct.definition.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {construct.definition.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Properties panel component
 */
const PropertiesPanel: React.FC<{
  node: Node
  onClose: () => void
  onUpdate: (config: any) => void
}> = ({ node, onClose, onUpdate }) => {
  const construct: ConstructDisplay = node.data.construct
  const [config, setConfig] = useState(node.data.config || {})
  
  const handleInputChange = (inputName: string, value: any) => {
    const newConfig = { ...config, [inputName]: value }
    setConfig(newConfig)
    onUpdate(newConfig)
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Properties</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Construct Info */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-2">{construct.definition.name}</h4>
          <p className="text-sm text-gray-400">{construct.definition.description}</p>
        </div>
        
        {/* Configuration Inputs */}
        {construct.definition.inputs.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Configuration</h4>
            <div className="space-y-3">
              {construct.definition.inputs.map(input => (
                <div key={input.name}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {input.name}
                    {input.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type={input.type === 'number' ? 'number' : 'text'}
                    value={config[input.name] || input.defaultValue || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-sm"
                    placeholder={input.description}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Outputs */}
        {construct.definition.outputs.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Outputs</h4>
            <div className="space-y-2">
              {construct.definition.outputs.map(output => (
                <div key={output.name} className="text-sm">
                  <span className="text-green-400">{output.name}</span>
                  <span className="text-gray-500 ml-2">({output.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Custom node component
 */
const ConstructNode: React.FC<NodeProps> = ({ data, selected }) => {
  const construct: ConstructDisplay = data.construct
  const levelColor = getLevelColor(construct.definition.level)
  const Icon = getConstructIcon(construct.definition.categories[0])
  
  return (
    <div className={`bg-gray-800 rounded-lg p-4 min-w-[200px] border-2 ${
      selected ? 'border-blue-500' : 'border-gray-700'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-gray-900"
      />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded ${levelColor}`}>
          {Icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{data.label}</p>
          <p className="text-xs text-gray-400">{construct.definition.level}</p>
        </div>
      </div>
      
      {/* Show configured values */}
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Configured</p>
          <div className="flex flex-wrap gap-1">
            {Object.keys(data.config).map(key => (
              <span key={key} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-gray-900"
      />
    </div>
  )
}

/**
 * Helper functions
 */
function getLevelColor(level: ConstructLevel): string {
  const colors = {
    [ConstructLevel.L0]: 'bg-gray-700',
    [ConstructLevel.L1]: 'bg-blue-900/50',
    [ConstructLevel.L2]: 'bg-purple-900/50',
    [ConstructLevel.L3]: 'bg-green-900/50'
  }
  return colors[level]
}

function getConstructIcon(category?: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    'storage': <Cloud className="w-4 h-4" />,
    'database': <Database className="w-4 h-4" />,
    'compute': <Zap className="w-4 h-4" />,
    'security': <Shield className="w-4 h-4" />,
    'api': <Code2 className="w-4 h-4" />,
    'pattern': <GitBranch className="w-4 h-4" />,
    'application': <Package className="w-4 h-4" />,
    'default': <Layers className="w-4 h-4" />
  }
  return icons[category || 'default'] || icons.default
}