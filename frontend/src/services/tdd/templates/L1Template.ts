/**
 * L1 Configured Component Test Templates
 * Test templates for L1 UI and Infrastructure components
 */

export const L1_UI_TEMPLATE = `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { {{componentName}} } from '../{{componentName}}'
import type { {{componentName}}Props, {{componentName}}Config } from '../{{componentName}}'

describe('{{componentName}} - L1 Configured Component', () => {
  const defaultConfig: {{componentName}}Config = {
    {{defaultConfigContent}}
  }
  
  const defaultProps: {{componentName}}Props = {
    config: defaultConfig,
    {{defaultPropsContent}}
  }

  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Configuration', () => {
    it('should apply default configuration', () => {
      render(<{{componentName}} {...defaultProps} />)
      {{configurationAssertions}}
    })

    it('should merge custom config with defaults', () => {
      const customConfig = { {{customConfig}} }
      render(<{{componentName}} {...defaultProps} config={customConfig} />)
      {{customConfigAssertions}}
    })

    it('should validate configuration', () => {
      const invalidConfig = { {{invalidConfig}} }
      expect(() => render(<{{componentName}} {...defaultProps} config={invalidConfig} />))
        .toThrow('Invalid configuration')
    })
  })

  describe('L0 Primitive Composition', () => {
    it('should compose L0 primitives correctly', () => {
      render(<{{componentName}} {...defaultProps} />)
      {{primitiveCompositionAssertions}}
    })

    it('should pass props to child primitives', () => {
      render(<{{componentName}} {...defaultProps} />)
      {{primitivePropsAssertions}}
    })
  })

  describe('Enhanced Functionality', () => {
    {{enhancedFunctionalityTests}}
  })

  describe('State Management', () => {
    it('should manage internal state correctly', async () => {
      render(<{{componentName}} {...defaultProps} />)
      {{stateManagementTests}}
    })

    it('should sync state with external store', () => {
      const store = createTestStore()
      render(<{{componentName}} {...defaultProps} store={store} />)
      {{storeSync Tests}}
    })
  })

  describe('Security Features', () => {
    it('should sanitize user input', async () => {
      render(<{{componentName}} {...defaultProps} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, '<script>alert("xss")</script>')
      
      expect(input.value).not.toContain('<script>')
    })

    it('should validate permissions', () => {
      const restrictedProps = { ...defaultProps, permissions: ['read'] }
      render(<{{componentName}} {...restrictedProps} />)
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should debounce expensive operations', async () => {
      const expensiveOperation = vi.fn()
      render(<{{componentName}} {...defaultProps} onSearch={expensiveOperation} />)
      
      const input = screen.getByRole('searchbox')
      await user.type(input, 'test query')
      
      expect(expensiveOperation).not.toHaveBeenCalled()
      
      await waitFor(() => {
        expect(expensiveOperation).toHaveBeenCalledTimes(1)
        expect(expensiveOperation).toHaveBeenCalledWith('test query')
      }, { timeout: 500 })
    })

    it('should memoize computed values', () => {
      const computeSpy = vi.spyOn(console, 'log')
      const { rerender } = render(<{{componentName}} {...defaultProps} />)
      
      rerender(<{{componentName}} {...defaultProps} />)
      
      expect(computeSpy).not.toHaveBeenCalledWith('Computing expensive value')
    })
  })

  describe('Integration', () => {
    it('should integrate with theme provider', () => {
      render(
        <ThemeProvider theme="dark">
          <{{componentName}} {...defaultProps} />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('{{testId}}')).toHaveClass('dark-theme')
    })

    it('should work with form libraries', async () => {
      render(
        <Form onSubmit={vi.fn()}>
          <{{componentName}} {...defaultProps} name="field" />
        </Form>
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'form value')
      
      expect(input).toHaveAttribute('name', 'field')
    })
  })
})`

export const L1_INFRASTRUCTURE_TEMPLATE = `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { {{className}} } from '../{{className}}'
import type { {{className}}Config, {{className}}Options } from '../{{className}}'

describe('{{className}} - L1 Configured Infrastructure', () => {
  let instance: {{className}}
  const mockConfig: {{className}}Config = {
    {{mockConfigContent}}
  }
  
  const mockDependencies = {
    {{mockDependencies}}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    instance = new {{className}}(mockConfig, mockDependencies)
  })

  afterEach(async () => {
    await instance?.dispose()
  })

  describe('Configuration Management', () => {
    it('should merge configuration with defaults', () => {
      const customConfig = { {{customConfig}} }
      const customInstance = new {{className}}(customConfig, mockDependencies)
      
      expect(customInstance.getConfig()).toMatchObject({
        ...{{className}}.defaultConfig,
        ...customConfig
      })
    })

    it('should validate configuration schema', () => {
      const invalidConfig = { {{invalidConfig}} }
      
      expect(() => new {{className}}(invalidConfig as any, mockDependencies))
        .toThrow('Configuration validation failed')
    })

    it('should support runtime configuration updates', async () => {
      await instance.initialize()
      
      const newConfig = { {{updatedConfig}} }
      await instance.updateConfig(newConfig)
      
      expect(instance.getConfig()).toMatchObject(newConfig)
    })
  })

  describe('L0 Primitive Enhancement', () => {
    it('should enhance base primitive functionality', async () => {
      await instance.initialize()
      {{primitiveEnhancementTests}}
    })

    it('should maintain primitive compatibility', async () => {
      const primitive = instance.getPrimitive()
      expect(primitive).toImplementInterface('L0Primitive')
    })
  })

  describe('Security Enhancements', () => {
    it('should add authentication layer', async () => {
      const authSpy = vi.spyOn(mockDependencies.auth, 'verify')
      
      await instance.executeSecure('action', { token: 'valid-token' })
      
      expect(authSpy).toHaveBeenCalledWith('valid-token')
    })

    it('should encrypt sensitive data', async () => {
      const encryptSpy = vi.spyOn(mockDependencies.crypto, 'encrypt')
      
      await instance.storeSensitive('key', 'secret-data')
      
      expect(encryptSpy).toHaveBeenCalledWith('secret-data')
    })

    it('should implement rate limiting', async () => {
      const promises = Array(10).fill(0).map(() => 
        instance.rateLimitedOperation()
      )
      
      await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Resilience Features', () => {
    it('should retry failed operations', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary'))
        .mockRejectedValueOnce(new Error('Temporary'))
        .mockResolvedValueOnce('success')
      
      const result = await instance.executeWithRetry(operation)
      
      expect(operation).toHaveBeenCalledTimes(3)
      expect(result).toBe('success')
    })

    it('should circuit break on repeated failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service down'))
      
      // Trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await instance.executeWithCircuitBreaker(operation)
        } catch {}
      }
      
      // Circuit should be open
      await expect(instance.executeWithCircuitBreaker(operation))
        .rejects.toThrow('Circuit breaker is open')
      
      expect(operation).toHaveBeenCalledTimes(5) // Not called on open circuit
    })

    it('should handle graceful degradation', async () => {
      vi.spyOn(instance, 'isPrimaryAvailable').mockReturnValue(false)
      
      const result = await instance.executeWithFallback()
      
      expect(result).toMatchObject({
        source: 'fallback',
        degraded: true
      })
    })
  })

  describe('Monitoring & Observability', () => {
    it('should emit metrics', async () => {
      const metricsSpy = vi.fn()
      instance.on('metrics', metricsSpy)
      
      await instance.performOperation()
      
      expect(metricsSpy).toHaveBeenCalledWith(expect.objectContaining({
        operation: 'performOperation',
        duration: expect.any(Number),
        success: true
      }))
    })

    it('should provide health checks', async () => {
      const health = await instance.healthCheck()
      
      expect(health).toMatchObject({
        status: 'healthy',
        checks: {
          connection: 'ok',
          configuration: 'ok',
          dependencies: 'ok'
        }
      })
    })

    it('should log structured events', async () => {
      const logSpy = vi.spyOn(console, 'log')
      
      await instance.performOperation()
      
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/{.*"level":"info".*}/)))
    })
  })

  describe('Lifecycle Management', () => {
    it('should handle initialization lifecycle', async () => {
      const lifecycleSpy = vi.fn()
      instance.on('lifecycle', lifecycleSpy)
      
      await instance.initialize()
      
      expect(lifecycleSpy).toHaveBeenCalledWith({ phase: 'initializing' })
      expect(lifecycleSpy).toHaveBeenCalledWith({ phase: 'initialized' })
    })

    it('should clean up resources on disposal', async () => {
      await instance.initialize()
      const resources = instance.getActiveResources()
      
      await instance.dispose()
      
      expect(instance.getActiveResources()).toHaveLength(0)
      expect(instance.getStatus()).toBe('disposed')
    })
  })
})`

export const L1_TEST_GENERATORS = {
  /**
   * Generate enhanced functionality tests
   */
  generateEnhancedFunctionalityTests(features: string[]): string {
    return features.map(feature => {
      switch (feature) {
        case 'validation':
          return `
    it('should validate input according to rules', async () => {
      render(<{{componentName}} {...defaultProps} validationRules={rules} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'invalid')
      await user.tab() // Trigger validation
      
      expect(screen.getByText('Invalid input')).toBeInTheDocument()
    })`
        
        case 'autocomplete':
          return `
    it('should provide autocomplete suggestions', async () => {
      const suggestions = ['apple', 'apricot', 'avocado']
      render(<{{componentName}} {...defaultProps} suggestions={suggestions} />)
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')
      
      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument()
        expect(screen.getByText('apricot')).toBeInTheDocument()
      })
    })`
        
        case 'theming':
          return `
    it('should apply theme configuration', () => {
      const theme = { primary: '#007bff', secondary: '#6c757d' }
      render(<{{componentName}} {...defaultProps} theme={theme} />)
      
      const element = screen.getByTestId('{{testId}}')
      const styles = getComputedStyle(element)
      
      expect(styles.getPropertyValue('--primary-color')).toBe('#007bff')
    })`
        
        default:
          return ''
      }
    }).filter(Boolean).join('\n')
  },

  /**
   * Generate state management tests
   */
  generateStateTests(states: Array<{ name: string; transitions: string[] }>): string {
    return states.map(state => `
    it('should handle ${state.name} state transitions', async () => {
      render(<{{componentName}} {...defaultProps} />)
      
      ${state.transitions.map(transition => `
      // Transition: ${transition}
      await user.click(screen.getByText('${transition}'))
      expect(screen.getByTestId('state-indicator')).toHaveTextContent('${transition}')
      `).join('\n')}
    })`).join('\n')
  },

  /**
   * Generate primitive enhancement tests
   */
  generatePrimitiveEnhancementTests(enhancements: string[]): string {
    return enhancements.map(enhancement => {
      switch (enhancement) {
        case 'caching':
          return `
      const result1 = await instance.getData('key')
      const result2 = await instance.getData('key')
      
      expect(result2).toBe(result1) // Same reference, cached
      expect(mockDependencies.dataSource.fetch).toHaveBeenCalledOnce()`
        
        case 'encryption':
          return `
      await instance.storeSecure('key', 'sensitive')
      
      const stored = mockDependencies.storage.get('key')
      expect(stored).not.toBe('sensitive')
      expect(stored).toMatch(/^encrypted:/)`
        
        case 'compression':
          return `
      const largeData = 'x'.repeat(10000)
      await instance.storeLarge('key', largeData)
      
      const stored = mockDependencies.storage.getSize('key')
      expect(stored).toBeLessThan(10000)`
        
        default:
          return ''
      }
    }).filter(Boolean).join('\n\n')
  }
}