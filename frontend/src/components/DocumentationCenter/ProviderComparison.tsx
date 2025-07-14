import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer
} from 'recharts'
import { Check, X, AlertCircle, DollarSign, Zap, Shield, Cloud, Database, Users } from 'lucide-react'

const ProviderComparison: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'performance' | 'features'>('features')

  const costData = [
    { name: 'Local', development: 0, small: 0, medium: 0, large: 0 },
    { name: 'Firebase', development: 0, small: 25, medium: 150, large: 500 },
    { name: 'AWS', development: 0, small: 50, medium: 300, large: 1200 }
  ]

  const performanceData = [
    { metric: 'Setup Time', Local: 95, Firebase: 85, AWS: 60 },
    { metric: 'Scalability', Local: 20, Firebase: 75, AWS: 95 },
    { metric: 'Performance', Local: 90, Firebase: 80, AWS: 90 },
    { metric: 'Reliability', Local: 60, Firebase: 85, AWS: 95 },
    { metric: 'Flexibility', Local: 70, Firebase: 70, AWS: 95 },
    { metric: 'Ease of Use', Local: 95, Firebase: 90, AWS: 70 }
  ]

  const features = {
    Local: {
      pros: [
        'Zero configuration required',
        'No cloud costs',
        'Complete data ownership',
        'Works offline',
        'Fastest development cycle'
      ],
      cons: [
        'No built-in scalability',
        'Manual backup required',
        'No collaboration features',
        'Limited to local machine'
      ],
      bestFor: 'Prototyping, learning, small personal projects'
    },
    Firebase: {
      pros: [
        'Real-time synchronization',
        'Built-in authentication',
        'Automatic scaling',
        'Global CDN included',
        'Generous free tier'
      ],
      cons: [
        'Vendor lock-in',
        'Limited query capabilities',
        'Can get expensive at scale',
        'Less flexibility'
      ],
      bestFor: 'Startups, MVPs, real-time applications'
    },
    AWS: {
      pros: [
        'Unlimited scalability',
        'Complete control',
        'Enterprise features',
        'Global infrastructure',
        'Cost optimization options'
      ],
      cons: [
        'Steep learning curve',
        'Complex pricing',
        'Requires DevOps knowledge',
        'Initial setup time'
      ],
      bestFor: 'Enterprise applications, high-scale products'
    }
  }

  const featureMatrix = [
    { feature: 'Authentication', Local: 'basic', Firebase: 'full', AWS: 'full' },
    { feature: 'Database', Local: 'file', Firebase: 'nosql', AWS: 'any' },
    { feature: 'File Storage', Local: 'local', Firebase: 'cloud', AWS: 'cloud' },
    { feature: 'Functions', Local: 'node', Firebase: 'serverless', AWS: 'serverless' },
    { feature: 'Real-time', Local: 'websocket', Firebase: 'built-in', AWS: 'custom' },
    { feature: 'Monitoring', Local: 'basic', Firebase: 'included', AWS: 'comprehensive' },
    { feature: 'Backup', Local: 'manual', Firebase: 'automatic', AWS: 'configurable' },
    { feature: 'Global Deploy', Local: false, Firebase: true, AWS: true }
  ]

  const renderFeatureValue = (value: any) => {
    if (value === true) return <Check className="w-5 h-5 text-green-500" />
    if (value === false) return <X className="w-5 h-5 text-red-500" />
    if (value === 'full') return <span className="text-green-400">Full</span>
    if (value === 'basic') return <span className="text-yellow-400">Basic</span>
    return <span className="text-gray-400">{value}</span>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Provider Comparison</h1>
        <p className="text-xl text-gray-400 mb-8">
          Choose the right backend provider for your project based on your needs and scale.
        </p>
      </div>

      {/* Metric Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setSelectedMetric('features')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            selectedMetric === 'features' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Features
        </button>
        <button
          onClick={() => setSelectedMetric('cost')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            selectedMetric === 'cost' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Cost Analysis
        </button>
        <button
          onClick={() => setSelectedMetric('performance')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            selectedMetric === 'performance' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Performance
        </button>
      </div>

      {/* Features Comparison */}
      {selectedMetric === 'features' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Feature Matrix */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Database className="w-5 h-5" />
                      Local
                    </div>
                  </th>
                  <th className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      Firebase
                    </div>
                  </th>
                  <th className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Cloud className="w-5 h-5 text-yellow-500" />
                      AWS
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-700/50">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-center">{renderFeatureValue(row.Local)}</td>
                    <td className="py-3 px-4 text-center">{renderFeatureValue(row.Firebase)}</td>
                    <td className="py-3 px-4 text-center">{renderFeatureValue(row.AWS)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pros and Cons */}
          <div className="grid lg:grid-cols-3 gap-6">
            {Object.entries(features).map(([provider, info]) => (
              <div key={provider} className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4">{provider}</h3>
                
                <div className="mb-6">
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Pros
                  </h4>
                  <ul className="space-y-2">
                    {info.pros.map((pro) => (
                      <li key={pro} className="text-gray-300 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Cons
                  </h4>
                  <ul className="space-y-2">
                    {info.cons.map((con) => (
                      <li key={con} className="text-gray-300 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Best For
                  </h4>
                  <p className="text-gray-400">{info.bestFor}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cost Analysis */}
      {selectedMetric === 'cost' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Estimated Monthly Costs by Project Size
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="development" fill="#10B981" name="Development" />
                <Bar dataKey="small" fill="#3B82F6" name="Small (1K users)" />
                <Bar dataKey="medium" fill="#8B5CF6" name="Medium (10K users)" />
                <Bar dataKey="large" fill="#EF4444" name="Large (100K users)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-3">Local Provider</h4>
              <p className="text-3xl font-bold text-green-500 mb-2">$0/month</p>
              <p className="text-gray-400">No cloud costs, runs on your machine</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-3">Firebase (10K users)</h4>
              <p className="text-3xl font-bold text-blue-500 mb-2">~$150/month</p>
              <p className="text-gray-400">Predictable pricing, generous free tier</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-3">AWS (10K users)</h4>
              <p className="text-3xl font-bold text-purple-500 mb-2">~$300/month</p>
              <p className="text-gray-400">Pay for what you use, optimize for cost</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Comparison */}
      {selectedMetric === 'performance' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Performance & Capability Scores
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
              <Radar name="Local" dataKey="Local" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              <Radar name="Firebase" dataKey="Firebase" stroke="#F97316" fill="#F97316" fillOpacity={0.3} />
              <Radar name="AWS" dataKey="AWS" stroke="#EAB308" fill="#EAB308" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Performance Notes</h4>
              <p className="text-gray-400">
                <strong className="text-gray-300">Local:</strong> Fastest for development but limited by your machine
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-300">Firebase:</strong> Good performance with automatic global distribution
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-300">AWS:</strong> Best performance at scale with fine-grained control
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Scalability</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-300">Local: 1-10 users</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-300">Firebase: 1-100K users</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-300">AWS: 1-10M+ users</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ProviderComparison