/**
 * Version Manager Service
 * 
 * Manages version checking, updates, and compatibility for external integrations.
 */

export interface Version {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
}

export interface VersionCheckResult {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  updateType?: 'major' | 'minor' | 'patch'
  releaseNotes?: string
  publishedAt?: Date
  compatibility?: {
    breaking: boolean
    migrationRequired: boolean
    migrationSteps?: string[]
  }
}

export interface VersionPolicy {
  autoUpdate?: {
    enabled: boolean
    allowMajor?: boolean
    allowMinor?: boolean
    allowPatch?: boolean
    checkInterval?: number // milliseconds
  }
  compatibility?: {
    requireBackwardCompatible?: boolean
    allowBreaking?: boolean
  }
  sources?: {
    npm?: boolean
    github?: boolean
    custom?: string[]
  }
}

export interface UpdateOptions {
  backup?: boolean
  dryRun?: boolean
  force?: boolean
  skipTests?: boolean
}

export class VersionManager {
  private versionCache: Map<string, {
    latest: string
    checkedAt: Date
    metadata?: any
  }> = new Map()
  
  private updateQueue: Array<{
    integration: any
    version: string
    options: UpdateOptions
  }> = []
  
  private policy: VersionPolicy
  private updateCheckInterval?: NodeJS.Timer
  
  constructor(policy: VersionPolicy = {}) {
    this.policy = {
      autoUpdate: {
        enabled: false,
        allowMajor: false,
        allowMinor: true,
        allowPatch: true,
        checkInterval: 3600000 // 1 hour
      },
      compatibility: {
        requireBackwardCompatible: true,
        allowBreaking: false
      },
      sources: {
        npm: true,
        github: true
      },
      ...policy
    }
    
    if (this.policy.autoUpdate?.enabled) {
      this.startAutoUpdateCheck()
    }
  }
  
  /**
   * Parse version string
   */
  parseVersion(versionString: string): Version {
    const match = versionString.match(
      /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/
    )
    
    if (!match) {
      throw new Error(`Invalid version string: ${versionString}`)
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5]
    }
  }
  
  /**
   * Compare versions
   */
  compareVersions(v1: string, v2: string): number {
    const version1 = this.parseVersion(v1)
    const version2 = this.parseVersion(v2)
    
    // Compare major
    if (version1.major !== version2.major) {
      return version1.major - version2.major
    }
    
    // Compare minor
    if (version1.minor !== version2.minor) {
      return version1.minor - version2.minor
    }
    
    // Compare patch
    if (version1.patch !== version2.patch) {
      return version1.patch - version2.patch
    }
    
    // Compare prerelease
    if (version1.prerelease && !version2.prerelease) return -1
    if (!version1.prerelease && version2.prerelease) return 1
    if (version1.prerelease && version2.prerelease) {
      return version1.prerelease.localeCompare(version2.prerelease)
    }
    
    return 0
  }
  
  /**
   * Check if version satisfies range
   */
  satisfiesRange(version: string, range: string): boolean {
    const v = this.parseVersion(version)
    
    // Handle exact version
    if (!range.startsWith('^') && !range.startsWith('~') && !range.includes('>') && !range.includes('<')) {
      return version === range
    }
    
    // Handle caret range (^)
    if (range.startsWith('^')) {
      const rangeVersion = this.parseVersion(range.substring(1))
      if (v.major !== rangeVersion.major) return false
      if (v.major === 0) {
        // 0.x.x versions - minor must match
        if (v.minor !== rangeVersion.minor) return false
        return v.patch >= rangeVersion.patch
      }
      return this.compareVersions(version, range.substring(1)) >= 0
    }
    
    // Handle tilde range (~)
    if (range.startsWith('~')) {
      const rangeVersion = this.parseVersion(range.substring(1))
      if (v.major !== rangeVersion.major) return false
      if (v.minor !== rangeVersion.minor) return false
      return v.patch >= rangeVersion.patch
    }
    
    // Handle comparison operators
    const operatorMatch = range.match(/^([><=]+)(.+)$/)
    if (operatorMatch) {
      const [, operator, versionStr] = operatorMatch
      const comparison = this.compareVersions(version, versionStr)
      
      switch (operator) {
        case '>': {
          return comparison > 0
        }
        case '>=': {
          return comparison >= 0
        }
        case '<': {
          return comparison < 0
        }
        case '<=': {
          return comparison <= 0
        }
        case '=': {
          return comparison === 0
        }
        default: {
          return false
        }
      }
    }
    
    return false
  }
  
  /**
   * Check for updates
   */
  async checkForUpdate(integration: {
    name: string
    type: string
    metadata?: { version?: string }
  }): Promise<VersionCheckResult> {
    const currentVersion = integration.metadata?.version || '0.0.0'
    
    // Check cache first
    const cached = this.versionCache.get(integration.name)
    if (cached && (Date.now() - cached.checkedAt.getTime()) < 300000) { // 5 min cache
      return this.compareVersionsAndCreateResult(currentVersion, cached.latest, cached.metadata)
    }
    
    // Fetch latest version based on type
    let latestVersion: string
    let metadata: any = {}
    
    try {
      switch (integration.type) {
        case 'library': {
          const npmData = await this.fetchNpmVersion(integration.name)
          latestVersion = npmData.version
          metadata = npmData
          break
        }
          
        case 'container': {
          const dockerData = await this.fetchDockerVersion(integration.name)
          latestVersion = dockerData.version
          metadata = dockerData
          break
        }
          
        case 'plugin':
        case 'mcp-server': {
          // Check custom registry
          const customData = await this.fetchCustomVersion(integration.name)
          latestVersion = customData.version
          metadata = customData
          break
        }
          
        default: {
          return {
            hasUpdate: false,
            currentVersion,
            latestVersion: currentVersion
          }
        }
      }
      
      // Cache result
      this.versionCache.set(integration.name, {
        latest: latestVersion,
        checkedAt: new Date(),
        metadata
      })
      
      return this.compareVersionsAndCreateResult(currentVersion, latestVersion, metadata)
      
    } catch (error) {
      console.error(`Failed to check version for ${integration.name}:`, error)
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion
      }
    }
  }
  
  /**
   * Create version check result
   */
  private compareVersionsAndCreateResult(
    current: string,
    latest: string,
    metadata?: any
  ): VersionCheckResult {
    const comparison = this.compareVersions(current, latest)
    
    if (comparison >= 0) {
      return {
        hasUpdate: false,
        currentVersion: current,
        latestVersion: latest
      }
    }
    
    const currentV = this.parseVersion(current)
    const latestV = this.parseVersion(latest)
    
    let updateType: 'major' | 'minor' | 'patch' = 'patch'
    if (currentV.major !== latestV.major) {
      updateType = 'major'
    } else if (currentV.minor !== latestV.minor) {
      updateType = 'minor'
    }
    
    return {
      hasUpdate: true,
      currentVersion: current,
      latestVersion: latest,
      updateType,
      releaseNotes: metadata?.releaseNotes,
      publishedAt: metadata?.publishedAt,
      compatibility: {
        breaking: updateType === 'major',
        migrationRequired: updateType === 'major' && metadata?.breaking,
        migrationSteps: metadata?.migrationSteps
      }
    }
  }
  
  /**
   * Fetch NPM version
   */
  private async fetchNpmVersion(packageName: string): Promise<any> {
    // In real implementation, would query NPM registry
    // For now, return mock data
    return {
      version: '2.0.0',
      publishedAt: new Date(),
      releaseNotes: 'Major update with new features'
    }
  }
  
  /**
   * Fetch Docker version
   */
  private async fetchDockerVersion(imageName: string): Promise<any> {
    // In real implementation, would query Docker Hub
    // For now, return mock data
    return {
      version: '1.5.0',
      publishedAt: new Date(),
      releaseNotes: 'Security updates and bug fixes'
    }
  }
  
  /**
   * Fetch custom registry version
   */
  private async fetchCustomVersion(name: string): Promise<any> {
    // In real implementation, would query custom registry
    // For now, return mock data
    return {
      version: '1.2.3',
      publishedAt: new Date(),
      releaseNotes: 'Minor improvements'
    }
  }
  
  /**
   * Update integration
   */
  async update(
    integration: any,
    options: UpdateOptions = {}
  ): Promise<{
    success: boolean
    oldVersion: string
    newVersion: string
    error?: string
  }> {
    const checkResult = await this.checkForUpdate(integration)
    
    if (!checkResult.hasUpdate) {
      return {
        success: true,
        oldVersion: checkResult.currentVersion,
        newVersion: checkResult.currentVersion
      }
    }
    
    // Check update policy
    if (!this.shouldAllowUpdate(checkResult)) {
      return {
        success: false,
        oldVersion: checkResult.currentVersion,
        newVersion: checkResult.latestVersion,
        error: `Update type ${checkResult.updateType} not allowed by policy`
      }
    }
    
    // Add to update queue
    this.updateQueue.push({
      integration,
      version: checkResult.latestVersion,
      options
    })
    
    // Process update
    try {
      if (options.backup) {
        await this.backupIntegration(integration)
      }
      
      if (options.dryRun) {
        return {
          success: true,
          oldVersion: checkResult.currentVersion,
          newVersion: checkResult.latestVersion
        }
      }
      
      // Perform actual update based on type
      await this.performUpdate(integration, checkResult.latestVersion)
      
      // Run tests if not skipped
      if (!options.skipTests) {
        await this.runUpdateTests(integration)
      }
      
      // Update integration metadata
      integration.metadata = {
        ...integration.metadata,
        version: checkResult.latestVersion,
        updatedAt: new Date()
      }
      
      return {
        success: true,
        oldVersion: checkResult.currentVersion,
        newVersion: checkResult.latestVersion
      }
      
    } catch (error) {
      // Rollback if needed
      if (options.backup) {
        await this.rollbackIntegration(integration)
      }
      
      return {
        success: false,
        oldVersion: checkResult.currentVersion,
        newVersion: checkResult.latestVersion,
        error: error.message
      }
    } finally {
      // Remove from queue
      this.updateQueue = this.updateQueue.filter(item => 
        item.integration.id !== integration.id
      )
    }
  }
  
  /**
   * Check if update should be allowed
   */
  private shouldAllowUpdate(checkResult: VersionCheckResult): boolean {
    if (!this.policy.autoUpdate?.enabled) return false
    
    switch (checkResult.updateType) {
      case 'major': {
        return this.policy.autoUpdate.allowMajor || false
      }
      case 'minor': {
        return this.policy.autoUpdate.allowMinor || false
      }
      case 'patch': {
        return this.policy.autoUpdate.allowPatch || false
      }
      default: {
        return false
      }
    }
  }
  
  /**
   * Backup integration before update
   */
  private async backupIntegration(integration: any): Promise<void> {
    console.log(`Backing up integration ${integration.name}`)
    // In real implementation, would create backup
  }
  
  /**
   * Rollback integration after failed update
   */
  private async rollbackIntegration(integration: any): Promise<void> {
    console.log(`Rolling back integration ${integration.name}`)
    // In real implementation, would restore from backup
  }
  
  /**
   * Perform the actual update
   */
  private async performUpdate(integration: any, newVersion: string): Promise<void> {
    console.log(`Updating ${integration.name} to ${newVersion}`)
    // In real implementation, would download and install new version
  }
  
  /**
   * Run tests after update
   */
  private async runUpdateTests(integration: any): Promise<void> {
    console.log(`Running tests for ${integration.name}`)
    // In real implementation, would run integration tests
  }
  
  /**
   * Start auto-update checking
   */
  private startAutoUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
    }
    
    this.updateCheckInterval = setInterval(() => {
      // Check all registered integrations
      console.log('Running auto-update check')
    }, this.policy.autoUpdate!.checkInterval!)
  }
  
  /**
   * Stop auto-update checking
   */
  stopAutoUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = undefined
    }
  }
  
  /**
   * Get update history
   */
  getUpdateHistory(integrationId?: string): Array<{
    integrationId: string
    oldVersion: string
    newVersion: string
    updatedAt: Date
    success: boolean
    error?: string
  }> {
    // In real implementation, would return from database
    return []
  }
  
  /**
   * Get pending updates
   */
  getPendingUpdates(): typeof this.updateQueue {
    return [...this.updateQueue]
  }
  
  /**
   * Update version policy
   */
  updatePolicy(policy: Partial<VersionPolicy>): void {
    this.policy = { ...this.policy, ...policy }
    
    // Restart auto-update if needed
    if (policy.autoUpdate?.enabled && !this.updateCheckInterval) {
      this.startAutoUpdateCheck()
    } else if (!policy.autoUpdate?.enabled && this.updateCheckInterval) {
      this.stopAutoUpdateCheck()
    }
  }
  
  /**
   * Clear version cache
   */
  clearCache(): void {
    this.versionCache.clear()
  }
}

// Export singleton instance
export const versionManager = new VersionManager()