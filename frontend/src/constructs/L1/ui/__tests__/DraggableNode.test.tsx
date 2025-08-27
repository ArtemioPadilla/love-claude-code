import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { DraggableNode } from '../DraggableNode'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  renderWithProviders,
  simulateDragAndDrop
} from '../../../../test-utils/constructTestUtils'
import { GraphDataFactory } from '../../../../test-utils/testFactories'

describe('DraggableNode', () => {
  let harness: ConstructTestHarness<DraggableNode>
  let metadata: any
  let mockGraphPrimitive: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'draggable-node',
      name: 'Draggable Node',
      level: 'L1',
      category: 'ui'
    })

    // Mock graph primitive dependency
    mockGraphPrimitive = {
      updateNode: vi.fn(),
      getNode: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      initialized: true,
      metadata: createMockMetadata({ id: 'graph-primitive' })
    }

    harness = new ConstructTestHarness(
      DraggableNode,
      metadata,
      { graphPrimitive: mockGraphPrimitive }
    )
  })

  describe('initialization', () => {
    it('should initialize with graph primitive', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      harness.expectEvent('initialized')
    })

    it('should emit node:initialized event', async () => {
      await harness.initialize()
      harness.expectEvent('node:initialized', { draggable: true })
    })
  })

  describe('rendering', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should render node with default props', () => {
      const node = GraphDataFactory.createNode({
        id: 'test-node',
        data: { label: 'Test Node' }
      })

      const { container } = render(
        harness.construct.render({
          node,
          onDragStart: vi.fn(),
          onDrag: vi.fn(),
          onDragEnd: vi.fn()
        })
      )

      expect(screen.getByText('Test Node')).toBeInTheDocument()
      expect(container.querySelector('[draggable="true"]')).toBeInTheDocument()
    })

    it('should apply custom styles', () => {
      const node = GraphDataFactory.createNode({
        id: 'styled-node',
        data: { 
          label: 'Styled Node',
          style: { backgroundColor: 'blue', color: 'white' }
        }
      })

      render(
        harness.construct.render({
          node,
          style: { border: '2px solid red' }
        })
      )

      const nodeElement = screen.getByText('Styled Node').parentElement
      expect(nodeElement).toHaveStyle({
        backgroundColor: 'blue',
        color: 'white',
        border: '2px solid red'
      })
    })

    it('should render custom content via render prop', () => {
      const node = GraphDataFactory.createNode({
        id: 'custom-node',
        data: { label: 'Custom' }
      })

      render(
        harness.construct.render({
          node,
          renderContent: (nodeData) => (
            <div>
              <h3>{nodeData.data.label}</h3>
              <p>Custom content</p>
            </div>
          )
        })
      )

      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.getByText('Custom content')).toBeInTheDocument()
    })

    it('should handle disabled state', () => {
      const node = GraphDataFactory.createNode()

      const { container } = render(
        harness.construct.render({
          node,
          disabled: true
        })
      )

      const nodeElement = container.querySelector('[draggable]')
      expect(nodeElement).toHaveAttribute('draggable', 'false')
      expect(nodeElement).toHaveClass('disabled')
    })
  })

  describe('drag operations', () => {
    let node: any
    let onDragStart: vi.Mock
    let onDrag: vi.Mock
    let onDragEnd: vi.Mock

    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()

      node = GraphDataFactory.createNode({
        id: 'drag-node',
        position: { x: 100, y: 100 },
        data: { label: 'Draggable' }
      })

      onDragStart = vi.fn()
      onDrag = vi.fn()
      onDragEnd = vi.fn()

      mockGraphPrimitive.getNode.mockReturnValue(node)
    })

    it('should handle drag start', () => {
      render(
        harness.construct.render({
          node,
          onDragStart,
          onDrag,
          onDragEnd
        })
      )

      const nodeElement = screen.getByText('Draggable').parentElement!
      const dragEvent = new DragEvent('dragstart', {
        dataTransfer: new DataTransfer(),
        clientX: 150,
        clientY: 150
      })

      fireEvent(nodeElement, dragEvent)

      expect(onDragStart).toHaveBeenCalledWith(node, dragEvent)
      harness.expectEvent('drag:start', {
        nodeId: 'drag-node',
        position: { x: 100, y: 100 }
      })
    })

    it('should handle drag move', () => {
      render(
        harness.construct.render({
          node,
          onDragStart,
          onDrag,
          onDragEnd
        })
      )

      const nodeElement = screen.getByText('Draggable').parentElement!
      
      // Start drag
      fireEvent.dragStart(nodeElement, {
        dataTransfer: new DataTransfer(),
        clientX: 150,
        clientY: 150
      })

      // Drag move
      const dragEvent = new DragEvent('drag', {
        clientX: 200,
        clientY: 180
      })
      fireEvent(nodeElement, dragEvent)

      expect(onDrag).toHaveBeenCalledWith(
        node,
        { x: 150, y: 130 }, // New position
        dragEvent
      )
      harness.expectEvent('drag:move', {
        nodeId: 'drag-node',
        position: { x: 150, y: 130 },
        delta: { x: 50, y: 30 }
      })
    })

    it('should handle drag end', () => {
      render(
        harness.construct.render({
          node,
          onDragStart,
          onDrag,
          onDragEnd
        })
      )

      const nodeElement = screen.getByText('Draggable').parentElement!
      
      // Complete drag operation
      fireEvent.dragStart(nodeElement, {
        dataTransfer: new DataTransfer(),
        clientX: 150,
        clientY: 150
      })

      fireEvent.drag(nodeElement, {
        clientX: 200,
        clientY: 200
      })

      const dropEvent = new DragEvent('dragend', {
        clientX: 200,
        clientY: 200
      })
      fireEvent(nodeElement, dropEvent)

      expect(onDragEnd).toHaveBeenCalledWith(
        node,
        { x: 150, y: 150 }, // Final position
        dropEvent
      )
      expect(mockGraphPrimitive.updateNode).toHaveBeenCalledWith('drag-node', {
        position: { x: 150, y: 150 }
      })
      harness.expectEvent('drag:end', {
        nodeId: 'drag-node',
        startPosition: { x: 100, y: 100 },
        endPosition: { x: 150, y: 150 }
      })
    })

    it('should respect drag constraints', () => {
      render(
        harness.construct.render({
          node,
          onDrag,
          constraints: {
            minX: 0,
            maxX: 500,
            minY: 0,
            maxY: 300
          }
        })
      )

      const nodeElement = screen.getByText('Draggable').parentElement!
      
      fireEvent.dragStart(nodeElement, {
        dataTransfer: new DataTransfer(),
        clientX: 150,
        clientY: 150
      })

      // Try to drag beyond constraints
      fireEvent.drag(nodeElement, {
        clientX: 600, // Beyond maxX
        clientY: -50  // Beyond minY
      })

      expect(onDrag).toHaveBeenCalledWith(
        node,
        { x: 450, y: 0 }, // Constrained position (500 - node width/2, 0)
        expect.any(Object)
      )
    })

    it('should snap to grid if enabled', () => {
      render(
        harness.construct.render({
          node,
          onDrag,
          snapToGrid: true,
          gridSize: 20
        })
      )

      const nodeElement = screen.getByText('Draggable').parentElement!
      
      fireEvent.dragStart(nodeElement, {
        dataTransfer: new DataTransfer(),
        clientX: 150,
        clientY: 150
      })

      fireEvent.drag(nodeElement, {
        clientX: 163, // Should snap to 160
        clientY: 177  // Should snap to 180
      })

      expect(onDrag).toHaveBeenCalledWith(
        node,
        { x: 120, y: 120 }, // Snapped to grid
        expect.any(Object)
      )
    })
  })

  describe('touch support', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should handle touch drag', () => {
      const node = GraphDataFactory.createNode({
        id: 'touch-node',
        position: { x: 100, y: 100 },
        data: { label: 'Touch' }
      })

      const onDrag = vi.fn()
      mockGraphPrimitive.getNode.mockReturnValue(node)

      render(
        harness.construct.render({
          node,
          onDrag,
          enableTouch: true
        })
      )

      const nodeElement = screen.getByText('Touch').parentElement!
      
      // Touch start
      fireEvent.touchStart(nodeElement, {
        touches: [{ clientX: 150, clientY: 150 }]
      })

      // Touch move
      fireEvent.touchMove(nodeElement, {
        touches: [{ clientX: 200, clientY: 180 }]
      })

      expect(onDrag).toHaveBeenCalledWith(
        node,
        { x: 150, y: 130 },
        expect.any(Object)
      )

      // Touch end
      fireEvent.touchEnd(nodeElement, {
        changedTouches: [{ clientX: 200, clientY: 180 }]
      })

      expect(mockGraphPrimitive.updateNode).toHaveBeenCalled()
    })

    it('should prevent multi-touch drag', () => {
      const node = GraphDataFactory.createNode()
      const onDrag = vi.fn()

      render(
        harness.construct.render({
          node,
          onDrag,
          enableTouch: true
        })
      )

      const nodeElement = screen.getByText(node.data.label).parentElement!
      
      // Multi-touch should not trigger drag
      fireEvent.touchStart(nodeElement, {
        touches: [
          { clientX: 150, clientY: 150 },
          { clientX: 200, clientY: 200 }
        ]
      })

      fireEvent.touchMove(nodeElement, {
        touches: [
          { clientX: 160, clientY: 160 },
          { clientX: 210, clientY: 210 }
        ]
      })

      expect(onDrag).not.toHaveBeenCalled()
    })
  })

  describe('visual feedback', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should show drag preview', () => {
      const node = GraphDataFactory.createNode({
        data: { label: 'Preview Node' }
      })

      render(
        harness.construct.render({
          node,
          showDragPreview: true
        })
      )

      const nodeElement = screen.getByText('Preview Node').parentElement!
      
      fireEvent.dragStart(nodeElement, {
        dataTransfer: new DataTransfer()
      })

      expect(nodeElement).toHaveClass('dragging')
      
      // Check for preview element
      const preview = document.querySelector('.node-drag-preview')
      expect(preview).toBeInTheDocument()
    })

    it('should show hover state', () => {
      const node = GraphDataFactory.createNode()

      render(
        harness.construct.render({
          node,
          showHoverState: true
        })
      )

      const nodeElement = screen.getByText(node.data.label).parentElement!
      
      fireEvent.mouseEnter(nodeElement)
      expect(nodeElement).toHaveClass('hover')

      fireEvent.mouseLeave(nodeElement)
      expect(nodeElement).not.toHaveClass('hover')
    })
  })

  describe('accessibility', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should have proper ARIA attributes', () => {
      const node = GraphDataFactory.createNode({
        data: { label: 'Accessible Node' }
      })

      render(
        harness.construct.render({
          node,
          ariaLabel: 'Draggable graph node'
        })
      )

      const nodeElement = screen.getByText('Accessible Node').parentElement!
      
      expect(nodeElement).toHaveAttribute('role', 'button')
      expect(nodeElement).toHaveAttribute('aria-label', 'Draggable graph node')
      expect(nodeElement).toHaveAttribute('aria-grabbed', 'false')
      expect(nodeElement).toHaveAttribute('tabindex', '0')
    })

    it('should handle keyboard interaction', () => {
      const node = GraphDataFactory.createNode({
        position: { x: 100, y: 100 }
      })
      const onDrag = vi.fn()

      render(
        harness.construct.render({
          node,
          onDrag,
          enableKeyboard: true
        })
      )

      const nodeElement = screen.getByText(node.data.label).parentElement!
      nodeElement.focus()

      // Arrow key movement
      fireEvent.keyDown(nodeElement, { key: 'ArrowRight' })
      expect(onDrag).toHaveBeenCalledWith(
        node,
        { x: 110, y: 100 }, // Moved right by 10px
        expect.any(Object)
      )

      fireEvent.keyDown(nodeElement, { key: 'ArrowDown' })
      expect(onDrag).toHaveBeenCalledWith(
        node,
        { x: 110, y: 110 }, // Moved down by 10px
        expect.any(Object)
      )
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate successfully', async () => {
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate graph primitive dependency', async () => {
      harness.construct['dependencies'].graphPrimitive = null as any

      const result = await harness.construct.validate()
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('Graph primitive not initialized')
    })
  })

  describe('disposal', () => {
    it('should clean up event listeners', async () => {
      await harness.initialize()
      
      const node = GraphDataFactory.createNode()
      const { unmount } = render(
        harness.construct.render({ node })
      )

      await harness.dispose()
      unmount()

      expect(harness.construct.disposed).toBe(true)
      expect(mockGraphPrimitive.off).toHaveBeenCalled()
      harness.expectEvent('disposed')
    })
  })
})