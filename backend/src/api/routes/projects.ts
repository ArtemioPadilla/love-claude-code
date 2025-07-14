import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { validateRequest } from '../../middleware/validation.js'
import { createError } from '../../middleware/error.js'
import { authenticateToken } from './auth.js'
import { mcpGenerator } from '../../services/mcpGenerator.js'

export const projectsRouter = Router()

// Apply authentication to all project routes
projectsRouter.use(authenticateToken)

// In-memory project storage (replace with proper database in production)
const projects = new Map<string, any>()

// Validation schemas
const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    template: z.enum(['blank', 'react', 'vue', 'node', 'python']).optional(),
    includeMCP: z.boolean().optional(),
    mcpOptions: z.object({
      includeAuthTools: z.boolean().optional(),
      includeDataTools: z.boolean().optional(),
      includeUITools: z.boolean().optional(),
      customTools: z.array(z.object({
        name: z.string(),
        description: z.string(),
        category: z.string()
      })).optional()
    }).optional(),
  }),
})

const updateProjectSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
})

// Get all projects for the authenticated user
projectsRouter.get('/', async (req: any, res, next) => {
  try {
    const userProjects = Array.from(projects.values()).filter(
      project => project.userId === req.userId
    )
    
    res.json({ projects: userProjects })
  } catch (error) {
    next(error)
  }
})

// Get a specific project
projectsRouter.get('/:projectId', async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const project = projects.get(projectId)
    
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    res.json({ project })
  } catch (error) {
    next(error)
  }
})

// Create a new project
projectsRouter.post('/', validateRequest(createProjectSchema), async (req: any, res, next) => {
  try {
    const { name, description, template, includeMCP, mcpOptions } = req.body
    
    const project = {
      id: uuidv4(),
      name,
      description: description || '',
      template: template || 'blank',
      userId: req.userId,
      hasMCP: includeMCP || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    projects.set(project.id, project)
    
    // Create initial files based on template
    if (template && template !== 'blank') {
      // This would create template files in production
      console.log(`Creating ${template} template files for project ${project.id}`)
    }
    
    // Generate MCP server if requested
    if (includeMCP && mcpOptions) {
      try {
        // In production, this would use the actual project path
        const projectPath = `/projects/${project.id}`
        await mcpGenerator.generateMCPServer({
          projectName: name,
          projectPath,
          ...mcpOptions
        })
        console.log(`Generated MCP server for project ${project.id}`)
      } catch (error) {
        console.error('Failed to generate MCP server:', error)
        // Don't fail project creation if MCP generation fails
      }
    }
    
    res.status(201).json({ project })
  } catch (error) {
    next(error)
  }
})

// Update a project
projectsRouter.put('/:projectId', validateRequest(updateProjectSchema), async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    const { name, description } = req.body
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    if (name) project.name = name
    if (description !== undefined) project.description = description
    project.updatedAt = new Date().toISOString()
    
    projects.set(projectId, project)
    
    res.json({ project })
  } catch (error) {
    next(error)
  }
})

// Delete a project
projectsRouter.delete('/:projectId', async (req: any, res, next) => {
  try {
    const { projectId } = req.params
    
    const project = projects.get(projectId)
    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }
    
    if (project.userId !== req.userId) {
      throw createError('Access denied', 403, 'ACCESS_DENIED')
    }
    
    projects.delete(projectId)
    
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})