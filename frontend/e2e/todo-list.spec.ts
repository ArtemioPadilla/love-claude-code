/**
 * TodoList E2E Tests
 * Demonstrates Playwright integration with TDD workflow
 */

import { test, expect } from '@playwright/test'

test.describe('TodoList E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the todo list page
    await page.goto('/examples/todo-list')
    
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display todo list interface', async ({ page }) => {
    // Check main elements are visible
    await expect(page.locator('h1')).toContainText('Todo List')
    await expect(page.getByPlaceholder('Enter a todo...')).toBeVisible()
    await expect(page.getByRole('button', { name: /add todo/i })).toBeVisible()
    await expect(page.locator('.todo-stats')).toContainText('0 active todos')
  })

  test('should add a new todo item', async ({ page }) => {
    // Type todo text
    await page.fill('input[placeholder="Enter a todo..."]', 'Buy groceries')
    
    // Click add button
    await page.click('button:has-text("Add Todo")')
    
    // Verify todo appears
    await expect(page.locator('.todo-text')).toContainText('Buy groceries')
    await expect(page.locator('.todo-stats')).toContainText('1 active todos')
    
    // Verify input is cleared
    await expect(page.getByPlaceholder('Enter a todo...')).toHaveValue('')
  })

  test('should add todo with Enter key', async ({ page }) => {
    const input = page.getByPlaceholder('Enter a todo...')
    
    // Type and press Enter
    await input.fill('Walk the dog')
    await input.press('Enter')
    
    // Verify todo appears
    await expect(page.locator('.todo-text')).toContainText('Walk the dog')
  })

  test('should not add empty todos', async ({ page }) => {
    // Try to add empty todo
    await page.click('button:has-text("Add Todo")')
    
    // Verify no todo is added
    await expect(page.locator('.todo-item')).toHaveCount(0)
    await expect(page.locator('.empty-state')).toContainText('No todos yet')
  })

  test('should mark todo as completed', async ({ page }) => {
    // Add a todo
    await page.fill('input[placeholder="Enter a todo..."]', 'Test todo')
    await page.click('button:has-text("Add Todo")')
    
    // Click todo to mark as completed
    await page.click('.todo-text')
    
    // Verify completed state
    await expect(page.locator('.todo-text')).toHaveClass(/completed/)
    await expect(page.locator('.todo-stats')).toContainText('0 active todos')
  })

  test('should delete todo', async ({ page }) => {
    // Add a todo
    await page.fill('input[placeholder="Enter a todo..."]', 'To be deleted')
    await page.click('button:has-text("Add Todo")')
    
    // Delete the todo
    await page.click('button:has-text("Delete")')
    
    // Verify todo is removed
    await expect(page.locator('.todo-item')).toHaveCount(0)
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should filter todos by status', async ({ page }) => {
    // Add multiple todos
    await page.fill('input[placeholder="Enter a todo..."]', 'Active todo')
    await page.click('button:has-text("Add Todo")')
    
    await page.fill('input[placeholder="Enter a todo..."]', 'Completed todo')
    await page.click('button:has-text("Add Todo")')
    
    // Mark second todo as completed
    await page.click('.todo-text:has-text("Completed todo")')
    
    // Test Active filter
    await page.click('button:has-text("Active")')
    await expect(page.locator('.todo-item')).toHaveCount(1)
    await expect(page.locator('.todo-text')).toContainText('Active todo')
    
    // Test Completed filter
    await page.click('button:has-text("Completed")')
    await expect(page.locator('.todo-item')).toHaveCount(1)
    await expect(page.locator('.todo-text')).toContainText('Completed todo')
    
    // Test All filter
    await page.click('button:has-text("All")')
    await expect(page.locator('.todo-item')).toHaveCount(2)
  })

  test('should persist todos in localStorage', async ({ page }) => {
    // Add todos
    await page.fill('input[placeholder="Enter a todo..."]', 'Persistent todo 1')
    await page.click('button:has-text("Add Todo")')
    
    await page.fill('input[placeholder="Enter a todo..."]', 'Persistent todo 2')
    await page.click('button:has-text("Add Todo")')
    
    // Reload page
    await page.reload()
    
    // Verify todos are still there
    await expect(page.locator('.todo-item')).toHaveCount(2)
    await expect(page.locator('.todo-text').first()).toContainText('Persistent todo 1')
    await expect(page.locator('.todo-text').last()).toContainText('Persistent todo 2')
  })

  test('should handle multiple todos efficiently', async ({ page }) => {
    // Add 10 todos quickly
    for (let i = 1; i <= 10; i++) {
      await page.fill('input[placeholder="Enter a todo..."]', `Todo ${i}`)
      await page.click('button:has-text("Add Todo")')
    }
    
    // Verify all todos are displayed
    await expect(page.locator('.todo-item')).toHaveCount(10)
    await expect(page.locator('.todo-stats')).toContainText('10 active todos')
    
    // Verify performance - should render within 1 second
    const startTime = Date.now()
    await page.locator('.todo-item').last().waitFor()
    const endTime = Date.now()
    expect(endTime - startTime).toBeLessThan(1000)
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Add todo using keyboard only
    await page.keyboard.press('Tab') // Focus input
    await page.keyboard.type('Keyboard todo')
    await page.keyboard.press('Enter')
    
    // Navigate to todo item with Tab
    await page.keyboard.press('Tab') // Skip add button
    await page.keyboard.press('Tab') // Focus filter buttons
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // Focus todo text
    
    // Toggle completion with Space or Enter
    await page.keyboard.press('Space')
    
    // Verify todo is completed
    await expect(page.locator('.todo-text')).toHaveClass(/completed/)
  })

  test('should take screenshot for visual regression', async ({ page }) => {
    // Add some todos for visual testing
    await page.fill('input[placeholder="Enter a todo..."]', 'First todo')
    await page.click('button:has-text("Add Todo")')
    
    await page.fill('input[placeholder="Enter a todo..."]', 'Second todo')
    await page.click('button:has-text("Add Todo")')
    
    // Mark first as completed
    await page.click('.todo-text:has-text("First todo")')
    
    // Take screenshot
    await expect(page).toHaveScreenshot('todo-list-with-items.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('should handle edge cases gracefully', async ({ page }) => {
    // Test very long todo text
    const longText = 'This is a very long todo item that contains a lot of text to test how the component handles overflow and text wrapping in the UI'
    await page.fill('input[placeholder="Enter a todo..."]', longText)
    await page.click('button:has-text("Add Todo")')
    
    // Verify todo is added and displays correctly
    await expect(page.locator('.todo-text')).toContainText(longText)
    
    // Test whitespace-only input
    await page.fill('input[placeholder="Enter a todo..."]', '   ')
    await page.click('button:has-text("Add Todo")')
    
    // Verify no todo is added for whitespace
    await expect(page.locator('.todo-item')).toHaveCount(1)
    
    // Test special characters
    await page.fill('input[placeholder="Enter a todo..."]', '!@#$%^&*()_+{}[]|\\:";\'<>?,./`~')
    await page.click('button:has-text("Add Todo")')
    
    // Verify special characters are handled
    await expect(page.locator('.todo-item')).toHaveCount(2)
  })
})

test.describe('Visual Regression Tests', () => {
  test('should match baseline for empty state', async ({ page }) => {
    await page.goto('/examples/todo-list')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    await expect(page).toHaveScreenshot('todo-list-empty.png')
  })

  test('should match baseline for multiple states', async ({ page }) => {
    await page.goto('/examples/todo-list')
    
    // Add todos in different states
    await page.fill('input[placeholder="Enter a todo..."]', 'Active todo')
    await page.click('button:has-text("Add Todo")')
    
    await page.fill('input[placeholder="Enter a todo..."]', 'Completed todo')
    await page.click('button:has-text("Add Todo")')
    await page.click('.todo-text:has-text("Completed todo")')
    
    // Test each filter view
    await page.click('button:has-text("Active")')
    await expect(page).toHaveScreenshot('todo-list-active-filter.png')
    
    await page.click('button:has-text("Completed")')
    await expect(page).toHaveScreenshot('todo-list-completed-filter.png')
    
    await page.click('button:has-text("All")')
    await expect(page).toHaveScreenshot('todo-list-all-filter.png')
  })
})

test.describe('Performance Tests', () => {
  test('should handle rapid input without lag', async ({ page }) => {
    await page.goto('/examples/todo-list')
    
    const input = page.getByPlaceholder('Enter a todo...')
    
    // Measure typing performance
    const startTime = Date.now()
    
    // Type rapidly
    for (let i = 0; i < 10; i++) {
      await input.fill(`Quick todo ${i}`)
      await input.press('Enter')
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should handle 10 rapid inputs in under 2 seconds
    expect(totalTime).toBeLessThan(2000)
    
    // Verify all todos were added
    await expect(page.locator('.todo-item')).toHaveCount(10)
  })

  test('should render large lists efficiently', async ({ page }) => {
    await page.goto('/examples/todo-list')
    
    // Add 50 todos
    for (let i = 0; i < 50; i++) {
      await page.evaluate((index) => {
        const todos = JSON.parse(localStorage.getItem('todos') || '[]')
        todos.push({
          id: Date.now().toString() + index,
          text: `Todo item ${index}`,
          completed: index % 3 === 0,
          createdAt: new Date()
        })
        localStorage.setItem('todos', JSON.stringify(todos))
      }, i)
    }
    
    // Reload to render all todos
    const startTime = Date.now()
    await page.reload()
    await page.locator('.todo-item').last().waitFor()
    const endTime = Date.now()
    
    // Should render 50 todos in under 2 seconds
    expect(endTime - startTime).toBeLessThan(2000)
    
    // Verify count
    await expect(page.locator('.todo-item')).toHaveCount(50)
  })
})