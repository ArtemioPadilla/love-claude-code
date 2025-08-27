import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMonitor,
  FiTablet,
  FiSmartphone,
  FiRefreshCw,
  FiExternalLink,
  FiMaximize2,
  FiZoomIn,
  FiZoomOut
} from 'react-icons/fi'

type DeviceType = 'desktop' | 'tablet' | 'mobile'

interface DevicePreset {
  name: string
  width: number
  height: number
  scale: number
}

const DEVICE_PRESETS: Record<DeviceType, DevicePreset> = {
  desktop: { name: 'Desktop', width: 1920, height: 1080, scale: 0.5 },
  tablet: { name: 'iPad Pro', width: 1024, height: 1366, scale: 0.6 },
  mobile: { name: 'iPhone 14 Pro', width: 393, height: 852, scale: 1 }
}

export function Preview() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [zoom, setZoom] = useState(100)
  
  const currentDevice = DEVICE_PRESETS[device]
  const effectiveScale = (zoom / 100) * currentDevice.scale

  useEffect(() => {
    // Simulate loading preview
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
    
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }

  return (
    <motion.div 
      className="h-full flex flex-col bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Preview Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-gradient-subtle">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold gradient-text">Preview</h2>
          
          {/* Device Selector */}
          <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
            {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
              <motion.button
                key={key}
                onClick={() => setDevice(key as DeviceType)}
                className={clsx(
                  'p-2 rounded-md transition-all',
                  device === key 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={preset.name}
              >
                {key === 'desktop' && <FiMonitor size={16} />}
                {key === 'tablet' && <FiTablet size={16} />}
                {key === 'mobile' && <FiSmartphone size={16} />}
              </motion.button>
            ))}
          </div>

        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
            <motion.button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: zoom > 50 ? 1.05 : 1 }}
              whileTap={{ scale: zoom > 50 ? 0.95 : 1 }}
            >
              <FiZoomOut size={14} />
            </motion.button>
            <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
              {zoom}%
            </span>
            <motion.button
              onClick={handleZoomIn}
              disabled={zoom >= 150}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: zoom < 150 ? 1.05 : 1 }}
              whileTap={{ scale: zoom < 150 ? 0.95 : 1 }}
            >
              <FiZoomIn size={14} />
            </motion.button>
          </div>
          
          {/* Actions */}
          <motion.button
            onClick={handleRefresh}
            className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isLoading ? { rotate: 360 } : {}}
            transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            <FiRefreshCw size={16} />
          </motion.button>
          <motion.button
            onClick={() => {
              const previewWindow = window.open('', '_blank')
              if (previewWindow && 'document' in previewWindow) {
                (previewWindow.document as any).write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Preview - Love Claude Code</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body>
                      <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                        <div class="text-center">
                          <h1 class="text-4xl font-bold mb-4">Hello from Love Claude Code!</h1>
                          <p class="text-gray-400">Your preview is now in a new window</p>
                        </div>
                      </div>
                    </body>
                  </html>
                `)
                (previewWindow.document as Document).close()
              }
            }}
            className="p-2 rounded-md hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Open in new tab"
          >
            <FiExternalLink size={16} />
          </motion.button>
        </div>
      </div>

      {/* Device Frame */}
      <div className="flex-1 flex items-center justify-center bg-gray-900/50 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={device}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative"
            style={{
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'center'
            }}
          >
            {/* Device Frame */}
            <div 
              className={clsx(
                'relative bg-gray-950 rounded-3xl shadow-2xl overflow-hidden',
                device === 'mobile' ? 'p-3' : device === 'tablet' ? 'p-4' : 'p-2'
              )}
              style={{
                width: currentDevice.width,
                height: currentDevice.height
              }}
            >
              {/* Notch for mobile */}
              {device === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-950 rounded-b-2xl z-10" />
              )}
              
              {/* Screen */}
              <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <motion.div
                      className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center bg-gray-100 p-8">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">Preview Error</h3>
                      <p className="text-sm text-gray-600 mb-4">{error}</p>
                      <button
                        onClick={handleRefresh}
                        className="btn-primary h-8 px-4 text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Preview</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body>
                          <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                            <div class="text-center">
                              <h1 class="text-4xl font-bold mb-4">Hello from Love Claude Code!</h1>
                              <p class="text-gray-400">Your preview will appear here</p>
                            </div>
                          </div>
                        </body>
                      </html>
                    `}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                )}
              </div>
              
              {/* Home indicator for mobile */}
              {device === 'mobile' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
              )}
            </div>
            
            {/* Device info */}
            <motion.div 
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-muted-foreground">
                {currentDevice.name} • {currentDevice.width}×{currentDevice.height}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="h-8 flex items-center justify-between px-4 border-t border-border/50 bg-gradient-subtle">
        <span className="text-xs text-muted-foreground">
          http://localhost:3001
        </span>
        <span className="text-xs text-muted-foreground">
          {isLoading ? 'Loading...' : 'Ready'}
        </span>
      </div>
    </motion.div>
  )
}