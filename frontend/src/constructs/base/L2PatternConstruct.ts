import { BaseConstruct } from './BaseConstruct'
import { L1ConfiguredConstruct } from './L1Construct'
import { ConstructMetadata, ConstructDependency, ConstructLevel, ConstructType } from '../types'

/**
 * Base class for L2 Pattern Constructs
 * L2 constructs compose multiple L1 constructs into domain-specific patterns
 */
export abstract class L2PatternConstruct extends BaseConstruct {
  protected l1Components: Map<string, L1ConfiguredConstruct> = new Map()
  
  constructor(metadata: ConstructMetadata) {
    super({
      ...metadata,
      level: ConstructLevel.L2,
      type: ConstructType.Pattern,
      inputs: [],
      outputs: [],
      security: [],
      cost: {
        baseMonthly: 0,
        usageFactors: []
      },
      c4: {
        type: 'Component'
      },
      examples: [],
      bestPractices: [],
      deployment: {
        requiredProviders: [],
        configSchema: {}
      }
    })
  }

  /**
   * Register an L1 component with this pattern
   */
  protected registerL1Component(name: string, component: L1ConfiguredConstruct): void {
    this.l1Components.set(name, component)
    
    // Add as dependency
    const dependency = {
      constructId: component.id,
      version: component.metadata.version,
      optional: false
    }
    
    if (!this.metadata.dependencies) {
      this.metadata.dependencies = []
    }
    this.metadata.dependencies.push(dependency)
  }

  /**
   * Get a registered L1 component
   */
  protected getL1Component<T extends L1ConfiguredConstruct>(name: string): T | undefined {
    return this.l1Components.get(name) as T
  }

  /**
   * Wire components together with error handling
   */
  protected async wireComponents(): Promise<void> {
    // Override in subclasses to wire L1 components together
  }

  /**
   * Initialize all L1 components and wire them together
   */
  async initialize(): Promise<void> {
    // Initialize all L1 components
    const initPromises = Array.from(this.l1Components.values()).map(
      component => component.initialize({})
    )
    
    await Promise.all(initPromises)
    
    // Wire components together
    await this.wireComponents()
  }

  /**
   * Check health of all L1 components
   */
  async checkHealth(): Promise<{
    healthy: boolean
    components: Record<string, { healthy: boolean; message?: string }>
  }> {
    const componentHealth: Record<string, { healthy: boolean; message?: string }> = {}
    let allHealthy = true

    for (const [name, component] of this.l1Components) {
      try {
        const health = await (component as any).healthCheck?.()
        const healthResult = health ? {
          healthy: health.status === 'healthy',
          message: health.status !== 'healthy' ? `Status: ${health.status}` : undefined
        } : { healthy: true }
        componentHealth[name] = healthResult
        if (!healthResult.healthy) {
          allHealthy = false
        }
      } catch (error) {
        componentHealth[name] = {
          healthy: false,
          message: error instanceof Error ? error.message : 'Health check failed'
        }
        allHealthy = false
      }
    }

    return {
      healthy: allHealthy,
      components: componentHealth
    }
  }

  /**
   * Cleanup all L1 components
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.l1Components.values()).map(
      component => component.destroy()
    )
    
    await Promise.all(cleanupPromises)
  }
}