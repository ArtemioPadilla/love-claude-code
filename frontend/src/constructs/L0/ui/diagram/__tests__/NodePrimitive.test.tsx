import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodePrimitive, createNodePrimitive } from '../NodePrimitive'
import '@testing-library/jest-dom'

describe('NodePrimitive', () => {
  it('should create a node primitive instance', () => {
    const node = createNodePrimitive()
    expect(node).toBeInstanceOf(NodePrimitive)
    expect(node.definition.id).toBe('platform-l0-node-primitive')
  })

  it('should render SVG node by default', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node',
      position: { x: 100, y: 100 },
      text: 'Test Node'
    })

    const component = node.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const textElement = screen.getByText('Test Node')
    expect(textElement).toBeInTheDocument()
  })

  it('should render different shapes', async () => {
    const shapes = ['rect', 'circle', 'diamond', 'hexagon', 'ellipse']
    
    for (const shape of shapes) {
      const node = new NodePrimitive()
      await node.initialize({
        id: `test-node-${shape}`,
        position: { x: 100, y: 100 },
        shape,
        text: shape
      })

      const component = node.render()
      const { container } = render(
        <svg width="800" height="600">
          {component}
        </svg>
      )

      const textElement = screen.getByText(shape)
      expect(textElement).toBeInTheDocument()
    }
  })

  it('should handle ports configuration', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node-ports',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
      ports: [
        { id: 'in', position: 'left', offset: 0.5 },
        { id: 'out', position: 'right', offset: 0.5 }
      ]
    })

    const portPositions = node.getOutput<any>('portPositions')
    expect(portPositions).toBeDefined()
    expect(portPositions.in).toEqual({ x: 100, y: 125 })
    expect(portPositions.out).toEqual({ x: 200, y: 125 })
  })

  it('should support canvas rendering mode', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node-canvas',
      position: { x: 200, y: 200 },
      text: 'Canvas Node',
      renderMode: 'canvas'
    })

    const component = node.render()
    const { container } = render(component)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('should update bounds output', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node-bounds',
      position: { x: 50, y: 75 },
      size: { width: 120, height: 80 }
    })

    const bounds = node.getOutput<any>('bounds')
    expect(bounds).toEqual({
      x: 50,
      y: 75,
      width: 120,
      height: 80
    })
  })

  it('should handle selection when selectable', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node-select',
      position: { x: 100, y: 100 },
      text: 'Selectable',
      selectable: true
    })

    const component = node.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const rect = container.querySelector('rect')
    expect(rect).toBeInTheDocument()

    // Simulate click
    if (rect) {
      fireEvent.click(rect)
    }

    const isSelected = node.getOutput<boolean>('isSelected')
    expect(isSelected).toBe(true)
  })

  it('should apply custom styles', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node-style',
      position: { x: 100, y: 100 },
      style: {
        fill: '#ff0000',
        stroke: '#0000ff',
        strokeWidth: 3,
        cornerRadius: 5
      }
    })

    const component = node.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const rect = container.querySelector('rect')
    expect(rect).toHaveAttribute('fill', '#ff0000')
    expect(rect).toHaveAttribute('stroke', '#0000ff')
    expect(rect).toHaveAttribute('stroke-width', '3')
    expect(rect).toHaveAttribute('rx', '5')
  })

  it('should validate required inputs', async () => {
    const node = new NodePrimitive()
    
    // Should fail without required inputs
    await expect(node.initialize({
      // Missing id and position
      text: 'Test'
    })).rejects.toThrow()
  })

  it('should handle dragging when enabled', async () => {
    const node = new NodePrimitive()
    await node.initialize({
      id: 'test-node-drag',
      position: { x: 100, y: 100 },
      text: 'Draggable',
      draggable: true
    })

    const component = node.render()
    const { container } = render(
      <svg width="800" height="600">
        {component}
      </svg>
    )

    const rect = container.querySelector('rect')
    expect(rect).toBeInTheDocument()
    expect(rect).toHaveStyle({ cursor: 'move' })
  })
})