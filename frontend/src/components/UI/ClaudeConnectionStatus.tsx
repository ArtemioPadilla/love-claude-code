import React from 'react'
import { useSettingsStore } from '@stores/settingsStore'
import { Bot, BotOff, Key, User, Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const ClaudeConnectionStatus: React.FC = () => {
  const { settings } = useSettingsStore()
  
  const authMethod = settings.ai?.authMethod || 'api-key'
  const hasApiKey = !!settings.ai?.apiKey
  const hasOAuthCredentials = !!settings.ai?.oauthCredentials
  
  const isConfigured = authMethod === 'api-key' ? hasApiKey : 
                      authMethod === 'oauth-max' ? hasOAuthCredentials :
                      authMethod === 'claude-code-cli' ? true : false
  
  const getStatusIcon = () => {
    if (!isConfigured) return <BotOff className="w-4 h-4 text-red-500" />
    
    if (authMethod === 'api-key') {
      return <Key className="w-4 h-4 text-green-500" />
    } else if (authMethod === 'claude-code-cli') {
      return <Terminal className="w-4 h-4 text-green-500" />
    }
    
    return <User className="w-4 h-4 text-green-500" />
  }
  
  const getStatusText = () => {
    if (!isConfigured) return 'Claude Not Configured'
    
    if (authMethod === 'api-key') {
      return 'Claude API Key'
    } else if (authMethod === 'claude-code-cli') {
      return 'Claude Code CLI'
    }
    
    return 'Claude Max'
  }
  
  const getStatusColor = () => {
    return isConfigured ? 'text-green-500' : 'text-red-500'
  }
  
  const getStatusBgColor = () => {
    return isConfigured ? 'bg-green-500' : 'bg-red-500'
  }
  
  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={`claude-${isConfigured}-${authMethod}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {getStatusIcon()}
        </motion.div>
      </AnimatePresence>
      
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusBgColor()} ${isConfigured ? 'animate-pulse' : ''}`} />
        <span className={`text-xs ${getStatusColor()}`}>{getStatusText()}</span>
      </div>
      
      {!isConfigured && (
        <span className="text-xs text-gray-400">
          (Configure in Settings)
        </span>
      )}
    </div>
  )
}

export default ClaudeConnectionStatus