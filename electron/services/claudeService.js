const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class ClaudeService {
  constructor() {
    this.cliPath = null;
    this.isAuthenticated = false;
    this.activeProcess = null;
    this.commandQueue = [];
    this.processing = false;
  }

  /**
   * Check if Claude CLI is installed and get its version
   */
  async checkInstallation() {
    return new Promise((resolve) => {
      exec('claude --version', (error, stdout, stderr) => {
        if (error) {
          resolve({
            installed: false,
            error: 'Claude CLI not found. Please install it first.',
            installCommand: 'npm install -g @anthropic-ai/claude-code'
          });
        } else {
          const version = stdout.trim();
          this.cliPath = 'claude'; // Use system PATH
          resolve({
            installed: true,
            version,
            path: this.cliPath
          });
        }
      });
    });
  }

  /**
   * Check for OAuth token in standard locations
   */
  async checkOAuthToken() {
    try {
      // Check for OAuth token in ~/.claude/oauth_token.json
      const claudeDir = path.join(os.homedir(), '.claude');
      const oauthTokenPath = path.join(claudeDir, 'oauth_token.json');
      
      try {
        await fs.access(oauthTokenPath);
        const tokenData = await fs.readFile(oauthTokenPath, 'utf8');
        const parsed = JSON.parse(tokenData);
        
        if (parsed.access_token) {
          return {
            exists: true,
            token: parsed.access_token,
            path: oauthTokenPath
          };
        }
      } catch (err) {
        // Token file doesn't exist or is invalid
      }
      
      // Also check for credentials file which might contain OAuth token
      const credentialsPath = path.join(claudeDir, 'credentials');
      try {
        await fs.access(credentialsPath);
        const credData = await fs.readFile(credentialsPath, 'utf8');
        // Parse credentials file if it contains OAuth token
        if (credData.includes('oauth_token')) {
          return {
            exists: true,
            path: credentialsPath
          };
        }
      } catch (err) {
        // Credentials file doesn't exist
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Error checking OAuth token:', error);
      return { exists: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated with Claude
   */
  async checkAuthentication() {
    // First check for OAuth token
    const oauthCheck = await this.checkOAuthToken();
    
    return new Promise((resolve) => {
      // Try a simple command that requires auth
      exec('claude -p "test" --output-format json', (error, stdout, stderr) => {
        if (error) {
          const errorMessage = stderr.toLowerCase();
          if (errorMessage.includes('not authenticated') || 
              errorMessage.includes('authentication') ||
              errorMessage.includes('token')) {
            this.isAuthenticated = false;
            resolve({
              authenticated: false,
              hasOAuthToken: oauthCheck.exists,
              oauthTokenPath: oauthCheck.path,
              error: 'Not authenticated. Please run: claude setup-token'
            });
          } else {
            // Some other error
            resolve({
              authenticated: false,
              hasOAuthToken: oauthCheck.exists,
              error: `CLI error: ${stderr || error.message}`
            });
          }
        } else {
          this.isAuthenticated = true;
          resolve({
            authenticated: true,
            hasOAuthToken: oauthCheck.exists,
            oauthTokenPath: oauthCheck.path
          });
        }
      });
    });
  }

  /**
   * Execute a Claude command with streaming support
   */
  async executeCommand(command, options = {}) {
    const {
      onData,
      onError,
      onComplete,
      cwd = process.cwd(),
      env = process.env
    } = options;

    // Check for OAuth token and add to environment if available
    const oauthCheck = await this.checkOAuthToken();
    let commandEnv = { ...env };
    
    if (oauthCheck.exists && oauthCheck.token) {
      // Add OAuth token to environment for Claude CLI
      commandEnv.CLAUDE_CODE_OAUTH_TOKEN = oauthCheck.token;
      console.log('Using OAuth token from', oauthCheck.path);
    }

    return new Promise((resolve, reject) => {
      // Parse the command to add output format if not present
      let args = this.parseCommand(command);
      if (!args.includes('--output-format')) {
        args.push('--output-format', 'stream-json');
      }

      // Spawn the process with potentially modified environment
      this.activeProcess = spawn('claude', args, {
        cwd,
        env: commandEnv,
        shell: true
      });

      let outputBuffer = '';
      let errorBuffer = '';

      // Handle stdout (streaming responses)
      this.activeProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        outputBuffer += chunk;

        // Try to parse streaming JSON responses
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'content' && onData) {
              onData(parsed.content);
            } else if (parsed.type === 'error' && onError) {
              onError(parsed.error);
            }
          } catch (e) {
            // Not JSON, treat as plain text
            if (onData) {
              onData(line);
            }
          }
        }
      });

      // Handle stderr
      this.activeProcess.stderr.on('data', (data) => {
        errorBuffer += data.toString();
        if (onError) {
          onError(data.toString());
        }
      });

      // Handle process completion
      this.activeProcess.on('close', (code) => {
        this.activeProcess = null;

        if (code === 0) {
          if (onComplete) {
            onComplete(outputBuffer);
          }
          resolve({
            success: true,
            output: outputBuffer,
            code
          });
        } else {
          const error = errorBuffer || `Process exited with code ${code}`;
          if (onError) {
            onError(error);
          }
          reject(new Error(error));
        }
      });

      // Handle process errors
      this.activeProcess.on('error', (error) => {
        this.activeProcess = null;
        if (onError) {
          onError(error.message);
        }
        reject(error);
      });
    });
  }

  /**
   * Execute a simple command and return the result
   */
  async execute(command) {
    // Check for OAuth token and add to environment if available
    const oauthCheck = await this.checkOAuthToken();
    let commandEnv = { ...process.env };
    
    if (oauthCheck.exists && oauthCheck.token) {
      // Add OAuth token to environment for Claude CLI
      commandEnv.CLAUDE_CODE_OAUTH_TOKEN = oauthCheck.token;
      console.log('Using OAuth token from', oauthCheck.path);
    }

    return new Promise((resolve, reject) => {
      exec(`claude ${command}`, {
        env: commandEnv
      }, (error, stdout, stderr) => {
        if (error) {
          reject({
            success: false,
            error: stderr || error.message,
            code: error.code
          });
        } else {
          resolve({
            success: true,
            output: stdout,
            code: 0
          });
        }
      });
    });
  }

  /**
   * Kill the active process if any
   */
  killActiveProcess() {
    if (this.activeProcess) {
      this.activeProcess.kill('SIGTERM');
      this.activeProcess = null;
      return true;
    }
    return false;
  }

  /**
   * Parse command string into arguments array
   */
  parseCommand(command) {
    // Simple parsing - can be enhanced for more complex cases
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      args.push(current);
    }

    return args;
  }

  /**
   * Get Claude configuration directory
   */
  async getConfigDir() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.claude');
    
    try {
      await fs.access(configDir);
      return configDir;
    } catch {
      return null;
    }
  }

  /**
   * Check if Claude token exists
   */
  async hasToken() {
    const configDir = await this.getConfigDir();
    if (!configDir) return false;

    try {
      const tokenFile = path.join(configDir, 'token');
      await fs.access(tokenFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open terminal for user to authenticate
   */
  async openAuthenticationTerminal() {
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
      // macOS
      command = `osascript -e 'tell app "Terminal" to do script "claude setup-token"'`;
    } else if (platform === 'win32') {
      // Windows
      command = 'start cmd /k claude setup-token';
    } else {
      // Linux
      command = 'gnome-terminal -- claude setup-token || xterm -e claude setup-token';
    }

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Run claude setup-token command and return status
   */
  async setupOAuthToken() {
    return new Promise((resolve, reject) => {
      // Run claude setup-token command
      const setupProcess = spawn('claude', ['setup-token'], {
        shell: true,
        stdio: 'inherit' // Inherit stdio to allow interactive input
      });

      setupProcess.on('close', async (code) => {
        if (code === 0) {
          // Check if OAuth token was created successfully
          const oauthCheck = await this.checkOAuthToken();
          resolve({
            success: true,
            hasToken: oauthCheck.exists,
            tokenPath: oauthCheck.path
          });
        } else {
          reject(new Error(`claude setup-token exited with code ${code}`));
        }
      });

      setupProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Format messages for Claude CLI
   */
  formatMessages(messages, context = {}) {
    let prompt = '';

    // Add context if provided
    if (context.projectName) {
      prompt += `Project: ${context.projectName}\n`;
    }
    if (context.currentFile) {
      prompt += `Current file: ${context.currentFile}\n`;
    }
    if (context.selectedCode) {
      prompt += `Selected code:\n\`\`\`\n${context.selectedCode}\n\`\`\`\n`;
    }

    // Add conversation history
    if (messages && messages.length > 0) {
      prompt += '\nConversation:\n';
      messages.forEach(msg => {
        if (msg.role === 'user') {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n`;
        }
      });
    }

    return prompt;
  }
}

// Export singleton instance
module.exports = new ClaudeService();