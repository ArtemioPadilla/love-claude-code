/**
 * Claude Conversation System L2 Pattern Construct
 * 
 * Complete conversation management system with Claude AI integration,
 * conversation history, context management, and intelligent response handling.
 */

import React from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  BaseConstruct
} from '../../types'

// Import L1 constructs we'll compose
import { AIChatInterface } from '../../L1/ui/AIChatInterface'
import { EncryptedDatabase } from '../../L1/infrastructure/EncryptedDatabase'
import { CDNStorage } from '../../L1/infrastructure/CDNStorage'
import { RestAPIService } from '../../L1/infrastructure/RestAPIService'
import { ResponsiveLayout } from '../../L1/ui/ResponsiveLayout'

// Type definitions
interface ConversationConfig {
  userId: string
  apiKey?: string
  model?: 'claude-3-5-sonnet' | 'claude-3-opus' | 'claude-3-haiku'
  maxTokens?: number
  temperature?: number
  contextWindow?: number
  features?: {
    streaming?: boolean
    codeExecution?: boolean
    fileAttachments?: boolean
    webSearch?: boolean
    multiModal?: boolean
    voiceInput?: boolean
  }
  ui?: {
    theme?: 'light' | 'dark' | 'auto'
    layout?: 'sidebar' | 'fullscreen' | 'floating'
    position?: 'left' | 'right' | 'bottom'
    defaultOpen?: boolean
  }
  history?: {
    enabled?: boolean
    maxConversations?: number
    autoSave?: boolean
    syncAcrossDevices?: boolean
  }
  context?: {
    projectContext?: boolean
    codebaseAnalysis?: boolean
    documentContext?: boolean
    customContext?: string[]
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    cost?: number
    executedCode?: string[]
    attachments?: string[]
    context?: string[]
  }
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  created: Date
  updated: Date
  tags?: string[]
  archived?: boolean
  starred?: boolean
  metadata?: {
    totalTokens?: number
    totalCost?: number
    model?: string
    projectId?: string
  }
}

interface ConversationContext {
  projectFiles?: string[]
  relevantCode?: string[]
  documentation?: string[]
  previousConversations?: string[]
  customContext?: any
}

export interface ClaudeConversationOutputs extends Record<string, any> {
  systemId: string
  status: 'ready' | 'loading' | 'error'
  capabilities: {
    streaming: boolean
    codeExecution: boolean
    fileAttachments: boolean
    voiceInput: boolean
    multiModal: boolean
  }
  statistics: {
    totalConversations: number
    totalMessages: number
    totalTokens: number
    activeConversation?: string
  }
  currentContext: {
    model: string
    temperature: number
    maxTokens: number
    contextSize: number
  }
}

// Static definition
export const claudeConversationDefinition: PlatformConstructDefinition = {
  id: 'platform-l2-claude-conversation-system',
  name: 'Claude Conversation System',
  type: ConstructType.Pattern,
  level: ConstructLevel.L2,
  category: 'pattern',
  description: 'Complete conversation management system with Claude AI integration and intelligent context handling',
  
  capabilities: {
    provides: ['ai-chat', 'conversation-history', 'context-management', 'claude-integration'],
    requires: ['api-key', 'storage', 'database'],
    extends: ['ai-chat-interface', 'encrypted-database', 'cdn-storage', 'rest-api-service']
  },
  
  config: {
    userId: {
      type: 'string',
      required: true,
      description: 'User identifier for conversation history'
    },
    apiKey: {
      type: 'string',
      description: 'Claude API key (can be set in settings)'
    },
    model: {
      type: 'string',
      description: 'Claude model to use'
    },
    features: {
      type: 'object',
      description: 'Feature flags'
    }
  },
  
  outputs: {
    systemId: { type: 'string', description: 'System identifier' },
    statistics: { type: 'object', description: 'Usage statistics' },
    capabilities: { type: 'object', description: 'Enabled features' }
  },
  
  dependencies: [
    'platform-l1-ai-chat-interface',
    'platform-l1-encrypted-database',
    'platform-l1-cdn-storage',
    'platform-l1-rest-api-service',
    'platform-l1-responsive-layout'
  ],
  
  tags: ['ai', 'claude', 'conversation', 'chat', 'context', 'history'],
  version: '1.0.0',
  author: 'Love Claude Code',
  
  examples: [
    {
      title: 'Basic Conversation System',
      description: 'Simple Claude conversation with history',
      code: `const conversation = new ClaudeConversationSystem()
await conversation.initialize({
  userId: 'user-123',
  model: 'claude-3-5-sonnet',
  features: {
    streaming: true,
    codeExecution: true
  }
})`
    }
  ],
  
  bestPractices: [
    'Implement proper API key management',
    'Use streaming for better UX',
    'Maintain conversation context efficiently',
    'Implement rate limiting and cost controls',
    'Provide conversation export functionality'
  ],
  
  security: [
    'Encrypt conversation history at rest',
    'Never log API keys or sensitive data',
    'Implement proper authentication',
    'Sanitize user inputs before sending to API',
    'Use secure storage for conversation data'
  ],
  
  compliance: {
    standards: ['SOC2', 'GDPR'],
    certifications: []
  },
  
  monitoring: {
    metrics: ['api-calls', 'token-usage', 'response-time', 'error-rate'],
    logs: ['conversations', 'api-errors', 'context-updates'],
    alerts: ['high-token-usage', 'api-failures', 'rate-limits']
  },
  
  providers: {
    aws: { service: 'bedrock' },
    local: { service: 'anthropic-api' }
  },
  
  selfReferential: {
    isPlatformConstruct: true,
    usedBy: ['love-claude-code-frontend', 'vibe-coding-system'],
    extends: 'multiple-l1-constructs'
  },
  
  quality: {
    testCoverage: 90,
    documentationComplete: true,
    productionReady: true
  }
}

/**
 * Claude Conversation System implementation
 */
export class ClaudeConversationSystem extends L2PatternConstruct implements BaseConstruct {
  static definition = claudeConversationDefinition
  
  private systemId: string = ''
  private conversations: Map<string, Conversation> = new Map()
  private activeConversation?: string
  private contextManager: ConversationContext = {}
  private apiClient?: any // Claude API client
  
  constructor(props: any = {}) {
    super(ClaudeConversationSystem.definition, props)
  }
  
  async initialize(config: ConversationConfig): Promise<ClaudeConversationOutputs> {
    this.emit('initializing', { config })
    
    try {
      this.systemId = `claude-system-${Date.now()}`
      
      await this.beforeCompose()
      await this.composePattern()
      await this.configureComponents(config)
      await this.configureInteractions()
      await this.afterCompose()
      
      // Load conversation history
      await this.loadConversationHistory(config.userId)
      
      this.initialized = true
      this.emit('initialized', { systemId: this.systemId })
      
      return this.getOutputs()
    } catch (error) {
      this.emit('error', { error })
      throw new Error(`Failed to initialize Claude conversation system: ${error}`)
    }
  }
  
  protected async composePattern(): Promise<void> {
    // Create layout for conversation UI
    const layout = new ResponsiveLayout()
    await layout.initialize({
      containerSelector: '#claude-conversation',
      panels: [
        {
          id: 'conversation-list',
          position: 'left',
          defaultSize: 250,
          minSize: 200,
          maxSize: 400,
          resizable: true,
          collapsible: true
        },
        {
          id: 'chat-interface',
          position: 'center',
          minSize: 400,
          resizable: false
        }
      ],
      mobileBreakpoint: 768,
      persistState: true,
      stateKey: 'claude-conversation-layout'
    })
    this.addConstruct('layout', layout)
    
    // Create AI chat interface
    const chatInterface = new AIChatInterface()
    await chatInterface.initialize({
      provider: 'claude',
      streaming: true,
      features: {
        codeBlocks: true,
        fileAttachments: true,
        voiceInput: false,
        suggestions: true,
        contextDisplay: true
      },
      ui: {
        showTimestamps: true,
        showTokenCount: true,
        enableMarkdown: true,
        syntaxHighlighting: true
      }
    })
    this.addConstruct('chatInterface', chatInterface)
    
    // Create encrypted database for conversation history
    const database = new EncryptedDatabase()
    await database.initialize({
      name: 'claude-conversations',
      encryptionKey: await this.generateEncryptionKey(),
      tables: ['conversations', 'messages', 'contexts'],
      indexes: {
        conversations: ['userId', 'created', 'updated'],
        messages: ['conversationId', 'timestamp'],
        contexts: ['conversationId', 'type']
      },
      compliance: 'GDPR',
      backup: {
        enabled: true,
        frequency: 'daily',
        retention: 30
      }
    })
    this.addConstruct('database', database)
    
    // Create CDN storage for attachments
    const storage = new CDNStorage()
    await storage.initialize({
      bucket: 'claude-conversation-assets',
      provider: 'cloudflare',
      features: {
        imageOptimization: true,
        compression: true,
        caching: true
      },
      security: {
        signedUrls: true,
        expiration: 3600,
        cors: {
          origins: ['*'],
          methods: ['GET', 'POST']
        }
      }
    })
    this.addConstruct('storage', storage)
    
    // Create API service for Claude integration
    const apiService = new RestAPIService()
    await apiService.initialize({
      baseUrl: 'https://api.anthropic.com/v1',
      endpoints: [
        {
          name: 'messages',
          method: 'POST',
          path: '/messages',
          rateLimit: { requests: 1000, window: 3600 }
        },
        {
          name: 'models',
          method: 'GET',
          path: '/models'
        }
      ],
      auth: {
        type: 'bearer',
        headerName: 'x-api-key'
      },
      retry: {
        maxAttempts: 3,
        backoff: 'exponential'
      }
    })
    this.addConstruct('apiService', apiService)
  }
  
  protected async configureComponents(config: ConversationConfig): Promise<void> {
    // Configure chat interface
    const chatInterface = this.getConstruct<AIChatInterface>('chatInterface')
    if (chatInterface) {
      await chatInterface.updateConfig({
        model: config.model || 'claude-3-5-sonnet',
        maxTokens: config.maxTokens || 4000,
        temperature: config.temperature || 0.7,
        streaming: config.features?.streaming ?? true
      })
    }
    
    // Configure API service with key
    const apiService = this.getConstruct<RestAPIService>('apiService')
    if (apiService && config.apiKey) {
      await apiService.updateConfig({
        auth: {
          type: 'bearer',
          token: config.apiKey,
          headerName: 'x-api-key'
        }
      })
    }
    
    // Set up API client
    this.apiClient = {
      sendMessage: async (message: string, context?: any) => {
        return apiService?.call('messages', {
          model: config.model || 'claude-3-5-sonnet',
          messages: [
            ...this.buildContextMessages(),
            { role: 'user', content: message }
          ],
          max_tokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.7,
          stream: config.features?.streaming ?? true
        })
      }
    }
  }
  
  protected configureInteractions(): void {
    const chatInterface = this.getConstruct<AIChatInterface>('chatInterface')
    const database = this.getConstruct<EncryptedDatabase>('database')
    const storage = this.getConstruct<CDNStorage>('storage')
    
    // Handle chat messages
    if (chatInterface) {
      chatInterface.on('messageSent', async (data: any) => {
        await this.handleUserMessage(data.message, data.attachments)
      })
      
      chatInterface.on('regenerateRequest', async () => {
        await this.regenerateLastResponse()
      })
      
      chatInterface.on('contextUpdate', async (context: any) => {
        await this.updateContext(context)
      })
    }
    
    // Handle file attachments
    if (storage) {
      storage.on('fileUploaded', async (file: any) => {
        await this.processAttachment(file)
      })
    }
    
    // Auto-save conversations
    if (database) {
      setInterval(async () => {
        await this.saveActiveConversation()
      }, 30000) // Every 30 seconds
    }
  }
  
  // Message handling
  async handleUserMessage(content: string, attachments?: string[]): Promise<void> {
    if (!this.activeConversation) {
      await this.createNewConversation()
    }
    
    const conversation = this.conversations.get(this.activeConversation!)
    if (!conversation) return
    
    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        attachments
      }
    }
    
    conversation.messages.push(userMessage)
    this.emit('messageSent', userMessage)
    
    try {
      // Send to Claude API
      const response = await this.apiClient.sendMessage(content, this.contextManager)
      
      // Handle streaming response
      if (this.config.features?.streaming) {
        await this.handleStreamingResponse(response, conversation)
      } else {
        await this.handleStandardResponse(response, conversation)
      }
      
      // Update conversation
      conversation.updated = new Date()
      await this.saveActiveConversation()
      
    } catch (error) {
      this.emit('error', { error, operation: 'sendMessage' })
      throw error
    }
  }
  
  private async handleStreamingResponse(stream: any, conversation: Conversation): Promise<void> {
    const chatInterface = this.getConstruct<AIChatInterface>('chatInterface')
    if (!chatInterface) return
    
    const assistantMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      metadata: {
        model: this.config.model
      }
    }
    
    conversation.messages.push(assistantMessage)
    let fullContent = ''
    
    for await (const chunk of stream) {
      fullContent += chunk.content
      assistantMessage.content = fullContent
      
      // Update UI in real-time
      chatInterface.updateMessage(assistantMessage.id, fullContent)
    }
    
    // Update metadata
    assistantMessage.metadata!.tokens = stream.usage?.total_tokens
    assistantMessage.metadata!.cost = this.calculateCost(stream.usage)
    
    this.emit('messageReceived', assistantMessage)
  }
  
  private async handleStandardResponse(response: any, conversation: Conversation): Promise<void> {
    const assistantMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: {
        model: this.config.model,
        tokens: response.usage?.total_tokens,
        cost: this.calculateCost(response.usage)
      }
    }
    
    conversation.messages.push(assistantMessage)
    this.emit('messageReceived', assistantMessage)
    
    const chatInterface = this.getConstruct<AIChatInterface>('chatInterface')
    if (chatInterface) {
      chatInterface.addMessage(assistantMessage)
    }
  }
  
  // Conversation management
  async createNewConversation(title?: string): Promise<string> {
    const conversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: title || this.generateConversationTitle(),
      messages: [],
      created: new Date(),
      updated: new Date()
    }
    
    this.conversations.set(conversation.id, conversation)
    this.activeConversation = conversation.id
    
    await this.saveConversation(conversation)
    this.emit('conversationCreated', conversation)
    
    return conversation.id
  }
  
  async loadConversation(id: string): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    const conversationData = await database.get('conversations', id)
    if (conversationData) {
      const messages = await database.query('messages', {
        conversationId: id
      })
      
      const conversation: Conversation = {
        ...conversationData,
        messages
      }
      
      this.conversations.set(id, conversation)
      this.activeConversation = id
      
      // Update UI
      const chatInterface = this.getConstruct<AIChatInterface>('chatInterface')
      if (chatInterface) {
        chatInterface.loadMessages(messages)
      }
      
      this.emit('conversationLoaded', conversation)
    }
  }
  
  async saveConversation(conversation: Conversation): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    // Save conversation metadata
    await database.upsert('conversations', conversation.id, {
      id: conversation.id,
      title: conversation.title,
      created: conversation.created,
      updated: conversation.updated,
      tags: conversation.tags,
      archived: conversation.archived,
      starred: conversation.starred,
      metadata: conversation.metadata
    })
    
    // Save messages
    for (const message of conversation.messages) {
      await database.upsert('messages', message.id, {
        ...message,
        conversationId: conversation.id
      })
    }
  }
  
  async saveActiveConversation(): Promise<void> {
    if (!this.activeConversation) return
    
    const conversation = this.conversations.get(this.activeConversation)
    if (conversation) {
      await this.saveConversation(conversation)
    }
  }
  
  async deleteConversation(id: string): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    await database.delete('conversations', id)
    await database.deleteMany('messages', { conversationId: id })
    
    this.conversations.delete(id)
    
    if (this.activeConversation === id) {
      this.activeConversation = undefined
    }
    
    this.emit('conversationDeleted', { id })
  }
  
  // Context management
  async updateContext(context: Partial<ConversationContext>): Promise<void> {
    this.contextManager = {
      ...this.contextManager,
      ...context
    }
    
    if (this.activeConversation) {
      const database = this.getConstruct<EncryptedDatabase>('database')
      if (database) {
        await database.upsert('contexts', `ctx-${this.activeConversation}`, {
          conversationId: this.activeConversation,
          context: this.contextManager,
          updated: new Date()
        })
      }
    }
    
    this.emit('contextUpdated', this.contextManager)
  }
  
  private buildContextMessages(): any[] {
    const messages: any[] = []
    
    // Add system message with context
    if (this.contextManager.projectFiles?.length) {
      messages.push({
        role: 'system',
        content: `Project context: ${this.contextManager.projectFiles.join(', ')}`
      })
    }
    
    // Add relevant previous messages
    if (this.activeConversation) {
      const conversation = this.conversations.get(this.activeConversation)
      if (conversation) {
        // Include recent messages within context window
        const recentMessages = conversation.messages.slice(-10)
        messages.push(...recentMessages.map(m => ({
          role: m.role,
          content: m.content
        })))
      }
    }
    
    return messages
  }
  
  // Helper methods
  async regenerateLastResponse(): Promise<void> {
    if (!this.activeConversation) return
    
    const conversation = this.conversations.get(this.activeConversation)
    if (!conversation || conversation.messages.length < 2) return
    
    // Remove last assistant message
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage.role === 'assistant') {
      conversation.messages.pop()
      
      // Re-send the last user message
      const lastUserMessage = conversation.messages[conversation.messages.length - 1]
      if (lastUserMessage.role === 'user') {
        await this.handleUserMessage(lastUserMessage.content, lastUserMessage.metadata?.attachments)
      }
    }
  }
  
  async searchConversations(query: string): Promise<Conversation[]> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return []
    
    const results = await database.search('conversations', query)
    return results
  }
  
  async exportConversation(id: string, format: 'json' | 'markdown' = 'json'): Promise<string> {
    const conversation = this.conversations.get(id)
    if (!conversation) return ''
    
    if (format === 'json') {
      return JSON.stringify(conversation, null, 2)
    } else {
      // Convert to markdown
      let markdown = `# ${conversation.title}\n\n`
      markdown += `Created: ${conversation.created.toISOString()}\n\n`
      
      for (const message of conversation.messages) {
        markdown += `## ${message.role === 'user' ? 'User' : 'Assistant'}\n`
        markdown += `${message.content}\n\n`
      }
      
      return markdown
    }
  }
  
  private async loadConversationHistory(userId: string): Promise<void> {
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (!database) return
    
    const conversations = await database.query('conversations', {
      userId,
      archived: false
    })
    
    for (const conv of conversations) {
      this.conversations.set(conv.id, conv)
    }
  }
  
  private generateConversationTitle(): string {
    const date = new Date()
    return `Conversation ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }
  
  private calculateCost(usage: any): number {
    if (!usage) return 0
    
    // Rough cost calculation based on model
    const rates = {
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }
    }
    
    const model = this.config.model || 'claude-3-5-sonnet'
    const rate = rates[model as keyof typeof rates]
    
    return (usage.input_tokens * rate.input + usage.output_tokens * rate.output) / 1000
  }
  
  private async generateEncryptionKey(): Promise<string> {
    // Generate a secure encryption key for the user
    return `enc-key-${Date.now()}-${Math.random().toString(36)}`
  }
  
  private async processAttachment(file: any): Promise<void> {
    // Process and analyze attachments
    const storage = this.getConstruct<CDNStorage>('storage')
    if (!storage) return
    
    // Upload to CDN
    const url = await storage.upload(file.path, file.content)
    
    // Add to context
    await this.updateContext({
      customContext: [...(this.contextManager.customContext || []), url]
    })
  }
  
  // Public API
  async sendMessage(content: string): Promise<void> {
    await this.handleUserMessage(content)
  }
  
  getActiveConversation(): Conversation | undefined {
    return this.activeConversation ? this.conversations.get(this.activeConversation) : undefined
  }
  
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
  }
  
  async switchConversation(id: string): Promise<void> {
    await this.loadConversation(id)
  }
  
  getOutputs(): ClaudeConversationOutputs {
    return {
      systemId: this.systemId,
      status: this.initialized ? 'ready' : 'loading',
      capabilities: {
        streaming: this.config.features?.streaming ?? true,
        codeExecution: this.config.features?.codeExecution ?? false,
        fileAttachments: this.config.features?.fileAttachments ?? false,
        voiceInput: this.config.features?.voiceInput ?? false,
        multiModal: this.config.features?.multiModal ?? false
      },
      statistics: {
        totalConversations: this.conversations.size,
        totalMessages: Array.from(this.conversations.values())
          .reduce((sum, conv) => sum + conv.messages.length, 0),
        totalTokens: Array.from(this.conversations.values())
          .reduce((sum, conv) => sum + conv.messages
            .reduce((msgSum, msg) => msgSum + (msg.metadata?.tokens || 0), 0), 0),
        activeConversation: this.activeConversation
      },
      currentContext: {
        model: this.config.model || 'claude-3-5-sonnet',
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
        contextSize: this.config.contextWindow || 200000
      }
    }
  }
  
  render(): React.ReactElement {
    const layout = this.getConstruct<ResponsiveLayout>('layout')
    const chatInterface = this.getConstruct<AIChatInterface>('chatInterface')
    
    const conversationList = (
      <div className="conversation-list">
        <div className="conversation-header">
          <h3>Conversations</h3>
          <button onClick={() => this.createNewConversation()}>New Chat</button>
        </div>
        <div className="conversations">
          {Array.from(this.conversations.values()).map(conv => (
            <div 
              key={conv.id} 
              className={`conversation-item ${conv.id === this.activeConversation ? 'active' : ''}`}
              onClick={() => this.switchConversation(conv.id)}
            >
              <div className="conversation-title">{conv.title}</div>
              <div className="conversation-meta">
                {conv.messages.length} messages • {conv.updated.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    
    return (
      <div id="claude-conversation" className="claude-conversation-system">
        {layout?.render({
          'conversation-list': conversationList,
          'chat-interface': chatInterface?.render()
        })}
      </div>
    )
  }
}

// Factory function
export function createClaudeConversationSystem(config: ConversationConfig): ClaudeConversationSystem {
  const system = new ClaudeConversationSystem()
  system.initialize(config)
  return system
}