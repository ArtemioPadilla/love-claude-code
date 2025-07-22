const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
// Check multiple ways to detect development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;
const claudeService = require('./services/claudeService');
const authManager = require('./services/authManager');
const projectManager = require('./services/projectManager');
const fileWatcher = require('./services/fileWatcher');
const fileSearch = require('./services/fileSearch');
const gitService = require('./services/gitService');
const ProjectExportService = require('./services/projectExportService');
const TrayService = require('./services/trayService');
const NotificationService = require('./services/notificationService');
const UpdateService = require('./services/updateService');

// Initialize services
const exportService = new ProjectExportService();
const trayService = new TrayService();
const notificationService = new NotificationService();
const updateService = new UpdateService();

// Keep a global reference of the window object
let mainWindow;
let splashWindow;

// Enable live reload for Electron in development
if (isDev) {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true
    });
  } catch (_) {
    console.log('Error loading electron-reloader:', _);
  }
}

// Create the splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Initialize services
async function initializeServices() {
  try {
    // Initialize tray
    await trayService.init(mainWindow, projectManager);
    
    // Initialize notifications
    notificationService.init({
      enabled: true,
      soundEnabled: true
    });
    
    // Initialize auto-updater (only in production)
    if (!isDev) {
      updateService.init(mainWindow, notificationService, {
        autoDownload: true,
        autoInstallOnQuit: true
      });
    }
    
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// Create the main application window
function createMainWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      setTimeout(async () => {
        splashWindow.close();
        mainWindow.show();
        
        // Initialize services after window is shown
        await initializeServices();
      }, 1500); // Show splash for at least 1.5 seconds
    } else {
      mainWindow.show();
      
      // Initialize services after window is shown
      initializeServices();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        {
          label: 'Save All',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-save-all');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Claude',
      submenu: [
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('menu-new-chat');
          }
        },
        {
          label: 'Clear Chat',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow.webContents.send('menu-clear-chat');
          }
        },
        { type: 'separator' },
        {
          label: 'Check CLI Status',
          click: () => {
            mainWindow.webContents.send('menu-check-cli-status');
          }
        },
        {
          label: 'Install Claude CLI',
          click: () => {
            mainWindow.webContents.send('menu-install-cli');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://love-claude-code.dev/docs');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/love-claude-code/love-claude-code/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About Love Claude Code',
          click: () => {
            mainWindow.webContents.send('menu-about');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();
  createMenu();

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC Handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('platform-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version
  };
});

// Claude CLI IPC handlers
ipcMain.handle('claude:check-cli', async () => {
  try {
    const installStatus = await claudeService.checkInstallation();
    if (installStatus.installed) {
      const authStatus = await claudeService.checkAuthentication();
      return {
        ...installStatus,
        ...authStatus
      };
    }
    return installStatus;
  } catch (error) {
    return {
      installed: false,
      error: error.message
    };
  }
});

ipcMain.handle('claude:execute', async (event, command, options = {}) => {
  try {
    // Check if CLI is installed first
    const status = await claudeService.checkInstallation();
    if (!status.installed) {
      return {
        success: false,
        error: 'Claude CLI is not installed. Please install it first.'
      };
    }

    // Check authentication
    const authStatus = await claudeService.checkAuthentication();
    if (!authStatus.authenticated) {
      return {
        success: false,
        error: 'Not authenticated with Claude. Please run: claude setup-token'
      };
    }

    // Execute the command
    const result = await claudeService.execute(command);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

// Claude streaming execution
ipcMain.handle('claude:execute-stream', async (event, command, requestId) => {
  try {
    const result = await claudeService.executeCommand(command, {
      onData: (data) => {
        mainWindow.webContents.send(`claude:stream-data:${requestId}`, data);
      },
      onError: (error) => {
        mainWindow.webContents.send(`claude:stream-error:${requestId}`, error);
      },
      onComplete: () => {
        mainWindow.webContents.send(`claude:stream-complete:${requestId}`);
      }
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Open authentication terminal
ipcMain.handle('claude:open-auth', async () => {
  try {
    const result = await claudeService.openAuthenticationTerminal();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Setup OAuth token
ipcMain.handle('claude:setup-oauth', async () => {
  try {
    const result = await claudeService.setupOAuthToken();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Check OAuth token status
ipcMain.handle('claude:check-oauth', async () => {
  try {
    const result = await claudeService.checkOAuthToken();
    return result;
  } catch (error) {
    return {
      success: false,
      exists: false,
      error: error.message
    };
  }
});

// Authentication management handlers
ipcMain.handle('auth:get-status', async () => {
  try {
    const status = await authManager.getAuthStatus();
    return status;
  } catch (error) {
    return {
      isAuthenticated: false,
      error: error.message
    };
  }
});

ipcMain.handle('auth:set-status', async (event, authenticated, username) => {
  try {
    const result = await authManager.setAuthStatus(authenticated, username);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('auth:store-api-key', async (event, apiKey) => {
  try {
    const result = await authManager.storeApiKey(apiKey);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('auth:get-api-key', async () => {
  try {
    const apiKey = await authManager.getApiKey();
    return { success: true, apiKey };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('auth:clear', async () => {
  try {
    const result = await authManager.clearAuth();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('auth:get-preferences', () => {
  return authManager.getPreferences();
});

ipcMain.handle('auth:set-preferences', (event, preferences) => {
  return authManager.setPreferences(preferences);
});

// File system IPC handlers
ipcMain.handle('fs:read-file', async (event, filePath) => {
  try {
    // Ensure the file path is within a project directory
    const projectsDir = projectManager.getProjectsDirectory();
    const resolvedPath = path.resolve(filePath);
    
    // Security check - ensure we're reading within allowed directories
    if (!resolvedPath.startsWith(projectsDir) && !isDev) {
      return {
        success: false,
        error: 'Access denied: File is outside project directory'
      };
    }

    const content = await fs.readFile(resolvedPath, 'utf-8');
    return {
      success: true,
      content,
      path: resolvedPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('fs:write-file', async (event, filePath, content) => {
  try {
    const projectsDir = projectManager.getProjectsDirectory();
    const resolvedPath = path.resolve(filePath);
    
    // Security check
    if (!resolvedPath.startsWith(projectsDir) && !isDev) {
      return {
        success: false,
        error: 'Access denied: File is outside project directory'
      };
    }

    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(resolvedPath, content, 'utf-8');
    
    return {
      success: true,
      path: resolvedPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('fs:list-directory', async (event, dirPath) => {
  try {
    const projectsDir = projectManager.getProjectsDirectory();
    const resolvedPath = path.resolve(dirPath || projectsDir);
    
    // Security check
    if (!resolvedPath.startsWith(projectsDir) && !isDev) {
      return {
        success: false,
        error: 'Access denied: Directory is outside project directory',
        items: []
      };
    }

    const items = await fs.readdir(resolvedPath, { withFileTypes: true });
    const result = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(resolvedPath, item.name);
        const stats = await fs.stat(itemPath);
        
        return {
          name: item.name,
          path: itemPath,
          isDirectory: item.isDirectory(),
          isFile: item.isFile(),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
    );

    return {
      success: true,
      items: result,
      path: resolvedPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      items: []
    };
  }
});

// File dialog handlers
ipcMain.handle('fs:open-file-dialog', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: options.defaultPath || projectManager.getProjectsDirectory()
  });

  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

ipcMain.handle('fs:save-file-dialog', async (event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: options.defaultPath || projectManager.getProjectsDirectory()
  });

  return {
    canceled: result.canceled,
    filePath: result.filePath
  };
});

// Project management IPC handlers
ipcMain.handle('project:create', async (event, projectData) => {
  try {
    const result = await projectManager.createProject(projectData);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:open', async (event, projectId) => {
  try {
    const result = await projectManager.openProject(projectId);
    if (result.success) {
      // Notify renderer of project change
      mainWindow.webContents.send('project:opened', result.project);
    }
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:list', async () => {
  try {
    const projects = await projectManager.listProjects();
    return {
      success: true,
      projects
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      projects: []
    };
  }
});

ipcMain.handle('project:delete', async (event, projectId, deleteFiles) => {
  try {
    const result = await projectManager.deleteProject(projectId, deleteFiles);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:update', async (event, projectId, updates) => {
  try {
    const result = await projectManager.updateProject(projectId, updates);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:get-last-opened', () => {
  const project = projectManager.getLastOpened();
  return project;
});

ipcMain.handle('project:set-directory', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Projects Directory'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const setResult = await projectManager.setProjectsDirectory(result.filePaths[0]);
    return setResult;
  }

  return { success: false, error: 'Canceled' };
});

// File watcher IPC handlers
ipcMain.handle('watcher:start', async (event, directoryPath) => {
  try {
    const result = fileWatcher.watchDirectory(directoryPath);
    
    if (result.success) {
      // Set up event forwarding to renderer
      fileWatcher.removeAllListeners('change');
      fileWatcher.on('change', (changeData) => {
        mainWindow.webContents.send('watcher:file-changed', changeData);
      });
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('watcher:stop', async (event, directoryPath) => {
  try {
    const stopped = fileWatcher.unwatchDirectory(directoryPath);
    return {
      success: stopped
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('watcher:stop-all', async () => {
  try {
    fileWatcher.unwatchAll();
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('watcher:get-watched', async () => {
  try {
    const directories = fileWatcher.getWatchedDirectories();
    return {
      success: true,
      directories
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      directories: []
    };
  }
});

// File search IPC handlers
ipcMain.handle('search:by-name', async (event, directory, pattern, options) => {
  try {
    const result = await fileSearch.searchByName(directory, pattern, options);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: [],
      count: 0
    };
  }
});

ipcMain.handle('search:by-content', async (event, directory, searchText, options) => {
  try {
    const result = await fileSearch.searchByContent(directory, searchText, options);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: [],
      count: 0
    };
  }
});

ipcMain.handle('search:by-modified', async (event, directory, options) => {
  try {
    const result = await fileSearch.searchByModifiedTime(directory, options);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: [],
      count: 0
    };
  }
});

// Git IPC handlers
ipcMain.handle('git:check-installation', async () => {
  try {
    const result = await gitService.checkInstallation();
    return result;
  } catch (error) {
    return {
      installed: false,
      error: error.message
    };
  }
});

ipcMain.handle('git:is-repo', async (event, projectPath) => {
  try {
    const isRepo = await gitService.isGitRepo(projectPath);
    return { success: true, isRepo };
  } catch (error) {
    return {
      success: false,
      isRepo: false,
      error: error.message
    };
  }
});

ipcMain.handle('git:init', async (event, projectPath) => {
  try {
    const result = await gitService.initRepo(projectPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

ipcMain.handle('git:status', async (event, projectPath) => {
  try {
    const result = await gitService.getStatus(projectPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error,
      isRepo: false,
      files: []
    };
  }
});

ipcMain.handle('git:branch-current', async (event, projectPath) => {
  try {
    const result = await gitService.getCurrentBranch(projectPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

ipcMain.handle('git:branch-list', async (event, projectPath) => {
  try {
    const result = await gitService.getBranches(projectPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error,
      branches: []
    };
  }
});

ipcMain.handle('git:branch-switch', async (event, projectPath, branchName) => {
  try {
    const result = await gitService.switchBranch(projectPath, branchName);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

ipcMain.handle('git:log', async (event, projectPath, limit) => {
  try {
    const result = await gitService.getCommitHistory(projectPath, limit);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error,
      commits: []
    };
  }
});

ipcMain.handle('git:stage', async (event, projectPath, files) => {
  try {
    const result = await gitService.stageFiles(projectPath, files);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

ipcMain.handle('git:unstage', async (event, projectPath, files) => {
  try {
    const result = await gitService.unstageFiles(projectPath, files);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

ipcMain.handle('git:commit', async (event, projectPath, message) => {
  try {
    const result = await gitService.commit(projectPath, message);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error
    };
  }
});

ipcMain.handle('git:diff', async (event, projectPath, file) => {
  try {
    const result = await gitService.getDiff(projectPath, file);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error,
      diff: ''
    };
  }
});

ipcMain.handle('git:remotes', async (event, projectPath) => {
  try {
    const result = await gitService.getRemotes(projectPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || error.error,
      remotes: []
    };
  }
});

// ========================================
// Project Export/Import IPC Handlers
// ========================================

ipcMain.handle('project:export', async (event, projectPath, outputPath, options) => {
  try {
    const result = await exportService.exportProject(projectPath, outputPath, options);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:import', async (event, archivePath, destinationPath, options) => {
  try {
    const result = await exportService.importProject(archivePath, destinationPath, options);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:validate-archive', async (event, archivePath) => {
  try {
    const result = await exportService.validateArchive(archivePath);
    return result;
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:export-size-estimate', async (event, projectPath, options) => {
  try {
    const result = await exportService.getExportSizeEstimate(projectPath, options);
    return result;
  } catch (error) {
    return {
      error: error.message
    };
  }
});

ipcMain.handle('project:create-template', async (event, templateName, templatePath, outputDir) => {
  try {
    const result = await exportService.createTemplate(templateName, templatePath, outputDir);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Dialog for export location
ipcMain.handle('project:export-dialog', async (event, projectName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Project',
    defaultPath: path.join(app.getPath('documents'), `${projectName}.lcc`),
    filters: [
      { name: 'Love Claude Code Project', extensions: ['lcc'] },
      { name: 'Love Claude Code Template', extensions: ['lcc-template'] }
    ]
  });

  return {
    canceled: result.canceled,
    filePath: result.filePath
  };
});

// Dialog for import location
ipcMain.handle('project:import-dialog', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Project',
    filters: [
      { name: 'Love Claude Code Files', extensions: ['lcc', 'lcc-template'] },
      { name: 'Love Claude Code Project', extensions: ['lcc'] },
      { name: 'Love Claude Code Template', extensions: ['lcc-template'] }
    ],
    properties: ['openFile']
  });

  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

// ========================================
// Notification IPC Handlers
// ========================================

ipcMain.handle('notification:show', async (event, options) => {
  try {
    await notificationService.show(options);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notification:showSuccess', async (event, title, body, data) => {
  try {
    await notificationService.showSuccess(title, body, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notification:showError', async (event, title, body, data) => {
  try {
    await notificationService.showError(title, body, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notification:showInfo', async (event, title, body, data) => {
  try {
    await notificationService.showInfo(title, body, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notification:updatePreferences', async (event, preferences) => {
  try {
    notificationService.updatePreferences(preferences);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ========================================
// Auto-Update IPC Handlers
// ========================================

ipcMain.handle('update:check', async () => {
  return await updateService.checkForUpdates();
});

ipcMain.handle('update:download', async () => {
  return await updateService.downloadUpdate();
});

ipcMain.handle('update:install', () => {
  updateService.quitAndInstall();
});

ipcMain.handle('update:get-info', () => {
  return updateService.getStatus();
});

ipcMain.handle('update:set-preferences', (event, preferences) => {
  updateService.updatePreferences(preferences);
  return { success: true };
});

// ========================================
// Tray IPC Handlers
// ========================================

ipcMain.handle('tray:update-status', (event, status) => {
  try {
    trayService.updateStatus(status);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tray:set-badge', (event, count) => {
  try {
    trayService.setBadgeCount(count);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export for testing
module.exports = { createMainWindow, createMenu };