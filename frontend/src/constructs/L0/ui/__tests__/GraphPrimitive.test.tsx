import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GraphPrimitive } from '../GraphPrimitive'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent 
} from '../../../../test-utils/constructTestUtils'
import { GraphDataFactory } from '../../../../test-utils/testFactories'
import { ConstructLevel } from '../../../types'

describe('GraphPrimitive', () => {
  let harness: ConstructTestHarness<GraphPrimitive>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'graph-primitive',
      name: 'Graph Primitive',
      level: ConstructLevel.L0,
      category: 'ui'
    })
    harness = new ConstructTestHarness(GraphPrimitive, metadata)
  })

  describe('initialization', () => {
    it('should initialize with empty graph', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      expect(harness.construct.getNodes()).toEqual([])
      expect(harness.construct.getEdges()).toEqual([])
      harness.expectEvent('initialized')
    })

    it('should emit graph:initialized event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'graph:initialized')
      await harness.initialize()
      
      const event = await promise
      expect(event).toEqual({ nodes: [], edges: [] })
    })
  })

  describe('node operations', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should add nodes', () => {
      const node1 = GraphDataFactory.createNode({ id: 'node-1' })
      const node2 = GraphDataFactory.createNode({ id: 'node-2' })

      harness.construct.addNode(node1)
      harness.construct.addNode(node2)

      const nodes = harness.construct.getNodes()
      expect(nodes).toHaveLength(2)
      expect(nodes[0]).toEqual(node1)
      expect(nodes[1]).toEqual(node2)
    })

    it('should emit node:added event', () => {
      const node = GraphDataFactory.createNode()
      harness.construct.addNode(node)

      harness.expectEvent('node:added', { node })
    })

    it('should update nodes', () => {
      const node = GraphDataFactory.createNode({ id: 'node-1' })
      harness.construct.addNode(node)
      harness.clearEvents()

      const updates = { data: { label: 'Updated Node' } }
      harness.construct.updateNode('node-1', updates)

      const updatedNode = harness.construct.getNode('node-1')
      expect(updatedNode?.data.label).toBe('Updated Node')
      harness.expectEvent('node:updated', { nodeId: 'node-1', updates })
    })

    it('should remove nodes and connected edges', () => {
      const { nodes, edges } = GraphDataFactory.createFlowGraph(3, 2)
      nodes.forEach(n => harness.construct.addNode(n))
      edges.forEach(e => harness.construct.addEdge(e))
      harness.clearEvents()

      harness.construct.removeNode('node-2')

      expect(harness.construct.getNodes()).toHaveLength(2)
      expect(harness.construct.getEdges()).toHaveLength(0) // Both edges connected to node-2
      harness.expectEvent('node:removed', { nodeId: 'node-2' })
    })

    it('should validate node before adding', () => {
      const invalidNode = { id: 'invalid' } // Missing required fields
      
      expect(() => harness.construct.addNode(invalidNode as any))
        .toThrow('Invalid node data')
    })
  })

  describe('edge operations', () => {
    beforeEach(async () => {
      await harness.initialize()
      const { nodes } = GraphDataFactory.createFlowGraph(3, 0)
      nodes.forEach(n => harness.construct.addNode(n))
      harness.clearEvents()
    })

    it('should add edges between existing nodes', () => {
      const edge = GraphDataFactory.createEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2'
      })

      harness.construct.addEdge(edge)

      const edges = harness.construct.getEdges()
      expect(edges).toHaveLength(1)
      expect(edges[0]).toEqual(edge)
      harness.expectEvent('edge:added', { edge })
    })

    it('should not add edge if nodes do not exist', () => {
      const edge = GraphDataFactory.createEdge({
        source: 'non-existent',
        target: 'node-1'
      })

      expect(() => harness.construct.addEdge(edge))
        .toThrow('Source or target node not found')
    })

    it('should update edges', () => {
      const edge = GraphDataFactory.createEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2'
      })
      harness.construct.addEdge(edge)
      harness.clearEvents()

      const updates = { data: { label: 'Updated Edge' } }
      harness.construct.updateEdge('edge-1', updates)

      const updatedEdge = harness.construct.getEdge('edge-1')
      expect(updatedEdge?.data.label).toBe('Updated Edge')
      harness.expectEvent('edge:updated', { edgeId: 'edge-1', updates })
    })

    it('should remove edges', () => {
      const edge = GraphDataFactory.createEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2'
      })
      harness.construct.addEdge(edge)
      harness.clearEvents()

      harness.construct.removeEdge('edge-1')

      expect(harness.construct.getEdges()).toHaveLength(0)
      harness.expectEvent('edge:removed', { edgeId: 'edge-1' })
    })
  })

  describe('graph operations', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should clear all nodes and edges', () => {
      const { nodes, edges } = GraphDataFactory.createFlowGraph(5, 4)
      nodes.forEach(n => harness.construct.addNode(n))
      edges.forEach(e => harness.construct.addEdge(e))
      harness.clearEvents()

      harness.construct.clear()

      expect(harness.construct.getNodes()).toHaveLength(0)
      expect(harness.construct.getEdges()).toHaveLength(0)
      harness.expectEvent('graph:cleared')
    })

    it('should find connected nodes', () => {
      const { nodes, edges } = GraphDataFactory.createFlowGraph(4, 3)
      nodes.forEach(n => harness.construct.addNode(n))
      edges.forEach(e => harness.construct.addEdge(e))

      const connected = harness.construct.getConnectedNodes('node-2')
      expect(connected).toHaveLength(2)
      expect(connected.map(n => n.id)).toContain('node-1')
      expect(connected.map(n => n.id)).toContain('node-3')
    })

    it('should detect cycles', () => {
      const { nodes } = GraphDataFactory.createFlowGraph(3, 0)
      nodes.forEach(n => harness.construct.addNode(n))
      
      // Create a cycle
      harness.construct.addEdge({
        id: 'e1',
        source: 'node-1',
        target: 'node-2',
        type: 'default',
        data: {}
      })
      harness.construct.addEdge({
        id: 'e2',
        source: 'node-2',
        target: 'node-3',
        type: 'default',
        data: {}
      })
      harness.construct.addEdge({
        id: 'e3',
        source: 'node-3',
        target: 'node-1',
        type: 'default',
        data: {}
      })

      expect(harness.construct.hasCycles()).toBe(true)
    })

    it('should serialize and deserialize graph', () => {
      const { nodes, edges } = GraphDataFactory.createFlowGraph(3, 2)
      nodes.forEach(n => harness.construct.addNode(n))
      edges.forEach(e => harness.construct.addEdge(e))

      const serialized = harness.construct.serialize()
      expect(serialized).toHaveProperty('nodes')
      expect(serialized).toHaveProperty('edges')
      expect(serialized.nodes).toHaveLength(3)
      expect(serialized.edges).toHaveLength(2)

      // Clear and restore
      harness.construct.clear()
      harness.construct.deserialize(serialized)

      expect(harness.construct.getNodes()).toHaveLength(3)
      expect(harness.construct.getEdges()).toHaveLength(2)
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate empty graph', async () => {
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate graph with nodes and edges', async () => {
      const { nodes, edges } = GraphDataFactory.createFlowGraph(3, 2)
      nodes.forEach(n => harness.construct.addNode(n))
      edges.forEach(e => harness.construct.addEdge(e))

      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
    })

    it('should detect orphaned edges in validation', async () => {
      // Manually create invalid state for testing
      const edge = GraphDataFactory.createEdge()
      harness.construct['edges'].push(edge) // Force invalid state

      const result = await harness.construct.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('references non-existent nodes')
    })
  })

  describe('disposal', () => {
    it('should clear graph and emit disposed event', async () => {
      await harness.initialize()
      const { nodes, edges } = GraphDataFactory.createFlowGraph(3, 2)
      nodes.forEach(n => harness.construct.addNode(n))
      edges.forEach(e => harness.construct.addEdge(e))

      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      expect(harness.construct.getNodes()).toHaveLength(0)
      expect(harness.construct.getEdges()).toHaveLength(0)
      harness.expectEvent('disposed')
    })
  })
})