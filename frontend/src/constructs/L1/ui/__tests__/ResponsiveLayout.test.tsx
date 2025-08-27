import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResponsiveLayout } from '../ResponsiveLayout'
import React from 'react'

// Mock Split.js
vi.mock('split.js', () => ({
  default: vi.fn((_elements, options) => ({
    setSizes: vi.fn(),
    destroy: vi.fn(),
    getSizes: vi.fn(() => options.sizes || [50, 50])
  }))
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('L1: ResponsiveLayout', () => {
  let construct: ResponsiveLayout

  beforeEach(() => {
    construct = new ResponsiveLayout()
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({
        panels: [
          { id: 'panel1', content: <div>Panel 1</div> },
          { id: 'panel2', content: <div>Panel 2</div> }
        ]
      })
      
      expect(construct.metadata.id).toBe('platform-l1-responsive-layout')
      expect(construct.level).toBe('L1')
      expect(construct.getInput('direction')).toBe('horizontal')
      expect(construct.getInput('gutterSize')).toBe(8)
      expect(construct.getInput('persistLayout')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        panels: [
          { id: 'sidebar', content: <div>Sidebar</div> },
          { id: 'main', content: <div>Main</div> },
          { id: 'aside', content: <div>Aside</div> }
        ],
        direction: 'vertical',
        sizes: [20, 60, 20],
        minSizes: [100, 200, 100],
        gutterSize: 12,
        theme: 'bordered'
      })
      
      expect(construct.getInput('direction')).toBe('vertical')
      expect(construct.getInput('sizes')).toEqual([20, 60, 20])
      expect(construct.getInput('minSizes')).toEqual([100, 200, 100])
      expect(construct.getInput('theme')).toBe('bordered')
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({
        panels: [
          { id: 'left', content: <div>Left</div> },
          { id: 'right', content: <div>Right</div> }
        ]
      })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({
        panels: [
          { id: 'a', content: <div>A</div> },
          { id: 'b', content: <div>B</div> }
        ]
      })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(60)
    })

    it('should be built with L0 PanelPrimitive', async () => {
      await construct.initialize({
        panels: [
          { id: 'test1', content: <div>Test 1</div> },
          { id: 'test2', content: <div>Test 2</div> }
        ]
      })
      
      expect(construct.getBuiltWithConstructs()).toContain('platform-l0-panel-primitive')
    })
  })

  describe('Split.js Integration', () => {
    it('should initialize Split.js with panels', async () => {
      await construct.initialize({
        panels: [
          { id: 'left', content: <div>Left Panel</div> },
          { id: 'right', content: <div>Right Panel</div> }
        ],
        sizes: [30, 70]
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelectorAll('.panel')).toHaveLength(2)
      })
    })

    it('should handle size changes', async () => {
      const onSizeChange = vi.fn()
      
      await construct.initialize({
        panels: [
          { id: 'a', content: <div>A</div> },
          { id: 'b', content: <div>B</div> }
        ],
        onSizeChange
      })
      
      // Simulate size change
      construct['handleSizeChange']([40, 60])
      
      expect(onSizeChange).toHaveBeenCalledWith([40, 60])
      expect(construct.getOutput('currentSizes')).toEqual([40, 60])
    })
  })

  describe('Layout Persistence', () => {
    it('should persist layout sizes to localStorage', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ],
        persistLayout: true,
        layoutId: 'test-layout'
      })
      
      construct['persistSizes']([35, 65])
      
      const stored = localStorage.getItem('responsive-layout-test-layout')
      expect(stored).toBeTruthy()
      const data = JSON.parse(stored!)
      expect(data.sizes).toEqual([35, 65])
    })

    it('should load persisted sizes on initialization', async () => {
      // Pre-store layout
      localStorage.setItem('responsive-layout-saved', JSON.stringify({
        sizes: [25, 75],
        timestamp: Date.now()
      }))
      
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ],
        persistLayout: true,
        layoutId: 'saved',
        sizes: [50, 50] // Default should be overridden
      })
      
      const loadedSizes = construct['getLoadedSizes']()
      expect(loadedSizes).toEqual([25, 75])
    })

    it('should not persist when disabled', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ],
        persistLayout: false,
        layoutId: 'no-persist'
      })
      
      construct['persistSizes']([40, 60])
      
      const stored = localStorage.getItem('responsive-layout-no-persist')
      expect(stored).toBeNull()
    })
  })

  describe('Responsive Breakpoints', () => {
    it('should detect and apply breakpoints', async () => {
      const onBreakpointChange = vi.fn()
      
      await construct.initialize({
        panels: [
          { id: 'nav', content: <div>Nav</div> },
          { id: 'content', content: <div>Content</div> }
        ],
        breakpoints: [
          {
            name: 'mobile',
            maxWidth: 768,
            direction: 'vertical',
            sizes: [30, 70]
          },
          {
            name: 'tablet',
            maxWidth: 1024,
            sizes: [25, 75]
          }
        ],
        onBreakpointChange
      })
      
      // Simulate mobile breakpoint
      construct['handleResize'](600, 800)
      
      expect(onBreakpointChange).toHaveBeenCalledWith('mobile', expect.objectContaining({
        name: 'mobile',
        maxWidth: 768
      }))
      expect(construct.getOutput('currentBreakpoint')).toBe('mobile')
      
      // Simulate tablet breakpoint
      construct['handleResize'](900, 800)
      
      expect(onBreakpointChange).toHaveBeenCalledWith('tablet', expect.objectContaining({
        name: 'tablet',
        maxWidth: 1024
      }))
    })

    it('should track container dimensions', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ]
      })
      
      construct['handleResize'](1200, 600)
      
      expect(construct.getOutput('containerWidth')).toBe(1200)
      expect(construct.getOutput('containerHeight')).toBe(600)
    })
  })

  describe('Panel Collapse/Expand', () => {
    beforeEach(async () => {
      await construct.initialize({
        panels: [
          { id: 'sidebar', content: <div>Sidebar</div>, collapsible: true },
          { id: 'main', content: <div>Main</div> },
          { id: 'panel', content: <div>Panel</div>, collapsible: true }
        ],
        sizes: [20, 60, 20]
      })
      construct['currentSizes'] = [20, 60, 20]
    })

    it('should collapse panels', () => {
      construct.collapsePanel(0)
      
      const isCollapsed = construct.getOutput('isCollapsed') as boolean[]
      expect(isCollapsed[0]).toBe(true)
      expect(isCollapsed[1]).toBe(false)
      expect(isCollapsed[2]).toBe(false)
    })

    it('should expand collapsed panels', () => {
      construct['isCollapsed'] = [true, false, false]
      
      construct.expandPanel(0, 25)
      
      const isCollapsed = construct.getOutput('isCollapsed') as boolean[]
      expect(isCollapsed[0]).toBe(false)
    })

    it('should not collapse non-collapsible panels', () => {
      construct.collapsePanel(1) // Main panel is not collapsible
      
      const isCollapsed = construct.getOutput('isCollapsed') as boolean[]
      expect(isCollapsed[1]).toBe(false)
    })
  })

  describe('Layout Reset', () => {
    it('should reset to default sizes', async () => {
      await construct.initialize({
        panels: [
          { id: 'a', content: <div>A</div> },
          { id: 'b', content: <div>B</div> },
          { id: 'c', content: <div>C</div> }
        ],
        sizes: [33, 34, 33]
      })
      
      // Change sizes
      construct['currentSizes'] = [20, 50, 30]
      construct['isCollapsed'] = [true, false, false]
      
      construct.resetLayout()
      
      const isCollapsed = construct.getOutput('isCollapsed') as boolean[]
      expect(isCollapsed).toEqual([false, false, false])
    })
  })

  describe('Theme Support', () => {
    it('should apply theme styles', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ],
        theme: 'bordered'
      })
      
      const theme = construct['getThemeStyles']()
      expect(theme.border).toBe('1px solid #444')
    })

    it('should support multiple themes', () => {
      const themes = ['default', 'minimal', 'bordered', 'shadowed']
      
      themes.forEach(async themeName => {
        await construct.initialize({
          panels: [
            { id: 'a', content: <div>A</div> },
            { id: 'b', content: <div>B</div> }
          ],
          theme: themeName
        })
        
        const theme = construct['getThemeStyles']()
        expect(theme).toBeDefined()
      })
    })
  })

  describe('UI Rendering', () => {
    it('should render all panels', async () => {
      await construct.initialize({
        panels: [
          { id: 'header', content: <div>Header Content</div> },
          { id: 'body', content: <div>Body Content</div> },
          { id: 'footer', content: <div>Footer Content</div> }
        ]
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.textContent).toContain('Header Content')
        expect(container.textContent).toContain('Body Content')
        expect(container.textContent).toContain('Footer Content')
      })
    })

    it('should apply direction classes', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ],
        direction: 'vertical'
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.responsive-layout.vertical')).toBeInTheDocument()
      })
    })

    it('should show collapsed indicator', async () => {
      await construct.initialize({
        panels: [
          { id: 'collapsible', content: <div>Content</div>, collapsible: true },
          { id: 'main', content: <div>Main</div> }
        ]
      })
      
      construct['isCollapsed'] = [true, false]
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.panel-collapsed-indicator')).toBeInTheDocument()
        expect(container.querySelector('.panel-collapsed-indicator')?.textContent).toBe('collapsible')
      })
    })
  })

  describe('L1 Characteristics', () => {
    it('should have enhanced features over L0', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ]
      })
      
      // Should have Split.js integration
      expect(construct.inputs.some(i => i.name === 'gutterSize')).toBe(true)
      expect(construct.inputs.some(i => i.name === 'snapOffset')).toBe(true)
      
      // Should have responsive features
      expect(construct.inputs.some(i => i.name === 'breakpoints')).toBe(true)
      
      // Should have persistence
      expect(construct.inputs.some(i => i.name === 'persistLayout')).toBe(true)
      
      // Should have themes
      expect(construct.inputs.some(i => i.name === 'theme')).toBe(true)
    })

    it('should provide enhanced outputs', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ]
      })
      
      // Should track sizes
      expect(construct.outputs.some(o => o.name === 'currentSizes')).toBe(true)
      
      // Should track breakpoints
      expect(construct.outputs.some(o => o.name === 'currentBreakpoint')).toBe(true)
      
      // Should track collapse state
      expect(construct.outputs.some(o => o.name === 'isCollapsed')).toBe(true)
      
      // Should track dimensions
      expect(construct.outputs.some(o => o.name === 'containerWidth')).toBe(true)
    })

    it('should have security metadata', async () => {
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ]
      })
      
      const security = construct.metadata.security
      expect(security.length).toBeGreaterThan(0)
      expect(security.some((s: any) => s.aspect === 'Layout Persistence')).toBe(true)
      expect(security.some((s: any) => s.aspect === 'Content Isolation')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single panel gracefully', async () => {
      await construct.initialize({
        panels: [
          { id: 'single', content: <div>Single Panel</div> }
        ]
      })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.panel')).toBeInTheDocument()
        expect(container.textContent).toContain('Single Panel')
      })
    })

    it('should handle empty panels array', async () => {
      await construct.initialize({
        panels: []
      })
      
      const { container } = render(construct.render())
      
      expect(container.querySelector('.responsive-layout')).toBeInTheDocument()
    })

    it('should handle invalid localStorage data', async () => {
      localStorage.setItem('responsive-layout-corrupt', 'invalid-json')
      
      await construct.initialize({
        panels: [
          { id: 'p1', content: <div>P1</div> },
          { id: 'p2', content: <div>P2</div> }
        ],
        persistLayout: true,
        layoutId: 'corrupt',
        sizes: [50, 50]
      })
      
      // Should fall back to default sizes
      const loadedSizes = construct['getLoadedSizes']()
      expect(loadedSizes).toBeNull()
    })
  })
})