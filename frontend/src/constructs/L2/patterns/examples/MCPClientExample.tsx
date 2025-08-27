import React, { useState, useEffect } from 'react'
import { MCPClientPattern, MCPClientPatternLogic } from '../MCPClientPattern'

/**
 * Example: Basic MCP Client Usage
 * 
 * This example demonstrates a simple MCP client connecting to a local server
 * with all features enabled for maximum resilience.
 */
export const BasicMCPClientExample: React.FC = () => {
  return (
    <MCPClientPattern
      config={{
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true
      }}
      onConnectionChange={(status) => {
        console.log('Connection status:', status)
      }}
      onRequest={(method, params) => {
        console.log(`Request: ${method}`, params)
      }}
    />
  )
}

/**
 * Example: Production MCP Client with Custom Configuration
 * 
 * This example shows a production-ready configuration with:
 * - Aggressive reconnection for critical systems
 * - Large cache for frequently accessed data
 * - Extended timeouts for complex operations
 */
export const ProductionMCPClientExample: React.FC = () => {
  return (
    <MCPClientPattern
      config={{
        serverUrl: 'https://api.production.example.com',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true,
        reconnectOptions: {
          maxAttempts: 20,          // More attempts for critical systems
          initialDelay: 500,        // Start reconnecting quickly
          maxDelay: 60000,          // Cap at 1 minute
          backoffMultiplier: 2      // Double delay each time
        },
        cacheOptions: {
          maxSize: 5000,            // Large cache for API responses
          defaultTTL: 600000        // 10 minute default TTL
        },
        requestOptions: {
          timeout: 60000,           // 1 minute timeout for complex ops
          retryAttempts: 5,         // More retries for reliability
          priorityLevels: 5         // 5 priority levels for fine control
        }
      }}
    />
  )
}

/**
 * Example: Programmatic MCP Client Usage
 * 
 * This example demonstrates using the MCP client pattern programmatically
 * for advanced use cases like:
 * - Batch operations
 * - Custom error handling
 * - Performance monitoring
 */
export const ProgrammaticMCPClientExample: React.FC = () => {
  const [client, setClient] = useState<MCPClientPatternLogic | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const initClient = async () => {
      const mcpClient = new MCPClientPatternLogic({
        serverUrl: 'http://localhost:8080',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true
      })
      
      await mcpClient.initialize()
      setClient(mcpClient)
      
      // Monitor metrics
      const metricsInterval = setInterval(() => {
        setMetrics({
          connection: mcpClient.getConnectionStatus(),
          requests: mcpClient.getMetrics(),
          cache: mcpClient.getCacheStats()
        })
      }, 1000)
      
      return () => {
        clearInterval(metricsInterval)
        mcpClient.cleanup()
      }
    }
    
    initClient()
  }, [])

  const handleBatchOperation = async () => {
    if (!client) return
    
    try {
      // Execute multiple requests with different priorities
      const promises = [
        // Critical operation - highest priority
        client.request('user.authenticate', { 
          username: 'admin',
          password: 'secure123'
        }, { 
          priority: 5,
          useCache: false,
          timeout: 10000
        }),
        
        // Normal operations - medium priority
        client.request('data.fetch', { 
          table: 'products',
          limit: 100
        }, { 
          priority: 3,
          useCache: true,
          ttl: 300000 // Cache for 5 minutes
        }),
        
        // Background sync - low priority
        client.request('sync.start', { 
          since: new Date(Date.now() - 86400000)
        }, { 
          priority: 1,
          timeout: 120000 // 2 minute timeout
        })
      ]
      
      const results = await Promise.allSettled(promises)
      setResults(results)
      
    } catch (error) {
      console.error('Batch operation failed:', error)
    }
  }

  const handleCachePrefetch = async () => {
    if (!client) return
    
    // Prefetch commonly used data into cache
    const prefetchTargets = [
      { method: 'config.get', params: { key: 'app.settings' } },
      { method: 'user.permissions', params: { userId: 'current' } },
      { method: 'data.metadata', params: { tables: ['users', 'products'] } }
    ]
    
    for (const target of prefetchTargets) {
      try {
        await client.request(target.method, target.params, {
          priority: 2,
          useCache: true,
          ttl: 3600000 // Cache for 1 hour
        })
      } catch (error) {
        console.error(`Failed to prefetch ${target.method}:`, error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Programmatic MCP Client</h3>
      
      {/* Connection Status */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h4 className="font-medium mb-2">Connection Status</h4>
        {metrics?.connection && (
          <div className="text-sm space-y-1">
            <div>Protocol: {metrics.connection.protocol}</div>
            <div>Connected: {metrics.connection.connected ? 'Yes' : 'No'}</div>
            <div>Latency: {metrics.connection.latency}ms</div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="space-x-2">
        <button
          onClick={handleBatchOperation}
          disabled={!client}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Execute Batch Operation
        </button>
        <button
          onClick={handleCachePrefetch}
          disabled={!client}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          Prefetch Cache
        </button>
      </div>
      
      {/* Results */}
      {results.length > 0 && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h4 className="font-medium mb-2">Results</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h4 className="font-medium mb-2">Request Metrics</h4>
            <div className="text-sm space-y-1">
              <div>Total: {metrics.requests.totalRequests}</div>
              <div>Success: {metrics.requests.successfulRequests}</div>
              <div>Failed: {metrics.requests.failedRequests}</div>
              <div>Cached: {metrics.requests.cachedResponses}</div>
            </div>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h4 className="font-medium mb-2">Cache Stats</h4>
            <div className="text-sm space-y-1">
              <div>Size: {metrics.cache.size}</div>
              <div>Hits: {metrics.cache.hits}</div>
              <div>Hit Rate: {(metrics.cache.hitRate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Example: Mobile-Optimized MCP Client
 * 
 * This example shows configuration optimized for mobile devices:
 * - Aggressive caching to reduce data usage
 * - Quick reconnection for network transitions
 * - Lower resource limits
 */
export const MobileMCPClientExample: React.FC = () => {
  return (
    <MCPClientPattern
      config={{
        serverUrl: 'https://mobile-api.example.com',
        enableWebSocket: true,
        enableHttpFallback: true,
        enableReconnection: true,
        enableCaching: true,
        reconnectOptions: {
          maxAttempts: 5,           // Fewer attempts to save battery
          initialDelay: 2000,       // Slower start for stability
          maxDelay: 30000,          // 30 second max
          backoffMultiplier: 1.5    // Gentler backoff
        },
        cacheOptions: {
          maxSize: 500,             // Smaller cache for mobile
          defaultTTL: 1800000       // 30 minute TTL for offline support
        },
        requestOptions: {
          timeout: 20000,           // 20 second timeout
          retryAttempts: 2,         // Fewer retries
          priorityLevels: 3         // Simple priority system
        }
      }}
    />
  )
}