/**
 * Test Results Viewer Component
 * Visualizes test execution results with detailed information
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  FileCode,
  BarChart3,
  Code2
} from 'lucide-react'
import { TestResult, TestSuiteResult, CoverageReport } from '../../services/tdd/TestRunner'

interface TestResultsViewerProps {
  results: TestSuiteResult
  className?: string
}

export const TestResultsViewer: React.FC<TestResultsViewerProps> = ({ results, className = '' }) => {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const [showCoverage, setShowCoverage] = useState(true)

  const toggleTest = (testId: string) => {
    const newExpanded = new Set(expandedTests)
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId)
    } else {
      newExpanded.add(testId)
    }
    setExpandedTests(newExpanded)
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Test Results
          </h3>
          <TestSummaryBadge results={results} />
        </div>

        <TestProgressBar results={results} />
      </div>

      {/* Test List */}
      <div className="max-h-96 overflow-y-auto">
        {results.results.map((test) => (
          <TestResultItem
            key={test.testId}
            test={test}
            isExpanded={expandedTests.has(test.testId)}
            onToggle={() => toggleTest(test.testId)}
          />
        ))}
      </div>

      {/* Coverage Section */}
      {results.coverage && (
        <div className="border-t border-gray-800">
          <button
            onClick={() => setShowCoverage(!showCoverage)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <span className="font-medium">Code Coverage</span>
            {showCoverage ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          
          <AnimatePresence>
            {showCoverage && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <CoverageDetails coverage={results.coverage} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/**
 * Test Summary Badge
 */
const TestSummaryBadge: React.FC<{ results: TestSuiteResult }> = ({ results }) => {
  const { totalTests, passedTests, failedTests } = results
  const allPassed = failedTests === 0 && totalTests > 0

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
      allPassed 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-red-500/20 text-red-400'
    }`}>
      {passedTests}/{totalTests} passed
    </div>
  )
}

/**
 * Test Progress Bar
 */
const TestProgressBar: React.FC<{ results: TestSuiteResult }> = ({ results }) => {
  const { totalTests, passedTests, failedTests, skippedTests, pendingTests } = results
  
  const segments = [
    { count: passedTests, color: 'bg-green-500', label: 'Passed' },
    { count: failedTests, color: 'bg-red-500', label: 'Failed' },
    { count: skippedTests, color: 'bg-yellow-500', label: 'Skipped' },
    { count: pendingTests, color: 'bg-gray-500', label: 'Pending' }
  ].filter(s => s.count > 0)

  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
        {segments.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ width: 0 }}
            animate={{ width: `${(segment.count / totalTests) * 100}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={segment.color}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${segment.color}`} />
            <span>{segment.label}: {segment.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Test Result Item
 */
const TestResultItem: React.FC<{
  test: TestResult
  isExpanded: boolean
  onToggle: () => void
}> = ({ test, isExpanded, onToggle }) => {
  const statusConfig = {
    pass: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      bg: 'hover:bg-green-500/5'
    },
    fail: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      bg: 'hover:bg-red-500/5'
    },
    skip: {
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      bg: 'hover:bg-yellow-500/5'
    },
    pending: {
      icon: <Clock className="w-5 h-5 text-gray-500" />,
      bg: 'hover:bg-gray-500/5'
    }
  }

  const config = statusConfig[test.status]

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center gap-3 ${config.bg} transition-colors`}
      >
        {config.icon}
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm">{test.fileName}</span>
          </div>
          {test.testId !== test.fileName && (
            <p className="text-xs text-gray-400 mt-1">{test.testId}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {test.duration && (
            <span className="text-xs text-gray-400">{test.duration}ms</span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && test.error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ErrorDetails error={test.error} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Error Details
 */
const ErrorDetails: React.FC<{ error: TestResult['error'] }> = ({ error }) => {
  if (!error) return null

  return (
    <div className="p-4 bg-red-500/5 border-t border-red-500/20">
      <h4 className="text-sm font-semibold text-red-400 mb-2">Error Details</h4>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">Message:</p>
          <p className="text-sm text-red-300 font-mono">{error.message}</p>
        </div>

        {error.expected !== undefined && error.actual !== undefined && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Expected:</p>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto">
                <code className="text-green-400">
                  {JSON.stringify(error.expected, null, 2)}
                </code>
              </pre>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Actual:</p>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto">
                <code className="text-red-400">
                  {JSON.stringify(error.actual, null, 2)}
                </code>
              </pre>
            </div>
          </div>
        )}

        {error.stack && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Stack Trace:</p>
            <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto">
              <code className="text-gray-300">{error.stack}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Coverage Details
 */
const CoverageDetails: React.FC<{ coverage: CoverageReport }> = ({ coverage }) => {
  const metrics = [
    { label: 'Lines', data: coverage.lines, icon: Code2 },
    { label: 'Statements', data: coverage.statements, icon: FileCode },
    { label: 'Branches', data: coverage.branches, icon: ChevronRight },
    { label: 'Functions', data: coverage.functions, icon: BarChart3 }
  ]

  return (
    <div className="p-4 space-y-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <metric.icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{metric.label}</span>
            </div>
            <div className="text-sm">
              <span className="font-mono">{metric.data.covered}/{metric.data.total}</span>
              <span className="text-gray-400 ml-2">
                ({metric.data.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metric.data.percentage}%` }}
              transition={{ duration: 0.5 }}
              className={`h-2 rounded-full ${
                metric.data.percentage >= 80 ? 'bg-green-500' :
                metric.data.percentage >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default TestResultsViewer