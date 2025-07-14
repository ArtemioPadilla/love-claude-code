import { ProviderCapabilities, ProviderType } from './types.js'

// Define capabilities for each provider
export const providerCapabilities: Record<ProviderType, ProviderCapabilities> = {
  local: {
    name: 'Local Development',
    type: 'local',
    description: 'File-based provider for local development and testing. Zero configuration required.',
    features: {
      auth: {
        methods: ['email/password'],
        mfa: false,
        customDomains: false,
        sessionManagement: true
      },
      database: {
        type: 'hybrid',
        backups: false,
        replication: false,
        transactions: true,
        offline: true,
        search: false,
        realtime: false
      },
      storage: {
        maxFileSize: '100MB',
        totalStorage: 'Unlimited (local disk)',
        cdn: false,
        imageOptimization: false,
        videoStreaming: false,
        encryption: false
      },
      realtime: {
        protocol: 'websocket',
        maxConnections: 100,
        presence: true,
        history: false,
        guaranteed: false
      },
      functions: {
        runtime: ['nodejs18.x'],
        maxExecutionTime: 30,
        maxMemory: '512MB',
        coldStart: false,
        scheduling: true,
        eventTriggers: ['http', 'timer']
      }
    },
    pricing: {
      model: 'free',
      currency: 'USD'
    },
    limitations: {
      concurrentUsers: 10,
      apiCalls: 'Unlimited'
    },
    bestFor: [
      'Development and testing',
      'Proof of concepts',
      'Learning and experimentation',
      'Offline-first applications'
    ],
    notRecommendedFor: [
      'Production deployments',
      'Multi-user applications',
      'Applications requiring high availability'
    ],
    regions: ['local'],
    compliance: [],
    supportLevel: 'community'
  },

  firebase: {
    name: 'Firebase (Google)',
    type: 'firebase',
    description: 'Google\'s comprehensive app development platform with real-time features and easy scaling.',
    features: {
      auth: {
        methods: ['email/password', 'Google', 'Facebook', 'Twitter', 'GitHub', 'Apple', 'Microsoft', 'Yahoo', 'Phone', 'Anonymous'],
        mfa: true,
        customDomains: true,
        sessionManagement: true
      },
      database: {
        type: 'document',
        maxSize: '1GB per database',
        backups: true,
        replication: true,
        transactions: true,
        offline: true,
        search: false,
        realtime: true
      },
      storage: {
        maxFileSize: '5GB',
        totalStorage: '5GB free, then pay-as-you-go',
        cdn: true,
        imageOptimization: true,
        videoStreaming: true,
        encryption: true
      },
      realtime: {
        protocol: 'websocket',
        maxConnections: 200000,
        presence: true,
        history: true,
        guaranteed: true
      },
      functions: {
        runtime: ['nodejs16', 'nodejs18', 'nodejs20', 'python39', 'python310', 'python311', 'java11', 'java17'],
        maxExecutionTime: 540, // 9 minutes
        maxMemory: '8GB',
        coldStart: true,
        scheduling: true,
        eventTriggers: ['http', 'firestore', 'auth', 'storage', 'pubsub', 'analytics']
      },
      notifications: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
        templates: true,
        analytics: true
      }
    },
    pricing: {
      model: 'pay-as-you-go',
      freeTier: {
        users: 50000,
        storage: '5GB',
        bandwidth: '10GB/month',
        functions: 125000,
        duration: 'Always'
      },
      costs: {
        perUser: 0.0055, // After free tier
        perGB: 0.026, // Storage
        perRequest: 0.0000004, // Functions
        perFunction: 0.40 // Per million invocations
      },
      currency: 'USD'
    },
    limitations: {
      rateLimit: '10 requests/second for free tier',
      concurrentUsers: 200000,
      apiCalls: '50k/day free'
    },
    bestFor: [
      'Rapid prototyping',
      'Real-time applications',
      'Mobile apps',
      'Small to medium projects',
      'MVPs and startups',
      'Chat applications',
      'Collaborative tools'
    ],
    notRecommendedFor: [
      'Large enterprise applications',
      'Complex queries and analytics',
      'Applications requiring SQL',
      'Heavily regulated industries'
    ],
    regions: ['us-central1', 'us-east1', 'us-east4', 'us-west1', 'us-west2', 'us-west3', 'us-west4', 'europe-west1', 'europe-west2', 'europe-west3', 'europe-west6', 'asia-east1', 'asia-east2', 'asia-northeast1', 'asia-northeast2', 'asia-northeast3', 'asia-south1', 'asia-southeast1', 'asia-southeast2', 'australia-southeast1', 'southamerica-east1', 'northamerica-northeast1'],
    compliance: ['SOC2', 'ISO27001', 'GDPR'],
    supportLevel: 'professional'
  },

  aws: {
    name: 'AWS (Amazon Web Services)',
    type: 'aws',
    description: 'Enterprise-grade cloud platform with fine-grained control and extensive service ecosystem.',
    features: {
      auth: {
        methods: ['email/password', 'SAML', 'OAuth2', 'OpenID', 'Custom'],
        mfa: true,
        customDomains: true,
        userLimit: undefined, // No limit
        sessionManagement: true
      },
      database: {
        type: 'hybrid', // DynamoDB + RDS options
        maxSize: 'Unlimited',
        backups: true,
        replication: true,
        transactions: true,
        offline: false,
        search: true, // With OpenSearch
        realtime: true // With DynamoDB Streams
      },
      storage: {
        maxFileSize: '5TB',
        totalStorage: 'Unlimited',
        cdn: true, // CloudFront
        imageOptimization: true,
        videoStreaming: true,
        encryption: true
      },
      realtime: {
        protocol: 'websocket',
        maxConnections: undefined, // Scales automatically
        presence: true,
        history: true,
        guaranteed: true
      },
      functions: {
        runtime: ['nodejs14.x', 'nodejs16.x', 'nodejs18.x', 'nodejs20.x', 'python3.8', 'python3.9', 'python3.10', 'python3.11', 'java8', 'java11', 'java17', 'dotnet6', 'go1.x', 'ruby2.7', 'rust'],
        maxExecutionTime: 900, // 15 minutes
        maxMemory: '10GB',
        coldStart: true,
        scheduling: true,
        eventTriggers: ['http', 's3', 'dynamodb', 'kinesis', 'sns', 'sqs', 'cloudwatch', 'eventbridge']
      },
      notifications: {
        email: true, // SES
        sms: true, // SNS
        push: true, // SNS
        inApp: true,
        templates: true,
        analytics: true
      }
    },
    pricing: {
      model: 'pay-as-you-go',
      freeTier: {
        users: 50000, // Cognito
        storage: '5GB', // S3
        bandwidth: '15GB/month',
        functions: 1000000,
        duration: '12 months'
      },
      costs: {
        perUser: 0.0055, // Cognito MAU
        perGB: 0.023, // S3 Standard
        perRequest: 0.0000002, // Lambda
        perFunction: 0.20, // Per million invocations
        minimum: 0
      },
      currency: 'USD'
    },
    limitations: {
      rateLimit: 'Varies by service',
      apiCalls: 'Varies by service'
    },
    bestFor: [
      'Large-scale applications',
      'Enterprise deployments',
      'Complex architectures',
      'Global applications',
      'Regulated industries',
      'High-performance computing',
      'Big data and analytics',
      'Machine learning workloads'
    ],
    notRecommendedFor: [
      'Simple prototypes',
      'Small projects with limited budget',
      'Developers new to cloud'
    ],
    regions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'af-south-1', 'ap-east-1', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-south-1', 'eu-north-1', 'me-south-1', 'sa-east-1'],
    compliance: ['SOC1', 'SOC2', 'SOC3', 'ISO27001', 'ISO27017', 'ISO27018', 'PCI-DSS', 'HIPAA', 'GDPR', 'FedRAMP'],
    supportLevel: 'enterprise'
  }
}

// Helper function to get provider by features
export function getProvidersByFeature(feature: string): ProviderType[] {
  const providers: ProviderType[] = []
  
  for (const [type, capabilities] of Object.entries(providerCapabilities)) {
    const cap = capabilities as ProviderCapabilities
    
    // Check if provider is best for this feature
    if (cap.bestFor.some(best => best.toLowerCase().includes(feature.toLowerCase()))) {
      providers.push(type as ProviderType)
    }
  }
  
  return providers
}

// Helper function to compare providers
export function compareProviders(
  providers: ProviderType[]
): Record<string, any> {
  const comparison: Record<string, any> = {}
  
  for (const provider of providers) {
    const cap = providerCapabilities[provider]
    if (cap) {
      comparison[provider] = {
        name: cap.name,
        pricing: cap.pricing.model,
        bestFor: cap.bestFor.slice(0, 3),
        compliance: cap.compliance,
        support: cap.supportLevel
      }
    }
  }
  
  return comparison
}

// Calculate provider suitability score
export function calculateSuitabilityScore(
  provider: ProviderType,
  requirements: string[]
): number {
  const cap = providerCapabilities[provider]
  if (!cap) {
    return 0
  }
  
  let score = 0
  let matches = 0
  
  for (const req of requirements) {
    if (cap.bestFor.some(best => best.toLowerCase().includes(req.toLowerCase()))) {
      score += 10
      matches++
    }
    if (cap.notRecommendedFor.some(not => not.toLowerCase().includes(req.toLowerCase()))) {
      score -= 15
    }
  }
  
  // Normalize score to 0-100
  return Math.max(0, Math.min(100, (score / requirements.length) * 10 + 50))
}