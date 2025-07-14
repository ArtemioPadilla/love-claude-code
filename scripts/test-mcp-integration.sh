#!/bin/bash

# Test script to verify MCP UI server integration

echo "Testing MCP UI Server Integration..."

# Check if MCP server directory exists
if [ ! -d "mcp-server" ]; then
    echo "❌ MCP server directory not found"
    exit 1
fi

# Check if MCP server is built
if [ ! -d "mcp-server/dist" ]; then
    echo "⚠️  MCP server not built, building now..."
    cd mcp-server && npm run build
    cd ..
fi

# Check if package.json has MCP scripts
if grep -q "mcp-ui:dev" package.json; then
    echo "✅ MCP scripts found in package.json"
else
    echo "❌ MCP scripts missing from package.json"
    exit 1
fi

# Check if Makefile has MCP targets
if grep -q "mcp-ui-build" Makefile; then
    echo "✅ MCP targets found in Makefile"
else
    echo "❌ MCP targets missing from Makefile"
    exit 1
fi

# Check MCP configuration file
if [ -f "mcp.json" ]; then
    echo "✅ MCP configuration file exists"
else
    echo "❌ MCP configuration file missing"
    exit 1
fi

echo ""
echo "✨ MCP UI Server integration is ready!"
echo ""
echo "To start development with MCP UI server:"
echo "  make dev"
echo ""
echo "To run MCP UI server standalone:"
echo "  make mcp-ui-dev"
echo ""