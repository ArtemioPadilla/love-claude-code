/**
 * DeploymentPipeline L2 Pattern Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DeploymentPipeline } from '../DeploymentPipeline'

// Mock the L1 constructs
vi.mock('../../../L1/infrastructure/ManagedContainer', () => ({
  ManagedContainer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue({
      output: 'Command output',
      exitCode: 0
    }),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Container</div>
  }))
}))

vi.mock('../../../L1/infrastructure/RestAPIService', () => ({
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    call: vi.fn().mockResolvedValue({ success: true }),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock API Service</div>
  }))
}))

vi.mock('../../../L1/infrastructure/EncryptedDatabase', () => ({
  EncryptedDatabase: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Database</div>
  }))
}))

vi.mock('../../../L1/infrastructure/CDNStorage', () => ({
  CDNStorage: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    upload: vi.fn().mockResolvedValue('https://cdn.example.com/artifact'),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Storage</div>
  }))
}))

vi.mock('../../../L1/infrastructure/AuthenticatedWebSocket', () => ({
  AuthenticatedWebSocket: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    send: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock WebSocket</div>
  }))
}))

vi.mock('../../../L1/ui/ResponsiveLayout', () => ({
  ResponsiveLayout: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    off: vi.fn(),
    render: (panels: any) => (
      <div>
        <div>{panels['pipeline-overview']}</div>
        <div>{panels['pipeline-stages']}</div>
        <div>{panels['pipeline-logs']}</div>
      </div>
    )
  }))
}))

describe('DeploymentPipeline', () => {
  let pipeline: DeploymentPipeline
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  
  afterEach(async () => {
    vi.useRealTimers()
    if (pipeline) {
      await pipeline.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic configuration', async () => {
      pipeline = new DeploymentPipeline()
      
      const config = {
        projectId: 'my-app',
        source: {
          type: 'git' as const,
          repository: 'github.com/user/repo',
          branch: 'main'
        },
        build: {
          type: 'nodejs' as const,
          buildCommand: 'npm run build'
        }
      }
      
      const result = await pipeline.initialize(config)
      
      expect(result.pipelineId).toBeDefined()
      expect(result.status).toBe('ready')
      expect(result.capabilities.build).toBe(true)
      expect(result.statistics.totalRuns).toBe(0)
    })
    
    it('should configure with test stage', async () => {
      pipeline = new DeploymentPipeline()
      
      const config = {
        projectId: 'test-app',
        source: { type: 'git' as const },
        test: {
          enabled: true,
          command: 'npm test',
          coverage: {
            enabled: true,
            threshold: 80
          }
        }
      }
      
      const result = await pipeline.initialize(config)
      
      expect(result.capabilities.test).toBe(true)
    })
    
    it('should configure with deployment environments', async () => {
      pipeline = new DeploymentPipeline()
      
      const config = {
        projectId: 'deploy-app',
        source: { type: 'git' as const },
        environments: [
          {
            name: 'staging',
            type: 'staging' as const,
            url: 'https://staging.example.com'
          },
          {
            name: 'production',
            type: 'production' as const,
            url: 'https://example.com',
            approvalRequired: true
          }
        ],
        deploy: {
          strategy: 'blue-green' as const,
          provider: 'aws' as const
        }
      }
      
      const result = await pipeline.initialize(config)
      
      expect(result.capabilities.deploy).toBe(true)
    })
  })
  
  describe('Pipeline Runs', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'test-app',
        source: {
          type: 'git',
          repository: 'github.com/test/repo'
        },
        build: {
          type: 'nodejs',
          buildCommand: 'npm run build'
        },
        test: {
          enabled: true,
          command: 'npm test'
        }
      })
    })
    
    it('should trigger a new run', async () => {
      const runStartedSpy = vi.fn()
      pipeline.on('runStarted', runStartedSpy)
      
      const runId = await pipeline.triggerRun()
      
      expect(runId).toBeDefined()
      expect(runStartedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: runId,
          number: 1,
          status: 'pending',
          trigger: 'manual'
        })
      )
    })
    
    it('should execute pipeline stages', async () => {
      const stageStartedSpy = vi.fn()
      const stageCompletedSpy = vi.fn()
      pipeline.on('stageStarted', stageStartedSpy)
      pipeline.on('stageCompleted', stageCompletedSpy)
      
      await pipeline.triggerRun()
      
      // Fast-forward through stage execution
      await vi.runAllTimersAsync()
      
      // Should have executed checkout, build, test, and notify stages
      expect(stageStartedSpy).toHaveBeenCalledTimes(4)
      expect(stageCompletedSpy).toHaveBeenCalledTimes(4)
      
      const stages = ['checkout', 'build', 'test', 'notify']
      stages.forEach((stageName, index) => {
        expect(stageStartedSpy).toHaveBeenNthCalledWith(index + 1, 
          expect.objectContaining({
            stage: expect.objectContaining({ name: stageName })
          })
        )
      })
    })
    
    it('should handle build failures', async () => {
      const container = (pipeline as any).buildContainer
      container.execute.mockResolvedValueOnce({
        output: 'Build failed',
        exitCode: 1
      })
      
      const runCompletedSpy = vi.fn()
      pipeline.on('runCompleted', runCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      expect(runCompletedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed'
        })
      )
    })
    
    it('should cancel running pipeline', async () => {
      const runCancelledSpy = vi.fn()
      pipeline.on('runCancelled', runCancelledSpy)
      
      const runId = await pipeline.triggerRun()
      
      // Cancel before completion
      await pipeline.cancelRun(runId)
      
      expect(runCancelledSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: runId,
          status: 'cancelled'
        })
      )
    })
    
    it('should retry failed run', async () => {
      // First run
      const runId1 = await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      // Retry
      const runId2 = await pipeline.retryRun(runId1)
      
      expect(runId2).toBeDefined()
      expect(runId2).not.toBe(runId1)
      
      const history = pipeline.getRunHistory()
      expect(history).toHaveLength(2)
    })
  })
  
  describe('Build Stage', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'build-test',
        source: { type: 'git' },
        build: {
          type: 'docker',
          dockerfile: 'Dockerfile',
          buildArgs: {
            NODE_ENV: 'production'
          },
          cache: true
        }
      })
    })
    
    it('should execute build commands', async () => {
      const container = (pipeline as any).buildContainer
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      expect(container.start).toHaveBeenCalled()
      expect(container.execute).toHaveBeenCalled()
      expect(container.stop).toHaveBeenCalled()
    })
    
    it('should create build artifacts', async () => {
      const storage = (pipeline as any).getConstruct('storage')
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      expect(storage.upload).toHaveBeenCalled()
    })
    
    it('should use correct container image for build type', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'python-app',
        source: { type: 'git' },
        build: {
          type: 'python',
          buildCommand: 'python setup.py build'
        }
      })
      
      const container = (pipeline as any).buildContainer
      expect(container.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          image: 'python:3.11-alpine'
        })
      )
    })
  })
  
  describe('Test Stage', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'test-project',
        source: { type: 'git' },
        test: {
          enabled: true,
          command: 'npm test',
          coverage: {
            enabled: true,
            threshold: 80
          },
          parallel: true,
          timeout: 300000
        }
      })
    })
    
    it('should run tests and report metrics', async () => {
      const stageCompletedSpy = vi.fn()
      pipeline.on('stageCompleted', stageCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      const testStageEvent = stageCompletedSpy.mock.calls.find(
        call => call[0].stage.name === 'test'
      )
      
      expect(testStageEvent).toBeDefined()
      expect(testStageEvent[0].stage.metrics).toEqual({
        testsRun: 100,
        testsPassed: 98,
        coverage: 85.5
      })
    })
    
    it('should fail on coverage threshold', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'coverage-test',
        source: { type: 'git' },
        test: {
          enabled: true,
          command: 'npm test',
          coverage: {
            enabled: true,
            threshold: 90 // High threshold
          }
        }
      })
      
      const runCompletedSpy = vi.fn()
      pipeline.on('runCompleted', runCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      // Should fail because mock coverage is 85.5%
      expect(runCompletedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed'
        })
      )
    })
  })
  
  describe('Deployment Strategies', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
    })
    
    it('should deploy using blue-green strategy', async () => {
      await pipeline.initialize({
        projectId: 'blue-green-app',
        source: { type: 'git' },
        environments: [{
          name: 'production',
          type: 'production'
        }],
        deploy: {
          strategy: 'blue-green',
          provider: 'aws'
        }
      })
      
      const stageCompletedSpy = vi.fn()
      pipeline.on('stageCompleted', stageCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      const deployStage = stageCompletedSpy.mock.calls.find(
        call => call[0].stage.name === 'deploy'
      )
      
      expect(deployStage[0].stage.logs).toContain(
        expect.stringContaining('blue-green strategy')
      )
    })
    
    it('should deploy using canary strategy', async () => {
      await pipeline.initialize({
        projectId: 'canary-app',
        source: { type: 'git' },
        environments: [{
          name: 'production',
          type: 'production'
        }],
        deploy: {
          strategy: 'canary',
          provider: 'kubernetes'
        }
      })
      
      const stageCompletedSpy = vi.fn()
      pipeline.on('stageCompleted', stageCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      const deployStage = stageCompletedSpy.mock.calls.find(
        call => call[0].stage.name === 'deploy'
      )
      
      expect(deployStage[0].stage.logs).toContain(
        expect.stringContaining('canary strategy')
      )
    })
    
    it('should require approval for production', async () => {
      await pipeline.initialize({
        projectId: 'approval-app',
        source: { type: 'git' },
        environments: [{
          name: 'production',
          type: 'production',
          approvalRequired: true
        }],
        deploy: {
          strategy: 'rolling',
          provider: 'aws'
        }
      })
      
      const stageCompletedSpy = vi.fn()
      pipeline.on('stageCompleted', stageCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      const deployStage = stageCompletedSpy.mock.calls.find(
        call => call[0].stage.name === 'deploy'
      )
      
      expect(deployStage[0].stage.logs).toContain(
        expect.stringContaining('Waiting for approval')
      )
    })
  })
  
  describe('Notifications', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'notify-app',
        source: { type: 'git' },
        notifications: {
          email: ['team@example.com'],
          slack: '#deployments',
          webhook: 'https://hooks.example.com/deploy'
        }
      })
    })
    
    it('should send notifications on completion', async () => {
      const stageCompletedSpy = vi.fn()
      pipeline.on('stageCompleted', stageCompletedSpy)
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      const notifyStage = stageCompletedSpy.mock.calls.find(
        call => call[0].stage.name === 'notify'
      )
      
      expect(notifyStage[0].stage.logs).toContain(
        expect.stringContaining('Sending email')
      )
      expect(notifyStage[0].stage.logs).toContain(
        expect.stringContaining('Posting to Slack')
      )
      expect(notifyStage[0].stage.logs).toContain(
        expect.stringContaining('Calling webhook')
      )
    })
  })
  
  describe('Artifacts', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'artifact-app',
        source: { type: 'git' },
        build: {
          type: 'nodejs'
        },
        test: {
          enabled: true,
          coverage: { enabled: true }
        }
      })
    })
    
    it('should create and store artifacts', async () => {
      const database = (pipeline as any).getConstruct('database')
      const storage = (pipeline as any).getConstruct('storage')
      
      const runId = await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      // Should create build and test artifacts
      expect(database.create).toHaveBeenCalledWith(
        'artifacts',
        expect.objectContaining({
          runId,
          type: 'build'
        })
      )
      
      expect(database.create).toHaveBeenCalledWith(
        'artifacts',
        expect.objectContaining({
          runId,
          type: 'test-results'
        })
      )
      
      expect(database.create).toHaveBeenCalledWith(
        'artifacts',
        expect.objectContaining({
          runId,
          type: 'coverage'
        })
      )
      
      const artifacts = pipeline.getArtifacts(runId)
      expect(artifacts.length).toBeGreaterThan(0)
    })
  })
  
  describe('Rollback', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'rollback-app',
        source: { type: 'git' },
        deploy: {
          strategy: 'blue-green',
          provider: 'aws'
        }
      })
    })
    
    it('should support rollback', async () => {
      const rollbackStartedSpy = vi.fn()
      const rollbackCompletedSpy = vi.fn()
      pipeline.on('rollbackStarted', rollbackStartedSpy)
      pipeline.on('rollbackCompleted', rollbackCompletedSpy)
      
      await pipeline.rollback('deploy-123')
      await vi.runAllTimersAsync()
      
      expect(rollbackStartedSpy).toHaveBeenCalledWith({ deploymentId: 'deploy-123' })
      expect(rollbackCompletedSpy).toHaveBeenCalledWith({ deploymentId: 'deploy-123' })
    })
  })
  
  describe('Statistics', () => {
    it('should track pipeline statistics', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'stats-app',
        source: { type: 'git' }
      })
      
      // Run multiple pipelines
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      await pipeline.triggerRun()
      await vi.runAllTimersAsync()
      
      const outputs = pipeline.getOutputs()
      
      expect(outputs.statistics.totalRuns).toBe(2)
      expect(outputs.statistics.successRate).toBe(100)
      expect(outputs.statistics.averageDuration).toBeGreaterThan(0)
      expect(outputs.statistics.lastSuccess).toBeDefined()
    })
  })
  
  describe('Real-time Updates', () => {
    beforeEach(async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'realtime-app',
        source: { type: 'git' }
      })
    })
    
    it('should handle WebSocket updates', async () => {
      const runUpdatedSpy = vi.fn()
      pipeline.on('runUpdated', runUpdatedSpy)
      
      const websocket = (pipeline as any).getConstruct('websocket')
      const messageHandler = websocket.on.mock.calls.find(
        (call: any) => call[0] === 'run.update'
      )?.[1]
      
      const runId = await pipeline.triggerRun()
      
      if (messageHandler) {
        await messageHandler({
          id: runId,
          status: 'running'
        })
      }
      
      expect(runUpdatedSpy).toHaveBeenCalled()
    })
  })
  
  describe('Health Check', () => {
    it('should report healthy status when initialized', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'health-app',
        source: { type: 'git' }
      })
      
      const health = await pipeline.healthCheck()
      
      expect(health.healthy).toBe(true)
      expect(health.issues).toHaveLength(0)
    })
  })
  
  describe('UI Rendering', () => {
    it('should render pipeline UI', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'ui-app',
        source: { type: 'git' },
        build: { type: 'nodejs' }
      })
      
      const { container } = render(pipeline.render())
      
      expect(screen.getByText(/ui-app/)).toBeInTheDocument()
      expect(screen.getByText('Trigger Run')).toBeInTheDocument()
      expect(container.querySelector('.pipeline-stages')).toBeInTheDocument()
      expect(container.querySelector('.pipeline-logs')).toBeInTheDocument()
      expect(container.querySelector('#deployment-pipeline')).toBeInTheDocument()
    })
    
    it('should trigger run from UI', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'ui-trigger',
        source: { type: 'git' }
      })
      
      const triggerRunSpy = vi.spyOn(pipeline, 'triggerRun')
      
      render(pipeline.render())
      
      const triggerButton = screen.getByText('Trigger Run')
      fireEvent.click(triggerButton)
      
      expect(triggerRunSpy).toHaveBeenCalled()
    })
  })
  
  describe('Destruction', () => {
    it('should clean up all components on destroy', async () => {
      pipeline = new DeploymentPipeline()
      await pipeline.initialize({
        projectId: 'destroy-app',
        source: { type: 'git' }
      })
      
      const destroyedSpy = vi.fn()
      pipeline.on('destroyed', destroyedSpy)
      
      await pipeline.destroy()
      
      expect(destroyedSpy).toHaveBeenCalled()
      
      const status = pipeline.getStatus()
      expect(status.initialized).toBe(false)
    })
  })
})