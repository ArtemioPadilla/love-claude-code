import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, Check, Clock, PlayCircle, Zap, Shield, 
  Globe, Code2, Database, Users, GitBranch, 
  ChevronRight, Calendar, Target, Sparkles,
  Cloud, Lock, Terminal, Layers, Brain, Package,
  ArrowLeft
} from 'lucide-react'
import { useNavigationStore } from '../Navigation'
import Footer from '../Layout/Footer'

interface RoadmapItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'in-progress' | 'planned'
  quarter: string
  category: 'core' | 'providers' | 'ai' | 'security' | 'deployment' | 'community'
  features?: string[]
}

const Roadmap: React.FC = () => {
  const { navigate } = useNavigationStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const categories = [
    { id: 'all', label: 'All Features', icon: <Layers className="w-4 h-4" /> },
    { id: 'core', label: 'Core Platform', icon: <Code2 className="w-4 h-4" /> },
    { id: 'providers', label: 'Cloud Providers', icon: <Cloud className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Features', icon: <Brain className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'deployment', label: 'Deployment', icon: <Globe className="w-4 h-4" /> },
    { id: 'community', label: 'Community', icon: <Users className="w-4 h-4" /> }
  ]
  
  const roadmapItems: RoadmapItem[] = [
    // Q4 2024 - Current
    {
      id: 'mcp-integration',
      title: 'Model Context Protocol Integration',
      description: 'Enable Claude to interact with UI and manage providers',
      icon: <Terminal className="w-6 h-6" />,
      status: 'completed',
      quarter: 'Q4 2024',
      category: 'ai',
      features: [
        'MCP UI Testing Server',
        'Provider Management Tools',
        'Automated UI Interaction'
      ]
    },
    {
      id: 'multi-provider',
      title: 'Multi-Provider Architecture',
      description: 'Support for Local, Firebase, and AWS backends',
      icon: <Cloud className="w-6 h-6" />,
      status: 'completed',
      quarter: 'Q4 2024',
      category: 'providers',
      features: [
        'Provider Abstraction Layer',
        'Seamless Provider Switching',
        'Unified API Interface'
      ]
    },
    {
      id: 'project-templates',
      title: 'Project Template System',
      description: 'Pre-built templates for common project types',
      icon: <Package className="w-6 h-6" />,
      status: 'completed',
      quarter: 'Q4 2024',
      category: 'core',
      features: [
        'React, Node.js, Python Templates',
        'AI Chatbot Template',
        'Full-Stack Applications'
      ]
    },
    
    // Q1 2025 - In Progress
    {
      id: 'collaborative-editing',
      title: 'Real-Time Collaboration',
      description: 'Multiple users can edit projects simultaneously',
      icon: <Users className="w-6 h-6" />,
      status: 'in-progress',
      quarter: 'Q1 2025',
      category: 'core',
      features: [
        'Live Cursor Tracking',
        'Conflict Resolution',
        'Team Workspaces'
      ]
    },
    {
      id: 'claude-plugins',
      title: 'Claude AI Plugins',
      description: 'Extend Claude with custom capabilities',
      icon: <Sparkles className="w-6 h-6" />,
      status: 'in-progress',
      quarter: 'Q1 2025',
      category: 'ai',
      features: [
        'Plugin Marketplace',
        'Custom Tool Integration',
        'AI Skill Extensions'
      ]
    },
    {
      id: 'edge-deployment',
      title: 'Edge Deployment Support',
      description: 'Deploy to Cloudflare Workers, Vercel Edge',
      icon: <Zap className="w-6 h-6" />,
      status: 'in-progress',
      quarter: 'Q1 2025',
      category: 'deployment',
      features: [
        'Edge Function Templates',
        'Automatic Optimization',
        'Global CDN Integration'
      ]
    },
    
    // Q2 2025 - Planned
    {
      id: 'visual-editor',
      title: 'Visual UI Builder',
      description: 'Drag-and-drop interface builder with AI assistance',
      icon: <Layers className="w-6 h-6" />,
      status: 'planned',
      quarter: 'Q2 2025',
      category: 'core',
      features: [
        'Component Library',
        'Visual State Management',
        'Responsive Design Tools'
      ]
    },
    {
      id: 'gcp-azure',
      title: 'GCP & Azure Providers',
      description: 'Expand multi-cloud support',
      icon: <Cloud className="w-6 h-6" />,
      status: 'planned',
      quarter: 'Q2 2025',
      category: 'providers',
      features: [
        'Google Cloud Platform',
        'Microsoft Azure',
        'Provider Migration Tools'
      ]
    },
    {
      id: 'enterprise-sso',
      title: 'Enterprise SSO & SAML',
      description: 'Enterprise-grade authentication',
      icon: <Lock className="w-6 h-6" />,
      status: 'planned',
      quarter: 'Q2 2025',
      category: 'security',
      features: [
        'SAML 2.0 Support',
        'Active Directory Integration',
        'Role-Based Access Control'
      ]
    },
    
    // Q3 2025 - Planned
    {
      id: 'mobile-support',
      title: 'Mobile App Development',
      description: 'Build and preview mobile apps with React Native',
      icon: <GitBranch className="w-6 h-6" />,
      status: 'planned',
      quarter: 'Q3 2025',
      category: 'core',
      features: [
        'React Native Templates',
        'Mobile Preview',
        'App Store Deployment'
      ]
    },
    {
      id: 'ai-testing',
      title: 'AI-Powered Testing',
      description: 'Automatic test generation and debugging',
      icon: <Brain className="w-6 h-6" />,
      status: 'planned',
      quarter: 'Q3 2025',
      category: 'ai',
      features: [
        'Test Case Generation',
        'Visual Regression Testing',
        'Performance Analysis'
      ]
    },
    {
      id: 'kubernetes',
      title: 'Kubernetes Integration',
      description: 'Deploy and manage K8s applications',
      icon: <Database className="w-6 h-6" />,
      status: 'planned',
      quarter: 'Q3 2025',
      category: 'deployment',
      features: [
        'Helm Chart Generation',
        'Cluster Management',
        'Auto-Scaling Config'
      ]
    }
  ]
  
  const filteredItems = selectedCategory === 'all' 
    ? roadmapItems 
    : roadmapItems.filter(item => item.category === selectedCategory)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'planned': return 'bg-gray-700/50 text-gray-400 border-gray-600'
      default: return 'bg-gray-700/50 text-gray-400 border-gray-600'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4" />
      case 'in-progress': return <PlayCircle className="w-4 h-4" />
      case 'planned': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('landing')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-500" />
                  Product Roadmap
                </h1>
                <p className="text-gray-400 mt-1">See what we're building next</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Last updated: December 2024</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Category Filter */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {['Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025'].map((quarter) => {
            const quarterItems = filteredItems.filter(item => item.quarter === quarter)
            if (quarterItems.length === 0) return null
            
            return (
              <div key={quarter}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  {quarter}
                  {quarter === 'Q4 2024' && (
                    <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quarterItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${
                          item.category === 'ai' ? 'from-purple-500/20 to-pink-500/20 text-purple-400' :
                          item.category === 'providers' ? 'from-blue-500/20 to-cyan-500/20 text-blue-400' :
                          item.category === 'security' ? 'from-orange-500/20 to-red-500/20 text-orange-400' :
                          item.category === 'deployment' ? 'from-green-500/20 to-emerald-500/20 text-green-400' :
                          item.category === 'community' ? 'from-indigo-500/20 to-purple-500/20 text-indigo-400' :
                          'from-gray-600/20 to-gray-700/20 text-gray-400'
                        }`}>
                          {item.icon}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status.replace('-', ' ')}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-gray-400 mb-4">{item.description}</p>
                      
                      {item.features && (
                        <ul className="space-y-1">
                          {item.features.map((feature) => (
                            <li key={feature} className="text-sm text-gray-500 flex items-center gap-2">
                              <ChevronRight className="w-3 h-3" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            We're building the future of AI-assisted development. Our goal is to make 
            coding accessible to everyone while empowering professional developers to 
            build faster and better than ever before.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6">
              <Rocket className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Innovation</h3>
              <p className="text-gray-400 text-sm">
                Pushing the boundaries of what's possible with AI and code generation
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Community</h3>
              <p className="text-gray-400 text-sm">
                Building with and for our community of developers worldwide
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trust</h3>
              <p className="text-gray-400 text-sm">
                Security and reliability at the core of everything we build
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-12 text-center border border-blue-700"
        >
          <h2 className="text-3xl font-bold mb-4">Want to Contribute?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Love Claude Code is open source. Help us shape the future of AI-powered development.
          </p>
          <div className="flex gap-4 justify-center">
            <motion.a
              href="https://github.com/love-claude-code/love-claude-code"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center gap-2"
            >
              <GitBranch className="w-5 h-5" />
              View on GitHub
            </motion.a>
            <motion.button
              onClick={() => navigate('docs')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold flex items-center gap-2"
            >
              Read the Docs
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Roadmap