import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiTerminal,
  // FiX, // Removed unused import
  FiMaximize2,
  FiMinimize2,
  FiCopy,
  FiDownload,
  FiHelpCircle,
  FiCommand
} from 'react-icons/fi'
import { useSettingsStore } from '@stores/settingsStore'
import { useEditorStore } from '@stores/editorStore'

interface ClaudeTerminalLine {
  id: string
  type: 'command' | 'output' | 'error' | 'success' | 'info' | 'assistant'
  text: string
  timestamp: Date
  isCode?: boolean
  language?: string
}

interface ClaudeTerminalProps {
  defaultHeight?: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  className?: string
}

const ClaudePrompt = () => (
  <span className="flex items-center gap-2 text-blue-400">
    <FiCommand size={14} />
    <span className="font-semibold">claude</span>
    <span className="text-gray-500">&gt;</span>
  </span>
)

const ClaudeTerminalLine: React.FC<{ line: ClaudeTerminalLine }> = ({ line }) => {
  const [copied, setCopied] = useState(false)
  
  const getLineStyle = () => {
    switch (line.type) {
      case 'command': {
        return 'text-blue-400 font-mono'
      }
      case 'error': {
        return 'text-red-400'
      }
      case 'success': {
        return 'text-green-400'
      }
      case 'info': {
        return 'text-yellow-400'
      }
      case 'assistant': {
        return 'text-gray-300'
      }
      default: {
        return 'text-gray-300'
      }
    }
  }
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const renderContent = () => {
    if (line.isCode) {
      return (
        <div className="relative group">
          <pre className="bg-gray-900 rounded-md p-3 overflow-x-auto">
            <code className={`language-${line.language || 'plaintext'}`}>
              {line.text}
            </code>
          </pre>
          <button
            onClick={() => handleCopy(line.text)}
            className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <span className="text-xs text-green-400">Copied!</span>
            ) : (
              <FiCopy size={14} />
            )}
          </button>
        </div>
      )
    }
    
    return <span className="whitespace-pre-wrap break-all">{line.text}</span>
  }
  
  if (line.type === 'command') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-2 py-1 px-4 hover:bg-gray-800/30 group"
      >
        <ClaudePrompt />
        <span className="flex-1 font-mono text-sm text-gray-200">{line.text}</span>
        <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          {line.timestamp.toLocaleTimeString()}
        </span>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`py-1 px-4 hover:bg-gray-800/30 group ${getLineStyle()}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex-1 font-mono text-sm">{renderContent()}</span>
        <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {line.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  )
}

// Line ID counter to ensure unique keys
let lineIdCounter = 0

export const ClaudeTerminal: React.FC<ClaudeTerminalProps> = ({
  defaultHeight = 400,
  isExpanded = false,
  onToggleExpand,
  className = ''
}) => {
  const [lines, setLines] = useState<ClaudeTerminalLine[]>([
    {
      id: '1',
      type: 'info',
      text: 'Claude Code CLI Terminal - Type "help" for available commands',
      timestamp: new Date()
    }
  ])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')
  const [isCliAvailable, setIsCliAvailable] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { settings } = useSettingsStore()
  const { files, activeFileId } = useEditorStore()
  
  // Check Claude CLI status on mount
  useEffect(() => {
    let mounted = true
    
    const checkCliStatus = async () => {
      // Only proceed if component is still mounted
      if (!mounted) return
      
      // Special handling for Claude Code CLI - it doesn't need API authentication
      if (settings.ai?.authMethod === 'claude-cli') {
        setIsCliAvailable(true) // Assume available, will check when running commands
        addLine('info', '🤖 Claude Code CLI authentication selected')
        addLine('info', '📋 Setup Instructions:')
        addLine('info', '  1. Install CLI: npm install -g @anthropic-ai/claude-code')
        addLine('info', '  2. Authenticate: claude setup-token')
        addLine('info', '  3. Test it works: claude -p "Hello"')
        addLine('success', '✅ Once setup is complete, you can start using Claude commands here!')
        return
      }
      
      // Check if other authentication methods are configured
      const hasAuth = 
        (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials) ||
        (settings.ai?.authMethod === 'api-key' && settings.ai?.apiKey)
      
      if (!hasAuth) {
        setIsCliAvailable(false)
        
        // Show appropriate message based on auth method
        if (settings.ai?.authMethod === 'oauth-max') {
          addLine('error', 'Please sign in with Claude Max in Settings to use the terminal')
        } else if (settings.ai?.authMethod === 'api-key') {
          addLine('error', 'Please configure your API key in Settings to use the terminal')
        }
        return
      }
      
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const headers: Record<string, string> = {}
        
        // Add authentication
        if ((settings.ai?.authMethod as string) === 'claude-cli') {
          headers['X-Claude-CLI'] = 'true'
        } else if (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials?.accessToken) {
          headers['X-Claude-Auth'] = `Bearer ${settings.ai.oauthCredentials.accessToken}`
        } else if (settings.ai?.apiKey) {
          const token = localStorage.getItem('auth_token')
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
        }
        
        const response = await fetch(`${baseUrl}/api/v1/terminal/claude/status`, {
          headers
        })
        
        if (!mounted) return
        
        if (response.ok) {
          const status = await response.json()
          setIsCliAvailable(status.installed)
          
          if (status.installed) {
            addLine('success', 'Claude Terminal Ready')
            
            // Show authentication method being used
            if ((settings.ai?.authMethod as string) === 'claude-cli') {
              addLine('info', 'Using Claude Code CLI authentication')
            } else if (settings.ai?.authMethod === 'oauth-max') {
              addLine('info', 'Using Claude Max OAuth authentication')
            } else if (settings.ai?.authMethod === 'api-key') {
              addLine('info', 'Using API key authentication')
            }
          } else {
            addLine('error', 'Claude Code CLI is not installed on the server')
            addLine('info', 'Ask your administrator to install it with: npm install -g @anthropic-ai/claude-code')
          }
        } else {
          setIsCliAvailable(false)
          
          // Handle specific error codes
          if (response.status === 401 || response.status === 403) {
            addLine('error', 'Authentication failed. Please check your credentials in Settings.')
          } else if (response.status === 404) {
            addLine('error', 'Terminal API not found. Make sure the backend is running.')
          } else {
            addLine('error', `Failed to check Claude CLI status (Error ${response.status})`)
          }
        }
      } catch (error) {
        if (!mounted) return
        
        const err = error as Error
        console.error('Failed to check CLI status:', error)
        setIsCliAvailable(false)
        
        if (err.message?.includes('fetch')) {
          addLine('error', 'Cannot connect to backend. Make sure the server is running.')
        } else {
          addLine('error', 'Failed to check Claude CLI status. Please try again.')
        }
      }
    }
    
    checkCliStatus()
    
    // Cleanup function
    return () => {
      mounted = false
    }
  }, [settings.ai?.authMethod, settings.ai?.apiKey, settings.ai?.oauthCredentials])
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])
  
  const addLine = (type: ClaudeTerminalLine['type'], text: string, options?: Partial<ClaudeTerminalLine>) => {
    setLines(prev => [...prev, {
      id: `line-${++lineIdCounter}-${Date.now()}`,
      type,
      text,
      timestamp: new Date(),
      ...options
    }])
  }
  
  const processCommand = async (command: string) => {
    const trimmedCommand = command.trim()
    
    // Handle special commands
    if (trimmedCommand === 'clear') {
      setLines([])
      return
    }
    
    if (trimmedCommand === 'help' || trimmedCommand === 'claude help') {
      showHelp()
      return
    }
    
    if (trimmedCommand === 'export') {
      exportTerminalHistory()
      return
    }
    
    // Handle Claude commands
    if (trimmedCommand.startsWith('claude ')) {
      // Special handling for Claude Code CLI
      if (settings.ai?.authMethod === 'claude-cli') {
        // For CLI, we don't check auth here - we let the CLI handle it
        // The error will be more specific when the command actually runs
      } else {
        // Check if other authentication methods are configured
        const hasAuth = 
          (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials?.accessToken) ||
          (settings.ai?.authMethod === 'api-key' && settings.ai?.apiKey)
        
        if (!hasAuth) {
          addLine('error', '❌ Authentication required to use Claude commands')
          
          if (settings.ai?.authMethod === 'api-key') {
            addLine('info', 'Please configure your API key in Settings (click the gear icon in the header)')
          } else if (settings.ai?.authMethod === 'oauth-max') {
            addLine('info', 'Please sign in with Claude Max in Settings (click the gear icon in the header)')
          }
          return
        }
      }
      
      await executeClaudeCommand(trimmedCommand)
    } else if (trimmedCommand === 'claude') {
      // Just "claude" without arguments - show usage
      addLine('info', 'Usage: claude -p <prompt> [options]')
      addLine('info', 'Type "help" for more information')
    } else {
      // For non-claude commands, suggest using claude prefix
      addLine('info', 'Tip: Start your command with "claude" to interact with Claude AI')
      addLine('info', 'Example: claude -p "explain this code"')
    }
  }
  
  const executeClaudeCommand = async (command: string) => {
    setIsProcessing(true)
    
    try {
      // Parse Claude command
      const args = command.split(' ').slice(1) // Remove 'claude' prefix
      
      // Add context if a file is open
      const activeFile = files.find(f => f.id === activeFileId)
      if (activeFile && !args.includes('-f') && !args.includes('--file')) {
        args.push('-f', activeFile.name)
        addLine('info', `Including active file: ${activeFile.name}`)
      }
      
      // Send to backend
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add authentication based on settings
      if (settings.ai?.authMethod === 'claude-cli') {
        headers['X-Claude-CLI'] = 'true'
      } else if (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials?.accessToken) {
        headers['X-Claude-Auth'] = `Bearer ${settings.ai.oauthCredentials.accessToken}`
      } else if (settings.ai?.apiKey) {
        // Get JWT token from localStorage if using API key auth
        const token = localStorage.getItem('auth_token')
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      }
      
      const response = await fetch(`${baseUrl}/api/v1/terminal/claude`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          command: args,
          context: activeFile ? {
            files: [{
              name: activeFile.name,
              content: activeFile.content,
              language: activeFile.language
            }]
          } : undefined
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        
        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          addLine('error', '❌ Authentication failed')
          
          if (settings.ai?.authMethod === 'api-key') {
            if (!settings.ai?.apiKey) {
              addLine('error', 'No API key configured. Please add your API key in Settings.')
            } else {
              addLine('error', 'Your API key may be invalid. Please check it in Settings.')
            }
          } else if (settings.ai?.authMethod === 'oauth-max') {
            addLine('error', 'OAuth session may have expired. Please sign in again in Settings.')
          } else if (settings.ai?.authMethod === 'claude-cli') {
            addLine('error', '🔴 Claude Code CLI error')
            addLine('info', 'This usually means one of the following:')
            addLine('info', '  1. Claude Code CLI is not installed')
            addLine('info', '  2. You haven\'t run: claude setup-token')
            addLine('info', '  3. Your Claude session has expired')
            addLine('info', '')
            addLine('info', '🔧 To fix this, in your system terminal run:')
            addLine('info', '  claude setup-token')
          }
        } else if (response.status === 500 && error.code === 'CLAUDE_CLI_NOT_INSTALLED') {
          addLine('error', '🔴 Claude Code CLI is not installed on the server')
          addLine('info', 'To use Claude Code CLI, you need to install it locally:')
          addLine('info', '  npm install -g @anthropic-ai/claude-code')
          addLine('info', 'Then authenticate with: claude setup-token')
        } else if (response.status === 500 && error.message?.includes('exited with code')) {
          addLine('error', '🔴 Claude Code CLI command failed')
          addLine('info', 'This usually means you need to authenticate.')
          addLine('info', 'Run in your terminal: claude setup-token')
        } else {
          addLine('error', error.message || `Command failed (Error ${response.status})`)
        }
        return
      }
      
      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        addLine('error', 'No response received')
        return
      }
      
      const decoder = new TextDecoder()
      let buffer = ''
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content') {
                addLine('assistant', data.content)
              } else if (data.type === 'error') {
                addLine('error', data.message)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
        
        buffer = lines[lines.length - 1]
      }
    } catch (error) {
      const err = error as Error
      addLine('error', `Failed to execute command: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const showHelp = () => {
    const helpText = `Claude Code CLI Commands:

Basic Usage:
  claude -p <prompt>              Send a prompt to Claude
  claude -p <prompt> -f <file>    Include a file in the context
  claude -p <prompt> --model <m>  Specify model (e.g., claude-3-opus)

Terminal Commands:
  clear                          Clear the terminal
  help                           Show this help message
  export                         Export terminal history

Examples:
  claude -p "explain this code"
  claude -p "add error handling" -f app.js
  claude -p "write unit tests" --model claude-3-opus

Tips:
  - Active files are automatically included as context
  - Use arrow keys to navigate command history
  - Press Tab for command completion (coming soon)`
    
    addLine('info', helpText)
  }
  
  const exportTerminalHistory = () => {
    const content = lines.map(line => {
      const timestamp = line.timestamp.toLocaleTimeString()
      const prefix = line.type === 'command' ? 'claude> ' : '       '
      return `[${timestamp}] ${prefix}${line.text}`
    }).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claude-terminal-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    addLine('success', 'Terminal history exported')
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCommand.trim() || isProcessing) return
    
    // Add to history
    setCommandHistory(prev => [...prev, currentCommand])
    setHistoryIndex(-1)
    
    // Add command to terminal
    addLine('command', currentCommand)
    
    // Process command
    await processCommand(currentCommand)
    
    setCurrentCommand('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentCommand('')
      }
    }
  }
  
  return (
    <motion.div
      className={`
        flex flex-col bg-gray-950 border border-gray-800 rounded-lg overflow-hidden
        ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: isExpanded ? 'auto' : defaultHeight }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <FiTerminal size={18} />
            <span className="font-medium">Claude Terminal</span>
            <div className={`w-2 h-2 rounded-full ${isCliAvailable ? 'bg-green-500' : isCliAvailable === null ? 'bg-yellow-500' : 'bg-red-500'}`} 
                 title={isCliAvailable ? 'CLI Available' : isCliAvailable === null ? 'Checking...' : 'CLI Not Available'} />
          </div>
          
          {/* Authentication status indicator */}
          {!((settings.ai?.authMethod === 'claude-cli') ||
              (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials?.accessToken) ||
              (settings.ai?.authMethod === 'api-key' && settings.ai?.apiKey)) && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-md text-sm">
              <FiHelpCircle size={14} />
              <span>Authentication required</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => addLine('info', 'Help command: type "help" for available commands')}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
            title="Help"
          >
            <FiHelpCircle size={16} />
          </button>
          <button
            onClick={exportTerminalHistory}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
            title="Export history"
          >
            <FiDownload size={16} />
          </button>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>
          )}
        </div>
      </div>
      
      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-2 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map(line => (
          <ClaudeTerminalLine key={line.id} line={line} />
        ))}
        
        {isProcessing && (
          <div className="flex items-center gap-2 px-4 py-1 text-gray-500">
            <span className="loading-dots inline-flex">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="text-sm">Claude is thinking...</span>
          </div>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800">
        <div className="flex items-center px-4 py-3">
          <ClaudePrompt />
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
              flex-1 ml-2 bg-transparent text-gray-200 
              font-mono text-sm outline-none
              placeholder-gray-600
            "
            placeholder={!((settings.ai?.authMethod === 'claude-cli') ||
                          (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials?.accessToken) ||
                          (settings.ai?.authMethod === 'api-key' && settings.ai?.apiKey)) 
                        ? "Configure authentication in Settings first..."
                        : "Type a command..."}
            autoFocus
            disabled={isProcessing}
          />
        </div>
      </form>
    </motion.div>
  )
}

export default ClaudeTerminal