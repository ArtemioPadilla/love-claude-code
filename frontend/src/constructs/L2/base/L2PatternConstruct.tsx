/**
 * L2 Pattern Construct Base Class
 * 
 * Base class for all L2 pattern constructs that combine multiple L0/L1 constructs
 * into reusable patterns for common application scenarios.
 */

import React from 'react'
import { BaseConstruct, PlatformConstructDefinition, ConstructLevel } from '../../types'

export abstract class L2PatternConstruct implements BaseConstruct {
  protected definition: PlatformConstructDefinition
  protected componentRefs: Map<string, any> = new Map()
  protected eventHandlers: Map<string, Set<(...args: any[]) => void>> = new Map()
  protected initialized = false
  
  constructor(definition: PlatformConstructDefinition, props: any = {}) {
    if (definition.level !== ConstructLevel.L2) {
      throw new Error('L2PatternConstruct can only be used with L2 level constructs')
    }
    
    this.definition = definition
    
    // Verify all required L0/L1 constructs are available
    this.verifyDependencies()
  }
  
  protected verifyDependencies(): void {
    if (!this.definition.dependencies || this.definition.dependencies.length === 0) {
      console.warn(`L2 construct ${this.definition.id} has no dependencies declared`)
      return
    }
    
    // In a real implementation, would check if dependencies are loaded
    this.definition.dependencies.forEach(dep => {
      console.log(`Verifying dependency: ${dep}`)
    })
  }
  
  /**
   * Initialize the pattern with all sub-constructs
   */
  abstract initialize(config: any): Promise<any>
  
  /**
   * Compose L0/L1 constructs into the pattern
   */
  protected abstract composePattern(): Promise<void>
  
  /**
   * Configure inter-construct communication
   */
  protected abstract configureInteractions(): void
  
  /**
   * Get a reference to a composed construct
   */
  protected getConstruct<T>(id: string): T | undefined {
    return this.componentRefs.get(id) as T
  }
  
  /**
   * Add a construct to the pattern
   */
  protected addConstruct(id: string, construct: any): void {
    this.componentRefs.set(id, construct)
  }
  
  /**
   * Remove a construct from the pattern
   */
  protected removeConstruct(id: string): void {
    const construct = this.componentRefs.get(id)
    if (construct && typeof construct.destroy === 'function') {
      construct.destroy()
    }
    this.componentRefs.delete(id)
  }
  
  /**
   * Event handling
   */
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }
  
  off(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }
  
  protected emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }
  
  /**
   * Get pattern configuration
   */
  getConfig(): any {
    return {
      id: this.definition.id,
      name: this.definition.name,
      constructs: Array.from(this.componentRefs.keys()),
      initialized: this.initialized
    }
  }
  
  /**
   * Destroy the pattern and all sub-constructs
   */
  async destroy(): Promise<void> {
    // Destroy all sub-constructs
    for (const [id, construct] of this.componentRefs.entries()) {
      try {
        if (typeof construct.destroy === 'function') {
          await construct.destroy()
        }
      } catch (error) {
        console.error(`Error destroying construct ${id}:`, error)
      }
    }
    
    // Clear references
    this.componentRefs.clear()
    this.eventHandlers.clear()
    this.initialized = false
    
    this.emit('destroyed')
  }
  
  /**
   * Render the pattern UI
   */
  abstract render(): React.ReactElement
  
  /**
   * Get pattern status for monitoring
   */
  getStatus(): any {
    const constructStatuses: Record<string, any> = {}
    
    for (const [id, construct] of this.componentRefs.entries()) {
      if (typeof construct.getStatus === 'function') {
        constructStatuses[id] = construct.getStatus()
      } else {
        constructStatuses[id] = { available: true }
      }
    }
    
    return {
      pattern: this.definition.name,
      initialized: this.initialized,
      constructs: constructStatuses
    }
  }
  
  /**
   * Pattern-specific lifecycle hooks
   */
  protected async beforeCompose(): Promise<void> {
    // Override in subclasses for pre-composition setup
  }
  
  protected async afterCompose(): Promise<void> {
    // Override in subclasses for post-composition setup
  }
  
  /**
   * Health check for the pattern
   */
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
  }> {
    const issues: string[] = []
    
    if (!this.initialized) {
      issues.push('Pattern not initialized')
    }
    
    // Check each construct
    for (const [id, construct] of this.componentRefs.entries()) {
      try {
        if (typeof construct.healthCheck === 'function') {
          const health = await construct.healthCheck()
          if (!health.healthy) {
            issues.push(`Construct ${id}: ${health.issues.join(', ')}`)
          }
        }
      } catch (error) {
        issues.push(`Construct ${id}: Health check failed`)
      }
    }
    
    return {
      healthy: issues.length === 0,
      issues
    }
  }
  
  /**
   * Export pattern configuration for replication
   */
  exportConfiguration(): any {
    return {
      pattern: this.definition.id,
      version: this.definition.version,
      configuration: this.getConfig(),
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * Import pattern configuration
   */
  async importConfiguration(config: any): Promise<void> {
    if (config.pattern !== this.definition.id) {
      throw new Error(`Configuration is for pattern ${config.pattern}, not ${this.definition.id}`)
    }
    
    // Subclasses should implement specific import logic
    throw new Error('Import not implemented for this pattern')
  }
}