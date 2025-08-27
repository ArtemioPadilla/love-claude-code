import { motion } from 'framer-motion'
import { FiFolder, FiClock, FiTrash2, FiEdit3, FiMoreVertical, FiDownload } from 'react-icons/fi'
import { useState } from 'react'
import type { Project } from '@stores/projectStore'
import { ProjectExport } from './ProjectExport'
import { ConstructBadge } from './ConstructBadge'
import { isElectron } from '@utils/electronDetection'

interface ProjectCardProps {
  project: Project
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onOpen, onEdit, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  const formatDate = (date: Date) => {
    if (typeof date === 'string') date = new Date(date)
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 cursor-pointer transition-all hover:border-primary/50 hover:shadow-glow"
      onClick={() => onOpen(project.id)}
    >
      {/* Project Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
          <FiFolder size={24} className="text-primary" />
        </div>
        
        {/* Actions Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground"
          >
            <FiMoreVertical size={16} />
          </motion.button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden z-10"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(project.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-all w-full text-left text-sm"
              >
                <FiEdit3 size={14} />
                Edit
              </button>
              {isElectron() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowExportModal(true)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-all w-full text-left text-sm"
                >
                  <FiDownload size={14} />
                  Export
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 hover:text-destructive transition-all w-full text-left text-sm"
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Project Info */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{project.name}</h3>
        {project.isConstructProject && project.constructLevel && (
          <div className="mt-2">
            <ConstructBadge 
              level={project.constructLevel} 
              phase={project.constructMetadata?.phase}
              size="small"
            />
          </div>
        )}
      </div>
      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      
      {/* Last Opened */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FiClock size={12} />
        <span>
          {project.lastOpenedAt 
            ? `Opened ${formatDate(project.lastOpenedAt)}`
            : `Created ${formatDate(project.createdAt)}`
          }
        </span>
      </div>
      
      {/* Export Modal */}
      {isElectron() && (
        <ProjectExport
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          projectId={project.id}
        />
      )}
    </motion.div>
  )
}