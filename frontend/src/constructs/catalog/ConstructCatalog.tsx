import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Grid, List, Package, Cloud, Shield, 
  Zap, Database, Code2, Layers, Star, Clock, Users,
  ChevronRight, X, SlidersHorizontal, TrendingUp,
  GitBranch, Award, Sparkles, Workflow
} from 'lucide-react'
import { 
  ConstructDisplay, 
  ConstructFilters, 
  ConstructLevel, 
  CloudProvider 
} from '../types'
import { ConstructExplorer } from './ConstructExplorer'
import { ConstructDetails } from './ConstructDetails'
import { useConstructStore } from '../../stores/constructStore'
import Footer from '../../components/Layout/Footer'
import NavigationBar from '../../components/Layout/NavigationBar'
import { useNavigate } from '../../components/Navigation'

/**
 * Main construct catalog component
 */
const ConstructCatalog: React.FC = () => {
  const navigate = useNavigate()
  const { 
    constructs, 
    loading, 
    error,
    filters, 
    setFilters, 
    selectedConstruct,
    setSelectedConstruct,
    fetchConstructs 
  } = useConstructStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  
  // Fetch constructs on mount
  useEffect(() => {
    fetchConstructs()
  }, [fetchConstructs])
  
  // Filter and sort constructs
  const filteredConstructs = useMemo(() => {
    let result = [...constructs]
    
    // Apply filters
    if (filters.levels && filters.levels.length > 0) {
      result = result.filter(c => 
        filters.levels!.includes(c.definition.level)
      )
    }
    
    if (filters.providers && filters.providers.length > 0) {
      result = result.filter(c => 
        c.definition.providers.some(p => filters.providers!.includes(p))
      )
    }
    
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(c => 
        c.definition.categories.some(cat => filters.categories!.includes(cat))
      )
    }
    
    if (filters.query) {
      const query = filters.query.toLowerCase()
      result = result.filter(c => 
        c.definition.name.toLowerCase().includes(query) ||
        c.definition.description.toLowerCase().includes(query) ||
        c.definition.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    if (filters.featuredOnly) {
      result = result.filter(c => c.featured)
    }
    
    // Sort
    const sortBy = filters.sortBy || 'name'
    const sortDirection = filters.sortDirection || 'asc'
    
    result.sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'name':
          compareValue = a.definition.name.localeCompare(b.definition.name)
          break
        case 'popularity':
          compareValue = (a.popularity || 0) - (b.popularity || 0)
          break
        case 'rating':
          compareValue = (a.rating || 0) - (b.rating || 0)
          break
        case 'updated':
          compareValue = (a.lastUpdated?.getTime() || 0) - (b.lastUpdated?.getTime() || 0)
          break
        case 'deployments':
          compareValue = (a.deploymentCount || 0) - (b.deploymentCount || 0)
          break
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
    
    return result
  }, [constructs, filters])
  
  const handleConstructSelect = (construct: ConstructDisplay) => {
    setSelectedConstruct(construct)
    setShowDetails(true)
  }
  
  const stats = useMemo(() => ({
    total: constructs.length,
    byLevel: {
      L0: constructs.filter(c => c.definition.level === ConstructLevel.L0).length,
      L1: constructs.filter(c => c.definition.level === ConstructLevel.L1).length,
      L2: constructs.filter(c => c.definition.level === ConstructLevel.L2).length,
      L3: constructs.filter(c => c.definition.level === ConstructLevel.L3).length
    },
    featured: constructs.filter(c => c.featured).length
  }), [constructs])
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm">
        {/* Navigation Bar */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <NavigationBar />
          </div>
        </div>
        
        {/* Construct Catalog Header */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Construct Catalog</h1>
                <p className="text-sm text-gray-400">
                  {stats.total} constructs across all levels
                </p>
              </div>
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('visual-composer')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Workflow className="w-4 h-4" />
                <span className="font-medium">Visual Composer</span>
              </motion.button>
              
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid' 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list' 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-140px)]">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-gray-800 overflow-y-auto"
            >
              <FiltersSidebar 
                filters={filters}
                onFiltersChange={setFilters}
                stats={stats}
              />
            </motion.aside>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-800">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search constructs by name, description, or tags..."
                value={filters.query || ''}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
          </div>
          
          {/* Results Count and Sort */}
          <div className="px-6 py-4 flex items-center justify-between">
            <p className="text-gray-400">
              Showing {filteredConstructs.length} constructs
            </p>
            
            <select
              value={`${filters.sortBy || 'name'}-${filters.sortDirection || 'asc'}`}
              onChange={(e) => {
                const [sortBy, sortDirection] = e.target.value.split('-') as any
                setFilters({ ...filters, sortBy, sortDirection })
              }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="popularity-desc">Most Popular</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="deployments-desc">Most Deployed</option>
            </select>
          </div>
          
          {/* Construct Grid/List */}
          <ConstructExplorer
            constructs={filteredConstructs}
            viewMode={viewMode}
            onSelectConstruct={handleConstructSelect}
            loading={loading}
          />
        </main>
      </div>
      
      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && selectedConstruct && (
          <ConstructDetails
            construct={selectedConstruct}
            onClose={() => setShowDetails(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

/**
 * Filters sidebar component
 */
const FiltersSidebar: React.FC<{
  filters: ConstructFilters
  onFiltersChange: (filters: ConstructFilters) => void
  stats: any
}> = ({ filters, onFiltersChange, stats }) => {
  const levelIcons = {
    [ConstructLevel.L0]: <Code2 className="w-4 h-4" />,
    [ConstructLevel.L1]: <Layers className="w-4 h-4" />,
    [ConstructLevel.L2]: <GitBranch className="w-4 h-4" />,
    [ConstructLevel.L3]: <Package className="w-4 h-4" />
  }
  
  const providerIcons = {
    [CloudProvider.AWS]: '☁️',
    [CloudProvider.FIREBASE]: '🔥',
    [CloudProvider.AZURE]: '⚡',
    [CloudProvider.GCP]: '🌐',
    [CloudProvider.LOCAL]: '💻'
  }
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        
        {/* Featured Toggle */}
        <label className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            checked={filters.featuredOnly || false}
            onChange={(e) => 
              onFiltersChange({ ...filters, featuredOnly: e.target.checked })
            }
            className="w-4 h-4 text-blue-500"
          />
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Featured Only ({stats.featured})
          </span>
        </label>
        
        {/* Construct Levels */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Construct Level</h4>
          <div className="space-y-2">
            {Object.values(ConstructLevel).map(level => (
              <label key={level} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filters.levels?.includes(level) || false}
                  onChange={(e) => {
                    const levels = filters.levels || []
                    if (e.target.checked) {
                      onFiltersChange({ ...filters, levels: [...levels, level] })
                    } else {
                      onFiltersChange({ 
                        ...filters, 
                        levels: levels.filter(l => l !== level) 
                      })
                    }
                  }}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="flex items-center gap-2">
                  {levelIcons[level]}
                  {level} ({stats.byLevel[level]})
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Cloud Providers */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Cloud Provider</h4>
          <div className="space-y-2">
            {Object.values(CloudProvider).map(provider => (
              <label key={provider} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filters.providers?.includes(provider) || false}
                  onChange={(e) => {
                    const providers = filters.providers || []
                    if (e.target.checked) {
                      onFiltersChange({ ...filters, providers: [...providers, provider] })
                    } else {
                      onFiltersChange({ 
                        ...filters, 
                        providers: providers.filter(p => p !== provider) 
                      })
                    }
                  }}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="flex items-center gap-2">
                  <span className="text-lg">{providerIcons[provider]}</span>
                  {provider}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Clear Filters */}
        <button
          onClick={() => onFiltersChange({})}
          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )
}

export default ConstructCatalog