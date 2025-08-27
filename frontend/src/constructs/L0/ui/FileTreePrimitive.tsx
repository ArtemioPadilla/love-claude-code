import React, { useState } from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 File Tree Primitive Construct
 * Raw file tree display with no icons, styling, or interaction features
 * Just nested lists showing file/folder structure
 */
export class FileTreePrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-file-tree-primitive',
    name: 'File Tree Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw file tree display with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'navigation', 'file-system'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['file-tree', 'primitive', 'navigation', 'folders'],
    inputs: [
      {
        name: 'nodes',
        type: 'FileNode[]',
        description: 'Tree structure of files and folders',
        required: true
      },
      {
        name: 'expandedPaths',
        type: 'string[]',
        description: 'Array of expanded folder paths',
        required: false,
        defaultValue: []
      },
      {
        name: 'selectedPath',
        type: 'string',
        description: 'Currently selected file/folder path',
        required: false
      },
      {
        name: 'onToggle',
        type: 'function',
        description: 'Callback when folder is toggled',
        required: false
      },
      {
        name: 'onSelect',
        type: 'function',
        description: 'Callback when node is selected',
        required: false
      }
    ],
    outputs: [
      {
        name: 'treeElement',
        type: 'HTMLElement',
        description: 'The rendered tree DOM element'
      },
      {
        name: 'nodeCount',
        type: 'number',
        description: 'Total number of nodes in the tree'
      },
      {
        name: 'expandedNodes',
        type: 'FileNode[]',
        description: 'Currently expanded nodes'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React'
    },
    examples: [
      {
        title: 'Basic File Tree',
        description: 'Display a simple file structure',
        code: `const tree = new FileTreePrimitive()
await tree.initialize({
  nodes: [
    {
      path: 'src',
      name: 'src',
      type: 'folder',
      children: [
        { path: 'src/index.js', name: 'index.js', type: 'file' },
        { path: 'src/app.js', name: 'app.js', type: 'file' }
      ]
    },
    { path: 'README.md', name: 'README.md', type: 'file' }
  ]
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 InteractiveFileTree for production',
      'No icons, colors, or visual enhancements',
      'No drag-drop or context menus',
      'Just raw tree structure display'
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

  constructor() {
    super(FileTreePrimitive.definition)
  }

  /**
   * Count total nodes in tree
   */
  private countNodes(nodes: FileNode[]): number {
    let count = 0
    for (const node of nodes) {
      count++
      if (node.children) {
        count += this.countNodes(node.children)
      }
    }
    return count
  }

  /**
   * Get expanded nodes
   */
  private getExpandedNodes(nodes: FileNode[], expandedPaths: string[]): FileNode[] {
    const expanded: FileNode[] = []
    for (const node of nodes) {
      if (node.type === 'folder' && expandedPaths.includes(node.path)) {
        expanded.push(node)
      }
      if (node.children) {
        expanded.push(...this.getExpandedNodes(node.children, expandedPaths))
      }
    }
    return expanded
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <FileTreePrimitiveComponent construct={this} />
  }
}

/**
 * File node type definition
 */
interface FileNode {
  path: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

/**
 * React component wrapper for the primitive
 */
const FileTreePrimitiveComponent: React.FC<{ construct: FileTreePrimitive }> = ({ construct }) => {
  const nodes = construct.getInput<FileNode[]>('nodes') || []
  const [expandedPaths, setExpandedPaths] = useState<string[]>(
    construct.getInput<string[]>('expandedPaths') || []
  )
  const selectedPath = construct.getInput<string>('selectedPath')
  const onToggle = construct.getInput<(path: string) => void>('onToggle')
  const onSelect = construct.getInput<(path: string, type: string) => void>('onSelect')

  React.useEffect(() => {
    // Set outputs
    construct['setOutput']('nodeCount', construct['countNodes'](nodes))
    construct['setOutput']('expandedNodes', construct['getExpandedNodes'](nodes, expandedPaths))
  }, [construct, nodes, expandedPaths])

  const handleToggle = (path: string) => {
    setExpandedPaths(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
    onToggle?.(path)
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedPaths.includes(node.path)
    const isSelected = selectedPath === node.path

    return (
      <div key={node.path}>
        <div
          style={{
            paddingLeft: `${depth * 20}px`,
            cursor: 'pointer',
            backgroundColor: isSelected ? '#f0f0f0' : 'transparent'
          }}
          onClick={() => {
            if (node.type === 'folder') {
              handleToggle(node.path)
            }
            onSelect?.(node.path, node.type)
          }}
        >
          {node.type === 'folder' ? (isExpanded ? '▼ ' : '▶ ') : '  '}
          {node.name}
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      style={{ 
        fontFamily: 'monospace',
        fontSize: '14px',
        userSelect: 'none'
      }}
      ref={(el) => {
        if (el) {
          construct['setOutput']('treeElement', el)
        }
      }}
    >
      {nodes.map(node => renderNode(node))}
    </div>
  )
}

// Export factory function
export const createFileTreePrimitive = () => new FileTreePrimitive()

// Export definition for catalog
export const fileTreePrimitiveDefinition = FileTreePrimitive.definition