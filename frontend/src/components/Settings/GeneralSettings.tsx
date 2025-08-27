import { useState, useEffect } from 'react'
import { useSettingsStore } from '@stores/settingsStore'
import clsx from 'clsx'

export function GeneralSettings() {
  const { settings, saveSettings } = useSettingsStore()
  const [appName, setAppName] = useState('Love Claude Code')
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [language, setLanguage] = useState('en')
  const [autoSave, setAutoSave] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState(30)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (settings.general) {
      setAppName(settings.general.appName || 'Love Claude Code')
      setTheme(settings.general.theme || 'dark')
      setLanguage(settings.general.language || 'en')
      setAutoSave(settings.general.autoSave ?? true)
      setAutoSaveInterval(settings.general.autoSaveInterval || 30)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await saveSettings({
        general: {
          appName,
          theme,
          language,
          autoSave,
          autoSaveInterval,
        }
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium">General Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure basic application preferences
          </p>
        </div>

        {/* App Name */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label htmlFor="app-name" className="block text-sm font-medium mb-2">
              Application Name
            </label>
            <input
              id="app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="input max-w-md"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Customize the application name shown in the header
            </p>
          </div>
        </div>

        {/* Language */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-2">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input max-w-md"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              Choose your preferred interface language
            </p>
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Theme
            </label>
            <div className="space-y-2">
              <label className={clsx(
                'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
              )}>
                <input
                  type="radio"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.value as any)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Dark</div>
                  <div className="text-xs text-muted-foreground">Dark theme for reduced eye strain</div>
                </div>
              </label>
              
              <label className={clsx(
                'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
              )}>
                <input
                  type="radio"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => setTheme(e.target.value as any)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Light</div>
                  <div className="text-xs text-muted-foreground">Light theme for bright environments</div>
                </div>
              </label>
              
              <label className={clsx(
                'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
              )}>
                <input
                  type="radio"
                  value="system"
                  checked={theme === 'system'}
                  onChange={(e) => setTheme(e.target.value as any)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">System</div>
                  <div className="text-xs text-muted-foreground">Follow system theme preference</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Auto-save */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded"
              />
              <div>
                <div className="text-sm font-medium">Enable Auto-save</div>
                <div className="text-xs text-muted-foreground">
                  Automatically save files while editing
                </div>
              </div>
            </label>
          </div>

          {autoSave && (
            <div>
              <label htmlFor="auto-save-interval" className="block text-sm font-medium mb-2">
                Auto-save Interval (seconds)
              </label>
              <input
                id="auto-save-interval"
                type="number"
                min="10"
                max="300"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                className="input w-32"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How often to save changes (10-300 seconds)
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {saveStatus === 'success' && (
              <span className="text-sm text-success flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Settings saved</span>
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
            disabled={isSaving}
            className={clsx(
              'btn-primary h-9 px-4 text-sm',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}