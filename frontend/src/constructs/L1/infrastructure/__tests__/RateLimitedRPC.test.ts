import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RateLimitedRPC } from '../RateLimitedRPC'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent 
} from '../../../../test-utils/constructTestUtils'
import { RateLimitDataFactory } from '../../../../test-utils/testFactories'

// Mock fetch
global.fetch = vi.fn()

describe('RateLimitedRPC', () => {
  let harness: ConstructTestHarness<RateLimitedRPC>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'rate-limited-rpc',
      name: 'Rate Limited RPC',
      level: 'L1',
      category: 'infrastructure'
    })

    const config = RateLimitDataFactory.createConfig({
      windowMs: 1000, // 1 second window for tests
      maxRequests: 3
    })

    harness = new ConstructTestHarness(RateLimitedRPC, metadata, { config })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.clearAllTimers()
  })

  describe('initialization', () => {
    it('should initialize with rate limit config', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      harness.expectEvent('initialized')
    })

    it('should emit rpc:initialized event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'rpc:initialized')
      await harness.initialize()
      
      const event = await promise
      expect(event).toEqual({
        windowMs: 1000,
        maxRequests: 3
      })
    })
  })

  describe('RPC calls', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should make successful RPC call', async () => {
      const mockResponse = { result: 'success', data: { value: 42 } }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '2',
          'X-RateLimit-Reset': String(Date.now() + 1000)
        })
      })

      const result = await harness.construct.call('test-method', { param: 'value' })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            method: 'test-method',
            params: { param: 'value' }
          })
        })
      )

      harness.expectEvent('rpc:success', {
        method: 'test-method',
        duration: expect.any(Number)
      })
    })

    it('should handle RPC errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      })

      await expect(harness.construct.call('failing-method', {}))
        .rejects.toThrow('RPC call failed: 500 Internal Server Error')

      harness.expectEvent('rpc:error', {
        method: 'failing-method',
        error: expect.stringContaining('500')
      })
    })

    it('should parse RPC error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: -32602,
            message: 'Invalid params',
            data: { field: 'username' }
          }
        })
      })

      await expect(harness.construct.call('method', {}))
        .rejects.toThrow('Invalid params')
    })
  })

  describe('rate limiting', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()

      // Mock successful responses
      ;(global.fetch as any).mockImplementation(() => Promise.resolve({
        ok: true,
        json: async () => ({ result: 'success' }),
        headers: new Headers({
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 1000)
        })
      }))
    })

    it('should enforce rate limits', async () => {
      // Make 3 calls (the limit)
      await harness.construct.call('method1', {})
      await harness.construct.call('method2', {})
      await harness.construct.call('method3', {})

      // 4th call should be rate limited
      await expect(harness.construct.call('method4', {}))
        .rejects.toThrow('Rate limit exceeded')

      harness.expectEvent('rpc:rate-limited', {
        method: 'method4',
        retryAfter: expect.any(Number)
      })
    })

    it('should reset rate limit after window', async () => {
      vi.useFakeTimers()

      // Make 3 calls
      await harness.construct.call('method1', {})
      await harness.construct.call('method2', {})
      await harness.construct.call('method3', {})

      // Should be rate limited
      await expect(harness.construct.call('method4', {}))
        .rejects.toThrow('Rate limit exceeded')

      // Advance time past the window
      vi.advanceTimersByTime(1100)

      // Should work now
      await expect(harness.construct.call('method5', {}))
        .resolves.toEqual({ result: 'success' })

      vi.useRealTimers()
    })

    it('should track rate limit status', async () => {
      await harness.construct.call('method1', {})
      
      const status = harness.construct.getRateLimitStatus()
      expect(status).toEqual({
        limit: 3,
        remaining: 2,
        reset: expect.any(Date),
        retryAfter: null
      })

      await harness.construct.call('method2', {})
      await harness.construct.call('method3', {})

      const limitedStatus = harness.construct.getRateLimitStatus()
      expect(limitedStatus.remaining).toBe(0)
    })

    it('should queue requests when rate limited', async () => {
      // Enable queueing
      harness.construct.setQueueing(true)

      // Make calls up to limit
      await harness.construct.call('method1', {})
      await harness.construct.call('method2', {})
      await harness.construct.call('method3', {})

      // Queue the next call
      const queuedPromise = harness.construct.call('method4', {})

      // Check queue status
      expect(harness.construct.getQueueLength()).toBe(1)
      harness.expectEvent('rpc:queued', {
        method: 'method4',
        position: 1
      })

      // Wait for automatic retry
      vi.useFakeTimers()
      vi.advanceTimersByTime(1100)
      vi.useRealTimers()

      await expect(queuedPromise).resolves.toEqual({ result: 'success' })
    })
  })

  describe('authentication', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should include auth token in requests', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'authenticated' }),
        headers: new Headers()
      })

      harness.construct.setAuthToken('bearer-token-123')
      await harness.construct.call('auth-method', {})

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer bearer-token-123'
          })
        })
      )
    })

    it('should handle auth errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      await expect(harness.construct.call('protected-method', {}))
        .rejects.toThrow('RPC call failed: 401 Unauthorized')

      harness.expectEvent('rpc:unauthorized', {
        method: 'protected-method'
      })
    })
  })

  describe('batch calls', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should batch multiple calls', async () => {
      const mockBatchResponse = [
        { id: 1, result: 'result1' },
        { id: 2, result: 'result2' },
        { id: 3, result: 'result3' }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBatchResponse,
        headers: new Headers()
      })

      const batch = harness.construct.createBatch()
      batch.add('method1', { param: 1 })
      batch.add('method2', { param: 2 })
      batch.add('method3', { param: 3 })

      const results = await batch.execute()

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ id: 1, result: 'result1' })
      expect(global.fetch).toHaveBeenCalledTimes(1)

      harness.expectEvent('rpc:batch-success', {
        count: 3,
        duration: expect.any(Number)
      })
    })

    it('should handle partial batch failures', async () => {
      const mockBatchResponse = [
        { id: 1, result: 'result1' },
        { id: 2, error: { code: -32602, message: 'Invalid params' } },
        { id: 3, result: 'result3' }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBatchResponse,
        headers: new Headers()
      })

      const batch = harness.construct.createBatch()
      batch.add('method1', {})
      batch.add('method2', {})
      batch.add('method3', {})

      const results = await batch.execute()

      expect(results[0]).toEqual({ id: 1, result: 'result1' })
      expect(results[1]).toHaveProperty('error')
      expect(results[2]).toEqual({ id: 3, result: 'result3' })

      harness.expectEvent('rpc:batch-partial', {
        total: 3,
        succeeded: 2,
        failed: 1
      })
    })
  })

  describe('retry logic', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should retry failed calls', async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ result: 'success' }),
          headers: new Headers()
        })
      })

      harness.construct.setRetryConfig({
        maxRetries: 3,
        retryDelay: 100,
        retryableErrors: ['Network error']
      })

      const result = await harness.construct.call('retry-method', {})

      expect(result).toEqual({ result: 'success' })
      expect(callCount).toBe(2)
      harness.expectEvent('rpc:retry', {
        method: 'retry-method',
        attempt: 1
      })
    })

    it('should respect max retries', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Persistent error'))

      harness.construct.setRetryConfig({
        maxRetries: 2,
        retryDelay: 10
      })

      await expect(harness.construct.call('failing-method', {}))
        .rejects.toThrow('Persistent error')

      expect(global.fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should apply exponential backoff', async () => {
      vi.useFakeTimers()
      const delays: number[] = []

      ;(global.fetch as any).mockRejectedValue(new Error('Error'))

      harness.construct.setRetryConfig({
        maxRetries: 3,
        retryDelay: 100,
        exponentialBackoff: true
      })

      const originalSetTimeout = global.setTimeout
      global.setTimeout = ((fn: () => void, delay: number) => {
        delays.push(delay)
        return originalSetTimeout(fn, 0)
      }) as any

      try {
        await harness.construct.call('backoff-method', {})
      } catch {
        // Expected to fail - we're testing backoff timing
      }

      expect(delays[0]).toBeCloseTo(100, -1)
      expect(delays[1]).toBeCloseTo(200, -1)
      expect(delays[2]).toBeCloseTo(400, -1)

      vi.useRealTimers()
    })
  })

  describe('monitoring', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should track call metrics', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'success' }),
        headers: new Headers()
      })

      await harness.construct.call('method1', {})
      await harness.construct.call('method2', {})
      await harness.construct.call('method1', {})

      const metrics = harness.construct.getMetrics()

      expect(metrics.totalCalls).toBe(3)
      expect(metrics.successfulCalls).toBe(3)
      expect(metrics.failedCalls).toBe(0)
      expect(metrics.averageLatency).toBeGreaterThan(0)
      expect(metrics.methodStats['method1'].count).toBe(2)
      expect(metrics.methodStats['method2'].count).toBe(1)
    })

    it('should track error rates', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 'success' }),
          headers: new Headers()
        })
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))

      await harness.construct.call('method', {})
      await expect(harness.construct.call('method', {})).rejects.toThrow()
      await expect(harness.construct.call('method', {})).rejects.toThrow()

      const metrics = harness.construct.getMetrics()
      expect(metrics.errorRate).toBeCloseTo(0.67, 2)
      expect(metrics.methodStats['method'].errorRate).toBeCloseTo(0.67, 2)
    })

    it('should reset metrics', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'success' }),
        headers: new Headers()
      })

      await harness.construct.call('method', {})
      harness.construct.resetMetrics()

      const metrics = harness.construct.getMetrics()
      expect(metrics.totalCalls).toBe(0)
      expect(metrics.methodStats).toEqual({})
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate successfully', async () => {
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate rate limit configuration', async () => {
      // Create with invalid config
      const invalidHarness = new ConstructTestHarness(
        RateLimitedRPC,
        metadata,
        { config: { windowMs: -1, maxRequests: 0 } }
      )

      await invalidHarness.initialize()
      const result = await invalidHarness.construct.validate()
      
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('Invalid rate limit configuration')
    })
  })

  describe('disposal', () => {
    it('should clear queues and metrics', async () => {
      await harness.initialize()
      
      // Add some state
      harness.construct.setQueueing(true)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'success' }),
        headers: new Headers()
      })
      await harness.construct.call('method', {})

      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      expect(harness.construct.getQueueLength()).toBe(0)
      harness.expectEvent('disposed')
    })
  })
})