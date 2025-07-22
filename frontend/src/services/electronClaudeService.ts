/**
 * Claude service for Electron desktop app
 * Communicates with Claude CLI through IPC
 */

interface ClaudeResponse {
  success: boolean;
  output?: string;
  error?: string;
  code?: number;
}

interface StreamOptions {
  onData?: (data: string) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

class ElectronClaudeService {
  private isElectron: boolean;

  constructor() {
    this.isElectron = !!(window as any).electronAPI;
  }

  /**
   * Check if running in Electron
   */
  isAvailable(): boolean {
    return this.isElectron;
  }

  /**
   * Check Claude CLI status
   */
  async checkStatus(): Promise<{
    installed: boolean;
    authenticated: boolean;
    version?: string;
    error?: string;
  }> {
    if (!this.isElectron) {
      return {
        installed: false,
        authenticated: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const status = await (window as any).electronAPI.claude.checkCLI();
      return status;
    } catch (error: any) {
      return {
        installed: false,
        authenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a Claude command
   */
  async execute(command: string): Promise<ClaudeResponse> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const result = await (window as any).electronAPI.claude.execute(command);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a Claude command with streaming
   */
  async executeStream(command: string, options: StreamOptions): Promise<ClaudeResponse> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'Not running in Electron'
      };
    }

    const requestId = `stream-${Date.now()}-${Math.random()}`;
    const { electronAPI } = window as any;

    // Set up listeners
    const cleanupFunctions: (() => void)[] = [];

    if (options.onData) {
      const cleanup = electronAPI.claude.onStreamData(requestId, options.onData);
      cleanupFunctions.push(cleanup);
    }

    if (options.onError) {
      const cleanup = electronAPI.claude.onStreamError(requestId, options.onError);
      cleanupFunctions.push(cleanup);
    }

    if (options.onComplete) {
      const cleanup = electronAPI.claude.onStreamComplete(requestId, () => {
        // Clean up all listeners when complete
        cleanupFunctions.forEach(fn => fn());
        options.onComplete!();
      });
      cleanupFunctions.push(cleanup);
    }

    try {
      const result = await electronAPI.claude.executeStream(command, requestId);
      return result;
    } catch (error: any) {
      // Clean up listeners on error
      cleanupFunctions.forEach(fn => fn());
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Open authentication terminal
   */
  async openAuth(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const result = await (window as any).electronAPI.claude.openAuth();
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get authentication status
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    username?: string;
    needsRecheck?: boolean;
    error?: string;
  }> {
    if (!this.isElectron) {
      return {
        isAuthenticated: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const status = await (window as any).electronAPI.auth.getStatus();
      return status;
    } catch (error: any) {
      return {
        isAuthenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Set authentication status
   */
  async setAuthStatus(authenticated: boolean, username?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const result = await (window as any).electronAPI.auth.setStatus(authenticated, username);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear authentication
   */
  async clearAuth(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const result = await (window as any).electronAPI.auth.clear();
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<any> {
    if (!this.isElectron) {
      return {
        autoCheckUpdates: true,
        theme: 'system',
        defaultModel: 'claude-3-5-sonnet',
        streamResponses: true
      };
    }

    try {
      const prefs = await (window as any).electronAPI.auth.getPreferences();
      return prefs;
    } catch (error) {
      return {
        autoCheckUpdates: true,
        theme: 'system',
        defaultModel: 'claude-3-5-sonnet',
        streamResponses: true
      };
    }
  }

  /**
   * Set user preferences
   */
  async setPreferences(preferences: any): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'Not running in Electron'
      };
    }

    try {
      const result = await (window as any).electronAPI.auth.setPreferences(preferences);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const electronClaudeService = new ElectronClaudeService();