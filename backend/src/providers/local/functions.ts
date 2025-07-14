import {
  FunctionProvider,
  FunctionDefinition,
  FunctionExecution,
  FunctionResult,
  ProviderConfig
} from '../types.js'
import { fork, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface ExecutionProcess {
  id: string
  process: ChildProcess
  startTime: Date
  timeout?: NodeJS.Timeout
}

interface ExecutionRecord {
  id: string
  functionName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  result?: any
  error?: string
  startTime: Date
  endTime?: Date
  duration?: number
}

/**
 * Local function provider using Node.js child processes
 */
export class LocalFunctionProvider implements FunctionProvider {
  private config: ProviderConfig
  private functionsPath: string
  private functions: Map<string, FunctionDefinition> = new Map()
  private executions: Map<string, ExecutionRecord> = new Map()
  private processes: Map<string, ExecutionProcess> = new Map()
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.functionsPath = path.join(
      config.options?.functionsPath || './data/functions',
      config.projectId
    )
  }
  
  async initialize(): Promise<void> {
    // Ensure functions directory exists
    await fs.mkdir(this.functionsPath, { recursive: true })
    
    // Load function definitions
    await this.loadFunctions()
  }
  
  async shutdown(): Promise<void> {
    // Kill all running processes
    for (const execution of this.processes.values()) {
      if (execution.timeout) {
        clearTimeout(execution.timeout)
      }
      execution.process.kill('SIGTERM')
    }
    this.processes.clear()
  }
  
  private async loadFunctions(): Promise<void> {
    try {
      const manifestPath = path.join(this.functionsPath, 'manifest.json')
      const data = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(data) as FunctionDefinition[]
      
      manifest.forEach(func => {
        this.functions.set(func.name, func)
      })
    } catch (error) {
      // No manifest yet
      if ((error as any).code !== 'ENOENT') {
        console.error('Error loading functions manifest:', error)
      }
    }
  }
  
  private async saveFunctions(): Promise<void> {
    const manifestPath = path.join(this.functionsPath, 'manifest.json')
    const manifest = Array.from(this.functions.values())
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  }
  
  async deploy(definition: FunctionDefinition, code: string): Promise<void> {
    // Validate function definition
    if (!definition.name || !definition.handler) {
      throw new Error('Function name and handler are required')
    }
    
    // Save function code
    const functionDir = path.join(this.functionsPath, definition.name)
    await fs.mkdir(functionDir, { recursive: true })
    
    const codePath = path.join(functionDir, 'index.js')
    await fs.writeFile(codePath, code)
    
    // Update function definition
    const updatedDefinition: FunctionDefinition = {
      ...definition,
      runtime: definition.runtime || 'nodejs18',
      timeout: definition.timeout || 30000,
      memory: definition.memory || 128,
      environment: definition.environment || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.functions.set(definition.name, updatedDefinition)
    await this.saveFunctions()
  }
  
  async invoke(functionName: string, payload?: any): Promise<FunctionResult> {
    const func = this.functions.get(functionName)
    if (!func) {
      throw new Error(`Function ${functionName} not found`)
    }
    
    const executionId = crypto.randomUUID()
    const startTime = new Date()
    
    // Create execution record
    const execution: ExecutionRecord = {
      id: executionId,
      functionName,
      status: 'pending',
      startTime
    }
    this.executions.set(executionId, execution)
    
    try {
      // Execute function in child process
      const result = await this.executeFunction(func, payload, executionId)
      
      // Update execution record
      execution.status = 'completed'
      execution.result = result
      execution.endTime = new Date()
      execution.duration = execution.endTime.getTime() - startTime.getTime()
      
      return {
        statusCode: 200,
        body: result,
        headers: {},
        executionId
      }
    } catch (error) {
      // Update execution record
      execution.status = 'failed'
      execution.error = (error as Error).message
      execution.endTime = new Date()
      execution.duration = execution.endTime.getTime() - startTime.getTime()
      
      return {
        statusCode: 500,
        body: { error: (error as Error).message },
        headers: {},
        executionId
      }
    }
  }
  
  private async executeFunction(func: FunctionDefinition, payload: any, executionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const functionDir = path.join(this.functionsPath, func.name)
      const workerPath = path.join(__dirname, 'function-worker.js')
      
      // Fork child process
      const child = fork(workerPath, [], {
        cwd: functionDir,
        env: {
          ...process.env,
          ...func.environment,
          FUNCTION_HANDLER: func.handler,
          FUNCTION_TIMEOUT: String(func.timeout || 30000)
        }
      })
      
      const processInfo: ExecutionProcess = {
        id: executionId,
        process: child,
        startTime: new Date()
      }
      
      // Set timeout
      if (func.timeout) {
        processInfo.timeout = setTimeout(() => {
          child.kill('SIGTERM')
          this.processes.delete(executionId)
          const execution = this.executions.get(executionId)
          if (execution) {
            execution.status = 'timeout'
          }
          reject(new Error(`Function timed out after ${func.timeout}ms`))
        }, func.timeout)
      }
      
      this.processes.set(executionId, processInfo)
      
      // Handle messages from child
      child.on('message', (message: any) => {
        if (message.type === 'result') {
          if (processInfo.timeout) {
            clearTimeout(processInfo.timeout)
          }
          this.processes.delete(executionId)
          resolve(message.data)
        } else if (message.type === 'error') {
          if (processInfo.timeout) {
            clearTimeout(processInfo.timeout)
          }
          this.processes.delete(executionId)
          reject(new Error(message.error))
        }
      })
      
      child.on('error', (error) => {
        if (processInfo.timeout) {
          clearTimeout(processInfo.timeout)
        }
        this.processes.delete(executionId)
        reject(error)
      })
      
      child.on('exit', (code) => {
        if (code !== 0) {
          if (processInfo.timeout) {
            clearTimeout(processInfo.timeout)
          }
          this.processes.delete(executionId)
          reject(new Error(`Function exited with code ${code}`))
        }
      })
      
      // Send payload to child
      child.send({ type: 'invoke', payload })
    })
  }
  
  async list(): Promise<FunctionDefinition[]> {
    return Array.from(this.functions.values())
  }
  
  async get(functionName: string): Promise<FunctionDefinition | null> {
    return this.functions.get(functionName) || null
  }
  
  async remove(functionName: string): Promise<void> {
    const func = this.functions.get(functionName)
    if (!func) {
      throw new Error(`Function ${functionName} not found`)
    }
    
    // Delete function files
    const functionDir = path.join(this.functionsPath, functionName)
    await fs.rm(functionDir, { recursive: true, force: true })
    
    // Remove from registry
    this.functions.delete(functionName)
    await this.saveFunctions()
  }
  
  async getLogs(functionName: string, options?: { startTime?: Date; endTime?: Date; limit?: number }): Promise<string[]> {
    // Filter executions for this function
    const logs: string[] = []
    const limit = options?.limit || 100
    
    for (const execution of this.executions.values()) {
      if (execution.functionName !== functionName) continue
      
      if (options?.startTime && execution.startTime < options.startTime) continue
      if (options?.endTime && execution.startTime > options.endTime) continue
      
      logs.push(`[${execution.startTime.toISOString()}] Execution ${execution.id}: ${execution.status}`);
      
      if (execution.error) {
        logs.push(`  Error: ${execution.error}`)
      }
      
      if (execution.duration) {
        logs.push(`  Duration: ${execution.duration}ms`)
      }
      
      if (logs.length >= limit) break
    }
    
    return logs
  }
  
  async getExecution(executionId: string): Promise<FunctionExecution | null> {
    const execution = this.executions.get(executionId)
    if (!execution) return null
    
    return {
      id: execution.id,
      functionName: execution.functionName,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.duration,
      result: execution.result,
      error: execution.error
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    return {
      status: 'healthy',
      details: {
        functions: this.functions.size,
        activeExecutions: this.processes.size,
        totalExecutions: this.executions.size
      }
    }
  }
}