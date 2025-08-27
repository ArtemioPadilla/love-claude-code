/**
 * TodoList Component Test
 * Demonstrates TDD workflow with a simple todo list component
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TodoList } from './TodoList'

describe('TodoList Component - TDD Example', () => {
  describe('Red Phase - Initial Failing Tests', () => {
    it('should render todo input field', () => {
      render(<TodoList />)
      const input = screen.getByPlaceholderText('Enter a todo...')
      expect(input).toBeInTheDocument()
    })

    it('should render add button', () => {
      render(<TodoList />)
      const button = screen.getByRole('button', { name: /add todo/i })
      expect(button).toBeInTheDocument()
    })

    it('should add todo when form is submitted', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeInTheDocument()
      })
    })

    it('should clear input after adding todo', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...') as HTMLInputElement
      const button = screen.getByRole('button', { name: /add todo/i })
      
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should not add empty todos', () => {
      render(<TodoList />)
      
      const button = screen.getByRole('button', { name: /add todo/i })
      fireEvent.click(button)
      
      const todos = screen.queryAllByTestId('todo-item')
      expect(todos).toHaveLength(0)
    })

    it('should display multiple todos', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      // Add first todo
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(button)
      
      // Add second todo
      fireEvent.change(input, { target: { value: 'Walk the dog' } })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeInTheDocument()
        expect(screen.getByText('Walk the dog')).toBeInTheDocument()
      })
    })

    it('should mark todo as completed when clicked', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(button)
      
      await waitFor(() => {
        const todoItem = screen.getByText('Buy groceries')
        fireEvent.click(todoItem)
        expect(todoItem).toHaveClass('completed')
      })
    })

    it('should delete todo when delete button is clicked', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const addButton = screen.getByRole('button', { name: /add todo/i })
      
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i })
        fireEvent.click(deleteButton)
        expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument()
      })
    })

    it('should show count of active todos', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(button)
      
      fireEvent.change(input, { target: { value: 'Walk the dog' } })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('2 active todos')).toBeInTheDocument()
      })
    })

    it('should filter todos by status', async () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const addButton = screen.getByRole('button', { name: /add todo/i })
      
      // Add todos
      fireEvent.change(input, { target: { value: 'Buy groceries' } })
      fireEvent.click(addButton)
      
      fireEvent.change(input, { target: { value: 'Walk the dog' } })
      fireEvent.click(addButton)
      
      // Mark one as completed
      await waitFor(() => {
        const firstTodo = screen.getByText('Buy groceries')
        fireEvent.click(firstTodo)
      })
      
      // Filter completed
      const filterButton = screen.getByRole('button', { name: /completed/i })
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeInTheDocument()
        expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Green Phase - Making Tests Pass', () => {
    // These tests verify the implementation works correctly
    // In TDD, we would write minimal code to make each test pass
    
    it('should handle edge cases', () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      // Test whitespace-only input
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.click(button)
      
      const todos = screen.queryAllByTestId('todo-item')
      expect(todos).toHaveLength(0)
    })

    it('should persist todos in local storage', () => {
      const { unmount } = render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      fireEvent.change(input, { target: { value: 'Persistent todo' } })
      fireEvent.click(button)
      
      // Unmount and remount
      unmount()
      render(<TodoList />)
      
      expect(screen.getByText('Persistent todo')).toBeInTheDocument()
    })
  })

  describe('Refactor Phase - Code Quality', () => {
    // These tests ensure refactoring doesn't break functionality
    
    it('should maintain performance with many todos', () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      const button = screen.getByRole('button', { name: /add todo/i })
      
      const startTime = performance.now()
      
      // Add 100 todos
      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: `Todo ${i}` } })
        fireEvent.click(button)
      }
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render 100 todos in under 1 second
      expect(renderTime).toBeLessThan(1000)
      
      const todos = screen.getAllByTestId('todo-item')
      expect(todos).toHaveLength(100)
    })

    it('should have accessible markup', () => {
      render(<TodoList />)
      
      // Check ARIA attributes
      const input = screen.getByPlaceholderText('Enter a todo...')
      expect(input).toHaveAttribute('aria-label')
      
      const button = screen.getByRole('button', { name: /add todo/i })
      expect(button).toHaveAccessibleName()
    })

    it('should handle keyboard navigation', () => {
      render(<TodoList />)
      
      const input = screen.getByPlaceholderText('Enter a todo...')
      
      // Test Enter key submission
      fireEvent.change(input, { target: { value: 'Keyboard todo' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })
      
      expect(screen.getByText('Keyboard todo')).toBeInTheDocument()
    })
  })
})