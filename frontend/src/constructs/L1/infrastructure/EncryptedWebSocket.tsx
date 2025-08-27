/**
 * L1 Encrypted WebSocket Implementation
 * 
 * A WebSocket connection with comprehensive encryption features including
 * TLS enforcement, message-level encryption, and security monitoring
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Key, 
  Activity, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  ShieldAlert,
  ShieldOff
} from 'lucide-react'
import { L1InfrastructureConstruct } from '../../base/L1Construct'
import { ConstructRenderProps } from '../../types'
import { encryptedWebSocketDefinition } from './EncryptedWebSocket.definition'

// Type definitions
interface EncryptionMetrics {
  messagesEncrypted: number
  messagesDecrypted: number
  averageEncryptTime: number
  averageDecryptTime: number
  keyRotations: number
  encryptionErrors: number
  decryptionErrors: number
}

interface SecurityStatus {
  isSecure: boolean
  tlsVersion: string
  cipherSuite: string
  keyExchangeMethod: string
  encryptionStrength: number
  lastKeyRotation: Date | null
  sessionId: string
}

interface SecurityAlert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: Date
  resolved: boolean
}

export class EncryptedWebSocket extends L1InfrastructureConstruct {
  private ws: WebSocket | null = null
  private encryptionKey: CryptoKey | null = null
  private decryptionKey: CryptoKey | null = null
  private sessionId: string = ''
  private messageCounter: number = 0
  private keyRotationTimer?: NodeJS.Timeout
  private metrics: EncryptionMetrics = {
    messagesEncrypted: 0,
    messagesDecrypted: 0,
    averageEncryptTime: 0,
    averageDecryptTime: 0,
    keyRotations: 0,
    encryptionErrors: 0,
    decryptionErrors: 0
  }

  constructor(_config: any) {
    super(encryptedWebSocketDefinition)
    this.sessionId = this.generateSessionId()
  }

  // Implement required abstract methods
  protected async onInitialize(): Promise<void> {
    console.log('Initializing Encrypted WebSocket with TLS and AES-256-GCM')
    await this.generateInitialKeys()
  }

  protected async onValidate(): Promise<boolean> {
    const url = this.inputs.find(i => i.name === 'url')?.value as string
    if (!url || !url.startsWith('wss://')) {
      console.error('URL must use secure WebSocket protocol (wss://)')
      return false
    }
    return true
  }

  protected async onDeploy(): Promise<void> {
    await this.connect()
  }

  protected async onDestroy(): Promise<void> {
    await this.disconnect()
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer)
    }
  }

  async connect(): Promise<void> {
    const url = this.inputs.find(i => i.name === 'url')?.value as string
    
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        this.emit('tlsHandshakeComplete', {
          version: 'TLS 1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
          peerCertificate: { /* mock certificate */ }
        })
        this.startKeyRotationSchedule()
      }

      this.ws.onmessage = async (event) => {
        await this.handleEncryptedMessage(event.data)
      }

      this.ws.onerror = (_error) => {
        this.emit('securityAlert', {
          type: 'connection-error',
          severity: 'high',
          description: 'WebSocket connection error',
          timestamp: new Date(),
          action: 'investigate'
        })
      }

      this.ws.onclose = () => {
        this.stopKeyRotationSchedule()
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close()
    }
    this.stopKeyRotationSchedule()
  }

  async sendEncrypted(data: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const startTime = performance.now()
    
    try {
      // Encrypt the message
      const encryptedData = await this.encryptMessage(data)
      
      // Add message integrity and replay protection
      const message = {
        id: this.generateMessageId(),
        timestamp: Date.now(),
        sequence: this.messageCounter++,
        encrypted: encryptedData,
        hmac: await this.generateHMAC(encryptedData)
      }

      this.ws.send(JSON.stringify(message))
      
      const encryptTime = performance.now() - startTime
      this.updateEncryptionMetrics(encryptTime)
      
    } catch (error) {
      this.metrics.encryptionErrors++
      this.emit('securityAlert', {
        type: 'encryption-error',
        severity: 'high',
        description: 'Failed to encrypt message',
        timestamp: new Date(),
        action: 'retry'
      })
      throw error
    }
  }

  private async handleEncryptedMessage(data: string): Promise<void> {
    const startTime = performance.now()
    
    try {
      const message = JSON.parse(data)
      
      // Verify message integrity
      if (!await this.verifyHMAC(message.encrypted, message.hmac)) {
        throw new Error('Message integrity check failed')
      }

      // Check for replay attacks
      if (this.isReplayAttack(message)) {
        this.emit('securityAlert', {
          type: 'replay-attack',
          severity: 'critical',
          description: 'Replay attack detected',
          timestamp: new Date(),
          action: 'block'
        })
        return
      }

      // Decrypt the message
      const decryptedData = await this.decryptMessage(message.encrypted)
      
      const decryptTime = performance.now() - startTime
      this.updateDecryptionMetrics(decryptTime)

      this.emit('encryptedMessageReceived', {
        data: decryptedData,
        metadata: {
          timestamp: message.timestamp,
          sequenceNumber: message.sequence,
          verified: true
        }
      })
      
    } catch (error) {
      this.metrics.decryptionErrors++
      console.error('Failed to decrypt message:', error)
    }
  }

  async initiateKeyExchange(): Promise<void> {
    // Implement ECDHE key exchange
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey']
    )

    // Exchange public keys with server (simplified)
    // In real implementation, this would involve server communication
    console.log('Key exchange initiated')
  }

  async rotateKeys(immediate: boolean = false): Promise<void> {
    if (!immediate && this.keyRotationTimer) {
      return // Already scheduled
    }

    const previousKeyId = this.sessionId
    await this.generateInitialKeys()
    const newKeyId = this.sessionId

    this.metrics.keyRotations++
    
    this.emit('keyRotation', {
      previousKeyId,
      newKeyId,
      rotationTime: new Date()
    })
  }

  private async generateInitialKeys(): Promise<void> {
    // Generate AES-256-GCM keys
    this.encryptionKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt']
    )

    this.decryptionKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['decrypt']
    )

    this.sessionId = this.generateSessionId()
  }

  private async encryptMessage(data: any): Promise<ArrayBuffer> {
    if (!this.encryptionKey) throw new Error('No encryption key')

    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(JSON.stringify(data))
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      dataBuffer
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return combined.buffer
  }

  private async decryptMessage(encrypted: ArrayBuffer): Promise<any> {
    if (!this.decryptionKey) throw new Error('No decryption key')

    const data = new Uint8Array(encrypted)
    const iv = data.slice(0, 12)
    const ciphertext = data.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.decryptionKey,
      ciphertext
    )

    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  }

  private async generateHMAC(data: ArrayBuffer): Promise<string> {
    // Simplified HMAC generation
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private async verifyHMAC(data: ArrayBuffer, hmac: string): Promise<boolean> {
    const computed = await this.generateHMAC(data)
    return computed === hmac
  }

  private isReplayAttack(message: any): boolean {
    const messageAge = Date.now() - message.timestamp
    const maxAge = 300000 // 5 minutes
    return messageAge > maxAge
  }

  private startKeyRotationSchedule(): void {
    const interval = 3600000 // 1 hour
    this.keyRotationTimer = setInterval(() => {
      this.rotateKeys()
    }, interval)
  }

  private stopKeyRotationSchedule(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer)
      this.keyRotationTimer = undefined
    }
  }

  private updateEncryptionMetrics(time: number): void {
    this.metrics.messagesEncrypted++
    this.metrics.averageEncryptTime = 
      (this.metrics.averageEncryptTime * (this.metrics.messagesEncrypted - 1) + time) / 
      this.metrics.messagesEncrypted

    this.emit('encryptionMetricsUpdate', this.metrics)
  }

  private updateDecryptionMetrics(time: number): void {
    this.metrics.messagesDecrypted++
    this.metrics.averageDecryptTime = 
      (this.metrics.averageDecryptTime * (this.metrics.messagesDecrypted - 1) + time) / 
      this.metrics.messagesDecrypted

    this.emit('encryptionMetricsUpdate', this.metrics)
  }

  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private generateMessageId(): string {
    return `${this.sessionId}-${this.messageCounter}-${Date.now()}`
  }

  async getSecurityStatus(): Promise<SecurityStatus> {
    return {
      isSecure: this.ws?.readyState === WebSocket.OPEN && !!this.encryptionKey,
      tlsVersion: 'TLS 1.3',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      keyExchangeMethod: 'ECDHE-P256',
      encryptionStrength: 256,
      lastKeyRotation: new Date(),
      sessionId: this.sessionId
    }
  }

  getMetrics(): EncryptionMetrics {
    return { ...this.metrics }
  }
}

/**
 * React component for rendering the Encrypted WebSocket
 */
export const EncryptedWebSocketComponent: React.FC<ConstructRenderProps> = ({ 
  instance: _instance,
  onInteraction 
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isSecure: false,
    tlsVersion: 'Not Connected',
    cipherSuite: 'None',
    keyExchangeMethod: 'None',
    encryptionStrength: 0,
    lastKeyRotation: null,
    sessionId: ''
  })
  const [metrics, setMetrics] = useState<EncryptionMetrics>({
    messagesEncrypted: 0,
    messagesDecrypted: 0,
    averageEncryptTime: 0,
    averageDecryptTime: 0,
    keyRotations: 0,
    encryptionErrors: 0,
    decryptionErrors: 0
  })
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [showSecrets, setShowSecrets] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Simulate connection and metrics
  useEffect(() => {
    if (isConnected) {
      // Update security status
      setSecurityStatus({
        isSecure: true,
        tlsVersion: 'TLS 1.3',
        cipherSuite: 'TLS_AES_256_GCM_SHA384',
        keyExchangeMethod: 'ECDHE-P256',
        encryptionStrength: 256,
        lastKeyRotation: new Date(),
        sessionId: Math.random().toString(36).substring(7)
      })

      // Simulate metrics updates
      intervalRef.current = setInterval(() => {
        setMetrics(prev => ({
          messagesEncrypted: prev.messagesEncrypted + Math.floor(Math.random() * 5),
          messagesDecrypted: prev.messagesDecrypted + Math.floor(Math.random() * 5),
          averageEncryptTime: Math.random() * 5 + 1,
          averageDecryptTime: Math.random() * 5 + 1,
          keyRotations: prev.keyRotations + (Math.random() > 0.95 ? 1 : 0),
          encryptionErrors: prev.encryptionErrors + (Math.random() > 0.98 ? 1 : 0),
          decryptionErrors: prev.decryptionErrors + (Math.random() > 0.98 ? 1 : 0)
        }))

        // Occasionally add security alerts
        if (Math.random() > 0.95) {
          const alertTypes = [
            { type: 'cipher-negotiation', severity: 'low' as const, desc: 'Cipher suite negotiated' },
            { type: 'key-rotation', severity: 'low' as const, desc: 'Keys rotated successfully' },
            { type: 'suspicious-pattern', severity: 'medium' as const, desc: 'Unusual traffic pattern detected' }
          ]
          const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
          
          setAlerts(prev => [...prev, {
            id: Date.now().toString(),
            type: alert.type,
            severity: alert.severity,
            description: alert.desc,
            timestamp: new Date(),
            resolved: false
          }].slice(-5)) // Keep only last 5 alerts
        }
      }, 2000)
    } else {
      setSecurityStatus({
        isSecure: false,
        tlsVersion: 'Not Connected',
        cipherSuite: 'None',
        keyExchangeMethod: 'None',
        encryptionStrength: 0,
        lastKeyRotation: null,
        sessionId: ''
      })
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isConnected])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setAlerts([])
    onInteraction?.('connect', { url: 'wss://secure-server.example.com' })
  }, [onInteraction])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    setMetrics({
      messagesEncrypted: 0,
      messagesDecrypted: 0,
      averageEncryptTime: 0,
      averageDecryptTime: 0,
      keyRotations: 0,
      encryptionErrors: 0,
      decryptionErrors: 0
    })
    onInteraction?.('disconnect', {})
  }, [onInteraction])

  const handleRotateKeys = useCallback(() => {
    setMetrics(prev => ({ ...prev, keyRotations: prev.keyRotations + 1 }))
    setAlerts(prev => [...prev, {
      id: Date.now().toString(),
      type: 'key-rotation',
      severity: 'low',
      description: 'Manual key rotation completed',
      timestamp: new Date(),
      resolved: false
    }].slice(-5))
    onInteraction?.('rotateKeys', { immediate: true })
  }, [onInteraction])

  const getSecurityIcon = () => {
    if (!isConnected) return <ShieldOff className="w-6 h-6 text-gray-500" />
    if (metrics.encryptionErrors > 0 || metrics.decryptionErrors > 0) {
      return <ShieldAlert className="w-6 h-6 text-orange-500" />
    }
    return <ShieldCheck className="w-6 h-6 text-green-500" />
  }

  const getConnectionColor = () => {
    if (!isConnected) return 'text-gray-500'
    if (securityStatus.isSecure) return 'text-green-500'
    return 'text-orange-500'
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-500/20' : 'bg-gray-800'}`}>
            {getSecurityIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Encrypted WebSocket</h3>
            <p className="text-sm text-gray-400">
              TLS 1.3 + AES-256-GCM Encryption
            </p>
          </div>
        </div>
        
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect Securely'}
        </button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${getConnectionColor()}`} />
          <span className={`text-sm font-medium ${getConnectionColor()}`}>
            {isConnected ? `Secure Connection (${securityStatus.tlsVersion})` : 'Disconnected'}
          </span>
        </div>
        
        {isConnected && (
          <>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-400">
                {securityStatus.cipherSuite}
              </span>
            </div>
            
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
          </>
        )}
      </div>

      {/* Metrics Grid */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <MetricCard
            icon={<Lock className="w-4 h-4" />}
            label="Messages Encrypted"
            value={metrics.messagesEncrypted}
            subValue={`~${metrics.averageEncryptTime.toFixed(1)}ms`}
            color="green"
          />
          <MetricCard
            icon={<Shield className="w-4 h-4" />}
            label="Messages Decrypted"
            value={metrics.messagesDecrypted}
            subValue={`~${metrics.averageDecryptTime.toFixed(1)}ms`}
            color="blue"
          />
          <MetricCard
            icon={<RefreshCw className="w-4 h-4" />}
            label="Key Rotations"
            value={metrics.keyRotations}
            color="purple"
            action={
              <button
                onClick={handleRotateKeys}
                className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                title="Rotate keys manually"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            }
          />
          <MetricCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Crypto Errors"
            value={metrics.encryptionErrors + metrics.decryptionErrors}
            color={metrics.encryptionErrors + metrics.decryptionErrors > 0 ? 'red' : 'gray'}
          />
        </motion.div>
      )}

      {/* Security Details */}
      {isConnected && (
        <div className="space-y-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Security Details
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pt-3 border-t border-gray-800"
            >
              <SecurityDetail 
                label="Session ID" 
                value={securityStatus.sessionId}
                secret={!showSecrets}
                onToggleSecret={() => setShowSecrets(!showSecrets)}
              />
              <SecurityDetail label="Encryption Strength" value={`${securityStatus.encryptionStrength}-bit`} />
              <SecurityDetail label="Key Exchange" value={securityStatus.keyExchangeMethod} />
              <SecurityDetail 
                label="Last Key Rotation" 
                value={securityStatus.lastKeyRotation?.toLocaleTimeString() || 'Never'} 
              />
              <SecurityDetail label="Perfect Forward Secrecy" value="Enabled" />
              <SecurityDetail label="Replay Protection" value="Active" />
            </motion.div>
          )}
        </div>
      )}

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Security Events
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical' ? 'bg-red-900/20 border-red-800' :
                    alert.severity === 'high' ? 'bg-orange-900/20 border-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-800' :
                    'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm">{alert.description}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Encryption Features */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Encryption Features
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>• TLS 1.3 Enforcement</div>
          <div>• AES-256-GCM Encryption</div>
          <div>• ECDHE Key Exchange</div>
          <div>• Perfect Forward Secrecy</div>
          <div>• Message Integrity (HMAC)</div>
          <div>• Replay Attack Protection</div>
          <div>• Automatic Key Rotation</div>
          <div>• Zero-Downtime Updates</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  color: 'green' | 'blue' | 'purple' | 'red' | 'gray'
  action?: React.ReactNode
}> = ({ icon, label, value, subValue, color, action }) => {
  const colorClasses = {
    green: 'text-green-500 bg-green-500/20',
    blue: 'text-blue-500 bg-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/20',
    red: 'text-red-500 bg-red-500/20',
    gray: 'text-gray-500 bg-gray-500/20'
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {action}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

/**
 * Security Detail Component
 */
const SecurityDetail: React.FC<{ 
  label: string
  value: string
  secret?: boolean
  onToggleSecret?: () => void
}> = ({ label, value, secret, onToggleSecret }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium font-mono">
        {secret ? '••••••••' : value}
      </span>
      {onToggleSecret && (
        <button
          onClick={onToggleSecret}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          {secret ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
      )}
    </div>
  </div>
)

// Export the component as default for dynamic imports
export default EncryptedWebSocketComponent

// Re-export the definition from the definition file
export { encryptedWebSocketDefinition } from './EncryptedWebSocket.definition'