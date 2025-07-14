import { useState, useEffect } from 'react'
import { useSettingsStore } from '@stores/settingsStore'
import clsx from 'clsx'

export function AISettings() {
  const { settings, updateSettings, isLoading, saveSettings } = useSettingsStore()
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState('claude-3-5-sonnet-20241022')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4000)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    // Load settings from store
    if (settings.ai) {
      setApiKey(settings.ai.apiKey || '')
      setModel(settings.ai.model || 'claude-3-5-sonnet-20241022')
      setTemperature(settings.ai.temperature ?? 0.7)
      setMaxTokens(settings.ai.maxTokens || 4000)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await saveSettings({
        ai: {
          apiKey,
          model,
          temperature,
          maxTokens,
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
        </div>

        {/* API Key Section */}
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
            disabled={isSaving || !apiKey}
            className={clsx(
              'btn-primary h-9 px-4 text-sm',
              (isSaving || !apiKey) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}