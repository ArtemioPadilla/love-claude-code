/**
 * MCP Encryption Utility Service
 * Shared encryption implementation for MCP components
 */

export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305'
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'
export type KeyDerivationFunction = 'pbkdf2' | 'scrypt' | 'argon2'

export interface EncryptionConfig {
  /** Encryption algorithm */
  algorithm: EncryptionAlgorithm
  /** Key size in bits */
  keySize?: 256 | 384 | 512
  /** IV/Nonce size in bytes */
  ivSize?: number
  /** Tag size for authenticated encryption */
  tagSize?: number
  /** Salt size for key derivation */
  saltSize?: number
  /** Key derivation function */
  kdf?: KeyDerivationFunction
  /** KDF iterations */
  iterations?: number
  /** Enable compression before encryption */
  compression?: boolean
}

export interface EncryptedData {
  /** Encrypted ciphertext */
  ciphertext: string
  /** Initialization vector */
  iv: string
  /** Authentication tag (for GCM) */
  tag?: string
  /** Salt (if key derivation used) */
  salt?: string
  /** Algorithm used */
  algorithm: EncryptionAlgorithm
  /** Timestamp */
  timestamp: number
  /** Key ID (for key rotation) */
  keyId?: string
}

export interface KeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
}

export interface EncryptionMetrics {
  totalEncryptions: number
  totalDecryptions: number
  encryptionErrors: number
  decryptionErrors: number
  averageEncryptTime: number
  averageDecryptTime: number
  keysGenerated: number
  keysRotated: number
}

export class MCPEncryption {
  private config: EncryptionConfig
  private keys: Map<string, CryptoKey> = new Map()
  private keyPairs: Map<string, KeyPair> = new Map()
  private metrics: EncryptionMetrics = {
    totalEncryptions: 0,
    totalDecryptions: 0,
    encryptionErrors: 0,
    decryptionErrors: 0,
    averageEncryptTime: 0,
    averageDecryptTime: 0,
    keysGenerated: 0,
    keysRotated: 0
  }
  private encryptTimes: number[] = []
  private decryptTimes: number[] = []

  constructor(config: EncryptionConfig) {
    this.config = {
      keySize: 256,
      ivSize: 12, // 96 bits for GCM
      tagSize: 16, // 128 bits
      saltSize: 16, // 128 bits
      kdf: 'pbkdf2',
      iterations: 100000,
      compression: false,
      ...config
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(keyId?: string): Promise<string> {
    const id = keyId || this.generateKeyId()
    
    const key = await crypto.subtle.generateKey(
      this.getAlgorithmParams(),
      true,
      ['encrypt', 'decrypt']
    )

    this.keys.set(id, key as CryptoKey)
    this.metrics.keysGenerated++
    
    return id
  }

  /**
   * Import a key from raw bytes or string
   */
  async importKey(keyData: string | ArrayBuffer, keyId?: string): Promise<string> {
    const id = keyId || this.generateKeyId()
    
    let keyBytes: ArrayBuffer
    if (typeof keyData === 'string') {
      // Assume hex string
      keyBytes = this.hexToArrayBuffer(keyData)
    } else {
      keyBytes = keyData
    }

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      this.getAlgorithmParams(),
      true,
      ['encrypt', 'decrypt']
    )

    this.keys.set(id, key)
    return id
  }

  /**
   * Export a key to raw bytes
   */
  async exportKey(keyId: string): Promise<ArrayBuffer> {
    const key = this.keys.get(keyId)
    if (!key) {
      throw new Error(`Key not found: ${keyId}`)
    }

    return await crypto.subtle.exportKey('raw', key)
  }

  /**
   * Derive a key from password
   */
  async deriveKey(password: string, salt?: ArrayBuffer, keyId?: string): Promise<string> {
    const id = keyId || this.generateKeyId()
    const saltBytes = salt || crypto.getRandomValues(new Uint8Array(this.config.saltSize!))
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: this.config.iterations!,
        hash: 'SHA-256'
      },
      keyMaterial,
      this.getAlgorithmParams(),
      true,
      ['encrypt', 'decrypt']
    )

    this.keys.set(id, key)
    return id
  }

  /**
   * Generate asymmetric key pair
   */
  async generateKeyPair(keyId?: string): Promise<string> {
    const id = keyId || this.generateKeyId()
    
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )

    this.keyPairs.set(id, keyPair as KeyPair)
    this.metrics.keysGenerated++
    
    return id
  }

  /**
   * Encrypt data
   */
  async encrypt(data: string | ArrayBuffer, keyId: string): Promise<EncryptedData> {
    const startTime = performance.now()
    
    try {
      const key = this.keys.get(keyId)
      if (!key) {
        throw new Error(`Key not found: ${keyId}`)
      }

      // Convert string to bytes
      let plaintext: ArrayBuffer
      if (typeof data === 'string') {
        plaintext = new TextEncoder().encode(data)
      } else {
        plaintext = data
      }

      // Compress if enabled
      if (this.config.compression) {
        plaintext = await this.compress(plaintext)
      }

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivSize!))
      
      // Encrypt
      let ciphertext: ArrayBuffer
      let tag: ArrayBuffer | undefined
      
      if (this.config.algorithm === 'aes-256-gcm') {
        const result = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv,
            tagLength: this.config.tagSize! * 8
          },
          key,
          plaintext
        )
        
        // Extract tag from the end
        const resultArray = new Uint8Array(result)
        ciphertext = resultArray.slice(0, -this.config.tagSize!)
        tag = resultArray.slice(-this.config.tagSize!)
      } else {
        ciphertext = await crypto.subtle.encrypt(
          {
            name: 'AES-CBC',
            iv
          },
          key,
          plaintext
        )
      }

      // Track metrics
      const encryptTime = performance.now() - startTime
      this.updateEncryptMetrics(encryptTime)

      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        tag: tag ? this.arrayBufferToBase64(tag) : undefined,
        algorithm: this.config.algorithm,
        timestamp: Date.now(),
        keyId
      }
    } catch (error) {
      this.metrics.encryptionErrors++
      throw error
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData, keyId?: string): Promise<ArrayBuffer> {
    const startTime = performance.now()
    
    try {
      const effectiveKeyId = keyId || encryptedData.keyId
      if (!effectiveKeyId) {
        throw new Error('Key ID required for decryption')
      }

      const key = this.keys.get(effectiveKeyId)
      if (!key) {
        throw new Error(`Key not found: ${effectiveKeyId}`)
      }

      // Decode from base64
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext)
      const iv = this.base64ToArrayBuffer(encryptedData.iv)
      
      let plaintext: ArrayBuffer
      
      if (encryptedData.algorithm === 'aes-256-gcm' && encryptedData.tag) {
        // Combine ciphertext and tag for GCM
        const tag = this.base64ToArrayBuffer(encryptedData.tag)
        const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength)
        combined.set(new Uint8Array(ciphertext))
        combined.set(new Uint8Array(tag), ciphertext.byteLength)
        
        plaintext = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv,
            tagLength: this.config.tagSize! * 8
          },
          key,
          combined
        )
      } else {
        plaintext = await crypto.subtle.decrypt(
          {
            name: 'AES-CBC',
            iv
          },
          key,
          ciphertext
        )
      }

      // Decompress if needed
      if (this.config.compression) {
        plaintext = await this.decompress(plaintext)
      }

      // Track metrics
      const decryptTime = performance.now() - startTime
      this.updateDecryptMetrics(decryptTime)

      return plaintext
    } catch (error) {
      this.metrics.decryptionErrors++
      throw error
    }
  }

  /**
   * Decrypt data to string
   */
  async decryptToString(encryptedData: EncryptedData, keyId?: string): Promise<string> {
    const plaintext = await this.decrypt(encryptedData, keyId)
    return new TextDecoder().decode(plaintext)
  }

  /**
   * Encrypt with asymmetric key
   */
  async encryptAsymmetric(data: string | ArrayBuffer, keyPairId: string, usePrivateKey = false): Promise<string> {
    const keyPair = this.keyPairs.get(keyPairId)
    if (!keyPair) {
      throw new Error(`Key pair not found: ${keyPairId}`)
    }

    const key = usePrivateKey ? keyPair.privateKey : keyPair.publicKey
    const plaintext = typeof data === 'string' ? new TextEncoder().encode(data) : data

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      key,
      plaintext
    )

    return this.arrayBufferToBase64(encrypted)
  }

  /**
   * Decrypt with asymmetric key
   */
  async decryptAsymmetric(encryptedData: string, keyPairId: string, usePublicKey = false): Promise<ArrayBuffer> {
    const keyPair = this.keyPairs.get(keyPairId)
    if (!keyPair) {
      throw new Error(`Key pair not found: ${keyPairId}`)
    }

    const key = usePublicKey ? keyPair.publicKey : keyPair.privateKey
    const ciphertext = this.base64ToArrayBuffer(encryptedData)

    return await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      key,
      ciphertext
    )
  }

  /**
   * Create message authentication code (MAC)
   */
  async createMAC(data: string | ArrayBuffer, keyId: string): Promise<string> {
    const key = this.keys.get(keyId)
    if (!key) {
      throw new Error(`Key not found: ${keyId}`)
    }

    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data
    
    // Use the key for HMAC
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.exportKey('raw', key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', hmacKey, message)
    return this.arrayBufferToBase64(signature)
  }

  /**
   * Verify message authentication code
   */
  async verifyMAC(data: string | ArrayBuffer, mac: string, keyId: string): Promise<boolean> {
    const expectedMAC = await this.createMAC(data, keyId)
    return mac === expectedMAC
  }

  /**
   * Hash data
   */
  async hash(data: string | ArrayBuffer, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const hash = await crypto.subtle.digest(algorithm, message)
    return this.arrayBufferToBase64(hash)
  }

  /**
   * Generate random bytes
   */
  generateRandomBytes(length: number): ArrayBuffer {
    return crypto.getRandomValues(new Uint8Array(length)).buffer
  }

  /**
   * Generate random string
   */
  generateRandomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    let result = ''
    for (const byte of bytes) {
      result += charset[byte % charset.length]
    }
    return result
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(oldKeyId: string, newKeyId?: string): Promise<string> {
    const id = newKeyId || this.generateKeyId()
    await this.generateKey(id)
    this.metrics.keysRotated++
    return id
  }

  /**
   * Clear a key
   */
  clearKey(keyId: string): void {
    this.keys.delete(keyId)
    this.keyPairs.delete(keyId)
  }

  /**
   * Clear all keys
   */
  clearAllKeys(): void {
    this.keys.clear()
    this.keyPairs.clear()
  }

  /**
   * Get metrics
   */
  getMetrics(): EncryptionMetrics {
    return { ...this.metrics }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Private helper methods

  private getAlgorithmParams(): AesKeyGenParams {
    return {
      name: this.config.algorithm === 'aes-256-gcm' ? 'AES-GCM' : 'AES-CBC',
      length: this.config.keySize!
    }
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateEncryptMetrics(time: number): void {
    this.metrics.totalEncryptions++
    this.encryptTimes.push(time)
    if (this.encryptTimes.length > 100) {
      this.encryptTimes.shift()
    }
    this.metrics.averageEncryptTime = 
      this.encryptTimes.reduce((a, b) => a + b, 0) / this.encryptTimes.length
  }

  private updateDecryptMetrics(time: number): void {
    this.metrics.totalDecryptions++
    this.decryptTimes.push(time)
    if (this.decryptTimes.length > 100) {
      this.decryptTimes.shift()
    }
    this.metrics.averageDecryptTime = 
      this.decryptTimes.reduce((a, b) => a + b, 0) / this.decryptTimes.length
  }

  private async compress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Simple compression using CompressionStream (if available)
    if ('CompressionStream' in globalThis) {
      const cs = new CompressionStream('gzip')
      const writer = cs.writable.getWriter()
      writer.write(data)
      writer.close()
      
      const chunks: Uint8Array[] = []
      const reader = cs.readable.getReader()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      
      return result.buffer
    }
    
    // No compression available
    return data
  }

  private async decompress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Simple decompression using DecompressionStream (if available)
    if ('DecompressionStream' in globalThis) {
      const ds = new DecompressionStream('gzip')
      const writer = ds.writable.getWriter()
      writer.write(data)
      writer.close()
      
      const chunks: Uint8Array[] = []
      const reader = ds.readable.getReader()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      
      return result.buffer
    }
    
    // No decompression available
    return data
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes.buffer
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

// Export singleton instance with default config
export const defaultEncryption = new MCPEncryption({
  algorithm: 'aes-256-gcm',
  keySize: 256,
  compression: false
})