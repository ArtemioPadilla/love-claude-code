import { Database, Reference, DataSnapshot } from 'firebase-admin/database'
import {
  RealtimeProvider,
  RealtimeConnection,
  PresenceInfo
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { FirebaseMetricsCollector, trackFirebasePerformance } from './utils/metrics.js'
import { FirebaseCacheManager } from './utils/cache.js'
import { withFirebaseRetry, retryableFirebase, FirebaseCircuitBreaker } from './utils/retry.js'
import { logger } from '../aws/utils/logger.js'
import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'

interface ConnectionInfo {
  id: string
  userId: string
  connectedAt: Date
  lastSeen: Date
  channels: Set<string>
  metadata?: any
}

export class FirebaseRealtimeProvider implements RealtimeProvider {
  private database: Database
  private cache: FirebaseCacheManager
  private circuitBreaker: FirebaseCircuitBreaker
  private eventBus: EventEmitter
  private connections: Map<string, ConnectionInfo> = new Map()
  private presenceRef: Reference
  private channelsRef: Reference
  private connectionsRef: Reference
  
  constructor(
    private services: FirebaseServices,
    private config: FirebaseConfig,
    private metrics: FirebaseMetricsCollector
  ) {
    this.database = services.database
    this.cache = new FirebaseCacheManager(config)
    this.circuitBreaker = new FirebaseCircuitBreaker()
    this.eventBus = new EventEmitter()
    
    // Set up references
    this.presenceRef = this.database.ref('presence')
    this.channelsRef = this.database.ref('channels')
    this.connectionsRef = this.database.ref('connections')
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // Test database connection
    try {
      await this.database.ref('.info/connected').once('value')
      
      // Set up server time offset
      const offsetRef = this.database.ref('.info/serverTimeOffset')
      offsetRef.on('value', (snapshot) => {
        const offset = snapshot.val() || 0
        logger.info('Firebase server time offset', { offset })
      })
      
      logger.info('Firebase Realtime provider initialized')
    } catch (error) {
      logger.error('Failed to initialize Firebase Realtime', { error })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    // Disconnect all active connections
    const promises = Array.from(this.connections.keys()).map(connId =>
      this.handleDisconnect(connId)
    )
    await Promise.all(promises)
    
    // Clean up listeners
    this.database.ref('.info/serverTimeOffset').off()
    this.eventBus.removeAllListeners()
    
    await this.cache.shutdown()
    await this.database.goOffline()
  }
  
  @trackFirebasePerformance
  async connect(userId: string): Promise<RealtimeConnection> {
    const connectionId = uuidv4()
    const connectionRef = this.connectionsRef.child(connectionId)
    
    // Set up connection info
    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      userId,
      connectedAt: new Date(),
      lastSeen: new Date(),
      channels: new Set(),
      metadata: {}
    }
    
    // Store connection in database
    await connectionRef.set({
      userId,
      connectedAt: connectionInfo.connectedAt.toISOString(),
      lastSeen: connectionInfo.lastSeen.toISOString(),
      status: 'connected'
    })
    
    // Set up disconnect handler
    connectionRef.onDisconnect().update({
      status: 'disconnected',
      disconnectedAt: new Date().toISOString()
    })
    
    // Store locally
    this.connections.set(connectionId, connectionInfo)
    
    // Set up heartbeat
    const heartbeatInterval = setInterval(async () => {
      if (this.connections.has(connectionId)) {
        await connectionRef.update({
          lastSeen: new Date().toISOString()
        })
      } else {
        clearInterval(heartbeatInterval)
      }
    }, 30000) // 30 seconds
    
    // Create connection object
    const connection: RealtimeConnection = {
      id: connectionId,
      
      async send(message: any): Promise<void> {
        const messageRef = this.database.ref('messages').push()
        await messageRef.set({
          connectionId,
          userId,
          message,
          timestamp: new Date().toISOString()
        })
      },
      
      onMessage(callback: (message: any) => void): void {
        // Listen for messages directed to this connection
        const userMessagesRef = this.database.ref(`users/${userId}/messages`)
        
        userMessagesRef.on('child_added', (snapshot) => {
          const messageData = snapshot.val()
          if (messageData && messageData.connectionId !== connectionId) {
            callback(messageData.message)
            // Clean up message after delivery
            snapshot.ref.remove()
          }
        })
        
        // Store cleanup function
        connection._cleanups = connection._cleanups || []
        connection._cleanups.push(() => userMessagesRef.off())
      },
      
      onDisconnect(callback: () => void): void {
        connectionRef.on('value', (snapshot) => {
          const data = snapshot.val()
          if (data?.status === 'disconnected') {
            callback()
          }
        })
      },
      
      async disconnect(): Promise<void> {
        clearInterval(heartbeatInterval)
        
        // Clean up listeners
        if (connection._cleanups) {
          connection._cleanups.forEach(cleanup => cleanup())
        }
        
        await this.handleDisconnect(connectionId)
      },
      
      _cleanups: []
    }
    
    await this.metrics.recordSuccess('Connect')
    
    return connection
  }
  
  private async handleDisconnect(connectionId: string): Promise<void> {
    const connectionInfo = this.connections.get(connectionId)
    if (!connectionInfo) return
    
    // Update connection status
    await this.connectionsRef.child(connectionId).update({
      status: 'disconnected',
      disconnectedAt: new Date().toISOString()
    })
    
    // Leave all channels
    for (const channel of connectionInfo.channels) {
      await this.leaveChannel(connectionId, channel)
    }
    
    // Clean up presence
    await this.presenceRef.child(connectionInfo.userId).remove()
    
    // Remove from local storage
    this.connections.delete(connectionId)
  }
  
  @trackFirebasePerformance
  async subscribe(channel: string, callback: (message: any) => void): Promise<() => void> {
    // Subscribe to channel messages
    const channelRef = this.channelsRef.child(channel).child('messages')
    
    const listener = channelRef.on('child_added', (snapshot) => {
      const message = snapshot.val()
      if (message) {
        callback(message)
        // Auto-cleanup old messages (older than 1 hour)
        const messageTime = new Date(message.timestamp).getTime()
        if (Date.now() - messageTime > 3600000) {
          snapshot.ref.remove()
        }
      }
    })
    
    // Also subscribe to local event bus
    this.eventBus.on(`channel:${channel}`, callback)
    
    await this.metrics.recordSuccess('Subscribe', { channel })
    
    // Return unsubscribe function
    return () => {
      channelRef.off('child_added', listener)
      this.eventBus.off(`channel:${channel}`, callback)
    }
  }
  
  @trackFirebasePerformance
  async publish(channel: string, message: any): Promise<void> {
    try {
      // Publish to Firebase
      const messageData = {
        message,
        timestamp: new Date().toISOString(),
        id: uuidv4()
      }
      
      await this.circuitBreaker.execute(() =>
        this.channelsRef
          .child(channel)
          .child('messages')
          .push(messageData)
      )
      
      // Also emit to local event bus
      this.eventBus.emit(`channel:${channel}`, message)
      
      await this.metrics.recordSuccess('Publish', { channel })
    } catch (error: any) {
      logger.error('Publish failed', { error, channel })
      await this.metrics.recordError('Publish', error, { channel })
      throw error
    }
  }
  
  @trackFirebasePerformance
  async trackPresence(channel: string, userId: string, metadata?: any): Promise<() => void> {
    const presenceData = {
      userId,
      channel,
      connectedAt: new Date().toISOString(),
      metadata: metadata || {}
    }
    
    // Set presence in channel
    const channelPresenceRef = this.channelsRef
      .child(channel)
      .child('presence')
      .child(userId)
    
    await channelPresenceRef.set(presenceData)
    
    // Set up disconnect handler
    channelPresenceRef.onDisconnect().remove()
    
    // Also track in user's presence
    const userPresenceRef = this.presenceRef.child(userId).child(channel)
    await userPresenceRef.set(presenceData)
    userPresenceRef.onDisconnect().remove()
    
    // Notify channel members
    await this.publish(channel, {
      type: 'presence_join',
      userId,
      metadata
    })
    
    await this.metrics.recordSuccess('TrackPresence', { channel })
    
    // Return cleanup function
    return async () => {
      await channelPresenceRef.remove()
      await userPresenceRef.remove()
      
      await this.publish(channel, {
        type: 'presence_leave',
        userId
      })
    }
  }
  
  @trackFirebasePerformance
  async getPresence(channel: string): Promise<PresenceInfo[]> {
    try {
      const snapshot = await this.channelsRef
        .child(channel)
        .child('presence')
        .once('value')
      
      const presenceData = snapshot.val() || {}
      
      const presenceList: PresenceInfo[] = Object.entries(presenceData).map(
        ([userId, data]: [string, any]) => ({
          userId,
          connectedAt: new Date(data.connectedAt),
          metadata: data.metadata
        })
      )
      
      await this.metrics.recordSuccess('GetPresence', { 
        channel, 
        count: String(presenceList.length) 
      })
      
      return presenceList
    } catch (error: any) {
      logger.error('Get presence failed', { error, channel })
      await this.metrics.recordError('GetPresence', error, { channel })
      throw error
    }
  }
  
  // Channel management
  private async joinChannel(connectionId: string, channel: string): Promise<void> {
    const connectionInfo = this.connections.get(connectionId)
    if (!connectionInfo) return
    
    connectionInfo.channels.add(channel)
    
    // Update in database
    await this.connectionsRef
      .child(connectionId)
      .child('channels')
      .child(channel)
      .set({
        joinedAt: new Date().toISOString()
      })
  }
  
  private async leaveChannel(connectionId: string, channel: string): Promise<void> {
    const connectionInfo = this.connections.get(connectionId)
    if (connectionInfo) {
      connectionInfo.channels.delete(channel)
    }
    
    // Remove from database
    await this.connectionsRef
      .child(connectionId)
      .child('channels')
      .child(channel)
      .remove()
  }
  
  // Broadcast to all connections in a channel
  async broadcastToChannel(channel: string, message: any, excludeConnection?: string): Promise<void> {
    const promises: Promise<void>[] = []
    
    for (const [connId, connInfo] of this.connections) {
      if (connId !== excludeConnection && connInfo.channels.has(channel)) {
        // Send message to user's message queue
        const messageRef = this.database.ref(`users/${connInfo.userId}/messages`).push()
        promises.push(
          messageRef.set({
            connectionId: connId,
            channel,
            message,
            timestamp: new Date().toISOString()
          })
        )
      }
    }
    
    await Promise.all(promises)
  }
  
  // Create a typed channel for structured communication
  createTypedChannel<T>(name: string) {
    return {
      subscribe: (callback: (data: T) => void) => {
        return this.subscribe(name, callback)
      },
      publish: (data: T) => {
        return this.publish(name, data)
      },
      getPresence: () => {
        return this.getPresence(name)
      }
    }
  }
  
  // Clean up old data
  async cleanupOldData(olderThanHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (olderThanHours * 3600000)
    
    // Clean up old messages
    const messagesSnapshot = await this.database.ref('messages')
      .orderByChild('timestamp')
      .endAt(new Date(cutoffTime).toISOString())
      .once('value')
    
    const deletions: Promise<void>[] = []
    messagesSnapshot.forEach((child) => {
      deletions.push(child.ref.remove())
    })
    
    await Promise.all(deletions)
    
    logger.info('Cleaned up old realtime data', { 
      messagesDeleted: deletions.length 
    })
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Check database connection
      const connectedSnapshot = await this.database.ref('.info/connected').once('value')
      const isConnected = connectedSnapshot.val()
      
      const cacheHealth = await this.cache.healthCheck()
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        details: {
          connected: isConnected,
          activeConnections: this.connections.size,
          cache: cacheHealth,
          circuitBreaker: this.circuitBreaker.status,
          metrics: this.metrics.getSummary()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}