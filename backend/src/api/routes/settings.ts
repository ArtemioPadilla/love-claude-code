import { Router } from 'express'
import { z } from 'zod'
import { validateRequest } from '../../middleware/validation.js'
import { authenticateToken } from './auth.js'
import crypto from 'crypto'

export const settingsRouter = Router()

// Apply authentication to all settings routes
settingsRouter.use(authenticateToken)

// In-memory settings storage (replace with proper database in production)
const userSettings = new Map<string, any>()

// Encryption helpers (in production, use AWS KMS or similar)
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long!'
const IV_LENGTH = 16

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    iv
  )
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encryptedText = Buffer.from(parts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    iv
  )
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

// Validation schemas
const settingsSchema = z.object({
  body: z.object({
    general: z.object({
      appName: z.string().optional(),
      theme: z.enum(['dark', 'light', 'system']).optional(),
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().min(10).max(300).optional(),
    }).optional(),
    ai: z.object({
      apiKey: z.string().optional(),
      model: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxTokens: z.number().min(100).max(8000).optional(),
    }).optional(),
    security: z.object({
      twoFactorEnabled: z.boolean().optional(),
    }).optional(),
    integrations: z.object({
      github: z.object({
        token: z.string().optional(),
      }).optional(),
    }).optional(),
  }),
})

// Get user settings
settingsRouter.get('/', async (req: any, res, next) => {
  try {
    const userId = req.userId
    const settings = userSettings.get(userId) || {}
    
    // Decrypt sensitive fields
    if (settings.ai?.apiKey) {
      try {
        settings.ai.apiKey = decrypt(settings.ai.apiKey)
      } catch (e) {
        // If decryption fails, clear the invalid key
        settings.ai.apiKey = ''
      }
    }
    
    res.json({ settings })
  } catch (error) {
    next(error)
  }
})

// Update user settings
settingsRouter.put('/', validateRequest(settingsSchema), async (req: any, res, next) => {
  try {
    const userId = req.userId
    const updates = req.body
    
    // Get existing settings
    const existingSettings = userSettings.get(userId) || {}
    
    // Merge with updates
    const newSettings = {
      ...existingSettings,
      ...updates,
    }
    
    // Encrypt sensitive fields
    if (updates.ai?.apiKey) {
      newSettings.ai.apiKey = encrypt(updates.ai.apiKey)
    }
    
    if (updates.integrations?.github?.token) {
      newSettings.integrations.github.token = encrypt(updates.integrations.github.token)
    }
    
    // Save settings
    userSettings.set(userId, newSettings)
    
    // Return settings without encrypted values
    const responseSettings = { ...newSettings }
    if (responseSettings.ai?.apiKey) {
      responseSettings.ai.apiKey = '***'
    }
    if (responseSettings.integrations?.github?.token) {
      responseSettings.integrations.github.token = '***'
    }
    
    res.json({ settings: responseSettings })
  } catch (error) {
    next(error)
  }
})

// Delete user settings
settingsRouter.delete('/', async (req: any, res, next) => {
  try {
    const userId = req.userId
    userSettings.delete(userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Validate API key
settingsRouter.post('/validate-api-key', async (req: any, res, next) => {
  try {
    const { apiKey } = req.body
    
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: 'API key required' })
    }
    
    // Basic format validation
    const isValidFormat = apiKey.startsWith('sk-ant-api03-') && apiKey.length > 50
    
    if (!isValidFormat) {
      return res.json({ valid: false, error: 'Invalid API key format' })
    }
    
    // In production, you could make a test call to Anthropic API
    // For now, just return success if format is valid
    res.json({ valid: true })
  } catch (error) {
    next(error)
  }
})

// Export function to get decrypted settings
export function getUserSettings(userId: string): any {
  const settings = userSettings.get(userId) || {}
  
  // Decrypt sensitive fields
  if (settings.ai?.apiKey) {
    try {
      settings.ai.apiKey = decrypt(settings.ai.apiKey)
    } catch (e) {
      settings.ai.apiKey = ''
    }
  }
  
  return settings
}