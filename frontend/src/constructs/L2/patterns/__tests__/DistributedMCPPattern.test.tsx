import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DistributedMCPPattern, DistributedMCPPatternLogic } from '../DistributedMCPPattern'
import type { ServiceNode, DistributedMCPConfig } from '../DistributedMCPPattern'

describe('DistributedMCPPattern', () => {
  let pattern: DistributedMCPPatternLogic
  
  const createStaticConfig = (overrides?: Partial<DistributedMCPConfig>): DistributedMCPConfig => ({
    clusterName: 'test-cluster',
    discoveryMethod: 'static',
    discoveryConfig: {
      staticNodes: [
        {
          id: 'node-1',
          url: 'http://localhost:8081',
          health: 'healthy',
          lastHealthCheck: new Date(),
          connections: 0,
          weight: 1,
          metadata: {
            version: '1.0.0',
            region: 'us-east-1',
            capabilities: ['tool-a', 'tool-b']
          }
        },
        {
          id: 'node-2',
          url: 'http://localhost:8082',
          health: 'healthy',
          lastHealthCheck: new Date(),
          connections: 0,
          weight: 1,
          metadata: {
            version: '1.0.0',
            region: 'us-west-2',
            capabilities: ['tool-a', 'tool-c']
          }
        }
      ]
    },
    loadBalancingStrategy: 'round-robin',
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 3,
      resetTimeout: 5000,
      halfOpenRequests: 1
    },
    stateManagementConfig: {
      provider: 'memory'
    },
    healthCheckConfig: {
      interval: 1000,
      timeout: 500,
      unhealthyThreshold: 2,
      healthyThreshold: 1
    },
    ...overrides
  })
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (pattern) {
      await pattern.cleanup()
    }
  })
  
  describe('DistributedMCPPatternLogic', () => {
    it('should initialize with static nodes', async () => {
      const config = createStaticConfig()
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      const nodes = pattern.getServiceNodes()
      expect(nodes).toHaveLength(2)
      expect(nodes[0].id).toBe('node-1')
      expect(nodes[1].id).toBe('node-2')
    })
    
    it('should handle round-robin load balancing', async () => {
      const config = createStaticConfig({
        loadBalancingStrategy: 'round-robin'
      })
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Mock execute method to track which node is selected
      const executedNodes: string[] = []
      // @ts-expect-error: Accessing private method for testing
      pattern.executeOnNode = vi.fn(async (node) => {
        executedNodes.push(node.id)
        return { success: true }
      })
      
      // Make multiple requests
      await pattern.route('test.method', { data: 'test1' })
      await pattern.route('test.method', { data: 'test2' })
      await pattern.route('test.method', { data: 'test3' })
      await pattern.route('test.method', { data: 'test4' })
      
      // Should alternate between nodes
      expect(executedNodes).toEqual(['node-1', 'node-2', 'node-1', 'node-2'])
    })
    
    it('should handle least-connections load balancing', async () => {
      const config = createStaticConfig({
        loadBalancingStrategy: 'least-connections'
      })
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Set different connection counts
      const nodes = pattern.getServiceNodes()
      nodes[0].connections = 5
      nodes[1].connections = 2
      
      // Mock execute method
      let selectedNode: string | undefined
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async (node) => {
        selectedNode = node.id
        return { success: true }
      })
      
      await pattern.route('test.method', { data: 'test' })
      
      // Should select node with fewer connections
      expect(selectedNode).toBe('node-2')
    })
    
    it('should handle weighted load balancing', async () => {
      const config = createStaticConfig({
        loadBalancingStrategy: 'weighted',
        discoveryConfig: {
          staticNodes: [
            {
              id: 'node-1',
              url: 'http://localhost:8081',
              health: 'healthy',
              lastHealthCheck: new Date(),
              connections: 0,
              weight: 3, // Higher weight
              metadata: {
                version: '1.0.0',
                region: 'us-east-1',
                capabilities: []
              }
            },
            {
              id: 'node-2',
              url: 'http://localhost:8082',
              health: 'healthy',
              lastHealthCheck: new Date(),
              connections: 0,
              weight: 1, // Lower weight
              metadata: {
                version: '1.0.0',
                region: 'us-west-2',
                capabilities: []
              }
            }
          ]
        }
      })
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Track selections
      const selections: Record<string, number> = { 'node-1': 0, 'node-2': 0 }
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async (node) => {
        selections[node.id]++
        return { success: true }
      })
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        await pattern.route('test.method', { data: `test${i}` })
      }
      
      // node-1 should be selected approximately 3x more often
      const ratio = selections['node-1'] / selections['node-2']
      expect(ratio).toBeGreaterThan(2)
      expect(ratio).toBeLessThan(4)
    })
    
    it('should handle sticky sessions', async () => {
      const config = createStaticConfig({
        loadBalancingStrategy: 'sticky'
      })
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Track selections
      const selections: string[] = []
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async (node) => {
        selections.push(node.id)
        return { success: true }
      })
      
      // Make requests with same session ID
      const sessionId = 'user-session-123'
      await pattern.route('test.method', { data: 'test1' }, { sessionId })
      await pattern.route('test.method', { data: 'test2' }, { sessionId })
      await pattern.route('test.method', { data: 'test3' }, { sessionId })
      
      // All requests should go to the same node
      expect(selections[0]).toBe(selections[1])
      expect(selections[0]).toBe(selections[2])
    })
    
    it('should handle circuit breaker', async () => {
      const config = createStaticConfig({
        circuitBreakerConfig: {
          enabled: true,
          failureThreshold: 2,
          resetTimeout: 1000,
          halfOpenRequests: 1
        }
      })
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Mock executeOnNode to fail for node-1
      let attempts = 0
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async (node) => {
        if (node.id === 'node-1') {
          attempts++
          throw new Error('Node failure')
        }
        return { success: true }
      })
      
      // First request - should fail and try node-2
      await pattern.route('test.method', { data: 'test1' })
      
      // Second request - should fail again and open circuit
      await pattern.route('test.method', { data: 'test2' })
      
      const breakers = pattern.getCircuitBreakers()
      const node1Breaker = breakers.find(b => b.nodeId === 'node-1')
      expect(node1Breaker?.state).toBe('open')
      
      // Further requests should skip node-1
      attempts = 0
      await pattern.route('test.method', { data: 'test3' })
      expect(attempts).toBe(0) // Should not attempt node-1
    })
    
    it('should handle distributed state management', async () => {
      const config = createStaticConfig()
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Test session management
      const sessionData = { userId: '123', preferences: { theme: 'dark' } }
      await pattern.setSession('session-1', sessionData)
      
      const retrieved = await pattern.getSession('session-1')
      expect(retrieved).toEqual(sessionData)
      
      // Test distributed locks
      const acquired = await pattern.acquireLock('resource-1', 'owner-1', 5000)
      expect(acquired).toBe(true)
      
      // Second acquire should fail
      const acquired2 = await pattern.acquireLock('resource-1', 'owner-2', 5000)
      expect(acquired2).toBe(false)
      
      // Release lock
      const released = await pattern.releaseLock('resource-1', 'owner-1')
      expect(released).toBe(true)
      
      // Now second owner can acquire
      const acquired3 = await pattern.acquireLock('resource-1', 'owner-2', 5000)
      expect(acquired3).toBe(true)
    })
    
    it('should handle shared data', async () => {
      const config = createStaticConfig()
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      const sharedData = { config: { feature: 'enabled' }, version: 2 }
      await pattern.setSharedData('app-config', sharedData)
      
      const retrieved = await pattern.getSharedData('app-config')
      expect(retrieved).toEqual(sharedData)
    })
    
    it('should track cluster metrics', async () => {
      const config = createStaticConfig()
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Mock executeOnNode
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async () => ({ success: true }))
      
      // Make some successful requests
      await pattern.route('test.method', { data: 'test1' })
      await pattern.route('test.method', { data: 'test2' })
      
      // Make a failing request
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async () => {
        throw new Error('Request failed')
      })
      
      try {
        await pattern.route('test.method', { data: 'test3' })
      } catch (e) {
        // Expected to fail
      }
      
      const metrics = pattern.getClusterMetrics()
      expect(metrics.totalNodes).toBe(2)
      expect(metrics.healthyNodes).toBe(2)
      expect(metrics.totalRequests).toBe(3)
      expect(metrics.successfulRequests).toBe(2)
      expect(metrics.failedRequests).toBeGreaterThan(0)
    })
    
    it('should handle routing rules', async () => {
      const config = createStaticConfig({
        routingRules: [
          {
            pattern: '^admin.',
            targets: ['node-1']
          },
          {
            pattern: '^user.',
            targets: ['node-2']
          }
        ]
      })
      pattern = new DistributedMCPPatternLogic(config)
      
      await pattern.initialize()
      
      // Track which nodes are selected
      const selections: Record<string, string> = {}
      // @ts-expect-error: Accessing private property for testing
      pattern.executeOnNode = vi.fn(async (node, method) => {
        selections[method] = node.id
        return { success: true }
      })
      
      await pattern.route('admin.getUsers', {})
      await pattern.route('user.getProfile', {})
      await pattern.route('general.method', {})
      
      expect(selections['admin.getUsers']).toBe('node-1')
      expect(selections['user.getProfile']).toBe('node-2')
      // general.method can go to either node
      expect(['node-1', 'node-2']).toContain(selections['general.method'])
    })
  })
  
  describe('DistributedMCPPattern Component', () => {
    it('should render correctly', () => {
      const config = createStaticConfig()
      
      render(<DistributedMCPPattern config={config} />)
      
      expect(screen.getByText('test-cluster')).toBeInTheDocument()
      expect(screen.getByText('Distributed MCP Cluster')).toBeInTheDocument()
    })
    
    it('should display cluster health', async () => {
      const config = createStaticConfig()
      
      render(<DistributedMCPPattern config={config} />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Nodes')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })
    
    it('should display service nodes', async () => {
      const config = createStaticConfig()
      
      render(<DistributedMCPPattern config={config} />)
      
      await waitFor(() => {
        expect(screen.getByText('node-1')).toBeInTheDocument()
        expect(screen.getByText('node-2')).toBeInTheDocument()
        expect(screen.getByText('Region: us-east-1')).toBeInTheDocument()
        expect(screen.getByText('Region: us-west-2')).toBeInTheDocument()
      })
    })
    
    it('should display performance metrics', async () => {
      const config = createStaticConfig()
      
      render(<DistributedMCPPattern config={config} />)
      
      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
        expect(screen.getByText('Total Requests')).toBeInTheDocument()
        expect(screen.getByText('Success Rate')).toBeInTheDocument()
        expect(screen.getByText('Avg Latency')).toBeInTheDocument()
        expect(screen.getByText('Throughput')).toBeInTheDocument()
      })
    })
    
    it('should display circuit breakers', async () => {
      const config = createStaticConfig()
      
      render(<DistributedMCPPattern config={config} />)
      
      await waitFor(() => {
        expect(screen.getByText('Circuit Breakers')).toBeInTheDocument()
        const node1Elements = screen.getAllByText('node-1')
        const node2Elements = screen.getAllByText('node-2')
        expect(node1Elements.length).toBeGreaterThan(0)
        expect(node2Elements.length).toBeGreaterThan(0)
      })
    })
    
    it('should trigger callbacks', async () => {
      const config = createStaticConfig()
      const onNodeChange = vi.fn()
      const onMetricsUpdate = vi.fn()
      
      render(
        <DistributedMCPPattern 
          config={config}
          onNodeChange={onNodeChange}
          onMetricsUpdate={onMetricsUpdate}
        />
      )
      
      await waitFor(() => {
        expect(onNodeChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'node-1' }),
            expect.objectContaining({ id: 'node-2' })
          ])
        )
        expect(onMetricsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            totalNodes: 2,
            healthyNodes: 2
          })
        )
      })
    })
    
    it('should handle test route action', async () => {
      const config = createStaticConfig()
      
      render(<DistributedMCPPattern config={config} />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Route Request')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Test Route Request'))
      
      // Should execute without errors
      await waitFor(() => {
        // Check that metrics are updated after request
        const totalRequests = screen.getByText('Total Requests').parentElement?.querySelector('.text-2xl')
        expect(totalRequests).toBeTruthy()
      })
    })
  })
})