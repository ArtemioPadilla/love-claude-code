import React from 'react'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ className = '', ...props }) => (
  <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props} />
)