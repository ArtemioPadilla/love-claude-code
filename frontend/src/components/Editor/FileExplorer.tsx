import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiFolder,
  FiFile,
  FiChevronRight,
  FiSearch,
  FiMoreVertical,
  FiRefreshCw,
  FiX,
  FiEdit3,
  FiTrash2,
  FiCopy,
  FiFilePlus,
  FiFolderPlus
} from 'react-icons/fi'
import {
  SiTypescript,
  SiJavascript,
  SiReact,
  SiHtml5,
  SiCss3,
  SiPython,
  SiMarkdown,
  SiJson
} from 'react-icons/si'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  path: string
  extension?: string
}

interface FileExplorerProps {
  files: FileNode[]
  selectedFile?: string
  onFileSelect: (path: string) => void
  onCreateFile?: (path: string) => void
  onCreateFolder?: (path: string) => void
  onRename?: (path: string, newName: string) => void
  onDelete?: (path: string) => void
  onCopyPath?: (path: string) => void
  onRefresh?: () => void
  onClose?: () => void
  isLoading?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  node: FileNode
  onRename: () => void
  onDelete: () => void
  onCopyPath: () => void
  onNewFile?: () => void
  onNewFolder?: () => void
  onClose: () => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  node, 
  onRename, 
  onDelete, 
  onCopyPath,
  onNewFile,
  onNewFolder,
  onClose 
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50"
      style={{ 
        left: Math.min(x, window.innerWidth - 200), 
        top: Math.min(y, window.innerHeight - 200) 
      }}
    >
      <button
        onClick={() => {
          onRename()
          onClose()
        }}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors w-full text-left text-sm text-gray-300"
      >
        <FiEdit3 size={14} />
        Rename
      </button>
      
      <button
        onClick={() => {
          onCopyPath()
          onClose()
        }}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors w-full text-left text-sm text-gray-300"
      >
        <FiCopy size={14} />
        Copy Path
      </button>
      
      {node.type === 'folder' && (
        <>
          <div className="h-px bg-gray-800 my-1" />
          {onNewFile && (
            <button
              onClick={() => {
                onNewFile()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors w-full text-left text-sm text-gray-300"
            >
              <FiFilePlus size={14} />
              New File
            </button>
          )}
          {onNewFolder && (
            <button
              onClick={() => {
                onNewFolder()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors w-full text-left text-sm text-gray-300"
            >
              <FiFolderPlus size={14} />
              New Folder
            </button>
          )}
        </>
      )}
      
      <div className="h-px bg-gray-800 my-1" />
      
      <button
        onClick={() => {
          onDelete()
          onClose()
        }}
        className="flex items-center gap-2 px-3 py-2 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full text-left text-sm text-gray-300"
      >
        <FiTrash2 size={14} />
        Delete
      </button>
    </motion.div>
  )
}

const getFileIcon = (fileName: string, extension?: string) => {
  const ext = extension || fileName.split('.').pop()
  const iconProps = { size: 16, className: 'flex-shrink-0' }
  
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <SiTypescript {...iconProps} className="text-blue-400" />
    case 'js':
    case 'jsx':
      return <SiJavascript {...iconProps} className="text-yellow-400" />
    case 'html':
      return <SiHtml5 {...iconProps} className="text-orange-400" />
    case 'css':
    case 'scss':
    case 'sass':
      return <SiCss3 {...iconProps} className="text-blue-300" />
    case 'py':
      return <SiPython {...iconProps} className="text-green-400" />
    case 'md':
    case 'mdx':
      return <SiMarkdown {...iconProps} className="text-gray-400" />
    case 'json':
      return <SiJson {...iconProps} className="text-yellow-300" />
    default:
      if (fileName.includes('react') || ext === 'jsx' || ext === 'tsx') {
        return <SiReact {...iconProps} className="text-cyan-400" />
      }
      return <FiFile {...iconProps} className="text-gray-400" />
  }
}

const FileTreeNode: React.FC<{
  node: FileNode
  level: number
  selectedFile?: string
  onFileSelect: (path: string) => void
  searchQuery: string
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
}> = ({ node, level, selectedFile, onFileSelect, searchQuery, onContextMenu }) => {
  const [isOpen, setIsOpen] = useState(level < 2)
  
  const isSelected = selectedFile === node.path
  const isFolder = node.type === 'folder'
  
  const matchesSearch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase())
    : true
    
  const hasMatchingChildren = node.children?.some(child => 
    child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (child.children && hasMatchingChildrenRecursive(child, searchQuery))
  )
  
  const shouldShow = !searchQuery || matchesSearch || hasMatchingChildren
  
  if (!shouldShow) return null
  
  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen)
    } else {
      onFileSelect(node.path)
    }
  }
  
  return (
    <div className="select-none">
      <motion.div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
          transition-all duration-150
          ${isSelected 
            ? 'bg-blue-500/20 text-blue-300 shadow-sm' 
            : 'hover:bg-gray-800/50 text-gray-300'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e, node)
        }}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {isFolder && (
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-500"
          >
            <FiChevronRight size={14} />
          </motion.div>
        )}
        
        <div className={`${isFolder ? 'text-gray-400' : ''}`}>
          {isFolder ? (
            <FiFolder size={16} />
          ) : (
            getFileIcon(node.name, node.extension)
          )}
        </div>
        
        <span className={`
          text-sm truncate flex-1
          ${matchesSearch && searchQuery ? 'font-semibold' : ''}
        `}>
          {node.name}
        </span>
      </motion.div>
      
      <AnimatePresence>
        {isFolder && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map(child => (
              <FileTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                searchQuery={searchQuery}
                onContextMenu={onContextMenu}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const hasMatchingChildrenRecursive = (node: FileNode, query: string): boolean => {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true
  if (node.children) {
    return node.children.some(child => hasMatchingChildrenRecursive(child, query))
  }
  return false
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onCopyPath,
  onRefresh,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null)
  
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }
  
  const handleRename = () => {
    if (contextMenu && onRename) {
      const newName = prompt('Enter new name:', contextMenu.node.name)
      if (newName && newName !== contextMenu.node.name) {
        onRename(contextMenu.node.path, newName)
      }
    }
  }
  
  const handleDelete = () => {
    if (contextMenu && onDelete) {
      if (confirm(`Delete ${contextMenu.node.name}?`)) {
        onDelete(contextMenu.node.path)
      }
    }
  }
  
  const handleCopyPath = () => {
    if (contextMenu && onCopyPath) {
      navigator.clipboard.writeText(contextMenu.node.path)
      onCopyPath(contextMenu.node.path)
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-800 transition-colors"
                title="Hide Explorer"
              >
                <FiX size={14} className="text-gray-400" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Explorer
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className="p-1.5 rounded hover:bg-gray-800 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded hover:bg-gray-800 transition-colors"
              title="Actions"
            >
              <FiMoreVertical size={14} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-8 pr-3 py-1.5 
              bg-gray-900 border border-gray-800 
              rounded text-sm text-gray-200
              placeholder-gray-500
              focus:outline-none focus:border-blue-500
              transition-colors
            "
          />
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No files in workspace
          </div>
        ) : (
          files.map(node => (
            <FileTreeNode
              key={node.id}
              node={node}
              level={0}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              searchQuery={searchQuery}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>
      
      {/* Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 top-12 bg-gray-900 border border-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
          >
            <button
              onClick={() => {
                onCreateFile?.('/')
                setShowActions(false)
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 transition-colors w-full text-left text-sm text-gray-300"
            >
              <FiFile size={14} />
              New File
            </button>
            <button
              onClick={() => {
                onCreateFolder?.('/')
                setShowActions(false)
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 transition-colors w-full text-left text-sm text-gray-300"
            >
              <FiFolder size={14} />
              New Folder
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            node={contextMenu.node}
            onRename={handleRename}
            onDelete={handleDelete}
            onCopyPath={handleCopyPath}
            onNewFile={contextMenu.node.type === 'folder' && onCreateFile ? 
              () => onCreateFile(contextMenu.node.path) : undefined}
            onNewFolder={contextMenu.node.type === 'folder' && onCreateFolder ? 
              () => onCreateFolder(contextMenu.node.path) : undefined}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Example usage with styled panel
export const FileExplorerPanel: React.FC<Omit<FileExplorerProps, 'files'> & { files?: FileNode[] }> = (props) => {
  const defaultFiles: FileNode[] = [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          children: [
            {
              id: '3',
              name: 'App.tsx',
              type: 'file',
              path: '/src/components/App.tsx',
              extension: 'tsx'
            }
          ]
        },
        {
          id: '4',
          name: 'index.ts',
          type: 'file',
          path: '/src/index.ts',
          extension: 'ts'
        }
      ]
    }
  ]
  
  return (
    <FileExplorer
      files={props.files || defaultFiles}
      {...props}
    />
  )
}