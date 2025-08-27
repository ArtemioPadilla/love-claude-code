import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, AlertCircle, Clock, Cpu, Download, TrendingUp, TrendingDown, Zap, AlertTriangle, X } from 'lucide-react';
import { usePerformanceStore } from '../../stores/performanceStore';
import { performanceMonitor, PerformanceMetric } from '../../services/monitoring/performanceMonitor';
import './metrics.css';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'good' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon, trend, trendValue, status = 'good' }) => {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    stable: <Activity className="w-4 h-4" />
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${statusColors[status]}`}>
            {trendIcons[trend]}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${statusColors[status]}`}>{value}</span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

interface ChartData {
  time: string;
  value: number;
  name?: string;
}

export const MetricsDashboard: React.FC = () => {
  const {
    metrics,
    alerts,
    thresholds,
    getMetricsByType,
    getAggregateMetrics,
    dismissAlert,
    clearAlerts,
    exportMetrics,
    clearOldMetrics
  } = usePerformanceStore();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(5000);
  const aggregates = getAggregateMetrics();

  useEffect(() => {
    // Clean up old metrics periodically
    const cleanupInterval = setInterval(() => {
      clearOldMetrics();
    }, 3600000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, [clearOldMetrics]);

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        // Force re-render to update charts
        setSelectedTimeRange(prev => prev);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const getTimeRangeMs = () => {
    switch (selectedTimeRange) {
      case '1h': return 3600000;
      case '6h': return 21600000;
      case '24h': return 86400000;
    }
  };

  const formatChartData = (metrics: PerformanceMetric[]): ChartData[] => {
    const now = Date.now();
    const timeRange = getTimeRangeMs();
    const startTime = now - timeRange;
    
    return metrics
      .filter(m => m.timestamp > startTime)
      .map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString(),
        value: m.value,
        name: m.name
      }))
      .slice(-50); // Limit to last 50 points for performance
  };

  const pageLoadData = formatChartData(getMetricsByType('pageLoad'));
  const apiCallData = formatChartData(getMetricsByType('apiCall'));
  const memoryData = formatChartData(getMetricsByType('resource').filter(m => m.name === 'Memory Usage'));
  const errorData = formatChartData(getMetricsByType('error').filter(m => m.name === 'Error Rate'));

  const handleExport = () => {
    const data = exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetricStatus = (value: number, type: 'pageLoad' | 'apiCall' | 'memory' | 'error'): 'good' | 'warning' | 'error' => {
    const threshold = thresholds.find(t => {
      switch (type) {
        case 'pageLoad': return t.metricType === 'pageLoad';
        case 'apiCall': return t.metricType === 'apiCall';
        case 'memory': return t.metricType === 'resource' && t.metricName === 'Memory Usage';
        case 'error': return t.metricType === 'error' && t.metricName === 'Error Rate';
      }
    });

    if (!threshold) return 'good';
    if (value > threshold.maxValue) return threshold.alertType;
    if (value > threshold.maxValue * 0.8) return 'warning';
    return 'good';
  };

  return (
    <div className="metrics-dashboard p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Performance Metrics
          </h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as '1h' | '6h' | '24h')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            <select
              value={refreshInterval || 'manual'}
              onChange={(e) => setRefreshInterval(e.target.value === 'manual' ? null : Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="manual">Manual Refresh</option>
              <option value="5000">5 seconds</option>
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time performance monitoring and system health metrics
        </p>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts ({alerts.length})
            </h3>
            <button
              onClick={clearAlerts}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.slice(-5).reverse().map(alert => (
              <div key={alert.id} className="flex items-start justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{alert.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Avg Page Load Time"
          value={aggregates.avgPageLoadTime}
          unit="ms"
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          status={getMetricStatus(aggregates.avgPageLoadTime, 'pageLoad')}
        />
        <MetricCard
          title="Avg API Response"
          value={aggregates.avgApiResponseTime}
          unit="ms"
          icon={<Zap className="w-6 h-6 text-yellow-600" />}
          status={getMetricStatus(aggregates.avgApiResponseTime, 'apiCall')}
        />
        <MetricCard
          title="Memory Usage"
          value={aggregates.memoryUsage}
          unit="MB"
          icon={<Cpu className="w-6 h-6 text-purple-600" />}
          trend={aggregates.memoryUsagePercent > 80 ? 'up' : 'stable'}
          trendValue={`${aggregates.memoryUsagePercent}%`}
          status={getMetricStatus(aggregates.memoryUsage, 'memory')}
        />
        <MetricCard
          title="Error Rate"
          value={aggregates.errorRate.toFixed(2)}
          unit="%"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          trend={aggregates.errorRate > 1 ? 'up' : 'down'}
          trendValue={`${aggregates.totalErrors} errors`}
          status={getMetricStatus(aggregates.errorRate, 'error')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Load Times Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Page Load Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pageLoadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                name="Load Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* API Response Times Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">API Response Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={apiCallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                name="Response Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Memory Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={memoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3}
                name="Memory (MB)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Error Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={errorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
                name="Error Rate (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Construct Operations */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Construct Operations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Operation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {getMetricsByType('constructOperation', 10).reverse().map((metric) => (
                <tr key={metric.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{metric.name}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      metric.value > 1000 ? 'text-red-600' : metric.value > 500 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {metric.value}{metric.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                    {metric.metadata && Object.keys(metric.metadata).length > 0 && (
                      <span>{JSON.stringify(metric.metadata, null, 2).substring(0, 100)}...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};