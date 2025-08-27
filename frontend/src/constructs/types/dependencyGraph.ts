/**
 * Dependency Graph Types
 * 
 * Types for representing and visualizing construct dependency relationships
 */

import { ConstructLevel } from '../types'

export interface GraphNode {
  id: string
  data: {
    label: string
    level: ConstructLevel
    type: string
    description: string
    isExpanded: boolean
    dependencyCount: number
    primitiveCount: number // Count of L0 dependencies
  }
  position: {
    x: number
    y: number
  }
  type?: 'constructNode'
  style?: React.CSSProperties
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type?: 'dependency'
  animated?: boolean
  style?: React.CSSProperties
  label?: string
  labelStyle?: React.CSSProperties
  labelBgStyle?: React.CSSProperties
}

export interface DependencyGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphLayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL' // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  nodeSpacing: {
    horizontal: number
    vertical: number
  }
  levelSpacing: number
  animate: boolean
}

export interface DependencyMetrics {
  totalDependencies: number
  directDependencies: number
  transitiveDependencies: number
  dependenciesByLevel: Record<ConstructLevel, number>
  maxDepth: number
  complexity: number // Based on dependency count and depth
  reusability: number // Based on how many constructs depend on this
}

export interface DependencyFilter {
  levels?: ConstructLevel[]
  types?: string[]
  showTransitive?: boolean
  maxDepth?: number
}

// Color scheme for different construct levels
export const LEVEL_COLORS: Record<ConstructLevel, { bg: string; border: string; text: string }> = {
  [ConstructLevel.L0]: {
    bg: '#4B5563', // gray-600
    border: '#374151', // gray-700
    text: '#E5E7EB' // gray-200
  },
  [ConstructLevel.L1]: {
    bg: '#2563EB', // blue-600
    border: '#1D4ED8', // blue-700
    text: '#DBEAFE' // blue-100
  },
  [ConstructLevel.L2]: {
    bg: '#7C3AED', // purple-600
    border: '#6D28D9', // purple-700
    text: '#EDE9FE' // purple-100
  },
  [ConstructLevel.L3]: {
    bg: '#059669', // green-600
    border: '#047857', // green-700
    text: '#D1FAE5' // green-100
  }
}

// Node shapes for different construct levels
export const LEVEL_SHAPES: Record<ConstructLevel, string> = {
  [ConstructLevel.L0]: 'circle',
  [ConstructLevel.L1]: 'roundedSquare',
  [ConstructLevel.L2]: 'diamond',
  [ConstructLevel.L3]: 'hexagon'
}