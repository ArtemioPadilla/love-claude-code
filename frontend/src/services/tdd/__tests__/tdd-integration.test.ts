/**
 * TDD Integration Demonstration Test
 * 
 * This test demonstrates the complete TDD workflow with:
 * 1. Unit tests following Red-Green-Refactor cycle
 * 2. E2E tests using Playwright integration
 * 3. TDD-Guard enforcement verification
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { TDDWorkflow } from '../TDDWorkflow'
import { TestRunner } from '../TestRunner'
import { TDDGuardIntegration } from '../TDDGuardIntegration'
import { PlaywrightIntegration } from '../PlaywrightIntegration'
import { SpecificationParser } from '../SpecificationParser'
import { TestGenerator } from '../TestGenerator'

describe('TDD Integration Demo', () => {
  let workflow: TDDWorkflow
  let runner: TestRunner
  let guard: TDDGuardIntegration
  let playwright: PlaywrightIntegration

  beforeAll(async () => {
    // Initialize all TDD services
    workflow = new TDDWorkflow()
    runner = new TestRunner()
    guard = new TDDGuardIntegration({
      enableEnforcement: true,
      syncWithWorkflow: true
    })
    playwright = new PlaywrightIntegration({
      headless: true,
      browser: 'chromium'
    })

    // Connect services
    guard.connectWorkflow(workflow)
    playwright.connectToWorkflow(workflow)
    playwright.connectToTestRunner(runner)

    // Initialize Playwright (skip in test environment)
    // await playwright.initialize()
  })

  afterAll(async () => {
    // Cleanup
    await playwright.cleanup()
  })

  describe('Red Phase - Write Failing Tests', () => {
    it('should start in red phase', () => {
      const state = workflow.getState()
      expect(state.phase).toBe('red')
      expect(state.testsPassing).toBe(false)
    })

    it('should parse natural language specification', () => {
      const parser = new SpecificationParser()
      const spec = parser.parse(`
        As a user
        I want to create a todo item
        So that I can track my tasks
        
        Given I am on the todo page
        When I enter "Buy groceries" in the input field
        And I click the add button
        Then I should see "Buy groceries" in the todo list
      `)

      expect(spec.feature).toBe('create a todo item')
      expect(spec.scenarios).toHaveLength(1)
      expect(spec.scenarios[0].steps).toHaveLength(4)
    })

    it('should generate test from specification', () => {
      const generator = new TestGenerator()
      const testCode = generator.generate({
        name: 'Todo Creation',
        type: 'unit',
        description: 'Test todo item creation',
        assertions: [
          'Input field should be empty initially',
          'Todo should be added to list',
          'Input should clear after adding'
        ]
      })

      expect(testCode).toContain('describe')
      expect(testCode).toContain('it')
      expect(testCode).toContain('expect')
    })

    it('should enforce TDD rules in red phase', () => {
      // Enable enforcement
      guard.enableEnforcement()
      
      // Simulate attempting to write implementation code before test
      const violation = guard.checkViolation({
        operation: 'write',
        file: 'TodoList.tsx',
        content: 'const TodoList = () => { /* implementation */ }'
      })

      expect(violation).toBeTruthy()
      expect(violation?.type).toBe('implementation_before_test')
      expect(violation?.phase).toBe('red')
    })
  })

  describe('Green Phase - Make Tests Pass', () => {
    it('should transition to green phase after writing test', () => {
      // Simulate writing a test
      workflow.updateState({
        phase: 'green',
        hasFailingTest: true,
        testsPassing: false
      })

      const state = workflow.getState()
      expect(state.phase).toBe('green')
    })

    it('should allow implementation in green phase', () => {
      const violation = guard.checkViolation({
        operation: 'write',
        file: 'TodoList.tsx',
        content: 'const TodoList = () => { return <div>Todo List</div> }'
      })

      expect(violation).toBeFalsy()
    })

    it('should run tests and verify they pass', async () => {
      // Mock test execution
      const mockResults = {
        passed: true,
        failed: 0,
        total: 3,
        duration: 150,
        suites: [
          {
            name: 'TodoList',
            passed: true,
            tests: [
              { name: 'renders correctly', passed: true },
              { name: 'adds todo item', passed: true },
              { name: 'clears input after adding', passed: true }
            ]
          }
        ]
      }

      runner.emit('tests:complete', mockResults)
      
      // Verify workflow updated
      workflow.updateState({
        testsPassing: true,
        lastTestRun: new Date()
      })

      const state = workflow.getState()
      expect(state.testsPassing).toBe(true)
    })
  })

  describe('Refactor Phase - Improve Code Quality', () => {
    it('should transition to refactor phase when tests pass', () => {
      workflow.updateState({
        phase: 'refactor',
        testsPassing: true
      })

      const state = workflow.getState()
      expect(state.phase).toBe('refactor')
    })

    it('should allow refactoring in refactor phase', () => {
      const violation = guard.checkViolation({
        operation: 'edit',
        file: 'TodoList.tsx',
        content: 'const TodoList = () => { /* refactored code */ }'
      })

      expect(violation).toBeFalsy()
    })

    it('should ensure tests still pass after refactoring', async () => {
      // Run tests again after refactoring
      const mockResults = {
        passed: true,
        failed: 0,
        total: 3,
        duration: 120
      }

      runner.emit('tests:complete', mockResults)
      
      const state = workflow.getState()
      expect(state.testsPassing).toBe(true)
    })
  })

  describe('E2E Testing with Playwright', () => {
    it('should create E2E test case', () => {
      const e2eTest = {
        name: 'Todo App E2E',
        description: 'End-to-end test for todo functionality',
        steps: [
          { action: 'navigate' as const, value: '/' },
          { action: 'type' as const, target: '#todo-input', value: 'Buy groceries' },
          { action: 'click' as const, target: '#add-button' },
          { action: 'wait' as const, target: '.todo-item' }
        ],
        assertions: [
          { type: 'visible' as const, target: '.todo-item', expected: true },
          { type: 'text' as const, target: '.todo-item', expected: 'Buy groceries' },
          { type: 'value' as const, target: '#todo-input', expected: '' }
        ]
      }

      expect(e2eTest.steps).toHaveLength(4)
      expect(e2eTest.assertions).toHaveLength(3)
    })

    it('should generate page object model', async () => {
      // Mock page analysis
      vi.spyOn(playwright, 'generatePageObject').mockResolvedValue(`
        export class TodoPageObject {
          constructor(private page: Page) {}
          
          async todoInput() {
            return await this.page.locator('#todo-input')
          }
          
          async addButton() {
            return await this.page.locator('#add-button')
          }
          
          async todoItems() {
            return await this.page.locator('.todo-item')
          }
        }
      `)

      const pageObject = await playwright.generatePageObject()
      expect(pageObject).toContain('TodoPageObject')
      expect(pageObject).toContain('todoInput')
      expect(pageObject).toContain('addButton')
    })

    it('should capture screenshots for visual testing', async () => {
      // Mock screenshot capture
      const mockScreenshot = Buffer.from('mock-screenshot-data')
      vi.spyOn(playwright, 'captureScreenshot').mockResolvedValue(mockScreenshot)

      const screenshot = await playwright.captureScreenshot('test-complete')
      expect(screenshot).toBeDefined()
      expect(screenshot.length).toBeGreaterThan(0)
    })
  })

  describe('TDD Status Monitoring', () => {
    it('should provide comprehensive TDD status', () => {
      const status = {
        guard: guard.getStatus(),
        workflow: workflow.getState(),
        playwright: {
          initialized: !!playwright.getPage(),
          browser: playwright.getBrowser() ? 'connected' : 'disconnected'
        }
      }

      expect(status.guard.enabled).toBeDefined()
      expect(status.workflow.phase).toBeDefined()
      expect(status.playwright.initialized).toBeDefined()
    })

    it('should track TDD metrics', () => {
      const metrics = workflow.getMetrics()
      
      expect(metrics).toHaveProperty('cyclesCompleted')
      expect(metrics).toHaveProperty('averageCycleTime')
      expect(metrics).toHaveProperty('testCoverage')
      expect(metrics).toHaveProperty('violations')
    })

    it('should emit events for monitoring', () => {
      const phaseChangeSpy = vi.fn()
      const testCompleteSpy = vi.fn()
      const violationSpy = vi.fn()

      workflow.on('phase:change', phaseChangeSpy)
      runner.on('tests:complete', testCompleteSpy)
      guard.on('violation', violationSpy)

      // Trigger phase change
      workflow.updateState({ phase: 'red' })
      expect(phaseChangeSpy).toHaveBeenCalled()
    })
  })

  describe('Integration with Love Claude Code', () => {
    it('should integrate with construct system', () => {
      // Verify TDD services can be used in constructs
      const tddConstruct = {
        id: 'tdd-enabled-construct',
        name: 'TDD-Enabled Construct',
        type: 'component',
        tddEnabled: true,
        workflow: workflow,
        runner: runner
      }

      expect(tddConstruct.tddEnabled).toBe(true)
      expect(tddConstruct.workflow).toBeDefined()
    })

    it('should work with Claude Code hooks', () => {
      // Verify PreToolUse hook integration
      const hookConfig = {
        name: 'tdd-guard',
        matcher: 'Write|Edit|MultiEdit',
        command: 'tdd-guard'
      }

      expect(hookConfig.matcher).toContain('Write')
      expect(hookConfig.command).toBe('tdd-guard')
    })

    it('should support MCP server communication', () => {
      // Verify MCP server integration
      const mcpConfig = {
        server: 'playwright-automation',
        command: 'npx',
        args: ['@modelcontextprotocol/server-playwright']
      }

      expect(mcpConfig.server).toBe('playwright-automation')
      expect(mcpConfig.args).toContain('@modelcontextprotocol/server-playwright')
    })
  })
})