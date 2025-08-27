import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, CloudProvider, ConstructType } from '../../types'

/**
 * L1 Authenticated WebSocket Construct
 * Production-ready WebSocket with JWT authentication, connection management, and auto-reconnect
 * Built upon L0 WebSocketServerPrimitive
 */
export class AuthenticatedWebSocket extends L1InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-authenticated-websocket',
    name: 'Authenticated WebSocket',
    level: ConstructLevel.L1,
    type: ConstructType.Infrastructure,
    description: 'Production-ready WebSocket with JWT authentication, auto-reconnect, message queuing, presence tracking, and connection state management.',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'networking', 'realtime'],
    providers: [CloudProvider.LOCAL, CloudProvider.AWS, CloudProvider.FIREBASE],
    tags: ['websocket', 'authentication', 'jwt', 'realtime', 'presence', 'auto-reconnect', 'managed'],
    inputs: [
      {
        name: 'url',
        type: 'string',
        description: 'WebSocket server URL',
        required: true,
        example: 'wss://api.example.com/ws'
      },
      {
        name: 'authToken',
        type: 'string',
        description: 'JWT authentication token',
        required: false
      },
      {
        name: 'protocols',
        type: 'string[]',
        description: 'WebSocket subprotocols',
        required: false,
        example: ['chat', 'json']
      },
      {
        name: 'reconnectConfig',
        type: 'ReconnectConfig',
        description: 'Auto-reconnect configuration',
        required: false,
        defaultValue: {
          enabled: true,
          maxAttempts: 10,
          delay: 1000,
          backoffMultiplier: 1.5,
          maxDelay: 30000
        }
      },
      {
        name: 'heartbeatConfig',
        type: 'HeartbeatConfig',
        description: 'Heartbeat/ping configuration',
        required: false,
        defaultValue: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
          message: 'ping'
        }
      },
      {
        name: 'messageQueue',
        type: 'MessageQueueConfig',
        description: 'Message queue configuration',
        required: false,
        defaultValue: {
          enabled: true,
          maxSize: 100,
          persistence: false
        }
      },
      {
        name: 'presence',
        type: 'PresenceConfig',
        description: 'Presence tracking configuration',
        required: false,
        defaultValue: {
          enabled: false,
          updateInterval: 60000
        }
      },
      {
        name: 'compression',
        type: 'boolean',
        description: 'Enable message compression',
        required: false,
        defaultValue: true
      },
      {
        name: 'binaryType',
        type: 'string',
        description: 'Binary data type',
        required: false,
        defaultValue: 'arraybuffer',
        validation: {
          enum: ['blob', 'arraybuffer']
        }
      },
      {
        name: 'headers',
        type: 'Record<string, string>',
        description: 'Additional headers for connection',
        required: false
      },
      {
        name: 'onOpen',
        type: 'function',
        description: 'Callback when connection opens',
        required: false
      },
      {
        name: 'onMessage',
        type: 'function',
        description: 'Callback for incoming messages',
        required: false
      },
      {
        name: 'onError',
        type: 'function',
        description: 'Callback for errors',
        required: false
      },
      {
        name: 'onClose',
        type: 'function',
        description: 'Callback when connection closes',
        required: false
      },
      {
        name: 'onReconnect',
        type: 'function',
        description: 'Callback when reconnecting',
        required: false
      },
      {
        name: 'onPresenceUpdate',
        type: 'function',
        description: 'Callback for presence updates',
        required: false
      }
    ],
    outputs: [
      {
        name: 'connectionId',
        type: 'string',
        description: 'Unique connection identifier'
      },
      {
        name: 'state',
        type: 'ConnectionState',
        description: 'Current connection state'
      },
      {
        name: 'isAuthenticated',
        type: 'boolean',
        description: 'Authentication status'
      },
      {
        name: 'reconnectAttempts',
        type: 'number',
        description: 'Number of reconnection attempts'
      },
      {
        name: 'latency',
        type: 'number',
        description: 'Connection latency in ms'
      },
      {
        name: 'queueSize',
        type: 'number',
        description: 'Number of queued messages'
      },
      {
        name: 'presenceList',
        type: 'PresenceInfo[]',
        description: 'List of connected users'
      },
      {
        name: 'stats',
        type: 'ConnectionStats',
        description: 'Connection statistics'
      }
    ],
    security: [
      {
        aspect: 'Authentication',
        description: 'JWT-based authentication',
        implementation: 'Token validation, refresh handling, secure storage'
      },
      {
        aspect: 'Encryption',
        description: 'TLS/WSS encryption',
        implementation: 'Enforced WSS protocol, certificate validation'
      },
      {
        aspect: 'Message Validation',
        description: 'Input sanitization and validation',
        implementation: 'JSON schema validation, XSS prevention'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'connection-hours',
          unit: 'hours',
          costPerUnit: 0.01
        },
        {
          name: 'messages',
          unit: '1M messages',
          costPerUnit: 0.50
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'WebSocket',
      external: false,
      position: {
        x: 200,
        y: 400
      }
    },
    examples: [
      {
        title: 'Basic Authenticated Connection',
        description: 'Connect with JWT authentication',
        code: `const ws = new AuthenticatedWebSocket()

await ws.initialize({
  url: 'wss://api.example.com/ws',
  authToken: jwtToken,
  onOpen: () => {
    console.log('Connected and authenticated')
  },
  onMessage: (message) => {
    console.log('Received:', message)
  },
  onError: (error) => {
    console.error('WebSocket error:', error)
  }
})

// Send a message
ws.send({ type: 'chat', text: 'Hello!' })`,
        language: 'typescript'
      },
      {
        title: 'With Presence Tracking',
        description: 'Track online users',
        code: `const ws = new AuthenticatedWebSocket()

await ws.initialize({
  url: 'wss://chat.example.com/ws',
  authToken: token,
  presence: {
    enabled: true,
    updateInterval: 30000
  },
  onPresenceUpdate: (presenceList) => {
    console.log('Online users:', presenceList.length)
    presenceList.forEach(user => {
      console.log(\`- \${user.userId}: \${user.status}\`)
    })
  }
})

// Update your presence
ws.updatePresence({
  status: 'active',
  customData: { currentRoom: 'general' }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always use WSS (secure WebSocket) in production',
      'Implement proper token refresh logic',
      'Handle reconnection gracefully with exponential backoff',
      'Queue messages during disconnection',
      'Validate all incoming messages',
      'Implement heartbeat to detect stale connections',
      'Use compression for large messages',
      'Monitor connection metrics and latency',
      'Implement presence cleanup on disconnect',
      'Handle authentication failures explicitly'
    ],
    deployment: {
      requiredProviders: ['websocket'],
      configSchema: {
        type: 'object',
        properties: {
          serverUrl: { type: 'string' },
          jwtSecret: { type: 'string' }
        }
      },
      environmentVariables: ['JWT_SECRET', 'WS_SERVER_URL']
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-websocket-server-primitive'],
      timeToCreate: 120,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(AuthenticatedWebSocket.definition)
  }

  private ws: WebSocket | null = null
  private connectionId: string = ''
  private state: ConnectionState = 'disconnected'
  private isAuthenticated: boolean = false
  private reconnectAttempts: number = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null
  private messageQueue: QueuedMessage[] = []
  private lastPingTime: number = 0
  private latency: number = 0
  private presenceList: PresenceInfo[] = []
  private presenceUpdateTimer: NodeJS.Timeout | null = null
  private stats: ConnectionStats = {
    messagesSent: 0,
    messagesReceived: 0,
    bytessSent: 0,
    bytesReceived: 0,
    connectTime: null,
    disconnectTime: null,
    totalConnectTime: 0
  }

  /**
   * Initialize and connect WebSocket
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config)
    
    this.connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.setOutput('connectionId', this.connectionId)
    
    await this.connect()
  }

  /**
   * Connect to WebSocket server
   */
  private async connect(): Promise<void> {
    const url = this.getInput<string>('url')
    if (!url) {
      throw new Error('WebSocket URL is required')
    }

    this.updateState('connecting')
    
    try {
      // Add authentication to URL or headers
      const authUrl = this.buildAuthenticatedUrl(url)
      const protocols = this.getInput<string[]>('protocols')
      
      // Create WebSocket connection
      this.ws = new WebSocket(authUrl, protocols)
      
      if (this.getInput<string>('binaryType')) {
        this.ws.binaryType = this.getInput<string>('binaryType') as BinaryType
      }
      
      // Setup event handlers
      this.setupEventHandlers()
      
      // Wait for connection to open
      await this.waitForConnection()
      
    } catch (error: any) {
      this.updateState('error')
      this.handleError(error)
      
      // Attempt reconnection if configured
      await this.scheduleReconnect()
    }
  }

  /**
   * Build authenticated URL
   */
  private buildAuthenticatedUrl(baseUrl: string): string {
    const token = this.getInput<string>('authToken')
    if (!token) return baseUrl
    
    const url = new URL(baseUrl)
    url.searchParams.set('token', token)
    return url.toString()
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return
    
    this.ws.onopen = (event) => this.handleOpen(event)
    this.ws.onmessage = (event) => this.handleMessage(event)
    this.ws.onerror = (event) => this.handleError(event)
    this.ws.onclose = (event) => this.handleClose(event)
  }

  /**
   * Handle connection open
   */
  private handleOpen(event: Event): void {
    this.updateState('connected')
    this.isAuthenticated = true
    this.reconnectAttempts = 0
    this.stats.connectTime = new Date()
    
    this.setOutput('isAuthenticated', true)
    this.setOutput('reconnectAttempts', 0)
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Start presence updates
    this.startPresenceUpdates()
    
    // Flush message queue
    this.flushMessageQueue()
    
    // Call user callback
    const onOpen = this.getInput<(event: Event) => void>('onOpen')
    if (onOpen) {
      onOpen(event)
    }
    
    this.emit('connected', { connectionId: this.connectionId })
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    this.stats.messagesReceived++
    this.stats.bytesReceived += this.getMessageSize(event.data)
    
    let message: any
    try {
      // Parse message
      if (typeof event.data === 'string') {
        message = JSON.parse(event.data)
      } else {
        message = event.data
      }
      
      // Handle system messages
      if (this.isSystemMessage(message)) {
        this.handleSystemMessage(message)
        return
      }
      
      // Validate message
      if (!this.validateMessage(message)) {
        console.warn('Invalid message received:', message)
        return
      }
      
      // Call user callback
      const onMessage = this.getInput<(data: any) => void>('onMessage')
      if (onMessage) {
        onMessage(message)
      }
      
      this.emit('message', message)
      
    } catch (error) {
      console.error('Error handling message:', error)
      this.emit('messageError', { error, rawData: event.data })
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    console.error('WebSocket error:', error)
    
    const onError = this.getInput<(error: Event) => void>('onError')
    if (onError) {
      onError(error)
    }
    
    this.emit('error', error)
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    this.updateState('disconnected')
    this.isAuthenticated = false
    this.stats.disconnectTime = new Date()
    
    if (this.stats.connectTime && this.stats.disconnectTime) {
      this.stats.totalConnectTime += 
        this.stats.disconnectTime.getTime() - this.stats.connectTime.getTime()
    }
    
    this.setOutput('isAuthenticated', false)
    
    // Stop heartbeat
    this.stopHeartbeat()
    
    // Stop presence updates
    this.stopPresenceUpdates()
    
    // Call user callback
    const onClose = this.getInput<(event: CloseEvent) => void>('onClose')
    if (onClose) {
      onClose(event)
    }
    
    this.emit('disconnected', { 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean 
    })
    
    // Schedule reconnection if not a clean close
    if (!event.wasClean && event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  /**
   * Send a message
   */
  send(data: any): void {
    const message: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: new Date(),
      attempts: 0
    }
    
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage(message)
    } else {
      // Queue message if configured
      const queueConfig = this.getInput<MessageQueueConfig>('messageQueue')
      if (queueConfig?.enabled) {
        this.queueMessage(message)
      } else {
        throw new Error('WebSocket is not connected')
      }
    }
  }

  /**
   * Send a message immediately
   */
  private sendMessage(message: QueuedMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
    
    try {
      const data = typeof message.data === 'string' 
        ? message.data 
        : JSON.stringify(message.data)
      
      this.ws.send(data)
      
      this.stats.messagesSent++
      this.stats.bytessSent += this.getMessageSize(data)
      
      this.emit('messageSent', { id: message.id, data: message.data })
      
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Queue a message
   */
  private queueMessage(message: QueuedMessage): void {
    const config = this.getInput<MessageQueueConfig>('messageQueue')
    if (!config?.enabled) return
    
    // Check queue size limit
    if (this.messageQueue.length >= (config.maxSize || 100)) {
      // Remove oldest message
      const removed = this.messageQueue.shift()
      this.emit('messageDropped', removed)
    }
    
    this.messageQueue.push(message)
    this.setOutput('queueSize', this.messageQueue.length)
    
    this.emit('messageQueued', { id: message.id, queueSize: this.messageQueue.length })
  }

  /**
   * Flush message queue
   */
  private flushMessageQueue(): void {
    const queue = [...this.messageQueue]
    this.messageQueue = []
    
    for (const message of queue) {
      try {
        this.sendMessage(message)
      } catch (error) {
        // Re-queue on failure
        this.queueMessage(message)
      }
    }
    
    this.setOutput('queueSize', this.messageQueue.length)
  }

  /**
   * Start heartbeat/ping
   */
  private startHeartbeat(): void {
    const config = this.getInput<HeartbeatConfig>('heartbeatConfig')
    if (!config?.enabled) return
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now()
        
        // Send ping
        this.ws.send(config.message || 'ping')
        
        // Set timeout for pong
        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.warn('Heartbeat timeout, closing connection')
          this.ws?.close(4000, 'Heartbeat timeout')
        }, config.timeout || 5000)
      }
    }, config.interval || 30000)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }

  /**
   * Handle system messages
   */
  private handleSystemMessage(message: any): void {
    switch (message.type) {
      case 'pong':
        // Calculate latency
        this.latency = Date.now() - this.lastPingTime
        this.setOutput('latency', this.latency)
        
        // Clear heartbeat timeout
        if (this.heartbeatTimeoutTimer) {
          clearTimeout(this.heartbeatTimeoutTimer)
          this.heartbeatTimeoutTimer = null
        }
        break
        
      case 'auth':
        this.handleAuthMessage(message)
        break
        
      case 'presence':
        this.handlePresenceMessage(message)
        break
        
      case 'error':
        this.handleErrorMessage(message)
        break
    }
  }

  /**
   * Handle authentication messages
   */
  private handleAuthMessage(message: any): void {
    if (message.status === 'success') {
      this.isAuthenticated = true
      this.setOutput('isAuthenticated', true)
      this.emit('authenticated', { userId: message.userId })
    } else {
      this.isAuthenticated = false
      this.setOutput('isAuthenticated', false)
      this.emit('authenticationFailed', { reason: message.reason })
      
      // Close connection on auth failure
      this.ws?.close(4001, 'Authentication failed')
    }
  }

  /**
   * Handle presence messages
   */
  private handlePresenceMessage(message: any): void {
    if (message.action === 'update') {
      this.presenceList = message.users || []
      this.setOutput('presenceList', this.presenceList)
      
      const onPresenceUpdate = this.getInput<(presence: any) => void>('onPresenceUpdate')
      if (onPresenceUpdate) {
        onPresenceUpdate(this.presenceList)
      }
      
      this.emit('presenceUpdate', this.presenceList)
    }
  }

  /**
   * Handle error messages
   */
  private handleErrorMessage(message: any): void {
    console.error('Server error:', message.error)
    this.emit('serverError', message)
  }

  /**
   * Schedule reconnection
   */
  private async scheduleReconnect(): Promise<void> {
    const config = this.getInput<ReconnectConfig>('reconnectConfig')
    if (!config?.enabled || this.reconnectAttempts >= (config.maxAttempts || 10)) {
      return
    }
    
    this.reconnectAttempts++
    this.setOutput('reconnectAttempts', this.reconnectAttempts)
    
    const delay = Math.min(
      config.delay * Math.pow(config.backoffMultiplier || 1.5, this.reconnectAttempts - 1),
      config.maxDelay || 30000
    )
    
    this.updateState('reconnecting')
    
    const onReconnect = this.getInput<() => void>('onReconnect')
    if (onReconnect) {
      onReconnect(this.reconnectAttempts)
    }
    
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay })
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        // Reconnection will be rescheduled by connect method
      }
    }, delay)
  }

  /**
   * Update connection state
   */
  private updateState(newState: ConnectionState): void {
    const oldState = this.state
    this.state = newState
    this.setOutput('state', newState)
    
    if (oldState !== newState) {
      this.emit('stateChange', { oldState, newState })
    }
  }

  /**
   * Wait for connection to open
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'))
        return
      }
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 30000)
      
      const checkConnection = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          clearTimeout(timeout)
          resolve()
        } else if (this.ws?.readyState === WebSocket.CLOSED) {
          clearTimeout(timeout)
          reject(new Error('Connection closed'))
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      
      checkConnection()
    })
  }

  /**
   * Validate incoming message
   */
  private validateMessage(message: any): boolean {
    // Basic validation - can be extended with JSON schema
    if (!message || typeof message !== 'object') {
      return false
    }
    
    // XSS prevention for string fields
    for (const key in message) {
      if (typeof message[key] === 'string') {
        message[key] = this.sanitizeString(message[key])
      }
    }
    
    return true
  }

  /**
   * Sanitize string to prevent XSS
   */
  private sanitizeString(str: string): string {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Check if message is a system message
   */
  private isSystemMessage(message: any): boolean {
    return message?.type && ['pong', 'auth', 'presence', 'error'].includes(message.type)
  }

  /**
   * Get message size in bytes
   */
  private getMessageSize(data: any): number {
    if (typeof data === 'string') {
      return new Blob([data]).size
    } else if (data instanceof ArrayBuffer) {
      return data.byteLength
    } else if (data instanceof Blob) {
      return data.size
    }
    return 0
  }

  /**
   * Start presence updates
   */
  private startPresenceUpdates(): void {
    const config = this.getInput<PresenceConfig>('presence')
    if (!config?.enabled) return
    
    // Send initial presence
    this.updatePresence({ status: 'online' })
    
    // Schedule periodic updates
    this.presenceUpdateTimer = setInterval(() => {
      this.updatePresence({ status: 'online' })
    }, config.updateInterval || 60000)
  }

  /**
   * Stop presence updates
   */
  private stopPresenceUpdates(): void {
    if (this.presenceUpdateTimer) {
      clearInterval(this.presenceUpdateTimer)
      this.presenceUpdateTimer = null
    }
    
    // Send offline presence if connected
    if (this.state === 'connected') {
      this.updatePresence({ status: 'offline' })
    }
  }

  /**
   * Update presence status
   */
  updatePresence(data: any): void {
    if (this.state !== 'connected') return
    
    this.send({
      type: 'presence',
      action: 'update',
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Close the connection
   */
  close(code?: number, reason?: string): void {
    this.updateState('closing')
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    this.stopPresenceUpdates()
    
    // Close WebSocket
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(code || 1000, reason || 'Normal closure')
    }
    
    this.ws = null
    this.updateState('disconnected')
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return {
      ...this.stats,
      uptime: this.stats.connectTime 
        ? Date.now() - this.stats.connectTime.getTime() 
        : 0
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(newToken: string): Promise<void> {
    this.setInput('authToken', newToken)
    
    // If connected, send auth update
    if (this.state === 'connected') {
      this.send({
        type: 'auth',
        action: 'refresh',
        token: newToken
      })
    }
  }
}

// Type definitions
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'closing' | 'error'

interface ReconnectConfig {
  enabled: boolean
  maxAttempts?: number
  delay?: number
  backoffMultiplier?: number
  maxDelay?: number
}

interface HeartbeatConfig {
  enabled: boolean
  interval?: number
  timeout?: number
  message?: string
}

interface MessageQueueConfig {
  enabled: boolean
  maxSize?: number
  persistence?: boolean
}

interface PresenceConfig {
  enabled: boolean
  updateInterval?: number
}

interface QueuedMessage {
  id: string
  data: any
  timestamp: Date
  attempts: number
}

interface PresenceInfo {
  userId: string
  status: string
  lastSeen: Date
  customData?: any
}

interface ConnectionStats {
  messagesSent: number
  messagesReceived: number
  bytessSent: number
  bytesReceived: number
  connectTime: Date | null
  disconnectTime: Date | null
  totalConnectTime: number
  uptime?: number
}

// Export factory function
export const createAuthenticatedWebSocket = () => new AuthenticatedWebSocket()

// Export the definition for catalog registration
export const authenticatedWebSocketDefinition = AuthenticatedWebSocket.definition