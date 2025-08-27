/**
 * EncryptedWebSocket Test Suite
 * 
 * Tests for the L1 Encrypted WebSocket construct with TLS and message encryption
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { EncryptedWebSocket, EncryptedWebSocketComponent, encryptedWebSocketDefinition } from '../EncryptedWebSocket'
import { ConstructValidator } from '../../../../services/validation/ConstructValidator'
import { ConstructLevel } from '../../../types'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  
  readyState: number = MockWebSocket.CONNECTING
  url: string
  protocols?: string[]
  binaryType: 'blob' | 'arraybuffer' = 'blob'
  
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  
  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = Array.isArray(protocols) ? protocols : protocols ? [protocols] : undefined
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }
  
  send(data: string | ArrayBuffer | Blob): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
    
    // Simulate echo
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }))
      }
    }, 50)
  }
  
  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { code, reason }))
      }
    }, 50)
  }
}

// Mock crypto
const mockCrypto = {
  subtle: {
    generateKey: jest.fn().mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 }
    }),
    encrypt: jest.fn().mockImplementation(async (algorithm, key, data) => {
      // Simple mock encryption - just return the data with a prefix
      const prefix = new Uint8Array([1, 2, 3, 4])
      const dataArray = new Uint8Array(data)
      const result = new Uint8Array(prefix.length + dataArray.length)
      result.set(prefix, 0)
      result.set(dataArray, prefix.length)
      return result.buffer
    }),
    decrypt: jest.fn().mockImplementation(async (algorithm, key, data) => {
      // Simple mock decryption - remove the prefix
      const dataArray = new Uint8Array(data)
      return dataArray.slice(4).buffer
    }),
    digest: jest.fn().mockImplementation(async (algorithm, data) => {
      // Simple mock hash
      return new ArrayBuffer(32)
    })
  },
  getRandomValues: jest.fn().mockImplementation((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  })
}

// Replace global WebSocket and crypto
const originalWebSocket = global.WebSocket
const originalCrypto = global.crypto

beforeAll(() => {
  global.WebSocket = MockWebSocket as any
  global.crypto = mockCrypto as any
})

afterAll(() => {
  global.WebSocket = originalWebSocket
  global.crypto = originalCrypto
})

describe('EncryptedWebSocket Construct', () => {
  let encryptedWs: EncryptedWebSocket
  
  beforeEach(() => {
    jest.clearAllMocks()
    encryptedWs = new EncryptedWebSocket({
      url: 'wss://secure-server.example.com',
      tlsConfig: {
        minVersion: 'TLSv1.3',
        cipherSuites: ['TLS_AES_256_GCM_SHA384']
      }
    })
  })
  
  afterEach(async () => {
    await encryptedWs.onDestroy()
  })
  
  describe('Definition Validation', () => {
    it('should have valid construct definition', () => {
      const result = ConstructValidator.validate(
        encryptedWebSocketDefinition,
        ConstructLevel.L1
      )
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should be L1 level construct', () => {
      expect(encryptedWebSocketDefinition.level).toBe(ConstructLevel.L1)
    })
    
    it('should have required dependencies', () => {
      expect(encryptedWebSocketDefinition.dependencies).toBeDefined()
      expect(encryptedWebSocketDefinition.dependencies?.length).toBeGreaterThan(0)
      
      const websocketDep = encryptedWebSocketDefinition.dependencies?.find(
        d => d.constructId === 'platform-l0-websocket-primitive'
      )
      expect(websocketDep).toBeDefined()
      expect(websocketDep?.level).toBe(ConstructLevel.L0)
    })
  })
  
  describe('Connection Management', () => {
    it('should require wss:// protocol', async () => {
      const httpWs = new EncryptedWebSocket({
        url: 'ws://insecure-server.example.com'
      })
      
      const isValid = await httpWs.onValidate()
      expect(isValid).toBe(false)
    })
    
    it('should establish secure connection', async () => {
      const tlsHandshakeHandler = jest.fn()
      encryptedWs.on('tlsHandshakeComplete', tlsHandshakeHandler)
      
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      
      await waitFor(() => {
        expect(tlsHandshakeHandler).toHaveBeenCalled()
        expect(tlsHandshakeHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            version: 'TLS 1.3',
            cipher: 'TLS_AES_256_GCM_SHA384'
          })
        )
      })
    })
    
    it('should handle disconnection gracefully', async () => {
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      
      await waitFor(() => {
        expect(encryptedWs['ws']).toBeTruthy()
      })
      
      await encryptedWs.disconnect()
      
      await waitFor(() => {
        expect(encryptedWs['ws']?.readyState).toBe(MockWebSocket.CLOSED)
      })
    })
  })
  
  describe('Message Encryption', () => {
    beforeEach(async () => {
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      await waitFor(() => {
        expect(encryptedWs['ws']?.readyState).toBe(MockWebSocket.OPEN)
      })
    })
    
    it('should encrypt outgoing messages', async () => {
      const testData = { message: 'Hello, secure world!' }
      
      await encryptedWs.sendEncrypted(testData)
      
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled()
      expect(mockCrypto.subtle.digest).toHaveBeenCalled() // For HMAC
    })
    
    it('should decrypt incoming messages', async () => {
      const messageHandler = jest.fn()
      encryptedWs.on('encryptedMessageReceived', messageHandler)
      
      // Simulate encrypted message
      const encryptedData = await mockCrypto.subtle.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) },
        {},
        new TextEncoder().encode(JSON.stringify({ test: 'data' }))
      )
      
      const message = {
        id: 'test-123',
        timestamp: Date.now(),
        sequence: 1,
        encrypted: encryptedData,
        hmac: 'mock-hmac'
      }
      
      // Mock HMAC verification
      encryptedWs['verifyHMAC'] = jest.fn().mockResolvedValue(true)
      
      await encryptedWs['handleEncryptedMessage'](JSON.stringify(message))
      
      await waitFor(() => {
        expect(messageHandler).toHaveBeenCalled()
        expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
      })
    })
    
    it('should include message integrity check', async () => {
      const testData = { important: 'data' }
      
      await encryptedWs.sendEncrypted(testData)
      
      // Verify HMAC was generated
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer))
    })
  })
  
  describe('Security Features', () => {
    beforeEach(async () => {
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      await waitFor(() => {
        expect(encryptedWs['ws']?.readyState).toBe(MockWebSocket.OPEN)
      })
    })
    
    it('should detect replay attacks', async () => {
      const alertHandler = jest.fn()
      encryptedWs.on('securityAlert', alertHandler)
      
      // Create old message
      const oldMessage = {
        id: 'old-123',
        timestamp: Date.now() - 600000, // 10 minutes old
        sequence: 1,
        encrypted: new ArrayBuffer(0),
        hmac: 'mock-hmac'
      }
      
      encryptedWs['verifyHMAC'] = jest.fn().mockResolvedValue(true)
      
      await encryptedWs['handleEncryptedMessage'](JSON.stringify(oldMessage))
      
      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'replay-attack',
          severity: 'critical'
        })
      )
    })
    
    it('should rotate keys periodically', async () => {
      const keyRotationHandler = jest.fn()
      encryptedWs.on('keyRotation', keyRotationHandler)
      
      const initialSessionId = encryptedWs['sessionId']
      
      await encryptedWs.rotateKeys(true)
      
      await waitFor(() => {
        expect(keyRotationHandler).toHaveBeenCalled()
        expect(encryptedWs['sessionId']).not.toBe(initialSessionId)
        expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'AES-GCM',
            length: 256
          }),
          true,
          expect.any(Array)
        )
      })
    })
    
    it('should provide security status', async () => {
      const status = await encryptedWs.getSecurityStatus()
      
      expect(status).toMatchObject({
        isSecure: true,
        tlsVersion: 'TLS 1.3',
        cipherSuite: 'TLS_AES_256_GCM_SHA384',
        keyExchangeMethod: 'ECDHE-P256',
        encryptionStrength: 256,
        sessionId: expect.any(String)
      })
    })
  })
  
  describe('Error Handling', () => {
    it('should handle encryption errors', async () => {
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      
      const alertHandler = jest.fn()
      encryptedWs.on('securityAlert', alertHandler)
      
      // Force encryption error
      mockCrypto.subtle.encrypt.mockRejectedValueOnce(new Error('Encryption failed'))
      
      await expect(encryptedWs.sendEncrypted({ test: 'data' })).rejects.toThrow()
      
      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'encryption-error',
          severity: 'high'
        })
      )
      
      expect(encryptedWs.getMetrics().encryptionErrors).toBe(1)
    })
    
    it('should handle decryption errors', async () => {
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      
      // Force decryption error
      mockCrypto.subtle.decrypt.mockRejectedValueOnce(new Error('Decryption failed'))
      
      const message = {
        id: 'test-123',
        timestamp: Date.now(),
        sequence: 1,
        encrypted: new ArrayBuffer(16),
        hmac: 'mock-hmac'
      }
      
      encryptedWs['verifyHMAC'] = jest.fn().mockResolvedValue(true)
      
      await encryptedWs['handleEncryptedMessage'](JSON.stringify(message))
      
      expect(encryptedWs.getMetrics().decryptionErrors).toBe(1)
    })
  })
  
  describe('Performance Metrics', () => {
    it('should track encryption metrics', async () => {
      await encryptedWs.onInitialize()
      await encryptedWs.connect()
      
      await waitFor(() => {
        expect(encryptedWs['ws']?.readyState).toBe(MockWebSocket.OPEN)
      })
      
      const metricsHandler = jest.fn()
      encryptedWs.on('encryptionMetricsUpdate', metricsHandler)
      
      // Send multiple messages
      for (let i = 0; i < 5; i++) {
        await encryptedWs.sendEncrypted({ index: i })
      }
      
      const metrics = encryptedWs.getMetrics()
      expect(metrics.messagesEncrypted).toBe(5)
      expect(metrics.averageEncryptTime).toBeGreaterThan(0)
      expect(metricsHandler).toHaveBeenCalled()
    })
  })
})

describe('EncryptedWebSocketComponent', () => {
  it('should render without errors', () => {
    render(
      <EncryptedWebSocketComponent
        instance={new EncryptedWebSocket({})}
        onInteraction={jest.fn()}
      />
    )
    
    expect(screen.getByText('Encrypted WebSocket')).toBeInTheDocument()
    expect(screen.getByText('TLS 1.3 + AES-256-GCM Encryption')).toBeInTheDocument()
  })
  
  it('should show connection status', async () => {
    render(
      <EncryptedWebSocketComponent
        instance={new EncryptedWebSocket({})}
        onInteraction={jest.fn()}
      />
    )
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    
    const connectButton = screen.getByText('Connect Securely')
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Secure Connection/)).toBeInTheDocument()
    })
  })
  
  it('should display encryption metrics when connected', async () => {
    const { container } = render(
      <EncryptedWebSocketComponent
        instance={new EncryptedWebSocket({})}
        onInteraction={jest.fn()}
      />
    )
    
    const connectButton = screen.getByText('Connect Securely')
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(screen.getByText('Messages Encrypted')).toBeInTheDocument()
      expect(screen.getByText('Messages Decrypted')).toBeInTheDocument()
      expect(screen.getByText('Key Rotations')).toBeInTheDocument()
      expect(screen.getByText('Crypto Errors')).toBeInTheDocument()
    })
  })
  
  it('should handle key rotation', async () => {
    const onInteraction = jest.fn()
    render(
      <EncryptedWebSocketComponent
        instance={new EncryptedWebSocket({})}
        onInteraction={onInteraction}
      />
    )
    
    // Connect first
    const connectButton = screen.getByText('Connect Securely')
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Secure Connection/)).toBeInTheDocument()
    })
    
    // Find and click rotate button
    const rotateButton = screen.getByTitle('Rotate keys manually')
    fireEvent.click(rotateButton)
    
    expect(onInteraction).toHaveBeenCalledWith('rotateKeys', { immediate: true })
  })
  
  it('should toggle security details', async () => {
    render(
      <EncryptedWebSocketComponent
        instance={new EncryptedWebSocket({})}
        onInteraction={jest.fn()}
      />
    )
    
    // Connect first
    const connectButton = screen.getByText('Connect Securely')
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Secure Connection/)).toBeInTheDocument()
    })
    
    // Toggle details
    const detailsButton = screen.getByText('Show Security Details')
    fireEvent.click(detailsButton)
    
    await waitFor(() => {
      expect(screen.getByText('Session ID')).toBeInTheDocument()
      expect(screen.getByText('Encryption Strength')).toBeInTheDocument()
      expect(screen.getByText('Key Exchange')).toBeInTheDocument()
      expect(screen.getByText('Perfect Forward Secrecy')).toBeInTheDocument()
    })
  })
  
  it('should display encryption features', () => {
    render(
      <EncryptedWebSocketComponent
        instance={new EncryptedWebSocket({})}
        onInteraction={jest.fn()}
      />
    )
    
    expect(screen.getByText('Encryption Features')).toBeInTheDocument()
    expect(screen.getByText(/TLS 1.3 Enforcement/)).toBeInTheDocument()
    expect(screen.getByText(/AES-256-GCM Encryption/)).toBeInTheDocument()
    expect(screen.getByText(/ECDHE Key Exchange/)).toBeInTheDocument()
    expect(screen.getByText(/Perfect Forward Secrecy/)).toBeInTheDocument()
    expect(screen.getByText(/Message Integrity \(HMAC\)/)).toBeInTheDocument()
    expect(screen.getByText(/Replay Attack Protection/)).toBeInTheDocument()
  })
})