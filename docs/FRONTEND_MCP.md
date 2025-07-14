# Frontend MCP Integration Guide

## Overview

This guide explains how to integrate the MCP Provider System into the Love Claude Code frontend, enabling users to interact with provider selection and management through the UI.

## UI Components

### Provider Settings Panel

Create a settings panel that allows users to:
- View current provider configuration
- Compare available providers
- Switch providers with migration options
- Monitor provider health

```typescript
// frontend/src/components/Settings/ProviderSettings.tsx
import { useProviderStore } from '@/stores/providerStore'
import { MCPClient } from '@/services/mcpClient'

export const ProviderSettings = () => {
  const { currentProvider, isLoading } = useProviderStore()
  
  const handleProviderSwitch = async (newProvider: ProviderType) => {
    const result = await MCPClient.switchProvider({
      projectId: currentProject.id,
      newProvider,
      migrate: true
    })
    
    if (result.success && result.data.migrationPlan) {
      // Show migration dialog
    }
  }
  
  return (
    <div className="provider-settings">
      {/* Provider selection UI */}
    </div>
  )
}
```

### Provider Comparison Widget

Display provider comparisons in an easy-to-understand format:

```typescript
// frontend/src/components/Providers/ComparisonTable.tsx
export const ProviderComparisonTable = ({ 
  providers, 
  requirements 
}: ComparisonProps) => {
  const [comparison, setComparison] = useState(null)
  
  useEffect(() => {
    MCPClient.compareProviders({ providers, requirements })
      .then(result => setComparison(result.data.comparison))
  }, [providers, requirements])
  
  return (
    <table className="comparison-table">
      {/* Render comparison data */}
    </table>
  )
}
```

### Cost Estimator Component

Show real-time cost estimates based on project requirements:

```typescript
// frontend/src/components/Providers/CostEstimator.tsx
export const CostEstimator = ({ requirements }: { requirements: ProjectRequirements }) => {
  const [estimates, setEstimates] = useState([])
  
  const updateEstimates = useCallback(
    debounce(async (reqs) => {
      const result = await MCPClient.estimateCosts({ requirements: reqs })
      setEstimates(result.data.estimates)
    }, 500),
    []
  )
  
  return (
    <div className="cost-estimator">
      {estimates.map(estimate => (
        <ProviderCostCard key={estimate.provider} {...estimate} />
      ))}
    </div>
  )
}
```

## State Management

### Provider Store

Create a Zustand store for provider state:

```typescript
// frontend/src/stores/providerStore.ts
import create from 'zustand'
import { MCPClient } from '@/services/mcpClient'

interface ProviderState {
  currentProvider: ProviderType | null
  providerConfig: ProviderConfig | null
  capabilities: ProviderCapabilities | null
  health: ProviderHealth | null
  isLoading: boolean
  error: string | null
  
  // Actions
  loadProviderInfo: (projectId: string) => Promise<void>
  switchProvider: (newProvider: ProviderType, migrate?: boolean) => Promise<void>
  checkHealth: () => Promise<void>
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  currentProvider: null,
  providerConfig: null,
  capabilities: null,
  health: null,
  isLoading: false,
  error: null,
  
  loadProviderInfo: async (projectId) => {
    set({ isLoading: true, error: null })
    try {
      const config = await MCPClient.getProviderConfig({ projectId })
      const capabilities = await MCPClient.listProviders({})
      set({ 
        providerConfig: config.data.configuration,
        currentProvider: config.data.provider,
        capabilities: capabilities.data.providers
      })
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },
  
  // ... other actions
}))
```

## MCP Client Service

Create a service to interact with the MCP server:

```typescript
// frontend/src/services/mcpClient.ts
class MCPClientService {
  private ws: WebSocket | null = null
  
  async connect(projectId: string) {
    this.ws = new WebSocket(`${WS_URL}/mcp/provider`)
    // Handle connection
  }
  
  async callTool<T>(tool: string, args: any): Promise<MCPToolResult<T>> {
    // Send tool request via WebSocket or REST
    const response = await fetch('/api/mcp/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, arguments: args })
    })
    
    return response.json()
  }
  
  // Tool-specific methods
  async analyzeRequirements(args: AnalyzeRequirementsArgs) {
    return this.callTool('analyze_project_requirements', args)
  }
  
  async listProviders(args: ListProvidersArgs) {
    return this.callTool('list_providers', args)
  }
  
  async compareProviders(args: CompareProvidersArgs) {
    return this.callTool('compare_providers', args)
  }
  
  async estimateCosts(args: EstimateCostsArgs) {
    return this.callTool('estimate_costs', args)
  }
  
  async switchProvider(args: SwitchProviderArgs) {
    return this.callTool('switch_provider', args)
  }
  
  async migrateData(args: MigrateDataArgs) {
    return this.callTool('migrate_data', args)
  }
  
  async checkHealth(args: CheckHealthArgs) {
    return this.callTool('check_provider_health', args)
  }
  
  async getProviderConfig(args: GetConfigArgs) {
    return this.callTool('get_provider_config', args)
  }
}

export const MCPClient = new MCPClientService()
```

## Chat Integration

Enable Claude to help users with provider selection:

```typescript
// frontend/src/components/Chat/ProviderAssistant.tsx
export const ProviderAssistant = () => {
  const { sendMessage } = useChatStore()
  
  const providerCommands = {
    '/provider compare': 'Compare available backend providers',
    '/provider recommend': 'Get provider recommendations based on your project',
    '/provider costs': 'Estimate costs for different providers',
    '/provider migrate': 'Plan migration to a different provider'
  }
  
  const handleProviderQuery = async (query: string) => {
    // Parse query and call appropriate MCP tools
    if (query.includes('compare')) {
      const result = await MCPClient.compareProviders({
        providers: ['local', 'firebase', 'aws']
      })
      // Format and display result
    }
    // ... handle other queries
  }
  
  return (
    <div className="provider-assistant">
      {/* Render assistant UI */}
    </div>
  )
}
```

## User Flows

### Initial Provider Selection

1. User creates new project
2. System analyzes project type and shows provider recommendations
3. User reviews comparison and selects provider
4. System configures project with selected provider

```typescript
// frontend/src/flows/ProviderOnboarding.tsx
export const ProviderOnboarding = ({ projectType }: { projectType: ProjectType }) => {
  const [step, setStep] = useState<'requirements' | 'comparison' | 'confirm'>('requirements')
  const [requirements, setRequirements] = useState<ProjectRequirements>()
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>()
  
  const handleRequirementsComplete = async (reqs: ProjectRequirements) => {
    setRequirements(reqs)
    // Get recommendations
    const recommendations = await MCPClient.analyzeRequirements(reqs)
    setStep('comparison')
  }
  
  // Render step-based UI
}
```

### Provider Migration Flow

1. User initiates provider switch
2. System creates migration plan
3. User reviews plan and approves
4. System executes migration with progress tracking
5. User verifies successful migration

```typescript
// frontend/src/flows/ProviderMigration.tsx
export const ProviderMigration = ({ 
  fromProvider, 
  toProvider 
}: MigrationProps) => {
  const [plan, setPlan] = useState<MigrationPlan>()
  const [progress, setProgress] = useState<MigrationProgress>()
  
  const createPlan = async () => {
    const result = await MCPClient.migrateData({
      projectId: currentProject.id,
      fromProvider,
      toProvider,
      execute: false
    })
    setPlan(result.data.plan)
  }
  
  const executeMigration = async () => {
    const result = await MCPClient.migrateData({
      projectId: currentProject.id,
      fromProvider,
      toProvider,
      execute: true
    })
    // Track progress
  }
  
  return <MigrationWizard plan={plan} onExecute={executeMigration} />
}
```

## UI/UX Guidelines

### Provider Cards

Display providers as cards with key information:

```tsx
<ProviderCard>
  <ProviderLogo />
  <ProviderName>Firebase</ProviderName>
  <ProviderTagline>Build apps fast with Google's platform</ProviderTagline>
  <ProviderFeatures>
    <Feature icon="realtime">Real-time database</Feature>
    <Feature icon="auth">Built-in authentication</Feature>
    <Feature icon="hosting">Global CDN hosting</Feature>
  </ProviderFeatures>
  <ProviderPricing>
    <FreeTier>Generous free tier</FreeTier>
    <EstimatedCost>~$25/month for your requirements</EstimatedCost>
  </ProviderPricing>
  <ProviderActions>
    <Button onClick={selectProvider}>Select</Button>
    <Button variant="ghost" onClick={learnMore}>Learn More</Button>
  </ProviderActions>
</ProviderCard>
```

### Comparison Visualization

Use charts and visual comparisons:

```tsx
<ComparisonChart>
  <RadarChart
    dimensions={['Cost', 'Features', 'Scalability', 'Ease of Use', 'Support']}
    data={[
      { provider: 'Local', values: [5, 2, 1, 5, 1] },
      { provider: 'Firebase', values: [3, 4, 4, 5, 3] },
      { provider: 'AWS', values: [2, 5, 5, 2, 5] }
    ]}
  />
</ComparisonChart>
```

### Migration Progress

Show clear migration progress:

```tsx
<MigrationProgress>
  <ProgressStep status="complete">
    <StepTitle>Analyze current data</StepTitle>
    <StepDuration>2 minutes</StepDuration>
  </ProgressStep>
  <ProgressStep status="active">
    <StepTitle>Export user data</StepTitle>
    <StepProgress value={45} />
    <StepEstimate>~5 minutes remaining</StepEstimate>
  </ProgressStep>
  <ProgressStep status="pending">
    <StepTitle>Import to Firebase</StepTitle>
    <StepDuration>Estimated: 10 minutes</StepDuration>
  </ProgressStep>
</MigrationProgress>
```

## Error Handling

Handle MCP errors gracefully:

```typescript
// frontend/src/hooks/useMCPError.ts
export const useMCPError = () => {
  const showError = useErrorStore(state => state.showError)
  
  const handleMCPError = (error: MCPError) => {
    switch (error.code) {
      case 'PROVIDER_UNAVAILABLE':
        showError('Selected provider is currently unavailable. Try again later.')
        break
      case 'MIGRATION_CONFLICT':
        showError('Migration cannot proceed due to data conflicts. Please resolve manually.')
        break
      case 'INSUFFICIENT_PERMISSIONS':
        showError('You need additional permissions to perform this action.')
        break
      default:
        showError(error.message || 'An unexpected error occurred')
    }
  }
  
  return { handleMCPError }
}
```

## Testing Considerations

1. **Mock MCP Responses**
   ```typescript
   // frontend/src/tests/mocks/mcpMocks.ts
   export const mockCompareProviders = {
     success: true,
     data: {
       comparison: { /* mock comparison data */ },
       summary: 'Mock summary',
       recommendation: 'Mock recommendation'
     }
   }
   ```

2. **Component Testing**
   ```typescript
   describe('ProviderSettings', () => {
     it('should display current provider', async () => {
       render(<ProviderSettings />)
       expect(await screen.findByText('Firebase')).toBeInTheDocument()
     })
     
     it('should handle provider switch', async () => {
       const user = userEvent.setup()
       render(<ProviderSettings />)
       
       await user.click(screen.getByText('Switch Provider'))
       await user.click(screen.getByText('AWS'))
       
       expect(mockMCPClient.switchProvider).toHaveBeenCalledWith({
         projectId: 'test-project',
         newProvider: 'aws',
         migrate: true
       })
     })
   })
   ```

3. **Integration Testing**
   - Test full provider selection flow
   - Test migration flow with progress updates
   - Test error scenarios and recovery

## Performance Considerations

1. **Cache MCP Responses**
   ```typescript
   const providerCache = new Map<string, CachedResponse>()
   
   const getCachedOrFetch = async (key: string, fetcher: () => Promise<any>) => {
     const cached = providerCache.get(key)
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data
     }
     
     const data = await fetcher()
     providerCache.set(key, { data, timestamp: Date.now() })
     return data
   }
   ```

2. **Debounce Cost Calculations**
   - Debounce requirement changes
   - Batch multiple calculations
   - Show loading states appropriately

3. **Lazy Load Provider Details**
   - Load basic info first
   - Fetch detailed comparisons on demand
   - Progressive enhancement

## Accessibility

Ensure provider selection is accessible:

1. **Keyboard Navigation**
   - Tab through provider options
   - Enter to select provider
   - Escape to cancel selection

2. **Screen Reader Support**
   - Descriptive labels for all providers
   - Announce cost estimates
   - Progress updates for migration

3. **Visual Indicators**
   - Clear selected state
   - Loading indicators
   - Error states with helpful messages