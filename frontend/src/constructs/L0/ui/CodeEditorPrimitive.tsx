import React, { useRef, useEffect } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Code Editor Primitive Construct
 * Raw CodeMirror instance with no styling, themes, or features
 * This is the most basic editor possible - just text editing
 */
export class CodeEditorPrimitive extends L0UIConstruct {
  private editorView: EditorView | null = null
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-code-editor-primitive',
    name: 'Code Editor Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw CodeMirror 6 editor instance with no features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'editor'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['editor', 'primitive', 'codemirror'],
    inputs: [
      {
        name: 'initialValue',
        type: 'string',
        description: 'Initial text content',
        required: false,
        defaultValue: ''
      },
      {
        name: 'language',
        type: 'string',
        description: 'Programming language for basic syntax',
        required: false,
        defaultValue: 'javascript',
        validation: {
          enum: ['javascript', 'python', 'plain']
        }
      },
      {
        name: 'readOnly',
        type: 'boolean',
        description: 'Whether the editor is read-only',
        required: false,
        defaultValue: false
      }
    ],
    outputs: [
      {
        name: 'value',
        type: 'string',
        description: 'Current editor content'
      },
      {
        name: 'editorInstance',
        type: 'object',
        description: 'Raw CodeMirror EditorView instance'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'CodeMirror 6'
    },
    examples: [
      {
        title: 'Basic Usage',
        description: 'Create a simple code editor',
        code: `const editor = new CodeEditorPrimitive(CodeEditorPrimitive.definition)
await editor.initialize({
  initialValue: 'console.log("Hello, World!")',
  language: 'javascript'
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 SecureCodeEditor for production',
      'No XSS protection or input validation at this level',
      'No themes or advanced features - just raw editing'
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
      timeToCreate: 30,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(CodeEditorPrimitive.definition)
  }

  /**
   * Create the raw editor state
   */
  private createEditorState(): EditorState {
    const initialValue = this.getInput<string>('initialValue') || ''
    const language = this.getInput<string>('language') || 'javascript'
    const readOnly = this.getInput<boolean>('readOnly') || false

    // Language support
    let languageSupport
    switch (language) {
      case 'python':
        languageSupport = python()
        break
      case 'javascript':
        languageSupport = javascript()
        break
      default:
        languageSupport = []
    }

    // Create minimal state - no themes, no features
    return EditorState.create({
      doc: initialValue,
      extensions: [
        basicSetup, // Minimal setup - just basic editing
        languageSupport,
        EditorView.editable.of(!readOnly)
      ]
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
   * Set editor value
   */
  setValue(value: string): void {
    if (this.editorView) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: value
        }
      })
    }
  }

  /**
   * Get the raw EditorView instance
   */
  getEditorInstance(): EditorView | null {
    return this.editorView
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <CodeEditorPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the primitive
 */
const CodeEditorPrimitiveComponent: React.FC<{ construct: CodeEditorPrimitive }> = ({ construct }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorView | null>(null)

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

    // Set outputs
    construct['setOutput']('editorInstance', view)
    construct['setOutput']('value', view.state.doc.toString())

    // Update value output on changes
    const updateValue = () => {
      construct['setOutput']('value', view.state.doc.toString())
    }

    view.dom.addEventListener('input', updateValue)

    return () => {
      view.dom.removeEventListener('input', updateValue)
      view.destroy()
      ;(construct as any).editorView = null
    }
  }, [construct])

  // Minimal styling - just a container
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '200px'
      }}
    />
  )
}

// Export both the class and a factory function
export const createCodeEditorPrimitive = () => new CodeEditorPrimitive()

// Export the definition for catalog registration
export const codeEditorPrimitiveDefinition = CodeEditorPrimitive.definition