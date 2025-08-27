import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MCPClientPattern, MCPClientPatternLogic } from '../MCPClientPattern'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number = 0
  onopen?: () => void
  onclose?: () => void
  onerror?: (error: any) => void
  onmessage?: (event: MessageEvent) => void
  
  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.()
    }, 10)
  }
  
  send(data: string) {
    // Simulate response
    setTimeout(() => {
      const request = JSON.parse(data)
      this.onmessage?.({
        data: JSON.stringify({
          id: request.id,
          result: { echo: request.params, timestamp: Date.now() }
        })
      } as MessageEvent)
    }, 50)
  }
  
  close() {
    this.readyState = 3
    this.onclose?.()
  }
}

// @ts-expect-error: Assigning to global for testing
global.WebSocket = MockWebSocket

describe('MCPClientPattern', () => {
  let pattern: MCPClientPatternLogic
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (pattern) {
      await pattern.cleanup()
    }
  })
  
  describe('MCPClientPatternLogic', () => {
    it('should initialize with correct configuration', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true
      })
      
      await pattern.initialize()
      
      const status = pattern.getConnectionStatus()
      expect(status).toBeDefined()
      expect(status.protocol).toBe('websocket')
    })
    
    it('should handle WebSocket connection', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: false,
        enableReconnection: false,
        enableCaching: false
      })
      
      await pattern.initialize()
      await waitFor(() => {
        const status = pattern.getConnectionStatus()
        expect(status.connected).toBe(true)
        expect(status.protocol).toBe('websocket')
      })
    })
    
    it('should fall back to HTTP when WebSocket fails', async () => {
      // Mock WebSocket failure
      const OriginalWebSocket = global.WebSocket
      // @ts-expect-error: Assigning to global for testing
      global.WebSocket = class {
        constructor() {
          throw new Error('WebSocket not supported')
        }
      }
      
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: false,
        enableCaching: false
      })
      
      await pattern.initialize()
      
      const status = pattern.getConnectionStatus()
      expect(status.connected).toBe(true)
      expect(status.protocol).toBe('http')
      
      // @ts-expect-error: Assigning to global for testing
      global.WebSocket = OriginalWebSocket
    })
    
    it('should handle request with caching', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true,
        cacheOptions: {
          maxSize: 10,
          defaultTTL: 5000
        }
      })
      
      await pattern.initialize()
      await waitFor(() => {
        expect(pattern.getConnectionStatus().connected).toBe(true)
      })
      
      // First request - should hit server
      const result1 = await pattern.request('test.method', { data: 'test' })
      expect(result1).toBeDefined()
      
      let cacheStats = pattern.getCacheStats()
      expect(cacheStats.size).toBe(1)
      expect(cacheStats.hits).toBe(0)
      
      // Second request - should hit cache
      const result2 = await pattern.request('test.method', { data: 'test' })
      expect(result2).toEqual(result1)
      
      cacheStats = pattern.getCacheStats()
      expect(cacheStats.hits).toBe(1)
    })
    
    it('should handle priority queuing', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: false
      })
      
      await pattern.initialize()
      await waitFor(() => {
        expect(pattern.getConnectionStatus().connected).toBe(true)
      })
      
      const results: number[] = []
      
      // Send requests with different priorities
      const promises = [
        pattern.request('test.low', { priority: 1 }, { priority: 1 })
          .then(() => results.push(1)),
        pattern.request('test.high', { priority: 3 }, { priority: 3 })
          .then(() => results.push(3)),
        pattern.request('test.medium', { priority: 2 }, { priority: 2 })
          .then(() => results.push(2))
      ]
      
      await Promise.all(promises)
      
      // High priority should complete first
      expect(results[0]).toBe(3)
    })
    
    it('should handle reconnection with exponential backoff', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: false,
        enableReconnection: true,
        enableCaching: false,
        reconnectOptions: {
          maxAttempts: 3,
          initialDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2
        }
      })
      
      await pattern.initialize()
      await waitFor(() => {
        expect(pattern.getConnectionStatus().connected).toBe(true)
      })
      
      // Force disconnection
      // @ts-expect-error: Assigning to global for testing - access private property for testing
      pattern.websocket?.close()
      
      await waitFor(() => {
        const status = pattern.getConnectionStatus()
        expect(status.connected).toBe(false)
        expect(status.reconnectAttempts).toBeGreaterThan(0)
      })
    })
    
    it('should track metrics correctly', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true
      })
      
      await pattern.initialize()
      await waitFor(() => {
        expect(pattern.getConnectionStatus().connected).toBe(true)
      })
      
      // Make several requests
      await pattern.request('test.1', { data: 'test1' })
      await pattern.request('test.2', { data: 'test2' })
      await pattern.request('test.1', { data: 'test1' }) // Cache hit
      
      const metrics = pattern.getMetrics()
      expect(metrics.totalRequests).toBe(3)
      expect(metrics.successfulRequests).toBe(3)
      expect(metrics.cachedResponses).toBe(1)
      expect(metrics.averageLatency).toBeGreaterThan(0)
    })
    
    it('should clear cache correctly', async () => {
      pattern = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true
      })
      
      await pattern.initialize()
      await waitFor(() => {
        expect(pattern.getConnectionStatus().connected).toBe(true)
      })
      
      // Add items to cache
      await pattern.request('test.1', { data: 'test1' })
      await pattern.request('test.2', { data: 'test2' })
      
      let cacheStats = pattern.getCacheStats()
      expect(cacheStats.size).toBe(2)
      
      // Clear cache
      pattern.clearCache()
      
      cacheStats = pattern.getCacheStats()
      expect(cacheStats.size).toBe(0)
    })
  })
  
  describe('MCPClientPattern Component', () => {
    it('should render correctly', () => {
      render(
        <MCPClientPattern
          config={{
            serverUrl: 'http://localhost:8080',
            enableWebSocket: true,
            enableHttpFallback: true,
            enableReconnection: true,
            enableCaching: true
          }}
        />
      )
      
      expect(screen.getByText('MCP Client')).toBeInTheDocument()
      expect(screen.getByText('http://localhost:8080')).toBeInTheDocument()
    })
    
    it('should display connection status', async () => {
      render(
        <MCPClientPattern
          config={{
            serverUrl: 'http://localhost:8080',
            enableWebSocket: true,
            enableHttpFallback: true,
            enableReconnection: true,
            enableCaching: true
          }}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Connected (websocket)')).toBeInTheDocument()
      })
    })
    
    it('should handle test request', async () => {
      const onRequest = vi.fn()
      
      render(
        <MCPClientPattern
          config={{
            serverUrl: 'http://localhost:8080',
            enableWebSocket: true,
            enableHttpFallback: true,
            enableReconnection: true,
            enableCaching: true
          }}
          onRequest={onRequest}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Send Test Request')).toBeEnabled()
      })
      
      fireEvent.click(screen.getByText('Send Test Request'))
      
      await waitFor(() => {
        expect(onRequest).toHaveBeenCalledWith('test.echo', expect.any(Object))
      })
    })
    
    it('should display metrics', async () => {
      render(
        <MCPClientPattern
          config={{
            serverUrl: 'http://localhost:8080',
            enableWebSocket: true,
            enableHttpFallback: true,
            enableReconnection: true,
            enableCaching: true
          }}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Request Metrics')).toBeInTheDocument()
        expect(screen.getByText('Cache Statistics')).toBeInTheDocument()
      })
    })
    
    it('should handle cache clear', async () => {
      render(
        <MCPClientPattern
          config={{
            serverUrl: 'http://localhost:8080',
            enableWebSocket: true,
            enableHttpFallback: true,
            enableReconnection: true,
            enableCaching: true
          }}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Clear Cache')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Clear Cache'))
      
      // Cache should be cleared (reflected in stats)
      await waitFor(() => {
        const cacheSize = screen.getByText('Cache Size').parentElement?.querySelector('.text-2xl')
        expect(cacheSize?.textContent).toBe('0')
      })
    })
    
    it('should trigger connection change callback', async () => {
      const onConnectionChange = vi.fn()
      
      render(
        <MCPClientPattern
          config={{
            serverUrl: 'http://localhost:8080',
            enableWebSocket: true,
            enableHttpFallback: true,
            enableReconnection: true,
            enableCaching: true
          }}
          onConnectionChange={onConnectionChange}
        />
      )
      
      await waitFor(() => {
        expect(onConnectionChange).toHaveBeenCalledWith(
          expect.objectContaining({
            connected: true,
            protocol: 'websocket'
          })
        )
      })
    })
  })
})