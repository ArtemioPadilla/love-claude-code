/**
 * Security Scanner Service
 * 
 * Scans external libraries, containers, and APIs for security vulnerabilities,
 * license compliance issues, and malicious patterns.
 */

export interface SecurityScanResult {
  passed: boolean
  vulnerabilities: Vulnerability[]
  licenses: LicenseInfo[]
  maliciousPatterns: MaliciousPattern[]
  recommendations: string[]
  score: number // 0-100 security score
  scannedAt: Date
}

export interface Vulnerability {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  cve?: string
  affected: {
    component: string
    version: string
    fixedIn?: string
  }
  references?: string[]
}

export interface LicenseInfo {
  name: string
  spdxId?: string
  type: 'permissive' | 'copyleft' | 'proprietary' | 'unknown'
  compatible: boolean
  obligations?: string[]
}

export interface MaliciousPattern {
  type: 'obfuscation' | 'backdoor' | 'cryptominer' | 'data-exfiltration' | 'other'
  confidence: number // 0-1
  location?: string
  description: string
}

export interface ScanOptions {
  deep?: boolean // Perform deep analysis
  timeout?: number // Max scan time
  includeDevDependencies?: boolean
  customRules?: SecurityRule[]
}

export interface SecurityRule {
  id: string
  name: string
  description: string
  check: (target: any) => Promise<boolean>
  severity: Vulnerability['severity']
}

export class SecurityScanner {
  private vulnerabilityDatabase: Map<string, Vulnerability[]> = new Map()
  private licenseDatabase: Map<string, LicenseInfo> = new Map()
  private customRules: SecurityRule[] = []
  
  constructor() {
    this.initializeDatabase()
  }
  
  /**
   * Initialize vulnerability and license databases
   */
  private initializeDatabase(): void {
    // Initialize with common vulnerabilities
    this.vulnerabilityDatabase.set('lodash:4.17.20', [{
      id: 'CVE-2021-23337',
      severity: 'high',
      title: 'Command Injection in lodash',
      description: 'Prototype pollution vulnerability',
      cve: 'CVE-2021-23337',
      affected: {
        component: 'lodash',
        version: '< 4.17.21',
        fixedIn: '4.17.21'
      }
    }])
    
    // Initialize license database
    this.licenseDatabase.set('MIT', {
      name: 'MIT License',
      spdxId: 'MIT',
      type: 'permissive',
      compatible: true
    })
    
    this.licenseDatabase.set('GPL-3.0', {
      name: 'GNU General Public License v3.0',
      spdxId: 'GPL-3.0',
      type: 'copyleft',
      compatible: false,
      obligations: ['Source code disclosure', 'License preservation']
    })
  }
  
  /**
   * Scan NPM package
   */
  async scanNpmPackage(
    packageName: string,
    version: string,
    options: ScanOptions = {}
  ): Promise<SecurityScanResult> {
    const startTime = Date.now()
    const vulnerabilities: Vulnerability[] = []
    const licenses: LicenseInfo[] = []
    const maliciousPatterns: MaliciousPattern[] = []
    const recommendations: string[] = []
    
    try {
      // Check vulnerability database
      const vulnKey = `${packageName}:${version}`
      const knownVulns = this.vulnerabilityDatabase.get(vulnKey) || []
      vulnerabilities.push(...knownVulns)
      
      // Check for outdated version
      const latestVersion = await this.getLatestVersion(packageName)
      if (this.isOutdated(version, latestVersion)) {
        recommendations.push(`Update to latest version: ${latestVersion}`)
      }
      
      // Scan for malicious patterns
      if (options.deep) {
        const patterns = await this.scanForMaliciousPatterns(packageName, version)
        maliciousPatterns.push(...patterns)
      }
      
      // Check license
      const license = await this.checkLicense(packageName, version)
      if (license) {
        licenses.push(license)
        if (!license.compatible) {
          recommendations.push(`License ${license.name} may not be compatible with your project`)
        }
      }
      
      // Run custom rules
      for (const rule of this.customRules) {
        try {
          const failed = await rule.check({ packageName, version })
          if (failed) {
            vulnerabilities.push({
              id: rule.id,
              severity: rule.severity,
              title: rule.name,
              description: rule.description,
              affected: { component: packageName, version }
            })
          }
        } catch (error) {
          console.error(`Custom rule ${rule.id} failed:`, error)
        }
      }
      
      // Calculate security score
      const score = this.calculateSecurityScore(vulnerabilities, maliciousPatterns)
      
      return {
        passed: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
        vulnerabilities,
        licenses,
        maliciousPatterns,
        recommendations,
        score,
        scannedAt: new Date()
      }
      
    } catch (error) {
      throw new Error(`Security scan failed: ${error.message}`)
    }
  }
  
  /**
   * Scan Docker image
   */
  async scanDockerImage(
    imageName: string,
    tag: string = 'latest',
    options: ScanOptions = {}
  ): Promise<SecurityScanResult> {
    const vulnerabilities: Vulnerability[] = []
    const licenses: LicenseInfo[] = []
    const maliciousPatterns: MaliciousPattern[] = []
    const recommendations: string[] = []
    
    // Check for known vulnerable base images
    const knownVulnerableImages = [
      'alpine:3.12', // Example vulnerable version
      'node:12' // EOL version
    ]
    
    const fullImage = `${imageName}:${tag}`
    if (knownVulnerableImages.includes(fullImage)) {
      vulnerabilities.push({
        id: 'VULN-IMAGE-001',
        severity: 'high',
        title: 'Vulnerable base image',
        description: `Base image ${fullImage} contains known vulnerabilities`,
        affected: { component: imageName, version: tag }
      })
      recommendations.push('Use a more recent base image version')
    }
    
    // Check for running as root
    if (!imageName.includes('rootless') && !imageName.includes('nonroot')) {
      recommendations.push('Consider using non-root container images')
    }
    
    // Check for latest tag usage
    if (tag === 'latest') {
      recommendations.push('Pin to specific version instead of using "latest" tag')
    }
    
    const score = this.calculateSecurityScore(vulnerabilities, maliciousPatterns)
    
    return {
      passed: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      vulnerabilities,
      licenses,
      maliciousPatterns,
      recommendations,
      score,
      scannedAt: new Date()
    }
  }
  
  /**
   * Scan API endpoint
   */
  async scanAPIEndpoint(
    url: string,
    options: ScanOptions = {}
  ): Promise<SecurityScanResult> {
    const vulnerabilities: Vulnerability[] = []
    const recommendations: string[] = []
    
    try {
      const urlObj = new URL(url)
      
      // Check for HTTPS
      if (urlObj.protocol !== 'https:') {
        vulnerabilities.push({
          id: 'API-SEC-001',
          severity: 'medium',
          title: 'Insecure protocol',
          description: 'API endpoint uses HTTP instead of HTTPS',
          affected: { component: url, version: 'N/A' }
        })
        recommendations.push('Use HTTPS for all API communications')
      }
      
      // Check for authentication in URL
      if (urlObj.username || urlObj.password) {
        vulnerabilities.push({
          id: 'API-SEC-002',
          severity: 'high',
          title: 'Credentials in URL',
          description: 'Authentication credentials exposed in URL',
          affected: { component: url, version: 'N/A' }
        })
        recommendations.push('Use proper authentication headers instead of URL credentials')
      }
      
      // Test security headers if deep scan
      if (options.deep) {
        const headers = await this.checkSecurityHeaders(url)
        if (!headers.includes('X-Content-Type-Options')) {
          recommendations.push('Add X-Content-Type-Options header')
        }
        if (!headers.includes('X-Frame-Options')) {
          recommendations.push('Add X-Frame-Options header')
        }
      }
      
    } catch (error) {
      vulnerabilities.push({
        id: 'API-SEC-003',
        severity: 'low',
        title: 'Invalid API URL',
        description: error.message,
        affected: { component: url, version: 'N/A' }
      })
    }
    
    const score = this.calculateSecurityScore(vulnerabilities, [])
    
    return {
      passed: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      vulnerabilities,
      licenses: [],
      maliciousPatterns: [],
      recommendations,
      score,
      scannedAt: new Date()
    }
  }
  
  /**
   * Scan plugin code
   */
  async scanPluginCode(
    code: string,
    options: ScanOptions = {}
  ): Promise<SecurityScanResult> {
    const maliciousPatterns: MaliciousPattern[] = []
    const vulnerabilities: Vulnerability[] = []
    const recommendations: string[] = []
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, type: 'code-injection', description: 'Uses eval()' },
      { pattern: /Function\s*\(/, type: 'code-injection', description: 'Uses Function constructor' },
      { pattern: /require\s*\(\s*['"`]child_process/, type: 'system-access', description: 'Accesses child_process' },
      { pattern: /require\s*\(\s*['"`]fs/, type: 'filesystem', description: 'Accesses filesystem' },
      { pattern: /require\s*\(\s*['"`]net/, type: 'network', description: 'Creates network connections' },
      { pattern: /crypto\.randomBytes/, type: 'crypto', description: 'Uses cryptographic functions' },
      { pattern: /\bpassword\b/i, type: 'sensitive-data', description: 'Contains password reference' },
      { pattern: /\bapikey\b/i, type: 'sensitive-data', description: 'Contains API key reference' }
    ]
    
    for (const { pattern, type, description } of dangerousPatterns) {
      if (pattern.test(code)) {
        maliciousPatterns.push({
          type: type as any,
          confidence: 0.8,
          description
        })
      }
    }
    
    // Check for obfuscation
    if (this.isObfuscated(code)) {
      maliciousPatterns.push({
        type: 'obfuscation',
        confidence: 0.9,
        description: 'Code appears to be obfuscated'
      })
      recommendations.push('Avoid obfuscated code in plugins')
    }
    
    // Check for minification (different from obfuscation)
    if (this.isMinified(code) && !this.isObfuscated(code)) {
      recommendations.push('Use non-minified code for better transparency')
    }
    
    const score = this.calculateSecurityScore(vulnerabilities, maliciousPatterns)
    
    return {
      passed: maliciousPatterns.length === 0,
      vulnerabilities,
      licenses: [],
      maliciousPatterns,
      recommendations,
      score,
      scannedAt: new Date()
    }
  }
  
  /**
   * Get latest version of NPM package
   */
  private async getLatestVersion(packageName: string): Promise<string> {
    // In real implementation, would query NPM registry
    // For now, return mock version
    return '1.0.0'
  }
  
  /**
   * Check if version is outdated
   */
  private isOutdated(current: string, latest: string): boolean {
    const parseVersion = (v: string) => v.split('.').map(n => parseInt(n, 10))
    const currentParts = parseVersion(current)
    const latestParts = parseVersion(latest)
    
    for (let i = 0; i < latestParts.length; i++) {
      if ((currentParts[i] || 0) < latestParts[i]) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Scan for malicious patterns in package
   */
  private async scanForMaliciousPatterns(
    packageName: string,
    version: string
  ): Promise<MaliciousPattern[]> {
    const patterns: MaliciousPattern[] = []
    
    // Check for typosquatting
    const commonPackages = ['react', 'lodash', 'express', 'axios']
    for (const common of commonPackages) {
      if (this.isTyposquatting(packageName, common)) {
        patterns.push({
          type: 'other',
          confidence: 0.7,
          description: `Possible typosquatting of ${common}`
        })
      }
    }
    
    return patterns
  }
  
  /**
   * Check for typosquatting
   */
  private isTyposquatting(name: string, target: string): boolean {
    // Simple Levenshtein distance check
    const distance = this.levenshteinDistance(name, target)
    return distance > 0 && distance <= 2 && name !== target
  }
  
  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[b.length][a.length]
  }
  
  /**
   * Check package license
   */
  private async checkLicense(packageName: string, version: string): Promise<LicenseInfo | null> {
    // In real implementation, would fetch from registry
    // For now, return common license
    return this.licenseDatabase.get('MIT') || null
  }
  
  /**
   * Check if code is obfuscated
   */
  private isObfuscated(code: string): boolean {
    // Simple heuristics for obfuscation detection
    const indicators = [
      code.includes('\\x'), // Hex encoding
      code.includes('\\u'), // Unicode encoding  
      /[a-zA-Z_$][a-zA-Z0-9_$]{30,}/.test(code), // Very long identifiers
      /[^\s]{200,}/.test(code), // Very long lines
      code.split('\n').length < code.length / 100 // Low line count ratio
    ]
    
    const obfuscationScore = indicators.filter(i => i).length
    return obfuscationScore >= 3
  }
  
  /**
   * Check if code is minified
   */
  private isMinified(code: string): boolean {
    const lines = code.split('\n')
    const avgLineLength = code.length / lines.length
    return avgLineLength > 200 && lines.length < 10
  }
  
  /**
   * Check security headers
   */
  private async checkSecurityHeaders(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return Array.from(response.headers.keys())
    } catch {
      return []
    }
  }
  
  /**
   * Calculate security score
   */
  private calculateSecurityScore(
    vulnerabilities: Vulnerability[],
    maliciousPatterns: MaliciousPattern[]
  ): number {
    let score = 100
    
    // Deduct for vulnerabilities
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical': score -= 30; break
        case 'high': score -= 20; break
        case 'medium': score -= 10; break
        case 'low': score -= 5; break
      }
    }
    
    // Deduct for malicious patterns
    for (const pattern of maliciousPatterns) {
      score -= Math.floor(pattern.confidence * 20)
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  /**
   * Add custom security rule
   */
  addCustomRule(rule: SecurityRule): void {
    this.customRules.push(rule)
  }
  
  /**
   * Batch scan multiple targets
   */
  async batchScan(
    targets: Array<{
      type: 'npm' | 'docker' | 'api' | 'plugin'
      target: any
    }>,
    options: ScanOptions = {}
  ): Promise<Map<string, SecurityScanResult>> {
    const results = new Map<string, SecurityScanResult>()
    
    for (const { type, target } of targets) {
      try {
        let result: SecurityScanResult
        
        switch (type) {
          case 'npm':
            result = await this.scanNpmPackage(target.name, target.version, options)
            break
          case 'docker':
            result = await this.scanDockerImage(target.image, target.tag, options)
            break
          case 'api':
            result = await this.scanAPIEndpoint(target.url, options)
            break
          case 'plugin':
            result = await this.scanPluginCode(target.code, options)
            break
        }
        
        results.set(`${type}:${JSON.stringify(target)}`, result)
      } catch (error) {
        console.error(`Failed to scan ${type}:`, error)
      }
    }
    
    return results
  }
}

// Export singleton instance
export const securityScanner = new SecurityScanner()