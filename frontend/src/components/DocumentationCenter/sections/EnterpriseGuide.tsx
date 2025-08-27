import React from 'react'
import { motion } from 'framer-motion'
import { Building2, Shield, Users, Key, Lock, BarChart3, Cloud, Globe, Activity } from 'lucide-react'

const EnterpriseGuide: React.FC = () => {
  const enterpriseFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant infrastructure with end-to-end encryption and audit logging'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Team Management',
      description: 'Advanced RBAC with custom roles, permissions, and organizational hierarchy'
    },
    {
      icon: <Key className="w-5 h-5" />,
      title: 'Single Sign-On',
      description: 'SAML 2.0 and OIDC support for seamless integration with your identity provider'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Analytics & Insights',
      description: 'Detailed usage analytics, performance metrics, and team productivity reports'
    }
  ]

  const ssoProviders = [
    {
      name: 'Okta',
      protocol: 'SAML 2.0 / OIDC',
      setup: 'Automated configuration with metadata exchange'
    },
    {
      name: 'Azure AD',
      protocol: 'SAML 2.0 / OAuth 2.0',
      setup: 'Enterprise app gallery integration'
    },
    {
      name: 'Google Workspace',
      protocol: 'OIDC',
      setup: 'One-click setup with domain verification'
    },
    {
      name: 'Auth0',
      protocol: 'OIDC / OAuth 2.0',
      setup: 'Universal login with custom domains'
    }
  ]

  const rbacRoles = [
    {
      role: 'Organization Owner',
      permissions: [
        'Full administrative access',
        'Billing and subscription management',
        'SSO configuration',
        'Delete organization'
      ],
      color: 'text-red-400'
    },
    {
      role: 'Admin',
      permissions: [
        'Manage users and teams',
        'Configure security policies',
        'Access audit logs',
        'Manage integrations'
      ],
      color: 'text-orange-400'
    },
    {
      role: 'Developer',
      permissions: [
        'Create and edit constructs',
        'Deploy applications',
        'Access development tools',
        'View team projects'
      ],
      color: 'text-blue-400'
    },
    {
      role: 'Viewer',
      permissions: [
        'Read-only access',
        'View constructs and documentation',
        'Access public resources',
        'Generate reports'
      ],
      color: 'text-gray-400'
    }
  ]

  const complianceFeatures = [
    {
      standard: 'SOC 2 Type II',
      description: 'Annual audits for security, availability, and confidentiality'
    },
    {
      standard: 'GDPR Compliant',
      description: 'Data privacy controls and right to deletion'
    },
    {
      standard: 'HIPAA Ready',
      description: 'Available with signed BAA for healthcare organizations'
    },
    {
      standard: 'ISO 27001',
      description: 'Information security management certification'
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
          <Building2 className="w-10 h-10 text-indigo-500" />
          Enterprise Guide
        </h1>
        <p className="text-xl text-gray-400">
          Scale Love Claude Code across your organization with enterprise-grade security and controls
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Enterprise-Ready Platform</h2>
        <p className="text-gray-300 mb-4">
          Love Claude Code Enterprise provides the security, control, and scalability that large organizations 
          need. Deploy on-premise or in your private cloud, integrate with your existing tools, and maintain 
          complete control over your data and infrastructure.
        </p>
        <p className="text-gray-300">
          Our enterprise features are designed to meet the strictest security and compliance requirements while 
          providing the flexibility to adapt to your organization's unique needs.
        </p>
      </motion.div>

      {/* Core Enterprise Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Core Enterprise Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {enterpriseFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-lg p-6 flex gap-4"
            >
              <div className="flex-shrink-0 p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* SSO Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Key className="w-6 h-6 text-indigo-400" />
          Single Sign-On (SSO)
        </h2>
        <p className="text-gray-300 mb-6">
          Integrate Love Claude Code with your existing identity provider for seamless authentication:
        </p>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {ssoProviders.map((provider) => (
              <div key={provider.name} className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{provider.name}</h3>
                <p className="text-sm text-gray-400 mb-1">Protocol: {provider.protocol}</p>
                <p className="text-sm text-gray-300">{provider.setup}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">SSO Setup Process</h3>
            <ol className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-mono">1.</span>
                <span>Navigate to Settings → Security → SSO Configuration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-mono">2.</span>
                <span>Select your identity provider and protocol</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-mono">3.</span>
                <span>Exchange metadata or configure endpoints</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-mono">4.</span>
                <span>Map user attributes and test authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-mono">5.</span>
                <span>Enable SSO enforcement for your organization</span>
              </li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* RBAC System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          Role-Based Access Control (RBAC)
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {rbacRoles.map((role, _index) => (
            <div key={role.role} className="bg-gray-800 rounded-lg p-6">
              <h3 className={`font-semibold mb-3 ${role.color}`}>{role.role}</h3>
              <ul className="space-y-2">
                {role.permissions.map((permission, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <p className="text-sm text-gray-300">
            <strong>Custom Roles:</strong> Create organization-specific roles with granular permissions 
            tailored to your team's structure and workflows.
          </p>
        </div>
      </motion.div>

      {/* Compliance & Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          Compliance & Security
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {complianceFeatures.map((feature) => (
            <div key={feature.standard} className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-indigo-400">{feature.standard}</h3>
              <p className="text-sm text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Security Features</h3>
            <ul className="grid md:grid-cols-2 gap-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1" />
                <span>End-to-end encryption for all data</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1" />
                <span>Private construct repositories</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1" />
                <span>IP allowlisting and VPN support</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1" />
                <span>Automated security scanning</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1" />
                <span>Detailed audit logging</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1" />
                <span>Data residency controls</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Deployment Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Cloud className="w-6 h-6 text-indigo-400" />
          Deployment Options
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2 text-blue-400">Cloud (SaaS)</h3>
            <p className="text-sm text-gray-300 mb-3">
              Fully managed solution with automatic updates and scaling
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• No infrastructure management</li>
              <li>• 99.9% SLA uptime</li>
              <li>• Global CDN</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 text-green-400">Private Cloud</h3>
            <p className="text-sm text-gray-300 mb-3">
              Deploy in your AWS, Azure, or GCP environment
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Full data control</li>
              <li>• Custom networking</li>
              <li>• Managed updates</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 text-purple-400">On-Premise</h3>
            <p className="text-sm text-gray-300 mb-3">
              Install in your own data center with air-gap support
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Complete isolation</li>
              <li>• Custom integrations</li>
              <li>• Self-managed</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Analytics & Monitoring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-400" />
          Analytics & Monitoring
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Organization Insights</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-blue-400">Usage Analytics</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Active users and growth trends</li>
                  <li>• Construct creation and usage</li>
                  <li>• API call volumes</li>
                  <li>• Resource consumption</li>
                </ul>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-green-400">Performance Metrics</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Build times and success rates</li>
                  <li>• Deployment frequency</li>
                  <li>• Error rates and debugging</li>
                  <li>• Platform availability</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Audit Logging</h3>
            <p className="text-gray-300 mb-3">
              Comprehensive audit trail of all activities within your organization:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500">2024-01-15 14:32:05</span>
                <span className="text-blue-400">user.login</span>
                <span>john.doe@company.com</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500">2024-01-15 14:35:12</span>
                <span className="text-green-400">construct.created</span>
                <span>secure-api-gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">2024-01-15 14:45:33</span>
                <span className="text-orange-400">permissions.updated</span>
                <span>developer-role</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Support & Services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Enterprise Support</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-bronze rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">B</span>
            </div>
            <h3 className="font-semibold mb-2">Bronze</h3>
            <p className="text-sm text-gray-400">Business hours support</p>
            <p className="text-sm text-gray-400">48-hour response SLA</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <h3 className="font-semibold mb-2">Silver</h3>
            <p className="text-sm text-gray-400">24/7 support</p>
            <p className="text-sm text-gray-400">4-hour response SLA</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">G</span>
            </div>
            <h3 className="font-semibold mb-2">Gold</h3>
            <p className="text-sm text-gray-400">Dedicated success manager</p>
            <p className="text-sm text-gray-400">30-minute response SLA</p>
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
        <h2 className="text-2xl font-semibold mb-4">Get Started with Enterprise</h2>
        <div className="space-y-3">
          <a href="#enterprise-trial" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Start Enterprise Trial →
            </h3>
            <p className="text-gray-400 text-sm">30-day trial with full enterprise features</p>
          </a>
          <a href="#contact-sales" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contact Sales →
            </h3>
            <p className="text-gray-400 text-sm">Discuss your organization's specific needs</p>
          </a>
          <a href="#security-whitepaper" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Whitepaper →
            </h3>
            <p className="text-gray-400 text-sm">Detailed security architecture and compliance documentation</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default EnterpriseGuide