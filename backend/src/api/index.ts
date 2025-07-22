import { Router } from 'express'
import { filesRouter } from './routes/files.js'
import { claudeRouter } from './routes/claude.js'
import { authRouter } from './routes/auth.js'
import { projectsRouter } from './routes/projects.js'
import { settingsRouter } from './routes/settings.js'
import { oauthRouter } from './routes/oauth.js'
import { oauthTestRouter } from './routes/oauthTest.js'
import mcpRouter from './routes/mcp.js'
import { mcpUserRouter } from './routes/mcp-user.js'
import { mcpTestRouter } from './routes/mcp-test.js'
import { executeClaudeTerminal, getClaudeTerminalStatus } from './terminalClaude.js'
import { authenticateFlexible } from '../middleware/authMiddleware.js'

export const apiRouter = Router()

// API version prefix
const v1Router = Router()

// Mount routes
v1Router.use('/auth', authRouter)
v1Router.use('/files', filesRouter)
v1Router.use('/claude', claudeRouter)
v1Router.use('/projects', projectsRouter)
v1Router.use('/settings', settingsRouter)
v1Router.use('/oauth', oauthRouter)
v1Router.use('/oauth-test', oauthTestRouter)
v1Router.use('/mcp', mcpRouter)
v1Router.use('/mcp-test', mcpTestRouter)

// Terminal Claude endpoints
v1Router.post('/terminal/claude', authenticateFlexible, executeClaudeTerminal)
// Status endpoint doesn't require auth when checking for CLI - it just checks if CLI is installed
v1Router.get('/terminal/claude/status', getClaudeTerminalStatus)

// User project MCP routes (nested under projects)
v1Router.use('/projects', mcpUserRouter)

// Mount v1 router
apiRouter.use('/v1', v1Router)

// API root info
apiRouter.get('/', (_, res) => {
  res.json({
    message: 'Love Claude Code API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      files: '/api/v1/files',
      claude: '/api/v1/claude',
      projects: '/api/v1/projects',
      settings: '/api/v1/settings',
      oauth: '/api/v1/oauth',
      mcp: '/api/v1/mcp',
      terminal: '/api/v1/terminal',
    },
  })
})