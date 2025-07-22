const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const archiver = require('archiver');
const extract = require('extract-zip');
const crypto = require('crypto');

class ProjectExportService {
  constructor() {
    this.tempDir = null;
  }

  /**
   * Export a project to a .lcc file (Love Claude Code project archive)
   * @param {string} projectPath - Path to the project directory
   * @param {string} outputPath - Path where to save the .lcc file
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportProject(projectPath, outputPath, options = {}) {
    try {
      const {
        includeNodeModules = false,
        includeGitHistory = false,
        includeDotFiles = true,
        compressionLevel = 6
      } = options;

      // Ensure output path has .lcc extension
      if (!outputPath.endsWith('.lcc')) {
        outputPath += '.lcc';
      }

      // Create archive
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: compressionLevel }
      });

      // Setup archive error handling
      return new Promise((resolve, reject) => {
        output.on('close', () => {
          resolve({
            success: true,
            path: outputPath,
            size: archive.pointer(),
            fileCount: this.fileCount
          });
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.on('warning', (err) => {
          console.warn('Archive warning:', err);
        });

        // Pipe archive to output
        archive.pipe(output);

        // Add project metadata
        const metadata = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          projectPath: path.basename(projectPath),
          options: {
            includeNodeModules,
            includeGitHistory,
            includeDotFiles
          }
        };

        archive.append(JSON.stringify(metadata, null, 2), { name: '.lcc-metadata.json' });

        // Reset file counter
        this.fileCount = 0;

        // Add files to archive
        this.addDirectoryToArchive(archive, projectPath, '', {
          includeNodeModules,
          includeGitHistory,
          includeDotFiles
        });

        // Finalize archive
        archive.finalize();
      });
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import a project from a .lcc file
   * @param {string} archivePath - Path to the .lcc file
   * @param {string} destinationPath - Path where to extract the project
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importProject(archivePath, destinationPath, options = {}) {
    try {
      const {
        overwrite = false,
        validateIntegrity = true
      } = options;

      // Check if archive exists
      try {
        await fs.access(archivePath);
      } catch {
        return {
          success: false,
          error: 'Archive file not found'
        };
      }

      // Check destination
      try {
        await fs.access(destinationPath);
        // Directory exists
        if (!overwrite) {
          const files = await fs.readdir(destinationPath);
          if (files.length > 0) {
            return {
              success: false,
              error: 'Destination directory is not empty. Use overwrite option to proceed.'
            };
          }
        }
      } catch {
        // Directory doesn't exist, create it
        await fs.mkdir(destinationPath, { recursive: true });
      }

      // Extract archive
      await extract(archivePath, { dir: destinationPath });

      // Read metadata
      const metadataPath = path.join(destinationPath, '.lcc-metadata.json');
      let metadata;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataContent);
        
        // Remove metadata file after reading
        await fs.unlink(metadataPath);
      } catch (error) {
        console.warn('No metadata found in archive');
        metadata = null;
      }

      // Count imported files
      const fileCount = await this.countFiles(destinationPath);

      return {
        success: true,
        path: destinationPath,
        metadata,
        fileCount
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate a .lcc archive without extracting
   * @param {string} archivePath - Path to the .lcc file
   * @returns {Promise<Object>} Validation result
   */
  async validateArchive(archivePath) {
    try {
      // Create temporary directory for validation
      const tempDir = path.join(require('os').tmpdir(), `lcc-validate-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // Extract to temp directory
        await extract(archivePath, { dir: tempDir });

        // Check for metadata
        const metadataPath = path.join(tempDir, '.lcc-metadata.json');
        let metadata;
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          metadata = JSON.parse(metadataContent);
        } catch {
          return {
            valid: false,
            error: 'Invalid archive: missing or corrupted metadata'
          };
        }

        // Count files
        const fileCount = await this.countFiles(tempDir) - 1; // Subtract metadata file

        return {
          valid: true,
          metadata,
          fileCount
        };
      } finally {
        // Clean up temp directory
        await this.removeDirectory(tempDir);
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Add directory contents to archive
   * @private
   */
  addDirectoryToArchive(archive, dirPath, archivePath, options) {
    const files = require('fs').readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const archiveFilePath = archivePath ? path.join(archivePath, file) : file;
      const stat = require('fs').statSync(filePath);

      // Skip based on options
      if (!options.includeNodeModules && file === 'node_modules') continue;
      if (!options.includeGitHistory && file === '.git') continue;
      if (!options.includeDotFiles && file.startsWith('.') && file !== '.lcc-metadata.json') continue;
      
      // Skip common build/cache directories
      if (['dist', 'build', '.next', '.turbo', 'coverage', '.cache'].includes(file)) continue;

      if (stat.isDirectory()) {
        // Recursively add directory
        this.addDirectoryToArchive(archive, filePath, archiveFilePath, options);
      } else {
        // Add file
        archive.file(filePath, { name: archiveFilePath });
        this.fileCount++;
      }
    }
  }

  /**
   * Count files in directory
   * @private
   */
  async countFiles(dirPath) {
    let count = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        count += await this.countFiles(filePath);
      } else {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Remove directory recursively
   * @private
   */
  async removeDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }
      
      await fs.rmdir(dirPath);
    } catch (error) {
      console.error('Error removing directory:', error);
    }
  }

  /**
   * Create a project template archive
   * @param {string} templateName - Name of the template
   * @param {string} templatePath - Path to template directory
   * @param {string} outputDir - Directory to save template
   * @returns {Promise<Object>} Template creation result
   */
  async createTemplate(templateName, templatePath, outputDir) {
    try {
      const outputPath = path.join(outputDir, `${templateName}.lcc-template`);
      
      // Add template-specific metadata
      const templateMetadata = {
        isTemplate: true,
        templateName,
        createdDate: new Date().toISOString(),
        description: ''
      };

      // Create template metadata file
      const metadataPath = path.join(templatePath, '.lcc-template.json');
      await fs.writeFile(metadataPath, JSON.stringify(templateMetadata, null, 2));

      // Export as template
      const result = await this.exportProject(templatePath, outputPath, {
        includeNodeModules: false,
        includeGitHistory: false,
        includeDotFiles: true
      });

      // Remove temporary metadata file
      await fs.unlink(metadataPath);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get export size estimate
   * @param {string} projectPath - Path to project
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Size estimate
   */
  async getExportSizeEstimate(projectPath, options = {}) {
    try {
      const {
        includeNodeModules = false,
        includeGitHistory = false,
        includeDotFiles = true
      } = options;

      let totalSize = 0;
      let fileCount = 0;

      const calculateSize = async (dirPath) => {
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          
          // Skip based on options
          if (!includeNodeModules && file === 'node_modules') continue;
          if (!includeGitHistory && file === '.git') continue;
          if (!includeDotFiles && file.startsWith('.')) continue;
          if (['dist', 'build', '.next', '.turbo', 'coverage', '.cache'].includes(file)) continue;

          const stat = await fs.stat(filePath);
          
          if (stat.isDirectory()) {
            await calculateSize(filePath);
          } else {
            totalSize += stat.size;
            fileCount++;
          }
        }
      };

      await calculateSize(projectPath);

      // Estimate compressed size (roughly 30-50% of original)
      const estimatedCompressedSize = Math.floor(totalSize * 0.4);

      return {
        originalSize: totalSize,
        estimatedCompressedSize,
        fileCount,
        formattedOriginal: this.formatBytes(totalSize),
        formattedCompressed: this.formatBytes(estimatedCompressedSize)
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * Format bytes to human readable string
   * @private
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = ProjectExportService;