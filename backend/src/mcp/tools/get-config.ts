import { MCPToolResult } from '../types.js'
import { getProviderConfig } from '../../providers/factory.js'

export async function getProviderConfiguration(
  args: { projectId: string }
): Promise<MCPToolResult> {
  try {
    const config = getProviderConfig(args.projectId)
    
    // Remove sensitive information
    const sanitizedConfig = {
      ...config,
      credentials: config.credentials ? '[REDACTED]' : undefined
    }
    
    return {
      success: true,
      data: {
        projectId: args.projectId,
        provider: config.type,
        configuration: sanitizedConfig,
        isDefault: !config.credentials // Using environment defaults
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider configuration'
    }
  }
}