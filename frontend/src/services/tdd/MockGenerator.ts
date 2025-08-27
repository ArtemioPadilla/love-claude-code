/**
 * Mock Generator Service
 * Generates test data and mock objects for testing
 */

import { ConstructType, ConstructLevel } from '../../constructs/types'

export interface MockGenerationOptions {
  /** Type of data to generate */
  dataType?: 'primitive' | 'object' | 'array' | 'function' | 'class'
  /** Include edge cases */
  includeEdgeCases?: boolean
  /** Include invalid data for negative testing */
  includeInvalidData?: boolean
  /** Number of variations to generate */
  variations?: number
  /** Seed for reproducible generation */
  seed?: number
  /** Construct-specific options */
  constructType?: ConstructType
  constructLevel?: ConstructLevel
}

export interface GeneratedMock {
  /** Mock name/identifier */
  name: string
  /** Mock value */
  value: any
  /** Type of mock */
  type: string
  /** Description of what this mock tests */
  description: string
  /** Category (valid, edge-case, invalid) */
  category: 'valid' | 'edge-case' | 'invalid'
  /** Related test scenarios */
  scenarios?: string[]
}

export interface MockTemplate {
  /** Template name */
  name: string
  /** Generator function */
  generator: (options?: any) => any
  /** Supported types */
  supportedTypes: string[]
  /** Description */
  description: string
}

export class MockGenerator {
  private static seed: number = Date.now()
  private static mockTemplates: Map<string, MockTemplate> = new Map()

  static {
    // Initialize default mock templates
    this.initializeTemplates()
  }

  /**
   * Generate mocks based on type definition
   */
  static generate(
    type: string | object,
    options: MockGenerationOptions = {}
  ): GeneratedMock[] {
    const mocks: GeneratedMock[] = []
    const variations = options.variations || 3
    
    // Set seed for reproducibility
    if (options.seed) {
      this.seed = options.seed
    }

    // Generate valid mocks
    for (let i = 0; i < variations; i++) {
      mocks.push(this.generateMock(type, 'valid', i, options))
    }

    // Generate edge cases if requested
    if (options.includeEdgeCases) {
      const edgeCases = this.generateEdgeCases(type, options)
      mocks.push(...edgeCases)
    }

    // Generate invalid data if requested
    if (options.includeInvalidData) {
      const invalidCases = this.generateInvalidCases(type, options)
      mocks.push(...invalidCases)
    }

    return mocks
  }

  /**
   * Generate mock for construct
   */
  static generateConstructMock(
    constructType: ConstructType,
    constructLevel: ConstructLevel,
    options: MockGenerationOptions = {}
  ): GeneratedMock[] {
    const mocks: GeneratedMock[] = []

    switch (constructLevel) {
      case ConstructLevel.L0:
        mocks.push(...this.generateL0Mock(constructType, options))
        break
      case ConstructLevel.L1:
        mocks.push(...this.generateL1Mock(constructType, options))
        break
      case ConstructLevel.L2:
        mocks.push(...this.generateL2Mock(constructType, options))
        break
      case ConstructLevel.L3:
        mocks.push(...this.generateL3Mock(constructType, options))
        break
    }

    return mocks
  }

  /**
   * Generate a single mock
   */
  private static generateMock(
    type: string | object,
    category: GeneratedMock['category'],
    index: number,
    _options: MockGenerationOptions
  ): GeneratedMock {
    const typeStr = typeof type === 'string' ? type : type.constructor.name
    
    let value: any
    let description: string

    // Handle different types
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string':
          value = this.generateString(category, index)
          description = `${category} string value`
          break
        case 'number':
          value = this.generateNumber(category, index)
          description = `${category} number value`
          break
        case 'boolean':
          value = this.generateBoolean(category, index)
          description = `${category} boolean value`
          break
        case 'array':
          value = this.generateArray(category, index)
          description = `${category} array value`
          break
        case 'object':
          value = this.generateObject(category, index)
          description = `${category} object value`
          break
        case 'function':
          value = this.generateFunction(category, index)
          description = `${category} function mock`
          break
        case 'date':
          value = this.generateDate(category, index)
          description = `${category} date value`
          break
        case 'email':
          value = this.generateEmail(category, index)
          description = `${category} email address`
          break
        case 'url':
          value = this.generateURL(category, index)
          description = `${category} URL`
          break
        case 'uuid':
          value = this.generateUUID()
          description = `${category} UUID`
          break
        default:
          value = this.generateCustomType(type, category, index)
          description = `${category} ${type} value`
      }
    } else if (typeof type === 'object') {
      value = this.generateFromSchema(type, category, index)
      description = `${category} object matching schema`
    } else {
      value = null
      description = 'Unknown type'
    }

    return {
      name: `${typeStr}_${category}_${index}`,
      value,
      type: typeStr,
      description,
      category,
      scenarios: this.generateScenarios(typeStr, category)
    }
  }

  /**
   * Generate string values
   */
  private static generateString(category: GeneratedMock['category'], index: number): string {
    switch (category) {
      case 'valid': {
        const validStrings = [
          'Hello World',
          'Test String 123',
          'Lorem ipsum dolor sit amet',
          'user@example.com',
          'https://example.com'
        ]
        return validStrings[index % validStrings.length]
      }
      
      case 'edge-case': {
        const edgeCases = [
          '', // Empty string
          ' ', // Single space
          '   ', // Multiple spaces
          '\n\t\r', // Whitespace characters
          'a'.repeat(1000), // Very long string
          '🎉🎊🎈', // Emojis
          '<script>alert("xss")</script>', // HTML/XSS attempt
          'Robert"; DROP TABLE Students;--' // SQL injection attempt
        ]
        return edgeCases[index % edgeCases.length]
      }
      
      case 'invalid':
        return null as any // Type mismatch
    }
  }

  /**
   * Generate number values
   */
  private static generateNumber(category: GeneratedMock['category'], index: number): number {
    switch (category) {
      case 'valid': {
        const validNumbers = [0, 1, 42, 100, -50, 3.14159, 1000000]
        return validNumbers[index % validNumbers.length]
      }
      
      case 'edge-case': {
        const edgeCases = [
          0,
          -0,
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
          Number.EPSILON,
          NaN
        ]
        return edgeCases[index % edgeCases.length]
      }
      
      case 'invalid':
        return 'not a number' as any
    }
  }

  /**
   * Generate boolean values
   */
  private static generateBoolean(category: GeneratedMock['category'], index: number): boolean {
    switch (category) {
      case 'valid':
        return index % 2 === 0
      
      case 'edge-case': {
        // Truthy/falsy values
        const truthyFalsy = [1, 0, '', 'false', [], {}]
        return truthyFalsy[index % truthyFalsy.length] as any
      }
      
      case 'invalid':
        return 'true' as any // String instead of boolean
    }
  }

  /**
   * Generate array values
   */
  private static generateArray(category: GeneratedMock['category'], index: number): any[] {
    switch (category) {
      case 'valid': {
        const validArrays = [
          [1, 2, 3],
          ['a', 'b', 'c'],
          [{ id: 1 }, { id: 2 }],
          [],
          [true, false, true]
        ]
        return validArrays[index % validArrays.length]
      }
      
      case 'edge-case': {
        const edgeCases = [
          [], // Empty array
          [null], // Array with null
          [undefined], // Array with undefined
          new Array(1000), // Large sparse array
          [1, 'two', { three: 3 }, [4]], // Mixed types
          [[[[[]]]]] // Deeply nested
        ]
        return edgeCases[index % edgeCases.length]
      }
      
      case 'invalid':
        return {} as any // Object instead of array
    }
  }

  /**
   * Generate object values
   */
  private static generateObject(category: GeneratedMock['category'], index: number): object {
    switch (category) {
      case 'valid': {
        const validObjects = [
          { id: 1, name: 'Test' },
          { email: 'user@example.com', age: 25 },
          { nested: { value: 42 } },
          {},
          { items: [1, 2, 3] }
        ]
        return validObjects[index % validObjects.length]
      }
      
      case 'edge-case': {
        const edgeCases = [
          {}, // Empty object
          { [Symbol('test')]: 'symbol key' }, // Symbol key
          Object.create(null), // No prototype
          new Proxy({}, {}), // Proxy object
          { get circular() { return this } }, // Circular reference
          { ...Array(100).fill(0).reduce((acc, _, i) => ({ ...acc, [`key${i}`]: i }), {}) } // Many properties
        ]
        return edgeCases[index % edgeCases.length]
      }
      
      case 'invalid':
        return null as any
    }
  }

  /**
   * Generate function mocks
   */
  private static generateFunction(category: GeneratedMock['category'], index: number): (...args: any[]) => any {
    switch (category) {
      case 'valid': {
        const validFunctions = [
          () => 42,
          (a: number, b: number) => a + b,
          async () => 'async result',
          function named() { return 'named function' },
          (...args: any[]) => args.length
        ]
        return validFunctions[index % validFunctions.length]
      }
      
      case 'edge-case': {
        const edgeCases = [
          () => { throw new Error('Test error') },
          async () => { throw new Error('Async error') },
          () => undefined,
          () => new Promise(() => {}), // Never resolves
          function* generator() { yield 1; yield 2; }
        ]
        return edgeCases[index % edgeCases.length]
      }
      
      case 'invalid':
        return 'not a function' as any
    }
  }

  /**
   * Generate date values
   */
  private static generateDate(category: GeneratedMock['category'], index: number): Date {
    switch (category) {
      case 'valid':
        return new Date(2024 + index, index % 12, (index % 28) + 1)
      
      case 'edge-case': {
        const edgeDates = [
          new Date(0), // Epoch
          new Date('1900-01-01'),
          new Date('2099-12-31'),
          new Date('Invalid Date')
        ]
        return edgeDates[index % edgeDates.length]
      }
      
      case 'invalid':
        return 'not a date' as any
    }
  }

  /**
   * Generate email addresses
   */
  private static generateEmail(category: GeneratedMock['category'], index: number): string {
    switch (category) {
      case 'valid': {
        const validEmails = [
          'user@example.com',
          'test.user@company.co.uk',
          'name+tag@domain.org',
          '123@numbers.com'
        ]
        return validEmails[index % validEmails.length]
      }
      
      case 'edge-case': {
        const edgeEmails = [
          'a@b.c', // Minimal
          'very.long.email.address.with.many.dots@very.long.domain.name.com',
          'special!#$%&@example.com',
          '"quoted"@example.com'
        ]
        return edgeEmails[index % edgeEmails.length]
      }
      
      case 'invalid': {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user@@example.com'
        ]
        return invalidEmails[index % invalidEmails.length]
      }
    }
  }

  /**
   * Generate URLs
   */
  private static generateURL(category: GeneratedMock['category'], index: number): string {
    switch (category) {
      case 'valid': {
        const validURLs = [
          'https://example.com',
          'http://localhost:3000',
          'https://api.example.com/v1/users',
          'https://example.com/path?query=value'
        ]
        return validURLs[index % validURLs.length]
      }
      
      case 'edge-case': {
        const edgeURLs = [
          'https://localhost',
          'ftp://files.example.com',
          'https://example.com:8080',
          'https://sub.sub.sub.example.com/very/long/path/to/resource?with=many&query=params'
        ]
        return edgeURLs[index % edgeURLs.length]
      }
      
      case 'invalid': {
        const invalidURLs = [
          'not a url',
          'http://',
          '//example.com',
          'example.com'
        ]
        return invalidURLs[index % invalidURLs.length]
      }
    }
  }

  /**
   * Generate UUID
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (this.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Generate edge cases for a type
   */
  private static generateEdgeCases(type: string | object, _options: MockGenerationOptions): GeneratedMock[] {
    const edgeCases: GeneratedMock[] = []
    const typeStr = typeof type === 'string' ? type : 'object'

    // Common edge cases
    edgeCases.push({
      name: `${typeStr}_null`,
      value: null,
      type: typeStr,
      description: 'Null value',
      category: 'edge-case'
    })

    edgeCases.push({
      name: `${typeStr}_undefined`,
      value: undefined,
      type: typeStr,
      description: 'Undefined value',
      category: 'edge-case'
    })

    return edgeCases
  }

  /**
   * Generate invalid cases for negative testing
   */
  private static generateInvalidCases(type: string | object, _options: MockGenerationOptions): GeneratedMock[] {
    const invalidCases: GeneratedMock[] = []
    const typeStr = typeof type === 'string' ? type : 'object'

    // Type mismatches
    const typeMismatches = {
      string: [123, true, {}, []],
      number: ['abc', true, {}, []],
      boolean: ['true', 1, {}, []],
      array: [{}, 'array', 123, true],
      object: [[], 'object', 123, true]
    }

    if (typeStr in typeMismatches) {
      typeMismatches[typeStr as keyof typeof typeMismatches].forEach((value, index) => {
        invalidCases.push({
          name: `${typeStr}_type_mismatch_${index}`,
          value,
          type: typeStr,
          description: `Type mismatch: ${typeof value} instead of ${typeStr}`,
          category: 'invalid'
        })
      })
    }

    return invalidCases
  }

  /**
   * Generate mock from schema
   */
  private static generateFromSchema(schema: any, category: GeneratedMock['category'], index: number): any {
    if (category === 'invalid') {
      return null
    }

    const result: any = {}

    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'string') {
        result[key] = this.generateMock(value, category, index, {}).value
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.generateFromSchema(value, category, index)
      }
    }

    return result
  }

  /**
   * Generate custom type mock
   */
  private static generateCustomType(type: string, category: GeneratedMock['category'], index: number): any {
    // Check if we have a template for this type
    const template = this.mockTemplates.get(type)
    if (template) {
      return template.generator({ category, index })
    }

    // Default to string representation
    return `${type}_${category}_${index}`
  }

  /**
   * Generate test scenarios
   */
  private static generateScenarios(type: string, category: GeneratedMock['category']): string[] {
    const scenarios: string[] = []

    switch (category) {
      case 'valid':
        scenarios.push(`Should handle valid ${type} input`)
        scenarios.push(`Should process ${type} correctly`)
        break
      
      case 'edge-case':
        scenarios.push(`Should handle edge case ${type} values`)
        scenarios.push(`Should not break with unusual ${type} input`)
        break
      
      case 'invalid':
        scenarios.push(`Should reject invalid ${type} input`)
        scenarios.push(`Should provide meaningful error for wrong ${type} type`)
        break
    }

    return scenarios
  }

  /**
   * Generate L0 construct mock
   */
  private static generateL0Mock(constructType: ConstructType, _options: MockGenerationOptions): GeneratedMock[] {
    const mocks: GeneratedMock[] = []

    if (constructType === ConstructType.UI) {
      mocks.push({
        name: 'button_primitive_mock',
        value: {
          type: 'button',
          props: {
            onClick: () => {},
            children: 'Click me',
            disabled: false
          }
        },
        type: 'L0_UI_Primitive',
        description: 'Mock button primitive',
        category: 'valid'
      })
    } else if (constructType === ConstructType.INFRASTRUCTURE) {
      mocks.push({
        name: 'websocket_primitive_mock',
        value: {
          connect: () => Promise.resolve(),
          send: (data: any) => {},
          close: () => {},
          onMessage: (callback: (...args: any[]) => void) => {},
          state: 'disconnected'
        },
        type: 'L0_Infrastructure_Primitive',
        description: 'Mock WebSocket primitive',
        category: 'valid'
      })
    }

    return mocks
  }

  /**
   * Generate L1 construct mock
   */
  private static generateL1Mock(constructType: ConstructType, _options: MockGenerationOptions): GeneratedMock[] {
    const mocks: GeneratedMock[] = []

    if (constructType === ConstructType.UI) {
      mocks.push({
        name: 'secure_editor_mock',
        value: {
          value: 'console.log("Hello World")',
          language: 'javascript',
          theme: 'dark',
          onChange: (value: string) => {},
          validation: {
            enabled: true,
            rules: ['no-eval', 'no-alert']
          }
        },
        type: 'L1_UI_Component',
        description: 'Mock secure code editor',
        category: 'valid'
      })
    }

    return mocks
  }

  /**
   * Generate L2 construct mock
   */
  private static generateL2Mock(constructType: ConstructType, _options: MockGenerationOptions): GeneratedMock[] {
    const mocks: GeneratedMock[] = []

    mocks.push({
      name: 'ide_workspace_pattern_mock',
      value: {
        editor: { /* editor mock */ },
        fileExplorer: { /* file explorer mock */ },
        terminal: { /* terminal mock */ },
        chat: { /* chat mock */ },
        layout: 'default',
        theme: 'dark'
      },
      type: 'L2_Pattern',
      description: 'Mock IDE workspace pattern',
      category: 'valid'
    })

    return mocks
  }

  /**
   * Generate L3 construct mock
   */
  private static generateL3Mock(constructType: ConstructType, _options: MockGenerationOptions): GeneratedMock[] {
    const mocks: GeneratedMock[] = []

    mocks.push({
      name: 'love_claude_code_platform_mock',
      value: {
        frontend: { /* frontend mock */ },
        backend: { /* backend mock */ },
        mcp: { /* MCP server mock */ },
        deployment: {
          provider: 'local',
          status: 'ready'
        }
      },
      type: 'L3_Application',
      description: 'Mock Love Claude Code platform',
      category: 'valid'
    })

    return mocks
  }

  /**
   * Initialize default mock templates
   */
  private static initializeTemplates(): void {
    // Add common mock templates
    this.mockTemplates.set('react-component', {
      name: 'React Component',
      generator: (_options) => ({
        render: () => '<div>Mock Component</div>',
        props: {},
        state: {}
      }),
      supportedTypes: ['component', 'react'],
      description: 'Mock React component'
    })

    this.mockTemplates.set('api-response', {
      name: 'API Response',
      generator: (_options) => ({
        status: 200,
        data: { id: 1, message: 'Success' },
        headers: { 'content-type': 'application/json' }
      }),
      supportedTypes: ['api', 'response'],
      description: 'Mock API response'
    })

    this.mockTemplates.set('async-function', {
      name: 'Async Function',
      generator: (_options) => async (...args: any[]) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { args, result: 'async result' }
      },
      supportedTypes: ['async', 'promise'],
      description: 'Mock async function'
    })
  }

  /**
   * Register custom mock template
   */
  static registerTemplate(template: MockTemplate): void {
    this.mockTemplates.set(template.name, template)
  }

  /**
   * Seeded random number generator
   */
  private static random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  /**
   * Generate mock data for testing a specific function
   */
  static generateForFunction(
    functionName: string,
    paramTypes: string[],
    options: MockGenerationOptions = {}
  ): { inputs: any[], expectedOutputs?: any[] } {
    const inputs: any[] = []
    
    // Generate different combinations of parameters
    const combinations = Math.pow(3, paramTypes.length) // valid, edge, invalid for each param
    
    for (let i = 0; i < Math.min(combinations, 10); i++) {
      const params: any[] = []
      
      paramTypes.forEach((type, _index) => {
        const category = ['valid', 'edge-case', 'invalid'][i % 3] as GeneratedMock['category']
        const mock = this.generateMock(type, category, i, options)
        params.push(mock.value)
      })
      
      inputs.push(params)
    }

    return { inputs }
  }
}