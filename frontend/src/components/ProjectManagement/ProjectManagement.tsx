import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiFolder, FiCode } from 'react-icons/fi'
import { ProjectList } from './ProjectList'
import { ProjectSettingsModal } from './ProjectSettingsModal'
import { TemplateSelector } from './TemplateSelector'
import { ConstructLevelSelector } from './ConstructLevelSelector'
import { useProjectStore } from '../../stores/projectStore'
import { useEditorStore } from '../../stores/editorStore'
import { ProjectTemplate } from '../../templates/projectTemplates'
import { ConstructLevel } from '../../constructs/types'
import { getConstructTemplatesByLevel, generateConstructProjectFiles } from '../../templates/constructTemplates'
import Footer from '../Layout/Footer'
import { useNavigate } from '../Navigation'
import { ConstructCreationWizard, WizardData } from '../ConstructCreationWizard'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description: string, includeMCP: boolean, template?: ProjectTemplate | null, constructLevel?: ConstructLevel) => void
  onOpenWizard?: (level: ConstructLevel) => void
}

function CreateProjectModal({ isOpen, onClose, onCreate, onOpenWizard }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [includeMCP, setIncludeMCP] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [isConstructProject, setIsConstructProject] = useState(false)
  const [selectedConstructLevel, setSelectedConstructLevel] = useState<ConstructLevel | null>(null)
  const [showConstructLevels, setShowConstructLevels] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      if (isConstructProject && !selectedConstructLevel) {
        // Show construct level selector if not selected
        setShowConstructLevels(true)
        return
      }
      onCreate(name.trim(), description.trim(), includeMCP, selectedTemplate, selectedConstructLevel || undefined)
      setName('')
      setDescription('')
      setIncludeMCP(false)
      setSelectedTemplate(null)
      setIsConstructProject(false)
      setSelectedConstructLevel(null)
      onClose()
    }
  }
  
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setShowTemplates(false)
    if (template.id === 'construct-development') {
      setIsConstructProject(true)
      setShowConstructLevels(true)
      if (!name) {
        setName('My Construct')
      }
    } else if (template.id !== 'blank' && !name) {
      setName(template.name)
      setIsConstructProject(false)
    }
  }

  const handleConstructLevelSelect = (level: ConstructLevel) => {
    setSelectedConstructLevel(level)
    setShowConstructLevels(false)
    
    // If wizard handler provided, use it. Otherwise continue with regular flow
    if (onOpenWizard) {
      onClose()
      onOpenWizard(level)
    } else {
      // Update the name based on level if it's still default
      if (name === 'My Construct' || !name) {
        const levelNames = {
          [ConstructLevel.L0]: 'My L0 Primitive',
          [ConstructLevel.L1]: 'My L1 Configured Construct',
          [ConstructLevel.L2]: 'My L2 Pattern',
          [ConstructLevel.L3]: 'My L3 Application'
        }
        setName(levelNames[level])
      }
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
      
      {/* Construct Level Selector Modal */}
      {showConstructLevels && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowConstructLevels(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Choose Construct Level</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowConstructLevels(false)}
                  className="p-2 rounded-md hover:bg-accent/50 transition-all"
                >
                  <FiX size={18} />
                </motion.button>
              </div>
              <ConstructLevelSelector
                selectedLevel={selectedConstructLevel}
                onSelectLevel={handleConstructLevelSelect}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
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
                <span>
                  Template: {selectedTemplate.name}
                  {isConstructProject && selectedConstructLevel && ` (${selectedConstructLevel})`}
                </span>
              ) : (
                <span>Choose a Template (Optional)</span>
              )}
            </button>
            {selectedTemplate && selectedTemplate.id !== 'blank' && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.description}
                </p>
                {isConstructProject && selectedConstructLevel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-3 bg-accent/30 rounded-md"
                  >
                    <p className="text-xs font-medium mb-1">
                      {selectedConstructLevel} Construct Selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You'll be building a reusable {selectedConstructLevel} construct that can be shared across projects.
                    </p>
                  </motion.div>
                )}
              </div>
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
  const { createFile, setCurrentProject: setEditorProject } = useEditorStore()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showConstructWizard, setShowConstructWizard] = useState(false)
  const [wizardInitialLevel, setWizardInitialLevel] = useState<ConstructLevel | undefined>()
  
  const handleCreateProject = async (name: string, description: string, includeMCP: boolean, template?: ProjectTemplate | null, constructLevel?: ConstructLevel) => {
    const projectData: any = {
      name,
      description,
      hasMCP: includeMCP,
      template: template || undefined
    }
    
    // Add construct-specific metadata if it's a construct project
    if (template?.id === 'construct-development' && constructLevel) {
      projectData.isConstructProject = true
      projectData.constructLevel = constructLevel
      projectData.constructMetadata = {
        level: constructLevel,
        phase: 'specification',
        specificationComplete: false,
        testsGenerated: false,
        implementationComplete: false
      }
    }
    
    const id = addProject(projectData)
    setCurrentProject(id)
    
    // If it's a construct project, generate and add the template files
    if (template?.id === 'construct-development' && constructLevel) {
      const files = generateConstructProjectFiles(constructLevel, name)
      setEditorProject({ id, name, path: `/${name.toLowerCase().replace(/\s+/g, '-')}` })
      
      // Create files for the construct project
      for (const file of files) {
        await createFile(file.path.replace(/^\//, ''), file.content)
      }
    } else if (template && template.files && template.files.length > 0) {
      // Handle regular template files
      setEditorProject({ id, name, path: `/${name.toLowerCase().replace(/\s+/g, '-')}` })
      
      for (const file of template.files) {
        await createFile(file.path.replace(/^\//, ''), file.content)
      }
    }
    
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
  
  const handleWizardComplete = (wizardData: WizardData) => {
    // Create a new project from wizard data
    const projectData: any = {
      name: wizardData.name,
      description: wizardData.description,
      isConstructProject: true,
      constructLevel: wizardData.level,
      constructMetadata: {
        level: wizardData.level,
        phase: 'implementation',
        specificationComplete: true,
        testsGenerated: true,
        implementationComplete: true,
        ...wizardData.selfReferential
      },
      constructDefinition: {
        ...wizardData,
        id: `${wizardData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      }
    }
    
    const id = addProject(projectData)
    setCurrentProject(id)
    navigate('project', { id })
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
            onOpenWizard={(level) => {
              setWizardInitialLevel(level)
              setShowConstructWizard(true)
            }}
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
      
      {/* Construct Creation Wizard */}
      <ConstructCreationWizard
        isOpen={showConstructWizard}
        onClose={() => {
          setShowConstructWizard(false)
          setWizardInitialLevel(undefined)
        }}
        onComplete={handleWizardComplete}
        initialLevel={wizardInitialLevel}
      />
    </div>
  )
}