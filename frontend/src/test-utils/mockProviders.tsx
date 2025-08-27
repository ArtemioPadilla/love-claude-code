import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock stores
const mockEditorStore = {
  activeFile: null,
  files: [],
  setActiveFile: vi.fn(),
  updateFile: vi.fn(),
  createFile: vi.fn(),
  deleteFile: vi.fn(),
}

const mockConstructStore = {
  constructs: [],
  activeConstruct: null,
  loadConstruct: vi.fn(),
  createConstruct: vi.fn(),
  updateConstruct: vi.fn(),
  deleteConstruct: vi.fn(),
  searchConstructs: vi.fn(),
  getConstructsByLevel: vi.fn(),
}

const mockProjectStore = {
  currentProject: null,
  projects: [],
  setCurrentProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}

// Create mock context providers
const MockStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="mock-provider">
      {children}
    </div>
  )
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: {
    editor?: Partial<typeof mockEditorStore>
    construct?: Partial<typeof mockConstructStore>
    project?: Partial<typeof mockProjectStore>
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { initialState, ...renderOptions } = options || {}

  // Merge initial state with mocks
  if (initialState?.editor) {
    Object.assign(mockEditorStore, initialState.editor)
  }
  if (initialState?.construct) {
    Object.assign(mockConstructStore, initialState.construct)
  }
  if (initialState?.project) {
    Object.assign(mockProjectStore, initialState.project)
  }

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <MockStoreProvider>{children}</MockStoreProvider>
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockStores: {
      editor: mockEditorStore,
      construct: mockConstructStore,
      project: mockProjectStore
    }
  }
}

// Mock hooks
export const mockUseEditorStore = () => mockEditorStore
export const mockUseConstructStore = () => mockConstructStore
export const mockUseProjectStore = () => mockProjectStore

// Mock services
export const mockClaudeService = {
  sendMessage: vi.fn().mockResolvedValue({ response: 'Mock response' }),
  streamMessage: vi.fn().mockImplementation(async function* () {
    yield { chunk: 'Mock' }
    yield { chunk: ' streaming' }
    yield { chunk: ' response' }
  }),
  cancelStream: vi.fn(),
}

export const mockMCPService = {
  analyzeRequirements: vi.fn().mockResolvedValue({
    requirements: {
      scale: 'small',
      features: ['auth', 'database'],
      budget: 'low'
    }
  }),
  compareProviders: vi.fn().mockResolvedValue({
    recommendations: ['local', 'firebase']
  }),
  getProviderConfig: vi.fn().mockResolvedValue({
    provider: 'local',
    config: {}
  }),
}

// Mock React components
export const MockCodeEditor = vi.fn(({ value, onChange, language }) => (
  <div data-testid="mock-code-editor">
    <textarea
      data-testid="code-editor-textarea"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      data-language={language}
    />
  </div>
))

export const MockDiagram = vi.fn(({ nodes, edges, onNodesChange, onEdgesChange }) => (
  <div data-testid="mock-diagram">
    <div data-testid="nodes-count">{nodes?.length || 0} nodes</div>
    <div data-testid="edges-count">{edges?.length || 0} edges</div>
    <button 
      data-testid="add-node"
      onClick={() => onNodesChange?.([{ type: 'add', item: { id: 'new-node' } }])}
    >
      Add Node
    </button>
  </div>
))

// Utility functions for testing
export function createMockFile(overrides?: any) {
  return {
    id: 'test-file',
    name: 'test.ts',
    content: '// test content',
    language: 'typescript',
    ...overrides
  }
}

export function createMockConstruct(overrides?: any) {
  return {
    id: 'test-construct',
    name: 'Test Construct',
    type: 'primitive',
    level: 'L0',
    category: 'ui',
    version: '1.0.0',
    ...overrides
  }
}

export function createMockProject(overrides?: any) {
  return {
    id: 'test-project',
    name: 'Test Project',
    description: 'A test project',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

// Event simulation helpers
export function simulateCodeChange(element: HTMLTextAreaElement, newValue: string) {
  const event = new Event('input', { bubbles: true })
  Object.defineProperty(event, 'target', {
    value: { value: newValue },
    writable: false
  })
  element.dispatchEvent(event)
}

export function simulateDragAndDrop(
  source: HTMLElement,
  target: HTMLElement,
  dataTransfer?: any
) {
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    dataTransfer: dataTransfer || new DataTransfer()
  })
  source.dispatchEvent(dragStartEvent)

  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    dataTransfer: dataTransfer || new DataTransfer()
  })
  target.dispatchEvent(dropEvent)
}

// Re-export testing library utilities
export * from '@testing-library/react'
export { vi } from 'vitest'