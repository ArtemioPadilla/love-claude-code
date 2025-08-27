import React from 'react'
import { motion } from 'framer-motion'
import { Store, Upload, Download, Star, Shield, Search, Tag, Users, TrendingUp } from 'lucide-react'

const MarketplaceGuide: React.FC = () => {
  const marketplaceFeatures = [
    {
      icon: <Search className="w-5 h-5" />,
      title: 'Discover Constructs',
      description: 'Browse thousands of community-created constructs with advanced search and filtering'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Verified Publishers',
      description: 'Trust constructs from verified developers and official Love Claude Code team'
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: 'Ratings & Reviews',
      description: 'Make informed decisions with community ratings and detailed reviews'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Usage Analytics',
      description: 'See download counts, trending constructs, and usage statistics'
    }
  ]

  const publishingSteps = [
    {
      step: 1,
      title: 'Prepare Your Construct',
      tasks: [
        'Complete all tests with 80%+ coverage',
        'Write comprehensive documentation',
        'Add usage examples',
        'Set proper semantic version'
      ]
    },
    {
      step: 2,
      title: 'Create Publisher Profile',
      tasks: [
        'Verify your email address',
        'Set up publisher name and bio',
        'Link GitHub account (optional)',
        'Choose publisher badge tier'
      ]
    },
    {
      step: 3,
      title: 'Submit for Review',
      tasks: [
        'Run automated validation',
        'Fix any security issues',
        'Submit to review queue',
        'Respond to reviewer feedback'
      ]
    },
    {
      step: 4,
      title: 'Publish & Maintain',
      tasks: [
        'Set visibility and licensing',
        'Configure pricing (if premium)',
        'Monitor usage and issues',
        'Release updates regularly'
      ]
    }
  ]

  const qualityGuidelines = [
    {
      category: 'Code Quality',
      requirements: [
        'Clean, readable code following style guide',
        'Comprehensive error handling',
        'No security vulnerabilities',
        'Optimized performance'
      ]
    },
    {
      category: 'Documentation',
      requirements: [
        'Clear README with examples',
        'API documentation for all public methods',
        'Installation and setup guide',
        'Troubleshooting section'
      ]
    },
    {
      category: 'Testing',
      requirements: [
        'Unit tests with 80%+ coverage',
        'Integration tests for key scenarios',
        'Example code that actually works',
        'Performance benchmarks'
      ]
    },
    {
      category: 'Metadata',
      requirements: [
        'Accurate description and tags',
        'Proper categorization',
        'Clear dependencies list',
        'Semantic versioning'
      ]
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
          <Store className="w-10 h-10 text-orange-500" />
          Construct Marketplace Guide
        </h1>
        <p className="text-xl text-gray-400">
          Share your constructs with the world and discover amazing community creations
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">The Power of Community</h2>
        <p className="text-gray-300 mb-4">
          The Construct Marketplace is the heart of the Love Claude Code ecosystem. It's where developers 
          share their creations, discover solutions, and collaborate to build better software together. 
          Whether you're looking for a specific construct or want to share your own, the marketplace 
          makes it easy.
        </p>
        <p className="text-gray-300">
          Every construct in the marketplace goes through quality checks to ensure reliability, security, 
          and maintainability. This means you can confidently use community constructs in your projects.
        </p>
      </motion.div>

      {/* Marketplace Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Marketplace Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {marketplaceFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-lg p-6 flex gap-4"
            >
              <div className="flex-shrink-0 p-3 bg-orange-500/10 rounded-lg text-orange-400">
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

      {/* Finding Constructs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Finding the Right Construct</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Search Strategies</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-blue-400">By Functionality</h4>
                <p className="text-sm text-gray-300">Search for what you need: "authentication", "data visualization", "api client"</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-green-400">By Level</h4>
                <p className="text-sm text-gray-300">Filter by construct level: L0 for primitives, L1 for components, etc.</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-purple-400">By Technology</h4>
                <p className="text-sm text-gray-300">Find constructs for specific tech: "react", "aws", "firebase", "graphql"</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-orange-400">By Author</h4>
                <p className="text-sm text-gray-300">Follow trusted publishers and explore their construct collections</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Quality Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-gray-300"><strong>Verified Badge:</strong> Construct has passed security and quality review</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300"><strong>Download Count:</strong> Popular constructs with many users</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300"><strong>Rating:</strong> Community feedback and satisfaction scores</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300"><strong>Trending:</strong> Recently popular or rapidly growing</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Publishing Process */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Publishing Your Constructs</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {publishingSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
              </div>
              <ul className="space-y-2 ml-14">
                {step.tasks.map((task, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quality Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">Quality Guidelines</h2>
        <p className="text-gray-300 mb-6">
          To maintain marketplace quality, all constructs must meet these standards:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {qualityGuidelines.map((guideline) => (
            <div key={guideline.category}>
              <h3 className="font-semibold mb-3 text-orange-400">{guideline.category}</h3>
              <ul className="space-y-2">
                {guideline.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Monetization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-6 border border-orange-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4">Monetization Options</h2>
        <p className="text-gray-300 mb-6">
          The marketplace supports various monetization models for construct creators:
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2 text-green-400">Free & Open Source</h3>
            <p className="text-sm text-gray-300">
              Share freely with the community. Build reputation and contribute to the ecosystem.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-blue-400">Freemium</h3>
            <p className="text-sm text-gray-300">
              Basic version free, advanced features or support require payment.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-purple-400">Premium</h3>
            <p className="text-sm text-gray-300">
              One-time purchase or subscription for specialized, high-value constructs.
            </p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong>Revenue Split:</strong> Creators keep 80% of sales after payment processing fees
          </p>
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Publisher Best Practices</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-blue-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Choose Clear Names</h3>
              <p className="text-gray-400 text-sm">
                Use descriptive names that clearly indicate what your construct does. 
                Avoid generic names like "utils" or "helper".
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-green-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Version Thoughtfully</h3>
              <p className="text-gray-400 text-sm">
                Follow semantic versioning. Document breaking changes clearly. 
                Maintain backward compatibility when possible.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-purple-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Engage with Users</h3>
              <p className="text-gray-400 text-sm">
                Respond to issues and questions promptly. Incorporate feedback. 
                Build a community around your constructs.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Prioritize Security</h3>
              <p className="text-gray-400 text-sm">
                Regularly update dependencies. Fix security issues immediately. 
                Follow security best practices in your code.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-3">
          <a href="#browse-marketplace" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse the Marketplace →
            </h3>
            <p className="text-gray-400 text-sm">Explore popular constructs and find what you need</p>
          </a>
          <a href="#publisher-dashboard" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Become a Publisher →
            </h3>
            <p className="text-gray-400 text-sm">Set up your publisher profile and share your first construct</p>
          </a>
          <a href="#marketplace-api" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Marketplace API →
            </h3>
            <p className="text-gray-400 text-sm">Integrate marketplace features into your applications</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default MarketplaceGuide