import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { ConstructLevel, ConstructType, ConstructDefinition, CloudProvider } from '../../constructs/types'
import { useConstructStore } from '../../stores/constructStore'
import { useProjectStore } from '../../stores/projectStore'
import { BasicInfoStep } from './BasicInfoStep'
import { DependenciesStep } from './DependenciesStep'
import { SpecificationStep } from './SpecificationStep'
import { TestingStep } from './TestingStep'
import { ImplementationStep } from './ImplementationStep'
import { ReviewStep } from './ReviewStep'
import { WizardNavigation } from './WizardNavigation'
import { WizardProgress } from './WizardProgress'

// Type for input validation rules
interface InputValidation {
  pattern?: string
  min?: number
  max?: number
  enum?: (string | number | boolean)[]
  custom?: string
}

export interface WizardData {
  // Basic Info
  name: string
  description: string
  level: ConstructLevel | null
  type: ConstructType | null
  category: string
  icon: string
  version: string
  author: string
  license: string
  repository?: string
  
  // Dependencies
  dependencies: Array<{
    constructId: string
    version: string
    optional?: boolean
  }>
  externalDependencies: Array<{
    name: string
    version: string
    type: 'npm' | 'pip' | 'cargo' | 'other'
  }>
  
  // Specification
  naturalLanguageSpec: string
  inputs: Array<{
    name: string
    type: string
    description: string
    required: boolean
    defaultValue?: string | number | boolean | null
    validation?: InputValidation
  }>
  outputs: Array<{
    name: string
    type: string
    description: string
    sensitive?: boolean
  }>
  providers: CloudProvider[]
  tags: string[]
  
  // Testing
  testCases: Array<{
    name: string
    description: string
    code: string
    expected: string | number | boolean | object | null
    type: 'unit' | 'integration' | 'e2e'
    status?: 'pending' | 'running' | 'passed' | 'failed'
    error?: string
  }>
  coverageTarget: number
  testConfiguration: {
    framework: 'jest' | 'vitest' | 'mocha' | 'other'
    runInDocker: boolean
    envVars: Record<string, string>
  }
  
  // Implementation
  implementationCode: string
  boilerplateUsed: string | null
  liveValidationPassed: boolean
  previewUrl?: string
  
  // Metadata
  selfReferential: {
    isPlatformConstruct: boolean
    developmentMethod: 'vibe-coded' | 'manual' | 'hybrid'
    vibeCodingPercentage: number
    canBuildConstructs?: boolean
  }
}

const initialWizardData: WizardData = {
  name: '',
  description: '',
  level: null,
  type: null,
  category: '',
  icon: '🔧',
  version: '1.0.0',
  author: '',
  license: 'MIT',
  repository: '',
  dependencies: [],
  externalDependencies: [],
  naturalLanguageSpec: '',
  inputs: [],
  outputs: [],
  providers: [CloudProvider.LOCAL],
  tags: [],
  testCases: [],
  coverageTarget: 80,
  testConfiguration: {
    framework: 'vitest',
    runInDocker: false,
    envVars: {}
  },
  implementationCode: '',
  boilerplateUsed: null,
  liveValidationPassed: false,
  previewUrl: '',
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'vibe-coded',
    vibeCodingPercentage: 100,
    canBuildConstructs: false
  }
}

export interface ConstructCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: WizardData) => void
  initialLevel?: ConstructLevel
  projectId?: string
}

export function ConstructCreationWizard({
  isOpen,
  onClose,
  onComplete,
  initialLevel,
  projectId
}: ConstructCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({
    ...initialWizardData,
    level: initialLevel || null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { addProject, updateProject } = useProjectStore()
  const { submitContribution } = useConstructStore()
  
  const steps = [
    { id: 'basic', title: 'Basic Information', component: BasicInfoStep },
    { id: 'dependencies', title: 'Dependencies', component: DependenciesStep },
    { id: 'specification', title: 'Specification', component: SpecificationStep },
    { id: 'testing', title: 'Testing', component: TestingStep },
    { id: 'implementation', title: 'Implementation', component: ImplementationStep },
    { id: 'review', title: 'Review & Create', component: ReviewStep }
  ]
  
  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }
  
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (stepIndex) {
      case 0: // Basic Info
        if (!wizardData.name) newErrors.name = 'Name is required'
        if (!wizardData.description) newErrors.description = 'Description is required'
        if (!wizardData.level) newErrors.level = 'Level is required'
        if (!wizardData.type) newErrors.type = 'Type is required'
        if (!wizardData.category) newErrors.category = 'Category is required'
        if (!wizardData.author) newErrors.author = 'Author is required'
        break
        
      case 1: // Dependencies
        // Dependencies are optional, no validation needed
        break
        
      case 2: // Specification
        if (!wizardData.naturalLanguageSpec) {
          newErrors.naturalLanguageSpec = 'Natural language specification is required'
        }
        if (wizardData.inputs.length === 0) {
          newErrors.inputs = 'At least one input is required'
        }
        if (wizardData.outputs.length === 0) {
          newErrors.outputs = 'At least one output is required'
        }
        break
        
      case 3: // Testing
        if (wizardData.testCases.length === 0) {
          newErrors.testCases = 'At least one test case is required'
        }
        break
        
      case 4: // Implementation
        if (!wizardData.implementationCode) {
          newErrors.implementationCode = 'Implementation code is required'
        }
        if (!wizardData.liveValidationPassed) {
          newErrors.validation = 'Code validation must pass before proceeding'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const handleStepClick = (stepIndex: number) => {
    // Allow going back to previous steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex)
    }
  }
  
  const handleCreate = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    try {
      // Create the construct definition
      const constructDefinition: ConstructDefinition = {
        id: `${wizardData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: wizardData.name,
        level: wizardData.level!,
        type: wizardData.type!,
        description: wizardData.description,
        version: wizardData.version,
        author: wizardData.author,
        categories: [wizardData.category],
        providers: wizardData.providers,
        tags: wizardData.tags,
        license: wizardData.license,
        repository: wizardData.repository,
        inputs: wizardData.inputs,
        outputs: wizardData.outputs,
        dependencies: wizardData.dependencies,
        security: [], // TODO: Add security considerations
        cost: { // TODO: Add cost estimation
          baseMonthly: 0,
          usageFactors: []
        },
        c4: { // TODO: Add C4 metadata
          type: 'Component',
          technology: 'TypeScript'
        },
        examples: [], // TODO: Generate from test cases
        bestPractices: [], // TODO: Add best practices
        deployment: { // TODO: Add deployment config
          requiredProviders: [],
          configSchema: {}
        }
      }
      
      // If we have a project ID, update the project
      if (projectId) {
        updateProject(projectId, {
          constructMetadata: {
            level: wizardData.level?.toString() || 'L0',
            phase: 'implementation' as const,
            specificationComplete: true,
            testsGenerated: true,
            implementationComplete: false,
            ...wizardData.selfReferential
          }
        })
      } else {
        // Create a new project for the construct
        addProject({
          name: wizardData.name,
          description: wizardData.description,
          isConstructProject: true,
          constructLevel: wizardData.level || undefined,
          constructMetadata: {
            level: wizardData.level?.toString() || 'L0',
            phase: 'implementation' as const,
            specificationComplete: true,
            testsGenerated: true,
            implementationComplete: false,
            ...wizardData.selfReferential
          }
        })
      }
      
      // Submit as a community contribution
      await submitContribution({
        construct: constructDefinition,
        contributor: {
          id: 'current-user', // TODO: Get from auth
          username: wizardData.author,
          avatar: ''
        }
      })
      
      onComplete(wizardData)
      onClose()
    } catch (error) {
      console.error('Failed to create construct:', error)
      setErrors({ submit: 'Failed to create construct. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const CurrentStepComponent = steps[currentStep].component
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-semibold">Create New Construct</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Follow the guided steps to create a reusable construct
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-md hover:bg-accent/50 transition-all"
            >
              <FiX size={20} />
            </motion.button>
          </div>
          
          {/* Progress */}
          <WizardProgress
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CurrentStepComponent
                  data={wizardData}
                  errors={errors}
                  onUpdate={updateWizardData}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Navigation */}
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={steps.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={handleCreate}
            isSubmitting={isSubmitting}
            canProceed={Object.keys(errors).length === 0}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}