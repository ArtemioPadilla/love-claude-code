import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Code2, Server, Layers, Brain, Grid } from 'lucide-react'
import { projectTemplates, ProjectTemplate, getTemplatesByCategory } from '../../templates/projectTemplates'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ProjectTemplate) => void
}

const categoryIcons = {
  frontend: <Code2 className="w-5 h-5" />,
  backend: <Server className="w-5 h-5" />,
  fullstack: <Layers className="w-5 h-5" />,
  ai: <Brain className="w-5 h-5" />,
  other: <Grid className="w-5 h-5" />
}

const categoryLabels = {
  frontend: 'Frontend',
  backend: 'Backend', 
  fullstack: 'Full Stack',
  ai: 'AI & ML',
  other: 'Other'
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = React.useMemo(() => {
    let templates = selectedCategory === 'all' 
      ? projectTemplates 
      : getTemplatesByCategory(selectedCategory)
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return templates
  }, [selectedCategory, searchQuery])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-[10%] bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">Choose a Template</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-800">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  All Templates
                </button>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      selectedCategory === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {categoryIcons[key as keyof typeof categoryIcons]}
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No templates found</p>
                  <p className="text-sm mt-2">Try a different search or category</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectTemplate(template)}
                      className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700 hover:border-blue-500"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{template.icon}</div>
                        <div className="flex items-center gap-1">
                          {categoryIcons[template.category]}
                          <span className="text-xs text-gray-500">
                            {categoryLabels[template.category]}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-700 text-xs rounded-md text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Option to start blank */}
            <div className="p-6 border-t border-gray-800">
              <button
                onClick={() => onSelectTemplate({
                  id: 'blank',
                  name: 'Blank Project',
                  description: 'Start with an empty project',
                  category: 'other',
                  icon: '📄',
                  tags: ['blank', 'empty'],
                  files: []
                })}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Start with a blank project
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}