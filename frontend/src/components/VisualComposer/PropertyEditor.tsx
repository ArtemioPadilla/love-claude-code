/**
 * PropertyEditor Component
 * 
 * Allows editing of construct properties and configurations
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Info,
  Code,
  Link,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  Database,
  Shield,
  DollarSign
} from 'lucide-react'
import { Node } from 'reactflow'
import { ConstructDisplay } from '../../constructs/types'

interface PropertyEditorProps {
  node: Node<{
    construct: ConstructDisplay
    config: Record<string, any>
    validation?: {
      valid: boolean
      errors: string[]
    }
  }> | null
  onUpdateConfig: (config: Record<string, any>) => void
}

interface PropertySection {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ node, onUpdateConfig }) => {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['properties', 'connections'])
  )

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {})
    }
  }, [node])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const handlePropertyChange = (propertyName: string, value: any) => {
    const newConfig = { ...config, [propertyName]: value }
    setConfig(newConfig)
    onUpdateConfig(newConfig)
  }

  const renderPropertyInput = (input: any) => {
    const value = config[input.name] ?? input.defaultValue ?? ''

    switch (input.type) {
      case 'string': {
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(input.name, e.target.value)}
            placeholder={input.description}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        )
      }
      
      case 'number': {
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(input.name, parseFloat(e.target.value) || 0)}
            placeholder={input.description}
            min={input.validation?.min}
            max={input.validation?.max}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        )
      }
      
      case 'boolean': {
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handlePropertyChange(input.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">{input.description}</span>
          </label>
        )
      }
      
      case 'select': {
        return (
          <select
            value={value}
            onChange={(e) => handlePropertyChange(input.name, e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select {input.name}...</option>
            {input.validation?.enum?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      }
      
      case 'code': {
        return (
          <textarea
            value={value}
            onChange={(e) => handlePropertyChange(input.name, e.target.value)}
            placeholder={input.description}
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
          />
        )
      }
      
      default: {
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(input.name, e.target.value)}
            placeholder={`${input.type} input`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        )
      }
    }
  }

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-8">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a construct to configure its properties</p>
        </div>
      </div>
    )
  }

  const { construct, validation } = node.data
  const definition = construct.definition

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{definition.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{definition.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-700 rounded">{definition.level}</span>
              <span>v{definition.version}</span>
              <span>by {definition.author}</span>
            </div>
          </div>
        </div>
        
        {/* Validation status */}
        {validation && !validation.valid && (
          <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Configuration Issues</p>
                <ul className="mt-1 space-y-1">
                  {validation.errors.map((error, i) => (
                    <li key={i} className="text-xs text-red-300">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Properties section */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('properties')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Properties</span>
              <span className="text-sm text-gray-500">
                ({definition.inputs?.length || 0})
              </span>
            </div>
            {expandedSections.has('properties') ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('properties') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {definition.inputs?.map((input) => (
                    <div key={input.name}>
                      <label className="block mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          {input.name}
                          {input.required && <span className="text-red-400 ml-1">*</span>}
                        </span>
                        {input.description && (
                          <p className="text-xs text-gray-500 mt-1">{input.description}</p>
                        )}
                      </label>
                      {renderPropertyInput(input)}
                    </div>
                  ))}
                  
                  {(!definition.inputs || definition.inputs.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No configurable properties
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Connections section */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('connections')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Connections</span>
            </div>
            {expandedSections.has('connections') ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('connections') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Inputs</h4>
                      {definition.inputs?.map(input => (
                        <div key={input.name} className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-400">{input.name}</span>
                          <span className="text-xs text-gray-500">{input.type}</span>
                        </div>
                      ))}
                      {(!definition.inputs || definition.inputs.length === 0) && (
                        <p className="text-xs text-gray-500">No inputs</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Outputs</h4>
                      {definition.outputs?.map(output => (
                        <div key={output.name} className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-400">{output.name}</span>
                          <span className="text-xs text-gray-500">{output.type}</span>
                        </div>
                      ))}
                      {(!definition.outputs || definition.outputs.length === 0) && (
                        <p className="text-xs text-gray-500">No outputs</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Documentation section */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('documentation')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Documentation</span>
            </div>
            {expandedSections.has('documentation') ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('documentation') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* Best practices */}
                  {definition.bestPractices && definition.bestPractices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Best Practices</h4>
                      <ul className="space-y-1">
                        {definition.bestPractices.map((practice, i) => (
                          <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                            <span>•</span>
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Examples */}
                  {definition.examples && definition.examples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Examples</h4>
                      {definition.examples.map((example, i) => (
                        <div key={i} className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">{example.title}</p>
                          <pre className="p-2 bg-gray-800 rounded text-xs overflow-x-auto">
                            <code>{example.code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Repository link */}
                  {definition.repository && (
                    <a
                      href={definition.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Code className="w-4 h-4" />
                      View source
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Additional info */}
        <div className="p-4 space-y-3 text-xs text-gray-500">
          {/* Security */}
          {definition.security && definition.security.length > 0 && (
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5" />
              <div>
                <span className="font-medium">Security:</span> {definition.security.length} considerations
              </div>
            </div>
          )}
          
          {/* Cost */}
          {definition.cost && (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 mt-0.5" />
              <div>
                <span className="font-medium">Est. Cost:</span> ${definition.cost.baseMonthly}/month base
              </div>
            </div>
          )}
          
          {/* Dependencies */}
          {definition.dependencies && definition.dependencies.length > 0 && (
            <div className="flex items-start gap-2">
              <Database className="w-4 h-4 mt-0.5" />
              <div>
                <span className="font-medium">Dependencies:</span> {definition.dependencies.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}