import React, { useState, useEffect } from 'react'
import {
  Shield,
  Key,
  Link,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Download,
  Upload,
  Plus,
  Trash2,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ssoService, SSOProvider, SSOConfiguration as SSOConfigurationData, SAMLConfig, OAuthConfig } from '../../services/auth/ssoService'
import { useEnterpriseStore } from '../../stores/enterpriseStore'

interface SSOConfigFormData {
  provider: SSOProvider
  enabled: boolean
  // SAML fields
  metadataUrl?: string
  metadataXml?: string
  entityId?: string
  ssoUrl?: string
  certificate?: string
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512'
  // OAuth fields
  clientId?: string
  clientSecret?: string
  authorizationUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  scope?: string[]
  redirectUri?: string
  // Common fields
  allowedDomains?: string[]
  autoProvisionUsers: boolean
  syncUserAttributes: boolean
  defaultRole?: string
  // Attribute mapping
  attributeMapping: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
    department?: string
    role?: string
  }
}

const providerInfo = {
  [SSOProvider.SAML]: {
    name: 'SAML 2.0',
    description: 'Generic SAML 2.0 provider for enterprise SSO',
    icon: Shield,
    color: 'blue'
  },
  [SSOProvider.OAUTH2]: {
    name: 'OAuth 2.0',
    description: 'Generic OAuth 2.0 provider',
    icon: Key,
    color: 'green'
  },
  [SSOProvider.OIDC]: {
    name: 'OpenID Connect',
    description: 'OpenID Connect (OIDC) provider',
    icon: Shield,
    color: 'purple'
  },
  [SSOProvider.OKTA]: {
    name: 'Okta',
    description: 'Okta Identity Platform',
    icon: Shield,
    color: 'blue'
  },
  [SSOProvider.AUTH0]: {
    name: 'Auth0',
    description: 'Auth0 Universal Login',
    icon: Shield,
    color: 'orange'
  },
  [SSOProvider.AZURE_AD]: {
    name: 'Azure AD',
    description: 'Microsoft Azure Active Directory',
    icon: Shield,
    color: 'blue'
  },
  [SSOProvider.GOOGLE_WORKSPACE]: {
    name: 'Google Workspace',
    description: 'Google Workspace (G Suite)',
    icon: Shield,
    color: 'red'
  }
}

export const SSOConfiguration: React.FC = () => {
  const { currentOrganization, ssoConfigurations, setSSOConfigurations } = useEnterpriseStore()
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null)
  const [formData, setFormData] = useState<SSOConfigFormData>({
    provider: SSOProvider.SAML,
    enabled: true,
    autoProvisionUsers: true,
    syncUserAttributes: true,
    attributeMapping: {}
  })
  const [showSecret, setShowSecret] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      const configs = ssoService.getOrganizationConfigurations(currentOrganization.id)
      setSSOConfigurations(configs)
    }
  }, [currentOrganization])

  const handleProviderSelect = (provider: SSOProvider) => {
    setSelectedProvider(provider)
    setFormData({
      ...formData,
      provider,
      redirectUri: `${window.location.origin}/auth/sso/callback`
    })
    setTestResult(null)
  }

  const handleInputChange = (field: keyof SSOConfigFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleAttributeMappingChange = (field: keyof SSOConfigFormData['attributeMapping'], value: string) => {
    setFormData({
      ...formData,
      attributeMapping: {
        ...formData.attributeMapping,
        [field]: value
      }
    })
  }

  const handleScopeChange = (scope: string, checked: boolean) => {
    const currentScopes = formData.scope || []
    if (checked) {
      setFormData({ ...formData, scope: [...currentScopes, scope] })
    } else {
      setFormData({ ...formData, scope: currentScopes.filter(s => s !== scope) })
    }
  }

  const handleDomainChange = (index: number, value: string) => {
    const domains = [...(formData.allowedDomains || [])]
    domains[index] = value
    setFormData({ ...formData, allowedDomains: domains })
  }

  const addDomain = () => {
    setFormData({ ...formData, allowedDomains: [...(formData.allowedDomains || []), ''] })
  }

  const removeDomain = (index: number) => {
    const domains = [...(formData.allowedDomains || [])]
    domains.splice(index, 1)
    setFormData({ ...formData, allowedDomains: domains })
  }

  const handleMetadataUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setFormData({ ...formData, metadataXml: content })
        // Try to parse metadata and extract values
        parseMetadata(content)
      }
      reader.readAsText(file)
    }
  }

  const parseMetadata = (xml: string) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')
      
      // Extract entityID
      const entityDescriptor = doc.querySelector('EntityDescriptor')
      if (entityDescriptor) {
        const entityId = entityDescriptor.getAttribute('entityID')
        if (entityId) {
          setFormData(prev => ({ ...prev, entityId }))
        }
      }

      // Extract SSO URL
      const ssoService = doc.querySelector('SingleSignOnService')
      if (ssoService) {
        const ssoUrl = ssoService.getAttribute('Location')
        if (ssoUrl) {
          setFormData(prev => ({ ...prev, ssoUrl }))
        }
      }

      // Extract certificate
      const cert = doc.querySelector('X509Certificate')
      if (cert?.textContent) {
        setFormData(prev => ({ ...prev, certificate: cert.textContent!.trim() }))
      }
    } catch (error) {
      console.error('Failed to parse metadata:', error)
    }
  }

  const testConnection = async () => {
    if (!currentOrganization) return

    setTesting(true)
    setTestResult(null)

    try {
      // Create temporary configuration for testing
      const config = buildConfiguration()
      const tempConfig = await ssoService.createConfiguration(config)
      
      // Test the configuration
      const result = await ssoService.testConnection(tempConfig.id)
      setTestResult(result)

      // Clean up temporary configuration
      await ssoService.deleteConfiguration(tempConfig.id)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      })
    } finally {
      setTesting(false)
    }
  }

  const buildConfiguration = (): Omit<SSOConfigurationData, 'id' | 'createdAt' | 'updatedAt'> => {
    if (!currentOrganization) throw new Error('No organization selected')

    const baseConfig = {
      organizationId: currentOrganization.id,
      provider: formData.provider,
      enabled: formData.enabled,
      userAttributeMapping: formData.attributeMapping,
      defaultRole: formData.defaultRole,
      allowedDomains: formData.allowedDomains?.filter(d => d.trim() !== ''),
      autoProvisionUsers: formData.autoProvisionUsers,
      syncUserAttributes: formData.syncUserAttributes
    }

    if (isSAMLProvider(formData.provider)) {
      const samlConfig: SAMLConfig = {
        metadataUrl: formData.metadataUrl,
        metadataXml: formData.metadataXml,
        entityId: formData.entityId || '',
        ssoUrl: formData.ssoUrl || '',
        certificate: formData.certificate || '',
        signatureAlgorithm: formData.signatureAlgorithm,
        attributeMapping: formData.attributeMapping
      }
      return { ...baseConfig, config: samlConfig }
    } else {
      const oauthConfig: OAuthConfig = {
        clientId: formData.clientId || '',
        clientSecret: formData.clientSecret,
        authorizationUrl: formData.authorizationUrl || '',
        tokenUrl: formData.tokenUrl || '',
        userInfoUrl: formData.userInfoUrl,
        scope: formData.scope || getDefaultScopes(formData.provider),
        redirectUri: formData.redirectUri || ''
      }
      return { ...baseConfig, config: oauthConfig }
    }
  }

  const saveConfiguration = async () => {
    if (!currentOrganization) return

    setSaving(true)
    try {
      const config = buildConfiguration()
      const newConfig = await ssoService.createConfiguration(config)
      
      // Update store
      setSSOConfigurations([...ssoConfigurations, newConfig])
      
      // Reset form
      setSelectedProvider(null)
      setFormData({
        provider: SSOProvider.SAML,
        enabled: true,
        autoProvisionUsers: true,
        syncUserAttributes: true,
        attributeMapping: {}
      })
      setTestResult(null)
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteConfiguration = async (configId: string) => {
    if (confirm('Are you sure you want to delete this SSO configuration?')) {
      try {
        await ssoService.deleteConfiguration(configId)
        setSSOConfigurations(ssoConfigurations.filter(c => c.id !== configId))
      } catch (error) {
        console.error('Failed to delete configuration:', error)
      }
    }
  }

  const isSAMLProvider = (provider: SSOProvider) => {
    return provider === SSOProvider.SAML
  }

  const getDefaultScopes = (provider: SSOProvider): string[] => {
    switch (provider) {
      case SSOProvider.OKTA:
        return ['openid', 'profile', 'email']
      case SSOProvider.AUTH0:
        return ['openid', 'profile', 'email']
      case SSOProvider.AZURE_AD:
        return ['openid', 'profile', 'email', 'User.Read']
      case SSOProvider.GOOGLE_WORKSPACE:
        return ['openid', 'profile', 'email']
      default:
        return ['openid', 'profile', 'email']
    }
  }

  const getProviderSpecificFields = () => {
    switch (formData.provider) {
      case SSOProvider.OKTA:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Okta Domain
              </label>
              <input
                type="text"
                placeholder="your-domain.okta.com"
                value={formData.authorizationUrl?.split('/')[2] || ''}
                onChange={(e) => {
                  const domain = e.target.value
                  handleInputChange('authorizationUrl', `https://${domain}/oauth2/v1/authorize`)
                  handleInputChange('tokenUrl', `https://${domain}/oauth2/v1/token`)
                  handleInputChange('userInfoUrl', `https://${domain}/oauth2/v1/userinfo`)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )
      case SSOProvider.AZURE_AD:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant ID
              </label>
              <input
                type="text"
                placeholder="your-tenant-id"
                value={formData.authorizationUrl?.match(/\/([a-f0-9-]+)\/oauth2/)?.[1] || ''}
                onChange={(e) => {
                  const tenantId = e.target.value
                  handleInputChange('authorizationUrl', `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`)
                  handleInputChange('tokenUrl', `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to configure SSO.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Single Sign-On Configuration</h1>
        <p className="text-gray-600 mt-1">
          Configure SSO providers for {currentOrganization.name}
        </p>
      </div>

      {/* Existing Configurations */}
      {ssoConfigurations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Configured Providers</h2>
          <div className="space-y-4">
            {ssoConfigurations.map((config) => {
              const info = providerInfo[config.provider]
              const Icon = info.icon
              
              return (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 bg-${info.color}-50 rounded-lg`}>
                        <Icon className={`w-6 h-6 text-${info.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{info.name}</h3>
                        <p className="text-sm text-gray-600">
                          {config.enabled ? 'Enabled' : 'Disabled'} •
                          {config.allowedDomains?.length
                            ? ` Domains: ${config.allowedDomains.join(', ')}`
                            : ' All domains'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Initiate SSO for testing
                          ssoService.initiateSSO(config.id).then(url => {
                            window.open(url, '_blank', 'width=500,height=600')
                          })
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteConfiguration(config.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Provider Selection */}
      {!selectedProvider ? (
        <div>
          <h2 className="text-lg font-semibold mb-4">Add SSO Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(providerInfo).map(([provider, info]) => {
              const Icon = info.icon
              return (
                <motion.button
                  key={provider}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProviderSelect(provider as SSOProvider)}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-${info.color}-50 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${info.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{info.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${providerInfo[selectedProvider].color}-50 rounded-lg`}>
                <Shield className={`w-6 h-6 text-${providerInfo[selectedProvider].color}-600`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Configure {providerInfo[selectedProvider].name}
                </h2>
                <p className="text-sm text-gray-600">
                  {providerInfo[selectedProvider].description}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedProvider(null)
                setTestResult(null)
              }}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Form */}
          <div className="space-y-6">
            {/* SAML Configuration */}
            {isSAMLProvider(formData.provider) ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SAML Metadata
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="https://idp.example.com/metadata"
                      value={formData.metadataUrl || ''}
                      onChange={(e) => handleInputChange('metadataUrl', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload XML
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleMetadataUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter metadata URL or upload metadata XML file
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity ID
                    </label>
                    <input
                      type="text"
                      value={formData.entityId || ''}
                      onChange={(e) => handleInputChange('entityId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SSO URL
                    </label>
                    <input
                      type="text"
                      value={formData.ssoUrl || ''}
                      onChange={(e) => handleInputChange('ssoUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X.509 Certificate
                  </label>
                  <textarea
                    value={formData.certificate || ''}
                    onChange={(e) => handleInputChange('certificate', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature Algorithm
                  </label>
                  <select
                    value={formData.signatureAlgorithm || 'sha256'}
                    onChange={(e) => handleInputChange('signatureAlgorithm', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sha1">SHA-1</option>
                    <option value="sha256">SHA-256 (Recommended)</option>
                    <option value="sha512">SHA-512</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* OAuth Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.clientId || ''}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={formData.clientSecret || ''}
                        onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2 top-2 p-1 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Provider-specific fields */}
                {getProviderSpecificFields()}

                {/* Generic OAuth fields if not using specific provider */}
                {[SSOProvider.OAUTH2, SSOProvider.OIDC].includes(formData.provider) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Authorization URL
                      </label>
                      <input
                        type="text"
                        value={formData.authorizationUrl || ''}
                        onChange={(e) => handleInputChange('authorizationUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Token URL
                      </label>
                      <input
                        type="text"
                        value={formData.tokenUrl || ''}
                        onChange={(e) => handleInputChange('tokenUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User Info URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.userInfoUrl || ''}
                        onChange={(e) => handleInputChange('userInfoUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scopes
                  </label>
                  <div className="space-y-2">
                    {['openid', 'profile', 'email', 'offline_access'].map((scope) => (
                      <label key={scope} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.scope?.includes(scope) || false}
                          onChange={(e) => handleScopeChange(scope, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{scope}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the scopes to request from the identity provider
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Redirect URI
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.redirectUri || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formData.redirectUri || '')
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add this URL to your identity provider's allowed redirect URIs
                  </p>
                </div>
              </div>
            )}

            {/* Common Configuration */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">User Management</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.autoProvisionUsers}
                      onChange={(e) => handleInputChange('autoProvisionUsers', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Auto-provision new users</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Automatically create user accounts on first login
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.syncUserAttributes}
                      onChange={(e) => handleInputChange('syncUserAttributes', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Sync user attributes</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Keep user profile in sync with identity provider
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Role
                  </label>
                  <select
                    value={formData.defaultRole || 'viewer'}
                    onChange={(e) => handleInputChange('defaultRole', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allowed Domains
                  </label>
                  <div className="space-y-2">
                    {(formData.allowedDomains || []).map((domain, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => handleDomainChange(index, e.target.value)}
                          placeholder="example.com"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeDomain(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addDomain}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add domain
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to allow all domains
                  </p>
                </div>
              </div>
            </div>

            {/* Attribute Mapping */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Attribute Mapping</h3>
              <p className="text-sm text-gray-600 mb-4">
                Map identity provider attributes to user profile fields
              </p>
              
              <div className="space-y-4">
                {Object.entries({
                  email: 'Email Address',
                  firstName: 'First Name',
                  lastName: 'Last Name',
                  displayName: 'Display Name',
                  department: 'Department',
                  role: 'Role'
                }).map(([field, label]) => (
                  <div key={field} className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={formData.attributeMapping[field as keyof typeof formData.attributeMapping] || ''}
                      onChange={(e) => handleAttributeMappingChange(field as any, e.target.value)}
                      placeholder={field}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      testResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {testResult.message}
                    </p>
                    {testResult.details && (
                      <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={() => {
                  setSelectedProvider(null)
                  setTestResult(null)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={testConnection}
                  disabled={testing}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {testing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  Test Connection
                </button>
                <button
                  onClick={saveConfiguration}
                  disabled={saving || !testResult?.success}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}