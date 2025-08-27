import { create } from 'zustand';
import { PerformanceMetric } from '../services/monitoring/performanceMonitor';

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  metric?: PerformanceMetric;
}

export interface PerformanceThreshold {
  metricType: PerformanceMetric['type'];
  metricName?: string;
  maxValue: number;
  alertType: 'error' | 'warning';
}

export interface AggregateMetrics {
  avgPageLoadTime: number;
  avgApiResponseTime: number;
  avgConstructOperationTime: number;
  totalErrors: number;
  errorRate: number;
  memoryUsage: number;
  memoryUsagePercent: number;
}

interface PerformanceStore {
  // State
  metrics: PerformanceMetric[];
  alerts: Alert[];
  thresholds: PerformanceThreshold[];
  maxMetrics: number;
  retentionHours: number;

  // Actions
  addMetric: (metric: PerformanceMetric) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  setThreshold: (threshold: PerformanceThreshold) => void;
  removeThreshold: (index: number) => void;
  getMetricsByType: (type: PerformanceMetric['type'], limit?: number) => PerformanceMetric[];
  getMetricsInTimeRange: (startTime: number, endTime: number) => PerformanceMetric[];
  getAggregateMetrics: () => AggregateMetrics;
  exportMetrics: () => string;
  clearOldMetrics: () => void;
  reset: () => void;
}

const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  { metricType: 'pageLoad', maxValue: 3000, alertType: 'warning' },
  { metricType: 'apiCall', maxValue: 2000, alertType: 'warning' },
  { metricType: 'constructOperation', maxValue: 1000, alertType: 'warning' },
  { metricType: 'error', metricName: 'Error Rate', maxValue: 5, alertType: 'error' },
  { metricType: 'resource', metricName: 'Memory Usage', maxValue: 500, alertType: 'warning' }
];

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  metrics: [],
  alerts: [],
  thresholds: DEFAULT_THRESHOLDS,
  maxMetrics: 10000,
  retentionHours: 24,

  addMetric: (metric) => {
    const state = get();
    
    // Check thresholds
    const relevantThresholds = state.thresholds.filter(
      t => t.metricType === metric.type && (!t.metricName || t.metricName === metric.name)
    );

    relevantThresholds.forEach(threshold => {
      if (metric.value > threshold.maxValue) {
        get().addAlert({
          type: threshold.alertType,
          title: `Performance Threshold Exceeded`,
          message: `${metric.name} (${metric.value}${metric.unit}) exceeds threshold of ${threshold.maxValue}${metric.unit}`,
          metric
        });
      }
    });

    set((state) => {
      const newMetrics = [...state.metrics, metric];
      
      // Maintain max metrics limit
      if (newMetrics.length > state.maxMetrics) {
        newMetrics.splice(0, newMetrics.length - state.maxMetrics);
      }

      return { metrics: newMetrics };
    });
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: `alert-${Date.now()}-${Math.random()}`,
          timestamp: Date.now()
        }
      ].slice(-100) // Keep last 100 alerts
    }));
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter(a => a.id !== alertId)
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  setThreshold: (threshold) => {
    set((state) => ({
      thresholds: [...state.thresholds, threshold]
    }));
  },

  removeThreshold: (index) => {
    set((state) => ({
      thresholds: state.thresholds.filter((_, i) => i !== index)
    }));
  },

  getMetricsByType: (type, limit = 100) => {
    const state = get();
    const filtered = state.metrics.filter(m => m.type === type);
    return filtered.slice(-limit);
  },

  getMetricsInTimeRange: (startTime, endTime) => {
    const state = get();
    return state.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  },

  getAggregateMetrics: () => {
    const state = get();
    const now = Date.now();
    const hourAgo = now - 3600000;
    const recentMetrics = state.metrics.filter(m => m.timestamp > hourAgo);

    const pageLoadMetrics = recentMetrics.filter(m => m.type === 'pageLoad');
    const apiMetrics = recentMetrics.filter(m => m.type === 'apiCall');
    const constructMetrics = recentMetrics.filter(m => m.type === 'constructOperation');
    const errorMetrics = recentMetrics.filter(m => m.type === 'error');
    const memoryMetrics = recentMetrics.filter(m => m.type === 'resource' && m.name === 'Memory Usage');

    const avg = (metrics: PerformanceMetric[]) => {
      if (metrics.length === 0) return 0;
      return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    };

    const latestMemory = memoryMetrics[memoryMetrics.length - 1];

    return {
      avgPageLoadTime: Math.round(avg(pageLoadMetrics)),
      avgApiResponseTime: Math.round(avg(apiMetrics)),
      avgConstructOperationTime: Math.round(avg(constructMetrics)),
      totalErrors: errorMetrics.reduce((sum, m) => sum + m.value, 0),
      errorRate: errorMetrics.find(m => m.name === 'Error Rate')?.value || 0,
      memoryUsage: latestMemory?.value || 0,
      memoryUsagePercent: latestMemory?.metadata?.usagePercent || 0
    };
  },

  exportMetrics: () => {
    const state = get();
    const data = {
      exportDate: new Date().toISOString(),
      metrics: state.metrics,
      aggregates: state.getAggregateMetrics(),
      alerts: state.alerts
    };
    return JSON.stringify(data, null, 2);
  },

  clearOldMetrics: () => {
    const state = get();
    const cutoffTime = Date.now() - (state.retentionHours * 3600000);
    
    set((state) => ({
      metrics: state.metrics.filter(m => m.timestamp > cutoffTime)
    }));
  },

  reset: () => {
    set({
      metrics: [],
      alerts: [],
      thresholds: DEFAULT_THRESHOLDS
    });
  }
}));

// Export for use in performance monitor
export const performanceStore = usePerformanceStore;