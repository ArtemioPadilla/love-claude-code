import { z } from 'zod'

// Audit Event Types
export enum AuditEventType {
  // Authentication & Access
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_LOGIN_FAILED = 'user.login_failed',
  SSO_LOGIN = 'sso.login',
  MFA_ENABLED = 'mfa.enabled',
  MFA_DISABLED = 'mfa.disabled',
  PASSWORD_CHANGED = 'password.changed',
  PASSWORD_RESET = 'password.reset',
  
  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_SUSPENDED = 'user.suspended',
  USER_ACTIVATED = 'user.activated',
  
  // Team Management
  TEAM_CREATED = 'team.created',
  TEAM_UPDATED = 'team.updated',
  TEAM_DELETED = 'team.deleted',
  TEAM_MEMBER_ADDED = 'team.member_added',
  TEAM_MEMBER_REMOVED = 'team.member_removed',
  TEAM_QUOTA_UPDATED = 'team.quota_updated',
  
  // Organization Management
  ORG_CREATED = 'org.created',
  ORG_UPDATED = 'org.updated',
  ORG_SETTINGS_CHANGED = 'org.settings_changed',
  ORG_PLAN_CHANGED = 'org.plan_changed',
  ORG_BILLING_UPDATED = 'org.billing_updated',
  
  // Construct Operations
  CONSTRUCT_CREATED = 'construct.created',
  CONSTRUCT_UPDATED = 'construct.updated',
  CONSTRUCT_DELETED = 'construct.deleted',
  CONSTRUCT_SHARED = 'construct.shared',
  CONSTRUCT_EXPORTED = 'construct.exported',
  CONSTRUCT_IMPORTED = 'construct.imported',
  CONSTRUCT_DEPLOYED = 'construct.deployed',
  CONSTRUCT_ACCESSED = 'construct.accessed',
  
  // Project Operations
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  PROJECT_SHARED = 'project.shared',
  PROJECT_ARCHIVED = 'project.archived',
  
  // Security Events
  SECURITY_ALERT = 'security.alert',
  PERMISSION_DENIED = 'security.permission_denied',
  API_KEY_CREATED = 'security.api_key_created',
  API_KEY_REVOKED = 'security.api_key_revoked',
  IP_BLOCKED = 'security.ip_blocked',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  
  // Compliance Events
  DATA_EXPORTED = 'compliance.data_exported',
  DATA_DELETED = 'compliance.data_deleted',
  CONSENT_UPDATED = 'compliance.consent_updated',
  AUDIT_LOG_EXPORTED = 'compliance.audit_log_exported',
  
  // System Events
  SYSTEM_CONFIG_CHANGED = 'system.config_changed',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_ERROR = 'system.error',
  INTEGRATION_ADDED = 'system.integration_added',
  INTEGRATION_REMOVED = 'system.integration_removed'
}

// Audit Event Severity
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Audit Entry
export interface AuditEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  actor: {
    id: string
    type: 'user' | 'system' | 'api'
    name: string
    email?: string
    ipAddress?: string
    userAgent?: string
  }
  target?: {
    id: string
    type: string
    name: string
  }
  organizationId: string
  teamId?: string
  metadata: Record<string, any>
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  result: 'success' | 'failure'
  errorMessage?: string
  duration?: number // Operation duration in ms
}

// Audit Query Options
export interface AuditQueryOptions {
  organizationId?: string
  teamId?: string
  actorId?: string
  targetId?: string
  eventTypes?: AuditEventType[]
  severities?: AuditSeverity[]
  startDate?: Date
  endDate?: Date
  result?: 'success' | 'failure'
  searchText?: string
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'eventType' | 'severity'
  sortOrder?: 'asc' | 'desc'
}

// Audit Report
export interface AuditReport {
  organizationId: string
  reportId: string
  generatedAt: Date
  generatedBy: string
  period: {
    startDate: Date
    endDate: Date
  }
  summary: {
    totalEvents: number
    uniqueUsers: number
    eventsByType: Record<AuditEventType, number>
    eventsBySeverity: Record<AuditSeverity, number>
    failureRate: number
    topUsers: { userId: string; name: string; eventCount: number }[]
    securityEvents: number
    complianceEvents: number
  }
  filters: AuditQueryOptions
}

// Audit Export Format
export enum AuditExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel'
}

export class AuditService {
  private static instance: AuditService
  private entries: Map<string, AuditEntry> = new Map()
  private retentionDays: number = 365 // Default 1 year retention
  private batchQueue: AuditEntry[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 100
  private readonly BATCH_INTERVAL = 5000 // 5 seconds

  private constructor() {
    // Start batch processing
    this.startBatchProcessing()
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  // Log an audit event
  async log(params: {
    eventType: AuditEventType
    severity?: AuditSeverity
    actor: AuditEntry['actor']
    target?: AuditEntry['target']
    organizationId: string
    teamId?: string
    metadata?: Record<string, any>
    changes?: AuditEntry['changes']
    result?: 'success' | 'failure'
    errorMessage?: string
    duration?: number
  }): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      eventType: params.eventType,
      severity: params.severity || this.getDefaultSeverity(params.eventType),
      actor: params.actor,
      target: params.target,
      organizationId: params.organizationId,
      teamId: params.teamId,
      metadata: params.metadata || {},
      changes: params.changes,
      result: params.result || 'success',
      errorMessage: params.errorMessage,
      duration: params.duration
    }

    // Add to batch queue
    this.batchQueue.push(entry)

    // Process immediately if batch is full
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      await this.processBatch()
    }

    return entry
  }

  // Quick logging methods for common events
  async logLogin(userId: string, userEmail: string, ipAddress?: string, success: boolean = true): Promise<void> {
    await this.log({
      eventType: success ? AuditEventType.USER_LOGIN : AuditEventType.USER_LOGIN_FAILED,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      actor: {
        id: userId,
        type: 'user',
        name: userEmail,
        email: userEmail,
        ipAddress
      },
      organizationId: 'system', // Would be fetched from user context
      result: success ? 'success' : 'failure'
    })
  }

  async logConstructOperation(
    operation: 'created' | 'updated' | 'deleted' | 'shared',
    constructId: string,
    constructName: string,
    actor: AuditEntry['actor'],
    organizationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventTypeMap = {
      created: AuditEventType.CONSTRUCT_CREATED,
      updated: AuditEventType.CONSTRUCT_UPDATED,
      deleted: AuditEventType.CONSTRUCT_DELETED,
      shared: AuditEventType.CONSTRUCT_SHARED
    }

    await this.log({
      eventType: eventTypeMap[operation],
      actor,
      target: {
        id: constructId,
        type: 'construct',
        name: constructName
      },
      organizationId,
      metadata
    })
  }

  async logSecurityEvent(
    eventType: AuditEventType,
    message: string,
    actor: AuditEntry['actor'],
    organizationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.WARNING,
      actor,
      organizationId,
      metadata: {
        ...metadata,
        securityMessage: message
      }
    })
  }

  // Query audit logs
  async query(options: AuditQueryOptions): Promise<{ entries: AuditEntry[]; total: number }> {
    let entries = Array.from(this.entries.values())

    // Apply filters
    if (options.organizationId) {
      entries = entries.filter(e => e.organizationId === options.organizationId)
    }

    if (options.teamId) {
      entries = entries.filter(e => e.teamId === options.teamId)
    }

    if (options.actorId) {
      entries = entries.filter(e => e.actor.id === options.actorId)
    }

    if (options.targetId) {
      entries = entries.filter(e => e.target?.id === options.targetId)
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      entries = entries.filter(e => options.eventTypes!.includes(e.eventType))
    }

    if (options.severities && options.severities.length > 0) {
      entries = entries.filter(e => options.severities!.includes(e.severity))
    }

    if (options.startDate) {
      entries = entries.filter(e => e.timestamp >= options.startDate!)
    }

    if (options.endDate) {
      entries = entries.filter(e => e.timestamp <= options.endDate!)
    }

    if (options.result) {
      entries = entries.filter(e => e.result === options.result)
    }

    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase()
      entries = entries.filter(e => 
        e.actor.name.toLowerCase().includes(searchLower) ||
        e.actor.email?.toLowerCase().includes(searchLower) ||
        e.target?.name.toLowerCase().includes(searchLower) ||
        JSON.stringify(e.metadata).toLowerCase().includes(searchLower)
      )
    }

    // Sort
    const sortBy = options.sortBy || 'timestamp'
    const sortOrder = options.sortOrder || 'desc'
    entries.sort((a, b) => {
      let aVal: any = a[sortBy]
      let bVal: any = b[sortBy]
      
      if (sortBy === 'timestamp') {
        aVal = aVal.getTime()
        bVal = bVal.getTime()
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    // Pagination
    const total = entries.length
    const offset = options.offset || 0
    const limit = options.limit || 50
    entries = entries.slice(offset, offset + limit)

    return { entries, total }
  }

  // Generate audit report
  async generateReport(
    organizationId: string,
    options: {
      startDate: Date
      endDate: Date
      eventTypes?: AuditEventType[]
      includeDetails?: boolean
    }
  ): Promise<AuditReport> {
    const queryOptions: AuditQueryOptions = {
      organizationId,
      startDate: options.startDate,
      endDate: options.endDate,
      eventTypes: options.eventTypes
    }

    const { entries } = await this.query({ ...queryOptions, limit: -1 }) // Get all entries

    // Calculate summary statistics
    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    const userEvents: Record<string, { name: string; count: number }> = {}
    let failedEvents = 0
    let securityEvents = 0
    let complianceEvents = 0

    entries.forEach(entry => {
      // Events by type
      eventsByType[entry.eventType] = (eventsByType[entry.eventType] || 0) + 1

      // Events by severity
      eventsBySeverity[entry.severity] = (eventsBySeverity[entry.severity] || 0) + 1

      // User activity
      if (entry.actor.type === 'user') {
        if (!userEvents[entry.actor.id]) {
          userEvents[entry.actor.id] = { name: entry.actor.name, count: 0 }
        }
        userEvents[entry.actor.id].count++
      }

      // Failed events
      if (entry.result === 'failure') {
        failedEvents++
      }

      // Security events
      if (entry.eventType.startsWith('security.')) {
        securityEvents++
      }

      // Compliance events
      if (entry.eventType.startsWith('compliance.')) {
        complianceEvents++
      }
    })

    // Get top users
    const topUsers = Object.entries(userEvents)
      .map(([userId, data]) => ({ userId, name: data.name, eventCount: data.count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10)

    const report: AuditReport = {
      organizationId,
      reportId: this.generateId(),
      generatedAt: new Date(),
      generatedBy: 'system', // Would be current user
      period: {
        startDate: options.startDate,
        endDate: options.endDate
      },
      summary: {
        totalEvents: entries.length,
        uniqueUsers: Object.keys(userEvents).length,
        eventsByType: eventsByType as any,
        eventsBySeverity: eventsBySeverity as any,
        failureRate: entries.length > 0 ? (failedEvents / entries.length) * 100 : 0,
        topUsers,
        securityEvents,
        complianceEvents
      },
      filters: queryOptions
    }

    return report
  }

  // Export audit logs
  async export(
    options: AuditQueryOptions,
    format: AuditExportFormat
  ): Promise<{ data: string | Buffer; filename: string; mimeType: string }> {
    const { entries } = await this.query({ ...options, limit: -1 })

    let data: string | Buffer
    let filename: string
    let mimeType: string

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    switch (format) {
      case AuditExportFormat.JSON:
        data = JSON.stringify(entries, null, 2)
        filename = `audit-log-${timestamp}.json`
        mimeType = 'application/json'
        break

      case AuditExportFormat.CSV:
        data = this.convertToCSV(entries)
        filename = `audit-log-${timestamp}.csv`
        mimeType = 'text/csv'
        break

      case AuditExportFormat.PDF:
        // In real implementation, would use a PDF library
        data = 'PDF export not implemented'
        filename = `audit-log-${timestamp}.pdf`
        mimeType = 'application/pdf'
        break

      case AuditExportFormat.EXCEL:
        // In real implementation, would use an Excel library
        data = 'Excel export not implemented'
        filename = `audit-log-${timestamp}.xlsx`
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      default:
        throw new Error('Unsupported export format')
    }

    return { data, filename, mimeType }
  }

  // Set retention policy
  setRetentionDays(days: number): void {
    this.retentionDays = days
  }

  // Clean up old entries
  async cleanup(): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays)

    const entriesToDelete: string[] = []
    this.entries.forEach((entry, id) => {
      if (entry.timestamp < cutoffDate) {
        entriesToDelete.push(id)
      }
    })

    entriesToDelete.forEach(id => this.entries.delete(id))

    return entriesToDelete.length
  }

  // Real-time audit stream (for monitoring)
  subscribe(
    filter: AuditQueryOptions,
    callback: (entry: AuditEntry) => void
  ): () => void {
    // In real implementation, would use WebSocket or SSE
    // For now, return unsubscribe function
    return () => {
      console.log('Unsubscribed from audit stream')
    }
  }

  // Private methods
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch()
      }
    }, this.BATCH_INTERVAL)
  }

  private async processBatch(): Promise<void> {
    const batch = [...this.batchQueue]
    this.batchQueue = []

    // In real implementation, would send to backend
    batch.forEach(entry => {
      this.entries.set(entry.id, entry)
    })

    // Emit events for real-time subscribers
    // this.emitBatch(batch)
  }

  private getDefaultSeverity(eventType: AuditEventType): AuditSeverity {
    if (eventType.includes('failed') || eventType.includes('denied')) {
      return AuditSeverity.WARNING
    }
    if (eventType.includes('error') || eventType.includes('critical')) {
      return AuditSeverity.ERROR
    }
    if (eventType.startsWith('security.')) {
      return AuditSeverity.WARNING
    }
    return AuditSeverity.INFO
  }

  private convertToCSV(entries: AuditEntry[]): string {
    const headers = [
      'Timestamp',
      'Event Type',
      'Severity',
      'Actor',
      'Actor Email',
      'Actor IP',
      'Target',
      'Target Type',
      'Organization ID',
      'Team ID',
      'Result',
      'Error Message',
      'Duration (ms)',
      'Metadata'
    ]

    const rows = entries.map(entry => [
      entry.timestamp.toISOString(),
      entry.eventType,
      entry.severity,
      entry.actor.name,
      entry.actor.email || '',
      entry.actor.ipAddress || '',
      entry.target?.name || '',
      entry.target?.type || '',
      entry.organizationId,
      entry.teamId || '',
      entry.result,
      entry.errorMessage || '',
      entry.duration?.toString() || '',
      JSON.stringify(entry.metadata)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Compliance helpers
  async getComplianceEvents(
    organizationId: string,
    complianceType: 'gdpr' | 'hipaa' | 'soc2',
    startDate: Date,
    endDate: Date
  ): Promise<AuditEntry[]> {
    const relevantEventTypes: AuditEventType[] = []

    switch (complianceType) {
      case 'gdpr':
        relevantEventTypes.push(
          AuditEventType.DATA_EXPORTED,
          AuditEventType.DATA_DELETED,
          AuditEventType.CONSENT_UPDATED,
          AuditEventType.USER_DELETED
        )
        break
      case 'hipaa':
        relevantEventTypes.push(
          AuditEventType.USER_LOGIN,
          AuditEventType.USER_LOGOUT,
          AuditEventType.CONSTRUCT_ACCESSED,
          AuditEventType.DATA_EXPORTED
        )
        break
      case 'soc2':
        relevantEventTypes.push(
          AuditEventType.SECURITY_ALERT,
          AuditEventType.PERMISSION_DENIED,
          AuditEventType.API_KEY_CREATED,
          AuditEventType.API_KEY_REVOKED
        )
        break
    }

    const { entries } = await this.query({
      organizationId,
      eventTypes: relevantEventTypes,
      startDate,
      endDate
    })

    return entries
  }

  // Analytics helpers
  async getUserActivitySummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    loginCount: number
    constructsCreated: number
    securityEvents: number
    lastActivity: Date | null
  }> {
    const { entries } = await this.query({
      actorId: userId,
      startDate,
      endDate,
      limit: -1
    })

    const eventsByType: Record<string, number> = {}
    let loginCount = 0
    let constructsCreated = 0
    let securityEvents = 0
    let lastActivity: Date | null = null

    entries.forEach(entry => {
      eventsByType[entry.eventType] = (eventsByType[entry.eventType] || 0) + 1
      
      if (entry.eventType === AuditEventType.USER_LOGIN) {
        loginCount++
      }
      if (entry.eventType === AuditEventType.CONSTRUCT_CREATED) {
        constructsCreated++
      }
      if (entry.eventType.startsWith('security.')) {
        securityEvents++
      }
      
      if (!lastActivity || entry.timestamp > lastActivity) {
        lastActivity = entry.timestamp
      }
    })

    return {
      totalEvents: entries.length,
      eventsByType,
      loginCount,
      constructsCreated,
      securityEvents,
      lastActivity
    }
  }
}

export const auditService = AuditService.getInstance()