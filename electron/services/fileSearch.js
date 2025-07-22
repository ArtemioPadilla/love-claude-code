const fs = require('fs').promises;
const path = require('path');

class FileSearchService {
  constructor() {
    this.searchCache = new Map();
    this.ignoredPatterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.log',
      '**/.DS_Store',
      '**/Thumbs.db'
    ];
  }

  /**
   * Search for files by name pattern
   */
  async searchByName(directory, pattern, options = {}) {
    try {
      const results = [];
      const searchRegex = this.patternToRegex(pattern);
      
      await this.walkDirectory(directory, async (filePath) => {
        const fileName = path.basename(filePath);
        if (searchRegex.test(fileName)) {
          results.push({
            path: filePath,
            name: fileName,
            directory: path.dirname(filePath),
            relative: path.relative(directory, filePath)
          });
        }
      });

      return {
        success: true,
        results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: [],
        count: 0
      };
    }
  }

  /**
   * Convert glob pattern to regex
   */
  patternToRegex(pattern) {
    // Escape special regex characters except * and ?
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    // Replace * with .* and ? with .
    const regexPattern = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`, 'i');
  }

  /**
   * Recursively walk directory
   */
  async walkDirectory(dir, callback) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        // Check if should ignore
        if (this.shouldIgnore(fullPath)) continue;
        
        if (item.isDirectory()) {
          await this.walkDirectory(fullPath, callback);
        } else if (item.isFile()) {
          await callback(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      if (error.code !== 'EACCES' && error.code !== 'EPERM') {
        throw error;
      }
    }
  }

  /**
   * Check if path should be ignored
   */
  shouldIgnore(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return this.ignoredPatterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');
      const regex = new RegExp(regexPattern);
      return regex.test(normalizedPath);
    });
  }

  /**
   * Search for files containing specific text
   */
  async searchByContent(directory, searchText, options = {}) {
    const { 
      filePattern = '*', 
      caseSensitive = false,
      maxResults = 100 
    } = options;

    try {
      // First find all files matching the pattern
      const filesResult = await this.searchByName(directory, filePattern);
      if (!filesResult.success) {
        return filesResult;
      }

      const results = [];
      const searchRegex = new RegExp(
        searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        caseSensitive ? 'g' : 'gi'
      );

      // Search through files
      for (const file of filesResult.results) {
        if (results.length >= maxResults) break;

        try {
          const content = await fs.readFile(file.path, 'utf-8');
          const lines = content.split('\n');
          const matches = [];

          lines.forEach((line, index) => {
            if (searchRegex.test(line)) {
              matches.push({
                line: index + 1,
                text: line.trim(),
                preview: this.getLinePreview(line, searchText, caseSensitive)
              });
            }
          });

          if (matches.length > 0) {
            results.push({
              ...file,
              matches,
              matchCount: matches.length
            });
          }
        } catch (err) {
          // Skip files that can't be read (binary files, etc.)
          continue;
        }
      }

      return {
        success: true,
        results,
        count: results.length,
        totalFilesSearched: filesResult.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: [],
        count: 0
      };
    }
  }

  /**
   * Get line preview with highlighted search term
   */
  getLinePreview(line, searchText, caseSensitive = false) {
    const trimmedLine = line.trim();
    if (trimmedLine.length <= 100) {
      return trimmedLine;
    }

    // Find the position of the search text
    const regex = new RegExp(
      searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
      caseSensitive ? '' : 'i'
    );
    const match = trimmedLine.match(regex);
    
    if (match && match.index !== undefined) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(trimmedLine.length, match.index + searchText.length + 40);
      
      let preview = trimmedLine.substring(start, end);
      if (start > 0) preview = '...' + preview;
      if (end < trimmedLine.length) preview = preview + '...';
      
      return preview;
    }

    return trimmedLine.substring(0, 100) + '...';
  }

  /**
   * Find files modified within a time range
   */
  async searchByModifiedTime(directory, options = {}) {
    const { 
      since = null, 
      until = null,
      filePattern = '*'
    } = options;

    try {
      const filesResult = await this.searchByName(directory, filePattern);
      if (!filesResult.success) {
        return filesResult;
      }

      const results = [];
      const sinceTime = since ? new Date(since).getTime() : 0;
      const untilTime = until ? new Date(until).getTime() : Date.now();

      for (const file of filesResult.results) {
        try {
          const stats = await fs.stat(file.path);
          const modifiedTime = stats.mtime.getTime();

          if (modifiedTime >= sinceTime && modifiedTime <= untilTime) {
            results.push({
              ...file,
              modified: stats.mtime,
              size: stats.size
            });
          }
        } catch (err) {
          continue;
        }
      }

      // Sort by modified time (newest first)
      results.sort((a, b) => b.modified - a.modified);

      return {
        success: true,
        results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: [],
        count: 0
      };
    }
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }

  /**
   * Add custom ignore pattern
   */
  addIgnorePattern(pattern) {
    this.ignoredPatterns.push(pattern);
  }

  /**
   * Remove ignore pattern
   */
  removeIgnorePattern(pattern) {
    const index = this.ignoredPatterns.indexOf(pattern);
    if (index !== -1) {
      this.ignoredPatterns.splice(index, 1);
    }
  }
}

// Export singleton instance
module.exports = new FileSearchService();