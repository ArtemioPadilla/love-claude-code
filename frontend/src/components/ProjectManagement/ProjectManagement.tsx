import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiFolder, FiCode } from 'react-icons/fi'
import { ProjectList } from './ProjectList'
import { ProjectSettingsModal } from './ProjectSettingsModal'
import { TemplateSelector } from './TemplateSelector'
import { useProjectStore } from '@stores/projectStore'
import { ProjectTemplate } from '../../templates/projectTemplates'
import Footer from '../Layout/Footer'
import { useNavigate } from '../Navigation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description: string, includeMCP: boolean, template?: ProjectTemplate | null) => void
}

function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [includeMCP, setIncludeMCP] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), includeMCP, selectedTemplate)
      setName('')
      setDescription('')
      setIncludeMCP(false)
      setSelectedTemplate(null)
      onClose()
    }
  }
  
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setShowTemplates(false)
    if (template.id !== 'blank' && !name) {
      setName(template.name)
    }
  }

  if (!isOpen) return null
  
  return (
    <>
      <TemplateSelector
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent/50 transition-all"
          >
            <FiX size={18} />
          </motion.button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <label htmlFor="project-name" className="block text-sm font-medium mb-2">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 focus:shadow-glow transition-all"
              autoFocus
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="project-description" className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={3}
              className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 focus:shadow-glow transition-all resize-none"
            />
          </div>
          
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <FiCode className="w-4 h-4" />
              {selectedTemplate ? (
                <span>Template: {selectedTemplate.name}</span>
              ) : (
                <span>Choose a Template (Optional)</span>
              )}
            </button>
            {selectedTemplate && selectedTemplate.id !== 'blank' && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedTemplate.description}
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMCP}
                onChange={(e) => setIncludeMCP(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <FiCode className="text-primary" size={16} />
                <span className="text-sm font-medium">Enable MCP (Model Context Protocol)</span>
              </div>
            </label>
            <p className="text-xs text-muted-foreground mt-1 ml-7">
              Allow Claude to interact with your application through custom tools
            </p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent/50 transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-glow transition-all"
              disabled={!name.trim()}
            >
              Create Project
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
    </>
  )
}

export function ProjectManagement() {
  const { 
    projects, 
    addProject, 
    updateProject, 
    deleteProject, 
    setCurrentProject,
    setCurrentView 
  } = useProjectStore()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  
  const handleCreateProject = (name: string, description: string, includeMCP: boolean, template?: ProjectTemplate | null) => {
    const id = addProject({ 
      name, 
      description, 
      hasMCP: includeMCP,
      template: template || undefined 
    })
    setCurrentProject(id)
    navigate('project', { id })
  }
  
  const handleOpenProject = (id: string) => {
    setCurrentProject(id)
    navigate('project', { id })
  }
  
  const handleEditProject = (id: string) => {
    const project = projects.find(p => p.id === id)
    if (project) {
      setSelectedProject(project)
      setShowSettingsModal(true)
    }
  }
  
  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id)
    }
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border/50 flex items-center justify-center px-6">
          <div className="w-full max-w-6xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-glow">
              <FiFolder size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold gradient-text">Love Claude Code</h1>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-subtle">
          <ProjectList
            projects={projects}
            onCreateNew={() => setShowCreateModal(true)}
            onOpenProject={handleOpenProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateProject}
          />
        )}
      </AnimatePresence>
      
      {/* Project Settings Modal */}
      {selectedProject && (
        <ProjectSettingsModal
          project={selectedProject}
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedProject(null)
          }}
          onUpdate={(updates) => {
            updateProject(selectedProject.id, updates)
            setShowSettingsModal(false)
            setSelectedProject(null)
          }}
        />
      )}
    </div>
  )
}