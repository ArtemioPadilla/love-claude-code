import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiSend,
  FiPaperclip,
  FiMic,
  FiSettings,
  FiMaximize2,
  FiMinimize2,
  FiTrash2,
  FiDownload,
  FiCpu
} from 'react-icons/fi'
import { MessageList } from './MessageList'
import { useChatStore } from '@stores/chatStore'

interface ChatProps {
  className?: string
}

export function Chat({ className = '' }: ChatProps) {
  const { messages, isLoading, sendMessage, clearChat } = useChatStore()
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [isVeryNarrow, setIsVeryNarrow] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`
    }
  }, [input])

  useEffect(() => {
    // Detect narrow width for compact mode
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setContainerWidth(width)
        setIsCompact(width < 300)
        setIsVeryNarrow(width < 200)
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getPlaceholderText = () => {
    if (containerWidth < 200) return "Message..."
    if (containerWidth < 250) return "Ask AI..."
    if (containerWidth < 300) return "Ask a question..."
    return "What can I help you with?"
  }

  return (
    <motion.div 
      ref={containerRef}
      className={`
        flex flex-col h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden
        ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Chat Header */}
      <div className={`${isCompact ? 'h-12' : 'h-14'} flex items-center justify-between ${isCompact ? 'px-2' : 'px-4'} border-b border-border/50 bg-gradient-subtle`}>
        <div className={`flex items-center ${isCompact ? 'space-x-2' : 'space-x-3'}`}>
          <motion.div 
            className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-glow flex-shrink-0`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiCpu className="text-primary-foreground" size={isCompact ? 16 : 20} />
          </motion.div>
          <div className="min-w-0">
            <h2 className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold gradient-text truncate`}>
              {isCompact ? 'AI' : 'AI Assistant'}
            </h2>
            {!isCompact && (
              <span className="text-xs text-muted-foreground">Your coding companion</span>
            )}
          </div>
        </div>
        <div className={`flex items-center ${isCompact ? 'gap-0' : 'gap-1'}`}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowActions(!showActions)}
            className={`${isCompact ? 'p-1.5' : 'p-2'} rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground`}
            title="Settings"
          >
            <FiSettings size={isCompact ? 14 : 16} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${isCompact ? 'p-1.5' : 'p-2'} rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground`}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <FiMinimize2 size={isCompact ? 14 : 16} /> : <FiMaximize2 size={isCompact ? 14 : 16} />}
          </motion.button>
        </div>
      </div>
      
      {/* Actions Menu */}
      {showActions && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-border/50 bg-card/30"
        >
          <div className="p-3 flex items-center gap-2">
            <button
              onClick={() => {
                clearChat()
                setShowActions(false)
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <FiTrash2 size={14} />
              Clear Chat
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-all">
              <FiDownload size={14} />
              Export
            </button>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} isCompact={isCompact} />

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border/50 bg-gradient-subtle">
        <div className={isCompact ? 'p-2' : 'p-4'}>
          <div className={`flex items-center bg-background/50 border border-border/50 ${isCompact ? 'rounded-lg' : 'rounded-xl'} focus-within:border-primary/50 focus-within:shadow-glow transition-all`}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isVeryNarrow ? 'p-1.5' : isCompact ? 'p-2' : 'p-3'} text-muted-foreground hover:text-foreground hover:bg-accent/50 ${isCompact ? 'rounded-l-lg' : 'rounded-l-xl'} transition-all self-end`}
              title="Attach file"
            >
              <FiPaperclip size={isVeryNarrow ? 14 : isCompact ? 16 : 18} />
            </motion.button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              className={`flex-1 ${isCompact ? 'py-2 px-1' : 'py-3 px-2'} bg-transparent ${isCompact ? 'text-xs' : 'text-sm'} resize-none outline-none
                       placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50
                       max-h-32 ${isCompact ? 'min-h-[40px]' : 'min-h-[48px]'} leading-relaxed`}
              rows={1}
              disabled={isLoading}
            />
            
            <div className={`flex items-center ${isVeryNarrow ? 'gap-0' : 'gap-1'} ${isCompact ? 'p-1' : 'p-2'}`}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${isCompact ? 'p-1.5' : 'p-2'} text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-all`}
                title="Voice input"
              >
                <FiMic size={isCompact ? 14 : 18} />
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
                className={`
                  ${isCompact ? 'p-1.5' : 'p-2'} rounded-md transition-all
                  ${input.trim() && !isLoading
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow hover:shadow-lg'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
                title="Send message"
              >
                <FiSend size={isCompact ? 16 : 18} />
              </motion.button>
            </div>
          </div>
          
          {!isCompact && (
            <div className="mt-3 flex items-center justify-between px-1">
            <motion.span 
              className="text-xs text-muted-foreground flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isLoading ? (
                <>
                  <span className="loading-dots inline-flex">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span className="ml-2">AI is thinking...</span>
                </>
              ) : (
                <>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, 
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">Shift+Enter</kbd> for new line</>
              )}
            </motion.span>
            {!isVeryNarrow && (
              <motion.button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Format code
              </motion.button>
            )}
          </div>
          )}
        </div>
      </form>
    </motion.div>
  )
}