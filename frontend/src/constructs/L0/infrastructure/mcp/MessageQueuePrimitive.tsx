/**
 * Message Queue Primitive L0 Infrastructure Construct
 * 
 * Raw message queuing mechanism with pub/sub pattern.
 * This is the foundation for asynchronous communication in MCP and other systems.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { L0InfrastructureConstruct } from '../../../base/L0Construct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel
} from '../../../types'

// Type definitions
export interface MessageQueuePrimitiveConfig {
  /** Maximum queue size */
  maxQueueSize?: number
  /** Message TTL in milliseconds */
  messageTTL?: number
  /** Enable message persistence */
  enablePersistence?: boolean
  /** Enable message deduplication */
  enableDeduplication?: boolean
  /** Deduplication window in ms */
  deduplicationWindow?: number
  /** Default priority for messages */
  defaultPriority?: number
  /** Enable dead letter queue */
  enableDeadLetterQueue?: boolean
  /** Max delivery attempts before DLQ */
  maxDeliveryAttempts?: number
}

export interface QueueMessage {
  /** Unique message ID */
  id: string
  /** Message topic/channel */
  topic: string
  /** Message payload */
  payload: any
  /** Message priority (higher = more important) */
  priority: number
  /** Creation timestamp */
  timestamp: Date
  /** Expiry timestamp */
  expiresAt?: Date
  /** Delivery attempts */
  deliveryAttempts: number
  /** Message metadata */
  metadata?: Record<string, any>
  /** Correlation ID for request/response */
  correlationId?: string
}

export interface Subscription {
  /** Subscription ID */
  id: string
  /** Topic pattern (supports wildcards) */
  topic: string
  /** Subscriber callback */
  handler: (message: QueueMessage) => void | Promise<void>
  /** Filter function */
  filter?: (message: QueueMessage) => boolean
  /** Max concurrent messages */
  maxConcurrent?: number
  /** Currently processing count */
  processing: number
}

export interface MessageQueuePrimitiveProps {
  config: MessageQueuePrimitiveConfig
  onMessagePublished?: (message: QueueMessage) => void
  onMessageDelivered?: (message: QueueMessage, subscriberId: string) => void
  onMessageExpired?: (message: QueueMessage) => void
  onMessageDLQ?: (message: QueueMessage, reason: string) => void
  onSubscriptionAdded?: (subscription: Subscription) => void
  onSubscriptionRemoved?: (subscriptionId: string) => void
}

export interface MessageQueuePrimitiveOutput {
  /** Publish a message */
  publish: (topic: string, payload: any, options?: PublishOptions) => string
  /** Subscribe to messages */
  subscribe: (topic: string, handler: Subscription['handler'], options?: SubscribeOptions) => string
  /** Unsubscribe from messages */
  unsubscribe: (subscriptionId: string) => boolean
  /** Get queue size */
  size: () => number
  /** Get messages by topic */
  getMessages: (topic: string) => QueueMessage[]
  /** Clear messages */
  clear: (topic?: string) => void
  /** Get subscription count */
  subscriptionCount: () => number
  /** Get dead letter queue */
  getDeadLetterQueue: () => QueueMessage[]
  /** Retry dead letter message */
  retryDLQMessage: (messageId: string) => boolean
  /** Get queue statistics */
  getStats: () => QueueStatistics
}

export interface PublishOptions {
  priority?: number
  ttl?: number
  correlationId?: string
  metadata?: Record<string, any>
  deduplicationId?: string
}

export interface SubscribeOptions {
  filter?: (message: QueueMessage) => boolean
  maxConcurrent?: number
}

export interface QueueStatistics {
  totalMessages: number
  messagesByTopic: Record<string, number>
  totalSubscriptions: number
  subscriptionsByTopic: Record<string, number>
  messagesPublished: number
  messagesDelivered: number
  messagesExpired: number
  messagesDLQ: number
  averageDeliveryTime: number
}

/**
 * Message Queue Primitive Component
 */
export const MessageQueuePrimitive: React.FC<MessageQueuePrimitiveProps> = ({
  config,
  onMessagePublished,
  onMessageDelivered,
  onMessageExpired,
  onMessageDLQ,
  onSubscriptionAdded,
  onSubscriptionRemoved
}) => {
  const [messages, setMessages] = useState<QueueMessage[]>([])
  const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map())
  const [deadLetterQueue, setDeadLetterQueue] = useState<QueueMessage[]>([])
  const [stats, setStats] = useState<QueueStatistics>({
    totalMessages: 0,
    messagesByTopic: {},
    totalSubscriptions: 0,
    subscriptionsByTopic: {},
    messagesPublished: 0,
    messagesDelivered: 0,
    messagesExpired: 0,
    messagesDLQ: 0,
    averageDeliveryTime: 0
  })
  
  const messagesRef = useRef<QueueMessage[]>([])
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map())
  const deduplicationCache = useRef<Map<string, number>>(new Map())
  const deliveryTimesRef = useRef<number[]>([])
  const messageIdCounter = useRef(0)
  const subscriptionIdCounter = useRef(0)

  // Process message queue
  useEffect(() => {
    const interval = setInterval(() => {
      processMessages()
      cleanupExpiredMessages()
      cleanupDeduplicationCache()
    }, 100) // Process every 100ms

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${++messageIdCounter.current}`
  }, [])

  // Generate unique subscription ID
  const generateSubscriptionId = useCallback(() => {
    return `sub_${Date.now()}_${++subscriptionIdCounter.current}`
  }, [])

  // Check for duplicate messages
  const isDuplicate = useCallback((deduplicationId: string): boolean => {
    if (!config.enableDeduplication || !deduplicationId) return false
    
    const now = Date.now()
    const lastSeen = deduplicationCache.current.get(deduplicationId)
    
    if (lastSeen && now - lastSeen < (config.deduplicationWindow || 60000)) {
      return true
    }
    
    deduplicationCache.current.set(deduplicationId, now)
    return false
  }, [config])

  // Publish a message
  const publish = useCallback((
    topic: string,
    payload: any,
    options: PublishOptions = {}
  ): string => {
    // Check deduplication
    if (options.deduplicationId && isDuplicate(options.deduplicationId)) {
      return '' // Return empty string for duplicate
    }

    // Check queue size
    if (config.maxQueueSize && messagesRef.current.length >= config.maxQueueSize) {
      console.warn(`Queue full (max: ${config.maxQueueSize}), dropping message`)
      return ''
    }

    const message: QueueMessage = {
      id: generateMessageId(),
      topic,
      payload,
      priority: options.priority || config.defaultPriority || 0,
      timestamp: new Date(),
      expiresAt: options.ttl 
        ? new Date(Date.now() + options.ttl)
        : config.messageTTL 
          ? new Date(Date.now() + config.messageTTL)
          : undefined,
      deliveryAttempts: 0,
      metadata: options.metadata,
      correlationId: options.correlationId
    }

    // Insert message sorted by priority
    const insertIndex = messagesRef.current.findIndex(m => m.priority < message.priority)
    if (insertIndex === -1) {
      messagesRef.current.push(message)
    } else {
      messagesRef.current.splice(insertIndex, 0, message)
    }

    setMessages([...messagesRef.current])
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalMessages: messagesRef.current.length,
      messagesByTopic: {
        ...prev.messagesByTopic,
        [topic]: (prev.messagesByTopic[topic] || 0) + 1
      },
      messagesPublished: prev.messagesPublished + 1
    }))

    onMessagePublished?.(message)
    return message.id
  }, [config, isDuplicate, generateMessageId, onMessagePublished])

  // Subscribe to messages
  const subscribe = useCallback((
    topic: string,
    handler: Subscription['handler'],
    options: SubscribeOptions = {}
  ): string => {
    const subscription: Subscription = {
      id: generateSubscriptionId(),
      topic,
      handler,
      filter: options.filter,
      maxConcurrent: options.maxConcurrent || 1,
      processing: 0
    }

    subscriptionsRef.current.set(subscription.id, subscription)
    setSubscriptions(new Map(subscriptionsRef.current))

    // Update stats
    setStats(prev => ({
      ...prev,
      totalSubscriptions: subscriptionsRef.current.size,
      subscriptionsByTopic: {
        ...prev.subscriptionsByTopic,
        [topic]: Array.from(subscriptionsRef.current.values())
          .filter(s => s.topic === topic || topicMatches(topic, s.topic)).length
      }
    }))

    onSubscriptionAdded?.(subscription)
    return subscription.id
  }, [generateSubscriptionId, onSubscriptionAdded])

  // Unsubscribe
  const unsubscribe = useCallback((subscriptionId: string): boolean => {
    if (!subscriptionsRef.current.has(subscriptionId)) {
      return false
    }

    subscriptionsRef.current.delete(subscriptionId)
    setSubscriptions(new Map(subscriptionsRef.current))

    // Update stats
    setStats(prev => ({
      ...prev,
      totalSubscriptions: subscriptionsRef.current.size
    }))

    onSubscriptionRemoved?.(subscriptionId)
    return true
  }, [onSubscriptionRemoved])

  // Process messages
  const processMessages = useCallback(async () => {
    const processedMessages: string[] = []
    const startTime = Date.now()

    for (const message of messagesRef.current) {
      let delivered = false

      for (const subscription of subscriptionsRef.current.values()) {
        // Check topic match
        if (!topicMatches(message.topic, subscription.topic)) continue

        // Check filter
        if (subscription.filter && !subscription.filter(message)) continue

        // Check concurrency limit
        if (subscription.processing >= (subscription.maxConcurrent || 1)) continue

        // Deliver message
        subscription.processing++
        delivered = true

        try {
          await subscription.handler(message)
          onMessageDelivered?.(message, subscription.id)
          
          // Track delivery time
          const deliveryTime = Date.now() - startTime
          deliveryTimesRef.current.push(deliveryTime)
          if (deliveryTimesRef.current.length > 100) {
            deliveryTimesRef.current.shift()
          }

          // Update stats
          setStats(prev => ({
            ...prev,
            messagesDelivered: prev.messagesDelivered + 1,
            averageDeliveryTime: deliveryTimesRef.current.reduce((a, b) => a + b, 0) / deliveryTimesRef.current.length
          }))
        } catch (error) {
          console.error('Message handler error:', error)
          message.deliveryAttempts++

          // Check if should go to DLQ
          if (config.enableDeadLetterQueue && 
              message.deliveryAttempts >= (config.maxDeliveryAttempts || 3)) {
            moveToDeadLetterQueue(message, 'Max delivery attempts exceeded')
          }
        } finally {
          subscription.processing--
        }
      }

      if (delivered) {
        processedMessages.push(message.id)
      } else {
        // No subscribers, increment attempts
        message.deliveryAttempts++
        
        if (config.enableDeadLetterQueue && 
            message.deliveryAttempts >= (config.maxDeliveryAttempts || 3)) {
          moveToDeadLetterQueue(message, 'No subscribers after max attempts')
          processedMessages.push(message.id)
        }
      }
    }

    // Remove processed messages
    if (processedMessages.length > 0) {
      messagesRef.current = messagesRef.current.filter(m => !processedMessages.includes(m.id))
      setMessages([...messagesRef.current])
    }
  }, [config, onMessageDelivered])

  // Move message to dead letter queue
  const moveToDeadLetterQueue = useCallback((message: QueueMessage, reason: string) => {
    setDeadLetterQueue(prev => [...prev, message])
    
    setStats(prev => ({
      ...prev,
      messagesDLQ: prev.messagesDLQ + 1
    }))

    onMessageDLQ?.(message, reason)
  }, [onMessageDLQ])

  // Clean up expired messages
  const cleanupExpiredMessages = useCallback(() => {
    const now = Date.now()
    const expiredMessages: QueueMessage[] = []

    messagesRef.current = messagesRef.current.filter(message => {
      if (message.expiresAt && message.expiresAt.getTime() < now) {
        expiredMessages.push(message)
        return false
      }
      return true
    })

    if (expiredMessages.length > 0) {
      setMessages([...messagesRef.current])
      
      expiredMessages.forEach(message => {
        onMessageExpired?.(message)
      })

      setStats(prev => ({
        ...prev,
        messagesExpired: prev.messagesExpired + expiredMessages.length,
        totalMessages: messagesRef.current.length
      }))
    }
  }, [onMessageExpired])

  // Clean up deduplication cache
  const cleanupDeduplicationCache = useCallback(() => {
    const now = Date.now()
    const window = config.deduplicationWindow || 60000

    for (const [id, timestamp] of deduplicationCache.current.entries()) {
      if (now - timestamp > window) {
        deduplicationCache.current.delete(id)
      }
    }
  }, [config.deduplicationWindow])

  // Topic matching with wildcard support
  const topicMatches = (messageTopic: string, subscriptionTopic: string): boolean => {
    if (subscriptionTopic === '*') return true
    if (subscriptionTopic === messageTopic) return true
    
    // Simple wildcard matching
    if (subscriptionTopic.includes('*')) {
      const regex = new RegExp('^' + subscriptionTopic.replace(/\*/g, '.*') + '$')
      return regex.test(messageTopic)
    }
    
    return false
  }

  // Get queue size
  const size = useCallback(() => messagesRef.current.length, [])

  // Get messages by topic
  const getMessages = useCallback((topic: string) => {
    return messagesRef.current.filter(m => topicMatches(m.topic, topic))
  }, [])

  // Clear messages
  const clear = useCallback((topic?: string) => {
    if (topic) {
      messagesRef.current = messagesRef.current.filter(m => !topicMatches(m.topic, topic))
    } else {
      messagesRef.current = []
    }
    setMessages([...messagesRef.current])
  }, [])

  // Get subscription count
  const subscriptionCount = useCallback(() => subscriptionsRef.current.size, [])

  // Get dead letter queue
  const getDeadLetterQueue = useCallback(() => deadLetterQueue, [deadLetterQueue])

  // Retry DLQ message
  const retryDLQMessage = useCallback((messageId: string): boolean => {
    const messageIndex = deadLetterQueue.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return false

    const [message] = deadLetterQueue.splice(messageIndex, 1)
    setDeadLetterQueue([...deadLetterQueue])

    // Reset delivery attempts and republish
    message.deliveryAttempts = 0
    messagesRef.current.push(message)
    setMessages([...messagesRef.current])

    return true
  }, [deadLetterQueue])

  // Get statistics
  const getStats = useCallback(() => stats, [stats])

  return null // This is a headless component
}

// Static construct class for registration
export class MessageQueuePrimitiveConstruct extends L0InfrastructureConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l0-message-queue-primitive',
    name: 'Message Queue Primitive',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L0,
    description: 'Raw message queuing mechanism with pub/sub pattern',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: ['message-queue', 'pub-sub', 'async-messaging'],
    dependencies: [] // L0 has no dependencies
  }

  component = MessageQueuePrimitive

  getConfiguration(): MessageQueuePrimitiveConfig {
    return {
      maxQueueSize: 10000,
      messageTTL: 300000, // 5 minutes
      enableDeadLetterQueue: true,
      maxDeliveryAttempts: 3
    }
  }

  getPrimitive(): any {
    return this.getConfiguration()
  }

  getOutput(): MessageQueuePrimitiveOutput {
    // This would be implemented with proper state management
    return {
      publish: () => '',
      subscribe: () => '',
      unsubscribe: () => false,
      size: () => 0,
      getMessages: () => [],
      clear: () => {},
      subscriptionCount: () => 0,
      getDeadLetterQueue: () => [],
      retryDLQMessage: () => false,
      getStats: () => ({
        totalMessages: 0,
        messagesByTopic: {},
        totalSubscriptions: 0,
        subscriptionsByTopic: {},
        messagesPublished: 0,
        messagesDelivered: 0,
        messagesExpired: 0,
        messagesDLQ: 0,
        averageDeliveryTime: 0
      })
    }
  }

  async initialize(config: MessageQueuePrimitiveConfig): Promise<void> {
    // Initialize message queue
    console.log('Initializing message queue primitive with config:', config)
  }

  async destroy(): Promise<void> {
    // Clean up message queue
    console.log('Destroying message queue primitive')
  }
}

// Export the construct for registration
export const messageQueuePrimitive = new MessageQueuePrimitiveConstruct(MessageQueuePrimitiveConstruct.metadata)