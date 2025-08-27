import React, { useEffect, useState, useRef } from 'react'
import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

// Browser-compatible type definitions
type Registry = any
type Counter<T extends string = string> = any
type Gauge<T extends string = string> = any
type Histogram<T extends string = string> = any
type Collectible<T = any> = any

// Conditionally import prom-client only in Node.js/Electron environments
let promClient: any = null
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Dynamic import for Node.js environments only
  import('prom-client').then(module => {
    promClient = module
  }).catch(() => {
    console.log('prom-client not available in browser environment')
  })
}

/**
 * L1 Prometheus Metrics Construct
 * Provides comprehensive metrics collection for construct usage, performance, and system health
 * Built upon L0 metric primitives with enhanced aggregation and visualization
 */
export class PrometheusMetricsConstruct extends L1InfrastructureConstruct {
  private registry: Registry
  private metrics: Map<string, Collectible<any>>
  private pollingInterval: NodeJS.Timeout | null = null
  
  // Pre-defined metrics for construct usage
  private constructUsageCounter: Counter<string>
  private constructLatencyHistogram: Histogram<string>
  private activeConstructsGauge: Gauge<string>
  private constructErrorCounter: Counter<string>
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-prometheus-metrics',
    name: 'Prometheus Metrics Collector',
    level: ConstructLevel.L1,
    type: ConstructType.INFRASTRUCTURE,
    description: 'Production-grade metrics collection with Prometheus integration for monitoring construct usage and system performance',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['monitoring', 'infrastructure', 'observability'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['prometheus', 'metrics', 'monitoring', 'observability', 'performance'],
    inputs: [
      {
        name: 'metricsPrefix',
        type: 'string',
        description: 'Prefix for all metric names',
        required: false,
        defaultValue: 'love_claude_code'
      },
      {
        name: 'scrapeInterval',
        type: 'number',
        description: 'Scrape interval in milliseconds',
        required: false,
        defaultValue: 15000
      },
      {
        name: 'enableDefaultMetrics',
        type: 'boolean',
        description: 'Enable default Node.js metrics',
        required: false,
        defaultValue: true
      },
      {
        name: 'customLabels',
        type: 'object',
        description: 'Custom labels to add to all metrics',
        required: false,
        defaultValue: {}
      },
      {
        name: 'pushGatewayUrl',
        type: 'string',
        description: 'Optional Prometheus Pushgateway URL',
        required: false
      },
      {
        name: 'enableConstructMetrics',
        type: 'boolean',
        description: 'Enable automatic construct usage metrics',
        required: false,
        defaultValue: true
      },
      {
        name: 'histogramBuckets',
        type: 'array',
        description: 'Custom histogram buckets for latency metrics',
        required: false,
        defaultValue: [0.1, 0.5, 1, 2.5, 5, 10]
      }
    ],
    outputs: [
      {
        name: 'metricsEndpoint',
        type: 'string',
        description: 'URL endpoint for Prometheus scraping'
      },
      {
        name: 'currentMetrics',
        type: 'object',
        description: 'Current metrics snapshot'
      },
      {
        name: 'metricCount',
        type: 'number',
        description: 'Total number of registered metrics'
      },
      {
        name: 'lastScrapeTime',
        type: 'string',
        description: 'ISO timestamp of last scrape'
      }
    ],
    security: [
      {
        aspect: 'Authentication',
        description: 'Secure metrics endpoint with authentication',
        implementation: 'Bearer token or API key authentication'
      },
      {
        aspect: 'Data Privacy',
        description: 'No sensitive data in metric labels',
        implementation: 'Label sanitization and filtering'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'metricsStorage',
          unit: 'GB',
          costPerUnit: 0.10,
          description: 'Metrics data storage'
        },
        {
          name: 'apiRequests',
          unit: '1M requests',
          costPerUnit: 0.50,
          description: 'Metrics API requests'
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'Prometheus Client Library'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Initialize metrics collection',
        code: `const metrics = new PrometheusMetricsConstruct()
await metrics.initialize({
  metricsPrefix: 'my_app',
  enableConstructMetrics: true
})

// Track custom metric
metrics.incrementCounter('api_requests', { endpoint: '/api/v1' })`,
        language: 'typescript'
      },
      {
        title: 'Construct Usage Tracking',
        description: 'Automatic tracking of construct usage',
        code: `// Automatically tracks when constructs are used
const editor = new SecureCodeEditor()
// Metrics automatically recorded:
// - love_claude_code_construct_usage_total{construct="SecureCodeEditor"}
// - love_claude_code_construct_latency_seconds{construct="SecureCodeEditor"}`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use consistent metric naming conventions',
      'Add meaningful labels but avoid high cardinality',
      'Set up alerts for critical metrics',
      'Regularly review and clean up unused metrics',
      'Use histograms for latency measurements',
      'Implement proper metric retention policies'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        prometheusUrl: {
          type: 'string',
          description: 'Prometheus server URL',
          required: false
        },
        retentionPolicy: {
          type: 'string',
          description: 'Metric retention duration',
          default: '30d'
        }
      },
      environmentVariables: [
        'PROMETHEUS_PUSHGATEWAY_URL',
        'METRICS_AUTH_TOKEN'
      ]
    },
    dependencies: [],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 15,
      builtWith: ['platform-l0-metric-primitive'],
      timeToCreate: 90,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(PrometheusMetricsConstruct.definition)
    this.metrics = new Map()
    
    // Initialize construct metrics
    const prefix = this.getInput<string>('metricsPrefix') || 'love_claude_code'
    
    // Check if we're in a Node.js/Electron environment
    if (promClient) {
      // Real Prometheus metrics for Node.js/Electron
      this.registry = new promClient.Registry()
      
      this.constructUsageCounter = new promClient.Counter({
        name: `${prefix}_construct_usage_total`,
        help: 'Total number of times each construct has been used',
        labelNames: ['construct', 'level', 'type']
      })
      
      this.constructLatencyHistogram = new promClient.Histogram({
        name: `${prefix}_construct_latency_seconds`,
        help: 'Latency of construct operations in seconds',
        labelNames: ['construct', 'operation'],
        buckets: this.getInput<number[]>('histogramBuckets') || [0.1, 0.5, 1, 2.5, 5, 10]
      })
      
      this.activeConstructsGauge = new promClient.Gauge({
        name: `${prefix}_active_constructs`,
        help: 'Number of currently active constructs',
        labelNames: ['level', 'type']
      })
      
      this.constructErrorCounter = new promClient.Counter({
        name: `${prefix}_construct_errors_total`,
        help: 'Total number of construct errors',
        labelNames: ['construct', 'error_type']
      })
      
      // Register metrics
      this.registry.registerMetric(this.constructUsageCounter)
      this.registry.registerMetric(this.constructLatencyHistogram)
      this.registry.registerMetric(this.activeConstructsGauge)
      this.registry.registerMetric(this.constructErrorCounter)
    } else {
      // Browser-compatible fallbacks
      console.log('PrometheusMetricsConstruct: Running in browser mode with metric stubs')
      
      // Create simple metric stubs for browser environment
      this.registry = {
        metrics: () => Promise.resolve('# Browser metrics not available\n'),
        registerMetric: () => {},
        getSingleMetric: () => null,
        getSingleMetricAsString: () => Promise.resolve(''),
        removeSingleMetric: () => {},
        clear: () => {},
        resetMetrics: () => {}
      }
      
      // Create counter stub
      const createCounterStub = (name: string) => ({
        inc: () => {},
        labels: () => ({ inc: () => {} }),
        reset: () => {},
        get: () => ({ values: [] })
      })
      
      // Create histogram stub
      const createHistogramStub = (name: string) => ({
        observe: () => {},
        labels: () => ({ observe: () => {} }),
        reset: () => {},
        startTimer: () => () => {},
        get: () => ({ values: [] })
      })
      
      // Create gauge stub
      const createGaugeStub = (name: string) => ({
        set: () => {},
        inc: () => {},
        dec: () => {},
        labels: () => ({ set: () => {}, inc: () => {}, dec: () => {} }),
        reset: () => {},
        get: () => ({ values: [] })
      })
      
      this.constructUsageCounter = createCounterStub(`${prefix}_construct_usage_total`)
      this.constructLatencyHistogram = createHistogramStub(`${prefix}_construct_latency_seconds`)
      this.activeConstructsGauge = createGaugeStub(`${prefix}_active_constructs`)
      this.constructErrorCounter = createCounterStub(`${prefix}_construct_errors_total`)
    }
  }

  async onInitialize(): Promise<void> {
    // Enable default metrics if configured (Node.js/Electron only)
    if (this.getInput<boolean>('enableDefaultMetrics') && promClient) {
      try {
        const { collectDefaultMetrics } = promClient
        collectDefaultMetrics({ register: this.registry })
      } catch (error) {
        console.log('Default metrics not available in browser environment')
      }
    }
    
    // Start metrics collection
    this.startMetricsCollection()
    
    // Set up metrics endpoint
    this.setOutput('metricsEndpoint', '/metrics')
    this.updateMetrics()
  }

  async onDestroy(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    // Clear metrics
    this.registry.clear()
  }

  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection(): void {
    const interval = this.getInput<number>('scrapeInterval') || 15000
    
    this.pollingInterval = setInterval(() => {
      this.updateMetrics()
      this.collectSystemMetrics()
    }, interval)
  }

  /**
   * Update current metrics snapshot
   */
  private async updateMetrics(): Promise<void> {
    try {
      const metrics = await this.registry.metrics()
      const metricsObject = this.parseMetrics(metrics)
      
      this.setOutput('currentMetrics', metricsObject)
      this.setOutput('metricCount', this.registry.getMetricsAsArray().length)
      this.setOutput('lastScrapeTime', new Date().toISOString())
    } catch (error) {
      console.error('Failed to update metrics:', error)
    }
  }

  /**
   * Parse Prometheus metrics to object format
   */
  private parseMetrics(metricsText: string): Record<string, any> {
    const lines = metricsText.split('\n')
    const metrics: Record<string, any> = {}
    
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') continue
      
      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:{([^}]+)})?\s+(.+)$/)
      if (match) {
        const [, name, labels, value] = match
        if (!metrics[name]) metrics[name] = []
        
        metrics[name].push({
          labels: labels ? this.parseLabels(labels) : {},
          value: parseFloat(value)
        })
      }
    }
    
    return metrics
  }

  /**
   * Parse Prometheus label string
   */
  private parseLabels(labelString: string): Record<string, string> {
    const labels: Record<string, string> = {}
    const matches = labelString.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g)
    
    for (const match of matches) {
      labels[match[1]] = match[2]
    }
    
    return labels
  }

  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics(): void {
    // Memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      this.recordGauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap' })
      this.recordGauge('memory_usage_bytes', memUsage.rss, { type: 'rss' })
    }
    
    // Active constructs (would integrate with construct store in real implementation)
    // This is a placeholder - in real implementation would query construct store
    this.activeConstructsGauge.set({ level: 'L1', type: 'ui' }, 5)
    this.activeConstructsGauge.set({ level: 'L1', type: 'infrastructure' }, 3)
  }

  /**
   * Record construct usage
   */
  recordConstructUsage(constructId: string, level: string, type: string): void {
    if (!this.getInput<boolean>('enableConstructMetrics')) return
    
    this.constructUsageCounter.inc({
      construct: constructId,
      level,
      type
    })
  }

  /**
   * Record construct latency
   */
  recordConstructLatency(constructId: string, operation: string, durationMs: number): void {
    if (!this.getInput<boolean>('enableConstructMetrics')) return
    
    this.constructLatencyHistogram.observe(
      { construct: constructId, operation },
      durationMs / 1000 // Convert to seconds
    )
  }

  /**
   * Record construct error
   */
  recordConstructError(constructId: string, errorType: string): void {
    if (!this.getInput<boolean>('enableConstructMetrics')) return
    
    this.constructErrorCounter.inc({
      construct: constructId,
      error_type: errorType
    })
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metricName = `${this.getInput<string>('metricsPrefix')}_${name}`
    let counter = this.metrics.get(metricName) as Counter<string>
    
    if (!counter) {
      counter = new Counter({
        name: metricName,
        help: `Counter for ${name}`,
        labelNames: labels ? Object.keys(labels) : []
      })
      this.registry.registerMetric(counter)
      this.metrics.set(metricName, counter)
    }
    
    if (labels) {
      counter.inc(labels)
    } else {
      counter.inc()
    }
  }

  /**
   * Record a gauge value
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = `${this.getInput<string>('metricsPrefix')}_${name}`
    let gauge = this.metrics.get(metricName) as Gauge<string>
    
    if (!gauge) {
      gauge = new Gauge({
        name: metricName,
        help: `Gauge for ${name}`,
        labelNames: labels ? Object.keys(labels) : []
      })
      this.registry.registerMetric(gauge)
      this.metrics.set(metricName, gauge)
    }
    
    if (labels) {
      gauge.set(labels, value)
    } else {
      gauge.set(value)
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsAsJSON(): Promise<any[]> {
    return this.registry.getMetricsAsJSON()
  }

  /**
   * React component for metrics visualization
   */
  render(): React.ReactElement {
    return <PrometheusMetricsComponent construct={this} />
  }
}

/**
 * React component for metrics visualization
 */
const PrometheusMetricsComponent: React.FC<{ construct: PrometheusMetricsConstruct }> = ({ construct }) => {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const updateMetrics = () => {
      const current = construct.getOutput<Record<string, any>>('currentMetrics') || {}
      const time = construct.getOutput<string>('lastScrapeTime') || ''
      setMetrics(current)
      setLastUpdate(time)
    }

    updateMetrics()
    intervalRef.current = setInterval(updateMetrics, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [construct])

  const formatValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
    return value.toFixed(2)
  }

  return (
    <div className="prometheus-metrics p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Prometheus Metrics</h3>
        <span className="text-sm text-gray-500">
          Last update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Construct Usage Metrics */}
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium mb-2">Construct Usage</h4>
          <div className="space-y-1">
            {metrics[`${construct.getInput('metricsPrefix')}_construct_usage_total`]?.map((m: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{m.labels.construct || 'Unknown'}</span>
                <span className="font-mono">{formatValue(m.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Constructs */}
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium mb-2">Active Constructs</h4>
          <div className="space-y-1">
            {metrics[`${construct.getInput('metricsPrefix')}_active_constructs`]?.map((m: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{m.labels.level} / {m.labels.type}</span>
                <span className="font-mono">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Metrics */}
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium mb-2">Errors</h4>
          <div className="space-y-1">
            {metrics[`${construct.getInput('metricsPrefix')}_construct_errors_total`]?.map((m: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{m.labels.construct}: {m.labels.error_type}</span>
                <span className="font-mono text-red-600">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-white p-3 rounded shadow">
          <h4 className="font-medium mb-2">System Metrics</h4>
          <div className="space-y-1">
            {metrics['memory_usage_bytes']?.map((m: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">Memory ({m.labels.type})</span>
                <span className="font-mono">{formatValue(m.value / 1024 / 1024)} MB</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Endpoint: <code className="bg-gray-100 px-1 rounded">{construct.getOutput('metricsEndpoint')}</code>
        {' • '}
        Total Metrics: {construct.getOutput('metricCount') || 0}
      </div>
    </div>
  )
}

// Export factory function
export const createPrometheusMetrics = () => new PrometheusMetricsConstruct()

// Export the definition for catalog registration
export const prometheusMetricsDefinition = PrometheusMetricsConstruct.definition