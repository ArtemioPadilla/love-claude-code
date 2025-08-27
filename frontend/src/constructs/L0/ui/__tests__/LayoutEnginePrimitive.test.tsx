import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LayoutEnginePrimitive } from '../LayoutEnginePrimitive'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent 
} from '../../../../test-utils/constructTestUtils'
import { LayoutDataFactory } from '../../../../test-utils/testFactories'
import { ConstructLevel } from '../../../types'

describe('LayoutEnginePrimitive', () => {
  let harness: ConstructTestHarness<LayoutEnginePrimitive>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'layout-engine',
      name: 'Layout Engine Primitive',
      level: ConstructLevel.L0,
      category: 'ui'
    })
    harness = new ConstructTestHarness(LayoutEnginePrimitive, metadata)
  })

  describe('initialization', () => {
    it('should initialize with default algorithm', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      expect(harness.construct['currentAlgorithm']).toBe('grid')
      harness.expectEvent('initialized')
    })

    it('should emit layout:initialized event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'layout:initialized')
      await harness.initialize()
      
      const event = await promise
      expect(event).toEqual({ algorithm: 'grid' })
    })
  })

  describe('layout algorithms', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should set layout algorithm', () => {
      harness.construct.setAlgorithm('force')
      expect(harness.construct['currentAlgorithm']).toBe('force')
      harness.expectEvent('algorithm:changed', { algorithm: 'force' })
    })

    it('should validate algorithm type', () => {
      expect(() => harness.construct.setAlgorithm('invalid' as any))
        .toThrow('Invalid layout algorithm')
    })

    it('should get available algorithms', () => {
      const algorithms = harness.construct.getAvailableAlgorithms()
      expect(algorithms).toContain('grid')
      expect(algorithms).toContain('tree')
      expect(algorithms).toContain('force')
      expect(algorithms).toContain('circular')
      expect(algorithms).toContain('hierarchical')
    })
  })

  describe('grid layout', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.construct.setAlgorithm('grid')
      harness.clearEvents()
    })

    it('should layout items in grid pattern', () => {
      const items = Array.from({ length: 6 }, (_, i) => ({
        id: `item-${i}`,
        width: 100,
        height: 100
      }))

      const constraints = LayoutDataFactory.createConstraints({
        columns: 3,
        gap: 10
      })

      const result = harness.construct.layout(items, constraints)

      expect(result.positions).toHaveLength(6)
      
      // Check grid positioning
      expect(result.positions[0]).toEqual({ id: 'item-0', x: 10, y: 10 })
      expect(result.positions[1]).toEqual({ id: 'item-1', x: 120, y: 10 })
      expect(result.positions[2]).toEqual({ id: 'item-2', x: 230, y: 10 })
      expect(result.positions[3]).toEqual({ id: 'item-3', x: 10, y: 120 })
    })

    it('should respect grid constraints', () => {
      const items = Array.from({ length: 4 }, (_, i) => ({
        id: `item-${i}`,
        width: 150,
        height: 150
      }))

      const constraints = LayoutDataFactory.createGridConstraints()
      const result = harness.construct.layout(items, constraints)

      // Check all positions are snapped to grid
      result.positions.forEach(pos => {
        expect(pos.x % 10).toBe(0)
        expect(pos.y % 10).toBe(0)
      })
    })

    it('should emit layout:completed event', () => {
      const items = [{ id: 'item-1', width: 100, height: 100 }]
      const constraints = LayoutDataFactory.createConstraints()

      harness.construct.layout(items, constraints)

      harness.expectEvent('layout:completed', {
        algorithm: 'grid',
        itemCount: 1,
        bounds: expect.any(Object)
      })
    })
  })

  describe('tree layout', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.construct.setAlgorithm('tree')
      harness.clearEvents()
    })

    it('should layout items in tree hierarchy', () => {
      const items = [
        { id: 'root', width: 100, height: 50 },
        { id: 'child1', width: 100, height: 50, parent: 'root' },
        { id: 'child2', width: 100, height: 50, parent: 'root' },
        { id: 'grandchild', width: 100, height: 50, parent: 'child1' }
      ]

      const result = harness.construct.layout(items, LayoutDataFactory.createConstraints())

      // Root should be at top center
      const root = result.positions.find(p => p.id === 'root')
      expect(root?.y).toBe(10)

      // Children should be below root
      const child1 = result.positions.find(p => p.id === 'child1')
      const child2 = result.positions.find(p => p.id === 'child2')
      expect(child1?.y).toBeGreaterThan(root?.y || 0)
      expect(child2?.y).toBe(child1?.y)

      // Grandchild should be below children
      const grandchild = result.positions.find(p => p.id === 'grandchild')
      expect(grandchild?.y).toBeGreaterThan(child1?.y || 0)
    })

    it('should handle multiple root nodes', () => {
      const items = [
        { id: 'root1', width: 100, height: 50 },
        { id: 'root2', width: 100, height: 50 },
        { id: 'child', width: 100, height: 50, parent: 'root1' }
      ]

      const result = harness.construct.layout(items, LayoutDataFactory.createConstraints())
      expect(result.positions).toHaveLength(3)
    })
  })

  describe('force-directed layout', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.construct.setAlgorithm('force')
      harness.clearEvents()
    })

    it('should layout items using force simulation', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: `node-${i}`,
        width: 50,
        height: 50
      }))

      const edges = [
        { source: 'node-0', target: 'node-1' },
        { source: 'node-1', target: 'node-2' },
        { source: 'node-2', target: 'node-3' },
        { source: 'node-3', target: 'node-4' }
      ]

      const constraints = LayoutDataFactory.createConstraints({
        edges,
        iterations: 10
      })

      const result = harness.construct.layout(items, constraints)

      expect(result.positions).toHaveLength(5)
      
      // Verify all nodes have positions
      result.positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(0)
        expect(pos.y).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('circular layout', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.construct.setAlgorithm('circular')
      harness.clearEvents()
    })

    it('should arrange items in circle', () => {
      const items = Array.from({ length: 8 }, (_, i) => ({
        id: `item-${i}`,
        width: 50,
        height: 50
      }))

      const constraints = LayoutDataFactory.createConstraints({
        radius: 200,
        center: { x: 250, y: 250 }
      })

      const result = harness.construct.layout(items, constraints)

      // Verify all items are equidistant from center
      const center = { x: 250, y: 250 }
      result.positions.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x + 25 - center.x, 2) + 
          Math.pow(pos.y + 25 - center.y, 2)
        )
        expect(distance).toBeCloseTo(200, 1)
      })
    })
  })

  describe('hierarchical layout', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.construct.setAlgorithm('hierarchical')
      harness.clearEvents()
    })

    it('should layout items in layers', () => {
      const items = [
        { id: 'layer0-1', width: 100, height: 50, layer: 0 },
        { id: 'layer1-1', width: 100, height: 50, layer: 1 },
        { id: 'layer1-2', width: 100, height: 50, layer: 1 },
        { id: 'layer2-1', width: 100, height: 50, layer: 2 }
      ]

      const result = harness.construct.layout(items, LayoutDataFactory.createConstraints())

      // Verify items are arranged by layer
      const positions = result.positions.reduce((acc, pos) => {
        acc[pos.id] = pos
        return acc
      }, {} as Record<string, any>)

      expect(positions['layer0-1'].y).toBeLessThan(positions['layer1-1'].y)
      expect(positions['layer1-1'].y).toBe(positions['layer1-2'].y)
      expect(positions['layer1-1'].y).toBeLessThan(positions['layer2-1'].y)
    })
  })

  describe('constraints validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should enforce minimum size constraints', () => {
      const items = [{ id: 'item', width: 50, height: 50 }]
      const constraints = LayoutDataFactory.createConstraints({
        minWidth: 200,
        minHeight: 200
      })

      const result = harness.construct.layout(items, constraints)
      
      expect(result.bounds.width).toBeGreaterThanOrEqual(200)
      expect(result.bounds.height).toBeGreaterThanOrEqual(200)
    })

    it('should enforce maximum size constraints', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        width: 100,
        height: 100
      }))

      const constraints = LayoutDataFactory.createConstraints({
        maxWidth: 400,
        maxHeight: 400
      })

      const result = harness.construct.layout(items, constraints)
      
      expect(result.bounds.width).toBeLessThanOrEqual(400)
      expect(result.bounds.height).toBeLessThanOrEqual(400)
    })

    it('should respect aspect ratio', () => {
      const items = Array.from({ length: 6 }, (_, i) => ({
        id: `item-${i}`,
        width: 100,
        height: 100
      }))

      const constraints = LayoutDataFactory.createConstraints({
        aspectRatio: 16 / 9
      })

      const result = harness.construct.layout(items, constraints)
      const ratio = result.bounds.width / result.bounds.height
      
      expect(ratio).toBeCloseTo(16 / 9, 1)
    })
  })

  describe('performance', () => {
    it('should handle large number of items', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        width: 50,
        height: 50
      }))

      const start = performance.now()
      const result = harness.construct.layout(items, LayoutDataFactory.createConstraints())
      const duration = performance.now() - start

      expect(result.positions).toHaveLength(1000)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
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
  })

  describe('disposal', () => {
    it('should clear state and emit disposed event', async () => {
      await harness.initialize()
      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      harness.expectEvent('disposed')
    })
  })
})