import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import puppeteer, { Browser, Page } from 'puppeteer'

// Tool implementations
import { inspectElement, getElementInfo } from './tools/dom.js'
import { getComputedStyles, validateStyling } from './tools/styling.js'
import { captureScreenshot } from './tools/screenshot.js'
import { clickElement, typeInElement, navigateTo } from './tools/interaction.js'
import { checkElementVisible, validateLayout } from './tools/validation.js'

class LoveClaudeCodeMCP {
  private server: Server
  private browser: Browser | null = null
  private page: Page | null = null
  
  constructor() {
    this.server = new Server({
      name: 'love-claude-code-mcp',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      }
    })
    
    this.setupHandlers()
  }
  
  private async ensureBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ 
        headless: process.env.MCP_UI_HEADLESS === 'true',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    if (!this.page) {
      this.page = await this.browser.newPage()
      const targetUrl = process.env.MCP_UI_TARGET_URL || 'http://localhost:3000'
      try {
        await this.page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 10000 })
      } catch (error) {
        console.error(`Failed to connect to ${targetUrl}. Make sure the dev server is running.`)
        throw error
      }
    }
    return { browser: this.browser, page: this.page }
  }
  
  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'inspectElement',
          description: 'Inspect a DOM element by selector and get its properties',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the element' }
            },
            required: ['selector']
          }
        },
        {
          name: 'getPageScreenshot',
          description: 'Capture a screenshot of the current page',
          inputSchema: {
            type: 'object',
            properties: {
              fullPage: { type: 'boolean', description: 'Capture full page or viewport only' }
            }
          }
        },
        {
          name: 'clickElement',
          description: 'Click on an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the element' }
            },
            required: ['selector']
          }
        },
        {
          name: 'typeInElement',
          description: 'Type text into an input element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the input' },
              text: { type: 'string', description: 'Text to type' }
            },
            required: ['selector', 'text']
          }
        },
        {
          name: 'navigateTo',
          description: 'Navigate to a URL or route',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL or path to navigate to' }
            },
            required: ['url']
          }
        },
        {
          name: 'checkElementVisible',
          description: 'Check if an element is visible on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the element' }
            },
            required: ['selector']
          }
        },
        {
          name: 'getComputedStyles',
          description: 'Get computed CSS styles for an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the element' },
              properties: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Specific CSS properties to get (optional)'
              }
            },
            required: ['selector']
          }
        },
        {
          name: 'validateLayout',
          description: 'Validate layout and check for common issues',
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
      const { page } = await this.ensureBrowser()
      
      try {
        switch (name) {
          case 'inspectElement':
            return await inspectElement(page, args?.selector as string)
            
          case 'getPageScreenshot':
            return await captureScreenshot(page, args?.fullPage as boolean || false)
            
          case 'clickElement':
            return await clickElement(page, args?.selector as string)
            
          case 'typeInElement':
            return await typeInElement(page, args?.selector as string, args?.text as string)
            
          case 'navigateTo':
            return await navigateTo(page, args?.url as string)
            
          case 'checkElementVisible':
            return await checkElementVisible(page, args?.selector as string)
            
          case 'getComputedStyles':
            return await getComputedStyles(page, args?.selector as string, args?.properties as string[])
            
          case 'validateLayout':
            return await validateLayout(page)
            
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        }
      }
    })
  }
  
  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Love Claude Code MCP Server started')
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

// Start the server
const mcpServer = new LoveClaudeCodeMCP()
mcpServer.start().catch(console.error)

// Cleanup on exit
process.on('SIGINT', async () => {
  await mcpServer.cleanup()
  process.exit(0)
})