/**
 * Network Firewall Service
 * 
 * Implements network access control, firewall rules, and traffic monitoring
 * for sandboxed environments and external integrations.
 */

import { resourceMonitor } from '../external/ResourceMonitor'

export interface FirewallRule {
  id: string
  name: string
  enabled: boolean
  priority: number // Lower number = higher priority
  direction: 'inbound' | 'outbound'
  action: 'allow' | 'deny' | 'log'
  conditions: {
    source?: {
      ip?: string | string[]
      port?: number | number[]
      domain?: string | string[]
    }
    destination?: {
      ip?: string | string[]
      port?: number | number[]
      domain?: string | string[]
    }
    protocol?: 'tcp' | 'udp' | 'http' | 'https' | 'websocket' | 'any'
    method?: string[] // For HTTP/HTTPS
    path?: string[] // URL path patterns
    headers?: Record<string, string> // Header requirements
  }
  rateLimit?: {
    requests: number
    window: number // seconds
    action: 'throttle' | 'block'
  }
  metadata?: {
    description?: string
    tags?: string[]
    createdBy?: string
    createdAt?: Date
    expiresAt?: Date
  }
}

export interface NetworkRequest {
  id: string
  timestamp: Date
  direction: 'inbound' | 'outbound'
  protocol: string
  source: {
    ip: string
    port?: number
    domain?: string
  }
  destination: {
    ip: string
    port?: number
    domain?: string
  }
  method?: string
  path?: string
  headers?: Record<string, string>
  size?: number
  duration?: number
}

export interface FirewallLog {
  timestamp: Date
  request: NetworkRequest
  rule?: FirewallRule
  action: 'allowed' | 'denied' | 'throttled'
  reason?: string
}

export interface TrafficStats {
  totalRequests: number
  allowedRequests: number
  deniedRequests: number
  throttledRequests: number
  bytesIn: number
  bytesOut: number
  topSources: Array<{ ip: string; count: number }>
  topDestinations: Array<{ domain: string; count: number }>
  ruleHits: Map<string, number>
}

class NetworkFirewall {
  private rules: Map<string, FirewallRule> = new Map()
  private logs: FirewallLog[] = []
  private rateLimitBuckets: Map<string, { count: number; resetAt: number }> = new Map()
  private blocklist: Set<string> = new Set()
  private allowlist: Set<string> = new Set()
  private stats: TrafficStats = {
    totalRequests: 0,
    allowedRequests: 0,
    deniedRequests: 0,
    throttledRequests: 0,
    bytesIn: 0,
    bytesOut: 0,
    topSources: [],
    topDestinations: [],
    ruleHits: new Map()
  }
  
  constructor() {
    this.initializeDefaultRules()
    this.startMonitoring()
  }
  
  /**
   * Initialize default security rules
   */
  private initializeDefaultRules(): void {
    // Block all external network access by default
    this.addRule({
      id: 'default-deny-external',
      name: 'Deny External Network Access',
      enabled: true,
      priority: 1000,
      direction: 'outbound',
      action: 'deny',
      conditions: {
        destination: {
          ip: ['0.0.0.0/0'], // All external IPs
        },
        protocol: 'any'
      },
      metadata: {
        description: 'Default rule to block all external network access',
        tags: ['security', 'default']
      }
    })
    
    // Allow localhost connections
    this.addRule({
      id: 'allow-localhost',
      name: 'Allow Localhost',
      enabled: true,
      priority: 10,
      direction: 'outbound',
      action: 'allow',
      conditions: {
        destination: {
          ip: ['127.0.0.1', '::1'],
          domain: ['localhost']
        }
      }
    })
    
    // Allow specific CDNs for libraries
    this.addRule({
      id: 'allow-cdns',
      name: 'Allow Trusted CDNs',
      enabled: true,
      priority: 20,
      direction: 'outbound',
      action: 'allow',
      conditions: {
        destination: {
          domain: [
            'unpkg.com',
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
          ]
        },
        protocol: 'https'
      }
    })
    
    // Rate limit all requests
    this.addRule({
      id: 'global-rate-limit',
      name: 'Global Rate Limiting',
      enabled: true,
      priority: 5,
      direction: 'outbound',
      action: 'allow',
      conditions: {
        protocol: 'any'
      },
      rateLimit: {
        requests: 100,
        window: 60, // 100 requests per minute
        action: 'throttle'
      }
    })
    
    // Block dangerous ports
    this.addRule({
      id: 'block-dangerous-ports',
      name: 'Block Dangerous Ports',
      enabled: true,
      priority: 15,
      direction: 'outbound',
      action: 'deny',
      conditions: {
        destination: {
          port: [22, 23, 445, 3389, 5900] // SSH, Telnet, SMB, RDP, VNC
        }
      }
    })
  }
  
  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    resourceMonitor.startMonitoring(
      'network-firewall',
      async () => ({
        cpu: { usage: 2, cores: 1, throttled: false },
        memory: {
          used: (this.logs.length + this.rules.size) * 1024,
          limit: 50 * 1024 * 1024, // 50MB limit
          percentage: ((this.logs.length + this.rules.size) * 1024) / (50 * 1024 * 1024) * 100
        },
        network: {
          bytesIn: this.stats.bytesIn,
          bytesOut: this.stats.bytesOut,
          requestsPerSecond: this.calculateRequestsPerSecond(),
          activeConnections: this.rateLimitBuckets.size
        },
        storage: {
          used: this.logs.length * 512, // Rough estimate
          limit: 100 * 1024 * 1024, // 100MB limit
          operations: { reads: 0, writes: this.logs.length }
        },
        timestamp: new Date()
      })
    )
    
    // Clean up old data periodically
    setInterval(() => this.cleanup(), 60000) // Every minute
  }
  
  /**
   * Check if a network request is allowed
   */
  async checkRequest(request: Omit<NetworkRequest, 'id' | 'timestamp'>): Promise<{
    allowed: boolean
    rule?: FirewallRule
    reason?: string
  }> {
    const fullRequest: NetworkRequest = {
      ...request,
      id: this.generateRequestId(),
      timestamp: new Date()
    }
    
    // Update stats
    this.stats.totalRequests++
    if (request.direction === 'inbound') {
      this.stats.bytesIn += request.size || 0
    } else {
      this.stats.bytesOut += request.size || 0
    }
    
    // Check blocklist first
    if (this.isBlocked(fullRequest)) {
      this.logRequest(fullRequest, undefined, 'denied', 'IP is blocklisted')
      this.stats.deniedRequests++
      return { allowed: false, reason: 'IP is blocklisted' }
    }
    
    // Check allowlist
    if (this.isAllowlisted(fullRequest)) {
      this.logRequest(fullRequest, undefined, 'allowed', 'IP is allowlisted')
      this.stats.allowedRequests++
      return { allowed: true, reason: 'IP is allowlisted' }
    }
    
    // Get sorted rules by priority
    const sortedRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && rule.direction === request.direction)
      .sort((a, b) => a.priority - b.priority)
    
    // Check each rule
    for (const rule of sortedRules) {
      if (this.matchesRule(fullRequest, rule)) {
        // Update rule hit count
        this.stats.ruleHits.set(rule.id, (this.stats.ruleHits.get(rule.id) || 0) + 1)
        
        // Check rate limit
        if (rule.rateLimit) {
          const rateLimitResult = this.checkRateLimit(fullRequest, rule)
          if (!rateLimitResult.allowed) {
            this.logRequest(fullRequest, rule, 'throttled', 'Rate limit exceeded')
            this.stats.throttledRequests++
            return { allowed: false, rule, reason: 'Rate limit exceeded' }
          }
        }
        
        // Apply rule action
        switch (rule.action) {
          case 'allow':
            this.logRequest(fullRequest, rule, 'allowed')
            this.stats.allowedRequests++
            return { allowed: true, rule }
            
          case 'deny':
            this.logRequest(fullRequest, rule, 'denied')
            this.stats.deniedRequests++
            return { allowed: false, rule }
            
          case 'log':
            this.logRequest(fullRequest, rule, 'allowed', 'Logged only')
            // Continue checking other rules
            break
        }
      }
    }
    
    // Default action (should be caught by default-deny rule)
    this.logRequest(fullRequest, undefined, 'denied', 'No matching rule')
    this.stats.deniedRequests++
    return { allowed: false, reason: 'No matching rule' }
  }
  
  /**
   * Add a firewall rule
   */
  addRule(rule: FirewallRule): void {
    this.rules.set(rule.id, {
      ...rule,
      metadata: {
        ...rule.metadata,
        createdAt: rule.metadata?.createdAt || new Date()
      }
    })
  }
  
  /**
   * Remove a firewall rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
  }
  
  /**
   * Update a firewall rule
   */
  updateRule(ruleId: string, updates: Partial<FirewallRule>): void {
    const existing = this.rules.get(ruleId)
    if (existing) {
      this.rules.set(ruleId, { ...existing, ...updates })
    }
  }
  
  /**
   * Get all rules
   */
  getRules(): FirewallRule[] {
    return Array.from(this.rules.values())
  }
  
  /**
   * Add IP to blocklist
   */
  blockIP(ip: string, duration?: number): void {
    this.blocklist.add(ip)
    
    if (duration) {
      setTimeout(() => this.unblockIP(ip), duration * 1000)
    }
  }
  
  /**
   * Remove IP from blocklist
   */
  unblockIP(ip: string): void {
    this.blocklist.delete(ip)
  }
  
  /**
   * Add IP to allowlist
   */
  allowIP(ip: string): void {
    this.allowlist.add(ip)
  }
  
  /**
   * Remove IP from allowlist
   */
  disallowIP(ip: string): void {
    this.allowlist.delete(ip)
  }
  
  /**
   * Get firewall logs
   */
  getLogs(filter?: {
    startTime?: Date
    endTime?: Date
    action?: FirewallLog['action']
    ruleId?: string
    sourceIP?: string
    destinationDomain?: string
  }): FirewallLog[] {
    let logs = [...this.logs]
    
    if (filter) {
      if (filter.startTime) {
        logs = logs.filter(l => l.timestamp >= filter.startTime!)
      }
      if (filter.endTime) {
        logs = logs.filter(l => l.timestamp <= filter.endTime!)
      }
      if (filter.action) {
        logs = logs.filter(l => l.action === filter.action)
      }
      if (filter.ruleId) {
        logs = logs.filter(l => l.rule?.id === filter.ruleId)
      }
      if (filter.sourceIP) {
        logs = logs.filter(l => l.request.source.ip === filter.sourceIP)
      }
      if (filter.destinationDomain) {
        logs = logs.filter(l => l.request.destination.domain === filter.destinationDomain)
      }
    }
    
    return logs
  }
  
  /**
   * Get traffic statistics
   */
  getStats(): TrafficStats {
    // Update top sources and destinations
    const sourceCounts = new Map<string, number>()
    const destCounts = new Map<string, number>()
    
    this.logs.forEach(log => {
      const sourceIP = log.request.source.ip
      const destDomain = log.request.destination.domain || log.request.destination.ip
      
      sourceCounts.set(sourceIP, (sourceCounts.get(sourceIP) || 0) + 1)
      destCounts.set(destDomain, (destCounts.get(destDomain) || 0) + 1)
    })
    
    this.stats.topSources = Array.from(sourceCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    this.stats.topDestinations = Array.from(destCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return { ...this.stats }
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      deniedRequests: 0,
      throttledRequests: 0,
      bytesIn: 0,
      bytesOut: 0,
      topSources: [],
      topDestinations: [],
      ruleHits: new Map()
    }
  }
  
  // Private helper methods
  
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private isBlocked(request: NetworkRequest): boolean {
    return this.blocklist.has(request.source.ip) ||
           (request.destination.ip && this.blocklist.has(request.destination.ip))
  }
  
  private isAllowlisted(request: NetworkRequest): boolean {
    return this.allowlist.has(request.source.ip) ||
           (request.destination.ip && this.allowlist.has(request.destination.ip))
  }
  
  private matchesRule(request: NetworkRequest, rule: FirewallRule): boolean {
    const conditions = rule.conditions
    
    // Check protocol
    if (conditions.protocol && conditions.protocol !== 'any') {
      if (request.protocol !== conditions.protocol) return false
    }
    
    // Check source conditions
    if (conditions.source) {
      if (conditions.source.ip) {
        const ips = Array.isArray(conditions.source.ip) ? conditions.source.ip : [conditions.source.ip]
        if (!this.matchesIP(request.source.ip, ips)) return false
      }
      
      if (conditions.source.port) {
        const ports = Array.isArray(conditions.source.port) ? conditions.source.port : [conditions.source.port]
        if (request.source.port && !ports.includes(request.source.port)) return false
      }
      
      if (conditions.source.domain) {
        const domains = Array.isArray(conditions.source.domain) ? conditions.source.domain : [conditions.source.domain]
        if (!request.source.domain || !this.matchesDomain(request.source.domain, domains)) return false
      }
    }
    
    // Check destination conditions
    if (conditions.destination) {
      if (conditions.destination.ip) {
        const ips = Array.isArray(conditions.destination.ip) ? conditions.destination.ip : [conditions.destination.ip]
        if (!this.matchesIP(request.destination.ip, ips)) return false
      }
      
      if (conditions.destination.port) {
        const ports = Array.isArray(conditions.destination.port) ? conditions.destination.port : [conditions.destination.port]
        if (request.destination.port && !ports.includes(request.destination.port)) return false
      }
      
      if (conditions.destination.domain) {
        const domains = Array.isArray(conditions.destination.domain) ? conditions.destination.domain : [conditions.destination.domain]
        if (!request.destination.domain || !this.matchesDomain(request.destination.domain, domains)) return false
      }
    }
    
    // Check HTTP-specific conditions
    if (conditions.method && request.method) {
      if (!conditions.method.includes(request.method)) return false
    }
    
    if (conditions.path && request.path) {
      const pathMatches = conditions.path.some(pattern => 
        this.matchesPattern(request.path!, pattern)
      )
      if (!pathMatches) return false
    }
    
    if (conditions.headers && request.headers) {
      for (const [key, value] of Object.entries(conditions.headers)) {
        if (request.headers[key] !== value) return false
      }
    }
    
    return true
  }
  
  private matchesIP(ip: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes('/')) {
        // CIDR notation
        return this.matchesCIDR(ip, pattern)
      }
      return ip === pattern
    })
  }
  
  private matchesCIDR(ip: string, cidr: string): boolean {
    // Simplified CIDR matching
    if (cidr === '0.0.0.0/0') {
      // Match all IPs except localhost
      return ip !== '127.0.0.1' && ip !== '::1'
    }
    
    const [network, bits] = cidr.split('/')
    const mask = parseInt(bits)
    
    // Convert IPs to binary
    const ipBinary = this.ipToBinary(ip)
    const networkBinary = this.ipToBinary(network)
    
    // Compare network bits
    return ipBinary.substring(0, mask) === networkBinary.substring(0, mask)
  }
  
  private ipToBinary(ip: string): string {
    return ip.split('.').map(octet => 
      parseInt(octet).toString(2).padStart(8, '0')
    ).join('')
  }
  
  private matchesDomain(domain: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.startsWith('*.')) {
        // Wildcard subdomain
        const baseDomain = pattern.substring(2)
        return domain.endsWith(baseDomain)
      }
      return domain === pattern
    })
  }
  
  private matchesPattern(value: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*') // Replace * with .*
      .replace(/\?/g, '.') // Replace ? with .
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(value)
  }
  
  private checkRateLimit(request: NetworkRequest, rule: FirewallRule): { allowed: boolean } {
    if (!rule.rateLimit) return { allowed: true }
    
    const key = `${rule.id}-${request.source.ip}`
    const now = Date.now()
    const bucket = this.rateLimitBuckets.get(key)
    
    if (!bucket || bucket.resetAt < now) {
      // Create new bucket
      this.rateLimitBuckets.set(key, {
        count: 1,
        resetAt: now + (rule.rateLimit.window * 1000)
      })
      return { allowed: true }
    }
    
    if (bucket.count >= rule.rateLimit.requests) {
      return { allowed: false }
    }
    
    bucket.count++
    return { allowed: true }
  }
  
  private logRequest(
    request: NetworkRequest,
    rule: FirewallRule | undefined,
    action: FirewallLog['action'],
    reason?: string
  ): void {
    const log: FirewallLog = {
      timestamp: new Date(),
      request,
      rule,
      action,
      reason
    }
    
    this.logs.push(log)
    
    // Keep only last 10000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000)
    }
  }
  
  private calculateRequestsPerSecond(): number {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    const recentRequests = this.logs.filter(log => 
      log.timestamp.getTime() > oneMinuteAgo
    ).length
    
    return recentRequests / 60
  }
  
  private cleanup(): void {
    const now = Date.now()
    
    // Clean expired rate limit buckets
    for (const [key, bucket] of this.rateLimitBuckets.entries()) {
      if (bucket.resetAt < now) {
        this.rateLimitBuckets.delete(key)
      }
    }
    
    // Clean expired rules
    for (const [id, rule] of this.rules.entries()) {
      if (rule.metadata?.expiresAt && rule.metadata.expiresAt < new Date()) {
        this.rules.delete(id)
      }
    }
    
    // Clean old logs (keep last 24 hours)
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
    this.logs = this.logs.filter(log => log.timestamp > oneDayAgo)
  }
  
  /**
   * Export firewall configuration
   */
  exportConfig(): string {
    return JSON.stringify({
      rules: Array.from(this.rules.values()),
      blocklist: Array.from(this.blocklist),
      allowlist: Array.from(this.allowlist),
      exportedAt: new Date()
    }, null, 2)
  }
  
  /**
   * Import firewall configuration
   */
  importConfig(config: string): void {
    const data = JSON.parse(config)
    
    // Clear existing rules
    this.rules.clear()
    this.blocklist.clear()
    this.allowlist.clear()
    
    // Import rules
    if (data.rules) {
      data.rules.forEach((rule: FirewallRule) => this.addRule(rule))
    }
    
    // Import blocklist
    if (data.blocklist) {
      data.blocklist.forEach((ip: string) => this.blockIP(ip))
    }
    
    // Import allowlist
    if (data.allowlist) {
      data.allowlist.forEach((ip: string) => this.allowIP(ip))
    }
  }
}

// Export singleton instance
export const networkFirewall = new NetworkFirewall()