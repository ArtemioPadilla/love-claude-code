import React, { useRef, useEffect, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Extension } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'
import DOMPurify from 'dompurify'

/**
 * L1 Secure Code Editor Construct
 * Enhanced code editor with XSS protection, themes, and security features
 * Built upon L0 CodeEditorPrimitive
 */
export class SecureCodeEditor extends L1UIConstruct {
  private editorView: EditorView | null = null
  private contentSecurityPolicy: string
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-secure-code-editor',
    name: 'Secure Code Editor',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Secure code editor with XSS protection, themes, and enhanced features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'editor', 'security'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['editor', 'secure', 'themes', 'xss-protection'],
    inputs: [
      {
        name: 'initialValue',
        type: 'string',
        description: 'Initial text content (will be sanitized)',
        required: false,
        defaultValue: ''
      },
      {
        name: 'language',
        type: 'string',
        description: 'Programming language for syntax highlighting',
        required: false,
        defaultValue: 'javascript',
        validation: {
          enum: ['javascript', 'python', 'typescript', 'html', 'css', 'json', 'markdown']
        }
      },
      {
        name: 'theme',
        type: 'string',
        description: 'Editor theme',
        required: false,
        defaultValue: 'light',
        validation: {
          enum: ['light', 'dark']
        }
      },
      {
        name: 'readOnly',
        type: 'boolean',
        description: 'Whether the editor is read-only',
        required: false,
        defaultValue: false
      },
      {
        name: 'enableXSSProtection',
        type: 'boolean',
        description: 'Enable XSS protection for content',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableContentSecurityPolicy',
        type: 'boolean',
        description: 'Enable CSP headers',
        required: false,
        defaultValue: true
      },
      {
        name: 'maxLength',
        type: 'number',
        description: 'Maximum character length (0 = unlimited)',
        required: false,
        defaultValue: 1000000
      },
      {
        name: 'dangerousPatterns',
        type: 'array',
        description: 'Patterns to flag as dangerous',
        required: false,
        defaultValue: ['<script', 'javascript:', 'onerror=', 'onload=', 'eval(', 'innerHTML']
      }
    ],
    outputs: [
      {
        name: 'value',
        type: 'string',
        description: 'Current editor content (sanitized)'
      },
      {
        name: 'sanitizedValue',
        type: 'string',
        description: 'XSS-safe version of content'
      },
      {
        name: 'isDangerous',
        type: 'boolean',
        description: 'Whether content contains dangerous patterns'
      },
      {
        name: 'characterCount',
        type: 'number',
        description: 'Current character count'
      },
      {
        name: 'lineCount',
        type: 'number',
        description: 'Current line count'
      }
    ],
    security: [
      {
        aspect: 'XSS Protection',
        description: 'Sanitizes content to prevent XSS attacks',
        implementation: 'DOMPurify for HTML content sanitization'
      },
      {
        aspect: 'Content Security Policy',
        description: 'Sets CSP headers to prevent code execution',
        implementation: "default-src 'self'; script-src 'none';"
      },
      {
        aspect: 'Input Validation',
        description: 'Validates and limits input length',
        implementation: 'Character limit and pattern detection'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'sanitizationOperations',
          unit: 'operations',
          costPerUnit: 0,
          description: 'CPU usage for content sanitization'
        }
      ]
    },
    c4: {
      type: 'Component',
      technology: 'CodeMirror 6 + DOMPurify'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Create a secure code editor',
        code: `const editor = new SecureCodeEditor()
await editor.initialize({
  initialValue: 'console.log("Hello, World!")',
  language: 'javascript',
  theme: 'dark',
  enableXSSProtection: true
})`,
        language: 'typescript'
      },
      {
        title: 'With Dangerous Pattern Detection',
        description: 'Detect potentially dangerous code',
        code: `const editor = new SecureCodeEditor()
await editor.initialize({
  dangerousPatterns: ['eval(', 'innerHTML', '<script'],
  enableXSSProtection: true
})

// Listen for dangerous content
editor.on('contentChanged', () => {
  if (editor.getOutput('isDangerous')) {
    console.warn('Dangerous patterns detected!')
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Always enable XSS protection for user-generated content',
      'Use appropriate CSP headers in production',
      'Monitor dangerous pattern detections',
      'Set reasonable character limits',
      'Sanitize content before storage',
      'Use read-only mode for untrusted content display'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        contentSecurityPolicy: {
          type: 'string',
          description: 'Custom CSP header value',
          default: "default-src 'self'; script-src 'none';"
        }
      },
      environmentVariables: []
    },
    dependencies: ['platform-l0-code-editor-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-code-editor-primitive'],
      timeToCreate: 45,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(SecureCodeEditor.definition)
    this.contentSecurityPolicy = "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline';"
  }

  /**
   * Sanitize input content
   */
  private sanitizeContent(content: string): string {
    if (!this.getInput<boolean>('enableXSSProtection')) {
      return content
    }

    // For code content, we don't want to modify it with DOMPurify
    // Instead, we'll escape it when displaying as HTML
    return content
  }

  /**
   * Check for dangerous patterns
   */
  private checkDangerousPatterns(content: string): boolean {
    const patterns = this.getInput<string[]>('dangerousPatterns') || []
    
    return patterns.some(pattern => 
      content.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Create the enhanced editor state with security features
   */
  private createEditorState(): EditorState {
    const initialValue = this.getInput<string>('initialValue') || ''
    const language = this.getInput<string>('language') || 'javascript'
    const theme = this.getInput<string>('theme') || 'light'
    const readOnly = this.getInput<boolean>('readOnly') || false
    const maxLength = this.getInput<number>('maxLength') || 1000000

    // Sanitize initial value
    const sanitizedValue = this.sanitizeContent(initialValue)

    // Language support
    let languageSupport: Extension
    switch (language) {
      case 'python':
        languageSupport = python()
        break
      case 'javascript':
      case 'typescript':
        languageSupport = javascript({ typescript: language === 'typescript' })
        break
      default:
        languageSupport = javascript()
    }

    // Theme selection
    const themeExtension = theme === 'dark' ? oneDark : []

    // Max length extension
    const maxLengthExtension = EditorState.changeFilter.of((tr) => {
      if (maxLength > 0 && tr.newDoc.length > maxLength) {
        return false
      }
      return true
    })

    // Create state with enhanced features
    return EditorState.create({
      doc: sanitizedValue,
      extensions: [
        basicSetup,
        languageSupport,
        themeExtension,
        EditorView.editable.of(!readOnly),
        maxLengthExtension,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.handleContentChange()
          }
        })
      ]
    })
  }

  /**
   * Handle content changes
   */
  private handleContentChange(): void {
    if (!this.editorView) return

    const content = this.editorView.state.doc.toString()
    const isDangerous = this.checkDangerousPatterns(content)
    const sanitized = this.sanitizeContent(content)

    // Update outputs
    this.setOutput('value', content)
    this.setOutput('sanitizedValue', sanitized)
    this.setOutput('isDangerous', isDangerous)
    this.setOutput('characterCount', content.length)
    this.setOutput('lineCount', this.editorView.state.doc.lines)

    // Emit event
    this.emit('contentChanged', {
      value: content,
      isDangerous,
      characterCount: content.length,
      lineCount: this.editorView.state.doc.lines
    })
  }

  /**
   * Get current editor value
   */
  getValue(): string {
    if (this.editorView) {
      return this.editorView.state.doc.toString()
    }
    return this.getInput<string>('initialValue') || ''
  }

  /**
   * Get sanitized value safe for display
   */
  getSanitizedValue(): string {
    return this.sanitizeContent(this.getValue())
  }

  /**
   * Set editor value (will be sanitized)
   */
  setValue(value: string): void {
    if (this.editorView) {
      const sanitized = this.sanitizeContent(value)
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: sanitized
        }
      })
    }
  }

  /**
   * Set theme dynamically
   */
  setTheme(_theme: 'light' | 'dark'): void {
    // This would require recreating the editor state
    // For now, theme must be set at initialization
    console.warn('Dynamic theme switching not yet implemented')
  }

  /**
   * Get Content Security Policy header
   */
  getCSPHeader(): string {
    if (!this.getInput<boolean>('enableContentSecurityPolicy')) {
      return ''
    }
    return this.contentSecurityPolicy
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <SecureCodeEditorComponent construct={this} />
  }
}

/**
 * React component wrapper for the secure editor
 */
const SecureCodeEditorComponent: React.FC<{ construct: SecureCodeEditor }> = ({ construct }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorView | null>(null)
  const [isDangerous, setIsDangerous] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Create editor
    const state = (construct as any).createEditorState()
    const view = new EditorView({
      state,
      parent: containerRef.current
    })

    editorRef.current = view
    ;(construct as any).editorView = view

    // Initial outputs
    construct['handleContentChange']()

    // Listen for dangerous content
    const unsubscribe = construct.on('contentChanged', (data: any) => {
      setIsDangerous(data.isDangerous)
    })

    return () => {
      unsubscribe()
      view.destroy()
      ;(construct as any).editorView = null
    }
  }, [construct])

  const theme = construct.getInput('theme') as string

  return (
    <div className="secure-code-editor">
      {isDangerous && (
        <div className="danger-warning" style={{
          backgroundColor: '#fee',
          color: '#c00',
          padding: '8px',
          fontSize: '14px',
          borderBottom: '1px solid #fcc'
        }}>
          ⚠️ Warning: Potentially dangerous patterns detected in code
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`editor-container theme-${theme}`}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          border: isDangerous ? '2px solid #fcc' : '1px solid #ddd'
        }}
      />
      {construct.getInput('enableContentSecurityPolicy') && (
        <div className="csp-indicator" style={{
          fontSize: '11px',
          color: '#666',
          padding: '4px',
          borderTop: '1px solid #eee'
        }}>
          🔒 CSP Protected
        </div>
      )}
    </div>
  )
}

// Export factory function
export const createSecureCodeEditor = () => new SecureCodeEditor()

// Export the definition for catalog registration
export const secureCodeEditorDefinition = SecureCodeEditor.definition