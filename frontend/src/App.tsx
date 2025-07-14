import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiChevronLeft,
  FiChevronRight,
  FiTerminal,
  FiMessageSquare,
  FiCode
} from 'react-icons/fi'

// Components
import { FileExplorer } from './components/Editor/FileExplorer'
import { Terminal } from './components/Editor/Terminal'
import { Editor, type MonacoEditorHandle } from './components/Editor/Editor'
import { Chat } from './components/Chat/Chat'
import { Preview } from './components/Preview/Preview'
import { Header } from './components/Layout/Header'
import { SettingsModal } from './components/Settings/SettingsModal'
import { ProjectManagement } from './components/ProjectManagement/ProjectManagement'
import { Documentation } from './components/Documentation/Documentation'
import LandingPage from './components/LandingPage/LandingPage'
import DocumentationCenter from './components/DocumentationCenter/DocumentationCenter'
import Roadmap from './components/Roadmap/Roadmap'
import ConstructCatalog from './constructs/catalog/ConstructCatalog'
import { useUserPreferencesStore } from './stores/userPreferencesStore'
import { useProjectStore } from './stores/projectStore'
import { useNavigationStore } from './components/Navigation'
import { fileApiService, type FileNode } from './services/fileApi'
import { analytics } from './services/analytics'

function App() {
  const { preferences } = useUserPreferencesStore()
  const { currentView } = useProjectStore()
  const { currentView: navView } = useNavigationStore()
  const [showExplorer, setShowExplorer] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string>()
  const [files, setFiles] = useState<FileNode[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const editorRef = useRef<MonacoEditorHandle>(null)
  
  // Track page views when navigation changes
  useEffect(() => {
    analytics.trackPageView(`/${navView}`)
  }, [navView])

  // Load file tree on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoadingFiles(true)
        const tree = await fileApiService.getFileTree()
        setFiles(tree)
      } catch (error) {
        console.error('Failed to load files:', error)
        // Keep the hardcoded files as fallback
        setFiles([
          {
            id: '1',
            name: 'src',
            type: 'folder',
            path: '/src',
            children: [
              {
                id: '2',
                name: 'App.tsx',
                type: 'file',
                path: '/src/App.tsx',
                extension: 'tsx'
              }
            ]
          }
        ])
      } finally {
        setIsLoadingFiles(false)
      }
    }
    
    loadFiles()
  }, [])

  const handleFileSelect = useCallback(async (path: string) => {
    setSelectedFile(path)
    console.log('Selected file:', path)
    
    // Open file in editor
    if (editorRef.current) {
      await editorRef.current.openFile(path)
    }
  }, [])

  const handleCommand = useCallback((command: string) => {
    console.log('Terminal command:', command)
  }, [])
  
  // Add keyboard shortcut for F1 help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setShowDocumentation(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle navigation based on current view
  if (navView === 'landing') {
    return <LandingPage />
  }
  
  if (navView === 'docs' || navView === 'docs-section') {
    return <DocumentationCenter />
  }
  
  if (navView === 'roadmap') {
    return <Roadmap />
  }
  
  if (navView === 'constructs') {
    return <ConstructCatalog />
  }
  
  // Show project management screen if currentView is 'projects'
  if (currentView === 'projects' || navView === 'projects') {
    return <ProjectManagement />
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        onSettingsClick={() => setShowSettings(true)} 
        onHelpClick={() => setShowDocumentation(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Chat Panel - Always visible on the left */}
          <Panel defaultSize={preferences.advancedMode ? 20 : 25} minSize={10} maxSize={35}>
            <Chat className="h-full" />
          </Panel>
          
          <PanelResizeHandle />
          {/* File Explorer - Only show in advanced mode */}
          <AnimatePresence>
            {preferences.advancedMode && showExplorer && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Panel defaultSize={15} minSize={10} maxSize={25}>
                  <div className="h-full relative border-r border-border">
                    <FileExplorer
                      files={files}
                      selectedFile={selectedFile}
                      onFileSelect={handleFileSelect}
                      onClose={() => setShowExplorer(false)}
                    />
                  </div>
                </Panel>
                <PanelResizeHandle />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Editor Section - Only show in advanced mode */}
          {preferences.advancedMode ? (
            <Panel defaultSize={showExplorer ? 35 : 50} minSize={25}>
              <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={showTerminal ? 70 : 100} minSize={50}>
                <div className="h-full flex">
                  {/* Show explorer button when hidden */}
                  {!showExplorer && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowExplorer(true)}
                      className="w-10 h-full border-r border-border hover:bg-accent/50 transition-colors flex items-center justify-center group"
                      title="Show Explorer"
                    >
                      <FiChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  )}
                  
                  <div className="flex-1 h-full">
                    <Editor ref={editorRef} />
                  </div>
                </div>
              </Panel>
              
                {/* Terminal - Only show in advanced mode */}
                <AnimatePresence>
                  {showTerminal && (
                  <>
                    <PanelResizeHandle />
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Panel defaultSize={30} minSize={15} maxSize={50}>
                        <Terminal
                          onCommand={handleCommand}
                          isCollapsed={false}
                          onToggleCollapse={() => setShowTerminal(false)}
                        />
                      </Panel>
                    </motion.div>
                  </>
                )}
                </AnimatePresence>
              </PanelGroup>
            </Panel>
          ) : null}
          
          {preferences.advancedMode && <PanelResizeHandle />}
          
          {/* Preview Section */}
          <Panel defaultSize={preferences.advancedMode ? 30 : 75} minSize={20}>
            <Preview />
          </Panel>
        </PanelGroup>
      </div>
      
      {/* Floating buttons for hidden panels */}
      <AnimatePresence>
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
          {/* Only show in advanced mode */}
          {preferences.advancedMode && !showTerminal && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTerminal(true)}
              className="p-3 bg-secondary text-secondary-foreground rounded-full shadow-lg hover:shadow-soft transition-all"
              title="Show Terminal"
            >
              <FiTerminal size={20} />
            </motion.button>
          )}
          {preferences.advancedMode && !showExplorer && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExplorer(true)}
              className="p-3 bg-accent text-accent-foreground rounded-full shadow-lg hover:shadow-soft transition-all"
              title="Show Explorer"
            >
              <FiCode size={20} />
            </motion.button>
          )}
        </div>
      </AnimatePresence>
      
      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Documentation Modal */}
      <Documentation isOpen={showDocumentation} onClose={() => setShowDocumentation(false)} />
    </div>
  )
}

export default App