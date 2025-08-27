/**
 * Resource Monitor Service
 * 
 * Monitors and manages resource usage of external integrations including
 * CPU, memory, network, and storage consumption.
 */

export interface ResourceMetrics {
  cpu: {
    usage: number // Percentage 0-100
    cores: number
    throttled: boolean
  }
  memory: {
    used: number // Bytes
    limit: number // Bytes
    percentage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    requestsPerSecond: number
    activeConnections: number
  }
  storage: {
    used: number // Bytes
    limit: number // Bytes
    operations: {
      reads: number
      writes: number
    }
  }
  timestamp: Date
}

export interface ResourceLimits {
  cpu?: {
    cores?: number
    percentage?: number
  }
  memory?: {
    maxBytes?: number
  }
  network?: {
    maxBandwidth?: number // Bytes per second
    maxConnections?: number
    maxRequestsPerSecond?: number
  }
  storage?: {
    maxBytes?: number
    maxOperationsPerSecond?: number
  }
}

export interface ResourceAlert {
  id: string
  type: 'cpu' | 'memory' | 'network' | 'storage'
  severity: 'warning' | 'critical'
  message: string
  threshold: number
  current: number
  timestamp: Date
}

export interface ResourceUsageHistory {
  resourceId: string
  metrics: ResourceMetrics[]
  alerts: ResourceAlert[]
  startTime: Date
  endTime?: Date
}

export class ResourceMonitor {
  private monitors: Map<string, NodeJS.Timer> = new Map()
  private metrics: Map<string, ResourceMetrics[]> = new Map()
  private limits: Map<string, ResourceLimits> = new Map()
  private alerts: Map<string, ResourceAlert[]> = new Map()
  private alertHandlers: ((alert: ResourceAlert) => void)[] = []
  
  constructor(private config: {
    retentionPeriod?: number // How long to keep metrics (ms)
    samplingInterval?: number // How often to sample (ms)
    alertThresholds?: {
      cpu?: number // Alert when CPU > threshold
      memory?: number // Alert when memory > threshold
      network?: number // Alert when bandwidth > threshold
      storage?: number // Alert when storage > threshold
    }
  } = {}) {
    this.config.retentionPeriod = config.retentionPeriod || 3600000 // 1 hour
    this.config.samplingInterval = config.samplingInterval || 5000 // 5 seconds
    this.config.alertThresholds = {
      cpu: 80,
      memory: 90,
      network: 80,
      storage: 95,
      ...config.alertThresholds
    }
  }
  
  /**
   * Start monitoring a resource
   */
  startMonitoring(
    resourceId: string,
    collector: () => Promise<ResourceMetrics>,
    limits?: ResourceLimits
  ): void {
    if (this.monitors.has(resourceId)) {
      console.warn(`Already monitoring resource: ${resourceId}`)
      return
    }
    
    // Set limits if provided
    if (limits) {
      this.limits.set(resourceId, limits)
    }
    
    // Initialize storage
    this.metrics.set(resourceId, [])
    this.alerts.set(resourceId, [])
    
    // Start collection
    const interval = setInterval(async () => {
      try {
        const metrics = await collector()
        this.recordMetrics(resourceId, metrics)
        this.checkLimits(resourceId, metrics)
        this.cleanupOldData(resourceId)
      } catch (error) {
        console.error(`Failed to collect metrics for ${resourceId}:`, error)
      }
    }, this.config.samplingInterval)
    
    this.monitors.set(resourceId, interval)
  }
  
  /**
   * Stop monitoring a resource
   */
  stopMonitoring(resourceId: string): void {
    const interval = this.monitors.get(resourceId)
    if (interval) {
      clearInterval(interval)
      this.monitors.delete(resourceId)
    }
  }
  
  /**
   * Record metrics
   */
  private recordMetrics(resourceId: string, metrics: ResourceMetrics): void {
    const history = this.metrics.get(resourceId) || []
    history.push(metrics)
    
    // Keep only recent data
    const cutoff = Date.now() - this.config.retentionPeriod!
    const filtered = history.filter(m => m.timestamp.getTime() > cutoff)
    this.metrics.set(resourceId, filtered)
  }
  
  /**
   * Check resource limits and generate alerts
   */
  private checkLimits(resourceId: string, metrics: ResourceMetrics): void {
    const limits = this.limits.get(resourceId)
    const alerts: ResourceAlert[] = []
    
    // Check CPU
    if (metrics.cpu.usage > this.config.alertThresholds!.cpu!) {
      alerts.push(this.createAlert(
        resourceId,
        'cpu',
        metrics.cpu.usage > 95 ? 'critical' : 'warning',
        `CPU usage at ${metrics.cpu.usage.toFixed(1)}%`,
        this.config.alertThresholds!.cpu!,
        metrics.cpu.usage
      ))
    }
    
    if (limits?.cpu?.percentage && metrics.cpu.usage > limits.cpu.percentage) {
      // Enforce CPU limit
      this.enforceCPULimit(resourceId, limits.cpu.percentage)
    }
    
    // Check Memory
    const memoryPercentage = (metrics.memory.used / metrics.memory.limit) * 100
    if (memoryPercentage > this.config.alertThresholds!.memory!) {
      alerts.push(this.createAlert(
        resourceId,
        'memory',
        memoryPercentage > 95 ? 'critical' : 'warning',
        `Memory usage at ${memoryPercentage.toFixed(1)}%`,
        this.config.alertThresholds!.memory!,
        memoryPercentage
      ))
    }
    
    if (limits?.memory?.maxBytes && metrics.memory.used > limits.memory.maxBytes) {
      // Enforce memory limit
      this.enforceMemoryLimit(resourceId, limits.memory.maxBytes)
    }
    
    // Check Network
    if (limits?.network) {
      if (limits.network.maxConnections && 
          metrics.network.activeConnections > limits.network.maxConnections) {
        alerts.push(this.createAlert(
          resourceId,
          'network',
          'warning',
          `Active connections (${metrics.network.activeConnections}) exceed limit`,
          limits.network.maxConnections,
          metrics.network.activeConnections
        ))
      }
      
      if (limits.network.maxRequestsPerSecond && 
          metrics.network.requestsPerSecond > limits.network.maxRequestsPerSecond) {
        // Enforce rate limit
        this.enforceRateLimit(resourceId, limits.network.maxRequestsPerSecond)
      }
    }
    
    // Check Storage
    const storagePercentage = (metrics.storage.used / metrics.storage.limit) * 100
    if (storagePercentage > this.config.alertThresholds!.storage!) {
      alerts.push(this.createAlert(
        resourceId,
        'storage',
        storagePercentage > 98 ? 'critical' : 'warning',
        `Storage usage at ${storagePercentage.toFixed(1)}%`,
        this.config.alertThresholds!.storage!,
        storagePercentage
      ))
    }
    
    // Record and notify alerts
    if (alerts.length > 0) {
      const resourceAlerts = this.alerts.get(resourceId) || []
      resourceAlerts.push(...alerts)
      this.alerts.set(resourceId, resourceAlerts)
      
      // Notify handlers
      for (const alert of alerts) {
        this.notifyAlert(alert)
      }
    }
  }
  
  /**
   * Create alert
   */
  private createAlert(
    resourceId: string,
    type: ResourceAlert['type'],
    severity: ResourceAlert['severity'],
    message: string,
    threshold: number,
    current: number
  ): ResourceAlert {
    return {
      id: `${resourceId}-${type}-${Date.now()}`,
      type,
      severity,
      message,
      threshold,
      current,
      timestamp: new Date()
    }
  }
  
  /**
   * Notify alert handlers
   */
  private notifyAlert(alert: ResourceAlert): void {
    for (const handler of this.alertHandlers) {
      try {
        handler(alert)
      } catch (error) {
        console.error('Alert handler error:', error)
      }
    }
  }
  
  /**
   * Enforce CPU limit
   */
  private enforceCPULimit(resourceId: string, limit: number): void {
    console.warn(`Enforcing CPU limit for ${resourceId}: ${limit}%`)
    // In real implementation, would use cgroups or similar
  }
  
  /**
   * Enforce memory limit
   */
  private enforceMemoryLimit(resourceId: string, limit: number): void {
    console.warn(`Enforcing memory limit for ${resourceId}: ${limit} bytes`)
    // In real implementation, would use memory cgroups
  }
  
  /**
   * Enforce rate limit
   */
  private enforceRateLimit(resourceId: string, limit: number): void {
    console.warn(`Enforcing rate limit for ${resourceId}: ${limit} req/s`)
    // In real implementation, would use token bucket or similar
  }
  
  /**
   * Clean up old data
   */
  private cleanupOldData(resourceId: string): void {
    const cutoff = Date.now() - this.config.retentionPeriod!
    
    // Clean metrics
    const metrics = this.metrics.get(resourceId) || []
    this.metrics.set(
      resourceId,
      metrics.filter(m => m.timestamp.getTime() > cutoff)
    )
    
    // Clean alerts
    const alerts = this.alerts.get(resourceId) || []
    this.alerts.set(
      resourceId,
      alerts.filter(a => a.timestamp.getTime() > cutoff)
    )
  }
  
  /**
   * Get current metrics for a resource
   */
  getCurrentMetrics(resourceId: string): ResourceMetrics | null {
    const metrics = this.metrics.get(resourceId)
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null
  }
  
  /**
   * Get metrics history
   */
  getMetricsHistory(
    resourceId: string,
    duration?: number
  ): ResourceMetrics[] {
    const metrics = this.metrics.get(resourceId) || []
    
    if (duration) {
      const cutoff = Date.now() - duration
      return metrics.filter(m => m.timestamp.getTime() > cutoff)
    }
    
    return [...metrics]
  }
  
  /**
   * Get resource alerts
   */
  getAlerts(resourceId: string): ResourceAlert[] {
    return [...(this.alerts.get(resourceId) || [])]
  }
  
  /**
   * Get all active alerts
   */
  getAllAlerts(): ResourceAlert[] {
    const allAlerts: ResourceAlert[] = []
    
    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts)
    }
    
    return allAlerts.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    )
  }
  
  /**
   * Add alert handler
   */
  onAlert(handler: (alert: ResourceAlert) => void): () => void {
    this.alertHandlers.push(handler)
    
    // Return unsubscribe function
    return () => {
      const index = this.alertHandlers.indexOf(handler)
      if (index !== -1) {
        this.alertHandlers.splice(index, 1)
      }
    }
  }
  
  /**
   * Get resource summary
   */
  getResourceSummary(resourceId: string): {
    current: ResourceMetrics | null
    averages: Partial<ResourceMetrics>
    peaks: Partial<ResourceMetrics>
    alertCount: number
  } | null {
    const metrics = this.metrics.get(resourceId)
    if (!metrics || metrics.length === 0) return null
    
    const current = metrics[metrics.length - 1]
    const alerts = this.alerts.get(resourceId) || []
    
    // Calculate averages
    const averages: any = {
      cpu: { usage: 0 },
      memory: { used: 0, percentage: 0 },
      network: { bytesIn: 0, bytesOut: 0, requestsPerSecond: 0 },
      storage: { used: 0 }
    }
    
    const peaks: any = {
      cpu: { usage: 0 },
      memory: { used: 0, percentage: 0 },
      network: { bytesIn: 0, bytesOut: 0, requestsPerSecond: 0 },
      storage: { used: 0 }
    }
    
    for (const metric of metrics) {
      // Update averages
      averages.cpu.usage += metric.cpu.usage
      averages.memory.used += metric.memory.used
      averages.memory.percentage += metric.memory.percentage
      averages.network.bytesIn += metric.network.bytesIn
      averages.network.bytesOut += metric.network.bytesOut
      averages.network.requestsPerSecond += metric.network.requestsPerSecond
      averages.storage.used += metric.storage.used
      
      // Update peaks
      peaks.cpu.usage = Math.max(peaks.cpu.usage, metric.cpu.usage)
      peaks.memory.used = Math.max(peaks.memory.used, metric.memory.used)
      peaks.memory.percentage = Math.max(peaks.memory.percentage, metric.memory.percentage)
      peaks.network.bytesIn = Math.max(peaks.network.bytesIn, metric.network.bytesIn)
      peaks.network.bytesOut = Math.max(peaks.network.bytesOut, metric.network.bytesOut)
      peaks.network.requestsPerSecond = Math.max(peaks.network.requestsPerSecond, metric.network.requestsPerSecond)
      peaks.storage.used = Math.max(peaks.storage.used, metric.storage.used)
    }
    
    // Calculate averages
    const count = metrics.length
    averages.cpu.usage /= count
    averages.memory.used /= count
    averages.memory.percentage /= count
    averages.network.bytesIn /= count
    averages.network.bytesOut /= count
    averages.network.requestsPerSecond /= count
    averages.storage.used /= count
    
    return {
      current,
      averages,
      peaks,
      alertCount: alerts.length
    }
  }
  
  /**
   * Export metrics data
   */
  exportMetrics(resourceId?: string): {
    resources: Array<{
      id: string
      metrics: ResourceMetrics[]
      alerts: ResourceAlert[]
      summary: any
    }>
    exportedAt: Date
  } {
    const resources: any[] = []
    
    if (resourceId) {
      const summary = this.getResourceSummary(resourceId)
      if (summary) {
        resources.push({
          id: resourceId,
          metrics: this.getMetricsHistory(resourceId),
          alerts: this.getAlerts(resourceId),
          summary
        })
      }
    } else {
      // Export all resources
      for (const [id] of this.metrics.entries()) {
        const summary = this.getResourceSummary(id)
        if (summary) {
          resources.push({
            id,
            metrics: this.getMetricsHistory(id),
            alerts: this.getAlerts(id),
            summary
          })
        }
      }
    }
    
    return {
      resources,
      exportedAt: new Date()
    }
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    // Stop all monitors
    for (const [id, interval] of this.monitors.entries()) {
      clearInterval(interval)
    }
    
    this.monitors.clear()
    this.metrics.clear()
    this.limits.clear()
    this.alerts.clear()
  }
}

// Export singleton instance
export const resourceMonitor = new ResourceMonitor()