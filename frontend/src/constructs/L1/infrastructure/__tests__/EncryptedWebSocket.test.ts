import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EncryptedWebSocket } from '../EncryptedWebSocket'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent 
} from '../../../../test-utils/constructTestUtils'
import { WebSocketDataFactory } from '../../../../test-utils/testFactories'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number = 0
  onopen: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null
  sentMessages: any[] = []

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.({ type: 'open' })
    }, 10)
  }

  send(data: string) {
    if (this.readyState !== 1) {
      throw new Error('WebSocket is not open')
    }
    this.sentMessages.push(data)
    
    // Echo back for testing
    setTimeout(() => {
      const parsed = JSON.parse(data)
      if (parsed.type === 'ping') {
        this.onmessage?.({
          type: 'message',
          data: JSON.stringify({ type: 'pong', id: parsed.id })
        })
      }
    }, 20)
  }

  close() {
    this.readyState = 3
    this.onclose?.({ type: 'close', code: 1000, reason: 'Normal closure' })
  }
}

// Mock crypto
const mockCrypto = {
  subtle: {
    generateKey: vi.fn().mockResolvedValue({
      publicKey: 'mock-public-key',
      privateKey: 'mock-private-key'
    }),
    encrypt: vi.fn().mockImplementation((algorithm, key, data) => {
      return Promise.resolve(new ArrayBuffer(data.byteLength + 16)) // Add overhead
    }),
    decrypt: vi.fn().mockImplementation((algorithm, key, data) => {
      return Promise.resolve(new ArrayBuffer(data.byteLength - 16)) // Remove overhead
    }),
    exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: vi.fn().mockResolvedValue('imported-key')
  }
}

global.WebSocket = MockWebSocket as any
global.crypto = mockCrypto as any

describe('EncryptedWebSocket', () => {
  let harness: ConstructTestHarness<EncryptedWebSocket>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'encrypted-websocket',
      name: 'Encrypted WebSocket',
      level: 'L1',
      category: 'infrastructure'
    })

    harness = new ConstructTestHarness(
      EncryptedWebSocket,
      metadata,
      { url: 'ws://localhost:8080' }
    )

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize and connect', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      expect(harness.construct.isConnected()).toBe(true)
      harness.expectEvent('initialized')
    })

    it('should emit websocket:connected event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'websocket:connected')
      await harness.initialize()
      
      const event = await promise
      expect(event).toEqual({ encrypted: true })
    })

    it('should generate encryption keys', async () => {
      await harness.initialize()
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RSA-OAEP',
          modulusLength: 2048
        }),
        true,
        ['encrypt', 'decrypt']
      )
    })

    it('should handle connection failure', async () => {
      const OriginalWebSocket = global.WebSocket
      global.WebSocket = class FailingWebSocket {
        constructor() {
          setTimeout(() => {
            this.onerror?.({ type: 'error', message: 'Connection failed' })
          }, 10)
        }
        onopen: any = null
        onerror: any = null
        close() {}
      } as any

      await expect(harness.initialize()).rejects.toThrow('Failed to connect')
      
      global.WebSocket = OriginalWebSocket
    })
  })

  describe('message encryption', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should send encrypted messages', async () => {
      const message = WebSocketDataFactory.createMessage({
        type: 'data',
        payload: { secret: 'confidential' }
      })

      await harness.construct.send(message)

      const ws = harness.construct['ws'] as MockWebSocket
      expect(ws.sentMessages).toHaveLength(1)
      
      const sent = JSON.parse(ws.sentMessages[0])
      expect(sent.encrypted).toBe(true)
      expect(sent.data).toBeDefined()
      expect(sent.iv).toBeDefined()
      
      harness.expectEvent('message:sent', {
        id: message.id,
        encrypted: true
      })
    })

    it('should receive and decrypt messages', async () => {
      const receivedMessages: any[] = []
      harness.construct.onMessage((msg) => {
        receivedMessages.push(msg)
      })

      // Simulate encrypted message
      const ws = harness.construct['ws'] as MockWebSocket
      ws.onmessage?.({
        type: 'message',
        data: JSON.stringify({
          id: 'msg-123',
          encrypted: true,
          data: 'encrypted-data',
          iv: 'initialization-vector'
        })
      })

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
      harness.expectEvent('message:received', {
        id: 'msg-123',
        encrypted: true
      })
    })

    it('should handle non-encrypted messages', async () => {
      const receivedMessages: any[] = []
      harness.construct.onMessage((msg) => {
        receivedMessages.push(msg)
      })

      const message = WebSocketDataFactory.createMessage()
      const ws = harness.construct['ws'] as MockWebSocket
      ws.onmessage?.({
        type: 'message',
        data: JSON.stringify(message)
      })

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(receivedMessages).toHaveLength(1)
      expect(receivedMessages[0]).toEqual(message)
      expect(mockCrypto.subtle.decrypt).not.toHaveBeenCalled()
    })

    it('should handle encryption errors', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValueOnce(new Error('Encryption failed'))

      const message = WebSocketDataFactory.createMessage()
      await expect(harness.construct.send(message))
        .rejects.toThrow('Failed to encrypt message')

      harness.expectEvent('encryption:error', {
        operation: 'encrypt',
        error: 'Encryption failed'
      })
    })
  })

  describe('connection management', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should handle reconnection', async () => {
      const ws = harness.construct['ws'] as MockWebSocket
      
      // Simulate disconnect
      ws.readyState = MockWebSocket.CLOSED
      ws.onclose?.({ type: 'close', code: 1006, reason: 'Abnormal closure' })

      harness.expectEvent('websocket:disconnected', {
        code: 1006,
        reason: 'Abnormal closure'
      })

      // Wait for reconnection
      await new Promise(resolve => setTimeout(resolve, 1100)) // Default reconnect delay

      expect(harness.construct.isConnected()).toBe(true)
      harness.expectEvent('websocket:reconnected')
    })

    it('should respect max reconnect attempts', async () => {
      harness.construct.setReconnectConfig({
        maxAttempts: 2,
        delay: 100,
        maxDelay: 1000
      })

      // Mock WebSocket to always fail
      const OriginalWebSocket = global.WebSocket
      let attempts = 0
      global.WebSocket = class FailingWebSocket {
        constructor() {
          attempts++
          setTimeout(() => {
            this.onerror?.({ type: 'error' })
            this.onclose?.({ type: 'close', code: 1006 })
          }, 10)
        }
        onopen: any = null
        onerror: any = null
        onclose: any = null
        close() {}
      } as any

      const ws = harness.construct['ws'] as MockWebSocket
      ws.onclose?.({ type: 'close', code: 1006 })

      // Wait for reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 500))

      expect(attempts).toBe(2)
      harness.expectEvent('websocket:reconnect-failed', {
        attempts: 2,
        maxAttempts: 2
      })

      global.WebSocket = OriginalWebSocket
    })

    it('should handle manual disconnect', async () => {
      await harness.construct.disconnect()

      expect(harness.construct.isConnected()).toBe(false)
      harness.expectEvent('websocket:disconnected', {
        code: 1000,
        reason: 'Normal closure'
      })

      // Should not auto-reconnect
      await new Promise(resolve => setTimeout(resolve, 1500))
      expect(harness.construct.isConnected()).toBe(false)
    })

    it('should reconnect manually', async () => {
      await harness.construct.disconnect()
      harness.clearEvents()

      await harness.construct.connect()

      expect(harness.construct.isConnected()).toBe(true)
      harness.expectEvent('websocket:connected', { encrypted: true })
    })
  })

  describe('heartbeat', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should send periodic heartbeats', async () => {
      harness.construct.setHeartbeatInterval(100)
      
      await new Promise(resolve => setTimeout(resolve, 250))

      const ws = harness.construct['ws'] as MockWebSocket
      const pings = ws.sentMessages.filter(msg => {
        const parsed = JSON.parse(msg)
        return parsed.type === 'ping'
      })

      expect(pings.length).toBeGreaterThanOrEqual(2)
    })

    it('should detect connection loss via heartbeat timeout', async () => {
      harness.construct.setHeartbeatInterval(100)
      harness.construct.setHeartbeatTimeout(200)

      // Stop responding to pings
      const ws = harness.construct['ws'] as MockWebSocket
      ws.send = vi.fn() // Won't trigger pong response

      await new Promise(resolve => setTimeout(resolve, 350))

      harness.expectEvent('websocket:heartbeat-timeout')
      expect(harness.construct.isConnected()).toBe(false)
    })
  })

  describe('message queuing', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should queue messages when disconnected', async () => {
      await harness.construct.disconnect()
      
      const message1 = WebSocketDataFactory.createMessage({ id: 'msg-1' })
      const message2 = WebSocketDataFactory.createMessage({ id: 'msg-2' })

      // These should be queued
      harness.construct.send(message1).catch(() => {}) // Ignore promise rejection
      harness.construct.send(message2).catch(() => {})

      expect(harness.construct.getQueueSize()).toBe(2)
      harness.expectEvent('message:queued', { id: 'msg-1' })
      harness.expectEvent('message:queued', { id: 'msg-2' })
    })

    it('should send queued messages on reconnect', async () => {
      await harness.construct.disconnect()
      
      const message1 = WebSocketDataFactory.createMessage({ id: 'msg-1' })
      const message2 = WebSocketDataFactory.createMessage({ id: 'msg-2' })

      harness.construct.send(message1).catch(() => {})
      harness.construct.send(message2).catch(() => {})
      harness.clearEvents()

      await harness.construct.connect()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(harness.construct.getQueueSize()).toBe(0)
      harness.expectEvent('queue:flushed', { count: 2 })
    })

    it('should respect queue size limit', async () => {
      harness.construct.setMaxQueueSize(2)
      await harness.construct.disconnect()

      const message1 = WebSocketDataFactory.createMessage({ id: 'msg-1' })
      const message2 = WebSocketDataFactory.createMessage({ id: 'msg-2' })
      const message3 = WebSocketDataFactory.createMessage({ id: 'msg-3' })

      harness.construct.send(message1).catch(() => {})
      harness.construct.send(message2).catch(() => {})
      
      await expect(harness.construct.send(message3))
        .rejects.toThrow('Message queue is full')

      expect(harness.construct.getQueueSize()).toBe(2)
    })

    it('should clear queue on demand', async () => {
      await harness.construct.disconnect()
      
      harness.construct.send(WebSocketDataFactory.createMessage()).catch(() => {})
      harness.construct.send(WebSocketDataFactory.createMessage()).catch(() => {})

      expect(harness.construct.getQueueSize()).toBe(2)
      
      harness.construct.clearQueue()
      
      expect(harness.construct.getQueueSize()).toBe(0)
      harness.expectEvent('queue:cleared', { count: 2 })
    })
  })

  describe('encryption key rotation', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should rotate encryption keys', async () => {
      const oldKeyGenCalls = mockCrypto.subtle.generateKey.mock.calls.length

      await harness.construct.rotateKeys()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledTimes(oldKeyGenCalls + 1)
      harness.expectEvent('keys:rotated')
    })

    it('should handle key rotation during active connection', async () => {
      // Send a message with old keys
      await harness.construct.send(WebSocketDataFactory.createMessage())
      
      // Rotate keys
      await harness.construct.rotateKeys()
      
      // Send a message with new keys
      await harness.construct.send(WebSocketDataFactory.createMessage())

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(2)
    })
  })

  describe('metrics and monitoring', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should track message metrics', async () => {
      await harness.construct.send(WebSocketDataFactory.createMessage())
      await harness.construct.send(WebSocketDataFactory.createMessage())

      const ws = harness.construct['ws'] as MockWebSocket
      ws.onmessage?.({
        type: 'message',
        data: JSON.stringify(WebSocketDataFactory.createMessage())
      })

      const metrics = harness.construct.getMetrics()

      expect(metrics.messagesSent).toBe(2)
      expect(metrics.messagesReceived).toBe(1)
      expect(metrics.bytesReceived).toBeGreaterThan(0)
      expect(metrics.bytesSent).toBeGreaterThan(0)
      expect(metrics.encryptionTime).toBeGreaterThan(0)
    })

    it('should track connection metrics', async () => {
      const metrics = harness.construct.getMetrics()

      expect(metrics.connectTime).toBeGreaterThan(0)
      expect(metrics.reconnectAttempts).toBe(0)
      expect(metrics.connectionDuration).toBeGreaterThan(0)
    })

    it('should reset metrics', () => {
      harness.construct.resetMetrics()
      
      const metrics = harness.construct.getMetrics()
      expect(metrics.messagesSent).toBe(0)
      expect(metrics.messagesReceived).toBe(0)
      expect(metrics.bytesReceived).toBe(0)
      expect(metrics.bytesSent).toBe(0)
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate connected state', async () => {
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect disconnected state', async () => {
      await harness.construct.disconnect()
      
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('WebSocket is disconnected')
        })
      )
    })

    it('should validate encryption keys', async () => {
      // Simulate missing keys
      harness.construct['encryptionKey'] = null as any
      
      const result = await harness.construct.validate()
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('Encryption keys not initialized')
    })
  })

  describe('disposal', () => {
    it('should close connection and clear state', async () => {
      await harness.initialize()
      
      await harness.construct.send(WebSocketDataFactory.createMessage())
      harness.construct.setHeartbeatInterval(100)

      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      expect(harness.construct.isConnected()).toBe(false)
      expect(harness.construct.getQueueSize()).toBe(0)
      harness.expectEvent('disposed')
    })
  })
})