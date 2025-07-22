const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class GitService {
  constructor() {
    this.isGitInstalled = null;
    this.gitVersion = null;
  }

  /**
   * Check if Git is installed
   */
  async checkInstallation() {
    return new Promise((resolve) => {
      exec('git --version', (error, stdout, stderr) => {
        if (error) {
          this.isGitInstalled = false;
          resolve({
            installed: false,
            error: 'Git is not installed or not in PATH'
          });
        } else {
          this.isGitInstalled = true;
          this.gitVersion = stdout.trim();
          resolve({
            installed: true,
            version: this.gitVersion
          });
        }
      });
    });
  }

  /**
   * Check if a directory is a Git repository
   */
  async isGitRepo(projectPath) {
    try {
      const gitPath = path.join(projectPath, '.git');
      const stats = await fs.stat(gitPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize a new Git repository
   */
  async initRepo(projectPath) {
    return new Promise((resolve, reject) => {
      exec('git init', { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            message: stdout.trim()
          });
        }
      });
    });
  }

  /**
   * Get repository status
   */
  async getStatus(projectPath) {
    return new Promise((resolve, reject) => {
      exec('git status --porcelain', { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message,
            isRepo: false
          });
        } else {
          // Parse status output
          const files = stdout.trim().split('\n').filter(line => line)
            .map(line => {
              const status = line.substring(0, 2);
              const file = line.substring(3);
              
              let statusText = 'unknown';
              if (status === '??') statusText = 'untracked';
              else if (status === 'M ') statusText = 'modified';
              else if (status === 'A ') statusText = 'added';
              else if (status === 'D ') statusText = 'deleted';
              else if (status === 'R ') statusText = 'renamed';
              else if (status === ' M') statusText = 'modified-unstaged';
              else if (status === 'MM') statusText = 'modified-staged-unstaged';
              
              return { file, status: statusText, raw: status };
            });

          resolve({
            success: true,
            isRepo: true,
            files,
            clean: files.length === 0
          });
        }
      });
    });
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(projectPath) {
    return new Promise((resolve, reject) => {
      exec('git branch --show-current', { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          // Try alternative method for older Git versions
          exec('git rev-parse --abbrev-ref HEAD', { cwd: projectPath }, (error2, stdout2, stderr2) => {
            if (error2) {
              reject({
                success: false,
                error: stderr2 || error2.message
              });
            } else {
              resolve({
                success: true,
                branch: stdout2.trim()
              });
            }
          });
        } else {
          resolve({
            success: true,
            branch: stdout.trim() || 'master'
          });
        }
      });
    });
  }

  /**
   * Get all branches
   */
  async getBranches(projectPath) {
    return new Promise((resolve, reject) => {
      exec('git branch', { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          const branches = stdout.trim().split('\n')
            .map(line => ({
              name: line.replace(/^\*?\s+/, ''),
              current: line.startsWith('*')
            }));

          resolve({
            success: true,
            branches
          });
        }
      });
    });
  }

  /**
   * Switch branch
   */
  async switchBranch(projectPath, branchName) {
    return new Promise((resolve, reject) => {
      exec(`git checkout ${branchName}`, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            message: stdout.trim()
          });
        }
      });
    });
  }

  /**
   * Get commit history
   */
  async getCommitHistory(projectPath, limit = 20) {
    return new Promise((resolve, reject) => {
      const format = '%H|%an|%ae|%ad|%s';
      exec(`git log --pretty=format:"${format}" -n ${limit} --date=iso`, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message,
            commits: []
          });
        } else {
          const commits = stdout.trim().split('\n').filter(line => line)
            .map(line => {
              const [hash, author, email, date, message] = line.split('|');
              return {
                hash: hash.substring(0, 7),
                fullHash: hash,
                author,
                email,
                date: new Date(date),
                message
              };
            });

          resolve({
            success: true,
            commits
          });
        }
      });
    });
  }

  /**
   * Stage files
   */
  async stageFiles(projectPath, files) {
    return new Promise((resolve, reject) => {
      const fileArgs = Array.isArray(files) ? files.join(' ') : files;
      exec(`git add ${fileArgs}`, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true
          });
        }
      });
    });
  }

  /**
   * Unstage files
   */
  async unstageFiles(projectPath, files) {
    return new Promise((resolve, reject) => {
      const fileArgs = Array.isArray(files) ? files.join(' ') : files;
      exec(`git reset HEAD ${fileArgs}`, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true
          });
        }
      });
    });
  }

  /**
   * Create a commit
   */
  async commit(projectPath, message) {
    return new Promise((resolve, reject) => {
      // Escape the message for shell
      const escapedMessage = message.replace(/"/g, '\\"');
      exec(`git commit -m "${escapedMessage}"`, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            message: stdout.trim()
          });
        }
      });
    });
  }

  /**
   * Get diff for a file
   */
  async getDiff(projectPath, file) {
    return new Promise((resolve, reject) => {
      exec(`git diff "${file}"`, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            diff: stdout
          });
        }
      });
    });
  }

  /**
   * Get remote information
   */
  async getRemotes(projectPath) {
    return new Promise((resolve, reject) => {
      exec('git remote -v', { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message,
            remotes: []
          });
        } else {
          const remotes = {};
          stdout.trim().split('\n').filter(line => line)
            .forEach(line => {
              const [name, url, type] = line.split(/\s+/);
              if (!remotes[name]) {
                remotes[name] = {};
              }
              remotes[name][type.replace(/[()]/g, '')] = url;
            });

          resolve({
            success: true,
            remotes: Object.entries(remotes).map(([name, urls]) => ({
              name,
              ...urls
            }))
          });
        }
      });
    });
  }

  /**
   * Pull changes from remote
   */
  async pull(projectPath, remote = 'origin', branch = null) {
    return new Promise((resolve, reject) => {
      const command = branch ? `git pull ${remote} ${branch}` : `git pull ${remote}`;
      exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            message: stdout.trim()
          });
        }
      });
    });
  }

  /**
   * Push changes to remote
   */
  async push(projectPath, remote = 'origin', branch = null) {
    return new Promise((resolve, reject) => {
      const command = branch ? `git push ${remote} ${branch}` : `git push ${remote}`;
      exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            message: stdout.trim()
          });
        }
      });
    });
  }
}

// Export singleton instance
module.exports = new GitService();