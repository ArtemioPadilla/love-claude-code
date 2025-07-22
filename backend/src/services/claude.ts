import Anthropic from '@anthropic-ai/sdk'
import { createError } from '../middleware/error.js'
import { getUserSettings } from '../api/routes/settings.js'
import { claudeCodeOAuthClient } from './claudeCodeOAuth.js'
import { claudeCodeCLI } from './claudeCodeCLI.js'

class ClaudeService {
  private mockMode: boolean

  constructor() {
    this.mockMode = process.env.CLAUDE_MOCK_MODE === 'true'
  }

  private async getClient(userId?: string, oauthToken?: string): Promise<Anthropic | null> {
    // If OAuth token is provided, try the OpenCode approach
    if (oauthToken) {
      console.log('OAuth token detected - trying OpenCode approach with beta header')
      
      // Create Anthropic client with OAuth token and special headers
      return new Anthropic({
        apiKey: oauthToken,
        defaultHeaders: {
          'Authorization': `Bearer ${oauthToken}`,
          'anthropic-beta': 'oauth-2025-04-20',
          // Remove x-api-key header as per OpenCode approach
          'x-api-key': undefined
        }
      })
    }
    
    // First, try to get API key from user settings
    if (userId && userId !== 'oauth-user') {
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

  async chat(messages: any[], context?: any, userId?: string, oauthToken?: string): Promise<string> {
    try {
      // Only use mock mode if explicitly enabled
      if (this.mockMode) {
        // Return mock response for development
        return this.generateMockResponse(messages, context)
      }
      
      // Check if using Claude Code CLI authentication
      if (userId === 'claude-cli-user') {
        console.log('Claude Code CLI authentication detected, using CLI directly')
        const isCliInstalled = await claudeCodeCLI.isInstalled()
        
        if (isCliInstalled) {
          try {
            const modelSettings = this.getModelSettings(userId)
            const systemPrompt = this.buildSystemPrompt(context)
            const prompt = claudeCodeCLI.formatMessagesAsPrompt(messages, context)
            const response = await claudeCodeCLI.chat(prompt, {
              model: modelSettings.model,
              maxTokens: modelSettings.maxTokens,
              temperature: modelSettings.temperature,
              systemPrompt: systemPrompt
            })
            return response
          } catch (cliError: any) {
            console.error('Claude Code CLI failed:', cliError)
            throw createError(
              'Claude Code CLI error: ' + cliError.message,
              500,
              'CLAUDE_CLI_ERROR'
            )
          }
        } else {
          throw createError(
            'Claude Code CLI is not installed. Please install it with: npm install -g @anthropic-ai/claude-code',
            503,
            'CLAUDE_CLI_NOT_INSTALLED'
          )
        }
      }

      // Log authentication method for debugging
      console.log('Claude chat request:', {
        hasUserId: !!userId,
        hasOauthToken: !!oauthToken,
        authMethod: oauthToken ? 'oauth' : 'api-key',
        messagesCount: messages.length
      })

      const client = await this.getClient(userId, oauthToken)
      if (!client) {
        throw createError('Claude API not configured. Please add your API key in Settings or authenticate with Claude Max.', 503, 'SERVICE_UNAVAILABLE')
      }

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context)
      const modelSettings = this.getModelSettings(userId)

      console.log('Calling Claude API with model:', modelSettings.model)

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
    } catch (error: any) {
      console.error('Claude API error:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
        authMethod: oauthToken ? 'oauth' : 'api-key'
      })
      
      // Provide more specific error messages
      if (error.status === 401) {
        const authMethod = oauthToken ? 'OAuth token' : 'API key'
        throw createError(
          `Authentication failed. Your ${authMethod} may be invalid or expired. Please check your settings.`,
          401,
          'AUTH_FAILED'
        )
      } else if (error.status === 403) {
        throw createError(
          'Access denied. Please check your API permissions.',
          403,
          'ACCESS_DENIED'
        )
      } else if (error.message?.includes('This credential is only authorized for use with Claude Code')) {
        console.error('Claude Code restriction detected - trying alternative OAuth approach')
        
        // Try alternative OAuth approach
        if (oauthToken) {
          try {
            console.log('Attempting Claude Code OAuth client approach...')
            const modelSettings = this.getModelSettings(userId)
            const systemPrompt = this.buildSystemPrompt(context)
            
            const response = await claudeCodeOAuthClient.createMessage(
              messages,
              {
                model: modelSettings.model,
                max_tokens: modelSettings.maxTokens,
                temperature: modelSettings.temperature,
                system: systemPrompt
              },
              oauthToken
            )
            
            return response.content[0].type === 'text' 
              ? response.content[0].text 
              : 'I apologize, but I couldn\'t generate a response.'
          } catch (altError: any) {
            console.error('Alternative OAuth approach also failed:', altError)
            
            // Try Claude Code CLI as final fallback
            console.log('Attempting Claude Code CLI approach...')
            const isCliInstalled = await claudeCodeCLI.isInstalled()
            
            if (isCliInstalled) {
              try {
                console.log('Claude Code CLI is installed, using CLI wrapper')
                const modelSettings = this.getModelSettings(userId)
                const systemPrompt = this.buildSystemPrompt(context)
                const prompt = claudeCodeCLI.formatMessagesAsPrompt(messages, context)
                const response = await claudeCodeCLI.chat(prompt, {
                  model: modelSettings.model,
                  maxTokens: modelSettings.maxTokens,
                  temperature: modelSettings.temperature,
                  systemPrompt: systemPrompt
                })
                return response
              } catch (cliError: any) {
                console.error('Claude Code CLI approach also failed:', cliError)
              }
            } else {
              console.log('Claude Code CLI is not installed')
            }
            
            throw createError(
              'OAuth authentication is not supported. Please use an API key from console.anthropic.com or install Claude Code CLI.',
              403,
              'OAUTH_NOT_SUPPORTED'
            )
          }
        }
        
        throw createError(
          'OAuth token is restricted to Claude Code only.',
          403,
          'CLAUDE_CODE_RESTRICTION'
        )
      } else if (error.message?.includes('oauth') || error.message?.includes('OAuth')) {
        throw createError(
          'OAuth authentication issue. Please try re-authenticating or use an API key.',
          400,
          'INVALID_AUTH_METHOD'
        )
      }
      
      throw createError(
        `Claude API error: ${error.message || 'Unknown error occurred'}`,
        error.status || 500,
        'CLAUDE_ERROR'
      )
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
      `I understand you want help with: "${lastMessage}". While OAuth authentication is connected, I'm using mock responses as OAuth tokens from claude.ai cannot be used with the Anthropic SDK.\n\nTo get real Claude responses, please use an API key from console.anthropic.com instead.`,
      `Based on your request about "${lastMessage}", I'd love to help! However, OAuth tokens from claude.ai are designed for the consumer chat interface and don't work with the developer API.\n\nFor now, please use API keys for full functionality.`,
      `Great question about "${lastMessage}"! Unfortunately, I can only provide mock responses when using OAuth authentication.\n\nThe OAuth tokens from claude.ai cannot be used with the Anthropic developer SDK. Please switch to API key authentication in Settings for real Claude responses.`,
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]

    if (context?.files && context.files.length > 0) {
      return `${response}\n\nI can see you're working with ${context.files.length} file(s), but I can only provide limited assistance in mock mode.`
    }

    return response
  }

  async streamChat(messages: any[], context?: any, onChunk: (chunk: string) => void, userId?: string, oauthToken?: string): Promise<void> {
    try {
      // Only use mock mode if explicitly enabled
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
      
      // Check if using Claude Code CLI authentication
      if (userId === 'claude-cli-user') {
        console.log('Claude Code CLI authentication detected, using CLI directly for streaming')
        const isCliInstalled = await claudeCodeCLI.isInstalled()
        
        if (isCliInstalled) {
          try {
            const modelSettings = this.getModelSettings(userId)
            const systemPrompt = this.buildSystemPrompt(context)
            const prompt = claudeCodeCLI.formatMessagesAsPrompt(messages, context)
            await claudeCodeCLI.streamChat(
              prompt,
              onChunk,
              {
                model: modelSettings.model,
                maxTokens: modelSettings.maxTokens,
                temperature: modelSettings.temperature,
                systemPrompt: systemPrompt
              }
            )
            return
          } catch (cliError: any) {
            console.error('Claude Code CLI streaming failed:', cliError)
            throw createError(
              'Claude Code CLI error: ' + cliError.message,
              500,
              'CLAUDE_CLI_ERROR'
            )
          }
        } else {
          throw createError(
            'Claude Code CLI is not installed. Please install it with: npm install -g @anthropic-ai/claude-code',
            503,
            'CLAUDE_CLI_NOT_INSTALLED'
          )
        }
      }

      // Log authentication method for debugging
      console.log('Claude stream chat request:', {
        hasUserId: !!userId,
        hasOauthToken: !!oauthToken,
        authMethod: oauthToken ? 'oauth' : 'api-key',
        messagesCount: messages.length
      })

      const client = await this.getClient(userId, oauthToken)
      if (!client) {
        throw createError('Claude API not configured. Please add your API key in Settings or authenticate with Claude Max.', 503, 'SERVICE_UNAVAILABLE')
      }

      const systemPrompt = this.buildSystemPrompt(context)
      const modelSettings = this.getModelSettings(userId)

      console.log('Streaming from Claude API with model:', modelSettings.model)

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
    } catch (error: any) {
      console.error('Claude streaming error:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
        authMethod: oauthToken ? 'oauth' : 'api-key'
      })
      
      // Provide more specific error messages
      if (error.status === 401) {
        const authMethod = oauthToken ? 'OAuth token' : 'API key'
        throw createError(
          `Authentication failed. Your ${authMethod} may be invalid or expired. Please check your settings.`,
          401,
          'AUTH_FAILED'
        )
      } else if (error.status === 403) {
        throw createError(
          'Access denied. Please check your API permissions.',
          403,
          'ACCESS_DENIED'
        )
      } else if (error.message?.includes('This credential is only authorized for use with Claude Code')) {
        console.error('Claude Code restriction detected - trying alternative OAuth approach')
        
        // Try alternative OAuth approach
        if (oauthToken) {
          try {
            console.log('Attempting Claude Code OAuth client streaming approach...')
            const modelSettings = this.getModelSettings(userId)
            const systemPrompt = this.buildSystemPrompt(context)
            
            await claudeCodeOAuthClient.createStreamingMessage(
              messages,
              {
                model: modelSettings.model,
                max_tokens: modelSettings.maxTokens,
                temperature: modelSettings.temperature,
                system: systemPrompt
              },
              oauthToken,
              onChunk
            )
            return
          } catch (altError: any) {
            console.error('Alternative OAuth streaming approach also failed:', altError)
            
            // Try Claude Code CLI as final fallback
            console.log('Attempting Claude Code CLI streaming approach...')
            const isCliInstalled = await claudeCodeCLI.isInstalled()
            
            if (isCliInstalled) {
              try {
                console.log('Claude Code CLI is installed, using CLI wrapper for streaming')
                const modelSettings = this.getModelSettings(userId)
                const systemPrompt = this.buildSystemPrompt(context)
                const prompt = claudeCodeCLI.formatMessagesAsPrompt(messages, context)
                await claudeCodeCLI.streamChat(
                  prompt,
                  onChunk,
                  {
                    model: modelSettings.model,
                    maxTokens: modelSettings.maxTokens,
                    temperature: modelSettings.temperature,
                    systemPrompt: systemPrompt
                  }
                )
                return
              } catch (cliError: any) {
                console.error('Claude Code CLI streaming approach also failed:', cliError)
              }
            } else {
              console.log('Claude Code CLI is not installed')
            }
            
            throw createError(
              'OAuth authentication is not supported. Please use an API key from console.anthropic.com or install Claude Code CLI.',
              403,
              'OAUTH_NOT_SUPPORTED'
            )
          }
        }
        
        throw createError(
          'OAuth token is restricted to Claude Code only.',
          403,
          'CLAUDE_CODE_RESTRICTION'
        )
      } else if (error.message?.includes('oauth') || error.message?.includes('OAuth')) {
        throw createError(
          'OAuth authentication issue. Please try re-authenticating or use an API key.',
          400,
          'INVALID_AUTH_METHOD'
        )
      }
      
      throw createError(
        `Claude streaming error: ${error.message || 'Unknown error occurred'}`,
        error.status || 500,
        'CLAUDE_STREAM_ERROR'
      )
    }
  }
}

export const claudeService = new ClaudeService()