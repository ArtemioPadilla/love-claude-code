import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabPrimitive } from '../TabPrimitive'

describe('L0: TabPrimitive', () => {
  let construct: TabPrimitive
  const sampleTabs = [
    { label: 'Tab 1', content: 'Content 1' },
    { label: 'Tab 2', content: 'Content 2' },
    { label: 'Tab 3', content: <div>React Content 3</div> }
  ]

  beforeEach(() => {
    construct = new TabPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required tabs', async () => {
      await construct.initialize({
        tabs: sampleTabs
      })
      
      expect(construct.metadata.id).toBe('platform-l0-tab-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default activeIndex of 0', async () => {
      await construct.initialize({
        tabs: sampleTabs
      })
      
      expect(construct.getInput('activeIndex')).toBe(0)
    })

    it('should accept custom activeIndex', async () => {
      await construct.initialize({
        tabs: sampleTabs,
        activeIndex: 2
      })
      
      expect(construct.getInput('activeIndex')).toBe(2)
    })

    it('should accept onTabChange callback', async () => {
      const onTabChange = vi.fn()
      await construct.initialize({
        tabs: sampleTabs,
        onTabChange
      })
      
      expect(construct.getInput('onTabChange')).toBe(onTabChange)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(25)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should display all tab labels', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Tab 3')).toBeInTheDocument()
    })

    it('should display first tab content by default', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      expect(screen.getByText('Content 1')).toBeInTheDocument()
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
      expect(screen.queryByText('React Content 3')).not.toBeInTheDocument()
    })

    it('should display correct initial tab content', async () => {
      await construct.initialize({
        tabs: sampleTabs,
        activeIndex: 1
      })
      
      render(construct.render())
      
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
      expect(screen.queryByText('React Content 3')).not.toBeInTheDocument()
    })

    it('should handle empty tabs array', async () => {
      await construct.initialize({ tabs: [] })
      
      render(construct.render())
      
      expect(screen.getByText('No tabs provided')).toBeInTheDocument()
    })

    it('should apply minimal styling', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      const tab1 = screen.getByText('Tab 1')
      expect(tab1.style.padding).toBe('10px')
      expect(tab1.style.cursor).toBe('pointer')
      // Active tab should have border
      expect(tab1.style.borderBottom).toBe('2px solid black')
    })

    it('should handle React element content', async () => {
      await construct.initialize({
        tabs: sampleTabs,
        activeIndex: 2
      })
      
      render(construct.render())
      
      expect(screen.getByText('React Content 3')).toBeInTheDocument()
    })
  })

  describe('Tab Switching', () => {
    it('should switch content on tab click', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      // Initially showing tab 1
      expect(screen.getByText('Content 1')).toBeInTheDocument()
      
      // Click tab 2
      fireEvent.click(screen.getByText('Tab 2'))
      
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })

    it('should update active tab styling', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      const tab1 = screen.getByText('Tab 1')
      const tab2 = screen.getByText('Tab 2')
      
      // Initially tab 1 is active
      expect(tab1.style.borderBottom).toBe('2px solid black')
      expect(tab2.style.borderBottom).toBe('')
      
      // Click tab 2
      fireEvent.click(tab2)
      
      expect(tab1.style.borderBottom).toBe('')
      expect(tab2.style.borderBottom).toBe('2px solid black')
    })

    it('should invoke onTabChange callback', async () => {
      const onTabChange = vi.fn()
      await construct.initialize({
        tabs: sampleTabs,
        onTabChange
      })
      
      render(construct.render())
      
      fireEvent.click(screen.getByText('Tab 2'))
      expect(onTabChange).toHaveBeenCalledWith(1)
      
      fireEvent.click(screen.getByText('Tab 3'))
      expect(onTabChange).toHaveBeenCalledWith(2)
    })

    it('should handle clicking already active tab', async () => {
      const onTabChange = vi.fn()
      await construct.initialize({
        tabs: sampleTabs,
        onTabChange
      })
      
      render(construct.render())
      
      // Click active tab
      fireEvent.click(screen.getByText('Tab 1'))
      
      // Should still call callback
      expect(onTabChange).toHaveBeenCalledWith(0)
    })
  })

  describe('Outputs', () => {
    it('should set containerElement output', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.containerElement).toBeDefined()
      expect(outputs.containerElement).toBeInstanceOf(HTMLDivElement)
    })

    it('should set tabElements output', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.tabElements).toBeDefined()
      expect(outputs.tabElements).toHaveLength(3)
      expect(outputs.tabElements[0].textContent).toBe('Tab 1')
      expect(outputs.tabElements[1].textContent).toBe('Tab 2')
      expect(outputs.tabElements[2].textContent).toBe('Tab 3')
    })

    it('should set contentElement output', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.contentElement).toBeDefined()
      expect(outputs.contentElement.textContent).toBe('Content 1')
    })

    it('should set activeTabIndex output', async () => {
      await construct.initialize({
        tabs: sampleTabs,
        activeIndex: 1
      })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.activeTabIndex).toBe(1)
    })

    it('should update outputs when tab changes', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      fireEvent.click(screen.getByText('Tab 3'))
      
      const outputs = construct.getOutputs()
      expect(outputs.activeTabIndex).toBe(2)
      expect(outputs.contentElement.textContent).toBe('React Content 3')
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should have no animations or transitions', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      const { container } = render(construct.render())
      
      // Check all elements for transition/animation styles
      const elements = container.querySelectorAll('*')
      elements.forEach(el => {
        const styles = window.getComputedStyle(el as HTMLElement)
        expect(styles.transition).toBe('')
        expect(styles.animation).toBe('')
      })
    })

    it('should not support keyboard navigation', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      render(construct.render())
      
      const tab1 = screen.getByText('Tab 1')
      
      // Tabs should not have tabindex or keyboard handlers
      expect(tab1.getAttribute('tabindex')).toBeNull()
      expect(tab1.getAttribute('role')).toBeNull()
    })

    it('should have minimal DOM structure', async () => {
      await construct.initialize({ tabs: sampleTabs })
      
      const { container } = render(construct.render())
      
      // Should have simple structure: container > tab row + content
      const root = container.firstChild
      expect(root?.childNodes).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid activeIndex', async () => {
      await construct.initialize({
        tabs: sampleTabs,
        activeIndex: 10 // Out of bounds
      })
      
      render(construct.render())
      
      // Should clamp to last tab
      expect(screen.getByText('React Content 3')).toBeInTheDocument()
    })

    it('should handle negative activeIndex', async () => {
      await construct.initialize({
        tabs: sampleTabs,
        activeIndex: -1
      })
      
      render(construct.render())
      
      // Should clamp to first tab
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('should handle single tab', async () => {
      await construct.initialize({
        tabs: [{ label: 'Only Tab', content: 'Solo content' }]
      })
      
      render(construct.render())
      
      expect(screen.getByText('Only Tab')).toBeInTheDocument()
      expect(screen.getByText('Solo content')).toBeInTheDocument()
    })

    it('should handle null content', async () => {
      await construct.initialize({
        tabs: [
          { label: 'Null Tab', content: null },
          { label: 'Normal Tab', content: 'Normal' }
        ]
      })
      
      render(construct.render())
      
      // Should render without crashing
      const outputs = construct.getOutputs()
      expect(outputs.contentElement).toBeDefined()
    })

    it('should handle very long labels', async () => {
      const longLabel = 'A'.repeat(100)
      await construct.initialize({
        tabs: [
          { label: longLabel, content: 'Long label content' },
          { label: 'Short', content: 'Short content' }
        ]
      })
      
      render(construct.render())
      
      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    it('should handle rapid tab switching', async () => {
      const onTabChange = vi.fn()
      await construct.initialize({
        tabs: sampleTabs,
        onTabChange
      })
      
      render(construct.render())
      
      // Rapidly click tabs
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText(`Tab ${(i % 3) + 1}`))
      }
      
      expect(onTabChange).toHaveBeenCalledTimes(10)
    })
  })
})