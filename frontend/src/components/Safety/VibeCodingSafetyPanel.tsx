/**
 * Vibe Coding Safety Panel
 * 
 * Visual component for monitoring AI-assisted development safety
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  FileText,
  TestTube,
  Lock,
  Unlock,
  Info,
  RefreshCw
} from 'lucide-react'
import { vibeCodingSafety, SafetyMetrics, SafetyViolation, VibeCodingSession } from '../../services/safety/VibeCodingSafety'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../UI/Card'
import { Button } from '../UI/Button'
import { Alert, AlertDescription } from '../UI/Alert'
import { Progress } from '../UI/Progress'

interface VibeCodingSafetyPanelProps {
  className?: string
  showDetails?: boolean
  onViolation?: (violation: SafetyViolation) => void
}

export const VibeCodingSafetyPanel: React.FC<VibeCodingSafetyPanelProps> = ({
  className = '',
  showDetails = true,
  onViolation
}) => {
  const [metrics, setMetrics] = useState<SafetyMetrics>(vibeCodingSafety.getMetrics())
  const [currentSession, setCurrentSession] = useState<VibeCodingSession | null>(null)
  const [violations, setViolations] = useState<SafetyViolation[]>([])
  const [isActive, setIsActive] = useState(false)
  const [showViolations, setShowViolations] = useState(true)

  useEffect(() => {
    // Subscribe to safety events
    const handlers = {
      'session:started': (data: any) => {
        setIsActive(true)
        setCurrentSession(data)
        setViolations([])
      },
      'session:ended': (session: VibeCodingSession) => {
        setIsActive(false)
        setCurrentSession(session)
        setMetrics(vibeCodingSafety.getMetrics())
      },
      'violation': (violation: SafetyViolation) => {
        setViolations(prev => [...prev, violation])
        onViolation?.(violation)
      },
      'metrics:updated': () => {
        setMetrics(vibeCodingSafety.getMetrics())
      }
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      vibeCodingSafety.on(event, handler)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        vibeCodingSafety.off(event, handler)
      })
    }
  }, [onViolation])

  const safetyRate = metrics.totalVibeCodings > 0
    ? (metrics.safeVibeCodings / metrics.totalVibeCodings) * 100
    : 100

  const getSafetyIcon = () => {
    if (!isActive) return <Shield className="w-5 h-5 text-gray-400" />
    if (violations.some(v => v.severity === 'critical')) return <ShieldOff className="w-5 h-5 text-red-500" />
    if (violations.some(v => v.severity === 'high')) return <ShieldAlert className="w-5 h-5 text-orange-500" />
    if (violations.length > 0) return <Shield className="w-5 h-5 text-yellow-500" />
    return <ShieldCheck className="w-5 h-5 text-green-500" />
  }

  const getSafetyStatus = () => {
    if (!isActive) return 'Inactive'
    if (violations.some(v => v.severity === 'critical')) return 'Critical Issues'
    if (violations.some(v => v.severity === 'high')) return 'High Risk'
    if (violations.length > 0) return 'Warnings'
    return 'Safe'
  }

  const getSeverityColor = (severity: SafetyViolation['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
    }
  }

  return (
    <div className={`vibe-coding-safety-panel ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSafetyIcon()}
              <span>Vibe Coding Safety</span>
            </div>
            <span className={`text-sm font-normal px-2 py-1 rounded-full ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {getSafetyStatus()}
            </span>
          </CardTitle>
          <CardDescription>
            AI-assisted development safety monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Safety Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {safetyRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Safety Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.tddCompliance.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">TDD Compliance</div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Test Coverage</span>
                <span>{metrics.averageCoverage.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.averageCoverage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Code Complexity</span>
                <span>{metrics.averageComplexity.toFixed(1)}</span>
              </div>
              <Progress 
                value={Math.min((metrics.averageComplexity / 20) * 100, 100)} 
                className="h-2" 
              />
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-lg font-semibold">{metrics.totalVibeCodings}</div>
              <div className="text-xs text-gray-600">Total Sessions</div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <div className="text-lg font-semibold text-green-600">{metrics.safeVibeCodings}</div>
              <div className="text-xs text-gray-600">Safe Sessions</div>
            </div>
            <div className="bg-red-50 rounded p-2">
              <div className="text-lg font-semibold text-red-600">{metrics.violations}</div>
              <div className="text-xs text-gray-600">Violations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Session */}
      {isActive && currentSession && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentSession.specification && (
                <div className="text-sm">
                  <span className="font-medium">Specification:</span>
                  <p className="text-gray-600 mt-1">{currentSession.specification}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TestTube className="w-4 h-4" />
                  <span>{currentSession.tests?.length || 0} tests</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{violations.length} violations</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Violations */}
      {showDetails && violations.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Safety Violations
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowViolations(!showViolations)}
              >
                {showViolations ? 'Hide' : 'Show'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showViolations && (
            <CardContent>
              <AnimatePresence>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {violations.map((violation, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert variant={violation.severity === 'critical' || violation.severity === 'high' ? 'destructive' : 'default'}>
                        <AlertDescription>
                          <div className="flex items-start gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                              {violation.severity.toUpperCase()}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{violation.rule}</div>
                              <div className="text-sm">{violation.message}</div>
                              {violation.suggestion && (
                                <div className="text-sm text-gray-600 mt-1">
                                  💡 {violation.suggestion}
                                </div>
                              )}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      {showDetails && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const report = vibeCodingSafety.generateReport()
                  console.log('Safety Report:', report)
                  alert(`Safety Report Generated\n\n${report.summary}\n\nCheck console for details.`)
                }}
              >
                <FileText className="w-4 h-4 mr-1" />
                Generate Report
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  vibeCodingSafety.resetMetrics()
                  setMetrics(vibeCodingSafety.getMetrics())
                  setViolations([])
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reset Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}