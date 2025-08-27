import { motion } from 'framer-motion'
import { ConstructLevel, ConstructType } from '../../constructs/types'
import { WizardData } from './ConstructCreationWizard'
import { FiInfo, FiCode, FiLayers, FiPackage, FiCpu } from 'react-icons/fi'

interface BasicInfoStepProps {
  data: WizardData
  errors: Record<string, string>
  onUpdate: (updates: Partial<WizardData>) => void
}

const levelInfo = {
  [ConstructLevel.L0]: {
    icon: <FiCpu className="w-5 h-5" />,
    title: 'L0 - Primitive',
    description: 'Basic building blocks that directly map to cloud resources',
    color: 'from-blue-500 to-blue-600'
  },
  [ConstructLevel.L1]: {
    icon: <FiCode className="w-5 h-5" />,
    title: 'L1 - Configured',
    description: 'Foundation constructs with sensible defaults',
    color: 'from-green-500 to-green-600'
  },
  [ConstructLevel.L2]: {
    icon: <FiLayers className="w-5 h-5" />,
    title: 'L2 - Pattern',
    description: 'Common solutions and architectural patterns',
    color: 'from-purple-500 to-purple-600'
  },
  [ConstructLevel.L3]: {
    icon: <FiPackage className="w-5 h-5" />,
    title: 'L3 - Application',
    description: 'Complete, production-ready applications',
    color: 'from-orange-500 to-orange-600'
  }
}

const typeInfo = {
  [ConstructType.UI]: {
    title: 'UI Component',
    description: 'Visual components and interface elements',
    categories: ['Button', 'Form', 'Layout', 'Navigation', 'Display', 'Feedback']
  },
  [ConstructType.Infrastructure]: {
    title: 'Infrastructure',
    description: 'Backend services and cloud resources',
    categories: ['Database', 'Storage', 'Compute', 'Network', 'Security', 'Monitoring']
  },
  [ConstructType.Pattern]: {
    title: 'Pattern',
    description: 'Reusable architectural patterns',
    categories: ['Authentication', 'API', 'State Management', 'Data Flow', 'Integration']
  },
  [ConstructType.Application]: {
    title: 'Application',
    description: 'Complete application solutions',
    categories: ['Web App', 'Mobile App', 'API Service', 'Dashboard', 'Tool']
  }
}

const iconOptions = ['🔧', '🎨', '🚀', '⚡', '🔥', '💎', '🌟', '🛠️', '📦', '🏗️', '🔌', '🎯', '🔮', '🌈', '🧩', '🎪']

export function BasicInfoStep({ data, errors, onUpdate }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Name and Icon */}
      <div className="grid grid-cols-[1fr,auto] gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Construct Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., CloudStorageUploader, AuthenticationFlow"
            className={`w-full px-3 py-2 bg-background/50 border rounded-lg focus:outline-none focus:border-primary/50 transition-all ${
              errors.name ? 'border-red-500' : 'border-border/50'
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Icon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {iconOptions.map((icon) => (
              <motion.button
                key={icon}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUpdate({ icon })}
                className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center text-lg ${
                  data.icon === icon
                    ? 'border-primary bg-primary/20'
                    : 'border-border/50 hover:border-primary/50'
                }`}
              >
                {icon}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe what this construct does and when to use it..."
          rows={3}
          className={`w-full px-3 py-2 bg-background/50 border rounded-lg focus:outline-none focus:border-primary/50 transition-all resize-none ${
            errors.description ? 'border-red-500' : 'border-border/50'
          }`}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>
      
      {/* Level Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Construct Level
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(levelInfo).map(([level, info]) => (
            <motion.button
              key={level}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate({ level: level as ConstructLevel })}
              className={`p-4 rounded-lg border transition-all ${
                data.level === level
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-white mb-3`}>
                {info.icon}
              </div>
              <h3 className="font-medium text-left">{info.title}</h3>
              <p className="text-xs text-muted-foreground text-left mt-1">
                {info.description}
              </p>
            </motion.button>
          ))}
        </div>
        {errors.level && (
          <p className="text-red-500 text-sm mt-1">{errors.level}</p>
        )}
      </div>
      
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Construct Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(typeInfo).map(([type, info]) => (
            <motion.button
              key={type}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate({ type: type as ConstructType, category: '' })}
              className={`p-4 rounded-lg border transition-all text-left ${
                data.type === type
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <h3 className="font-medium">{info.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {info.description}
              </p>
            </motion.button>
          ))}
        </div>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type}</p>
        )}
      </div>
      
      {/* Category Selection */}
      {data.type && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <label className="block text-sm font-medium mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {typeInfo[data.type].categories.map((category) => (
              <motion.button
                key={category}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUpdate({ category })}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  data.category === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/50 hover:bg-accent'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </motion.div>
      )}
      
      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Version
          </label>
          <input
            type="text"
            value={data.version}
            onChange={(e) => onUpdate({ version: e.target.value })}
            placeholder="1.0.0"
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Author
          </label>
          <input
            type="text"
            value={data.author}
            onChange={(e) => onUpdate({ author: e.target.value })}
            placeholder="Your name or username"
            className={`w-full px-3 py-2 bg-background/50 border rounded-lg focus:outline-none focus:border-primary/50 transition-all ${
              errors.author ? 'border-red-500' : 'border-border/50'
            }`}
          />
          {errors.author && (
            <p className="text-red-500 text-sm mt-1">{errors.author}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            License
          </label>
          <select
            value={data.license}
            onChange={(e) => onUpdate({ license: e.target.value })}
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="MIT">MIT</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="BSD-3-Clause">BSD 3-Clause</option>
            <option value="ISC">ISC</option>
            <option value="Proprietary">Proprietary</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Repository (optional)
          </label>
          <input
            type="text"
            value={data.repository || ''}
            onChange={(e) => onUpdate({ repository: e.target.value })}
            placeholder="https://github.com/..."
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>
      
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              <strong>Pro tip:</strong> Choose a descriptive name that clearly indicates what your construct does.
              The level and type will help users find your construct in the catalog.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}