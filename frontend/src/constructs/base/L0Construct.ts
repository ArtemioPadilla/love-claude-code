import { BaseConstruct } from './BaseConstruct'
import { ConstructDefinition, ConstructLevel } from '../types'

/**
 * Base class for L0 (primitive) constructs
 * L0 constructs are atomic building blocks with no opinions or abstractions
 */
export abstract class L0Construct extends BaseConstruct {
  constructor(definition: ConstructDefinition) {
    // Ensure this is an L0 construct
    if (definition.level !== ConstructLevel.L0) {
      throw new Error(`Expected L0 construct, got ${definition.level}`)
    }
    super(definition)
  }

  /**
   * L0 constructs have minimal initialization
   */
  protected async onInitialize(): Promise<void> {
    // L0 constructs typically just store their configuration
    // No complex setup or dependencies
  }

  /**
   * L0 constructs have basic validation
   */
  protected async onValidate(): Promise<boolean> {
    // L0 constructs only validate their inputs were provided correctly
    // No complex business logic validation
    return true
  }

  /**
   * L0 constructs don't have complex deployment
   */
  protected async onDeploy(): Promise<void> {
    // L0 constructs are primitives - they don't deploy themselves
    // They are used as building blocks by higher-level constructs
  }

  /**
   * L0 constructs have minimal cleanup
   */
  protected async onDestroy(): Promise<void> {
    // L0 constructs typically don't need cleanup
    // They don't manage external resources
  }

  /**
   * Get the raw primitive value or configuration
   * This is what higher-level constructs will use
   */
  abstract getPrimitive(): any
}

/**
 * Base class for UI L0 constructs
 */
export abstract class L0UIConstruct extends L0Construct {
  /**
   * Render the UI primitive
   * Returns a React element with no styling or behavior
   */
  abstract render(): React.ReactElement
  
  /**
   * Get the raw DOM element or component
   */
  getPrimitive(): any {
    return this.render()
  }
}

/**
 * Base class for Infrastructure L0 constructs
 */
export abstract class L0InfrastructureConstruct extends L0Construct {
  /**
   * Get the infrastructure configuration
   * Returns raw configuration objects for cloud resources
   */
  abstract getConfiguration(): any
  
  /**
   * Get the raw infrastructure primitive
   */
  getPrimitive(): any {
    return this.getConfiguration()
  }
}

/**
 * Base class for External L0 constructs
 */
export abstract class L0ExternalConstruct extends L0Construct {
  /**
   * Parse external resource definition
   * Returns parsed structure for the external resource
   */
  abstract parseDefinition(input: string | object): any
  
  /**
   * Validate external resource configuration
   * Returns validation result with any errors
   */
  abstract validateConfiguration(config: any): { valid: boolean; errors?: string[] }
  
  /**
   * Get the external resource configuration
   * Returns standardized configuration for the external resource
   */
  abstract getConfiguration(): any
  
  /**
   * Get the raw external primitive
   */
  getPrimitive(): any {
    return this.getConfiguration()
  }
}