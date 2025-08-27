import { performanceStore } from '../../stores/performanceStore';

export interface PerformanceMetric {
  id: string;
  type: 'pageLoad' | 'apiCall' | 'constructOperation' | 'userInteraction' | 'resource' | 'error';
  name: string;
  value: number;
  unit: 'ms' | 'mb' | 'count' | 'percent';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ResourceMetrics {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timing: {
    navigationStart: number;
    loadEventEnd: number;
    domContentLoadedEventEnd: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private errorCount = 0;
  private lastErrorReset = Date.now();

  private constructor() {
    this.initializeObservers();
    this.startResourceMonitoring();
    this.setupErrorTracking();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric({
                id: `nav-${Date.now()}`,
                type: 'pageLoad',
                name: 'Page Load Time',
                value: navEntry.loadEventEnd - navEntry.fetchStart,
                unit: 'ms',
                timestamp: Date.now(),
                metadata: {
                  dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
                  tcp: navEntry.connectEnd - navEntry.connectStart,
                  request: navEntry.responseStart - navEntry.requestStart,
                  response: navEntry.responseEnd - navEntry.responseStart,
                  dom: navEntry.domComplete - navEntry.domInteractive,
                  paint: navEntry.loadEventEnd - navEntry.domComplete
                }
              });
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported:', e);
      }

      // Resource timing observer
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              if (resourceEntry.name.includes('/api/')) {
                this.recordMetric({
                  id: `api-${Date.now()}-${Math.random()}`,
                  type: 'apiCall',
                  name: `API: ${this.extractApiEndpoint(resourceEntry.name)}`,
                  value: resourceEntry.duration,
                  unit: 'ms',
                  timestamp: Date.now(),
                  metadata: {
                    size: resourceEntry.transferSize,
                    cached: resourceEntry.transferSize === 0,
                    method: resourceEntry.initiatorType
                  }
                });
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource observer not supported:', e);
      }
    }
  }

  private startResourceMonitoring() {
    // Monitor memory usage every 10 seconds
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric({
          id: `memory-${Date.now()}`,
          type: 'resource',
          name: 'Memory Usage',
          value: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
          unit: 'mb',
          timestamp: Date.now(),
          metadata: {
            totalHeap: Math.round(memory.totalJSHeapSize / 1048576),
            heapLimit: Math.round(memory.jsHeapSizeLimit / 1048576),
            usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
          }
        });
      }
    }, 10000);

    // Calculate error rate every minute
    setInterval(() => {
      const timeWindow = Date.now() - this.lastErrorReset;
      const errorRate = (this.errorCount / (timeWindow / 60000)) * 100; // Errors per minute as percentage
      
      this.recordMetric({
        id: `error-rate-${Date.now()}`,
        type: 'error',
        name: 'Error Rate',
        value: Math.round(errorRate * 100) / 100,
        unit: 'percent',
        timestamp: Date.now(),
        metadata: {
          errorCount: this.errorCount,
          timeWindowMinutes: timeWindow / 60000
        }
      });

      // Reset error count
      this.errorCount = 0;
      this.lastErrorReset = Date.now();
    }, 60000);
  }

  private setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.errorCount++;
      this.recordMetric({
        id: `error-${Date.now()}-${Math.random()}`,
        type: 'error',
        name: 'JavaScript Error',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        metadata: {
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount++;
      this.recordMetric({
        id: `rejection-${Date.now()}-${Math.random()}`,
        type: 'error',
        name: 'Unhandled Promise Rejection',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        metadata: {
          reason: event.reason?.toString(),
          promise: event.promise
        }
      });
    });
  }

  private extractApiEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    performanceStore.getState().addMetric(metric);
  }

  // Public methods for manual tracking
  trackConstructOperation(operation: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      id: `construct-${Date.now()}-${Math.random()}`,
      type: 'constructOperation',
      name: `Construct: ${operation}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata
    });
  }

  trackUserInteraction(action: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      id: `interaction-${Date.now()}-${Math.random()}`,
      type: 'userInteraction',
      name: `User: ${action}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata
    });
  }

  trackApiCall(endpoint: string, duration: number, status: number, metadata?: Record<string, any>) {
    this.recordMetric({
      id: `api-manual-${Date.now()}-${Math.random()}`,
      type: 'apiCall',
      name: `API: ${endpoint}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        status,
        success: status >= 200 && status < 300,
        ...metadata
      }
    });
  }

  startMeasure(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.trackUserInteraction(name, duration);
    };
  }

  getResourceMetrics(): ResourceMetrics | null {
    if (!('memory' in performance) || !('timing' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    const timing = performance.timing;

    return {
      memory: {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      },
      timing: {
        navigationStart: timing.navigationStart,
        loadEventEnd: timing.loadEventEnd,
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd
      }
    };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();