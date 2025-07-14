import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlay, FiTerminal, FiImage, FiMousePointer } from 'react-icons/fi'

export function MCPTester() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'ui' | 'provider'>('ui')

  const uiTools = [
    { name: 'screenshot', label: 'Take Screenshot', icon: FiImage },
    { name: 'inspect', label: 'Inspect Element', icon: FiMousePointer },
    { name: 'validate', label: 'Validate Layout', icon: FiTerminal }
  ]

  const providerTools = [
    { name: 'list_providers', label: 'List Providers' },
    { name: 'compare_providers', label: 'Compare Providers' },
    { name: 'check_health', label: 'Check Health' }
  ]

  const testUITool = async (toolName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/mcp-test/ui/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ args: {} })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setResult(JSON.stringify(data.result, null, 2))
      } else {
        setResult(`Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testProviderTool = async (toolName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/mcp-test/provider/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ args: {} })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setResult(JSON.stringify(data.result, null, 2))
      } else {
        setResult(`Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">MCP Server Tester</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Test the MCP servers directly from the web interface
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-accent/20 rounded-lg">
        <button
          onClick={() => setActiveTab('ui')}
          className={`flex-1 py-2 px-4 rounded-md transition-all ${
            activeTab === 'ui' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent/50'
          }`}
        >
          UI Testing Server
        </button>
        <button
          onClick={() => setActiveTab('provider')}
          className={`flex-1 py-2 px-4 rounded-md transition-all ${
            activeTab === 'provider' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent/50'
          }`}
        >
          Provider Server
        </button>
      </div>

      {/* Tools */}
      <div className="space-y-2">
        {activeTab === 'ui' ? (
          uiTools.map((tool) => (
            <motion.button
              key={tool.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => testUITool(tool.name)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg hover:border-primary/50 transition-all disabled:opacity-50"
            >
              <tool.icon size={20} />
              <span className="flex-1 text-left">{tool.label}</span>
              <FiPlay size={16} />
            </motion.button>
          ))
        ) : (
          providerTools.map((tool) => (
            <motion.button
              key={tool.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => testProviderTool(tool.name)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg hover:border-primary/50 transition-all disabled:opacity-50"
            >
              <FiTerminal size={20} />
              <span className="flex-1 text-left">{tool.label}</span>
              <FiPlay size={16} />
            </motion.button>
          ))
        )}
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-accent/20 rounded-lg"
        >
          <h4 className="font-medium mb-2">Result:</h4>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </motion.div>
      )}

      {/* Info */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-sm">
          <strong>Note:</strong> For full MCP functionality, use Claude Desktop. 
          This tester provides a preview of what the MCP servers can do.
        </p>
      </div>
    </div>
  )
}