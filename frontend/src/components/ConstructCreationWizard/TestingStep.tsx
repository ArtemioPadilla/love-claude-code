import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiPlay, FiInfo, FiRefreshCw } from 'react-icons/fi'
import { WizardData } from './ConstructCreationWizard'
import Editor from '@monaco-editor/react'

interface TestingStepProps {
  data: WizardData
  errors: Record<string, string>
  onUpdate: (updates: Partial<WizardData>) => void
}

interface TestCase {
  name: string
  description: string
  code: string
  expected: string | number | boolean | object | null
  type: 'unit' | 'integration' | 'e2e'
  status?: 'pending' | 'running' | 'passed' | 'failed'
  error?: string
}

export function TestingStep({ data, errors, onUpdate }: TestingStepProps) {
  const [showTestForm, setShowTestForm] = useState(false)
  const [activeTest, setActiveTest] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [newTest, setNewTest] = useState<TestCase>({
    name: '',
    description: '',
    code: '',
    expected: '',
    type: 'unit'
  })
  
  // Generate test cases from specification
  const generateTests = async () => {
    setIsGenerating(true)
    
    // Simulate test generation from natural language spec
    setTimeout(() => {
      const generatedTests: TestCase[] = []
      
      // Generate unit tests for each input
      data.inputs.forEach((input) => {
        generatedTests.push({
          name: `should validate ${input.name} input`,
          description: `Tests that ${input.name} is properly validated`,
          type: 'unit',
          code: `test('validates ${input.name}', async () => {
  const input = {
    ${input.name}: ${input.type === 'string' ? '"test value"' : input.type === 'number' ? '123' : 'true'}
  };
  
  const result = await ${data.name}(input);
  expect(result).toBeDefined();
  expect(result.${data.outputs[0]?.name || 'result'}).toBeTruthy();
});`,
          expected: 'Test passes with valid input'
        })
        
        if (input.required) {
          generatedTests.push({
            name: `should fail without required ${input.name}`,
            description: `Tests that ${input.name} is required`,
            type: 'unit',
            code: `test('requires ${input.name}', async () => {
  const input = {};
  
  await expect(${data.name}(input)).rejects.toThrow('${input.name} is required');
});`,
            expected: 'Throws error when required field is missing'
          })
        }
      })
      
      // Generate integration test
      generatedTests.push({
        name: 'should integrate with dependencies',
        description: 'Tests integration with dependent constructs',
        type: 'integration',
        code: `test('integrates with dependencies', async () => {
  // Setup dependencies
  ${data.dependencies.map(dep => `const ${dep.constructId} = await setup${dep.constructId}();`).join('\n  ')}
  
  const input = {
    ${data.inputs.filter(i => i.required).map(i => `${i.name}: ${i.type === 'string' ? '"test"' : '123'}`).join(',\n    ')}
  };
  
  const result = await ${data.name}(input);
  
  // Verify integration
  expect(result).toBeDefined();
  ${data.outputs.map(o => `expect(result.${o.name}).toBeDefined();`).join('\n  ')}
});`,
        expected: 'All integrations work correctly'
      })
      
      // Generate e2e test
      generatedTests.push({
        name: 'end-to-end workflow',
        description: 'Tests complete workflow from input to output',
        type: 'e2e',
        code: `test('complete workflow', async () => {
  // Setup
  const testData = {
    ${data.inputs.map(i => `${i.name}: ${i.type === 'string' ? '"production value"' : 'productionConfig'}`).join(',\n    ')}
  };
  
  // Execute
  const result = await ${data.name}(testData);
  
  // Verify outputs
  ${data.outputs.map(o => `expect(result.${o.name}).toMatchSnapshot();`).join('\n  ')}
  
  // Cleanup
  await cleanup(result);
});`,
        expected: 'Complete workflow executes successfully'
      })
      
      onUpdate({
        testCases: [...data.testCases, ...generatedTests]
      })
      
      setIsGenerating(false)
    }, 2000)
  }
  
  const addTest = () => {
    if (newTest.name && newTest.code) {
      onUpdate({
        testCases: [...data.testCases, newTest]
      })
      setNewTest({
        name: '',
        description: '',
        code: '',
        expected: '',
        type: 'unit'
      })
      setShowTestForm(false)
    }
  }
  
  const removeTest = (index: number) => {
    onUpdate({
      testCases: data.testCases.filter((_, i) => i !== index)
    })
  }
  
  const runTest = (index: number) => {
    // Simulate test execution
    const updatedTests = [...data.testCases]
    updatedTests[index] = { ...updatedTests[index], status: 'running' }
    onUpdate({ testCases: updatedTests })
    
    setTimeout(() => {
      // Randomly pass or fail for demo
      const passed = Math.random() > 0.2
      updatedTests[index] = {
        ...updatedTests[index],
        status: passed ? 'passed' : 'failed',
        error: passed ? undefined : 'Expected value to be truthy, but got false'
      }
      onUpdate({ testCases: updatedTests })
    }, 1500)
  }
  
  const runAllTests = () => {
    data.testCases.forEach((_, index) => {
      runTest(index)
    })
  }
  
  // Calculate coverage
  const coverage = data.testCases.length > 0
    ? Math.min(100, (data.testCases.length / (data.inputs.length + data.outputs.length)) * 100)
    : 0
  
  return (
    <div className="space-y-6">
      {/* Test Generation */}
      <div className="p-4 bg-accent/20 rounded-lg border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium">Test Generation</h3>
            <p className="text-sm text-muted-foreground">
              Generate test cases from your specification
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateTests}
            disabled={isGenerating || !data.naturalLanguageSpec}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isGenerating || !data.naturalLanguageSpec
                ? 'bg-accent/50 text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isGenerating ? (
              <FiRefreshCw className="animate-spin" size={16} />
            ) : (
              <FiPlus size={16} />
            )}
            {isGenerating ? 'Generating...' : 'Generate Tests'}
          </motion.button>
        </div>
        {!data.naturalLanguageSpec && (
          <p className="text-sm text-yellow-500">
            Complete the specification step first to enable test generation
          </p>
        )}
      </div>
      
      {/* Test Cases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Test Cases</h3>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runAllTests}
              disabled={data.testCases.length === 0}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-sm ${
                data.testCases.length === 0
                  ? 'bg-accent/50 text-muted-foreground cursor-not-allowed'
                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
              }`}
            >
              <FiPlay size={14} />
              Run All
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTestForm(true)}
              className="flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all text-sm"
            >
              <FiPlus size={14} />
              Add Test
            </motion.button>
          </div>
        </div>
        
        {errors.testCases && (
          <p className="text-red-500 text-sm mb-2">{errors.testCases}</p>
        )}
        
        {/* Test List */}
        {data.testCases.length > 0 ? (
          <div className="space-y-3">
            {data.testCases.map((test, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border/50 rounded-lg overflow-hidden"
              >
                <div
                  className="p-3 bg-accent/10 cursor-pointer hover:bg-accent/20 transition-all"
                  onClick={() => setActiveTest(activeTest === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        test.status === 'passed' ? 'bg-green-500' :
                        test.status === 'failed' ? 'bg-red-500' :
                        test.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {test.type} • {test.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          runTest(index)
                        }}
                        className="p-1 rounded hover:bg-accent/50 transition-all"
                      >
                        <FiPlay size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTest(index)
                        }}
                        className="p-1 rounded hover:bg-accent/50 transition-all text-red-500"
                      >
                        <FiX size={14} />
                      </motion.button>
                    </div>
                  </div>
                  {test.error && (
                    <p className="text-xs text-red-500 mt-2">{test.error}</p>
                  )}
                </div>
                
                <AnimatePresence>
                  {activeTest === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="h-48 border-t border-border/50">
                        <Editor
                          height="100%"
                          defaultLanguage="typescript"
                          value={test.code}
                          onChange={(value) => {
                            const updatedTests = [...data.testCases]
                            updatedTests[index] = { ...test, code: value || '' }
                            onUpdate({ testCases: updatedTests })
                          }}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 12
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No test cases yet.</p>
            <p className="text-sm mt-1">Generate tests from your specification or add manually.</p>
          </div>
        )}
        
        {/* Add Test Form */}
        <AnimatePresence>
          {showTestForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-accent/10 border border-border/50 rounded-lg p-4 space-y-3"
            >
              <div className="grid grid-cols-[1fr,auto] gap-3">
                <input
                  type="text"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="Test name"
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                />
                <select
                  value={newTest.type}
                  onChange={(e) => setNewTest({ ...newTest, type: e.target.value as any })}
                  className="px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="unit">Unit</option>
                  <option value="integration">Integration</option>
                  <option value="e2e">E2E</option>
                </select>
              </div>
              <input
                type="text"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Test description"
                className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
              />
              <div className="h-32 border border-border/50 rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={newTest.code}
                  onChange={(value) => setNewTest({ ...newTest, code: value || '' })}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12
                  }}
                />
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addTest}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm"
                >
                  Add Test
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTestForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent/50 transition-all text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Test Configuration */}
      <div>
        <h3 className="text-lg font-medium mb-3">Test Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Coverage Target
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={data.coverageTarget}
                onChange={(e) => onUpdate({ coverageTarget: parseInt(e.target.value) })}
                className="flex-1"
              />
              <div className="w-20 text-center">
                <span className={`text-lg font-medium ${
                  coverage >= data.coverageTarget ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {Math.round(coverage)}%
                </span>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <div className="w-20 text-center">
                <span className="text-lg font-medium">{data.coverageTarget}%</span>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Framework
              </label>
              <select
                value={data.testConfiguration.framework}
                onChange={(e) => onUpdate({
                  testConfiguration: {
                    ...data.testConfiguration,
                    framework: e.target.value as any
                  }
                })}
                className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="jest">Jest</option>
                <option value="vitest">Vitest</option>
                <option value="mocha">Mocha</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Execution Environment
              </label>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={data.testConfiguration.runInDocker}
                  onChange={(e) => onUpdate({
                    testConfiguration: {
                      ...data.testConfiguration,
                      runInDocker: e.target.checked
                    }
                  })}
                  className="rounded border-border"
                />
                Run in Docker container
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Testing Best Practices:</strong>
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Write tests for all critical functionality</li>
              <li>Include both positive and negative test cases</li>
              <li>Test edge cases and error conditions</li>
              <li>Use meaningful test names that describe what is being tested</li>
              <li>Aim for at least 80% code coverage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}