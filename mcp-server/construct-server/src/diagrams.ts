import {
  ConstructComposition,
  ConstructDefinition,
  C4Diagram
} from './types.js'

/**
 * Generates C4 diagrams from compositions
 */
export class DiagramGenerator {
  /**
   * Generate C4 diagram
   */
  generate(
    composition: ConstructComposition,
    level: 'context' | 'container' | 'component' | 'code',
    format: 'json' | 'plantuml' | 'mermaid',
    catalog: Map<string, ConstructDefinition>
  ): C4Diagram {
    const diagram: C4Diagram = {
      level,
      format,
      content: '',
      metadata: {
        title: `${composition.name} - ${level.charAt(0).toUpperCase() + level.slice(1)} Diagram`,
        description: composition.metadata?.description,
        author: 'MCP Diagram Generator',
        version: '1.0.0'
      }
    }
    
    switch (format) {
      case 'json':
        diagram.content = this.generateJSON(composition, level, catalog)
        break
      case 'plantuml':
        diagram.content = this.generatePlantUML(composition, level, catalog)
        break
      case 'mermaid':
        diagram.content = this.generateMermaid(composition, level, catalog)
        break
    }
    
    return diagram
  }
  
  /**
   * Generate JSON format diagram
   */
  private generateJSON(
    composition: ConstructComposition,
    level: string,
    catalog: Map<string, ConstructDefinition>
  ): object {
    const nodes: any[] = []
    const edges: any[] = []
    
    switch (level) {
      case 'context':
        return this.generateContextJSON(composition, catalog, nodes, edges)
      case 'container':
        return this.generateContainerJSON(composition, catalog, nodes, edges)
      case 'component':
        return this.generateComponentJSON(composition, catalog, nodes, edges)
      case 'code':
        return this.generateCodeJSON(composition, catalog, nodes, edges)
    }
    
    return { nodes, edges }
  }
  
  /**
   * Generate context level JSON
   */
  private generateContextJSON(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    nodes: any[],
    edges: any[]
  ): object {
    // Add user node
    nodes.push({
      id: 'user',
      type: 'person',
      data: {
        label: 'User',
        description: 'System user'
      }
    })
    
    // Add system node
    nodes.push({
      id: 'system',
      type: 'system',
      data: {
        label: composition.name,
        description: composition.metadata?.description || 'Main system',
        external: false
      }
    })
    
    // Add external systems based on providers
    const providers = new Set<string>()
    composition.constructs.forEach(c => {
      const def = catalog.get(c.constructId)
      if (def) {
        def.providers.forEach(p => providers.add(p))
      }
    })
    
    providers.forEach(provider => {
      nodes.push({
        id: `provider-${provider}`,
        type: 'system',
        data: {
          label: `${provider.toUpperCase()} Services`,
          description: `${provider} cloud services`,
          external: true
        }
      })
      
      edges.push({
        id: `system-to-${provider}`,
        source: 'system',
        target: `provider-${provider}`,
        data: {
          label: 'Uses',
          technology: 'HTTPS/API'
        }
      })
    })
    
    // User to system edge
    edges.push({
      id: 'user-to-system',
      source: 'user',
      target: 'system',
      data: {
        label: 'Uses',
        technology: 'Web Browser'
      }
    })
    
    return { nodes, edges }
  }
  
  /**
   * Generate container level JSON
   */
  private generateContainerJSON(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    nodes: any[],
    edges: any[]
  ): object {
    // Add containers for each construct
    composition.constructs.forEach(construct => {
      const def = catalog.get(construct.constructId)
      if (!def) return
      
      nodes.push({
        id: construct.instanceName,
        type: 'container',
        data: {
          label: construct.instanceName,
          description: def.metadata.description,
          technology: this.getTechnology(def),
          containerType: this.getContainerType(def)
        }
      })
    })
    
    // Add connections
    composition.constructs.forEach(construct => {
      construct.connections?.forEach(conn => {
        edges.push({
          id: `${construct.instanceName}-to-${conn.targetInstance}`,
          source: construct.instanceName,
          target: conn.targetInstance,
          data: {
            label: conn.type,
            type: conn.type === 'async' ? 'async' : 'sync'
          }
        })
      })
    })
    
    return { nodes, edges }
  }
  
  /**
   * Generate component level JSON
   */
  private generateComponentJSON(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    nodes: any[],
    edges: any[]
  ): object {
    // For each container, show internal components
    composition.constructs.forEach(construct => {
      const def = catalog.get(construct.constructId)
      if (!def) return
      
      // Main component
      nodes.push({
        id: `${construct.instanceName}-core`,
        type: 'component',
        data: {
          label: `${construct.instanceName} Core`,
          description: 'Core business logic',
          technology: this.getTechnology(def)
        }
      })
      
      // Add sub-components based on construct type
      if (def.metadata.category === 'api') {
        nodes.push({
          id: `${construct.instanceName}-router`,
          type: 'component',
          data: {
            label: 'API Router',
            description: 'Request routing',
            technology: 'REST'
          }
        })
        
        nodes.push({
          id: `${construct.instanceName}-auth`,
          type: 'component',
          data: {
            label: 'Auth Middleware',
            description: 'Authentication and authorization',
            technology: 'JWT'
          }
        })
        
        // Internal connections
        edges.push({
          id: `${construct.instanceName}-router-to-auth`,
          source: `${construct.instanceName}-router`,
          target: `${construct.instanceName}-auth`
        })
        
        edges.push({
          id: `${construct.instanceName}-auth-to-core`,
          source: `${construct.instanceName}-auth`,
          target: `${construct.instanceName}-core`
        })
      }
    })
    
    return { nodes, edges }
  }
  
  /**
   * Generate code level JSON
   */
  private generateCodeJSON(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    nodes: any[],
    edges: any[]
  ): object {
    // Code level would show classes and interfaces
    // This requires actual code analysis
    return { nodes: [], edges: [] }
  }
  
  /**
   * Generate PlantUML format
   */
  private generatePlantUML(
    composition: ConstructComposition,
    level: string,
    catalog: Map<string, ConstructDefinition>
  ): string {
    const lines: string[] = ['@startuml']
    lines.push('!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml')
    
    if (level === 'container') {
      lines.push('!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml')
    } else if (level === 'component') {
      lines.push('!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml')
    }
    
    lines.push('')
    lines.push(`title ${composition.name} - ${level.charAt(0).toUpperCase() + level.slice(1)} Diagram`)
    lines.push('')
    
    switch (level) {
      case 'context':
        this.generateContextPlantUML(composition, catalog, lines)
        break
      case 'container':
        this.generateContainerPlantUML(composition, catalog, lines)
        break
      case 'component':
        this.generateComponentPlantUML(composition, catalog, lines)
        break
    }
    
    lines.push('@enduml')
    return lines.join('\n')
  }
  
  /**
   * Generate context level PlantUML
   */
  private generateContextPlantUML(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    lines: string[]
  ): void {
    lines.push('Person(user, "User", "System user")')
    lines.push(`System(system, "${composition.name}", "${composition.metadata?.description || 'Main system'}")`)
    
    const providers = new Set<string>()
    composition.constructs.forEach(c => {
      const def = catalog.get(c.constructId)
      if (def) {
        def.providers.forEach(p => providers.add(p))
      }
    })
    
    providers.forEach(provider => {
      lines.push(`System_Ext(${provider}, "${provider.toUpperCase()} Services", "${provider} cloud services")`)
      lines.push(`Rel(system, ${provider}, "Uses", "HTTPS/API")`)
    })
    
    lines.push('Rel(user, system, "Uses", "Web Browser")')
  }
  
  /**
   * Generate container level PlantUML
   */
  private generateContainerPlantUML(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    lines: string[]
  ): void {
    composition.constructs.forEach(construct => {
      const def = catalog.get(construct.constructId)
      if (!def) return
      
      const containerType = this.getContainerType(def)
      const tech = this.getTechnology(def)
      
      if (containerType === 'Database') {
        lines.push(`ContainerDb(${construct.instanceName}, "${construct.instanceName}", "${tech}", "${def.metadata.description}")`)
      } else if (containerType === 'MessageBus') {
        lines.push(`ContainerQueue(${construct.instanceName}, "${construct.instanceName}", "${tech}", "${def.metadata.description}")`)
      } else {
        lines.push(`Container(${construct.instanceName}, "${construct.instanceName}", "${tech}", "${def.metadata.description}")`)
      }
    })
    
    composition.constructs.forEach(construct => {
      construct.connections?.forEach(conn => {
        lines.push(`Rel(${construct.instanceName}, ${conn.targetInstance}, "${conn.type}")`)
      })
    })
  }
  
  /**
   * Generate component level PlantUML
   */
  private generateComponentPlantUML(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    lines: string[]
  ): void {
    composition.constructs.forEach(construct => {
      const def = catalog.get(construct.constructId)
      if (!def) return
      
      lines.push(`Component(${construct.instanceName}_core, "${construct.instanceName} Core", "Core Logic")`)
      
      if (def.metadata.category === 'api') {
        lines.push(`Component(${construct.instanceName}_router, "API Router", "REST")`)
        lines.push(`Component(${construct.instanceName}_auth, "Auth", "JWT")`)
        lines.push(`Rel(${construct.instanceName}_router, ${construct.instanceName}_auth, "Uses")`)
        lines.push(`Rel(${construct.instanceName}_auth, ${construct.instanceName}_core, "Uses")`)
      }
    })
  }
  
  /**
   * Generate Mermaid format
   */
  private generateMermaid(
    composition: ConstructComposition,
    level: string,
    catalog: Map<string, ConstructDefinition>
  ): string {
    const lines: string[] = []
    
    switch (level) {
      case 'context':
      case 'container':
        lines.push('graph TB')
        break
      case 'component':
        lines.push('graph LR')
        break
    }
    
    switch (level) {
      case 'context':
        this.generateContextMermaid(composition, catalog, lines)
        break
      case 'container':
        this.generateContainerMermaid(composition, catalog, lines)
        break
      case 'component':
        this.generateComponentMermaid(composition, catalog, lines)
        break
    }
    
    return lines.join('\n')
  }
  
  /**
   * Generate context level Mermaid
   */
  private generateContextMermaid(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    lines: string[]
  ): void {
    lines.push('    User[User<br/>System user]')
    lines.push(`    System[${composition.name}<br/>${composition.metadata?.description || 'Main system'}]`)
    
    const providers = new Set<string>()
    composition.constructs.forEach(c => {
      const def = catalog.get(c.constructId)
      if (def) {
        def.providers.forEach(p => providers.add(p))
      }
    })
    
    providers.forEach(provider => {
      lines.push(`    ${provider}[${provider.toUpperCase()} Services<br/>${provider} cloud services]`)
      lines.push(`    System -->|Uses<br/>HTTPS/API| ${provider}`)
    })
    
    lines.push('    User -->|Uses<br/>Web Browser| System')
    
    // Styling
    lines.push('    classDef person fill:#08427b,stroke:#073b6f,color:#fff')
    lines.push('    classDef system fill:#1168bd,stroke:#0e5ba6,color:#fff')
    lines.push('    classDef external fill:#999999,stroke:#8a8a8a,color:#fff')
    lines.push('    class User person')
    lines.push('    class System system')
    providers.forEach(provider => {
      lines.push(`    class ${provider} external`)
    })
  }
  
  /**
   * Generate container level Mermaid
   */
  private generateContainerMermaid(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    lines: string[]
  ): void {
    composition.constructs.forEach(construct => {
      const def = catalog.get(construct.constructId)
      if (!def) return
      
      const tech = this.getTechnology(def)
      lines.push(`    ${construct.instanceName}[${construct.instanceName}<br/>${tech}<br/>${def.metadata.description}]`)
    })
    
    composition.constructs.forEach(construct => {
      construct.connections?.forEach(conn => {
        const label = conn.type === 'async' ? `${conn.type}<br/>async` : conn.type
        lines.push(`    ${construct.instanceName} -->|${label}| ${conn.targetInstance}`)
      })
    })
    
    // Styling
    lines.push('    classDef container fill:#438dd5,stroke:#3c7fc7,color:#fff')
    lines.push('    classDef database fill:#438dd5,stroke:#3c7fc7,color:#fff')
    composition.constructs.forEach(construct => {
      lines.push(`    class ${construct.instanceName} container`)
    })
  }
  
  /**
   * Generate component level Mermaid
   */
  private generateComponentMermaid(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    lines: string[]
  ): void {
    composition.constructs.forEach(construct => {
      const def = catalog.get(construct.constructId)
      if (!def) return
      
      lines.push(`    ${construct.instanceName}_core[${construct.instanceName} Core<br/>Core Logic]`)
      
      if (def.metadata.category === 'api') {
        lines.push(`    ${construct.instanceName}_router[API Router<br/>REST]`)
        lines.push(`    ${construct.instanceName}_auth[Auth<br/>JWT]`)
        lines.push(`    ${construct.instanceName}_router --> ${construct.instanceName}_auth`)
        lines.push(`    ${construct.instanceName}_auth --> ${construct.instanceName}_core`)
      }
    })
    
    // Styling
    lines.push('    classDef component fill:#85bbea,stroke:#78a8d8,color:#000')
    composition.constructs.forEach(construct => {
      lines.push(`    class ${construct.instanceName}_core component`)
      const def = catalog.get(construct.constructId)
      if (def?.metadata.category === 'api') {
        lines.push(`    class ${construct.instanceName}_router component`)
        lines.push(`    class ${construct.instanceName}_auth component`)
      }
    })
  }
  
  /**
   * Get technology for construct
   */
  private getTechnology(def: ConstructDefinition): string {
    if (def.implementation.runtime === 'nodejs') return 'Node.js'
    if (def.implementation.runtime === 'python') return 'Python'
    if (def.implementation.runtime === 'go') return 'Go'
    
    if (def.metadata.tags.includes('typescript')) return 'TypeScript'
    if (def.metadata.tags.includes('javascript')) return 'JavaScript'
    
    return def.implementation.runtime || 'TypeScript'
  }
  
  /**
   * Get container type for construct
   */
  private getContainerType(def: ConstructDefinition): string {
    if (def.metadata.category === 'database') return 'Database'
    if (def.metadata.category === 'messaging') return 'MessageBus'
    if (def.metadata.category === 'storage') return 'FileSystem'
    if (def.metadata.category === 'api') return 'WebApp'
    return 'Container'
  }
}