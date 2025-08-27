import { useState } from 'react'
import { api } from '@services/api'
import { FiPlay, FiInfo, FiAlertCircle } from 'react-icons/fi'
import clsx from 'clsx'

interface TestResult {
  anthropicSDK?: any
  directAPI?: any
  claudeAI?: any
  apiKey?: any
}

export function OAuthTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runOAuthTest = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)
    
    try {
      // First get token info
      const infoResponse = await (api as any).client.get('/oauth-test/info')
      setTokenInfo(infoResponse.data)
      
      // Then run authentication tests
      const testResponse = await (api as any).client.post('/oauth-test/test', {
        message: 'Testing OAuth authentication'
      })
      
      setResults(testResponse.data.results)
    } catch (err: any) {
      console.error('OAuth test failed:', err)
      setError(err.response?.data?.message || err.message || 'Test failed')
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌'
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'text-success' : 'text-destructive'
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-start gap-2">
        <FiInfo className="w-5 h-5 text-primary mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium mb-1">OAuth Authentication Tester</h3>
          <p className="text-sm text-muted-foreground">
            Test your OAuth token with different Claude API endpoints to find compatible authentication methods.
          </p>
        </div>
      </div>

      <button
        onClick={runOAuthTest}
        disabled={isRunning}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors',
          isRunning && 'opacity-50 cursor-not-allowed'
        )}
      >
        <FiPlay className="w-4 h-4" />
        {isRunning ? 'Running Tests...' : 'Run OAuth Tests'}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <FiAlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {tokenInfo && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Token Information</h4>
          <div className="bg-background p-3 rounded-lg border border-border text-sm font-mono">
            <div>Type: {tokenInfo.tokenType}</div>
            <div>Length: {tokenInfo.length} characters</div>
            <div>Preview: {tokenInfo.prefix}</div>
            {tokenInfo.payload && (
              <details className="mt-2">
                <summary className="cursor-pointer text-primary hover:underline">Token Payload</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(tokenInfo.payload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Results</h4>
          
          <div className="space-y-2">
            {Object.entries(results).map(([method, result]: [string, any]) => (
              <div key={method} className="bg-background p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{method}</span>
                  <span className={clsx('text-sm', getStatusColor(result.success))}>
                    {getStatusIcon(result.success)} {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.status && (
                  <div className="text-xs text-muted-foreground">
                    Status: {result.status}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-xs text-destructive mt-1">
                    Error: {result.error}
                  </div>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-primary hover:underline">
                      Response Data
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto bg-muted/50 p-2 rounded">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}