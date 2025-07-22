import React from 'react'
import { AlertCircle, RefreshCw, Code2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface BackendOfflineNoticeProps {
  onRetry?: () => void
  className?: string
}

export const BackendOfflineNotice: React.FC<BackendOfflineNoticeProps> = ({
  onRetry,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-200 mb-1">
            Backend Offline - Demo Mode
          </h3>
          <p className="text-xs text-yellow-300/80 mb-3">
            The backend server is not running. You can still explore the UI, but features like saving files, 
            running code, and AI assistance won't be available.
          </p>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-yellow-400">
              <Code2 className="w-4 h-4" />
              <span>To start backend: <code className="bg-yellow-900/30 px-1 py-0.5 rounded">npm run dev:backend</code></span>
            </div>
            
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-yellow-300 hover:text-yellow-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BackendOfflineNotice