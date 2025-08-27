# TDD Guard Integration Guide

## Overview

TDD Guard is a powerful tool that enforces Test-Driven Development (TDD) principles by monitoring file operations and preventing violations of the Red-Green-Refactor cycle. This guide explains how TDD Guard is integrated into the Love Claude Code platform to ensure high-quality, test-driven development practices.

## What is TDD Guard?

TDD Guard is a file system monitor that:
- 🔴 **Enforces Red Phase**: Only test files can be created/modified first
- 🟢 **Enforces Green Phase**: Implementation files can only be modified after failing tests exist
- 🔵 **Enables Refactor Phase**: Any file can be modified once tests are passing
- 🛡️ **Prevents TDD Violations**: Blocks operations that break the TDD cycle

## Integration Architecture

```
┌─────────────────────────────────────────────────┐
│              Claude Code Hooks                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    ┌─────────────────────┐  │
│  │ PreToolUse   │───▶│  TDD Guard CLI     │  │
│  │   Hooks      │    └──────────┬──────────┘  │
│  └──────────────┘               │              │
│                                 ▼              │
│  ┌──────────────┐    ┌─────────────────────┐  │
│  │ File Write   │◀───│  Validation Result  │  │
│  │  Operation   │    └─────────────────────┘  │
│  └──────────────┘                              │
│                                                 │
├─────────────────────────────────────────────────┤
│           TDD Guard L1 Construct                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    ┌─────────────────────┐  │
│  │ Phase State  │    │ Violation Handler   │  │
│  │  Manager     │    │    & Recovery       │  │
│  └──────────────┘    └─────────────────────┘  │
│                                                 │
│  ┌──────────────┐    ┌─────────────────────┐  │
│  │ Real-time    │    │  Visual Status      │  │
│  │  Monitoring  │    │    Display          │  │
│  └──────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Installation and Setup

### 1. Install TDD Guard

```bash
# Install globally
npm install -g tdd-guard

# Verify installation
tdd-guard --version
```

### 2. Configure Claude Code Hooks

Create or update `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": {
      "matcher": "Write|Edit|MultiEdit",
      "command": "tdd-guard",
      "args": ["--mode", "claude-code"],
      "config": {
        "enabled": true,
        "strictness": "moderate"
      }
    }
  }
}
```

### 3. Project Configuration

Create `.tdd-guard.json` in your project root:

```json
{
  "enabled": true,
  "testFramework": "vitest",
  "testFilePatterns": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.test.tsx",
    "**/*.spec.tsx"
  ],
  "sourceFilePatterns": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "coverage/**"
  ],
  "strictness": "moderate",
  "allowRefactoring": true,
  "customRules": []
}
```

## TDD Workflow with TDD Guard

### Phase 1: Red (Write Failing Tests)

```typescript
// ✅ Allowed: Creating a test file
// SecureForm.test.tsx
describe('SecureForm', () => {
  it('should validate email format', () => {
    const form = new SecureForm()
    expect(form.validateEmail('invalid')).toBe(false)
  })
})

// ❌ Blocked: Creating implementation without tests
// SecureForm.tsx - This will be blocked by TDD Guard
```

### Phase 2: Green (Make Tests Pass)

```typescript
// ✅ Now allowed: Implementing just enough to pass
// SecureForm.tsx
export class SecureForm {
  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}
```

### Phase 3: Refactor (Improve Code)

```typescript
// ✅ Allowed: Refactoring with passing tests
// SecureForm.tsx
export class SecureForm {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  validateEmail(email: string): boolean {
    return this.emailRegex.test(email)
  }
}
```

## TDD Guard L1 Construct

The Love Claude Code platform includes a dedicated L1 construct for TDD Guard integration:

```typescript
import { TDDGuardConstruct } from '@lcc/constructs/L1/infrastructure'

// Initialize TDD Guard with custom configuration
const tddGuard = new TDDGuardConstruct({
  projectPath: process.cwd(),
  config: {
    enabled: true,
    strictness: 'moderate',
    testFramework: 'vitest'
  }
})

// Start monitoring
await tddGuard.startMonitoring()

// Check current phase
const phase = tddGuard.getCurrentPhase() // 'red' | 'green' | 'refactor'

// Handle violations
tddGuard.on('violation', (violation) => {
  console.error(`TDD Violation: ${violation.message}`)
})
```

## Configuration Options

### Strictness Levels

#### Strict Mode
- No implementation without failing tests
- No refactoring without passing tests
- Enforces pure TDD workflow

```json
{
  "strictness": "strict",
  "allowRefactoring": false
}
```

#### Moderate Mode (Recommended)
- Allows minor adjustments during implementation
- Permits import statements and type definitions
- Balances enforcement with practicality

```json
{
  "strictness": "moderate",
  "allowRefactoring": true
}
```

#### Loose Mode
- Warnings instead of blocks
- Allows emergency fixes
- Good for gradual adoption

```json
{
  "strictness": "loose",
  "warnOnly": true
}
```

### Custom Rules

Extend TDD Guard with custom validation rules:

```json
{
  "customRules": [
    {
      "name": "require-test-description",
      "description": "Tests must have descriptive names",
      "filePattern": "**/*.test.ts",
      "validate": "(content) => content.includes('it(') && !content.includes('it(\'test\'')"
    },
    {
      "name": "no-console-in-tests",
      "description": "No console.log in test files",
      "filePattern": "**/*.test.ts",
      "validate": "(content) => !content.includes('console.log')"
    }
  ]
}
```

## Integration with Love Claude Code Features

### 1. TDD Workflow Component

The platform's TDD workflow component automatically integrates with TDD Guard:

```typescript
import { TDDWorkflow } from '@lcc/components/TDD'

<TDDWorkflow
  specification="User authentication with email validation"
  onPhaseChange={(phase) => {
    // TDD Guard automatically syncs with phase changes
  }}
  tddGuardEnabled={true}
/>
```

### 2. Vibe Coding Safety

TDD Guard works seamlessly with the Vibe Coding Safety service:

```typescript
import { vibeCodingSafety } from '@lcc/services/safety'

// Start a vibe-coding session with TDD enforcement
const sessionId = await vibeCodingSafety.startSession(
  "Implement secure form validation"
)

// TDD Guard ensures all AI-generated code follows TDD
```

### 3. Claude Code Editor Integration

The editor shows real-time TDD status:

```typescript
// Editor displays current TDD phase
// Red: Write tests
// Green: Implement code
// Blue: Refactor

// Violations appear as editor warnings
// Phase transitions update automatically
```

## Advanced Features

### Phase Detection

TDD Guard intelligently detects the current phase:

```typescript
interface PhaseDetection {
  phase: 'red' | 'green' | 'refactor'
  reasoning: string
  testStatus: {
    total: number
    passing: number
    failing: number
  }
  allowedOperations: string[]
}
```

### Violation Recovery

When a violation occurs, TDD Guard provides recovery options:

```typescript
interface ViolationRecovery {
  violation: {
    type: string
    message: string
    severity: 'error' | 'warning'
  }
  suggestions: string[]
  autoFix?: () => Promise<void>
}
```

### Multi-Project Support

Manage TDD Guard across multiple projects:

```typescript
// Global configuration
~/.tdd-guard/config.json

// Project overrides
./project1/.tdd-guard.json
./project2/.tdd-guard.json
```

## Troubleshooting

### Common Issues

#### TDD Guard Not Triggering

1. **Check Hook Configuration**
   ```bash
   # Verify hooks are configured
   cat .claude/settings.json | grep PreToolUse
   ```

2. **Verify TDD Guard Installation**
   ```bash
   # Check global installation
   which tdd-guard
   tdd-guard --version
   ```

3. **Check File Patterns**
   ```bash
   # Test pattern matching
   tdd-guard check-patterns "src/components/MyComponent.tsx"
   ```

#### False Positive Violations

1. **Adjust Strictness**
   ```json
   {
     "strictness": "moderate",
     "allowedDuringRed": ["type definitions", "interfaces"]
   }
   ```

2. **Add Exclusions**
   ```json
   {
     "excludePatterns": [
       "**/*.d.ts",
       "**/*.config.ts",
       "**/migrations/**"
     ]
   }
   ```

#### Performance Issues

1. **Optimize Watch Patterns**
   ```json
   {
     "watchPatterns": ["src/**/*.{ts,tsx}"],
     "ignorePatterns": ["**/*.generated.ts"]
   }
   ```

2. **Use Debouncing**
   ```json
   {
     "debounceMs": 500,
     "batchOperations": true
   }
   ```

## Best Practices

### 1. Start with Tests
```typescript
// Always begin with a failing test
test('feature should work as specified', () => {
  expect(feature()).toBe(expected)
})
```

### 2. Minimal Implementation
```typescript
// Implement just enough to make tests pass
function feature() {
  return expected // Simplest solution first
}
```

### 3. Refactor with Confidence
```typescript
// With passing tests, refactor freely
function feature() {
  // Now add proper implementation
  // Tests ensure nothing breaks
}
```

### 4. Use Phase Indicators
```typescript
// Use comments to indicate phase
// 🔴 RED: Writing failing test
// 🟢 GREEN: Making test pass
// 🔵 REFACTOR: Improving code
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: TDD Compliance Check

on: [push, pull_request]

jobs:
  tdd-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install TDD Guard
        run: npm install -g tdd-guard
      
      - name: Check TDD Compliance
        run: tdd-guard check --ci
      
      - name: Generate Report
        run: tdd-guard report --format=markdown > tdd-report.md
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('fs').readFileSync('tdd-report.md', 'utf8')
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            })
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

tdd-guard check --staged || {
  echo "TDD violation detected. Please follow Red-Green-Refactor cycle."
  exit 1
}
```

## Metrics and Reporting

### TDD Compliance Metrics

```typescript
interface TDDMetrics {
  compliance: {
    percentage: number
    violations: number
    successfulCycles: number
  }
  phases: {
    timeInRed: number
    timeInGreen: number
    timeInRefactor: number
  }
  productivity: {
    testsWritten: number
    codeWritten: number
    refactorings: number
  }
}
```

### Generate Reports

```bash
# Generate detailed TDD report
tdd-guard report --detailed

# Export metrics
tdd-guard metrics --export=json > tdd-metrics.json

# Visual dashboard
tdd-guard dashboard --port=8080
```

## Migration Guide

### Adopting TDD Guard in Existing Projects

1. **Start with Loose Mode**
   ```json
   {
     "strictness": "loose",
     "migrationMode": true
   }
   ```

2. **Gradually Increase Strictness**
   - Week 1-2: Warnings only
   - Week 3-4: Block new files
   - Week 5+: Full enforcement

3. **Add Tests for Existing Code**
   ```bash
   # Generate test stubs
   tdd-guard generate-tests --missing
   ```

## Summary

TDD Guard integration in Love Claude Code ensures:
- ✅ **Quality**: All code is test-driven
- ✅ **Confidence**: Refactoring is safe
- ✅ **Documentation**: Tests document behavior
- ✅ **Safety**: AI-generated code follows TDD
- ✅ **Learning**: Developers improve TDD skills

By enforcing the Red-Green-Refactor cycle, TDD Guard helps maintain high code quality while accelerating development through AI assistance.

For more information:
- [Vibe Coding Safety Guide](./VIBE_CODING_SAFETY.md)
- [Construct Development Guide](./CONSTRUCT_DEVELOPMENT_GUIDE.md)
- [TDD Guard GitHub Repository](https://github.com/nizos/tdd-guard)