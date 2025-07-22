import axios, { AxiosInstance } from 'axios'
import { useSettingsStore } from '@stores/settingsStore'
import { claudeOAuth } from './claudeOAuth'
import { electronApiAdapter } from './electronApiAdapter'
import { isElectron } from '@utils/electronDetection'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null
  private settingsReady: Promise<void>
  private refreshPromise: Promise<any> | null = null
  private refreshAttempts = 0
  private lastRefreshAttempt = 0
  private readonly MAX_REFRESH_ATTEMPTS = 3
  private refreshBackoffMs = 5000

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Initialize token from localStorage on construction
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      this.token = storedToken
    }
    
    // Ensure settings are loaded
    this.settingsReady = this.ensureSettingsLoaded()

    // Request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      // Check if we're using OAuth
      const settings = useSettingsStore.getState().settings
      
      console.log('Interceptor - URL:', config.url)
      console.log('Interceptor - Auth method:', settings.ai?.authMethod)
      console.log('Interceptor - Has OAuth:', !!settings.ai?.oauthCredentials)
      
      if (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials) {
        // Check if token needs refresh
        if (claudeOAuth.isTokenExpired(settings.ai.oauthCredentials.expiresAt)) {
          // Check if we should attempt refresh
          const now = Date.now()
          const timeSinceLastAttempt = now - this.lastRefreshAttempt
          
          // Skip refresh if we've exceeded max attempts or within backoff period
          if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
            console.error('Max refresh attempts exceeded, clearing credentials')
            await useSettingsStore.getState().saveSettings({
              ai: {
                ...settings.ai,
                oauthCredentials: undefined
              }
            })
            return config
          }
          
          if (timeSinceLastAttempt < this.refreshBackoffMs) {
            console.log('Within backoff period, skipping refresh')
            return config
          }
          
          try {
            // Use existing promise if refresh is already in progress
            if (!this.refreshPromise) {
              this.refreshPromise = this.performTokenRefresh(settings.ai.oauthCredentials.refreshToken)
            }
            
            const tokenResponse = await this.refreshPromise
            
            // Update stored credentials
            const newCredentials = {
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              expiresAt: claudeOAuth.calculateExpiryTime(tokenResponse.expires_in)
            }
            
            await useSettingsStore.getState().saveSettings({
              ai: {
                ...settings.ai,
                oauthCredentials: newCredentials
              }
            })
            
            // Reset refresh state on success
            this.refreshAttempts = 0
            this.refreshPromise = null
            
            // Use the new access token
            config.headers['X-Claude-Auth'] = `Bearer ${tokenResponse.access_token}`
          } catch (error: any) {
            console.error('Token refresh failed:', error)
            this.refreshPromise = null
            
            // Don't clear credentials on rate limit errors
            if (error.message?.includes('429') || error.message?.includes('Too many')) {
              console.log('Rate limited, will retry later')
            } else {
              // Clear invalid credentials for other errors
              await useSettingsStore.getState().saveSettings({
                ai: {
                  ...settings.ai,
                  oauthCredentials: undefined
                }
              })
            }
          }
        } else {
          // Use existing valid token
          config.headers['X-Claude-Auth'] = `Bearer ${settings.ai.oauthCredentials.accessToken}`
        }
      } else if (settings.ai?.authMethod === 'claude-code-cli') {
        // Use Claude Code CLI authentication
        config.headers['X-Claude-CLI'] = 'true'
      } else if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only redirect to login if not using OAuth
          const settings = useSettingsStore.getState().settings
          if (settings.ai?.authMethod !== 'oauth-max' || !settings.ai?.oauthCredentials) {
            // Handle unauthorized for non-OAuth users
            this.token = null
            // Don't automatically redirect - let the UI handle it
            // Only log error if not a settings request on initial load
            if (!error.config?.url?.includes('/settings')) {
              console.error('Authentication failed - no valid credentials')
            }
          }
        } else if (error.response?.status === 429) {
          // Handle rate limit errors
          console.error('Rate limited:', error.response.data?.message || 'Too many requests')
          // Don't retry automatically - let the caller handle it
        }
        return Promise.reject(error)
      }
    )
  }

  private async ensureSettingsLoaded(): Promise<void> {
    // Wait a bit for settings to be hydrated from localStorage
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Try to load settings if not already loaded
    const store = useSettingsStore.getState()
    if (!store.settings.ai?.oauthCredentials && !store.settings.ai?.apiKey) {
      console.log('Settings not loaded, attempting to load...')
      await store.loadSettings()
    }
  }

  private async performTokenRefresh(refreshToken: string) {
    this.lastRefreshAttempt = Date.now()
    this.refreshAttempts++
    
    try {
      const tokenResponse = await claudeOAuth.refreshToken(refreshToken)
      return tokenResponse
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error.message?.includes('429')) {
        // Exponential backoff for rate limits
        this.refreshBackoffMs = Math.min(this.refreshBackoffMs * 2, 60000) // Max 1 minute
      }
      throw error
    }
  }

  async waitForSettings(): Promise<void> {
    await this.settingsReady
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  // Auth endpoints
  async signup(email: string, password: string, name: string) {
    if (isElectron()) {
      // In Electron, we don't need signup - just return success
      return electronApiAdapter.login({ email, password });
    }
    const response = await this.client.post('/auth/signup', { email, password, name })
    this.setToken(response.data.token)
    return response.data
  }

  async login(email: string, password: string) {
    if (isElectron()) {
      return electronApiAdapter.login({ email, password });
    }
    const response = await this.client.post('/auth/login', { email, password })
    this.setToken(response.data.token)
    return response.data
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  // Project endpoints
  async getProjects() {
    if (isElectron()) {
      const result = await electronApiAdapter.getProjects();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    }
    const response = await this.client.get('/projects')
    return response.data.projects
  }

  async getProject(projectId: string) {
    if (isElectron()) {
      // In Electron, opening a project is handled differently
      const projects = await this.getProjects();
      return projects.find((p: any) => p.id === projectId);
    }
    const response = await this.client.get(`/projects/${projectId}`)
    return response.data.project
  }

  async createProject(name: string, description?: string, template?: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.createProject({ name, description, template });
      if (result.error) throw new Error(result.error);
      return result.data;
    }
    const response = await this.client.post('/projects', { name, description, template })
    return response.data.project
  }

  async updateProject(projectId: string, updates: { name?: string; description?: string }) {
    if (isElectron()) {
      const result = await electronApiAdapter.updateProject(projectId, updates);
      if (result.error) throw new Error(result.error);
      return result.data;
    }
    const response = await this.client.put(`/projects/${projectId}`, updates)
    return response.data.project
  }

  async deleteProject(projectId: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.deleteProject(projectId);
      if (result.error) throw new Error(result.error);
      return;
    }
    await this.client.delete(`/projects/${projectId}`)
  }

  // File endpoints
  async getFiles(projectId: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.getFileTree(projectId);
      if (result.error) throw new Error(result.error);
      return result.data?.tree || {};
    }
    const response = await this.client.get(`/files/project/${projectId}`)
    return response.data.files
  }

  async getFileTree(projectId?: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.getFileTree(projectId);
      if (result.error) throw new Error(result.error);
      return result.data?.tree || {};
    }
    const response = await this.client.get('/files/tree', { params: { projectId } })
    return response.data.tree
  }

  async getFile(fileId: string) {
    if (isElectron()) {
      // In Electron, fileId is actually the file path
      const result = await electronApiAdapter.readFile(fileId);
      if (result.error) throw new Error(result.error);
      return result.data;
    }
    const response = await this.client.get(`/files/${fileId}`)
    return response.data.file
  }

  async readFile(filePath: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.readFile(filePath);
      if (result.error) throw new Error(result.error);
      return result.data;
    }
    // For web, this might need a different endpoint
    const response = await this.client.get(`/files/read`, { params: { path: filePath } })
    return response.data
  }

  async createFile(projectId: string, name: string, content: string, language?: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.createFile(projectId, name, content);
      if (result.error) throw new Error(result.error);
      return result.data;
    }
    const response = await this.client.post('/files', { projectId, name, content, language })
    return response.data.file
  }

  async updateFile(fileId: string, content: string, name?: string) {
    if (isElectron()) {
      // In Electron, fileId is the file path
      const result = await electronApiAdapter.writeFile(fileId, content);
      if (result.error) throw new Error(result.error);
      return result.data;
    }
    const response = await this.client.put(`/files/${fileId}`, { content, name })
    return response.data.file
  }

  async deleteFile(fileId: string) {
    if (isElectron()) {
      const result = await electronApiAdapter.deleteFile(fileId);
      if (result.error) throw new Error(result.error);
      return;
    }
    await this.client.delete(`/files/${fileId}`)
  }

  // Claude endpoints
  async chatWithClaude(messages: any[], context?: any, onChunk?: (chunk: string) => void) {
    if (isElectron()) {
      // Use Electron Claude service
      const lastMessage = messages[messages.length - 1];
      if (onChunk) {
        const result = await electronApiAdapter.streamClaudeMessage(
          lastMessage.content,
          onChunk,
          context
        );
        if (result.error) throw new Error(result.error);
        return result.data;
      } else {
        const result = await electronApiAdapter.sendClaudeMessage(
          lastMessage.content,
          context
        );
        if (result.error) throw new Error(result.error);
        return result.data;
      }
    }

    // Ensure settings are loaded before making the request
    await this.waitForSettings()
    
    const settings = useSettingsStore.getState().settings
    
    // Debug logging
    console.log('Chat request - Auth method:', settings.ai?.authMethod)
    console.log('Chat request - Has OAuth creds:', !!settings.ai?.oauthCredentials)
    console.log('Chat request - OAuth token preview:', settings.ai?.oauthCredentials?.accessToken?.substring(0, 20) + '...')
    console.log('Chat request - Has JWT token:', !!this.token)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add appropriate auth header
    if (settings.ai?.authMethod === 'oauth-max' && settings.ai?.oauthCredentials) {
      headers['X-Claude-Auth'] = `Bearer ${settings.ai.oauthCredentials.accessToken}`
      console.log('Using OAuth authentication')
    } else if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
      console.log('Using JWT authentication')
    } else {
      console.warn('No authentication credentials available')
    }
    
    console.log('Request headers:', JSON.stringify(headers, null, 2))
    console.log('Full API URL:', `${this.client.defaults.baseURL}/claude/chat`)
    
    if (onChunk) {
      // Streaming response
      const response = await fetch(`${this.client.defaults.baseURL}/claude/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages, context, stream: true, authMethod: settings.ai?.authMethod }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Claude chat error:', response.status, errorText)
        
        let errorMessage = 'Failed to chat with Claude'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content' && data.content) {
                onChunk(data.content)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } else {
      // Regular response
      const response = await this.client.post('/claude/chat', { 
        messages, 
        context, 
        stream: false,
        authMethod: settings.ai?.authMethod 
      })
      return response.data.response
    }
  }

  async getClaudeModels() {
    const response = await this.client.get('/claude/models')
    return response.data.models
  }

  // Settings endpoints
  async getSettings() {
    if (isElectron()) {
      const result = await electronApiAdapter.getSettings();
      if (result.error) {
        console.error('Failed to get settings:', result.error);
        return {};
      }
      return result.data || {};
    }
    try {
      const response = await this.client.get('/settings')
      return response.data.settings
    } catch (error) {
      // Return empty settings if not found
      return {}
    }
  }

  async saveSettings(settings: any) {
    if (isElectron()) {
      const result = await electronApiAdapter.saveSettings(settings);
      if (result.error) throw new Error(result.error);
      return settings; // Return the settings as saved
    }
    const response = await this.client.put('/settings', settings)
    return response.data.settings
  }
}

export const api = new ApiClient()