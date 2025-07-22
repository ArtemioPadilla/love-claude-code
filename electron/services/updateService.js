const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain } = require('electron');
const EventEmitter = require('events');
const log = require('electron-log');

// Configure logging for auto-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

class UpdateService extends EventEmitter {
  constructor() {
    super();
    this.mainWindow = null;
    this.notificationService = null;
    this.updateCheckInterval = null;
    this.updateInfo = null;
    this.downloadProgress = 0;
    this.preferences = {
      autoDownload: true,
      autoInstallOnQuit: true,
      checkInterval: 4 * 60 * 60 * 1000, // 4 hours
      allowPrerelease: false,
      allowDowngrade: false
    };
  }

  /**
   * Initialize the update service
   * @param {BrowserWindow} mainWindow - The main application window
   * @param {Object} notificationService - The notification service instance
   * @param {Object} preferences - User preferences for updates
   */
  init(mainWindow, notificationService, preferences = {}) {
    this.mainWindow = mainWindow;
    this.notificationService = notificationService;
    this.preferences = { ...this.preferences, ...preferences };

    // Configure auto-updater
    autoUpdater.autoDownload = this.preferences.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.preferences.autoInstallOnQuit;
    autoUpdater.allowPrerelease = this.preferences.allowPrerelease;
    autoUpdater.allowDowngrade = this.preferences.allowDowngrade;

    // Set up event handlers
    this.setupEventHandlers();

    // Set up IPC handlers
    this.setupIpcHandlers();

    // Start checking for updates
    this.startUpdateCheck();
  }

  /**
   * Set up auto-updater event handlers
   */
  setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.emit('checking-for-update');
      this.sendToRenderer('update:checking');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.updateInfo = info;
      this.emit('update-available', info);
      this.sendToRenderer('update:available', info);

      // Show notification
      if (this.notificationService && !this.preferences.autoDownload) {
        this.notificationService.showUpdateNotification(info.version);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.emit('update-not-available', info);
      this.sendToRenderer('update:not-available', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      this.emit('error', err);
      this.sendToRenderer('update:error', err.message);

      // Show error notification
      if (this.notificationService) {
        this.notificationService.showError(
          'Update Error',
          'Failed to check for updates. Please try again later.'
        );
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Download speed: ${this.formatBytes(progressObj.bytesPerSecond)}/s - Downloaded ${progressObj.percent.toFixed(2)}% (${this.formatBytes(progressObj.transferred)}/${this.formatBytes(progressObj.total)})`;
      log.info(logMessage);
      
      this.downloadProgress = progressObj.percent;
      this.emit('download-progress', progressObj);
      this.sendToRenderer('update:download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.updateInfo = info;
      this.emit('update-downloaded', info);
      this.sendToRenderer('update:downloaded', info);

      // Show notification
      if (this.notificationService) {
        this.notificationService.show({
          title: 'Update Ready',
          body: `Version ${info.version} has been downloaded and will be installed when you quit the app.`,
          type: 'update',
          sound: true,
          actions: [
            {
              text: 'Restart Now',
              handler: () => this.quitAndInstall()
            },
            {
              text: 'Later',
              handler: () => {}
            }
          ]
        });
      }
    });
  }

  /**
   * Set up IPC handlers for renderer communication
   */
  setupIpcHandlers() {
    ipcMain.handle('update:check', async () => {
      return await this.checkForUpdates();
    });

    ipcMain.handle('update:download', async () => {
      return await this.downloadUpdate();
    });

    ipcMain.handle('update:install', () => {
      this.quitAndInstall();
    });

    ipcMain.handle('update:get-info', () => {
      return {
        updateInfo: this.updateInfo,
        downloadProgress: this.downloadProgress,
        preferences: this.preferences
      };
    });

    ipcMain.handle('update:set-preferences', (event, preferences) => {
      this.updatePreferences(preferences);
      return { success: true };
    });
  }

  /**
   * Send event to renderer process
   */
  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Start automatic update checking
   */
  startUpdateCheck() {
    // Initial check after 30 seconds
    setTimeout(() => {
      this.checkForUpdates();
    }, 30000);

    // Set up interval for periodic checks
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.preferences.checkInterval);
  }

  /**
   * Stop automatic update checking
   */
  stopUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Check for updates manually
   */
  async checkForUpdates() {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateInfo: result?.updateInfo,
        hasUpdate: result?.updateInfo?.version !== app.getVersion()
      };
    } catch (error) {
      log.error('Error checking for updates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download update manually
   */
  async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      log.error('Error downloading update:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Quit and install update
   */
  quitAndInstall() {
    // Ensure all windows are closed properly
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.removeAllListeners('close');
    });

    // Install update
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };

    // Update auto-updater settings
    autoUpdater.autoDownload = this.preferences.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.preferences.autoInstallOnQuit;
    autoUpdater.allowPrerelease = this.preferences.allowPrerelease;
    autoUpdater.allowDowngrade = this.preferences.allowDowngrade;

    // Restart update check interval if changed
    if (preferences.checkInterval !== undefined) {
      this.stopUpdateCheck();
      this.startUpdateCheck();
    }
  }

  /**
   * Get current update status
   */
  getStatus() {
    return {
      checking: autoUpdater.isUpdaterActive(),
      updateInfo: this.updateInfo,
      downloadProgress: this.downloadProgress,
      currentVersion: app.getVersion(),
      preferences: this.preferences
    };
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Set update feed URL (for custom update servers)
   */
  setFeedURL(url) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: url
    });
  }

  /**
   * Disable updates (for development or special builds)
   */
  disable() {
    this.stopUpdateCheck();
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
  }

  /**
   * Enable updates
   */
  enable() {
    this.updatePreferences(this.preferences);
    this.startUpdateCheck();
  }
}

module.exports = UpdateService;