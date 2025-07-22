import { useState, useEffect } from 'react'
import { useSettingsStore } from '@stores/settingsStore'
import { claudeOAuth } from '@services/claudeOAuth'
import { ClaudeOAuthBridge } from '@services/claudeOAuthBridge'
import clsx from 'clsx'
import { AuthMethod } from '@/types/auth'
import { FiKey, FiUser, FiExternalLink, FiCheck, FiAlertCircle, FiInfo, FiTerminal, FiShield } from 'react-icons/fi'
import { OAuthTester } from './OAuthTester'
import { isElectron, checkOAuthStatus, setupOAuthToken } from '@utils/electronDetection'

export function AISettings() {
  const { settings, updateSettings, isLoading, saveSettings } = useSettingsStore()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('api-key')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState('claude-3-5-sonnet-20241022')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4000)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [showManualFlow, setShowManualFlow] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('')
  const [electronOAuthStatus, setElectronOAuthStatus] = useState<{ exists: boolean; path?: string } | null>(null)

  useEffect(() => {
    // Load settings from store
    if (settings.ai) {
      setAuthMethod(settings.ai.authMethod || 'api-key')
      setApiKey(settings.ai.apiKey || '')
      setModel(settings.ai.model || 'claude-3-5-sonnet-20241022')
      setTemperature(settings.ai.temperature ?? 0.7)
      setMaxTokens(settings.ai.maxTokens || 4000)
    }
    
    // Check Electron OAuth status
    if (isElectron()) {
      checkElectronOAuthStatus()
    }
  }, [settings])
  
  const checkElectronOAuthStatus = async () => {
    try {
      const status = await checkOAuthStatus()
      setElectronOAuthStatus(status)
    } catch (error) {
      console.error('Failed to check Electron OAuth status:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const aiSettings: any = {
        authMethod,
        model,
        temperature,
        maxTokens,
      }
      
      if (authMethod === 'api-key') {
        aiSettings.apiKey = apiKey
      }
      
      await saveSettings({ ai: aiSettings })
      setSaveStatus('success')
      
      // If switching to Claude Code CLI, show additional confirmation
      if (authMethod === 'claude-code-cli') {
        setTimeout(() => {
          setSaveStatus('idle')
        }, 5000) // Show success longer for CLI switch
      } else {
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleOAuthLogin = async () => {
    setIsAuthenticating(true)
    setOauthError(null)
    setShowManualFlow(true)
    setCallbackUrl('') // Clear any previous URL
    
    try {
      const authUrl = await claudeOAuth.initiateLogin()
      console.log('Opening OAuth URL:', authUrl)
      // Open in new window
      window.open(authUrl, '_blank', 'width=600,height=700')
    } catch (error) {
      console.error('OAuth login failed:', error)
      setOauthError('Failed to start authentication')
    } finally {
      setIsAuthenticating(false)
    }
  }
  
  const handleManualCallback = async () => {
    if (!callbackUrl) return
    
    const params = ClaudeOAuthBridge.extractOAuthParams(callbackUrl)
    console.log('Extracted OAuth params:', params)
    
    if (!params) {
      setOauthError('Invalid callback URL. Please copy the entire URL including the code and state.')
      return
    }
    
    setIsAuthenticating(true)
    setOauthError(null)
    
    try {
      // Use the manual callback handler for copy-paste flow
      const tokenResponse = await claudeOAuth.handleManualCallback(params.code, params.state)
      
      // Calculate expiry time
      const expiresAt = claudeOAuth.calculateExpiryTime(tokenResponse.expires_in)
      
      // Save OAuth credentials to settings
      await saveSettings({
        ai: {
          ...settings.ai,
          authMethod: 'oauth-max',
          oauthCredentials: {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt
          }
        }
      })
      
      setShowManualFlow(false)
      setCallbackUrl('')
      
    } catch (error) {
      console.error('OAuth callback error:', error)
      setOauthError(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const models = [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most capable, best for complex tasks' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient for simple tasks' },
  ]

  return (
    <div className="p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium">AI Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Claude AI settings for your development environment
          </p>
          {settings.ai?.authMethod === 'oauth-max' && (
            <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3">
              <FiInfo className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success">Claude Max User?</p>
                <p className="text-xs text-muted-foreground">
                  Switch to Claude Code CLI for the best experience with your Max subscription!
                </p>
              </div>
              <button
                onClick={() => setAuthMethod('claude-code-cli')}
                className="px-3 py-1.5 bg-success text-white text-xs rounded hover:bg-success/90 transition-colors flex-shrink-0"
              >
                Switch Now →
              </button>
            </div>
          )}
        </div>

        {/* Authentication Method Selection */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Authentication Method
            </label>
            <div className="space-y-2">
              {/* Electron OAuth Option - Show only in Electron */}
              {isElectron() && (
                <label
                  className={clsx(
                    'flex gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all relative',
                    authMethod === 'claude-cli'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border hover:bg-accent/50 hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    value="claude-cli"
                    checked={authMethod === 'claude-cli'}
                    onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Claude CLI OAuth</span>
                      <span className="px-2 py-0.5 bg-primary text-white text-xs rounded font-semibold">
                        DESKTOP APP
                      </span>
                      {electronOAuthStatus?.exists && (
                        <span className="px-2 py-0.5 bg-success text-white text-xs rounded">
                          ✓ Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Use your Claude Max subscription via Claude CLI OAuth tokens
                    </div>
                    <div className="text-xs text-primary mt-1 font-medium">
                      ✓ Works with Claude Max subscriptions
                    </div>
                    <div className="text-xs text-primary mt-0.5">
                      ✓ Automatic token detection from Claude CLI
                    </div>
                  </div>
                </label>
              )}
              
              {/* Claude Code CLI Option - MOVED TO TOP */}
              <label
                className={clsx(
                  'flex gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all relative',
                  authMethod === 'claude-code-cli'
                    ? 'border-success bg-success/10 shadow-lg shadow-success/20'
                    : 'border-border hover:bg-accent/50 hover:border-success/50'
                )}
              >
                <input
                  type="radio"
                  value="claude-code-cli"
                  checked={authMethod === 'claude-code-cli'}
                  onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FiTerminal className="w-4 h-4 text-success" />
                    <span className="font-medium text-sm">Claude Code CLI</span>
                    <span className="px-2 py-0.5 bg-success text-white text-xs rounded font-semibold animate-pulse">
                      BEST FOR MAX USERS
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    The official way to use your Claude Max subscription with Love Claude Code
                  </div>
                  <div className="text-xs text-success mt-1 font-medium">
                    ✓ Works perfectly with Claude Max subscriptions
                  </div>
                  <div className="text-xs text-success mt-0.5">
                    ✓ Full access to all Claude features
                  </div>
                </div>
              </label>
              
              <label
                className={clsx(
                  'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  authMethod === 'api-key'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent/50'
                )}
              >
                <input
                  type="radio"
                  value="api-key"
                  checked={authMethod === 'api-key'}
                  onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FiKey className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">API Key</span>
                    <span className="text-xs text-muted-foreground">(Pay per use)</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Use your Anthropic API key for direct access to Claude's developer API
                  </div>
                </div>
              </label>
              
              <label
                className={clsx(
                  'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors opacity-60',
                  authMethod === 'oauth-max'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent/50'
                )}
              >
                <input
                  type="radio"
                  value="oauth-max"
                  checked={authMethod === 'oauth-max'}
                  onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">OAuth (Limited)</span>
                    <span className="text-xs text-warning">(Not recommended)</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Connect your claude.ai account (experimental, limited functionality)
                  </div>
                  <div className="text-xs text-warning mt-1">
                    ⚠️ OAuth has limitations - use Claude Code CLI instead for Max subscriptions
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* API Key Section - Only show for API key auth */}
        {authMethod === 'api-key' && (
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium mb-2">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="input pr-24 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs hover:bg-accent rounded"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>
        </div>
        )}
        
        {/* OAuth Authentication Section - Only show for OAuth auth */}
        {authMethod === 'oauth-max' && (
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Claude Max Authentication
            </label>
            
            {settings.ai?.oauthCredentials ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                  <FiCheck className="w-5 h-5 text-success" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Connected to Claude Max</p>
                    <p className="text-xs text-muted-foreground">
                      Your account is authenticated and ready to use
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Clear OAuth credentials
                    saveSettings({
                      ai: {
                        ...settings.ai,
                        oauthCredentials: undefined
                      }
                    })
                  }}
                  className="text-sm text-destructive hover:underline"
                >
                  Disconnect Account
                </button>
                
                {/* OAuth Tester for debugging */}
                <div className="mt-4">
                  <OAuthTester />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg mb-4">
                  <p className="text-sm text-warning font-medium">⚠️ Important: OAuth Limitation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    OAuth tokens from claude.ai cannot be used with the Anthropic developer SDK.
                  </p>
                  <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded">
                    <p className="text-xs font-medium text-success mb-2">✨ Solution for Claude Max Users:</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use the <strong>Claude Code CLI</strong> authentication method instead - it works perfectly with your Max subscription!
                    </p>
                    <button
                      onClick={() => setAuthMethod('claude-code-cli')}
                      className="mt-2 px-3 py-1.5 bg-success text-white text-xs rounded hover:bg-success/90 transition-colors"
                    >
                      Switch to Claude Code CLI →
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Claude.ai account to use your Max subscription
                </p>
                <button
                  onClick={handleOAuthLogin}
                  disabled={isAuthenticating}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors',
                    isAuthenticating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <FiExternalLink className="w-4 h-4" />
                  {isAuthenticating ? 'Authenticating...' : 'Sign in with Claude'}
                </button>
                {oauthError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <FiAlertCircle className="w-4 h-4" />
                    {oauthError}
                  </div>
                )}
                
                {showManualFlow && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <FiInfo className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium mb-1">Complete OAuth Authentication</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                          <li>Click "Authorize" in the popup window</li>
                          <li>You'll be redirected to console.anthropic.com/oauth/code/callback</li>
                          <li>Copy the ENTIRE URL from your browser</li>
                          <li>Paste it below and click "Complete Authentication"</li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <textarea
                        value={callbackUrl}
                        onChange={(e) => setCallbackUrl(e.target.value)}
                        placeholder="https://console.anthropic.com/oauth/code/callback?code=...#state"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono resize-none"
                        rows={3}
                      />
                      <button
                        onClick={handleManualCallback}
                        disabled={!callbackUrl || isAuthenticating}
                        className={clsx(
                          'w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors',
                          (!callbackUrl || isAuthenticating) && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {isAuthenticating ? 'Processing...' : 'Complete Authentication'}
                      </button>
                      {callbackUrl && (
                        <div className="text-xs text-muted-foreground">
                          URL Length: {callbackUrl.length} characters
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
        
        {/* Electron Claude CLI OAuth Section - Only show for claude-cli auth in Electron */}
        {isElectron() && authMethod === 'claude-cli' && (
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Claude CLI OAuth Setup
            </label>
            
            <div className="space-y-4">
              {electronOAuthStatus?.exists ? (
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-success mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">OAuth Token Detected</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Found OAuth token at: {electronOAuthStatus.path}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your Claude Max subscription is ready to use!
                      </p>
                    </div>
                    <button
                      onClick={checkElectronOAuthStatus}
                      className="text-xs text-primary hover:underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm font-medium">OAuth Token Not Found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run `claude setup-token` to authenticate with your Claude Max account
                    </p>
                  </div>
                  
                  <button
                    onClick={async () => {
                      setIsAuthenticating(true)
                      try {
                        const result = await setupOAuthToken()
                        if (result.success) {
                          await checkElectronOAuthStatus()
                        } else {
                          setOauthError(result.error || 'Failed to setup OAuth token')
                        }
                      } catch (error) {
                        setOauthError('Failed to run claude setup-token')
                      } finally {
                        setIsAuthenticating(false)
                      }
                    }}
                    disabled={isAuthenticating}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors',
                      isAuthenticating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <FiShield className="w-4 h-4" />
                    {isAuthenticating ? 'Setting up...' : 'Run claude setup-token'}
                  </button>
                  
                  {oauthError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <FiAlertCircle className="w-4 h-4" />
                      {oauthError}
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">How it works:</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                  <li>Claude CLI stores OAuth tokens in ~/.claude directory</li>
                  <li>Love Claude Code automatically detects these tokens</li>
                  <li>When you send messages, they use your Claude Max subscription</li>
                  <li>No API key needed - just your Claude Max account!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Claude Code CLI Section - Only show for Claude Code CLI auth */}
        {authMethod === 'claude-code-cli' && (
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Claude Code CLI Setup
            </label>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Installation Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    Install Claude Code CLI:
                    <code className="ml-2 px-2 py-1 bg-background rounded text-xs">
                      npm install -g @anthropic-ai/claude-code
                    </code>
                  </li>
                  <li>
                    Authenticate with your Claude Max account:
                    <code className="ml-2 px-2 py-1 bg-background rounded text-xs">
                      claude setup-token
                    </code>
                  </li>
                  <li>
                    Verify it's working:
                    <code className="ml-2 px-2 py-1 bg-background rounded text-xs">
                      claude -p "Hello"
                    </code>
                  </li>
                </ol>
              </div>
              
              <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-sm font-medium">✓ How it works</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When you send messages in Love Claude Code, the system will automatically use the 
                  authenticated Claude Code CLI to process your requests. This works seamlessly with 
                  your Claude Max subscription.
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <a
                  href="https://github.com/anthropics/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Claude Code Documentation
                  <FiExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Model Selection */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Model
            </label>
            <div className="space-y-2">
              {models.map((m) => (
                <label
                  key={m.id}
                  className={clsx(
                    'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    model === m.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
                  )}
                >
                  <input
                    type="radio"
                    value={m.id}
                    checked={model === m.id}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Advanced Settings</h3>
          
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>More focused</span>
              <span>More creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label htmlFor="max-tokens" className="block text-sm font-medium mb-2">
              Max Tokens
            </label>
            <input
              id="max-tokens"
              type="number"
              min="100"
              max="8000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="input w-32"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum response length (100-8000)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {saveStatus === 'success' && (
              <span className="text-sm text-success flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  {authMethod === 'claude-code-cli' 
                    ? 'Settings saved! You can now use Claude commands in the terminal.'
                    : 'Settings saved'
                  }
                </span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-destructive">
                Failed to save settings
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || (authMethod === 'api-key' && !apiKey) || (authMethod === 'oauth-max' && !settings.ai?.oauthCredentials) || (isElectron() && authMethod === 'claude-cli' && !electronOAuthStatus?.exists)}
            className={clsx(
              'btn-primary h-9 px-4 text-sm',
              (isSaving || (authMethod === 'api-key' && !apiKey) || (authMethod === 'oauth-max' && !settings.ai?.oauthCredentials) || (isElectron() && authMethod === 'claude-cli' && !electronOAuthStatus?.exists)) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}