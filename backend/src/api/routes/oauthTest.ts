import { Router } from 'express'
import { claudeCodeService } from '../../services/claudeCode.js'
import { authenticateFlexible } from '../../middleware/authMiddleware.js'

export const oauthTestRouter = Router()

// Test OAuth authentication with various endpoints
oauthTestRouter.post('/test', authenticateFlexible, async (req: any, res) => {
  try {
    const { message = 'Hello, can you hear me?' } = req.body
    const oauthToken = req.oauthToken
    
    if (!oauthToken) {
      return res.status(400).json({
        error: 'OAuth token required',
        message: 'This endpoint requires OAuth authentication'
      })
    }
    
    console.log('Testing OAuth authentication methods...')
    const results = await claudeCodeService.testOAuthWithEndpoints(oauthToken, message)
    
    res.json({
      message: 'OAuth authentication test results',
      results,
      summary: {
        totalTests: Object.keys(results).length,
        successful: Object.values(results).filter((r: any) => r.success).length,
        failed: Object.values(results).filter((r: any) => !r.success).length
      }
    })
  } catch (error: any) {
    console.error('OAuth test error:', error)
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    })
  }
})

// Get OAuth token info (for debugging)
oauthTestRouter.get('/info', authenticateFlexible, async (req: any, res) => {
  if (!req.oauthToken) {
    return res.status(400).json({
      error: 'OAuth token required',
      message: 'This endpoint requires OAuth authentication'
    })
  }
  
  // Parse JWT token (if it is one) without verification for inspection
  try {
    const parts = req.oauthToken.split('.')
    if (parts.length === 3) {
      // Looks like a JWT
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      return res.json({
        tokenType: 'JWT',
        payload,
        length: req.oauthToken.length,
        prefix: req.oauthToken.substring(0, 20) + '...'
      })
    } else {
      // Not a JWT
      return res.json({
        tokenType: 'Opaque',
        length: req.oauthToken.length,
        prefix: req.oauthToken.substring(0, 20) + '...'
      })
    }
  } catch (error) {
    return res.json({
      tokenType: 'Unknown',
      length: req.oauthToken.length,
      prefix: req.oauthToken.substring(0, 20) + '...',
      error: 'Failed to parse token'
    })
  }
})