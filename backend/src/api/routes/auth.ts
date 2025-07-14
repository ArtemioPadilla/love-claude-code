import { Router } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { validateRequest } from '../../middleware/validation.js'
import { createError } from '../../middleware/error.js'

export const authRouter = Router()

// Mock user storage (replace with proper database in production)
const users = new Map<string, any>()

// Validation schemas
const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
  }),
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
})

// Sign up
authRouter.post('/signup', validateRequest(signupSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body

    // Check if user exists
    const existingUser = Array.from(users.values()).find(u => u.email === email)
    if (existingUser) {
      throw createError('User already exists', 409, 'USER_EXISTS')
    }

    // Create user (in production, hash the password!)
    const user = {
      id: uuidv4(),
      email,
      password, // WARNING: Never store plain passwords in production!
      name,
      createdAt: new Date().toISOString(),
    }

    users.set(user.id, user)

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
})

// Login
authRouter.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email)
    if (!user || user.password !== password) {
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Generate token
    const token = generateToken(user.id)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
})

// Get auth info (public endpoint)
authRouter.get('/', async (_req, res) => {
  res.json({
    message: 'Authentication endpoint',
    endpoints: {
      signup: 'POST /api/v1/auth/signup',
      login: 'POST /api/v1/auth/login',
      me: 'GET /api/v1/auth/me (requires authentication)',
    },
    authentication: {
      type: 'Bearer',
      header: 'Authorization',
      format: 'Bearer <token>',
    },
  })
})

// Get current user
authRouter.get('/me', authenticateToken, async (req: any, res, next) => {
  try {
    const user = users.get(req.userId)
    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND')
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Helper functions
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'development-secret-change-in-production'
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

export function authenticateToken(req: any, res: any, next: any) {
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
        help: 'Please login again via POST /api/v1/auth/login'
      })
    }
    req.userId = payload.userId
    next()
  })
}