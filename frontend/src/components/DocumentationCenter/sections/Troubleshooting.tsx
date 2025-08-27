import React from 'react'
import { motion } from 'framer-motion'
import { Info, Terminal, FileCode, Package, Settings, Shield, Wrench } from 'lucide-react'

const Troubleshooting: React.FC = () => {
  const commonIssues = [
    {
      category: 'Build Errors',
      icon: <Package className="w-5 h-5" />,
      issues: [
        {
          title: 'TypeScript Enum vs String Literal Mismatch',
          description: 'Getting errors about ConstructLevel enum types not matching string literals',
          solution: 'Use ConstructLevel enum values directly instead of string literals. Import from construct types.',
          code: `// ❌ Wrong
level: 'L0'

// ✅ Correct
import { ConstructLevel } from './types'
level: ConstructLevel.L0`
        },
        {
          title: 'Duplicate Declarations',
          description: 'TypeScript complains about duplicate identifiers or keys in objects',
          solution: 'Check for duplicate property names, method names, or imports with same names',
          code: `// ❌ Wrong - duplicate declaration
import { SSOConfiguration } from './auth'
interface SSOConfiguration { ... }

// ✅ Correct - rename one
import { SSOConfiguration as SSOConfigData } from './auth'
interface SSOConfiguration { ... }`
        },
        {
          title: 'Dynamic Import Warnings',
          description: 'Vite warns about dynamic imports that cannot be analyzed',
          solution: 'Add @vite-ignore comment before dynamic imports',
          code: `// ✅ Suppress Vite warning
/* @vite-ignore */
const module = await import(packageName)`
        },
        {
          title: 'Missing UI Component Imports',
          description: 'Cannot find module ../ui/card or similar UI component imports',
          solution: 'Check case sensitivity - UI components are in ../UI/ (uppercase) not ../ui/',
          code: `// ❌ Wrong
import { Card } from '../ui/Card'

// ✅ Correct
import { Card } from '../UI/Card'`
        }
      ]
    },
    {
      category: 'TDD Guard Issues',
      icon: <Shield className="w-5 h-5" />,
      issues: [
        {
          title: 'TDD Guard Not Detecting Changes',
          description: 'File modifications not triggering TDD Guard validation',
          solution: 'Ensure Claude Code hooks are configured and file patterns match your project',
          code: `// Check .claude/settings.json
{
  "hooks": {
    "PreToolUse": {
      "matcher": "Write|Edit|MultiEdit",
      "command": "tdd-guard"
    }
  }
}`
        },
        {
          title: 'TDD Guard CLI Errors',
          description: 'Failed to parse hook data or command not found',
          solution: 'Install TDD Guard globally and ensure it\'s in PATH',
          code: `# Install globally
npm install -g tdd-guard

# Verify installation
tdd-guard --version`
        },
        {
          title: 'False Positive Violations',
          description: 'Getting violations for valid TDD workflow',
          solution: 'Adjust strictness level or add custom rules for your workflow',
          code: `// .tdd-guard.json
{
  "strictness": "moderate", // or "loose"
  "allowRefactoring": true,
  "customRules": []
}`
        }
      ]
    },
    {
      category: 'Vibe Coding Safety',
      icon: <FileCode className="w-5 h-5" />,
      issues: [
        {
          title: 'Security Scanning False Positives',
          description: 'Getting security violations for safe code patterns',
          solution: 'Configure allowed patterns and adjust security rules',
          code: `// Configure in VibeCodingSafety
aiControls: {
  allowedPatterns: [
    '^import\\\\s+',
    '^export\\\\s+',
    // Add your patterns
  ],
  blockedPatterns: [
    'eval\\\\(',
    // Customize blocked patterns
  ]
}`
        },
        {
          title: 'Code Generation Size Limits',
          description: 'AI generation exceeds maximum size limit',
          solution: 'Break down large generations into smaller components',
          code: `// Increase limit if needed
aiControls: {
  maxGenerationSize: 20000, // Default is 10000
}`
        }
      ]
    },
    {
      category: 'Provider Connection',
      icon: <Settings className="w-5 h-5" />,
      issues: [
        {
          title: 'Firebase Connection Failed',
          description: 'Cannot connect to Firebase services',
          solution: 'Check Firebase configuration and ensure emulators are running for local development',
          code: `# Start Firebase emulators
npm run firebase:emulators

# Check .env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id`
        },
        {
          title: 'AWS Provider Timeout',
          description: 'AWS SDK operations timing out',
          solution: 'Verify AWS credentials and region configuration',
          code: `# Set AWS credentials
export AWS_PROFILE=your-profile
export AWS_REGION=us-west-2

# Or in .env.local
VITE_AWS_REGION=us-west-2
VITE_AWS_ACCESS_KEY_ID=your-key`
        }
      ]
    },
    {
      category: 'Development Environment',
      icon: <Terminal className="w-5 h-5" />,
      issues: [
        {
          title: 'Port Already in Use',
          description: 'Cannot start dev server - port 3000 is already in use',
          solution: 'Kill the process using the port or use a different port',
          code: `# Find process using port
lsof -i :3000
# Kill it
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001`
        },
        {
          title: 'Node Version Issues',
          description: 'Package installation fails or features not working',
          solution: 'Ensure you\'re using Node.js 20+ and correct npm version',
          code: `# Check versions
node --version  # Should be v20+
npm --version   # Should be 10+

# Use nvm to switch
nvm use 20`
        }
      ]
    }
  ]

  const quickFixes = [
    {
      title: 'Clear All Caches',
      icon: <Wrench className="w-4 h-4" />,
      command: 'npm run clean && rm -rf node_modules && npm install'
    },
    {
      title: 'Reset TypeScript',
      icon: <FileCode className="w-4 h-4" />,
      command: 'rm -rf tsconfig.tsbuildinfo && npm run type-check'
    },
    {
      title: 'Fix Permissions',
      icon: <Shield className="w-4 h-4" />,
      command: 'chmod -R 755 scripts/ && chmod +x scripts/*.sh'
    },
    {
      title: 'Update Dependencies',
      icon: <Package className="w-4 h-4" />,
      command: 'npm update && npm audit fix'
    }
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold mb-4">Troubleshooting</h1>
      <p className="text-xl text-gray-400">
        Solutions to common issues and build errors.
      </p>

      {/* Quick Fixes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-400" />
          Quick Fixes
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {quickFixes.map((fix, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {fix.icon}
                {fix.title}
              </h3>
              <code className="text-sm bg-gray-900 rounded px-2 py-1 block">
                {fix.command}
              </code>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Common Issues */}
      {commonIssues.map((category, categoryIndex) => (
        <motion.div
          key={category.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * (categoryIndex + 1) }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            {category.icon}
            {category.category}
          </h2>
          <div className="space-y-6">
            {category.issues.map((issue, issueIndex) => (
              <div key={issueIndex} className="border-l-4 border-gray-700 pl-4">
                <h3 className="text-lg font-semibold mb-2 text-amber-400">
                  {issue.title}
                </h3>
                <p className="text-gray-300 mb-3">
                  <strong>Problem:</strong> {issue.description}
                </p>
                <p className="text-gray-300 mb-3">
                  <strong>Solution:</strong> {issue.solution}
                </p>
                {issue.code && (
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{issue.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Need More Help?</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-1" />
            <div>
              <p className="text-gray-300">
                Check the <a href="#logs" className="text-blue-400 hover:underline">logs directory</a> for detailed error messages
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-1" />
            <div>
              <p className="text-gray-300">
                Join our <a href="#community" className="text-blue-400 hover:underline">Discord community</a> for real-time support
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-1" />
            <div>
              <p className="text-gray-300">
                Report bugs on <a href="https://github.com/love-claude-code/issues" className="text-blue-400 hover:underline">GitHub Issues</a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Troubleshooting