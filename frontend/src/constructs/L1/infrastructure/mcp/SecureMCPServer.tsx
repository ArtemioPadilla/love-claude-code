/**
 * Secure MCP Server L1 Infrastructure Construct
 * 
 * Production-ready MCP server with authentication, rate limiting, and encryption.
 * Composes L0 primitives (WebSocket, RPC, ToolRegistry, MessageQueue) with security features.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { L1MCPConstruct } from '../../../base/L1MCPConstruct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel,
  MCPTool,
  MCPToolResponse
} from '../../../types'

// Import L0 primitives
import { WebSocketPrimitive, WebSocketPrimitiveOutput } from '../../../L0/infrastructure/mcp/WebSocketPrimitive'
import { RPCPrimitive, RPCPrimitiveOutput } from '../../../L0/infrastructure/mcp/RPCPrimitive'
import { ToolRegistryPrimitive, ToolRegistryPrimitiveOutput } from '../../../L0/infrastructure/mcp/ToolRegistryPrimitive'
import { MessageQueuePrimitive, MessageQueuePrimitiveOutput } from '../../../L0/infrastructure/mcp/MessageQueuePrimitive'

// Import auth manager
import { MCPAuthManager, AuthSession } from '../../../../services/mcp/MCPAuthManager'

// Type definitions
export interface SecureMCPServerConfig {
  /** Server name */
  name: string
  /** Server version */
  version: string
  /** WebSocket endpoint */
  wsEndpoint: string
  /** RPC endpoint */
  rpcEndpoint: string
  /** Authentication configuration */
  auth: {
    enabled: boolean
    method: 'jwt' | 'oauth' | 'apiKey'
    publicKey?: string
    providers?: string[]
  }
  /** Rate limiting configuration */
  rateLimit: {
    enabled: boolean
    windowMs: number
    maxRequests: number
    maxBurst?: number
  }
  /** Encryption configuration */
  encryption: {
    enabled: boolean
    algorithm?: 'aes-256-gcm' | 'aes-256-cbc'
    keyRotationInterval?: number
  }
  /** Initial tools to register */
  tools?: MCPTool[]
  /** Enable monitoring */
  monitoring?: boolean
}

export interface SecureMCPServerProps {
  config: SecureMCPServerConfig
  onToolRegistered?: (tool: MCPTool) => void
  onToolExecuted?: (toolName: string, result: MCPToolResponse) => void
  onAuthFailure?: (reason: string) => void
  onRateLimitExceeded?: (clientId: string) => void
  onError?: (error: Error) => void
}

export interface SecureMCPServerOutput {
  /** Server status */
  status: 'starting' | 'running' | 'stopped' | 'error'
  /** Execute a tool */
  executeTool: (toolName: string, params: any, auth: string) => Promise<MCPToolResponse>
  /** Register a new tool */
  registerTool: (tool: MCPTool, auth: string) => Promise<boolean>
  /** Get server metrics */
  getMetrics: () => ServerMetrics
  /** Stop the server */
  stop: () => void
}

export interface ServerMetrics {
  uptime: number
  totalRequests: number
  authFailures: number
  rateLimitHits: number
  activeConnections: number
  registeredTools: number
  executionErrors: number
}

/**
 * Secure MCP Server Component
 */
export const SecureMCPServer: React.FC<SecureMCPServerProps> = ({
  config,
  onToolRegistered,
  onToolExecuted,
  onAuthFailure,
  onRateLimitExceeded,
  onError
}) => {
  const [status, setStatus] = useState<SecureMCPServerOutput['status']>('starting')
  const [metrics, setMetrics] = useState<ServerMetrics>({
    uptime: 0,
    totalRequests: 0,
    authFailures: 0,
    rateLimitHits: 0,
    activeConnections: 0,
    registeredTools: 0,
    executionErrors: 0
  })

  // L0 primitive refs
  const wsOutputRef = useRef<WebSocketPrimitiveOutput | null>(null)
  const rpcOutputRef = useRef<RPCPrimitiveOutput | null>(null)
  const toolRegistryRef = useRef<ToolRegistryPrimitiveOutput | null>(null)
  const messageQueueRef = useRef<MessageQueuePrimitiveOutput | null>(null)

  // Auth manager
  const authManager = useRef(new MCPAuthManager({
    publicKey: config.auth.publicKey,
    algorithm: 'RS256'
  }))

  // Rate limit tracking
  const rateLimitMap = useRef<Map<string, { count: number; resetAt: number }>>(new Map())

  // Start time for uptime tracking
  const startTime = useRef(Date.now())

  // Validate authentication
  const validateAuth = useCallback(async (token: string): Promise<AuthSession | null> => {
    if (!config.auth.enabled) {
      return { userId: 'anonymous', token, expiresAt: new Date(Date.now() + 3600000), roles: [], permissions: [] }
    }

    try {
      const session = await authManager.current.createSession(token, config.auth.method)
      if (!session) {
        setMetrics(prev => ({ ...prev, authFailures: prev.authFailures + 1 }))
        onAuthFailure?.('Invalid token')
        return null
      }
      return session
    } catch (error) {
      setMetrics(prev => ({ ...prev, authFailures: prev.authFailures + 1 }))
      onAuthFailure?.(error instanceof Error ? error.message : 'Authentication failed')
      return null
    }
  }, [config.auth, onAuthFailure])

  // Check rate limit
  const checkRateLimit = useCallback((clientId: string): boolean => {
    if (!config.rateLimit.enabled) return true

    const now = Date.now()
    const limit = rateLimitMap.current.get(clientId)

    if (!limit || now > limit.resetAt) {
      rateLimitMap.current.set(clientId, {
        count: 1,
        resetAt: now + config.rateLimit.windowMs
      })
      return true
    }

    if (limit.count >= config.rateLimit.maxRequests) {
      setMetrics(prev => ({ ...prev, rateLimitHits: prev.rateLimitHits + 1 }))
      onRateLimitExceeded?.(clientId)
      return false
    }

    limit.count++
    return true
  }, [config.rateLimit, onRateLimitExceeded])

  // Execute tool with security checks
  const executeTool = useCallback(async (
    toolName: string,
    params: any,
    auth: string
  ): Promise<MCPToolResponse> => {
    setMetrics(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }))

    try {
      // Validate auth
      const session = await validateAuth(auth)
      if (!session) {
        return { success: false, error: 'Authentication failed' }
      }

      // Check rate limit
      if (!checkRateLimit(session.userId)) {
        return { success: false, error: 'Rate limit exceeded' }
      }

      // Get tool from registry
      const tool = toolRegistryRef.current?.get(toolName)
      if (!tool) {
        return { success: false, error: `Tool not found: ${toolName}` }
      }

      // Check permissions
      if (tool.metadata?.requiredRole && !session.roles.includes(tool.metadata.requiredRole)) {
        return { success: false, error: 'Insufficient permissions' }
      }

      // Execute via RPC
      const response = await rpcOutputRef.current?.call({
        method: `tool.${toolName}`,
        params,
        id: Date.now()
      })

      if (!response) {
        throw new Error('RPC call failed')
      }

      const result: MCPToolResponse = response.error
        ? { success: false, error: response.error.message }
        : { success: true, data: response.result }

      if (result.success) {
        onToolExecuted?.(toolName, result)
      } else {
        setMetrics(prev => ({ ...prev, executionErrors: prev.executionErrors + 1 }))
      }

      return result
    } catch (error) {
      setMetrics(prev => ({ ...prev, executionErrors: prev.executionErrors + 1 }))
      onError?.(error instanceof Error ? error : new Error(String(error)))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [validateAuth, checkRateLimit, onToolExecuted, onError])

  // Register tool with auth check
  const registerTool = useCallback(async (tool: MCPTool, auth: string): Promise<boolean> => {
    try {
      // Validate auth
      const session = await validateAuth(auth)
      if (!session) return false

      // Check admin permission
      if (!session.roles.includes('admin')) {
        onAuthFailure?.('Admin role required to register tools')
        return false
      }

      // Register tool
      const success = toolRegistryRef.current?.register(tool) || false
      if (success) {
        setMetrics(prev => ({ ...prev, registeredTools: prev.registeredTools + 1 }))
        onToolRegistered?.(tool)
      }

      return success
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }, [validateAuth, onToolRegistered, onAuthFailure, onError])

  // Handle WebSocket messages
  const handleWSMessage = useCallback(async (data: any) => {
    try {
      // Parse MCP message
      const message = typeof data === 'string' ? JSON.parse(data) : data

      if (message.type === 'tool.execute') {
        const result = await executeTool(
          message.tool,
          message.params,
          message.auth || ''
        )

        // Send response via WebSocket
        wsOutputRef.current?.send(JSON.stringify({
          type: 'tool.result',
          id: message.id,
          result
        }))
      } else if (message.type === 'tool.register' && message.tool) {
        const success = await registerTool(
          message.tool,
          message.auth || ''
        )

        wsOutputRef.current?.send(JSON.stringify({
          type: 'tool.registered',
          id: message.id,
          success
        }))
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [executeTool, registerTool, onError])

  // Handle RPC requests
  const handleRPCResponse = useCallback((response: any) => {
    // Process RPC responses and update metrics
    if (response.error) {
      setMetrics(prev => ({ ...prev, executionErrors: prev.executionErrors + 1 }))
    }
  }, [])

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        uptime: Date.now() - startTime.current,
        activeConnections: wsOutputRef.current?.state === 'open' ? 1 : 0,
        registeredTools: toolRegistryRef.current?.count() || 0
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Get current metrics
  const getMetrics = useCallback((): ServerMetrics => {
    return {
      ...metrics,
      uptime: Date.now() - startTime.current,
      activeConnections: wsOutputRef.current?.state === 'open' ? 1 : 0,
      registeredTools: toolRegistryRef.current?.count() || 0
    }
  }, [metrics])

  // Stop server
  const stop = useCallback(() => {
    wsOutputRef.current?.close()
    setStatus('stopped')
  }, [])

  // Server started successfully
  useEffect(() => {
    // Register initial tools
    if (config.tools && toolRegistryRef.current) {
      config.tools.forEach(tool => {
        toolRegistryRef.current?.register(tool)
      })
      setMetrics(prev => ({ 
        ...prev, 
        registeredTools: config.tools?.length || 0 
      }))
    }

    setStatus('running')
  }, [config.tools])

  return (
    <>
      {/* WebSocket Primitive */}
      <WebSocketPrimitive
        config={{
          url: config.wsEndpoint,
          autoReconnect: true,
          reconnectDelay: 5000,
          maxReconnectAttempts: 10
        }}
        onMessage={handleWSMessage}
        onOpen={() => setMetrics(prev => ({ ...prev, activeConnections: 1 }))}
        onClose={() => setMetrics(prev => ({ ...prev, activeConnections: 0 }))}
        onError={(_event) => onError?.(new Error('WebSocket error'))}
        ref={(output: any) => { wsOutputRef.current = output }}
      />

      {/* RPC Primitive */}
      <RPCPrimitive
        config={{
          endpoint: config.rpcEndpoint,
          timeout: 30000,
          maxRetries: 3,
          headers: {
            'X-MCP-Version': config.version
          }
        }}
        onResponse={handleRPCResponse}
        onError={(error) => onError?.(new Error(error?.message || 'RPC error'))}
        ref={(output: any) => { rpcOutputRef.current = output }}
      />

      {/* Tool Registry Primitive */}
      <ToolRegistryPrimitive
        config={{
          validateTools: true,
          maxTools: 1000,
          enableVersioning: true
        }}
        onToolRegistered={(tool) => {
          setMetrics(prev => ({ ...prev, registeredTools: prev.registeredTools + 1 }))
        }}
        ref={(output: any) => { toolRegistryRef.current = output }}
      />

      {/* Message Queue Primitive */}
      <MessageQueuePrimitive
        config={{
          maxQueueSize: 10000,
          messageTTL: 300000, // 5 minutes
          enableDeadLetterQueue: true,
          maxDeliveryAttempts: 3
        }}
        ref={(output: any) => { messageQueueRef.current = output }}
      />
    </>
  )
}

// Static construct class for registration
export class SecureMCPServerConstruct extends L1MCPConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l1-secure-mcp-server',
    name: 'Secure MCP Server',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L1,
    description: 'Production-ready MCP server with authentication, rate limiting, and encryption',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: [
      'mcp-server',
      'authentication',
      'rate-limiting',
      'encryption',
      'tool-management',
      'monitoring'
    ],
    dependencies: [
      'platform-l0-websocket-primitive',
      'platform-l0-rpc-primitive',
      'platform-l0-tool-registry-primitive',
      'platform-l0-message-queue-primitive'
    ]
  }

  component = SecureMCPServer

  async initialize(config: SecureMCPServerConfig): Promise<void> {
    // Configure auth
    this.configureAuth({
      method: config.auth.method,
      publicKey: config.auth.publicKey
    })

    // Configure rate limiting
    this.configureRateLimit({
      enabled: config.rateLimit.enabled,
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests
    })

    // Configure encryption
    this.configureEncryption({
      enabled: config.encryption.enabled,
      algorithm: config.encryption.algorithm || 'aes-256-gcm',
      keyRotationInterval: config.encryption.keyRotationInterval
    })

    // Configure monitoring
    this.configureMonitoring({
      enabled: config.monitoring || true,
      metrics: ['latency', 'throughput', 'errors', 'connections']
    })
  }

  async destroy(): Promise<void> {
    // Clean up resources
    console.log('Destroying Secure MCP Server')
  }
}

// Export the construct for registration
export const secureMCPServer = new SecureMCPServerConstruct(SecureMCPServerConstruct.metadata)