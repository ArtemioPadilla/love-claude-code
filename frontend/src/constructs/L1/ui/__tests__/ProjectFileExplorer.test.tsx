import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectFileExplorer } from '../ProjectFileExplorer'

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (content: string) => {
      // Simple mock sanitization
      return content.replace(/[<>]/g, '')
    }
  }
}))

// Helper to create test file tree
const createTestFileTree = () => [
  {
    path: '/src',
    name: 'src',
    type: 'folder' as const,
    children: [
      { path: '/src/index.js', name: 'index.js', type: 'file' as const },
      { path: '/src/app.js', name: 'app.js', type: 'file' as const },
      {
        path: '/src/components',
        name: 'components',
        type: 'folder' as const,
        children: [
          { path: '/src/components/Button.tsx', name: 'Button.tsx', type: 'file' as const },
          { path: '/src/components/Modal.tsx', name: 'Modal.tsx', type: 'file' as const }
        ]
      }
    ]
  },
  { path: '/README.md', name: 'README.md', type: 'file' as const },
  { path: '/.gitignore', name: '.gitignore', type: 'file' as const }
]

describe('L1: ProjectFileExplorer', () => {
  let construct: ProjectFileExplorer

  beforeEach(() => {
    construct = new ProjectFileExplorer()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      expect(construct.metadata.id).toBe('platform-l1-project-file-explorer')
      expect(construct.level).toBe('L1')
      expect(construct.getInput('enableSearch')).toBe(true)
      expect(construct.getInput('enableCRUD')).toBe(true)
      expect(construct.getInput('enableDragDrop')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        enableSearch: false,
        enableCRUD: false,
        showHiddenFiles: true,
        theme: 'dark',
        allowedFileTypes: ['.js', '.ts'],
        readOnlyPaths: ['/node_modules']
      })
      
      expect(construct.getInput('enableSearch')).toBe(false)
      expect(construct.getInput('enableCRUD')).toBe(false)
      expect(construct.getInput('showHiddenFiles')).toBe(true)
      expect(construct.getInput('theme')).toBe('dark')
      expect(construct.getInput('allowedFileTypes')).toEqual(['.js', '.ts'])
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(90)
    })

    it('should be built with L0 FileTreePrimitive', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      expect(construct.getBuiltWithConstructs()).toContain('platform-l0-file-tree-primitive')
    })
  })

  describe('Security Features', () => {
    beforeEach(async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        readOnlyPaths: ['/src/vendor'],
        allowedFileTypes: ['.js', '.ts', '.tsx']
      })
    })

    it('should validate file paths', async () => {
      // Directory traversal attempts should fail
      await expect(construct.createFile('../etc', 'passwd')).rejects.toThrow('Invalid parent path')
      await expect(construct.createFile('/src/..', 'hack.js')).rejects.toThrow('Invalid parent path')
    })

    it('should sanitize file names', async () => {
      const file = await construct.createFile('/src', '<script>alert("xss")</script>.js')
      expect(file?.name).toBe('scriptalert("xss")/script.js')
    })

    it('should enforce allowed file types', async () => {
      await expect(construct.createFile('/src', 'test.exe')).rejects.toThrow('File type not allowed')
      await expect(construct.createFile('/src', 'test.js')).resolves.toBeTruthy()
    })

    it('should enforce read-only paths', async () => {
      await expect(construct.createFile('/src/vendor', 'file.js')).rejects.toThrow('read-only location')
      await expect(construct.delete('/src/vendor/lib.js')).rejects.toThrow('read-only item')
    })

    it('should enforce max file name length', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: [],
        maxFileNameLength: 10
      })
      
      const file = await construct.createFile('/src', 'verylongfilename.js')
      expect(file?.name.length).toBeLessThanOrEqual(10)
    })
  })

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        enableCRUD: true
      })
    })

    it('should create files', async () => {
      const file = await construct.createFile('/src', 'newfile.js')
      
      expect(file).toBeDefined()
      expect(file?.path).toBe('/src/newfile.js')
      expect(file?.name).toBe('newfile.js')
      expect(file?.type).toBe('file')
      
      const lastOp = construct.getOutput('lastOperation')
      expect(lastOp.type).toBe('create')
      expect(lastOp.success).toBe(true)
    })

    it('should create folders', async () => {
      const folder = await construct.createFolder('/src', 'utils')
      
      expect(folder).toBeDefined()
      expect(folder?.path).toBe('/src/utils')
      expect(folder?.name).toBe('utils')
      expect(folder?.type).toBe('folder')
      expect(folder?.children).toEqual([])
    })

    it('should rename items', async () => {
      const success = await construct.rename('/src/index.js', 'main.js')
      
      expect(success).toBe(true)
      
      const lastOp = construct.getOutput('lastOperation')
      expect(lastOp.type).toBe('rename')
      expect(lastOp.path).toBe('/src/index.js')
      expect(lastOp.newPath).toBe('/src/main.js')
    })

    it('should delete items', async () => {
      const success = await construct.delete('/src/app.js')
      
      expect(success).toBe(true)
      
      const lastOp = construct.getOutput('lastOperation')
      expect(lastOp.type).toBe('delete')
      expect(lastOp.path).toBe('/src/app.js')
    })

    it('should fail CRUD when disabled', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        enableCRUD: false
      })
      
      await expect(construct.createFile('/src', 'test.js')).rejects.toThrow('CRUD operations are disabled')
      await expect(construct.rename('/src/index.js', 'main.js')).rejects.toThrow('CRUD operations are disabled')
      await expect(construct.delete('/src/app.js')).rejects.toThrow('CRUD operations are disabled')
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        enableSearch: true
      })
    })

    it('should search files by name', async () => {
      const results = await construct.searchFiles('Button')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Button.tsx')
      expect(construct.getOutput('searchActive')).toBe(true)
    })

    it('should handle case-insensitive search', async () => {
      const results = await construct.searchFiles('button')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Button.tsx')
    })

    it('should search in nested folders', async () => {
      const results = await construct.searchFiles('.tsx')
      
      expect(results).toHaveLength(2)
      expect(results.map(r => r.name)).toContain('Button.tsx')
      expect(results.map(r => r.name)).toContain('Modal.tsx')
    })

    it('should clear search', () => {
      construct.searchFiles('test')
      construct.clearSearch()
      
      expect(construct.getOutput('searchActive')).toBe(false)
    })

    it('should return empty when search disabled', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        enableSearch: false
      })
      
      const results = await construct.searchFiles('Button')
      expect(results).toEqual([])
    })
  })

  describe('Clipboard Operations', () => {
    beforeEach(async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree()
      })
    })

    it('should copy to clipboard', () => {
      const node = { path: '/src/app.js', name: 'app.js', type: 'file' as const }
      construct.copyToClipboard(node)
      
      expect(construct.getOutput('clipboardItem')).toEqual(node)
    })

    it('should paste from clipboard', async () => {
      const node = { path: '/src/app.js', name: 'app.js', type: 'file' as const }
      construct.copyToClipboard(node)
      
      const pasted = await construct.pasteFromClipboard('/src/components')
      
      expect(pasted).toBeDefined()
      expect(pasted?.path).toBe('/src/components/app.js')
      expect(pasted?.name).toBe('app.js')
      
      const lastOp = construct.getOutput('lastOperation')
      expect(lastOp.type).toBe('paste')
    })

    it('should validate paste target', async () => {
      const node = { path: '/src/app.js', name: 'app.js', type: 'file' as const }
      construct.copyToClipboard(node)
      
      await expect(construct.pasteFromClipboard('../etc')).rejects.toThrow('Invalid target path')
    })
  })

  describe('UI Rendering', () => {
    it('should render file tree', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree()
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.project-file-explorer')).toBeInTheDocument()
        expect(screen.getByText('src')).toBeInTheDocument()
        expect(screen.getByText('README.md')).toBeInTheDocument()
      })
    })

    it('should show/hide hidden files', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        showHiddenFiles: false
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(screen.queryByText('.gitignore')).not.toBeInTheDocument()
      })
      
      // Re-render with hidden files shown
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        showHiddenFiles: true
      })
      
      const { container: container2 } = render(construct.render())
      
      await waitFor(() => {
        expect(screen.getByText('.gitignore')).toBeInTheDocument()
      })
    })

    it('should show search input when enabled', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        enableSearch: true
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument()
      })
    })

    it('should support dark theme', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree(),
        theme: 'dark'
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        const explorer = container.querySelector('.project-file-explorer')
        expect(explorer).toHaveStyle({ backgroundColor: '#1a202c' })
      })
    })

    it('should show file icons', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree()
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        // Check for folder and file icons
        expect(container.textContent).toContain('📁') // Folder icon
        expect(container.textContent).toContain('📄') // File icon
      })
    })
  })

  describe('Event Handling', () => {
    beforeEach(async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree()
      })
    })

    it('should emit fileCreated event', async () => {
      const mockHandler = vi.fn()
      construct.on('fileCreated', mockHandler)
      
      await construct.createFile('/src', 'test.js')
      
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        path: '/src/test.js',
        name: 'test.js',
        type: 'file'
      }))
    })

    it('should emit itemRenamed event', async () => {
      const mockHandler = vi.fn()
      construct.on('itemRenamed', mockHandler)
      
      await construct.rename('/src/index.js', 'main.js')
      
      expect(mockHandler).toHaveBeenCalledWith({
        oldPath: '/src/index.js',
        newPath: '/src/main.js'
      })
    })

    it('should emit searchCompleted event', async () => {
      const mockHandler = vi.fn()
      construct.on('searchCompleted', mockHandler)
      
      await construct.searchFiles('Button')
      
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        query: 'Button',
        results: expect.any(Array)
      }))
    })
  })

  describe('Node Counting', () => {
    it('should count files and folders correctly', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: createTestFileTree()
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(construct.getOutput('fileCount')).toBe(5) // 5 files in test tree
        expect(construct.getOutput('folderCount')).toBe(2) // 2 folders in test tree
      })
    })
  })

  describe('L1 Characteristics', () => {
    it('should have enhanced features over L0', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      // Should have search capability
      expect(construct.inputs.some(i => i.name === 'enableSearch')).toBe(true)
      
      // Should have CRUD operations
      expect(construct.inputs.some(i => i.name === 'enableCRUD')).toBe(true)
      
      // Should have security features
      expect(construct.inputs.some(i => i.name === 'allowedFileTypes')).toBe(true)
      expect(construct.inputs.some(i => i.name === 'readOnlyPaths')).toBe(true)
      
      // Should have theme support
      expect(construct.inputs.some(i => i.name === 'theme')).toBe(true)
    })

    it('should provide enhanced outputs', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      // Should track file operations
      expect(construct.outputs.some(o => o.name === 'lastOperation')).toBe(true)
      
      // Should support clipboard
      expect(construct.outputs.some(o => o.name === 'clipboardItem')).toBe(true)
      
      // Should provide counts
      expect(construct.outputs.some(o => o.name === 'fileCount')).toBe(true)
      expect(construct.outputs.some(o => o.name === 'folderCount')).toBe(true)
    })

    it('should have security metadata', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      const security = construct.metadata.security
      expect(security.length).toBeGreaterThan(0)
      expect(security.some((s: any) => s.aspect === 'Path Validation')).toBe(true)
      expect(security.some((s: any) => s.aspect === 'XSS Protection')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file tree', async () => {
      await construct.initialize({
        projectId: 'test-project',
        nodes: []
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(construct.getOutput('fileCount')).toBe(0)
        expect(construct.getOutput('folderCount')).toBe(0)
      })
    })

    it('should handle deeply nested structures', async () => {
      const deepTree = [{
        path: '/a',
        name: 'a',
        type: 'folder' as const,
        children: [{
          path: '/a/b',
          name: 'b',
          type: 'folder' as const,
          children: [{
            path: '/a/b/c',
            name: 'c',
            type: 'folder' as const,
            children: [{
              path: '/a/b/c/deep.txt',
              name: 'deep.txt',
              type: 'file' as const
            }]
          }]
        }]
      }]
      
      await construct.initialize({
        projectId: 'test-project',
        nodes: deepTree
      })
      
      const results = await construct.searchFiles('deep')
      expect(results).toHaveLength(1)
      expect(results[0].path).toBe('/a/b/c/deep.txt')
    })

    it('should handle special characters in file names', async () => {
      const file = await construct.createFile('/src', 'file with spaces & symbols!.js')
      expect(file?.name).toBe('file with spaces & symbols!.js')
    })
  })
})