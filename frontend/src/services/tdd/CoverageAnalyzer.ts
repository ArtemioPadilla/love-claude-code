/**
 * Coverage Analyzer Service
 * Analyzes test coverage and provides insights on test quality
 */

import { CoverageReport, CoverageMetric } from './TestRunner'
import { ParsedSpecification, SpecRequirement } from './SpecificationParser'
import { GeneratedTest } from './TestGenerator'

export interface CoverageAnalysis {
  summary: CoverageSummary
  uncoveredAreas: UncoveredArea[]
  hotspots: CoverageHotspot[]
  trends: CoverageTrend[]
  recommendations: CoverageRecommendation[]
  requirementCoverage: RequirementCoverage[]
}

export interface CoverageSummary {
  overall: number
  byType: {
    lines: CoverageMetric
    statements: CoverageMetric
    branches: CoverageMetric
    functions: CoverageMetric
  }
  byFile: FileCoverage[]
  byTestType: {
    unit: number
    integration: number
    e2e: number
  }
}

export interface UncoveredArea {
  file: string
  startLine: number
  endLine: number
  type: 'function' | 'branch' | 'statement' | 'block'
  description: string
  complexity: number
  suggestedTests: string[]
}

export interface CoverageHotspot {
  file: string
  lines: number[]
  executionCount: number
  testCount: number
  type: 'over-tested' | 'under-tested' | 'critical-path'
  recommendation: string
}

export interface CoverageTrend {
  timestamp: Date
  overall: number
  delta: number
  changeType: 'improvement' | 'regression' | 'stable'
}

export interface CoverageRecommendation {
  priority: 'high' | 'medium' | 'low'
  type: 'missing-tests' | 'redundant-tests' | 'test-quality' | 'coverage-gap'
  message: string
  action: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

export interface RequirementCoverage {
  requirement: SpecRequirement
  coverage: number
  coveredBy: string[] // Test IDs
  gaps: string[]
  status: 'fully-covered' | 'partially-covered' | 'not-covered'
}

export interface FileCoverage {
  path: string
  coverage: CoverageMetric
  uncoveredLines: number[]
  criticalUncovered: number[]
}

export interface CoverageAnalysisOptions {
  includeHistory?: boolean
  analyzeComplexity?: boolean
  generateRecommendations?: boolean
  targetCoverage?: number
  criticalPaths?: string[]
}

export class CoverageAnalyzer {
  private static coverageHistory: CoverageTrend[] = []
  
  /**
   * Analyze coverage report and provide insights
   */
  static analyze(
    coverage: CoverageReport,
    spec: ParsedSpecification,
    tests: GeneratedTest[],
    options: CoverageAnalysisOptions = {}
  ): CoverageAnalysis {
    const summary = this.generateSummary(coverage, tests)
    const uncoveredAreas = this.findUncoveredAreas(coverage, options)
    const hotspots = this.identifyHotspots(coverage, tests, options)
    const trends = options.includeHistory ? this.analyzeTrends(coverage) : []
    const recommendations = options.generateRecommendations 
      ? this.generateRecommendations(coverage, uncoveredAreas, hotspots, options)
      : []
    const requirementCoverage = this.analyzeRequirementCoverage(spec, tests, coverage)

    return {
      summary,
      uncoveredAreas,
      hotspots,
      trends,
      recommendations,
      requirementCoverage
    }
  }

  /**
   * Generate coverage summary
   */
  private static generateSummary(
    coverage: CoverageReport,
    tests: GeneratedTest[]
  ): CoverageSummary {
    // Calculate overall coverage
    const overall = (
      coverage.lines.percentage +
      coverage.statements.percentage +
      coverage.branches.percentage +
      coverage.functions.percentage
    ) / 4

    // Group by test type
    const byTestType = {
      unit: this.calculateTestTypeCoverage(tests, 'unit'),
      integration: this.calculateTestTypeCoverage(tests, 'integration'),
      e2e: this.calculateTestTypeCoverage(tests, 'e2e')
    }

    // Mock file coverage (in real implementation, would parse detailed coverage data)
    const byFile: FileCoverage[] = this.mockFileCoverage(coverage)

    return {
      overall,
      byType: {
        lines: coverage.lines,
        statements: coverage.statements,
        branches: coverage.branches,
        functions: coverage.functions
      },
      byFile,
      byTestType
    }
  }

  /**
   * Find uncovered areas in code
   */
  private static findUncoveredAreas(
    coverage: CoverageReport,
    options: CoverageAnalysisOptions
  ): UncoveredArea[] {
    const areas: UncoveredArea[] = []

    // Find uncovered functions
    if (coverage.functions.covered < coverage.functions.total) {
      const uncoveredCount = coverage.functions.total - coverage.functions.covered
      areas.push({
        file: 'various',
        startLine: 0,
        endLine: 0,
        type: 'function',
        description: `${uncoveredCount} functions are not covered by tests`,
        complexity: this.estimateComplexity('function', uncoveredCount),
        suggestedTests: [
          'Add unit tests for each uncovered function',
          'Focus on public API functions first',
          'Test both success and error paths'
        ]
      })
    }

    // Find uncovered branches
    if (coverage.branches.covered < coverage.branches.total) {
      const uncoveredCount = coverage.branches.total - coverage.branches.covered
      areas.push({
        file: 'various',
        startLine: 0,
        endLine: 0,
        type: 'branch',
        description: `${uncoveredCount} conditional branches are not tested`,
        complexity: this.estimateComplexity('branch', uncoveredCount),
        suggestedTests: [
          'Add tests for all conditional paths',
          'Test boundary conditions',
          'Include edge cases for each branch'
        ]
      })
    }

    // Prioritize by complexity if requested
    if (options.analyzeComplexity) {
      areas.sort((a, b) => b.complexity - a.complexity)
    }

    return areas
  }

  /**
   * Identify coverage hotspots
   */
  private static identifyHotspots(
    coverage: CoverageReport,
    tests: GeneratedTest[],
    options: CoverageAnalysisOptions
  ): CoverageHotspot[] {
    const hotspots: CoverageHotspot[] = []

    // Check for over-tested areas (mock implementation)
    if (tests.length > 20 && coverage.lines.percentage > 95) {
      hotspots.push({
        file: 'src/utils/helpers.ts',
        lines: [10, 11, 12, 13, 14],
        executionCount: 150,
        testCount: 25,
        type: 'over-tested',
        recommendation: 'Consider reducing redundant tests for simple utility functions'
      })
    }

    // Check for under-tested critical paths
    if (options.criticalPaths) {
      options.criticalPaths.forEach(path => {
        hotspots.push({
          file: path,
          lines: [],
          executionCount: 5,
          testCount: 1,
          type: 'critical-path',
          recommendation: `Critical path "${path}" needs more comprehensive testing`
        })
      })
    }

    return hotspots
  }

  /**
   * Analyze coverage trends
   */
  private static analyzeTrends(coverage: CoverageReport): CoverageTrend[] {
    const currentOverall = (
      coverage.lines.percentage +
      coverage.statements.percentage +
      coverage.branches.percentage +
      coverage.functions.percentage
    ) / 4

    // Add current data point
    const now = new Date()
    const lastTrend = this.coverageHistory[this.coverageHistory.length - 1]
    const delta = lastTrend ? currentOverall - lastTrend.overall : 0

    const newTrend: CoverageTrend = {
      timestamp: now,
      overall: currentOverall,
      delta,
      changeType: delta > 0.5 ? 'improvement' : delta < -0.5 ? 'regression' : 'stable'
    }

    this.coverageHistory.push(newTrend)

    // Keep last 10 trends
    if (this.coverageHistory.length > 10) {
      this.coverageHistory = this.coverageHistory.slice(-10)
    }

    return [...this.coverageHistory]
  }

  /**
   * Generate coverage recommendations
   */
  private static generateRecommendations(
    coverage: CoverageReport,
    uncoveredAreas: UncoveredArea[],
    hotspots: CoverageHotspot[],
    options: CoverageAnalysisOptions
  ): CoverageRecommendation[] {
    const recommendations: CoverageRecommendation[] = []
    const targetCoverage = options.targetCoverage || 80

    // Check overall coverage
    const overallCoverage = (
      coverage.lines.percentage +
      coverage.statements.percentage +
      coverage.branches.percentage +
      coverage.functions.percentage
    ) / 4

    if (overallCoverage < targetCoverage) {
      recommendations.push({
        priority: 'high',
        type: 'coverage-gap',
        message: `Overall coverage (${overallCoverage.toFixed(1)}%) is below target (${targetCoverage}%)`,
        action: 'Focus on writing tests for uncovered functions and branches',
        impact: 'Improve code quality and reduce bug risk',
        effort: 'medium'
      })
    }

    // Check branch coverage specifically
    if (coverage.branches.percentage < 70) {
      recommendations.push({
        priority: 'high',
        type: 'missing-tests',
        message: 'Branch coverage is low, indicating untested conditional logic',
        action: 'Add tests for all conditional branches and edge cases',
        impact: 'Prevent logic errors and improve reliability',
        effort: 'medium'
      })
    }

    // Check for over-testing
    const overTestedHotspots = hotspots.filter(h => h.type === 'over-tested')
    if (overTestedHotspots.length > 0) {
      recommendations.push({
        priority: 'low',
        type: 'redundant-tests',
        message: `Found ${overTestedHotspots.length} over-tested areas`,
        action: 'Review and consolidate redundant tests',
        impact: 'Reduce test execution time and maintenance burden',
        effort: 'low'
      })
    }

    // Check critical paths
    const criticalPathHotspots = hotspots.filter(h => h.type === 'critical-path')
    if (criticalPathHotspots.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'test-quality',
        message: 'Critical paths have insufficient test coverage',
        action: 'Add comprehensive tests for all critical code paths',
        impact: 'Ensure reliability of core functionality',
        effort: 'high'
      })
    }

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return recommendations
  }

  /**
   * Analyze requirement coverage
   */
  private static analyzeRequirementCoverage(
    spec: ParsedSpecification,
    tests: GeneratedTest[],
    coverage: CoverageReport
  ): RequirementCoverage[] {
    return spec.requirements.map(requirement => {
      // Find tests that cover this requirement
      const coveringTests = tests.filter(test =>
        test.specifications.some(specId => 
          spec.testCases.some(tc => 
            tc.requirementIds.includes(requirement.id) && tc.id === specId
          )
        )
      )

      const testIds = coveringTests.map(t => t.fileName)
      const coveragePercent = coveringTests.length > 0 ? 100 : 0

      // Identify gaps
      const gaps: string[] = []
      if (coveringTests.length === 0) {
        gaps.push('No tests found for this requirement')
      } else if (coveringTests.every(t => t.testType === 'unit')) {
        gaps.push('Missing integration or E2E tests')
      }

      return {
        requirement,
        coverage: coveragePercent,
        coveredBy: testIds,
        gaps,
        status: coveragePercent === 100 ? 'fully-covered' :
                coveragePercent > 0 ? 'partially-covered' : 'not-covered'
      }
    })
  }

  /**
   * Calculate test type coverage (mock implementation)
   */
  private static calculateTestTypeCoverage(
    tests: GeneratedTest[],
    type: 'unit' | 'integration' | 'e2e'
  ): number {
    const typeTests = tests.filter(t => t.testType === type)
    return typeTests.length > 0 ? 80 + Math.random() * 20 : 0
  }

  /**
   * Mock file coverage data
   */
  private static mockFileCoverage(coverage: CoverageReport): FileCoverage[] {
    return [
      {
        path: 'src/components/Button.tsx',
        coverage: {
          total: 100,
          covered: 85,
          percentage: 85
        },
        uncoveredLines: [23, 24, 45, 67, 89],
        criticalUncovered: [45, 67]
      },
      {
        path: 'src/utils/validation.ts',
        coverage: {
          total: 50,
          covered: 45,
          percentage: 90
        },
        uncoveredLines: [12, 34],
        criticalUncovered: []
      }
    ]
  }

  /**
   * Estimate complexity of uncovered area
   */
  private static estimateComplexity(type: string, count: number): number {
    const baseComplexity = {
      function: 5,
      branch: 3,
      statement: 1,
      block: 4
    }

    return (baseComplexity[type as keyof typeof baseComplexity] || 1) * count
  }

  /**
   * Generate coverage report visualization data
   */
  static generateVisualizationData(analysis: CoverageAnalysis): CoverageVisualizationData {
    return {
      sunburst: this.generateSunburstData(analysis),
      heatmap: this.generateHeatmapData(analysis),
      timeline: this.generateTimelineData(analysis.trends),
      requirementMatrix: this.generateRequirementMatrix(analysis.requirementCoverage)
    }
  }

  /**
   * Generate sunburst chart data
   */
  private static generateSunburstData(analysis: CoverageAnalysis): any {
    return {
      name: 'Total Coverage',
      value: analysis.summary.overall,
      children: [
        {
          name: 'Lines',
          value: analysis.summary.byType.lines.percentage,
          color: this.getCoverageColor(analysis.summary.byType.lines.percentage)
        },
        {
          name: 'Statements',
          value: analysis.summary.byType.statements.percentage,
          color: this.getCoverageColor(analysis.summary.byType.statements.percentage)
        },
        {
          name: 'Branches',
          value: analysis.summary.byType.branches.percentage,
          color: this.getCoverageColor(analysis.summary.byType.branches.percentage)
        },
        {
          name: 'Functions',
          value: analysis.summary.byType.functions.percentage,
          color: this.getCoverageColor(analysis.summary.byType.functions.percentage)
        }
      ]
    }
  }

  /**
   * Generate heatmap data
   */
  private static generateHeatmapData(analysis: CoverageAnalysis): any[] {
    return analysis.summary.byFile.map(file => ({
      file: file.path,
      coverage: file.coverage.percentage,
      uncovered: file.uncoveredLines.length,
      critical: file.criticalUncovered.length
    }))
  }

  /**
   * Generate timeline data
   */
  private static generateTimelineData(trends: CoverageTrend[]): any[] {
    return trends.map(trend => ({
      timestamp: trend.timestamp,
      coverage: trend.overall,
      delta: trend.delta,
      type: trend.changeType
    }))
  }

  /**
   * Generate requirement matrix
   */
  private static generateRequirementMatrix(requirements: RequirementCoverage[]): any[] {
    return requirements.map(req => ({
      id: req.requirement.id,
      name: req.requirement.description,
      coverage: req.coverage,
      status: req.status,
      testCount: req.coveredBy.length,
      gaps: req.gaps.length
    }))
  }

  /**
   * Get color based on coverage percentage
   */
  private static getCoverageColor(percentage: number): string {
    if (percentage >= 80) return '#10b981' // green
    if (percentage >= 60) return '#f59e0b' // yellow
    return '#ef4444' // red
  }
}

// Types for visualization
export interface CoverageVisualizationData {
  sunburst: any
  heatmap: any[]
  timeline: any[]
  requirementMatrix: any[]
}