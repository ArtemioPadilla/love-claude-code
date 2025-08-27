import React, { useState, useRef, useEffect } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import { ChatMessagePrimitive } from '../../L0/ui/ChatMessagePrimitive'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * L1 AI Chat Interface Construct
 * Enhanced chat interface with Claude integration, markdown support, and security features
 * Built upon L0 ChatMessagePrimitive
 */
export class AIChatInterface extends L1UIConstruct {
  private messages: ChatMessage[] = []
  private isLoading: boolean = false
  private abortController: AbortController | null = null
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-ai-chat-interface',
    name: 'AI Chat Interface',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Secure AI chat interface with Claude integration, markdown rendering, and conversation management',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'chat', 'ai', 'claude'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['chat', 'ai', 'claude', 'markdown', 'secure'],
    inputs: [
      {
        name: 'apiKey',
        type: 'string',
        description: 'Claude API key (can be set via settings)',
        required: false,
        sensitive: true
      },
      {
        name: 'model',
        type: 'string',
        description: 'Claude model to use',
        required: false,
        defaultValue: 'claude-3-sonnet-20240229',
        validation: {
          enum: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
        }
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description: 'System prompt for Claude',
        required: false,
        defaultValue: 'You are a helpful AI assistant.'
      },
      {
        name: 'maxTokens',
        type: 'number',
        description: 'Maximum tokens in response',
        required: false,
        defaultValue: 4000
      },
      {
        name: 'temperature',
        type: 'number',
        description: 'Response randomness (0-1)',
        required: false,
        defaultValue: 0.7,
        validation: {
          min: 0,
          max: 1
        }
      },
      {
        name: 'enableMarkdown',
        type: 'boolean',
        description: 'Enable markdown rendering',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableCodeHighlighting',
        type: 'boolean',
        description: 'Enable syntax highlighting in code blocks',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableXSSProtection',
        type: 'boolean',
        description: 'Enable XSS protection for messages',
        required: false,
        defaultValue: true
      },
      {
        name: 'conversationContext',
        type: 'object',
        description: 'Additional context for the conversation',
        required: false,
        defaultValue: {}
      },
      {
        name: 'maxMessageLength',
        type: 'number',
        description: 'Maximum message length',
        required: false,
        defaultValue: 10000
      },
      {
        name: 'placeholder',
        type: 'string',
        description: 'Input placeholder text',
        required: false,
        defaultValue: 'Type a message...'
      }
    ],
    outputs: [
      {
        name: 'messages',
        type: 'array',
        description: 'Current conversation messages'
      },
      {
        name: 'isLoading',
        type: 'boolean',
        description: 'Whether a response is being generated'
      },
      {
        name: 'conversationId',
        type: 'string',
        description: 'Unique conversation ID'
      },
      {
        name: 'messageCount',
        type: 'number',
        description: 'Total number of messages'
      },
      {
        name: 'lastResponse',
        type: 'object',
        description: 'Last AI response details'
      }
    ],
    security: [
      {
        aspect: 'XSS Protection',
        description: 'Sanitizes message content to prevent XSS attacks',
        implementation: 'DOMPurify for HTML sanitization'
      },
      {
        aspect: 'API Key Security',
        description: 'Secure handling of API keys',
        implementation: 'Keys stored in secure settings, never exposed client-side'
      },
      {
        aspect: 'Content Validation',
        description: 'Validates and limits message content',
        implementation: 'Length limits and content filtering'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'claudeApiCalls',
          unit: 'requests',
          costPerUnit: 0.01,
          description: 'Claude API usage costs'
        },
        {
          name: 'tokens',
          unit: '1000 tokens',
          costPerUnit: 0.002,
          description: 'Token usage costs'
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'React + Claude API'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Create an AI chat interface',
        code: `const chat = new AIChatInterface()
await chat.initialize({
  systemPrompt: 'You are a helpful coding assistant.',
  model: 'claude-3-sonnet-20240229',
  enableMarkdown: true
})

// Send a message
await chat.sendMessage('How do I create a React component?')`,
        language: 'typescript'
      },
      {
        title: 'With Context',
        description: 'Chat with project context',
        code: `const chat = new AIChatInterface()
await chat.initialize({
  conversationContext: {
    projectType: 'React',
    language: 'TypeScript',
    currentFile: 'App.tsx'
  }
})

// Context-aware responses
await chat.sendMessage('What imports am I missing?')`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always enable XSS protection for user messages',
      'Store API keys securely in settings',
      'Implement rate limiting for API calls',
      'Monitor token usage to control costs',
      'Clear sensitive conversations when done',
      'Use appropriate models for different tasks',
      'Provide clear system prompts',
      'Handle streaming responses for better UX'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        claudeApiEndpoint: {
          type: 'string',
          description: 'Claude API endpoint URL',
          default: 'https://api.anthropic.com'
        }
      },
      environmentVariables: []
    },
    dependencies: ['platform-l0-chat-message-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-chat-message-primitive'],
      timeToCreate: 60,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(AIChatInterface.definition)
    this.conversationId = this.generateConversationId()
  }

  private conversationId: string

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sanitize message content
   */
  private sanitizeContent(content: string): string {
    if (!this.getInput<boolean>('enableXSSProtection')) {
      return content
    }
    
    // Sanitize with DOMPurify
    const clean = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      FORCE_BODY: true
    })
    
    return clean
  }

  /**
   * Render markdown content
   */
  private renderMarkdown(content: string): string {
    if (!this.getInput<boolean>('enableMarkdown')) {
      return content
    }

    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    })

    // Parse markdown
    const html = marked.parse(content) as string
    
    // Sanitize the HTML output
    return this.sanitizeContent(html)
  }

  /**
   * Send a message to Claude
   */
  async sendMessage(content: string): Promise<void> {
    // Validate message length
    const maxLength = this.getInput<number>('maxMessageLength') || 10000
    if (content.length > maxLength) {
      throw new Error(`Message exceeds maximum length of ${maxLength} characters`)
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content: content,
      role: 'user',
      timestamp: new Date(),
      sender: 'User'
    }
    
    this.messages.push(userMessage)
    this.setOutput('messages', [...this.messages])
    this.setOutput('messageCount', this.messages.length)
    
    // Set loading state
    this.isLoading = true
    this.setOutput('isLoading', true)
    
    // Create abort controller for cancellation
    this.abortController = new AbortController()
    
    try {
      // Prepare messages for Claude API
      const apiMessages = this.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Add system prompt as first message if provided
      const systemPrompt = this.getInput<string>('systemPrompt')
      if (systemPrompt && apiMessages.length === 1) {
        apiMessages.unshift({
          role: 'system',
          content: systemPrompt
        })
      }

      // Get context
      const context = this.getInput<object>('conversationContext') || {}

      // Call Claude API (using the api service)
      const response = await this.callClaudeAPI(apiMessages, context)
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        sender: 'Claude',
        metadata: {
          model: response.model || this.getInput('model'),
          tokensUsed: response.usage?.total_tokens
        }
      }
      
      this.messages.push(aiMessage)
      
      // Update outputs
      this.setOutput('messages', [...this.messages])
      this.setOutput('messageCount', this.messages.length)
      this.setOutput('lastResponse', {
        content: aiMessage.content,
        timestamp: aiMessage.timestamp,
        tokensUsed: aiMessage.metadata?.tokensUsed
      })
      
      // Emit event
      this.emit('messageReceived', aiMessage)
      
    } catch (error: any) {
      // Handle errors
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: `Error: ${error.message}`,
        role: 'system',
        timestamp: new Date(),
        sender: 'System',
        isError: true
      }
      
      this.messages.push(errorMessage)
      this.setOutput('messages', [...this.messages])
      
      this.emit('error', error)
      throw error
      
    } finally {
      this.isLoading = false
      this.setOutput('isLoading', false)
      this.abortController = null
    }
  }

  /**
   * Call Claude API (mock implementation - in real app would use api service)
   */
  private async callClaudeAPI(messages: any[], context: any): Promise<any> {
    // This would integrate with the actual API service
    // For now, return a mock response
    return {
      content: "I'm a mock response from Claude. In production, this would call the real API.",
      model: this.getInput('model'),
      usage: {
        total_tokens: 100
      }
    }
  }

  /**
   * Clear conversation
   */
  clearConversation(): void {
    this.messages = []
    this.conversationId = this.generateConversationId()
    
    this.setOutput('messages', [])
    this.setOutput('messageCount', 0)
    this.setOutput('conversationId', this.conversationId)
    
    this.emit('conversationCleared')
  }

  /**
   * Cancel ongoing request
   */
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.isLoading = false
      this.setOutput('isLoading', false)
    }
  }

  /**
   * Get conversation history
   */
  getConversation(): ChatMessage[] {
    return [...this.messages]
  }

  /**
   * Export conversation
   */
  exportConversation(): string {
    return JSON.stringify({
      id: this.conversationId,
      messages: this.messages,
      timestamp: new Date(),
      model: this.getInput('model')
    }, null, 2)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <AIChatInterfaceComponent construct={this} />
  }
}

/**
 * Chat message interface
 */
interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  sender: string
  isError?: boolean
  metadata?: {
    model?: string
    tokensUsed?: number
  }
}

/**
 * React component wrapper for the AI chat interface
 */
const AIChatInterfaceComponent: React.FC<{ construct: AIChatInterface }> = ({ construct }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Subscribe to changes
    const unsubscribeMessages = construct.on('messageReceived', () => {
      setMessages(construct.getConversation())
    })

    const unsubscribeLoading = construct.on('loadingStateChanged', (loading: boolean) => {
      setIsLoading(loading)
    })

    const unsubscribeClear = construct.on('conversationCleared', () => {
      setMessages([])
    })

    // Set initial outputs
    construct['setOutput']('conversationId', construct['conversationId'])

    return () => {
      unsubscribeMessages()
      unsubscribeLoading()
      unsubscribeClear()
    }
  }, [construct])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue('')
    
    try {
      await construct.sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user'
    const enableMarkdown = construct.getInput('enableMarkdown')
    
    // Create message content
    let content = message.content
    if (enableMarkdown && !isUser) {
      content = construct['renderMarkdown'](content)
    } else {
      content = construct['sanitizeContent'](content)
    }

    return (
      <div
        key={message.id}
        className={`message ${isUser ? 'user-message' : 'ai-message'} ${message.isError ? 'error-message' : ''}`}
        style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: isUser ? '#e3f2fd' : message.isError ? '#ffebee' : '#f5f5f5',
          maxWidth: '80%',
          marginLeft: isUser ? 'auto' : '0',
          marginRight: isUser ? '0' : 'auto'
        }}
      >
        <div className="message-header" style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{message.sender}</span>
          <span>{message.timestamp.toLocaleTimeString()}</span>
        </div>
        <div 
          className="message-content"
          dangerouslySetInnerHTML={enableMarkdown && !isUser ? { __html: content } : undefined}
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word'
          }}
        >
          {enableMarkdown && !isUser ? null : content}
        </div>
        {message.metadata?.tokensUsed && (
          <div className="message-metadata" style={{
            fontSize: '11px',
            color: '#999',
            marginTop: '4px'
          }}>
            Tokens: {message.metadata.tokensUsed}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="ai-chat-interface" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <div className="chat-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fafafa'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>AI Chat</h3>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Model: {construct.getInput('model')}
        </div>
      </div>

      <div className="chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#999',
            marginTop: '40px'
          }}>
            Start a conversation...
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="loading-indicator" style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="typing-indicator" style={{
                display: 'flex',
                gap: '4px'
              }}>
                <span style={typingDotStyle}>•</span>
                <span style={{ ...typingDotStyle, animationDelay: '0.2s' }}>•</span>
                <span style={{ ...typingDotStyle, animationDelay: '0.4s' }}>•</span>
              </div>
              <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>
                Claude is typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input" style={{
        padding: '16px',
        borderTop: '1px solid #eee',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={construct.getInput('placeholder')}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: !inputValue.trim() || isLoading ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Send
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => construct.clearConversation()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Typing indicator animation style
const typingDotStyle: React.CSSProperties = {
  display: 'inline-block',
  animation: 'typing 1.4s infinite',
  fontSize: '20px',
  color: '#666'
}

// Add CSS animation (would be in a stylesheet in production)
const style = document.createElement('style')
style.textContent = `
  @keyframes typing {
    0%, 60%, 100% {
      opacity: 0.3;
      transform: translateY(0);
    }
    30% {
      opacity: 1;
      transform: translateY(-10px);
    }
  }
  
  .ai-chat-interface pre {
    background-color: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .ai-chat-interface code {
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: monospace;
  }
`
document.head.appendChild(style)

// Export factory function
export const createAIChatInterface = () => new AIChatInterface()

// Export the definition for catalog registration
export const aiChatInterfaceDefinition = AIChatInterface.definition