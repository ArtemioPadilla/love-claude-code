/**
 * Example: Integrating Development Tools with Monaco Editor
 * 
 * This example demonstrates how to use the new L1 dev tools constructs:
 * - PrometheusMetricsConstruct for monitoring
 * - CodeQualityConstruct for ESLint/Prettier integration
 * - TestRunnerConstruct for integrated testing
 */

import React, { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { PrometheusMetricsConstruct } from '../constructs/L1/monitoring/PrometheusMetricsConstruct'
import { CodeQualityConstruct } from '../constructs/L1/dev-tools/CodeQualityConstruct'
import { TestRunnerConstruct } from '../constructs/L1/dev-tools/TestRunnerConstruct'

export const DevToolsIntegrationExample: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Construct instances
  const [metrics] = useState(() => new PrometheusMetricsConstruct())
  const [codeQuality] = useState(() => new CodeQualityConstruct())
  const [testRunner] = useState(() => new TestRunnerConstruct())
  
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Create Monaco editor
    const editor = monaco.editor.create(containerRef.current, {
      value: `// Example React component with tests
import React from 'react'
import { render, screen } from '@testing-library/react'

// Component
export const Button = ({ onClick, children }) => {
  return (
    <button 
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Tests
describe('Button', () => {
  test('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})`,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14
    })

    editorRef.current = editor

    // Initialize all constructs
    initializeConstructs(editor)

    return () => {
      editor.dispose()
      metrics.destroy()
      codeQuality.destroy()
      testRunner.destroy()
    }
  }, [])

  const initializeConstructs = async (editor: monaco.editor.IStandaloneCodeEditor) => {
    try {
      // Initialize Prometheus metrics
      await metrics.initialize({
        metricsPrefix: 'dev_tools_example',
        enableConstructMetrics: true,
        scrapeInterval: 5000
      })

      // Track editor usage
      metrics.recordConstructUsage('monaco-editor', 'L0', 'ui')

      // Initialize code quality
      await codeQuality.initialize({
        editor,
        enableESLint: true,
        enablePrettier: true,
        eslintConfig: {
          env: { browser: true, es2021: true, jest: true },
          extends: ['eslint:recommended', 'plugin:react/recommended'],
          rules: {
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off'
          }
        },
        prettierConfig: {
          semi: false,
          singleQuote: true,
          tabWidth: 2
        },
        autoFixOnSave: true,
        formatOnSave: true
      })

      // Initialize test runner
      await testRunner.initialize({
        editor,
        framework: 'jest',
        watchMode: true,
        showCoverage: true,
        showInlineResults: true,
        coverageThreshold: {
          good: 80,
          medium: 60,
          poor: 40
        }
      })

      setIsInitialized(true)

      // Listen for events
      setupEventListeners()
    } catch (error) {
      console.error('Failed to initialize constructs:', error)
    }
  }

  const setupEventListeners = () => {
    // Monitor code quality changes
    codeQuality.on('qualityChanged', (data) => {
      console.log('Code quality update:', data)
      metrics.incrementCounter('code_quality_checks')
      
      if (data.errorCount > 0) {
        metrics.recordConstructError('code-editor', 'lint-error')
      }
    })

    // Monitor test results
    testRunner.on('testComplete', (results) => {
      console.log('Test results:', results)
      metrics.incrementCounter('test_runs')
      metrics.recordGauge('test_pass_rate', 
        results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0
      )
      
      if (results.coverage) {
        metrics.recordGauge('code_coverage', results.coverage.lines.percentage)
      }
    })

    // Monitor coverage updates
    testRunner.on('coverageUpdated', (coverage) => {
      console.log('Coverage update:', coverage)
    })
  }

  const runAllTools = async () => {
    if (!editorRef.current) return

    // Track action
    metrics.incrementCounter('manual_tool_runs')

    // Run code quality check
    const content = editorRef.current.getValue()
    await codeQuality['performLinting'](content)
    
    // Format code
    await codeQuality['handleSave'](editorRef.current)
    
    // Run tests
    await testRunner['runCurrentFileTests']()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Development Tools Integration Example</h1>
        <button
          onClick={runAllTools}
          disabled={!isInitialized}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600"
        >
          Run All Tools
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <div ref={containerRef} className="flex-1" />
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-gray-800 p-4 overflow-y-auto">
          {isInitialized ? (
            <div className="space-y-4">
              {/* Metrics */}
              <div className="bg-gray-700 rounded p-4">
                <h3 className="text-white font-semibold mb-2">Metrics</h3>
                {metrics.render()}
              </div>

              {/* Code Quality */}
              <div className="bg-gray-700 rounded p-4">
                <h3 className="text-white font-semibold mb-2">Code Quality</h3>
                {codeQuality.render()}
              </div>

              {/* Test Runner */}
              <div className="bg-gray-700 rounded p-4">
                <h3 className="text-white font-semibold mb-2">Test Runner</h3>
                {testRunner.render()}
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Initializing development tools...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Integration Guide
 * 
 * 1. Prometheus Metrics Integration:
 *    - Tracks construct usage automatically
 *    - Records performance metrics
 *    - Monitors error rates
 *    - Provides /metrics endpoint for scraping
 * 
 * 2. Code Quality Integration:
 *    - Real-time ESLint checking with inline markers
 *    - Prettier formatting on save
 *    - Configurable rules and auto-fixing
 *    - Visual indicators for issues
 * 
 * 3. Test Runner Integration:
 *    - Inline test results in editor
 *    - Coverage visualization with line highlighting
 *    - Watch mode for automatic re-runs
 *    - Support for Jest, Vitest, and Playwright
 * 
 * Performance Considerations:
 * - Linting is debounced (default 500ms)
 * - Test runs are sandboxed in Docker containers
 * - Metrics collection has minimal overhead
 * - All tools respect Monaco's performance guidelines
 * 
 * Configuration:
 * - Each tool can be configured independently
 * - Settings persist across sessions
 * - Support for project-specific configs
 */