import { 
  ConstructMetadata, 
  ConstructSpec, 
  ConstructDependency,
  GraphNodeData,
  GraphEdgeData,
  LayoutConstraints,
  NpmPackageInfo,
  DockerServiceConfig,
  ConstructLevel
} from '../constructs/types'

/**
 * Factory for creating test construct metadata
 */
export class ConstructMetadataFactory {
  static create(overrides?: Partial<ConstructMetadata>): ConstructMetadata {
    return {
      id: `construct-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Construct',
      type: 'primitive',
      level: ConstructLevel.L0,
      category: 'ui',
      version: '1.0.0',
      description: 'A test construct for unit testing',
      author: 'test-system',
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      interfaces: {
        inputs: {},
        outputs: {},
        events: {},
        methods: {}
      },
      documentation: '# Test Construct\n\nThis is a test construct.',
      examples: [],
      tests: [],
      tags: ['test'],
      ...overrides
    }
  }

  static createL0UI(overrides?: Partial<ConstructMetadata>): ConstructMetadata {
    return this.create({
      level: ConstructLevel.L0,
      category: 'ui',
      type: 'primitive',
      ...overrides
    })
  }

  static createL1(overrides?: Partial<ConstructMetadata>): ConstructMetadata {
    return this.create({
      level: ConstructLevel.L1,
      type: 'configured',
      dependencies: [
        { constructId: 'base-primitive', version: '^1.0.0', type: 'required' }
      ],
      ...overrides
    })
  }
}

/**
 * Factory for creating graph test data
 */
export class GraphDataFactory {
  static createNode(overrides?: Partial<GraphNodeData>): GraphNodeData {
    return {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: 'Test Node',
        metadata: {}
      },
      ...overrides
    }
  }

  static createEdge(overrides?: Partial<GraphEdgeData>): GraphEdgeData {
    return {
      id: `edge-${Math.random().toString(36).substr(2, 9)}`,
      source: 'node-1',
      target: 'node-2',
      type: 'default',
      data: {
        label: 'Test Edge',
        metadata: {}
      },
      ...overrides
    }
  }

  static createFlowGraph(nodeCount: number = 3, edgeCount: number = 2) {
    const nodes = Array.from({ length: nodeCount }, (_, i) => 
      this.createNode({
        id: `node-${i + 1}`,
        position: { x: i * 150, y: i * 100 },
        data: { label: `Node ${i + 1}` }
      })
    )

    const edges = Array.from({ length: Math.min(edgeCount, nodeCount - 1) }, (_, i) =>
      this.createEdge({
        id: `edge-${i + 1}`,
        source: `node-${i + 1}`,
        target: `node-${i + 2}`
      })
    )

    return { nodes, edges }
  }
}

/**
 * Factory for layout test data
 */
export class LayoutDataFactory {
  static createConstraints(overrides?: Partial<LayoutConstraints>): LayoutConstraints {
    return {
      minWidth: 100,
      minHeight: 100,
      maxWidth: 1000,
      maxHeight: 1000,
      aspectRatio: undefined,
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
      ...overrides
    }
  }

  static createGridConstraints(): LayoutConstraints {
    return this.createConstraints({
      gridSize: 10,
      snapToGrid: true
    })
  }
}

/**
 * Factory for NPM package test data
 */
export class NpmPackageFactory {
  static createPackageInfo(overrides?: Partial<NpmPackageInfo>): NpmPackageInfo {
    return {
      name: '@test/package',
      version: '1.0.0',
      description: 'A test package',
      main: 'index.js',
      types: 'index.d.ts',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      keywords: ['test'],
      author: 'Test Author',
      license: 'MIT',
      repository: {
        type: 'git',
        url: 'https://github.com/test/package'
      },
      ...overrides
    }
  }

  static createWithDependencies(): NpmPackageInfo {
    return this.createPackageInfo({
      dependencies: {
        'lodash': '^4.17.21',
        'react': '^18.2.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        'vitest': '^1.0.0'
      }
    })
  }
}

/**
 * Factory for Docker service test data
 */
export class DockerServiceFactory {
  static createServiceConfig(overrides?: Partial<DockerServiceConfig>): DockerServiceConfig {
    return {
      name: 'test-service',
      image: 'node:18-alpine',
      ports: [],
      environment: {},
      volumes: [],
      networks: [],
      healthcheck: {
        test: ['CMD', 'node', '--version'],
        interval: '30s',
        timeout: '3s',
        retries: 3
      },
      ...overrides
    }
  }

  static createWebService(): DockerServiceConfig {
    return this.createServiceConfig({
      name: 'web-service',
      image: 'nginx:alpine',
      ports: [
        { container: 80, host: 8080, protocol: 'tcp' }
      ],
      environment: {
        NGINX_HOST: 'localhost',
        NGINX_PORT: '80'
      }
    })
  }

  static createDatabaseService(): DockerServiceConfig {
    return this.createServiceConfig({
      name: 'postgres-db',
      image: 'postgres:15',
      ports: [
        { container: 5432, host: 5432, protocol: 'tcp' }
      ],
      environment: {
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb'
      },
      volumes: [
        { source: 'pg-data', target: '/var/lib/postgresql/data', type: 'volume' }
      ]
    })
  }
}

/**
 * Factory for WebSocket test data
 */
export class WebSocketDataFactory {
  static createMessage(overrides?: any) {
    return {
      id: `msg-${Date.now()}`,
      type: 'message',
      payload: { text: 'Test message' },
      timestamp: new Date().toISOString(),
      ...overrides
    }
  }

  static createEncryptedMessage() {
    return this.createMessage({
      type: 'encrypted',
      payload: {
        encrypted: true,
        data: 'base64encodeddata',
        iv: 'initializationvector',
        tag: 'authenticationtag'
      }
    })
  }
}

/**
 * Factory for authentication test data
 */
export class AuthDataFactory {
  static createUser(overrides?: any) {
    return {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      createdAt: new Date(),
      ...overrides
    }
  }

  static createToken(overrides?: any) {
    return {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      refreshToken: 'refresh-token-xyz',
      ...overrides
    }
  }

  static createApiKey(overrides?: any) {
    return {
      id: `key-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test API Key',
      key: 'sk-test-' + Math.random().toString(36).substr(2, 32),
      scopes: ['read', 'write'],
      createdAt: new Date(),
      lastUsed: null,
      ...overrides
    }
  }
}

/**
 * Factory for rate limiting test data
 */
export class RateLimitDataFactory {
  static createConfig(overrides?: any) {
    return {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      keyGenerator: (req: any) => req.ip || 'anonymous',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...overrides
    }
  }

  static createRateLimitInfo(overrides?: any) {
    return {
      limit: 100,
      remaining: 75,
      reset: new Date(Date.now() + 45000), // 45 seconds
      retryAfter: null,
      ...overrides
    }
  }
}

/**
 * Utility class for creating complex test scenarios
 */
export class TestScenarioFactory {
  static createConstructHierarchy() {
    const l0Primitive = ConstructMetadataFactory.createL0UI({ id: 'button-primitive' })
    const l1Component = ConstructMetadataFactory.createL1({
      id: 'styled-button',
      dependencies: [
        { constructId: 'button-primitive', version: '^1.0.0', type: 'required' }
      ]
    })
    const l2Pattern = ConstructMetadataFactory.create({
      id: 'form-button-group',
      level: ConstructLevel.L2,
      type: 'pattern',
      dependencies: [
        { constructId: 'styled-button', version: '^1.0.0', type: 'required' },
        { constructId: 'layout-primitive', version: '^1.0.0', type: 'required' }
      ]
    })

    return { l0Primitive, l1Component, l2Pattern }
  }

  static createMicroserviceArchitecture() {
    const services = [
      DockerServiceFactory.createWebService(),
      DockerServiceFactory.createDatabaseService(),
      DockerServiceFactory.createServiceConfig({
        name: 'api-service',
        image: 'custom/api:latest',
        ports: [{ container: 3000, host: 3000, protocol: 'tcp' }],
        environment: {
          DATABASE_URL: 'postgres://test:test@postgres-db:5432/testdb'
        },
        networks: ['app-network']
      })
    ]

    const { nodes, edges } = GraphDataFactory.createFlowGraph(3, 2)
    nodes[0].data.label = 'Web Service'
    nodes[1].data.label = 'API Service'
    nodes[2].data.label = 'Database'

    return { services, architecture: { nodes, edges } }
  }
}