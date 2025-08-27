/**
 * Message Queue Primitive Definition
 * Platform construct definition for the Message Queue primitive
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { MessageQueuePrimitive } from './MessageQueuePrimitive'

export const messageQueuePrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-message-queue-primitive',
  name: 'Message Queue Primitive',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L0,
  description: 'Raw message queuing mechanism with pub/sub pattern, priority queuing, and dead letter queue support',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'messaging', 'async', 'mcp'],
  tags: [
    'message-queue',
    'pub-sub',
    'async-messaging',
    'event-driven',
    'primitive',
    'mcp-foundation',
    'priority-queue',
    'dead-letter-queue'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'message-publishing',
    'topic-subscription',
    'priority-queuing',
    'message-expiration',
    'deduplication',
    'dead-letter-queue',
    'wildcard-topics',
    'concurrent-processing',
    'statistics-tracking'
  ],
  
  inputs: [
    {
      name: 'maxQueueSize',
      type: 'number',
      required: false,
      description: 'Maximum number of messages in the queue'
    },
    {
      name: 'messageTTL',
      type: 'number',
      required: false,
      description: 'Default message time-to-live in milliseconds'
    },
    {
      name: 'enablePersistence',
      type: 'boolean',
      required: false,
      description: 'Enable message persistence (future feature)'
    },
    {
      name: 'enableDeduplication',
      type: 'boolean',
      required: false,
      description: 'Enable message deduplication'
    },
    {
      name: 'deduplicationWindow',
      type: 'number',
      required: false,
      description: 'Time window for deduplication in milliseconds'
    },
    {
      name: 'defaultPriority',
      type: 'number',
      required: false,
      description: 'Default priority for messages (0-100)'
    },
    {
      name: 'enableDeadLetterQueue',
      type: 'boolean',
      required: false,
      description: 'Enable dead letter queue for failed messages'
    },
    {
      name: 'maxDeliveryAttempts',
      type: 'number',
      required: false,
      description: 'Max delivery attempts before moving to DLQ'
    }
  ],
  
  outputs: [
    {
      name: 'publish',
      type: 'function',
      description: 'Function to publish a message to a topic'
    },
    {
      name: 'subscribe',
      type: 'function',
      description: 'Function to subscribe to messages on a topic'
    },
    {
      name: 'unsubscribe',
      type: 'function',
      description: 'Function to unsubscribe from messages'
    },
    {
      name: 'size',
      type: 'function',
      description: 'Function to get current queue size'
    },
    {
      name: 'getMessages',
      type: 'function',
      description: 'Function to get messages by topic'
    },
    {
      name: 'clear',
      type: 'function',
      description: 'Function to clear messages'
    },
    {
      name: 'subscriptionCount',
      type: 'function',
      description: 'Function to get subscription count'
    },
    {
      name: 'getDeadLetterQueue',
      type: 'function',
      description: 'Function to get dead letter queue messages'
    },
    {
      name: 'retryDLQMessage',
      type: 'function',
      description: 'Function to retry a dead letter message'
    },
    {
      name: 'getStats',
      type: 'function',
      description: 'Function to get queue statistics'
    }
  ],
  
  events: [
    {
      name: 'onMessagePublished',
      description: 'Fired when a message is published'
    },
    {
      name: 'onMessageDelivered',
      description: 'Fired when a message is delivered to a subscriber'
    },
    {
      name: 'onMessageExpired',
      description: 'Fired when a message expires'
    },
    {
      name: 'onMessageDLQ',
      description: 'Fired when a message is moved to dead letter queue'
    },
    {
      name: 'onSubscriptionAdded',
      description: 'Fired when a new subscription is added'
    },
    {
      name: 'onSubscriptionRemoved',
      description: 'Fired when a subscription is removed'
    }
  ],
  
  configuration: {
    maxQueueSize: 10000,
    messageTTL: 300000, // 5 minutes
    enablePersistence: false,
    enableDeduplication: true,
    deduplicationWindow: 60000, // 1 minute
    defaultPriority: 50,
    enableDeadLetterQueue: true,
    maxDeliveryAttempts: 3
  },
  
  examples: [
    {
      name: 'Basic Pub/Sub',
      description: 'Simple publish and subscribe pattern',
      code: `<MessageQueuePrimitive
  config={{
    enableDeadLetterQueue: true
  }}
  onMessageDelivered={(msg, subId) => console.log('Delivered:', msg.id)}
/>

// Usage:
const { publish, subscribe } = useMessageQueue()

// Subscribe to a topic
const subId = subscribe('user.events', async (message) => {
  console.log('Received:', message.payload)
  // Process message
})

// Publish a message
publish('user.events', {
  type: 'USER_CREATED',
  userId: '123',
  timestamp: Date.now()
})`,
      language: 'typescript',
      highlights: [10, 11, 12, 13, 14, 17, 18, 19, 20, 21]
    },
    {
      name: 'Priority Messages',
      description: 'Using priority queue for important messages',
      code: `const { publish, subscribe } = useMessageQueue()

// High priority message
publish('notifications', {
  type: 'CRITICAL_ALERT',
  message: 'System failure detected'
}, {
  priority: 100, // Highest priority
  ttl: 60000 // Expires in 1 minute
})

// Normal priority message
publish('notifications', {
  type: 'INFO',
  message: 'Daily report ready'
}, {
  priority: 50 // Normal priority
})

// Subscribe with concurrent processing
subscribe('notifications', async (message) => {
  if (message.priority > 90) {
    // Handle critical messages immediately
    await sendAlert(message.payload)
  } else {
    // Queue for batch processing
    await queueForLater(message.payload)
  }
}, {
  maxConcurrent: 5 // Process up to 5 messages concurrently
})`,
      language: 'typescript',
      highlights: [3, 8, 9, 17, 23, 29]
    },
    {
      name: 'Wildcard Subscriptions',
      description: 'Subscribe to multiple topics with wildcards',
      code: `const { subscribe } = useMessageQueue()

// Subscribe to all user events
subscribe('user.*', async (message) => {
  console.log('User event:', message.topic, message.payload)
})

// Subscribe to all events
subscribe('*', async (message) => {
  // Log all messages
  await logToAnalytics(message)
})

// Publish different user events
publish('user.created', { userId: '123' })
publish('user.updated', { userId: '123', changes: {...} })
publish('user.deleted', { userId: '123' })`,
      language: 'typescript',
      highlights: [3, 8, 14, 15, 16]
    },
    {
      name: 'Dead Letter Queue',
      description: 'Handle failed messages with DLQ',
      code: `const { subscribe, getDeadLetterQueue, retryDLQMessage } = useMessageQueue()

// Subscribe with error handling
subscribe('orders', async (message) => {
  // Simulate processing error
  if (message.payload.amount > 1000) {
    throw new Error('High value order requires approval')
  }
  await processOrder(message.payload)
})

// Monitor dead letter queue
setInterval(() => {
  const dlqMessages = getDeadLetterQueue()
  
  dlqMessages.forEach(message => {
    console.log('Failed message:', message.id)
    console.log('Attempts:', message.deliveryAttempts)
    
    // Retry if condition is met
    if (shouldRetry(message)) {
      retryDLQMessage(message.id)
    }
  })
}, 5000)`,
      language: 'typescript',
      highlights: [5, 6, 7, 13, 20, 21]
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: false,
    testCoverage: 96
  },
  
  security: {
    authentication: false,
    encryption: false,
    inputValidation: true,
    outputSanitization: false
  },
  
  performance: {
    timeComplexity: 'O(log n) for publish, O(m) for delivery', // n = queue size, m = subscribers
    spaceComplexity: 'O(n + m)', // n = messages, m = subscriptions
    averageResponseTime: '<1ms for publish',
    throughput: '10000+ messages/second'
  },
  
  monitoring: {
    metrics: [
      'queue-size',
      'publish-rate',
      'delivery-rate',
      'dlq-size',
      'average-delivery-time',
      'subscription-count'
    ],
    logs: [
      'message-published',
      'message-delivered',
      'message-expired',
      'message-dlq',
      'subscription-changes'
    ],
    traces: ['message-flow', 'delivery-path']
  },
  
  dependencies: [], // L0 primitives have no dependencies
  
  relatedConstructs: [
    'platform-l0-websocket-primitive',
    'platform-l1-reliable-message-queue',
    'platform-l1-event-bus',
    'platform-l2-mcp-async-pattern'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: [],
    canBuildConstructs: false
  },
  
  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  },
  
  bestPractices: [
    'Set appropriate message TTL to prevent queue overflow',
    'Use priority queuing for time-sensitive messages',
    'Enable dead letter queue for production systems',
    'Monitor queue size and adjust maxQueueSize accordingly',
    'Use deduplication for idempotent operations',
    'Implement proper error handling in message handlers',
    'Use wildcard subscriptions judiciously to avoid performance issues',
    'Set reasonable concurrency limits for subscribers',
    'Regularly monitor and process dead letter queue',
    'Use correlation IDs for request-response patterns'
  ],
  
  deployment: {
    requiredProviders: [],
    configSchema: {
      type: 'object',
      properties: {
        maxQueueSize: {
          type: 'number',
          minimum: 100,
          maximum: 100000,
          default: 10000,
          description: 'Maximum queue size'
        },
        messageTTL: {
          type: 'number',
          minimum: 1000,
          maximum: 86400000, // 24 hours
          default: 300000,
          description: 'Message TTL in milliseconds'
        },
        enableDeadLetterQueue: {
          type: 'boolean',
          default: true,
          description: 'Enable dead letter queue'
        },
        maxDeliveryAttempts: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          default: 3,
          description: 'Max delivery attempts'
        }
      }
    },
    environmentVariables: [
      'MESSAGE_QUEUE_MAX_SIZE',
      'MESSAGE_QUEUE_TTL',
      'MESSAGE_QUEUE_DLQ_ENABLED'
    ],
    preDeploymentChecks: ['memory-availability'],
    postDeploymentChecks: ['queue-health-check']
  },
  
  cost: {
    baseMonthly: 0,
    usageFactors: [
      {
        name: 'messages',
        unit: '1M messages',
        costPerUnit: 0.40,
        typicalUsage: 10
      },
      {
        name: 'memory',
        unit: 'GB-hours',
        costPerUnit: 0.05,
        typicalUsage: 100
      }
    ],
    notes: [
      'In-memory queue has minimal cost',
      'Consider managed services for persistence',
      'Monitor memory usage for large queues'
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'In-Memory Message Queue',
    external: false,
    position: {
      x: 300,
      y: 300
    }
  },
  
  relationships: [
    {
      from: 'platform-l0-message-queue-primitive',
      to: 'platform-l1-event-bus',
      description: 'Provides messaging foundation for',
      technology: 'In-memory pub/sub',
      type: 'async'
    }
  ]
}

export { MessageQueuePrimitive }