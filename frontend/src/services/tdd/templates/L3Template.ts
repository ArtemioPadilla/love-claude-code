/**
 * L3 Application Test Templates
 * Test templates for complete L3 application constructs
 */

export const L3_APPLICATION_TEMPLATE = `import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { {{applicationName}} } from '../{{applicationName}}'
import type { {{applicationName}}Config } from '../{{applicationName}}'
import { 
  createTestEnvironment, 
  TestEnvironment,
  mockExternalServices 
} from '../../test-utils/e2e'

describe('{{applicationName}} - L3 Application', () => {
  let app: {{applicationName}}
  let env: TestEnvironment
  let user: ReturnType<typeof userEvent.setup>
  
  const config: {{applicationName}}Config = {
    {{configContent}}
  }

  beforeAll(async () => {
    env = await createTestEnvironment()
    mockExternalServices()
  })

  afterAll(async () => {
    await env.teardown()
  })

  beforeEach(async () => {
    user = userEvent.setup()
    app = new {{applicationName}}(config)
    await app.initialize(env)
  })

  afterEach(async () => {
    await app?.shutdown()
    vi.clearAllMocks()
  })

  describe('Application Lifecycle', () => {
    it('should boot successfully with all services', async () => {
      const status = await app.getBootStatus()
      
      expect(status).toMatchObject({
        phase: 'ready',
        services: {
          frontend: 'healthy',
          backend: 'healthy',
          database: 'healthy',
          cache: 'healthy'
        },
        bootTime: expect.any(Number)
      })
      
      expect(status.bootTime).toBeLessThan(5000) // 5 second boot time
    })

    it('should handle graceful shutdown', async () => {
      const shutdownSpy = vi.fn()
      app.on('shutdown', shutdownSpy)
      
      await app.shutdown()
      
      expect(shutdownSpy).toHaveBeenCalledWith({
        cleanShutdown: true,
        resourcesCleaned: true,
        connectionsClosded: true
      })
    })

    it('should recover from crashes', async () => {
      // Simulate crash
      await env.crashService('backend')
      
      // App should detect and recover
      await waitFor(() => {
        expect(app.getServiceStatus('backend')).toBe('recovering')
      })
      
      await waitFor(() => {
        expect(app.getServiceStatus('backend')).toBe('healthy')
      }, { timeout: 10000 })
    })
  })

  describe('User Workflows', () => {
    {{userWorkflowTests}}
  })

  describe('Multi-Component Integration', () => {
    it('should coordinate all L2 patterns', async () => {
      const { container } = render(<{{applicationName}}UI app={app} />)
      
      // Verify all major components are rendered
      expect(screen.getByTestId('ide-workspace')).toBeInTheDocument()
      expect(screen.getByTestId('claude-chat')).toBeInTheDocument()
      expect(screen.getByTestId('project-manager')).toBeInTheDocument()
      expect(screen.getByTestId('deployment-pipeline')).toBeInTheDocument()
    })

    it('should handle cross-component communication', async () => {
      render(<{{applicationName}}UI app={app} />)
      
      // Action in one component
      await user.type(
        screen.getByTestId('code-editor'),
        'function hello() { return "world"; }'
      )
      
      // Should reflect in other components
      await waitFor(() => {
        // File explorer should show unsaved indicator
        expect(screen.getByTestId('file-unsaved')).toBeInTheDocument()
        
        // Claude chat should see the code
        expect(screen.getByTestId('claude-context')).toHaveTextContent('function hello')
      })
    })
  })

  describe('Data Persistence', () => {
    it('should persist user data across sessions', async () => {
      // Create some data
      await app.createProject({ name: 'Test Project' })
      await app.saveFile('test.js', 'console.log("test")')
      
      // Shutdown and restart
      await app.shutdown()
      const newApp = new {{applicationName}}(config)
      await newApp.initialize(env)
      
      // Data should persist
      const projects = await newApp.getProjects()
      expect(projects).toHaveLength(1)
      expect(projects[0].name).toBe('Test Project')
      
      const fileContent = await newApp.readFile('test.js')
      expect(fileContent).toBe('console.log("test")')
    })

    it('should handle data migration', async () => {
      // Create old format data
      await env.createLegacyData()
      
      // Initialize app (should migrate)
      await app.initialize(env)
      
      // Check migration
      const migrationStatus = await app.getMigrationStatus()
      expect(migrationStatus).toMatchObject({
        migrated: true,
        version: config.version,
        itemsMigrated: expect.any(Number)
      })
    })
  })

  describe('Performance & Scalability', () => {
    it('should handle concurrent users', async () => {
      const users = Array(10).fill(0).map((_, i) => ({
        id: \`user\${i}\`,
        client: app.createClient()
      }))
      
      // Simulate concurrent operations
      const operations = users.map(user => 
        user.client.executeOperation({
          type: 'code-completion',
          payload: { code: 'function test' }
        })
      )
      
      const results = await Promise.all(operations)
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.latency).toBeLessThan(1000)
      })
    })

    it('should scale under load', async () => {
      const loadTest = await app.runLoadTest({
        duration: 5000,
        usersPerSecond: 10,
        operations: ['read', 'write', 'compile']
      })
      
      expect(loadTest.metrics).toMatchObject({
        successRate: expect.toBeGreaterThan(0.99),
        p95Latency: expect.toBeLessThan(500),
        throughput: expect.toBeGreaterThan(100)
      })
    })
  })

  describe('Security', () => {
    it('should enforce authentication', async () => {
      const unauthClient = app.createClient({ authenticated: false })
      
      await expect(unauthClient.executeOperation({
        type: 'write-file',
        payload: { path: 'test.js', content: 'malicious' }
      })).rejects.toThrow('Unauthorized')
    })

    it('should validate and sanitize inputs', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        'DROP TABLE users;'
      ]
      
      for (const input of maliciousInputs) {
        const result = await app.processUserInput(input)
        expect(result.sanitized).toBe(true)
        expect(result.threats).toContain('detected')
      }
    })

    it('should rate limit API calls', async () => {
      const client = app.createClient()
      
      // Exceed rate limit
      const requests = Array(100).fill(0).map(() => 
        client.executeOperation({ type: 'expensive-operation' })
      )
      
      const results = await Promise.allSettled(requests)
      const rejected = results.filter(r => r.status === 'rejected')
      
      expect(rejected.length).toBeGreaterThan(0)
      expect(rejected[0].reason).toMatch(/rate limit/i)
    })
  })

  describe('Monitoring & Observability', () => {
    it('should emit comprehensive metrics', async () => {
      const metrics: any[] = []
      app.on('metrics', (m) => metrics.push(m))
      
      // Perform various operations
      await app.executeWorkflow('test-workflow')
      
      expect(metrics).toContainEqual(expect.objectContaining({
        type: 'workflow',
        name: 'test-workflow',
        duration: expect.any(Number),
        status: 'completed'
      }))
    })

    it('should provide health endpoints', async () => {
      const health = await app.getHealth()
      
      expect(health).toMatchObject({
        status: 'healthy',
        version: config.version,
        uptime: expect.any(Number),
        checks: {
          database: { status: 'healthy' },
          cache: { status: 'healthy' },
          api: { status: 'healthy' }
        }
      })
    })
  })

  describe('Error Handling & Recovery', () => {
    it('should handle and log errors appropriately', async () => {
      const errorSpy = vi.fn()
      app.on('error', errorSpy)
      
      // Trigger an error
      await app.executeOperation({ 
        type: 'invalid-operation' 
      }).catch(() => {})
      
      expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Error),
        context: expect.any(Object),
        severity: expect.any(String)
      }))
    })

    it('should recover from database failures', async () => {
      // Simulate DB failure
      await env.failService('database')
      
      // App should switch to fallback
      const result = await app.getData('test-key')
      expect(result.source).toBe('cache-fallback')
      
      // Restore DB
      await env.restoreService('database')
      
      // Should resume normal operation
      await waitFor(async () => {
        const newResult = await app.getData('test-key-2')
        expect(newResult.source).toBe('database')
      })
    })
  })
})`

export const L3_E2E_TEMPLATE = `import { test, expect } from '@playwright/test'
import { {{applicationName}}E2E } from '../{{applicationName}}.e2e'

test.describe('{{applicationName}} - E2E Tests', () => {
  let app: {{applicationName}}E2E

  test.beforeEach(async ({ page }) => {
    app = new {{applicationName}}E2E(page)
    await app.setup()
  })

  test.afterEach(async () => {
    await app.cleanup()
  })

  test('complete user journey', async ({ page }) => {
    // Navigate to app
    await app.navigate()
    
    // Sign in
    await app.signIn('test@example.com', 'password')
    
    // Create new project
    await app.createProject('My Test Project')
    
    // Write some code
    await app.writeCode('function hello() { return "world"; }')
    
    // Ask Claude for help
    await app.askClaude('Can you explain this function?')
    await expect(page.locator('.claude-response')).toContainText('function')
    
    // Save and deploy
    await app.saveFile('hello.js')
    await app.deployProject()
    
    // Verify deployment
    await expect(page.locator('.deployment-status')).toHaveText('Success')
  })

  test('handles errors gracefully', async ({ page }) => {
    await app.navigate()
    
    // Try to access without auth
    await page.goto('/projects')
    await expect(page).toHaveURL('/login')
    
    // Invalid credentials
    await app.signIn('invalid@example.com', 'wrong')
    await expect(page.locator('.error-message')).toBeVisible()
  })

  test('responsive design', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await app.navigate()
    
    // Mobile menu should be visible
    await expect(page.locator('.mobile-menu')).toBeVisible()
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.tablet-layout')).toBeVisible()
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.desktop-layout')).toBeVisible()
  })
})`

export const L3_TEST_GENERATORS = {
  /**
   * Generate user workflow tests
   */
  generateUserWorkflowTests(workflows: Array<{ name: string; steps: string[] }>): string {
    return workflows.map(workflow => `
    it('should support ${workflow.name} workflow', async () => {
      render(<{{applicationName}}UI app={app} />)
      
      ${workflow.steps.map((step, i) => `
      // Step ${i + 1}: ${step}
      ${this.generateWorkflowStep(step)}`).join('\n')}
      
      // Verify workflow completion
      await waitFor(() => {
        expect(screen.getByTestId('workflow-complete')).toBeInTheDocument()
      })
    })`).join('\n')
  },

  /**
   * Generate workflow step code
   */
  generateWorkflowStep(step: string): string {
    const stepTemplates: Record<string, string> = {
      'create project': `
      await user.click(screen.getByText('New Project'))
      await user.type(screen.getByLabelText('Project Name'), 'Test Project')
      await user.click(screen.getByText('Create'))`,
      
      'write code': `
      const editor = screen.getByTestId('code-editor')
      await user.click(editor)
      await user.keyboard('function test() {')
      await user.keyboard('{Enter}')
      await user.keyboard('  return "Hello, World!";')
      await user.keyboard('{Enter}')
      await user.keyboard('}')`,
      
      'ask claude': `
      await user.click(screen.getByTestId('claude-chat'))
      await user.type(
        screen.getByPlaceholderText('Ask Claude...'),
        'How can I improve this code?'
      )
      await user.keyboard('{Enter}')`,
      
      'deploy': `
      await user.click(screen.getByText('Deploy'))
      await user.selectOptions(screen.getByLabelText('Environment'), 'production')
      await user.click(screen.getByText('Start Deployment'))`,
      
      'test': `
      await user.click(screen.getByText('Run Tests'))
      await waitFor(() => {
        expect(screen.getByText(/All tests passed/)).toBeInTheDocument()
      })`
    }

    const lowerStep = step.toLowerCase()
    for (const [key, template] of Object.entries(stepTemplates)) {
      if (lowerStep.includes(key)) {
        return template
      }
    }

    return `// ${step}`
  },

  /**
   * Generate performance test scenarios
   */
  generatePerformanceTests(scenarios: string[]): string {
    return scenarios.map(scenario => {
      switch (scenario) {
        case 'large-files':
          return `
    it('should handle large files efficiently', async () => {
      const largeFile = 'x'.repeat(10 * 1024 * 1024) // 10MB
      
      const start = performance.now()
      await app.saveFile('large.txt', largeFile)
      const saveTime = performance.now() - start
      
      expect(saveTime).toBeLessThan(1000) // Under 1 second
      
      // Should still be responsive
      const response = await app.executeOperation({ type: 'ping' })
      expect(response.latency).toBeLessThan(100)
    })`
        
        case 'many-files':
          return `
    it('should handle many files in project', async () => {
      // Create 1000 files
      const files = Array(1000).fill(0).map((_, i) => ({
        path: \`file\${i}.js\`,
        content: \`export const value\${i} = \${i};\`
      }))
      
      await app.createFiles(files)
      
      // File explorer should still be fast
      const start = performance.now()
      const tree = await app.getFileTree()
      const loadTime = performance.now() - start
      
      expect(tree.files).toHaveLength(1000)
      expect(loadTime).toBeLessThan(500)
    })`
        
        case 'real-time-collab':
          return `
    it('should handle real-time collaboration', async () => {
      // Create multiple clients
      const clients = Array(5).fill(0).map(() => app.createClient())
      
      // All clients edit simultaneously
      const edits = clients.map((client, i) => 
        client.editDocument({
          line: i,
          text: \`User \${i} was here\`
        })
      )
      
      await Promise.all(edits)
      
      // All clients should see all edits
      for (const client of clients) {
        const doc = await client.getDocument()
        expect(doc.lines).toHaveLength(5)
        doc.lines.forEach((line, i) => {
          expect(line).toBe(\`User \${i} was here\`)
        })
      }
    })`
        
        default:
          return ''
      }
    }).filter(Boolean).join('\n')
  }
}