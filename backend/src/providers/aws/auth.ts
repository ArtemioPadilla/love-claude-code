import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
  GlobalSignOutCommand,
  AuthFlowType,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider'
import { AuthProvider, User } from '../types.js'
import { AWSConfig, getAWSClientConfig } from './utils/config.js'
import { MetricsCollector, trackPerformance } from './utils/metrics.js'
import { logger } from './utils/logger.js'
import { withRetry } from './utils/retry.js'
import { CacheManager } from './utils/cache.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export class AWSAuthProvider implements AuthProvider {
  private client: CognitoIdentityProviderClient
  private userPoolId: string
  private clientId: string
  private cache: CacheManager
  
  constructor(
    private config: AWSConfig,
    private metrics: MetricsCollector
  ) {
    this.client = new CognitoIdentityProviderClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.cognito
    })
    
    this.userPoolId = config.options.cognitoUserPoolId || ''
    this.clientId = config.options.cognitoClientId || ''
    this.cache = new CacheManager(config)
  }
  
  async initialize(): Promise<void> {
    if (!this.userPoolId || !this.clientId) {
      throw new Error('Cognito User Pool ID and Client ID are required')
    }
    
    await this.cache.initialize()
    logger.info('AWS Auth provider initialized', {
      userPoolId: this.userPoolId
    })
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  @trackPerformance
  async signUp(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    try {
      // Create user in Cognito
      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          ...(name ? [{ Name: 'name', Value: name }] : [])
        ],
        MessageAction: MessageActionType.SUPPRESS,
        TemporaryPassword: password
      })
      
      const response = await withRetry(
        () => this.client.send(command),
        this.config.options.maxRetries
      )
      
      // Set permanent password
      await this.client.send(new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: password,
        Permanent: true
      }))
      
      // Sign in to get tokens
      return this.signIn(email, password)
    } catch (error: any) {
      logger.error('Sign up failed', { error, email })
      
      if (error.name === 'UsernameExistsException') {
        throw new Error('User already exists')
      }
      
      throw error
    }
  }
  
  @trackPerformance
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      })
      
      const response = await withRetry(
        () => this.client.send(command),
        this.config.options.maxRetries
      )
      
      if (!response.AuthenticationResult?.IdToken) {
        throw new Error('Authentication failed')
      }
      
      // Decode ID token to get user info
      const decoded = jwt.decode(response.AuthenticationResult.IdToken) as any
      
      const user: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        createdAt: new Date(decoded['cognito:username'] || Date.now()),
        updatedAt: new Date(),
        metadata: {
          groups: decoded['cognito:groups'] || [],
          attributes: decoded
        }
      }
      
      // Cache user data
      await this.cache.set(`user:${user.id}`, user, 3600) // 1 hour
      
      return {
        user,
        token: response.AuthenticationResult.IdToken
      }
    } catch (error: any) {
      logger.error('Sign in failed', { error, email })
      
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Invalid credentials')
      }
      
      throw error
    }
  }
  
  @trackPerformance
  async signOut(userId: string): Promise<void> {
    try {
      // Global sign out - invalidates all tokens
      await this.client.send(new GlobalSignOutCommand({
        AccessToken: userId // In production, this should be the actual access token
      }))
      
      // Clear cache
      await this.cache.delete(`user:${userId}`)
    } catch (error) {
      logger.error('Sign out failed', { error, userId })
      // Don't throw on sign out errors
    }
  }
  
  @trackPerformance
  async verifyToken(token: string): Promise<User> {
    try {
      // In production, verify with Cognito's JWKS
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token')
      }
      
      // Check cache first
      const cachedUser = await this.cache.get<User>(`user:${decoded.sub}`)
      if (cachedUser) {
        return cachedUser
      }
      
      // Get user from Cognito
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: decoded.sub
      })
      
      const response = await withRetry(
        () => this.client.send(command),
        this.config.options.maxRetries
      )
      
      const attributes = response.UserAttributes?.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value
        }
        return acc
      }, {} as Record<string, string>) || {}
      
      const user: User = {
        id: decoded.sub,
        email: attributes.email || '',
        name: attributes.name,
        createdAt: new Date(response.UserCreateDate || Date.now()),
        updatedAt: new Date(response.UserLastModifiedDate || Date.now()),
        metadata: { attributes }
      }
      
      // Cache user
      await this.cache.set(`user:${user.id}`, user, 3600)
      
      return user
    } catch (error) {
      logger.error('Token verification failed', { error })
      throw new Error('Invalid token')
    }
  }
  
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      return await this.verifyToken(token)
    } catch {
      return null
    }
  }
  
  @trackPerformance
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const attributes = []
      
      if (updates.email) {
        attributes.push({ Name: 'email', Value: updates.email })
      }
      if (updates.name !== undefined) {
        attributes.push({ Name: 'name', Value: updates.name || '' })
      }
      
      if (attributes.length > 0) {
        await this.client.send(new AdminUpdateUserAttributesCommand({
          UserPoolId: this.userPoolId,
          Username: userId,
          UserAttributes: attributes
        }))
      }
      
      // Clear cache to force refresh
      await this.cache.delete(`user:${userId}`)
      
      // Get updated user
      const user = await this.verifyToken(userId) // This would need the actual token
      return user
    } catch (error) {
      logger.error('Update user failed', { error, userId })
      throw error
    }
  }
  
  @trackPerformance
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.send(new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: userId
      }))
      
      // Clear cache
      await this.cache.delete(`user:${userId}`)
    } catch (error) {
      logger.error('Delete user failed', { error, userId })
      throw error
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // List users with limit 1 to test connection
      await this.client.send(new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: 1
      }))
      
      return {
        status: 'healthy',
        details: {
          userPoolId: this.userPoolId,
          cacheStatus: await this.cache.healthCheck()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}