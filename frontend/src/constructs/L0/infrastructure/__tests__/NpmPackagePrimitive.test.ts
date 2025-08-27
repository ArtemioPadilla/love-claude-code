import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NpmPackagePrimitive } from '../NpmPackagePrimitive'
import { 
  ConstructTestHarness, 
  createMockMetadata,
  waitForEvent 
} from '../../../../test-utils/constructTestUtils'
import { NpmPackageFactory } from '../../../../test-utils/testFactories'
import { ConstructLevel } from '../../../types'

// Mock fetch
global.fetch = vi.fn()

describe('NpmPackagePrimitive', () => {
  let harness: ConstructTestHarness<NpmPackagePrimitive>
  let metadata: any

  beforeEach(() => {
    metadata = createMockMetadata({
      id: 'npm-package',
      name: 'NPM Package Primitive',
      level: ConstructLevel.L0,
      category: 'infrastructure'
    })
    harness = new ConstructTestHarness(NpmPackagePrimitive, metadata)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await harness.initialize()
      
      expect(harness.construct.initialized).toBe(true)
      harness.expectEvent('initialized')
    })

    it('should emit package:initialized event', async () => {
      const promise = waitForEvent(harness.construct.eventEmitter, 'package:initialized')
      await harness.initialize()
      
      await expect(promise).resolves.toEqual({})
    })
  })

  describe('package search', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should search for packages', async () => {
      const mockResults = {
        objects: [
          {
            package: {
              name: 'lodash',
              version: '4.17.21',
              description: 'Lodash modular utilities'
            }
          },
          {
            package: {
              name: 'lodash-es',
              version: '4.17.21',
              description: 'Lodash exported as ES modules'
            }
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      })

      const results = await harness.construct.search('lodash', { size: 10 })

      expect(results).toHaveLength(2)
      expect(results[0].name).toBe('lodash')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://registry.npmjs.org/-/v1/search?text=lodash')
      )
      harness.expectEvent('search:completed', { query: 'lodash', count: 2 })
    })

    it('should handle search errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(harness.construct.search('test'))
        .rejects.toThrow('Failed to search packages')
      
      harness.expectEvent('search:failed', { 
        query: 'test', 
        error: expect.stringContaining('Network error') 
      })
    })

    it('should use search options', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ objects: [] })
      })

      await harness.construct.search('react', {
        size: 20,
        from: 10,
        quality: 0.8,
        popularity: 0.9,
        maintenance: 0.7
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('size=20&from=10&quality=0.8&popularity=0.9&maintenance=0.7')
      )
    })
  })

  describe('package info retrieval', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should get package info', async () => {
      const mockPackage = NpmPackageFactory.createWithDependencies()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage
      })

      const info = await harness.construct.getPackageInfo('@test/package')

      expect(info).toEqual(mockPackage)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://registry.npmjs.org/@test%2Fpackage'
      )
      harness.expectEvent('package:loaded', { name: '@test/package' })
    })

    it('should get specific version info', async () => {
      const mockPackage = NpmPackageFactory.createPackageInfo({ version: '2.0.0' })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage
      })

      const info = await harness.construct.getPackageInfo('test-pkg', '2.0.0')

      expect(info.version).toBe('2.0.0')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://registry.npmjs.org/test-pkg/2.0.0'
      )
    })

    it('should cache package info', async () => {
      const mockPackage = NpmPackageFactory.createPackageInfo()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage
      })

      // First call
      await harness.construct.getPackageInfo('cached-pkg')
      
      // Second call should use cache
      const cachedInfo = await harness.construct.getPackageInfo('cached-pkg')

      expect(cachedInfo).toEqual(mockPackage)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle package not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(harness.construct.getPackageInfo('non-existent'))
        .rejects.toThrow('Package not found')
    })
  })

  describe('package versions', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should get all versions', async () => {
      const mockVersions = {
        'dist-tags': { latest: '2.0.0' },
        versions: {
          '1.0.0': { version: '1.0.0' },
          '1.1.0': { version: '1.1.0' },
          '2.0.0': { version: '2.0.0' }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions
      })

      const versions = await harness.construct.getVersions('test-pkg')

      expect(versions).toEqual(['1.0.0', '1.1.0', '2.0.0'])
      harness.expectEvent('versions:loaded', { 
        name: 'test-pkg', 
        count: 3 
      })
    })

    it('should get latest version', async () => {
      const mockData = {
        'dist-tags': { latest: '2.5.0' }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const latest = await harness.construct.getLatestVersion('test-pkg')

      expect(latest).toBe('2.5.0')
    })
  })

  describe('dependency analysis', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should analyze dependencies', async () => {
      const mockPackage = NpmPackageFactory.createWithDependencies()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage
      })

      const analysis = await harness.construct.analyzeDependencies('@test/package')

      expect(analysis).toEqual({
        direct: {
          prod: ['lodash@^4.17.21', 'react@^18.2.0'],
          dev: ['typescript@^5.0.0', 'vitest@^1.0.0'],
          peer: []
        },
        count: {
          prod: 2,
          dev: 2,
          peer: 0,
          total: 4
        }
      })

      harness.expectEvent('dependencies:analyzed', {
        name: '@test/package',
        count: 4
      })
    })

    it('should check for vulnerabilities', async () => {
      const mockAudit = {
        vulnerabilities: {
          low: 2,
          moderate: 1,
          high: 0,
          critical: 0
        },
        metadata: {
          vulnerabilities: {
            total: 3
          }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudit
      })

      const vulnerabilities = await harness.construct.checkVulnerabilities('@test/package')

      expect(vulnerabilities).toEqual({
        low: 2,
        moderate: 1,
        high: 0,
        critical: 0,
        total: 3
      })

      harness.expectEvent('vulnerabilities:checked', {
        name: '@test/package',
        total: 3
      })
    })
  })

  describe('download statistics', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should get download stats', async () => {
      const mockStats = {
        downloads: 1000000,
        start: '2024-01-01',
        end: '2024-01-31',
        package: 'test-pkg'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      })

      const stats = await harness.construct.getDownloadStats('test-pkg', 'last-month')

      expect(stats).toEqual({
        downloads: 1000000,
        period: 'last-month',
        start: '2024-01-01',
        end: '2024-01-31'
      })

      harness.expectEvent('stats:loaded', {
        name: 'test-pkg',
        downloads: 1000000
      })
    })
  })

  describe('package installation', () => {
    beforeEach(async () => {
      await harness.initialize()
      harness.clearEvents()
    })

    it('should generate install command', () => {
      const command = harness.construct.getInstallCommand('lodash', {
        packageManager: 'npm',
        save: true,
        dev: false
      })

      expect(command).toBe('npm install lodash')
    })

    it('should generate dev install command', () => {
      const command = harness.construct.getInstallCommand('typescript', {
        packageManager: 'npm',
        save: true,
        dev: true
      })

      expect(command).toBe('npm install --save-dev typescript')
    })

    it('should support different package managers', () => {
      const yarnCommand = harness.construct.getInstallCommand('react', {
        packageManager: 'yarn'
      })
      expect(yarnCommand).toBe('yarn add react')

      const pnpmCommand = harness.construct.getInstallCommand('vue', {
        packageManager: 'pnpm'
      })
      expect(pnpmCommand).toBe('pnpm add vue')
    })

    it('should install specific version', () => {
      const command = harness.construct.getInstallCommand('lodash', {
        packageManager: 'npm',
        version: '4.17.21'
      })

      expect(command).toBe('npm install lodash@4.17.21')
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      await harness.initialize()
    })

    it('should validate successfully', async () => {
      const result = await harness.construct.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('disposal', () => {
    it('should clear cache and emit disposed event', async () => {
      await harness.initialize()
      
      // Add some cache entries
      const mockPackage = NpmPackageFactory.createPackageInfo()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage
      })
      await harness.construct.getPackageInfo('cached-pkg')

      await harness.dispose()

      expect(harness.construct.disposed).toBe(true)
      harness.expectEvent('disposed')

      // Verify cache is cleared by checking it makes a new request
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage
      })
      
      // This would throw if the construct is disposed properly
      await expect(harness.construct.getPackageInfo('cached-pkg'))
        .rejects.toThrow()
    })
  })
})