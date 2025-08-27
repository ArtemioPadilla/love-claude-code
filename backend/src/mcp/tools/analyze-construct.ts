import { MCPToolResult } from '../types.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

export interface AnalyzeConstructArgs {
  constructPath?: string
  constructCode?: string
  analysisType?: 'all' | 'dependencies' | 'complexity' | 'security' | 'performance' | 'quality'
  includeRecommendations?: boolean
}

interface ConstructAnalysis {
  metadata: {
    name: string
    type: 'L0' | 'L1' | 'L2' | 'L3'
    category: string
    vibeCodedPercentage?: number
    dependencies: string[]
    exports: string[]
  }
  complexity?: {
    cyclomaticComplexity: number
    cognitiveComplexity: number
    linesOfCode: number
    commentRatio: number
    maxNestingDepth: number
  }
  security?: {
    issues: SecurityIssue[]
    score: number
    hasUnsafePatterns: boolean
  }
  performance?: {
    issues: PerformanceIssue[]
    score: number
    recommendations: string[]
  }
  quality?: {
    issues: QualityIssue[]
    score: number
    testCoverage?: number
    documentation?: number
  }
  recommendations?: string[]
}

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  line?: number
}

interface PerformanceIssue {
  severity: 'low' | 'medium' | 'high'
  type: string
  message: string
  line?: number
}

interface QualityIssue {
  severity: 'low' | 'medium' | 'high'
  type: string
  message: string
  line?: number
}

export async function analyzeConstruct(args: AnalyzeConstructArgs): Promise<MCPToolResult> {
  try {
    const { constructPath, constructCode, analysisType = 'all', includeRecommendations = true } = args
    
    let code: string
    let filePath: string
    
    if (constructPath) {
      filePath = path.resolve(constructPath)
      code = await fs.readFile(filePath, 'utf-8')
    } else if (constructCode) {
      code = constructCode
      filePath = 'inline-code'
    } else {
      throw new Error('Either constructPath or constructCode must be provided')
    }
    
    // Parse the code
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy']
    })
    
    const analysis: ConstructAnalysis = {
      metadata: await extractMetadata(ast, code),
      ...(analysisType === 'all' || analysisType === 'complexity' 
        ? { complexity: analyzeComplexity(ast, code) }
        : {}),
      ...(analysisType === 'all' || analysisType === 'security'
        ? { security: analyzeSecurityIssues(ast, code) }
        : {}),
      ...(analysisType === 'all' || analysisType === 'performance'
        ? { performance: analyzePerformance(ast, code) }
        : {}),
      ...(analysisType === 'all' || analysisType === 'quality'
        ? { quality: analyzeQuality(ast, code) }
        : {})
    }
    
    // Generate recommendations
    if (includeRecommendations) {
      analysis.recommendations = generateRecommendations(analysis)
    }
    
    return {
      success: true,
      data: {
        analysis,
        summary: generateSummary(analysis),
        file: filePath
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }
  }
}

async function extractMetadata(ast: any, code: string): Promise<ConstructAnalysis['metadata']> {
  const metadata: ConstructAnalysis['metadata'] = {
    name: '',
    type: 'L0',
    category: '',
    dependencies: [],
    exports: []
  }
  
  // Extract imports/dependencies
  traverse(ast, {
    ImportDeclaration(path) {
      metadata.dependencies.push(path.node.source.value)
    },
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee, { name: 'require' })) {
        const arg = path.node.arguments[0]
        if (t.isStringLiteral(arg)) {
          metadata.dependencies.push(arg.value)
        }
      }
    },
    ExportNamedDeclaration(path) {
      if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
        path.node.declaration.declarations.forEach((decl) => {
          if (t.isIdentifier(decl.id)) {
            metadata.exports.push(decl.id.name)
          }
        })
      }
    },
    ExportDefaultDeclaration() {
      metadata.exports.push('default')
    }
  })
  
  // Detect construct type from imports or class names
  if (code.includes('extends L0Construct') || code.includes('L0')) {
    metadata.type = 'L0'
  } else if (code.includes('extends L1Construct') || code.includes('L1')) {
    metadata.type = 'L1'
  } else if (code.includes('extends L2Construct') || code.includes('L2')) {
    metadata.type = 'L2'
  } else if (code.includes('extends L3Construct') || code.includes('L3')) {
    metadata.type = 'L3'
  }
  
  // Extract vibe-coded percentage from comments
  const vibeCodeMatch = code.match(/vibe-?coded:\s*(\d+)%/i)
  if (vibeCodeMatch && vibeCodeMatch[1]) {
    metadata.vibeCodedPercentage = parseInt(vibeCodeMatch[1], 10)
  }
  
  return metadata
}

function analyzeComplexity(ast: any, code: string): ConstructAnalysis['complexity'] {
  let cyclomaticComplexity = 1 // Base complexity
  let maxNestingDepth = 0
  let currentNestingDepth = 0
  
  traverse(ast, {
    'IfStatement|ConditionalExpression|LogicalExpression|ForStatement|WhileStatement|DoWhileStatement|SwitchCase': {
      enter() {
        cyclomaticComplexity++
        currentNestingDepth++
        maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth)
      },
      exit() {
        currentNestingDepth--
      }
    }
  })
  
  const lines = code.split('\n')
  const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('*')).length
  const commentRatio = commentLines / (linesOfCode + commentLines)
  
  // Cognitive complexity (simplified)
  const cognitiveComplexity = cyclomaticComplexity + maxNestingDepth
  
  return {
    cyclomaticComplexity,
    cognitiveComplexity,
    linesOfCode,
    commentRatio,
    maxNestingDepth
  }
}

function analyzeSecurityIssues(ast: any, _code: string): ConstructAnalysis['security'] {
  const issues: SecurityIssue[] = []
  
  traverse(ast, {
    // Check for eval usage
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee, { name: 'eval' })) {
        issues.push({
          severity: 'critical',
          type: 'dangerous-function',
          message: 'Use of eval() is dangerous and should be avoided',
          line: path.node.loc?.start.line
        })
      }
      
      // Check for innerHTML
      if (t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.property, { name: 'innerHTML' })) {
        issues.push({
          severity: 'high',
          type: 'xss-risk',
          message: 'Direct innerHTML manipulation can lead to XSS vulnerabilities',
          line: path.node.loc?.start.line
        })
      }
    },
    
    // Check for hardcoded secrets
    StringLiteral(path) {
      const value = path.node.value
      if (value.match(/^[A-Za-z0-9]{40,}$/) || // Potential API key
          value.match(/^sk_[A-Za-z0-9]{32,}$/) || // Secret key pattern
          value.includes('password') || value.includes('secret')) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded-secret',
          message: 'Potential hardcoded secret detected',
          line: path.node.loc?.start.line
        })
      }
    }
  })
  
  // Calculate security score
  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const highCount = issues.filter(i => i.severity === 'high').length
  const score = Math.max(0, 100 - (criticalCount * 30) - (highCount * 20))
  
  return {
    issues,
    score,
    hasUnsafePatterns: issues.length > 0
  }
}

function analyzePerformance(ast: any, code: string): ConstructAnalysis['performance'] {
  const issues: PerformanceIssue[] = []
  const recommendations: string[] = []
  
  traverse(ast, {
    // Check for inefficient loops
    ForStatement(path) {
      const body = path.node.body
      if (t.isBlockStatement(body)) {
        // Check for DOM manipulation in loops
        let hasDomManipulation = false
        traverse(body, {
          MemberExpression(innerPath) {
            const obj = innerPath.node.object
            if (t.isIdentifier(obj, { name: 'document' }) ||
                (t.isMemberExpression(obj) && t.isIdentifier(obj.object, { name: 'document' }))) {
              hasDomManipulation = true
            }
          }
        }, path.scope, path)
        
        if (hasDomManipulation) {
          issues.push({
            severity: 'high',
            type: 'dom-in-loop',
            message: 'DOM manipulation inside loop can cause performance issues',
            line: path.node.loc?.start.line
          })
          recommendations.push('Consider batching DOM updates outside the loop')
        }
      }
    },
    
    // Check for missing React.memo
    FunctionDeclaration(path) {
      const name = path.node.id?.name || ''
      if (name.match(/^[A-Z]/) && !code.includes(`memo(${name})`)) {
        issues.push({
          severity: 'low',
          type: 'missing-memo',
          message: `Component ${name} could benefit from React.memo`,
          line: path.node.loc?.start.line
        })
      }
    }
  })
  
  // Check for large bundles
  const importCount = code.match(/import .* from/g)?.length || 0
  if (importCount > 20) {
    issues.push({
      severity: 'medium',
      type: 'many-imports',
      message: 'Many imports detected, consider code splitting'
    })
    recommendations.push('Use dynamic imports for code splitting')
  }
  
  const score = Math.max(0, 100 - (issues.filter(i => i.severity === 'high').length * 20))
  
  return {
    issues,
    score,
    recommendations
  }
}

function analyzeQuality(ast: any, code: string): ConstructAnalysis['quality'] {
  const issues: QualityIssue[] = []
  
  // Check for console.log statements
  traverse(ast, {
    CallExpression(path) {
      if (t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object, { name: 'console' })) {
        issues.push({
          severity: 'low',
          type: 'console-log',
          message: 'Remove console statements in production code',
          line: path.node.loc?.start.line
        })
      }
    }
  })
  
  // Check for proper error handling
  let tryBlockCount = 0
  let unhandledPromiseCount = 0
  
  traverse(ast, {
    TryStatement() {
      tryBlockCount++
    },
    CallExpression(path) {
      // Check for unhandled promises
      if (path.node.callee.type === 'MemberExpression' &&
          t.isIdentifier(path.node.callee.property, { name: 'then' })) {
        const parent = path.parent
        if (!t.isCallExpression(parent) || 
            !t.isMemberExpression(parent.callee) ||
            !t.isIdentifier(parent.callee.property, { name: 'catch' })) {
          unhandledPromiseCount++
        }
      }
    }
  })
  
  if (unhandledPromiseCount > 0) {
    issues.push({
      severity: 'medium',
      type: 'unhandled-promise',
      message: `${unhandledPromiseCount} promises without error handling`,
    })
  }
  
  // Check documentation
  const hasJSDoc = code.includes('/**')
  const documentation = hasJSDoc ? 50 : 0
  
  const score = Math.max(0, 100 - (issues.filter(i => i.severity === 'medium').length * 10))
  
  return {
    issues,
    score,
    documentation
  }
}

function generateRecommendations(analysis: ConstructAnalysis): string[] {
  const recommendations: string[] = []
  
  // Complexity recommendations
  if (analysis.complexity) {
    if (analysis.complexity.cyclomaticComplexity > 10) {
      recommendations.push('Consider breaking down complex functions into smaller, focused functions')
    }
    if (analysis.complexity.maxNestingDepth > 4) {
      recommendations.push('Reduce nesting depth by using early returns or extracting nested logic')
    }
    if (analysis.complexity.commentRatio < 0.1) {
      recommendations.push('Add more comments to improve code documentation')
    }
  }
  
  // Security recommendations
  if (analysis.security && analysis.security.hasUnsafePatterns) {
    recommendations.push('Address security vulnerabilities before deployment')
  }
  
  // Performance recommendations
  if (analysis.performance) {
    recommendations.push(...analysis.performance.recommendations)
  }
  
  // Quality recommendations
  if (analysis.quality && analysis.quality.documentation !== undefined && analysis.quality.documentation < 30) {
    recommendations.push('Add JSDoc comments to document public APIs')
  }
  
  return recommendations
}

function generateSummary(analysis: ConstructAnalysis): any {
  const scores = {
    complexity: analysis.complexity ? 
      Math.max(0, 100 - (analysis.complexity.cyclomaticComplexity * 3)) : null,
    security: analysis.security?.score,
    performance: analysis.performance?.score,
    quality: analysis.quality?.score
  }
  
  const validScores = Object.values(scores).filter((s): s is number => s !== null && s !== undefined)
  const overallScore = validScores.length > 0 
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
    : 0
  
  return {
    overallScore: Math.round(overallScore),
    scores,
    constructType: analysis.metadata.type,
    vibeCodedPercentage: analysis.metadata.vibeCodedPercentage,
    issueCount: {
      security: analysis.security?.issues.length || 0,
      performance: analysis.performance?.issues.length || 0,
      quality: analysis.quality?.issues.length || 0
    }
  }
}