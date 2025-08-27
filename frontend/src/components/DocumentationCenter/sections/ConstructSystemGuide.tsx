import React from 'react'
import { motion } from 'framer-motion'
import { Layers, Box, Package, Rocket, Code2, GitBranch, Shield, Zap } from 'lucide-react'

const ConstructSystemGuide: React.FC = () => {
  const levels = [
    {
      level: 'L0',
      name: 'Primitives',
      icon: <Box className="w-6 h-6" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      description: 'Atomic building blocks with zero dependencies',
      examples: ['Button', 'Modal', 'WebSocket', 'Database Table'],
      characteristics: [
        'Zero external dependencies',
        'Single responsibility',
        'Minimal API surface',
        'No opinions or abstractions'
      ]
    },
    {
      level: 'L1',
      name: 'Configured Components',
      icon: <Package className="w-6 h-6" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      description: 'Primitives with sensible defaults and enhanced functionality',
      examples: ['Secure Code Editor', 'Authenticated WebSocket', 'Managed Container'],
      characteristics: [
        'Built on L0 primitives',
        'Adds configuration and defaults',
        'Enhanced error handling',
        'Production-ready features'
      ]
    },
    {
      level: 'L2',
      name: 'Patterns',
      icon: <GitBranch className="w-6 h-6" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: 'Common solutions combining multiple L1 components',
      examples: ['IDE Workspace', 'Claude Conversation System', 'Deployment Pipeline'],
      characteristics: [
        'Combines multiple L1 components',
        'Solves specific use cases',
        'Implements best practices',
        'Reusable patterns'
      ]
    },
    {
      level: 'L3',
      name: 'Applications',
      icon: <Rocket className="w-6 h-6" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      description: 'Complete, deployable applications',
      examples: ['Love Claude Code Platform', 'MCP Server', 'Backend Service'],
      characteristics: [
        'Full applications',
        'Ready to deploy',
        'Complete feature sets',
        'Self-contained systems'
      ]
    }
  ]

  const constructPrinciples = [
    {
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      title: 'Isolation',
      description: 'Each construct is self-contained with clear boundaries'
    },
    {
      icon: <Layers className="w-5 h-5 text-green-400" />,
      title: 'Composability',
      description: 'Constructs combine to create more powerful abstractions'
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: 'Reusability',
      description: 'Write once, use everywhere across projects'
    },
    {
      icon: <Code2 className="w-5 h-5 text-purple-400" />,
      title: 'Testability',
      description: 'Every construct includes comprehensive tests'
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
          <Layers className="w-10 h-10 text-blue-500" />
          Construct System Guide
        </h1>
        <p className="text-xl text-gray-400">
          Understanding the Love Claude Code construct hierarchy - the foundation of our self-referential platform
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">What are Constructs?</h2>
        <p className="text-gray-300 mb-4">
          Constructs are the fundamental building blocks of the Love Claude Code platform. They represent reusable pieces 
          of functionality that can be composed together to create larger systems. The platform itself is built entirely 
          from its own constructs, demonstrating the power of this self-referential architecture.
        </p>
        <p className="text-gray-300">
          Our construct system follows a strict hierarchy with four levels (L0-L3), where each level builds upon the 
          previous one. This creates a clear dependency chain and ensures that complex systems are built from 
          well-tested, simple components.
        </p>
      </motion.div>

      {/* Construct Levels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">The Four Levels</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {levels.map((level, index) => (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`${level.bgColor} rounded-xl p-6 border border-gray-700`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-gray-800 ${level.color}`}>
                  {level.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    <span className={`${level.color} font-mono`}>{level.level}</span> - {level.name}
                  </h3>
                  <p className="text-gray-400">{level.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 text-gray-300">Examples:</h4>
                <div className="flex flex-wrap gap-2">
                  {level.examples.map((example) => (
                    <span key={example} className="px-3 py-1 bg-gray-800 rounded-md text-sm">
                      {example}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-300">Characteristics:</h4>
                <ul className="space-y-1">
                  {level.characteristics.map((char) => (
                    <li key={char} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Core Principles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">Core Principles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {constructPrinciples.map((principle) => (
            <div key={principle.title} className="flex gap-4">
              <div className="flex-shrink-0">{principle.icon}</div>
              <div>
                <h3 className="font-semibold mb-1">{principle.title}</h3>
                <p className="text-gray-400 text-sm">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Creating Constructs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Creating Constructs</h2>
        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-300 mb-4">
            Love Claude Code provides multiple ways to create constructs, catering to different development styles:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">1.</span>
              <div>
                <h4 className="font-semibold mb-1">Construct Creation Wizard</h4>
                <p className="text-gray-400 text-sm">
                  A 6-step guided process that walks you through specification, testing, and implementation
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-green-400 font-mono">2.</span>
              <div>
                <h4 className="font-semibold mb-1">ConstructBuilder IDE</h4>
                <p className="text-gray-400 text-sm">
                  Professional development environment with AI assistance and phased workflow
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-purple-400 font-mono">3.</span>
              <div>
                <h4 className="font-semibold mb-1">Visual Composer</h4>
                <p className="text-gray-400 text-sm">
                  Drag-and-drop interface for visual programming and construct composition
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-mono">4.</span>
              <div>
                <h4 className="font-semibold mb-1">Project Templates</h4>
                <p className="text-gray-400 text-sm">
                  Start with pre-configured templates for each construct level
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Example Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Example: Creating an L1 Construct</h2>
        <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
          <pre className="text-gray-300">
{`import { L1UIConstruct } from '@love-claude-code/constructs'
import { ButtonPrimitive } from '../L0/ui/ButtonPrimitive'

export class SecureButton extends L1UIConstruct {
  private button: ButtonPrimitive
  
  constructor(config: SecureButtonConfig) {
    super(config)
    
    // Compose L0 primitive with added security
    this.button = new ButtonPrimitive({
      onClick: this.handleSecureClick.bind(this),
      ...config.buttonProps
    })
  }
  
  private handleSecureClick(event: Event) {
    // Add security checks
    if (!this.validateCSRFToken()) return
    if (!this.checkRateLimit()) return
    
    // Execute original handler
    this.config.onClick?.(event)
  }
  
  render() {
    return this.button.render()
  }
}`}
          </pre>
        </div>
      </motion.div>

      {/* Self-Referential Nature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4">Self-Referential Architecture</h2>
        <p className="text-gray-300 mb-4">
          The most powerful aspect of our construct system is that Love Claude Code is built entirely from its own 
          constructs. This means:
        </p>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            The Construct Catalog is built using catalog constructs
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            The ConstructBuilder IDE uses editor and UI constructs
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            The Testing System tests itself using test constructs
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            Every new feature is built using existing constructs
          </li>
        </ul>
        <p className="text-gray-400 mt-4 text-sm">
          This creates an exponential growth in capabilities as each new construct enables the creation of even more 
          powerful constructs.
        </p>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-3">
          <a href="#construct-builder" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Learn the ConstructBuilder IDE →</h3>
            <p className="text-gray-400 text-sm">Master the professional construct development environment</p>
          </a>
          <a href="#visual-composer" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Try Visual Composer →</h3>
            <p className="text-gray-400 text-sm">Create constructs visually with drag-and-drop</p>
          </a>
          <a href="#marketplace" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Browse the Marketplace →</h3>
            <p className="text-gray-400 text-sm">Discover and share constructs with the community</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default ConstructSystemGuide