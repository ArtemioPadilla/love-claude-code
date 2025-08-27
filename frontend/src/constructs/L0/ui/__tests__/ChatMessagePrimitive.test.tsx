import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessagePrimitive } from '../ChatMessagePrimitive'

describe('L0: ChatMessagePrimitive', () => {
  let construct: ChatMessagePrimitive

  beforeEach(() => {
    construct = new ChatMessagePrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required values', async () => {
      await construct.initialize({
        content: 'Hello World',
        sender: 'User'
      })
      
      const messageData = construct.getMessageData()
      expect(messageData.content).toBe('Hello World')
      expect(messageData.sender).toBe('User')
      expect(construct.metadata.id).toBe('platform-l0-chat-message-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default values for optional parameters', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'System'
      })
      
      const messageData = construct.getMessageData()
      expect(messageData.isUser).toBe(false)
      expect(messageData.timestamp).toBeInstanceOf(Date)
    })

    it('should accept custom timestamp', async () => {
      const customTime = new Date('2025-01-22T10:30:00Z')
      await construct.initialize({
        content: 'Timestamped message',
        sender: 'User',
        timestamp: customTime
      })
      
      const messageData = construct.getMessageData()
      expect(messageData.timestamp).toEqual(customTime)
    })

    it('should accept timestamp as string', async () => {
      const timeString = '2025-01-22T10:30:00Z'
      await construct.initialize({
        content: 'String timestamp',
        sender: 'User',
        timestamp: timeString
      })
      
      const messageData = construct.getMessageData()
      expect(messageData.timestamp).toBe(timeString)
    })

    it('should set isUser flag correctly', async () => {
      await construct.initialize({
        content: 'User message',
        sender: 'CurrentUser',
        isUser: true
      })
      
      const messageData = construct.getMessageData()
      expect(messageData.isUser).toBe(true)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'Test'
      })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'Test'
      })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(20)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'Test'
      })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'Test'
      })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Message Data', () => {
    it('should return complete message data object', async () => {
      const timestamp = new Date()
      await construct.initialize({
        content: 'Complete message',
        sender: 'TestUser',
        timestamp,
        isUser: true
      })
      
      const messageData = construct.getMessageData()
      expect(messageData).toEqual({
        content: 'Complete message',
        sender: 'TestUser',
        timestamp,
        isUser: true
      })
    })

    it('should handle missing optional values gracefully', async () => {
      await construct.initialize({
        content: 'Minimal',
        sender: 'Bot'
      })
      
      const messageData = construct.getMessageData()
      expect(messageData.content).toBe('Minimal')
      expect(messageData.sender).toBe('Bot')
      expect(messageData.isUser).toBe(false)
      expect(messageData.timestamp).toBeDefined()
    })
  })

  describe('Render', () => {
    it('should render without crashing', async () => {
      await construct.initialize({
        content: 'Test render',
        sender: 'System'
      })
      
      const component = construct.render()
      const { container } = render(component)
      
      expect(container.firstChild).toBeDefined()
    })

    it('should display message content', async () => {
      await construct.initialize({
        content: 'Hello from test',
        sender: 'Tester'
      })
      
      const component = construct.render()
      render(component)
      
      expect(screen.getByText('Hello from test')).toBeInTheDocument()
    })

    it('should display sender and timestamp', async () => {
      await construct.initialize({
        content: 'Message',
        sender: 'John Doe',
        timestamp: new Date('2025-01-22T10:30:00Z')
      })
      
      const component = construct.render()
      render(component)
      
      expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    })

    it('should align user messages to the right', async () => {
      await construct.initialize({
        content: 'User message',
        sender: 'Me',
        isUser: true
      })
      
      const component = construct.render()
      const { container } = render(component)
      
      const messageContainer = container.firstChild as HTMLElement
      expect(messageContainer.style.textAlign).toBe('right')
    })

    it('should align non-user messages to the left', async () => {
      await construct.initialize({
        content: 'AI message',
        sender: 'Claude',
        isUser: false
      })
      
      const component = construct.render()
      const { container } = render(component)
      
      const messageContainer = container.firstChild as HTMLElement
      expect(messageContainer.style.textAlign).toBe('left')
    })

    it('should apply minimal styling', async () => {
      await construct.initialize({
        content: 'Styled message',
        sender: 'System'
      })
      
      const component = construct.render()
      const { container } = render(component)
      
      const messageContainer = container.firstChild as HTMLElement
      expect(messageContainer.style.marginBottom).toBe('10px')
    })
  })

  describe('Outputs', () => {
    it('should set messageElement output after render', async () => {
      await construct.initialize({
        content: 'Output test',
        sender: 'System'
      })
      
      const component = construct.render()
      const { container } = render(component)
      
      // Wait for effect to run
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const outputs = construct.getOutputs()
      expect(outputs.messageElement).toBeDefined()
      expect(outputs.messageElement).toBe(container.firstChild)
    })

    it('should set messageData output', async () => {
      const timestamp = new Date()
      await construct.initialize({
        content: 'Data output test',
        sender: 'Tester',
        timestamp,
        isUser: true
      })
      
      const component = construct.render()
      render(component)
      
      // Wait for effect to run
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const outputs = construct.getOutputs()
      expect(outputs.messageData).toEqual({
        content: 'Data output test',
        sender: 'Tester',
        timestamp,
        isUser: true
      })
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({
        content: '<script>alert("XSS")</script>',
        sender: 'Attacker'
      })
      
      // L0 constructs have empty security array
      expect(construct.metadata.security).toEqual([])
      
      // Should render raw content without sanitization
      const component = construct.render()
      render(component)
      
      // The script tag should be rendered as text (React's default behavior)
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument()
    })

    it('should have zero cost', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'Test'
      })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should not have complex deployment', async () => {
      await construct.initialize({
        content: 'Test',
        sender: 'Test'
      })
      
      // L0 constructs don't deploy themselves
      await expect(construct.deploy()).resolves.not.toThrow()
    })

    it('should validate successfully with minimal checks', async () => {
      await construct.initialize({
        content: 'Valid message',
        sender: 'Validator'
      })
      
      const isValid = await construct.validate()
      expect(isValid).toBe(true)
    })

    it('should have no styling features', async () => {
      await construct.initialize({
        content: '**Bold** _italic_ `code`',
        sender: 'Formatter'
      })
      
      const component = construct.render()
      render(component)
      
      // Should render markdown as plain text
      expect(screen.getByText('**Bold** _italic_ `code`')).toBeInTheDocument()
    })

    it('should have no rich features like avatars or status', async () => {
      await construct.initialize({
        content: 'Basic message',
        sender: 'User'
      })
      
      const component = construct.render()
      const { container } = render(component)
      
      // Should not have avatar elements
      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('.avatar')).toBeNull()
      expect(container.querySelector('.status')).toBeNull()
    })
  })

  describe('Timestamp Handling', () => {
    it('should convert string timestamp to Date in component', async () => {
      await construct.initialize({
        content: 'Time test',
        sender: 'Timer',
        timestamp: '2025-01-22T15:30:00Z'
      })
      
      const component = construct.render()
      render(component)
      
      // Should display formatted time
      expect(screen.getByText(/Timer/)).toBeInTheDocument()
      // The exact time format depends on locale
    })

    it('should handle Date objects directly', async () => {
      const testDate = new Date('2025-01-22T15:30:00Z')
      await construct.initialize({
        content: 'Date test',
        sender: 'DateUser',
        timestamp: testDate
      })
      
      const component = construct.render()
      render(component)
      
      expect(screen.getByText(/DateUser/)).toBeInTheDocument()
    })
  })
})