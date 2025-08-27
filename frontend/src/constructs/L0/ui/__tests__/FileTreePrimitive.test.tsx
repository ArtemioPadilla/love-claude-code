import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTreePrimitive } from '../FileTreePrimitive'

describe('L0: FileTreePrimitive', () => {
  let construct: FileTreePrimitive
  const sampleNodes = [
    {
      path: 'src',
      name: 'src',
      type: 'folder' as const,
      children: [
        { path: 'src/index.js', name: 'index.js', type: 'file' as const },
        { path: 'src/app.js', name: 'app.js', type: 'file' as const },
        {
          path: 'src/components',
          name: 'components',
          type: 'folder' as const,
          children: [
            { path: 'src/components/Button.js', name: 'Button.js', type: 'file' as const }
          ]
        }
      ]
    },
    { path: 'package.json', name: 'package.json', type: 'file' as const },
    { path: 'README.md', name: 'README.md', type: 'file' as const }
  ]

  beforeEach(() => {
    construct = new FileTreePrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required nodes', async () => {
      await construct.initialize({
        nodes: sampleNodes
      })
      
      expect(construct.metadata.id).toBe('platform-l0-file-tree-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should accept empty node array', async () => {
      await construct.initialize({
        nodes: []
      })
      
      const outputs = construct.getOutputs()
      expect(outputs.nodeCount).toBe(0)
    })

    it('should accept expanded paths', async () => {
      await construct.initialize({
        nodes: sampleNodes,
        expandedPaths: ['src', 'src/components']
      })
      
      const outputs = construct.getOutputs()
      expect(outputs.expandedNodes).toHaveLength(2)
    })

    it('should accept selected path', async () => {
      await construct.initialize({
        nodes: sampleNodes,
        selectedPath: 'src/index.js'
      })
      
      // The selected path is used for rendering
      expect(construct.getInput('selectedPath')).toBe('src/index.js')
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(25)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Node Counting', () => {
    it('should count all nodes correctly', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const component = construct.render()
      render(component)
      
      // Wait for effect to run
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const outputs = construct.getOutputs()
      // 6 total nodes: src, index.js, app.js, components, Button.js, package.json, README.md
      expect(outputs.nodeCount).toBe(7)
    })

    it('should handle deeply nested structures', async () => {
      const deepNodes = [{
        path: 'root',
        name: 'root',
        type: 'folder' as const,
        children: [{
          path: 'root/level1',
          name: 'level1',
          type: 'folder' as const,
          children: [{
            path: 'root/level1/level2',
            name: 'level2',
            type: 'folder' as const,
            children: [{
              path: 'root/level1/level2/file.txt',
              name: 'file.txt',
              type: 'file' as const
            }]
          }]
        }]
      }]
      
      await construct.initialize({ nodes: deepNodes })
      render(construct.render())
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const outputs = construct.getOutputs()
      expect(outputs.nodeCount).toBe(4)
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should display all root nodes', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      render(construct.render())
      
      expect(screen.getByText('src')).toBeInTheDocument()
      expect(screen.getByText('package.json')).toBeInTheDocument()
      expect(screen.getByText('README.md')).toBeInTheDocument()
    })

    it('should show folder indicators', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      render(construct.render())
      
      // Collapsed folder shows ▶
      expect(screen.getByText(/▶ src/)).toBeInTheDocument()
    })

    it('should not show children of collapsed folders', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      render(construct.render())
      
      // Children should not be visible initially
      expect(screen.queryByText('index.js')).not.toBeInTheDocument()
      expect(screen.queryByText('app.js')).not.toBeInTheDocument()
    })

    it('should show children of expanded folders', async () => {
      await construct.initialize({
        nodes: sampleNodes,
        expandedPaths: ['src']
      })
      
      render(construct.render())
      
      // Expanded folder shows ▼
      expect(screen.getByText(/▼ src/)).toBeInTheDocument()
      // Children should be visible
      expect(screen.getByText('index.js')).toBeInTheDocument()
      expect(screen.getByText('app.js')).toBeInTheDocument()
    })

    it('should apply minimal styling', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const { container } = render(construct.render())
      
      const treeContainer = container.firstChild as HTMLElement
      expect(treeContainer.style.fontFamily).toBe('monospace')
      expect(treeContainer.style.fontSize).toBe('14px')
    })

    it('should highlight selected node', async () => {
      await construct.initialize({
        nodes: sampleNodes,
        selectedPath: 'package.json'
      })
      
      const { container } = render(construct.render())
      
      const selectedNode = screen.getByText('package.json').parentElement
      expect(selectedNode?.style.backgroundColor).toBe('rgb(240, 240, 240)')
    })
  })

  describe('Interactions', () => {
    it('should toggle folder expansion on click', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      render(construct.render())
      
      // Initially collapsed
      expect(screen.queryByText('index.js')).not.toBeInTheDocument()
      
      // Click to expand
      fireEvent.click(screen.getByText(/▶ src/))
      
      // Should now be expanded
      expect(screen.getByText(/▼ src/)).toBeInTheDocument()
      expect(screen.getByText('index.js')).toBeInTheDocument()
    })

    it('should invoke onToggle callback', async () => {
      const onToggle = vi.fn()
      await construct.initialize({
        nodes: sampleNodes,
        onToggle
      })
      
      render(construct.render())
      
      fireEvent.click(screen.getByText(/▶ src/))
      
      expect(onToggle).toHaveBeenCalledWith('src')
    })

    it('should invoke onSelect callback for files', async () => {
      const onSelect = vi.fn()
      await construct.initialize({
        nodes: sampleNodes,
        expandedPaths: ['src'],
        onSelect
      })
      
      render(construct.render())
      
      fireEvent.click(screen.getByText('index.js'))
      
      expect(onSelect).toHaveBeenCalledWith('src/index.js', 'file')
    })

    it('should invoke onSelect callback for folders', async () => {
      const onSelect = vi.fn()
      await construct.initialize({
        nodes: sampleNodes,
        onSelect
      })
      
      render(construct.render())
      
      fireEvent.click(screen.getByText(/▶ src/))
      
      expect(onSelect).toHaveBeenCalledWith('src', 'folder')
    })
  })

  describe('Outputs', () => {
    it('should set treeElement output after render', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const { container } = render(construct.render())
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const outputs = construct.getOutputs()
      expect(outputs.treeElement).toBeDefined()
      expect(outputs.treeElement).toBe(container.firstChild)
    })

    it('should track expanded nodes', async () => {
      await construct.initialize({
        nodes: sampleNodes,
        expandedPaths: ['src', 'src/components']
      })
      
      render(construct.render())
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const outputs = construct.getOutputs()
      expect(outputs.expandedNodes).toHaveLength(2)
      expect(outputs.expandedNodes[0].path).toBe('src')
      expect(outputs.expandedNodes[1].path).toBe('src/components')
    })

    it('should update outputs when expansion changes', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      render(construct.render())
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      let outputs = construct.getOutputs()
      expect(outputs.expandedNodes).toHaveLength(0)
      
      // Expand a folder
      fireEvent.click(screen.getByText(/▶ src/))
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      outputs = construct.getOutputs()
      expect(outputs.expandedNodes).toHaveLength(1)
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should have no icons or visual enhancements', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const { container } = render(construct.render())
      
      // Should not have any icon elements
      expect(container.querySelector('svg')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('.icon')).toBeNull()
    })

    it('should have minimal interaction features', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const { container } = render(construct.render())
      
      // Should not have context menus, drag handles, etc.
      expect(container.querySelector('[draggable]')).toBeNull()
      expect(container.querySelector('.context-menu')).toBeNull()
      expect(container.querySelector('button')).toBeNull()
    })

    it('should use monospace font for consistency', async () => {
      await construct.initialize({ nodes: sampleNodes })
      
      const { container } = render(construct.render())
      
      const treeContainer = container.firstChild as HTMLElement
      expect(treeContainer.style.fontFamily).toBe('monospace')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty folders', async () => {
      const nodesWithEmptyFolder = [{
        path: 'empty',
        name: 'empty',
        type: 'folder' as const,
        children: []
      }]
      
      await construct.initialize({
        nodes: nodesWithEmptyFolder,
        expandedPaths: ['empty']
      })
      
      render(construct.render())
      
      expect(screen.getByText(/▼ empty/)).toBeInTheDocument()
    })

    it('should handle nodes without children property', async () => {
      const simpleNodes = [{
        path: 'folder',
        name: 'folder',
        type: 'folder' as const
        // No children property
      }]
      
      await construct.initialize({ nodes: simpleNodes })
      
      render(construct.render())
      
      expect(screen.getByText(/▶ folder/)).toBeInTheDocument()
    })
  })
})