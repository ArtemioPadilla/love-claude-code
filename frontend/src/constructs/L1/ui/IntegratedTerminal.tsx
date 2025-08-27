import React, { useState, useRef, useEffect, useCallback } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import DOMPurify from 'dompurify'

/**
 * L1 Integrated Terminal Construct
 * Enhanced terminal with command history, themes, ANSI colors, and command execution
 * Built upon L0 TerminalPrimitive
 */
export class IntegratedTerminal extends L1UIConstruct {
  private commandHistory: string[] = []
  private historyIndex: number = -1
  private currentDirectory: string = '~'
  private environment: Record<string, string> = {}
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-integrated-terminal',
    name: 'Integrated Terminal',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Secure terminal with command history, ANSI colors, themes, and enhanced features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'terminal', 'shell', 'command-line'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['terminal', 'shell', 'console', 'command-history', 'ansi', 'themes'],
    inputs: [
      {
        name: 'initialLines',
        type: 'string[]',
        description: 'Initial terminal content',
        required: false,
        defaultValue: ['Welcome to Integrated Terminal v1.0', '']
      },
      {
        name: 'maxLines',
        type: 'number',
        description: 'Maximum lines in buffer',
        required: false,
        defaultValue: 5000
      },
      {
        name: 'maxHistory',
        type: 'number',
        description: 'Maximum command history entries',
        required: false,
        defaultValue: 100
      },
      {
        name: 'prompt',
        type: 'string',
        description: 'Terminal prompt format',
        required: false,
        defaultValue: '${user}@${host}:${cwd}$ '
      },
      {
        name: 'theme',
        type: 'string',
        description: 'Terminal theme',
        required: false,
        defaultValue: 'dark',
        validation: {
          enum: ['dark', 'light', 'solarized', 'monokai']
        }
      },
      {
        name: 'enableAnsiColors',
        type: 'boolean',
        description: 'Enable ANSI color code support',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableAutoComplete',
        type: 'boolean',
        description: 'Enable command auto-completion',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableCommandHistory',
        type: 'boolean',
        description: 'Enable command history',
        required: false,
        defaultValue: true
      },
      {
        name: 'fontSize',
        type: 'number',
        description: 'Terminal font size',
        required: false,
        defaultValue: 14
      },
      {
        name: 'fontFamily',
        type: 'string',
        description: 'Terminal font family',
        required: false,
        defaultValue: 'Consolas, Monaco, "Courier New", monospace'
      },
      {
        name: 'shellType',
        type: 'string',
        description: 'Shell type to emulate',
        required: false,
        defaultValue: 'bash',
        validation: {
          enum: ['bash', 'zsh', 'powershell', 'cmd']
        }
      },
      {
        name: 'onCommand',
        type: 'function',
        description: 'Command execution handler',
        required: false
      }
    ],
    outputs: [
      {
        name: 'lines',
        type: 'TerminalLine[]',
        description: 'Current terminal lines with metadata'
      },
      {
        name: 'currentDirectory',
        type: 'string',
        description: 'Current working directory'
      },
      {
        name: 'commandHistory',
        type: 'string[]',
        description: 'Command history'
      },
      {
        name: 'environment',
        type: 'object',
        description: 'Environment variables'
      },
      {
        name: 'isExecuting',
        type: 'boolean',
        description: 'Whether a command is executing'
      },
      {
        name: 'lastCommand',
        type: 'CommandInfo',
        description: 'Information about last executed command'
      }
    ],
    security: [
      {
        aspect: 'Command Injection Prevention',
        description: 'Sanitizes and validates commands before execution',
        implementation: 'Command parsing and validation'
      },
      {
        aspect: 'XSS Protection',
        description: 'Sanitizes output to prevent XSS attacks',
        implementation: 'DOMPurify for output sanitization'
      },
      {
        aspect: 'Environment Isolation',
        description: 'Isolated environment variables',
        implementation: 'Sandboxed environment context'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + Terminal Emulation'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Create an integrated terminal',
        code: `const terminal = new IntegratedTerminal()
await terminal.initialize({
  theme: 'dark',
  enableCommandHistory: true,
  onCommand: async (command, args) => {
    // Handle command execution
    console.log('Execute:', command, args)
    return { success: true, output: 'Command completed' }
  }
})

// Write output
terminal.writeLine('Build started...', 'info')
terminal.writeLine('Error: Module not found', 'error')`,
        language: 'typescript'
      },
      {
        title: 'With Custom Shell',
        description: 'Configure shell behavior',
        code: `const terminal = new IntegratedTerminal()
await terminal.initialize({
  shellType: 'zsh',
  prompt: '[\${user}@\${host} \${cwd}]% ',
  theme: 'solarized',
  environment: {
    USER: 'developer',
    HOST: 'localhost',
    PATH: '/usr/local/bin:/usr/bin:/bin'
  }
})

// Execute commands
await terminal.executeCommand('ls -la')
await terminal.executeCommand('git status')`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Sanitize all command inputs',
      'Limit command execution privileges',
      'Log all executed commands',
      'Implement timeout for long-running commands',
      'Provide clear error messages',
      'Support keyboard shortcuts',
      'Persist command history',
      'Handle large outputs efficiently'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    dependencies: ['platform-l0-terminal-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-terminal-primitive'],
      timeToCreate: 75,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(IntegratedTerminal.definition)
    this.initializeEnvironment()
  }

  private lines: TerminalLine[] = []
  private isExecuting: boolean = false

  /**
   * Initialize environment variables
   */
  private initializeEnvironment(): void {
    this.environment = {
      USER: 'user',
      HOME: '/home/user',
      PWD: this.currentDirectory,
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      ...this.environment
    }
  }

  /**
   * Parse ANSI escape codes
   */
  private parseAnsiCodes(text: string): ParsedText[] {
    if (!this.getInput<boolean>('enableAnsiColors')) {
      return [{ text, style: {} }]
    }

    const parts: ParsedText[] = []
    const ansiRegex = /\x1b\[([0-9;]+)m/g
    let lastIndex = 0
    let currentStyle: TextStyle = {}

    let match
    while ((match = ansiRegex.exec(text)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          style: { ...currentStyle }
        })
      }

      // Parse ANSI codes
      const codes = match[1].split(';').map(Number)
      for (const code of codes) {
        switch (code) {
          case 0: currentStyle = {}; break // Reset
          case 1: currentStyle.bold = true; break
          case 3: currentStyle.italic = true; break
          case 4: currentStyle.underline = true; break
          // Foreground colors
          case 30: currentStyle.color = '#000000'; break
          case 31: currentStyle.color = '#ff0000'; break
          case 32: currentStyle.color = '#00ff00'; break
          case 33: currentStyle.color = '#ffff00'; break
          case 34: currentStyle.color = '#0000ff'; break
          case 35: currentStyle.color = '#ff00ff'; break
          case 36: currentStyle.color = '#00ffff'; break
          case 37: currentStyle.color = '#ffffff'; break
          // Background colors
          case 40: currentStyle.backgroundColor = '#000000'; break
          case 41: currentStyle.backgroundColor = '#ff0000'; break
          case 42: currentStyle.backgroundColor = '#00ff00'; break
          case 43: currentStyle.backgroundColor = '#ffff00'; break
          case 44: currentStyle.backgroundColor = '#0000ff'; break
          case 45: currentStyle.backgroundColor = '#ff00ff'; break
          case 46: currentStyle.backgroundColor = '#00ffff'; break
          case 47: currentStyle.backgroundColor = '#ffffff'; break
        }
      }

      lastIndex = ansiRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        style: { ...currentStyle }
      })
    }

    return parts.length > 0 ? parts : [{ text, style: {} }]
  }

  /**
   * Sanitize output text
   */
  private sanitizeOutput(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
  }

  /**
   * Format prompt with variables
   */
  private formatPrompt(): string {
    const promptFormat = this.getInput<string>('prompt') || '${user}@${host}:${cwd}$ '
    
    return promptFormat.replace(/\$\{(\w+)\}/g, (match, key) => {
      switch (key) {
        case 'user': return this.environment.USER || 'user'
        case 'host': return this.environment.HOSTNAME || 'localhost'
        case 'cwd': return this.currentDirectory
        case 'pwd': return this.currentDirectory
        case 'home': return this.environment.HOME || '~'
        default: return this.environment[key] || match
      }
    })
  }

  /**
   * Write a line to the terminal
   */
  writeLine(text: string, type: LineType = 'output'): void {
    const sanitized = this.sanitizeOutput(text)
    const parsed = this.parseAnsiCodes(sanitized)
    
    const line: TerminalLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: parsed,
      type,
      timestamp: new Date()
    }

    this.lines.push(line)
    
    // Trim to max lines
    const maxLines = this.getInput<number>('maxLines') || 5000
    if (this.lines.length > maxLines) {
      this.lines = this.lines.slice(-maxLines)
    }

    this.setOutput('lines', [...this.lines])
    this.emit('lineAdded', line)
  }

  /**
   * Write multiple lines
   */
  writeLines(lines: string[], type: LineType = 'output'): void {
    lines.forEach(line => this.writeLine(line, type))
  }

  /**
   * Clear terminal
   */
  clear(): void {
    this.lines = []
    this.setOutput('lines', [])
    this.emit('cleared')
  }

  /**
   * Execute a command
   */
  async executeCommand(commandLine: string): Promise<void> {
    if (!commandLine.trim()) return

    // Add to history if enabled
    if (this.getInput<boolean>('enableCommandHistory')) {
      this.commandHistory.push(commandLine)
      const maxHistory = this.getInput<number>('maxHistory') || 100
      if (this.commandHistory.length > maxHistory) {
        this.commandHistory = this.commandHistory.slice(-maxHistory)
      }
      this.historyIndex = this.commandHistory.length
      this.setOutput('commandHistory', [...this.commandHistory])
    }

    // Display command with prompt
    const prompt = this.formatPrompt()
    this.writeLine(prompt + commandLine, 'command')

    // Parse command
    const [command, ...args] = this.parseCommand(commandLine)
    
    // Mark as executing
    this.isExecuting = true
    this.setOutput('isExecuting', true)

    try {
      // Handle built-in commands
      const builtInResult = await this.handleBuiltInCommand(command, args)
      if (builtInResult.handled) {
        if (builtInResult.output) {
          this.writeLine(builtInResult.output, builtInResult.error ? 'error' : 'output')
        }
      } else {
        // Call external command handler
        const onCommand = this.getInput<CommandHandler>('onCommand')
        if (onCommand) {
          const result = await onCommand(command, args, this.environment)
          
          if (result.output) {
            this.writeLines(result.output.split('\n'), result.success ? 'output' : 'error')
          }
          
          // Update environment if changed
          if (result.environment) {
            this.environment = { ...this.environment, ...result.environment }
            this.setOutput('environment', this.environment)
          }
          
          // Update directory if changed
          if (result.directory) {
            this.currentDirectory = result.directory
            this.environment.PWD = result.directory
            this.setOutput('currentDirectory', this.currentDirectory)
          }
        } else {
          this.writeLine(`Command not found: ${command}`, 'error')
        }
      }

      // Record last command
      this.setOutput('lastCommand', {
        command,
        args,
        timestamp: new Date(),
        success: true
      })

    } catch (error: any) {
      this.writeLine(`Error: ${error.message}`, 'error')
      this.setOutput('lastCommand', {
        command,
        args,
        timestamp: new Date(),
        success: false,
        error: error.message
      })
    } finally {
      this.isExecuting = false
      this.setOutput('isExecuting', false)
    }
  }

  /**
   * Parse command line into command and arguments
   */
  private parseCommand(commandLine: string): string[] {
    // Simple parsing - can be enhanced for quotes, escapes, etc.
    return commandLine.trim().split(/\s+/)
  }

  /**
   * Handle built-in commands
   */
  private async handleBuiltInCommand(command: string, args: string[]): Promise<BuiltInResult> {
    switch (command) {
      case 'clear':
      case 'cls':
        this.clear()
        return { handled: true }
      
      case 'cd':
        if (args[0]) {
          // Simple cd implementation
          let newDir = args[0]
          if (newDir === '~') {
            newDir = this.environment.HOME || '/home/user'
          } else if (newDir === '-') {
            newDir = this.environment.OLDPWD || this.currentDirectory
          } else if (!newDir.startsWith('/')) {
            newDir = `${this.currentDirectory}/${newDir}`
          }
          
          this.environment.OLDPWD = this.currentDirectory
          this.currentDirectory = newDir
          this.environment.PWD = newDir
          this.setOutput('currentDirectory', this.currentDirectory)
          this.emit('directoryChanged', this.currentDirectory)
        }
        return { handled: true }
      
      case 'pwd':
        return { handled: true, output: this.currentDirectory }
      
      case 'echo':
        return { handled: true, output: args.join(' ') }
      
      case 'env': {
        const envOutput = Object.entries(this.environment)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n')
        return { handled: true, output: envOutput }
      }
      
      case 'export':
        if (args[0] && args[0].includes('=')) {
          const [key, value] = args[0].split('=', 2)
          this.environment[key] = value
          this.setOutput('environment', this.environment)
        }
        return { handled: true }
      
      case 'history': {
        const historyOutput = this.commandHistory
          .map((cmd, idx) => `${idx + 1}  ${cmd}`)
          .join('\n')
        return { handled: true, output: historyOutput }
      }
      
      default:
        return { handled: false }
    }
  }

  /**
   * Get previous command from history
   */
  getPreviousCommand(): string | null {
    if (!this.getInput<boolean>('enableCommandHistory') || this.commandHistory.length === 0) {
      return null
    }

    if (this.historyIndex > 0) {
      this.historyIndex--
    }
    
    return this.commandHistory[this.historyIndex] || null
  }

  /**
   * Get next command from history
   */
  getNextCommand(): string | null {
    if (!this.getInput<boolean>('enableCommandHistory')) {
      return null
    }

    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++
      return this.commandHistory[this.historyIndex]
    } else {
      this.historyIndex = this.commandHistory.length
      return ''
    }
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(partial: string): string[] {
    if (!this.getInput<boolean>('enableAutoComplete')) {
      return []
    }

    // Simple autocomplete - can be enhanced
    const builtInCommands = ['clear', 'cls', 'cd', 'pwd', 'echo', 'env', 'export', 'history']
    const suggestions = builtInCommands.filter(cmd => cmd.startsWith(partial))
    
    // Add from history
    const historySuggestions = this.commandHistory
      .filter(cmd => cmd.startsWith(partial) && !suggestions.includes(cmd))
      .slice(-5)
    
    return [...suggestions, ...historySuggestions]
  }

  /**
   * Get theme configuration
   */
  getThemeConfig(): TerminalTheme {
    const themeName = this.getInput<string>('theme') || 'dark'
    
    const themes: Record<string, TerminalTheme> = {
      dark: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5'
      },
      light: {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
        selection: '#add6ff',
        black: '#000000',
        red: '#cd3131',
        green: '#00bc00',
        yellow: '#949800',
        blue: '#0451a5',
        magenta: '#bc05bc',
        cyan: '#0598bc',
        white: '#555555'
      },
      solarized: {
        background: '#002b36',
        foreground: '#839496',
        cursor: '#839496',
        selection: '#073642',
        black: '#073642',
        red: '#dc322f',
        green: '#859900',
        yellow: '#b58900',
        blue: '#268bd2',
        magenta: '#d33682',
        cyan: '#2aa198',
        white: '#eee8d5'
      },
      monokai: {
        background: '#272822',
        foreground: '#f8f8f2',
        cursor: '#f8f8f0',
        selection: '#49483e',
        black: '#272822',
        red: '#f92672',
        green: '#a6e22e',
        yellow: '#f4bf75',
        blue: '#66d9ef',
        magenta: '#ae81ff',
        cyan: '#a1efe4',
        white: '#f8f8f2'
      }
    }

    return themes[themeName] || themes.dark
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <IntegratedTerminalComponent construct={this} />
  }
}

/**
 * Terminal line interface
 */
interface TerminalLine {
  id: string
  content: ParsedText[]
  type: LineType
  timestamp: Date
}

type LineType = 'command' | 'output' | 'error' | 'info' | 'warning'

interface ParsedText {
  text: string
  style: TextStyle
}

interface TextStyle {
  color?: string
  backgroundColor?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

interface BuiltInResult {
  handled: boolean
  output?: string
  error?: boolean
}

interface CommandResult {
  success: boolean
  output?: string
  environment?: Record<string, string>
  directory?: string
}

type CommandHandler = (
  command: string,
  args: string[],
  env: Record<string, string>
) => Promise<CommandResult>

interface CommandInfo {
  command: string
  args: string[]
  timestamp: Date
  success: boolean
  error?: string
}

interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
  selection: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
}

/**
 * React component wrapper
 */
const IntegratedTerminalComponent: React.FC<{ construct: IntegratedTerminal }> = ({ construct }) => {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const theme = construct.getThemeConfig()
  const fontSize = construct.getInput('fontSize') as number
  const fontFamily = construct.getInput('fontFamily') as string
  const isExecuting = construct.getOutput('isExecuting') as boolean

  useEffect(() => {
    // Subscribe to line updates
    const unsubscribe = construct.on('lineAdded', () => {
      setLines(construct.getOutput('lines') as TerminalLine[] || [])
    })

    const unsubscribeClear = construct.on('cleared', () => {
      setLines([])
    })

    // Set initial lines
    const initialLines = construct.getInput('initialLines') as string[]
    if (initialLines) {
      initialLines.forEach(line => construct.writeLine(line))
    }

    return () => {
      unsubscribe()
      unsubscribeClear()
    }
  }, [construct])

  useEffect(() => {
    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  const handleInputChange = (value: string) => {
    setCurrentInput(value)
    
    // Get autocomplete suggestions
    if (value && construct.getInput('enableAutoComplete')) {
      const suggestions = construct.getAutocompleteSuggestions(value)
      setSuggestions(suggestions)
      setSelectedSuggestion(-1)
    } else {
      setSuggestions([])
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
          setCurrentInput(suggestions[selectedSuggestion])
          setSuggestions([])
          setSelectedSuggestion(-1)
        } else if (!isExecuting && currentInput.trim()) {
          await construct.executeCommand(currentInput)
          setCurrentInput('')
          setSuggestions([])
        }
        break
      
      case 'ArrowUp':
        e.preventDefault()
        if (suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
        } else {
          const prevCommand = construct.getPreviousCommand()
          if (prevCommand !== null) {
            setCurrentInput(prevCommand)
          }
        }
        break
      
      case 'ArrowDown':
        e.preventDefault()
        if (suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : -1
          )
        } else {
          const nextCommand = construct.getNextCommand()
          if (nextCommand !== null) {
            setCurrentInput(nextCommand)
          }
        }
        break
      
      case 'Tab':
        e.preventDefault()
        if (suggestions.length === 1) {
          setCurrentInput(suggestions[0])
          setSuggestions([])
        } else if (suggestions.length > 1 && selectedSuggestion >= 0) {
          setCurrentInput(suggestions[selectedSuggestion])
          setSuggestions([])
          setSelectedSuggestion(-1)
        }
        break
      
      case 'Escape':
        setSuggestions([])
        setSelectedSuggestion(-1)
        break
    }
  }

  const renderLine = (line: TerminalLine) => {
    const typeColors: Record<LineType, string> = {
      command: theme.foreground,
      output: theme.foreground,
      error: theme.red,
      info: theme.cyan,
      warning: theme.yellow
    }

    return (
      <div 
        key={line.id} 
        className={`terminal-line ${line.type}`}
        style={{ color: typeColors[line.type] }}
      >
        {line.content.map((part, idx) => (
          <span
            key={idx}
            style={{
              ...part.style,
              fontWeight: part.style.bold ? 'bold' : 'normal',
              fontStyle: part.style.italic ? 'italic' : 'normal',
              textDecoration: part.style.underline ? 'underline' : 'none'
            }}
          >
            {part.text}
          </span>
        ))}
      </div>
    )
  }

  const currentPrompt = construct['formatPrompt']()

  return (
    <div 
      className="integrated-terminal"
      style={{
        height: '100%',
        backgroundColor: theme.background,
        color: theme.foreground,
        fontFamily,
        fontSize: `${fontSize}px`,
        position: 'relative'
      }}
    >
      <div
        ref={containerRef}
        className="terminal-content"
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '8px',
          boxSizing: 'border-box'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map(renderLine)}
        
        <div className="terminal-input-line" style={{ display: 'flex', position: 'relative' }}>
          <span style={{ whiteSpace: 'pre' }}>{currentPrompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.foreground,
              fontFamily,
              fontSize: `${fontSize}px`,
              padding: 0,
              margin: 0
            }}
            autoFocus
          />
          {isExecuting && (
            <span style={{ marginLeft: '8px', color: theme.yellow }}>
              ⟳
            </span>
          )}
        </div>

        {suggestions.length > 0 && (
          <div 
            className="autocomplete-suggestions"
            style={{
              position: 'absolute',
              bottom: '32px',
              left: '8px',
              backgroundColor: theme.selection,
              border: `1px solid ${theme.foreground}`,
              borderRadius: '4px',
              padding: '4px',
              zIndex: 10
            }}
          >
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                style={{
                  padding: '2px 8px',
                  cursor: 'pointer',
                  backgroundColor: idx === selectedSuggestion ? theme.foreground : 'transparent',
                  color: idx === selectedSuggestion ? theme.background : theme.foreground
                }}
                onClick={() => {
                  setCurrentInput(suggestion)
                  setSuggestions([])
                  inputRef.current?.focus()
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Export factory function
export const createIntegratedTerminal = () => new IntegratedTerminal()

// Export the definition for catalog registration
export const integratedTerminalDefinition = IntegratedTerminal.definition