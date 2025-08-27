# External Construct Primitive (L0)

The External Construct Primitive is the foundation layer for integrating external packages, services, and dependencies into the Love Claude Code platform. As an L0 primitive, it provides the raw, unopinionated wrapper that enables safe integration of any external resource while maintaining security, isolation, and performance.

## Overview

This primitive serves as the base for all external integrations in the platform, including:
- NPM packages
- Docker containers
- MCP (Model Context Protocol) servers
- REST/GraphQL APIs
- Git repositories
- Binary executables
- URL resources

## Key Features

### 1. **Sandbox Execution Environment**
- Configurable isolation policies (process, container, VM)
- Network restrictions (none, restricted, host-only, full)
- Filesystem access control (none, read-only, restricted, full)
- Resource limits (CPU, memory, disk, network bandwidth)
- Execution timeouts

### 2. **Resource Monitoring**
- Real-time CPU and memory usage tracking
- Network I/O monitoring
- Disk usage tracking
- Configurable alert thresholds
- Performance metrics collection

### 3. **Event-Driven Architecture**
- Lifecycle events (initialize, ready, stop, destroy)
- Error and crash events
- Recovery events
- Resource limit events
- Custom message passing

### 4. **Crash Recovery**
- Automatic restart on failure
- Configurable retry strategies (immediate, linear, exponential backoff)
- Maximum retry limits
- Recovery failure callbacks

### 5. **Health Monitoring**
- Periodic health checks
- Custom health check implementations
- Health status reporting
- Error tracking

### 6. **Communication Protocols**
- stdio (standard input/output)
- IPC (inter-process communication)
- WebSocket
- HTTP/HTTPS
- gRPC
- Custom protocols

## Usage

### Basic NPM Package Integration

```typescript
import { ExternalConstructPrimitive } from '@/constructs/L0/infrastructure/external'

const npmConfig = {
  source: {
    type: 'npm',
    identifier: 'lodash',
    version: '^4.17.21'
  },
  sandbox: {
    enabled: true,
    policies: {
      network: 'none',
      filesystem: 'none'
    }
  }
}

<ExternalConstructPrimitive config={npmConfig}>
  {(props) => (
    <div>
      <button onClick={() => props.execute('sortBy', data, 'name')}>
        Sort Data
      </button>
    </div>
  )}
</ExternalConstructPrimitive>
```

### Docker Container Integration

```typescript
const dockerConfig = {
  source: {
    type: 'docker',
    identifier: 'redis:7-alpine',
    config: {
      ports: ['6379:6379'],
      environment: {
        REDIS_PASSWORD: 'secure'
      }
    }
  },
  sandbox: {
    enabled: true,
    policies: {
      network: 'host-only',
      cpu: 0.5,
      memory: '256MB'
    }
  },
  resources: {
    monitoring: true,
    limits: {
      cpu: 1.0,
      memory: '512MB'
    }
  }
}
```

### MCP Server Integration

```typescript
const mcpConfig = {
  source: {
    type: 'mcp',
    identifier: '@modelcontextprotocol/server-filesystem',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem']
    }
  },
  communication: {
    protocol: 'stdio',
    encoding: 'json'
  },
  recovery: {
    enabled: true,
    maxRetries: 5,
    strategy: 'exponential-backoff'
  }
}
```

## Configuration Options

### Source Configuration

| Property | Type | Description |
|----------|------|-------------|
| type | `'npm' \| 'docker' \| 'git' \| 'url' \| 'mcp' \| 'api' \| 'binary'` | Type of external source |
| identifier | `string` | Package name, image, URL, etc. |
| version | `string?` | Version specification |
| config | `object?` | Source-specific configuration |

### Sandbox Configuration

| Property | Type | Description |
|----------|------|-------------|
| enabled | `boolean` | Enable sandboxing |
| policies | `SandboxPolicy` | Security policies |
| isolation | `'process' \| 'container' \| 'vm'` | Isolation level |

### Resource Configuration

| Property | Type | Description |
|----------|------|-------------|
| monitoring | `boolean` | Enable resource monitoring |
| limits | `ResourceLimits` | Resource usage limits |
| alertThresholds | `ResourceLimits` | Alert threshold values |

### Lifecycle Configuration

| Property | Type | Description |
|----------|------|-------------|
| autoStart | `boolean` | Auto-start on mount |
| onInitialize | `function` | Initialization hook |
| onReady | `function` | Ready state hook |
| onError | `function` | Error handler |
| onStop | `function` | Stop hook |
| onDestroy | `function` | Cleanup hook |

### Recovery Configuration

| Property | Type | Description |
|----------|------|-------------|
| enabled | `boolean` | Enable auto-recovery |
| maxRetries | `number` | Maximum retry attempts |
| retryDelay | `number` | Base delay between retries |
| strategy | `string` | Retry strategy |
| onRecoveryFailed | `function` | Recovery failure callback |

## Events

The primitive emits the following events:

- `onInitialize` - Starting initialization
- `onReady` - Ready for use
- `onError` - Error occurred
- `onCrash` - Crashed unexpectedly
- `onRecover` - Attempting recovery
- `onStop` - Stopping
- `onDestroy` - Being destroyed
- `onMessage` - Message from external
- `onResourceLimit` - Resource limit reached

## Security Considerations

1. **Always enable sandboxing** for untrusted sources
2. **Set appropriate resource limits** to prevent resource exhaustion
3. **Use restricted network policies** unless full access is required
4. **Implement proper authentication** for external services
5. **Monitor health and resource usage** continuously
6. **Have recovery strategies** for critical integrations

## Performance Best Practices

1. **Lazy loading** - Load external resources only when needed
2. **Resource pooling** - Reuse connections and instances
3. **Caching** - Cache external responses when appropriate
4. **Monitoring** - Track performance metrics
5. **Timeouts** - Set appropriate timeouts for all operations

## Integration with Higher-Level Constructs

The External Construct Primitive serves as the foundation for higher-level constructs:

### L1 Constructs (Built on this primitive)
- `ManagedNPMPackage` - NPM packages with version management
- `SecureDockerContainer` - Docker containers with security policies
- `AuthenticatedMCPServer` - MCP servers with authentication
- `CachedAPIClient` - API clients with caching

### L2 Patterns
- `MicroserviceOrchestrator` - Orchestrate multiple containers
- `PackageManager` - Manage multiple NPM packages
- `APIGateway` - Aggregate multiple API endpoints

### L3 Applications
- `DevelopmentEnvironment` - Full IDE with external tools
- `DeploymentPipeline` - CI/CD with external services

## Testing

The primitive includes comprehensive test coverage:

```typescript
import { ExternalConstructPrimitiveConstruct } from '../ExternalConstructPrimitive'

describe('ExternalConstructPrimitive', () => {
  it('should initialize with configuration', async () => {
    const construct = new ExternalConstructPrimitiveConstruct()
    await construct.initialize(config)
    expect(construct.getState()).toBe('ready')
  })
})
```

## Examples

See [examples.tsx](./examples.tsx) for comprehensive usage examples including:
- NPM package integration
- Docker container management
- MCP server connections
- API endpoint integration
- Git repository usage
- Binary executable wrapping
- Multi-source integration

## Contributing

When extending or modifying this primitive:

1. Maintain the L0 philosophy - no opinions, just raw functionality
2. Ensure backward compatibility
3. Add comprehensive tests
4. Update documentation
5. Follow the existing patterns

## Related Constructs

- [WebSocketPrimitive](../mcp/WebSocketPrimitive.tsx) - For WebSocket communication
- [DockerContainerPrimitive](../DockerContainerPrimitive.ts) - Specific Docker integration
- [APIEndpointPrimitive](../ApiEndpointPrimitive.ts) - REST API integration

## License

MIT - Part of the Love Claude Code platform