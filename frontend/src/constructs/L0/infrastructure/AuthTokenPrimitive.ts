import { L0InfrastructureConstruct } from '../../base/L0Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L0 Auth Token Primitive Construct
 * Raw token generation and validation with no encryption or security
 * Just basic string-based tokens
 */
export class AuthTokenPrimitive extends L0InfrastructureConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l0-auth-token-primitive',
    name: 'Auth Token Primitive',
    level: ConstructLevel.L0,
    type: ConstructType.Infrastructure,
    description: 'Raw token generation with no encryption or security',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['infrastructure', 'auth', 'security'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['auth', 'token', 'primitive', 'authentication'],
    inputs: [
      {
        name: 'tokenPrefix',
        type: 'string',
        description: 'Prefix for generated tokens',
        required: false,
        defaultValue: 'token'
      },
      {
        name: 'tokenLength',
        type: 'number',
        description: 'Length of random token part',
        required: false,
        defaultValue: 32
      },
      {
        name: 'expirationTime',
        type: 'number',
        description: 'Token expiration time in milliseconds (0 = never)',
        required: false,
        defaultValue: 0
      }
    ],
    outputs: [
      {
        name: 'activeTokens',
        type: 'number',
        description: 'Number of active tokens'
      },
      {
        name: 'totalGenerated',
        type: 'number',
        description: 'Total tokens generated'
      },
      {
        name: 'lastOperation',
        type: 'TokenOperation',
        description: 'Information about last operation'
      }
    ],
    security: [],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'Token Management'
    },
    examples: [
      {
        title: 'Basic Token Generation',
        description: 'Generate and validate tokens',
        code: `const tokenAuth = new AuthTokenPrimitive()
await tokenAuth.initialize({
  tokenPrefix: 'api',
  tokenLength: 16
})
await tokenAuth.deploy()

// Generate token
const token = await tokenAuth.generate({
  userId: 'user123',
  permissions: ['read', 'write']
})

// Validate token
const isValid = await tokenAuth.validate(token)
console.log(isValid) // true`,
        language: 'typescript'
      },
      {
        title: 'Expiring Tokens',
        description: 'Tokens with expiration',
        code: `const sessionAuth = new AuthTokenPrimitive()
await sessionAuth.initialize({
  tokenPrefix: 'session',
  expirationTime: 3600000 // 1 hour
})

// Generate expiring token
const token = await sessionAuth.generate({
  userId: 'user456',
  sessionId: 'sess123'
})

// Token expires after 1 hour
setTimeout(async () => {
  const isValid = await sessionAuth.validate(token)
  console.log(isValid) // false
}, 3700000)`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'This is a primitive - use L1 SecureAuthService for production',
      'No encryption or hashing',
      'No secure random generation',
      'No signature verification',
      'Tokens stored in plain text'
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

  private tokens: Map<string, TokenData> = new Map()
  private totalGenerated: number = 0
  private lastOperation?: TokenOperation

  constructor() {
    super(AuthTokenPrimitive.definition)
  }

  /**
   * Simulated deploy for L0
   */
  async deploy(): Promise<void> {
    // Set initial outputs
    this.setOutput('activeTokens', 0)
    this.setOutput('totalGenerated', 0)
    
    console.log('Auth token service deployed')
  }

  /**
   * Generate a new token
   */
  async generate(payload?: any): Promise<string> {
    const prefix = this.getInput<string>('tokenPrefix') || 'token'
    const length = this.getInput<number>('tokenLength') || 32
    const expirationTime = this.getInput<number>('expirationTime') || 0

    // Generate simple random string (not cryptographically secure for L0)
    const randomPart = this.generateRandomString(length)
    const token = `${prefix}_${randomPart}`

    // Calculate expiration
    const expiresAt = expirationTime > 0 
      ? new Date(Date.now() + expirationTime)
      : null

    // Store token data
    const tokenData: TokenData = {
      token,
      payload: payload || {},
      createdAt: new Date(),
      expiresAt,
      lastAccessed: new Date()
    }

    this.tokens.set(token, tokenData)
    this.totalGenerated++

    // Update outputs
    this.updateStats()

    this.lastOperation = {
      type: 'generate',
      timestamp: new Date(),
      token,
      success: true
    }
    this.setOutput('lastOperation', this.lastOperation)

    return token
  }

  /**
   * Validate a token
   */
  async validate(token: string): Promise<boolean> {
    const tokenData = this.tokens.get(token)
    
    if (!tokenData) {
      this.lastOperation = {
        type: 'validate',
        timestamp: new Date(),
        token,
        success: false,
        reason: 'not_found'
      }
      this.setOutput('lastOperation', this.lastOperation)
      return false
    }

    // Check expiration
    if (tokenData.expiresAt && tokenData.expiresAt < new Date()) {
      this.lastOperation = {
        type: 'validate',
        timestamp: new Date(),
        token,
        success: false,
        reason: 'expired'
      }
      this.setOutput('lastOperation', this.lastOperation)
      return false
    }

    // Update last accessed
    tokenData.lastAccessed = new Date()

    this.lastOperation = {
      type: 'validate',
      timestamp: new Date(),
      token,
      success: true
    }
    this.setOutput('lastOperation', this.lastOperation)

    return true
  }

  /**
   * Get token data
   */
  async getTokenData(token: string): Promise<TokenInfo | null> {
    const tokenData = this.tokens.get(token)
    
    if (!tokenData) {
      return null
    }

    // Check if expired
    const isExpired = tokenData.expiresAt ? tokenData.expiresAt < new Date() : false

    return {
      token: tokenData.token,
      payload: { ...tokenData.payload },
      createdAt: tokenData.createdAt,
      expiresAt: tokenData.expiresAt,
      lastAccessed: tokenData.lastAccessed,
      isExpired
    }
  }

  /**
   * Revoke a token
   */
  async revoke(token: string): Promise<boolean> {
    const existed = this.tokens.delete(token)
    
    if (existed) {
      this.updateStats()
    }

    this.lastOperation = {
      type: 'revoke',
      timestamp: new Date(),
      token,
      success: existed
    }
    this.setOutput('lastOperation', this.lastOperation)

    return existed
  }

  /**
   * Revoke all tokens
   */
  async revokeAll(): Promise<number> {
    const count = this.tokens.size
    this.tokens.clear()
    
    this.updateStats()

    this.lastOperation = {
      type: 'revoke_all',
      timestamp: new Date(),
      success: true,
      count
    }
    this.setOutput('lastOperation', this.lastOperation)

    return count
  }

  /**
   * Clean up expired tokens
   */
  async cleanup(): Promise<number> {
    const now = new Date()
    const toDelete: string[] = []

    this.tokens.forEach((data, token) => {
      if (data.expiresAt && data.expiresAt < now) {
        toDelete.push(token)
      }
    })

    toDelete.forEach(token => this.tokens.delete(token))
    
    if (toDelete.length > 0) {
      this.updateStats()
    }

    this.lastOperation = {
      type: 'cleanup',
      timestamp: new Date(),
      success: true,
      count: toDelete.length
    }
    this.setOutput('lastOperation', this.lastOperation)

    return toDelete.length
  }

  /**
   * List all active tokens
   */
  async listTokens(): Promise<TokenInfo[]> {
    const now = new Date()
    const tokens: TokenInfo[] = []

    this.tokens.forEach(data => {
      const isExpired = data.expiresAt ? data.expiresAt < now : false
      
      tokens.push({
        token: data.token,
        payload: { ...data.payload },
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        lastAccessed: data.lastAccessed,
        isExpired
      })
    })

    return tokens
  }

  /**
   * Get statistics
   */
  getStats(): TokenStats {
    const now = new Date()
    let activeCount = 0
    let expiredCount = 0

    this.tokens.forEach(data => {
      if (data.expiresAt && data.expiresAt < now) {
        expiredCount++
      } else {
        activeCount++
      }
    })

    return {
      activeTokens: activeCount,
      expiredTokens: expiredCount,
      totalGenerated: this.totalGenerated,
      tokenPrefix: this.getInput<string>('tokenPrefix') || 'token',
      tokenLength: this.getInput<number>('tokenLength') || 32,
      expirationTime: this.getInput<number>('expirationTime') || 0,
      lastOperation: this.lastOperation
    }
  }

  /**
   * Generate random string (not cryptographically secure for L0)
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    const stats = this.getStats()
    this.setOutput('activeTokens', stats.activeTokens)
    this.setOutput('totalGenerated', stats.totalGenerated)
  }
}

/**
 * Token data storage
 */
interface TokenData {
  token: string
  payload: any
  createdAt: Date
  expiresAt: Date | null
  lastAccessed: Date
}

/**
 * Token information for external use
 */
export interface TokenInfo {
  token: string
  payload: any
  createdAt: Date
  expiresAt: Date | null
  lastAccessed: Date
  isExpired: boolean
}

/**
 * Token operation tracking
 */
export interface TokenOperation {
  type: 'generate' | 'validate' | 'revoke' | 'revoke_all' | 'cleanup'
  timestamp: Date
  token?: string
  success: boolean
  reason?: string
  count?: number
}

/**
 * Token statistics
 */
export interface TokenStats {
  activeTokens: number
  expiredTokens: number
  totalGenerated: number
  tokenPrefix: string
  tokenLength: number
  expirationTime: number
  lastOperation?: TokenOperation
}

// Export factory function
export const createAuthTokenPrimitive = () => new AuthTokenPrimitive()

// Export definition for catalog
export const authTokenPrimitiveDefinition = AuthTokenPrimitive.definition