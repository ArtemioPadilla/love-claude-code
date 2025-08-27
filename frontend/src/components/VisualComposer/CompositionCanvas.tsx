/**
 * CompositionCanvas Component
 * 
 * The main canvas area for visual construct composition
 */

import React from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProps
} from 'reactflow'
import { ConstructLevel } from '../../constructs/types'

interface CompositionCanvasProps extends ReactFlowProps {
  showGrid?: boolean
  showMinimap?: boolean
}

const nodeColor = (node: Node) => {
  const level = node.data?.construct?.definition?.level
  switch (level) {
    case ConstructLevel.L0: {
      return '#10B981'
    }
    case ConstructLevel.L1: {
      return '#3B82F6'
    }
    case ConstructLevel.L2: {
      return '#8B5CF6'
    }
    case ConstructLevel.L3: {
      return '#F59E0B'
    }
    default: {
      return '#6B7280'
    }
  }
}

export const CompositionCanvas: React.FC<CompositionCanvasProps> = ({
  showGrid = true,
  showMinimap = true,
  ...props
}) => {
  return (
    <ReactFlow
      {...props}
      fitView
      attributionPosition="bottom-left"
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#4B5563', strokeWidth: 2 }
      }}
    >
      {showGrid && (
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#374151"
        />
      )}
      <Controls 
        showZoom
        showFitView
        showInteractive
        position="top-right"
      />
      {showMinimap && (
        <MiniMap 
          nodeColor={nodeColor}
          pannable
          zoomable
          position="bottom-right"
          style={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151'
          }}
        />
      )}
    </ReactFlow>
  )
}