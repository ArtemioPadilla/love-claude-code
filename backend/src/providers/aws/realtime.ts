import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  DeleteConnectionCommand,
  GetConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi'
import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import {
  RealtimeProvider,
  RealtimeConnection,
  PresenceInfo
} from '../types.js'
import { AWSConfig, getAWSClientConfig } from './utils/config.js'
import { MetricsCollector, trackPerformance } from './utils/metrics.js'
import { logger } from './utils/logger.js'
import { withRetry, CircuitBreaker } from './utils/retry.js'
import { EventEmitter } from 'events'
import WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'

interface ConnectionRecord {
  connectionId: string
  userId: string
  channels: Set<string>
  connectedAt: Date
  metadata?: any
}

interface ChannelSubscription {
  channelId: string
  connectionId: string
  userId: string
  subscribedAt: Date
}

export class AWSRealtimeProvider implements RealtimeProvider {
  private apiClient?: ApiGatewayManagementApiClient
  private dynamoClient: DynamoDBClient
  private connectionsTable: string
  private subscriptionsTable: string
  private eventBus: EventEmitter
  private circuitBreaker: CircuitBreaker
  private wsEndpoint?: string
  private connections: Map<string, ConnectionRecord> = new Map()
  
  constructor(
    private config: AWSConfig,
    private metrics: MetricsCollector
  ) {
    this.dynamoClient = new DynamoDBClient(getAWSClientConfig(config))
    this.connectionsTable = `${config.options.dynamoTablePrefix}realtime-connections`
    this.subscriptionsTable = `${config.options.dynamoTablePrefix}realtime-subscriptions`
    this.eventBus = new EventEmitter()
    this.circuitBreaker = new CircuitBreaker()
    
    // Set WebSocket endpoint from config or environment
    this.wsEndpoint = config.options.appsyncApiUrl || 
      process.env.WEBSOCKET_ENDPOINT ||
      `wss://ws-${config.projectId}.execute-api.${config.region}.amazonaws.com/production`
  }
  
  async initialize(): Promise<void> {
    // Initialize API Gateway Management API client if we have an endpoint
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // We're in Lambda, use the connection endpoint
      const endpoint = process.env.API_GATEWAY_ENDPOINT
      if (endpoint) {
        this.apiClient = new ApiGatewayManagementApiClient({
          ...getAWSClientConfig(this.config),
          endpoint
        })
      }
    }
    
    // Ensure DynamoDB tables exist
    await this.ensureTables()
    
    logger.info('AWS Realtime provider initialized', {
      wsEndpoint: this.wsEndpoint,
      hasApiClient: !!this.apiClient
    })
  }
  
  async shutdown(): Promise<void> {
    // Close all connections
    const promises = Array.from(this.connections.keys()).map(connId =>
      this.handleDisconnect(connId)
    )
    await Promise.all(promises)
    
    this.eventBus.removeAllListeners()
  }
  
  private async ensureTables(): Promise<void> {
    // Tables should be created by infrastructure code
    // This is just for local development
    if (this.config.endpoints?.dynamodb) {
      // Local development - tables created by LocalStack
      return
    }
  }
  
  @trackPerformance
  async connect(userId: string): Promise<RealtimeConnection> {
    const connectionId = uuidv4()
    
    // For client-side connections, return WebSocket-based connection
    const ws = new WebSocket(`${this.wsEndpoint}?userId=${userId}`)
    
    return new Promise((resolve, reject) => {
      const messageHandlers: ((message: any) => void)[] = []
      const disconnectHandlers: (() => void)[] = []
      let heartbeatInterval: NodeJS.Timeout
      
      ws.on('open', () => {
        // Send auth message
        ws.send(JSON.stringify({
          action: 'auth',
          userId,
          connectionId
        }))
        
        // Start heartbeat
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'ping' }))
          }
        }, 30000) // 30 seconds
        
        const connection: RealtimeConnection = {
          id: connectionId,
          
          async send(message: any): Promise<void> {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                action: 'message',
                data: message
              }))
            } else {
              throw new Error('Connection is not open')
            }
          },
          
          onMessage(callback: (message: any) => void): void {
            messageHandlers.push(callback)
          },
          
          onDisconnect(callback: () => void): void {
            disconnectHandlers.push(callback)
          },
          
          async disconnect(): Promise<void> {
            clearInterval(heartbeatInterval)
            ws.close(1000, 'Client disconnect')
          }
        }
        
        resolve(connection)
      })
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          
          if (message.type === 'message' || message.type === 'channel') {
            messageHandlers.forEach(handler => handler(message.data))
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message', { error })
        }
      })
      
      ws.on('close', () => {
        clearInterval(heartbeatInterval)
        disconnectHandlers.forEach(handler => handler())
      })
      
      ws.on('error', (error) => {
        clearInterval(heartbeatInterval)
        logger.error('WebSocket error', { error })
        reject(error)
      })
    })
  }
  
  // Server-side connection handling (for Lambda WebSocket handlers)
  async handleConnect(connectionId: string, userId: string): Promise<void> {
    const connection: ConnectionRecord = {
      connectionId,
      userId,
      channels: new Set(),
      connectedAt: new Date()
    }
    
    // Store in DynamoDB
    await this.dynamoClient.send(new PutItemCommand({
      TableName: this.connectionsTable,
      Item: marshall({
        connectionId,
        userId,
        connectedAt: connection.connectedAt.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hour TTL
      })
    }))
    
    this.connections.set(connectionId, connection)
  }
  
  async handleDisconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    // Remove from all channels
    for (const channel of connection.channels) {
      await this.unsubscribeConnection(connectionId, channel)
    }
    
    // Remove connection record
    await this.dynamoClient.send(new DeleteItemCommand({
      TableName: this.connectionsTable,
      Key: marshall({ connectionId })
    }))
    
    this.connections.delete(connectionId)
  }
  
  @trackPerformance
  async subscribe(channel: string, callback: (message: any) => void): Promise<() => void> {
    // Local event bus subscription
    this.eventBus.on(`channel:${channel}`, callback)
    
    return () => {
      this.eventBus.off(`channel:${channel}`, callback)
    }
  }
  
  @trackPerformance
  async publish(channel: string, message: any): Promise<void> {
    // Emit to local event bus
    this.eventBus.emit(`channel:${channel}`, message)
    
    // If we have API client (server-side), send to all connections
    if (this.apiClient) {
      await this.broadcastToChannel(channel, message)
    }
  }
  
  private async broadcastToChannel(channel: string, message: any): Promise<void> {
    // Get all connections subscribed to this channel
    const response = await this.dynamoClient.send(new QueryCommand({
      TableName: this.subscriptionsTable,
      IndexName: 'channel-index',
      KeyConditionExpression: 'channelId = :channel',
      ExpressionAttributeValues: {
        ':channel': { S: channel }
      }
    }))
    
    const subscriptions = response.Items?.map(item => unmarshall(item)) || []
    
    // Send to each connection
    const promises = subscriptions.map(async (sub) => {
      try {
        await this.sendToConnection(sub.connectionId, {
          type: 'channel',
          channel,
          data: message
        })
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Connection is gone, clean up
          await this.handleDisconnect(sub.connectionId)
        }
      }
    })
    
    await Promise.all(promises)
  }
  
  private async sendToConnection(connectionId: string, data: any): Promise<void> {
    if (!this.apiClient) {
      throw new Error('API client not initialized')
    }
    
    await this.circuitBreaker.execute(() =>
      withRetry(() =>
        this.apiClient!.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify(data)
        }))
      )
    )
  }
  
  // Channel subscription management
  async subscribeConnection(connectionId: string, channel: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    connection.channels.add(channel)
    
    // Store subscription in DynamoDB
    await this.dynamoClient.send(new PutItemCommand({
      TableName: this.subscriptionsTable,
      Item: marshall({
        channelId: channel,
        connectionId,
        userId: connection.userId,
        subscribedAt: new Date().toISOString()
      })
    }))
  }
  
  async unsubscribeConnection(connectionId: string, channel: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.channels.delete(channel)
    }
    
    // Remove subscription from DynamoDB
    await this.dynamoClient.send(new DeleteItemCommand({
      TableName: this.subscriptionsTable,
      Key: marshall({
        channelId: channel,
        connectionId
      })
    }))
  }
  
  @trackPerformance
  async trackPresence(channel: string, userId: string, metadata?: any): Promise<() => void> {
    const presenceKey = `presence:${channel}:${userId}`
    const presenceData = {
      userId,
      connectedAt: new Date(),
      metadata
    }
    
    // Store presence in DynamoDB
    await this.dynamoClient.send(new PutItemCommand({
      TableName: this.connectionsTable,
      Item: marshall({
        connectionId: presenceKey,
        userId,
        channel,
        type: 'presence',
        connectedAt: presenceData.connectedAt.toISOString(),
        metadata: metadata || {},
        ttl: Math.floor(Date.now() / 1000) + 300 // 5 minute TTL
      })
    }))
    
    // Notify channel of presence
    await this.publish(channel, {
      type: 'presence_join',
      userId,
      metadata
    })
    
    // Return cleanup function
    return async () => {
      await this.dynamoClient.send(new DeleteItemCommand({
        TableName: this.connectionsTable,
        Key: marshall({ connectionId: presenceKey })
      }))
      
      await this.publish(channel, {
        type: 'presence_leave',
        userId
      })
    }
  }
  
  @trackPerformance
  async getPresence(channel: string): Promise<PresenceInfo[]> {
    const response = await this.dynamoClient.send(new ScanCommand({
      TableName: this.connectionsTable,
      FilterExpression: '#channel = :channel AND #type = :type',
      ExpressionAttributeNames: {
        '#channel': 'channel',
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':channel': { S: channel },
        ':type': { S: 'presence' }
      }
    }))
    
    return (response.Items || []).map(item => {
      const data = unmarshall(item)
      return {
        userId: data.userId,
        connectedAt: new Date(data.connectedAt),
        metadata: data.metadata
      }
    })
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Check DynamoDB connection
      await this.dynamoClient.send(new ScanCommand({
        TableName: this.connectionsTable,
        Limit: 1
      }))
      
      return {
        status: 'healthy',
        details: {
          connectionsCount: this.connections.size,
          wsEndpoint: this.wsEndpoint,
          hasApiClient: !!this.apiClient,
          circuitBreaker: this.circuitBreaker.status
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