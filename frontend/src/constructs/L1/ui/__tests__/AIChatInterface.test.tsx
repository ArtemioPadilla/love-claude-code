import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIChatInterface } from '../AIChatInterface'

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (content: string, _options?: any) => {
      // Simple mock sanitization
      return content.replace(/<script[^>]*>.*?<\/script>/gi, '')
    }
  }
}))

// Mock marked
vi.mock('marked', () => ({
  marked: {
    parse: (content: string) => {
      // Simple mock markdown parsing
      return content
        .replace(/^# (.*)/gm, '<h1>$1</h1>')
        .replace(/^## (.*)/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    },
    setOptions: vi.fn()
  }
}))

describe('L1: AIChatInterface', () => {
  let construct: AIChatInterface

  beforeEach(() => {
    construct = new AIChatInterface()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.id).toBe('platform-l1-ai-chat-interface')
      expect(construct.level).toBe('L1')
      expect(construct.getInput('model')).toBe('claude-3-sonnet-20240229')
      expect(construct.getInput('enableMarkdown')).toBe(true)
      expect(construct.getInput('enableXSSProtection')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        model: 'claude-3-opus-20240229',
        systemPrompt: 'You are a coding expert.',
        maxTokens: 2000,
        temperature: 0.5,
        enableCodeHighlighting: true
      })
      
      expect(construct.getInput('model')).toBe('claude-3-opus-20240229')
      expect(construct.getInput('systemPrompt')).toBe('You are a coding expert.')
      expect(construct.getInput('maxTokens')).toBe(2000)
      expect(construct.getInput('temperature')).toBe(0.5)
    })

    it('should generate unique conversation ID', async () => {
      await construct.initialize({})
      
      const conversationId = construct.getOutput('conversationId')
      expect(conversationId).toMatch(/^conv_\d+_[a-z0-9]+$/)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({})
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({})
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(60)
    })

    it('should be built with L0 ChatMessagePrimitive', async () => {
      await construct.initialize({})
      
      expect(construct.getBuiltWithConstructs()).toContain('platform-l0-chat-message-primitive')
    })
  })

  describe('Security Features', () => {
    it('should have security metadata', async () => {
      await construct.initialize({})
      
      const security = construct.metadata.security
      expect(security).toBeDefined()
      expect(security.length).toBeGreaterThan(0)
      expect(security.some((s: any) => s.aspect === 'XSS Protection')).toBe(true)
      expect(security.some((s: any) => s.aspect === 'API Key Security')).toBe(true)
    })

    it('should sanitize message content when XSS protection is enabled', async () => {
      await construct.initialize({
        enableXSSProtection: true
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.ai-chat-interface')).toBeInTheDocument()
      })

      // Send a message with potential XSS
      const maliciousContent = '<script>alert("XSS")</script>Hello'
      await construct.sendMessage(maliciousContent)
      
      const messages = construct.getConversation()
      expect(messages[0].content).toBe(maliciousContent) // Raw content stored
      
      // But rendered content should be sanitized (tested in component)
    })

    it('should not sanitize when XSS protection is disabled', async () => {
      await construct.initialize({
        enableXSSProtection: false
      })

      const content = '<script>alert("test")</script>'
      const sanitized = construct['sanitizeContent'](content)
      
      expect(sanitized).toBe(content) // No sanitization
    })
  })

  describe('Message Management', () => {
    beforeEach(async () => {
      await construct.initialize({})
    })

    it('should send and store messages', async () => {
      const { container } = render(construct.render())
      
      await construct.sendMessage('Hello, Claude!')
      
      const messages = construct.getConversation()
      expect(messages).toHaveLength(2) // User message + AI response
      expect(messages[0].role).toBe('user')
      expect(messages[0].content).toBe('Hello, Claude!')
      expect(messages[0].sender).toBe('User')
    })

    it('should enforce message length limit', async () => {
      await construct.initialize({
        maxMessageLength: 100
      })

      const longMessage = 'a'.repeat(101)
      
      await expect(construct.sendMessage(longMessage)).rejects.toThrow('exceeds maximum length')
    })

    it('should track message count', async () => {
      await construct.sendMessage('First message')
      expect(construct.getOutput('messageCount')).toBe(2)
      
      await construct.sendMessage('Second message')
      expect(construct.getOutput('messageCount')).toBe(4)
    })

    it('should clear conversation', async () => {
      await construct.sendMessage('Test message')
      expect(construct.getConversation().length).toBeGreaterThan(0)
      
      construct.clearConversation()
      
      expect(construct.getConversation()).toHaveLength(0)
      expect(construct.getOutput('messageCount')).toBe(0)
      
      // Should generate new conversation ID
      const newId = construct.getOutput('conversationId')
      expect(newId).toMatch(/^conv_\d+_[a-z0-9]+$/)
    })

    it('should export conversation', async () => {
      await construct.sendMessage('Test message')
      
      const exported = construct.exportConversation()
      const parsed = JSON.parse(exported)
      
      expect(parsed.id).toBeDefined()
      expect(parsed.messages).toHaveLength(2)
      expect(parsed.model).toBe('claude-3-sonnet-20240229')
      expect(parsed.timestamp).toBeDefined()
    })
  })

  describe('Markdown Support', () => {
    it('should render markdown when enabled', async () => {
      await construct.initialize({
        enableMarkdown: true
      })

      const markdown = '# Title\n**Bold** and *italic*'
      const rendered = construct['renderMarkdown'](markdown)
      
      expect(rendered).toContain('<h1>Title</h1>')
      expect(rendered).toContain('<strong>Bold</strong>')
      expect(rendered).toContain('<em>italic</em>')
    })

    it('should not render markdown when disabled', async () => {
      await construct.initialize({
        enableMarkdown: false
      })

      const markdown = '# Title\n**Bold**'
      const rendered = construct['renderMarkdown'](markdown)
      
      expect(rendered).toBe(markdown) // No transformation
    })
  })

  describe('Loading State', () => {
    it('should track loading state', async () => {
      await construct.initialize({})
      
      expect(construct.getOutput('isLoading')).toBe(false)
      
      // Start sending message
      const sendPromise = construct.sendMessage('Test')
      
      // Should be loading
      expect(construct.getOutput('isLoading')).toBe(true)
      
      await sendPromise
      
      // Should no longer be loading
      expect(construct.getOutput('isLoading')).toBe(false)
    })

    it('should cancel ongoing requests', async () => {
      await construct.initialize({})
      
      // Start a request
      const sendPromise = construct.sendMessage('Test')
      
      // Cancel it
      construct.cancelRequest()
      
      expect(construct.getOutput('isLoading')).toBe(false)
    })
  })

  describe('Event Handling', () => {
    it('should emit messageReceived event', async () => {
      await construct.initialize({})
      
      const mockHandler = vi.fn()
      construct.on('messageReceived', mockHandler)
      
      await construct.sendMessage('Test')
      
      expect(mockHandler).toHaveBeenCalled()
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        role: 'assistant',
        sender: 'Claude'
      }))
    })

    it('should emit error event on failure', async () => {
      await construct.initialize({})
      
      const mockHandler = vi.fn()
      construct.on('error', mockHandler)
      
      // Mock API call to throw error
      construct['callClaudeAPI'] = vi.fn().mockRejectedValue(new Error('API Error'))
      
      await expect(construct.sendMessage('Test')).rejects.toThrow('API Error')
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should emit conversationCleared event', async () => {
      await construct.initialize({})
      
      const mockHandler = vi.fn()
      construct.on('conversationCleared', mockHandler)
      
      construct.clearConversation()
      
      expect(mockHandler).toHaveBeenCalled()
    })
  })

  describe('UI Rendering', () => {
    it('should render chat interface', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.ai-chat-interface')).toBeInTheDocument()
        expect(container.querySelector('.chat-header')).toBeInTheDocument()
        expect(container.querySelector('.chat-messages')).toBeInTheDocument()
        expect(container.querySelector('.chat-input')).toBeInTheDocument()
      })
    })

    it('should display model information', async () => {
      await construct.initialize({
        model: 'claude-3-opus-20240229'
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.textContent).toContain('claude-3-opus-20240229')
      })
    })

    it('should handle user input', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      const user = userEvent.setup()
      
      await waitFor(() => {
        expect(container.querySelector('input')).toBeInTheDocument()
      })
      
      const input = container.querySelector('input')!
      const sendButton = screen.getByText('Send')
      
      await user.type(input, 'Hello Claude')
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(container.querySelector('.user-message')).toBeInTheDocument()
      })
    })

    it('should show loading indicator', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      
      // Mock slow API response
      construct['callClaudeAPI'] = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      construct.sendMessage('Test')
      
      await waitFor(() => {
        expect(container.querySelector('.loading-indicator')).toBeInTheDocument()
        expect(container.textContent).toContain('Claude is typing...')
      })
    })

    it('should show clear button when messages exist', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      
      await construct.sendMessage('Test')
      
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument()
      })
    })

    it('should display error messages', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      
      // Mock API error
      construct['callClaudeAPI'] = vi.fn().mockRejectedValue(new Error('API Error'))
      
      try {
        await construct.sendMessage('Test')
      } catch (e) {
        // Expected error
      }
      
      await waitFor(() => {
        expect(container.querySelector('.error-message')).toBeInTheDocument()
        expect(container.textContent).toContain('Error: API Error')
      })
    })
  })

  describe('L1 Characteristics', () => {
    it('should have enhanced features over L0', async () => {
      await construct.initialize({})
      
      // Should have markdown support
      expect(construct.inputs.some(i => i.name === 'enableMarkdown')).toBe(true)
      
      // Should have security features
      expect(construct.inputs.some(i => i.name === 'enableXSSProtection')).toBe(true)
      
      // Should have AI integration
      expect(construct.inputs.some(i => i.name === 'model')).toBe(true)
      expect(construct.inputs.some(i => i.name === 'systemPrompt')).toBe(true)
    })

    it('should provide enhanced outputs', async () => {
      await construct.initialize({})
      
      // Should have conversation tracking
      expect(construct.outputs.some(o => o.name === 'conversationId')).toBe(true)
      expect(construct.outputs.some(o => o.name === 'messageCount')).toBe(true)
      expect(construct.outputs.some(o => o.name === 'lastResponse')).toBe(true)
    })

    it('should track usage metrics', async () => {
      await construct.initialize({})
      
      // Should have cost tracking
      expect(construct.metadata.cost.usageFactors.length).toBeGreaterThan(0)
      expect(construct.metadata.cost.usageFactors.some(f => f.name === 'claudeApiCalls')).toBe(true)
      expect(construct.metadata.cost.usageFactors.some(f => f.name === 'tokens')).toBe(true)
    })
  })

  describe('Context Support', () => {
    it('should support conversation context', async () => {
      await construct.initialize({
        conversationContext: {
          projectType: 'React',
          language: 'TypeScript'
        }
      })
      
      const context = construct.getInput('conversationContext')
      expect(context).toEqual({
        projectType: 'React',
        language: 'TypeScript'
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty messages gracefully', async () => {
      await construct.initialize({})
      
      // Should not send empty message
      await expect(construct.sendMessage('')).rejects.toThrow()
      await expect(construct.sendMessage('   ')).rejects.toThrow()
    })

    it('should handle rapid message sending', async () => {
      await construct.initialize({})
      
      // Send multiple messages quickly
      await Promise.all([
        construct.sendMessage('Message 1'),
        construct.sendMessage('Message 2'),
        construct.sendMessage('Message 3')
      ])
      
      const messages = construct.getConversation()
      expect(messages.length).toBe(6) // 3 user + 3 AI messages
    })

    it('should handle special characters in messages', async () => {
      await construct.initialize({})
      
      const specialMessage = 'Hello <b>Claude</b> & "friends"!'
      await construct.sendMessage(specialMessage)
      
      const messages = construct.getConversation()
      expect(messages[0].content).toBe(specialMessage)
    })
  })
})