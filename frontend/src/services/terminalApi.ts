export interface TerminalMessage {
  type: 'output' | 'error' | 'exit' | 'created' | 'ready' | 'cwd'
  data?: string
  terminalId?: string
  code?: number
  error?: boolean
}

export class TerminalApiService {
  private ws: WebSocket | null = null
  private terminalId: string | null = null
  private messageHandlers: ((message: TerminalMessage) => void)[] = []
  private connectPromise: Promise<void> | null = null

  constructor(private wsUrl?: string) {
    this.wsUrl = wsUrl || `ws://localhost:8001/ws/terminal`
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    if (this.connectPromise) {
      return this.connectPromise
    }

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl!)
        
        this.ws.onopen = () => {
          console.log('Terminal WebSocket connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as TerminalMessage
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse terminal message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('Terminal WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('Terminal WebSocket disconnected')
          this.ws = null
          this.terminalId = null
          this.connectPromise = null
        }
      } catch (error) {
        reject(error)
      }
    })

    return this.connectPromise
  }

  async createTerminal(): Promise<string> {
    await this.connect()
    
    return new Promise((resolve, reject) => {
      const handler = (message: TerminalMessage) => {
        if (message.type === 'created' && message.terminalId) {
          this.terminalId = message.terminalId
          this.removeMessageHandler(handler)
          resolve(message.terminalId)
        }
      }
      
      this.addMessageHandler(handler)
      this.send({ type: 'create' })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.removeMessageHandler(handler)
        reject(new Error('Terminal creation timeout'))
      }, 5000)
    })
  }

  sendCommand(command: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    this.send({
      type: 'command',
      command
    })
  }

  resize(cols: number, rows: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.send({
      type: 'resize',
      cols,
      rows
    })
  }

  addMessageHandler(handler: (message: TerminalMessage) => void): void {
    this.messageHandlers.push(handler)
  }

  removeMessageHandler(handler: (message: TerminalMessage) => void): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.terminalId = null
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private handleMessage(message: TerminalMessage): void {
    this.messageHandlers.forEach(handler => handler(message))
  }
}

export const terminalApiService = new TerminalApiService()