import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiChevronRight,
  FiTerminal,
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
import ErrorBoundary from './components/UI/ErrorBoundary'
import { OAuthCallback } from './components/Auth/OAuthCallback'
import { AuthDebugPanel } from './components/Debug/AuthDebugPanel'
import { OnboardingFlow } from './components/Onboarding'
import { UpdateNotification } from './components/UpdateNotification/UpdateNotification'
import { TDDWorkflowView } from './components/TDD/TDDWorkflowView'
// import { ConstructProjectView } from './components/ConstructDevelopment/ConstructProjectView' // Removed unused import
import { ConstructBuilder } from './components/ConstructBuilder/ConstructBuilder'
import BuiltWithItselfShowcase from './components/Showcase/BuiltWithItselfShowcase'
import PlatformArchitectureDiagram from './components/Architecture/PlatformArchitectureDiagram'
import ConstructMarketplace from './components/Marketplace/ConstructMarketplace'
import { MetricsDashboard } from './components/Monitoring/MetricsDashboard'
import { VisualConstructComposer } from './components/VisualComposer/VisualConstructComposer'
import { PlatformDeployment } from './components/SelfHosting/PlatformDeployment'
import { EnterpriseDashboard } from './components/Enterprise/EnterpriseDashboard'
import { SSOConfiguration } from './components/Enterprise/SSOConfiguration'
import { TeamManagement } from './components/Enterprise/TeamManagement'
import { AuditViewer } from './components/Enterprise/AuditViewer'
import { useUserPreferencesStore } from './stores/userPreferencesStore'
import { useProjectStore } from './stores/projectStore'
import { useNavigationStore } from './components/Navigation'
import { fileApiService, type FileNode } from './services/fileApi'
import { analytics } from './services/analytics'
import { isElectron } from './utils/electronDetection'
import { Toaster } from 'react-hot-toast'

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
  
  // Check for OAuth callback
  useEffect(() => {
    if (window.location.pathname === '/oauth/callback') {
      const { navigate } = useNavigationStore.getState()
      navigate('oauth-callback')
    }
  }, [])

  // Load file tree on mount
  useEffect(() => {
    let cancelled = false
    
    const loadFiles = async () => {
      if (cancelled) return
      
      try {
        setIsLoadingFiles(true)
        const tree = await fileApiService.getFileTree()
        if (!cancelled) {
          setFiles(tree)
        }
      } catch (error) {
        if (!cancelled) {
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
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFiles(false)
        }
      }
    }
    
    loadFiles()
    
    // Cleanup function to prevent double execution
    return () => {
      cancelled = true
    }
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
    return (
      <ErrorBoundary>
        <LandingPage />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'docs' || navView === 'docs-section') {
    return (
      <ErrorBoundary>
        <DocumentationCenter />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'roadmap') {
    return (
      <ErrorBoundary>
        <Roadmap />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'constructs') {
    return (
      <ErrorBoundary>
        <ConstructCatalog />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'tdd') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <TDDWorkflowView />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'construct-builder') {
    return (
      <ErrorBoundary>
        <ConstructBuilder />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'showcase') {
    return (
      <ErrorBoundary>
        <BuiltWithItselfShowcase />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'architecture') {
    return (
      <ErrorBoundary>
        <PlatformArchitectureDiagram />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'marketplace') {
    return (
      <ErrorBoundary>
        <ConstructMarketplace />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'metrics') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <MetricsDashboard />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'visual-composer') {
    return (
      <ErrorBoundary>
        <VisualConstructComposer />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'self-hosting') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <PlatformDeployment />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'enterprise') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <EnterpriseDashboard />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'sso') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <SSOConfiguration />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'teams') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <TeamManagement />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'audit') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-background">
          <Header />
          <AuditViewer />
        </div>
      </ErrorBoundary>
    )
  }
  
  if (navView === 'oauth-callback') {
    return (
      <ErrorBoundary>
        <OAuthCallback />
      </ErrorBoundary>
    )
  }
  
  if (navView === 'onboarding') {
    return (
      <ErrorBoundary>
        <OnboardingFlow />
      </ErrorBoundary>
    )
  }
  
  // Show project management screen if currentView is 'projects'
  if (currentView === 'projects' || navView === 'projects') {
    return (
      <ErrorBoundary>
        <ProjectManagement />
      </ErrorBoundary>
    )
  }
  
  // Show construct project view for construct projects
  const currentProject = useProjectStore.getState().getCurrentProject()
  if (navView === 'project' && currentProject?.isConstructProject) {
    return (
      <ErrorBoundary>
        <ConstructBuilder constructId={currentProject.id} />
      </ErrorBoundary>
    )
  }
  
  // Show editor when a regular project is selected
  if (navView === 'project') {
    // Continue to the main editor interface below
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Toaster position="top-right" />
      <Header 
        onSettingsClick={() => setShowSettings(true)} 
        onHelpClick={() => setShowDocumentation(true)}
      />
      
      {/* Update Notification for Desktop App */}
      {isElectron() && <UpdateNotification />}
      
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
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
                      isLoading={isLoadingFiles}
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
        </ErrorBoundary>
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
      
      {/* Auth Debug Panel - Only show in development */}
      {import.meta.env.DEV && <AuthDebugPanel />}
    </div>
  )
}

export default App