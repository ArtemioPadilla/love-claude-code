/**
 * MCP Server Integration Pattern (L2)
 * 
 * Connects to external MCP servers with authentication, rate limiting,
 * and tool orchestration. Provides secure access to MCP capabilities.
 */

import React, { useState, useEffect } from 'react'
import { L2PatternConstruct } from '../../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  CloudProvider 
} from '../../../types'
import { Box, Text, Badge, Progress, Alert, Button } from '../../../L1/ui/ThemedComponents'

export interface MCPServerConfig {
  name: string
  endpoint: string
  version?: string
  authentication?: {
    type: 'none' | 'bearer' | 'apiKey' | 'oauth2'
    credentials?: any
  }
  capabilities?: string[]
  description?: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema?: any
  outputSchema?: any
  examples?: Array<{
    input: any
    output: any
    description?: string
  }>
}

export interface MCPServerConnection {
  server: MCPServerConfig
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  tools: MCPTool[]
  lastConnected?: Date
  error?: string
  metrics?: {
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    averageLatency: number
  }
}

export interface RateLimitConfig {
  enabled: boolean
  requestsPerMinute: number
  burstSize: number
  queueSize: number
}

export interface MCPServerIntegrationConfig {
  servers: MCPServerConfig[]
  rateLimiting: RateLimitConfig
  monitoring: {
    trackLatency: boolean
    logRequests: boolean
    collectMetrics: boolean
  }
  retry: {
    maxAttempts: number
    backoffMs: number
    maxBackoffMs: number
  }
  security: {
    validateResponses: boolean
    maxResponseSize: number
    timeout: number
    allowedTools?: string[]
    blockedTools?: string[]
  }
}

export interface MCPToolCall {
  server: string
  tool: string
  input: any
  metadata?: {
    requestId?: string
    timestamp?: Date
    priority?: 'low' | 'normal' | 'high'
  }
}

export interface MCPToolResponse {
  success: boolean
  output?: any
  error?: string
  metadata?: {
    server: string
    tool: string
    latency: number
    timestamp: Date
  }
}

export interface MCPServerIntegrationPatternProps {
  config: MCPServerIntegrationConfig
  onToolCall?: (call: MCPToolCall, response: MCPToolResponse) => void
  onServerConnect?: (server: MCPServerConfig) => void
  onServerError?: (server: string, error: Error) => void
  showUI?: boolean
}

/**
 * MCP Server Integration Pattern Implementation
 */
export class MCPServerIntegrationPattern extends L2PatternConstruct {
  private static metadata: PlatformConstructDefinition = {
    id: 'platform-l2-mcp-server-integration-pattern',
    name: 'MCP Server Integration Pattern',
    level: ConstructLevel.L2,
    type: ConstructType.PATTERN,
    description: 'Pattern for connecting to and orchestrating external MCP servers',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'mcp', 'integration'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['mcp', 'server', 'integration', 'rpc', 'pattern'],
    dependencies: [
      'platform-l1-authenticated-tool-registry',
      'platform-l1-rate-limited-rpc',
      'platform-l1-encrypted-websocket'
    ],
    inputs: [
      {
        name: 'config',
        type: 'MCPServerIntegrationConfig',
        description: 'MCP server integration configuration',
        required: true
      }
    ],
    outputs: [
      {
        name: 'connections',
        type: 'Map<string, MCPServerConnection>',
        description: 'Active MCP server connections'
      },
      {
        name: 'availableTools',
        type: 'MCPTool[]',
        description: 'All available tools from connected servers'
      }
    ],
    security: [
      {
        aspect: 'remote-execution',
        description: 'Executes tools on remote MCP servers',
        severity: 'high',
        recommendations: [
          'Use authentication for all servers',
          'Validate all responses',
          'Implement rate limiting',
          'Monitor for anomalous behavior'
        ]
      },
      {
        aspect: 'data-exposure',
        description: 'Sends data to external servers',
        severity: 'medium',
        recommendations: [
          'Encrypt sensitive data',
          'Audit all tool calls',
          'Use minimal permissions',
          'Implement data masking'
        ]
      }
    ],
    cost: {
      baseMonthly: 10,
      usageFactors: [
        { name: 'serverCount', unitCost: 2 },
        { name: 'toolCallsPerMonth', unitCost: 0.001 },
        { name: 'dataTransferGB', unitCost: 0.1 }
      ]
    },
    examples: [
      {
        title: 'Connect to MCP Server and Call Tool',
        description: 'Connect to an MCP server and execute a tool',
        code: `const mcpIntegration = new MCPServerIntegrationPattern({
  config: {
    servers: [{
      name: 'code-analysis',
      endpoint: 'https://mcp.example.com',
      authentication: {
        type: 'bearer',
        credentials: { token: process.env.MCP_TOKEN }
      }
    }],
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 60,
      burstSize: 10,
      queueSize: 100
    },
    security: {
      validateResponses: true,
      maxResponseSize: 10 * 1024 * 1024, // 10MB
      timeout: 30000,
      allowedTools: ['analyze_code', 'format_code']
    }
  }
})

// Connect to server
await mcpIntegration.connectServer('code-analysis')

// Call a tool
const response = await mcpIntegration.callTool({
  server: 'code-analysis',
  tool: 'analyze_code',
  input: {
    code: 'function hello() { console.log("world") }',
    language: 'javascript'
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Authenticate all MCP server connections',
      'Implement circuit breakers for unreliable servers',
      'Cache tool schemas to reduce discovery calls',
      'Use rate limiting to prevent abuse',
      'Monitor latency and error rates',
      'Implement request/response logging for debugging',
      'Use connection pooling for efficiency'
    ],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 82,
      generatedBy: 'Agent 4: External Integration Specialist'
    }
  }

  private config: MCPServerIntegrationConfig
  private connections: Map<string, MCPServerConnection> = new Map()
  private rateLimiter?: any
  private requestQueue: Array<{
    call: MCPToolCall
    resolve: (response: MCPToolResponse) => void
    reject: (error: Error) => void
  }> = []
  private websockets: Map<string, WebSocket> = new Map()
  private toolSchemaCache: Map<string, MCPTool[]> = new Map()

  constructor(config: MCPServerIntegrationConfig) {
    super(MCPServerIntegrationPattern.metadata, { config })
    this.config = config
  }

  async initialize(config: any): Promise<void> {
    await this.beforeCompose()
    await this.composePattern()
    this.configureInteractions()
    await this.afterCompose()
    this.initialized = true
  }

  protected async composePattern(): Promise<void> {
    // Initialize rate limiter
    if (this.config.rateLimiting.enabled) {
      this.rateLimiter = this.createRateLimiter()
      this.addConstruct('rate-limiter', this.rateLimiter)
    }

    // Initialize request queue processor
    this.startQueueProcessor()

    // Auto-connect to configured servers
    for (const server of this.config.servers) {
      try {
        await this.connectServer(server.name)
      } catch (error) {
        console.error(`Failed to connect to ${server.name}:`, error)
      }
    }
  }

  protected configureInteractions(): void {
    // Set up monitoring
    if (this.config.monitoring.collectMetrics) {
      this.on('tool-called', (data) => {
        const connection = this.connections.get(data.server)
        if (connection?.metrics) {
          connection.metrics.totalCalls++
          if (data.success) {
            connection.metrics.successfulCalls++
          } else {
            connection.metrics.failedCalls++
          }
          // Update average latency
          const prevAvg = connection.metrics.averageLatency
          const count = connection.metrics.totalCalls
          connection.metrics.averageLatency = 
            (prevAvg * (count - 1) + data.latency) / count
        }
      })
    }

    // Set up error handling
    this.on('server-error', (data) => {
      console.error(`MCP Server Error [${data.server}]:`, data.error)
      // Implement circuit breaker logic
      const connection = this.connections.get(data.server)
      if (connection) {
        connection.status = 'error'
        connection.error = data.error
      }
    })

    // Set up reconnection logic
    this.on('server-disconnected', async (data) => {
      console.log(`MCP Server disconnected: ${data.server}`)
      // Attempt reconnection with exponential backoff
      setTimeout(() => {
        this.reconnectServer(data.server)
      }, this.config.retry.backoffMs)
    })
  }

  /**
   * Create rate limiter
   */
  private createRateLimiter(): any {
    const { requestsPerMinute, burstSize } = this.config.rateLimiting
    
    return {
      tokens: burstSize,
      lastRefill: Date.now(),
      refillRate: requestsPerMinute / 60, // tokens per second
      
      tryAcquire: function(): boolean {
        // Refill tokens
        const now = Date.now()
        const elapsed = (now - this.lastRefill) / 1000
        const tokensToAdd = elapsed * this.refillRate
        this.tokens = Math.min(burstSize, this.tokens + tokensToAdd)
        this.lastRefill = now
        
        // Try to acquire token
        if (this.tokens >= 1) {
          this.tokens--
          return true
        }
        return false
      }
    }
  }

  /**
   * Start request queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.requestQueue.length === 0) return
      
      // Process queue based on rate limit
      while (this.requestQueue.length > 0 && 
             (!this.rateLimiter || this.rateLimiter.tryAcquire())) {
        const request = this.requestQueue.shift()!
        this.executeToolCall(request.call)
          .then(request.resolve)
          .catch(request.reject)
      }
      
      // Check queue size limit
      if (this.requestQueue.length > this.config.rateLimiting.queueSize) {
        // Reject oldest requests
        const toReject = this.requestQueue.splice(
          0, 
          this.requestQueue.length - this.config.rateLimiting.queueSize
        )
        toReject.forEach(req => {
          req.reject(new Error('Request queue overflow'))
        })
      }
    }, 100) // Check every 100ms
  }

  /**
   * Connect to an MCP server
   */
  async connectServer(serverName: string): Promise<void> {
    const serverConfig = this.config.servers.find(s => s.name === serverName)
    if (!serverConfig) {
      throw new Error(`Server ${serverName} not configured`)
    }

    // Create connection entry
    const connection: MCPServerConnection = {
      server: serverConfig,
      status: 'connecting',
      tools: [],
      metrics: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageLatency: 0
      }
    }
    this.connections.set(serverName, connection)

    try {
      // Establish WebSocket connection
      const ws = await this.createWebSocketConnection(serverConfig)
      this.websockets.set(serverName, ws)

      // Authenticate if required
      if (serverConfig.authentication && serverConfig.authentication.type !== 'none') {
        await this.authenticateServer(serverName, serverConfig.authentication)
      }

      // Discover available tools
      const tools = await this.discoverTools(serverName)
      connection.tools = tools
      connection.status = 'connected'
      connection.lastConnected = new Date()
      
      // Cache tool schemas
      this.toolSchemaCache.set(serverName, tools)

      this.emit('server-connected', {
        server: serverName,
        toolCount: tools.length
      })

    } catch (error) {
      connection.status = 'error'
      connection.error = error.message
      this.emit('server-error', {
        server: serverName,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Create WebSocket connection
   */
  private async createWebSocketConnection(server: MCPServerConfig): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(server.endpoint)
      
      ws.onopen = () => {
        console.log(`WebSocket connected to ${server.name}`)
        resolve(ws)
      }
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for ${server.name}:`, error)
        reject(new Error('WebSocket connection failed'))
      }
      
      ws.onclose = () => {
        this.emit('server-disconnected', { server: server.name })
      }
      
      ws.onmessage = (event) => {
        // Handle incoming messages
        this.handleWebSocketMessage(server.name, event.data)
      }
      
      // Set timeout
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          reject(new Error('Connection timeout'))
        }
      }, this.config.security.timeout)
    })
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(serverName: string, data: any): void {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data
      
      // Validate response size
      if (this.config.security.validateResponses) {
        const size = JSON.stringify(message).length
        if (size > this.config.security.maxResponseSize) {
          throw new Error('Response size exceeded limit')
        }
      }
      
      // Handle different message types
      switch (message.type) {
        case 'tool_response':
          this.handleToolResponse(serverName, message)
          break
        case 'error':
          this.handleServerError(serverName, message)
          break
        case 'notification':
          this.handleServerNotification(serverName, message)
          break
      }
    } catch (error) {
      console.error(`Failed to handle message from ${serverName}:`, error)
    }
  }

  /**
   * Authenticate with server
   */
  private async authenticateServer(
    serverName: string, 
    auth: MCPServerConfig['authentication']
  ): Promise<void> {
    const ws = this.websockets.get(serverName)
    if (!ws) throw new Error('No WebSocket connection')

    const authMessage = {
      type: 'authenticate',
      method: auth!.type,
      credentials: auth!.credentials
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'))
      }, 10000)

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data)
        if (response.type === 'auth_response') {
          clearTimeout(timeout)
          ws.removeEventListener('message', handler)
          
          if (response.success) {
            resolve()
          } else {
            reject(new Error(response.error || 'Authentication failed'))
          }
        }
      }

      ws.addEventListener('message', handler)
      ws.send(JSON.stringify(authMessage))
    })
  }

  /**
   * Discover available tools
   */
  private async discoverTools(serverName: string): Promise<MCPTool[]> {
    const ws = this.websockets.get(serverName)
    if (!ws) throw new Error('No WebSocket connection')

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool discovery timeout'))
      }, 10000)

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data)
        if (response.type === 'tools_response') {
          clearTimeout(timeout)
          ws.removeEventListener('message', handler)
          
          if (response.success) {
            // Filter tools based on security config
            let tools = response.tools as MCPTool[]
            
            if (this.config.security.allowedTools) {
              tools = tools.filter(t => 
                this.config.security.allowedTools!.includes(t.name)
              )
            }
            
            if (this.config.security.blockedTools) {
              tools = tools.filter(t => 
                !this.config.security.blockedTools!.includes(t.name)
              )
            }
            
            resolve(tools)
          } else {
            reject(new Error(response.error || 'Tool discovery failed'))
          }
        }
      }

      ws.addEventListener('message', handler)
      ws.send(JSON.stringify({ type: 'discover_tools' }))
    })
  }

  /**
   * Reconnect to server
   */
  private async reconnectServer(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName)
    if (!connection || connection.status === 'connected') return

    try {
      await this.connectServer(serverName)
    } catch (error) {
      // Schedule next retry with exponential backoff
      const nextRetry = Math.min(
        this.config.retry.backoffMs * Math.pow(2, connection.metrics?.failedCalls || 0),
        this.config.retry.maxBackoffMs
      )
      
      setTimeout(() => {
        this.reconnectServer(serverName)
      }, nextRetry)
    }
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(call: MCPToolCall): Promise<MCPToolResponse> {
    // Check if server is connected
    const connection = this.connections.get(call.server)
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Server ${call.server} not connected`)
    }

    // Check if tool exists
    const tool = connection.tools.find(t => t.name === call.tool)
    if (!tool) {
      throw new Error(`Tool ${call.tool} not found on server ${call.server}`)
    }

    // Add to queue if rate limiting is enabled
    if (this.config.rateLimiting.enabled) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ call, resolve, reject })
      })
    }

    // Execute directly
    return this.executeToolCall(call)
  }

  /**
   * Execute tool call
   */
  private async executeToolCall(call: MCPToolCall): Promise<MCPToolResponse> {
    const startTime = Date.now()
    const ws = this.websockets.get(call.server)
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error(`No active connection to ${call.server}`)
    }

    // Log request if enabled
    if (this.config.monitoring.logRequests) {
      console.log(`[MCP] Calling ${call.server}:${call.tool}`, call.input)
    }

    const requestId = Math.random().toString(36).substr(2, 9)
    const request = {
      type: 'tool_call',
      id: requestId,
      tool: call.tool,
      input: call.input,
      metadata: call.metadata
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool call timeout'))
      }, this.config.security.timeout)

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data)
        if (response.type === 'tool_response' && response.id === requestId) {
          clearTimeout(timeout)
          ws.removeEventListener('message', handler)
          
          const latency = Date.now() - startTime
          const result: MCPToolResponse = {
            success: response.success,
            output: response.output,
            error: response.error,
            metadata: {
              server: call.server,
              tool: call.tool,
              latency,
              timestamp: new Date()
            }
          }

          // Track metrics
          this.emit('tool-called', {
            server: call.server,
            tool: call.tool,
            success: response.success,
            latency
          })

          if (response.success) {
            resolve(result)
          } else {
            reject(new Error(response.error || 'Tool call failed'))
          }
        }
      }

      ws.addEventListener('message', handler)
      ws.send(JSON.stringify(request))
    })
  }

  /**
   * Handle tool response
   */
  private handleToolResponse(serverName: string, message: any): void {
    // This is handled in executeToolCall
    // Could be used for async notifications
  }

  /**
   * Handle server error
   */
  private handleServerError(serverName: string, message: any): void {
    this.emit('server-error', {
      server: serverName,
      error: message.error || 'Unknown error'
    })
  }

  /**
   * Handle server notification
   */
  private handleServerNotification(serverName: string, message: any): void {
    this.emit('server-notification', {
      server: serverName,
      notification: message.data
    })
  }

  /**
   * Disconnect from a server
   */
  async disconnectServer(serverName: string): Promise<void> {
    const ws = this.websockets.get(serverName)
    if (ws) {
      ws.close()
      this.websockets.delete(serverName)
    }
    
    const connection = this.connections.get(serverName)
    if (connection) {
      connection.status = 'disconnected'
    }
    
    this.emit('server-disconnected', { server: serverName })
  }

  /**
   * Get all available tools
   */
  getAvailableTools(): MCPTool[] {
    const tools: MCPTool[] = []
    
    for (const connection of this.connections.values()) {
      if (connection.status === 'connected') {
        tools.push(...connection.tools)
      }
    }
    
    return tools
  }

  /**
   * Get server connection status
   */
  getServerStatus(serverName: string): MCPServerConnection | undefined {
    return this.connections.get(serverName)
  }

  /**
   * Get all connections
   */
  getAllConnections(): MCPServerConnection[] {
    return Array.from(this.connections.values())
  }

  /**
   * Render the pattern UI
   */
  render(): React.ReactElement {
    return <MCPServerIntegrationPatternComponent pattern={this} />
  }

  async destroy(): Promise<void> {
    // Close all WebSocket connections
    for (const [name, ws] of this.websockets.entries()) {
      ws.close()
    }
    this.websockets.clear()
    this.connections.clear()
    this.requestQueue = []
    
    await super.destroy()
  }
}

/**
 * React component for MCP Server Integration Pattern
 */
const MCPServerIntegrationPatternComponent: React.FC<{ pattern: MCPServerIntegrationPattern }> = ({ pattern }) => {
  const [connections, setConnections] = useState<MCPServerConnection[]>([])
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [toolCallResult, setToolCallResult] = useState<any>(null)

  useEffect(() => {
    const updateConnections = () => {
      setConnections(pattern.getAllConnections())
    }

    pattern.on('server-connected', updateConnections)
    pattern.on('server-disconnected', updateConnections)
    pattern.on('server-error', updateConnections)
    pattern.on('tool-called', (data) => {
      updateConnections()
      if (data.server === selectedServer) {
        setToolCallResult(data)
      }
    })

    updateConnections()

    return () => {
      pattern.off('server-connected', updateConnections)
      pattern.off('server-disconnected', updateConnections)
      pattern.off('server-error', updateConnections)
    }
  }, [pattern, selectedServer])

  const handleConnect = async (serverName: string) => {
    try {
      await pattern.connectServer(serverName)
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = async (serverName: string) => {
    try {
      await pattern.disconnectServer(serverName)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleCallTool = async (server: string, tool: string) => {
    try {
      const result = await pattern.callTool({
        server,
        tool,
        input: { test: true }
      })
      setToolCallResult(result)
    } catch (error) {
      console.error('Tool call failed:', error)
      setToolCallResult({ error: error.message })
    }
  }

  return (
    <Box className="mcp-server-integration-pattern p-6">
      <Text variant="h3" className="mb-4">MCP Server Integration</Text>

      {/* Server Connections */}
      <Box className="mb-6">
        <Text variant="h4" className="mb-3">Server Connections</Text>
        <div className="space-y-3">
          {connections.map((conn) => (
            <Box 
              key={conn.server.name} 
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedServer === conn.server.name ? 'border-blue-500' : ''
              }`}
              onClick={() => setSelectedServer(conn.server.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Text variant="body1" className="font-medium">
                    {conn.server.name}
                  </Text>
                  <Text variant="caption" className="text-gray-600">
                    {conn.server.endpoint}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      conn.status === 'connected' ? 'success' : 
                      conn.status === 'connecting' ? 'warning' : 
                      conn.status === 'error' ? 'error' : 'default'
                    }
                  >
                    {conn.status}
                  </Badge>
                  {conn.status === 'disconnected' ? (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConnect(conn.server.name)
                      }}
                    >
                      Connect
                    </Button>
                  ) : conn.status === 'connected' ? (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDisconnect(conn.server.name)
                      }}
                    >
                      Disconnect
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Connection Metrics */}
              {conn.status === 'connected' && conn.metrics && (
                <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                  <div>
                    <Text variant="caption" className="text-gray-500">Total Calls</Text>
                    <Text variant="body2">{conn.metrics.totalCalls}</Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Success Rate</Text>
                    <Text variant="body2">
                      {conn.metrics.totalCalls > 0 
                        ? Math.round((conn.metrics.successfulCalls / conn.metrics.totalCalls) * 100)
                        : 0}%
                    </Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Avg Latency</Text>
                    <Text variant="body2">{Math.round(conn.metrics.averageLatency)}ms</Text>
                  </div>
                  <div>
                    <Text variant="caption" className="text-gray-500">Tools</Text>
                    <Text variant="body2">{conn.tools.length}</Text>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {conn.status === 'error' && conn.error && (
                <Alert variant="error" className="mt-2">
                  {conn.error}
                </Alert>
              )}
            </Box>
          ))}
        </div>
      </Box>

      {/* Available Tools */}
      {selectedServer && (
        <Box className="mb-6">
          <Text variant="h4" className="mb-3">Available Tools</Text>
          <div className="grid grid-cols-2 gap-3">
            {connections
              .find(c => c.server.name === selectedServer)
              ?.tools.map((tool) => (
                <Box 
                  key={tool.name} 
                  className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer"
                  onClick={() => handleCallTool(selectedServer, tool.name)}
                >
                  <Text variant="body2" className="font-medium">{tool.name}</Text>
                  <Text variant="caption" className="text-gray-600">
                    {tool.description}
                  </Text>
                </Box>
              ))}
          </div>
        </Box>
      )}

      {/* Tool Call Result */}
      {toolCallResult && (
        <Box className="p-4 bg-gray-50 rounded-lg">
          <Text variant="h4" className="mb-2">Last Tool Call Result</Text>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(toolCallResult, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  )
}

// Export component separately
export const MCPServerIntegrationPatternComponent = MCPServerIntegrationPattern