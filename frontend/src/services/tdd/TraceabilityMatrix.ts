/**
 * Traceability Matrix Service
 * Maps requirements to tests and tracks coverage relationships
 */

import { ParsedSpecification, SpecRequirement, TestCase } from './SpecificationParser'
import { GeneratedTest } from './TestGenerator'
import { TestResult, TestSuiteResult } from './TestRunner'
import { RequirementCoverage } from './CoverageAnalyzer'

export interface TraceabilityMatrix {
  requirements: RequirementTrace[]
  tests: TestTrace[]
  coverage: MatrixCoverage
  gaps: TraceabilityGap[]
  mappings: RequirementTestMapping[]
  statistics: TraceabilityStatistics
}

export interface RequirementTrace {
  requirement: SpecRequirement
  tests: TestReference[]
  coverage: 'full' | 'partial' | 'none'
  lastTested?: Date
  testResults: TestResultSummary
  dependencies: string[] // Other requirement IDs
  risks: RiskAssessment[]
}

export interface TestTrace {
  test: TestReference
  requirements: string[] // Requirement IDs
  testType: 'unit' | 'integration' | 'e2e'
  lastRun?: Date
  lastResult?: 'pass' | 'fail' | 'skip'
  averageDuration?: number
  flakiness?: number // 0-1 score
}

export interface TestReference {
  id: string
  name: string
  fileName: string
  framework: string
}

export interface MatrixCoverage {
  totalRequirements: number
  coveredRequirements: number
  partiallyTestedRequirements: number
  untestedRequirements: number
  coveragePercentage: number
  testRedundancy: number // Tests covering same requirements
}

export interface TraceabilityGap {
  type: 'untested' | 'insufficient' | 'redundant' | 'orphaned'
  requirementId?: string
  testId?: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
}

export interface RequirementTestMapping {
  requirementId: string
  testIds: string[]
  mappingType: 'direct' | 'indirect' | 'derived'
  confidence: number // 0-1 score
}

export interface TestResultSummary {
  totalRuns: number
  passCount: number
  failCount: number
  skipCount: number
  passRate: number
  averageDuration: number
  lastRun?: Date
}

export interface RiskAssessment {
  riskType: 'untested' | 'flaky' | 'incomplete' | 'outdated'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  mitigation: string
}

export interface TraceabilityStatistics {
  requirementsCoverage: number
  testEffectiveness: number
  redundancyScore: number
  riskScore: number
  maturityLevel: 'initial' | 'developing' | 'established' | 'optimized'
}

export interface TraceabilityOptions {
  includeIndirectMappings?: boolean
  includeRiskAssessment?: boolean
  includeTestHistory?: boolean
  confidenceThreshold?: number
}

export class TraceabilityMatrix {
  private static testHistory: Map<string, TestResultSummary> = new Map()

  /**
   * Generate traceability matrix from specifications and tests
   */
  static generate(
    spec: ParsedSpecification,
    tests: GeneratedTest[],
    testResults?: TestSuiteResult[],
    options: TraceabilityOptions = {}
  ): TraceabilityMatrix {
    const requirementTraces = this.traceRequirements(spec, tests, testResults, options)
    const testTraces = this.traceTests(tests, spec, testResults)
    const mappings = this.generateMappings(spec, tests, options)
    const coverage = this.calculateCoverage(requirementTraces, testTraces)
    const gaps = this.identifyGaps(requirementTraces, testTraces, options)
    const statistics = this.calculateStatistics(requirementTraces, testTraces, gaps)

    return {
      requirements: requirementTraces,
      tests: testTraces,
      coverage,
      gaps,
      mappings,
      statistics
    }
  }

  /**
   * Trace requirements to tests
   */
  private static traceRequirements(
    spec: ParsedSpecification,
    tests: GeneratedTest[],
    testResults?: TestSuiteResult[],
    options: TraceabilityOptions = {}
  ): RequirementTrace[] {
    return spec.requirements.map(requirement => {
      // Find direct test mappings
      const directTests = this.findDirectTests(requirement, tests, spec)
      
      // Find indirect test mappings if enabled
      const indirectTests = options.includeIndirectMappings
        ? this.findIndirectTests(requirement, tests, spec)
        : []

      const allTests = [...directTests, ...indirectTests]
      
      // Get test results summary
      const testResultSummary = this.getTestResultSummary(
        allTests.map(t => t.id),
        testResults
      )

      // Assess risks if enabled
      const risks = options.includeRiskAssessment
        ? this.assessRequirementRisks(requirement, allTests, testResultSummary)
        : []

      // Determine coverage level
      const coverage = this.determineRequirementCoverage(requirement, allTests)

      // Find dependent requirements
      const dependencies = this.findRequirementDependencies(requirement, spec)

      return {
        requirement,
        tests: allTests,
        coverage,
        lastTested: testResultSummary.lastRun,
        testResults: testResultSummary,
        dependencies,
        risks
      }
    })
  }

  /**
   * Trace tests to requirements
   */
  private static traceTests(
    tests: GeneratedTest[],
    spec: ParsedSpecification,
    testResults?: TestSuiteResult[]
  ): TestTrace[] {
    return tests.map(test => {
      // Find requirements covered by this test
      const requirementIds = this.findTestRequirements(test, spec)
      
      // Get test execution history
      const history = this.getTestHistory(test.fileName, testResults)
      
      return {
        test: {
          id: test.fileName,
          name: test.fileName,
          fileName: test.fileName,
          framework: test.framework
        },
        requirements: requirementIds,
        testType: test.testType,
        lastRun: history?.lastRun,
        lastResult: history?.lastResult,
        averageDuration: history?.averageDuration,
        flakiness: history?.flakiness
      }
    })
  }

  /**
   * Generate requirement-test mappings
   */
  private static generateMappings(
    spec: ParsedSpecification,
    tests: GeneratedTest[],
    options: TraceabilityOptions = {}
  ): RequirementTestMapping[] {
    const mappings: RequirementTestMapping[] = []
    const confidenceThreshold = options.confidenceThreshold || 0.7

    spec.requirements.forEach(requirement => {
      const testMappings = tests
        .map(test => ({
          testId: test.fileName,
          confidence: this.calculateMappingConfidence(requirement, test, spec),
          mappingType: this.determineMappingType(requirement, test, spec)
        }))
        .filter(mapping => mapping.confidence >= confidenceThreshold)

      if (testMappings.length > 0) {
        mappings.push({
          requirementId: requirement.id,
          testIds: testMappings.map(m => m.testId),
          mappingType: testMappings[0].mappingType as 'direct' | 'indirect' | 'derived',
          confidence: Math.max(...testMappings.map(m => m.confidence))
        })
      }
    })

    return mappings
  }

  /**
   * Calculate coverage metrics
   */
  private static calculateCoverage(
    requirements: RequirementTrace[],
    tests: TestTrace[]
  ): MatrixCoverage {
    const totalRequirements = requirements.length
    const coveredRequirements = requirements.filter(r => r.coverage === 'full').length
    const partiallyTestedRequirements = requirements.filter(r => r.coverage === 'partial').length
    const untestedRequirements = requirements.filter(r => r.coverage === 'none').length

    // Calculate redundancy
    const requirementTestCounts = new Map<string, number>()
    tests.forEach(test => {
      test.requirements.forEach(reqId => {
        requirementTestCounts.set(reqId, (requirementTestCounts.get(reqId) || 0) + 1)
      })
    })

    const redundantTests = Array.from(requirementTestCounts.values())
      .filter(count => count > 3).length // More than 3 tests per requirement is considered redundant

    return {
      totalRequirements,
      coveredRequirements,
      partiallyTestedRequirements,
      untestedRequirements,
      coveragePercentage: totalRequirements > 0
        ? (coveredRequirements / totalRequirements) * 100
        : 0,
      testRedundancy: redundantTests
    }
  }

  /**
   * Identify traceability gaps
   */
  private static identifyGaps(
    requirements: RequirementTrace[],
    tests: TestTrace[],
    options: TraceabilityOptions = {}
  ): TraceabilityGap[] {
    const gaps: TraceabilityGap[] = []

    // Find untested requirements
    requirements
      .filter(r => r.coverage === 'none')
      .forEach(req => {
        gaps.push({
          type: 'untested',
          requirementId: req.requirement.id,
          description: `Requirement "${req.requirement.description}" has no tests`,
          severity: req.requirement.priority === 'high' ? 'critical' : 'high',
          recommendation: 'Create tests to cover this requirement'
        })
      })

    // Find insufficiently tested requirements
    requirements
      .filter(r => r.coverage === 'partial')
      .forEach(req => {
        gaps.push({
          type: 'insufficient',
          requirementId: req.requirement.id,
          description: `Requirement "${req.requirement.description}" is only partially tested`,
          severity: 'medium',
          recommendation: 'Add more comprehensive tests for edge cases'
        })
      })

    // Find orphaned tests
    tests
      .filter(t => t.requirements.length === 0)
      .forEach(test => {
        gaps.push({
          type: 'orphaned',
          testId: test.test.id,
          description: `Test "${test.test.name}" is not linked to any requirements`,
          severity: 'low',
          recommendation: 'Link test to requirements or remove if obsolete'
        })
      })

    // Find redundant tests
    const testsByRequirement = new Map<string, string[]>()
    tests.forEach(test => {
      test.requirements.forEach(reqId => {
        if (!testsByRequirement.has(reqId)) {
          testsByRequirement.set(reqId, [])
        }
        testsByRequirement.get(reqId)!.push(test.test.id)
      })
    })

    testsByRequirement.forEach((testIds, reqId) => {
      if (testIds.length > 5) {
        gaps.push({
          type: 'redundant',
          requirementId: reqId,
          description: `Requirement ${reqId} has ${testIds.length} tests (possible over-testing)`,
          severity: 'low',
          recommendation: 'Review and consolidate redundant tests'
        })
      }
    })

    return gaps
  }

  /**
   * Calculate traceability statistics
   */
  private static calculateStatistics(
    requirements: RequirementTrace[],
    tests: TestTrace[],
    gaps: TraceabilityGap[]
  ): TraceabilityStatistics {
    const totalRequirements = requirements.length
    const coveredRequirements = requirements.filter(r => r.coverage !== 'none').length
    const requirementsCoverage = totalRequirements > 0
      ? (coveredRequirements / totalRequirements) * 100
      : 0

    // Calculate test effectiveness
    const totalTests = tests.length
    const effectiveTests = tests.filter(t => t.requirements.length > 0).length
    const testEffectiveness = totalTests > 0
      ? (effectiveTests / totalTests) * 100
      : 0

    // Calculate redundancy score
    const redundantGaps = gaps.filter(g => g.type === 'redundant').length
    const redundancyScore = totalTests > 0
      ? (redundantGaps / totalTests) * 100
      : 0

    // Calculate risk score
    const criticalGaps = gaps.filter(g => g.severity === 'critical').length
    const highGaps = gaps.filter(g => g.severity === 'high').length
    const riskScore = (criticalGaps * 10 + highGaps * 5) / totalRequirements * 100

    // Determine maturity level
    let maturityLevel: TraceabilityStatistics['maturityLevel'] = 'initial'
    if (requirementsCoverage >= 90 && testEffectiveness >= 90 && redundancyScore < 10) {
      maturityLevel = 'optimized'
    } else if (requirementsCoverage >= 80 && testEffectiveness >= 80) {
      maturityLevel = 'established'
    } else if (requirementsCoverage >= 60 && testEffectiveness >= 60) {
      maturityLevel = 'developing'
    }

    return {
      requirementsCoverage,
      testEffectiveness,
      redundancyScore,
      riskScore,
      maturityLevel
    }
  }

  // Helper methods

  private static findDirectTests(
    requirement: SpecRequirement,
    tests: GeneratedTest[],
    spec: ParsedSpecification
  ): TestReference[] {
    const testCases = spec.testCases.filter(tc =>
      tc.requirementIds.includes(requirement.id)
    )
    
    return tests
      .filter(test =>
        test.specifications.some(specId =>
          testCases.some(tc => tc.id === specId)
        )
      )
      .map(test => ({
        id: test.fileName,
        name: test.fileName,
        fileName: test.fileName,
        framework: test.framework
      }))
  }

  private static findIndirectTests(
    _requirement: SpecRequirement,
    _tests: GeneratedTest[],
    _spec: ParsedSpecification
  ): TestReference[] {
    // Find tests that might cover the requirement indirectly
    // through related behaviors or test cases
    return []
  }

  private static getTestResultSummary(
    testIds: string[],
    testResults?: TestSuiteResult[]
  ): TestResultSummary {
    if (!testResults || testResults.length === 0) {
      return {
        totalRuns: 0,
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        passRate: 0,
        averageDuration: 0
      }
    }

    let totalRuns = 0
    let passCount = 0
    let failCount = 0
    let skipCount = 0
    let totalDuration = 0
    let lastRun: Date | undefined

    testResults.forEach(suite => {
      suite.results
        .filter(result => testIds.includes(result.testId))
        .forEach(result => {
          totalRuns++
          if (result.status === 'pass') passCount++
          else if (result.status === 'fail') failCount++
          else if (result.status === 'skip') skipCount++
          totalDuration += result.duration
        })
    })

    return {
      totalRuns,
      passCount,
      failCount,
      skipCount,
      passRate: totalRuns > 0 ? (passCount / totalRuns) * 100 : 0,
      averageDuration: totalRuns > 0 ? totalDuration / totalRuns : 0,
      lastRun
    }
  }

  private static assessRequirementRisks(
    requirement: SpecRequirement,
    tests: TestReference[],
    testResults: TestResultSummary
  ): RiskAssessment[] {
    const risks: RiskAssessment[] = []

    // Check if untested
    if (tests.length === 0) {
      risks.push({
        riskType: 'untested',
        severity: requirement.priority === 'high' ? 'critical' : 'high',
        description: 'Requirement has no tests',
        mitigation: 'Create comprehensive tests for this requirement'
      })
    }

    // Check if tests are flaky
    if (testResults.passRate < 80 && testResults.totalRuns > 5) {
      risks.push({
        riskType: 'flaky',
        severity: 'medium',
        description: `Tests have only ${testResults.passRate.toFixed(0)}% pass rate`,
        mitigation: 'Investigate and fix flaky tests'
      })
    }

    // Check if outdated
    if (testResults.lastRun) {
      const daysSinceLastRun = (Date.now() - testResults.lastRun.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastRun > 30) {
        risks.push({
          riskType: 'outdated',
          severity: 'medium',
          description: `Tests haven't run in ${Math.floor(daysSinceLastRun)} days`,
          mitigation: 'Run tests to ensure they still pass'
        })
      }
    }

    return risks
  }

  private static determineRequirementCoverage(
    requirement: SpecRequirement,
    tests: TestReference[]
  ): 'full' | 'partial' | 'none' {
    if (tests.length === 0) return 'none'
    if (tests.length >= 3) return 'full' // At least 3 tests
    return 'partial'
  }

  private static findRequirementDependencies(
    _requirement: SpecRequirement,
    _spec: ParsedSpecification
  ): string[] {
    // Simple implementation - in reality would analyze requirement text
    // for references to other requirements
    return []
  }

  private static findTestRequirements(
    test: GeneratedTest,
    spec: ParsedSpecification
  ): string[] {
    const requirementIds: string[] = []
    
    // Find requirements through test cases
    test.specifications.forEach(specId => {
      const testCase = spec.testCases.find(tc => tc.id === specId)
      if (testCase) {
        requirementIds.push(...testCase.requirementIds)
      }
    })

    return [...new Set(requirementIds)] // Remove duplicates
  }

  private static getTestHistory(
    testId: string,
    testResults?: TestSuiteResult[]
  ): {
    lastRun?: Date
    lastResult?: 'pass' | 'fail' | 'skip'
    averageDuration?: number
    flakiness?: number
  } | undefined {
    if (!testResults || testResults.length === 0) return undefined

    const results = testResults
      .flatMap(suite => suite.results)
      .filter(result => result.testId === testId)

    if (results.length === 0) return undefined

    const lastResult = results[results.length - 1]
    const passCount = results.filter(r => r.status === 'pass').length
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    return {
      lastRun: new Date(),
      lastResult: lastResult.status as 'pass' | 'fail' | 'skip',
      averageDuration: totalDuration / results.length,
      flakiness: 1 - (passCount / results.length)
    }
  }

  private static calculateMappingConfidence(
    requirement: SpecRequirement,
    test: GeneratedTest,
    spec: ParsedSpecification
  ): number {
    // Direct mapping through test cases
    const directMapping = test.specifications.some(specId => {
      const testCase = spec.testCases.find(tc => tc.id === specId)
      return testCase?.requirementIds.includes(requirement.id)
    })

    if (directMapping) return 1.0

    // Check for keyword matches
    const reqKeywords = requirement.description.toLowerCase().split(/\s+/)
    const testKeywords = test.fileName.toLowerCase().split(/[._\-\s]+/)
    
    const matchingKeywords = reqKeywords.filter(keyword =>
      testKeywords.some(testKeyword => testKeyword.includes(keyword))
    )

    return matchingKeywords.length / reqKeywords.length
  }

  private static determineMappingType(
    requirement: SpecRequirement,
    test: GeneratedTest,
    spec: ParsedSpecification
  ): string {
    const directMapping = test.specifications.some(specId => {
      const testCase = spec.testCases.find(tc => tc.id === specId)
      return testCase?.requirementIds.includes(requirement.id)
    })

    if (directMapping) return 'direct'
    
    // Check if test is derived from a behavior that relates to requirement
    const behaviorMapping = spec.behaviors.some(behavior =>
      test.specifications.includes(behavior.id) &&
      behavior.requirementIds?.includes(requirement.id)
    )

    if (behaviorMapping) return 'derived'
    
    return 'indirect'
  }

  /**
   * Export traceability matrix to various formats
   */
  static export(matrix: TraceabilityMatrix, format: 'json' | 'csv' | 'html' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(matrix, null, 2)
      
      case 'csv':
        return this.exportToCSV(matrix)
      
      case 'html':
        return this.exportToHTML(matrix)
      
      default:
        return JSON.stringify(matrix, null, 2)
    }
  }

  private static exportToCSV(matrix: TraceabilityMatrix): string {
    const headers = ['Requirement ID', 'Description', 'Coverage', 'Test Count', 'Pass Rate', 'Risks']
    const rows = matrix.requirements.map(req => [
      req.requirement.id,
      req.requirement.description,
      req.coverage,
      req.tests.length.toString(),
      req.testResults.passRate.toFixed(0) + '%',
      req.risks.length.toString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private static exportToHTML(matrix: TraceabilityMatrix): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Traceability Matrix</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .coverage-full { background-color: #d4edda; }
    .coverage-partial { background-color: #fff3cd; }
    .coverage-none { background-color: #f8d7da; }
  </style>
</head>
<body>
  <h1>Requirements Traceability Matrix</h1>
  <h2>Summary</h2>
  <p>Total Requirements: ${matrix.coverage.totalRequirements}</p>
  <p>Coverage: ${matrix.coverage.coveragePercentage.toFixed(1)}%</p>
  <p>Maturity Level: ${matrix.statistics.maturityLevel}</p>
  
  <h2>Requirements</h2>
  <table>
    <tr>
      <th>ID</th>
      <th>Description</th>
      <th>Coverage</th>
      <th>Tests</th>
      <th>Pass Rate</th>
      <th>Risks</th>
    </tr>
    ${matrix.requirements.map(req => `
    <tr class="coverage-${req.coverage}">
      <td>${req.requirement.id}</td>
      <td>${req.requirement.description}</td>
      <td>${req.coverage}</td>
      <td>${req.tests.length}</td>
      <td>${req.testResults.passRate.toFixed(0)}%</td>
      <td>${req.risks.length}</td>
    </tr>
    `).join('')}
  </table>
  
  <h2>Gaps</h2>
  <ul>
    ${matrix.gaps.map(gap => `
    <li><strong>${gap.type}</strong> (${gap.severity}): ${gap.description}</li>
    `).join('')}
  </ul>
</body>
</html>
    `
  }
}