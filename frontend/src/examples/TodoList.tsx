/**
 * TodoList Component
 * Implementation following TDD principles
 * 
 * This component was developed using Test-Driven Development:
 * 1. Tests were written first (Red phase)
 * 2. Minimal code was added to pass tests (Green phase)
 * 3. Code was refactored for quality (Refactor phase)
 */

import React, { useState, useEffect, FormEvent, KeyboardEvent } from 'react'
import './TodoList.css'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

type FilterStatus = 'all' | 'active' | 'completed'

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Load todos from localStorage on mount
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  // Persist todos to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    addTodo()
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTodo()
    }
  }

  const addTodo = () => {
    const trimmedValue = inputValue.trim()
    
    if (!trimmedValue) {
      return // Don't add empty todos
    }

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: trimmedValue,
      completed: false,
      createdAt: new Date()
    }

    setTodos([...todos, newTodo])
    setInputValue('') // Clear input after adding
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const getFilteredTodos = () => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      default:
        return todos
    }
  }

  const getActiveTodoCount = () => {
    return todos.filter(todo => !todo.completed).length
  }

  const filteredTodos = getFilteredTodos()
  const activeTodoCount = getActiveTodoCount()

  return (
    <div className="todo-list-container">
      <h1>Todo List (TDD Example)</h1>
      
      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a todo..."
          aria-label="Todo input"
          className="todo-input"
        />
        <button 
          type="submit" 
          aria-label="Add todo"
          className="add-button"
        >
          Add Todo
        </button>
      </form>

      <div className="todo-stats">
        <span>{activeTodoCount} active todos</span>
      </div>

      <div className="filter-buttons">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'active' : ''}
          aria-label="Show all todos"
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={filter === 'active' ? 'active' : ''}
          aria-label="Show active todos"
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'active' : ''}
          aria-label="Show completed todos"
        >
          Completed
        </button>
      </div>

      <ul className="todo-items">
        {filteredTodos.map(todo => (
          <li
            key={todo.id}
            data-testid="todo-item"
            className="todo-item"
          >
            <span
              onClick={() => toggleTodo(todo.id)}
              className={todo.completed ? 'todo-text completed' : 'todo-text'}
              role="button"
              tabIndex={0}
              aria-label={`Toggle ${todo.text}`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              aria-label={`Delete ${todo.text}`}
              className="delete-button"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <p className="empty-state">
          {filter === 'all' 
            ? 'No todos yet. Add one above!'
            : `No ${filter} todos.`
          }
        </p>
      )}
    </div>
  )
}