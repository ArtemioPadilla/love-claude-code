import React, { useState, useCallback, useRef, useEffect } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import { GraphPrimitive } from '../../L0/ui/GraphPrimitive'
import { LayoutEnginePrimitive } from '../../L0/ui/LayoutEnginePrimitive'

/**
 * L1 Zoomable Graph Construct
 * Enhanced graph with pan, zoom, and viewport management
 */
export class ZoomableGraph extends L1UIConstruct {
  private graphPrimitive: GraphPrimitive
  private layoutEngine: LayoutEnginePrimitive
  private viewport = {
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.1,
    maxZoom: 5
  }
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-zoomable-graph',
    name: 'Zoomable Graph',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Enhanced graph visualization with pan, zoom, and minimap',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'diagram', 'visualization'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['graph', 'zoomable', 'pan', 'viewport', 'minimap'],
    inputs: [
      // Graph data inputs
      {
        name: 'nodes',
        type: 'array',
        description: 'Graph nodes',
        required: true,
        defaultValue: []
      },
      {
        name: 'edges',
        type: 'array',
        description: 'Graph edges',
        required: true,
        defaultValue: []
      },
      {
        name: 'directed',
        type: 'boolean',
        description: 'Whether graph is directed',
        required: false,
        defaultValue: false
      },
      // Layout inputs
      {
        name: 'layoutType',
        type: 'string',
        description: 'Layout algorithm',
        required: false,
        defaultValue: 'force',
        validation: {
          enum: ['force', 'hierarchical', 'circular', 'grid']
        }
      },
      // Viewport inputs
      {
        name: 'width',
        type: 'number',
        description: 'Viewport width',
        required: false,
        defaultValue: 800
      },
      {
        name: 'height',
        type: 'number',
        description: 'Viewport height',
        required: false,
        defaultValue: 600
      },
      {
        name: 'initialZoom',
        type: 'number',
        description: 'Initial zoom level',
        required: false,
        defaultValue: 1
      },
      {
        name: 'minZoom',
        type: 'number',
        description: 'Minimum zoom level',
        required: false,
        defaultValue: 0.1
      },
      {
        name: 'maxZoom',
        type: 'number',
        description: 'Maximum zoom level',
        required: false,
        defaultValue: 5
      },
      // Feature toggles
      {
        name: 'enablePan',
        type: 'boolean',
        description: 'Enable panning',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableZoom',
        type: 'boolean',
        description: 'Enable zooming',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableMinimap',
        type: 'boolean',
        description: 'Show minimap',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableControls',
        type: 'boolean',
        description: 'Show zoom controls',
        required: false,
        defaultValue: true
      },
      {
        name: 'zoomSensitivity',
        type: 'number',
        description: 'Mouse wheel zoom sensitivity',
        required: false,
        defaultValue: 0.001
      },
      {
        name: 'fitToViewOnLoad',
        type: 'boolean',
        description: 'Auto-fit graph on load',
        required: false,
        defaultValue: true
      }
    ],
    outputs: [
      {
        name: 'viewport',
        type: 'object',
        description: 'Current viewport state {x, y, zoom}'
      },
      {
        name: 'visibleBounds',
        type: 'object',
        description: 'Visible area bounds'
      },
      {
        name: 'graphBounds',
        type: 'object',
        description: 'Total graph bounds'
      },
      {
        name: 'isInteracting',
        type: 'boolean',
        description: 'Whether user is panning/zooming'
      }
    ],
    security: [
      {
        type: 'input-validation',
        description: 'Validates zoom limits to prevent DoS'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + TypeScript + SVG'
    },
    examples: [
      {
        title: 'Zoomable Network Graph',
        description: 'Create an interactive network visualization',
        code: `const graph = new ZoomableGraph()
await graph.initialize({
  nodes: [
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 300, y: 200 },
    { id: 'C', x: 200, y: 300 }
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'C', target: 'A' }
  ],
  layoutType: 'force',
  enableMinimap: true,
  fitToViewOnLoad: true,
  width: 800,
  height: 600
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use appropriate zoom limits for your data',
      'Enable minimap for large graphs',
      'Implement smooth transitions',
      'Consider performance with many nodes',
      'Provide keyboard shortcuts for accessibility'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 35,
      builtWith: ['platform-l0-graph-primitive', 'platform-l0-layout-engine-primitive'],
      timeToCreate: 60,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ZoomableGraph.definition)
    this.graphPrimitive = new GraphPrimitive()
    this.layoutEngine = new LayoutEnginePrimitive()
  }

  protected async onInitialize(): Promise<void> {
    // Initialize graph primitive
    await this.graphPrimitive.initialize({
      directed: this.getInput('directed'),
      initialData: {
        nodes: this.getInput('nodes'),
        edges: this.getInput('edges'),
        directed: this.getInput('directed')
      }
    })
    
    // Initialize layout engine
    await this.layoutEngine.initialize({
      nodes: this.getInput('nodes'),
      edges: this.getInput('edges'),
      layoutType: this.getInput('layoutType'),
      width: this.getInput('width'),
      height: this.getInput('height'),
      animate: false
    })
    
    // Set initial viewport
    this.viewport = {
      x: 0,
      y: 0,
      zoom: this.getInput('initialZoom') || 1,
      minZoom: this.getInput('minZoom') || 0.1,
      maxZoom: this.getInput('maxZoom') || 5
    }
    
    // Fit to view if requested
    if (this.getInput('fitToViewOnLoad')) {
      this.fitToView()
    }
    
    this.updateOutputs()
  }

  fitToView(padding: number = 50): void {
    const layoutResult = this.layoutEngine.getOutput('layoutResult')
    if (!layoutResult) return
    
    const { bounds } = layoutResult
    const viewportWidth = this.getInput<number>('width')!
    const viewportHeight = this.getInput<number>('height')!
    
    // Calculate zoom to fit
    const zoomX = (viewportWidth - 2 * padding) / bounds.width
    const zoomY = (viewportHeight - 2 * padding) / bounds.height
    const zoom = Math.min(zoomX, zoomY, this.viewport.maxZoom)
    
    // Center the graph
    const centerX = bounds.minX + bounds.width / 2
    const centerY = bounds.minY + bounds.height / 2
    
    this.viewport = {
      ...this.viewport,
      x: viewportWidth / 2 - centerX * zoom,
      y: viewportHeight / 2 - centerY * zoom,
      zoom
    }
    
    this.updateOutputs()
  }

  zoomIn(): void {
    this.setZoom(this.viewport.zoom * 1.2)
  }

  zoomOut(): void {
    this.setZoom(this.viewport.zoom / 1.2)
  }

  setZoom(zoom: number, centerX?: number, centerY?: number): void {
    const clampedZoom = Math.max(this.viewport.minZoom, Math.min(this.viewport.maxZoom, zoom))
    
    if (centerX !== undefined && centerY !== undefined) {
      // Zoom around a specific point
      const scale = clampedZoom / this.viewport.zoom
      this.viewport.x = centerX - (centerX - this.viewport.x) * scale
      this.viewport.y = centerY - (centerY - this.viewport.y) * scale
    }
    
    this.viewport.zoom = clampedZoom
    this.updateOutputs()
  }

  pan(dx: number, dy: number): void {
    this.viewport.x += dx
    this.viewport.y += dy
    this.updateOutputs()
  }

  private updateOutputs(): void {
    const viewportWidth = this.getInput<number>('width')!
    const viewportHeight = this.getInput<number>('height')!
    
    this.setOutput('viewport', { ...this.viewport })
    this.setOutput('visibleBounds', {
      minX: -this.viewport.x / this.viewport.zoom,
      minY: -this.viewport.y / this.viewport.zoom,
      maxX: (viewportWidth - this.viewport.x) / this.viewport.zoom,
      maxY: (viewportHeight - this.viewport.y) / this.viewport.zoom
    })
    
    const layoutResult = this.layoutEngine.getOutput('layoutResult')
    if (layoutResult) {
      this.setOutput('graphBounds', layoutResult.bounds)
    }
  }

  render(): React.ReactElement {
    return <ZoomableGraphComponent construct={this} />
  }
}

/**
 * React component for the zoomable graph
 */
const ZoomableGraphComponent: React.FC<{ construct: ZoomableGraph }> = ({ construct }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState(construct['viewport'])
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // Get inputs
  const width = construct.getInput<number>('width')!
  const height = construct.getInput<number>('height')!
  const enablePan = construct.getInput<boolean>('enablePan')!
  const enableZoom = construct.getInput<boolean>('enableZoom')!
  const enableMinimap = construct.getInput<boolean>('enableMinimap')!
  const enableControls = construct.getInput<boolean>('enableControls')!
  const zoomSensitivity = construct.getInput<number>('zoomSensitivity')!
  
  // Get graph data
  const layoutResult = construct['layoutEngine'].getOutput('layoutResult')
  const graphData = construct['graphPrimitive'].getGraphData()
  
  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return
    e.preventDefault()
    
    const rect = svgRef.current!.getBoundingClientRect()
    const centerX = e.clientX - rect.left
    const centerY = e.clientY - rect.top
    
    const delta = -e.deltaY * zoomSensitivity
    const zoom = viewport.zoom * (1 + delta)
    
    construct['setZoom'](zoom, centerX, centerY)
    setViewport({ ...construct['viewport'] })
  }, [enableZoom, viewport.zoom, zoomSensitivity])
  
  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enablePan) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    construct.setOutput('isInteracting', true)
  }, [enablePan])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    
    construct['pan'](dx - (viewport.x - construct['viewport'].x), dy - (viewport.y - construct['viewport'].y))
    setViewport({ ...construct['viewport'] })
    setPanStart({ x: e.clientX, y: e.clientY })
  }, [isPanning, panStart, viewport])
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    construct.setOutput('isInteracting', false)
  }, [])
  
  // Global mouse events for panning
  useEffect(() => {
    if (isPanning) {
      const handleGlobalMove = (e: MouseEvent) => {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        
        construct['pan'](dx - (viewport.x - construct['viewport'].x), dy - (viewport.y - construct['viewport'].y))
        setViewport({ ...construct['viewport'] })
        setPanStart({ x: e.clientX, y: e.clientY })
      }
      
      const handleGlobalUp = () => {
        setIsPanning(false)
        construct.setOutput('isInteracting', false)
      }
      
      document.addEventListener('mousemove', handleGlobalMove)
      document.addEventListener('mouseup', handleGlobalUp)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMove)
        document.removeEventListener('mouseup', handleGlobalUp)
      }
    }
  }, [isPanning, panStart, viewport])
  
  // Render controls
  const renderControls = () => {
    if (!enableControls) return null
    
    return (
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        zIndex: 10
      }}>
        <button
          onClick={() => {
            construct['zoomIn']()
            setViewport({ ...construct['viewport'] })
          }}
          style={{
            width: 30,
            height: 30,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: 'white',
            cursor: 'pointer',
            fontSize: 18
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            construct['zoomOut']()
            setViewport({ ...construct['viewport'] })
          }}
          style={{
            width: 30,
            height: 30,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: 'white',
            cursor: 'pointer',
            fontSize: 18
          }}
        >
          -
        </button>
        <button
          onClick={() => {
            construct['fitToView']()
            setViewport({ ...construct['viewport'] })
          }}
          style={{
            width: 30,
            height: 30,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: 'white',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ⊡
        </button>
      </div>
    )
  }
  
  // Render minimap
  const renderMinimap = () => {
    if (!enableMinimap || !layoutResult) return null
    
    const minimapWidth = 150
    const minimapHeight = 100
    const { bounds } = layoutResult
    
    const scale = Math.min(
      minimapWidth / bounds.width,
      minimapHeight / bounds.height
    ) * 0.8
    
    return (
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: minimapWidth,
        height: minimapHeight,
        border: '1px solid #ccc',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <svg width={minimapWidth} height={minimapHeight}>
          <g transform={`scale(${scale}) translate(${-bounds.minX + 10 / scale}, ${-bounds.minY + 10 / scale})`}>
            {/* Render mini edges */}
            {graphData.edges.map(edge => {
              const source = layoutResult.nodes.find(n => n.id === edge.source)
              const target = layoutResult.nodes.find(n => n.id === edge.target)
              if (!source || !target) return null
              
              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#ccc"
                  strokeWidth={1 / scale}
                />
              )
            })}
            
            {/* Render mini nodes */}
            {layoutResult.nodes.map(node => (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={3 / scale}
                fill="#666"
              />
            ))}
          </g>
          
          {/* Viewport indicator */}
          <rect
            x={((-viewport.x / viewport.zoom) - bounds.minX) * scale}
            y={((-viewport.y / viewport.zoom) - bounds.minY) * scale}
            width={width / viewport.zoom * scale}
            height={height / viewport.zoom * scale}
            fill="none"
            stroke="#007bff"
            strokeWidth="2"
          />
        </svg>
      </div>
    )
  }
  
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          cursor: isPanning ? 'grabbing' : (enablePan ? 'grab' : 'default'),
          background: '#f5f5f5'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect
            x={layoutResult?.bounds.minX || -1000}
            y={layoutResult?.bounds.minY || -1000}
            width={layoutResult?.bounds.width || 2000}
            height={layoutResult?.bounds.height || 2000}
            fill="url(#grid)"
          />
          
          {/* Render graph content */}
          {layoutResult && (
            <>
              {/* Edges */}
              {graphData.edges.map(edge => {
                const source = layoutResult.nodes.find(n => n.id === edge.source)
                const target = layoutResult.nodes.find(n => n.id === edge.target)
                if (!source || !target) return null
                
                return (
                  <line
                    key={edge.id}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#666"
                    strokeWidth="2"
                  />
                )
              })}
              
              {/* Nodes */}
              {layoutResult.nodes.map(node => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r="20"
                    fill="#4a90e2"
                    stroke="#2c5aa0"
                    strokeWidth="2"
                  />
                  <text
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
          )}
        </g>
      </svg>
      
      {renderControls()}
      {renderMinimap()}
    </div>
  )
}

// Export factory function
export const createZoomableGraph = () => new ZoomableGraph()

// Export the definition for catalog registration
export const zoomableGraphDefinition = ZoomableGraph.definition