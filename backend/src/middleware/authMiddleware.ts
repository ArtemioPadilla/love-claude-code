import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  userId?: string
  authMethod?: 'jwt' | 'oauth' | 'claude-code-cli'
  oauthToken?: string
}

/**
 * Flexible authentication middleware that supports both JWT and OAuth tokens
 */
export function authenticateFlexible(req: AuthRequest, res: Response, next: NextFunction) {
  // Check for Claude Code CLI auth first
  const claudeCliHeader = req.headers['x-claude-cli'] as string
  if (claudeCliHeader === 'true') {
    req.authMethod = 'claude-code-cli'
    req.userId = 'claude-cli-user' // Generic user ID for CLI users
    return next()
  }
  
  // Check for OAuth token (X-Claude-Auth header)
  const oauthHeader = req.headers['x-claude-auth'] as string
  if (oauthHeader && oauthHeader.startsWith('Bearer ')) {
    const oauthToken = oauthHeader.slice(7)
    
    console.log('OAuth authentication detected:', {
      hasToken: !!oauthToken,
      tokenLength: oauthToken.length,
      tokenPrefix: oauthToken.substring(0, 10) + '...'
    })
    
    // For OAuth, we don't have a user ID, but we have the token
    req.authMethod = 'oauth'
    req.oauthToken = oauthToken
    req.userId = 'oauth-user' // Placeholder user ID for OAuth
    
    return next()
  }
  
  // Check for JWT token (Authorization header)
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide a valid Bearer token in either Authorization header (JWT) or X-Claude-Auth header (OAuth)',
      code: 'NO_AUTH_TOKEN',
      help: 'Login via POST /api/v1/auth/login for JWT token or authenticate with Claude Max OAuth'
    })
  }
  
  const secret = process.env.JWT_SECRET || 'development-secret-change-in-production'
  
  jwt.verify(token, secret, (err: any, payload: any) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: 'Your authentication token is invalid or has expired',
        code: 'INVALID_TOKEN',
        help: 'Please login again to get a new token'
      })
    }
    
    req.userId = payload.userId
    req.authMethod = 'jwt'
    next()
  })
}

/**
 * Strict JWT-only authentication (for user-specific endpoints)
 */
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide a valid Bearer token in the Authorization header',
      code: 'NO_AUTH_TOKEN',
      help: 'Login via POST /api/v1/auth/login to receive a token'
    })
  }
  
  const secret = process.env.JWT_SECRET || 'development-secret-change-in-production'
  
  jwt.verify(token, secret, (err: any, payload: any) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: 'Your authentication token is invalid or has expired',
        code: 'INVALID_TOKEN',
        help: 'Please login again to get a new token'
      })
    }
    
    req.userId = payload.userId
    req.authMethod = 'jwt'
    next()
  })
}