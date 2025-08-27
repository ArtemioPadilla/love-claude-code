import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, 
  Layers, 
  Sparkles, 
  Network, 
  GitBranch,
  Cpu,
  Boxes,
  Activity,
  MessageSquare,
  FileCode,
  TestTube,
  Book,
  Package,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Repeat
} from 'lucide-react'
import { useNavigate } from '../Navigation'
import ReactFlow, { Node, Edge, Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Timeline data
const timelineData = [
  {
    id: 1,
    date: 'January 2025',
    title: 'Foundation Established',
    description: 'Core platform architecture designed with self-referential principles',
    constructs: ['BaseConstruct', 'L0Construct'],
    icon: <Layers className="w-4 h-4" />
  },
  {
    id: 2,
    date: 'January 2025',
    title: 'First L0 Primitives',
    description: 'CodeEditorPrimitive and ChatMessagePrimitive created',
    constructs: ['CodeEditorPrimitive', 'ChatMessagePrimitive'],
    icon: <Boxes className="w-4 h-4" />
  },
  {
    id: 3,
    date: 'January 2025',
    title: 'Construct Catalog Built',
    description: 'Catalog system built using its own constructs',
    constructs: ['ConstructCatalog', 'ConstructExplorer', 'ConstructDetails'],
    icon: <Package className="w-4 h-4" />
  },
  {
    id: 4,
    date: 'January 2025',
    title: 'MCP Integration',
    description: 'MCP server built using MCP patterns',
    constructs: ['MCPServer', 'MCPProvider', 'MCPTools'],
    icon: <Network className="w-4 h-4" />
  },
  {
    id: 5,
    date: 'February 2025',
    title: 'TDD Infrastructure',
    description: 'Testing system that tests itself',
    constructs: ['TDDWorkflow', 'TestRunner', 'CoverageAnalyzer'],
    icon: <TestTube className="w-4 h-4" />
  }
]

// Statistics data
const statsData = [
  { label: 'Total Constructs', value: 47, icon: <Package className="w-5 h-5" />, trend: '+12%' },
  { label: 'Vibe-Coded', value: '68%', icon: <Sparkles className="w-5 h-5" />, trend: '+8%' },
  { label: 'Reuse Rate', value: '89%', icon: <Repeat className="w-5 h-5" />, trend: '+15%' },
  { label: 'Dev Velocity', value: '3.2x', icon: <TrendingUp className="w-5 h-5" />, trend: '+0.5x' }
]

// Evolution chart data
const evolutionData = [
  { month: 'Jan', manual: 100, vibe: 0, hybrid: 0 },
  { month: 'Feb', manual: 60, vibe: 30, hybrid: 10 },
  { month: 'Mar', manual: 40, vibe: 45, hybrid: 15 },
  { month: 'Apr', manual: 32, vibe: 52, hybrid: 16 },
  { month: 'May', manual: 28, vibe: 58, hybrid: 14 },
  { month: 'Jun', manual: 25, vibe: 62, hybrid: 13 },
  { month: 'Jul', manual: 22, vibe: 68, hybrid: 10 }
]

// Construct dependency graph nodes
const dependencyNodes: Node[] = [
  {
    id: 'platform',
    position: { x: 400, y: 50 },
    data: { 
      label: 'Love Claude Code Platform',
      icon: <Code2 className="w-4 h-4" />
    },
    type: 'custom',
    className: 'bg-gradient-to-br from-blue-500 to-purple-600'
  },
  {
    id: 'l3-app',
    position: { x: 400, y: 150 },
    data: { 
      label: 'L3: Application Constructs',
      icon: <Layers className="w-4 h-4" />
    },
    type: 'custom'
  },
  {
    id: 'l2-patterns',
    position: { x: 200, y: 250 },
    data: { 
      label: 'L2: Pattern Constructs',
      icon: <GitBranch className="w-4 h-4" />
    },
    type: 'custom'
  },
  {
    id: 'l1-configured',
    position: { x: 600, y: 250 },
    data: { 
      label: 'L1: Configured Constructs',
      icon: <Cpu className="w-4 h-4" />
    },
    type: 'custom'
  },
  {
    id: 'l0-primitives',
    position: { x: 400, y: 350 },
    data: { 
      label: 'L0: Primitive Constructs',
      icon: <Boxes className="w-4 h-4" />
    },
    type: 'custom'
  },
  {
    id: 'catalog',
    position: { x: 100, y: 450 },
    data: { 
      label: 'Construct Catalog',
      icon: <Package className="w-4 h-4" />
    },
    type: 'custom',
    className: 'bg-gradient-to-br from-green-500 to-teal-600'
  },
  {
    id: 'mcp',
    position: { x: 400, y: 450 },
    data: { 
      label: 'MCP Server',
      icon: <Network className="w-4 h-4" />
    },
    type: 'custom',
    className: 'bg-gradient-to-br from-orange-500 to-red-600'
  },
  {
    id: 'tdd',
    position: { x: 700, y: 450 },
    data: { 
      label: 'TDD System',
      icon: <TestTube className="w-4 h-4" />
    },
    type: 'custom',
    className: 'bg-gradient-to-br from-pink-500 to-rose-600'
  }
]

// Construct dependency edges
const dependencyEdges: Edge[] = [
  { id: 'e1', source: 'platform', target: 'l3-app', animated: true },
  { id: 'e2', source: 'l3-app', target: 'l2-patterns' },
  { id: 'e3', source: 'l3-app', target: 'l1-configured' },
  { id: 'e4', source: 'l2-patterns', target: 'l0-primitives' },
  { id: 'e5', source: 'l1-configured', target: 'l0-primitives' },
  { id: 'e6', source: 'l0-primitives', target: 'catalog', animated: true },
  { id: 'e7', source: 'l0-primitives', target: 'mcp', animated: true },
  { id: 'e8', source: 'l0-primitives', target: 'tdd', animated: true },
  { id: 'e9', source: 'catalog', target: 'platform', type: 'step', animated: true, className: 'stroke-green-500' },
  { id: 'e10', source: 'mcp', target: 'platform', type: 'step', animated: true, className: 'stroke-orange-500' },
  { id: 'e11', source: 'tdd', target: 'platform', type: 'step', animated: true, className: 'stroke-pink-500' }
]

// Case studies data
const caseStudies = [
  {
    id: 1,
    title: 'Construct Catalog',
    subtitle: 'Built with its own constructs',
    description: 'The construct catalog system was built using L0 and L1 constructs it would eventually showcase.',
    stats: {
      constructs: 12,
      vibePercent: 78,
      timeHours: 8
    },
    code: `// ConstructCatalog.tsx built with:
import { L1GridLayout } from '@/constructs/L1/GridLayout'
import { L0Card } from '@/constructs/L0/Card'
import { L0SearchInput } from '@/constructs/L0/SearchInput'

export const ConstructCatalog = () => {
  return (
    <L1GridLayout columns={3} gap={4}>
      {constructs.map(construct => (
        <L0Card key={construct.id}>
          <ConstructDetails construct={construct} />
        </L0Card>
      ))}
    </L1GridLayout>
  )
}`
  },
  {
    id: 2,
    title: 'MCP Provider Server',
    subtitle: 'Self-hosted infrastructure',
    description: 'The MCP server uses its own patterns to provide infrastructure management capabilities.',
    stats: {
      constructs: 8,
      vibePercent: 85,
      timeHours: 6
    },
    code: `// MCPServer.ts using MCP patterns:
import { MCPTool } from '@/constructs/L1/MCPTool'
import { MCPProvider } from '@/constructs/L2/MCPProvider'

export class MCPServer extends MCPProvider {
  tools = [
    new MCPTool({
      name: 'analyze_requirements',
      handler: this.analyzeRequirements
    }),
    new MCPTool({
      name: 'compare_providers',
      handler: this.compareProviders
    })
  ]
}`
  },
  {
    id: 3,
    title: 'Testing Infrastructure',
    subtitle: 'Tests that test themselves',
    description: 'The TDD system uses its own testing constructs to validate the testing framework.',
    stats: {
      constructs: 10,
      vibePercent: 72,
      timeHours: 10
    },
    code: `// SelfTestingFramework.ts:
import { L0TestRunner } from '@/constructs/L0/TestRunner'
import { L1TestSuite } from '@/constructs/L1/TestSuite'

export class SelfTestingFramework extends L1TestSuite {
  async selfTest() {
    const runner = new L0TestRunner()
    const results = await runner.test(this)
    
    // Framework tests itself!
    return this.validateResults(results)
  }
}`
  }
]

// Custom node component for ReactFlow
const CustomNode = ({ data }: any) => (
  <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
    <div className="flex items-center gap-2">
      {data.icon}
      <span className="text-sm font-medium text-gray-200">{data.label}</span>
    </div>
  </div>
)

const nodeTypes = {
  custom: CustomNode
}

const BuiltWithItselfShowcase: React.FC = () => {
  const navigate = useNavigate()
  const [selectedTimeline, setSelectedTimeline] = useState<number | null>(null)
  const [activeCase, setActiveCase] = useState(0)
  const [animationStep, setAnimationStep] = useState(0)

  // Auto-rotate case studies
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCase((prev) => (prev + 1) % caseStudies.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Animate the self-building visualization
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('landing')}
              className="flex items-center gap-3 group"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:shadow-lg transition-shadow">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold text-foreground">Love Claude Code</span>
                <span className="text-xs text-muted-foreground">Built with Itself</span>
              </div>
            </motion.button>

            <button
              onClick={() => navigate('constructs')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <span>Explore Constructs</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Self-Referential Architecture</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Built with Itself
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Love Claude Code is a revolutionary platform that builds itself using its own constructs. 
              Watch as the platform evolves, creating new features with the very tools it provides.
            </p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
              {statsData.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {stat.icon}
                    </div>
                    <span className="text-xs text-green-400">{stat.trend}</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Architecture Diagram */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Self-Building Architecture</h2>
            <p className="text-lg text-muted-foreground">
              Click on constructs to explore how they build the platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl p-8 h-[600px]"
          >
            <ReactFlow
              nodes={dependencyNodes}
              edges={dependencyEdges}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background rounded-lg"
            >
              <Background color="#333" gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </motion.div>
        </div>
      </section>

      {/* Evolution Timeline */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Platform Evolution Timeline</h2>
            <p className="text-lg text-muted-foreground">
              Watch how the platform evolved from manual coding to self-building
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Timeline */}
            <div className="space-y-4">
              {timelineData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTimeline(item.id)}
                  className={`
                    p-6 bg-card border rounded-xl cursor-pointer transition-all
                    ${selectedTimeline === item.id 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                      : 'border-border hover:border-blue-500/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <span className="text-sm text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.constructs.map((construct) => (
                          <span
                            key={construct}
                            className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md"
                          >
                            {construct}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Evolution Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Development Method Evolution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="manual"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Manual Coding"
                  />
                  <Area
                    type="monotone"
                    dataKey="hybrid"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Hybrid"
                  />
                  <Area
                    type="monotone"
                    dataKey="vibe"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Vibe-Coded"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Self-Referential Case Studies</h2>
            <p className="text-lg text-muted-foreground">
              Real examples of platform features built with their own constructs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveCase(index)}
                className={`
                  p-6 bg-card border rounded-xl cursor-pointer transition-all
                  ${activeCase === index 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'border-border hover:border-blue-500/50'
                  }
                `}
              >
                <h3 className="text-xl font-semibold mb-2">{study.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{study.subtitle}</p>
                <p className="text-sm mb-4">{study.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{study.stats.constructs}</div>
                    <div className="text-xs text-muted-foreground">Constructs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{study.stats.vibePercent}%</div>
                    <div className="text-xs text-muted-foreground">Vibe-Coded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{study.stats.timeHours}h</div>
                    <div className="text-xs text-muted-foreground">Dev Time</div>
                  </div>
                </div>

                <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  <span>View Code Example</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Code Example */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">{caseStudies[activeCase].title} - Code Example</h4>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">TypeScript</span>
                </div>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{caseStudies[activeCase].code}</code>
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Watch It Build Itself</h2>
            <p className="text-lg text-muted-foreground">
              Interactive visualization of self-referential development in action
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl p-8"
          >
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Animation */}
              <div className="relative h-[400px] bg-gray-900 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <AnimatePresence mode="wait">
                      {animationStep === 0 && (
                        <motion.div
                          key="step0"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="space-y-4"
                        >
                          <MessageSquare className="w-16 h-16 text-blue-400 mx-auto" />
                          <h3 className="text-xl font-semibold">Claude Conversation</h3>
                          <p className="text-sm text-muted-foreground">Developer describes desired construct</p>
                        </motion.div>
                      )}
                      {animationStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="space-y-4"
                        >
                          <Sparkles className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
                          <h3 className="text-xl font-semibold">AI Generation</h3>
                          <p className="text-sm text-muted-foreground">Claude generates construct specification</p>
                        </motion.div>
                      )}
                      {animationStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="space-y-4"
                        >
                          <TestTube className="w-16 h-16 text-green-400 mx-auto" />
                          <h3 className="text-xl font-semibold">TDD Validation</h3>
                          <p className="text-sm text-muted-foreground">Tests validate the implementation</p>
                        </motion.div>
                      )}
                      {animationStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="space-y-4"
                        >
                          <Package className="w-16 h-16 text-orange-400 mx-auto" />
                          <h3 className="text-xl font-semibold">Construct Ready</h3>
                          <p className="text-sm text-muted-foreground">New construct builds platform features</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`
                        h-1 flex-1 rounded-full transition-all duration-300
                        ${step === animationStep ? 'bg-blue-500' : 'bg-gray-700'}
                      `}
                    />
                  ))}
                </div>
              </div>

              {/* Live Metrics */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Live Platform Metrics</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Self-Building Score</span>
                      <span className="text-sm font-semibold">82%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '82%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Construct Reuse Rate</span>
                      <span className="text-sm font-semibold">89%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '89%' }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Development Velocity</span>
                      <span className="text-sm font-semibold">3.2x</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-blue-400">Real-time Activity</p>
                      <p className="text-xs text-muted-foreground">
                        Platform is currently building 3 new constructs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold">Join the Self-Referential Revolution</h2>
            <p className="text-lg text-muted-foreground">
              Experience the future of software development where platforms build themselves
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('constructs')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Explore Constructs
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('docs')}
                className="px-8 py-3 bg-card border border-border rounded-lg font-semibold hover:border-blue-500/50 transition-all"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default BuiltWithItselfShowcase