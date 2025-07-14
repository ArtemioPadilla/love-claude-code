import {
  ConstructDefinition,
  ConstructComposition,
  CloudProvider,
  CostEstimate,
  CostModel
} from './types.js'

/**
 * Calculates cost estimates for constructs and compositions
 */
export class CostCalculator {
  private readonly exchangeRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110
  }
  
  /**
   * Estimate costs for a single construct
   */
  estimateConstruct(
    construct: ConstructDefinition,
    provider: CloudProvider,
    region?: string,
    usage?: {
      requests?: number
      storage?: number
      compute?: number
    }
  ): CostEstimate {
    const costModel = construct.costs?.find(c => c.provider === provider)
    if (!costModel) {
      return this.createEmptyEstimate(provider, region)
    }
    
    const breakdown: CostEstimate['breakdown'] = []
    let monthlyTotal = 0
    
    // Base cost
    if (costModel.baseCost > 0) {
      breakdown.push({
        item: `${construct.metadata.name} Base Cost`,
        cost: costModel.baseCost,
        unit: 'month',
        quantity: 1
      })
      monthlyTotal += costModel.baseCost
    }
    
    // Usage-based costs
    if (usage) {
      if (usage.requests && costModel.usage.requests) {
        const requestCost = usage.requests * costModel.usage.requests.cost
        breakdown.push({
          item: 'API Requests',
          cost: costModel.usage.requests.cost,
          unit: costModel.usage.requests.unit,
          quantity: usage.requests
        })
        monthlyTotal += requestCost
      }
      
      if (usage.storage && costModel.usage.storage) {
        const storageCost = usage.storage * costModel.usage.storage.cost
        breakdown.push({
          item: 'Storage',
          cost: costModel.usage.storage.cost,
          unit: costModel.usage.storage.unit,
          quantity: usage.storage
        })
        monthlyTotal += storageCost
      }
      
      if (usage.compute && costModel.usage.compute) {
        const computeCost = usage.compute * costModel.usage.compute.cost
        breakdown.push({
          item: 'Compute Hours',
          cost: costModel.usage.compute.cost,
          unit: costModel.usage.compute.unit,
          quantity: usage.compute
        })
        monthlyTotal += computeCost
      }
    }
    
    // Apply regional pricing adjustments
    const regionalMultiplier = this.getRegionalMultiplier(provider, region)
    monthlyTotal *= regionalMultiplier
    
    return {
      provider,
      region,
      breakdown,
      total: {
        hourly: monthlyTotal / (30 * 24),
        daily: monthlyTotal / 30,
        monthly: monthlyTotal,
        yearly: monthlyTotal * 12
      },
      assumptions: this.generateAssumptions(construct, usage)
    }
  }
  
  /**
   * Estimate costs for a composition
   */
  estimateComposition(
    composition: ConstructComposition,
    provider: CloudProvider,
    region?: string,
    usage?: {
      requests?: number
      storage?: number
      compute?: number
    },
    catalog: Map<string, ConstructDefinition>
  ): CostEstimate {
    const breakdown: CostEstimate['breakdown'] = []
    let monthlyTotal = 0
    const assumptions: string[] = []
    
    // Calculate costs for each construct
    composition.constructs.forEach(construct => {
      const definition = catalog.get(construct.constructId)
      if (!definition) return
      
      const constructEstimate = this.estimateConstruct(
        definition,
        provider,
        region,
        usage
      )
      
      // Add to breakdown with instance name prefix
      constructEstimate.breakdown.forEach(item => {
        breakdown.push({
          ...item,
          item: `${construct.instanceName}: ${item.item}`
        })
      })
      
      monthlyTotal += constructEstimate.total.monthly
      assumptions.push(...constructEstimate.assumptions)
    })
    
    // Add composition overhead (10% for management/orchestration)
    const overhead = monthlyTotal * 0.1
    breakdown.push({
      item: 'Composition Management Overhead',
      cost: overhead,
      unit: 'month',
      quantity: 1
    })
    monthlyTotal += overhead
    
    // Deduplication discount (5% for shared resources)
    if (composition.constructs.length > 3) {
      const discount = monthlyTotal * 0.05
      breakdown.push({
        item: 'Multi-construct Efficiency Discount',
        cost: -discount,
        unit: 'month',
        quantity: 1
      })
      monthlyTotal -= discount
      assumptions.push('5% efficiency discount applied for resource sharing')
    }
    
    return {
      provider,
      region,
      breakdown,
      total: {
        hourly: monthlyTotal / (30 * 24),
        daily: monthlyTotal / 30,
        monthly: monthlyTotal,
        yearly: monthlyTotal * 12
      },
      assumptions: [...new Set(assumptions)] // Remove duplicates
    }
  }
  
  /**
   * Get regional pricing multiplier
   */
  private getRegionalMultiplier(provider: CloudProvider, region?: string): number {
    if (!region) return 1
    
    // Simplified regional pricing (in reality, would use provider APIs)
    const regionalPricing: Record<string, Record<string, number>> = {
      [CloudProvider.AWS]: {
        'us-east-1': 1.0,
        'us-west-2': 1.05,
        'eu-west-1': 1.1,
        'ap-southeast-1': 1.15,
        'ap-northeast-1': 1.2
      },
      [CloudProvider.Azure]: {
        'eastus': 1.0,
        'westus': 1.05,
        'westeurope': 1.1,
        'southeastasia': 1.15,
        'japaneast': 1.2
      },
      [CloudProvider.GCP]: {
        'us-central1': 1.0,
        'us-west1': 1.05,
        'europe-west1': 1.1,
        'asia-southeast1': 1.15,
        'asia-northeast1': 1.2
      }
    }
    
    return regionalPricing[provider]?.[region] || 1
  }
  
  /**
   * Generate cost assumptions
   */
  private generateAssumptions(
    construct: ConstructDefinition,
    usage?: { requests?: number; storage?: number; compute?: number }
  ): string[] {
    const assumptions: string[] = []
    
    if (!usage || (!usage.requests && !usage.storage && !usage.compute)) {
      assumptions.push('No usage specified - showing base costs only')
    }
    
    if (usage?.requests) {
      assumptions.push(`Assuming ${usage.requests.toLocaleString()} requests per month`)
    }
    
    if (usage?.storage) {
      assumptions.push(`Assuming ${usage.storage} GB of storage`)
    }
    
    if (usage?.compute) {
      assumptions.push(`Assuming ${usage.compute} compute hours per month`)
    }
    
    assumptions.push('Prices are estimates and may vary based on actual usage')
    assumptions.push('Does not include data transfer costs')
    
    if (construct.level === 'L3') {
      assumptions.push('L3 constructs may have additional application-specific costs')
    }
    
    return assumptions
  }
  
  /**
   * Create empty cost estimate
   */
  private createEmptyEstimate(provider: CloudProvider, region?: string): CostEstimate {
    return {
      provider,
      region,
      breakdown: [],
      total: {
        hourly: 0,
        daily: 0,
        monthly: 0,
        yearly: 0
      },
      assumptions: ['No cost model available for this construct and provider combination']
    }
  }
}