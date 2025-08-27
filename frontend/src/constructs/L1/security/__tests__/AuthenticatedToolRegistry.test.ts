import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthenticatedToolRegistry } from '../AuthenticatedToolRegistry'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent,
  mockDependencies
} from '../../../../test-utils/constructTestUtils'
import { AuthDataFactory } from '../../../../test-utils/testFactories'

describe('AuthenticatedToolRegistry', () => {
  let harness: ConstructTestHarness<AuthenticatedToolRegistry>
  let metadata: any
  let mockAuth: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'auth-tool-registry',
      name: 'Authenticated Tool Registry',
      level: 'L1',
      category: 'security'
    })

    // Mock authentication primitive
    mockAuth = {
      verifyToken: vi.fn(),
      getUserPermissions: vi.fn(),
      initialized: true,
      metadata: createMockMetadata({ id: 'auth-primitive' })
    }

    const dependencies = { authPrimitive: mockAuth }
    
    harness = new ConstructTestHarness(
      AuthenticatedToolRegistry,
      metadata,
      { authPrimitive: mockAuth }
    )
  })

  describe('initialization', () => {
    it('should initialize with auth primitive', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      harness.expectEvent('initialized')
    })

    it('should emit registry:initialized event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'registry:initialized')
      await harness.initialize()
      
      const event = await promise
      expect(event).toEqual({ toolCount: 0 })
    })
  })

  describe('tool registration', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should register a tool with permissions', async () => {
      const tool = {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'A test tool',
        execute: vi.fn(),
        requiredPermissions: ['tool:execute']
      }

      await harness.construct.registerTool(tool)

      const registered = harness.construct.getTool('test-tool')
      expect(registered).toEqual(tool)
      harness.expectEvent('tool:registered', { 
        id: 'test-tool',
        permissions: ['tool:execute']
      })
    })

    it('should validate tool before registration', async () => {
      const invalidTool = {
        id: 'invalid',
        // Missing required fields
      }

      await expect(harness.construct.registerTool(invalidTool as any))
        .rejects.toThrow('Invalid tool configuration')
    })

    it('should not register duplicate tools', async () => {
      const tool = {
        id: 'duplicate-tool',
        name: 'Tool',
        description: 'Test',
        execute: vi.fn(),
        requiredPermissions: []
      }

      await harness.construct.registerTool(tool)
      
      await expect(harness.construct.registerTool(tool))
        .rejects.toThrow('Tool already registered')
    })

    it('should unregister tools', async () => {
      const tool = {
        id: 'temp-tool',
        name: 'Temp Tool',
        description: 'Temporary',
        execute: vi.fn(),
        requiredPermissions: []
      }

      await harness.construct.registerTool(tool)
      harness.clearEvents()

      await harness.construct.unregisterTool('temp-tool')

      expect(harness.construct.getTool('temp-tool')).toBeUndefined()
      harness.expectEvent('tool:unregistered', { id: 'temp-tool' })
    })
  })

  describe('tool execution', () => {
    let testTool: any

    beforeEach(async () => {
      await harness.initialize()
      
      testTool = {
        id: 'exec-tool',
        name: 'Executable Tool',
        description: 'Tool for execution tests',
        execute: vi.fn().mockResolvedValue({ result: 'success' }),
        requiredPermissions: ['tool:execute', 'data:read']
      }

      await harness.construct.registerTool(testTool)
      harness.clearEvents()
    })

    it('should execute tool with valid authentication', async () => {
      const user = AuthDataFactory.createUser()
      const token = 'valid-token'

      mockAuth.verifyToken.mockResolvedValue({ userId: user.id, valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['tool:execute', 'data:read'])

      const result = await harness.construct.executeTool(
        'exec-tool',
        { param: 'value' },
        token
      )

      expect(result).toEqual({ result: 'success' })
      expect(testTool.execute).toHaveBeenCalledWith({ param: 'value' })
      expect(mockAuth.verifyToken).toHaveBeenCalledWith(token)
      
      harness.expectEvent('tool:executed', {
        id: 'exec-tool',
        userId: user.id
      })
    })

    it('should reject execution with invalid token', async () => {
      mockAuth.verifyToken.mockResolvedValue({ valid: false })

      await expect(harness.construct.executeTool(
        'exec-tool',
        {},
        'invalid-token'
      )).rejects.toThrow('Invalid authentication token')

      expect(testTool.execute).not.toHaveBeenCalled()
      harness.expectEvent('tool:unauthorized', {
        id: 'exec-tool',
        reason: 'Invalid token'
      })
    })

    it('should reject execution without required permissions', async () => {
      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-1', valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['tool:execute']) // Missing data:read

      await expect(harness.construct.executeTool(
        'exec-tool',
        {},
        'valid-token'
      )).rejects.toThrow('Insufficient permissions')

      harness.expectEvent('tool:unauthorized', {
        id: 'exec-tool',
        reason: 'Missing permissions: data:read'
      })
    })

    it('should handle tool execution errors', async () => {
      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-1', valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['tool:execute', 'data:read'])
      testTool.execute.mockRejectedValue(new Error('Tool error'))

      await expect(harness.construct.executeTool(
        'exec-tool',
        {},
        'valid-token'
      )).rejects.toThrow('Tool error')

      harness.expectEvent('tool:error', {
        id: 'exec-tool',
        error: 'Tool error'
      })
    })
  })

  describe('permission management', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should set default permissions for new tools', async () => {
      harness.construct.setDefaultPermissions(['tool:read', 'tool:execute'])

      const tool = {
        id: 'default-perm-tool',
        name: 'Tool',
        description: 'Test',
        execute: vi.fn()
        // No requiredPermissions specified
      }

      await harness.construct.registerTool(tool)

      const registered = harness.construct.getTool('default-perm-tool')
      expect(registered.requiredPermissions).toEqual(['tool:read', 'tool:execute'])
    })

    it('should update tool permissions', async () => {
      const tool = {
        id: 'update-perm-tool',
        name: 'Tool',
        description: 'Test',
        execute: vi.fn(),
        requiredPermissions: ['tool:read']
      }

      await harness.construct.registerTool(tool)
      harness.clearEvents()

      await harness.construct.updateToolPermissions('update-perm-tool', [
        'tool:read',
        'tool:write',
        'tool:delete'
      ])

      const updated = harness.construct.getTool('update-perm-tool')
      expect(updated.requiredPermissions).toEqual([
        'tool:read',
        'tool:write',
        'tool:delete'
      ])

      harness.expectEvent('tool:permissions-updated', {
        id: 'update-perm-tool',
        permissions: ['tool:read', 'tool:write', 'tool:delete']
      })
    })

    it('should check if user can execute tool', async () => {
      const tool = {
        id: 'check-tool',
        name: 'Tool',
        description: 'Test',
        execute: vi.fn(),
        requiredPermissions: ['admin:all']
      }

      await harness.construct.registerTool(tool)

      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-1', valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['user:read'])

      const canExecute = await harness.construct.canExecuteTool(
        'check-tool',
        'valid-token'
      )

      expect(canExecute).toBe(false)
    })
  })

  describe('tool listing and search', () => {
    beforeEach(async () => {
      await harness.initialize()

      // Register multiple tools
      const tools = [
        {
          id: 'data-reader',
          name: 'Data Reader',
          description: 'Reads data from database',
          execute: vi.fn(),
          requiredPermissions: ['data:read'],
          tags: ['data', 'read']
        },
        {
          id: 'data-writer',
          name: 'Data Writer',
          description: 'Writes data to database',
          execute: vi.fn(),
          requiredPermissions: ['data:write'],
          tags: ['data', 'write']
        },
        {
          id: 'file-manager',
          name: 'File Manager',
          description: 'Manages files',
          execute: vi.fn(),
          requiredPermissions: ['file:read', 'file:write'],
          tags: ['file', 'storage']
        }
      ]

      for (const tool of tools) {
        await harness.construct.registerTool(tool)
      }

      harness.clearEvents()
    })

    it('should list all tools', () => {
      const tools = harness.construct.listTools()
      expect(tools).toHaveLength(3)
      expect(tools.map(t => t.id)).toContain('data-reader')
      expect(tools.map(t => t.id)).toContain('data-writer')
      expect(tools.map(t => t.id)).toContain('file-manager')
    })

    it('should filter tools by permission', () => {
      const dataTools = harness.construct.listToolsByPermission('data:read')
      expect(dataTools).toHaveLength(1)
      expect(dataTools[0].id).toBe('data-reader')
    })

    it('should search tools by name', () => {
      const results = harness.construct.searchTools('data')
      expect(results).toHaveLength(2)
      expect(results.map(t => t.id)).toContain('data-reader')
      expect(results.map(t => t.id)).toContain('data-writer')
    })

    it('should search tools by tag', () => {
      const results = harness.construct.searchToolsByTag('data')
      expect(results).toHaveLength(2)
      
      const fileTools = harness.construct.searchToolsByTag('storage')
      expect(fileTools).toHaveLength(1)
      expect(fileTools[0].id).toBe('file-manager')
    })

    it('should get tools accessible to user', async () => {
      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-1', valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['data:read', 'file:read'])

      const accessible = await harness.construct.getAccessibleTools('valid-token')
      
      expect(accessible).toHaveLength(1)
      expect(accessible[0].id).toBe('data-reader')
      // file-manager requires both file:read AND file:write
    })
  })

  describe('audit logging', () => {
    beforeEach(async () => {
      await harness.initialize()
      
      const tool = {
        id: 'audit-tool',
        name: 'Audit Tool',
        description: 'Tool for audit tests',
        execute: vi.fn().mockResolvedValue({ result: 'success' }),
        requiredPermissions: ['tool:execute']
      }

      await harness.construct.registerTool(tool)
      harness.clearEvents()
    })

    it('should log successful executions', async () => {
      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-1', valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['tool:execute'])

      await harness.construct.executeTool('audit-tool', {}, 'valid-token')

      const logs = harness.construct.getAuditLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        toolId: 'audit-tool',
        userId: 'user-1',
        success: true,
        timestamp: expect.any(Date)
      })
    })

    it('should log failed executions', async () => {
      mockAuth.verifyToken.mockResolvedValue({ valid: false })

      try {
        await harness.construct.executeTool('audit-tool', {}, 'invalid-token')
      } catch {
        // Expected to fail with invalid token
      }

      const logs = harness.construct.getAuditLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        toolId: 'audit-tool',
        success: false,
        error: 'Invalid authentication token',
        timestamp: expect.any(Date)
      })
    })

    it('should filter audit logs', async () => {
      // Generate multiple log entries
      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-1', valid: true })
      mockAuth.getUserPermissions.mockResolvedValue(['tool:execute'])

      await harness.construct.executeTool('audit-tool', {}, 'token1')
      await harness.construct.executeTool('audit-tool', {}, 'token2')

      mockAuth.verifyToken.mockResolvedValue({ userId: 'user-2', valid: true })
      await harness.construct.executeTool('audit-tool', {}, 'token3')

      const user1Logs = harness.construct.getAuditLogs({ userId: 'user-1' })
      expect(user1Logs).toHaveLength(2)

      const recentLogs = harness.construct.getAuditLogs({
        startTime: new Date(Date.now() - 60000) // Last minute
      })
      expect(recentLogs).toHaveLength(3)
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate successfully with tools', async () => {
      await harness.construct.registerTool({
        id: 'valid-tool',
        name: 'Valid Tool',
        description: 'A valid tool',
        execute: vi.fn(),
        requiredPermissions: ['tool:execute']
      })

      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate auth primitive dependency', async () => {
      // Simulate missing auth primitive
      harness.construct['dependencies'].authPrimitive = null as any

      const result = await harness.construct.validate()
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('Auth primitive not initialized')
    })
  })

  describe('disposal', () => {
    it('should clear tools and logs on disposal', async () => {
      await harness.initialize()
      
      await harness.construct.registerTool({
        id: 'dispose-tool',
        name: 'Tool',
        description: 'Test',
        execute: vi.fn(),
        requiredPermissions: []
      })

      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      expect(harness.construct.listTools()).toHaveLength(0)
      expect(harness.construct.getAuditLogs()).toHaveLength(0)
      harness.expectEvent('disposed')
    })
  })
})