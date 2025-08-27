import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegratedTerminal } from '../IntegratedTerminal'

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (content: string) => {
      // Simple mock sanitization
      return content.replace(/[<>]/g, '')
    }
  }
}))

describe('L1: IntegratedTerminal', () => {
  let construct: IntegratedTerminal

  beforeEach(() => {
    construct = new IntegratedTerminal()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.id).toBe('platform-l1-integrated-terminal')
      expect(construct.level).toBe('L1')
      expect(construct.getInput('theme')).toBe('dark')
      expect(construct.getInput('enableCommandHistory')).toBe(true)
      expect(construct.getInput('enableAnsiColors')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        theme: 'solarized',
        shellType: 'zsh',
        fontSize: 16,
        maxHistory: 200,
        prompt: '[${user}@${host} ${cwd}]% '
      })
      
      expect(construct.getInput('theme')).toBe('solarized')
      expect(construct.getInput('shellType')).toBe('zsh')
      expect(construct.getInput('fontSize')).toBe(16)
      expect(construct.getInput('maxHistory')).toBe(200)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({})
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({})
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(75)
    })

    it('should be built with L0 TerminalPrimitive', async () => {
      await construct.initialize({})
      
      expect(construct.getBuiltWithConstructs()).toContain('platform-l0-terminal-primitive')
    })
  })

  describe('Command Execution', () => {
    beforeEach(async () => {
      await construct.initialize({
        onCommand: async (command, args) => {
          if (command === 'test') {
            return { success: true, output: 'Test output' }
          }
          return { success: false, output: `Command not found: ${command}` }
        }
      })
    })

    it('should execute commands', async () => {
      await construct.executeCommand('test arg1 arg2')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines.some(l => l.content[0].text.includes('test arg1 arg2'))).toBe(true)
      expect(lines.some(l => l.content[0].text === 'Test output')).toBe(true)
    })

    it('should handle command errors', async () => {
      await construct.executeCommand('unknown')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines.some(l => l.type === 'error')).toBe(true)
    })

    it('should update isExecuting state', async () => {
      expect(construct.getOutput('isExecuting')).toBe(false)
      
      const promise = construct.executeCommand('test')
      expect(construct.getOutput('isExecuting')).toBe(true)
      
      await promise
      expect(construct.getOutput('isExecuting')).toBe(false)
    })
  })

  describe('Built-in Commands', () => {
    beforeEach(async () => {
      await construct.initialize({})
    })

    it('should handle clear command', async () => {
      construct.writeLine('Some output')
      expect((construct.getOutput('lines') as any[]).length).toBeGreaterThan(0)
      
      await construct.executeCommand('clear')
      expect((construct.getOutput('lines') as any[]).length).toBe(0)
    })

    it('should handle pwd command', async () => {
      await construct.executeCommand('pwd')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines.some(l => l.content[0].text === '~')).toBe(true)
    })

    it('should handle cd command', async () => {
      await construct.executeCommand('cd /usr/local')
      expect(construct.getOutput('currentDirectory')).toBe('/usr/local')
      
      await construct.executeCommand('cd ~')
      expect(construct.getOutput('currentDirectory')).toBe('/home/user')
    })

    it('should handle echo command', async () => {
      await construct.executeCommand('echo Hello World')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines.some(l => l.content[0].text === 'Hello World')).toBe(true)
    })

    it('should handle export command', async () => {
      await construct.executeCommand('export TEST_VAR=value')
      
      const env = construct.getOutput('environment') as Record<string, string>
      expect(env.TEST_VAR).toBe('value')
    })
  })

  describe('Command History', () => {
    beforeEach(async () => {
      await construct.initialize({
        enableCommandHistory: true,
        maxHistory: 5
      })
    })

    it('should track command history', async () => {
      await construct.executeCommand('command1')
      await construct.executeCommand('command2')
      await construct.executeCommand('command3')
      
      const history = construct.getOutput('commandHistory') as string[]
      expect(history).toEqual(['command1', 'command2', 'command3'])
    })

    it('should limit history size', async () => {
      for (let i = 0; i < 10; i++) {
        await construct.executeCommand(`command${i}`)
      }
      
      const history = construct.getOutput('commandHistory') as string[]
      expect(history.length).toBe(5)
      expect(history[0]).toBe('command5')
    })

    it('should navigate history with arrows', async () => {
      await construct.executeCommand('first')
      await construct.executeCommand('second')
      await construct.executeCommand('third')
      
      expect(construct.getPreviousCommand()).toBe('third')
      expect(construct.getPreviousCommand()).toBe('second')
      expect(construct.getPreviousCommand()).toBe('first')
      expect(construct.getNextCommand()).toBe('second')
    })
  })

  describe('ANSI Color Support', () => {
    it('should parse ANSI color codes when enabled', async () => {
      await construct.initialize({
        enableAnsiColors: true
      })
      
      construct.writeLine('\x1b[31mRed text\x1b[0m Normal text')
      
      const lines = construct.getOutput('lines') as any[]
      const parsed = lines[0].content
      expect(parsed[0].style.color).toBe('#ff0000')
      expect(parsed[1].text).toBe(' Normal text')
    })

    it('should ignore ANSI codes when disabled', async () => {
      await construct.initialize({
        enableAnsiColors: false
      })
      
      construct.writeLine('\x1b[31mRed text\x1b[0m')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines[0].content[0].text).toBe('\x1b[31mRed text\x1b[0m')
    })
  })

  describe('Autocomplete', () => {
    beforeEach(async () => {
      await construct.initialize({
        enableAutoComplete: true
      })
    })

    it('should provide autocomplete suggestions', () => {
      const suggestions = construct.getAutocompleteSuggestions('cl')
      expect(suggestions).toContain('clear')
      expect(suggestions).toContain('cls')
    })

    it('should include history in suggestions', async () => {
      await construct.executeCommand('custom-command')
      
      const suggestions = construct.getAutocompleteSuggestions('cus')
      expect(suggestions).toContain('custom-command')
    })

    it('should return empty when disabled', async () => {
      await construct.initialize({
        enableAutoComplete: false
      })
      
      const suggestions = construct.getAutocompleteSuggestions('cl')
      expect(suggestions).toEqual([])
    })
  })

  describe('Theme Support', () => {
    it('should provide theme configuration', async () => {
      await construct.initialize({
        theme: 'dark'
      })
      
      const theme = construct.getThemeConfig()
      expect(theme.background).toBe('#1e1e1e')
      expect(theme.foreground).toBe('#d4d4d4')
    })

    it('should support multiple themes', () => {
      const themes = ['dark', 'light', 'solarized', 'monokai']
      
      themes.forEach(async themeName => {
        await construct.initialize({ theme: themeName })
        const theme = construct.getThemeConfig()
        expect(theme.background).toBeDefined()
        expect(theme.foreground).toBeDefined()
      })
    })
  })

  describe('Output Management', () => {
    beforeEach(async () => {
      await construct.initialize({
        maxLines: 10
      })
    })

    it('should write different line types', () => {
      construct.writeLine('Normal output')
      construct.writeLine('Error message', 'error')
      construct.writeLine('Info message', 'info')
      construct.writeLine('Warning message', 'warning')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines[0].type).toBe('output')
      expect(lines[1].type).toBe('error')
      expect(lines[2].type).toBe('info')
      expect(lines[3].type).toBe('warning')
    })

    it('should limit output lines', () => {
      for (let i = 0; i < 20; i++) {
        construct.writeLine(`Line ${i}`)
      }
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines.length).toBe(10)
      expect(lines[0].content[0].text).toBe('Line 10')
    })

    it('should sanitize output', () => {
      construct.writeLine('<script>alert("xss")</script>')
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines[0].content[0].text).toBe('scriptalert("xss")/script')
    })
  })

  describe('Environment Variables', () => {
    it('should initialize default environment', async () => {
      await construct.initialize({})
      
      const env = construct.getOutput('environment') as Record<string, string>
      expect(env.USER).toBeDefined()
      expect(env.HOME).toBeDefined()
      expect(env.PWD).toBeDefined()
      expect(env.SHELL).toBeDefined()
    })

    it('should update environment variables', async () => {
      await construct.initialize({})
      
      await construct.executeCommand('export NEW_VAR=test')
      
      const env = construct.getOutput('environment') as Record<string, string>
      expect(env.NEW_VAR).toBe('test')
    })
  })

  describe('Prompt Formatting', () => {
    it('should format prompt with variables', async () => {
      await construct.initialize({
        prompt: '${user}@${host}:${cwd}$ '
      })
      
      const prompt = construct['formatPrompt']()
      expect(prompt).toContain('user@localhost:~$')
    })
  })

  describe('UI Rendering', () => {
    it('should render terminal interface', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.integrated-terminal')).toBeInTheDocument()
        expect(container.querySelector('.terminal-content')).toBeInTheDocument()
        expect(container.querySelector('input')).toBeInTheDocument()
      })
    })

    it('should handle user input', async () => {
      await construct.initialize({})
      
      const { container } = render(construct.render())
      const user = userEvent.setup()
      
      const input = container.querySelector('input')!
      await user.type(input, 'echo test')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        const content = container.querySelector('.terminal-content')
        expect(content?.textContent).toContain('echo test')
      })
    })
  })

  describe('L1 Characteristics', () => {
    it('should have enhanced features over L0', async () => {
      await construct.initialize({})
      
      // Should have command history
      expect(construct.inputs.some(i => i.name === 'enableCommandHistory')).toBe(true)
      
      // Should have themes
      expect(construct.inputs.some(i => i.name === 'theme')).toBe(true)
      
      // Should have ANSI color support
      expect(construct.inputs.some(i => i.name === 'enableAnsiColors')).toBe(true)
      
      // Should have autocomplete
      expect(construct.inputs.some(i => i.name === 'enableAutoComplete')).toBe(true)
    })

    it('should provide enhanced outputs', async () => {
      await construct.initialize({})
      
      // Should track command history
      expect(construct.outputs.some(o => o.name === 'commandHistory')).toBe(true)
      
      // Should track environment
      expect(construct.outputs.some(o => o.name === 'environment')).toBe(true)
      
      // Should track execution state
      expect(construct.outputs.some(o => o.name === 'isExecuting')).toBe(true)
    })

    it('should have security metadata', async () => {
      await construct.initialize({})
      
      const security = construct.metadata.security
      expect(security.length).toBeGreaterThan(0)
      expect(security.some((s: any) => s.aspect === 'Command Injection Prevention')).toBe(true)
      expect(security.some((s: any) => s.aspect === 'XSS Protection')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty commands', async () => {
      await construct.initialize({})
      
      await construct.executeCommand('')
      await construct.executeCommand('   ')
      
      // Should not add empty commands
      const history = construct.getOutput('commandHistory') as string[]
      expect(history.length).toBe(0)
    })

    it('should handle very long output', async () => {
      await construct.initialize({
        maxLines: 100
      })
      
      const longLine = 'a'.repeat(1000)
      construct.writeLine(longLine)
      
      const lines = construct.getOutput('lines') as any[]
      expect(lines[0].content[0].text.length).toBe(1000)
    })
  })
})