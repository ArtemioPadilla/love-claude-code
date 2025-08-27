/**
 * External Construct Primitive Examples
 * 
 * Comprehensive examples showing how to integrate various external dependencies
 * using the ExternalConstructPrimitive foundation.
 */

import React from 'react'
import { 
  ExternalConstructPrimitive,
  ExternalConstructPrimitiveConstruct,
  type ExternalConstructConfig 
} from './ExternalConstructPrimitive'

/**
 * Example 1: NPM Package Integration
 * Load and use an NPM package with sandboxing
 */
export const NPMPackageExample: React.FC = () => {
  const config: ExternalConstructConfig = {
    source: {
      type: 'npm',
      identifier: 'lodash',
      version: '^4.17.21'
    },
    sandbox: {
      enabled: true,
      policies: {
        network: 'none',
        filesystem: 'none',
        cpu: 0.25,
        memory: '128MB'
      }
    },
    lifecycle: {
      onReady: async (instance) => {
        console.log('Lodash loaded and ready:', instance)
      },
      onError: async (error) => {
        console.error('Failed to load lodash:', error)
      }
    }
  }
  
  return (
    <ExternalConstructPrimitive config={config}>
      {(props: any) => (
        <div>
          <h3>NPM Package: {config.source.identifier}</h3>
          <p>State: {props.state}</p>
          <button 
            onClick={() => {
              const result = props.execute('sortBy', 
                [{name: 'b'}, {name: 'a'}], 
                'name'
              )
              console.log('Sorted:', result)
            }}
          >
            Test Lodash sortBy
          </button>
        </div>
      )}
    </ExternalConstructPrimitive>
  )
}

/**
 * Example 2: Docker Container Integration
 * Connect to a Redis container with resource limits
 */
export const DockerContainerExample: React.FC = () => {
  const config: ExternalConstructConfig = {
    source: {
      type: 'docker',
      identifier: 'redis:7-alpine',
      config: {
        name: 'love-claude-redis',
        ports: ['6379:6379'],
        environment: {
          REDIS_PASSWORD: 'secure-password'
        }
      }
    },
    sandbox: {
      enabled: true,
      policies: {
        network: 'host-only',
        cpu: 0.5,
        memory: '256MB',
        filesystem: 'none'
      }
    },
    resources: {
      monitoring: true,
      limits: {
        cpu: 1.0,
        memory: '512MB',
        disk: '1GB'
      },
      alertThresholds: {
        cpu: 0.8,
        memory: '400MB'
      }
    },
    recovery: {
      enabled: true,
      maxRetries: 3,
      strategy: 'exponential-backoff'
    }
  }
  
  return (
    <ExternalConstructPrimitive 
      config={config}
      onMetricsUpdate={(metrics) => {
        console.log('Redis metrics:', metrics)
      }}
      onHealthCheck={(health) => {
        console.log('Redis health:', health)
      }}
    >
      {(props: any) => (
        <div>
          <h3>Docker Container: Redis</h3>
          <p>State: {props.state}</p>
          <p>CPU: {props.metrics.cpu.toFixed(2)}%</p>
          <p>Memory: {(props.metrics.memory / (1024 * 1024)).toFixed(2)} MB</p>
          <p>Health: {props.health.healthy ? '✅' : '❌'}</p>
        </div>
      )}
    </ExternalConstructPrimitive>
  )
}

/**
 * Example 3: MCP Server Integration
 * Connect to an MCP filesystem server
 */
export const MCPServerExample: React.FC = () => {
  const config: ExternalConstructConfig = {
    source: {
      type: 'mcp',
      identifier: '@modelcontextprotocol/server-filesystem',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          MCP_SERVER_ROOT: '/Users/shared/documents'
        }
      }
    },
    communication: {
      protocol: 'stdio',
      encoding: 'json',
      messageHandler: (message) => {
        console.log('MCP message:', message)
      }
    },
    lifecycle: {
      onReady: async () => {
        console.log('MCP server ready')
      }
    },
    recovery: {
      enabled: true,
      maxRetries: 5,
      retryDelay: 2000,
      onRecoveryFailed: (error) => {
        console.error('MCP server recovery failed:', error)
      }
    }
  }
  
  return (
    <ExternalConstructPrimitive config={config}>
      {(props: any) => (
        <div>
          <h3>MCP Server: Filesystem</h3>
          <p>State: {props.state}</p>
          <button onClick={() => props.emit('onMessage', {
            jsonrpc: '2.0',
            method: 'tools/list',
            id: 1
          })}>
            List Available Tools
          </button>
          <div>
            <h4>Logs:</h4>
            <pre>{props.logs.slice(-5).join('\n')}</pre>
          </div>
        </div>
      )}
    </ExternalConstructPrimitive>
  )
}

/**
 * Example 4: API Endpoint Integration
 * Connect to an external REST API
 */
export const APIEndpointExample: React.FC = () => {
  const config: ExternalConstructConfig = {
    source: {
      type: 'api',
      identifier: 'https://api.github.com',
      config: {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Love-Claude-Code'
        },
        timeout: 5000
      }
    },
    sandbox: {
      enabled: true,
      policies: {
        network: 'restricted',
        filesystem: 'none'
      }
    },
    resources: {
      monitoring: true
    }
  }
  
  return (
    <ExternalConstructPrimitive config={config}>
      {(props: any) => (
        <div>
          <h3>API: GitHub</h3>
          <p>State: {props.state}</p>
          <button onClick={async () => {
            const response = await fetch(`${config.source.identifier}/users/anthropics`)
            const data = await response.json()
            console.log('GitHub user data:', data)
          }}>
            Fetch Anthropic User Data
          </button>
        </div>
      )}
    </ExternalConstructPrimitive>
  )
}

/**
 * Example 5: Git Repository Integration
 * Clone and use a Git repository
 */
export const GitRepositoryExample: React.FC = () => {
  const config: ExternalConstructConfig = {
    source: {
      type: 'git',
      identifier: 'https://github.com/anthropics/anthropic-sdk-typescript.git',
      version: 'main',
      config: {
        shallow: true,
        depth: 1
      }
    },
    sandbox: {
      enabled: true,
      policies: {
        network: 'restricted',
        filesystem: 'restricted',
        cpu: 0.5,
        memory: '512MB'
      }
    }
  }
  
  return (
    <ExternalConstructPrimitive config={config}>
      {(props: any) => (
        <div>
          <h3>Git Repository: Anthropic SDK</h3>
          <p>State: {props.state}</p>
          <p>Repository: {config.source.identifier}</p>
          <p>Branch: {config.source.version}</p>
        </div>
      )}
    </ExternalConstructPrimitive>
  )
}

/**
 * Example 6: Binary Executable Integration
 * Run an external binary with sandboxing
 */
export const BinaryExecutableExample: React.FC = () => {
  const config: ExternalConstructConfig = {
    source: {
      type: 'binary',
      identifier: '/usr/local/bin/ffmpeg',
      config: {
        args: ['-version']
      }
    },
    sandbox: {
      enabled: true,
      isolation: 'process',
      policies: {
        network: 'none',
        filesystem: 'read-only',
        cpu: 1.0,
        memory: '1GB',
        timeout: 30000
      }
    },
    resources: {
      monitoring: true,
      limits: {
        cpu: 2.0,
        memory: '2GB'
      }
    }
  }
  
  return (
    <ExternalConstructPrimitive config={config}>
      {(props: any) => (
        <div>
          <h3>Binary: FFmpeg</h3>
          <p>State: {props.state}</p>
          <button onClick={() => {
            props.execute('run', ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4'])
          }}>
            Convert Video
          </button>
        </div>
      )}
    </ExternalConstructPrimitive>
  )
}

/**
 * Example 7: Advanced Multi-Source Integration
 * Demonstrates combining multiple external sources
 */
export class AdvancedIntegrationExample {
  private npmConstruct: ExternalConstructPrimitiveConstruct
  private dockerConstruct: ExternalConstructPrimitiveConstruct
  private mcpConstruct: ExternalConstructPrimitiveConstruct
  
  constructor() {
    this.npmConstruct = new ExternalConstructPrimitiveConstruct()
    this.dockerConstruct = new ExternalConstructPrimitiveConstruct()
    this.mcpConstruct = new ExternalConstructPrimitiveConstruct()
  }
  
  async initialize() {
    // Initialize NPM package (data processing)
    await this.npmConstruct.initialize({
      source: {
        type: 'npm',
        identifier: 'ramda',
        version: 'latest'
      },
      sandbox: {
        enabled: true,
        policies: {
          network: 'none',
          filesystem: 'none'
        }
      }
    })
    
    // Initialize Docker container (database)
    await this.dockerConstruct.initialize({
      source: {
        type: 'docker',
        identifier: 'postgres:15-alpine',
        config: {
          environment: {
            POSTGRES_PASSWORD: 'secure',
            POSTGRES_DB: 'loveClaudeCode'
          },
          ports: ['5432:5432']
        }
      },
      sandbox: {
        enabled: true,
        policies: {
          network: 'host-only',
          cpu: 1.0,
          memory: '1GB'
        }
      }
    })
    
    // Initialize MCP server (AI capabilities)
    await this.mcpConstruct.initialize({
      source: {
        type: 'mcp',
        identifier: 'custom-ai-server',
        config: {
          command: 'node',
          args: ['./mcp-ai-server.js']
        }
      },
      communication: {
        protocol: 'websocket',
        encoding: 'json'
      },
      recovery: {
        enabled: true,
        maxRetries: 10,
        strategy: 'exponential-backoff'
      }
    })
  }
  
  async processData(data: any[]) {
    // Use Ramda for functional data processing
    const R = this.npmConstruct.getInstance()
    const processed = await this.npmConstruct.execute('pipe', [
      R.filter((x: any) => x.active),
      R.sortBy(R.prop('priority')),
      R.take(10)
    ], data)
    
    // Store in Postgres
    // ... database operations
    
    // Get AI insights via MCP
    // ... MCP communication
    
    return processed
  }
  
  async destroy() {
    await Promise.all([
      this.npmConstruct.destroy(),
      this.dockerConstruct.destroy(),
      this.mcpConstruct.destroy()
    ])
  }
}

/**
 * Example Usage in Love Claude Code Platform
 */
export const PlatformIntegrationExample = () => {
  // This shows how the ExternalConstructPrimitive enables
  // the platform to integrate any external dependency safely
  
  const integrations = [
    {
      name: 'TypeScript Compiler',
      source: { type: 'npm', identifier: 'typescript' },
      purpose: 'Code compilation and type checking'
    },
    {
      name: 'ESLint',
      source: { type: 'npm', identifier: 'eslint' },
      purpose: 'Code linting and formatting'
    },
    {
      name: 'PostgreSQL',
      source: { type: 'docker', identifier: 'postgres:15' },
      purpose: 'Project data storage'
    },
    {
      name: 'Redis',
      source: { type: 'docker', identifier: 'redis:7' },
      purpose: 'Caching and session management'
    },
    {
      name: 'Claude API',
      source: { type: 'api', identifier: 'https://api.anthropic.com' },
      purpose: 'AI-powered code generation'
    },
    {
      name: 'GitHub API',
      source: { type: 'api', identifier: 'https://api.github.com' },
      purpose: 'Version control integration'
    },
    {
      name: 'MCP Filesystem',
      source: { type: 'mcp', identifier: 'filesystem-server' },
      purpose: 'File system operations'
    },
    {
      name: 'MCP Git',
      source: { type: 'mcp', identifier: 'git-server' },
      purpose: 'Git operations'
    }
  ]
  
  return (
    <div>
      <h2>Love Claude Code External Integrations</h2>
      <p>
        The ExternalConstructPrimitive enables safe integration of any 
        external dependency while maintaining security, isolation, and 
        resource control.
      </p>
      
      <h3>Active Integrations:</h3>
      <ul>
        {integrations.map((integration, i) => (
          <li key={i}>
            <strong>{integration.name}</strong> ({integration.source.type})
            <br />
            <small>{integration.purpose}</small>
          </li>
        ))}
      </ul>
      
      <p>
        Each integration runs in its own sandbox with configurable:
      </p>
      <ul>
        <li>Network policies</li>
        <li>Filesystem access</li>
        <li>CPU and memory limits</li>
        <li>Execution timeouts</li>
        <li>Recovery strategies</li>
        <li>Health monitoring</li>
      </ul>
    </div>
  )
}