# Love Claude Code Desktop App

The Love Claude Code Desktop App provides a complete offline development experience with native OS integration and Claude CLI support.

## Features

### 🖥️ Native Desktop Experience
- **Full Offline Mode**: Work without internet connection
- **OS Integration**: Native menus, keyboard shortcuts, system tray
- **Secure Credential Storage**: OS keychain integration for API keys
- **File System Access**: Direct file operations without browser limitations

### 🤖 Claude Integration
- **Claude CLI**: Terminal-based Claude interaction for Max subscribers
- **API Key Support**: Use Anthropic API keys for pay-per-use
- **OAuth Support**: Sign in with Claude.ai account
- **Streaming Responses**: Real-time AI assistance

### 📁 Project Management
- **Local Projects**: Store projects on your file system
- **Templates**: Quick start with pre-built templates
- **File Operations**: Create, edit, delete files directly
- **Git Integration**: Basic git operations (coming soon)

## Installation

### Download Pre-built Releases

Download the latest release for your platform:
- **macOS**: `Love-Claude-Code-x.x.x.dmg`
- **Windows**: `Love-Claude-Code-Setup-x.x.x.exe`
- **Linux**: `Love-Claude-Code-x.x.x.AppImage`

### Build from Source

```bash
# Clone the repository
git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code

# Install dependencies
npm install

# Run in development
npm run electron:dev

# Build for your platform
npm run electron:build

# Create distribution packages
npm run electron:dist
```

## First-Time Setup

1. **Launch the App**: Open Love Claude Code from your Applications folder
2. **Complete Onboarding**: The app will guide you through:
   - Choosing your environment (Desktop recommended)
   - Setting up Claude integration
   - Configuring your preferences
3. **Create First Project**: Start building with AI assistance!

## Claude Integration Options

### Option 1: API Key (Pay-per-use)
1. Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. Go to Settings → AI Settings
3. Select "API Key" and paste your key
4. The key is securely stored in your OS keychain

### Option 2: Claude Max (Unlimited)
1. Ensure you have an active Claude Max subscription
2. Go to Settings → AI Settings
3. Select "Claude Max" and sign in
4. Complete OAuth flow

### Option 3: Claude CLI (Desktop Only)
1. Install Claude Code CLI: `npm install -g @anthropic/claude-code`
2. Authenticate: `claude login`
3. Select "Claude CLI" in settings
4. Use the terminal interface for Claude interaction

## Keyboard Shortcuts

### Global
- `Cmd/Ctrl + ,` - Open Settings
- `Cmd/Ctrl + N` - New File
- `Cmd/Ctrl + O` - Open File
- `Cmd/Ctrl + S` - Save File
- `F1` - Open Documentation

### Editor
- `Cmd/Ctrl + /` - Toggle Comment
- `Cmd/Ctrl + F` - Find
- `Cmd/Ctrl + H` - Find and Replace
- `Alt + Up/Down` - Move Line

### Chat
- `Cmd/Ctrl + Enter` - Send Message
- `Cmd/Ctrl + K` - Clear Chat
- `Escape` - Cancel Current Request

## Offline Mode Features

When running offline, the desktop app provides:

- ✅ Full editor functionality
- ✅ Local file operations
- ✅ Project management
- ✅ Code execution (local)
- ✅ Terminal access
- ❌ Claude AI (requires connection)
- ❌ Cloud provider features

The app displays an offline indicator in the header when no internet connection is detected.

## Security

### Credential Storage
- API keys are stored in the OS keychain (Keychain on macOS, Credential Manager on Windows, libsecret on Linux)
- OAuth tokens are encrypted and stored locally
- No credentials are ever sent to our servers

### Code Execution
- All code runs in your local environment
- No sandboxing restrictions (be cautious with untrusted code)
- Full access to your file system

### Updates
- Automatic update checks (can be disabled)
- Updates are signed and verified
- Manual update option available

## Troubleshooting

### App Won't Start
1. Check system requirements (Node.js 20+)
2. Clear app data: `~/Library/Application Support/love-claude-code` (macOS)
3. Run with debug: `DEBUG=* npm run electron`

### Claude CLI Not Working
1. Ensure CLI is installed: `claude --version`
2. Re-authenticate: `claude logout && claude login`
3. Check terminal permissions in System Preferences

### Performance Issues
1. Clear editor cache in Settings
2. Disable unnecessary extensions
3. Check available disk space
4. Restart the app

### Connection Issues
1. Check firewall settings
2. Verify proxy configuration
3. Try different Claude integration method

## Configuration

### Settings Location
- **macOS**: `~/Library/Application Support/love-claude-code`
- **Windows**: `%APPDATA%\love-claude-code`
- **Linux**: `~/.config/love-claude-code`

### Environment Variables
```bash
# Force development mode
NODE_ENV=development

# Custom data directory
LOVE_CLAUDE_CODE_DATA=/path/to/data

# Disable auto-updates
LOVE_CLAUDE_CODE_NO_UPDATE=true
```

## Development

### Project Structure
```
electron/
├── main.js           # Main process
├── preload.js        # Preload script
├── services/         # Business logic
│   ├── authManager.js
│   ├── claudeService.js
│   └── projectManager.js
└── splash.html       # Splash screen
```

### Building Custom Features

1. **IPC Communication**: Use the established IPC channels
2. **Menu Customization**: Edit menu template in main.js
3. **Window Management**: Extend BrowserWindow options
4. **Native Modules**: Add to electron dependencies

### Testing
```bash
# Run Electron tests
npm run test:electron

# Test specific service
npm run test:electron -- authManager

# Debug mode
DEBUG=electron:* npm run electron:dev
```

## Roadmap

### Planned Features
- [ ] Git integration with visual diff
- [ ] Plugin system for extensions
- [ ] Multi-window support
- [ ] Custom themes
- [ ] Collaborative editing
- [ ] Cloud sync for settings
- [ ] Voice coding support

### Known Limitations
- No web browser preview (use system browser)
- Limited mobile device testing
- No built-in database viewer
- Basic terminal emulation

## Contributing

We welcome contributions to the desktop app! Please:

1. Fork the repository
2. Create a feature branch
3. Test on multiple platforms
4. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Support

### Getting Help
- [GitHub Issues](https://github.com/love-claude-code/love-claude-code/issues)
- [Discord Community](https://discord.gg/love-claude-code)
- [Documentation](https://docs.love-claude-code.dev)

### Reporting Bugs
When reporting desktop app issues, please include:
- OS and version
- App version (Help → About)
- Steps to reproduce
- Error logs from DevTools (View → Toggle Developer Tools)

---

Built with ❤️ using Electron, React, and Claude AI