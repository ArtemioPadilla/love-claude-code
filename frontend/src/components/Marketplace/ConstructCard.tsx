import React, { useState } from 'react';
import {
  Star,
  Download,
  Shield,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
  Package,
  Code,
  Users,
  GitBranch,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ConstructLevel } from '../../constructs/types';

interface ConstructCardProps {
  construct: any;
  viewMode: 'grid' | 'list';
  featured?: boolean;
}

const ConstructCard: React.FC<ConstructCardProps> = ({
  construct,
  viewMode,
  featured = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const levelColors: Record<string, string> = {
    L0: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    L1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    L2: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    L3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  };

  const formatDownloads = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-4xl flex-shrink-0">{construct.icon}</div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {construct.name}
                  {construct.certified && (
                    <Shield className="w-4 h-4 text-blue-600" />
                  )}
                  {construct.trending && (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                  {construct.new && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      NEW
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {construct.description}
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${levelColors[construct.level]}`}>
                {construct.level}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <img
                  src={construct.author.avatar}
                  alt={construct.author.name}
                  className="w-5 h-5 rounded-full"
                />
                <span>{construct.author.name}</span>
                {construct.author.verified && (
                  <Shield className="w-3 h-3 text-blue-600" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{construct.rating}</span>
                <span className="text-gray-500">({construct.ratingCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>{formatDownloads(construct.downloads)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{construct.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span>v{construct.version}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {construct.tags.slice(0, 5).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {construct.tags.length > 5 && (
                <span className="px-2 py-1 text-xs text-gray-500">+{construct.tags.length - 5} more</span>
              )}
            </div>
          </div>

          {/* Action */}
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
        featured ? 'border-2 border-blue-500' : ''
      }`}
      onClick={() => setShowDetails(true)}
    >
      {featured && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-xs font-medium flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          Featured Construct
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{construct.icon}</div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${levelColors[construct.level]}`}>
            {construct.level}
          </span>
        </div>

        {/* Title and Description */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          {construct.name}
          {construct.certified && (
            <Shield className="w-4 h-4 text-blue-600" />
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {construct.description}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <img
            src={construct.author.avatar}
            alt={construct.author.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {construct.author.name}
          </span>
          {construct.author.verified && (
            <Shield className="w-3 h-3 text-blue-600" />
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span>{construct.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{formatDownloads(construct.downloads)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{construct.lastUpdated}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {construct.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {construct.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">+{construct.tags.length - 3}</span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-4">
          {construct.trending && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
          {construct.new && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              NEW
            </span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="px-6 pb-4 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Install
        </button>
        <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ConstructCard;