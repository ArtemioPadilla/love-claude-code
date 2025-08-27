/**
 * RPC Primitive L0 Infrastructure Construct
 * 
 * Raw RPC (Remote Procedure Call) handling with request/response pattern.
 * This is the foundation for method invocation in MCP and other systems.
 */

import React, { useCallback, useRef, useState } from 'react'
import { L0InfrastructureConstruct } from '../../../base/L0Construct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel
} from '../../../types'

// Type definitions
export interface RPCPrimitiveConfig {
  /** RPC endpoint URL */
  endpoint: string
  /** Request timeout in ms */
  timeout?: number
  /** Maximum retry attempts */
  maxRetries?: number
  /** Retry delay in ms */
  retryDelay?: number
  /** Request headers */
  headers?: Record<string, string>
  /** Request method */
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE'
  /** Content type */
  contentType?: string
}

export interface RPCRequest {
  /** Method/procedure name */
  method: string
  /** Request parameters */
  params?: any
  /** Request ID for correlation */
  id?: string | number
  /** JSON-RPC version */
  jsonrpc?: '2.0'
}

export interface RPCResponse {
  /** Response result */
  result?: any
  /** Error information */
  error?: {
    code: number
    message: string
    data?: any
  }
  /** Request ID for correlation */
  id?: string | number
  /** JSON-RPC version */
  jsonrpc?: '2.0'
}

export interface RPCPrimitiveProps {
  config: RPCPrimitiveConfig
  onResponse?: (response: RPCResponse) => void
  onError?: (error: Error | RPCResponse['error']) => void
  onRetrying?: (attempt: number) => void
}

export interface RPCPrimitiveOutput {
  /** Call an RPC method */
  call: (request: RPCRequest) => Promise<RPCResponse>
  /** Call multiple RPC methods (batch) */
  batchCall: (requests: RPCRequest[]) => Promise<RPCResponse[]>
  /** Cancel pending requests */
  cancel: () => void
  /** Current pending requests count */
  pendingRequests: number
  /** Is currently calling */
  isCalling: boolean
}

/**
 * RPC Primitive Component
 */
export const RPCPrimitive: React.FC<RPCPrimitiveProps> = ({
  config,
  onResponse,
  onError,
  onRetrying
}) => {
  const [pendingRequests, setPendingRequests] = useState(0)
  const [isCalling, setIsCalling] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdCounter = useRef(0)

  // Generate request ID
  const generateRequestId = useCallback(() => {
    return ++requestIdCounter.current
  }, [])

  // Execute RPC call with retries
  const executeCall = useCallback(async (
    request: RPCRequest,
    attempt: number = 0
  ): Promise<RPCResponse> => {
    const maxRetries = config.maxRetries || 3
    const retryDelay = config.retryDelay || 1000
    const timeout = config.timeout || 30000

    try {
      // Create abort controller for this request
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Set timeout
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Prepare request
      const rpcRequest = {
        ...request,
        id: request.id || generateRequestId(),
        jsonrpc: request.jsonrpc || '2.0'
      }

      // Make the request
      const response = await fetch(config.endpoint, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': config.contentType || 'application/json',
          ...config.headers
        },
        body: JSON.stringify(rpcRequest),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RPCResponse = await response.json()

      // Check for RPC error
      if (data.error) {
        onError?.(data.error)
        return data
      }

      // Success
      onResponse?.(data)
      return data

    } catch (error: any) {
      // Handle abort
      if (error.name === 'AbortError') {
        const errorResponse: RPCResponse = {
          error: {
            code: -32000,
            message: 'Request timeout',
            data: { timeout }
          },
          id: request.id || generateRequestId()
        }
        onError?.(errorResponse.error!)
        return errorResponse
      }

      // Retry logic
      if (attempt < maxRetries) {
        onRetrying?.(attempt + 1)
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
        return executeCall(request, attempt + 1)
      }

      // Max retries reached
      const errorResponse: RPCResponse = {
        error: {
          code: -32603,
          message: error.message || 'Internal error',
          data: { originalError: error.toString() }
        },
        id: request.id || generateRequestId()
      }
      onError?.(error)
      return errorResponse
    }
  }, [config, onResponse, onError, onRetrying, generateRequestId])

  // Single RPC call
  const call = useCallback(async (request: RPCRequest): Promise<RPCResponse> => {
    setPendingRequests(prev => prev + 1)
    setIsCalling(true)

    try {
      const response = await executeCall(request)
      return response
    } finally {
      setPendingRequests(prev => prev - 1)
      setIsCalling(false)
    }
  }, [executeCall])

  // Batch RPC call
  const batchCall = useCallback(async (requests: RPCRequest[]): Promise<RPCResponse[]> => {
    setPendingRequests(prev => prev + requests.length)
    setIsCalling(true)

    try {
      // Execute all requests in parallel
      const responses = await Promise.all(
        requests.map(request => executeCall(request))
      )
      return responses
    } finally {
      setPendingRequests(prev => prev - requests.length)
      setIsCalling(false)
    }
  }, [executeCall])

  // Cancel pending requests
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return null // This is a headless component
}

// Static construct class for registration
export class RPCPrimitiveConstruct extends L0InfrastructureConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l0-rpc-primitive',
    name: 'RPC Primitive',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L0,
    description: 'Raw RPC communication handling primitive',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: ['rpc', 'json-rpc', 'remote-procedure-call'],
    dependencies: [] // L0 has no dependencies
  }

  component = RPCPrimitive

  getConfiguration(): RPCPrimitiveConfig {
    return {
      endpoint: '',
      timeout: 30000,
      maxRetries: 3
    }
  }

  getPrimitive(): any {
    return this.getConfiguration()
  }

  getOutput(): RPCPrimitiveOutput {
    // This would be implemented with proper state management
    return {
      call: async () => ({ id: 0 }),
      batchCall: async () => [],
      cancel: () => {},
      pendingRequests: 0,
      isCalling: false
    }
  }

  async initialize(config: RPCPrimitiveConfig): Promise<void> {
    // Initialize RPC connection
    console.log('Initializing RPC primitive with config:', config)
  }

  async destroy(): Promise<void> {
    // Clean up RPC connection
    console.log('Destroying RPC primitive')
  }
}

// Export the construct for registration
export const rpcPrimitive = new RPCPrimitiveConstruct(RPCPrimitiveConstruct.metadata)