import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Terminal, Code2, Play, Settings, Cloud, CheckCircle, Package } from 'lucide-react'
import { useNavigate } from '../../Navigation'

const GettingStarted: React.FC = () => {
  const navigate = useNavigate()
  
  const steps = [
    {
      icon: <Terminal className="w-8 h-8" />,
      title: 'Clone and Install',
      description: 'Get the code and install dependencies',
      code: `git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code
npm install`
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: 'Configure Environment',
      description: 'Set up your API keys and preferences',
      code: `cp .env.example .env.local
# Edit .env.local and add your Anthropic API key`
    },
    {
      icon: <Play className="w-8 h-8" />,
      title: 'Start Development',
      description: 'Launch the development server',
      code: `npm run dev
# Or use make for enhanced workflow
make dev`
    },
    {
      icon: <Code2 className="w-8 h-8" />,
      title: 'Start Building',
      description: 'Create your first project and start coding with Claude',
      code: `# Visit http://localhost:3000
# Click "Create New Project"
# Start chatting with Claude!`
    }
  ]

  const quickStartOptions = [
    {
      title: 'Local Development',
      icon: '💻',
      command: 'make dev-local',
      description: 'Zero configuration, perfect for learning'
    },
    {
      title: 'Firebase Backend',
      icon: '🔥',
      command: 'make dev-firebase',
      description: 'Real-time sync and authentication'
    },
    {
      title: 'AWS Backend',
      icon: '☁️',
      command: 'make dev-aws',
      description: 'Enterprise-scale infrastructure'
    }
  ]

  const newFeatures = [
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Desktop App',
      description: 'Native desktop experience with system integration',
      link: '#desktop-app'
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Construct Development',
      description: 'Build reusable components with ConstructBuilder IDE',
      link: '#construct-builder'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Visual Composer',
      description: 'Create constructs visually with drag-and-drop',
      link: '#visual-composer'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Enterprise Features',
      description: 'SSO, RBAC, audit logs, and compliance',
      link: '#enterprise'
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
          <Rocket className="w-10 h-10 text-blue-500" />
          Getting Started
        </h1>
        <p className="text-xl text-gray-400">
          Get up and running with Love Claude Code in just a few minutes. Choose your preferred backend and start building!
        </p>
      </motion.div>

      {/* Prerequisites */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Node.js 20+ and npm 10+</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Git for version control</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Anthropic API key (for Claude)</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>VS Code or similar editor (optional)</span>
          </div>
        </div>
      </motion.div>

      {/* Installation Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Installation Steps</h2>
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  Step {index + 1}: {step.title}
                </h3>
                <p className="text-gray-400 mb-4">{step.description}</p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{step.code}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Start Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Cloud className="w-6 h-6 text-purple-500" />
          Quick Start by Provider
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quickStartOptions.map((option) => (
            <div key={option.title} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
              <div className="text-3xl mb-3">{option.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
              <p className="text-gray-400 mb-4">{option.description}</p>
              <pre className="bg-gray-900 rounded-lg p-3">
                <code className="text-sm text-green-400">{option.command}</code>
              </pre>
            </div>
          ))}
        </div>
      </motion.div>

      {/* New Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold">What's New in Love Claude Code</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {newFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors cursor-pointer"
              onClick={() => window.location.hash = feature.link}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-700"
      >
        <h2 className="text-2xl font-semibold mb-4">Your Learning Path</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <strong className="text-gray-200">Start with a project:</strong>
              <p className="text-gray-400 text-sm mt-1">Create your first project and explore the AI-powered editor</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <strong className="text-gray-200">Learn constructs:</strong>
              <p className="text-gray-400 text-sm mt-1">
                <button onClick={() => navigate('constructs')} className="text-purple-400 hover:text-purple-300 underline">
                  Browse the construct catalog
                </button> to understand the building blocks
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <strong className="text-gray-200">Build your own:</strong>
              <p className="text-gray-400 text-sm mt-1">Use ConstructBuilder IDE to create reusable components</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">4️⃣</span>
            <div>
              <strong className="text-gray-200">Share with community:</strong>
              <p className="text-gray-400 text-sm mt-1">Publish your constructs to the marketplace</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">5️⃣</span>
            <div>
              <strong className="text-gray-200">Scale with enterprise:</strong>
              <p className="text-gray-400 text-sm mt-1">Deploy on-premise or use enterprise features for teams</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-blue-600/50">
          <p className="text-gray-300 text-sm">
            <strong>Need help?</strong> Join our{' '}
            <a href="#community" className="text-purple-400 hover:text-purple-300 underline">community forum</a>{' '}
            or check the{' '}
            <a href="#troubleshooting" className="text-purple-400 hover:text-purple-300 underline">troubleshooting guide</a>.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default GettingStarted