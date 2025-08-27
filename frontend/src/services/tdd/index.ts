/**
 * TDD Services Export
 * Central export point for all TDD-related services
 */

export { TDDWorkflow } from './TDDWorkflow'
export { TestRunner } from './TestRunner'
export { TestGenerator } from './TestGenerator'
export { SpecificationParser } from './SpecificationParser'
export { MockGenerator } from './MockGenerator'
export { CoverageAnalyzer } from './CoverageAnalyzer'
export { SpecValidator } from './SpecValidator'
export { TraceabilityMatrix } from './TraceabilityMatrix'
export { TDDGuardIntegration, tddGuardIntegration } from './TDDGuardIntegration'
export { PlaywrightIntegration, playwrightIntegration } from './PlaywrightIntegration'

// Initialize and connect services
import { tddGuardIntegration } from './TDDGuardIntegration'
import { playwrightIntegration } from './PlaywrightIntegration'
import { TDDWorkflow } from './TDDWorkflow'
import { TestRunner } from './TestRunner'

// Create workflow and runner instances
const workflow = new TDDWorkflow()
const runner = new TestRunner()

// Connect TDD Guard to workflow
tddGuardIntegration.connectWorkflow(workflow)

// Connect Playwright to workflow and runner
playwrightIntegration.connectToWorkflow(workflow)
playwrightIntegration.connectToTestRunner(runner)

// Export configured instances
export const tddWorkflow = workflow
export const testRunner = runner

// Enable TDD Guard by default in development
if (process.env.NODE_ENV === 'development') {
  tddGuardIntegration.enableEnforcement()
  console.log('🛡️ TDD Guard enabled for development')
}

// Export utility function to get current TDD status
export function getTDDStatus() {
  return {
    guard: tddGuardIntegration.getStatus(),
    workflow: workflow.getState(),
    playwright: {
      initialized: !!playwrightIntegration.getPage(),
      browser: playwrightIntegration.getBrowser() ? 'connected' : 'disconnected'
    }
  }
}