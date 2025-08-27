/**
 * L1 Authenticated Tool Registry Implementation
 * 
 * A secure tool registry that adds authentication, authorization, and audit
 * capabilities on top of the L0 Tool Registry Primitive.
 */

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Lock, Users, Key, Activity, AlertTriangle, 
  FileText, BarChart, UserCheck, Settings, Database,
  CheckCircle, XCircle, Info
} from 'lucide-react'
import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { ConstructRenderProps } from '../../types'
import { authenticatedToolRegistryDefinition } from './AuthenticatedToolRegistry.definition'
import { ToolRegistryPrimitiveConstruct, RegisteredTool, ToolRegistryPrimitiveOutput } from '../../L0/infrastructure/mcp/ToolRegistryPrimitive'
import { AuthTokenPrimitive, TokenInfo } from '../../L0/infrastructure/AuthTokenPrimitive'
import { StorageBucketPrimitive } from '../../L0/infrastructure/StorageBucketPrimitive'

// Types for the component
interface User {
  id: string
  username: string
  email: string
  role: string
  createdAt: Date
  lastActive: Date
  isActive: boolean
}

interface Role {
  name: string
  permissions: string[]
  quotas: {
    unlimited?: boolean
    dailyExecutions?: number
    maxRegistrations?: number
  }
}

interface QuotaUsage {
  dailyExecutions: { used: number; limit: number }
  registrations: { used: number; limit: number }
  lastReset: Date
}

interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  username: string
  action: string
  resource: string
  result: 'success' | 'failure'
  details: any
  ip?: string
}

interface SecurityMetrics {
  authSuccessRate: number
  activeUsers: number
  totalExecutions: number
  securityIncidents: number
  quotaViolations: number
}

export class AuthenticatedToolRegistry extends L1InfrastructureConstruct {
  private jwtSecret: string
  private roles: Map<string, Role> = new Map()
  private users: Map<string, User> = new Map()
  private auditLogs: AuditLog[] = []
  private quotaUsage: Map<string, QuotaUsage> = new Map()
  private metrics: SecurityMetrics = {
    authSuccessRate: 100,
    activeUsers: 0,
    totalExecutions: 0,
    securityIncidents: 0,
    quotaViolations: 0
  }

  // L0 Primitive instances
  private toolRegistryConstruct?: ToolRegistryPrimitiveConstruct
  private toolRegistry?: ToolRegistryPrimitiveOutput
  private authTokenPrimitive?: AuthTokenPrimitive
  private auditStoragePrimitive?: StorageBucketPrimitive

  constructor(config: any) {
    super(authenticatedToolRegistryDefinition)
    this.jwtSecret = config.authConfig?.jwtSecret || 'default-secret'
    this.initializeRoles(config.rbacConfig?.roles || {})
  }

  private initializeRoles(rolesConfig: any) {
    // Initialize default roles
    this.roles.set('admin', {
      name: 'admin',
      permissions: ['tool:*', 'user:*', 'audit:*'],
      quotas: { unlimited: true }
    })
    this.roles.set('developer', {
      name: 'developer',
      permissions: ['tool:read', 'tool:execute', 'tool:register'],
      quotas: { dailyExecutions: 1000, maxRegistrations: 50 }
    })
    this.roles.set('viewer', {
      name: 'viewer',
      permissions: ['tool:read', 'audit:read:own'],
      quotas: { dailyExecutions: 100, maxRegistrations: 0 }
    })

    // Add custom roles from config
    Object.entries(rolesConfig).forEach(([name, config]: [string, any]) => {
      this.roles.set(name, { name, ...config })
    })
  }

  protected async onInitialize(): Promise<void> {
    console.log('Initializing Authenticated Tool Registry')
    
    // Initialize L0 primitives
    this.toolRegistryConstruct = new ToolRegistryPrimitiveConstruct(ToolRegistryPrimitiveConstruct.metadata)
    await this.toolRegistryConstruct.initialize({
      validateTools: true,
      maxTools: 1000,
      enableVersioning: true,
      supportedCategories: ['analysis', 'generation', 'validation', 'monitoring', 'deployment']
    })
    
    // For now, we'll create a manual implementation of the tool registry output
    // In a real implementation, this would be properly connected to the React component
    this.toolRegistry = this.createToolRegistryImplementation()
    
    this.authTokenPrimitive = new AuthTokenPrimitive()
    await this.authTokenPrimitive.initialize({
      tokenPrefix: 'jwt',
      tokenLength: 64,
      expirationTime: 8 * 60 * 60 * 1000 // 8 hours
    })
    await this.authTokenPrimitive.deploy()
    
    this.auditStoragePrimitive = new StorageBucketPrimitive()
    await this.auditStoragePrimitive.initialize({
      bucketName: 'audit-logs',
      maxFileSize: 10 * 1024 * 1024 // 10MB per audit log file
    })
    await this.auditStoragePrimitive.deploy()
    
    // Initialize with demo admin user
    await this.createUser('admin', 'admin@example.com', 'admin')
    
    // Set initial outputs
    this.setOutput('registry', this)
    this.setOutput('authenticateUser', this.authenticateUser.bind(this))
    this.setOutput('authorizeToolAccess', this.authorizeToolAccess.bind(this))
    this.setOutput('registerToolWithAuth', this.registerToolWithAuth.bind(this))
    this.setOutput('executeToolWithAuth', this.executeToolWithAuth.bind(this))
    this.setOutput('getUserQuotaStatus', this.getQuotaUsage.bind(this))
    this.setOutput('getAuditLogs', this.getAuditLogs.bind(this))
    this.setOutput('manageUserRoles', this.setUserRole.bind(this))
    this.setOutput('getToolPermissionMatrix', this.getToolPermissionMatrix.bind(this))
    this.setOutput('securityMetrics', this.metrics)
  }

  protected async onValidate(): Promise<boolean> {
    if (!this.jwtSecret || this.jwtSecret === 'default-secret') {
      console.warn('Using default JWT secret - not secure for production')
    }
    return true
  }

  protected async onDeploy(): Promise<void> {
    console.log('Deploying Authenticated Tool Registry')
  }

  protected async onDestroy(): Promise<void> {
    console.log('Destroying Authenticated Tool Registry')
  }

  async createUser(username: string, email: string, role: string = 'viewer'): Promise<{ userId: string; token: string }> {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const user: User = {
      id: userId,
      username,
      email,
      role,
      createdAt: new Date(),
      lastActive: new Date(),
      isActive: true
    }
    
    this.users.set(userId, user)
    this.metrics.activeUsers++
    
    // Initialize quota for user
    this.quotaUsage.set(userId, {
      dailyExecutions: { used: 0, limit: this.roles.get(role)?.quotas.dailyExecutions || 100 },
      registrations: { used: 0, limit: this.roles.get(role)?.quotas.maxRegistrations || 0 },
      lastReset: new Date()
    })
    
    // Create audit log
    this.logAudit({
      userId,
      username,
      action: 'user:create',
      resource: userId,
      result: 'success',
      details: { role }
    })
    
    // Generate initial token for user
    const token = await this.authTokenPrimitive!.generate({
      userId,
      username,
      role,
      permissions: this.roles.get(role)?.permissions || []
    })
    
    return { userId, token }
  }

  async authenticateUser(username: string, _password: string): Promise<{ token: string; refreshToken: string }> {
    // Find user by username
    const user = Array.from(this.users.values()).find(u => u.username === username)
    
    if (!user) {
      this.metrics.authSuccessRate = Math.max(0, this.metrics.authSuccessRate - 5)
      this.metrics.securityIncidents++
      
      this.logAudit({
        userId: 'unknown',
        username,
        action: 'auth:failure',
        resource: 'login',
        result: 'failure',
        details: { reason: 'User not found' }
      })
      
      throw new Error('Authentication failed')
    }
    
    // In production, validate password here
    
    user.lastActive = new Date()
    
    // Generate JWT token using L0 primitive
    const token = await this.authTokenPrimitive!.generate({
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: this.roles.get(user.role)?.permissions || []
    })
    
    // Generate refresh token with longer expiry
    const refreshToken = await this.authTokenPrimitive!.generate({
      userId: user.id,
      type: 'refresh',
      originalToken: token
    })
    
    this.logAudit({
      userId: user.id,
      username: user.username,
      action: 'auth:success',
      resource: 'login',
      result: 'success',
      details: { role: user.role }
    })
    
    return { token, refreshToken }
  }

  async authorizeToolAccess(userId: string, toolName: string, action: string): Promise<boolean> {
    const user = this.users.get(userId)
    if (!user) return false
    
    const role = this.roles.get(user.role)
    if (!role) return false
    
    // Check if role has wildcard permission
    if (role.permissions.includes('tool:*')) return true
    
    // Check specific permission
    const requiredPermission = `tool:${action}`
    const hasPermission = role.permissions.includes(requiredPermission)
    
    this.logAudit({
      userId,
      username: user.username,
      action: hasPermission ? 'auth:granted' : 'auth:denied',
      resource: toolName,
      result: hasPermission ? 'success' : 'failure',
      details: { action, role: user.role }
    })
    
    return hasPermission
  }

  async checkQuota(userId: string, quotaType: 'execution' | 'registration'): Promise<boolean> {
    const usage = this.quotaUsage.get(userId)
    if (!usage) return false
    
    const user = this.users.get(userId)
    if (!user) return false
    
    const role = this.roles.get(user.role)
    if (!role) return false
    
    if (role.quotas.unlimited) return true
    
    // Check if quota needs reset (daily)
    const now = new Date()
    if (now.getDate() !== usage.lastReset.getDate()) {
      usage.dailyExecutions.used = 0
      usage.lastReset = now
    }
    
    if (quotaType === 'execution') {
      const hasQuota = usage.dailyExecutions.used < usage.dailyExecutions.limit
      if (!hasQuota) {
        this.metrics.quotaViolations++
        this.logAudit({
          userId,
          username: user.username,
          action: 'quota:exceeded',
          resource: 'execution',
          result: 'failure',
          details: { 
            used: usage.dailyExecutions.used, 
            limit: usage.dailyExecutions.limit 
          }
        })
      }
      return hasQuota
    }
    
    return usage.registrations.used < usage.registrations.limit
  }

  async incrementQuotaUsage(userId: string, quotaType: 'execution' | 'registration'): Promise<void> {
    const usage = this.quotaUsage.get(userId)
    if (!usage) return
    
    if (quotaType === 'execution') {
      usage.dailyExecutions.used++
      this.metrics.totalExecutions++
    } else {
      usage.registrations.used++
    }
  }

  private logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    this.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...log
    })
    
    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000)
    }
  }

  async getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    let logs = [...this.auditLogs].reverse()
    
    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId)
    }
    
    if (filters?.action) {
      logs = logs.filter(log => log.action.includes(filters.action))
    }
    
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit)
    }
    
    return logs
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics }
  }

  getUsers(): User[] {
    return Array.from(this.users.values())
  }

  getRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  // New methods for L1 functionality
  async registerToolWithAuth(token: string, tool: any): Promise<boolean> {
    // Validate token
    const isValidToken = await this.authTokenPrimitive!.validate(token)
    if (!isValidToken) {
      this.logAudit({
        userId: 'unknown',
        username: 'unknown',
        action: 'tool:register:denied',
        resource: tool.name,
        result: 'failure',
        details: { reason: 'Invalid token' }
      })
      return false
    }

    // Get token info to check permissions
    const tokenInfo = await this.authTokenPrimitive!.getTokenData(token)
    if (!tokenInfo) return false

    const userId = tokenInfo.payload.userId
    const hasPermission = await this.authorizeToolAccess(userId, tool.name, 'register')
    
    if (!hasPermission) {
      return false
    }

    // Check quota
    const canRegister = await this.checkQuota(userId, 'registration')
    if (!canRegister) {
      return false
    }

    // Register the tool using L0 primitive
    const registered = this.toolRegistry!.register(tool)
    
    if (registered) {
      await this.incrementQuotaUsage(userId, 'registration')
      this.logAudit({
        userId,
        username: tokenInfo.payload.username,
        action: 'tool:register:success',
        resource: tool.name,
        result: 'success',
        details: { category: tool.category }
      })
    }

    return registered
  }

  async executeToolWithAuth(token: string, toolName: string, params: any): Promise<any> {
    // Validate token
    const isValidToken = await this.authTokenPrimitive!.validate(token)
    if (!isValidToken) {
      throw new Error('Invalid or expired token')
    }

    const tokenInfo = await this.authTokenPrimitive!.getTokenData(token)
    if (!tokenInfo) {
      throw new Error('Token not found')
    }

    const userId = tokenInfo.payload.userId
    const hasPermission = await this.authorizeToolAccess(userId, toolName, 'execute')
    
    if (!hasPermission) {
      throw new Error('Permission denied')
    }

    // Check quota
    const canExecute = await this.checkQuota(userId, 'execution')
    if (!canExecute) {
      throw new Error('Quota exceeded')
    }

    // Get the tool from registry
    const tool = this.toolRegistry!.get(toolName)
    if (!tool) {
      throw new Error('Tool not found')
    }

    // Mark tool as used
    this.toolRegistry!.markUsed(toolName)
    
    // Increment quota usage
    await this.incrementQuotaUsage(userId, 'execution')
    
    // Log execution
    this.logAudit({
      userId,
      username: tokenInfo.payload.username,
      action: 'tool:execute',
      resource: toolName,
      result: 'success',
      details: { params }
    })

    // In a real implementation, this would execute the tool
    // For now, return a mock result
    return {
      success: true,
      toolName,
      executedAt: new Date(),
      result: `Executed ${toolName} with params: ${JSON.stringify(params)}`
    }
  }

  async getQuotaUsage(userId: string): Promise<QuotaUsage | undefined> {
    return this.quotaUsage.get(userId)
  }

  async setUserRole(userId: string, newRole: string): Promise<void> {
    const user = this.users.get(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const role = this.roles.get(newRole)
    if (!role) {
      throw new Error('Invalid role')
    }

    const oldRole = user.role
    user.role = newRole

    // Update quota limits based on new role
    const usage = this.quotaUsage.get(userId)
    if (usage) {
      usage.dailyExecutions.limit = role.quotas.dailyExecutions || 100
      usage.registrations.limit = role.quotas.maxRegistrations || 0
    }

    this.logAudit({
      userId,
      username: user.username,
      action: 'user:role:changed',
      resource: userId,
      result: 'success',
      details: { oldRole, newRole }
    })

    // Emit role changed event
    this.emit('roleChanged', {
      userId,
      oldRole,
      newRole,
      changedBy: 'system',
      timestamp: new Date()
    })
  }

  getToolPermissionMatrix(): Record<string, Record<string, boolean>> {
    const matrix: Record<string, Record<string, boolean>> = {}
    const permissions = [
      'tool:read',
      'tool:execute',
      'tool:register',
      'tool:delete',
      'user:create',
      'user:delete',
      'user:modify',
      'audit:read',
      'audit:export'
    ]

    for (const [roleName, role] of this.roles) {
      matrix[roleName] = {}
      for (const permission of permissions) {
        matrix[roleName][permission] = 
          role.permissions.includes(permission) ||
          role.permissions.includes(permission.split(':')[0] + ':*') ||
          role.permissions.includes('*')
      }
    }

    return matrix
  }

  // JWT-specific methods
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const isValid = await this.authTokenPrimitive!.validate(refreshToken)
    if (!isValid) {
      throw new Error('Invalid refresh token')
    }

    const tokenInfo = await this.authTokenPrimitive!.getTokenData(refreshToken)
    if (!tokenInfo || tokenInfo.payload.type !== 'refresh') {
      throw new Error('Invalid refresh token type')
    }

    const userId = tokenInfo.payload.userId
    const user = this.users.get(userId)
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    // Generate new tokens
    const newToken = await this.authTokenPrimitive!.generate({
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: this.roles.get(user.role)?.permissions || []
    })

    const newRefreshToken = await this.authTokenPrimitive!.generate({
      userId: user.id,
      type: 'refresh',
      originalToken: newToken
    })

    // Revoke old refresh token
    await this.authTokenPrimitive!.revoke(refreshToken)

    this.logAudit({
      userId: user.id,
      username: user.username,
      action: 'token:refresh',
      resource: 'token',
      result: 'success',
      details: {}
    })

    return { token: newToken, refreshToken: newRefreshToken }
  }

  async revokeAccess(userId: string, reason: string): Promise<void> {
    const user = this.users.get(userId)
    if (!user) {
      throw new Error('User not found')
    }

    user.isActive = false

    // Revoke all user tokens
    const allTokens = await this.authTokenPrimitive!.listTokens()
    for (const tokenInfo of allTokens) {
      if (tokenInfo.payload.userId === userId) {
        await this.authTokenPrimitive!.revoke(tokenInfo.token)
      }
    }

    this.logAudit({
      userId,
      username: user.username,
      action: 'user:revoked',
      resource: userId,
      result: 'success',
      details: { reason }
    })

    this.emit('securityAlert', {
      type: 'access_revoked',
      severity: 'high',
      userId,
      details: { reason },
      timestamp: new Date()
    })
  }

  async queryAuditLogs(filters: any): Promise<AuditLog[]> {
    return this.getAuditLogs(filters)
  }

  // Create a manual implementation of the tool registry
  private createToolRegistryImplementation(): ToolRegistryPrimitiveOutput {
    const tools = new Map<string, RegisteredTool>()
    
    return {
      register: (tool: any) => {
        if (tools.has(tool.name)) {
          return false
        }
        const registeredTool: RegisteredTool = {
          ...tool,
          registeredAt: new Date(),
          status: 'active',
          usageCount: 0
        }
        tools.set(tool.name, registeredTool)
        return true
      },
      unregister: (toolName: string) => {
        return tools.delete(toolName)
      },
      get: (toolName: string) => {
        return tools.get(toolName)
      },
      getAll: () => {
        return Array.from(tools.values())
      },
      getByCategory: (category: string) => {
        return Array.from(tools.values()).filter(t => t.category === category)
      },
      search: (query: string) => {
        const lowerQuery = query.toLowerCase()
        return Array.from(tools.values()).filter(t => 
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery)
        )
      },
      updateStatus: (toolName: string, status: RegisteredTool['status']) => {
        const tool = tools.get(toolName)
        if (tool) {
          tool.status = status
          return true
        }
        return false
      },
      has: (toolName: string) => {
        return tools.has(toolName)
      },
      count: () => {
        return tools.size
      },
      markUsed: (toolName: string) => {
        const tool = tools.get(toolName)
        if (tool) {
          tool.usageCount++
          tool.lastUsed = new Date()
        }
      },
      validate: (tool: any) => {
        const errors: string[] = []
        if (!tool.name) errors.push('Tool name is required')
        if (!tool.description) errors.push('Tool description is required')
        return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
      },
      export: () => {
        return JSON.stringify({
          version: '1.0',
          timestamp: new Date().toISOString(),
          tools: Array.from(tools.values())
        }, null, 2)
      },
      import: (data: string) => {
        try {
          const importData = JSON.parse(data)
          tools.clear()
          for (const tool of importData.tools) {
            tools.set(tool.name, tool)
          }
          return true
        } catch {
          return false
        }
      }
    }
  }

  // Event emitter functionality (inherited from L1InfrastructureConstruct)
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map()

  on(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    
    this.eventListeners.get(event)!.push(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventListeners.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  emit(event: string, data?: any): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
}

/**
 * React component for rendering the Authenticated Tool Registry
 */
export const AuthenticatedToolRegistryComponent: React.FC<ConstructRenderProps> = ({ 
  instance: _instance,
  onInteraction 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit' | 'permissions'>('overview')
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    authSuccessRate: 100,
    activeUsers: 3,
    totalExecutions: 0,
    securityIncidents: 0,
    quotaViolations: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Simulate registry activity
  useEffect(() => {
    // Initialize with demo data
    const demoUsers: User[] = [
      {
        id: 'user-1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastActive: new Date(),
        isActive: true
      },
      {
        id: 'user-2',
        username: 'john.developer',
        email: 'john@example.com',
        role: 'developer',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: 'user-3',
        username: 'jane.viewer',
        email: 'jane@example.com',
        role: 'viewer',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: false
      }
    ]
    setUsers(demoUsers)

    // Initialize with demo audit logs
    const demoLogs: AuditLog[] = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        userId: 'user-2',
        username: 'john.developer',
        action: 'tool:execute',
        resource: 'code-analyzer',
        result: 'success',
        details: { duration: 250 }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        userId: 'user-1',
        username: 'admin',
        action: 'user:create',
        resource: 'user-3',
        result: 'success',
        details: { role: 'viewer' }
      },
      {
        id: 'log-3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        userId: 'user-3',
        username: 'jane.viewer',
        action: 'auth:failure',
        resource: 'login',
        result: 'failure',
        details: { reason: 'Invalid password' }
      }
    ]
    setAuditLogs(demoLogs)

    // Simulate metrics updates
    intervalRef.current = setInterval(() => {
      setMetrics(prev => ({
        authSuccessRate: Math.max(85, Math.min(100, prev.authSuccessRate + (Math.random() - 0.3) * 2)),
        activeUsers: Math.max(0, Math.min(10, prev.activeUsers + Math.floor((Math.random() - 0.4) * 2))),
        totalExecutions: prev.totalExecutions + (Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0),
        securityIncidents: prev.securityIncidents + (Math.random() > 0.95 ? 1 : 0),
        quotaViolations: prev.quotaViolations + (Math.random() > 0.9 ? 1 : 0)
      }))

      // Occasionally add new audit logs
      if (Math.random() > 0.8) {
        const actions = ['tool:execute', 'auth:success', 'tool:read', 'quota:check']
        const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)]
        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          userId: randomUser.id,
          username: randomUser.username,
          action: actions[Math.floor(Math.random() * actions.length)],
          resource: 'tool-' + Math.floor(Math.random() * 10),
          result: Math.random() > 0.1 ? 'success' : 'failure',
          details: {}
        }
        setAuditLogs(prev => [newLog, ...prev].slice(0, 50))
      }
    }, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleCreateUser = useCallback(() => {
    setShowCreateUser(true)
    onInteraction?.('createUser', {})
  }, [onInteraction])

  const handleUserClick = useCallback((user: User) => {
    setSelectedUser(user)
    onInteraction?.('selectUser', { userId: user.id })
  }, [onInteraction])

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Authenticated Tool Registry</h3>
            <p className="text-sm text-gray-400">
              Secure tool management with RBAC
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        {(['overview', 'users', 'audit', 'permissions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === tab 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Security Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                icon={<Key className="w-4 h-4" />}
                label="Auth Success"
                value={`${metrics.authSuccessRate.toFixed(1)}%`}
                color="green"
              />
              <MetricCard
                icon={<Users className="w-4 h-4" />}
                label="Active Users"
                value={metrics.activeUsers}
                color="blue"
              />
              <MetricCard
                icon={<Activity className="w-4 h-4" />}
                label="Executions"
                value={metrics.totalExecutions}
                color="purple"
              />
              <MetricCard
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Incidents"
                value={metrics.securityIncidents}
                color="orange"
              />
              <MetricCard
                icon={<Lock className="w-4 h-4" />}
                label="Quota Violations"
                value={metrics.quotaViolations}
                color="red"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickStatCard
                title="User Distribution"
                items={[
                  { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-purple-500' },
                  { label: 'Developers', value: users.filter(u => u.role === 'developer').length, color: 'text-blue-500' },
                  { label: 'Viewers', value: users.filter(u => u.role === 'viewer').length, color: 'text-gray-500' }
                ]}
              />
              <QuickStatCard
                title="Recent Activity"
                items={[
                  { label: 'Last Hour', value: auditLogs.filter(l => Date.now() - l.timestamp.getTime() < 3600000).length, color: 'text-green-500' },
                  { label: 'Last 24h', value: auditLogs.filter(l => Date.now() - l.timestamp.getTime() < 86400000).length, color: 'text-blue-500' },
                  { label: 'Failed', value: auditLogs.filter(l => l.result === 'failure').length, color: 'text-red-500' }
                ]}
              />
              <QuickStatCard
                title="Security Features"
                items={[
                  { label: 'JWT Auth', value: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' },
                  { label: 'RBAC', value: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' },
                  { label: 'Audit Logs', value: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' }
                ]}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* User Management Header */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-400">Manage Users</h4>
              <button
                onClick={handleCreateUser}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                Add User
              </button>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {users.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => handleUserClick(user)}
                  isSelected={selectedUser?.id === user.id}
                />
              ))}
            </div>

            {/* User Details */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-800 rounded-lg"
              >
                <h5 className="font-medium mb-3">{selectedUser.username} Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Role:</span>
                    <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs">
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2">{selectedUser.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Active:</span>
                    <span className="ml-2">{formatTimeAgo(selectedUser.lastActive)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                    Change Role
                  </button>
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                    Reset Password
                  </button>
                  <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">
                    Revoke Access
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Audit Log Header */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-400">Security Audit Logs</h4>
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors">
                Export Logs
              </button>
            </div>

            {/* Audit Log List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <AuditLogCard key={log.id} log={log} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'permissions' && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Permissions Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-4">Permission</th>
                    <th className="text-center py-2 px-4">Admin</th>
                    <th className="text-center py-2 px-4">Developer</th>
                    <th className="text-center py-2 px-4">Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'View Tools', perms: { admin: true, developer: true, viewer: true } },
                    { name: 'Execute Tools', perms: { admin: true, developer: true, viewer: false } },
                    { name: 'Register Tools', perms: { admin: true, developer: true, viewer: false } },
                    { name: 'Delete Tools', perms: { admin: true, developer: false, viewer: false } },
                    { name: 'Manage Users', perms: { admin: true, developer: false, viewer: false } },
                    { name: 'View All Audit Logs', perms: { admin: true, developer: false, viewer: false } },
                    { name: 'View Own Audit Logs', perms: { admin: true, developer: true, viewer: true } }
                  ].map(({ name, perms }) => (
                    <tr key={name} className="border-b border-gray-800/50">
                      <td className="py-2 px-4">{name}</td>
                      <td className="text-center py-2 px-4">
                        {perms.admin ? (
                          <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>
                      <td className="text-center py-2 px-4">
                        {perms.developer ? (
                          <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>
                      <td className="text-center py-2 px-4">
                        {perms.viewer ? (
                          <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quota Limits */}
            <div className="mt-6">
              <h5 className="font-medium mb-3">Daily Quota Limits</h5>
              <div className="grid grid-cols-3 gap-4">
                <QuotaCard role="Admin" executions="Unlimited" registrations="Unlimited" />
                <QuotaCard role="Developer" executions="1,000" registrations="50" />
                <QuotaCard role="Viewer" executions="100" registrations="0" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      {showCreateUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCreateUser(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="john.doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="viewer">Viewer</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md font-medium transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red'
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    green: 'text-green-500 bg-green-500/20',
    blue: 'text-blue-500 bg-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/20',
    orange: 'text-orange-500 bg-orange-500/20',
    red: 'text-red-500 bg-red-500/20'
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

/**
 * Quick Stat Card Component
 */
const QuickStatCard: React.FC<{
  title: string
  items: Array<{ label: string; value: string | number | React.ReactNode; color: string }>
}> = ({ title, items }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <h5 className="font-medium mb-3">{title}</h5>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{item.label}</span>
          <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
)

/**
 * User Card Component
 */
const UserCard: React.FC<{
  user: User
  onClick: () => void
  isSelected: boolean
}> = ({ user, onClick, isSelected }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    onClick={onClick}
    className={`p-4 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-gray-700 border border-purple-500' : 'bg-gray-800/50 hover:bg-gray-800'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          user.isActive ? 'bg-green-500/20' : 'bg-gray-700'
        }`}>
          <UserCheck className={`w-5 h-5 ${user.isActive ? 'text-green-500' : 'text-gray-500'}`} />
        </div>
        <div>
          <div className="font-medium">{user.username}</div>
          <div className="text-sm text-gray-400">{user.email}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xs px-2 py-1 rounded-full ${
          user.role === 'admin' ? 'bg-purple-500/20 text-purple-500' :
          user.role === 'developer' ? 'bg-blue-500/20 text-blue-500' :
          'bg-gray-600 text-gray-300'
        }`}>
          {user.role}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {formatTimeAgo(user.lastActive)}
        </div>
      </div>
    </div>
  </motion.div>
)

/**
 * Audit Log Card Component
 */
const AuditLogCard: React.FC<{ log: AuditLog }> = ({ log }) => {
  const getActionIcon = () => {
    if (log.action.includes('auth')) return <Key className="w-4 h-4" />
    if (log.action.includes('tool')) return <Database className="w-4 h-4" />
    if (log.action.includes('user')) return <Users className="w-4 h-4" />
    if (log.action.includes('quota')) return <BarChart className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  const getActionColor = () => {
    if (log.result === 'failure') return 'text-red-500 bg-red-500/20'
    if (log.action.includes('create') || log.action.includes('execute')) return 'text-green-500 bg-green-500/20'
    if (log.action.includes('update') || log.action.includes('auth')) return 'text-blue-500 bg-blue-500/20'
    if (log.action.includes('delete') || log.action.includes('revoke')) return 'text-orange-500 bg-orange-500/20'
    return 'text-gray-500 bg-gray-500/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getActionColor()}`}>
          {getActionIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{log.username}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-sm text-gray-400">{log.action}</span>
              {log.resource && (
                <>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-sm font-mono text-gray-300">{log.resource}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {log.result === 'failure' && (
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded-full">
                  Failed
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatTimeAgo(log.timestamp)}
              </span>
            </div>
          </div>
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {JSON.stringify(log.details)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Quota Card Component
 */
const QuotaCard: React.FC<{
  role: string
  executions: string
  registrations: string
}> = ({ role, executions, registrations }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <h6 className="font-medium mb-2">{role}</h6>
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">Executions:</span>
        <span className="font-mono">{executions}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Registrations:</span>
        <span className="font-mono">{registrations}</span>
      </div>
    </div>
  </div>
)

/**
 * Format time ago helper
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

// Export the component as default for dynamic imports
export default AuthenticatedToolRegistryComponent

// Re-export the definition from the definition file
export { authenticatedToolRegistryDefinition } from './AuthenticatedToolRegistry.definition'