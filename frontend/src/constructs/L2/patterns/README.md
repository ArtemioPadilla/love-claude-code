# L2 MCP Patterns

This directory contains Level 2 (L2) patterns for MCP (Model Context Protocol) communication. These patterns compose multiple L1 components to create robust, production-ready solutions for client-server communication.

## Patterns

### 1. MCP Client Pattern (`MCPClientPattern.tsx`)

A comprehensive client-side pattern for connecting to MCP servers with enterprise-grade features.

**Key Features:**
- **Dual Protocol Support**: WebSocket with HTTP fallback
- **Automatic Reconnection**: Exponential backoff with configurable limits (max 30s)
- **LRU Cache**: Client-side caching with TTL support
- **Priority Queue**: Request prioritization for critical operations
- **Connection Health**: Real-time latency monitoring and health checks

**Use Cases:**
- Frontend applications connecting to MCP servers
- Mobile apps requiring resilient connectivity
- Distributed systems with unreliable networks
- High-throughput applications needing caching

**Example:**
```typescript
const config: MCPClientConfig = {
  serverUrl: 'https://mcp.example.com',
  enableWebSocket: true,
  enableHttpFallback: true,
  enableReconnection: true,
  enableCaching: true,
  reconnectOptions: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5
  },
  cacheOptions: {
    maxSize: 1000,
    defaultTTL: 300000 // 5 minutes
  }
}

// Make a high-priority request
const result = await client.request('critical.operation', params, {
  priority: 3,
  timeout: 60000,
  useCache: false
})
```

### 2. Distributed MCP Pattern (`DistributedMCPPattern.tsx`)

A sophisticated pattern for managing distributed MCP server clusters with high availability and scalability.

**Key Features:**
- **Service Discovery**: Support for etcd, Consul, or static configuration
- **Load Balancing**: Multiple strategies (round-robin, least-connections, weighted, sticky)
- **Circuit Breakers**: Automatic failover with configurable thresholds
- **Distributed State**: Redis/Hazelcast integration for shared state
- **Health Monitoring**: Automatic node health checks and recovery

**Use Cases:**
- Multi-region deployments
- High-availability MCP services
- Auto-scaling server clusters
- Mission-critical applications

**Example:**
```typescript
const config: DistributedMCPConfig = {
  clusterName: 'production-cluster',
  discoveryMethod: 'consul',
  discoveryConfig: {
    endpoints: ['http://consul:8500'],
    serviceName: 'mcp-server'
  },
  loadBalancingStrategy: 'least-connections',
  circuitBreakerConfig: {
    enabled: true,
    failureThreshold: 5,
    resetTimeout: 60000
  },
  stateManagementConfig: {
    provider: 'redis',
    endpoints: ['redis://cluster:6379']
  }
}

// Route requests with session affinity
const result = await cluster.route('api.method', params, {
  sessionId: 'user-123',
  preferredNode: 'node-west-1'
})
```

## Architecture

Both patterns follow the L2 pattern architecture:

```
L2 Pattern
├── Composes L1 Components
│   ├── SecureMCPServer
│   ├── AuthenticatedToolRegistry
│   ├── RateLimitedRPC
│   └── EncryptedWebSocket
├── Implements Domain Logic
│   ├── Connection Management
│   ├── Request Routing
│   ├── State Management
│   └── Health Monitoring
└── Provides High-Level API
    ├── Simple Configuration
    ├── Automatic Error Handling
    └── Built-in Monitoring
```

## Performance Considerations

### MCP Client Pattern
- **Cache Hit Rate**: Monitor and adjust cache size/TTL based on usage patterns
- **Connection Pooling**: WebSocket connections are reused for efficiency
- **Request Batching**: Priority queue enables intelligent request batching
- **Memory Usage**: LRU cache has configurable size limits

### Distributed MCP Pattern
- **Network Latency**: Health checks and circuit breakers minimize impact
- **Load Distribution**: Multiple strategies to optimize for different workloads
- **State Synchronization**: Distributed state providers handle consistency
- **Failover Time**: Circuit breakers enable sub-second failover

## Monitoring and Observability

Both patterns provide comprehensive metrics:

```typescript
// Client metrics
{
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cachedResponses: number
  averageLatency: number
  activeRequests: number
  queuedRequests: number
}

// Distributed metrics
{
  totalNodes: number
  healthyNodes: number
  totalRequests: number
  successfulRequests: number
  averageLatency: number
  circuitBreakerTrips: number
  throughput: number
}
```

## Security

Both patterns implement security best practices:
- Encrypted WebSocket connections
- JWT authentication support
- Rate limiting protection
- Secure credential management
- Audit logging capabilities

## Testing

Comprehensive test suites are provided:
- Unit tests for pattern logic
- Integration tests for L1 component interaction
- Performance benchmarks
- Failure scenario testing
- Load testing utilities

## Best Practices

1. **Configuration**: Start with defaults and tune based on monitoring
2. **Error Handling**: Always implement error callbacks and fallbacks
3. **Resource Management**: Properly cleanup patterns on unmount
4. **Monitoring**: Use provided metrics for production insights
5. **Scaling**: Design for horizontal scaling from the start

## Future Enhancements

- GraphQL subscription support
- WebRTC data channel integration
- Machine learning-based load prediction
- Automatic capacity planning
- Cross-region replication support