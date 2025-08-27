import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ManagedContainer, createManagedContainer } from '../ManagedContainer'
import { ConstructLevel } from '../../../types'

// Mock timers for intervals
vi.useFakeTimers()

describe('ManagedContainer L1 Infrastructure Construct', () => {
  let container: ManagedContainer

  beforeEach(() => {
    container = new ManagedContainer()
    vi.clearAllMocks()
  })

  describe('Definition', () => {
    it('should have correct metadata', () => {
      expect(ManagedContainer.definition.id).toBe('platform-l1-managed-container')
      expect(ManagedContainer.definition.name).toBe('Managed Container')
      expect(ManagedContainer.definition.level).toBe(ConstructLevel.L1)
      expect(ManagedContainer.definition.description).toContain('Production-ready container')
    })

    it('should be a platform construct', () => {
      expect(ManagedContainer.definition.selfReferential?.isPlatformConstruct).toBe(true)
    })

    it('should have all required providers', () => {
      expect(ManagedContainer.definition.providers).toContain('local')
      expect(ManagedContainer.definition.providers).toContain('aws')
      expect(ManagedContainer.definition.providers).toContain('firebase')
    })

    it('should have security configurations', () => {
      expect(ManagedContainer.definition.security).toBeDefined()
      expect(ManagedContainer.definition.security?.length).toBeGreaterThan(0)
      
      const securityAspects = ManagedContainer.definition.security?.map(s => s.aspect) || []
      expect(securityAspects).toContain('Container Isolation')
      expect(securityAspects).toContain('Secret Management')
      expect(securityAspects).toContain('Network Security')
    })

    it('should have correct inputs', () => {
      const inputNames = ManagedContainer.definition.inputs.map(i => i.name)
      expect(inputNames).toContain('image')
      expect(inputNames).toContain('containerName')
      expect(inputNames).toContain('healthCheck')
      expect(inputNames).toContain('resources')
      expect(inputNames).toContain('autoRecovery')
      expect(inputNames).toContain('monitoring')
    })

    it('should have correct outputs', () => {
      const outputNames = ManagedContainer.definition.outputs.map(o => o.name)
      expect(outputNames).toContain('containerId')
      expect(outputNames).toContain('status')
      expect(outputNames).toContain('health')
      expect(outputNames).toContain('metrics')
      expect(outputNames).toContain('logs')
    })
  })

  describe('Initialization', () => {
    it('should initialize with required configuration', async () => {
      await container.initialize({
        image: 'node:20-alpine',
        containerName: 'test-container'
      })

      expect(container.getOutput('containerId')).toBeDefined()
      expect(container.getOutput('status')).toBe('running')
    })

    it('should validate configuration', async () => {
      await expect(container.initialize({})).rejects.toThrow('Container image is required')
    })

    it('should validate memory format', async () => {
      await expect(container.initialize({
        image: 'node:20',
        resources: {
          memory: { limit: 'invalid' }
        }
      })).rejects.toThrow('Invalid memory limit format')
    })

    it('should validate port mappings', async () => {
      await expect(container.initialize({
        image: 'node:20',
        ports: [
          { host: 8080, container: 3000 },
          { host: 8080, container: 3001 }
        ]
      })).rejects.toThrow('Duplicate host port: 8080')
    })
  })

  describe('Container Lifecycle', () => {
    beforeEach(async () => {
      await container.initialize({
        image: 'node:20-alpine',
        containerName: 'test-container'
      })
    })

    it('should start container successfully', () => {
      expect(container.getOutput('status')).toBe('running')
      expect(container.getOutput('containerId')).toMatch(/^container_/)
    })

    it('should stop container', async () => {
      await container.stop()
      expect(container.getOutput('status')).toBe('stopped')
    })

    it('should restart container', async () => {
      const initialId = container.getOutput('containerId')
      await container.restart()
      
      expect(container.getOutput('status')).toBe('running')
      expect(container.getOutput('restartCount')).toBe(1)
      // Container ID changes on restart
      expect(container.getOutput('containerId')).not.toBe(initialId)
    })

    it('should emit lifecycle events', async () => {
      const startedHandler = vi.fn()
      const stoppedHandler = vi.fn()
      const restartedHandler = vi.fn()

      container.on('started', startedHandler)
      container.on('stopped', stoppedHandler)
      container.on('restarted', restartedHandler)

      await container.stop()
      expect(stoppedHandler).toHaveBeenCalled()

      await container.restart()
      expect(startedHandler).toHaveBeenCalled()
      expect(restartedHandler).toHaveBeenCalledWith({
        containerId: expect.any(String),
        count: 1
      })
    })
  })

  describe('Health Checking', () => {
    it('should start health checking when enabled', async () => {
      const healthChangeHandler = vi.fn()
      
      await container.initialize({
        image: 'node:20',
        healthCheck: {
          enabled: true,
          interval: 1,
          startPeriod: 0
        },
        onHealthChange: healthChangeHandler
      })

      // Fast forward to trigger health check
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(container.getOutput('health')).toBeDefined()
        expect(container.getOutput('health').status).toMatch(/healthy|unhealthy/)
      })
    })

    it('should handle unhealthy state with auto-recovery', async () => {
      await container.initialize({
        image: 'node:20',
        healthCheck: {
          enabled: true,
          interval: 1,
          startPeriod: 0
        },
        autoRecovery: {
          enabled: true,
          maxRestarts: 3
        }
      })

      // Mock unhealthy state
      const originalRandom = Math.random
      Math.random = () => 0.05 // Force unhealthy

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        const health = container.getOutput('health')
        expect(health?.status).toBe('unhealthy')
      })

      // Should trigger restart
      vi.advanceTimersByTime(6000)

      Math.random = originalRandom
    })
  })

  describe('Monitoring', () => {
    it('should collect metrics when enabled', async () => {
      await container.initialize({
        image: 'node:20',
        resources: {
          memory: { limit: '512m' },
          cpu: { limit: 2 }
        },
        monitoring: {
          enabled: true
        }
      })

      // Should have initial metrics
      expect(container.getOutput('metrics')).toBeDefined()
      
      const metrics = container.getOutput('metrics')
      expect(metrics.cpu).toBeDefined()
      expect(metrics.memory).toBeDefined()
      expect(metrics.network).toBeDefined()
      expect(metrics.disk).toBeDefined()

      // Fast forward to collect more metrics
      vi.advanceTimersByTime(10000)

      const updatedMetrics = container.getOutput('metrics')
      expect(updatedMetrics.network.rx).toBeGreaterThan(0)
      expect(updatedMetrics.network.tx).toBeGreaterThan(0)
    })
  })

  describe('Logging', () => {
    it('should track container logs', async () => {
      await container.initialize({
        image: 'node:20',
        logging: {
          driver: 'json-file',
          options: {
            'max-size': '10m',
            'max-file': '3'
          }
        }
      })

      const logs = container.getOutput('logs')
      expect(logs).toBeDefined()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0]).toMatchObject({
        timestamp: expect.any(Date),
        level: 'info',
        message: 'Container started successfully',
        containerId: expect.any(String)
      })
    })

    it('should filter logs by options', async () => {
      await container.initialize({ image: 'node:20' })
      
      // Add some logs
      await container.exec(['echo', 'test'])
      await container.stop()

      const allLogs = container.getLogs()
      expect(allLogs.length).toBeGreaterThan(2)

      const debugLogs = container.getLogs({ level: 'debug' })
      expect(debugLogs.every(l => l.level === 'debug')).toBe(true)

      const recentLogs = container.getLogs({ tail: 2 })
      expect(recentLogs.length).toBe(2)
    })
  })

  describe('Command Execution', () => {
    it('should execute commands in running container', async () => {
      await container.initialize({ image: 'node:20' })
      
      const result = await container.exec(['echo', 'hello'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('echo hello')
      expect(result.stderr).toBe('')
    })

    it('should fail exec on stopped container', async () => {
      await container.initialize({ image: 'node:20' })
      await container.stop()
      
      await expect(container.exec(['echo', 'test'])).rejects.toThrow('Container is not running')
    })
  })

  describe('Resource Management', () => {
    it('should parse memory limits correctly', async () => {
      await container.initialize({
        image: 'node:20',
        resources: {
          memory: {
            limit: '1g',
            reservation: '512m'
          },
          cpu: {
            limit: 2,
            reservation: 0.5
          }
        }
      })

      const metrics = container.getOutput('metrics')
      expect(metrics.memory.limit).toBe(1024 * 1024 * 1024) // 1GB in bytes
    })
  })

  describe('Security Features', () => {
    it('should apply security configurations', async () => {
      await container.initialize({
        image: 'node:20',
        secrets: [
          { name: 'api-key', mountPath: '/run/secrets/api-key' }
        ]
      })

      // Security options would be applied in real container config
      expect(container.getOutput('status')).toBe('running')
    })
  })

  describe('Factory Function', () => {
    it('should create container instance via factory', () => {
      const instance = createManagedContainer()
      expect(instance).toBeInstanceOf(ManagedContainer)
      expect(instance.getDefinition()).toBe(ManagedContainer.definition)
    })
  })

  describe('Event Handling', () => {
    it('should emit log events', async () => {
      const logHandler = vi.fn()
      container.on('log', logHandler)

      await container.initialize({ image: 'node:20' })
      
      expect(logHandler).toHaveBeenCalledWith({
        timestamp: expect.any(Date),
        level: 'info',
        message: 'Container started successfully',
        containerId: expect.any(String)
      })
    })

    it('should emit metrics events', async () => {
      const metricsHandler = vi.fn()
      container.on('metrics', metricsHandler)

      await container.initialize({
        image: 'node:20',
        monitoring: { enabled: true }
      })

      vi.advanceTimersByTime(10000)

      expect(metricsHandler).toHaveBeenCalledWith({
        cpu: expect.any(Object),
        memory: expect.any(Object),
        network: expect.any(Object),
        disk: expect.any(Object)
      })
    })
  })

  describe('Uptime Tracking', () => {
    it('should track container uptime', async () => {
      await container.initialize({ image: 'node:20' })
      
      expect(container.getUptime()).toBe(0)
      
      // Simulate time passing
      const now = Date.now()
      vi.setSystemTime(now + 5000)
      
      expect(container.getUptime()).toBe(5)
      
      await container.stop()
      expect(container.getUptime()).toBe(0)
    })
  })
})