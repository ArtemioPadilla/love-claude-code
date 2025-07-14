# Testing Guide

## Overview

Love Claude Code follows a comprehensive testing strategy to ensure code quality, reliability, and maintainability. We use different types of tests at various levels of the application stack.

## Testing Philosophy

- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
- **Clear Test Names**: Test names should describe what is being tested and expected outcome
- **Isolated Tests**: Each test should be independent and not rely on others
- **Fast Feedback**: Tests should run quickly to encourage frequent execution
- **Meaningful Coverage**: Aim for quality over quantity in test coverage

## Test Types

### 1. Unit Tests
Test individual functions, components, and modules in isolation.

**When to use**: 
- Testing pure functions
- Testing React components
- Testing utility functions
- Testing service methods

**Tools**: Jest, React Testing Library

### 2. Integration Tests
Test how different parts of the system work together.

**When to use**:
- Testing API endpoints
- Testing database operations
- Testing provider implementations
- Testing complex workflows

**Tools**: Jest, Supertest, MSW (Mock Service Worker)

### 3. End-to-End (E2E) Tests
Test complete user scenarios from the UI perspective.

**When to use**:
- Testing critical user paths
- Testing complex UI interactions
- Testing cross-browser compatibility
- Regression testing

**Tools**: Playwright, Cypress (optional)

### 4. Performance Tests
Test application performance and resource usage.

**When to use**:
- Testing page load times
- Testing API response times
- Testing memory usage
- Testing bundle sizes

**Tools**: Lighthouse, Jest Performance

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Chat.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### Test Scripts by Package

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# MCP server tests
cd mcp-server && npm test

# E2E tests
npm run test:e2e
```

## Writing Tests

### Unit Test Example (React Component)

```typescript
// frontend/src/components/Chat/Chat.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chat } from './Chat'
import { useChatStore } from '@/stores/chatStore'

// Mock the store
jest.mock('@/stores/chatStore')

describe('Chat Component', () => {
  const mockSendMessage = jest.fn()
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Setup default mock implementation
    (useChatStore as jest.Mock).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      isLoading: false
    })
  })
  
  it('should render chat interface', () => {
    render(<Chat />)
    
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })
  
  it('should send message when form is submitted', async () => {
    const user = userEvent.setup()
    render(<Chat />)
    
    const input = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    // Type message
    await user.type(input, 'Hello Claude!')
    
    // Submit form
    await user.click(sendButton)
    
    // Verify message was sent
    expect(mockSendMessage).toHaveBeenCalledWith('Hello Claude!')
    expect(input).toHaveValue('')
  })
  
  it('should show loading state', () => {
    (useChatStore as jest.Mock).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      isLoading: true
    })
    
    render(<Chat />)
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })
})
```

### Integration Test Example (API Endpoint)

```typescript
// backend/src/api/projects.test.ts
import request from 'supertest'
import { app } from '../app'
import { getProvider } from '../providers/factory'
import { mockUser, mockProject } from '../test/fixtures'

jest.mock('../providers/factory')

describe('Projects API', () => {
  let authToken: string
  
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase()
    
    // Create test user and get auth token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: mockUser.email, password: 'password' })
    
    authToken = response.body.token
  })
  
  afterAll(async () => {
    await cleanupTestDatabase()
  })
  
  describe('GET /api/v1/projects', () => {
    it('should return user projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
      
      expect(response.body).toEqual({
        projects: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            createdAt: expect.any(String)
          })
        ])
      })
    })
    
    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/v1/projects')
        .expect(401)
    })
  })
  
  describe('POST /api/v1/projects', () => {
    it('should create new project', async () => {
      const newProject = {
        name: 'Test Project',
        description: 'Test description',
        provider: 'local'
      }
      
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject)
        .expect(201)
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...newProject,
        userId: mockUser.id
      })
    })
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
      
      expect(response.body.errors).toContain('name is required')
    })
  })
})
```

### E2E Test Example

```typescript
// e2e/create-project.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Create Project Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/projects')
  })
  
  test('should create new project with MCP enabled', async ({ page }) => {
    // Click create project button
    await page.click('button:has-text("Create Project")')
    
    // Fill project details
    await page.fill('[name="projectName"]', 'E2E Test Project')
    await page.fill('[name="description"]', 'Created by E2E test')
    
    // Enable MCP
    await page.check('input[name="enableMCP"]')
    
    // Submit form
    await page.click('button:has-text("Create")')
    
    // Verify redirect to editor
    await expect(page).toHaveURL(/\/editor\/.*/)
    
    // Verify project name in header
    await expect(page.locator('header')).toContainText('E2E Test Project')
    
    // Verify MCP indicator
    await expect(page.locator('[data-testid="mcp-indicator"]')).toBeVisible()
  })
  
  test('should handle validation errors', async ({ page }) => {
    await page.click('button:has-text("Create Project")')
    
    // Try to submit without name
    await page.click('button:has-text("Create")')
    
    // Verify error message
    await expect(page.locator('.error-message')).toContainText('Project name is required')
    
    // Form should still be visible
    await expect(page.locator('form')).toBeVisible()
  })
})
```

## Testing Best Practices

### 1. Test Structure

Follow the AAA pattern:
```typescript
test('should calculate total price correctly', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ]
  
  // Act
  const total = calculateTotal(items)
  
  // Assert
  expect(total).toBe(35)
})
```

### 2. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('@/services/api', () => ({
  fetchProjects: jest.fn().mockResolvedValue([
    { id: '1', name: 'Test Project' }
  ])
}))

// Mock timers
jest.useFakeTimers()

// Mock environment variables
process.env.API_URL = 'http://test.api'
```

### 3. Test Data Factories

```typescript
// test/factories/user.ts
export const createUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  ...overrides
})

// Usage in tests
const user = createUser({ name: 'Custom Name' })
```

### 4. Async Testing

```typescript
// Testing promises
test('should fetch data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// Testing callbacks
test('should call callback', (done) => {
  processData((result) => {
    expect(result).toBe('processed')
    done()
  })
})

// Testing with waitFor
test('should update UI', async () => {
  render(<Component />)
  
  fireEvent.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

### 5. Testing Error Cases

```typescript
test('should handle API errors gracefully', async () => {
  // Mock API to throw error
  fetchProjects.mockRejectedValueOnce(new Error('Network error'))
  
  render(<ProjectList />)
  
  await waitFor(() => {
    expect(screen.getByText(/error loading projects/i)).toBeInTheDocument()
  })
})
```

## Test Coverage

### Coverage Goals

- **Overall**: 80% minimum
- **Critical paths**: 95% minimum
- **New code**: 90% minimum

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Debugging Tests

### VS Code Debugging

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--watchAll=false"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Common Debugging Techniques

```typescript
// Add console logs
test('debugging test', () => {
  const result = complexFunction()
  console.log('Result:', result)
  expect(result).toBe(expected)
})

// Use debugger
test('debugging with breakpoint', () => {
  debugger // Breakpoint here
  const result = complexFunction()
  expect(result).toBe(expected)
})

// Increase timeout for slow tests
test('slow operation', async () => {
  const result = await slowOperation()
  expect(result).toBeDefined()
}, 10000) // 10 second timeout
```

## Testing Checklist

Before submitting a PR, ensure:

- [ ] All tests pass locally
- [ ] New features have corresponding tests
- [ ] Test coverage meets minimum requirements
- [ ] No console.log statements in tests
- [ ] Tests follow naming conventions
- [ ] Mocks are properly cleaned up
- [ ] No hardcoded test data that might break
- [ ] E2E tests pass for critical paths
- [ ] Performance benchmarks are met

## Common Testing Patterns

### Testing Hooks

```typescript
// Testing custom hooks
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

test('should increment counter', () => {
  const { result } = renderHook(() => useCounter())
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

### Testing Context Providers

```typescript
// Helper to wrap components with providers
const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  return render(
    <ThemeProvider>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </ThemeProvider>,
    options
  )
}

test('component with context', () => {
  renderWithProviders(<MyComponent />)
  // Test component that uses context
})
```

### Testing WebSocket Connections

```typescript
// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  
  send(data: string) {
    // Mock implementation
  }
  
  close() {
    // Mock implementation
  }
}

global.WebSocket = MockWebSocket as any

test('should handle WebSocket messages', () => {
  // Test WebSocket functionality
})
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Getting Help

If you need help with testing:

1. Check existing tests for examples
2. Ask in the #testing channel on Discord
3. Review the Jest/RTL documentation
4. Create an issue with the `testing` label