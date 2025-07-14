import { Router, Request, Response } from 'express'
import { 
  analyzeProjectRequirements,
  listProviders,
  getProviderConfiguration,
  switchProvider,
  estimateCosts,
  checkProviderHealth,
  migrateData,
  compareProviders
} from '../../mcp/tools/index.js'
import { ProviderType, ProjectRequirements } from '../../mcp/types.js'

const router = Router()

/**
 * MCP API Routes
 * Provides REST endpoints for Model Context Protocol tools
 */

// Analyze project requirements
router.post('/analyze-requirements', async (req: Request, res: Response) => {
  try {
    const { projectType, expectedUsers, expectedTraffic, dataVolume, features, compliance, budget } = req.body
    
    const requirements: ProjectRequirements = {
      projectType: projectType || 'web',
      expectedUsers: expectedUsers || 1000,
      expectedTraffic: expectedTraffic || '10000/month',
      dataVolume: dataVolume || '10GB',
      features: features || {
        authentication: true,
        realtime: false,
        fileStorage: false,
        serverless: false,
        notifications: false,
        analytics: false,
        search: false,
        ml: false
      },
      compliance: compliance || [],
      budget: budget
    }
    
    const result = await analyzeProjectRequirements(requirements)
    
    return res.json(result)
  } catch (error) {
    console.error('Error analyzing requirements:', error)
    return res.status(500).json({ 
      error: 'Failed to analyze requirements',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// List available providers
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const result = await listProviders({})
    return res.json(result)
  } catch (error) {
    console.error('Error listing providers:', error)
    return res.status(500).json({ 
      error: 'Failed to list providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get provider configuration
router.get('/providers/:provider/config', async (req: Request, res: Response) => {
  try {
    // const { provider } = req.params // Provider param available but not needed
    // Get projectId from query params or use default
    const projectId = (req.query.projectId as string) || 'default-project'
    const result = await getProviderConfiguration({ projectId })
    return res.json(result)
  } catch (error) {
    console.error('Error getting provider configuration:', error)
    return res.status(500).json({ 
      error: 'Failed to get provider configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Switch provider
router.post('/providers/switch', async (req: Request, res: Response) => {
  try {
    const { projectId, fromProvider, toProvider, options } = req.body
    
    if (!projectId || !fromProvider || !toProvider) {
      return res.status(400).json({ 
        error: 'projectId, fromProvider, and toProvider are required' 
      })
    }
    
    const result = await switchProvider({
      projectId,
      newProvider: toProvider as ProviderType,
      migrate: options?.migrate || false
    })
    
    return res.json(result)
  } catch (error) {
    console.error('Error switching provider:', error)
    return res.status(500).json({ 
      error: 'Failed to switch provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Estimate costs
router.post('/estimate-costs', async (req: Request, res: Response) => {
  try {
    const { requirements, providers } = req.body
    
    if (!requirements) {
      return res.status(400).json({ error: 'Requirements are required' })
    }
    
    const result = await estimateCosts({
      requirements,
      providers: providers || undefined
    })
    
    return res.json(result)
  } catch (error) {
    console.error('Error estimating costs:', error)
    return res.status(500).json({ 
      error: 'Failed to estimate costs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Check provider health
router.get('/providers/:provider/health', async (req: Request, res: Response) => {
  try {
    // const { provider } = req.params // Provider param available but not needed
    const { projectId } = req.query
    
    const result = await checkProviderHealth({
      projectId: projectId as string
    })
    
    return res.json(result)
  } catch (error) {
    console.error('Error checking provider health:', error)
    return res.status(500).json({ 
      error: 'Failed to check provider health',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Migrate data between providers
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { projectId, sourceProvider, targetProvider, options } = req.body
    
    if (!projectId || !sourceProvider || !targetProvider) {
      return res.status(400).json({ 
        error: 'projectId, sourceProvider, and targetProvider are required' 
      })
    }
    
    const result = await migrateData({
      projectId,
      fromProvider: sourceProvider as ProviderType,
      toProvider: targetProvider as ProviderType,
      execute: options?.execute || false,
      options: options || {}
    })
    
    return res.json(result)
  } catch (error) {
    console.error('Error migrating data:', error)
    return res.status(500).json({ 
      error: 'Failed to migrate data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Compare providers
router.post('/providers/compare', async (req: Request, res: Response) => {
  try {
    const { providers, requirements } = req.body
    
    if (!providers || providers.length < 2) {
      return res.status(400).json({ 
        error: 'At least two providers are required for comparison' 
      })
    }
    
    const result = await compareProviders({
      providers: providers as ProviderType[],
      requirements
    })
    
    return res.json(result)
  } catch (error) {
    console.error('Error comparing providers:', error)
    return res.status(500).json({ 
      error: 'Failed to compare providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    service: 'mcp-api',
    timestamp: new Date().toISOString()
  })
})

// List available MCP tools
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    tools: [
      {
        name: 'analyze-requirements',
        description: 'Analyze project requirements and extract key features',
        method: 'POST',
        path: '/api/v1/mcp/analyze-requirements'
      },
      {
        name: 'list-providers',
        description: 'List available backend providers',
        method: 'GET',
        path: '/api/v1/mcp/providers'
      },
      {
        name: 'get-provider-config',
        description: 'Get configuration for a specific provider',
        method: 'GET',
        path: '/api/v1/mcp/providers/:provider/config'
      },
      {
        name: 'switch-provider',
        description: 'Switch between backend providers',
        method: 'POST',
        path: '/api/v1/mcp/providers/switch'
      },
      {
        name: 'estimate-costs',
        description: 'Estimate costs for a provider',
        method: 'POST',
        path: '/api/v1/mcp/estimate-costs'
      },
      {
        name: 'check-provider-health',
        description: 'Check health status of a provider',
        method: 'GET',
        path: '/api/v1/mcp/providers/:provider/health'
      },
      {
        name: 'migrate-data',
        description: 'Migrate data between providers',
        method: 'POST',
        path: '/api/v1/mcp/migrate'
      },
      {
        name: 'compare-providers',
        description: 'Compare multiple providers',
        method: 'POST',
        path: '/api/v1/mcp/providers/compare'
      }
    ]
  })
})

// Root MCP endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Love Claude Code MCP API',
    version: '1.0.0',
    description: 'Model Context Protocol tools for multi-provider management',
    endpoints: {
      health: '/api/v1/mcp/health',
      tools: '/api/v1/mcp/tools',
      providers: '/api/v1/mcp/providers'
    }
  })
})

export default router