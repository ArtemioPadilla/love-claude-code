/**
 * L1 Rate-Limited RPC Implementation
 * 
 * A sophisticated RPC client that implements token bucket rate limiting
 * with support for burst handling, per-user/per-IP tracking, and comprehensive monitoring.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Clock, Users, Globe, AlertTriangle, BarChart,
  Shield, TrendingUp, Activity, Settings, Database,
  CheckCircle, XCircle, Info, RefreshCw, Gauge
} from 'lucide-react'
import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { ConstructRenderProps } from '../../types'
import { rateLimitedRPCDefinition } from './RateLimitedRPC.definition'

// Types for the component
interface TokenBucket {
  capacity: number
  tokens: number
  lastRefill: number
  refillRate: number
  refillInterval: number
}

interface BucketStatus {
  identifier: string
  type: 'user' | 'ip'
  bucket: TokenBucket
  inBurst: boolean
  requestCount: number
  limitedCount: number
  lastRequest: number
  createdAt: number
}

interface RateLimitMetrics {
  totalRequests: number
  limitedRequests: number
  successfulRequests: number
  activeUsers: number
  activeIPs: number
  burstActivations: number
  blacklistHits: number
  averageTokensUsed: number
  peakRequestsPerSecond: number
}

interface RateLimitEvent {
  id: string
  timestamp: Date
  type: 'limited' | 'burst' | 'exhausted' | 'blacklisted' | 'recovered'
  identifier: string
  identifierType: 'user' | 'ip'
  details: any
}

export class RateLimitedRPC extends L1InfrastructureConstruct {
  private buckets: Map<string, BucketStatus> = new Map()
  private whitelist: Set<string> = new Set()
  private blacklist: Map<string, number> = new Map() // identifier -> expiry time
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    limitedRequests: 0,
    successfulRequests: 0,
    activeUsers: 0,
    activeIPs: 0,
    burstActivations: 0,
    blacklistHits: 0,
    averageTokensUsed: 0,
    peakRequestsPerSecond: 0
  }
  private events: RateLimitEvent[] = []
  private cleanupInterval?: NodeJS.Timeout
  private refillInterval?: NodeJS.Timeout
  
  // Configuration
  private bucketConfig: any
  private burstConfig: any
  private trackingConfig: any
  private rateLimitHeaders: any

  constructor(config: any) {
    super(rateLimitedRPCDefinition)
    this.bucketConfig = config.bucketConfig || {
      capacity: 100,
      refillRate: 10,
      refillInterval: 100
    }
    this.burstConfig = config.burstConfig || {
      enabled: true,
      burstCapacity: 150,
      burstRecoveryTime: 60000,
      gracePeriod: 5000
    }
    this.trackingConfig = config.trackingConfig || {
      trackUsers: true,
      trackIPs: true,
      userTTL: 3600000,
      ipTTL: 1800000,
      cleanupInterval: 300000
    }
    this.rateLimitHeaders = config.rateLimitHeaders || {
      enabled: true,
      headerPrefix: 'X-RateLimit',
      includeRetryAfter: true,
      includePolicy: true
    }
  }

  protected async onInitialize(): Promise<void> {
    console.log('Initializing Rate-Limited RPC')
    
    // Start token refill interval
    this.refillInterval = setInterval(() => {
      this.refillTokens()
    }, this.bucketConfig.refillInterval)
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.trackingConfig.cleanupInterval)
    
    // Add demo entries
    this.initializeDemoData()
  }

  protected async onValidate(): Promise<boolean> {
    // Validate configuration
    if (this.bucketConfig.capacity <= 0) {
      console.error('Bucket capacity must be positive')
      return false
    }
    if (this.bucketConfig.refillRate <= 0) {
      console.error('Refill rate must be positive')
      return false
    }
    return true
  }

  protected async onDeploy(): Promise<void> {
    console.log('Deploying Rate-Limited RPC')
  }

  protected async onDestroy(): Promise<void> {
    console.log('Destroying Rate-Limited RPC')
    if (this.refillInterval) clearInterval(this.refillInterval)
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)
  }

  private initializeDemoData(): void {
    // Add some demo bucket statuses
    const demoUser: BucketStatus = {
      identifier: 'user-123',
      type: 'user',
      bucket: {
        capacity: this.bucketConfig.capacity,
        tokens: 75,
        lastRefill: Date.now(),
        refillRate: this.bucketConfig.refillRate,
        refillInterval: this.bucketConfig.refillInterval
      },
      inBurst: false,
      requestCount: 125,
      limitedCount: 5,
      lastRequest: Date.now() - 30000,
      createdAt: Date.now() - 3600000
    }
    
    const demoIP: BucketStatus = {
      identifier: '192.168.1.100',
      type: 'ip',
      bucket: {
        capacity: this.bucketConfig.capacity,
        tokens: 10,
        lastRefill: Date.now(),
        refillRate: this.bucketConfig.refillRate,
        refillInterval: this.bucketConfig.refillInterval
      },
      inBurst: true,
      requestCount: 450,
      limitedCount: 50,
      lastRequest: Date.now() - 5000,
      createdAt: Date.now() - 1800000
    }
    
    this.buckets.set('user-123', demoUser)
    this.buckets.set('192.168.1.100', demoIP)
    
    // Add to whitelist
    this.whitelist.add('premium-user-456')
    
    // Update metrics
    this.updateMetrics()
  }

  async call(request: any): Promise<any> {
    const identifier = this.getIdentifier(request)
    
    // Check blacklist
    if (this.isBlacklisted(identifier)) {
      this.metrics.blacklistHits++
      this.logEvent('blacklisted', identifier, request.userId ? 'user' : 'ip', {
        remainingTime: this.blacklist.get(identifier)! - Date.now()
      })
      throw new Error('BLACKLISTED')
    }
    
    // Check whitelist
    if (this.whitelist.has(identifier)) {
      this.metrics.successfulRequests++
      this.metrics.totalRequests++
      return this.executeRPC(request)
    }
    
    // Get or create bucket
    const bucketStatus = this.getOrCreateBucket(identifier, request.userId ? 'user' : 'ip')
    
    // Check rate limit
    const allowed = this.consumeToken(bucketStatus)
    
    if (!allowed) {
      this.metrics.limitedRequests++
      this.metrics.totalRequests++
      this.logEvent('limited', identifier, bucketStatus.type, {
        availableTokens: bucketStatus.bucket.tokens,
        capacity: bucketStatus.bucket.capacity
      })
      
      const retryAfter = this.calculateRetryAfter(bucketStatus)
      const error: any = new Error('RATE_LIMIT_EXCEEDED')
      error.code = 'RATE_LIMIT_EXCEEDED'
      error.retryAfter = retryAfter
      throw error
    }
    
    // Execute request
    this.metrics.successfulRequests++
    this.metrics.totalRequests++
    bucketStatus.requestCount++
    bucketStatus.lastRequest = Date.now()
    
    const response = await this.executeRPC(request)
    
    // Add rate limit headers if enabled
    if (this.rateLimitHeaders.enabled && response.headers) {
      this.addRateLimitHeaders(response.headers, bucketStatus)
    }
    
    return response
  }

  private getIdentifier(request: any): string {
    if (request.userId && this.trackingConfig.trackUsers) {
      return request.userId
    }
    if (request.clientIP && this.trackingConfig.trackIPs) {
      return request.clientIP
    }
    return 'anonymous'
  }

  private isBlacklisted(identifier: string): boolean {
    const expiry = this.blacklist.get(identifier)
    if (!expiry) return false
    
    if (Date.now() > expiry) {
      this.blacklist.delete(identifier)
      return false
    }
    
    return true
  }

  private getOrCreateBucket(identifier: string, type: 'user' | 'ip'): BucketStatus {
    let bucketStatus = this.buckets.get(identifier)
    
    if (!bucketStatus) {
      bucketStatus = {
        identifier,
        type,
        bucket: {
          capacity: this.bucketConfig.capacity,
          tokens: this.bucketConfig.capacity,
          lastRefill: Date.now(),
          refillRate: this.bucketConfig.refillRate,
          refillInterval: this.bucketConfig.refillInterval
        },
        inBurst: false,
        requestCount: 0,
        limitedCount: 0,
        lastRequest: Date.now(),
        createdAt: Date.now()
      }
      this.buckets.set(identifier, bucketStatus)
      this.updateMetrics()
    }
    
    return bucketStatus
  }

  private consumeToken(bucketStatus: BucketStatus): boolean {
    const bucket = bucketStatus.bucket
    
    // Check if we have tokens
    if (bucket.tokens >= 1) {
      bucket.tokens--
      return true
    }
    
    // Check burst capacity
    if (this.burstConfig.enabled && !bucketStatus.inBurst) {
      const burstTokens = this.burstConfig.burstCapacity - this.bucketConfig.capacity
      if (burstTokens > 0) {
        bucketStatus.inBurst = true
        bucket.capacity = this.burstConfig.burstCapacity
        bucket.tokens = burstTokens - 1
        this.metrics.burstActivations++
        this.logEvent('burst', bucketStatus.identifier, bucketStatus.type, {
          burstCapacity: this.burstConfig.burstCapacity
        })
        return true
      }
    }
    
    // Check grace period
    if (this.burstConfig.gracePeriod > 0) {
      const timeSinceLastRequest = Date.now() - bucketStatus.lastRequest
      if (timeSinceLastRequest > this.burstConfig.gracePeriod) {
        // Grant one token for grace period
        bucket.tokens = 0
        return true
      }
    }
    
    // No tokens available
    bucketStatus.limitedCount++
    if (bucket.tokens === 0) {
      this.logEvent('exhausted', bucketStatus.identifier, bucketStatus.type, {
        nextRefill: bucket.lastRefill + this.bucketConfig.refillInterval
      })
    }
    
    return false
  }

  private refillTokens(): void {
    const now = Date.now()
    
    this.buckets.forEach((bucketStatus) => {
      const bucket = bucketStatus.bucket
      const timeSinceRefill = now - bucket.lastRefill
      const intervalsElapsed = Math.floor(timeSinceRefill / bucket.refillInterval)
      
      if (intervalsElapsed > 0) {
        const tokensToAdd = intervalsElapsed * bucket.refillRate
        const previousTokens = bucket.tokens
        
        // Handle burst recovery
        if (bucketStatus.inBurst && timeSinceRefill > this.burstConfig.burstRecoveryTime) {
          bucketStatus.inBurst = false
          bucket.capacity = this.bucketConfig.capacity
          bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucket.capacity)
          this.logEvent('recovered', bucketStatus.identifier, bucketStatus.type, {
            normalCapacity: this.bucketConfig.capacity
          })
        } else {
          bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucket.capacity)
        }
        
        bucket.lastRefill = now
        
        // Log recovery if went from 0 to positive tokens
        if (previousTokens === 0 && bucket.tokens > 0) {
          this.logEvent('recovered', bucketStatus.identifier, bucketStatus.type, {
            tokensRestored: bucket.tokens
          })
        }
      }
    })
  }

  private cleanup(): void {
    const now = Date.now()
    const userTTL = this.trackingConfig.userTTL
    const ipTTL = this.trackingConfig.ipTTL
    
    // Clean up expired buckets
    const toDelete: string[] = []
    this.buckets.forEach((bucketStatus, identifier) => {
      const ttl = bucketStatus.type === 'user' ? userTTL : ipTTL
      if (now - bucketStatus.lastRequest > ttl) {
        toDelete.push(identifier)
      }
    })
    
    toDelete.forEach(identifier => this.buckets.delete(identifier))
    
    // Clean up expired blacklist entries
    const blacklistToDelete: string[] = []
    this.blacklist.forEach((expiry, identifier) => {
      if (now > expiry) {
        blacklistToDelete.push(identifier)
      }
    })
    
    blacklistToDelete.forEach(identifier => this.blacklist.delete(identifier))
    
    // Clean up old events (keep last 100)
    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }
    
    this.updateMetrics()
  }

  private calculateRetryAfter(bucketStatus: BucketStatus): number {
    const bucket = bucketStatus.bucket
    const tokensNeeded = 1 - bucket.tokens
    const refillsNeeded = Math.ceil(tokensNeeded / bucket.refillRate)
    return refillsNeeded * (bucket.refillInterval / 1000) // Convert to seconds
  }

  private addRateLimitHeaders(headers: any, bucketStatus: BucketStatus): void {
    const prefix = this.rateLimitHeaders.headerPrefix
    const bucket = bucketStatus.bucket
    
    headers[`${prefix}-Limit`] = bucket.capacity
    headers[`${prefix}-Remaining`] = Math.max(0, bucket.tokens)
    headers[`${prefix}-Reset`] = Math.floor((bucket.lastRefill + bucket.refillInterval) / 1000)
    
    if (this.rateLimitHeaders.includeRetryAfter && bucket.tokens <= 0) {
      headers['Retry-After'] = this.calculateRetryAfter(bucketStatus)
    }
    
    if (this.rateLimitHeaders.includePolicy) {
      headers[`${prefix}-Policy`] = `${bucket.capacity};w=${bucket.refillInterval / 1000};r=${bucket.refillRate}`
    }
  }

  private async executeRPC(request: any): Promise<any> {
    // Simulate RPC execution
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    return {
      result: 'success',
      data: { processed: true },
      headers: {}
    }
  }

  private logEvent(
    type: RateLimitEvent['type'], 
    identifier: string, 
    identifierType: 'user' | 'ip',
    details: any
  ): void {
    this.events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      identifier,
      identifierType,
      details
    })
  }

  private updateMetrics(): void {
    const userBuckets = Array.from(this.buckets.values()).filter(b => b.type === 'user')
    const ipBuckets = Array.from(this.buckets.values()).filter(b => b.type === 'ip')
    
    this.metrics.activeUsers = userBuckets.length
    this.metrics.activeIPs = ipBuckets.length
    
    // Calculate average tokens used
    const allBuckets = Array.from(this.buckets.values())
    if (allBuckets.length > 0) {
      const totalTokensUsed = allBuckets.reduce((sum, b) => 
        sum + (b.bucket.capacity - b.bucket.tokens), 0
      )
      this.metrics.averageTokensUsed = totalTokensUsed / allBuckets.length
    }
  }

  // Public methods
  addWhitelist(identifier: string, _type: 'user' | 'ip'): void {
    this.whitelist.add(identifier)
  }

  removeWhitelist(identifier: string): void {
    this.whitelist.delete(identifier)
  }

  addBlacklist(identifier: string, duration?: number): void {
    const expiry = Date.now() + (duration || 3600000) // Default 1 hour
    this.blacklist.set(identifier, expiry)
  }

  getBucketStatus(identifier: string): any {
    const bucketStatus = this.buckets.get(identifier)
    if (!bucketStatus) return null
    
    return {
      identifier: bucketStatus.identifier,
      type: bucketStatus.type,
      availableTokens: bucketStatus.bucket.tokens,
      capacity: bucketStatus.bucket.capacity,
      inBurst: bucketStatus.inBurst,
      requestCount: bucketStatus.requestCount,
      limitedCount: bucketStatus.limitedCount,
      isWhitelisted: this.whitelist.has(identifier),
      isBlacklisted: this.isBlacklisted(identifier)
    }
  }

  getMetrics(): RateLimitMetrics {
    return { ...this.metrics }
  }

  getEvents(): RateLimitEvent[] {
    return [...this.events]
  }

  getBuckets(): BucketStatus[] {
    return Array.from(this.buckets.values())
  }

  getWhitelist(): string[] {
    return Array.from(this.whitelist)
  }

  getBlacklist(): Array<{ identifier: string; expiresAt: Date }> {
    return Array.from(this.blacklist.entries()).map(([identifier, expiry]) => ({
      identifier,
      expiresAt: new Date(expiry)
    }))
  }
}

/**
 * React component for rendering the Rate-Limited RPC
 */
export const RateLimitedRPCComponent: React.FC<ConstructRenderProps> = ({ 
  instance: _instance,
  onInteraction 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'buckets' | 'events' | 'config'>('overview')
  const [metrics, setMetrics] = useState<RateLimitMetrics>({
    totalRequests: 0,
    limitedRequests: 0,
    successfulRequests: 0,
    activeUsers: 2,
    activeIPs: 1,
    burstActivations: 0,
    blacklistHits: 0,
    averageTokensUsed: 25,
    peakRequestsPerSecond: 0
  })
  const [buckets, setBuckets] = useState<BucketStatus[]>([])
  const [events, setEvents] = useState<RateLimitEvent[]>([])
  const [selectedBucket, setSelectedBucket] = useState<BucketStatus | null>(null)
  const [requestsPerSecond, setRequestsPerSecond] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Simulate RPC activity
  useEffect(() => {
    // Initialize with demo data
    const rpc = new RateLimitedRPC({
      bucketConfig: { capacity: 100, refillRate: 10, refillInterval: 100 }
    })
    
    setBuckets(rpc.getBuckets())
    setEvents(rpc.getEvents())
    
    // Simulate activity
    intervalRef.current = setInterval(() => {
      // Simulate requests
      const requestCount = Math.floor(Math.random() * 15)
      setRequestsPerSecond(requestCount)
      
      setMetrics(prev => {
        const limited = Math.floor(Math.random() * 3)
        return {
          ...prev,
          totalRequests: prev.totalRequests + requestCount,
          limitedRequests: prev.limitedRequests + limited,
          successfulRequests: prev.successfulRequests + (requestCount - limited),
          burstActivations: prev.burstActivations + (Math.random() > 0.9 ? 1 : 0),
          blacklistHits: prev.blacklistHits + (Math.random() > 0.95 ? 1 : 0),
          averageTokensUsed: Math.max(0, Math.min(100, prev.averageTokensUsed + (Math.random() - 0.5) * 10)),
          peakRequestsPerSecond: Math.max(prev.peakRequestsPerSecond, requestCount)
        }
      })
      
      // Update bucket tokens
      setBuckets(prev => prev.map(bucket => ({
        ...bucket,
        bucket: {
          ...bucket.bucket,
          tokens: Math.max(0, Math.min(
            bucket.bucket.capacity,
            bucket.bucket.tokens + (Math.random() > 0.5 ? bucket.bucket.refillRate : -5)
          ))
        },
        requestCount: bucket.requestCount + Math.floor(Math.random() * 5),
        limitedCount: bucket.limitedCount + (bucket.bucket.tokens < 10 ? 1 : 0)
      })))
      
      // Occasionally add events
      if (Math.random() > 0.7) {
        const eventTypes: RateLimitEvent['type'][] = ['limited', 'burst', 'exhausted', 'recovered']
        const bucket = buckets[Math.floor(Math.random() * buckets.length)]
        if (bucket) {
          const newEvent: RateLimitEvent = {
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            identifier: bucket.identifier,
            identifierType: bucket.type,
            details: { tokens: bucket.bucket.tokens }
          }
          setEvents(prev => [newEvent, ...prev].slice(0, 20))
        }
      }
    }, 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleBucketClick = useCallback((bucket: BucketStatus) => {
    setSelectedBucket(bucket)
    onInteraction?.('selectBucket', { identifier: bucket.identifier })
  }, [onInteraction])

  const handleResetBucket = useCallback((identifier: string) => {
    setBuckets(prev => prev.map(b => 
      b.identifier === identifier 
        ? { ...b, bucket: { ...b.bucket, tokens: b.bucket.capacity } }
        : b
    ))
    onInteraction?.('resetBucket', { identifier })
  }, [onInteraction])

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Rate-Limited RPC</h3>
            <p className="text-sm text-gray-400">
              Token bucket rate limiting with burst support
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {requestsPerSecond} req/s
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        {(['overview', 'buckets', 'events', 'config'] as const).map((tab) => (
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
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={<Activity className="w-4 h-4" />}
                label="Total Requests"
                value={metrics.totalRequests.toLocaleString()}
                color="blue"
              />
              <MetricCard
                icon={<XCircle className="w-4 h-4" />}
                label="Rate Limited"
                value={metrics.limitedRequests.toLocaleString()}
                color="red"
              />
              <MetricCard
                icon={<CheckCircle className="w-4 h-4" />}
                label="Success Rate"
                value={`${((metrics.successfulRequests / Math.max(1, metrics.totalRequests)) * 100).toFixed(1)}%`}
                color="green"
              />
              <MetricCard
                icon={<Gauge className="w-4 h-4" />}
                label="Avg Tokens Used"
                value={metrics.averageTokensUsed.toFixed(0)}
                color="purple"
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Active Tracking"
                items={[
                  { label: 'Users', value: metrics.activeUsers, icon: <Users className="w-4 h-4" /> },
                  { label: 'IPs', value: metrics.activeIPs, icon: <Globe className="w-4 h-4" /> }
                ]}
              />
              <StatCard
                title="Rate Limit Events"
                items={[
                  { label: 'Burst Activations', value: metrics.burstActivations, icon: <TrendingUp className="w-4 h-4" /> },
                  { label: 'Blacklist Hits', value: metrics.blacklistHits, icon: <Shield className="w-4 h-4" /> }
                ]}
              />
              <StatCard
                title="Performance"
                items={[
                  { label: 'Peak req/s', value: metrics.peakRequestsPerSecond, icon: <Zap className="w-4 h-4" /> },
                  { label: 'Limited %', value: `${((metrics.limitedRequests / Math.max(1, metrics.totalRequests)) * 100).toFixed(1)}%`, icon: <AlertTriangle className="w-4 h-4" /> }
                ]}
              />
            </div>

            {/* Token Usage Visualization */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h5 className="font-medium mb-3">Token Usage Distribution</h5>
              <div className="space-y-3">
                {buckets.map(bucket => (
                  <div key={bucket.identifier} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{bucket.identifier}</span>
                      <span>{bucket.bucket.tokens}/{bucket.bucket.capacity} tokens</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          bucket.bucket.tokens < 20 ? 'bg-red-500' :
                          bucket.bucket.tokens < 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(bucket.bucket.tokens / bucket.bucket.capacity) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'buckets' && (
          <motion.div
            key="buckets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Bucket List */}
            <div className="space-y-2">
              {buckets.map(bucket => (
                <BucketCard
                  key={bucket.identifier}
                  bucket={bucket}
                  onClick={() => handleBucketClick(bucket)}
                  isSelected={selectedBucket?.identifier === bucket.identifier}
                />
              ))}
            </div>

            {/* Bucket Details */}
            {selectedBucket && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="font-medium">{selectedBucket.identifier}</h5>
                    <span className="text-sm text-gray-400">Type: {selectedBucket.type}</span>
                  </div>
                  <button
                    onClick={() => handleResetBucket(selectedBucket.identifier)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Bucket
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Available Tokens:</span>
                    <span className="ml-2 font-mono">{selectedBucket.bucket.tokens}/{selectedBucket.bucket.capacity}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Refill Rate:</span>
                    <span className="ml-2">{selectedBucket.bucket.refillRate} tokens/s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Requests:</span>
                    <span className="ml-2">{selectedBucket.requestCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Limited Requests:</span>
                    <span className="ml-2 text-red-400">{selectedBucket.limitedCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">In Burst Mode:</span>
                    <span className="ml-2">
                      {selectedBucket.inBurst ? (
                        <span className="text-yellow-500">Yes</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2">{formatTimeAgo(new Date(selectedBucket.createdAt))}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Event List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No rate limit events yet
                </div>
              ) : (
                events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Configuration Sections */}
            <ConfigSection
              title="Token Bucket Configuration"
              icon={<Database className="w-4 h-4" />}
              items={[
                { label: 'Bucket Capacity', value: '100 tokens' },
                { label: 'Refill Rate', value: '10 tokens/second' },
                { label: 'Refill Interval', value: '100ms' }
              ]}
            />
            
            <ConfigSection
              title="Burst Configuration"
              icon={<TrendingUp className="w-4 h-4" />}
              items={[
                { label: 'Burst Enabled', value: 'Yes', highlight: true },
                { label: 'Burst Capacity', value: '150 tokens' },
                { label: 'Recovery Time', value: '60 seconds' },
                { label: 'Grace Period', value: '5 seconds' }
              ]}
            />
            
            <ConfigSection
              title="Tracking Configuration"
              icon={<Users className="w-4 h-4" />}
              items={[
                { label: 'Track Users', value: 'Enabled', highlight: true },
                { label: 'Track IPs', value: 'Enabled', highlight: true },
                { label: 'User TTL', value: '1 hour' },
                { label: 'IP TTL', value: '30 minutes' }
              ]}
            />
            
            <ConfigSection
              title="Rate Limit Headers"
              icon={<Settings className="w-4 h-4" />}
              items={[
                { label: 'Headers Enabled', value: 'Yes', highlight: true },
                { label: 'Header Prefix', value: 'X-RateLimit' },
                { label: 'Include Retry-After', value: 'Yes' },
                { label: 'Include Policy', value: 'Yes' }
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
  color: 'green' | 'blue' | 'purple' | 'red'
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    green: 'text-green-500 bg-green-500/20',
    blue: 'text-blue-500 bg-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/20',
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
 * Stat Card Component
 */
const StatCard: React.FC<{
  title: string
  items: Array<{ label: string; value: string | number; icon: React.ReactNode }>
}> = ({ title, items }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <h5 className="font-medium mb-3">{title}</h5>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {item.icon}
            <span>{item.label}</span>
          </div>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
)

/**
 * Bucket Card Component
 */
const BucketCard: React.FC<{
  bucket: BucketStatus
  onClick: () => void
  isSelected: boolean
}> = ({ bucket, onClick, isSelected }) => {
  const tokenPercentage = (bucket.bucket.tokens / bucket.bucket.capacity) * 100
  const statusColor = tokenPercentage < 20 ? 'red' : tokenPercentage < 50 ? 'yellow' : 'green'
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-gray-700 border border-blue-500' : 'bg-gray-800/50 hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${statusColor}-500/20`}>
            {bucket.type === 'user' ? (
              <Users className={`w-4 h-4 text-${statusColor}-500`} />
            ) : (
              <Globe className={`w-4 h-4 text-${statusColor}-500`} />
            )}
          </div>
          <div>
            <div className="font-medium">{bucket.identifier}</div>
            <div className="text-sm text-gray-400">{bucket.type}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{bucket.bucket.tokens}</div>
          <div className="text-xs text-gray-400">tokens</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>Requests: {bucket.requestCount}</span>
        <span>Limited: {bucket.limitedCount}</span>
        {bucket.inBurst && (
          <span className="text-yellow-500">BURST</span>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Event Card Component
 */
const EventCard: React.FC<{ event: RateLimitEvent }> = ({ event }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'limited': return <XCircle className="w-4 h-4" />
      case 'burst': return <TrendingUp className="w-4 h-4" />
      case 'exhausted': return <AlertTriangle className="w-4 h-4" />
      case 'blacklisted': return <Shield className="w-4 h-4" />
      case 'recovered': return <CheckCircle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getEventColor = () => {
    switch (event.type) {
      case 'limited': return 'text-red-500 bg-red-500/20'
      case 'burst': return 'text-yellow-500 bg-yellow-500/20'
      case 'exhausted': return 'text-orange-500 bg-orange-500/20'
      case 'blacklisted': return 'text-purple-500 bg-purple-500/20'
      case 'recovered': return 'text-green-500 bg-green-500/20'
      default: return 'text-gray-500 bg-gray-500/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getEventColor()}`}>
          {getEventIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium capitalize">{event.type}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-sm text-gray-400">{event.identifier}</span>
              <span className="text-xs text-gray-500 ml-2">({event.identifierType})</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(event.timestamp)}
            </span>
          </div>
          {event.details && (
            <div className="mt-1 text-xs text-gray-500">
              {JSON.stringify(event.details)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Config Section Component
 */
const ConfigSection: React.FC<{
  title: string
  icon: React.ReactNode
  items: Array<{ label: string; value: string; highlight?: boolean }>
}> = ({ title, icon, items }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-gray-700 rounded">
        {icon}
      </div>
      <h5 className="font-medium">{title}</h5>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{item.label}</span>
          <span className={`text-sm font-mono ${
            item.highlight ? 'text-green-500' : 'text-gray-300'
          }`}>
            {item.value}
          </span>
        </div>
      ))}
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
export default RateLimitedRPCComponent

// Re-export the definition from the definition file
export { rateLimitedRPCDefinition } from './RateLimitedRPC.definition'