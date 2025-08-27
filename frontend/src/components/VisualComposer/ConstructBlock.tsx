/**
 * ConstructBlock Component
 * 
 * Represents a draggable construct in the visual composer canvas
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import { Package, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { ConstructLevel, ConstructDisplay } from '../../constructs/types'

interface ConstructBlockData {
  construct: ConstructDisplay
  config: Record<string, any>
  validation?: {
    valid: boolean
    errors: string[]
  }
}

const LEVEL_STYLES = {
  [ConstructLevel.L0]: {
    bg: 'bg-gradient-to-br from-green-500/20 to-green-600/20',
    border: 'border-green-500',
    icon: 'text-green-400',
    glow: 'shadow-green-500/20'
  },
  [ConstructLevel.L1]: {
    bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    border: 'border-blue-500',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  [ConstructLevel.L2]: {
    bg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
  [ConstructLevel.L3]: {
    bg: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20',
    border: 'border-amber-500',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20'
  }
}

export const ConstructBlock: React.FC<NodeProps<ConstructBlockData>> = memo(({ 
  data, 
  selected,
  isConnectable
}) => {
  const { construct, config, validation } = data
  const level = construct.definition.level as ConstructLevel
  const styles = LEVEL_STYLES[level]
  const hasErrors = validation && !validation.valid

  // Count configured properties
  const configuredCount = Object.keys(config).filter(key => config[key] !== undefined).length
  const totalProps = construct.definition.inputs?.length || 0

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        relative px-4 py-3 rounded-lg border-2 transition-all
        ${styles.bg} ${styles.border}
        ${selected ? 'ring-2 ring-white/50' : ''}
        ${hasErrors ? 'border-red-500' : ''}
        ${styles.glow} shadow-lg
        min-w-[250px]
      `}
    >
      {/* Input handles */}
      {construct.definition.inputs?.map((input, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Top}
          id={`input-${input.name}`}
          style={{
            left: `${(index + 1) * (100 / (construct.definition.inputs.length + 1))}%`,
            background: '#4B5563',
            width: 8,
            height: 8
          }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Node content */}
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${styles.icon}`}>
          <Package className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white">{construct.definition.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{level}</span>
                {construct.definition.categories?.map((cat, i) => (
                  <span key={i} className="text-xs text-gray-500">• {cat}</span>
                ))}
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-1">
              {configuredCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-black/20 rounded text-xs">
                  <Settings className="w-3 h-3" />
                  <span>{configuredCount}/{totalProps}</span>
                </div>
              )}
              {hasErrors ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : validation?.valid ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : null}
            </div>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
            {construct.definition.description}
          </p>
          
          {/* Validation errors */}
          {hasErrors && validation?.errors && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              {validation.errors.slice(0, 2).map((error, i) => (
                <div key={i} className="text-xs text-red-400 flex items-start gap-1">
                  <span>•</span>
                  <span>{error}</span>
                </div>
              ))}
              {validation.errors.length > 2 && (
                <div className="text-xs text-red-400 mt-1">
                  ... and {validation.errors.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output handles */}
      {construct.definition.outputs?.map((output, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Bottom}
          id={`output-${output.name}`}
          style={{
            left: `${(index + 1) * (100 / (construct.definition.outputs.length + 1))}%`,
            background: '#4B5563',
            width: 8,
            height: 8
          }}
          isConnectable={isConnectable}
        />
      ))}
    </motion.div>
  )
})