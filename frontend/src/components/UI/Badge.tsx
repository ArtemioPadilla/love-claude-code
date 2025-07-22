import { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium',
        {
          // Variants
          'bg-secondary text-secondary-foreground': variant === 'default',
          'bg-success/20 text-success': variant === 'success',
          'bg-warning/20 text-warning': variant === 'warning',
          'bg-destructive/20 text-destructive': variant === 'error',
          'bg-blue-500/20 text-blue-500': variant === 'info',
          // Sizes
          'text-xs px-2 py-0.5': size === 'sm',
          'text-sm px-2.5 py-0.5': size === 'md',
          'text-base px-3 py-1': size === 'lg',
        },
        className
      )}
    >
      {children}
    </span>
  )
}