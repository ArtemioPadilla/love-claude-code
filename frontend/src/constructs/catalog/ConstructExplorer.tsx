import React from 'react'
import { motion } from 'framer-motion'
import { 
  Package, Star, Clock, Users, TrendingUp, 
  Code2, Layers, GitBranch, ChevronRight,
  Shield, Zap, Database, Cloud, DollarSign
} from 'lucide-react'
import { ConstructDisplay, ConstructLevel, CloudProvider } from '../types'
import { dependencyResolver } from '../utils/dependencyResolver'

interface ConstructExplorerProps {
  constructs: ConstructDisplay[]
  viewMode: 'grid' | 'list'
  onSelectConstruct: (construct: ConstructDisplay) => void
  loading?: boolean
}

/**
 * Component for exploring and browsing constructs
 */
export const ConstructExplorer: React.FC<ConstructExplorerProps> = ({
  constructs,
  viewMode,
  onSelectConstruct,
  loading = false
}) => {
  if (loading) {
    return <LoadingState />
  }
  
  if (constructs.length === 0) {
    return <EmptyState />
  }
  
  return viewMode === 'grid' ? (
    <GridView constructs={constructs} onSelectConstruct={onSelectConstruct} />
  ) : (
    <ListView constructs={constructs} onSelectConstruct={onSelectConstruct} />
  )
}

/**
 * Grid view of constructs
 */
const GridView: React.FC<{
  constructs: ConstructDisplay[]
  onSelectConstruct: (construct: ConstructDisplay) => void
}> = ({ constructs, onSelectConstruct }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {constructs.map((construct, index) => (
        <motion.div
          key={construct.definition.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ConstructCard 
            construct={construct} 
            onClick={() => onSelectConstruct(construct)}
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * List view of constructs
 */
const ListView: React.FC<{
  constructs: ConstructDisplay[]
  onSelectConstruct: (construct: ConstructDisplay) => void
}> = ({ constructs, onSelectConstruct }) => {
  return (
    <div className="space-y-2 p-6">
      {constructs.map((construct, index) => (
        <motion.div
          key={construct.definition.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ConstructListItem
            construct={construct}
            onClick={() => onSelectConstruct(construct)}
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Construct card for grid view
 */
const ConstructCard: React.FC<{
  construct: ConstructDisplay
  onClick: () => void
}> = ({ construct, onClick }) => {
  const levelConfig = getLevelConfig(construct.definition.level)
  const Icon = getConstructIcon(construct.definition.categories?.[0])
  
  // Get dependency information
  const graph = dependencyResolver.resolveDependencies(construct.definition.id)
  const dependencyInfo = graph ? {
    total: graph.totalDependencies,
    byLevel: graph.dependenciesByLevel
  } : null
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all cursor-pointer border border-gray-700 hover:border-gray-600"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${levelConfig.bgColor}`}>
          <Icon className={`w-6 h-6 ${levelConfig.textColor}`} />
        </div>
        {construct.featured && (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            Featured
          </span>
        )}
      </div>
      
      {/* Title and Level */}
      <h3 className="text-lg font-semibold mb-1">{construct.definition.name}</h3>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded ${levelConfig.badgeColor}`}>
          {construct.definition.level}
        </span>
        <span className="text-xs text-gray-500">v{construct.definition.version}</span>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {construct.definition.description}
      </p>
      
      {/* Dependencies & Providers */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Providers */}
        <div className="flex items-center gap-2">
          {Array.isArray(construct.definition.providers) && construct.definition.providers.map(provider => (
            <span key={provider} className="text-lg" title={provider}>
              {getProviderIcon(provider)}
            </span>
          ))}
        </div>
        
        {/* Dependency Badge */}
        {dependencyInfo && dependencyInfo.total > 0 && (
          <div className="flex items-center gap-1 text-xs bg-gray-700 px-2 py-1 rounded-full">
            <GitBranch className="w-3 h-3" />
            <span>{dependencyInfo.total}</span>
            {dependencyInfo.byLevel.L0 > 0 && (
              <span className="text-gray-400">• {dependencyInfo.byLevel.L0} L0</span>
            )}
          </div>
        )}
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {construct.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {construct.rating.toFixed(1)}
            </span>
          )}
          {construct.deploymentCount && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatCount(construct.deploymentCount)}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.div>
  )
}

/**
 * Construct list item for list view
 */
const ConstructListItem: React.FC<{
  construct: ConstructDisplay
  onClick: () => void
}> = ({ construct, onClick }) => {
  const levelConfig = getLevelConfig(construct.definition.level)
  const Icon = getConstructIcon(construct.definition.categories?.[0])
  
  // Get dependency information
  const graph = dependencyResolver.resolveDependencies(construct.definition.id)
  const dependencyInfo = graph ? {
    total: graph.totalDependencies,
    byLevel: graph.dependenciesByLevel
  } : null
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all cursor-pointer border border-gray-700 hover:border-gray-600"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg ${levelConfig.bgColor}`}>
          <Icon className={`w-5 h-5 ${levelConfig.textColor}`} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-semibold">{construct.definition.name}</h3>
            <span className={`text-xs px-2 py-1 rounded ${levelConfig.badgeColor}`}>
              {construct.definition.level}
            </span>
            {construct.featured && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-2 line-clamp-1">
            {construct.definition.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              Providers: {Array.isArray(construct.definition.providers) ? construct.definition.providers.map(p => getProviderIcon(p)).join(' ') : 'N/A'}
            </span>
            {construct.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {construct.rating.toFixed(1)}
              </span>
            )}
            {construct.deploymentCount && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatCount(construct.deploymentCount)} deployments
              </span>
            )}
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${construct.definition.cost?.baseMonthly || 0}/mo base
            </span>
            {dependencyInfo && dependencyInfo.total > 0 && (
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {dependencyInfo.total} deps
                {dependencyInfo.byLevel.L0 > 0 && ` (${dependencyInfo.byLevel.L0} L0)`}
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  )
}

/**
 * Loading state
 */
const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading constructs...</p>
      </div>
    </div>
  )
}

/**
 * Empty state
 */
const EmptyState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No constructs found</h3>
        <p className="text-gray-400">Try adjusting your filters or search query</p>
      </div>
    </div>
  )
}

/**
 * Get level configuration
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

/**
 * Get construct icon based on category
 */
function getConstructIcon(category?: string) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'storage': Cloud,
    'database': Database,
    'compute': Zap,
    'security': Shield,
    'api': Code2,
    'pattern': GitBranch,
    'application': Package,
    'default': Layers
  }
  return iconMap[category || 'default'] || iconMap.default
}

/**
 * Get provider icon
 */
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

/**
 * Format count for display
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}