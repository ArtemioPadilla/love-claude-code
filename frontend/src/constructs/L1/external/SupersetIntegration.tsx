import React, { useState, useEffect, useCallback, useRef } from 'react';
import { L1ExternalConstruct } from '../../base/L1ExternalConstruct';
import type { ConstructMetadata, ConstructBehavior } from '../../types';
import { LineChart, BarChart, Database, FileSpreadsheet, Download, RefreshCw, Plus, Settings, Search, FileText } from 'lucide-react';

export interface SupersetConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  embedCredentials?: {
    username: string;
    password: string;
  };
}

export interface SupersetDashboard {
  id: number;
  dashboard_title: string;
  slug: string;
  published: boolean;
  position_json: string;
  css: string;
  json_metadata: string;
  changed_on: string;
  changed_by_name: string;
  charts: number[];
}

export interface SupersetChart {
  id: number;
  slice_name: string;
  viz_type: string;
  datasource_id: number;
  datasource_type: string;
  params: string;
  cache_timeout: number;
  changed_on: string;
}

export interface SupersetDataset {
  id: number;
  table_name: string;
  database_name: string;
  schema: string;
  sql: string;
  is_sqllab_view: boolean;
  columns: SupersetColumn[];
  metrics: SupersetMetric[];
}

export interface SupersetColumn {
  column_name: string;
  type: string;
  is_dttm: boolean;
  filterable: boolean;
  groupby: boolean;
}

export interface SupersetMetric {
  metric_name: string;
  expression: string;
  description: string;
}

export interface SupersetDatabase {
  id: number;
  database_name: string;
  sqlalchemy_uri: string;
  backend: string;
  allow_run_async: boolean;
  allow_ctas: boolean;
  allow_cvas: boolean;
}

export interface SQLLabQuery {
  sql: string;
  database_id: number;
  schema?: string;
  tab_name?: string;
  select_as_cta?: boolean;
  ctas_name?: string;
  tmp_table_name?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'png' | 'json';
  dashboardId?: number;
  chartId?: number;
  datasetId?: number;
}

export class SupersetIntegration extends L1ExternalConstruct {
  static readonly metadata: ConstructMetadata = {
    type: 'external',
    category: 'business-intelligence',
    name: 'SupersetIntegration',
    version: '1.0.0',
    description: 'Apache Superset integration for business intelligence and data visualization',
    dependencies: [],
    externalDependencies: ['apache-superset'],
    level: 'L1',
    platform: 'Love Claude Code',
    status: 'stable',
    tags: ['business-intelligence', 'data-visualization', 'analytics', 'dashboards'],
    author: 'Love Claude Code Team',
    createdAt: new Date().toISOString(),
    vibe: 'analytical',
    vibeCodingPercentage: 85,
    constructInterface: {
      inputs: ['config', 'dashboards', 'datasets'],
      outputs: ['visualizations', 'reports', 'insights'],
      events: ['onDashboardLoad', 'onChartUpdate', 'onDataRefresh', 'onExport']
    }
  };

  private config: SupersetConfig;
  private csrfToken?: string;
  private sessionCookie?: string;

  constructor(config: SupersetConfig) {
    super();
    this.config = config;
  }

  getMetadata(): ConstructMetadata {
    return SupersetIntegration.metadata;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    } else if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }

    if (this.csrfToken) {
      headers['X-CSRFToken'] = this.csrfToken;
    }

    return headers;
  }

  async authenticate(): Promise<void> {
    if (this.config.accessToken) {
      // OAuth flow - token already provided
      return;
    }

    // Session-based authentication
    const loginResponse = await fetch(`${this.config.baseUrl}/api/v1/security/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
        provider: 'db',
        refresh: true,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('Authentication failed');
    }

    const loginData = await loginResponse.json();
    this.config.accessToken = loginData.access_token;
    this.config.refreshToken = loginData.refresh_token;

    // Get CSRF token
    const csrfResponse = await fetch(`${this.config.baseUrl}/api/v1/security/csrf_token/`, {
      headers: await this.getHeaders(),
    });
    
    const csrfData = await csrfResponse.json();
    this.csrfToken = csrfData.result;
  }

  // Dashboard Management
  async listDashboards(): Promise<SupersetDashboard[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dashboard/`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboards');
    }

    const data = await response.json();
    return data.result;
  }

  async getDashboard(id: number): Promise<SupersetDashboard> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dashboard/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }

    const data = await response.json();
    return data.result;
  }

  async createDashboard(dashboard: Partial<SupersetDashboard>): Promise<SupersetDashboard> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dashboard/`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(dashboard),
    });

    if (!response.ok) {
      throw new Error('Failed to create dashboard');
    }

    const data = await response.json();
    return data.result;
  }

  async updateDashboard(id: number, updates: Partial<SupersetDashboard>): Promise<SupersetDashboard> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dashboard/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update dashboard');
    }

    const data = await response.json();
    return data.result;
  }

  async deleteDashboard(id: number): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dashboard/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete dashboard');
    }
  }

  // Dataset Management
  async listDatasets(): Promise<SupersetDataset[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dataset/`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch datasets');
    }

    const data = await response.json();
    return data.result;
  }

  async getDataset(id: number): Promise<SupersetDataset> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dataset/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dataset');
    }

    const data = await response.json();
    return data.result;
  }

  async createDataset(dataset: Partial<SupersetDataset>): Promise<SupersetDataset> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dataset/`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(dataset),
    });

    if (!response.ok) {
      throw new Error('Failed to create dataset');
    }

    const data = await response.json();
    return data.result;
  }

  async refreshDataset(id: number): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/dataset/${id}/refresh`, {
      method: 'PUT',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh dataset');
    }
  }

  // Chart Management
  async listCharts(): Promise<SupersetChart[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/chart/`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch charts');
    }

    const data = await response.json();
    return data.result;
  }

  async getChart(id: number): Promise<SupersetChart> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/chart/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chart');
    }

    const data = await response.json();
    return data.result;
  }

  async createChart(chart: Partial<SupersetChart>): Promise<SupersetChart> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/chart/`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(chart),
    });

    if (!response.ok) {
      throw new Error('Failed to create chart');
    }

    const data = await response.json();
    return data.result;
  }

  async updateChart(id: number, updates: Partial<SupersetChart>): Promise<SupersetChart> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/chart/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update chart');
    }

    const data = await response.json();
    return data.result;
  }

  // Database Management
  async listDatabases(): Promise<SupersetDatabase[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/database/`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch databases');
    }

    const data = await response.json();
    return data.result;
  }

  async testDatabaseConnection(database: Partial<SupersetDatabase>): Promise<boolean> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/database/test_connection`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(database),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.result === 'OK';
  }

  // SQL Lab
  async executeSQLQuery(query: SQLLabQuery): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/sqllab/execute/`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error('Failed to execute SQL query');
    }

    const data = await response.json();
    return data.result;
  }

  async getSQLQueryResults(queryId: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/sqllab/results/?key=${queryId}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch query results');
    }

    const data = await response.json();
    return data.result;
  }

  // Export functionality
  async exportDashboard(options: ExportOptions): Promise<Blob> {
    const { format, dashboardId } = options;
    
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/dashboard/${dashboardId}/export/?format=${format}`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export dashboard');
    }

    return response.blob();
  }

  async exportChart(options: ExportOptions): Promise<Blob> {
    const { format, chartId } = options;
    
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/chart/${chartId}/export/?format=${format}`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export chart');
    }

    return response.blob();
  }

  async exportDataset(options: ExportOptions): Promise<Blob> {
    const { format, datasetId } = options;
    
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/dataset/${datasetId}/export/?format=${format}`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export dataset');
    }

    return response.blob();
  }

  // Get embed URL for dashboard
  getEmbedUrl(dashboardId: number, filters?: Record<string, any>): string {
    const baseUrl = `${this.config.baseUrl}/superset/dashboard/${dashboardId}/`;
    const params = new URLSearchParams({
      standalone: '1',
      ...(filters && { preselect_filters: JSON.stringify(filters) }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // React Component for embedding dashboards
  EmbeddedDashboard: React.FC<{
    dashboardId: number;
    height?: string;
    filters?: Record<string, any>;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  }> = ({ dashboardId, height = '600px', filters, onLoad, onError }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const handleLoad = () => {
        setLoading(false);
        onLoad?.();
      };

      const handleError = () => {
        setLoading(false);
        onError?.(new Error('Failed to load dashboard'));
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      };
    }, [onLoad, onError]);

    return (
      <div style={{ position: 'relative', height }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
            <RefreshCw className="animate-spin" size={32} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={this.getEmbedUrl(dashboardId, filters)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
          title={`Superset Dashboard ${dashboardId}`}
        />
      </div>
    );
  };

  // UI Component
  Component: React.FC<{
    config: SupersetConfig;
    onDashboardSelect?: (dashboard: SupersetDashboard) => void;
    onChartSelect?: (chart: SupersetChart) => void;
    onDatasetSelect?: (dataset: SupersetDataset) => void;
  }> = ({ config, onDashboardSelect, onChartSelect, onDatasetSelect }) => {
    const [activeTab, setActiveTab] = useState<'dashboards' | 'charts' | 'datasets' | 'sqllab'>('dashboards');
    const [dashboards, setDashboards] = useState<SupersetDashboard[]>([]);
    const [charts, setCharts] = useState<SupersetChart[]>([]);
    const [datasets, setDatasets] = useState<SupersetDataset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDashboard, setSelectedDashboard] = useState<SupersetDashboard | null>(null);
    const [sqlQuery, setSqlQuery] = useState('');
    const [sqlResults, setSqlResults] = useState<any>(null);

    const integration = useRef(new SupersetIntegration(config));

    useEffect(() => {
      loadData();
    }, [activeTab]);

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await integration.current.authenticate();

        switch (activeTab) {
          case 'dashboards': {
            const dashboardData = await integration.current.listDashboards();
            setDashboards(dashboardData);
            break;
          }
          case 'charts': {
            const chartData = await integration.current.listCharts();
            setCharts(chartData);
            break;
          }
          case 'datasets': {
            const datasetData = await integration.current.listDatasets();
            setDatasets(datasetData);
            break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    const handleExport = async (type: 'dashboard' | 'chart' | 'dataset', id: number, format: ExportOptions['format']) => {
      try {
        const options: ExportOptions = { format };
        
        let blob: Blob;
        switch (type) {
          case 'dashboard':
            options.dashboardId = id;
            blob = await integration.current.exportDashboard(options);
            break;
          case 'chart':
            options.chartId = id;
            blob = await integration.current.exportChart(options);
            break;
          case 'dataset':
            options.datasetId = id;
            blob = await integration.current.exportDataset(options);
            break;
        }

        // Download the file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
      }
    };

    const executeSQLQuery = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await integration.current.executeSQLQuery({
          sql: sqlQuery,
          database_id: 1, // Default database
        });
        setSqlResults(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Query execution failed');
      } finally {
        setLoading(false);
      }
    };

    const filteredDashboards = dashboards.filter(d =>
      d.dashboard_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCharts = charts.filter(c =>
      c.slice_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDatasets = datasets.filter(d =>
      d.table_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Apache Superset Integration</h2>
          <p className="text-gray-600">Business Intelligence and Data Visualization Platform</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(['dashboards', 'charts', 'datasets', 'sqllab'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'dashboards' && <LineChart size={16} />}
                {tab === 'charts' && <BarChart size={16} />}
                {tab === 'datasets' && <Database size={16} />}
                {tab === 'sqllab' && <FileText size={16} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            </button>
          ))}
        </div>

        {/* Search Bar (except for SQL Lab) */}
        {activeTab !== 'sqllab' && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Content based on active tab */}
        {!loading && !error && (
          <>
            {/* Dashboards Tab */}
            {activeTab === 'dashboards' && (
              <div className="space-y-4">
                {filteredDashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedDashboard(dashboard);
                      onDashboardSelect?.(dashboard);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{dashboard.dashboard_title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {dashboard.charts.length} charts • Modified {new Date(dashboard.changed_on).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport('dashboard', dashboard.id, 'pdf');
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Export as PDF"
                        >
                          <Download size={16} />
                        </button>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dashboard.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {dashboard.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Embedded Dashboard View */}
                {selectedDashboard && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Preview: {selectedDashboard.dashboard_title}
                    </h3>
                    <integration.current.EmbeddedDashboard
                      dashboardId={selectedDashboard.id}
                      height="600px"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCharts.map((chart) => (
                  <div
                    key={chart.id}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onChartSelect?.(chart)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <BarChart className="text-blue-600" size={20} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('chart', chart.id, 'png');
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Export as PNG"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                    <h4 className="font-medium text-gray-800">{chart.slice_name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {chart.viz_type} • Modified {new Date(chart.changed_on).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Datasets Tab */}
            {activeTab === 'datasets' && (
              <div className="space-y-4">
                {filteredDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onDatasetSelect?.(dataset)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Database className="text-green-600" size={20} />
                        <div>
                          <h4 className="font-medium text-gray-800">{dataset.table_name}</h4>
                          <p className="text-sm text-gray-500">
                            {dataset.database_name}{dataset.schema && `.${dataset.schema}`} • 
                            {dataset.columns.length} columns • {dataset.metrics.length} metrics
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport('dataset', dataset.id, 'csv');
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Export as CSV"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await integration.current.refreshDataset(dataset.id);
                            await loadData();
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Refresh Dataset"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SQL Lab Tab */}
            {activeTab === 'sqllab' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">SQL Editor</h3>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="w-full h-48 p-3 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Press Ctrl+Enter to execute
                    </div>
                    <button
                      onClick={executeSQLQuery}
                      disabled={!sqlQuery.trim() || loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Settings size={16} />
                      Execute Query
                    </button>
                  </div>
                </div>

                {/* SQL Results */}
                {sqlResults && (
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Query Results</h3>
                    <div className="overflow-x-auto">
                      <pre className="text-sm text-gray-600">
                        {JSON.stringify(sqlResults, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  async validate(): Promise<boolean> {
    try {
      await this.authenticate();
      const dashboards = await this.listDashboards();
      return Array.isArray(dashboards);
    } catch {
      return false;
    }
  }

  getBehavior(): ConstructBehavior {
    return {
      capabilities: [
        'dashboard-management',
        'chart-creation',
        'dataset-management',
        'sql-queries',
        'data-export',
        'embedded-analytics',
        'real-time-refresh',
        'custom-visualizations',
      ],
      interfaces: {
        dashboard: this.listDashboards.bind(this),
        chart: this.listCharts.bind(this),
        dataset: this.listDatasets.bind(this),
        sqlLab: this.executeSQLQuery.bind(this),
        export: {
          dashboard: this.exportDashboard.bind(this),
          chart: this.exportChart.bind(this),
          dataset: this.exportDataset.bind(this),
        },
      },
      events: {
        onAuthenticate: async () => {
          await this.authenticate();
        },
        onDashboardUpdate: async (id: number, updates: Partial<SupersetDashboard>) => {
          return await this.updateDashboard(id, updates);
        },
        onDataRefresh: async (datasetId: number) => {
          await this.refreshDataset(datasetId);
        },
      },
    };
  }
}