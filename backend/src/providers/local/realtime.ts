import {
  RealtimeProvider,
  RealtimeConnection,
  PresenceInfo,
  ProviderConfig
} from '../types.js'
import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'
import crypto from 'crypto'

interface Connection {
  id: string
  userId: string
  ws: WebSocket
  channels: Set<string>
  metadata?: any
}

interface ChannelPresence {
  userId: string
  connectedAt: Date
  metadata?: any
}

/**
 * Local realtime provider using WebSocket server
 */
export class LocalRealtimeProvider implements RealtimeProvider {
  private config: ProviderConfig
  private wss?: WebSocketServer
  private connections: Map<string, Connection> = new Map()
  private channels: Map<string, Set<string>> = new Map() // channel -> connectionIds
  private presence: Map<string, Map<string, ChannelPresence>> = new Map() // channel -> userId -> presence
  private eventBus: EventEmitter = new EventEmitter()
  
  constructor(config: ProviderConfig) {
    this.config = config
  }
  
  async initialize(): Promise<void> {
    const port = this.config.options?.realtimePort || 8001
    
    this.wss = new WebSocketServer({ port })
    
    this.wss.on('connection', (ws, req) => {
      const connectionId = crypto.randomUUID()
      const userId = this.extractUserId(req.url || '')
      
      if (!userId) {
        ws.close(1008, 'User ID required')
        return
      }
      
      const connection: Connection = {
        id: connectionId,
        userId,
        ws,
        channels: new Set()
      }
      
      this.connections.set(connectionId, connection)
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(connectionId, message)
        } catch (error) {
          console.error('Invalid message:', error)
        }
      })
      
      ws.on('close', () => {
        this.handleDisconnect(connectionId)
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        connectionId
      }))
    })
    
    console.log(`Local realtime server listening on port ${port}`)
  }
  
  async shutdown(): Promise<void> {
    // Close all connections
    for (const connection of this.connections.values()) {
      connection.ws.close(1000, 'Server shutting down')
    }
    
    // Close server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve())
      })
    }
    
    this.connections.clear()
    this.channels.clear()
    this.presence.clear()
  }
  
  private extractUserId(url: string): string | null {
    const match = url.match(/userId=([^&]+)/)
    return match ? match[1] : null
  }
  
  private handleMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(connectionId, message.channel)
        break
        
      case 'unsubscribe':
        this.handleUnsubscribe(connectionId, message.channel)
        break
        
      case 'publish':
        this.handlePublish(message.channel, message.data)
        break
        
      case 'presence':
        this.handlePresence(connectionId, message.channel, message.metadata)
        break
        
      case 'message':
        // Direct message to connection
        connection.ws.send(JSON.stringify({
          type: 'message',
          data: message.data
        }))
        break
    }
  }
  
  private handleSubscribe(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    connection.channels.add(channel)
    
    let channelConnections = this.channels.get(channel)
    if (!channelConnections) {
      channelConnections = new Set()
      this.channels.set(channel, channelConnections)
    }
    channelConnections.add(connectionId)
    
    connection.ws.send(JSON.stringify({
      type: 'subscribed',
      channel
    }))
  }
  
  private handleUnsubscribe(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    connection.channels.delete(channel)
    
    const channelConnections = this.channels.get(channel)
    if (channelConnections) {
      channelConnections.delete(connectionId)
      if (channelConnections.size === 0) {
        this.channels.delete(channel)
      }
    }
    
    // Remove presence
    const channelPresence = this.presence.get(channel)
    if (channelPresence) {
      channelPresence.delete(connection.userId)
      if (channelPresence.size === 0) {
        this.presence.delete(channel)
      }
    }
    
    connection.ws.send(JSON.stringify({
      type: 'unsubscribed',
      channel
    }))
  }
  
  private handlePublish(channel: string, data: any): void {
    const channelConnections = this.channels.get(channel)
    if (!channelConnections) return
    
    const message = JSON.stringify({
      type: 'channel_message',
      channel,
      data
    })
    
    for (const connectionId of channelConnections) {
      const connection = this.connections.get(connectionId)
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message)
      }
    }
    
    // Emit to local event bus
    this.eventBus.emit(`channel:${channel}`, data)
  }
  
  private handlePresence(connectionId: string, channel: string, metadata?: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    let channelPresence = this.presence.get(channel)
    if (!channelPresence) {
      channelPresence = new Map()
      this.presence.set(channel, channelPresence)
    }
    
    channelPresence.set(connection.userId, {
      userId: connection.userId,
      connectedAt: new Date(),
      metadata
    })
    
    // Notify channel subscribers of presence update
    this.handlePublish(channel, {
      type: 'presence_update',
      userId: connection.userId,
      status: 'online',
      metadata
    })
  }
  
  private handleDisconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    // Remove from all channels
    for (const channel of connection.channels) {
      this.handleUnsubscribe(connectionId, channel)
      
      // Notify presence update
      this.handlePublish(channel, {
        type: 'presence_update',
        userId: connection.userId,
        status: 'offline'
      })
    }
    
    this.connections.delete(connectionId)
  }
  
  async connect(userId: string): Promise<RealtimeConnection> {
    // For local provider, return a client that connects to our WebSocket server
    const ws = new WebSocket(`ws://localhost:${this.config.options?.realtimePort || 8001}?userId=${userId}`)
    const connectionId = crypto.randomUUID()
    
    return new Promise((resolve, reject) => {
      const messageHandlers: Array<(message: any) => void> = []
      const disconnectHandlers: Array<() => void> = []
      
      ws.on('open', () => {
        resolve({
          id: connectionId,
          
          async send(message: any): Promise<void> {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'message',
                data: message
              }))
            }
          },
          
          onMessage(callback: (message: any) => void): void {
            messageHandlers.push(callback)
          },
          
          onDisconnect(callback: () => void): void {
            disconnectHandlers.push(callback)
          },
          
          async disconnect(): Promise<void> {
            ws.close()
          }
        })
      })
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          if (message.type === 'message' || message.type === 'channel_message') {
            messageHandlers.forEach(handler => handler(message.data))
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      })
      
      ws.on('close', () => {
        disconnectHandlers.forEach(handler => handler())
      })
      
      ws.on('error', (error) => {
        reject(error)
      })
    })
  }
  
  async subscribe(channel: string, callback: (message: any) => void): Promise<() => void> {
    // Subscribe to local event bus
    const handler = (data: any) => callback(data)
    this.eventBus.on(`channel:${channel}`, handler)
    
    return () => {
      this.eventBus.off(`channel:${channel}`, handler)
    }
  }
  
  async publish(channel: string, message: any): Promise<void> {
    this.handlePublish(channel, message)
  }
  
  async trackPresence(channel: string, userId: string, metadata?: any): Promise<() => void> {
    let channelPresence = this.presence.get(channel)
    if (!channelPresence) {
      channelPresence = new Map()
      this.presence.set(channel, channelPresence)
    }
    
    channelPresence.set(userId, {
      userId,
      connectedAt: new Date(),
      metadata
    })
    
    // Notify channel of presence
    this.handlePublish(channel, {
      type: 'presence_update',
      userId,
      status: 'online',
      metadata
    })
    
    return () => {
      const presence = this.presence.get(channel)
      if (presence) {
        presence.delete(userId)
        if (presence.size === 0) {
          this.presence.delete(channel)
        }
      }
      
      // Notify channel of departure
      this.handlePublish(channel, {
        type: 'presence_update',
        userId,
        status: 'offline'
      })
    }
  }
  
  async getPresence(channel: string): Promise<PresenceInfo[]> {
    const channelPresence = this.presence.get(channel)
    if (!channelPresence) return []
    
    return Array.from(channelPresence.values())
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    return {
      status: this.wss ? 'healthy' : 'unhealthy',
      details: {
        connections: this.connections.size,
        channels: this.channels.size
      }
    }
  }
}