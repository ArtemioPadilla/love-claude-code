import { Router } from 'express'
import { z } from 'zod'
import { validateRequest } from '../../middleware/validation.js'
import { createError } from '../../middleware/error.js'
import { authenticateToken } from './auth.js'
import { mcpGenerator } from '../../services/mcpGenerator.js'

export const mcpUserRouter = Router()

// Apply authentication to all MCP routes
mcpUserRouter.use(authenticateToken)

// In-memory storage (replace with proper database in production)
const projects = new Map<string, any>()

// Validation schemas
const mcpConfigSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
})

const updateMCPConfigSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
  body: z.object({
    servers: z.record(z.object({
      command: z.string(),
      args: z.array(z.string()),
      env: z.record(z.string()).optional(),
    })).optional(),
    enabled: z.boolean().optional(),
  }),
})

const addMCPToolSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200),
    category: z.string().min(1).max(30),
    inputSchema: z.any(), // JSON schema for tool input
    implementation: z.string().optional(), // Optional code snippet
  }),
})

// Get MCP configuration for a project
mcpUserRouter.get('/:projectId/mcp/config', validateRequest(mcpConfigSchema), async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const project = projects.get(projectId)
    
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    // In production, this would read from the project's mcp.json
    const projectPath = `/projects/${projectId}`
    const mcpConfig = await mcpGenerator.getMCPConfig(projectPath)
    
    res.json({ 
      enabled: project.hasMCP || false,
      config: mcpConfig,
      hasSupport: mcpConfig !== null
    })
  } catch (error) {
    next(error)
  }
})

// Update MCP configuration
mcpUserRouter.put('/:projectId/mcp/config', validateRequest(updateMCPConfigSchema), async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const { servers, enabled } = req.body
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    // Update MCP enabled status
    if (enabled !== undefined) {
      project.hasMCP = enabled
      projects.set(projectId, project)
    }
    
    // Update MCP configuration if provided
    if (servers) {
      // In production, this would update the project's mcp.json
      console.log(`Updating MCP config for project ${projectId}`)
    }
    
    res.json({ 
      success: true,
      enabled: project.hasMCP
    })
  } catch (error) {
    next(error)
  }
})

// Get MCP tools for a project
mcpUserRouter.get('/:projectId/mcp/tools', validateRequest(mcpConfigSchema), async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const project = projects.get(projectId)
    
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    // In production, this would read tools from the project's MCP server
    const tools = [
      // Default tools based on project template
      { name: 'auth_login', category: 'auth', description: 'Log in a user' },
      { name: 'data_create', category: 'data', description: 'Create a data record' },
      { name: 'ui_navigate', category: 'ui', description: 'Navigate to a route' },
    ]
    
    res.json({ tools })
  } catch (error) {
    next(error)
  }
})

// Add a new MCP tool
mcpUserRouter.post('/:projectId/mcp/tools', validateRequest(addMCPToolSchema), async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const { name, description, category, inputSchema, implementation } = req.body
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    // In production, this would add the tool to the project's MCP server
    const tool = {
      id: `${category}_${name}`,
      name,
      description,
      category,
      inputSchema,
      implementation,
      createdAt: new Date().toISOString()
    }
    
    console.log(`Adding MCP tool ${tool.id} to project ${projectId}`)
    
    res.status(201).json({ tool })
  } catch (error) {
    next(error)
  }
})

// Delete an MCP tool
mcpUserRouter.delete('/:projectId/mcp/tools/:toolId', async (req: any, res, next) => {
  try {
    const { projectId, toolId } = req.params
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    // In production, this would remove the tool from the project's MCP server
    console.log(`Removing MCP tool ${toolId} from project ${projectId}`)
    
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Deploy/Build MCP server for a project
mcpUserRouter.post('/:projectId/mcp/deploy', validateRequest(mcpConfigSchema), async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    if (!project.hasMCP) {
      throw createError('Project does not have MCP enabled', 400, 'MCP_NOT_ENABLED')
    }
    
    // In production, this would:
    // 1. Build the MCP server (npm run build in mcp/)
    // 2. Run tests if any
    // 3. Update deployment status
    
    res.json({ 
      success: true,
      status: 'deployed',
      message: 'MCP server built and ready',
      buildTime: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// Test MCP tool execution
mcpUserRouter.post('/:projectId/mcp/test', async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const { tool, args } = req.body
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    // In production, this would execute the tool through the MCP server
    // For now, return mock response
    const mockResponse = {
      tool,
      args,
      result: {
        success: true,
        output: `Executed ${tool} with args: ${JSON.stringify(args)}`,
        timestamp: new Date().toISOString()
      }
    }
    
    res.json(mockResponse)
  } catch (error) {
    next(error)
  }
})