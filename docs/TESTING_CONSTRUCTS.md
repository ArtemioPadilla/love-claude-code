# Testing Constructs Guide

This guide provides comprehensive documentation for testing constructs in the Love Claude Code platform. Our testing strategy ensures reliability, maintainability, and proper documentation of all platform constructs.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Infrastructure](#test-infrastructure)
3. [Writing Tests for Constructs](#writing-tests-for-constructs)
4. [Testing Patterns by Level](#testing-patterns-by-level)
5. [Best Practices](#best-practices)
6. [Running Tests](#running-tests)
7. [Coverage Requirements](#coverage-requirements)

## Testing Philosophy

Our testing approach for constructs follows these principles:

1. **Comprehensive Coverage**: Every public method and behavior should be tested
2. **Isolation**: Tests should be independent and not rely on external services
3. **Documentation**: Tests serve as living documentation for construct usage
4. **Performance**: Tests should run quickly to encourage frequent execution
5. **Maintainability**: Tests should be easy to understand and update

## Test Infrastructure

### Setup Files

The test infrastructure is located in `frontend/src/test-utils/`:

```typescript
// setupTests.ts - Global test setup
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Mock browser APIs
beforeAll(() => {
  // Window, crypto, WebSocket mocks
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

### Test Utilities

#### ConstructTestHarness

A powerful utility for testing constructs in isolation:

```typescript
import { ConstructTestHarness } from '@test-utils/constructTestUtils'

const harness = new ConstructTestHarness(
  MyConstruct,
  metadata,
  dependencies
)

// Initialize and test
await harness.initialize()
harness.expectEvent('initialized')
```

#### Mock Providers

Pre-configured mocks for React testing:

```typescript
import { renderWithProviders, mockClaudeService } from '@test-utils/mockProviders'

const { getByText } = renderWithProviders(
  <MyComponent />,
  { initialState: { editor: { activeFile: 'test.ts' } } }
)
```

#### Test Factories

Factory functions for creating test data:

```typescript
import { 
  ConstructMetadataFactory,
  GraphDataFactory,
  DockerServiceFactory 
} from '@test-utils/testFactories'

const metadata = ConstructMetadataFactory.createL0UI()
const { nodes, edges } = GraphDataFactory.createFlowGraph(5, 4)
const service = DockerServiceFactory.createWebService()
```

## Writing Tests for Constructs

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MyConstruct } from '../MyConstruct'
import { ConstructTestHarness, createMockMetadata } from '@test-utils/constructTestUtils'

describe('MyConstruct', () => {
  let harness: ConstructTestHarness<MyConstruct>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'my-construct',
      name: 'My Construct',
      level: 'L0',
      category: 'ui'
    })
    harness = new ConstructTestHarness(MyConstruct, metadata)
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      harness.expectEvent('initialized')
    })
  })

  describe('core functionality', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should perform main operation', async () => {
      const result = await harness.construct.doSomething()
      
      expect(result).toBeDefined()
      harness.expectEvent('something:done', { result })
    })
  })

  describe('validation', () => {
    it('should validate successfully', async () => {
      await harness.initialize()
      const result = await harness.construct.validate()
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('disposal', () => {
    it('should clean up resources', async () => {
      await harness.initialize()
      await harness.dispose()
      
      expect(harness.construct.disposed).toBe(true)
      harness.expectEvent('disposed')
    })
  })
})
```

### Testing Event Emissions

```typescript
it('should emit events correctly', async () => {
  // Wait for specific event
  const promise = waitForEvent(harness.construct.eventEmitter, 'data:loaded')
  await harness.construct.loadData()
  
  const eventData = await promise
  expect(eventData).toEqual({ count: 10 })

  // Check event history
  harness.expectEvent('data:loaded', { count: 10 })
  harness.expectNoEvent('data:error')
  
  // Get all events of a type
  const loadEvents = harness.getEventsByName('data:loaded')
  expect(loadEvents).toHaveLength(1)
})
```

### Testing with Dependencies

```typescript
describe('ConstructWithDependencies', () => {
  let mockAuth: any
  let mockDatabase: any

  beforeEach(() => {
    // Create mock dependencies
    mockAuth = {
      verifyToken: vi.fn().mockResolvedValue({ valid: true }),
      initialized: true,
      metadata: createMockMetadata({ id: 'auth-primitive' })
    }

    mockDatabase = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      initialized: true,
      metadata: createMockMetadata({ id: 'db-primitive' })
    }

    harness = new ConstructTestHarness(
      MyConstruct,
      metadata,
      { authPrimitive: mockAuth, dbPrimitive: mockDatabase }
    )
  })

  it('should use dependencies correctly', async () => {
    await harness.initialize()
    await harness.construct.authenticatedQuery('SELECT * FROM users')

    expect(mockAuth.verifyToken).toHaveBeenCalled()
    expect(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM users')
  })
})
```

## Testing Patterns by Level

### L0 Primitives

Focus on core functionality and state management:

```typescript
describe('L0 Primitive Tests', () => {
  it('should maintain internal state correctly', () => {
    const primitive = new StatePrimitive()
    primitive.setState({ value: 42 })
    
    expect(primitive.getState()).toEqual({ value: 42 })
  })

  it('should validate inputs', () => {
    expect(() => primitive.process(null))
      .toThrow('Invalid input')
  })

  it('should emit lifecycle events', async () => {
    await primitive.initialize()
    expectEvent('primitive:initialized')
    
    await primitive.dispose()
    expectEvent('primitive:disposed')
  })
})
```

### L1 Configured Constructs

Test configuration and dependency integration:

```typescript
describe('L1 Configured Construct Tests', () => {
  it('should apply configuration to primitive', async () => {
    const config = { theme: 'dark', size: 'large' }
    const construct = new ConfiguredButton(metadata, { config })
    
    await construct.initialize()
    expect(construct.getConfig()).toEqual(config)
  })

  it('should validate configuration', async () => {
    const invalidConfig = { size: 'invalid' }
    const construct = new ConfiguredButton(metadata, { config: invalidConfig })
    
    const validation = await construct.validate()
    expect(validation.valid).toBe(false)
    expect(validation.errors[0].message).toContain('Invalid size')
  })

  it('should integrate with dependencies', async () => {
    const mockPrimitive = createMockPrimitive()
    const construct = new ConfiguredConstruct(metadata, { 
      primitive: mockPrimitive,
      config: { enabled: true }
    })
    
    await construct.performAction()
    expect(mockPrimitive.execute).toHaveBeenCalledWith({ enabled: true })
  })
})
```

### L2 Pattern Constructs

Test pattern composition and coordination:

```typescript
describe('L2 Pattern Construct Tests', () => {
  it('should coordinate multiple L1 constructs', async () => {
    const pattern = new FormPattern(metadata, {
      inputs: [mockInput1, mockInput2],
      submitButton: mockButton,
      validator: mockValidator
    })
    
    await pattern.initialize()
    await pattern.submit({ field1: 'value1', field2: 'value2' })
    
    expect(mockValidator.validate).toHaveBeenCalled()
    expect(mockButton.click).toHaveBeenCalled()
  })

  it('should handle complex workflows', async () => {
    const workflow = new DataProcessingPattern()
    
    const result = await workflow.process([
      { step: 'fetch', source: 'api' },
      { step: 'transform', format: 'json' },
      { step: 'validate', schema: schema },
      { step: 'store', destination: 'db' }
    ])
    
    expect(result.success).toBe(true)
    expect(result.processed).toBe(4)
  })
})
```

### L3 Application Constructs

Test complete feature integration:

```typescript
describe('L3 Application Construct Tests', () => {
  it('should provide complete feature functionality', async () => {
    const chatApp = new ChatApplication(metadata)
    await chatApp.initialize()
    
    // Test user flow
    const user = await chatApp.authenticate('user@example.com', 'password')
    const room = await chatApp.joinRoom('general')
    const message = await chatApp.sendMessage('Hello, world!')
    
    expect(message.delivered).toBe(true)
    expect(room.messages).toContainEqual(message)
  })

  it('should handle error scenarios gracefully', async () => {
    const app = new ResilientApplication()
    
    // Simulate network failure
    mockNetwork.fail()
    
    const result = await app.performOperation()
    expect(result.fallbackUsed).toBe(true)
    expect(result.error).toBeNull()
  })
})
```

## Best Practices

### 1. Test Organization

```typescript
describe('ConstructName', () => {
  // Group related tests
  describe('initialization', () => {})
  describe('core functionality', () => {})
  describe('error handling', () => {})
  describe('edge cases', () => {})
  describe('validation', () => {})
  describe('disposal', () => {})
})
```

### 2. Mock Management

```typescript
// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

// Create reusable mock factories
function createMockService() {
  return {
    call: vi.fn().mockResolvedValue({ success: true }),
    disconnect: vi.fn()
  }
}
```

### 3. Async Testing

```typescript
// Use async/await for clarity
it('should handle async operations', async () => {
  const result = await construct.asyncOperation()
  expect(result).toBeDefined()
})

// Test async errors
it('should handle async errors', async () => {
  mockService.call.mockRejectedValue(new Error('Network error'))
  
  await expect(construct.performCall())
    .rejects.toThrow('Network error')
})
```

### 4. Performance Testing

```typescript
it('should complete within performance budget', async () => {
  const start = performance.now()
  await construct.processLargeDataset(1000)
  const duration = performance.now() - start
  
  expect(duration).toBeLessThan(100) // 100ms budget
})
```

### 5. Accessibility Testing

```typescript
it('should be accessible', () => {
  const { container } = render(<UIConstruct />)
  
  // Check ARIA attributes
  expect(screen.getByRole('button')).toHaveAttribute('aria-label')
  
  // Check keyboard navigation
  const element = screen.getByRole('button')
  element.focus()
  expect(document.activeElement).toBe(element)
})
```

## Running Tests

### Command Line

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run construct tests only
npm run test:constructs

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### VSCode Integration

Add to `.vscode/settings.json`:

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "testing.automaticTestDiscovery": true
}
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Constructs
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Per-Level Requirements

- **L0 Primitives**: 90%+ coverage (critical infrastructure)
- **L1 Configured**: 85%+ coverage
- **L2 Patterns**: 80%+ coverage
- **L3 Applications**: 75%+ coverage

### Viewing Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

### Coverage Exceptions

Some files may be excluded from coverage:

- Type definition files (`*.d.ts`)
- Test utilities (`test-utils/*`)
- Generated code
- Third-party integrations

## Debugging Tests

### Using VSCode Debugger

1. Set breakpoints in your test files
2. Open the test file
3. Press F5 or use "Debug Test" from the context menu

### Console Debugging

```typescript
it('should debug this test', async () => {
  console.log('Current state:', construct.getState())
  
  // Use debug utility
  const debug = require('debug')('test:construct')
  debug('Detailed info: %O', complexObject)
})
```

### Test Isolation

```typescript
it.only('run only this test', async () => {
  // Isolate a single test for debugging
})

describe.skip('skip this suite', () => {
  // Temporarily skip tests
})
```

## Common Testing Patterns

### Testing Error Boundaries

```typescript
it('should handle errors gracefully', async () => {
  const onError = vi.fn()
  construct.on('error', onError)
  
  await construct.performRiskyOperation()
  
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.any(String),
      code: expect.any(String)
    })
  )
})
```

### Testing Retry Logic

```typescript
it('should retry failed operations', async () => {
  let attempts = 0
  mockService.call.mockImplementation(() => {
    attempts++
    if (attempts < 3) throw new Error('Temporary failure')
    return { success: true }
  })
  
  const result = await construct.callWithRetry()
  
  expect(attempts).toBe(3)
  expect(result.success).toBe(true)
})
```

### Testing State Machines

```typescript
it('should transition states correctly', async () => {
  const fsm = construct.getStateMachine()
  
  expect(fsm.state).toBe('idle')
  
  await construct.start()
  expect(fsm.state).toBe('running')
  
  await construct.pause()
  expect(fsm.state).toBe('paused')
  
  await construct.stop()
  expect(fsm.state).toBe('idle')
})
```

## Contributing Tests

When contributing new constructs:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Meet coverage requirements
4. Add integration tests if needed
5. Document test scenarios
6. Update this guide if introducing new patterns

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

*Remember: Tests are not just about catching bugs—they're about documenting behavior, enabling refactoring, and building confidence in the system.*