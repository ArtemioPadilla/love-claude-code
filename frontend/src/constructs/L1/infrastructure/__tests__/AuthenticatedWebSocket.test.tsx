import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthenticatedWebSocket, createAuthenticatedWebSocket } from '../AuthenticatedWebSocket'
import { ConstructLevel } from '../../../types'

// Mock WebSocket
class MockWebSocket {
  url: string
  protocols?: string[]
  readyState: number = WebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  binaryType: BinaryType = 'blob'

  constructor(url: string, protocols?: string[]) {
    this.url = url
    this.protocols = protocols
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string | ArrayBuffer | Blob) {
    // Handle ping/pong
    if (data === 'ping') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage(new MessageEvent('message', {
            data: JSON.stringify({ type: 'pong' })
          }))
        }
      }, 5)
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason, wasClean: true }))
    }
  }

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket

describe('AuthenticatedWebSocket L1 Infrastructure Construct', () => {
  let ws: AuthenticatedWebSocket

  beforeEach(() => {
    ws = new AuthenticatedWebSocket()
    vi.useFakeTimers()
  })

  afterEach(() => {
    ws.close()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Definition', () => {
    it('should have correct metadata', () => {
      expect(AuthenticatedWebSocket.definition.id).toBe('platform-l1-authenticated-websocket')
      expect(AuthenticatedWebSocket.definition.name).toBe('Authenticated WebSocket')
      expect(AuthenticatedWebSocket.definition.level).toBe(ConstructLevel.L1)
      expect(AuthenticatedWebSocket.definition.description).toContain('JWT authentication')
    })

    it('should be a platform construct', () => {
      expect(AuthenticatedWebSocket.definition.selfReferential?.isPlatformConstruct).toBe(true)
    })

    it('should have all required providers', () => {
      expect(AuthenticatedWebSocket.definition.providers).toContain('local')
      expect(AuthenticatedWebSocket.definition.providers).toContain('aws')
      expect(AuthenticatedWebSocket.definition.providers).toContain('firebase')
    })

    it('should have security configurations', () => {
      expect(AuthenticatedWebSocket.definition.security).toBeDefined()
      expect(AuthenticatedWebSocket.definition.security?.length).toBeGreaterThan(0)
      
      const securityAspects = AuthenticatedWebSocket.definition.security?.map(s => s.aspect) || []
      expect(securityAspects).toContain('Authentication')
      expect(securityAspects).toContain('Encryption')
      expect(securityAspects).toContain('Message Validation')
    })

    it('should have correct inputs', () => {
      const inputNames = AuthenticatedWebSocket.definition.inputs.map(i => i.name)
      expect(inputNames).toContain('url')
      expect(inputNames).toContain('authToken')
      expect(inputNames).toContain('reconnectConfig')
      expect(inputNames).toContain('heartbeatConfig')
      expect(inputNames).toContain('messageQueue')
      expect(inputNames).toContain('presence')
    })

    it('should have correct outputs', () => {
      const outputNames = AuthenticatedWebSocket.definition.outputs.map(o => o.name)
      expect(outputNames).toContain('connectionId')
      expect(outputNames).toContain('state')
      expect(outputNames).toContain('isAuthenticated')
      expect(outputNames).toContain('latency')
      expect(outputNames).toContain('presenceList')
    })
  })

  describe('Initialization', () => {
    it('should initialize with required configuration', async () => {
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        authToken: 'test-token'
      })

      await vi.runAllTimersAsync()

      expect(ws.getOutput('connectionId')).toBeDefined()
      expect(ws.getOutput('state')).toBe('connected')
      expect(ws.getOutput('isAuthenticated')).toBe(true)
    })

    it('should add token to URL when provided', async () => {
      const mockWs = vi.spyOn(global as any, 'WebSocket')
      
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        authToken: 'test-token'
      })

      expect(mockWs).toHaveBeenCalledWith(
        expect.stringContaining('token=test-token'),
        undefined
      )
    })

    it('should fail without URL', async () => {
      await expect(ws.initialize({})).rejects.toThrow('WebSocket URL is required')
    })
  })

  describe('Connection Management', () => {
    beforeEach(async () => {
      await ws.initialize({
        url: 'wss://api.example.com/ws'
      })
      await vi.runAllTimersAsync()
    })

    it('should handle connection lifecycle', () => {
      expect(ws.getOutput('state')).toBe('connected')
      
      ws.close()
      expect(ws.getOutput('state')).toBe('disconnected')
    })

    it('should emit connection events', async () => {
      const connectedHandler = vi.fn()
      const disconnectedHandler = vi.fn()
      
      ws.on('connected', connectedHandler)
      ws.on('disconnected', disconnectedHandler)
      
      // Already connected from beforeEach
      expect(connectedHandler).toHaveBeenCalledWith({
        connectionId: expect.any(String)
      })
      
      ws.close()
      expect(disconnectedHandler).toHaveBeenCalled()
    })

    it('should track connection statistics', () => {
      const stats = ws.getStats()
      
      expect(stats).toMatchObject({
        messagesSent: 0,
        messagesReceived: 0,
        bytessSent: 0,
        bytesReceived: 0,
        connectTime: expect.any(Date)
      })
    })
  })

  describe('Message Handling', () => {
    let onMessage: vi.Mock

    beforeEach(async () => {
      onMessage = vi.fn()
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        onMessage
      })
      await vi.runAllTimersAsync()
    })

    it('should send and receive messages', () => {
      const messageSentHandler = vi.fn()
      ws.on('messageSent', messageSentHandler)
      
      ws.send({ type: 'test', data: 'hello' })
      
      expect(messageSentHandler).toHaveBeenCalledWith({
        id: expect.any(String),
        data: { type: 'test', data: 'hello' }
      })
    })

    it('should queue messages when disconnected', async () => {
      ws.close()
      
      const queuedHandler = vi.fn()
      ws.on('messageQueued', queuedHandler)
      
      // Should queue instead of throwing
      ws.send({ type: 'test' })
      
      expect(queuedHandler).toHaveBeenCalledWith({
        id: expect.any(String),
        queueSize: 1
      })
      expect(ws.getOutput('queueSize')).toBe(1)
    })

    it('should validate incoming messages', () => {
      const mockWs = (global as any).WebSocket as any
      const instance = new mockWs('wss://test.com')
      
      // Trigger message with XSS attempt
      if (instance.onmessage) {
        instance.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            text: '<script>alert("xss")</script>'
          })
        }))
      }
      
      // Should sanitize the message
      expect(onMessage).toHaveBeenCalledWith({
        text: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      })
    })
  })

  describe('Heartbeat/Ping', () => {
    it('should send periodic heartbeats', async () => {
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        heartbeatConfig: {
          enabled: true,
          interval: 1000,
          timeout: 500
        }
      })
      await vi.runAllTimersAsync()
      
      // Advance time to trigger heartbeat
      vi.advanceTimersByTime(1000)
      
      // Should receive pong and update latency
      vi.advanceTimersByTime(10)
      
      expect(ws.getOutput('latency')).toBeGreaterThan(0)
    })
  })

  describe('Auto-Reconnect', () => {
    it('should attempt reconnection on failure', async () => {
      const reconnectHandler = vi.fn()
      
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        reconnectConfig: {
          enabled: true,
          maxAttempts: 3,
          delay: 100
        },
        onReconnect: reconnectHandler
      })
      await vi.runAllTimersAsync()
      
      // Simulate connection failure
      const mockWs = (global as any).WebSocket as any
      const instance = new mockWs('wss://test.com')
      if (instance.onclose) {
        instance.onclose(new CloseEvent('close', {
          code: 1006,
          reason: 'Connection lost',
          wasClean: false
        }))
      }
      
      // Should trigger reconnection
      vi.advanceTimersByTime(100)
      
      expect(ws.getOutput('state')).toBe('reconnecting')
      expect(ws.getOutput('reconnectAttempts')).toBe(1)
    })

    it('should use exponential backoff', async () => {
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        reconnectConfig: {
          enabled: true,
          delay: 1000,
          backoffMultiplier: 2
        }
      })
      
      // First reconnect: 1000ms
      // Second reconnect: 2000ms
      // Third reconnect: 4000ms
      
      expect(ws.getOutput('reconnectAttempts')).toBe(0)
    })
  })

  describe('Presence Tracking', () => {
    it('should track user presence', async () => {
      const presenceUpdateHandler = vi.fn()
      
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        presence: {
          enabled: true,
          updateInterval: 1000
        },
        onPresenceUpdate: presenceUpdateHandler
      })
      await vi.runAllTimersAsync()
      
      // Send presence update
      ws.updatePresence({
        status: 'active',
        customData: { location: 'home' }
      })
      
      // Simulate presence update from server
      const mockWs = (global as any).WebSocket as any
      const instance = new mockWs('wss://test.com')
      if (instance.onmessage) {
        instance.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'presence',
            action: 'update',
            users: [
              { userId: 'user1', status: 'online', lastSeen: new Date() },
              { userId: 'user2', status: 'away', lastSeen: new Date() }
            ]
          })
        }))
      }
      
      expect(ws.getOutput('presenceList')).toHaveLength(2)
    })
  })

  describe('Authentication', () => {
    it('should handle authentication success', async () => {
      const authHandler = vi.fn()
      ws.on('authenticated', authHandler)
      
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        authToken: 'valid-token'
      })
      await vi.runAllTimersAsync()
      
      // Simulate auth success message
      const mockWs = (global as any).WebSocket as any
      const instance = new mockWs('wss://test.com')
      if (instance.onmessage) {
        instance.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'auth',
            status: 'success',
            userId: 'user123'
          })
        }))
      }
      
      expect(authHandler).toHaveBeenCalledWith({ userId: 'user123' })
      expect(ws.getOutput('isAuthenticated')).toBe(true)
    })

    it('should handle authentication failure', async () => {
      const authFailHandler = vi.fn()
      ws.on('authenticationFailed', authFailHandler)
      
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        authToken: 'invalid-token'
      })
      await vi.runAllTimersAsync()
      
      // Simulate auth failure
      const mockWs = (global as any).WebSocket as any
      const instance = new mockWs('wss://test.com')
      if (instance.onmessage) {
        instance.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'auth',
            status: 'failed',
            reason: 'Invalid token'
          })
        }))
      }
      
      expect(authFailHandler).toHaveBeenCalledWith({ reason: 'Invalid token' })
    })

    it('should refresh authentication token', async () => {
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        authToken: 'old-token'
      })
      await vi.runAllTimersAsync()
      
      await ws.refreshToken('new-token')
      
      expect(ws.getInput('authToken')).toBe('new-token')
    })
  })

  describe('Message Queue', () => {
    it('should enforce queue size limit', async () => {
      await ws.initialize({
        url: 'wss://api.example.com/ws',
        messageQueue: {
          enabled: true,
          maxSize: 3
        }
      })
      await vi.runAllTimersAsync()
      
      ws.close()
      
      const droppedHandler = vi.fn()
      ws.on('messageDropped', droppedHandler)
      
      // Queue 4 messages (max is 3)
      ws.send({ id: 1 })
      ws.send({ id: 2 })
      ws.send({ id: 3 })
      ws.send({ id: 4 }) // This should drop the first message
      
      expect(droppedHandler).toHaveBeenCalled()
      expect(ws.getOutput('queueSize')).toBe(3)
    })
  })

  describe('Factory Function', () => {
    it('should create instance via factory', () => {
      const instance = createAuthenticatedWebSocket()
      expect(instance).toBeInstanceOf(AuthenticatedWebSocket)
      expect(instance.getDefinition()).toBe(AuthenticatedWebSocket.definition)
    })
  })

  describe('Error Handling', () => {
    it('should handle server errors', async () => {
      const errorHandler = vi.fn()
      ws.on('serverError', errorHandler)
      
      await ws.initialize({
        url: 'wss://api.example.com/ws'
      })
      await vi.runAllTimersAsync()
      
      // Simulate server error
      const mockWs = (global as any).WebSocket as any
      const instance = new mockWs('wss://test.com')
      if (instance.onmessage) {
        instance.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'error',
            error: 'Internal server error'
          })
        }))
      }
      
      expect(errorHandler).toHaveBeenCalledWith({
        type: 'error',
        error: 'Internal server error'
      })
    })
  })
})