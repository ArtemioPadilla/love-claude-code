import React from 'react'
import { motion } from 'framer-motion'
import { Workflow, MousePointer, Link2, Palette, Zap, Share2, Settings, Box } from 'lucide-react'

const VisualComposerGuide: React.FC = () => {
  const composerFeatures = [
    {
      icon: <MousePointer className="w-5 h-5" />,
      title: 'Drag & Drop Interface',
      description: 'Build constructs by dragging components from the palette and connecting them'
    },
    {
      icon: <Link2 className="w-5 h-5" />,
      title: 'Visual Connections',
      description: 'Draw connections between constructs to define data flow and dependencies'
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'Component Palette',
      description: 'Access all available constructs organized by level and category'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Real-time Validation',
      description: 'Get instant feedback on compatibility and configuration issues'
    }
  ]

  const workflowSteps = [
    {
      step: 1,
      title: 'Choose Base Constructs',
      description: 'Select from the palette of available L0 and L1 constructs',
      color: 'text-blue-400'
    },
    {
      step: 2,
      title: 'Arrange on Canvas',
      description: 'Drag constructs onto the canvas and position them logically',
      color: 'text-green-400'
    },
    {
      step: 3,
      title: 'Connect Components',
      description: 'Draw connections to define relationships and data flow',
      color: 'text-purple-400'
    },
    {
      step: 4,
      title: 'Configure Properties',
      description: 'Set properties and parameters for each construct',
      color: 'text-orange-400'
    },
    {
      step: 5,
      title: 'Generate Code',
      description: 'Convert your visual design into working construct code',
      color: 'text-red-400'
    }
  ]

  const nodeTypes = [
    {
      type: 'Input',
      color: 'bg-blue-500',
      description: 'Data sources and user inputs'
    },
    {
      type: 'Process',
      color: 'bg-green-500',
      description: 'Data transformation and logic'
    },
    {
      type: 'Output',
      color: 'bg-purple-500',
      description: 'Results and side effects'
    },
    {
      type: 'Control',
      color: 'bg-orange-500',
      description: 'Flow control and conditions'
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
          <Workflow className="w-10 h-10 text-purple-500" />
          Visual Composer Guide
        </h1>
        <p className="text-xl text-gray-400">
          Create constructs visually using drag-and-drop programming
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Visual Programming for Everyone</h2>
        <p className="text-gray-300 mb-4">
          The Visual Composer enables you to create powerful constructs without writing code. By connecting 
          visual components on a canvas, you can build complex functionality that automatically generates 
          clean, maintainable code following Love Claude Code best practices.
        </p>
        <p className="text-gray-300">
          This approach is perfect for prototyping, learning the construct system, or building constructs 
          when you prefer visual thinking over text-based coding.
        </p>
      </motion.div>

      {/* Key Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Core Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {composerFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-lg p-6 flex gap-4"
            >
              <div className="flex-shrink-0 p-3 bg-purple-500/10 rounded-lg text-purple-400">
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

      {/* Visual Workflow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">The Visual Composition Process</h2>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex gap-4 items-start"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ${step.color} font-bold`}>
                {step.step}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Canvas Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Understanding the Canvas</h2>
        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Canvas Layout</h3>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="grid grid-cols-3 gap-4 h-64">
                <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600">
                  <h4 className="text-sm font-semibold mb-2 text-gray-400">Component Palette</h4>
                  <div className="space-y-2">
                    <div className="bg-blue-500/20 rounded p-2 text-xs">L0 Primitives</div>
                    <div className="bg-green-500/20 rounded p-2 text-xs">L1 Components</div>
                    <div className="bg-purple-500/20 rounded p-2 text-xs">L2 Patterns</div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600 col-span-2">
                  <h4 className="text-sm font-semibold mb-2 text-gray-400">Design Canvas</h4>
                  <div className="relative h-full">
                    <div className="absolute top-4 left-4 w-16 h-10 bg-blue-500 rounded flex items-center justify-center text-xs">Input</div>
                    <div className="absolute top-4 right-4 w-16 h-10 bg-purple-500 rounded flex items-center justify-center text-xs">Output</div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-10 bg-green-500 rounded flex items-center justify-center text-xs">Process</div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="80" y1="40" x2="140" y2="80" stroke="#4B5563" strokeWidth="2" />
                      <line x1="220" y1="80" x2="280" y2="40" stroke="#4B5563" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Node Types</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {nodeTypes.map((node) => (
                <div key={node.type} className="flex items-center gap-3">
                  <div className={`w-4 h-4 ${node.color} rounded`}></div>
                  <div>
                    <span className="font-medium">{node.type}:</span>
                    <span className="text-gray-400 text-sm ml-2">{node.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interaction Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Canvas Interactions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Mouse Controls</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Add node</span>
                <span className="font-mono text-blue-400">Drag from palette</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connect nodes</span>
                <span className="font-mono text-blue-400">Drag from port to port</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Select multiple</span>
                <span className="font-mono text-blue-400">Shift + Click</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pan canvas</span>
                <span className="font-mono text-blue-400">Space + Drag</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Zoom</span>
                <span className="font-mono text-blue-400">Scroll wheel</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Delete selected</span>
                <span className="font-mono text-blue-400">Delete/Backspace</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duplicate</span>
                <span className="font-mono text-blue-400">Cmd/Ctrl + D</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Undo/Redo</span>
                <span className="font-mono text-blue-400">Cmd/Ctrl + Z/Y</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Auto-arrange</span>
                <span className="font-mono text-blue-400">Cmd/Ctrl + L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Generate code</span>
                <span className="font-mono text-blue-400">Cmd/Ctrl + G</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Advanced Features</h2>
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-400" />
              Subgraphs & Grouping
            </h3>
            <p className="text-gray-300 mb-3">
              Create reusable subgraphs by grouping related nodes. This helps manage complexity and 
              creates modular designs that can be saved as new constructs.
            </p>
            <div className="bg-gray-700 rounded p-3 text-sm text-gray-400">
              Select nodes → Right-click → "Create Subgraph" → Name your new construct
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-400" />
              Property Inspector
            </h3>
            <p className="text-gray-300 mb-3">
              Configure detailed properties for each node including types, validation rules, default values, 
              and advanced settings. The property inspector provides context-aware options based on node type.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              Live Collaboration
            </h3>
            <p className="text-gray-300 mb-3">
              Work together in real-time with team members. See cursors, selections, and changes as they 
              happen. Perfect for pair programming and design reviews.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Code Generation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4">Code Generation</h2>
        <p className="text-gray-300 mb-4">
          The Visual Composer generates clean, maintainable TypeScript code that follows Love Claude Code 
          conventions. The generated code includes:
        </p>
        <ul className="space-y-2 text-gray-300 ml-6">
          <li>• Proper construct class structure with inheritance</li>
          <li>• Type-safe interfaces for inputs and outputs</li>
          <li>• Dependency injection and management</li>
          <li>• Error handling and validation</li>
          <li>• Comprehensive JSDoc comments</li>
          <li>• Unit test scaffolding</li>
        </ul>
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong>Note:</strong> Generated code can be further customized in ConstructBuilder IDE
          </p>
        </div>
      </motion.div>

      {/* Use Cases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Perfect For</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-green-400">✓ Ideal Use Cases</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Prototyping new construct ideas</li>
              <li>• Learning the construct hierarchy</li>
              <li>• Building UI component compositions</li>
              <li>• Creating data flow pipelines</li>
              <li>• Designing state machines</li>
              <li>• Architecture visualization</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-red-400">✗ Less Suitable For</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Complex algorithmic logic</li>
              <li>• Low-level system programming</li>
              <li>• Performance-critical code</li>
              <li>• Large-scale applications</li>
              <li>• Custom business logic</li>
              <li>• External API integrations</li>
            </ul>
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
          <a href="#visual-composer-tutorial" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Interactive Tutorial →</h3>
            <p className="text-gray-400 text-sm">Learn by building your first visual construct</p>
          </a>
          <a href="#construct-templates" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Browse Templates →</h3>
            <p className="text-gray-400 text-sm">Start with pre-built visual construct templates</p>
          </a>
          <a href="#construct-builder" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1">Switch to Code →</h3>
            <p className="text-gray-400 text-sm">Continue development in ConstructBuilder IDE</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default VisualComposerGuide