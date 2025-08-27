import { useState } from 'react'
import { FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi'
import { api } from '@services/api'
import clsx from 'clsx'

export function AuthTestButton() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsTesting(true)
    setError(null)
    
    try {
      // Try to get Claude models as a simple test
      const models = await api.getClaudeModels()
      setIsConnected(true)
      console.log('Auth test successful, models:', models)
    } catch (err) {
      setIsConnected(false)
      const error = err as Error & { response?: { data?: { message?: string } } }
      const errorMessage = error.response?.data?.message || error.message || 'Connection failed'
      setError(errorMessage)
      console.error('Auth test failed:', err)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={testConnection}
        disabled={isTesting}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all',
          isTesting && 'opacity-50 cursor-not-allowed',
          isConnected === true && 'bg-green-500/20 text-green-500 hover:bg-green-500/30',
          isConnected === false && 'bg-red-500/20 text-red-500 hover:bg-red-500/30',
          isConnected === null && 'bg-muted hover:bg-accent'
        )}
        title={error || 'Test Claude connection'}
      >
        {isTesting ? (
          <FiRefreshCw className="w-3 h-3 animate-spin" />
        ) : isConnected === true ? (
          <FiWifi className="w-3 h-3" />
        ) : isConnected === false ? (
          <FiWifiOff className="w-3 h-3" />
        ) : (
          <FiWifi className="w-3 h-3" />
        )}
        {isTesting ? 'Testing...' : 'Test Auth'}
      </button>
      
      {isConnected !== null && !isTesting && (
        <span className={clsx(
          'text-xs',
          isConnected ? 'text-green-500' : 'text-red-500'
        )}>
          {isConnected ? '✓ Connected' : '✗ Failed'}
        </span>
      )}
    </div>
  )
}