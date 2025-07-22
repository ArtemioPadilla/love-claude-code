import { isElectron } from '@utils/electronDetection'
import { fileApiElectron } from './fileApiElectron'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  extension?: string
  content?: string
  children?: FileNode[]
  size?: number
  lastModified?: Date
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
}

export class FileApiService {
  private baseUrl: string
  private retryOptions: Required<RetryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }

  constructor(baseUrl?: string, retryOptions?: RetryOptions) {
    this.baseUrl = baseUrl || API_BASE_URL
    this.retryOptions = { ...this.retryOptions, ...retryOptions }
  }

  private async fetchWithRetry(url: string, options?: RequestInit, retryCount = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      // Don't retry on rate limit errors (429)
      if (response.status === 429) {
        return response
      }
      
      if (!response.ok && retryCount < this.retryOptions.maxRetries) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response
    } catch (error) {
      if (retryCount < this.retryOptions.maxRetries) {
        const delay = this.retryOptions.retryDelay * Math.pow(this.retryOptions.backoffMultiplier, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.fetchWithRetry(url, options, retryCount + 1)
      }
      throw error
    }
  }

  async getFileTree(path?: string): Promise<FileNode[]> {
    if (isElectron()) {
      const tree = await fileApiElectron.getFileTree(path)
      return tree.children || []
    }
    
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/files/tree`)
      
      if (response.status === 429) {
        console.warn('Rate limit exceeded. Please wait a moment before trying again.')
        return []
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file tree: ${response.statusText}`)
      }
      const data = await response.json()
      return data.tree || []
    } catch (error) {
      console.error('Failed to fetch file tree:', error)
      // Return empty tree as fallback
      return []
    }
  }

  async readFile(path: string): Promise<string> {
    if (isElectron()) {
      return fileApiElectron.readFile(path)
    }
    
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/files/read?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`)
      }
      const data = await response.json()
      return data.content || ''
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  }

  async createFile(path: string, content: string = ''): Promise<FileNode> {
    if (isElectron()) {
      return fileApiElectron.createFile(path, content)
    }
    
    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, content }),
    })
    if (!response.ok) {
      throw new Error('Failed to create file')
    }
    const data = await response.json()
    return data.file
  }

  async updateFile(path: string, content: string): Promise<void> {
    if (isElectron()) {
      await fileApiElectron.updateFile(path, content)
      return
    }
    
    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, content }),
    })
    if (!response.ok) {
      throw new Error('Failed to update file')
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (isElectron()) {
      return fileApiElectron.deleteFile(path)
    }
    
    const response = await fetch(`${this.baseUrl}/files?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }

  async createFolder(path: string): Promise<FileNode> {
    if (isElectron()) {
      return fileApiElectron.createFolder(path)
    }
    
    const response = await fetch(`${this.baseUrl}/files/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    })
    if (!response.ok) {
      throw new Error('Failed to create folder')
    }
    const data = await response.json()
    return data.folder
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (isElectron()) {
      await fileApiElectron.renameFile(oldPath, newPath)
      return
    }
    
    const response = await fetch(`${this.baseUrl}/files/rename`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldPath, newPath }),
    })
    if (!response.ok) {
      throw new Error('Failed to rename file')
    }
  }
}

export const fileApiService = new FileApiService()