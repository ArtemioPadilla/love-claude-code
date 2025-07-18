import { Router } from 'express'
import { z } from 'zod'
import { validateRequest } from '../../middleware/validation.js'
import { claudeRateLimiter } from '../../middleware/rateLimiter.js'
import { claudeService } from '../../services/claude.js'
import { authenticateToken } from './auth.js'

export const claudeRouter = Router()

// Apply authentication and Claude-specific rate limiting
claudeRouter.use(authenticateToken)
claudeRouter.use(claudeRateLimiter)

// Validation schemas
const chatSchema = z.object({
  body: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })),
    context: z.object({
      files: z.array(z.object({
        name: z.string(),
        content: z.string(),
        language: z.string().optional(),
      })).optional(),
      projectId: z.string().uuid().optional(),
    }).optional(),
    stream: z.boolean().optional().default(true),
  }),
})

// Chat endpoint
claudeRouter.post('/chat', validateRequest(chatSchema), async (req: any, res, next) => {
  try {
    const { messages, context, stream } = req.body
    const userId = req.userId // From auth middleware

    if (stream) {
      // Set up SSE headers for streaming
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')

      // Send initial connection message
      res.write('data: {"type":"connected"}\n\n')

      try {
        await claudeService.streamChat(
          messages,
          context,
          (chunk: string) => {
            res.write(`data: {"type":"content","content":${JSON.stringify(chunk)}}\n\n`)
          },
          userId
        )
        
        res.write('data: {"type":"done"}\n\n')
        res.end()
      } catch (error: any) {
        res.write(`data: {"type":"error","error":${JSON.stringify(error.message)}}\n\n`)
        res.end()
      }

      // Clean up on client disconnect
      req.on('close', () => {
        res.end()
      })
    } else {
      // Non-streaming response
      const response = await claudeService.chat(messages, context, userId)
      res.json({ response })
    }
  } catch (error) {
    next(error)
  }
})

// Get available models
claudeRouter.get('/models', async (_, res, next) => {
  try {
    const models = [
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Most capable model for complex tasks',
        contextWindow: 200000,
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fast and efficient for simple tasks',
        contextWindow: 200000,
      },
    ]
    
    res.json({ models })
  } catch (error) {
    next(error)
  }
})