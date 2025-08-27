import React from 'react'
import { motion } from 'framer-motion'
import { Package, Layers, Grid3x3, Rocket } from 'lucide-react'
import { ConstructLevel } from '../../constructs/types'

interface ConstructBadgeProps {
  level: string
  phase?: string
  size?: 'small' | 'medium' | 'large'
}

const levelConfig = {
  [ConstructLevel.L0]: {
    icon: Package,
    label: 'L0',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  [ConstructLevel.L1]: {
    icon: Layers,
    label: 'L1',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  [ConstructLevel.L2]: {
    icon: Grid3x3,
    label: 'L2',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  [ConstructLevel.L3]: {
    icon: Rocket,
    label: 'L3',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  }
}

const phaseConfig = {
  specification: { label: 'Spec', color: 'text-blue-400' },
  testing: { label: 'Test', color: 'text-yellow-400' },
  implementation: { label: 'Impl', color: 'text-green-400' },
  certification: { label: 'Cert', color: 'text-purple-400' }
}

export const ConstructBadge: React.FC<ConstructBadgeProps> = ({ 
  level, 
  phase,
  size = 'medium' 
}) => {
  const config = levelConfig[level as ConstructLevel]
  if (!config) return null

  const Icon = config.icon
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  }

  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-2 rounded-full
        ${config.bgColor} ${config.borderColor} border
        ${sizeClasses[size]}
      `}
    >
      <Icon size={iconSizes[size]} className={config.color} />
      <span className={`font-semibold ${config.color}`}>
        {config.label}
      </span>
      {phase && phaseConfig[phase as keyof typeof phaseConfig] && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className={phaseConfig[phase as keyof typeof phaseConfig].color}>
            {phaseConfig[phase as keyof typeof phaseConfig].label}
          </span>
        </>
      )}
    </motion.div>
  )
}