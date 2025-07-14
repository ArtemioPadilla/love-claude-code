import { Router } from 'express'
import { z } from 'zod'
import { validateRequest } from '../../middleware/validation.js'
import { createError } from '../../middleware/error.js'
import { fileSystemService } from '../../services/fileSystem.js'

export const filesRouter = Router()

// Get files info (public endpoint)
filesRouter.get('/', async (_req, res) => {
  res.json({
    message: 'Files endpoint',
    endpoints: {
      tree: 'GET /api/v1/files/tree - Get file tree structure',
      read: 'GET /api/v1/files/read?path=<path> - Read file contents',
      create: 'POST /api/v1/files - Create new file',
      update: 'PUT /api/v1/files - Update file contents',
      delete: 'DELETE /api/v1/files?path=<path> - Delete file',
      createFolder: 'POST /api/v1/files/folder - Create new folder',
      rename: 'POST /api/v1/files/rename - Rename file or folder',
    },
    note: 'Files are stored in workspace directory on server',
  })
})

// Validation schemas
const createFileSchema = z.object({
  body: z.object({
    path: z.string().min(1),
    content: z.string().default(''),
  }),
})

const updateFileSchema = z.object({
  body: z.object({
    path: z.string().min(1),
    content: z.string(),
  }),
})

const createFolderSchema = z.object({
  body: z.object({
    path: z.string().min(1),
  }),
})

const renameSchema = z.object({
  body: z.object({
    oldPath: z.string().min(1),
    newPath: z.string().min(1),
  }),
})

// Get file tree structure
filesRouter.get('/tree', async (_req, res, next) => {
  try {
    const tree = await fileSystemService.getFileTree()
    res.json({ tree })
  } catch (error) {
    next(error)
  }
})

// Read a specific file
filesRouter.get('/read', async (req, res, next) => {
  try {
    const { path } = req.query
    
    if (!path || typeof path !== 'string') {
      throw createError('Path is required', 400, 'PATH_REQUIRED')
    }
    
    const content = await fileSystemService.readFile(path)
    res.json({ 
      path,
      content,
      language: detectLanguage(path)
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      next(createError('File not found', 404, 'FILE_NOT_FOUND'))
    } else {
      next(error)
    }
  }
})

// Create a new file
filesRouter.post('/', validateRequest(createFileSchema), async (req, res, next) => {
  try {
    const { path, content } = req.body
    
    const file = await fileSystemService.createFile(path, content)
    
    res.status(201).json({ file })
  } catch (error) {
    next(error)
  }
})

// Update file contents
filesRouter.put('/', validateRequest(updateFileSchema), async (req, res, next) => {
  try {
    const { path, content } = req.body
    
    await fileSystemService.writeFile(path, content)
    
    res.json({ 
      success: true,
      path,
      message: 'File updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Delete a file or folder
filesRouter.delete('/', async (req, res, next) => {
  try {
    const { path } = req.query
    
    if (!path || typeof path !== 'string') {
      throw createError('Path is required', 400, 'PATH_REQUIRED')
    }
    
    await fileSystemService.deleteFile(path)
    
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      next(createError('File not found', 404, 'FILE_NOT_FOUND'))
    } else {
      next(error)
    }
  }
})

// Create a new folder
filesRouter.post('/folder', validateRequest(createFolderSchema), async (req, res, next) => {
  try {
    const { path } = req.body
    
    const folder = await fileSystemService.createFolder(path)
    
    res.status(201).json({ folder })
  } catch (error) {
    next(error)
  }
})

// Rename file or folder
filesRouter.post('/rename', validateRequest(renameSchema), async (req, res, next) => {
  try {
    const { oldPath, newPath } = req.body
    
    await fileSystemService.renameFile(oldPath, newPath)
    
    res.json({ 
      success: true,
      oldPath,
      newPath,
      message: 'Renamed successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Helper function to detect language from filename
function detectLanguage(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    kt: 'kotlin',
    swift: 'swift',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
  }
  
  return languageMap[extension || ''] || 'plaintext'
}