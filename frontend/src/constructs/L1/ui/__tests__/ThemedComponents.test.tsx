import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemedComponents } from '../ThemedComponents'
import React from 'react'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

describe('L1: ThemedComponents', () => {
  let construct: ThemedComponents

  beforeEach(() => {
    construct = new ThemedComponents()
    localStorage.clear()
    document.body.className = ''
    document.documentElement.style.cssText = ''
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.id).toBe('platform-l1-themed-components')
      expect(construct.level).toBe('L1')
      expect(construct.getInput('theme')).toBe('dark')
      expect(construct.getInput('persistTheme')).toBe(true)
      expect(construct.getInput('enableTransitions')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        theme: 'light',
        persistTheme: false,
        enableSystemTheme: true,
        enableTransitions: false
      })
      
      expect(construct.getInput('theme')).toBe('light')
      expect(construct.getInput('persistTheme')).toBe(false)
      expect(construct.getInput('enableSystemTheme')).toBe(true)
      expect(construct.getInput('enableTransitions')).toBe(false)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({})
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({})
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(45)
    })

    it('should be built with L0 primitives', async () => {
      await construct.initialize({})
      
      const builtWith = construct.getBuiltWithConstructs()
      expect(builtWith).toContain('platform-l0-button-primitive')
      expect(builtWith).toContain('platform-l0-modal-primitive')
      expect(builtWith).toContain('platform-l0-tab-primitive')
    })
  })

  describe('Theme Management', () => {
    it('should apply dark theme by default', async () => {
      await construct.initialize({})
      
      expect(construct.getOutput('currentTheme')).toBe('dark')
      expect(construct.getOutput('isDarkMode')).toBe(true)
      expect(document.body.className).toContain('theme-dark')
    })

    it('should switch themes', async () => {
      await construct.initialize({})
      
      construct.setTheme('light')
      
      expect(construct.getOutput('currentTheme')).toBe('light')
      expect(construct.getOutput('isDarkMode')).toBe(false)
      expect(document.body.className).toContain('theme-light')
    })

    it('should toggle between light and dark', async () => {
      await construct.initialize({ theme: 'dark' })
      
      construct.toggleTheme()
      expect(construct.getOutput('currentTheme')).toBe('light')
      
      construct.toggleTheme()
      expect(construct.getOutput('currentTheme')).toBe('dark')
    })

    it('should handle custom themes', async () => {
      const customTheme = {
        name: 'ocean',
        colors: {
          primary: '#0066cc',
          secondary: '#00aaff',
          background: '#001122',
          surface: '#002244',
          text: '#ffffff',
          textSecondary: '#aabbcc',
          border: '#334455',
          shadow: 'rgba(0, 0, 0, 0.5)',
          success: '#00ff00',
          warning: '#ffff00',
          danger: '#ff0000',
          info: '#00ffff'
        }
      }
      
      await construct.initialize({
        theme: 'custom',
        customTheme
      })
      
      const config = construct.getOutput('themeConfig')
      expect(config?.name).toBe('ocean')
      expect(config?.colors.primary).toBe('#0066cc')
    })
  })

  describe('CSS Variables', () => {
    it('should set CSS variables for theme', async () => {
      await construct.initialize({ theme: 'dark' })
      
      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-primary')).toBeTruthy()
      expect(root.style.getPropertyValue('--theme-background')).toBeTruthy()
      expect(root.style.getPropertyValue('--theme-text')).toBeTruthy()
    })

    it('should set typography variables', async () => {
      await construct.initialize({})
      
      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-font-family')).toBeTruthy()
      expect(root.style.getPropertyValue('--theme-font-size-base')).toBe('14px')
    })

    it('should set spacing variables', async () => {
      await construct.initialize({})
      
      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-spacing-sm')).toBe('8px')
      expect(root.style.getPropertyValue('--theme-spacing-md')).toBe('16px')
    })
  })

  describe('Theme Persistence', () => {
    it('should persist theme to localStorage', async () => {
      await construct.initialize({
        persistTheme: true
      })
      
      construct.setTheme('light')
      
      expect(localStorage.getItem('theme-preference')).toBe('light')
    })

    it('should load persisted theme on initialization', async () => {
      localStorage.setItem('theme-preference', 'light')
      
      await construct.initialize({
        persistTheme: true
      })
      
      expect(construct.getOutput('currentTheme')).toBe('light')
    })

    it('should not persist when disabled', async () => {
      await construct.initialize({
        persistTheme: false
      })
      
      construct.setTheme('light')
      
      expect(localStorage.getItem('theme-preference')).toBeNull()
    })
  })

  describe('System Theme Detection', () => {
    it('should detect system theme preference', async () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn()
      }))
      
      await construct.initialize({
        enableSystemTheme: true
      })
      
      expect(construct.getOutput('systemTheme')).toBe('dark')
    })

    it('should not follow system theme when disabled', async () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: true, // System prefers dark
        media: query,
        addEventListener: vi.fn()
      }))
      
      await construct.initialize({
        theme: 'light',
        enableSystemTheme: false
      })
      
      expect(construct.getOutput('currentTheme')).toBe('light')
    })
  })

  describe('Theme Transitions', () => {
    it('should add transition class when enabled', async () => {
      await construct.initialize({
        enableTransitions: true
      })
      
      expect(document.body.classList.contains('theme-transition')).toBe(true)
    })

    it('should not add transition class when disabled', async () => {
      await construct.initialize({
        enableTransitions: false
      })
      
      expect(document.body.classList.contains('theme-transition')).toBe(false)
    })
  })

  describe('Component Library', () => {
    it('should provide themed components', async () => {
      await construct.initialize({})
      
      const components = construct.getComponents()
      
      expect(components.Button).toBeDefined()
      expect(components.Input).toBeDefined()
      expect(components.Card).toBeDefined()
      expect(components.Badge).toBeDefined()
      expect(components.Alert).toBeDefined()
      expect(components.Switch).toBeDefined()
      expect(components.Select).toBeDefined()
      expect(components.Tooltip).toBeDefined()
    })

    it('should render Button component', async () => {
      await construct.initialize({})
      
      const { Button } = construct.getComponents()
      
      render(<Button variant="primary">Click Me</Button>)
      
      expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('should render Input component', async () => {
      await construct.initialize({})
      
      const { Input } = construct.getComponents()
      
      render(<Input placeholder="Enter text" label="Name" />)
      
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
    })

    it('should render Card component', async () => {
      await construct.initialize({})
      
      const { Card } = construct.getComponents()
      
      render(
        <Card title="Test Card" subtitle="Card subtitle">
          Card content
        </Card>
      )
      
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Card subtitle')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })
  })

  describe('Button Component Features', () => {
    it('should support different variants', async () => {
      await construct.initialize({})
      
      const { Button } = construct.getComponents()
      
      const { container } = render(
        <>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </>
      )
      
      expect(container.querySelectorAll('button')).toHaveLength(3)
    })

    it('should support different sizes', async () => {
      await construct.initialize({})
      
      const { Button } = construct.getComponents()
      
      render(
        <>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </>
      )
      
      expect(screen.getByText('Small')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Large')).toBeInTheDocument()
    })

    it('should handle disabled state', async () => {
      await construct.initialize({})
      
      const { Button } = construct.getComponents()
      const onClick = vi.fn()
      
      render(<Button disabled onClick={onClick}>Disabled</Button>)
      
      const button = screen.getByText('Disabled')
      fireEvent.click(button)
      
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should show loading state', async () => {
      await construct.initialize({})
      
      const { Button } = construct.getComponents()
      
      render(<Button loading>Loading</Button>)
      
      expect(screen.getByText('⟳')).toBeInTheDocument()
    })
  })

  describe('Theme Change Events', () => {
    it('should emit theme change event', async () => {
      const handler = vi.fn()
      
      await construct.initialize({})
      construct.on('themeChange', handler)
      
      construct.setTheme('light')
      
      expect(handler).toHaveBeenCalledWith({
        theme: 'light',
        config: expect.objectContaining({
          name: 'light'
        })
      })
    })

    it('should call onThemeChange callback', async () => {
      const onThemeChange = vi.fn()
      
      await construct.initialize({
        onThemeChange
      })
      
      construct.setTheme('light')
      
      expect(onThemeChange).toHaveBeenCalledWith('light', expect.objectContaining({
        name: 'light'
      }))
    })
  })

  describe('L1 Characteristics', () => {
    it('should have enhanced features over L0', async () => {
      await construct.initialize({})
      
      // Should have theme support
      expect(construct.inputs.some(i => i.name === 'theme')).toBe(true)
      expect(construct.inputs.some(i => i.name === 'customTheme')).toBe(true)
      
      // Should have persistence
      expect(construct.inputs.some(i => i.name === 'persistTheme')).toBe(true)
      
      // Should have system theme detection
      expect(construct.inputs.some(i => i.name === 'enableSystemTheme')).toBe(true)
      
      // Should have transitions
      expect(construct.inputs.some(i => i.name === 'enableTransitions')).toBe(true)
    })

    it('should provide enhanced outputs', async () => {
      await construct.initialize({})
      
      // Should track current theme
      expect(construct.outputs.some(o => o.name === 'currentTheme')).toBe(true)
      
      // Should provide theme config
      expect(construct.outputs.some(o => o.name === 'themeConfig')).toBe(true)
      
      // Should track dark mode
      expect(construct.outputs.some(o => o.name === 'isDarkMode')).toBe(true)
      
      // Should provide components
      expect(construct.outputs.some(o => o.name === 'components')).toBe(true)
    })

    it('should have security metadata', async () => {
      await construct.initialize({})
      
      const security = construct.metadata.security
      expect(security.length).toBeGreaterThan(0)
      expect(security.some((s: any) => s.aspect === 'Theme Injection')).toBe(true)
      expect(security.some((s: any) => s.aspect === 'Component Isolation')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing custom theme gracefully', async () => {
      await construct.initialize({
        theme: 'custom'
        // No customTheme provided
      })
      
      // Should fall back to dark theme
      expect(construct.getOutput('currentTheme')).toBe('custom')
      const config = construct.getOutput('themeConfig')
      expect(config?.name).toBe('dark') // Fallback
    })

    it('should handle invalid theme names', async () => {
      await construct.initialize({})
      
      construct.setTheme('invalid-theme')
      
      // Should fall back to dark theme
      const config = construct.getOutput('themeConfig')
      expect(config?.name).toBe('dark')
    })

    it('should handle missing matchMedia gracefully', async () => {
      // Remove matchMedia
      delete (window as any).matchMedia
      
      await construct.initialize({
        enableSystemTheme: true
      })
      
      // Should not crash
      expect(construct.getOutput('systemTheme')).toBe('light') // Default
    })
  })
})