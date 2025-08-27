/**
 * External Construct Primitive Tests
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { 
  ExternalConstructPrimitive,
  ExternalConstructPrimitiveConstruct,
  type ExternalConstructConfig,
  type ExternalConstructState
} from '../ExternalConstructPrimitive'

describe('ExternalConstructPrimitive', () => {
  describe('Component', () => {
    it('should initialize with uninitialized state', () => {
      let capturedState: ExternalConstructState | undefined
      
      const config: ExternalConstructConfig = {
        source: {
          type: 'npm',
          identifier: 'test-package'
        }
      }
      
      render(
        <ExternalConstructPrimitive 
          config={config}
          onStateChange={(state) => { capturedState = state }}
        />
      )
      
      expect(capturedState).toBe('uninitialized')
    })
    
    it('should support all external source types', () => {
      const sourceTypes = ['npm', 'docker', 'git', 'url', 'mcp', 'api', 'binary']
      
      sourceTypes.forEach(type => {
        const config: ExternalConstructConfig = {
          source: {
            type: type as any,
            identifier: `test-${type}`
          }
        }
        
        const { unmount } = render(
          <ExternalConstructPrimitive config={config} />
        )
        
        unmount()
      })
    })
    
    it('should handle sandbox configuration', () => {
      const config: ExternalConstructConfig = {
        source: {
          type: 'docker',
          identifier: 'test-image'
        },
        sandbox: {
          enabled: true,
          policies: {
            network: 'restricted',
            filesystem: 'read-only',
            cpu: 0.5,
            memory: '512MB',
            timeout: 30000
          }
        }
      }
      
      render(<ExternalConstructPrimitive config={config} />)
    })
    
    it('should support resource monitoring', async () => {
      let metrics: any
      
      const config: ExternalConstructConfig = {
        source: {
          type: 'npm',
          identifier: 'test-package'
        },
        resources: {
          monitoring: true,
          limits: {
            cpu: 1.0,
            memory: '1GB'
          }
        }
      }
      
      render(
        <ExternalConstructPrimitive 
          config={config}
          onMetricsUpdate={(m) => { metrics = m }}
        />
      )
      
      await waitFor(() => {
        expect(metrics).toBeDefined()
        expect(metrics.cpu).toBeDefined()
        expect(metrics.memory).toBeDefined()
      }, { timeout: 2000 })
    })
    
    it('should handle lifecycle hooks', async () => {
      const onInitialize = jest.fn()
      const onReady = jest.fn()
      
      const config: ExternalConstructConfig = {
        source: {
          type: 'npm',
          identifier: 'test-package'
        },
        lifecycle: {
          onInitialize,
          onReady,
          autoStart: true
        }
      }
      
      render(<ExternalConstructPrimitive config={config} />)
      
      await waitFor(() => {
        expect(onInitialize).toHaveBeenCalled()
      })
    })
    
    it('should support recovery configuration', () => {
      const config: ExternalConstructConfig = {
        source: {
          type: 'mcp',
          identifier: 'test-server'
        },
        recovery: {
          enabled: true,
          maxRetries: 3,
          retryDelay: 1000,
          strategy: 'exponential-backoff'
        }
      }
      
      render(<ExternalConstructPrimitive config={config} />)
    })
    
    it('should handle communication protocols', () => {
      const protocols = ['stdio', 'ipc', 'websocket', 'http', 'grpc']
      
      protocols.forEach(protocol => {
        const config: ExternalConstructConfig = {
          source: {
            type: 'mcp',
            identifier: 'test-server'
          },
          communication: {
            protocol: protocol as any,
            encoding: 'json'
          }
        }
        
        const { unmount } = render(
          <ExternalConstructPrimitive config={config} />
        )
        
        unmount()
      })
    })
  })
  
  describe('Construct Class', () => {
    it('should initialize with configuration', async () => {
      const construct = new ExternalConstructPrimitiveConstruct()
      
      const config: ExternalConstructConfig = {
        source: {
          type: 'npm',
          identifier: 'lodash',
          version: '4.17.21'
        }
      }
      
      await construct.initialize(config)
      
      expect(construct.getState()).toBe('ready')
      expect(construct.getConfiguration()).toEqual(config)
    })
    
    it('should provide execute method for external instances', async () => {
      const construct = new ExternalConstructPrimitiveConstruct()
      
      await construct.initialize({
        source: {
          type: 'npm',
          identifier: 'test-package'
        }
      })
      
      // Should throw for non-existent methods
      await expect(construct.execute('nonExistentMethod')).rejects.toThrow()
    })
    
    it('should handle different source types', async () => {
      const construct = new ExternalConstructPrimitiveConstruct()
      
      // Test Docker source
      await construct.initialize({
        source: {
          type: 'docker',
          identifier: 'redis:alpine'
        }
      })
      
      const dockerInstance = construct.getInstance()
      expect(dockerInstance.type).toBe('docker')
      expect(dockerInstance.image).toBe('redis:alpine')
      
      // Test MCP source
      await construct.initialize({
        source: {
          type: 'mcp',
          identifier: 'test-mcp-server'
        }
      })
      
      const mcpInstance = construct.getInstance()
      expect(mcpInstance.type).toBe('mcp')
      expect(mcpInstance.server).toBe('test-mcp-server')
    })
    
    it('should clean up on destroy', async () => {
      const construct = new ExternalConstructPrimitiveConstruct()
      
      await construct.initialize({
        source: {
          type: 'npm',
          identifier: 'test-package'
        }
      })
      
      await construct.destroy()
      
      expect(construct.getState()).toBe('destroyed')
      expect(construct.getInstance()).toBeNull()
    })
  })
  
  describe('Integration Scenarios', () => {
    it('should integrate NPM packages', async () => {
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
            filesystem: 'none'
          }
        }
      }
      
      const construct = new ExternalConstructPrimitiveConstruct()
      await construct.initialize(config)
      
      expect(construct.getState()).toBe('ready')
    })
    
    it('should integrate Docker containers', async () => {
      const config: ExternalConstructConfig = {
        source: {
          type: 'docker',
          identifier: 'nginx:alpine',
          config: {
            ports: ['80:80'],
            volumes: ['/app:/usr/share/nginx/html']
          }
        },
        sandbox: {
          enabled: true,
          policies: {
            network: 'host-only',
            cpu: 0.5,
            memory: '256MB'
          }
        }
      }
      
      const construct = new ExternalConstructPrimitiveConstruct()
      await construct.initialize(config)
      
      const instance = construct.getInstance()
      expect(instance.sandbox).toBeDefined()
      expect(instance.config.ports).toContain('80:80')
    })
    
    it('should integrate MCP servers', async () => {
      const config: ExternalConstructConfig = {
        source: {
          type: 'mcp',
          identifier: 'filesystem-server',
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
          maxRetries: 5
        }
      }
      
      const construct = new ExternalConstructPrimitiveConstruct()
      await construct.initialize(config)
      
      const instance = construct.getInstance()
      expect(instance.communication).toBeDefined()
      expect(instance.communication.protocol).toBe('stdio')
    })
  })
})