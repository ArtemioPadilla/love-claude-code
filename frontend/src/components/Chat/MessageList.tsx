import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCpu, FiUser, FiCopy, FiCheck, FiCode } from 'react-icons/fi'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  isCompact?: boolean
}

export function MessageList({ messages, isLoading, isCompact = false }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
  
  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div ref={scrollRef} className={`flex-1 overflow-y-auto ${isCompact ? 'p-3 space-y-3' : 'p-6 space-y-4'} scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent`}>
      {/* Welcome message when no messages */}
      {messages.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center ${isCompact ? 'py-8 px-4' : 'py-12 px-6'}`}
        >
          <motion.div 
            className={`${isCompact ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center`}
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(59, 130, 246, 0.2)',
                '0 0 40px rgba(59, 130, 246, 0.4)',
                '0 0 20px rgba(59, 130, 246, 0.2)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FiCpu size={isCompact ? 24 : 32} className="text-primary" />
          </motion.div>
          <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold gradient-text mb-2`}>
            Welcome to AI Assistant
          </h3>
          <p className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground max-w-md mx-auto`}>
            I'm here to help you build amazing things. Ask me anything about
            coding, debugging, or software architecture!
          </p>
        </motion.div>
      )}
      
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
            className={clsx(
              `flex ${isCompact ? 'gap-2' : 'gap-3'}`,
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
          <div
            className={clsx(
              `flex max-w-[85%] ${isCompact ? 'gap-2' : 'gap-3'}`,
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={clsx(
                `${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0 shadow-soft`,
                message.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-gradient-to-br from-primary to-blue-600'
              )}
            >
              {message.role === 'user' ? 
                <FiUser size={isCompact ? 14 : 18} className="text-white" /> : 
                <FiCpu size={isCompact ? 14 : 18} className="text-white" />
              }
            </motion.div>

            {/* Message Content */}
            <div className="group">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  `rounded-2xl ${isCompact ? 'px-3 py-2' : 'px-4 py-3'} shadow-soft relative`,
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/30'
                    : 'bg-card/80 backdrop-blur-sm border border-border/50'
                )}
              >
                <p className={`${isCompact ? 'text-xs' : 'text-sm'} whitespace-pre-wrap leading-relaxed`}>{message.content}</p>
                
                {/* Copy button for assistant messages */}
                {message.role === 'assistant' && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/50 opacity-0 group-hover:opacity-100 transition-all hover:bg-background/80"
                    title="Copy message"
                  >
                    {copiedId === message.id ? 
                      <FiCheck size={14} className="text-success" /> : 
                      <FiCopy size={14} className="text-muted-foreground" />
                    }
                  </motion.button>
                )}
              </motion.div>
              
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
                  {formatTime(message.timestamp)}
                </span>
                {message.role === 'assistant' && message.content.includes('```') && (
                  <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-muted-foreground flex items-center gap-1`}>
                    <FiCode size={isCompact ? 10 : 12} />
                    Contains code
                  </span>
                )}
              </div>
            </div>
          </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className={`flex max-w-[85%] ${isCompact ? 'space-x-2' : 'space-x-2'}`}>
            <div className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0`}>
              <FiCpu size={isCompact ? 14 : 18} className="text-white" />
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`bg-card/80 backdrop-blur-sm border border-border/50 ${isCompact ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3'} shadow-soft`}
            >
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}