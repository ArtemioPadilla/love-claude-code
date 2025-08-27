import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { linter, Diagnostic } from '@codemirror/lint';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Code, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useConstructStore } from '../../stores/constructStore';

export const SpecificationPanel: React.FC = () => {
  const {
    currentConstruct,
    updateSpecification,
    generateSpecFromDescription,
    isGeneratingWithAI,
    validationResults
  } = useConstructStore();

  const [mode, setMode] = useState<'yaml' | 'natural'>('natural');
  const [naturalLanguageSpec, setNaturalLanguageSpec] = useState('');
  const [yamlContent, setYamlContent] = useState('');

  useEffect(() => {
    if (currentConstruct?.specification) {
      setYamlContent(currentConstruct.specification);
    }
  }, [currentConstruct]);

  const handleNaturalLanguageChange = (value: string) => {
    setNaturalLanguageSpec(value);
  };

  const handleYamlChange = (value: string) => {
    setYamlContent(value);
    updateSpecification(value);
  };

  const handleGenerateFromNatural = async () => {
    if (naturalLanguageSpec.trim()) {
      await generateSpecFromDescription(naturalLanguageSpec);
      setMode('yaml'); // Switch to YAML view after generation
    }
  };

  // Custom linter for YAML validation
  const yamlLinter = linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const errors = validationResults.errors.filter(e => e.path.includes('specification'));
    
    errors.forEach(error => {
      diagnostics.push({
        from: 0,
        to: view.state.doc.length,
        severity: 'error',
        message: error.message
      });
    });

    return diagnostics;
  });

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-white font-medium">Specification</h3>
          <div className="flex rounded-md overflow-hidden">
            <button
              onClick={() => setMode('natural')}
              className={`px-3 py-1 text-sm flex items-center space-x-1 transition-colors ${
                mode === 'natural'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Natural Language</span>
            </button>
            <button
              onClick={() => setMode('yaml')}
              className={`px-3 py-1 text-sm flex items-center space-x-1 transition-colors ${
                mode === 'yaml'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>YAML</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {validationResults.errors.length === 0 && yamlContent && (
            <div className="flex items-center space-x-1 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Valid</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'natural' ? (
            <motion.div
              key="natural"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 p-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Describe your construct in natural language:
                </label>
                <textarea
                  value={naturalLanguageSpec}
                  onChange={(e) => handleNaturalLanguageChange(e.target.value)}
                  placeholder="Example: I need a button component that changes color on hover, supports different sizes (small, medium, large), and can be disabled. It should accept a click handler and display loading state with a spinner."
                  className="w-full h-full p-3 bg-gray-800 text-gray-100 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div className="border-t border-gray-700 p-4">
                <motion.button
                  onClick={handleGenerateFromNatural}
                  disabled={!naturalLanguageSpec.trim() || isGeneratingWithAI}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingWithAI ? 'Generating...' : 'Generate YAML Specification'}</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="yaml"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <CodeMirror
                value={yamlContent}
                onChange={handleYamlChange}
                height="100%"
                theme={oneDark}
                extensions={[
                  yaml(),
                  yamlLinter,
                  EditorView.theme({
                    '&': { height: '100%' },
                    '.cm-scroller': { fontFamily: 'monospace' }
                  })
                ]}
                placeholder={`# Construct Specification\nname: MyConstruct\nlevel: L0\ncategory: ui\ndescription: |\n  Describe what this construct does\n\nprops:\n  - name: propName\n    type: string\n    required: true\n    description: Description of this prop\n\nmethods:\n  - name: methodName\n    description: What this method does\n    parameters:\n      - name: param1\n        type: string\n    returns:\n      type: void\n\ndependencies:\n  - react\n\nexamples:\n  - title: Basic Usage\n    code: |\n      <MyConstruct propName="value" />`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Validation Errors */}
      {mode === 'yaml' && validationResults.errors.length > 0 && (
        <div className="border-t border-gray-700 bg-red-900/20 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {validationResults.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-300">
                  {error.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};