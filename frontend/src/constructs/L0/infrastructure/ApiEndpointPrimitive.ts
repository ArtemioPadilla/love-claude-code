import { L0InfrastructureConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 API Endpoint Primitive Construct
 * Raw HTTP API endpoint with no validation, authentication, or error handling
 * Just basic request/response handling
 */
export class ApiEndpointPrimitive extends L0InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-api-endpoint-primitive',
    name: 'API Endpoint Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Infrastructure,
    description: 'Raw API endpoint with no validation or error handling',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'api', 'networking'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['api', 'endpoint', 'primitive', 'http'],
    inputs: [
      {
        name: 'path',
        type: 'string',
        description: 'API endpoint path (e.g., /api/users)',
        required: true
      },
      {
        name: 'method',
        type: 'HttpMethod',
        description: 'HTTP method (GET, POST, PUT, DELETE, PATCH)',
        required: true
      },
      {
        name: 'handler',
        type: 'function',
        description: 'Request handler function',
        required: true
      },
      {
        name: 'port',
        type: 'number',
        description: 'Port number for local server',
        required: false,
        defaultValue: 3000
      }
    ],
    outputs: [
      {
        name: 'endpointId',
        type: 'string',
        description: 'Unique endpoint ID'
      },
      {
        name: 'url',
        type: 'string',
        description: 'Full endpoint URL'
      },
      {
        name: 'requestCount',
        type: 'number',
        description: 'Total requests handled'
      },
      {
        name: 'lastRequest',
        type: 'RequestInfo',
        description: 'Information about last request'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'HTTP'
    },
    examples: [
      {
        title: 'Basic GET Endpoint',
        description: 'Simple GET endpoint',
        code: `const endpoint = new ApiEndpointPrimitive()
await endpoint.initialize({
  path: '/api/hello',
  method: 'GET',
  handler: async (req) => {
    return { message: 'Hello World' }
  }
})
await endpoint.deploy()`,
        language: 'typescript'
      },
      {
        title: 'POST Endpoint with Body',
        description: 'POST endpoint processing request body',
        code: `const endpoint = new ApiEndpointPrimitive()
await endpoint.initialize({
  path: '/api/users',
  method: 'POST',
  handler: async (req) => {
    const { name, email } = req.body
    return { 
      id: Date.now(),
      name,
      email,
      created: new Date()
    }
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 RestApiService for production',
      'No input validation or sanitization',
      'No authentication or authorization',
      'No error handling or status codes',
      'Raw HTTP endpoint only'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 25,
      canBuildConstructs: false
    }
  }

  private endpointId?: string
  private requestCount: number = 0
  private lastRequest?: RequestInfo
  private isDeployed: boolean = false

  constructor() {
    super(ApiEndpointPrimitive.definition)
  }

  /**
   * Simulated deploy for L0 - in real implementation would use Express/Fastify
   */
  async deploy(): Promise<void> {
    // Validate required inputs
    const path = this.getInput<string>('path')
    const method = this.getInput<HttpMethod>('method')
    const handler = this.getInput<RequestHandler>('handler')
    
    if (!path) throw new Error('Path is required')
    if (!method) throw new Error('Method is required')
    if (!handler) throw new Error('Handler is required')

    const port = this.getInput<number>('port') || 3000

    // Simulate endpoint creation
    this.endpointId = `endpoint-${Date.now()}`
    this.isDeployed = true
    
    // Set outputs
    this.setOutput('endpointId', this.endpointId)
    this.setOutput('url', `http://localhost:${port}${path}`)
    this.setOutput('requestCount', this.requestCount)
    
    console.log(`API endpoint ${method} ${path} deployed on port ${port}`)
  }

  /**
   * Simulate handling a request
   */
  async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    if (!this.isDeployed) {
      throw new Error('Endpoint not deployed')
    }

    const method = this.getInput<HttpMethod>('method')
    const path = this.getInput<string>('path')
    const handler = this.getInput<RequestHandler>('handler')

    // Check method match
    if (request.method !== method) {
      return {
        status: 405,
        body: { error: 'Method not allowed' }
      }
    }

    // Check path match (simple exact match for L0)
    if (request.path !== path) {
      return {
        status: 404,
        body: { error: 'Not found' }
      }
    }

    // Update request tracking
    this.requestCount++
    this.lastRequest = {
      method: request.method,
      path: request.path,
      timestamp: new Date(),
      headers: request.headers || {},
      hasBody: !!request.body
    }
    
    this.setOutput('requestCount', this.requestCount)
    this.setOutput('lastRequest', this.lastRequest)

    try {
      // Call handler
      const result = await handler(request)
      
      return {
        status: 200,
        body: result
      }
    } catch (error) {
      // L0 has minimal error handling
      console.error('Handler error:', error)
      return {
        status: 500,
        body: { error: 'Internal server error' }
      }
    }
  }

  /**
   * Get endpoint statistics
   */
  getStats(): EndpointStats {
    return {
      endpointId: this.endpointId || '',
      path: this.getInput<string>('path') || '',
      method: this.getInput<HttpMethod>('method') || 'GET',
      requestCount: this.requestCount,
      lastRequest: this.lastRequest,
      isDeployed: this.isDeployed
    }
  }

  /**
   * Reset endpoint statistics
   */
  resetStats(): void {
    this.requestCount = 0
    this.lastRequest = undefined
    this.setOutput('requestCount', 0)
    this.setOutput('lastRequest', undefined)
  }

  /**
   * Check if endpoint matches request
   */
  matches(method: HttpMethod, path: string): boolean {
    return (
      this.getInput<HttpMethod>('method') === method &&
      this.getInput<string>('path') === path
    )
  }

  /**
   * Simulate making a request (for testing)
   */
  async makeRequest(
    method: HttpMethod,
    path: string,
    options?: {
      body?: any
      headers?: Record<string, string>
      query?: Record<string, string>
    }
  ): Promise<ApiResponse> {
    const request: ApiRequest = {
      method,
      path,
      body: options?.body,
      headers: options?.headers || {},
      query: options?.query || {}
    }

    return this.handleRequest(request)
  }
}

/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Request handler function type
 */
export type RequestHandler = (request: ApiRequest) => Promise<any>

/**
 * API request interface
 */
export interface ApiRequest {
  method: HttpMethod
  path: string
  headers: Record<string, string>
  query: Record<string, string>
  body?: any
}

/**
 * API response interface
 */
export interface ApiResponse {
  status: number
  body: any
  headers?: Record<string, string>
}

/**
 * Request information for tracking
 */
export interface RequestInfo {
  method: HttpMethod
  path: string
  timestamp: Date
  headers: Record<string, string>
  hasBody: boolean
}

/**
 * Endpoint statistics
 */
export interface EndpointStats {
  endpointId: string
  path: string
  method: HttpMethod
  requestCount: number
  lastRequest?: RequestInfo
  isDeployed: boolean
}

// Export factory function
export const createApiEndpointPrimitive = () => new ApiEndpointPrimitive()

// Export definition for catalog
export const apiEndpointPrimitiveDefinition = ApiEndpointPrimitive.definition