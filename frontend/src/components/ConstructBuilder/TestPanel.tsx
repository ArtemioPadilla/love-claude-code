import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCode,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useConstructStore } from '../../stores/constructStore';

interface TestPanelProps {}

export const TestPanel: React.FC<TestPanelProps> = () => {
  const {
    currentConstruct,
    testResults,
    runTests,
    updateTests,
    isRunningTests,
    testCoverage
  } = useConstructStore();

  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showGeneratedTests, setShowGeneratedTests] = useState(true);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [testCode, setTestCode] = useState('');

  useEffect(() => {
    if (currentConstruct?.tests) {
      setTestCode(currentConstruct.tests);
    }
  }, [currentConstruct]);

  const handleTestCodeChange = (value: string) => {
    setTestCode(value);
    updateTests(value);
  };

  const toggleSuite = (suiteName: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteName)) {
      newExpanded.delete(suiteName);
    } else {
      newExpanded.add(suiteName);
    }
    setExpandedSuites(newExpanded);
  };

  const getTestIcon = (status: 'passed' | 'failed' | 'skipped') => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const testSuites = testResults?.suites || [];
  const totalTests = testSuites.reduce((acc, suite) => acc + suite.tests.length, 0);
  const passedTests = testSuites.reduce(
    (acc, suite) => acc + suite.tests.filter(t => t.status === 'passed').length,
    0
  );
  const failedTests = testSuites.reduce(
    (acc, suite) => acc + suite.tests.filter(t => t.status === 'failed').length,
    0
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-medium">Tests</h3>
            {testResults && (
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-400">Total: {totalTests}</span>
                <span className="text-green-400">Passed: {passedTests}</span>
                <span className="text-red-400">Failed: {failedTests}</span>
                {testCoverage && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">Coverage:</span>
                    <span className="text-blue-400">{testCoverage.percentage}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGeneratedTests(!showGeneratedTests)}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {showGeneratedTests ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showGeneratedTests ? 'Hide' : 'Show'} Generated</span>
            </button>
            <motion.button
              onClick={runTests}
              disabled={isRunningTests || !testCode}
              className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRunningTests ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>{isRunningTests ? 'Running...' : 'Run Tests'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Test Results */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-800/50 overflow-y-auto">
          {testSuites.length > 0 ? (
            <div className="p-2">
              {testSuites.map((suite) => (
                <div key={suite.name} className="mb-2">
                  <button
                    onClick={() => toggleSuite(suite.name)}
                    className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-700/50 transition-colors"
                  >
                    {expandedSuites.has(suite.name) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <FileCode className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 flex-1 text-left">{suite.name}</span>
                    <span className="text-xs text-gray-500">
                      {suite.tests.filter(t => t.status === 'passed').length}/{suite.tests.length}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSuites.has(suite.name) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-6 mt-1 space-y-1"
                      >
                        {suite.tests.map((test) => (
                          <button
                            key={test.name}
                            onClick={() => setSelectedTest(`${suite.name}-${test.name}`)}
                            className={`w-full flex items-center space-x-2 p-2 rounded text-sm transition-colors ${
                              selectedTest === `${suite.name}-${test.name}`
                                ? 'bg-gray-700'
                                : 'hover:bg-gray-700/50'
                            }`}
                          >
                            {getTestIcon(test.status)}
                            <span className="text-gray-300 flex-1 text-left truncate">
                              {test.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {test.duration ? `${test.duration}ms` : ''}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {isRunningTests ? 'Running tests...' : 'No test results yet'}
            </div>
          )}
        </div>

        {/* Test Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CodeMirror
            value={testCode}
            onChange={handleTestCodeChange}
            height="100%"
            theme={oneDark}
            extensions={[
              javascript({ jsx: true, typescript: true }),
              EditorView.theme({
                '&': { height: '100%' },
                '.cm-scroller': { fontFamily: 'monospace' }
              })
            ]}
            placeholder={`// Test suite for ${currentConstruct?.metadata.name || 'construct'}\n// Generated tests will appear here after specification is complete\n\nimport { render, screen } from '@testing-library/react';\nimport { ${currentConstruct?.metadata.name || 'MyConstruct'} } from './implementation';\n\ndescribe('${currentConstruct?.metadata.name || 'MyConstruct'}', () => {\n  test('renders correctly', () => {\n    render(<${currentConstruct?.metadata.name || 'MyConstruct'} />);\n    // Add your assertions here\n  });\n});`}
          />

          {/* Selected Test Details */}
          {selectedTest && (
            <div className="border-t border-gray-700 bg-gray-800 p-4 max-h-48 overflow-y-auto">
              {(() => {
                const [suiteName, testName] = selectedTest.split('-');
                const suite = testSuites.find(s => s.name === suiteName);
                const test = suite?.tests.find(t => t.name === testName);
                
                if (!test) return null;
                
                return (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTestIcon(test.status)}
                      <h4 className="text-white font-medium">{test.name}</h4>
                    </div>
                    {test.error && (
                      <div className="bg-red-900/20 border border-red-800 rounded p-3">
                        <pre className="text-sm text-red-300 whitespace-pre-wrap">
                          {test.error}
                        </pre>
                      </div>
                    )}
                    {test.coverage && (
                      <div className="text-sm text-gray-400">
                        <p>Lines: {test.coverage.lines}%</p>
                        <p>Branches: {test.coverage.branches}%</p>
                        <p>Functions: {test.coverage.functions}%</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};