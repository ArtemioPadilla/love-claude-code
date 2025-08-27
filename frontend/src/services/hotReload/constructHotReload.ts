import { constructStore } from '../../stores/constructStore';
import { toast } from 'react-hot-toast';

export interface HotReloadConfig {
  enabled: boolean;
  watchPaths: string[];
  debounceMs: number;
  autoReloadConstructs: boolean;
  autoReloadConfig: boolean;
}

class ConstructHotReloadService {
  private config: HotReloadConfig = {
    enabled: true,
    watchPaths: ['/src/constructs', '/constructs/catalog'],
    debounceMs: 500,
    autoReloadConstructs: true,
    autoReloadConfig: true
  };
  
  private watchers: Map<string, any> = new Map();
  private reloadTimer: number | null = null;
  private pendingReloads: Set<string> = new Set();
  private listeners: Set<(event: HotReloadEvent) => void> = new Set();

  async enableHotReload(config?: Partial<HotReloadConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    if (!this.config.enabled) {
      this.disableHotReload();
      return;
    }

    // Start watching for changes
    for (const path of this.config.watchPaths) {
      await this.watchPath(path);
    }

    // Setup WebSocket connection for real-time updates
    this.setupWebSocket();
    
    toast.success('Hot reload enabled');
  }

  disableHotReload(): void {
    this.config.enabled = false;
    
    // Clear all watchers
    for (const [path, watcher] of this.watchers) {
      this.unwatch(path);
    }
    
    // Close WebSocket
    this.closeWebSocket();
    
    toast('Hot reload disabled');
  }

  async reloadConstruct(constructId: string): Promise<void> {
    if (!this.config.autoReloadConstructs) return;
    
    this.pendingReloads.add(constructId);
    this.scheduleReload();
  }

  async reloadConfiguration(): Promise<void> {
    if (!this.config.autoReloadConfig) return;
    
    try {
      // Reload configuration from backend
      const response = await fetch('/api/config/reload', { method: 'POST' });
      if (response.ok) {
        const config = await response.json();
        this.applyConfiguration(config);
        this.notifyListeners({
          type: 'config-reloaded',
          timestamp: new Date(),
          details: config
        });
      }
    } catch (error) {
      console.error('Failed to reload configuration:', error);
    }
  }

  onHotReload(callback: (event: HotReloadEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getStatus(): HotReloadStatus {
    return {
      enabled: this.config.enabled,
      watchedPaths: Array.from(this.watchers.keys()),
      pendingReloads: Array.from(this.pendingReloads),
      isConnected: this.isWebSocketConnected()
    };
  }

  // Private methods
  private async watchPath(path: string): Promise<void> {
    // In a real implementation, this would use file system watchers
    // For now, we'll simulate with polling
    const watcher = setInterval(() => {
      this.checkForChanges(path);
    }, 1000);
    
    this.watchers.set(path, watcher);
  }

  private unwatch(path: string): void {
    const watcher = this.watchers.get(path);
    if (watcher) {
      clearInterval(watcher);
      this.watchers.delete(path);
    }
  }

  private async checkForChanges(path: string): Promise<void> {
    // Simulate checking for file changes
    // In a real implementation, this would compare file timestamps
    const hasChanges = Math.random() < 0.01; // 1% chance of changes
    
    if (hasChanges) {
      const changeEvent: FileChangeEvent = {
        path,
        type: 'modified',
        timestamp: new Date()
      };
      
      this.handleFileChange(changeEvent);
    }
  }

  private handleFileChange(event: FileChangeEvent): void {
    // Determine what needs to be reloaded based on the file path
    if (event.path.includes('constructs')) {
      // Extract construct ID from path
      const constructId = this.extractConstructId(event.path);
      if (constructId) {
        this.reloadConstruct(constructId);
      }
    } else if (event.path.includes('config')) {
      this.reloadConfiguration();
    }
  }

  private extractConstructId(path: string): string | null {
    // Extract construct ID from file path
    const match = path.match(/constructs\/(L\d+)\/([^/]+)/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return null;
  }

  private scheduleReload(): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    
    this.reloadTimer = window.setTimeout(() => {
      this.performReloads();
    }, this.config.debounceMs);
  }

  private async performReloads(): Promise<void> {
    const constructIds = Array.from(this.pendingReloads);
    this.pendingReloads.clear();
    
    for (const constructId of constructIds) {
      try {
        // Reload construct from source
        await constructStore.reloadConstruct(constructId);
        
        this.notifyListeners({
          type: 'construct-reloaded',
          timestamp: new Date(),
          details: { constructId }
        });
      } catch (error) {
        console.error(`Failed to reload construct ${constructId}:`, error);
      }
    }
    
    if (constructIds.length > 0) {
      toast.success(`Reloaded ${constructIds.length} construct(s)`);
    }
  }

  private setupWebSocket(): void {
    // Setup WebSocket connection for real-time updates
    // This would connect to a development server that watches files
    if (typeof WebSocket === 'undefined') return;
    
    try {
      const ws = new WebSocket('ws://localhost:3001/hot-reload');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'file-change') {
          this.handleFileChange(data);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Hot reload WebSocket error:', error);
      };
      
      // Store WebSocket reference
      (this as any).ws = ws;
    } catch (error) {
      console.error('Failed to setup hot reload WebSocket:', error);
    }
  }

  private closeWebSocket(): void {
    const ws = (this as any).ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }

  private isWebSocketConnected(): boolean {
    const ws = (this as any).ws;
    return ws && ws.readyState === WebSocket.OPEN;
  }

  private applyConfiguration(config: any): void {
    // Apply configuration changes to the application
    // This would update various stores and services
    console.log('Applying configuration:', config);
  }

  private notifyListeners(event: HotReloadEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Hot reload listener error:', error);
      }
    });
  }
}

export interface HotReloadEvent {
  type: 'construct-reloaded' | 'config-reloaded' | 'file-changed';
  timestamp: Date;
  details?: any;
}

export interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: Date;
}

export interface HotReloadStatus {
  enabled: boolean;
  watchedPaths: string[];
  pendingReloads: string[];
  isConnected: boolean;
}

export const constructHotReload = new ConstructHotReloadService();