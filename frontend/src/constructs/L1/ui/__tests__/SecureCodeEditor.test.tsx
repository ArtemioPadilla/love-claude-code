import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SecureCodeEditor } from '../SecureCodeEditor'

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (content: string) => {
      // Simple mock sanitization
      return content.replace(/<script[^>]*>.*?<\/script>/gi, '')
    }
  }
}))

describe('L1: SecureCodeEditor', () => {
  let construct: SecureCodeEditor

  beforeEach(() => {
    construct = new SecureCodeEditor()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.id).toBe('platform-l1-secure-code-editor')
      expect(construct.level).toBe('L1')
      expect(construct.getInput('theme')).toBe('light')
      expect(construct.getInput('enableXSSProtection')).toBe(true)
      expect(construct.getInput('enableContentSecurityPolicy')).toBe(true)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        initialValue: 'const x = 1',
        language: 'typescript',
        theme: 'dark',
        readOnly: true,
        maxLength: 5000
      })
      
      expect(construct.getInput('language')).toBe('typescript')
      expect(construct.getInput('theme')).toBe('dark')
      expect(construct.getInput('readOnly')).toBe(true)
      expect(construct.getInput('maxLength')).toBe(5000)
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

    it('should be built with L0 CodeEditorPrimitive', async () => {
      await construct.initialize({})
      
      expect(construct.getBuiltWithConstructs()).toContain('platform-l0-code-editor-primitive')
    })
  })

  describe('Security Features', () => {
    it('should have security metadata', async () => {
      await construct.initialize({})
      
      const security = construct.metadata.security
      expect(security).toBeDefined()
      expect(security.length).toBeGreaterThan(0)
      expect(security.some((s: any) => s.aspect === 'XSS Protection')).toBe(true)
      expect(security.some((s: any) => s.aspect === 'Content Security Policy')).toBe(true)
    })

    it('should detect dangerous patterns', async () => {
      await construct.initialize({
        dangerousPatterns: ['<script', 'eval(', 'innerHTML']
      })

      const { container } = render(construct.render())
      
      // Wait for editor to mount
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      // Set dangerous content
      construct.setValue('<script>alert("XSS")</script>')
      
      await waitFor(() => {
        expect(construct.getOutput('isDangerous')).toBe(true)
      })
    })

    it('should sanitize content when XSS protection is enabled', async () => {
      await construct.initialize({
        enableXSSProtection: true,
        initialValue: '<script>alert("test")</script>Normal text'
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      const sanitized = construct.getSanitizedValue()
      expect(sanitized).not.toContain('<script>')
    })

    it('should not sanitize when XSS protection is disabled', async () => {
      await construct.initialize({
        enableXSSProtection: false,
        initialValue: '<script>alert("test")</script>'
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      const value = construct.getValue()
      expect(value).toContain('<script>')
    })

    it('should provide CSP header when enabled', async () => {
      await construct.initialize({
        enableContentSecurityPolicy: true
      })

      const csp = construct.getCSPHeader()
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'none'")
    })

    it('should not provide CSP header when disabled', async () => {
      await construct.initialize({
        enableContentSecurityPolicy: false
      })

      const csp = construct.getCSPHeader()
      expect(csp).toBe('')
    })
  })

  describe('Theme Support', () => {
    it('should support light theme', async () => {
      await construct.initialize({
        theme: 'light'
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.theme-light')).toBeInTheDocument()
      })
    })

    it('should support dark theme', async () => {
      await construct.initialize({
        theme: 'dark'
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.theme-dark')).toBeInTheDocument()
      })
    })
  })

  describe('Content Management', () => {
    it('should enforce max length', async () => {
      await construct.initialize({
        maxLength: 10
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      // Try to set content longer than max
      construct.setValue('This is way too long for the limit')
      
      // Content should be truncated or rejected
      expect(construct.getValue().length).toBeLessThanOrEqual(10)
    })

    it('should track character count', async () => {
      await construct.initialize({})

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      construct.setValue('Hello World')
      
      await waitFor(() => {
        expect(construct.getOutput('characterCount')).toBe(11)
      })
    })

    it('should track line count', async () => {
      await construct.initialize({})

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      construct.setValue('Line 1\nLine 2\nLine 3')
      
      await waitFor(() => {
        expect(construct.getOutput('lineCount')).toBe(3)
      })
    })
  })

  describe('Event Handling', () => {
    it('should emit contentChanged events', async () => {
      await construct.initialize({})

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      const mockHandler = vi.fn()
      construct.on('contentChanged', mockHandler)

      construct.setValue('New content')

      await waitFor(() => {
        expect(mockHandler).toHaveBeenCalled()
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
          value: 'New content',
          characterCount: 11
        }))
      })
    })

    it('should support unsubscribing from events', async () => {
      await construct.initialize({})

      const mockHandler = vi.fn()
      const unsubscribe = construct.on('contentChanged', mockHandler)

      unsubscribe()

      construct.setValue('New content')

      await waitFor(() => {
        expect(mockHandler).not.toHaveBeenCalled()
      })
    })
  })

  describe('UI Rendering', () => {
    it('should show danger warning for dangerous content', async () => {
      await construct.initialize({
        dangerousPatterns: ['eval(']
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      construct.setValue('eval("dangerous code")')

      await waitFor(() => {
        expect(container.querySelector('.danger-warning')).toBeInTheDocument()
        expect(container.querySelector('.danger-warning')).toHaveTextContent('dangerous patterns detected')
      })
    })

    it('should show CSP indicator when enabled', async () => {
      await construct.initialize({
        enableContentSecurityPolicy: true
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.csp-indicator')).toBeInTheDocument()
        expect(container.querySelector('.csp-indicator')).toHaveTextContent('CSP Protected')
      })
    })

    it('should not show CSP indicator when disabled', async () => {
      await construct.initialize({
        enableContentSecurityPolicy: false
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.csp-indicator')).not.toBeInTheDocument()
      })
    })
  })

  describe('L1 Characteristics', () => {
    it('should have enhanced security over L0', async () => {
      await construct.initialize({})
      
      // L1 should have security features
      expect(construct.metadata.security.length).toBeGreaterThan(0)
      
      // Should have XSS protection
      expect(construct.getInput('enableXSSProtection')).toBe(true)
      
      // Should have CSP support
      expect(construct.getInput('enableContentSecurityPolicy')).toBe(true)
    })

    it('should support themes unlike L0', async () => {
      await construct.initialize({})
      
      // Should have theme input
      expect(construct.inputs.some(i => i.name === 'theme')).toBe(true)
      
      // Should support multiple themes
      const themeInput = construct.inputs.find(i => i.name === 'theme')
      expect(themeInput?.validation?.enum).toContain('light')
      expect(themeInput?.validation?.enum).toContain('dark')
    })

    it('should have input validation', async () => {
      await construct.initialize({})
      
      // Language input should have validation
      const langInput = construct.inputs.find(i => i.name === 'language')
      expect(langInput?.validation?.enum).toBeDefined()
      
      // Theme input should have validation
      const themeInput = construct.inputs.find(i => i.name === 'theme')
      expect(themeInput?.validation?.enum).toBeDefined()
    })

    it('should provide enhanced outputs', async () => {
      await construct.initialize({})
      
      // Should have more outputs than just value
      expect(construct.outputs.length).toBeGreaterThan(1)
      
      // Should include sanitized value
      expect(construct.outputs.some(o => o.name === 'sanitizedValue')).toBe(true)
      
      // Should include danger detection
      expect(construct.outputs.some(o => o.name === 'isDangerous')).toBe(true)
      
      // Should include metrics
      expect(construct.outputs.some(o => o.name === 'characterCount')).toBe(true)
    })

    it('should track enhancements', async () => {
      await construct.initialize({})
      
      const enhancements = construct.getEnhancements()
      expect(enhancements).toContain('security')
      expect(enhancements).toContain('themes')
      expect(enhancements).toContain('validation')
      expect(enhancements).toContain('metrics')
    })
  })

  describe('Read-Only Mode', () => {
    it('should support read-only mode', async () => {
      await construct.initialize({
        readOnly: true,
        initialValue: 'Read only content'
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      // Content should be displayed but not editable
      expect(construct.getValue()).toBe('Read only content')
    })
  })

  describe('Language Support', () => {
    it('should support multiple languages', async () => {
      const languages = ['javascript', 'python', 'typescript', 'html', 'css', 'json', 'markdown']
      
      for (const lang of languages) {
        const editor = new SecureCodeEditor()
        await editor.initialize({ language: lang })
        
        expect(editor.getInput('language')).toBe(lang)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      await construct.initialize({
        initialValue: ''
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      expect(construct.getValue()).toBe('')
      expect(construct.getOutput('characterCount')).toBe(0)
      expect(construct.getOutput('isDangerous')).toBe(false)
    })

    it('should handle very long content gracefully', async () => {
      await construct.initialize({
        maxLength: 1000000
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      const longContent = 'a'.repeat(100000)
      construct.setValue(longContent)
      
      expect(construct.getValue().length).toBe(100000)
      expect(construct.getOutput('characterCount')).toBe(100000)
    })

    it('should handle special characters in dangerous patterns', async () => {
      await construct.initialize({
        dangerousPatterns: ['<script>', '${', '`']
      })

      const { container } = render(construct.render())
      
      await waitFor(() => {
        expect(container.querySelector('.editor-container')).toBeInTheDocument()
      })

      construct.setValue('const template = `Hello ${name}`')
      
      await waitFor(() => {
        expect(construct.getOutput('isDangerous')).toBe(true)
      })
    })
  })
})