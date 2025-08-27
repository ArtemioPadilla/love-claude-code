import React from 'react'
import { L0ExternalConstruct } from '../../base/L0Construct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType, 
  CloudProvider 
} from '../../types'

/**
 * NPM Package Primitive - L0 External Construct
 * 
 * Zero-dependency primitive for representing NPM packages and their metadata.
 * Provides data structures and validation for package.json parsing, dependency
 * trees, and semver version range resolution.
 * 
 * This is a pure data representation - no actual package installation or execution.
 */

// Type definitions
export interface NpmPackageMetadata {
  name: string
  version: string
  description?: string
  main?: string
  types?: string
  license?: string
  author?: string | { name: string; email?: string; url?: string }
  repository?: string | { type: string; url: string }
  keywords?: string[]
  scripts?: Record<string, string>
  engines?: Record<string, string>
  publishConfig?: Record<string, any>
}

export interface NpmDependency {
  name: string
  version: string
  versionRange?: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  resolved?: string
  integrity?: string
}

export interface NpmPackageTree {
  package: NpmPackageMetadata
  dependencies: Map<string, NpmDependency>
  devDependencies: Map<string, NpmDependency>
  peerDependencies: Map<string, NpmDependency>
  optionalDependencies: Map<string, NpmDependency>
}

export interface SemverRange {
  operator: '^' | '~' | '=' | '>' | '>=' | '<' | '<=' | '*' | 'x'
  major: number | '*'
  minor: number | '*'
  patch: number | '*'
  prerelease?: string
  build?: string
}

export interface NpmPackageConfig {
  packageJson: string | object
  lockFile?: string | object
  registry?: string
  scope?: string
}

export interface NpmPackagePrimitiveProps {
  config: NpmPackageConfig
  onParse?: (tree: NpmPackageTree) => void
  onValidate?: (result: { valid: boolean; errors?: string[] }) => void
  showVisualization?: boolean
}

/**
 * NPM Package Primitive Component
 */
export const NpmPackagePrimitive: React.FC<NpmPackagePrimitiveProps> = ({
  config,
  onParse,
  onValidate,
  showVisualization = false
}) => {
  const [tree, setTree] = React.useState<NpmPackageTree | null>(null)
  const [errors, setErrors] = React.useState<string[]>([])

  React.useEffect(() => {
    const construct = new NpmPackagePrimitiveConstruct()
    
    try {
      const parsed = construct.parseDefinition(config.packageJson)
      const validation = construct.validateConfiguration(parsed)
      
      if (validation.valid) {
        setTree(parsed)
        onParse?.(parsed)
        setErrors([])
      } else {
        setErrors(validation.errors || [])
        onValidate?.(validation)
      }
    } catch (error) {
      setErrors([error.message])
      onValidate?.({ valid: false, errors: [error.message] })
    }
  }, [config.packageJson])

  if (!showVisualization) {
    return null
  }

  return (
    <div className="npm-package-primitive">
      {errors.length > 0 && (
        <div className="errors">
          <h4>Validation Errors:</h4>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {tree && (
        <div className="package-info">
          <h3>{tree.package.name}@{tree.package.version}</h3>
          {tree.package.description && <p>{tree.package.description}</p>}
          
          <div className="dependencies">
            <h4>Dependencies ({tree.dependencies.size})</h4>
            <ul>
              {Array.from(tree.dependencies.entries()).map(([name, dep]) => (
                <li key={name}>{name}: {dep.versionRange || dep.version}</li>
              ))}
            </ul>
          </div>
          
          {tree.devDependencies.size > 0 && (
            <div className="dev-dependencies">
              <h4>Dev Dependencies ({tree.devDependencies.size})</h4>
              <ul>
                {Array.from(tree.devDependencies.entries()).map(([name, dep]) => (
                  <li key={name}>{name}: {dep.versionRange || dep.version}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * NPM Package Primitive Construct Class
 */
export class NpmPackagePrimitiveConstruct extends L0ExternalConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-npm-package-primitive',
    name: 'NPM Package Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.EXTERNAL,
    description: 'Zero-dependency primitive for NPM package metadata and dependency trees',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['external', 'package-management', 'npm'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['npm', 'package', 'dependency', 'semver', 'primitive'],
    inputs: [
      {
        name: 'packageJson',
        type: 'string | object',
        description: 'Package.json content as string or object',
        required: true
      },
      {
        name: 'lockFile',
        type: 'string | object',
        description: 'Package-lock.json or yarn.lock content',
        required: false
      },
      {
        name: 'registry',
        type: 'string',
        description: 'NPM registry URL',
        required: false,
        defaultValue: 'https://registry.npmjs.org'
      },
      {
        name: 'scope',
        type: 'string',
        description: 'NPM scope (e.g., @myorg)',
        required: false
      }
    ],
    outputs: [
      {
        name: 'packageTree',
        type: 'NpmPackageTree',
        description: 'Parsed package structure with dependencies'
      },
      {
        name: 'metadata',
        type: 'NpmPackageMetadata',
        description: 'Package metadata'
      },
      {
        name: 'dependencyCount',
        type: 'number',
        description: 'Total number of dependencies'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'NPM'
    },
    examples: [
      {
        title: 'Parse Package.json',
        description: 'Parse a package.json file',
        code: `const npmPackage = new NpmPackagePrimitiveConstruct()
const tree = npmPackage.parseDefinition({
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Validate package.json structure before parsing',
      'Handle missing or malformed fields gracefully',
      'Use for data representation only - no actual package operations'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      generatedBy: 'Claude'
    }
  }

  constructor() {
    super(NpmPackagePrimitiveConstruct.definition)
  }

  /**
   * Parse package.json into structured format
   */
  parseDefinition(input: string | object): NpmPackageTree {
    let packageData: any
    
    if (typeof input === 'string') {
      try {
        packageData = JSON.parse(input)
      } catch (error) {
        throw new Error(`Invalid JSON in package.json: ${error.message}`)
      }
    } else {
      packageData = input
    }

    // Extract metadata
    const metadata: NpmPackageMetadata = {
      name: packageData.name || 'unnamed-package',
      version: packageData.version || '0.0.0',
      description: packageData.description,
      main: packageData.main,
      types: packageData.types || packageData.typings,
      license: packageData.license,
      author: packageData.author,
      repository: packageData.repository,
      keywords: packageData.keywords,
      scripts: packageData.scripts,
      engines: packageData.engines,
      publishConfig: packageData.publishConfig
    }

    // Parse dependencies
    const dependencies = this.parseDependencies(packageData.dependencies || {}, 'dependencies')
    const devDependencies = this.parseDependencies(packageData.devDependencies || {}, 'devDependencies')
    const peerDependencies = this.parseDependencies(packageData.peerDependencies || {}, 'peerDependencies')
    const optionalDependencies = this.parseDependencies(packageData.optionalDependencies || {}, 'optionalDependencies')

    const tree: NpmPackageTree = {
      package: metadata,
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies
    }

    this.setOutput('packageTree', tree)
    this.setOutput('metadata', metadata)
    this.setOutput('dependencyCount', 
      dependencies.size + devDependencies.size + peerDependencies.size + optionalDependencies.size
    )

    return tree
  }

  /**
   * Parse dependency object into Map
   */
  private parseDependencies(
    deps: Record<string, string>, 
    type: NpmDependency['type']
  ): Map<string, NpmDependency> {
    const depMap = new Map<string, NpmDependency>()
    
    for (const [name, versionRange] of Object.entries(deps)) {
      const parsed = this.parseVersionRange(versionRange)
      depMap.set(name, {
        name,
        version: versionRange,
        versionRange,
        type,
        resolved: undefined,
        integrity: undefined
      })
    }
    
    return depMap
  }

  /**
   * Parse semver version range
   */
  parseVersionRange(range: string): SemverRange {
    // Handle special cases
    if (range === '*' || range === 'x') {
      return { operator: '*', major: '*', minor: '*', patch: '*' }
    }

    // Parse operator
    let operator: SemverRange['operator'] = '='
    let versionPart = range

    if (range.startsWith('^')) {
      operator = '^'
      versionPart = range.slice(1)
    } else if (range.startsWith('~')) {
      operator = '~'
      versionPart = range.slice(1)
    } else if (range.startsWith('>=')) {
      operator = '>='
      versionPart = range.slice(2)
    } else if (range.startsWith('>')) {
      operator = '>'
      versionPart = range.slice(1)
    } else if (range.startsWith('<=')) {
      operator = '<='
      versionPart = range.slice(2)
    } else if (range.startsWith('<')) {
      operator = '<'
      versionPart = range.slice(1)
    }

    // Parse version parts
    const versionMatch = versionPart.match(/^(\d+|x|\*)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(.*)$/)
    
    if (!versionMatch) {
      return { operator: '=', major: 0, minor: 0, patch: 0 }
    }

    const [, major, minor, patch, rest] = versionMatch
    
    // Parse prerelease and build
    let prerelease: string | undefined
    let build: string | undefined
    
    if (rest) {
      const prereleaseMatch = rest.match(/^-([^+]+)/)
      if (prereleaseMatch) {
        prerelease = prereleaseMatch[1]
      }
      
      const buildMatch = rest.match(/\+(.+)$/)
      if (buildMatch) {
        build = buildMatch[1]
      }
    }

    return {
      operator,
      major: major === 'x' || major === '*' ? '*' : parseInt(major, 10),
      minor: minor === 'x' || minor === '*' || !minor ? '*' : parseInt(minor, 10),
      patch: patch === 'x' || patch === '*' || !patch ? '*' : parseInt(patch, 10),
      prerelease,
      build
    }
  }

  /**
   * Resolve version range to check if a version satisfies it
   */
  resolveVersionRange(version: string, range: SemverRange): boolean {
    const versionParts = this.parseVersion(version)
    
    switch (range.operator) {
      case '*':
        return true
        
      case '^':
        // Compatible with same major version
        if (range.major === '*') return true
        if (versionParts.major !== range.major) return false
        if (range.minor === '*') return true
        if (versionParts.minor < range.minor) return false
        if (versionParts.minor > range.minor) return true
        if (range.patch === '*') return true
        return versionParts.patch >= range.patch
        
      case '~':
        // Compatible with same minor version
        if (range.major === '*') return true
        if (versionParts.major !== range.major) return false
        if (range.minor === '*') return true
        if (versionParts.minor !== range.minor) return false
        if (range.patch === '*') return true
        return versionParts.patch >= range.patch
        
      case '=':
        if (range.major !== '*' && versionParts.major !== range.major) return false
        if (range.minor !== '*' && versionParts.minor !== range.minor) return false
        if (range.patch !== '*' && versionParts.patch !== range.patch) return false
        return true
        
      case '>':
        return this.compareVersions(versionParts, range) > 0
        
      case '>=':
        return this.compareVersions(versionParts, range) >= 0
        
      case '<':
        return this.compareVersions(versionParts, range) < 0
        
      case '<=':
        return this.compareVersions(versionParts, range) <= 0
        
      default:
        return false
    }
  }

  /**
   * Parse version string
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!match) {
      return { major: 0, minor: 0, patch: 0 }
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    }
  }

  /**
   * Compare two versions
   */
  private compareVersions(
    v1: { major: number; minor: number; patch: number },
    v2: { major: number | '*'; minor: number | '*'; patch: number | '*' }
  ): number {
    if (v2.major === '*') return 0
    if (v1.major !== v2.major) return v1.major - v2.major
    
    if (v2.minor === '*') return 0
    if (v1.minor !== v2.minor) return v1.minor - v2.minor
    
    if (v2.patch === '*') return 0
    return v1.patch - v2.patch
  }

  /**
   * Validate package configuration
   */
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!config || typeof config !== 'object') {
      return { valid: false, errors: ['Invalid package configuration'] }
    }

    // Validate required fields
    if (!config.package?.name) {
      errors.push('Package name is required')
    }

    if (!config.package?.version) {
      errors.push('Package version is required')
    }

    // Validate version format
    if (config.package?.version && !this.isValidVersion(config.package.version)) {
      errors.push(`Invalid version format: ${config.package.version}`)
    }

    // Validate dependency names
    const validateDeps = (deps: Map<string, NpmDependency>, type: string) => {
      deps.forEach((dep, name) => {
        if (!this.isValidPackageName(name)) {
          errors.push(`Invalid ${type} package name: ${name}`)
        }
      })
    }

    if (config.dependencies) validateDeps(config.dependencies, 'dependency')
    if (config.devDependencies) validateDeps(config.devDependencies, 'devDependency')
    if (config.peerDependencies) validateDeps(config.peerDependencies, 'peerDependency')

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate package name
   */
  private isValidPackageName(name: string): boolean {
    // NPM package name rules
    if (!name || name.length > 214) return false
    if (name.startsWith('.') || name.startsWith('_')) return false
    if (name !== name.toLowerCase()) return false
    if (name.includes('..')) return false
    if (encodeURIComponent(name) !== name) {
      // Allow scoped packages
      const scopeMatch = name.match(/^@[^/]+\/[^/]+$/)
      if (!scopeMatch) return false
    }
    return true
  }

  /**
   * Validate version string
   */
  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+/.test(version)
  }

  /**
   * Get standardized configuration
   */
  getConfiguration(): NpmPackageConfig {
    return {
      packageJson: this.getInput('packageJson'),
      lockFile: this.getInput('lockFile'),
      registry: this.getInput('registry') || 'https://registry.npmjs.org',
      scope: this.getInput('scope')
    }
  }
}

// Factory function
export const createNpmPackagePrimitive = () => new NpmPackagePrimitiveConstruct()

// Export for registration
export const npmPackagePrimitive = new NpmPackagePrimitiveConstruct()