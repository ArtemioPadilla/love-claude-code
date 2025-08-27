import React, { useEffect } from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Modal Primitive Construct
 * Raw modal/dialog display with no styling or animations
 * Just a centered overlay with content
 */
export class ModalPrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-modal-primitive',
    name: 'Modal Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw modal overlay with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'overlay', 'dialog'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['modal', 'dialog', 'primitive', 'overlay'],
    inputs: [
      {
        name: 'isOpen',
        type: 'boolean',
        description: 'Whether the modal is visible',
        required: true
      },
      {
        name: 'content',
        type: 'React.ReactNode',
        description: 'Modal content to display',
        required: true
      },
      {
        name: 'onClose',
        type: 'function',
        description: 'Callback when modal should close',
        required: false
      },
      {
        name: 'closeOnOverlayClick',
        type: 'boolean',
        description: 'Close modal when clicking overlay',
        required: false,
        defaultValue: true
      },
      {
        name: 'closeOnEscape',
        type: 'boolean',
        description: 'Close modal when pressing Escape key',
        required: false,
        defaultValue: true
      }
    ],
    outputs: [
      {
        name: 'modalElement',
        type: 'HTMLElement',
        description: 'The modal container DOM element'
      },
      {
        name: 'overlayElement',
        type: 'HTMLElement',
        description: 'The overlay DOM element'
      },
      {
        name: 'isVisible',
        type: 'boolean',
        description: 'Current visibility state'
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
        title: 'Basic Modal',
        description: 'Simple modal with text content',
        code: `const modal = new ModalPrimitive()
await modal.initialize({
  isOpen: true,
  content: 'This is a modal!',
  onClose: () => console.log('Modal closed')
})`,
        language: 'typescript'
      },
      {
        title: 'Modal with React Content',
        description: 'Modal with custom React elements',
        code: `const modal = new ModalPrimitive()
await modal.initialize({
  isOpen: true,
  content: (
    <div>
      <h2>Modal Title</h2>
      <p>Modal content goes here</p>
      <button onClick={() => modal.setInput('isOpen', false)}>
        Close
      </button>
    </div>
  )
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 StyledModal for production',
      'No animations or transitions',
      'No accessibility features (focus trap, ARIA)',
      'Just raw overlay and centered content'
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
      timeToCreate: 20,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ModalPrimitive.definition)
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ModalPrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the primitive
 */
const ModalPrimitiveComponent: React.FC<{ construct: ModalPrimitive }> = ({ construct }) => {
  const isOpen = construct.getInput<boolean>('isOpen') || false
  const content = construct.getInput<React.ReactNode>('content')
  const onClose = construct.getInput<() => void>('onClose')
  const closeOnOverlayClick = construct.getInput<boolean>('closeOnOverlayClick') ?? true
  const closeOnEscape = construct.getInput<boolean>('closeOnEscape') ?? true

  useEffect(() => {
    // Set visibility output
    construct['setOutput']('isVisible', isOpen)
  }, [construct, isOpen])

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleOverlayClick}
      ref={(el) => {
        if (el) {
          construct['setOutput']('overlayElement', el)
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          position: 'relative',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto'
        }}
        ref={(el) => {
          if (el) {
            construct['setOutput']('modalElement', el)
          }
        }}
      >
        {content}
      </div>
    </div>
  )
}

// Export factory function
export const createModalPrimitive = () => new ModalPrimitive()

// Export definition for catalog
export const modalPrimitiveDefinition = ModalPrimitive.definition