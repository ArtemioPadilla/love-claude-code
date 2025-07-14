import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

interface FileNode {
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

export class FileSystemService {
  private workspacePath: string

  constructor(workspacePath?: string) {
    // Default workspace in user's home directory
    this.workspacePath = workspacePath || path.join(process.env.HOME || process.cwd(), '.love-claude-code', 'workspace')
  }

  async ensureWorkspace(): Promise<void> {
    try {
      await fs.access(this.workspacePath)
    } catch {
      await fs.mkdir(this.workspacePath, { recursive: true })
      // Create default project structure
      await this.createDefaultStructure()
    }
  }

  private async createDefaultStructure(): Promise<void> {
    const defaultFiles = [
      {
        path: 'src/App.tsx',
        content: `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold p-8">
        Hello from Love Claude Code!
      </h1>
    </div>
  )
}

export default App`
      },
      {
        path: 'src/index.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
      },
      {
        path: 'src/index.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      },
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'love-claude-code-project',
          version: '0.1.0',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            '@vitejs/plugin-react': '^4.0.0',
            'typescript': '^5.0.0',
            'vite': '^4.0.0'
          }
        }, null, 2)
      }
    ]

    for (const file of defaultFiles) {
      const fullPath = path.join(this.workspacePath, file.path)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, file.content, 'utf-8')
    }
  }

  async getFileTree(dirPath: string = ''): Promise<FileNode[]> {
    await this.ensureWorkspace()
    const fullPath = path.join(this.workspacePath, dirPath)
    return this.buildFileTree(fullPath, dirPath || '/')
  }

  private async buildFileTree(fullPath: string, relativePath: string): Promise<FileNode[]> {
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    const nodes: FileNode[] = []

    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue
      }

      const entryPath = path.join(fullPath, entry.name)
      const entryRelativePath = path.join(relativePath, entry.name)
      const stats = await fs.stat(entryPath)

      if (entry.isDirectory()) {
        const children = await this.buildFileTree(entryPath, entryRelativePath)
        nodes.push({
          id: uuidv4(),
          name: entry.name,
          type: 'folder',
          path: entryRelativePath,
          children,
          lastModified: stats.mtime
        })
      } else {
        const extension = path.extname(entry.name).slice(1)
        nodes.push({
          id: uuidv4(),
          name: entry.name,
          type: 'file',
          path: entryRelativePath,
          extension,
          size: stats.size,
          lastModified: stats.mtime
        })
      }
    }

    return nodes.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.workspacePath, filePath)
    return fs.readFile(fullPath, 'utf-8')
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.workspacePath, filePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  async createFile(filePath: string, content: string = ''): Promise<FileNode> {
    await this.writeFile(filePath, content)
    const stats = await fs.stat(path.join(this.workspacePath, filePath))
    const extension = path.extname(filePath).slice(1)
    
    return {
      id: uuidv4(),
      name: path.basename(filePath),
      type: 'file',
      path: filePath,
      extension,
      content,
      size: stats.size,
      lastModified: stats.mtime
    }
  }

  async createFolder(folderPath: string): Promise<FileNode> {
    const fullPath = path.join(this.workspacePath, folderPath)
    await fs.mkdir(fullPath, { recursive: true })
    const stats = await fs.stat(fullPath)
    
    return {
      id: uuidv4(),
      name: path.basename(folderPath),
      type: 'folder',
      path: folderPath,
      children: [],
      lastModified: stats.mtime
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.workspacePath, filePath)
    const stats = await fs.stat(fullPath)
    
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true })
    } else {
      await fs.unlink(fullPath)
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const oldFullPath = path.join(this.workspacePath, oldPath)
    const newFullPath = path.join(this.workspacePath, newPath)
    await fs.rename(oldFullPath, newFullPath)
  }

  getWorkspacePath(): string {
    return this.workspacePath
  }
}

// Singleton instance
export const fileSystemService = new FileSystemService()