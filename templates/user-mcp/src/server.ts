import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

// Import your app-specific tools
import { authTools, executeAuthTool } from './tools/auth.js'
import { dataTools, executeDataTool } from './tools/data.js'
import { uiTools, executeUITool } from './tools/ui.js'

class {{ProjectName}}MCPServer {
  private server: Server
  
  constructor() {
    this.server = new Server({
      name: '{{projectName}}-mcp',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      }
    })
    
    this.setupHandlers()
  }
  
  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        ...authTools,
        ...dataTools,
        ...uiTools,
        // Add custom tools here
        {
          name: 'get_app_status',
          description: 'Get the current status of the {{projectName}} application',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ] as Tool[]
    }))
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      
      try {
        // Route to appropriate tool handler
        if (name.startsWith('auth_')) {
          return await executeAuthTool(name, args)
        } else if (name.startsWith('data_')) {
          return await executeDataTool(name, args)
        } else if (name.startsWith('ui_')) {
          return await executeUITool(name, args)
        }
        
        // Handle custom tools
        switch (name) {
          case 'get_app_status':
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'running',
                  version: '1.0.0',
                  uptime: process.uptime(),
                  environment: process.env.NODE_ENV || 'development'
                }, null, 2)
              }]
            }
            
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        }
      }
    })
  }
  
  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('{{ProjectName}} MCP Server started')
  }
}

// Start the server
const server = new {{ProjectName}}MCPServer()
server.start().catch(console.error)