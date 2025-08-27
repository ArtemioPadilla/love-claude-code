/**
 * Construct Validator Service
 * Provides runtime validation for construct definitions to ensure they match required interfaces
 */

import { 
  ConstructDefinition, 
  ConstructLevel, 
  ConstructType, 
  CloudProvider,
  CostEstimate,
  SecurityConsideration,
  DeploymentConfig,
  C4Metadata,
  ConstructExample,
  ConstructInput,
  ConstructOutput
} from '../../constructs/types'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

export class ConstructValidator {
  /**
   * Validate a construct definition
   */
  static validate(construct: any, level?: ConstructLevel): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check if construct exists
    if (!construct) {
      errors.push({
        field: 'construct',
        message: 'Construct definition is null or undefined'
      })
      return { valid: false, errors, warnings }
    }

    // Validate metadata fields
    this.validateMetadata(construct, errors, warnings)

    // Validate type
    this.validateType(construct, errors, warnings)

    // Validate arrays
    this.validateArrays(construct, errors, warnings)

    // Validate cost structure
    this.validateCost(construct, errors, warnings)

    // Validate security
    this.validateSecurity(construct, errors, warnings)

    // Validate C4 metadata
    this.validateC4(construct, errors, warnings)

    // Validate deployment
    this.validateDeployment(construct, errors, warnings)

    // Level-specific validation
    if (level) {
      this.validateLevelSpecific(construct, level, errors, warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static validateMetadata(construct: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Required metadata fields
    const requiredFields = ['id', 'name', 'level', 'description', 'version', 'author']
    
    for (const field of requiredFields) {
      if (!construct[field]) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          value: construct[field]
        })
      }
    }

    // Validate level enum
    if (construct.level && !Object.values(ConstructLevel).includes(construct.level)) {
      errors.push({
        field: 'level',
        message: `Invalid construct level: ${construct.level}. Must be one of: ${Object.values(ConstructLevel).join(', ')}`,
        value: construct.level
      })
    }

    // Validate version format (semver)
    if (construct.version && !/^\d+\.\d+\.\d+/.test(construct.version)) {
      warnings.push({
        field: 'version',
        message: 'Version should follow semantic versioning (e.g., 1.0.0)',
        suggestion: '1.0.0'
      })
    }
  }

  private static validateType(construct: any, errors: ValidationError[], _warnings: ValidationWarning[]) {
    if (!construct.type) {
      errors.push({
        field: 'type',
        message: 'Construct type is required'
      })
    } else if (!Object.values(ConstructType).includes(construct.type)) {
      errors.push({
        field: 'type',
        message: `Invalid construct type: ${construct.type}. Must be one of: ${Object.values(ConstructType).join(', ')}`,
        value: construct.type
      })
    }
  }

  private static validateArrays(construct: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Categories
    if (!construct.categories) {
      errors.push({
        field: 'categories',
        message: 'Categories array is required'
      })
    } else if (!Array.isArray(construct.categories)) {
      errors.push({
        field: 'categories',
        message: 'Categories must be an array',
        value: construct.categories
      })
    } else if (construct.categories.length === 0) {
      warnings.push({
        field: 'categories',
        message: 'Construct should have at least one category'
      })
    }

    // Providers
    if (!construct.providers) {
      errors.push({
        field: 'providers',
        message: 'Providers array is required'
      })
    } else if (!Array.isArray(construct.providers)) {
      // Check if it's an object (L2/L3 format)
      if (typeof construct.providers === 'object') {
        warnings.push({
          field: 'providers',
          message: 'Providers should be an array of CloudProvider values, not an object',
          suggestion: 'Use ConstructTransformer to convert providers object to array'
        })
      } else {
        errors.push({
          field: 'providers',
          message: 'Providers must be an array',
          value: construct.providers
        })
      }
    } else {
      // Validate each provider
      for (const provider of construct.providers) {
        if (!Object.values(CloudProvider).includes(provider)) {
          errors.push({
            field: 'providers',
            message: `Invalid provider: ${provider}. Must be one of: ${Object.values(CloudProvider).join(', ')}`,
            value: provider
          })
        }
      }
    }

    // Tags
    if (!construct.tags) {
      errors.push({
        field: 'tags',
        message: 'Tags array is required'
      })
    } else if (!Array.isArray(construct.tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array',
        value: construct.tags
      })
    }

    // Inputs
    if (!construct.inputs) {
      errors.push({
        field: 'inputs',
        message: 'Inputs array is required'
      })
    } else if (!Array.isArray(construct.inputs)) {
      errors.push({
        field: 'inputs',
        message: 'Inputs must be an array',
        value: construct.inputs
      })
    }

    // Outputs
    if (!construct.outputs) {
      errors.push({
        field: 'outputs',
        message: 'Outputs array is required'
      })
    } else if (!Array.isArray(construct.outputs)) {
      errors.push({
        field: 'outputs',
        message: 'Outputs must be an array',
        value: construct.outputs
      })
    }

    // Examples
    if (!construct.examples) {
      errors.push({
        field: 'examples',
        message: 'Examples array is required'
      })
    } else if (!Array.isArray(construct.examples)) {
      errors.push({
        field: 'examples',
        message: 'Examples must be an array',
        value: construct.examples
      })
    }

    // Best practices
    if (!construct.bestPractices) {
      errors.push({
        field: 'bestPractices',
        message: 'Best practices array is required'
      })
    } else if (!Array.isArray(construct.bestPractices)) {
      errors.push({
        field: 'bestPractices',
        message: 'Best practices must be an array',
        value: construct.bestPractices
      })
    }
  }

  private static validateCost(construct: any, errors: ValidationError[], _warnings: ValidationWarning[]) {
    if (!construct.cost) {
      errors.push({
        field: 'cost',
        message: 'Cost object is required'
      })
    } else {
      if (typeof construct.cost.baseMonthly !== 'number') {
        errors.push({
          field: 'cost.baseMonthly',
          message: 'Cost baseMonthly must be a number',
          value: construct.cost.baseMonthly
        })
      }

      if (!construct.cost.usageFactors) {
        errors.push({
          field: 'cost.usageFactors',
          message: 'Cost usageFactors array is required'
        })
      } else if (!Array.isArray(construct.cost.usageFactors)) {
        errors.push({
          field: 'cost.usageFactors',
          message: 'Cost usageFactors must be an array',
          value: construct.cost.usageFactors
        })
      }
    }
  }

  private static validateSecurity(construct: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    if (!construct.security) {
      errors.push({
        field: 'security',
        message: 'Security array is required'
      })
    } else if (!Array.isArray(construct.security)) {
      errors.push({
        field: 'security',
        message: 'Security must be an array',
        value: construct.security
      })
    } else if (construct.security.length === 0) {
      warnings.push({
        field: 'security',
        message: 'Construct should have at least one security consideration'
      })
    }
  }

  private static validateC4(construct: any, errors: ValidationError[], _warnings: ValidationWarning[]) {
    if (!construct.c4) {
      errors.push({
        field: 'c4',
        message: 'C4 metadata is required'
      })
    } else {
      if (!construct.c4.type) {
        errors.push({
          field: 'c4.type',
          message: 'C4 type is required'
        })
      } else if (!['System', 'Container', 'Component', 'Code'].includes(construct.c4.type)) {
        errors.push({
          field: 'c4.type',
          message: `Invalid C4 type: ${construct.c4.type}. Must be one of: System, Container, Component, Code`,
          value: construct.c4.type
        })
      }
    }
  }

  private static validateDeployment(construct: any, errors: ValidationError[], _warnings: ValidationWarning[]) {
    if (!construct.deployment) {
      errors.push({
        field: 'deployment',
        message: 'Deployment configuration is required'
      })
    } else {
      if (!construct.deployment.requiredProviders) {
        errors.push({
          field: 'deployment.requiredProviders',
          message: 'Deployment requiredProviders array is required'
        })
      } else if (!Array.isArray(construct.deployment.requiredProviders)) {
        errors.push({
          field: 'deployment.requiredProviders',
          message: 'Deployment requiredProviders must be an array',
          value: construct.deployment.requiredProviders
        })
      }

      if (!construct.deployment.configSchema) {
        errors.push({
          field: 'deployment.configSchema',
          message: 'Deployment configSchema is required'
        })
      }
    }
  }

  private static validateLevelSpecific(construct: any, level: ConstructLevel, errors: ValidationError[], warnings: ValidationWarning[]) {
    switch (level) {
      case ConstructLevel.L0:
        // L0 constructs should be simple primitives
        if (construct.dependencies && construct.dependencies.length > 0) {
          warnings.push({
            field: 'dependencies',
            message: 'L0 constructs should not have dependencies on other constructs'
          })
        }
        break

      case ConstructLevel.L1:
        // L1 constructs build on L0
        if (!construct.dependencies || construct.dependencies.length === 0) {
          warnings.push({
            field: 'dependencies',
            message: 'L1 constructs typically depend on L0 primitives'
          })
        }
        break

      case ConstructLevel.L2:
        // L2 constructs are patterns
        if (construct.type !== ConstructType.Pattern && construct.type !== ConstructType.PATTERN) {
          warnings.push({
            field: 'type',
            message: 'L2 constructs are typically Pattern type',
            suggestion: ConstructType.Pattern
          })
        }
        break

      case ConstructLevel.L3:
        // L3 constructs are complete applications
        if (construct.type !== ConstructType.Application) {
          warnings.push({
            field: 'type',
            message: 'L3 constructs should be Application type',
            suggestion: ConstructType.Application
          })
        }
        break
    }
  }

  /**
   * Fix common validation issues automatically
   */
  static autoFix(construct: any): any {
    const fixed = { ...construct }

    // Fix missing metadata fields
    if (!fixed.version) {
      fixed.version = '1.0.0'
    }
    if (!fixed.author) {
      fixed.author = 'Love Claude Code Team'
    }

    // Ensure arrays exist
    fixed.categories = fixed.categories || []
    fixed.tags = fixed.tags || []
    fixed.inputs = fixed.inputs || []
    fixed.outputs = fixed.outputs || []
    fixed.examples = fixed.examples || []
    fixed.bestPractices = fixed.bestPractices || []
    fixed.security = fixed.security || []

    // Fix cost structure
    if (!fixed.cost) {
      fixed.cost = {
        baseMonthly: 0,
        usageFactors: [],
        notes: ['Cost not specified']
      }
    } else {
      fixed.cost.baseMonthly = fixed.cost.baseMonthly || 0
      fixed.cost.usageFactors = fixed.cost.usageFactors || []
    }

    // Fix C4 metadata
    if (!fixed.c4) {
      fixed.c4 = {
        type: 'Component',
        technology: 'TypeScript'
      }
    }

    // Fix deployment
    if (!fixed.deployment) {
      fixed.deployment = {
        requiredProviders: [],
        configSchema: {}
      }
    } else {
      fixed.deployment.requiredProviders = fixed.deployment.requiredProviders || []
      fixed.deployment.configSchema = fixed.deployment.configSchema || {}
    }

    return fixed
  }
}

// Export convenience functions for specific validation types
export function validateConstructSpecification(spec: any): ValidationResult {
  return ConstructValidator.validate(spec)
}

export function validateConstructImplementation(implementation: any): ValidationResult {
  // For now, just check if it's a non-empty string
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  if (!implementation || typeof implementation !== 'string' || implementation.trim() === '') {
    errors.push({
      field: 'implementation',
      message: 'Implementation code is required'
    })
  }
  
  return { valid: errors.length === 0, errors, warnings }
}

export function validateConstructTests(tests: any): ValidationResult {
  // For now, just check if it's a non-empty string
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  if (!tests || typeof tests !== 'string' || tests.trim() === '') {
    warnings.push({
      field: 'tests',
      message: 'Tests are recommended for all constructs'
    })
  }
  
  return { valid: errors.length === 0, errors, warnings }
}

export function validateConstruct(construct: any): ValidationResult {
  return ConstructValidator.validate(construct)
}