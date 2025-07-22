const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const Store = require('electron-store');

class ProjectManager {
  constructor() {
    this._store = null;
    this._projectsDir = path.join(os.homedir(), 'LoveClaudeCode');
  }

  /**
   * Get the store instance (lazy initialization)
   */
  get store() {
    if (!this._store) {
      this._store = new Store({
        name: 'projects',
        defaults: {
          projects: [],
          lastOpened: null,
          projectsDirectory: this._projectsDir
        }
      });
      // Ensure projects directory exists
      this.ensureProjectsDirectory();
    }
    return this._store;
  }

  /**
   * Ensure the projects directory exists
   */
  async ensureProjectsDirectory() {
    const projectsDir = this.store.get('projectsDirectory');
    try {
      await fs.access(projectsDir);
    } catch {
      await fs.mkdir(projectsDir, { recursive: true });
    }
  }

  /**
   * Get the projects directory
   */
  getProjectsDirectory() {
    return this.store.get('projectsDirectory');
  }

  /**
   * Set a custom projects directory
   */
  async setProjectsDirectory(newPath) {
    try {
      await fs.access(newPath);
      this.store.set('projectsDirectory', newPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Directory does not exist or is not accessible'
      };
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    const {
      name,
      description = '',
      template = 'blank',
      language = 'javascript'
    } = projectData;

    // Validate project name
    if (!name || name.length < 1) {
      return {
        success: false,
        error: 'Project name is required'
      };
    }

    // Generate project ID
    const projectId = crypto.randomBytes(8).toString('hex');
    const projectsDir = this.getProjectsDirectory();
    const projectPath = path.join(projectsDir, name);

    // Check if project already exists
    try {
      await fs.access(projectPath);
      return {
        success: false,
        error: 'A project with this name already exists'
      };
    } catch {
      // Directory doesn't exist, which is what we want
    }

    try {
      // Create project directory
      await fs.mkdir(projectPath, { recursive: true });

      // Create project structure
      await this.createProjectStructure(projectPath, template, language);

      // Create project metadata
      const project = {
        id: projectId,
        name,
        description,
        path: projectPath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        template,
        language,
        lastOpened: null
      };

      // Save to metadata store
      const projects = this.store.get('projects', []);
      projects.push(project);
      this.store.set('projects', projects);

      return {
        success: true,
        project
      };
    } catch (error) {
      // Clean up on error
      try {
        await fs.rmdir(projectPath, { recursive: true });
      } catch {}
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create project structure based on template
   */
  async createProjectStructure(projectPath, template, language) {
    const configPath = path.join(projectPath, '.loveclaudecode');
    await fs.mkdir(configPath, { recursive: true });

    // Create project config
    const projectConfig = {
      version: '1.0.0',
      template,
      language,
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(configPath, 'project.json'),
      JSON.stringify(projectConfig, null, 2)
    );

    // Create template-specific structure
    switch (template) {
      case 'web':
        await this.createWebTemplate(projectPath, language);
        break;
      case 'node':
        await this.createNodeTemplate(projectPath, language);
        break;
      case 'python':
        await this.createPythonTemplate(projectPath);
        break;
      default:
        // Blank template - just create a README
        await fs.writeFile(
          path.join(projectPath, 'README.md'),
          `# ${path.basename(projectPath)}\n\nCreated with Love Claude Code\n`
        );
    }
  }

  /**
   * Create web project template
   */
  async createWebTemplate(projectPath, language) {
    // Create directories
    const dirs = ['src', 'public', 'styles'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${path.basename(projectPath)}</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to ${path.basename(projectPath)}</h1>
        <p>Created with Love Claude Code</p>
    </div>
    <script src="src/main.${language === 'typescript' ? 'js' : 'js'}"></script>
</body>
</html>`;

    await fs.writeFile(path.join(projectPath, 'public', 'index.html'), indexHtml);

    // Create main script
    const mainScript = language === 'typescript' 
      ? `// TypeScript entry point
interface AppConfig {
  name: string;
  version: string;
}

const config: AppConfig = {
  name: '${path.basename(projectPath)}',
  version: '1.0.0'
};

console.log('App loaded:', config);`
      : `// JavaScript entry point
const config = {
  name: '${path.basename(projectPath)}',
  version: '1.0.0'
};

console.log('App loaded:', config);`;

    await fs.writeFile(
      path.join(projectPath, 'src', `main.${language === 'typescript' ? 'ts' : 'js'}`),
      mainScript
    );

    // Create styles
    const mainCss = `/* Main styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

#app {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}`;

    await fs.writeFile(path.join(projectPath, 'styles', 'main.css'), mainCss);
  }

  /**
   * Create Node.js project template
   */
  async createNodeTemplate(projectPath, language) {
    // Create package.json
    const packageJson = {
      name: path.basename(projectPath).toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: 'Created with Love Claude Code',
      main: language === 'typescript' ? 'dist/index.js' : 'index.js',
      scripts: {
        start: language === 'typescript' ? 'node dist/index.js' : 'node index.js',
        dev: language === 'typescript' ? 'ts-node src/index.ts' : 'node index.js'
      },
      keywords: [],
      author: '',
      license: 'MIT'
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create main file
    const mainFile = language === 'typescript'
      ? `// TypeScript Node.js application
console.log('Hello from ${path.basename(projectPath)}!');

// Example async function
async function main(): Promise<void> {
    console.log('App started successfully');
}

main().catch(console.error);`
      : `// Node.js application
console.log('Hello from ${path.basename(projectPath)}!');

// Example async function
async function main() {
    console.log('App started successfully');
}

main().catch(console.error);`;

    const fileName = language === 'typescript' ? 'src/index.ts' : 'index.js';
    if (language === 'typescript') {
      await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    }
    
    await fs.writeFile(path.join(projectPath, fileName), mainFile);

    // Create TypeScript config if needed
    if (language === 'typescript') {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      };

      await fs.writeFile(
        path.join(projectPath, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );
    }
  }

  /**
   * Create Python project template
   */
  async createPythonTemplate(projectPath) {
    // Create main.py
    const mainPy = `#!/usr/bin/env python3
"""
${path.basename(projectPath)}
Created with Love Claude Code
"""

def main():
    """Main entry point"""
    print(f"Hello from ${path.basename(projectPath)}!")

if __name__ == "__main__":
    main()
`;

    await fs.writeFile(path.join(projectPath, 'main.py'), mainPy);

    // Create requirements.txt
    await fs.writeFile(path.join(projectPath, 'requirements.txt'), '# Add your dependencies here\n');
  }

  /**
   * Open a project
   */
  async openProject(projectId) {
    const projects = this.store.get('projects', []);
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return {
        success: false,
        error: 'Project not found'
      };
    }

    // Check if project directory still exists
    try {
      await fs.access(project.path);
    } catch {
      return {
        success: false,
        error: 'Project directory no longer exists'
      };
    }

    // Update last opened
    project.lastOpened = new Date().toISOString();
    this.store.set('projects', projects);
    this.store.set('lastOpened', projectId);

    return {
      success: true,
      project
    };
  }

  /**
   * List all projects
   */
  async listProjects() {
    const projects = this.store.get('projects', []);
    
    // Check which projects still exist
    const validProjects = [];
    for (const project of projects) {
      try {
        await fs.access(project.path);
        validProjects.push({ ...project, exists: true });
      } catch {
        validProjects.push({ ...project, exists: false });
      }
    }

    return validProjects;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId, deleteFiles = false) {
    const projects = this.store.get('projects', []);
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return {
        success: false,
        error: 'Project not found'
      };
    }

    const project = projects[projectIndex];

    // Delete files if requested
    if (deleteFiles) {
      try {
        await fs.rm(project.path, { recursive: true, force: true });
      } catch (error) {
        return {
          success: false,
          error: `Failed to delete project files: ${error.message}`
        };
      }
    }

    // Remove from metadata
    projects.splice(projectIndex, 1);
    this.store.set('projects', projects);

    // Clear last opened if it was this project
    if (this.store.get('lastOpened') === projectId) {
      this.store.set('lastOpened', null);
    }

    return { success: true };
  }

  /**
   * Get the last opened project
   */
  getLastOpened() {
    const lastOpenedId = this.store.get('lastOpened');
    if (!lastOpenedId) return null;

    const projects = this.store.get('projects', []);
    return projects.find(p => p.id === lastOpenedId) || null;
  }

  /**
   * Update project metadata
   */
  updateProject(projectId, updates) {
    const projects = this.store.get('projects', []);
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return {
        success: false,
        error: 'Project not found'
      };
    }

    // Update allowed fields
    const allowedFields = ['name', 'description'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    }

    project.updatedAt = new Date().toISOString();
    this.store.set('projects', projects);

    return {
      success: true,
      project
    };
  }
}

// Export singleton instance
module.exports = new ProjectManager();