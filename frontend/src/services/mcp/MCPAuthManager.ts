/**
 * MCP Authentication Manager
 * Handles JWT/OAuth token validation, session management, and token refresh
 */

export interface TokenPayload {
  sub: string // Subject (user ID)
  iat: number // Issued at
  exp: number // Expiration
  aud?: string // Audience
  iss?: string // Issuer
  jti?: string // JWT ID
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

export interface AuthSession {
  userId: string
  token: string
  refreshToken?: string
  expiresAt: Date
  roles: string[]
  permissions: string[]
  metadata?: Record<string, any>
}

export interface OAuthConfig {
  provider: 'github' | 'google' | 'microsoft' | 'custom'
  clientId: string
  clientSecret?: string
  redirectUri: string
  scopes: string[]
  authorizationUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
}

export interface JWTConfig {
  publicKey?: string
  secret?: string
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512'
  issuer?: string
  audience?: string
  clockTolerance?: number
}

export class MCPAuthManager {
  private sessions: Map<string, AuthSession> = new Map()
  private jwtConfig?: JWTConfig
  private oauthConfigs: Map<string, OAuthConfig> = new Map()
  private tokenBlacklist: Set<string> = new Set()

  constructor(jwtConfig?: JWTConfig) {
    this.jwtConfig = jwtConfig
  }

  /**
   * Configure JWT validation
   */
  configureJWT(config: JWTConfig): void {
    this.jwtConfig = config
  }

  /**
   * Configure OAuth provider
   */
  configureOAuth(provider: string, config: OAuthConfig): void {
    this.oauthConfigs.set(provider, config)
  }

  /**
   * Validate JWT token
   */
  async validateJWT(token: string): Promise<TokenPayload | null> {
    try {
      // Remove Bearer prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '')

      // Check blacklist
      if (this.tokenBlacklist.has(cleanToken)) {
        return null
      }

      // Parse token (simplified - would use real JWT library)
      const parts = cleanToken.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString()
      ) as TokenPayload

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired')
      }

      // Check issuer
      if (this.jwtConfig?.issuer && payload.iss !== this.jwtConfig.issuer) {
        throw new Error('Invalid issuer')
      }

      // Check audience
      if (this.jwtConfig?.audience && payload.aud !== this.jwtConfig.audience) {
        throw new Error('Invalid audience')
      }

      // In production, would verify signature here
      // For now, return payload if basic checks pass
      return payload
    } catch (error) {
      console.error('JWT validation error:', error)
      return null
    }
  }

  /**
   * Validate OAuth token
   */
  async validateOAuthToken(provider: string, token: string): Promise<TokenPayload | null> {
    const config = this.oauthConfigs.get(provider)
    if (!config) {
      throw new Error(`OAuth provider ${provider} not configured`)
    }

    try {
      // In production, would validate with OAuth provider
      // For now, mock validation
      const mockPayload: TokenPayload = {
        sub: `${provider}_user_123`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: provider,
        roles: ['user'],
        permissions: ['read', 'write']
      }

      return mockPayload
    } catch (error) {
      console.error('OAuth validation error:', error)
      return null
    }
  }

  /**
   * Create session from token
   */
  async createSession(token: string, type: 'jwt' | 'oauth' = 'jwt', provider?: string): Promise<AuthSession | null> {
    let payload: TokenPayload | null

    if (type === 'jwt') {
      payload = await this.validateJWT(token)
    } else {
      if (!provider) throw new Error('Provider required for OAuth validation')
      payload = await this.validateOAuthToken(provider, token)
    }

    if (!payload) return null

    const session: AuthSession = {
      userId: payload.sub,
      token,
      expiresAt: new Date(payload.exp * 1000),
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      metadata: {
        iat: payload.iat,
        iss: payload.iss,
        aud: payload.aud
      }
    }

    // Store session
    this.sessions.set(payload.sub, session)

    return session
  }

  /**
   * Get session by user ID
   */
  getSession(userId: string): AuthSession | undefined {
    const session = this.sessions.get(userId)
    
    // Check if expired
    if (session && session.expiresAt < new Date()) {
      this.sessions.delete(userId)
      return undefined
    }

    return session
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken?: string } | null> {
    // In production, would exchange refresh token for new access token
    // For now, mock refresh
    const mockNewToken = this.generateMockToken({
      sub: 'refreshed_user',
      exp: Math.floor(Date.now() / 1000) + 3600
    })

    return {
      token: mockNewToken,
      refreshToken: this.generateMockToken({ type: 'refresh' })
    }
  }

  /**
   * Revoke token
   */
  revokeToken(token: string): void {
    const cleanToken = token.replace(/^Bearer\s+/i, '')
    this.tokenBlacklist.add(cleanToken)

    // Remove associated session
    for (const [userId, session] of this.sessions.entries()) {
      if (session.token === token) {
        this.sessions.delete(userId)
        break
      }
    }
  }

  /**
   * Check if user has role
   */
  hasRole(userId: string, role: string): boolean {
    const session = this.getSession(userId)
    return session ? session.roles.includes(role) : false
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permission: string): boolean {
    const session = this.getSession(userId)
    return session ? session.permissions.includes(permission) : false
  }

  /**
   * Get OAuth authorization URL
   */
  getOAuthAuthorizationUrl(provider: string, state?: string): string {
    const config = this.oauthConfigs.get(provider)
    if (!config) {
      throw new Error(`OAuth provider ${provider} not configured`)
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code'
    })

    if (state) {
      params.append('state', state)
    }

    // Default URLs for known providers
    const authUrls: Record<string, string> = {
      github: 'https://github.com/login/oauth/authorize',
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    }

    const authUrl = config.authorizationUrl || authUrls[provider] || ''
    return `${authUrl}?${params.toString()}`
  }

  /**
   * Exchange OAuth code for token
   */
  async exchangeOAuthCode(provider: string, code: string): Promise<string | null> {
    const config = this.oauthConfigs.get(provider)
    if (!config) {
      throw new Error(`OAuth provider ${provider} not configured`)
    }

    // In production, would make actual token exchange request
    // For now, return mock token
    return this.generateMockToken({
      sub: `${provider}_user_${Date.now()}`,
      iss: provider
    })
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date()
    for (const [userId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(userId)
      }
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): AuthSession[] {
    this.cleanupExpiredSessions()
    return Array.from(this.sessions.values())
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear()
  }

  /**
   * Generate mock token for testing
   */
  private generateMockToken(payload: Record<string, any>): string {
    const header = Buffer.from(JSON.stringify({
      alg: 'HS256',
      typ: 'JWT'
    })).toString('base64url')

    const defaultPayload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload
    }

    const payloadBase64 = Buffer.from(JSON.stringify(defaultPayload)).toString('base64url')
    const signature = Buffer.from('mock-signature').toString('base64url')

    return `${header}.${payloadBase64}.${signature}`
  }
}

// Export singleton instance
export const mcpAuthManager = new MCPAuthManager()