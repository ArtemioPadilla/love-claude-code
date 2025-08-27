import React, { useState, useRef, useEffect } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import DOMPurify from 'dompurify'

/**
 * L1 Project File Explorer Construct
 * Enhanced file explorer with CRUD operations, icons, search, and security features
 * Built upon L0 FileTreePrimitive
 */
export class ProjectFileExplorer extends L1UIConstruct {
  private fileOperationQueue: FileOperation[] = []
  private searchResults: FileNode[] = []
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-project-file-explorer',
    name: 'Project File Explorer',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Secure file explorer with CRUD operations, search, icons, and project management features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'navigation', 'file-system', 'project-management'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['file-explorer', 'crud', 'search', 'secure', 'project'],
    inputs: [
      {
        name: 'projectId',
        type: 'string',
        description: 'Current project ID',
        required: true
      },
      {
        name: 'nodes',
        type: 'FileNode[]',
        description: 'Tree structure of files and folders',
        required: true,
        defaultValue: []
      },
      {
        name: 'expandedPaths',
        type: 'string[]',
        description: 'Array of expanded folder paths',
        required: false,
        defaultValue: []
      },
      {
        name: 'selectedPath',
        type: 'string',
        description: 'Currently selected file/folder path',
        required: false
      },
      {
        name: 'enableSearch',
        type: 'boolean',
        description: 'Enable file search functionality',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableCRUD',
        type: 'boolean',
        description: 'Enable create, rename, delete operations',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableDragDrop',
        type: 'boolean',
        description: 'Enable drag and drop file operations',
        required: false,
        defaultValue: true
      },
      {
        name: 'showHiddenFiles',
        type: 'boolean',
        description: 'Show hidden files (starting with .)',
        required: false,
        defaultValue: false
      },
      {
        name: 'allowedFileTypes',
        type: 'string[]',
        description: 'Allowed file extensions for creation',
        required: false,
        defaultValue: ['*']
      },
      {
        name: 'maxFileNameLength',
        type: 'number',
        description: 'Maximum file name length',
        required: false,
        defaultValue: 255
      },
      {
        name: 'readOnlyPaths',
        type: 'string[]',
        description: 'Paths that cannot be modified',
        required: false,
        defaultValue: []
      },
      {
        name: 'theme',
        type: 'string',
        description: 'Visual theme',
        required: false,
        defaultValue: 'light',
        validation: {
          enum: ['light', 'dark']
        }
      }
    ],
    outputs: [
      {
        name: 'selectedFile',
        type: 'FileNode | null',
        description: 'Currently selected file node'
      },
      {
        name: 'fileCount',
        type: 'number',
        description: 'Total number of files'
      },
      {
        name: 'folderCount',
        type: 'number',
        description: 'Total number of folders'
      },
      {
        name: 'searchActive',
        type: 'boolean',
        description: 'Whether search is active'
      },
      {
        name: 'lastOperation',
        type: 'FileOperation',
        description: 'Last performed file operation'
      },
      {
        name: 'clipboardItem',
        type: 'FileNode | null',
        description: 'Item in clipboard for copy/paste'
      }
    ],
    security: [
      {
        aspect: 'Path Validation',
        description: 'Validates file paths to prevent directory traversal',
        implementation: 'Path sanitization and validation'
      },
      {
        aspect: 'File Type Restrictions',
        description: 'Restricts file types that can be created',
        implementation: 'Extension whitelist validation'
      },
      {
        aspect: 'XSS Protection',
        description: 'Sanitizes file names to prevent XSS',
        implementation: 'DOMPurify for file name sanitization'
      },
      {
        aspect: 'Access Control',
        description: 'Enforces read-only paths',
        implementation: 'Path-based permission checking'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + File System API'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Create a project file explorer',
        code: `const explorer = new ProjectFileExplorer()
await explorer.initialize({
  projectId: 'my-project',
  nodes: fileTree,
  enableCRUD: true,
  enableSearch: true
})

// Handle file selection
explorer.on('fileSelected', (file) => {
  console.log('Selected:', file.path)
})

// Handle file operations
explorer.on('fileCreated', (file) => {
  console.log('Created:', file.path)
})`,
        language: 'typescript'
      },
      {
        title: 'With Custom Configuration',
        description: 'Configure allowed operations',
        code: `const explorer = new ProjectFileExplorer()
await explorer.initialize({
  projectId: 'secure-project',
  nodes: fileTree,
  allowedFileTypes: ['.js', '.ts', '.json', '.md'],
  readOnlyPaths: ['/src/vendor', '/node_modules'],
  showHiddenFiles: true,
  theme: 'dark'
})

// Search for files
const results = await explorer.searchFiles('component')
console.log('Found:', results.length, 'files')`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Validate all file paths before operations',
      'Implement proper error handling for file operations',
      'Use debouncing for search functionality',
      'Provide clear feedback for operations',
      'Handle large file trees efficiently',
      'Implement undo/redo for file operations',
      'Cache file tree for performance',
      'Use virtual scrolling for large trees'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    dependencies: ['platform-l0-file-tree-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-file-tree-primitive'],
      timeToCreate: 90,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ProjectFileExplorer.definition)
  }

  /**
   * Validate file path for security
   */
  private validatePath(path: string): boolean {
    // Prevent directory traversal
    if (path.includes('..') || path.includes('~')) {
      return false
    }
    
    // Ensure absolute paths start with /
    if (!path.startsWith('/') && path.includes('/')) {
      return false
    }
    
    return true
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(name: string): string {
    // Remove dangerous characters
    let sanitized = name.replace(/[<>:"\\|?*\x00-\x1F]/g, '')
    
    // Apply DOMPurify for XSS protection
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] })
    
    // Enforce max length
    const maxLength = this.getInput<number>('maxFileNameLength') || 255
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    return sanitized
  }

  /**
   * Check if path is read-only
   */
  private isReadOnly(path: string): boolean {
    const readOnlyPaths = this.getInput<string[]>('readOnlyPaths') || []
    return readOnlyPaths.some(roPath => path.startsWith(roPath))
  }

  /**
   * Check if file type is allowed
   */
  private isFileTypeAllowed(fileName: string): boolean {
    const allowedTypes = this.getInput<string[]>('allowedFileTypes') || ['*']
    if (allowedTypes.includes('*')) return true
    
    const ext = fileName.substring(fileName.lastIndexOf('.'))
    return allowedTypes.includes(ext)
  }

  /**
   * Create a new file
   */
  async createFile(parentPath: string, fileName: string): Promise<FileNode | null> {
    if (!this.getInput<boolean>('enableCRUD')) {
      throw new Error('CRUD operations are disabled')
    }

    // Validate inputs
    if (!this.validatePath(parentPath)) {
      throw new Error('Invalid parent path')
    }

    const sanitizedName = this.sanitizeFileName(fileName)
    if (!sanitizedName) {
      throw new Error('Invalid file name')
    }

    if (!this.isFileTypeAllowed(sanitizedName)) {
      throw new Error('File type not allowed')
    }

    const fullPath = `${parentPath}/${sanitizedName}`
    if (this.isReadOnly(fullPath)) {
      throw new Error('Cannot create file in read-only location')
    }

    // Create file node
    const newFile: FileNode = {
      path: fullPath,
      name: sanitizedName,
      type: 'file',
      size: 0,
      modified: new Date(),
      created: new Date()
    }

    // Record operation
    const operation: FileOperation = {
      type: 'create',
      path: fullPath,
      timestamp: new Date(),
      success: true
    }
    
    this.fileOperationQueue.push(operation)
    this.setOutput('lastOperation', operation)
    
    // Emit event
    this.emit('fileCreated', newFile)
    
    return newFile
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath: string, folderName: string): Promise<FileNode | null> {
    if (!this.getInput<boolean>('enableCRUD')) {
      throw new Error('CRUD operations are disabled')
    }

    // Validate inputs
    if (!this.validatePath(parentPath)) {
      throw new Error('Invalid parent path')
    }

    const sanitizedName = this.sanitizeFileName(folderName)
    if (!sanitizedName) {
      throw new Error('Invalid folder name')
    }

    const fullPath = `${parentPath}/${sanitizedName}`
    if (this.isReadOnly(fullPath)) {
      throw new Error('Cannot create folder in read-only location')
    }

    // Create folder node
    const newFolder: FileNode = {
      path: fullPath,
      name: sanitizedName,
      type: 'folder',
      children: [],
      modified: new Date(),
      created: new Date()
    }

    // Record operation
    const operation: FileOperation = {
      type: 'create',
      path: fullPath,
      timestamp: new Date(),
      success: true
    }
    
    this.fileOperationQueue.push(operation)
    this.setOutput('lastOperation', operation)
    
    // Emit event
    this.emit('folderCreated', newFolder)
    
    return newFolder
  }

  /**
   * Rename a file or folder
   */
  async rename(path: string, newName: string): Promise<boolean> {
    if (!this.getInput<boolean>('enableCRUD')) {
      throw new Error('CRUD operations are disabled')
    }

    if (!this.validatePath(path)) {
      throw new Error('Invalid path')
    }

    if (this.isReadOnly(path)) {
      throw new Error('Cannot rename read-only item')
    }

    const sanitizedName = this.sanitizeFileName(newName)
    if (!sanitizedName) {
      throw new Error('Invalid new name')
    }

    const parentPath = path.substring(0, path.lastIndexOf('/'))
    const newPath = `${parentPath}/${sanitizedName}`

    if (this.isReadOnly(newPath)) {
      throw new Error('Cannot rename to read-only location')
    }

    // Record operation
    const operation: FileOperation = {
      type: 'rename',
      path: path,
      newPath: newPath,
      timestamp: new Date(),
      success: true
    }
    
    this.fileOperationQueue.push(operation)
    this.setOutput('lastOperation', operation)
    
    // Emit event
    this.emit('itemRenamed', { oldPath: path, newPath })
    
    return true
  }

  /**
   * Delete a file or folder
   */
  async delete(path: string): Promise<boolean> {
    if (!this.getInput<boolean>('enableCRUD')) {
      throw new Error('CRUD operations are disabled')
    }

    if (!this.validatePath(path)) {
      throw new Error('Invalid path')
    }

    if (this.isReadOnly(path)) {
      throw new Error('Cannot delete read-only item')
    }

    // Record operation
    const operation: FileOperation = {
      type: 'delete',
      path: path,
      timestamp: new Date(),
      success: true
    }
    
    this.fileOperationQueue.push(operation)
    this.setOutput('lastOperation', operation)
    
    // Emit event
    this.emit('itemDeleted', { path })
    
    return true
  }

  /**
   * Search files by name
   */
  async searchFiles(query: string): Promise<FileNode[]> {
    if (!this.getInput<boolean>('enableSearch')) {
      return []
    }

    const nodes = this.getInput<FileNode[]>('nodes') || []
    const results: FileNode[] = []
    const searchQuery = query.toLowerCase()

    const searchInNodes = (nodeList: FileNode[]) => {
      for (const node of nodeList) {
        if (node.name.toLowerCase().includes(searchQuery)) {
          results.push(node)
        }
        if (node.children) {
          searchInNodes(node.children)
        }
      }
    }

    searchInNodes(nodes)
    this.searchResults = results
    
    this.setOutput('searchActive', true)
    this.emit('searchCompleted', { query, results })
    
    return results
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchResults = []
    this.setOutput('searchActive', false)
    this.emit('searchCleared')
  }

  /**
   * Copy item to clipboard
   */
  copyToClipboard(node: FileNode): void {
    this.setOutput('clipboardItem', node)
    this.emit('itemCopied', node)
  }

  /**
   * Paste from clipboard
   */
  async pasteFromClipboard(targetPath: string): Promise<FileNode | null> {
    const clipboardItem = this.getOutput('clipboardItem') as FileNode | null
    if (!clipboardItem) return null

    if (!this.validatePath(targetPath)) {
      throw new Error('Invalid target path')
    }

    if (this.isReadOnly(targetPath)) {
      throw new Error('Cannot paste to read-only location')
    }

    // Create new path
    const newPath = `${targetPath}/${clipboardItem.name}`
    
    // Record operation
    const operation: FileOperation = {
      type: 'paste',
      path: clipboardItem.path,
      newPath: newPath,
      timestamp: new Date(),
      success: true
    }
    
    this.fileOperationQueue.push(operation)
    this.setOutput('lastOperation', operation)
    
    // Emit event
    this.emit('itemPasted', { source: clipboardItem.path, target: newPath })
    
    return { ...clipboardItem, path: newPath }
  }

  /**
   * Count files and folders
   */
  private countNodes(nodes: FileNode[]): { files: number; folders: number } {
    let files = 0
    let folders = 0

    const count = (nodeList: FileNode[]) => {
      for (const node of nodeList) {
        if (node.type === 'file') files++
        else folders++
        
        if (node.children) {
          count(node.children)
        }
      }
    }

    count(nodes)
    return { files, folders }
  }

  /**
   * Get file icon based on extension
   */
  private getFileIcon(fileName: string): string {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
    const iconMap: Record<string, string> = {
      '.js': '📄',
      '.ts': '📘',
      '.jsx': '⚛️',
      '.tsx': '⚛️',
      '.json': '📋',
      '.md': '📝',
      '.css': '🎨',
      '.html': '🌐',
      '.png': '🖼️',
      '.jpg': '🖼️',
      '.gif': '🖼️',
      '.svg': '🎨',
      '.pdf': '📑',
      '.zip': '📦',
      '.env': '🔐',
      '.gitignore': '🚫',
      '.yml': '⚙️',
      '.yaml': '⚙️'
    }
    
    return iconMap[ext] || '📄'
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ProjectFileExplorerComponent construct={this} />
  }
}

/**
 * File node interface
 */
interface FileNode {
  path: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  size?: number
  modified?: Date
  created?: Date
}

/**
 * File operation interface
 */
interface FileOperation {
  type: 'create' | 'rename' | 'delete' | 'paste'
  path: string
  newPath?: string
  timestamp: Date
  success: boolean
  error?: string
}

/**
 * React component wrapper
 */
const ProjectFileExplorerComponent: React.FC<{ construct: ProjectFileExplorer }> = ({ construct }) => {
  const [nodes, setNodes] = useState<FileNode[]>(construct.getInput<FileNode[]>('nodes') || [])
  const [expandedPaths, setExpandedPaths] = useState<string[]>(
    construct.getInput<string[]>('expandedPaths') || []
  )
  const [selectedPath, setSelectedPath] = useState<string | undefined>(
    construct.getInput<string>('selectedPath')
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: FileNode
  } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [newItemPath, setNewItemPath] = useState<string | null>(null)
  const [newItemType, setNewItemType] = useState<'file' | 'folder' | null>(null)

  const theme = construct.getInput('theme') as string
  const showHidden = construct.getInput('showHiddenFiles') as boolean
  const enableCRUD = construct.getInput('enableCRUD') as boolean

  useEffect(() => {
    // Update node counts
    const counts = construct['countNodes'](nodes)
    construct['setOutput']('fileCount', counts.files)
    construct['setOutput']('folderCount', counts.folders)
  }, [nodes, construct])

  const handleToggle = (path: string) => {
    setExpandedPaths(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
  }

  const handleSelect = (node: FileNode) => {
    setSelectedPath(node.path)
    construct['setOutput']('selectedFile', node)
    construct.emit('fileSelected', node)
  }

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    if (!enableCRUD) return
    
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    })
  }

  const handleRename = async (node: FileNode, newName: string) => {
    try {
      await construct.rename(node.path, newName)
      // Update local state
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(n => {
          if (n.path === node.path) {
            return { ...n, name: newName }
          }
          if (n.children) {
            return { ...n, children: updateNode(n.children) }
          }
          return n
        })
      }
      setNodes(updateNode(nodes))
      setRenamingPath(null)
    } catch (error: any) {
      console.error('Rename failed:', error.message)
    }
  }

  const handleDelete = async (node: FileNode) => {
    try {
      await construct.delete(node.path)
      // Update local state
      const removeNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(n => {
          if (n.path === node.path) return false
          if (n.children) {
            n.children = removeNode(n.children)
          }
          return true
        })
      }
      setNodes(removeNode(nodes))
    } catch (error: any) {
      console.error('Delete failed:', error.message)
    }
  }

  const handleCreateNew = async (parentPath: string, name: string, type: 'file' | 'folder') => {
    try {
      const newNode = type === 'file'
        ? await construct.createFile(parentPath, name)
        : await construct.createFolder(parentPath, name)
      
      if (newNode) {
        // Update local state
        const addNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(n => {
            if (n.path === parentPath && n.children) {
              return { ...n, children: [...n.children, newNode] }
            }
            if (n.children) {
              return { ...n, children: addNode(n.children) }
            }
            return n
          })
        }
        setNodes(addNode(nodes))
      }
      setNewItemPath(null)
      setNewItemType(null)
    } catch (error: any) {
      console.error('Create failed:', error.message)
    }
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    if (!showHidden && node.name.startsWith('.')) return null

    const isExpanded = expandedPaths.includes(node.path)
    const isSelected = selectedPath === node.path
    const isRenaming = renamingPath === node.path
    const isFolder = node.type === 'folder'

    return (
      <div key={node.path}>
        <div
          className={`file-node ${isSelected ? 'selected' : ''}`}
          style={{
            paddingLeft: `${depth * 20 + 8}px`,
            cursor: 'pointer',
            backgroundColor: isSelected ? (theme === 'dark' ? '#2d3748' : '#e2e8f0') : 'transparent',
            color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
            display: 'flex',
            alignItems: 'center',
            height: '28px',
            userSelect: 'none'
          }}
          onClick={() => handleSelect(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <span style={{ marginRight: '4px' }}>
            {isFolder ? (isExpanded ? '📂' : '📁') : construct['getFileIcon'](node.name)}
          </span>
          {isRenaming ? (
            <input
              type="text"
              defaultValue={node.name}
              autoFocus
              onBlur={(e) => handleRename(node, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename(node, e.currentTarget.value)
                } else if (e.key === 'Escape') {
                  setRenamingPath(null)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '14px',
                padding: '2px 4px',
                border: '1px solid #4a5568',
                borderRadius: '2px',
                backgroundColor: theme === 'dark' ? '#1a202c' : 'white'
              }}
            />
          ) : (
            <span 
              style={{ fontSize: '14px' }}
              onDoubleClick={() => enableCRUD && setRenamingPath(node.path)}
            >
              {node.name}
            </span>
          )}
        </div>
        
        {isFolder && isExpanded && (
          <>
            {node.children?.map(child => renderNode(child, depth + 1))}
            {newItemPath === node.path && (
              <div style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}>
                <input
                  type="text"
                  placeholder={`New ${newItemType}...`}
                  autoFocus
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleCreateNew(node.path, e.target.value, newItemType!)
                    } else {
                      setNewItemPath(null)
                      setNewItemType(null)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleCreateNew(node.path, e.currentTarget.value, newItemType!)
                    } else if (e.key === 'Escape') {
                      setNewItemPath(null)
                      setNewItemType(null)
                    }
                  }}
                  style={{
                    fontSize: '14px',
                    padding: '2px 4px',
                    border: '1px solid #4a5568',
                    borderRadius: '2px',
                    backgroundColor: theme === 'dark' ? '#1a202c' : 'white',
                    width: '150px'
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div 
      className="project-file-explorer"
      style={{
        height: '100%',
        backgroundColor: theme === 'dark' ? '#1a202c' : '#f7fafc',
        color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}
      onClick={() => setContextMenu(null)}
    >
      {construct.getInput('enableSearch') && (
        <div style={{ padding: '8px', borderBottom: '1px solid #4a5568' }}>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value) {
                construct.searchFiles(e.target.value)
              } else {
                construct.clearSearch()
              }
            }}
            style={{
              width: '100%',
              padding: '4px 8px',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              backgroundColor: theme === 'dark' ? '#2d3748' : 'white',
              color: theme === 'dark' ? '#e2e8f0' : '#2d3748'
            }}
          />
        </div>
      )}

      <div style={{ padding: '8px' }}>
        {nodes.map(node => renderNode(node))}
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: theme === 'dark' ? '#2d3748' : 'white',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            padding: '4px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node.type === 'folder' && (
            <>
              <div
                style={menuItemStyle}
                onClick={() => {
                  setNewItemPath(contextMenu.node.path)
                  setNewItemType('file')
                  setContextMenu(null)
                  if (!expandedPaths.includes(contextMenu.node.path)) {
                    handleToggle(contextMenu.node.path)
                  }
                }}
              >
                📄 New File
              </div>
              <div
                style={menuItemStyle}
                onClick={() => {
                  setNewItemPath(contextMenu.node.path)
                  setNewItemType('folder')
                  setContextMenu(null)
                  if (!expandedPaths.includes(contextMenu.node.path)) {
                    handleToggle(contextMenu.node.path)
                  }
                }}
              >
                📁 New Folder
              </div>
              <div style={{ height: '1px', backgroundColor: '#4a5568', margin: '4px 0' }} />
            </>
          )}
          <div
            style={menuItemStyle}
            onClick={() => {
              setRenamingPath(contextMenu.node.path)
              setContextMenu(null)
            }}
          >
            ✏️ Rename
          </div>
          <div
            style={menuItemStyle}
            onClick={() => {
              construct.copyToClipboard(contextMenu.node)
              setContextMenu(null)
            }}
          >
            📋 Copy
          </div>
          <div
            style={menuItemStyle}
            onClick={() => {
              if (confirm(`Delete ${contextMenu.node.name}?`)) {
                handleDelete(contextMenu.node)
              }
              setContextMenu(null)
            }}
          >
            🗑️ Delete
          </div>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  padding: '4px 8px',
  cursor: 'pointer',
  borderRadius: '2px',
  ':hover': {
    backgroundColor: '#4a5568'
  }
}

// Export factory function
export const createProjectFileExplorer = () => new ProjectFileExplorer()

// Export the definition for catalog registration
export const projectFileExplorerDefinition = ProjectFileExplorer.definition