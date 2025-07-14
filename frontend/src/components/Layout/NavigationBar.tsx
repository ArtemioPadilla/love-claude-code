import React from 'react'
import { motion } from 'framer-motion'
import { Home, Book, Code2, Layers, Package } from 'lucide-react'
import { useNavigate, useNavigationStore } from '../Navigation'

const NavigationBar: React.FC = () => {
  const navigate = useNavigate()
  const { currentView } = useNavigationStore()
  
  const navItems = [
    { id: 'landing', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <Code2 className="w-4 h-4" /> },
    { id: 'constructs', label: 'Constructs', icon: <Package className="w-4 h-4" /> },
    { id: 'docs', label: 'Documentation', icon: <Book className="w-4 h-4" /> },
    { id: 'features', label: 'Features', icon: <Layers className="w-4 h-4" /> }
  ]

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(item.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${currentView === item.id 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'hover:bg-gray-700 text-gray-300'
            }
          `}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </motion.button>
      ))}
    </nav>
  )
}

export default NavigationBar