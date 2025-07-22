import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@services/api'
import { isElectron } from '@utils/electronDetection'
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
          authMethod: 'api-key',
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
          // api.getSettings now handles Electron check internally
          const response = await api.getSettings()
          if (response && Object.keys(response).length > 0) {
            set({ settings: { ...get().settings, ...response }, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          // Fall back to local storage
          console.log('Using local settings:', error)
          set({ isLoading: false })
        }
      },

      saveSettings: async (updates) => {
        const { settings } = get()
        const newSettings = { ...settings, ...updates }
        
        set({ isLoading: true, error: null })
        
        try {
          // api.saveSettings now handles Electron check internally
          await api.saveSettings(newSettings)
          set({ settings: newSettings, isLoading: false })
        } catch (error: any) {
          console.log('Settings save error:', error.message)
          // Still update local storage even if API fails
          set({ 
            settings: newSettings, 
            isLoading: false,
            error: isElectron() ? null : error.message // Don't show error for Electron local saves
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
              authMethod: 'api-key',
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