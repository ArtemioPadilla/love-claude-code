#!/usr/bin/env node

/**
 * TDD Status Monitor
 * Shows current TDD phase and test status
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Read TDD Guard state if available
function getTDDGuardState() {
  try {
    const statePath = path.join(__dirname, '..', '.tdd-guard-state.json');
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (error) {
    // State file might not exist yet
  }
  return null;
}

// Get test results from last run
function getTestResults() {
  try {
    const resultsPath = path.join(__dirname, '..', 'frontend', 'test-results.json');
    if (fs.existsSync(resultsPath)) {
      return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }
  } catch (error) {
    // Results file might not exist yet
  }
  return null;
}

// Determine current TDD phase based on test results
function determineTDDPhase(testResults, guardState) {
  if (guardState && guardState.phase) {
    return guardState.phase;
  }
  
  if (!testResults) {
    return 'red'; // No tests yet, start with red
  }
  
  const { numFailedTests, numPassedTests, numTotalTests } = testResults;
  
  if (numFailedTests > 0) {
    return 'red'; // Tests failing, in red phase
  } else if (numPassedTests === numTotalTests && numTotalTests > 0) {
    return 'green'; // All tests passing, can refactor
  }
  
  return 'red'; // Default to red phase
}

// Main status display
function displayStatus() {
  console.log(`${colors.bold}\n╔══════════════════════════════════════╗`);
  console.log(`║       TDD Status Monitor             ║`);
  console.log(`╚══════════════════════════════════════╝${colors.reset}\n`);
  
  const guardState = getTDDGuardState();
  const testResults = getTestResults();
  const phase = determineTDDPhase(testResults, guardState);
  
  // Display current phase
  const phaseColors = {
    red: colors.red,
    green: colors.green,
    refactor: colors.blue,
    blue: colors.blue
  };
  
  const phaseEmojis = {
    red: '🔴',
    green: '🟢',
    refactor: '🔵',
    blue: '🔵'
  };
  
  const phaseMessages = {
    red: 'Write a failing test',
    green: 'Make the test pass',
    refactor: 'Improve code quality',
    blue: 'Improve code quality'
  };
  
  console.log(`${colors.bold}Current Phase:${colors.reset}`);
  console.log(`${phaseEmojis[phase]} ${phaseColors[phase]}${phase.toUpperCase()} Phase${colors.reset}`);
  console.log(`${colors.cyan}➜ ${phaseMessages[phase]}${colors.reset}\n`);
  
  // Display test statistics
  if (testResults) {
    console.log(`${colors.bold}Test Statistics:${colors.reset}`);
    console.log(`Total Tests: ${testResults.numTotalTests || 0}`);
    console.log(`${colors.green}✓ Passed: ${testResults.numPassedTests || 0}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${testResults.numFailedTests || 0}${colors.reset}`);
    console.log(`${colors.yellow}⊘ Skipped: ${testResults.numPendingTests || 0}${colors.reset}\n`);
    
    // Display test suites
    if (testResults.testResults && testResults.testResults.length > 0) {
      console.log(`${colors.bold}Test Suites:${colors.reset}`);
      testResults.testResults.forEach(suite => {
        const status = suite.numFailingTests > 0 ? colors.red + '✗' : colors.green + '✓';
        console.log(`${status} ${path.basename(suite.name)}${colors.reset}`);
      });
      console.log();
    }
  } else {
    console.log(`${colors.yellow}No test results found. Run tests first.${colors.reset}\n`);
  }
  
  // Display TDD Guard status
  console.log(`${colors.bold}TDD Guard:${colors.reset}`);
  if (guardState && guardState.enabled) {
    console.log(`${colors.green}✓ Enabled${colors.reset}`);
    console.log(`Violations: ${guardState.violations || 0}`);
    console.log(`Enforcement: ${guardState.enforcement || 'medium'}`);
  } else {
    console.log(`${colors.yellow}⚠ Not active${colors.reset}`);
    console.log(`Run 'npm run tdd:guard' to enable`);
  }
  
  // Display next steps
  console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
  switch (phase) {
    case 'red':
      console.log('1. Write a failing test for the next feature');
      console.log('2. Run tests to confirm they fail');
      console.log('3. Move to green phase');
      break;
    case 'green':
      console.log('1. Write minimal code to make tests pass');
      console.log('2. Run tests to confirm they pass');
      console.log('3. Consider refactoring if needed');
      break;
    case 'refactor':
    case 'blue':
      console.log('1. Improve code structure and quality');
      console.log('2. Ensure tests still pass');
      console.log('3. Return to red phase for next feature');
      break;
  }
  
  console.log(`\n${colors.cyan}Commands:${colors.reset}`);
  console.log('• npm run tdd:cycle    - Run full TDD cycle');
  console.log('• npm run test:frontend - Run tests');
  console.log('• npm run e2e          - Run E2E tests');
  console.log('• npm run tdd:guard    - Enable TDD Guard');
  console.log('• npm run tdd:guard:off - Disable TDD Guard');
}

// Run the status display
displayStatus();