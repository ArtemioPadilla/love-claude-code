import React from 'react'
import { L0UIConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Chat Message Primitive Construct
 * Raw message display with no styling, avatars, or features
 * Just text and sender information
 */
export class ChatMessagePrimitive extends L0UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-chat-message-primitive',
    name: 'Chat Message Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.UI,
    description: 'Raw chat message display with no styling or features',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'chat', 'messaging'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['chat', 'message', 'primitive', 'communication'],
    inputs: [
      {
        name: 'content',
        type: 'string',
        description: 'Message content text',
        required: true
      },
      {
        name: 'sender',
        type: 'string',
        description: 'Name or ID of the message sender',
        required: true
      },
      {
        name: 'timestamp',
        type: 'Date | string',
        description: 'When the message was sent',
        required: false,
        defaultValue: new Date()
      },
      {
        name: 'isUser',
        type: 'boolean',
        description: 'Whether this message is from the current user',
        required: false,
        defaultValue: false
      }
    ],
    outputs: [
      {
        name: 'messageElement',
        type: 'HTMLElement',
        description: 'The rendered message DOM element'
      },
      {
        name: 'messageData',
        type: 'object',
        description: 'The message data object'
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
        title: 'Basic Message',
        description: 'Display a simple chat message',
        code: `const message = new ChatMessagePrimitive()
await message.initialize({
  content: 'Hello, World!',
  sender: 'User',
  isUser: true
})`,
        language: 'typescript'
      },
      {
        title: 'AI Response Message',
        description: 'Display an AI assistant message',
        code: `const aiMessage = new ChatMessagePrimitive()
await aiMessage.initialize({
  content: 'I can help you with that!',
  sender: 'Claude',
  isUser: false,
  timestamp: new Date()
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 StyledChatMessage for production',
      'No XSS protection or content sanitization at this level',
      'No markdown parsing or rich text support',
      'Just raw text display'
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
    super(ChatMessagePrimitive.definition)
  }

  /**
   * Get message data
   */
  getMessageData() {
    return {
      content: this.getInput<string>('content') || '',
      sender: this.getInput<string>('sender') || 'Unknown',
      timestamp: this.getInput<Date | string>('timestamp') || new Date(),
      isUser: this.getInput<boolean>('isUser') || false
    }
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ChatMessagePrimitiveComponent construct={this} />
  }
}

/**
 * React component wrapper for the primitive
 */
const ChatMessagePrimitiveComponent: React.FC<{ construct: ChatMessagePrimitive }> = ({ construct }) => {
  const messageData = construct.getMessageData()
  const timestamp = messageData.timestamp instanceof Date 
    ? messageData.timestamp 
    : new Date(messageData.timestamp)

  React.useEffect(() => {
    // Set outputs
    construct['setOutput']('messageData', messageData)
  }, [construct, messageData])

  // Minimal structure - just the raw message components
  return (
    <div 
      style={{ 
        marginBottom: '10px',
        textAlign: messageData.isUser ? 'right' : 'left'
      }}
      ref={(el) => {
        if (el) {
          construct['setOutput']('messageElement', el)
        }
      }}
    >
      <div style={{ fontSize: '12px', marginBottom: '2px' }}>
        {messageData.sender} - {timestamp.toLocaleTimeString()}
      </div>
      <div style={{ fontSize: '14px' }}>
        {messageData.content}
      </div>
    </div>
  )
}

// Export factory function
export const createChatMessagePrimitive = () => new ChatMessagePrimitive()

// Export definition for catalog
export const chatMessagePrimitiveDefinition = ChatMessagePrimitive.definition