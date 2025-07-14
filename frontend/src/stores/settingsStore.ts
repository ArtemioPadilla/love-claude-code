import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@services/api'
import type { Settings } from '../types/settings'

interface SettingsState {
  settings: Settings
  isLoading: boolean
  error: string | null
  
  // Actions
  loadSettings: () => Promise<void>
  saveSettings: (updates: Partial<Settings>) => Promise<void>
  updateSettings: (updates: Partial<Settings>) => void
  clearSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {
        general: {
          theme: 'dark',
          language: 'en',
          autoSave: true,
        },
        ai: {
          apiKey: '',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 4000,
        },
        providers: {
          default: 'local',
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 3600,
        }
      },
      isLoading: false,
      error: null,

      loadSettings: async () => {
        set({ isLoading: true, error: null })
        try {
          // Try to load from API first
          const response = await api.getSettings()
          set({ settings: response, isLoading: false })
        } catch (error) {
          // Fall back to local storage
          console.log('Using local settings')
          set({ isLoading: false })
        }
      },

      saveSettings: async (updates) => {
        const { settings } = get()
        const newSettings = { ...settings, ...updates }
        
        set({ isLoading: true, error: null })
        try {
          // Save to API
          await api.saveSettings(newSettings)
          set({ settings: newSettings, isLoading: false })
        } catch (error) {
          // Still update local storage even if API fails
          set({ 
            settings: newSettings, 
            isLoading: false,
            error: 'Failed to save to server, settings saved locally'
          })
        }
      },

      updateSettings: (updates) => {
        const { settings } = get()
        set({ settings: { ...settings, ...updates } })
      },

      clearSettings: () => {
        set({ 
          settings: {
            general: {
              theme: 'dark',
              language: 'en',
              autoSave: true,
            },
            ai: {
              apiKey: '',
              model: 'claude-3-5-sonnet-20241022',
              temperature: 0.7,
              maxTokens: 4000,
            },
            providers: {
              default: 'local',
            },
            security: {
              twoFactorEnabled: false,
              sessionTimeout: 3600,
            }
          },
          error: null 
        })
      },
    }),
    {
      name: 'love-claude-code-settings',
      partialize: (state) => ({ settings: state.settings }), // Only persist settings
    }
  )
)