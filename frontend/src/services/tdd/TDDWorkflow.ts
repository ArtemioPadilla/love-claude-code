/**
 * TDD Workflow Manager
 * Manages the red-green-refactor cycle for test-driven development
 */

// Browser-compatible EventEmitter
class EventEmitter {
  private events: Map<string, ((...args: any[]) => void)[]> = new Map()

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event)
    if (!listeners) return false
    
    listeners.forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
    return true
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const listeners = this.events.get(event)
    if (!listeners) return this
    
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
    return this
  }
}
import { SpecificationParser, ParsedSpecification, specificationParser } from './SpecificationParser'
import { TestGenerator, GeneratedTest, TestGenerationOptions } from './TestGenerator'
import { TestRunner, TestRunOptions, TestSuiteResult } from './TestRunner'
import { ConstructLevel, ConstructType } from '../../constructs/types'

export interface WorkflowState {
  phase: 'red' | 'green' | 'refactor' | 'complete'
  specification: ParsedSpecification
  tests: GeneratedTest[]
  implementation?: string
  testResults?: TestSuiteResult
  coverage?: number
  history: WorkflowHistoryEntry[]
}

export interface WorkflowHistoryEntry {
  timestamp: Date
  phase: WorkflowState['phase']
  action: string
  details: any
  success: boolean
}

export interface WorkflowOptions {
  framework?: 'vitest' | 'jest' | 'playwright'
  constructLevel?: ConstructLevel
  constructType?: ConstructType
  autoAdvance?: boolean
  coverageThreshold?: number
  maxIterations?: number
  enableRefactoring?: boolean
}

export interface WorkflowEvents {
  'phase:change': (oldPhase: WorkflowState['phase'], newPhase: WorkflowState['phase']) => void
  'tests:generated': (tests: GeneratedTest[]) => void
  'tests:running': () => void
  'tests:complete': (results: TestSuiteResult) => void
  'implementation:updated': (code: string) => void
  'workflow:complete': (state: WorkflowState) => void
  'error': (error: Error) => void
}

export class TDDWorkflow extends EventEmitter {
  private state: WorkflowState
  private options: Required<WorkflowOptions>
  private currentIteration = 0
  private workflowId: string
  
  constructor(options: WorkflowOptions = {}) {
    super()
    
    this.options = {
      framework: options.framework || 'vitest',
      constructLevel: options.constructLevel || ConstructLevel.L0,
      constructType: options.constructType || ConstructType.UI,
      autoAdvance: options.autoAdvance ?? true,
      coverageThreshold: options.coverageThreshold ?? 80,
      maxIterations: options.maxIterations ?? 10,
      enableRefactoring: options.enableRefactoring ?? true
    }
    
    this.workflowId = `tdd-workflow-${Date.now()}`
    this.state = this.createInitialState()
  }

  /**
   * Start TDD workflow with a specification
   */
  async startWorkflow(specification: string): Promise<void> {
    try {
      // Parse specification
      const parsed = await specificationParser.parseSpecification(specification)
      this.state.specification = parsed
      
      // Add to history
      this.addHistoryEntry('red', 'Workflow started', { specification })
      
      // Generate initial tests
      await this.generateTests()
      
      // Enter red phase
      await this.enterRedPhase()
      
    } catch (error) {
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Generate tests from specification
   */
  private async generateTests(): Promise<void> {
    const options: TestGenerationOptions = {
      framework: this.options.framework,
      constructLevel: this.options.constructLevel,
      constructType: this.options.constructType,
      generateMocks: true,
      includeEdgeCases: true,
      coverageTarget: this.options.coverageThreshold
    }
    
    const tests = TestGenerator.generateTestSuite(this.state.specification, options)
    this.state.tests = tests
    
    this.emit('tests:generated', tests)
    this.addHistoryEntry('red', 'Tests generated', { count: tests.length })
  }

  /**
   * Enter red phase - run tests expecting failures
   */
  private async enterRedPhase(): Promise<void> {
    this.changePhase('red')
    
    // Run tests
    this.emit('tests:running')
    const results = await this.runTests()
    
    // Check if tests are failing (as expected in red phase)
    if (results.failedTests === 0 && results.totalTests > 0) {
      // Tests are already passing - might be an issue
      this.addHistoryEntry('red', 'Warning: Tests already passing', { results })
      
      if (this.options.autoAdvance) {
        await this.enterRefactorPhase()
      }
    } else {
      // Tests failing as expected
      this.addHistoryEntry('red', 'Tests failing as expected', { 
        failed: results.failedTests,
        total: results.totalTests 
      })
      
      if (this.options.autoAdvance) {
        await this.enterGreenPhase()
      }
    }
  }

  /**
   * Enter green phase - implement code to make tests pass
   */
  async enterGreenPhase(implementation?: string): Promise<void> {
    this.changePhase('green')
    
    if (implementation) {
      this.state.implementation = implementation
      this.emit('implementation:updated', implementation)
      this.addHistoryEntry('green', 'Implementation provided', { linesOfCode: implementation.split('\n').length })
    }
    
    // Run tests with implementation
    this.emit('tests:running')
    const results = await this.runTests()
    
    // Check if tests are passing
    if (results.failedTests === 0 && results.totalTests > 0) {
      // All tests passing!
      this.addHistoryEntry('green', 'All tests passing', { results })
      
      // Check coverage
      if (results.coverage && results.coverage.lines.percentage >= this.options.coverageThreshold) {
        if (this.options.autoAdvance && this.options.enableRefactoring) {
          await this.enterRefactorPhase()
        } else {
          await this.completeWorkflow()
        }
      } else {
        // Need more tests or implementation
        this.addHistoryEntry('green', 'Coverage below threshold', { 
          current: results.coverage?.lines.percentage || 0,
          threshold: this.options.coverageThreshold
        })
        
        if (this.currentIteration < this.options.maxIterations) {
          // Generate additional tests for uncovered code
          await this.generateAdditionalTests()
          await this.enterRedPhase()
        } else {
          await this.completeWorkflow()
        }
      }
    } else {
      // Tests still failing
      this.currentIteration++
      
      if (this.currentIteration < this.options.maxIterations) {
        this.addHistoryEntry('green', 'Tests still failing, iteration ' + this.currentIteration, { 
          failed: results.failedTests 
        })
        // Stay in green phase for another attempt
      } else {
        // Max iterations reached
        this.addHistoryEntry('green', 'Max iterations reached', { iterations: this.currentIteration })
        await this.completeWorkflow()
      }
    }
  }

  /**
   * Enter refactor phase - improve code while keeping tests green
   */
  async enterRefactorPhase(refactoredCode?: string): Promise<void> {
    this.changePhase('refactor')
    
    if (refactoredCode) {
      const previousImplementation = this.state.implementation
      this.state.implementation = refactoredCode
      this.emit('implementation:updated', refactoredCode)
      
      // Run tests to ensure they still pass
      this.emit('tests:running')
      const results = await this.runTests()
      
      if (results.failedTests === 0) {
        // Refactoring successful
        this.addHistoryEntry('refactor', 'Refactoring successful', { 
          linesChanged: this.calculateLinesDiff(previousImplementation || '', refactoredCode)
        })
        await this.completeWorkflow()
      } else {
        // Refactoring broke tests - revert
        this.state.implementation = previousImplementation
        this.emit('implementation:updated', previousImplementation || '')
        this.addHistoryEntry('refactor', 'Refactoring failed - reverted', { failed: results.failedTests })
        
        // Try to complete without refactoring
        await this.completeWorkflow()
      }
    } else {
      // No refactoring provided, complete workflow
      await this.completeWorkflow()
    }
  }

  /**
   * Complete the workflow
   */
  private async completeWorkflow(): Promise<void> {
    this.changePhase('complete')
    
    // Final test run for summary
    const finalResults = await this.runTests()
    
    this.addHistoryEntry('complete', 'Workflow completed', {
      totalTests: finalResults.totalTests,
      passedTests: finalResults.passedTests,
      coverage: finalResults.coverage?.lines.percentage || 0,
      iterations: this.currentIteration
    })
    
    this.emit('workflow:complete', this.state)
  }

  /**
   * Run tests and return results
   */
  private async runTests(): Promise<TestSuiteResult> {
    const runner = new TestRunner()
    
    const options: TestRunOptions = {
      framework: this.options.framework,
      coverage: true,
      parallel: true
    }
    
    const results = await runner.runTests(this.state.tests, options)
    this.state.testResults = results
    this.state.coverage = results.coverage?.lines.percentage
    
    this.emit('tests:complete', results)
    
    return results
  }

  /**
   * Generate additional tests for uncovered code
   */
  private async generateAdditionalTests(): Promise<void> {
    // Analyze coverage to find gaps
    const uncoveredAreas = this.analyzeUncoveredCode()
    
    // Generate tests specifically for uncovered areas
    const additionalSpecs = this.createSpecsForUncoveredAreas(uncoveredAreas)
    
    // Parse and generate tests
    for (const spec of additionalSpecs) {
      const parsed = await specificationParser.parseSpecification(spec)
      const tests = TestGenerator.generateTestSuite(parsed, {
        framework: this.options.framework,
        constructLevel: this.options.constructLevel,
        constructType: this.options.constructType
      })
      
      this.state.tests.push(...tests)
    }
    
    this.emit('tests:generated', this.state.tests)
    this.addHistoryEntry('red', 'Additional tests generated', { count: additionalSpecs.length })
  }

  /**
   * Analyze uncovered code areas
   */
  private analyzeUncoveredCode(): string[] {
    // This would analyze the coverage report to find uncovered lines
    // For now, return mock data
    return ['error handling', 'edge cases', 'async operations']
  }

  /**
   * Create specifications for uncovered areas
   */
  private createSpecsForUncoveredAreas(areas: string[]): string[] {
    return areas.map(area => {
      switch (area) {
        case 'error handling':
          return 'When an error occurs, the component should display an error message'
        case 'edge cases':
          return 'When given invalid input, the component should handle it gracefully'
        case 'async operations':
          return 'When performing async operations, the component should show loading state'
        default:
          return `Test ${area} functionality`
      }
    })
  }

  /**
   * Calculate lines difference between two code strings
   */
  private calculateLinesDiff(oldCode: string, newCode: string): number {
    const oldLines = oldCode.split('\n').length
    const newLines = newCode.split('\n').length
    return Math.abs(newLines - oldLines)
  }

  /**
   * Change workflow phase
   */
  private changePhase(newPhase: WorkflowState['phase']): void {
    const oldPhase = this.state.phase
    this.state.phase = newPhase
    this.emit('phase:change', oldPhase, newPhase)
  }

  /**
   * Add entry to workflow history
   */
  private addHistoryEntry(phase: WorkflowState['phase'], action: string, details: any): void {
    this.state.history.push({
      timestamp: new Date(),
      phase,
      action,
      details,
      success: true
    })
  }

  /**
   * Create initial workflow state
   */
  private createInitialState(): WorkflowState {
    return {
      phase: 'red',
      specification: {
        type: 'construct',
        name: '',
        description: '',
        requirements: [],
        behaviors: [],
        testCases: [],
        metadata: {
          aiGenerated: false,
          createdAt: new Date(),
          tags: []
        }
      },
      tests: [],
      history: []
    }
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState {
    return { ...this.state }
  }

  /**
   * Get workflow history
   */
  getHistory(): WorkflowHistoryEntry[] {
    return [...this.state.history]
  }

  /**
   * Save workflow checkpoint
   */
  async saveCheckpoint(): Promise<string> {
    const checkpoint = {
      workflowId: this.workflowId,
      timestamp: new Date(),
      state: this.state,
      options: this.options
    }
    
    // In a real implementation, this would save to storage
    const checkpointId = `checkpoint-${Date.now()}`
    localStorage.setItem(checkpointId, JSON.stringify(checkpoint))
    
    return checkpointId
  }

  /**
   * Restore from checkpoint
   */
  async restoreCheckpoint(checkpointId: string): Promise<void> {
    const saved = localStorage.getItem(checkpointId)
    if (!saved) {
      throw new Error('Checkpoint not found')
    }
    
    const checkpoint = JSON.parse(saved)
    this.state = checkpoint.state
    this.options = checkpoint.options
    this.workflowId = checkpoint.workflowId
    
    this.emit('phase:change', 'red', this.state.phase)
  }
}

// Export singleton instance for convenience
export const tddWorkflow = new TDDWorkflow()