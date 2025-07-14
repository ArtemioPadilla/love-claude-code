import { Auth, UserRecord, DecodedIdToken } from 'firebase-admin/auth'
import {
  AuthProvider,
  User,
  UserCredentials,
  AuthToken
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { FirebaseMetricsCollector, trackFirebasePerformance } from './utils/metrics.js'
import { FirebaseCacheManager } from './utils/cache.js'
import { withFirebaseRetry, retryableFirebase } from './utils/retry.js'
import { logger } from '../aws/utils/logger.js'
import { v4 as uuidv4 } from 'uuid'
import * as jwt from 'jsonwebtoken'

export class FirebaseAuthProvider implements AuthProvider {
  private auth: Auth
  private cache: FirebaseCacheManager
  private readonly tokenExpiry = 3600 // 1 hour
  
  constructor(
    private services: FirebaseServices,
    private config: FirebaseConfig,
    private metrics: FirebaseMetricsCollector
  ) {
    this.auth = services.auth
    this.cache = new FirebaseCacheManager(config)
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // Verify auth service is accessible
    try {
      await this.auth.listUsers(1)
      logger.info('Firebase Auth provider initialized')
    } catch (error) {
      logger.error('Failed to initialize Firebase Auth', { error })
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async signUp(credentials: UserCredentials): Promise<User> {
    try {
      // Create user
      const userRecord = await this.auth.createUser({
        email: credentials.email,
        password: credentials.password,
        emailVerified: false,
        disabled: false
      })
      
      // Set custom claims if role provided
      if (credentials.metadata?.role) {
        await this.auth.setCustomUserClaims(userRecord.uid, {
          role: credentials.metadata.role
        })
      }
      
      const user: User = {
        id: userRecord.uid,
        email: userRecord.email!,
        emailVerified: userRecord.emailVerified || false,
        metadata: {
          ...credentials.metadata,
          createdAt: userRecord.metadata.creationTime,
          lastLoginAt: userRecord.metadata.lastSignInTime
        }
      }
      
      // Cache user data
      await this.cache.set(`user:${user.id}`, user, 300)
      
      await this.metrics.recordSuccess('SignUp')
      
      return user
    } catch (error: any) {
      logger.error('Sign up failed', { error, email: credentials.email })
      await this.metrics.recordError('SignUp', error)
      
      // Convert Firebase errors to our error format
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Email already in use')
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address')
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak')
      }
      
      throw error
    }
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async signIn(credentials: UserCredentials): Promise<{ user: User; token: string }> {
    try {
      // Firebase Admin SDK doesn't support password verification directly
      // In production, you would use Firebase Client SDK or custom token generation
      
      // For now, we'll look up the user and generate a custom token
      const userRecord = await this.auth.getUserByEmail(credentials.email)
      
      if (!userRecord || userRecord.disabled) {
        throw new Error('Invalid credentials')
      }
      
      // Generate custom token
      const customToken = await this.auth.createCustomToken(userRecord.uid, {
        email: userRecord.email,
        role: userRecord.customClaims?.role
      })
      
      // Create JWT for our system
      const token = jwt.sign(
        {
          sub: userRecord.uid,
          email: userRecord.email,
          role: userRecord.customClaims?.role
        },
        process.env.JWT_SECRET || 'firebase-secret-key',
        { expiresIn: this.tokenExpiry }
      )
      
      const user: User = {
        id: userRecord.uid,
        email: userRecord.email!,
        emailVerified: userRecord.emailVerified || false,
        metadata: {
          ...userRecord.customClaims,
          lastLoginAt: new Date().toISOString()
        }
      }
      
      // Update last sign in time
      await this.auth.updateUser(userRecord.uid, {
        // Firebase Admin SDK doesn't directly update last sign in
        // This would be handled by client SDK
      })
      
      // Cache user data
      await this.cache.set(`user:${user.id}`, user, 3600)
      
      await this.metrics.recordSuccess('SignIn')
      
      return { user, token }
    } catch (error: any) {
      logger.error('Sign in failed', { error, email: credentials.email })
      await this.metrics.recordError('SignIn', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async signOut(userId: string): Promise<void> {
    try {
      // Revoke refresh tokens
      await this.auth.revokeRefreshTokens(userId)
      
      // Clear cache
      await this.cache.delete(`user:${userId}`)
      
      await this.metrics.recordSuccess('SignOut')
    } catch (error: any) {
      logger.error('Sign out failed', { error, userId })
      await this.metrics.recordError('SignOut', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  @FirebaseCacheManager.cacheable({ ttl: 300 })
  async getUser(userId: string): Promise<User | null> {
    try {
      const userRecord = await this.auth.getUser(userId)
      
      if (!userRecord) {
        return null
      }
      
      const user: User = {
        id: userRecord.uid,
        email: userRecord.email!,
        emailVerified: userRecord.emailVerified || false,
        metadata: {
          ...userRecord.customClaims,
          createdAt: userRecord.metadata.creationTime,
          lastLoginAt: userRecord.metadata.lastSignInTime,
          lastRefreshTime: userRecord.metadata.lastRefreshTime
        }
      }
      
      await this.metrics.recordSuccess('GetUser')
      return user
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return null
      }
      
      logger.error('Get user failed', { error, userId })
      await this.metrics.recordError('GetUser', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData: any = {}
      
      if (updates.email) {
        updateData.email = updates.email
      }
      
      if (updates.emailVerified !== undefined) {
        updateData.emailVerified = updates.emailVerified
      }
      
      if (updates.metadata) {
        // Update custom claims
        await this.auth.setCustomUserClaims(userId, updates.metadata)
      }
      
      // Update user record
      const userRecord = await this.auth.updateUser(userId, updateData)
      
      const user: User = {
        id: userRecord.uid,
        email: userRecord.email!,
        emailVerified: userRecord.emailVerified || false,
        metadata: userRecord.customClaims || {}
      }
      
      // Clear cache
      await this.cache.delete(`user:${userId}`)
      
      await this.metrics.recordSuccess('UpdateUser')
      return user
    } catch (error: any) {
      logger.error('Update user failed', { error, userId })
      await this.metrics.recordError('UpdateUser', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.auth.deleteUser(userId)
      
      // Clear cache
      await this.cache.delete(`user:${userId}`)
      
      await this.metrics.recordSuccess('DeleteUser')
    } catch (error: any) {
      logger.error('Delete user failed', { error, userId })
      await this.metrics.recordError('DeleteUser', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async verifyToken(token: string): Promise<AuthToken> {
    try {
      // Try to verify as Firebase ID token first
      let decodedToken: DecodedIdToken | any
      
      try {
        decodedToken = await this.auth.verifyIdToken(token)
      } catch {
        // Fall back to JWT verification
        decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'firebase-secret-key')
      }
      
      const authToken: AuthToken = {
        userId: decodedToken.uid || decodedToken.sub,
        email: decodedToken.email,
        expiresAt: new Date(decodedToken.exp * 1000),
        metadata: {
          role: decodedToken.role,
          ...decodedToken
        }
      }
      
      await this.metrics.recordSuccess('VerifyToken')
      return authToken
    } catch (error: any) {
      logger.error('Token verification failed', { error })
      await this.metrics.recordError('VerifyToken', error)
      
      if (error.code === 'auth/id-token-expired' || error.name === 'TokenExpiredError') {
        throw new Error('Token expired')
      }
      if (error.code === 'auth/id-token-revoked') {
        throw new Error('Token revoked')
      }
      
      throw new Error('Invalid token')
    }
  }
  
  @trackFirebasePerformance
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Firebase Admin SDK doesn't handle refresh tokens directly
      // This would typically be handled by the client SDK
      // For now, we'll decode the refresh token and issue a new token
      
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'firebase-refresh-secret') as any
      
      // Verify user still exists and is active
      const userRecord = await this.auth.getUser(decoded.sub)
      if (!userRecord || userRecord.disabled) {
        throw new Error('User not found or disabled')
      }
      
      // Generate new tokens
      const token = jwt.sign(
        {
          sub: userRecord.uid,
          email: userRecord.email,
          role: userRecord.customClaims?.role
        },
        process.env.JWT_SECRET || 'firebase-secret-key',
        { expiresIn: this.tokenExpiry }
      )
      
      const newRefreshToken = jwt.sign(
        { sub: userRecord.uid },
        process.env.JWT_SECRET || 'firebase-refresh-secret',
        { expiresIn: '30d' }
      )
      
      await this.metrics.recordSuccess('RefreshToken')
      
      return { token, refreshToken: newRefreshToken }
    } catch (error: any) {
      logger.error('Token refresh failed', { error })
      await this.metrics.recordError('RefreshToken', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Firebase Admin SDK doesn't send emails directly
      // You would typically use Firebase Client SDK or trigger Cloud Functions
      
      const userRecord = await this.auth.getUserByEmail(email)
      if (!userRecord) {
        // Don't reveal if user exists
        return
      }
      
      // Generate password reset link
      const resetLink = await this.auth.generatePasswordResetLink(email, {
        url: `${process.env.APP_URL}/reset-password`
      })
      
      // In production, send this via email service
      logger.info('Password reset link generated', { email, resetLink })
      
      await this.metrics.recordSuccess('SendPasswordReset')
    } catch (error: any) {
      logger.error('Send password reset failed', { error, email })
      await this.metrics.recordError('SendPasswordReset', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async sendEmailVerification(userId: string): Promise<void> {
    try {
      const userRecord = await this.auth.getUser(userId)
      if (!userRecord || !userRecord.email) {
        throw new Error('User not found')
      }
      
      // Generate email verification link
      const verificationLink = await this.auth.generateEmailVerificationLink(
        userRecord.email,
        {
          url: `${process.env.APP_URL}/verify-email`
        }
      )
      
      // In production, send this via email service
      logger.info('Email verification link generated', { 
        userId, 
        email: userRecord.email,
        verificationLink 
      })
      
      await this.metrics.recordSuccess('SendEmailVerification')
    } catch (error: any) {
      logger.error('Send email verification failed', { error, userId })
      await this.metrics.recordError('SendEmailVerification', error)
      throw error
    }
  }
  
  // Batch operations
  async createUsers(users: UserCredentials[]): Promise<User[]> {
    const results: User[] = []
    const errors: any[] = []
    
    // Process in batches of 10
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      const promises = batch.map(async (creds) => {
        try {
          const user = await this.signUp(creds)
          results.push(user)
        } catch (error) {
          errors.push({ email: creds.email, error })
        }
      })
      
      await Promise.all(promises)
    }
    
    if (errors.length > 0) {
      logger.warn('Some users failed to create', { errors })
    }
    
    return results
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Test auth service
      await this.auth.listUsers(1)
      
      const cacheHealth = await this.cache.healthCheck()
      
      return {
        status: 'healthy',
        details: {
          cache: cacheHealth,
          metrics: this.metrics.getSummary()
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