import React from 'react'
import { motion } from 'framer-motion'
import { 
  Cloud, Shield, Zap, Server, 
  Lock, Layers, 
  GitBranch, Package, Activity, BarChart3
} from 'lucide-react'

const MultiCloudArchitecture: React.FC = () => {
  const architecturePrinciples = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Provider Abstraction',
      description: 'Unified interfaces hide provider-specific implementation details'
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: 'Seamless Migration',
      description: 'Switch providers without changing application code'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Vendor Independence',
      description: 'Avoid lock-in with portable, standard-based APIs'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Optimized Performance',
      description: 'Provider-specific optimizations without sacrificing portability'
    }
  ]
  
  const providerCapabilities = [
    {
      provider: 'Local',
      icon: '💻',
      features: {
        'Authentication': 'JWT tokens with local storage',
        'Database': 'JSON file storage with PostgreSQL option',
        'File Storage': 'Local file system',
        'Functions': 'Node.js process execution',
        'Real-time': 'WebSocket server',
        'Best For': 'Development, testing, learning'
      }
    },
    {
      provider: 'Firebase',
      icon: '🔥',
      features: {
        'Authentication': 'Firebase Auth with social providers',
        'Database': 'Firestore with real-time sync',
        'File Storage': 'Cloud Storage buckets',
        'Functions': 'Cloud Functions (serverless)',
        'Real-time': 'Realtime Database',
        'Best For': 'Rapid prototyping, small to medium apps'
      }
    },
    {
      provider: 'AWS',
      icon: '☁️',
      features: {
        'Authentication': 'Cognito with MFA support',
        'Database': 'DynamoDB with global tables',
        'File Storage': 'S3 with CDN integration',
        'Functions': 'Lambda with custom runtimes',
        'Real-time': 'API Gateway WebSockets',
        'Best For': 'Enterprise, high-scale production'
      }
    }
  ]
  
  const migrationSteps = [
    'Export data from current provider',
    'Configure new provider credentials',
    'Run migration tool with mapping',
    'Verify data integrity',
    'Update environment configuration',
    'Test application functionality',
    'Switch traffic to new provider'
  ]
  
  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Cloud className="w-10 h-10 text-blue-500" />
          Multi-Cloud Architecture
        </h1>
        <p className="text-xl text-gray-400">
          Build once, deploy anywhere. Our provider abstraction layer ensures your application 
          remains portable across different cloud platforms.
        </p>
      </motion.div>
      
      {/* Architecture Principles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Core Architecture Principles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {architecturePrinciples.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6 flex gap-4"
            >
              <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400 h-fit">
                {principle.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{principle.title}</h3>
                <p className="text-gray-400">{principle.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Provider Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">Provider Interface</h2>
        <p className="text-gray-400 mb-4">
          All providers implement the same interface, making it easy to switch between them:
        </p>
        <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{`interface BackendProvider {
  // Authentication
  auth: {
    signUp(email: string, password: string): Promise<User>
    signIn(email: string, password: string): Promise<Session>
    signOut(): Promise<void>
    getCurrentUser(): Promise<User | null>
  }
  
  // Database
  database: {
    get(collection: string, id: string): Promise<Document>
    create(collection: string, data: any): Promise<string>
    update(collection: string, id: string, data: any): Promise<void>
    delete(collection: string, id: string): Promise<void>
    query(collection: string, filters: Filter[]): Promise<Document[]>
  }
  
  // File Storage
  storage: {
    upload(path: string, file: File): Promise<string>
    download(path: string): Promise<Blob>
    delete(path: string): Promise<void>
    list(prefix: string): Promise<FileInfo[]>
  }
  
  // Serverless Functions
  functions: {
    invoke(name: string, payload: any): Promise<any>
    schedule(name: string, cron: string): Promise<void>
  }
  
  // Real-time
  realtime: {
    subscribe(channel: string, callback: (data: any) => void): Subscription
    publish(channel: string, data: any): Promise<void>
  }
}`}</code>
        </pre>
      </motion.div>
      
      {/* Provider Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Provider Capabilities</h2>
        <div className="space-y-6">
          {providerCapabilities.map((provider, index) => (
            <motion.div
              key={provider.provider}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{provider.icon}</span>
                <h3 className="text-xl font-semibold">{provider.provider} Provider</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(provider.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}:</span>
                    <span className={key === 'Best For' ? 'text-blue-400' : 'text-gray-300'}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Migration Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-700"
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-400" />
          Provider Migration
        </h2>
        <p className="text-gray-300 mb-6">
          Migrating between providers is straightforward with our built-in migration tools:
        </p>
        <div className="space-y-3">
          {migrationSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-semibold">
                {index + 1}
              </div>
              <span className="text-gray-300">{step}</span>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <Activity className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Start Local</h3>
            <p className="text-gray-400">
              Begin development with the Local provider for zero-config setup and fast iteration.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <BarChart3 className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Monitor Costs</h3>
            <p className="text-gray-400">
              Use our cost estimation tools to predict expenses before switching providers.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <Lock className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Environment Isolation</h3>
            <p className="text-gray-400">
              Use different providers for dev, staging, and production environments.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <Server className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Provider-Specific Features</h3>
            <p className="text-gray-400">
              Leverage unique provider features through optional enhancement modules.
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Code Example */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">Usage Example</h2>
        <p className="text-gray-400 mb-4">
          Here's how easy it is to use the multi-cloud architecture:
        </p>
        <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{`import { getProvider } from '@love-claude-code/providers'

// Initialize provider based on environment
const provider = await getProvider({
  type: process.env.PROVIDER_TYPE || 'local',
  config: {
    // Provider-specific configuration
  }
})

// Use the same API regardless of provider
const user = await provider.auth.signUp('user@example.com', 'password')
const docId = await provider.database.create('projects', {
  name: 'My Project',
  owner: user.id
})

// Real-time updates work the same way
provider.realtime.subscribe('projects/' + docId, (data) => {
  console.log('Project updated:', data)
})`}</code>
        </pre>
      </motion.div>
    </div>
  )
}

export default MultiCloudArchitecture