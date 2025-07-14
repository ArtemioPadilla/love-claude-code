import { create } from 'zustand'
import { api } from '@services/api'

interface File {
  id: string
  name: string
  content: string
  language: string
  projectId: string
  createdAt: string
  updatedAt: string
}

interface EditorState {
  // Project state
  currentProject: any | null
  projects: any[]
  
  // File state
  files: File[]
  activeFileId: string | null
  openFiles: string[]
  unsavedChanges: Record<string, boolean>
  
  // Editor state
  editorContent: string
  cursorPosition: { line: number; column: number }
  
  // Actions
  loadProjects: () => Promise<void>
  setCurrentProject: (project: any) => void
  loadFiles: (projectId: string) => Promise<void>
  openFile: (fileId: string) => void
  closeFile: (fileId: string) => void
  createFile: (name: string, content?: string) => Promise<void>
  updateFileContent: (fileId: string, content: string) => void
  saveFile: (fileId: string) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentProject: null,
  projects: [],
  files: [],
  activeFileId: null,
  openFiles: [],
  unsavedChanges: {},
  editorContent: '',
  cursorPosition: { line: 0, column: 0 },

  // Actions
  loadProjects: async () => {
    try {
      const projects = await api.getProjects()
      set({ projects })
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  loadFiles: async (projectId) => {
    try {
      const files = await api.getFiles(projectId)
      set({ files })
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  },

  openFile: (fileId) => {
    const { files, openFiles } = get()
    const file = files.find(f => f.id === fileId)
    
    if (file && !openFiles.includes(fileId)) {
      set({ 
        openFiles: [...openFiles, fileId],
        activeFileId: fileId,
        editorContent: file.content
      })
    } else if (file) {
      set({ 
        activeFileId: fileId,
        editorContent: file.content
      })
    }
  },

  closeFile: (fileId) => {
    const { openFiles, activeFileId } = get()
    const newOpenFiles = openFiles.filter(id => id !== fileId)
    
    let newActiveFileId = activeFileId
    if (activeFileId === fileId) {
      const currentIndex = openFiles.indexOf(fileId)
      if (currentIndex > 0) {
        newActiveFileId = openFiles[currentIndex - 1]
      } else if (newOpenFiles.length > 0) {
        newActiveFileId = newOpenFiles[0]
      } else {
        newActiveFileId = null
      }
    }
    
    set({ 
      openFiles: newOpenFiles,
      activeFileId: newActiveFileId,
      editorContent: newActiveFileId ? get().files.find(f => f.id === newActiveFileId)?.content || '' : ''
    })
  },

  createFile: async (name, content = '') => {
    const { currentProject, files } = get()
    if (!currentProject) return
    
    try {
      const file = await api.createFile(currentProject.id, name, content)
      set({ files: [...files, file] })
      get().openFile(file.id)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  },

  updateFileContent: (fileId, content) => {
    const { files, activeFileId, unsavedChanges } = get()
    
    if (activeFileId === fileId) {
      set({ editorContent: content })
    }
    
    const file = files.find(f => f.id === fileId)
    if (file && file.content !== content) {
      set({ unsavedChanges: { ...unsavedChanges, [fileId]: true } })
    }
  },

  saveFile: async (fileId) => {
    const { files, editorContent, unsavedChanges } = get()
    const file = files.find(f => f.id === fileId)
    
    if (!file) return
    
    try {
      const updatedFile = await api.updateFile(fileId, editorContent)
      const newFiles = files.map(f => f.id === fileId ? updatedFile : f)
      const newUnsavedChanges = { ...unsavedChanges }
      delete newUnsavedChanges[fileId]
      
      set({ 
        files: newFiles,
        unsavedChanges: newUnsavedChanges
      })
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  },

  deleteFile: async (fileId) => {
    const { files } = get()
    
    try {
      await api.deleteFile(fileId)
      get().closeFile(fileId)
      set({ files: files.filter(f => f.id !== fileId) })
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  },
}))