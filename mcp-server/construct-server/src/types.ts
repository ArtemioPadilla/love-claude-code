/**
 * Type definitions for the MCP construct server
 */

export enum ConstructLevel {
  L0 = 'L0',
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3'
}

export enum CloudProvider {
  AWS = 'aws',
  Firebase = 'firebase',
  Azure = 'azure',
  GCP = 'gcp',
  Local = 'local'
}

export interface ConstructMetadata {
  name: string
  description: string
  version: string
  author: string
  category: string
  tags: string[]
  documentation?: string
  examples?: string[]
  license?: string
}

export interface SecurityConsideration {
  type: 'encryption' | 'access-control' | 'network' | 'compliance' | 'other'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  mitigation?: string
}

export interface CostModel {
  provider: CloudProvider
  baseCost: number
  usage: {
    requests?: { cost: number; unit: string }
    storage?: { cost: number; unit: string }
    compute?: { cost: number; unit: string }
    transfer?: { cost: number; unit: string }
  }
}

export interface ConstructDefinition {
  id: string
  level: ConstructLevel
  metadata: ConstructMetadata
  providers: CloudProvider[]
  inputs: Record<string, {
    type: string
    description: string
    required: boolean
    default?: any
    validation?: any
  }>
  outputs: Record<string, {
    type: string
    description: string
  }>
  dependencies?: string[]
  security?: SecurityConsideration[]
  costs?: CostModel[]
  implementation: {
    type: 'pulumi' | 'terraform' | 'custom'
    source: string
    runtime?: string
  }
}

export interface ConstructComposition {
  id: string
  name: string
  metadata?: ConstructMetadata
  constructs: Array<{
    constructId: string
    instanceName: string
    config?: Record<string, any>
    position?: { x: number; y: number }
    connections?: Array<{
      targetInstance: string
      type: string
      config?: Record<string, any>
    }>
  }>
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{
    path: string
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: string[]
  suggestions: string[]
}

export interface CostEstimate {
  provider: CloudProvider
  region?: string
  breakdown: Array<{
    item: string
    cost: number
    unit: string
    quantity: number
  }>
  total: {
    hourly: number
    daily: number
    monthly: number
    yearly: number
  }
  assumptions: string[]
}

export interface SecurityRecommendation {
  construct?: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  references?: string[]
}

export interface C4Diagram {
  level: 'context' | 'container' | 'component' | 'code'
  format: 'json' | 'plantuml' | 'mermaid'
  content: string | object
  metadata?: {
    title?: string
    description?: string
    author?: string
    version?: string
  }
}