/**
 * Test Generator Service
 * Generates comprehensive test suites from parsed specifications
 */

import { 
  ParsedSpecification, 
  TestCase, 
  SpecRequirement, 
  SpecBehavior 
} from './SpecificationParser'
import { 
  ConstructLevel, 
  ConstructType,
  ConstructDefinition 
} from '../../constructs/types'

export interface GeneratedTest {
  /** Test file name */
  fileName: string
  /** Test code content */
  content: string
  /** Test framework (vitest, jest, playwright) */
  framework: 'vitest' | 'jest' | 'playwright'
  /** Test type */
  testType: 'unit' | 'integration' | 'e2e'
  /** Related specifications */
  specifications: string[]
  /** Coverage estimates */
  estimatedCoverage: number
}

export interface TestGenerationOptions {
  /** Target framework */
  framework?: 'vitest' | 'jest' | 'playwright'
  /** Include mock generation */
  generateMocks?: boolean
  /** Include setup/teardown */
  includeSetup?: boolean
  /** Generate edge cases */
  includeEdgeCases?: boolean
  /** Coverage target percentage */
  coverageTarget?: number
  /** Construct level for templates */
  constructLevel?: ConstructLevel
  /** Construct type for templates */
  constructType?: ConstructType
}

export class TestGenerator {
  private static readonly DEFAULT_OPTIONS: TestGenerationOptions = {
    framework: 'vitest',
    generateMocks: true,
    includeSetup: true,
    includeEdgeCases: true,
    coverageTarget: 80
  }

  /**
   * Generate test suite from parsed specification
   */
  static generateTestSuite(
    spec: ParsedSpecification,
    options: TestGenerationOptions = {}
  ): GeneratedTest[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const tests: GeneratedTest[] = []

    // Generate unit tests
    if (spec.testCases.length > 0 || spec.behaviors.length > 0) {
      tests.push(this.generateUnitTests(spec, opts))
    }

    // Generate integration tests if there are multiple components
    if (this.hasIntegrationPoints(spec)) {
      tests.push(this.generateIntegrationTests(spec, opts))
    }

    // Generate E2E tests for high-level requirements
    if (this.hasE2EScenarios(spec)) {
      tests.push(this.generateE2ETests(spec, opts))
    }

    return tests
  }

  /**
   * Generate unit tests from specification
   */
  private static generateUnitTests(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): GeneratedTest {
    const imports = this.generateImports(spec, options, 'unit')
    const setup = options.includeSetup ? this.generateSetup(spec, 'unit') : ''
    const testCases = this.generateTestCases(spec, options)
    const edgeCases = options.includeEdgeCases ? this.generateEdgeCases(spec) : ''

    const content = `${imports}

${setup}

describe('${spec.name}', () => {
${testCases}
${edgeCases}
})
`

    return {
      fileName: `${this.sanitizeFileName(spec.name)}.test.ts`,
      content,
      framework: options.framework!,
      testType: 'unit',
      specifications: spec.requirements.map(r => r.id),
      estimatedCoverage: this.estimateCoverage(spec, 'unit')
    }
  }

  /**
   * Generate integration tests
   */
  private static generateIntegrationTests(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): GeneratedTest {
    const imports = this.generateImports(spec, options, 'integration')
    const setup = this.generateIntegrationSetup(spec)
    const scenarios = this.generateIntegrationScenarios(spec)

    const content = `${imports}

${setup}

describe('${spec.name} - Integration', () => {
${scenarios}
})
`

    return {
      fileName: `${this.sanitizeFileName(spec.name)}.integration.test.ts`,
      content,
      framework: options.framework!,
      testType: 'integration',
      specifications: spec.requirements.map(r => r.id),
      estimatedCoverage: this.estimateCoverage(spec, 'integration')
    }
  }

  /**
   * Generate E2E tests
   */
  private static generateE2ETests(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): GeneratedTest {
    const framework = spec.requirements.some(r => r.description.toLowerCase().includes('ui')) 
      ? 'playwright' 
      : options.framework!

    const imports = this.generateE2EImports(spec, framework)
    const scenarios = this.generateE2EScenarios(spec)

    const content = `${imports}

describe('${spec.name} - E2E', () => {
${scenarios}
})
`

    return {
      fileName: `${this.sanitizeFileName(spec.name)}.e2e.test.ts`,
      content,
      framework: framework as any,
      testType: 'e2e',
      specifications: spec.requirements.map(r => r.id),
      estimatedCoverage: this.estimateCoverage(spec, 'e2e')
    }
  }

  /**
   * Generate imports based on test type and framework
   */
  private static generateImports(
    spec: ParsedSpecification,
    options: TestGenerationOptions,
    testType: 'unit' | 'integration' | 'e2e'
  ): string {
    const framework = options.framework!
    const imports: string[] = []

    // Framework imports
    if (framework === 'vitest') {
      imports.push("import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'")
    } else if (framework === 'jest') {
      imports.push("import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'")
    }

    // Testing library imports for UI components
    if (this.isUIComponent(spec)) {
      imports.push("import { render, screen, fireEvent, waitFor } from '@testing-library/react'")
      imports.push("import userEvent from '@testing-library/user-event'")
    }

    // Component/module imports
    const componentName = this.extractComponentName(spec)
    imports.push(`import { ${componentName} } from './${componentName}'`)

    // Mock imports if needed
    if (options.generateMocks && testType === 'unit') {
      imports.push("import { createMock } from '../../test-utils/mocks'")
    }

    return imports.join('\n')
  }

  /**
   * Generate test setup code
   */
  private static generateSetup(spec: ParsedSpecification, testType: string): string {
    const setup: string[] = []

    if (this.needsSetup(spec)) {
      setup.push(`beforeEach(() => {
  // Setup test environment
  ${this.generateSetupCode(spec)}
})`)

      setup.push(`afterEach(() => {
  // Cleanup
  ${this.generateCleanupCode(spec)}
})`)
    }

    return setup.join('\n\n')
  }

  /**
   * Generate test cases from behaviors and explicit test cases
   */
  private static generateTestCases(
    spec: ParsedSpecification,
    options: TestGenerationOptions
  ): string {
    const cases: string[] = []

    // Generate tests from behaviors (Given-When-Then)
    spec.behaviors.forEach(behavior => {
      cases.push(this.generateBehaviorTest(behavior, options))
    })

    // Generate tests from explicit test cases
    spec.testCases.forEach(testCase => {
      cases.push(this.generateExplicitTest(testCase, options))
    })

    // Generate tests for requirements without explicit tests
    spec.requirements
      .filter(req => !this.hasTestForRequirement(req, spec))
      .forEach(req => {
        cases.push(this.generateRequirementTest(req, options))
      })

    return cases.join('\n\n')
  }

  /**
   * Generate test from behavior (Given-When-Then)
   */
  private static generateBehaviorTest(
    behavior: SpecBehavior,
    _options: TestGenerationOptions
  ): string {
    const testName = `should ${behavior.when[0]?.toLowerCase() || 'perform action'} when ${behavior.given[0]?.toLowerCase() || 'given condition'}`
    
    return `  it('${testName}', async () => {
    // Given
    ${this.generateGivenCode(behavior.given[0] || '')}

    // When
    ${this.generateWhenCode(behavior.when[0] || '')}

    // Then
    ${this.generateThenCode(behavior.then[0] || '')}
  })`
  }

  /**
   * Generate test from explicit test case
   */
  private static generateExplicitTest(
    testCase: TestCase,
    options: TestGenerationOptions
  ): string {
    return `  it('${testCase.name}', async () => {
    // ${testCase.description}
    ${this.generateTestCode(testCase, options)}
  })`
  }

  /**
   * Generate test for requirement
   */
  private static generateRequirementTest(
    requirement: SpecRequirement,
    options: TestGenerationOptions
  ): string {
    return `  it('should ${requirement.description.toLowerCase()}', async () => {
    // Test for requirement: ${requirement.id}
    ${this.generateRequirementTestCode(requirement, options)}
  })`
  }

  /**
   * Generate edge case tests
   */
  private static generateEdgeCases(spec: ParsedSpecification): string {
    const edgeCases: string[] = []

    // Null/undefined inputs
    edgeCases.push(`  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      ${this.generateNullCheckCode(spec)}
    })

    it('should handle empty input', () => {
      ${this.generateEmptyCheckCode(spec)}
    })`)

    // Large inputs
    if (this.hasArrayInputs(spec)) {
      edgeCases.push(`    it('should handle large arrays', () => {
      ${this.generateLargeArrayTest(spec)}
    })`)
    }

    // Error cases
    if (this.hasErrorScenarios(spec)) {
      edgeCases.push(`    it('should handle errors appropriately', async () => {
      ${this.generateErrorHandlingTest(spec)}
    })`)
    }

    edgeCases.push('  })')

    return edgeCases.join('\n\n')
  }

  /**
   * Generate integration test setup
   */
  private static generateIntegrationSetup(_spec: ParsedSpecification): string {
    return `let testEnvironment: TestEnvironment

beforeAll(async () => {
  testEnvironment = await createTestEnvironment()
})

afterAll(async () => {
  await testEnvironment.cleanup()
})`
  }

  /**
   * Generate integration test scenarios
   */
  private static generateIntegrationScenarios(spec: ParsedSpecification): string {
    const scenarios: string[] = []

    // Component interaction tests
    scenarios.push(`  it('should integrate components correctly', async () => {
    ${this.generateComponentIntegrationTest(spec)}
  })`)

    // Data flow tests
    if (this.hasDataFlow(spec)) {
      scenarios.push(`  it('should handle data flow between components', async () => {
    ${this.generateDataFlowTest(spec)}
  })`)
    }

    // State management tests
    if (this.hasStateManagement(spec)) {
      scenarios.push(`  it('should manage state across components', async () => {
    ${this.generateStateManagementTest(spec)}
  })`)
    }

    return scenarios.join('\n\n')
  }

  /**
   * Generate E2E imports
   */
  private static generateE2EImports(spec: ParsedSpecification, framework: string): string {
    if (framework === 'playwright') {
      return `import { test, expect, Page } from '@playwright/test'
import { setupE2EEnvironment, teardownE2EEnvironment } from '../../test-utils/e2e'`
    }

    return `import { describe, it, expect } from '${framework}'
import { createE2ETestContext } from '../../test-utils/e2e'`
  }

  /**
   * Generate E2E test scenarios
   */
  private static generateE2EScenarios(spec: ParsedSpecification): string {
    const scenarios: string[] = []

    // User journey tests
    spec.requirements
      .filter(req => req.priority === 'high')
      .forEach(req => {
        scenarios.push(`  test('${req.description}', async ({ page }) => {
    ${this.generateE2EScenario(req)}
  })`)
      })

    return scenarios.join('\n\n')
  }

  // Helper methods for code generation
  private static generateGivenCode(given: string): string {
    // Generate setup code based on Given clause
    return `const context = setupContext()
    ${this.parseAndGenerateSetup(given)}`
  }

  private static generateWhenCode(when: string): string {
    // Generate action code based on When clause
    return `const result = await ${this.parseAndGenerateAction(when)}`
  }

  private static generateThenCode(then: string): string {
    // Generate assertion code based on Then clause
    return this.parseAndGenerateAssertion(then)
  }

  private static generateTestCode(testCase: TestCase, _options: TestGenerationOptions): string {
    const lines: string[] = []

    // Setup
    if (testCase.setup) {
      lines.push(`// Setup\n    ${testCase.setup}`)
    }

    // Action
    if (testCase.action) {
      lines.push(`// Action\n    ${testCase.action}`)
    }

    // Assertion
    if (testCase.assertion) {
      lines.push(`// Assert\n    ${testCase.assertion}`)
    }

    return lines.join('\n\n    ')
  }

  // Utility methods
  private static sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  private static extractComponentName(spec: ParsedSpecification): string {
    // Extract component name from title or first requirement
    const match = spec.name.match(/^(?:Create|Build|Implement)?\s*(.+)$/i)
    return match ? match[1].replace(/\s+/g, '') : 'Component'
  }

  private static isUIComponent(spec: ParsedSpecification): boolean {
    const uiKeywords = ['component', 'ui', 'render', 'display', 'button', 'form', 'input']
    const text = `${spec.name} ${spec.description}`.toLowerCase()
    return uiKeywords.some(keyword => text.includes(keyword))
  }

  private static hasIntegrationPoints(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.description.toLowerCase().includes('integrate') ||
      req.description.toLowerCase().includes('communicate') ||
      req.description.toLowerCase().includes('connect')
    )
  }

  private static hasE2EScenarios(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.priority === 'must' &&
      (req.description.toLowerCase().includes('user') ||
       req.description.toLowerCase().includes('workflow'))
    )
  }

  private static estimateCoverage(spec: ParsedSpecification, testType: string): number {
    const baseCoverage = {
      'unit': 70,
      'integration': 50,
      'e2e': 30
    }[testType] || 50

    // Adjust based on spec completeness
    const behaviorBonus = spec.behaviors.length * 5
    const testCaseBonus = spec.testCases.length * 3

    return Math.min(100, baseCoverage + behaviorBonus + testCaseBonus)
  }

  private static needsSetup(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.description.includes('state') ||
      req.description.includes('initialize') ||
      req.description.includes('setup')
    )
  }

  private static hasTestForRequirement(req: SpecRequirement, spec: ParsedSpecification): boolean {
    return spec.testCases.some(tc => 
      tc.requirementIds.includes(req.id) ||
      tc.description.includes(req.id)
    )
  }

  // Code generation helpers
  private static generateSetupCode(_spec: ParsedSpecification): string {
    return '// Initialize test state\n  // Mock dependencies\n  // Reset globals'
  }

  private static generateCleanupCode(_spec: ParsedSpecification): string {
    return '// Clear mocks\n  // Reset state\n  // Clean up resources'
  }

  private static generateRequirementTestCode(req: SpecRequirement, _options: TestGenerationOptions): string {
    return `// Arrange
    const input = createTestInput()
    
    // Act
    const result = await executeRequirement(input)
    
    // Assert
    expect(result).toBeDefined()
    expect(result).toMatchRequirement('${req.id}')`
  }

  private static generateNullCheckCode(_spec: ParsedSpecification): string {
    return `expect(() => component(null)).not.toThrow()
      expect(component(null)).toBeNull()`
  }

  private static generateEmptyCheckCode(_spec: ParsedSpecification): string {
    return `expect(component([])).toEqual([])
      expect(component('')).toBe('')`
  }

  private static hasArrayInputs(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.description.includes('array') ||
      req.description.includes('list') ||
      req.description.includes('collection')
    )
  }

  private static generateLargeArrayTest(_spec: ParsedSpecification): string {
    return `const largeArray = Array(10000).fill(0).map((_, i) => i)
      const result = await processArray(largeArray)
      expect(result).toBeDefined()
      expect(performance.now() - start).toBeLessThan(1000)`
  }

  private static hasErrorScenarios(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.description.includes('error') ||
      req.description.includes('fail') ||
      req.description.includes('invalid')
    )
  }

  private static generateErrorHandlingTest(_spec: ParsedSpecification): string {
    return `const invalidInput = createInvalidInput()
      await expect(component(invalidInput)).rejects.toThrow()
      expect(console.error).toHaveBeenCalled()`
  }

  private static generateComponentIntegrationTest(_spec: ParsedSpecification): string {
    return `const component1 = await createComponent1()
    const component2 = await createComponent2()
    
    const integrated = await integrateComponents(component1, component2)
    
    expect(integrated).toBeDefined()
    expect(integrated.isConnected).toBe(true)`
  }

  private static hasDataFlow(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.description.includes('data') &&
      (req.description.includes('flow') || req.description.includes('pass'))
    )
  }

  private static generateDataFlowTest(_spec: ParsedSpecification): string {
    return `const source = createDataSource()
    const sink = createDataSink()
    
    await connectDataFlow(source, sink)
    
    const data = { test: 'value' }
    await source.emit(data)
    
    await waitFor(() => {
      expect(sink.received).toEqual(data)
    })`
  }

  private static hasStateManagement(spec: ParsedSpecification): boolean {
    return spec.requirements.some(req => 
      req.description.includes('state') &&
      (req.description.includes('manage') || req.description.includes('sync'))
    )
  }

  private static generateStateManagementTest(_spec: ParsedSpecification): string {
    return `const store = createTestStore()
    const component1 = renderWithStore(<Component1 />, store)
    const component2 = renderWithStore(<Component2 />, store)
    
    // Update state in component1
    fireEvent.click(component1.getByText('Update'))
    
    // Verify state is reflected in component2
    await waitFor(() => {
      expect(component2.getByText('Updated')).toBeInTheDocument()
    })`
  }

  private static generateE2EScenario(req: SpecRequirement): string {
    return `// Navigate to application
    await page.goto('/')
    
    // Perform user actions
    await page.click('[data-testid="start"]')
    await page.fill('[data-testid="input"]', 'test value')
    await page.click('[data-testid="submit"]')
    
    // Verify outcome
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
    await expect(page.locator('[data-testid="result"]')).toContainText('Success')`
  }

  private static parseAndGenerateSetup(given: string): string {
    // Simple parser for Given clauses
    if (given.includes('user')) {
      return 'const user = createTestUser()'
    }
    if (given.includes('data')) {
      return 'const data = createTestData()'
    }
    return '// Custom setup based on: ' + given
  }

  private static parseAndGenerateAction(when: string): string {
    // Simple parser for When clauses
    if (when.includes('click')) {
      return 'fireEvent.click(element)'
    }
    if (when.includes('submit')) {
      return 'submitForm(data)'
    }
    if (when.includes('call')) {
      return 'callFunction(args)'
    }
    return 'performAction()'
  }

  private static parseAndGenerateAssertion(then: string): string {
    // Simple parser for Then clauses
    if (then.includes('should be')) {
      return 'expect(result).toBe(expected)'
    }
    if (then.includes('should contain')) {
      return 'expect(result).toContain(expected)'
    }
    if (then.includes('should not')) {
      return 'expect(result).not.toBeDefined()'
    }
    return 'expect(result).toMatchExpectation()'
  }
}

/**
 * Generate tests from construct definition
 */
export function generateConstructTests(
  construct: ConstructDefinition,
  options: TestGenerationOptions = {}
): GeneratedTest[] {
  // Create a parsed specification from construct definition
  const spec: ParsedSpecification = {
    type: 'construct',
    name: construct.name,
    description: construct.description,
    requirements: construct.inputs.map((input, i) => ({
      id: `REQ-${i + 1}`,
      description: `Handle ${input.name} input of type ${input.type}`,
      priority: input.required ? 'must' : 'should',
      type: 'functional',
      testable: true
    })),
    behaviors: [],
    testCases: construct.examples.map((example, i) => ({
      id: `TC-${i + 1}`,
      name: example.title,
      description: example.description,
      requirementIds: [],
      steps: [{action: 'Execute example', input: example.code}],
      expectedResult: 'Example runs successfully'
    })),
    metadata: {
      author: construct.author,
      version: construct.version,
      createdAt: new Date(),
      aiGenerated: false
    }
  }

  const opts = {
    ...options,
    constructLevel: construct.level as ConstructLevel,
    constructType: construct.type as ConstructType
  }

  return TestGenerator.generateTestSuite(spec, opts)
}