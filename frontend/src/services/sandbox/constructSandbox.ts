interface SandboxExecuteOptions {
  code: string;
  props?: Record<string, any>;
  constructName?: string;
  security?: SandboxSecurityOptions;
}

interface SandboxSecurityOptions {
  resourceLimits?: {
    cpu?: {
      cores?: number;
      percentage?: number;
    };
    memory?: {
      maxBytes?: number;
      heapSize?: number;
    };
    executionTime?: number; // milliseconds
    network?: {
      allowedHosts?: string[];
      blockAllNetwork?: boolean;
      maxRequests?: number;
      maxBandwidth?: number; // bytes/sec
    };
  };
  credentials?: {
    vault?: 'local' | 'aws-secrets' | 'azure-keyvault' | 'hashicorp';
    encryptionKey?: string;
    allowedKeys?: string[];
  };
  monitoring?: {
    enabled?: boolean;
    collectMetrics?: boolean;
    logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  };
}

interface SandboxResult {
  html?: string;
  error?: string;
  logs?: string[];
  metrics?: SandboxMetrics;
  securityViolations?: SecurityViolation[];
}

interface SandboxMetrics {
  executionTime: number;
  memoryUsed: number;
  cpuTime: number;
  networkRequests: number;
  resourceViolations: string[];
}

interface SecurityViolation {
  type: 'network' | 'resource' | 'credential' | 'code';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  details?: any;
}

/**
 * Secure credential storage interface
 */
class SecureCredentialStore {
  private credentials = new Map<string, string>();
  private encryptionKey: string;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || this.generateKey();
  }

  private generateKey(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async store(key: string, value: string): Promise<void> {
    // In production, this would use proper encryption
    const encrypted = btoa(value); // Simple encoding for demo
    this.credentials.set(key, encrypted);
  }

  async retrieve(key: string): Promise<string | null> {
    const encrypted = this.credentials.get(key);
    if (!encrypted) return null;
    return atob(encrypted); // Simple decoding for demo
  }

  async delete(key: string): Promise<void> {
    this.credentials.delete(key);
  }
}

/**
 * Resource usage tracker
 */
class ResourceTracker {
  private startTime: number;
  private memoryCheckpoints: number[] = [];
  private networkRequests = 0;
  private violations: string[] = [];

  constructor() {
    this.startTime = performance.now();
  }

  recordMemory(bytes: number): void {
    this.memoryCheckpoints.push(bytes);
  }

  recordNetworkRequest(): void {
    this.networkRequests++;
  }

  addViolation(violation: string): void {
    this.violations.push(violation);
  }

  getMetrics(): SandboxMetrics {
    return {
      executionTime: performance.now() - this.startTime,
      memoryUsed: Math.max(...this.memoryCheckpoints, 0),
      cpuTime: performance.now() - this.startTime, // Approximate
      networkRequests: this.networkRequests,
      resourceViolations: this.violations
    };
  }
}

/**
 * Execute construct code in a sandboxed environment and return rendered HTML
 */
export async function sandboxExecute(options: SandboxExecuteOptions): Promise<SandboxResult> {
  const { code, props = {}, constructName = 'Component', security = {} } = options;
  const logs: string[] = [];
  const securityViolations: SecurityViolation[] = [];
  const resourceTracker = new ResourceTracker();
  const credentialStore = new SecureCredentialStore(security.credentials?.encryptionKey);

  try {
    // Validate security constraints
    const validationResult = await validateSecurityConstraints(code, security);
    if (!validationResult.valid) {
      return {
        error: 'Security validation failed',
        securityViolations: validationResult.violations
      };
    }

    // Apply resource limits
    const resourceLimits = security.resourceLimits || {};
    const networkPolicy = createNetworkPolicy(resourceLimits.network);
    
    // Create a sandboxed execution context with security constraints
    const sandboxHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Construct Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #root {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .error {
      color: #ef4444;
      padding: 1rem;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 0.5rem;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    // Security context initialization
    const securityContext = {
      resourceLimits: ${JSON.stringify(resourceLimits)},
      startTime: Date.now(),
      memoryLimit: ${resourceLimits.memory?.maxBytes || 50 * 1024 * 1024}, // 50MB default
      executionTimeLimit: ${resourceLimits.executionTime || 5000}, // 5s default
      networkRequests: 0,
      maxNetworkRequests: ${resourceLimits.network?.maxRequests || 10}
    };

    // Resource monitoring
    let executionTimer = setTimeout(() => {
      throw new Error('Execution time limit exceeded');
    }, securityContext.executionTimeLimit);

    // Override dangerous globals
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;
    
    // Secure fetch wrapper
    window.fetch = async function(...args) {
      const url = args[0];
      const policy = ${JSON.stringify(networkPolicy)};
      
      // Check network access
      if (policy.blockAllNetwork) {
        throw new Error('Network access is disabled');
      }
      
      if (policy.allowedHosts && policy.allowedHosts.length > 0) {
        const urlObj = new URL(url);
        if (!policy.allowedHosts.includes(urlObj.hostname)) {
          throw new Error('Access to ' + urlObj.hostname + ' is not allowed');
        }
      }
      
      // Check request limit
      if (++securityContext.networkRequests > securityContext.maxNetworkRequests) {
        throw new Error('Network request limit exceeded');
      }
      
      return originalFetch.apply(this, args);
    };

    // Disable dangerous APIs
    delete window.XMLHttpRequest;
    delete window.WebSocket;
    delete window.EventSource;
    delete window.Worker;
    delete window.SharedWorker;
    delete window.importScripts;

    // Capture console logs with security context
    const originalLog = console.log;
    const originalError = console.error;
    const logs = [];
    
    console.log = (...args) => {
      logs.push(['log', ...args]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      logs.push(['error', ...args]);
      originalError(...args);
    };

    // Memory monitoring (simplified)
    const checkMemory = () => {
      if (performance.memory && performance.memory.usedJSHeapSize > securityContext.memoryLimit) {
        throw new Error('Memory limit exceeded');
      }
    };
    
    const memoryInterval = setInterval(checkMemory, 100);

    try {
      // Transform the code
      ${code}
      
      // Get the component
      const Component = ${constructName};
      
      if (typeof Component !== 'function') {
        throw new Error('Component must be a function');
      }
      
      // Render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(Component, ${JSON.stringify(props)}));
      
      // Clean up
      clearTimeout(executionTimer);
      clearInterval(memoryInterval);
      
      // Send logs and metrics back to parent
      window.parent.postMessage({
        type: 'sandbox-logs',
        logs: logs,
        metrics: {
          executionTime: Date.now() - securityContext.startTime,
          memoryUsed: performance.memory ? performance.memory.usedJSHeapSize : 0,
          networkRequests: securityContext.networkRequests
        }
      }, '*');
    } catch (error) {
      document.getElementById('root').innerHTML = 
        '<div class="error">Error: ' + error.message + '</div>';
      
      window.parent.postMessage({
        type: 'sandbox-error',
        error: error.message
      }, '*');
    }
  </script>
</body>
</html>
`;

    return {
      html: sandboxHtml,
      logs,
      metrics: resourceTracker.getMetrics(),
      securityViolations
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      logs
    };
  }
}

/**
 * Validate construct code without executing it
 */
export async function validateConstructCode(code: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Basic syntax validation using Function constructor
    new Function(code);
    
    // Check for required exports
    if (!code.includes('export')) {
      errors.push('Code must export a component');
    }
    
    // Check for React import
    if (!code.includes('React') && !code.includes('react')) {
      errors.push('React must be imported');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`Syntax error: ${error.message}`);
    } else {
      errors.push('Invalid JavaScript code');
    }
    
    return {
      valid: false,
      errors
    };
  }
}

/**
 * Validate security constraints
 */
async function validateSecurityConstraints(
  code: string,
  security: SandboxSecurityOptions
): Promise<{
  valid: boolean;
  violations: SecurityViolation[];
}> {
  const violations: SecurityViolation[] = [];

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/, type: 'code', message: 'eval() is not allowed' },
    { pattern: /Function\s*\(/, type: 'code', message: 'Function constructor is not allowed' },
    { pattern: /import\s*\(/, type: 'code', message: 'Dynamic imports are not allowed' },
    { pattern: /require\s*\(/, type: 'code', message: 'require() is not allowed' },
    { pattern: /process\./, type: 'code', message: 'process access is not allowed' },
    { pattern: /child_process/, type: 'code', message: 'child_process is not allowed' },
    { pattern: /fs\./, type: 'code', message: 'File system access is not allowed' },
    { pattern: /__dirname|__filename/, type: 'code', message: 'Directory access is not allowed' }
  ];

  for (const { pattern, type, message } of dangerousPatterns) {
    if (pattern.test(code)) {
      violations.push({
        type: type as SecurityViolation['type'],
        severity: 'high',
        message,
        timestamp: new Date()
      });
    }
  }

  // Check for credential leaks
  const credentialPatterns = [
    { pattern: /['"]?[A-Za-z0-9]{40}['"]?/, message: 'Possible API key detected' },
    { pattern: /['"]?sk_[A-Za-z0-9]{32,}['"]?/, message: 'Possible secret key detected' },
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/, message: 'Hardcoded password detected' }
  ];

  for (const { pattern, message } of credentialPatterns) {
    if (pattern.test(code)) {
      violations.push({
        type: 'credential',
        severity: 'critical',
        message,
        timestamp: new Date()
      });
    }
  }

  return {
    valid: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
    violations
  };
}

/**
 * Create network access policy
 */
function createNetworkPolicy(networkLimits?: SandboxSecurityOptions['resourceLimits']['network']) {
  return {
    blockAllNetwork: networkLimits?.blockAllNetwork ?? true,
    allowedHosts: networkLimits?.allowedHosts || [],
    maxRequests: networkLimits?.maxRequests || 10,
    maxBandwidth: networkLimits?.maxBandwidth || 1024 * 1024 // 1MB default
  };
}

/**
 * Secure credential manager for sandbox
 */
export class SandboxCredentialManager {
  private vaultType: SandboxSecurityOptions['credentials']['vault'];
  private allowedKeys: string[];
  private cache = new Map<string, { value: string; expires: number }>();

  constructor(options: SandboxSecurityOptions['credentials'] = {}) {
    this.vaultType = options.vault || 'local';
    this.allowedKeys = options.allowedKeys || [];
  }

  async getCredential(key: string): Promise<string | null> {
    // Check if key is allowed
    if (this.allowedKeys.length > 0 && !this.allowedKeys.includes(key)) {
      throw new Error(`Access to credential '${key}' is not allowed`);
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    // Fetch from vault
    const value = await this.fetchFromVault(key);
    if (value) {
      // Cache for 5 minutes
      this.cache.set(key, {
        value,
        expires: Date.now() + 5 * 60 * 1000
      });
    }

    return value;
  }

  private async fetchFromVault(key: string): Promise<string | null> {
    switch (this.vaultType) {
      case 'local':
        // Use browser's secure storage
        return localStorage.getItem(`secure_${key}`);
      
      case 'aws-secrets':
        // Would integrate with AWS Secrets Manager
        console.warn('AWS Secrets Manager integration not implemented');
        return null;
      
      case 'azure-keyvault':
        // Would integrate with Azure Key Vault
        console.warn('Azure Key Vault integration not implemented');
        return null;
      
      case 'hashicorp':
        // Would integrate with HashiCorp Vault
        console.warn('HashiCorp Vault integration not implemented');
        return null;
      
      default:
        return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}