import React from 'react'
import { motion } from 'framer-motion'
import { Code2, FileCode, GitBranch, Play, TestTube, Package, Sparkles } from 'lucide-react'

const ConstructBuilderGuide: React.FC = () => {
  const features = [
    {
      icon: <FileCode className="w-5 h-5" />,
      title: 'Multi-File Editing',
      description: 'Edit construct definition, implementation, tests, and documentation side-by-side'
    },
    {
      icon: <TestTube className="w-5 h-5" />,
      title: 'Integrated Testing',
      description: 'Run tests in real-time as you develop with live test results'
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'AI-Powered Assistance',
      description: 'Claude helps generate code, tests, and documentation'
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: 'Version Control',
      description: 'Built-in Git integration for tracking construct evolution'
    }
  ]

  const workflowPhases = [
    {
      phase: 'Design',
      color: 'text-blue-400',
      tasks: [
        'Define construct purpose and API',
        'Specify inputs and outputs',
        'Document use cases',
        'Create examples'
      ]
    },
    {
      phase: 'Implement',
      color: 'text-green-400',
      tasks: [
        'Write construct implementation',
        'Add error handling',
        'Implement validation',
        'Create helper methods'
      ]
    },
    {
      phase: 'Test',
      color: 'text-purple-400',
      tasks: [
        'Write unit tests',
        'Create integration tests',
        'Test edge cases',
        'Verify examples work'
      ]
    },
    {
      phase: 'Document',
      color: 'text-orange-400',
      tasks: [
        'Write API documentation',
        'Create usage guide',
        'Add code examples',
        'Document limitations'
      ]
    },
    {
      phase: 'Validate',
      color: 'text-red-400',
      tasks: [
        'Run validation checks',
        'Test in sandbox',
        'Check dependencies',
        'Verify metadata'
      ]
    },
    {
      phase: 'Publish',
      color: 'text-indigo-400',
      tasks: [
        'Set version number',
        'Add release notes',
        'Publish to catalog',
        'Share with community'
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
          <Code2 className="w-10 h-10 text-green-500" />
          ConstructBuilder IDE Guide
        </h1>
        <p className="text-xl text-gray-400">
          Professional development environment for creating high-quality constructs with AI assistance
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">What is ConstructBuilder?</h2>
        <p className="text-gray-300 mb-4">
          ConstructBuilder is a sophisticated IDE specifically designed for developing Love Claude Code constructs. 
          It provides a complete development workflow from initial design through testing and publication, with 
          AI-powered assistance at every step.
        </p>
        <p className="text-gray-300">
          Unlike traditional code editors, ConstructBuilder understands the construct hierarchy and provides 
          specialized tools for each level (L0-L3), ensuring your constructs follow best practices and integrate 
          seamlessly with the platform.
        </p>
      </motion.div>

      {/* Key Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-lg p-6 flex gap-4"
            >
              <div className="flex-shrink-0 p-3 bg-green-500/10 rounded-lg text-green-400">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Phased Workflow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">The Six-Phase Workflow</h2>
        <p className="text-gray-300 mb-6">
          ConstructBuilder guides you through a proven six-phase development process:
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowPhases.map((phase, index) => (
            <div key={phase.phase} className="bg-gray-700 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-2xl font-bold ${phase.color}`}>
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{phase.phase}</h3>
              </div>
              <ul className="space-y-1">
                {phase.tasks.map((task, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Create a New Construct Project</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <p className="text-gray-300">File → New Project → Construct Development</p>
              <p className="text-gray-400 mt-2"># Or use the quick start:</p>
              <p className="text-blue-400">Cmd/Ctrl + Shift + N → Select "Construct"</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Choose Your Construct Level</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-mono">L0:</span>
                <span>Start here for atomic primitives with zero dependencies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-mono">L1:</span>
                <span>Build configured components on top of L0 primitives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-mono">L2:</span>
                <span>Create patterns that combine multiple L1 components</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-mono">L3:</span>
                <span>Develop complete applications using L2 patterns</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Use the Project Template</h3>
            <p className="text-gray-300 mb-3">
              ConstructBuilder automatically creates the proper file structure:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
              <pre>{`my-construct/
├── definition.yaml      # Construct metadata and API
├── implementation.ts    # Main construct code
├── tests/
│   ├── unit.test.ts    # Unit tests
│   └── integration.test.ts
├── examples/
│   ├── basic.ts        # Usage examples
│   └── advanced.ts
├── docs/
│   └── README.md       # Documentation
└── sandbox/            # Test environment`}</pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* IDE Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-4">IDE Features in Detail</h2>
        
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              AI-Powered Development
            </h3>
            <p className="text-gray-300 mb-3">
              Claude is integrated throughout the IDE to assist with:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li>• Generating implementation code from specifications</li>
              <li>• Writing comprehensive test suites</li>
              <li>• Creating clear documentation</li>
              <li>• Suggesting improvements and optimizations</li>
              <li>• Fixing bugs and handling edge cases</li>
            </ul>
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong>Pro tip:</strong> Use Cmd/Ctrl + K to open the AI assistant at any time
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Play className="w-5 h-5 text-green-400" />
              Live Testing Environment
            </h3>
            <p className="text-gray-300 mb-3">
              Test your construct in real-time without leaving the IDE:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li>• Sandboxed execution environment</li>
              <li>• Live reload on code changes</li>
              <li>• Interactive test runner with debugging</li>
              <li>• Performance profiling and metrics</li>
              <li>• Dependency injection for testing</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Dependency Management
            </h3>
            <p className="text-gray-300 mb-3">
              ConstructBuilder automatically manages construct dependencies:
            </p>
            <ul className="space-y-2 text-gray-300 ml-6">
              <li>• Visual dependency graph</li>
              <li>• Automatic version resolution</li>
              <li>• Conflict detection and resolution</li>
              <li>• Dependency impact analysis</li>
              <li>• One-click dependency updates</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Essential Keyboard Shortcuts</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-gray-300">Development</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Save all files</span>
                <span className="text-blue-400">Cmd/Ctrl + S</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Run tests</span>
                <span className="text-blue-400">Cmd/Ctrl + T</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Open AI assistant</span>
                <span className="text-blue-400">Cmd/Ctrl + K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quick fix</span>
                <span className="text-blue-400">Cmd/Ctrl + .</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-gray-300">Navigation</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Switch files</span>
                <span className="text-blue-400">Cmd/Ctrl + P</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Go to definition</span>
                <span className="text-blue-400">F12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Find references</span>
                <span className="text-blue-400">Shift + F12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Toggle sidebar</span>
                <span className="text-blue-400">Cmd/Ctrl + B</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
        <div className="space-y-3 text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Start with specifications:</strong> Use the Design phase to clearly define what your 
              construct will do before writing code
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Write tests first:</strong> Follow TDD principles - write failing tests, then make them pass
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Keep it focused:</strong> Each construct should do one thing well
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Document as you go:</strong> Good documentation is as important as good code
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Version thoughtfully:</strong> Follow semantic versioning and document breaking changes
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-3">
          <a href="#construct-development" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Complete Development Tutorial →</h3>
            <p className="text-gray-400 text-sm">Walk through creating your first construct from start to finish</p>
          </a>
          <a href="#visual-composer" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Try Visual Composer →</h3>
            <p className="text-gray-400 text-sm">Create constructs visually without writing code</p>
          </a>
          <a href="#examples" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Browse Example Constructs →</h3>
            <p className="text-gray-400 text-sm">Learn from real constructs built by the community</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default ConstructBuilderGuide