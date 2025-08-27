import React, { useState, useEffect, useCallback, useRef } from 'react';
import { L1ExternalConstruct } from '../../base/L1ExternalConstruct';
import type { ConstructMetadata, ConstructBehavior } from '../../types';
import { Activity, AlertCircle, BarChart3, Bell, Clock, Database, Eye, Gauge, Grid, Layers, LineChart, Monitor, RefreshCw, Save, Settings, Shield, Zap } from 'lucide-react';

export interface GrafanaConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  orgId?: number;
  timeout?: number;
  proxy?: {
    enabled: boolean;
    url: string;
  };
}

export interface GrafanaDashboard {
  id?: number;
  uid: string;
  title: string;
  tags: string[];
  url?: string;
  type?: string;
  folderTitle?: string;
  folderUid?: string;
  folderId?: number;
  schemaVersion: number;
  version?: number;
  isStarred?: boolean;
  slug?: string;
  panels?: GrafanaPanel[];
  templating?: {
    list: GrafanaTemplateVar[];
  };
  annotations?: {
    list: GrafanaAnnotation[];
  };
  time?: {
    from: string;
    to: string;
  };
  timepicker?: {
    refresh_intervals: string[];
  };
}

export interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  gridPos: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  datasource: GrafanaDataSource | string;
  targets: GrafanaQuery[];
  fieldConfig?: any;
  options?: any;
  transparent?: boolean;
  description?: string;
  links?: any[];
  alert?: GrafanaAlert;
}

export interface GrafanaDataSource {
  id?: number;
  uid: string;
  name: string;
  type: string;
  url?: string;
  database?: string;
  user?: string;
  access?: string;
  orgId?: number;
  isDefault?: boolean;
  jsonData?: Record<string, any>;
  secureJsonData?: Record<string, any>;
  readOnly?: boolean;
}

export interface GrafanaQuery {
  refId: string;
  datasource?: GrafanaDataSource | string;
  expr?: string; // Prometheus
  query?: string; // SQL
  measurement?: string; // InfluxDB
  alias?: string;
  format?: string;
  intervalMs?: number;
  maxDataPoints?: number;
}

export interface GrafanaAlert {
  id?: number;
  uid?: string;
  title: string;
  condition: string;
  data: any[];
  noDataState: 'Alerting' | 'NoData' | 'OK';
  execErrState: 'Alerting' | 'OK';
  for: string;
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
  folderUID?: string;
  ruleGroup?: string;
}

export interface GrafanaAnnotation {
  name: string;
  datasource: GrafanaDataSource | string;
  enable: boolean;
  hide?: boolean;
  iconColor?: string;
  query?: string;
  target?: GrafanaQuery;
  type?: string;
}

export interface GrafanaTemplateVar {
  name: string;
  type: 'query' | 'interval' | 'datasource' | 'custom' | 'constant' | 'textbox';
  label?: string;
  hide?: number;
  skipUrlSync?: boolean;
  query?: string;
  datasource?: GrafanaDataSource | string;
  current?: {
    text: string;
    value: string | string[];
  };
  options?: Array<{
    text: string;
    value: string;
    selected?: boolean;
  }>;
  multi?: boolean;
  includeAll?: boolean;
  allValue?: string;
  regex?: string;
  refresh?: number;
}

export interface GrafanaFolder {
  id: number;
  uid: string;
  title: string;
  url?: string;
  hasAcl?: boolean;
  canSave?: boolean;
  canEdit?: boolean;
  canAdmin?: boolean;
  version?: number;
  created?: string;
  updated?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface GrafanaOrganization {
  id: number;
  name: string;
  address?: {
    address1?: string;
    address2?: string;
    city?: string;
    zipCode?: string;
    state?: string;
    country?: string;
  };
}

export interface GrafanaSnapshot {
  id?: number;
  key: string;
  deleteKey?: string;
  url?: string;
  expires?: number;
  created?: string;
  name?: string;
  orgId?: number;
  userId?: number;
  external?: boolean;
  externalUrl?: string;
  dashboard?: GrafanaDashboard;
}

export class GrafanaIntegration extends L1ExternalConstruct {
  static readonly metadata: ConstructMetadata = {
    type: 'external',
    category: 'monitoring',
    name: 'GrafanaIntegration',
    version: '1.0.0',
    description: 'Grafana integration for monitoring and observability dashboards',
    dependencies: [],
    externalDependencies: ['grafana'],
    level: 'L1',
    platform: 'Love Claude Code',
    status: 'stable',
    tags: ['monitoring', 'observability', 'metrics', 'dashboards', 'alerts', 'grafana'],
    author: 'Love Claude Code Team',
    createdAt: new Date().toISOString(),
    vibe: 'observant',
    vibeCodingPercentage: 90,
    constructInterface: {
      inputs: ['config', 'dashboards', 'datasources', 'alerts'],
      outputs: ['visualizations', 'metrics', 'alerts'],
      events: ['onDashboardLoad', 'onAlertTrigger', 'onMetricUpdate', 'onAnnotation']
    }
  };

  private config: GrafanaConfig;
  private headers: Record<string, string> = {};

  constructor(config: GrafanaConfig) {
    super({
      id: 'grafana-integration',
      name: 'GrafanaIntegration',
      type: 'external',
      category: 'monitoring',
      metadata: GrafanaIntegration.metadata,
      inputs: [],
      outputs: [],
      level: 1 // L1
    });
    
    this.config = config;
    this.configureService({
      name: 'grafana',
      endpoint: config.baseUrl,
      connectionTimeout: config.timeout || 30000,
      requestTimeout: config.timeout || 60000
    });
    
    // Configure authentication
    if (config.apiKey) {
      this.configureAuth({
        type: 'bearer',
        bearerToken: config.apiKey
      });
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.username && config.password) {
      this.configureAuth({
        type: 'basic',
        username: config.username,
        password: config.password
      });
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.headers['Authorization'] = `Basic ${auth}`;
    }
    
    this.headers['Content-Type'] = 'application/json';
  }

  protected async performConnect(): Promise<void> {
    // Test connection by fetching organization info
    const response = await fetch(`${this.config.baseUrl}/api/org`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
    }
  }

  protected async performDisconnect(): Promise<void> {
    // Grafana doesn't require explicit disconnect
    this.headers = {};
  }

  getMetadata(): ConstructMetadata {
    return GrafanaIntegration.metadata;
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grafana API error: ${response.status} - ${error}`);
    }
    
    return response.json();
  }

  // Dashboard Management
  async listDashboards(query?: string, tag?: string[], folderIds?: number[]): Promise<GrafanaDashboard[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (tag) tag.forEach(t => params.append('tag', t));
    if (folderIds) folderIds.forEach(id => params.append('folderIds', id.toString()));
    
    return this.makeRequest(`/api/search?${params.toString()}`);
  }

  async getDashboard(uid: string): Promise<{ dashboard: GrafanaDashboard; meta: any }> {
    return this.makeRequest(`/api/dashboards/uid/${uid}`);
  }

  async createDashboard(dashboard: GrafanaDashboard, folderId?: number, overwrite = false): Promise<{ 
    id: number;
    uid: string;
    url: string;
    status: string;
    version: number;
    slug: string;
  }> {
    return this.makeRequest('/api/dashboards/db', {
      method: 'POST',
      body: JSON.stringify({
        dashboard,
        folderId,
        overwrite,
        message: 'Created via Love Claude Code'
      })
    });
  }

  async updateDashboard(uid: string, dashboard: GrafanaDashboard, overwrite = true): Promise<any> {
    const existing = await this.getDashboard(uid);
    return this.makeRequest('/api/dashboards/db', {
      method: 'POST',
      body: JSON.stringify({
        dashboard: {
          ...dashboard,
          id: existing.dashboard.id,
          version: existing.dashboard.version
        },
        overwrite,
        message: 'Updated via Love Claude Code'
      })
    });
  }

  async deleteDashboard(uid: string): Promise<void> {
    await this.makeRequest(`/api/dashboards/uid/${uid}`, {
      method: 'DELETE'
    });
  }

  // Data Source Management
  async listDataSources(): Promise<GrafanaDataSource[]> {
    return this.makeRequest('/api/datasources');
  }

  async getDataSource(id: number): Promise<GrafanaDataSource> {
    return this.makeRequest(`/api/datasources/${id}`);
  }

  async getDataSourceByName(name: string): Promise<GrafanaDataSource> {
    return this.makeRequest(`/api/datasources/name/${name}`);
  }

  async createDataSource(datasource: Partial<GrafanaDataSource>): Promise<{ 
    id: number;
    message: string;
    name: string;
  }> {
    return this.makeRequest('/api/datasources', {
      method: 'POST',
      body: JSON.stringify(datasource)
    });
  }

  async updateDataSource(id: number, datasource: Partial<GrafanaDataSource>): Promise<{
    message: string;
    id: number;
    name: string;
  }> {
    return this.makeRequest(`/api/datasources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datasource)
    });
  }

  async deleteDataSource(id: number): Promise<void> {
    await this.makeRequest(`/api/datasources/${id}`, {
      method: 'DELETE'
    });
  }

  async testDataSource(datasource: Partial<GrafanaDataSource>): Promise<{
    status: string;
    message: string;
  }> {
    return this.makeRequest('/api/datasources/test', {
      method: 'POST',
      body: JSON.stringify(datasource)
    });
  }

  // Alert Management
  async listAlerts(): Promise<GrafanaAlert[]> {
    return this.makeRequest('/api/ruler/grafana/api/v1/rules');
  }

  async getAlert(uid: string): Promise<GrafanaAlert> {
    return this.makeRequest(`/api/ruler/grafana/api/v1/rules/${uid}`);
  }

  async createAlert(alert: GrafanaAlert): Promise<GrafanaAlert> {
    return this.makeRequest('/api/ruler/grafana/api/v1/rules', {
      method: 'POST',
      body: JSON.stringify(alert)
    });
  }

  async updateAlert(uid: string, alert: GrafanaAlert): Promise<GrafanaAlert> {
    return this.makeRequest(`/api/ruler/grafana/api/v1/rules/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(alert)
    });
  }

  async deleteAlert(uid: string): Promise<void> {
    await this.makeRequest(`/api/ruler/grafana/api/v1/rules/${uid}`, {
      method: 'DELETE'
    });
  }

  async pauseAlert(uid: string): Promise<void> {
    await this.makeRequest(`/api/ruler/grafana/api/v1/rules/${uid}/pause`, {
      method: 'POST'
    });
  }

  async unpauseAlert(uid: string): Promise<void> {
    await this.makeRequest(`/api/ruler/grafana/api/v1/rules/${uid}/unpause`, {
      method: 'POST'
    });
  }

  // Folder Management
  async listFolders(): Promise<GrafanaFolder[]> {
    return this.makeRequest('/api/folders');
  }

  async getFolder(uid: string): Promise<GrafanaFolder> {
    return this.makeRequest(`/api/folders/${uid}`);
  }

  async createFolder(title: string): Promise<GrafanaFolder> {
    return this.makeRequest('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  }

  async updateFolder(uid: string, title: string): Promise<GrafanaFolder> {
    return this.makeRequest(`/api/folders/${uid}`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    });
  }

  async deleteFolder(uid: string): Promise<void> {
    await this.makeRequest(`/api/folders/${uid}`, {
      method: 'DELETE'
    });
  }

  // Organization Management
  async getCurrentOrg(): Promise<GrafanaOrganization> {
    return this.makeRequest('/api/org');
  }

  async updateCurrentOrg(name: string): Promise<{ message: string }> {
    return this.makeRequest('/api/org', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  // Annotations
  async createAnnotation(annotation: {
    dashboardId?: number;
    dashboardUID?: string;
    panelId?: number;
    time?: number;
    timeEnd?: number;
    tags?: string[];
    text: string;
  }): Promise<{ message: string; id: number }> {
    return this.makeRequest('/api/annotations', {
      method: 'POST',
      body: JSON.stringify(annotation)
    });
  }

  async listAnnotations(params?: {
    from?: number;
    to?: number;
    dashboardId?: number;
    dashboardUID?: string;
    panelId?: number;
    tags?: string[];
    type?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    
    return this.makeRequest(`/api/annotations?${queryParams.toString()}`);
  }

  async deleteAnnotation(id: number): Promise<{ message: string }> {
    return this.makeRequest(`/api/annotations/${id}`, {
      method: 'DELETE'
    });
  }

  // Snapshot Management
  async createSnapshot(dashboard: GrafanaDashboard, expires?: number): Promise<GrafanaSnapshot> {
    return this.makeRequest('/api/snapshots', {
      method: 'POST',
      body: JSON.stringify({
        dashboard,
        expires
      })
    });
  }

  async listSnapshots(): Promise<GrafanaSnapshot[]> {
    return this.makeRequest('/api/dashboard/snapshots');
  }

  async getSnapshot(key: string): Promise<GrafanaSnapshot> {
    return this.makeRequest(`/api/snapshots/${key}`);
  }

  async deleteSnapshot(key: string): Promise<void> {
    await this.makeRequest(`/api/snapshots/${key}`, {
      method: 'DELETE'
    });
  }

  // Templating helpers
  createPrometheusPanel(title: string, expr: string, options?: Partial<GrafanaPanel>): GrafanaPanel {
    return {
      id: Math.random() * 1000,
      title,
      type: 'graph',
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
      datasource: 'Prometheus',
      targets: [{
        refId: 'A',
        expr,
        format: 'time_series'
      }],
      ...options
    };
  }

  createInfluxDBPanel(title: string, measurement: string, options?: Partial<GrafanaPanel>): GrafanaPanel {
    return {
      id: Math.random() * 1000,
      title,
      type: 'graph',
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
      datasource: 'InfluxDB',
      targets: [{
        refId: 'A',
        measurement,
        format: 'time_series'
      }],
      ...options
    };
  }

  // Dashboard templating
  createDashboardTemplate(title: string, panels: GrafanaPanel[]): GrafanaDashboard {
    return {
      uid: `dashboard-${Date.now()}`,
      title,
      tags: ['love-claude-code'],
      schemaVersion: 27,
      panels,
      time: {
        from: 'now-6h',
        to: 'now'
      },
      timepicker: {
        refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d']
      }
    };
  }

  // Get embed URL for dashboard
  getEmbedUrl(uid: string, options?: {
    from?: string;
    to?: string;
    theme?: 'light' | 'dark';
    kiosk?: boolean;
    refresh?: string;
    vars?: Record<string, string>;
  }): string {
    const params = new URLSearchParams();
    
    if (options) {
      if (options.from) params.append('from', options.from);
      if (options.to) params.append('to', options.to);
      if (options.theme) params.append('theme', options.theme);
      if (options.kiosk) params.append('kiosk', '1');
      if (options.refresh) params.append('refresh', options.refresh);
      if (options.vars) {
        Object.entries(options.vars).forEach(([key, value]) => {
          params.append(`var-${key}`, value);
        });
      }
    }
    
    const queryString = params.toString();
    return `${this.config.baseUrl}/d/${uid}${queryString ? `?${queryString}` : ''}`;
  }

  // React Component for embedding dashboards
  EmbeddedDashboard: React.FC<{
    uid: string;
    height?: string;
    width?: string;
    theme?: 'light' | 'dark';
    refresh?: string;
    from?: string;
    to?: string;
    vars?: Record<string, string>;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  }> = ({ uid, height = '600px', width = '100%', theme = 'light', refresh, from, to, vars, onLoad, onError }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const handleLoad = () => {
        setLoading(false);
        onLoad?.();
        this.emit('dashboard-loaded', { uid });
      };

      const handleError = () => {
        setLoading(false);
        const error = new Error('Failed to load Grafana dashboard');
        onError?.(error);
        this.emit('dashboard-error', { uid, error });
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      };
    }, [uid, onLoad, onError]);

    const embedUrl = this.getEmbedUrl(uid, { theme, refresh, from, to, vars });

    return (
      <div style={{ position: 'relative', width, height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s'
          }}
          title={`Grafana Dashboard ${uid}`}
        />
      </div>
    );
  };

  // UI Component
  Component: React.FC<{
    config: GrafanaConfig;
    onDashboardSelect?: (dashboard: GrafanaDashboard) => void;
    onDataSourceSelect?: (datasource: GrafanaDataSource) => void;
    onAlertSelect?: (alert: GrafanaAlert) => void;
  }> = ({ config, onDashboardSelect, onDataSourceSelect, onAlertSelect }) => {
    const [activeTab, setActiveTab] = useState<'dashboards' | 'datasources' | 'alerts' | 'folders'>('dashboards');
    const [dashboards, setDashboards] = useState<GrafanaDashboard[]>([]);
    const [datasources, setDataSources] = useState<GrafanaDataSource[]>([]);
    const [alerts, setAlerts] = useState<GrafanaAlert[]>([]);
    const [folders, setFolders] = useState<GrafanaFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDashboard, setSelectedDashboard] = useState<GrafanaDashboard | null>(null);
    const [embedOptions, setEmbedOptions] = useState({
      theme: 'light' as 'light' | 'dark',
      refresh: '5s',
      from: 'now-6h',
      to: 'now'
    });

    const integration = useRef(new GrafanaIntegration(config));

    useEffect(() => {
      loadData();
    }, [activeTab]);

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await integration.current.connect();

        switch (activeTab) {
          case 'dashboards': {
            const dashboardData = await integration.current.listDashboards();
            setDashboards(dashboardData);
            break;
          }
          case 'datasources': {
            const datasourceData = await integration.current.listDataSources();
            setDataSources(datasourceData);
            break;
          }
          case 'alerts': {
            const alertData = await integration.current.listAlerts();
            setAlerts(alertData);
            break;
          }
          case 'folders': {
            const folderData = await integration.current.listFolders();
            setFolders(folderData);
            break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    const handleCreateDashboard = async () => {
      try {
        const dashboard = integration.current.createDashboardTemplate(
          'New Monitoring Dashboard',
          [
            integration.current.createPrometheusPanel('CPU Usage', 'rate(process_cpu_seconds_total[5m])', {
              gridPos: { x: 0, y: 0, w: 12, h: 8 }
            }),
            integration.current.createPrometheusPanel('Memory Usage', 'process_resident_memory_bytes', {
              gridPos: { x: 12, y: 0, w: 12, h: 8 }
            })
          ]
        );
        
        await integration.current.createDashboard(dashboard);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create dashboard');
      }
    };

    const handleTestDataSource = async (datasource: GrafanaDataSource) => {
      try {
        const result = await integration.current.testDataSource(datasource);
        alert(`Test ${result.status}: ${result.message}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Test failed');
      }
    };

    const getDatasourceIcon = (type: string) => {
      switch (type) {
        case 'prometheus':
          return <Gauge className="text-orange-600" size={20} />;
        case 'influxdb':
          return <Database className="text-blue-600" size={20} />;
        case 'elasticsearch':
          return <Layers className="text-green-600" size={20} />;
        case 'graphite':
          return <LineChart className="text-gray-600" size={20} />;
        default:
          return <Database className="text-gray-600" size={20} />;
      }
    };

    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Monitor className="text-green-600" />
            Grafana Integration
          </h2>
          <p className="text-gray-600">Monitoring and Observability Platform</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(['dashboards', 'datasources', 'alerts', 'folders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'dashboards' && <Grid size={16} />}
              {tab === 'datasources' && <Database size={16} />}
              {tab === 'alerts' && <Bell size={16} />}
              {tab === 'folders' && <Layers size={16} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-green-600" size={32} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Content based on active tab */}
        {!loading && !error && (
          <>
            {/* Dashboards Tab */}
            {activeTab === 'dashboards' && (
              <div className="space-y-4">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleCreateDashboard}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Grid size={16} />
                    Create Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboards.map((dashboard) => (
                    <div
                      key={dashboard.uid}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedDashboard(dashboard);
                        onDashboardSelect?.(dashboard);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Grid className="text-green-600" size={20} />
                        {dashboard.isStarred && <Zap className="text-yellow-500" size={16} />}
                      </div>
                      <h3 className="font-semibold text-gray-800">{dashboard.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dashboard.tags.map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {dashboard.folderTitle && (
                        <p className="text-sm text-gray-500 mt-1">
                          <Layers size={12} className="inline mr-1" />
                          {dashboard.folderTitle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Embedded Dashboard View */}
                {selectedDashboard && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4">
                        Dashboard Preview: {selectedDashboard.title}
                      </h3>
                      
                      {/* Embed Options */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                          <select
                            value={embedOptions.theme}
                            onChange={(e) => setEmbedOptions({
                              ...embedOptions,
                              theme: e.target.value as 'light' | 'dark'
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Refresh</label>
                          <select
                            value={embedOptions.refresh}
                            onChange={(e) => setEmbedOptions({
                              ...embedOptions,
                              refresh: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            <option value="5s">5s</option>
                            <option value="10s">10s</option>
                            <option value="30s">30s</option>
                            <option value="1m">1m</option>
                            <option value="5m">5m</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                          <input
                            type="text"
                            value={embedOptions.from}
                            onChange={(e) => setEmbedOptions({
                              ...embedOptions,
                              from: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                          <input
                            type="text"
                            value={embedOptions.to}
                            onChange={(e) => setEmbedOptions({
                              ...embedOptions,
                              to: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>
                      </div>
                      
                      <integration.current.EmbeddedDashboard
                        uid={selectedDashboard.uid}
                        height="600px"
                        {...embedOptions}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Sources Tab */}
            {activeTab === 'datasources' && (
              <div className="space-y-4">
                {datasources.map((datasource) => (
                  <div
                    key={datasource.uid}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onDataSourceSelect?.(datasource)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {getDatasourceIcon(datasource.type)}
                        <div>
                          <h4 className="font-medium text-gray-800">{datasource.name}</h4>
                          <p className="text-sm text-gray-500">
                            {datasource.type} • {datasource.url || 'No URL configured'}
                            {datasource.isDefault && ' • Default'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestDataSource(datasource);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          Test Connection
                        </button>
                        {datasource.readOnly && (
                          <Shield className="text-gray-400" size={20} title="Read Only" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg text-center text-gray-500">
                    <Bell className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>No alerts configured</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.uid}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onAlertSelect?.(alert)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-red-600" size={20} />
                          <div>
                            <h4 className="font-medium text-gray-800">{alert.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Condition: {alert.condition} • For: {alert.for}
                            </p>
                            {alert.labels && Object.keys(alert.labels).length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {Object.entries(alert.labels).map(([key, value]) => (
                                  <span key={key} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.noDataState === 'OK' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            No Data: {alert.noDataState}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Folders Tab */}
            {activeTab === 'folders' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.uid}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="text-blue-600" size={20} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{folder.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {folder.version && `v${folder.version}`}
                          {folder.created && ` • Created ${new Date(folder.created).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-3">
                      {folder.canSave && (
                        <Save className="text-green-600" size={14} title="Can Save" />
                      )}
                      {folder.canEdit && (
                        <Settings className="text-blue-600" size={14} title="Can Edit" />
                      )}
                      {folder.canAdmin && (
                        <Shield className="text-purple-600" size={14} title="Can Admin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  async validate(): Promise<boolean> {
    try {
      await this.connect();
      const org = await this.getCurrentOrg();
      return !!org.id;
    } catch {
      return false;
    }
  }

  getBehavior(): ConstructBehavior {
    return {
      capabilities: [
        'dashboard-management',
        'datasource-management',
        'alert-management',
        'annotation-support',
        'folder-organization',
        'snapshot-creation',
        'embedded-dashboards',
        'multi-tenant',
        'templating',
        'real-time-metrics'
      ],
      interfaces: {
        dashboard: {
          list: this.listDashboards.bind(this),
          get: this.getDashboard.bind(this),
          create: this.createDashboard.bind(this),
          update: this.updateDashboard.bind(this),
          delete: this.deleteDashboard.bind(this)
        },
        datasource: {
          list: this.listDataSources.bind(this),
          get: this.getDataSource.bind(this),
          create: this.createDataSource.bind(this),
          update: this.updateDataSource.bind(this),
          delete: this.deleteDataSource.bind(this),
          test: this.testDataSource.bind(this)
        },
        alert: {
          list: this.listAlerts.bind(this),
          get: this.getAlert.bind(this),
          create: this.createAlert.bind(this),
          update: this.updateAlert.bind(this),
          delete: this.deleteAlert.bind(this),
          pause: this.pauseAlert.bind(this),
          unpause: this.unpauseAlert.bind(this)
        },
        annotation: {
          create: this.createAnnotation.bind(this),
          list: this.listAnnotations.bind(this),
          delete: this.deleteAnnotation.bind(this)
        },
        folder: {
          list: this.listFolders.bind(this),
          get: this.getFolder.bind(this),
          create: this.createFolder.bind(this),
          update: this.updateFolder.bind(this),
          delete: this.deleteFolder.bind(this)
        },
        snapshot: {
          create: this.createSnapshot.bind(this),
          list: this.listSnapshots.bind(this),
          get: this.getSnapshot.bind(this),
          delete: this.deleteSnapshot.bind(this)
        }
      },
      events: {
        onDashboardLoad: async (uid: string) => {
          const dashboard = await this.getDashboard(uid);
          this.emit('dashboard-loaded', dashboard);
        },
        onAlertTrigger: async (alert: GrafanaAlert) => {
          this.emit('alert-triggered', alert);
        },
        onMetricUpdate: async (metric: any) => {
          this.emit('metric-updated', metric);
        },
        onAnnotation: async (annotation: any) => {
          this.emit('annotation-created', annotation);
        }
      }
    };
  }
}