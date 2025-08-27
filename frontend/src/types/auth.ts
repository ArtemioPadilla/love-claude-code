// Authentication types for Love Claude Code

export type AuthMethod = 'api-key' | 'oauth-max' | 'claude-cli' | 'claude-code-cli'

export interface APIKeyAuth {
  type: 'api-key'
  apiKey: string
}

export interface OAuthAuth {
  type: 'oauth-max'
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix timestamp
}

export type AuthCredentials = APIKeyAuth | OAuthAuth

export interface OAuthTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  token_type: string
  scope?: string
}

export interface OAuthConfig {
  clientId: string
  redirectUri: string
  authorizationEndpoint: string
  tokenEndpoint: string
  scopes: string[]
}

export interface PKCEChallenge {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

export interface OAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  authMethod: AuthMethod
  credentials: AuthCredentials | null
}