/**
 * TDD Guard L1 Infrastructure Construct Definition
 */

import { ConstructDefinition } from '../../types'

export const tddGuardDefinition: ConstructDefinition = {
  id: 'platform-l1-tdd-guard',
  name: 'TDD Guard',
  type: 'Infrastructure',
  level: 'L1',
  version: '1.0.0',
  description: 'Enforces test-driven development practices through file monitoring and validation',
  author: 'Love Claude Code Team',
  tags: ['tdd', 'testing', 'development-workflow', 'quality-assurance', 'automation'],
  categories: ['infrastructure', 'developer-tools', 'testing'],
  license: 'MIT',
  dependencies: [],
  inputs: [
    {
      name: 'config',
      type: 'TDDGuardConfig',
      description: 'TDD Guard configuration',
      required: true,
      schema: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'Enable TDD enforcement'
          },
          watchPatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'File patterns to monitor'
          },
          excludePatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'File patterns to exclude'
          },
          testFramework: {
            type: 'string',
            enum: ['vitest', 'jest', 'pytest'],
            description: 'Test framework'
          },
          strictness: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Strictness level'
          },
          allowRefactoring: {
            type: 'boolean',
            description: 'Allow refactoring phase'
          }
        },
        required: ['enabled', 'watchPatterns', 'testFramework']
      }
    }
  ],
  outputs: [
    {
      name: 'status',
      type: 'TDDStatus',
      description: 'Current TDD status including phase and test metrics'
    },
    {
      name: 'violations',
      type: 'TDDViolation[]',
      description: 'List of TDD violations detected'
    }
  ],
  capabilities: [
    'tdd-enforcement',
    'file-monitoring',
    'test-validation',
    'phase-tracking',
    'violation-reporting',
    'claude-code-hook-integration'
  ],
  security: [
    {
      aspect: 'file-system-monitoring',
      description: 'Monitors file system changes in real-time',
      severity: 'medium',
      recommendations: [
        'Limit monitoring to project directories only',
        'Exclude sensitive files from monitoring',
        'Use read-only access where possible'
      ]
    },
    {
      aspect: 'process-management',
      description: 'Manages TDD Guard process lifecycle',
      severity: 'low',
      recommendations: [
        'Run with minimal privileges',
        'Implement process isolation',
        'Monitor resource usage'
      ]
    }
  ],
  pricing: {
    model: 'Free',
    description: 'Open source tool with no licensing costs'
  },
  examples: [
    {
      title: 'Basic TDD Enforcement',
      description: 'Enable TDD Guard with default settings',
      code: `const tddGuard = new TDDGuardConstruct({
  config: {
    enabled: true,
    watchPatterns: ['src/**/*.ts', 'src/**/*.tsx'],
    excludePatterns: ['node_modules/**', 'dist/**'],
    testFramework: 'vitest',
    strictness: 'medium',
    allowRefactoring: true
  }
})`,
      language: 'typescript'
    },
    {
      title: 'Custom Validation Rules',
      description: 'Add custom validation rules for specific workflows',
      code: `const tddGuard = new TDDGuardConstruct({
  config: {
    enabled: true,
    watchPatterns: ['src/**/*.ts'],
    testFramework: 'jest',
    strictness: 'high',
    customRules: [
      {
        name: 'require-test-coverage',
        description: 'All new code must have test coverage',
        validate: (change) => {
          // Custom validation logic
          return hasTestCoverage(change.path)
        },
        severity: 'error'
      }
    ]
  }
})`,
      language: 'typescript'
    },
    {
      title: 'Claude Code Hook Integration',
      description: 'Configure TDD Guard as a Claude Code hook',
      code: `// In .claude/settings.json
{
  "hooks": {
    "PreToolUse": {
      "matcher": "Write|Edit|MultiEdit|TodoWrite",
      "command": "tdd-guard",
      "args": ["--config", ".tdd-guard.json"]
    }
  }
}

// TDD Guard config
const config = {
  enabled: true,
  hookConfig: {
    type: 'PreToolUse',
    matcher: 'Write|Edit|MultiEdit'
  },
  watchPatterns: ['**/*.ts', '**/*.py'],
  testFramework: 'vitest',
  strictness: 'medium'
}`,
      language: 'typescript'
    }
  ],
  bestPractices: [
    'Start with TDD enforcement disabled during onboarding',
    'Gradually increase strictness as team adapts',
    'Use custom rules for project-specific requirements',
    'Integrate with CI/CD pipelines',
    'Monitor violation trends over time',
    'Provide clear error messages for violations',
    'Allow temporary disabling for emergency fixes',
    'Document TDD workflow for team members',
    'Use phase indicators in IDE/editor',
    'Celebrate successful TDD cycles'
  ],
  troubleshooting: [
    {
      issue: 'TDD Guard not detecting file changes',
      solution: 'Ensure file patterns match your project structure and Claude Code hooks are configured'
    },
    {
      issue: 'Too many false positive violations',
      solution: 'Adjust strictness level or add exclude patterns for generated files'
    },
    {
      issue: 'Test framework not recognized',
      solution: 'Verify test framework configuration and ensure test reporter is set up'
    }
  ],
  providers: ['local'],
  selfReferential: {
    usedToBuildItself: true,
    vibecodingLevel: 95,
    rationale: 'TDD Guard ensures high-quality vibe-coded constructs by enforcing test-first development',
    benefits: [
      'Prevents untested code from being committed',
      'Ensures AI-generated code follows TDD principles',
      'Provides safety net for rapid development',
      'Maintains code quality during vibe-coding sessions'
    ]
  },
  c4: {
    type: 'Component',
    technology: 'TypeScript/Node.js',
    containerType: 'DevelopmentTool'
  },
  performance: {
    cpuUsage: 'Low',
    memoryUsage: 'Low (< 50MB)',
    networkUsage: 'None',
    storageUsage: 'Minimal (logs and state)',
    notes: [
      'File monitoring is event-based, not polling',
      'Minimal overhead during development',
      'No impact on production code'
    ]
  },
  relationships: [
    {
      from: 'tdd-guard',
      to: 'local',
      description: 'Integrates via hooks system',
      technology: 'PreToolUse hook'
    },
    {
      from: 'tdd-guard',
      to: 'test-framework',
      description: 'Monitors test execution',
      technology: 'Test reporter API'
    },
    {
      from: 'tdd-guard',
      to: 'file-system',
      description: 'Monitors file changes',
      technology: 'File watcher'
    }
  ]
}