#!/bin/bash

# Test runner script for Love Claude Code constructs
# This script provides various test execution options with helpful output

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Print usage
usage() {
    print_color "$BLUE" "Love Claude Code - Construct Test Runner"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  all          Run all tests"
    echo "  l0           Run L0 primitive tests"
    echo "  l1           Run L1 configured construct tests"
    echo "  l2           Run L2 pattern tests"
    echo "  l3           Run L3 application tests"
    echo "  coverage     Run tests with coverage report"
    echo "  watch        Run tests in watch mode"
    echo "  ui           Run tests with UI"
    echo "  specific     Run specific test file (provide path)"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 l0"
    echo "  $0 coverage"
    echo "  $0 specific src/constructs/L0/ui/__tests__/GraphPrimitive.test.tsx"
}

# Change to frontend directory
cd "$(dirname "$0")/../frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_color "$YELLOW" "Installing dependencies..."
    npm install
fi

# Main script logic
case "$1" in
    all)
        print_color "$BLUE" "Running all construct tests..."
        npm test src/constructs
        ;;
    
    l0)
        print_color "$BLUE" "Running L0 primitive tests..."
        npm test src/constructs/L0
        ;;
    
    l1)
        print_color "$BLUE" "Running L1 configured construct tests..."
        npm test src/constructs/L1
        ;;
    
    l2)
        print_color "$BLUE" "Running L2 pattern tests..."
        npm test src/constructs/L2
        ;;
    
    l3)
        print_color "$BLUE" "Running L3 application tests..."
        npm test src/constructs/L3
        ;;
    
    coverage)
        print_color "$BLUE" "Running tests with coverage..."
        npm run test:coverage -- src/constructs
        
        # Check if coverage report was generated
        if [ -f "coverage/index.html" ]; then
            print_color "$GREEN" "Coverage report generated!"
            echo "Open coverage/index.html to view the report"
            
            # Try to open in browser (works on macOS)
            if command -v open &> /dev/null; then
                open coverage/index.html
            fi
        fi
        ;;
    
    watch)
        print_color "$BLUE" "Running tests in watch mode..."
        npm run test:watch -- src/constructs
        ;;
    
    ui)
        print_color "$BLUE" "Running tests with UI..."
        npm run test:ui -- src/constructs
        ;;
    
    specific)
        if [ -z "$2" ]; then
            print_color "$RED" "Error: Please provide a test file path"
            echo "Example: $0 specific src/constructs/L0/ui/__tests__/GraphPrimitive.test.tsx"
            exit 1
        fi
        
        print_color "$BLUE" "Running specific test: $2"
        npm test "$2"
        ;;
    
    help|--help|-h)
        usage
        exit 0
        ;;
    
    *)
        print_color "$RED" "Invalid option: $1"
        echo ""
        usage
        exit 1
        ;;
esac

# Check test results
if [ $? -eq 0 ]; then
    print_color "$GREEN" "✓ Tests completed successfully!"
else
    print_color "$RED" "✗ Tests failed!"
    exit 1
fi