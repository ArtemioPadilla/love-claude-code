/**
 * CodePreview Component
 * 
 * Displays the generated code from the visual composition
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Editor from '@monaco-editor/react'

interface CodePreviewProps {
  code: string
  onClose: () => void
}

interface CodeSection {
  title: string
  language: string
  code: string
  icon: React.ReactNode
}

export const CodePreview: React.FC<CodePreviewProps> = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false)
  const [selectedSection, setSelectedSection] = useState(0)
  const [showInstructions, setShowInstructions] = useState(true)

  // Parse the generated code into sections
  const codeSections: CodeSection[] = [
    {
      title: 'Component Implementation',
      language: 'typescript',
      code: code,
      icon: <FileCode className="w-4 h-4" />
    },
    {
      title: 'Installation Commands',
      language: 'bash',
      code: generateInstallCommands(code),
      icon: <Terminal className="w-4 h-4" />
    }
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeSections[selectedSection].code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'composition.tsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Generated Code</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Download</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Section tabs */}
        <div className="flex border-b border-gray-700">
          {codeSections.map((section, index) => (
            <button
              key={index}
              onClick={() => setSelectedSection(index)}
              className={`
                px-4 py-2 flex items-center gap-2 transition-colors
                ${selectedSection === index 
                  ? 'bg-gray-800 border-b-2 border-blue-500 text-blue-400' 
                  : 'hover:bg-gray-800 text-gray-400'
                }
              `}
            >
              {section.icon}
              <span className="text-sm font-medium">{section.title}</span>
            </button>
          ))}
        </div>
        
        {/* Instructions */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-blue-500/10 border-b border-blue-500/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-400 mb-1">How to use this code</h3>
                    <ol className="text-sm text-gray-300 space-y-1">
                      <li>1. Copy the generated code to your project</li>
                      <li>2. Install required dependencies using the commands in the "Installation" tab</li>
                      <li>3. Import and use the composition in your application</li>
                      <li>4. Customize the configuration as needed</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!showInstructions && (
          <button
            onClick={() => setShowInstructions(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-gray-400 flex items-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Show instructions
          </button>
        )}
        
        {/* Code editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            value={codeSections[selectedSection].code}
            language={codeSections[selectedSection].language}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              lineNumbers: 'on',
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false
            }}
          />
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          <div className="flex items-center justify-between">
            <div>
              Generated {new Date().toLocaleString()}
            </div>
            <div className="flex items-center gap-4">
              <span>Lines: {codeSections[selectedSection].code.split('\n').length}</span>
              <span>•</span>
              <span>Size: {(new Blob([codeSections[selectedSection].code]).size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Generate installation commands based on the code dependencies
 */
function generateInstallCommands(code: string): string {
  // Extract import statements
  const imports = code.match(/import .+ from ['"](.+)['"]/g) || []
  const packages = new Set<string>()
  
  imports.forEach(imp => {
    const match = imp.match(/from ['"](.+)['"]/)
    if (match) {
      const pkg = match[1]
      // Filter out relative imports and built-in modules
      if (!pkg.startsWith('.') && !pkg.startsWith('@/') && !['react', 'react-dom'].includes(pkg)) {
        packages.add(pkg.split('/')[0])
      }
    }
  })
  
  const packageList = Array.from(packages).join(' ')
  
  return `# Install required dependencies
npm install ${packageList || 'react react-dom'}

# Or using yarn
yarn add ${packageList || 'react react-dom'}

# Or using pnpm
pnpm add ${packageList || 'react react-dom'}

# Development dependencies (if needed)
npm install -D @types/react @types/react-dom typescript

# Start your development server
npm run dev`
}