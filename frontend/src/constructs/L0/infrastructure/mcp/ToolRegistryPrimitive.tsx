/**
 * Tool Registry Primitive L0 Infrastructure Construct
 * 
 * Raw tool registration and discovery mechanism for MCP.
 * This is the foundation for tool management in Model Context Protocol.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { L0InfrastructureConstruct } from '../../../base/L0Construct'
import { 
  ConstructMetadata,
  ConstructType,
  ConstructLevel,
  MCPTool
} from '../../../types'

// Type definitions
export interface ToolRegistryPrimitiveConfig {
  /** Initial tools to register */
  initialTools?: MCPTool[]
  /** Enable tool validation */
  validateTools?: boolean
  /** Tool categories to support */
  supportedCategories?: string[]
  /** Maximum tools allowed */
  maxTools?: number
  /** Enable tool versioning */
  enableVersioning?: boolean
}

export interface RegisteredTool extends MCPTool {
  /** Registration timestamp */
  registeredAt: Date
  /** Tool status */
  status: 'active' | 'inactive' | 'deprecated'
  /** Usage count */
  usageCount: number
  /** Last used timestamp */
  lastUsed?: Date
  /** Tool metadata */
  metadata?: Record<string, any>
}

export interface ToolRegistryPrimitiveProps {
  config: ToolRegistryPrimitiveConfig
  onToolRegistered?: (tool: RegisteredTool) => void
  onToolUnregistered?: (toolName: string) => void
  onToolUpdated?: (tool: RegisteredTool) => void
  onToolInvoked?: (toolName: string) => void
  onValidationError?: (error: string, tool: MCPTool) => void
}

export interface ToolRegistryPrimitiveOutput {
  /** Register a new tool */
  register: (tool: MCPTool) => boolean
  /** Unregister a tool */
  unregister: (toolName: string) => boolean
  /** Get a registered tool */
  get: (toolName: string) => RegisteredTool | undefined
  /** Get all registered tools */
  getAll: () => RegisteredTool[]
  /** Get tools by category */
  getByCategory: (category: string) => RegisteredTool[]
  /** Search tools */
  search: (query: string) => RegisteredTool[]
  /** Update tool status */
  updateStatus: (toolName: string, status: RegisteredTool['status']) => boolean
  /** Check if tool exists */
  has: (toolName: string) => boolean
  /** Get tool count */
  count: () => number
  /** Mark tool as used */
  markUsed: (toolName: string) => void
  /** Validate tool definition */
  validate: (tool: MCPTool) => { valid: boolean; errors?: string[] }
  /** Export registry */
  export: () => string
  /** Import registry */
  import: (data: string) => boolean
}

/**
 * Tool Registry Primitive Component
 */
export const ToolRegistryPrimitive: React.FC<ToolRegistryPrimitiveProps> = ({
  config,
  onToolRegistered,
  onToolUnregistered,
  onToolUpdated,
  onToolInvoked,
  onValidationError
}) => {
  const [tools, setTools] = useState<Map<string, RegisteredTool>>(new Map())
  const toolsRef = useRef<Map<string, RegisteredTool>>(new Map())

  // Initialize with initial tools
  useEffect(() => {
    if (config.initialTools) {
      config.initialTools.forEach(tool => {
        register(tool)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Validate tool definition
  const validate = useCallback((tool: MCPTool): { valid: boolean; errors?: string[] } => {
    const errors: string[] = []

    // Required fields
    if (!tool.name) errors.push('Tool name is required')
    if (!tool.description) errors.push('Tool description is required')

    // Name validation
    if (tool.name && !/^[a-zA-Z0-9_-]+$/.test(tool.name)) {
      errors.push('Tool name must contain only alphanumeric characters, underscores, and hyphens')
    }

    // Category validation
    if (config.supportedCategories && tool.category) {
      if (!config.supportedCategories.includes(tool.category)) {
        errors.push(`Unsupported category: ${tool.category}. Supported: ${config.supportedCategories.join(', ')}`)
      }
    }

    // Parameter validation
    if (tool.parameters) {
      for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
        if (!paramDef.type) {
          errors.push(`Parameter '${paramName}' missing type`)
        }
        if (!paramDef.description) {
          errors.push(`Parameter '${paramName}' missing description`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }, [config.supportedCategories])

  // Register a tool
  const register = useCallback((tool: MCPTool): boolean => {
    // Check max tools limit
    if (config.maxTools && toolsRef.current.size >= config.maxTools) {
      onValidationError?.(`Maximum tools limit (${config.maxTools}) reached`, tool)
      return false
    }

    // Validate if enabled
    if (config.validateTools) {
      const validation = validate(tool)
      if (!validation.valid) {
        validation.errors?.forEach(error => {
          onValidationError?.(error, tool)
        })
        return false
      }
    }

    // Check for duplicate
    if (toolsRef.current.has(tool.name)) {
      if (config.enableVersioning && tool.version) {
        // Update existing tool with new version
        const existing = toolsRef.current.get(tool.name)!
        if (existing.version !== tool.version) {
          const updated: RegisteredTool = {
            ...tool,
            registeredAt: existing.registeredAt,
            status: 'active',
            usageCount: existing.usageCount,
            lastUsed: existing.lastUsed,
            metadata: { ...existing.metadata, previousVersion: existing.version }
          }
          toolsRef.current.set(tool.name, updated)
          setTools(new Map(toolsRef.current))
          onToolUpdated?.(updated)
          return true
        }
      }
      onValidationError?.(`Tool '${tool.name}' already registered`, tool)
      return false
    }

    // Register the tool
    const registeredTool: RegisteredTool = {
      ...tool,
      registeredAt: new Date(),
      status: 'active',
      usageCount: 0
    }

    toolsRef.current.set(tool.name, registeredTool)
    setTools(new Map(toolsRef.current))
    onToolRegistered?.(registeredTool)
    return true
  }, [config, validate, onToolRegistered, onToolUpdated, onValidationError])

  // Unregister a tool
  const unregister = useCallback((toolName: string): boolean => {
    if (!toolsRef.current.has(toolName)) {
      return false
    }

    toolsRef.current.delete(toolName)
    setTools(new Map(toolsRef.current))
    onToolUnregistered?.(toolName)
    return true
  }, [onToolUnregistered])

  // Get a tool
  const get = useCallback((toolName: string): RegisteredTool | undefined => {
    return toolsRef.current.get(toolName)
  }, [])

  // Get all tools
  const getAll = useCallback((): RegisteredTool[] => {
    return Array.from(toolsRef.current.values())
  }, [])

  // Get tools by category
  const getByCategory = useCallback((category: string): RegisteredTool[] => {
    return Array.from(toolsRef.current.values()).filter(
      tool => tool.category === category
    )
  }, [])

  // Search tools
  const search = useCallback((query: string): RegisteredTool[] => {
    const lowerQuery = query.toLowerCase()
    return Array.from(toolsRef.current.values()).filter(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.category?.toLowerCase().includes(lowerQuery) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [])

  // Update tool status
  const updateStatus = useCallback((toolName: string, status: RegisteredTool['status']): boolean => {
    const tool = toolsRef.current.get(toolName)
    if (!tool) return false

    tool.status = status
    toolsRef.current.set(toolName, tool)
    setTools(new Map(toolsRef.current))
    onToolUpdated?.(tool)
    return true
  }, [onToolUpdated])

  // Check if tool exists
  const has = useCallback((toolName: string): boolean => {
    return toolsRef.current.has(toolName)
  }, [])

  // Get tool count
  const count = useCallback((): number => {
    return toolsRef.current.size
  }, [])

  // Mark tool as used
  const markUsed = useCallback((toolName: string): void => {
    const tool = toolsRef.current.get(toolName)
    if (tool) {
      tool.usageCount++
      tool.lastUsed = new Date()
      toolsRef.current.set(toolName, tool)
      setTools(new Map(toolsRef.current))
      onToolInvoked?.(toolName)
    }
  }, [onToolInvoked])

  // Export registry
  const exportRegistry = useCallback((): string => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tools: Array.from(toolsRef.current.values())
    }
    return JSON.stringify(exportData, null, 2)
  }, [])

  // Import registry
  const importRegistry = useCallback((data: string): boolean => {
    try {
      const importData = JSON.parse(data)
      
      // Validate import data
      if (!importData.tools || !Array.isArray(importData.tools)) {
        throw new Error('Invalid import data: missing tools array')
      }

      // Clear existing tools
      toolsRef.current.clear()

      // Import tools
      for (const tool of importData.tools) {
        const registeredTool: RegisteredTool = {
          ...tool,
          registeredAt: new Date(tool.registeredAt),
          lastUsed: tool.lastUsed ? new Date(tool.lastUsed) : undefined
        }
        toolsRef.current.set(tool.name, registeredTool)
      }

      setTools(new Map(toolsRef.current))
      return true
    } catch (error) {
      console.error('Failed to import registry:', error)
      return false
    }
  }, [])

  return null // This is a headless component
}

// Static construct class for registration
export class ToolRegistryPrimitiveConstruct extends L0InfrastructureConstruct {
  static readonly metadata: ConstructMetadata = {
    id: 'platform-l0-tool-registry-primitive',
    name: 'Tool Registry Primitive',
    type: ConstructType.INFRASTRUCTURE,
    level: ConstructLevel.L0,
    description: 'Raw tool registration and discovery mechanism',
    version: '1.0.0',
    author: 'Love Claude Code Team',
    capabilities: ['tool-registration', 'tool-discovery', 'tool-management'],
    dependencies: [] // L0 has no dependencies
  }

  component = ToolRegistryPrimitive

  getConfiguration(): ToolRegistryPrimitiveConfig {
    return {
      validateTools: true,
      maxTools: 1000,
      enableVersioning: true
    }
  }

  getPrimitive(): any {
    return this.getConfiguration()
  }

  getOutput(): ToolRegistryPrimitiveOutput {
    // This would be implemented with proper state management
    return {
      register: () => false,
      unregister: () => false,
      get: () => undefined,
      getAll: () => [],
      getByCategory: () => [],
      search: () => [],
      updateStatus: () => false,
      has: () => false,
      count: () => 0,
      markUsed: () => {},
      validate: () => ({ valid: true }),
      export: () => '{}',
      import: () => false
    }
  }

  async initialize(config: ToolRegistryPrimitiveConfig): Promise<void> {
    // Initialize tool registry
    console.log('Initializing tool registry primitive with config:', config)
  }

  async destroy(): Promise<void> {
    // Clean up tool registry
    console.log('Destroying tool registry primitive')
  }
}

// Export the construct for registration
export const toolRegistryPrimitive = new ToolRegistryPrimitiveConstruct(ToolRegistryPrimitiveConstruct.metadata)