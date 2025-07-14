import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSettings, FiCode, FiPackage, FiGitBranch } from 'react-icons/fi'
import { MCPSettings } from '../Settings/MCPSettings'
import type { Project } from '@stores/projectStore'

interface ProjectSettingsModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<Project>) => void
}

type SettingsTab = 'general' | 'mcp' | 'deployment' | 'version'

export function ProjectSettingsModal({ 
  project, 
  isOpen, 
  onClose, 
  onUpdate 
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || ''
  })

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'mcp', label: 'MCP', icon: FiCode },
    { id: 'deployment', label: 'Deployment', icon: FiPackage },
    { id: 'version', label: 'Version Control', icon: FiGitBranch }
  ]

  const handleSave = () => {
    onUpdate(formData)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Project Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-accent/50 transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`
                    flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all
                    ${activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Project Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Describe your project..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Template
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {project.template || 'Blank'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Created
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'mcp' && (
                <MCPSettings projectId={project.id} />
              )}

              {activeTab === 'deployment' && (
                <div className="text-center py-12 text-muted-foreground">
                  <FiPackage className="mx-auto mb-4 opacity-50" size={48} />
                  <p className="text-lg mb-2">Deployment Settings</p>
                  <p className="text-sm">Configure deployment targets and build settings</p>
                  <p className="text-xs mt-4 opacity-75">Coming soon...</p>
                </div>
              )}

              {activeTab === 'version' && (
                <div className="text-center py-12 text-muted-foreground">
                  <FiGitBranch className="mx-auto mb-4 opacity-50" size={48} />
                  <p className="text-lg mb-2">Version Control</p>
                  <p className="text-sm">Connect to GitHub, GitLab, or Bitbucket</p>
                  <p className="text-xs mt-4 opacity-75">Coming soon...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'general' && (
              <div className="flex justify-end gap-2 p-6 border-t border-border">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}