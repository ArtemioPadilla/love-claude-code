import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import { motion } from 'framer-motion';
import { useConstructStore } from '../../stores/constructStore';
import { ConstructToolbar } from './ConstructToolbar';
import { SpecificationPanel } from './SpecificationPanel';
import { ImplementationPanel } from './ImplementationPanel';
import { TestPanel } from './TestPanel';
import { PreviewPanel } from './PreviewPanel';

interface ConstructBuilderProps {
  constructId?: string;
}

export const ConstructBuilder: React.FC<ConstructBuilderProps> = ({ constructId }) => {
  const {
    currentConstruct,
    loadConstruct,
    currentPhase,
    phaseProgress,
    validationResults
  } = useConstructStore();

  const [showPreview, setShowPreview] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(30);

  useEffect(() => {
    if (constructId) {
      loadConstruct(constructId);
    }
  }, [constructId, loadConstruct]);

  const isUIConstruct = currentConstruct?.metadata.categories?.includes('ui') || false;

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Toolbar */}
      <ConstructToolbar
        onTogglePreview={() => setShowPreview(!showPreview)}
        showPreview={showPreview}
        isUIConstruct={isUIConstruct}
      />

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Phase:</span>
            <span className="text-white font-medium">
              {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Progress:</span>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${phaseProgress[currentPhase] || 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-gray-300 text-sm">
              {phaseProgress[currentPhase] || 0}%
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {validationResults.errors.length > 0 && (
            <div className="flex items-center space-x-1 text-red-400">
              <span className="text-sm">{validationResults.errors.length} errors</span>
            </div>
          )}
          {validationResults.warnings.length > 0 && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <span className="text-sm">{validationResults.warnings.length} warnings</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Split
          className="split-vertical h-full"
          direction="vertical"
          sizes={[100 - bottomPanelHeight, bottomPanelHeight]}
          minSize={[200, 100]}
          gutterSize={4}
          onDragEnd={(sizes) => setBottomPanelHeight(sizes[1])}
        >
          {/* Top Panel - Editors */}
          <div className="h-full">
            <Split
              className="split-horizontal h-full"
              sizes={showPreview && isUIConstruct ? [33, 34, 33] : [50, 50]}
              minSize={200}
              gutterSize={4}
            >
              {/* Specification Editor */}
              <div className="h-full overflow-hidden">
                <SpecificationPanel />
              </div>

              {/* Implementation Editor */}
              <div className="h-full overflow-hidden">
                <ImplementationPanel />
              </div>

              {/* Preview Panel (UI constructs only) */}
              {showPreview && isUIConstruct && (
                <div className="h-full overflow-hidden">
                  <PreviewPanel />
                </div>
              )}
            </Split>
          </div>

          {/* Bottom Panel - Tests */}
          <div className="h-full overflow-hidden">
            <TestPanel />
          </div>
        </Split>
      </div>
    </div>
  );
};