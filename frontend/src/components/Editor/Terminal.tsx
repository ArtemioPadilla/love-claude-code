import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiTerminal,
  FiX,
  FiPlus,
  FiMaximize2,
  FiMinimize2,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi'
import { terminalApiService, type TerminalMessage } from '@services/terminalApi'

interface TerminalTab {
  id: string
  title: string
  content: TerminalLine[]
  isActive: boolean
}

interface TerminalLine {
  id: string
  type: 'command' | 'output' | 'error' | 'success' | 'info'
  text: string
  timestamp: Date
}

interface TerminalProps {
  defaultHeight?: number
  onCommand?: (command: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const TerminalLine: React.FC<{ line: TerminalLine }> = ({ line }) => {
  const getLineStyle = () => {
    switch (line.type) {
      case 'command':
        return 'text-blue-400 font-mono'
      case 'error':
        return 'text-red-400'
      case 'success':
        return 'text-green-400'
      case 'info':
        return 'text-yellow-400'
      default:
        return 'text-gray-300'
    }
  }
  
  const getPrefix = () => {
    switch (line.type) {
      case 'command':
        return '$ '
      case 'error':
        return '✗ '
      case 'success':
        return '✓ '
      case 'info':
        return 'ℹ '
      default:
        return '  '
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-2 py-0.5 px-4 hover:bg-gray-800/30 group ${getLineStyle()}`}
    >
      <span className="opacity-50 select-none">{getPrefix()}</span>
      <span className="flex-1 font-mono text-sm whitespace-pre-wrap break-all">{line.text}</span>
      <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        {line.timestamp.toLocaleTimeString()}
      </span>
    </motion.div>
  )
}

export const Terminal: React.FC<TerminalProps> = ({
  defaultHeight = 300,
  onCommand,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: '1',
      title: 'Terminal',
      content: [
        {
          id: '1',
          type: 'info',
          text: 'Welcome to Love Claude Code Terminal',
          timestamp: new Date()
        }
      ],
      isActive: true
    }
  ])
  
  const [activeTabId, setActiveTabId] = useState('1')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const terminalIdRef = useRef<string | null>(null)
  
  const activeTab = tabs.find(tab => tab.id === activeTabId)
  
  // Initialize WebSocket connection
  useEffect(() => {
    const connectTerminal = async () => {
      try {
        await terminalApiService.connect()
        const terminalId = await terminalApiService.createTerminal()
        terminalIdRef.current = terminalId
        setIsConnected(true)
        addLine('success', 'Terminal connected')
        
        // Handle incoming messages
        terminalApiService.addMessageHandler(handleTerminalMessage)
      } catch (error) {
        console.error('Failed to connect terminal:', error)
        addLine('error', 'Failed to connect to terminal')
      }
    }
    
    connectTerminal()
    
    return () => {
      terminalApiService.disconnect()
    }
  }, [])
  
  const handleTerminalMessage = (message: TerminalMessage) => {
    switch (message.type) {
      case 'output':
        addLine(message.error ? 'error' : 'output', message.data || '')
        break
      case 'error':
        addLine('error', message.data || 'Terminal error')
        break
      case 'exit':
        addLine('info', `Terminal exited with code ${message.code}`)
        setIsConnected(false)
        break
      case 'cwd':
        // Could update prompt with current directory
        break
    }
  }
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeTab?.content])
  
  const addLine = (type: TerminalLine['type'], text: string, tabId: string = activeTabId) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        return {
          ...tab,
          content: [
            ...tab.content,
            {
              id: Date.now().toString(),
              type,
              text,
              timestamp: new Date()
            }
          ]
        }
      }
      return tab
    }))
  }
  
  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCommand.trim()) return
    
    // Add to history
    setCommandHistory(prev => [...prev, currentCommand])
    setHistoryIndex(-1)
    
    // Add command to terminal
    addLine('command', currentCommand)
    
    // Handle local commands
    if (currentCommand === 'clear') {
      setTabs(prev => prev.map(tab => {
        if (tab.id === activeTabId) {
          return { ...tab, content: [] }
        }
        return tab
      }))
      setCurrentCommand('')
      return
    }
    
    // Send command to backend if connected
    if (isConnected) {
      try {
        terminalApiService.sendCommand(currentCommand)
      } catch (error) {
        addLine('error', 'Failed to send command')
      }
    } else {
      // Fallback for when not connected
      if (onCommand) {
        onCommand(currentCommand)
      } else {
        addLine('error', 'Terminal not connected')
      }
    }
    
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
  
  const createNewTab = () => {
    const newTab: TerminalTab = {
      id: Date.now().toString(),
      title: `Terminal ${tabs.length + 1}`,
      content: [],
      isActive: true
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }
  
  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return
    
    const newTabs = tabs.filter(tab => tab.id !== tabId)
    setTabs(newTabs)
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id)
    }
  }
  
  return (
    <div className={`
      terminal-container bg-gray-950 border-t border-gray-800
      ${isMaximized ? 'fixed inset-4 z-50 rounded-lg shadow-2xl' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <FiTerminal size={16} />
            <span className="text-sm font-medium">Terminal</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={isConnected ? 'Connected' : 'Disconnected'} />
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  px-3 py-1 text-xs rounded-t transition-colors
                  ${tab.id === activeTabId 
                    ? 'bg-gray-800 text-gray-200' 
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                {tab.title}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="ml-2 hover:text-red-400"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={createNewTab}
              className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded"
            >
              <FiPlus size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          >
            {isMaximized ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          >
            {isCollapsed ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: isMaximized ? 'auto' : defaultHeight }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {/* Output */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto py-2 font-mono text-sm"
              style={{ minHeight: 200 }}
              onClick={() => inputRef.current?.focus()}
            >
              {activeTab?.content.map(line => (
                <TerminalLine key={line.id} line={line} />
              ))}
            </div>
            
            {/* Input */}
            <form onSubmit={handleCommand} className="border-t border-gray-800">
              <div className="flex items-center px-4 py-2">
                <span className="text-blue-400 mr-2">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="
                    flex-1 bg-transparent text-gray-200 
                    font-mono text-sm outline-none
                    placeholder-gray-600
                  "
                  placeholder="Type a command..."
                  autoFocus
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Example with enhanced styling
export const StyledTerminal: React.FC<TerminalProps> = (props) => {
  return (
    <div className="terminal-wrapper">
      <Terminal {...props} />
    </div>
  )
}