import { DockerServicePrimitiveConstruct } from '../DockerServicePrimitive'

describe('DockerServicePrimitive', () => {
  let construct: DockerServicePrimitiveConstruct

  beforeEach(() => {
    construct = new DockerServicePrimitiveConstruct()
  })

  describe('parseDefinition', () => {
    it('should parse basic docker-compose config', () => {
      const composeConfig = {
        version: '3.8',
        services: {
          web: {
            image: 'nginx:alpine',
            ports: ['80:80', '443:443'],
            volumes: ['./html:/usr/share/nginx/html:ro']
          },
          db: {
            image: 'postgres:14',
            environment: {
              POSTGRES_PASSWORD: 'secret',
              POSTGRES_DB: 'myapp'
            },
            volumes: ['db-data:/var/lib/postgresql/data']
          }
        },
        volumes: {
          'db-data': {}
        }
      }

      const result = construct.parseDefinition(composeConfig)

      expect(result.version).toBe('3.8')
      expect(result.services.size).toBe(2)
      
      const webService = result.services.get('web')
      expect(webService?.image.name).toBe('nginx')
      expect(webService?.image.tag).toBe('alpine')
      expect(webService?.ports?.length).toBe(2)
      expect(webService?.ports?.[0].host).toBe(80)
      expect(webService?.ports?.[0].container).toBe(80)
      
      const dbService = result.services.get('db')
      expect(dbService?.environment?.POSTGRES_PASSWORD).toBe('secret')
      expect(dbService?.volumes?.length).toBe(1)
    })

    it('should parse image strings correctly', () => {
      const tests = [
        { input: 'nginx', expected: { name: 'nginx', tag: 'latest' } },
        { input: 'nginx:1.21', expected: { name: 'nginx', tag: '1.21' } },
        { input: 'docker.io/nginx:alpine', expected: { name: 'nginx', tag: 'alpine', registry: 'docker.io' } },
        { input: 'myregistry.com/myorg/myapp:v1.0', expected: { name: 'myorg/myapp', tag: 'v1.0', registry: 'myregistry.com' } }
      ]

      tests.forEach(test => {
        const config = construct.parseDefinition({
          services: {
            test: { image: test.input }
          }
        })
        
        const service = config.services.get('test')
        expect(service?.image).toMatchObject(test.expected)
      })
    })
  })

  describe('parseDockerfile', () => {
    it('should parse single-stage Dockerfile', () => {
      const dockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
      `

      const stages = construct.parseDockerfile(dockerfile)

      expect(stages.length).toBe(1)
      expect(stages[0].base.name).toBe('node')
      expect(stages[0].base.tag).toBe('18-alpine')
      expect(stages[0].instructions.length).toBe(6)
      
      const workdir = stages[0].instructions.find(i => i.instruction === 'WORKDIR')
      expect(workdir?.arguments).toBe('/app')
      
      const expose = stages[0].instructions.find(i => i.instruction === 'EXPOSE')
      expect(expose?.arguments).toEqual(['3000'])
    })

    it('should parse multi-stage Dockerfile', () => {
      const dockerfile = `
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
      `

      const stages = construct.parseDockerfile(dockerfile)

      expect(stages.length).toBe(2)
      
      expect(stages[0].name).toBe('builder')
      expect(stages[0].base.name).toBe('node')
      expect(stages[0].base.tag).toBe('18')
      
      expect(stages[1].name).toBe('runtime')
      expect(stages[1].base.name).toBe('node')
      expect(stages[1].base.tag).toBe('18-alpine')
      
      const copyFromBuilder = stages[1].instructions.filter(i => 
        i.instruction === 'COPY' && i.arguments.includes('--from=builder')
      )
      expect(copyFromBuilder.length).toBe(2)
    })

    it('should handle JSON array syntax', () => {
      const dockerfile = `
FROM alpine
CMD ["echo", "Hello World"]
ENTRYPOINT ["sh", "-c"]
      `

      const stages = construct.parseDockerfile(dockerfile)
      
      const cmd = stages[0].instructions.find(i => i.instruction === 'CMD')
      expect(cmd?.arguments).toEqual(['echo', 'Hello World'])
      
      const entrypoint = stages[0].instructions.find(i => i.instruction === 'ENTRYPOINT')
      expect(entrypoint?.arguments).toEqual(['sh', '-c'])
    })
  })

  describe('generateComposeEntry', () => {
    it('should generate valid compose YAML', () => {
      const service = {
        image: { name: 'myapp', tag: 'latest' },
        command: ['npm', 'start'],
        ports: [
          { host: 8080, container: 80, protocol: 'tcp' as const },
          { container: 443, protocol: 'tcp' as const }
        ],
        volumes: [
          { type: 'bind' as const, source: './data', target: '/app/data', readonly: true }
        ],
        environment: {
          NODE_ENV: 'production',
          PORT: '80'
        },
        networks: [{ name: 'app-network' }],
        restart: { condition: 'always' as const }
      }

      const yaml = construct.generateComposeEntry(service)

      expect(yaml).toContain('image: myapp:latest')
      expect(yaml).toContain('command: ["npm", "start"]')
      expect(yaml).toContain('- "8080:80"')
      expect(yaml).toContain('- "443"')
      expect(yaml).toContain('- "./data:/app/data:ro"')
      expect(yaml).toContain('NODE_ENV: "production"')
      expect(yaml).toContain('- app-network')
      expect(yaml).toContain('restart: always')
    })
  })

  describe('validateConfiguration', () => {
    it('should validate valid service config', () => {
      const config = {
        service: {
          image: { name: 'nginx', tag: '1.21' },
          ports: [{ container: 80, host: 8080 }],
          volumes: [{ type: 'bind' as const, source: './html', target: '/usr/share/nginx/html' }],
          environment: { APP_ENV: 'production' }
        }
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should validate port ranges', () => {
      const config = {
        service: {
          image: { name: 'test' },
          ports: [
            { container: 0 },      // Invalid
            { container: 70000 },  // Invalid
            { host: -1, container: 80 }, // Invalid host
            { host: 65536, container: 80 } // Invalid host
          ]
        }
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(false)
      expect(result.errors?.length).toBe(4)
    })

    it('should validate volume paths', () => {
      const config = {
        service: {
          image: { name: 'test' },
          volumes: [
            { type: 'bind' as const, source: '', target: '/app' }, // Missing source
            { type: 'bind' as const, source: './data', target: '' }, // Missing target
            { type: 'bind' as const, source: './data', target: 'relative/path' } // Relative target
          ]
        }
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Volume 1 missing source')
      expect(result.errors).toContain('Volume 2 missing target')
      expect(result.errors).toContain('Volume target must be absolute path: relative/path')
    })

    it('should validate environment variable names', () => {
      const config = {
        service: {
          image: { name: 'test' },
          environment: {
            VALID_VAR: 'value',
            _ALSO_VALID: 'value',
            '123INVALID': 'value',
            'INVALID-DASH': 'value',
            'INVALID SPACE': 'value'
          }
        }
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(false)
      expect(result.errors?.filter(e => e.includes('Invalid environment variable name')).length).toBe(3)
    })

    it('should validate resource limits', () => {
      const config = {
        service: {
          image: { name: 'test' },
          resources: {
            cpus: -1,  // Invalid
            memory: 'invalid' // Invalid format
          }
        }
      }

      const result = construct.validateConfiguration(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('CPU limit must be positive')
      expect(result.errors).toContain('Invalid memory format: invalid')
    })

    it('should validate memory string formats', () => {
      const validFormats = ['512', '1k', '2m', '3g', '1024b', '500M', '2G']
      const invalidFormats = ['abc', '1.5.6', 'GB', '1 GB']

      validFormats.forEach(format => {
        const config = {
          service: {
            image: { name: 'test' },
            resources: { memory: format }
          }
        }
        
        const result = construct.validateConfiguration(config)
        expect(result.valid).toBe(true)
      })

      invalidFormats.forEach(format => {
        const config = {
          service: {
            image: { name: 'test' },
            resources: { memory: format }
          }
        }
        
        const result = construct.validateConfiguration(config)
        expect(result.valid).toBe(false)
      })
    })
  })
})