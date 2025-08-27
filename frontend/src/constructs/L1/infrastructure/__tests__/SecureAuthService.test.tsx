/**
 * SecureAuthService L1 Infrastructure Construct Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecureAuthService } from '../SecureAuthService'

// Mock the base class
vi.mock('../../base/L1InfrastructureConstruct', () => ({
  L1InfrastructureConstruct: class {
    constructor(props: any) {
      Object.assign(this, props)
    }
    initialize = vi.fn()
    destroy = vi.fn()
    renderStatus = () => null
  }
}))

describe('SecureAuthService', () => {
  let component: SecureAuthService
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(async () => {
    if (component) {
      await component.destroy()
    }
  })
  
  describe('Initialization', () => {
    it('should initialize with basic JWT configuration', async () => {
      component = new SecureAuthService()
      
      const config = {
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret',
          algorithm: 'HS256' as const
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.serviceId).toBeDefined()
      expect(result.status).toBe('active')
      expect(result.endpoints.login).toBeDefined()
      expect(result.endpoints.refresh).toBeDefined()
    })
    
    it('should configure MFA when enabled', async () => {
      component = new SecureAuthService()
      
      const config = {
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        },
        mfaConfig: {
          enabled: true,
          required: false,
          methods: ['totp', 'sms'] as any,
          backupCodes: {
            enabled: true,
            count: 10,
            length: 8
          }
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.capabilities.mfa).toBe(true)
    })
    
    it('should configure OAuth2 providers', async () => {
      component = new SecureAuthService()
      
      const config = {
        authConfig: {
          provider: 'oauth2' as const,
          issuer: 'test-issuer',
          audience: 'test-audience'
        },
        tokenConfig: {
          accessTokenExpiry: 3600,
          refreshTokenExpiry: 2592000,
          refreshTokenRotation: false,
          revokeOldRefreshTokens: false,
          includePermissions: false
        },
        oauth2Config: {
          enabled: true,
          providers: [
            {
              name: 'google',
              clientId: 'google-client-id',
              clientSecret: 'google-secret',
              authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
              scopes: ['openid', 'email', 'profile'],
              mapping: {
                id: 'id',
                email: 'email',
                name: 'name',
                avatar: 'picture'
              }
            }
          ],
          defaultScopes: ['openid', 'email'],
          pkce: true,
          stateParameter: true
        }
      }
      
      const result = await component.initialize(config)
      
      expect(result.capabilities.oauth2).toBe(true)
      expect(result.capabilities.socialLogin).toBe(true)
    })
  })
  
  describe('Authentication', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        }
      })
    })
    
    it('should login successfully with valid credentials', async () => {
      const loginSpy = vi.fn()
      component.on('login', loginSpy)
      
      // First register a user
      await component.register({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      })
      
      // Then login
      const result = await component.login({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.tokenType).toBe('Bearer')
      expect(result.expiresIn).toBe(900)
      expect(loginSpy).toHaveBeenCalled()
    })
    
    it('should fail login with invalid credentials', async () => {
      const errorSpy = vi.fn()
      component.on('loginError', errorSpy)
      
      await expect(
        component.login({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow('Invalid credentials')
      
      expect(errorSpy).toHaveBeenCalled()
    })
    
    it('should logout successfully', async () => {
      const logoutSpy = vi.fn()
      component.on('logout', logoutSpy)
      
      // Login first
      await component.register({
        email: 'test@example.com',
        password: 'password123'
      })
      
      const { accessToken } = await component.login({
        email: 'test@example.com',
        password: 'password123'
      })
      
      // Then logout
      await component.logout(accessToken)
      
      expect(logoutSpy).toHaveBeenCalled()
    })
    
    it('should refresh token successfully', async () => {
      const refreshSpy = vi.fn()
      component.on('tokenRefresh', refreshSpy)
      
      // Login to get tokens
      await component.register({
        email: 'test@example.com',
        password: 'password123'
      })
      
      const { refreshToken } = await component.login({
        email: 'test@example.com',
        password: 'password123'
      })
      
      // Refresh token
      const result = await component.refreshToken(refreshToken!)
      
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(refreshSpy).toHaveBeenCalled()
    })
  })
  
  describe('Registration', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        },
        securityConfig: {
          bruteForceProtection: {
            enabled: false,
            maxAttempts: 5,
            windowMinutes: 15,
            blockDurationMinutes: 30
          },
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            preventReuse: 5
          },
          anomalyDetection: false,
          riskScoring: false
        }
      })
    })
    
    it('should register new user successfully', async () => {
      const registerSpy = vi.fn()
      component.on('register', registerSpy)
      
      const result = await component.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        username: 'newuser',
        roles: ['user']
      })
      
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('newuser@example.com')
      expect(result.tokens.accessToken).toBeDefined()
      expect(registerSpy).toHaveBeenCalled()
    })
    
    it('should reject registration with existing email', async () => {
      // Register first user
      await component.register({
        email: 'existing@example.com',
        password: 'Password123!',
        username: 'existing'
      })
      
      // Try to register with same email
      await expect(
        component.register({
          email: 'existing@example.com',
          password: 'Password456!',
          username: 'another'
        })
      ).rejects.toThrow('User already exists')
    })
    
    it('should enforce password policy', async () => {
      await expect(
        component.register({
          email: 'test@example.com',
          password: 'weak',
          username: 'testuser'
        })
      ).rejects.toThrow('Password must be at least 8 characters')
      
      await expect(
        component.register({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
        })
      ).rejects.toThrow('Password must contain uppercase letters')
      
      await expect(
        component.register({
          email: 'test@example.com',
          password: 'PASSWORD123',
          username: 'testuser'
        })
      ).rejects.toThrow('Password must contain lowercase letters')
      
      await expect(
        component.register({
          email: 'test@example.com',
          password: 'Password',
          username: 'testuser'
        })
      ).rejects.toThrow('Password must contain numbers')
      
      await expect(
        component.register({
          email: 'test@example.com',
          password: 'Password123',
          username: 'testuser'
        })
      ).rejects.toThrow('Password must contain special characters')
    })
  })
  
  describe('MFA', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        },
        mfaConfig: {
          enabled: true,
          required: false,
          methods: ['totp', 'sms'],
          backupCodes: {
            enabled: true,
            count: 10,
            length: 8
          }
        }
      })
    })
    
    it('should initiate MFA challenge when enabled', async () => {
      const mfaSpy = vi.fn()
      component.on('mfaInitiated', mfaSpy)
      
      // Register user with MFA
      const { user } = await component.register({
        email: 'mfa@example.com',
        password: 'password123',
        username: 'mfauser'
      })
      
      // Enable MFA for user
      user.mfaEnabled = true
      
      // Login should trigger MFA
      const result = await component.login({
        email: 'mfa@example.com',
        password: 'password123'
      })
      
      expect(result.requiresMFA).toBe(true)
      expect(result.challengeId).toBeDefined()
      expect(result.methods).toContain('totp')
      expect(mfaSpy).toHaveBeenCalled()
    })
    
    it('should verify MFA code successfully', async () => {
      const mfaVerifiedSpy = vi.fn()
      component.on('mfaVerified', mfaVerifiedSpy)
      
      // Get MFA challenge
      const { user } = await component.register({
        email: 'mfa@example.com',
        password: 'password123'
      })
      user.mfaEnabled = true
      
      const challenge = await component.login({
        email: 'mfa@example.com',
        password: 'password123'
      })
      
      // Verify MFA
      const result = await component.verifyMFA(challenge.challengeId, '123456')
      
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(mfaVerifiedSpy).toHaveBeenCalled()
    })
    
    it('should reject invalid MFA code', async () => {
      const mfaErrorSpy = vi.fn()
      component.on('mfaError', mfaErrorSpy)
      
      await expect(
        component.verifyMFA('invalid-challenge', 'wrong-code')
      ).rejects.toThrow()
      
      expect(mfaErrorSpy).toHaveBeenCalled()
    })
  })
  
  describe('Security Features', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        },
        securityConfig: {
          bruteForceProtection: {
            enabled: true,
            maxAttempts: 3,
            windowMinutes: 15,
            blockDurationMinutes: 30
          },
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            preventReuse: 5
          },
          anomalyDetection: false,
          riskScoring: false
        },
        rateLimitConfig: {
          enabled: true,
          endpoints: {
            login: { requests: 5, windowMinutes: 1 },
            register: { requests: 2, windowMinutes: 1 },
            refresh: { requests: 10, windowMinutes: 1 },
            passwordReset: { requests: 1, windowMinutes: 5 }
          }
        }
      })
    })
    
    it('should enforce rate limiting', async () => {
      // Register a user
      await component.register({
        email: 'ratelimit@example.com',
        password: 'Password123'
      })
      
      // Make multiple login attempts
      for (let i = 0; i < 5; i++) {
        await component.login({
          email: 'ratelimit@example.com',
          password: 'Password123'
        })
      }
      
      // 6th attempt should be rate limited
      await expect(
        component.login({
          email: 'ratelimit@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Rate limit exceeded')
    })
    
    it('should implement brute force protection', async () => {
      const lockSpy = vi.fn()
      component.on('accountLocked', lockSpy)
      
      // Register a user
      await component.register({
        email: 'bruteforce@example.com',
        password: 'Password123'
      })
      
      // Make failed login attempts
      for (let i = 0; i < 3; i++) {
        try {
          await component.login({
            email: 'bruteforce@example.com',
            password: 'wrongpassword'
          })
        } catch (e) {
          // Expected to fail
        }
      }
      
      // Account should be locked
      await expect(
        component.login({
          email: 'bruteforce@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Account temporarily locked')
      
      expect(lockSpy).toHaveBeenCalled()
    })
  })
  
  describe('Password Management', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        }
      })
    })
    
    it('should change password successfully', async () => {
      const passwordChangedSpy = vi.fn()
      component.on('passwordChanged', passwordChangedSpy)
      
      // Register user
      const { user } = await component.register({
        email: 'password@example.com',
        password: 'password123'
      })
      
      // Change password
      await component.changePassword(
        user.id,
        'password123',
        'newPassword123'
      )
      
      expect(passwordChangedSpy).toHaveBeenCalled()
      
      // Old password should not work
      await expect(
        component.login({
          email: 'password@example.com',
          password: 'password123'
        })
      ).rejects.toThrow()
    })
    
    it('should reject password change with wrong old password', async () => {
      const { user } = await component.register({
        email: 'password@example.com',
        password: 'password123'
      })
      
      await expect(
        component.changePassword(
          user.id,
          'wrongpassword',
          'newPassword123'
        )
      ).rejects.toThrow('Invalid password')
    })
  })
  
  describe('Token Verification', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        }
      })
    })
    
    it('should verify valid token', async () => {
      // Get a valid token
      await component.register({
        email: 'verify@example.com',
        password: 'password123'
      })
      
      const { accessToken } = await component.login({
        email: 'verify@example.com',
        password: 'password123'
      })
      
      const decoded = await component.verifyToken(accessToken)
      
      expect(decoded).toBeDefined()
      expect(decoded.email).toBe('verify@example.com')
      expect(decoded.iss).toBe('test-issuer')
      expect(decoded.aud).toBe('test-audience')
    })
    
    it('should reject invalid token', async () => {
      await expect(
        component.verifyToken('invalid.token.here')
      ).rejects.toThrow('Invalid token')
    })
    
    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
                          btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + '.' +
                          btoa('signature')
      
      await expect(
        component.verifyToken(expiredToken)
      ).rejects.toThrow('Token expired')
    })
  })
  
  describe('Audit Logging', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        },
        auditConfig: {
          enabled: true,
          events: ['login', 'logout', 'token_refresh', 'password_change'],
          retention: 90,
          sensitiveDataMasking: true,
          includeRequestDetails: true
        }
      })
    })
    
    it('should log authentication events', async () => {
      const auditSpy = vi.fn()
      component.on('audit', auditSpy)
      
      // Register and login
      await component.register({
        email: 'audit@example.com',
        password: 'password123'
      })
      
      await component.login({
        email: 'audit@example.com',
        password: 'password123'
      })
      
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'login',
          userId: expect.any(String),
          timestamp: expect.any(Date)
        })
      )
    })
  })
  
  describe('Metrics', () => {
    beforeEach(async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        }
      })
      
      // Create some users and sessions
      for (let i = 0; i < 5; i++) {
        await component.register({
          email: `user${i}@example.com`,
          password: 'password123'
        })
      }
    })
    
    it('should collect authentication metrics', async () => {
      const metrics = await component.getMetrics()
      
      expect(metrics.totalUsers).toBe(5)
      expect(metrics.activeSessions).toBeGreaterThanOrEqual(0)
      expect(metrics.loginRate).toBeGreaterThanOrEqual(0)
      expect(metrics.failedLogins).toBeGreaterThanOrEqual(0)
      expect(metrics.mfaAdoption).toBeGreaterThanOrEqual(0)
      expect(metrics.mfaAdoption).toBeLessThanOrEqual(1)
      expect(metrics.topLoginMethods).toBeDefined()
      expect(Array.isArray(metrics.topLoginMethods)).toBe(true)
    })
    
    it('should emit metrics periodically', async () => {
      const metricsSpy = vi.fn()
      component.on('metrics', metricsSpy)
      
      // Fast-forward time
      vi.useFakeTimers()
      vi.advanceTimersByTime(60000)
      
      await waitFor(() => {
        expect(metricsSpy).toHaveBeenCalled()
      })
      
      vi.useRealTimers()
    })
  })
  
  describe('Destruction', () => {
    it('should clean up resources on destroy', async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        }
      })
      
      const destroyedSpy = vi.fn()
      component.on('destroyed', destroyedSpy)
      
      await component.destroy()
      
      expect(destroyedSpy).toHaveBeenCalled()
    })
  })
  
  describe('UI Rendering', () => {
    it('should render status component', async () => {
      component = new SecureAuthService()
      await component.initialize({
        authConfig: {
          provider: 'jwt' as const,
          issuer: 'test-issuer',
          audience: 'test-audience',
          secretKey: 'test-secret'
        },
        tokenConfig: {
          accessTokenExpiry: 900,
          refreshTokenExpiry: 604800,
          refreshTokenRotation: true,
          revokeOldRefreshTokens: true,
          includePermissions: true
        },
        mfaConfig: {
          enabled: true,
          methods: ['totp'],
          backupCodes: {
            enabled: true,
            count: 10,
            length: 8
          }
        }
      })
      
      render(<div>{component.renderStatus()}</div>)
      
      expect(screen.getByText(/Secure Auth Service Status/)).toBeInTheDocument()
      expect(screen.getByText(/Status: active/)).toBeInTheDocument()
      expect(screen.getByText(/MFA Enabled: Yes/)).toBeInTheDocument()
      expect(screen.getByText(/Health: healthy/)).toBeInTheDocument()
    })
  })
})