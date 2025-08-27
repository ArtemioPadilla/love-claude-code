import { ProjectTemplate } from './projectTemplates'
import { ConstructLevel } from '../constructs/types'

export interface ConstructTemplate extends ProjectTemplate {
  constructLevel: ConstructLevel
  dependencies?: string[]
  guidelines?: string[]
}

export const constructTemplates: ConstructTemplate[] = [
  {
    id: 'l0-ui-primitive',
    name: 'L0 UI Primitive',
    description: 'Basic UI primitive construct - foundation building block for UI components',
    category: 'other',
    icon: '🔧',
    tags: ['construct', 'L0', 'ui', 'primitive', 'platform'],
    constructLevel: ConstructLevel.L0,
    dependencies: [],
    guidelines: [
      'Must have zero external dependencies',
      'Single responsibility - one clear purpose',
      'Minimal API surface',
      'No complex state management',
      'Direct DOM/React primitive usage only'
    ],
    files: [
      {
        path: '/src/index.tsx',
        content: `import React from 'react'
import { L0PrimitiveConstruct } from '@love-claude-code/constructs'

export interface ButtonPrimitiveProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

/**
 * L0 Button Primitive - Foundation UI construct
 * This is a platform construct that builds itself
 * Development method: hybrid
 * Vibe-coding percentage: 75%
 */
export const ButtonPrimitive: React.FC<ButtonPrimitiveProps> & L0PrimitiveConstruct = ({ 
  children, 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`l0-button \${className}\`}
      aria-disabled={disabled}
    >
      {children}
    </button>
  )
}

// L0 Construct metadata
ButtonPrimitive.level = 'L0'
ButtonPrimitive.primitiveType = 'ui'
ButtonPrimitive.metadata = {
  id: 'button-primitive',
  name: 'Button Primitive',
  level: 'L0',
  description: 'Foundation button UI primitive',
  version: '1.0.0',
  author: 'Love Claude Code Platform',
  categories: ['ui', 'interactive'],
  providers: ['local'],
  tags: ['button', 'primitive', 'ui', 'L0'],
  type: 'UI',
  inputs: [
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Button content',
      required: true
    },
    {
      name: 'onClick',
      type: '() => void',
      description: 'Click handler',
      required: false
    },
    {
      name: 'disabled',
      type: 'boolean',
      description: 'Disabled state',
      required: false,
      defaultValue: false
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes',
      required: false,
      defaultValue: ''
    }
  ],
  outputs: [],
  security: [],
  cost: {
    baseMonthly: 0,
    usageFactors: []
  },
  c4: {
    type: 'Component',
    technology: 'React'
  },
  examples: [
    {
      title: 'Basic Usage',
      description: 'Simple button primitive',
      language: 'tsx',
      code: \`<ButtonPrimitive onClick={() => console.log('clicked')}>
  Click Me
</ButtonPrimitive>\`
    }
  ],
  bestPractices: [
    'Keep styling minimal and extensible',
    'Use semantic HTML',
    'Include proper ARIA attributes',
    'Handle all native button behaviors'
  ],
  deployment: {
    requiredProviders: [],
    configSchema: {}
  },
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'hybrid',
    vibeCodingPercentage: 75,
    builtWith: [],
    canBuildConstructs: false
  }
}

export default ButtonPrimitive`
      },
      {
        path: '/src/styles.css',
        content: `.l0-button {
  /* Minimal base styles - let L1 constructs add design */
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
}

.l0-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}`
      },
      {
        path: '/tests/ButtonPrimitive.test.tsx',
        content: `import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { ButtonPrimitive } from '../src'

describe('ButtonPrimitive', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ButtonPrimitive>Test Button</ButtonPrimitive>
    )
    expect(getByText('Test Button')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    const { getByText } = render(
      <ButtonPrimitive onClick={handleClick}>Click Me</ButtonPrimitive>
    )
    
    fireEvent.click(getByText('Click Me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn()
    const { getByText } = render(
      <ButtonPrimitive onClick={handleClick} disabled>
        Disabled Button
      </ButtonPrimitive>
    )
    
    fireEvent.click(getByText('Disabled Button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ButtonPrimitive className="custom-class">
        Styled Button
      </ButtonPrimitive>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('l0-button', 'custom-class')
  })

  it('has correct ARIA attributes when disabled', () => {
    const { container } = render(
      <ButtonPrimitive disabled>Disabled</ButtonPrimitive>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })
})`
      },
      {
        path: '/package.json',
        content: JSON.stringify({
          name: '@love-claude-code/button-primitive',
          version: '1.0.0',
          description: 'L0 Button Primitive for Love Claude Code platform',
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          scripts: {
            build: 'tsc',
            test: 'jest',
            'test:watch': 'jest --watch',
            lint: 'eslint src --ext .ts,.tsx'
          },
          peerDependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0'
          },
          devDependencies: {
            '@types/react': '^18.0.0',
            '@testing-library/react': '^14.0.0',
            '@testing-library/jest-dom': '^6.0.0',
            typescript: '^5.0.0',
            jest: '^29.0.0',
            eslint: '^8.0.0'
          },
          keywords: ['construct', 'L0', 'primitive', 'ui', 'button', 'love-claude-code']
        }, null, 2)
      }
    ]
  },
  {
    id: 'l0-infra-primitive',
    name: 'L0 Infrastructure Primitive',
    description: 'Basic infrastructure primitive - direct cloud resource mapping',
    category: 'other',
    icon: '☁️',
    tags: ['construct', 'L0', 'infrastructure', 'primitive', 'cloud'],
    constructLevel: ConstructLevel.L0,
    dependencies: [],
    guidelines: [
      'Direct 1:1 mapping to cloud resources',
      'No abstraction over provider APIs',
      'Minimal configuration',
      'Provider-specific implementation',
      'Raw resource access'
    ],
    files: [
      {
        path: '/src/index.ts',
        content: `import { L0PrimitiveConstruct, CloudProvider } from '@love-claude-code/constructs'

export interface S3BucketPrimitiveProps {
  bucketName: string
  region?: string
  provider: CloudProvider.AWS
}

/**
 * L0 S3 Bucket Primitive - Direct AWS S3 bucket mapping
 * This is a platform construct that builds itself
 * Development method: hybrid
 * Vibe-coding percentage: 80%
 */
export class S3BucketPrimitive implements L0PrimitiveConstruct {
  readonly level = 'L0'
  readonly primitiveType = 'infrastructure'
  readonly id: string
  readonly bucketName: string
  readonly region: string
  readonly provider: CloudProvider.AWS

  constructor(props: S3BucketPrimitiveProps) {
    this.id = \`s3-bucket-\${props.bucketName}\`
    this.bucketName = props.bucketName
    this.region = props.region || 'us-east-1'
    this.provider = props.provider
  }

  getType() {
    return 'Infrastructure'
  }

  getLevel() {
    return this.level
  }

  // Pulumi resource definition
  toPulumi() {
    return {
      type: 'aws:s3:Bucket',
      properties: {
        bucket: this.bucketName,
        region: this.region
      }
    }
  }

  // CloudFormation resource definition
  toCloudFormation() {
    return {
      Type: 'AWS::S3::Bucket',
      Properties: {
        BucketName: this.bucketName
      }
    }
  }

  // Terraform resource definition
  toTerraform() {
    return {
      resource: {
        aws_s3_bucket: {
          [this.id]: {
            bucket: this.bucketName,
            region: this.region
          }
        }
      }
    }
  }

  static metadata = {
    id: 's3-bucket-primitive',
    name: 'S3 Bucket Primitive',
    level: 'L0',
    description: 'Direct AWS S3 bucket resource mapping',
    version: '1.0.0',
    author: 'Love Claude Code Platform',
    categories: ['infrastructure', 'storage'],
    providers: ['aws'],
    tags: ['s3', 'bucket', 'storage', 'aws', 'L0'],
    type: 'Infrastructure',
    inputs: [
      {
        name: 'bucketName',
        type: 'string',
        description: 'Name of the S3 bucket',
        required: true,
        validation: {
          pattern: '^[a-z0-9.-]+$',
          min: 3,
          max: 63
        }
      },
      {
        name: 'region',
        type: 'string',
        description: 'AWS region',
        required: false,
        defaultValue: 'us-east-1'
      }
    ],
    outputs: [
      {
        name: 'bucketArn',
        type: 'string',
        description: 'ARN of the created bucket'
      },
      {
        name: 'bucketUrl',
        type: 'string',
        description: 'URL of the bucket'
      }
    ],
    security: [
      {
        aspect: 'access-control',
        description: 'Bucket is created with default private ACL',
        severity: 'medium',
        recommendations: [
          'Configure bucket policies for access control',
          'Enable versioning for data protection',
          'Consider encryption at rest'
        ]
      }
    ],
    cost: {
      baseMonthly: 0,
      usageFactors: [
        {
          name: 'storage',
          unit: 'GB',
          costPerUnit: 0.023,
          typicalUsage: 100
        },
        {
          name: 'requests',
          unit: '1000 requests',
          costPerUnit: 0.0004,
          typicalUsage: 1000
        }
      ]
    },
    c4: {
      type: 'Container',
      technology: 'AWS S3',
      containerType: 'FileSystem'
    },
    examples: [
      {
        title: 'Basic S3 Bucket',
        description: 'Create a simple S3 bucket',
        language: 'typescript',
        code: \`const bucket = new S3BucketPrimitive({
  bucketName: 'my-app-data',
  region: 'us-west-2',
  provider: CloudProvider.AWS
})\`
      }
    ],
    bestPractices: [
      'Use globally unique bucket names',
      'Follow AWS S3 naming conventions',
      'Configure lifecycle policies for cost optimization',
      'Enable versioning for critical data'
    ],
    deployment: {
      requiredProviders: ['@pulumi/aws'],
      configSchema: {
        type: 'object',
        properties: {
          awsRegion: { type: 'string' },
          awsProfile: { type: 'string' }
        }
      }
    },
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'hybrid',
      vibeCodingPercentage: 80,
      builtWith: [],
      canBuildConstructs: false
    }
  }
}

export default S3BucketPrimitive`
      },
      {
        path: '/tests/S3BucketPrimitive.test.ts',
        content: `import { S3BucketPrimitive } from '../src'
import { CloudProvider } from '@love-claude-code/constructs'

describe('S3BucketPrimitive', () => {
  it('creates bucket with correct properties', () => {
    const bucket = new S3BucketPrimitive({
      bucketName: 'test-bucket',
      region: 'us-west-2',
      provider: CloudProvider.AWS
    })

    expect(bucket.bucketName).toBe('test-bucket')
    expect(bucket.region).toBe('us-west-2')
    expect(bucket.provider).toBe(CloudProvider.AWS)
  })

  it('uses default region when not specified', () => {
    const bucket = new S3BucketPrimitive({
      bucketName: 'test-bucket',
      provider: CloudProvider.AWS
    })

    expect(bucket.region).toBe('us-east-1')
  })

  it('generates correct Pulumi resource', () => {
    const bucket = new S3BucketPrimitive({
      bucketName: 'test-bucket',
      provider: CloudProvider.AWS
    })

    const pulumiResource = bucket.toPulumi()
    expect(pulumiResource.type).toBe('aws:s3:Bucket')
    expect(pulumiResource.properties.bucket).toBe('test-bucket')
  })

  it('generates correct CloudFormation resource', () => {
    const bucket = new S3BucketPrimitive({
      bucketName: 'test-bucket',
      provider: CloudProvider.AWS
    })

    const cfResource = bucket.toCloudFormation()
    expect(cfResource.Type).toBe('AWS::S3::Bucket')
    expect(cfResource.Properties.BucketName).toBe('test-bucket')
  })

  it('generates correct Terraform resource', () => {
    const bucket = new S3BucketPrimitive({
      bucketName: 'test-bucket',
      provider: CloudProvider.AWS
    })

    const tfResource = bucket.toTerraform()
    expect(tfResource.resource.aws_s3_bucket).toBeDefined()
    expect(tfResource.resource.aws_s3_bucket[\`s3-bucket-test-bucket\`].bucket).toBe('test-bucket')
  })
})`
      }
    ]
  },
  {
    id: 'l1-configured-button',
    name: 'L1 Configured Button',
    description: 'Configured button with styling and behavior - builds on L0 primitives',
    category: 'other',
    icon: '🎨',
    tags: ['construct', 'L1', 'ui', 'button', 'configured'],
    constructLevel: ConstructLevel.L1,
    dependencies: ['button-primitive'],
    guidelines: [
      'Must use L0 primitives as foundation',
      'Add sensible defaults and configuration',
      'Handle common use cases',
      'Provide consistent styling',
      'Keep configuration simple'
    ],
    files: [
      {
        path: '/src/index.tsx',
        content: `import React from 'react'
import { ButtonPrimitive } from '@love-claude-code/button-primitive'
import { L1ConfiguredConstruct } from '@love-claude-code/constructs'
import './styles.css'

export interface ConfiguredButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean
}

/**
 * L1 Configured Button - Styled and configured button construct
 * Built using L0 ButtonPrimitive
 * Development method: vibe-coded
 * Vibe-coding percentage: 90%
 */
export const ConfiguredButton: React.FC<ConfiguredButtonProps> & L1ConfiguredConstruct = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false
}) => {
  const className = [
    'l1-button',
    \`l1-button--\${variant}\`,
    \`l1-button--\${size}\`,
    fullWidth && 'l1-button--full-width',
    loading && 'l1-button--loading'
  ].filter(Boolean).join(' ')

  return (
    <ButtonPrimitive
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <span className="l1-button__spinner">Loading...</span>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

// L1 Construct configuration
ConfiguredButton.level = 'L1'
ConfiguredButton.configure = (options: Record<string, any>) => {
  // Configuration logic for theming, etc.
  console.log('Configuring button with:', options)
}

ConfiguredButton.metadata = {
  id: 'configured-button',
  name: 'Configured Button',
  level: 'L1',
  description: 'Styled and configured button with variants',
  version: '1.0.0',
  author: 'Love Claude Code Platform',
  categories: ['ui', 'interactive', 'forms'],
  providers: ['local'],
  tags: ['button', 'configured', 'ui', 'L1'],
  type: 'UI',
  inputs: [
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Button content',
      required: true
    },
    {
      name: 'onClick',
      type: '() => void',
      description: 'Click handler',
      required: false
    },
    {
      name: 'disabled',
      type: 'boolean',
      description: 'Disabled state',
      required: false,
      defaultValue: false
    },
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'danger'",
      description: 'Button style variant',
      required: false,
      defaultValue: 'primary',
      validation: {
        enum: ['primary', 'secondary', 'danger']
      }
    },
    {
      name: 'size',
      type: "'small' | 'medium' | 'large'",
      description: 'Button size',
      required: false,
      defaultValue: 'medium',
      validation: {
        enum: ['small', 'medium', 'large']
      }
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      description: 'Full width button',
      required: false,
      defaultValue: false
    },
    {
      name: 'loading',
      type: 'boolean',
      description: 'Loading state',
      required: false,
      defaultValue: false
    }
  ],
  outputs: [],
  dependencies: [
    {
      constructId: 'button-primitive',
      version: '^1.0.0',
      optional: false
    }
  ],
  security: [],
  cost: {
    baseMonthly: 0,
    usageFactors: []
  },
  c4: {
    type: 'Component',
    technology: 'React'
  },
  examples: [
    {
      title: 'Primary Button',
      description: 'Standard primary button',
      language: 'tsx',
      code: \`<ConfiguredButton onClick={handleSubmit}>
  Submit
</ConfiguredButton>\`
    },
    {
      title: 'Loading Button',
      description: 'Button with loading state',
      language: 'tsx',
      code: \`<ConfiguredButton 
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Save Changes
</ConfiguredButton>\`
    }
  ],
  bestPractices: [
    'Use appropriate variant for action importance',
    'Provide loading feedback for async actions',
    'Include proper disabled states',
    'Maintain consistent sizing across the app'
  ],
  deployment: {
    requiredProviders: [],
    configSchema: {}
  },
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'vibe-coded',
    vibeCodingPercentage: 90,
    builtWith: ['button-primitive'],
    canBuildConstructs: false
  }
}

export default ConfiguredButton`
      },
      {
        path: '/src/styles.css',
        content: `.l1-button {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1.5;
  cursor: pointer;
  border: 1px solid transparent;
}

/* Sizes */
.l1-button--small {
  padding: 4px 12px;
  font-size: 14px;
}

.l1-button--medium {
  padding: 8px 16px;
  font-size: 16px;
}

.l1-button--large {
  padding: 12px 24px;
  font-size: 18px;
}

/* Variants */
.l1-button--primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.l1-button--primary:hover:not(:disabled) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.l1-button--secondary {
  background-color: transparent;
  color: #3b82f6;
  border-color: #3b82f6;
}

.l1-button--secondary:hover:not(:disabled) {
  background-color: #3b82f620;
}

.l1-button--danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.l1-button--danger:hover:not(:disabled) {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* States */
.l1-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.l1-button--full-width {
  width: 100%;
}

.l1-button--loading {
  cursor: wait;
}

.l1-button__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`
      }
    ]
  },
  {
    id: 'l2-form-pattern',
    name: 'L2 Form Pattern',
    description: 'Complete form pattern with validation - combines multiple L1 constructs',
    category: 'other',
    icon: '📝',
    tags: ['construct', 'L2', 'pattern', 'form', 'validation'],
    constructLevel: ConstructLevel.L2,
    dependencies: ['configured-button', 'input-primitive', 'form-primitive'],
    guidelines: [
      'Combine multiple L1 constructs',
      'Implement common patterns',
      'Handle complex interactions',
      'Provide complete solutions',
      'Include validation and error handling'
    ],
    files: [
      {
        path: '/src/index.tsx',
        content: `import React, { useState } from 'react'
import { ConfiguredButton } from '@love-claude-code/configured-button'
import { InputPrimitive } from '@love-claude-code/input-primitive'
import { FormPrimitive } from '@love-claude-code/form-primitive'
import { L2PatternConstruct } from '@love-claude-code/constructs'

export interface FormPatternProps {
  onSubmit: (data: Record<string, any>) => Promise<void>
  fields: FormField[]
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number'
  required?: boolean
  validation?: (value: any) => string | null
  placeholder?: string
  defaultValue?: any
}

/**
 * L2 Form Pattern - Complete form solution with validation
 * Built using multiple L1 constructs
 * Development method: vibe-coded
 * Vibe-coding percentage: 85%
 */
export const FormPattern: React.FC<FormPatternProps> & L2PatternConstruct = ({
  onSubmit,
  fields,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel
}) => {
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    // Clear error when user types
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    fields.forEach(field => {
      const value = values[field.name]
      
      if (field.required && !value) {
        newErrors[field.name] = \`\${field.label} is required\`
        isValid = false
      } else if (field.validation && value) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPrimitive onSubmit={handleSubmit} className="l2-form-pattern">
      {fields.map(field => (
        <div key={field.name} className="l2-form-field">
          <label htmlFor={field.name} className="l2-form-label">
            {field.label}
            {field.required && <span className="l2-form-required">*</span>}
          </label>
          <InputPrimitive
            id={field.name}
            type={field.type}
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={errors[field.name] ? 'l2-form-input--error' : ''}
            disabled={isSubmitting}
          />
          {errors[field.name] && (
            <span className="l2-form-error">{errors[field.name]}</span>
          )}
        </div>
      ))}
      
      <div className="l2-form-actions">
        <ConfiguredButton
          type="submit"
          loading={isSubmitting}
          variant="primary"
        >
          {submitLabel}
        </ConfiguredButton>
        {onCancel && (
          <ConfiguredButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isSubmitting}
          >
            {cancelLabel}
          </ConfiguredButton>
        )}
      </div>
    </FormPrimitive>
  )
}

// L2 Pattern methods
FormPattern.level = 'L2'
FormPattern.validate = () => true
FormPattern.compose = () => {
  console.log('Composing form pattern...')
}

export default FormPattern`
      }
    ]
  },
  {
    id: 'l3-crud-app',
    name: 'L3 CRUD Application',
    description: 'Complete CRUD application - full-stack construct ready to deploy',
    category: 'other',
    icon: '🚀',
    tags: ['construct', 'L3', 'application', 'crud', 'fullstack'],
    constructLevel: ConstructLevel.L3,
    dependencies: ['form-pattern', 'table-pattern', 'api-pattern', 'database-pattern'],
    guidelines: [
      'Complete, deployable applications',
      'Combine multiple L2 patterns',
      'Include all necessary infrastructure',
      'Production-ready with monitoring',
      'Self-contained and configurable'
    ],
    files: [
      {
        path: '/src/index.ts',
        content: `import { L3ApplicationConstruct } from '@love-claude-code/constructs'
import { FormPattern } from '@love-claude-code/form-pattern'
import { TablePattern } from '@love-claude-code/table-pattern'
import { ApiPattern } from '@love-claude-code/api-pattern'
import { DatabasePattern } from '@love-claude-code/database-pattern'

export interface CrudApplicationConfig {
  name: string
  entities: EntityConfig[]
  database: DatabaseConfig
  api: ApiConfig
  ui: UiConfig
}

export interface EntityConfig {
  name: string
  fields: FieldConfig[]
  permissions?: PermissionConfig
}

/**
 * L3 CRUD Application - Complete full-stack application
 * Built using multiple L2 patterns
 * Development method: vibe-coded
 * Vibe-coding percentage: 95%
 */
export class CrudApplication implements L3ApplicationConstruct {
  readonly level = 'L3'
  private config: CrudApplicationConfig
  
  constructor(config: CrudApplicationConfig) {
    this.config = config
  }

  async build(): Promise<void> {
    console.log('Building CRUD application...')
    // Build steps
  }

  async deploy(target: string): Promise<void> {
    console.log(\`Deploying to \${target}...\`)
    // Deployment logic
  }

  async startDevelopment(): Promise<void> {
    console.log('Starting development mode...')
    // Dev server logic
  }

  async startProduction(): Promise<void> {
    console.log('Starting production mode...')
    // Production server logic
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      components: {
        database: 'healthy',
        api: 'healthy',
        ui: 'healthy'
      }
    }
  }

  async getMetrics() {
    return {
      requests: 0,
      errors: 0,
      latency: 0
    }
  }

  getVersion(): string {
    return '1.0.0'
  }

  getType() {
    return 'Application'
  }

  getLevel() {
    return this.level
  }

  static metadata = {
    id: 'crud-application',
    name: 'CRUD Application',
    level: 'L3',
    description: 'Complete CRUD application with UI, API, and database',
    version: '1.0.0',
    author: 'Love Claude Code Platform',
    categories: ['application', 'fullstack', 'crud'],
    providers: ['local', 'aws', 'firebase'],
    tags: ['crud', 'application', 'fullstack', 'L3'],
    type: 'Application',
    // ... additional metadata
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 95,
      builtWith: ['form-pattern', 'table-pattern', 'api-pattern', 'database-pattern'],
      canBuildConstructs: true,
      timeToCreate: 45
    }
  }
}

export default CrudApplication`
      }
    ]
  }
]

// Helper functions
export function getConstructTemplatesByLevel(level: ConstructLevel): ConstructTemplate[] {
  return constructTemplates.filter(t => t.constructLevel === level)
}

export function getConstructTemplateById(id: string): ConstructTemplate | undefined {
  return constructTemplates.find(t => t.id === id)
}

// Generate project files for a construct based on level
export function generateConstructProjectFiles(level: ConstructLevel, name: string): ProjectTemplate['files'] {
  const safeName = name.replace(/\s+/g, '')
  const kebabName = name.toLowerCase().replace(/\s+/g, '-')
  
  switch (level) {
    case ConstructLevel.L0:
      return [
        {
          path: '/src/index.tsx',
          content: `import React from 'react'
import { L0PrimitiveConstruct } from '@love-claude-code/constructs'

export interface ${safeName}Props {
  // Define your primitive props here
}

/**
 * ${name} - L0 Primitive Construct
 * This is a platform construct that builds itself
 * Development method: hybrid
 * Vibe-coding percentage: 75%
 */
export const ${safeName}: React.FC<${safeName}Props> & L0PrimitiveConstruct = (props) => {
  // Implement your L0 primitive here
  return <div>L0 Primitive: ${name}</div>
}

// L0 Construct metadata
${safeName}.level = 'L0'
${safeName}.primitiveType = 'ui' // or 'infrastructure'
${safeName}.metadata = {
  id: '${kebabName}',
  name: '${name}',
  level: 'L0',
  description: 'L0 primitive construct',
  version: '1.0.0',
  author: 'Love Claude Code Platform',
  categories: ['ui'],
  providers: ['local'],
  tags: ['L0', 'primitive'],
  type: 'UI',
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'hybrid',
    vibeCodingPercentage: 75,
    builtWith: [],
    canBuildConstructs: false
  }
}

export default ${safeName}`
        },
        {
          path: '/tests/index.test.tsx',
          content: `import React from 'react'
import { render } from '@testing-library/react'
import { ${safeName} } from '../src'

describe('${safeName}', () => {
  it('renders without crashing', () => {
    const { container } = render(<${safeName} />)
    expect(container).toBeDefined()
  })
  
  // Add more tests specific to your L0 primitive
})`
        },
        {
          path: '/README.md',
          content: `# ${name}

L0 Primitive Construct for Love Claude Code platform.

## Level: L0 (Primitive)

This is a foundation-level construct with:
- Zero external dependencies
- Single responsibility
- Minimal API surface
- Direct DOM/React primitive usage

## Usage

\`\`\`tsx
import { ${safeName} } from '@love-claude-code/${kebabName}'

<${safeName} />
\`\`\`

## Development Guidelines

1. Must have zero external dependencies
2. Single responsibility - one clear purpose
3. Minimal API surface
4. No complex state management
5. Direct DOM/React primitive usage only

## Self-Referential Metadata

- **Platform Construct**: Yes
- **Development Method**: Hybrid
- **Vibe-Coding**: 75%
- **Built With**: Platform tools
`
        },
        {
          path: '/package.json',
          content: JSON.stringify({
            name: `@love-claude-code/${kebabName}`,
            version: '1.0.0',
            description: `${name} - L0 Primitive Construct`,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
              build: 'tsc',
              test: 'jest',
              'test:watch': 'jest --watch',
              lint: 'eslint src --ext .ts,.tsx'
            },
            peerDependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0'
            },
            devDependencies: {
              '@types/react': '^18.0.0',
              '@testing-library/react': '^14.0.0',
              typescript: '^5.0.0',
              jest: '^29.0.0',
              eslint: '^8.0.0'
            },
            keywords: ['construct', 'L0', 'primitive', 'love-claude-code']
          }, null, 2)
        },
        {
          path: '/tsconfig.json',
          content: JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              jsx: 'react-jsx',
              module: 'ESNext',
              moduleResolution: 'node',
              declaration: true,
              declarationMap: true,
              outDir: './dist',
              rootDir: './src',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noImplicitReturns: true,
              noFallthroughCasesInSwitch: true,
              esModuleInterop: true,
              skipLibCheck: true,
              allowSyntheticDefaultImports: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true
            },
            include: ['src'],
            exclude: ['node_modules', 'dist', 'tests']
          }, null, 2)
        }
      ]
      
    case ConstructLevel.L1:
      return [
        {
          path: '/src/index.tsx',
          content: `import React from 'react'
import { L1ConfiguredConstruct } from '@love-claude-code/constructs'
// Import L0 primitives to build upon
// import { SomePrimitive } from '@love-claude-code/some-primitive'

export interface ${safeName}Props {
  // Define your configured construct props
}

/**
 * ${name} - L1 Configured Construct
 * Built using L0 primitives with sensible defaults
 * Development method: vibe-coded
 * Vibe-coding percentage: 90%
 */
export const ${safeName}: React.FC<${safeName}Props> & L1ConfiguredConstruct = (props) => {
  // Implement your L1 construct using L0 primitives
  return <div>L1 Configured: ${name}</div>
}

// L1 Construct configuration
${safeName}.level = 'L1'
${safeName}.configure = (options: Record<string, any>) => {
  // Configuration logic
  console.log('Configuring with:', options)
}

${safeName}.metadata = {
  id: '${kebabName}',
  name: '${name}',
  level: 'L1',
  description: 'L1 configured construct with sensible defaults',
  version: '1.0.0',
  author: 'Love Claude Code Platform',
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'vibe-coded',
    vibeCodingPercentage: 90,
    builtWith: ['L0-primitives'],
    canBuildConstructs: false
  }
}

export default ${safeName}`
        },
        {
          path: '/README.md',
          content: `# ${name}

L1 Configured Construct for Love Claude Code platform.

## Level: L1 (Configured)

This construct provides:
- Sensible defaults and configuration
- Built on L0 primitives
- Common use case handling
- Consistent styling and behavior

## Usage

\`\`\`tsx
import { ${safeName} } from '@love-claude-code/${kebabName}'

<${safeName} />
\`\`\`

## Configuration

\`\`\`typescript
${safeName}.configure({
  theme: 'dark',
  // other options
})
\`\`\`

## Development Guidelines

1. Must use L0 primitives as foundation
2. Add sensible defaults and configuration
3. Handle common use cases
4. Provide consistent styling
5. Keep configuration simple

## Self-Referential Metadata

- **Platform Construct**: Yes
- **Development Method**: Vibe-coded
- **Vibe-Coding**: 90%
- **Built With**: L0 primitives
`
        },
        {
          path: '/package.json',
          content: JSON.stringify({
            name: `@love-claude-code/${kebabName}`,
            version: '1.0.0',
            description: `${name} - L1 Configured Construct`,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
              build: 'tsc',
              test: 'jest',
              'test:watch': 'jest --watch',
              lint: 'eslint src --ext .ts,.tsx'
            },
            peerDependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0'
            },
            dependencies: {
              '@love-claude-code/constructs': '^1.0.0'
            },
            devDependencies: {
              '@types/react': '^18.0.0',
              '@testing-library/react': '^14.0.0',
              typescript: '^5.0.0',
              jest: '^29.0.0',
              eslint: '^8.0.0'
            },
            keywords: ['construct', 'L1', 'configured', 'love-claude-code']
          }, null, 2)
        },
        {
          path: '/tsconfig.json',
          content: JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              jsx: 'react-jsx',
              module: 'ESNext',
              moduleResolution: 'node',
              declaration: true,
              declarationMap: true,
              outDir: './dist',
              rootDir: './src',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noImplicitReturns: true,
              noFallthroughCasesInSwitch: true,
              esModuleInterop: true,
              skipLibCheck: true,
              allowSyntheticDefaultImports: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true
            },
            include: ['src'],
            exclude: ['node_modules', 'dist', 'tests']
          }, null, 2)
        }
      ]
      
    case ConstructLevel.L2:
      return [
        {
          path: '/src/index.tsx',
          content: `import React from 'react'
import { L2PatternConstruct } from '@love-claude-code/constructs'
// Import L1 constructs to compose
// import { ConfiguredButton } from '@love-claude-code/configured-button'

export interface ${safeName}Props {
  // Define your pattern props
}

/**
 * ${name} - L2 Pattern Construct
 * Combines multiple L1 constructs into a reusable pattern
 * Development method: vibe-coded
 * Vibe-coding percentage: 85%
 */
export const ${safeName}: React.FC<${safeName}Props> & L2PatternConstruct = (props) => {
  // Implement your L2 pattern using L1 constructs
  return <div>L2 Pattern: ${name}</div>
}

// L2 Pattern methods
${safeName}.level = 'L2'
${safeName}.validate = () => true
${safeName}.compose = () => {
  console.log('Composing pattern...')
}

${safeName}.metadata = {
  id: '${kebabName}',
  name: '${name}',
  level: 'L2',
  description: 'L2 pattern combining multiple L1 constructs',
  version: '1.0.0',
  author: 'Love Claude Code Platform',
  selfReferential: {
    isPlatformConstruct: true,
    developmentMethod: 'vibe-coded',
    vibeCodingPercentage: 85,
    builtWith: ['L1-constructs'],
    canBuildConstructs: false
  }
}

export default ${safeName}`
        },
        {
          path: '/README.md',
          content: `# ${name}

L2 Pattern Construct for Love Claude Code platform.

## Level: L2 (Pattern)

This pattern provides:
- Complete solution for common use cases
- Combines multiple L1 constructs
- Complex interaction handling
- Validation and error handling

## Usage

\`\`\`tsx
import { ${safeName} } from '@love-claude-code/${kebabName}'

<${safeName} />
\`\`\`

## Development Guidelines

1. Combine multiple L1 constructs
2. Implement common patterns
3. Handle complex interactions
4. Provide complete solutions
5. Include validation and error handling

## Self-Referential Metadata

- **Platform Construct**: Yes
- **Development Method**: Vibe-coded
- **Vibe-Coding**: 85%
- **Built With**: L1 constructs
`
        },
        {
          path: '/package.json',
          content: JSON.stringify({
            name: `@love-claude-code/${kebabName}`,
            version: '1.0.0',
            description: `${name} - L2 Pattern Construct`,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
              build: 'tsc',
              test: 'jest',
              'test:watch': 'jest --watch',
              lint: 'eslint src --ext .ts,.tsx'
            },
            peerDependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0'
            },
            dependencies: {
              '@love-claude-code/constructs': '^1.0.0'
            },
            devDependencies: {
              '@types/react': '^18.0.0',
              '@testing-library/react': '^14.0.0',
              typescript: '^5.0.0',
              jest: '^29.0.0',
              eslint: '^8.0.0'
            },
            keywords: ['construct', 'L2', 'pattern', 'love-claude-code']
          }, null, 2)
        },
        {
          path: '/tsconfig.json',
          content: JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              jsx: 'react-jsx',
              module: 'ESNext',
              moduleResolution: 'node',
              declaration: true,
              declarationMap: true,
              outDir: './dist',
              rootDir: './src',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noImplicitReturns: true,
              noFallthroughCasesInSwitch: true,
              esModuleInterop: true,
              skipLibCheck: true,
              allowSyntheticDefaultImports: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true
            },
            include: ['src'],
            exclude: ['node_modules', 'dist', 'tests']
          }, null, 2)
        }
      ]
      
    case ConstructLevel.L3:
      return [
        {
          path: '/src/index.ts',
          content: `import { L3ApplicationConstruct } from '@love-claude-code/constructs'
// Import L2 patterns to build the application
// import { FormPattern } from '@love-claude-code/form-pattern'

export interface ${safeName}Config {
  name: string
  // Define your application configuration
}

/**
 * ${name} - L3 Application Construct
 * Complete, deployable application built with L2 patterns
 * Development method: vibe-coded
 * Vibe-coding percentage: 95%
 */
export class ${safeName} implements L3ApplicationConstruct {
  readonly level = 'L3'
  private config: ${safeName}Config
  
  constructor(config: ${safeName}Config) {
    this.config = config
  }

  async build(): Promise<void> {
    console.log('Building application...')
    // Build logic
  }

  async deploy(target: string): Promise<void> {
    console.log(\`Deploying to \${target}...\`)
    // Deployment logic
  }

  async startDevelopment(): Promise<void> {
    console.log('Starting development mode...')
    // Dev server logic
  }

  async startProduction(): Promise<void> {
    console.log('Starting production mode...')
    // Production server logic
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      components: {}
    }
  }

  async getMetrics() {
    return {
      requests: 0,
      errors: 0,
      latency: 0
    }
  }

  getVersion(): string {
    return '1.0.0'
  }

  getType() {
    return 'Application'
  }

  getLevel() {
    return this.level
  }

  static metadata = {
    id: '${kebabName}',
    name: '${name}',
    level: 'L3',
    description: 'Complete deployable application',
    version: '1.0.0',
    author: 'Love Claude Code Platform',
    selfReferential: {
      isPlatformConstruct: true,
      developmentMethod: 'vibe-coded',
      vibeCodingPercentage: 95,
      builtWith: ['L2-patterns'],
      canBuildConstructs: true,
      timeToCreate: 45
    }
  }
}

export default ${safeName}`
        },
        {
          path: '/README.md',
          content: `# ${name}

L3 Application Construct for Love Claude Code platform.

## Level: L3 (Application)

This application provides:
- Complete, deployable solution
- Built with multiple L2 patterns
- Production-ready with monitoring
- Self-contained and configurable

## Usage

\`\`\`typescript
import { ${safeName} } from '@love-claude-code/${kebabName}'

const app = new ${safeName}({
  name: 'my-app'
})

// Development
await app.startDevelopment()

// Production
await app.deploy('production')
await app.startProduction()
\`\`\`

## Development Guidelines

1. Complete, deployable applications
2. Combine multiple L2 patterns
3. Include all necessary infrastructure
4. Production-ready with monitoring
5. Self-contained and configurable

## Self-Referential Metadata

- **Platform Construct**: Yes
- **Development Method**: Vibe-coded
- **Vibe-Coding**: 95%
- **Built With**: L2 patterns
- **Can Build Constructs**: Yes
- **Time to Create**: 45 minutes
`
        },
        {
          path: '/package.json',
          content: JSON.stringify({
            name: `@love-claude-code/${kebabName}`,
            version: '1.0.0',
            description: `${name} - L3 Application Construct`,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
              build: 'tsc',
              test: 'jest',
              dev: 'tsx watch src/index.ts',
              start: 'node dist/index.js'
            },
            dependencies: {
              '@love-claude-code/constructs': '^1.0.0'
            },
            devDependencies: {
              '@types/node': '^20.0.0',
              typescript: '^5.0.0',
              jest: '^29.0.0',
              tsx: '^4.0.0'
            },
            keywords: ['construct', 'L3', 'application', 'love-claude-code']
          }, null, 2)
        },
        {
          path: '/tsconfig.json',
          content: JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              lib: ['ES2020'],
              module: 'ESNext',
              moduleResolution: 'node',
              declaration: true,
              declarationMap: true,
              outDir: './dist',
              rootDir: './src',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noImplicitReturns: true,
              noFallthroughCasesInSwitch: true,
              esModuleInterop: true,
              skipLibCheck: true,
              allowSyntheticDefaultImports: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true
            },
            include: ['src'],
            exclude: ['node_modules', 'dist', 'tests']
          }, null, 2)
        }
      ]
      
    default:
      return []
  }
}