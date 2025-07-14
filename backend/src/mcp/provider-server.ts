import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js'
import { ProjectRequirements, ProviderType, MCPToolResult } from './types.js'
import { logger } from '../providers/aws/utils/logger.js'

// Tool implementations
import { analyzeProjectRequirements } from './tools/analyze-requirements.js'
import { listProviders } from './tools/list-providers.js'
import { getProviderConfiguration } from './tools/get-config.js'
import { switchProvider } from './tools/switch-provider.js'
import { estimateCosts } from './tools/estimate-costs.js'
import { checkProviderHealth } from './tools/check-health.js'
import { migrateData } from './tools/migrate-data.js'
import { compareProviders as compareProvidersDetail } from './tools/compare-providers.js'

export class ProviderMCPServer {
  private server: Server
  
  constructor() {
    this.server = new Server({
      name: 'love-claude-code-providers',
      version: '1.0.0',
      capabilities: {
        tools: {}
      }
    })
    
    this.setupHandlers()
  }
  
  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools()
    }))
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      
      try {
        const result = await this.executeTool(name, args)
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage
            })
          }],
          isError: true
        }
      }
    })
  }
  
  private getTools(): Tool[] {
    return [
      {
        name: 'analyze_project_requirements',
        description: 'Analyze project requirements and recommend the best backend provider',
        inputSchema: {
          type: 'object',
          properties: {
            projectType: {
              type: 'string',
              enum: ['web', 'mobile', 'desktop', 'api', 'hybrid'],
              description: 'Type of project being built'
            },
            expectedUsers: {
              type: 'number',
              description: 'Expected number of users'
            },
            expectedTraffic: {
              type: 'string',
              description: 'Expected traffic (e.g., "100000 requests/month")'
            },
            dataVolume: {
              type: 'string',
              description: 'Expected data volume (e.g., "10GB")'
            },
            features: {
              type: 'object',
              properties: {
                authentication: { type: 'boolean' },
                realtime: { type: 'boolean' },
                fileStorage: { type: 'boolean' },
                serverless: { type: 'boolean' },
                notifications: { type: 'boolean' },
                analytics: { type: 'boolean' },
                search: { type: 'boolean' },
                ml: { type: 'boolean' }
              }
            },
            compliance: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required compliance standards (e.g., GDPR, HIPAA)'
            },
            budget: {
              type: 'object',
              properties: {
                monthly: { type: 'number' },
                currency: { type: 'string' }
              }
            },
            preferredRegions: {
              type: 'array',
              items: { type: 'string' }
            },
            existingProvider: {
              type: 'string',
              enum: ['local', 'firebase', 'aws']
            }
          },
          required: ['projectType', 'expectedUsers']
        }
      },
      {
        name: 'list_providers',
        description: 'List all available backend providers with their capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            feature: {
              type: 'string',
              description: 'Filter providers by specific feature'
            }
          }
        }
      },
      {
        name: 'get_provider_config',
        description: 'Get current provider configuration for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'switch_provider',
        description: 'Switch to a different backend provider',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID'
            },
            newProvider: {
              type: 'string',
              enum: ['local', 'firebase', 'aws'],
              description: 'Target provider'
            },
            migrate: {
              type: 'boolean',
              description: 'Whether to migrate existing data'
            }
          },
          required: ['projectId', 'newProvider']
        }
      },
      {
        name: 'estimate_costs',
        description: 'Estimate monthly and yearly costs for different providers',
        inputSchema: {
          type: 'object',
          properties: {
            requirements: {
              type: 'object',
              description: 'Project requirements (same as analyze_project_requirements)'
            },
            providers: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['local', 'firebase', 'aws']
              },
              description: 'Providers to estimate costs for'
            }
          },
          required: ['requirements']
        }
      },
      {
        name: 'check_provider_health',
        description: 'Check health status of active providers',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (optional, checks all if not provided)'
            }
          }
        }
      },
      {
        name: 'migrate_data',
        description: 'Create a migration plan or execute migration between providers',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID'
            },
            fromProvider: {
              type: 'string',
              enum: ['local', 'firebase', 'aws']
            },
            toProvider: {
              type: 'string',
              enum: ['local', 'firebase', 'aws']
            },
            execute: {
              type: 'boolean',
              description: 'Execute migration (false = plan only)'
            },
            options: {
              type: 'object',
              properties: {
                includeUsers: { type: 'boolean' },
                includeData: { type: 'boolean' },
                includeFiles: { type: 'boolean' },
                dryRun: { type: 'boolean' }
              }
            }
          },
          required: ['projectId', 'fromProvider', 'toProvider']
        }
      },
      {
        name: 'compare_providers',
        description: 'Compare multiple providers side-by-side',
        inputSchema: {
          type: 'object',
          properties: {
            providers: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['local', 'firebase', 'aws']
              },
              description: 'Providers to compare'
            },
            aspects: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['pricing', 'features', 'compliance', 'scalability', 'ease-of-use']
              },
              description: 'Aspects to compare'
            }
          },
          required: ['providers']
        }
      }
    ]
  }
  
  private async executeTool(name: string, args?: unknown): Promise<MCPToolResult> {
    logger.info(`Executing MCP tool: ${name}`, { args })
    
    switch (name) {
      case 'analyze_project_requirements':
        return analyzeProjectRequirements(args as ProjectRequirements)
        
      case 'list_providers':
        return listProviders(args as { feature?: string })
        
      case 'get_provider_config':
        return getProviderConfiguration(args as { projectId: string })
        
      case 'switch_provider':
        return switchProvider(args as {
          projectId: string
          newProvider: ProviderType
          migrate?: boolean
        })
        
      case 'estimate_costs':
        return estimateCosts(args as {
          requirements: ProjectRequirements
          providers?: ProviderType[]
        })
        
      case 'check_provider_health':
        return checkProviderHealth(args as { projectId?: string })
        
      case 'migrate_data':
        return migrateData(args as {
          projectId: string
          fromProvider: ProviderType
          toProvider: ProviderType
          execute?: boolean
          options?: any
        })
        
      case 'compare_providers':
        return compareProvidersDetail(args as {
          providers: ProviderType[]
          aspects?: string[]
        })
        
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  }
  
  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    logger.info('Provider MCP Server started')
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ProviderMCPServer()
  server.start().catch((error) => {
    logger.error('Failed to start MCP server', { error })
    process.exit(1)
  })
}