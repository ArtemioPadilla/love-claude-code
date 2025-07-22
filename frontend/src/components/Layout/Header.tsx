import { motion, AnimatePresence } from 'framer-motion'
import {
  FiLayout,
  FiMaximize2,
  FiSettings,
  FiGithub,
  FiMenu,
  FiCode,
  FiFile,
  FiSave,
  FiFolder,
  FiDownload,
  FiCopy,
  FiScissors,
  FiClipboard,
  FiRefreshCw,
  FiInfo,
  FiArrowLeft,
  FiChevronRight,
  FiHelpCircle
} from 'react-icons/fi'
import { useUserPreferencesStore } from '@stores/userPreferencesStore'
import { useProjectStore } from '@stores/projectStore'
import { useState, useRef, useEffect } from 'react'
import NavigationBar from './NavigationBar'
import ConnectionStatus from '../UI/ConnectionStatus'
import ClaudeConnectionStatus from '../UI/ClaudeConnectionStatus'
import { OfflineIndicator } from '../UI/OfflineIndicator'
import { OAuthStatus } from '../OAuth/OAuthStatus'
import { GitStatus } from '../Git/GitStatus'

interface HeaderProps {
  onMenuClick?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
}

export function Header({ onMenuClick, onSettingsClick, onHelpClick }: HeaderProps) {
  const { preferences, toggleAdvancedMode } = useUserPreferencesStore()
  const { setCurrentView, getCurrentProject, currentView } = useProjectStore()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const currentProject = getCurrentProject()
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const menuItems = {
    File: [
      { label: 'New File', icon: FiFile, shortcut: 'Ctrl+N' },
      { label: 'Open File', icon: FiFolder, shortcut: 'Ctrl+O' },
      { label: 'Save', icon: FiSave, shortcut: 'Ctrl+S' },
      { label: 'Save As...', icon: FiSave, shortcut: 'Ctrl+Shift+S' },
      { divider: true },
      { label: 'Export', icon: FiDownload },
      { divider: true },
      { 
        label: 'Back to Projects', 
        icon: FiArrowLeft, 
        action: () => setCurrentView('projects'),
        hideInView: 'projects'
      },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Y' },
      { divider: true },
      { label: 'Cut', icon: FiScissors, shortcut: 'Ctrl+X' },
      { label: 'Copy', icon: FiCopy, shortcut: 'Ctrl+C' },
      { label: 'Paste', icon: FiClipboard, shortcut: 'Ctrl+V' },
    ],
    View: [
      { label: 'Command Palette', shortcut: 'Ctrl+Shift+P' },
      { label: 'Toggle Sidebar', shortcut: 'Ctrl+B' },
      { label: 'Toggle Terminal', shortcut: 'Ctrl+`' },
      { divider: true },
      { label: 'Zoom In', shortcut: 'Ctrl++' },
      { label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { label: 'Reset Zoom', shortcut: 'Ctrl+0' },
    ],
    Help: [
      { label: 'Documentation', icon: FiInfo, action: onHelpClick, shortcut: 'F1' },
      { label: 'Keyboard Shortcuts', action: () => onHelpClick?.() },
      { label: 'Report Issue', icon: FiGithub },
      { divider: true },
      { label: 'About' },
    ],
  }

  return (
    <header className="h-12 bg-card/80 backdrop-blur-sm border-b border-border/50 flex items-center justify-between px-4 relative z-20">
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-accent/50 transition-all lg:hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiMenu size={18} />
        </motion.button>
        
        <div className="flex items-center gap-3">
          {/* Back to Projects button - only show in editor view */}
          {currentView === 'editor' && (
            <motion.button
              onClick={() => setCurrentView('projects')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/50 transition-all text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Back to Projects"
            >
              <FiArrowLeft size={16} />
              <span className="hidden sm:inline">Projects</span>
            </motion.button>
          )}
          
          {/* Logo */}
          <motion.button
            onClick={() => setCurrentView('projects')}
            className="flex items-center gap-3 transition-all hover:opacity-80"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Go to Projects"
          >
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-glow">
              <FiCode size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-semibold gradient-text hidden sm:block">Love Claude Code</h1>
          </motion.button>
          
          {/* Project Name - only show in editor view */}
          {currentView === 'editor' && currentProject && (
            <>
              <FiChevronRight className="text-muted-foreground hidden sm:block" size={16} />
              <motion.button
                onClick={() => setCurrentView('projects')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Back to Projects"
              >
                <FiFolder size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{currentProject.name}</span>
              </motion.button>
              
              {/* Mobile project indicator */}
              <div className="flex sm:hidden items-center gap-2 ml-2">
                <div className="h-4 w-px bg-border" />
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {currentProject.name}
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Navigation Bar */}
        <NavigationBar />
        
        <nav ref={menuRef} className="hidden md:flex items-center gap-2 text-sm relative ml-4 border-l border-gray-700 pl-4">
          {Object.entries(menuItems).map(([menu, items]) => (
            <div key={menu} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
                className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {menu}
              </button>
              
              <AnimatePresence>
                {activeMenu === menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-md shadow-xl z-[100]"
                  >
                    {items.map((item, index) => {
                      // Hide items based on current view
                      if ('hideInView' in item && item.hideInView === currentView) {
                        return null
                      }
                      
                      return item.divider ? (
                        <div key={index} className="h-px bg-border my-1" />
                      ) : (
                        <button
                          key={index}
                          onClick={() => {
                            if ('action' in item && item.action) {
                              item.action()
                            } else {
                              console.log(`${menu}: ${item.label}`)
                            }
                            setActiveMenu(null)
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {item.icon && <item.icon size={14} />}
                            <span>{item.label}</span>
                          </div>
                          {item.shortcut && (
                            <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Advanced Mode Toggle */}
        <motion.button
          onClick={toggleAdvancedMode}
          className={`
            relative px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${preferences.advancedMode
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <FiCode size={14} />
            <span>Advanced Mode</span>
            <motion.div
              className={`
                w-8 h-4 rounded-full relative transition-colors
                ${preferences.advancedMode ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <motion.div
                className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                animate={{ x: preferences.advancedMode ? 16 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.div>
          </div>
        </motion.button>
        
        {/* Connection Status */}
        <ConnectionStatus />
        
        <div className="w-px h-6 bg-border/50 mx-1" />
        
        {/* Claude Connection Status */}
        <ClaudeConnectionStatus />
        
        <div className="w-px h-6 bg-border/50 mx-1" />
        
        {/* OAuth Status (for Electron) */}
        <OAuthStatus />
        
        <div className="w-px h-6 bg-border/50 mx-1" />
        
        {/* Git Status (for Electron) */}
        <GitStatus />
        
        <div className="w-px h-6 bg-border/50 mx-1" />
        
        {/* Offline/Local Mode Indicator */}
        <OfflineIndicator />
        
        <div className="w-px h-6 bg-border/50 mx-1" />
        
        {/* Other Actions */}
        <motion.button
          onClick={onHelpClick}
          className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Help (F1)"
        >
          <FiHelpCircle size={16} />
        </motion.button>
        
        <motion.a
          href="https://github.com/loveclaudecode/love-claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground inline-block"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="View on GitHub"
        >
          <FiGithub size={16} />
        </motion.a>
        
        <motion.button
          onClick={onSettingsClick}
          className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Settings"
        >
          <FiSettings size={16} />
        </motion.button>
        
        <motion.button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen()
            } else {
              document.exitFullscreen()
            }
          }}
          className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Toggle fullscreen"
        >
          <FiMaximize2 size={16} />
        </motion.button>
      </div>
    </header>
  )
}
