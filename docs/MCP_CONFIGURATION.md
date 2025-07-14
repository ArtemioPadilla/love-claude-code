# MCP Configuration Guide

## Overview

Love Claude Code includes two levels of Model Context Protocol (MCP) integration:

1. **Main App MCP Servers** - For developing and managing Love Claude Code itself
2. **User App MCP Support** - For users to add MCP capabilities to their own applications

## Main App MCP Servers

### 1. UI Testing Server (`love-claude-code-ui`)

This server enables programmatic interaction with the Love Claude Code UI for testing and automation.

**Purpose:**
- Test UI components and layouts
- Automate UI workflows
- Capture screenshots for documentation
- Validate user interactions

**Tools Available:**
- `inspectElement` - Inspect DOM elements
- `getPageScreenshot` - Capture screenshots
- `clickElement` - Click on UI elements
- `typeInElement` - Type text into inputs
- `navigateTo` - Navigate to different routes
- `checkElementVisible` - Check element visibility
- `getComputedStyles` - Get CSS styles
- `validateLayout` - Validate page layout

### 2. Provider Management Server (`love-claude-code-providers`)

This server provides intelligent tools for managing backend providers (Local, Firebase, AWS).

**Purpose:**
- Analyze project requirements
- Compare provider capabilities
- Estimate costs
- Plan and execute migrations
- Monitor provider health

**Tools Available:**
- `analyze_project_requirements` - Get provider recommendations
- `list_providers` - List available providers with capabilities
- `get_provider_config` - Get current provider configuration
- `switch_provider` - Switch between providers
- `estimate_costs` - Estimate monthly/yearly costs
- `check_provider_health` - Check provider health status
- `migrate_data` - Plan or execute data migration
- `compare_providers` - Compare providers side-by-side

## Configuration with Claude Desktop

### Basic Setup

1. **Ensure MCP servers are built:**
   ```bash
   make mcp-ui-build
   make mcp-provider-build
   ```

2. **The `mcp.json` file is already configured:**
   ```json
   {
     "mcpServers": {
       "love-claude-code-ui": {
         "command": "node",
         "args": ["mcp-server/dist/index.js"],
         "env": {
           "NODE_ENV": "development",
           "MCP_UI_TARGET_URL": "http://localhost:3000",
           "MCP_UI_HEADLESS": "false"
         }
       },
       "love-claude-code-providers": {
         "command": "node",
         "args": ["backend/dist/mcp/provider-server.js"],
         "env": {
           "NODE_ENV": "development"
         }
       }
     }
   }
   ```

3. **Start development with MCP:**
   ```bash
   make dev  # This now includes the UI MCP server
   ```

4. **Claude Desktop will automatically detect and connect to the MCP servers**

### Advanced Configuration

#### Running MCP Servers Separately

```bash
# Start only UI testing server
make mcp-ui-dev

# Start only provider management server
make mcp-provider

# Start both MCP servers
make mcp-all
```

#### Environment Variables

Configure MCP behavior via `.env.local`:

```bash
# UI Testing Server
MCP_UI_TARGET_URL=http://localhost:3000  # Target app URL
MCP_UI_HEADLESS=false                    # Run browser in headless mode

# Provider Management Server
MCP_PROVIDER_LOG_LEVEL=info              # Logging level
MCP_PROVIDER_CACHE_TTL=3600              # Cache TTL in seconds
```

## Usage Examples

### UI Testing Server

In Claude Desktop, you can use commands like:

```
"Can you check if the chat panel is visible?"
"Take a screenshot of the settings modal"
"Click on the 'New Project' button and verify the form appears"
"Check if the editor has proper syntax highlighting styles"
```

### Provider Management Server

In Claude Desktop, you can ask:

```
"What's the best provider for a startup with 10,000 users?"
"Compare Firebase and AWS for my e-commerce project"
"Estimate the monthly costs for running on each provider"
"Create a migration plan from Firebase to AWS"
"Check the health status of my current providers"
```

## User App MCP Support

### Overview

Love Claude Code allows users to add MCP capabilities to their own applications. This enables their apps to be controlled and tested through Claude Desktop.

### Creating MCP for User Apps

1. **During Project Creation:**
   - When creating a new project, users can opt to include MCP support
   - A basic MCP server scaffold will be added to their project

2. **MCP Templates:**
   - Pre-built templates for common use cases
   - Customizable tools for specific app needs
   - Integration with the app's existing API

3. **Configuration:**
   - Each user project gets its own `mcp.json`
   - Tools are project-specific
   - Can be tested within Love Claude Code

### Example User App MCP Structure

```
user-project/
├── mcp/
│   ├── server.js         # MCP server implementation
│   ├── tools/            # Custom tools
│   │   ├── auth.js       # Authentication tools
│   │   ├── data.js       # Data manipulation tools
│   │   └── ui.js         # UI interaction tools
│   └── config.json       # MCP configuration
└── mcp.json              # Claude Desktop configuration
```

### User App MCP Tools Examples

```javascript
// Example tool for user's e-commerce app
{
  name: 'add_product_to_cart',
  description: 'Add a product to the shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      quantity: { type: 'number' }
    }
  }
}

// Example tool for user's blog app
{
  name: 'create_blog_post',
  description: 'Create a new blog post',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      content: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } }
    }
  }
}
```

## Troubleshooting

### MCP Servers Not Starting

1. **Check if servers are built:**
   ```bash
   ls mcp-server/dist/        # Should contain index.js
   ls backend/dist/mcp/       # Should contain provider-server.js
   ```

2. **Rebuild if necessary:**
   ```bash
   make mcp-ui-build
   make mcp-provider-build
   ```

3. **Check logs:**
   - UI Server logs appear in the terminal
   - Provider server logs are in `backend/logs/`

### Claude Desktop Not Detecting Servers

1. **Verify mcp.json location:**
   - Must be in the project root
   - Must be valid JSON

2. **Check server paths:**
   - Paths in mcp.json must be relative to project root
   - Built files must exist at specified paths

3. **Restart Claude Desktop:**
   - Sometimes requires restart to detect new configurations

### Tools Not Working

1. **For UI Testing Server:**
   - Ensure the dev server is running on port 3000
   - Check browser permissions
   - Try with `MCP_UI_HEADLESS=false` to see what's happening

2. **For Provider Server:**
   - Ensure backend is running
   - Check provider credentials in settings
   - Verify database connection

## Best Practices

1. **Development Workflow:**
   - Use `make dev` for integrated development
   - Use `make mcp-all` for focused MCP work
   - Keep MCP servers updated with `make setup`

2. **Testing:**
   - Test MCP tools regularly
   - Use `make mcp-test` for automated tests
   - Document custom tools thoroughly

3. **Security:**
   - Never expose MCP servers to the internet
   - Use environment variables for sensitive data
   - Limit tool permissions appropriately

## Future Enhancements

- Visual MCP tool builder in the UI
- MCP marketplace for sharing tools
- Automated MCP testing framework
- Multi-language MCP support
- Cloud-hosted MCP servers for user apps