import { Request, Response } from 'express'
import { claudeCodeCLI } from '../services/claudeCodeCLI.js'
import { createError } from '../middleware/error.js'

interface ClaudeTerminalRequest {
  command: string[]
  context?: {
    files?: Array<{
      name: string
      content: string
      language?: string
    }>
  }
}

/**
 * Execute Claude Code CLI commands from the terminal interface
 */
export async function executeClaudeTerminal(req: Request, res: Response) {
  try {
    const { command, context } = req.body as ClaudeTerminalRequest
    
    // Check if Claude CLI is installed
    const isInstalled = await claudeCodeCLI.isInstalled()
    if (!isInstalled) {
      return res.status(500).json({
        error: 'Claude Code CLI not installed',
        message: 'Please install Claude Code CLI with: npm install -g @anthropic-ai/claude-code',
        code: 'CLAUDE_CLI_NOT_INSTALLED'
      })
    }
    
    // Parse command arguments
    const args = parseClaudeCommand(command, context)
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    
    // Send initial connection message
    res.write('data: {"type":"connected"}\n\n')
    
    try {
      // Stream the response
      await claudeCodeCLI.streamChat(
        args.prompt,
        (chunk) => {
          // Send chunk to client
          res.write(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
        },
        {
          model: args.model,
          maxTokens: args.maxTokens,
          temperature: args.temperature,
          systemPrompt: args.systemPrompt
        }
      )
      
      // Send completion message
      res.write('data: {"type":"done"}\n\n')
      res.end()
    } catch (streamError: any) {
      console.error('Claude CLI streaming error:', streamError)
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: streamError.message || 'Claude CLI streaming failed' 
      })}\n\n`)
      res.end()
    }
  } catch (error: any) {
    console.error('Claude terminal error:', error)
    
    // If headers haven't been sent, send error response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Terminal execution failed',
        message: error.message || 'Failed to execute Claude command',
        code: error.code || 'TERMINAL_ERROR'
      })
    } else {
      // If streaming has started, send error through SSE
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message || 'Terminal execution failed' 
      })}\n\n`)
      res.end()
    }
  }
}

/**
 * Parse Claude command arguments from terminal input
 */
function parseClaudeCommand(
  command: string[], 
  context?: ClaudeTerminalRequest['context']
): {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
} {
  const result: any = {}
  
  // Parse command line arguments
  let i = 0
  while (i < command.length) {
    const arg = command[i]
    
    switch (arg) {
      case '-p':
      case '--prompt':
        result.prompt = command[++i] || ''
        break
        
      case '-m':
      case '--model':
        result.model = command[++i]
        break
        
      case '-t':
      case '--temperature':
        const temp = parseFloat(command[++i])
        if (!isNaN(temp)) {
          result.temperature = temp
        }
        break
        
      case '--max-tokens':
        const tokens = parseInt(command[++i])
        if (!isNaN(tokens)) {
          result.maxTokens = tokens
        }
        break
        
      case '-f':
      case '--file':
        // File reference - look for it in context
        const fileName = command[++i]
        if (context?.files) {
          const file = context.files.find(f => f.name === fileName)
          if (file) {
            if (!result.prompt) result.prompt = ''
            result.prompt += `\n\nFile: ${file.name}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\`\n`
          }
        }
        break
        
      case '-s':
      case '--system':
        result.systemPrompt = command[++i]
        break
        
      default:
        // If no flag, assume it's part of the prompt
        if (!result.prompt && arg && !arg.startsWith('-')) {
          result.prompt = arg
        }
    }
    
    i++
  }
  
  // Add context files if no specific file was requested
  if (context?.files && context.files.length > 0 && !command.includes('-f') && !command.includes('--file')) {
    const file = context.files[0] // Use first file as context
    if (!result.prompt) result.prompt = ''
    result.prompt = `Context file: ${file.name}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\`\n\n${result.prompt}`
  }
  
  // Default prompt if none provided
  if (!result.prompt) {
    result.prompt = 'Hello! How can I help you with your code today?'
  }
  
  return result
}

/**
 * Get Claude CLI status and configuration
 */
export async function getClaudeTerminalStatus(req: Request, res: Response) {
  try {
    const isInstalled = await claudeCodeCLI.isInstalled()
    
    res.json({
      installed: isInstalled,
      version: isInstalled ? 'latest' : null,
      authenticated: isInstalled, // Assume authenticated if installed
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ]
    })
  } catch (error: any) {
    console.error('Failed to get Claude CLI status:', error)
    res.status(500).json({
      error: 'Status check failed',
      message: error.message || 'Failed to check Claude CLI status'
    })
  }
}