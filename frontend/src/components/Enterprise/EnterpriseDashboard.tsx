import React, { useEffect, useState } from 'react'
import {
  Building2,
  Users,
  Shield,
  BarChart3,
  CreditCard,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Package,
  Cpu,
  Database,
  Globe
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { enterpriseConfig, Organization, UsageMetrics, Team, License } from '../../services/enterprise/enterpriseConfig'
import { useEnterpriseStore } from '../../stores/enterpriseStore'

export const EnterpriseDashboard: React.FC = () => {
  const {
    currentOrganization,
    setCurrentOrganization,
    usageMetrics,
    setUsageMetrics,
    teams,
    setTeams
  } = useEnterpriseStore()

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load organization data
      if (!currentOrganization) {
        // For demo, create a sample organization
        const org = await enterpriseConfig.createOrganization({
          name: 'Acme Corporation',
          slug: 'acme-corp',
          description: 'Leading software development company',
          size: 'medium',
          plan: enterpriseConfig.getAvailablePlans()[1], // Professional plan
          settings: {
            enforceSSO: false,
            allowedAuthMethods: ['password', 'sso'],
            sessionTimeout: 60,
            defaultUserRole: 'developer' as any,
            allowGuestAccess: false,
            requireEmailVerification: true,
            autoJoinTeams: [],
            allowPublicConstructs: true,
            requireConstructReview: false,
            defaultConstructVisibility: 'team',
            enableAuditLogs: true,
            enableDataExport: true,
            gdprCompliant: true,
            hipaaCompliant: false,
            soc2Compliant: true
          },
          ownerId: 'user-123'
        })
        setCurrentOrganization(org)
      }

      // Load teams
      if (currentOrganization) {
        const orgTeams = enterpriseConfig.getOrganizationTeams(currentOrganization.id)
        setTeams(orgTeams)

        // Load usage metrics
        const metrics = enterpriseConfig.getUsageMetrics(currentOrganization.id, selectedPeriod)
        if (metrics) {
          setUsageMetrics(metrics)
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentOrganization || !usageMetrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-gray-600">Please create or select an organization to continue.</p>
        </div>
      </div>
    )
  }

  const license = enterpriseConfig.getLicense(currentOrganization.id)
  const licenseValidation = enterpriseConfig.validateLicense(currentOrganization.id)

  // Prepare chart data
  const usageOverTimeData = [
    { name: 'Mon', constructs: 120, api: 450, ai: 80 },
    { name: 'Tue', constructs: 135, api: 520, ai: 95 },
    { name: 'Wed', constructs: 142, api: 480, ai: 88 },
    { name: 'Thu', constructs: 158, api: 590, ai: 110 },
    { name: 'Fri', constructs: 165, api: 620, ai: 125 },
    { name: 'Sat', constructs: 145, api: 380, ai: 75 },
    { name: 'Sun', constructs: 130, api: 350, ai: 70 }
  ]

  const resourceDistribution = [
    { name: 'Storage', value: usageMetrics.metrics.storage.usedGB, color: '#3B82F6' },
    { name: 'Compute', value: usageMetrics.metrics.compute.hours, color: '#10B981' },
    { name: 'API Calls', value: usageMetrics.metrics.api.calls / 100, color: '#F59E0B' },
    { name: 'AI Tokens', value: usageMetrics.metrics.ai.tokens / 10000, color: '#8B5CF6' }
  ]

  const aiModelUsage = Object.entries(usageMetrics.metrics.ai.models).map(([model, count]) => ({
    name: model,
    value: count,
    color: model.includes('claude') ? '#8B5CF6' : '#3B82F6'
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{currentOrganization.name}</h1>
          <p className="text-gray-600">{currentOrganization.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* License Status */}
      {license && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            licenseValidation.valid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {licenseValidation.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h3 className="font-semibold">
                  {currentOrganization.plan.displayName} Plan - {license.status}
                </h3>
                <p className="text-sm text-gray-600">
                  {license.usedSeats} / {license.seats} seats used
                  {license.endDate && ` • Expires ${new Date(license.endDate).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Manage License
            </button>
          </div>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Users"
          value={usageMetrics.metrics.users.active}
          total={usageMetrics.metrics.users.total}
          icon={Users}
          trend={usageMetrics.metrics.users.new > 0 ? 'up' : 'neutral'}
          trendValue={`+${usageMetrics.metrics.users.new} new`}
        />
        <MetricCard
          title="Constructs"
          value={usageMetrics.metrics.constructs.total}
          subtitle={`${usageMetrics.metrics.constructs.created} created this ${selectedPeriod}`}
          icon={Package}
          trend="up"
          trendValue="+12%"
        />
        <MetricCard
          title="AI Requests"
          value={usageMetrics.metrics.ai.requests}
          subtitle={`${(usageMetrics.metrics.ai.tokens / 1000).toFixed(1)}k tokens`}
          icon={Cpu}
          trend="up"
          trendValue="+25%"
        />
        <MetricCard
          title="API Calls"
          value={usageMetrics.metrics.api.calls}
          subtitle={`${usageMetrics.metrics.api.errors} errors`}
          icon={Globe}
          trend={usageMetrics.metrics.api.errors > 50 ? 'down' : 'up'}
          trendValue={`${usageMetrics.metrics.api.latencyMs}ms avg`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="constructs"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Constructs"
              />
              <Line
                type="monotone"
                dataKey="api"
                stroke="#10B981"
                strokeWidth={2}
                name="API Calls"
              />
              <Line
                type="monotone"
                dataKey="ai"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="AI Requests"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Resource Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Resource Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={resourceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value?.toFixed(1) || '0'}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {resourceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Teams and AI Model Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Teams</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Manage Teams
            </button>
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No teams created yet</p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                Create First Team
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.slice(0, 5).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-gray-600">
                        {team.memberIds.length + 1} members
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {team.quotas.maxConstructs} constructs
                    </p>
                    <p className="text-xs text-gray-600">
                      {team.quotas.maxStorageGB}GB storage
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Model Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4">AI Model Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiModelUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6">
                {aiModelUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Compliance Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Compliance & Security</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ComplianceItem
            title="GDPR"
            status={currentOrganization.settings.gdprCompliant}
            description="EU Data Protection"
          />
          <ComplianceItem
            title="HIPAA"
            status={currentOrganization.settings.hipaaCompliant}
            description="Healthcare Compliance"
          />
          <ComplianceItem
            title="SOC 2"
            status={currentOrganization.settings.soc2Compliant}
            description="Security Standards"
          />
          <ComplianceItem
            title="Audit Logs"
            status={currentOrganization.settings.enableAuditLogs}
            description="Activity Tracking"
          />
        </div>
      </motion.div>
    </div>
  )
}

// Metric Card Component
const MetricCard: React.FC<{
  title: string
  value: number
  total?: number
  subtitle?: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
}> = ({ title, value, total, subtitle, icon: Icon, trend, trendValue }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        {trend !== 'neutral' && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}
        </p>
        {total && (
          <p className="text-sm text-gray-600">/ {total}</p>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      )}
    </motion.div>
  )
}

// Compliance Item Component
const ComplianceItem: React.FC<{
  title: string
  status: boolean
  description: string
}> = ({ title, status, description }) => {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${
        status ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {status ? (
          <CheckCircle className="w-3 h-3 text-green-600" />
        ) : (
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
        )}
      </div>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}