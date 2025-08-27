import { z } from 'zod'

// SSO Provider Types
export enum SSOProvider {
  SAML = 'saml',
  OAUTH2 = 'oauth2',
  OIDC = 'oidc',
  OKTA = 'okta',
  AUTH0 = 'auth0',
  AZURE_AD = 'azure_ad',
  GOOGLE_WORKSPACE = 'google_workspace'
}

// SAML Configuration
export interface SAMLConfig {
  metadataUrl?: string
  metadataXml?: string
  entityId: string
  ssoUrl: string
  certificate: string
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512'
  identifierFormat?: string
  attributeMapping?: Record<string, string>
}

// OAuth2/OIDC Configuration
export interface OAuthConfig {
  clientId: string
  clientSecret?: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl?: string
  scope: string[]
  redirectUri: string
  responseType?: 'code' | 'token' | 'id_token'
  grantType?: 'authorization_code' | 'implicit' | 'client_credentials'
}

// SSO Session
export interface SSOSession {
  id: string
  userId: string
  provider: SSOProvider
  organizationId: string
  accessToken: string
  refreshToken?: string
  idToken?: string
  expiresAt: Date
  createdAt: Date
  lastActivity: Date
  attributes: Record<string, any>
}

// SSO Configuration
export interface SSOConfiguration {
  id: string
  organizationId: string
  provider: SSOProvider
  enabled: boolean
  config: SAMLConfig | OAuthConfig
  userAttributeMapping: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
    department?: string
    role?: string
  }
  defaultRole?: string
  allowedDomains?: string[]
  autoProvisionUsers: boolean
  syncUserAttributes: boolean
  createdAt: Date
  updatedAt: Date
}

export class SSOService {
  private static instance: SSOService
  private configurations: Map<string, SSOConfiguration> = new Map()
  private sessions: Map<string, SSOSession> = new Map()

  private constructor() {}

  static getInstance(): SSOService {
    if (!SSOService.instance) {
      SSOService.instance = new SSOService()
    }
    return SSOService.instance
  }

  // Configuration Management
  async createConfiguration(config: Omit<SSOConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<SSOConfiguration> {
    const newConfig: SSOConfiguration = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Validate configuration based on provider
    this.validateConfiguration(newConfig)

    // Store configuration
    this.configurations.set(newConfig.id, newConfig)

    // Initialize provider-specific setup
    await this.initializeProvider(newConfig)

    return newConfig
  }

  async updateConfiguration(id: string, updates: Partial<SSOConfiguration>): Promise<SSOConfiguration> {
    const config = this.configurations.get(id)
    if (!config) {
      throw new Error('SSO configuration not found')
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    }

    this.validateConfiguration(updatedConfig)
    this.configurations.set(id, updatedConfig)

    return updatedConfig
  }

  async deleteConfiguration(id: string): Promise<void> {
    const config = this.configurations.get(id)
    if (!config) {
      throw new Error('SSO configuration not found')
    }

    // Clean up provider-specific resources
    await this.cleanupProvider(config)

    this.configurations.delete(id)
  }

  getConfiguration(id: string): SSOConfiguration | undefined {
    return this.configurations.get(id)
  }

  getOrganizationConfigurations(organizationId: string): SSOConfiguration[] {
    return Array.from(this.configurations.values()).filter(
      config => config.organizationId === organizationId
    )
  }

  // Authentication Flow
  async initiateSSO(configId: string, state?: string): Promise<string> {
    const config = this.configurations.get(configId)
    if (!config) {
      throw new Error('SSO configuration not found')
    }

    if (!config.enabled) {
      throw new Error('SSO configuration is disabled')
    }

    switch (config.provider) {
      case SSOProvider.SAML:
        return this.initiateSAMLFlow(config as SSOConfiguration & { config: SAMLConfig }, state)
      case SSOProvider.OAUTH2:
      case SSOProvider.OIDC:
      case SSOProvider.OKTA:
      case SSOProvider.AUTH0:
      case SSOProvider.AZURE_AD:
      case SSOProvider.GOOGLE_WORKSPACE:
        return this.initiateOAuthFlow(config as SSOConfiguration & { config: OAuthConfig }, state)
      default:
        throw new Error('Unsupported SSO provider')
    }
  }

  async handleCallback(configId: string, params: Record<string, string>): Promise<SSOSession> {
    const config = this.configurations.get(configId)
    if (!config) {
      throw new Error('SSO configuration not found')
    }

    let session: SSOSession

    switch (config.provider) {
      case SSOProvider.SAML:
        session = await this.handleSAMLCallback(config as SSOConfiguration & { config: SAMLConfig }, params)
        break
      case SSOProvider.OAUTH2:
      case SSOProvider.OIDC:
      case SSOProvider.OKTA:
      case SSOProvider.AUTH0:
      case SSOProvider.AZURE_AD:
      case SSOProvider.GOOGLE_WORKSPACE:
        session = await this.handleOAuthCallback(config as SSOConfiguration & { config: OAuthConfig }, params)
        break
      default:
        throw new Error('Unsupported SSO provider')
    }

    // Store session
    this.sessions.set(session.id, session)

    // Auto-provision user if enabled
    if (config.autoProvisionUsers) {
      await this.provisionUser(session, config)
    }

    return session
  }

  // Session Management
  async refreshSession(sessionId: string): Promise<SSOSession> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (!session.refreshToken) {
      throw new Error('No refresh token available')
    }

    const config = this.getOrganizationConfigurations(session.organizationId)
      .find(c => c.provider === session.provider)

    if (!config) {
      throw new Error('SSO configuration not found')
    }

    // Refresh based on provider type
    const refreshedSession = await this.refreshOAuthToken(
      config as SSOConfiguration & { config: OAuthConfig },
      session
    )

    this.sessions.set(refreshedSession.id, refreshedSession)
    return refreshedSession
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    // Perform provider-specific logout if needed
    await this.performProviderLogout(session)

    this.sessions.delete(sessionId)
  }

  getSession(sessionId: string): SSOSession | undefined {
    return this.sessions.get(sessionId)
  }

  getUserSessions(userId: string): SSOSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.userId === userId
    )
  }

  // Provider-specific implementations
  private async initiateSAMLFlow(config: SSOConfiguration & { config: SAMLConfig }, state?: string): Promise<string> {
    const samlConfig = config.config
    
    // Generate SAML request
    const samlRequest = this.generateSAMLRequest({
      entityId: samlConfig.entityId,
      ssoUrl: samlConfig.ssoUrl,
      identifierFormat: samlConfig.identifierFormat
    })

    // Encode and return redirect URL
    const encodedRequest = btoa(samlRequest)
    const redirectUrl = new URL(samlConfig.ssoUrl)
    redirectUrl.searchParams.set('SAMLRequest', encodedRequest)
    if (state) {
      redirectUrl.searchParams.set('RelayState', state)
    }

    return redirectUrl.toString()
  }

  private async initiateOAuthFlow(config: SSOConfiguration & { config: OAuthConfig }, state?: string): Promise<string> {
    const oauthConfig = config.config
    
    const redirectUrl = new URL(oauthConfig.authorizationUrl)
    redirectUrl.searchParams.set('client_id', oauthConfig.clientId)
    redirectUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri)
    redirectUrl.searchParams.set('response_type', oauthConfig.responseType || 'code')
    redirectUrl.searchParams.set('scope', oauthConfig.scope.join(' '))
    
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }

    // Provider-specific parameters
    switch (config.provider) {
      case SSOProvider.OKTA:
        redirectUrl.searchParams.set('prompt', 'select_account')
        break
      case SSOProvider.AZURE_AD:
        redirectUrl.searchParams.set('prompt', 'select_account')
        redirectUrl.searchParams.set('domain_hint', config.allowedDomains?.[0] || '')
        break
      case SSOProvider.GOOGLE_WORKSPACE:
        if (config.allowedDomains?.length) {
          redirectUrl.searchParams.set('hd', config.allowedDomains[0])
        }
        break
    }

    return redirectUrl.toString()
  }

  private async handleSAMLCallback(
    config: SSOConfiguration & { config: SAMLConfig },
    params: Record<string, string>
  ): Promise<SSOSession> {
    const samlResponse = params.SAMLResponse
    if (!samlResponse) {
      throw new Error('Missing SAML response')
    }

    // Decode and validate SAML response
    const decodedResponse = atob(samlResponse)
    const userAttributes = await this.validateSAMLResponse(decodedResponse, config.config)

    // Map attributes
    const mappedAttributes = this.mapUserAttributes(userAttributes, config.userAttributeMapping)

    return {
      id: this.generateId(),
      userId: mappedAttributes.email || userAttributes.nameID,
      provider: config.provider,
      organizationId: config.organizationId,
      accessToken: samlResponse, // Store the SAML response as token
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      createdAt: new Date(),
      lastActivity: new Date(),
      attributes: mappedAttributes
    }
  }

  private async handleOAuthCallback(
    config: SSOConfiguration & { config: OAuthConfig },
    params: Record<string, string>
  ): Promise<SSOSession> {
    const code = params.code
    if (!code) {
      throw new Error('Missing authorization code')
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(config.config, code)

    // Get user info
    const userInfo = await this.fetchUserInfo(config.config, tokens.access_token)

    // Map attributes
    const mappedAttributes = this.mapUserAttributes(userInfo, config.userAttributeMapping)

    return {
      id: this.generateId(),
      userId: mappedAttributes.email || userInfo.sub || userInfo.id,
      provider: config.provider,
      organizationId: config.organizationId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      createdAt: new Date(),
      lastActivity: new Date(),
      attributes: mappedAttributes
    }
  }

  // Utility methods
  private validateConfiguration(config: SSOConfiguration): void {
    switch (config.provider) {
      case SSOProvider.SAML:
        this.validateSAMLConfig(config.config as SAMLConfig)
        break
      case SSOProvider.OAUTH2:
      case SSOProvider.OIDC:
      case SSOProvider.OKTA:
      case SSOProvider.AUTH0:
      case SSOProvider.AZURE_AD:
      case SSOProvider.GOOGLE_WORKSPACE:
        this.validateOAuthConfig(config.config as OAuthConfig)
        break
      default:
        throw new Error('Invalid SSO provider')
    }
  }

  private validateSAMLConfig(config: SAMLConfig): void {
    if (!config.entityId || !config.ssoUrl || !config.certificate) {
      throw new Error('Missing required SAML configuration')
    }
  }

  private validateOAuthConfig(config: OAuthConfig): void {
    if (!config.clientId || !config.authorizationUrl || !config.tokenUrl || !config.redirectUri) {
      throw new Error('Missing required OAuth configuration')
    }
  }

  private async initializeProvider(config: SSOConfiguration): Promise<void> {
    // Provider-specific initialization
    switch (config.provider) {
      case SSOProvider.OKTA:
        // Validate Okta domain
        if (!config.config.authorizationUrl.includes('.okta.com')) {
          throw new Error('Invalid Okta domain')
        }
        break
      case SSOProvider.AZURE_AD:
        // Validate Azure AD tenant
        if (!config.config.authorizationUrl.includes('microsoftonline.com')) {
          throw new Error('Invalid Azure AD configuration')
        }
        break
    }
  }

  private async cleanupProvider(config: SSOConfiguration): Promise<void> {
    // Clean up any active sessions for this configuration
    const sessions = Array.from(this.sessions.values()).filter(
      s => s.organizationId === config.organizationId && s.provider === config.provider
    )

    for (const session of sessions) {
      await this.terminateSession(session.id)
    }
  }

  private generateSAMLRequest(params: {
    entityId: string
    ssoUrl: string
    identifierFormat?: string
  }): string {
    const id = `_${this.generateId()}`
    const issueInstant = new Date().toISOString()
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest 
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${id}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${params.ssoUrl}"
    AssertionConsumerServiceURL="${window.location.origin}/auth/sso/callback">
    <saml:Issuer>${params.entityId}</saml:Issuer>
    <samlp:NameIDPolicy 
        Format="${params.identifierFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'}"
        AllowCreate="true" />
</samlp:AuthnRequest>`
  }

  private async validateSAMLResponse(response: string, config: SAMLConfig): Promise<Record<string, any>> {
    // In a real implementation, this would:
    // 1. Parse the XML response
    // 2. Validate the signature using the certificate
    // 3. Check timestamps and conditions
    // 4. Extract user attributes
    
    // For now, return mock data
    return {
      nameID: 'user@example.com',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      groups: ['developers', 'admins']
    }
  }

  private async exchangeCodeForTokens(
    config: OAuthConfig,
    code: string
  ): Promise<{ access_token: string; refresh_token?: string; id_token?: string; expires_in?: number }> {
    const params = new URLSearchParams({
      grant_type: config.grantType || 'authorization_code',
      code,
      client_id: config.clientId,
      redirect_uri: config.redirectUri
    })

    if (config.clientSecret) {
      params.set('client_secret', config.clientSecret)
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    return response.json()
  }

  private async fetchUserInfo(config: OAuthConfig, accessToken: string): Promise<Record<string, any>> {
    if (!config.userInfoUrl) {
      // Return basic info from token if no userinfo endpoint
      return this.decodeJWT(accessToken)
    }

    const response = await fetch(config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    return response.json()
  }

  private async refreshOAuthToken(
    config: SSOConfiguration & { config: OAuthConfig },
    session: SSOSession
  ): Promise<SSOSession> {
    if (!session.refreshToken) {
      throw new Error('No refresh token available')
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: config.config.clientId
    })

    if (config.config.clientSecret) {
      params.set('client_secret', config.config.clientSecret)
    }

    const response = await fetch(config.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens = await response.json()

    return {
      ...session,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || session.refreshToken,
      idToken: tokens.id_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      lastActivity: new Date()
    }
  }

  private async performProviderLogout(session: SSOSession): Promise<void> {
    // Provider-specific logout implementations
    // Most providers support a logout endpoint
    console.log('Performing provider logout for session:', session.id)
  }

  private async provisionUser(session: SSOSession, config: SSOConfiguration): Promise<void> {
    // Auto-provision user based on SSO attributes
    console.log('Auto-provisioning user:', session.attributes)
    
    // This would typically:
    // 1. Create or update user account
    // 2. Assign default role
    // 3. Add to organization
    // 4. Sync attributes if enabled
  }

  private mapUserAttributes(
    source: Record<string, any>,
    mapping: SSOConfiguration['userAttributeMapping']
  ): Record<string, any> {
    const mapped: Record<string, any> = { ...source }

    if (mapping) {
      for (const [targetKey, sourceKey] of Object.entries(mapping)) {
        if (sourceKey && source[sourceKey] !== undefined) {
          mapped[targetKey] = source[sourceKey]
        }
      }
    }

    return mapped
  }

  private decodeJWT(token: string): Record<string, any> {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT')
      }
      
      const payload = parts[1]
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Failed to decode JWT:', error)
      return {}
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Test connection method
  async testConnection(configId: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const config = this.configurations.get(configId)
      if (!config) {
        return { success: false, message: 'Configuration not found' }
      }

      // Test based on provider type
      switch (config.provider) {
        case SSOProvider.SAML:
          return this.testSAMLConnection(config as SSOConfiguration & { config: SAMLConfig })
        case SSOProvider.OAUTH2:
        case SSOProvider.OIDC:
        case SSOProvider.OKTA:
        case SSOProvider.AUTH0:
        case SSOProvider.AZURE_AD:
        case SSOProvider.GOOGLE_WORKSPACE:
          return this.testOAuthConnection(config as SSOConfiguration & { config: OAuthConfig })
        default:
          return { success: false, message: 'Unsupported provider' }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testSAMLConnection(
    config: SSOConfiguration & { config: SAMLConfig }
  ): Promise<{ success: boolean; message: string; details?: any }> {
    // Test SAML metadata endpoint if available
    if (config.config.metadataUrl) {
      try {
        const response = await fetch(config.config.metadataUrl)
        if (!response.ok) {
          return {
            success: false,
            message: 'Failed to fetch SAML metadata',
            details: `HTTP ${response.status}`
          }
        }
        
        const metadata = await response.text()
        if (!metadata.includes('EntityDescriptor')) {
          return {
            success: false,
            message: 'Invalid SAML metadata format'
          }
        }
      } catch (error) {
        return {
          success: false,
          message: 'Failed to connect to SAML provider',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return {
      success: true,
      message: 'SAML configuration appears valid',
      details: {
        entityId: config.config.entityId,
        ssoUrl: config.config.ssoUrl
      }
    }
  }

  private async testOAuthConnection(
    config: SSOConfiguration & { config: OAuthConfig }
  ): Promise<{ success: boolean; message: string; details?: any }> {
    // Test OAuth discovery endpoint if OIDC
    if (config.provider === SSOProvider.OIDC) {
      const discoveryUrl = config.config.authorizationUrl.replace('/authorize', '/.well-known/openid-configuration')
      
      try {
        const response = await fetch(discoveryUrl)
        if (!response.ok) {
          return {
            success: false,
            message: 'Failed to fetch OIDC discovery document',
            details: `HTTP ${response.status}`
          }
        }
        
        const discovery = await response.json()
        return {
          success: true,
          message: 'OIDC provider connection successful',
          details: {
            issuer: discovery.issuer,
            authorizationEndpoint: discovery.authorization_endpoint,
            tokenEndpoint: discovery.token_endpoint
          }
        }
      } catch (error) {
        // Fall through to basic OAuth test
      }
    }

    // Basic OAuth validation
    return {
      success: true,
      message: 'OAuth configuration appears valid',
      details: {
        clientId: config.config.clientId,
        authorizationUrl: config.config.authorizationUrl,
        scopes: config.config.scope
      }
    }
  }
}

export const ssoService = SSOService.getInstance()