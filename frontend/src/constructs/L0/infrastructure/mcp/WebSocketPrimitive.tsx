/**
 * WebSocket Primitive L0 Infrastructure Construct
 * 
 * Raw WebSocket connection handling with basic message passing.
 * This is the foundation for real-time communication in MCP and other systems.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { L0InfrastructureConstruct } from '../../../base/L0Construct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel
} from '../../../types'

// Type definitions
export interface WebSocketPrimitiveConfig {
  /** WebSocket URL to connect to */
  url: string
  /** Reconnect on disconnect */
  autoReconnect?: boolean
  /** Reconnect delay in ms */
  reconnectDelay?: number
  /** Max reconnect attempts */
  maxReconnectAttempts?: number
  /** Protocols array */
  protocols?: string[]
  /** Binary type */
  binaryType?: 'blob' | 'arraybuffer'
}

export interface WebSocketPrimitiveProps {
  config: WebSocketPrimitiveConfig
  onMessage?: (data: any) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onReconnecting?: (attempt: number) => void
}

export interface WebSocketPrimitiveOutput {
  /** Current connection state */
  state: 'connecting' | 'open' | 'closing' | 'closed'
  /** Send message through WebSocket */
  send: (data: string | ArrayBuffer | Blob) => void
  /** Close the connection */
  close: (code?: number, reason?: string) => void
  /** Manually reconnect */
  reconnect: () => void
  /** Current reconnection attempt */
  reconnectAttempt: number
  /** Is currently reconnecting */
  isReconnecting: boolean
  /** WebSocket instance */
  ws: WebSocket | null
}

/**
 * WebSocket Primitive Component
 */
export const WebSocketPrimitive: React.FC<WebSocketPrimitiveProps> = ({
  config,
  onMessage,
  onOpen,
  onClose,
  onError,
  onReconnecting
}) => {
  const wsRef = useRef<WebSocket | null>(null)
  const [state, setState] = useState<WebSocketPrimitiveOutput['state']>('closed')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setState('connecting')
      const ws = new WebSocket(config.url, config.protocols)
      
      if (config.binaryType) {
        ws.binaryType = config.binaryType
      }

      ws.onopen = (event) => {
        setState('open')
        setReconnectAttempt(0)
        setIsReconnecting(false)
        onOpen?.(event)
      }

      ws.onmessage = (event) => {
        let data = event.data
        
        // Try to parse JSON if it's a string
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch {
            // Not JSON, keep as string
          }
        }
        
        onMessage?.(data)
      }

      ws.onclose = (event) => {
        setState('closed')
        wsRef.current = null
        onClose?.(event)

        // Auto reconnect if enabled and not a normal closure
        if (
          config.autoReconnect &&
          event.code !== 1000 && // Normal closure
          event.code !== 1001 && // Going away
          reconnectAttempt < (config.maxReconnectAttempts || 5)
        ) {
          scheduleReconnect()
        }
      }

      ws.onerror = (event) => {
        onError?.(event)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('WebSocket connection error:', error)
      setState('closed')
      
      if (config.autoReconnect && reconnectAttempt < (config.maxReconnectAttempts || 5)) {
        scheduleReconnect()
      }
    }
  }, [config, onOpen, onMessage, onClose, onError, reconnectAttempt])

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const delay = (config.reconnectDelay || 1000) * Math.pow(2, reconnectAttempt)
    setIsReconnecting(true)
    onReconnecting?.(reconnectAttempt + 1)

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempt(prev => prev + 1)
      connect()
    }, delay)
  }, [config.reconnectDelay, reconnectAttempt, connect, onReconnecting])

  // Send message
  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (typeof data === 'object' && !(data instanceof ArrayBuffer) && !(data instanceof Blob)) {
        // Convert objects to JSON string
        wsRef.current.send(JSON.stringify(data))
      } else {
        wsRef.current.send(data)
      }
    } else {
      console.warn('WebSocket is not open. State:', state)
    }
  }, [state])

  // Close connection
  const close = useCallback((code?: number, reason?: string) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    setIsReconnecting(false)
    
    if (wsRef.current) {
      setState('closing')
      wsRef.current.close(code, reason)
    }
  }, [])

  // Manual reconnect
  const reconnect = useCallback(() => {
    close()
    setReconnectAttempt(0)
    setTimeout(connect, 100)
  }, [close, connect])

  // Connect on mount
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
    }
  }, [connect])

  // Update connection on URL change
  useEffect(() => {
    if (wsRef.current) {
      reconnect()
    }
  }, [config.url, reconnect])

  return null // This is a headless component
}

// Static construct class for registration
export class WebSocketPrimitiveConstruct extends L0InfrastructureConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l0-websocket-primitive',
    name: 'WebSocket Primitive',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L0,
    description: 'Raw WebSocket connection handling primitive',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: ['websocket', 'real-time', 'bidirectional-communication'],
    dependencies: [] // L0 has no dependencies
  }

  component = WebSocketPrimitive

  getConfiguration(): WebSocketPrimitiveConfig {
    return {
      url: '',
      autoReconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5
    }
  }

  getPrimitive(): any {
    return this.getConfiguration()
  }

  getOutput(): WebSocketPrimitiveOutput {
    // This would be implemented with proper state management
    return {
      state: 'closed',
      send: () => {},
      close: () => {},
      reconnect: () => {},
      reconnectAttempt: 0,
      isReconnecting: false,
      ws: null
    }
  }

  async initialize(config: WebSocketPrimitiveConfig): Promise<void> {
    // Initialize WebSocket connection
    console.log('Initializing WebSocket primitive with config:', config)
  }

  async destroy(): Promise<void> {
    // Clean up WebSocket connection
    console.log('Destroying WebSocket primitive')
  }
}

// Export the construct for registration
export const websocketPrimitive = new WebSocketPrimitiveConstruct(WebSocketPrimitiveConstruct.metadata)