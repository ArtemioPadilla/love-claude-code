import React, { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronRight } from 'react-icons/fi'

interface CollapsiblePanelProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  onToggle?: (isOpen: boolean) => void
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultOpen = true,
  icon,
  className = '',
  headerClassName = '',
  contentClassName = '',
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div className={`collapsible-panel ${className}`}>
      <button
        onClick={handleToggle}
        className={`collapsible-header ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={`panel-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <FiChevronRight size={16} />
          </motion.div>
          {icon && <div className="text-gray-500">{icon}</div>}
          <span className="font-medium text-gray-200">{title}</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`panel-${title.replace(/\s+/g, '-').toLowerCase()}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`collapsible-content ${contentClassName}`}
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Styled version with modern dark theme
export const StyledCollapsiblePanel: React.FC<CollapsiblePanelProps> = (props) => {
  return (
    <CollapsiblePanel
      {...props}
      className={`
        bg-gray-900/50 
        backdrop-blur-sm 
        border border-gray-800 
        rounded-lg 
        overflow-hidden 
        transition-all 
        duration-200 
        hover:border-gray-700
        ${props.className || ''}
      `}
      headerClassName={`
        w-full 
        px-4 
        py-3 
        text-left 
        hover:bg-gray-800/50 
        transition-colors 
        duration-200
        ${props.headerClassName || ''}
      `}
      contentClassName={`
        border-t 
        border-gray-800 
        bg-gray-900/30
        ${props.contentClassName || ''}
      `}
    />
  )
}