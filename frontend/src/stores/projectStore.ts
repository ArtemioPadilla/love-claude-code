import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  description?: string
  path?: string
  createdAt: Date
  updatedAt: Date
  lastOpenedAt?: Date
  template?: string
  hasMCP?: boolean
  settings?: {
    theme?: string
    language?: string
  }
  // Construct-specific fields
  isConstructProject?: boolean
  constructLevel?: string
  constructMetadata?: {
    level: string
    phase: 'specification' | 'testing' | 'implementation' | 'certification'
    specificationComplete: boolean
    testsGenerated: boolean
    implementationComplete: boolean
    certificationStatus?: 'pending' | 'in-progress' | 'approved' | 'rejected'
  }
}

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  currentView: 'editor' | 'projects'
  
  // Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setCurrentProject: (id: string | null) => void
  setCurrentView: (view: 'editor' | 'projects') => void
  getRecentProjects: (limit?: number) => Project[]
  getCurrentProject: () => Project | null
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentView: 'editor',
      
      addProject: (projectData) => {
        const id = Date.now().toString()
        const newProject: Project = {
          ...projectData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        set((state) => ({
          projects: [...state.projects, newProject],
        }))
        
        return id
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          ),
        }))
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        }))
      },
      
      setCurrentProject: (id) => {
        if (id) {
          // Update lastOpenedAt when opening a project
          get().updateProject(id, { lastOpenedAt: new Date() })
        }
        set({ currentProjectId: id })
      },
      
      setCurrentView: (view) => {
        set({ currentView: view })
      },
      
      getRecentProjects: (limit = 5) => {
        const { projects } = get()
        return [...projects]
          .sort((a, b) => {
            const aTime = a.lastOpenedAt?.getTime() || a.updatedAt.getTime()
            const bTime = b.lastOpenedAt?.getTime() || b.updatedAt.getTime()
            return bTime - aTime
          })
          .slice(0, limit)
      },
      
      getCurrentProject: () => {
        const { projects, currentProjectId } = get()
        if (!currentProjectId) return null
        return projects.find(p => p.id === currentProjectId) || null
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
)