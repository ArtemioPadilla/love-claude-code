import { create } from 'zustand'
import { 
  ConstructDisplay, 
  ConstructFilters, 
  ConstructDeploymentState,
  DeploymentConfiguration,
  ConstructComposition,
  CommunityContribution
} from '../constructs/types'

interface ConstructStore {
  // Constructs catalog
  constructs: ConstructDisplay[]
  loading: boolean
  error: string | null
  filters: ConstructFilters
  selectedConstruct: ConstructDisplay | null
  
  // Deployments
  deployments: ConstructDeploymentState[]
  activeDeployment: string | null
  
  // Compositions
  compositions: ConstructComposition[]
  currentComposition: ConstructComposition | null
  
  // Community
  contributions: CommunityContribution[]
  
  // Actions
  fetchConstructs: () => Promise<void>
  setFilters: (filters: ConstructFilters) => void
  setSelectedConstruct: (construct: ConstructDisplay | null) => void
  
  // Deployment actions
  deployConstruct: (constructId: string, config: DeploymentConfiguration) => Promise<void>
  updateDeploymentStatus: (deploymentId: string, status: Partial<ConstructDeploymentState>) => void
  
  // Composition actions
  saveComposition: (composition: ConstructComposition) => void
  loadComposition: (id: string) => void
  deleteComposition: (id: string) => void
  
  // Community actions
  submitContribution: (contribution: Omit<CommunityContribution, 'id' | 'status' | 'submittedAt'>) => Promise<void>
  fetchContributions: () => Promise<void>
}

export const useConstructStore = create<ConstructStore>((set, get) => ({
  // Initial state
  constructs: [],
  loading: false,
  error: null,
  filters: {},
  selectedConstruct: null,
  deployments: [],
  activeDeployment: null,
  compositions: [],
  currentComposition: null,
  contributions: [],
  
  // Fetch constructs from catalog
  fetchConstructs: async () => {
    set({ loading: true, error: null })
    
    try {
      // In real implementation, this would fetch from API
      // For now, we'll use mock data
      const mockConstructs: ConstructDisplay[] = [
        {
          definition: {
            id: 'secure-s3-bucket',
            name: 'Secure S3 Bucket',
            level: 'L1' as any,
            description: 'S3 bucket with encryption, versioning, and secure access policies',
            version: '1.0.0',
            author: 'Love Claude Code',
            categories: ['storage'],
            providers: ['aws' as any],
            tags: ['s3', 'storage', 'security'],
            inputs: [
              {
                name: 'bucketName',
                type: 'string',
                description: 'Name of the S3 bucket',
                required: true
              },
              {
                name: 'enableVersioning',
                type: 'boolean',
                description: 'Enable versioning for the bucket',
                required: false,
                defaultValue: true
              }
            ],
            outputs: [
              {
                name: 'bucketArn',
                type: 'string',
                description: 'ARN of the created bucket'
              },
              {
                name: 'bucketUrl',
                type: 'string',
                description: 'URL of the bucket'
              }
            ],
            security: [
              {
                aspect: 'Encryption',
                description: 'AES-256 encryption enabled by default',
                severity: 'low',
                recommendations: ['Consider using KMS for additional control']
              }
            ],
            cost: {
              baseMonthly: 0.023,
              usageFactors: [
                {
                  name: 'storage-gb',
                  unit: 'GB',
                  costPerUnit: 0.023
                },
                {
                  name: 'requests',
                  unit: '1000 requests',
                  costPerUnit: 0.0004
                }
              ]
            },
            c4: {
              type: 'Component'
            },
            examples: [
              {
                title: 'Basic Usage',
                description: 'Create a secure S3 bucket',
                code: `const bucket = new SecureS3Bucket('my-bucket', {
  bucketName: 'my-secure-bucket',
  enableVersioning: true
})`,
                language: 'typescript'
              }
            ],
            bestPractices: [
              'Always enable encryption',
              'Use versioning for important data',
              'Implement lifecycle policies',
              'Enable access logging'
            ],
            deployment: {
              requiredProviders: ['aws'],
              configSchema: {}
            }
          },
          icon: '🪣',
          featured: true,
          popularity: 95,
          rating: 4.8,
          deploymentCount: 1250,
          lastUpdated: new Date('2024-01-15')
        },
        {
          definition: {
            id: 'serverless-api',
            name: 'Serverless API Pattern',
            level: 'L2' as any,
            description: 'Complete serverless API with Lambda, API Gateway, and DynamoDB',
            version: '2.1.0',
            author: 'Love Claude Code',
            categories: ['api', 'pattern'],
            providers: ['aws' as any],
            tags: ['api', 'lambda', 'dynamodb', 'serverless'],
            inputs: [
              {
                name: 'apiName',
                type: 'string',
                description: 'Name of the API',
                required: true
              },
              {
                name: 'tableName',
                type: 'string',
                description: 'DynamoDB table name',
                required: true
              },
              {
                name: 'enableCors',
                type: 'boolean',
                description: 'Enable CORS',
                required: false,
                defaultValue: true
              }
            ],
            outputs: [
              {
                name: 'apiUrl',
                type: 'string',
                description: 'API Gateway URL'
              },
              {
                name: 'functionArn',
                type: 'string',
                description: 'Lambda function ARN'
              }
            ],
            security: [
              {
                aspect: 'API Authentication',
                description: 'API Key authentication enabled',
                severity: 'medium',
                recommendations: [
                  'Consider adding OAuth2 or JWT authentication',
                  'Implement rate limiting'
                ]
              }
            ],
            cost: {
              baseMonthly: 10,
              usageFactors: [
                {
                  name: 'api-requests',
                  unit: 'million requests',
                  costPerUnit: 3.50
                },
                {
                  name: 'lambda-invocations',
                  unit: 'million invocations',
                  costPerUnit: 0.20
                }
              ]
            },
            c4: {
              type: 'Container'
            },
            examples: [
              {
                title: 'REST API Example',
                description: 'Create a complete REST API',
                code: `const api = new ServerlessApiPattern('my-api', {
  apiName: 'user-service',
  tableName: 'users',
  enableCors: true
})`,
                language: 'typescript'
              }
            ],
            bestPractices: [
              'Use API Gateway request validation',
              'Implement proper error handling',
              'Enable CloudWatch logging',
              'Use environment variables for configuration'
            ],
            deployment: {
              requiredProviders: ['aws'],
              configSchema: {}
            }
          },
          featured: true,
          popularity: 87,
          rating: 4.6,
          deploymentCount: 890,
          lastUpdated: new Date('2024-01-20')
        }
      ]
      
      set({ constructs: mockConstructs, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  
  // Set filters
  setFilters: (filters) => set({ filters }),
  
  // Set selected construct
  setSelectedConstruct: (construct) => set({ selectedConstruct: construct }),
  
  // Deploy a construct
  deployConstruct: async (constructId, config) => {
    const deploymentId = Date.now().toString()
    const deployment: ConstructDeploymentState = {
      id: deploymentId,
      constructId,
      status: 'validating',
      progress: 0,
      timestamp: new Date()
    }
    
    set(state => ({
      deployments: [...state.deployments, deployment],
      activeDeployment: deploymentId
    }))
    
    // Simulate deployment process
    try {
      // Validation
      await new Promise(resolve => setTimeout(resolve, 1000))
      get().updateDeploymentStatus(deploymentId, { 
        status: 'previewing', 
        progress: 20,
        currentStep: 'Previewing changes'
      })
      
      // Preview
      await new Promise(resolve => setTimeout(resolve, 2000))
      get().updateDeploymentStatus(deploymentId, { 
        status: 'deploying', 
        progress: 50,
        currentStep: 'Deploying infrastructure'
      })
      
      // Deploy
      await new Promise(resolve => setTimeout(resolve, 3000))
      get().updateDeploymentStatus(deploymentId, { 
        status: 'deployed', 
        progress: 100,
        currentStep: 'Deployment complete',
        result: {
          url: 'https://example.com',
          resources: 5
        }
      })
      
    } catch (error) {
      get().updateDeploymentStatus(deploymentId, { 
        status: 'failed', 
        error: (error as Error).message
      })
    }
  },
  
  // Update deployment status
  updateDeploymentStatus: (deploymentId, update) => {
    set(state => ({
      deployments: state.deployments.map(d => 
        d.id === deploymentId ? { ...d, ...update } : d
      )
    }))
  },
  
  // Save composition
  saveComposition: (composition) => {
    set(state => ({
      compositions: [...state.compositions, composition],
      currentComposition: composition
    }))
  },
  
  // Load composition
  loadComposition: (id) => {
    const composition = get().compositions.find(c => c.id === id)
    if (composition) {
      set({ currentComposition: composition })
    }
  },
  
  // Delete composition
  deleteComposition: (id) => {
    set(state => ({
      compositions: state.compositions.filter(c => c.id !== id),
      currentComposition: state.currentComposition?.id === id ? null : state.currentComposition
    }))
  },
  
  // Submit contribution
  submitContribution: async (contribution) => {
    const newContribution: CommunityContribution = {
      ...contribution,
      id: Date.now().toString(),
      status: 'pending',
      submittedAt: new Date()
    }
    
    set(state => ({
      contributions: [...state.contributions, newContribution]
    }))
    
    // In real implementation, this would submit to API
  },
  
  // Fetch contributions
  fetchContributions: async () => {
    // In real implementation, this would fetch from API
    set({ contributions: [] })
  }
}))