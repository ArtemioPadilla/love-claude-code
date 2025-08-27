import { NpmPackagePrimitiveConstruct } from '../NpmPackagePrimitive'

describe('NpmPackagePrimitive', () => {
  let construct: NpmPackagePrimitiveConstruct

  beforeEach(() => {
    construct = new NpmPackagePrimitiveConstruct()
  })

  describe('parseDefinition', () => {
    it('should parse basic package.json', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test package',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          'typescript': '~5.0.0'
        }
      }

      const result = construct.parseDefinition(packageJson)

      expect(result.package.name).toBe('test-package')
      expect(result.package.version).toBe('1.0.0')
      expect(result.dependencies.size).toBe(2)
      expect(result.devDependencies.size).toBe(1)
      
      const reactDep = result.dependencies.get('react')
      expect(reactDep?.versionRange).toBe('^18.2.0')
      expect(reactDep?.type).toBe('dependencies')
    })

    it('should parse package.json from string', () => {
      const packageJsonString = JSON.stringify({
        name: 'string-package',
        version: '2.0.0'
      })

      const result = construct.parseDefinition(packageJsonString)

      expect(result.package.name).toBe('string-package')
      expect(result.package.version).toBe('2.0.0')
    })

    it('should handle missing fields gracefully', () => {
      const packageJson = {}

      const result = construct.parseDefinition(packageJson)

      expect(result.package.name).toBe('unnamed-package')
      expect(result.package.version).toBe('0.0.0')
      expect(result.dependencies.size).toBe(0)
    })

    it('should throw on invalid JSON string', () => {
      const invalidJson = '{ invalid json'

      expect(() => construct.parseDefinition(invalidJson)).toThrow('Invalid JSON')
    })
  })

  describe('parseVersionRange', () => {
    it('should parse caret ranges', () => {
      const range = construct.parseVersionRange('^1.2.3')
      
      expect(range.operator).toBe('^')
      expect(range.major).toBe(1)
      expect(range.minor).toBe(2)
      expect(range.patch).toBe(3)
    })

    it('should parse tilde ranges', () => {
      const range = construct.parseVersionRange('~1.2.3')
      
      expect(range.operator).toBe('~')
      expect(range.major).toBe(1)
      expect(range.minor).toBe(2)
      expect(range.patch).toBe(3)
    })

    it('should parse comparison operators', () => {
      const gt = construct.parseVersionRange('>1.0.0')
      expect(gt.operator).toBe('>')
      
      const gte = construct.parseVersionRange('>=2.0.0')
      expect(gte.operator).toBe('>=')
      
      const lt = construct.parseVersionRange('<3.0.0')
      expect(lt.operator).toBe('<')
      
      const lte = construct.parseVersionRange('<=4.0.0')
      expect(lte.operator).toBe('<=')
    })

    it('should parse wildcards', () => {
      const wildcard = construct.parseVersionRange('*')
      expect(wildcard.operator).toBe('*')
      expect(wildcard.major).toBe('*')
      
      const x = construct.parseVersionRange('x')
      expect(x.operator).toBe('*')
      expect(x.major).toBe('*')
    })

    it('should parse prerelease versions', () => {
      const range = construct.parseVersionRange('^1.2.3-beta.1')
      
      expect(range.major).toBe(1)
      expect(range.minor).toBe(2)
      expect(range.patch).toBe(3)
      expect(range.prerelease).toBe('beta.1')
    })

    it('should parse build metadata', () => {
      const range = construct.parseVersionRange('1.2.3+build.123')
      
      expect(range.major).toBe(1)
      expect(range.minor).toBe(2)
      expect(range.patch).toBe(3)
      expect(range.build).toBe('build.123')
    })
  })

  describe('resolveVersionRange', () => {
    it('should resolve caret ranges correctly', () => {
      const range = construct.parseVersionRange('^1.2.3')
      
      expect(construct.resolveVersionRange('1.2.3', range)).toBe(true)
      expect(construct.resolveVersionRange('1.2.4', range)).toBe(true)
      expect(construct.resolveVersionRange('1.3.0', range)).toBe(true)
      expect(construct.resolveVersionRange('2.0.0', range)).toBe(false)
      expect(construct.resolveVersionRange('1.2.2', range)).toBe(false)
    })

    it('should resolve tilde ranges correctly', () => {
      const range = construct.parseVersionRange('~1.2.3')
      
      expect(construct.resolveVersionRange('1.2.3', range)).toBe(true)
      expect(construct.resolveVersionRange('1.2.4', range)).toBe(true)
      expect(construct.resolveVersionRange('1.3.0', range)).toBe(false)
      expect(construct.resolveVersionRange('1.2.2', range)).toBe(false)
    })

    it('should resolve wildcards', () => {
      const range = construct.parseVersionRange('*')
      
      expect(construct.resolveVersionRange('1.0.0', range)).toBe(true)
      expect(construct.resolveVersionRange('99.99.99', range)).toBe(true)
    })
  })

  describe('validateConfiguration', () => {
    it('should validate valid configuration', () => {
      const config = {
        package: { name: 'valid-package', version: '1.0.0' },
        dependencies: new Map([['react', { name: 'react', version: '^18.0.0', type: 'dependencies' as const }]])
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should validate package name format', () => {
      const invalidNames = [
        'UPPERCASE',
        '.startwithdot',
        '_startwithunderscore',
        'contains..dots',
        'a'.repeat(215), // Too long
      ]

      invalidNames.forEach(name => {
        const config = {
          package: { name, version: '1.0.0' },
          dependencies: new Map()
        }
        
        const result = construct.validateConfiguration(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(`Invalid dependency package name: ${name}`)
      })
    })

    it('should validate scoped packages', () => {
      const config = {
        package: { name: '@myorg/package', version: '1.0.0' },
        dependencies: new Map([
          ['@types/node', { name: '@types/node', version: '^18.0.0', type: 'dependencies' as const }]
        ])
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(true)
    })

    it('should require package name and version', () => {
      const config = {
        package: {},
        dependencies: new Map()
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Package name is required')
      expect(result.errors).toContain('Package version is required')
    })

    it('should validate version format', () => {
      const config = {
        package: { name: 'test', version: 'invalid-version' },
        dependencies: new Map()
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid version format: invalid-version')
    })
  })
})