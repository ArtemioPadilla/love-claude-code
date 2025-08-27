import React, { useState, useEffect } from 'react'
import { DistributedMCPPattern, DistributedMCPPatternLogic } from '../DistributedMCPPattern'
import type { ServiceNode, DistributedMCPConfig } from '../DistributedMCPPattern'

/**
 * Example: Basic Static Cluster
 * 
 * This example demonstrates a simple 3-node cluster with static configuration,
 * suitable for development or small deployments.
 */
export const BasicDistributedMCPExample: React.FC = () => {
  const config: DistributedMCPConfig = {
    clusterName: 'dev-cluster',
    discoveryMethod: 'static',
    discoveryConfig: {
      staticNodes: [
        {
          id: 'dev-node-1',
          url: 'http://localhost:8081',
          health: 'healthy',
          lastHealthCheck: new Date(),
          connections: 0,
          weight: 1,
          metadata: {
            version: '1.0.0',
            region: 'local',
            capabilities: ['general']
          }
        },
        {
          id: 'dev-node-2',
          url: 'http://localhost:8082',
          health: 'healthy',
          lastHealthCheck: new Date(),
          connections: 0,
          weight: 1,
          metadata: {
            version: '1.0.0',
            region: 'local',
            capabilities: ['general']
          }
        },
        {
          id: 'dev-node-3',
          url: 'http://localhost:8083',
          health: 'healthy',
          lastHealthCheck: new Date(),
          connections: 0,
          weight: 1,
          metadata: {
            version: '1.0.0',
            region: 'local',
            capabilities: ['general']
          }
        }
      ]
    },
    loadBalancingStrategy: 'round-robin',
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenRequests: 1
    },
    stateManagementConfig: {
      provider: 'memory'
    },
    healthCheckConfig: {
      interval: 10000,
      timeout: 5000,
      unhealthyThreshold: 2,
      healthyThreshold: 1
    }
  }

  return (
    <DistributedMCPPattern
      config={config}
      onNodeChange={(nodes) => {
        console.log('Cluster nodes updated:', nodes)
      }}
      onMetricsUpdate={(metrics) => {
        console.log('Cluster metrics:', metrics)
      }}
    />
  )
}

/**
 * Example: Production Multi-Region Cluster
 * 
 * This example shows a production configuration with:
 * - Multiple regions for global distribution
 * - Weighted load balancing based on capacity
 * - Consul service discovery
 * - Redis state management
 */
export const ProductionMultiRegionExample: React.FC = () => {
  const config: DistributedMCPConfig = {
    clusterName: 'global-production',
    discoveryMethod: 'consul',
    discoveryConfig: {
      endpoints: ['https://consul-1.prod.example.com:8500', 'https://consul-2.prod.example.com:8500'],
      serviceName: 'mcp-server-prod'
    },
    loadBalancingStrategy: 'weighted',
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 5,
      resetTimeout: 60000,      // 1 minute
      halfOpenRequests: 2
    },
    stateManagementConfig: {
      provider: 'redis',
      endpoints: [
        'redis://redis-1.prod.example.com:6379',
        'redis://redis-2.prod.example.com:6379'
      ],
      ttl: 3600000              // 1 hour session TTL
    },
    healthCheckConfig: {
      interval: 5000,           // Check every 5 seconds
      timeout: 2000,            // 2 second timeout
      unhealthyThreshold: 3,    // 3 failures = unhealthy
      healthyThreshold: 2       // 2 successes = healthy
    },
    routingRules: [
      {
        pattern: '^admin.',
        targets: ['admin-node-us', 'admin-node-eu'],
        strategy: 'sticky'
      },
      {
        pattern: '^analytics.',
        targets: ['analytics-cluster-.*'],
        strategy: 'least-connections'
      },
      {
        pattern: '^api.v2.',
        targets: ['v2-node-.*'],
        strategy: 'weighted'
      }
    ]
  }

  return <DistributedMCPPattern config={config} />
}

/**
 * Example: Programmatic Distributed Cluster Management
 * 
 * This example demonstrates advanced usage:
 * - Dynamic routing based on request context
 * - Distributed locking for coordination
 * - Session management across nodes
 * - Custom health monitoring
 */
export const ProgrammaticDistributedExample: React.FC = () => {
  const [cluster, setCluster] = useState<DistributedMCPPatternLogic | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [lockStatus, setLockStatus] = useState<string>('')
  const [routingResults, setRoutingResults] = useState<any[]>([])

  useEffect(() => {
    const initCluster = async () => {
      const config: DistributedMCPConfig = {
        clusterName: 'managed-cluster',
        discoveryMethod: 'static',
        discoveryConfig: {
          staticNodes: [
            {
              id: 'primary-1',
              url: 'http://primary-1.local:8080',
              health: 'healthy',
              lastHealthCheck: new Date(),
              connections: 0,
              weight: 3,  // Higher capacity
              metadata: {
                version: '2.0.0',
                region: 'us-east',
                capabilities: ['compute', 'storage', 'ml']
              }
            },
            {
              id: 'secondary-1',
              url: 'http://secondary-1.local:8080',
              health: 'healthy',
              lastHealthCheck: new Date(),
              connections: 0,
              weight: 2,  // Medium capacity
              metadata: {
                version: '2.0.0',
                region: 'us-west',
                capabilities: ['compute', 'storage']
              }
            },
            {
              id: 'edge-1',
              url: 'http://edge-1.local:8080',
              health: 'healthy',
              lastHealthCheck: new Date(),
              connections: 0,
              weight: 1,  // Lower capacity
              metadata: {
                version: '2.0.0',
                region: 'edge',
                capabilities: ['compute']
              }
            }
          ]
        },
        loadBalancingStrategy: 'least-connections',
        circuitBreakerConfig: {
          enabled: true,
          failureThreshold: 3,
          resetTimeout: 30000,
          halfOpenRequests: 1
        },
        stateManagementConfig: {
          provider: 'memory'  // Use Redis in production
        },
        healthCheckConfig: {
          interval: 5000,
          timeout: 2000,
          unhealthyThreshold: 2,
          healthyThreshold: 1
        }
      }

      const distributedCluster = new DistributedMCPPatternLogic(config)
      await distributedCluster.initialize()
      setCluster(distributedCluster)

      return () => {
        distributedCluster.cleanup()
      }
    }

    initCluster()
  }, [])

  const handleDistributedOperation = async () => {
    if (!cluster) return

    try {
      // Example: Distributed task processing with session affinity
      const sessionId = `session-${Date.now()}`
      
      // Initialize session
      await cluster.setSession(sessionId, {
        userId: 'user-123',
        startTime: new Date(),
        preferences: { theme: 'dark', language: 'en' }
      })

      // Execute operations with session affinity
      const results = []
      
      // Step 1: Initialize computation
      const initResult = await cluster.route('compute.initialize', {
        dataset: 'large-dataset-1',
        algorithm: 'neural-network'
      }, { sessionId })
      results.push({ step: 'initialize', result: initResult })

      // Step 2: Process in chunks (will go to same node due to sticky session)
      for (let i = 0; i < 3; i++) {
        const chunkResult = await cluster.route('compute.processChunk', {
          chunkId: i,
          chunkSize: 1000
        }, { sessionId })
        results.push({ step: `chunk-${i}`, result: chunkResult })
      }

      // Step 3: Finalize computation
      const finalResult = await cluster.route('compute.finalize', {
        aggregation: 'mean'
      }, { sessionId })
      results.push({ step: 'finalize', result: finalResult })

      // Retrieve session data
      const session = await cluster.getSession(sessionId)
      setSessionData(session)
      setRoutingResults(results)

    } catch (error) {
      console.error('Distributed operation failed:', error)
    }
  }

  const handleDistributedLock = async () => {
    if (!cluster) return

    const lockKey = 'critical-resource-1'
    const ownerId = `owner-${Date.now()}`

    try {
      // Try to acquire lock
      const acquired = await cluster.acquireLock(lockKey, ownerId, 10000)
      
      if (acquired) {
        setLockStatus(`Lock acquired by ${ownerId}`)
        
        // Simulate critical section
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Perform critical operation
        await cluster.route('critical.operation', {
          resource: lockKey,
          action: 'update'
        })
        
        // Release lock
        const released = await cluster.releaseLock(lockKey, ownerId)
        setLockStatus(`Lock released: ${released}`)
      } else {
        setLockStatus('Failed to acquire lock - resource busy')
      }
    } catch (error) {
      console.error('Lock operation failed:', error)
      setLockStatus('Lock operation failed')
    }
  }

  const handleSharedDataDemo = async () => {
    if (!cluster) return

    try {
      // Set shared configuration
      await cluster.setSharedData('app-config', {
        featureFlags: {
          newUI: true,
          betaFeatures: false,
          maintenanceMode: false
        },
        rateLimit: {
          requestsPerMinute: 1000,
          burstCapacity: 1500
        },
        version: '2.1.0'
      })

      // All nodes can read this configuration
      const config = await cluster.getSharedData('app-config')
      console.log('Shared configuration:', config)

    } catch (error) {
      console.error('Shared data operation failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Programmatic Distributed MCP</h3>
      
      {/* Cluster Status */}
      {cluster && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h4 className="font-medium mb-2">Cluster Status</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {cluster.getServiceNodes().map(node => (
              <div key={node.id} className="space-y-1">
                <div className="font-medium">{node.id}</div>
                <div>Health: {node.health}</div>
                <div>Weight: {node.weight}</div>
                <div>Connections: {node.connections}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="space-x-2">
        <button
          onClick={handleDistributedOperation}
          disabled={!cluster}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Run Distributed Operation
        </button>
        <button
          onClick={handleDistributedLock}
          disabled={!cluster}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          Test Distributed Lock
        </button>
        <button
          onClick={handleSharedDataDemo}
          disabled={!cluster}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Update Shared Data
        </button>
      </div>
      
      {/* Results */}
      {routingResults.length > 0 && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h4 className="font-medium mb-2">Routing Results</h4>
          <div className="space-y-2 text-sm">
            {routingResults.map((result, i) => (
              <div key={i}>
                <span className="font-medium">{result.step}:</span>
                <span className="ml-2">{JSON.stringify(result.result)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Session Data */}
      {sessionData && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h4 className="font-medium mb-2">Session Data</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Lock Status */}
      {lockStatus && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h4 className="font-medium mb-2">Lock Status</h4>
          <div className="text-sm">{lockStatus}</div>
        </div>
      )}
    </div>
  )
}

/**
 * Example: Auto-Scaling Cluster with etcd
 * 
 * This example shows configuration for an auto-scaling cluster that:
 * - Uses etcd for dynamic service discovery
 * - Implements least-connections load balancing
 * - Has aggressive health checks for fast failover
 */
export const AutoScalingClusterExample: React.FC = () => {
  const config: DistributedMCPConfig = {
    clusterName: 'auto-scaling-prod',
    discoveryMethod: 'etcd',
    discoveryConfig: {
      endpoints: [
        'https://etcd-1.prod:2379',
        'https://etcd-2.prod:2379',
        'https://etcd-3.prod:2379'
      ],
      serviceName: 'mcp-autoscale'
    },
    loadBalancingStrategy: 'least-connections',
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 2,      // Fast failure detection
      resetTimeout: 15000,      // 15 second reset
      halfOpenRequests: 3       // Test with 3 requests
    },
    stateManagementConfig: {
      provider: 'hazelcast',
      endpoints: ['hazelcast://cluster.prod:5701'],
      ttl: 7200000              // 2 hour TTL
    },
    healthCheckConfig: {
      interval: 2000,           // Aggressive 2 second checks
      timeout: 1000,            // 1 second timeout
      unhealthyThreshold: 1,    // Mark unhealthy quickly
      healthyThreshold: 3       // Require 3 successes
    }
  }

  return <DistributedMCPPattern config={config} />
}