import { ProviderType, MCPToolResult, ProjectRequirements } from '../types.js'
import { providerCapabilities } from '../capabilities.js'
import { providerAdvisor } from '../advisor.js'

export async function compareProviders(
  args: {
    providers: ProviderType[]
    requirements?: ProjectRequirements
    features?: string[]
  }
): Promise<MCPToolResult> {
  try {
    const providersToCompare = args.providers.length > 0 ? args.providers : ['local', 'firebase', 'aws'] as ProviderType[]
    
    // Get recommendations if requirements provided
    let recommendations: Map<ProviderType, number> = new Map()
    if (args.requirements) {
      const recs = await providerAdvisor.analyzeAndRecommend(args.requirements)
      recs.forEach(r => recommendations.set(r.provider, r.score))
    }
    
    // Build comparison matrix
    const comparison = {
      overview: providersToCompare.map(provider => {
        const cap = providerCapabilities[provider]
        return {
          provider,
          name: cap.name,
          type: cap.type,
          description: cap.description,
          score: recommendations.get(provider) || 0,
          supportLevel: cap.supportLevel,
          pricingModel: cap.pricing.model
        }
      }),
      
      features: buildFeatureComparison(providersToCompare, args.features),
      
      pricing: providersToCompare.map(provider => {
        const cap = providerCapabilities[provider]
        return {
          provider,
          model: cap.pricing.model,
          freeTier: cap.pricing.freeTier,
          estimatedCost: args.requirements ? 
            calculateEstimatedCost(provider, args.requirements) : null
        }
      }),
      
      limitations: providersToCompare.map(provider => {
        const cap = providerCapabilities[provider]
        if (!cap) return { provider }
        
        return {
          provider,
          rateLimit: cap.limitations.rateLimit,
          concurrentUsers: cap.limitations.concurrentUsers,
          apiCalls: cap.limitations.apiCalls,
          customDomains: cap.limitations.customDomains,
          teamMembers: cap.limitations.teamMembers
        }
      }),
      
      bestFor: providersToCompare.map(provider => {
        const cap = providerCapabilities[provider]
        return {
          provider,
          useCases: cap ? cap.bestFor : []
        }
      }),
      
      compliance: providersToCompare.map(provider => {
        const cap = providerCapabilities[provider]
        return {
          provider,
          certifications: cap ? cap.compliance : []
        }
      }),
      
      regions: providersToCompare.map(provider => {
        const cap = providerCapabilities[provider]
        return {
          provider,
          available: cap ? cap.regions : []
        }
      })
    }
    
    // Generate summary
    const summary = generateComparisonSummary(comparison, args.requirements)
    
    return {
      success: true,
      data: {
        comparison,
        summary,
        recommendation: args.requirements && comparison.overview.length > 0 ? (() => {
          const topProvider = comparison.overview[0]!
          return `Based on your requirements, ${topProvider.name} (score: ${topProvider.score?.toFixed(2) || 'N/A'}) is the best fit`
        })() : 'Provide project requirements for personalized recommendations'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare providers'
    }
  }
}

function buildFeatureComparison(providers: ProviderType[], focusFeatures?: string[]): any {
  const allFeatures = [
    'auth.types', 'auth.mfa', 'auth.sso', 'auth.customProviders',
    'database.realtime', 'database.offline', 'database.transactions', 'database.backup',
    'storage.cdn', 'storage.encryption', 'storage.versioning', 'storage.streaming',
    'realtime.websockets', 'realtime.sse', 'realtime.pubsub', 'realtime.presence',
    'functions.languages', 'functions.triggers', 'functions.scheduling', 'functions.versioning',
    'notifications.push', 'notifications.email', 'notifications.sms', 'notifications.inApp'
  ]
  
  const featuresToCompare = focusFeatures || allFeatures
  
  return featuresToCompare.map(feature => {
    const featureParts = feature.split('.')
    const category = featureParts[0]
    const subFeature = featureParts[1]
    const comparison: any = { feature }
    
    providers.forEach(provider => {
      const cap = providerCapabilities[provider]
      if (!cap || !category) {
        comparison[provider] = false
        return
      }
      
      const categoryFeatures = (cap.features as any)[category]
      
      if (categoryFeatures && subFeature) {
        comparison[provider] = categoryFeatures[subFeature] || false
      } else {
        comparison[provider] = false
      }
    })
    
    return comparison
  })
}

function calculateEstimatedCost(provider: ProviderType, requirements: ProjectRequirements): {
  monthly: number
  yearly: number
  currency: string
} {
  // Simplified cost calculation based on requirements
  const baseCosts: Record<ProviderType, number> = {
    local: 0,
    firebase: 0,
    aws: 0
  }
  
  let monthlyCost = baseCosts[provider]
  
  // Add costs based on requirements
  if (provider === 'firebase') {
    if (requirements.expectedUsers > 10000) {
      monthlyCost += (requirements.expectedUsers - 10000) * 0.0001 // $0.0001 per user over 10k
    }
    if (requirements.dataVolume === 'high') {
      monthlyCost += 50 // Additional storage costs
    }
  } else if (provider === 'aws') {
    if (requirements.expectedUsers > 1000) {
      monthlyCost += Math.ceil(requirements.expectedUsers / 1000) * 10 // $10 per 1k users
    }
    if (requirements.dataVolume === 'high') {
      monthlyCost += 100 // S3 and data transfer costs
    }
    if (requirements.compliance.length > 0) {
      monthlyCost += 50 // Compliance features add cost
    }
  }
  
  return {
    monthly: monthlyCost,
    yearly: monthlyCost * 12,
    currency: 'USD'
  }
}

function generateComparisonSummary(comparison: any, requirements?: ProjectRequirements): string {
  const providers = comparison.overview
  
  let summary = `Comparing ${providers.length} providers:\n\n`
  
  // Best overall
  if (requirements && providers.length > 0) {
    const best = providers.reduce((a: any, b: any) => 
      (a.score || 0) > (b.score || 0) ? a : b
    )
    summary += `Best Overall: ${best.name} (Score: ${best.score?.toFixed(2) || 'N/A'})\n`
  }
  
  // Most affordable
  const mostAffordable = comparison.pricing.reduce((a: any, b: any) => {
    const aCost = a.estimatedCost?.monthly || 0
    const bCost = b.estimatedCost?.monthly || 0
    return aCost < bCost ? a : b
  })
  summary += `Most Affordable: ${mostAffordable.provider}\n`
  
  // Best support
  const bestSupport = providers.find((p: any) => p.supportLevel === 'enterprise') || 
                     providers.find((p: any) => p.supportLevel === 'professional') ||
                     providers[0]
  if (bestSupport) {
    summary += `Best Support: ${bestSupport.name} (${bestSupport.supportLevel})\n`
  }
  
  // Feature comparison
  const featureWinners: Record<string, number> = {}
  providers.forEach((p: any) => featureWinners[p.provider] = 0)
  
  comparison.features?.forEach((feature: any) => {
    providers.forEach((p: any) => {
      if (p?.provider && feature?.[p.provider] === true) {
        featureWinners[p.provider] = (featureWinners[p.provider] || 0) + 1
      }
    })
  })
  
  const mostFeatures = Object.entries(featureWinners)
    .reduce((a, b) => a[1] > b[1] ? a : b)
  summary += `Most Features: ${mostFeatures[0]} (${mostFeatures[1]} features)\n`
  
  return summary
}