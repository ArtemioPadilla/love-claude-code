# Construct Level Guidelines

This document defines the characteristics, requirements, and development guidelines for each construct level in the Love Claude Code platform. Following these guidelines ensures consistency and proper abstraction across the construct hierarchy.

## Overview

The construct hierarchy follows a strict layering principle:
- **L0**: Raw primitives with zero abstraction
- **L1**: Configured primitives with security and best practices
- **L2**: Patterns combining multiple L1 constructs
- **L3**: Complete applications built from L2 patterns

Each level can ONLY use constructs from lower levels as dependencies.

---

## L0: Primitive Constructs

### Definition
L0 constructs are the atomic building blocks of the platform. They provide raw functionality with zero opinions, security, or abstractions.

### Characteristics
- **Zero Configuration**: Work immediately with minimal required inputs
- **No Security**: No validation, sanitization, or protection
- **No Styling**: Raw, unstyled components (UI) or configurations (Infrastructure)
- **No Dependencies**: Cannot depend on other constructs
- **Zero Cost**: No infrastructure costs or usage fees
- **Minimal Features**: Only the most basic functionality
- **No Error Handling**: Failures bubble up directly
- **No Logging**: No built-in logging or monitoring

### Development Guidelines

#### UI Primitives
```typescript
// GOOD: Raw display component
export class TextPrimitive extends L0UIConstruct {
  render() {
    return <span>{this.getInput('text')}</span>
  }
}

// BAD: Styled component with features
export class StyledText extends L0UIConstruct {
  render() {
    // ❌ L0 should not have styles or features
    return (
      <span className="styled-text" onClick={this.handleClick}>
        {this.sanitize(this.getInput('text'))}
      </span>
    )
  }
}
```

#### Infrastructure Primitives
```typescript
// GOOD: Raw configuration
export class S3BucketPrimitive extends L0InfrastructureConstruct {
  getConfiguration() {
    return {
      Bucket: this.getInput('bucketName')
    }
  }
}

// BAD: Configuration with policies
export class SecureS3Bucket extends L0InfrastructureConstruct {
  getConfiguration() {
    // ❌ L0 should not include security policies
    return {
      Bucket: this.getInput('bucketName'),
      BucketEncryption: { /* ... */ },
      PublicAccessBlockConfiguration: { /* ... */ }
    }
  }
}
```

### Examples of L0 Constructs
- **UI**: `text-primitive`, `button-primitive`, `input-primitive`
- **Infrastructure**: `docker-container-primitive`, `lambda-function-primitive`, `database-table-primitive`

### Testing Requirements
- Verify zero dependencies
- Confirm no security features
- Ensure minimal functionality
- Check raw output/configuration
- Validate no error handling

---

## L1: Configured Constructs

### Definition
L1 constructs add security, best practices, and basic configuration to L0 primitives. They represent production-ready versions of primitives.

### Characteristics
- **Security First**: Input validation, XSS protection, sanitization
- **Best Practices**: Error handling, logging, monitoring
- **Basic Styling**: Consistent theming and accessibility
- **Configuration**: Sensible defaults with customization options
- **Single L0 Dependency**: Wraps exactly one L0 primitive
- **Type Safety**: Full TypeScript types and validation
- **Error Boundaries**: Graceful error handling
- **Basic Monitoring**: Usage metrics and health checks

### Development Guidelines

#### Security Implementation
```typescript
export class SecureTextInput extends L1UIConstruct {
  private sanitize(input: string): string {
    // Remove script tags, escape HTML, prevent XSS
    return DOMPurify.sanitize(input)
  }

  async onValidate(): Promise<boolean> {
    const value = this.getInput('value')
    
    // Check length limits
    if (value.length > 1000) {
      throw new Error('Input too long')
    }
    
    // Check for malicious patterns
    if (this.containsSQLInjection(value)) {
      throw new Error('Invalid input detected')
    }
    
    return true
  }
}
```

#### Configuration Pattern
```typescript
export class ConfiguredButton extends L1UIConstruct {
  static defaultConfig = {
    theme: 'primary',
    size: 'medium',
    rippleEffect: true,
    accessibility: {
      ariaLabel: true,
      keyboardNav: true
    }
  }

  async onInitialize(): Promise<void> {
    // Merge user config with defaults
    this.config = {
      ...ConfiguredButton.defaultConfig,
      ...this.getInput('config')
    }
  }
}
```

### Examples of L1 Constructs
- **UI**: `secure-text-input`, `themed-button`, `accessible-modal`
- **Infrastructure**: `encrypted-s3-bucket`, `secure-lambda`, `monitored-database`

### Testing Requirements
- Security testing (XSS, injection, etc.)
- Configuration validation
- Error handling verification
- Accessibility compliance
- Performance benchmarks

---

## L2: Pattern Constructs

### Definition
L2 constructs implement common patterns by combining multiple L1 constructs. They represent reusable architectural patterns and workflows.

### Characteristics
- **Multiple L1 Dependencies**: Combines 2+ L1 constructs
- **Pattern Implementation**: Implements design patterns
- **Workflow Orchestration**: Manages interactions between L1s
- **State Management**: Coordinates state across components
- **Integration Logic**: Handles communication between parts
- **Composite Security**: Security from all L1 components
- **Pattern Documentation**: Clear pattern explanation
- **Extensibility**: Hooks for customization

### Development Guidelines

#### Pattern Composition
```typescript
export class FormPattern extends L2UIConstruct {
  private components: {
    inputs: SecureTextInput[]
    submitButton: ThemedButton
    errorDisplay: AccessibleAlert
    validation: FormValidator
  }

  async onInitialize(): Promise<void> {
    // Compose L1 constructs
    this.components.inputs = await this.createInputs()
    this.components.submitButton = await this.createSubmitButton()
    this.components.errorDisplay = await this.createErrorDisplay()
    
    // Wire up interactions
    this.setupValidation()
    this.setupSubmitHandler()
  }

  private setupValidation(): void {
    // Coordinate validation across all inputs
    this.components.inputs.forEach(input => {
      input.on('change', () => this.validateForm())
    })
  }
}
```

#### State Coordination
```typescript
export class IDEWorkspacePattern extends L2UIConstruct {
  private state = {
    activeFile: null,
    editorContent: '',
    terminalOutput: [],
    fileTree: []
  }

  private syncState(): void {
    // Keep all L1 components in sync
    this.components.editor.setValue(this.state.editorContent)
    this.components.fileExplorer.setActiveFile(this.state.activeFile)
    this.components.terminal.setOutput(this.state.terminalOutput)
  }
}
```

### Examples of L2 Constructs
- **UI**: `ide-workspace`, `chat-interface`, `dashboard-layout`
- **Infrastructure**: `microservice-pattern`, `event-driven-api`, `data-pipeline`

### Testing Requirements
- Integration tests between L1 components
- State synchronization tests
- Pattern behavior verification
- Performance under load
- Error propagation testing

---

## L3: Application Constructs

### Definition
L3 constructs are complete, deployable applications built from L2 patterns. They represent full solutions ready for production use.

### Characteristics
- **Complete Applications**: Full functionality, not components
- **Multiple L2 Dependencies**: Combines many patterns
- **Business Logic**: Implements specific use cases
- **Full Configuration**: Environment-specific settings
- **Deployment Ready**: Includes all infrastructure
- **User Facing**: Complete user experiences
- **Multi-Provider**: Supports different cloud providers
- **Self-Contained**: Everything needed to run

### Development Guidelines

#### Application Structure
```typescript
export class LoveClaudeCodePlatform extends L3ApplicationConstruct {
  private frontend: {
    workspace: IDEWorkspacePattern
    chat: ChatInterfacePattern
    projects: ProjectManagementPattern
    settings: SettingsPattern
  }

  private backend: {
    api: RESTAPIPattern
    auth: AuthenticationPattern
    storage: MultiProviderStoragePattern
    realtime: WebSocketPattern
  }

  async onInitialize(): Promise<void> {
    // Initialize all patterns
    await this.initializeFrontend()
    await this.initializeBackend()
    
    // Wire up application logic
    await this.connectFrontendToBackend()
    await this.setupBusinessLogic()
  }

  async deploy(): Promise<void> {
    // Deploy complete application
    const provider = this.getInput('provider')
    
    switch(provider) {
      case 'aws':
        await this.deployToAWS()
        break
      case 'firebase':
        await this.deployToFirebase()
        break
      case 'local':
        await this.deployLocally()
        break
    }
  }
}
```

#### Self-Referential Implementation
```typescript
export class ConstructDevelopmentApp extends L3ApplicationConstruct {
  // This L3 construct is used to build other constructs
  
  async buildConstruct(spec: ConstructSpecification): Promise<BaseConstruct> {
    // Use the platform to build new constructs
    const tddWorkflow = await this.patterns.tddWorkflow.initialize(spec)
    const tests = await tddWorkflow.generateTests()
    const implementation = await this.patterns.codeGeneration.generate(spec, tests)
    
    return this.patterns.constructBuilder.build(implementation)
  }

  getSelfReferentialMetadata() {
    return {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 85,
      canBuildConstructs: true // This L3 builds other constructs!
    }
  }
}
```

### Examples of L3 Constructs
- **Applications**: `love-claude-code-platform`, `construct-marketplace`, `team-workspace`
- **Services**: `complete-api-service`, `analytics-platform`, `deployment-system`

### Testing Requirements
- End-to-end tests
- User journey tests
- Multi-provider deployment tests
- Performance testing
- Security audits
- Accessibility compliance

---

## Cross-Level Guidelines

### Dependency Rules
1. **Strict Hierarchy**: L3 → L2 → L1 → L0 (never skip levels)
2. **No Circular Dependencies**: Lower levels cannot depend on higher levels
3. **Clear Interfaces**: Each level exposes a clear API to the level above

### Naming Conventions
- **L0**: `{feature}-primitive` (e.g., `button-primitive`)
- **L1**: `{adjective}-{feature}` (e.g., `secure-button`)
- **L2**: `{pattern}-pattern` or `{use-case}-system` (e.g., `form-pattern`)
- **L3**: `{application-name}-app` or `{platform-name}-platform`

### Documentation Requirements
Each construct MUST have:
1. **README.md**: Overview and quick start
2. **API.md**: Complete API documentation
3. **EXAMPLES.md**: Usage examples
4. **TESTING.md**: Testing strategies
5. **SECURITY.md**: Security considerations (L1+)

### Version Management
- **L0**: Rarely change (breaking changes affect entire platform)
- **L1**: Careful versioning (security updates, feature additions)
- **L2**: Regular updates (new patterns, improvements)
- **L3**: Frequent updates (business logic, features)

### Performance Guidelines
- **L0**: < 1ms initialization
- **L1**: < 10ms initialization
- **L2**: < 100ms initialization
- **L3**: < 1s initialization

### Certification Requirements
- **L0**: Basic functionality tests
- **L1**: Security audit + functionality tests
- **L2**: Integration tests + pattern compliance
- **L3**: Full certification (security, performance, accessibility)

---

## Development Workflow

### Creating a New Construct

1. **Identify Level**: Determine the appropriate level based on dependencies
2. **Check Existing**: Ensure no duplicate functionality exists
3. **Design API**: Define inputs, outputs, and behavior
4. **Write Tests First**: TDD approach with comprehensive tests
5. **Implement**: Follow level-specific guidelines
6. **Document**: Complete all required documentation
7. **Review**: Architecture and security review
8. **Certify**: Run certification pipeline
9. **Publish**: Add to construct catalog

### Example Development Flow
```bash
# 1. Create construct structure
npm run construct:create -- --name secure-input --level L1

# 2. Write tests
npm run construct:test -- --watch secure-input

# 3. Implement (TDD style)
# ... implement until tests pass ...

# 4. Document
npm run construct:docs -- secure-input

# 5. Certify
npm run construct:certify -- secure-input

# 6. Publish
npm run construct:publish -- secure-input
```

---

## Platform-Specific Guidelines

### Self-Referential Development
When creating constructs that build the platform itself:

1. **Mark as Platform Construct**: Set `isPlatformConstruct: true`
2. **Track Development Method**: Record `vibeCodingPercentage`
3. **Document Build Process**: Explain how it was built
4. **Enable Self-Building**: Set `canBuildConstructs: true` for appropriate L3s

### Vibe-Coding Integration
- **L0**: Always manual (0% vibe-coded)
- **L1**: Mostly manual with some vibe-coding (0-30%)
- **L2**: Significant vibe-coding possible (30-70%)
- **L3**: Heavily vibe-coded (70-95%)

---

## Conclusion

Following these guidelines ensures:
- **Consistency**: All constructs follow the same patterns
- **Maintainability**: Clear separation of concerns
- **Reusability**: Constructs can be easily composed
- **Security**: Proper security at appropriate levels
- **Quality**: High standards across the platform

Remember: The power of the construct system comes from disciplined adherence to these levels. When in doubt, refer back to these guidelines or consult the architecture team.