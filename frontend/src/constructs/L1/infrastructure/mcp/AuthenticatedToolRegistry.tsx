/**
 * Authenticated Tool Registry L1 Infrastructure Construct
 * 
 * Secure tool registry with JWT authentication, role-based access control,
 * usage quotas, and comprehensive audit logging.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { L1MCPConstruct } from '../../../base/L1MCPConstruct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel,
  MCPTool,
  MCPToolMetadata
} from '../../../types'

// Import L0 primitive
import { ToolRegistryPrimitive, ToolRegistryPrimitiveOutput } from '../../../L0/infrastructure/mcp/ToolRegistryPrimitive'

// Import auth manager
import { MCPAuthManager, AuthSession } from '../../../../services/mcp/MCPAuthManager'

// Type definitions
export interface AuthenticatedToolRegistryConfig {
  /** Enable authentication */
  authEnabled: boolean
  /** Enable role-based access control */
  rbacEnabled: boolean
  /** Enable usage quotas */
  quotasEnabled: boolean
  /** Enable audit logging */
  auditEnabled: boolean
  /** Maximum tools allowed */
  maxTools?: number
  /** Default quota per user */
  defaultQuota?: number
  /** Admin roles that can register tools */
  adminRoles?: string[]
  /** Audit log retention days */
  auditRetentionDays?: number
}

export interface ToolPermission {
  toolName: string
  roles: string[]
  users?: string[]
  allowAnonymous?: boolean
}

export interface ToolQuota {
  userId: string
  toolName?: string
  limit: number
  used: number
  resetAt: Date
  period: 'hour' | 'day' | 'month'
}

export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  action: 'register' | 'unregister' | 'execute' | 'permission_change' | 'quota_change'
  toolName: string
  details?: Record<string, any>
  success: boolean
  error?: string
}

export interface AuthenticatedToolRegistryProps {
  config: AuthenticatedToolRegistryConfig
  authManager?: MCPAuthManager
  onToolRegistered?: (tool: MCPTool, userId: string) => void
  onToolExecuted?: (toolName: string, userId: string) => void
  onAuthFailure?: (reason: string, userId?: string) => void
  onQuotaExceeded?: (userId: string, toolName: string) => void
  onAuditLog?: (entry: AuditLogEntry) => void
}

export interface AuthenticatedToolRegistryOutput extends ToolRegistryPrimitiveOutput {
  /** Set tool permissions */
  setPermissions: (toolName: string, permission: ToolPermission) => boolean
  /** Get tool permissions */
  getPermissions: (toolName: string) => ToolPermission | null
  /** Check if user can access tool */
  canAccess: (toolName: string, userId: string, roles: string[]) => boolean
  /** Set user quota */
  setQuota: (quota: ToolQuota) => void
  /** Get user quota */
  getQuota: (userId: string, toolName?: string) => ToolQuota | null
  /** Check quota availability */
  checkQuota: (userId: string, toolName: string) => boolean
  /** Get audit logs */
  getAuditLogs: (filter?: Partial<AuditLogEntry>) => AuditLogEntry[]
  /** Clear old audit logs */
  cleanupAuditLogs: () => number
}

/**
 * Authenticated Tool Registry Component
 */
export const AuthenticatedToolRegistry: React.FC<AuthenticatedToolRegistryProps> = ({
  config,
  authManager: externalAuthManager,
  onToolRegistered,
  onToolExecuted,
  onAuthFailure,
  onQuotaExceeded,
  onAuditLog
}) => {
  // L0 primitive ref
  const registryRef = useRef<ToolRegistryPrimitiveOutput | null>(null)

  // Auth manager (use external or create internal)
  const authManager = useRef(externalAuthManager || new MCPAuthManager())

  // Permission store
  const permissions = useRef<Map<string, ToolPermission>>(new Map())

  // Quota store
  const quotas = useRef<Map<string, ToolQuota>>(new Map())

  // Audit log
  const auditLog = useRef<AuditLogEntry[]>([])

  // Create audit log entry
  const createAuditEntry = useCallback(({
    userId,
    action,
    toolName,
    details,
    success,
    error
  }: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action,
      toolName,
      details,
      success,
      error
    }

    if (config.auditEnabled) {
      auditLog.current.push(entry)
      onAuditLog?.(entry)
    }

    return entry
  }, [config.auditEnabled, onAuditLog])

  // Check authentication
  const checkAuth = useCallback(async (token: string): Promise<AuthSession | null> => {
    if (!config.authEnabled) {
      return { 
        userId: 'anonymous', 
        token, 
        expiresAt: new Date(Date.now() + 3600000),
        roles: ['anonymous'],
        permissions: ['execute']
      }
    }

    try {
      const session = await authManager.current.createSession(token)
      if (!session) {
        onAuthFailure?.('Invalid token')
        return null
      }
      return session
    } catch (error) {
      onAuthFailure?.(error instanceof Error ? error.message : 'Authentication failed')
      return null
    }
  }, [config.authEnabled, onAuthFailure])

  // Set tool permissions
  const setPermissions = useCallback((toolName: string, permission: ToolPermission): boolean => {
    const tool = registryRef.current?.get(toolName)
    if (!tool) return false

    permissions.current.set(toolName, permission)
    
    createAuditEntry({
      userId: 'system',
      action: 'permission_change',
      toolName,
      details: { permission },
      success: true
    })

    return true
  }, [createAuditEntry])

  // Get tool permissions
  const getPermissions = useCallback((toolName: string): ToolPermission | null => {
    return permissions.current.get(toolName) || null
  }, [])

  // Check if user can access tool
  const canAccess = useCallback((toolName: string, userId: string, roles: string[]): boolean => {
    if (!config.rbacEnabled) return true

    const permission = permissions.current.get(toolName)
    if (!permission) {
      // No specific permissions set, use default behavior
      return true
    }

    // Check anonymous access
    if (permission.allowAnonymous) return true

    // Check user-specific access
    if (permission.users?.includes(userId)) return true

    // Check role-based access
    return permission.roles.some(role => roles.includes(role))
  }, [config.rbacEnabled])

  // Set user quota
  const setQuota = useCallback((quota: ToolQuota): void => {
    const key = quota.toolName ? `${quota.userId}:${quota.toolName}` : quota.userId
    quotas.current.set(key, quota)

    createAuditEntry({
      userId: 'system',
      action: 'quota_change',
      toolName: quota.toolName || 'global',
      details: { quota },
      success: true
    })
  }, [createAuditEntry])

  // Get user quota
  const getQuota = useCallback((userId: string, toolName?: string): ToolQuota | null => {
    const key = toolName ? `${userId}:${toolName}` : userId
    return quotas.current.get(key) || null
  }, [])

  // Check quota availability
  const checkQuota = useCallback((userId: string, toolName: string): boolean => {
    if (!config.quotasEnabled) return true

    // Check tool-specific quota
    const toolQuota = getQuota(userId, toolName)
    if (toolQuota) {
      const now = new Date()
      if (now > toolQuota.resetAt) {
        // Reset quota
        toolQuota.used = 0
        toolQuota.resetAt = this.getNextResetTime(toolQuota.period)
      }
      return toolQuota.used < toolQuota.limit
    }

    // Check global quota
    const globalQuota = getQuota(userId)
    if (globalQuota) {
      const now = new Date()
      if (now > globalQuota.resetAt) {
        globalQuota.used = 0
        globalQuota.resetAt = this.getNextResetTime(globalQuota.period)
      }
      return globalQuota.used < globalQuota.limit
    }

    // No quota set, use default
    if (config.defaultQuota) {
      setQuota({
        userId,
        limit: config.defaultQuota,
        used: 0,
        resetAt: this.getNextResetTime('day'),
        period: 'day'
      })
      return true
    }

    return true
  }, [config.quotasEnabled, config.defaultQuota, getQuota, setQuota])

  // Get next reset time
  const getNextResetTime = useCallback((period: 'hour' | 'day' | 'month'): Date => {
    const now = new Date()
    switch (period) {
      case 'hour':
        return new Date(now.getTime() + 3600000)
      case 'day': {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return tomorrow
      }
      case 'month': {
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        nextMonth.setHours(0, 0, 0, 0)
        return nextMonth
      }
    }
  }, [])

  // Increment quota usage
  const incrementQuota = useCallback((userId: string, toolName: string): void => {
    // Increment tool-specific quota
    const toolQuota = getQuota(userId, toolName)
    if (toolQuota) {
      toolQuota.used++
    }

    // Increment global quota
    const globalQuota = getQuota(userId)
    if (globalQuota) {
      globalQuota.used++
    }
  }, [getQuota])

  // Get audit logs
  const getAuditLogs = useCallback((filter?: Partial<AuditLogEntry>): AuditLogEntry[] => {
    if (!filter) return [...auditLog.current]

    return auditLog.current.filter(entry => {
      if (filter.userId && entry.userId !== filter.userId) return false
      if (filter.action && entry.action !== filter.action) return false
      if (filter.toolName && entry.toolName !== filter.toolName) return false
      if (filter.success !== undefined && entry.success !== filter.success) return false
      return true
    })
  }, [])

  // Cleanup old audit logs
  const cleanupAuditLogs = useCallback((): number => {
    if (!config.auditRetentionDays) return 0

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.auditRetentionDays)

    const initialCount = auditLog.current.length
    auditLog.current = auditLog.current.filter(entry => entry.timestamp > cutoffDate)
    
    return initialCount - auditLog.current.length
  }, [config.auditRetentionDays])

  // Wrap register method with auth check
  const handleRegister = useCallback(async (tool: MCPTool, auth?: string): Promise<boolean> => {
    try {
      // Check authentication
      if (config.authEnabled && auth) {
        const session = await checkAuth(auth)
        if (!session) {
          createAuditEntry({
            userId: 'unknown',
            action: 'register',
            toolName: tool.name,
            success: false,
            error: 'Authentication failed'
          })
          return false
        }

        // Check admin role
        const isAdmin = config.adminRoles?.some(role => session.roles.includes(role)) || false
        if (!isAdmin) {
          createAuditEntry({
            userId: session.userId,
            action: 'register',
            toolName: tool.name,
            success: false,
            error: 'Insufficient permissions'
          })
          onAuthFailure?.('Admin role required', session.userId)
          return false
        }

        // Register tool
        const success = registryRef.current?.register(tool) || false
        
        createAuditEntry({
          userId: session.userId,
          action: 'register',
          toolName: tool.name,
          details: { tool },
          success
        })

        if (success) {
          onToolRegistered?.(tool, session.userId)
        }

        return success
      }

      // No auth required
      const success = registryRef.current?.register(tool) || false
      
      createAuditEntry({
        userId: 'anonymous',
        action: 'register',
        toolName: tool.name,
        success
      })

      if (success) {
        onToolRegistered?.(tool, 'anonymous')
      }

      return success
    } catch (error) {
      createAuditEntry({
        userId: 'system',
        action: 'register',
        toolName: tool.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }, [config, checkAuth, createAuditEntry, onToolRegistered, onAuthFailure])

  // Wrap execute method with auth and quota checks
  const handleExecute = useCallback(async (toolName: string, params: any, auth?: string): Promise<any> => {
    try {
      let userId = 'anonymous'
      let roles: string[] = ['anonymous']

      // Check authentication
      if (config.authEnabled && auth) {
        const session = await checkAuth(auth)
        if (!session) {
          createAuditEntry({
            userId: 'unknown',
            action: 'execute',
            toolName,
            success: false,
            error: 'Authentication failed'
          })
          throw new Error('Authentication failed')
        }
        userId = session.userId
        roles = session.roles
      }

      // Check access permissions
      if (!canAccess(toolName, userId, roles)) {
        createAuditEntry({
          userId,
          action: 'execute',
          toolName,
          success: false,
          error: 'Access denied'
        })
        onAuthFailure?.('Access denied', userId)
        throw new Error('Access denied')
      }

      // Check quota
      if (!checkQuota(userId, toolName)) {
        createAuditEntry({
          userId,
          action: 'execute',
          toolName,
          success: false,
          error: 'Quota exceeded'
        })
        onQuotaExceeded?.(userId, toolName)
        throw new Error('Quota exceeded')
      }

      // Execute tool
      const tool = registryRef.current?.get(toolName)
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`)
      }

      const result = await tool.execute(params)

      // Increment quota on success
      incrementQuota(userId, toolName)

      createAuditEntry({
        userId,
        action: 'execute',
        toolName,
        details: { params },
        success: true
      })

      onToolExecuted?.(toolName, userId)

      return result
    } catch (error) {
      createAuditEntry({
        userId: 'system',
        action: 'execute',
        toolName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }, [config, checkAuth, canAccess, checkQuota, incrementQuota, createAuditEntry, onToolExecuted, onAuthFailure, onQuotaExceeded])

  // Periodic cleanup
  useEffect(() => {
    if (config.auditRetentionDays) {
      const interval = setInterval(() => {
        const removed = cleanupAuditLogs()
        if (removed > 0) {
          console.log(`Cleaned up ${removed} old audit log entries`)
        }
      }, 86400000) // Daily

      return () => clearInterval(interval)
    }
  }, [config.auditRetentionDays, cleanupAuditLogs])

  // Create output interface
  const createOutput = useCallback((): AuthenticatedToolRegistryOutput => {
    const baseOutput = registryRef.current!
    
    return {
      ...baseOutput,
      register: (tool: MCPTool) => handleRegister(tool),
      execute: (toolName: string, params: any) => handleExecute(toolName, params),
      setPermissions,
      getPermissions,
      canAccess,
      setQuota,
      getQuota,
      checkQuota,
      getAuditLogs,
      cleanupAuditLogs
    }
  }, [handleRegister, handleExecute, setPermissions, getPermissions, canAccess, setQuota, getQuota, checkQuota, getAuditLogs, cleanupAuditLogs])

  return (
    <ToolRegistryPrimitive
      config={{
        validateTools: true,
        maxTools: config.maxTools || 1000,
        enableVersioning: true
      }}
      ref={(output: any) => { 
        registryRef.current = output
        // Expose enhanced output
        if (output) {
          Object.assign(output, createOutput())
        }
      }}
    />
  )
}

// Static construct class for registration
export class AuthenticatedToolRegistryConstruct extends L1MCPConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l1-authenticated-tool-registry',
    name: 'Authenticated Tool Registry',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L1,
    description: 'Secure tool registry with authentication, RBAC, quotas, and audit logging',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: [
      'tool-registry',
      'authentication',
      'rbac',
      'quotas',
      'audit-logging',
      'permission-management'
    ],
    dependencies: [
      'platform-l0-tool-registry-primitive'
    ]
  }

  component = AuthenticatedToolRegistry

  async initialize(config: AuthenticatedToolRegistryConfig): Promise<void> {
    // Configure auth if enabled
    if (config.authEnabled) {
      this.configureAuth({
        method: 'jwt',
        publicKey: process.env.MCP_JWT_PUBLIC_KEY
      })
    }

    // Configure monitoring
    this.configureMonitoring({
      enabled: true,
      metrics: ['throughput', 'errors', 'latency']
    })
  }

  async destroy(): Promise<void> {
    console.log('Destroying Authenticated Tool Registry')
  }
}

// Export the construct for registration
export const authenticatedToolRegistry = new AuthenticatedToolRegistryConstruct(AuthenticatedToolRegistryConstruct.metadata)