import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, HardDrive } from 'lucide-react';
import { isElectron } from '@utils/electronDetection';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isElectronMode, setIsElectronMode] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    setIsElectronMode(isElectron());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Claude CLI status if in Electron
    if (isElectron()) {
      checkClaudeStatus();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkClaudeStatus = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      const status = await electronAPI.claude.checkCLI();
      setClaudeStatus(status.installed && status.authenticated ? 'connected' : 'disconnected');
    } catch {
      setClaudeStatus('disconnected');
    }
  };

  if (!isElectronMode && isOnline) {
    return null; // Don't show indicator when online in web mode
  }

  const getStatusInfo = () => {
    if (isElectronMode) {
      return {
        icon: <HardDrive className="w-4 h-4" />,
        text: claudeStatus === 'connected' ? 'Local Mode' : 'Local Mode (Claude Offline)',
        color: claudeStatus === 'connected' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50',
        description: claudeStatus === 'connected' 
          ? 'Running locally with Claude CLI' 
          : 'Running locally - Claude CLI not connected'
      };
    } else if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Offline',
        color: 'text-red-600 bg-red-50',
        description: 'No internet connection'
      };
    }
    return {
      icon: <Wifi className="w-4 h-4" />,
      text: 'Online',
      color: 'text-green-600 bg-green-50',
      description: 'Connected to internet'
    };
  };

  const status = getStatusInfo();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${className} flex items-center`}
      >
        <div 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.color} dark:bg-opacity-20`}
          title={status.description}
        >
          {status.icon}
          <span className="hidden sm:inline">{status.text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};