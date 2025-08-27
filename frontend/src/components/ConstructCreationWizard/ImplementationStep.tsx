import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCode, FiCheck, FiX, FiInfo, FiRefreshCw, FiEye } from 'react-icons/fi'
import { WizardData } from './ConstructCreationWizard'
import Editor from '@monaco-editor/react'
import { ConstructLevel } from '../../constructs/types'

interface ImplementationStepProps {
  data: WizardData
  errors: Record<string, string>
  onUpdate: (updates: Partial<WizardData>) => void
}

const boilerplateTemplates = {
  L0: {
    UI: `import React from 'react'
import { L0PrimitiveConstruct } from '../../constructs/base/L0Construct'

export interface ${'{name}'}Props {
  // Define your props here based on inputs
}

export class ${'{name}'} extends L0PrimitiveConstruct {
  render(props: ${'{name}'}Props) {
    return (
      <div>
        {/* Implement your UI primitive here */}
      </div>
    )
  }
}`,
    Infrastructure: `import { L0PrimitiveConstruct } from '../../constructs/base/L0Construct'

export interface ${'{name}'}Props {
  // Define your props here based on inputs
}

export class ${'{name}'} extends L0PrimitiveConstruct {
  async deploy(props: ${'{name}'}Props) {
    // Implement your infrastructure primitive here
    return {
      // Return outputs
    }
  }
}`
  },
  L1: {
    default: `import { L1ConfiguredConstruct } from '../../constructs/base/L1Construct'

export interface ${'{name}'}Props {
  // Define your props here based on inputs
}

export class ${'{name}'} extends L1ConfiguredConstruct {
  configure(options: ${'{name}'}Props) {
    // Configure your L0 primitives here
  }
  
  async build() {
    // Build and return your configured construct
    return {
      // Return outputs
    }
  }
}`
  },
  L2: {
    default: `import { L2PatternConstruct } from '../../constructs/base/L2Construct'

export interface ${'{name}'}Props {
  // Define your props here based on inputs
}

export class ${'{name}'} extends L2PatternConstruct {
  validate(): boolean {
    // Validate pattern configuration
    return true
  }
  
  compose() {
    // Compose L1 constructs into pattern
  }
  
  async deploy() {
    // Deploy the pattern
    return {
      // Return outputs
    }
  }
}`
  },
  L3: {
    default: `import { L3ApplicationConstruct } from '../../constructs/base/L3Construct'

export interface ${'{name}'}Props {
  // Define your props here based on inputs
}

export class ${'{name}'} extends L3ApplicationConstruct {
  async build() {
    // Build the application
  }
  
  async deploy(target: string) {
    // Deploy to target environment
  }
  
  async startDevelopment() {
    // Start development mode
  }
  
  async startProduction() {
    // Start production mode
  }
  
  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      components: {}
    }
  }
  
  async getMetrics() {
    return {
      // Return application metrics
    }
  }
  
  getVersion(): string {
    return '${'{version}'}'
  }
}`
  }
}

export function ImplementationStep({ data, errors, onUpdate }: ImplementationStepProps) {
  const [validationResults, setValidationResults] = useState<{
    passed: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Generate boilerplate code
  const generateBoilerplate = () => {
    if (!data.level || !data.name) return
    
    setIsGenerating(true)
    
    setTimeout(() => {
      let template = ''
      
      if (data.level === ConstructLevel.L0 && data.type) {
        template = boilerplateTemplates.L0[data.type as keyof typeof boilerplateTemplates.L0] || ''
      } else if (data.level && boilerplateTemplates[data.level as keyof typeof boilerplateTemplates]) {
        template = (boilerplateTemplates[data.level as keyof typeof boilerplateTemplates] as any).default || ''
      }
      
      // Replace placeholders
      let code = template
        .replace(/\$\{'{name}'\}/g, data.name)
        .replace(/\$\{'{version}'\}/g, data.version)
      
      // Add inputs to interface
      const inputsCode = data.inputs.map(input => 
        `  ${input.name}${input.required ? '' : '?'}: ${input.type}; // ${input.description}`
      ).join('\n')
      
      code = code.replace('// Define your props here based on inputs', inputsCode)
      
      // Add implementation hints based on specification
      if (data.naturalLanguageSpec) {
        code = `/**
 * ${data.name}
 * 
 * ${data.description}
 * 
 * Specification:
 * ${data.naturalLanguageSpec.split('\n').join('\n * ')}
 */

${code}`
      }
      
      onUpdate({
        implementationCode: code,
        boilerplateUsed: `${data.level}-${data.type || 'default'}`
      })
      
      setIsGenerating(false)
    }, 1500)
  }
  
  // Validate implementation
  const validateImplementation = useCallback(async () => {
    // Simulate validation
    setTimeout(() => {
      const results = {
        passed: true,
        errors: [] as string[],
        warnings: [] as string[]
      }
      
      // Check for required elements
      if (!data.implementationCode.includes('export class')) {
        results.errors.push('Implementation must export a class')
        results.passed = false
      }
      
      if (!data.implementationCode.includes(`extends ${data.level}`)) {
        results.warnings.push(`Consider extending the base ${data.level} construct class`)
      }
      
      // Check for inputs implementation
      data.inputs.forEach(input => {
        if (!data.implementationCode.includes(input.name)) {
          results.warnings.push(`Input "${input.name}" not found in implementation`)
        }
      })
      
      // Check for outputs implementation
      data.outputs.forEach(output => {
        if (!data.implementationCode.includes(output.name)) {
          results.warnings.push(`Output "${output.name}" not found in implementation`)
        }
      })
      
      // Check for test coverage
      if (data.testCases.length === 0) {
        results.warnings.push('No test cases defined')
      }
      
      setValidationResults(results)
      onUpdate({ liveValidationPassed: results.passed })
    }, 2000)
  }, [data.implementationCode, data.level, data.inputs, data.outputs, data.testCases, onUpdate])
  
  // Generate preview URL (simulated)
  const generatePreview = () => {
    if (data.type === 'UI') {
      onUpdate({
        previewUrl: `http://localhost:3000/preview/${data.name.toLowerCase().replace(/\s+/g, '-')}`
      })
      setShowPreview(true)
    }
  }
  
  useEffect(() => {
    // Auto-validate when code changes
    if (data.implementationCode) {
      const timer = setTimeout(() => {
        validateImplementation()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [data.implementationCode, validateImplementation])
  
  return (
    <div className="space-y-6">
      {/* Implementation Options */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Implementation</h3>
          <p className="text-sm text-muted-foreground">
            Write the code for your construct
          </p>
        </div>
        <div className="flex gap-2">
          {data.type === 'UI' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generatePreview}
              className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-all text-sm"
            >
              <FiEye size={14} />
              Preview
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateBoilerplate}
            disabled={isGenerating || !data.level}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-sm ${
              isGenerating || !data.level
                ? 'bg-accent/50 text-muted-foreground cursor-not-allowed'
                : 'bg-primary/10 hover:bg-primary/20'
            }`}
          >
            {isGenerating ? (
              <FiRefreshCw className="animate-spin" size={14} />
            ) : (
              <FiCode size={14} />
            )}
            {isGenerating ? 'Generating...' : 'Generate Boilerplate'}
          </motion.button>
        </div>
      </div>
      
      {/* Code Editor */}
      <div>
        <div className="h-96 border border-border/50 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={data.implementationCode}
            onChange={(value) => onUpdate({ implementationCode: value || '' })}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        </div>
        {errors.implementationCode && (
          <p className="text-red-500 text-sm mt-1">{errors.implementationCode}</p>
        )}
      </div>
      
      {/* Validation Results */}
      {validationResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            validationResults.passed
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            {validationResults.passed ? (
              <>
                <FiCheck className="text-green-500" size={20} />
                <span className="font-medium text-green-500">Validation Passed</span>
              </>
            ) : (
              <>
                <FiX className="text-red-500" size={20} />
                <span className="font-medium text-red-500">Validation Failed</span>
              </>
            )}
          </div>
          
          {validationResults.errors.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-red-500 mb-1">Errors:</p>
              <ul className="text-sm space-y-1">
                {validationResults.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResults.warnings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-500 mb-1">Warnings:</p>
              <ul className="text-sm space-y-1">
                {validationResults.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
      
      {errors.validation && (
        <p className="text-red-500 text-sm">{errors.validation}</p>
      )}
      
      {/* Preview */}
      <AnimatePresence>
        {showPreview && data.previewUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <div className="bg-accent/20 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium">Preview</span>
                <span className="text-xs text-muted-foreground">{data.previewUrl}</span>
              </div>
              <div className="h-64 bg-background/50 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Preview would be rendered here
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Self-Referential Options */}
      <div>
        <h3 className="text-lg font-medium mb-3">Self-Referential Metadata</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.selfReferential.isPlatformConstruct}
              onChange={(e) => onUpdate({
                selfReferential: {
                  ...data.selfReferential,
                  isPlatformConstruct: e.target.checked
                }
              })}
              className="rounded border-border"
            />
            This construct is part of the Love Claude Code platform
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Development Method
              </label>
              <select
                value={data.selfReferential.developmentMethod}
                onChange={(e) => onUpdate({
                  selfReferential: {
                    ...data.selfReferential,
                    developmentMethod: e.target.value as any
                  }
                })}
                className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="vibe-coded">Vibe-Coded (AI Generated)</option>
                <option value="manual">Manual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Vibe-Coding Percentage
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={data.selfReferential.vibeCodingPercentage}
                  onChange={(e) => onUpdate({
                    selfReferential: {
                      ...data.selfReferential,
                      vibeCodingPercentage: parseInt(e.target.value)
                    }
                  })}
                  className="flex-1"
                />
                <span className="w-12 text-center">{data.selfReferential.vibeCodingPercentage}%</span>
              </div>
            </div>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.selfReferential.canBuildConstructs || false}
              onChange={(e) => onUpdate({
                selfReferential: {
                  ...data.selfReferential,
                  canBuildConstructs: e.target.checked
                }
              })}
              className="rounded border-border"
            />
            This construct can build other constructs
          </label>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Implementation Guidelines:</strong>
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Follow the construct level patterns (L0-L3)</li>
              <li>Implement all specified inputs and outputs</li>
              <li>Include proper error handling and validation</li>
              <li>Write clear, maintainable code with comments</li>
              <li>Consider performance and scalability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}