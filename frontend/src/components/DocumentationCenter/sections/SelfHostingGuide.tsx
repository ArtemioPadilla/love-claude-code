import React from 'react'
import { motion } from 'framer-motion'
import { Server, Package2, Cloud, HardDrive, Network, RefreshCw, Shield, Terminal, Settings, AlertCircle } from 'lucide-react'

const SelfHostingGuide: React.FC = () => {
  const deploymentOptions = [
    {
      icon: <Package2 className="w-5 h-5" />,
      title: 'Docker Compose',
      description: 'Single-server deployment with all services containerized',
      difficulty: 'Easy',
      difficultyColor: 'text-green-400'
    },
    {
      icon: <Cloud className="w-5 h-5" />,
      title: 'Kubernetes',
      description: 'Scalable cloud deployment with auto-scaling and high availability',
      difficulty: 'Advanced',
      difficultyColor: 'text-orange-400'
    },
    {
      icon: <Server className="w-5 h-5" />,
      title: 'Bare Metal',
      description: 'Direct installation on servers without containerization',
      difficulty: 'Medium',
      difficultyColor: 'text-yellow-400'
    },
    {
      icon: <Network className="w-5 h-5" />,
      title: 'Air-Gapped',
      description: 'Completely isolated deployment for maximum security',
      difficulty: 'Expert',
      difficultyColor: 'text-red-400'
    }
  ]

  const systemRequirements = {
    minimum: {
      cpu: '4 cores',
      ram: '8 GB',
      storage: '50 GB SSD',
      bandwidth: '100 Mbps'
    },
    recommended: {
      cpu: '8 cores',
      ram: '16 GB',
      storage: '200 GB SSD',
      bandwidth: '1 Gbps'
    },
    enterprise: {
      cpu: '16+ cores',
      ram: '32+ GB',
      storage: '500+ GB SSD',
      bandwidth: '10 Gbps'
    }
  }

  const updateStrategies = [
    {
      strategy: 'Rolling Updates',
      description: 'Update services one at a time with zero downtime',
      best_for: 'Production environments'
    },
    {
      strategy: 'Blue-Green',
      description: 'Switch between two identical environments',
      best_for: 'Critical systems requiring instant rollback'
    },
    {
      strategy: 'Canary',
      description: 'Gradually roll out updates to a subset of users',
      best_for: 'Testing updates with real traffic'
    },
    {
      strategy: 'In-Place',
      description: 'Update all services simultaneously during maintenance',
      best_for: 'Development and staging environments'
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
          <Server className="w-10 h-10 text-cyan-500" />
          Self-Hosting Guide
        </h1>
        <p className="text-xl text-gray-400">
          Deploy and manage Love Claude Code in your own infrastructure
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Complete Control Over Your Platform</h2>
        <p className="text-gray-300 mb-4">
          Self-hosting Love Claude Code gives you complete control over your development platform. Deploy it 
          in your own data center, private cloud, or even on a single server. This guide covers everything 
          from initial setup to production deployment and ongoing maintenance.
        </p>
        <p className="text-gray-300">
          Whether you need to meet specific compliance requirements, integrate with existing infrastructure, 
          or simply prefer to manage your own systems, self-hosting provides the flexibility you need.
        </p>
      </motion.div>

      {/* Deployment Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Deployment Options</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {deploymentOptions.map((option, _index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * _index }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                    {option.icon}
                  </div>
                  <h3 className="font-semibold">{option.title}</h3>
                </div>
                <span className={`text-sm font-medium ${option.difficultyColor}`}>
                  {option.difficulty}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{option.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Start with Docker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Package2 className="w-6 h-6 text-cyan-400" />
          Quick Start with Docker Compose
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">1. Clone the Repository</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`git clone https://github.com/love-claude-code/platform.git
cd platform
cp .env.example .env`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">2. Configure Environment</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# Edit .env file with your settings
DOMAIN=your-domain.com
ADMIN_EMAIL=admin@your-domain.com
CLAUDE_API_KEY=your-api-key
DATABASE_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">3. Start the Platform</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f`}</pre>
            </div>
          </div>

          <div className="mt-4 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <p className="text-sm text-gray-300">
              <strong>First Run:</strong> The platform will be available at https://localhost:3000 after 
              initialization. Use the admin credentials from your .env file to log in.
            </p>
          </div>
        </div>
      </motion.div>

      {/* System Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-cyan-400" />
          System Requirements
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-3 text-green-400">Minimum</h3>
            <p className="text-sm text-gray-400 mb-3">For development and testing</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-400">CPU:</span>
                <span className="text-gray-300">{systemRequirements.minimum.cpu}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">RAM:</span>
                <span className="text-gray-300">{systemRequirements.minimum.ram}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Storage:</span>
                <span className="text-gray-300">{systemRequirements.minimum.storage}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-gray-300">{systemRequirements.minimum.bandwidth}</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-cyan-500/20">
            <h3 className="font-semibold mb-3 text-cyan-400">Recommended</h3>
            <p className="text-sm text-gray-400 mb-3">For small to medium teams</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-400">CPU:</span>
                <span className="text-gray-300">{systemRequirements.recommended.cpu}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">RAM:</span>
                <span className="text-gray-300">{systemRequirements.recommended.ram}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Storage:</span>
                <span className="text-gray-300">{systemRequirements.recommended.storage}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-gray-300">{systemRequirements.recommended.bandwidth}</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-3 text-purple-400">Enterprise</h3>
            <p className="text-sm text-gray-400 mb-3">For large organizations</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-400">CPU:</span>
                <span className="text-gray-300">{systemRequirements.enterprise.cpu}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">RAM:</span>
                <span className="text-gray-300">{systemRequirements.enterprise.ram}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Storage:</span>
                <span className="text-gray-300">{systemRequirements.enterprise.storage}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-gray-300">{systemRequirements.enterprise.bandwidth}</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Production Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          Production Configuration
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">SSL/TLS Configuration</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# Automatic SSL with Let's Encrypt
ENABLE_SSL=true
SSL_EMAIL=admin@your-domain.com
SSL_DOMAINS=your-domain.com,www.your-domain.com

# Or use custom certificates
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Database Configuration</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# PostgreSQL settings
DB_HOST=db
DB_PORT=5432
DB_NAME=loveclaudecode
DB_USER=postgres
DB_PASSWORD=secure-password
DB_POOL_SIZE=20

# Enable replication for HA
DB_REPLICA_HOST=db-replica
DB_REPLICA_PORT=5432`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Security Hardening</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1" />
                <span>Enable firewall rules for all services</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1" />
                <span>Configure fail2ban for brute force protection</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1" />
                <span>Set up intrusion detection system (IDS)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1" />
                <span>Enable audit logging for all API calls</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1" />
                <span>Implement network segmentation</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Updates and Maintenance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-cyan-400" />
          Updates and Maintenance
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Update Strategies</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {updateStrategies.map((strategy) => (
                <div key={strategy.strategy} className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-cyan-400">{strategy.strategy}</h4>
                  <p className="text-sm text-gray-300 mb-1">{strategy.description}</p>
                  <p className="text-xs text-gray-400">Best for: {strategy.best_for}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Update Process</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# 1. Backup current state
./scripts/backup.sh

# 2. Pull latest updates
git pull origin main

# 3. Review changelog
cat CHANGELOG.md

# 4. Update services
docker-compose pull
docker-compose up -d

# 5. Run migrations
docker-compose exec backend npm run migrate

# 6. Verify health
./scripts/health-check.sh`}</pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monitoring and Troubleshooting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Monitoring & Troubleshooting</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Health Monitoring</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-green-400">Service Health Checks</h4>
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
                  <div className="text-green-400">✓ Frontend: Healthy (200 OK)</div>
                  <div className="text-green-400">✓ Backend: Healthy (200 OK)</div>
                  <div className="text-green-400">✓ Database: Connected (5 connections)</div>
                  <div className="text-yellow-400">⚠ Cache: High memory usage (85%)</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-400">Metrics Dashboard</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• CPU and memory usage</li>
                  <li>• Request rates and latency</li>
                  <li>• Error rates and logs</li>
                  <li>• Database performance</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Common Issues</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Services won't start</h4>
                  <p className="text-sm text-gray-400">Check port conflicts, verify environment variables, review container logs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Database connection errors</h4>
                  <p className="text-sm text-gray-400">Verify credentials, check network connectivity, ensure DB is running</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Performance degradation</h4>
                  <p className="text-sm text-gray-400">Check resource usage, review slow queries, scale services if needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backup and Recovery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Backup & Recovery</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Automated Backups</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# Configure in docker-compose.yml
backup:
  image: loveclaudecode/backup
  environment:
    - BACKUP_SCHEDULE="0 2 * * *"
    - BACKUP_RETENTION_DAYS=30
    - S3_BUCKET=backups
  volumes:
    - ./data:/data
    - ./backups:/backups`}</pre>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Recovery Process</h3>
            <ol className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">1.</span>
                <span>Stop all services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">2.</span>
                <span>Restore database from backup</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">3.</span>
                <span>Restore file storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">4.</span>
                <span>Verify configuration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">5.</span>
                <span>Start services and test</span>
              </li>
            </ol>
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
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-3">
          <a href="#deployment-guide" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Advanced Deployment Guide →
            </h3>
            <p className="text-gray-400 text-sm">Kubernetes, multi-region, and high-availability setups</p>
          </a>
          <a href="#security-hardening" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Hardening →
            </h3>
            <p className="text-gray-400 text-sm">Comprehensive security configuration guide</p>
          </a>
          <a href="#community-forum" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Network className="w-4 h-4" />
              Community Forum →
            </h3>
            <p className="text-gray-400 text-sm">Get help from other self-hosters</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default SelfHostingGuide