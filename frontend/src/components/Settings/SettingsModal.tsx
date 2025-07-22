import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUser, FiCode, FiShield, FiCloud, FiTerminal, FiBell } from 'react-icons/fi'
import { useState } from 'react'
import { GeneralSettings } from './GeneralSettings'
import { AISettings } from './AISettings'
import { ProviderSettings } from './ProviderSettings'
import { SecuritySettings } from './SecuritySettings'
import { MCPTester } from './MCPTester'
import { NotificationSettings } from './NotificationSettings'
import { isElectron } from '@utils/electronDetection'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const tabs = [
  { id: 'general', label: 'General', icon: FiUser },
  { id: 'ai', label: 'AI Settings', icon: FiCode },
  { id: 'providers', label: 'Providers', icon: FiCloud },
  { id: 'security', label: 'Security', icon: FiShield },
  { id: 'mcp', label: 'MCP Test', icon: FiTerminal },
  ...(isElectron() ? [{ id: 'notifications', label: 'Notifications', icon: FiBell }] : []),
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold">Settings</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <FiX size={20} />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-56 border-r border-border bg-muted/20 p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all
                          ${activeTab === tab.id
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }
                        `}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'ai' && <AISettings />}
                {activeTab === 'providers' && <ProviderSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'mcp' && <MCPTester />}
                {activeTab === 'notifications' && isElectron() && <NotificationSettings />}
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}