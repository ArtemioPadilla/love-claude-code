import React, { useRef, useEffect } from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Terminal Primitive Construct
 * Raw terminal output display with no features
 * Just text lines with basic scrolling
 */
export class TerminalPrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-terminal-primitive',
    name: 'Terminal Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw terminal output display with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'terminal', 'output'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['terminal', 'console', 'primitive', 'output'],
    inputs: [
      {
        name: 'lines',
        type: 'string[]',
        description: 'Array of text lines to display',
        required: true
      },
      {
        name: 'maxLines',
        type: 'number',
        description: 'Maximum number of lines to keep in buffer',
        required: false,
        defaultValue: 1000
      },
      {
        name: 'autoScroll',
        type: 'boolean',
        description: 'Automatically scroll to bottom on new content',
        required: false,
        defaultValue: true
      },
      {
        name: 'onInput',
        type: 'function',
        description: 'Callback when user enters input',
        required: false
      }
    ],
    outputs: [
      {
        name: 'terminalElement',
        type: 'HTMLElement',
        description: 'The terminal container DOM element'
      },
      {
        name: 'lineCount',
        type: 'number',
        description: 'Current number of lines displayed'
      },
      {
        name: 'scrollPosition',
        type: 'number',
        description: 'Current scroll position'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React'
    },
    examples: [
      {
        title: 'Basic Terminal Output',
        description: 'Display command output',
        code: `const terminal = new TerminalPrimitive()
await terminal.initialize({
  lines: [
    '$ npm install',
    'added 1234 packages in 45s',
    '$ npm run build',
    'Build complete!'
  ]
})`,
        language: 'typescript'
      },
      {
        title: 'With User Input',
        description: 'Handle terminal input',
        code: `const terminal = new TerminalPrimitive()
await terminal.initialize({
  lines: ['$ '],
  onInput: (input) => {
    console.log('User entered:', input)
    // Add the input to lines
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 InteractiveTerminal for production',
      'No syntax highlighting or color support',
      'No command history or auto-completion',
      'Just raw text display with basic input'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 20,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(TerminalPrimitive.definition)
  }

  /**
   * Add a new line to the terminal
   */
  addLine(line: string): void {
    const currentLines = this.getInput<string[]>('lines') || []
    const maxLines = this.getInput<number>('maxLines') || 1000
    
    const newLines = [...currentLines, line]
    
    // Trim to max lines
    if (newLines.length > maxLines) {
      newLines.splice(0, newLines.length - maxLines)
    }
    
    this.setInput('lines', newLines)
  }

  /**
   * Clear all terminal content
   */
  clear(): void {
    this.setInput('lines', [])
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <TerminalPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the primitive
 */
const TerminalPrimitiveComponent: React.FC<{ construct: TerminalPrimitive }> = ({ construct }) => {
  const lines = construct.getInput<string[]>('lines') || []
  const autoScroll = construct.getInput<boolean>('autoScroll') ?? true
  const onInput = construct.getInput<(input: string) => void>('onInput')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentInput, setCurrentInput] = React.useState('')

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines, autoScroll])

  // Set outputs
  useEffect(() => {
    if (containerRef.current) {
      construct['setOutput']('terminalElement', containerRef.current)
      construct['setOutput']('scrollPosition', containerRef.current.scrollTop)
    }
    construct['setOutput']('lineCount', lines.length)
  }, [construct, lines])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      onInput?.(currentInput)
      setCurrentInput('')
    }
  }

  const handleScroll = () => {
    if (containerRef.current) {
      construct['setOutput']('scrollPosition', containerRef.current.scrollTop)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: 'monospace',
        fontSize: '13px',
        backgroundColor: '#000',
        color: '#fff',
        padding: '10px',
        height: '100%',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }}
      onScroll={handleScroll}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      {onInput && (
        <div style={{ display: 'flex' }}>
          <span>$ </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: 0,
              margin: 0
            }}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

// Export factory function
export const createTerminalPrimitive = () => new TerminalPrimitive()

// Export definition for catalog
export const terminalPrimitiveDefinition = TerminalPrimitive.definition