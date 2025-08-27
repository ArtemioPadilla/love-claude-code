/**
 * Test Runner Service
 * Executes tests in a sandboxed environment with real-time result streaming
 */

import { GeneratedTest } from './TestGenerator'

// Browser-compatible EventEmitter implementation
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

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
    return this
  }
}

export interface TestRunOptions {
  framework: 'vitest' | 'jest' | 'playwright'
  watch?: boolean
  coverage?: boolean
  parallel?: boolean
  maxWorkers?: number
  timeout?: number
  bail?: boolean
  updateSnapshots?: boolean
  filter?: string
  reporter?: 'default' | 'verbose' | 'json' | 'junit'
}

export interface TestResult {
  testId: string
  fileName: string
  status: 'pass' | 'fail' | 'skip' | 'pending'
  duration: number
  error?: {
    message: string
    stack?: string
    expected?: any
    actual?: any
  }
  coverage?: CoverageReport
}

export interface CoverageReport {
  lines: CoverageMetric
  statements: CoverageMetric
  branches: CoverageMetric
  functions: CoverageMetric
}

export interface CoverageMetric {
  total: number
  covered: number
  percentage: number
}

export interface TestSuiteResult {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  pendingTests: number
  totalDuration: number
  coverage?: CoverageReport
  results: TestResult[]
}

export interface TestRunnerEvents {
  'test:start': (testId: string, fileName: string) => void
  'test:pass': (result: TestResult) => void
  'test:fail': (result: TestResult) => void
  'test:skip': (result: TestResult) => void
  'suite:start': (suiteId: string) => void
  'suite:complete': (result: TestSuiteResult) => void
  'coverage:update': (coverage: CoverageReport) => void
  'error': (error: Error) => void
}

export class TestRunner extends EventEmitter {
  private runningProcesses = new Map<string, Worker>()
  private testQueue: GeneratedTest[] = []
  private results: TestResult[] = []
  
  constructor() {
    super()
  }

  /**
   * Run a suite of tests
   */
  async runTests(
    tests: GeneratedTest[],
    options: TestRunOptions = { framework: 'vitest' }
  ): Promise<TestSuiteResult> {
    const startTime = Date.now()
    this.results = []
    this.testQueue = [...tests]

    try {
      // Create test environment
      const environment = await this.createTestEnvironment(options)
      
      // Write test files to sandbox
      await this.writeTestFiles(tests, environment)
      
      // Execute tests
      const results = await this.executeTests(environment, options)
      
      // Clean up
      await this.cleanupEnvironment(environment)
      
      return this.createSuiteResult(results, startTime)
    } catch (error) {
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Run tests in watch mode
   */
  async watchTests(
    tests: GeneratedTest[],
    options: TestRunOptions
  ): Promise<void> {
    const watchOptions = { ...options, watch: true }
    
    // Set up file watcher
    const watcher = await this.setupWatcher(tests, watchOptions)
    
    // Initial run
    await this.runTests(tests, watchOptions)
    
    // Watch for changes
    watcher.on('change', async (changedFile: string) => {
      const affectedTests = this.findAffectedTests(changedFile, tests)
      if (affectedTests.length > 0) {
        await this.runTests(affectedTests, watchOptions)
      }
    })
  }

  /**
   * Stop all running tests
   */
  async stopAllTests(): Promise<void> {
    for (const [id, worker] of this.runningProcesses) {
      worker.terminate()
      this.runningProcesses.delete(id)
    }
  }

  /**
   * Create sandboxed test environment
   */
  private async createTestEnvironment(options: TestRunOptions): Promise<TestEnvironment> {
    // Create isolated directory for test execution
    const sandboxId = `test-sandbox-${Date.now()}`
    const sandboxPath = `/tmp/love-claude-code-tests/${sandboxId}`
    
    // Set up package.json with test dependencies
    const packageJson = {
      name: 'test-sandbox',
      version: '1.0.0',
      type: 'module',
      scripts: {
        test: this.getTestCommand(options)
      },
      devDependencies: this.getTestDependencies(options.framework)
    }
    
    // Create sandbox structure
    await this.createDirectory(sandboxPath)
    await this.writeFile(`${sandboxPath}/package.json`, JSON.stringify(packageJson, null, 2))
    
    // Copy necessary configs
    await this.copyTestConfigs(sandboxPath, options.framework)
    
    return {
      id: sandboxId,
      path: sandboxPath,
      framework: options.framework
    }
  }

  /**
   * Write test files to sandbox
   */
  private async writeTestFiles(
    tests: GeneratedTest[],
    environment: TestEnvironment
  ): Promise<void> {
    for (const test of tests) {
      const filePath = `${environment.path}/${test.fileName}`
      await this.writeFile(filePath, test.content)
    }
  }

  /**
   * Execute tests in sandbox
   */
  private async executeTests(
    environment: TestEnvironment,
    options: TestRunOptions
  ): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./workers/testExecutor.worker.ts', import.meta.url), {
        type: 'module'
      })
      
      this.runningProcesses.set(environment.id, worker)
      
      const results: TestResult[] = []
      
      worker.on('message', (message: WorkerMessage) => {
        switch (message.type) {
          case 'test:start': {
            this.emit('test:start', message.data.testId, message.data.fileName)
            break
          }
            
          case 'test:result': {
            const result = message.data as TestResult
            results.push(result)
            this.emit(`test:${result.status}`, result)
            break
          }
            
          case 'coverage:update': {
            this.emit('coverage:update', message.data)
            break
          }
            
          case 'suite:complete': {
            this.runningProcesses.delete(environment.id)
            resolve(results)
            break
          }
            
          case 'error': {
            this.runningProcesses.delete(environment.id)
            reject(new Error(message.data.message))
            break
          }
        }
      })
      
      worker.postMessage({
        type: 'run',
        environment,
        options
      })
    })
  }

  /**
   * Clean up test environment
   */
  private async cleanupEnvironment(environment: TestEnvironment): Promise<void> {
    // Remove sandbox directory
    await this.removeDirectory(environment.path)
  }

  /**
   * Create suite result summary
   */
  private createSuiteResult(results: TestResult[], startTime: number): TestSuiteResult {
    const totalDuration = Date.now() - startTime
    
    const summary = results.reduce((acc, result) => {
      acc.totalTests++
      acc[`${result.status}Tests`]++
      return acc
    }, {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      pendingTests: 0
    })
    
    // Aggregate coverage if available
    const coverage = this.aggregateCoverage(results)
    
    return {
      ...summary,
      totalDuration,
      coverage,
      results
    }
  }

  /**
   * Aggregate coverage from all test results
   */
  private aggregateCoverage(results: TestResult[]): CoverageReport | undefined {
    const coverageReports = results
      .filter(r => r.coverage)
      .map(r => r.coverage!)
    
    if (coverageReports.length === 0) return undefined
    
    // Aggregate metrics
    const aggregated: CoverageReport = {
      lines: this.aggregateMetric(coverageReports.map(r => r.lines)),
      statements: this.aggregateMetric(coverageReports.map(r => r.statements)),
      branches: this.aggregateMetric(coverageReports.map(r => r.branches)),
      functions: this.aggregateMetric(coverageReports.map(r => r.functions))
    }
    
    return aggregated
  }

  /**
   * Aggregate a single coverage metric
   */
  private aggregateMetric(metrics: CoverageMetric[]): CoverageMetric {
    const total = metrics.reduce((sum, m) => sum + m.total, 0)
    const covered = metrics.reduce((sum, m) => sum + m.covered, 0)
    
    return {
      total,
      covered,
      percentage: total > 0 ? (covered / total) * 100 : 0
    }
  }

  /**
   * Get test command for framework
   */
  private getTestCommand(options: TestRunOptions): string {
    const { framework, coverage, reporter = 'default' } = options
    
    switch (framework) {
      case 'vitest': {
        return `vitest run ${coverage ? '--coverage' : ''} --reporter=${reporter}`
      }
      case 'jest': {
        return `jest ${coverage ? '--coverage' : ''} --reporters=${reporter}`
      }
      case 'playwright': {
        return `playwright test --reporter=${reporter}`
      }
      default: {
        return 'npm test'
      }
    }
  }

  /**
   * Get test dependencies for framework
   */
  private getTestDependencies(framework: 'vitest' | 'jest' | 'playwright'): Record<string, string> {
    const common = {
      '@testing-library/react': '^14.0.0',
      '@testing-library/user-event': '^14.0.0',
      '@testing-library/jest-dom': '^6.0.0'
    }
    
    switch (framework) {
      case 'vitest': {
        return {
          ...common,
          'vitest': '^1.0.0',
          '@vitest/coverage-v8': '^1.0.0',
          'jsdom': '^23.0.0',
          '@vitejs/plugin-react': '^4.0.0'
        }
      }
      case 'jest': {
        return {
          ...common,
          'jest': '^29.0.0',
          '@types/jest': '^29.0.0',
          'jest-environment-jsdom': '^29.0.0',
          'ts-jest': '^29.0.0'
        }
      }
      case 'playwright': {
        return {
          '@playwright/test': '^1.40.0'
        }
      }
    }
  }

  /**
   * Copy test configuration files
   */
  private async copyTestConfigs(sandboxPath: string, framework: string): Promise<void> {
    switch (framework) {
      case 'vitest': {
        await this.writeFile(`${sandboxPath}/vitest.config.ts`, VITEST_CONFIG)
        break
      }
      case 'jest': {
        await this.writeFile(`${sandboxPath}/jest.config.js`, JEST_CONFIG)
        break
      }
      case 'playwright': {
        await this.writeFile(`${sandboxPath}/playwright.config.ts`, PLAYWRIGHT_CONFIG)
        break
      }
    }
  }

  /**
   * Set up file watcher for watch mode
   */
  private async setupWatcher(
    tests: GeneratedTest[],
    _options: TestRunOptions
  ): Promise<FileWatcher> {
    // Implementation would use chokidar or similar
    // For now, return a mock watcher
    return new EventEmitter() as any
  }

  /**
   * Find tests affected by file change
   */
  private findAffectedTests(changedFile: string, tests: GeneratedTest[]): GeneratedTest[] {
    // Simple implementation - in reality would use dependency graph
    return tests.filter(test => 
      test.specifications.some(spec => spec.includes(changedFile))
    )
  }

  // File system helpers (would use fs/promises in real implementation)
  private async createDirectory(path: string): Promise<void> {
    // Mock implementation
  }

  private async writeFile(path: string, content: string): Promise<void> {
    // Mock implementation
  }

  private async removeDirectory(path: string): Promise<void> {
    // Mock implementation
  }
}

// Types
interface TestEnvironment {
  id: string
  path: string
  framework: 'vitest' | 'jest' | 'playwright'
}

interface WorkerMessage {
  type: string
  data: any
}

interface FileWatcher extends EventEmitter {
  close(): void
}

// Configuration templates
const VITEST_CONFIG = `
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test-setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test-setup.ts']
    }
  }
})
`

const JEST_CONFIG = `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ]
}
`

const PLAYWRIGHT_CONFIG = `
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
`

// Export singleton instance
export const testRunner = new TestRunner()