/**
 * TDD Guard Integration Service
 * 
 * Integrates TDD Guard with the existing TDD workflow infrastructure,
 * ensuring safe vibe-coding practices through automated enforcement.
 */

import { TDDWorkflow, WorkflowState, WorkflowEvents } from './TDDWorkflow'
import { TDDGuardConfig, TDDStatus, TDDViolation, FileChange } from '../../constructs/L1/infrastructure/TDDGuardConstruct'
import { EventEmitter } from 'events'

export interface TDDGuardIntegrationConfig {
  /** Enable TDD Guard enforcement */
  enableEnforcement: boolean
  /** Sync with TDD workflow phases */
  syncWithWorkflow: boolean
  /** Custom validation rules */
  customRules?: Array<{
    name: string
    validate: (change: FileChange, workflowState: WorkflowState) => boolean
    message: string
  }>
  /** Violation handling */
  violationHandler?: (violation: TDDViolation) => void
  /** Phase transition hooks */
  phaseHooks?: {
    onRedPhase?: () => void
    onGreenPhase?: () => void
    onRefactorPhase?: () => void
  }
}

export interface IntegrationStatus {
  workflowPhase: WorkflowState['phase']
  guardPhase: TDDStatus['phase']
  synchronized: boolean
  enforcementActive: boolean
  violations: TDDViolation[]
}

/**
 * TDD Guard Integration Service
 * 
 * Bridges TDD Guard with the existing TDD workflow system
 */
export class TDDGuardIntegration extends EventEmitter {
  private workflow: TDDWorkflow | null = null
  private guardStatus: TDDStatus = {
    phase: 'red',
    testsWritten: 0,
    testsPassing: 0,
    testsFailing: 0,
    violations: 0,
    enforcement: false
  }
  
  private config: TDDGuardIntegrationConfig
  private violations: TDDViolation[] = []
  private fileWatchers: Map<string, any> = new Map()
  
  constructor(config: TDDGuardIntegrationConfig) {
    super()
    this.config = config
  }
  
  /**
   * Connect to a TDD workflow instance
   */
  connectWorkflow(workflow: TDDWorkflow): void {
    this.workflow = workflow
    
    if (this.config.syncWithWorkflow) {
      this.setupWorkflowSync()
    }
    
    this.guardStatus.enforcement = this.config.enableEnforcement
    this.emit('connected', { workflow })
  }
  
  /**
   * Setup workflow synchronization
   */
  private setupWorkflowSync(): void {
    if (!this.workflow) return
    
    // Listen to phase changes
    this.workflow.on('phase:change', (oldPhase, newPhase) => {
      this.handlePhaseChange(oldPhase, newPhase)
    })
    
    // Listen to test results
    this.workflow.on('tests:complete', (results) => {
      this.updateTestMetrics(results)
    })
    
    // Listen to implementation updates
    this.workflow.on('implementation:updated', (code) => {
      this.validateImplementation(code)
    })
  }
  
  /**
   * Handle workflow phase changes
   */
  private handlePhaseChange(oldPhase: WorkflowState['phase'], newPhase: WorkflowState['phase']): void {
    // Map workflow phases to TDD Guard phases
    const phaseMap: Record<WorkflowState['phase'], TDDStatus['phase']> = {
      'red': 'red',
      'green': 'green',
      'refactor': 'refactor',
      'complete': 'green' // Complete maps to green
    }
    
    const guardPhase = phaseMap[newPhase]
    this.guardStatus.phase = guardPhase
    
    // Execute phase hooks
    if (newPhase === 'red' && this.config.phaseHooks?.onRedPhase) {
      this.config.phaseHooks.onRedPhase()
    } else if (newPhase === 'green' && this.config.phaseHooks?.onGreenPhase) {
      this.config.phaseHooks.onGreenPhase()
    } else if (newPhase === 'refactor' && this.config.phaseHooks?.onRefactorPhase) {
      this.config.phaseHooks.onRefactorPhase()
    }
    
    this.emit('phase:synchronized', { workflowPhase: newPhase, guardPhase })
  }
  
  /**
   * Update test metrics from workflow results
   */
  private updateTestMetrics(results: any): void {
    this.guardStatus.testsWritten = results.total || 0
    this.guardStatus.testsPassing = results.passed || 0
    this.guardStatus.testsFailing = results.failed || 0
    
    this.emit('metrics:updated', this.guardStatus)
  }
  
  /**
   * Validate implementation against TDD rules
   */
  private validateImplementation(code: string): void {
    if (!this.guardStatus.enforcement) return
    
    // Check if we're in the right phase for implementation
    if (this.guardStatus.phase === 'red' && this.guardStatus.testsFailing === 0) {
      const violation: TDDViolation = {
        file: 'implementation',
        rule: 'premature-implementation',
        message: 'Write a failing test before implementing',
        severity: 'error',
        timestamp: new Date()
      }
      this.handleViolation(violation)
    }
  }
  
  /**
   * Validate file change against TDD rules
   */
  validateFileChange(change: FileChange): TDDViolation | null {
    if (!this.guardStatus.enforcement) return null
    
    // Basic TDD phase validation
    if (this.guardStatus.phase === 'red') {
      if (!this.isTestFile(change.path) && change.type !== 'delete') {
        return {
          file: change.path,
          rule: 'red-phase-violation',
          message: 'Only test files should be modified in the Red phase',
          severity: 'error',
          timestamp: new Date()
        }
      }
    }
    
    if (this.guardStatus.phase === 'green') {
      if (this.isTestFile(change.path) && this.guardStatus.testsFailing === 0) {
        return {
          file: change.path,
          rule: 'green-phase-violation',
          message: 'Tests are already passing, implement code to make failing tests pass',
          severity: 'warning',
          timestamp: new Date()
        }
      }
    }
    
    // Apply custom rules
    if (this.config.customRules && this.workflow) {
      const workflowState = (this.workflow as any).getState() // Assuming getState method exists
      
      for (const rule of this.config.customRules) {
        if (!rule.validate(change, workflowState)) {
          return {
            file: change.path,
            rule: rule.name,
            message: rule.message,
            severity: 'error',
            timestamp: new Date()
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * Handle TDD violation
   */
  private handleViolation(violation: TDDViolation): void {
    this.violations.push(violation)
    this.guardStatus.violations++
    
    if (this.config.violationHandler) {
      this.config.violationHandler(violation)
    }
    
    this.emit('violation', violation)
  }
  
  /**
   * Check if file is a test file
   */
  private isTestFile(path: string): boolean {
    return path.includes('.test.') || 
           path.includes('.spec.') || 
           path.includes('_test.') ||
           path.includes('__tests__/') ||
           path.includes('/test/')
  }
  
  /**
   * Enable TDD enforcement
   */
  enableEnforcement(): void {
    this.guardStatus.enforcement = true
    this.emit('enforcement:enabled')
  }
  
  /**
   * Disable TDD enforcement
   */
  disableEnforcement(): void {
    this.guardStatus.enforcement = false
    this.emit('enforcement:disabled')
  }
  
  /**
   * Get current integration status
   */
  getStatus(): IntegrationStatus {
    return {
      workflowPhase: this.workflow ? (this.workflow as any).getState().phase : 'red',
      guardPhase: this.guardStatus.phase,
      synchronized: this.config.syncWithWorkflow,
      enforcementActive: this.guardStatus.enforcement,
      violations: [...this.violations]
    }
  }
  
  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = []
    this.guardStatus.violations = 0
    this.emit('violations:cleared')
  }
  
  /**
   * Get TDD Guard configuration
   */
  getTDDGuardConfig(): TDDGuardConfig {
    return {
      enabled: this.guardStatus.enforcement,
      watchPatterns: ['src/**/*.ts', 'src/**/*.tsx', 'tests/**/*.ts'],
      excludePatterns: ['node_modules/**', 'dist/**', 'coverage/**'],
      testFramework: 'vitest',
      strictness: 'medium',
      allowRefactoring: true,
      hookConfig: {
        type: 'PreToolUse',
        matcher: 'Write|Edit|MultiEdit'
      }
    }
  }
  
  /**
   * Configure Claude Code hook
   */
  async configureHook(): Promise<void> {
    // This would integrate with Claude Code's hook system
    // For now, we'll emit an event indicating the hook should be configured
    this.emit('hook:configure', {
      type: 'PreToolUse',
      matcher: 'Write|Edit|MultiEdit|TodoWrite',
      command: 'tdd-guard',
      config: this.getTDDGuardConfig()
    })
  }
  
  /**
   * Generate TDD Guard report
   */
  generateReport(): {
    summary: string
    violations: TDDViolation[]
    metrics: TDDStatus
    recommendations: string[]
  } {
    const violationsByPhase = this.violations.reduce((acc, v) => {
      const phase = v.rule.includes('red') ? 'red' : 
                    v.rule.includes('green') ? 'green' : 'refactor'
      acc[phase] = (acc[phase] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const recommendations: string[] = []
    
    if (violationsByPhase.red > 5) {
      recommendations.push('Consider writing more comprehensive tests before implementation')
    }
    
    if (violationsByPhase.green > 3) {
      recommendations.push('Focus on minimal implementation to make tests pass')
    }
    
    if (this.guardStatus.testsFailing > this.guardStatus.testsPassing) {
      recommendations.push('Prioritize fixing failing tests before adding new features')
    }
    
    return {
      summary: `TDD Guard Report: ${this.violations.length} violations detected across ${Object.keys(violationsByPhase).length} phases`,
      violations: this.violations,
      metrics: this.guardStatus,
      recommendations
    }
  }
}

// Export singleton instance
export const tddGuardIntegration = new TDDGuardIntegration({
  enableEnforcement: true,
  syncWithWorkflow: true,
  phaseHooks: {
    onRedPhase: () => console.log('🔴 Entering Red Phase: Write failing tests'),
    onGreenPhase: () => console.log('🟢 Entering Green Phase: Make tests pass'),
    onRefactorPhase: () => console.log('🔵 Entering Refactor Phase: Improve code quality')
  }
})