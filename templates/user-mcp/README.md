# MCP Server for {{ProjectName}}

This MCP (Model Context Protocol) server enables Claude Desktop to interact with your {{ProjectName}} application.

## Features

- **Authentication Tools**: Login, logout, session management
- **Data Tools**: CRUD operations on your application data
- **UI Tools**: Navigation, state management, action triggering

## Setup

1. Install dependencies:
   ```bash
   cd mcp
   npm install
   ```

2. Build the server:
   ```bash
   npm run build
   ```

3. The server is automatically configured in `mcp.json` for Claude Desktop

## Development

Run the server in development mode:
```bash
npm run dev
```

## Adding Custom Tools

1. Create a new tool in `src/tools/` or add to existing files
2. Export the tool definition and execution function
3. Import and add to the server's tool list in `src/server.ts`

### Example Custom Tool

```typescript
// In src/tools/custom.ts
export const customTools: Tool[] = [
  {
    name: 'custom_action',
    description: 'Perform a custom action',
    inputSchema: {
      type: 'object',
      properties: {
        param: { type: 'string' }
      },
      required: ['param']
    }
  }
]

export async function executeCustomTool(name: string, args: any) {
  switch (name) {
    case 'custom_action':
      // Your implementation here
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ result: 'success' })
        }]
      }
  }
}
```

## Integration with Your App

The MCP server needs to connect to your application's API or services. Update the tool implementations in:
- `src/tools/auth.ts` - Connect to your auth system
- `src/tools/data.ts` - Connect to your database/API
- `src/tools/ui.ts` - Connect to your UI state management

## Usage in Claude Desktop

Once configured, you can use natural language to interact with your app:

```
"Log in as user@example.com"
"Create a new blog post titled 'My First Post'"
"Navigate to the settings page"
"Show me all users in the database"
```

## Security

- Never expose this server to the internet
- Use environment variables for sensitive data
- Implement proper authentication in production
- Limit tool permissions based on user roles

## Troubleshooting

1. **Server not starting**: Check that all dependencies are installed
2. **Tools not working**: Verify your app's API is running
3. **Claude not detecting**: Ensure mcp.json is in the project root