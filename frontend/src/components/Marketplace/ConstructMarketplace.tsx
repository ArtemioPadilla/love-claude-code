import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
  Sparkles,
  Clock,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketplaceFilters from './MarketplaceFilters';
import ConstructCard from './ConstructCard';
import PublishModal from './PublishModal';
import { ConstructLevel } from '../../constructs/types';

// Mock data for marketplace constructs
const mockConstructs = [
  {
    id: '1',
    name: 'AI Chat Component',
    description: 'A fully-featured chat component with Claude integration, streaming responses, and markdown support.',
    author: {
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      verified: true
    },
    level: 'L2' as ConstructLevel,
    category: 'UI Components',
    icon: '💬',
    version: '2.1.0',
    lastUpdated: '2 days ago',
    downloads: 15420,
    rating: 4.8,
    ratingCount: 234,
    tags: ['chat', 'ai', 'claude', 'streaming', 'markdown'],
    provider: ['firebase', 'aws'],
    license: 'MIT',
    certified: true,
    trending: true
  },
  {
    id: '2',
    name: 'Serverless API Gateway',
    description: 'Production-ready API gateway with rate limiting, authentication, and monitoring.',
    author: {
      name: 'Alex Rivera',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      verified: true
    },
    level: 'L3' as ConstructLevel,
    category: 'Infrastructure',
    icon: '🌐',
    version: '1.5.2',
    lastUpdated: '1 week ago',
    downloads: 8932,
    rating: 4.9,
    ratingCount: 156,
    tags: ['api', 'serverless', 'gateway', 'auth', 'monitoring'],
    provider: ['aws'],
    license: 'Apache-2.0',
    certified: true,
    featured: true
  },
  {
    id: '3',
    name: 'Code Editor Primitive',
    description: 'Lightweight code editor with syntax highlighting and basic editing features.',
    author: {
      name: 'Jamie Lee',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jamie',
      verified: false
    },
    level: 'L0' as ConstructLevel,
    category: 'UI Primitives',
    icon: '📝',
    version: '3.0.1',
    lastUpdated: '3 days ago',
    downloads: 32100,
    rating: 4.6,
    ratingCount: 412,
    tags: ['editor', 'code', 'syntax', 'primitive'],
    provider: ['local', 'firebase', 'aws'],
    license: 'MIT',
    certified: false
  },
  {
    id: '4',
    name: 'Real-time Collaboration',
    description: 'Add real-time collaboration features to any application with presence, cursors, and conflict resolution.',
    author: {
      name: 'Morgan Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=morgan',
      verified: true
    },
    level: 'L2' as ConstructLevel,
    category: 'Patterns',
    icon: '👥',
    version: '1.2.0',
    lastUpdated: '5 days ago',
    downloads: 6721,
    rating: 4.7,
    ratingCount: 89,
    tags: ['collaboration', 'realtime', 'websocket', 'presence'],
    provider: ['firebase', 'aws'],
    license: 'MIT',
    certified: true,
    new: true
  },
  {
    id: '5',
    name: 'Auth Service Layer',
    description: 'Complete authentication service with JWT, OAuth, and MFA support.',
    author: {
      name: 'Taylor Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taylor',
      verified: true
    },
    level: 'L1' as ConstructLevel,
    category: 'Services',
    icon: '🔐',
    version: '2.0.0',
    lastUpdated: '2 weeks ago',
    downloads: 19234,
    rating: 4.9,
    ratingCount: 267,
    tags: ['auth', 'jwt', 'oauth', 'mfa', 'security'],
    provider: ['firebase', 'aws'],
    license: 'MIT',
    certified: true
  },
  {
    id: '6',
    name: 'Dashboard Layout',
    description: 'Responsive dashboard layout with sidebar, header, and content areas.',
    author: {
      name: 'Casey Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey',
      verified: false
    },
    level: 'L1' as ConstructLevel,
    category: 'UI Components',
    icon: '📊',
    version: '1.8.3',
    lastUpdated: '4 days ago',
    downloads: 11543,
    rating: 4.5,
    ratingCount: 178,
    tags: ['dashboard', 'layout', 'responsive', 'sidebar'],
    provider: ['local', 'firebase', 'aws'],
    license: 'MIT',
    certified: false
  }
];

type SortOption = 'popular' | 'newest' | 'trending' | 'rating';
type ViewMode = 'grid' | 'list';

interface Filters {
  search: string;
  levels: ConstructLevel[];
  categories: string[];
  providers: string[];
  tags: string[];
  certified: boolean | null;
}

const ConstructMarketplace: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    levels: [],
    categories: [],
    providers: [],
    tags: [],
    certified: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const itemsPerPage = 9;

  // Filter and sort constructs
  const filteredConstructs = useMemo(() => {
    let result = [...mockConstructs];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          c.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply level filter
    if (filters.levels.length > 0) {
      result = result.filter(c => filters.levels.includes(c.level));
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(c => filters.categories.includes(c.category));
    }

    // Apply provider filter
    if (filters.providers.length > 0) {
      result = result.filter(c =>
        c.provider.some(p => filters.providers.includes(p))
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      result = result.filter(c =>
        c.tags.some(tag => filters.tags.includes(tag))
      );
    }

    // Apply certified filter
    if (filters.certified !== null) {
      result = result.filter(c => c.certified === filters.certified);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        // In real app, would sort by actual date
        result.sort((a, b) => a.lastUpdated.localeCompare(b.lastUpdated));
        break;
      case 'trending':
        result.sort((a, b) => {
          if (a.trending && !b.trending) return -1;
          if (!a.trending && b.trending) return 1;
          return b.downloads - a.downloads;
        });
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredConstructs.length / itemsPerPage);
  const paginatedConstructs = filteredConstructs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Featured constructs for hero section
  const featuredConstructs = mockConstructs.filter(c => c.featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Construct Marketplace
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Discover, share, and build with reusable constructs
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search constructs by name, description, or tags..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold">1,234</div>
                <div className="text-blue-100">Constructs</div>
              </div>
              <div>
                <div className="text-3xl font-bold">567</div>
                <div className="text-blue-100">Contributors</div>
              </div>
              <div>
                <div className="text-3xl font-bold">89K</div>
                <div className="text-blue-100">Downloads</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {featuredConstructs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Featured Constructs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredConstructs.map(construct => (
              <ConstructCard
                key={construct.id}
                construct={construct}
                viewMode="grid"
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <MarketplaceFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableConstructs={mockConstructs}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="trending">Trending</option>
                  <option value="rating">Highest Rated</option>
                </select>

                {/* Results count */}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredConstructs.length} results
                </span>
              </div>

              {/* Publish Button */}
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publish Construct
              </button>
            </div>

            {/* Construct Grid/List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewMode}-${currentPage}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {paginatedConstructs.map(construct => (
                  <ConstructCard
                    key={construct.id}
                    construct={construct}
                    viewMode={viewMode}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <PublishModal onClose={() => setShowPublishModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConstructMarketplace;