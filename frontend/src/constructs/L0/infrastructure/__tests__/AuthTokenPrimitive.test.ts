import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthTokenPrimitive } from '../AuthTokenPrimitive'

describe('L0: AuthTokenPrimitive', () => {
  let construct: AuthTokenPrimitive

  beforeEach(() => {
    construct = new AuthTokenPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.id).toBe('platform-l0-auth-token-primitive')
      expect(construct.level).toBe('L0')
      expect(construct.getInput('tokenPrefix')).toBe('token')
      expect(construct.getInput('tokenLength')).toBe(32)
      expect(construct.getInput('expirationTime')).toBe(0)
    })

    it('should accept custom configuration', async () => {
      await construct.initialize({
        tokenPrefix: 'api',
        tokenLength: 16,
        expirationTime: 3600000 // 1 hour
      })
      
      expect(construct.getInput('tokenPrefix')).toBe('api')
      expect(construct.getInput('tokenLength')).toBe(16)
      expect(construct.getInput('expirationTime')).toBe(3600000)
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({})
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({})
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(20)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({})
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({})
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Deployment', () => {
    it('should deploy successfully', async () => {
      await construct.initialize({})
      
      await expect(construct.deploy()).resolves.not.toThrow()
      
      const outputs = construct.getOutputs()
      expect(outputs.activeTokens).toBe(0)
      expect(outputs.totalGenerated).toBe(0)
    })
  })

  describe('Token Generation', () => {
    beforeEach(async () => {
      await construct.initialize({})
      await construct.deploy()
    })

    it('should generate tokens with default format', async () => {
      const token = await construct.generate()
      
      expect(token).toMatch(/^token_[A-Za-z0-9]{32}$/)
      expect(construct.getOutputs().activeTokens).toBe(1)
      expect(construct.getOutputs().totalGenerated).toBe(1)
    })

    it('should generate tokens with custom prefix', async () => {
      await construct.initialize({
        tokenPrefix: 'session',
        tokenLength: 16
      })
      await construct.deploy()
      
      const token = await construct.generate()
      
      expect(token).toMatch(/^session_[A-Za-z0-9]{16}$/)
    })

    it('should generate tokens with payload', async () => {
      const payload = {
        userId: 'user123',
        permissions: ['read', 'write'],
        metadata: { source: 'api' }
      }
      
      const token = await construct.generate(payload)
      const data = await construct.getTokenData(token)
      
      expect(data?.payload).toEqual(payload)
    })

    it('should generate multiple unique tokens', async () => {
      const tokens = new Set<string>()
      
      for (let i = 0; i < 100; i++) {
        const token = await construct.generate()
        tokens.add(token)
      }
      
      expect(tokens.size).toBe(100)
      expect(construct.getOutputs().totalGenerated).toBe(100)
    })

    it('should generate non-expiring tokens by default', async () => {
      const token = await construct.generate()
      const data = await construct.getTokenData(token)
      
      expect(data?.expiresAt).toBeNull()
      expect(data?.isExpired).toBe(false)
    })

    it('should generate expiring tokens when configured', async () => {
      await construct.initialize({
        expirationTime: 1000 // 1 second
      })
      await construct.deploy()
      
      const token = await construct.generate()
      const data = await construct.getTokenData(token)
      
      expect(data?.expiresAt).toBeInstanceOf(Date)
      expect(data?.expiresAt!.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('Token Validation', () => {
    let token: string

    beforeEach(async () => {
      await construct.initialize({})
      await construct.deploy()
      token = await construct.generate({ userId: 'test' })
    })

    it('should validate existing tokens', async () => {
      const isValid = await construct.validate(token)
      
      expect(isValid).toBe(true)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.type).toBe('validate')
      expect(lastOp.success).toBe(true)
    })

    it('should reject non-existent tokens', async () => {
      const isValid = await construct.validate('invalid_token')
      
      expect(isValid).toBe(false)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.success).toBe(false)
      expect(lastOp.reason).toBe('not_found')
    })

    it('should update last accessed time on validation', async () => {
      const dataBefore = await construct.getTokenData(token)
      const accessedBefore = dataBefore?.lastAccessed
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await construct.validate(token)
      
      const dataAfter = await construct.getTokenData(token)
      expect(dataAfter?.lastAccessed.getTime()).toBeGreaterThan(accessedBefore!.getTime())
    })

    it('should reject expired tokens', async () => {
      await construct.initialize({
        expirationTime: 100 // 100ms
      })
      await construct.deploy()
      
      const expToken = await construct.generate()
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const isValid = await construct.validate(expToken)
      
      expect(isValid).toBe(false)
      
      const lastOp = construct.getOutputs().lastOperation
      expect(lastOp.reason).toBe('expired')
    })
  })

  describe('Token Data Retrieval', () => {
    let token: string
    const payload = { userId: 'user123', role: 'admin' }

    beforeEach(async () => {
      await construct.initialize({})
      await construct.deploy()
      token = await construct.generate(payload)
    })

    it('should retrieve token data', async () => {
      const data = await construct.getTokenData(token)
      
      expect(data).toBeDefined()
      expect(data?.token).toBe(token)
      expect(data?.payload).toEqual(payload)
      expect(data?.createdAt).toBeInstanceOf(Date)
      expect(data?.lastAccessed).toBeInstanceOf(Date)
      expect(data?.isExpired).toBe(false)
    })

    it('should return null for non-existent tokens', async () => {
      const data = await construct.getTokenData('invalid_token')
      
      expect(data).toBeNull()
    })

    it('should mark expired tokens', async () => {
      await construct.initialize({
        expirationTime: 50
      })
      await construct.deploy()
      
      const expToken = await construct.generate()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const data = await construct.getTokenData(expToken)
      expect(data?.isExpired).toBe(true)
    })
  })

  describe('Token Revocation', () => {
    beforeEach(async () => {
      await construct.initialize({})
      await construct.deploy()
    })

    it('should revoke existing tokens', async () => {
      const token = await construct.generate()
      
      const revoked = await construct.revoke(token)
      
      expect(revoked).toBe(true)
      expect(construct.getOutputs().activeTokens).toBe(0)
      expect(await construct.validate(token)).toBe(false)
    })

    it('should return false for non-existent tokens', async () => {
      const revoked = await construct.revoke('invalid_token')
      
      expect(revoked).toBe(false)
    })

    it('should revoke all tokens', async () => {
      // Generate multiple tokens
      await construct.generate()
      await construct.generate()
      await construct.generate()
      
      expect(construct.getOutputs().activeTokens).toBe(3)
      
      const count = await construct.revokeAll()
      
      expect(count).toBe(3)
      expect(construct.getOutputs().activeTokens).toBe(0)
    })
  })

  describe('Token Cleanup', () => {
    it('should clean up expired tokens', async () => {
      await construct.initialize({
        expirationTime: 100
      })
      await construct.deploy()
      
      // Generate mix of tokens
      const token1 = await construct.generate()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const token2 = await construct.generate()
      const token3 = await construct.generate()
      
      // First token should be expired
      const cleaned = await construct.cleanup()
      
      expect(cleaned).toBe(1)
      expect(await construct.validate(token1)).toBe(false)
      expect(await construct.validate(token2)).toBe(true)
      expect(await construct.validate(token3)).toBe(true)
    })

    it('should return 0 when no expired tokens', async () => {
      await construct.generate()
      await construct.generate()
      
      const cleaned = await construct.cleanup()
      
      expect(cleaned).toBe(0)
    })
  })

  describe('Token Listing', () => {
    beforeEach(async () => {
      await construct.initialize({})
      await construct.deploy()
    })

    it('should list all tokens', async () => {
      const token1 = await construct.generate({ user: 'user1' })
      const token2 = await construct.generate({ user: 'user2' })
      
      const tokens = await construct.listTokens()
      
      expect(tokens).toHaveLength(2)
      expect(tokens.map(t => t.token)).toContain(token1)
      expect(tokens.map(t => t.token)).toContain(token2)
    })

    it('should include expired tokens in list', async () => {
      await construct.initialize({
        expirationTime: 50
      })
      await construct.deploy()
      
      const token1 = await construct.generate()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const token2 = await construct.generate()
      
      const tokens = await construct.listTokens()
      
      expect(tokens).toHaveLength(2)
      expect(tokens.find(t => t.token === token1)?.isExpired).toBe(true)
      expect(tokens.find(t => t.token === token2)?.isExpired).toBe(false)
    })
  })

  describe('Statistics', () => {
    beforeEach(async () => {
      await construct.initialize({
        tokenPrefix: 'test',
        tokenLength: 16
      })
      await construct.deploy()
    })

    it('should provide accurate statistics', async () => {
      await construct.generate()
      await construct.generate()
      const token3 = await construct.generate()
      await construct.revoke(token3)
      
      const stats = construct.getStats()
      
      expect(stats.activeTokens).toBe(2)
      expect(stats.expiredTokens).toBe(0)
      expect(stats.totalGenerated).toBe(3)
      expect(stats.tokenPrefix).toBe('test')
      expect(stats.tokenLength).toBe(16)
    })

    it('should track expired tokens in stats', async () => {
      await construct.initialize({
        expirationTime: 50
      })
      await construct.deploy()
      
      await construct.generate()
      await construct.generate()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await construct.generate()
      
      const stats = construct.getStats()
      
      expect(stats.activeTokens).toBe(1)
      expect(stats.expiredTokens).toBe(2)
      expect(stats.totalGenerated).toBe(3)
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({})
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should use non-cryptographic randomness', async () => {
      await construct.initialize({
        tokenLength: 8
      })
      await construct.deploy()
      
      // Generate many tokens to check pattern
      const tokens = []
      for (let i = 0; i < 100; i++) {
        const token = await construct.generate()
        tokens.push(token.split('_')[1])
      }
      
      // All should match simple alphanumeric pattern
      tokens.forEach(t => {
        expect(t).toMatch(/^[A-Za-z0-9]{8}$/)
      })
    })

    it('should store tokens in plain text', async () => {
      await construct.initialize({})
      await construct.deploy()
      
      const sensitivePayload = {
        password: 'secret123',
        apiKey: 'sk_live_1234567890'
      }
      
      const token = await construct.generate(sensitivePayload)
      const data = await construct.getTokenData(token)
      
      // Payload stored without encryption
      expect(data?.payload).toEqual(sensitivePayload)
    })

    it('should have no persistence', async () => {
      await construct.initialize({})
      await construct.deploy()
      
      const token = await construct.generate()
      expect(await construct.validate(token)).toBe(true)
      
      // Create new instance - tokens are lost
      const newAuth = new AuthTokenPrimitive()
      await newAuth.initialize({})
      await newAuth.deploy()
      
      expect(await newAuth.validate(token)).toBe(false)
      expect(newAuth.getStats().totalGenerated).toBe(0)
    })

    it('should have no signature verification', async () => {
      await construct.initialize({})
      
      // No methods for signing or verifying signatures
      expect(construct).not.toHaveProperty('sign')
      expect(construct).not.toHaveProperty('verify')
      expect(construct).not.toHaveProperty('rotateKeys')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await construct.initialize({})
      await construct.deploy()
    })

    it('should handle empty payloads', async () => {
      const token1 = await construct.generate()
      const token2 = await construct.generate(null)
      const token3 = await construct.generate(undefined)
      
      const data1 = await construct.getTokenData(token1)
      const data2 = await construct.getTokenData(token2)
      const data3 = await construct.getTokenData(token3)
      
      expect(data1?.payload).toEqual({})
      expect(data2?.payload).toBeNull()
      expect(data3?.payload).toBeUndefined()
    })

    it('should handle very short token lengths', async () => {
      await construct.initialize({
        tokenLength: 1
      })
      await construct.deploy()
      
      const token = await construct.generate()
      expect(token).toMatch(/^token_[A-Za-z0-9]$/)
    })

    it('should handle empty prefix', async () => {
      await construct.initialize({
        tokenPrefix: ''
      })
      await construct.deploy()
      
      const token = await construct.generate()
      expect(token).toMatch(/^_[A-Za-z0-9]{32}$/)
    })

    it('should handle immediate expiration', async () => {
      await construct.initialize({
        expirationTime: 1 // 1ms
      })
      await construct.deploy()
      
      const token = await construct.generate()
      
      await new Promise(resolve => setTimeout(resolve, 5))
      
      expect(await construct.validate(token)).toBe(false)
    })

    it('should handle large number of tokens', async () => {
      const tokens = []
      
      for (let i = 0; i < 1000; i++) {
        tokens.push(await construct.generate({ index: i }))
      }
      
      expect(construct.getStats().activeTokens).toBe(1000)
      expect(construct.getStats().totalGenerated).toBe(1000)
      
      // All should be valid
      for (const token of tokens) {
        expect(await construct.validate(token)).toBe(true)
      }
    })

    it('should handle complex payloads', async () => {
      const complexPayload = {
        user: {
          id: 'user123',
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        permissions: ['read', 'write', 'delete'],
        metadata: new Date()
      }
      
      const token = await construct.generate(complexPayload)
      const data = await construct.getTokenData(token)
      
      expect(data?.payload).toEqual(complexPayload)
    })
  })
})