import React, { useState, useCallback } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L1 Diagram Toolbar Construct
 * Toolbar for diagram operations and controls
 */
export class DiagramToolbar extends L1UIConstruct {
  private tools = [
    { id: 'select', icon: '↖', label: 'Select' },
    { id: 'pan', icon: '✋', label: 'Pan' },
    { id: 'node', icon: '⬜', label: 'Add Node' },
    { id: 'edge', icon: '→', label: 'Add Edge' },
    { id: 'delete', icon: '🗑', label: 'Delete' }
  ]
  
  private layouts = [
    { id: 'force', label: 'Force Directed' },
    { id: 'hierarchical', label: 'Hierarchical' },
    { id: 'circular', label: 'Circular' },
    { id: 'grid', label: 'Grid' }
  ]
  
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-diagram-toolbar',
    name: 'Diagram Toolbar',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Comprehensive toolbar for diagram manipulation and export',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'diagram', 'toolbar'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['toolbar', 'diagram', 'controls', 'export'],
    inputs: [
      {
        name: 'orientation',
        type: 'string',
        description: 'Toolbar orientation',
        required: false,
        defaultValue: 'horizontal',
        validation: {
          enum: ['horizontal', 'vertical']
        }
      },
      {
        name: 'position',
        type: 'string',
        description: 'Toolbar position',
        required: false,
        defaultValue: 'top',
        validation: {
          enum: ['top', 'bottom', 'left', 'right']
        }
      },
      {
        name: 'activeTool',
        type: 'string',
        description: 'Currently active tool',
        required: false,
        defaultValue: 'select'
      },
      {
        name: 'selectedLayout',
        type: 'string',
        description: 'Selected layout algorithm',
        required: false,
        defaultValue: 'force'
      },
      {
        name: 'enabledTools',
        type: 'array',
        description: 'List of enabled tools',
        required: false,
        defaultValue: ['select', 'pan', 'node', 'edge', 'delete']
      },
      {
        name: 'enableLayoutSelector',
        type: 'boolean',
        description: 'Show layout selector',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableZoomControls',
        type: 'boolean',
        description: 'Show zoom controls',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableExport',
        type: 'boolean',
        description: 'Show export options',
        required: false,
        defaultValue: true
      },
      {
        name: 'exportFormats',
        type: 'array',
        description: 'Available export formats',
        required: false,
        defaultValue: ['svg', 'png', 'json']
      },
      {
        name: 'customTools',
        type: 'array',
        description: 'Additional custom tools',
        required: false,
        defaultValue: []
      },
      {
        name: 'theme',
        type: 'object',
        description: 'Visual theme configuration',
        required: false,
        defaultValue: {
          background: '#f8f9fa',
          border: '#dee2e6',
          activeColor: '#007bff',
          textColor: '#495057',
          hoverColor: '#e9ecef'
        }
      },
      {
        name: 'onToolChange',
        type: 'function',
        description: 'Callback when tool changes',
        required: false
      },
      {
        name: 'onLayoutChange',
        type: 'function',
        description: 'Callback when layout changes',
        required: false
      },
      {
        name: 'onExport',
        type: 'function',
        description: 'Callback for export action',
        required: false
      },
      {
        name: 'onZoomIn',
        type: 'function',
        description: 'Zoom in callback',
        required: false
      },
      {
        name: 'onZoomOut',
        type: 'function',
        description: 'Zoom out callback',
        required: false
      },
      {
        name: 'onZoomReset',
        type: 'function',
        description: 'Reset zoom callback',
        required: false
      }
    ],
    outputs: [
      {
        name: 'activeTool',
        type: 'string',
        description: 'Currently active tool'
      },
      {
        name: 'selectedLayout',
        type: 'string',
        description: 'Selected layout algorithm'
      },
      {
        name: 'toolbarHeight',
        type: 'number',
        description: 'Toolbar height in pixels'
      },
      {
        name: 'toolbarWidth',
        type: 'number',
        description: 'Toolbar width in pixels'
      }
    ],
    security: [
      {
        type: 'export-sanitization',
        description: 'Sanitizes exported data to prevent information leakage'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + TypeScript'
    },
    examples: [
      {
        title: 'Complete Diagram Toolbar',
        description: 'Create a full-featured diagram toolbar',
        code: `const toolbar = new DiagramToolbar()
await toolbar.initialize({
  orientation: 'horizontal',
  position: 'top',
  activeTool: 'select',
  enableLayoutSelector: true,
  enableZoomControls: true,
  enableExport: true,
  onToolChange: (tool) => {
    console.log('Active tool:', tool)
  },
  onLayoutChange: (layout) => {
    graph.setLayout(layout)
  },
  onExport: (format) => {
    diagram.export(format)
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Group related tools together',
      'Provide clear visual feedback for active state',
      'Support keyboard shortcuts',
      'Make toolbar responsive',
      'Include tooltips for all tools'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 20,
      builtWith: [],
      timeToCreate: 30,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(DiagramToolbar.definition)
  }

  protected async onInitialize(): Promise<void> {
    this.setOutput('activeTool', this.getInput('activeTool'))
    this.setOutput('selectedLayout', this.getInput('selectedLayout'))
    
    // Calculate toolbar dimensions based on orientation
    const orientation = this.getInput<string>('orientation')!
    if (orientation === 'horizontal') {
      this.setOutput('toolbarHeight', 50)
      this.setOutput('toolbarWidth', null)
    } else {
      this.setOutput('toolbarHeight', null)
      this.setOutput('toolbarWidth', 50)
    }
  }

  setActiveTool(toolId: string): void {
    this.setInput('activeTool', toolId)
    this.setOutput('activeTool', toolId)
    
    const onToolChange = this.getInput<(toolId: string) => void>('onToolChange')
    if (onToolChange) {
      onToolChange(toolId)
    }
    
    this.emit('toolChange', { tool: toolId })
  }

  setLayout(layoutId: string): void {
    this.setInput('selectedLayout', layoutId)
    this.setOutput('selectedLayout', layoutId)
    
    const onLayoutChange = this.getInput<(layoutId: string) => void>('onLayoutChange')
    if (onLayoutChange) {
      onLayoutChange(layoutId)
    }
    
    this.emit('layoutChange', { layout: layoutId })
  }

  export(format: string): void {
    const onExport = this.getInput<(format: string) => void>('onExport')
    if (onExport) {
      onExport(format)
    }
    
    this.emit('export', { format })
  }

  render(): React.ReactElement {
    return <DiagramToolbarComponent construct={this} />
  }
}

/**
 * React component for the diagram toolbar
 */
const DiagramToolbarComponent: React.FC<{ construct: DiagramToolbar }> = ({ construct }) => {
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // Get inputs
  const orientation = construct.getInput<string>('orientation')!
  const position = construct.getInput<string>('position')!
  const activeTool = construct.getInput<string>('activeTool')!
  const selectedLayout = construct.getInput<string>('selectedLayout')!
  const enabledTools = construct.getInput<string[]>('enabledTools')!
  const enableLayoutSelector = construct.getInput<boolean>('enableLayoutSelector')!
  const enableZoomControls = construct.getInput<boolean>('enableZoomControls')!
  const enableExport = construct.getInput<boolean>('enableExport')!
  const exportFormats = construct.getInput<string[]>('exportFormats')!
  const customTools = construct.getInput<any[]>('customTools') || []
  const theme = construct.getInput<any>('theme')!
  
  // Callbacks
  const onZoomIn = construct.getInput<() => void>('onZoomIn')
  const onZoomOut = construct.getInput<() => void>('onZoomOut')
  const onZoomReset = construct.getInput<() => void>('onZoomReset')
  
  // Combine standard and custom tools
  const allTools = [...construct['tools'].filter(t => enabledTools.includes(t.id)), ...customTools]
  
  // Handle tool selection
  const handleToolClick = useCallback((toolId: string) => {
    construct['setActiveTool'](toolId)
  }, [])
  
  // Handle layout change
  const handleLayoutChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    construct['setLayout'](e.target.value)
  }, [])
  
  // Handle export
  const handleExport = useCallback((format: string) => {
    construct['export'](format)
    setShowExportMenu(false)
  }, [])
  
  // Toolbar styles
  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: theme.background,
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    position: 'relative',
    ...getPositionStyles(position)
  }
  
  // Tool button styles
  const getToolButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${isActive ? theme.activeColor : theme.border}`,
    borderRadius: '4px',
    backgroundColor: isActive ? theme.activeColor : 'white',
    color: isActive ? 'white' : theme.textColor,
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  })
  
  // Render separator
  const renderSeparator = () => (
    <div style={{
      width: orientation === 'horizontal' ? '1px' : '100%',
      height: orientation === 'horizontal' ? '24px' : '1px',
      backgroundColor: theme.border,
      margin: orientation === 'horizontal' ? '0 4px' : '4px 0'
    }} />
  )
  
  return (
    <div style={toolbarStyle}>
      {/* Tool buttons */}
      {allTools.map(tool => (
        <button
          key={tool.id}
          style={getToolButtonStyle(activeTool === tool.id)}
          onClick={() => handleToolClick(tool.id)}
          title={tool.label}
          onMouseEnter={(e) => {
            if (activeTool !== tool.id) {
              e.currentTarget.style.backgroundColor = theme.hoverColor
            }
          }}
          onMouseLeave={(e) => {
            if (activeTool !== tool.id) {
              e.currentTarget.style.backgroundColor = 'white'
            }
          }}
        >
          {tool.icon}
        </button>
      ))}
      
      {/* Separator */}
      {(enableLayoutSelector || enableZoomControls || enableExport) && renderSeparator()}
      
      {/* Layout selector */}
      {enableLayoutSelector && (
        <select
          value={selectedLayout}
          onChange={handleLayoutChange}
          style={{
            padding: '6px 8px',
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            backgroundColor: 'white',
            color: theme.textColor,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {construct['layouts'].map(layout => (
            <option key={layout.id} value={layout.id}>
              {layout.label}
            </option>
          ))}
        </select>
      )}
      
      {/* Separator */}
      {enableLayoutSelector && (enableZoomControls || enableExport) && renderSeparator()}
      
      {/* Zoom controls */}
      {enableZoomControls && (
        <div style={{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: '4px'
        }}>
          <button
            style={{
              ...getToolButtonStyle(false),
              width: '30px',
              height: '30px',
              fontSize: '16px'
            }}
            onClick={() => onZoomIn && onZoomIn()}
            title="Zoom In"
          >
            +
          </button>
          <button
            style={{
              ...getToolButtonStyle(false),
              width: '30px',
              height: '30px',
              fontSize: '16px'
            }}
            onClick={() => onZoomOut && onZoomOut()}
            title="Zoom Out"
          >
            -
          </button>
          <button
            style={{
              ...getToolButtonStyle(false),
              width: '30px',
              height: '30px',
              fontSize: '12px'
            }}
            onClick={() => onZoomReset && onZoomReset()}
            title="Reset Zoom"
          >
            ⊡
          </button>
        </div>
      )}
      
      {/* Separator */}
      {enableZoomControls && enableExport && renderSeparator()}
      
      {/* Export button */}
      {enableExport && (
        <div style={{ position: 'relative' }}>
          <button
            style={getToolButtonStyle(false)}
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export"
          >
            💾
          </button>
          
          {/* Export menu */}
          {showExportMenu && (
            <div style={{
              position: 'absolute',
              top: orientation === 'horizontal' ? '100%' : 0,
              left: orientation === 'horizontal' ? 0 : '100%',
              marginTop: orientation === 'horizontal' ? '4px' : 0,
              marginLeft: orientation === 'vertical' ? '4px' : 0,
              backgroundColor: 'white',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '4px',
              zIndex: 100
            }}>
              {exportFormats.map(format => (
                <button
                  key={format}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: theme.textColor,
                    borderRadius: '2px'
                  }}
                  onClick={() => handleExport(format)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.hoverColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  Export as {format.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to get position styles
function getPositionStyles(position: string): React.CSSProperties {
  switch (position) {
    case 'top':
      return { position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)' }
    case 'bottom':
      return { position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }
    case 'left':
      return { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }
    case 'right':
      return { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }
    default:
      return {}
  }
}

// Export factory function
export const createDiagramToolbar = () => new DiagramToolbar()

// Export the definition for catalog registration
export const diagramToolbarDefinition = DiagramToolbar.definition