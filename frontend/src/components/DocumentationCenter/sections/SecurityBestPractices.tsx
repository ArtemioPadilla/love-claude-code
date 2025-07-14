import React from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, Lock, Key, AlertTriangle, CheckCircle, 
  Eye, EyeOff, Server, Database, Globe,
  UserCheck, ShieldCheck, FileWarning, Zap,
  GitBranch, Activity, Terminal, Package
} from 'lucide-react'

const SecurityBestPractices: React.FC = () => {
  const securityPillars = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Authentication & Authorization',
      description: 'Multi-factor authentication, role-based access control, and secure session management'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Data Protection',
      description: 'End-to-end encryption, secure storage, and privacy-first design'
    },
    {
      icon: <Server className="w-6 h-6" />,
      title: 'Infrastructure Security',
      description: 'Isolated execution environments, network security, and DDoS protection'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Monitoring & Compliance',
      description: 'Real-time threat detection, audit logging, and regulatory compliance'
    }
  ]
  
  const securityFeatures = [
    {
      category: 'Authentication',
      icon: <UserCheck className="w-5 h-5" />,
      features: [
        'JWT tokens with short expiration',
        'Refresh token rotation',
        'OAuth 2.0 / OIDC support',
        'Multi-factor authentication (MFA)',
        'Biometric authentication support',
        'Account lockout protection'
      ]
    },
    {
      category: 'Data Security',
      icon: <Database className="w-5 h-5" />,
      features: [
        'AES-256 encryption at rest',
        'TLS 1.3 for data in transit',
        'Encrypted API keys storage',
        'Secure credential management',
        'Data anonymization options',
        'GDPR-compliant data handling'
      ]
    },
    {
      category: 'Code Execution',
      icon: <Terminal className="w-5 h-5" />,
      features: [
        'Sandboxed Docker containers',
        'Resource limits (CPU, memory)',
        'Network isolation',
        'Read-only file systems',
        'No persistent storage',
        'Execution time limits'
      ]
    },
    {
      category: 'API Security',
      icon: <Globe className="w-5 h-5" />,
      features: [
        'Rate limiting per user/IP',
        'API key rotation',
        'CORS configuration',
        'Input validation',
        'SQL injection prevention',
        'XSS protection'
      ]
    }
  ]
  
  const bestPractices = [
    {
      title: 'Never Store Secrets in Code',
      description: 'Use environment variables or secure key management services',
      example: `// ❌ Bad
const apiKey = "sk-1234567890abcdef"

// ✅ Good
const apiKey = process.env.ANTHROPIC_API_KEY`
    },
    {
      title: 'Implement Least Privilege',
      description: 'Grant minimum necessary permissions for users and services',
      example: `// Role-based access control
const canEdit = hasPermission(user, 'project:edit')
const canDelete = hasPermission(user, 'project:delete')`
    },
    {
      title: 'Validate All Input',
      description: 'Never trust user input, validate and sanitize everything',
      example: `// Input validation with Zod
const schema = z.object({
  email: z.string().email(),
  projectName: z.string().min(1).max(100)
})`
    },
    {
      title: 'Use Secure Headers',
      description: 'Implement security headers to prevent common attacks',
      example: `// Security headers
app.use(helmet({
  contentSecurityPolicy: true,
  hsts: { maxAge: 31536000 }
}))`
    }
  ]
  
  const complianceStandards = [
    { name: 'GDPR', description: 'EU data protection regulation', status: 'compliant' },
    { name: 'SOC 2', description: 'Security and availability', status: 'in-progress' },
    { name: 'HIPAA', description: 'Healthcare data protection', status: 'planned' },
    { name: 'PCI DSS', description: 'Payment card security', status: 'planned' }
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
          <Shield className="w-10 h-10 text-green-500" />
          Security Best Practices
        </h1>
        <p className="text-xl text-gray-400">
          Security is not an afterthought. Love Claude Code is built with security-first principles 
          to protect your code, data, and infrastructure.
        </p>
      </motion.div>
      
      {/* Security Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Security Pillars</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {securityPillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6 flex gap-4"
            >
              <div className="bg-green-500/20 p-3 rounded-lg text-green-400 h-fit">
                {pillar.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{pillar.title}</h3>
                <p className="text-gray-400">{pillar.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Security Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Built-in Security Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {securityFeatures.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold">{category.category}</h3>
              </div>
              <ul className="space-y-2">
                {category.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Developer Best Practices</h2>
        <div className="space-y-6">
          {bestPractices.map((practice, index) => (
            <motion.div
              key={practice.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-500" />
                {practice.title}
              </h3>
              <p className="text-gray-400 mb-4">{practice.description}</p>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">{practice.example}</code>
              </pre>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* API Key Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-orange-900/50 to-red-900/50 rounded-xl p-8 border border-orange-700"
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-400" />
          API Key Security
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Never Expose API Keys</h3>
              <p className="text-gray-400">API keys are encrypted at rest and never sent to the frontend</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <GitBranch className="w-5 h-5 text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Use Git Ignore</h3>
              <p className="text-gray-400">Always add .env files to .gitignore to prevent accidental commits</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Rotate Regularly</h3>
              <p className="text-gray-400">Rotate API keys periodically and after any suspected breach</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Compliance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Compliance & Certifications</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {complianceStandards.map((standard) => (
            <div key={standard.name} className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{standard.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  standard.status === 'compliant' ? 'bg-green-500/20 text-green-400' :
                  standard.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {standard.status}
                </span>
              </div>
              <p className="text-gray-400">{standard.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Security Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-gray-800 rounded-xl p-8"
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-green-400" />
          Security Checklist
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Enable multi-factor authentication',
            'Use strong, unique passwords',
            'Keep dependencies updated',
            'Review code for vulnerabilities',
            'Implement proper error handling',
            'Use HTTPS everywhere',
            'Validate and sanitize inputs',
            'Implement rate limiting',
            'Monitor for suspicious activity',
            'Regular security audits',
            'Backup data regularly',
            'Have an incident response plan'
          ].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">{item}</span>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default SecurityBestPractices