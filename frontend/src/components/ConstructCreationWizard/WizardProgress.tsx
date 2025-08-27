import React from 'react'
import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

interface WizardProgressProps {
  steps: Array<{
    id: string
    title: string
  }>
  currentStep: number
  onStepClick?: (stepIndex: number) => void
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  return (
    <div className="px-6 py-4 border-b border-border">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick && (isCompleted || isCurrent)
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <motion.button
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-primary shadow-glow'
                        : isCompleted
                        ? 'bg-primary/80'
                        : 'bg-accent/50'
                    }`}
                  />
                  <span className="relative z-10 text-sm font-medium text-white">
                    {isCompleted ? (
                      <FiCheck size={18} />
                    ) : (
                      index + 1
                    )}
                  </span>
                </motion.button>
                <span
                  className={`ml-3 text-sm font-medium ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-accent/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary/60"
                      initial={{ width: '0%' }}
                      animate={{
                        width: index < currentStep ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}