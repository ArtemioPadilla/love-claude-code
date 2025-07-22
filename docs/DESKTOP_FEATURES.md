# Desktop App Features Guide

Love Claude Code Desktop is a native Electron application that brings the full power of AI-assisted development to your desktop with enhanced features for offline development, Claude Max integration, and OS-native functionality.

## Table of Contents
- [Installation](#installation)
- [Claude Max Integration](#claude-max-integration)
- [Git Integration](#git-integration)
- [Project Import/Export](#project-importexport)
- [File Watching & Search](#file-watching--search)
- [Native Menus & Shortcuts](#native-menus--shortcuts)
- [Offline Development](#offline-development)
- [System Requirements](#system-requirements)

## Installation

### Download Pre-built Releases
The easiest way to get started is to download the latest release for your platform:
- **macOS**: Love-Claude-Code-1.0.0.dmg
- **Windows**: Love-Claude-Code-Setup-1.0.0.exe
- **Linux**: Love-Claude-Code-1.0.0.AppImage

### Build from Source
```bash
# Clone the repository
git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code

# Install dependencies
npm install

# Run in development mode
make electron-dev

# Build for your platform
make electron-build

# Build for all platforms
make electron-dist
```

## Claude Max Integration

The desktop app provides seamless integration with Claude Max subscriptions through OAuth authentication.

### Setting Up Claude Max OAuth

1. **Launch the Desktop App**
   - Open Love Claude Code desktop application

2. **Navigate to Settings**
   - Click the Settings icon in the header
   - Go to the "AI Configuration" section

3. **Select Claude CLI Authentication**
   - Choose "Claude CLI (OAuth)" as your authentication method
   - You'll see the current OAuth status

4. **Run OAuth Setup**
   - Click "Setup Claude OAuth"
   - The app will run `claude setup-token` in the background
   - Follow the prompts in the terminal window that opens
   - Once authenticated, the app will automatically detect your token

### OAuth Token Location
The OAuth token is stored in:
- **macOS/Linux**: `~/.claude/oauth_token.json`
- **Windows**: `%USERPROFILE%\.claude\oauth_token.json`

The desktop app automatically detects and uses this token when sending messages to Claude.

## Git Integration

The desktop app includes comprehensive Git support without requiring external tools.

### Git Status Display
- Current branch name shown in header
- Number of modified files
- Clean/dirty repository indicator

### Git Operations

#### Creating Commits
1. Click the Git status indicator in the header
2. Select files to include in the commit
3. Enter a commit message
4. Click "Commit" to create the commit

#### Branch Management
- View all branches
- Switch between branches
- Create new branches
- Delete branches (with safety checks)

#### Viewing Changes
- See file diffs before committing
- View commit history
- Compare branches

### Git Menu Commands
Access Git operations through the menu:
- **File → Git → Status**: View repository status
- **File → Git → Commit**: Open commit dialog
- **File → Git → Branch**: Manage branches
- **File → Git → Log**: View commit history

## Project Import/Export

Share and backup your projects with the import/export feature.

### Exporting Projects

1. **Open Project Menu**
   - Right-click on a project card
   - Select "Export"

2. **Configure Export Options**
   - **Include node_modules**: Include dependencies (increases size significantly)
   - **Include Git history**: Include .git directory with full version history
   - **Include hidden files**: Include dotfiles and hidden directories
   - **Compression level**: Balance between speed and file size

3. **Export**
   - Click "Calculate size estimate" to preview archive size
   - Click "Export Project" to save the .lcc file

### Importing Projects

1. **Click Import Button**
   - On the projects page, click the "Import" button

2. **Select Archive**
   - Choose a .lcc or .lcc-template file
   - The app validates the archive integrity

3. **Choose Destination**
   - Select where to extract the project
   - Option to overwrite existing files

4. **Import**
   - Click "Import Project" to extract and create the project

### Project Templates

Create reusable project templates:
```javascript
// Export as template
await electronAPI.project.createTemplate(
  'react-starter',
  '/path/to/project',
  '/path/to/templates'
)
```

## File Watching & Search

### File Watcher
The desktop app automatically watches for file changes in your project:
- Real-time sync with external editors
- Automatic refresh when files change
- Configurable watch patterns

### Advanced Search

#### Search by Name
Find files quickly by name pattern:
```javascript
await electronAPI.search.byName(projectPath, '*.tsx', {
  maxDepth: 5,
  exclude: ['node_modules', 'dist']
})
```

#### Search by Content
Search file contents with regex support:
```javascript
await electronAPI.search.byContent(projectPath, 'TODO:', {
  fileTypes: ['.js', '.tsx'],
  caseSensitive: false
})
```

#### Search by Modified Time
Find recently modified files:
```javascript
await electronAPI.search.byModified(projectPath, {
  within: 24 * 60 * 60 * 1000, // Last 24 hours
  fileTypes: ['.ts', '.tsx']
})
```

## Native Menus & Shortcuts

### Application Menu
The desktop app provides a full native menu bar with:

#### File Menu
- New Project (Cmd/Ctrl+N)
- Open Project (Cmd/Ctrl+O)
- Save (Cmd/Ctrl+S)
- Save All (Cmd/Ctrl+Shift+S)
- Export Project
- Import Project
- Back to Projects

#### Edit Menu
- Undo (Cmd/Ctrl+Z)
- Redo (Cmd/Ctrl+Y)
- Cut (Cmd/Ctrl+X)
- Copy (Cmd/Ctrl+C)
- Paste (Cmd/Ctrl+V)
- Select All (Cmd/Ctrl+A)

#### View Menu
- Toggle Full Screen (F11)
- Toggle Developer Tools (Cmd/Ctrl+Shift+I)
- Zoom In (Cmd/Ctrl++)
- Zoom Out (Cmd/Ctrl+-)
- Reset Zoom (Cmd/Ctrl+0)

#### Claude Menu
- New Chat (Cmd/Ctrl+Shift+N)
- Clear Chat
- Check CLI Status
- Setup OAuth

#### Help Menu
- Documentation (F1)
- Keyboard Shortcuts
- Report Issue
- About

### Global Shortcuts
- **Cmd/Ctrl+N**: New project
- **Cmd/Ctrl+O**: Open project
- **Cmd/Ctrl+S**: Save current file
- **Cmd/Ctrl+Shift+N**: New chat
- **F1**: Open documentation

## Offline Development

The desktop app is designed for complete offline functionality:

### Offline Features
- ✅ Project management
- ✅ Code editing
- ✅ File operations
- ✅ Git operations
- ✅ Search and navigation
- ✅ Import/Export
- ❌ Claude AI assistance (requires internet)
- ❌ Live preview (requires local server)

### Offline Indicators
The app shows clear indicators when offline:
- "Offline Mode" badge in header
- Disabled Claude chat input
- Offline-compatible features remain active

### Local Storage
All data is stored locally:
- Projects: `~/LoveClaudeCode/projects/`
- Settings: `~/LoveClaudeCode/settings.json`
- Cache: `~/LoveClaudeCode/cache/`

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **RAM**: 4GB
- **Storage**: 500MB available space
- **Node.js**: 20.0.0+ (for development)

### Recommended Requirements
- **OS**: Latest version of Windows, macOS, or Linux
- **RAM**: 8GB or more
- **Storage**: 2GB available space
- **Display**: 1920x1080 or higher

### Dependencies
The desktop app bundles all required dependencies:
- Electron 28.x
- Node.js runtime
- Git (optional, for Git features)
- Claude CLI (optional, for OAuth)

## Troubleshooting

### Common Issues

#### OAuth Token Not Found
```bash
# Manually run OAuth setup
claude setup-token

# Verify token exists
ls ~/.claude/oauth_token.json
```

#### Git Operations Failing
```bash
# Check Git installation
git --version

# Verify repository
cd /path/to/project
git status
```

#### High Memory Usage
- Close unused projects
- Disable file watching for large directories
- Increase Node.js memory limit in settings

### Debug Mode
Enable debug logging:
1. Open Settings
2. Enable "Debug Mode"
3. Check developer console for detailed logs

### Getting Help
- GitHub Issues: [Report bugs and request features](https://github.com/love-claude-code/love-claude-code/issues)
- Documentation: Press F1 or Help → Documentation
- Community: Join our Discord server

## Security Considerations

### Credential Storage
- API keys are stored in the system keychain
- OAuth tokens are stored in user home directory
- All credentials are encrypted at rest

### Code Execution
- User code runs in the main process (not sandboxed)
- Be cautious with untrusted projects
- Review code before execution

### Network Security
- All API calls use HTTPS
- OAuth flow uses secure browser authentication
- Local server binds to localhost only

## Advanced Configuration

### Configuration File
Edit `~/.love-claude-code/config.json`:
```json
{
  "editor": {
    "fontSize": 14,
    "theme": "dark",
    "tabSize": 2
  },
  "git": {
    "autoFetch": true,
    "fetchInterval": 300000
  },
  "fileWatcher": {
    "enabled": true,
    "exclude": ["node_modules", ".git", "dist"]
  }
}
```

### Environment Variables
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Enable debug logging
DEBUG="love-claude-code:*"

# Custom projects directory
LCC_PROJECTS_DIR="/custom/path/to/projects"
```

### Command Line Arguments
```bash
# Open specific project
love-claude-code --project /path/to/project

# Disable GPU acceleration
love-claude-code --disable-gpu

# Custom user data directory
love-claude-code --user-data-dir=/custom/data
```

## System Tray

The desktop app includes system tray support for background operation and quick access.

### Tray Features
- **Minimize to Tray**: App continues running in background
- **Quick Project Access**: Recent projects in tray menu
- **Status Indicators**: Visual feedback for sync/error states
- **Native Integration**: Platform-specific tray behavior

### Tray Menu Options
- Show/Hide application window
- New project creation
- Open recent projects (last 5)
- Preferences access
- Quit application

### Platform Differences
- **macOS**: Click to toggle window, menu bar icon
- **Windows**: Click to toggle, balloon notifications
- **Linux**: Standard system tray behavior

## Native Notifications

System notifications keep you informed of important events.

### Notification Types
- **Success**: Task completions, successful operations
- **Error**: Build failures, sync errors
- **Info**: General information and tips
- **Git**: Commit, push, merge notifications
- **Update**: New version availability

### Notification Features
- Click actions to open relevant content
- Sound control per notification type
- Grouping of similar notifications
- Platform-native appearance

### Configuration
```javascript
// In Settings → Notifications
{
  "enabled": true,
  "soundEnabled": true,
  "groupByType": true,
  "showInSystemTray": true
}
```

## Auto-Updates

Keep your desktop app up-to-date automatically.

### Update Features
- **Automatic Checking**: Periodic update checks (configurable)
- **Background Downloads**: Updates download while you work
- **Progress Tracking**: Visual download progress
- **Release Notes**: View what's new before updating
- **Flexible Installation**: Install now or on next restart

### Update Settings
```javascript
{
  "autoDownload": true,
  "autoInstallOnQuit": true,
  "checkInterval": 14400000, // 4 hours
  "allowPrerelease": false,
  "allowDowngrade": false
}
```

### Update Process
1. App checks for updates periodically
2. If available, shows notification
3. Download proceeds (auto or manual)
4. Install on quit or restart now
5. App restarts with new version

## Notification Examples

### Using Notifications in Code
```javascript
import { showSuccessNotification, showErrorNotification } from '@utils/notifications'

// Show success notification
await showSuccessNotification(
  'Build Completed',
  'Your project built successfully in 2.3s'
)

// Show error notification
await showErrorNotification(
  'Build Failed', 
  'TypeScript compilation errors detected'
)

// Custom notification with actions
await showNotification({
  title: 'Update Available',
  body: 'Version 1.2.0 is ready to install',
  type: 'update',
  sound: true,
  actions: [
    { text: 'Install Now' },
    { text: 'Later' }
  ]
})
```

### Tray Status Updates
```javascript
import { updateTrayStatus, setTrayBadge } from '@utils/notifications'

// Update tray icon status
await updateTrayStatus('syncing') // Shows sync indicator
await updateTrayStatus('error')   // Shows error state
await updateTrayStatus('normal')  // Back to normal

// Set badge count (macOS only)
await setTrayBadge(5) // Shows "5" on dock icon
await setTrayBadge(0) // Clears badge
```

## Troubleshooting New Features

### System Tray Issues

#### Tray Icon Not Showing
- Check if system tray is enabled in OS
- Verify icon files exist in assets directory
- Try restarting the application

#### Tray Menu Not Working
- Right-click (Windows/Linux) or click (macOS)
- Check console for error messages
- Ensure proper permissions

### Notification Issues

#### Notifications Not Appearing
- Check OS notification settings
- Verify app has notification permissions
- Test with notification test button in settings

#### No Notification Sounds
- Check system sound settings
- Verify notification sound preference
- Test system notification sounds

### Update Issues

#### Updates Not Detected
- Check internet connection
- Verify update server is accessible
- Try manual update check
- Check update preferences

#### Update Download Fails
- Check available disk space
- Verify write permissions
- Check firewall/proxy settings
- Try manual download from releases

## Icon Assets

The desktop app requires specific icon formats:

### Tray Icons
```
assets/
├── tray-icon-Template.png      # macOS (16x16, 32x32 @2x)
├── tray-icon-Template@2x.png   # macOS Retina
├── tray-icon.ico              # Windows (16x16, 32x32)
├── tray-icon.png              # Linux (22x22 or 24x24)
├── tray-icon-syncing-*.png    # Status variants
├── tray-icon-error-*.png      # Error state
└── tray-icon-offline-*.png    # Offline state
```

### Notification Icons
```
assets/notifications/
├── success.png    # Success notifications
├── error.png      # Error notifications
├── warning.png    # Warning notifications
├── info.png       # Info notifications
├── git.png        # Git notifications
├── build.png      # Build notifications
└── update.png     # Update notifications
```

## Future Features

Planned enhancements for the desktop app:
- **Plugin System**: Extend functionality with plugins
- **Terminal Integration**: Built-in terminal with Claude assistance
- **Cloud Sync**: Optional project synchronization
- **Team Collaboration**: Real-time collaboration features
- **Touch Bar Support**: macOS Touch Bar integration
- **Stream Deck Integration**: External device support

---

For more information, visit our [main documentation](/docs) or [report an issue](https://github.com/love-claude-code/love-claude-code/issues).