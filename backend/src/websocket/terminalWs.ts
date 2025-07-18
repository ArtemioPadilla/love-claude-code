import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { terminalService } from '../services/terminal.js'
import { verifyToken } from '../middleware/auth.js'
import url from 'url'

export function setupTerminalWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/terminal',
  })

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log('New terminal WebSocket connection')
    
    // Parse query parameters
    const query = url.parse(req.url || '', true).query
    const token = query.token as string
    
    // Verify authentication (optional for now)
    // try {
    //   await verifyToken(token)
    // } catch (error) {
    //   ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
    //   ws.close()
    //   return
    // }

    let terminalId: string | null = null

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString())
        
        switch (data.type) {
          case 'create':
            // Create new terminal
            terminalId = terminalService.createTerminal(ws)
            ws.send(JSON.stringify({
              type: 'created',
              terminalId,
            }))
            break
            
          case 'command':
            // Send command to terminal
            if (terminalId && data.command) {
              terminalService.sendCommand(terminalId, data.command)
            }
            break
            
          case 'resize':
            // Resize terminal
            if (terminalId && data.cols && data.rows) {
              terminalService.resizeTerminal(terminalId, data.cols, data.rows)
            }
            break
            
          case 'attach':
            // Attach to existing terminal
            if (data.terminalId) {
              terminalId = data.terminalId
              terminalService.attachWebSocket(terminalId, ws)
            }
            break
        }
      } catch (error) {
        console.error('Terminal WebSocket error:', error)
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }))
      }
    })

    ws.on('close', () => {
      console.log('Terminal WebSocket connection closed')
      if (terminalId) {
        // Don't kill the terminal, just detach the WebSocket
        const terminal = terminalService.getTerminal(terminalId)
        if (terminal) {
          terminal.ws = undefined
        }
      }
    })

    ws.on('error', (error) => {
      console.error('Terminal WebSocket error:', error)
    })

    // Send ready message
    ws.send(JSON.stringify({ type: 'ready' }))
  })

  return wss
}