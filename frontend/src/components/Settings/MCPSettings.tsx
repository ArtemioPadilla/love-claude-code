import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiCode, 
  FiTool, 
  FiPlus, 
  FiTrash2, 
  FiPlay, 
  FiToggleLeft, 
  FiToggleRight,
  FiPackage,
  FiRefreshCw
} from 'react-icons/fi'

interface MCPTool {
  id: string
  name: string
  description: string
  category: string
}

interface MCPSettingsProps {
  projectId: string
}

export function MCPSettings({ projectId }: MCPSettingsProps) {
  const [enabled, setEnabled] = useState(false)
  const [tools, setTools] = useState<MCPTool[]>([])
  const [loading, setLoading] = useState(true)
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    category: 'custom'
  })
  const [showAddTool, setShowAddTool] = useState(false)

  useEffect(() => {
    loadMCPConfig()
  }, [projectId])

  const loadMCPConfig = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const response = await fetch(`/api/v1/projects/${projectId}/mcp/config`)
      const data = await response.json()
      setEnabled(data.enabled || false)
      
      // Load tools
      const toolsResponse = await fetch(`/api/v1/projects/${projectId}/mcp/tools`)
      const toolsData = await toolsResponse.json()
      setTools(toolsData.tools || [])
    } catch (error) {
      console.error('Failed to load MCP config:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMCP = async () => {
    try {
      const newEnabled = !enabled
      await fetch(`/api/v1/projects/${projectId}/mcp/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      })
      setEnabled(newEnabled)
    } catch (error) {
      console.error('Failed to toggle MCP:', error)
    }
  }

  const addTool = async () => {
    if (!newTool.name || !newTool.description) return

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/mcp/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTool)
      })
      const data = await response.json()
      setTools([...tools, data.tool])
      setNewTool({ name: '', description: '', category: 'custom' })
      setShowAddTool(false)
    } catch (error) {
      console.error('Failed to add tool:', error)
    }
  }

  const deleteTool = async (toolId: string) => {
    try {
      await fetch(`/api/v1/projects/${projectId}/mcp/tools/${toolId}`, {
        method: 'DELETE'
      })
      setTools(tools.filter(t => t.id !== toolId))
    } catch (error) {
      console.error('Failed to delete tool:', error)
    }
  }

  const deployMCP = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/mcp/deploy`, {
        method: 'POST'
      })
      const data = await response.json()
      console.log('MCP deployed:', data)
    } catch (error) {
      console.error('Failed to deploy MCP:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <FiRefreshCw className="animate-spin mx-auto mb-2" size={24} />
        <p className="text-muted-foreground">Loading MCP configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* MCP Toggle */}
      <div className="bg-card/50 p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiCode className="text-primary" size={24} />
            <div>
              <h3 className="font-semibold">Model Context Protocol (MCP)</h3>
              <p className="text-sm text-muted-foreground">
                Enable Claude to interact with your application
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleMCP}
            className="p-2 rounded-md hover:bg-accent/50 transition-all"
          >
            {enabled ? (
              <FiToggleRight className="text-primary" size={32} />
            ) : (
              <FiToggleLeft className="text-muted-foreground" size={32} />
            )}
          </button>
        </div>
        
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-primary/10 rounded-md"
          >
            <p className="text-sm">
              ✨ MCP is enabled! Claude can now interact with your app through custom tools.
            </p>
          </motion.div>
        )}
      </div>

      {/* MCP Tools */}
      {enabled && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiTool size={20} />
                MCP Tools
              </h3>
              <button
                onClick={() => setShowAddTool(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                <FiPlus size={16} />
                Add Tool
              </button>
            </div>

            {/* Tools List */}
            <div className="space-y-2">
              {tools.map((tool) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-card/50 border border-border rounded-lg hover:border-primary/50 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tool.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-accent/50 rounded-full">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => console.log('Test tool:', tool.id)}
                      className="p-2 rounded-md hover:bg-accent/50 transition-all"
                      title="Test tool"
                    >
                      <FiPlay size={16} />
                    </button>
                    <button
                      onClick={() => deleteTool(tool.id)}
                      className="p-2 rounded-md hover:bg-destructive/20 text-destructive transition-all"
                      title="Delete tool"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {tools.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FiTool className="mx-auto mb-2 opacity-50" size={32} />
                  <p>No tools configured yet</p>
                  <p className="text-sm">Add tools to enable Claude interactions</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Tool Modal */}
          {showAddTool && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowAddTool(false)}
            >
              <div
                className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Add MCP Tool</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tool Name</label>
                    <input
                      type="text"
                      value={newTool.name}
                      onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      placeholder="e.g., create_user"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                      type="text"
                      value={newTool.description}
                      onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                      placeholder="What does this tool do?"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={newTool.category}
                      onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="auth">Authentication</option>
                      <option value="data">Data</option>
                      <option value="ui">UI</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowAddTool(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTool}
                    disabled={!newTool.name || !newTool.description}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Tool
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Deploy Button */}
          <div className="flex justify-end">
            <button
              onClick={deployMCP}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-all"
            >
              <FiPackage size={16} />
              Build & Deploy MCP Server
            </button>
          </div>
        </>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-4 bg-accent/20 rounded-lg">
        <p className="text-sm">
          <strong>Learn more:</strong> Check out the{' '}
          <a href="/docs/mcp" className="text-primary hover:underline">
            MCP documentation
          </a>{' '}
          to understand how to create custom tools and integrate Claude with your application.
        </p>
      </div>
    </div>
  )
}