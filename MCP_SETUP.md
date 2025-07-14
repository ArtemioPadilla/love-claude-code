# MCP Setup for Love Claude Code

This guide covers setup for both Claude Desktop and Claude Code CLI.

## Quick Start with Claude Desktop

1. **Copy the configuration file:**
   ```bash
   cp claude_desktop_config_example.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Update the paths in the config file:**
   - Replace `/Users/artemiopadilla/Documents/repos/GitHub/personal/love-claude-code` with your actual project path
   - Make sure both MCP servers are built: `npm run build`

3. **Restart Claude Desktop** to load the MCP servers

4. **Test the integration:**
   - In Claude Desktop, ask Claude to use the UI testing tools
   - Example: "Can you take a screenshot of the Love Claude Code app?"
   - Example: "Can you compare the available backend providers?"

## Available MCP Tools

### UI Testing Server (`love-claude-code-ui`)
- `getPageScreenshot` - Capture screenshots
- `inspectElement` - Inspect DOM elements
- `validateLayout` - Validate UI layout
- `clickElement` - Click on elements
- `typeInElement` - Type text into inputs
- `waitForElement` - Wait for elements to appear

### Provider Management Server (`love-claude-code-providers`)
- `analyze_project_requirements` - Analyze project needs
- `list_providers` - List available providers
- `compare_providers` - Compare provider features
- `estimate_costs` - Estimate provider costs
- `check_provider_health` - Check provider status
- `switch_provider` - Switch between providers
- `migrate_data` - Migrate data between providers

## Testing from the Web UI

1. **Start the development server:**
   ```bash
   make dev
   ```

2. **Open the Settings modal** (gear icon in the top right)

3. **Go to the "MCP Test" tab**

4. **Click the test buttons** to verify MCP functionality

## Troubleshooting

- If MCP servers don't start, check that dependencies are installed:
  ```bash
  cd mcp-server && npm install && npm run build
  cd ../backend && npm install && npm run build
  ```

- Check logs in Claude Desktop's Developer Console

- Ensure your token is valid when testing from the web UI

## Setup for Claude Code CLI

The MCP servers are configured via `.mcp.json` in the project root. This file has already been created with the correct configuration.

### Verifying MCP Setup in Claude Code

1. **Check configured servers:**
   ```bash
   claude mcp list
   ```
   
   Note: If no servers appear, Claude Code may be caching the configuration. Try restarting your Claude Code session.

2. **The servers are configured to start when you use MCP tools:**
   - The UI testing server provides DOM inspection and screenshot capabilities
   - The provider management server helps with backend provider selection

3. **Using MCP in Claude Code:**
   Simply ask Claude to use the MCP tools in your conversation:
   - "Take a screenshot of the current app state"
   - "Compare the available backend providers"
   - "Check the health of all providers"

## For Development

To add new MCP tools:

1. **UI Testing Server:** Edit `mcp-server/src/tools/`
2. **Provider Server:** Edit `backend/src/mcp/tools/`
3. Rebuild the server: `npm run build`
4. Restart Claude Desktop