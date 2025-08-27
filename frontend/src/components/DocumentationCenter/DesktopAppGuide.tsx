import { motion } from 'framer-motion'
import { 
  Download, 
  GitBranch, 
  Package, 
  Key, 
  Search,
  HardDrive,
  WifiOff,
  Command,
  Settings,
  FileArchive,
  Shield,
  Bell,
  Monitor,
  RefreshCw
} from 'lucide-react'

export function DesktopAppGuide() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
        <Package className="w-10 h-10 text-blue-500" />
        Love Claude Code Desktop App
      </h1>
      
      <p className="text-xl text-gray-300 mb-8">
        The ultimate development experience with native OS integration, offline capabilities, and Claude Max support.
      </p>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 not-prose">
        <motion.div 
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          whileHover={{ scale: 1.02 }}
        >
          <Key className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Claude Max OAuth</h3>
          <p className="text-sm text-gray-400">
            Native authentication for Claude Max subscribers
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          whileHover={{ scale: 1.02 }}
        >
          <WifiOff className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Offline Development</h3>
          <p className="text-sm text-gray-400">
            Full functionality without internet connection
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          whileHover={{ scale: 1.02 }}
        >
          <GitBranch className="w-8 h-8 text-orange-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Git Integration</h3>
          <p className="text-sm text-gray-400">
            Built-in version control with visual interface
          </p>
        </motion.div>
      </div>

      {/* Installation Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-8 h-8 text-blue-500" />
          Installation
        </h2>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Download Pre-built Releases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">macOS</h4>
              <p className="text-sm text-gray-400 mb-2">Love-Claude-Code-1.0.0.dmg</p>
              <button className="text-blue-400 hover:underline text-sm">Download for Mac</button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">Windows</h4>
              <p className="text-sm text-gray-400 mb-2">Love-Claude-Code-Setup-1.0.0.exe</p>
              <button className="text-blue-400 hover:underline text-sm">Download for Windows</button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">Linux</h4>
              <p className="text-sm text-gray-400 mb-2">Love-Claude-Code-1.0.0.AppImage</p>
              <button className="text-blue-400 hover:underline text-sm">Download for Linux</button>
            </div>
          </div>
        </div>

        <h3>Build from Source</h3>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
          <code>{`# Clone the repository
git clone https://github.com/love-claude-code/love-claude-code.git
cd love-claude-code

# Install dependencies
npm install

# Run in development mode
make electron-dev  # or npm run electron:dev

# Build for your platform
make electron-build  # or npm run electron:build

# Build for all platforms
make electron-dist  # Creates installers for all platforms`}</code>
        </pre>
      </section>

      {/* Claude Max Integration */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Key className="w-8 h-8 text-purple-500" />
          Claude Max Integration
        </h2>
        
        <p className="mb-4">
          The desktop app seamlessly integrates with Claude Max subscriptions through OAuth authentication.
        </p>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Setting Up Claude Max OAuth</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open Settings (⚙️) in the app header</li>
            <li>Navigate to "AI Configuration"</li>
            <li>Select "Claude CLI (OAuth)" as authentication method</li>
            <li>Click "Setup Claude OAuth"</li>
            <li>Follow the prompts in the terminal window</li>
            <li>Once authenticated, the app auto-detects your token</li>
          </ol>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-2">Token Storage Locations</h4>
          <pre className="text-sm">
            <code>{`macOS/Linux: ~/.claude/oauth_token.json
Windows: %USERPROFILE%\\.claude\\oauth_token.json`}</code>
          </pre>
        </div>
      </section>

      {/* Git Integration */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <GitBranch className="w-8 h-8 text-orange-500" />
          Git Integration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Visual Git Status</h3>
            <ul className="space-y-2 text-sm">
              <li>• Current branch display in header</li>
              <li>• Modified files count badge</li>
              <li>• Clean/dirty repository indicator</li>
              <li>• One-click commit dialog</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Git Operations</h3>
            <ul className="space-y-2 text-sm">
              <li>• Stage and commit files</li>
              <li>• Switch between branches</li>
              <li>• View commit history</li>
              <li>• Compare file changes</li>
            </ul>
          </div>
        </div>

        <h3>Keyboard Shortcuts</h3>
        <pre className="bg-gray-800 p-4 rounded-lg">
          <code>{`Cmd/Ctrl+G     Open Git status
Cmd/Ctrl+K     Quick commit
Cmd/Ctrl+B     Branch switcher`}</code>
        </pre>
      </section>

      {/* Project Import/Export */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <FileArchive className="w-8 h-8 text-green-500" />
          Project Import/Export
        </h2>

        <p className="mb-4">
          Share and backup projects with the .lcc archive format.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Export Options</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Include/exclude node_modules</li>
              <li>✓ Include/exclude Git history</li>
              <li>✓ Include/exclude hidden files</li>
              <li>✓ Adjustable compression level</li>
              <li>✓ Size estimation before export</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Import Features</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Archive validation</li>
              <li>✓ Overwrite protection</li>
              <li>✓ Template support</li>
              <li>✓ Metadata preservation</li>
              <li>✓ Progress tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* System Tray & Notifications */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Bell className="w-8 h-8 text-purple-500" />
          System Integration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              System Tray
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Minimize to system tray</li>
              <li>• Quick access to recent projects</li>
              <li>• Status indicators (sync/error)</li>
              <li>• Platform-specific behavior</li>
              <li>• Background operation</li>
            </ul>
            <div className="mt-4 text-xs text-gray-400">
              <p><strong>macOS:</strong> Menu bar icon</p>
              <p><strong>Windows:</strong> System tray with balloon tips</p>
              <p><strong>Linux:</strong> Standard tray behavior</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              Native Notifications
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Success/Error/Info notifications</li>
              <li>• Git operation alerts</li>
              <li>• Build status updates</li>
              <li>• Update availability notices</li>
              <li>• Click actions to open content</li>
            </ul>
            <div className="mt-4">
              <pre className="bg-gray-900 p-2 rounded text-xs">
                <code>{`await showSuccessNotification(
  'Build Complete',
  'Project built in 2.3s'
)`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Auto Updates */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <RefreshCw className="w-8 h-8 text-green-500" />
          Automatic Updates
        </h2>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Stay Up to Date</h3>
          <p className="mb-4">The desktop app automatically checks for updates and can install them seamlessly.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Update Process</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                <li>Automatic update checks every 4 hours</li>
                <li>Background download when available</li>
                <li>Visual progress tracking</li>
                <li>Install on quit or restart now</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Update Settings</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✓ Auto-download updates</li>
                <li>✓ Install on app quit</li>
                <li>✓ Check interval configuration</li>
                <li>✓ Pre-release opt-in</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-2">Update Notification Component</h4>
          <p className="text-sm text-gray-400 mb-2">
            When an update is available, a notification appears in the top-right corner with download progress and install options.
          </p>
          <pre className="bg-gray-900 p-3 rounded text-sm">
            <code>{`import { UpdateNotification } from '@components/UpdateNotification'

// Add to your app layout
<UpdateNotification />`}</code>
          </pre>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-500" />
          Advanced Features
        </h2>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-yellow-500" />
              Advanced Search
            </h3>
            <pre className="bg-gray-900 p-3 rounded text-sm">
              <code>{`// Search by name pattern
await electronAPI.search.byName(projectPath, '*.tsx')

// Search by content
await electronAPI.search.byContent(projectPath, 'TODO:')

// Search by modification time
await electronAPI.search.byModified(projectPath, { within: 86400000 })`}</code>
            </pre>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Command className="w-5 h-5 text-blue-500" />
              Native Menus & Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">File Operations</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>Cmd/Ctrl+N - New project</li>
                  <li>Cmd/Ctrl+O - Open project</li>
                  <li>Cmd/Ctrl+S - Save file</li>
                  <li>Cmd/Ctrl+Shift+S - Save all</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Claude Operations</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>Cmd/Ctrl+Shift+N - New chat</li>
                  <li>Cmd/Ctrl+Shift+C - Clear chat</li>
                  <li>F1 - Open documentation</li>
                  <li>F11 - Toggle fullscreen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-500" />
              Local Storage
            </h3>
            <pre className="bg-gray-900 p-3 rounded text-sm">
              <code>{`Projects: ~/LoveClaudeCode/projects/
Settings: ~/LoveClaudeCode/settings.json
Cache:    ~/LoveClaudeCode/cache/
Logs:     ~/LoveClaudeCode/logs/`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Offline Development */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <WifiOff className="w-8 h-8 text-green-500" />
          Offline Development
        </h2>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Offline Features</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-400">✓ Available Offline</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Project management</li>
                <li>• Code editing</li>
                <li>• File operations</li>
                <li>• Git operations</li>
                <li>• Search and navigation</li>
                <li>• Import/Export</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-400">✗ Requires Internet</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Claude AI assistance</li>
                <li>• Live preview (needs server)</li>
                <li>• Remote Git operations</li>
                <li>• Package installation</li>
                <li>• Cloud sync</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-8 h-8 text-red-500" />
          Security Considerations
        </h2>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Important Security Notes</h3>
          <ul className="space-y-2">
            <li>• API keys are stored in the system keychain</li>
            <li>• OAuth tokens are stored in user home directory</li>
            <li>• All credentials are encrypted at rest</li>
            <li>• User code runs in the main process (not sandboxed)</li>
            <li>• Be cautious with untrusted projects</li>
            <li>• Review code before execution</li>
          </ul>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Troubleshooting</h2>
        
        <div className="space-y-4">
          <details className="bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-medium">OAuth Token Not Found</summary>
            <pre className="mt-4 bg-gray-900 p-3 rounded text-sm">
              <code>{`# Manually run OAuth setup
claude setup-token

# Verify token exists
ls ~/.claude/oauth_token.json`}</code>
            </pre>
          </details>

          <details className="bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-medium">Git Operations Failing</summary>
            <pre className="mt-4 bg-gray-900 p-3 rounded text-sm">
              <code>{`# Check Git installation
git --version

# Verify repository
cd /path/to/project
git status`}</code>
            </pre>
          </details>

          <details className="bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-medium">High Memory Usage</summary>
            <ul className="mt-4 space-y-1 text-sm">
              <li>• Close unused projects</li>
              <li>• Disable file watching for large directories</li>
              <li>• Increase Node.js memory limit in settings</li>
              <li>• Clear application cache</li>
            </ul>
          </details>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Additional Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/docs/DESKTOP_FEATURES.md"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors block no-underline"
          >
            <h3 className="text-lg font-semibold mb-2">Desktop Features Guide</h3>
            <p className="text-sm text-gray-400">
              Comprehensive guide to all desktop app features
            </p>
          </a>
          
          <a 
            href="https://github.com/love-claude-code/love-claude-code/issues"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors block no-underline"
          >
            <h3 className="text-lg font-semibold mb-2">Report Issues</h3>
            <p className="text-sm text-gray-400">
              Found a bug? Let us know on GitHub
            </p>
          </a>
        </div>
      </section>
    </div>
  )
}