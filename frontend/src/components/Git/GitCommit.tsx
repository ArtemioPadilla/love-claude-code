import { useState, useEffect } from 'react'
import { GitCommit as GitCommitIcon, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@components/UI/Button'
import { Dialog } from '@components/UI/Dialog'
import { isElectron, getElectronAPI } from '@utils/electronDetection'
import { useProjectStore } from '@stores/projectStore'

interface GitFile {
  file: string
  status: string
  raw: string
}

interface GitCommitProps {
  isOpen: boolean
  onClose: () => void
}

export function GitCommit({ isOpen, onClose }: GitCommitProps) {
  const [files, setFiles] = useState<GitFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [commitMessage, setCommitMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getCurrentProject } = useProjectStore()
  
  const currentProject = getCurrentProject()
  
  useEffect(() => {
    if (isOpen && currentProject) {
      loadGitStatus()
    }
  }, [isOpen, currentProject?.id])
  
  const loadGitStatus = async () => {
    if (!currentProject?.path) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const electronAPI = getElectronAPI()
      const result = await electronAPI.git.status(currentProject.path)
      
      if (result.success) {
        setFiles(result.files || [])
        // Auto-select all modified files
        const modifiedFiles = result.files
          .filter((f: GitFile) => f.status !== 'untracked')
          .map((f: GitFile) => f.file)
        setSelectedFiles(new Set(modifiedFiles))
      } else {
        setError(result.error || 'Failed to load Git status')
      }
    } catch (error) {
      setError('Failed to load Git status')
    } finally {
      setIsLoading(false)
    }
  }
  
  const toggleFile = (file: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(file)) {
      newSelected.delete(file)
    } else {
      newSelected.add(file)
    }
    setSelectedFiles(newSelected)
  }
  
  const handleCommit = async () => {
    if (!currentProject?.path || selectedFiles.size === 0 || !commitMessage.trim()) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const electronAPI = getElectronAPI()
      
      // Stage selected files
      const filesToStage = Array.from(selectedFiles)
      await electronAPI.git.stage(currentProject.path, filesToStage)
      
      // Create commit
      const result = await electronAPI.git.commit(currentProject.path, commitMessage.trim())
      
      if (result.success) {
        setCommitMessage('')
        setSelectedFiles(new Set())
        onClose()
      } else {
        setError(result.error || 'Failed to create commit')
      }
    } catch (error) {
      setError('Failed to create commit')
    } finally {
      setIsLoading(false)
    }
  }
  
  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'modified':
      case 'modified-unstaged':
        return 'text-warning'
      case 'added':
        return 'text-success'
      case 'deleted':
        return 'text-destructive'
      case 'untracked':
        return 'text-muted-foreground'
      default:
        return 'text-foreground'
    }
  }
  
  const getFileStatusLabel = (status: string) => {
    switch (status) {
      case 'modified':
        return 'M'
      case 'modified-unstaged':
        return 'M'
      case 'added':
        return 'A'
      case 'deleted':
        return 'D'
      case 'untracked':
        return '?'
      default:
        return status.substring(0, 1).toUpperCase()
    }
  }
  
  if (!isElectron() || !currentProject) {
    return null
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <GitCommitIcon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Create Commit</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}
            
            {/* Files list */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Files to commit</h3>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes to commit</p>
              ) : (
                <div className="space-y-1">
                  {files.map((file) => (
                    <label
                      key={file.file}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.file)}
                        onChange={() => toggleFile(file.file)}
                        className="rounded"
                      />
                      <span
                        className={`font-mono text-xs font-bold ${getFileStatusColor(file.status)}`}
                      >
                        {getFileStatusLabel(file.status)}
                      </span>
                      <span className="text-sm truncate flex-1">{file.file}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            {/* Commit message */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Commit message
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCommit}
              disabled={isLoading || selectedFiles.size === 0 || !commitMessage.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Commit {selectedFiles.size > 0 && `(${selectedFiles.size})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}