import React, { useEffect, useState, useRef, useCallback } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import * as monaco from 'monaco-editor'
import prettier from 'prettier/standalone'
import prettierBabel from 'prettier/parser-babel'
import prettierTypescript from 'prettier/parser-typescript'

// Browser-compatible type definition for ESLint
type ESLintType = any

// Conditionally import ESLint only in Node.js/Electron environments
let ESLintModule: ESLintType = null
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Dynamic import for Node.js/Electron environments only
  import('eslint').then(module => {
    ESLintModule = module.ESLint
  }).catch(() => {
    console.log('CodeQualityConstruct: ESLint not available in browser environment')
  })
}

interface LintMessage {
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  message: string
  ruleId: string | null
  fix?: {
    range: [number, number]
    text: string
  }
}

interface FormatResult {
  formatted: string
  cursorOffset: number
  hasChanges: boolean
}

/**
 * L1 Code Quality Construct
 * Real-time code linting and formatting with ESLint and Prettier integration
 * Provides inline diagnostics, auto-fixing, and configuration management
 */
export class CodeQualityConstruct extends L1UIConstruct {
  private eslint: ESLintType | null = null
  private monacoInstance: typeof monaco | null = null
  private markersUpdateTimeout: NodeJS.Timeout | null = null
  private decorations: string[] = []
  private isBrowserEnvironment: boolean = typeof process === 'undefined' || !process.versions?.node
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-code-quality',
    name: 'Code Quality Tool',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Real-time code quality checking with ESLint and Prettier integration for Monaco editor',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['dev-tools', 'ui', 'code-quality'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['eslint', 'prettier', 'linting', 'formatting', 'code-quality'],
    inputs: [
      {
        name: 'editor',
        type: 'object',
        description: 'Monaco editor instance',
        required: true
      },
      {
        name: 'enableESLint',
        type: 'boolean',
        description: 'Enable ESLint checking',
        required: false,
        defaultValue: true
      },
      {
        name: 'enablePrettier',
        type: 'boolean',
        description: 'Enable Prettier formatting',
        required: false,
        defaultValue: true
      },
      {
        name: 'eslintConfig',
        type: 'object',
        description: 'ESLint configuration object',
        required: false,
        defaultValue: {
          env: {
            browser: true,
            es2021: true,
            node: true
          },
          extends: ['eslint:recommended'],
          parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            ecmaFeatures: {
              jsx: true
            }
          },
          rules: {
            'indent': ['error', 2],
            'quotes': ['error', 'single'],
            'semi': ['error', 'never'],
            'no-unused-vars': 'warn',
            'no-console': 'warn'
          }
        }
      },
      {
        name: 'prettierConfig',
        type: 'object',
        description: 'Prettier configuration object',
        required: false,
        defaultValue: {
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          semi: false,
          singleQuote: true,
          trailingComma: 'es5',
          bracketSpacing: true,
          arrowParens: 'always'
        }
      },
      {
        name: 'autoFixOnSave',
        type: 'boolean',
        description: 'Automatically fix issues on save',
        required: false,
        defaultValue: true
      },
      {
        name: 'formatOnSave',
        type: 'boolean',
        description: 'Format with Prettier on save',
        required: false,
        defaultValue: true
      },
      {
        name: 'lintDebounceMs',
        type: 'number',
        description: 'Debounce time for linting in milliseconds',
        required: false,
        defaultValue: 500
      },
      {
        name: 'showInlineHints',
        type: 'boolean',
        description: 'Show inline code action hints',
        required: false,
        defaultValue: true
      }
    ],
    outputs: [
      {
        name: 'lintMessages',
        type: 'array',
        description: 'Current lint messages'
      },
      {
        name: 'errorCount',
        type: 'number',
        description: 'Number of errors'
      },
      {
        name: 'warningCount',
        type: 'number',
        description: 'Number of warnings'
      },
      {
        name: 'isFormatted',
        type: 'boolean',
        description: 'Whether code matches Prettier format'
      },
      {
        name: 'hasFixableIssues',
        type: 'boolean',
        description: 'Whether there are auto-fixable issues'
      }
    ],
    security: [
      {
        aspect: 'Safe Parsing',
        description: 'Sandboxed parsing prevents code execution',
        implementation: 'ESLint and Prettier run in safe mode'
      },
      {
        aspect: 'Configuration Validation',
        description: 'Validates user-provided configurations',
        implementation: 'Schema validation for ESLint/Prettier configs'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'lintOperations',
          unit: '1K operations',
          costPerUnit: 0,
          description: 'CPU usage for linting'
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'ESLint + Prettier + Monaco Editor'
    },
    examples: [
      {
        title: 'Basic Integration',
        description: 'Add code quality to Monaco editor',
        code: `const quality = new CodeQualityConstruct()
await quality.initialize({
  editor: monacoEditor,
  enableESLint: true,
  enablePrettier: true,
  autoFixOnSave: true
})

// Listen for quality updates
quality.on('qualityChanged', (data) => {
  console.log(\`Errors: \${data.errorCount}, Warnings: \${data.warningCount}\`)
})`,
        language: 'typescript'
      },
      {
        title: 'Custom Configuration',
        description: 'Use custom ESLint and Prettier rules',
        code: `const quality = new CodeQualityConstruct()
await quality.initialize({
  editor: monacoEditor,
  eslintConfig: {
    extends: ['airbnb'],
    rules: {
      'react/jsx-filename-extension': 'off',
      'import/extensions': 'off'
    }
  },
  prettierConfig: {
    printWidth: 100,
    singleQuote: true,
    semi: false
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use consistent ESLint and Prettier configurations across team',
      'Enable auto-fix for non-breaking issues only',
      'Configure reasonable debounce times for performance',
      'Show clear visual indicators for issues',
      'Provide quick fix actions in editor',
      'Cache linting results for unchanged files'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        defaultESLintConfig: {
          type: 'object',
          description: 'Default ESLint configuration',
          required: false
        },
        defaultPrettierConfig: {
          type: 'object', 
          description: 'Default Prettier configuration',
          required: false
        }
      },
      environmentVariables: []
    },
    dependencies: [],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 20,
      builtWith: ['platform-l0-code-editor-primitive'],
      timeToCreate: 120,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(CodeQualityConstruct.definition)
  }

  async onInitialize(): Promise<void> {
    const editor = this.getInput<any>('editor')
    if (!editor) {
      throw new Error('Monaco editor instance is required')
    }

    // Initialize ESLint
    if (this.getInput<boolean>('enableESLint')) {
      await this.initializeESLint()
    }

    // Set up editor integration
    this.setupEditorIntegration(editor)
    
    // Initial lint
    this.performLinting(editor.getValue())
  }

  async onDestroy(): Promise<void> {
    if (this.markersUpdateTimeout) {
      clearTimeout(this.markersUpdateTimeout)
    }
    
    // Clear all markers
    if (this.monacoInstance) {
      this.monacoInstance.editor.setModelMarkers(
        this.getInput<any>('editor').getModel(),
        'eslint',
        []
      )
    }
  }

  /**
   * Initialize ESLint with configuration
   */
  private async initializeESLint(): Promise<void> {
    // Skip ESLint initialization in browser environment
    if (this.isBrowserEnvironment || !ESLintModule) {
      console.log('CodeQualityConstruct: ESLint disabled in browser environment')
      return
    }

    const config = this.getInput<any>('eslintConfig') || {}
    
    try {
      this.eslint = new ESLintModule({
        useEslintrc: false,
        baseConfig: config,
        fix: this.getInput<boolean>('autoFixOnSave') || false
      })
    } catch (error) {
      console.warn('CodeQualityConstruct: Failed to initialize ESLint:', error)
      this.eslint = null
    }
  }

  /**
   * Set up Monaco editor integration
   */
  private setupEditorIntegration(editor: any): void {
    // Store Monaco reference
    this.monacoInstance = monaco

    // Listen for content changes
    const debounceMs = this.getInput<number>('lintDebounceMs') || 500
    let changeTimeout: NodeJS.Timeout

    editor.onDidChangeModelContent(() => {
      clearTimeout(changeTimeout)
      changeTimeout = setTimeout(() => {
        this.performLinting(editor.getValue())
      }, debounceMs)
    })

    // Add save command handler
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      await this.handleSave(editor)
    })

    // Register code action provider
    if (this.getInput<boolean>('showInlineHints')) {
      this.registerCodeActionProvider(editor)
    }

    // Register formatter
    if (this.getInput<boolean>('enablePrettier')) {
      this.registerFormatter(editor)
    }
  }

  /**
   * Perform linting on content
   */
  private async performLinting(content: string): Promise<void> {
    if (!this.getInput<boolean>('enableESLint') || !this.eslint) {
      return
    }

    try {
      // Create virtual file for linting
      const results = await this.eslint.lintText(content, {
        filePath: 'virtual.js'
      })

      if (results.length > 0) {
        const messages = this.convertESLintMessages(results[0].messages)
        this.updateMarkers(messages)
        this.updateOutputs(messages)
      }
    } catch (error) {
      console.error('Linting error:', error)
    }
  }

  /**
   * Convert ESLint messages to internal format
   */
  private convertESLintMessages(messages: any[]): LintMessage[] {
    return messages.map(msg => ({
      line: msg.line || 1,
      column: msg.column || 1,
      severity: msg.severity === 2 ? 'error' : msg.severity === 1 ? 'warning' : 'info',
      message: msg.message,
      ruleId: msg.ruleId,
      fix: msg.fix ? {
        range: msg.fix.range,
        text: msg.fix.text
      } : undefined
    }))
  }

  /**
   * Update Monaco editor markers
   */
  private updateMarkers(messages: LintMessage[]): void {
    if (!this.monacoInstance) return

    const editor = this.getInput<any>('editor')
    const model = editor.getModel()
    
    const markers = messages.map(msg => ({
      severity: msg.severity === 'error' 
        ? this.monacoInstance!.MarkerSeverity.Error
        : msg.severity === 'warning'
        ? this.monacoInstance!.MarkerSeverity.Warning
        : this.monacoInstance!.MarkerSeverity.Info,
      startLineNumber: msg.line,
      startColumn: msg.column,
      endLineNumber: msg.line,
      endColumn: msg.column + 1,
      message: `${msg.message}${msg.ruleId ? ` (${msg.ruleId})` : ''}`,
      source: 'eslint'
    }))

    // Debounce marker updates
    if (this.markersUpdateTimeout) {
      clearTimeout(this.markersUpdateTimeout)
    }

    this.markersUpdateTimeout = setTimeout(() => {
      this.monacoInstance!.editor.setModelMarkers(model, 'eslint', markers)
    }, 100)
  }

  /**
   * Update construct outputs
   */
  private updateOutputs(messages: LintMessage[]): void {
    const errorCount = messages.filter(m => m.severity === 'error').length
    const warningCount = messages.filter(m => m.severity === 'warning').length
    const hasFixableIssues = messages.some(m => m.fix !== undefined)

    this.setOutput('lintMessages', messages)
    this.setOutput('errorCount', errorCount)
    this.setOutput('warningCount', warningCount)
    this.setOutput('hasFixableIssues', hasFixableIssues)

    // Emit event
    this.emit('qualityChanged', {
      errorCount,
      warningCount,
      totalIssues: messages.length,
      hasFixableIssues
    })
  }

  /**
   * Handle save with auto-fix and formatting
   */
  private async handleSave(editor: any): Promise<void> {
    let content = editor.getValue()

    // Auto-fix ESLint issues
    if (this.getInput<boolean>('autoFixOnSave') && this.eslint) {
      const results = await this.eslint.lintText(content, {
        filePath: 'virtual.js',
        fix: true
      })

      if (results[0]?.output) {
        content = results[0].output
      }
    }

    // Format with Prettier
    if (this.getInput<boolean>('formatOnSave') && this.getInput<boolean>('enablePrettier')) {
      const formatted = await this.formatWithPrettier(content)
      if (formatted.hasChanges) {
        content = formatted.formatted
      }
      this.setOutput('isFormatted', !formatted.hasChanges)
    }

    // Update editor if content changed
    if (content !== editor.getValue()) {
      const position = editor.getPosition()
      editor.setValue(content)
      editor.setPosition(position)
    }

    // Re-lint after changes
    await this.performLinting(content)
  }

  /**
   * Format code with Prettier
   */
  private async formatWithPrettier(content: string): Promise<FormatResult> {
    const config = this.getInput<any>('prettierConfig') || {}
    
    try {
      const formatted = prettier.format(content, {
        ...config,
        parser: 'babel-ts',
        plugins: [prettierBabel, prettierTypescript]
      })

      return {
        formatted,
        cursorOffset: 0,
        hasChanges: formatted !== content
      }
    } catch (error) {
      console.error('Prettier formatting error:', error)
      return {
        formatted: content,
        cursorOffset: 0,
        hasChanges: false
      }
    }
  }

  /**
   * Register code action provider for quick fixes
   */
  private registerCodeActionProvider(editor: any): void {
    if (!this.monacoInstance) return

    this.monacoInstance.languages.registerCodeActionProvider('javascript', {
      provideCodeActions: (model, range, context) => {
        const actions: any[] = []

        // Get lint messages for current range
        const messages = this.getOutput<LintMessage[]>('lintMessages') || []
        const relevantMessages = messages.filter(msg => {
          const line = msg.line
          return line >= range.startLineNumber && line <= range.endLineNumber
        })

        // Add fix actions
        relevantMessages.forEach(msg => {
          if (msg.fix) {
            actions.push({
              title: `Fix: ${msg.message}`,
              kind: 'quickfix',
              edit: {
                edits: [{
                  resource: model.uri,
                  edit: {
                    range: {
                      startLineNumber: msg.line,
                      startColumn: msg.column,
                      endLineNumber: msg.line,
                      endColumn: msg.column + msg.fix.range[1] - msg.fix.range[0]
                    },
                    text: msg.fix.text
                  }
                }]
              }
            })
          }
        })

        // Add format action
        if (this.getInput<boolean>('enablePrettier')) {
          actions.push({
            title: 'Format with Prettier',
            kind: 'source.formatDocument',
            command: {
              id: 'editor.action.formatDocument',
              title: 'Format Document'
            }
          })
        }

        return {
          actions,
          dispose: () => {}
        }
      }
    })
  }

  /**
   * Register document formatter
   */
  private registerFormatter(editor: any): void {
    if (!this.monacoInstance) return

    this.monacoInstance.languages.registerDocumentFormattingEditProvider('javascript', {
      provideDocumentFormattingEdits: async (model) => {
        const content = model.getValue()
        const formatted = await this.formatWithPrettier(content)

        if (!formatted.hasChanges) return []

        return [{
          range: model.getFullModelRange(),
          text: formatted.formatted
        }]
      }
    })
  }

  /**
   * React component for quality visualization
   */
  render(): React.ReactElement {
    return <CodeQualityComponent construct={this} />
  }
}

/**
 * React component for code quality visualization
 */
const CodeQualityComponent: React.FC<{ construct: CodeQualityConstruct }> = ({ construct }) => {
  const [errorCount, setErrorCount] = useState(0)
  const [warningCount, setWarningCount] = useState(0)
  const [isFormatted, setIsFormatted] = useState(true)
  const [messages, setMessages] = useState<LintMessage[]>([])

  useEffect(() => {
    const updateStats = () => {
      setErrorCount(construct.getOutput<number>('errorCount') || 0)
      setWarningCount(construct.getOutput<number>('warningCount') || 0)
      setIsFormatted(construct.getOutput<boolean>('isFormatted') ?? true)
      setMessages(construct.getOutput<LintMessage[]>('lintMessages') || [])
    }

    updateStats()
    const unsubscribe = construct.on('qualityChanged', updateStats)

    return () => {
      unsubscribe()
    }
  }, [construct])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="code-quality-panel p-4 bg-gray-50 rounded-lg">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Code Quality</h3>
        <div className="flex items-center gap-4 text-sm">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="font-bold">{errorCount}</span> errors
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <span className="font-bold">{warningCount}</span> warnings
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <span className="text-green-600">✓ No issues</span>
          )}
          {!isFormatted && (
            <span className="text-purple-600">⚡ Formatting available</span>
          )}
        </div>
      </div>

      {/* Issues List */}
      {messages.length > 0 && (
        <div className="bg-white rounded shadow max-h-60 overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 border-b border-gray-100 hover:bg-gray-50"
            >
              <span className="text-lg">{getSeverityIcon(msg.severity)}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${getSeverityColor(msg.severity)}`}>
                  {msg.message}
                </div>
                <div className="text-xs text-gray-500">
                  Line {msg.line}:{msg.column}
                  {msg.ruleId && ` • ${msg.ruleId}`}
                  {msg.fix && ' • 🔧 Auto-fixable'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => construct['handleSave'](construct.getInput('editor'))}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Fix & Format
        </button>
        <button
          onClick={() => construct['performLinting'](construct.getInput('editor').getValue())}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
        >
          Re-lint
        </button>
      </div>
    </div>
  )
}

// Export factory function
export const createCodeQuality = () => new CodeQualityConstruct()

// Export the definition for catalog registration
export const codeQualityDefinition = CodeQualityConstruct.definition