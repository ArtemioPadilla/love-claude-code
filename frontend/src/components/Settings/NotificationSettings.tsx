import { useState, useEffect } from 'react'
import { Bell, Volume2, VolumeX, Info } from 'lucide-react'
import { Switch } from '@components/UI/Switch'
import { Button } from '@components/UI/Button'
import { isElectron, getElectronAPI } from '@utils/electronDetection'
import { showSuccessNotification, showInfoNotification } from '@utils/notifications'
import clsx from 'clsx'

interface NotificationPreferences {
  enabled: boolean
  soundEnabled: boolean
  showInSystemTray: boolean
  groupByType: boolean
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    soundEnabled: true,
    showInSystemTray: true,
    groupByType: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('notificationPreferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
      }
    }
  }, [])

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
  }

  const savePreferences = async () => {
    setSaving(true)
    
    try {
      // Save to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences))
      
      // Update Electron notification service
      if (isElectron()) {
        const electronAPI = getElectronAPI()
        await electronAPI.notification.updatePreferences(preferences)
      }
      
      await showSuccessNotification(
        'Settings Saved',
        'Notification preferences updated successfully'
      )
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async () => {
    await showInfoNotification(
      'Test Notification',
      'This is a test notification from Love Claude Code'
    )
  }

  if (!isElectron()) {
    return (
      <div className="p-6 bg-accent/10 rounded-lg">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5" />
          <p>Notification settings are only available in the desktop app.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Notification Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Enable Notifications */}
        <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">
                Show system notifications for important events
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
          />
        </div>

        {/* Sound */}
        <div className={clsx(
          'flex items-center justify-between p-4 bg-accent/10 rounded-lg transition-opacity',
          !preferences.enabled && 'opacity-50'
        )}>
          <div className="flex items-center gap-3">
            {preferences.soundEnabled ? (
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Notification Sounds</p>
              <p className="text-sm text-muted-foreground">
                Play sounds with notifications
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.soundEnabled}
            onCheckedChange={(checked) => handlePreferenceChange('soundEnabled', checked)}
            disabled={!preferences.enabled}
          />
        </div>

        {/* System Tray */}
        <div className={clsx(
          'flex items-center justify-between p-4 bg-accent/10 rounded-lg transition-opacity',
          !preferences.enabled && 'opacity-50'
        )}>
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <div className="h-3 w-3 bg-muted-foreground rounded-sm" />
            </div>
            <div>
              <p className="font-medium">Show in System Tray</p>
              <p className="text-sm text-muted-foreground">
                Display notification count in system tray
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.showInSystemTray}
            onCheckedChange={(checked) => handlePreferenceChange('showInSystemTray', checked)}
            disabled={!preferences.enabled}
          />
        </div>

        {/* Group Similar */}
        <div className={clsx(
          'flex items-center justify-between p-4 bg-accent/10 rounded-lg transition-opacity',
          !preferences.enabled && 'opacity-50'
        )}>
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="h-2 w-2 bg-muted-foreground rounded-sm" />
                <div className="h-2 w-2 bg-muted-foreground rounded-sm" />
                <div className="h-2 w-2 bg-muted-foreground rounded-sm" />
                <div className="h-2 w-2 bg-muted-foreground rounded-sm" />
              </div>
            </div>
            <div>
              <p className="font-medium">Group Similar Notifications</p>
              <p className="text-sm text-muted-foreground">
                Combine similar notifications to reduce noise
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.groupByType}
            onCheckedChange={(checked) => handlePreferenceChange('groupByType', checked)}
            disabled={!preferences.enabled}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          variant="primary"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button
          variant="outline"
          onClick={testNotification}
          disabled={!preferences.enabled}
        >
          Test Notification
        </Button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> Make sure Love Claude Code has permission to show notifications in your system settings.
        </p>
      </div>
    </div>
  )
}