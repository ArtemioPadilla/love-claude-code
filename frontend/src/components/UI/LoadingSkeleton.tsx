import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circle' | 'rect'
  animation?: 'pulse' | 'wave' | 'none'
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1em',
  variant = 'rect',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-800 rounded'
  
  const variantClasses = {
    text: 'rounded',
    circle: 'rounded-full',
    rect: 'rounded-md'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height }}
    />
  )
}

interface FileTreeSkeletonProps {
  itemCount?: number
}

export const FileTreeSkeleton: React.FC<FileTreeSkeletonProps> = ({ itemCount = 5 }) => {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: itemCount }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-2"
          style={{ paddingLeft: Math.random() > 0.5 ? '24px' : '12px' }}
        >
          <LoadingSkeleton width={16} height={16} />
          <LoadingSkeleton width={`${60 + Math.random() * 40}%`} height={16} />
        </motion.div>
      ))}
    </div>
  )
}

interface ProjectCardSkeletonProps {
  itemCount?: number
}

export const ProjectCardSkeleton: React.FC<ProjectCardSkeletonProps> = ({ itemCount = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: itemCount }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-900 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <LoadingSkeleton width={120} height={24} />
            <LoadingSkeleton width={60} height={20} />
          </div>
          <LoadingSkeleton height={60} />
          <div className="flex items-center gap-2">
            <LoadingSkeleton width={80} height={16} />
            <LoadingSkeleton width={100} height={16} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default LoadingSkeleton