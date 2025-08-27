import React from 'react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

export const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const variantClasses = {
    default: 'bg-gray-50 border-gray-200 text-gray-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }
  
  return (
    <div 
      className={`p-4 border rounded-lg ${variantClasses[variant]} ${className}`} 
      {...props} 
    />
  )
}

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  className = '', 
  ...props 
}) => (
  <h4 className={`font-semibold mb-1 ${className}`} {...props} />
)

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  className = '', 
  ...props 
}) => (
  <p className={`text-sm ${className}`} {...props} />
)