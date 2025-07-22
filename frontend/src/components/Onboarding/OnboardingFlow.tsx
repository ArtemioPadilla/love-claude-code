import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Check, 
  Code2, Zap, Shield, Globe, 
  Sparkles, Rocket, Settings,
  Download, Terminal, Cloud
} from 'lucide-react';
import { useNavigationStore } from '../Navigation';
import { useSettingsStore } from '@stores/settingsStore';
import { isElectron } from '@utils/electronDetection';
import { useUserPreferencesStore } from '@stores/userPreferencesStore';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { navigate } = useNavigationStore();
  const { settings, updateSettings } = useSettingsStore();
  const { updatePreference } = useUserPreferencesStore();
  const isElectronMode = isElectron();

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Welcome to Love Claude Code',
      description: 'Your AI-powered development platform',
      icon: <Sparkles className="w-8 h-8" />,
      content: (
        <div className="text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Code2 className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text">
            Welcome to Love Claude Code!
          </h2>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            Transform your ideas into code through natural conversation with Claude AI.
            Let's get you set up in just a few steps.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap className="w-4 h-4" />
              <span>Fast Setup</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Globe className="w-4 h-4" />
              <span>Multi-Cloud</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'environment',
      title: 'Choose Your Environment',
      description: 'Select how you want to use Love Claude Code',
      icon: <Globe className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-center mb-8">
            How would you like to use Love Claude Code?
          </h3>
          <div className="grid gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updateSettings({
                  providers: { ...settings.providers, default: 'local' }
                });
                setCompletedSteps(new Set([...completedSteps, currentStep]));
              }}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                settings.providers?.default === 'local'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <Download className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2">
                    {isElectronMode ? 'Desktop App (Current)' : 'Desktop App'}
                  </h4>
                  <p className="text-sm text-gray-400">
                    Run completely offline with Claude CLI integration. 
                    Perfect for privacy-conscious development.
                  </p>
                  {!isElectronMode && (
                    <p className="text-xs text-blue-400 mt-2">
                      Download our desktop app for offline development
                    </p>
                  )}
                </div>
                {settings.providers?.default === 'local' && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updateSettings({
                  providers: { ...settings.providers, default: 'firebase' }
                });
                setCompletedSteps(new Set([...completedSteps, currentStep]));
              }}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                settings.providers?.default === 'firebase'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <Cloud className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2">Cloud Development</h4>
                  <p className="text-sm text-gray-400">
                    Use Firebase or AWS for real-time collaboration and cloud deployment.
                    Access your projects from anywhere.
                  </p>
                </div>
                {settings.providers?.default === 'firebase' && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </motion.button>
          </div>
        </div>
      )
    },
    {
      id: 'claude-setup',
      title: 'Connect Claude AI',
      description: 'Set up your AI assistant',
      icon: <Terminal className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-center mb-8">
            Choose Your Claude Integration
          </h3>
          <div className="grid gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updateSettings({
                  ai: { ...settings.ai, authMethod: 'api-key' }
                });
                setCompletedSteps(new Set([...completedSteps, currentStep]));
              }}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                settings.ai?.authMethod === 'api-key'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2">API Key</h4>
                  <p className="text-sm text-gray-400">
                    Use your Anthropic API key for pay-per-use access.
                    Best for occasional use or testing.
                  </p>
                  <p className="text-xs text-blue-400 mt-2">
                    Get your API key from console.anthropic.com
                  </p>
                </div>
                {settings.ai?.authMethod === 'api-key' && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updateSettings({
                  ai: { ...settings.ai, authMethod: 'oauth' }
                });
                setCompletedSteps(new Set([...completedSteps, currentStep]));
              }}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                settings.ai?.authMethod === 'oauth'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2">Claude Max</h4>
                  <p className="text-sm text-gray-400">
                    Sign in with your Claude.ai account for unlimited usage.
                    Perfect for heavy development work.
                  </p>
                  <p className="text-xs text-green-400 mt-2">
                    $200/month subscription at claude.ai
                  </p>
                </div>
                {settings.ai?.authMethod === 'oauth' && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </motion.button>

            {isElectronMode && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateSettings({
                    ai: { ...settings.ai, authMethod: 'claude-code-cli' }
                  });
                  setCompletedSteps(new Set([...completedSteps, currentStep]));
                }}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  settings.ai?.authMethod === 'claude-code-cli'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-cyan-500/20">
                    <Terminal className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2">Claude CLI</h4>
                    <p className="text-sm text-gray-400">
                      Use the Claude Code CLI for terminal-based interaction.
                      Requires Claude Max subscription.
                    </p>
                    <p className="text-xs text-cyan-400 mt-2">
                      Integrated terminal experience
                    </p>
                  </div>
                  {settings.ai?.authMethod === 'claude-code-cli' && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </motion.button>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start building amazing things',
      icon: <Rocket className="w-8 h-8" />,
      content: (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center"
          >
            <Check className="w-16 h-16 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold">Setup Complete!</h2>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            You're ready to start building with Love Claude Code. 
            Create your first project and let Claude help you bring your ideas to life.
          </p>
          <div className="bg-gray-800 rounded-lg p-6 mt-8 text-left max-w-md mx-auto">
            <h4 className="font-semibold mb-4">Your Configuration:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Environment:</span>
                <span className="text-white capitalize">
                  {settings.providers?.default || 'local'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Claude Integration:</span>
                <span className="text-white">
                  {settings.ai?.authMethod === 'api-key' && 'API Key'}
                  {settings.ai?.authMethod === 'oauth' && 'Claude Max'}
                  {settings.ai?.authMethod === 'claude-code-cli' && 'Claude CLI'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                updatePreference('hasCompletedOnboarding', true);
                navigate('projects');
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-white shadow-lg"
            >
              Create Your First Project
            </motion.button>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(new Set([...completedSteps, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return true; // Welcome step
    if (currentStep === 1) return !!settings.providers?.default; // Environment step
    if (currentStep === 2) return !!settings.ai?.authMethod; // Claude setup step
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center max-w-md w-full">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: index === currentStep ? 1.1 : 1,
                      backgroundColor: index <= currentStep ? '#3B82F6' : '#374151'
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold z-10 flex-shrink-0 ${
                      index <= currentStep ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {completedSteps.has(index) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className="w-24 mx-2">
                      <div
                        className={`h-1 transition-colors ${
                          index < currentStep ? 'bg-blue-500' : 'bg-gray-700'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-sm text-gray-400">{steps[currentStep].title}</h3>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-2xl p-8 shadow-2xl"
          >
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </motion.button>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updatePreference('hasCompletedOnboarding', true);
                navigate('projects');
              }}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Skip Setup
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (currentStep === steps.length - 1) {
                  updatePreference('hasCompletedOnboarding', true);
                  navigate('projects');
                } else {
                  nextStep();
                }
              }}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};