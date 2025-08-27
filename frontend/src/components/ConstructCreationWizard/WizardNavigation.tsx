import React from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiLoader } from 'react-icons/fi'

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  isSubmitting: boolean
  canProceed: boolean
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  isSubmitting,
  canProceed
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  
  return (
    <div className="flex items-center justify-between p-6 border-t border-border">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPrevious}
        disabled={isFirstStep}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isFirstStep
            ? 'bg-accent/30 text-muted-foreground cursor-not-allowed'
            : 'border border-border hover:bg-accent/50'
        }`}
      >
        <FiArrowLeft size={16} />
        Previous
      </motion.button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      
      {isLastStep ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          disabled={isSubmitting || !canProceed}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
            isSubmitting || !canProceed
              ? 'bg-accent/50 text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow'
          }`}
        >
          {isSubmitting ? (
            <>
              <FiLoader className="animate-spin" size={16} />
              Creating...
            </>
          ) : (
            <>
              <FiCheck size={16} />
              Create Construct
            </>
          )}
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
        >
          Next
          <FiArrowRight size={16} />
        </motion.button>
      )}
    </div>
  )
}