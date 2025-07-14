import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useUserPreferencesStore } from '@stores/userPreferencesStore'
import { motion } from 'framer-motion'
import { FiFile, FiX, FiPlus, FiSave } from 'react-icons/fi'
import { fileApiService } from '@services/fileApi'

interface Tab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty: boolean
}

export interface MonacoEditorHandle {
  openFile: (path: string) => Promise<void>
}

export const MonacoEditor = forwardRef<MonacoEditorHandle>((_, ref) => {
  const { preferences } = useUserPreferencesStore()
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      name: 'App.tsx',
      path: '/src/App.tsx',
      content: `import React from 'react'

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
      language: 'typescript',
      isDirty: false,
    },
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  
  // Watch for theme changes
  useEffect(() => {
    if (monacoRef.current && preferences.editorTheme) {
      const themeMap: Record<string, string> = {
        'vs-dark': 'love-claude-dark',
        'vs-light': 'love-claude-light',
        'hc-black': 'hc-black',
      }
      monacoRef.current.editor.setTheme(themeMap[preferences.editorTheme] || 'love-claude-dark')
    }
  }, [preferences.editorTheme])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure Monaco themes
    monaco.editor.defineTheme('love-claude-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C678DD' },
        { token: 'string', foreground: '98C379' },
        { token: 'number', foreground: 'E5C07B' },
        { token: 'type', foreground: '61AFEF' },
        { token: 'function', foreground: '61AFEF' },
        { token: 'variable', foreground: 'E06C75' },
      ],
      colors: {
        'editor.background': '#0a0a0b',
        'editor.foreground': '#ABB2BF',
        'editor.lineHighlightBackground': '#1a1a1c',
        'editor.selectionBackground': '#3E4451',
        'editorCursor.foreground': '#3b82f6',
        'editorWhitespace.foreground': '#3B4048',
        'editorIndentGuide.background': '#3B4048',
        'editorIndentGuide.activeBackground': '#c8c8c859',
      },
    })

    // Define light theme
    monaco.editor.defineTheme('love-claude-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7C3AED' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'D97706' },
        { token: 'type', foreground: '2563EB' },
        { token: 'function', foreground: '2563EB' },
        { token: 'variable', foreground: 'DC2626' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#24292E',
        'editor.lineHighlightBackground': '#F6F8FA',
        'editor.selectionBackground': '#0366D625',
        'editorCursor.foreground': '#2563EB',
        'editorWhitespace.foreground': '#6A737D',
        'editorIndentGuide.background': '#EFF2F5',
        'editorIndentGuide.activeBackground': '#D1D5DB',
      },
    })

    // Set initial theme based on preferences
    const themeMap: Record<string, string> = {
      'vs-dark': 'love-claude-dark',
      'vs-light': 'love-claude-light',
      'hc-black': 'hc-black',
    }
    
    monaco.editor.setTheme(themeMap[preferences.editorTheme] || 'love-claude-dark')

    // Add keyboard shortcuts
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        handleSave()
      },
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (!value || !activeTab) return

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab.id ? { ...tab, content: value, isDirty: true } : tab
      )
    )
  }

  const handleSave = async () => {
    if (!activeTab) return

    try {
      // Save file to backend
      await fileApiService.updateFile(activeTab.path, activeTab.content)
      console.log('Saved file:', activeTab.path)
      
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTab.id ? { ...tab, isDirty: false } : tab))
      )
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  const createNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: 'untitled.ts',
      path: '/untitled.ts',
      content: '// New file\n',
      language: 'typescript',
      isDirty: false,
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId) {
      const newActiveTab = newTabs[Math.max(0, tabIndex - 1)]
      setActiveTabId(newActiveTab.id)
    }
  }

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      scss: 'scss',
      html: 'html',
      md: 'markdown',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  // Expose openFile method via ref
  useImperativeHandle(ref, () => ({
    openFile: async (path: string) => {
      try {
        // Check if file is already open
        const existingTab = tabs.find(tab => tab.path === path)
        if (existingTab) {
          setActiveTabId(existingTab.id)
          return
        }

        // Load file content from backend
        const content = await fileApiService.readFile(path)
        const name = path.split('/').pop() || 'untitled'
        const language = getLanguageFromPath(path)

        const newTab: Tab = {
          id: Date.now().toString(),
          name,
          path,
          content,
          language,
          isDirty: false,
        }

        setTabs([...tabs, newTab])
        setActiveTabId(newTab.id)
      } catch (error) {
        console.error('Failed to open file:', error)
      }
    }
  }), [tabs])

  return (
    <div className="h-full flex flex-col bg-card">
      {/* File Tabs */}
      <div className="h-10 flex items-center border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`
                flex items-center px-3 h-10 border-r border-border cursor-pointer
                transition-all group relative
                ${
                  tab.id === activeTabId
                    ? 'bg-accent/20 text-foreground'
                    : 'hover:bg-accent/10 text-muted-foreground hover:text-foreground'
                }
              `}
              onClick={() => setActiveTabId(tab.id)}
            >
              <FiFile className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium">{tab.name}</span>
              {tab.isDirty && (
                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="ml-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent/50 transition-all"
              >
                <FiX className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={createNewTab}
          className="ml-2 p-1.5 rounded hover:bg-accent/50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        {activeTab && (
          <Editor
            height="100%"
            defaultLanguage={activeTab.language}
            language={activeTab.language}
            value={activeTab.content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: preferences.fontSize,
              fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
              fontLigatures: true,
              minimap: {
                enabled: preferences.showMinimap,
              },
              wordWrap: preferences.wordWrap ? 'on' : 'off',
              tabSize: preferences.tabSize,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              suggestOnTriggerCharacters: true,
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 flex items-center justify-between px-3 border-t border-border/50 bg-card/50 backdrop-blur-sm text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{activeTab?.language}</span>
          <span>UTF-8</span>
          <span>LF</span>
          {activeTab?.isDirty && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <FiSave size={12} />
              <span>Save</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: {preferences.tabSize}</span>
        </div>
      </div>
    </div>
  )
})