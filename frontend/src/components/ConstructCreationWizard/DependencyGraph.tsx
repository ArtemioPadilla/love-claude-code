import React, { useMemo } from 'react'
import ReactFlow, {
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { ConstructDisplay } from '../../constructs/types'

interface DependencyGraphProps {
  constructId: string
  dependencies: Array<{
    constructId: string
    version: string
    optional?: boolean
  }>
  constructs: ConstructDisplay[]
}

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  style: {
    background: 'var(--accent)',
    color: 'var(--foreground)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '12px',
    width: 180
  }
}

export function DependencyGraph({ constructId, dependencies, constructs }: DependencyGraphProps) {
  const initialNodes = useMemo(() => {
    const nodes: Node[] = []
    
    // Add main construct node
    nodes.push({
      id: constructId,
      position: { x: 50, y: 100 },
      data: { label: 'Current Construct' },
      style: {
        ...nodeDefaults.style,
        background: 'var(--primary)',
        color: 'white',
        fontWeight: 'bold'
      }
    })
    
    // Add dependency nodes
    dependencies.forEach((dep, index) => {
      const construct = constructs.find(c => c.definition.id === dep.constructId)
      if (construct) {
        nodes.push({
          id: dep.constructId,
          position: { x: 300, y: 50 + index * 80 },
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium">{construct.definition.name}</div>
                <div className="text-xs opacity-70">v{dep.version}</div>
                {dep.optional && (
                  <div className="text-xs italic opacity-70">(optional)</div>
                )}
              </div>
            )
          },
          style: {
            ...nodeDefaults.style,
            borderStyle: dep.optional ? 'dashed' : 'solid'
          }
        })
      }
    })
    
    return nodes
  }, [constructId, dependencies, constructs])
  
  const initialEdges = useMemo(() => {
    return dependencies.map((dep) => ({
      id: `${constructId}-${dep.constructId}`,
      source: constructId,
      target: dep.constructId,
      type: 'smoothstep',
      animated: !dep.optional,
      style: {
        stroke: dep.optional ? 'var(--muted-foreground)' : 'var(--primary)',
        strokeWidth: 2
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: dep.optional ? 'var(--muted-foreground)' : 'var(--primary)'
      }
    }))
  }, [constructId, dependencies])
  
  const [nodes] = useNodesState(initialNodes)
  const [edges] = useEdgesState(initialEdges)
  
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={16} />
        <Controls
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px'
          }}
        />
      </ReactFlow>
    </div>
  )
}