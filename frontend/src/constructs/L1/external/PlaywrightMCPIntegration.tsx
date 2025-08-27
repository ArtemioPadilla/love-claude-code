/**
 * Playwright MCP Integration (L1)
 * 
 * Wraps the Playwright MCP server for browser automation and testing.
 * Provides methods for navigation, interaction, screenshots, and more.
 */

import React from 'react'
import { L1ExternalConstruct } from '../../base/L1ExternalConstruct'
import { ConstructDefinition, MCPTool, MCPToolResponse } from '../../types'
import { Button } from '../../../components/UI/Button'

export interface PlaywrightMCPConfig {
  /** MCP server endpoint */
  endpoint?: string
  /** Browser type to use */
  browser?: 'chromium' | 'firefox' | 'webkit'
  /** Run in headless mode */
  headless?: boolean
  /** Default timeout for actions */
  timeout?: number
  /** Screenshot options */
  screenshotOptions?: {
    fullPage?: boolean
    quality?: number
    type?: 'png' | 'jpeg'
  }
  /** Viewport size */
  viewport?: {
    width: number
    height: number
  }
  /** User agent string */
  userAgent?: string
  /** Enable request interception */
  interceptRequests?: boolean
  /** Enable response mocking */
  enableMocking?: boolean
}

export interface PlaywrightAction {
  type: 'navigate' | 'click' | 'type' | 'screenshot' | 'waitFor' | 'evaluate'
  target?: string
  value?: any
  options?: Record<string, any>
}

export interface PlaywrightMCPIntegrationProps {
  config?: PlaywrightMCPConfig
  onAction?: (action: PlaywrightAction, result: any) => void
  onError?: (error: Error) => void
  debug?: boolean
}

/**
 * L1 Playwright MCP Integration
 * 
 * Provides browser automation capabilities through the Playwright MCP server.
 */
export class PlaywrightMCPIntegration extends L1ExternalConstruct {
  private static metadata: ConstructDefinition = {
    id: 'playwright-mcp-integration',
    name: 'Playwright MCP Integration',
    type: 'Infrastructure',
    level: 'L1',
    version: '1.0.0',
    description: 'Browser automation and testing through Playwright MCP server',
    author: 'Love Claude Code',
    tags: ['mcp', 'playwright', 'testing', 'automation', 'browser'],
    license: 'MIT',
    security: [
      {
        aspect: 'browser-isolation',
        description: 'Runs browsers in isolated contexts',
        severity: 'medium',
        recommendations: ['Use headless mode in production', 'Limit resource usage']
      },
      {
        aspect: 'script-injection',
        description: 'Can execute arbitrary JavaScript in pages',
        severity: 'high',
        recommendations: ['Validate all scripts', 'Use CSP policies', 'Sanitize inputs']
      }
    ],
    inputs: [
      {
        name: 'config',
        type: 'PlaywrightMCPConfig',
        description: 'Playwright MCP configuration',
        required: false,
        defaultValue: {}
      }
    ],
    outputs: [
      {
        name: 'browserInfo',
        type: 'object',
        description: 'Current browser information'
      },
      {
        name: 'pageInfo',
        type: 'object',
        description: 'Current page information'
      }
    ],
    examples: [
      {
        title: 'Basic Navigation and Screenshot',
        description: 'Navigate to a page and take a screenshot',
        code: `const playwright = new PlaywrightMCPIntegration({
  config: {
    browser: 'chromium',
    headless: true
  }
})

await playwright.connect()
await playwright.navigate('https://example.com')
const screenshot = await playwright.screenshot({ fullPage: true })`,
        language: 'typescript'
      }
    ]
  }
  
  private config: PlaywrightMCPConfig
  private browserContext: any = null
  private currentPage: any = null
  private actionHistory: PlaywrightAction[] = []
  
  constructor(config: PlaywrightMCPConfig = {}) {
    super(PlaywrightMCPIntegration.metadata)
    
    this.config = {
      endpoint: 'http://localhost:3000/mcp/playwright',
      browser: 'chromium',
      headless: true,
      timeout: 30000,
      screenshotOptions: {
        fullPage: false,
        quality: 80,
        type: 'png'
      },
      viewport: {
        width: 1280,
        height: 720
      },
      interceptRequests: false,
      enableMocking: false,
      ...config
    }
    
    // Configure external service
    this.configureService({
      name: 'playwright-mcp',
      endpoint: this.config.endpoint,
      requestTimeout: this.config.timeout
    })
    
    // Configure authentication if needed
    this.configureAuth({
      type: 'bearer',
      bearerToken: process.env.MCP_AUTH_TOKEN
    })
    
    // Set up lifecycle hooks
    this.onConnect = this.initializeBrowser.bind(this)
    this.onDisconnect = this.closeBrowser.bind(this)
    this.onError = this.handleBrowserError.bind(this)
  }
  
  /**
   * Initialize browser instance
   */
  private async initializeBrowser(): Promise<void> {
    const response = await this.callMCPTool('initialize_browser', {
      browser: this.config.browser,
      headless: this.config.headless,
      viewport: this.config.viewport,
      userAgent: this.config.userAgent
    })
    
    if (response.success) {
      this.browserContext = response.data.context
      this.emit('browser-initialized', {
        browser: this.config.browser,
        headless: this.config.headless
      })
    }
  }
  
  /**
   * Close browser instance
   */
  private async closeBrowser(): Promise<void> {
    if (this.browserContext) {
      await this.callMCPTool('close_browser', {
        contextId: this.browserContext.id
      })
      this.browserContext = null
      this.currentPage = null
      this.emit('browser-closed', {})
    }
  }
  
  /**
   * Handle browser errors
   */
  private handleBrowserError(error: Error): void {
    console.error('[PlaywrightMCP] Browser error:', error)
    this.emit('browser-error', { error: error.message })
  }
  
  /**
   * Perform connection to MCP server
   */
  protected async performConnect(): Promise<void> {
    // Test connection by calling a simple tool
    const response = await this.callMCPTool('ping', {})
    if (!response.success) {
      throw new Error('Failed to connect to Playwright MCP server')
    }
  }
  
  /**
   * Perform disconnection from MCP server
   */
  protected async performDisconnect(): Promise<void> {
    // Close any open browsers
    await this.closeBrowser()
  }
  
  /**
   * Call an MCP tool
   */
  private async callMCPTool(toolName: string, params: Record<string, any>): Promise<MCPToolResponse> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Playwright MCP server')
    }
    
    try {
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: toolName,
          params
        })
      }
      
      // Apply authentication
      await this.applyAuth(request)
      
      // Make the request (simplified - would use fetch or axios)
      const response = await fetch(`${this.config.endpoint}/tools/${toolName}`, request)
      const data = await response.json()
      
      return {
        success: response.ok,
        data: data.result,
        error: data.error,
        metadata: {
          tool: toolName,
          duration: data.duration || 0,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: toolName,
          duration: 0,
          timestamp: new Date().toISOString()
        }
      }
    }
  }
  
  /**
   * Navigate to a URL
   */
  async navigate(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    const action: PlaywrightAction = {
      type: 'navigate',
      target: url,
      options
    }
    
    const response = await this.callMCPTool('navigate', {
      url,
      ...options
    })
    
    if (response.success) {
      this.currentPage = response.data.page
      this.actionHistory.push(action)
      this.emit('navigated', { url, pageId: this.currentPage?.id })
    } else {
      throw new Error(`Navigation failed: ${response.error}`)
    }
  }
  
  /**
   * Click an element
   */
  async click(selector: string, options?: { 
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
    delay?: number
    force?: boolean
  }): Promise<void> {
    const action: PlaywrightAction = {
      type: 'click',
      target: selector,
      options
    }
    
    const response = await this.callMCPTool('click', {
      selector,
      ...options
    })
    
    if (response.success) {
      this.actionHistory.push(action)
      this.emit('clicked', { selector, options })
    } else {
      throw new Error(`Click failed: ${response.error}`)
    }
  }
  
  /**
   * Type text into an element
   */
  async type(selector: string, text: string, options?: {
    delay?: number
    clear?: boolean
  }): Promise<void> {
    const action: PlaywrightAction = {
      type: 'type',
      target: selector,
      value: text,
      options
    }
    
    const response = await this.callMCPTool('type', {
      selector,
      text,
      ...options
    })
    
    if (response.success) {
      this.actionHistory.push(action)
      this.emit('typed', { selector, text: text.substring(0, 20) + '...' })
    } else {
      throw new Error(`Type failed: ${response.error}`)
    }
  }
  
  /**
   * Take a screenshot
   */
  async screenshot(options?: {
    fullPage?: boolean
    clip?: { x: number; y: number; width: number; height: number }
    quality?: number
    type?: 'png' | 'jpeg'
    path?: string
  }): Promise<Buffer> {
    const action: PlaywrightAction = {
      type: 'screenshot',
      options: options || this.config.screenshotOptions
    }
    
    const response = await this.callMCPTool('screenshot', {
      ...this.config.screenshotOptions,
      ...options
    })
    
    if (response.success) {
      this.actionHistory.push(action)
      this.emit('screenshot-taken', { 
        fullPage: options?.fullPage || this.config.screenshotOptions?.fullPage,
        size: response.data.size 
      })
      return Buffer.from(response.data.buffer, 'base64')
    } else {
      throw new Error(`Screenshot failed: ${response.error}`)
    }
  }
  
  /**
   * Wait for an element or condition
   */
  async waitFor(target: string | (() => boolean), options?: {
    timeout?: number
    visible?: boolean
    hidden?: boolean
  }): Promise<void> {
    const action: PlaywrightAction = {
      type: 'waitFor',
      target: typeof target === 'string' ? target : 'function',
      options
    }
    
    const response = await this.callMCPTool('wait_for', {
      target,
      ...options
    })
    
    if (response.success) {
      this.actionHistory.push(action)
      this.emit('wait-completed', { target: action.target })
    } else {
      throw new Error(`Wait failed: ${response.error}`)
    }
  }
  
  /**
   * Evaluate JavaScript in the page context
   */
  async evaluate<T = any>(
    fn: string | (() => T), 
    args?: any[]
  ): Promise<T> {
    const action: PlaywrightAction = {
      type: 'evaluate',
      value: typeof fn === 'string' ? fn : fn.toString(),
      options: { args }
    }
    
    const response = await this.callMCPTool('evaluate', {
      function: action.value,
      args
    })
    
    if (response.success) {
      this.actionHistory.push(action)
      this.emit('evaluated', { resultType: typeof response.data.result })
      return response.data.result as T
    } else {
      throw new Error(`Evaluate failed: ${response.error}`)
    }
  }
  
  /**
   * Get current page info
   */
  async getPageInfo(): Promise<{
    url: string
    title: string
    viewport: { width: number; height: number }
  }> {
    const response = await this.callMCPTool('get_page_info', {})
    
    if (response.success) {
      return response.data
    } else {
      throw new Error(`Failed to get page info: ${response.error}`)
    }
  }
  
  /**
   * Set viewport size
   */
  async setViewport(width: number, height: number): Promise<void> {
    const response = await this.callMCPTool('set_viewport', {
      width,
      height
    })
    
    if (response.success) {
      this.config.viewport = { width, height }
      this.emit('viewport-changed', { width, height })
    } else {
      throw new Error(`Failed to set viewport: ${response.error}`)
    }
  }
  
  /**
   * Enable request interception
   */
  async enableRequestInterception(
    _handler: (request: any) => Promise<{ continue?: boolean; respond?: any }>
  ): Promise<void> {
    // This would set up request interception through MCP
    this.config.interceptRequests = true
    this.emit('request-interception-enabled', {})
  }
  
  /**
   * Enable response mocking
   */
  async enableMocking(
    rules: Array<{
      url: string | RegExp
      response: any
      status?: number
      headers?: Record<string, string>
    }>
  ): Promise<void> {
    const response = await this.callMCPTool('enable_mocking', { rules })
    
    if (response.success) {
      this.config.enableMocking = true
      this.emit('mocking-enabled', { ruleCount: rules.length })
    } else {
      throw new Error(`Failed to enable mocking: ${response.error}`)
    }
  }
  
  /**
   * Get browser metrics
   */
  async getBrowserMetrics(): Promise<{
    memory: { used: number; total: number }
    cpu: number
    pageCount: number
  }> {
    const response = await this.callMCPTool('get_metrics', {})
    
    if (response.success) {
      return response.data
    } else {
      throw new Error(`Failed to get metrics: ${response.error}`)
    }
  }
  
  /**
   * Get action history
   */
  getActionHistory(): PlaywrightAction[] {
    return [...this.actionHistory]
  }
  
  /**
   * Clear action history
   */
  clearActionHistory(): void {
    this.actionHistory = []
    this.emit('history-cleared', {})
  }
  
  /**
   * Get available MCP tools
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    const response = await this.callMCPTool('list_tools', {})
    
    if (response.success) {
      return response.data.tools
    } else {
      throw new Error(`Failed to get tools: ${response.error}`)
    }
  }
  
  /**
   * React component for UI representation
   */
  static Component: React.FC<PlaywrightMCPIntegrationProps> = ({ 
    config = {}, 
    onAction,
    onError,
    debug = false
  }) => {
    const [instance] = React.useState(() => new PlaywrightMCPIntegration(config))
    const [connected, setConnected] = React.useState(false)
    const [pageInfo, setPageInfo] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)
    
    React.useEffect(() => {
      // Set up event listeners
      const unsubscribe = [
        instance.on('connected', () => setConnected(true)),
        instance.on('disconnected', () => setConnected(false)),
        instance.on('navigated', async () => {
          const info = await instance.getPageInfo()
          setPageInfo(info)
        }),
        instance.on('error', (data) => {
          if (onError) onError(new Error(data.error))
        })
      ]
      
      return () => {
        unsubscribe.forEach(fn => fn())
      }
    }, [instance, onError])
    
    const handleConnect = async () => {
      setLoading(true)
      try {
        await instance.connect()
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    const handleDisconnect = async () => {
      setLoading(true)
      try {
        await instance.disconnect()
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    const handleNavigate = async () => {
      const url = prompt('Enter URL to navigate to:')
      if (url) {
        setLoading(true)
        try {
          await instance.navigate(url)
          if (onAction) {
            onAction({ type: 'navigate', target: url }, { url })
          }
        } catch (error) {
          if (onError) onError(error as Error)
        } finally {
          setLoading(false)
        }
      }
    }
    
    const handleScreenshot = async () => {
      setLoading(true)
      try {
        const buffer = await instance.screenshot({ fullPage: true })
        if (onAction) {
          onAction({ type: 'screenshot', options: { fullPage: true } }, { size: buffer.length })
        }
      } catch (error) {
        if (onError) onError(error as Error)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <div className="playwright-mcp-integration p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Playwright MCP Integration</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Status: <span className={connected ? 'text-green-600' : 'text-red-600'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          
          {pageInfo && (
            <div className="text-sm text-gray-600">
              <p>Current Page: {pageInfo.title}</p>
              <p>URL: {pageInfo.url}</p>
              <p>Viewport: {pageInfo.viewport.width}x{pageInfo.viewport.height}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {!connected ? (
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              variant="primary"
            >
              Connect
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleDisconnect}
                disabled={loading}
                variant="secondary"
              >
                Disconnect
              </Button>
              <Button 
                onClick={handleNavigate}
                disabled={loading}
              >
                Navigate
              </Button>
              <Button 
                onClick={handleScreenshot}
                disabled={loading}
              >
                Screenshot
              </Button>
            </>
          )}
        </div>
        
        {debug && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <pre>{JSON.stringify(instance.getConnectionState(), null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }
}

// Export the component separately for easy use
export const PlaywrightMCPIntegrationComponent = PlaywrightMCPIntegration.Component