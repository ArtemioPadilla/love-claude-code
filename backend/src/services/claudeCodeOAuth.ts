import fetch from 'node-fetch'
import { createError } from '../middleware/error.js'

/**
 * Alternative Claude API client for OAuth tokens
 * Based on OpenCode's implementation approach
 */
export class ClaudeCodeOAuthClient {
  private baseURL = 'https://api.anthropic.com/v1'
  
  async createMessage(
    messages: any[], 
    options: {
      model: string
      max_tokens: number
      temperature: number
      system?: string
      stream?: boolean
    },
    oauthToken: string
  ) {
    const url = `${this.baseURL}/messages`
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${oauthToken}`,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'oauth-2025-04-20',
      // Explicitly no x-api-key header as per OpenCode
    }
    
    const body = {
      model: options.model,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      system: options.system,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      stream: options.stream || false
    }
    
    console.log('Claude Code OAuth request:', {
      url,
      headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
      body: { ...body, messages: '[REDACTED]' }
    })
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
      
      const responseText = await response.text()
      
      if (!response.ok) {
        console.error('Claude Code OAuth error:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        })
        
        // Parse error response
        let errorMessage = 'Failed to call Claude API'
        let errorCode = 'CLAUDE_API_ERROR'
        
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
            
            // Check for specific Claude Code restriction
            if (errorMessage.includes('This credential is only authorized for use with Claude Code')) {
              errorCode = 'CLAUDE_CODE_RESTRICTION'
              console.log('Claude Code restriction detected - this OAuth approach may not work')
            }
          }
        } catch (e) {
          // If response is not JSON, use the text as error message
          errorMessage = responseText || errorMessage
        }
        
        throw createError(errorMessage, response.status, errorCode)
      }
      
      // Parse successful response
      const data = JSON.parse(responseText)
      return data
      
    } catch (error: any) {
      if (error.code) {
        // Re-throw our custom errors
        throw error
      }
      
      // Wrap other errors
      console.error('Claude Code OAuth request failed:', error)
      throw createError(
        `Claude API request failed: ${error.message}`,
        500,
        'CLAUDE_REQUEST_FAILED'
      )
    }
  }
  
  async createStreamingMessage(
    messages: any[],
    options: {
      model: string
      max_tokens: number
      temperature: number
      system?: string
    },
    oauthToken: string,
    onChunk: (chunk: string) => void
  ) {
    const url = `${this.baseURL}/messages`
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${oauthToken}`,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'oauth-2025-04-20',
      'Accept': 'text/event-stream',
    }
    
    const body = {
      model: options.model,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      system: options.system,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      stream: true
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Streaming error:', errorText)
        throw createError('Failed to start streaming', response.status, 'STREAM_ERROR')
      }
      
      if (!response.body) {
        throw createError('No response body', 500, 'NO_RESPONSE_BODY')
      }
      
      // Process streaming response
      const reader = response.body
      const decoder = new TextDecoder()
      let buffer = ''
      
      for await (const chunk of reader as any) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        
        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i]?.trim() || ''
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', data)
            }
          }
        }
        
        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1] || ''
      }
      
    } catch (error: any) {
      console.error('Streaming request failed:', error)
      throw error
    }
  }
}

export const claudeCodeOAuthClient = new ClaudeCodeOAuthClient()