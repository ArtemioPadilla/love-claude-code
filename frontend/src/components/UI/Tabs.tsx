import React, { useState } from 'react'

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

export const Tabs: React.FC<TabsProps> = ({ 
  defaultValue = '', 
  value: controlledValue, 
  onValueChange, 
  children, 
  className = '' 
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue)
    } else {
      setInternalValue(newValue)
    }
  }
  
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex border-b ${className}`}>{children}</div>
)

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  
  const isActive = context.value === value
  
  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={`px-4 py-2 font-medium ${
        isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  
  if (context.value !== value) return null
  
  return <div className={`mt-4 ${className}`}>{children}</div>
}