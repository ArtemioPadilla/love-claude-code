import React, { useState, useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  MarkerType,
  Position,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './architecture.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiLayers,
  FiGitBranch,
  FiDatabase,
  FiServer,
  FiX,
  FiSearch,
  FiMaximize,
  FiMinimize,
  FiDownload,
  FiInfo,
  FiZoomIn,
  FiZoomOut,
  FiHome,
} from 'react-icons/fi'
import NavigationBar from '../Layout/NavigationBar'

// Define view types
type ViewMode = 'technical' | 'construct' | 'dataflow' | 'deployment'

// Component types for categorization
type ComponentType = 'frontend' | 'backend' | 'provider' | 'mcp' | 'infrastructure' | 'external' | 'construct'

// Node data interface
interface NodeData {
  type: ComponentType
  label: string
  subtitle?: string
}

// Custom node component
const CustomNode = ({ data }: { data: NodeData }) => {
  const getTypeColor = (type: ComponentType) => {
    switch (type) {
      case 'frontend': return 'bg-blue-500/20 border-blue-500'
      case 'backend': return 'bg-green-500/20 border-green-500'
      case 'provider': return 'bg-purple-500/20 border-purple-500'
      case 'mcp': return 'bg-orange-500/20 border-orange-500'
      case 'infrastructure': return 'bg-red-500/20 border-red-500'
      case 'external': return 'bg-gray-500/20 border-gray-500'
      case 'construct': return 'bg-yellow-500/20 border-yellow-500'
      default: return 'bg-gray-500/20 border-gray-500'
    }
  }

  const getTypeIcon = (type: ComponentType) => {
    switch (type) {
      case 'frontend': return '🎨'
      case 'backend': return '⚙️'
      case 'provider': return '☁️'
      case 'mcp': return '🤖'
      case 'infrastructure': return '🏗️'
      case 'external': return '🌐'
      case 'construct': return '🧩'
      default: return '📦'
    }
  }

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${getTypeColor(data.type)} backdrop-blur-sm transition-all hover:scale-105 min-w-[180px]`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{getTypeIcon(data.type)}</span>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-muted-foreground">{data.subtitle}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Component details modal
interface ComponentDetails {
  id: string
  label: string
  description: string
  technologies: string[]
  dependencies: string[]
  apis?: string[]
  constructs?: string[]
  type: ComponentType
}

const ComponentDetailsModal = ({ 
  component, 
  onClose 
}: { 
  component: ComponentDetails | null
  onClose: () => void 
}) => {
  if (!component) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border border-border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{component.label}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <p className="text-muted-foreground mb-6">{component.description}</p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FiServer className="w-4 h-4" />
                Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {component.technologies.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-accent rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {component.dependencies.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FiGitBranch className="w-4 h-4" />
                  Dependencies
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {component.dependencies.map((dep, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{dep}</li>
                  ))}
                </ul>
              </div>
            )}

            {component.apis && component.apis.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FiDatabase className="w-4 h-4" />
                  API Endpoints
                </h3>
                <div className="space-y-1">
                  {component.apis.map((api, i) => (
                    <code key={i} className="block text-xs bg-accent p-2 rounded">
                      {api}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {component.constructs && component.constructs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FiLayers className="w-4 h-4" />
                  Related Constructs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {component.constructs.map((construct, i) => (
                    <span key={i} className="px-3 py-1 bg-yellow-500/20 border border-yellow-500 rounded-full text-sm">
                      {construct}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Architecture data
const componentDetails: Record<string, ComponentDetails> = {
  // Frontend Components
  'frontend-react': {
    id: 'frontend-react',
    label: 'React App',
    description: 'Main React application with TypeScript, providing the user interface for Love Claude Code.',
    technologies: ['React 18.2+', 'TypeScript 5.3+', 'Vite 5.0+', 'Tailwind CSS 3.4+'],
    dependencies: ['Zustand', 'CodeMirror 6', 'ReactFlow', 'Framer Motion'],
    type: 'frontend'
  },
  'frontend-editor': {
    id: 'frontend-editor',
    label: 'Code Editor',
    description: 'CodeMirror-based code editor with syntax highlighting, auto-completion, and multi-file support.',
    technologies: ['CodeMirror 6', 'TypeScript'],
    dependencies: ['frontend-react', 'frontend-stores'],
    constructs: ['L0: CodeEditorPrimitive', 'L1: ConfiguredEditor'],
    type: 'frontend'
  },
  'frontend-chat': {
    id: 'frontend-chat',
    label: 'Chat Interface',
    description: 'Real-time chat interface for conversing with Claude, featuring streaming responses and markdown rendering.',
    technologies: ['React', 'WebSocket', 'Markdown'],
    dependencies: ['frontend-react', 'backend-claude'],
    constructs: ['L0: ChatMessagePrimitive', 'L1: ChatPanel'],
    type: 'frontend'
  },
  'frontend-preview': {
    id: 'frontend-preview',
    label: 'Live Preview',
    description: 'Sandboxed iframe preview of generated applications with hot reload support.',
    technologies: ['React', 'Iframe Sandbox'],
    dependencies: ['frontend-react', 'backend-bundler'],
    type: 'frontend'
  },
  'frontend-stores': {
    id: 'frontend-stores',
    label: 'State Management',
    description: 'Zustand-based state management for application-wide state including editor, projects, and user preferences.',
    technologies: ['Zustand 4.0+', 'TypeScript'],
    dependencies: ['frontend-react'],
    type: 'frontend'
  },

  // Backend Services
  'backend-api': {
    id: 'backend-api',
    label: 'REST API',
    description: 'Express-based REST API providing endpoints for file operations, project management, and authentication.',
    technologies: ['Node.js 20+', 'Express', 'TypeScript'],
    dependencies: ['backend-providers'],
    apis: ['GET /api/files', 'POST /api/projects', 'PUT /api/settings'],
    type: 'backend'
  },
  'backend-claude': {
    id: 'backend-claude',
    label: 'Claude Service',
    description: 'Service handling Claude API integration with streaming support and intelligent model routing.',
    technologies: ['Anthropic SDK', 'AWS Bedrock', 'WebSocket'],
    dependencies: ['backend-api'],
    type: 'backend'
  },
  'backend-providers': {
    id: 'backend-providers',
    label: 'Provider Abstraction',
    description: 'Multi-cloud provider abstraction layer supporting Local, Firebase, and AWS backends.',
    technologies: ['TypeScript', 'Factory Pattern'],
    dependencies: ['provider-local', 'provider-firebase', 'provider-aws'],
    type: 'backend'
  },
  'backend-bundler': {
    id: 'backend-bundler',
    label: 'Code Bundler',
    description: 'Service for bundling and transpiling user code for preview execution.',
    technologies: ['esbuild', 'Rollup', 'TypeScript'],
    dependencies: ['backend-api'],
    type: 'backend'
  },

  // Providers
  'provider-local': {
    id: 'provider-local',
    label: 'Local Provider',
    description: 'Zero-config local development provider with JSON file storage and JWT authentication.',
    technologies: ['PostgreSQL', 'JSON Storage', 'JWT', 'WebSocket'],
    dependencies: ['backend-providers'],
    type: 'provider'
  },
  'provider-firebase': {
    id: 'provider-firebase',
    label: 'Firebase Provider',
    description: 'Firebase-based provider for rapid prototyping with real-time sync and managed infrastructure.',
    technologies: ['Firestore', 'Firebase Auth', 'Cloud Functions', 'Cloud Storage'],
    dependencies: ['backend-providers'],
    type: 'provider'
  },
  'provider-aws': {
    id: 'provider-aws',
    label: 'AWS Provider',
    description: 'Production-ready AWS provider with fine-grained control and enterprise features.',
    technologies: ['DynamoDB', 'Cognito', 'Lambda', 'S3', 'API Gateway'],
    dependencies: ['backend-providers'],
    type: 'provider'
  },

  // MCP Servers
  'mcp-provider': {
    id: 'mcp-provider',
    label: 'MCP Provider Server',
    description: 'Model Context Protocol server for provider analysis, comparison, and migration assistance.',
    technologies: ['MCP SDK', 'TypeScript', 'Node.js'],
    dependencies: ['backend-providers'],
    type: 'mcp'
  },
  'mcp-ui': {
    id: 'mcp-ui',
    label: 'MCP UI Testing',
    description: 'MCP server for UI testing, screenshot capture, and DOM inspection.',
    technologies: ['Puppeteer', 'MCP SDK', 'TypeScript'],
    dependencies: ['frontend-react'],
    type: 'mcp'
  },
  'mcp-construct': {
    id: 'mcp-construct',
    label: 'MCP Construct Server',
    description: 'MCP server for construct generation, validation, and catalog management.',
    technologies: ['MCP SDK', 'TypeScript', 'YAML'],
    dependencies: ['construct-system'],
    type: 'mcp'
  },

  // Infrastructure
  'infra-docker': {
    id: 'infra-docker',
    label: 'Docker Containers',
    description: 'Multi-stage Docker builds for all services with compose orchestration.',
    technologies: ['Docker', 'Docker Compose', 'Alpine Linux'],
    dependencies: ['backend-api', 'frontend-react'],
    type: 'infrastructure'
  },
  'infra-monitoring': {
    id: 'infra-monitoring',
    label: 'Monitoring Stack',
    description: 'Prometheus and Grafana-based monitoring with custom dashboards and alerts.',
    technologies: ['Prometheus', 'Grafana', 'CloudWatch'],
    dependencies: ['backend-api'],
    type: 'infrastructure'
  },
  'infra-cache': {
    id: 'infra-cache',
    label: 'Caching Layer',
    description: 'Hybrid caching with Redis and LRU for improved performance and reduced API calls.',
    technologies: ['Redis', 'LRU Cache', 'TypeScript'],
    dependencies: ['backend-providers'],
    type: 'infrastructure'
  },

  // External Services
  'external-anthropic': {
    id: 'external-anthropic',
    label: 'Anthropic API',
    description: 'Direct Anthropic API for development with Claude 3.5 Sonnet and Claude 3 Haiku models.',
    technologies: ['Claude API', 'Streaming'],
    dependencies: [],
    type: 'external'
  },
  'external-bedrock': {
    id: 'external-bedrock',
    label: 'AWS Bedrock',
    description: 'AWS Bedrock for production Claude model access with enterprise features.',
    technologies: ['AWS Bedrock', 'Claude Models'],
    dependencies: [],
    type: 'external'
  },

  // Construct System
  'construct-system': {
    id: 'construct-system',
    label: 'Construct System',
    description: 'Self-referential construct hierarchy enabling the platform to build itself.',
    technologies: ['TypeScript', 'React', 'YAML'],
    dependencies: ['construct-l0', 'construct-l1', 'construct-l2', 'construct-l3'],
    constructs: ['BaseConstruct', 'ConstructRegistry', 'ConstructValidator'],
    type: 'construct'
  },
  'construct-l0': {
    id: 'construct-l0',
    label: 'L0 Primitives',
    description: 'Atomic, indivisible building blocks including UI and infrastructure primitives.',
    technologies: ['React', 'TypeScript'],
    dependencies: [],
    constructs: ['CodeEditorPrimitive', 'ChatMessagePrimitive', 'ButtonPrimitive'],
    type: 'construct'
  },
  'construct-l1': {
    id: 'construct-l1',
    label: 'L1 Configured',
    description: 'Configured instances of L0 primitives with specific settings and behaviors.',
    technologies: ['React', 'TypeScript'],
    dependencies: ['construct-l0'],
    constructs: ['ConfiguredEditor', 'ThemedButton', 'ChatPanel'],
    type: 'construct'
  },
  'construct-l2': {
    id: 'construct-l2',
    label: 'L2 Patterns',
    description: 'Reusable patterns combining multiple L1 constructs for common use cases.',
    technologies: ['React', 'TypeScript'],
    dependencies: ['construct-l1'],
    constructs: ['EditorWithToolbar', 'ChatWithHistory', 'FormBuilder'],
    type: 'construct'
  },
  'construct-l3': {
    id: 'construct-l3',
    label: 'L3 Applications',
    description: 'Complete application features built from L2 patterns.',
    technologies: ['React', 'TypeScript'],
    dependencies: ['construct-l2'],
    constructs: ['IDEWorkspace', 'CollaborativeEditor', 'ProjectDashboard'],
    type: 'construct'
  },
}

// Define nodes and edges for different views
const getNodesAndEdges = (viewMode: ViewMode): { nodes: Node[]; edges: Edge[] } => {
  const baseNodeStyle = {
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }

  switch (viewMode) {
    case 'technical':
      return {
        nodes: [
          // Frontend Layer
          { id: 'frontend-react', position: { x: 100, y: 100 }, data: { label: 'React App', subtitle: 'Main UI', type: 'frontend' }, ...baseNodeStyle },
          { id: 'frontend-editor', position: { x: 100, y: 200 }, data: { label: 'Code Editor', subtitle: 'CodeMirror', type: 'frontend' }, ...baseNodeStyle },
          { id: 'frontend-chat', position: { x: 100, y: 300 }, data: { label: 'Chat Interface', subtitle: 'Claude Chat', type: 'frontend' }, ...baseNodeStyle },
          { id: 'frontend-preview', position: { x: 100, y: 400 }, data: { label: 'Live Preview', subtitle: 'Sandboxed', type: 'frontend' }, ...baseNodeStyle },
          { id: 'frontend-stores', position: { x: 100, y: 500 }, data: { label: 'State Management', subtitle: 'Zustand', type: 'frontend' }, ...baseNodeStyle },

          // Backend Layer
          { id: 'backend-api', position: { x: 400, y: 200 }, data: { label: 'REST API', subtitle: 'Express', type: 'backend' }, ...baseNodeStyle },
          { id: 'backend-claude', position: { x: 400, y: 300 }, data: { label: 'Claude Service', subtitle: 'AI Integration', type: 'backend' }, ...baseNodeStyle },
          { id: 'backend-providers', position: { x: 400, y: 400 }, data: { label: 'Provider Layer', subtitle: 'Multi-cloud', type: 'backend' }, ...baseNodeStyle },
          { id: 'backend-bundler', position: { x: 400, y: 500 }, data: { label: 'Code Bundler', subtitle: 'esbuild', type: 'backend' }, ...baseNodeStyle },

          // Providers
          { id: 'provider-local', position: { x: 700, y: 300 }, data: { label: 'Local Provider', subtitle: 'Development', type: 'provider' }, ...baseNodeStyle },
          { id: 'provider-firebase', position: { x: 700, y: 400 }, data: { label: 'Firebase Provider', subtitle: 'Rapid Prototype', type: 'provider' }, ...baseNodeStyle },
          { id: 'provider-aws', position: { x: 700, y: 500 }, data: { label: 'AWS Provider', subtitle: 'Production', type: 'provider' }, ...baseNodeStyle },

          // MCP Servers
          { id: 'mcp-provider', position: { x: 400, y: 50 }, data: { label: 'MCP Provider', subtitle: 'Provider Mgmt', type: 'mcp' }, ...baseNodeStyle },
          { id: 'mcp-ui', position: { x: 100, y: 50 }, data: { label: 'MCP UI Testing', subtitle: 'Test Automation', type: 'mcp' }, ...baseNodeStyle },

          // Infrastructure
          { id: 'infra-docker', position: { x: 1000, y: 200 }, data: { label: 'Docker', subtitle: 'Containers', type: 'infrastructure' }, ...baseNodeStyle },
          { id: 'infra-monitoring', position: { x: 1000, y: 300 }, data: { label: 'Monitoring', subtitle: 'Prometheus', type: 'infrastructure' }, ...baseNodeStyle },
          { id: 'infra-cache', position: { x: 1000, y: 400 }, data: { label: 'Cache Layer', subtitle: 'Redis + LRU', type: 'infrastructure' }, ...baseNodeStyle },

          // External
          { id: 'external-anthropic', position: { x: 700, y: 100 }, data: { label: 'Anthropic API', subtitle: 'Claude Direct', type: 'external' }, ...baseNodeStyle },
          { id: 'external-bedrock', position: { x: 700, y: 200 }, data: { label: 'AWS Bedrock', subtitle: 'Claude Prod', type: 'external' }, ...baseNodeStyle },
        ],
        edges: [
          // Frontend connections
          { id: 'e1', source: 'frontend-react', target: 'backend-api', animated: true },
          { id: 'e2', source: 'frontend-editor', target: 'frontend-stores' },
          { id: 'e3', source: 'frontend-chat', target: 'backend-claude', animated: true },
          { id: 'e4', source: 'frontend-preview', target: 'backend-bundler' },
          { id: 'e5', source: 'frontend-stores', target: 'backend-api' },

          // Backend connections
          { id: 'e6', source: 'backend-api', target: 'backend-providers' },
          { id: 'e7', source: 'backend-claude', target: 'external-anthropic', label: 'Dev', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e8', source: 'backend-claude', target: 'external-bedrock', label: 'Prod', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e9', source: 'backend-providers', target: 'provider-local' },
          { id: 'e10', source: 'backend-providers', target: 'provider-firebase' },
          { id: 'e11', source: 'backend-providers', target: 'provider-aws' },

          // MCP connections
          { id: 'e12', source: 'mcp-provider', target: 'backend-providers' },
          { id: 'e13', source: 'mcp-ui', target: 'frontend-react' },

          // Infrastructure connections
          { id: 'e14', source: 'provider-aws', target: 'infra-monitoring' },
          { id: 'e15', source: 'backend-providers', target: 'infra-cache' },
        ]
      }

    case 'construct':
      return {
        nodes: [
          // Construct Hierarchy
          { id: 'construct-system', position: { x: 500, y: 50 }, data: { label: 'Construct System', subtitle: 'Self-Referential', type: 'construct' }, ...baseNodeStyle },
          { id: 'construct-l0', position: { x: 200, y: 200 }, data: { label: 'L0 Primitives', subtitle: 'Atomic Units', type: 'construct' }, ...baseNodeStyle },
          { id: 'construct-l1', position: { x: 500, y: 200 }, data: { label: 'L1 Configured', subtitle: 'Configured L0s', type: 'construct' }, ...baseNodeStyle },
          { id: 'construct-l2', position: { x: 800, y: 200 }, data: { label: 'L2 Patterns', subtitle: 'Common Patterns', type: 'construct' }, ...baseNodeStyle },
          { id: 'construct-l3', position: { x: 1100, y: 200 }, data: { label: 'L3 Applications', subtitle: 'Complete Features', type: 'construct' }, ...baseNodeStyle },

          // L0 Examples
          { id: 'l0-editor', position: { x: 100, y: 350 }, data: { label: 'CodeEditorPrimitive', subtitle: 'L0 UI', type: 'construct' }, ...baseNodeStyle },
          { id: 'l0-chat', position: { x: 100, y: 450 }, data: { label: 'ChatMessagePrimitive', subtitle: 'L0 UI', type: 'construct' }, ...baseNodeStyle },
          { id: 'l0-button', position: { x: 300, y: 350 }, data: { label: 'ButtonPrimitive', subtitle: 'L0 UI', type: 'construct' }, ...baseNodeStyle },

          // L1 Examples
          { id: 'l1-editor', position: { x: 400, y: 350 }, data: { label: 'ConfiguredEditor', subtitle: 'L1 Component', type: 'construct' }, ...baseNodeStyle },
          { id: 'l1-chat', position: { x: 400, y: 450 }, data: { label: 'ChatPanel', subtitle: 'L1 Component', type: 'construct' }, ...baseNodeStyle },
          { id: 'l1-button', position: { x: 600, y: 350 }, data: { label: 'ThemedButton', subtitle: 'L1 Component', type: 'construct' }, ...baseNodeStyle },

          // L2 Examples
          { id: 'l2-editor', position: { x: 700, y: 350 }, data: { label: 'EditorWithToolbar', subtitle: 'L2 Pattern', type: 'construct' }, ...baseNodeStyle },
          { id: 'l2-chat', position: { x: 700, y: 450 }, data: { label: 'ChatWithHistory', subtitle: 'L2 Pattern', type: 'construct' }, ...baseNodeStyle },
          { id: 'l2-form', position: { x: 900, y: 350 }, data: { label: 'FormBuilder', subtitle: 'L2 Pattern', type: 'construct' }, ...baseNodeStyle },

          // L3 Examples
          { id: 'l3-workspace', position: { x: 1000, y: 350 }, data: { label: 'IDEWorkspace', subtitle: 'L3 Application', type: 'construct' }, ...baseNodeStyle },
          { id: 'l3-collab', position: { x: 1000, y: 450 }, data: { label: 'CollaborativeEditor', subtitle: 'L3 Application', type: 'construct' }, ...baseNodeStyle },
          { id: 'l3-dashboard', position: { x: 1200, y: 350 }, data: { label: 'ProjectDashboard', subtitle: 'L3 Application', type: 'construct' }, ...baseNodeStyle },

          // MCP Integration
          { id: 'mcp-construct', position: { x: 500, y: 550 }, data: { label: 'MCP Construct Server', subtitle: 'Construct Automation', type: 'mcp' }, ...baseNodeStyle },
        ],
        edges: [
          // Hierarchy connections
          { id: 'c1', source: 'construct-system', target: 'construct-l0', label: 'manages' },
          { id: 'c2', source: 'construct-system', target: 'construct-l1', label: 'manages' },
          { id: 'c3', source: 'construct-system', target: 'construct-l2', label: 'manages' },
          { id: 'c4', source: 'construct-system', target: 'construct-l3', label: 'manages' },

          // Level progression
          { id: 'c5', source: 'construct-l0', target: 'construct-l1', animated: true, style: { stroke: '#10b981' } },
          { id: 'c6', source: 'construct-l1', target: 'construct-l2', animated: true, style: { stroke: '#10b981' } },
          { id: 'c7', source: 'construct-l2', target: 'construct-l3', animated: true, style: { stroke: '#10b981' } },

          // L0 to L1 examples
          { id: 'c8', source: 'l0-editor', target: 'l1-editor', style: { strokeDasharray: '5,5' } },
          { id: 'c9', source: 'l0-chat', target: 'l1-chat', style: { strokeDasharray: '5,5' } },
          { id: 'c10', source: 'l0-button', target: 'l1-button', style: { strokeDasharray: '5,5' } },

          // L1 to L2 examples
          { id: 'c11', source: 'l1-editor', target: 'l2-editor', style: { strokeDasharray: '5,5' } },
          { id: 'c12', source: 'l1-chat', target: 'l2-chat', style: { strokeDasharray: '5,5' } },
          { id: 'c13', source: 'l1-button', target: 'l2-form', style: { strokeDasharray: '5,5' } },

          // L2 to L3 examples
          { id: 'c14', source: 'l2-editor', target: 'l3-workspace', style: { strokeDasharray: '5,5' } },
          { id: 'c15', source: 'l2-chat', target: 'l3-collab', style: { strokeDasharray: '5,5' } },
          { id: 'c16', source: 'l2-form', target: 'l3-dashboard', style: { strokeDasharray: '5,5' } },

          // MCP connection
          { id: 'c17', source: 'mcp-construct', target: 'construct-system', animated: true },
        ]
      }

    case 'dataflow':
      return {
        nodes: [
          // User Entry Points
          { id: 'user', position: { x: 50, y: 300 }, data: { label: 'User', subtitle: 'Developer', type: 'external' }, ...baseNodeStyle },
          
          // Frontend Flow
          { id: 'ui-chat', position: { x: 250, y: 200 }, data: { label: 'Chat UI', subtitle: 'User Input', type: 'frontend' }, ...baseNodeStyle },
          { id: 'ui-editor', position: { x: 250, y: 400 }, data: { label: 'Editor UI', subtitle: 'Code Editing', type: 'frontend' }, ...baseNodeStyle },
          
          // API Gateway
          { id: 'api-gateway', position: { x: 450, y: 300 }, data: { label: 'API Gateway', subtitle: 'Request Router', type: 'backend' }, ...baseNodeStyle },
          
          // Services
          { id: 'claude-service', position: { x: 650, y: 200 }, data: { label: 'Claude Service', subtitle: 'AI Processing', type: 'backend' }, ...baseNodeStyle },
          { id: 'file-service', position: { x: 650, y: 400 }, data: { label: 'File Service', subtitle: 'File Operations', type: 'backend' }, ...baseNodeStyle },
          
          // Data Storage
          { id: 'database', position: { x: 850, y: 300 }, data: { label: 'Database', subtitle: 'Data Persistence', type: 'infrastructure' }, ...baseNodeStyle },
          { id: 'file-storage', position: { x: 850, y: 400 }, data: { label: 'File Storage', subtitle: 'Code Storage', type: 'infrastructure' }, ...baseNodeStyle },
          
          // External Services
          { id: 'claude-api', position: { x: 850, y: 100 }, data: { label: 'Claude API', subtitle: 'AI Models', type: 'external' }, ...baseNodeStyle },
          
          // Response Flow
          { id: 'preview', position: { x: 450, y: 500 }, data: { label: 'Preview Service', subtitle: 'Code Execution', type: 'backend' }, ...baseNodeStyle },
          { id: 'ui-preview', position: { x: 250, y: 500 }, data: { label: 'Preview UI', subtitle: 'Live Preview', type: 'frontend' }, ...baseNodeStyle },
        ],
        edges: [
          // User interactions
          { id: 'd1', source: 'user', target: 'ui-chat', label: 'Chat', animated: true },
          { id: 'd2', source: 'user', target: 'ui-editor', label: 'Edit Code', animated: true },
          
          // Frontend to Backend
          { id: 'd3', source: 'ui-chat', target: 'api-gateway', label: 'API Request' },
          { id: 'd4', source: 'ui-editor', target: 'api-gateway', label: 'Save File' },
          
          // API routing
          { id: 'd5', source: 'api-gateway', target: 'claude-service', label: 'AI Request' },
          { id: 'd6', source: 'api-gateway', target: 'file-service', label: 'File Op' },
          
          // Service to storage
          { id: 'd7', source: 'claude-service', target: 'claude-api', label: 'Generate', animated: true },
          { id: 'd8', source: 'claude-service', target: 'database', label: 'Save Context' },
          { id: 'd9', source: 'file-service', target: 'file-storage', label: 'Store Files' },
          { id: 'd10', source: 'file-service', target: 'database', label: 'Metadata' },
          
          // Preview flow
          { id: 'd11', source: 'api-gateway', target: 'preview', label: 'Bundle Code' },
          { id: 'd12', source: 'preview', target: 'ui-preview', label: 'Render', animated: true },
          { id: 'd13', source: 'preview', target: 'file-storage', label: 'Load Files' },
          
          // Response flows
          { id: 'd14', source: 'claude-api', target: 'claude-service', label: 'Response', style: { strokeDasharray: '5,5' } },
          { id: 'd15', source: 'database', target: 'api-gateway', label: 'Data', style: { strokeDasharray: '5,5' } },
        ]
      }

    case 'deployment':
      return {
        nodes: [
          // Development
          { id: 'dev-local', position: { x: 100, y: 200 }, data: { label: 'Local Dev', subtitle: 'Docker Compose', type: 'infrastructure' }, ...baseNodeStyle },
          { id: 'dev-emulators', position: { x: 100, y: 300 }, data: { label: 'Emulators', subtitle: 'Firebase/LocalStack', type: 'infrastructure' }, ...baseNodeStyle },
          
          // CI/CD
          { id: 'github', position: { x: 300, y: 100 }, data: { label: 'GitHub', subtitle: 'Source Control', type: 'external' }, ...baseNodeStyle },
          { id: 'github-actions', position: { x: 500, y: 100 }, data: { label: 'GitHub Actions', subtitle: 'CI/CD Pipeline', type: 'infrastructure' }, ...baseNodeStyle },
          
          // Container Registry
          { id: 'docker-hub', position: { x: 700, y: 100 }, data: { label: 'Docker Hub', subtitle: 'Container Registry', type: 'external' }, ...baseNodeStyle },
          
          // Cloud Providers
          { id: 'aws-dev', position: { x: 500, y: 300 }, data: { label: 'AWS Dev', subtitle: 'Development Env', type: 'provider' }, ...baseNodeStyle },
          { id: 'aws-staging', position: { x: 700, y: 300 }, data: { label: 'AWS Staging', subtitle: 'Staging Env', type: 'provider' }, ...baseNodeStyle },
          { id: 'aws-prod', position: { x: 900, y: 300 }, data: { label: 'AWS Production', subtitle: 'Production Env', type: 'provider' }, ...baseNodeStyle },
          
          // Infrastructure Components
          { id: 'cdn', position: { x: 900, y: 450 }, data: { label: 'CloudFront CDN', subtitle: 'Content Delivery', type: 'infrastructure' }, ...baseNodeStyle },
          { id: 'load-balancer', position: { x: 700, y: 450 }, data: { label: 'Load Balancer', subtitle: 'ALB', type: 'infrastructure' }, ...baseNodeStyle },
          { id: 'monitoring', position: { x: 500, y: 450 }, data: { label: 'Monitoring', subtitle: 'CloudWatch', type: 'infrastructure' }, ...baseNodeStyle },
          
          // Firebase Option
          { id: 'firebase-prod', position: { x: 900, y: 200 }, data: { label: 'Firebase', subtitle: 'Alternative Deploy', type: 'provider' }, ...baseNodeStyle },
        ],
        edges: [
          // Development flow
          { id: 'dep1', source: 'dev-local', target: 'github', label: 'Push Code' },
          { id: 'dep2', source: 'github', target: 'github-actions', label: 'Trigger Build', animated: true },
          { id: 'dep3', source: 'github-actions', target: 'docker-hub', label: 'Push Images' },
          
          // Deployment flow
          { id: 'dep4', source: 'docker-hub', target: 'aws-dev', label: 'Deploy Dev' },
          { id: 'dep5', source: 'aws-dev', target: 'aws-staging', label: 'Promote', style: { strokeDasharray: '5,5' } },
          { id: 'dep6', source: 'aws-staging', target: 'aws-prod', label: 'Promote', style: { strokeDasharray: '5,5' } },
          
          // Alternative deployment
          { id: 'dep7', source: 'github-actions', target: 'firebase-prod', label: 'Direct Deploy', style: { stroke: '#f59e0b' } },
          
          // Infrastructure connections
          { id: 'dep8', source: 'aws-prod', target: 'cdn' },
          { id: 'dep9', source: 'aws-prod', target: 'load-balancer' },
          { id: 'dep10', source: 'aws-prod', target: 'monitoring' },
          
          // Monitoring feedback
          { id: 'dep11', source: 'monitoring', target: 'github-actions', label: 'Alerts', style: { strokeDasharray: '5,5', stroke: '#ef4444' } },
        ]
      }

    default:
      return { nodes: [], edges: [] }
  }
}

const PlatformArchitectureDiagramContent = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('technical')
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetails | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  // Get nodes and edges based on view mode
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getNodesAndEdges(viewMode),
    [viewMode]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes and edges when view mode changes
  React.useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setTimeout(() => fitView({ padding: 0.1, duration: 800 }), 100)
  }, [viewMode, initialNodes, initialEdges, setNodes, setEdges, fitView])

  // Handle node click
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const details = componentDetails[node.id]
    if (details) {
      setSelectedComponent(details)
    }
  }, [])

  // Filter nodes based on search
  React.useEffect(() => {
    if (!searchQuery) {
      setNodes(initialNodes)
      return
    }

    const filtered = initialNodes.map(node => ({
      ...node,
      hidden: !node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !(node.data.subtitle && node.data.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
    }))
    setNodes(filtered)
  }, [searchQuery, initialNodes, setNodes])

  // Export diagram
  const exportDiagram = useCallback(() => {
    const svg = document.querySelector('.react-flow__viewport')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `love-claude-code-architecture-${viewMode}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [viewMode])

  const nodeTypes = useMemo(() => ({
    default: CustomNode
  }), [])

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'} bg-background`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-dot-pattern"
      >
        <Background />
        <Controls position="bottom-right" />
        <MiniMap 
          nodeColor={(node) => {
            const type = node.data?.type as ComponentType
            switch (type) {
              case 'frontend': return '#3b82f6'
              case 'backend': return '#10b981'
              case 'provider': return '#8b5cf6'
              case 'mcp': return '#f97316'
              case 'infrastructure': return '#ef4444'
              case 'external': return '#6b7280'
              case 'construct': return '#eab308'
              default: return '#6b7280'
            }
          }}
          className="!bg-background/90 !border-border"
        />
        
        {/* Control Panel */}
        <Panel position="top-left" className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 space-y-4 shadow-lg">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">View Mode</h3>
            <div className="flex flex-col gap-1">
              {[
                { value: 'technical', label: 'Technical Architecture', icon: FiServer },
                { value: 'construct', label: 'Construct Hierarchy', icon: FiLayers },
                { value: 'dataflow', label: 'Data Flow', icon: FiGitBranch },
                { value: 'deployment', label: 'Deployment', icon: FiDatabase },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value as ViewMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    viewMode === value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Search</h3>
            <div className="relative">
              <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Actions</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => fitView({ padding: 0.1, duration: 800 })}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                <FiHome className="w-4 h-4" />
                Fit View
              </button>
              <button
                onClick={() => zoomIn()}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                <FiZoomIn className="w-4 h-4" />
                Zoom In
              </button>
              <button
                onClick={() => zoomOut()}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                <FiZoomOut className="w-4 h-4" />
                Zoom Out
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                {isFullscreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              <button
                onClick={exportDiagram}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Export SVG
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Legend</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Frontend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Backend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span>Provider</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span>MCP Server</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span>Construct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded" />
                <span>External</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Info Panel */}
        <Panel position="top-right" className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <FiInfo className="w-4 h-4" />
            <span>Click any component for details</span>
          </div>
        </Panel>
      </ReactFlow>

      {/* Component Details Modal */}
      <ComponentDetailsModal
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
      />
    </div>
  )
}

const PlatformArchitectureDiagram = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="h-[calc(100vh-64px)]">
        <ReactFlowProvider>
          <PlatformArchitectureDiagramContent />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

export default PlatformArchitectureDiagram