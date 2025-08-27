import { z } from 'zod'

// Role-Based Access Control
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export interface Permission {
  resource: string
  actions: string[]
}

export interface RoleDefinition {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean // System roles cannot be modified
  priority: number // Higher priority roles can manage lower priority
}

// Organization Types
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  industry?: string
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  plan: EnterprisePlan
  settings: OrganizationSettings
  createdAt: Date
  updatedAt: Date
  ownerId: string
  billingEmail?: string
  technicalContactEmail?: string
}

export interface OrganizationSettings {
  // Security
  enforceSSO: boolean
  allowedAuthMethods: ('password' | 'sso' | 'mfa')[]
  passwordPolicy?: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expirationDays?: number
  }
  sessionTimeout: number // minutes
  ipWhitelist?: string[]
  
  // Collaboration
  defaultUserRole: Role
  allowGuestAccess: boolean
  requireEmailVerification: boolean
  autoJoinTeams: string[] // Team IDs to auto-join new users
  
  // Construct Management
  allowPublicConstructs: boolean
  requireConstructReview: boolean
  constructNamingConvention?: string
  defaultConstructVisibility: 'private' | 'team' | 'organization' | 'public'
  
  // Compliance
  dataRetentionDays?: number
  enableAuditLogs: boolean
  enableDataExport: boolean
  gdprCompliant: boolean
  hipaaCompliant: boolean
  soc2Compliant: boolean
}

// Team Management
export interface Team {
  id: string
  organizationId: string
  name: string
  description?: string
  avatar?: string
  leaderId: string
  memberIds: string[]
  settings: TeamSettings
  quotas: TeamQuotas
  createdAt: Date
  updatedAt: Date
}

export interface TeamSettings {
  visibility: 'private' | 'organization'
  allowMemberInvites: boolean
  requireApproval: boolean
  constructSharing: 'none' | 'read' | 'write'
  defaultConstructAccess: 'private' | 'team'
}

export interface TeamQuotas {
  maxMembers: number
  maxConstructs: number
  maxStorageGB: number
  maxComputeHours: number
  maxApiCalls: number
}

// License Management
export interface EnterprisePlan {
  id: string
  name: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom'
  displayName: string
  features: PlanFeatures
  quotas: PlanQuotas
  pricing: {
    monthly: number
    annual: number
    currency: string
  }
}

export interface PlanFeatures {
  // Core Features
  maxUsers: number
  maxTeams: number
  maxProjects: number
  maxConstructsPerProject: number
  
  // Advanced Features
  ssoEnabled: boolean
  advancedRBAC: boolean
  customRoles: boolean
  apiAccess: boolean
  webhooks: boolean
  
  // AI Features
  aiModels: string[]
  maxAIRequestsPerMonth: number
  priorityAIQueue: boolean
  customAIModels: boolean
  
  // Infrastructure
  dedicatedInfrastructure: boolean
  customDomain: boolean
  slaGuarantee?: number // uptime percentage
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  trainingHours: number
  dedicatedAccountManager: boolean
}

export interface PlanQuotas {
  storageGB: number
  bandwidthGB: number
  computeHours: number
  apiCallsPerMonth: number
  concurrentBuilds: number
  retentionDays: number
}

// Usage Tracking
export interface UsageMetrics {
  organizationId: string
  period: 'daily' | 'weekly' | 'monthly'
  startDate: Date
  endDate: Date
  metrics: {
    users: {
      active: number
      total: number
      new: number
    }
    constructs: {
      created: number
      modified: number
      shared: number
      total: number
    }
    ai: {
      requests: number
      tokens: number
      models: Record<string, number>
    }
    storage: {
      usedGB: number
      filesCount: number
    }
    compute: {
      hours: number
      builds: number
      deploys: number
    }
    api: {
      calls: number
      errors: number
      latencyMs: number
    }
  }
}

export interface UsageAlert {
  id: string
  organizationId: string
  type: 'quota_warning' | 'quota_exceeded' | 'unusual_activity' | 'compliance'
  severity: 'info' | 'warning' | 'error' | 'critical'
  metric: string
  threshold: number
  currentValue: number
  message: string
  createdAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
}

// License Validation
export interface License {
  id: string
  organizationId: string
  planId: string
  status: 'active' | 'expired' | 'suspended' | 'cancelled'
  seats: number
  usedSeats: number
  startDate: Date
  endDate: Date
  autoRenew: boolean
  customTerms?: Record<string, any>
}

export class EnterpriseConfigService {
  private static instance: EnterpriseConfigService
  private organizations: Map<string, Organization> = new Map()
  private teams: Map<string, Team> = new Map()
  private licenses: Map<string, License> = new Map()
  private roleDefinitions: Map<string, RoleDefinition> = new Map()

  private constructor() {
    this.initializeSystemRoles()
  }

  static getInstance(): EnterpriseConfigService {
    if (!EnterpriseConfigService.instance) {
      EnterpriseConfigService.instance = new EnterpriseConfigService()
    }
    return EnterpriseConfigService.instance
  }

  private initializeSystemRoles() {
    const systemRoles: RoleDefinition[] = [
      {
        id: Role.OWNER,
        name: 'Owner',
        description: 'Full access to all organization resources',
        isSystem: true,
        priority: 100,
        permissions: [
          { resource: '*', actions: ['*'] }
        ]
      },
      {
        id: Role.ADMIN,
        name: 'Administrator',
        description: 'Manage organization settings and users',
        isSystem: true,
        priority: 90,
        permissions: [
          { resource: 'organization', actions: ['read', 'update'] },
          { resource: 'users', actions: ['*'] },
          { resource: 'teams', actions: ['*'] },
          { resource: 'constructs', actions: ['*'] },
          { resource: 'settings', actions: ['*'] }
        ]
      },
      {
        id: Role.DEVELOPER,
        name: 'Developer',
        description: 'Create and manage constructs',
        isSystem: true,
        priority: 50,
        permissions: [
          { resource: 'organization', actions: ['read'] },
          { resource: 'constructs', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'projects', actions: ['create', 'read', 'update'] },
          { resource: 'teams', actions: ['read'] }
        ]
      },
      {
        id: Role.VIEWER,
        name: 'Viewer',
        description: 'View organization resources',
        isSystem: true,
        priority: 20,
        permissions: [
          { resource: 'organization', actions: ['read'] },
          { resource: 'constructs', actions: ['read'] },
          { resource: 'projects', actions: ['read'] },
          { resource: 'teams', actions: ['read'] }
        ]
      },
      {
        id: Role.GUEST,
        name: 'Guest',
        description: 'Limited access to public resources',
        isSystem: true,
        priority: 10,
        permissions: [
          { resource: 'public_constructs', actions: ['read'] },
          { resource: 'documentation', actions: ['read'] }
        ]
      }
    ]

    systemRoles.forEach(role => {
      this.roleDefinitions.set(role.id, role)
    })
  }

  // Organization Management
  async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const org: Organization = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Validate plan
    if (!this.isValidPlan(org.plan)) {
      throw new Error('Invalid enterprise plan')
    }

    // Create default license
    const license: License = {
      id: this.generateId(),
      organizationId: org.id,
      planId: org.plan.id,
      status: 'active',
      seats: org.plan.features.maxUsers,
      usedSeats: 1, // Owner
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      autoRenew: true
    }

    this.organizations.set(org.id, org)
    this.licenses.set(license.id, license)

    return org
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const org = this.organizations.get(id)
    if (!org) {
      throw new Error('Organization not found')
    }

    const updated = {
      ...org,
      ...updates,
      updatedAt: new Date()
    }

    this.organizations.set(id, updated)
    return updated
  }

  getOrganization(id: string): Organization | undefined {
    return this.organizations.get(id)
  }

  // Team Management
  async createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const org = this.organizations.get(data.organizationId)
    if (!org) {
      throw new Error('Organization not found')
    }

    // Check team limits
    const orgTeams = this.getOrganizationTeams(data.organizationId)
    if (orgTeams.length >= org.plan.features.maxTeams) {
      throw new Error('Team limit reached for organization plan')
    }

    const team: Team = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.teams.set(team.id, team)
    return team
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const team = this.teams.get(id)
    if (!team) {
      throw new Error('Team not found')
    }

    const updated = {
      ...team,
      ...updates,
      updatedAt: new Date()
    }

    this.teams.set(id, updated)
    return updated
  }

  getTeam(id: string): Team | undefined {
    return this.teams.get(id)
  }

  getOrganizationTeams(organizationId: string): Team[] {
    return Array.from(this.teams.values()).filter(
      team => team.organizationId === organizationId
    )
  }

  getUserTeams(userId: string): Team[] {
    return Array.from(this.teams.values()).filter(
      team => team.leaderId === userId || team.memberIds.includes(userId)
    )
  }

  // Role Management
  getRoleDefinition(roleId: string): RoleDefinition | undefined {
    return this.roleDefinitions.get(roleId)
  }

  getRoleDefinitions(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values())
  }

  async createCustomRole(data: Omit<RoleDefinition, 'id' | 'isSystem'>): Promise<RoleDefinition> {
    const role: RoleDefinition = {
      ...data,
      id: this.generateId(),
      isSystem: false
    }

    this.roleDefinitions.set(role.id, role)
    return role
  }

  hasPermission(roleId: string, resource: string, action: string): boolean {
    const role = this.roleDefinitions.get(roleId)
    if (!role) {
      return false
    }

    return role.permissions.some(perm => {
      const resourceMatch = perm.resource === '*' || perm.resource === resource
      const actionMatch = perm.actions.includes('*') || perm.actions.includes(action)
      return resourceMatch && actionMatch
    })
  }

  // License Management
  getLicense(organizationId: string): License | undefined {
    return Array.from(this.licenses.values()).find(
      license => license.organizationId === organizationId
    )
  }

  async updateLicense(id: string, updates: Partial<License>): Promise<License> {
    const license = this.licenses.get(id)
    if (!license) {
      throw new Error('License not found')
    }

    const updated = {
      ...license,
      ...updates
    }

    this.licenses.set(id, updated)
    return updated
  }

  validateLicense(organizationId: string): { valid: boolean; reason?: string } {
    const license = this.getLicense(organizationId)
    if (!license) {
      return { valid: false, reason: 'No license found' }
    }

    if (license.status !== 'active') {
      return { valid: false, reason: `License is ${license.status}` }
    }

    if (new Date() > license.endDate) {
      return { valid: false, reason: 'License expired' }
    }

    if (license.usedSeats > license.seats) {
      return { valid: false, reason: 'Seat limit exceeded' }
    }

    return { valid: true }
  }

  // Usage Tracking
  async trackUsage(metrics: UsageMetrics): Promise<void> {
    const org = this.organizations.get(metrics.organizationId)
    if (!org) {
      throw new Error('Organization not found')
    }

    // Check quotas
    const quotas = org.plan.quotas
    const alerts: UsageAlert[] = []

    // Storage quota
    if (metrics.metrics.storage.usedGB > quotas.storageGB * 0.9) {
      alerts.push({
        id: this.generateId(),
        organizationId: metrics.organizationId,
        type: 'quota_warning',
        severity: 'warning',
        metric: 'storage',
        threshold: quotas.storageGB * 0.9,
        currentValue: metrics.metrics.storage.usedGB,
        message: `Storage usage at ${Math.round((metrics.metrics.storage.usedGB / quotas.storageGB) * 100)}% of quota`,
        createdAt: new Date()
      })
    }

    // API calls quota
    if (metrics.metrics.api.calls > quotas.apiCallsPerMonth * 0.9) {
      alerts.push({
        id: this.generateId(),
        organizationId: metrics.organizationId,
        type: 'quota_warning',
        severity: 'warning',
        metric: 'api_calls',
        threshold: quotas.apiCallsPerMonth * 0.9,
        currentValue: metrics.metrics.api.calls,
        message: `API usage at ${Math.round((metrics.metrics.api.calls / quotas.apiCallsPerMonth) * 100)}% of monthly quota`,
        createdAt: new Date()
      })
    }

    // Store alerts (in real implementation, would send notifications)
    alerts.forEach(alert => {
      console.warn('Usage alert:', alert)
    })
  }

  getUsageMetrics(organizationId: string, period: UsageMetrics['period']): UsageMetrics | undefined {
    // In real implementation, would fetch from database
    const now = new Date()
    const startDate = new Date(now)
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    return {
      organizationId,
      period,
      startDate,
      endDate: now,
      metrics: {
        users: { active: 10, total: 15, new: 2 },
        constructs: { created: 25, modified: 50, shared: 10, total: 150 },
        ai: { requests: 500, tokens: 150000, models: { 'claude-3': 400, 'gpt-4': 100 } },
        storage: { usedGB: 12.5, filesCount: 1250 },
        compute: { hours: 45, builds: 120, deploys: 30 },
        api: { calls: 5000, errors: 25, latencyMs: 150 }
      }
    }
  }

  // Quota Enforcement
  async checkQuota(
    organizationId: string,
    resource: keyof PlanQuotas,
    requestedAmount: number = 1
  ): Promise<{ allowed: boolean; remaining: number; message?: string }> {
    const org = this.organizations.get(organizationId)
    if (!org) {
      return { allowed: false, remaining: 0, message: 'Organization not found' }
    }

    const license = this.getLicense(organizationId)
    if (!license || license.status !== 'active') {
      return { allowed: false, remaining: 0, message: 'Invalid or inactive license' }
    }

    const quotas = org.plan.quotas
    const usage = this.getUsageMetrics(organizationId, 'monthly')
    
    if (!usage) {
      return { allowed: true, remaining: quotas[resource] }
    }

    let currentUsage = 0
    const quota = quotas[resource]

    // Map resource to usage metric
    switch (resource) {
      case 'storageGB':
        currentUsage = usage.metrics.storage.usedGB
        break
      case 'apiCallsPerMonth':
        currentUsage = usage.metrics.api.calls
        break
      case 'computeHours':
        currentUsage = usage.metrics.compute.hours
        break
      default:
        currentUsage = 0
    }

    const remaining = quota - currentUsage
    const allowed = remaining >= requestedAmount

    return {
      allowed,
      remaining: Math.max(0, remaining),
      message: allowed ? undefined : `Quota exceeded for ${resource}`
    }
  }

  // Compliance
  async generateComplianceReport(organizationId: string): Promise<{
    organization: Organization
    compliance: {
      gdpr: boolean
      hipaa: boolean
      soc2: boolean
      dataRetention: boolean
      auditLogs: boolean
    }
    recommendations: string[]
  }> {
    const org = this.organizations.get(organizationId)
    if (!org) {
      throw new Error('Organization not found')
    }

    const compliance = {
      gdpr: org.settings.gdprCompliant,
      hipaa: org.settings.hipaaCompliant,
      soc2: org.settings.soc2Compliant,
      dataRetention: !!org.settings.dataRetentionDays,
      auditLogs: org.settings.enableAuditLogs
    }

    const recommendations: string[] = []

    if (!compliance.gdpr && org.size !== 'startup') {
      recommendations.push('Enable GDPR compliance for EU data protection')
    }

    if (!compliance.auditLogs) {
      recommendations.push('Enable audit logs for security compliance')
    }

    if (!org.settings.enforceSSO && org.size === 'enterprise') {
      recommendations.push('Enforce SSO for enhanced security')
    }

    if (!org.settings.dataRetentionDays) {
      recommendations.push('Set data retention policy')
    }

    return { organization: org, compliance, recommendations }
  }

  // Utility methods
  private isValidPlan(plan: EnterprisePlan): boolean {
    const validPlans = ['free', 'starter', 'professional', 'enterprise', 'custom']
    return validPlans.includes(plan.name)
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Plan Templates
  getAvailablePlans(): EnterprisePlan[] {
    return [
      {
        id: 'free',
        name: 'free',
        displayName: 'Free',
        features: {
          maxUsers: 3,
          maxTeams: 1,
          maxProjects: 3,
          maxConstructsPerProject: 10,
          ssoEnabled: false,
          advancedRBAC: false,
          customRoles: false,
          apiAccess: false,
          webhooks: false,
          aiModels: ['claude-3-haiku'],
          maxAIRequestsPerMonth: 100,
          priorityAIQueue: false,
          customAIModels: false,
          dedicatedInfrastructure: false,
          customDomain: false,
          supportLevel: 'community',
          trainingHours: 0,
          dedicatedAccountManager: false
        },
        quotas: {
          storageGB: 1,
          bandwidthGB: 5,
          computeHours: 10,
          apiCallsPerMonth: 1000,
          concurrentBuilds: 1,
          retentionDays: 7
        },
        pricing: {
          monthly: 0,
          annual: 0,
          currency: 'USD'
        }
      },
      {
        id: 'professional',
        name: 'professional',
        displayName: 'Professional',
        features: {
          maxUsers: 20,
          maxTeams: 5,
          maxProjects: 20,
          maxConstructsPerProject: 100,
          ssoEnabled: true,
          advancedRBAC: true,
          customRoles: false,
          apiAccess: true,
          webhooks: true,
          aiModels: ['claude-3-haiku', 'claude-3-sonnet'],
          maxAIRequestsPerMonth: 5000,
          priorityAIQueue: true,
          customAIModels: false,
          dedicatedInfrastructure: false,
          customDomain: true,
          slaGuarantee: 99.5,
          supportLevel: 'priority',
          trainingHours: 10,
          dedicatedAccountManager: false
        },
        quotas: {
          storageGB: 100,
          bandwidthGB: 500,
          computeHours: 200,
          apiCallsPerMonth: 100000,
          concurrentBuilds: 5,
          retentionDays: 90
        },
        pricing: {
          monthly: 299,
          annual: 2990,
          currency: 'USD'
        }
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        displayName: 'Enterprise',
        features: {
          maxUsers: -1, // Unlimited
          maxTeams: -1,
          maxProjects: -1,
          maxConstructsPerProject: -1,
          ssoEnabled: true,
          advancedRBAC: true,
          customRoles: true,
          apiAccess: true,
          webhooks: true,
          aiModels: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
          maxAIRequestsPerMonth: -1,
          priorityAIQueue: true,
          customAIModels: true,
          dedicatedInfrastructure: true,
          customDomain: true,
          slaGuarantee: 99.99,
          supportLevel: 'dedicated',
          trainingHours: 50,
          dedicatedAccountManager: true
        },
        quotas: {
          storageGB: -1,
          bandwidthGB: -1,
          computeHours: -1,
          apiCallsPerMonth: -1,
          concurrentBuilds: -1,
          retentionDays: -1
        },
        pricing: {
          monthly: -1, // Custom pricing
          annual: -1,
          currency: 'USD'
        }
      }
    ]
  }
}

export const enterpriseConfig = EnterpriseConfigService.getInstance()