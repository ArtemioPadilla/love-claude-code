import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TerminalPrimitive } from '../TerminalPrimitive'

describe('L0: TerminalPrimitive', () => {
  let construct: TerminalPrimitive

  beforeEach(() => {
    construct = new TerminalPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required lines', async () => {
      await construct.initialize({
        lines: ['Hello Terminal', 'Line 2']
      })
      
      expect(construct.metadata.id).toBe('platform-l0-terminal-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should accept empty lines array', async () => {
      await construct.initialize({
        lines: []
      })
      
      const outputs = construct.getOutputs()
      expect(outputs.lineCount).toBe(0)
    })

    it('should use default maxLines value', async () => {
      await construct.initialize({
        lines: ['test']
      })
      
      expect(construct.getInput('maxLines')).toBe(1000)
    })

    it('should use default autoScroll value', async () => {
      await construct.initialize({
        lines: ['test']
      })
      
      expect(construct.getInput('autoScroll')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        lines: ['line1'],
        maxLines: 500,
        autoScroll: false
      })
      
      expect(construct.getInput('maxLines')).toBe(500)
      expect(construct.getInput('autoScroll')).toBe(false)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ lines: [] })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ lines: [] })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(20)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ lines: [] })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ lines: [] })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({ lines: ['Test line'] })
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should display all lines', async () => {
      await construct.initialize({
        lines: ['Line 1', 'Line 2', 'Line 3']
      })
      
      render(construct.render())
      
      expect(screen.getByText('Line 1')).toBeInTheDocument()
      expect(screen.getByText('Line 2')).toBeInTheDocument()
      expect(screen.getByText('Line 3')).toBeInTheDocument()
    })

    it('should apply terminal styling', async () => {
      await construct.initialize({ lines: ['Test'] })
      
      const { container } = render(construct.render())
      
      const terminal = container.firstChild as HTMLElement
      expect(terminal.style.fontFamily).toBe('monospace')
      expect(terminal.style.backgroundColor).toBe('rgb(0, 0, 0)')
      expect(terminal.style.color).toBe('rgb(255, 255, 255)')
    })

    it('should show input field when onInput is provided', async () => {
      const onInput = vi.fn()
      await construct.initialize({
        lines: ['$ '],
        onInput
      })
      
      render(construct.render())
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should not show input field when onInput is not provided', async () => {
      await construct.initialize({
        lines: ['Output only']
      })
      
      render(construct.render())
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('should display prompt symbol with input', async () => {
      await construct.initialize({
        lines: [],
        onInput: vi.fn()
      })
      
      render(construct.render())
      
      expect(screen.getByText('$')).toBeInTheDocument()
    })
  })

  describe('Input Handling', () => {
    it('should capture user input', async () => {
      const onInput = vi.fn()
      await construct.initialize({
        lines: [],
        onInput
      })
      
      render(construct.render())
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test command')
      
      expect(input).toHaveValue('test command')
    })

    it('should invoke onInput callback on Enter', async () => {
      const onInput = vi.fn()
      await construct.initialize({
        lines: [],
        onInput
      })
      
      render(construct.render())
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test command{enter}')
      
      expect(onInput).toHaveBeenCalledWith('test command')
    })

    it('should clear input after Enter', async () => {
      const onInput = vi.fn()
      await construct.initialize({
        lines: [],
        onInput
      })
      
      render(construct.render())
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test command{enter}')
      
      expect(input).toHaveValue('')
    })

    it('should not invoke onInput for empty input', async () => {
      const onInput = vi.fn()
      await construct.initialize({
        lines: [],
        onInput
      })
      
      render(construct.render())
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, '   {enter}')
      
      expect(onInput).not.toHaveBeenCalled()
    })

    it('should focus input when terminal is clicked', async () => {
      await construct.initialize({
        lines: ['Click me'],
        onInput: vi.fn()
      })
      
      const { container } = render(construct.render())
      const terminal = container.firstChild as HTMLElement
      const input = screen.getByRole('textbox')
      
      fireEvent.click(terminal)
      
      expect(document.activeElement).toBe(input)
    })
  })

  describe('Line Management', () => {
    it('should add new lines', async () => {
      await construct.initialize({ lines: ['Initial'] })
      
      render(construct.render())
      
      construct.addLine('New line')
      
      await waitFor(() => {
        expect(screen.getByText('New line')).toBeInTheDocument()
      })
    })

    it('should respect maxLines limit', async () => {
      await construct.initialize({
        lines: ['Line 1', 'Line 2', 'Line 3'],
        maxLines: 3
      })
      
      render(construct.render())
      
      construct.addLine('Line 4')
      
      await waitFor(() => {
        // Line 1 should be removed
        expect(screen.queryByText('Line 1')).not.toBeInTheDocument()
        expect(screen.getByText('Line 2')).toBeInTheDocument()
        expect(screen.getByText('Line 3')).toBeInTheDocument()
        expect(screen.getByText('Line 4')).toBeInTheDocument()
      })
    })

    it('should clear all lines', async () => {
      await construct.initialize({
        lines: ['Line 1', 'Line 2', 'Line 3']
      })
      
      render(construct.render())
      
      construct.clear()
      
      await waitFor(() => {
        expect(screen.queryByText('Line 1')).not.toBeInTheDocument()
        expect(screen.queryByText('Line 2')).not.toBeInTheDocument()
        expect(screen.queryByText('Line 3')).not.toBeInTheDocument()
      })
    })
  })

  describe('Scrolling', () => {
    it('should enable scrolling for overflow content', async () => {
      await construct.initialize({ lines: ['Test'] })
      
      const { container } = render(construct.render())
      
      const terminal = container.firstChild as HTMLElement
      expect(terminal.style.overflowY).toBe('auto')
    })

    it('should track scroll position in outputs', async () => {
      await construct.initialize({ lines: Array(50).fill('Line') })
      
      const { container } = render(construct.render())
      const terminal = container.firstChild as HTMLElement
      
      // Simulate scroll
      terminal.scrollTop = 100
      fireEvent.scroll(terminal)
      
      const outputs = construct.getOutputs()
      expect(outputs.scrollPosition).toBe(100)
    })

    // Note: Auto-scroll testing would require mocking scrollHeight
    // which is challenging in jsdom environment
  })

  describe('Outputs', () => {
    it('should set terminalElement output after render', async () => {
      await construct.initialize({ lines: ['Test'] })
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.terminalElement).toBeDefined()
        expect(outputs.terminalElement).toBe(container.firstChild)
      })
    })

    it('should track line count', async () => {
      await construct.initialize({
        lines: ['Line 1', 'Line 2', 'Line 3']
      })
      
      render(construct.render())
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.lineCount).toBe(3)
      })
    })

    it('should update line count when lines change', async () => {
      await construct.initialize({ lines: ['Initial'] })
      
      render(construct.render())
      
      construct.addLine('New line')
      
      await waitFor(() => {
        const outputs = construct.getOutputs()
        expect(outputs.lineCount).toBe(2)
      })
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ lines: [] })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ lines: [] })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({ lines: [] })
      
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should have minimal styling', async () => {
      await construct.initialize({ lines: ['Test'] })
      
      const { container } = render(construct.render())
      const terminal = container.firstChild as HTMLElement
      
      // Only basic black/white styling
      expect(terminal.style.backgroundColor).toBe('rgb(0, 0, 0)')
      expect(terminal.style.color).toBe('rgb(255, 255, 255)')
    })

    it('should not support ANSI colors', async () => {
      await construct.initialize({
        lines: ['\x1b[31mRed text\x1b[0m']
      })
      
      render(construct.render())
      
      // Should display raw ANSI codes
      expect(screen.getByText(/Red text/)).toBeInTheDocument()
    })

    it('should not have command history', async () => {
      await construct.initialize({
        lines: [],
        onInput: vi.fn()
      })
      
      render(construct.render())
      
      const input = screen.getByRole('textbox')
      
      // Try arrow up for history
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      
      // Should not populate with previous commands
      expect(input).toHaveValue('')
    })

    it('should use monospace font', async () => {
      await construct.initialize({ lines: ['Monospace'] })
      
      const { container } = render(construct.render())
      const terminal = container.firstChild as HTMLElement
      
      expect(terminal.style.fontFamily).toBe('monospace')
    })

    it('should have basic text wrapping', async () => {
      await construct.initialize({ lines: ['Very long line that should wrap'] })
      
      const { container } = render(construct.render())
      const terminal = container.firstChild as HTMLElement
      
      expect(terminal.style.whiteSpace).toBe('pre-wrap')
      expect(terminal.style.wordBreak).toBe('break-all')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty lines', async () => {
      await construct.initialize({
        lines: ['Line 1', '', 'Line 3']
      })
      
      render(construct.render())
      
      const divs = screen.getAllByText((content, element) => {
        return element?.tagName === 'DIV' && (content === 'Line 1' || content === '' || content === 'Line 3')
      })
      
      expect(divs).toHaveLength(3)
    })

    it('should handle very long lines', async () => {
      const longLine = 'A'.repeat(1000)
      await construct.initialize({
        lines: [longLine]
      })
      
      render(construct.render())
      
      expect(screen.getByText(longLine)).toBeInTheDocument()
    })

    it('should handle special characters', async () => {
      await construct.initialize({
        lines: ['<script>alert("xss")</script>', '& < > " \'']
      })
      
      render(construct.render())
      
      // React should escape these by default
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
      expect(screen.getByText('& < > " \'')).toBeInTheDocument()
    })
  })
})