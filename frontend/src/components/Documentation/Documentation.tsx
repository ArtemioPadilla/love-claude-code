import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSearch, FiBook, FiCommand, FiHelpCircle, FiZap } from 'react-icons/fi'
import { DocSidebar } from './DocSidebar'
import { DocContent } from './DocContent'
import { QuickStart } from './QuickStart'
import { KeyboardShortcuts } from './KeyboardShortcuts'

interface DocumentationProps {
  isOpen: boolean
  onClose: () => void
}

export interface DocSection {
  id: string
  title: string
  icon?: React.ElementType
  content: React.ReactNode
  subsections?: DocSection[]
}

const docSections: DocSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: FiBook,
    content: <QuickStart />
  },
  {
    id: 'features',
    title: 'Features',
    icon: FiZap,
    content: null,
    subsections: [
      {
        id: 'chat',
        title: 'AI Chat',
        content: (
          <div>
            <h2 className="text-2xl font-bold mb-4">AI Chat Interface</h2>
            <p className="mb-4">
              The AI Chat is your primary interface for interacting with Claude. Simply describe what you want to build, 
              and Claude will generate the code for you.
            </p>
            <h3 className="text-lg font-semibold mt-6 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Natural language code generation</li>
              <li>Context-aware suggestions</li>
              <li>Code explanations and debugging help</li>
              <li>Real-time streaming responses</li>
            </ul>
            <h3 className="text-lg font-semibold mt-6 mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Be specific about your requirements</li>
              <li>Ask for explanations when needed</li>
              <li>Iterate on the generated code</li>
              <li>Use code blocks for clarity</li>
            </ul>
          </div>
        )
      },
      {
        id: 'editor',
        title: 'Code Editor',
        content: (
          <div>
            <h2 className="text-2xl font-bold mb-4">Code Editor</h2>
            <p className="mb-4">
              The integrated Monaco editor provides a full-featured coding experience with syntax highlighting, 
              IntelliSense, and multi-file support.
            </p>
            <h3 className="text-lg font-semibold mt-6 mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Syntax highlighting for 50+ languages</li>
              <li>IntelliSense and auto-completion</li>
              <li>Multiple file tabs</li>
              <li>Find and replace</li>
              <li>Code folding</li>
              <li>Minimap navigation</li>
            </ul>
          </div>
        )
      },
      {
        id: 'files',
        title: 'File Management',
        content: (
          <div>
            <h2 className="text-2xl font-bold mb-4">File Management</h2>
            <p className="mb-4">
              Organize your project files with the integrated file explorer. Create, rename, delete, and navigate 
              through your project structure with ease.
            </p>
            <h3 className="text-lg font-semibold mt-6 mb-2">Operations:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Create new files and folders</li>
              <li>Rename with F2 or right-click</li>
              <li>Delete files safely</li>
              <li>Search files by name</li>
              <li>Right-click context menu</li>
            </ul>
          </div>
        )
      },
      {
        id: 'preview',
        title: 'Live Preview',
        content: (
          <div>
            <h2 className="text-2xl font-bold mb-4">Live Preview</h2>
            <p className="mb-4">
              See your changes instantly with the live preview panel. It automatically updates as you code, 
              providing immediate visual feedback.
            </p>
            <h3 className="text-lg font-semibold mt-6 mb-2">Capabilities:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Hot reload on save</li>
              <li>Console output display</li>
              <li>Network request monitoring</li>
              <li>Responsive viewport testing</li>
              <li>Full-screen preview mode</li>
            </ul>
          </div>
        )
      },
      {
        id: 'terminal',
        title: 'Terminal',
        content: (
          <div>
            <h2 className="text-2xl font-bold mb-4">Integrated Terminal</h2>
            <p className="mb-4">
              Run commands, install packages, and manage your project directly from the integrated terminal.
            </p>
            <h3 className="text-lg font-semibold mt-6 mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Full shell access</li>
              <li>npm/yarn package management</li>
              <li>Git operations</li>
              <li>Multiple terminal sessions</li>
              <li>Command history</li>
            </ul>
          </div>
        )
      },
      {
        id: 'mcp',
        title: 'Model Context Protocol',
        content: (
          <div>
            <h2 className="text-2xl font-bold mb-4">Model Context Protocol (MCP)</h2>
            <p className="mb-4">
              MCP enables Claude to interact with Love Claude Code and your applications through specialized tools. 
              There are two levels of MCP integration available.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">1. Main App MCP Servers</h3>
            <p className="mb-4">Love Claude Code includes two MCP servers for development:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>UI Testing Server:</strong> Test and interact with the Love Claude Code UI</li>
              <li><strong>Provider Management Server:</strong> Manage backend providers (Local, Firebase, AWS)</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">2. User App MCP</h3>
            <p className="mb-4">Add MCP to your own projects to enable Claude interactions:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Check "Enable MCP" when creating a new project</li>
              <li>Configure tools in Project Settings → MCP tab</li>
              <li>Add authentication, data, and UI tools</li>
              <li>Create custom tools for your specific needs</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Getting Started with MCP</h3>
            <ol className="list-decimal list-inside space-y-2 mb-6">
              <li>Ensure Claude Desktop is installed</li>
              <li>Start Love Claude Code with <code className="px-2 py-1 bg-accent/50 rounded">make dev</code></li>
              <li>MCP servers will start automatically</li>
              <li>Use natural language to interact with tools</li>
            </ol>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Example Commands</h3>
            <div className="bg-accent/20 p-4 rounded-lg">
              <p className="text-sm mb-2"><strong>For UI Testing:</strong></p>
              <p className="text-sm font-mono mb-4">"Take a screenshot of the current application"</p>
              
              <p className="text-sm mb-2"><strong>For Provider Management:</strong></p>
              <p className="text-sm font-mono mb-4">"Compare Firebase and AWS for my project"</p>
              
              <p className="text-sm mb-2"><strong>For User Apps:</strong></p>
              <p className="text-sm font-mono">"Log in as user@example.com and create a new blog post"</p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: FiCommand,
    content: <KeyboardShortcuts />
  },
  {
    id: 'tips',
    title: 'Tips & Tricks',
    icon: FiHelpCircle,
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-4">Tips & Tricks</h2>
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Productivity Tips</h3>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li><strong>Use descriptive prompts:</strong> The more specific you are, the better Claude can help</li>
          <li><strong>Iterate quickly:</strong> Don't try to get everything perfect in one go</li>
          <li><strong>Save frequently:</strong> Use Ctrl/Cmd+S to save your work</li>
          <li><strong>Use keyboard shortcuts:</strong> Learn the shortcuts to work faster</li>
          <li><strong>Organize your files:</strong> Keep a clean project structure</li>
        </ul>
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Common Workflows</h3>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li><strong>Starting a new project:</strong> Describe your project idea to Claude</li>
          <li><strong>Debugging:</strong> Paste error messages and ask for help</li>
          <li><strong>Refactoring:</strong> Ask Claude to improve existing code</li>
          <li><strong>Learning:</strong> Ask for explanations of code concepts</li>
        </ul>
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Version control your code with Git</li>
          <li>Write clear, descriptive file names</li>
          <li>Comment complex code sections</li>
          <li>Test your code frequently</li>
          <li>Keep your dependencies up to date</li>
        </ul>
      </div>
    )
  }
]

export function Documentation({ isOpen, onClose }: DocumentationProps) {
  const [selectedSection, setSelectedSection] = useState<string>('welcome')
  const [searchQuery, setSearchQuery] = useState('')
  
  const findSection = (id: string): DocSection | null => {
    for (const section of docSections) {
      if (section.id === id) return section
      if (section.subsections) {
        const subsection = section.subsections.find(sub => sub.id === id)
        if (subsection) return subsection
      }
    }
    return null
  }
  
  const currentSection = findSection(selectedSection) || docSections[0]
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Documentation Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-8 bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <FiBook className="text-primary" size={24} />
                <h1 className="text-xl font-semibold">Documentation</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-background/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 w-64"
                  />
                </div>
                
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-accent/50 transition-all"
                >
                  <FiX size={20} />
                </motion.button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <DocSidebar
                sections={docSections}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
                searchQuery={searchQuery}
              />
              
              {/* Main Content */}
              <DocContent section={currentSection} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}