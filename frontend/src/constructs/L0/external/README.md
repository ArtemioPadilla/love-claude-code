# L0 External Integration Primitives

This directory contains L0 primitive constructs for representing external resources like NPM packages, Docker containers, and other integrations. These are zero-dependency primitives that provide data structures and validation logic for external resources.

## Overview

External integration primitives are foundational building blocks that:
- Parse and validate external resource definitions
- Provide standardized data structures
- Enable higher-level constructs to work with external resources
- Have zero external dependencies
- Do NOT execute or interact with actual external resources

## Available Primitives

### 1. NPM Package Primitive (`NpmPackagePrimitive`)

Represents NPM packages with full metadata parsing and dependency tree management.

**Features:**
- Package.json parsing and validation
- Dependency tree representation (all types)
- Semver version range parsing and resolution
- Package name validation following NPM rules
- Scoped package support

**Usage:**
```typescript
import { NpmPackagePrimitiveConstruct } from './NpmPackagePrimitive'

const npmPackage = new NpmPackagePrimitiveConstruct()

// Parse package.json
const tree = npmPackage.parseDefinition({
  name: "my-app",
  version: "1.0.0",
  dependencies: {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
})

// Validate configuration
const validation = npmPackage.validateConfiguration(tree)

// Parse and check version ranges
const range = npmPackage.parseVersionRange('^18.2.0')
const satisfies = npmPackage.resolveVersionRange('18.3.1', range) // true
```

### 2. Docker Service Primitive (`DockerServicePrimitive`)

Represents Docker containers and services with comprehensive configuration support.

**Features:**
- Docker Compose YAML parsing
- Dockerfile instruction parsing
- Port mapping configuration
- Volume mount definitions
- Environment variable handling
- Network configuration
- Resource limits and constraints
- Multi-stage Dockerfile support

**Usage:**
```typescript
import { DockerServicePrimitiveConstruct } from './DockerServicePrimitive'

const docker = new DockerServicePrimitiveConstruct()

// Parse Docker Compose configuration
const config = docker.parseDefinition({
  version: '3.8',
  services: {
    web: {
      image: 'nginx:alpine',
      ports: ['80:80'],
      volumes: ['./html:/usr/share/nginx/html:ro']
    }
  }
})

// Parse Dockerfile
const stages = docker.parseDockerfile(`
  FROM node:18 AS builder
  WORKDIR /app
  COPY . .
  RUN npm run build
  
  FROM node:18-alpine
  COPY --from=builder /app/dist ./dist
  CMD ["node", "dist/index.js"]
`)

// Generate Compose entry
const yaml = docker.generateComposeEntry({
  image: { name: 'myapp', tag: 'latest' },
  ports: [{ host: 8080, container: 80 }],
  environment: { NODE_ENV: 'production' }
})
```

## React Components

Both primitives include React components for visualization:

```tsx
import { NpmPackagePrimitive } from './NpmPackagePrimitive'
import { DockerServicePrimitive } from './DockerServicePrimitive'

// NPM Package visualization
<NpmPackagePrimitive
  config={{ packageJson: packageData }}
  onParse={(tree) => console.log('Parsed:', tree)}
  onValidate={(result) => console.log('Valid:', result.valid)}
  showVisualization={true}
/>

// Docker Service visualization
<DockerServicePrimitive
  config={{ 
    dockerCompose: composeYaml,
    dockerfile: dockerfileContent 
  }}
  onParse={(result) => console.log('Parsed:', result)}
  showVisualization={true}
/>
```

## Type Definitions

### NPM Package Types
- `NpmPackageMetadata` - Package metadata (name, version, description, etc.)
- `NpmDependency` - Individual dependency information
- `NpmPackageTree` - Complete package structure with all dependencies
- `SemverRange` - Parsed semver version range

### Docker Service Types
- `DockerImage` - Docker image reference
- `DockerPort` - Port mapping configuration
- `DockerVolume` - Volume mount configuration
- `DockerEnvironment` - Environment variables
- `DockerServiceConfig` - Complete service configuration
- `DockerComposeConfig` - Full compose file structure
- `DockerfileStage` - Parsed Dockerfile stage

## Best Practices

1. **Validation First**: Always validate external configurations before using them
2. **Error Handling**: Handle parsing errors gracefully
3. **No Side Effects**: These primitives should never execute external commands
4. **Memory Efficiency**: Be mindful of large dependency trees or configurations
5. **Type Safety**: Use the provided TypeScript types for better IDE support

## Integration with Higher-Level Constructs

These L0 primitives are designed to be used by higher-level constructs:

- **L1 Constructs** can add validation, security, and configuration management
- **L2 Patterns** can compose multiple external resources into workflows
- **L3 Applications** can orchestrate complete external integrations

Example L1 usage:
```typescript
// L1: Validated NPM Package with security scanning
class ValidatedNpmPackage extends L1Construct {
  private npmPrimitive: NpmPackagePrimitiveConstruct
  
  async initialize(packageJson: any) {
    this.npmPrimitive = new NpmPackagePrimitiveConstruct()
    const tree = this.npmPrimitive.parseDefinition(packageJson)
    
    // Add security scanning
    await this.scanDependencies(tree)
    
    // Add license validation
    await this.validateLicenses(tree)
  }
}
```

## Testing

Both primitives include comprehensive test suites:
- `__tests__/NpmPackagePrimitive.test.tsx`
- `__tests__/DockerServicePrimitive.test.tsx`

Run tests:
```bash
npm test -- NpmPackagePrimitive
npm test -- DockerServicePrimitive
```

## Future Primitives

Planned external integration primitives:
- GitRepositoryPrimitive - Git repository metadata
- APIEndpointPrimitive - REST/GraphQL API definitions
- DatabaseSchemaPrimitive - Database schema representation
- CloudResourcePrimitive - Cloud resource configurations