import React from 'react'
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  MiniMap,
  Position,
  ConnectionMode
} from 'reactflow'
import 'reactflow/dist/style.css'

interface CustomNodeData {
  label: string
  color: string
  description?: string
}

const nodeTypes = {
  customNode: ({ data }: { data: CustomNodeData }) => (
    <div className={`px-4 py-3 rounded-lg border-2 ${data.color} min-w-[150px] text-center relative`}>
      <div className="font-semibold text-sm">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-400 mt-1">{data.description}</div>
      )}
    </div>
  )
}

const ArchitectureDiagram: React.FC = () => {
  const nodes: Node[] = [
    // Frontend Layer
    {
      id: 'frontend',
      type: 'customNode',
      position: { x: 400, y: 50 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'React Frontend',
        description: 'UI Components',
        color: 'bg-blue-900 border-blue-500 text-blue-300'
      }
    },
    {
      id: 'claude-chat',
      type: 'customNode',
      position: { x: 200, y: 50 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Claude Chat',
        description: 'AI Assistant',
        color: 'bg-purple-900 border-purple-500 text-purple-300'
      }
    },
    {
      id: 'editor',
      type: 'customNode',
      position: { x: 600, y: 50 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Code Editor',
        description: 'CodeMirror 6',
        color: 'bg-green-900 border-green-500 text-green-300'
      }
    },
    
    // API Gateway
    {
      id: 'api-gateway',
      type: 'customNode',
      position: { x: 400, y: 200 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'API Gateway',
        description: 'Express.js',
        color: 'bg-gray-800 border-gray-600 text-gray-300'
      }
    },
    
    // Backend Services
    {
      id: 'auth-service',
      type: 'customNode',
      position: { x: 150, y: 350 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Auth Service',
        description: 'JWT/OAuth',
        color: 'bg-orange-900 border-orange-500 text-orange-300'
      }
    },
    {
      id: 'claude-service',
      type: 'customNode',
      position: { x: 350, y: 350 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Claude Service',
        description: 'Anthropic API',
        color: 'bg-purple-900 border-purple-500 text-purple-300'
      }
    },
    {
      id: 'file-service',
      type: 'customNode',
      position: { x: 550, y: 350 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'File Service',
        description: 'Project Files',
        color: 'bg-yellow-900 border-yellow-500 text-yellow-300'
      }
    },
    
    // Provider Layer
    {
      id: 'provider-abstraction',
      type: 'customNode',
      position: { x: 350, y: 500 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Provider Abstraction',
        description: 'Multi-Cloud Interface',
        color: 'bg-indigo-900 border-indigo-500 text-indigo-300'
      }
    },
    
    // Providers
    {
      id: 'local-provider',
      type: 'customNode',
      position: { x: 100, y: 650 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Local Provider',
        description: 'File System',
        color: 'bg-gray-800 border-gray-600 text-gray-300'
      }
    },
    {
      id: 'firebase-provider',
      type: 'customNode',
      position: { x: 350, y: 650 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'Firebase Provider',
        description: 'Firestore + Functions',
        color: 'bg-orange-900 border-orange-500 text-orange-300'
      }
    },
    {
      id: 'aws-provider',
      type: 'customNode',
      position: { x: 600, y: 650 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { 
        label: 'AWS Provider',
        description: 'Lambda + DynamoDB',
        color: 'bg-yellow-900 border-yellow-500 text-yellow-300'
      }
    },
    
    // MCP Servers
    {
      id: 'mcp-ui',
      type: 'customNode',
      position: { x: 50, y: 200 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { 
        label: 'MCP UI Server',
        description: 'UI Testing',
        color: 'bg-pink-900 border-pink-500 text-pink-300'
      }
    },
    {
      id: 'mcp-provider',
      type: 'customNode',
      position: { x: 750, y: 500 },
      sourcePosition: Position.Left,
      targetPosition: Position.Right,
      data: { 
        label: 'MCP Provider',
        description: 'Provider Tools',
        color: 'bg-pink-900 border-pink-500 text-pink-300'
      }
    }
  ]

  const edges: Edge[] = [
    // Frontend connections
    { id: 'e1', source: 'frontend', target: 'api-gateway', type: 'smoothstep', animated: true },
    { id: 'e2', source: 'claude-chat', target: 'api-gateway', type: 'smoothstep', animated: true },
    { id: 'e3', source: 'editor', target: 'api-gateway', type: 'smoothstep', animated: true },
    
    // API to services
    { id: 'e4', source: 'api-gateway', target: 'auth-service', type: 'smoothstep' },
    { id: 'e5', source: 'api-gateway', target: 'claude-service', type: 'smoothstep' },
    { id: 'e6', source: 'api-gateway', target: 'file-service', type: 'smoothstep' },
    
    // Services to provider abstraction
    { id: 'e7', source: 'auth-service', target: 'provider-abstraction', type: 'smoothstep' },
    { id: 'e8', source: 'file-service', target: 'provider-abstraction', type: 'smoothstep' },
    
    // Provider abstraction to providers
    { id: 'e9', source: 'provider-abstraction', target: 'local-provider', type: 'smoothstep' },
    { id: 'e10', source: 'provider-abstraction', target: 'firebase-provider', type: 'smoothstep' },
    { id: 'e11', source: 'provider-abstraction', target: 'aws-provider', type: 'smoothstep' },
    
    // MCP connections
    { id: 'e12', source: 'mcp-ui', target: 'frontend', type: 'smoothstep', style: { stroke: '#ec4899', strokeDasharray: '5,5' } },
    { id: 'e13', source: 'mcp-provider', target: 'provider-abstraction', type: 'smoothstep', style: { stroke: '#ec4899', strokeDasharray: '5,5' } }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">System Architecture</h1>
        <p className="text-xl text-gray-400 mb-8">
          Love Claude Code uses a modular, multi-cloud architecture that allows you to start simple and scale globally.
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-2 border border-gray-700">
        <div style={{ height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#4b5563" gap={16} />
            <Controls className="bg-gray-800 border border-gray-700" />
            <MiniMap 
              className="bg-gray-800 border border-gray-700"
              nodeColor="#1f2937"
              maskColor="rgba(0, 0, 0, 0.8)"
            />
          </ReactFlow>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3 text-blue-400">Frontend Layer</h3>
          <p className="text-gray-400">
            React-based UI with real-time code editing, AI chat interface, and live preview capabilities.
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3 text-indigo-400">Provider Abstraction</h3>
          <p className="text-gray-400">
            Unified interface allows seamless switching between Local, Firebase, and AWS backends.
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3 text-pink-400">MCP Integration</h3>
          <p className="text-gray-400">
            Model Context Protocol servers enable Claude to interact with UI and manage providers.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ArchitectureDiagram