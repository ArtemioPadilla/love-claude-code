import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferences {
  advancedMode: boolean
  editorTheme: 'vs-dark' | 'vs-light' | 'hc-black'
  fontSize: number
  showMinimap: boolean
  wordWrap: boolean
  tabSize: number
  autoSave: boolean
  autoSaveDelay: number
  hasCompletedOnboarding: boolean
}

interface UserPreferencesState {
  preferences: UserPreferences
  
  // Actions
  toggleAdvancedMode: () => void
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  resetPreferences: () => void
}

const defaultPreferences: UserPreferences = {
  advancedMode: false,
  editorTheme: 'vs-dark',
  fontSize: 14,
  showMinimap: true,
  wordWrap: false,
  tabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  hasCompletedOnboarding: false,
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,

      toggleAdvancedMode: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            advancedMode: !state.preferences.advancedMode,
          },
        }))
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }))
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences })
      },
    }),
    {
      name: 'love-claude-code-user-preferences',
    }
  )
)