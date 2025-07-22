const { app, Tray, Menu, nativeImage, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class TrayService {
  constructor() {
    this.tray = null;
    this.mainWindow = null;
    this.projectManager = null;
    this.isQuitting = false;
  }

  /**
   * Initialize the system tray
   * @param {BrowserWindow} mainWindow - The main application window
   * @param {Object} projectManager - The project manager instance
   */
  async init(mainWindow, projectManager) {
    try {
      this.mainWindow = mainWindow;
      this.projectManager = projectManager;

      // Create tray icon
      const iconPath = this.getIconPath();
      
      // Check if icon exists
      try {
        await fs.access(iconPath);
      } catch (error) {
        console.warn('Tray icon not found at:', iconPath);
        // Use a default empty icon if the file doesn't exist
        const icon = nativeImage.createEmpty();
        this.tray = new Tray(icon);
        this.tray.setToolTip('Love Claude Code');
        await this.updateMenu();
        this.setupEventHandlers();
        return;
      }
      
      const icon = nativeImage.createFromPath(iconPath);
      
      // Resize icon for different platforms
      const trayIcon = process.platform === 'darwin' 
        ? icon.resize({ width: 16, height: 16 })
        : icon.resize({ width: 32, height: 32 });

      this.tray = new Tray(trayIcon);
      
      // Set tooltip (use setToolTip instead of setToolTipText)
      this.tray.setToolTip('Love Claude Code');

      // Build and set context menu
      await this.updateMenu();

      // Setup event handlers
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize tray:', error);
      // Continue without tray if it fails
    }
  }

  /**
   * Get the appropriate icon path for the platform
   */
  getIconPath() {
    const isDev = process.env.NODE_ENV === 'development';
    const basePath = isDev 
      ? path.join(__dirname, '../../assets')
      : path.join(process.resourcesPath, 'assets');

    if (process.platform === 'darwin') {
      // macOS requires a Template image for dark mode support
      return path.join(basePath, 'tray-icon-Template.png');
    } else if (process.platform === 'win32') {
      return path.join(basePath, 'tray-icon.ico');
    } else {
      return path.join(basePath, 'tray-icon.png');
    }
  }

  /**
   * Setup tray event handlers
   */
  setupEventHandlers() {
    // Click behavior differs by platform
    if (process.platform === 'darwin') {
      // macOS: Single click shows menu, no double-click
      this.tray.on('click', () => {
        // On macOS, clicking the tray icon typically shows the menu
        // We'll toggle window visibility instead
        this.toggleWindow();
      });
    } else {
      // Windows/Linux: Click to toggle window
      this.tray.on('click', () => {
        this.toggleWindow();
      });

      // Right-click shows menu (handled automatically on Windows/Linux)
    }

    // Handle window events
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        // On macOS, hide window instead of quitting
        event.preventDefault();
        this.mainWindow.hide();
      } else if (!this.isQuitting) {
        // On Windows/Linux, minimize to tray
        event.preventDefault();
        this.mainWindow.hide();
        
        // Show notification on first minimize
        if (!this.hasShownMinimizeNotification) {
          this.showNotification(
            'Love Claude Code',
            'Application minimized to system tray'
          );
          this.hasShownMinimizeNotification = true;
        }
      }
    });

    // Update menu when window visibility changes
    this.mainWindow.on('show', () => this.updateMenu());
    this.mainWindow.on('hide', () => this.updateMenu());

    // Handle app quit
    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }

  /**
   * Toggle main window visibility
   */
  toggleWindow() {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Update the tray context menu
   */
  async updateMenu() {
    const recentProjects = await this.getRecentProjects();
    const isVisible = this.mainWindow.isVisible();

    const menuTemplate = [
      {
        label: isVisible ? 'Hide Love Claude Code' : 'Show Love Claude Code',
        click: () => this.toggleWindow()
      },
      { type: 'separator' },
      {
        label: 'New Project',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('menu-new-project');
        }
      },
      {
        label: 'Open Project',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('menu-open-project');
        }
      },
      { type: 'separator' }
    ];

    // Add recent projects
    if (recentProjects.length > 0) {
      menuTemplate.push({
        label: 'Recent Projects',
        submenu: recentProjects.map(project => ({
          label: project.name,
          click: () => {
            this.mainWindow.show();
            this.mainWindow.webContents.send('project:open', project.id);
          }
        }))
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Add settings and quit
    menuTemplate.push(
      {
        label: 'Preferences...',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('menu-preferences');
        }
      },
      { type: 'separator' },
      {
        label: 'Quit Love Claude Code',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    );

    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Get recent projects for the menu
   */
  async getRecentProjects() {
    try {
      const projects = await this.projectManager.listProjects();
      // Sort by last opened and take top 5
      return projects
        .sort((a, b) => {
          const aTime = a.lastOpenedAt || a.createdAt;
          const bTime = b.lastOpenedAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        })
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting recent projects:', error);
      return [];
    }
  }

  /**
   * Update tray icon with status indicator
   * @param {string} status - Status type: 'normal', 'syncing', 'error', 'offline'
   */
  updateStatus(status = 'normal') {
    if (!this.tray) return;

    const iconPath = this.getStatusIconPath(status);
    const icon = nativeImage.createFromPath(iconPath);
    
    const trayIcon = process.platform === 'darwin' 
      ? icon.resize({ width: 16, height: 16 })
      : icon.resize({ width: 32, height: 32 });

    this.tray.setImage(trayIcon);

    // Update tooltip with status
    const statusText = {
      'normal': '',
      'syncing': ' - Syncing',
      'error': ' - Error',
      'offline': ' - Offline'
    };
    
    this.tray.setToolTipText(`Love Claude Code${statusText[status] || ''}`);
  }

  /**
   * Get status-specific icon path
   */
  getStatusIconPath(status) {
    const isDev = process.env.NODE_ENV === 'development';
    const basePath = isDev 
      ? path.join(__dirname, '../../assets')
      : path.join(process.resourcesPath, 'assets');

    const statusSuffix = status === 'normal' ? '' : `-${status}`;
    
    if (process.platform === 'darwin') {
      return path.join(basePath, `tray-icon${statusSuffix}-Template.png`);
    } else if (process.platform === 'win32') {
      return path.join(basePath, `tray-icon${statusSuffix}.ico`);
    } else {
      return path.join(basePath, `tray-icon${statusSuffix}.png`);
    }
  }

  /**
   * Show a balloon notification (Windows) or notification (other platforms)
   * @param {string} title - Notification title
   * @param {string} content - Notification content
   */
  showNotification(title, content) {
    if (process.platform === 'win32' && this.tray) {
      // Windows balloon notification
      this.tray.displayBalloon({
        icon: nativeImage.createFromPath(this.getIconPath()),
        title,
        content
      });
    } else {
      // Use Electron's notification API for other platforms
      const { Notification } = require('electron');
      new Notification({
        title,
        body: content,
        icon: this.getIconPath()
      }).show();
    }
  }

  /**
   * Destroy the tray
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  /**
   * Set badge count (macOS only)
   * @param {number} count - Badge count
   */
  setBadgeCount(count) {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setBadge(count > 0 ? count.toString() : '');
    }
  }

  /**
   * Flash the tray icon (Windows only)
   * @param {boolean} flash - Whether to flash
   */
  flashFrame(flash = true) {
    if (process.platform === 'win32' && this.mainWindow) {
      this.mainWindow.flashFrame(flash);
    }
  }
}

module.exports = TrayService;