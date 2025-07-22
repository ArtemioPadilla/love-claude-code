import { useEffect, useState } from 'react'
import { Shield, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import { Button } from '@components/UI/Button'
import { Badge } from '@components/UI/Badge'
import { isElectron, checkOAuthStatus, setupOAuthToken } from '@utils/electronDetection'
import { useSettingsStore } from '@stores/settingsStore'
import { useChatStore } from '@stores/chatStore'

export function OAuthStatus() {
  const [oauthStatus, setOAuthStatus] = useState<{ exists: boolean; path?: string } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const { settings } = useSettingsStore()
  const checkStoreOAuthStatus = useChatStore((state) => state.checkOAuthStatus)
  
  const authMethod = settings.ai?.authMethod || 'api-key'
  
  // Only show in Electron with Claude CLI auth method
  if (!isElectron() || authMethod !== 'claude-cli') {
    return null
  }
  
  useEffect(() => {
    checkStatus()
  }, [])
  
  const checkStatus = async () => {
    setIsChecking(true)
    try {
      const status = await checkOAuthStatus()
      setOAuthStatus(status)
      // Also update the chat store
      await checkStoreOAuthStatus()
    } catch (error) {
      console.error('Failed to check OAuth status:', error)
      setOAuthStatus({ exists: false })
    } finally {
      setIsChecking(false)
    }
  }
  
  const handleSetupOAuth = async () => {
    setIsSettingUp(true)
    try {
      const result = await setupOAuthToken()
      if (result.success) {
        // Recheck status after setup
        await checkStatus()
      } else {
        console.error('OAuth setup failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to setup OAuth:', error)
    } finally {
      setIsSettingUp(false)
    }
  }
  
  if (isChecking || !oauthStatus) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking OAuth status...</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      {oauthStatus.exists ? (
        <>
          <Badge variant="success" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Claude Max Connected
          </Badge>
          {oauthStatus.path && (
            <span className="text-xs text-muted-foreground" title={oauthStatus.path}>
              via CLI OAuth
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            disabled={isChecking}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </>
      ) : (
        <>
          <Badge variant="warning" className="flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            OAuth Not Setup
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSetupOAuth}
            disabled={isSettingUp}
            className="h-6 px-2 text-xs"
          >
            {isSettingUp ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Setup OAuth
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}