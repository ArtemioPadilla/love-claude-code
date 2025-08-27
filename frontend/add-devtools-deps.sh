#!/bin/bash
# Script to add development tools dependencies

echo "Adding development tools dependencies..."

# Add runtime dependencies
npm install --save \
  prom-client@^15.1.0 \
  prettier@^3.2.4 \
  @types/dompurify@^3.0.5

# Add dev dependencies for ESLint browser support
npm install --save-dev \
  eslint-plugin-react@^7.33.2 \
  eslint-plugin-jest@^27.6.3 \
  prettier-plugin-tailwindcss@^0.5.11

# Add Monaco editor language support if not already present
npm install --save \
  monaco-editor@^0.45.0

echo "Dependencies added successfully!"
echo "Please run 'npm install' to ensure all peer dependencies are resolved."