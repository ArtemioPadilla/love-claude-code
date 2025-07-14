import Anthropic from '@anthropic-ai/sdk'
import { createError } from '../middleware/error.js'
import { getUserSettings } from '../api/routes/settings.js'

class ClaudeService {
  private mockMode: boolean

  constructor() {
    this.mockMode = process.env.CLAUDE_MOCK_MODE === 'true'
  }

  private async getClient(userId?: string): Promise<Anthropic | null> {
    // First, try to get API key from user settings
    if (userId) {
      const settings = getUserSettings(userId)
      if (settings.ai?.apiKey) {
        return new Anthropic({
          apiKey: settings.ai.apiKey,
        })
      }
    }
    
    // Fall back to environment variable
    if (process.env.ANTHROPIC_API_KEY) {
      return new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
    
    return null
  }

  private getModelSettings(userId?: string) {
    if (userId) {
      const settings = getUserSettings(userId)
      if (settings.ai) {
        return {
          model: settings.ai.model || 'claude-3-5-sonnet-20241022',
          maxTokens: settings.ai.maxTokens || 4000,
          temperature: settings.ai.temperature ?? 0.7,
        }
      }
    }
    
    // Fall back to environment variables
    return {
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
    }
  }

  async chat(messages: any[], context?: any, userId?: string): Promise<string> {
    try {
      if (this.mockMode) {
        // Return mock response for development
        return this.generateMockResponse(messages, context)
      }

      const client = await this.getClient(userId)
      if (!client) {
        throw createError('Claude API not configured. Please add your API key in Settings.', 503, 'SERVICE_UNAVAILABLE')
      }

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context)
      const modelSettings = this.getModelSettings(userId)

      // Call Claude API
      const response = await client.messages.create({
        model: modelSettings.model,
        max_tokens: modelSettings.maxTokens,
        temperature: modelSettings.temperature,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      })

      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'I apologize, but I couldn\'t generate a response.'
    } catch (error) {
      console.error('Claude API error:', error)
      throw createError('Failed to get response from Claude', 500, 'CLAUDE_ERROR')
    }
  }

  private buildSystemPrompt(context?: any): string {
    let prompt = `You are an AI coding assistant integrated into Love Claude Code IDE. 
You help users write, debug, and understand code. Be concise but thorough in your responses.`

    if (context?.files && context.files.length > 0) {
      prompt += '\n\nContext files:\n'
      context.files.forEach((file: any) => {
        prompt += `\n--- ${file.name} ---\n${file.content}\n`
      })
    }

    return prompt
  }

  private generateMockResponse(messages: any[], context?: any): string {
    const lastMessage = messages[messages.length - 1]?.content || ''
    
    const responses = [
      `I understand you want help with: "${lastMessage}". Here's what I suggest...`,
      `Based on your request about "${lastMessage}", let me provide some guidance...`,
      `Great question about "${lastMessage}"! Here's my approach...`,
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]

    if (context?.files && context.files.length > 0) {
      return `${response}\n\nI can see you're working with ${context.files.length} file(s). Let me analyze them and provide specific suggestions.`
    }

    return response
  }

  async streamChat(messages: any[], context?: any, onChunk: (chunk: string) => void, userId?: string): Promise<void> {
    if (this.mockMode) {
      // Mock streaming
      const response = this.generateMockResponse(messages, context)
      const words = response.split(' ')
      
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 50))
        onChunk(word + ' ')
      }
      return
    }

    const client = await this.getClient(userId)
    if (!client) {
      throw createError('Claude API not configured. Please add your API key in Settings.', 503, 'SERVICE_UNAVAILABLE')
    }

    const systemPrompt = this.buildSystemPrompt(context)
    const modelSettings = this.getModelSettings(userId)

    const stream = await client.messages.create({
      model: modelSettings.model,
      max_tokens: modelSettings.maxTokens,
      temperature: modelSettings.temperature,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      stream: true,
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        onChunk(chunk.delta.text)
      }
    }
  }
}

export const claudeService = new ClaudeService()