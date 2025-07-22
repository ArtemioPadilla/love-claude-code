import React, { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConnectionStatusProps {
  checkInterval?: number
  apiUrl?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  checkInterval = 30000, // 30 seconds instead of 5
  apiUrl = '/health'
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}${apiUrl}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      setIsConnected(response.ok)
      setLastChecked(new Date())
    } catch (error) {
      setIsConnected(false)
      setLastChecked(new Date())
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    // Initial check
    checkConnection()

    // Set up interval
    const interval = setInterval(checkConnection, checkInterval)

    return () => clearInterval(interval)
  }, [checkInterval])

  const getStatusColor = () => {
    if (isConnected === null) return 'bg-gray-400'
    return isConnected ? 'bg-green-500' : 'bg-red-500'
  }

  const getStatusText = () => {
    if (isConnected === null) return 'Checking connection...'
    return isConnected ? 'Connected' : 'Disconnected'
  }

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {isChecking ? (
          <motion.div
            key="checking"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`} />
        <span className="text-xs text-gray-400">{getStatusText()}</span>
      </div>

      {!isConnected && (
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="ml-2 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default ConnectionStatus