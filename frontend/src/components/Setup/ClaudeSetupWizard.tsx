import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Download, Terminal, RefreshCw, ExternalLink } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  error?: string;
}

export const ClaudeSetupWizard: React.FC = () => {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'check-cli',
      title: 'Check Claude CLI Installation',
      description: 'Verifying if Claude CLI is installed on your system',
      status: 'pending'
    },
    {
      id: 'check-auth',
      title: 'Check Authentication',
      description: 'Verifying if you are authenticated with Claude',
      status: 'pending'
    },
    {
      id: 'setup-complete',
      title: 'Setup Complete',
      description: 'Ready to use Claude in Love Claude Code',
      status: 'pending'
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);
  const [cliInstalled, setCliInstalled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!window.electronAPI) return;

    setIsChecking(true);
    
    // Update step 1 to checking
    updateStepStatus('check-cli', 'checking');

    try {
      // Check CLI installation
      const cliStatus = await window.electronAPI.claude.checkCLI();
      
      if (cliStatus.installed) {
        setCliInstalled(true);
        updateStepStatus('check-cli', 'success');
        
        // Check authentication
        updateStepStatus('check-auth', 'checking');
        
        if (cliStatus.authenticated) {
          setIsAuthenticated(true);
          updateStepStatus('check-auth', 'success');
          updateStepStatus('setup-complete', 'success');
          
          // Save auth status
          await window.electronAPI.auth.setStatus(true);
        } else {
          updateStepStatus('check-auth', 'error', cliStatus.error || 'Not authenticated');
        }
      } else {
        updateStepStatus('check-cli', 'error', cliStatus.error || 'Claude CLI not installed');
      }
    } catch (error: any) {
      updateStepStatus('check-cli', 'error', error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const updateStepStatus = (stepId: string, status: SetupStep['status'], error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, error }
        : step
    ));
  };

  const openTerminalForInstall = async () => {
    if (!window.electronAPI) return;
    
    try {
      // Open terminal with install command
      const command = process.platform === 'win32' 
        ? 'start cmd /k npm install -g @anthropic-ai/claude-code'
        : `open -a Terminal -n -F -W -- /bin/bash -c "npm install -g @anthropic-ai/claude-code; echo 'Press any key to close...'; read -n 1"`; 
      
      await window.electronAPI.claude.openAuth();
    } catch (error) {
      console.error('Failed to open terminal:', error);
    }
  };

  const openAuthTerminal = async () => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.claude.openAuth();
    } catch (error) {
      console.error('Failed to open auth terminal:', error);
    }
  };

  const getStepIcon = (step: SetupStep) => {
    switch (step.status) {
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Claude Setup Wizard</h2>
        
        <div className="space-y-6">
          {steps.map((step, _index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                {step.error && (
                  <p className="text-red-500 text-sm mt-1">{step.error}</p>
                )}
                
                {/* Action buttons for specific steps */}
                {step.id === 'check-cli' && step.status === 'error' && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={openTerminalForInstall}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Terminal className="w-4 h-4" />
                      <span>Install Claude CLI</span>
                    </button>
                    <p className="text-sm text-gray-500">
                      Or run manually: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">npm install -g @anthropic-ai/claude-code</code>
                    </p>
                  </div>
                )}
                
                {step.id === 'check-auth' && step.status === 'error' && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={openAuthTerminal}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Terminal className="w-4 h-4" />
                      <span>Authenticate with Claude</span>
                    </button>
                    <p className="text-sm text-gray-500">
                      Or run manually: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">claude setup-token</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Success message */}
        {steps.every(step => step.status === 'success') && (
          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                Setup complete! You can now use Claude in Love Claude Code.
              </p>
            </div>
          </div>
        )}

        {/* Retry button */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check Again</span>
          </button>
          
          <a
            href="https://docs.anthropic.com/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors"
          >
            <span>Documentation</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};