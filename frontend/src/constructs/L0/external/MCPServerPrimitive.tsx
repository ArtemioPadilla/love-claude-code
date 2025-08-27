import React, { useRef, useEffect, useState } from 'react'
import { L0ExternalConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * MCP Tool definition
 */
interface MCPTool {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

/**
 * MCP Server state
 */
interface MCPServerState {
  connected: boolean
  tools: MCPTool[]
  lastError?: string
  requestCount: number
  responseCount: number
  averageResponseTime: number
}

/**
 * MCP Request/Response types
 */
interface MCPRequest {
  id: string
  method: string
  params: any
  timestamp: number
}

interface MCPResponse {
  id: string
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
  timestamp: number
}

/**
 * Authentication configuration
 */
interface MCPAuthConfig {
  type: 'none' | 'api-key' | 'oauth' | 'custom'
  apiKey?: string
  oauthConfig?: {
    clientId: string
    clientSecret: string
    authUrl: string
    tokenUrl: string
  }
  customAuth?: (request: MCPRequest) => Promise<boolean>
}

/**
 * L0 MCP Server Primitive
 * External MCP server wrapper with protocol client, tool discovery, and streaming
 */
export class MCPServerPrimitive extends L0ExternalConstruct {
  private ws: WebSocket | null = null
  private pendingRequests: Map<string, (response: MCPResponse) => void> = new Map()
  private requestId: number = 0
  private responseTimes: number[] = []
  
  private state: MCPServerState = {
    connected: false,
    tools: [],
    requestCount: 0,
    responseCount: 0,
    averageResponseTime: 0
  }
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-mcp-server-primitive',
    name: 'MCP Server Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Pattern,
    description: 'MCP protocol client for external server integration with tool discovery and streaming',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'integration', 'mcp'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['mcp', 'server', 'primitive', 'protocol', 'streaming'],
    inputs: [
      {
        name: 'serverUrl',
        type: 'string',
        description: 'MCP server WebSocket URL',
        required: true,
        validation: {
          pattern: '^wss?://.*'
        }
      },
      {
        name: 'authConfig',
        type: 'object',
        description: 'Authentication configuration',
        required: false,
        defaultValue: { type: 'none' }
      },
      {
        name: 'reconnectAttempts',
        type: 'number',
        description: 'Number of reconnection attempts',
        required: false,
        defaultValue: 3
      },
      {
        name: 'timeout',
        type: 'number',
        description: 'Request timeout in milliseconds',
        required: false,
        defaultValue: 30000
      }
    ],
    outputs: [
      {
        name: 'client',
        type: 'object',
        description: 'MCP client instance for making requests'
      },
      {
        name: 'tools',
        type: 'array',
        description: 'Available tools from the server'
      },
      {
        name: 'state',
        type: 'object',
        description: 'Current server connection state'
      }
    ],
    security: [
      {
        aspect: 'authentication',
        description: 'Supports multiple authentication methods',
        severity: 'high',
        recommendations: [
          'Use secure authentication methods',
          'Store credentials securely',
          'Implement token refresh for OAuth'
        ]
      },
      {
        aspect: 'transport-security',
        description: 'WebSocket communication security',
        severity: 'high',
        recommendations: [
          'Always use WSS (WebSocket Secure) in production',
          'Validate server certificates',
          'Implement message encryption for sensitive data'
        ]
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'requests',
          unit: '1000 requests',
          costPerUnit: 0.001,
          typicalUsage: 100
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'WebSocket Client'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Connect to an MCP server',
        code: `const mcp = new MCPServerPrimitive()
await mcp.initialize({
  serverUrl: 'wss://mcp-server.example.com',
  authConfig: {
    type: 'api-key',
    apiKey: 'your-api-key'
  }
})

// Use the client
const client = mcp.getOutput('client')
const result = await client.invoke('tool-name', { param: 'value' })`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Implement proper error recovery',
      'Monitor connection health',
      'Cache tool definitions',
      'Use streaming for large responses',
      'Implement request queuing for rate limits'
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
      timeToCreate: 60,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(MCPServerPrimitive.definition)
  }

  /**
   * Parse external resource definition
   */
  parseDefinition(input: string | object): any {
    if (typeof input === 'string') {
      return { serverUrl: input }
    }
    return input
  }

  /**
   * Validate external resource configuration
   */
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    
    if (!config.serverUrl) {
      errors.push('Server URL is required')
    } else if (!config.serverUrl.match(/^wss?:\/\/.*/)) {
      errors.push('Server URL must be a valid WebSocket URL (ws:// or wss://)')
    }
    
    if (config.authConfig) {
      if (!['none', 'api-key', 'oauth', 'custom'].includes(config.authConfig.type)) {
        errors.push('Invalid authentication type')
      }
      
      if (config.authConfig.type === 'api-key' && !config.authConfig.apiKey) {
        errors.push('API key is required for api-key authentication')
      }
      
      if (config.authConfig.type === 'oauth' && (!config.authConfig.oauthConfig?.clientId || !config.authConfig.oauthConfig?.clientSecret)) {
        errors.push('OAuth client ID and secret are required')
      }
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
      server: {
        url: this.getInput<string>('serverUrl'),
        reconnectAttempts: this.getInput<number>('reconnectAttempts') || 3,
        timeout: this.getInput<number>('timeout') || 30000
      },
      auth: this.getInput<MCPAuthConfig>('authConfig') || { type: 'none' },
      state: this.state
    }
  }

  /**
   * Connect to MCP server
   */
  private async connect(): Promise<void> {
    const serverUrl = this.getInput<string>('serverUrl')
    const authConfig = this.getInput<MCPAuthConfig>('authConfig') || { type: 'none' }
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl)
        
        this.ws.onopen = async () => {
          console.log('MCP Server connected')
          this.state.connected = true
          
          // Perform authentication if needed
          if (authConfig.type !== 'none') {
            await this.authenticate(authConfig)
          }
          
          // Discover tools
          await this.discoverTools()
          
          this.updateState()
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          try {
            const response: MCPResponse = JSON.parse(event.data)
            this.handleResponse(response)
          } catch (error) {
            console.error('Failed to parse MCP response:', error)
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('MCP Server error:', error)
          this.state.lastError = 'WebSocket error'
          this.updateState()
        }
        
        this.ws.onclose = () => {
          console.log('MCP Server disconnected')
          this.state.connected = false
          this.updateState()
          
          // Attempt reconnection
          this.attemptReconnection()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Authenticate with the server
   */
  private async authenticate(authConfig: MCPAuthConfig): Promise<void> {
    // Simulate authentication based on type
    const authRequest: MCPRequest = {
      id: this.generateRequestId(),
      method: 'authenticate',
      params: {},
      timestamp: Date.now()
    }
    
    switch (authConfig.type) {
      case 'api-key':
        authRequest.params = { apiKey: authConfig.apiKey }
        break
      case 'oauth':
        // In production, implement OAuth flow
        authRequest.params = { 
          clientId: authConfig.oauthConfig?.clientId,
          // Token would be obtained through OAuth flow
        }
        break
      case 'custom':
        if (authConfig.customAuth) {
          const authorized = await authConfig.customAuth(authRequest)
          if (!authorized) {
            throw new Error('Custom authentication failed')
          }
          return
        }
        break
    }
    
    await this.sendRequest(authRequest)
  }

  /**
   * Discover available tools
   */
  private async discoverTools(): Promise<void> {
    const response = await this.sendRequest({
      id: this.generateRequestId(),
      method: 'tools/list',
      params: {},
      timestamp: Date.now()
    })
    
    if (response.result?.tools) {
      this.state.tools = response.result.tools
      this.setOutput('tools', this.state.tools)
    }
  }

  /**
   * Send request to server
   */
  private sendRequest(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }
      
      const timeout = this.getInput<number>('timeout') || 30000
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(request.id)
        reject(new Error('Request timeout'))
      }, timeout)
      
      this.pendingRequests.set(request.id, (response) => {
        clearTimeout(timeoutId)
        resolve(response)
      })
      
      this.ws.send(JSON.stringify(request))
      this.state.requestCount++
      this.updateState()
    })
  }

  /**
   * Handle server response
   */
  private handleResponse(response: MCPResponse): void {
    const handler = this.pendingRequests.get(response.id)
    if (handler) {
      this.pendingRequests.delete(response.id)
      
      // Track response time
      const request = { timestamp: Date.now() - 1000 } // Approximate
      const responseTime = response.timestamp - request.timestamp
      this.responseTimes.push(responseTime)
      if (this.responseTimes.length > 100) {
        this.responseTimes.shift()
      }
      
      this.state.responseCount++
      this.state.averageResponseTime = 
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      
      this.updateState()
      handler(response)
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`
  }

  /**
   * Attempt reconnection
   */
  private async attemptReconnection(): Promise<void> {
    const maxAttempts = this.getInput<number>('reconnectAttempts') || 3
    let attempts = 0
    
    while (attempts < maxAttempts && !this.state.connected) {
      attempts++
      console.log(`Reconnection attempt ${attempts}/${maxAttempts}`)
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
      
      try {
        await this.connect()
        break
      } catch (error) {
        console.error('Reconnection failed:', error)
      }
    }
  }

  /**
   * Update state and notify
   */
  private updateState(): void {
    this.setOutput('state', this.state)
  }

  /**
   * Create MCP client interface
   */
  private createClient() {
    return {
      invoke: async (toolName: string, params: any) => {
        const request: MCPRequest = {
          id: this.generateRequestId(),
          method: `tools/${toolName}`,
          params,
          timestamp: Date.now()
        }
        
        const response = await this.sendRequest(request)
        
        if (response.error) {
          throw new Error(response.error.message)
        }
        
        return response.result
      },
      
      stream: async function* (toolName: string, params: any) {
        // Implement streaming support
        // This would use a different protocol for streaming responses
        yield* []
      },
      
      getTools: () => this.state.tools,
      
      isConnected: () => this.state.connected,
      
      getState: () => this.state
    }
  }

  /**
   * Initialize the MCP server connection
   */
  protected async onInitialize(): Promise<void> {
    await this.connect()
    
    const client = this.createClient()
    this.setOutput('client', client)
    this.setOutput('tools', this.state.tools)
    this.setOutput('state', this.state)
  }

  /**
   * Clean up on destroy
   */
  protected async onDestroy(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.pendingRequests.clear()
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <MCPServerPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the MCP server primitive
 */
const MCPServerPrimitiveComponent: React.FC<{ construct: MCPServerPrimitive }> = ({ construct }) => {
  const [state, setState] = useState<MCPServerState>({
    connected: false,
    tools: [],
    requestCount: 0,
    responseCount: 0,
    averageResponseTime: 0
  })

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const currentState = construct['getOutput']('state')
      if (currentState) setState(currentState)
    }, 500)

    return () => clearInterval(updateInterval)
  }, [construct])

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '4px', 
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>MCP Server Status</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Connection:</strong> 
        <span style={{ 
          color: state.connected ? 'green' : 'red',
          marginLeft: '8px'
        }}>
          {state.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Available Tools:</strong> {state.tools.length}
        {state.tools.length > 0 && (
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {state.tools.slice(0, 5).map((tool, i) => (
              <li key={i}>{tool.name}</li>
            ))}
            {state.tools.length > 5 && <li>...and {state.tools.length - 5} more</li>}
          </ul>
        )}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Requests:</strong> {state.requestCount} sent, {state.responseCount} received
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Avg Response Time:</strong> {state.averageResponseTime.toFixed(2)}ms
      </div>
      
      {state.lastError && (
        <div style={{ color: 'red' }}>
          <strong>Last Error:</strong> {state.lastError}
        </div>
      )}
    </div>
  )
}

// Export factory function
export const createMCPServerPrimitive = () => new MCPServerPrimitive()

// Export definition for catalog registration
export const mcpServerPrimitiveDefinition = MCPServerPrimitive.definition