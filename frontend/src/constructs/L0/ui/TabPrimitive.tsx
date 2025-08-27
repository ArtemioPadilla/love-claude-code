import React, { useState } from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Tab Primitive Construct
 * Raw tabbed interface with no styling or features
 * Just clickable tab labels and content switching
 */
export class TabPrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-tab-primitive',
    name: 'Tab Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw tabbed interface with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'navigation', 'layout'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['tabs', 'navigation', 'primitive', 'layout'],
    inputs: [
      {
        name: 'tabs',
        type: 'TabDefinition[]',
        description: 'Array of tab definitions with label and content',
        required: true
      },
      {
        name: 'activeIndex',
        type: 'number',
        description: 'Initially active tab index',
        required: false,
        defaultValue: 0
      },
      {
        name: 'onTabChange',
        type: 'function',
        description: 'Callback when tab is changed',
        required: false
      }
    ],
    outputs: [
      {
        name: 'containerElement',
        type: 'HTMLElement',
        description: 'The tabs container DOM element'
      },
      {
        name: 'tabElements',
        type: 'HTMLElement[]',
        description: 'Array of tab label DOM elements'
      },
      {
        name: 'contentElement',
        type: 'HTMLElement',
        description: 'The active content DOM element'
      },
      {
        name: 'activeTabIndex',
        type: 'number',
        description: 'Currently active tab index'
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
        title: 'Basic Tabs',
        description: 'Simple tabbed interface',
        code: `const tabs = new TabPrimitive()
await tabs.initialize({
  tabs: [
    { label: 'Tab 1', content: 'Content for tab 1' },
    { label: 'Tab 2', content: 'Content for tab 2' },
    { label: 'Tab 3', content: 'Content for tab 3' }
  ]
})`,
        language: 'typescript'
      },
      {
        title: 'Tabs with React Content',
        description: 'Tabs with component content',
        code: `const tabs = new TabPrimitive()
await tabs.initialize({
  tabs: [
    { 
      label: 'Settings',
      content: <SettingsPanel />
    },
    {
      label: 'Profile',
      content: <ProfilePanel />
    }
  ],
  activeIndex: 1,
  onTabChange: (index) => console.log('Tab changed to:', index)
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 StyledTabs for production',
      'No animations or transitions',
      'No keyboard navigation',
      'Just basic tab switching functionality'
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
      timeToCreate: 25,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(TabPrimitive.definition)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <TabPrimitiveComponent construct={this} />
  }
}

/**
 * Tab definition interface
 */
interface TabDefinition {
  label: string
  content: React.ReactNode
}

/**
 * React component wrapper for the primitive
 */
const TabPrimitiveComponent: React.FC<{ construct: TabPrimitive }> = ({ construct }) => {
  const tabs = construct.getInput<TabDefinition[]>('tabs') || []
  const initialIndex = construct.getInput<number>('activeIndex') || 0
  const onTabChange = construct.getInput<(index: number) => void>('onTabChange')
  
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, Math.min(initialIndex, tabs.length - 1))
  )

  React.useEffect(() => {
    // Set active tab output
    construct['setOutput']('activeTabIndex', activeIndex)
  }, [construct, activeIndex])

  const handleTabClick = (index: number) => {
    setActiveIndex(index)
    onTabChange?.(index)
  }

  if (tabs.length === 0) {
    return <div>No tabs provided</div>
  }

  const activeTab = tabs[activeIndex]

  return (
    <div
      ref={(el) => {
        if (el) {
          construct['setOutput']('containerElement', el)
        }
      }}
    >
      {/* Tab labels */}
      <div style={{ display: 'flex' }}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            onClick={() => handleTabClick(index)}
            style={{
              padding: '10px',
              cursor: 'pointer',
              borderBottom: activeIndex === index ? '2px solid black' : 'none'
            }}
            ref={(el) => {
              if (el) {
                const tabElements = construct.getOutputs().tabElements || []
                tabElements[index] = el
                construct['setOutput']('tabElements', tabElements)
              }
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      {/* Tab content */}
      <div
        style={{ padding: '10px' }}
        ref={(el) => {
          if (el) {
            construct['setOutput']('contentElement', el)
          }
        }}
      >
        {activeTab?.content}
      </div>
    </div>
  )
}

// Export factory function
export const createTabPrimitive = () => new TabPrimitive()

// Export definition for catalog
export const tabPrimitiveDefinition = TabPrimitive.definition