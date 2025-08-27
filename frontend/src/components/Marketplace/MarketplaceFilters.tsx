import React from 'react';
import {
  Filter,
  X,
  Check,
  Shield,
  Package,
  Layers,
  Tag,
  Cloud
} from 'lucide-react';
import { ConstructLevel } from '../../constructs/types';

interface Filters {
  search: string;
  levels: ConstructLevel[];
  categories: string[];
  providers: string[];
  tags: string[];
  certified: boolean | null;
}

interface MarketplaceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableConstructs: any[];
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  onFiltersChange,
  availableConstructs
}) => {
  // Extract unique values from constructs
  const availableCategories = Array.from(
    new Set(availableConstructs.map(c => c.category))
  ).sort();

  const availableProviders = Array.from(
    new Set(availableConstructs.flatMap(c => c.provider))
  ).sort();

  const availableTags = Array.from(
    new Set(availableConstructs.flatMap(c => c.tags))
  ).sort();

  const levels: ConstructLevel[] = [ConstructLevel.L0, ConstructLevel.L1, ConstructLevel.L2, ConstructLevel.L3];

  const toggleLevel = (level: ConstructLevel) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level];
    onFiltersChange({ ...filters, levels: newLevels });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleProvider = (provider: string) => {
    const newProviders = filters.providers.includes(provider)
      ? filters.providers.filter(p => p !== provider)
      : [...filters.providers, provider];
    onFiltersChange({ ...filters, providers: newProviders });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      levels: [],
      categories: [],
      providers: [],
      tags: [],
      certified: null
    });
  };

  const hasActiveFilters =
    filters.levels.length > 0 ||
    filters.categories.length > 0 ||
    filters.providers.length > 0 ||
    filters.tags.length > 0 ||
    filters.certified !== null;

  const levelColors = {
    L0: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    L1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    L2: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    L3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Certification Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Certification
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="certified"
              checked={filters.certified === null}
              onChange={() => onFiltersChange({ ...filters, certified: null })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              All constructs
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="certified"
              checked={filters.certified === true}
              onChange={() => onFiltersChange({ ...filters, certified: true })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Certified only
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="certified"
              checked={filters.certified === false}
              onChange={() => onFiltersChange({ ...filters, certified: false })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Community only
            </span>
          </label>
        </div>
      </div>

      {/* Level Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Construct Level
        </h4>
        <div className="space-y-2">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.levels.includes(level)
                  ? levelColors[level]
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{level}</span>
                {filters.levels.includes(level) && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Category
        </h4>
        <div className="space-y-2">
          {availableCategories.map(category => (
            <label key={category} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Provider Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Provider
        </h4>
        <div className="space-y-2">
          {availableProviders.map(provider => (
            <label key={provider} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.providers.includes(provider)}
                onChange={() => toggleProvider(provider)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {provider}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Popular Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableTags.slice(0, 10).map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filters.tags.includes(tag)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
              {filters.tags.includes(tag) && (
                <X className="inline-block w-3 h-3 ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFilters;