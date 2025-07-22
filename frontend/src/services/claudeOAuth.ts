import { OAuthConfig, OAuthTokenResponse, PKCEChallenge } from '@/types/auth'

// OAuth configuration for Claude
// Note: This uses the Claude Code OAuth flow which may be subject to changes
// Endpoints discovered from grll/claude-code-login implementation:
// - Authorization: https://claude.ai/oauth/authorize
// - Token: https://console.anthropic.com/v1/oauth/token (requires proxy due to CORS)
const OAUTH_CONFIG: OAuthConfig = {
  clientId: '9d1c250a-e61b-44d9-88ed-5944d1962f5e', // Claude Code client ID
  redirectUri: 'https://console.anthropic.com/oauth/code/callback', // Official OAuth callback URI
  authorizationEndpoint: 'https://claude.ai/oauth/authorize',
  tokenEndpoint: 'http://localhost:8000/api/v1/oauth/token', // Use backend OAuth endpoint
  scopes: ['org:create_api_key', 'user:profile', 'user:inference']
}

class ClaudeOAuthService {
  private config: OAuthConfig
  private currentPKCE: PKCEChallenge | null = null

  constructor() {
    this.config = OAUTH_CONFIG
  }

  /**
   * Generate PKCE challenge for OAuth flow
   */
  private async generatePKCEChallenge(): Promise<PKCEChallenge> {
    // Generate code verifier (43-128 chars)
    const codeVerifier = this.generateRandomString(128)
    
    // Generate code challenge using SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    
    // Convert to base64url
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    const codeChallenge = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    }
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const values = crypto.getRandomValues(new Uint8Array(length))
    return Array.from(values)
      .map(x => charset[x % charset.length])
      .join('')
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    return this.generateRandomString(32)
  }

  /**
   * Initiate OAuth login flow
   * Returns the authorization URL for user to visit
   */
  async initiateLogin(): Promise<string> {
    // Generate PKCE challenge
    this.currentPKCE = await this.generatePKCEChallenge()
    
    // Generate state for CSRF protection
    const state = this.generateState()
    
    // Store state and PKCE in session storage
    sessionStorage.setItem('oauth_state', state)
    sessionStorage.setItem('oauth_pkce', JSON.stringify(this.currentPKCE))
    
    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: state,
      code_challenge: this.currentPKCE.codeChallenge,
      code_challenge_method: this.currentPKCE.codeChallengeMethod
    })
    
    return `${this.config.authorizationEndpoint}?${params.toString()}`
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<OAuthTokenResponse> {
    // Verify state to prevent CSRF
    const savedState = sessionStorage.getItem('oauth_state')
    if (!savedState || savedState !== state) {
      throw new Error('Invalid state parameter - possible CSRF attack')
    }
    
    // Retrieve PKCE verifier
    const savedPKCE = sessionStorage.getItem('oauth_pkce')
    if (!savedPKCE) {
      throw new Error('PKCE verifier not found')
    }
    
    const pkce: PKCEChallenge = JSON.parse(savedPKCE)
    
    // Exchange authorization code for tokens
    const response = await this.exchangeCode(code, pkce.codeVerifier, state)
    
    // Clean up session storage
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('oauth_pkce')
    
    return response
  }

  /**
   * Handle manual OAuth callback (for copy-paste flow)
   * This bypasses state validation since the user is manually copying the URL
   */
  async handleManualCallback(code: string, state: string): Promise<OAuthTokenResponse> {
    // For manual flow, we can't validate state since it wasn't saved in sessionStorage
    // We also need to generate a code verifier since we don't have the original
    
    // Try to get PKCE from session storage first (in case popup is same window)
    const savedPKCE = sessionStorage.getItem('oauth_pkce')
    let codeVerifier: string
    
    if (savedPKCE) {
      const pkce: PKCEChallenge = JSON.parse(savedPKCE)
      codeVerifier = pkce.codeVerifier
    } else {
      // For manual flow, we'll use the state as the code verifier
      // This is not ideal but necessary for the manual flow
      console.warn('Manual OAuth flow: Using state as code verifier')
      codeVerifier = state
    }
    
    // Exchange authorization code for tokens
    const response = await this.exchangeCode(code, codeVerifier, state)
    
    // Clean up session storage if it exists
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('oauth_pkce')
    
    return response
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(code: string, codeVerifier: string, state?: string): Promise<OAuthTokenResponse> {
    const requestBody: any = {
      grant_type: 'authorization_code',
      code: code,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier
    }
    
    // Include state if provided
    if (state) {
      requestBody.state = state
    }
    
    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
    
    if (!response.ok) {
      let errorDetails = ''
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json()
          errorDetails = JSON.stringify(errorData)
        } catch (e) {
          errorDetails = 'Failed to parse JSON error response'
        }
      } else {
        try {
          errorDetails = await response.text()
        } catch (e) {
          errorDetails = 'Failed to read error response'
        }
      }
      
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails
      })
      throw new Error(`Token exchange failed (${response.status}): ${errorDetails}`)
    }
    
      const tokenResponse: OAuthTokenResponse = await response.json()
      return tokenResponse
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error:', error)
        throw new Error('Network error: Could not connect to backend server. Make sure the backend is running on http://localhost:8000')
      }
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId
    })
    
    const response = await fetch('http://localhost:8000/api/v1/oauth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId
      })
    })
    
    if (!response.ok) {
      let errorDetails = ''
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json()
          errorDetails = JSON.stringify(errorData)
        } catch (e) {
          errorDetails = 'Failed to parse JSON error response'
        }
      } else {
        try {
          errorDetails = await response.text()
        } catch (e) {
          errorDetails = 'Failed to read error response'
        }
      }
      
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails
      })
      throw new Error(`Token refresh failed (${response.status}): ${errorDetails}`)
    }
    
    const tokenResponse: OAuthTokenResponse = await response.json()
    return tokenResponse
  }

  /**
   * Validate that a token is still valid
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // Try to make a simple API call to validate the token
      // Note: The exact validation endpoint for OAuth tokens is not publicly documented
      const response = await fetch('https://api.anthropic.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'anthropic-version': '2023-06-01'
        }
      })
      
      return response.ok
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }

  /**
   * Revoke tokens (logout)
   * Note: Token revocation endpoint may not be available for OAuth tokens
   */
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      // The revocation endpoint for OAuth tokens is not publicly documented
      // This is a best-effort attempt based on OAuth 2.0 standards
      await fetch('https://console.anthropic.com/oauth/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          token: accessToken,
          client_id: this.config.clientId,
          token_type_hint: 'access_token'
        }).toString()
      })
    } catch (error) {
      console.error('Token revocation failed:', error)
      // Even if revocation fails, we should clear local storage
    }
  }

  /**
   * Check if token needs refresh (5 minutes before expiry)
   */
  isTokenExpired(expiresAt: number): boolean {
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    return now >= (expiresAt - bufferTime)
  }

  /**
   * Calculate expiry timestamp from expires_in
   */
  calculateExpiryTime(expiresIn: number): number {
    return Date.now() + (expiresIn * 1000)
  }
}

export const claudeOAuth = new ClaudeOAuthService()