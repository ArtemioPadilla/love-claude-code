/**
 * Specification Validator Service
 * Validates and lints specifications for quality and completeness
 */

import { ParsedSpecification, SpecRequirement, SpecBehavior, TestCase } from './SpecificationParser'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
  score: SpecificationScore
}

export interface ValidationError {
  type: 'error'
  code: string
  message: string
  location?: {
    line?: number
    section?: string
    element?: string
  }
  severity: 'critical' | 'major' | 'minor'
}

export interface ValidationWarning {
  type: 'warning'
  code: string
  message: string
  location?: {
    line?: number
    section?: string
    element?: string
  }
}

export interface ValidationSuggestion {
  type: 'suggestion'
  code: string
  message: string
  improvement: string
  example?: string
}

export interface SpecificationScore {
  overall: number // 0-100
  completeness: number
  clarity: number
  testability: number
  coverage: number
}

export interface ValidationOptions {
  strictMode?: boolean
  checkGrammar?: boolean
  checkCompleteness?: boolean
  checkTestability?: boolean
  checkConsistency?: boolean
  minScore?: number
}

export class SpecValidator {
  private static readonly DEFAULT_OPTIONS: ValidationOptions = {
    strictMode: false,
    checkGrammar: true,
    checkCompleteness: true,
    checkTestability: true,
    checkConsistency: true,
    minScore: 70
  }

  /**
   * Validate a parsed specification
   */
  static validate(
    spec: ParsedSpecification,
    options: ValidationOptions = {}
  ): ValidationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // Validate structure
    this.validateStructure(spec, errors, warnings, opts)

    // Validate requirements
    this.validateRequirements(spec.requirements, errors, warnings, suggestions, opts)

    // Validate behaviors
    this.validateBehaviors(spec.behaviors, errors, warnings, suggestions, opts)

    // Validate test cases
    this.validateTestCases(spec.testCases, errors, warnings, suggestions, opts)

    // Check consistency
    if (opts.checkConsistency) {
      this.checkConsistency(spec, errors, warnings)
    }

    // Calculate score
    const score = this.calculateScore(spec, errors, warnings)

    // Check minimum score
    if (opts.strictMode && score.overall < (opts.minScore || 70)) {
      errors.push({
        type: 'error',
        code: 'SPEC_SCORE_TOO_LOW',
        message: `Specification score (${score.overall}) is below minimum required (${opts.minScore})`,
        severity: 'major'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score
    }
  }

  /**
   * Validate specification structure
   */
  private static validateStructure(
    spec: ParsedSpecification,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    _options: ValidationOptions
  ): void {
    // Check title
    if (!spec.title || spec.title.trim().length === 0) {
      errors.push({
        type: 'error',
        code: 'MISSING_TITLE',
        message: 'Specification must have a title',
        location: { section: 'metadata' },
        severity: 'critical'
      })
    } else if (spec.title.length < 10) {
      warnings.push({
        type: 'warning',
        code: 'SHORT_TITLE',
        message: 'Specification title is very short',
        location: { section: 'metadata' }
      })
    }

    // Check description
    if (!spec.description || spec.description.trim().length === 0) {
      errors.push({
        type: 'error',
        code: 'MISSING_DESCRIPTION',
        message: 'Specification must have a description',
        location: { section: 'metadata' },
        severity: 'major'
      })
    }

    // Check for at least one requirement or behavior
    if (spec.requirements.length === 0 && spec.behaviors.length === 0) {
      errors.push({
        type: 'error',
        code: 'NO_REQUIREMENTS',
        message: 'Specification must have at least one requirement or behavior',
        severity: 'critical'
      })
    }

    // Check metadata
    if (!spec.metadata.author) {
      warnings.push({
        type: 'warning',
        code: 'MISSING_AUTHOR',
        message: 'Specification should include author information',
        location: { section: 'metadata' }
      })
    }
  }

  /**
   * Validate requirements
   */
  private static validateRequirements(
    requirements: SpecRequirement[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    options: ValidationOptions
  ): void {
    const seenIds = new Set<string>()

    requirements.forEach((req, _index) => {
      // Check for duplicate IDs
      if (seenIds.has(req.id)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_REQUIREMENT_ID',
          message: `Duplicate requirement ID: ${req.id}`,
          location: { section: 'requirements', element: req.id },
          severity: 'major'
        })
      }
      seenIds.add(req.id)

      // Check description
      if (!req.description || req.description.trim().length === 0) {
        errors.push({
          type: 'error',
          code: 'EMPTY_REQUIREMENT',
          message: `Requirement ${req.id} has no description`,
          location: { section: 'requirements', element: req.id },
          severity: 'major'
        })
      }

      // Check testability
      if (options.checkTestability && !req.testable) {
        warnings.push({
          type: 'warning',
          code: 'NON_TESTABLE_REQUIREMENT',
          message: `Requirement ${req.id} is marked as non-testable`,
          location: { section: 'requirements', element: req.id }
        })
      }

      // Check for vague requirements
      const vagueTerms = ['should', 'might', 'could', 'maybe', 'possibly']
      const lowerDesc = req.description.toLowerCase()
      const foundVagueTerms = vagueTerms.filter(term => lowerDesc.includes(term))
      
      if (foundVagueTerms.length > 0) {
        suggestions.push({
          type: 'suggestion',
          code: 'VAGUE_REQUIREMENT',
          message: `Requirement ${req.id} contains vague terms: ${foundVagueTerms.join(', ')}`,
          improvement: 'Use definitive language like "must", "shall", or "will"',
          example: req.description.replace(/should/gi, 'must')
        })
      }

      // Check for measurable criteria
      if (req.type === 'performance' && !this.containsMeasurableCriteria(req.description)) {
        warnings.push({
          type: 'warning',
          code: 'NO_MEASURABLE_CRITERIA',
          message: `Performance requirement ${req.id} lacks measurable criteria`,
          location: { section: 'requirements', element: req.id }
        })
      }
    })
  }

  /**
   * Validate behaviors (Given-When-Then)
   */
  private static validateBehaviors(
    behaviors: SpecBehavior[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    _options: ValidationOptions
  ): void {
    behaviors.forEach((behavior, _index) => {
      // Check structure
      if (!behavior.given || behavior.given.trim().length === 0) {
        errors.push({
          type: 'error',
          code: 'MISSING_GIVEN',
          message: `Behavior ${index + 1} missing "Given" clause`,
          location: { section: 'behaviors', element: `behavior-${index}` },
          severity: 'major'
        })
      }

      if (!behavior.when || behavior.when.trim().length === 0) {
        errors.push({
          type: 'error',
          code: 'MISSING_WHEN',
          message: `Behavior ${index + 1} missing "When" clause`,
          location: { section: 'behaviors', element: `behavior-${index}` },
          severity: 'major'
        })
      }

      if (!behavior.then || behavior.then.trim().length === 0) {
        errors.push({
          type: 'error',
          code: 'MISSING_THEN',
          message: `Behavior ${index + 1} missing "Then" clause`,
          location: { section: 'behaviors', element: `behavior-${index}` },
          severity: 'major'
        })
      }

      // Check clarity
      if (behavior.when && behavior.when.split(' ').length > 20) {
        suggestions.push({
          type: 'suggestion',
          code: 'COMPLEX_WHEN_CLAUSE',
          message: `Behavior ${index + 1} has a complex "When" clause`,
          improvement: 'Consider breaking this into multiple behaviors',
          example: 'When the user clicks the button\nAnd the form is valid\nThen...'
        })
      }

      // Check for concrete assertions
      if (behavior.then && this.isVagueAssertion(behavior.then)) {
        warnings.push({
          type: 'warning',
          code: 'VAGUE_ASSERTION',
          message: `Behavior ${index + 1} has a vague "Then" clause`,
          location: { section: 'behaviors', element: `behavior-${index}` }
        })
      }
    })
  }

  /**
   * Validate test cases
   */
  private static validateTestCases(
    testCases: TestCase[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    _options: ValidationOptions
  ): void {
    const seenNames = new Set<string>()

    testCases.forEach((testCase, _index) => {
      // Check for duplicate names
      if (seenNames.has(testCase.name)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_TEST_NAME',
          message: `Duplicate test case name: ${testCase.name}`,
          location: { section: 'testCases', element: testCase.id },
          severity: 'major'
        })
      }
      seenNames.add(testCase.name)

      // Check test steps
      if (!testCase.steps || testCase.steps.length === 0) {
        errors.push({
          type: 'error',
          code: 'NO_TEST_STEPS',
          message: `Test case "${testCase.name}" has no steps`,
          location: { section: 'testCases', element: testCase.id },
          severity: 'major'
        })
      }

      // Check expected result
      if (!testCase.expectedResult || testCase.expectedResult.trim().length === 0) {
        errors.push({
          type: 'error',
          code: 'NO_EXPECTED_RESULT',
          message: `Test case "${testCase.name}" has no expected result`,
          location: { section: 'testCases', element: testCase.id },
          severity: 'major'
        })
      }

      // Check requirement links
      if (testCase.requirementIds.length === 0) {
        warnings.push({
          type: 'warning',
          code: 'UNLINKED_TEST',
          message: `Test case "${testCase.name}" is not linked to any requirements`,
          location: { section: 'testCases', element: testCase.id }
        })
      }

      // Check for edge cases
      if (testCase.type === 'unit' && !this.hasEdgeCaseTests(testCases, testCase)) {
        suggestions.push({
          type: 'suggestion',
          code: 'MISSING_EDGE_CASES',
          message: `Consider adding edge case tests for "${testCase.name}"`,
          improvement: 'Add tests for boundary values, empty inputs, or error conditions',
          example: 'Test with null, undefined, empty string, maximum values'
        })
      }
    })
  }

  /**
   * Check consistency across specification
   */
  private static checkConsistency(
    spec: ParsedSpecification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check that all requirement IDs referenced in test cases exist
    const requirementIds = new Set(spec.requirements.map(r => r.id))
    
    spec.testCases.forEach(testCase => {
      testCase.requirementIds.forEach(reqId => {
        if (!requirementIds.has(reqId)) {
          errors.push({
            type: 'error',
            code: 'INVALID_REQUIREMENT_REF',
            message: `Test case "${testCase.name}" references non-existent requirement: ${reqId}`,
            location: { section: 'testCases', element: testCase.id },
            severity: 'major'
          })
        }
      })
    })

    // Check that all testable requirements have test cases
    const testedRequirements = new Set(
      spec.testCases.flatMap(tc => tc.requirementIds)
    )

    spec.requirements
      .filter(req => req.testable)
      .forEach(req => {
        if (!testedRequirements.has(req.id)) {
          warnings.push({
            type: 'warning',
            code: 'UNTESTED_REQUIREMENT',
            message: `Requirement ${req.id} has no test cases`,
            location: { section: 'requirements', element: req.id }
          })
        }
      })
  }

  /**
   * Calculate specification score
   */
  private static calculateScore(
    spec: ParsedSpecification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): SpecificationScore {
    // Completeness score
    let completeness = 100
    if (!spec.title) completeness -= 10
    if (!spec.description) completeness -= 10
    if (spec.requirements.length === 0) completeness -= 20
    if (spec.behaviors.length === 0) completeness -= 20
    if (spec.testCases.length === 0) completeness -= 20

    // Clarity score
    let clarity = 100
    clarity -= warnings.filter(w => w.code.includes('VAGUE')).length * 5
    clarity -= warnings.filter(w => w.code.includes('COMPLEX')).length * 3
    clarity = Math.max(0, clarity)

    // Testability score
    const testableReqs = spec.requirements.filter(r => r.testable)
    const testability = spec.requirements.length > 0
      ? (testableReqs.length / spec.requirements.length) * 100
      : 0

    // Coverage score
    const testedReqIds = new Set(spec.testCases.flatMap(tc => tc.requirementIds))
    const coverage = testableReqs.length > 0
      ? (testedReqIds.size / testableReqs.length) * 100
      : 0

    // Overall score
    const errorPenalty = errors.reduce((sum, err) => {
      return sum + (err.severity === 'critical' ? 20 : err.severity === 'major' ? 10 : 5)
    }, 0)

    const overall = Math.max(0, 
      ((completeness + clarity + testability + coverage) / 4) - errorPenalty
    )

    return {
      overall: Math.round(overall),
      completeness: Math.round(completeness),
      clarity: Math.round(clarity),
      testability: Math.round(testability),
      coverage: Math.round(coverage)
    }
  }

  /**
   * Check if description contains measurable criteria
   */
  private static containsMeasurableCriteria(description: string): boolean {
    const measureablePatterns = [
      /\d+\s*(ms|milliseconds?|seconds?|minutes?)/i,
      /\d+%/,
      /less than|greater than|at (least|most)/i,
      /within \d+/i
    ]

    return measureablePatterns.some(pattern => pattern.test(description))
  }

  /**
   * Check if assertion is vague
   */
  private static isVagueAssertion(assertion: string): boolean {
    const vaguePatterns = [
      /something happens/i,
      /it works/i,
      /correctly/i,
      /properly/i,
      /as expected/i
    ]

    return vaguePatterns.some(pattern => pattern.test(assertion))
  }

  /**
   * Check if edge case tests exist
   */
  private static hasEdgeCaseTests(
    allTests: TestCase[],
    baseTest: TestCase
  ): boolean {
    const baseName = baseTest.name.toLowerCase()
    const edgeCaseKeywords = ['edge', 'boundary', 'null', 'empty', 'invalid', 'error', 'max', 'min']

    return allTests.some(test => 
      test.id !== baseTest.id &&
      test.requirementIds.some(id => baseTest.requirementIds.includes(id)) &&
      edgeCaseKeywords.some(keyword => test.name.toLowerCase().includes(keyword))
    )
  }

  /**
   * Validate raw specification text
   */
  static async validateRaw(specification: string, options?: ValidationOptions): Promise<ValidationResult> {
    // First check if specification is parseable
    try {
      const { SpecificationParser } = await import('./SpecificationParser')
      const parsed = SpecificationParser.parse(specification)
      return this.validate(parsed, options)
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'error',
          code: 'PARSE_ERROR',
          message: `Failed to parse specification: ${(error as Error).message}`,
          severity: 'critical'
        }],
        warnings: [],
        suggestions: [],
        score: {
          overall: 0,
          completeness: 0,
          clarity: 0,
          testability: 0,
          coverage: 0
        }
      }
    }
  }
}