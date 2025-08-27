import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiPlus, FiX, FiPackage, FiInfo } from 'react-icons/fi'
import { WizardData } from './ConstructCreationWizard'
import { DependencyGraph } from './DependencyGraph'
import { useConstructStore } from '../../stores/constructStore'
import { ConstructLevel } from '../../constructs/types'

interface DependenciesStepProps {
  data: WizardData
  errors: Record<string, string>
  onUpdate: (updates: Partial<WizardData>) => void
}

interface ExternalDependency {
  name: string
  version: string
  type: 'npm' | 'pip' | 'cargo' | 'other'
}

export function DependenciesStep({ data, onUpdate }: DependenciesStepProps) {
  const { constructs, fetchConstructs } = useConstructStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [externalDep, setExternalDep] = useState<ExternalDependency>({
    name: '',
    version: '',
    type: 'npm'
  })
  
  // Load constructs if not already loaded
  useEffect(() => {
    if (constructs.length === 0) {
      fetchConstructs()
    }
  }, [constructs.length, fetchConstructs])
  
  // Filter constructs based on search and level compatibility
  const availableConstructs = useMemo(() => {
    return constructs.filter(construct => {
      // Filter by search query
      if (searchQuery && !construct.definition.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filter by level compatibility
      if (data.level) {
        const levelHierarchy = {
          [ConstructLevel.L0]: [ConstructLevel.L0],
          [ConstructLevel.L1]: [ConstructLevel.L0, ConstructLevel.L1],
          [ConstructLevel.L2]: [ConstructLevel.L0, ConstructLevel.L1, ConstructLevel.L2],
          [ConstructLevel.L3]: [ConstructLevel.L0, ConstructLevel.L1, ConstructLevel.L2, ConstructLevel.L3]
        }
        
        if (!levelHierarchy[data.level].includes(construct.definition.level)) {
          return false
        }
      }
      
      // Don't show already added dependencies
      return !data.dependencies.some(dep => dep.constructId === construct.definition.id)
    })
  }, [constructs, searchQuery, data.level, data.dependencies])
  
  const addDependency = (constructId: string) => {
    const construct = constructs.find(c => c.definition.id === constructId)
    if (!construct) return
    
    onUpdate({
      dependencies: [
        ...data.dependencies,
        {
          constructId,
          version: construct.definition.version,
          optional: false
        }
      ]
    })
  }
  
  const removeDependency = (constructId: string) => {
    onUpdate({
      dependencies: data.dependencies.filter(dep => dep.constructId !== constructId)
    })
  }
  
  const toggleOptional = (constructId: string) => {
    onUpdate({
      dependencies: data.dependencies.map(dep =>
        dep.constructId === constructId
          ? { ...dep, optional: !dep.optional }
          : dep
      )
    })
  }
  
  const addExternalDependency = () => {
    if (externalDep.name && externalDep.version) {
      onUpdate({
        externalDependencies: [...data.externalDependencies, { ...externalDep }]
      })
      setExternalDep({ name: '', version: '', type: 'npm' })
      setShowExternalForm(false)
    }
  }
  
  const removeExternalDependency = (index: number) => {
    onUpdate({
      externalDependencies: data.externalDependencies.filter((_, i) => i !== index)
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Construct Dependencies */}
      <div>
        <h3 className="text-lg font-medium mb-4">Construct Dependencies</h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search constructs..."
            className="w-full pl-10 pr-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        
        {/* Selected Dependencies */}
        {data.dependencies.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Selected Dependencies</h4>
            <div className="space-y-2">
              {data.dependencies.map((dep) => {
                const construct = constructs.find(c => c.definition.id === dep.constructId)
                if (!construct) return null
                
                return (
                  <motion.div
                    key={dep.constructId}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {typeof construct.icon === 'string' 
                          ? construct.icon 
                          : construct.icon 
                            ? <construct.icon /> 
                            : '📦'}
                      </span>
                      <div>
                        <p className="font-medium">{construct.definition.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {construct.definition.level} • v{dep.version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={dep.optional || false}
                          onChange={() => toggleOptional(dep.constructId)}
                          className="rounded border-border"
                        />
                        Optional
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeDependency(dep.constructId)}
                        className="p-1 rounded hover:bg-accent/50 transition-all text-red-500"
                      >
                        <FiX size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Available Constructs */}
        <div>
          <h4 className="text-sm font-medium mb-2">Available Constructs</h4>
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {availableConstructs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No constructs found
              </p>
            ) : (
              availableConstructs.map((construct) => (
                <motion.button
                  key={construct.definition.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => addDependency(construct.definition.id)}
                  className="flex items-center justify-between p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {typeof construct.icon === 'string' 
                        ? construct.icon 
                        : construct.icon 
                          ? <construct.icon /> 
                          : '📦'}
                    </span>
                    <div>
                      <p className="font-medium">{construct.definition.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {construct.definition.level} • {construct.definition.type}
                      </p>
                    </div>
                  </div>
                  <FiPlus className="text-primary" />
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Dependency Graph */}
      {data.dependencies.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Dependency Graph</h3>
          <div className="h-64 bg-accent/10 rounded-lg border border-border/50 overflow-hidden">
            <DependencyGraph
              constructId={`${data.name}-preview`}
              dependencies={data.dependencies}
              constructs={constructs}
            />
          </div>
        </div>
      )}
      
      {/* External Dependencies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">External Dependencies</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExternalForm(true)}
            className="flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all text-sm"
          >
            <FiPlus size={14} />
            Add External
          </motion.button>
        </div>
        
        {/* External Dependencies List */}
        {data.externalDependencies.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.externalDependencies.map((dep, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FiPackage className="text-muted-foreground" />
                  <div>
                    <p className="font-medium">{dep.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dep.type} • v{dep.version}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeExternalDependency(index)}
                  className="p-1 rounded hover:bg-accent/50 transition-all text-red-500"
                >
                  <FiX size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Add External Form */}
        <AnimatePresence>
          {showExternalForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent/10 border border-border/50 rounded-lg p-4 space-y-3"
            >
              <div className="grid grid-cols-[1fr,100px,100px] gap-3">
                <input
                  type="text"
                  value={externalDep.name}
                  onChange={(e) => setExternalDep({ ...externalDep, name: e.target.value })}
                  placeholder="Package name"
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                />
                <input
                  type="text"
                  value={externalDep.version}
                  onChange={(e) => setExternalDep({ ...externalDep, version: e.target.value })}
                  placeholder="Version"
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                />
                <select
                  value={externalDep.type}
                  onChange={(e) => setExternalDep({ ...externalDep, type: e.target.value as any })}
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="npm">npm</option>
                  <option value="pip">pip</option>
                  <option value="cargo">cargo</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addExternalDependency}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm"
                >
                  Add
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExternalForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent/50 transition-all text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Dependency Guidelines:</strong>
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Only add dependencies that are actually used in your construct</li>
              <li>Mark dependencies as optional if they're not required for basic functionality</li>
              <li>Consider the level hierarchy - higher level constructs can depend on lower levels</li>
              <li>External dependencies should specify exact versions for reproducibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}