import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CodeEditorPrimitive } from '../CodeEditorPrimitive'

describe('L0: CodeEditorPrimitive', () => {
  let construct: CodeEditorPrimitive

  beforeEach(() => {
    construct = new CodeEditorPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({})
      
      expect(construct.getValue()).toBe('')
      expect(construct.metadata.id).toBe('platform-l0-code-editor-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should accept initial content', async () => {
      const initialValue = 'console.log("Hello, World!")'
      await construct.initialize({ initialValue })
      
      expect(construct.getValue()).toBe(initialValue)
    })

    it('should accept language configuration', async () => {
      await construct.initialize({ 
        language: 'python',
        initialValue: 'print("Hello")'
      })
      
      const outputs = construct.getOutputs()
      expect(outputs.value).toBe('print("Hello")')
    })

    it('should validate language enum', async () => {
      await expect(
        construct.initialize({ language: 'invalid-language' })
      ).rejects.toThrow()
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
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({})
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({})
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Editor Operations', () => {
    it('should update value when content changes', async () => {
      await construct.initialize({ initialValue: 'initial' })
      
      // This would happen through user interaction in the actual component
      construct.setValue('updated content')
      
      expect(construct.getValue()).toBe('updated content')
    })

    it('should provide access to raw editor instance', async () => {
      await construct.initialize({})
      
      // Render the component to create the editor instance
      const component = construct.render()
      render(component)
      
      // After rendering, the editor instance should be available
      const outputs = construct.getOutputs()
      expect(outputs.editorInstance).toBeDefined()
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({})
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should apply minimal styling', async () => {
      await construct.initialize({})
      
      const component = construct.render()
      const { container } = render(component)
      
      const editorContainer = container.firstChild as HTMLElement
      expect(editorContainer.style.width).toBe('100%')
      expect(editorContainer.style.height).toBe('100%')
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({})
      
      // L0 constructs have empty security array
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({})
      
      // L0 constructs don't deploy themselves
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should validate successfully with minimal checks', async () => {
      await construct.initialize({})
      
      const isValid = await construct.validate()
      expect(isValid).toBe(true)
    })
  })

  describe('Read-Only Mode', () => {
    it('should support read-only configuration', async () => {
      await construct.initialize({ 
        readOnly: true,
        initialValue: 'const readOnly = true'
      })
      
      const component = construct.render()
      render(component)
      
      // The editor should be created in read-only mode
      const outputs = construct.getOutputs()
      expect(outputs.value).toBe('const readOnly = true')
    })
  })
})