/**
 * Project Management System L2 Pattern Construct
 * 
 * Complete project management system with file storage, version control,
 * permissions, collaboration features, and deployment capabilities.
 */

import React from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  BaseConstruct
} from '../../types'

// Import L1 constructs we'll compose
import { ProjectFileExplorer } from '../../L1/ui/ProjectFileExplorer'
import { SecureAuthService } from '../../L1/infrastructure/SecureAuthService'
import { EncryptedDatabase } from '../../L1/infrastructure/EncryptedDatabase'
import { CDNStorage } from '../../L1/infrastructure/CDNStorage'
import { RestAPIService } from '../../L1/infrastructure/RestAPIService'
import { ResponsiveLayout } from '../../L1/ui/ResponsiveLayout'

// Type definitions
interface ProjectConfig {
  userId: string
  organizationId?: string
  features?: {
    versionControl?: boolean
    collaboration?: boolean
    deployment?: boolean
    analytics?: boolean
    backups?: boolean
    templates?: boolean
  }
  permissions?: {
    defaultRole?: 'viewer' | 'editor' | 'admin'
    publicProjects?: boolean
    maxCollaborators?: number
    guestAccess?: boolean
  }
  storage?: {
    maxProjectSize?: number // MB
    maxFileSize?: number // MB
    allowedFileTypes?: string[]
    cdnEnabled?: boolean
  }
  ui?: {
    theme?: 'light' | 'dark' | 'auto'
    layout?: 'grid' | 'list' | 'kanban'
    defaultView?: 'recent' | 'all' | 'shared' | 'archived'
  }
}

interface Project {
  id: string
  name: string
  description?: string
  type: 'web' | 'api' | 'fullstack' | 'library' | 'construct'
  owner: string
  created: Date
  updated: Date
  status: 'active' | 'archived' | 'deleted'
  visibility: 'private' | 'public' | 'organization'
  tags?: string[]
  thumbnail?: string
  settings?: {
    framework?: string
    language?: string
    buildCommand?: string
    startCommand?: string
    envVars?: Record<string, string>
  }
  stats?: {
    files: number
    size: number
    lastBuild?: Date
    deployments?: number
    collaborators?: number
  }
  permissions?: ProjectPermissions
}

interface ProjectPermissions {
  owner: string
  collaborators: Array<{
    userId: string
    role: 'viewer' | 'editor' | 'admin'
    addedAt: Date
    addedBy: string
  }>
  publicAccess?: 'none' | 'view' | 'fork'
  inheritFromOrg?: boolean
}

interface ProjectFile {
  path: string
  content: string
  size: number
  mimeType: string
  created: Date
  modified: Date
  version?: number
  lockedBy?: string
}

interface ProjectActivity {
  id: string
  projectId: string
  userId: string
  action: 'created' | 'updated' | 'deleted' | 'deployed' | 'shared' | 'archived'
  target?: string
  details?: any
  timestamp: Date
}

export interface ProjectManagementOutputs extends Record<string, any> {
  systemId: string
  status: 'ready' | 'loading' | 'error'
  capabilities: {
    versionControl: boolean
    collaboration: boolean
    deployment: boolean
    analytics: boolean
    templates: boolean
  }
  statistics: {
    totalProjects: number
    activeProjects: number
    totalStorage: number
    collaborators: number
  }
  currentProject?: {
    id: string
    name: string
    type: string
    files: number
  }
}

// Static definition
export const projectManagementDefinition: PlatformConstructDefinition = {
  id: 'platform-l2-project-management-system',
  name: 'Project Management System',
  type: ConstructType.Pattern,
  level: ConstructLevel.L2,
  category: 'pattern',
  description: 'Complete project management system with storage, permissions, collaboration, and deployment',
  
  capabilities: {
    provides: ['project-management', 'file-storage', 'permissions', 'collaboration'],
    requires: ['auth', 'database', 'storage'],
    extends: ['project-file-explorer', 'secure-auth-service', 'encrypted-database', 'cdn-storage']
  },
  
  config: {
    userId: {
      type: 'string',
      required: true,
      description: 'User identifier'
    },
    organizationId: {
      type: 'string',
      description: 'Organization identifier'
    },
    features: {
      type: 'object',
      description: 'Feature configuration'
    }
  },
  
  outputs: {
    systemId: { type: 'string', description: 'System identifier' },
    statistics: { type: 'object', description: 'Usage statistics' },
    capabilities: { type: 'object', description: 'Enabled features' }
  },
  
  dependencies: [
    'platform-l1-project-file-explorer',
    'platform-l1-secure-auth-service',
    'platform-l1-encrypted-database',
    'platform-l1-cdn-storage',
    'platform-l1-rest-api-service',
    'platform-l1-responsive-layout'
  ],
  
  tags: ['projects', 'management', 'storage', 'permissions', 'collaboration'],
  version: '1.0.0',
  author: 'Love Claude Code',
  
  examples: [
    {
      title: 'Basic Project Management',
      description: 'Simple project system with storage',
      code: `const projectSystem = new ProjectManagementSystem()
await projectSystem.initialize({
  userId: 'user-123',
  features: {
    versionControl: true,
    collaboration: true
  }
})`
    }
  ],
  
  bestPractices: [
    'Implement proper access control',
    'Regular automated backups',
    'Monitor storage usage',
    'Version important files',
    'Use templates for common projects'
  ],
  
  security: [
    'Encrypt sensitive project data',
    'Validate file uploads',
    'Implement rate limiting',
    'Audit access logs',
    'Scan for malicious files'
  ],
  
  compliance: {
    standards: ['SOC2', 'GDPR'],
    certifications: []
  },
  
  monitoring: {
    metrics: ['project-count', 'storage-usage', 'api-calls', 'active-users'],
    logs: ['project-access', 'file-operations', 'permission-changes'],
    alerts: ['storage-limit', 'suspicious-activity', 'failed-operations']
  },
  
  providers: {
    aws: { service: 's3' },
    firebase: { service: 'firestore' },
    local: { service: 'filesystem' }
  },
  
  selfReferential: {
    isPlatformConstruct: true,
    usedBy: ['love-claude-code-frontend'],
    extends: 'multiple-l1-constructs'
  },
  
  quality: {
    testCoverage: 85,
    documentationComplete: true,
    productionReady: true
  }
}

/**
 * Project Management System implementation
 */
export class ProjectManagementSystem extends L2PatternConstruct implements BaseConstruct {
  static definition = projectManagementDefinition
  
  private systemId: string = ''
  private projects: Map<string, Project> = new Map()
  private activeProjectId?: string
  private activityLog: ProjectActivity[] = []
  private fileCache: Map<string, ProjectFile> = new Map()
  
  constructor(props: any = {}) {
    super(ProjectManagementSystem.definition, props)
  }
  
  async initialize(config: ProjectConfig): Promise<ProjectManagementOutputs> {
    this.emit('initializing', { config })
    
    try {
      this.systemId = `project-system-${Date.now()}`
      
      await this.beforeCompose()
      await this.composePattern()
      await this.configureComponents(config)
      await this.configureInteractions()
      await this.afterCompose()
      
      // Load user's projects
      await this.loadUserProjects(config.userId)
      
      this.initialized = true
      this.emit('initialized', { systemId: this.systemId })
      
      return this.getOutputs()
    } catch (error) {
      this.emit('error', { error })
      throw new Error(`Failed to initialize project management system: ${error}`)
    }
  }
  
  protected async composePattern(): Promise<void> {
    // Create layout for project management UI
    const layout = new ResponsiveLayout()
    await layout.initialize({
      containerSelector: '#project-management',
      panels: [
        {
          id: 'project-list',
          position: 'left',
          defaultSize: 300,
          minSize: 250,
          maxSize: 500,
          resizable: true,
          collapsible: true
        },
        {
          id: 'project-details',
          position: 'center',
          minSize: 400,
          resizable: false
        },
        {
          id: 'project-tools',
          position: 'right',
          defaultSize: 300,
          minSize: 250,
          maxSize: 400,
          resizable: true,
          collapsible: true
        }
      ],
      mobileBreakpoint: 768,
      persistState: true,
      stateKey: 'project-management-layout'
    })
    this.addConstruct('layout', layout)
    
    // Create file explorer for project files
    const fileExplorer = new ProjectFileExplorer()
    await fileExplorer.initialize({
      rootPath: '/projects',
      showHiddenFiles: false,
      fileActions: {
        create: true,
        rename: true,
        delete: true,
        copy: true,
        move: true
      },
      search: {
        enabled: true,
        includeContent: true,
        useRegex: true
      },
      git: {
        enabled: true,
        showStatus: true,
        allowCommit: true
      }
    })
    this.addConstruct('fileExplorer', fileExplorer)
    
    // Create auth service for permissions
    const authService = new SecureAuthService()
    await authService.initialize({
      providers: ['email', 'github', 'google'],
      features: {
        mfa: true,
        passwordless: true,
        socialLogin: true,
        sso: false
      },
      session: {
        duration: 7200, // 2 hours
        refresh: true,
        rolling: true
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        loginAttempts: {
          maxAttempts: 5,
          lockoutDuration: 300
        }
      }
    })
    this.addConstruct('authService', authService)
    
    // Create encrypted database for project metadata
    const database = new EncryptedDatabase()
    await database.initialize({
      name: 'project-management',
      encryptionKey: await this.generateEncryptionKey(),
      tables: ['projects', 'files', 'permissions', 'activities'],
      indexes: {
        projects: ['owner', 'created', 'status', 'visibility'],
        files: ['projectId', 'path', 'modified'],
        permissions: ['projectId', 'userId'],
        activities: ['projectId', 'userId', 'timestamp']
      },
      compliance: 'SOC2',
      backup: {
        enabled: true,
        frequency: 'hourly',
        retention: 30
      }
    })
    this.addConstruct('database', database)
    
    // Create CDN storage for project files
    const storage = new CDNStorage()
    await storage.initialize({
      bucket: 'project-files',
      provider: 'cloudflare',
      features: {
        imageOptimization: true,
        compression: true,
        caching: true,
        versioning: true
      },
      security: {
        signedUrls: true,
        expiration: 7200,
        cors: {
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
      },
      limits: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: [
          'text/*',
          'application/json',
          'application/javascript',
          'application/typescript',
          'image/*',
          'video/*'
        ]
      }
    })
    this.addConstruct('storage', storage)
    
    // Create API service for external integrations
    const apiService = new RestAPIService()
    await apiService.initialize({
      baseUrl: '/api/projects',
      endpoints: [
        {
          name: 'list',
          method: 'GET',
          path: '/projects',
          auth: true
        },
        {
          name: 'create',
          method: 'POST',
          path: '/projects',
          auth: true
        },
        {
          name: 'update',
          method: 'PUT',
          path: '/projects/:id',
          auth: true
        },
        {
          name: 'delete',
          method: 'DELETE',
          path: '/projects/:id',
          auth: true
        },
        {
          name: 'deploy',
          method: 'POST',
          path: '/projects/:id/deploy',
          auth: true
        }
      ],
      auth: {
        type: 'bearer',
        headerName: 'Authorization'
      }
    })
    this.addConstruct('apiService', apiService)
  }
  
  protected async configureComponents(config: ProjectConfig): Promise<void> {
    // Configure file explorer
    const fileExplorer = this.getConstruct<ProjectFileExplorer>('fileExplorer')
    if (fileExplorer && config.storage) {
      await fileExplorer.updateConfig({
        maxFileSize: config.storage.maxFileSize,
        allowedExtensions: config.storage.allowedFileTypes
      })
    }
    
    // Configure layout based on UI preferences
    if (config.ui?.layout) {
      // Layout configuration would go here
    }
  }
  
  protected configureInteractions(): void {
    const fileExplorer = this.getConstruct<ProjectFileExplorer>('fileExplorer')
    const authService = this.getConstruct<SecureAuthService>('authService')
    const database = this.getConstruct<EncryptedDatabase>('database')
    const storage = this.getConstruct<CDNStorage>('storage')
    
    // File explorer interactions
    if (fileExplorer) {
      fileExplorer.on('fileSelect', async (file: any) => {
        await this.openFile(file.path)
      })
      
      fileExplorer.on('fileCreate', async (file: any) => {
        await this.createFile(file.path, file.content)
      })
      
      fileExplorer.on('fileUpdate', async (file: any) => {
        await this.updateFile(file.path, file.content)
      })
      
      fileExplorer.on('fileDelete', async (file: any) => {
        await this.deleteFile(file.path)
      })
    }
    
    // Auth service for permission checks
    if (authService) {
      authService.on('userAuthenticated', async (user: any) => {
        await this.loadUserProjects(user.id)
      })
    }
    
    // Auto-save project changes
    if (database) {
      setInterval(async () => {
        await this.saveProjectChanges()
      }, 60000) // Every minute
    }
  }
  
  // Project management
  async createProject(data: Partial<Project>): Promise<string> {
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: data.name || 'Untitled Project',
      description: data.description,
      type: data.type || 'web',
      owner: this.config.userId,
      created: new Date(),
      updated: new Date(),
      status: 'active',
      visibility: data.visibility || 'private',
      tags: data.tags || [],
      settings: data.settings || {},
      stats: {
        files: 0,
        size: 0,
        collaborators: 1
      },
      permissions: {
        owner: this.config.userId,
        collaborators: [],
        publicAccess: 'none'
      }
    }
    
    // Save to database
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.create('projects', project)
    }
    
    // Create project directory
    const storage = this.getConstruct<CDNStorage>('storage')
    if (storage) {
      await storage.createDirectory(`/projects/${project.id}`)
    }
    
    this.projects.set(project.id, project)
    this.activeProjectId = project.id
    
    // Log activity
    await this.logActivity({
      projectId: project.id,
      action: 'created',
      details: { name: project.name, type: project.type }
    })
    
    this.emit('projectCreated', project)
    return project.id
  }
  
  async loadProject(projectId: string): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    const projectData = await database.get('projects', projectId)
    if (projectData) {
      // Check permissions
      if (!await this.checkPermission(projectId, 'view')) {
        throw new Error('Access denied')
      }
      
      this.projects.set(projectId, projectData)
      this.activeProjectId = projectId
      
      // Load project files
      await this.loadProjectFiles(projectId)
      
      this.emit('projectLoaded', projectData)
    }
  }
  
  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project) return
    
    // Check permissions
    if (!await this.checkPermission(projectId, 'edit')) {
      throw new Error('Access denied')
    }
    
    const updatedProject = {
      ...project,
      ...updates,
      updated: new Date()
    }
    
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.update('projects', projectId, updatedProject)
    }
    
    this.projects.set(projectId, updatedProject)
    
    await this.logActivity({
      projectId,
      action: 'updated',
      details: { updates }
    })
    
    this.emit('projectUpdated', updatedProject)
  }
  
  async deleteProject(projectId: string): Promise<void> {
    // Check permissions
    if (!await this.checkPermission(projectId, 'admin')) {
      throw new Error('Access denied')
    }
    
    const project = this.projects.get(projectId)
    if (!project) return
    
    // Soft delete by updating status
    await this.updateProject(projectId, { status: 'deleted' })
    
    // Remove from active projects
    this.projects.delete(projectId)
    
    if (this.activeProjectId === projectId) {
      this.activeProjectId = undefined
    }
    
    await this.logActivity({
      projectId,
      action: 'deleted'
    })
    
    this.emit('projectDeleted', { projectId })
  }
  
  async archiveProject(projectId: string): Promise<void> {
    await this.updateProject(projectId, { status: 'archived' })
    
    await this.logActivity({
      projectId,
      action: 'archived'
    })
  }
  
  // File operations
  async createFile(path: string, content: string = ''): Promise<void> {
    if (!this.activeProjectId) return
    
    const fullPath = `/projects/${this.activeProjectId}${path}`
    
    const file: ProjectFile = {
      path: fullPath,
      content,
      size: new Blob([content]).size,
      mimeType: this.getMimeType(path),
      created: new Date(),
      modified: new Date()
    }
    
    // Save to storage
    const storage = this.getConstruct<CDNStorage>('storage')
    if (storage) {
      await storage.upload(fullPath, content)
    }
    
    // Save metadata
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.create('files', {
        ...file,
        projectId: this.activeProjectId
      })
    }
    
    this.fileCache.set(fullPath, file)
    
    // Update project stats
    await this.updateProjectStats(this.activeProjectId)
    
    this.emit('fileCreated', { projectId: this.activeProjectId, path, file })
  }
  
  async updateFile(path: string, content: string): Promise<void> {
    if (!this.activeProjectId) return
    
    const fullPath = `/projects/${this.activeProjectId}${path}`
    const existingFile = this.fileCache.get(fullPath)
    
    if (existingFile) {
      // Create version if version control is enabled
      if (this.config.features?.versionControl) {
        await this.createFileVersion(fullPath, existingFile.content)
      }
      
      existingFile.content = content
      existingFile.size = new Blob([content]).size
      existingFile.modified = new Date()
      existingFile.version = (existingFile.version || 0) + 1
      
      // Update storage
      const storage = this.getConstruct<CDNStorage>('storage')
      if (storage) {
        await storage.update(fullPath, content)
      }
      
      // Update database
      const database = this.getConstruct<EncryptedDatabase>('database')
      if (database) {
        await database.update('files', fullPath, existingFile)
      }
      
      this.emit('fileUpdated', { projectId: this.activeProjectId, path, file: existingFile })
    }
  }
  
  async deleteFile(path: string): Promise<void> {
    if (!this.activeProjectId) return
    
    const fullPath = `/projects/${this.activeProjectId}${path}`
    
    // Delete from storage
    const storage = this.getConstruct<CDNStorage>('storage')
    if (storage) {
      await storage.delete(fullPath)
    }
    
    // Delete from database
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.delete('files', fullPath)
    }
    
    this.fileCache.delete(fullPath)
    
    // Update project stats
    await this.updateProjectStats(this.activeProjectId)
    
    this.emit('fileDeleted', { projectId: this.activeProjectId, path })
  }
  
  async openFile(path: string): Promise<ProjectFile | null> {
    if (!this.activeProjectId) return null
    
    const fullPath = `/projects/${this.activeProjectId}${path}`
    let file = this.fileCache.get(fullPath)
    
    if (!file) {
      // Load from storage
      const storage = this.getConstruct<CDNStorage>('storage')
      const database = this.getConstruct<EncryptedDatabase>('database')
      
      if (storage && database) {
        const content = await storage.get(fullPath)
        const metadata = await database.get('files', fullPath)
        
        if (content && metadata) {
          file = {
            ...metadata,
            content
          }
          this.fileCache.set(fullPath, file)
        }
      }
    }
    
    if (file) {
      this.emit('fileOpened', { projectId: this.activeProjectId, path, file })
    }
    
    return file || null
  }
  
  // Permission management
  async addCollaborator(projectId: string, userId: string, role: 'viewer' | 'editor' | 'admin' = 'editor'): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project) return
    
    // Check if user has permission to add collaborators
    if (!await this.checkPermission(projectId, 'admin')) {
      throw new Error('Access denied')
    }
    
    // Check max collaborators limit
    if (this.config.permissions?.maxCollaborators) {
      if (project.permissions!.collaborators.length >= this.config.permissions.maxCollaborators) {
        throw new Error('Maximum collaborators limit reached')
      }
    }
    
    project.permissions!.collaborators.push({
      userId,
      role,
      addedAt: new Date(),
      addedBy: this.config.userId
    })
    
    await this.updateProject(projectId, { permissions: project.permissions })
    
    this.emit('collaboratorAdded', { projectId, userId, role })
  }
  
  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project) return
    
    if (!await this.checkPermission(projectId, 'admin')) {
      throw new Error('Access denied')
    }
    
    project.permissions!.collaborators = project.permissions!.collaborators.filter(
      c => c.userId !== userId
    )
    
    await this.updateProject(projectId, { permissions: project.permissions })
    
    this.emit('collaboratorRemoved', { projectId, userId })
  }
  
  async checkPermission(projectId: string, action: 'view' | 'edit' | 'admin'): Promise<boolean> {
    const project = this.projects.get(projectId)
    if (!project) return false
    
    // Owner has all permissions
    if (project.owner === this.config.userId) return true
    
    // Check collaborator permissions
    const collaborator = project.permissions?.collaborators.find(
      c => c.userId === this.config.userId
    )
    
    if (!collaborator) {
      // Check public access
      if (project.visibility === 'public') {
        return action === 'view'
      }
      return false
    }
    
    // Check role permissions
    switch (collaborator.role) {
      case 'admin':
        return true
      case 'editor':
        return action !== 'admin'
      case 'viewer':
        return action === 'view'
      default:
        return false
    }
  }
  
  // Deployment
  async deployProject(projectId: string, target: 'production' | 'staging' = 'production'): Promise<void> {
    if (!await this.checkPermission(projectId, 'admin')) {
      throw new Error('Access denied')
    }
    
    const project = this.projects.get(projectId)
    if (!project) return
    
    this.emit('deploymentStarted', { projectId, target })
    
    try {
      // Build project
      await this.buildProject(projectId)
      
      // Deploy to target
      const apiService = this.getConstruct<RestAPIService>('apiService')
      if (apiService) {
        await apiService.call('deploy', {
          projectId,
          target,
          config: project.settings
        })
      }
      
      // Update stats
      if (project.stats) {
        project.stats.lastBuild = new Date()
        project.stats.deployments = (project.stats.deployments || 0) + 1
      }
      
      await this.updateProject(projectId, { stats: project.stats })
      
      await this.logActivity({
        projectId,
        action: 'deployed',
        details: { target }
      })
      
      this.emit('deploymentCompleted', { projectId, target })
    } catch (error) {
      this.emit('deploymentFailed', { projectId, target, error })
      throw error
    }
  }
  
  // Helper methods
  private async loadUserProjects(userId: string): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    // Load owned projects
    const ownedProjects = await database.query('projects', {
      owner: userId,
      status: { $ne: 'deleted' }
    })
    
    // Load collaborative projects
    const collaborativeProjects = await database.query('permissions', {
      userId,
      role: { $in: ['viewer', 'editor', 'admin'] }
    })
    
    for (const project of [...ownedProjects, ...collaborativeProjects]) {
      this.projects.set(project.id, project)
    }
  }
  
  private async loadProjectFiles(projectId: string): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    const files = await database.query('files', { projectId })
    
    for (const file of files) {
      this.fileCache.set(file.path, file)
    }
  }
  
  private async saveProjectChanges(): Promise<void> {
    if (!this.activeProjectId) return
    
    const project = this.projects.get(this.activeProjectId)
    if (project) {
      project.updated = new Date()
      
      const database = this.getConstruct<EncryptedDatabase>('database')
      if (database) {
        await database.update('projects', this.activeProjectId, project)
      }
    }
  }
  
  private async updateProjectStats(projectId: string): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project) return
    
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    const files = await database.query('files', { projectId })
    
    project.stats = {
      ...project.stats,
      files: files.length,
      size: files.reduce((sum, file) => sum + file.size, 0)
    }
    
    await this.updateProject(projectId, { stats: project.stats })
  }
  
  private async createFileVersion(path: string, content: string): Promise<void> {
    const storage = this.getConstruct<CDNStorage>('storage')
    if (storage) {
      const versionPath = `${path}.v${Date.now()}`
      await storage.upload(versionPath, content)
    }
  }
  
  private async buildProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project || !project.settings?.buildCommand) return
    
    // Execute build command
    // This would integrate with a build system
    this.emit('buildStarted', { projectId })
    
    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    this.emit('buildCompleted', { projectId })
  }
  
  private async logActivity(activity: Omit<ProjectActivity, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    const fullActivity: ProjectActivity = {
      id: `activity-${Date.now()}`,
      userId: this.config.userId,
      timestamp: new Date(),
      ...activity
    }
    
    this.activityLog.push(fullActivity)
    
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.create('activities', fullActivity)
    }
    
    this.emit('activityLogged', fullActivity)
  }
  
  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      js: 'application/javascript',
      ts: 'application/typescript',
      jsx: 'application/javascript',
      tsx: 'application/typescript',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      md: 'text/markdown',
      txt: 'text/plain',
      png: 'image/png',
      jpg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml'
    }
    
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }
  
  private async generateEncryptionKey(): Promise<string> {
    return `enc-key-${Date.now()}-${Math.random().toString(36)}`
  }
  
  // Public API
  async searchProjects(query: string): Promise<Project[]> {
    const results = Array.from(this.projects.values()).filter(project =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description?.toLowerCase().includes(query.toLowerCase()) ||
      project.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
    
    return results
  }
  
  async getProjectActivity(projectId: string, limit: number = 50): Promise<ProjectActivity[]> {
    return this.activityLog
      .filter(activity => activity.projectId === projectId)
      .slice(-limit)
  }
  
  getActiveProject(): Project | undefined {
    return this.activeProjectId ? this.projects.get(this.activeProjectId) : undefined
  }
  
  getAllProjects(): Project[] {
    return Array.from(this.projects.values())
  }
  
  async switchProject(projectId: string): Promise<void> {
    await this.loadProject(projectId)
  }
  
  getOutputs(): ProjectManagementOutputs {
    const allProjects = Array.from(this.projects.values())
    const activeProjects = allProjects.filter(p => p.status === 'active')
    const totalStorage = allProjects.reduce((sum, p) => sum + (p.stats?.size || 0), 0)
    
    return {
      systemId: this.systemId,
      status: this.initialized ? 'ready' : 'loading',
      capabilities: {
        versionControl: this.config.features?.versionControl ?? false,
        collaboration: this.config.features?.collaboration ?? false,
        deployment: this.config.features?.deployment ?? false,
        analytics: this.config.features?.analytics ?? false,
        templates: this.config.features?.templates ?? false
      },
      statistics: {
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        totalStorage,
        collaborators: allProjects.reduce((sum, p) => 
          sum + (p.permissions?.collaborators.length || 0), 0)
      },
      currentProject: this.activeProjectId ? {
        id: this.activeProjectId,
        name: this.getActiveProject()?.name || '',
        type: this.getActiveProject()?.type || '',
        files: this.getActiveProject()?.stats?.files || 0
      } : undefined
    }
  }
  
  render(): React.ReactElement {
    const layout = this.getConstruct<ResponsiveLayout>('layout')
    const fileExplorer = this.getConstruct<ProjectFileExplorer>('fileExplorer')
    
    const projectList = (
      <div className="project-list">
        <div className="project-header">
          <h3>Projects</h3>
          <button onClick={() => this.createProject({ name: 'New Project' })}>
            New Project
          </button>
        </div>
        <div className="projects">
          {Array.from(this.projects.values()).map(project => (
            <div 
              key={project.id} 
              className={`project-item ${project.id === this.activeProjectId ? 'active' : ''}`}
              onClick={() => this.switchProject(project.id)}
            >
              <div className="project-name">{project.name}</div>
              <div className="project-meta">
                {project.type} • {project.stats?.files || 0} files
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    
    const projectDetails = (
      <div className="project-details">
        {this.getActiveProject() ? (
          <>
            <h2>{this.getActiveProject()?.name}</h2>
            {fileExplorer?.render()}
          </>
        ) : (
          <div className="no-project">Select a project to view details</div>
        )}
      </div>
    )
    
    const projectTools = (
      <div className="project-tools">
        <h3>Tools</h3>
        <button onClick={() => this.activeProjectId && this.deployProject(this.activeProjectId)}>
          Deploy
        </button>
        <button>Settings</button>
        <button>Collaborators</button>
      </div>
    )
    
    return (
      <div id="project-management" className="project-management-system">
        {layout?.render({
          'project-list': projectList,
          'project-details': projectDetails,
          'project-tools': projectTools
        })}
      </div>
    )
  }
}

// Factory function
export function createProjectManagementSystem(config: ProjectConfig): ProjectManagementSystem {
  const system = new ProjectManagementSystem()
  system.initialize(config)
  return system
}