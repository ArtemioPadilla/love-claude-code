/**
 * Visual Construct Composer
 * 
 * A drag-and-drop visual programming interface for creating constructs
 * by composing them visually and generating code automatically
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  Connection,
  addEdge,
  MarkerType,
  Panel,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Save,
  Play,
  Code,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  Maximize2,
  Grid3x3,
  Layers,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConstructPalette } from './ConstructPalette'
import { PropertyEditor } from './PropertyEditor'
import { CodePreview } from './CodePreview'
import { ConstructBlock } from './ConstructBlock'
import { CompositionCanvas } from './CompositionCanvas'
import { Header } from '../Layout/Header'
import { useConstructStore } from '../../stores/constructStore'
import { ConstructLevel, ConstructDisplay } from '../../constructs/types'
import { generateCompositionCode } from './codeGenerator'
import { validateComposition } from './compositionValidator'

const nodeTypes = {
  constructBlock: ConstructBlock
}

type CompositionNodeData = {
  construct: ConstructDisplay
  config: Record<string, any>
  validation?: {
    valid: boolean
    errors: string[]
  }
}

type CompositionNode = Node<CompositionNodeData>

interface CompositionState {
  name: string
  description: string
  nodes: CompositionNode[]
  edges: Edge[]
  metadata: {
    createdAt: Date
    updatedAt: Date
    author: string
  }
}

const VisualConstructComposerContent: React.FC = () => {
  const reactFlowInstance = useReactFlow()
  const { constructs, fetchConstructs } = useConstructStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<CompositionNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<CompositionNode | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showMinimap, setShowMinimap] = useState(true)
  const [showCodePreview, setShowCodePreview] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [compositionName, setCompositionName] = useState('New Composition')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Load constructs on mount
  useEffect(() => {
    fetchConstructs()
  }, [fetchConstructs])

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: CompositionNode) => {
    setSelectedNode(node)
  }, [])

  // Handle edge connection
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4B5563', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4B5563'
      }
    }, eds))
  }, [setEdges])

  // Handle construct drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return
      }

      const constructData = JSON.parse(type)
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: CompositionNode = {
        id: `${Date.now()}`,
        type: 'constructBlock',
        position,
        data: {
          construct: constructData,
          config: {},
          validation: { valid: true, errors: [] }
        },
        draggable: true,
        selectable: true,
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance, setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Update node configuration
  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, config }
          }
        }
        return node
      })
    )
  }, [setNodes])

  // Validate composition
  const validateCompositionHandler = useCallback(() => {
    const validation = validateComposition(nodes, edges)
    setValidationErrors(validation.errors)

    // Update node validation states
    setNodes((nds) =>
      nds.map((node) => {
        const nodeValidation = validation.nodeValidations[node.id]
        return {
          ...node,
          data: {
            ...node.data,
            validation: nodeValidation
          }
        }
      })
    )

    return validation.valid
  }, [nodes, edges, setNodes])

  // Generate code from composition
  const generateCode = useCallback(() => {
    if (!validateCompositionHandler()) {
      return
    }

    const code = generateCompositionCode({
      name: compositionName,
      nodes,
      edges
    })
    setGeneratedCode(code)
    setShowCodePreview(true)
  }, [nodes, edges, compositionName, validateCompositionHandler])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNode(null)
    setGeneratedCode('')
    setValidationErrors([])
  }, [setNodes, setEdges])

  // Save composition
  const saveComposition = useCallback(() => {
    const composition: CompositionState = {
      name: compositionName,
      description: '',
      nodes,
      edges,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'current-user' // Would come from auth
      }
    }
    
    // In a real implementation, this would save to backend
    console.log('Saving composition:', composition)
    localStorage.setItem(`composition-${composition.name}`, JSON.stringify(composition))
  }, [nodes, edges, compositionName])

  // Export as JSON
  const exportComposition = useCallback(() => {
    const composition = {
      name: compositionName,
      nodes,
      edges,
      generatedCode
    }
    
    const blob = new Blob([JSON.stringify(composition, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${compositionName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges, compositionName, generatedCode])

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <Header />
      
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={compositionName}
              onChange={(e) => setCompositionName(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Composition name..."
            />
            
            <div className="flex items-center gap-2">
              <button
                onClick={saveComposition}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                title="Save composition"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              
              <button
                onClick={exportComposition}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                title="Export composition"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <button
                onClick={generateCode}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                title="Generate code"
              >
                <Code className="w-4 h-4" />
                Generate
              </button>
              
              <button
                onClick={clearCanvas}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                title="Clear canvas"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Toggle grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`p-2 rounded-lg transition-colors ${
                showMinimap ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Toggle minimap"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowCodePreview(!showCodePreview)}
              className={`p-2 rounded-lg transition-colors ${
                showCodePreview ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Toggle code preview"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="text-sm text-red-400">
              {validationErrors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Palette */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
          <ConstructPalette constructs={constructs} />
        </div>
        
        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            {showGrid && (
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1}
                color="#374151"
              />
            )}
            <Controls />
            {showMinimap && (
              <MiniMap 
                nodeColor={(node) => {
                  const level = node.data?.construct?.definition?.level
                  switch (level) {
                    case ConstructLevel.L0: {
                      return '#10B981'
                    }
                    case ConstructLevel.L1: {
                      return '#3B82F6'
                    }
                    case ConstructLevel.L2: {
                      return '#8B5CF6'
                    }
                    case ConstructLevel.L3: {
                      return '#F59E0B'
                    }
                    default: {
                      return '#6B7280'
                    }
                  }
                }}
                pannable
                zoomable
              />
            )}
          </ReactFlow>
          
          {/* Status bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 px-4 py-2 text-sm text-gray-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Nodes: {nodes.length}</span>
                <span>•</span>
                <span>Connections: {edges.length}</span>
                <span>•</span>
                <span>Status: {validationErrors.length === 0 ? '✓ Valid' : '⚠ Invalid'}</span>
              </div>
              <div>
                {selectedNode && (
                  <span>Selected: {selectedNode.data.construct.definition.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Property panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-hidden flex flex-col">
          <PropertyEditor
            node={selectedNode}
            onUpdateConfig={(config) => {
              if (selectedNode) {
                updateNodeConfig(selectedNode.id, config)
              }
            }}
          />
        </div>
      </div>
      
      {/* Code preview modal */}
      <AnimatePresence>
        {showCodePreview && generatedCode && (
          <CodePreview
            code={generatedCode}
            onClose={() => setShowCodePreview(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export const VisualConstructComposer: React.FC = () => {
  return (
    <ReactFlowProvider>
      <VisualConstructComposerContent />
    </ReactFlowProvider>
  )
}