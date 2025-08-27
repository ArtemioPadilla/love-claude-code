import React, { useState, useEffect } from 'react'
import {
  Clock,
  User,
  Shield,
  AlertTriangle,
  Info,
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { auditService, AuditEntry, AuditEventType, AuditSeverity, AuditExportFormat } from '../../services/audit/auditService'
import { useEnterpriseStore } from '../../stores/enterpriseStore'

const severityColors = {
  [AuditSeverity.INFO]: 'text-blue-600 bg-blue-50',
  [AuditSeverity.WARNING]: 'text-yellow-600 bg-yellow-50',
  [AuditSeverity.ERROR]: 'text-red-600 bg-red-50',
  [AuditSeverity.CRITICAL]: 'text-red-800 bg-red-100'
}

const severityIcons = {
  [AuditSeverity.INFO]: Info,
  [AuditSeverity.WARNING]: AlertTriangle,
  [AuditSeverity.ERROR]: AlertTriangle,
  [AuditSeverity.CRITICAL]: Shield
}

export const AuditViewer: React.FC = () => {
  const { currentOrganization } = useEnterpriseStore()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverities, setSelectedSeverities] = useState<AuditSeverity[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<AuditEventType[]>([])
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  })

  useEffect(() => {
    loadAuditLogs()
  }, [currentOrganization, page, searchQuery, selectedSeverities, selectedEventTypes, dateRange])

  const loadAuditLogs = async () => {
    if (!currentOrganization) return
    
    setLoading(true)
    try {
      const result = await auditService.query({
        organizationId: currentOrganization.id,
        searchText: searchQuery,
        severities: selectedSeverities.length > 0 ? selectedSeverities : undefined,
        eventTypes: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        limit: pageSize,
        offset: page * pageSize,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      })
      
      setEntries(result.entries)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async (format: 'json' | 'csv') => {
    if (!currentOrganization) return
    
    try {
      const result = await auditService.export(
        {
          organizationId: currentOrganization.id,
          searchText: searchQuery,
          severities: selectedSeverities.length > 0 ? selectedSeverities : undefined,
          eventTypes: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        },
        format === 'json' ? AuditExportFormat.JSON : AuditExportFormat.CSV
      )
      
      // Create download link
      const blob = new Blob([result.data], { type: result.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export audit logs:', error)
    }
  }

  const toggleSeverity = (severity: AuditSeverity) => {
    setSelectedSeverities(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    )
    setPage(0)
  }

  const getEventTypeLabel = (eventType: AuditEventType): string => {
    return eventType.replace(/_/g, ' ').replace(/\./g, ' > ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to view audit logs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">
          Track all activities and changes in {currentOrganization.name}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))
                setPage(0)
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))
                setPage(0)
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => exportLogs('csv')}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportLogs('json')}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="mt-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Severity:</span>
          {Object.values(AuditSeverity).map(severity => {
            const Icon = severityIcons[severity]
            return (
              <button
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                  selectedSeverities.includes(severity)
                    ? severityColors[severity]
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {severity}
              </button>
            )
          })}
        </div>
      </div>

      {/* Audit Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedSeverities.length > 0
                ? 'Try adjusting your filters'
                : 'Audit logs will appear here as users interact with the system'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => {
                  const Icon = severityIcons[entry.severity]
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${severityColors[entry.severity]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getEventTypeLabel(entry.eventType)}
                            </div>
                            {entry.errorMessage && (
                              <div className="text-xs text-red-600 mt-1">
                                {entry.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{entry.actor.name}</div>
                            {entry.actor.ipAddress && (
                              <div className="text-xs text-gray-500">{entry.actor.ipAddress}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.target ? (
                          <div>
                            <div className="font-medium">{entry.target.name}</div>
                            <div className="text-xs text-gray-500">{entry.target.type}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.result === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.result}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700">
                Page {page + 1} of {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= total}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}