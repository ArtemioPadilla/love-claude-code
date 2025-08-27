/**
 * L0 Primitive Test Templates
 * Test templates for L0 UI and Infrastructure primitives
 */

export const L0_UI_TEMPLATE = `import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { {{componentName}} } from '../{{componentName}}'
import type { {{componentName}}Props } from '../{{componentName}}'

describe('{{componentName}} - L0 UI Primitive', () => {
  const defaultProps: {{componentName}}Props = {
    {{defaultPropsContent}}
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<{{componentName}} {...defaultProps} />)
      expect(screen.getByTestId('{{testId}}')).toBeInTheDocument()
    })

    it('should apply correct CSS classes', () => {
      render(<{{componentName}} {...defaultProps} className="custom-class" />)
      const element = screen.getByTestId('{{testId}}')
      expect(element).toHaveClass('custom-class')
    })

    it('should render with correct default props', () => {
      render(<{{componentName}} {...defaultProps} />)
      {{defaultPropsAssertions}}
    })
  })

  describe('Props', () => {
    {{propTests}}
  })

  describe('Interactions', () => {
    {{interactionTests}}
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<{{componentName}} {...defaultProps} />)
      const element = screen.getByTestId('{{testId}}')
      {{ariaAssertions}}
    })

    it('should be keyboard navigable', () => {
      render(<{{componentName}} {...defaultProps} />)
      const element = screen.getByTestId('{{testId}}')
      element.focus()
      expect(document.activeElement).toBe(element)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined props gracefully', () => {
      render(<{{componentName}} {...defaultProps} value={null} />)
      expect(screen.getByTestId('{{testId}}')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<{{componentName}} {...defaultProps}>{''}</{{componentName}}>)
      expect(screen.getByTestId('{{testId}}')).toBeInTheDocument()
    })
  })
})`

export const L0_INFRASTRUCTURE_TEMPLATE = `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { {{className}} } from '../{{className}}'
import type { {{className}}Config } from '../{{className}}'

describe('{{className}} - L0 Infrastructure Primitive', () => {
  let instance: {{className}}
  const mockConfig: {{className}}Config = {
    {{mockConfigContent}}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    instance = new {{className}}(mockConfig)
  })

  afterEach(async () => {
    await instance?.cleanup()
  })

  describe('Initialization', () => {
    it('should initialize with provided config', () => {
      expect(instance).toBeDefined()
      expect(instance.config).toEqual(mockConfig)
    })

    it('should validate config on initialization', () => {
      expect(() => new {{className}}({} as any)).toThrow()
    })

    it('should set initial state correctly', () => {
      expect(instance.isReady()).toBe(false)
      expect(instance.getStatus()).toBe('initializing')
    })
  })

  describe('Core Functionality', () => {
    {{coreFunctionalityTests}}
  })

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const error = new Error('Connection failed')
      vi.spyOn(instance, 'connect').mockRejectedValue(error)
      
      await expect(instance.connect()).rejects.toThrow('Connection failed')
      expect(instance.getStatus()).toBe('error')
    })

    it('should retry on transient failures', async () => {
      const spy = vi.spyOn(instance, 'connect')
      spy.mockRejectedValueOnce(new Error('Temporary'))
        .mockResolvedValueOnce(undefined)
      
      await instance.connectWithRetry()
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Resource Management', () => {
    it('should clean up resources on disposal', async () => {
      await instance.initialize()
      const cleanupSpy = vi.spyOn(instance, 'cleanup')
      
      await instance.dispose()
      
      expect(cleanupSpy).toHaveBeenCalled()
      expect(instance.getStatus()).toBe('disposed')
    })

    it('should prevent operations after disposal', async () => {
      await instance.dispose()
      
      await expect(instance.connect()).rejects.toThrow('disposed')
    })
  })

  describe('Performance', () => {
    it('should initialize within acceptable time', async () => {
      const start = performance.now()
      await instance.initialize()
      const duration = performance.now() - start
      
      expect(duration).toBeLessThan(1000) // 1 second max
    })
  })
})`

export const L0_TEST_GENERATORS = {
  /**
   * Generate UI primitive prop tests
   */
  generatePropTests(props: Array<{ name: string; type: string; required: boolean }>): string {
    return props.map(prop => `
    it('should handle ${prop.name} prop correctly', () => {
      const testValue = ${this.generateTestValue(prop.type)}
      render(<{{componentName}} {...defaultProps} ${prop.name}={testValue} />)
      ${this.generatePropAssertion(prop)}
    })`).join('\n')
  },

  /**
   * Generate interaction tests for UI components
   */
  generateInteractionTests(interactions: string[]): string {
    return interactions.map(interaction => {
      switch (interaction) {
        case 'click':
          return `
    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<{{componentName}} {...defaultProps} onClick={handleClick} />)
      
      fireEvent.click(screen.getByTestId('{{testId}}'))
      
      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
    })`
        
        case 'change':
          return `
    it('should handle change events', () => {
      const handleChange = vi.fn()
      render(<{{componentName}} {...defaultProps} onChange={handleChange} />)
      
      const input = screen.getByTestId('{{testId}}')
      fireEvent.change(input, { target: { value: 'test' } })
      
      expect(handleChange).toHaveBeenCalledWith('test')
    })`
        
        case 'focus':
          return `
    it('should handle focus/blur events', () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      render(
        <{{componentName}} 
          {...defaultProps} 
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )
      
      const element = screen.getByTestId('{{testId}}')
      
      fireEvent.focus(element)
      expect(handleFocus).toHaveBeenCalled()
      
      fireEvent.blur(element)
      expect(handleBlur).toHaveBeenCalled()
    })`
        
        default:
          return ''
      }
    }).filter(Boolean).join('\n')
  },

  /**
   * Generate test value based on type
   */
  generateTestValue(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return "'test value'"
      case 'number':
        return '42'
      case 'boolean':
        return 'true'
      case 'array':
        return "['item1', 'item2']"
      case 'object':
        return "{ key: 'value' }"
      case 'function':
        return 'vi.fn()'
      default:
        return "'test'"
    }
  },

  /**
   * Generate assertion for prop
   */
  generatePropAssertion(prop: { name: string; type: string }): string {
    switch (prop.name) {
      case 'value':
        return `expect(screen.getByDisplayValue(testValue)).toBeInTheDocument()`
      case 'label':
        return `expect(screen.getByText(testValue)).toBeInTheDocument()`
      case 'placeholder':
        return `expect(screen.getByPlaceholderText(testValue)).toBeInTheDocument()`
      case 'disabled':
        return `expect(screen.getByTestId('{{testId}}')).toBeDisabled()`
      case 'className':
        return `expect(screen.getByTestId('{{testId}}')).toHaveClass(testValue)`
      default:
        return `// Verify ${prop.name} prop effect`
    }
  },

  /**
   * Generate infrastructure functionality tests
   */
  generateCoreFunctionalityTests(methods: string[]): string {
    return methods.map(method => {
      const methodName = method.charAt(0).toUpperCase() + method.slice(1)
      return `
    it('should ${method} successfully', async () => {
      await instance.initialize()
      
      const result = await instance.${method}()
      
      expect(result).toBeDefined()
      expect(instance.getStatus()).toBe('ready')
    })
    
    it('should emit events on ${method}', async () => {
      const eventSpy = vi.fn()
      instance.on('${method}', eventSpy)
      
      await instance.${method}()
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: '${method}',
        timestamp: expect.any(Number)
      }))
    })`
    }).join('\n')
  }
}