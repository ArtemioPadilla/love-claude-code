/**
 * L2 Pattern Constructs
 * Reusable patterns combining multiple L0/L1 constructs
 */

// IDE Workspace
export { IDEWorkspace, createIDEWorkspace, ideWorkspaceDefinition } from './IDEWorkspace'

// Claude Conversation System
export { ClaudeConversationSystem, createClaudeConversationSystem, claudeConversationDefinition } from './ClaudeConversationSystem'

// Project Management System
export { ProjectManagementSystem, createProjectManagementSystem, projectManagementDefinition } from './ProjectManagementSystem'

// Real-Time Collaboration
export { RealTimeCollaboration, createRealTimeCollaboration, realTimeCollaborationDefinition } from './RealTimeCollaboration'

// Deployment Pipeline
export { DeploymentPipeline, createDeploymentPipeline, deploymentPipelineDefinition } from './DeploymentPipeline'

// Microservice Backend
export { MicroserviceBackend, createMicroserviceBackend, microserviceBackendDefinition } from './MicroserviceBackend'

// Static Site Hosting
export { StaticSiteHosting, createStaticSiteHosting, staticSiteHostingDefinition } from './StaticSiteHosting'

// Serverless API Pattern
export { ServerlessAPIPattern, createServerlessAPIPattern, serverlessAPIPatternDefinition } from './ServerlessAPIPattern'

// Multi-Provider Abstraction
export { MultiProviderAbstraction, createMultiProviderAbstraction, multiProviderAbstractionDefinition } from './MultiProviderAbstraction'

// Construct Catalog System
export { ConstructCatalogSystem, createConstructCatalogSystem, constructCatalogSystemDefinition } from './ConstructCatalogSystem'

// Tool Orchestration Pattern
export { 
  ToolOrchestrationPattern,
  ToolOrchestrationPatternComponent as ToolOrchestrationPatternUI,
  default as ToolOrchestrationPatternDefault
} from './ToolOrchestrationPattern'

// MCP Server Pattern
export {
  MCPServerPattern,
  MCPServerPatternLogic,
  mcpServerPatternDefinition
} from './MCPServerPattern'

// MCP Client Pattern
export {
  MCPClientPattern,
  MCPClientPatternLogic,
  mcpClientPatternDefinition
} from './MCPClientPattern'
export type { 
  MCPClientConfig, 
  ConnectionStatus, 
  RequestMetrics 
} from './MCPClientPattern'

// Distributed MCP Pattern
export {
  DistributedMCPPattern,
  DistributedMCPPatternLogic,
  distributedMCPPatternDefinition
} from './DistributedMCPPattern'
export type { 
  DistributedMCPConfig, 
  ServiceNode, 
  ClusterMetrics,
  CircuitBreakerState 
} from './DistributedMCPPattern'

// Visualization Patterns
export { DependencyGraphPattern, createDependencyGraphPattern, dependencyGraphPatternDefinition } from './DependencyGraphPattern'
export type { DependencyGraphConfig } from './DependencyGraphPattern'

export { HierarchyVisualizationPattern, createHierarchyVisualizationPattern, hierarchyVisualizationPatternDefinition } from './HierarchyVisualizationPattern'
export type { HierarchyNode, HierarchyVisualizationConfig } from './HierarchyVisualizationPattern'

export { InteractiveDiagramPattern, createInteractiveDiagramPattern, interactiveDiagramPatternDefinition } from './visualization/InteractiveDiagramPattern'
export type { InteractiveDiagramConfig } from './visualization/InteractiveDiagramPattern'