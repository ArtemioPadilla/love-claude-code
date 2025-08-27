/**
 * TDD Guard L1 Infrastructure Construct
 * 
 * Integrates TDD Guard for enforcing test-driven development practices.
 * Monitors file changes and ensures TDD principles are followed.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel,
  ValidationResult,
  DeploymentResult
} from '../../types'
import { Button } from '../../../components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/UI/Card'
import { Alert, AlertDescription } from '../../../components/UI/Alert'
import { Toggle } from '../../../components/UI/Toggle'

// Type definitions
export interface TDDGuardConfig {
  /** Enable TDD enforcement */
  enabled: boolean
  /** File patterns to monitor */
  watchPatterns: string[]
  /** File patterns to exclude */
  excludePatterns: string[]
  /** Test framework */
  testFramework: 'vitest' | 'jest' | 'pytest'
  /** Strictness level */
  strictness: 'low' | 'medium' | 'high'
  /** Allow refactoring phase */
  allowRefactoring: boolean
  /** Custom validation rules */
  customRules?: TDDValidationRule[]
  /** Hook integration */
  hookConfig?: {
    type: 'PreToolUse' | 'PostToolUse'
    matcher: string
  }
}

export interface TDDValidationRule {
  name: string
  description: string
  validate: (change: FileChange) => boolean
  severity: 'error' | 'warning'
}

export interface FileChange {
  path: string
  type: 'create' | 'modify' | 'delete'
  content?: string
  diff?: string
}

export interface TDDGuardProps {
  config: TDDGuardConfig
  onViolation?: (violation: TDDViolation) => void
  onStatusChange?: (status: TDDStatus) => void
  showDashboard?: boolean
}

export interface TDDViolation {
  file: string
  rule: string
  message: string
  severity: 'error' | 'warning'
  timestamp: Date
}

export interface TDDStatus {
  phase: 'red' | 'green' | 'refactor'
  testsWritten: number
  testsPassing: number
  testsFailing: number
  violations: number
  enforcement: boolean
}

/**
 * TDD Guard Component
 */
export const TDDGuard: React.FC<TDDGuardProps> = ({
  config,
  onViolation,
  onStatusChange,
  showDashboard = true
}) => {
  const [status, setStatus] = useState<TDDStatus>({
    phase: 'red',
    testsWritten: 0,
    testsPassing: 0,
    testsFailing: 0,
    violations: 0,
    enforcement: config.enabled
  })
  
  const [violations, setViolations] = useState<TDDViolation[]>([])
  const [recentChanges, setRecentChanges] = useState<FileChange[]>([])
  const guardProcessRef = useRef<any>(null)

  // Toggle enforcement
  const toggleEnforcement = useCallback(() => {
    const newEnforcement = !status.enforcement
    setStatus(prev => ({ ...prev, enforcement: newEnforcement }))
    
    if (newEnforcement) {
      startGuard()
    } else {
      stopGuard()
    }
  }, [status.enforcement])

  // Start TDD Guard
  const startGuard = useCallback(() => {
    // In a real implementation, this would start the TDD Guard process
    console.log('Starting TDD Guard with config:', config)
    
    // Simulate guard process
    guardProcessRef.current = {
      pid: Date.now(),
      status: 'running'
    }
  }, [config])

  // Stop TDD Guard
  const stopGuard = useCallback(() => {
    if (guardProcessRef.current) {
      console.log('Stopping TDD Guard')
      guardProcessRef.current = null
    }
  }, [])

  // Validate file change
  const validateChange = useCallback((change: FileChange): TDDViolation | null => {
    // Check if file matches watch patterns
    const shouldWatch = config.watchPatterns.some(pattern => 
      new RegExp(pattern).test(change.path)
    )
    
    const shouldExclude = config.excludePatterns.some(pattern =>
      new RegExp(pattern).test(change.path)
    )
    
    if (!shouldWatch || shouldExclude) {
      return null
    }

    // Apply TDD validation rules
    if (status.phase === 'red' && !change.path.includes('.test.') && !change.path.includes('_test.')) {
      // In red phase, only test files should be modified
      return {
        file: change.path,
        rule: 'red-phase',
        message: 'Write a failing test first (Red phase)',
        severity: 'error',
        timestamp: new Date()
      }
    }

    if (status.phase === 'green' && change.path.includes('.test.')) {
      // In green phase, implementation files should be modified
      return {
        file: change.path,
        rule: 'green-phase',
        message: 'Implement code to make tests pass (Green phase)',
        severity: 'warning',
        timestamp: new Date()
      }
    }

    // Apply custom rules
    if (config.customRules) {
      for (const rule of config.customRules) {
        if (!rule.validate(change)) {
          return {
            file: change.path,
            rule: rule.name,
            message: rule.description,
            severity: rule.severity,
            timestamp: new Date()
          }
        }
      }
    }

    return null
  }, [config, status.phase])

  // Handle file change
  const handleFileChange = useCallback((change: FileChange) => {
    setRecentChanges(prev => [...prev.slice(-9), change])
    
    if (status.enforcement) {
      const violation = validateChange(change)
      if (violation) {
        setViolations(prev => [...prev, violation])
        setStatus(prev => ({ ...prev, violations: prev.violations + 1 }))
        onViolation?.(violation)
      }
    }
  }, [status.enforcement, validateChange, onViolation])

  // Update TDD phase based on test results
  const updatePhase = useCallback((testResults: any) => {
    const { passed, failed, total } = testResults
    
    let newPhase: TDDStatus['phase'] = status.phase
    
    if (failed > 0) {
      newPhase = 'red'
    } else if (passed === total && total > status.testsWritten) {
      newPhase = 'green'
    } else if (passed === total && config.allowRefactoring) {
      newPhase = 'refactor'
    }
    
    setStatus(prev => ({
      ...prev,
      phase: newPhase,
      testsWritten: total,
      testsPassing: passed,
      testsFailing: failed
    }))
    
    onStatusChange?.(status)
  }, [status, config.allowRefactoring, onStatusChange])

  // Initialize on mount
  useEffect(() => {
    if (config.enabled) {
      startGuard()
    }
    
    return () => {
      stopGuard()
    }
  }, [config.enabled, startGuard, stopGuard])

  if (!showDashboard) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>TDD Guard</span>
          <Toggle
            checked={status.enforcement}
            onCheckedChange={toggleEnforcement}
            aria-label="Toggle TDD enforcement"
          />
        </CardTitle>
        <CardDescription>
          Enforcing test-driven development practices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* TDD Phase Indicator */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Current Phase</h4>
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.phase === 'red' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              Red
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.phase === 'green' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              Green
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.phase === 'refactor' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              Refactor
            </div>
          </div>
        </div>

        {/* Test Status */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">{status.testsWritten}</div>
            <div className="text-sm text-gray-600">Tests Written</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{status.testsPassing}</div>
            <div className="text-sm text-gray-600">Passing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{status.testsFailing}</div>
            <div className="text-sm text-gray-600">Failing</div>
          </div>
        </div>

        {/* Recent Violations */}
        {violations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Recent Violations</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {violations.slice(-5).map((violation, idx) => (
                <Alert key={idx} variant={violation.severity === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>
                    <strong>{violation.file}</strong>: {violation.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="text-sm text-gray-600">
          <p>Framework: {config.testFramework}</p>
          <p>Strictness: {config.strictness}</p>
          <p>Violations: {status.violations}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Static construct class for registration
export class TDDGuardConstruct extends L1InfrastructureConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l1-tdd-guard',
    name: 'TDD Guard',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L1,
    description: 'Enforces test-driven development practices through file monitoring',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: [
      'tdd-enforcement',
      'file-monitoring',
      'test-validation',
      'phase-tracking',
      'violation-reporting'
    ],
    dependencies: [],
    inputs: [
      {
        name: 'config',
        type: 'TDDGuardConfig',
        description: 'TDD Guard configuration',
        required: true,
        validation: {
          required: ['enabled', 'watchPatterns', 'testFramework']
        }
      }
    ],
    outputs: [
      {
        name: 'status',
        type: 'TDDStatus',
        description: 'Current TDD status'
      },
      {
        name: 'violations',
        type: 'TDDViolation[]',
        description: 'List of TDD violations'
      }
    ],
    security: [
      'file-system-monitoring',
      'process-management'
    ],
    selfReferential: {
      usedToBuildItself: true,
      vibecodingLevel: 95, // Highly vibe-coded for safer AI development
      dependencies: [
        'File monitoring for TDD enforcement',
        'Test framework integration',
        'Claude Code hook integration'
      ]
    }
  }

  component = TDDGuard

  async onInitialize(config: TDDGuardConfig): Promise<void> {
    console.log('Initializing TDD Guard with config:', config)
    
    // Validate configuration
    if (!config.watchPatterns || config.watchPatterns.length === 0) {
      throw new Error('Watch patterns are required')
    }

    // Set up file monitoring
    if (config.enabled) {
      console.log('TDD enforcement enabled')
    }
  }

  async onValidate(): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if TDD Guard CLI is installed
    try {
      const { execSync } = await import('child_process')
      execSync('which tdd-guard', { stdio: 'ignore' })
    } catch {
      errors.push('TDD Guard CLI is not installed. Run: npm install -g tdd-guard')
    }

    // Check hook configuration
    const config = this.inputs.config as TDDGuardConfig
    if (config.enabled && !config.hookConfig) {
      warnings.push('Hook configuration not specified. TDD Guard may not intercept file changes.')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async onDeploy(): Promise<DeploymentResult> {
    console.log('Deploying TDD Guard...')

    try {
      const config = this.inputs.config as TDDGuardConfig
      
      // Configure Claude Code hook if specified
      if (config.hookConfig) {
        console.log('Configuring Claude Code hook:', config.hookConfig)
        // This would integrate with Claude Code's hook system
      }

      return {
        success: true,
        message: 'TDD Guard deployed successfully',
        deploymentId: `tdd-guard-${Date.now()}`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
        timestamp: new Date()
      }
    }
  }

  async onDestroy(): Promise<void> {
    console.log('Destroying TDD Guard...')
    // Stop monitoring processes
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    return {
      status: 'healthy',
      details: {
        timestamp: new Date(),
        enforcement: true,
        violations: 0
      }
    }
  }

  async getMetrics(): Promise<Record<string, number>> {
    return {
      totalViolations: 0,
      filesMonitored: 0,
      testsEnforced: 0,
      phaseChanges: 0
    }
  }
}

// Export the construct for registration
export const tddGuard = new TDDGuardConstruct(TDDGuardConstruct.metadata)