import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { motion } from 'framer-motion'

interface C4NodeProps extends NodeProps {
  data: {
    label: string
    description?: string
    technology?: string
    external?: boolean
    url?: string
  }
  icon?: React.ReactNode
  bgColor?: string
  borderColor?: string
  shape?: 'rectangle' | 'rounded'
}

/**
 * Reusable C4 diagram node component
 */
export const C4Node: React.FC<C4NodeProps> = ({
  data,
  selected,
  icon,
  bgColor = 'bg-gray-800',
  borderColor = 'border-gray-600',
  shape = 'rectangle'
}) => {
  const borderRadius = shape === 'rounded' ? 'rounded-full' : 'rounded-lg'
  const padding = shape === 'rounded' ? 'p-6' : 'p-4'
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${bgColor} ${borderRadius} ${padding} min-w-[200px] border-2 ${
        selected ? 'border-blue-400 shadow-lg' : borderColor
      } transition-all`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-gray-900"
        style={{ visibility: 'hidden' }}
      />
      
      <div className="flex flex-col items-center text-center">
        {icon && (
          <div className="mb-2 text-white">
            {icon}
          </div>
        )}
        
        <h3 className="font-semibold text-white mb-1">
          {data.label}
        </h3>
        
        {data.technology && (
          <p className="text-xs text-gray-400 mb-1">
            [{data.technology}]
          </p>
        )}
        
        {data.description && (
          <p className="text-xs text-gray-300 mt-2">
            {data.description}
          </p>
        )}
        
        {data.external && (
          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full mt-2">
            External
          </span>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-gray-900"
        style={{ visibility: 'hidden' }}
      />
    </motion.div>
  )
}