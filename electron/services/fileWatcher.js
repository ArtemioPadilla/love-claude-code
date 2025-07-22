const { watch } = require('fs');
const path = require('path');
const EventEmitter = require('events');

class FileWatcher extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map();
    this.ignoredPatterns = [
      /node_modules/,
      /\.git/,
      /\.next/,
      /\.turbo/,
      /dist/,
      /build/,
      /\.DS_Store/,
      /Thumbs\.db/
    ];
  }

  /**
   * Start watching a directory
   */
  watchDirectory(dirPath, options = {}) {
    // Stop existing watcher if any
    this.unwatchDirectory(dirPath);

    try {
      const watcher = watch(dirPath, {
        recursive: true,
        persistent: true
      }, (eventType, filename) => {
        if (!filename) return;

        // Check if file should be ignored
        if (this.shouldIgnore(filename)) return;

        const fullPath = path.join(dirPath, filename);
        
        // Emit appropriate event
        this.emit('change', {
          type: eventType,
          path: fullPath,
          filename: filename,
          directory: dirPath
        });
      });

      // Store watcher reference
      this.watchers.set(dirPath, watcher);

      return {
        success: true,
        directory: dirPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop watching a directory
   */
  unwatchDirectory(dirPath) {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(dirPath);
      return true;
    }
    return false;
  }

  /**
   * Stop watching all directories
   */
  unwatchAll() {
    for (const [dirPath, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
  }

  /**
   * Get list of watched directories
   */
  getWatchedDirectories() {
    return Array.from(this.watchers.keys());
  }

  /**
   * Check if a file should be ignored
   */
  shouldIgnore(filename) {
    return this.ignoredPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Add custom ignore pattern
   */
  addIgnorePattern(pattern) {
    if (pattern instanceof RegExp) {
      this.ignoredPatterns.push(pattern);
    } else {
      this.ignoredPatterns.push(new RegExp(pattern));
    }
  }

  /**
   * Remove ignore pattern
   */
  removeIgnorePattern(pattern) {
    const index = this.ignoredPatterns.findIndex(p => p.source === pattern.source);
    if (index !== -1) {
      this.ignoredPatterns.splice(index, 1);
    }
  }
}

// Export singleton instance
module.exports = new FileWatcher();