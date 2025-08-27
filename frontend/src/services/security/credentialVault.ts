/**
 * Credential Vault Service
 * 
 * Secure storage and management of credentials with support for multiple
 * vault backends (local encrypted storage, AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
 */

import { resourceMonitor } from '../external/ResourceMonitor'
import { securityScanner } from '../external/SecurityScanner'

export type VaultProvider = 'local' | 'aws-secrets' | 'azure-keyvault' | 'hashicorp'

export interface VaultConfig {
  provider: VaultProvider
  encryption?: {
    algorithm?: string
    keyDerivation?: 'pbkdf2' | 'scrypt' | 'argon2'
    iterations?: number
  }
  aws?: {
    region?: string
    secretsManagerEndpoint?: string
    kmsKeyId?: string
  }
  azure?: {
    vaultUrl?: string
    tenantId?: string
    clientId?: string
  }
  hashicorp?: {
    address?: string
    namespace?: string
    token?: string
  }
  audit?: {
    enabled?: boolean
    logAccess?: boolean
    logRotation?: boolean
  }
}

export interface Credential {
  id: string
  name: string
  type: 'api-key' | 'password' | 'certificate' | 'token' | 'ssh-key' | 'other'
  value?: string // Only populated when retrieved
  metadata: {
    created: Date
    modified: Date
    lastAccessed?: Date
    expiresAt?: Date
    rotationPolicy?: {
      enabled: boolean
      intervalDays: number
      lastRotated?: Date
    }
    tags?: Record<string, string>
    allowedApps?: string[]
    allowedIPs?: string[]
  }
  encrypted?: boolean
}

export interface VaultAuditLog {
  timestamp: Date
  action: 'create' | 'read' | 'update' | 'delete' | 'rotate' | 'expire'
  credentialId: string
  userId?: string
  appId?: string
  ipAddress?: string
  success: boolean
  error?: string
}

class CredentialVault {
  private config: VaultConfig
  private encryptionKey?: CryptoKey
  private credentials = new Map<string, Credential>()
  private auditLogs: VaultAuditLog[] = []
  private rotationTimers = new Map<string, NodeJS.Timer>()
  
  constructor(config: VaultConfig) {
    this.config = {
      encryption: {
        algorithm: 'AES-GCM',
        keyDerivation: 'pbkdf2',
        iterations: 100000,
        ...config.encryption
      },
      audit: {
        enabled: true,
        logAccess: true,
        logRotation: true,
        ...config.audit
      },
      ...config
    }
    
    this.initialize()
  }
  
  private async initialize(): Promise<void> {
    // Initialize encryption key
    if (this.config.provider === 'local') {
      this.encryptionKey = await this.deriveEncryptionKey()
    }
    
    // Start resource monitoring
    resourceMonitor.startMonitoring(
      'credential-vault',
      async () => ({
        cpu: { usage: 5, cores: 1, throttled: false },
        memory: {
          used: this.credentials.size * 1024, // Rough estimate
          limit: 100 * 1024 * 1024, // 100MB limit
          percentage: (this.credentials.size * 1024) / (100 * 1024 * 1024) * 100
        },
        network: {
          bytesIn: 0,
          bytesOut: 0,
          requestsPerSecond: 0,
          activeConnections: 0
        },
        storage: {
          used: this.credentials.size * 2048, // Rough estimate
          limit: 1024 * 1024 * 1024, // 1GB limit
          operations: { reads: 0, writes: 0 }
        },
        timestamp: new Date()
      }),
      {
        memory: { maxBytes: 100 * 1024 * 1024 }
      }
    )
  }
  
  /**
   * Store a credential securely
   */
  async store(credential: Omit<Credential, 'id' | 'metadata'>): Promise<Credential> {
    // Validate credential
    const validation = await this.validateCredential(credential)
    if (!validation.valid) {
      throw new Error(`Invalid credential: ${validation.errors.join(', ')}`)
    }
    
    // Security scan
    if (credential.value) {
      const scanResult = await securityScanner.scanPluginCode(credential.value)
      if (!scanResult.passed) {
        throw new Error('Credential contains potential security issues')
      }
    }
    
    const id = this.generateCredentialId()
    const now = new Date()
    
    const fullCredential: Credential = {
      id,
      ...credential,
      metadata: {
        created: now,
        modified: now,
        ...credential.metadata
      }
    }
    
    // Encrypt and store based on provider
    switch (this.config.provider) {
      case 'local':
        await this.storeLocal(fullCredential)
        break
      case 'aws-secrets':
        await this.storeAWS(fullCredential)
        break
      case 'azure-keyvault':
        await this.storeAzure(fullCredential)
        break
      case 'hashicorp':
        await this.storeHashiCorp(fullCredential)
        break
    }
    
    // Set up rotation if configured
    if (fullCredential.metadata.rotationPolicy?.enabled) {
      this.scheduleRotation(fullCredential)
    }
    
    // Audit log
    this.audit('create', id, true)
    
    // Return without value for security
    const { value, ...safeCredential } = fullCredential
    return safeCredential as Credential
  }
  
  /**
   * Retrieve a credential
   */
  async retrieve(
    id: string,
    options?: {
      appId?: string
      userId?: string
      ipAddress?: string
    }
  ): Promise<string | null> {
    try {
      const credential = this.credentials.get(id)
      if (!credential) {
        this.audit('read', id, false, 'Credential not found')
        return null
      }
      
      // Check access permissions
      if (!this.checkAccess(credential, options)) {
        this.audit('read', id, false, 'Access denied', options)
        throw new Error('Access denied')
      }
      
      // Check expiration
      if (credential.metadata.expiresAt && credential.metadata.expiresAt < new Date()) {
        this.audit('read', id, false, 'Credential expired')
        throw new Error('Credential has expired')
      }
      
      // Retrieve based on provider
      let value: string | null = null
      
      switch (this.config.provider) {
        case 'local':
          value = await this.retrieveLocal(id)
          break
        case 'aws-secrets':
          value = await this.retrieveAWS(id)
          break
        case 'azure-keyvault':
          value = await this.retrieveAzure(id)
          break
        case 'hashicorp':
          value = await this.retrieveHashiCorp(id)
          break
      }
      
      // Update last accessed
      if (value && credential) {
        credential.metadata.lastAccessed = new Date()
      }
      
      // Audit log
      this.audit('read', id, true, undefined, options)
      
      return value
      
    } catch (error) {
      this.audit('read', id, false, error.message)
      throw error
    }
  }
  
  /**
   * Update a credential
   */
  async update(
    id: string,
    updates: Partial<Omit<Credential, 'id' | 'metadata'>>
  ): Promise<Credential> {
    const existing = this.credentials.get(id)
    if (!existing) {
      throw new Error('Credential not found')
    }
    
    const updated: Credential = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        modified: new Date()
      }
    }
    
    // Re-encrypt and store
    await this.store(updated)
    
    // Audit log
    this.audit('update', id, true)
    
    // Return without value
    const { value, ...safeCredential } = updated
    return safeCredential as Credential
  }
  
  /**
   * Delete a credential
   */
  async delete(id: string): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'local':
          await this.deleteLocal(id)
          break
        case 'aws-secrets':
          await this.deleteAWS(id)
          break
        case 'azure-keyvault':
          await this.deleteAzure(id)
          break
        case 'hashicorp':
          await this.deleteHashiCorp(id)
          break
      }
      
      // Cancel rotation timer
      const timer = this.rotationTimers.get(id)
      if (timer) {
        clearInterval(timer)
        this.rotationTimers.delete(id)
      }
      
      this.credentials.delete(id)
      this.audit('delete', id, true)
      
    } catch (error) {
      this.audit('delete', id, false, error.message)
      throw error
    }
  }
  
  /**
   * Rotate a credential
   */
  async rotate(id: string): Promise<Credential> {
    const credential = this.credentials.get(id)
    if (!credential) {
      throw new Error('Credential not found')
    }
    
    // Generate new value based on type
    const newValue = await this.generateSecureValue(credential.type)
    
    // Update credential
    const rotated = await this.update(id, {
      value: newValue,
      metadata: {
        ...credential.metadata,
        rotationPolicy: credential.metadata.rotationPolicy ? {
          ...credential.metadata.rotationPolicy,
          lastRotated: new Date()
        } : undefined
      }
    })
    
    // Audit log
    this.audit('rotate', id, true)
    
    return rotated
  }
  
  /**
   * List credentials (without values)
   */
  async list(filter?: {
    type?: Credential['type']
    tags?: Record<string, string>
    expiresBefore?: Date
    needsRotation?: boolean
  }): Promise<Credential[]> {
    let credentials = Array.from(this.credentials.values())
    
    if (filter) {
      if (filter.type) {
        credentials = credentials.filter(c => c.type === filter.type)
      }
      
      if (filter.tags) {
        credentials = credentials.filter(c => {
          if (!c.metadata.tags) return false
          return Object.entries(filter.tags!).every(
            ([key, value]) => c.metadata.tags![key] === value
          )
        })
      }
      
      if (filter.expiresBefore) {
        credentials = credentials.filter(c => 
          c.metadata.expiresAt && c.metadata.expiresAt < filter.expiresBefore!
        )
      }
      
      if (filter.needsRotation) {
        const now = new Date()
        credentials = credentials.filter(c => {
          if (!c.metadata.rotationPolicy?.enabled) return false
          if (!c.metadata.rotationPolicy.lastRotated) return true
          
          const daysSinceRotation = Math.floor(
            (now.getTime() - c.metadata.rotationPolicy.lastRotated.getTime()) / 
            (1000 * 60 * 60 * 24)
          )
          
          return daysSinceRotation >= c.metadata.rotationPolicy.intervalDays
        })
      }
    }
    
    // Return without values
    return credentials.map(c => {
      const { value, ...safeCredential } = c
      return safeCredential as Credential
    })
  }
  
  /**
   * Get audit logs
   */
  getAuditLogs(filter?: {
    credentialId?: string
    action?: VaultAuditLog['action']
    startDate?: Date
    endDate?: Date
    success?: boolean
  }): VaultAuditLog[] {
    let logs = [...this.auditLogs]
    
    if (filter) {
      if (filter.credentialId) {
        logs = logs.filter(l => l.credentialId === filter.credentialId)
      }
      if (filter.action) {
        logs = logs.filter(l => l.action === filter.action)
      }
      if (filter.startDate) {
        logs = logs.filter(l => l.timestamp >= filter.startDate!)
      }
      if (filter.endDate) {
        logs = logs.filter(l => l.timestamp <= filter.endDate!)
      }
      if (filter.success !== undefined) {
        logs = logs.filter(l => l.success === filter.success)
      }
    }
    
    return logs
  }
  
  // Private helper methods
  
  private async deriveEncryptionKey(): Promise<CryptoKey> {
    // In production, this would use a proper key derivation
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('master-key'), // Should be from secure source
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('vault-salt'), // Should be random
        iterations: this.config.encryption!.iterations!,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  private async encrypt(data: string): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey!,
      new TextEncoder().encode(data)
    )
    
    return { encrypted, iv }
  }
  
  private async decrypt(encrypted: ArrayBuffer, iv: Uint8Array): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey!,
      encrypted
    )
    
    return new TextDecoder().decode(decrypted)
  }
  
  private generateCredentialId(): string {
    return `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private async validateCredential(credential: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    
    if (!credential.name || credential.name.trim() === '') {
      errors.push('Name is required')
    }
    
    if (!credential.type) {
      errors.push('Type is required')
    }
    
    if (!credential.value || credential.value.trim() === '') {
      errors.push('Value is required')
    }
    
    // Type-specific validation
    if (credential.type === 'api-key' && credential.value) {
      if (credential.value.length < 16) {
        errors.push('API key seems too short')
      }
    }
    
    if (credential.type === 'password' && credential.value) {
      if (credential.value.length < 8) {
        errors.push('Password must be at least 8 characters')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  private checkAccess(
    credential: Credential,
    options?: { appId?: string; userId?: string; ipAddress?: string }
  ): boolean {
    // Check allowed apps
    if (credential.metadata.allowedApps && credential.metadata.allowedApps.length > 0) {
      if (!options?.appId || !credential.metadata.allowedApps.includes(options.appId)) {
        return false
      }
    }
    
    // Check allowed IPs
    if (credential.metadata.allowedIPs && credential.metadata.allowedIPs.length > 0) {
      if (!options?.ipAddress || !credential.metadata.allowedIPs.includes(options.ipAddress)) {
        return false
      }
    }
    
    return true
  }
  
  private scheduleRotation(credential: Credential): void {
    if (!credential.metadata.rotationPolicy?.enabled) return
    
    const intervalMs = credential.metadata.rotationPolicy.intervalDays * 24 * 60 * 60 * 1000
    
    const timer = setInterval(async () => {
      try {
        await this.rotate(credential.id)
      } catch (error) {
        console.error(`Failed to rotate credential ${credential.id}:`, error)
      }
    }, intervalMs)
    
    this.rotationTimers.set(credential.id, timer)
  }
  
  private async generateSecureValue(type: Credential['type']): Promise<string> {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const value = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    
    switch (type) {
      case 'api-key':
        return `sk_${value.substring(0, 32)}`
      case 'password': {
        // Generate readable password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 16; i++) {
          password += chars[Math.floor(Math.random() * chars.length)]
        }
        return password
      }
      case 'token':
        return value
      default:
        return value.substring(0, 64)
    }
  }
  
  private audit(
    action: VaultAuditLog['action'],
    credentialId: string,
    success: boolean,
    error?: string,
    context?: { appId?: string; userId?: string; ipAddress?: string }
  ): void {
    if (!this.config.audit?.enabled) return
    
    const log: VaultAuditLog = {
      timestamp: new Date(),
      action,
      credentialId,
      success,
      error,
      ...context
    }
    
    this.auditLogs.push(log)
    
    // Keep only last 10000 logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000)
    }
  }
  
  // Provider-specific implementations
  
  private async storeLocal(credential: Credential): Promise<void> {
    if (!credential.value) return
    
    const { encrypted, iv } = await this.encrypt(credential.value)
    
    // Store in memory with encryption metadata
    this.credentials.set(credential.id, {
      ...credential,
      value: undefined, // Don't store plaintext
      encrypted: true,
      metadata: {
        ...credential.metadata,
        encryptedData: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv)
      } as any
    })
  }
  
  private async retrieveLocal(id: string): Promise<string | null> {
    const credential = this.credentials.get(id)
    if (!credential || !credential.metadata.encryptedData) return null
    
    const encrypted = new Uint8Array(credential.metadata.encryptedData as any).buffer
    const iv = new Uint8Array(credential.metadata.iv as any)
    
    return this.decrypt(encrypted, iv)
  }
  
  private async deleteLocal(id: string): Promise<void> {
    this.credentials.delete(id)
  }
  
  private async storeAWS(credential: Credential): Promise<void> {
    // AWS Secrets Manager implementation
    console.warn('AWS Secrets Manager not implemented')
    this.credentials.set(credential.id, credential)
  }
  
  private async retrieveAWS(id: string): Promise<string | null> {
    console.warn('AWS Secrets Manager not implemented')
    return this.credentials.get(id)?.value || null
  }
  
  private async deleteAWS(id: string): Promise<void> {
    console.warn('AWS Secrets Manager not implemented')
    this.credentials.delete(id)
  }
  
  private async storeAzure(credential: Credential): Promise<void> {
    // Azure Key Vault implementation
    console.warn('Azure Key Vault not implemented')
    this.credentials.set(credential.id, credential)
  }
  
  private async retrieveAzure(id: string): Promise<string | null> {
    console.warn('Azure Key Vault not implemented')
    return this.credentials.get(id)?.value || null
  }
  
  private async deleteAzure(id: string): Promise<void> {
    console.warn('Azure Key Vault not implemented')
    this.credentials.delete(id)
  }
  
  private async storeHashiCorp(credential: Credential): Promise<void> {
    // HashiCorp Vault implementation
    console.warn('HashiCorp Vault not implemented')
    this.credentials.set(credential.id, credential)
  }
  
  private async retrieveHashiCorp(id: string): Promise<string | null> {
    console.warn('HashiCorp Vault not implemented')
    return this.credentials.get(id)?.value || null
  }
  
  private async deleteHashiCorp(id: string): Promise<void> {
    console.warn('HashiCorp Vault not implemented')
    this.credentials.delete(id)
  }
  
  /**
   * Export vault for backup
   */
  async export(password: string): Promise<string> {
    const exportData = {
      version: '1.0',
      timestamp: new Date(),
      credentials: Array.from(this.credentials.entries()).map(([id, cred]) => ({
        id,
        credential: cred
      })),
      provider: this.config.provider
    }
    
    // Encrypt export with password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('export-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(exportData))
    )
    
    return JSON.stringify({
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    })
  }
  
  /**
   * Import vault from backup
   */
  async import(exportedData: string, password: string): Promise<void> {
    const { encrypted, iv } = JSON.parse(exportedData)
    
    // Decrypt with password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('export-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(encrypted).buffer
    )
    
    const importData = JSON.parse(new TextDecoder().decode(decrypted))
    
    // Clear existing data
    this.credentials.clear()
    
    // Import credentials
    for (const { id, credential } of importData.credentials) {
      this.credentials.set(id, credential)
    }
  }
}

// Export singleton instance
export const credentialVault = new CredentialVault({
  provider: 'local'
})