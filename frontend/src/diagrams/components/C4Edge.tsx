import React from 'react'
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'

interface C4EdgeData {
  label?: string
  description?: string
  technology?: string
  type?: 'sync' | 'async' | 'dataflow'
}

/**
 * Custom edge component for C4 diagrams
 */
export const C4Edge: React.FC<EdgeProps<C4EdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  
  const edgeStyle = {
    ...style,
    strokeDasharray: data?.type === 'async' ? '5,5' : undefined,
    stroke: data?.type === 'dataflow' ? '#3b82f6' : '#6b7280'
  }
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-gray-800 px-2 py-1 rounded text-xs border border-gray-700"
        >
          {data?.label && (
            <div className="text-white font-medium">{data.label}</div>
          )}
          {data?.technology && (
            <div className="text-gray-400 text-[10px]">[{data.technology}]</div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}