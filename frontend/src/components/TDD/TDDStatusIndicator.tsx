/**
 * TDD Status Indicator Component
 * Shows the current TDD workflow phase in a compact indicator
 */

import React from 'react'
import { motion } from 'framer-motion'
import { TestTube, Circle } from 'lucide-react'
import { WorkflowState } from '../../services/tdd/TDDWorkflow'

interface TDDStatusIndicatorProps {
  phase: WorkflowState['phase']
  coverage?: number
  testsPassing?: boolean
  onClick?: () => void
  className?: string
}

export const TDDStatusIndicator: React.FC<TDDStatusIndicatorProps> = ({
  phase,
  coverage,
  testsPassing,
  onClick,
  className = ''
}) => {
  const phaseConfig = {
    red: {
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Red',
      description: 'Writing failing tests'
    },
    green: {
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'Green',
      description: 'Making tests pass'
    },
    refactor: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      label: 'Refactor',
      description: 'Improving code'
    },
    complete: {
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      label: 'Complete',
      description: 'Workflow finished'
    }
  }

  const config = phaseConfig[phase]

  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${config.bg} ${config.border} hover:opacity-80 transition-all ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <TestTube className={`w-5 h-5 ${config.color}`} />
        {phase !== 'complete' && (
          <motion.div
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              phase === 'red' ? 'bg-red-500' :
              phase === 'green' ? 'bg-green-500' :
              'bg-blue-500'
            }`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      <div className="text-left">
        <div className={`text-sm font-semibold ${config.color}`}>
          TDD: {config.label}
        </div>
        <div className="text-xs text-gray-400">
          {config.description}
        </div>
      </div>

      {(coverage !== undefined || testsPassing !== undefined) && (
        <div className="ml-auto flex items-center gap-2">
          {testsPassing !== undefined && (
            <Circle 
              className={`w-3 h-3 ${testsPassing ? 'text-green-500' : 'text-red-500'}`}
              fill="currentColor"
            />
          )}
          {coverage !== undefined && (
            <span className="text-xs font-mono text-gray-400">
              {coverage}%
            </span>
          )}
        </div>
      )}
    </motion.button>
  )
}

export default TDDStatusIndicator