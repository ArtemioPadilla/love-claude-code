import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ButtonPrimitive } from '../ButtonPrimitive'

describe('L0: ButtonPrimitive', () => {
  let construct: ButtonPrimitive

  beforeEach(() => {
    construct = new ButtonPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required text', async () => {
      await construct.initialize({
        text: 'Click Me'
      })
      
      expect(construct.metadata.id).toBe('platform-l0-button-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default values for optional parameters', async () => {
      await construct.initialize({
        text: 'Button'
      })
      
      expect(construct.getInput('disabled')).toBe(false)
      expect(construct.getInput('type')).toBe('button')
    })

    it('should accept custom configuration', async () => {
      const onClick = vi.fn()
      await construct.initialize({
        text: 'Submit',
        onClick,
        disabled: true,
        type: 'submit'
      })
      
      expect(construct.getInput('text')).toBe('Submit')
      expect(construct.getInput('onClick')).toBe(onClick)
      expect(construct.getInput('disabled')).toBe(true)
      expect(construct.getInput('type')).toBe('submit')
    })

    it('should validate button type', async () => {
      await expect(
        construct.initialize({
          text: 'Invalid',
          type: 'invalid-type' as any
        })
      ).rejects.toThrow()
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ text: 'Test' })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ text: 'Test' })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(15)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ text: 'Test' })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ text: 'Test' })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({ text: 'Test Button' })
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should display button text', async () => {
      await construct.initialize({ text: 'Click Me' })
      
      render(construct.render())
      
      expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('should render as a button element', async () => {
      await construct.initialize({ text: 'Button' })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should set button type attribute', async () => {
      await construct.initialize({
        text: 'Submit',
        type: 'submit'
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should apply disabled state', async () => {
      await construct.initialize({
        text: 'Disabled',
        disabled: true
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should have no styling', async () => {
      await construct.initialize({ text: 'Unstyled' })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      // Should have no class or style attributes beyond browser defaults
      expect(button.className).toBe('')
      expect(button.style.length).toBe(0)
    })
  })

  describe('Click Handling', () => {
    it('should handle click events', async () => {
      const onClick = vi.fn()
      await construct.initialize({
        text: 'Click Me',
        onClick
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should pass event object to onClick', async () => {
      const onClick = vi.fn()
      await construct.initialize({
        text: 'Click',
        onClick
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({
        type: 'click',
        target: button
      }))
    })

    it('should not trigger onClick when disabled', async () => {
      const onClick = vi.fn()
      await construct.initialize({
        text: 'Disabled',
        disabled: true,
        onClick
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should track click count', async () => {
      await construct.initialize({
        text: 'Track Clicks',
        onClick: () => {}
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      
      expect(construct.getClickStats().clickCount).toBe(0)
      
      fireEvent.click(button)
      expect(construct.getClickStats().clickCount).toBe(1)
      
      fireEvent.click(button)
      expect(construct.getClickStats().clickCount).toBe(2)
    })

    it('should track last click time', async () => {
      await construct.initialize({
        text: 'Track Time',
        onClick: () => {}
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      
      expect(construct.getClickStats().lastClickTime).toBeNull()
      
      const beforeClick = new Date()
      fireEvent.click(button)
      const afterClick = new Date()
      
      const lastClick = construct.getClickStats().lastClickTime
      expect(lastClick).toBeInstanceOf(Date)
      expect(lastClick!.getTime()).toBeGreaterThanOrEqual(beforeClick.getTime())
      expect(lastClick!.getTime()).toBeLessThanOrEqual(afterClick.getTime())
    })
  })

  describe('Outputs', () => {
    it('should set buttonElement output after render', async () => {
      await construct.initialize({ text: 'Output Test' })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.buttonElement).toBeDefined()
      expect(outputs.buttonElement).toBeInstanceOf(HTMLButtonElement)
    })

    it('should initialize click count output', async () => {
      await construct.initialize({ text: 'Count' })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.clickCount).toBe(0)
    })

    it('should initialize lastClickTime output', async () => {
      await construct.initialize({ text: 'Time' })
      
      render(construct.render())
      
      const outputs = construct.getOutputs()
      expect(outputs.lastClickTime).toBeNull()
    })

    it('should update outputs on click', async () => {
      await construct.initialize({
        text: 'Update',
        onClick: () => {}
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      const outputs = construct.getOutputs()
      expect(outputs.clickCount).toBe(1)
      expect(outputs.lastClickTime).toBeInstanceOf(Date)
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ text: 'Test' })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ text: 'Test' })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({ text: 'Test' })
      
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should have no visual enhancements', async () => {
      await construct.initialize({ text: 'Plain' })
      
      const { container } = render(construct.render())
      const button = container.querySelector('button')
      
      // No icons, loading states, or decorations
      expect(container.querySelector('svg')).toBeNull()
      expect(container.querySelector('.spinner')).toBeNull()
      expect(container.querySelector('.icon')).toBeNull()
    })

    it('should use browser default styling', async () => {
      await construct.initialize({ text: 'Default' })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      
      // No custom styles applied
      expect(button.style.cssText).toBe('')
      expect(button.className).toBe('')
    })
  })

  describe('Form Integration', () => {
    it('should work as submit button', async () => {
      await construct.initialize({
        text: 'Submit',
        type: 'submit'
      })
      
      const form = document.createElement('form')
      const { container } = render(construct.render())
      form.appendChild(container.firstChild!)
      
      const button = screen.getByRole('button')
      expect(button.type).toBe('submit')
    })

    it('should work as reset button', async () => {
      await construct.initialize({
        text: 'Reset',
        type: 'reset'
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      expect(button.type).toBe('reset')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      await construct.initialize({ text: '' })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      expect(button.textContent).toBe('')
    })

    it('should handle special characters in text', async () => {
      await construct.initialize({
        text: '<script>alert("xss")</script>'
      })
      
      render(construct.render())
      
      // React should escape this
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
    })

    it('should handle rapid clicks', async () => {
      const onClick = vi.fn()
      await construct.initialize({
        text: 'Rapid',
        onClick
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button)
      }
      
      expect(onClick).toHaveBeenCalledTimes(10)
      expect(construct.getClickStats().clickCount).toBe(10)
    })

    it('should handle onClick throwing error', async () => {
      const onClick = vi.fn(() => {
        throw new Error('Click handler error')
      })
      
      await construct.initialize({
        text: 'Error',
        onClick
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      
      // Should not crash the component
      expect(() => fireEvent.click(button)).toThrow('Click handler error')
    })
  })
})