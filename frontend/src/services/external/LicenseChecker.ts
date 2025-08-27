/**
 * License Checker Service
 * 
 * Checks and validates licenses of external dependencies,
 * ensuring compliance with project requirements.
 */

export interface LicenseCheckResult {
  compatible: boolean
  license: string
  spdxId?: string
  type: 'permissive' | 'copyleft' | 'proprietary' | 'custom' | 'unknown'
  obligations?: string[]
  restrictions?: string[]
  attribution?: boolean
  shareAlike?: boolean
  warnings?: string[]
}

export interface LicensePolicy {
  allowedLicenses?: string[] // SPDX IDs
  prohibitedLicenses?: string[] // SPDX IDs
  allowUnknown?: boolean
  requireAttribution?: boolean
  allowCopyleft?: boolean
  allowProprietary?: boolean
}

export interface DependencyTree {
  name: string
  version: string
  license?: string
  dependencies?: DependencyTree[]
}

export class LicenseChecker {
  private licenseDatabase: Map<string, {
    spdxId: string
    name: string
    type: LicenseCheckResult['type']
    compatible: string[] // Compatible with these licenses
    incompatible: string[] // Incompatible with these licenses
    obligations?: string[]
    restrictions?: string[]
    attribution?: boolean
    shareAlike?: boolean
  }> = new Map()
  
  private policy: LicensePolicy
  
  constructor(policy: LicensePolicy = {}) {
    this.policy = {
      allowUnknown: false,
      requireAttribution: true,
      allowCopyleft: false,
      allowProprietary: false,
      ...policy
    }
    
    this.initializeLicenseDatabase()
  }
  
  /**
   * Initialize license database with common licenses
   */
  private initializeLicenseDatabase(): void {
    // Permissive licenses
    this.licenseDatabase.set('MIT', {
      spdxId: 'MIT',
      name: 'MIT License',
      type: 'permissive',
      compatible: ['Apache-2.0', 'BSD-3-Clause', 'ISC', 'MIT'],
      incompatible: [],
      attribution: true
    })
    
    this.licenseDatabase.set('Apache-2.0', {
      spdxId: 'Apache-2.0',
      name: 'Apache License 2.0',
      type: 'permissive',
      compatible: ['MIT', 'BSD-3-Clause', 'ISC'],
      incompatible: ['GPL-2.0', 'GPL-3.0'],
      attribution: true,
      obligations: ['Include license notice', 'State changes']
    })
    
    this.licenseDatabase.set('BSD-3-Clause', {
      spdxId: 'BSD-3-Clause',
      name: 'BSD 3-Clause License',
      type: 'permissive',
      compatible: ['MIT', 'Apache-2.0', 'ISC'],
      incompatible: [],
      attribution: true
    })
    
    this.licenseDatabase.set('ISC', {
      spdxId: 'ISC',
      name: 'ISC License',
      type: 'permissive',
      compatible: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
      incompatible: [],
      attribution: true
    })
    
    // Copyleft licenses
    this.licenseDatabase.set('GPL-3.0', {
      spdxId: 'GPL-3.0',
      name: 'GNU General Public License v3.0',
      type: 'copyleft',
      compatible: ['GPL-3.0', 'AGPL-3.0'],
      incompatible: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
      obligations: ['Disclose source', 'Same license', 'State changes'],
      restrictions: ['No sublicensing'],
      attribution: true,
      shareAlike: true
    })
    
    this.licenseDatabase.set('GPL-2.0', {
      spdxId: 'GPL-2.0',
      name: 'GNU General Public License v2.0',
      type: 'copyleft',
      compatible: ['GPL-2.0'],
      incompatible: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0'],
      obligations: ['Disclose source', 'Same license', 'State changes'],
      restrictions: ['No sublicensing'],
      attribution: true,
      shareAlike: true
    })
    
    this.licenseDatabase.set('LGPL-3.0', {
      spdxId: 'LGPL-3.0',
      name: 'GNU Lesser General Public License v3.0',
      type: 'copyleft',
      compatible: ['LGPL-3.0', 'GPL-3.0'],
      incompatible: [],
      obligations: ['Disclose source of library', 'State changes'],
      attribution: true,
      shareAlike: true
    })
    
    this.licenseDatabase.set('AGPL-3.0', {
      spdxId: 'AGPL-3.0',
      name: 'GNU Affero General Public License v3.0',
      type: 'copyleft',
      compatible: ['AGPL-3.0'],
      incompatible: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
      obligations: ['Disclose source', 'Network use is distribution', 'Same license'],
      restrictions: ['No sublicensing'],
      attribution: true,
      shareAlike: true
    })
    
    // Proprietary/Custom
    this.licenseDatabase.set('UNLICENSED', {
      spdxId: 'UNLICENSED',
      name: 'Proprietary License',
      type: 'proprietary',
      compatible: [],
      incompatible: ['MIT', 'Apache-2.0', 'GPL-3.0'],
      restrictions: ['All rights reserved']
    })
  }
  
  /**
   * Check a single license
   */
  async check(integration: {
    name: string
    metadata?: { license?: string }
  }): Promise<LicenseCheckResult> {
    const licenseString = integration.metadata?.license || 'UNKNOWN'
    const normalizedLicense = this.normalizeLicense(licenseString)
    
    // Check license database
    const licenseInfo = this.licenseDatabase.get(normalizedLicense)
    
    if (!licenseInfo) {
      return this.handleUnknownLicense(licenseString)
    }
    
    // Check against policy
    const isAllowed = this.checkAgainstPolicy(licenseInfo)
    
    return {
      compatible: isAllowed,
      license: licenseInfo.name,
      spdxId: licenseInfo.spdxId,
      type: licenseInfo.type,
      obligations: licenseInfo.obligations,
      restrictions: licenseInfo.restrictions,
      attribution: licenseInfo.attribution,
      shareAlike: licenseInfo.shareAlike,
      warnings: this.generateWarnings(licenseInfo)
    }
  }
  
  /**
   * Check entire dependency tree
   */
  async checkDependencyTree(tree: DependencyTree): Promise<{
    overallCompatible: boolean
    licenses: Map<string, LicenseCheckResult>
    conflicts: Array<{
      package1: string
      package2: string
      reason: string
    }>
    summary: {
      total: number
      permissive: number
      copyleft: number
      proprietary: number
      unknown: number
    }
  }> {
    const licenses = new Map<string, LicenseCheckResult>()
    const conflicts: any[] = []
    const summary = {
      total: 0,
      permissive: 0,
      copyleft: 0,
      proprietary: 0,
      unknown: 0
    }
    
    // Recursively check all dependencies
    const checkNode = async (node: DependencyTree) => {
      const result = await this.check({
        name: node.name,
        metadata: { license: node.license }
      })
      
      licenses.set(`${node.name}@${node.version}`, result)
      summary.total++
      summary[result.type]++
      
      // Check dependencies
      if (node.dependencies) {
        for (const dep of node.dependencies) {
          await checkNode(dep)
        }
      }
    }
    
    await checkNode(tree)
    
    // Check for license conflicts
    const licenseArray = Array.from(licenses.entries())
    for (let i = 0; i < licenseArray.length; i++) {
      for (let j = i + 1; j < licenseArray.length; j++) {
        const [pkg1, license1] = licenseArray[i]
        const [pkg2, license2] = licenseArray[j]
        
        const conflict = this.checkConflict(license1, license2)
        if (conflict) {
          conflicts.push({
            package1: pkg1,
            package2: pkg2,
            reason: conflict
          })
        }
      }
    }
    
    // Overall compatibility
    const overallCompatible = conflicts.length === 0 && 
      Array.from(licenses.values()).every(l => l.compatible)
    
    return {
      overallCompatible,
      licenses,
      conflicts,
      summary
    }
  }
  
  /**
   * Normalize license string
   */
  private normalizeLicense(license: string): string {
    // Handle common variations
    const normalized = license.trim().toUpperCase()
    
    // Map common variations to SPDX IDs
    const mappings: Record<string, string> = {
      'MIT LICENSE': 'MIT',
      'APACHE': 'Apache-2.0',
      'APACHE 2': 'Apache-2.0',
      'APACHE 2.0': 'Apache-2.0',
      'BSD': 'BSD-3-Clause',
      'BSD-3': 'BSD-3-Clause',
      'BSD 3-CLAUSE': 'BSD-3-Clause',
      'GPL': 'GPL-3.0',
      'GPLV3': 'GPL-3.0',
      'GPL-3': 'GPL-3.0',
      'GPLV2': 'GPL-2.0',
      'GPL-2': 'GPL-2.0',
      'LGPL': 'LGPL-3.0',
      'LGPLV3': 'LGPL-3.0',
      'AGPL': 'AGPL-3.0',
      'AGPLV3': 'AGPL-3.0',
      'PROPRIETARY': 'UNLICENSED',
      'PRIVATE': 'UNLICENSED'
    }
    
    return mappings[normalized] || license
  }
  
  /**
   * Handle unknown license
   */
  private handleUnknownLicense(license: string): LicenseCheckResult {
    const warnings: string[] = ['Unknown license detected']
    
    if (!this.policy.allowUnknown) {
      warnings.push('Unknown licenses are not allowed by policy')
    }
    
    return {
      compatible: this.policy.allowUnknown || false,
      license,
      type: 'unknown',
      warnings
    }
  }
  
  /**
   * Check license against policy
   */
  private checkAgainstPolicy(licenseInfo: any): boolean {
    // Check allowed list
    if (this.policy.allowedLicenses && this.policy.allowedLicenses.length > 0) {
      if (!this.policy.allowedLicenses.includes(licenseInfo.spdxId)) {
        return false
      }
    }
    
    // Check prohibited list
    if (this.policy.prohibitedLicenses && 
        this.policy.prohibitedLicenses.includes(licenseInfo.spdxId)) {
      return false
    }
    
    // Check type restrictions
    if (licenseInfo.type === 'copyleft' && !this.policy.allowCopyleft) {
      return false
    }
    
    if (licenseInfo.type === 'proprietary' && !this.policy.allowProprietary) {
      return false
    }
    
    return true
  }
  
  /**
   * Generate warnings for license
   */
  private generateWarnings(licenseInfo: any): string[] {
    const warnings: string[] = []
    
    if (licenseInfo.type === 'copyleft') {
      warnings.push('Copyleft license may require source code disclosure')
    }
    
    if (licenseInfo.shareAlike) {
      warnings.push('Derivative works must use the same license')
    }
    
    if (licenseInfo.obligations && licenseInfo.obligations.length > 0) {
      warnings.push(`License obligations: ${licenseInfo.obligations.join(', ')}`)
    }
    
    if (licenseInfo.restrictions && licenseInfo.restrictions.length > 0) {
      warnings.push(`License restrictions: ${licenseInfo.restrictions.join(', ')}`)
    }
    
    return warnings
  }
  
  /**
   * Check for license conflicts
   */
  private checkConflict(license1: LicenseCheckResult, license2: LicenseCheckResult): string | null {
    if (!license1.spdxId || !license2.spdxId) {
      return null
    }
    
    const info1 = this.licenseDatabase.get(license1.spdxId)
    const info2 = this.licenseDatabase.get(license2.spdxId)
    
    if (!info1 || !info2) {
      return null
    }
    
    // Check if licenses are incompatible
    if (info1.incompatible.includes(license2.spdxId!)) {
      return `${license1.license} is incompatible with ${license2.license}`
    }
    
    if (info2.incompatible.includes(license1.spdxId!)) {
      return `${license2.license} is incompatible with ${license1.license}`
    }
    
    // Check for copyleft conflicts
    if (info1.type === 'copyleft' && info2.type === 'permissive') {
      return `Copyleft license ${license1.license} may conflict with permissive ${license2.license}`
    }
    
    return null
  }
  
  /**
   * Generate license report
   */
  generateReport(checkResult: {
    licenses: Map<string, LicenseCheckResult>
    conflicts: any[]
    summary: any
  }): string {
    let report = '# License Report\n\n'
    
    // Summary
    report += '## Summary\n'
    report += `- Total packages: ${checkResult.summary.total}\n`
    report += `- Permissive: ${checkResult.summary.permissive}\n`
    report += `- Copyleft: ${checkResult.summary.copyleft}\n`
    report += `- Proprietary: ${checkResult.summary.proprietary}\n`
    report += `- Unknown: ${checkResult.summary.unknown}\n\n`
    
    // Conflicts
    if (checkResult.conflicts.length > 0) {
      report += '## License Conflicts\n'
      for (const conflict of checkResult.conflicts) {
        report += `- ${conflict.package1} ↔ ${conflict.package2}: ${conflict.reason}\n`
      }
      report += '\n'
    }
    
    // Detailed licenses
    report += '## Package Licenses\n'
    const sortedLicenses = Array.from(checkResult.licenses.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
    
    for (const [pkg, license] of sortedLicenses) {
      report += `\n### ${pkg}\n`
      report += `- License: ${license.license}\n`
      report += `- Type: ${license.type}\n`
      report += `- Compatible: ${license.compatible ? 'Yes' : 'No'}\n`
      
      if (license.obligations && license.obligations.length > 0) {
        report += `- Obligations: ${license.obligations.join(', ')}\n`
      }
      
      if (license.warnings && license.warnings.length > 0) {
        report += `- Warnings:\n`
        for (const warning of license.warnings) {
          report += `  - ${warning}\n`
        }
      }
    }
    
    return report
  }
  
  /**
   * Update policy
   */
  updatePolicy(policy: Partial<LicensePolicy>): void {
    this.policy = { ...this.policy, ...policy }
  }
  
  /**
   * Get policy
   */
  getPolicy(): LicensePolicy {
    return { ...this.policy }
  }
  
  /**
   * Add custom license
   */
  addCustomLicense(license: {
    spdxId: string
    name: string
    type: LicenseCheckResult['type']
    compatible?: string[]
    incompatible?: string[]
    obligations?: string[]
    restrictions?: string[]
    attribution?: boolean
    shareAlike?: boolean
  }): void {
    this.licenseDatabase.set(license.spdxId, {
      ...license,
      compatible: license.compatible || [],
      incompatible: license.incompatible || []
    })
  }
}

// Export singleton instance
export const licenseChecker = new LicenseChecker()