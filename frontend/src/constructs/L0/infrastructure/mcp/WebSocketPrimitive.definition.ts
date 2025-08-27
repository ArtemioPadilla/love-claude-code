/**
 * WebSocket Primitive Definition
 * Platform construct definition for the WebSocket primitive
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { WebSocketPrimitive } from './WebSocketPrimitive'

export const websocketPrimitiveDefinition: PlatformConstructDefinition = {
  id: 'platform-l0-websocket-primitive',
  name: 'WebSocket Primitive',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L0,
  description: 'Raw WebSocket connection handling with automatic reconnection and message parsing',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['networking', 'real-time', 'communication', 'mcp'],
  tags: [
    'websocket',
    'real-time',
    'bidirectional',
    'primitive',
    'networking',
    'mcp-foundation'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'websocket-connection',
    'auto-reconnect',
    'message-parsing',
    'binary-support',
    'connection-state-tracking'
  ],
  
  inputs: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: 'WebSocket URL to connect to'
    },
    {
      name: 'autoReconnect',
      type: 'boolean',
      required: false,
      description: 'Automatically reconnect on disconnect'
    },
    {
      name: 'reconnectDelay',
      type: 'number',
      required: false,
      description: 'Base delay between reconnection attempts (ms)'
    },
    {
      name: 'maxReconnectAttempts',
      type: 'number',
      required: false,
      description: 'Maximum number of reconnection attempts'
    },
    {
      name: 'protocols',
      type: 'array',
      required: false,
      description: 'WebSocket sub-protocols'
    },
    {
      name: 'binaryType',
      type: 'string',
      required: false,
      description: 'Binary data type: blob or arraybuffer'
    }
  ],
  
  outputs: [
    {
      name: 'state',
      type: 'string',
      description: 'Current connection state: connecting, open, closing, closed'
    },
    {
      name: 'send',
      type: 'function',
      description: 'Function to send data through the WebSocket'
    },
    {
      name: 'close',
      type: 'function',
      description: 'Function to close the WebSocket connection'
    },
    {
      name: 'reconnect',
      type: 'function',
      description: 'Function to manually trigger reconnection'
    },
    {
      name: 'reconnectAttempt',
      type: 'number',
      description: 'Current reconnection attempt number'
    },
    {
      name: 'isReconnecting',
      type: 'boolean',
      description: 'Whether currently attempting to reconnect'
    },
    {
      name: 'ws',
      type: 'object',
      description: 'Raw WebSocket instance'
    }
  ],
  
  events: [
    {
      name: 'onOpen',
      description: 'Fired when WebSocket connection opens'
    },
    {
      name: 'onMessage',
      description: 'Fired when a message is received'
    },
    {
      name: 'onClose',
      description: 'Fired when WebSocket connection closes'
    },
    {
      name: 'onError',
      description: 'Fired when an error occurs'
    },
    {
      name: 'onReconnecting',
      description: 'Fired when attempting to reconnect'
    }
  ],
  
  configuration: {
    url: 'ws://localhost:8080',
    autoReconnect: true,
    reconnectDelay: 1000,
    maxReconnectAttempts: 5,
    binaryType: 'arraybuffer'
  },
  
  examples: [
    {
      name: 'Basic WebSocket Connection',
      description: 'Simple WebSocket connection with message handling',
      code: `<WebSocketPrimitive
  config={{
    url: 'ws://localhost:8080',
    autoReconnect: true
  }}
  onMessage={(data) => console.log('Received:', data)}
  onOpen={() => console.log('Connected')}
  onClose={() => console.log('Disconnected')}
/>`
    },
    {
      name: 'MCP Server Connection',
      description: 'WebSocket connection for MCP protocol',
      code: `<WebSocketPrimitive
  config={{
    url: 'ws://localhost:3000/mcp',
    protocols: ['mcp-v1'],
    autoReconnect: true,
    maxReconnectAttempts: 10
  }}
  onMessage={handleMCPMessage}
  onError={handleError}
/>`
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: false,
    testCoverage: 95
  },
  
  security: {
    authentication: false,
    encryption: false, // Depends on wss:// protocol
    inputValidation: true,
    outputSanitization: false
  },
  
  performance: {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    averageResponseTime: '<1ms',
    throughput: 'Depends on network'
  },
  
  monitoring: {
    metrics: ['connection-state', 'message-count', 'reconnect-attempts', 'latency'],
    logs: ['connection-events', 'errors', 'reconnections'],
    traces: ['message-flow']
  },
  
  dependencies: [], // L0 primitives have no dependencies
  
  relatedConstructs: [
    'platform-l0-message-queue-primitive',
    'platform-l1-authenticated-websocket',
    'platform-l1-encrypted-websocket'
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
  }
}

export { WebSocketPrimitive }