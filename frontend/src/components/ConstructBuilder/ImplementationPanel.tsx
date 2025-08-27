import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { linter, Diagnostic } from '@codemirror/lint';
import { motion } from 'framer-motion';
import { Package, AlertCircle, Sparkles, Info } from 'lucide-react';
import { useConstructStore } from '../../stores/constructStore';
import { getConstructSnippets, getConstructImports } from '../../constructs/utils/snippets';
import { ConstructLevel } from '../../constructs/types';

export const ImplementationPanel: React.FC = () => {
  const {
    currentConstruct,
    updateImplementation,
    generateImplementation,
    isGeneratingWithAI,
    validationResults,
    resolvedDependencies
  } = useConstructStore();

  const [code, setCode] = useState('');
  const [showDependencies, setShowDependencies] = useState(false);

  useEffect(() => {
    if (currentConstruct?.implementation) {
      setCode(currentConstruct.implementation);
    }
  }, [currentConstruct]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    updateImplementation(value);
  };

  // Custom autocomplete for construct APIs
  const constructAutocomplete = (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || word.from === word.to) return null;

    const snippets = getConstructSnippets(currentConstruct?.metadata.level || ConstructLevel.L0);
    const imports = getConstructImports(currentConstruct?.metadata.level || ConstructLevel.L0);

    const options = [
      ...snippets.map(snippet => ({
        label: snippet.label,
        type: 'snippet',
        detail: snippet.detail,
        apply: snippet.code
      })),
      ...imports.map(imp => ({
        label: imp.label,
        type: 'import',
        detail: imp.detail,
        apply: imp.code
      }))
    ];

    return {
      from: word.from,
      options,
      validFor: /^\w*$/
    };
  };

  // Custom linter for implementation validation
  const implementationLinter = linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const errors = validationResults.errors.filter(e => e.path.includes('implementation'));
    
    errors.forEach(error => {
      // Try to find line number from error
      const lineMatch = error.message.match(/line (\d+)/);
      const line = lineMatch ? parseInt(lineMatch[1]) - 1 : 0;
      const lineInfo = view.state.doc.line(Math.min(line + 1, view.state.doc.lines));
      
      diagnostics.push({
        from: lineInfo.from,
        to: lineInfo.to,
        severity: 'error',
        message: error.message
      });
    });

    return diagnostics;
  });

  const handleGenerateImplementation = async () => {
    await generateImplementation();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-white font-medium">Implementation</h3>
          <button
            onClick={() => setShowDependencies(!showDependencies)}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            <Package className="w-3 h-3" />
            <span>Dependencies ({resolvedDependencies.length})</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {currentConstruct?.specification && !currentConstruct?.implementation && (
            <motion.button
              onClick={handleGenerateImplementation}
              disabled={isGeneratingWithAI}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{isGeneratingWithAI ? 'Generating...' : 'Generate from Spec'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Dependencies Panel */}
      {showDependencies && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-800/50 border-b border-gray-700 px-4 py-3"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Info className="w-4 h-4" />
              <span>Required dependencies for this construct:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resolvedDependencies.map((dep, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm font-mono"
                >
                  {dep.name}@{dep.version}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={handleCodeChange}
          height="100%"
          theme={oneDark}
          extensions={[
            javascript({ jsx: true, typescript: true }),
            autocompletion({
              override: [constructAutocomplete]
            }),
            implementationLinter,
            EditorView.theme({
              '&': { height: '100%' },
              '.cm-scroller': { fontFamily: 'monospace' }
            })
          ]}
          placeholder={`// Implementation for ${currentConstruct?.metadata.name || 'construct'}\n// Use Ctrl+Space for construct-aware autocomplete\n\nimport React from 'react';\n\nexport const ${currentConstruct?.metadata.name || 'MyConstruct'} = () => {\n  return (\n    <div>\n      {/* Your implementation here */}\n    </div>\n  );\n};`}
        />
      </div>

      {/* Validation Errors */}
      {validationResults.errors.filter(e => e.path.includes('implementation')).length > 0 && (
        <div className="border-t border-gray-700 bg-red-900/20 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {validationResults.errors
                .filter(e => e.path.includes('implementation'))
                .map((error, index) => (
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