import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Save,
  FileCode2,
  TestTube2,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useConstructStore } from '../../stores/constructStore';
import { ConstructPhase } from '../../constructs/types';

interface ConstructToolbarProps {
  onTogglePreview: () => void;
  showPreview: boolean;
  isUIConstruct?: boolean;
}

export const ConstructToolbar: React.FC<ConstructToolbarProps> = ({
  onTogglePreview,
  showPreview,
  isUIConstruct
}) => {
  const {
    currentConstruct,
    currentPhase,
    saveConstruct,
    transitionPhase,
    runTests,
    generateTests,
    isGeneratingWithAI,
    validationResults
  } = useConstructStore();

  const phases: ConstructPhase[] = ['specification', 'test', 'implementation', 'certification'];
  const phaseIcons = {
    specification: FileCode2,
    test: TestTube2,
    implementation: FileCode2,
    certification: CheckCircle
  };

  const canTransitionToNext = () => {
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex === phases.length - 1) return false;
    
    // Check phase-specific requirements
    switch (currentPhase) {
      case 'specification':
        return validationResults.errors.length === 0 && currentConstruct?.specification;
      case 'test':
        return currentConstruct?.tests && currentConstruct.tests.length > 0;
      case 'implementation':
        return currentConstruct?.implementation && validationResults.errors.length === 0;
      default:
        return false;
    }
  };

  const handlePhaseTransition = () => {
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      transitionPhase(phases[currentIndex + 1]);
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Construct info and phase navigation */}
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {currentConstruct?.metadata.name || 'New Construct'}
            </h2>
            <p className="text-sm text-gray-400">
              {currentConstruct?.metadata.level} • {currentConstruct?.metadata.categories?.[0] || 'general'}
            </p>
          </div>

          {/* Phase indicators */}
          <div className="flex items-center space-x-2">
            {phases.map((phase, index) => {
              const Icon = phaseIcons[phase];
              const isActive = phase === currentPhase;
              const isPast = phases.indexOf(currentPhase) > index;
              
              return (
                <React.Fragment key={phase}>
                  <motion.button
                    onClick={() => transitionPhase(phase)}
                    disabled={!isPast && !isActive}
                    className={`
                      flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    whileHover={isPast || isActive ? { scale: 1.05 } : {}}
                    whileTap={isPast || isActive ? { scale: 0.95 } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </span>
                  </motion.button>
                  {index < phases.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Phase-specific actions */}
          {currentPhase === 'specification' && (
            <motion.button
              onClick={generateTests}
              disabled={isGeneratingWithAI || validationResults.errors.length > 0}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Generate Tests</span>
            </motion.button>
          )}

          {(currentPhase === 'test' || currentPhase === 'implementation') && (
            <motion.button
              onClick={runTests}
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Run Tests</span>
            </motion.button>
          )}

          {/* Save button */}
          <motion.button
            onClick={saveConstruct}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </motion.button>

          {/* Preview toggle (UI constructs only) */}
          {isUIConstruct && (
            <motion.button
              onClick={onTogglePreview}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">{showPreview ? 'Hide' : 'Show'} Preview</span>
            </motion.button>
          )}

          {/* Next phase button */}
          {canTransitionToNext() && (
            <motion.button
              onClick={handlePhaseTransition}
              className="flex items-center space-x-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm font-medium">Next Phase</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Validation messages */}
      {validationResults.errors.length > 0 && (
        <div className="mt-3 flex items-start space-x-2 text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            {validationResults.errors[0].message}
          </div>
        </div>
      )}
    </div>
  );
};