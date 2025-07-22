import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@components/UI/Button'
import { isElectron, getElectronAPI } from '@utils/electronDetection'
import clsx from 'clsx'

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isElectron()) return

    const electronAPI = getElectronAPI()
    
    // Set up update event listeners
    const unsubscribeAvailable = electronAPI.update.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setDismissed(false)
      setError(null)
    })

    const unsubscribeProgress = electronAPI.update.onDownloadProgress((progress) => {
      setDownloadProgress(progress.percent)
      setIsDownloading(true)
    })

    const unsubscribeDownloaded = electronAPI.update.onUpdateDownloaded((info) => {
      setIsDownloading(false)
      setIsDownloaded(true)
      setUpdateInfo(info)
    })

    // Check for updates on mount
    checkForUpdates()

    // Cleanup
    return () => {
      unsubscribeAvailable()
      unsubscribeProgress()
      unsubscribeDownloaded()
    }
  }, [])

  const checkForUpdates = async () => {
    try {
      const electronAPI = getElectronAPI()
      const result = await electronAPI.update.check()
      
      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }

  const handleDownload = async () => {
    try {
      setError(null)
      setIsDownloading(true)
      const electronAPI = getElectronAPI()
      const result = await electronAPI.update.download()
      
      if (!result.success && result.error) {
        setError(result.error)
        setIsDownloading(false)
      }
    } catch (error) {
      setError('Failed to download update')
      setIsDownloading(false)
    }
  }

  const handleInstall = () => {
    const electronAPI = getElectronAPI()
    electronAPI.update.install()
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (!isElectron() || !updateInfo || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 right-4 z-50 max-w-sm"
      >
        <div className="bg-card border border-border rounded-lg shadow-xl p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Update Available</h3>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-accent/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Version {updateInfo.version} is ready to install
            </p>

            {error && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{error}</span>
              </div>
            )}

            {/* Progress bar */}
            {isDownloading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Downloading update...</span>
                  <span>{Math.round(downloadProgress)}%</span>
                </div>
                <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Release notes */}
            {updateInfo.releaseNotes && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  What's new
                </summary>
                <div className="mt-2 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  {updateInfo.releaseNotes}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!isDownloaded && !isDownloading && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  Download Update
                </Button>
              )}
              
              {isDownloading && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Downloading...
                </Button>
              )}
              
              {isDownloaded && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleInstall}
                    className="flex-1"
                  >
                    Restart & Install
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                  >
                    Later
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}