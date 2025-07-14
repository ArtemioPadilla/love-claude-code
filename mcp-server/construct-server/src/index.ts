import { McpServer } from '@anthropic/mcp'
import { ConstructCatalogServer } from './server.js'

/**
 * MCP Construct Server
 * 
 * Provides tools for construct discovery, composition, and management
 * through the Model Context Protocol
 */
async function main() {
  const server = new ConstructCatalogServer()
  
  // Register with MCP
  const mcp = new McpServer({
    name: 'construct-catalog',
    version: '1.0.0',
    description: 'Multi-cloud construct catalog for Love Claude Code',
  })
  
  // Register tools
  mcp.registerTool({
    name: 'searchConstructs',
    description: 'Search for constructs in the catalog',
    parameters: server.getSearchConstructsSchema(),
    handler: server.searchConstructs.bind(server),
  })
  
  mcp.registerTool({
    name: 'getConstructDetails',
    description: 'Get detailed information about a specific construct',
    parameters: server.getConstructDetailsSchema(),
    handler: server.getConstructDetails.bind(server),
  })
  
  mcp.registerTool({
    name: 'composeConstructs',
    description: 'Create a composition from multiple constructs',
    parameters: server.getComposeConstructsSchema(),
    handler: server.composeConstructs.bind(server),
  })
  
  mcp.registerTool({
    name: 'validateComposition',
    description: 'Validate a construct composition',
    parameters: server.getValidateCompositionSchema(),
    handler: server.validateComposition.bind(server),
  })
  
  mcp.registerTool({
    name: 'estimateCosts',
    description: 'Estimate costs for a construct or composition',
    parameters: server.getEstimateCostsSchema(),
    handler: server.estimateCosts.bind(server),
  })
  
  mcp.registerTool({
    name: 'generateDiagram',
    description: 'Generate C4 diagram for a composition',
    parameters: server.getGenerateDiagramSchema(),
    handler: server.generateDiagram.bind(server),
  })
  
  mcp.registerTool({
    name: 'getSecurityRecommendations',
    description: 'Get security recommendations for constructs',
    parameters: server.getSecurityRecommendationsSchema(),
    handler: server.getSecurityRecommendations.bind(server),
  })
  
  mcp.registerTool({
    name: 'createConstructFromCode',
    description: 'Create a new construct from existing code',
    parameters: server.getCreateConstructFromCodeSchema(),
    handler: server.createConstructFromCode.bind(server),
  })
  
  // Start server
  await mcp.start()
  console.log('MCP Construct Server started successfully')
}

main().catch((error) => {
  console.error('Failed to start MCP Construct Server:', error)
  process.exit(1)
})