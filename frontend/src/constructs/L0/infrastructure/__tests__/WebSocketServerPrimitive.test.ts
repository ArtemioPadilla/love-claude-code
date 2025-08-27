import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WebSocketServerPrimitive } from '../WebSocketServerPrimitive'

describe('L0: WebSocketServerPrimitive', () => {
  let construct: WebSocketServerPrimitive

  beforeEach(() => {
    construct = new WebSocketServerPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required port', async () => {
      await construct.initialize({
        port: 8080
      })
      
      expect(construct.metadata.id).toBe('platform-l0-websocket-server-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default host if not provided', async () => {
      await construct.initialize({
        port: 3000
      })
      
      expect(construct.getInput('host')).toBe('0.0.0.0')
    })

    it('should accept custom host', async () => {
      await construct.initialize({
        port: 3000,
        host: 'localhost'
      })
      
      expect(construct.getInput('host')).toBe('localhost')
    })

    it('should accept callback functions', async () => {
      const onConnection = vi.fn()
      const onMessage = vi.fn()
      const onDisconnect = vi.fn()

      await construct.initialize({
        port: 8080,
        onConnection,
        onMessage,
        onDisconnect
      })
      
      expect(construct.getInput('onConnection')).toBe(onConnection)
      expect(construct.getInput('onMessage')).toBe(onMessage)
      expect(construct.getInput('onDisconnect')).toBe(onDisconnect)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ port: 8080 })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ port: 8080 })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(30)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ port: 8080 })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ port: 8080 })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Deployment', () => {
    it('should deploy successfully with port', async () => {
      await construct.initialize({ port: 8080 })
      
      await expect(construct.deploy()).resolves.not.toThrow()
      
      const outputs = construct.getOutputs()
      expect(outputs.serverId).toBeDefined()
      expect(outputs.serverId).toMatch(/^ws-server-\d+$/)
      expect(outputs.status).toBe('listening')
      expect(outputs.connections).toEqual([])
      expect(outputs.messageCount).toBe(0)
    })

    it('should fail deployment without port', async () => {
      await construct.initialize({})
      
      await expect(construct.deploy()).rejects.toThrow('Port is required')
    })

    it('should deploy with custom host', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      await construct.initialize({
        port: 3000,
        host: '127.0.0.1'
      })
      
      await construct.deploy()
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket server listening on 127.0.0.1:3000')
      consoleSpy.mockRestore()
    })
  })

  describe('Server Lifecycle', () => {
    beforeEach(async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
    })

    it('should stop a listening server', async () => {
      expect(construct.getOutputs().status).toBe('listening')
      
      await construct.stop()
      
      expect(construct.getOutputs().status).toBe('stopped')
    })

    it('should not stop an already stopped server', async () => {
      await construct.stop()
      const consoleSpy = vi.spyOn(console, 'log')
      
      await construct.stop()
      
      expect(consoleSpy).not.toHaveBeenCalledWith('WebSocket server stopped')
      consoleSpy.mockRestore()
    })

    it('should disconnect all clients when stopping', async () => {
      const onDisconnect = vi.fn()
      await construct.initialize({
        port: 8080,
        onDisconnect
      })
      await construct.deploy()

      // Connect some clients
      const client1 = construct.connect()
      const client2 = construct.connect()
      const client3 = construct.connect()

      expect(construct.getConnectedClients()).toHaveLength(3)

      await construct.stop()

      expect(construct.getConnectedClients()).toHaveLength(0)
      expect(onDisconnect).toHaveBeenCalledTimes(3)
    })
  })

  describe('Client Connections', () => {
    beforeEach(async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
    })

    it('should accept client connections', () => {
      const clientId = construct.connect()
      
      expect(clientId).toBeDefined()
      expect(clientId).toMatch(/^client-\d+-\w+$/)
      expect(construct.getOutputs().connections).toContain(clientId)
    })

    it('should accept custom client IDs', () => {
      const customId = 'custom-client-123'
      const clientId = construct.connect(customId)
      
      expect(clientId).toBe(customId)
      expect(construct.getOutputs().connections).toContain(customId)
    })

    it('should trigger connection callback', () => {
      const onConnection = vi.fn()
      construct['inputs'].onConnection = onConnection
      
      const clientId = construct.connect()
      
      expect(onConnection).toHaveBeenCalledWith(clientId)
    })

    it('should fail connection when server not listening', async () => {
      await construct.stop()
      
      expect(() => construct.connect()).toThrow('Server is not listening')
    })

    it('should track connected clients', () => {
      const client1 = construct.connect()
      const client2 = construct.connect()
      const client3 = construct.connect()
      
      const clients = construct.getConnectedClients()
      expect(clients).toHaveLength(3)
      expect(clients).toContain(client1)
      expect(clients).toContain(client2)
      expect(clients).toContain(client3)
    })

    it('should check if client is connected', () => {
      const clientId = construct.connect()
      
      expect(construct.isClientConnected(clientId)).toBe(true)
      expect(construct.isClientConnected('non-existent')).toBe(false)
    })
  })

  describe('Client Disconnections', () => {
    let clientId: string

    beforeEach(async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      clientId = construct.connect()
    })

    it('should disconnect clients', () => {
      expect(construct.isClientConnected(clientId)).toBe(true)
      
      construct.disconnect(clientId)
      
      expect(construct.isClientConnected(clientId)).toBe(false)
      expect(construct.getOutputs().connections).not.toContain(clientId)
    })

    it('should trigger disconnect callback', () => {
      const onDisconnect = vi.fn()
      construct['inputs'].onDisconnect = onDisconnect
      
      construct.disconnect(clientId)
      
      expect(onDisconnect).toHaveBeenCalledWith(clientId)
    })

    it('should handle disconnecting non-existent client', () => {
      const onDisconnect = vi.fn()
      construct['inputs'].onDisconnect = onDisconnect
      
      construct.disconnect('non-existent')
      
      expect(onDisconnect).not.toHaveBeenCalled()
    })
  })

  describe('Message Handling', () => {
    let clientId: string

    beforeEach(async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      clientId = construct.connect()
    })

    it('should receive messages from clients', () => {
      construct.receiveMessage(clientId, 'Hello Server')
      
      expect(construct.getOutputs().messageCount).toBe(1)
    })

    it('should trigger message callback', () => {
      const onMessage = vi.fn()
      construct['inputs'].onMessage = onMessage
      
      const message = { type: 'chat', text: 'Hello' }
      construct.receiveMessage(clientId, message)
      
      expect(onMessage).toHaveBeenCalledWith(clientId, message)
    })

    it('should fail receiving from non-connected client', () => {
      expect(() => {
        construct.receiveMessage('non-existent', 'message')
      }).toThrow('Client non-existent not connected')
    })

    it('should track message count', () => {
      construct.receiveMessage(clientId, 'msg1')
      construct.receiveMessage(clientId, 'msg2')
      construct.receiveMessage(clientId, 'msg3')
      
      expect(construct.getOutputs().messageCount).toBe(3)
    })

    it('should send messages to specific client', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      construct.sendToClient(clientId, 'Hello Client')
      
      expect(consoleSpy).toHaveBeenCalledWith(`Sending to ${clientId}:`, 'Hello Client')
      consoleSpy.mockRestore()
    })

    it('should fail sending to non-connected client', () => {
      expect(() => {
        construct.sendToClient('non-existent', 'message')
      }).toThrow('Client non-existent not connected')
    })

    it('should broadcast to all clients', () => {
      const client1 = clientId
      const client2 = construct.connect()
      const client3 = construct.connect()
      
      const consoleSpy = vi.spyOn(console, 'log')
      
      construct.broadcast('Broadcast message')
      
      expect(consoleSpy).toHaveBeenCalledWith(`Sending to ${client1}:`, 'Broadcast message')
      expect(consoleSpy).toHaveBeenCalledWith(`Sending to ${client2}:`, 'Broadcast message')
      expect(consoleSpy).toHaveBeenCalledWith(`Sending to ${client3}:`, 'Broadcast message')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Statistics', () => {
    beforeEach(async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
    })

    it('should provide server statistics', () => {
      const client1 = construct.connect()
      const client2 = construct.connect()
      
      construct.receiveMessage(client1, 'msg1')
      construct.receiveMessage(client1, 'msg2')
      construct.receiveMessage(client2, 'msg3')
      
      construct.sendToClient(client1, 'response1')
      construct.sendToClient(client2, 'response2')
      
      const stats = construct.getStats()
      
      expect(stats.serverId).toMatch(/^ws-server-\d+$/)
      expect(stats.status).toBe('listening')
      expect(stats.connectionCount).toBe(2)
      expect(stats.totalMessagesReceived).toBe(3)
      expect(stats.totalMessagesSent).toBe(2)
      expect(stats.uptime).toBeGreaterThan(0)
    })

    it('should show zero uptime when stopped', async () => {
      await construct.stop()
      
      const stats = construct.getStats()
      expect(stats.uptime).toBe(0)
    })

    it('should track per-client message counts', () => {
      const client1 = construct.connect()
      const client2 = construct.connect()
      
      // Client 1 sends 2 messages
      construct.receiveMessage(client1, 'msg1')
      construct.receiveMessage(client1, 'msg2')
      
      // Client 2 sends 1 message
      construct.receiveMessage(client2, 'msg3')
      
      // Server sends different amounts to each
      construct.sendToClient(client1, 'resp1')
      construct.sendToClient(client1, 'resp2')
      construct.sendToClient(client1, 'resp3')
      construct.sendToClient(client2, 'resp4')
      
      const stats = construct.getStats()
      expect(stats.totalMessagesReceived).toBe(3)
      expect(stats.totalMessagesSent).toBe(4)
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ port: 8080 })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ port: 8080 })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should have no authentication', async () => {
      await construct.initialize({ port: 8080 })
      
      // No auth methods or tokens
      expect(construct).not.toHaveProperty('authenticate')
      expect(construct).not.toHaveProperty('authorize')
      expect(construct.getInput('requireAuth')).toBeUndefined()
    })

    it('should have no error handling', async () => {
      await construct.initialize({ port: 8080 })
      
      // No error recovery or retry logic
      expect(construct).not.toHaveProperty('onError')
      expect(construct).not.toHaveProperty('retry')
    })

    it('should have no message validation', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      const clientId = construct.connect()
      
      // Should accept any message type without validation
      expect(() => construct.receiveMessage(clientId, null)).not.toThrow()
      expect(() => construct.receiveMessage(clientId, undefined)).not.toThrow()
      expect(() => construct.receiveMessage(clientId, 123)).not.toThrow()
      expect(() => construct.receiveMessage(clientId, { any: 'object' })).not.toThrow()
    })

    it('should have no rate limiting', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      const clientId = construct.connect()
      
      // Should accept unlimited messages
      for (let i = 0; i < 1000; i++) {
        construct.receiveMessage(clientId, `message ${i}`)
      }
      
      expect(construct.getOutputs().messageCount).toBe(1000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid connections', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      const clientIds: string[] = []
      for (let i = 0; i < 100; i++) {
        clientIds.push(construct.connect())
      }
      
      expect(construct.getConnectedClients()).toHaveLength(100)
      expect(new Set(clientIds).size).toBe(100) // All unique
    })

    it('should handle connection/disconnection cycles', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      const clientId = construct.connect()
      construct.disconnect(clientId)
      const newClientId = construct.connect(clientId) // Reuse same ID
      
      expect(construct.isClientConnected(newClientId)).toBe(true)
    })

    it('should handle various message types', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      const clientId = construct.connect()
      
      // Test various message types
      const messages = [
        'string message',
        123,
        true,
        null,
        undefined,
        { complex: { nested: 'object' } },
        ['array', 'of', 'items'],
        Buffer.from('binary data')
      ]
      
      messages.forEach(msg => {
        expect(() => construct.receiveMessage(clientId, msg)).not.toThrow()
      })
      
      expect(construct.getOutputs().messageCount).toBe(messages.length)
    })

    it('should handle empty broadcast with no clients', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      expect(() => construct.broadcast('message')).not.toThrow()
    })

    it('should generate consistent stats with no clients', async () => {
      await construct.initialize({ port: 8080 })
      await construct.deploy()
      
      const stats = construct.getStats()
      expect(stats.connectionCount).toBe(0)
      expect(stats.totalMessagesSent).toBe(0)
      expect(stats.totalMessagesReceived).toBe(0)
    })
  })
})