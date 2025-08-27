import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Package, Star, Users, Clock, Shield, DollarSign,
  Code2, Copy, Check, ExternalLink, GitBranch, Download,
  Play, Eye, FileCode, Terminal, Book, AlertTriangle,
  ChevronRight, Zap, Database, Cloud, Lock, Activity,
  TrendingUp, MessageSquare, Heart
} from 'lucide-react'
import { ConstructDisplay, CloudProvider, ConstructLevel } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { DependencyGraph } from './DependencyGraph'
import { dependencyResolver } from '../utils/dependencyResolver'

interface ConstructDetailsProps {
  construct: ConstructDisplay
  onClose: () => void
}

/**
 * Detailed view of a construct
 */
export const ConstructDetails: React.FC<ConstructDetailsProps> = ({
  construct,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'dependencies' | 'deploy' | 'security' | 'community'>('overview')
  const [copied, setCopied] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${getLevelConfig(construct.definition.level).bgColor}`}>
              <Package className={`w-6 h-6 ${getLevelConfig(construct.definition.level).textColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {construct.definition.name}
                <span className={`text-sm px-2 py-1 rounded ${getLevelConfig(construct.definition.level).badgeColor}`}>
                  {construct.definition.level}
                </span>
              </h2>
              <p className="text-sm text-gray-400">v{construct.definition.version} by {construct.definition.author}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex gap-1 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
              { id: 'code', label: 'Code & Examples', icon: <Code2 className="w-4 h-4" /> },
              { id: 'dependencies', label: 'Dependencies', icon: <GitBranch className="w-4 h-4" /> },
              { id: 'deploy', label: 'Deploy', icon: <Play className="w-4 h-4" /> },
              { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
              { id: 'community', label: 'Community', icon: <MessageSquare className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab key="overview" construct={construct} />
            )}
            {activeTab === 'code' && (
              <CodeTab key="code" construct={construct} onCopy={handleCopy} copied={copied} />
            )}
            {activeTab === 'dependencies' && (
              <DependenciesTab key="dependencies" construct={construct} />
            )}
            {activeTab === 'deploy' && (
              <DeployTab key="deploy" construct={construct} />
            )}
            {activeTab === 'security' && (
              <SecurityTab key="security" construct={construct} />
            )}
            {activeTab === 'community' && (
              <CommunityTab key="community" construct={construct} liked={liked} onLike={() => setLiked(!liked)} />
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer Actions */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {construct.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                {construct.rating.toFixed(1)} ({construct.deploymentCount} reviews)
              </span>
            )}
            {construct.lastUpdated && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated {formatDistanceToNow(construct.lastUpdated, { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" />
              Deploy Now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Overview tab content
 */
const OverviewTab: React.FC<{ construct: ConstructDisplay }> = ({ construct }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Description</h3>
        <p className="text-gray-300 leading-relaxed">{construct.definition.description}</p>
      </div>
      
      {/* Key Features */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Key Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(construct.definition.bestPractices || []).map((practice, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <span className="text-gray-300">{practice}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Providers */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Supported Providers</h3>
        <div className="flex gap-4">
          {Array.isArray(construct.definition.providers) ? construct.definition.providers.map(provider => (
            <div key={provider} className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
              <span className="text-2xl">{getProviderIcon(provider)}</span>
              <span className="font-medium">{provider}</span>
            </div>
          )) : (
            <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
              No providers specified
            </div>
          )}
        </div>
      </div>
      
      {/* Cost Estimate */}
      {construct.definition.cost && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Estimate
          </h3>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-4">
              <span className="text-3xl font-bold">${construct.definition.cost?.baseMonthly || 0}</span>
              <span className="text-gray-400">/month base cost</span>
            </div>
            {construct.definition.cost?.usageFactors?.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mb-3">Additional usage-based costs:</p>
                <div className="space-y-2">
                  {construct.definition.cost.usageFactors.map((factor, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-400">{factor.name}</span>
                      <span>${factor.costPerUnit} per {factor.unit}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Categories & Tags */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Categories & Tags</h3>
        <div className="flex flex-wrap gap-2">
          {(construct.definition.categories || []).map(category => (
            <span key={category} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {category}
            </span>
          ))}
          {(construct.definition.tags || []).map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Code tab content
 */
const CodeTab: React.FC<{
  construct: ConstructDisplay
  onCopy: (text: string, id: string) => void
  copied: string | null
}> = ({ construct, onCopy, copied }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Installation */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Installation</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">npm</span>
            <button
              onClick={() => onCopy(`npm install @love-claude-code/${construct.definition.id}`, 'install')}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {copied === 'install' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="text-sm text-gray-300">
            <code>npm install @love-claude-code/{construct.definition.id}</code>
          </pre>
        </div>
      </div>
      
      {/* Examples */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Examples</h3>
        <div className="space-y-4">
          {(construct.definition.examples || []).map((example, index) => (
            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
                <span className="font-medium">{example.title}</span>
                <button
                  onClick={() => onCopy(example.code, `example-${index}`)}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  {copied === `example-${index}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">{example.code}</code>
              </pre>
              {example.description && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400">{example.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* API Reference */}
      <div>
        <h3 className="text-lg font-semibold mb-3">API Reference</h3>
        <div className="space-y-4">
          {/* Inputs */}
          {construct.definition.inputs?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Inputs</h4>
              <div className="space-y-2">
                {(construct.definition.inputs || []).map((input, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <code className="text-blue-400">{input.name}</code>
                    <span className="text-gray-500">({input.type})</span>
                    {input.required && <span className="text-red-400">*</span>}
                    <span className="text-gray-400">- {input.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Outputs */}
          {construct.definition.outputs?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Outputs</h4>
              <div className="space-y-2">
                {(construct.definition.outputs || []).map((output, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <code className="text-green-400">{output.name}</code>
                    <span className="text-gray-500">({output.type})</span>
                    <span className="text-gray-400">- {output.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Deploy tab content
 */
const DeployTab: React.FC<{ construct: ConstructDisplay }> = ({ construct }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
        <div>
          <h4 className="font-medium mb-1">Quick Deploy</h4>
          <p className="text-sm text-gray-300">Deploy this construct with one click using our deployment engine</p>
        </div>
      </div>
      
      {/* Deployment Requirements */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Requirements</h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span>Pulumi CLI installed</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span>Provider credentials configured</span>
          </div>
          {construct.definition.deployment.requiredProviders.map(provider => (
            <div key={provider} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>{provider} provider plugin</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Deployment Steps */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Deployment Steps</h3>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Install the construct', command: `npm install @love-claude-code/${construct.definition.id}` },
            { step: 2, title: 'Create a Pulumi program', command: 'pulumi new typescript' },
            { step: 3, title: 'Import and configure', command: `import { ${construct.definition.name} } from '@love-claude-code/${construct.definition.id}'` },
            { step: 4, title: 'Deploy', command: 'pulumi up' }
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold">
                {item.step}
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{item.title}</h4>
                <pre className="bg-gray-800 rounded p-3 text-sm">
                  <code>{item.command}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Security tab content
 */
const SecurityTab: React.FC<{ construct: ConstructDisplay }> = ({ construct }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {(construct.definition.security || []).map((item, index) => (
        <div key={index} className={`rounded-lg p-4 border ${
          item.severity === 'critical' ? 'bg-red-900/20 border-red-700' :
          item.severity === 'high' ? 'bg-orange-900/20 border-orange-700' :
          item.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-700' :
          'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
              item.severity === 'critical' ? 'text-red-400' :
              item.severity === 'high' ? 'text-orange-400' :
              item.severity === 'medium' ? 'text-yellow-400' :
              'text-gray-400'
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{item.aspect}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  item.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  item.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {item.severity}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-3">{item.description}</p>
              {item.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {item.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

/**
 * Community tab content
 */
const CommunityTab: React.FC<{
  construct: ConstructDisplay
  liked: boolean
  onLike: () => void
}> = ({ construct, liked, onLike }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{construct.deploymentCount || 0}</div>
          <div className="text-sm text-gray-400">Deployments</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{construct.rating?.toFixed(1) || 'N/A'}</div>
          <div className="text-sm text-gray-400">Rating</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">24</div>
          <div className="text-sm text-gray-400">Discussions</div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onLike}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            liked 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          {liked ? 'Liked' : 'Like'}
        </button>
        <button className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
          Share
        </button>
        <button className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
          Report Issue
        </button>
      </div>
      
      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { user: 'john_doe', action: 'deployed', time: '2 hours ago' },
            { user: 'sarah_smith', action: 'rated 5 stars', time: '5 hours ago' },
            { user: 'mike_wilson', action: 'asked a question', time: '1 day ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="flex-1">
                <span className="font-medium">{activity.user}</span>
                <span className="text-gray-400"> {activity.action}</span>
              </div>
              <span className="text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Dependencies tab content
 */
const DependenciesTab: React.FC<{ construct: ConstructDisplay }> = ({ construct }) => {
  const graph = dependencyResolver.resolveDependencies(construct.definition.id)
  
  if (!graph) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 text-gray-400"
      >
        <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No dependency information available</p>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Direct Dependencies */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Direct Dependencies</h3>
        {construct.definition.dependencies && construct.definition.dependencies.length > 0 ? (
          <div className="grid gap-2">
            {construct.definition.dependencies.map((dep, index) => {
              const depId = typeof dep === 'string' ? dep : dep.constructId
              const depConstruct = dependencyResolver.getConstructById(depId)
              
              return (
                <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{depConstruct?.name || depId}</div>
                      <div className="text-sm text-gray-400">{depConstruct?.description}</div>
                    </div>
                  </div>
                  {depConstruct && (
                    <span className={`text-xs px-2 py-1 rounded ${getLevelConfig(depConstruct.level).badgeColor}`}>
                      {depConstruct.level}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-400">No direct dependencies</p>
        )}
      </div>
      
      {/* Dependency Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Dependency Analysis</h3>
        <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{graph.totalDependencies}</div>
            <div className="text-sm text-gray-400">Total Dependencies</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{graph.maxDepth}</div>
            <div className="text-sm text-gray-400">Max Depth</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm font-medium mb-2">Dependencies by Level</div>
            <div className="space-y-1">
              {Object.entries(graph.dependenciesByLevel).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className={`text-sm ${getLevelConfig(level as ConstructLevel).badgeColor} px-2 py-1 rounded`}>
                    {level}
                  </span>
                  <span className="text-sm">{count} constructs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Dependency Graph */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Dependency Graph</h3>
        <div className="bg-gray-800 rounded-lg p-1">
          <DependencyGraph 
            constructId={construct.definition.id}
            height="500px"
          />
        </div>
      </div>
      
      {/* Used By (Dependents) */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Used By</h3>
        {(() => {
          const dependents = dependencyResolver.findDependents(construct.definition.id)
          return dependents.length > 0 ? (
            <div className="grid gap-2">
              {dependents.map((dep, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{dep.name}</div>
                      <div className="text-sm text-gray-400">{dep.description}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getLevelConfig(dep.level).badgeColor}`}>
                    {dep.level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Not used by any other constructs</p>
          )
        })()}
      </div>
    </motion.div>
  )
}

/**
 * Helper functions
 */
function getLevelConfig(level: ConstructLevel) {
  const configs = {
    [ConstructLevel.L0]: {
      bgColor: 'bg-gray-700',
      textColor: 'text-gray-300',
      badgeColor: 'bg-gray-700 text-gray-300'
    },
    [ConstructLevel.L1]: {
      bgColor: 'bg-blue-900/50',
      textColor: 'text-blue-400',
      badgeColor: 'bg-blue-900/50 text-blue-400'
    },
    [ConstructLevel.L2]: {
      bgColor: 'bg-purple-900/50',
      textColor: 'text-purple-400',
      badgeColor: 'bg-purple-900/50 text-purple-400'
    },
    [ConstructLevel.L3]: {
      bgColor: 'bg-green-900/50',
      textColor: 'text-green-400',
      badgeColor: 'bg-green-900/50 text-green-400'
    }
  }
  return configs[level]
}

function getProviderIcon(provider: CloudProvider): string {
  const icons = {
    [CloudProvider.AWS]: '☁️',
    [CloudProvider.FIREBASE]: '🔥',
    [CloudProvider.AZURE]: '⚡',
    [CloudProvider.GCP]: '🌐',
    [CloudProvider.LOCAL]: '💻'
  }
  return icons[provider]
}