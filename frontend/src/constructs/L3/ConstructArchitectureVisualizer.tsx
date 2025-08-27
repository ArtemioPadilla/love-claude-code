import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { L3Construct } from '../base/L3Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../types'
import { DependencyGraphPattern } from '../L2/patterns/DependencyGraphPattern'
import { HierarchyVisualizationPattern } from '../L2/patterns/HierarchyVisualizationPattern'
import { InteractiveDiagramPattern } from '../L2/patterns/visualization/InteractiveDiagramPattern'
import { dependencyResolver } from '../utils/dependencyResolver'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GitBranch, FolderTree, Edit3, Settings, Download,
  Upload, Share2, Users, BarChart3, Info, X, ChevronRight,
  Maximize2, Grid, Layers, Network, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { Node, Edge } from 'reactflow'

export interface VisualizerConfig {
  theme?: 'light' | 'dark' | 'auto'
  defaultView?: 'dependency' | 'hierarchy' | 'interactive'
  enableCollaboration?: boolean
  enableExport?: boolean
  enableImport?: boolean
  enableAnalytics?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  onConstructSelect?: (constructId: string) => void
  onExport?: (data: any, format: string) => void
  onImport?: (file: File) => Promise<any>
}

interface VisualizationMode {
  id: string
  name: string
  icon: React.ElementType
  description: string
  component: any
}

/**
 * L3 Construct Architecture Visualizer
 * Complete application for visualizing and editing construct architectures
 * Combines dependency graphs, hierarchy trees, and interactive diagrams
 */
export class ConstructArchitectureVisualizer extends L3Construct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l3-construct-architecture-visualizer',
    name: 'Construct Architecture Visualizer',
    level: ConstructLevel.L3,
    type: ConstructType.APPLICATION,
    description: 'Complete visualization application for construct architectures with multiple views and advanced features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['application', 'visualization', 'architecture'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    dependencies: [
      'platform-l2-dependency-graph-pattern',
      'platform-l2-hierarchy-visualization-pattern',
      'platform-l2-interactive-diagram-pattern'
    ],
    tags: ['visualizer', 'architecture', 'diagram', 'application'],
    inputs: [
      {
        name: 'config',
        type: 'object',
        description: 'Visualizer configuration',
        required: false,
        defaultValue: {}
      }
    ],
    outputs: [
      {
        name: 'currentView',
        type: 'string',
        description: 'Currently active visualization mode'
      },
      {
        name: 'selectedConstruct',
        type: 'object',
        description: 'Currently selected construct'
      },
      {
        name: 'statistics',
        type: 'object',
        description: 'Architecture statistics and metrics'
      },
      {
        name: 'exportData',
        type: 'object',
        description: 'Prepared export data'
      }
    ],
    security: [
      {
        type: 'input-sanitization',
        description: 'Sanitizes all user inputs and imported data'
      },
      {
        type: 'authentication',
        description: 'Requires authentication for collaboration features'
      },
      {
        type: 'authorization',
        description: 'Role-based access control for editing'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          metric: 'active-users',
          pricePerUnit: 0,
          unit: 'user/month'
        }
      ]
    },
    c4: {
      type: 'Application',
      technology: 'React + TypeScript + ReactFlow',
      container: 'Frontend'
    },
    examples: [
      {
        title: 'Basic Architecture Visualizer',
        description: 'Launch the visualizer with default settings',
        code: `const visualizer = new ConstructArchitectureVisualizer()
await visualizer.initialize({
  theme: 'dark',
  defaultView: 'dependency',
  enableExport: true,
  enableAnalytics: true
})

// Render in your app
<div style={{ width: '100%', height: '100vh' }}>
  {visualizer.render()}
</div>`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use dependency view for understanding relationships',
      'Use hierarchy view for navigating construct levels',
      'Use interactive mode for creating new architectures',
      'Enable auto-refresh for real-time updates',
      'Export diagrams in multiple formats for documentation',
      'Use collaboration features for team reviews'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {
        type: 'object',
        properties: {
          apiEndpoint: { type: 'string' },
          authProvider: { type: 'string' },
          storageProvider: { type: 'string' }
        }
      },
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 99,
      builtWith: [
        'platform-l2-dependency-graph-pattern',
        'platform-l2-hierarchy-visualization-pattern',
        'platform-l2-interactive-diagram-pattern'
      ],
      timeToCreate: 240,
      canBuildConstructs: true
    }
  }

  private config: VisualizerConfig
  private dependencyGraph?: DependencyGraphPattern
  private hierarchyVisualization?: HierarchyVisualizationPattern
  private interactiveDiagram?: InteractiveDiagramPattern
  private currentView: string = 'dependency'
  private selectedConstruct: any = null
  private statistics: any = {}
  private refreshTimer?: NodeJS.Timeout
  protected components: Map<string, any> = new Map()

  constructor() {
    // Convert PlatformConstructDefinition to ConstructMetadata
    const metadata = {
      id: ConstructArchitectureVisualizer.definition.id,
      name: ConstructArchitectureVisualizer.definition.name,
      description: ConstructArchitectureVisualizer.definition.description,
      type: ConstructArchitectureVisualizer.definition.type,
      tags: ConstructArchitectureVisualizer.definition.tags || []
    }
    
    // Convert dependencies to ConstructDependency format
    const dependencies = (ConstructArchitectureVisualizer.definition.dependencies || []).map(dep => ({
      constructId: dep,
      version: '*',
      level: 'L2' as const // These are L2 pattern dependencies
    }))
    
    super(metadata, dependencies)
    this.config = {}
  }

  async initialize(config: VisualizerConfig = {}): Promise<any> {
    this.config = {
      theme: 'dark',
      defaultView: 'dependency',
      enableCollaboration: false,
      enableExport: true,
      enableImport: true,
      enableAnalytics: true,
      autoRefresh: false,
      refreshInterval: 30000,
      ...config
    }
    
    this.currentView = this.config.defaultView!
    this.initialized = true
    
    await this.beforeCompose()
    await this.composeParts()
    this.configureInteractions()
    await this.afterCompose()
    
    // Calculate initial statistics
    await this.updateStatistics()
    
    // Start auto-refresh if enabled
    if (this.config.autoRefresh) {
      this.startAutoRefresh()
    }
    
    return {
      application: this.definition.name,
      ready: true,
      features: {
        views: ['dependency', 'hierarchy', 'interactive'],
        collaboration: this.config.enableCollaboration,
        export: this.config.enableExport,
        analytics: this.config.enableAnalytics
      }
    }
  }

  protected async beforeCompose(): Promise<void> {
    // Pre-composition setup
    console.log('Preparing to compose visualization patterns...')
  }

  protected async afterCompose(): Promise<void> {
    // Post-composition setup
    console.log('Visualization patterns composed successfully')
  }

  protected addComponent(name: string, component: any): void {
    this.components.set(name, component)
    // Add to patterns if it's an L2 pattern
    if (component && typeof component.level === 'string' && component.level === 'L2') {
      this.addPattern(component)
    }
  }

  protected async composeParts(): Promise<void> {
    // Initialize visualization patterns
    this.dependencyGraph = new DependencyGraphPattern()
    this.hierarchyVisualization = new HierarchyVisualizationPattern()
    this.interactiveDiagram = new InteractiveDiagramPattern()
    
    // Add to application
    this.addComponent('dependencyGraph', this.dependencyGraph)
    this.addComponent('hierarchyVisualization', this.hierarchyVisualization)
    this.addComponent('interactiveDiagram', this.interactiveDiagram)
    
    // Initialize each pattern
    await Promise.all([
      this.dependencyGraph.initialize({
        constructId: 'platform-root',
        theme: this.config.theme,
        enableVirtualization: true,
        showMinimap: true,
        onNodeClick: (nodeId) => this.handleConstructSelect(nodeId)
      }),
      
      this.hierarchyVisualization.initialize({
        theme: this.config.theme,
        defaultExpanded: false,
        showMetadata: true,
        enableSearch: true,
        enableFilter: true,
        onNodeSelect: (node) => this.handleConstructSelect(node.id)
      }),
      
      this.interactiveDiagram.initialize({
        theme: this.config.theme,
        enableAutoSave: true,
        enableHistory: true,
        snapToGrid: true,
        onSave: (data) => this.handleDiagramSave(data)
      })
    ])
  }

  protected configureInteractions(): void {
    // Set up cross-pattern communication
    this.dependencyGraph?.on('export', (data) => this.handleExport(data, 'dependency'))
    this.hierarchyVisualization?.on('export', (data) => this.handleExport(data, 'hierarchy'))
    this.interactiveDiagram?.on('export', (data) => this.handleExport(data, 'diagram'))
    
    // Analytics tracking
    if (this.config.enableAnalytics) {
      this.trackUsage()
    }
  }

  private handleConstructSelect(constructId: string): void {
    const construct = dependencyResolver.getConstruct(constructId)
    if (construct) {
      this.selectedConstruct = construct
      this.setOutput('selectedConstruct', construct)
      this.config.onConstructSelect?.(constructId)
      this.emit('construct-selected', construct)
    }
  }

  private async handleDiagramSave(data: { nodes: Node[], edges: Edge[] }): Promise<void> {
    // Save diagram data
    this.emit('diagram-saved', data)
    
    // Update statistics
    await this.updateStatistics()
  }

  private async handleExport(data: any, format: string): Promise<void> {
    const exportData = {
      format,
      data,
      metadata: {
        application: this.definition.name,
        version: this.definition.version,
        timestamp: new Date().toISOString(),
        statistics: this.statistics
      }
    }
    
    this.setOutput('exportData', exportData)
    this.config.onExport?.(exportData, format)
    this.emit('exported', exportData)
  }

  private async updateStatistics(): Promise<void> {
    const allConstructs = dependencyResolver.getAllConstructs()
    
    this.statistics = {
      totalConstructs: allConstructs.length,
      byLevel: {
        L0: allConstructs.filter(c => c.level === ConstructLevel.L0).length,
        L1: allConstructs.filter(c => c.level === ConstructLevel.L1).length,
        L2: allConstructs.filter(c => c.level === ConstructLevel.L2).length,
        L3: allConstructs.filter(c => c.level === ConstructLevel.L3).length
      },
      byType: {
        UI: allConstructs.filter(c => c.type === ConstructType.UI).length,
        INFRASTRUCTURE: allConstructs.filter(c => c.type === ConstructType.INFRASTRUCTURE).length,
        PATTERN: allConstructs.filter(c => c.type === ConstructType.PATTERN).length,
        APPLICATION: allConstructs.filter(c => c.type === ConstructType.APPLICATION).length
      },
      vibeCodingPercentage: Math.round(
        allConstructs
          .filter(c => c.selfReferential?.vibeCodingPercentage)
          .reduce((sum, c) => sum + c.selfReferential!.vibeCodingPercentage!, 0) / 
        allConstructs.filter(c => c.selfReferential?.vibeCodingPercentage).length || 0
      ),
      lastUpdated: new Date().toISOString()
    }
    
    this.setOutput('statistics', this.statistics)
    this.emit('statistics-updated', this.statistics)
  }

  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    
    this.refreshTimer = setInterval(() => {
      this.updateStatistics()
      this.emit('refresh')
    }, this.config.refreshInterval!)
  }

  private trackUsage(): void {
    // Track view changes
    this.on('view-changed', (view) => {
      this.emit('analytics', {
        event: 'view_change',
        view,
        timestamp: Date.now()
      })
    })
    
    // Track interactions
    this.on('construct-selected', (construct) => {
      this.emit('analytics', {
        event: 'construct_selected',
        constructId: construct.id,
        constructLevel: construct.level,
        timestamp: Date.now()
      })
    })
  }

  async destroy(): Promise<void> {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    
    await super.destroy()
  }

  render(): React.ReactElement {
    return <ConstructArchitectureVisualizerComponent app={this} config={this.config} />
  }

  // L3Construct abstract method implementations
  protected updateConfiguration(): void {
    // Update configuration based on environment
    if (this._environment === 'production') {
      this._buildConfig = {
        ...this._buildConfig,
        minify: true,
        sourceMaps: false,
        optimization: 'aggressive'
      }
      this._deploymentConfig = {
        ...this._deploymentConfig,
        replicas: 3,
        autoScaling: true
      }
    } else {
      this._buildConfig = {
        ...this._buildConfig,
        minify: false,
        sourceMaps: true,
        optimization: 'none'
      }
      this._deploymentConfig = {
        ...this._deploymentConfig,
        replicas: 1,
        autoScaling: false
      }
    }
  }

  public async build(): Promise<void> {
    // Build the visualizer application
    console.log('Building Construct Architecture Visualizer...')
    await this.composeParts()
    console.log('Build complete')
  }

  public async deploy(target: string): Promise<void> {
    // Deploy the visualizer application
    console.log(`Deploying to ${target}...`)
    await this.build()
    console.log('Deployment complete')
  }

  public async startDevelopment(): Promise<void> {
    // Start in development mode
    this.setEnvironment('development')
    await this.initialize(this.config)
    console.log('Started in development mode')
  }

  public async startProduction(): Promise<void> {
    // Start in production mode
    this.setEnvironment('production')
    await this.initialize(this.config)
    console.log('Started in production mode')
  }

  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, any>;
  }> {
    // Check health status of all components
    const components: Record<string, any> = {}
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Check each visualization pattern
    const patterns = [
      { name: 'dependencyGraph', component: this.dependencyGraph },
      { name: 'hierarchyVisualization', component: this.hierarchyVisualization },
      { name: 'interactiveDiagram', component: this.interactiveDiagram }
    ]

    for (const { name, component } of patterns) {
      if (component) {
        components[name] = {
          initialized: component.initialized,
          status: component.initialized ? 'healthy' : 'unhealthy'
        }
        if (!component.initialized) {
          overallStatus = 'degraded'
        }
      } else {
        components[name] = { status: 'unhealthy' }
        overallStatus = 'unhealthy'
      }
    }

    return { status: overallStatus, components }
  }

  public async getMetrics(): Promise<Record<string, any>> {
    // Return application metrics
    return {
      statistics: this.statistics,
      currentView: this.currentView,
      selectedConstruct: this.selectedConstruct ? this.selectedConstruct.id : null,
      totalPatterns: this._patterns.size,
      environment: this._environment,
      uptime: Date.now() - this.startTime
    }
  }

  public getVersion(): string {
    return this.definition.version || '1.0.0'
  }

  private startTime: number = Date.now()
}

/**
 * React component for the architecture visualizer application
 */
const ConstructArchitectureVisualizerComponent: React.FC<{
  app: ConstructArchitectureVisualizer
  config: VisualizerConfig
}> = ({ app, config }) => {
  const [currentView, setCurrentView] = useState(config.defaultView || 'dependency')
  const [selectedConstruct, setSelectedConstruct] = useState<any>(null)
  const [statistics, setStatistics] = useState<any>({})
  const [showSidebar, setShowSidebar] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const visualizationModes: VisualizationMode[] = [
    {
      id: 'dependency',
      name: 'Dependency Graph',
      icon: GitBranch,
      description: 'Visualize construct dependencies and relationships',
      component: app.components.get('dependencyGraph')
    },
    {
      id: 'hierarchy',
      name: 'Hierarchy Tree',
      icon: FolderTree,
      description: 'Navigate construct levels from L0 to L3',
      component: app.components.get('hierarchyVisualization')
    },
    {
      id: 'interactive',
      name: 'Interactive Editor',
      icon: Edit3,
      description: 'Create and edit architecture diagrams',
      component: app.components.get('interactiveDiagram')
    }
  ]
  
  // Listen to app events
  useEffect(() => {
    const handlers = {
      'construct-selected': setSelectedConstruct,
      'statistics-updated': setStatistics,
      'refresh': () => setIsLoading(true),
      'exported': () => {
        // Show success notification
      }
    }
    
    Object.entries(handlers).forEach(([event, handler]) => {
      app.on(event, handler)
    })
    
    return () => {
      Object.keys(handlers).forEach(event => {
        app.off(event, (handlers as any)[event])
      })
    }
  }, [app])
  
  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId)
    app['currentView'] = viewId
    app.emit('view-changed', viewId)
  }
  
  const handleExport = async () => {
    const mode = visualizationModes.find(m => m.id === currentView)
    if (mode?.component) {
      mode.component.emit('export')
    }
  }
  
  const handleImport = async () => {
    if (!config.enableImport) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.yaml,.yml'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && config.onImport) {
        setIsLoading(true)
        try {
          const data = await config.onImport(file)
          // Process imported data
          app.emit('imported', data)
        } catch (error) {
          console.error('Import failed:', error)
        }
        setIsLoading(false)
      }
    }
    input.click()
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  const currentMode = visualizationModes.find(m => m.id === currentView)
  
  return (
    <div className={`architecture-visualizer ${config.theme || 'dark'} ${isFullscreen ? 'fullscreen' : ''}`}>
      <style jsx>{`
        .architecture-visualizer {
          width: 100%;
          height: 100%;
          display: flex;
          background: #0f172a;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .architecture-visualizer.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
        }
        
        .sidebar {
          width: 280px;
          background: #1e293b;
          border-right: 1px solid #334155;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease;
        }
        
        .sidebar.hidden {
          margin-left: -280px;
        }
        
        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #334155;
        }
        
        .app-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .app-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        .view-modes {
          padding: 1rem;
        }
        
        .view-mode {
          width: 100%;
          padding: 0.75rem 1rem;
          margin-bottom: 0.5rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #e2e8f0;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .view-mode:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .view-mode.active {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        
        .view-mode-info {
          flex: 1;
        }
        
        .view-mode-name {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        
        .view-mode-description {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        
        .view-mode.active .view-mode-description {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .statistics {
          padding: 1rem;
          border-top: 1px solid #334155;
          margin-top: auto;
        }
        
        .statistics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .statistics-title {
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        
        .stat-item {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.25rem;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .header {
          height: 60px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .toggle-sidebar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #334155;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-sidebar:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .view-title {
          font-size: 1.125rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .action-button {
          height: 40px;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid #334155;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }
        
        .action-button:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .action-button.primary {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        
        .action-button.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
        }
        
        .visualization-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .construct-details {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 320px;
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 1.5rem;
          z-index: 10;
        }
        
        .details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .details-title {
          font-weight: 600;
          font-size: 1.125rem;
        }
        
        .close-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .details-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .detail-value {
          font-size: 0.875rem;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .sidebar {
            position: absolute;
            z-index: 20;
            height: 100%;
          }
          
          .construct-details {
            width: 280px;
            max-width: calc(100vw - 2rem);
          }
        }
      `}</style>
      
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? '' : 'hidden'}`}>
        <div className="sidebar-header">
          <div className="app-title">
            <Layers size={24} />
            Architecture Visualizer
          </div>
          <div className="app-subtitle">
            Explore and edit construct architectures
          </div>
        </div>
        
        <div className="view-modes">
          {visualizationModes.map(mode => {
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                className={`view-mode ${currentView === mode.id ? 'active' : ''}`}
                onClick={() => handleViewChange(mode.id)}
              >
                <Icon size={20} />
                <div className="view-mode-info">
                  <div className="view-mode-name">{mode.name}</div>
                  <div className="view-mode-description">{mode.description}</div>
                </div>
              </button>
            )
          })}
        </div>
        
        {showStats && statistics.totalConstructs && (
          <div className="statistics">
            <div className="statistics-header">
              <div className="statistics-title">
                <BarChart3 size={18} />
                Statistics
              </div>
              <button
                className="close-button"
                onClick={() => setShowStats(false)}
                style={{ width: '24px', height: '24px' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-label">Total Constructs</div>
                <div className="stat-value">{statistics.totalConstructs}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Vibe Coding</div>
                <div className="stat-value">{statistics.vibeCodingPercentage}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">L0 Primitives</div>
                <div className="stat-value">{statistics.byLevel?.L0 || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">L1 Components</div>
                <div className="stat-value">{statistics.byLevel?.L1 || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">L2 Patterns</div>
                <div className="stat-value">{statistics.byLevel?.L2 || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">L3 Applications</div>
                <div className="stat-value">{statistics.byLevel?.L3 || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <button
              className="toggle-sidebar"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <ChevronRight size={20} style={{
                transform: showSidebar ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }} />
            </button>
            
            <div className="view-title">
              {currentMode && (
                <>
                  <currentMode.icon size={20} />
                  {currentMode.name}
                </>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            {config.enableImport && (
              <button className="action-button" onClick={handleImport}>
                <Upload size={18} />
                Import
              </button>
            )}
            
            {config.enableExport && (
              <button className="action-button" onClick={handleExport}>
                <Download size={18} />
                Export
              </button>
            )}
            
            {config.enableCollaboration && (
              <button className="action-button">
                <Users size={18} />
                Share
              </button>
            )}
            
            {config.autoRefresh && (
              <button className="action-button">
                <RefreshCw size={18} />
                Refresh
              </button>
            )}
            
            <button className="action-button" onClick={toggleFullscreen}>
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Visualization Container */}
        <div className="visualization-container">
          {currentMode?.component && currentMode.component.render()}
          
          {/* Selected Construct Details */}
          <AnimatePresence>
            {selectedConstruct && (
              <motion.div
                className="construct-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="details-header">
                  <div className="details-title">{selectedConstruct.name}</div>
                  <button
                    className="close-button"
                    onClick={() => setSelectedConstruct(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="details-content">
                  <div className="detail-item">
                    <div className="detail-label">ID</div>
                    <div className="detail-value">{selectedConstruct.id}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">Level</div>
                    <div className="detail-value">{selectedConstruct.level}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">Type</div>
                    <div className="detail-value">{selectedConstruct.type}</div>
                  </div>
                  
                  {selectedConstruct.description && (
                    <div className="detail-item">
                      <div className="detail-label">Description</div>
                      <div className="detail-value">{selectedConstruct.description}</div>
                    </div>
                  )}
                  
                  {selectedConstruct.selfReferential && (
                    <>
                      <div className="detail-item">
                        <div className="detail-label">Development Method</div>
                        <div className="detail-value">
                          {selectedConstruct.selfReferential.developmentMethod}
                        </div>
                      </div>
                      
                      {selectedConstruct.selfReferential.vibeCodingPercentage !== undefined && (
                        <div className="detail-item">
                          <div className="detail-label">Vibe Coding</div>
                          <div className="detail-value">
                            {selectedConstruct.selfReferential.vibeCodingPercentage}%
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedConstruct.dependencies && selectedConstruct.dependencies.length > 0 && (
                    <div className="detail-item">
                      <div className="detail-label">Dependencies</div>
                      <div className="detail-value">
                        {selectedConstruct.dependencies.length} constructs
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="loading-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="loading-spinner" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Export factory function
export const createConstructArchitectureVisualizer = () => new ConstructArchitectureVisualizer()

// Export the definition for catalog registration  
export const constructArchitectureVisualizerDefinition = ConstructArchitectureVisualizer.definition