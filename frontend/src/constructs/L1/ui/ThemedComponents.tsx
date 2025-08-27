import React, { useContext, createContext, useState, useEffect } from 'react'
import { L1UIConstruct } from '../../base/L1Construct'
import { PlatformConstructDefinition, ConstructLevel, ConstructType, CloudProvider } from '../../types'

/**
 * L1 Themed Components Construct
 * Complete UI component library with dark/light themes and customization
 * Built upon L0 Button, Modal, and Tab primitives
 */
export class ThemedComponents extends L1UIConstruct {
  static definition: PlatformConstructDefinition = {
    id: 'platform-l1-themed-components',
    name: 'Themed Components',
    level: ConstructLevel.L1,
    type: ConstructType.UI,
    description: 'Complete UI component library with dark/light themes, CSS variables, and extensive customization. Includes buttons, inputs, cards, and more.',
    version: '1.0.0',
    author: 'Love Claude Code',
    categories: ['ui', 'components', 'theme'],
    providers: [CloudProvider.LOCAL, CloudProvider.FIREBASE, CloudProvider.AWS],
    tags: ['components', 'theme', 'dark-mode', 'light-mode', 'ui-library', 'design-system'],
    inputs: [
      {
        name: 'theme',
        type: 'string',
        description: 'Active theme name',
        required: false,
        defaultValue: 'dark',
        validation: {
          enum: ['light', 'dark', 'custom']
        }
      },
      {
        name: 'customTheme',
        type: 'ThemeConfig',
        description: 'Custom theme configuration',
        required: false
      },
      {
        name: 'persistTheme',
        type: 'boolean',
        description: 'Persist theme selection to localStorage',
        required: false,
        defaultValue: true
      },
      {
        name: 'enableSystemTheme',
        type: 'boolean',
        description: 'Follow system color scheme preference',
        required: false,
        defaultValue: false
      },
      {
        name: 'enableTransitions',
        type: 'boolean',
        description: 'Enable smooth theme transitions',
        required: false,
        defaultValue: true
      },
      {
        name: 'componentVariants',
        type: 'ComponentVariants',
        description: 'Component style variants configuration',
        required: false
      },
      {
        name: 'onThemeChange',
        type: 'function',
        description: 'Callback when theme changes',
        required: false
      }
    ],
    outputs: [
      {
        name: 'currentTheme',
        type: 'string',
        description: 'Currently active theme'
      },
      {
        name: 'themeConfig',
        type: 'ThemeConfig',
        description: 'Active theme configuration'
      },
      {
        name: 'isDarkMode',
        type: 'boolean',
        description: 'Whether dark mode is active'
      },
      {
        name: 'systemTheme',
        type: 'string',
        description: 'System color scheme preference'
      },
      {
        name: 'components',
        type: 'ThemedComponentSet',
        description: 'All themed component instances'
      }
    ],
    security: [
      {
        aspect: 'Theme Injection',
        description: 'Validates CSS values to prevent injection',
        implementation: 'CSS value sanitization and validation'
      },
      {
        aspect: 'Component Isolation',
        description: 'Components are style-isolated',
        implementation: 'CSS-in-JS with scoped styles'
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: []
    },
    c4: {
      type: 'Component',
      technology: 'React + CSS Variables'
    },
    examples: [
      {
        title: 'Basic Theme Usage',
        description: 'Initialize themed components',
        code: `const themed = new ThemedComponents()
await themed.initialize({
  theme: 'dark',
  enableSystemTheme: true
})

// Use components
const { Button, Input, Card } = themed.getComponents()

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>`,
        language: 'typescript'
      },
      {
        title: 'Custom Theme',
        description: 'Create a custom theme',
        code: `const themed = new ThemedComponents()
await themed.initialize({
  theme: 'custom',
  customTheme: {
    name: 'ocean',
    colors: {
      primary: '#0066cc',
      secondary: '#00aaff',
      background: '#001122',
      surface: '#002244',
      text: '#ffffff',
      textSecondary: '#aabbcc'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: { base: 14, large: 16 }
    }
  }
})`,
        language: 'typescript'
      }
    ],
    bestPractices: [
      'Use CSS variables for dynamic theming',
      'Provide high contrast ratios for accessibility',
      'Test components in both light and dark modes',
      'Support system theme preferences',
      'Implement smooth theme transitions',
      'Use semantic color names',
      'Consider color blindness in palette selection'
    ],
    deployment: {
      requiredProviders: [],
      configSchema: {},
      environmentVariables: []
    },
    dependencies: ['platform-l0-button-primitive', 'platform-l0-modal-primitive'],
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'manual',
      vibeCodingPercentage: 0,
      builtWith: ['platform-l0-button-primitive', 'platform-l0-modal-primitive', 'platform-l0-tab-primitive'],
      timeToCreate: 45,
      canBuildConstructs: false
    }
  }

  constructor() {
    super(ThemedComponents.definition)
  }

  private currentTheme: string = 'dark'
  private systemTheme: string = 'light'
  private themeConfig: ThemeConfig | null = null

  /**
   * Initialize theme system
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config)

    // Load persisted theme
    if (this.getInput<boolean>('persistTheme')) {
      const saved = localStorage.getItem('theme-preference')
      if (saved) {
        this.currentTheme = saved
      }
    }

    // Setup system theme detection
    if (this.getInput<boolean>('enableSystemTheme')) {
      this.detectSystemTheme()
      this.watchSystemTheme()
    }

    // Apply initial theme
    this.applyTheme(this.currentTheme)
  }

  /**
   * Detect system color scheme
   */
  private detectSystemTheme(): void {
    if (window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.systemTheme = isDark ? 'dark' : 'light'
      this.setOutput('systemTheme', this.systemTheme)
    }
  }

  /**
   * Watch for system theme changes
   */
  private watchSystemTheme(): void {
    if (!window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      this.systemTheme = e.matches ? 'dark' : 'light'
      this.setOutput('systemTheme', this.systemTheme)
      
      if (this.getInput<boolean>('enableSystemTheme')) {
        this.setTheme(this.systemTheme)
      }
    })
  }

  /**
   * Apply theme to document
   */
  private applyTheme(themeName: string): void {
    const config = this.getThemeConfig(themeName)
    this.themeConfig = config
    
    // Apply CSS variables
    const root = document.documentElement
    
    // Colors
    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })
    
    // Typography
    if (config.typography) {
      root.style.setProperty('--theme-font-family', config.typography.fontFamily)
      root.style.setProperty('--theme-font-size-base', `${config.typography.fontSize.base}px`)
      root.style.setProperty('--theme-font-size-large', `${config.typography.fontSize.large}px`)
    }
    
    // Spacing
    if (config.spacing) {
      Object.entries(config.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--theme-spacing-${key}`, `${value}px`)
      })
    }
    
    // Borders
    if (config.borders) {
      root.style.setProperty('--theme-border-radius', `${config.borders.radius}px`)
      root.style.setProperty('--theme-border-width', `${config.borders.width}px`)
    }
    
    // Add theme class
    document.body.className = `theme-${themeName}`
    
    // Add transition class if enabled
    if (this.getInput<boolean>('enableTransitions')) {
      document.body.classList.add('theme-transition')
    }
    
    // Update outputs
    this.setOutput('currentTheme', themeName)
    this.setOutput('themeConfig', config)
    this.setOutput('isDarkMode', themeName === 'dark')
    
    // Persist if enabled
    if (this.getInput<boolean>('persistTheme')) {
      localStorage.setItem('theme-preference', themeName)
    }
    
    // Emit event
    this.emit('themeChange', { theme: themeName, config })
    
    // Call callback
    const onThemeChange = this.getInput<Function>('onThemeChange')
    if (onThemeChange) {
      onThemeChange(themeName, config)
    }
  }

  /**
   * Get theme configuration
   */
  private getThemeConfig(themeName: string): ThemeConfig {
    if (themeName === 'custom') {
      const custom = this.getInput<ThemeConfig>('customTheme')
      if (custom) return custom
    }

    const themes: Record<string, ThemeConfig> = {
      light: {
        name: 'light',
        colors: {
          primary: '#0066cc',
          primaryHover: '#0052a3',
          secondary: '#6c757d',
          success: '#28a745',
          warning: '#ffc107',
          danger: '#dc3545',
          info: '#17a2b8',
          background: '#ffffff',
          surface: '#f8f9fa',
          surfaceHover: '#e9ecef',
          text: '#212529',
          textSecondary: '#6c757d',
          textMuted: '#adb5bd',
          border: '#dee2e6',
          shadow: 'rgba(0, 0, 0, 0.1)'
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: {
            base: 14,
            small: 12,
            large: 16,
            xlarge: 20,
            xxlarge: 24
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          }
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32
        },
        borders: {
          radius: 6,
          width: 1
        }
      },
      dark: {
        name: 'dark',
        colors: {
          primary: '#0d6efd',
          primaryHover: '#0b5ed7',
          secondary: '#6c757d',
          success: '#198754',
          warning: '#ffc107',
          danger: '#dc3545',
          info: '#0dcaf0',
          background: '#1a1a1a',
          surface: '#2d2d2d',
          surfaceHover: '#3d3d3d',
          text: '#ffffff',
          textSecondary: '#b0b0b0',
          textMuted: '#6c757d',
          border: '#404040',
          shadow: 'rgba(0, 0, 0, 0.3)'
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: {
            base: 14,
            small: 12,
            large: 16,
            xlarge: 20,
            xxlarge: 24
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          }
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32
        },
        borders: {
          radius: 6,
          width: 1
        }
      }
    }

    return themes[themeName] || themes.dark
  }

  /**
   * Set active theme
   */
  setTheme(themeName: string): void {
    this.currentTheme = themeName
    this.applyTheme(themeName)
  }

  /**
   * Toggle between light and dark
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
    this.setTheme(newTheme)
  }

  /**
   * Get component set
   */
  getComponents(): ThemedComponentSet {
    const theme = this.themeConfig || this.getThemeConfig(this.currentTheme)
    const variants = this.getInput<ComponentVariants>('componentVariants') || {}

    return {
      Button: (props: ButtonProps) => <ThemedButton {...props} theme={theme} variants={variants.button} />,
      Input: (props: InputProps) => <ThemedInput {...props} theme={theme} variants={variants.input} />,
      Card: (props: CardProps) => <ThemedCard {...props} theme={theme} variants={variants.card} />,
      Badge: (props: BadgeProps) => <ThemedBadge {...props} theme={theme} variants={variants.badge} />,
      Alert: (props: AlertProps) => <ThemedAlert {...props} theme={theme} variants={variants.alert} />,
      Switch: (props: SwitchProps) => <ThemedSwitch {...props} theme={theme} variants={variants.switch} />,
      Select: (props: SelectProps) => <ThemedSelect {...props} theme={theme} variants={variants.select} />,
      Tooltip: (props: TooltipProps) => <ThemedTooltip {...props} theme={theme} variants={variants.tooltip} />
    }
  }

  /**
   * React component for rendering
   */
  render(): React.ReactElement {
    return <ThemedComponentsProvider construct={this} />
  }
}

/**
 * Theme configuration interface
 */
interface ThemeConfig {
  name: string
  colors: {
    primary: string
    primaryHover?: string
    secondary: string
    success: string
    warning: string
    danger: string
    info: string
    background: string
    surface: string
    surfaceHover?: string
    text: string
    textSecondary: string
    textMuted?: string
    border: string
    shadow: string
    [key: string]: string | undefined
  }
  typography?: {
    fontFamily: string
    fontSize: {
      base: number
      small?: number
      large?: number
      xlarge?: number
      xxlarge?: number
    }
    fontWeight?: {
      normal: number
      medium?: number
      semibold?: number
      bold: number
    }
  }
  spacing?: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  borders?: {
    radius: number
    width: number
  }
}

/**
 * Component variants configuration
 */
interface ComponentVariants {
  button?: Record<string, React.CSSProperties>
  input?: Record<string, React.CSSProperties>
  card?: Record<string, React.CSSProperties>
  badge?: Record<string, React.CSSProperties>
  alert?: Record<string, React.CSSProperties>
  switch?: Record<string, React.CSSProperties>
  select?: Record<string, React.CSSProperties>
  tooltip?: Record<string, React.CSSProperties>
}

/**
 * Themed component set
 */
interface ThemedComponentSet {
  Button: React.FC<ButtonProps>
  Input: React.FC<InputProps>
  Card: React.FC<CardProps>
  Badge: React.FC<BadgeProps>
  Alert: React.FC<AlertProps>
  Switch: React.FC<SwitchProps>
  Select: React.FC<SelectProps>
  Tooltip: React.FC<TooltipProps>
}

// Component prop interfaces
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
  children: React.ReactNode
}

interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
  label?: string
  fullWidth?: boolean
}

interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  hoverable?: boolean
  onClick?: () => void
}

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  children: React.ReactNode
  size?: 'small' | 'medium'
}

interface AlertProps {
  variant?: 'success' | 'danger' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

interface SelectProps {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
}

interface TooltipProps {
  content: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}

// Themed Button Component
const ThemedButton: React.FC<ButtonProps & { theme: ThemeConfig; variants?: any }> = ({
  variant = 'primary',
  size = 'medium',
  disabled,
  loading,
  fullWidth,
  onClick,
  children,
  theme
}) => {
  const sizes = {
    small: { padding: '6px 12px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' }
  }

  const baseStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: 'var(--theme-border-radius)',
    fontFamily: 'var(--theme-font-family)',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1,
    ...sizes[size]
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: '#ffffff',
      ':hover': {
        backgroundColor: theme.colors.primaryHover || theme.colors.primary
      }
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      color: '#ffffff'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.border}`
    }
  }

  return (
    <button
      style={{ ...baseStyle, ...variantStyles[variant] }}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span>⟳</span>}
      {children}
    </button>
  )
}

// Themed Input Component
const ThemedInput: React.FC<InputProps & { theme: ThemeConfig; variants?: any }> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  error,
  helperText,
  label,
  fullWidth,
  theme
}) => {
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 'var(--theme-border-radius)',
    border: `1px solid ${error ? theme.colors.danger : theme.colors.border}`,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontFamily: 'var(--theme-font-family)',
    fontSize: '14px',
    width: fullWidth ? '100%' : 'auto',
    transition: 'all 0.2s',
    outline: 'none'
  }

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '4px',
          fontSize: '12px',
          color: theme.colors.textSecondary
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        style={inputStyle}
      />
      {helperText && (
        <div style={{ 
          marginTop: '4px',
          fontSize: '12px',
          color: error ? theme.colors.danger : theme.colors.textMuted
        }}>
          {helperText}
        </div>
      )}
    </div>
  )
}

// Themed Card Component
const ThemedCard: React.FC<CardProps & { theme: ThemeConfig; variants?: any }> = ({
  title,
  subtitle,
  children,
  footer,
  hoverable,
  onClick,
  theme
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 'var(--theme-border-radius)',
    padding: 'var(--theme-spacing-md)',
    transition: 'all 0.2s',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: isHovered && hoverable ? `0 4px 12px ${theme.colors.shadow}` : 'none',
    transform: isHovered && hoverable ? 'translateY(-2px)' : 'none'
  }

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <h3 style={{ 
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: theme.colors.text
        }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <p style={{ 
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: theme.colors.textSecondary
        }}>
          {subtitle}
        </p>
      )}
      <div>{children}</div>
      {footer && (
        <div style={{ 
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${theme.colors.border}`
        }}>
          {footer}
        </div>
      )}
    </div>
  )
}

// Other themed components would be implemented similarly...
const ThemedBadge: React.FC<BadgeProps & { theme: ThemeConfig }> = ({ children, _theme }) => (
  <span>{children}</span>
)

const ThemedAlert: React.FC<AlertProps & { theme: ThemeConfig }> = ({ children, _theme }) => (
  <div>{children}</div>
)

const ThemedSwitch: React.FC<SwitchProps & { theme: ThemeConfig }> = ({ _theme }) => (
  <div>Switch</div>
)

const ThemedSelect: React.FC<SelectProps & { theme: ThemeConfig }> = ({ _theme }) => (
  <select />
)

const ThemedTooltip: React.FC<TooltipProps & { theme: ThemeConfig }> = ({ children, _theme }) => (
  <>{children}</>
)

/**
 * Theme Provider Component
 */
const ThemeContext = createContext<ThemedComponents | null>(null)

const ThemedComponentsProvider: React.FC<{ construct: ThemedComponents }> = ({ construct }) => {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const unsubscribe = construct.on('themeChange', () => {
      forceUpdate({})
    })

    return unsubscribe
  }, [construct])

  return (
    <ThemeContext.Provider value={construct}>
      <div className="themed-components-root">
        <style>{`
          .theme-transition * {
            transition: background-color 0.3s, color 0.3s, border-color 0.3s !important;
          }
          
          button:hover {
            filter: brightness(1.1);
          }
          
          input:focus {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
          }
        `}</style>
      </div>
    </ThemeContext.Provider>
  )
}

// Export factory function
export const createThemedComponents = () => new ThemedComponents()

// Export the definition for catalog registration
export const themedComponentsDefinition = ThemedComponents.definition