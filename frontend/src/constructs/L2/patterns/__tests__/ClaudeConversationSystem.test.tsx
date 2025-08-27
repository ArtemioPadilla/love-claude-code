/**
 * ClaudeConversationSystem L2 Pattern Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClaudeConversationSystem } from '../ClaudeConversationSystem'

// Mock the L1 constructs
vi.mock('../../../L1/ui/AIChatInterface', () => ({
  AIChatInterface: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    loadMessages: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Chat Interface</div>
  }))
}))

vi.mock('../../../L1/infrastructure/EncryptedDatabase', () => ({
  EncryptedDatabase: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Database</div>
  }))
}))

vi.mock('../../../L1/infrastructure/CDNStorage', () => ({
  CDNStorage: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    upload: vi.fn().mockResolvedValue('https://cdn.example.com/file123'),
    on: vi.fn(),
    off: vi.fn(),
    render: () => <div>Mock Storage</div>
  }))
}))

vi.mock('../../../L1/infrastructure/RestAPIService', () => ({
  RestAPIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({}),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    call: vi.fn().mockResolvedValue({
      content: 'This is Claude\'s response',
      usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300 }
    }),
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
        <div>{panels['conversation-list']}</div>
        <div>{panels['chat-interface']}</div>
      </div>
    )
  }))
}))

describe('ClaudeConversationSystem', () => {
  let system: ClaudeConversationSystem
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (system) {
      await system.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic configuration', async () => {
      system = new ClaudeConversationSystem()
      
      const config = {
        userId: 'test-user-123',
        model: 'claude-3-5-sonnet' as const,
        features: {
          streaming: true,
          codeExecution: true
        }
      }
      
      const result = await system.initialize(config)
      
      expect(result.systemId).toBeDefined()
      expect(result.status).toBe('ready')
      expect(result.capabilities.streaming).toBe(true)
      expect(result.capabilities.codeExecution).toBe(true)
      expect(result.statistics.totalConversations).toBe(0)
      expect(result.currentContext.model).toBe('claude-3-5-sonnet')
    })
    
    it('should configure with API key', async () => {
      system = new ClaudeConversationSystem()
      
      const config = {
        userId: 'test-user-123',
        apiKey: 'test-api-key-123',
        model: 'claude-3-opus' as const,
        maxTokens: 8000,
        temperature: 0.5
      }
      
      const result = await system.initialize(config)
      
      expect(result.currentContext.model).toBe('claude-3-opus')
      expect(result.currentContext.maxTokens).toBe(8000)
      expect(result.currentContext.temperature).toBe(0.5)
    })
    
    it('should enable specific features', async () => {
      system = new ClaudeConversationSystem()
      
      const config = {
        userId: 'test-user-123',
        features: {
          streaming: true,
          codeExecution: true,
          fileAttachments: true,
          webSearch: false,
          multiModal: true,
          voiceInput: false
        }
      }
      
      const result = await system.initialize(config)
      
      expect(result.capabilities.streaming).toBe(true)
      expect(result.capabilities.codeExecution).toBe(true)
      expect(result.capabilities.fileAttachments).toBe(true)
      expect(result.capabilities.multiModal).toBe(true)
      expect(result.capabilities.voiceInput).toBe(false)
    })
  })
  
  describe('Conversation Management', () => {
    beforeEach(async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
    })
    
    it('should create a new conversation', async () => {
      const conversationCreatedSpy = vi.fn()
      system.on('conversationCreated', conversationCreatedSpy)
      
      const conversationId = await system.createNewConversation('Test Conversation')
      
      expect(conversationId).toBeDefined()
      expect(conversationCreatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: conversationId,
          title: 'Test Conversation'
        })
      )
      
      const activeConv = system.getActiveConversation()
      expect(activeConv?.id).toBe(conversationId)
      expect(activeConv?.title).toBe('Test Conversation')
    })
    
    it('should auto-generate conversation title if not provided', async () => {
      const conversationId = await system.createNewConversation()
      
      const activeConv = system.getActiveConversation()
      expect(activeConv?.title).toMatch(/Conversation \d+\/\d+\/\d+ \d+:\d+/)
    })
    
    it('should load conversation from database', async () => {
      const database = (system as any).getConstruct('database')
      database.get.mockResolvedValue({
        id: 'conv-123',
        title: 'Loaded Conversation',
        created: new Date(),
        updated: new Date()
      })
      database.query.mockResolvedValue([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello Claude',
          timestamp: new Date()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hello! How can I help you?',
          timestamp: new Date()
        }
      ])
      
      await system.loadConversation('conv-123')
      
      const activeConv = system.getActiveConversation()
      expect(activeConv?.id).toBe('conv-123')
      expect(activeConv?.messages).toHaveLength(2)
    })
    
    it('should switch between conversations', async () => {
      const conv1 = await system.createNewConversation('Conversation 1')
      const conv2 = await system.createNewConversation('Conversation 2')
      
      expect(system.getActiveConversation()?.id).toBe(conv2)
      
      await system.switchConversation(conv1)
      expect(system.getActiveConversation()?.id).toBe(conv1)
    })
    
    it('should delete a conversation', async () => {
      const conversationId = await system.createNewConversation('To Delete')
      const deletedSpy = vi.fn()
      system.on('conversationDeleted', deletedSpy)
      
      await system.deleteConversation(conversationId)
      
      expect(deletedSpy).toHaveBeenCalledWith({ id: conversationId })
      expect(system.getAllConversations().find(c => c.id === conversationId)).toBeUndefined()
    })
  })
  
  describe('Message Handling', () => {
    beforeEach(async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123',
        apiKey: 'test-api-key'
      })
    })
    
    it('should send user message and receive response', async () => {
      const messageSentSpy = vi.fn()
      const messageReceivedSpy = vi.fn()
      system.on('messageSent', messageSentSpy)
      system.on('messageReceived', messageReceivedSpy)
      
      await system.sendMessage('Hello Claude!')
      
      // Should create conversation if none exists
      expect(system.getActiveConversation()).toBeDefined()
      
      // Should emit message sent
      expect(messageSentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Hello Claude!'
        })
      )
      
      // Should receive response
      await waitFor(() => {
        expect(messageReceivedSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'assistant',
            content: "This is Claude's response"
          })
        )
      })
      
      // Should update conversation
      const conv = system.getActiveConversation()
      expect(conv?.messages).toHaveLength(2)
      expect(conv?.messages[0].role).toBe('user')
      expect(conv?.messages[1].role).toBe('assistant')
    })
    
    it('should handle streaming responses', async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123',
        apiKey: 'test-api-key',
        features: { streaming: true }
      })
      
      // Mock streaming response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: 'Hello' }
          yield { content: ' from' }
          yield { content: ' Claude!' }
        },
        usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 }
      }
      
      const apiService = (system as any).getConstruct('apiService')
      apiService.call.mockResolvedValue(mockStream)
      
      await system.sendMessage('Test streaming')
      
      const conv = system.getActiveConversation()
      expect(conv?.messages[1].content).toBe('Hello from Claude!')
    })
    
    it('should handle message with attachments', async () => {
      const fileUploadedSpy = vi.fn()
      const storage = (system as any).getConstruct('storage')
      storage.on.mock.calls.find((call: any) => call[0] === 'fileUploaded')?.[1]
      
      await system.handleUserMessage('Check this file', ['file1.png'])
      
      const conv = system.getActiveConversation()
      expect(conv?.messages[0].metadata?.attachments).toEqual(['file1.png'])
    })
    
    it('should regenerate last response', async () => {
      // Send initial message
      await system.sendMessage('First message')
      
      const conv = system.getActiveConversation()
      const initialResponseId = conv?.messages[1].id
      
      // Regenerate
      await system.regenerateLastResponse()
      
      // Should have removed old response and generated new one
      const updatedConv = system.getActiveConversation()
      expect(updatedConv?.messages).toHaveLength(2)
      expect(updatedConv?.messages[1].id).not.toBe(initialResponseId)
    })
  })
  
  describe('Context Management', () => {
    beforeEach(async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
    })
    
    it('should update conversation context', async () => {
      const contextUpdatedSpy = vi.fn()
      system.on('contextUpdated', contextUpdatedSpy)
      
      await system.updateContext({
        projectFiles: ['index.ts', 'app.tsx'],
        relevantCode: ['function main() {}'],
        documentation: ['README.md']
      })
      
      expect(contextUpdatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectFiles: ['index.ts', 'app.tsx'],
          relevantCode: ['function main() {}'],
          documentation: ['README.md']
        })
      )
    })
    
    it('should include context in API messages', async () => {
      await system.updateContext({
        projectFiles: ['test.js']
      })
      
      const apiService = (system as any).getConstruct('apiService')
      await system.sendMessage('Explain this code')
      
      expect(apiService.call).toHaveBeenCalledWith('messages', 
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'Project context: test.js'
            })
          ])
        })
      )
    })
  })
  
  describe('Search and Export', () => {
    beforeEach(async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      // Create some test conversations
      await system.createNewConversation('Test Conv 1')
      await system.sendMessage('Hello')
      await system.createNewConversation('Test Conv 2')
      await system.sendMessage('World')
    })
    
    it('should search conversations', async () => {
      const database = (system as any).getConstruct('database')
      database.search.mockResolvedValue([
        { id: 'conv-1', title: 'Test Conv 1' }
      ])
      
      const results = await system.searchConversations('Test')
      
      expect(database.search).toHaveBeenCalledWith('conversations', 'Test')
      expect(results).toHaveLength(1)
    })
    
    it('should export conversation as JSON', async () => {
      const conv = system.getActiveConversation()
      if (!conv) throw new Error('No active conversation')
      
      const exported = await system.exportConversation(conv.id, 'json')
      const parsed = JSON.parse(exported)
      
      expect(parsed.id).toBe(conv.id)
      expect(parsed.messages).toHaveLength(2)
    })
    
    it('should export conversation as Markdown', async () => {
      const conv = system.getActiveConversation()
      if (!conv) throw new Error('No active conversation')
      
      const exported = await system.exportConversation(conv.id, 'markdown')
      
      expect(exported).toContain('# Test Conv 2')
      expect(exported).toContain('## User')
      expect(exported).toContain('World')
      expect(exported).toContain('## Assistant')
    })
  })
  
  describe('Cost Calculation', () => {
    it('should calculate costs for different models', async () => {
      system = new ClaudeConversationSystem()
      
      // Test Sonnet pricing
      await system.initialize({
        userId: 'test-user',
        model: 'claude-3-5-sonnet'
      })
      
      const apiService = (system as any).getConstruct('apiService')
      apiService.call.mockResolvedValue({
        content: 'Response',
        usage: { input_tokens: 1000, output_tokens: 2000, total_tokens: 3000 }
      })
      
      await system.sendMessage('Test')
      
      const conv = system.getActiveConversation()
      const cost = conv?.messages[1].metadata?.cost
      
      // (1000 * 0.003 + 2000 * 0.015) / 1000 = 0.033
      expect(cost).toBeCloseTo(0.033, 3)
    })
  })
  
  describe('Auto-save', () => {
    it('should auto-save conversations periodically', async () => {
      vi.useFakeTimers()
      
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      const database = (system as any).getConstruct('database')
      await system.createNewConversation()
      await system.sendMessage('Test message')
      
      // Clear previous calls
      database.upsert.mockClear()
      
      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000)
      
      // Should have saved
      await waitFor(() => {
        expect(database.upsert).toHaveBeenCalledWith(
          'conversations',
          expect.any(String),
          expect.any(Object)
        )
      })
      
      vi.useRealTimers()
    })
  })
  
  describe('Statistics', () => {
    it('should track conversation statistics', async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      // Create conversations with messages
      await system.createNewConversation()
      await system.sendMessage('Message 1')
      await system.sendMessage('Message 2')
      
      await system.createNewConversation()
      await system.sendMessage('Message 3')
      
      const stats = system.getOutputs().statistics
      
      expect(stats.totalConversations).toBe(2)
      expect(stats.totalMessages).toBe(6) // 3 user + 3 assistant
      expect(stats.activeConversation).toBeDefined()
    })
  })
  
  describe('Health Check', () => {
    it('should report healthy status when initialized', async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      const health = await system.healthCheck()
      
      expect(health.healthy).toBe(true)
      expect(health.issues).toHaveLength(0)
    })
    
    it('should report unhealthy status when not initialized', async () => {
      system = new ClaudeConversationSystem()
      
      const health = await system.healthCheck()
      
      expect(health.healthy).toBe(false)
      expect(health.issues).toContain('Pattern not initialized')
    })
  })
  
  describe('UI Rendering', () => {
    it('should render conversation list and chat interface', async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      // Create some conversations
      await system.createNewConversation('Conv 1')
      await system.sendMessage('Test 1')
      await system.createNewConversation('Conv 2')
      
      const { container } = render(system.render())
      
      expect(screen.getByText('Conversations')).toBeInTheDocument()
      expect(screen.getByText('New Chat')).toBeInTheDocument()
      expect(screen.getByText('Conv 1')).toBeInTheDocument()
      expect(screen.getByText('Conv 2')).toBeInTheDocument()
      expect(screen.getByText('Mock Chat Interface')).toBeInTheDocument()
      
      expect(container.querySelector('#claude-conversation')).toBeInTheDocument()
    })
    
    it('should handle conversation switching in UI', async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      const conv1 = await system.createNewConversation('Conv 1')
      const conv2 = await system.createNewConversation('Conv 2')
      
      render(system.render())
      
      const conv1Element = screen.getByText('Conv 1').parentElement!
      fireEvent.click(conv1Element)
      
      expect(system.getActiveConversation()?.id).toBe(conv1)
    })
  })
  
  describe('Destruction', () => {
    it('should clean up all components on destroy', async () => {
      system = new ClaudeConversationSystem()
      await system.initialize({
        userId: 'test-user-123'
      })
      
      const destroyedSpy = vi.fn()
      system.on('destroyed', destroyedSpy)
      
      await system.destroy()
      
      expect(destroyedSpy).toHaveBeenCalled()
      
      const status = system.getStatus()
      expect(status.initialized).toBe(false)
    })
  })
})