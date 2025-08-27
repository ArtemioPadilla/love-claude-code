import { useEffect, useState } from 'react'
import { GitBranch, GitCommit, RefreshCw, AlertCircle, Check } from 'lucide-react'
import { Button } from '@components/UI/Button'
import { Badge } from '@components/UI/Badge'
import { isElectron, getElectronAPI } from '@utils/electronDetection'
import { useProjectStore } from '@stores/projectStore'

interface GitFile {
  file: string
  status: string
  raw: string
}

interface GitStatusData {
  isRepo: boolean
  branch?: string
  files: GitFile[]
  clean: boolean
  error?: string
}

export function GitStatus() {
  const [gitStatus, setGitStatus] = useState<GitStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGitInstalled, setIsGitInstalled] = useState<boolean | null>(null)
  const { getCurrentProject } = useProjectStore()
  
  const currentProject = getCurrentProject()
  
  // Move hooks to top level
  useEffect(() => {
    // Only check Git installation in Electron with a current project
    if (isElectron() && currentProject) {
      checkGitInstallation()
    }
  }, [currentProject])
  
  useEffect(() => {
    if (currentProject && isGitInstalled && isElectron()) {
      checkGitStatus()
    }
  }, [currentProject?.id, isGitInstalled])
  
  // Early return after hooks
  if (!isElectron() || !currentProject) {
    return null
  }
  
  const checkGitInstallation = async () => {
    try {
      const electronAPI = getElectronAPI()
      const result = await electronAPI.git.checkInstallation()
      setIsGitInstalled(result.installed)
    } catch (error) {
      console.error('Failed to check Git installation:', error)
      setIsGitInstalled(false)
    }
  }
  
  const checkGitStatus = async () => {
    if (!currentProject?.path) return
    
    setIsLoading(true)
    try {
      const electronAPI = getElectronAPI()
      
      // Check if it's a Git repo
      const repoCheck = await electronAPI.git.isRepo(currentProject.path)
      
      if (!repoCheck.isRepo) {
        setGitStatus({
          isRepo: false,
          files: [],
          clean: true
        })
        return
      }
      
      // Get status and branch
      const [statusResult, branchResult] = await Promise.all([
        electronAPI.git.status(currentProject.path),
        electronAPI.git.branchCurrent(currentProject.path)
      ])
      
      setGitStatus({
        isRepo: true,
        branch: branchResult.branch,
        files: statusResult.files || [],
        clean: statusResult.clean || false,
        error: statusResult.error
      })
    } catch (error) {
      console.error('Failed to check Git status:', error)
      setGitStatus({
        isRepo: false,
        files: [],
        clean: true,
        error: error instanceof Error ? error.message : 'Failed to check Git status'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const initializeRepo = async () => {
    if (!currentProject?.path) return
    
    setIsLoading(true)
    try {
      const electronAPI = getElectronAPI()
      await electronAPI.git.init(currentProject.path)
      await checkGitStatus()
    } catch (error) {
      console.error('Failed to initialize Git repo:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isGitInstalled) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Git not installed</span>
      </div>
    )
  }
  
  if (isLoading || !gitStatus) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking Git status...</span>
      </div>
    )
  }
  
  if (!gitStatus.isRepo) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Not a Git repository</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={initializeRepo}
          disabled={isLoading}
          className="h-6 px-2 text-xs"
        >
          Initialize Git
        </Button>
      </div>
    )
  }
  
  const getStatusColor = (fileCount: number) => {
    if (fileCount === 0) return 'success'
    if (fileCount < 5) return 'warning'
    return 'destructive'
  }
  
  const modifiedCount = gitStatus.files.filter(f => 
    f.status === 'modified' || f.status === 'modified-unstaged'
  ).length
  
  const untrackedCount = gitStatus.files.filter(f => f.status === 'untracked').length
  
  return (
    <div className="flex items-center gap-2">
      {/* Branch */}
      <div className="flex items-center gap-1">
        <GitBranch className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-medium">{gitStatus.branch || 'main'}</span>
      </div>
      
      {/* Status */}
      {gitStatus.clean ? (
        <Badge variant="success" className="flex items-center gap-1">
          <Check className="h-3 w-3" />
          Clean
        </Badge>
      ) : (
        <>
          {modifiedCount > 0 && (
            <Badge variant={modifiedCount > 5 ? "error" : modifiedCount > 2 ? "warning" : "info"} className="text-xs">
              {modifiedCount} modified
            </Badge>
          )}
          {untrackedCount > 0 && (
            <Badge variant="default" className="text-xs">
              {untrackedCount} untracked
            </Badge>
          )}
        </>
      )}
      
      {/* Refresh button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={checkGitStatus}
        disabled={isLoading}
        className="h-6 px-2"
      >
        <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
}