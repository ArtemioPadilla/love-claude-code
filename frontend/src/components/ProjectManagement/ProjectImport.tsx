import { useState } from 'react'
import { Upload, FolderOpen, AlertCircle, Check, FileArchive } from 'lucide-react'
import { Button } from '@components/UI/Button'
import { Dialog } from '@components/UI/Dialog'
import { isElectron, getElectronAPI } from '@utils/electronDetection'
import { useProjectStore } from '@stores/projectStore'
import path from 'path-browserify'

interface ProjectImportProps {
  isOpen: boolean
  onClose: () => void
}

interface ImportOptions {
  overwrite: boolean
  validateIntegrity: boolean
}

export function ProjectImport({ isOpen, onClose }: ProjectImportProps) {
  const { addProject, refreshProjects } = useProjectStore()
  
  const [isImporting, setIsImporting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [archiveInfo, setArchiveInfo] = useState<any>(null)
  const [destinationPath, setDestinationPath] = useState<string | null>(null)
  const [options, setOptions] = useState<ImportOptions>({
    overwrite: false,
    validateIntegrity: true
  })
  
  const handleSelectFile = async () => {
    try {
      const electronAPI = getElectronAPI()
      const result = await electronAPI.project.importDialog()
      
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        setSelectedFile(filePath)
        setError(null)
        setArchiveInfo(null)
        
        // Validate archive
        if (options.validateIntegrity) {
          setIsValidating(true)
          const validation = await electronAPI.project.validateArchive(filePath)
          setIsValidating(false)
          
          if (validation.valid) {
            setArchiveInfo(validation)
            
            // Suggest destination path
            const projectName = validation.metadata?.projectPath || 
                              path.basename(filePath, '.lcc').replace('.lcc-template', '')
            const projectList = await electronAPI.project.list()
            const projectsDir = projectList.projectsDirectory || path.join(process.env.HOME || '', 'LoveClaudeCode')
            setDestinationPath(path.join(projectsDir, projectName))
          } else {
            setError(validation.error || 'Invalid archive file')
            setSelectedFile(null)
          }
        }
      }
    } catch (error) {
      setError('Failed to select file')
    }
  }
  
  const handleSelectDestination = async () => {
    try {
      const electronAPI = getElectronAPI()
      const result = await electronAPI.fs.openFileDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Import Destination'
      })
      
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        setDestinationPath(result.filePaths[0])
      }
    } catch (error) {
      console.error('Failed to select destination:', error)
    }
  }
  
  const handleImport = async () => {
    if (!selectedFile || !destinationPath) return
    
    setIsImporting(true)
    setError(null)
    setSuccess(false)
    
    try {
      const electronAPI = getElectronAPI()
      
      // Import the project
      const result = await electronAPI.project.import(
        selectedFile,
        destinationPath,
        options
      )
      
      if (result.success) {
        // Create project entry
        const projectName = path.basename(destinationPath)
        const newProject = {
          id: `project-${Date.now()}`,
          name: projectName,
          path: destinationPath,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          description: result.metadata?.description || 'Imported project',
          tags: result.metadata?.tags || [],
          settings: result.metadata?.settings || {}
        }
        
        await addProject(newProject)
        await refreshProjects()
        
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Import failed')
      }
    } catch (error) {
      setError('Failed to import project')
    } finally {
      setIsImporting(false)
    }
  }
  
  if (!isElectron()) {
    return null
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Upload className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Import Project</h2>
              <p className="text-sm text-muted-foreground">
                Import a project from a .lcc archive
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
                <span className="text-sm text-success">Project imported successfully!</span>
              </div>
            )}
            
            {/* File Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Archive File</label>
              {selectedFile ? (
                <div className="p-3 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileArchive className="h-4 w-4" />
                    <span className="text-sm truncate">{path.basename(selectedFile)}</span>
                  </div>
                  {isValidating && (
                    <p className="text-xs text-muted-foreground mt-1">Validating archive...</p>
                  )}
                  {archiveInfo && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Files: {archiveInfo.fileCount}</p>
                      {archiveInfo.metadata?.exportDate && (
                        <p>Exported: {new Date(archiveInfo.metadata.exportDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSelectFile}
                  className="w-full"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Select Archive File
                </Button>
              )}
            </div>
            
            {/* Destination Selection */}
            {selectedFile && archiveInfo && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Import Location</label>
                {destinationPath ? (
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <p className="text-sm truncate">{destinationPath}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectDestination}
                      className="mt-1"
                    >
                      Change location
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleSelectDestination}
                    className="w-full"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Select Destination
                  </Button>
                )}
              </div>
            )}
            
            {/* Import Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.overwrite}
                  onChange={(e) => setOptions({ ...options, overwrite: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium">Overwrite existing files</div>
                  <div className="text-xs text-muted-foreground">
                    Replace files if they already exist at destination
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.validateIntegrity}
                  onChange={(e) => setOptions({ ...options, validateIntegrity: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium">Validate archive integrity</div>
                  <div className="text-xs text-muted-foreground">
                    Check archive before importing
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={isImporting || !selectedFile || !destinationPath || !archiveInfo}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Project
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}