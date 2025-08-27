import { api } from './api'
import { Project } from '../stores/projectStore'

export interface CreateProjectRequest {
  name: string
  description?: string
  template?: string
  includeMCP?: boolean
  mcpOptions?: {
    includeAuthTools?: boolean
    includeDataTools?: boolean
    includeUITools?: boolean
    customTools?: Array<{
      name: string
      description: string
      category: string
    }>
  }
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
}

export class ProjectApiService {
  async getProjects(): Promise<Project[]> {
    try {
      const projects = await api.getProjects()
      // Transform backend response to match frontend Project interface
      return projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        path: project.path,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        lastOpenedAt: project.lastOpenedAt ? new Date(project.lastOpenedAt) : undefined,
        template: project.template,
        hasMCP: project.hasMCP || false,
        settings: project.settings,
        isConstructProject: project.isConstructProject,
        constructLevel: project.constructLevel,
        constructMetadata: project.constructMetadata
      }))
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    }
  }

  async getProject(projectId: string): Promise<Project> {
    try {
      const project = await api.getProject(projectId)
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        path: project.path,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        lastOpenedAt: project.lastOpenedAt ? new Date(project.lastOpenedAt) : undefined,
        template: project.template,
        hasMCP: project.hasMCP || false,
        settings: project.settings,
        isConstructProject: project.isConstructProject,
        constructLevel: project.constructLevel,
        constructMetadata: project.constructMetadata
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      throw error
    }
  }

  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    try {
      const project = await api.createProject(
        projectData.name,
        projectData.description,
        projectData.template
      )
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        path: project.path,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        lastOpenedAt: project.lastOpenedAt ? new Date(project.lastOpenedAt) : undefined,
        template: project.template,
        hasMCP: project.hasMCP || false,
        settings: project.settings,
        isConstructProject: project.isConstructProject,
        constructLevel: project.constructLevel,
        constructMetadata: project.constructMetadata
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  async updateProject(projectId: string, updates: UpdateProjectRequest): Promise<Project> {
    try {
      const project = await api.updateProject(projectId, updates)
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        path: project.path,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        lastOpenedAt: project.lastOpenedAt ? new Date(project.lastOpenedAt) : undefined,
        template: project.template,
        hasMCP: project.hasMCP || false,
        settings: project.settings,
        isConstructProject: project.isConstructProject,
        constructLevel: project.constructLevel,
        constructMetadata: project.constructMetadata
      }
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await api.deleteProject(projectId)
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }
}

export const projectApi = new ProjectApiService()