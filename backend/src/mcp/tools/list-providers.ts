import { MCPToolResult } from '../types.js'
import { providerCapabilities, getProvidersByFeature } from '../capabilities.js'

export async function listProviders(
  args: { feature?: string }
): Promise<MCPToolResult> {
  try {
    if (args.feature) {
      const providers = getProvidersByFeature(args.feature)
      const filtered = providers.map(p => ({
        ...providerCapabilities[p],
        type: p
      }))
      
      return {
        success: true,
        data: {
          providers: filtered,
          count: filtered.length,
          filteredBy: args.feature
        }
      }
    }
    
    // Return all providers
    const allProviders = Object.entries(providerCapabilities).map(([type, cap]) => ({
      type,
      name: cap.name,
      description: cap.description,
      pricing: cap.pricing.model,
      bestFor: cap.bestFor.slice(0, 3),
      supportLevel: cap.supportLevel
    }))
    
    return {
      success: true,
      data: {
        providers: allProviders,
        count: allProviders.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list providers'
    }
  }
}