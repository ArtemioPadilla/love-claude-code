import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import { EdgePrimitive } from '../../L0/ui/diagram/EdgePrimitive'

/**
 * L1 Connected Edge Construct
 * Enhanced edge with automatic path recalculation and decorations
 */
export class ConnectedEdge extends L1UIConstruct {
  private edgePrimitive: EdgePrimitive
  private connectionAnchors = {
    source: { side: 'right', offset: 0.5 },
    target: { side: 'left', offset: 0.5 }
  }
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-connected-edge',
    name: 'Connected Edge',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Enhanced edge with automatic path recalculation and connection anchors',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'diagram', 'connection'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['edge', 'connection', 'diagram', 'path'],
    inputs: [
      // Inherit base inputs from EdgePrimitive
      {
        name: 'id',
        type: 'string',
        description: 'Unique identifier for the edge',
        required: true
      },
      {
        name: 'source',
        type: 'object',
        description: 'Source node connection info',
        required: true
      },
      {
        name: 'target',
        type: 'object',
        description: 'Target node connection info',
        required: true
      },
      {
        name: 'label',
        type: 'string',
        description: 'Edge label text',
        required: false
      },
      {
        name: 'style',
        type: 'object',
        description: 'Visual styling options',
        required: false,
        defaultValue: {}
      },
      // New L1 inputs
      {
        name: 'edgeType',
        type: 'string',
        description: 'Type of edge path',
        required: false,
        defaultValue: 'bezier',
        validation: {
          enum: ['straight', 'bezier', 'step', 'smooth']
        }
      },
      {
        name: 'sourceAnchor',
        type: 'object',
        description: 'Source connection anchor {side, offset}',
        required: false,
        defaultValue: { side: 'right', offset: 0.5 }
      },
      {
        name: 'targetAnchor',
        type: 'object',
        description: 'Target connection anchor {side, offset}',
        required: false,
        defaultValue: { side: 'left', offset: 0.5 }
      },
      {
        name: 'labelStyle',
        type: 'object',
        description: 'Label styling options',
        required: false,
        defaultValue: {
          background: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }
      },
      {
        name: 'labelPosition',
        type: 'number',
        description: 'Label position along edge (0-1)',
        required: false,
        defaultValue: 0.5
      },
      {
        name: 'startDecoration',
        type: 'string',
        description: 'Decoration at edge start',
        required: false,
        defaultValue: 'none',
        validation: {
          enum: ['none', 'arrow', 'circle', 'square', 'diamond']
        }
      },
      {
        name: 'endDecoration',
        type: 'string',
        description: 'Decoration at edge end',
        required: false,
        defaultValue: 'arrow',
        validation: {
          enum: ['none', 'arrow', 'circle', 'square', 'diamond']
        }
      },
      {
        name: 'curvature',
        type: 'number',
        description: 'Curvature factor for bezier edges',
        required: false,
        defaultValue: 0.25
      },
      {
        name: 'updateOnNodeMove',
        type: 'boolean',
        description: 'Auto-update path when nodes move',
        required: false,
        defaultValue: true
      }
    ],
    outputs: [
      // Inherit outputs from EdgePrimitive
      {
        name: 'path',
        type: 'string',
        description: 'Calculated SVG path'
      },
      {
        name: 'bounds',
        type: 'object',
        description: 'Edge bounding box'
      },
      {
        name: 'midpoint',
        type: 'object',
        description: 'Edge midpoint with angle'
      },
      // New L1 outputs
      {
        name: 'connectionPoints',
        type: 'object',
        description: 'Calculated connection points'
      },
      {
        name: 'pathData',
        type: 'object',
        description: 'Detailed path information'
      }
    ],
    security: [
      {
        type: 'input-sanitization',
        description: 'Sanitizes label content to prevent XSS'
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
        title: 'Connected Bezier Edge',
        description: 'Create a curved edge with decorations',
        code: `const edge = new ConnectedEdge()
await edge.initialize({
  id: 'edge-1',
  source: { nodeId: 'node-1', x: 200, y: 100 },
  target: { nodeId: 'node-2', x: 400, y: 200 },
  edgeType: 'bezier',
  label: 'Connection',
  sourceAnchor: { side: 'right', offset: 0.5 },
  targetAnchor: { side: 'left', offset: 0.5 },
  endDecoration: 'arrow',
  style: {
    stroke: '#007bff',
    strokeWidth: 2
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use appropriate edge types for different diagram styles',
      'Provide clear labels for complex relationships',
      'Use decorations to show directionality',
      'Consider performance with many edges',
      'Implement smooth path transitions'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 25,
      builtWith: ['platform-l0-edge-primitive'],
      timeToCreate: 40,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ConnectedEdge.definition)
    this.edgePrimitive = new EdgePrimitive()
  }

  protected async onInitialize(): Promise<void> {
    // Calculate connection points based on anchors
    const connectionPoints = this.calculateConnectionPoints()
    
    // Initialize the underlying primitive with calculated points
    await this.edgePrimitive.initialize({
      ...this.getAllInputs(),
      source: connectionPoints.source,
      target: connectionPoints.target,
      controlPoints: this.calculateControlPoints(connectionPoints),
      arrowHead: this.getInput<string>('endDecoration'),
      arrowTail: this.getInput<string>('startDecoration')
    })
    
    this.setOutput('connectionPoints', connectionPoints)
  }

  private calculateConnectionPoints(): { source: any, target: any } {
    const source = this.getInput<any>('source')!
    const target = this.getInput<any>('target')!
    const sourceAnchor = this.getInput<any>('sourceAnchor')!
    const targetAnchor = this.getInput<any>('targetAnchor')!
    
    // Calculate actual connection points based on anchors
    const sourcePoint = this.getAnchorPoint(source, sourceAnchor)
    const targetPoint = this.getAnchorPoint(target, targetAnchor)
    
    return { source: sourcePoint, target: targetPoint }
  }

  private getAnchorPoint(node: any, anchor: any): { x: number, y: number } {
    const { x, y, width = 100, height = 50 } = node
    const { side, offset = 0.5 } = anchor
    
    switch (side) {
      case 'top':
        return { x: x + width * offset, y }
      case 'right':
        return { x: x + width, y: y + height * offset }
      case 'bottom':
        return { x: x + width * offset, y: y + height }
      case 'left':
        return { x, y: y + height * offset }
      default:
        return { x: x + width / 2, y: y + height / 2 }
    }
  }

  private calculateControlPoints(connectionPoints: any): any[] {
    const edgeType = this.getInput<string>('edgeType')!
    const curvature = this.getInput<number>('curvature')!
    const { source, target } = connectionPoints
    
    switch (edgeType) {
      case 'straight':
        return []
      
      case 'bezier': {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const offset = distance * curvature
        
        return [
          { x: source.x + offset, y: source.y },
          { x: target.x - offset, y: target.y }
        ]
      }
      
      case 'step': {
        const midX = (source.x + target.x) / 2
        return [
          { x: midX, y: source.y },
          { x: midX, y: target.y }
        ]
      }
      
      case 'smooth': {
        const smoothOffset = Math.abs(target.x - source.x) * curvature
        return [
          { x: source.x + smoothOffset, y: source.y },
          { x: target.x - smoothOffset, y: target.y }
        ]
      }
      
      default:
        return []
    }
  }

  updatePath(sourceNode?: any, targetNode?: any): void {
    if (sourceNode) {
      this.setInput('source', { ...this.getInput('source'), ...sourceNode })
    }
    if (targetNode) {
      this.setInput('target', { ...this.getInput('target'), ...targetNode })
    }
    
    // Recalculate path
    const connectionPoints = this.calculateConnectionPoints()
    const controlPoints = this.calculateControlPoints(connectionPoints)
    
    // Update primitive
    this.edgePrimitive.setInput('source', connectionPoints.source)
    this.edgePrimitive.setInput('target', connectionPoints.target)
    this.edgePrimitive.setInput('controlPoints', controlPoints)
    
    this.setOutput('connectionPoints', connectionPoints)
    this.setOutput('pathData', {
      type: this.getInput('edgeType'),
      source: connectionPoints.source,
      target: connectionPoints.target,
      controlPoints
    })
  }

  render(): React.ReactElement {
    return <ConnectedEdgeComponent construct={this} />
  }
}

/**
 * React component for the connected edge
 */
const ConnectedEdgeComponent: React.FC<{ construct: ConnectedEdge }> = ({ construct }) => {
  const [hovering, setHovering] = useState(false)
  
  // Get inputs
  const id = construct.getInput<string>('id')!
  const label = construct.getInput<string>('label')
  const labelStyle = construct.getInput<any>('labelStyle')!
  const labelPosition = construct.getInput<number>('labelPosition')!
  const style = construct.getInput<any>('style') || {}
  const updateOnNodeMove = construct.getInput<boolean>('updateOnNodeMove')!
  
  // Get edge primitive outputs
  const path = construct['edgePrimitive'].getOutput<string>('path')
  const midpoint = construct['edgePrimitive'].getOutput<any>('midpoint')
  
  // Enhanced style with hover effect
  const enhancedStyle = useMemo(() => ({
    ...style,
    stroke: hovering ? (style.hoverStroke || '#0056b3') : (style.stroke || '#007bff'),
    strokeWidth: hovering ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2),
    transition: 'all 0.2s ease'
  }), [style, hovering])
  
  // Handle hover events
  const handleMouseEnter = useCallback(() => {
    setHovering(true)
    construct.emit('hover', { edge: id, hovering: true })
  }, [id])
  
  const handleMouseLeave = useCallback(() => {
    setHovering(false)
    construct.emit('hover', { edge: id, hovering: false })
  }, [id])
  
  // Handle click
  const handleClick = useCallback(() => {
    construct.emit('click', { edge: id })
  }, [id])
  
  // Listen for node updates if enabled
  useEffect(() => {
    if (!updateOnNodeMove) return
    
    const handleNodeUpdate = (event: CustomEvent) => {
      const { nodeId, position } = event.detail
      const source = construct.getInput<any>('source')
      const target = construct.getInput<any>('target')
      
      if (source?.nodeId === nodeId) {
        construct['updatePath']({ ...position, width: source.width, height: source.height })
      } else if (target?.nodeId === nodeId) {
        construct['updatePath'](undefined, { ...position, width: target.width, height: target.height })
      }
    }
    
    window.addEventListener('nodePositionUpdate', handleNodeUpdate as EventListener)
    return () => {
      window.removeEventListener('nodePositionUpdate', handleNodeUpdate as EventListener)
    }
  }, [updateOnNodeMove])
  
  // Render edge decorations
  const renderDecorations = () => {
    const decorations = []
    const startDecoration = construct.getInput<string>('startDecoration')
    const endDecoration = construct.getInput<string>('endDecoration')
    
    if (startDecoration !== 'none' || endDecoration !== 'none') {
      decorations.push(
        <defs key="decorations">
          {startDecoration !== 'none' && (
            <marker
              id={`${id}-start`}
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              {renderDecoration(startDecoration, enhancedStyle.stroke)}
            </marker>
          )}
          {endDecoration !== 'none' && (
            <marker
              id={`${id}-end`}
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              {renderDecoration(endDecoration, enhancedStyle.stroke)}
            </marker>
          )}
        </defs>
      )
    }
    
    return decorations
  }
  
  const renderDecoration = (type: string, color: string) => {
    switch (type) {
      case 'arrow':
        return <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      case 'circle':
        return <circle cx="5" cy="5" r="3" fill={color} stroke="none" />
      case 'square':
        return <rect x="2" y="2" width="6" height="6" fill={color} />
      case 'diamond':
        return <path d="M 5 1 L 9 5 L 5 9 L 1 5 z" fill={color} />
      default:
        return null
    }
  }
  
  // Render label with background
  const renderLabel = () => {
    if (!label || !midpoint) return null
    
    return (
      <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
        <rect
          x={-label.length * 3.5}
          y={-10}
          width={label.length * 7}
          height={20}
          fill={labelStyle.background}
          stroke={enhancedStyle.stroke}
          strokeWidth="1"
          rx={labelStyle.borderRadius || 4}
          opacity="0.9"
        />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={labelStyle.fontSize}
          fill={enhancedStyle.stroke}
          style={{ userSelect: 'none' }}
        >
          {label}
        </text>
      </g>
    )
  }
  
  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {renderDecorations()}
      
      {/* Hit area for easier selection */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="10"
        fill="none"
      />
      
      {/* Visible edge */}
      <path
        d={path}
        fill="none"
        stroke={enhancedStyle.stroke}
        strokeWidth={enhancedStyle.strokeWidth}
        strokeDasharray={enhancedStyle.strokeDasharray}
        markerStart={construct.getInput('startDecoration') !== 'none' ? `url(#${id}-start)` : undefined}
        markerEnd={construct.getInput('endDecoration') !== 'none' ? `url(#${id}-end)` : undefined}
        style={{ transition: enhancedStyle.transition }}
      />
      
      {renderLabel()}
    </g>
  )
}

// Export factory function
export const createConnectedEdge = () => new ConnectedEdge()

// Export the definition for catalog registration
export const connectedEdgeDefinition = ConnectedEdge.definition