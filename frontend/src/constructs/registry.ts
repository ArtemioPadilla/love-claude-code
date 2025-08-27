/**
 * Construct Registry
 * Central registry for all platform constructs
 */

import { ConstructDisplay, PlatformConstructDefinition, ConstructLevel } from './types'
import { ConstructValidator } from '../services/validation/ConstructValidator'
import { ConstructTransformer } from './transformers/ConstructTransformer'

// Import all L0 constructs
import { codeEditorPrimitiveDefinition } from './L0/ui/CodeEditorPrimitive.tsx'
import { chatMessagePrimitiveDefinition } from './L0/ui/ChatMessagePrimitive.tsx'
import { fileTreePrimitiveDefinition } from './L0/ui/FileTreePrimitive.tsx'
import { terminalPrimitiveDefinition } from './L0/ui/TerminalPrimitive.tsx'
import { buttonPrimitiveDefinition } from './L0/ui/ButtonPrimitive.tsx'
import { modalPrimitiveDefinition } from './L0/ui/ModalPrimitive.tsx'
import { panelPrimitiveDefinition } from './L0/ui/PanelPrimitive.tsx'
import { tabPrimitiveDefinition } from './L0/ui/TabPrimitive.tsx'
import { nodePrimitiveDefinition } from './L0/ui/diagram/NodePrimitive'
import { edgePrimitiveDefinition } from './L0/ui/diagram/EdgePrimitive'
import { graphPrimitiveDefinition } from './L0/ui/GraphPrimitive.tsx'
import { layoutEnginePrimitiveDefinition } from './L0/ui/LayoutEnginePrimitive.tsx'

import { dockerContainerPrimitiveDefinition } from './L0/infrastructure/DockerContainerPrimitive.ts'
import { webSocketServerPrimitiveDefinition } from './L0/infrastructure/WebSocketServerPrimitive.ts'
import { apiEndpointPrimitiveDefinition } from './L0/infrastructure/ApiEndpointPrimitive.ts'
import { databaseTablePrimitiveDefinition } from './L0/infrastructure/DatabaseTablePrimitive.ts'
import { storageBucketPrimitiveDefinition } from './L0/infrastructure/StorageBucketPrimitive.ts'
import { authTokenPrimitiveDefinition } from './L0/infrastructure/AuthTokenPrimitive.ts'

// Import MCP L0 infrastructure primitives
import { websocketPrimitiveDefinition } from './L0/infrastructure/mcp/WebSocketPrimitive.definition'
import { rpcPrimitiveDefinition } from './L0/infrastructure/mcp/RPCPrimitive.definition'
import { toolRegistryPrimitiveDefinition } from './L0/infrastructure/mcp/ToolRegistryPrimitive.definition'
import { messageQueuePrimitiveDefinition } from './L0/infrastructure/mcp/MessageQueuePrimitive.definition'

// Import External Construct Primitive
import { externalConstructPrimitiveDefinition } from './L0/infrastructure/external/ExternalConstructPrimitive.definition'

// Import External Integration Primitives
import { NpmPackagePrimitiveConstruct } from './L0/external/NpmPackagePrimitive'
import { DockerServicePrimitiveConstruct } from './L0/external/DockerServicePrimitive'

// Import new External Construct Primitives
import {
  externalPrimitiveDefinitions,
  externalConstructPrimitiveDefinition as newExternalConstructPrimitiveDefinition,
  mcpServerPrimitiveDefinition,
  apiServicePrimitiveDefinition,
  cliToolPrimitiveDefinition
} from './L0/external'

// Import all L1 constructs
import { secureCodeEditorDefinition } from './L1/ui/SecureCodeEditor.tsx'
import { aiChatInterfaceDefinition } from './L1/ui/AIChatInterface.tsx'
import { projectFileExplorerDefinition } from './L1/ui/ProjectFileExplorer.tsx'
import { integratedTerminalDefinition } from './L1/ui/IntegratedTerminal.tsx'
import { responsiveLayoutDefinition } from './L1/ui/ResponsiveLayout.tsx'
import { themedComponentsDefinition } from './L1/ui/ThemedComponents.tsx'

// Import L1 diagram constructs
import { draggableNodeDefinition } from './L1/ui/DraggableNode.tsx'
import { connectedEdgeDefinition } from './L1/ui/ConnectedEdge.tsx'
import { zoomableGraphDefinition } from './L1/ui/ZoomableGraph.tsx'
import { diagramToolbarDefinition } from './L1/ui/DiagramToolbar.tsx'

// Import L1 infrastructure constructs
import { managedContainerDefinition } from './L1/infrastructure/ManagedContainer.ts'
import { authenticatedWebSocketDefinition } from './L1/infrastructure/AuthenticatedWebSocket.ts'
import { restAPIServiceDefinition } from './L1/infrastructure/RestAPIService.ts'
import { encryptedDatabaseDefinition } from './L1/infrastructure/EncryptedDatabase.ts'
import { cdnStorageDefinition } from './L1/infrastructure/CDNStorage.tsx'
import { secureAuthServiceDefinition } from './L1/infrastructure/SecureAuthService.tsx'
import { secureMCPServerDefinition } from './L1/infrastructure/SecureMCPServer.definition'
import { authenticatedToolRegistryDefinition } from './L1/infrastructure/AuthenticatedToolRegistry.definition'
import { rateLimitedRPCDefinition } from './L1/infrastructure/RateLimitedRPC.definition'
import { encryptedWebSocketDefinition } from './L1/infrastructure/EncryptedWebSocket.definition'
import { tddGuardDefinition } from './L1/infrastructure/TDDGuardConstruct.definition'

// Import L1 monitoring constructs
import { prometheusMetricsDefinition } from './L1/monitoring/PrometheusMetricsConstruct.tsx'

// Import L1 dev-tools constructs
import { codeQualityDefinition } from './L1/dev-tools/CodeQualityConstruct.tsx'
import { testRunnerDefinition } from './L1/dev-tools/TestRunnerConstruct.tsx'

// Import L2 pattern constructs
import { ideWorkspaceDefinition } from './L2/patterns/IDEWorkspace.tsx'
import { claudeConversationDefinition } from './L2/patterns/ClaudeConversationSystem.tsx'
import { projectManagementDefinition } from './L2/patterns/ProjectManagementSystem.tsx'
import { realTimeCollaborationDefinition } from './L2/patterns/RealTimeCollaboration.tsx'
import { deploymentPipelineDefinition } from './L2/patterns/DeploymentPipeline.tsx'
import { microserviceBackendDefinition } from './L2/patterns/MicroserviceBackend.tsx'
import { staticSiteHostingDefinition } from './L2/patterns/StaticSiteHosting.tsx'
import { serverlessAPIPatternDefinition } from './L2/patterns/ServerlessAPIPattern.tsx'
import { multiProviderAbstractionDefinition } from './L2/patterns/MultiProviderAbstraction.tsx'
import { constructCatalogSystemDefinition } from './L2/patterns/ConstructCatalogSystem.tsx'
import { mcpServerPatternDefinition } from './L2/patterns/MCPServerPattern.tsx'
import { toolOrchestrationPatternDefinition } from './L2/patterns/ToolOrchestrationPattern.tsx'
import { dependencyGraphPatternDefinition } from './L2/patterns/DependencyGraphPattern.tsx'
import { hierarchyVisualizationPatternDefinition } from './L2/patterns/HierarchyVisualizationPattern.tsx'
import { interactiveDiagramPatternDefinition } from './L2/patterns/visualization/InteractiveDiagramPattern.tsx'

// Import L3 application constructs from index
import { 
  loveClaudeCodeFrontendDefinition,
  loveClaudeCodeBackendDefinition,
  loveClaudeCodeMCPServerDefinition,
  loveClaudeCodePlatformDefinition
} from './L3/applications'
import { constructArchitectureVisualizerDefinition } from './L3/ConstructArchitectureVisualizer'

/**
 * Raw construct definitions before validation/transformation
 */
const RAW_CONSTRUCTS: any[] = [
  // L0 UI Primitives
  codeEditorPrimitiveDefinition,
  chatMessagePrimitiveDefinition,
  fileTreePrimitiveDefinition,
  terminalPrimitiveDefinition,
  buttonPrimitiveDefinition,
  modalPrimitiveDefinition,
  panelPrimitiveDefinition,
  tabPrimitiveDefinition,
  nodePrimitiveDefinition,
  edgePrimitiveDefinition,
  graphPrimitiveDefinition,
  layoutEnginePrimitiveDefinition,
  
  // L0 Infrastructure Primitives
  dockerContainerPrimitiveDefinition,
  webSocketServerPrimitiveDefinition,
  apiEndpointPrimitiveDefinition,
  databaseTablePrimitiveDefinition,
  storageBucketPrimitiveDefinition,
  authTokenPrimitiveDefinition,
  
  // L0 MCP Infrastructure Primitives
  websocketPrimitiveDefinition,
  rpcPrimitiveDefinition,
  toolRegistryPrimitiveDefinition,
  messageQueuePrimitiveDefinition,
  
  // L0 External Integration Primitive
  externalConstructPrimitiveDefinition,
  NpmPackagePrimitiveConstruct.definition,
  DockerServicePrimitiveConstruct.definition,
  
  // New L0 External Construct Primitives
  newExternalConstructPrimitiveDefinition,
  mcpServerPrimitiveDefinition,
  apiServicePrimitiveDefinition,
  cliToolPrimitiveDefinition,
  
  // L1 UI Constructs
  secureCodeEditorDefinition,
  aiChatInterfaceDefinition,
  projectFileExplorerDefinition,
  integratedTerminalDefinition,
  responsiveLayoutDefinition,
  themedComponentsDefinition,
  
  // L1 Diagram Constructs
  draggableNodeDefinition,
  connectedEdgeDefinition,
  zoomableGraphDefinition,
  diagramToolbarDefinition,
  
  // L1 Infrastructure Constructs
  managedContainerDefinition,
  authenticatedWebSocketDefinition,
  restAPIServiceDefinition,
  encryptedDatabaseDefinition,
  cdnStorageDefinition,
  secureAuthServiceDefinition,
  secureMCPServerDefinition,
  authenticatedToolRegistryDefinition,
  rateLimitedRPCDefinition,
  encryptedWebSocketDefinition,
  tddGuardDefinition,
  
  // L1 Monitoring Constructs
  prometheusMetricsDefinition,
  
  // L1 Dev Tools Constructs
  codeQualityDefinition,
  testRunnerDefinition,
  
  // L2 Pattern Constructs
  ideWorkspaceDefinition,
  claudeConversationDefinition,
  projectManagementDefinition,
  realTimeCollaborationDefinition,
  deploymentPipelineDefinition,
  microserviceBackendDefinition,
  staticSiteHostingDefinition,
  serverlessAPIPatternDefinition,
  multiProviderAbstractionDefinition,
  constructCatalogSystemDefinition,
  mcpServerPatternDefinition,
  toolOrchestrationPatternDefinition,
  dependencyGraphPatternDefinition,
  hierarchyVisualizationPatternDefinition,
  interactiveDiagramPatternDefinition,
  
  // L3 Application Constructs
  loveClaudeCodeFrontendDefinition,
  loveClaudeCodeBackendDefinition,
  loveClaudeCodeMCPServerDefinition,
  loveClaudeCodePlatformDefinition,
  constructArchitectureVisualizerDefinition
]

/**
 * Validate and transform constructs
 */
function validateAndTransformConstructs(): PlatformConstructDefinition[] {
  const validated: PlatformConstructDefinition[] = []
  
  for (const rawConstruct of RAW_CONSTRUCTS) {
    try {
      // Determine construct level for validation
      const level = rawConstruct.level as ConstructLevel
      
      // Transform L2/L3 constructs if needed
      let transformed = rawConstruct
      if (level === ConstructLevel.L2 || level === ConstructLevel.L3) {
        transformed = ConstructTransformer.transformL2L3Format(rawConstruct)
      } else {
        transformed = ConstructTransformer.transform(rawConstruct)
      }
      
      // Validate the transformed construct
      const validationResult = ConstructValidator.validate(transformed, level)
      
      if (!validationResult.valid) {
        console.error(`Validation failed for construct ${transformed.id || 'unknown'}:`)
        validationResult.errors.forEach(error => {
          console.error(`  - ${error.field}: ${error.message}`)
        })
        
        // Try to auto-fix the construct
        const fixed = ConstructValidator.autoFix(transformed)
        const revalidation = ConstructValidator.validate(fixed, level)
        
        if (revalidation.valid) {
          console.warn(`Auto-fixed construct ${fixed.id}`)
          validated.push(fixed as PlatformConstructDefinition)
        } else {
          console.error(`Could not auto-fix construct ${transformed.id || 'unknown'}, skipping`)
        }
      } else {
        // Log warnings if any
        if (validationResult.warnings.length > 0) {
          console.warn(`Warnings for construct ${transformed.id}:`)
          validationResult.warnings.forEach(warning => {
            console.warn(`  - ${warning.field}: ${warning.message}`)
          })
        }
        
        validated.push(transformed as PlatformConstructDefinition)
      }
    } catch (error) {
      console.error('Error processing construct:', error)
    }
  }
  
  console.log(`Validated ${validated.length} out of ${RAW_CONSTRUCTS.length} constructs`)
  return validated
}

/**
 * Registry of all validated platform constructs
 */
export const CONSTRUCT_REGISTRY: PlatformConstructDefinition[] = validateAndTransformConstructs()

/**
 * Convert definitions to display format
 */
export function createConstructDisplay(definition: PlatformConstructDefinition): ConstructDisplay {
  // Determine icon based on construct type and level
  let icon = '📦'
  
  const categories = definition.categories || []
  
  if (definition.level === 'L0') {
    if (categories.includes('ui')) {
      icon = '🎨'
    } else if (categories.includes('infrastructure')) {
      icon = '🏗️'
    }
  } else if (definition.level === 'L1') {
    if (categories.includes('ui')) {
      icon = '🎭'
    } else if (categories.includes('infrastructure')) {
      icon = '🔧'
    }
  } else if (definition.level === 'L2') {
    icon = '🧩'
  } else if (definition.level === 'L3') {
    icon = '🚀'
  }
  
  // Check if it's a featured construct
  const featured = definition.selfReferential?.isPlatformConstruct || false
  
  // Calculate popularity based on various factors
  const popularity = calculatePopularity(definition)
  
  // Default rating (can be enhanced with actual ratings)
  const rating = 4.5 + (Math.random() * 0.5) // 4.5-5.0 range
  
  // Deployment count (mock data for now)
  const deploymentCount = Math.floor(Math.random() * 1000) + 100
  
  return {
    definition,
    icon,
    featured,
    popularity,
    rating,
    deploymentCount,
    lastUpdated: new Date() // Would come from git history in real implementation
  }
}

/**
 * Calculate popularity score based on various factors
 */
function calculatePopularity(definition: PlatformConstructDefinition): number {
  let score = 50 // Base score
  
  // Platform constructs get a boost
  if (definition.selfReferential?.isPlatformConstruct) {
    score += 20
  }
  
  // Lower level constructs are more popular
  switch (definition.level) {
    case 'L0': score += 15; break
    case 'L1': score += 10; break
    case 'L2': score += 5; break
    case 'L3': score += 0; break
  }
  
  // More providers = more popular
  score += (definition.providers?.length || 0) * 5
  
  // Security features add popularity
  if (definition.security && definition.security.length > 0) {
    score += 5
  }
  
  // Cap at 100
  return Math.min(score, 100)
}

/**
 * Get all constructs as display format
 */
export function getAllConstructsDisplay(): ConstructDisplay[] {
  return CONSTRUCT_REGISTRY.map(createConstructDisplay)
}

/**
 * Get constructs by level
 */
export function getConstructsByLevel(level: string): ConstructDisplay[] {
  return CONSTRUCT_REGISTRY
    .filter(def => def.level === level)
    .map(createConstructDisplay)
}

/**
 * Get constructs by category
 */
export function getConstructsByCategory(category: string): ConstructDisplay[] {
  return CONSTRUCT_REGISTRY
    .filter(def => (def.categories || []).includes(category))
    .map(createConstructDisplay)
}

/**
 * Get construct by ID
 */
export function getConstructById(id: string): ConstructDisplay | null {
  const definition = CONSTRUCT_REGISTRY.find(def => def.id === id)
  return definition ? createConstructDisplay(definition) : null
}

/**
 * Search constructs
 */
export function searchConstructs(query: string): ConstructDisplay[] {
  const lowerQuery = query.toLowerCase()
  
  return CONSTRUCT_REGISTRY
    .filter(def => 
      def.name.toLowerCase().includes(lowerQuery) ||
      def.description.toLowerCase().includes(lowerQuery) ||
      (def.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (def.categories || []).some(cat => cat.toLowerCase().includes(lowerQuery))
    )
    .map(createConstructDisplay)
}