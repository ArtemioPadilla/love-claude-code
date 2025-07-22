/**
 * Electron implementation of the FileApiService
 */

import { FileNode } from './fileApi'
import { isElectron, getElectronAPI } from '@utils/electronDetection'

export class FileApiElectronService {
  private electronAPI: any

  constructor() {
    if (isElectron()) {
      this.electronAPI = getElectronAPI()
    }
  }

  async getFileTree(path?: string): Promise<FileNode> {
    if (!this.electronAPI) {
      throw new Error('Not running in Electron')
    }

    try {
      const result = await this.electronAPI.fs.listDirectory(path)
      if (!result.success) {
        throw new Error(result.error || 'Failed to list directory')
      }

      return this.buildFileTree(result.items, path || '/')
    } catch (error: any) {
      console.error('Failed to get file tree:', error)
      throw error
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.electronAPI) {
      throw new Error('Not running in Electron')
    }

    try {
      const result = await this.electronAPI.fs.readFile(path)
      if (!result.success) {
        throw new Error(result.error || 'Failed to read file')
      }

      return result.content
    } catch (error: any) {
      console.error('Failed to read file:', error)
      throw error
    }
  }

  async createFile(path: string, content: string = ''): Promise<FileNode> {
    if (!this.electronAPI) {
      throw new Error('Not running in Electron')
    }

    try {
      const result = await this.electronAPI.fs.writeFile(path, content)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create file')
      }

      const fileName = path.split('/').pop() || path
      const extension = fileName.includes('.') ? fileName.split('.').pop() : undefined

      return {
        id: path,
        name: fileName,
        type: 'file',
        path: result.path || path,
        extension,
        content,
        size: content.length,
        lastModified: new Date()
      }
    } catch (error: any) {
      console.error('Failed to create file:', error)
      throw error
    }
  }

  async updateFile(path: string, content: string): Promise<FileNode> {
    return this.createFile(path, content)
  }

  async deleteFile(path: string): Promise<void> {
    // TODO: Implement file deletion in Electron backend
    throw new Error('File deletion not yet implemented in Electron')
  }

  async createFolder(path: string): Promise<FileNode> {
    if (!this.electronAPI) {
      throw new Error('Not running in Electron')
    }

    // Create folder by creating a placeholder file inside it
    const placeholderPath = `${path}/.gitkeep`
    await this.createFile(placeholderPath, '')

    const folderName = path.split('/').pop() || path

    return {
      id: path,
      name: folderName,
      type: 'folder',
      path,
      children: [],
      lastModified: new Date()
    }
  }

  async deleteFolder(path: string): Promise<void> {
    // TODO: Implement folder deletion in Electron backend
    throw new Error('Folder deletion not yet implemented in Electron')
  }

  async renameFile(oldPath: string, newPath: string): Promise<FileNode> {
    // Read content from old file
    const content = await this.readFile(oldPath)
    
    // Create new file with content
    const newFile = await this.createFile(newPath, content)
    
    // Delete old file (when implemented)
    // await this.deleteFile(oldPath)
    
    return newFile
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<FileNode> {
    return this.renameFile(sourcePath, destinationPath)
  }

  async searchFiles(query: string, path?: string): Promise<FileNode[]> {
    // TODO: Implement file search in Electron backend
    throw new Error('File search not yet implemented in Electron')
  }

  private buildFileTree(items: any[], rootPath: string): FileNode {
    const rootName = rootPath.split('/').pop() || 'root'
    
    const rootNode: FileNode = {
      id: rootPath,
      name: rootName,
      type: 'folder',
      path: rootPath,
      children: []
    }

    // Sort items: directories first, then files
    const sortedItems = items.sort((a: any, b: any) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    for (const item of sortedItems) {
      if (item.isDirectory) {
        rootNode.children!.push({
          id: item.path,
          name: item.name,
          type: 'folder',
          path: item.path,
          children: [], // Would need recursive loading
          lastModified: new Date(item.modified)
        })
      } else {
        const extension = item.name.includes('.') ? item.name.split('.').pop() : undefined
        rootNode.children!.push({
          id: item.path,
          name: item.name,
          type: 'file',
          path: item.path,
          extension,
          size: item.size,
          lastModified: new Date(item.modified)
        })
      }
    }

    return rootNode
  }
}

export const fileApiElectron = new FileApiElectronService()