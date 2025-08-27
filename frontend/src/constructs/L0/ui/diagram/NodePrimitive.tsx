import React, { useRef, useEffect, useState, useCallback } from 'react'
import { L0UIConstruct } from '../../../base/L0Construct'
import { nodePrimitiveDefinition } from './NodePrimitive.definition'

/**
 * L0 Node Primitive Construct
 * Foundation for diagram node visualization with SVG/Canvas dual rendering
 */
export class NodePrimitive extends L0UIConstruct {
  static definition = nodePrimitiveDefinition

  private bounds = { x: 0, y: 0, width: 100, height: 50 }
  private portPositions: Record<string, { x: number; y: number }> = {}
  private isSelected = false
  private isDragging = false

  constructor() {
    super(NodePrimitive.definition)
  }

  /**
   * Calculate port positions based on node shape and size
   */
  calculatePortPositions() {
    const ports = this.getInput<any[]>('ports') || []
    const position = this.getInput<{ x: number; y: number }>('position')!
    const size = this.getInput<{ width: number; height: number }>('size')!
    const shape = this.getInput<string>('shape')!

    const positions: Record<string, { x: number; y: number }> = {}

    ports.forEach((port) => {
      const offset = port.offset || 0.5
      let x = position.x
      let y = position.y

      switch (port.position) {
        case 'top':
          x = position.x + size.width * offset
          y = position.y
          break
        case 'right':
          x = position.x + size.width
          y = position.y + size.height * offset
          break
        case 'bottom':
          x = position.x + size.width * offset
          y = position.y + size.height
          break
        case 'left':
          x = position.x
          y = position.y + size.height * offset
          break
      }

      positions[port.id] = { x, y }
    })

    this.portPositions = positions
    this.setOutput('portPositions', positions)
  }

  /**
   * Update bounds based on current position and size
   */
  updateBounds() {
    const position = this.getInput<{ x: number; y: number }>('position')!
    const size = this.getInput<{ width: number; height: number }>('size')!
    
    this.bounds = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    }
    
    this.setOutput('bounds', this.bounds)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    const renderMode = this.getInput<string>('renderMode') || 'svg'
    
    return renderMode === 'svg' 
      ? <NodePrimitiveSVG construct={this} />
      : <NodePrimitiveCanvas construct={this} />
  }
}

/**
 * SVG rendering component
 */
const NodePrimitiveSVG: React.FC<{ construct: NodePrimitive }> = ({ construct }) => {
  const svgRef = useRef<SVGGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Get inputs
  const id = construct.getInput<string>('id')!
  const position = construct.getInput<{ x: number; y: number }>('position')!
  const size = construct.getInput<{ width: number; height: number }>('size')!
  const shape = construct.getInput<string>('shape') || 'rect'
  const text = construct.getInput<string>('text') || ''
  const icon = construct.getInput<string>('icon')
  const style = construct.getInput<any>('style') || {}
  const draggable = construct.getInput<boolean>('draggable') ?? true
  const selectable = construct.getInput<boolean>('selectable') ?? true
  const ports = construct.getInput<any[]>('ports') || []

  // Update construct outputs
  useEffect(() => {
    construct['updateBounds']()
    construct['calculatePortPositions']()
    
    if (svgRef.current) {
      construct['setOutput']('nodeElement', svgRef.current)
    }
  }, [position, size, shape, ports])

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return

    const rect = (e.target as Element).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    setIsDragging(true)
    construct['isDragging'] = true
    construct['setOutput']('isDragging', true)
  }, [draggable, position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    }
    
    // Update position input (this would trigger re-render in a real implementation)
    construct['setInput']('position', newPosition)
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    construct['isDragging'] = false
    construct['setOutput']('isDragging', false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle selection
  const handleClick = useCallback(() => {
    if (!selectable) return
    
    construct['isSelected'] = !construct['isSelected']
    construct['setOutput']('isSelected', construct['isSelected'])
  }, [selectable])

  // Render shape
  const renderShape = () => {
    const commonProps = {
      fill: style.fill || '#ffffff',
      stroke: style.stroke || '#000000',
      strokeWidth: style.strokeWidth || 1,
      filter: style.shadow ? 'url(#node-shadow)' : undefined,
      cursor: draggable ? 'move' : 'default',
      onMouseDown: handleMouseDown,
      onClick: handleClick
    }

    switch (shape) {
      case 'circle': {
        const radius = Math.min(size.width, size.height) / 2
        return (
          <circle
            cx={size.width / 2}
            cy={size.height / 2}
            r={radius}
            {...commonProps}
          />
        )
      }
      
      case 'ellipse':
        return (
          <ellipse
            cx={size.width / 2}
            cy={size.height / 2}
            rx={size.width / 2}
            ry={size.height / 2}
            {...commonProps}
          />
        )
      
      case 'diamond': {
        const points = `
          ${size.width / 2},0
          ${size.width},${size.height / 2}
          ${size.width / 2},${size.height}
          0,${size.height / 2}
        `
        return <polygon points={points} {...commonProps} />
      }
      
      case 'hexagon': {
        const w = size.width
        const h = size.height
        const hexPoints = `
          ${w * 0.25},0
          ${w * 0.75},0
          ${w},${h * 0.5}
          ${w * 0.75},${h}
          ${w * 0.25},${h}
          0,${h * 0.5}
        `
        return <polygon points={hexPoints} {...commonProps} />
      }
      
      case 'rect':
      default:
        return (
          <rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            rx={style.cornerRadius || 0}
            ry={style.cornerRadius || 0}
            {...commonProps}
          />
        )
    }
  }

  // Render ports
  const renderPorts = () => {
    return ports.map((port) => {
      const pos = construct['portPositions'][port.id]
      if (!pos) return null
      
      return (
        <circle
          key={port.id}
          cx={pos.x - position.x}
          cy={pos.y - position.y}
          r={4}
          fill="#ffffff"
          stroke="#666666"
          strokeWidth={1}
        />
      )
    })
  }

  return (
    <g ref={svgRef} transform={`translate(${position.x}, ${position.y})`}>
      {/* Shadow filter definition */}
      <defs>
        <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shape */}
      {renderShape()}
      
      {/* Text */}
      {text && (
        <text
          x={size.width / 2}
          y={size.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill={style.stroke || '#000000'}
          pointerEvents="none"
        >
          {text}
        </text>
      )}
      
      {/* Icon (simplified) */}
      {icon && (
        <text
          x={size.width / 2}
          y={size.height / 2 - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fill={style.stroke || '#000000'}
          pointerEvents="none"
        >
          {icon}
        </text>
      )}
      
      {/* Ports */}
      {renderPorts()}
    </g>
  )
}

/**
 * Canvas rendering component
 */
const NodePrimitiveCanvas: React.FC<{ construct: NodePrimitive }> = ({ construct }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Get inputs
  const position = construct.getInput<{ x: number; y: number }>('position')!
  const size = construct.getInput<{ width: number; height: number }>('size')!
  const shape = construct.getInput<string>('shape') || 'rect'
  const text = construct.getInput<string>('text') || ''
  const style = construct.getInput<any>('style') || {}
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set styles
    ctx.fillStyle = style.fill || '#ffffff'
    ctx.strokeStyle = style.stroke || '#000000'
    ctx.lineWidth = style.strokeWidth || 1
    
    // Draw shadow if enabled
    if (style.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
    }
    
    // Draw shape
    ctx.save()
    ctx.translate(position.x, position.y)
    
    switch (shape) {
      case 'circle': {
        const radius = Math.min(size.width, size.height) / 2
        ctx.beginPath()
        ctx.arc(size.width / 2, size.height / 2, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break
      }
        
      case 'rect':
      default:
        if (style.cornerRadius) {
          // Rounded rectangle
          const r = style.cornerRadius
          ctx.beginPath()
          ctx.moveTo(r, 0)
          ctx.lineTo(size.width - r, 0)
          ctx.quadraticCurveTo(size.width, 0, size.width, r)
          ctx.lineTo(size.width, size.height - r)
          ctx.quadraticCurveTo(size.width, size.height, size.width - r, size.height)
          ctx.lineTo(r, size.height)
          ctx.quadraticCurveTo(0, size.height, 0, size.height - r)
          ctx.lineTo(0, r)
          ctx.quadraticCurveTo(0, 0, r, 0)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillRect(0, 0, size.width, size.height)
          ctx.strokeRect(0, 0, size.width, size.height)
        }
        break
    }
    
    // Draw text
    if (text) {
      ctx.shadowColor = 'transparent'
      ctx.fillStyle = style.stroke || '#000000'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, size.width / 2, size.height / 2)
    }
    
    ctx.restore()
    
    // Update outputs
    construct['updateBounds']()
    construct['calculatePortPositions']()
    construct['setOutput']('nodeElement', canvas)
  }, [position, size, shape, text, style])
  
  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'all'
      }}
    />
  )
}

// Export factory function
export const createNodePrimitive = () => new NodePrimitive()

// Export definition for catalog
export { nodePrimitiveDefinition }