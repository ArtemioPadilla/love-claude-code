import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: (error: Error, resetError: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Oops! Something went wrong
                  </h1>
                  
                  <p className="text-muted-foreground mb-4">
                    An unexpected error occurred while rendering this component. 
                    Don't worry, your work is safe.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-mono text-red-400 mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                          View stack trace
                        </summary>
                        <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={this.resetError}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                    
                    <button
                      onClick={() => window.location.href = '/'}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Go Home
                    </button>
                    
                    {process.env.NODE_ENV === 'development' && (
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Bug className="w-4 h-4" />
                        Hard Reload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary