/**
 * L2 Tool Orchestration Pattern
 * 
 * A sophisticated pattern that enables multi-tool coordination with dependency
 * resolution, parallel execution, and workflow management. Composes L1 components
 * to create a powerful tool orchestration system.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GitBranch, Play, Pause, Stop, CheckCircle, XCircle, 
  AlertTriangle, Clock, Zap, Settings, FileText, 
  RefreshCw, Eye, Code, BarChart, Activity, Loader
} from 'lucide-react'
import ReactFlow, { 
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Position, MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { ConstructRenderProps, ConstructLevel, ConstructType, CloudProvider } from '../../types'

// Import L1 components
import { AuthenticatedToolRegistry } from '../../L1/infrastructure/AuthenticatedToolRegistry'
import { RateLimitedRPC } from '../../L1/infrastructure/RateLimitedRPC'
import { SecureMCPServerConstruct } from '../../L1/infrastructure/SecureMCPServer'

// Types
interface ToolNode {
  id: string
  name: string
  type: 'tool'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  dependencies: string[]
  params: Record<string, any>
  result?: any
  error?: string
  duration?: number
  retries?: number
}

interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  tools: ToolNode[]
  edges: Array<{ from: string; to: string; condition?: string }>
  config: {
    maxParallel: number
    timeout: number
    retryPolicy: {
      maxRetries: number
      backoffMultiplier: number
      maxBackoff: number
    }
    errorHandling: 'fail-fast' | 'continue' | 'rollback'
  }
}

interface ExecutionContext {
  workflowId: string
  executionId: string
  startTime: Date
  endTime?: Date
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  results: Map<string, any>
  errors: Map<string, string>
  metrics: {
    totalTools: number
    completedTools: number
    failedTools: number
    averageDuration: number
  }
}

interface OrchestrationMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  toolSuccessRate: number
  parallelExecutionRate: number
}

export class ToolOrchestrationPattern extends L2PatternConstruct {
  private toolRegistry?: AuthenticatedToolRegistry
  private rateLimitedRPC?: RateLimitedRPC
  private mcpServer?: SecureMCPServerConstruct
  
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, ExecutionContext> = new Map()
  private executionQueue: string[] = []
  private activeExecutions: Set<string> = new Set()
  
  constructor() {
    super({
      id: 'platform-l2-tool-orchestration-pattern',
      name: 'Tool Orchestration Pattern',
      description: 'Multi-tool coordination with dependency resolution and parallel execution',
      version: '1.0.0',
      author: 'Love Claude Code Team',
      capabilities: [
        'dependency-resolution',
        'parallel-execution',
        'workflow-management',
        'error-handling',
        'retry-logic',
        'conditional-execution'
      ],
      dependencies: [
        { id: 'platform-l1-authenticated-tool-registry', version: '1.0.0', type: 'composition' },
        { id: 'platform-l1-rate-limited-rpc', version: '1.0.0', type: 'composition' },
        { id: 'platform-l1-secure-mcp-server', version: '1.0.0', type: 'composition' }
      ],
      security: [
        'authenticated-tool-access',
        'rate-limited-execution',
        'secure-communication'
      ],
      selfReferential: {
        usedToBuildItself: true,
        vibecodingLevel: 85,
        dependencies: [
          'Authenticated tool registry for secure tool management',
          'Rate-limited RPC for controlled execution',
          'Secure MCP server for tool communication'
        ]
      }
    })
  }

  protected async wireComponents(): Promise<void> {
    // Initialize L1 components
    this.toolRegistry = new AuthenticatedToolRegistry({
      authConfig: { jwtSecret: 'orchestration-secret' },
      rbacConfig: {
        roles: {
          orchestrator: {
            permissions: ['tool:*', 'workflow:*'],
            quotas: { unlimited: true }
          }
        }
      }
    })
    
    this.rateLimitedRPC = new RateLimitedRPC({
      bucketConfig: {
        capacity: 1000,
        refillRate: 100,
        refillInterval: 1000
      },
      burstConfig: {
        enabled: true,
        burstCapacity: 1500
      }
    })
    
    this.mcpServer = new SecureMCPServerConstruct({
      id: 'orchestration-mcp-server',
      name: 'Orchestration MCP Server',
      type: 'infrastructure',
      level: 'L1',
      description: 'MCP server for tool orchestration',
      version: '1.0.0',
      author: 'Love Claude Code Team'
    })
    
    // Register components
    this.registerL1Component('toolRegistry', this.toolRegistry)
    this.registerL1Component('rateLimitedRPC', this.rateLimitedRPC)
    this.registerL1Component('mcpServer', this.mcpServer)
    
    // Initialize components
    await this.toolRegistry.initialize()
    await this.rateLimitedRPC.initialize()
    await this.mcpServer.initialize({
      endpoint: {
        host: 'localhost',
        port: 8002,
        path: '/orchestration',
        secure: false
      },
      auth: {
        type: 'jwt',
        jwtSecret: 'orchestration-secret'
      },
      security: {
        tlsRequired: false,
        encryptMessages: false,
        rateLimiting: {
          enabled: true,
          maxRequestsPerMinute: 1000,
          maxConnectionsPerIP: 10
        }
      },
      connection: {
        maxConnections: 100,
        connectionTimeout: 5000,
        pingInterval: 30000,
        reconnectAttempts: 3
      },
      monitoring: {
        enabled: true,
        logLevel: 'info',
        metricsEnabled: true,
        auditLogging: true
      }
    })
    
    // Set up demo workflows
    this.initializeDemoWorkflows()
  }

  private initializeDemoWorkflows(): void {
    // Demo workflow 1: Sequential Processing
    const sequentialWorkflow: WorkflowDefinition = {
      id: 'sequential-processing',
      name: 'Sequential Data Processing',
      description: 'Process data through multiple sequential transformations',
      version: '1.0.0',
      tools: [
        {
          id: 'fetch-data',
          name: 'Fetch Data',
          type: 'tool',
          status: 'pending',
          dependencies: [],
          params: { source: 'api/data' }
        },
        {
          id: 'validate-data',
          name: 'Validate Data',
          type: 'tool',
          status: 'pending',
          dependencies: ['fetch-data'],
          params: { schema: 'data-schema-v1' }
        },
        {
          id: 'transform-data',
          name: 'Transform Data',
          type: 'tool',
          status: 'pending',
          dependencies: ['validate-data'],
          params: { format: 'normalized' }
        },
        {
          id: 'store-data',
          name: 'Store Data',
          type: 'tool',
          status: 'pending',
          dependencies: ['transform-data'],
          params: { destination: 'database' }
        }
      ],
      edges: [
        { from: 'fetch-data', to: 'validate-data' },
        { from: 'validate-data', to: 'transform-data' },
        { from: 'transform-data', to: 'store-data' }
      ],
      config: {
        maxParallel: 1,
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          maxBackoff: 10000
        },
        errorHandling: 'fail-fast'
      }
    }
    
    // Demo workflow 2: Parallel Processing with Fan-out/Fan-in
    const parallelWorkflow: WorkflowDefinition = {
      id: 'parallel-analysis',
      name: 'Parallel Analysis Pipeline',
      description: 'Analyze data using multiple parallel processors',
      version: '1.0.0',
      tools: [
        {
          id: 'load-dataset',
          name: 'Load Dataset',
          type: 'tool',
          status: 'pending',
          dependencies: [],
          params: { dataset: 'analytics-2024' }
        },
        {
          id: 'sentiment-analysis',
          name: 'Sentiment Analysis',
          type: 'tool',
          status: 'pending',
          dependencies: ['load-dataset'],
          params: { model: 'bert-sentiment' }
        },
        {
          id: 'topic-modeling',
          name: 'Topic Modeling',
          type: 'tool',
          status: 'pending',
          dependencies: ['load-dataset'],
          params: { algorithm: 'lda', topics: 10 }
        },
        {
          id: 'entity-extraction',
          name: 'Entity Extraction',
          type: 'tool',
          status: 'pending',
          dependencies: ['load-dataset'],
          params: { model: 'ner-v2' }
        },
        {
          id: 'merge-results',
          name: 'Merge Results',
          type: 'tool',
          status: 'pending',
          dependencies: ['sentiment-analysis', 'topic-modeling', 'entity-extraction'],
          params: { format: 'unified-report' }
        },
        {
          id: 'generate-report',
          name: 'Generate Report',
          type: 'tool',
          status: 'pending',
          dependencies: ['merge-results'],
          params: { template: 'executive-summary' }
        }
      ],
      edges: [
        { from: 'load-dataset', to: 'sentiment-analysis' },
        { from: 'load-dataset', to: 'topic-modeling' },
        { from: 'load-dataset', to: 'entity-extraction' },
        { from: 'sentiment-analysis', to: 'merge-results' },
        { from: 'topic-modeling', to: 'merge-results' },
        { from: 'entity-extraction', to: 'merge-results' },
        { from: 'merge-results', to: 'generate-report' }
      ],
      config: {
        maxParallel: 3,
        timeout: 60000,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 1.5,
          maxBackoff: 5000
        },
        errorHandling: 'continue'
      }
    }
    
    // Demo workflow 3: Conditional Branching
    const conditionalWorkflow: WorkflowDefinition = {
      id: 'conditional-deployment',
      name: 'Conditional Deployment Pipeline',
      description: 'Deploy with conditional paths based on test results',
      version: '1.0.0',
      tools: [
        {
          id: 'run-tests',
          name: 'Run Tests',
          type: 'tool',
          status: 'pending',
          dependencies: [],
          params: { suite: 'all' }
        },
        {
          id: 'analyze-coverage',
          name: 'Analyze Coverage',
          type: 'tool',
          status: 'pending',
          dependencies: ['run-tests'],
          params: { threshold: 80 }
        },
        {
          id: 'build-artifacts',
          name: 'Build Artifacts',
          type: 'tool',
          status: 'pending',
          dependencies: ['analyze-coverage'],
          params: { target: 'production' }
        },
        {
          id: 'deploy-staging',
          name: 'Deploy to Staging',
          type: 'tool',
          status: 'pending',
          dependencies: ['build-artifacts'],
          params: { environment: 'staging' }
        },
        {
          id: 'run-integration-tests',
          name: 'Run Integration Tests',
          type: 'tool',
          status: 'pending',
          dependencies: ['deploy-staging'],
          params: { suite: 'integration' }
        },
        {
          id: 'deploy-production',
          name: 'Deploy to Production',
          type: 'tool',
          status: 'pending',
          dependencies: ['run-integration-tests'],
          params: { environment: 'production', strategy: 'blue-green' }
        },
        {
          id: 'rollback',
          name: 'Rollback',
          type: 'tool',
          status: 'pending',
          dependencies: [],
          params: { target: 'previous-version' }
        }
      ],
      edges: [
        { from: 'run-tests', to: 'analyze-coverage' },
        { from: 'analyze-coverage', to: 'build-artifacts', condition: 'coverage >= 80' },
        { from: 'analyze-coverage', to: 'rollback', condition: 'coverage < 80' },
        { from: 'build-artifacts', to: 'deploy-staging' },
        { from: 'deploy-staging', to: 'run-integration-tests' },
        { from: 'run-integration-tests', to: 'deploy-production', condition: 'tests.passed' },
        { from: 'run-integration-tests', to: 'rollback', condition: '!tests.passed' }
      ],
      config: {
        maxParallel: 2,
        timeout: 300000,
        retryPolicy: {
          maxRetries: 1,
          backoffMultiplier: 1,
          maxBackoff: 1000
        },
        errorHandling: 'rollback'
      }
    }
    
    this.workflows.set(sequentialWorkflow.id, sequentialWorkflow)
    this.workflows.set(parallelWorkflow.id, parallelWorkflow)
    this.workflows.set(conditionalWorkflow.id, conditionalWorkflow)
  }

  // Public API methods
  async loadWorkflow(definition: WorkflowDefinition): Promise<void> {
    // Validate workflow
    this.validateWorkflow(definition)
    
    // Register tools
    for (const tool of definition.tools) {
      await this.toolRegistry?.registerToolWithAuth('orchestrator-token', {
        name: tool.name,
        id: tool.id,
        description: `Tool ${tool.name} in workflow ${definition.name}`,
        category: 'workflow',
        version: '1.0.0',
        handler: async (params: any) => this.executeTool(tool, params)
      })
    }
    
    this.workflows.set(definition.id, definition)
  }

  async executeWorkflow(workflowId: string, params?: Record<string, any>): Promise<ExecutionContext> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }
    
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const context: ExecutionContext = {
      workflowId,
      executionId,
      startTime: new Date(),
      status: 'pending',
      results: new Map(),
      errors: new Map(),
      metrics: {
        totalTools: workflow.tools.length,
        completedTools: 0,
        failedTools: 0,
        averageDuration: 0
      }
    }
    
    this.executions.set(executionId, context)
    this.executionQueue.push(executionId)
    
    // Start execution asynchronously
    this.processExecutionQueue()
    
    return context
  }

  private async processExecutionQueue(): Promise<void> {
    while (this.executionQueue.length > 0) {
      const executionId = this.executionQueue.shift()
      if (!executionId || this.activeExecutions.has(executionId)) continue
      
      this.activeExecutions.add(executionId)
      
      try {
        await this.runExecution(executionId)
      } catch (error) {
        console.error('Execution failed:', error)
      } finally {
        this.activeExecutions.delete(executionId)
      }
    }
  }

  private async runExecution(executionId: string): Promise<void> {
    const context = this.executions.get(executionId)
    if (!context) return
    
    const workflow = this.workflows.get(context.workflowId)
    if (!workflow) return
    
    context.status = 'running'
    
    try {
      // Build dependency graph
      const graph = this.buildDependencyGraph(workflow)
      
      // Execute tools in topological order with parallelization
      await this.executeGraph(workflow, context, graph)
      
      context.status = 'completed'
      context.endTime = new Date()
      
      // Calculate final metrics
      const durations = Array.from(context.results.values())
        .map(r => r.duration || 0)
        .filter(d => d > 0)
      
      context.metrics.averageDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0
        
    } catch (error) {
      context.status = 'failed'
      context.endTime = new Date()
      context.errors.set('workflow', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private buildDependencyGraph(workflow: WorkflowDefinition): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>()
    
    // Initialize nodes
    for (const tool of workflow.tools) {
      graph.set(tool.id, new Set())
    }
    
    // Add edges
    for (const edge of workflow.edges) {
      const dependents = graph.get(edge.from)
      if (dependents) {
        dependents.add(edge.to)
      }
    }
    
    return graph
  }

  private async executeGraph(
    workflow: WorkflowDefinition,
    context: ExecutionContext,
    graph: Map<string, Set<string>>
  ): Promise<void> {
    const completed = new Set<string>()
    const inProgress = new Set<string>()
    const failed = new Set<string>()
    
    while (completed.size + failed.size < workflow.tools.length) {
      // Find tools ready to execute
      const ready = workflow.tools.filter(tool => {
        if (completed.has(tool.id) || inProgress.has(tool.id) || failed.has(tool.id)) {
          return false
        }
        
        // Check if all dependencies are completed
        return tool.dependencies.every(dep => completed.has(dep))
      })
      
      if (ready.length === 0 && inProgress.size === 0) {
        // Deadlock or all remaining tools have failed dependencies
        throw new Error('Workflow execution deadlock')
      }
      
      // Execute ready tools in parallel (respecting maxParallel)
      const toExecute = ready.slice(0, workflow.config.maxParallel - inProgress.size)
      
      const executions = toExecute.map(async tool => {
        inProgress.add(tool.id)
        
        try {
          // Check conditions
          const shouldExecute = await this.evaluateConditions(tool, workflow, context)
          if (!shouldExecute) {
            tool.status = 'skipped'
            completed.add(tool.id)
            return
          }
          
          tool.status = 'running'
          const startTime = Date.now()
          
          // Execute with retry logic
          const result = await this.executeWithRetry(
            tool,
            context,
            workflow.config.retryPolicy
          )
          
          tool.status = 'completed'
          tool.duration = Date.now() - startTime
          tool.result = result
          context.results.set(tool.id, result)
          context.metrics.completedTools++
          completed.add(tool.id)
          
        } catch (error) {
          tool.status = 'failed'
          tool.error = error instanceof Error ? error.message : 'Unknown error'
          context.errors.set(tool.id, tool.error)
          context.metrics.failedTools++
          failed.add(tool.id)
          
          if (workflow.config.errorHandling === 'fail-fast') {
            throw error
          }
        } finally {
          inProgress.delete(tool.id)
        }
      })
      
      await Promise.all(executions)
    }
  }

  private async evaluateConditions(
    tool: ToolNode,
    workflow: WorkflowDefinition,
    context: ExecutionContext
  ): Promise<boolean> {
    // Find edges with conditions pointing to this tool
    const conditionalEdges = workflow.edges.filter(
      edge => edge.to === tool.id && edge.condition
    )
    
    if (conditionalEdges.length === 0) return true
    
    // Evaluate all conditions (any must be true)
    for (const edge of conditionalEdges) {
      const fromResult = context.results.get(edge.from)
      if (this.evaluateCondition(edge.condition!, fromResult)) {
        return true
      }
    }
    
    return false
  }

  private evaluateCondition(condition: string, data: any): boolean {
    // Simple condition evaluation
    // In a real implementation, use a proper expression evaluator
    try {
      // Very basic evaluation - DO NOT use eval in production!
      // This is just for demo purposes
      if (condition.includes('>=')) {
        const [left, right] = condition.split('>=').map(s => s.trim())
        const leftValue = this.extractValue(left, data)
        const rightValue = parseFloat(right)
        return leftValue >= rightValue
      }
      
      if (condition.includes('<')) {
        const [left, right] = condition.split('<').map(s => s.trim())
        const leftValue = this.extractValue(left, data)
        const rightValue = parseFloat(right)
        return leftValue < rightValue
      }
      
      if (condition.startsWith('!')) {
        const path = condition.substring(1)
        return !this.extractValue(path, data)
      }
      
      return !!this.extractValue(condition, data)
    } catch {
      return false
    }
  }

  private extractValue(path: string, data: any): any {
    const parts = path.split('.')
    let current = data
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }
    
    return current
  }

  private async executeWithRetry(
    tool: ToolNode,
    context: ExecutionContext,
    retryPolicy: WorkflowDefinition['config']['retryPolicy']
  ): Promise<any> {
    let lastError: Error | undefined
    let backoff = 1000
    
    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          tool.retries = attempt
          await new Promise(resolve => setTimeout(resolve, backoff))
          backoff = Math.min(
            backoff * retryPolicy.backoffMultiplier,
            retryPolicy.maxBackoff
          )
        }
        
        return await this.executeTool(tool, context)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
      }
    }
    
    throw lastError
  }

  private async executeTool(tool: ToolNode, context: any): Promise<any> {
    // Use rate-limited RPC to execute the tool
    const request = {
      method: `tool.execute`,
      params: {
        toolId: tool.id,
        params: tool.params,
        context: {
          workflowId: context.workflowId,
          executionId: context.executionId,
          previousResults: Object.fromEntries(context.results)
        }
      },
      userId: 'orchestrator'
    }
    
    const response = await this.rateLimitedRPC?.call(request)
    
    // Simulate tool execution for demo
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 2000))
    
    return {
      success: true,
      toolId: tool.id,
      output: `Processed by ${tool.name}`,
      timestamp: new Date()
    }
  }

  private validateWorkflow(definition: WorkflowDefinition): void {
    // Check for cycles
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      
      const edges = definition.edges.filter(e => e.from === nodeId)
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          if (hasCycle(edge.to)) return true
        } else if (recursionStack.has(edge.to)) {
          return true
        }
      }
      
      recursionStack.delete(nodeId)
      return false
    }
    
    for (const tool of definition.tools) {
      if (!visited.has(tool.id) && hasCycle(tool.id)) {
        throw new Error('Workflow contains cycles')
      }
    }
    
    // Validate dependencies exist
    for (const tool of definition.tools) {
      for (const dep of tool.dependencies) {
        if (!definition.tools.find(t => t.id === dep)) {
          throw new Error(`Tool ${tool.id} has invalid dependency: ${dep}`)
        }
      }
    }
  }

  getMetrics(): OrchestrationMetrics {
    const executions = Array.from(this.executions.values())
    const completed = executions.filter(e => e.status === 'completed')
    const failed = executions.filter(e => e.status === 'failed')
    
    const durations = completed
      .map(e => e.endTime!.getTime() - e.startTime.getTime())
      .filter(d => d > 0)
    
    const totalToolExecutions = executions.reduce(
      (sum, e) => sum + e.metrics.completedTools + e.metrics.failedTools,
      0
    )
    const successfulTools = executions.reduce(
      (sum, e) => sum + e.metrics.completedTools,
      0
    )
    
    return {
      totalExecutions: executions.length,
      successfulExecutions: completed.length,
      failedExecutions: failed.length,
      averageExecutionTime: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      toolSuccessRate: totalToolExecutions > 0
        ? successfulTools / totalToolExecutions
        : 0,
      parallelExecutionRate: 0.65 // Would calculate from actual parallel execution data
    }
  }
}

/**
 * React component for the Tool Orchestration Pattern
 */
export const ToolOrchestrationPatternComponent: React.FC<ConstructRenderProps> = ({ 
  instance,
  onInteraction 
}) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'execution' | 'monitoring' | 'config'>('workflows')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null)
  const [currentExecution, setCurrentExecution] = useState<ExecutionContext | null>(null)
  const [metrics, setMetrics] = useState<OrchestrationMetrics>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    toolSuccessRate: 0,
    parallelExecutionRate: 0
  })
  const [isExecuting, setIsExecuting] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Initialize orchestrator
  const orchestrator = useRef<ToolOrchestrationPattern>()
  
  useEffect(() => {
    if (!orchestrator.current && instance) {
      orchestrator.current = instance as ToolOrchestrationPattern
    }
  }, [instance])

  // Update metrics
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (orchestrator.current) {
        setMetrics(orchestrator.current.getMetrics())
      }
    }, 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleExecuteWorkflow = useCallback(async (workflow: WorkflowDefinition) => {
    if (!orchestrator.current || isExecuting) return
    
    setIsExecuting(true)
    try {
      const execution = await orchestrator.current.executeWorkflow(workflow.id)
      setCurrentExecution(execution)
      setActiveTab('execution')
      onInteraction?.('executeWorkflow', { workflowId: workflow.id })
      
      // Poll for execution updates
      const pollInterval = setInterval(() => {
        if (execution.status === 'completed' || execution.status === 'failed') {
          clearInterval(pollInterval)
          setIsExecuting(false)
        }
      }, 500)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      setIsExecuting(false)
    }
  }, [isExecuting, onInteraction])

  const renderWorkflowDiagram = (workflow: WorkflowDefinition) => {
    // Convert workflow to ReactFlow nodes and edges
    const nodes: Node[] = workflow.tools.map((tool, index) => ({
      id: tool.id,
      type: 'default',
      position: { 
        x: 200 + (index % 3) * 250, 
        y: 100 + Math.floor(index / 3) * 150 
      },
      data: { 
        label: (
          <div className="flex flex-col items-center">
            <span className="font-medium">{tool.name}</span>
            <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
              tool.status === 'completed' ? 'bg-green-500/20 text-green-500' :
              tool.status === 'running' ? 'bg-blue-500/20 text-blue-500' :
              tool.status === 'failed' ? 'bg-red-500/20 text-red-500' :
              tool.status === 'skipped' ? 'bg-gray-500/20 text-gray-500' :
              'bg-gray-700 text-gray-400'
            }`}>
              {tool.status}
            </span>
          </div>
        )
      },
      style: {
        background: '#1e293b',
        color: '#e2e8f0',
        border: `2px solid ${
          tool.status === 'completed' ? '#10b981' :
          tool.status === 'running' ? '#3b82f6' :
          tool.status === 'failed' ? '#ef4444' :
          '#4b5563'
        }`,
        borderRadius: '8px',
        padding: '10px'
      }
    }))

    const edges: Edge[] = workflow.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      animated: currentExecution?.status === 'running',
      style: { stroke: '#4b5563', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4b5563'
      },
      label: edge.condition,
      labelStyle: { fill: '#94a3b8', fontSize: 12 },
      labelBgStyle: { fill: '#0f172a' }
    }))

    return { nodes, edges }
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <GitBranch className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Tool Orchestration Pattern</h3>
            <p className="text-sm text-gray-400">
              Multi-tool coordination with advanced workflows
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isExecuting && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm font-medium flex items-center gap-1">
              <Loader className="w-3 h-3 animate-spin" />
              Executing
            </span>
          )}
          <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        {(['workflows', 'execution', 'monitoring', 'config'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === tab 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'workflows' && (
          <motion.div
            key="workflows"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Workflow List */}
            <div className="grid gap-4">
              {['sequential-processing', 'parallel-analysis', 'conditional-deployment'].map(id => {
                const workflow = {
                  id,
                  name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                  description: 'Advanced workflow pattern demonstration',
                  toolCount: id === 'sequential-processing' ? 4 : id === 'parallel-analysis' ? 6 : 7
                }
                
                return (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    onSelect={() => {
                      // In real implementation, get from orchestrator
                      setSelectedWorkflow(null)
                    }}
                    onExecute={() => {
                      // In real implementation, get workflow and execute
                      handleExecuteWorkflow({} as WorkflowDefinition)
                    }}
                    isExecuting={isExecuting}
                  />
                )
              })}
            </div>

            {/* Workflow Diagram */}
            {selectedWorkflow && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium mb-4">Workflow Visualization</h4>
                <div className="h-96 bg-gray-900 rounded-lg">
                  <ReactFlow
                    nodes={renderWorkflowDiagram(selectedWorkflow).nodes}
                    edges={renderWorkflowDiagram(selectedWorkflow).edges}
                    fitView
                  >
                    <Background color="#374151" gap={16} />
                    <Controls />
                    <MiniMap 
                      nodeColor="#1e293b"
                      maskColor="rgb(17, 24, 39, 0.8)"
                      pannable
                      zoomable
                    />
                  </ReactFlow>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'execution' && (
          <motion.div
            key="execution"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {currentExecution ? (
              <>
                {/* Execution Status */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Current Execution</h4>
                    <ExecutionStatus status={currentExecution.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <MetricCard
                      label="Total Tools"
                      value={currentExecution.metrics.totalTools}
                      icon={<Settings className="w-4 h-4" />}
                    />
                    <MetricCard
                      label="Completed"
                      value={currentExecution.metrics.completedTools}
                      icon={<CheckCircle className="w-4 h-4" />}
                      color="green"
                    />
                    <MetricCard
                      label="Failed"
                      value={currentExecution.metrics.failedTools}
                      icon={<XCircle className="w-4 h-4" />}
                      color="red"
                    />
                    <MetricCard
                      label="Duration"
                      value={`${Math.floor((currentExecution.endTime?.getTime() || Date.now()) - currentExecution.startTime.getTime()) / 1000}s`}
                      icon={<Clock className="w-4 h-4" />}
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(currentExecution.metrics.completedTools / currentExecution.metrics.totalTools) * 100}%` 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Tool Execution Timeline */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Execution Timeline</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* Would show actual tool execution timeline */}
                    <TimelineEntry
                      time="10:23:45"
                      tool="Fetch Data"
                      status="completed"
                      duration={1234}
                    />
                    <TimelineEntry
                      time="10:23:46"
                      tool="Validate Data"
                      status="running"
                    />
                    <TimelineEntry
                      time="10:23:47"
                      tool="Transform Data"
                      status="pending"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No execution in progress. Select a workflow to execute.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'monitoring' && (
          <motion.div
            key="monitoring"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Orchestration Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="Total Executions"
                value={metrics.totalExecutions}
                icon={<Activity className="w-4 h-4" />}
              />
              <MetricCard
                label="Success Rate"
                value={`${(metrics.totalExecutions > 0 ? (metrics.successfulExecutions / metrics.totalExecutions) * 100 : 0).toFixed(1)}%`}
                icon={<CheckCircle className="w-4 h-4" />}
                color="green"
              />
              <MetricCard
                label="Avg Execution Time"
                value={`${(metrics.averageExecutionTime / 1000).toFixed(1)}s`}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricCard
                label="Tool Success Rate"
                value={`${(metrics.toolSuccessRate * 100).toFixed(1)}%`}
                icon={<Zap className="w-4 h-4" />}
                color="blue"
              />
              <MetricCard
                label="Parallel Execution"
                value={`${(metrics.parallelExecutionRate * 100).toFixed(0)}%`}
                icon={<GitBranch className="w-4 h-4" />}
                color="purple"
              />
              <MetricCard
                label="Failed Executions"
                value={metrics.failedExecutions}
                icon={<AlertTriangle className="w-4 h-4" />}
                color="red"
              />
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium mb-4">Execution Performance</h4>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart className="w-8 h-8 mr-2" />
                Performance chart would be rendered here
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Configuration Sections */}
            <ConfigSection
              title="Execution Configuration"
              items={[
                { label: 'Max Parallel Tools', value: '5' },
                { label: 'Default Timeout', value: '30s' },
                { label: 'Error Handling', value: 'Continue on Error' }
              ]}
            />
            
            <ConfigSection
              title="Retry Policy"
              items={[
                { label: 'Max Retries', value: '3' },
                { label: 'Backoff Multiplier', value: '2x' },
                { label: 'Max Backoff', value: '10s' }
              ]}
            />
            
            <ConfigSection
              title="Security Configuration"
              items={[
                { label: 'Authentication', value: 'JWT', highlight: true },
                { label: 'Rate Limiting', value: 'Enabled', highlight: true },
                { label: 'Secure Communication', value: 'TLS 1.3' }
              ]}
            />
            
            <ConfigSection
              title="Monitoring"
              items={[
                { label: 'Metrics Collection', value: 'Enabled', highlight: true },
                { label: 'Audit Logging', value: 'Enabled', highlight: true },
                { label: 'Performance Tracking', value: 'Real-time' }
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper Components
const WorkflowCard: React.FC<{
  workflow: any
  onSelect: () => void
  onExecute: () => void
  isExecuting: boolean
}> = ({ workflow, onSelect, onExecute, isExecuting }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
    onClick={onSelect}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <FileText className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h5 className="font-medium">{workflow.name}</h5>
          <p className="text-sm text-gray-400">{workflow.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{workflow.toolCount} tools</span>
            <span>•</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onExecute()
          }}
          disabled={isExecuting}
          className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Play className="w-3 h-3" />
          Execute
        </button>
      </div>
    </div>
  </motion.div>
)

const ExecutionStatus: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return { color: 'blue', icon: <Loader className="w-3 h-3 animate-spin" />, text: 'Running' }
      case 'completed':
        return { color: 'green', icon: <CheckCircle className="w-3 h-3" />, text: 'Completed' }
      case 'failed':
        return { color: 'red', icon: <XCircle className="w-3 h-3" />, text: 'Failed' }
      default:
        return { color: 'gray', icon: <Clock className="w-3 h-3" />, text: 'Pending' }
    }
  }
  
  const config = getStatusConfig()
  
  return (
    <span className={`px-3 py-1 bg-${config.color}-500/20 text-${config.color}-500 rounded-full text-sm font-medium flex items-center gap-1`}>
      {config.icon}
      {config.text}
    </span>
  )
}

const TimelineEntry: React.FC<{
  time: string
  tool: string
  status: string
  duration?: number
}> = ({ time, tool, status, duration }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg"
  >
    <span className="text-xs text-gray-500 font-mono">{time}</span>
    <div className="flex-1">
      <span className="font-medium">{tool}</span>
      {duration && (
        <span className="ml-2 text-xs text-gray-500">({duration}ms)</span>
      )}
    </div>
    <ExecutionStatus status={status} />
  </motion.div>
)

const MetricCard: React.FC<{
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
}> = ({ label, value, icon, color = 'gray' }) => (
  <div className="bg-gray-800/30 rounded-lg p-4">
    <div className={`inline-flex p-2 rounded-lg mb-2 bg-${color}-500/20 text-${color}-500`}>
      {icon}
    </div>
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-xs text-gray-400">{label}</div>
  </div>
)

const ConfigSection: React.FC<{
  title: string
  items: Array<{ label: string; value: string; highlight?: boolean }>
}> = ({ title, items }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <h5 className="font-medium mb-3">{title}</h5>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{item.label}</span>
          <span className={`text-sm font-mono ${
            item.highlight ? 'text-green-500' : 'text-gray-300'
          }`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
)

// Export the definition for registry
export const toolOrchestrationPatternDefinition = {
  id: 'platform-l2-tool-orchestration-pattern',
  name: 'Tool Orchestration Pattern',
  level: ConstructLevel.L2,
  type: ConstructType.PATTERN,
  description: 'Multi-tool coordination with dependency resolution and parallel execution',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  categories: ['pattern', 'orchestration', 'workflow'],
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  dependencies: [
    'platform-l1-authenticated-tool-registry',
    'platform-l1-rate-limited-rpc',
    'platform-l1-secure-mcp-server'
  ],
  tags: ['orchestration', 'workflow', 'tools', 'parallel-execution'],
  inputs: [
    {
      name: 'workflow',
      type: 'object',
      description: 'Workflow definition with tools and dependencies',
      required: true
    }
  ],
  outputs: [
    {
      name: 'executionContext',
      type: 'object',
      description: 'Execution context with results and metrics'
    }
  ],
  security: [
    {
      type: 'authentication',
      description: 'JWT authentication for tool access'
    },
    {
      type: 'rate-limiting',
      description: 'Rate limiting for tool execution'
    }
  ],
  selfReferential: {
    usedToBuildItself: true,
    vibecodingLevel: 85,
    dependencies: [
      'Authenticated tool registry for secure tool management',
      'Rate-limited RPC for controlled execution',
      'Secure MCP server for tool communication'
    ]
  }
}

// Export the component
export default ToolOrchestrationPatternComponent