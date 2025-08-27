import React, { useEffect, useState, useRef } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import * as monaco from 'monaco-editor'
import { TestRunner, TestResult, TestSuiteResult, CoverageReport } from '../../../services/tdd/TestRunner'

interface TestDecoration {
  range: monaco.Range
  options: monaco.editor.IModelDecorationOptions
}

interface TestFileInfo {
  path: string
  tests: TestCase[]
  coverage?: FileCoverage
}

interface TestCase {
  name: string
  line: number
  status: 'pass' | 'fail' | 'skip' | 'pending' | 'running'
  duration?: number
  error?: string
}

interface FileCoverage {
  lines: { [line: number]: number }
  branches: { [branch: string]: number }
  functions: { [func: string]: number }
  statements: { [stmt: string]: number }
}

/**
 * L1 Test Runner Construct
 * Integrated test execution with inline results, coverage visualization, and watch mode
 * Supports Jest, Vitest, and Playwright with Monaco editor integration
 */
export class TestRunnerConstruct extends L1UIConstruct {
  private testRunner: TestRunner
  private monacoInstance: typeof monaco | null = null
  private decorationIds: string[] = []
  private coverageDecorationsIds: string[] = []
  private testStatusWidgets: Map<string, any> = new Map()
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-test-runner',
    name: 'Integrated Test Runner',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Run tests directly in the editor with inline results, coverage visualization, and watch mode support',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['dev-tools', 'ui', 'testing'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['jest', 'vitest', 'playwright', 'testing', 'coverage', 'tdd'],
    inputs: [
      {
        name: 'editor',
        type: 'object',
        description: 'Monaco editor instance',
        required: true
      },
      {
        name: 'framework',
        type: 'string',
        description: 'Test framework to use',
        required: false,
        defaultValue: 'vitest',
        validation: {
          enum: ['vitest', 'jest', 'playwright']
        }
      },
      {
        name: 'watchMode',
        type: 'boolean',
        description: 'Enable watch mode for auto-rerun',
        required: false,
        defaultValue: true
      },
      {
        name: 'showCoverage',
        type: 'boolean',
        description: 'Show inline coverage indicators',
        required: false,
        defaultValue: true
      },
      {
        name: 'showInlineResults',
        type: 'boolean',
        description: 'Show test results inline in editor',
        required: false,
        defaultValue: true
      },
      {
        name: 'coverageThreshold',
        type: 'object',
        description: 'Coverage thresholds for highlighting',
        required: false,
        defaultValue: {
          good: 80,
          medium: 60,
          poor: 40
        }
      },
      {
        name: 'autoRunDelay',
        type: 'number',
        description: 'Delay before auto-running tests (ms)',
        required: false,
        defaultValue: 1000
      },
      {
        name: 'maxParallelTests',
        type: 'number',
        description: 'Maximum parallel test execution',
        required: false,
        defaultValue: 4
      }
    ],
    outputs: [
      {
        name: 'testResults',
        type: 'object',
        description: 'Current test suite results'
      },
      {
        name: 'coverage',
        type: 'object',
        description: 'Current coverage report'
      },
      {
        name: 'isRunning',
        type: 'boolean',
        description: 'Whether tests are currently running'
      },
      {
        name: 'totalTests',
        type: 'number',
        description: 'Total number of tests'
      },
      {
        name: 'passedTests',
        type: 'number',
        description: 'Number of passed tests'
      },
      {
        name: 'failedTests',
        type: 'number',
        description: 'Number of failed tests'
      },
      {
        name: 'coveragePercentage',
        type: 'number',
        description: 'Overall coverage percentage'
      }
    ],
    security: [
      {
        aspect: 'Sandboxed Execution',
        description: 'Tests run in isolated containers',
        implementation: 'Docker-based test execution sandbox'
      },
      {
        aspect: 'Resource Limits',
        description: 'Prevents runaway tests',
        implementation: 'Memory and CPU limits per test'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'testExecutions',
          unit: '1K executions',
          costPerUnit: 0.05,
          description: 'Compute for test execution'
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'Jest/Vitest + Monaco Editor + Docker'
    },
    examples: [
      {
        title: 'Basic Integration',
        description: 'Add test runner to editor',
        code: `const testRunner = new TestRunnerConstruct()
await testRunner.initialize({
  editor: monacoEditor,
  framework: 'vitest',
  watchMode: true,
  showCoverage: true
})

// Listen for test results
testRunner.on('testComplete', (results) => {
  console.log(\`Tests: \${results.passedTests}/\${results.totalTests} passed\`)
  console.log(\`Coverage: \${results.coverage?.lines.percentage}%\`)
})`,
        language: 'typescript'
      },
      {
        title: 'With Coverage Thresholds',
        description: 'Configure coverage visualization',
        code: `const testRunner = new TestRunnerConstruct()
await testRunner.initialize({
  editor: monacoEditor,
  showCoverage: true,
  coverageThreshold: {
    good: 90,    // Green for >= 90%
    medium: 70,  // Yellow for >= 70%
    poor: 50     // Red for < 50%
  }
})

// Run specific test file
await testRunner.runTestFile('src/components/Button.test.tsx')`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use watch mode during development for instant feedback',
      'Set appropriate coverage thresholds for your project',
      'Configure test timeouts to prevent hanging tests',
      'Use parallel execution for faster test runs',
      'Keep test files close to source files',
      'Write tests before implementing features (TDD)'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        testCommand: {
          type: 'string',
          description: 'Custom test command',
          required: false
        },
        dockerImage: {
          type: 'string',
          description: 'Docker image for test execution',
          default: 'node:18-alpine'
        }
      },
      environmentVariables: []
    },
    dependencies: ['platform-l0-code-editor-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 25,
      builtWith: ['platform-l0-code-editor-primitive', 'platform-l1-secure-code-editor'],
      timeToCreate: 150,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(TestRunnerConstruct.definition)
    this.testRunner = new TestRunner()
  }

  async onInitialize(): Promise<void> {
    const editor = this.getInput<any>('editor')
    if (!editor) {
      throw new Error('Monaco editor instance is required')
    }

    // Store Monaco reference
    this.monacoInstance = monaco

    // Set up test runner event listeners
    this.setupTestRunnerListeners()

    // Set up editor integration
    this.setupEditorIntegration(editor)

    // Initial state
    this.setOutput('isRunning', false)
    this.setOutput('totalTests', 0)
    this.setOutput('passedTests', 0)
    this.setOutput('failedTests', 0)

    // If watch mode is enabled, start watching
    if (this.getInput<boolean>('watchMode')) {
      this.startWatchMode()
    }
  }

  async onDestroy(): Promise<void> {
    // Stop all running tests
    await this.testRunner.stopAllTests()

    // Clear decorations
    this.clearAllDecorations()

    // Clear widgets
    this.testStatusWidgets.forEach(widget => widget.dispose())
    this.testStatusWidgets.clear()
  }

  /**
   * Set up test runner event listeners
   */
  private setupTestRunnerListeners(): void {
    this.testRunner.on('test:start', (testId: string, fileName: string) => {
      this.setOutput('isRunning', true)
      this.updateTestDecoration(testId, 'running')
    })

    this.testRunner.on('test:pass', (result: TestResult) => {
      this.updateTestDecoration(result.testId, 'pass', result)
    })

    this.testRunner.on('test:fail', (result: TestResult) => {
      this.updateTestDecoration(result.testId, 'fail', result)
    })

    this.testRunner.on('suite:complete', (result: TestSuiteResult) => {
      this.handleSuiteComplete(result)
    })

    this.testRunner.on('coverage:update', (coverage: CoverageReport) => {
      this.updateCoverageVisualization(coverage)
    })
  }

  /**
   * Set up Monaco editor integration
   */
  private setupEditorIntegration(editor: any): void {
    // Add test run command
    editor.addAction({
      id: 'run-tests',
      label: 'Run Tests',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT],
      run: () => this.runCurrentFileTests()
    })

    // Add coverage toggle command
    editor.addAction({
      id: 'toggle-coverage',
      label: 'Toggle Coverage',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC],
      run: () => this.toggleCoverage()
    })

    // Watch for file changes in watch mode
    if (this.getInput<boolean>('watchMode')) {
      const delay = this.getInput<number>('autoRunDelay') || 1000
      let timeout: NodeJS.Timeout

      editor.onDidChangeModelContent(() => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (this.isTestFile(editor.getModel().uri.path)) {
            this.runCurrentFileTests()
          }
        }, delay)
      })
    }

    // Add gutter click handler for running individual tests
    editor.onMouseDown((e: any) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const line = e.target.position.lineNumber
        this.runTestAtLine(line)
      }
    })
  }

  /**
   * Run tests for the current file
   */
  async runCurrentFileTests(): Promise<void> {
    const editor = this.getInput<any>('editor')
    const filePath = editor.getModel().uri.path
    
    if (!this.isTestFile(filePath)) {
      // Find corresponding test file
      const testPath = this.findTestFile(filePath)
      if (testPath) {
        await this.runTestFile(testPath)
      }
    } else {
      await this.runTestFile(filePath)
    }
  }

  /**
   * Run a specific test file
   */
  async runTestFile(filePath: string): Promise<void> {
    const framework = this.getInput<string>('framework') as 'vitest' | 'jest' | 'playwright'
    
    // Parse test file to extract test cases
    const tests = await this.parseTestFile(filePath)
    
    // Run tests
    const results = await this.testRunner.runTests(tests, {
      framework,
      coverage: this.getInput<boolean>('showCoverage'),
      parallel: true,
      maxWorkers: this.getInput<number>('maxParallelTests')
    })

    this.handleSuiteComplete(results)
  }

  /**
   * Run test at specific line
   */
  private async runTestAtLine(line: number): Promise<void> {
    const editor = this.getInput<any>('editor')
    const content = editor.getValue()
    
    // Find test at line
    const testName = this.findTestAtLine(content, line)
    if (testName) {
      // Run specific test
      const framework = this.getInput<string>('framework') as 'vitest' | 'jest' | 'playwright'
      await this.testRunner.runTests([{
        fileName: editor.getModel().uri.path,
        content: content,
        specifications: [testName],
        framework
      }], {
        framework,
        filter: testName
      })
    }
  }

  /**
   * Handle test suite completion
   */
  private handleSuiteComplete(result: TestSuiteResult): void {
    this.setOutput('testResults', result)
    this.setOutput('isRunning', false)
    this.setOutput('totalTests', result.totalTests)
    this.setOutput('passedTests', result.passedTests)
    this.setOutput('failedTests', result.failedTests)
    
    if (result.coverage) {
      this.setOutput('coverage', result.coverage)
      this.setOutput('coveragePercentage', result.coverage.lines.percentage)
    }

    // Update all test decorations
    result.results.forEach(testResult => {
      this.updateTestDecoration(testResult.testId, testResult.status, testResult)
    })

    this.emit('testComplete', result)
  }

  /**
   * Update test decoration in editor
   */
  private updateTestDecoration(testId: string, status: string, result?: TestResult): void {
    if (!this.monacoInstance || !this.getInput<boolean>('showInlineResults')) return

    const editor = this.getInput<any>('editor')
    const model = editor.getModel()

    // Parse test location from testId
    const { line } = this.parseTestId(testId)
    if (!line) return

    // Create decoration based on status
    const decoration = this.createTestDecoration(line, status, result)
    
    // Apply decoration
    const newDecorations = model.deltaDecorations(
      this.decorationIds,
      [decoration]
    )
    this.decorationIds = newDecorations

    // Add inline widget for failed tests
    if (status === 'fail' && result?.error) {
      this.addTestErrorWidget(line, result.error)
    }
  }

  /**
   * Create test decoration
   */
  private createTestDecoration(line: number, status: string, result?: TestResult): TestDecoration {
    const statusConfig = {
      pass: {
        glyphMarginClassName: 'test-pass-glyph',
        glyphMarginHoverMessage: { value: `✓ Test passed (${result?.duration}ms)` },
        overviewRuler: {
          color: '#10b981',
          position: monaco.editor.OverviewRulerLane.Left
        }
      },
      fail: {
        glyphMarginClassName: 'test-fail-glyph',
        glyphMarginHoverMessage: { value: `✗ Test failed: ${result?.error?.message}` },
        overviewRuler: {
          color: '#ef4444',
          position: monaco.editor.OverviewRulerLane.Left
        },
        className: 'test-fail-line'
      },
      running: {
        glyphMarginClassName: 'test-running-glyph',
        glyphMarginHoverMessage: { value: '⟳ Test running...' },
        overviewRuler: {
          color: '#3b82f6',
          position: monaco.editor.OverviewRulerLane.Left
        }
      },
      skip: {
        glyphMarginClassName: 'test-skip-glyph',
        glyphMarginHoverMessage: { value: '⊘ Test skipped' },
        overviewRuler: {
          color: '#6b7280',
          position: monaco.editor.OverviewRulerLane.Left
        }
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.skip

    return {
      range: new monaco.Range(line, 1, line, 1),
      options: config
    }
  }

  /**
   * Add test error widget
   */
  private addTestErrorWidget(line: number, error: any): void {
    const editor = this.getInput<any>('editor')
    
    // Create content widget
    const contentWidget = {
      getId: () => `test-error-${line}`,
      getDomNode: () => {
        const node = document.createElement('div')
        node.className = 'test-error-widget'
        node.innerHTML = `
          <div class="test-error-content">
            <div class="test-error-message">${error.message}</div>
            ${error.stack ? `<pre class="test-error-stack">${error.stack}</pre>` : ''}
          </div>
        `
        return node
      },
      getPosition: () => ({
        position: { lineNumber: line, column: 1 },
        preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
      })
    }

    // Remove old widget if exists
    const oldWidget = this.testStatusWidgets.get(`test-error-${line}`)
    if (oldWidget) {
      editor.removeContentWidget(oldWidget)
    }

    // Add new widget
    editor.addContentWidget(contentWidget)
    this.testStatusWidgets.set(`test-error-${line}`, contentWidget)
  }

  /**
   * Update coverage visualization
   */
  private updateCoverageVisualization(coverage: CoverageReport): void {
    if (!this.monacoInstance || !this.getInput<boolean>('showCoverage')) return

    const editor = this.getInput<any>('editor')
    const model = editor.getModel()
    const thresholds = this.getInput<any>('coverageThreshold')

    // Clear old coverage decorations
    model.deltaDecorations(this.coverageDecorationsIds, [])
    this.coverageDecorationsIds = []

    // Create coverage decorations for current file
    const fileCoverage = this.extractFileCoverage(coverage, model.uri.path)
    if (!fileCoverage) return

    const decorations: TestDecoration[] = []

    // Line coverage
    Object.entries(fileCoverage.lines).forEach(([lineStr, count]) => {
      const line = parseInt(lineStr)
      const className = count > 0 ? 'coverage-covered' : 'coverage-uncovered'
      
      decorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className,
          linesDecorationsClassName: `coverage-line-${count > 0 ? 'covered' : 'uncovered'}`
        }
      })
    })

    // Apply decorations
    this.coverageDecorationsIds = model.deltaDecorations([], decorations)

    // Update coverage indicator
    this.updateCoverageIndicator(coverage)
  }

  /**
   * Toggle coverage visualization
   */
  private toggleCoverage(): void {
    const showCoverage = !this.getInput<boolean>('showCoverage')
    this.setInput('showCoverage', showCoverage)

    if (!showCoverage) {
      // Clear coverage decorations
      const editor = this.getInput<any>('editor')
      const model = editor.getModel()
      model.deltaDecorations(this.coverageDecorationsIds, [])
      this.coverageDecorationsIds = []
    } else {
      // Re-apply coverage if available
      const coverage = this.getOutput<CoverageReport>('coverage')
      if (coverage) {
        this.updateCoverageVisualization(coverage)
      }
    }
  }

  /**
   * Update coverage indicator
   */
  private updateCoverageIndicator(coverage: CoverageReport): void {
    const percentage = coverage.lines.percentage
    const thresholds = this.getInput<any>('coverageThreshold')
    
    let status = 'poor'
    if (percentage >= thresholds.good) status = 'good'
    else if (percentage >= thresholds.medium) status = 'medium'

    this.emit('coverageUpdated', {
      percentage,
      status,
      details: coverage
    })
  }

  /**
   * Start watch mode
   */
  private startWatchMode(): void {
    // This would integrate with file watcher
    // For now, just rely on editor content changes
    console.log('Watch mode enabled')
  }

  /**
   * Helper: Check if file is a test file
   */
  private isTestFile(path: string): boolean {
    return /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(path)
  }

  /**
   * Helper: Find test file for source file
   */
  private findTestFile(sourcePath: string): string | null {
    // Simple heuristic - replace extension with .test.ext
    const testPath = sourcePath.replace(/\.(js|jsx|ts|tsx)$/, '.test.$1')
    // In real implementation, would check if file exists
    return testPath
  }

  /**
   * Helper: Parse test file to extract test cases
   */
  private async parseTestFile(filePath: string): Promise<any[]> {
    const editor = this.getInput<any>('editor')
    const content = editor.getValue()
    
    // Simple parsing - in real implementation would use AST
    const testRegex = /(?:test|it|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g
    const tests = []
    let match

    while ((match = testRegex.exec(content)) !== null) {
      tests.push({
        fileName: filePath,
        content: content,
        specifications: [match[1]],
        framework: this.getInput<string>('framework')
      })
    }

    return tests
  }

  /**
   * Helper: Find test at line
   */
  private findTestAtLine(content: string, line: number): string | null {
    const lines = content.split('\n')
    
    // Search backwards for test declaration
    for (let i = line - 1; i >= 0; i--) {
      const match = lines[i].match(/(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/)
      if (match) return match[1]
    }
    
    return null
  }

  /**
   * Helper: Parse test ID
   */
  private parseTestId(testId: string): { file?: string, line?: number } {
    // Simple format: file:line:testname
    const parts = testId.split(':')
    return {
      file: parts[0],
      line: parts[1] ? parseInt(parts[1]) : undefined
    }
  }

  /**
   * Helper: Extract file coverage
   */
  private extractFileCoverage(coverage: CoverageReport, filePath: string): FileCoverage | null {
    // In real implementation, would map coverage data to specific file
    // For now, return mock data
    return {
      lines: { 10: 1, 11: 1, 12: 0, 15: 1, 16: 0 },
      branches: {},
      functions: {},
      statements: {}
    }
  }

  /**
   * Clear all decorations
   */
  private clearAllDecorations(): void {
    const editor = this.getInput<any>('editor')
    const model = editor.getModel()
    
    model.deltaDecorations(this.decorationIds, [])
    model.deltaDecorations(this.coverageDecorationsIds, [])
    
    this.decorationIds = []
    this.coverageDecorationsIds = []
  }

  /**
   * React component for test runner UI
   */
  render(): React.ReactElement {
    return <TestRunnerComponent construct={this} />
  }
}

/**
 * React component for test runner visualization
 */
const TestRunnerComponent: React.FC<{ construct: TestRunnerConstruct }> = ({ construct }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    coverage: 0
  })
  const [showDetails, setShowDetails] = useState(false)
  const [testResults, setTestResults] = useState<TestSuiteResult | null>(null)

  useEffect(() => {
    const updateStats = () => {
      setIsRunning(construct.getOutput<boolean>('isRunning') || false)
      setStats({
        total: construct.getOutput<number>('totalTests') || 0,
        passed: construct.getOutput<number>('passedTests') || 0,
        failed: construct.getOutput<number>('failedTests') || 0,
        coverage: construct.getOutput<number>('coveragePercentage') || 0
      })
      setTestResults(construct.getOutput<TestSuiteResult>('testResults') || null)
    }

    updateStats()
    const unsubscribe = construct.on('testComplete', updateStats)

    return () => {
      unsubscribe()
    }
  }, [construct])

  const getCoverageColor = (percentage: number) => {
    const thresholds = construct.getInput<any>('coverageThreshold')
    if (percentage >= thresholds.good) return 'text-green-600'
    if (percentage >= thresholds.medium) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="test-runner-panel p-4 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Test Runner</h3>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Running tests...</span>
            </div>
          )}
          <button
            onClick={() => construct['runCurrentFileTests']()}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
          >
            Run Tests
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded shadow text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-white p-3 rounded shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
          <div className="text-xs text-gray-600">Passed</div>
        </div>
        <div className="bg-white p-3 rounded shadow text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-600">Failed</div>
        </div>
        <div className="bg-white p-3 rounded shadow text-center">
          <div className={`text-2xl font-bold ${getCoverageColor(stats.coverage)}`}>
            {stats.coverage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Coverage</div>
        </div>
      </div>

      {/* Test Results */}
      {testResults && stats.failed > 0 && (
        <div className="bg-white rounded shadow">
          <div
            className="flex justify-between items-center p-3 border-b cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <h4 className="font-medium">Failed Tests</h4>
            <span className="text-sm text-gray-500">
              {showDetails ? '▼' : '▶'}
            </span>
          </div>
          {showDetails && (
            <div className="max-h-60 overflow-y-auto">
              {testResults.results
                .filter(r => r.status === 'fail')
                .map((result, index) => (
                  <div key={index} className="p-3 border-b hover:bg-gray-50">
                    <div className="font-medium text-red-600">
                      {result.fileName}
                    </div>
                    {result.error && (
                      <div className="mt-1">
                        <div className="text-sm text-gray-700">{result.error.message}</div>
                        {result.error.stack && (
                          <pre className="mt-1 text-xs text-gray-500 overflow-x-auto">
                            {result.error.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Coverage Details */}
      {testResults?.coverage && (
        <div className="mt-4 bg-white p-3 rounded shadow">
          <h4 className="font-medium mb-2">Coverage Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(testResults.coverage).map(([type, data]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.percentage >= 80 ? 'bg-green-500' :
                        data.percentage >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono">
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 text-sm">
        <button
          onClick={() => construct['toggleCoverage']()}
          className="text-blue-600 hover:underline"
        >
          {construct.getInput('showCoverage') ? 'Hide' : 'Show'} Coverage
        </button>
        <span className="text-gray-400">•</span>
        <button
          onClick={() => construct.setInput('watchMode', !construct.getInput('watchMode'))}
          className="text-blue-600 hover:underline"
        >
          Watch: {construct.getInput('watchMode') ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  )
}

// Add CSS for test decorations
const testRunnerStyles = `
  .test-pass-glyph::before {
    content: '✓';
    color: #10b981;
    font-weight: bold;
  }
  
  .test-fail-glyph::before {
    content: '✗';
    color: #ef4444;
    font-weight: bold;
  }
  
  .test-running-glyph::before {
    content: '⟳';
    color: #3b82f6;
    font-weight: bold;
    animation: spin 1s linear infinite;
  }
  
  .test-skip-glyph::before {
    content: '⊘';
    color: #6b7280;
  }
  
  .test-fail-line {
    background-color: rgba(239, 68, 68, 0.1);
  }
  
  .coverage-covered {
    background-color: rgba(16, 185, 129, 0.1);
  }
  
  .coverage-uncovered {
    background-color: rgba(239, 68, 68, 0.1);
  }
  
  .coverage-line-covered {
    background-color: #10b981;
    width: 3px !important;
  }
  
  .coverage-line-uncovered {
    background-color: #ef4444;
    width: 3px !important;
  }
  
  .test-error-widget {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    padding: 8px;
    margin-top: 4px;
    max-width: 600px;
  }
  
  .test-error-message {
    color: #991b1b;
    font-weight: 500;
  }
  
  .test-error-stack {
    margin-top: 4px;
    font-size: 11px;
    color: #7f1d1d;
    overflow-x: auto;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = testRunnerStyles
  document.head.appendChild(styleElement)
}

// Export factory function
export const createTestRunner = () => new TestRunnerConstruct()

// Export the definition for catalog registration
export const testRunnerDefinition = TestRunnerConstruct.definition