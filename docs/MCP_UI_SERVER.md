# MCP UI Testing Server Documentation

## Overview

The Love Claude Code MCP UI Testing Server enables programmatic interaction with the application's user interface. This server implements the Model Context Protocol (MCP) to provide tools for inspecting, interacting with, and validating the UI during development and testing.

## Architecture

The MCP server uses Puppeteer to control a browser instance that connects to your local development server. It exposes various tools through the MCP protocol that allow you to:

- Inspect DOM elements and their properties
- Capture screenshots for visual testing
- Interact with UI elements (click, type, navigate)
- Validate layout and styling
- Check element visibility and positioning

## Installation

The MCP UI server is automatically installed when you run:
```bash
make setup
# or
make install
```

## Building

The MCP UI server is automatically built during setup or can be built manually:
```bash
make mcp-ui-build
# or
cd mcp-server && npm run build
```

## Running

### Integrated with Development (Recommended)
```bash
make dev
```
This will start the frontend, backend, and MCP UI server together.

### Standalone Mode
```bash
# Development mode (with auto-reload)
make mcp-ui-dev

# Production mode
make mcp-ui-start
```

## Configuration

The MCP UI server can be configured via environment variables:

```bash
# Target URL (default: http://localhost:3000)
MCP_UI_TARGET_URL=http://localhost:3000

# Run browser in headless mode (default: false)
MCP_UI_HEADLESS=false
```

Add these to your `.env.local` file to customize the behavior.

## Using with Claude Desktop

To use the MCP UI server with Claude Desktop:

1. Ensure the server is running (`make dev` starts it automatically)
2. The MCP configuration is already set up in `mcp.json`
3. Claude Desktop will automatically detect and connect to the MCP server
4. You can then use the UI testing tools in your Claude conversations

Example usage in Claude:
```
"Can you check if the chat panel is visible and properly styled?"
"Take a screenshot of the current application state"
"Click on the settings button and verify the modal opens"
```

## Available Tools

### 1. inspectElement

Inspects a DOM element and returns detailed information.

**Input:**
```json
{
  "selector": "string" // CSS selector
}
```

**Output:**
```json
{
  "tagName": "string",
  "id": "string | null",
  "className": "string | null",
  "textContent": "string | null",
  "attributes": {},
  "position": {
    "x": "number",
    "y": "number",
    "width": "number",
    "height": "number"
  },
  "styles": {
    "display": "string",
    "position": "string",
    "color": "string",
    // ... more styles
  },
  "isVisible": "boolean",
  "children": "number"
}
```

### 2. getPageScreenshot

Captures a screenshot of the current page.

**Input:**
```json
{
  "fullPage": "boolean" // Optional, default false
}
```

**Output:**
```json
{
  "type": "screenshot",
  "fullPage": "boolean",
  "dimensions": {
    "width": "number",
    "height": "number"
  },
  "size": "number",
  "base64": "string" // Base64 encoded image
}
```

### 3. clickElement

Clicks on a specified element.

**Input:**
```json
{
  "selector": "string" // CSS selector
}
```

**Output:**
```json
"Successfully clicked element: [selector]"
```

### 4. typeInElement

Types text into an input element.

**Input:**
```json
{
  "selector": "string", // CSS selector
  "text": "string"      // Text to type
}
```

**Output:**
```json
"Successfully typed \"[text]\" into element: [selector]"
```

### 5. navigateTo

Navigates to a URL or route.

**Input:**
```json
{
  "url": "string" // Full URL or relative path
}
```

**Output:**
```json
"Successfully navigated to: [url]"
```

### 6. checkElementVisible

Checks if an element is visible and its position.

**Input:**
```json
{
  "selector": "string" // CSS selector
}
```

**Output:**
```json
{
  "exists": "boolean",
  "visible": "boolean",
  "inViewport": "boolean",
  "dimensions": {
    "width": "number",
    "height": "number",
    "top": "number",
    "left": "number"
  },
  "styles": {
    "display": "string",
    "visibility": "string",
    "opacity": "string"
  }
}
```

### 7. getComputedStyles

Gets computed CSS styles for an element.

**Input:**
```json
{
  "selector": "string",              // CSS selector
  "properties": ["string"] | null    // Optional array of specific properties
}
```

**Output:**
```json
{
  "property1": "value1",
  "property2": "value2"
  // ... requested properties or all styles
}
```

### 8. validateLayout

Validates the page layout and checks for common issues.

**Input:** None

**Output:**
```json
{
  "viewportDimensions": {
    "width": "number",
    "height": "number"
  },
  "documentDimensions": {
    "width": "number",
    "height": "number"
  },
  "issues": [
    {
      "type": "string",
      "issue": "string",
      // ... additional context
    }
  ]
}
```

## Example Usage

### Testing Responsive Design

```typescript
// Check if chat panel adjusts properly
await inspectElement({ selector: ".chat-panel" })
await navigateTo({ url: "/" })
await checkElementVisible({ selector: ".chat-panel" })

// Test narrow mode
await validateLayout()
```

### Visual Regression Testing

```typescript
// Capture baseline
const baseline = await getPageScreenshot({ fullPage: true })

// Make changes
await clickElement({ selector: "#theme-toggle" })

// Capture after changes
const after = await getPageScreenshot({ fullPage: true })

// Compare screenshots...
```

### Form Testing

```typescript
// Test login flow
await navigateTo({ url: "/login" })
await typeInElement({ selector: "#email", text: "test@example.com" })
await typeInElement({ selector: "#password", text: "password123" })
await clickElement({ selector: "#login-button" })
await checkElementVisible({ selector: ".dashboard" })
```

## Error Handling

All tools return errors in a consistent format:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: [error message]"
  }]
}
```

Common errors:
- Element not found
- Navigation timeout
- Invalid selector
- Page crash

## Best Practices

1. **Wait for Elements**: The tools automatically wait for elements (5s timeout)
2. **Use Specific Selectors**: Prefer IDs and unique classes over generic selectors
3. **Handle Animations**: Tools wait 500ms after interactions for animations
4. **Clean State**: Each test should start from a known state
5. **Error Recovery**: Implement retry logic for flaky operations

## Development Tips

1. Run in non-headless mode during development:
   ```typescript
   this.browser = await puppeteer.launch({ 
     headless: false,
     devtools: true
   })
   ```

2. Add custom tools by:
   - Creating a new file in `src/tools/`
   - Adding the tool definition in `index.ts`
   - Implementing the handler

3. Debug with browser DevTools:
   - Set breakpoints in `page.evaluate()` callbacks
   - Use `debugger` statements
   - Check the browser console

## Troubleshooting

### Browser Won't Launch
- Check if Chrome/Chromium is installed
- Try with `--no-sandbox` flag
- Verify no other instances are running

### Elements Not Found
- Ensure the development server is running
- Check if elements are rendered dynamically
- Increase wait timeout if needed

### Screenshots Are Blank
- Wait for page load with `waitUntil: 'networkidle2'`
- Check if content is rendered client-side
- Verify no CORS issues

## Future Enhancements

- [ ] Record and replay user sessions
- [ ] Performance metrics collection
- [ ] Accessibility testing tools
- [ ] Network request mocking
- [ ] Multi-browser support
- [ ] Parallel test execution
- [ ] Visual diff reporting