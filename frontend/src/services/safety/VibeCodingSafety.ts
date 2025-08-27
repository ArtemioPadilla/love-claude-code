/**
 * Vibe Coding Safety Service
 * 
 * Provides comprehensive safety measures for AI-assisted development (vibe-coding)
 * by integrating TDD Guard, code validation, and quality checks.
 */

import { TDDGuardIntegration } from '../tdd/TDDGuardIntegration'
import { SpecValidator } from '../tdd/SpecValidator'
import { CoverageAnalyzer } from '../tdd/CoverageAnalyzer'
import { EventEmitter } from 'events'

export interface VibeCodingSafetyConfig {
  /** Enable vibe-coding safety */
  enabled: boolean
  /** TDD enforcement level */
  tddEnforcement: 'strict' | 'moderate' | 'loose'
  /** Code quality thresholds */
  qualityThresholds: {
    minCoverage: number
    maxComplexity: number
    maxDuplication: number
  }
  /** AI generation controls */
  aiControls: {
    requireTests: boolean
    requireSpecification: boolean
    maxGenerationSize: number
    allowedPatterns: string[]
    blockedPatterns: string[]
  }
  /** Safety checks */
  safetyChecks: {
    syntaxValidation: boolean
    typeChecking: boolean
    securityScanning: boolean
    dependencyValidation: boolean
  }
  /** Monitoring */
  monitoring: {
    logViolations: boolean
    trackMetrics: boolean
    alertOnCritical: boolean
  }
}

export interface SafetyViolation {
  type: 'tdd' | 'quality' | 'security' | 'specification' | 'ai-control'
  severity: 'critical' | 'high' | 'medium' | 'low'
  rule: string
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  timestamp: Date
}

export interface SafetyMetrics {
  totalVibeCodings: number
  safeVibeCodings: number
  violations: number
  averageCoverage: number
  averageComplexity: number
  tddCompliance: number
  aiGenerationSize: number
}

export interface VibeCodingSession {
  id: string
  startTime: Date
  endTime?: Date
  specification?: string
  generatedCode?: string
  tests?: string[]
  violations: SafetyViolation[]
  metrics: {
    coverage?: number
    complexity?: number
    testCount?: number
  }
  status: 'active' | 'completed' | 'failed'
}

/**
 * Vibe Coding Safety Service
 * 
 * Ensures safe AI-assisted development through multiple safety mechanisms
 */
export class VibeCodingSafety extends EventEmitter {
  private config: VibeCodingSafetyConfig
  private tddGuard: TDDGuardIntegration
  private specValidator: SpecValidator
  private coverageAnalyzer: CoverageAnalyzer
  private currentSession: VibeCodingSession | null = null
  private sessions: Map<string, VibeCodingSession> = new Map()
  private metrics: SafetyMetrics = {
    totalVibeCodings: 0,
    safeVibeCodings: 0,
    violations: 0,
    averageCoverage: 0,
    averageComplexity: 0,
    tddCompliance: 0,
    aiGenerationSize: 0
  }
  
  constructor(config: VibeCodingSafetyConfig) {
    super()
    this.config = config
    
    // Initialize components
    this.tddGuard = new TDDGuardIntegration({
      enableEnforcement: config.tddEnforcement !== 'loose',
      syncWithWorkflow: true,
      violationHandler: (violation) => {
        this.handleViolation({
          type: 'tdd',
          severity: violation.severity === 'error' ? 'high' : 'medium',
          rule: violation.rule,
          message: violation.message,
          file: violation.file,
          timestamp: violation.timestamp
        })
      }
    })
    
    this.specValidator = new SpecValidator()
    this.coverageAnalyzer = new CoverageAnalyzer()
  }
  
  /**
   * Start a new vibe-coding session
   */
  async startSession(specification?: string): Promise<string> {
    const sessionId = `vibe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      specification,
      violations: [],
      metrics: {},
      status: 'active'
    }
    
    this.sessions.set(sessionId, this.currentSession)
    this.metrics.totalVibeCodings++
    
    // Validate specification if required
    if (this.config.aiControls.requireSpecification && !specification) {
      this.handleViolation({
        type: 'specification',
        severity: 'critical',
        rule: 'missing-specification',
        message: 'Specification is required for vibe-coding',
        suggestion: 'Provide a clear specification before generating code',
        timestamp: new Date()
      })
    }
    
    this.emit('session:started', { sessionId, specification })
    return sessionId
  }
  
  /**
   * Validate AI-generated code
   */
  async validateGeneration(
    code: string,
    metadata?: {
      language?: string
      framework?: string
      purpose?: string
    }
  ): Promise<{
    isValid: boolean
    violations: SafetyViolation[]
    suggestions: string[]
  }> {
    if (!this.currentSession) {
      throw new Error('No active vibe-coding session')
    }
    
    const violations: SafetyViolation[] = []
    const suggestions: string[] = []
    
    // Check generation size
    if (code.length > this.config.aiControls.maxGenerationSize) {
      violations.push({
        type: 'ai-control',
        severity: 'high',
        rule: 'generation-size-exceeded',
        message: `Generated code exceeds maximum size limit (${this.config.aiControls.maxGenerationSize} characters)`,
        suggestion: 'Break down the generation into smaller, focused components',
        timestamp: new Date()
      })
    }
    
    // Check blocked patterns
    for (const pattern of this.config.aiControls.blockedPatterns) {
      const regex = new RegExp(pattern, 'g')
      if (regex.test(code)) {
        violations.push({
          type: 'ai-control',
          severity: 'critical',
          rule: 'blocked-pattern-detected',
          message: `Blocked pattern detected: ${pattern}`,
          suggestion: 'Remove or refactor the blocked pattern',
          timestamp: new Date()
        })
      }
    }
    
    // Check allowed patterns
    if (this.config.aiControls.allowedPatterns.length > 0) {
      let matchesAllowed = false
      for (const pattern of this.config.aiControls.allowedPatterns) {
        const regex = new RegExp(pattern)
        if (regex.test(code)) {
          matchesAllowed = true
          break
        }
      }
      
      if (!matchesAllowed) {
        violations.push({
          type: 'ai-control',
          severity: 'medium',
          rule: 'no-allowed-pattern',
          message: 'Generated code does not match any allowed patterns',
          suggestion: 'Ensure code follows approved patterns and conventions',
          timestamp: new Date()
        })
      }
    }
    
    // Syntax validation
    if (this.config.safetyChecks.syntaxValidation) {
      const syntaxErrors = await this.validateSyntax(code, metadata?.language)
      violations.push(...syntaxErrors)
    }
    
    // Security scanning
    if (this.config.safetyChecks.securityScanning) {
      const securityIssues = await this.scanForSecurityIssues(code)
      violations.push(...securityIssues)
    }
    
    // Check if tests are required
    if (this.config.aiControls.requireTests && !this.currentSession.tests?.length) {
      violations.push({
        type: 'tdd',
        severity: 'high',
        rule: 'missing-tests',
        message: 'Tests are required before implementing code',
        suggestion: 'Generate tests first following TDD principles',
        timestamp: new Date()
      })
    }
    
    // Update session
    this.currentSession.generatedCode = code
    this.currentSession.violations.push(...violations)
    
    // Generate suggestions
    if (violations.length > 0) {
      suggestions.push('Fix all violations before proceeding')
      
      const criticalViolations = violations.filter(v => v.severity === 'critical')
      if (criticalViolations.length > 0) {
        suggestions.push('Critical violations must be addressed immediately')
      }
      
      const tddViolations = violations.filter(v => v.type === 'tdd')
      if (tddViolations.length > 0) {
        suggestions.push('Follow TDD principles: Red → Green → Refactor')
      }
    } else {
      suggestions.push('Code generation passed all safety checks')
      suggestions.push('Consider running additional quality checks')
    }
    
    // Update metrics
    this.metrics.violations += violations.length
    this.metrics.aiGenerationSize = 
      (this.metrics.aiGenerationSize + code.length) / 2 // Running average
    
    return {
      isValid: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      violations,
      suggestions
    }
  }
  
  /**
   * Validate syntax
   */
  private async validateSyntax(
    code: string, 
    language: string = 'typescript'
  ): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = []
    
    // Basic syntax checks (would use proper parser in production)
    const checks = [
      { pattern: /console\.(log|error|warn)/, message: 'Remove console statements' },
      { pattern: /debugger/, message: 'Remove debugger statements' },
      { pattern: /eval\(/, message: 'Avoid using eval()' },
      { pattern: /TODO:|FIXME:/, message: 'Resolve TODO/FIXME comments' }
    ]
    
    for (const check of checks) {
      const matches = code.match(check.pattern)
      if (matches) {
        violations.push({
          type: 'quality',
          severity: 'medium',
          rule: 'syntax-issue',
          message: check.message,
          timestamp: new Date()
        })
      }
    }
    
    return violations
  }
  
  /**
   * Scan for security issues
   */
  private async scanForSecurityIssues(code: string): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = []
    
    // Security patterns to check
    const securityPatterns = [
      { 
        pattern: /api[_-]?key\s*[:=]\s*["'][\w-]+["']/i, 
        message: 'Hardcoded API key detected',
        severity: 'critical' as const
      },
      { 
        pattern: /password\s*[:=]\s*["'][^"']+["']/i, 
        message: 'Hardcoded password detected',
        severity: 'critical' as const
      },
      { 
        pattern: /innerHTML\s*=/, 
        message: 'Direct innerHTML assignment can lead to XSS',
        severity: 'high' as const
      },
      { 
        pattern: /document\.write/, 
        message: 'Avoid using document.write',
        severity: 'medium' as const
      },
      {
        pattern: /exec\(|spawn\(/,
        message: 'Command execution detected - ensure input sanitization',
        severity: 'high' as const
      }
    ]
    
    for (const check of securityPatterns) {
      const matches = code.match(check.pattern)
      if (matches) {
        violations.push({
          type: 'security',
          severity: check.severity,
          rule: 'security-vulnerability',
          message: check.message,
          suggestion: 'Review and fix security issue before deployment',
          timestamp: new Date()
        })
      }
    }
    
    return violations
  }
  
  /**
   * Add test code to current session
   */
  async addTests(tests: string[]): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active vibe-coding session')
    }
    
    this.currentSession.tests = tests
    
    // Validate tests
    if (this.config.safetyChecks.syntaxValidation) {
      for (const test of tests) {
        const violations = await this.validateSyntax(test)
        this.currentSession.violations.push(...violations)
      }
    }
    
    this.emit('tests:added', { sessionId: this.currentSession.id, testCount: tests.length })
  }
  
  /**
   * Run quality analysis
   */
  async analyzeQuality(code: string): Promise<{
    coverage: number
    complexity: number
    duplication: number
    violations: SafetyViolation[]
  }> {
    const violations: SafetyViolation[] = []
    
    // Analyze coverage (simplified - would use actual coverage tool)
    const coverage = this.currentSession?.tests ? 
      Math.min(this.currentSession.tests.length * 20, 100) : 0
    
    if (coverage < this.config.qualityThresholds.minCoverage) {
      violations.push({
        type: 'quality',
        severity: 'high',
        rule: 'insufficient-coverage',
        message: `Code coverage (${coverage}%) is below minimum threshold (${this.config.qualityThresholds.minCoverage}%)`,
        suggestion: 'Add more tests to improve coverage',
        timestamp: new Date()
      })
    }
    
    // Calculate complexity (simplified cyclomatic complexity)
    const complexity = this.calculateComplexity(code)
    
    if (complexity > this.config.qualityThresholds.maxComplexity) {
      violations.push({
        type: 'quality',
        severity: 'medium',
        rule: 'high-complexity',
        message: `Code complexity (${complexity}) exceeds maximum threshold (${this.config.qualityThresholds.maxComplexity})`,
        suggestion: 'Refactor to reduce complexity',
        timestamp: new Date()
      })
    }
    
    // Check duplication (simplified)
    const duplication = this.calculateDuplication(code)
    
    if (duplication > this.config.qualityThresholds.maxDuplication) {
      violations.push({
        type: 'quality',
        severity: 'low',
        rule: 'code-duplication',
        message: `Code duplication (${duplication}%) exceeds maximum threshold (${this.config.qualityThresholds.maxDuplication}%)`,
        suggestion: 'Extract common code into reusable functions',
        timestamp: new Date()
      })
    }
    
    // Update session metrics
    if (this.currentSession) {
      this.currentSession.metrics = { coverage, complexity }
      this.currentSession.violations.push(...violations)
    }
    
    return {
      coverage,
      complexity,
      duplication,
      violations
    }
  }
  
  /**
   * Calculate code complexity
   */
  private calculateComplexity(code: string): number {
    // Simplified cyclomatic complexity calculation
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\?\s*.*\s*:/g // ternary operators
    ]
    
    let complexity = 1 // Base complexity
    
    for (const pattern of complexityPatterns) {
      const matches = code.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    }
    
    return complexity
  }
  
  /**
   * Calculate code duplication
   */
  private calculateDuplication(code: string): number {
    // Simplified duplication detection
    const lines = code.split('\n').filter(line => line.trim().length > 10)
    const uniqueLines = new Set(lines)
    
    if (lines.length === 0) return 0
    
    const duplicationRatio = 1 - (uniqueLines.size / lines.length)
    return Math.round(duplicationRatio * 100)
  }
  
  /**
   * End current session
   */
  async endSession(): Promise<VibeCodingSession> {
    if (!this.currentSession) {
      throw new Error('No active vibe-coding session')
    }
    
    this.currentSession.endTime = new Date()
    this.currentSession.status = 
      this.currentSession.violations.filter(v => 
        v.severity === 'critical' || v.severity === 'high'
      ).length === 0 ? 'completed' : 'failed'
    
    // Update metrics
    if (this.currentSession.status === 'completed') {
      this.metrics.safeVibeCodings++
    }
    
    if (this.currentSession.metrics.coverage) {
      this.metrics.averageCoverage = 
        (this.metrics.averageCoverage * (this.metrics.totalVibeCodings - 1) + 
         this.currentSession.metrics.coverage) / this.metrics.totalVibeCodings
    }
    
    if (this.currentSession.metrics.complexity) {
      this.metrics.averageComplexity = 
        (this.metrics.averageComplexity * (this.metrics.totalVibeCodings - 1) + 
         this.currentSession.metrics.complexity) / this.metrics.totalVibeCodings
    }
    
    // Calculate TDD compliance
    const tddViolations = this.currentSession.violations.filter(v => v.type === 'tdd').length
    const totalViolations = this.currentSession.violations.length
    this.metrics.tddCompliance = totalViolations > 0 ? 
      ((totalViolations - tddViolations) / totalViolations) * 100 : 100
    
    this.emit('session:ended', this.currentSession)
    
    const session = this.currentSession
    this.currentSession = null
    
    return session
  }
  
  /**
   * Handle violation
   */
  private handleViolation(violation: SafetyViolation): void {
    if (this.currentSession) {
      this.currentSession.violations.push(violation)
    }
    
    if (this.config.monitoring.logViolations) {
      console.warn('[VibeCodingSafety] Violation:', violation)
    }
    
    if (this.config.monitoring.alertOnCritical && violation.severity === 'critical') {
      this.emit('critical:violation', violation)
    }
    
    this.emit('violation', violation)
  }
  
  /**
   * Get safety metrics
   */
  getMetrics(): SafetyMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Get session history
   */
  getSessionHistory(): VibeCodingSession[] {
    return Array.from(this.sessions.values())
  }
  
  /**
   * Generate safety report
   */
  generateReport(): {
    summary: string
    metrics: SafetyMetrics
    recentSessions: VibeCodingSession[]
    recommendations: string[]
  } {
    const recentSessions = Array.from(this.sessions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10)
    
    const recommendations: string[] = []
    
    // Generate recommendations based on metrics
    if (this.metrics.tddCompliance < 80) {
      recommendations.push('Improve TDD compliance by writing tests before implementation')
    }
    
    if (this.metrics.averageCoverage < this.config.qualityThresholds.minCoverage) {
      recommendations.push('Increase test coverage to meet quality standards')
    }
    
    if (this.metrics.averageComplexity > this.config.qualityThresholds.maxComplexity) {
      recommendations.push('Refactor complex code to improve maintainability')
    }
    
    const safetyRate = this.metrics.totalVibeCodings > 0 ?
      (this.metrics.safeVibeCodings / this.metrics.totalVibeCodings) * 100 : 0
    
    if (safetyRate < 90) {
      recommendations.push('Review and address common violation patterns')
    }
    
    return {
      summary: `Vibe Coding Safety Report: ${safetyRate.toFixed(1)}% safe generations, ${this.metrics.violations} total violations`,
      metrics: this.metrics,
      recentSessions,
      recommendations
    }
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalVibeCodings: 0,
      safeVibeCodings: 0,
      violations: 0,
      averageCoverage: 0,
      averageComplexity: 0,
      tddCompliance: 0,
      aiGenerationSize: 0
    }
    this.sessions.clear()
    this.emit('metrics:reset')
  }
}

// Export singleton instance with default configuration
export const vibeCodingSafety = new VibeCodingSafety({
  enabled: true,
  tddEnforcement: 'moderate',
  qualityThresholds: {
    minCoverage: 80,
    maxComplexity: 10,
    maxDuplication: 20
  },
  aiControls: {
    requireTests: true,
    requireSpecification: true,
    maxGenerationSize: 10000,
    allowedPatterns: [
      '^import\\s+',
      '^export\\s+',
      '^class\\s+',
      '^interface\\s+',
      '^function\\s+',
      '^const\\s+',
      '^let\\s+'
    ],
    blockedPatterns: [
      'eval\\(',
      'exec\\(',
      '__proto__',
      'process\\.exit'
    ]
  },
  safetyChecks: {
    syntaxValidation: true,
    typeChecking: true,
    securityScanning: true,
    dependencyValidation: true
  },
  monitoring: {
    logViolations: true,
    trackMetrics: true,
    alertOnCritical: true
  }
})