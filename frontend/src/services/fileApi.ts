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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

export class FileApiService {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL
  }

  async getFileTree(): Promise<FileNode[]> {
    const response = await fetch(`${this.baseUrl}/files/tree`)
    if (!response.ok) {
      throw new Error('Failed to fetch file tree')
    }
    const data = await response.json()
    return data.tree
  }

  async readFile(path: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/files/read?path=${encodeURIComponent(path)}`)
    if (!response.ok) {
      throw new Error('Failed to read file')
    }
    const data = await response.json()
    return data.content
  }

  async createFile(path: string, content: string = ''): Promise<FileNode> {
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
    const response = await fetch(`${this.baseUrl}/files?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }

  async createFolder(path: string): Promise<FileNode> {
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