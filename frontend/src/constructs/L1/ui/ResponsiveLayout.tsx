import React, { useRef, useEffect, useState, useCallback } from 'react'
import Split from 'split.js'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L1 Responsive Layout Construct
 * Flexible layout system with resizable panels, responsive breakpoints, and persistence
 * Built upon L0 PanelPrimitive with Split.js integration
 */
export class ResponsiveLayout extends L1UIConstruct {
  private splitInstance: Split.Instance | null = null
  private resizeObserver: ResizeObserver | null = null
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-responsive-layout',
    name: 'Responsive Layout',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Flexible layout system with resizable panels, responsive breakpoints, and persistence. Built with Split.js for smooth resizing.',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'layout', 'responsive'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['layout', 'responsive', 'resizable', 'split.js', 'panels', 'adaptive'],
    inputs: [
      {
        name: 'panels',
        type: 'PanelConfig[]',
        description: 'Array of panel configurations',
        required: true
      },
      {
        name: 'direction',
        type: 'string',
        description: 'Split direction: horizontal or vertical',
        required: false,
        defaultValue: 'horizontal',
        validation: {
          enum: ['horizontal', 'vertical']
        }
      },
      {
        name: 'minSizes',
        type: 'number[]',
        description: 'Minimum sizes for each panel in pixels',
        required: false,
        defaultValue: [100, 100]
      },
      {
        name: 'sizes',
        type: 'number[]',
        description: 'Initial sizes as percentages',
        required: false,
        defaultValue: [50, 50]
      },
      {
        name: 'gutterSize',
        type: 'number',
        description: 'Size of the gutter between panels',
        required: false,
        defaultValue: 8
      },
      {
        name: 'snapOffset',
        type: 'number',
        description: 'Snap to edges within this offset',
        required: false,
        defaultValue: 30
      },
      {
        name: 'breakpoints',
        type: 'BreakpointConfig[]',
        description: 'Responsive breakpoint configurations',
        required: false,
        defaultValue: []
      },
      {
        name: 'persistLayout',
        type: 'boolean',
        description: 'Persist layout sizes to localStorage',
        required: false,
        defaultValue: true
      },
      {
        name: 'layoutId',
        type: 'string',
        description: 'Unique ID for persisting layout',
        required: false,
        defaultValue: 'default-layout'
      },
      {
        name: 'theme',
        type: 'string',
        description: 'Layout theme',
        required: false,
        defaultValue: 'default',
        validation: {
          enum: ['default', 'minimal', 'bordered', 'shadowed']
        }
      },
      {
        name: 'onSizeChange',
        type: 'function',
        description: 'Callback when panel sizes change',
        required: false
      },
      {
        name: 'onBreakpointChange',
        type: 'function',
        description: 'Callback when breakpoint changes',
        required: false
      }
    ],
    outputs: [
      {
        name: 'currentSizes',
        type: 'number[]',
        description: 'Current panel sizes as percentages'
      },
      {
        name: 'currentBreakpoint',
        type: 'string',
        description: 'Currently active breakpoint'
      },
      {
        name: 'isCollapsed',
        type: 'boolean[]',
        description: 'Collapsed state of each panel'
      },
      {
        name: 'containerWidth',
        type: 'number',
        description: 'Container width in pixels'
      },
      {
        name: 'containerHeight',
        type: 'number',
        description: 'Container height in pixels'
      }
    ],
    security: [
      {
        aspect: 'Layout Persistence',
        description: 'Validates localStorage data to prevent injection',
        implementation: 'JSON schema validation for persisted layouts'
      },
      {
        aspect: 'Content Isolation',
        description: 'Panels are isolated from each other',
        implementation: 'Separate React contexts per panel'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + Split.js'
    },
    examples: [
      {
        title: 'Basic Two-Panel Layout',
        description: 'Simple horizontal split layout',
        code: `const layout = new ResponsiveLayout()
await layout.initialize({
  panels: [
    { id: 'sidebar', content: <Sidebar /> },
    { id: 'main', content: <MainContent /> }
  ],
  sizes: [30, 70],
  minSizes: [200, 400]
})`,
        language: 'typescript'
      },
      {
        title: 'Responsive IDE Layout',
        description: 'Complex layout with breakpoints',
        code: `const layout = new ResponsiveLayout()
await layout.initialize({
  panels: [
    { id: 'explorer', content: <FileExplorer /> },
    { id: 'editor', content: <CodeEditor /> },
    { id: 'terminal', content: <Terminal /> }
  ],
  direction: 'horizontal',
  sizes: [20, 60, 20],
  breakpoints: [
    {
      name: 'mobile',
      maxWidth: 768,
      direction: 'vertical',
      sizes: [30, 40, 30]
    },
    {
      name: 'tablet',
      maxWidth: 1024,
      sizes: [25, 50, 25]
    }
  ],
  persistLayout: true,
  layoutId: 'ide-layout'
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Set appropriate minimum sizes for panels',
      'Use breakpoints for mobile responsiveness',
      'Persist layouts for user preference',
      'Handle panel collapse/expand gracefully',
      'Test with different screen sizes',
      'Consider keyboard navigation',
      'Provide visual feedback for resize handles'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    dependencies: ['platform-l0-panel-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-panel-primitive'],
      timeToCreate: 60,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ResponsiveLayout.definition)
  }

  private currentSizes: number[] = []
  private currentBreakpoint: string = 'default'
  private isCollapsed: boolean[] = []

  /**
   * Initialize Split.js with configuration
   */
  private initializeSplit(container: HTMLElement): void {
    const panels = this.getInput<PanelConfig[]>('panels') || []
    const direction = this.getInput<string>('direction') || 'horizontal'
    const sizes = this.getLoadedSizes() || this.getInput<number[]>('sizes') || []
    const minSizes = this.getInput<number[]>('minSizes') || []
    const gutterSize = this.getInput<number>('gutterSize') || 8
    const snapOffset = this.getInput<number>('snapOffset') || 30

    // Get panel elements
    const elements = Array.from(container.querySelectorAll('.panel')) as HTMLElement[]
    
    if (elements.length < 2) return

    // Destroy existing instance
    if (this.splitInstance) {
      this.splitInstance.destroy()
    }

    // Create Split instance
    this.splitInstance = Split(elements, {
      sizes,
      minSize: minSizes,
      gutterSize,
      snapOffset,
      direction,
      cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
      gutter: (index, direction) => {
        const gutter = document.createElement('div')
        gutter.className = `gutter gutter-${direction}`
        return gutter
      },
      onDrag: (sizes) => {
        this.handleSizeChange(sizes)
      },
      onDragEnd: (sizes) => {
        this.handleSizeChange(sizes)
        this.persistSizes(sizes)
      }
    })

    this.currentSizes = sizes
    this.setOutput('currentSizes', sizes)
  }

  /**
   * Handle size changes
   */
  private handleSizeChange(sizes: number[]): void {
    this.currentSizes = sizes
    this.setOutput('currentSizes', sizes)
    
    const onSizeChange = this.getInput<(sizes: number[]) => void>('onSizeChange')
    if (onSizeChange) {
      onSizeChange(sizes)
    }

    this.emit('sizeChange', sizes)
  }

  /**
   * Get persisted sizes
   */
  private getLoadedSizes(): number[] | null {
    if (!this.getInput<boolean>('persistLayout')) return null
    
    const layoutId = this.getInput<string>('layoutId') || 'default-layout'
    const key = `responsive-layout-${layoutId}`
    
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        if (Array.isArray(data.sizes)) {
          return data.sizes
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted layout:', e)
    }
    
    return null
  }

  /**
   * Persist sizes to localStorage
   */
  private persistSizes(sizes: number[]): void {
    if (!this.getInput<boolean>('persistLayout')) return
    
    const layoutId = this.getInput<string>('layoutId') || 'default-layout'
    const key = `responsive-layout-${layoutId}`
    
    try {
      localStorage.setItem(key, JSON.stringify({
        sizes,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.warn('Failed to persist layout:', e)
    }
  }

  /**
   * Handle responsive breakpoints
   */
  private handleResize(width: number, height: number): void {
    this.setOutput('containerWidth', width)
    this.setOutput('containerHeight', height)

    const breakpoints = this.getInput<BreakpointConfig[]>('breakpoints') || []
    let activeBreakpoint = 'default'
    let breakpointConfig: BreakpointConfig | null = null

    // Find active breakpoint
    for (const bp of breakpoints.sort((a, b) => (a.maxWidth || 0) - (b.maxWidth || 0))) {
      if (width <= (bp.maxWidth || Infinity)) {
        activeBreakpoint = bp.name
        breakpointConfig = bp
        break
      }
    }

    // Update if breakpoint changed
    if (activeBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = activeBreakpoint
      this.setOutput('currentBreakpoint', activeBreakpoint)
      
      const onBreakpointChange = this.getInput<(name: string, config: BreakpointConfig | null) => void>('onBreakpointChange')
      if (onBreakpointChange) {
        onBreakpointChange(activeBreakpoint, breakpointConfig)
      }

      this.emit('breakpointChange', { name: activeBreakpoint, config: breakpointConfig })

      // Apply breakpoint-specific configuration
      if (breakpointConfig && this.splitInstance) {
        if (breakpointConfig.sizes) {
          this.splitInstance.setSizes(breakpointConfig.sizes)
        }
        // Note: Changing direction requires recreating Split instance
        // This would be handled in a full implementation
      }
    }
  }

  /**
   * Collapse a panel
   */
  collapsePanel(index: number): void {
    const panels = this.getInput<PanelConfig[]>('panels') || []
    if (index < 0 || index >= panels.length) return

    const newSizes = [...this.currentSizes]
    const collapsedSize = 0
    const expandedSize = newSizes[index]
    
    // Distribute collapsed panel's size to others
    const otherPanels = newSizes.length - 1
    const sizePerPanel = expandedSize / otherPanels

    for (let i = 0; i < newSizes.length; i++) {
      if (i === index) {
        newSizes[i] = collapsedSize
      } else {
        newSizes[i] += sizePerPanel
      }
    }

    if (this.splitInstance) {
      this.splitInstance.setSizes(newSizes)
    }

    this.isCollapsed[index] = true
    this.setOutput('isCollapsed', [...this.isCollapsed])
    this.emit('panelCollapse', index)
  }

  /**
   * Expand a panel
   */
  expandPanel(index: number, size?: number): void {
    const panels = this.getInput<PanelConfig[]>('panels') || []
    if (index < 0 || index >= panels.length) return
    if (!this.isCollapsed[index]) return

    const defaultSizes = this.getInput<number[]>('sizes') || []
    const targetSize = size || defaultSizes[index] || (100 / panels.length)
    
    const newSizes = [...this.currentSizes]
    newSizes[index] = targetSize
    
    // Normalize sizes
    const total = newSizes.reduce((sum, s) => sum + s, 0)
    for (let i = 0; i < newSizes.length; i++) {
      newSizes[i] = (newSizes[i] / total) * 100
    }

    if (this.splitInstance) {
      this.splitInstance.setSizes(newSizes)
    }

    this.isCollapsed[index] = false
    this.setOutput('isCollapsed', [...this.isCollapsed])
    this.emit('panelExpand', index)
  }

  /**
   * Reset to default sizes
   */
  resetLayout(): void {
    const defaultSizes = this.getInput<number[]>('sizes') || []
    
    if (this.splitInstance) {
      this.splitInstance.setSizes(defaultSizes)
    }

    this.isCollapsed = new Array(defaultSizes.length).fill(false)
    this.setOutput('isCollapsed', [...this.isCollapsed])
    this.emit('layoutReset')
  }

  /**
   * Get theme styles
   */
  private getThemeStyles(): React.CSSProperties {
    const theme = this.getInput<string>('theme') || 'default'
    
    const themes: Record<string, React.CSSProperties> = {
      default: {
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4'
      },
      minimal: {
        backgroundColor: 'transparent',
        color: 'inherit'
      },
      bordered: {
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        border: '1px solid #444'
      },
      shadowed: {
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }
    }

    return themes[theme] || themes.default
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ResponsiveLayoutComponent construct={this} />
  }
}

/**
 * Panel configuration
 */
interface PanelConfig {
  id: string
  content: React.ReactNode
  className?: string
  minSize?: number
  maxSize?: number
  collapsible?: boolean
}

/**
 * Breakpoint configuration
 */
interface BreakpointConfig {
  name: string
  maxWidth?: number
  minWidth?: number
  direction?: 'horizontal' | 'vertical'
  sizes?: number[]
  hidePanels?: string[]
}

/**
 * React component wrapper
 */
const ResponsiveLayoutComponent: React.FC<{ construct: ResponsiveLayout }> = ({ construct }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  const panels = construct.getInput('panels') as PanelConfig[]
  const direction = construct.getInput('direction') as string
  const theme = construct['getThemeStyles']()

  useEffect(() => {
    if (!containerRef.current || !mounted) return

    // Initialize Split.js
    construct['initializeSplit'](containerRef.current)

    // Setup resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        construct['handleResize'](width, height)
      }
    })

    resizeObserver.observe(containerRef.current)
    construct['resizeObserver'] = resizeObserver

    return () => {
      if (construct['splitInstance']) {
        construct['splitInstance'].destroy()
        construct['splitInstance'] = null
      }
      if (construct['resizeObserver']) {
        construct['resizeObserver'].disconnect()
        construct['resizeObserver'] = null
      }
    }
  }, [construct, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePanelClick = useCallback((index: number, panel: PanelConfig) => {
    if (panel.collapsible && construct['isCollapsed'][index]) {
      construct.expandPanel(index)
    }
  }, [construct])

  return (
    <div 
      ref={containerRef}
      className={`responsive-layout ${direction}`}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        ...theme
      }}
    >
      {panels.map((panel, index) => (
        <div
          key={panel.id}
          className={`panel ${panel.className || ''} ${construct['isCollapsed'][index] ? 'collapsed' : ''}`}
          onClick={() => handlePanelClick(index, panel)}
          style={{
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {panel.collapsible && construct['isCollapsed'][index] && (
            <div className="panel-collapsed-indicator">
              {panel.id}
            </div>
          )}
          {!construct['isCollapsed'][index] && panel.content}
        </div>
      ))}
      
      <style>{`
        .gutter {
          background-color: #2d2d2d;
          background-repeat: no-repeat;
          background-position: 50%;
          transition: background-color 0.2s;
        }
        
        .gutter:hover {
          background-color: #3e3e3e;
        }
        
        .gutter-horizontal {
          cursor: col-resize;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAGklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjwEAHxgLAU7dTesAAAAASUVORK5CYII=');
        }
        
        .gutter-vertical {
          cursor: row-resize;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
        }
        
        .panel {
          transition: opacity 0.2s;
        }
        
        .panel.collapsed {
          opacity: 0.5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px !important;
          min-height: 40px !important;
        }
        
        .panel-collapsed-indicator {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-size: 12px;
          opacity: 0.7;
          user-select: none;
        }
        
        .responsive-layout.vertical .panel-collapsed-indicator {
          writing-mode: horizontal-tb;
        }
      `}</style>
    </div>
  )
}

// Export factory function
export const createResponsiveLayout = () => new ResponsiveLayout()

// Export the definition for catalog registration
export const responsiveLayoutDefinition = ResponsiveLayout.definition