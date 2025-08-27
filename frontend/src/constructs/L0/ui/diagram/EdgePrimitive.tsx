import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { L0UIConstruct } from '../../../base/L0Construct'
import { edgePrimitiveDefinition } from './EdgePrimitive.definition'

/**
 * L0 Edge Primitive Construct
 * Foundation for diagram edge visualization with bezier curve support
 */
export class EdgePrimitive extends L0UIConstruct {
  static definition = edgePrimitiveDefinition

  private path = ''
  private length = 0
  private midpoint = { x: 0, y: 0, angle: 0 }
  private bounds = { x: 0, y: 0, width: 0, height: 0 }
  private isSelected = false

  constructor() {
    super(EdgePrimitive.definition)
  }

  /**
   * Calculate bezier curve path
   */
  calculatePath(): string {
    const source = this.getInput<{ x: number; y: number }>('source')!
    const target = this.getInput<{ x: number; y: number }>('target')!
    const controlPoints = this.getInput<{ x: number; y: number }[]>('controlPoints') || []

    if (controlPoints.length === 0) {
      // Straight line
      return `M ${source.x},${source.y} L ${target.x},${target.y}`
    } else if (controlPoints.length === 1) {
      // Quadratic bezier
      const cp = controlPoints[0]
      return `M ${source.x},${source.y} Q ${cp.x},${cp.y} ${target.x},${target.y}`
    } else {
      // Cubic bezier
      const cp1 = controlPoints[0]
      const cp2 = controlPoints[1]
      return `M ${source.x},${source.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${target.x},${target.y}`
    }
  }

  /**
   * Calculate edge midpoint and angle
   */
  calculateMidpoint(t: number = 0.5): { x: number; y: number; angle: number } {
    const source = this.getInput<{ x: number; y: number }>('source')!
    const target = this.getInput<{ x: number; y: number }>('target')!
    const controlPoints = this.getInput<{ x: number; y: number }[]>('controlPoints') || []

    let x: number, y: number, angle: number

    if (controlPoints.length === 0) {
      // Linear interpolation
      x = source.x + (target.x - source.x) * t
      y = source.y + (target.y - source.y) * t
      angle = Math.atan2(target.y - source.y, target.x - source.x)
    } else if (controlPoints.length === 1) {
      // Quadratic bezier
      const cp = controlPoints[0]
      const t1 = 1 - t
      x = t1 * t1 * source.x + 2 * t1 * t * cp.x + t * t * target.x
      y = t1 * t1 * source.y + 2 * t1 * t * cp.y + t * t * target.y
      
      // Derivative for angle
      const dx = 2 * t1 * (cp.x - source.x) + 2 * t * (target.x - cp.x)
      const dy = 2 * t1 * (cp.y - source.y) + 2 * t * (target.y - cp.y)
      angle = Math.atan2(dy, dx)
    } else {
      // Cubic bezier
      const cp1 = controlPoints[0]
      const cp2 = controlPoints[1]
      const t1 = 1 - t
      x = t1 * t1 * t1 * source.x + 3 * t1 * t1 * t * cp1.x + 3 * t1 * t * t * cp2.x + t * t * t * target.x
      y = t1 * t1 * t1 * source.y + 3 * t1 * t1 * t * cp1.y + 3 * t1 * t * t * cp2.y + t * t * t * target.y
      
      // Derivative for angle
      const dx = 3 * t1 * t1 * (cp1.x - source.x) + 6 * t1 * t * (cp2.x - cp1.x) + 3 * t * t * (target.x - cp2.x)
      const dy = 3 * t1 * t1 * (cp1.y - source.y) + 6 * t1 * t * (cp2.y - cp1.y) + 3 * t * t * (target.y - cp2.y)
      angle = Math.atan2(dy, dx)
    }

    return { x, y, angle }
  }

  /**
   * Calculate bounding box
   */
  calculateBounds() {
    const source = this.getInput<{ x: number; y: number }>('source')!
    const target = this.getInput<{ x: number; y: number }>('target')!
    const controlPoints = this.getInput<{ x: number; y: number }[]>('controlPoints') || []

    const allPoints = [source, ...controlPoints, target]
    const xs = allPoints.map(p => p.x)
    const ys = allPoints.map(p => p.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    this.bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }

    this.setOutput('bounds', this.bounds)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    const renderMode = this.getInput<string>('renderMode') || 'svg'
    
    return renderMode === 'svg' 
      ? <EdgePrimitiveSVG construct={this} />
      : <EdgePrimitiveCanvas construct={this} />
  }
}

/**
 * SVG rendering component
 */
const EdgePrimitiveSVG: React.FC<{ construct: EdgePrimitive }> = ({ construct }) => {
  const gRef = useRef<SVGGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [pathLength, setPathLength] = useState(0)

  // Get inputs
  const id = construct.getInput<string>('id')!
  const source = construct.getInput<{ x: number; y: number }>('source')!
  const target = construct.getInput<{ x: number; y: number }>('target')!
  const controlPoints = construct.getInput<{ x: number; y: number }[]>('controlPoints') || []
  const label = construct.getInput<string>('label')
  const labelPosition = construct.getInput<number>('labelPosition') || 0.5
  const arrowHead = construct.getInput<string>('arrowHead') || 'arrow'
  const arrowTail = construct.getInput<string>('arrowTail') || 'none'
  const style = construct.getInput<any>('style') || {}
  const animated = construct.getInput<boolean>('animated') || false
  const animationSpeed = construct.getInput<number>('animationSpeed') || 2
  const selectable = construct.getInput<boolean>('selectable') ?? true
  const hitAreaWidth = construct.getInput<number>('hitAreaWidth') || 10

  // Calculate path
  const path = useMemo(() => {
    const p = construct['calculatePath']()
    construct['path'] = p
    construct['setOutput']('path', p)
    return p
  }, [source, target, controlPoints])

  // Calculate midpoint
  const midpoint = useMemo(() => {
    const mp = construct['calculateMidpoint'](labelPosition)
    construct['midpoint'] = mp
    construct['setOutput']('midpoint', mp)
    return mp
  }, [source, target, controlPoints, labelPosition])

  // Update outputs
  useEffect(() => {
    construct['calculateBounds']()
    
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      setPathLength(length)
      construct['length'] = length
      construct['setOutput']('length', length)
    }

    if (gRef.current) {
      construct['setOutput']('edgeElement', gRef.current)
    }
  }, [path])

  // Handle selection
  const handleClick = useCallback(() => {
    if (!selectable) return
    
    const newSelected = !isSelected
    setIsSelected(newSelected)
    construct['isSelected'] = newSelected
    construct['setOutput']('isSelected', newSelected)
  }, [selectable, isSelected])

  // Arrow marker definitions
  const markerId = `edge-marker-${id}`
  const renderMarkers = () => (
    <defs>
      {arrowHead !== 'none' && (
        <marker
          id={`${markerId}-head`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          {renderArrowShape(arrowHead, style.stroke || '#000000')}
        </marker>
      )}
      {arrowTail !== 'none' && (
        <marker
          id={`${markerId}-tail`}
          markerWidth="10"
          markerHeight="10"
          refX="1"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          {renderArrowShape(arrowTail, style.stroke || '#000000')}
        </marker>
      )}
    </defs>
  )

  const renderArrowShape = (type: string, color: string) => {
    switch (type) {
      case 'arrow':
        return <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      case 'circle':
        return <circle cx="5" cy="5" r="3" fill={color} />
      case 'square':
        return <rect x="2" y="2" width="6" height="6" fill={color} />
      case 'diamond':
        return <path d="M 5 1 L 9 5 L 5 9 L 1 5 z" fill={color} />
      default:
        return null
    }
  }

  return (
    <g ref={gRef}>
      {renderMarkers()}
      
      {/* Hit area (invisible, wider path for easier selection) */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={hitAreaWidth}
        fill="none"
        style={{ cursor: selectable ? 'pointer' : 'default' }}
        onClick={handleClick}
      />
      
      {/* Actual path */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={style.stroke || '#000000'}
        strokeWidth={style.strokeWidth || 1}
        strokeDasharray={style.strokeDasharray}
        strokeLinecap={style.strokeLinecap || 'round'}
        strokeLinejoin={style.strokeLinejoin || 'round'}
        opacity={style.opacity ?? 1}
        markerEnd={arrowHead !== 'none' ? `url(#${markerId}-head)` : undefined}
        markerStart={arrowTail !== 'none' ? `url(#${markerId}-tail)` : undefined}
        style={{
          filter: isSelected ? 'drop-shadow(0 0 4px rgba(0, 123, 255, 0.5))' : undefined
        }}
      />
      
      {/* Animation */}
      {animated && pathLength > 0 && (
        <circle r="4" fill={style.stroke || '#000000'}>
          <animateMotion
            dur={`${animationSpeed}s`}
            repeatCount="indefinite"
            path={path}
          />
        </circle>
      )}
      
      {/* Label */}
      {label && (
        <text
          x={midpoint.x}
          y={midpoint.y - 5}
          textAnchor="middle"
          fontSize="12"
          fill={style.stroke || '#000000'}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 4px',
            borderRadius: '2px'
          }}
        >
          {label}
        </text>
      )}
    </g>
  )
}

/**
 * Canvas rendering component
 */
const EdgePrimitiveCanvas: React.FC<{ construct: EdgePrimitive }> = ({ construct }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const animationProgress = useRef(0)

  // Get inputs
  const source = construct.getInput<{ x: number; y: number }>('source')!
  const target = construct.getInput<{ x: number; y: number }>('target')!
  const controlPoints = construct.getInput<{ x: number; y: number }[]>('controlPoints') || []
  const label = construct.getInput<string>('label')
  const labelPosition = construct.getInput<number>('labelPosition') || 0.5
  const arrowHead = construct.getInput<string>('arrowHead') || 'arrow'
  const style = construct.getInput<any>('style') || {}
  const animated = construct.getInput<boolean>('animated') || false
  const animationSpeed = construct.getInput<number>('animationSpeed') || 2

  // Draw arrow head
  const drawArrowHead = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, type: string) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    
    switch (type) {
      case 'arrow':
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-10, -5)
        ctx.lineTo(-10, 5)
        ctx.closePath()
        ctx.fill()
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(-5, 0, 3, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'square':
        ctx.fillRect(-8, -3, 6, 6)
        break
      case 'diamond':
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-5, -3)
        ctx.lineTo(-10, 0)
        ctx.lineTo(-5, 3)
        ctx.closePath()
        ctx.fill()
        break
    }
    
    ctx.restore()
  }

  // Animation loop
  const animate = useCallback(() => {
    if (!animated || !canvasRef.current) return
    
    animationProgress.current += 0.01 / animationSpeed
    if (animationProgress.current > 1) animationProgress.current = 0
    
    // Redraw
    draw()
    
    animationRef.current = requestAnimationFrame(animate)
  }, [animated, animationSpeed])

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set styles
    ctx.strokeStyle = style.stroke || '#000000'
    ctx.fillStyle = style.stroke || '#000000'
    ctx.lineWidth = style.strokeWidth || 1
    ctx.globalAlpha = style.opacity ?? 1
    
    if (style.strokeDasharray) {
      const dashes = style.strokeDasharray.split(',').map(Number)
      ctx.setLineDash(dashes)
    }
    
    // Draw path
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    
    if (controlPoints.length === 0) {
      ctx.lineTo(target.x, target.y)
    } else if (controlPoints.length === 1) {
      ctx.quadraticCurveTo(controlPoints[0].x, controlPoints[0].y, target.x, target.y)
    } else {
      ctx.bezierCurveTo(
        controlPoints[0].x, controlPoints[0].y,
        controlPoints[1].x, controlPoints[1].y,
        target.x, target.y
      )
    }
    
    ctx.stroke()
    
    // Draw arrow head
    if (arrowHead !== 'none') {
      const endPoint = construct['calculateMidpoint'](1)
      drawArrowHead(ctx, target.x, target.y, endPoint.angle, arrowHead)
    }
    
    // Draw animated dot
    if (animated) {
      const point = construct['calculateMidpoint'](animationProgress.current)
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Draw label
    if (label) {
      const midpoint = construct['calculateMidpoint'](labelPosition)
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      
      // Background
      const metrics = ctx.measureText(label)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(
        midpoint.x - metrics.width / 2 - 2,
        midpoint.y - 16,
        metrics.width + 4,
        16
      )
      
      // Text
      ctx.fillStyle = style.stroke || '#000000'
      ctx.fillText(label, midpoint.x, midpoint.y - 2)
    }
    
    // Update outputs
    construct['calculateBounds']()
    construct['setOutput']('edgeElement', canvas)
  }, [source, target, controlPoints, style, arrowHead, label, labelPosition, animated])

  useEffect(() => {
    draw()
    
    if (animated) {
      animationRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [draw, animate, animated])

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
export const createEdgePrimitive = () => new EdgePrimitive()

// Export definition for catalog
export { edgePrimitiveDefinition }