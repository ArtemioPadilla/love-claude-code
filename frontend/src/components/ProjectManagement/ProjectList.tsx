import { motion } from 'framer-motion'
import { FiPlus, FiSearch, FiFolder, FiUpload } from 'react-icons/fi'
import { useState } from 'react'
import { ProjectCard } from './ProjectCard'
import { ProjectImport } from './ProjectImport'
import type { Project } from '@stores/projectStore'
import { isElectron } from '@utils/electronDetection'

interface ProjectListProps {
  projects: Project[]
  onCreateNew: () => void
  onOpenProject: (id: string) => void
  onEditProject: (id: string) => void
  onDeleteProject: (id: string) => void
}

export function ProjectList({ 
  projects, 
  onCreateNew, 
  onOpenProject, 
  onEditProject, 
  onDeleteProject 
}: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Projects</h1>
        <p className="text-muted-foreground">Select a project to open or create a new one</p>
      </div>
      
      {/* Actions Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 focus:shadow-glow transition-all"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-glow transition-all"
        >
          <FiPlus size={18} />
          New Project
        </motion.button>
        
        {isElectron() && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all"
          >
            <FiUpload size={18} />
            Import
          </motion.button>
        )}
      </div>
      
      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
            <FiFolder size={36} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Create your first project to get started with Love Claude Code'
            }
          </p>
          {!searchQuery && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-glow transition-all"
            >
              <FiPlus size={18} />
              Create First Project
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProjectCard
                project={project}
                onOpen={onOpenProject}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
              />
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Import Modal */}
      {isElectron() && (
        <ProjectImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}