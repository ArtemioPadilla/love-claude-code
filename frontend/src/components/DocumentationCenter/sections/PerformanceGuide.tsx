import React from 'react'
import { motion } from 'framer-motion'
import { Gauge, Activity, TrendingUp, Clock, Zap, BarChart3, AlertTriangle, Database, Cpu } from 'lucide-react'

const PerformanceGuide: React.FC = () => {
  const performanceMetrics = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Response Time',
      description: 'API latency and frontend load times',
      target: '< 200ms p95',
      current: '156ms'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Throughput',
      description: 'Requests processed per second',
      target: '> 1000 RPS',
      current: '1,247 RPS'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: 'Availability',
      description: 'System uptime percentage',
      target: '99.9%',
      current: '99.97%'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Error Rate',
      description: 'Failed requests percentage',
      target: '< 0.1%',
      current: '0.03%'
    }
  ]

  const dashboardSections = [
    {
      section: 'Real-Time Monitoring',
      features: [
        'Live request tracking',
        'Active user sessions',
        'Resource utilization',
        'Error stream'
      ]
    },
    {
      section: 'Historical Analysis',
      features: [
        'Performance trends',
        'Usage patterns',
        'Peak load analysis',
        'Capacity planning'
      ]
    },
    {
      section: 'Alerts & Notifications',
      features: [
        'Threshold breaches',
        'Anomaly detection',
        'SLA violations',
        'Custom triggers'
      ]
    },
    {
      section: 'Optimization Insights',
      features: [
        'Slow query detection',
        'Memory leak analysis',
        'Code hotspots',
        'Dependency bottlenecks'
      ]
    }
  ]

  const optimizationStrategies = [
    {
      area: 'Frontend',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      techniques: [
        'Code splitting and lazy loading',
        'Image optimization and CDN',
        'Service worker caching',
        'Bundle size reduction'
      ]
    },
    {
      area: 'Backend',
      icon: <Cpu className="w-5 h-5 text-blue-400" />,
      techniques: [
        'Database query optimization',
        'Caching strategies',
        'Connection pooling',
        'Async processing'
      ]
    },
    {
      area: 'Infrastructure',
      icon: <Database className="w-5 h-5 text-green-400" />,
      techniques: [
        'Auto-scaling policies',
        'Load balancing',
        'Resource allocation',
        'Network optimization'
      ]
    },
    {
      area: 'Code',
      icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
      techniques: [
        'Algorithm optimization',
        'Memory management',
        'Concurrency patterns',
        'Profiling and benchmarking'
      ]
    }
  ]

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Gauge className="w-10 h-10 text-red-500" />
          Performance Monitoring Guide
        </h1>
        <p className="text-xl text-gray-400">
          Monitor, analyze, and optimize your Love Claude Code platform performance
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Performance Excellence</h2>
        <p className="text-gray-300 mb-4">
          The Performance Dashboard provides comprehensive insights into your platform's health and efficiency. 
          Monitor real-time metrics, analyze historical trends, and receive actionable recommendations to 
          ensure your Love Claude Code instance runs at peak performance.
        </p>
        <p className="text-gray-300">
          Whether you're optimizing for speed, scale, or reliability, our monitoring tools give you the 
          visibility and control needed to deliver an exceptional developer experience.
        </p>
      </motion.div>

      {/* Key Performance Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Key Performance Indicators</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {performanceMetrics.map((metric, _index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * _index }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                  {metric.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{metric.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{metric.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Target: {metric.target}</span>
                    <span className="text-lg font-mono text-green-400">{metric.current}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Dashboard Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">Dashboard Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {dashboardSections.map((section) => (
            <div key={section.section}>
              <h3 className="font-semibold mb-3 text-red-400">{section.section}</h3>
              <ul className="space-y-2">
                {section.features.map((feature, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Real-Time Monitoring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-400" />
          Real-Time Monitoring
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Live Metrics Stream</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-mono text-green-400">247</div>
                <div className="text-xs text-gray-400">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-blue-400">1,832</div>
                <div className="text-xs text-gray-400">Requests/min</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-yellow-400">73%</div>
                <div className="text-xs text-gray-400">CPU Usage</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-purple-400">4.2GB</div>
                <div className="text-xs text-gray-400">Memory Used</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Request Waterfall</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-2">
                <div className="w-32 text-gray-400">API Gateway</div>
                <div className="flex-1 bg-gray-700 rounded h-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-green-500 rounded" style={{width: '15%'}}></div>
                </div>
                <span className="text-gray-300">23ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-gray-400">Auth Service</div>
                <div className="flex-1 bg-gray-700 rounded h-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{width: '8%', marginLeft: '15%'}}></div>
                </div>
                <span className="text-gray-300">12ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-gray-400">Database</div>
                <div className="flex-1 bg-gray-700 rounded h-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-purple-500 rounded" style={{width: '45%', marginLeft: '23%'}}></div>
                </div>
                <span className="text-gray-300">68ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-gray-400">Response</div>
                <div className="flex-1 bg-gray-700 rounded h-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-orange-500 rounded" style={{width: '10%', marginLeft: '68%'}}></div>
                </div>
                <span className="text-gray-300">15ms</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Optimization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Optimization Strategies</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {optimizationStrategies.map((strategy, _index) => (
            <div key={strategy.area} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {strategy.icon}
                <h3 className="font-semibold">{strategy.area} Optimization</h3>
              </div>
              <ul className="space-y-2">
                {strategy.techniques.map((technique, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{technique}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alert Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          Alert Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Default Alert Rules</h3>
            <div className="space-y-3">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-red-400">High Response Time</h4>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Critical</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">Triggers when p95 latency exceeds 500ms for 5 minutes</p>
                <div className="text-xs text-gray-400">Actions: Email, Slack, PagerDuty</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-yellow-400">Memory Usage</h4>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Warning</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">Alerts when memory usage exceeds 80% for 10 minutes</p>
                <div className="text-xs text-gray-400">Actions: Email, Slack</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-blue-400">Error Rate Spike</h4>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Info</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">Detects when error rate increases by 50% from baseline</p>
                <div className="text-xs text-gray-400">Actions: Dashboard notification</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-gray-300">
              <strong>Custom Alerts:</strong> Create custom alert rules based on any metric combination 
              with complex conditions and custom notification channels.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Performance Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Performance Reports</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Automated Reports</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400 mt-1" />
                <div>
                  <div className="font-medium">Daily Summary</div>
                  <div className="text-sm text-gray-400">Key metrics and incidents from the last 24 hours</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-green-400 mt-1" />
                <div>
                  <div className="font-medium">Weekly Trends</div>
                  <div className="text-sm text-gray-400">Performance trends and capacity planning insights</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400 mt-1" />
                <div>
                  <div className="font-medium">Monthly Analysis</div>
                  <div className="text-sm text-gray-400">Comprehensive performance review and recommendations</div>
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Custom Dashboards</h3>
            <p className="text-gray-300 mb-3">
              Create personalized dashboards with drag-and-drop widgets:
            </p>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Time series graphs</li>
              <li>• Heatmaps and distributions</li>
              <li>• Top N lists and rankings</li>
              <li>• Real-time counters</li>
              <li>• Log stream viewers</li>
              <li>• Custom SQL queries</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl p-6 border border-red-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4">Performance Best Practices</h2>
        <div className="space-y-3 text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Set realistic baselines:</strong> Establish performance baselines during normal 
              operation to detect anomalies effectively
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Monitor end-to-end:</strong> Track performance from the user's browser through 
              to your backend services
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Correlate metrics:</strong> Look at multiple metrics together to understand 
              the full picture
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Proactive optimization:</strong> Address performance issues before they impact users
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Regular load testing:</strong> Simulate peak loads to identify bottlenecks early
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-3">
          <a href="#dashboard" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Open Performance Dashboard →
            </h3>
            <p className="text-gray-400 text-sm">Start monitoring your platform performance in real-time</p>
          </a>
          <a href="#optimization-guide" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Optimization Playbook →
            </h3>
            <p className="text-gray-400 text-sm">Detailed guides for improving specific performance areas</p>
          </a>
          <a href="#load-testing" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Load Testing Guide →
            </h3>
            <p className="text-gray-400 text-sm">Learn how to stress test your platform</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default PerformanceGuide