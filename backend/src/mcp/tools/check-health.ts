import { MCPToolResult } from '../types.js'
import { getProvidersHealth } from '../../providers/factory.js'

export async function checkProviderHealth(
  _args: { projectId?: string }
): Promise<MCPToolResult> {
  try {
    const health = await getProvidersHealth()
    
    // Calculate overall health
    const providers = Object.entries(health)
    const healthyCount = providers.filter(([_, h]) => h.status === 'healthy').length
    const overallHealth = healthyCount === providers.length ? 'healthy' : 
                         healthyCount > 0 ? 'degraded' : 'unhealthy'
    
    return {
      success: true,
      data: {
        overall: overallHealth,
        providers: health,
        summary: {
          total: providers.length,
          healthy: healthyCount,
          unhealthy: providers.length - healthyCount
        },
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check provider health'
    }
  }
}