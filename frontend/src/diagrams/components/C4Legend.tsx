import React from 'react'
import { Package, Users, Database, Globe, Layers, Shield } from 'lucide-react'
import { C4Level } from '../c4/C4DiagramViewer'

interface C4LegendProps {
  level: C4Level
}

/**
 * Legend component for C4 diagrams
 */
export const C4Legend: React.FC<C4LegendProps> = ({ level }) => {
  const getLegendItems = () => {
    switch (level) {
      case C4Level.CONTEXT:
        return [
          { icon: <Users className="w-4 h-4" />, label: 'Person', color: 'bg-green-900/50 border-green-500' },
          { icon: <Package className="w-4 h-4" />, label: 'Software System', color: 'bg-blue-900/50 border-blue-500' },
          { icon: <Package className="w-4 h-4" />, label: 'External System', color: 'bg-orange-900/50 border-orange-500' }
        ]
      
      case C4Level.CONTAINER:
        return [
          { icon: <Globe className="w-4 h-4" />, label: 'Web Application', color: 'bg-indigo-900/50 border-indigo-500' },
          { icon: <Database className="w-4 h-4" />, label: 'Database', color: 'bg-indigo-900/50 border-indigo-500' },
          { icon: <Package className="w-4 h-4" />, label: 'Application', color: 'bg-indigo-900/50 border-indigo-500' },
          { icon: <Shield className="w-4 h-4" />, label: 'Security', color: 'bg-red-900/50 border-red-500' }
        ]
      
      case C4Level.COMPONENT:
        return [
          { icon: <Layers className="w-4 h-4" />, label: 'Component', color: 'bg-purple-900/50 border-purple-500' },
          { icon: <Shield className="w-4 h-4" />, label: 'Security Component', color: 'bg-red-900/50 border-red-500' },
          { icon: <Database className="w-4 h-4" />, label: 'Data Component', color: 'bg-green-900/50 border-green-500' }
        ]
      
      case C4Level.CODE:
        return [
          { icon: <Layers className="w-4 h-4" />, label: 'Class', color: 'bg-gray-700 border-gray-500' },
          { icon: <Layers className="w-4 h-4" />, label: 'Interface', color: 'bg-blue-900/50 border-blue-500' }
        ]
      
      default:
        return []
    }
  }
  
  const items = getLegendItems()
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h4 className="text-sm font-medium text-gray-300 mb-3">Legend</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border-2 ${item.color}`}>
              {item.icon}
            </div>
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h5 className="text-xs font-medium text-gray-400 mb-2">Relationships</h5>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-500"></div>
            <span className="text-xs text-gray-400">Synchronous</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-500 border-b-2 border-dashed border-gray-500"></div>
            <span className="text-xs text-gray-400">Asynchronous</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-xs text-gray-400">Data Flow</span>
          </div>
        </div>
      </div>
    </div>
  )
}