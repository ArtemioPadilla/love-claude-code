import { 
  ConstructDefinition, 
  ConstructLevel, 
  CloudProvider,
  ConstructMetadata,
  SecurityConsideration 
} from './types.js'

/**
 * Analyzes constructs and code to extract metadata
 */
export class ConstructAnalyzer {
  /**
   * Get dependencies for a construct
   */
  getDependencies(construct: ConstructDefinition): string[] {
    const deps: Set<string> = new Set(construct.dependencies || [])
    
    // Analyze inputs that reference other constructs
    Object.entries(construct.inputs).forEach(([key, input]) => {
      if (input.type.startsWith('Ref<') && input.type.endsWith('>')) {
        const refType = input.type.slice(4, -1)
        if (refType.includes('.')) {
          deps.add(refType.split('.')[0])
        }
      }
    })
    
    return Array.from(deps)
  }
  
  /**
   * Create construct from code
   */
  async createFromCode(params: {
    name: string
    description: string
    level: ConstructLevel
    code: string
    language: 'typescript' | 'python' | 'go'
    provider: CloudProvider
    category?: string
    tags?: string[]
  }): Promise<ConstructDefinition> {
    // Parse code to extract structure
    const analysis = this.analyzeCode(params.code, params.language)
    
    // Generate construct ID
    const id = this.generateConstructId(params.name, params.provider, params.level)
    
    // Build metadata
    const metadata: ConstructMetadata = {
      name: params.name,
      description: params.description,
      version: '1.0.0',
      author: 'MCP Generated',
      category: params.category || this.inferCategory(params.name, analysis),
      tags: params.tags || this.inferTags(params.name, analysis, params.provider),
    }
    
    // Extract inputs/outputs from code
    const { inputs, outputs } = this.extractInterface(analysis, params.language)
    
    // Analyze security considerations
    const security = this.analyzeSecurityConsiderations(params.code, params.provider)
    
    // Build construct definition
    const construct: ConstructDefinition = {
      id,
      level: params.level,
      metadata,
      providers: [params.provider],
      inputs,
      outputs,
      dependencies: analysis.imports,
      security,
      implementation: {
        type: 'pulumi',
        source: params.code,
        runtime: this.getRuntime(params.language)
      }
    }
    
    return construct
  }
  
  /**
   * Analyze code structure
   */
  private analyzeCode(code: string, language: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      classes: [],
      functions: [],
      imports: [],
      exports: [],
      types: []
    }
    
    switch (language) {
      case 'typescript':
        return this.analyzeTypeScript(code)
      case 'python':
        return this.analyzePython(code)
      case 'go':
        return this.analyzeGo(code)
      default:
        return analysis
    }
  }
  
  /**
   * Analyze TypeScript code
   */
  private analyzeTypeScript(code: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      classes: [],
      functions: [],
      imports: [],
      exports: [],
      types: []
    }
    
    // Simple regex-based analysis (in production, use proper AST parser)
    
    // Find imports
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
    let match
    while ((match = importRegex.exec(code)) !== null) {
      if (match[1].startsWith('@pulumi/')) {
        analysis.imports.push(match[1])
      }
    }
    
    // Find classes
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g
    while ((match = classRegex.exec(code)) !== null) {
      analysis.classes.push({
        name: match[1],
        extends: match[2]
      })
    }
    
    // Find interfaces
    const interfaceRegex = /interface\s+(\w+)\s*{([^}]+)}/g
    while ((match = interfaceRegex.exec(code)) !== null) {
      analysis.types.push({
        name: match[1],
        type: 'interface',
        definition: match[2]
      })
    }
    
    // Find exports
    const exportRegex = /export\s+(?:class|interface|function|const|type)\s+(\w+)/g
    while ((match = exportRegex.exec(code)) !== null) {
      analysis.exports.push(match[1])
    }
    
    return analysis
  }
  
  /**
   * Analyze Python code
   */
  private analyzePython(code: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      classes: [],
      functions: [],
      imports: [],
      exports: [],
      types: []
    }
    
    // Find imports
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(.+)/g
    let match
    while ((match = importRegex.exec(code)) !== null) {
      if (match[1] && match[1].startsWith('pulumi')) {
        analysis.imports.push(match[1])
      }
    }
    
    // Find classes
    const classRegex = /class\s+(\w+)(?:\(([^)]+)\))?:/g
    while ((match = classRegex.exec(code)) !== null) {
      analysis.classes.push({
        name: match[1],
        extends: match[2]
      })
    }
    
    // Find functions
    const funcRegex = /def\s+(\w+)\s*\([^)]*\)\s*(?:->.*)?:/g
    while ((match = funcRegex.exec(code)) !== null) {
      analysis.functions.push(match[1])
    }
    
    return analysis
  }
  
  /**
   * Analyze Go code
   */
  private analyzeGo(code: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      classes: [],
      functions: [],
      imports: [],
      exports: [],
      types: []
    }
    
    // Find imports
    const importRegex = /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g
    let match
    while ((match = importRegex.exec(code)) !== null) {
      const imports = match[1] || match[2]
      if (imports.includes('pulumi')) {
        analysis.imports.push('pulumi')
      }
    }
    
    // Find types
    const typeRegex = /type\s+(\w+)\s+(?:struct|interface)\s*{/g
    while ((match = typeRegex.exec(code)) !== null) {
      analysis.types.push({
        name: match[1],
        type: 'struct'
      })
    }
    
    // Find functions
    const funcRegex = /func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/g
    while ((match = funcRegex.exec(code)) !== null) {
      analysis.functions.push(match[1])
    }
    
    return analysis
  }
  
  /**
   * Extract inputs and outputs from code analysis
   */
  private extractInterface(analysis: CodeAnalysis, language: string): {
    inputs: Record<string, any>
    outputs: Record<string, any>
  } {
    const inputs: Record<string, any> = {}
    const outputs: Record<string, any> = {}
    
    // Look for Args/Config interfaces/classes
    const argsType = analysis.types.find(t => 
      t.name.endsWith('Args') || t.name.endsWith('Config') || t.name.endsWith('Props')
    )
    
    if (argsType && argsType.definition) {
      // Parse interface definition (simplified)
      const propRegex = /(\w+)(?:\?)?:\s*([^;]+);/g
      let match
      while ((match = propRegex.exec(argsType.definition)) !== null) {
        inputs[match[1]] = {
          type: match[2].trim(),
          description: `${match[1]} property`,
          required: !argsType.definition.includes(`${match[1]}?:`)
        }
      }
    }
    
    // Look for output types
    const outputType = analysis.types.find(t => 
      t.name.endsWith('Outputs') || t.name.endsWith('Result')
    )
    
    if (outputType && outputType.definition) {
      const propRegex = /(\w+):\s*([^;]+);/g
      let match
      while ((match = propRegex.exec(outputType.definition)) !== null) {
        outputs[match[1]] = {
          type: match[2].trim(),
          description: `${match[1]} output`
        }
      }
    }
    
    return { inputs, outputs }
  }
  
  /**
   * Analyze security considerations
   */
  private analyzeSecurityConsiderations(
    code: string, 
    provider: CloudProvider
  ): SecurityConsideration[] {
    const considerations: SecurityConsideration[] = []
    
    // Check for hardcoded secrets
    if (code.match(/["'](?:password|secret|key|token)["']\s*[:=]\s*["'][^"']+["']/i)) {
      considerations.push({
        type: 'other',
        description: 'Potential hardcoded secrets detected',
        severity: 'critical',
        mitigation: 'Use environment variables or secret management service'
      })
    }
    
    // Check for encryption
    if (!code.match(/encrypt|kms|tls|ssl/i)) {
      considerations.push({
        type: 'encryption',
        description: 'No encryption configuration detected',
        severity: 'medium',
        mitigation: 'Enable encryption at rest and in transit'
      })
    }
    
    // Check for public access
    if (code.match(/public|0\.0\.0\.0|::/i)) {
      considerations.push({
        type: 'network',
        description: 'Potential public access configuration',
        severity: 'high',
        mitigation: 'Restrict access to specific IP ranges or VPCs'
      })
    }
    
    // Provider-specific checks
    switch (provider) {
      case CloudProvider.AWS:
        if (!code.match(/iam|role|policy/i)) {
          considerations.push({
            type: 'access-control',
            description: 'No IAM configuration detected',
            severity: 'high',
            mitigation: 'Configure least-privilege IAM roles and policies'
          })
        }
        break
        
      case CloudProvider.Firebase:
        if (!code.match(/rules|auth/i)) {
          considerations.push({
            type: 'access-control',
            description: 'No Firebase security rules detected',
            severity: 'high',
            mitigation: 'Configure Firebase security rules'
          })
        }
        break
    }
    
    return considerations
  }
  
  /**
   * Generate construct ID
   */
  private generateConstructId(name: string, provider: CloudProvider, level: ConstructLevel): string {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    return `${provider}-${level.toLowerCase()}-${normalized}`
  }
  
  /**
   * Infer category from name and code
   */
  private inferCategory(name: string, analysis: CodeAnalysis): string {
    const nameLower = name.toLowerCase()
    
    if (nameLower.includes('api') || nameLower.includes('gateway')) return 'api'
    if (nameLower.includes('database') || nameLower.includes('db')) return 'database'
    if (nameLower.includes('storage') || nameLower.includes('bucket')) return 'storage'
    if (nameLower.includes('queue') || nameLower.includes('topic')) return 'messaging'
    if (nameLower.includes('function') || nameLower.includes('lambda')) return 'compute'
    if (nameLower.includes('auth') || nameLower.includes('identity')) return 'security'
    if (nameLower.includes('network') || nameLower.includes('vpc')) return 'networking'
    if (nameLower.includes('monitor') || nameLower.includes('log')) return 'observability'
    
    return 'general'
  }
  
  /**
   * Infer tags from name, code, and provider
   */
  private inferTags(name: string, analysis: CodeAnalysis, provider: CloudProvider): string[] {
    const tags: Set<string> = new Set([provider])
    const nameLower = name.toLowerCase()
    
    // Add technology tags
    if (analysis.imports.some(i => i.includes('express'))) tags.add('express')
    if (analysis.imports.some(i => i.includes('fastapi'))) tags.add('fastapi')
    if (analysis.imports.some(i => i.includes('gin'))) tags.add('gin')
    
    // Add feature tags
    if (nameLower.includes('serverless')) tags.add('serverless')
    if (nameLower.includes('container')) tags.add('container')
    if (nameLower.includes('microservice')) tags.add('microservice')
    if (nameLower.includes('rest')) tags.add('rest')
    if (nameLower.includes('graphql')) tags.add('graphql')
    if (nameLower.includes('websocket')) tags.add('websocket')
    
    return Array.from(tags)
  }
  
  /**
   * Get runtime for language
   */
  private getRuntime(language: string): string {
    switch (language) {
      case 'typescript': return 'nodejs'
      case 'python': return 'python'
      case 'go': return 'go'
      default: return 'nodejs'
    }
  }
}

interface CodeAnalysis {
  classes: Array<{ name: string; extends?: string }>
  functions: string[]
  imports: string[]
  exports: string[]
  types: Array<{
    name: string
    type: string
    definition?: string
  }>
}