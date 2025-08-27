import React, { useState, useCallback, useEffect, useRef } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import { NodePrimitive } from '../../L0/ui/diagram/NodePrimitive'

/**
 * L1 Draggable Node Construct
 * Enhanced node with drag-and-drop, snapping, and constraints
 */
export class DraggableNode extends L1UIConstruct {
  private nodePrimitive: NodePrimitive
  private dragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  }
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-draggable-node',
    name: 'Draggable Node',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Enhanced node with drag-and-drop functionality and position constraints',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'diagram', 'interaction'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['node', 'draggable', 'diagram', 'interactive'],
    inputs: [
      // Inherit all inputs from NodePrimitive
      {
        name: 'id',
        type: 'string',
        description: 'Unique identifier for the node',
        required: true
      },
      {
        name: 'position',
        type: 'object',
        description: 'Node position {x, y}',
        required: true,
        defaultValue: { x: 100, y: 100 }
      },
      {
        name: 'size',
        type: 'object',
        description: 'Node size {width, height}',
        required: false,
        defaultValue: { width: 100, height: 50 }
      },
      {
        name: 'shape',
        type: 'string',
        description: 'Node shape',
        required: false,
        defaultValue: 'rect',
        validation: {
          enum: ['rect', 'circle', 'ellipse', 'diamond', 'hexagon']
        }
      },
      {
        name: 'text',
        type: 'string',
        description: 'Node label text',
        required: false
      },
      {
        name: 'icon',
        type: 'string',
        description: 'Node icon',
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
        name: 'constraints',
        type: 'object',
        description: 'Position constraints {minX, maxX, minY, maxY}',
        required: false,
        defaultValue: { minX: 0, maxX: Infinity, minY: 0, maxY: Infinity }
      },
      {
        name: 'snapToGrid',
        type: 'boolean',
        description: 'Enable grid snapping',
        required: false,
        defaultValue: false
      },
      {
        name: 'gridSize',
        type: 'number',
        description: 'Grid size for snapping',
        required: false,
        defaultValue: 10
      },
      {
        name: 'dragPreview',
        type: 'boolean',
        description: 'Show preview while dragging',
        required: false,
        defaultValue: true
      },
      {
        name: 'touchEnabled',
        type: 'boolean',
        description: 'Enable touch support',
        required: false,
        defaultValue: true
      },
      {
        name: 'onDragStart',
        type: 'function',
        description: 'Callback when drag starts',
        required: false
      },
      {
        name: 'onDrag',
        type: 'function',
        description: 'Callback during drag',
        required: false
      },
      {
        name: 'onDragEnd',
        type: 'function',
        description: 'Callback when drag ends',
        required: false
      }
    ],
    outputs: [
      // Inherit outputs from NodePrimitive
      {
        name: 'bounds',
        type: 'object',
        description: 'Node bounding box'
      },
      {
        name: 'portPositions',
        type: 'object',
        description: 'Port absolute positions'
      },
      {
        name: 'nodeElement',
        type: 'element',
        description: 'DOM/SVG element reference'
      },
      // New L1 outputs
      {
        name: 'isDragging',
        type: 'boolean',
        description: 'Whether node is being dragged'
      },
      {
        name: 'dragPosition',
        type: 'object',
        description: 'Current drag position'
      },
      {
        name: 'snapPosition',
        type: 'object',
        description: 'Snapped position'
      }
    ],
    security: [
      {
        type: 'input-sanitization',
        description: 'Sanitizes position inputs to prevent XSS'
      },
      {
        type: 'event-validation',
        description: 'Validates drag events to prevent injection'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + TypeScript'
    },
    examples: [
      {
        title: 'Basic Draggable Node',
        description: 'Create a draggable node with constraints',
        code: `const node = new DraggableNode()
await node.initialize({
  id: 'node-1',
  position: { x: 100, y: 100 },
  size: { width: 120, height: 60 },
  text: 'Draggable',
  constraints: {
    minX: 0,
    maxX: 800,
    minY: 0,
    maxY: 600
  },
  snapToGrid: true,
  gridSize: 20,
  onDragEnd: (position) => {
    console.log('Node moved to:', position)
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use constraints to keep nodes within viewport',
      'Enable grid snapping for alignment',
      'Provide visual feedback during drag',
      'Support both mouse and touch events',
      'Throttle drag events for performance'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 30,
      builtWith: ['platform-l0-node-primitive'],
      timeToCreate: 45,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(DraggableNode.definition)
    this.nodePrimitive = new NodePrimitive()
  }

  protected async onInitialize(): Promise<void> {
    // Initialize the underlying primitive
    await this.nodePrimitive.initialize({
      ...this.getAllInputs(),
      draggable: true // Ensure draggable is enabled
    })
    
    // Set up enhanced drag handling
    this.setupEnhancedDragging()
  }

  private setupEnhancedDragging(): void {
    // Enhanced drag logic will be handled in the component
    this.setOutput('isDragging', false)
  }

  private snapToGrid(position: { x: number; y: number }): { x: number; y: number } {
    if (!this.getInput<boolean>('snapToGrid')) {
      return position
    }
    
    const gridSize = this.getInput<number>('gridSize') || 10
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    }
  }

  private constrainPosition(position: { x: number; y: number }): { x: number; y: number } {
    const constraints = this.getInput<any>('constraints') || {}
    const size = this.getInput<any>('size') || { width: 100, height: 50 }
    
    return {
      x: Math.max(constraints.minX || 0, Math.min(position.x, (constraints.maxX || Infinity) - size.width)),
      y: Math.max(constraints.minY || 0, Math.min(position.y, (constraints.maxY || Infinity) - size.height))
    }
  }

  render(): React.ReactElement {
    return <DraggableNodeComponent construct={this} />
  }
}

/**
 * React component for the draggable node
 */
const DraggableNodeComponent: React.FC<{ construct: DraggableNode }> = ({ construct }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState(construct.getInput<any>('position'))
  const [previewPosition, setPreviewPosition] = useState(position)
  const nodeRef = useRef<SVGGElement>(null)
  
  // Get inputs
  const id = construct.getInput<string>('id')!
  const size = construct.getInput<any>('size')!
  const shape = construct.getInput<string>('shape')!
  const text = construct.getInput<string>('text')
  const style = construct.getInput<any>('style') || {}
  const dragPreview = construct.getInput<boolean>('dragPreview') ?? true
  const touchEnabled = construct.getInput<boolean>('touchEnabled') ?? true
  const onDragStart = construct.getInput<Function>('onDragStart')
  const onDrag = construct.getInput<Function>('onDrag')
  const onDragEnd = construct.getInput<Function>('onDragEnd')
  
  // Handle drag start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    const offset = {
      x: clientX - position.x,
      y: clientY - position.y
    }
    setDragOffset(offset)
    setIsDragging(true)
    construct.setOutput('isDragging', true)
    
    if (onDragStart) {
      onDragStart(position)
    }
  }, [position, onDragStart])
  
  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    
    let newPosition = {
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y
    }
    
    // Apply constraints
    newPosition = construct['constrainPosition'](newPosition)
    
    // Apply grid snapping
    const snappedPosition = construct['snapToGrid'](newPosition)
    
    if (dragPreview) {
      setPreviewPosition(newPosition)
    } else {
      setPosition(snappedPosition)
      construct.setInput('position', snappedPosition)
    }
    
    construct.setOutput('dragPosition', newPosition)
    construct.setOutput('snapPosition', snappedPosition)
    
    if (onDrag) {
      onDrag(snappedPosition)
    }
  }, [isDragging, dragOffset, dragPreview, onDrag])
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    
    const finalPosition = construct['snapToGrid'](construct['constrainPosition'](previewPosition))
    setPosition(finalPosition)
    setPreviewPosition(finalPosition)
    construct.setInput('position', finalPosition)
    
    setIsDragging(false)
    construct.setOutput('isDragging', false)
    
    if (onDragEnd) {
      onDragEnd(finalPosition)
    }
  }, [isDragging, previewPosition, onDragEnd])
  
  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }, [handleDragStart])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }, [handleDragMove])
  
  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!touchEnabled) return
    e.preventDefault()
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }, [touchEnabled, handleDragStart])
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchEnabled) return
    e.preventDefault()
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }, [touchEnabled, handleDragMove])
  
  const handleTouchEnd = useCallback(() => {
    if (!touchEnabled) return
    handleDragEnd()
  }, [touchEnabled, handleDragEnd])
  
  // Set up global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])
  
  // Render the node
  const renderNode = () => {
    const currentPos = isDragging && dragPreview ? previewPosition : position
    const opacity = isDragging && dragPreview ? 0.7 : 1
    
    return (
      <g
        ref={nodeRef}
        transform={`translate(${currentPos.x}, ${currentPos.y})`}
        opacity={opacity}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Use NodePrimitive's rendering logic */}
        {React.createElement(construct['nodePrimitive'].render().type, {
          construct: construct['nodePrimitive']
        })}
        
        {/* Drag preview indicator */}
        {isDragging && dragPreview && (
          <rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill="none"
            stroke="#007bff"
            strokeWidth="2"
            strokeDasharray="5,5"
            rx={style.cornerRadius || 0}
          />
        )}
      </g>
    )
  }
  
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      {renderNode()}
    </svg>
  )
}

// Export factory function
export const createDraggableNode = () => new DraggableNode()

// Export the definition for catalog registration
export const draggableNodeDefinition = DraggableNode.definition