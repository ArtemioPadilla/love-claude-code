/**
 * Adapter to make Electron IPC work with existing API interface
 */

import { isElectron, getElectronAPI } from '@utils/electronDetection';
import { electronClaudeService } from './electronClaudeService';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ElectronApiAdapter {
  private electronAPI: any;

  constructor() {
    if (isElectron()) {
      this.electronAPI = getElectronAPI();
    }
  }

  /**
   * Check if we should use Electron API
   */
  shouldUseElectron(): boolean {
    return isElectron();
  }

  /**
   * Auth endpoints
   */
  async login(credentials: { email: string; password: string }): Promise<ApiResponse> {
    // In Electron, we don't use traditional login
    // Return success to maintain compatibility
    return {
      data: {
        token: 'electron-local',
        user: {
          id: 'local-user',
          email: credentials.email,
          name: 'Local User'
        }
      }
    };
  }

  async logout(): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    await this.electronAPI.auth.clear();
    return { data: { success: true } };
  }

  /**
   * Settings endpoints
   */
  async getSettings(): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const preferences = await this.electronAPI.auth.getPreferences();
      const authStatus = await this.electronAPI.auth.getStatus();
      
      return {
        data: {
          general: {
            theme: preferences.theme || 'system',
            language: 'en'
          },
          ai: {
            authMethod: authStatus.isAuthenticated ? 'claude-code-cli' : 'api-key',
            model: preferences.defaultModel || 'claude-3-5-sonnet',
            temperature: 0.7,
            maxTokens: 4000,
            streamResponses: preferences.streamResponses !== false
          }
        }
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async saveSettings(settings: any): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      await this.electronAPI.auth.setPreferences({
        theme: settings.general?.theme,
        defaultModel: settings.ai?.model,
        streamResponses: settings.ai?.streamResponses
      });
      
      return { data: { success: true } };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Project endpoints
   */
  async getProjects(): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const result = await this.electronAPI.project.list();
      return {
        data: result.projects || []
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async createProject(projectData: any): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const result = await this.electronAPI.project.create(projectData);
      if (result.success) {
        return { data: result.project };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async updateProject(projectId: string, updates: any): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const result = await this.electronAPI.project.update(projectId, updates);
      if (result.success) {
        return { data: result.project };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async deleteProject(projectId: string): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const result = await this.electronAPI.project.delete(projectId, false);
      if (result.success) {
        return { data: { success: true } };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * File endpoints
   */
  async getFileTree(projectId?: string): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      // If projectId provided, open that project first
      if (projectId) {
        const openResult = await this.electronAPI.project.open(projectId);
        if (!openResult.success) {
          return { error: openResult.error };
        }
      }
      
      const result = await this.electronAPI.fs.listDirectory();
      return {
        data: {
          tree: this.buildFileTree(result.items || [])
        }
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async readFile(filePath: string): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const result = await this.electronAPI.fs.readFile(filePath);
      if (result.success) {
        return {
          data: {
            content: result.content,
            path: result.path
          }
        };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async writeFile(filePath: string, content: string): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      const result = await this.electronAPI.fs.writeFile(filePath, content);
      if (result.success) {
        return {
          data: {
            success: true,
            path: result.path
          }
        };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async createFile(projectId: string, filePath: string, content: string = ''): Promise<ApiResponse> {
    // In Electron, projectId is handled by the current open project
    return this.writeFile(filePath, content);
  }

  async deleteFile(filePath: string): Promise<ApiResponse> {
    // TODO: Implement file deletion in Electron
    return { error: 'File deletion not yet implemented' };
  }

  /**
   * Claude endpoints
   */
  async sendClaudeMessage(message: string, context?: any): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      // Check if Claude CLI is available
      const cliStatus = await electronClaudeService.checkStatus();
      if (!cliStatus.installed) {
        return { error: 'Claude CLI is not installed' };
      }
      if (!cliStatus.authenticated) {
        return { error: 'Claude CLI is not authenticated' };
      }
      
      // Format command for Claude CLI
      const command = `-p "${message.replace(/"/g, '\\"')}"`;
      const result = await electronClaudeService.execute(command);
      
      if (result.success) {
        return {
          data: {
            content: result.output,
            role: 'assistant'
          }
        };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async streamClaudeMessage(
    message: string,
    onChunk: (chunk: string) => void,
    context?: any
  ): Promise<ApiResponse> {
    if (!this.electronAPI) return { error: 'Not in Electron' };
    
    try {
      // Check if Claude CLI is available
      const cliStatus = await electronClaudeService.checkStatus();
      if (!cliStatus.installed) {
        return { error: 'Claude CLI is not installed' };
      }
      if (!cliStatus.authenticated) {
        return { error: 'Claude CLI is not authenticated' };
      }
      
      // Format command for Claude CLI
      const command = `-p "${message.replace(/"/g, '\\"')}"`;
      
      const result = await electronClaudeService.executeStream(command, {
        onData: onChunk,
        onError: (error) => {
          console.error('Stream error:', error);
        }
      });
      
      if (result.success) {
        return {
          data: {
            success: true
          }
        };
      } else {
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Helper methods
   */
  private buildFileTree(items: any[]): any {
    const tree: any = {};
    
    items.forEach(item => {
      if (item.isDirectory) {
        tree[item.name] = {
          type: 'directory',
          children: {} // Would need recursive listing
        };
      } else {
        tree[item.name] = {
          type: 'file',
          size: item.size,
          modified: item.modified
        };
      }
    });
    
    return tree;
  }
}

export const electronApiAdapter = new ElectronApiAdapter();