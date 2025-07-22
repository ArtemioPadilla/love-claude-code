const { Notification, nativeImage, shell } = require('electron');
const path = require('path');
const EventEmitter = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
    this.preferences = {
      enabled: true,
      soundEnabled: true,
      showInSystemTray: true,
      groupByType: true
    };
    this.recentNotifications = new Map(); // For grouping similar notifications
  }

  /**
   * Initialize the notification service
   * @param {Object} preferences - User preferences for notifications
   */
  init(preferences = {}) {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   */
  async show(options) {
    if (!this.preferences.enabled) {
      return;
    }

    // Check if notifications are supported
    if (!Notification.isSupported()) {
      console.warn('Notifications are not supported on this system');
      return;
    }

    // Add to queue
    this.queue.push(options);
    
    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the notification queue
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const options = this.queue.shift();

    try {
      await this.showNotification(options);
    } catch (error) {
      console.error('Error showing notification:', error);
    }

    // Process next notification after a short delay
    setTimeout(() => this.processQueue(), 200);
  }

  /**
   * Show a single notification
   * @private
   */
  async showNotification(options) {
    const {
      title,
      body,
      type = 'info',
      icon,
      sound = this.preferences.soundEnabled,
      actions = [],
      data = {},
      groupId = null,
      urgency = 'normal' // low, normal, critical
    } = options;

    // Check for grouping
    if (this.preferences.groupByType && groupId) {
      const key = `${type}-${groupId}`;
      const recent = this.recentNotifications.get(key);
      
      if (recent && Date.now() - recent.timestamp < 5000) {
        // Update existing notification instead of creating new one
        recent.count++;
        recent.timestamp = Date.now();
        return;
      }
      
      this.recentNotifications.set(key, {
        timestamp: Date.now(),
        count: 1
      });
    }

    // Get appropriate icon
    const notificationIcon = icon || this.getIconForType(type);

    // Create notification
    const notification = new Notification({
      title,
      body,
      icon: notificationIcon,
      silent: !sound,
      urgency,
      actions: actions.map(action => ({
        type: 'button',
        text: action.text
      })),
      closeButtonText: 'Close'
    });

    // Handle notification events
    notification.on('click', () => {
      this.emit('click', { type, data });
      this.handleNotificationClick(type, data);
    });

    notification.on('action', (event, index) => {
      if (actions[index] && actions[index].handler) {
        actions[index].handler();
      }
      this.emit('action', { type, data, actionIndex: index });
    });

    notification.on('close', () => {
      this.emit('close', { type, data });
    });

    // Show the notification
    notification.show();
  }

  /**
   * Get icon path for notification type
   * @private
   */
  getIconForType(type) {
    const isDev = process.env.NODE_ENV === 'development';
    const basePath = isDev 
      ? path.join(__dirname, '../../assets/notifications')
      : path.join(process.resourcesPath, 'assets/notifications');

    const iconMap = {
      'success': 'success.png',
      'error': 'error.png',
      'warning': 'warning.png',
      'info': 'info.png',
      'git': 'git.png',
      'build': 'build.png',
      'update': 'update.png'
    };

    const iconFile = iconMap[type] || 'info.png';
    return path.join(basePath, iconFile);
  }

  /**
   * Handle notification click based on type
   * @private
   */
  handleNotificationClick(type, data) {
    const { BrowserWindow } = require('electron');
    const mainWindow = BrowserWindow.getAllWindows()[0];

    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();

      // Send event to renderer based on type
      switch (type) {
        case 'git':
          mainWindow.webContents.send('notification:git-click', data);
          break;
        case 'build':
          mainWindow.webContents.send('notification:build-click', data);
          break;
        case 'update':
          mainWindow.webContents.send('notification:update-click', data);
          break;
        default:
          mainWindow.webContents.send('notification:click', { type, data });
      }
    }
  }

  /**
   * Show specific notification types
   */

  showSuccess(title, body, data = {}) {
    return this.show({
      title,
      body,
      type: 'success',
      sound: true,
      data
    });
  }

  showError(title, body, data = {}) {
    return this.show({
      title,
      body,
      type: 'error',
      sound: true,
      urgency: 'critical',
      data
    });
  }

  showWarning(title, body, data = {}) {
    return this.show({
      title,
      body,
      type: 'warning',
      sound: true,
      data
    });
  }

  showInfo(title, body, data = {}) {
    return this.show({
      title,
      body,
      type: 'info',
      sound: false,
      data
    });
  }

  /**
   * Show Git-related notifications
   */
  showGitNotification(operation, details) {
    const titles = {
      'commit': 'Commit Created',
      'push': 'Push Completed',
      'pull': 'Pull Completed',
      'merge': 'Merge Completed',
      'conflict': 'Merge Conflict Detected'
    };

    return this.show({
      title: titles[operation] || 'Git Operation',
      body: details,
      type: 'git',
      sound: operation === 'conflict',
      urgency: operation === 'conflict' ? 'critical' : 'normal',
      data: { operation }
    });
  }

  /**
   * Show build-related notifications
   */
  showBuildNotification(status, details) {
    const isError = status === 'failed';
    
    return this.show({
      title: isError ? 'Build Failed' : 'Build Succeeded',
      body: details,
      type: 'build',
      sound: true,
      urgency: isError ? 'critical' : 'normal',
      data: { status }
    });
  }

  /**
   * Show update notifications
   */
  showUpdateNotification(version, actions = []) {
    return this.show({
      title: 'Update Available',
      body: `Version ${version} is ready to install`,
      type: 'update',
      sound: true,
      urgency: 'normal',
      actions: [
        {
          text: 'Install Now',
          handler: () => {
            const { autoUpdater } = require('electron-updater');
            autoUpdater.quitAndInstall();
          }
        },
        {
          text: 'Later',
          handler: () => {}
        }
      ],
      data: { version }
    });
  }

  /**
   * Show task notifications
   */
  showTaskNotification(task, status) {
    const titles = {
      'completed': `Task Completed: ${task}`,
      'failed': `Task Failed: ${task}`,
      'started': `Task Started: ${task}`
    };

    return this.show({
      title: titles[status] || `Task: ${task}`,
      body: `Status: ${status}`,
      type: status === 'failed' ? 'error' : 'info',
      sound: status !== 'started',
      data: { task, status }
    });
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Clear notification queue
   */
  clearQueue() {
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Clear recent notifications cache
   */
  clearRecentNotifications() {
    this.recentNotifications.clear();
  }

  /**
   * Test notification system
   */
  async test() {
    await this.showInfo('Test Notification', 'Notification system is working!');
  }
}

module.exports = NotificationService;