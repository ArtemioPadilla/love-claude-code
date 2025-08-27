/**
 * ProjectManagementSystem L2 Pattern Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProjectManagementSystem } from '../ProjectManagementSystem'

// Mock the L1 constructs
vi.mock('../../../L1/ui/ProjectFileExplorer', () => ({
  ProjectFileExplorer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock File Explorer</div>
  }))
}))

vi.mock('../../../L1/infrastructure/SecureAuthService', () => ({
  SecureAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    checkAuth: vi.fn().mockResolvedValue(true),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Auth Service</div>
  }))
}))

vi.mock('../../../L1/infrastructure/EncryptedDatabase', () => ({
  EncryptedDatabase: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Database</div>
  }))
}))

vi.mock('../../../L1/infrastructure/CDNStorage', () => ({
  CDNStorage: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    upload: vi.fn().mockResolvedValue('https://cdn.example.com/file'),
    get: vi.fn().mockResolvedValue('file content'),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Storage</div>
  }))
}))

vi.mock('../../../L1/infrastructure/RestAPIService', () => ({
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    call: vi.fn().mockResolvedValue({ success: true }),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock API Service</div>
  }))
}))

vi.mock('../../../L1/ui/ResponsiveLayout', () => ({
  ResponsiveLayout: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    off: vi.fn(),
    render: (panels: any) => (
      <div>
        <div>{panels['project-list']}</div>
        <div>{panels['project-details']}</div>
        <div>{panels['project-tools']}</div>
      </div>
    )
  }))
}))

describe('ProjectManagementSystem', () => {
  let system: ProjectManagementSystem
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (system) {
      await system.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic configuration', async () => {
      system = new ProjectManagementSystem()
      
      const config = {
        userId: 'user-123',
        features: {
          versionControl: true,
          collaboration: true
        }
      }
      
      const result = await system.initialize(config)
      
      expect(result.systemId).toBeDefined()
      expect(result.status).toBe('ready')
      expect(result.capabilities.versionControl).toBe(true)
      expect(result.capabilities.collaboration).toBe(true)
      expect(result.statistics.totalProjects).toBe(0)
    })
    
    it('should configure with organization settings', async () => {
      system = new ProjectManagementSystem()
      
      const config = {
        userId: 'user-123',
        organizationId: 'org-456',
        permissions: {
          defaultRole: 'editor' as const,
          publicProjects: true,
          maxCollaborators: 10
        }
      }
      
      const result = await system.initialize(config)
      
      expect(result.status).toBe('ready')
    })
    
    it('should configure storage limits', async () => {
      system = new ProjectManagementSystem()
      
      const config = {
        userId: 'user-123',
        storage: {
          maxProjectSize: 1000, // 1GB
          maxFileSize: 100, // 100MB
          allowedFileTypes: ['text/*', 'image/*'],
          cdnEnabled: true
        }
      }
      
      const result = await system.initialize(config)
      
      expect(result.status).toBe('ready')
    })
  })
  
  describe('Project Management', () => {
    beforeEach(async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123',
        features: {
          versionControl: true
        }
      })
    })
    
    it('should create a new project', async () => {
      const projectCreatedSpy = vi.fn()
      system.on('projectCreated', projectCreatedSpy)
      
      const projectId = await system.createProject({
        name: 'Test Project',
        description: 'A test project',
        type: 'web'
      })
      
      expect(projectId).toBeDefined()
      expect(projectCreatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: projectId,
          name: 'Test Project',
          type: 'web',
          owner: 'user-123'
        })
      )
      
      const activeProject = system.getActiveProject()
      expect(activeProject?.id).toBe(projectId)
    })
    
    it('should load a project', async () => {
      const database = (system as any).getConstruct('database')
      database.get.mockResolvedValue({
        id: 'proj-123',
        name: 'Loaded Project',
        type: 'api',
        owner: 'user-123',
        permissions: {
          owner: 'user-123',
          collaborators: []
        }
      })
      
      await system.loadProject('proj-123')
      
      const activeProject = system.getActiveProject()
      expect(activeProject?.id).toBe('proj-123')
      expect(activeProject?.name).toBe('Loaded Project')
    })
    
    it('should update project details', async () => {
      const projectId = await system.createProject({ name: 'Original Name' })
      
      await system.updateProject(projectId, {
        name: 'Updated Name',
        description: 'Updated description'
      })
      
      const project = system.getActiveProject()
      expect(project?.name).toBe('Updated Name')
      expect(project?.description).toBe('Updated description')
    })
    
    it('should delete a project', async () => {
      const projectId = await system.createProject({ name: 'To Delete' })
      const deletedSpy = vi.fn()
      system.on('projectDeleted', deletedSpy)
      
      await system.deleteProject(projectId)
      
      expect(deletedSpy).toHaveBeenCalledWith({ projectId })
      expect(system.getAllProjects().find(p => p.id === projectId)).toBeUndefined()
    })
    
    it('should archive a project', async () => {
      const projectId = await system.createProject({ name: 'To Archive' })
      
      await system.archiveProject(projectId)
      
      const projects = system.getAllProjects()
      const archivedProject = projects.find(p => p.id === projectId)
      expect(archivedProject?.status).toBe('archived')
    })
  })
  
  describe('File Operations', () => {
    let projectId: string
    
    beforeEach(async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      projectId = await system.createProject({ name: 'File Test Project' })
    })
    
    it('should create a file', async () => {
      const fileCreatedSpy = vi.fn()
      system.on('fileCreated', fileCreatedSpy)
      
      await system.createFile('/index.js', 'console.log("Hello");')
      
      expect(fileCreatedSpy).toHaveBeenCalledWith({
        projectId,
        path: '/index.js',
        file: expect.objectContaining({
          path: `/projects/${projectId}/index.js`,
          content: 'console.log("Hello");',
          mimeType: 'application/javascript'
        })
      })
    })
    
    it('should update a file', async () => {
      await system.createFile('/index.js', 'original content')
      
      const fileUpdatedSpy = vi.fn()
      system.on('fileUpdated', fileUpdatedSpy)
      
      await system.updateFile('/index.js', 'updated content')
      
      expect(fileUpdatedSpy).toHaveBeenCalledWith({
        projectId,
        path: '/index.js',
        file: expect.objectContaining({
          content: 'updated content',
          version: 1
        })
      })
    })
    
    it('should delete a file', async () => {
      await system.createFile('/temp.txt', 'temporary')
      
      const fileDeletedSpy = vi.fn()
      system.on('fileDeleted', fileDeletedSpy)
      
      await system.deleteFile('/temp.txt')
      
      expect(fileDeletedSpy).toHaveBeenCalledWith({
        projectId,
        path: '/temp.txt'
      })
    })
    
    it('should open a file', async () => {
      await system.createFile('/readme.md', '# README')
      
      const fileOpenedSpy = vi.fn()
      system.on('fileOpened', fileOpenedSpy)
      
      const file = await system.openFile('/readme.md')
      
      expect(file).toBeDefined()
      expect(file?.content).toBe('# README')
      expect(file?.mimeType).toBe('text/markdown')
    })
    
    it('should detect mime types correctly', async () => {
      const testFiles = [
        { path: '/script.js', expectedType: 'application/javascript' },
        { path: '/styles.css', expectedType: 'text/css' },
        { path: '/page.html', expectedType: 'text/html' },
        { path: '/data.json', expectedType: 'application/json' },
        { path: '/image.png', expectedType: 'image/png' },
        { path: '/readme.md', expectedType: 'text/markdown' }
      ]
      
      for (const { path, expectedType } of testFiles) {
        await system.createFile(path, 'content')
        const file = await system.openFile(path)
        expect(file?.mimeType).toBe(expectedType)
      }
    })
  })
  
  describe('Permission Management', () => {
    let projectId: string
    
    beforeEach(async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123',
        permissions: {
          maxCollaborators: 5
        }
      })
      projectId = await system.createProject({ name: 'Collab Project' })
    })
    
    it('should add collaborators', async () => {
      const collaboratorAddedSpy = vi.fn()
      system.on('collaboratorAdded', collaboratorAddedSpy)
      
      await system.addCollaborator(projectId, 'user-456', 'editor')
      
      expect(collaboratorAddedSpy).toHaveBeenCalledWith({
        projectId,
        userId: 'user-456',
        role: 'editor'
      })
      
      const project = system.getActiveProject()
      expect(project?.permissions?.collaborators).toHaveLength(1)
      expect(project?.permissions?.collaborators[0].userId).toBe('user-456')
    })
    
    it('should enforce max collaborators limit', async () => {
      // Add collaborators up to limit
      for (let i = 1; i <= 5; i++) {
        await system.addCollaborator(projectId, `user-${i}`, 'editor')
      }
      
      // Try to add one more
      await expect(
        system.addCollaborator(projectId, 'user-6', 'editor')
      ).rejects.toThrow('Maximum collaborators limit reached')
    })
    
    it('should remove collaborators', async () => {
      await system.addCollaborator(projectId, 'user-456', 'editor')
      
      const collaboratorRemovedSpy = vi.fn()
      system.on('collaboratorRemoved', collaboratorRemovedSpy)
      
      await system.removeCollaborator(projectId, 'user-456')
      
      expect(collaboratorRemovedSpy).toHaveBeenCalledWith({
        projectId,
        userId: 'user-456'
      })
      
      const project = system.getActiveProject()
      expect(project?.permissions?.collaborators).toHaveLength(0)
    })
    
    it('should check permissions correctly', async () => {
      // Owner should have all permissions
      expect(await system.checkPermission(projectId, 'view')).toBe(true)
      expect(await system.checkPermission(projectId, 'edit')).toBe(true)
      expect(await system.checkPermission(projectId, 'admin')).toBe(true)
      
      // Test with different user
      (system as any).config.userId = 'user-456'
      
      // No access by default
      expect(await system.checkPermission(projectId, 'view')).toBe(false)
      
      // Add as viewer
      ;(system as any).config.userId = 'user-123' // Switch back to owner
      await system.addCollaborator(projectId, 'user-456', 'viewer')
      ;(system as any).config.userId = 'user-456'
      
      expect(await system.checkPermission(projectId, 'view')).toBe(true)
      expect(await system.checkPermission(projectId, 'edit')).toBe(false)
      expect(await system.checkPermission(projectId, 'admin')).toBe(false)
    })
  })
  
  describe('Deployment', () => {
    let projectId: string
    
    beforeEach(async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123',
        features: {
          deployment: true
        }
      })
      projectId = await system.createProject({
        name: 'Deploy Project',
        settings: {
          buildCommand: 'npm run build'
        }
      })
    })
    
    it('should deploy a project', async () => {
      const deploymentStartedSpy = vi.fn()
      const deploymentCompletedSpy = vi.fn()
      system.on('deploymentStarted', deploymentStartedSpy)
      system.on('deploymentCompleted', deploymentCompletedSpy)
      
      await system.deployProject(projectId, 'production')
      
      expect(deploymentStartedSpy).toHaveBeenCalledWith({
        projectId,
        target: 'production'
      })
      
      expect(deploymentCompletedSpy).toHaveBeenCalledWith({
        projectId,
        target: 'production'
      })
      
      const project = system.getActiveProject()
      expect(project?.stats?.deployments).toBe(1)
      expect(project?.stats?.lastBuild).toBeDefined()
    })
    
    it('should handle deployment failure', async () => {
      const apiService = (system as any).getConstruct('apiService')
      apiService.call.mockRejectedValue(new Error('Deployment failed'))
      
      const deploymentFailedSpy = vi.fn()
      system.on('deploymentFailed', deploymentFailedSpy)
      
      await expect(
        system.deployProject(projectId, 'production')
      ).rejects.toThrow('Deployment failed')
      
      expect(deploymentFailedSpy).toHaveBeenCalled()
    })
  })
  
  describe('Search and Activity', () => {
    beforeEach(async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      
      // Create test projects
      await system.createProject({ name: 'React App', tags: ['frontend', 'react'] })
      await system.createProject({ name: 'API Server', tags: ['backend', 'node'] })
      await system.createProject({ name: 'React Native App', tags: ['mobile', 'react'] })
    })
    
    it('should search projects', async () => {
      const results = await system.searchProjects('react')
      
      expect(results).toHaveLength(2)
      expect(results[0].name).toContain('React')
      expect(results[1].name).toContain('React')
    })
    
    it('should search by tags', async () => {
      const results = await system.searchProjects('backend')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('API Server')
    })
    
    it('should track project activity', async () => {
      const projectId = await system.createProject({ name: 'Activity Test' })
      await system.updateProject(projectId, { description: 'Updated' })
      await system.createFile('/test.js', 'test')
      
      const activities = await system.getProjectActivity(projectId)
      
      expect(activities.length).toBeGreaterThan(0)
      expect(activities.find(a => a.action === 'created')).toBeDefined()
      expect(activities.find(a => a.action === 'updated')).toBeDefined()
    })
  })
  
  describe('Statistics', () => {
    it('should track project statistics', async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123',
        features: {
          collaboration: true
        }
      })
      
      // Create projects
      const proj1 = await system.createProject({ name: 'Project 1' })
      const proj2 = await system.createProject({ name: 'Project 2' })
      
      // Add collaborators
      await system.addCollaborator(proj1, 'user-456', 'editor')
      await system.addCollaborator(proj1, 'user-789', 'viewer')
      await system.addCollaborator(proj2, 'user-456', 'admin')
      
      // Archive one project
      await system.archiveProject(proj2)
      
      const stats = system.getOutputs().statistics
      
      expect(stats.totalProjects).toBe(2)
      expect(stats.activeProjects).toBe(1)
      expect(stats.collaborators).toBe(3)
    })
  })
  
  describe('Auto-save', () => {
    it('should auto-save project changes', async () => {
      vi.useFakeTimers()
      
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      
      const projectId = await system.createProject({ name: 'Auto-save Test' })
      const database = (system as any).getConstruct('database')
      
      // Clear previous calls
      database.update.mockClear()
      
      // Make a change
      await system.updateProject(projectId, { description: 'Changed' })
      database.update.mockClear()
      
      // Advance time by 1 minute
      vi.advanceTimersByTime(60000)
      
      // Should have saved
      await waitFor(() => {
        expect(database.update).toHaveBeenCalledWith(
          'projects',
          projectId,
          expect.any(Object)
        )
      })
      
      vi.useRealTimers()
    })
  })
  
  describe('Health Check', () => {
    it('should report healthy status when initialized', async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      
      const health = await system.healthCheck()
      
      expect(health.healthy).toBe(true)
      expect(health.issues).toHaveLength(0)
    })
  })
  
  describe('UI Rendering', () => {
    it('should render project management UI', async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      
      // Create projects
      await system.createProject({ name: 'Project A', type: 'web' })
      await system.createProject({ name: 'Project B', type: 'api' })
      
      const { container } = render(system.render())
      
      expect(screen.getByText('Projects')).toBeInTheDocument()
      expect(screen.getByText('New Project')).toBeInTheDocument()
      expect(screen.getByText('Project A')).toBeInTheDocument()
      expect(screen.getByText('Project B')).toBeInTheDocument()
      expect(screen.getByText('Mock File Explorer')).toBeInTheDocument()
      expect(screen.getByText('Deploy')).toBeInTheDocument()
      
      expect(container.querySelector('#project-management')).toBeInTheDocument()
    })
    
    it('should handle project switching in UI', async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      
      const proj1 = await system.createProject({ name: 'Project 1' })
      const proj2 = await system.createProject({ name: 'Project 2' })
      
      render(system.render())
      
      const proj1Element = screen.getByText('Project 1').parentElement!
      fireEvent.click(proj1Element)
      
      expect(system.getActiveProject()?.id).toBe(proj1)
    })
  })
  
  describe('Destruction', () => {
    it('should clean up all components on destroy', async () => {
      system = new ProjectManagementSystem()
      await system.initialize({
        userId: 'user-123'
      })
      
      const destroyedSpy = vi.fn()
      system.on('destroyed', destroyedSpy)
      
      await system.destroy()
      
      expect(destroyedSpy).toHaveBeenCalled()
      
      const status = system.getStatus()
      expect(status.initialized).toBe(false)
    })
  })
})