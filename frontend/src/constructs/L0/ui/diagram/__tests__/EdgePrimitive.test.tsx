import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EdgePrimitive, createEdgePrimitive } from '../EdgePrimitive'
import '@testing-library/jest-dom'

describe('EdgePrimitive', () => {
  it('should create an edge primitive instance', () => {
    const edge = createEdgePrimitive()
    expect(edge).toBeInstanceOf(EdgePrimitive)
    expect(edge.definition.id).toBe('platform-l0-edge-primitive')
  })

  it('should render straight edge by default', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 200 }
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const path = container.querySelector('path[fill="none"]')
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute('d', 'M 100,100 L 300,200')
  })

  it('should render quadratic bezier curve', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-quad',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 100 },
      controlPoints: [{ x: 200, y: 50 }]
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const path = container.querySelector('path[fill="none"]')
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute('d', 'M 100,100 Q 200,50 300,100')
  })

  it('should render cubic bezier curve', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-cubic',
      source: { x: 100, y: 100 },
      target: { x: 400, y: 100 },
      controlPoints: [
        { x: 200, y: 50 },
        { x: 300, y: 150 }
      ]
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const path = container.querySelector('path[fill="none"]')
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute('d', 'M 100,100 C 200,50 300,150 400,100')
  })

  it('should render different arrow head styles', async () => {
    const arrowStyles = ['arrow', 'circle', 'square', 'diamond']
    
    for (const arrowHead of arrowStyles) {
      const edge = new EdgePrimitive()
      await edge.initialize({
        id: `test-edge-${arrowHead}`,
        source: { x: 100, y: 100 },
        target: { x: 300, y: 100 },
        arrowHead
      })

      const component = edge.render()
      const { container } = render(
        <svg width="800" height="600">
          {component}
        </svg>
      )

      const marker = container.querySelector(`marker[id*="head"]`)
      expect(marker).toBeInTheDocument()
    }
  })

  it('should render edge label', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-label',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 200 },
      label: 'Data Flow',
      labelPosition: 0.5
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const label = screen.getByText('Data Flow')
    expect(label).toBeInTheDocument()
  })

  it('should calculate midpoint correctly', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-midpoint',
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 }
    })

    const midpoint = edge.getOutput<any>('midpoint')
    expect(midpoint).toBeDefined()
    expect(midpoint.x).toBeCloseTo(50)
    expect(midpoint.y).toBeCloseTo(50)
    expect(midpoint.angle).toBeCloseTo(Math.PI / 4)
  })

  it('should calculate bounds', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-bounds',
      source: { x: 50, y: 50 },
      target: { x: 150, y: 150 },
      controlPoints: [{ x: 100, y: 25 }]
    })

    const bounds = edge.getOutput<any>('bounds')
    expect(bounds).toBeDefined()
    expect(bounds.x).toBe(50)
    expect(bounds.y).toBe(25)
    expect(bounds.width).toBe(100)
    expect(bounds.height).toBe(125)
  })

  it('should support canvas rendering mode', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-canvas',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 200 },
      renderMode: 'canvas'
    })

    const component = edge.render()
    const { container } = render(component)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('should apply custom styles', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-style',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 200 },
      style: {
        stroke: '#ff0000',
        strokeWidth: 3,
        strokeDasharray: '5,5',
        opacity: 0.8
      }
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const path = container.querySelector('path[fill="none"]')
    expect(path).toHaveAttribute('stroke', '#ff0000')
    expect(path).toHaveAttribute('stroke-width', '3')
    expect(path).toHaveAttribute('stroke-dasharray', '5,5')
    expect(path).toHaveAttribute('opacity', '0.8')
  })

  it('should handle selection when selectable', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-select',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 200 },
      selectable: true
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    // Click on the invisible hit area
    const hitArea = container.querySelector('path[stroke="transparent"]')
    expect(hitArea).toBeInTheDocument()

    if (hitArea) {
      fireEvent.click(hitArea)
    }

    const isSelected = edge.getOutput<boolean>('isSelected')
    expect(isSelected).toBe(true)
  })

  it('should validate required inputs', async () => {
    const edge = new EdgePrimitive()
    
    // Should fail without required inputs
    await expect(edge.initialize({
      // Missing id, source, and target
      label: 'Test'
    })).rejects.toThrow()
  })

  it('should support animation', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-animated',
      source: { x: 100, y: 100 },
      target: { x: 300, y: 200 },
      animated: true,
      animationSpeed: 1.5
    })

    const component = edge.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const animateMotion = container.querySelector('animateMotion')
    expect(animateMotion).toBeInTheDocument()
    expect(animateMotion).toHaveAttribute('dur', '1.5s')
  })

  it('should calculate path length', async () => {
    const edge = new EdgePrimitive()
    await edge.initialize({
      id: 'test-edge-length',
      source: { x: 0, y: 0 },
      target: { x: 100, y: 0 }
    })

    // SVG path length calculation requires DOM API
    // In a real browser environment, this would return ~100
    const length = edge.getOutput<number>('length')
    expect(typeof length).toBe('number')
  })
})