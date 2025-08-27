/**
 * TDD Workflow with Guard Integration
 * Enhanced TDD workflow panel that integrates TDD Guard enforcement
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TestTube,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Code2,
  AlertCircle,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Activity
} from 'lucide-react'
import { TDDWorkflow, WorkflowState } from '../../services/tdd/TDDWorkflow'
import { TDDGuardIntegration, IntegrationStatus } from '../../services/tdd/TDDGuardIntegration'
import { TDDViolation } from '../../constructs/L1/infrastructure/TDDGuardConstruct'
import { Button } from '../UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../UI/Card'
import { Alert, AlertDescription } from '../UI/Alert'
import { Toggle } from '../UI/Toggle'
import Editor from '@monaco-editor/react'

interface TDDWorkflowWithGuardProps {
  className?: string
  onClose?: () => void
  enableGuard?: boolean
}

export const TDDWorkflowWithGuard: React.FC<TDDWorkflowWithGuardProps> = ({ 
  className = '', 
  onClose,
  enableGuard = true 
}) => {
  const [workflow] = useState(() => new TDDWorkflow())
  const [guardIntegration] = useState(() => new TDDGuardIntegration({
    enableEnforcement: enableGuard,
    syncWithWorkflow: true,
    violationHandler: (violation) => {
      setViolations(prev => [...prev, violation])
    }
  }))
  
  const [state, setState] = useState<WorkflowState>(workflow.getState())
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>(guardIntegration.getStatus())
  const [specification, setSpecification] = useState('')
  const [implementation, setImplementation] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [violations, setViolations] = useState<TDDViolation[]>([])
  const [showViolations, setShowViolations] = useState(true)
  const [guardEnabled, setGuardEnabled] = useState(enableGuard)

  useEffect(() => {
    // Connect guard to workflow
    guardIntegration.connectWorkflow(workflow)
    
    // Subscribe to workflow events
    const workflowHandlers = {
      'phase:change': () => setState(workflow.getState()),
      'tests:generated': () => setState(workflow.getState()),
      'tests:complete': () => {
        setState(workflow.getState())
        setIsRunning(false)
      },
      'implementation:updated': (code: string) => setImplementation(code),
      'workflow:complete': () => {
        setState(workflow.getState())
        setIsRunning(false)
      },
      'error': (error: Error) => {
        console.error('Workflow error:', error)
        setIsRunning(false)
      }
    }

    // Subscribe to guard events
    const guardHandlers = {
      'phase:synchronized': () => setIntegrationStatus(guardIntegration.getStatus()),
      'violation': (violation: TDDViolation) => {
        setViolations(prev => [...prev, violation])
        setShowViolations(true)
      },
      'enforcement:enabled': () => setGuardEnabled(true),
      'enforcement:disabled': () => setGuardEnabled(false)
    }

    // Register event handlers
    Object.entries(workflowHandlers).forEach(([event, handler]) => {
      workflow.on(event, handler as any)
    })
    
    Object.entries(guardHandlers).forEach(([event, handler]) => {
      guardIntegration.on(event, handler as any)
    })

    return () => {
      Object.entries(workflowHandlers).forEach(([event, handler]) => {
        workflow.off(event, handler as any)
      })
      
      Object.entries(guardHandlers).forEach(([event, handler]) => {
        guardIntegration.off(event, handler as any)
      })
    }
  }, [workflow, guardIntegration])

  const toggleGuard = useCallback(() => {
    if (guardEnabled) {
      guardIntegration.disableEnforcement()
    } else {
      guardIntegration.enableEnforcement()
    }
    setGuardEnabled(!guardEnabled)
  }, [guardEnabled, guardIntegration])

  const clearViolations = useCallback(() => {
    setViolations([])
    guardIntegration.clearViolations()
  }, [guardIntegration])

  const startWorkflow = async () => {
    if (!specification.trim()) return
    
    setIsRunning(true)
    clearViolations()
    try {
      await workflow.startWorkflow(specification)
    } catch (error) {
      console.error('Failed to start workflow:', error)
      setIsRunning(false)
    }
  }

  const submitImplementation = async () => {
    if (!implementation.trim()) return
    
    // Validate with TDD Guard
    const fileChange = {
      path: 'implementation.ts',
      type: 'modify' as const,
      content: implementation
    }
    
    const violation = guardIntegration.validateFileChange(fileChange)
    if (violation && guardEnabled) {
      setViolations(prev => [...prev, violation])
      setShowViolations(true)
      return
    }
    
    setIsRunning(true)
    try {
      await workflow.enterGreenPhase(implementation)
    } catch (error) {
      console.error('Failed to submit implementation:', error)
      setIsRunning(false)
    }
  }

  const getPhaseIcon = (phase: WorkflowState['phase']) => {
    switch (phase) {
      case 'red':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'refactor':
        return <RefreshCw className="w-5 h-5 text-blue-500" />
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-purple-500" />
    }
  }

  const getPhaseDescription = (phase: WorkflowState['phase']) => {
    switch (phase) {
      case 'red':
        return 'Write a failing test that describes the desired behavior'
      case 'green':
        return 'Write minimal code to make the test pass'
      case 'refactor':
        return 'Improve code quality while keeping tests green'
      case 'complete':
        return 'Workflow completed successfully!'
    }
  }

  return (
    <div className={`tdd-workflow-guard flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            TDD Workflow
          </h2>
          
          {/* TDD Guard Status */}
          <div className="flex items-center gap-2">
            {guardEnabled ? (
              <ShieldCheck className="w-5 h-5 text-green-500" />
            ) : (
              <Shield className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              TDD Guard {guardEnabled ? 'Active' : 'Inactive'}
            </span>
            <Toggle
              checked={guardEnabled}
              onCheckedChange={toggleGuard}
              aria-label="Toggle TDD Guard"
            />
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Workflow */}
        <div className="flex-1 flex flex-col">
          {/* Phase Indicator */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getPhaseIcon(state.phase)}
                <span className="font-medium capitalize">{state.phase} Phase</span>
              </div>
              
              {/* Test Metrics */}
              {state.tests.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Tests: {state.tests.length}
                  </span>
                  {state.testResults && (
                    <>
                      <span className="text-green-600">
                        Passing: {state.testResults.passedTests || 0}
                      </span>
                      <span className="text-red-600">
                        Failing: {state.testResults.failedTests || 0}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {getPhaseDescription(state.phase)}
            </p>
          </div>

          {/* Editor Area */}
          <div className="flex-1 p-4 overflow-auto">
            {state.phase === 'red' && !state.tests.length && (
              <div>
                <h3 className="font-medium mb-2">Write Specification</h3>
                <textarea
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={startWorkflow}
                  disabled={!specification.trim() || isRunning}
                  className="mt-2"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Tests...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Workflow
                    </>
                  )}
                </Button>
              </div>
            )}

            {state.tests.length > 0 && (
              <div className="space-y-4">
                {/* Generated Tests */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Generated Tests
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="200px"
                      language="typescript"
                      value={state.tests.map(t => t.content).join('\n\n')}
                      theme="vs-light"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false
                      }}
                    />
                  </div>
                </div>

                {/* Implementation Editor */}
                {(state.phase === 'green' || state.phase === 'refactor') && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      Implementation
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Editor
                        height="300px"
                        language="typescript"
                        value={implementation}
                        onChange={(value) => setImplementation(value || '')}
                        theme="vs-light"
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false
                        }}
                      />
                    </div>
                    <Button
                      onClick={submitImplementation}
                      disabled={!implementation.trim() || isRunning}
                      className="mt-2"
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Submit Implementation
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - TDD Guard */}
        {guardEnabled && (
          <div className="w-80 border-l flex flex-col bg-gray-50">
            <div className="p-4 border-b bg-white">
              <h3 className="font-medium flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                TDD Guard Monitor
              </h3>
            </div>

            {/* Guard Status */}
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Enforcement Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Phase Sync: {integrationStatus.synchronized ? 'Active' : 'Inactive'}
                    </span>
                    <Activity className={`w-4 h-4 ${integrationStatus.synchronized ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">Violations: {violations.length}</span>
                    {violations.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearViolations}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Violations */}
              {violations.length > 0 && showViolations && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    TDD Violations
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {violations.slice(-5).reverse().map((violation, idx) => (
                      <Alert 
                        key={idx} 
                        variant={violation.severity === 'error' ? 'destructive' : 'default'}
                      >
                        <AlertDescription className="text-xs">
                          <div className="font-medium">{violation.rule}</div>
                          <div>{violation.message}</div>
                          <div className="text-gray-500 mt-1">
                            {new Date(violation.timestamp).toLocaleTimeString()}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Guard Tips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Current Phase Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-1">
                    {state.phase === 'red' && (
                      <>
                        <p>• Focus on writing failing tests</p>
                        <p>• Don't implement code yet</p>
                        <p>• Tests should describe behavior</p>
                      </>
                    )}
                    {state.phase === 'green' && (
                      <>
                        <p>• Write minimal code to pass</p>
                        <p>• Don't over-engineer</p>
                        <p>• All tests should be green</p>
                      </>
                    )}
                    {state.phase === 'refactor' && (
                      <>
                        <p>• Improve code structure</p>
                        <p>• Keep tests passing</p>
                        <p>• Remove duplication</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}