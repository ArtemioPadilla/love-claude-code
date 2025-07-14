import {
  ConstructDefinition,
  ConstructComposition,
  ValidationResult
} from './types.js'

/**
 * Composes multiple constructs into a composition
 */
export class ConstructComposer {
  /**
   * Create a composition from constructs
   */
  async compose(
    name: string,
    constructs: Array<{
      constructId: string
      instanceName: string
      config?: Record<string, any>
      connections?: Array<{
        targetInstance: string
        type: string
        config?: Record<string, any>
      }>
    }>,
    catalog: Map<string, ConstructDefinition>
  ): Promise<ConstructComposition> {
    // Validate all constructs exist
    for (const c of constructs) {
      if (!catalog.has(c.constructId)) {
        throw new Error(`Construct not found: ${c.constructId}`)
      }
    }
    
    // Generate composition ID
    const id = this.generateCompositionId(name)
    
    // Create composition
    const composition: ConstructComposition = {
      id,
      name,
      metadata: {
        name,
        description: `Composition of ${constructs.length} constructs`,
        version: '1.0.0',
        author: 'MCP Composer',
        category: 'composition',
        tags: ['composition']
      },
      constructs: constructs.map((c, index) => ({
        ...c,
        position: c.position || this.calculatePosition(index, constructs.length)
      }))
    }
    
    return composition
  }
  
  /**
   * Validate a composition
   */
  validate(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>
  ): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check for duplicate instance names
    const instanceNames = new Set<string>()
    composition.constructs.forEach((c, index) => {
      if (instanceNames.has(c.instanceName)) {
        errors.push({
          path: `constructs[${index}].instanceName`,
          message: `Duplicate instance name: ${c.instanceName}`,
          severity: 'error'
        })
      }
      instanceNames.add(c.instanceName)
    })
    
    // Validate each construct
    composition.constructs.forEach((construct, index) => {
      const definition = catalog.get(construct.constructId)
      if (!definition) {
        errors.push({
          path: `constructs[${index}].constructId`,
          message: `Construct not found: ${construct.constructId}`,
          severity: 'error'
        })
        return
      }
      
      // Validate required inputs
      Object.entries(definition.inputs).forEach(([key, input]) => {
        if (input.required && !construct.config?.[key]) {
          errors.push({
            path: `constructs[${index}].config.${key}`,
            message: `Required input missing: ${key}`,
            severity: 'error'
          })
        }
      })
      
      // Validate connections
      construct.connections?.forEach((conn, connIndex) => {
        // Check target exists
        if (!instanceNames.has(conn.targetInstance)) {
          errors.push({
            path: `constructs[${index}].connections[${connIndex}].targetInstance`,
            message: `Target instance not found: ${conn.targetInstance}`,
            severity: 'error'
          })
        }
        
        // Check for circular dependencies
        if (this.hasCircularDependency(composition, construct.instanceName, conn.targetInstance)) {
          errors.push({
            path: `constructs[${index}].connections[${connIndex}]`,
            message: `Circular dependency detected`,
            severity: 'error'
          })
        }
      })
    })
    
    // Level compatibility checks
    const levels = new Set<string>()
    composition.constructs.forEach(c => {
      const def = catalog.get(c.constructId)
      if (def) levels.add(def.level)
    })
    
    if (levels.size > 2) {
      warnings.push('Composition spans more than 2 construct levels, which may increase complexity')
    }
    
    // Provider compatibility
    const providers = new Set<string>()
    composition.constructs.forEach(c => {
      const def = catalog.get(c.constructId)
      if (def) {
        def.providers.forEach(p => providers.add(p))
      }
    })
    
    if (providers.size > 1) {
      const providerList = Array.from(providers).join(', ')
      warnings.push(`Composition uses multiple providers: ${providerList}. Ensure cross-provider compatibility.`)
    }
    
    // Security recommendations
    const hasAuth = composition.constructs.some(c => 
      c.constructId.toLowerCase().includes('auth') ||
      catalog.get(c.constructId)?.metadata.category === 'security'
    )
    
    if (!hasAuth) {
      suggestions.push('Consider adding authentication/authorization constructs for security')
    }
    
    // Cost optimization
    const hasCostOptimization = composition.constructs.some(c => {
      const def = catalog.get(c.constructId)
      return def?.metadata.tags.includes('cost-optimized')
    })
    
    if (!hasCostOptimization) {
      suggestions.push('Consider using cost-optimized construct variants where available')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(
    composition: ConstructComposition,
    source: string,
    target: string,
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(source)) return true
    visited.add(source)
    
    const construct = composition.constructs.find(c => c.instanceName === target)
    if (!construct) return false
    
    for (const conn of construct.connections || []) {
      if (conn.targetInstance === source) return true
      if (this.hasCircularDependency(composition, source, conn.targetInstance, visited)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Calculate default position for construct
   */
  private calculatePosition(index: number, total: number): { x: number; y: number } {
    const columns = Math.ceil(Math.sqrt(total))
    const row = Math.floor(index / columns)
    const col = index % columns
    
    return {
      x: 100 + col * 300,
      y: 100 + row * 200
    }
  }
  
  /**
   * Generate composition ID
   */
  private generateCompositionId(name: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    const timestamp = Date.now().toString(36)
    return `comp-${normalized}-${timestamp}`
  }
}