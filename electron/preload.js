const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatformInfo: () => ipcRenderer.invoke('platform-info'),

  // Claude CLI operations
  claude: {
    checkCLI: () => ipcRenderer.invoke('claude:check-cli'),
    execute: (command) => ipcRenderer.invoke('claude:execute', command),
    executeStream: (command, requestId) => ipcRenderer.invoke('claude:execute-stream', command, requestId),
    openAuth: () => ipcRenderer.invoke('claude:open-auth'),
    setupOAuth: () => ipcRenderer.invoke('claude:setup-oauth'),
    checkOAuth: () => ipcRenderer.invoke('claude:check-oauth'),
    onStreamData: (requestId, callback) => {
      const channel = `claude:stream-data:${requestId}`;
      ipcRenderer.on(channel, (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onStreamError: (requestId, callback) => {
      const channel = `claude:stream-error:${requestId}`;
      ipcRenderer.on(channel, (event, error) => callback(error));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onStreamComplete: (requestId, callback) => {
      const channel = `claude:stream-complete:${requestId}`;
      ipcRenderer.on(channel, (event) => callback());
      return () => ipcRenderer.removeAllListeners(channel);
    }
  },

  // File system operations
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
    listDirectory: (dirPath) => ipcRenderer.invoke('fs:list-directory', dirPath),
    openFileDialog: (options) => ipcRenderer.invoke('fs:open-file-dialog', options),
    saveFileDialog: (options) => ipcRenderer.invoke('fs:save-file-dialog', options),
    watchFile: (filePath, callback) => {
      ipcRenderer.on(`fs:file-changed:${filePath}`, (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(`fs:file-changed:${filePath}`);
    }
  },

  // Project management
  project: {
    create: (projectData) => ipcRenderer.invoke('project:create', projectData),
    open: (projectId) => ipcRenderer.invoke('project:open', projectId),
    list: () => ipcRenderer.invoke('project:list'),
    delete: (projectId, deleteFiles) => ipcRenderer.invoke('project:delete', projectId, deleteFiles),
    update: (projectId, updates) => ipcRenderer.invoke('project:update', projectId, updates),
    getLastOpened: () => ipcRenderer.invoke('project:get-last-opened'),
    setDirectory: () => ipcRenderer.invoke('project:set-directory'),
    export: (projectPath, outputPath, options) => ipcRenderer.invoke('project:export', projectPath, outputPath, options),
    import: (archivePath, destinationPath, options) => ipcRenderer.invoke('project:import', archivePath, destinationPath, options),
    validateArchive: (archivePath) => ipcRenderer.invoke('project:validate-archive', archivePath),
    exportSizeEstimate: (projectPath, options) => ipcRenderer.invoke('project:export-size-estimate', projectPath, options),
    createTemplate: (templateName, templatePath, outputDir) => ipcRenderer.invoke('project:create-template', templateName, templatePath, outputDir),
    exportDialog: (projectName) => ipcRenderer.invoke('project:export-dialog', projectName),
    importDialog: () => ipcRenderer.invoke('project:import-dialog'),
    onProjectOpened: (callback) => {
      ipcRenderer.on('project:opened', (event, project) => callback(project));
      return () => ipcRenderer.removeAllListeners('project:opened');
    }
  },

  // Menu events
  menu: {
    onNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
    onOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
    onSave: (callback) => ipcRenderer.on('menu-save', callback),
    onSaveAll: (callback) => ipcRenderer.on('menu-save-all', callback),
    onNewChat: (callback) => ipcRenderer.on('menu-new-chat', callback),
    onClearChat: (callback) => ipcRenderer.on('menu-clear-chat', callback),
    onCheckCLIStatus: (callback) => ipcRenderer.on('menu-check-cli-status', callback),
    onInstallCLI: (callback) => ipcRenderer.on('menu-install-cli', callback),
    onAbout: (callback) => ipcRenderer.on('menu-about', callback)
  },

  // Authentication management
  auth: {
    getStatus: () => ipcRenderer.invoke('auth:get-status'),
    setStatus: (authenticated, username) => ipcRenderer.invoke('auth:set-status', authenticated, username),
    storeApiKey: (apiKey) => ipcRenderer.invoke('auth:store-api-key', apiKey),
    getApiKey: () => ipcRenderer.invoke('auth:get-api-key'),
    clear: () => ipcRenderer.invoke('auth:clear'),
    getPreferences: () => ipcRenderer.invoke('auth:get-preferences'),
    setPreferences: (preferences) => ipcRenderer.invoke('auth:set-preferences', preferences)
  },

  // Git operations
  git: {
    checkInstallation: () => ipcRenderer.invoke('git:check-installation'),
    isRepo: (projectPath) => ipcRenderer.invoke('git:is-repo', projectPath),
    init: (projectPath) => ipcRenderer.invoke('git:init', projectPath),
    status: (projectPath) => ipcRenderer.invoke('git:status', projectPath),
    branchCurrent: (projectPath) => ipcRenderer.invoke('git:branch-current', projectPath),
    branchList: (projectPath) => ipcRenderer.invoke('git:branch-list', projectPath),
    branchSwitch: (projectPath, branchName) => ipcRenderer.invoke('git:branch-switch', projectPath, branchName),
    log: (projectPath, limit) => ipcRenderer.invoke('git:log', projectPath, limit),
    stage: (projectPath, files) => ipcRenderer.invoke('git:stage', projectPath, files),
    unstage: (projectPath, files) => ipcRenderer.invoke('git:unstage', projectPath, files),
    commit: (projectPath, message) => ipcRenderer.invoke('git:commit', projectPath, message),
    diff: (projectPath, file) => ipcRenderer.invoke('git:diff', projectPath, file),
    remotes: (projectPath) => ipcRenderer.invoke('git:remotes', projectPath)
  },

  // File watcher
  watcher: {
    start: (directoryPath) => ipcRenderer.invoke('watcher:start', directoryPath),
    stop: (directoryPath) => ipcRenderer.invoke('watcher:stop', directoryPath),
    stopAll: () => ipcRenderer.invoke('watcher:stop-all'),
    getWatched: () => ipcRenderer.invoke('watcher:get-watched'),
    onFileChanged: (callback) => {
      ipcRenderer.on('watcher:file-changed', (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('watcher:file-changed');
    }
  },

  // Search operations
  search: {
    byName: (directory, pattern, options) => ipcRenderer.invoke('search:by-name', directory, pattern, options),
    byContent: (directory, searchText, options) => ipcRenderer.invoke('search:by-content', directory, searchText, options),
    byModified: (directory, options) => ipcRenderer.invoke('search:by-modified', directory, options)
  },

  // Notification operations
  notification: {
    show: (options) => ipcRenderer.invoke('notification:show', options),
    showSuccess: (title, body, data) => ipcRenderer.invoke('notification:showSuccess', title, body, data),
    showError: (title, body, data) => ipcRenderer.invoke('notification:showError', title, body, data),
    showInfo: (title, body, data) => ipcRenderer.invoke('notification:showInfo', title, body, data),
    updatePreferences: (preferences) => ipcRenderer.invoke('notification:updatePreferences', preferences),
    onNotificationClick: (callback) => {
      ipcRenderer.on('notification:click', (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('notification:click');
    }
  },

  // Auto-update operations
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    getInfo: () => ipcRenderer.invoke('update:get-info'),
    setPreferences: (preferences) => ipcRenderer.invoke('update:set-preferences', preferences),
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update:available', (event, info) => callback(info));
      return () => ipcRenderer.removeAllListeners('update:available');
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('update:download-progress', (event, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('update:download-progress');
    },
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('update:downloaded', (event, info) => callback(info));
      return () => ipcRenderer.removeAllListeners('update:downloaded');
    }
  },

  // Tray operations
  tray: {
    updateStatus: (status) => ipcRenderer.invoke('tray:update-status', status),
    setBadge: (count) => ipcRenderer.invoke('tray:set-badge', count)
  },

  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log that preload script is loaded
console.log('Preload script loaded successfully');