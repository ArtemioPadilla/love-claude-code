import { EventEmitter } from 'events'

export type WebSocketMessageType = 
  | 'terminal-output'
  | 'terminal-error'
  | 'chat-update'
  | 'file-change'
  | 'build-status'
  | 'test-output'
  | 'collaboration-cursor'
  | 'project-update'
  | 'system-notification'

export interface WebSocketMessage {
  type: WebSocketMessageType
  payload: any
  timestamp?: Date
  id?: string
}

export interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  pingInterval?: number
  token?: string
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private pingTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnecting = false
  private isManualClose = false

  constructor(config: WebSocketConfig) {
    super()
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config
    }
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        this.once('connected', resolve)
        this.once('error', reject)
        return
      }

      this.isConnecting = true
      this.isManualClose = false

      try {
        // Build WebSocket URL with optional token
        let wsUrl = this.config.url
        if (this.config.token) {
          const separator = wsUrl.includes('?') ? '&' : '?'
          wsUrl += `${separator}token=${encodeURIComponent(this.config.token)}`
        }

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected:', this.config.url)
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          // Start ping timer
          this.startPing()
          
          // Process queued messages
          this.processMessageQueue()
          
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            message.timestamp = message.timestamp ? new Date(message.timestamp) : new Date()
            
            // Emit specific event type and generic message event
            this.emit(message.type, message.payload, message)
            this.emit('message', message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
            this.emit('parse-error', { error, data: event.data })
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.isConnecting = false
          this.stopPing()
          
          if (!this.isManualClose && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect()
          }
          
          this.emit('disconnected', event)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          this.emit('error', error)
          
          if (this.reconnectAttempts === 0) {
            reject(error)
          }
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.isManualClose = true
    this.clearReconnectTimer()
    this.stopPing()
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
    
    this.emit('disconnected', { code: 1000, reason: 'Manual disconnect' })
  }

  /**
   * Send message through WebSocket
   */
  public send(message: WebSocketMessage): void {
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || new Date(),
      id: message.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(messageWithTimestamp))
        this.emit('sent', messageWithTimestamp)
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        this.queueMessage(messageWithTimestamp)
        this.emit('send-error', { error, message: messageWithTimestamp })
      }
    } else {
      // Queue message for later delivery
      this.queueMessage(messageWithTimestamp)
    }
  }

  /**
   * Get current connection state
   */
  public getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'open'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'closed'
      default: return 'closed'
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Update authentication token
   */
  public updateToken(token: string): void {
    this.config.token = token
    
    // If connected, reconnect with new token
    if (this.isConnected()) {
      this.disconnect()
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Failed to reconnect with new token:', error)
        })
      }, 100)
    }
  }

  /**
   * Get queued message count
   */
  public getQueuedMessageCount(): number {
    return this.messageQueue.length
  }

  /**
   * Clear message queue
   */
  public clearMessageQueue(): void {
    this.messageQueue = []
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message)
    
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
    
    this.emit('message-queued', message)
  }

  private processMessageQueue(): void {
    if (!this.isConnected() || this.messageQueue.length === 0) {
      return
    }

    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach(message => {
      this.send(message)
    })

    this.emit('queue-processed', { count: queue.length })
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    const delay = Math.min(this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1), 30000)

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
        
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
          console.error('Max reconnect attempts reached')
          this.emit('max-reconnects-reached')
        }
      })
    }, delay)

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay })
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private startPing(): void {
    this.stopPing()
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'system-notification',
          payload: { type: 'ping' }
        })
      }
    }, this.config.pingInterval!)
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}

// Singleton instance for the main WebSocket connection
let mainWebSocketService: WebSocketService | null = null

/**
 * Get the main WebSocket service instance
 */
export function getWebSocketService(config?: Partial<WebSocketConfig>): WebSocketService {
  if (!mainWebSocketService) {
    const defaultConfig: WebSocketConfig = {
      url: `ws://${window.location.hostname}:8001/ws/terminal`,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config
    }
    
    mainWebSocketService = new WebSocketService(defaultConfig)
  }
  
  return mainWebSocketService
}

/**
 * Initialize WebSocket connection with authentication
 */
export function initializeWebSocket(token?: string): Promise<WebSocketService> {
  const ws = getWebSocketService({ token })
  return ws.connect().then(() => ws)
}