import { readFile, writeFile, ensureDir } from 'fs-extra'
import { join } from 'path'
import { glob } from 'glob'
import yaml from 'yaml'
import semver from 'semver'
import { 
  ConstructDefinition, 
  ConstructLevel, 
  CloudProvider,
  ConstructComposition,
  ValidationResult,
  CostEstimate,
  SecurityRecommendation,
  C4Diagram
} from './types.js'
import { ConstructAnalyzer } from './analyzer.js'
import { ConstructComposer } from './composer.js'
import { CostCalculator } from './costs.js'
import { SecurityAnalyzer } from './security.js'
import { DiagramGenerator } from './diagrams.js'

/**
 * MCP server implementation for construct catalog
 */
export class ConstructCatalogServer {
  private catalogPath: string
  private constructs: Map<string, ConstructDefinition> = new Map()
  private analyzer: ConstructAnalyzer
  private composer: ConstructComposer
  private costCalculator: CostCalculator
  private securityAnalyzer: SecurityAnalyzer
  private diagramGenerator: DiagramGenerator
  
  constructor(catalogPath: string = './catalog') {
    this.catalogPath = catalogPath
    this.analyzer = new ConstructAnalyzer()
    this.composer = new ConstructComposer()
    this.costCalculator = new CostCalculator()
    this.securityAnalyzer = new SecurityAnalyzer()
    this.diagramGenerator = new DiagramGenerator()
    
    this.loadCatalog()
  }
  
  /**
   * Load construct catalog from filesystem
   */
  private async loadCatalog(): Promise<void> {
    try {
      const files = await glob('**/*.construct.yaml', { cwd: this.catalogPath })
      
      for (const file of files) {
        const content = await readFile(join(this.catalogPath, file), 'utf-8')
        const construct = yaml.parse(content) as ConstructDefinition
        this.constructs.set(construct.id, construct)
      }
      
      console.log(`Loaded ${this.constructs.size} constructs from catalog`)
    } catch (error) {
      console.error('Failed to load catalog:', error)
    }
  }
  
  /**
   * Search constructs
   */
  async searchConstructs(params: {
    query?: string
    level?: ConstructLevel
    provider?: CloudProvider
    category?: string
    tags?: string[]
    minVersion?: string
  }): Promise<{ constructs: ConstructDefinition[]; total: number }> {
    let results = Array.from(this.constructs.values())
    
    // Filter by query
    if (params.query) {
      const query = params.query.toLowerCase()
      results = results.filter(c => 
        c.id.toLowerCase().includes(query) ||
        c.metadata.name.toLowerCase().includes(query) ||
        c.metadata.description.toLowerCase().includes(query) ||
        c.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Filter by level
    if (params.level) {
      results = results.filter(c => c.level === params.level)
    }
    
    // Filter by provider
    if (params.provider) {
      results = results.filter(c => c.providers.includes(params.provider))
    }
    
    // Filter by category
    if (params.category) {
      results = results.filter(c => c.metadata.category === params.category)
    }
    
    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      results = results.filter(c => 
        params.tags!.every(tag => c.metadata.tags.includes(tag))
      )
    }
    
    // Filter by version
    if (params.minVersion) {
      results = results.filter(c => 
        semver.gte(c.metadata.version, params.minVersion!)
      )
    }
    
    return {
      constructs: results,
      total: results.length
    }
  }
  
  /**
   * Get construct details
   */
  async getConstructDetails(params: {
    constructId: string
    includeExamples?: boolean
    includeTests?: boolean
  }): Promise<{
    construct: ConstructDefinition
    examples?: any[]
    tests?: any[]
    dependencies: string[]
  }> {
    const construct = this.constructs.get(params.constructId)
    if (!construct) {
      throw new Error(`Construct not found: ${params.constructId}`)
    }
    
    const result: any = {
      construct,
      dependencies: this.analyzer.getDependencies(construct)
    }
    
    if (params.includeExamples) {
      result.examples = await this.loadExamples(construct.id)
    }
    
    if (params.includeTests) {
      result.tests = await this.loadTests(construct.id)
    }
    
    return result
  }
  
  /**
   * Compose constructs
   */
  async composeConstructs(params: {
    name: string
    constructs: Array<{
      constructId: string
      instanceName: string
      config?: Record<string, any>
      connections?: Array<{
        targetInstance: string
        type: string
        config?: Record<string, any>
      }>
    }>
  }): Promise<{
    composition: ConstructComposition
    validation: ValidationResult
  }> {
    const composition = await this.composer.compose(
      params.name,
      params.constructs,
      this.constructs
    )
    
    const validation = await this.validateComposition({ composition })
    
    return { composition, validation }
  }
  
  /**
   * Validate composition
   */
  async validateComposition(params: {
    composition: ConstructComposition
  }): Promise<ValidationResult> {
    return this.composer.validate(params.composition, this.constructs)
  }
  
  /**
   * Estimate costs
   */
  async estimateCosts(params: {
    composition?: ConstructComposition
    constructId?: string
    provider: CloudProvider
    region?: string
    usage?: {
      requests?: number
      storage?: number
      compute?: number
    }
  }): Promise<CostEstimate> {
    if (params.composition) {
      return this.costCalculator.estimateComposition(
        params.composition,
        params.provider,
        params.region,
        params.usage,
        this.constructs
      )
    } else if (params.constructId) {
      const construct = this.constructs.get(params.constructId)
      if (!construct) {
        throw new Error(`Construct not found: ${params.constructId}`)
      }
      return this.costCalculator.estimateConstruct(
        construct,
        params.provider,
        params.region,
        params.usage
      )
    } else {
      throw new Error('Either composition or constructId must be provided')
    }
  }
  
  /**
   * Generate C4 diagram
   */
  async generateDiagram(params: {
    composition: ConstructComposition
    level: 'context' | 'container' | 'component' | 'code'
    format?: 'json' | 'plantuml' | 'mermaid'
  }): Promise<C4Diagram> {
    return this.diagramGenerator.generate(
      params.composition,
      params.level,
      params.format || 'json',
      this.constructs
    )
  }
  
  /**
   * Get security recommendations
   */
  async getSecurityRecommendations(params: {
    composition?: ConstructComposition
    constructId?: string
    provider: CloudProvider
  }): Promise<SecurityRecommendation[]> {
    if (params.composition) {
      return this.securityAnalyzer.analyzeComposition(
        params.composition,
        params.provider,
        this.constructs
      )
    } else if (params.constructId) {
      const construct = this.constructs.get(params.constructId)
      if (!construct) {
        throw new Error(`Construct not found: ${params.constructId}`)
      }
      return this.securityAnalyzer.analyzeConstruct(
        construct,
        params.provider
      )
    } else {
      throw new Error('Either composition or constructId must be provided')
    }
  }
  
  /**
   * Create construct from code
   */
  async createConstructFromCode(params: {
    name: string
    description: string
    level: ConstructLevel
    code: string
    language: 'typescript' | 'python' | 'go'
    provider: CloudProvider
    category?: string
    tags?: string[]
  }): Promise<{
    construct: ConstructDefinition
    saved: boolean
  }> {
    const construct = await this.analyzer.createFromCode(params)
    
    // Save to catalog
    const filename = `${params.provider}/${params.level}/${construct.id}.construct.yaml`
    const filepath = join(this.catalogPath, filename)
    
    await ensureDir(join(this.catalogPath, params.provider, params.level))
    await writeFile(filepath, yaml.stringify(construct))
    
    // Add to in-memory catalog
    this.constructs.set(construct.id, construct)
    
    return {
      construct,
      saved: true
    }
  }
  
  /**
   * Load examples for a construct
   */
  private async loadExamples(constructId: string): Promise<any[]> {
    try {
      const examplesPath = join(this.catalogPath, 'examples', `${constructId}.examples.yaml`)
      const content = await readFile(examplesPath, 'utf-8')
      return yaml.parse(content)
    } catch {
      return []
    }
  }
  
  /**
   * Load tests for a construct
   */
  private async loadTests(constructId: string): Promise<any[]> {
    try {
      const testsPath = join(this.catalogPath, 'tests', `${constructId}.tests.yaml`)
      const content = await readFile(testsPath, 'utf-8')
      return yaml.parse(content)
    } catch {
      return []
    }
  }
  
  // Schema methods for MCP registration
  getSearchConstructsSchema() {
    return {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        level: { 
          type: 'string', 
          enum: ['L0', 'L1', 'L2', 'L3'],
          description: 'Construct level filter'
        },
        provider: {
          type: 'string',
          enum: ['aws', 'firebase', 'azure', 'gcp', 'local'],
          description: 'Cloud provider filter'
        },
        category: { type: 'string', description: 'Category filter' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags filter'
        },
        minVersion: { type: 'string', description: 'Minimum version filter' }
      }
    }
  }
  
  getConstructDetailsSchema() {
    return {
      type: 'object',
      properties: {
        constructId: { type: 'string', description: 'Construct ID', required: true },
        includeExamples: { type: 'boolean', description: 'Include examples' },
        includeTests: { type: 'boolean', description: 'Include tests' }
      },
      required: ['constructId']
    }
  }
  
  getComposeConstructsSchema() {
    return {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Composition name', required: true },
        constructs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constructId: { type: 'string', required: true },
              instanceName: { type: 'string', required: true },
              config: { type: 'object' },
              connections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    targetInstance: { type: 'string', required: true },
                    type: { type: 'string', required: true },
                    config: { type: 'object' }
                  }
                }
              }
            }
          },
          required: true
        }
      },
      required: ['name', 'constructs']
    }
  }
  
  getValidateCompositionSchema() {
    return {
      type: 'object',
      properties: {
        composition: { type: 'object', required: true }
      },
      required: ['composition']
    }
  }
  
  getEstimateCostsSchema() {
    return {
      type: 'object',
      properties: {
        composition: { type: 'object' },
        constructId: { type: 'string' },
        provider: { type: 'string', enum: ['aws', 'firebase', 'azure', 'gcp'], required: true },
        region: { type: 'string' },
        usage: {
          type: 'object',
          properties: {
            requests: { type: 'number' },
            storage: { type: 'number' },
            compute: { type: 'number' }
          }
        }
      },
      required: ['provider']
    }
  }
  
  getGenerateDiagramSchema() {
    return {
      type: 'object',
      properties: {
        composition: { type: 'object', required: true },
        level: { 
          type: 'string', 
          enum: ['context', 'container', 'component', 'code'],
          required: true 
        },
        format: { type: 'string', enum: ['json', 'plantuml', 'mermaid'] }
      },
      required: ['composition', 'level']
    }
  }
  
  getSecurityRecommendationsSchema() {
    return {
      type: 'object',
      properties: {
        composition: { type: 'object' },
        constructId: { type: 'string' },
        provider: { type: 'string', enum: ['aws', 'firebase', 'azure', 'gcp'], required: true }
      },
      required: ['provider']
    }
  }
  
  getCreateConstructFromCodeSchema() {
    return {
      type: 'object',
      properties: {
        name: { type: 'string', required: true },
        description: { type: 'string', required: true },
        level: { type: 'string', enum: ['L0', 'L1', 'L2', 'L3'], required: true },
        code: { type: 'string', required: true },
        language: { type: 'string', enum: ['typescript', 'python', 'go'], required: true },
        provider: { type: 'string', enum: ['aws', 'firebase', 'azure', 'gcp'], required: true },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['name', 'description', 'level', 'code', 'language', 'provider']
    }
  }
}