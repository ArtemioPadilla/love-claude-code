/**
 * ConstructPalette Component
 * 
 * A searchable, categorized palette of constructs that can be dragged onto the canvas
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronRight,
  ChevronDown,
  Package,
  Layers,
  Filter,
  X
} from 'lucide-react'
import { ConstructDisplay, ConstructLevel } from '../../constructs/types'

interface ConstructPaletteProps {
  constructs: ConstructDisplay[]
}

interface CategoryGroup {
  name: string
  level: ConstructLevel
  constructs: ConstructDisplay[]
  isExpanded: boolean
}

const LEVEL_INFO = {
  [ConstructLevel.L0]: {
    label: 'L0 - Primitives',
    description: 'Basic building blocks',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  [ConstructLevel.L1]: {
    label: 'L1 - Configured',
    description: 'Ready-to-use components',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  [ConstructLevel.L2]: {
    label: 'L2 - Patterns',
    description: 'Common solutions',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  [ConstructLevel.L3]: {
    label: 'L3 - Applications',
    description: 'Complete solutions',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  }
}

export const ConstructPalette: React.FC<ConstructPaletteProps> = ({ constructs }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<ConstructLevel | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([ConstructLevel.L0, ConstructLevel.L1])
  )

  // Group constructs by level and category
  const groupedConstructs = useMemo(() => {
    const filtered = constructs.filter(construct => {
      const matchesSearch = !searchQuery || 
        construct.definition.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        construct.definition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        construct.definition.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesLevel = !selectedLevel || construct.definition.level === selectedLevel
      
      return matchesSearch && matchesLevel
    })

    const groups: Record<string, CategoryGroup> = {}

    filtered.forEach(construct => {
      const level = construct.definition.level
      if (!groups[level]) {
        groups[level] = {
          name: level,
          level: level as ConstructLevel,
          constructs: [],
          isExpanded: expandedGroups.has(level)
        }
      }
      groups[level].constructs.push(construct)
    })

    return Object.values(groups).sort((a, b) => {
      const levelOrder = [ConstructLevel.L0, ConstructLevel.L1, ConstructLevel.L2, ConstructLevel.L3]
      return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
    })
  }, [constructs, searchQuery, selectedLevel, expandedGroups])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const onDragStart = (event: React.DragEvent, construct: ConstructDisplay) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(construct))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Construct Library
        </h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search constructs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Level filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1 flex-1">
            {Object.values(ConstructLevel).map(level => {
              const info = LEVEL_INFO[level]
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                  className={`
                    px-2 py-1 rounded text-xs transition-colors
                    ${selectedLevel === level 
                      ? `${info.bgColor} ${info.color} border ${info.borderColor}` 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                    }
                  `}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Construct list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {groupedConstructs.map(group => {
            const info = LEVEL_INFO[group.level]
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-800/50 rounded-lg overflow-hidden"
              >
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {group.isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <Layers className={`w-4 h-4 ${info.color}`} />
                    <div className="text-left">
                      <div className={`font-medium ${info.color}`}>{info.label}</div>
                      <div className="text-xs text-gray-500">{info.description}</div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{group.constructs.length}</span>
                </button>
                
                {/* Constructs */}
                <AnimatePresence>
                  {group.isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        {group.constructs.map(construct => (
                          <motion.div
                            key={construct.definition.id}
                            draggable
                            onDragStart={(e: any) => onDragStart(e, construct)}
                            whileHover={{ scale: 1.02 }}
                            whileDrag={{ scale: 1.05, opacity: 0.8 }}
                            className={`
                              p-3 rounded-lg cursor-move transition-all
                              bg-gray-700/50 hover:bg-gray-700
                              border ${info.borderColor}
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <Package className={`w-4 h-4 mt-0.5 ${info.color}`} />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-white">
                                  {construct.definition.name}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {construct.definition.description}
                                </p>
                                {construct.definition.tags && construct.definition.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {construct.definition.tags.slice(0, 3).map(tag => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-gray-600/50 rounded text-xs text-gray-300"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {groupedConstructs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No constructs found</p>
            {(searchQuery || selectedLevel) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedLevel(null)
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        <p>Drag constructs onto the canvas to compose them visually</p>
      </div>
    </div>
  )
}