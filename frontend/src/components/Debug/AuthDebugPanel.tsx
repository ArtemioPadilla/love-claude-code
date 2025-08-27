import { useState } from 'react'
import { useSettingsStore } from '@stores/settingsStore'
import { FiTool, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi'
import clsx from 'clsx'

export function AuthDebugPanel() {
  const { settings } = useSettingsStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [testResult, setTestResult] = useState<{
    status?: number
    ok?: boolean
    headers?: Record<string, string>
    body?: unknown
    error?: string
  } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const runAuthTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      // Direct test of authentication
      const response = await fetch('http://localhost:8000/api/v1/claude/models', {
        headers: {
          'Content-Type': 'application/json',
          'X-Claude-Auth': settings.ai?.oauthCredentials 
            ? `Bearer ${settings.ai.oauthCredentials.accessToken}`
            : '',
        }
      })
      
      const data = await response.text()
      
      setTestResult({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      })
    } catch (error) {
      const err = error as Error
      setTestResult({
        error: err.message
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getStoredSettings = () => {
    const stored = localStorage.getItem('love-claude-code-settings')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  }

  const storedSettings = getStoredSettings()

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-black rounded-lg shadow-lg hover:bg-yellow-600 transition-colors"
        >
          <FiTool className="w-4 h-4" />
          Auth Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <h3 className="font-medium flex items-center gap-2">
          <FiTool className="w-4 h-4 text-yellow-500" />
          Authentication Debug Panel
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-accent rounded"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
        {/* Current Settings */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Settings (Zustand Store)</h4>
          <div className="bg-muted/50 p-3 rounded text-xs font-mono space-y-1">
            <div>Auth Method: {settings.ai?.authMethod || 'none'}</div>
            <div>Has API Key: {settings.ai?.apiKey ? <FiCheck className="inline w-3 h-3 text-green-500" /> : <FiX className="inline w-3 h-3 text-red-500" />}</div>
            <div>Has OAuth: {settings.ai?.oauthCredentials ? <FiCheck className="inline w-3 h-3 text-green-500" /> : <FiX className="inline w-3 h-3 text-red-500" />}</div>
            {settings.ai?.oauthCredentials && (
              <>
                <div>OAuth Token: {settings.ai.oauthCredentials.accessToken.substring(0, 20)}...</div>
                <div>Token Length: {settings.ai.oauthCredentials.accessToken.length}</div>
                <div>Expires At: {new Date(settings.ai.oauthCredentials.expiresAt).toLocaleString()}</div>
                <div>Expired: {Date.now() > settings.ai.oauthCredentials.expiresAt ? 'Yes' : 'No'}</div>
              </>
            )}
          </div>
        </div>

        {/* LocalStorage Settings */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">LocalStorage Settings</h4>
          <div className="bg-muted/50 p-3 rounded text-xs font-mono space-y-1">
            {storedSettings ? (
              <>
                <div>Found: <FiCheck className="inline w-3 h-3 text-green-500" /></div>
                <div>Auth Method: {storedSettings.state?.settings?.ai?.authMethod || 'none'}</div>
                <div>Has OAuth: {storedSettings.state?.settings?.ai?.oauthCredentials ? 'Yes' : 'No'}</div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary hover:underline">Full Data</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(storedSettings, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <div>Not Found <FiX className="inline w-3 h-3 text-red-500" /></div>
            )}
          </div>
        </div>

        {/* API Token */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">JWT Token</h4>
          <div className="bg-muted/50 p-3 rounded text-xs font-mono">
            {localStorage.getItem('auth_token') ? (
              <>
                <div>Found: <FiCheck className="inline w-3 h-3 text-green-500" /></div>
                <div>Token: {localStorage.getItem('auth_token')?.substring(0, 20)}...</div>
              </>
            ) : (
              <div>Not Found <FiX className="inline w-3 h-3 text-red-500" /></div>
            )}
          </div>
        </div>

        {/* Test Authentication */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Authentication</h4>
          <button
            onClick={runAuthTest}
            disabled={isTesting}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors w-full justify-center',
              isTesting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <FiRefreshCw className={clsx('w-4 h-4', isTesting && 'animate-spin')} />
            {isTesting ? 'Testing...' : 'Test Auth Headers'}
          </button>
          
          {testResult && (
            <div className="bg-muted/50 p-3 rounded text-xs font-mono space-y-1">
              <div>Status: {testResult.status} {testResult.ok ? '✅' : '❌'}</div>
              {testResult.error && <div>Error: {testResult.error}</div>}
              {testResult.body != null && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary hover:underline">Response</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {typeof testResult.body === 'string' ? testResult.body : JSON.stringify(testResult.body, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-warning/10 p-3 rounded">
          <p className="font-medium mb-1">Debug Info:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check if OAuth credentials are present in both store and localStorage</li>
            <li>Verify the OAuth token format and length</li>
            <li>Test button sends a request with OAuth headers</li>
            <li>If auth fails, try re-authenticating in Settings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}