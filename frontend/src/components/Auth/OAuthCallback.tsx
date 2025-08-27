import { useEffect, useState } from 'react'
import { useNavigate } from '../Navigation'
import { claudeOAuth } from '@services/claudeOAuth'
import { useSettingsStore } from '@stores/settingsStore'
import { FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'

export function OAuthCallback() {
  const navigate = useNavigate()
  const { saveSettings } = useSettingsStore()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL params
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')
        const errorParam = params.get('error')
        
        if (errorParam) {
          const errorDescription = params.get('error_description')
          throw new Error(errorDescription || `OAuth error: ${errorParam}`)
        }
        
        if (!code || !state) {
          throw new Error('Missing authorization code or state')
        }
        
        // Exchange code for tokens
        const tokenResponse = await claudeOAuth.handleCallback(code, state)
        
        // Calculate expiry time
        const expiresAt = claudeOAuth.calculateExpiryTime(tokenResponse.expires_in)
        
        // Save OAuth credentials to settings
        await saveSettings({
          ai: {
            authMethod: 'oauth-max',
            oauthCredentials: {
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              expiresAt
            },
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.7,
            maxTokens: 4096
          }
        })
        
        setStatus('success')
        
        // Redirect after success
        setTimeout(() => {
          navigate('projects')
        }, 2000)
        
      } catch (error) {
        console.error('OAuth callback error:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed')
        setStatus('error')
      }
    }
    
    handleCallback()
  }, [navigate, saveSettings])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-card border border-border rounded-lg p-8 shadow-2xl text-center">
          {status === 'processing' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <FiLoader className="w-12 h-12 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Completing Authentication</h2>
              <p className="text-muted-foreground">
                Please wait while we complete your Claude Max authentication...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-block mb-4"
              >
                <FiCheckCircle className="w-12 h-12 text-success" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Authentication Successful!</h2>
              <p className="text-muted-foreground">
                Your Claude Max account has been connected. Redirecting...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-block mb-4"
              >
                <FiXCircle className="w-12 h-12 text-destructive" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Authentication Failed</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'An error occurred during authentication'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('projects')}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Return to Projects
                </button>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}