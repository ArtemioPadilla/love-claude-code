/**
 * Apache Airflow Integration (L1)
 * 
 * Integrates with Apache Airflow for workflow orchestration and task scheduling.
 * Provides DAG management, monitoring, and execution capabilities.
 */

import React, { useState, useEffect } from 'react'
import { L1ExternalConstruct } from '../../base/L1ExternalConstruct'
import { ConstructDefinition, MCPToolResponse } from '../../types'
import { Button } from '../../../components/UI/Button'

export interface AirflowConfig {
  /** Airflow API endpoint */
  baseUrl?: string
  /** API version */
  apiVersion?: string
  /** Authentication configuration */
  auth?: {
    type: 'basic' | 'bearer' | 'oauth2'
    username?: string
    password?: string
    token?: string
    oauth2Config?: {
      clientId: string
      clientSecret: string
      tokenEndpoint: string
    }
  }
  /** Request timeout in milliseconds */
  timeout?: number
  /** Enable request logging */
  debug?: boolean
  /** Polling interval for status updates (ms) */
  pollingInterval?: number
  /** Maximum retries for failed requests */
  maxRetries?: number
}

export interface AirflowDAG {
  /** DAG identifier */
  dagId: string
  /** DAG description */
  description?: string
  /** Whether DAG is paused */
  isPaused: boolean
  /** Whether DAG is active */
  isActive: boolean
  /** Whether DAG has sub-DAGs */
  isSubdag: boolean
  /** File token */
  fileToken?: string
  /** File location */
  fileloc?: string
  /** Max active runs */
  maxActiveRuns?: number
  /** Next execution date */
  nextDagrun?: string
  /** Schedule interval */
  scheduleInterval?: string
  /** Tags */
  tags?: string[]
  /** Last parsed time */
  lastParsedTime?: string
  /** Root DAG ID if sub-DAG */
  rootDagId?: string
  /** Owners */
  owners?: string[]
}

export interface AirflowDAGRun {
  /** DAG run ID */
  dagRunId: string
  /** DAG ID */
  dagId: string
  /** Execution date */
  executionDate: string
  /** Start date */
  startDate?: string
  /** End date */
  endDate?: string
  /** State */
  state: 'queued' | 'running' | 'success' | 'failed' | 'skipped'
  /** External trigger */
  externalTrigger: boolean
  /** Configuration */
  conf?: Record<string, any>
  /** Data interval start */
  dataIntervalStart?: string
  /** Data interval end */
  dataIntervalEnd?: string
  /** Run type */
  runType?: 'manual' | 'scheduled' | 'dataset_triggered'
}

export interface AirflowTask {
  /** Task ID */
  taskId: string
  /** Task type */
  taskType: string
  /** Operator */
  operator?: string
  /** UI color */
  uiColor?: string
  /** UI foreground color */
  uiFgcolor?: string
  /** Dependencies */
  dependencies?: string[]
  /** Downstream task IDs */
  downstreamTaskIds?: string[]
  /** Upstream task IDs */
  upstreamTaskIds?: string[]
  /** Extra links */
  extraLinks?: Array<{ name: string; href: string }>
  /** Pool */
  pool?: string
  /** Pool slots */
  poolSlots?: number
  /** Priority weight */
  priorityWeight?: number
  /** Queue */
  queue?: string
  /** Retries */
  retries?: number
  /** Retry delay */
  retryDelay?: number
  /** Start date */
  startDate?: string
  /** End date */
  endDate?: string
  /** Trigger rule */
  triggerRule?: string
}

export interface AirflowTaskInstance {
  /** Task ID */
  taskId: string
  /** DAG ID */
  dagId: string
  /** DAG run ID */
  dagRunId: string
  /** Execution date */
  executionDate: string
  /** Start date */
  startDate?: string
  /** End date */
  endDate?: string
  /** Duration */
  duration?: number
  /** State */
  state: 'scheduled' | 'queued' | 'running' | 'success' | 'failed' | 'skipped' | 'upstream_failed' | 'up_for_retry' | 'up_for_reschedule' | 'deferred' | 'removed'
  /** Try number */
  tryNumber?: number
  /** Max tries */
  maxTries?: number
  /** Hostname */
  hostname?: string
  /** PID */
  pid?: number
  /** Pool */
  pool?: string
  /** Pool slots */
  poolSlots?: number
  /** Queue */
  queue?: string
  /** Priority weight */
  priorityWeight?: number
  /** Operator */
  operator?: string
  /** Queued when */
  queuedWhen?: string
  /** Rendered fields */
  renderedFields?: Record<string, any>
  /** SLA miss */
  slaMiss?: boolean
  /** Executor config */
  executorConfig?: Record<string, any>
  /** Note */
  note?: string
}

export interface AirflowIntegrationProps {
  config?: AirflowConfig
  onDAGUpdate?: (dags: AirflowDAG[]) => void
  onRunUpdate?: (runs: AirflowDAGRun[]) => void
  onError?: (error: Error) => void
  showWorkflowVisualizer?: boolean
  autoRefresh?: boolean
}

/**
 * L1 Apache Airflow Integration
 * 
 * Provides workflow orchestration capabilities through Apache Airflow REST API.
 */
export class AirflowIntegration extends L1ExternalConstruct {
  private static metadata: ConstructDefinition = {
    id: 'airflow-integration',
    name: 'Apache Airflow Integration',
    type: 'Infrastructure',
    level: 'L1',
    version: '1.0.0',
    description: 'Workflow orchestration and task scheduling through Apache Airflow',
    author: 'Love Claude Code',
    tags: ['airflow', 'workflow', 'orchestration', 'scheduling', 'data-pipeline', 'etl'],
    categories: ['external', 'infrastructure', 'workflow'],
    license: 'MIT',
    providers: ['local', 'aws', 'gcp'],
    security: [
      {
        aspect: 'api-authentication',
        description: 'Requires secure authentication to Airflow API',
        severity: 'high',
        recommendations: [
          'Use strong authentication (OAuth2 preferred)',
          'Rotate API tokens regularly',
          'Use HTTPS for all communications',
          'Restrict API access by IP if possible'
        ]
      },
      {
        aspect: 'dag-execution',
        description: 'DAGs can execute arbitrary code',
        severity: 'critical',
        recommendations: [
          'Review all DAG code before deployment',
          'Use role-based access control',
          'Implement DAG validation pipeline',
          'Monitor DAG execution for anomalies'
        ]
      },
      {
        aspect: 'data-access',
        description: 'Workflows may access sensitive data',
        severity: 'high',
        recommendations: [
          'Implement data access controls',
          'Use connection encryption',
          'Audit data access patterns',
          'Mask sensitive information in logs'
        ]
      }
    ],
    inputs: [
      {
        name: 'config',
        type: 'AirflowConfig',
        description: 'Airflow integration configuration',
        required: false,
        defaultValue: {}
      }
    ],
    outputs: [
      {
        name: 'dags',
        type: 'AirflowDAG[]',
        description: 'List of available DAGs'
      },
      {
        name: 'activeRuns',
        type: 'AirflowDAGRun[]',
        description: 'Currently active DAG runs'
      },
      {
        name: 'connectionStatus',
        type: 'object',
        description: 'Connection status and health information'
      }
    ],
    examples: [
      {
        title: 'Basic Connection and DAG Listing',
        description: 'Connect to Airflow and list available DAGs',
        code: `const airflow = new AirflowIntegration({
  config: {
    baseUrl: 'https://airflow.example.com',
    auth: {
      type: 'bearer',
      token: process.env.AIRFLOW_API_TOKEN
    }
  }
})

await airflow.connect()
const dags = await airflow.listDAGs()
console.log('Available DAGs:', dags)`,
        language: 'typescript'
      },
      {
        title: 'Trigger DAG Run',
        description: 'Trigger a DAG run with configuration',
        code: `// Trigger a data processing pipeline
const runId = await airflow.triggerDAG('data_processing_pipeline', {
  conf: {
    date: '2025-01-23',
    source: 's3://bucket/data/',
    target: 's3://bucket/processed/'
  }
})

// Monitor the run
const status = await airflow.getDAGRunStatus('data_processing_pipeline', runId)
console.log('Pipeline status:', status)`,
        language: 'typescript'
      },
      {
        title: 'Monitor Task Progress',
        description: 'Monitor task instances within a DAG run',
        code: `// Get all task instances for a run
const tasks = await airflow.getTaskInstances('etl_pipeline', 'manual__2025-01-23')

// Check failed tasks
const failedTasks = tasks.filter(task => task.state === 'failed')
for (const task of failedTasks) {
  const logs = await airflow.getTaskLogs(task.dagId, task.dagRunId, task.taskId)
  console.log(\`Task \${task.taskId} failed:\`, logs)
}`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always use HTTPS for production Airflow instances',
      'Implement proper error handling for network failures',
      'Use connection pooling for high-frequency polling',
      'Cache DAG metadata to reduce API calls',
      'Implement exponential backoff for retries',
      'Monitor API rate limits',
      'Use webhooks when available instead of polling',
      'Validate DAG configurations before deployment',
      'Implement proper logging and monitoring',
      'Use service accounts with minimal required permissions'
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'api-calls',
          unit: 'requests',
          costPerUnit: 0.0001,
          typicalUsage: 10000
        }
      ],
      notes: [
        'No direct costs for the integration itself',
        'API call costs depend on Airflow hosting',
        'Consider caching to reduce API usage'
      ]
    },
    c4: {
      type: 'Component',
      technology: 'TypeScript/React',
      external: true,
      containerType: 'WebApp'
    },
    relationships: [
      {
        from: 'airflow-integration',
        to: 'apache-airflow',
        description: 'Connects to Airflow REST API',
        technology: 'HTTPS/REST'
      }
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        type: 'object',
        properties: {
          AIRFLOW_BASE_URL: { type: 'string' },
          AIRFLOW_API_TOKEN: { type: 'string' }
        }
      },
      environmentVariables: ['AIRFLOW_BASE_URL', 'AIRFLOW_API_TOKEN']
    }
  }
  
  private config: Required<AirflowConfig>
  private dags: Map<string, AirflowDAG> = new Map()
  private activeRuns: Map<string, AirflowDAGRun> = new Map()
  private pollingTimer?: NodeJS.Timeout
  
  constructor(config: AirflowConfig = {}) {
    super(AirflowIntegration.metadata)
    
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:8080',
      apiVersion: config.apiVersion || 'v1',
      auth: config.auth || { type: 'basic' },
      timeout: config.timeout || 30000,
      debug: config.debug || false,
      pollingInterval: config.pollingInterval || 5000,
      maxRetries: config.maxRetries || 3
    }
    
    // Configure external service
    this.configureService({
      name: 'apache-airflow',
      endpoint: `${this.config.baseUrl}/api/${this.config.apiVersion}`,
      connectionTimeout: this.config.timeout,
      requestTimeout: this.config.timeout,
      retry: {
        maxAttempts: this.config.maxRetries,
        backoffMultiplier: 2,
        maxBackoffMs: 30000
      }
    })
    
    // Configure authentication
    this.configureAuthFromConfig()
    
    // Set up lifecycle hooks
    this.onConnect = this.initializeConnection.bind(this)
    this.onDisconnect = this.cleanupConnection.bind(this)
    this.onError = this.handleConnectionError.bind(this)
  }
  
  /**
   * Configure authentication from config
   */
  private configureAuthFromConfig(): void {
    const { auth } = this.config
    
    switch (auth.type) {
      case 'basic':
        this.configureAuth({
          type: 'basic',
          username: auth.username || '',
          password: auth.password || ''
        })
        break
        
      case 'bearer':
        this.configureAuth({
          type: 'bearer',
          bearerToken: auth.token
        })
        break
        
      case 'oauth2':
        if (auth.oauth2Config) {
          this.configureAuth({
            type: 'oauth2',
            oauth2: {
              clientId: auth.oauth2Config.clientId,
              clientSecret: auth.oauth2Config.clientSecret,
              tokenUrl: auth.oauth2Config.tokenEndpoint,
              scopes: ['read', 'write']
            }
          })
        }
        break
    }
  }
  
  /**
   * Initialize connection to Airflow
   */
  private async initializeConnection(): Promise<void> {
    // Test connection by fetching DAGs
    await this.listDAGs()
    
    // Start polling if configured
    if (this.config.pollingInterval > 0) {
      this.startPolling()
    }
    
    this.emit('airflow-connected', {
      baseUrl: this.config.baseUrl,
      dagCount: this.dags.size
    })
  }
  
  /**
   * Cleanup connection
   */
  private async cleanupConnection(): Promise<void> {
    this.stopPolling()
    this.dags.clear()
    this.activeRuns.clear()
    
    this.emit('airflow-disconnected', {})
  }
  
  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    console.error('[AirflowIntegration] Connection error:', error)
    this.emit('airflow-error', { error: error.message })
  }
  
  /**
   * Perform connection to Airflow
   */
  protected async performConnect(): Promise<void> {
    // Test connection with a simple API call
    const response = await this.makeRequest('GET', '/config')
    if (!response.ok) {
      throw new Error(`Failed to connect to Airflow: ${response.statusText}`)
    }
  }
  
  /**
   * Perform disconnection
   */
  protected async performDisconnect(): Promise<void> {
    // Clean up any resources
    this.stopPolling()
  }
  
  /**
   * Make an authenticated request to Airflow API
   */
  private async makeRequest(
    method: string,
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<Response> {
    const url = `${this.config.baseUrl}/api/${this.config.apiVersion}${path}`
    
    const request: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers
      },
      ...options
    }
    
    if (body) {
      request.body = JSON.stringify(body)
    }
    
    // Apply authentication
    await this.applyAuth(request)
    
    if (this.config.debug) {
      console.log(`[AirflowIntegration] ${method} ${url}`)
    }
    
    return fetch(url, request)
  }
  
  /**
   * Start polling for updates
   */
  private startPolling(): void {
    if (this.pollingTimer) return
    
    this.pollingTimer = setInterval(async () => {
      try {
        await this.refreshActiveRuns()
      } catch (error) {
        console.error('[AirflowIntegration] Polling error:', error)
      }
    }, this.config.pollingInterval)
  }
  
  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = undefined
    }
  }
  
  /**
   * List all DAGs
   */
  async listDAGs(onlyActive: boolean = false): Promise<AirflowDAG[]> {
    const params = new URLSearchParams()
    if (onlyActive) {
      params.append('only_active', 'true')
    }
    
    const response = await this.makeRequest('GET', `/dags?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to list DAGs: ${response.statusText}`)
    }
    
    const data = await response.json()
    const dags = data.dags || []
    
    // Update cache
    this.dags.clear()
    for (const dag of dags) {
      this.dags.set(dag.dag_id, dag)
    }
    
    this.emit('dags-updated', { dags })
    return dags
  }
  
  /**
   * Get a specific DAG
   */
  async getDAG(dagId: string): Promise<AirflowDAG> {
    const response = await this.makeRequest('GET', `/dags/${dagId}`)
    if (!response.ok) {
      throw new Error(`Failed to get DAG ${dagId}: ${response.statusText}`)
    }
    
    const dag = await response.json()
    this.dags.set(dagId, dag)
    
    return dag
  }
  
  /**
   * Trigger a DAG run
   */
  async triggerDAG(
    dagId: string,
    options?: {
      conf?: Record<string, any>
      executionDate?: string
      runId?: string
    }
  ): Promise<string> {
    const body: any = {
      conf: options?.conf || {},
      logical_date: options?.executionDate || new Date().toISOString()
    }
    
    if (options?.runId) {
      body.dag_run_id = options.runId
    }
    
    const response = await this.makeRequest('POST', `/dags/${dagId}/dagRuns`, body)
    if (!response.ok) {
      throw new Error(`Failed to trigger DAG ${dagId}: ${response.statusText}`)
    }
    
    const dagRun = await response.json()
    this.activeRuns.set(dagRun.dag_run_id, dagRun)
    
    this.emit('dag-triggered', { dagId, runId: dagRun.dag_run_id })
    return dagRun.dag_run_id
  }
  
  /**
   * Pause a DAG
   */
  async pauseDAG(dagId: string): Promise<void> {
    const response = await this.makeRequest('PATCH', `/dags/${dagId}`, {
      is_paused: true
    })
    
    if (!response.ok) {
      throw new Error(`Failed to pause DAG ${dagId}: ${response.statusText}`)
    }
    
    const dag = await response.json()
    this.dags.set(dagId, dag)
    
    this.emit('dag-paused', { dagId })
  }
  
  /**
   * Unpause a DAG
   */
  async unpauseDAG(dagId: string): Promise<void> {
    const response = await this.makeRequest('PATCH', `/dags/${dagId}`, {
      is_paused: false
    })
    
    if (!response.ok) {
      throw new Error(`Failed to unpause DAG ${dagId}: ${response.statusText}`)
    }
    
    const dag = await response.json()
    this.dags.set(dagId, dag)
    
    this.emit('dag-unpaused', { dagId })
  }
  
  /**
   * List DAG runs
   */
  async listDAGRuns(
    dagId?: string,
    options?: {
      limit?: number
      offset?: number
      executionDateGte?: string
      executionDateLte?: string
      state?: string[]
    }
  ): Promise<AirflowDAGRun[]> {
    const params = new URLSearchParams()
    
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    if (options?.executionDateGte) params.append('execution_date_gte', options.executionDateGte)
    if (options?.executionDateLte) params.append('execution_date_lte', options.executionDateLte)
    if (options?.state) {
      options.state.forEach(s => params.append('state', s))
    }
    
    const path = dagId ? `/dags/${dagId}/dagRuns` : '/dagRuns'
    const response = await this.makeRequest('GET', `${path}?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to list DAG runs: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.dag_runs || []
  }
  
  /**
   * Get DAG run status
   */
  async getDAGRunStatus(dagId: string, runId: string): Promise<AirflowDAGRun> {
    const response = await this.makeRequest('GET', `/dags/${dagId}/dagRuns/${runId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get DAG run status: ${response.statusText}`)
    }
    
    const dagRun = await response.json()
    this.activeRuns.set(runId, dagRun)
    
    return dagRun
  }
  
  /**
   * Get task instances for a DAG run
   */
  async getTaskInstances(
    dagId: string,
    runId: string,
    taskId?: string
  ): Promise<AirflowTaskInstance[]> {
    const path = taskId
      ? `/dags/${dagId}/dagRuns/${runId}/taskInstances/${taskId}`
      : `/dags/${dagId}/dagRuns/${runId}/taskInstances`
    
    const response = await this.makeRequest('GET', path)
    
    if (!response.ok) {
      throw new Error(`Failed to get task instances: ${response.statusText}`)
    }
    
    const data = await response.json()
    return taskId ? [data] : (data.task_instances || [])
  }
  
  /**
   * Get task logs
   */
  async getTaskLogs(
    dagId: string,
    runId: string,
    taskId: string,
    taskTryNumber: number = 1
  ): Promise<string> {
    const response = await this.makeRequest(
      'GET',
      `/dags/${dagId}/dagRuns/${runId}/taskInstances/${taskId}/logs/${taskTryNumber}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to get task logs: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.content || ''
  }
  
  /**
   * Clear task instances
   */
  async clearTaskInstances(
    dagId: string,
    options: {
      startDate?: string
      endDate?: string
      onlyFailed?: boolean
      onlyRunning?: boolean
      includeSubdags?: boolean
      includeParentdag?: boolean
      resetDagRuns?: boolean
      taskIds?: string[]
    }
  ): Promise<void> {
    const body: any = {
      dry_run: false,
      only_failed: options.onlyFailed || false,
      only_running: options.onlyRunning || false,
      include_subdags: options.includeSubdags || false,
      include_parentdag: options.includeParentdag || false,
      reset_dag_runs: options.resetDagRuns || false
    }
    
    if (options.startDate) body.start_date = options.startDate
    if (options.endDate) body.end_date = options.endDate
    if (options.taskIds) body.task_ids = options.taskIds
    
    const response = await this.makeRequest(
      'POST',
      `/dags/${dagId}/clearTaskInstances`,
      body
    )
    
    if (!response.ok) {
      throw new Error(`Failed to clear task instances: ${response.statusText}`)
    }
    
    this.emit('tasks-cleared', { dagId, options })
  }
  
  /**
   * Deploy a new DAG
   */
  async deployDAG(
    dagId: string,
    dagCode: string,
    options?: {
      overwrite?: boolean
      validate?: boolean
    }
  ): Promise<void> {
    // This would typically involve uploading the DAG file to the DAGs folder
    // For now, we'll simulate it with an event
    this.emit('dag-deployed', { dagId, codeLength: dagCode.length })
    
    // In a real implementation, this might:
    // 1. Upload to S3/GCS bucket that Airflow monitors
    // 2. Use a git-sync sidecar
    // 3. Use Airflow's experimental DAG API
    // 4. SSH/SCP to the Airflow server
    
    if (options?.validate) {
      // Validate DAG syntax
      // This would typically be done server-side
    }
  }
  
  /**
   * Refresh active runs
   */
  private async refreshActiveRuns(): Promise<void> {
    const runs = await this.listDAGRuns(undefined, {
      state: ['running', 'queued'],
      limit: 100
    })
    
    // Update cache
    this.activeRuns.clear()
    for (const run of runs) {
      this.activeRuns.set(run.dagRunId, run)
    }
    
    this.emit('active-runs-updated', { runs })
  }
  
  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(): Promise<{
    totalDAGs: number
    activeDAGs: number
    pausedDAGs: number
    runningRuns: number
    successRate: number
    avgDuration: number
  }> {
    const dags = Array.from(this.dags.values())
    const runs = Array.from(this.activeRuns.values())
    
    // Calculate success rate from recent runs
    const recentRuns = await this.listDAGRuns(undefined, {
      limit: 100,
      executionDateGte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    })
    
    const successCount = recentRuns.filter(r => r.state === 'success').length
    const totalCount = recentRuns.length
    
    return {
      totalDAGs: dags.length,
      activeDAGs: dags.filter(d => !d.isPaused && d.isActive).length,
      pausedDAGs: dags.filter(d => d.isPaused).length,
      runningRuns: runs.filter(r => r.state === 'running').length,
      successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
      avgDuration: 0 // Would calculate from run durations
    }
  }
  
  /**
   * Get cached DAGs
   */
  getCachedDAGs(): AirflowDAG[] {
    return Array.from(this.dags.values())
  }
  
  /**
   * Get cached active runs
   */
  getCachedActiveRuns(): AirflowDAGRun[] {
    return Array.from(this.activeRuns.values())
  }
  
  /**
   * React component for UI representation
   */
  static Component: React.FC<AirflowIntegrationProps> = ({
    config = {},
    onDAGUpdate,
    onRunUpdate,
    onError,
    showWorkflowVisualizer = true,
    autoRefresh = true
  }) => {
    const [instance] = useState(() => new AirflowIntegration(config))
    const [connected, setConnected] = useState(false)
    const [dags, setDAGs] = useState<AirflowDAG[]>([])
    const [activeRuns, setActiveRuns] = useState<AirflowDAGRun[]>([])
    const [selectedDAG, setSelectedDAG] = useState<AirflowDAG | null>(null)
    const [loading, setLoading] = useState(false)
    const [metrics, setMetrics] = useState<any>(null)
    
    useEffect(() => {
      // Set up event listeners
      const unsubscribe = [
        instance.on('connected', () => setConnected(true)),
        instance.on('disconnected', () => setConnected(false)),
        instance.on('dags-updated', (data) => {
          setDAGs(data.dags)
          if (onDAGUpdate) onDAGUpdate(data.dags)
        }),
        instance.on('active-runs-updated', (data) => {
          setActiveRuns(data.runs)
          if (onRunUpdate) onRunUpdate(data.runs)
        }),
        instance.on('error', (data) => {
          if (onError) onError(new Error(data.error))
        })
      ]
      
      return () => {
        unsubscribe.forEach(fn => fn())
      }
    }, [instance, onDAGUpdate, onRunUpdate, onError])
    
    const handleConnect = async () => {
      setLoading(true)
      try {
        await instance.connect()
        const metrics = await instance.getWorkflowMetrics()
        setMetrics(metrics)
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    const handleDisconnect = async () => {
      setLoading(true)
      try {
        await instance.disconnect()
        setDAGs([])
        setActiveRuns([])
        setMetrics(null)
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    const handleTriggerDAG = async (dagId: string) => {
      const conf = prompt('Enter DAG configuration (JSON):')
      if (conf === null) return
      
      setLoading(true)
      try {
        const runId = await instance.triggerDAG(dagId, {
          conf: conf ? JSON.parse(conf) : {}
        })
        alert(`DAG triggered successfully! Run ID: ${runId}`)
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    const handlePauseDAG = async (dagId: string, isPaused: boolean) => {
      setLoading(true)
      try {
        if (isPaused) {
          await instance.unpauseDAG(dagId)
        } else {
          await instance.pauseDAG(dagId)
        }
        await instance.listDAGs()
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <div className="airflow-integration p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Apache Airflow Integration</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Status: <span className={connected ? 'text-green-600' : 'text-red-600'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          
          {metrics && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-gray-100 p-2 rounded">
                <div className="font-semibold">{metrics.totalDAGs}</div>
                <div className="text-gray-600">Total DAGs</div>
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <div className="font-semibold">{metrics.runningRuns}</div>
                <div className="text-gray-600">Running</div>
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <div className="font-semibold">{metrics.successRate.toFixed(1)}%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mb-4">
          {!connected ? (
            <Button onClick={handleConnect} disabled={loading} variant="primary">
              Connect
            </Button>
          ) : (
            <Button onClick={handleDisconnect} disabled={loading} variant="secondary">
              Disconnect
            </Button>
          )}
        </div>
        
        {connected && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">DAGs</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dags.map(dag => (
                  <div
                    key={dag.dagId}
                    className="border p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedDAG(dag)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{dag.dagId}</div>
                        <div className="text-sm text-gray-600">{dag.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTriggerDAG(dag.dagId)
                          }}
                          disabled={dag.isPaused}
                        >
                          Trigger
                        </Button>
                        <Button
                          size="sm"
                          variant={dag.isPaused ? 'primary' : 'secondary'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePauseDAG(dag.dagId, dag.isPaused)
                          }}
                        >
                          {dag.isPaused ? 'Unpause' : 'Pause'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Active Runs</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeRuns.map(run => (
                  <div key={run.dagRunId} className="border p-2 rounded text-sm">
                    <div className="flex justify-between">
                      <div>
                        <span className="font-medium">{run.dagId}</span>
                        <span className="ml-2 text-gray-600">{run.dagRunId}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        run.state === 'running' ? 'bg-blue-100 text-blue-800' :
                        run.state === 'success' ? 'bg-green-100 text-green-800' :
                        run.state === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {run.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {showWorkflowVisualizer && selectedDAG && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Selected DAG: {selectedDAG.dagId}</h4>
                <div className="bg-gray-100 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-2">
                    Schedule: {selectedDAG.scheduleInterval || 'None'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Next Run: {selectedDAG.nextDagrun || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tags: {selectedDAG.tags?.join(', ') || 'None'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

// Export the component separately for easy use
export const AirflowIntegrationComponent = AirflowIntegration.Component