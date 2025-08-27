import React from 'react'
import { motion } from 'framer-motion'
import { Hammer, FileCode, TestTube, GitBranch, Package, Rocket, CheckCircle, Book, Sparkles, Code2 } from 'lucide-react'

const ConstructDevelopmentGuide: React.FC = () => {
  const developmentPhases = [
    {
      phase: 'Planning',
      icon: <Book className="w-6 h-6" />,
      duration: '1-2 hours',
      tasks: [
        'Define construct purpose and scope',
        'Research similar constructs',
        'Design API and interfaces',
        'Plan test scenarios'
      ]
    },
    {
      phase: 'Setup',
      icon: <FileCode className="w-6 h-6" />,
      duration: '30 minutes',
      tasks: [
        'Create construct project',
        'Set up file structure',
        'Configure metadata',
        'Initialize git repository'
      ]
    },
    {
      phase: 'Implementation',
      icon: <Code2 className="w-6 h-6" />,
      duration: '2-8 hours',
      tasks: [
        'Write core functionality',
        'Implement error handling',
        'Add validation logic',
        'Create helper utilities'
      ]
    },
    {
      phase: 'Testing',
      icon: <TestTube className="w-6 h-6" />,
      duration: '1-3 hours',
      tasks: [
        'Write unit tests',
        'Create integration tests',
        'Test edge cases',
        'Performance benchmarks'
      ]
    },
    {
      phase: 'Documentation',
      icon: <Book className="w-6 h-6" />,
      duration: '1-2 hours',
      tasks: [
        'Write API documentation',
        'Create usage examples',
        'Document limitations',
        'Add troubleshooting guide'
      ]
    },
    {
      phase: 'Publishing',
      icon: <Rocket className="w-6 h-6" />,
      duration: '30 minutes',
      tasks: [
        'Version and tag release',
        'Submit to marketplace',
        'Announce to community',
        'Monitor feedback'
      ]
    }
  ]

  const constructTypes = [
    {
      level: 'L0',
      name: 'Primitives',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      examples: ['Button', 'TextInput', 'WebSocket', 'FileStorage'],
      complexity: 'Low',
      timeEstimate: '2-4 hours'
    },
    {
      level: 'L1',
      name: 'Components',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      examples: ['SecureForm', 'AuthenticatedAPI', 'CachedDatabase'],
      complexity: 'Medium',
      timeEstimate: '4-8 hours'
    },
    {
      level: 'L2',
      name: 'Patterns',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      examples: ['CRUDSystem', 'RealtimeChat', 'DeploymentPipeline'],
      complexity: 'High',
      timeEstimate: '1-3 days'
    },
    {
      level: 'L3',
      name: 'Applications',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      examples: ['AdminDashboard', 'EcommerceStore', 'ProjectManager'],
      complexity: 'Very High',
      timeEstimate: '3-7 days'
    }
  ]

  const bestPractices = [
    {
      category: 'Design',
      practices: [
        'Start with clear specifications',
        'Design for reusability',
        'Keep interfaces simple',
        'Follow single responsibility principle'
      ]
    },
    {
      category: 'Code Quality',
      practices: [
        'Write clean, readable code',
        'Use TypeScript for type safety',
        'Handle errors gracefully',
        'Optimize for performance'
      ]
    },
    {
      category: 'Testing',
      practices: [
        'Aim for 80%+ test coverage',
        'Test edge cases thoroughly',
        'Include performance tests',
        'Test in isolation'
      ]
    },
    {
      category: 'Documentation',
      practices: [
        'Document as you code',
        'Include real-world examples',
        'Explain the why, not just how',
        'Keep docs up to date'
      ]
    }
  ]

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Hammer className="w-10 h-10 text-amber-500" />
          Construct Development Guide
        </h1>
        <p className="text-xl text-gray-400">
          Complete guide to creating high-quality constructs from concept to publication
        </p>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Building Blocks of the Future</h2>
        <p className="text-gray-300 mb-4">
          Constructs are the heart of Love Claude Code. By creating constructs, you're not just building 
          components for your own use – you're contributing to a growing ecosystem that helps developers 
          worldwide build better software faster.
        </p>
        <p className="text-gray-300">
          This guide walks you through the complete process of developing a construct, from initial idea 
          to published component, following best practices that ensure quality, reusability, and maintainability.
        </p>
      </motion.div>

      {/* Construct Types Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Choose Your Construct Level</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {constructTypes.map((type, index) => (
            <motion.div
              key={type.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`${type.bgColor} rounded-xl p-6 border border-gray-700`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    <span className={`${type.color} font-mono`}>{type.level}</span> - {type.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Complexity: {type.complexity} • Time: {type.timeEstimate}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-300">Examples:</h4>
                <div className="flex flex-wrap gap-2">
                  {type.examples.map((example) => (
                    <span key={example} className="px-3 py-1 bg-gray-800 rounded-md text-sm">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Development Workflow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">End-to-End Development Workflow</h2>
        <div className="space-y-6">
          {developmentPhases.map((phase, index) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    {phase.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{phase.phase}</h3>
                  <span className="text-sm text-gray-400">({phase.duration})</span>
                </div>
                <ul className="grid md:grid-cols-2 gap-2">
                  {phase.tasks.map((task, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Example: Creating an L1 Construct */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Example: Creating a Secure Form Construct</h2>
        <div className="space-y-4">
          {/* Step 1: Project Setup */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-amber-400">Step 1:</span> Project Setup
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# Create new construct project
npx create-construct secure-form --level L1 --type ui

# Project structure created:
secure-form/
├── definition.yaml       # Construct metadata
├── src/
│   ├── SecureForm.tsx   # Implementation
│   └── index.ts         # Exports
├── tests/
│   └── SecureForm.test.tsx
├── examples/
│   └── basic-usage.tsx
└── README.md`}</pre>
            </div>
          </div>

          {/* Step 2: Define Metadata */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-amber-400">Step 2:</span> Define Metadata
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# definition.yaml
id: secure-form
name: Secure Form
version: 1.0.0
level: L1
type: ui
category: forms

description: |
  A form component with built-in security features including
  CSRF protection, input validation, and XSS prevention.

dependencies:
  - form-primitive@^1.0.0
  - validation-primitive@^1.0.0
  - csrf-token-primitive@^1.0.0

inputs:
  - name: fields
    type: FormField[]
    required: true
    description: Form field definitions
  
  - name: onSubmit
    type: (data: any) => Promise<void>
    required: true
    description: Form submission handler

outputs:
  - name: formData
    type: object
    description: Validated form data
  
  - name: errors
    type: ValidationError[]
    description: Validation errors if any`}</pre>
            </div>
          </div>

          {/* Step 3: Implementation */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-amber-400">Step 3:</span> Implementation
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`// SecureForm.tsx
import React, { useState } from 'react'
import { FormPrimitive } from '@lcc/form-primitive'
import { ValidationPrimitive } from '@lcc/validation-primitive'
import { CSRFTokenPrimitive } from '@lcc/csrf-token-primitive'
import { L1UIConstruct } from '@lcc/constructs'

export class SecureForm extends L1UIConstruct {
  private form: FormPrimitive
  private validator: ValidationPrimitive
  private csrf: CSRFTokenPrimitive
  
  constructor(config: SecureFormConfig) {
    super(config)
    this.initializeDependencies()
  }
  
  private initializeDependencies() {
    this.form = new FormPrimitive()
    this.validator = new ValidationPrimitive()
    this.csrf = new CSRFTokenPrimitive()
  }
  
  async onSubmit(data: any) {
    // Validate CSRF token
    if (!this.csrf.validate(data._token)) {
      throw new Error('Invalid CSRF token')
    }
    
    // Validate inputs
    const errors = await this.validator.validate(data, this.config.fields)
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    // Sanitize data
    const sanitized = this.sanitizeInputs(data)
    
    // Call user's submit handler
    await this.config.onSubmit(sanitized)
    return { success: true, data: sanitized }
  }
  
  render() {
    return (
      <this.form.Component
        fields={this.config.fields}
        onSubmit={this.onSubmit.bind(this)}
        csrfToken={this.csrf.generate()}
      />
    )
  }
}`}</pre>
            </div>
          </div>

          {/* Step 4: Testing */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-amber-400">Step 4:</span> Testing
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`// SecureForm.test.tsx
describe('SecureForm', () => {
  it('should validate CSRF token', async () => {
    const form = new SecureForm({ fields: [], onSubmit: jest.fn() })
    const invalidSubmit = form.onSubmit({ _token: 'invalid' })
    
    await expect(invalidSubmit).rejects.toThrow('Invalid CSRF token')
  })
  
  it('should sanitize inputs', async () => {
    const onSubmit = jest.fn()
    const form = new SecureForm({ 
      fields: [{ name: 'text', type: 'string' }],
      onSubmit 
    })
    
    await form.onSubmit({ 
      text: '<script>alert("xss")</script>',
      _token: form.csrf.generate()
    })
    
    expect(onSubmit).toHaveBeenCalledWith({
      text: '&lt;script&gt;alert("xss")&lt;/script&gt;'
    })
  })
})`}</pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20"
      >
        <h2 className="text-2xl font-semibold mb-6">Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {bestPractices.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold mb-3 text-amber-400">{category.category}</h3>
              <ul className="space-y-2">
                {category.practices.map((practice, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Assistance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          AI-Powered Development
        </h2>
        <p className="text-gray-300 mb-4">
          Claude can assist at every step of construct development:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-400">Planning & Design</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• API design suggestions</li>
              <li>• Architecture recommendations</li>
              <li>• Dependency analysis</li>
              <li>• Similar construct research</li>
            </ul>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-green-400">Implementation</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Code generation</li>
              <li>• Error handling patterns</li>
              <li>• Performance optimization</li>
              <li>• Security best practices</li>
            </ul>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-purple-400">Testing</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Test case generation</li>
              <li>• Edge case identification</li>
              <li>• Mock creation</li>
              <li>• Coverage analysis</li>
            </ul>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-orange-400">Documentation</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• API documentation</li>
              <li>• Usage examples</li>
              <li>• README generation</li>
              <li>• Migration guides</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Common Pitfalls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Common Pitfalls to Avoid</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-red-400 mt-1">⚠️</span>
            <div>
              <strong>Over-engineering:</strong> Start simple and add features based on real needs
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 mt-1">⚠️</span>
            <div>
              <strong>Poor naming:</strong> Use clear, descriptive names that indicate purpose
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 mt-1">⚠️</span>
            <div>
              <strong>Missing edge cases:</strong> Test with empty, null, and extreme values
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 mt-1">⚠️</span>
            <div>
              <strong>Tight coupling:</strong> Design for loose coupling and high cohesion
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 mt-1">⚠️</span>
            <div>
              <strong>Insufficient docs:</strong> Document the why, not just the what
            </div>
          </div>
        </div>
      </motion.div>

      {/* TDD and Vibe Coding Safety */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20"
      >
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <TestTube className="w-6 h-6 text-blue-400" />
          TDD & Vibe Coding Safety
        </h2>
        
        <div className="space-y-6">
          {/* TDD Guard */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">TDD Guard Integration</h3>
            <p className="text-gray-300 mb-4">
              The platform now includes TDD Guard, which enforces test-driven development practices during vibe-coding (AI-assisted development).
            </p>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Automatic Enforcement:</strong> Blocks code modifications that violate TDD principles
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Phase Tracking:</strong> Guides you through Red → Green → Refactor cycle
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Real-time Monitoring:</strong> Monitors file changes and provides instant feedback
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Claude Code Integration:</strong> Works seamlessly with Claude Code hooks
                </div>
              </div>
            </div>
          </div>

          {/* Vibe Coding Safety */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-purple-400">Vibe Coding Safety Service</h3>
            <p className="text-gray-300 mb-4">
              Comprehensive safety measures for AI-assisted development ensure high-quality, secure code generation.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Security Scanning:</strong> Detects hardcoded secrets, vulnerabilities, and unsafe patterns
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Quality Checks:</strong> Enforces coverage thresholds, complexity limits, and code standards
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>AI Controls:</strong> Limits generation size and enforces specification requirements
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong>Real-time Metrics:</strong> Tracks safety rate, TDD compliance, and violation trends
                </div>
              </div>
            </div>
          </div>

          {/* Usage Example */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-amber-400">Using TDD Guard</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <pre className="text-gray-300">{`# Install TDD Guard globally
npm install -g tdd-guard

# Configure in your project
// .tdd-guard.json
{
  "enabled": true,
  "testFramework": "vitest",
  "strictness": "moderate",
  "watchPatterns": ["src/**/*.ts", "src/**/*.tsx"],
  "excludePatterns": ["node_modules/**", "dist/**"]
}

// The TDD workflow is now enforced:
// 1. 🔴 Red: Write failing tests first
// 2. 🟢 Green: Write minimal code to pass
// 3. 🔵 Refactor: Improve code quality`}</pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Ready to Build?</h2>
        <div className="space-y-3">
          <a href="#construct-builder" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Open ConstructBuilder IDE →
            </h3>
            <p className="text-gray-400 text-sm">Start building your first construct with AI assistance</p>
          </a>
          <a href="#construct-templates" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Browse Templates →
            </h3>
            <p className="text-gray-400 text-sm">Start with pre-configured construct templates</p>
          </a>
          <a href="#marketplace" className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Study Examples →
            </h3>
            <p className="text-gray-400 text-sm">Learn from existing constructs in the marketplace</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default ConstructDevelopmentGuide