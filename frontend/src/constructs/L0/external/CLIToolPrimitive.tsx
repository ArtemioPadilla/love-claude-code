import React, { useRef, useEffect, useState } from 'react'
import { L0ExternalConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * Process state
 */
interface ProcessState {
  pid?: number
  status: 'idle' | 'running' | 'completed' | 'error' | 'killed'
  exitCode?: number
  startTime?: number
  endTime?: number
  duration?: number
}

/**
 * I/O stream data
 */
interface StreamData {
  stdout: string[]
  stderr: string[]
  combined: Array<{ type: 'stdout' | 'stderr', data: string, timestamp: number }>
}

/**
 * CLI execution options
 */
interface CLIExecutionOptions {
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  timeout?: number
  stdin?: string
  shell?: boolean
  encoding?: BufferEncoding
}

/**
 * CLI tool configuration
 */
interface CLIToolConfig {
  command: string
  defaultArgs?: string[]
  defaultEnv?: Record<string, string>
  defaultCwd?: string
  maxOutputSize?: number
  killSignal?: NodeJS.Signals
}

/**
 * CLI tool state
 */
interface CLIToolState {
  command: string
  process: ProcessState
  streams: StreamData
  metrics: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageDuration: number
  }
}

/**
 * L0 CLI Tool Primitive
 * Command line tool wrapper with process management and I/O streaming
 */
export class CLIToolPrimitive extends L0ExternalConstruct {
  private currentProcess: any = null // In real implementation, would be ChildProcess
  private durations: number[] = []
  
  private state: CLIToolState = {
    command: '',
    process: {
      status: 'idle'
    },
    streams: {
      stdout: [],
      stderr: [],
      combined: []
    },
    metrics: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0
    }
  }
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-cli-tool-primitive',
    name: 'CLI Tool Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Pattern,
    description: 'Command line tool wrapper with process spawning, I/O streaming, and environment control',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'integration', 'cli'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['cli', 'process', 'command', 'terminal', 'shell'],
    inputs: [
      {
        name: 'command',
        type: 'string',
        description: 'CLI command to execute',
        required: true
      },
      {
        name: 'defaultArgs',
        type: 'array',
        description: 'Default command arguments',
        required: false,
        defaultValue: []
      },
      {
        name: 'defaultEnv',
        type: 'object',
        description: 'Default environment variables',
        required: false,
        defaultValue: {}
      },
      {
        name: 'defaultCwd',
        type: 'string',
        description: 'Default working directory',
        required: false,
        defaultValue: typeof process !== 'undefined' ? process.cwd() : '/'
      },
      {
        name: 'maxOutputSize',
        type: 'number',
        description: 'Maximum output buffer size in bytes',
        required: false,
        defaultValue: 1048576 // 1MB
      }
    ],
    outputs: [
      {
        name: 'executor',
        type: 'object',
        description: 'CLI executor for running commands'
      },
      {
        name: 'process',
        type: 'object',
        description: 'Current process state'
      },
      {
        name: 'streams',
        type: 'object',
        description: 'I/O stream data'
      },
      {
        name: 'state',
        type: 'object',
        description: 'Complete CLI tool state'
      }
    ],
    security: [
      {
        aspect: 'command-injection',
        description: 'Risk of command injection attacks',
        severity: 'critical',
        recommendations: [
          'Validate and sanitize all inputs',
          'Use argument arrays instead of shell strings',
          'Restrict allowed commands via whitelist',
          'Run in sandboxed environment'
        ]
      },
      {
        aspect: 'resource-consumption',
        description: 'Processes can consume system resources',
        severity: 'high',
        recommendations: [
          'Implement timeouts for all executions',
          'Monitor resource usage',
          'Limit concurrent processes',
          'Set memory and CPU limits'
        ]
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'cpu-seconds',
          unit: 'seconds',
          costPerUnit: 0.00001,
          typicalUsage: 36000
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'Process Manager'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Execute a CLI command',
        code: `const cli = new CLIToolPrimitive()
await cli.initialize({
  command: 'git',
  defaultArgs: ['--version']
})

const executor = cli.getOutput('executor')
const result = await executor.run()
console.log(result.stdout)`,
        language: 'typescript'
      },
      {
        title: 'Advanced Usage',
        description: 'Execute with custom options',
        code: `const result = await executor.run({
  args: ['log', '--oneline', '-n', '10'],
  cwd: '/path/to/repo',
  env: { GIT_AUTHOR_NAME: 'Test User' }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always validate command inputs',
      'Use timeouts to prevent hanging processes',
      'Handle both stdout and stderr',
      'Clean up resources after execution',
      'Log command executions for audit'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 40,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(CLIToolPrimitive.definition)
  }

  /**
   * Parse external resource definition
   */
  parseDefinition(input: string | object): any {
    if (typeof input === 'string') {
      return { command: input }
    }
    return input
  }

  /**
   * Validate external resource configuration
   */
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    
    if (!config.command) {
      errors.push('Command is required')
    } else if (typeof config.command !== 'string') {
      errors.push('Command must be a string')
    }
    
    // Security validation
    const dangerousCommands = ['rm', 'del', 'format', 'dd', 'mkfs']
    const commandBase = config.command.split(/\s+/)[0].toLowerCase()
    if (dangerousCommands.includes(commandBase)) {
      errors.push(`Potentially dangerous command: ${commandBase}`)
    }
    
    if (config.defaultArgs && !Array.isArray(config.defaultArgs)) {
      errors.push('Default args must be an array')
    }
    
    if (config.defaultEnv && typeof config.defaultEnv !== 'object') {
      errors.push('Default env must be an object')
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Get the external resource configuration
   */
  getConfiguration(): any {
    return {
      cli: {
        command: this.state.command,
        defaultArgs: this.getInput<string[]>('defaultArgs') || [],
        defaultEnv: this.getInput<Record<string, string>>('defaultEnv') || {},
        defaultCwd: this.getInput<string>('defaultCwd') || (typeof process !== 'undefined' ? process.cwd() : '/'),
        maxOutputSize: this.getInput<number>('maxOutputSize') || 1048576
      },
      process: this.state.process,
      streams: this.state.streams,
      metrics: this.state.metrics
    }
  }

  /**
   * Clear stream buffers
   */
  private clearStreams(): void {
    this.state.streams = {
      stdout: [],
      stderr: [],
      combined: []
    }
    this.setOutput('streams', this.state.streams)
  }

  /**
   * Add to stream buffer
   */
  private addToStream(type: 'stdout' | 'stderr', data: string): void {
    const maxSize = this.getInput<number>('maxOutputSize') || 1048576
    const lines = data.split('\n').filter(line => line.length > 0)
    
    // Add to specific stream
    this.state.streams[type].push(...lines)
    
    // Add to combined stream
    lines.forEach(line => {
      this.state.streams.combined.push({
        type,
        data: line,
        timestamp: Date.now()
      })
    })
    
    // Enforce size limits (crude approximation)
    const totalSize = JSON.stringify(this.state.streams).length
    if (totalSize > maxSize) {
      // Remove oldest entries
      const removeCount = Math.floor(this.state.streams.combined.length * 0.1)
      this.state.streams.stdout.splice(0, removeCount)
      this.state.streams.stderr.splice(0, removeCount)
      this.state.streams.combined.splice(0, removeCount)
    }
    
    this.setOutput('streams', this.state.streams)
  }

  /**
   * Execute command (simulated for browser environment)
   */
  private async executeCommand(options: CLIExecutionOptions): Promise<{
    exitCode: number
    stdout: string
    stderr: string
    duration: number
  }> {
    const command = this.state.command
    const args = options.args || this.getInput<string[]>('defaultArgs') || []
    const env = { ...(typeof process !== 'undefined' ? process.env : {}), ...this.getInput<object>('defaultEnv'), ...options.env }
    const cwd = options.cwd || this.getInput<string>('defaultCwd') || (typeof process !== 'undefined' ? process.cwd() : '/')
    const timeout = options.timeout || 30000
    
    // Update process state
    this.state.process = {
      status: 'running',
      startTime: Date.now()
    }
    this.updateState()
    
    // In a real implementation, this would use child_process.spawn
    // For browser environment, we'll simulate the execution
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      // Simulate process execution
      setTimeout(() => {
        const duration = Date.now() - startTime
        
        // Simulate different outcomes based on command
        let exitCode = 0
        let stdout = ''
        let stderr = ''
        
        if (command === 'git' && args[0] === '--version') {
          stdout = 'git version 2.39.0'
        } else if (command === 'npm' && args[0] === 'list') {
          stdout = '├── react@18.2.0\n├── typescript@5.0.0\n└── vite@5.0.0'
        } else if (command === 'failing-command') {
          exitCode = 1
          stderr = 'Command not found: failing-command'
        } else {
          stdout = `Executed: ${command} ${args.join(' ')}\nCWD: ${cwd}\nTimestamp: ${new Date().toISOString()}`
        }
        
        // Add to streams
        if (stdout) this.addToStream('stdout', stdout)
        if (stderr) this.addToStream('stderr', stderr)
        
        // Update process state
        this.state.process = {
          status: exitCode === 0 ? 'completed' : 'error',
          exitCode,
          startTime,
          endTime: Date.now(),
          duration
        }
        
        // Update metrics
        this.state.metrics.totalExecutions++
        if (exitCode === 0) {
          this.state.metrics.successfulExecutions++
        } else {
          this.state.metrics.failedExecutions++
        }
        
        this.durations.push(duration)
        if (this.durations.length > 100) this.durations.shift()
        
        this.state.metrics.averageDuration = 
          this.durations.reduce((a, b) => a + b, 0) / this.durations.length
        
        this.updateState()
        
        resolve({ exitCode, stdout, stderr, duration })
      }, Math.random() * 2000 + 500) // Simulate variable execution time
      
      // Timeout handling
      setTimeout(() => {
        if (this.state.process.status === 'running') {
          this.state.process = {
            status: 'killed',
            exitCode: -1,
            startTime,
            endTime: Date.now(),
            duration: timeout
          }
          this.state.metrics.failedExecutions++
          this.updateState()
          
          reject(new Error(`Command timed out after ${timeout}ms`))
        }
      }, timeout)
    })
  }

  /**
   * Kill running process
   */
  private killProcess(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    if (this.state.process.status !== 'running') {
      return false
    }
    
    // In real implementation, would send signal to process
    this.state.process = {
      ...this.state.process,
      status: 'killed',
      exitCode: -1,
      endTime: Date.now()
    }
    
    if (this.state.process.startTime) {
      this.state.process.duration = (this.state.process.endTime || Date.now()) - this.state.process.startTime
    }
    
    this.updateState()
    return true
  }

  /**
   * Update state and notify
   */
  private updateState(): void {
    this.setOutput('process', this.state.process)
    this.setOutput('state', this.state)
  }

  /**
   * Create CLI executor
   */
  private createExecutor() {
    return {
      run: async (options: CLIExecutionOptions = {}) => {
        if (this.state.process.status === 'running') {
          throw new Error('Process already running')
        }
        
        this.clearStreams()
        return await this.executeCommand(options)
      },
      
      runWithStreaming: async function* (this: any, options: CLIExecutionOptions = {}) {
        // In real implementation, would stream output as it arrives
        const result = await this.executeCommand(options)
        
        // Simulate streaming
        const lines = result.stdout.split('\n')
        for (const line of lines) {
          yield { type: 'stdout' as const, data: line }
        }
        
        if (result.stderr) {
          const errorLines = result.stderr.split('\n')
          for (const line of errorLines) {
            yield { type: 'stderr' as const, data: line }
          }
        }
        
        return result
      }.bind(this),
      
      kill: (signal?: NodeJS.Signals) => this.killProcess(signal),
      
      getStreams: () => this.state.streams,
      
      getProcess: () => this.state.process,
      
      getMetrics: () => this.state.metrics,
      
      clearStreams: () => this.clearStreams()
    }
  }

  /**
   * Initialize the CLI tool
   */
  protected async onInitialize(): Promise<void> {
    this.state.command = this.getInput<string>('command') || ''
    
    const executor = this.createExecutor()
    this.setOutput('executor', executor)
    this.setOutput('process', this.state.process)
    this.setOutput('streams', this.state.streams)
    this.setOutput('state', this.state)
  }

  /**
   * Clean up on destroy
   */
  protected async onDestroy(): Promise<void> {
    if (this.state.process.status === 'running') {
      this.killProcess('SIGKILL')
    }
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <CLIToolPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the CLI tool primitive
 */
const CLIToolPrimitiveComponent: React.FC<{ construct: CLIToolPrimitive }> = ({ construct }) => {
  const [state, setState] = useState<CLIToolState>({
    command: '',
    process: { status: 'idle' },
    streams: { stdout: [], stderr: [], combined: [] },
    metrics: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0
    }
  })

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const currentState = construct['getOutput']('state')
      if (currentState) setState(currentState)
    }, 100)

    return () => clearInterval(updateInterval)
  }, [construct])

  const successRate = state.metrics.totalExecutions > 0
    ? ((state.metrics.successfulExecutions / state.metrics.totalExecutions) * 100).toFixed(1)
    : '0.0'

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '4px', 
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>CLI Tool: {state.command}</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> 
        <span style={{ 
          marginLeft: '8px',
          color: state.process.status === 'running' ? 'blue' : 
                 state.process.status === 'completed' ? 'green' : 
                 state.process.status === 'error' ? 'red' : 'gray'
        }}>
          {state.process.status}
        </span>
        {state.process.exitCode !== undefined && (
          <span> (exit code: {state.process.exitCode})</span>
        )}
      </div>
      
      {state.process.duration && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Duration:</strong> {state.process.duration}ms
        </div>
      )}
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Executions:</strong> {state.metrics.totalExecutions} total
        ({state.metrics.successfulExecutions} successful, {state.metrics.failedExecutions} failed)
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Success Rate:</strong> {successRate}%
        {state.metrics.averageDuration > 0 && (
          <span> | <strong>Avg Duration:</strong> {state.metrics.averageDuration.toFixed(0)}ms</span>
        )}
      </div>
      
      {state.streams.combined.length > 0 && (
        <div>
          <strong>Output:</strong>
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '8px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '11px',
            lineHeight: '1.4'
          }}>
            {state.streams.combined.slice(-20).map((entry, i) => (
              <div key={i} style={{ color: entry.type === 'stderr' ? 'red' : 'inherit' }}>
                <span style={{ opacity: 0.6 }}>[{entry.type}]</span> {entry.data}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Export factory function
export const createCLIToolPrimitive = () => new CLIToolPrimitive()

// Export definition for catalog registration
export const cliToolPrimitiveDefinition = CLIToolPrimitive.definition