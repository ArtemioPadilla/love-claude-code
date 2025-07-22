import { useState } from 'react'
import { Package, Download, AlertCircle, Settings2, Check } from 'lucide-react'
import { Button } from '@components/UI/Button'
import { Dialog } from '@components/UI/Dialog'
import { isElectron, getElectronAPI } from '@utils/electronDetection'
import { useProjectStore } from '@stores/projectStore'
import clsx from 'clsx'

interface ProjectExportProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

interface ExportOptions {
  includeNodeModules: boolean
  includeGitHistory: boolean
  includeDotFiles: boolean
  compressionLevel: number
}

export function ProjectExport({ isOpen, onClose, projectId }: ProjectExportProps) {
  const { projects } = useProjectStore()
  const project = projectId ? projects.find(p => p.id === projectId) : null
  
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sizeEstimate, setSizeEstimate] = useState<any>(null)
  const [options, setOptions] = useState<ExportOptions>({
    includeNodeModules: false,
    includeGitHistory: false,
    includeDotFiles: true,
    compressionLevel: 6
  })
  
  const handleEstimateSize = async () => {
    if (!project?.path) return
    
    try {
      const electronAPI = getElectronAPI()
      const estimate = await electronAPI.project.exportSizeEstimate(project.path, options)
      setSizeEstimate(estimate)
    } catch (error) {
      console.error('Failed to estimate size:', error)
    }
  }
  
  const handleExport = async () => {
    if (!project) return
    
    setIsExporting(true)
    setError(null)
    setSuccess(false)
    
    try {
      const electronAPI = getElectronAPI()
      
      // Show save dialog
      const dialogResult = await electronAPI.project.exportDialog(project.name)
      if (dialogResult.canceled || !dialogResult.filePath) {
        setIsExporting(false)
        return
      }
      
      // Export project
      const result = await electronAPI.project.export(
        project.path,
        dialogResult.filePath,
        options
      )
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Export failed')
      }
    } catch (error) {
      setError('Failed to export project')
    } finally {
      setIsExporting(false)
    }
  }
  
  if (!isElectron() || !project) {
    return null
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Export Project</h2>
              <p className="text-sm text-muted-foreground">
                Export "{project.name}" as a .lcc archive
              </p>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm text-success">Project exported successfully!</span>
              </div>
            )}
            
            {/* Export Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Export Options
              </h3>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeNodeModules}
                  onChange={(e) => setOptions({ ...options, includeNodeModules: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium">Include node_modules</div>
                  <div className="text-xs text-muted-foreground">
                    Include dependencies (significantly increases size)
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeGitHistory}
                  onChange={(e) => setOptions({ ...options, includeGitHistory: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium">Include Git history</div>
                  <div className="text-xs text-muted-foreground">
                    Include .git directory with full version history
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeDotFiles}
                  onChange={(e) => setOptions({ ...options, includeDotFiles: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium">Include hidden files</div>
                  <div className="text-xs text-muted-foreground">
                    Include files starting with a dot (.)
                  </div>
                </div>
              </label>
              
              <div>
                <label className="text-sm font-medium">Compression Level</label>
                <input
                  type="range"
                  min="1"
                  max="9"
                  value={options.compressionLevel}
                  onChange={(e) => setOptions({ ...options, compressionLevel: parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Faster</span>
                  <span>Level {options.compressionLevel}</span>
                  <span>Smaller</span>
                </div>
              </div>
            </div>
            
            {/* Size Estimate */}
            {sizeEstimate && (
              <div className="p-3 bg-accent/20 rounded-lg">
                <div className="text-sm font-medium">Estimated Size</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Original: {sizeEstimate.formattedOriginal}
                </div>
                <div className="text-xs text-muted-foreground">
                  Compressed: ~{sizeEstimate.formattedCompressed}
                </div>
                <div className="text-xs text-muted-foreground">
                  Files: {sizeEstimate.fileCount}
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEstimateSize}
              className="w-full"
            >
              Calculate size estimate
            </Button>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Project
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}