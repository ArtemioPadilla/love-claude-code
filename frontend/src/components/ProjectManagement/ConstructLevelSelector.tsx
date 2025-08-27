import React from 'react'
import { motion } from 'framer-motion'
import { ConstructLevel } from '../../constructs/types'
import { Package, Layers, Grid3x3, Rocket } from 'lucide-react'

interface ConstructLevelSelectorProps {
  selectedLevel: ConstructLevel | null
  onSelectLevel: (level: ConstructLevel) => void
}

const levelData = {
  [ConstructLevel.L0]: {
    icon: <Package className="w-8 h-8" />,
    title: 'L0 - Primitives',
    description: 'Foundation building blocks with zero dependencies',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    hoverColor: 'hover:bg-blue-500/20',
    examples: ['Button Primitive', 'S3 Bucket', 'Lambda Function'],
    guidelines: [
      'Zero external dependencies',
      'Single responsibility',
      'Direct resource mapping',
      'Minimal API surface'
    ]
  },
  [ConstructLevel.L1]: {
    icon: <Layers className="w-8 h-8" />,
    title: 'L1 - Configured',
    description: 'Sensible defaults built on L0 primitives',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    hoverColor: 'hover:bg-purple-500/20',
    examples: ['Styled Button', 'Configured Database', 'API Gateway'],
    guidelines: [
      'Must use L0 primitives',
      'Add configuration options',
      'Provide sensible defaults',
      'Handle common use cases'
    ]
  },
  [ConstructLevel.L2]: {
    icon: <Grid3x3 className="w-8 h-8" />,
    title: 'L2 - Patterns',
    description: 'Common solutions combining multiple L1 constructs',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    hoverColor: 'hover:bg-green-500/20',
    examples: ['Form Pattern', 'Auth Flow', 'CRUD Pattern'],
    guidelines: [
      'Combine multiple L1 constructs',
      'Implement best practices',
      'Solve specific problems',
      'Include error handling'
    ]
  },
  [ConstructLevel.L3]: {
    icon: <Rocket className="w-8 h-8" />,
    title: 'L3 - Applications',
    description: 'Complete, deployable solutions',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    hoverColor: 'hover:bg-orange-500/20',
    examples: ['Admin Dashboard', 'E-commerce Platform', 'SaaS Starter'],
    guidelines: [
      'Complete applications',
      'Production-ready',
      'Self-contained',
      'Fully configurable'
    ]
  }
}

export const ConstructLevelSelector: React.FC<ConstructLevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Construct Level</h3>
        <p className="text-sm text-muted-foreground">
          Choose the abstraction level for your construct based on its purpose and dependencies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(levelData).map(([level, data]) => {
          const isSelected = selectedLevel === level
          
          return (
            <motion.div
              key={level}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLevel(level as ConstructLevel)}
              className={`
                relative overflow-hidden rounded-lg p-6 cursor-pointer transition-all
                ${data.bgColor} ${data.borderColor} ${data.hoverColor}
                border-2 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
              `}
              style={{
                borderColor: isSelected ? undefined : undefined,
                boxShadow: isSelected ? `0 0 0 2px var(--ring)` : undefined
              }}
            >
              {/* Background gradient */}
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${data.color} opacity-10`} />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-${data.color.split('-')[1]}-600`}>
                    {data.icon}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                <h4 className="text-lg font-semibold mb-2">{data.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{data.description}</p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Examples:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.examples.map((example, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-background/50 rounded-md"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 border-t border-border/50"
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Guidelines:</p>
                      <ul className="space-y-1">
                        {data.guidelines.map((guideline, i) => (
                          <li key={i} className="text-xs flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{guideline}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-accent/50 rounded-lg"
        >
          <p className="text-sm">
            <strong>Next Steps:</strong> After creating your {selectedLevel} construct project, 
            you'll be guided through the specification and implementation process using our 
            TDD/SDD (Test-Driven/Specification-Driven Development) workflow.
          </p>
        </motion.div>
      )}
    </div>
  )
}