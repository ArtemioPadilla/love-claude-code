import React from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Button Primitive Construct
 * Raw button element with no styling or features
 * Just a clickable element with text
 */
export class ButtonPrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-button-primitive',
    name: 'Button Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw button element with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'input', 'interaction'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['button', 'primitive', 'input', 'click'],
    inputs: [
      {
        name: 'text',
        type: 'string',
        description: 'Button text content',
        required: true
      },
      {
        name: 'onClick',
        type: 'function',
        description: 'Click handler function',
        required: false
      },
      {
        name: 'disabled',
        type: 'boolean',
        description: 'Whether the button is disabled',
        required: false,
        defaultValue: false
      },
      {
        name: 'type',
        type: 'string',
        description: 'Button type attribute',
        required: false,
        defaultValue: 'button',
        validation: {
          enum: ['button', 'submit', 'reset']
        }
      }
    ],
    outputs: [
      {
        name: 'buttonElement',
        type: 'HTMLButtonElement',
        description: 'The button DOM element'
      },
      {
        name: 'clickCount',
        type: 'number',
        description: 'Number of times the button has been clicked'
      },
      {
        name: 'lastClickTime',
        type: 'Date | null',
        description: 'Timestamp of the last click'
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
        title: 'Basic Button',
        description: 'Simple clickable button',
        code: `const button = new ButtonPrimitive()
await button.initialize({
  text: 'Click Me',
  onClick: () => console.log('Button clicked!')
})`,
        language: 'typescript'
      },
      {
        title: 'Submit Button',
        description: 'Form submit button',
        code: `const submitBtn = new ButtonPrimitive()
await submitBtn.initialize({
  text: 'Submit',
  type: 'submit',
  onClick: (e) => {
    e.preventDefault()
    // Handle form submission
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 StyledButton for production',
      'No visual feedback or hover states',
      'No loading states or animations',
      'Just raw HTML button functionality'
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

  private clickCount: number = 0
  private lastClickTime: Date | null = null

  constructor() {
    super(ButtonPrimitive.definition)
  }

  /**
   * Get click statistics
   */
  getClickStats() {
    return {
      clickCount: this.clickCount,
      lastClickTime: this.lastClickTime
    }
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ButtonPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the primitive
 */
const ButtonPrimitiveComponent: React.FC<{ construct: ButtonPrimitive }> = ({ construct }) => {
  const text = construct.getInput<string>('text') || ''
  const onClick = construct.getInput<() => void>('onClick')
  const disabled = construct.getInput<boolean>('disabled') || false
  const type = construct.getInput<'button' | 'submit' | 'reset'>('type') || 'button'

  React.useEffect(() => {
    // Set initial outputs
    construct['setOutput']('clickCount', construct['clickCount'])
    construct['setOutput']('lastClickTime', construct['lastClickTime'])
  }, [construct])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      construct['clickCount']++
      construct['lastClickTime'] = new Date()
      
      // Update outputs
      construct['setOutput']('clickCount', construct['clickCount'])
      construct['setOutput']('lastClickTime', construct['lastClickTime'])
      
      onClick?.(e)
    }
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      ref={(el) => {
        if (el) {
          construct['setOutput']('buttonElement', el)
        }
      }}
    >
      {text}
    </button>
  )
}

// Export factory function
export const createButtonPrimitive = () => new ButtonPrimitive()

// Export definition for catalog
export const buttonPrimitiveDefinition = ButtonPrimitive.definition