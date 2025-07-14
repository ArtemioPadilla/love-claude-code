import { spawn, ChildProcess } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import WebSocket from 'ws'
import os from 'os'
import path from 'path'

interface Terminal {
  id: string
  process: ChildProcess
  ws?: WebSocket
  cwd: string
  shell: string
}

export class TerminalService {
  private terminals: Map<string, Terminal> = new Map()
  private workspacePath: string

  constructor(workspacePath?: string) {
    this.workspacePath = workspacePath || path.join(process.env.HOME || process.cwd(), '.love-claude-code', 'workspace')
  }

  createTerminal(ws?: WebSocket): string {
    const id = uuidv4()
    const shell = process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash')
    
    const terminalProcess = spawn(shell, [], {
      cwd: this.workspacePath,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
      shell: true,
    })

    const terminal: Terminal = {
      id,
      process: terminalProcess,
      ws,
      cwd: this.workspacePath,
      shell,
    }

    // Handle terminal output
    terminalProcess.stdout?.on('data', (data) => {
      if (terminal.ws?.readyState === WebSocket.OPEN) {
        terminal.ws.send(JSON.stringify({
          type: 'output',
          data: data.toString(),
        }))
      }
    })

    terminalProcess.stderr?.on('data', (data) => {
      if (terminal.ws?.readyState === WebSocket.OPEN) {
        terminal.ws.send(JSON.stringify({
          type: 'output',
          data: data.toString(),
          error: true,
        }))
      }
    })

    terminalProcess.on('exit', (code) => {
      if (terminal.ws?.readyState === WebSocket.OPEN) {
        terminal.ws.send(JSON.stringify({
          type: 'exit',
          code,
        }))
      }
      this.terminals.delete(id)
    })

    this.terminals.set(id, terminal)
    return id
  }

  sendCommand(terminalId: string, command: string): boolean {
    const terminal = this.terminals.get(terminalId)
    if (!terminal || !terminal.process.stdin) {
      return false
    }

    terminal.process.stdin.write(command + '\n')
    return true
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(terminalId)
    if (!terminal) {
      return false
    }

    // Send resize signal if supported
    if (terminal.process.kill) {
      process.kill(terminal.process.pid!, 'SIGWINCH')
    }

    return true
  }

  killTerminal(terminalId: string): boolean {
    const terminal = this.terminals.get(terminalId)
    if (!terminal) {
      return false
    }

    terminal.process.kill()
    this.terminals.delete(terminalId)
    return true
  }

  attachWebSocket(terminalId: string, ws: WebSocket): boolean {
    const terminal = this.terminals.get(terminalId)
    if (!terminal) {
      return false
    }

    terminal.ws = ws
    
    // Send current working directory
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'cwd',
        data: terminal.cwd,
      }))
    }

    return true
  }

  getTerminal(terminalId: string): Terminal | undefined {
    return this.terminals.get(terminalId)
  }

  getAllTerminals(): string[] {
    return Array.from(this.terminals.keys())
  }

  cleanup(): void {
    // Kill all terminals on cleanup
    for (const [id, terminal] of this.terminals) {
      terminal.process.kill()
    }
    this.terminals.clear()
  }
}

// Singleton instance
export const terminalService = new TerminalService()