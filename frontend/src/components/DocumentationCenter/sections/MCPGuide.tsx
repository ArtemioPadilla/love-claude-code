import React from 'react'
import { motion } from 'framer-motion'
import { Terminal, Cpu, Settings, Zap, Shield, Code2, ArrowRight } from 'lucide-react'

const MCPGuide: React.FC = () => {
  const mcpTools = {
    ui: [
      { name: 'getPageScreenshot', description: 'Capture screenshots of your app' },
      { name: 'inspectElement', description: 'Get details about DOM elements' },
      { name: 'clickElement', description: 'Interact with UI elements' },
      { name: 'typeInElement', description: 'Input text into forms' },
      { name: 'validateLayout', description: 'Check for layout issues' },
      { name: 'waitForElement', description: 'Wait for elements to appear' }
    ],
    provider: [
      { name: 'analyze_project_requirements', description: 'Analyze your project needs' },
      { name: 'list_providers', description: 'List available backend providers' },
      { name: 'compare_providers', description: 'Compare provider features' },
      { name: 'estimate_costs', description: 'Estimate monthly costs' },
      { name: 'switch_provider', description: 'Switch between providers' },
      { name: 'migrate_data', description: 'Migrate data between providers' }
    ]
  }

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Terminal className="w-10 h-10 text-purple-500" />
          Model Context Protocol (MCP)
        </h1>
        <p className="text-xl text-gray-400">
          MCP enables Claude to interact with your development environment, providing powerful tools for testing, 
          analysis, and provider management.
        </p>
      </motion.div>

      {/* What is MCP */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-8"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-blue-500" />
          What is MCP?
        </h2>
        <p className="text-gray-300 mb-4">
          The Model Context Protocol (MCP) is a standard for connecting AI models to external tools and systems. 
          Love Claude Code includes two MCP servers:
        </p>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-pink-400">UI Testing Server</h3>
            <p className="text-gray-400">
              Enables Claude to inspect your UI, take screenshots, and interact with elements for testing and debugging.
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Provider Management Server</h3>
            <p className="text-gray-400">
              Helps Claude analyze your requirements and recommend the best backend provider for your project.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Setup Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="w-6 h-6 text-green-500" />
          Setting Up MCP
        </h2>
        
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">1. Configure Claude Desktop</h3>
          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <code className="text-sm text-gray-300">{`# Copy the configuration file
cp claude_desktop_config_example.json ~/Library/Application\\ Support/Claude/claude_desktop_config.json

# Update paths in the config to match your project location`}</code>
          </pre>
          <p className="text-gray-400">
            The configuration file tells Claude Desktop where to find the MCP servers and how to connect to them.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">2. Build MCP Servers</h3>
          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <code className="text-sm text-gray-300">{`# The servers are built automatically when you run:
make dev

# Or build them manually:
npm run build`}</code>
          </pre>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">3. Restart Claude Desktop</h3>
          <p className="text-gray-400 mb-4">
            After configuring, restart Claude Desktop to load the MCP servers. You'll see them listed in the MCP status.
          </p>
          <div className="bg-gray-900 rounded-lg p-4">
            <code className="text-green-400">✓ love-claude-code-ui</code><br />
            <code className="text-green-400">✓ love-claude-code-providers</code>
          </div>
        </div>
      </motion.div>

      {/* Available Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Code2 className="w-6 h-6 text-purple-500" />
          Available MCP Tools
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-pink-400">UI Testing Tools</h3>
            <div className="space-y-3">
              {mcpTools.ui.map((tool) => (
                <div key={tool.name} className="border-l-2 border-pink-500/30 pl-4">
                  <code className="text-pink-300 font-mono">{tool.name}</code>
                  <p className="text-gray-400 text-sm mt-1">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">Provider Management Tools</h3>
            <div className="space-y-3">
              {mcpTools.provider.map((tool) => (
                <div key={tool.name} className="border-l-2 border-yellow-500/30 pl-4">
                  <code className="text-yellow-300 font-mono">{tool.name}</code>
                  <p className="text-gray-400 text-sm mt-1">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Usage Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gray-800 rounded-xl p-8"
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Usage Examples
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Ask Claude to test your UI:</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300 italic">
                "Can you take a screenshot of my app and check if there are any layout issues?"
              </p>
            </div>
            <p className="text-gray-400 mt-2">
              Claude will use the UI testing tools to capture a screenshot and validate your layout.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Ask for provider recommendations:</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300 italic">
                "I'm building a real-time chat app for 10,000 users. Which provider should I use?"
              </p>
            </div>
            <p className="text-gray-400 mt-2">
              Claude will analyze your requirements and recommend the best provider with cost estimates.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Request a provider migration:</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300 italic">
                "Help me migrate my project from Local to Firebase"
              </p>
            </div>
            <p className="text-gray-400 mt-2">
              Claude will create a migration plan and guide you through the process.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-8 border border-purple-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          Best Practices
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              Always review Claude's recommendations before making significant changes
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              Use MCP tools for analysis and testing, but maintain control over deployments
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              Start with the UI testing tools to familiarize yourself with MCP capabilities
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              Use provider analysis before starting large projects to choose the right backend
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

export default MCPGuide