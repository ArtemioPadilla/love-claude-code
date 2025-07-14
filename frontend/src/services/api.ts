import axios, { AxiosInstance } from 'axios'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.token = null
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
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
    const response = await this.client.post('/auth/signup', { email, password, name })
    this.setToken(response.data.token)
    return response.data
  }

  async login(email: string, password: string) {
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
    const response = await this.client.get('/projects')
    return response.data.projects
  }

  async getProject(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}`)
    return response.data.project
  }

  async createProject(name: string, description?: string, template?: string) {
    const response = await this.client.post('/projects', { name, description, template })
    return response.data.project
  }

  async updateProject(projectId: string, updates: { name?: string; description?: string }) {
    const response = await this.client.put(`/projects/${projectId}`, updates)
    return response.data.project
  }

  async deleteProject(projectId: string) {
    await this.client.delete(`/projects/${projectId}`)
  }

  // File endpoints
  async getFiles(projectId: string) {
    const response = await this.client.get(`/files/project/${projectId}`)
    return response.data.files
  }

  async getFile(fileId: string) {
    const response = await this.client.get(`/files/${fileId}`)
    return response.data.file
  }

  async createFile(projectId: string, name: string, content: string, language?: string) {
    const response = await this.client.post('/files', { projectId, name, content, language })
    return response.data.file
  }

  async updateFile(fileId: string, content: string, name?: string) {
    const response = await this.client.put(`/files/${fileId}`, { content, name })
    return response.data.file
  }

  async deleteFile(fileId: string) {
    await this.client.delete(`/files/${fileId}`)
  }

  // Claude endpoints
  async chatWithClaude(messages: any[], context?: any, onChunk?: (chunk: string) => void) {
    if (onChunk) {
      // Streaming response
      const response = await fetch(`${this.client.defaults.baseURL}/claude/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : '',
        },
        body: JSON.stringify({ messages, context, stream: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to chat with Claude')
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
      const response = await this.client.post('/claude/chat', { messages, context, stream: false })
      return response.data.response
    }
  }

  async getClaudeModels() {
    const response = await this.client.get('/claude/models')
    return response.data.models
  }

  // Settings endpoints
  async getSettings() {
    try {
      const response = await this.client.get('/settings')
      return response.data.settings
    } catch (error) {
      // Return empty settings if not found
      return {}
    }
  }

  async saveSettings(settings: any) {
    const response = await this.client.put('/settings', settings)
    return response.data.settings
  }
}

export const api = new ApiClient()