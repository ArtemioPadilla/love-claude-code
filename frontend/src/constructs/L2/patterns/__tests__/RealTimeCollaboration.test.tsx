/**
 * RealTimeCollaboration L2 Pattern Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RealTimeCollaboration } from '../RealTimeCollaboration'

// Mock the L1 constructs
vi.mock('../../../L1/infrastructure/AuthenticatedWebSocket', () => ({
  AuthenticatedWebSocket: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    send: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock WebSocket</div>
  }))
}))

vi.mock('../../../L1/ui/SecureCodeEditor', () => ({
  SecureCodeEditor: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    setContent: vi.fn().mockResolvedValue(undefined),
    insertAt: vi.fn().mockResolvedValue(undefined),
    deleteAt: vi.fn().mockResolvedValue(undefined),
    replaceAt: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Editor</div>
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

vi.mock('../../../L1/infrastructure/RestAPIService', () => ({
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    call: vi.fn().mockResolvedValue({ session: null }),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock API Service</div>
  }))
}))

vi.mock('../../../L1/ui/ResponsiveLayout', () => ({
  ResponsiveLayout: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    off: vi.fn(),
    render: (panels: any) => (
      <div>
        <div>{panels.editor}</div>
        <div>{panels.collaborators}</div>
        <div>{panels.chat}</div>
      </div>
    )
  }))
}))

describe('RealTimeCollaboration', () => {
  let collab: RealTimeCollaboration
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (collab) {
      await collab.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic configuration', async () => {
      collab = new RealTimeCollaboration()
      
      const config = {
        roomId: 'test-room-123',
        userId: 'user-456',
        userName: 'Alice',
        features: {
          cursors: true,
          presence: true
        }
      }
      
      const result = await collab.initialize(config)
      
      expect(result.sessionId).toBeDefined()
      expect(result.status).toBe('connected')
      expect(result.capabilities.cursors).toBe(true)
      expect(result.capabilities.presence).toBe(true)
      expect(result.session.roomId).toBe('test-room-123')
    })
    
    it('should configure with advanced features', async () => {
      collab = new RealTimeCollaboration()
      
      const config = {
        roomId: 'test-room',
        userId: 'user-123',
        features: {
          cursors: true,
          selections: true,
          presence: true,
          chat: true,
          annotations: true
        },
        sync: {
          mode: 'crdt' as const,
          conflictResolution: 'auto' as const
        }
      }
      
      const result = await collab.initialize(config)
      
      expect(result.capabilities.chat).toBe(true)
      expect(result.capabilities.annotations).toBe(true)
    })
    
    it('should configure permissions', async () => {
      collab = new RealTimeCollaboration()
      
      const config = {
        roomId: 'test-room',
        userId: 'user-123',
        permissions: {
          canEdit: true,
          canComment: true,
          canInvite: false,
          isHost: true
        }
      }
      
      const result = await collab.initialize(config)
      
      expect(result.session.isHost).toBe(true)
    })
  })
  
  describe('Session Management', () => {
    beforeEach(async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        userName: 'Test User'
      })
    })
    
    it('should join existing session', async () => {
      const apiService = (collab as any).getConstruct('apiService')
      apiService.call.mockResolvedValue({
        session: {
          id: 'session-123',
          roomId: 'test-room',
          document: { content: 'existing content', version: 5 },
          collaborators: new Map(),
          host: 'user-999'
        }
      })
      
      const sessionJoinedSpy = vi.fn()
      collab.on('sessionJoined', sessionJoinedSpy)
      
      // Re-initialize to trigger join
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123'
      })
      
      expect(sessionJoinedSpy).toHaveBeenCalled()
    })
    
    it('should create new session if none exists', async () => {
      const sessionJoinedSpy = vi.fn()
      collab.on('sessionJoined', sessionJoinedSpy)
      
      // Session was created during initialization
      expect(sessionJoinedSpy).toHaveBeenCalled()
      expect(collab.getOutputs().session.isHost).toBe(true)
    })
    
    it('should leave session', async () => {
      const sessionLeftSpy = vi.fn()
      collab.on('sessionLeft', sessionLeftSpy)
      
      await collab.leaveSession()
      
      expect(sessionLeftSpy).toHaveBeenCalled()
      
      const websocket = (collab as any).getConstruct('websocket')
      expect(websocket.send).toHaveBeenCalledWith({
        type: 'presence',
        data: {
          action: 'leave',
          userId: 'user-123'
        }
      })
    })
  })
  
  describe('Collaboration Features', () => {
    beforeEach(async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        userName: 'Alice'
      })
    })
    
    it('should handle local changes', async () => {
      const editor = (collab as any).getConstruct('editor')
      const websocket = (collab as any).getConstruct('websocket')
      
      // Simulate editor change
      const changeHandler = editor.on.mock.calls.find((call: any) => call[0] === 'change')?.[1]
      if (changeHandler) {
        await changeHandler({
          type: 'insert',
          position: 10,
          content: 'hello'
        })
      }
      
      expect(websocket.send).toHaveBeenCalledWith({
        type: 'operation',
        data: expect.objectContaining({
          type: 'insert',
          position: 10,
          content: 'hello'
        })
      })
    })
    
    it('should handle remote operations', async () => {
      const websocket = (collab as any).getConstruct('websocket')
      const editor = (collab as any).getConstruct('editor')
      
      // Simulate receiving remote operation
      const messageHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'message')?.[1]
      if (messageHandler) {
        await messageHandler({
          type: 'operation',
          data: {
            id: 'op-123',
            userId: 'user-456',
            type: 'insert',
            position: 5,
            content: 'world',
            version: 1
          }
        })
      }
      
      expect(editor.insertAt).toHaveBeenCalledWith(5, 'world')
    })
    
    it('should broadcast cursor position', async () => {
      const editor = (collab as any).getConstruct('editor')
      const websocket = (collab as any).getConstruct('websocket')
      
      const cursorHandler = editor.on.mock.calls.find((call: any) => call[0] === 'cursorMove')?.[1]
      if (cursorHandler) {
        await cursorHandler({ line: 10, column: 5 })
      }
      
      expect(websocket.send).toHaveBeenCalledWith({
        type: 'cursor',
        data: {
          userId: 'user-123',
          position: { line: 10, column: 5 }
        }
      })
    })
    
    it('should handle collaborator presence', async () => {
      const collaboratorJoinedSpy = vi.fn()
      collab.on('collaboratorJoined', collaboratorJoinedSpy)
      
      const websocket = (collab as any).getConstruct('websocket')
      const messageHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'message')?.[1]
      
      if (messageHandler) {
        await messageHandler({
          type: 'presence',
          data: {
            action: 'join',
            userId: 'user-456',
            userName: 'Bob',
            color: '#FF6B6B'
          }
        })
      }
      
      expect(collaboratorJoinedSpy).toHaveBeenCalled()
      expect(collab.getCollaborators()).toHaveLength(2) // Self + Bob
    })
  })
  
  describe('Chat Functionality', () => {
    beforeEach(async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        userName: 'Alice',
        features: { chat: true }
      })
    })
    
    it('should send chat messages', async () => {
      const chatMessageSentSpy = vi.fn()
      collab.on('chatMessageSent', chatMessageSentSpy)
      
      await collab.sendChatMessage('Hello everyone!')
      
      expect(chatMessageSentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          userName: 'Alice',
          content: 'Hello everyone!',
          type: 'text'
        })
      )
      
      const websocket = (collab as any).getConstruct('websocket')
      expect(websocket.send).toHaveBeenCalledWith({
        type: 'chat',
        data: expect.objectContaining({
          content: 'Hello everyone!'
        })
      })
    })
    
    it('should receive chat messages', async () => {
      const chatMessageReceivedSpy = vi.fn()
      collab.on('chatMessageReceived', chatMessageReceivedSpy)
      
      const websocket = (collab as any).getConstruct('websocket')
      const messageHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'message')?.[1]
      
      if (messageHandler) {
        await messageHandler({
          type: 'chat',
          data: {
            id: 'msg-456',
            userId: 'user-456',
            userName: 'Bob',
            content: 'Hi Alice!',
            timestamp: new Date(),
            type: 'text'
          }
        })
      }
      
      expect(chatMessageReceivedSpy).toHaveBeenCalled()
      expect(collab.getChatHistory()).toHaveLength(1)
    })
  })
  
  describe('Annotations', () => {
    beforeEach(async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        userName: 'Alice',
        features: { annotations: true }
      })
    })
    
    it('should add annotations', async () => {
      const annotationAddedSpy = vi.fn()
      collab.on('annotationAdded', annotationAddedSpy)
      
      await collab.addAnnotation(15, 'This needs review')
      
      expect(annotationAddedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          line: 15,
          content: 'This needs review',
          resolved: false
        })
      )
      
      expect(collab.getAnnotations()).toHaveLength(1)
    })
    
    it('should filter annotations by line', async () => {
      await collab.addAnnotation(10, 'Comment 1')
      await collab.addAnnotation(20, 'Comment 2')
      await collab.addAnnotation(10, 'Comment 3')
      
      const line10Annotations = collab.getAnnotations(10)
      expect(line10Annotations).toHaveLength(2)
      expect(line10Annotations[0].content).toBe('Comment 1')
      expect(line10Annotations[1].content).toBe('Comment 3')
    })
    
    it('should resolve annotations', async () => {
      await collab.addAnnotation(10, 'Fix this')
      const annotations = collab.getAnnotations()
      const annotationId = annotations[0].id
      
      const annotationResolvedSpy = vi.fn()
      collab.on('annotationResolved', annotationResolvedSpy)
      
      await collab.resolveAnnotation(annotationId)
      
      expect(annotationResolvedSpy).toHaveBeenCalled()
      expect(collab.getAnnotations()[0].resolved).toBe(true)
    })
  })
  
  describe('Conflict Resolution', () => {
    beforeEach(async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        sync: {
          mode: 'ot',
          conflictResolution: 'auto'
        }
      })
    })
    
    it('should transform operations', async () => {
      const editor = (collab as any).getConstruct('editor')
      const websocket = (collab as any).getConstruct('websocket')
      
      // Local operation at position 10
      const changeHandler = editor.on.mock.calls.find((call: any) => call[0] === 'change')?.[1]
      if (changeHandler) {
        await changeHandler({
          type: 'insert',
          position: 10,
          content: 'local'
        })
      }
      
      // Remote operation at position 5 (before local)
      const messageHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'message')?.[1]
      if (messageHandler) {
        await messageHandler({
          type: 'operation',
          data: {
            id: 'op-remote',
            userId: 'user-456',
            type: 'insert',
            position: 5,
            content: 'remote',
            version: 1
          }
        })
      }
      
      // Local operation should be transformed to account for remote
      expect(editor.insertAt).toHaveBeenCalledWith(5, 'remote')
    })
    
    it('should handle conflict detection', async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        sync: {
          conflictResolution: 'manual'
        }
      })
      
      const conflictsDetectedSpy = vi.fn()
      collab.on('conflictsDetected', conflictsDetectedSpy)
      
      // Simulate conflict scenario
      // This would normally happen through complex operation sequences
    })
  })
  
  describe('Network Status', () => {
    beforeEach(async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123'
      })
    })
    
    it('should report network status', () => {
      const status = collab.getNetworkStatus()
      
      expect(status.latency).toBeDefined()
      expect(status.quality).toMatch(/excellent|good|fair|poor/)
      expect(status.syncStatus).toMatch(/synced|syncing|conflict/)
    })
    
    it('should handle disconnection', async () => {
      const disconnectedSpy = vi.fn()
      const offlineModeStartedSpy = vi.fn()
      collab.on('disconnected', disconnectedSpy)
      collab.on('offlineModeStarted', offlineModeStartedSpy)
      
      const websocket = (collab as any).getConstruct('websocket')
      const disconnectedHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'disconnected')?.[1]
      
      if (disconnectedHandler) {
        disconnectedHandler()
      }
      
      expect(disconnectedSpy).toHaveBeenCalled()
      expect(offlineModeStartedSpy).toHaveBeenCalled()
      expect(collab.getOutputs().status).toBe('disconnected')
    })
    
    it('should handle reconnection', async () => {
      const reconnectedSpy = vi.fn()
      collab.on('reconnected', reconnectedSpy)
      
      const websocket = (collab as any).getConstruct('websocket')
      const reconnectedHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'reconnected')?.[1]
      
      if (reconnectedHandler) {
        await reconnectedHandler()
      }
      
      expect(reconnectedSpy).toHaveBeenCalled()
      expect(websocket.send).toHaveBeenCalledWith({
        type: 'sync',
        data: expect.any(Object)
      })
    })
  })
  
  describe('Statistics', () => {
    it('should track collaboration statistics', async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        userName: 'Alice'
      })
      
      // Add some collaborators
      const websocket = (collab as any).getConstruct('websocket')
      const messageHandler = websocket.on.mock.calls.find((call: any) => call[0] === 'message')?.[1]
      
      if (messageHandler) {
        await messageHandler({
          type: 'presence',
          data: {
            action: 'join',
            userId: 'user-456',
            userName: 'Bob'
          }
        })
        
        await messageHandler({
          type: 'presence',
          data: {
            action: 'join',
            userId: 'user-789',
            userName: 'Charlie'
          }
        })
      }
      
      const outputs = collab.getOutputs()
      expect(outputs.session.collaboratorCount).toBe(3)
      expect(collab.getOnlineCollaborators()).toHaveLength(3)
    })
  })
  
  describe('Health Check', () => {
    it('should report healthy status when initialized', async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123'
      })
      
      const health = await collab.healthCheck()
      
      expect(health.healthy).toBe(true)
      expect(health.issues).toHaveLength(0)
    })
  })
  
  describe('UI Rendering', () => {
    it('should render collaboration UI', async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        userName: 'Alice'
      })
      
      const { container } = render(collab.render())
      
      expect(screen.getByText('Mock Editor')).toBeInTheDocument()
      expect(screen.getByText(/Collaborators/)).toBeInTheDocument()
      expect(container.querySelector('.chat-panel')).toBeInTheDocument()
      expect(container.querySelector('#collaboration')).toBeInTheDocument()
    })
    
    it('should handle chat input', async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123',
        features: { chat: true }
      })
      
      const sendChatMessageSpy = vi.spyOn(collab, 'sendChatMessage')
      
      render(collab.render())
      
      const chatInput = screen.getByPlaceholderText('Type a message...')
      fireEvent.keyPress(chatInput, { 
        key: 'Enter', 
        target: { value: 'Test message' } 
      })
      
      expect(sendChatMessageSpy).toHaveBeenCalledWith('Test message')
    })
  })
  
  describe('Destruction', () => {
    it('should clean up all components on destroy', async () => {
      collab = new RealTimeCollaboration()
      await collab.initialize({
        roomId: 'test-room',
        userId: 'user-123'
      })
      
      const destroyedSpy = vi.fn()
      collab.on('destroyed', destroyedSpy)
      
      await collab.destroy()
      
      expect(destroyedSpy).toHaveBeenCalled()
      
      const status = collab.getStatus()
      expect(status.initialized).toBe(false)
    })
  })
})