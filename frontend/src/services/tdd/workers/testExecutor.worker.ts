/**
 * Test Executor Worker
 * Runs tests in an isolated worker thread
 */

import { spawn } from 'child_process'
import { readFile } from 'fs/promises'

interface WorkerMessage {
  type: 'run' | 'stop'
  environment?: TestEnvironment
  options?: TestRunOptions
}

interface TestEnvironment {
  id: string
  path: string
  framework: 'vitest' | 'jest' | 'playwright'
}

interface TestRunOptions {
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

// Listen for messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, environment, options } = event.data
  
  switch (type) {
    case 'run': {
      if (environment && options) {
        await runTests(environment, options)
      }
      break
    }
      
    case 'stop': {
      // Stop any running tests
      break
    }
  }
})

/**
 * Run tests in the sandbox environment
 */
async function runTests(environment: TestEnvironment, options: TestRunOptions) {
  try {
    // Send start message
    self.postMessage({
      type: 'suite:start',
      data: { environmentId: environment.id }
    })
    
    // Install dependencies
    await installDependencies(environment.path)
    
    // Run tests
    const results = await executeTestCommand(environment, options)
    
    // Parse and send results
    const parsedResults = await parseTestResults(results, options)
    
    // Send individual test results
    for (const result of parsedResults) {
      self.postMessage({
        type: 'test:result',
        data: result
      })
    }
    
    // Send completion
    self.postMessage({
      type: 'suite:complete',
      data: { results: parsedResults }
    })
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      data: { message: (error as Error).message }
    })
  }
}

/**
 * Install test dependencies
 */
async function installDependencies(sandboxPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install', '--no-save'], {
      cwd: sandboxPath,
      stdio: 'pipe'
    })
    
    install.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed with code ${code}`))
      }
    })
    
    install.on('error', reject)
  })
}

/**
 * Execute test command
 */
async function executeTestCommand(
  environment: TestEnvironment,
  options: TestRunOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const testCommand = getTestCommand(options)
    const [command, ...args] = testCommand.split(' ')
    
    let output = ''
    let errorOutput = ''
    
    const testProcess = spawn(command, args, {
      cwd: environment.path,
      stdio: 'pipe',
      env: {
        ...process.env,
        CI: 'true',
        FORCE_COLOR: '0'
      }
    })
    
    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString()
      output += chunk
      
      // Stream progress updates
      const progressMatch = chunk.match(/(\d+)\/(\d+)/)
      if (progressMatch) {
        self.postMessage({
          type: 'progress',
          data: {
            current: parseInt(progressMatch[1]),
            total: parseInt(progressMatch[2])
          }
        })
      }
    })
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    testProcess.on('close', (code) => {
      if (code === 0 || code === 1) { // Tests can fail with code 1
        resolve(output)
      } else {
        reject(new Error(`Test command failed: ${errorOutput}`))
      }
    })
    
    testProcess.on('error', reject)
  })
}

/**
 * Parse test results based on framework
 */
async function parseTestResults(output: string, options: TestRunOptions): Promise<TestResult[]> {
  switch (options.framework) {
    case 'vitest': {
      return parseVitestResults(output, options)
    }
    case 'jest': {
      return parseJestResults(output, options)
    }
    case 'playwright': {
      return parsePlaywrightResults(output, options)
    }
    default: {
      return []
    }
  }
}

/**
 * Parse Vitest results
 */
function parseVitestResults(output: string, options: TestRunOptions): TestResult[] {
  const results: TestResult[] = []
  
  // Parse JSON reporter output if available
  if (options.reporter === 'json') {
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0])
        return json.testResults.map((file: any) => ({
          testId: file.name,
          fileName: file.name,
          status: file.status === 'passed' ? 'pass' : 'fail',
          duration: file.endTime - file.startTime,
          error: file.failureMessage ? {
            message: file.failureMessage
          } : undefined
        }))
      }
    } catch (error) {
      console.error('Failed to parse JSON results:', error)
    }
  }
  
  // Parse text output
  const testRegex = /✓|✗|↓|⏸\s+(.+)\s+\((\d+)ms\)/g
  let match
  
  while ((match = testRegex.exec(output)) !== null) {
    const [full, testName, duration] = match
    const status = full.includes('✓') ? 'pass' : 
                  full.includes('✗') ? 'fail' :
                  full.includes('↓') ? 'skip' : 'pending'
    
    results.push({
      testId: testName,
      fileName: 'unknown',
      status,
      duration: parseInt(duration)
    })
  }
  
  // Parse coverage if enabled
  if (options.coverage) {
    const coverage = parseCoverage(output)
    if (coverage && results.length > 0) {
      results[0].coverage = coverage
    }
  }
  
  return results
}

/**
 * Parse Jest results
 */
function parseJestResults(output: string, _options: TestRunOptions): TestResult[] {
  // Similar implementation for Jest
  return []
}

/**
 * Parse Playwright results
 */
function parsePlaywrightResults(output: string, _options: TestRunOptions): TestResult[] {
  // Similar implementation for Playwright
  return []
}

/**
 * Parse coverage information
 */
function parseCoverage(output: string): CoverageReport | undefined {
  const coverageRegex = /File\s+│\s+%\sStmts\s+│\s+%\sBranch\s+│\s+%\sFuncs\s+│\s+%\sLines/
  
  if (!coverageRegex.test(output)) {
    return undefined
  }
  
  // Extract summary line
  const summaryRegex = /All files\s+│\s+([\d.]+)\s+│\s+([\d.]+)\s+│\s+([\d.]+)\s+│\s+([\d.]+)/
  const summaryMatch = output.match(summaryRegex)
  
  if (!summaryMatch) {
    return undefined
  }
  
  const [, stmts, branch, funcs, lines] = summaryMatch
  
  return {
    statements: {
      total: 100,
      covered: parseFloat(stmts),
      percentage: parseFloat(stmts)
    },
    branches: {
      total: 100,
      covered: parseFloat(branch),
      percentage: parseFloat(branch)
    },
    functions: {
      total: 100,
      covered: parseFloat(funcs),
      percentage: parseFloat(funcs)
    },
    lines: {
      total: 100,
      covered: parseFloat(lines),
      percentage: parseFloat(lines)
    }
  }
}

/**
 * Get test command for framework
 */
function getTestCommand(options: TestRunOptions): string {
  const { framework, coverage, reporter = 'default' } = options
  
  switch (framework) {
    case 'vitest': {
      return `npx vitest run ${coverage ? '--coverage' : ''} --reporter=${reporter}`
    }
    case 'jest': {
      return `npx jest ${coverage ? '--coverage' : ''} --reporters=${reporter}`
    }
    case 'playwright': {
      return `npx playwright test --reporter=${reporter}`
    }
    default: {
      return 'npm test'
    }
  }
}

// Types
interface TestResult {
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

interface CoverageReport {
  lines: CoverageMetric
  statements: CoverageMetric
  branches: CoverageMetric
  functions: CoverageMetric
}

interface CoverageMetric {
  total: number
  covered: number
  percentage: number
}