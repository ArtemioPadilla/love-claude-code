import { create } from 'zustand'
import { 
  ConstructDisplay, 
  ConstructFilters, 
  ConstructDeploymentState,
  DeploymentConfiguration,
  ConstructComposition,
  CommunityContribution,
  ConstructPhase,
  TestResult,
  ConstructLevel,
  ValidationResult,
  ConstructSpecification,
  Construct
} from '../constructs/types'
import { getAllConstructsDisplay } from '../constructs/registry'
import { validateConstructSpecification, validateConstructImplementation, validateConstructTests } from '../services/validation/ConstructValidator'
import { performanceMonitor } from '../services/monitoring/performanceMonitor'

interface ConstructStore {
  // Constructs catalog
  constructs: ConstructDisplay[]
  loading: boolean
  error: string | null
  filters: ConstructFilters
  selectedConstruct: ConstructDisplay | null
  
  // Deployments
  deployments: ConstructDeploymentState[]
  activeDeployment: string | null
  
  // Compositions
  compositions: ConstructComposition[]
  currentComposition: ConstructComposition | null
  
  // Community
  contributions: CommunityContribution[]
  
  // Construct Builder
  currentConstruct: Construct | null
  currentPhase: ConstructPhase
  phaseProgress: Record<ConstructPhase, number>
  validationResults: ValidationResult
  testResults: { suites: TestResult[] } | null
  isGeneratingWithAI: boolean
  isRunningTests: boolean
  testCoverage: { percentage: number } | null
  previewProps: Record<string, any>
  resolvedDependencies: Array<{ name: string; version: string }>
  
  // Actions
  fetchConstructs: () => Promise<void>
  setFilters: (filters: ConstructFilters) => void
  setSelectedConstruct: (construct: ConstructDisplay | null) => void
  getAllConstructs: () => ConstructDisplay[]
  reloadConstruct: (constructId: string) => Promise<void>
  
  // Deployment actions
  deployConstruct: (constructId: string, config: DeploymentConfiguration) => Promise<void>
  updateDeploymentStatus: (deploymentId: string, status: Partial<ConstructDeploymentState>) => void
  
  // Composition actions
  saveComposition: (composition: ConstructComposition) => void
  loadComposition: (id: string) => void
  deleteComposition: (id: string) => void
  
  // Community actions
  submitContribution: (contribution: Omit<CommunityContribution, 'id' | 'status' | 'submittedAt'>) => Promise<void>
  fetchContributions: () => Promise<void>
  
  // Construct Builder actions
  loadConstruct: (constructId: string) => Promise<void>
  saveConstruct: () => Promise<void>
  transitionPhase: (phase: ConstructPhase) => void
  updateSpecification: (spec: string) => void
  updateImplementation: (code: string) => void
  updateTests: (tests: string) => void
  generateSpecFromDescription: (description: string) => Promise<void>
  generateImplementation: () => Promise<void>
  generateTests: () => Promise<void>
  runTests: () => Promise<void>
  updatePreviewProps: (props: Record<string, any>) => void
}

export const useConstructStore = create<ConstructStore>((set, get) => ({
  // Initial state
  constructs: [],
  loading: false,
  error: null,
  filters: {},
  selectedConstruct: null,
  deployments: [],
  activeDeployment: null,
  compositions: [],
  currentComposition: null,
  contributions: [],
  
  // Construct Builder state
  currentConstruct: null,
  currentPhase: 'specification',
  phaseProgress: {
    specification: 0,
    test: 0,
    implementation: 0,
    certification: 0
  },
  validationResults: { valid: true, errors: [], warnings: [] },
  testResults: null,
  isGeneratingWithAI: false,
  isRunningTests: false,
  testCoverage: null,
  previewProps: {},
  resolvedDependencies: [],
  
  // Fetch constructs from catalog
  fetchConstructs: async () => {
    set({ loading: true, error: null })
    
    try {
      // Load all constructs from the registry
      const constructs = getAllConstructsDisplay()
      
      // In a real implementation, this might also fetch from an API
      // to get community constructs, ratings, deployment counts, etc.
      
      set({ constructs, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  
  // Set filters
  setFilters: (filters) => set({ filters }),
  
  // Set selected construct
  setSelectedConstruct: (construct) => set({ selectedConstruct: construct }),
  
  // Deploy a construct
  deployConstruct: async (constructId, _config) => {
    const deploymentId = Date.now().toString()
    const deployment: ConstructDeploymentState = {
      id: deploymentId,
      constructId,
      status: 'validating',
      progress: 0,
      timestamp: new Date()
    }
    
    set(state => ({
      deployments: [...state.deployments, deployment],
      activeDeployment: deploymentId
    }))
    
    // Simulate deployment process
    try {
      // Validation
      await new Promise(resolve => setTimeout(resolve, 1000))
      get().updateDeploymentStatus(deploymentId, { 
        status: 'previewing', 
        progress: 20,
        currentStep: 'Previewing changes'
      })
      
      // Preview
      await new Promise(resolve => setTimeout(resolve, 2000))
      get().updateDeploymentStatus(deploymentId, { 
        status: 'deploying', 
        progress: 50,
        currentStep: 'Deploying infrastructure'
      })
      
      // Deploy
      await new Promise(resolve => setTimeout(resolve, 3000))
      get().updateDeploymentStatus(deploymentId, { 
        status: 'deployed', 
        progress: 100,
        currentStep: 'Deployment complete',
        result: {
          url: 'https://example.com',
          resources: 5
        }
      })
      
    } catch (error) {
      get().updateDeploymentStatus(deploymentId, { 
        status: 'failed', 
        error: (error as Error).message
      })
    }
  },
  
  // Update deployment status
  updateDeploymentStatus: (deploymentId, update) => {
    set(state => ({
      deployments: state.deployments.map(d => 
        d.id === deploymentId ? { ...d, ...update } : d
      )
    }))
  },
  
  // Save composition
  saveComposition: (composition) => {
    set(state => ({
      compositions: [...state.compositions, composition],
      currentComposition: composition
    }))
  },
  
  // Load composition
  loadComposition: (id) => {
    const composition = get().compositions.find(c => c.id === id)
    if (composition) {
      set({ currentComposition: composition })
    }
  },
  
  // Delete composition
  deleteComposition: (id) => {
    set(state => ({
      compositions: state.compositions.filter(c => c.id !== id),
      currentComposition: state.currentComposition?.id === id ? null : state.currentComposition
    }))
  },
  
  // Submit contribution
  submitContribution: async (contribution) => {
    const newContribution: CommunityContribution = {
      ...contribution,
      id: Date.now().toString(),
      status: 'pending',
      submittedAt: new Date()
    }
    
    set(state => ({
      contributions: [...state.contributions, newContribution]
    }))
    
    // In real implementation, this would submit to API
  },
  
  // Fetch contributions
  fetchContributions: async () => {
    // In real implementation, this would fetch from API
    set({ contributions: [] })
  },
  
  // Construct Builder actions
  loadConstruct: async (constructId) => {
    const startTime = performance.now()
    try {
      // In real implementation, load from file system or API
      const mockConstruct: Construct = {
        id: constructId,
        metadata: {
          name: 'MyConstruct',
          level: ConstructLevel.L0,
          category: 'ui',
          tags: [],
          author: 'user',
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        specification: '',
        implementation: '',
        tests: '',
        documentation: '',
        examples: []
      }
      set({ currentConstruct: mockConstruct })
      
      const duration = performance.now() - startTime
      performanceMonitor.trackConstructOperation('Load Construct', duration, {
        constructId,
        success: true
      })
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMonitor.trackConstructOperation('Load Construct', duration, {
        constructId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  },
  
  saveConstruct: async () => {
    const startTime = performance.now()
    const construct = get().currentConstruct
    
    try {
      // In real implementation, save to file system or API
      console.log('Saving construct...', construct)
      
      // Simulate some async work
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const duration = performance.now() - startTime
      performanceMonitor.trackConstructOperation('Save Construct', duration, {
        constructId: construct?.id,
        constructName: construct?.metadata.name,
        success: true
      })
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMonitor.trackConstructOperation('Save Construct', duration, {
        constructId: construct?.id,
        constructName: construct?.metadata.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  },
  
  transitionPhase: (phase) => {
    set({ currentPhase: phase })
  },
  
  updateSpecification: (spec) => {
    const validationResults = validateConstructSpecification(spec)
    const progress = spec.trim() ? (validationResults.valid ? 100 : 50) : 0
    
    set(state => ({
      currentConstruct: state.currentConstruct ? {
        ...state.currentConstruct,
        specification: spec
      } : null,
      validationResults,
      phaseProgress: {
        ...state.phaseProgress,
        specification: progress
      }
    }))
  },
  
  updateImplementation: (code) => {
    const construct = get().currentConstruct
    if (!construct) return
    
    let spec: ConstructSpecification | null = null
    try {
      spec = JSON.parse(construct.specification) as ConstructSpecification
    } catch {
      // Invalid JSON specification - will be handled downstream
    }
    
    const validationResults = spec 
      ? validateConstructImplementation(code, spec)
      : { valid: true, errors: [], warnings: [] }
    
    const progress = code.trim() ? (validationResults.valid ? 100 : 50) : 0
    
    set(state => ({
      currentConstruct: {
        ...construct,
        implementation: code
      },
      validationResults,
      phaseProgress: {
        ...state.phaseProgress,
        implementation: progress
      }
    }))
  },
  
  updateTests: (tests) => {
    const construct = get().currentConstruct
    if (!construct) return
    
    let spec: ConstructSpecification | null = null
    try {
      spec = JSON.parse(construct.specification) as ConstructSpecification
    } catch {
      // Invalid JSON specification - will be handled downstream
    }
    
    const validationResults = spec
      ? validateConstructTests(tests, spec)
      : { valid: true, errors: [], warnings: [] }
    
    const progress = tests.trim() ? (validationResults.valid ? 50 : 25) : 0
    
    set(state => ({
      currentConstruct: {
        ...construct,
        tests
      },
      validationResults,
      phaseProgress: {
        ...state.phaseProgress,
        test: progress
      }
    }))
  },
  
  generateSpecFromDescription: async (description) => {
    set({ isGeneratingWithAI: true })
    
    // In real implementation, call AI service
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockSpec = `name: MyGeneratedConstruct
level: L0
category: ui
description: |
  ${description}

props:
  - name: label
    type: string
    required: true
    description: Button label text
  - name: onClick
    type: function
    required: true
    description: Click handler function
  - name: disabled
    type: boolean
    required: false
    default: false
    description: Whether button is disabled

dependencies:
  - react

examples:
  - title: Basic Usage
    code: |
      <MyGeneratedConstruct 
        label="Click me" 
        onClick={() => console.log('clicked')} 
      />`
    
    get().updateSpecification(mockSpec)
    set({ isGeneratingWithAI: false })
  },
  
  generateImplementation: async () => {
    set({ isGeneratingWithAI: true })
    
    // In real implementation, call AI service with spec
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockImplementation = `import React from 'react';

export const MyGeneratedConstruct = ({ label, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {label}
    </button>
  );
};`
    
    get().updateImplementation(mockImplementation)
    set({ isGeneratingWithAI: false })
  },
  
  generateTests: async () => {
    set({ isGeneratingWithAI: true })
    
    // In real implementation, generate from spec
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockTests = `import { render, screen, fireEvent } from '@testing-library/react';
import { MyGeneratedConstruct } from './implementation';

describe('MyGeneratedConstruct', () => {
  test('renders with label', () => {
    render(<MyGeneratedConstruct label="Test Button" onClick={() => {}} />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<MyGeneratedConstruct label="Click me" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('is disabled when disabled prop is true', () => {
    render(<MyGeneratedConstruct label="Disabled" onClick={() => {}} disabled />);
    
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });
});`
    
    get().updateTests(mockTests)
    set({ isGeneratingWithAI: false })
  },
  
  runTests: async () => {
    set({ isRunningTests: true })
    
    // In real implementation, run tests in sandbox
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const mockResults: TestResult[] = [
      {
        name: 'MyGeneratedConstruct',
        tests: [
          {
            name: 'renders with label',
            status: 'passed',
            duration: 25
          },
          {
            name: 'calls onClick when clicked',
            status: 'passed',
            duration: 18
          },
          {
            name: 'is disabled when disabled prop is true',
            status: 'passed',
            duration: 12
          }
        ]
      }
    ]
    
    set(state => ({
      testResults: { suites: mockResults },
      isRunningTests: false,
      testCoverage: { percentage: 95 },
      phaseProgress: {
        ...state.phaseProgress,
        test: 100
      }
    }))
  },
  
  updatePreviewProps: (props) => {
    set({ previewProps: props })
  },
  
  // Get all constructs
  getAllConstructs: () => {
    return get().constructs
  },
  
  // Reload a specific construct
  reloadConstruct: async (constructId) => {
    set({ loading: true })
    
    try {
      // In a real implementation, this would fetch the latest version
      // of the construct from the file system or API
      const constructs = getAllConstructsDisplay()
      const updatedConstruct = constructs.find(c => c.definition.id === constructId)
      
      if (updatedConstruct) {
        set(state => ({
          constructs: state.constructs.map(c => 
            c.definition.id === constructId ? updatedConstruct : c
          ),
          loading: false
        }))
        
        // If this is the selected construct, update it too
        if (get().selectedConstruct?.definition.id === constructId) {
          set({ selectedConstruct: updatedConstruct })
        }
        
        // If this is the current construct in the builder, reload it
        if (get().currentConstruct?.id === constructId) {
          await get().loadConstruct(constructId)
        }
      }
    } catch (error) {
      console.error('Failed to reload construct:', error)
      set({ loading: false })
    }
  }
}))

// Export store instance for direct access
export const constructStore = {
  getAllConstructs: () => useConstructStore.getState().getAllConstructs(),
  reloadConstruct: (constructId: string) => useConstructStore.getState().reloadConstruct(constructId)
}