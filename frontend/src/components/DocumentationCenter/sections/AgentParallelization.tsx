import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  GitBranch, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Code,
  FileText,
  Shield,
  Activity,
  Briefcase,
  MessageSquare,
  Globe,
  BarChart3,
  Layers
} from 'lucide-react'

const AgentParallelization: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'workflow' | 'metrics'>('overview')

  const agentTeams = [
    {
      name: 'MCP Infrastructure',
      icon: <Layers className="w-5 h-5" />,
      focus: 'L1/L2 MCP components',
      status: 'active',
      current: 'authenticated-tool-registry',
      color: 'blue'
    },
    {
      name: 'UI Primitives',
      icon: <Code className="w-5 h-5" />,
      focus: 'Diagram visualization',
      status: 'active',
      current: 'node & edge primitives',
      color: 'purple'
    },
    {
      name: 'External Integration',
      icon: <Globe className="w-5 h-5" />,
      focus: 'NPM/Docker/API wrappers',
      status: 'active',
      current: 'external-construct-primitive',
      color: 'green'
    },
    {
      name: 'Documentation',
      icon: <FileText className="w-5 h-5" />,
      focus: 'Markdown + website sync',
      status: 'continuous',
      current: 'All features',
      color: 'yellow'
    },
    {
      name: 'Testing',
      icon: <CheckCircle className="w-5 h-5" />,
      focus: 'Test suite implementation',
      status: 'continuous',
      current: 'Unit/Integration/E2E',
      color: 'red'
    },
    {
      name: 'Security',
      icon: <Shield className="w-5 h-5" />,
      focus: 'Security layers',
      status: 'active',
      current: 'L0 security updates',
      color: 'orange'
    },
    {
      name: 'Performance',
      icon: <Activity className="w-5 h-5" />,
      focus: 'Monitoring & optimization',
      status: 'continuous',
      current: 'Metrics collection',
      color: 'cyan'
    },
    {
      name: 'UX/Workflow',
      icon: <Briefcase className="w-5 h-5" />,
      focus: 'Construct creation UI',
      status: 'active',
      current: 'Project creation dialog',
      color: 'pink'
    }
  ]

  const workflowSteps = [
    {
      title: 'Daily Sync',
      duration: '15 minutes',
      activities: [
        'Progress update (2 min/agent)',
        'Blockers identification',
        'Integration dependencies',
        'Next 24h plan'
      ]
    },
    {
      title: 'Weekly Integration',
      duration: '2 hours',
      activities: [
        'Code review and merge',
        'Integration testing',
        'Documentation review',
        'Demo preparation'
      ]
    },
    {
      title: 'Sprint Review',
      duration: '1 hour',
      activities: [
        'Feature demonstration',
        'Metrics review',
        'Retrospective',
        'Next sprint planning'
      ]
    }
  ]

  const metrics = [
    { label: 'Story Points/Sprint', value: '40-50', trend: 'up' },
    { label: 'Code Coverage', value: '>95%', trend: 'stable' },
    { label: 'Build Success', value: '98%', trend: 'up' },
    { label: 'Integration Time', value: '<2hr', trend: 'down' }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Agent Parallelization Strategy</h1>
        <p className="text-gray-300 text-lg">
          Accelerate development with 12 specialized agent teams working in parallel
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-6 mb-8 border-b border-gray-800">
        {(['overview', 'agents', 'workflow', 'metrics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 capitalize font-medium transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <Zap className="w-8 h-8 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">10-12x Velocity</h3>
                <p className="text-gray-400">
                  Parallel development across specialized teams dramatically increases output
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <GitBranch className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Clean Integration</h3>
                <p className="text-gray-400">
                  Well-defined interfaces and regular sync points prevent conflicts
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <Users className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Specialized Skills</h3>
                <p className="text-gray-400">
                  Each agent focuses on their expertise for higher quality output
                </p>
              </div>
            </div>

            {/* Implementation Timeline */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Implementation Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-400">Week 1-2</div>
                  <div className="flex-1 bg-blue-500/20 rounded-lg p-3">
                    <div className="font-medium">Foundation Sprint</div>
                    <div className="text-sm text-gray-400">L1 components, primitives, integration setup</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-400">Week 3-4</div>
                  <div className="flex-1 bg-green-500/20 rounded-lg p-3">
                    <div className="font-medium">Integration Sprint</div>
                    <div className="text-sm text-gray-400">Component integration, testing, documentation</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-400">Week 5-6</div>
                  <div className="flex-1 bg-purple-500/20 rounded-lg p-3">
                    <div className="font-medium">Enhancement Sprint</div>
                    <div className="text-sm text-gray-400">Advanced features, optimization, polish</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agentTeams.map((agent) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${agent.color}-500/20`}>
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name} Agent</h3>
                      <p className="text-sm text-gray-400">{agent.focus}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    agent.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Current: </span>
                  <span className="text-white">{agent.current}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-8">
            {/* Communication Protocol */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workflowSteps.map((step, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{step.title}</h3>
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {step.duration}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {step.activities.map((activity, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Integration Flow */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Integration Flow</h3>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-sm">Agent Work</div>
                </div>
                <div className="flex-1 h-0.5 bg-gray-700 mx-4" />
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <GitBranch className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="text-sm">Daily Sync</div>
                </div>
                <div className="flex-1 h-0.5 bg-gray-700 mx-4" />
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                    <MessageSquare className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="text-sm">Integration</div>
                </div>
                <div className="flex-1 h-0.5 bg-gray-700 mx-4" />
                <div className="text-center">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-2">
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-sm">Release</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm text-gray-400">{metric.label}</h4>
                    {metric.trend === 'up' && <AlertCircle className="w-4 h-4 text-green-500" />}
                    {metric.trend === 'down' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                    {metric.trend === 'stable' && <AlertCircle className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </div>
              ))}
            </div>

            {/* Quality Standards */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quality Standards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Code Quality</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      TypeScript strict mode
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      ESLint + Prettier compliance
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Comprehensive error handling
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Testing Standards</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Unit tests: &gt;95% coverage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Integration tests: Critical paths
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Performance tests: &lt;100ms
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Indicators */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Success Indicators</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span>Features per sprint</span>
                  <span className="font-mono text-green-400">15-20</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span>Merge conflict rate</span>
                  <span className="font-mono text-green-400">&lt;5%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span>Rollback rate</span>
                  <span className="font-mono text-green-400">&lt;1%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span>Documentation coverage</span>
                  <span className="font-mono text-green-400">100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AgentParallelization