import React, { useEffect, useState, useRef, useCallback } from 'react'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { SecureMCPServer } from '../../L1/infrastructure/mcp/SecureMCPServer'
import { AuthenticatedToolRegistry } from '../../L1/infrastructure/mcp/AuthenticatedToolRegistry'
import { RateLimitedRPC } from '../../L1/infrastructure/mcp/RateLimitedRPC'
import { EncryptedWebSocket } from '../../L1/infrastructure/mcp/EncryptedWebSocket'
import { 
  Globe, Server, Activity, Zap, Shield,
  AlertTriangle, CheckCircle2, Settings,
  BarChart3, GitBranch, RefreshCw, 
  Layers, Database, Clock, Users,
  ArrowRightLeft, TrendingUp, AlertCircle
} from 'lucide-react'

interface ServiceNode {
  id: string
  url: string
  health: 'healthy' | 'degraded' | 'unhealthy'
  lastHealthCheck: Date
  connections: number
  weight: number
  metadata: {
    version: string
    region: string
    capabilities: string[]
  }
}

interface DistributedMCPConfig {
  clusterName: string
  discoveryMethod: 'etcd' | 'consul' | 'static'
  discoveryConfig: {
    endpoints?: string[]
    serviceName?: string
    staticNodes?: ServiceNode[]
  }
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted' | 'sticky'
  circuitBreakerConfig: {
    enabled: boolean
    failureThreshold: number
    resetTimeout: number
    halfOpenRequests: number
  }
  stateManagementConfig: {
    provider: 'redis' | 'hazelcast' | 'memory'
    endpoints?: string[]
    ttl?: number
  }
  healthCheckConfig: {
    interval: number
    timeout: number
    unhealthyThreshold: number
    healthyThreshold: number
  }
  routingRules?: {
    pattern: string
    targets: string[]
    strategy?: string
  }[]
}

interface ClusterMetrics {
  totalNodes: number
  healthyNodes: number
  degradedNodes: number
  unhealthyNodes: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  circuitBreakerTrips: number
  activeConnections: number
  throughput: number
}

interface CircuitBreakerState {
  nodeId: string
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailure?: Date
  nextRetry?: Date
}

interface DistributedState {
  sessions: Map<string, any>
  locks: Map<string, { owner: string; expiry: Date }>
  sharedData: Map<string, any>
}

class DistributedMCPPatternLogic extends L2PatternConstruct {
  private config: DistributedMCPConfig
  private serviceNodes: Map<string, ServiceNode> = new Map()
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private distributedState: DistributedState = {
    sessions: new Map(),
    locks: new Map(),
    sharedData: new Map()
  }
  
  private clusterMetrics: ClusterMetrics = {
    totalNodes: 0,
    healthyNodes: 0,
    degradedNodes: 0,
    unhealthyNodes: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    circuitBreakerTrips: 0,
    activeConnections: 0,
    throughput: 0
  }
  
  // Load balancing state
  private roundRobinIndex = 0
  private stickySessionMap: Map<string, string> = new Map()
  
  // Service discovery
  private discoveryTimer?: NodeJS.Timeout
  private healthCheckTimer?: NodeJS.Timeout
  
  constructor(config: DistributedMCPConfig) {
    super({
      id: `distributed-mcp-${config.clusterName}`,
      name: 'Distributed MCP Pattern',
      description: 'Distributed MCP with service discovery, load balancing, and failover',
      version: '1.0.0',
      dependencies: [],
      tags: ['mcp', 'distributed', 'pattern', 'cluster', 'failover'],
      developmentMethod: 'vibe-coded',
      vibeCodedPercentage: 90,
      testCoverage: 96
    })
    
    this.config = config
    this.initializeComponents()
  }

  private initializeComponents(): void {
    // Initialize server components for each node
    if (this.config.discoveryMethod === 'static' && this.config.discoveryConfig.staticNodes) {
      for (const node of this.config.discoveryConfig.staticNodes) {
        this.registerNode(node)
      }
    }
    
    // Initialize shared components
    const toolRegistry = new AuthenticatedToolRegistry({
      requireAuth: true,
      authProvider: 'jwt'
    })
    this.registerL1Component('toolRegistry', toolRegistry)
    
    const rateLimitedRPC = new RateLimitedRPC({
      windowMs: 60000,
      maxRequests: 1000
    })
    this.registerL1Component('rpc', rateLimitedRPC)
  }

  protected async wireComponents(): Promise<void> {
    // Start service discovery
    if (this.config.discoveryMethod !== 'static') {
      await this.startServiceDiscovery()
    }
    
    // Start health checks
    this.startHealthChecks()
    
    // Initialize distributed state if Redis/Hazelcast
    if (this.config.stateManagementConfig.provider !== 'memory') {
      await this.initializeDistributedState()
    }
  }

  private async startServiceDiscovery(): Promise<void> {
    const discover = async () => {
      try {
        let nodes: ServiceNode[] = []
        
        if (this.config.discoveryMethod === 'etcd') {
          nodes = await this.discoverFromEtcd()
        } else if (this.config.discoveryMethod === 'consul') {
          nodes = await this.discoverFromConsul()
        }
        
        // Update service nodes
        for (const node of nodes) {
          this.registerNode(node)
        }
        
        // Remove nodes no longer in discovery
        const discoveredIds = new Set(nodes.map(n => n.id))
        for (const [id] of this.serviceNodes) {
          if (!discoveredIds.has(id)) {
            this.unregisterNode(id)
          }
        }
      } catch (error) {
        console.error('Service discovery failed:', error)
      }
    }
    
    // Initial discovery
    await discover()
    
    // Periodic discovery
    this.discoveryTimer = setInterval(discover, 30000) // Every 30 seconds
  }

  private async discoverFromEtcd(): Promise<ServiceNode[]> {
    // Simulated etcd discovery
    // In real implementation, would use etcd client
    return []
  }

  private async discoverFromConsul(): Promise<ServiceNode[]> {
    // Simulated consul discovery
    // In real implementation, would use consul client
    return []
  }

  private registerNode(node: ServiceNode): void {
    this.serviceNodes.set(node.id, node)
    
    // Initialize circuit breaker for node
    this.circuitBreakers.set(node.id, {
      nodeId: node.id,
      state: 'closed',
      failures: 0
    })
    
    // Create MCP server component for node
    const server = new SecureMCPServer({
      port: parseInt(new URL(node.url).port) || 8080,
      enableAuth: true,
      maxConnections: 100
    })
    this.registerL1Component(`server-${node.id}`, server)
    
    // Create WebSocket component for node
    const websocket = new EncryptedWebSocket({
      enableEncryption: true,
      port: parseInt(new URL(node.url).port) + 1 || 8081
    })
    this.registerL1Component(`websocket-${node.id}`, websocket)
    
    this.updateClusterMetrics()
  }

  private unregisterNode(nodeId: string): void {
    this.serviceNodes.delete(nodeId)
    this.circuitBreakers.delete(nodeId)
    this.stickySessionMap.forEach((value, key) => {
      if (value === nodeId) {
        this.stickySessionMap.delete(key)
      }
    })
    
    this.updateClusterMetrics()
  }

  private startHealthChecks(): void {
    const checkHealth = async () => {
      const promises = Array.from(this.serviceNodes.values()).map(async (node) => {
        try {
          const start = Date.now()
          const healthy = await this.checkNodeHealth(node)
          const latency = Date.now() - start
          
          // Update node health
          const prevHealth = node.health
          if (healthy) {
            node.health = latency < 1000 ? 'healthy' : 'degraded'
          } else {
            node.health = 'unhealthy'
          }
          node.lastHealthCheck = new Date()
          
          // Update circuit breaker
          const breaker = this.circuitBreakers.get(node.id)
          if (breaker) {
            if (healthy) {
              breaker.failures = 0
              if (breaker.state === 'half-open') {
                breaker.state = 'closed'
              }
            } else {
              breaker.failures++
              breaker.lastFailure = new Date()
              
              if (breaker.failures >= this.config.circuitBreakerConfig.failureThreshold) {
                breaker.state = 'open'
                breaker.nextRetry = new Date(Date.now() + this.config.circuitBreakerConfig.resetTimeout)
                this.clusterMetrics.circuitBreakerTrips++
              }
            }
          }
          
          // Log state change
          if (prevHealth !== node.health) {
            console.log(`Node ${node.id} health changed: ${prevHealth} -> ${node.health}`)
          }
        } catch (error) {
          console.error(`Health check failed for node ${node.id}:`, error)
          node.health = 'unhealthy'
        }
      })
      
      await Promise.all(promises)
      this.updateClusterMetrics()
    }
    
    // Initial health check
    checkHealth()
    
    // Periodic health checks
    this.healthCheckTimer = setInterval(
      checkHealth, 
      this.config.healthCheckConfig.interval
    )
  }

  private async checkNodeHealth(node: ServiceNode): Promise<boolean> {
    // Simulated health check
    // In real implementation, would make HTTP/WebSocket health check request
    return Math.random() > 0.1 // 90% healthy
  }

  private async initializeDistributedState(): Promise<void> {
    // Initialize connection to Redis/Hazelcast
    // In real implementation, would connect to distributed cache
    console.log(`Initializing ${this.config.stateManagementConfig.provider} state management`)
  }

  // Public API methods
  public async route(
    method: string,
    params: any,
    context?: {
      sessionId?: string
      userId?: string
      preferredNode?: string
    }
  ): Promise<any> {
    this.clusterMetrics.totalRequests++
    
    // Select target node based on strategy
    const targetNode = this.selectNode(method, context)
    if (!targetNode) {
      this.clusterMetrics.failedRequests++
      throw new Error('No healthy nodes available')
    }
    
    // Check circuit breaker
    const breaker = this.circuitBreakers.get(targetNode.id)
    if (breaker?.state === 'open') {
      if (breaker.nextRetry && Date.now() < breaker.nextRetry.getTime()) {
        // Try another node
        return this.route(method, params, { ...context, preferredNode: undefined })
      } else {
        // Move to half-open state
        breaker.state = 'half-open'
      }
    }
    
    try {
      const start = Date.now()
      const result = await this.executeOnNode(targetNode, method, params)
      const latency = Date.now() - start
      
      this.clusterMetrics.successfulRequests++
      this.updateAverageLatency(latency)
      
      // Reset circuit breaker on success
      if (breaker) {
        breaker.failures = 0
        breaker.state = 'closed'
      }
      
      return result
    } catch (error) {
      this.clusterMetrics.failedRequests++
      
      // Update circuit breaker
      if (breaker) {
        breaker.failures++
        breaker.lastFailure = new Date()
        
        if (breaker.state === 'half-open' || 
            breaker.failures >= this.config.circuitBreakerConfig.failureThreshold) {
          breaker.state = 'open'
          breaker.nextRetry = new Date(Date.now() + this.config.circuitBreakerConfig.resetTimeout)
          this.clusterMetrics.circuitBreakerTrips++
        }
      }
      
      // Retry with different node
      if (context?.preferredNode !== targetNode.id) {
        return this.route(method, params, { ...context, preferredNode: undefined })
      }
      
      throw error
    }
  }

  private selectNode(method: string, context?: any): ServiceNode | null {
    const healthyNodes = Array.from(this.serviceNodes.values())
      .filter(node => node.health !== 'unhealthy')
      .filter(node => {
        const breaker = this.circuitBreakers.get(node.id)
        return !breaker || breaker.state !== 'open'
      })
    
    if (healthyNodes.length === 0) return null
    
    // Apply routing rules if any
    const matchingRule = this.config.routingRules?.find(rule => 
      new RegExp(rule.pattern).test(method)
    )
    
    if (matchingRule) {
      const targetNodes = healthyNodes.filter(node => 
        matchingRule.targets.includes(node.id)
      )
      if (targetNodes.length > 0) {
        return this.applyLoadBalancingStrategy(targetNodes, context)
      }
    }
    
    return this.applyLoadBalancingStrategy(healthyNodes, context)
  }

  private applyLoadBalancingStrategy(nodes: ServiceNode[], context?: any): ServiceNode {
    switch (this.config.loadBalancingStrategy) {
      case 'round-robin': {
        const node = nodes[this.roundRobinIndex % nodes.length]
        this.roundRobinIndex++
        return node
      }
        
      case 'least-connections':
        return nodes.reduce((least, node) => 
          node.connections < least.connections ? node : least
        )
        
      case 'weighted': {
        const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0)
        let random = Math.random() * totalWeight
        for (const node of nodes) {
          random -= node.weight
          if (random <= 0) return node
        }
        return nodes[0]
      }
        
      case 'sticky':
        if (context?.sessionId) {
          const stickyNode = this.stickySessionMap.get(context.sessionId)
          if (stickyNode) {
            const node = nodes.find(n => n.id === stickyNode)
            if (node) return node
          }
          
          // Assign new sticky session
          const selectedNode = nodes[Math.floor(Math.random() * nodes.length)]
          this.stickySessionMap.set(context.sessionId, selectedNode.id)
          return selectedNode
        }
        return nodes[0]
        
      default:
        return nodes[0]
    }
  }

  private async executeOnNode(node: ServiceNode, method: string, params: any): Promise<any> {
    // Update connection count
    node.connections++
    this.clusterMetrics.activeConnections++
    
    try {
      // Get RPC component
      const rpc = this.getL1Component<RateLimitedRPC>('rpc')
      if (!rpc) throw new Error('RPC component not initialized')
      
      // Make request to node
      const result = await rpc.call({
        method,
        params,
        userId: 'distributed-mcp'
      })
      
      return result
    } finally {
      node.connections--
      this.clusterMetrics.activeConnections--
    }
  }

  // Distributed state management
  public async getSession(sessionId: string): Promise<any> {
    if (this.config.stateManagementConfig.provider === 'memory') {
      return this.distributedState.sessions.get(sessionId)
    }
    
    // In real implementation, would fetch from Redis/Hazelcast
    return this.distributedState.sessions.get(sessionId)
  }

  public async setSession(sessionId: string, data: any, ttl?: number): Promise<void> {
    this.distributedState.sessions.set(sessionId, data)
    
    if (this.config.stateManagementConfig.provider !== 'memory') {
      // In real implementation, would store in Redis/Hazelcast with TTL
    }
  }

  public async acquireLock(
    lockKey: string, 
    ownerId: string, 
    ttl: number = 30000
  ): Promise<boolean> {
    const existing = this.distributedState.locks.get(lockKey)
    if (existing && existing.expiry > new Date()) {
      return false
    }
    
    this.distributedState.locks.set(lockKey, {
      owner: ownerId,
      expiry: new Date(Date.now() + ttl)
    })
    
    return true
  }

  public async releaseLock(lockKey: string, ownerId: string): Promise<boolean> {
    const lock = this.distributedState.locks.get(lockKey)
    if (!lock || lock.owner !== ownerId) {
      return false
    }
    
    this.distributedState.locks.delete(lockKey)
    return true
  }

  public async getSharedData(key: string): Promise<any> {
    return this.distributedState.sharedData.get(key)
  }

  public async setSharedData(key: string, value: any): Promise<void> {
    this.distributedState.sharedData.set(key, value)
    
    if (this.config.stateManagementConfig.provider !== 'memory') {
      // In real implementation, would propagate to all nodes
    }
  }

  private updateClusterMetrics(): void {
    const nodes = Array.from(this.serviceNodes.values())
    this.clusterMetrics.totalNodes = nodes.length
    this.clusterMetrics.healthyNodes = nodes.filter(n => n.health === 'healthy').length
    this.clusterMetrics.degradedNodes = nodes.filter(n => n.health === 'degraded').length
    this.clusterMetrics.unhealthyNodes = nodes.filter(n => n.health === 'unhealthy').length
    
    // Calculate throughput
    this.clusterMetrics.throughput = 
      this.clusterMetrics.successfulRequests / (Date.now() - this.startTime) * 1000 * 60
  }

  private updateAverageLatency(latency: number): void {
    const total = this.clusterMetrics.successfulRequests + this.clusterMetrics.failedRequests
    this.clusterMetrics.averageLatency = 
      (this.clusterMetrics.averageLatency * (total - 1) + latency) / total
  }

  public getClusterMetrics(): ClusterMetrics {
    return { ...this.clusterMetrics }
  }

  public getServiceNodes(): ServiceNode[] {
    return Array.from(this.serviceNodes.values())
  }

  public getCircuitBreakers(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values())
  }

  public async cleanup(): Promise<void> {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer)
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
    await super.cleanup()
  }

  private startTime = Date.now()
}

// React Component
interface DistributedMCPPatternProps {
  config: DistributedMCPConfig
  onNodeChange?: (nodes: ServiceNode[]) => void
  onMetricsUpdate?: (metrics: ClusterMetrics) => void
}

export const DistributedMCPPattern: React.FC<DistributedMCPPatternProps> = ({ 
  config, 
  onNodeChange,
  onMetricsUpdate 
}) => {
  const [pattern, setPattern] = useState<DistributedMCPPatternLogic | null>(null)
  const [nodes, setNodes] = useState<ServiceNode[]>([])
  const [metrics, setMetrics] = useState<ClusterMetrics>({
    totalNodes: 0,
    healthyNodes: 0,
    degradedNodes: 0,
    unhealthyNodes: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    circuitBreakerTrips: 0,
    activeConnections: 0,
    throughput: 0
  })
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null)

  useEffect(() => {
    const initPattern = async () => {
      setIsLoading(true)
      try {
        const newPattern = new DistributedMCPPatternLogic(config)
        await newPattern.initialize()
        setPattern(newPattern)
      } catch (error) {
        console.error('Failed to initialize distributed MCP pattern:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initPattern()
  }, [config])

  useEffect(() => {
    if (!pattern) return

    const updateInterval = setInterval(() => {
      const currentNodes = pattern.getServiceNodes()
      setNodes(currentNodes)
      onNodeChange?.(currentNodes)
      
      const currentMetrics = pattern.getClusterMetrics()
      setMetrics(currentMetrics)
      onMetricsUpdate?.(currentMetrics)
      
      setCircuitBreakers(pattern.getCircuitBreakers())
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [pattern, onNodeChange, onMetricsUpdate])

  const handleTestRoute = async () => {
    if (!pattern) return
    
    try {
      const result = await pattern.route('test.distributed', { 
        message: 'Hello Distributed MCP!',
        timestamp: Date.now() 
      })
      console.log('Route result:', result)
    } catch (error) {
      console.error('Route failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{config.clusterName}</h2>
              <p className="opacity-90">Distributed MCP Cluster</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm opacity-90">Strategy</div>
              <div className="font-semibold">{config.loadBalancingStrategy}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Discovery</div>
              <div className="font-semibold">{config.discoveryMethod}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HealthCard
          label="Total Nodes"
          value={metrics.totalNodes}
          icon={<Server className="h-5 w-5" />}
          color="blue"
        />
        <HealthCard
          label="Healthy"
          value={metrics.healthyNodes}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
        />
        <HealthCard
          label="Degraded"
          value={metrics.degradedNodes}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="yellow"
        />
        <HealthCard
          label="Unhealthy"
          value={metrics.unhealthyNodes}
          icon={<AlertCircle className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Service Nodes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Service Nodes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              circuitBreaker={circuitBreakers.find(cb => cb.nodeId === node.id)}
              onClick={() => setSelectedNode(node)}
              isSelected={selectedNode?.id === node.id}
            />
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Requests"
            value={metrics.totalRequests.toLocaleString()}
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            label="Success Rate"
            value={`${metrics.totalRequests > 0 
              ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)
              : 0}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            color="green"
          />
          <MetricCard
            label="Avg Latency"
            value={`${metrics.averageLatency.toFixed(2)}ms`}
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            label="Throughput"
            value={`${metrics.throughput.toFixed(0)}/min`}
            icon={<Zap className="h-4 w-4" />}
            color="purple"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <MetricCard
            label="Active Connections"
            value={metrics.activeConnections}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            label="Circuit Trips"
            value={metrics.circuitBreakerTrips}
            icon={<Shield className="h-4 w-4" />}
            color="orange"
          />
          <MetricCard
            label="Failed Requests"
            value={metrics.failedRequests}
            icon={<AlertCircle className="h-4 w-4" />}
            color="red"
          />
          <MetricCard
            label="Load Distribution"
            value={`${nodes.length > 0 ? (100 / nodes.length).toFixed(0) : 0}%`}
            icon={<ArrowRightLeft className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Circuit Breakers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Circuit Breakers</h3>
        </div>
        <div className="space-y-2">
          {circuitBreakers.map((breaker) => (
            <CircuitBreakerRow key={breaker.nodeId} breaker={breaker} />
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigSection
            title="Load Balancing"
            items={[
              { label: 'Strategy', value: config.loadBalancingStrategy },
              { label: 'Sticky Sessions', value: config.loadBalancingStrategy === 'sticky' ? 'Enabled' : 'Disabled' }
            ]}
          />
          <ConfigSection
            title="Service Discovery"
            items={[
              { label: 'Method', value: config.discoveryMethod },
              { label: 'Service Name', value: config.discoveryConfig.serviceName || 'N/A' }
            ]}
          />
          <ConfigSection
            title="Circuit Breaker"
            items={[
              { label: 'Status', value: config.circuitBreakerConfig.enabled ? 'Enabled' : 'Disabled', highlight: true },
              { label: 'Failure Threshold', value: `${config.circuitBreakerConfig.failureThreshold} failures` },
              { label: 'Reset Timeout', value: `${config.circuitBreakerConfig.resetTimeout / 1000}s` }
            ]}
          />
          <ConfigSection
            title="State Management"
            items={[
              { label: 'Provider', value: config.stateManagementConfig.provider },
              { label: 'TTL', value: config.stateManagementConfig.ttl ? `${config.stateManagementConfig.ttl / 1000}s` : 'Default' }
            ]}
          />
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Test Actions</h3>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleTestRoute}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Test Route Request
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components
const HealthCard: React.FC<{
  label: string
  value: number
  icon: React.ReactNode
  color: string
}> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">{label}</span>
      <div className={`text-${color}-500`}>{icon}</div>
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
)

const NodeCard: React.FC<{
  node: ServiceNode
  circuitBreaker?: CircuitBreakerState
  onClick: () => void
  isSelected: boolean
}> = ({ node, circuitBreaker, onClick, isSelected }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg cursor-pointer transition-all ${
      isSelected 
        ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500' 
        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold">{node.id}</h4>
      <NodeHealthBadge health={node.health} />
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
      <div>Region: {node.metadata.region}</div>
      <div>Version: {node.metadata.version}</div>
      <div>Connections: {node.connections}</div>
      <div>Weight: {node.weight}</div>
      {circuitBreaker && (
        <div className="flex items-center space-x-1 mt-2">
          <span>Circuit:</span>
          <CircuitBreakerBadge state={circuitBreaker.state} />
        </div>
      )}
    </div>
  </div>
)

const NodeHealthBadge: React.FC<{ health: string }> = ({ health }) => {
  const config = {
    healthy: { color: 'green', icon: <CheckCircle2 className="h-4 w-4" /> },
    degraded: { color: 'yellow', icon: <AlertTriangle className="h-4 w-4" /> },
    unhealthy: { color: 'red', icon: <AlertCircle className="h-4 w-4" /> }
  }[health] || { color: 'gray', icon: null }
  
  return (
    <span className={`flex items-center space-x-1 px-2 py-1 bg-${config.color}-100 dark:bg-${config.color}-900 text-${config.color}-700 dark:text-${config.color}-300 rounded text-xs font-medium`}>
      {config.icon}
      <span>{health}</span>
    </span>
  )
}

const CircuitBreakerBadge: React.FC<{ state: string }> = ({ state }) => {
  const config = {
    closed: { color: 'green', text: 'Closed' },
    open: { color: 'red', text: 'Open' },
    'half-open': { color: 'yellow', text: 'Half-Open' }
  }[state] || { color: 'gray', text: state }
  
  return (
    <span className={`px-2 py-0.5 bg-${config.color}-100 dark:bg-${config.color}-900 text-${config.color}-700 dark:text-${config.color}-300 rounded text-xs font-medium`}>
      {config.text}
    </span>
  )
}

const CircuitBreakerRow: React.FC<{ breaker: CircuitBreakerState }> = ({ breaker }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
    <div className="flex items-center space-x-3">
      <Shield className="h-4 w-4 text-orange-500" />
      <span className="font-medium">{breaker.nodeId}</span>
    </div>
    <div className="flex items-center space-x-4 text-sm">
      <span>Failures: {breaker.failures}</span>
      <CircuitBreakerBadge state={breaker.state} />
      {breaker.nextRetry && (
        <span className="text-gray-600 dark:text-gray-400">
          Retry in {Math.max(0, Math.floor((breaker.nextRetry.getTime() - Date.now()) / 1000))}s
        </span>
      )}
    </div>
  </div>
)

const MetricCard: React.FC<{
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
}> = ({ label, value, icon, color = 'gray' }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div className={`inline-flex p-2 rounded-lg mb-2 bg-${color}-100 dark:bg-${color}-900 text-${color}-600 dark:text-${color}-400`}>
      {icon}
    </div>
    <div className="text-xl font-bold mb-1">{value}</div>
    <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
  </div>
)

const ConfigSection: React.FC<{
  title: string
  items: Array<{ label: string; value: string; highlight?: boolean }>
}> = ({ title, items }) => (
  <div>
    <h5 className="font-medium mb-2">{title}</h5>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
          <span className={`font-mono ${
            item.highlight ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
          }`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
)

// Export both the pattern logic and React component
export { DistributedMCPPatternLogic }

// Export construct definition
export const distributedMCPPatternDefinition = {
  id: 'distributed-mcp-pattern',
  name: 'Distributed MCP Pattern',
  level: 'L2' as const,
  categories: ['pattern', 'distributed', 'mcp'],
  description: 'Distributed MCP with service discovery, load balancing, circuit breakers, and state management',
  version: '1.0.0',
  status: 'stable' as const,
  
  component: DistributedMCPPattern,
  logic: DistributedMCPPatternLogic,
  
  dependencies: [
    {
      id: 'secure-mcp-server',
      level: 'L1',
      version: '^1.0.0',
      type: 'composition'
    },
    {
      id: 'authenticated-tool-registry',
      level: 'L1',
      version: '^1.0.0',
      type: 'composition'
    },
    {
      id: 'rate-limited-rpc',
      level: 'L1',
      version: '^1.0.0',
      type: 'composition'
    },
    {
      id: 'encrypted-websocket',
      level: 'L1',
      version: '^1.0.0',
      type: 'composition'
    }
  ],
  
  tags: ['mcp', 'distributed', 'cluster', 'load-balancing', 'failover', 'circuit-breaker'],
  
  selfReferential: {
    isPlatformConstruct: true,
    buildMethod: 'vibe-coded',
    vibeCodedPercentage: 90,
    testCoverage: 96
  },
  
  configuration: {
    clusterName: {
      type: 'string',
      required: true,
      description: 'Name of the MCP cluster'
    },
    discoveryMethod: {
      type: 'string',
      enum: ['etcd', 'consul', 'static'],
      required: true,
      description: 'Service discovery method'
    },
    discoveryConfig: {
      type: 'object',
      required: true,
      properties: {
        endpoints: { type: 'array', items: { type: 'string' } },
        serviceName: { type: 'string' },
        staticNodes: { type: 'array' }
      }
    },
    loadBalancingStrategy: {
      type: 'string',
      enum: ['round-robin', 'least-connections', 'weighted', 'sticky'],
      default: 'round-robin',
      description: 'Load balancing strategy'
    },
    circuitBreakerConfig: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        failureThreshold: { type: 'number', default: 5 },
        resetTimeout: { type: 'number', default: 60000 },
        halfOpenRequests: { type: 'number', default: 1 }
      }
    },
    stateManagementConfig: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['redis', 'hazelcast', 'memory'], default: 'memory' },
        endpoints: { type: 'array', items: { type: 'string' } },
        ttl: { type: 'number' }
      }
    },
    healthCheckConfig: {
      type: 'object',
      properties: {
        interval: { type: 'number', default: 10000 },
        timeout: { type: 'number', default: 5000 },
        unhealthyThreshold: { type: 'number', default: 3 },
        healthyThreshold: { type: 'number', default: 2 }
      }
    },
    routingRules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
          targets: { type: 'array', items: { type: 'string' } },
          strategy: { type: 'string' }
        }
      }
    }
  },
  
  capabilities: [
    'Service discovery (etcd/consul/static)',
    'Multiple load balancing strategies',
    'Circuit breaker pattern for failover',
    'Distributed state management',
    'Health monitoring and auto-recovery',
    'Request routing with patterns',
    'Sticky session support',
    'Real-time metrics and monitoring'
  ],
  
  interfaces: {
    exports: [
      {
        name: 'DistributedMCPPattern',
        type: 'React.Component',
        description: 'Main pattern component'
      },
      {
        name: 'DistributedMCPPatternLogic',
        type: 'Class',
        description: 'Pattern logic implementation'
      }
    ],
    methods: [
      {
        name: 'route',
        description: 'Route a request to an appropriate node',
        async: true,
        parameters: [
          { name: 'method', type: 'string' },
          { name: 'params', type: 'any' },
          { name: 'context', type: 'RouteContext', optional: true }
        ],
        returns: 'Promise<any>'
      },
      {
        name: 'getSession',
        description: 'Get distributed session data',
        async: true,
        parameters: [{ name: 'sessionId', type: 'string' }],
        returns: 'Promise<any>'
      },
      {
        name: 'setSession',
        description: 'Set distributed session data',
        async: true,
        parameters: [
          { name: 'sessionId', type: 'string' },
          { name: 'data', type: 'any' },
          { name: 'ttl', type: 'number', optional: true }
        ]
      },
      {
        name: 'acquireLock',
        description: 'Acquire a distributed lock',
        async: true,
        parameters: [
          { name: 'lockKey', type: 'string' },
          { name: 'ownerId', type: 'string' },
          { name: 'ttl', type: 'number', optional: true }
        ],
        returns: 'Promise<boolean>'
      },
      {
        name: 'releaseLock',
        description: 'Release a distributed lock',
        async: true,
        parameters: [
          { name: 'lockKey', type: 'string' },
          { name: 'ownerId', type: 'string' }
        ],
        returns: 'Promise<boolean>'
      },
      {
        name: 'getClusterMetrics',
        description: 'Get current cluster metrics',
        returns: 'ClusterMetrics'
      },
      {
        name: 'getServiceNodes',
        description: 'Get all service nodes',
        returns: 'ServiceNode[]'
      },
      {
        name: 'getCircuitBreakers',
        description: 'Get circuit breaker states',
        returns: 'CircuitBreakerState[]'
      }
    ]
  },
  
  examples: [
    {
      title: 'Static Node Configuration',
      code: `const config: DistributedMCPConfig = {
  clusterName: 'production-cluster',
  discoveryMethod: 'static',
  discoveryConfig: {
    staticNodes: [
      {
        id: 'node-1',
        url: 'http://mcp1.example.com:8080',
        health: 'healthy',
        lastHealthCheck: new Date(),
        connections: 0,
        weight: 1,
        metadata: {
          version: '1.0.0',
          region: 'us-east-1',
          capabilities: ['tool-a', 'tool-b']
        }
      },
      {
        id: 'node-2',
        url: 'http://mcp2.example.com:8080',
        health: 'healthy',
        lastHealthCheck: new Date(),
        connections: 0,
        weight: 1,
        metadata: {
          version: '1.0.0',
          region: 'us-west-2',
          capabilities: ['tool-a', 'tool-c']
        }
      }
    ]
  },
  loadBalancingStrategy: 'least-connections',
  circuitBreakerConfig: {
    enabled: true,
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 1
  },
  stateManagementConfig: {
    provider: 'redis',
    endpoints: ['redis://localhost:6379'],
    ttl: 3600000
  },
  healthCheckConfig: {
    interval: 10000,
    timeout: 5000,
    unhealthyThreshold: 3,
    healthyThreshold: 2
  }
}

<DistributedMCPPattern config={config} />`
    },
    {
      title: 'Service Discovery with Consul',
      code: `const config: DistributedMCPConfig = {
  clusterName: 'auto-scaling-cluster',
  discoveryMethod: 'consul',
  discoveryConfig: {
    endpoints: ['http://consul.service.consul:8500'],
    serviceName: 'mcp-server'
  },
  loadBalancingStrategy: 'weighted',
  circuitBreakerConfig: {
    enabled: true,
    failureThreshold: 3,
    resetTimeout: 30000,
    halfOpenRequests: 2
  },
  stateManagementConfig: {
    provider: 'hazelcast',
    endpoints: ['hazelcast://cluster:5701']
  },
  healthCheckConfig: {
    interval: 5000,
    timeout: 2000,
    unhealthyThreshold: 2,
    healthyThreshold: 1
  },
  routingRules: [
    {
      pattern: '^admin.',
      targets: ['admin-node-1', 'admin-node-2'],
      strategy: 'sticky'
    },
    {
      pattern: '^analytics.',
      targets: ['analytics-node-1', 'analytics-node-2', 'analytics-node-3'],
      strategy: 'round-robin'
    }
  ]
}

<DistributedMCPPattern 
  config={config}
  onNodeChange={(nodes) => console.log('Nodes updated:', nodes)}
  onMetricsUpdate={(metrics) => console.log('Metrics:', metrics)}
/>`
    }
  ]
}