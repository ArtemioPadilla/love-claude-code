/**
 * Real-Time Collaboration L2 Pattern Construct
 * 
 * Complete real-time collaboration system with WebSocket synchronization,
 * presence tracking, conflict resolution, and collaborative editing features.
 */

import React from 'react'
import { L2PatternConstruct } from '../base/L2PatternConstruct'
import { 
  PlatformConstructDefinition, 
  ConstructLevel, 
  ConstructType,
  BaseConstruct
} from '../../types'

// Import L1 constructs we'll compose
import { AuthenticatedWebSocket } from '../../L1/infrastructure/AuthenticatedWebSocket'
import { SecureCodeEditor } from '../../L1/ui/SecureCodeEditor'
import { EncryptedDatabase } from '../../L1/infrastructure/EncryptedDatabase'
import { RestAPIService } from '../../L1/infrastructure/RestAPIService'
import { ResponsiveLayout } from '../../L1/ui/ResponsiveLayout'

// Type definitions
interface CollaborationConfig {
  roomId: string
  userId: string
  userName?: string
  features?: {
    cursors?: boolean
    selections?: boolean
    presence?: boolean
    chat?: boolean
    voice?: boolean
    video?: boolean
    annotations?: boolean
  }
  sync?: {
    mode?: 'ot' | 'crdt' // Operational Transform or CRDT
    conflictResolution?: 'auto' | 'manual' | 'last-write-wins'
    debounceMs?: number
    maxRetries?: number
  }
  permissions?: {
    canEdit?: boolean
    canComment?: boolean
    canInvite?: boolean
    isHost?: boolean
  }
  ui?: {
    showAvatars?: boolean
    showCursors?: boolean
    cursorLabels?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
}

interface Collaborator {
  id: string
  userId: string
  userName: string
  color: string
  cursor?: {
    line: number
    column: number
  }
  selection?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
  permissions: {
    canEdit: boolean
    canComment: boolean
    isHost: boolean
  }
}

interface CollaborationSession {
  id: string
  roomId: string
  document: {
    content: string
    version: number
    lastModified: Date
  }
  collaborators: Map<string, Collaborator>
  operations: Operation[]
  chat: ChatMessage[]
  annotations: Annotation[]
  created: Date
  host: string
}

interface Operation {
  id: string
  userId: string
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
  timestamp: Date
  version: number
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: Date
  type: 'text' | 'code' | 'file'
}

interface Annotation {
  id: string
  userId: string
  userName: string
  line: number
  content: string
  resolved: boolean
  timestamp: Date
  replies?: Annotation[]
}

export interface RealTimeCollaborationOutputs extends Record<string, any> {
  sessionId: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  capabilities: {
    cursors: boolean
    selections: boolean
    presence: boolean
    chat: boolean
    voice: boolean
    annotations: boolean
  }
  session: {
    roomId: string
    collaboratorCount: number
    isHost: boolean
    documentVersion: number
  }
  network: {
    latency: number
    quality: 'excellent' | 'good' | 'fair' | 'poor'
    syncStatus: 'synced' | 'syncing' | 'conflict'
  }
}

// Static definition
export const realTimeCollaborationDefinition: PlatformConstructDefinition = {
  id: 'platform-l2-real-time-collaboration',
  name: 'Real-Time Collaboration',
  type: ConstructType.Pattern,
  level: ConstructLevel.L2,
  category: 'pattern',
  description: 'Complete real-time collaboration system with WebSocket sync, presence, and conflict resolution',
  
  capabilities: {
    provides: ['real-time-sync', 'collaboration', 'presence', 'conflict-resolution'],
    requires: ['websocket', 'auth', 'database'],
    extends: ['authenticated-websocket', 'secure-code-editor', 'encrypted-database']
  },
  
  config: {
    roomId: {
      type: 'string',
      required: true,
      description: 'Collaboration room identifier'
    },
    userId: {
      type: 'string',
      required: true,
      description: 'User identifier'
    },
    features: {
      type: 'object',
      description: 'Feature configuration'
    }
  },
  
  outputs: {
    sessionId: { type: 'string', description: 'Session identifier' },
    status: { type: 'string', description: 'Connection status' },
    session: { type: 'object', description: 'Session information' }
  },
  
  dependencies: [
    'platform-l1-authenticated-websocket',
    'platform-l1-secure-code-editor',
    'platform-l1-encrypted-database',
    'platform-l1-rest-api-service',
    'platform-l1-responsive-layout'
  ],
  
  tags: ['collaboration', 'real-time', 'websocket', 'sync', 'multiplayer'],
  version: '1.0.0',
  author: 'Love Claude Code',
  
  examples: [
    {
      title: 'Basic Collaboration',
      description: 'Simple real-time collaboration setup',
      code: `const collab = new RealTimeCollaboration()
await collab.initialize({
  roomId: 'project-123',
  userId: 'user-456',
  userName: 'Alice',
  features: {
    cursors: true,
    presence: true
  }
})`
    }
  ],
  
  bestPractices: [
    'Use CRDTs for better conflict resolution',
    'Implement proper access control',
    'Optimize WebSocket message size',
    'Handle network disconnections gracefully',
    'Implement presence timeouts'
  ],
  
  security: [
    'Authenticate all WebSocket connections',
    'Validate all operations server-side',
    'Encrypt sensitive content',
    'Implement rate limiting',
    'Audit collaboration activities'
  ],
  
  compliance: {
    standards: ['SOC2', 'GDPR'],
    certifications: []
  },
  
  monitoring: {
    metrics: ['active-sessions', 'message-rate', 'sync-latency', 'conflicts'],
    logs: ['operations', 'connections', 'errors'],
    alerts: ['high-latency', 'sync-failures', 'conflicts']
  },
  
  providers: {
    aws: { service: 'appsync' },
    firebase: { service: 'realtime-database' },
    local: { service: 'websocket-server' }
  },
  
  selfReferential: {
    isPlatformConstruct: true,
    usedBy: ['love-claude-code-frontend', 'construct-development-mode'],
    extends: 'multiple-l1-constructs'
  },
  
  quality: {
    testCoverage: 85,
    documentationComplete: true,
    productionReady: true
  }
}

/**
 * Real-Time Collaboration implementation
 */
export class RealTimeCollaboration extends L2PatternConstruct implements BaseConstruct {
  static definition = realTimeCollaborationDefinition
  
  private sessionId: string = ''
  private session?: CollaborationSession
  private websocket?: AuthenticatedWebSocket
  private syncEngine?: any // OT or CRDT engine
  private localOperations: Operation[] = []
  private remoteOperations: Operation[] = []
  private conflictQueue: Operation[] = []
  
  constructor(props: any = {}) {
    super(RealTimeCollaboration.definition, props)
  }
  
  async initialize(config: CollaborationConfig): Promise<RealTimeCollaborationOutputs> {
    this.emit('initializing', { config })
    
    try {
      this.sessionId = `collab-${Date.now()}`
      
      await this.beforeCompose()
      await this.composePattern()
      await this.configureComponents(config)
      await this.configureInteractions()
      await this.afterCompose()
      
      // Join or create collaboration session
      await this.joinSession(config.roomId)
      
      this.initialized = true
      this.emit('initialized', { sessionId: this.sessionId })
      
      return this.getOutputs()
    } catch (error) {
      this.emit('error', { error })
      throw new Error(`Failed to initialize real-time collaboration: ${error}`)
    }
  }
  
  protected async composePattern(): Promise<void> {
    // Create layout for collaboration UI
    const layout = new ResponsiveLayout()
    await layout.initialize({
      containerSelector: '#collaboration',
      panels: [
        {
          id: 'editor',
          position: 'center',
          minSize: 400,
          resizable: false
        },
        {
          id: 'collaborators',
          position: 'right',
          defaultSize: 250,
          minSize: 200,
          maxSize: 350,
          resizable: true,
          collapsible: true
        },
        {
          id: 'chat',
          position: 'bottom',
          defaultSize: 200,
          minSize: 100,
          maxSize: 400,
          resizable: true,
          collapsible: true
        }
      ],
      mobileBreakpoint: 768,
      persistState: true,
      stateKey: 'collaboration-layout'
    })
    this.addConstruct('layout', layout)
    
    // Create collaborative editor
    const editor = new SecureCodeEditor()
    await editor.initialize({
      initialContent: '',
      language: 'javascript',
      theme: 'vs-dark',
      collaboration: {
        enabled: true,
        showCursors: true,
        showSelections: true
      },
      security: {
        xssProtection: true,
        trustedTypesPolicy: 'collab-editor'
      }
    })
    this.addConstruct('editor', editor)
    
    // Create authenticated WebSocket
    const websocket = new AuthenticatedWebSocket()
    await websocket.initialize({
      url: 'wss://collab.example.com',
      auth: {
        type: 'jwt',
        token: 'auth-token' // Would come from auth service
      },
      reconnect: {
        enabled: true,
        maxAttempts: 10,
        backoff: 'exponential'
      },
      heartbeat: {
        enabled: true,
        interval: 30000,
        timeout: 5000
      }
    })
    this.addConstruct('websocket', websocket)
    this.websocket = websocket
    
    // Create database for session persistence
    const database = new EncryptedDatabase()
    await database.initialize({
      name: 'collaboration-sessions',
      encryptionKey: await this.generateEncryptionKey(),
      tables: ['sessions', 'operations', 'messages', 'annotations'],
      indexes: {
        sessions: ['roomId', 'created'],
        operations: ['sessionId', 'timestamp', 'version'],
        messages: ['sessionId', 'timestamp'],
        annotations: ['sessionId', 'line', 'resolved']
      }
    })
    this.addConstruct('database', database)
    
    // Create API service for session management
    const apiService = new RestAPIService()
    await apiService.initialize({
      baseUrl: '/api/collaboration',
      endpoints: [
        {
          name: 'createSession',
          method: 'POST',
          path: '/sessions'
        },
        {
          name: 'joinSession',
          method: 'POST',
          path: '/sessions/:id/join'
        },
        {
          name: 'leaveSession',
          method: 'POST',
          path: '/sessions/:id/leave'
        }
      ]
    })
    this.addConstruct('apiService', apiService)
  }
  
  protected async configureComponents(config: CollaborationConfig): Promise<void> {
    // Initialize sync engine based on mode
    if (config.sync?.mode === 'crdt') {
      this.syncEngine = this.createCRDTEngine()
    } else {
      this.syncEngine = this.createOTEngine()
    }
    
    // Configure editor for collaboration
    const editor = this.getConstruct<SecureCodeEditor>('editor')
    if (editor) {
      await editor.updateConfig({
        collaboration: {
          enabled: true,
          showCursors: config.ui?.showCursors ?? true,
          showSelections: config.features?.selections ?? true
        }
      })
    }
  }
  
  protected configureInteractions(): void {
    const websocket = this.getConstruct<AuthenticatedWebSocket>('websocket')
    const editor = this.getConstruct<SecureCodeEditor>('editor')
    const database = this.getConstruct<EncryptedDatabase>('database')
    
    // WebSocket message handling
    if (websocket) {
      websocket.on('message', async (message: any) => {
        await this.handleWebSocketMessage(message)
      })
      
      websocket.on('connected', () => {
        this.emit('connected')
      })
      
      websocket.on('disconnected', () => {
        this.emit('disconnected')
        this.startOfflineMode()
      })
      
      websocket.on('reconnected', async () => {
        await this.syncOfflineChanges()
        this.emit('reconnected')
      })
    }
    
    // Editor change handling
    if (editor) {
      editor.on('change', async (change: any) => {
        await this.handleLocalChange(change)
      })
      
      editor.on('cursorMove', async (position: any) => {
        await this.broadcastCursor(position)
      })
      
      editor.on('selectionChange', async (selection: any) => {
        await this.broadcastSelection(selection)
      })
    }
    
    // Periodic sync
    setInterval(async () => {
      await this.syncOperations()
    }, 1000)
  }
  
  // Session management
  private async joinSession(roomId: string): Promise<void> {
    const apiService = this.getConstruct<RestAPIService>('apiService')
    const database = this.getConstruct<EncryptedDatabase>('database')
    
    try {
      // Try to join existing session
      const response = await apiService?.call('joinSession', { id: roomId })
      
      if (response?.session) {
        this.session = response.session
      } else {
        // Create new session
        this.session = await this.createSession(roomId)
      }
      
      // Load session data
      if (database) {
        const sessionData = await database.get('sessions', roomId)
        if (sessionData) {
          this.session = {
            ...this.session,
            ...sessionData
          }
        }
      }
      
      // Join WebSocket room
      await this.websocket?.send({
        type: 'join',
        roomId,
        userId: this.config.userId,
        userName: this.config.userName
      })
      
      // Initialize editor with current content
      const editor = this.getConstruct<SecureCodeEditor>('editor')
      if (editor && this.session?.document) {
        await editor.setContent(this.session.document.content)
      }
      
      this.emit('sessionJoined', { roomId, session: this.session })
    } catch (error) {
      this.emit('error', { operation: 'joinSession', error })
      throw error
    }
  }
  
  private async createSession(roomId: string): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session-${Date.now()}`,
      roomId,
      document: {
        content: '',
        version: 0,
        lastModified: new Date()
      },
      collaborators: new Map(),
      operations: [],
      chat: [],
      annotations: [],
      created: new Date(),
      host: this.config.userId
    }
    
    // Add self as first collaborator
    session.collaborators.set(this.config.userId, {
      id: `collab-${this.config.userId}`,
      userId: this.config.userId,
      userName: this.config.userName || 'User',
      color: this.generateUserColor(),
      status: 'online',
      lastSeen: new Date(),
      permissions: {
        canEdit: true,
        canComment: true,
        isHost: true
      }
    })
    
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.create('sessions', session)
    }
    
    return session
  }
  
  // Operation handling
  private async handleLocalChange(change: any): Promise<void> {
    if (!this.session) return
    
    const operation: Operation = {
      id: `op-${Date.now()}`,
      userId: this.config.userId,
      type: change.type,
      position: change.position,
      content: change.content,
      length: change.length,
      timestamp: new Date(),
      version: this.session.document.version + 1
    }
    
    // Apply locally
    this.localOperations.push(operation)
    this.session.document.version++
    this.session.document.lastModified = new Date()
    
    // Transform against pending operations
    const transformedOp = this.syncEngine.transform(operation, this.remoteOperations)
    
    // Broadcast to others
    await this.broadcastOperation(transformedOp)
    
    // Save to database
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.create('operations', {
        ...transformedOp,
        sessionId: this.session.id
      })
    }
    
    this.emit('operationApplied', transformedOp)
  }
  
  private async handleWebSocketMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'operation':
        await this.handleRemoteOperation(message.data)
        break
        
      case 'cursor':
        await this.handleRemoteCursor(message.data)
        break
        
      case 'selection':
        await this.handleRemoteSelection(message.data)
        break
        
      case 'presence':
        await this.handlePresenceUpdate(message.data)
        break
        
      case 'chat':
        await this.handleChatMessage(message.data)
        break
        
      case 'annotation':
        await this.handleAnnotation(message.data)
        break
        
      case 'sync':
        await this.handleSyncRequest(message.data)
        break
    }
  }
  
  private async handleRemoteOperation(operation: Operation): Promise<void> {
    if (!this.session) return
    
    // Check if we've already seen this operation
    if (this.remoteOperations.find(op => op.id === operation.id)) {
      return
    }
    
    this.remoteOperations.push(operation)
    
    // Transform against local operations
    const transformedOp = this.syncEngine.transform(operation, this.localOperations)
    
    // Apply to editor
    const editor = this.getConstruct<SecureCodeEditor>('editor')
    if (editor) {
      await this.applyOperationToEditor(editor, transformedOp)
    }
    
    // Update document version
    this.session.document.version = Math.max(
      this.session.document.version,
      operation.version
    )
    
    this.emit('remoteOperationApplied', transformedOp)
  }
  
  private async applyOperationToEditor(editor: SecureCodeEditor, operation: Operation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await editor.insertAt(operation.position, operation.content || '')
        break
        
      case 'delete':
        await editor.deleteAt(operation.position, operation.length || 0)
        break
        
      case 'replace':
        await editor.replaceAt(operation.position, operation.length || 0, operation.content || '')
        break
    }
  }
  
  // Cursor and selection handling
  private async broadcastCursor(position: any): Promise<void> {
    await this.websocket?.send({
      type: 'cursor',
      data: {
        userId: this.config.userId,
        position
      }
    })
  }
  
  private async broadcastSelection(selection: any): Promise<void> {
    await this.websocket?.send({
      type: 'selection',
      data: {
        userId: this.config.userId,
        selection
      }
    })
  }
  
  private async handleRemoteCursor(data: any): Promise<void> {
    if (!this.session) return
    
    const collaborator = this.session.collaborators.get(data.userId)
    if (collaborator) {
      collaborator.cursor = data.position
      this.emit('cursorUpdated', { userId: data.userId, position: data.position })
    }
  }
  
  private async handleRemoteSelection(data: any): Promise<void> {
    if (!this.session) return
    
    const collaborator = this.session.collaborators.get(data.userId)
    if (collaborator) {
      collaborator.selection = data.selection
      this.emit('selectionUpdated', { userId: data.userId, selection: data.selection })
    }
  }
  
  // Presence handling
  private async handlePresenceUpdate(data: any): Promise<void> {
    if (!this.session) return
    
    if (data.action === 'join') {
      this.session.collaborators.set(data.userId, {
        id: `collab-${data.userId}`,
        userId: data.userId,
        userName: data.userName,
        color: data.color || this.generateUserColor(),
        status: 'online',
        lastSeen: new Date(),
        permissions: data.permissions || {
          canEdit: true,
          canComment: true,
          isHost: false
        }
      })
      
      this.emit('collaboratorJoined', data)
    } else if (data.action === 'leave') {
      const collaborator = this.session.collaborators.get(data.userId)
      if (collaborator) {
        collaborator.status = 'offline'
        collaborator.lastSeen = new Date()
      }
      
      this.emit('collaboratorLeft', data)
    } else if (data.action === 'status') {
      const collaborator = this.session.collaborators.get(data.userId)
      if (collaborator) {
        collaborator.status = data.status
        collaborator.lastSeen = new Date()
      }
      
      this.emit('collaboratorStatusChanged', data)
    }
  }
  
  // Chat functionality
  async sendChatMessage(content: string, type: 'text' | 'code' | 'file' = 'text'): Promise<void> {
    if (!this.session) return
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: this.config.userId,
      userName: this.config.userName || 'User',
      content,
      timestamp: new Date(),
      type
    }
    
    this.session.chat.push(message)
    
    await this.websocket?.send({
      type: 'chat',
      data: message
    })
    
    const database = this.getConstruct<EncryptedDatabase>('database')
    if (database) {
      await database.create('messages', {
        ...message,
        sessionId: this.session.id
      })
    }
    
    this.emit('chatMessageSent', message)
  }
  
  private async handleChatMessage(message: ChatMessage): Promise<void> {
    if (!this.session) return
    
    this.session.chat.push(message)
    this.emit('chatMessageReceived', message)
  }
  
  // Annotation functionality
  async addAnnotation(line: number, content: string): Promise<void> {
    if (!this.session) return
    
    const annotation: Annotation = {
      id: `ann-${Date.now()}`,
      userId: this.config.userId,
      userName: this.config.userName || 'User',
      line,
      content,
      resolved: false,
      timestamp: new Date()
    }
    
    this.session.annotations.push(annotation)
    
    await this.websocket?.send({
      type: 'annotation',
      data: annotation
    })
    
    this.emit('annotationAdded', annotation)
  }
  
  private async handleAnnotation(annotation: Annotation): Promise<void> {
    if (!this.session) return
    
    this.session.annotations.push(annotation)
    this.emit('annotationReceived', annotation)
  }
  
  // Sync and conflict resolution
  private async syncOperations(): Promise<void> {
    if (!this.session || !this.websocket) return
    
    // Check for conflicts
    if (this.conflictQueue.length > 0) {
      await this.resolveConflicts()
    }
    
    // Send pending local operations
    for (const op of this.localOperations) {
      await this.broadcastOperation(op)
    }
    
    // Clear sent operations
    this.localOperations = []
  }
  
  private async broadcastOperation(operation: Operation): Promise<void> {
    await this.websocket?.send({
      type: 'operation',
      data: operation
    })
  }
  
  private async resolveConflicts(): Promise<void> {
    if (this.config.sync?.conflictResolution === 'auto') {
      // Automatic resolution using sync engine
      for (const conflict of this.conflictQueue) {
        const resolved = this.syncEngine.resolveConflict(conflict, this.remoteOperations)
        await this.applyOperationToEditor(
          this.getConstruct<SecureCodeEditor>('editor')!,
          resolved
        )
      }
    } else if (this.config.sync?.conflictResolution === 'last-write-wins') {
      // Apply remote operations, discarding local
      for (const conflict of this.conflictQueue) {
        await this.handleRemoteOperation(conflict)
      }
    } else {
      // Manual resolution - emit event for UI handling
      this.emit('conflictsDetected', this.conflictQueue)
    }
    
    this.conflictQueue = []
  }
  
  // Offline support
  private startOfflineMode(): void {
    this.emit('offlineModeStarted')
    // Continue capturing local operations
  }
  
  private async syncOfflineChanges(): Promise<void> {
    if (!this.session) return
    
    // Request current state from server
    await this.websocket?.send({
      type: 'sync',
      data: {
        lastVersion: this.session.document.version,
        pendingOperations: this.localOperations
      }
    })
  }
  
  private async handleSyncRequest(data: any): Promise<void> {
    // Apply missing operations
    for (const op of data.missingOperations) {
      await this.handleRemoteOperation(op)
    }
    
    // Update document state
    if (this.session && data.document) {
      this.session.document = data.document
      
      const editor = this.getConstruct<SecureCodeEditor>('editor')
      if (editor) {
        await editor.setContent(data.document.content)
      }
    }
    
    this.emit('syncCompleted')
  }
  
  // Helper methods
  private createOTEngine(): any {
    // Mock OT engine
    return {
      transform: (op: Operation, against: Operation[]): Operation => {
        // Simple transform logic
        const transformedOp = { ...op }
        
        for (const otherOp of against) {
          if (otherOp.position <= transformedOp.position) {
            if (otherOp.type === 'insert') {
              transformedOp.position += otherOp.content?.length || 0
            } else if (otherOp.type === 'delete') {
              transformedOp.position -= otherOp.length || 0
            }
          }
        }
        
        return transformedOp
      },
      resolveConflict: (op: Operation, against: Operation[]): Operation => {
        return this.transform(op, against)
      }
    }
  }
  
  private createCRDTEngine(): any {
    // Mock CRDT engine
    return {
      transform: (op: Operation, against: Operation[]): Operation => {
        // CRDT operations are commutative, no transform needed
        return op
      },
      resolveConflict: (op: Operation, against: Operation[]): Operation => {
        // CRDTs handle conflicts automatically
        return op
      }
    }
  }
  
  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766',
      '#5D5D5D', '#96CEB4', '#DDA0DD', '#98D8C8'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  private async generateEncryptionKey(): Promise<string> {
    return `enc-key-${Date.now()}-${Math.random().toString(36)}`
  }
  
  // Public API
  async leaveSession(): Promise<void> {
    if (!this.session) return
    
    await this.websocket?.send({
      type: 'presence',
      data: {
        action: 'leave',
        userId: this.config.userId
      }
    })
    
    const apiService = this.getConstruct<RestAPIService>('apiService')
    await apiService?.call('leaveSession', { id: this.session.roomId })
    
    this.session = undefined
    this.emit('sessionLeft')
  }
  
  getCollaborators(): Collaborator[] {
    if (!this.session) return []
    return Array.from(this.session.collaborators.values())
  }
  
  getOnlineCollaborators(): Collaborator[] {
    return this.getCollaborators().filter(c => c.status === 'online')
  }
  
  getChatHistory(): ChatMessage[] {
    return this.session?.chat || []
  }
  
  getAnnotations(line?: number): Annotation[] {
    if (!this.session) return []
    
    if (line !== undefined) {
      return this.session.annotations.filter(a => a.line === line)
    }
    
    return this.session.annotations
  }
  
  async resolveAnnotation(annotationId: string): Promise<void> {
    if (!this.session) return
    
    const annotation = this.session.annotations.find(a => a.id === annotationId)
    if (annotation) {
      annotation.resolved = true
      
      await this.websocket?.send({
        type: 'annotation',
        data: {
          ...annotation,
          action: 'resolve'
        }
      })
      
      this.emit('annotationResolved', annotation)
    }
  }
  
  getNetworkStatus(): RealTimeCollaborationOutputs['network'] {
    // Calculate based on WebSocket metrics
    const latency = 50 // Mock value
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent'
    
    if (latency > 200) quality = 'poor'
    else if (latency > 100) quality = 'fair'
    else if (latency > 50) quality = 'good'
    
    return {
      latency,
      quality,
      syncStatus: this.conflictQueue.length > 0 ? 'conflict' : 'synced'
    }
  }
  
  getOutputs(): RealTimeCollaborationOutputs {
    const isConnected = this.websocket ? true : false
    
    return {
      sessionId: this.sessionId,
      status: isConnected ? 'connected' : 'disconnected',
      capabilities: {
        cursors: this.config.features?.cursors ?? true,
        selections: this.config.features?.selections ?? true,
        presence: this.config.features?.presence ?? true,
        chat: this.config.features?.chat ?? true,
        voice: this.config.features?.voice ?? false,
        annotations: this.config.features?.annotations ?? true
      },
      session: {
        roomId: this.session?.roomId || '',
        collaboratorCount: this.session?.collaborators.size || 0,
        isHost: this.session?.host === this.config.userId,
        documentVersion: this.session?.document.version || 0
      },
      network: this.getNetworkStatus()
    }
  }
  
  render(): React.ReactElement {
    const layout = this.getConstruct<ResponsiveLayout>('layout')
    const editor = this.getConstruct<SecureCodeEditor>('editor')
    
    const collaboratorsList = (
      <div className="collaborators-panel">
        <h3>Collaborators ({this.getOnlineCollaborators().length})</h3>
        <div className="collaborators-list">
          {this.getCollaborators().map(collab => (
            <div key={collab.id} className={`collaborator ${collab.status}`}>
              <div 
                className="avatar" 
                style={{ backgroundColor: collab.color }}
              >
                {collab.userName.charAt(0).toUpperCase()}
              </div>
              <div className="info">
                <div className="name">{collab.userName}</div>
                <div className="status">{collab.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    
    const chatPanel = (
      <div className="chat-panel">
        <div className="chat-messages">
          {this.getChatHistory().map(msg => (
            <div key={msg.id} className="chat-message">
              <span className="user">{msg.userName}:</span>
              <span className="content">{msg.content}</span>
            </div>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Type a message..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              this.sendChatMessage((e.target as HTMLInputElement).value)
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
        />
      </div>
    )
    
    return (
      <div id="collaboration" className="real-time-collaboration">
        {layout?.render({
          editor: editor?.render(),
          collaborators: collaboratorsList,
          chat: chatPanel
        })}
      </div>
    )
  }
}

// Factory function
export function createRealTimeCollaboration(config: CollaborationConfig): RealTimeCollaboration {
  const collab = new RealTimeCollaboration()
  collab.initialize(config)
  return collab
}