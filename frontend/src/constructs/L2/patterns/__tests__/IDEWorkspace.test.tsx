/**
 * IDEWorkspace L2 Pattern Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IDEWorkspace } from '../IDEWorkspace'

// Mock the L1 constructs
vi.mock('../../../L1/ui/SecureCodeEditor', () => ({
  SecureCodeEditor: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    setContent: vi.fn().mockResolvedValue(undefined),
    getContent: vi.fn().mockResolvedValue('test content'),
    setLanguage: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn().mockResolvedValue(undefined),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Editor</div>
  }))
}))

vi.mock('../../../L1/ui/IntegratedTerminal', () => ({
  IntegratedTerminal: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    executeCommand: vi.fn().mockResolvedValue(undefined),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Terminal</div>
  }))
}))

vi.mock('../../../L1/ui/ProjectFileExplorer', () => ({
  ProjectFileExplorer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    refresh: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Explorer</div>
  }))
}))

vi.mock('../../../L1/ui/ResponsiveLayout', () => ({
  ResponsiveLayout: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    togglePanel: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: (panels: any) => (
      <div>
        <div>{panels.explorer}</div>
        <div>{panels.editor}</div>
        <div>{panels.terminal}</div>
      </div>
    )
  }))
}))

describe('IDEWorkspace', () => {
  let workspace: IDEWorkspace
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (workspace) {
      await workspace.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic configuration', async () => {
      workspace = new IDEWorkspace()
      
      const config = {
        projectPath: '/test-project',
        theme: 'dark' as const
      }
      
      const result = await workspace.initialize(config)
      
      expect(result.workspaceId).toBeDefined()
      expect(result.status).toBe('ready')
      expect(result.components.editor).toBe(true)
      expect(result.components.terminal).toBe(true)
      expect(result.components.explorer).toBe(true)
      expect(result.components.layout).toBe(true)
    })
    
    it('should configure layout with custom settings', async () => {
      workspace = new IDEWorkspace()
      
      const config = {
        projectPath: '/test-project',
        layout: {
          editorPosition: 'center' as const,
          terminalPosition: 'bottom' as const,
          explorerPosition: 'left' as const,
          defaultSizes: {
            explorer: 250,
            terminal: 150
          }
        }
      }
      
      const result = await workspace.initialize(config)
      
      expect(result.status).toBe('ready')
    })
    
    it('should configure editor settings', async () => {
      workspace = new IDEWorkspace()
      
      const config = {
        projectPath: '/test-project',
        editor: {
          language: 'typescript',
          fontSize: 16,
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          autoSave: true,
          autoFormat: true
        }
      }
      
      const result = await workspace.initialize(config)
      
      expect(result.status).toBe('ready')
      expect(result.capabilities.multiFile).toBe(true)
    })
  })
  
  describe('File Operations', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should open a file', async () => {
      const fileOpenedSpy = vi.fn()
      workspace.on('fileOpened', fileOpenedSpy)
      
      await workspace.openFile('/test-project/index.js')
      
      expect(fileOpenedSpy).toHaveBeenCalledWith({
        path: '/test-project/index.js',
        language: 'javascript'
      })
      
      const activeFile = workspace.getActiveFile()
      expect(activeFile?.path).toBe('/test-project/index.js')
      expect(activeFile?.language).toBe('javascript')
    })
    
    it('should create a new file', async () => {
      const fileCreatedSpy = vi.fn()
      workspace.on('fileCreated', fileCreatedSpy)
      
      await workspace.createFile('/test-project/new-file.ts', '// New file')
      
      expect(fileCreatedSpy).toHaveBeenCalledWith({
        path: '/test-project/new-file.ts'
      })
      
      const activeFile = workspace.getActiveFile()
      expect(activeFile?.path).toBe('/test-project/new-file.ts')
    })
    
    it('should save the active file', async () => {
      const fileSavedSpy = vi.fn()
      workspace.on('fileSaved', fileSavedSpy)
      
      await workspace.openFile('/test-project/index.js')
      await workspace.saveActiveFile()
      
      expect(fileSavedSpy).toHaveBeenCalledWith({
        path: '/test-project/index.js'
      })
    })
    
    it('should close a file', async () => {
      const fileClosedSpy = vi.fn()
      workspace.on('fileClosed', fileClosedSpy)
      
      await workspace.openFile('/test-project/file1.js')
      await workspace.openFile('/test-project/file2.js')
      
      await workspace.closeFile('/test-project/file1.js')
      
      expect(fileClosedSpy).toHaveBeenCalledWith({
        path: '/test-project/file1.js'
      })
      
      const openFiles = workspace.getOpenFiles()
      expect(openFiles.length).toBe(1)
      expect(openFiles[0].path).toBe('/test-project/file2.js')
    })
    
    it('should rename a file', async () => {
      const fileRenamedSpy = vi.fn()
      workspace.on('fileRenamed', fileRenamedSpy)
      
      await workspace.openFile('/test-project/old-name.js')
      await workspace.renameFile(
        '/test-project/old-name.js',
        '/test-project/new-name.js'
      )
      
      expect(fileRenamedSpy).toHaveBeenCalledWith({
        oldPath: '/test-project/old-name.js',
        newPath: '/test-project/new-name.js'
      })
      
      const activeFile = workspace.getActiveFile()
      expect(activeFile?.path).toBe('/test-project/new-name.js')
    })
    
    it('should track modified files', async () => {
      const fileModifiedSpy = vi.fn()
      workspace.on('fileModified', fileModifiedSpy)
      
      await workspace.openFile('/test-project/index.js')
      
      // Simulate editor change event
      const editor = (workspace as any).getConstruct('editor')
      const changeHandler = editor.on.mock.calls.find((call: any) => call[0] === 'change')?.[1]
      if (changeHandler) {
        changeHandler({ content: 'modified content' })
      }
      
      expect(fileModifiedSpy).toHaveBeenCalledWith({
        path: '/test-project/index.js'
      })
      
      const modifiedFiles = workspace.getModifiedFiles()
      expect(modifiedFiles.length).toBe(1)
      expect(modifiedFiles[0].path).toBe('/test-project/index.js')
    })
  })
  
  describe('Language Detection', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should detect common programming languages', async () => {
      const testFiles = [
        { path: 'script.js', expectedLanguage: 'javascript' },
        { path: 'app.ts', expectedLanguage: 'typescript' },
        { path: 'main.py', expectedLanguage: 'python' },
        { path: 'index.html', expectedLanguage: 'html' },
        { path: 'styles.css', expectedLanguage: 'css' },
        { path: 'data.json', expectedLanguage: 'json' },
        { path: 'README.md', expectedLanguage: 'markdown' },
        { path: 'script.sh', expectedLanguage: 'bash' }
      ]
      
      for (const { path, expectedLanguage } of testFiles) {
        await workspace.openFile(`/test-project/${path}`)
        const activeFile = workspace.getActiveFile()
        expect(activeFile?.language).toBe(expectedLanguage)
      }
    })
    
    it('should default to plaintext for unknown extensions', async () => {
      await workspace.openFile('/test-project/unknown.xyz')
      const activeFile = workspace.getActiveFile()
      expect(activeFile?.language).toBe('plaintext')
    })
  })
  
  describe('Terminal Integration', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should execute commands in terminal', async () => {
      await workspace.executeCommand('npm test')
      
      const terminal = (workspace as any).getConstruct('terminal')
      expect(terminal.executeCommand).toHaveBeenCalledWith('npm test')
    })
    
    it('should run current file', async () => {
      await workspace.openFile('/test-project/script.js')
      await workspace.runFile()
      
      const terminal = (workspace as any).getConstruct('terminal')
      expect(terminal.executeCommand).toHaveBeenCalledWith('node /test-project/script.js')
    })
    
    it('should run different file types with appropriate commands', async () => {
      const testCases = [
        { file: 'app.ts', command: 'ts-node /test-project/app.ts' },
        { file: 'main.py', command: 'python /test-project/main.py' },
        { file: 'script.sh', command: 'bash /test-project/script.sh' }
      ]
      
      for (const { file, command } of testCases) {
        await workspace.openFile(`/test-project/${file}`)
        await workspace.runFile()
        
        const terminal = (workspace as any).getConstruct('terminal')
        expect(terminal.executeCommand).toHaveBeenCalledWith(command)
      }
    })
  })
  
  describe('Search Functionality', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should search in workspace', async () => {
      const searchCompleteSpy = vi.fn()
      workspace.on('searchComplete', searchCompleteSpy)
      
      const results = await workspace.searchInWorkspace('TODO')
      
      expect(searchCompleteSpy).toHaveBeenCalledWith({
        query: 'TODO',
        results: expect.any(Array)
      })
    })
  })
  
  describe('Theme Management', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should change theme', async () => {
      const themeChangedSpy = vi.fn()
      workspace.on('themeChanged', themeChangedSpy)
      
      await workspace.setTheme('light')
      
      expect(themeChangedSpy).toHaveBeenCalledWith({ theme: 'light' })
      
      const editor = (workspace as any).getConstruct('editor')
      expect(editor.setTheme).toHaveBeenCalledWith('vs')
      
      const terminal = (workspace as any).getConstruct('terminal')
      expect(terminal.updateConfig).toHaveBeenCalledWith({ theme: 'light' })
    })
  })
  
  describe('Panel Management', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should toggle panels', async () => {
      await workspace.togglePanel('explorer')
      
      const layout = (workspace as any).getConstruct('layout')
      expect(layout.togglePanel).toHaveBeenCalledWith('explorer')
    })
  })
  
  describe('Component Interactions', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should handle file selection from explorer', async () => {
      const explorer = (workspace as any).getConstruct('explorer')
      const fileSelectHandler = explorer.on.mock.calls.find(
        (call: any) => call[0] === 'fileSelect'
      )?.[1]
      
      if (fileSelectHandler) {
        await fileSelectHandler({ path: '/test-project/selected.js' })
      }
      
      const activeFile = workspace.getActiveFile()
      expect(activeFile?.path).toBe('/test-project/selected.js')
    })
    
    it('should handle editor save event', async () => {
      await workspace.openFile('/test-project/index.js')
      
      const editor = (workspace as any).getConstruct('editor')
      const saveHandler = editor.on.mock.calls.find(
        (call: any) => call[0] === 'save'
      )?.[1]
      
      if (saveHandler) {
        await saveHandler()
      }
      
      // Should trigger save of active file
    })
  })
  
  describe('Health Check', () => {
    it('should report healthy status when initialized', async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
      
      const health = await workspace.healthCheck()
      
      expect(health.healthy).toBe(true)
      expect(health.issues).toHaveLength(0)
    })
    
    it('should report unhealthy status when not initialized', async () => {
      workspace = new IDEWorkspace()
      
      const health = await workspace.healthCheck()
      
      expect(health.healthy).toBe(false)
      expect(health.issues).toContain('Pattern not initialized')
    })
  })
  
  describe('Export/Import Configuration', () => {
    beforeEach(async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
    })
    
    it('should export configuration', () => {
      const config = workspace.exportConfiguration()
      
      expect(config.pattern).toBe('platform-l2-ide-workspace')
      expect(config.version).toBe('1.0.0')
      expect(config.configuration).toBeDefined()
      expect(config.timestamp).toBeDefined()
    })
    
    it('should reject import for different pattern', async () => {
      const config = {
        pattern: 'different-pattern',
        version: '1.0.0',
        configuration: {}
      }
      
      await expect(
        workspace.importConfiguration(config)
      ).rejects.toThrow('Configuration is for pattern different-pattern')
    })
  })
  
  describe('Destruction', () => {
    it('should clean up all components on destroy', async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
      
      const destroyedSpy = vi.fn()
      workspace.on('destroyed', destroyedSpy)
      
      await workspace.destroy()
      
      expect(destroyedSpy).toHaveBeenCalled()
      
      const status = workspace.getStatus()
      expect(status.initialized).toBe(false)
    })
  })
  
  describe('UI Rendering', () => {
    it('should render all components', async () => {
      workspace = new IDEWorkspace()
      await workspace.initialize({
        projectPath: '/test-project'
      })
      
      const { container } = render(workspace.render())
      
      expect(screen.getByText('Mock Explorer')).toBeInTheDocument()
      expect(screen.getByText('Mock Editor')).toBeInTheDocument()
      expect(screen.getByText('Mock Terminal')).toBeInTheDocument()
      
      expect(container.querySelector('#ide-workspace')).toBeInTheDocument()
    })
  })
})