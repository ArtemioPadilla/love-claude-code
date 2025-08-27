import { 
  ConstructDefinition, 
  ConstructLevel, 
  ConstructInput,
  ConstructOutput,
  PlatformConstructDefinition,
  SelfReferentialMetadata
} from '../types'

/**
 * Abstract base class for all constructs
 * Includes EventEmitter functionality for real-time updates
 */
export abstract class BaseConstruct {
  protected definition: ConstructDefinition | PlatformConstructDefinition
  protected inputs: Map<string, any> = new Map()
  protected outputs: Map<string, any> = new Map()
  protected initialized: boolean = false
  
  // Event emitter functionality
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map()

  constructor(definition: ConstructDefinition | PlatformConstructDefinition) {
    this.definition = definition
  }

  /**
   * Get construct metadata
   */
  get metadata() {
    return this.definition
  }

  /**
   * Get construct ID
   */
  get id() {
    return this.definition.id
  }

  /**
   * Get construct level
   */
  get level() {
    return this.definition.level
  }

  /**
   * Check if this is a platform construct
   */
  isPlatformConstruct(): boolean {
    return 'selfReferential' in this.definition
  }

  /**
   * Get self-referential metadata if available
   */
  getSelfReferentialMetadata(): SelfReferentialMetadata | undefined {
    if (this.isPlatformConstruct()) {
      return (this.definition as PlatformConstructDefinition).selfReferential
    }
    return undefined
  }

  /**
   * Initialize the construct with inputs
   */
  async initialize(inputs: Record<string, any>): Promise<void> {
    // Validate required inputs
    for (const input of this.definition.inputs) {
      if (input.required && !(input.name in inputs)) {
        throw new Error(`Required input '${input.name}' not provided for construct ${this.id}`)
      }
    }

    // Validate input types and apply defaults
    for (const input of this.definition.inputs) {
      const value = inputs[input.name] ?? input.defaultValue
      
      if (value !== undefined) {
        // Validate against constraints
        if (input.validation) {
          this.validateInput(input, value)
        }
        
        this.inputs.set(input.name, value)
      }
    }

    // Perform construct-specific initialization
    await this.onInitialize()
    this.initialized = true
  }

  /**
   * Validate an input against its constraints
   */
  protected validateInput(input: ConstructInput, value: any): void {
    const validation = input.validation
    if (!validation) return

    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        throw new Error(`Input '${input.name}' does not match pattern ${validation.pattern}`)
      }
    }

    // Min/max validation
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        throw new Error(`Input '${input.name}' is below minimum value ${validation.min}`)
      }
      if (validation.max !== undefined && value > validation.max) {
        throw new Error(`Input '${input.name}' is above maximum value ${validation.max}`)
      }
    }

    // Enum validation
    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Input '${input.name}' must be one of: ${validation.enum.join(', ')}`)
    }
  }

  /**
   * Get an input value
   */
  protected getInput<T = any>(name: string): T | undefined {
    return this.inputs.get(name)
  }

  /**
   * Set an output value
   */
  protected setOutput(name: string, value: any): void {
    const output = this.definition.outputs.find(o => o.name === name)
    if (!output) {
      throw new Error(`Unknown output '${name}' for construct ${this.id}`)
    }
    this.outputs.set(name, value)
  }

  /**
   * Get all outputs
   */
  getOutputs(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of this.outputs) {
      result[key] = value
    }
    return result
  }

  /**
   * Get a specific output
   */
  getOutput<T = any>(name: string): T | undefined {
    return this.outputs.get(name)
  }

  /**
   * Validate the construct configuration
   */
  async validate(): Promise<boolean> {
    if (!this.initialized) {
      throw new Error(`Construct ${this.id} not initialized`)
    }
    
    // Perform construct-specific validation
    return await this.onValidate()
  }

  /**
   * Deploy the construct
   */
  async deploy(): Promise<void> {
    if (!this.initialized) {
      throw new Error(`Construct ${this.id} not initialized`)
    }

    const isValid = await this.validate()
    if (!isValid) {
      throw new Error(`Construct ${this.id} validation failed`)
    }

    await this.onDeploy()
  }

  /**
   * Destroy the construct
   */
  async destroy(): Promise<void> {
    await this.onDestroy()
    this.initialized = false
    this.inputs.clear()
    this.outputs.clear()
  }

  /**
   * Hook for construct-specific initialization
   */
  protected abstract onInitialize(): Promise<void>

  /**
   * Hook for construct-specific validation
   */
  protected abstract onValidate(): Promise<boolean>

  /**
   * Hook for construct-specific deployment
   */
  protected abstract onDeploy(): Promise<void>

  /**
   * Hook for construct-specific destruction
   */
  protected abstract onDestroy(): Promise<void>

  /**
   * Get construct dependencies
   */
  getDependencies(): string[] {
    return this.definition.dependencies?.map(d => d.constructId) || []
  }

  /**
   * Check if construct can self-deploy (platform constructs only)
   */
  canSelfDeploy(): boolean {
    if (this.isPlatformConstruct()) {
      const platformDef = this.definition as PlatformConstructDefinition
      return platformDef.platformCapabilities?.canSelfDeploy || false
    }
    return false
  }

  /**
   * Get vibe-coding percentage
   */
  getVibeCodingPercentage(): number {
    const metadata = this.getSelfReferentialMetadata()
    return metadata?.vibeCodingPercentage || 0
  }

  /**
   * Get constructs used to build this construct
   */
  getBuiltWithConstructs(): string[] {
    const metadata = this.getSelfReferentialMetadata()
    return metadata?.builtWith || []
  }
  
  /**
   * Add event listener
   */
  on(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    
    this.eventListeners.get(event)!.push(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventListeners.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }
  
  /**
   * Emit event to all listeners
   */
  emit(event: string, data?: any): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
  
  /**
   * Remove all event listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event)
    } else {
      this.eventListeners.clear()
    }
  }
  
  /**
   * Get list of events with listeners
   */
  getEvents(): string[] {
    return Array.from(this.eventListeners.keys())
  }
}