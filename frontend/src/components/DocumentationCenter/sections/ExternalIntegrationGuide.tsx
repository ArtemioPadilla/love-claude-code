import React from 'react'
import { motion } from 'framer-motion'
import { Plug, Package, Package2, Globe, Terminal, Shield, Link2, Settings, AlertCircle, CheckCircle } from 'lucide-react'

const ExternalIntegrationGuide: React.FC = () => {
  const integrationTypes = [
    {
      icon: <Package className="w-5 h-5" />,
      title: 'NPM Packages',
      description: 'Import and use any NPM package in your constructs',
      examples: ['lodash', 'axios', 'moment', 'express']
    },
    {
      icon: <Terminal className="w-5 h-5" />,
      title: 'MCP Servers',
      description: 'Integrate Model Context Protocol servers for AI tools',
      examples: ['playwright-mcp', 'github-mcp', 'slack-mcp', 'database-mcp']
    },
    {
      icon: <Package2 className="w-5 h-5" />,
      title: 'Docker Services',
      description: 'Run containerized services alongside your constructs',
      examples: ['PostgreSQL', 'Redis', 'Elasticsearch', 'RabbitMQ']
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'External APIs',
      description: 'Connect to third-party APIs and web services',
      examples: ['OpenAI', 'Stripe', 'Twilio', 'SendGrid']
    }
  ]

  const featuredIntegrations = [
    {
      name: 'Playwright MCP Server',
      type: 'MCP Server',
      description: 'Browser automation and testing capabilities',
      installation: 'npx install-mcp playwright-mcp-server',
      usage: `// In your construct
import { PlaywrightMCP } from '@external/playwright-mcp'

const browser = new PlaywrightMCP({
  headless: true,
  timeout: 30000
})

await browser.navigate('https://example.com')
await browser.screenshot('page.png')`
    },
    {
      name: 'Apache Airflow',
      type: 'Docker Service',
      description: 'Workflow orchestration and scheduling',
      installation: 'docker pull apache/airflow:latest',
      usage: `# docker-compose.yml
services:
  airflow:
    image: apache/airflow:latest
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
    volumes:
      - ./dags:/opt/airflow/dags`
    },
    {
      name: 'Apache Superset',
      type: 'Docker Service',
      description: 'Business intelligence and data visualization',
      installation: 'docker pull apache/superset:latest',
      usage: `# Configure in construct
const superset = new DockerServicePrimitive({
  image: 'apache/superset:latest',
  ports: ['8088:8088'],
  environment: {
    SUPERSET_SECRET_KEY: process.env.SECRET_KEY
  }
})`
    },
    {
      name: 'Grafana',
      type: 'Docker Service',
      description: 'Monitoring and observability dashboards',
      installation: 'docker pull grafana/grafana:latest',
      usage: `# Integration with construct metrics
const metrics = new GrafanaIntegration({
  datasource: 'prometheus',
  dashboards: ['./dashboards/*.json'],
  alerts: true
})`
    }
  ]

  const integrationSteps = [
    {
      step: 1,
      title: 'Identify Requirements',
      description: 'Determine what external tools or services you need',
      icon: <Settings className="w-5 h-5" />
    },
    {
      step: 2,
      title: 'Create Wrapper Construct',
      description: 'Build an L0 primitive that wraps the external dependency',
      icon: <Package className="w-5 h-5" />
    },
    {
      step: 3,
      title: 'Handle Authentication',
      description: 'Securely manage API keys and credentials',
      icon: <Shield className="w-5 h-5" />
    },
    {
      step: 4,
      title: 'Test Integration',
      description: 'Verify the integration works in isolation and with other constructs',
      icon: <CheckCircle className="w-5 h-5" />
    }
  ]

  const securityConsiderations = [
    {
      concern: 'API Key Management',
      solution: 'Use environment variables and secret management services'
    },
    {
      concern: 'Network Security',
      solution: 'Implement proper firewall rules and use VPN when needed'
    },
    {
      concern: 'Data Privacy',
      solution: 'Encrypt sensitive data in transit and at rest'
    },
    {
      concern: 'Access Control',
      solution: 'Use least privilege principle and audit access logs'
    }
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
          <Plug className="w-10 h-10 text-teal-500" />
          External Integration Guide
        </h1>
        <p className="text-xl text-gray-400">
          Connect Love Claude Code with external tools, libraries, and services
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Extend Beyond the Platform</h2>
        <p className="text-gray-300 mb-4">
          Love Claude Code is designed to work seamlessly with external tools and services. Whether you 
          need to integrate NPM packages, connect to MCP servers, run Docker containers, or call external 
          APIs, our construct system provides clean abstractions for any integration.
        </p>
        <p className="text-gray-300">
          By wrapping external dependencies in constructs, you maintain the benefits of our type system, 
          testing framework, and deployment pipeline while leveraging the vast ecosystem of existing tools.
        </p>
      </motion.div>

      {/* Integration Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Types of Integrations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {integrationTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400">
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{type.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{type.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {type.examples.map((example) => (
                      <span key={example} className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Integration Process */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">Integration Process</h2>
        <div className="space-y-4">
          {integrationSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                {step.step}
              </div>
              <div className="flex-1 flex items-center gap-4">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Featured Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Featured Integrations</h2>
        <div className="space-y-6">
          {featuredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{integration.name}</h3>
                  <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm">
                    {integration.type}
                  </span>
                </div>
                <p className="text-gray-400">{integration.description}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-300">Installation</h4>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                    <code className="text-teal-400">{integration.installation}</code>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-gray-300">Usage Example</h4>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-gray-300">{integration.usage}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Creating External Construct Wrappers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4">Creating External Construct Wrappers</h2>
        <p className="text-gray-300 mb-4">
          Best practice is to wrap external dependencies in L0 primitive constructs. This provides:
        </p>
        <ul className="space-y-2 text-gray-300 mb-6">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <span>Type safety through TypeScript interfaces</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <span>Consistent error handling and logging</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <span>Testing isolation and mocking capabilities</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <span>Version management and dependency tracking</span>
          </li>
        </ul>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Example: NPM Package Wrapper</h3>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-300">{`// L0/external/AxiosHttpClient.ts
import axios, { AxiosInstance } from 'axios'
import { L0ExternalConstruct } from '@lcc/constructs'

export class AxiosHttpClient extends L0ExternalConstruct {
  private client: AxiosInstance
  
  constructor(config: HttpClientConfig) {
    super(config)
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers
    })
    
    // Add interceptors for logging/monitoring
    this.setupInterceptors()
  }
  
  async get<T>(path: string): Promise<T> {
    const response = await this.client.get(path)
    return response.data
  }
  
  // ... other methods
}`}</pre>
          </div>
        </div>
      </motion.div>

      {/* Security Considerations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-400" />
          Security Considerations
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {securityConsiderations.map((item) => (
            <div key={item.concern} className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-red-400">{item.concern}</h3>
              <p className="text-gray-300 text-sm">{item.solution}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-gray-300">
              <strong>Important:</strong> Always audit external dependencies for security vulnerabilities. 
              Use tools like npm audit and keep dependencies updated.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Testing External Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Testing External Integrations</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Mock External Services</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`// Mock MCP server for testing
class MockPlaywrightMCP implements PlaywrightMCPInterface {
  async navigate(url: string) {
    return { success: true, url }
  }
  
  async screenshot(filename: string) {
    return { success: true, path: \`/mocks/\${filename}\` }
  }
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Integration Tests</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`describe('External Integration', () => {
  it('should connect to real service in integration tests', async () => {
    // Use real service with test credentials
    const client = new ExternalServiceClient({
      apiKey: process.env.TEST_API_KEY
    })
    
    const result = await client.testConnection()
    expect(result.connected).toBe(true)
  })
})`}</pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monitoring and Debugging */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Monitoring & Debugging</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-blue-400 mt-1" />
            <div>
              <strong>Logging:</strong> Implement comprehensive logging for all external calls
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Link2 className="w-5 h-5 text-green-400 mt-1" />
            <div>
              <strong>Tracing:</strong> Use distributed tracing to track requests across services
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-400 mt-1" />
            <div>
              <strong>Health Checks:</strong> Implement health endpoints for all integrations
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-1" />
            <div>
              <strong>Error Handling:</strong> Gracefully handle external service failures
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Get Started with Integrations</h2>
        <div className="space-y-3">
          <a href="#integration-templates" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Browse Integration Templates →
            </h3>
            <p className="text-gray-400 text-sm">Pre-built wrappers for popular services</p>
          </a>
          <a href="#mcp-catalog" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              MCP Server Catalog →
            </h3>
            <p className="text-gray-400 text-sm">Discover available MCP servers</p>
          </a>
          <a href="#api-docs" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Integration API Reference →
            </h3>
            <p className="text-gray-400 text-sm">Detailed API documentation for creating integrations</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default ExternalIntegrationGuide