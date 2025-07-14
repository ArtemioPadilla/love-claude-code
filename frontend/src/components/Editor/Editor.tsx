// Re-export MonacoEditor as Editor for backward compatibility
export { MonacoEditor as Editor, type MonacoEditorHandle } from './MonacoEditor'

// Keep the old CodeMirror implementation for reference
import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'

export function CodeMirrorEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [activeFile, setActiveFile] = useState('App.tsx')

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const startState = EditorState.create({
      doc: `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold p-8">
        Hello from Love Claude Code!
      </h1>
    </div>
  )
}

export default App`,
      extensions: [
        basicSetup,
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        javascript({ jsx: true, typescript: true }),
        oneDark,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-content': {
            padding: '16px 0',
            fontFamily: 'JetBrains Mono, monospace',
          },
          '.cm-line': {
            padding: '0 16px',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
          },
          '.cm-focused .cm-cursor': {
            borderLeftColor: '#3b82f6',
          },
          '.cm-focused .cm-selectionBackground, ::selection': {
            backgroundColor: '#3b82f644',
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Handle document changes
            console.log('Document changed')
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col bg-card">
      {/* File Tabs */}
      <div className="h-10 flex items-center border-b border-border glass">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          <div className="flex items-center px-3 h-10 border-r border-border bg-accent/20 cursor-pointer hover:bg-accent/30 transition-all group">
            <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8l2 2h2a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            </svg>
            <span className="text-sm font-medium">{activeFile}</span>
            <button className="ml-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <button className="ml-2 p-1.5 rounded hover:bg-accent/50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div ref={editorRef} className="h-full" />
      </div>

      {/* Status Bar */}
      <div className="h-6 flex items-center justify-between px-3 border-t border-border glass text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>TypeScript React</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  )
}