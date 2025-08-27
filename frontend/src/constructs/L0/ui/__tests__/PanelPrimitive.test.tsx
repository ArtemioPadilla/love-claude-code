import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelPrimitive } from '../PanelPrimitive'

describe('L0: PanelPrimitive', () => {
  let construct: PanelPrimitive

  beforeEach(() => {
    construct = new PanelPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required content', async () => {
      await construct.initialize({
        content: 'Panel content'
      })
      
      expect(construct.metadata.id).toBe('platform-l0-panel-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default dimensions', async () => {
      await construct.initialize({
        content: 'Test'
      })
      
      expect(construct.getInput('width')).toBe('100%')
      expect(construct.getInput('height')).toBe('auto')
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        title: 'My Panel',
        content: <div>Custom content</div>,
        width: '300px',
        height: '500px'
      })
      
      expect(construct.getInput('title')).toBe('My Panel')
      expect(construct.getInput('width')).toBe('300px')
      expect(construct.getInput('height')).toBe('500px')
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ content: 'Test' })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ content: 'Test' })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(15)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ content: 'Test' })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ content: 'Test' })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({ content: 'Test panel' })
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should display content', async () => {
      await construct.initialize({
        content: 'Panel content text'
      })
      
      render(construct.render())
      
      expect(screen.getByText('Panel content text')).toBeInTheDocument()
    })

    it('should display React element content', async () => {
      await construct.initialize({
        content: (
          <div>
            <h3>React Content</h3>
            <p>Paragraph text</p>
          </div>
        )
      })
      
      render(construct.render())
      
      expect(screen.getByText('React Content')).toBeInTheDocument()
      expect(screen.getByText('Paragraph text')).toBeInTheDocument()
    })

    it('should display title when provided', async () => {
      await construct.initialize({
        title: 'Panel Title',
        content: 'Panel body'
      })
      
      render(construct.render())
      
      expect(screen.getByText('Panel Title')).toBeInTheDocument()
      expect(screen.getByText('Panel body')).toBeInTheDocument()
    })

    it('should not display title section when not provided', async () => {
      await construct.initialize({
        content: 'No title panel'
      })
      
      render(construct.render())
      
      expect(screen.getByText('No title panel')).toBeInTheDocument()
      
      const outputs = construct.getOutputs()
      expect(outputs.titleElement).toBeUndefined()
    })

    it('should apply width and height styles', async () => {
      await construct.initialize({
        content: 'Sized panel',
        width: '400px',
        height: '600px'
      })
      
      const { container } = render(construct.render())
      
      const panel = container.firstChild as HTMLElement
      expect(panel.style.width).toBe('400px')
      expect(panel.style.height).toBe('600px')
    })

    it('should have overflow auto', async () => {
      await construct.initialize({
        content: 'Scrollable content'
      })
      
      const { container } = render(construct.render())
      
      const panel = container.firstChild as HTMLElement
      expect(panel.style.overflow).toBe('auto')
    })

    it('should have no styling beyond dimensions', async () => {
      await construct.initialize({
        content: 'Unstyled panel'
      })
      
      const { container } = render(construct.render())
      
      const panel = container.firstChild as HTMLElement
      // Should only have width, height, and overflow styles
      expect(panel.style.cssText).toMatch(/^(width: 100%; height: auto; overflow: auto;|overflow: auto; width: 100%; height: auto;)/)
      expect(panel.className).toBe('')
    })
  })

  describe('Dimensions', () => {
    it('should return current dimensions', async () => {
      await construct.initialize({
        content: 'Test',
        width: '250px',
        height: '350px'
      })
      
      const dimensions = construct.getDimensions()
      expect(dimensions).toEqual({
        width: '250px',
        height: '350px'
      })
    })

    it('should return default dimensions when not specified', async () => {
      await construct.initialize({
        content: 'Default size'
      })
      
      const dimensions = construct.getDimensions()
      expect(dimensions).toEqual({
        width: '100%',
        height: 'auto'
      })
    })

    it('should accept various CSS units', async () => {
      await construct.initialize({
        content: 'Various units',
        width: '50vw',
        height: '100vh'
      })
      
      const dimensions = construct.getDimensions()
      expect(dimensions).toEqual({
        width: '50vw',
        height: '100vh'
      })
    })
  })

  describe('Outputs', () => {
    it('should set panelElement output', async () => {
      await construct.initialize({ content: 'Panel' })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.panelElement).toBeDefined()
      expect(outputs.panelElement).toBeInstanceOf(HTMLDivElement)
    })

    it('should set titleElement output when title provided', async () => {
      await construct.initialize({
        title: 'Title',
        content: 'Content'
      })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.titleElement).toBeDefined()
      expect(outputs.titleElement).toBeInstanceOf(HTMLDivElement)
      expect(outputs.titleElement.textContent).toBe('Title')
    })

    it('should set contentElement output', async () => {
      await construct.initialize({ content: 'Content area' })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.contentElement).toBeDefined()
      expect(outputs.contentElement).toBeInstanceOf(HTMLDivElement)
      expect(outputs.contentElement.textContent).toBe('Content area')
    })

    it('should set dimensions output', async () => {
      await construct.initialize({
        content: 'Test',
        width: '300px',
        height: '400px'
      })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.dimensions).toEqual({
        width: '300px',
        height: '400px'
      })
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ content: 'Test' })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ content: 'Test' })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({ content: 'Test' })
      
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should have no visual enhancements', async () => {
      await construct.initialize({
        title: 'Plain Panel',
        content: 'No styling'
      })
      
      const { container } = render(construct.render())
      
      // Check all elements have no styling
      const allElements = container.querySelectorAll('*')
      allElements.forEach(el => {
        const element = el as HTMLElement
        // Only the root panel should have dimension styles
        if (element === container.firstChild) {
          expect(element.style.border).toBe('')
          expect(element.style.boxShadow).toBe('')
          expect(element.style.backgroundColor).toBe('')
        } else {
          // Other elements should have no styles
          expect(element.style.cssText).toBe('')
        }
      })
    })

    it('should have no interactive features', async () => {
      await construct.initialize({
        title: 'Static Panel',
        content: 'No interactions'
      })
      
      const { container } = render(construct.render())
      
      // No collapse/expand buttons
      expect(container.querySelector('button')).toBeNull()
      // No resize handles
      expect(container.querySelector('.resize-handle')).toBeNull()
      // No close buttons
      expect(container.querySelector('.close')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      await construct.initialize({ content: '' })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.contentElement).toBeDefined()
      expect(outputs.contentElement.textContent).toBe('')
    })

    it('should handle null content', async () => {
      await construct.initialize({ content: null })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.contentElement).toBeDefined()
    })

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000)
      await construct.initialize({
        content: longContent,
        height: '200px'
      })
      
      render(construct.render())
      
      expect(screen.getByText(longContent)).toBeInTheDocument()
    })

    it('should handle special characters in title', async () => {
      await construct.initialize({
        title: '<script>alert("xss")</script>',
        content: 'Safe content'
      })
      
      render(construct.render())
      
      // React should escape this
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
    })

    it('should handle percentage dimensions', async () => {
      await construct.initialize({
        content: 'Percentage sized',
        width: '50%',
        height: '75%'
      })
      
      const { container } = render(construct.render())
      
      const panel = container.firstChild as HTMLElement
      expect(panel.style.width).toBe('50%')
      expect(panel.style.height).toBe('75%')
    })

    it('should handle calc() dimensions', async () => {
      await construct.initialize({
        content: 'Calc sized',
        width: 'calc(100% - 20px)',
        height: 'calc(100vh - 100px)'
      })
      
      const dimensions = construct.getDimensions()
      expect(dimensions.width).toBe('calc(100% - 20px)')
      expect(dimensions.height).toBe('calc(100vh - 100px)')
    })
  })
})