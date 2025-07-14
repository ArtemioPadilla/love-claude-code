import { 
  ProjectRequirements, 
  ProviderRecommendation, 
  ProviderType,
  ProviderCapabilities 
} from './types.js'
import { providerCapabilities } from './capabilities.js'

export class ProviderAdvisor {
  /**
   * Analyze project requirements and recommend the best provider
   */
  async analyzeAndRecommend(
    requirements: ProjectRequirements
  ): Promise<ProviderRecommendation[]> {
    const recommendations: ProviderRecommendation[] = []
    
    // Analyze each provider
    for (const [type, capabilities] of Object.entries(providerCapabilities)) {
      const provider = type as ProviderType
      const score = this.calculateScore(requirements, capabilities)
      const cost = this.estimateCost(requirements, capabilities)
      const reasoning = this.generateReasoning(requirements, capabilities)
      
      recommendations.push({
        provider,
        score,
        reasoning: reasoning.reasons,
        pros: reasoning.pros,
        cons: reasoning.cons,
        estimatedCost: cost,
        migrationEffort: this.calculateMigrationEffort(requirements, provider),
        alternativeProviders: []
      })
    }
    
    // Sort by score
    recommendations.sort((a, b) => b.score - a.score)
    
    // Add alternatives to each recommendation
    for (const rec of recommendations) {
      rec.alternativeProviders = this.getAlternatives(rec, recommendations)
    }
    
    return recommendations
  }
  
  private calculateScore(
    requirements: ProjectRequirements,
    capabilities: ProviderCapabilities
  ): number {
    let score = 50 // Base score
    
    // Project type match
    if (this.isProjectTypeMatch(requirements.projectType, capabilities)) {
      score += 10
    }
    
    // Scale requirements
    if (requirements.expectedUsers <= 1000 && capabilities.type === 'local') {
      score += 20
    } else if (requirements.expectedUsers <= 100000 && capabilities.type === 'firebase') {
      score += 15
    } else if (requirements.expectedUsers > 100000 && capabilities.type === 'aws') {
      score += 20
    }
    
    // Feature requirements
    const requiredFeatures = Object.entries(requirements.features)
      .filter(([_, needed]) => needed)
      .map(([feature]) => feature)
    
    for (const feature of requiredFeatures) {
      if (this.hasFeature(feature, capabilities)) {
        score += 5
      } else {
        score -= 10
      }
    }
    
    // Compliance requirements
    for (const compliance of requirements.compliance) {
      if (capabilities.compliance.includes(compliance)) {
        score += 10
      } else if (capabilities.type !== 'local') {
        score -= 20 // Heavy penalty for missing compliance
      }
    }
    
    // Budget considerations
    if (requirements.budget) {
      const estimatedCost = this.estimateCost(requirements, capabilities)
      if (estimatedCost.monthly <= requirements.budget.monthly) {
        score += 10
      } else if (estimatedCost.monthly > requirements.budget.monthly * 2) {
        score -= 20
      }
    }
    
    // Regional requirements
    if (requirements.preferredRegions) {
      const hasRegion = requirements.preferredRegions.some(region =>
        capabilities.regions.includes(region)
      )
      if (hasRegion) {
        score += 5
      }
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  private isProjectTypeMatch(
    projectType: ProjectRequirements['projectType'],
    capabilities: ProviderCapabilities
  ): boolean {
    const typeMatches: Record<string, ProviderType[]> = {
      'web': ['firebase', 'aws'],
      'mobile': ['firebase', 'aws'],
      'desktop': ['local', 'aws'],
      'api': ['aws', 'firebase'],
      'hybrid': ['firebase', 'aws']
    }
    
    return typeMatches[projectType]?.includes(capabilities.type) || false
  }
  
  private hasFeature(feature: string, capabilities: ProviderCapabilities): boolean {
    switch (feature) {
      case 'authentication':
        return capabilities.features.auth.methods.length > 0
      case 'realtime':
        return capabilities.features.realtime.protocol === 'websocket'
      case 'fileStorage':
        return !!capabilities.features.storage.maxFileSize
      case 'serverless':
        return capabilities.features.functions.runtime.length > 0
      case 'notifications':
        return !!capabilities.features.notifications
      case 'analytics':
        return capabilities.type === 'firebase' || capabilities.type === 'aws'
      case 'search':
        return capabilities.features.database.search
      case 'ml':
        return capabilities.type === 'aws' // AWS has SageMaker
      default:
        return false
    }
  }
  
  private estimateCost(
    requirements: ProjectRequirements,
    capabilities: ProviderCapabilities
  ): ProviderRecommendation['estimatedCost'] {
    const breakdown: Record<string, number> = {}
    let monthly = 0
    
    if (capabilities.pricing.model === 'free') {
      return {
        monthly: 0,
        yearly: 0,
        currency: 'USD',
        breakdown: { 'Local Development': 0 }
      }
    }
    
    // Calculate based on usage
    const costs = capabilities.pricing.costs || {}
    
    // User costs
    if (costs.perUser) {
      const billableUsers = Math.max(
        0,
        requirements.expectedUsers - (capabilities.pricing.freeTier?.users || 0)
      )
      breakdown['Authentication'] = billableUsers * costs.perUser
      monthly += breakdown['Authentication']
    }
    
    // Storage costs
    if (costs.perGB) {
      const dataGB = parseInt(requirements.dataVolume) || 10
      const freeGB = parseInt(capabilities.pricing.freeTier?.storage || '0')
      const billableGB = Math.max(0, dataGB - freeGB)
      breakdown['Storage'] = billableGB * costs.perGB
      monthly += breakdown['Storage']
    }
    
    // Function/API costs
    if (costs.perRequest || costs.perFunction) {
      const monthlyRequests = parseInt(requirements.expectedTraffic) || 100000
      const freeRequests = capabilities.pricing.freeTier?.functions || 0
      const billableRequests = Math.max(0, monthlyRequests - freeRequests)
      
      if (costs.perFunction) {
        breakdown['Functions'] = (billableRequests / 1000000) * costs.perFunction
      } else if (costs.perRequest) {
        breakdown['API Calls'] = billableRequests * costs.perRequest
      }
      monthly += breakdown['Functions'] || breakdown['API Calls'] || 0
    }
    
    // Add estimated additional services
    if (requirements.features.notifications && capabilities.type === 'aws') {
      breakdown['Notifications'] = 10 // Estimate $10/month for SES/SNS
      monthly += 10
    }
    
    return {
      monthly: Math.round(monthly * 100) / 100,
      yearly: Math.round(monthly * 12 * 100) / 100,
      currency: capabilities.pricing.currency,
      breakdown
    }
  }
  
  private generateReasoning(
    requirements: ProjectRequirements,
    capabilities: ProviderCapabilities
  ): { reasons: string[], pros: string[], cons: string[] } {
    const reasons: string[] = []
    const pros: string[] = []
    const cons: string[] = []
    
    // Analyze fit
    if (capabilities.type === 'local' && requirements.expectedUsers < 100) {
      reasons.push('Perfect for development and testing with minimal users')
      pros.push('Zero cost and configuration')
      pros.push('Complete offline support')
    }
    
    if (capabilities.type === 'firebase') {
      if (requirements.features.realtime) {
        reasons.push('Excellent real-time capabilities with minimal setup')
        pros.push('Built-in real-time synchronization')
      }
      if (requirements.projectType === 'mobile') {
        reasons.push('Optimized for mobile app development')
        pros.push('Native mobile SDKs')
      }
      if (requirements.expectedUsers < 50000) {
        pros.push('Generous free tier covers most small apps')
      }
      if (requirements.features.search) {
        cons.push('Limited native search capabilities')
      }
    }
    
    if (capabilities.type === 'aws') {
      if (requirements.expectedUsers > 100000) {
        reasons.push('Best choice for large-scale applications')
        pros.push('Unlimited scalability')
      }
      if (requirements.compliance.length > 0) {
        reasons.push('Comprehensive compliance certifications')
        pros.push('Enterprise-grade security and compliance')
      }
      if (requirements.features.ml) {
        pros.push('Integrated machine learning services')
      }
      if (requirements.expectedUsers < 1000) {
        cons.push('Overkill for small projects')
        cons.push('Steeper learning curve')
      }
    }
    
    // Add common pros/cons
    for (const bestFor of capabilities.bestFor) {
      if (this.matchesRequirement(bestFor, requirements)) {
        pros.push(bestFor)
      }
    }
    
    for (const notFor of capabilities.notRecommendedFor) {
      if (this.matchesRequirement(notFor, requirements)) {
        cons.push(notFor)
      }
    }
    
    return { reasons, pros, cons }
  }
  
  private matchesRequirement(
    capability: string,
    requirements: ProjectRequirements
  ): boolean {
    const capLower = capability.toLowerCase()
    
    // Check project type
    if (capLower.includes(requirements.projectType)) return true
    
    // Check scale
    if (capLower.includes('large') && requirements.expectedUsers > 100000) return true
    if (capLower.includes('small') && requirements.expectedUsers < 10000) return true
    
    // Check features
    for (const [feature, needed] of Object.entries(requirements.features)) {
      if (needed && capLower.includes(feature.toLowerCase())) return true
    }
    
    return false
  }
  
  private calculateMigrationEffort(
    requirements: ProjectRequirements,
    toProvider: ProviderType
  ): 'low' | 'medium' | 'high' | undefined {
    if (!requirements.existingProvider) return undefined
    if (requirements.existingProvider === toProvider) return 'low'
    
    const effortMatrix: Record<string, Record<string, 'low' | 'medium' | 'high'>> = {
      local: {
        firebase: 'medium',
        aws: 'high'
      },
      firebase: {
        local: 'low',
        aws: 'medium'
      },
      aws: {
        local: 'medium',
        firebase: 'high'
      }
    }
    
    return effortMatrix[requirements.existingProvider]?.[toProvider] || 'high'
  }
  
  private getAlternatives(
    recommendation: ProviderRecommendation,
    allRecommendations: ProviderRecommendation[]
  ): Array<{ provider: ProviderType, reason: string }> {
    const alternatives: Array<{ provider: ProviderType, reason: string }> = []
    
    // Get next best providers
    const others = allRecommendations
      .filter(r => r.provider !== recommendation.provider)
      .slice(0, 2)
    
    for (const other of others) {
      let reason = ''
      
      if (other.estimatedCost.monthly < recommendation.estimatedCost.monthly * 0.5) {
        reason = 'More cost-effective option'
      } else if (other.score > recommendation.score - 10) {
        reason = 'Similar capabilities'
      } else {
        reason = 'Alternative approach'
      }
      
      alternatives.push({
        provider: other.provider,
        reason
      })
    }
    
    return alternatives
  }
}

// Singleton instance
export const providerAdvisor = new ProviderAdvisor()