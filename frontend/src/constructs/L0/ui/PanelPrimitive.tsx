import React from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Panel Primitive Construct
 * Raw container element with no styling or features
 * Just a div with optional title and content
 */
export class PanelPrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-panel-primitive',
    name: 'Panel Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw panel container with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'layout', 'container'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['panel', 'container', 'primitive', 'layout'],
    inputs: [
      {
        name: 'title',
        type: 'string',
        description: 'Optional panel title',
        required: false
      },
      {
        name: 'content',
        type: 'React.ReactNode',
        description: 'Panel content',
        required: true
      },
      {
        name: 'width',
        type: 'string',
        description: 'Panel width (CSS value)',
        required: false,
        defaultValue: '100%'
      },
      {
        name: 'height',
        type: 'string',
        description: 'Panel height (CSS value)',
        required: false,
        defaultValue: 'auto'
      }
    ],
    outputs: [
      {
        name: 'panelElement',
        type: 'HTMLElement',
        description: 'The panel container DOM element'
      },
      {
        name: 'titleElement',
        type: 'HTMLElement | null',
        description: 'The title DOM element if title is provided'
      },
      {
        name: 'contentElement',
        type: 'HTMLElement',
        description: 'The content container DOM element'
      },
      {
        name: 'dimensions',
        type: 'object',
        description: 'Current panel dimensions'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React'
    },
    examples: [
      {
        title: 'Basic Panel',
        description: 'Simple panel with content',
        code: `const panel = new PanelPrimitive()
await panel.initialize({
  content: 'Panel content goes here'
})`,
        language: 'typescript'
      },
      {
        title: 'Panel with Title',
        description: 'Panel with title and content',
        code: `const panel = new PanelPrimitive()
await panel.initialize({
  title: 'Settings',
  content: (
    <div>
      <label>Option 1</label>
      <input type="checkbox" />
    </div>
  )
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 StyledPanel for production',
      'No borders, shadows, or visual styling',
      'No collapse/expand functionality',
      'Just raw container structure'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: [],
      timeToCreate: 15,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(PanelPrimitive.definition)
  }

  /**
   * Get panel dimensions
   */
  getDimensions(): { width: string; height: string } {
    return {
      width: this.getInput<string>('width') || '100%',
      height: this.getInput<string>('height') || 'auto'
    }
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <PanelPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the primitive
 */
const PanelPrimitiveComponent: React.FC<{ construct: PanelPrimitive }> = ({ construct }) => {
  const title = construct.getInput<string>('title')
  const content = construct.getInput<React.ReactNode>('content')
  const width = construct.getInput<string>('width') || '100%'
  const height = construct.getInput<string>('height') || 'auto'

  React.useEffect(() => {
    // Set dimensions output
    construct['setOutput']('dimensions', { width, height })
  }, [construct, width, height])

  return (
    <div
      style={{
        width,
        height,
        overflow: 'auto'
      }}
      ref={(el) => {
        if (el) {
          construct['setOutput']('panelElement', el)
        }
      }}
    >
      {title && (
        <div
          ref={(el) => {
            if (el) {
              construct['setOutput']('titleElement', el)
            }
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={(el) => {
          if (el) {
            construct['setOutput']('contentElement', el)
          }
        }}
      >
        {content}
      </div>
    </div>
  )
}

// Export factory function
export const createPanelPrimitive = () => new PanelPrimitive()

// Export definition for catalog
export const panelPrimitiveDefinition = PanelPrimitive.definition