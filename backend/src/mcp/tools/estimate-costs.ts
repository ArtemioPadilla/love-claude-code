import { ProjectRequirements, ProviderType, MCPToolResult } from '../types.js'
import { providerAdvisor } from '../advisor.js'
import { providerCapabilities } from '../capabilities.js'

export async function estimateCosts(
  args: {
    requirements: ProjectRequirements
    providers?: ProviderType[]
  }
): Promise<MCPToolResult> {
  try {
    const providersToEstimate = args.providers || ['local', 'firebase', 'aws'] as ProviderType[]
    const recommendations = await providerAdvisor.analyzeAndRecommend(args.requirements)
    
    const costEstimates = providersToEstimate.map(provider => {
      const recommendation = recommendations.find(r => r.provider === provider)
      const capabilities = providerCapabilities[provider]
      
      return {
        provider,
        name: capabilities.name,
        pricing: {
          model: capabilities.pricing.model,
          estimated: recommendation?.estimatedCost || {
            monthly: 0,
            yearly: 0,
            currency: 'USD',
            breakdown: {}
          }
        },
        freeTier: capabilities.pricing.freeTier,
        notes: generateCostNotes(provider, args.requirements)
      }
    })
    
    // Sort by monthly cost
    costEstimates.sort((a, b) => 
      a.pricing.estimated.monthly - b.pricing.estimated.monthly
    )
    
    return {
      success: true,
      data: {
        estimates: costEstimates,
        summary: {
          cheapest: costEstimates[0],
          mostExpensive: costEstimates[costEstimates.length - 1],
          recommendation: `For ${args.requirements.expectedUsers} users and ${args.requirements.dataVolume} of data, ` +
            `${costEstimates[0].provider} would be the most cost-effective at $${costEstimates[0].pricing.estimated.monthly}/month`
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate costs'
    }
  }
}

function generateCostNotes(provider: ProviderType, requirements: ProjectRequirements): string[] {
  const notes: string[] = []
  
  switch (provider) {
    case 'local':
      notes.push('No cloud costs - runs on your infrastructure')
      notes.push('Consider server/hosting costs separately')
      break
      
    case 'firebase':
      if (requirements.expectedUsers > 50000) {
        notes.push('Costs increase significantly after free tier')
      }
      notes.push('Pay-as-you-go model scales with usage')
      notes.push('Includes CDN and global infrastructure')
      break
      
    case 'aws':
      notes.push('12-month free tier for new accounts')
      notes.push('Costs can be optimized with reserved instances')
      notes.push('Additional costs for data transfer between regions')
      if (requirements.compliance.length > 0) {
        notes.push('Compliance features may require additional services')
      }
      break
  }
  
  return notes
}