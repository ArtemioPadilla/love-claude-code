/**
 * Electron detection and environment utilities
 */

declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      getPlatformInfo: () => Promise<{ platform: string; arch: string; version: string }>;
      claude: {
        checkCLI: () => Promise<any>;
        execute: (command: string) => Promise<any>;
        executeStream: (command: string, requestId: string) => Promise<any>;
        openAuth: () => Promise<any>;
        setupOAuth: () => Promise<any>;
        checkOAuth: () => Promise<{ exists: boolean; token?: string; path?: string; error?: string }>;
        onStreamData: (requestId: string, callback: (data: string) => void) => () => void;
        onStreamError: (requestId: string, callback: (error: string) => void) => () => void;
        onStreamComplete: (requestId: string, callback: () => void) => () => void;
      };
      auth: {
        getStatus: () => Promise<any>;
        setStatus: (authenticated: boolean, username?: string) => Promise<any>;
        storeApiKey: (apiKey: string) => Promise<any>;
        getApiKey: () => Promise<any>;
        clear: () => Promise<any>;
        getPreferences: () => Promise<any>;
        setPreferences: (preferences: any) => Promise<any>;
      };
      fs: {
        readFile: (filePath: string) => Promise<any>;
        writeFile: (filePath: string, content: string) => Promise<any>;
        listDirectory: (dirPath?: string) => Promise<any>;
        openFileDialog: (options?: any) => Promise<any>;
        saveFileDialog: (options?: any) => Promise<any>;
        watchFile: (filePath: string, callback: (data: any) => void) => () => void;
      };
      project: {
        create: (projectData: any) => Promise<any>;
        open: (projectId: string) => Promise<any>;
        list: () => Promise<any>;
        delete: (projectId: string, deleteFiles: boolean) => Promise<any>;
        update: (projectId: string, updates: any) => Promise<any>;
        getLastOpened: () => Promise<any>;
        setDirectory: () => Promise<any>;
        export: (projectPath: string, outputPath: string, options?: any) => Promise<any>;
        import: (archivePath: string, destinationPath: string, options?: any) => Promise<any>;
        validateArchive: (archivePath: string) => Promise<{ valid: boolean; metadata?: any; fileCount?: number; error?: string }>;
        exportSizeEstimate: (projectPath: string, options?: any) => Promise<any>;
        createTemplate: (templateName: string, templatePath: string, outputDir: string) => Promise<any>;
        exportDialog: (projectName: string) => Promise<{ canceled: boolean; filePath?: string }>;
        importDialog: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
        onProjectOpened: (callback: (project: any) => void) => () => void;
      };
      menu: {
        onNewProject: (callback: () => void) => void;
        onOpenProject: (callback: () => void) => void;
        onSave: (callback: () => void) => void;
        onSaveAll: (callback: () => void) => void;
        onNewChat: (callback: () => void) => void;
        onClearChat: (callback: () => void) => void;
        onCheckCLIStatus: (callback: () => void) => void;
        onInstallCLI: (callback: () => void) => void;
        onAbout: (callback: () => void) => void;
      };
      git: {
        checkInstallation: () => Promise<{ installed: boolean; version?: string; error?: string }>;
        isRepo: (projectPath: string) => Promise<{ success: boolean; isRepo: boolean; error?: string }>;
        init: (projectPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
        status: (projectPath: string) => Promise<any>;
        branchCurrent: (projectPath: string) => Promise<{ success: boolean; branch?: string; error?: string }>;
        branchList: (projectPath: string) => Promise<any>;
        branchSwitch: (projectPath: string, branchName: string) => Promise<any>;
        log: (projectPath: string, limit?: number) => Promise<any>;
        stage: (projectPath: string, files: string | string[]) => Promise<any>;
        unstage: (projectPath: string, files: string | string[]) => Promise<any>;
        commit: (projectPath: string, message: string) => Promise<any>;
        diff: (projectPath: string, file: string) => Promise<any>;
        remotes: (projectPath: string) => Promise<any>;
      };
      notification: {
        show: (options: NotificationOptions) => Promise<{ success: boolean; error?: string }>;
        showSuccess: (title: string, body: string, data?: any) => Promise<{ success: boolean; error?: string }>;
        showError: (title: string, body: string, data?: any) => Promise<{ success: boolean; error?: string }>;
        showInfo: (title: string, body: string, data?: any) => Promise<{ success: boolean; error?: string }>;
        updatePreferences: (preferences: any) => Promise<{ success: boolean; error?: string }>;
        onNotificationClick: (callback: (data: any) => void) => () => void;
      };
      update: {
        check: () => Promise<{ success: boolean; updateInfo?: any; hasUpdate?: boolean; error?: string }>;
        download: () => Promise<{ success: boolean; error?: string }>;
        install: () => void;
        getInfo: () => Promise<UpdateStatus>;
        setPreferences: (preferences: any) => Promise<{ success: boolean }>;
        onUpdateAvailable: (callback: (info: any) => void) => () => void;
        onDownloadProgress: (callback: (progress: any) => void) => () => void;
        onUpdateDownloaded: (callback: (info: any) => void) => () => void;
      };
      tray: {
        updateStatus: (status: 'normal' | 'syncing' | 'error' | 'offline') => Promise<{ success: boolean; error?: string }>;
        setBadge: (count: number) => Promise<{ success: boolean; error?: string }>;
      };
      removeAllListeners: (channel: string) => void;
    };
  }
}

interface NotificationOptions {
  title: string;
  body: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'git' | 'build' | 'update';
  icon?: string;
  sound?: boolean;
  actions?: Array<{ text: string; handler?: () => void }>;
  data?: any;
  groupId?: string | null;
  urgency?: 'low' | 'normal' | 'critical';
}

interface UpdateStatus {
  checking: boolean;
  updateInfo: any;
  downloadProgress: number;
  currentVersion: string;
  preferences: any;
}

/**
 * Check if running in Electron environment
 */
export function isElectron(): boolean {
  return !!(window as any).electronAPI;
}

/**
 * Get the Electron API, throws if not in Electron
 */
export function getElectronAPI() {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }
  return (window as any).electronAPI;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get platform information
 */
export async function getPlatformInfo() {
  if (!isElectron()) {
    return {
      platform: 'web',
      arch: 'unknown',
      version: 'unknown'
    };
  }
  
  try {
    const electronAPI = getElectronAPI();
    return await electronAPI.getPlatformInfo();
  } catch (error) {
    console.error('Failed to get platform info:', error);
    return {
      platform: 'unknown',
      arch: 'unknown',
      version: 'unknown'
    };
  }
}

/**
 * Check if Claude CLI is available
 */
export async function isClaudeCLIAvailable(): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }
  
  try {
    const electronAPI = getElectronAPI();
    const status = await electronAPI.claude.checkCLI();
    return status.installed && status.authenticated;
  } catch (error) {
    console.error('Failed to check Claude CLI:', error);
    return false;
  }
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  if (!isElectron()) {
    return '0.1.0'; // Fallback version
  }
  
  try {
    const electronAPI = getElectronAPI();
    return await electronAPI.getVersion();
  } catch (error) {
    console.error('Failed to get app version:', error);
    return '0.1.0';
  }
}

/**
 * Check OAuth token status
 */
export async function checkOAuthStatus(): Promise<{ exists: boolean; token?: string; path?: string; error?: string }> {
  if (!isElectron()) {
    return { exists: false, error: 'Not running in Electron' };
  }
  
  try {
    const electronAPI = getElectronAPI();
    return await electronAPI.claude.checkOAuth();
  } catch (error) {
    console.error('Failed to check OAuth status:', error);
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Setup OAuth token
 */
export async function setupOAuthToken(): Promise<{ success: boolean; hasToken?: boolean; tokenPath?: string; error?: string }> {
  if (!isElectron()) {
    return { success: false, error: 'Not running in Electron' };
  }
  
  try {
    const electronAPI = getElectronAPI();
    return await electronAPI.claude.setupOAuth();
  } catch (error) {
    console.error('Failed to setup OAuth token:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}