import React from 'react'

export interface ToggleProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}) => {
  const [isChecked, setIsChecked] = React.useState(checked ?? defaultChecked)
  
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked)
    }
  }, [checked])
  
  const handleClick = () => {
    if (!disabled) {
      const newChecked = !isChecked
      setIsChecked(newChecked)
      onCheckedChange?.(newChecked)
    }
  }
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        ${isChecked ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isChecked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}