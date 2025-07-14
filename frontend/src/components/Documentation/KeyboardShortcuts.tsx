import { motion } from 'framer-motion'

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

export function KeyboardShortcuts() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmd = isMac ? '⌘' : 'Ctrl'
  const alt = isMac ? '⌥' : 'Alt'
  const shift = '⇧'
  
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'General',
      shortcuts: [
        { keys: [cmd, 'S'], description: 'Save current file' },
        { keys: [cmd, shift, 'S'], description: 'Save all files' },
        { keys: [cmd, 'P'], description: 'Quick file open' },
        { keys: [cmd, shift, 'P'], description: 'Command palette' },
        { keys: [cmd, ','], description: 'Open settings' },
        { keys: ['F1'], description: 'Open help' }
      ]
    },
    {
      title: 'Editor',
      shortcuts: [
        { keys: [cmd, 'X'], description: 'Cut line' },
        { keys: [cmd, 'C'], description: 'Copy line' },
        { keys: [cmd, 'V'], description: 'Paste' },
        { keys: [cmd, 'Z'], description: 'Undo' },
        { keys: [cmd, shift, 'Z'], description: 'Redo' },
        { keys: [cmd, 'F'], description: 'Find' },
        { keys: [cmd, 'H'], description: 'Replace' },
        { keys: [cmd, 'D'], description: 'Select next occurrence' },
        { keys: [alt, '↑'], description: 'Move line up' },
        { keys: [alt, '↓'], description: 'Move line down' },
        { keys: [cmd, '/'], description: 'Toggle comment' }
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: [cmd, '←'], description: 'Go to beginning of line' },
        { keys: [cmd, '→'], description: 'Go to end of line' },
        { keys: [cmd, '↑'], description: 'Go to beginning of file' },
        { keys: [cmd, '↓'], description: 'Go to end of file' },
        { keys: [cmd, 'G'], description: 'Go to line' },
        { keys: ['F12'], description: 'Go to definition' },
        { keys: [alt, 'F12'], description: 'Peek definition' }
      ]
    },
    {
      title: 'View',
      shortcuts: [
        { keys: [cmd, 'B'], description: 'Toggle sidebar' },
        { keys: [cmd, '`'], description: 'Toggle terminal' },
        { keys: [cmd, shift, 'E'], description: 'Focus explorer' },
        { keys: [cmd, shift, 'F'], description: 'Search in files' },
        { keys: [cmd, '='], description: 'Zoom in' },
        { keys: [cmd, '-'], description: 'Zoom out' },
        { keys: [cmd, '0'], description: 'Reset zoom' }
      ]
    },
    {
      title: 'Chat',
      shortcuts: [
        { keys: [cmd, 'Enter'], description: 'Send message' },
        { keys: [shift, 'Enter'], description: 'New line in message' },
        { keys: ['Esc'], description: 'Clear chat input' },
        { keys: [cmd, 'K'], description: 'Clear chat history' }
      ]
    }
  ]
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Keyboard Shortcuts</h2>
      <p className="text-muted-foreground mb-8">
        Master these keyboard shortcuts to boost your productivity in Love Claude Code.
      </p>
      
      <div className="space-y-8">
        {shortcutGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
            <div className="bg-card/50 border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  {group.shortcuts.map((shortcut, index) => (
                    <tr
                      key={index}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors"
                    >
                      <td className="px-4 py-3 w-1/3">
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex}>
                              {keyIndex > 0 && <span className="mx-1 text-muted-foreground">+</span>}
                              <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                                {key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {shortcut.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-lg"
      >
        <p className="text-sm">
          <strong>Pro tip:</strong> You can customize these shortcuts in Settings → Keyboard Shortcuts
        </p>
      </motion.div>
    </div>
  )
}