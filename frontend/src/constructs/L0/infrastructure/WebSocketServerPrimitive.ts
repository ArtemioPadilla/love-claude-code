import { L0InfrastructureConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 WebSocket Server Primitive Construct
 * Raw WebSocket server with no authentication, error handling, or features
 * Just basic connection handling and message passing
 */
export class WebSocketServerPrimitive extends L0InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-websocket-server-primitive',
    name: 'WebSocket Server Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Infrastructure,
    description: 'Raw WebSocket server with no authentication or error handling',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'networking', 'websocket'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['websocket', 'server', 'primitive', 'networking'],
    inputs: [
      {
        name: 'port',
        type: 'number',
        description: 'Port number to listen on',
        required: true
      },
      {
        name: 'host',
        type: 'string',
        description: 'Host address to bind to',
        required: false,
        defaultValue: '0.0.0.0'
      },
      {
        name: 'onConnection',
        type: 'function',
        description: 'Callback when client connects',
        required: false
      },
      {
        name: 'onMessage',
        type: 'function',
        description: 'Callback when message received',
        required: false
      },
      {
        name: 'onDisconnect',
        type: 'function',
        description: 'Callback when client disconnects',
        required: false
      }
    ],
    outputs: [
      {
        name: 'serverId',
        type: 'string',
        description: 'WebSocket server ID'
      },
      {
        name: 'status',
        type: 'ServerStatus',
        description: 'Current server status'
      },
      {
        name: 'connections',
        type: 'string[]',
        description: 'Active connection IDs'
      },
      {
        name: 'messageCount',
        type: 'number',
        description: 'Total messages processed'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'WebSocket'
    },
    examples: [
      {
        title: 'Basic WebSocket Server',
        description: 'Simple WebSocket server',
        code: `const wsServer = new WebSocketServerPrimitive()
await wsServer.initialize({
  port: 8080,
  onConnection: (clientId) => {
    console.log('Client connected:', clientId)
  },
  onMessage: (clientId, message) => {
    console.log('Message from', clientId, ':', message)
  }
})
await wsServer.deploy()`,
        language: 'typescript'
      },
      {
        title: 'Echo Server',
        description: 'WebSocket echo server',
        code: `const echoServer = new WebSocketServerPrimitive()
await echoServer.initialize({
  port: 3001,
  onMessage: (clientId, message) => {
    // Echo message back to sender
    echoServer.sendToClient(clientId, message)
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 AuthenticatedWebSocket for production',
      'No authentication or authorization',
      'No error handling or reconnection logic',
      'Raw WebSocket implementation only'
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
      timeToCreate: 30,
      canBuildConstructs: false
    }
  }

  private serverId?: string
  private status: ServerStatus = 'created'
  private connections: Map<string, WebSocketConnection> = new Map()
  private messageCount: number = 0

  constructor() {
    super(WebSocketServerPrimitive.definition)
  }

  /**
   * Simulated deploy for L0 - in real implementation would use ws library
   */
  async deploy(): Promise<void> {
    // Validate required inputs
    const port = this.getInput<number>('port')
    if (!port) {
      throw new Error('Port is required')
    }

    const host = this.getInput<string>('host') || '0.0.0.0'

    // Simulate server creation
    this.serverId = `ws-server-${Date.now()}`
    this.status = 'listening'
    
    // Set outputs
    this.setOutput('serverId', this.serverId)
    this.setOutput('status', this.status)
    this.setOutput('connections', Array.from(this.connections.keys()))
    this.setOutput('messageCount', this.messageCount)
    
    console.log(`WebSocket server listening on ${host}:${port}`)
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (this.status === 'listening') {
      // Close all connections
      this.connections.forEach((conn, clientId) => {
        this.disconnect(clientId)
      })
      
      this.status = 'stopped'
      this.setOutput('status', this.status)
      console.log('WebSocket server stopped')
    }
  }

  /**
   * Simulate client connection
   */
  connect(clientId?: string): string {
    if (this.status !== 'listening') {
      throw new Error('Server is not listening')
    }

    const id = clientId || `client-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const connection: WebSocketConnection = {
      id,
      connectedAt: new Date(),
      messagesSent: 0,
      messagesReceived: 0
    }

    this.connections.set(id, connection)
    this.setOutput('connections', Array.from(this.connections.keys()))

    // Call connection callback
    const onConnection = this.getInput<(clientId: string) => void>('onConnection')
    onConnection?.(id)

    return id
  }

  /**
   * Simulate client disconnection
   */
  disconnect(clientId: string): void {
    const connection = this.connections.get(clientId)
    if (connection) {
      this.connections.delete(clientId)
      this.setOutput('connections', Array.from(this.connections.keys()))

      // Call disconnect callback
      const onDisconnect = this.getInput<(clientId: string) => void>('onDisconnect')
      onDisconnect?.(clientId)
    }
  }

  /**
   * Simulate receiving message from client
   */
  receiveMessage(clientId: string, message: any): void {
    const connection = this.connections.get(clientId)
    if (!connection) {
      throw new Error(`Client ${clientId} not connected`)
    }

    connection.messagesReceived++
    this.messageCount++
    this.setOutput('messageCount', this.messageCount)

    // Call message callback
    const onMessage = this.getInput<(clientId: string, message: any) => void>('onMessage')
    onMessage?.(clientId, message)
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: any): void {
    const connection = this.connections.get(clientId)
    if (!connection) {
      throw new Error(`Client ${clientId} not connected`)
    }

    connection.messagesSent++
    console.log(`Sending to ${clientId}:`, message)
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message: any): void {
    this.connections.forEach((connection, clientId) => {
      this.sendToClient(clientId, message)
    })
  }

  /**
   * Get server statistics
   */
  getStats(): ServerStats {
    let totalMessagesSent = 0
    let totalMessagesReceived = 0

    this.connections.forEach(conn => {
      totalMessagesSent += conn.messagesSent
      totalMessagesReceived += conn.messagesReceived
    })

    return {
      serverId: this.serverId || '',
      status: this.status,
      connectionCount: this.connections.size,
      totalMessagesSent,
      totalMessagesReceived,
      uptime: this.status === 'listening' ? Date.now() : 0
    }
  }

  /**
   * Get list of connected clients
   */
  getConnectedClients(): string[] {
    return Array.from(this.connections.keys())
  }

  /**
   * Check if client is connected
   */
  isClientConnected(clientId: string): boolean {
    return this.connections.has(clientId)
  }
}

/**
 * WebSocket connection interface
 */
interface WebSocketConnection {
  id: string
  connectedAt: Date
  messagesSent: number
  messagesReceived: number
}

/**
 * Server status type
 */
export type ServerStatus = 'created' | 'listening' | 'stopped'

/**
 * Server statistics interface
 */
export interface ServerStats {
  serverId: string
  status: ServerStatus
  connectionCount: number
  totalMessagesSent: number
  totalMessagesReceived: number
  uptime: number
}

// Export factory function
export const createWebSocketServerPrimitive = () => new WebSocketServerPrimitive()

// Export definition for catalog
export const webSocketServerPrimitiveDefinition = WebSocketServerPrimitive.definition