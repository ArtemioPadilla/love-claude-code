import { createServer } from 'http'
import dotenv from 'dotenv'
import { setupTerminalWebSocket } from './websocket/terminalWs.js'

// Load environment variables
dotenv.config({ path: '../.env.local' })

const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 8001

// Create dedicated WebSocket server
const wsServer = createServer()

// Setup WebSocket for terminals
setupTerminalWebSocket(wsServer)

// Start WebSocket server
wsServer.listen(WEBSOCKET_PORT, () => {
  console.log(`🔌 WebSocket server running on ws://localhost:${WEBSOCKET_PORT}`)
  console.log(`📍 Terminal WebSocket ready at ws://localhost:${WEBSOCKET_PORT}/ws/terminal`)
})