import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModalPrimitive } from '../ModalPrimitive'

describe('L0: ModalPrimitive', () => {
  let construct: ModalPrimitive

  beforeEach(() => {
    construct = new ModalPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required inputs', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Modal content'
      })
      
      expect(construct.metadata.id).toBe('platform-l0-modal-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default values for optional parameters', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      expect(construct.getInput('closeOnOverlayClick')).toBe(true)
      expect(construct.getInput('closeOnEscape')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: false,
        content: <div>Custom Content</div>,
        onClose,
        closeOnOverlayClick: false,
        closeOnEscape: false
      })
      
      expect(construct.getInput('isOpen')).toBe(false)
      expect(construct.getInput('onClose')).toBe(onClose)
      expect(construct.getInput('closeOnOverlayClick')).toBe(false)
      expect(construct.getInput('closeOnEscape')).toBe(false)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(20)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Render', () => {
    it('should render when isOpen is true', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Modal is open'
      })
      
      const { container } = render(construct.render())
      
      expect(container.firstChild).toBeDefined()
      expect(screen.getByText('Modal is open')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', async () => {
      await construct.initialize({
        isOpen: false,
        content: 'Hidden modal'
      })
      
      const { container } = render(construct.render())
      
      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('Hidden modal')).not.toBeInTheDocument()
    })

    it('should render React element content', async () => {
      await construct.initialize({
        isOpen: true,
        content: (
          <div>
            <h2>Modal Title</h2>
            <p>Modal paragraph</p>
          </div>
        )
      })
      
      render(construct.render())
      
      expect(screen.getByText('Modal Title')).toBeInTheDocument()
      expect(screen.getByText('Modal paragraph')).toBeInTheDocument()
    })

    it('should apply basic overlay styling', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      render(construct.render())
      
      const overlay = screen.getByText('Test').parentElement?.parentElement
      expect(overlay?.style.position).toBe('fixed')
      expect(overlay?.style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)')
      expect(overlay?.style.zIndex).toBe('1000')
    })

    it('should apply basic modal styling', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      render(construct.render())
      
      const modal = screen.getByText('Test').parentElement
      expect(modal?.style.backgroundColor).toBe('white')
      expect(modal?.style.padding).toBe('20px')
    })
  })

  describe('Overlay Click Handling', () => {
    it('should close on overlay click when enabled', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'Click outside',
        onClose,
        closeOnOverlayClick: true
      })
      
      render(construct.render())
      
      const overlay = screen.getByText('Click outside').parentElement?.parentElement
      fireEvent.click(overlay!)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close on overlay click when disabled', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'No close on overlay',
        onClose,
        closeOnOverlayClick: false
      })
      
      render(construct.render())
      
      const overlay = screen.getByText('No close on overlay').parentElement?.parentElement
      fireEvent.click(overlay!)
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not close when clicking modal content', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'Click me',
        onClose,
        closeOnOverlayClick: true
      })
      
      render(construct.render())
      
      const modalContent = screen.getByText('Click me').parentElement
      fireEvent.click(modalContent!)
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Escape Key Handling', () => {
    it('should close on Escape when enabled', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'Press Escape',
        onClose,
        closeOnEscape: true
      })
      
      render(construct.render())
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close on Escape when disabled', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'No escape',
        onClose,
        closeOnEscape: false
      })
      
      render(construct.render())
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not respond to other keys', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'Other keys',
        onClose,
        closeOnEscape: true
      })
      
      render(construct.render())
      
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should clean up event listener on unmount', async () => {
      const onClose = vi.fn()
      await construct.initialize({
        isOpen: true,
        content: 'Cleanup test',
        onClose,
        closeOnEscape: true
      })
      
      const { unmount } = render(construct.render())
      unmount()
      
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Outputs', () => {
    it('should set modalElement output', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Modal element'
      })
      
      render(construct.render())
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.modalElement).toBeDefined()
        expect(outputs.modalElement).toBeInstanceOf(HTMLDivElement)
      })
    })

    it('should set overlayElement output', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Overlay element'
      })
      
      render(construct.render())
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.overlayElement).toBeDefined()
        expect(outputs.overlayElement).toBeInstanceOf(HTMLDivElement)
      })
    })

    it('should track visibility state', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Visible'
      })
      
      render(construct.render())
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.isVisible).toBe(true)
      })
    })

    it('should update visibility output when closed', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Will close'
      })
      
      const { rerender } = render(construct.render())
      
      // Close the modal
      construct.setInput('isOpen', false)
      rerender(construct.render())
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.isVisible).toBe(false)
      })
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Test'
      })
      
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should have no animations', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'No animations'
      })
      
      const { container } = render(construct.render())
      
      // Check for transition or animation styles
      const elements = container.querySelectorAll('*')
      elements.forEach(el => {
        const styles = window.getComputedStyle(el as HTMLElement)
        expect(styles.transition).toBe('')
        expect(styles.animation).toBe('')
      })
    })

    it('should have no accessibility features', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'No a11y'
      })
      
      render(construct.render())
      
      // Should not have ARIA attributes
      const modal = screen.getByText('No a11y').parentElement
      expect(modal?.getAttribute('role')).toBeNull()
      expect(modal?.getAttribute('aria-modal')).toBeNull()
      expect(modal?.getAttribute('aria-labelledby')).toBeNull()
    })

    it('should not trap focus', async () => {
      await construct.initialize({
        isOpen: true,
        content: <button>Focus me</button>
      })
      
      render(construct.render())
      
      const button = screen.getByRole('button')
      
      // Focus should not be automatically moved to modal
      expect(document.activeElement).not.toBe(button)
    })

    it('should not lock body scroll', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Scroll test'
      })
      
      render(construct.render())
      
      // Body should not have overflow hidden
      expect(document.body.style.overflow).not.toBe('hidden')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      await construct.initialize({
        isOpen: true,
        content: ''
      })
      
      render(construct.render())
      
      // Modal should still render with empty content
      const outputs = construct.getOutputs()
      expect(outputs.modalElement).toBeDefined()
    })

    it('should handle null content', async () => {
      await construct.initialize({
        isOpen: true,
        content: null
      })
      
      render(construct.render())
      
      // Should render without crashing
      const outputs = construct.getOutputs()
      expect(outputs.modalElement).toBeDefined()
    })

    it('should handle dynamic content updates', async () => {
      await construct.initialize({
        isOpen: true,
        content: 'Initial content'
      })
      
      const { rerender } = render(construct.render())
      
      // Update content
      construct.setInput('content', 'Updated content')
      rerender(construct.render())
      
      expect(screen.queryByText('Initial content')).not.toBeInTheDocument()
      expect(screen.getByText('Updated content')).toBeInTheDocument()
    })

    it('should handle rapid open/close', async () => {
      await construct.initialize({
        isOpen: false,
        content: 'Rapid test'
      })
      
      const { rerender } = render(construct.render())
      
      // Rapidly toggle
      for (let i = 0; i < 10; i++) {
        construct.setInput('isOpen', i % 2 === 0)
        rerender(construct.render())
      }
      
      // Should end in closed state
      expect(screen.queryByText('Rapid test')).not.toBeInTheDocument()
    })
  })
})