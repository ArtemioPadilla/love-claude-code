/**
 * TDD Workflow Panel Component
 * Interactive panel for managing the red-green-refactor cycle
 */

import React, { useState, useEffect } from 'react'
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
  Save,
  History
} from 'lucide-react'
import { TDDWorkflow, WorkflowState } from '../../services/tdd/TDDWorkflow'
import { GeneratedTest } from '../../services/tdd/TestGenerator'
import { TestSuiteResult } from '../../services/tdd/TestRunner'
import Editor from '@monaco-editor/react'

interface TDDWorkflowPanelProps {
  className?: string
  onClose?: () => void
}

export const TDDWorkflowPanel: React.FC<TDDWorkflowPanelProps> = ({ className = '', onClose }) => {
  const [workflow] = useState(() => new TDDWorkflow())
  const [state, setState] = useState<WorkflowState>(workflow.getState())
  const [specification, setSpecification] = useState('')
  const [implementation, setImplementation] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // Subscribe to workflow events
    const handlers = {
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

    Object.entries(handlers).forEach(([event, handler]) => {
      workflow.on(event, handler as any)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        workflow.off(event, handler as any)
      })
    }
  }, [workflow])

  const startWorkflow = async () => {
    if (!specification.trim()) return
    
    setIsRunning(true)
    try {
      await workflow.startWorkflow(specification)
    } catch (error) {
      console.error('Failed to start workflow:', error)
      setIsRunning(false)
    }
  }

  const submitImplementation = async () => {
    if (!implementation.trim()) return
    
    setIsRunning(true)
    try {
      await workflow.enterGreenPhase(implementation)
    } catch (error) {
      console.error('Failed to submit implementation:', error)
      setIsRunning(false)
    }
  }

  const submitRefactoring = async () => {
    if (!implementation.trim()) return
    
    setIsRunning(true)
    try {
      await workflow.enterRefactorPhase(implementation)
    } catch (error) {
      console.error('Failed to submit refactoring:', error)
      setIsRunning(false)
    }
  }

  const saveCheckpoint = async () => {
    try {
      const checkpointId = await workflow.saveCheckpoint()
      console.log('Checkpoint saved:', checkpointId)
    } catch (error) {
      console.error('Failed to save checkpoint:', error)
    }
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <TestTube className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold">TDD Workflow</h2>
          <PhaseIndicator phase={state.phase} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={saveCheckpoint}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Save checkpoint"
          >
            <Save className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[600px]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {state.phase === 'red' && !state.tests.length ? (
            <SpecificationInput
              value={specification}
              onChange={setSpecification}
              onSubmit={startWorkflow}
              isRunning={isRunning}
            />
          ) : (
            <PhaseContent
              state={state}
              implementation={implementation}
              onImplementationChange={setImplementation}
              onSubmitImplementation={submitImplementation}
              onSubmitRefactoring={submitRefactoring}
              isRunning={isRunning}
            />
          )}
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 300 }}
              exit={{ width: 0 }}
              className="border-l border-gray-800 overflow-hidden"
            >
              <HistoryPanel history={state.history} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Phase Indicator Component
 */
const PhaseIndicator: React.FC<{ phase: WorkflowState['phase'] }> = ({ phase }) => {
  const phases = ['red', 'green', 'refactor', 'complete'] as const
  const phaseColors = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    refactor: 'bg-blue-500',
    complete: 'bg-purple-500'
  }

  return (
    <div className="flex items-center gap-2">
      {phases.map((p, index) => (
        <React.Fragment key={p}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              p === phase
                ? `${phaseColors[p]} text-white scale-110`
                : phase === 'complete' || phases.indexOf(phase) > index
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            {p[0].toUpperCase()}
          </div>
          {index < phases.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * Specification Input Component
 */
const SpecificationInput: React.FC<{
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isRunning: boolean
}> = ({ value, onChange, onSubmit, isRunning }) => {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Write Specification
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Describe what you want to build in natural language. Be specific about behaviors and requirements.
        </p>
      </div>

      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Create a Button component that:
- Renders with provided text
- Handles click events
- Can be disabled
- Shows loading state

Given a button with text "Submit"
When the user clicks the button
Then the onClick handler should be called`}
          className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:outline-none focus:border-blue-500"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!value.trim() || isRunning}
        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isRunning ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Generating Tests...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Start TDD Workflow
          </>
        )}
      </button>
    </div>
  )
}

/**
 * Phase Content Component
 */
const PhaseContent: React.FC<{
  state: WorkflowState
  implementation: string
  onImplementationChange: (value: string) => void
  onSubmitImplementation: () => void
  onSubmitRefactoring: () => void
  isRunning: boolean
}> = ({
  state,
  implementation,
  onImplementationChange,
  onSubmitImplementation,
  onSubmitRefactoring,
  isRunning
}) => {
  return (
    <div className="flex-1 flex">
      {/* Tests Panel */}
      <div className="w-1/2 border-r border-gray-800 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Tests
        </h3>
        <TestList tests={state.tests} results={state.testResults} />
      </div>

      {/* Implementation Panel */}
      <div className="w-1/2 p-4 flex flex-col">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          Implementation
        </h3>
        
        {state.phase === 'complete' ? (
          <CompleteView state={state} />
        ) : (
          <>
            <div className="flex-1 mb-4">
              <Editor
                value={implementation}
                onChange={(value) => onImplementationChange(value || '')}
                height="400px"
                defaultLanguage="typescript"
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2
                }}
              />
            </div>
            
            {state.phase === 'green' && (
              <button
                onClick={onSubmitImplementation}
                disabled={!implementation.trim() || isRunning}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Tests
                  </>
                )}
              </button>
            )}
            
            {state.phase === 'refactor' && (
              <button
                onClick={onSubmitRefactoring}
                disabled={!implementation.trim() || isRunning}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verifying Refactoring...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Apply Refactoring
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Test List Component
 */
const TestList: React.FC<{
  tests: GeneratedTest[]
  results?: TestSuiteResult
}> = ({ tests, results }) => {
  return (
    <div className="space-y-2">
      {tests.map((test, index) => {
        const result = results?.results.find(r => r.testId === test.fileName)
        
        return (
          <div
            key={index}
            className="p-3 bg-gray-800 rounded-lg border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{test.fileName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {test.testType} • {test.framework}
                </p>
              </div>
              {result && (
                <TestStatus status={result.status} duration={result.duration} />
              )}
            </div>
          </div>
        )
      })}
      
      {results && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <TestSummary results={results} />
        </div>
      )}
    </div>
  )
}

/**
 * Test Status Component
 */
const TestStatus: React.FC<{
  status: 'pass' | 'fail' | 'skip' | 'pending'
  duration?: number
}> = ({ status, duration }) => {
  const icons = {
    pass: <CheckCircle className="w-5 h-5 text-green-500" />,
    fail: <XCircle className="w-5 h-5 text-red-500" />,
    skip: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    pending: <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
  }

  return (
    <div className="flex items-center gap-2">
      {icons[status]}
      {duration && (
        <span className="text-xs text-gray-400">{duration}ms</span>
      )}
    </div>
  )
}

/**
 * Test Summary Component
 */
const TestSummary: React.FC<{ results: TestSuiteResult }> = ({ results }) => {
  const { totalTests, passedTests, failedTests, coverage } = results
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Pass Rate</span>
        <span className="text-sm font-medium">{passRate.toFixed(0)}%</span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${passRate}%` }}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Passed</span>
          <span className="text-green-500">{passedTests}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Failed</span>
          <span className="text-red-500">{failedTests}</span>
        </div>
      </div>
      
      {coverage && (
        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Coverage</span>
            <span className="text-sm font-medium">{coverage.lines.percentage.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Complete View Component
 */
const CompleteView: React.FC<{ state: WorkflowState }> = ({ state }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-xl font-semibold">Workflow Complete!</h3>
        <p className="text-gray-400">
          All tests are passing with {state.coverage?.toFixed(0)}% coverage
        </p>
      </div>
    </div>
  )
}

/**
 * History Panel Component
 */
const HistoryPanel: React.FC<{ history: WorkflowState['history'] }> = ({ history }) => {
  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="text-lg font-semibold mb-4">Workflow History</h3>
      <div className="space-y-2">
        {history.map((entry, index) => (
          <div key={index} className="p-3 bg-gray-800 rounded-lg text-sm">
            <div className="flex items-start justify-between mb-1">
              <span className="font-medium">{entry.action}</span>
              <PhaseTag phase={entry.phase} />
            </div>
            <p className="text-xs text-gray-400">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </p>
            {entry.details && (
              <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Phase Tag Component
 */
const PhaseTag: React.FC<{ phase: WorkflowState['phase'] }> = ({ phase }) => {
  const colors = {
    red: 'bg-red-500/20 text-red-400',
    green: 'bg-green-500/20 text-green-400',
    refactor: 'bg-blue-500/20 text-blue-400',
    complete: 'bg-purple-500/20 text-purple-400'
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[phase]}`}>
      {phase}
    </span>
  )
}

export default TDDWorkflowPanel