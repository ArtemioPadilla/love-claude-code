import React, { useState } from 'react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false)
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')
  
  return (
    <button
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {children}
    </button>
  )
}

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')
  
  return <span>{context.value || placeholder}</span>
}

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectContent must be used within Select')
  
  if (!context.open) return null
  
  return (
    <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${className}`}>
      {children}
    </div>
  )
}

export const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')
  
  return (
    <button
      type="button"
      onClick={() => {
        context.onValueChange?.(value)
        context.setOpen(false)
      }}
      className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${className}`}
    >
      {children}
    </button>
  )
}