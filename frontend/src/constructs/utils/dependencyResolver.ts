/**
 * Dependency Resolver for Platform Constructs
 * 
 * Resolves the full dependency tree for any construct, tracing all the way down to L0 primitives.
 * Handles both direct dependencies and selfReferential.builtWith references.
 */

import { PlatformConstructDefinition, ConstructLevel } from '../types'

export interface DependencyNode {
  id: string
  name: string
  level: ConstructLevel
  type: string
  version: string
  description: string
  dependencies: DependencyNode[]
  isDirect: boolean // Whether this is a direct dependency or transitive
  depth: number // Distance from the root construct
}

export interface DependencyGraph {
  root: DependencyNode
  totalDependencies: number
  dependenciesByLevel: Record<ConstructLevel, number>
  maxDepth: number
  allDependencyIds: Set<string>
}

export class DependencyResolver {
  private visitedNodes = new Set<string>()
  private constructCache = new Map<string, PlatformConstructDefinition>()
  private registryGetter: () => PlatformConstructDefinition[]

  constructor(registryGetter?: () => PlatformConstructDefinition[]) {
    // Lazy load the registry to avoid circular dependency
    this.registryGetter = registryGetter || (() => {
      // Dynamically import registry only when needed
      const { CONSTRUCT_REGISTRY } = require('../registry')
      return CONSTRUCT_REGISTRY
    })
  }

  private ensureCache() {
    if (this.constructCache.size === 0) {
      // Build cache for quick lookups
      const registry = this.registryGetter()
      registry.forEach(construct => {
        this.constructCache.set(construct.id, construct)
      })
    }
  }

  /**
   * Resolve the full dependency tree for a construct
   */
  resolveDependencies(constructId: string): DependencyGraph | null {
    this.ensureCache()
    this.visitedNodes.clear()
    
    const rootConstruct = this.constructCache.get(constructId)
    if (!rootConstruct) {
      console.error(`Construct not found: ${constructId}`)
      return null
    }

    const rootNode = this.buildDependencyNode(rootConstruct, true, 0)
    const graph = this.analyzeGraph(rootNode)
    
    return graph
  }

  /**
   * Build a dependency node and recursively resolve its dependencies
   */
  private buildDependencyNode(
    construct: PlatformConstructDefinition, 
    isDirect: boolean,
    depth: number
  ): DependencyNode {
    const node: DependencyNode = {
      id: construct.id,
      name: construct.name,
      level: construct.level,
      type: construct.type,
      version: construct.version,
      description: construct.description,
      dependencies: [],
      isDirect,
      depth
    }

    // Prevent circular dependencies
    if (this.visitedNodes.has(construct.id)) {
      return node
    }
    this.visitedNodes.add(construct.id)

    // Get dependencies from multiple sources
    const dependencyIds = this.extractDependencyIds(construct)
    
    // Recursively build dependency nodes
    for (const depId of dependencyIds) {
      const depConstruct = this.constructCache.get(depId)
      if (depConstruct) {
        const depNode = this.buildDependencyNode(depConstruct, true, depth + 1)
        node.dependencies.push(depNode)
      } else {
        console.warn(`Dependency not found: ${depId} (referenced by ${construct.id})`)
      }
    }

    return node
  }

  /**
   * Extract all dependency IDs from a construct definition
   */
  private extractDependencyIds(construct: PlatformConstructDefinition): string[] {
    const ids = new Set<string>()

    // 1. Check standard dependencies array (for string format)
    if (Array.isArray(construct.dependencies)) {
      construct.dependencies.forEach(dep => {
        if (typeof dep === 'string') {
          ids.add(dep)
        } else if (dep.constructId) {
          ids.add(dep.constructId)
        } else if ((dep as any).id) {
          // Handle L3 format with { id, level, optional }
          const depId = (dep as any).id
          const level = (dep as any).level || ''
          
          // Try to resolve full ID from short name
          const fullId = this.resolveConstructId(depId, level)
          if (fullId) {
            ids.add(fullId)
          }
        }
      })
    }

    // 2. Check selfReferential.builtWith (for some L1/L2 constructs)
    if (construct.selfReferential?.builtWith) {
      construct.selfReferential.builtWith.forEach(id => ids.add(id))
    }

    // 3. For L1 constructs, infer L0 dependencies from naming convention
    if (construct.level === ConstructLevel.L1 && ids.size === 0) {
      const inferredDependencies = this.inferL0Dependencies(construct)
      inferredDependencies.forEach(id => ids.add(id))
    }

    return Array.from(ids)
  }

  /**
   * Resolve a short construct ID to its full platform ID
   */
  private resolveConstructId(shortId: string, level: string): string | null {
    // First, check if it's already a full ID
    if (this.constructCache.has(shortId)) {
      return shortId
    }

    // Try common patterns
    const prefixedId = `platform-${level.toLowerCase()}-${shortId}`
    if (this.constructCache.has(prefixedId)) {
      return prefixedId
    }

    // Try with hyphens for camelCase names
    const hyphenatedId = shortId.replace(/([A-Z])/g, '-$1').toLowerCase()
    const prefixedHyphenatedId = `platform-${level.toLowerCase()}-${hyphenatedId}`
    if (this.constructCache.has(prefixedHyphenatedId)) {
      return prefixedHyphenatedId
    }

    // Special mappings for known inconsistencies
    const mappings: Record<string, string> = {
      'realtime-collaboration': 'platform-l2-real-time-collaboration',
      'multi-provider-system': 'platform-l2-multi-provider-abstraction',
      'documentation-center': null, // Doesn't exist yet
      'theme-system': null, // Doesn't exist yet
      'analytics-system': null, // Doesn't exist yet
      'monitoring-dashboard': null // Doesn't exist yet
    }

    if (shortId in mappings) {
      return mappings[shortId]
    }

    // Try to find by searching through all constructs
    for (const [id, construct] of this.constructCache.entries()) {
      if (id.endsWith(shortId) || id.endsWith(hyphenatedId)) {
        return id
      }
    }

    console.warn(`Could not resolve construct ID: ${shortId} (level: ${level})`)
    return null
  }

  /**
   * Infer L0 dependencies for L1 constructs based on naming patterns
   */
  private inferL0Dependencies(construct: PlatformConstructDefinition): string[] {
    const dependencies: string[] = []
    
    // Map L1 constructs to their likely L0 primitives
    const mappings: Record<string, string[]> = {
      'platform-l1-secure-code-editor': ['platform-l0-code-editor-primitive'],
      'platform-l1-ai-chat-interface': ['platform-l0-chat-message-primitive'],
      'platform-l1-project-file-explorer': ['platform-l0-file-tree-primitive'],
      'platform-l1-integrated-terminal': ['platform-l0-terminal-primitive'],
      'platform-l1-responsive-layout': ['platform-l0-panel-primitive'],
      'platform-l1-themed-components': ['platform-l0-button-primitive', 'platform-l0-modal-primitive'],
      'platform-l1-managed-container': ['platform-l0-docker-container-primitive'],
      'platform-l1-authenticated-websocket': ['platform-l0-websocket-server-primitive'],
      'platform-l1-rest-api-service': ['platform-l0-api-endpoint-primitive'],
      'platform-l1-encrypted-database': ['platform-l0-database-table-primitive'],
      'platform-l1-cdn-storage': ['platform-l0-storage-bucket-primitive'],
      'platform-l1-secure-auth-service': ['platform-l0-auth-token-primitive']
    }

    return mappings[construct.id] || []
  }

  /**
   * Analyze the dependency graph to extract metrics
   */
  private analyzeGraph(root: DependencyNode): DependencyGraph {
    const allDependencyIds = new Set<string>()
    const dependenciesByLevel: Record<ConstructLevel, number> = {
      [ConstructLevel.L0]: 0,
      [ConstructLevel.L1]: 0,
      [ConstructLevel.L2]: 0,
      [ConstructLevel.L3]: 0
    }
    let maxDepth = 0

    const traverse = (node: DependencyNode) => {
      if (node.id !== root.id) {
        allDependencyIds.add(node.id)
        dependenciesByLevel[node.level]++
      }
      maxDepth = Math.max(maxDepth, node.depth)
      
      node.dependencies.forEach(dep => traverse(dep))
    }

    traverse(root)

    return {
      root,
      totalDependencies: allDependencyIds.size,
      dependenciesByLevel,
      maxDepth,
      allDependencyIds
    }
  }

  /**
   * Get a flat list of all dependencies for a construct
   */
  getFlatDependencyList(constructId: string): PlatformConstructDefinition[] {
    const graph = this.resolveDependencies(constructId)
    if (!graph) return []

    return Array.from(graph.allDependencyIds)
      .map(id => this.constructCache.get(id))
      .filter(Boolean) as PlatformConstructDefinition[]
  }

  /**
   * Find all constructs that depend on a given construct
   */
  findDependents(constructId: string): PlatformConstructDefinition[] {
    const dependents: PlatformConstructDefinition[] = []

    CONSTRUCT_REGISTRY.forEach(construct => {
      const graph = this.resolveDependencies(construct.id)
      if (graph && graph.allDependencyIds.has(constructId)) {
        dependents.push(construct)
      }
    })

    return dependents
  }

  /**
   * Calculate shared dependencies between two constructs
   */
  findSharedDependencies(constructId1: string, constructId2: string): string[] {
    const graph1 = this.resolveDependencies(constructId1)
    const graph2 = this.resolveDependencies(constructId2)
    
    if (!graph1 || !graph2) return []

    const shared: string[] = []
    graph1.allDependencyIds.forEach(id => {
      if (graph2.allDependencyIds.has(id)) {
        shared.push(id)
      }
    })

    return shared
  }

  /**
   * Get a construct by ID
   */
  getConstructById(id: string): PlatformConstructDefinition | undefined {
    return this.constructCache.get(id)
  }
}

// Singleton instance - uses lazy loading to avoid circular dependency
export const dependencyResolver = new DependencyResolver()