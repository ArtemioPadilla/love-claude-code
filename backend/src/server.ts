import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { errorHandler } from './middleware/error.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import { apiRouter } from './api/index.js'

// Load environment variables
dotenv.config({ path: '../.env.local' })

const app = express()
const httpServer = createServer(app)
const PORT = process.env.API_PORT || 8000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll configure this properly for the preview iframe
}))

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))

// Request logging
app.use(morgan('dev'))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use('/api', rateLimiter)

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api', apiRouter)

// 404 handler
app.use((_, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handling
app.use(errorHandler)

// Start server
httpServer.listen(PORT, () => {
  console.log(`✨ Backend server running on http://localhost:${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
})