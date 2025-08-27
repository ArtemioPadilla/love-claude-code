import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`} {...props} />
)

export const CardHeader: React.FC<CardProps> = ({ className = '', ...props }) => (
  <div className={`p-4 border-b ${className}`} {...props} />
)

export const CardTitle: React.FC<CardProps> = ({ className = '', ...props }) => (
  <h3 className={`text-lg font-semibold ${className}`} {...props} />
)

export const CardDescription: React.FC<CardProps> = ({ className = '', ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props} />
)

export const CardContent: React.FC<CardProps> = ({ className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props} />
)