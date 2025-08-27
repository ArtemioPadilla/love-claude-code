import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { api } from '../services/api'
import type { AuthMethod, OAuthAuth, APIKeyAuth } from '../types/auth'
import { claudeOAuth } from '../services/claudeOAuth'

export interface User {
  id: string
  email: string
  name: string
}

export interface AuthState {
  // Core auth state
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // User data
  user: User | null
  token: string | null
  
  // Auth method and credentials
  authMethod: AuthMethod | null
  oauthCredentials: OAuthAuth | null
  apiKey: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  clearError: () => void
  getCurrentUser: () => Promise<void>
  
  // OAuth actions
  initializeOAuth: () => Promise<string>
  handleOAuthCallback: (code: string, state: string) => Promise<void>
  refreshOAuthToken: () => Promise<void>
  
  // API Key actions
  setApiKey: (apiKey: string) => void
  clearApiKey: () => void
  
  // Auth method selection
  setAuthMethod: (method: AuthMethod) => void
  
  // Token validation
  validateToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isAuthenticated: false,
        isLoading: false,
        error: null,
        user: null,
        token: null,
        authMethod: null,
        oauthCredentials: null,
        apiKey: null,

        // Clear error
        clearError: () => set({ error: null }),

        // Traditional JWT auth
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          try {
            const response = await api.login(email, password)
            
            // Set token in API client
            api.setToken(response.token)
            
            set({
              isAuthenticated: true,
              user: response.user,
              token: response.token,
              authMethod: 'jwt',
              isLoading: false,
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
            })
            throw error
          }
        },

        signup: async (email: string, password: string, name: string) => {
          set({ isLoading: true, error: null })
          try {
            const response = await api.signup(email, password, name)
            
            // Set token in API client
            api.setToken(response.token)
            
            set({
              isAuthenticated: true,
              user: response.user,
              token: response.token,
              authMethod: 'jwt',
              isLoading: false,
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Signup failed',
              isLoading: false,
            })
            throw error
          }
        },

        logout: () => {
          // Clear API client token
          api.setToken(null)
          
          // Clear OAuth credentials if using OAuth
          const { authMethod, oauthCredentials } = get()
          if (authMethod === 'oauth-max' && oauthCredentials) {
            claudeOAuth.revokeToken(oauthCredentials.accessToken).catch(console.error)
          }
          
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            authMethod: null,
            oauthCredentials: null,
            apiKey: null,
            error: null,
          })
        },

        getCurrentUser: async () => {
          const { token, oauthCredentials, authMethod } = get()
          
          // Skip if no auth credentials
          if (!token && !oauthCredentials) {
            return
          }
          
          set({ isLoading: true, error: null })
          try {
            const user = await api.getCurrentUser()
            set({
              isAuthenticated: true,
              user,
              isLoading: false,
            })
          } catch (error) {
            // If token is invalid, clear auth state
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              oauthCredentials: null,
              error: error instanceof Error ? error.message : 'Failed to get user',
              isLoading: false,
            })
            api.setToken(null)
          }
        },

        // OAuth flow
        initializeOAuth: async () => {
          set({ isLoading: true, error: null })
          try {
            const authUrl = await claudeOAuth.initiateAuth()
            set({ isLoading: false })
            return authUrl
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'OAuth initialization failed',
              isLoading: false,
            })
            throw error
          }
        },

        handleOAuthCallback: async (code: string, state: string) => {
          set({ isLoading: true, error: null })
          try {
            // Exchange code for tokens
            const tokenResponse = await claudeOAuth.handleCallback(code, state)
            
            // Calculate expiry time
            const expiresAt = claudeOAuth.calculateExpiryTime(tokenResponse.expires_in)
            
            const oauthCredentials: OAuthAuth = {
              type: 'oauth-max',
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              expiresAt,
            }
            
            set({
              isAuthenticated: true,
              authMethod: 'oauth-max',
              oauthCredentials,
              isLoading: false,
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'OAuth callback failed',
              isLoading: false,
            })
            throw error
          }
        },

        refreshOAuthToken: async () => {
          const { oauthCredentials } = get()
          if (!oauthCredentials || oauthCredentials.type !== 'oauth-max') {
            throw new Error('No OAuth credentials to refresh')
          }

          set({ isLoading: true, error: null })
          try {
            const tokenResponse = await claudeOAuth.refreshToken(oauthCredentials.refreshToken)
            
            const newCredentials: OAuthAuth = {
              type: 'oauth-max',
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              expiresAt: claudeOAuth.calculateExpiryTime(tokenResponse.expires_in),
            }
            
            set({
              oauthCredentials: newCredentials,
              isLoading: false,
            })
          } catch (error) {
            // If refresh fails, clear OAuth credentials
            set({
              isAuthenticated: false,
              oauthCredentials: null,
              authMethod: null,
              error: error instanceof Error ? error.message : 'Token refresh failed',
              isLoading: false,
            })
            throw error
          }
        },

        // API Key management
        setApiKey: (apiKey: string) => {
          set({
            isAuthenticated: true,
            authMethod: 'api-key',
            apiKey,
            error: null,
          })
        },

        clearApiKey: () => {
          set({
            isAuthenticated: false,
            authMethod: null,
            apiKey: null,
          })
        },

        // Auth method selection
        setAuthMethod: (method: AuthMethod) => {
          set({ authMethod: method })
        },

        // Token validation
        validateToken: async () => {
          const { token, oauthCredentials, authMethod } = get()
          
          // Check OAuth token expiry
          if (authMethod === 'oauth-max' && oauthCredentials) {
            if (claudeOAuth.isTokenExpired(oauthCredentials.expiresAt)) {
              try {
                await get().refreshOAuthToken()
                return true
              } catch (error) {
                return false
              }
            }
            return true
          }
          
          // For JWT tokens, try to get current user
          if (token) {
            try {
              await api.getCurrentUser()
              return true
            } catch (error) {
              return false
            }
          }
          
          return false
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          // Only persist essential auth data
          token: state.token,
          authMethod: state.authMethod,
          oauthCredentials: state.oauthCredentials,
          apiKey: state.apiKey,
          user: state.user,
        }),
      }
    ),
    { name: 'auth-store' }
  )
)

// Initialize auth state on app start
export const initializeAuth = async () => {
  const { token, oauthCredentials, getCurrentUser, validateToken } = useAuthStore.getState()
  
  // Set token in API client if available
  if (token) {
    api.setToken(token)
  }
  
  // Validate and refresh auth state if credentials exist
  if (token || oauthCredentials) {
    try {
      const isValid = await validateToken()
      if (isValid) {
        await getCurrentUser()
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      // Clear invalid auth state
      useAuthStore.getState().logout()
    }
  }
}