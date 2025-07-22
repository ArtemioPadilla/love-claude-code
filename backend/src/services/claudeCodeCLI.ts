import { spawn } from 'child_process'
import { createError } from '../middleware/error.js'
import { Readable } from 'stream'

interface ClaudeCodeMessage {
  type: 'text' | 'error' | 'usage' | 'system'
  content?: string
  error?: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

/**
 * Claude Code CLI Wrapper Service
 * Executes Claude Code CLI commands and parses the output
 */
export class ClaudeCodeCLIService {
  private claudeCommand = 'claude'
  
  /**
   * Check if Claude Code CLI is installed
   */
  async isInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const check = spawn('which', [this.claudeCommand])
      check.on('close', (code) => {
        resolve(code === 0)
      })
      check.on('error', () => {
        resolve(false)
      })
    })
  }
  
  /**
   * Execute Claude Code with a prompt and get the response
   */
  async chat(
    prompt: string,
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
    } = {}
  ): Promise<string> {
    const isInstalled = await this.isInstalled()
    if (!isInstalled) {
      throw createError(
        'Claude Code CLI is not installed. Please install it with: npm install -g @anthropic-ai/claude-code',
        500,
        'CLAUDE_CLI_NOT_INSTALLED'
      )
    }
    
    return new Promise((resolve, reject) => {
      const args = [
        '-p', prompt,
        '--output-format', 'json'
      ]
      
      // Add model selection if specified
      if (options.model) {
        args.push('--model', options.model)
      }
      
      // Add max tokens if specified
      if (options.maxTokens) {
        args.push('--max-tokens', options.maxTokens.toString())
      }
      
      console.log('Executing Claude Code CLI:', this.claudeCommand, args.join(' '))
      
      const claude = spawn(this.claudeCommand, args)
      let output = ''
      let errorOutput = ''
      
      claude.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      claude.stderr.on('data', (data) => {
        errorOutput += data.toString()
        console.error('Claude CLI stderr:', data.toString())
      })
      
      claude.on('error', (error) => {
        console.error('Failed to execute Claude CLI:', error)
        reject(createError(
          `Failed to execute Claude Code CLI: ${error.message}`,
          500,
          'CLAUDE_CLI_EXECUTION_ERROR'
        ))
      })
      
      claude.on('close', (code) => {
        if (code !== 0) {
          console.error('Claude CLI exited with code:', code)
          console.error('Error output:', errorOutput)
          reject(createError(
            `Claude Code CLI exited with code ${code}: ${errorOutput || 'Unknown error'}`,
            500,
            'CLAUDE_CLI_ERROR'
          ))
          return
        }
        
        try {
          // Parse JSON output
          const result = JSON.parse(output)
          if (result.error) {
            reject(createError(
              `Claude Code error: ${result.error}`,
              500,
              'CLAUDE_CODE_ERROR'
            ))
            return
          }
          
          // Extract the response text
          const responseText = result.content || result.text || result.response || ''
          resolve(responseText)
        } catch (parseError) {
          // If not JSON, return raw output
          console.log('Claude CLI raw output:', output)
          resolve(output.trim())
        }
      })
    })
  }
  
  /**
   * Stream chat responses using Claude Code CLI
   */
  async streamChat(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
    } = {}
  ): Promise<void> {
    const isInstalled = await this.isInstalled()
    if (!isInstalled) {
      throw createError(
        'Claude Code CLI is not installed. Please install it with: npm install -g @anthropic-ai/claude-code',
        500,
        'CLAUDE_CLI_NOT_INSTALLED'
      )
    }
    
    return new Promise((resolve, reject) => {
      const args = [
        '-p', prompt,
        '--output-format', 'stream-json'
      ]
      
      // Add model selection if specified
      if (options.model) {
        args.push('--model', options.model)
      }
      
      // Add max tokens if specified
      if (options.maxTokens) {
        args.push('--max-tokens', options.maxTokens.toString())
      }
      
      console.log('Executing Claude Code CLI (streaming):', this.claudeCommand, args.join(' '))
      
      const claude = spawn(this.claudeCommand, args)
      let buffer = ''
      
      claude.stdout.on('data', (data) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        
        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          try {
            const message: ClaudeCodeMessage = JSON.parse(line)
            
            if (message.type === 'text' && message.content) {
              onChunk(message.content)
            } else if (message.type === 'error') {
              console.error('Claude Code stream error:', message.error)
              reject(createError(
                `Claude Code error: ${message.error}`,
                500,
                'CLAUDE_CODE_STREAM_ERROR'
              ))
              return
            }
          } catch (parseError) {
            console.error('Failed to parse Claude Code output:', line)
          }
        }
        
        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1]
      })
      
      claude.stderr.on('data', (data) => {
        console.error('Claude CLI stderr:', data.toString())
      })
      
      claude.on('error', (error) => {
        console.error('Failed to execute Claude CLI:', error)
        reject(createError(
          `Failed to execute Claude Code CLI: ${error.message}`,
          500,
          'CLAUDE_CLI_EXECUTION_ERROR'
        ))
      })
      
      claude.on('close', (code) => {
        if (code !== 0) {
          console.error('Claude CLI exited with code:', code)
          reject(createError(
            `Claude Code CLI exited with code ${code}`,
            500,
            'CLAUDE_CLI_ERROR'
          ))
          return
        }
        
        resolve()
      })
    })
  }
  
  /**
   * Convert chat messages to a single prompt for Claude Code CLI
   */
  formatMessagesAsPrompt(messages: Array<{ role: string; content: string }>, context?: any): string {
    let prompt = ''
    
    // Add context if provided
    if (context?.files && context.files.length > 0) {
      prompt += 'Context files:\n'
      context.files.forEach((file: any) => {
        prompt += `\n--- ${file.name} ---\n${file.content}\n`
      })
      prompt += '\n---\n\n'
    }
    
    // Convert message history to a prompt
    const conversation = messages.map(msg => {
      if (msg.role === 'user') {
        return `User: ${msg.content}`
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`
      }
      return msg.content
    }).join('\n\n')
    
    prompt += conversation
    
    // Add instruction for the assistant to continue
    if (messages[messages.length - 1].role === 'user') {
      prompt += '\n\nAssistant:'
    }
    
    return prompt
  }
}

// Export singleton instance
export const claudeCodeCLI = new ClaudeCodeCLIService()