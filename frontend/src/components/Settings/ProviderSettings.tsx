import React, { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ProviderType } from '../../types/settings'

interface ProviderConfig {
  firebase?: {
    projectId: string
    apiKey: string
    authDomain: string
    storageBucket: string
  }
  aws?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
  }
}

export function ProviderSettings() {
  const { settings, saveSettings } = useSettingsStore()
  const [providerType, setProviderType] = useState<ProviderType>(
    settings.providers?.default || 'local'
  )
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(
    settings.providers || {}
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await saveSettings({
        providers: {
          default: providerType,
          ...providerConfig
        }
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save provider settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderProviderConfig = () => {
    switch (providerType) {
      case 'local': {
        return (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Local Provider Active
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              No configuration needed! All data is stored locally on your machine.
            </p>
          </div>
        )
      }

      case 'firebase': {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Firebase Project ID
              </label>
              <input
                type="text"
                value={providerConfig.firebase?.projectId || ''}
                onChange={(e) => setProviderConfig({
                  ...providerConfig,
                  firebase: {
                    ...providerConfig.firebase,
                    projectId: e.target.value
                  } as any
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="my-firebase-project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Web API Key
              </label>
              <input
                type="password"
                value={providerConfig.firebase?.apiKey || ''}
                onChange={(e) => setProviderConfig({
                  ...providerConfig,
                  firebase: {
                    ...providerConfig.firebase,
                    apiKey: e.target.value
                  } as any
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="AIza..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={providerConfig.firebase?.authDomain || ''}
                onChange={(e) => setProviderConfig({
                  ...providerConfig,
                  firebase: {
                    ...providerConfig.firebase,
                    authDomain: e.target.value
                  } as any
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="my-project.firebaseapp.com"
              />
            </div>
          </div>
        )
      }

      case 'aws': {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                AWS Region
              </label>
              <select
                value={providerConfig.aws?.region || 'us-west-2'}
                onChange={(e) => setProviderConfig({
                  ...providerConfig,
                  aws: {
                    ...providerConfig.aws,
                    region: e.target.value
                  } as any
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">EU (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Access Key ID
              </label>
              <input
                type="text"
                value={providerConfig.aws?.accessKeyId || ''}
                onChange={(e) => setProviderConfig({
                  ...providerConfig,
                  aws: {
                    ...providerConfig.aws,
                    accessKeyId: e.target.value
                  } as any
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="AKIA..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Secret Access Key
              </label>
              <input
                type="password"
                value={providerConfig.aws?.secretAccessKey || ''}
                onChange={(e) => setProviderConfig({
                  ...providerConfig,
                  aws: {
                    ...providerConfig.aws,
                    secretAccessKey: e.target.value
                  } as any
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your secret key"
              />
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Backend Provider</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose where to store your data and run your applications
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Provider Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setProviderType('local')}
            className={`p-3 rounded-lg border text-center transition-colors ${
              providerType === 'local'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Local</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Development only
            </div>
          </button>

          <button
            onClick={() => setProviderType('firebase')}
            className={`p-3 rounded-lg border text-center transition-colors ${
              providerType === 'firebase'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Firebase</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Rapid prototyping
            </div>
          </button>

          <button
            onClick={() => setProviderType('aws')}
            className={`p-3 rounded-lg border text-center transition-colors ${
              providerType === 'aws'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">AWS</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Production ready
            </div>
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Provider Configuration</h4>
        {renderProviderConfig()}
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Saving...' : isSaved ? 'Saved!' : 'Save Provider Settings'}
      </button>
    </div>
  )
}