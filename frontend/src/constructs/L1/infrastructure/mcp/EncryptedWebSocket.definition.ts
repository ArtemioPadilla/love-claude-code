/**
 * Encrypted WebSocket Definition
 * Platform construct definition for the Encrypted WebSocket
 */

import { 
  PlatformConstructDefinition, 
  ConstructType, 
  ConstructLevel,
  CloudProvider 
} from '../../../types'
import { EncryptedWebSocket } from './EncryptedWebSocket'

export const encryptedWebSocketDefinition: PlatformConstructDefinition = {
  id: 'platform-l1-encrypted-websocket',
  name: 'Encrypted WebSocket',
  type: ConstructType.INFRASTRUCTURE,
  level: ConstructLevel.L1,
  description: 'Production-ready WebSocket with end-to-end encryption, TLS/WSS enforcement, certificate validation, secure handshake, and key rotation',
  version: '1.0.0',
  author: 'Love Claude Code Team',
  
  categories: ['infrastructure', 'mcp', 'websocket', 'security', 'encryption'],
  tags: [
    'websocket',
    'encryption',
    'tls',
    'wss',
    'certificate-validation',
    'certificate-pinning',
    'key-rotation',
    'perfect-forward-secrecy',
    'secure-handshake',
    'aes-256-gcm',
    'end-to-end-encryption'
  ],
  
  providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
  
  capabilities: [
    'secure-websocket',
    'tls-enforcement',
    'message-encryption',
    'certificate-validation',
    'certificate-pinning',
    'key-rotation',
    'perfect-forward-secrecy',
    'secure-handshake',
    'mutual-tls',
    'encryption-metrics'
  ],
  
  inputs: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: 'WebSocket URL (must be wss://)',
      validation: {
        pattern: '^wss://.*|^ws://localhost.*'
      }
    },
    {
      name: 'encryption',
      type: 'object',
      required: true,
      description: 'Encryption configuration',
      validation: {
        properties: {
          algorithm: { enum: ['aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305'] },
          key: { type: 'string' },
          keyRotationInterval: { type: 'number', min: 60000 },
          perfectForwardSecrecy: { type: 'boolean' }
        }
      }
    },
    {
      name: 'certificate',
      type: 'object',
      required: false,
      description: 'Certificate validation configuration',
      validation: {
        properties: {
          fingerprint: { type: 'string' },
          pinning: { type: 'boolean' },
          allowSelfSigned: { type: 'boolean' }
        }
      }
    },
    {
      name: 'handshake',
      type: 'object',
      required: false,
      description: 'Handshake configuration',
      validation: {
        properties: {
          timeout: { type: 'number', min: 1000, max: 60000 },
          protocol: { enum: ['standard', 'custom'] },
          auth: { type: 'object' }
        }
      }
    },
    {
      name: 'reconnect',
      type: 'object',
      required: false,
      description: 'Reconnection configuration',
      validation: {
        properties: {
          enabled: { type: 'boolean' },
          maxAttempts: { type: 'number', min: 0, max: 100 },
          delay: { type: 'number', min: 100 }
        }
      }
    }
  ],
  
  outputs: [
    {
      name: 'state',
      type: 'string',
      description: 'Connection state: connecting, open, closing, closed'
    },
    {
      name: 'sendEncrypted',
      type: 'function',
      description: 'Send encrypted message'
    },
    {
      name: 'sendPlaintext',
      type: 'function',
      description: 'Send unencrypted message (for handshake)'
    },
    {
      name: 'close',
      type: 'function',
      description: 'Close the connection'
    },
    {
      name: 'getSessionInfo',
      type: 'function',
      description: 'Get current session information'
    },
    {
      name: 'rotateKey',
      type: 'function',
      description: 'Force key rotation'
    },
    {
      name: 'getMetrics',
      type: 'function',
      description: 'Get encryption metrics'
    }
  ],
  
  events: [
    {
      name: 'onMessage',
      description: 'Fired when a message is received (with decryption status)'
    },
    {
      name: 'onOpen',
      description: 'Fired when connection is established and handshake complete'
    },
    {
      name: 'onClose',
      description: 'Fired when connection is closed'
    },
    {
      name: 'onError',
      description: 'Fired when an error occurs'
    },
    {
      name: 'onHandshakeComplete',
      description: 'Fired when secure handshake is complete'
    },
    {
      name: 'onKeyRotation',
      description: 'Fired when encryption key is rotated'
    }
  ],
  
  configuration: {
    url: 'wss://api.example.com/secure',
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 3600000, // 1 hour
      perfectForwardSecrecy: true
    },
    certificate: {
      pinning: true,
      allowSelfSigned: false
    },
    handshake: {
      timeout: 10000,
      protocol: 'standard'
    },
    reconnect: {
      enabled: true,
      maxAttempts: 5,
      delay: 1000
    }
  },
  
  examples: [
    {
      name: 'Basic Encrypted WebSocket',
      description: 'Create a secure WebSocket with AES-256-GCM encryption',
      code: `// Example: Basic Encrypted WebSocket
const ws = new EncryptedWebSocket({
  config: {
    url: 'wss://secure.example.com/ws',
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 3600000 // 1 hour
    }
  }
});

ws.on('message', (data, decrypted) => {
  console.log('Received message:', data);
});

ws.on('handshakeComplete', (session) => {
  console.log('Secure session established:', session.sessionId);
});`,
      language: 'typescript'
    },
    {
      name: 'Perfect Forward Secrecy',
      description: 'WebSocket with PFS and certificate pinning',
      code: `const ws = new EncryptedWebSocket()

await ws.initialize({
  url: 'wss://api.example.com/secure',
  encryption: {
    algorithm: 'aes-256-gcm',
    perfectForwardSecrecy: true,
    keyRotationInterval: 1800000 // 30 minutes
  },
  certificate: {
    fingerprint: 'SHA256:1234567890abcdef...',
    pinning: true
  },
  handshake: {
    protocol: 'custom',
    auth: {
      method: 'token',
      credentials: { token: authToken }
    }
  }
})

// Send encrypted message
aws.sendEncrypted({
  type: 'message',
  content: 'Highly sensitive data'
})

// Get session info
const session = ws.getSessionInfo()
console.log('Encrypted:', session.encrypted)
console.log('Algorithm:', session.algorithm)
console.log('PFS:', session.perfectForwardSecrecy)`,
      language: 'typescript'
    },
    {
      name: 'Manual Key Rotation',
      description: 'Force key rotation and monitor metrics',
      code: `const ws = useEncryptedWebSocket(config)

// Monitor encryption metrics
setInterval(() => {
  const metrics = ws.getMetrics()
  console.log('Encryption Metrics:', {
    encrypted: metrics.messagesEncrypted,
    decrypted: metrics.messagesDecrypted,
    errors: metrics.encryptionErrors + metrics.decryptionErrors,
    rotations: metrics.keyRotations,
    avgEncryptTime: metrics.averageEncryptTime.toFixed(2) + 'ms',
    avgDecryptTime: metrics.averageDecryptTime.toFixed(2) + 'ms'
  })
}, 10000)

// Force key rotation
setTimeout(() => {
  ws.rotateKey().then(() => {
    console.log('Key rotation completed')
  })
}, 300000) // After 5 minutes

// Handle key rotation events
ws.on('keyRotation', (newKeyId) => {
  console.log('Key rotated to:', newKeyId)
})`,
      language: 'typescript'
    },
    {
      name: 'Mutual TLS Authentication',
      description: 'WebSocket with client certificate authentication',
      code: `// Example: Mutual TLS Authentication
const ws = new EncryptedWebSocket({
  config: {
    url: 'wss://mtls.example.com/secure',
    encryption: {
      algorithm: 'chacha20-poly1305',
      perfectForwardSecrecy: true
    },
    certificate: {
      pinning: true,
      allowSelfSigned: false
    },
    handshake: {
      protocol: 'custom',
      auth: {
        method: 'mutual-tls',
        credentials: {
          clientCert: clientCertPEM,
          clientKey: clientKeyPEM
        }
      }
    }
  }
});

ws.on('handshakeComplete', (session) => {
  console.log('mTLS session established');
  console.log('Certificate valid:', session.certificateValid);
});`,
      language: 'typescript'
    }
  ],
  
  testing: {
    unitTests: true,
    integrationTests: true,
    e2eTests: true,
    testCoverage: 90
  },
  
  security: {
    authentication: true,
    encryption: true,
    inputValidation: true,
    outputSanitization: false
  },
  
  performance: {
    timeComplexity: 'O(n) for encryption/decryption',
    spaceComplexity: 'O(1) for streaming',
    averageResponseTime: '<5ms encryption overhead',
    throughput: '50MB/s+ with hardware acceleration'
  },
  
  monitoring: {
    metrics: [
      'messages_encrypted',
      'messages_decrypted',
      'encryption_errors',
      'decryption_errors',
      'key_rotations',
      'average_encrypt_time',
      'average_decrypt_time',
      'session_duration'
    ],
    logs: [
      'handshake',
      'key-rotation',
      'encryption-errors',
      'certificate-validation'
    ],
    traces: ['message-flow', 'handshake-sequence']
  },
  
  dependencies: [
    {
      constructId: 'platform-l0-websocket-primitive',
      version: '1.0.0',
      optional: false
    }
  ],
  
  relatedConstructs: [
    'platform-l1-secure-mcp-server',
    'platform-l0-websocket-primitive',
    'platform-l1-authenticated-websocket'
  ],
  
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'manual',
    vibeCodingPercentage: 0,
    builtWith: ['platform-l0-websocket-primitive'],
    canBuildConstructs: false
  },
  
  platformCapabilities: {
    canSelfDeploy: false,
    canSelfUpdate: false,
    canSelfTest: true,
    platformVersion: '1.0.0'
  },
  
  bestPractices: [
    'Always use wss:// in production (never ws://)',
    'Enable certificate pinning for high-security applications',
    'Use perfect forward secrecy to protect past sessions',
    'Rotate keys regularly (hourly or daily)',
    'Monitor encryption metrics for anomalies',
    'Handle key rotation gracefully with grace periods',
    'Validate certificates against known fingerprints',
    'Use strong encryption algorithms (AES-256-GCM recommended)',
    'Implement proper error handling for decryption failures',
    'Store keys securely (never in code or logs)'
  ],
  
  deployment: {
    requiredProviders: ['nodejs', 'webcrypto'],
    configSchema: {
      type: 'object',
      required: ['url', 'encryption'],
      properties: {
        url: { type: 'string', pattern: '^wss://' },
        encryption: {
          type: 'object',
          required: ['algorithm'],
          properties: {
            algorithm: { enum: ['aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305'] },
            keyRotationInterval: { type: 'number', minimum: 60000 }
          }
        }
      }
    },
    environmentVariables: [
      'WEBSOCKET_ENCRYPTION_KEY',
      'WEBSOCKET_CERT_FINGERPRINT',
      'WEBSOCKET_KEY_ROTATION_INTERVAL'
    ],
    preDeploymentChecks: [
      'validate-wss-endpoint',
      'test-encryption-algorithms',
      'verify-certificate'
    ],
    postDeploymentChecks: [
      'handshake-test',
      'encryption-test',
      'key-rotation-test'
    ]
  },
  
  cost: {
    baseMonthly: 0,
    usageFactors: [
      {
        name: 'encrypted-messages',
        unit: '1M messages',
        costPerUnit: 0.10,
        typicalUsage: 50
      },
      {
        name: 'data-transfer',
        unit: 'GB',
        costPerUnit: 0.09,
        typicalUsage: 100
      },
      {
        name: 'key-rotations',
        unit: '1000 rotations',
        costPerUnit: 0.01,
        typicalUsage: 720
      }
    ],
    notes: [
      'Encryption adds minimal overhead',
      'Hardware acceleration reduces CPU usage',
      'Key rotation costs are negligible'
    ]
  },
  
  c4: {
    type: 'Component',
    technology: 'Encrypted WebSocket',
    external: false,
    containerType: 'Service',
    position: {
      x: 400,
      y: 400
    }
  },
  
  relationships: [
    {
      from: 'platform-l1-encrypted-websocket',
      to: 'platform-l0-websocket-primitive',
      description: 'Wraps and secures',
      technology: 'Direct composition',
      type: 'sync'
    },
    {
      from: 'platform-l1-secure-mcp-server',
      to: 'platform-l1-encrypted-websocket',
      description: 'Uses for secure communication',
      technology: 'WebSocket',
      type: 'sync'
    }
  ]
}

export { EncryptedWebSocket }