/**
 * Test file for diagram primitives
 * This demonstrates how to use GraphPrimitive and LayoutEnginePrimitive together
 */

import React, { useState, useEffect } from 'react'
import { GraphPrimitive } from './GraphPrimitive'
import { LayoutEnginePrimitive } from './LayoutEnginePrimitive'

export const DiagramPrimitivesDemo: React.FC = () => {
  const [graph] = useState(() => new GraphPrimitive())
  const [layoutEngine] = useState(() => new LayoutEnginePrimitive())
  const [selectedLayout, setSelectedLayout] = useState<'force' | 'hierarchical' | 'circular' | 'grid'>('force')
  
  useEffect(() => {
    // Initialize graph with sample data
    graph.initialize({
      directed: true,
      initialData: {
        nodes: [
          { id: 'A', x: 100, y: 100 },
          { id: 'B', x: 200, y: 200 },
          { id: 'C', x: 300, y: 100 },
          { id: 'D', x: 400, y: 200 },
          { id: 'E', x: 350, y: 300 }
        ],
        edges: [
          { id: 'A-B', source: 'A', target: 'B', weight: 1 },
          { id: 'B-C', source: 'B', target: 'C', weight: 2 },
          { id: 'C-D', source: 'C', target: 'D', weight: 1 },
          { id: 'B-E', source: 'B', target: 'E', weight: 3 },
          { id: 'D-E', source: 'D', target: 'E', weight: 1 }
        ],
        directed: true
      },
      width: 800,
      height: 600
    })
    
    // Initialize layout engine
    const graphData = graph.getGraphData()
    layoutEngine.initialize({
      nodes: graphData.nodes.map(n => ({ id: n.id, x: n.x || 0, y: n.y || 0 })),
      edges: graphData.edges.map(e => ({ source: e.source, target: e.target, weight: e.weight })),
      layoutType: selectedLayout,
      width: 800,
      height: 600,
      animate: true
    })
  }, [graph, layoutEngine, selectedLayout])
  
  const handleLayoutChange = (newLayout: typeof selectedLayout) => {
    setSelectedLayout(newLayout)
    layoutEngine.initialize({
      nodes: graph.getGraphData().nodes.map(n => ({ id: n.id, x: n.x || 0, y: n.y || 0 })),
      edges: graph.getGraphData().edges.map(e => ({ source: e.source, target: e.target, weight: e.weight })),
      layoutType: newLayout,
      width: 800,
      height: 600,
      animate: true
    })
  }
  
  const handleShortestPath = () => {
    const path = graph.shortestPath('A', 'E')
    console.log('Shortest path from A to E:', path)
  }
  
  const handleBFS = () => {
    const traversal = graph.bfs('A')
    console.log('BFS traversal from A:', traversal)
  }
  
  const handleDFS = () => {
    const traversal = graph.dfs('A')
    console.log('DFS traversal from A:', traversal)
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Diagram Primitives Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Layout Controls</h3>
        <button onClick={() => handleLayoutChange('force')}>Force Layout</button>
        <button onClick={() => handleLayoutChange('hierarchical')}>Hierarchical Layout</button>
        <button onClick={() => handleLayoutChange('circular')}>Circular Layout</button>
        <button onClick={() => handleLayoutChange('grid')}>Grid Layout</button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Graph Algorithms</h3>
        <button onClick={handleShortestPath}>Find Shortest Path (A → E)</button>
        <button onClick={handleBFS}>BFS Traversal</button>
        <button onClick={handleDFS}>DFS Traversal</button>
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Graph Visualization</h3>
          {graph.render()}
        </div>
        
        <div>
          <h3>Layout Engine Visualization</h3>
          {layoutEngine.render()}
        </div>
      </div>
    </div>
  )
}