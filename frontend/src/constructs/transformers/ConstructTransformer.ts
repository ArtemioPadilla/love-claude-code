/**
 * Construct Transformer Service
 * Transforms construct definitions to match expected interfaces
 */

import { 
  ConstructDefinition, 
  ConstructLevel, 
  CloudProvider,
  CostEstimate,
  SecurityConsideration,
  C4Metadata,
  DeploymentConfig
} from '../types'

export class ConstructTransformer {
  /**
   * Transform a construct definition to match the expected interface
   */
  static transform(construct: any): ConstructDefinition {
    // Start with the original construct
    let transformed = { ...construct }

    // Transform category to categories if needed
    transformed = this.transformCategories(transformed)

    // Transform outputs if needed
    transformed = this.transformOutputs(transformed)

    // Transform providers if needed
    transformed = this.transformProviders(transformed)

    // Transform cost structure
    transformed = this.transformCost(transformed)

    // Transform security
    transformed = this.transformSecurity(transformed)

    // Transform C4 metadata
    transformed = this.transformC4(transformed)

    // Transform deployment
    transformed = this.transformDeployment(transformed)

    // Ensure all required arrays exist
    transformed = this.ensureArrays(transformed)

    // Apply level-specific transformations
    transformed = this.applyLevelTransformations(transformed)

    return transformed as ConstructDefinition
  }

  /**
   * Transform category to categories array
   */
  private static transformCategories(construct: any): any {
    // If categories already exists and is an array, return as is
    if (Array.isArray(construct.categories)) {
      return construct
    }

    // If category exists (single string), convert to categories array
    if (construct.category) {
      return {
        ...construct,
        categories: [construct.category],
        category: undefined // Remove the old field
      }
    }

    // If neither exists, provide empty array
    return {
      ...construct,
      categories: []
    }
  }

  /**
   * Transform outputs from object format to array format
   */
  private static transformOutputs(construct: any): any {
    // If outputs is already an array, return as is
    if (Array.isArray(construct.outputs)) {
      return construct
    }

    // If outputs is an object, convert to array
    if (construct.outputs && typeof construct.outputs === 'object' && !Array.isArray(construct.outputs)) {
      const outputsArray = Object.entries(construct.outputs).map(([name, output]: [string, any]) => ({
        name,
        type: output.type || 'any',
        description: output.description || `${name} output`,
        sensitive: output.sensitive || false
      }))

      return {
        ...construct,
        outputs: outputsArray
      }
    }

    // If outputs doesn't exist, provide empty array
    return {
      ...construct,
      outputs: []
    }
  }

  /**
   * Transform providers from object format to array format
   */
  private static transformProviders(construct: any): any {
    if (!construct.providers) {
      return {
        ...construct,
        providers: [CloudProvider.LOCAL]
      }
    }

    // If already an array, validate and return
    if (Array.isArray(construct.providers)) {
      return construct
    }

    // If it's an object (L2/L3 format), extract keys
    if (typeof construct.providers === 'object') {
      const providerKeys = Object.keys(construct.providers)
      const validProviders = providerKeys
        .filter(key => Object.values(CloudProvider).includes(key as CloudProvider))
        .map(key => key as CloudProvider)

      return {
        ...construct,
        providers: validProviders.length > 0 ? validProviders : [CloudProvider.LOCAL]
      }
    }

    // Default to local provider
    return {
      ...construct,
      providers: [CloudProvider.LOCAL]
    }
  }

  /**
   * Transform cost structure
   */
  private static transformCost(construct: any): any {
    if (!construct.cost) {
      // Provide default cost structure
      return {
        ...construct,
        cost: {
          baseMonthly: 0,
          usageFactors: [],
          notes: ['Cost estimation not available']
        } as CostEstimate
      }
    }

    // Ensure cost has required fields
    const cost = {
      baseMonthly: construct.cost.baseMonthly || 0,
      usageFactors: construct.cost.usageFactors || [],
      notes: construct.cost.notes || []
    }

    return {
      ...construct,
      cost
    }
  }

  /**
   * Transform security considerations
   */
  private static transformSecurity(construct: any): any {
    if (!construct.security || !Array.isArray(construct.security)) {
      // Provide default security considerations based on level
      const defaultSecurity = this.getDefaultSecurity(construct.level)
      return {
        ...construct,
        security: defaultSecurity
      }
    }

    // Ensure each security item has required fields
    const security = construct.security.map((sec: any) => ({
      aspect: sec.aspect || 'general',
      description: sec.description || 'Security consideration',
      severity: sec.severity || 'medium',
      recommendations: sec.recommendations || []
    } as SecurityConsideration))

    return {
      ...construct,
      security
    }
  }

  /**
   * Transform C4 metadata
   */
  private static transformC4(construct: any): any {
    if (!construct.c4) {
      // Provide default C4 metadata based on level
      const c4Type = this.getC4TypeForLevel(construct.level)
      return {
        ...construct,
        c4: {
          type: c4Type,
          technology: 'TypeScript/React',
          external: false
        } as C4Metadata
      }
    }

    // Ensure C4 has required fields
    const c4 = {
      type: construct.c4.type || 'Component',
      technology: construct.c4.technology || 'TypeScript',
      external: construct.c4.external || false,
      containerType: construct.c4.containerType,
      position: construct.c4.position
    }

    return {
      ...construct,
      c4
    }
  }

  /**
   * Transform deployment configuration
   */
  private static transformDeployment(construct: any): any {
    if (!construct.deployment) {
      // Provide default deployment configuration
      return {
        ...construct,
        deployment: {
          requiredProviders: construct.providers || [CloudProvider.LOCAL],
          configSchema: {},
          environmentVariables: [],
          preDeploymentChecks: [],
          postDeploymentChecks: []
        } as DeploymentConfig
      }
    }

    // Ensure deployment has required fields
    const deployment = {
      requiredProviders: construct.deployment.requiredProviders || construct.providers || [],
      configSchema: construct.deployment.configSchema || {},
      environmentVariables: construct.deployment.environmentVariables || [],
      preDeploymentChecks: construct.deployment.preDeploymentChecks || [],
      postDeploymentChecks: construct.deployment.postDeploymentChecks || []
    }

    return {
      ...construct,
      deployment
    }
  }

  /**
   * Ensure all required arrays exist
   */
  private static ensureArrays(construct: any): any {
    return {
      ...construct,
      categories: construct.categories || [],
      tags: construct.tags || [],
      inputs: construct.inputs || [],
      outputs: construct.outputs || [],
      examples: construct.examples || [],
      bestPractices: construct.bestPractices || [],
      relationships: construct.relationships || []
    }
  }

  /**
   * Apply level-specific transformations
   */
  private static applyLevelTransformations(construct: any): any {
    // Ensure type field exists based on level
    let type = construct.type
    if (!type) {
      switch (construct.level) {
        case ConstructLevel.L0: {
          type = 'UI' // or 'Infrastructure' based on categories
          if (construct.categories?.includes('infrastructure')) {
            type = 'Infrastructure'
          }
          break
        }
        case ConstructLevel.L1: {
          type = 'UI' // or 'Infrastructure' based on categories
          if (construct.categories?.includes('infrastructure')) {
            type = 'Infrastructure'
          }
          break
        }
        case ConstructLevel.L2: {
          type = 'Pattern'
          break
        }
        case ConstructLevel.L3: {
          type = 'Application'
          break
        }
        default: {
          type = 'Pattern'
        }
      }
    }

    switch (construct.level) {
      case ConstructLevel.L0: {
        // L0 constructs should not have dependencies
        return {
          ...construct,
          type,
          dependencies: []
        }
      }

      case ConstructLevel.L1:
      case ConstructLevel.L2:
      case ConstructLevel.L3: {
        // Ensure dependencies array exists
        return {
          ...construct,
          type,
          dependencies: construct.dependencies || []
        }
      }

      default: {
        return {
          ...construct,
          type
        }
      }
    }
  }

  /**
   * Get default security considerations based on level
   */
  private static getDefaultSecurity(level: ConstructLevel): SecurityConsideration[] {
    switch (level) {
      case ConstructLevel.L0: {
        return [{
          aspect: 'access-control',
          description: 'Primitive construct with basic access control',
          severity: 'low',
          recommendations: ['Follow principle of least privilege']
        }]
      }

      case ConstructLevel.L1: {
        return [{
          aspect: 'configuration',
          description: 'Ensure secure configuration of construct',
          severity: 'medium',
          recommendations: ['Review default configurations', 'Apply security best practices']
        }]
      }

      case ConstructLevel.L2: {
        return [{
          aspect: 'pattern-security',
          description: 'Pattern implements security best practices',
          severity: 'medium',
          recommendations: ['Follow pattern security guidelines', 'Review composed constructs']
        }]
      }

      case ConstructLevel.L3: {
        return [{
          aspect: 'application-security',
          description: 'Application-level security considerations',
          severity: 'high',
          recommendations: ['Implement authentication', 'Enable encryption', 'Regular security audits']
        }]
      }

      default: {
        return [{
          aspect: 'general',
          description: 'General security considerations apply',
          severity: 'medium',
          recommendations: ['Follow security best practices']
        }]
      }
    }
  }

  /**
   * Get appropriate C4 type for construct level
   */
  private static getC4TypeForLevel(level: ConstructLevel): 'System' | 'Container' | 'Component' | 'Code' {
    switch (level) {
      case ConstructLevel.L0: {
        return 'Code'
      }
      case ConstructLevel.L1: {
        return 'Component'
      }
      case ConstructLevel.L2: {
        return 'Container'
      }
      case ConstructLevel.L3: {
        return 'System'
      }
      default: {
        return 'Component'
      }
    }
  }

  /**
   * Transform L2/L3 specific format to standard format
   */
  static transformL2L3Format(construct: any): ConstructDefinition {
    // Handle the specific format used by L2/L3 constructs
    const transformed = { ...construct }

    // Extract metadata from definition if nested
    if (construct.definition) {
      Object.assign(transformed, construct.definition)
    }

    // Transform provider configurations to provider list
    if (construct.providers && typeof construct.providers === 'object' && !Array.isArray(construct.providers)) {
      const providerConfigs = construct.providers
      transformed.providers = Object.keys(providerConfigs)
        .filter(key => Object.values(CloudProvider).includes(key as CloudProvider))
        .map(key => key as CloudProvider)
      
      // Store provider configurations separately if needed
      transformed.providerConfigurations = providerConfigs
    }

    // Apply standard transformations
    return this.transform(transformed)
  }
}