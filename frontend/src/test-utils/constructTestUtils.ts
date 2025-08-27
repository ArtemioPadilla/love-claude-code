import { vi } from 'vitest'
import { EventEmitter } from 'events'
import type { 
  ConstructMetadata, 
  ConstructSpec, 
  ConstructDependency,
  BaseConstructor,
  ConstructValidationResult
} from '../constructs/types'
import { ConstructLevel } from '../constructs/types'

/**
 * Creates a mock construct metadata object for testing
 */
export function createMockMetadata(overrides?: Partial<ConstructMetadata>): ConstructMetadata {
  return {
    id: 'test-construct',
    name: 'Test Construct',
    level: ConstructLevel.L0,
    description: 'A test construct',
    version: '1.0.0',
    author: 'test-author',
    categories: ['ui'],
    providers: ['local' as any],
    tags: [],
    ...overrides
  }
}

/**
 * Creates a mock construct spec for testing
 */
export function createMockSpec(overrides?: Partial<ConstructSpec>): ConstructSpec {
  return {
    inputs: {},
    outputs: {},
    events: {},
    methods: {},
    ...overrides
  }
}

/**
 * Creates a mock dependency for testing
 */
export function createMockDependency(overrides?: Partial<ConstructDependency>): ConstructDependency {
  return {
    id: 'dependency-construct',
    level: 'L0',
    version: '^1.0.0',
    optional: false,
    ...overrides
  }
}

/**
 * Creates a mock validation result
 */
export function createMockValidationResult(
  valid: boolean = true,
  errors: Array<{ path: string; message: string }> = []
): ConstructValidationResult {
  return {
    valid,
    errors,
    warnings: []
  }
}

/**
 * Mock base constructor for testing
 */
export class MockBaseConstruct {
  public metadata: ConstructMetadata
  public spec: ConstructSpec
  public eventEmitter: EventEmitter
  public initialized: boolean = false
  public disposed: boolean = false

  constructor(metadata?: ConstructMetadata, spec?: ConstructSpec) {
    this.metadata = metadata || createMockMetadata()
    this.spec = spec || createMockSpec()
    this.eventEmitter = new EventEmitter()
  }

  async initialize(): Promise<void> {
    this.initialized = true
    this.emit('initialized')
  }

  async dispose(): Promise<void> {
    this.disposed = true
    this.emit('disposed')
    this.eventEmitter.removeAllListeners()
  }

  emit(event: string, data?: any): void {
    this.eventEmitter.emit(event, data)
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.on(event, handler)
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.off(event, handler)
  }

  async validate(): Promise<ConstructValidationResult> {
    return createMockValidationResult(true)
  }
}

/**
 * Wait for an event to be emitted
 */
export function waitForEvent(
  emitter: EventEmitter, 
  eventName: string, 
  timeout: number = 1000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`))
    }, timeout)

    emitter.once(eventName, (data) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

/**
 * Create a spy for method calls
 */
export function spyOnMethod<T extends object>(
  obj: T, 
  methodName: keyof T
): vi.SpyInstance {
  return vi.spyOn(obj, methodName as any)
}

/**
 * Mock a construct's dependencies
 */
export function mockDependencies(
  dependencies: Record<string, any>
): Record<string, MockBaseConstruct> {
  const mocks: Record<string, MockBaseConstruct> = {}
  
  for (const [key] of Object.entries(dependencies)) {
    mocks[key] = new MockBaseConstruct(
      createMockMetadata({ id: key, name: key })
    )
  }
  
  return mocks
}

/**
 * Assert that a construct implements required methods
 */
export function assertConstructInterface(
  construct: any,
  requiredMethods: string[]
): void {
  for (const method of requiredMethods) {
    expect(construct[method]).toBeDefined()
    expect(typeof construct[method]).toBe('function')
  }
}

/**
 * Create a test harness for a construct
 */
export class ConstructTestHarness<T extends MockBaseConstruct> {
  public construct: T
  public eventSpy: vi.SpyInstance
  public events: Array<{ name: string; data: any }> = []

  constructor(ConstructClass: new (...args: any[]) => T, ...args: any[]) {
    this.construct = new ConstructClass(...args)
    this.eventSpy = vi.fn()
    
    // Capture all events
    const originalEmit = this.construct.emit.bind(this.construct)
    this.construct.emit = (event: string, data?: any) => {
      this.events.push({ name: event, data })
      this.eventSpy(event, data)
      originalEmit(event, data)
    }
  }

  async initialize(): Promise<void> {
    await this.construct.initialize()
  }

  async dispose(): Promise<void> {
    await this.construct.dispose()
  }

  getEvents(): Array<{ name: string; data: any }> {
    return [...this.events]
  }

  getEventsByName(name: string): any[] {
    return this.events
      .filter(e => e.name === name)
      .map(e => e.data)
  }

  clearEvents(): void {
    this.events = []
    this.eventSpy.mockClear()
  }

  expectEvent(name: string, data?: any): void {
    const event = this.events.find(e => e.name === name)
    expect(event).toBeDefined()
    if (data !== undefined) {
      expect(event?.data).toEqual(data)
    }
  }

  expectNoEvent(name: string): void {
    const event = this.events.find(e => e.name === name)
    expect(event).toBeUndefined()
  }
}