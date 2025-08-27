import { useState } from 'react'
import { SettingsTabs } from './SettingsTabs'
import { AISettings } from './AISettings'
import { GeneralSettings } from './GeneralSettings'
import { SecuritySettings } from './SecuritySettings'
import { ProviderSettings } from './ProviderSettings'

export type SettingsTab = 'general' | 'ai' | 'providers' | 'security' | 'integrations'

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai')

  const renderContent = () => {
    switch (activeTab) {
      case 'general': {
        return <GeneralSettings />
      }
      case 'ai': {
        return <AISettings />
      }
      case 'providers': {
        return <ProviderSettings />
      }
      case 'security': {
        return <SecuritySettings />
      }
      case 'integrations': {
        return (
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Integrations</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        )
      }
      default: {
        return null
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border px-6 flex items-center">
        <h1 className="text-lg font-medium">Settings</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}