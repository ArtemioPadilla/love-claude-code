import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { platformVersion } from '../versioning/platformVersion';
import { platformSelfTest } from '../selfTest/platformSelfTest';

export const DeploymentEnvironment = z.enum(['development', 'staging', 'production']);
export type DeploymentEnvironment = z.infer<typeof DeploymentEnvironment>;

export const DeploymentStatus = z.enum([
  'idle',
  'preparing',
  'deploying',
  'testing',
  'completed',
  'failed',
  'rolling-back'
]);
export type DeploymentStatus = z.infer<typeof DeploymentStatus>;

export interface DeploymentConfig {
  environment: DeploymentEnvironment;
  version: string;
  features: {
    hotReload: boolean;
    gradualRollout: boolean;
    autoRollback: boolean;
    runTests: boolean;
  };
  rollout: {
    strategy: 'immediate' | 'canary' | 'blue-green';
    canaryPercentage?: number;
    canaryDuration?: number; // minutes
  };
  providers: {
    backend: 'local' | 'firebase' | 'aws';
    hosting: 'local' | 'vercel' | 'netlify' | 'aws';
  };
}

export interface DeploymentResult {
  id: string;
  status: DeploymentStatus;
  startTime: Date;
  endTime?: Date;
  version: string;
  environment: DeploymentEnvironment;
  logs: DeploymentLog[];
  metrics?: DeploymentMetrics;
  error?: string;
}

export interface DeploymentLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface DeploymentMetrics {
  duration: number;
  testsRun: number;
  testsPassed: number;
  performanceScore: number;
  healthCheckStatus: 'healthy' | 'degraded' | 'unhealthy';
}

class SelfDeploymentService {
  private currentDeployment: DeploymentResult | null = null;
  private deploymentHistory: DeploymentResult[] = [];
  private rollbackSnapshots: Map<string, DeploymentSnapshot> = new Map();

  async getCurrentVersion(): Promise<string> {
    return platformVersion.getCurrentVersion();
  }

  async getAvailableVersions(): Promise<string[]> {
    return platformVersion.getAvailableVersions();
  }

  async deployPlatform(config: DeploymentConfig): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId();
    const deployment: DeploymentResult = {
      id: deploymentId,
      status: 'preparing',
      startTime: new Date(),
      version: config.version,
      environment: config.environment,
      logs: []
    };

    this.currentDeployment = deployment;
    this.addLog(deployment, 'info', `Starting deployment of version ${config.version} to ${config.environment}`);

    try {
      // Create rollback snapshot
      if (config.features.autoRollback) {
        await this.createRollbackSnapshot(deploymentId);
      }

      // Pre-deployment checks
      await this.runPreDeploymentChecks(deployment, config);

      // Deploy based on strategy
      deployment.status = 'deploying';
      await this.executeDeployment(deployment, config);

      // Run tests if enabled
      if (config.features.runTests) {
        deployment.status = 'testing';
        await this.runPostDeploymentTests(deployment, config);
      }

      // Health checks
      await this.performHealthChecks(deployment);

      // Complete deployment
      deployment.status = 'completed';
      deployment.endTime = new Date();
      deployment.metrics = await this.collectMetrics(deployment);
      
      this.addLog(deployment, 'info', 'Deployment completed successfully');
      toast.success(`Deployment to ${config.environment} completed`);

    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error instanceof Error ? error.message : 'Unknown error';
      deployment.endTime = new Date();
      
      this.addLog(deployment, 'error', `Deployment failed: ${deployment.error}`);
      toast.error(`Deployment failed: ${deployment.error}`);

      // Auto-rollback if enabled
      if (config.features.autoRollback && this.rollbackSnapshots.has(deploymentId)) {
        await this.rollback(deploymentId);
      }
    }

    this.deploymentHistory.push(deployment);
    this.currentDeployment = null;
    return deployment;
  }

  async rollback(deploymentId: string): Promise<void> {
    const snapshot = this.rollbackSnapshots.get(deploymentId);
    if (!snapshot) {
      throw new Error('No rollback snapshot available');
    }

    const rollbackDeployment: DeploymentResult = {
      id: this.generateDeploymentId(),
      status: 'rolling-back',
      startTime: new Date(),
      version: snapshot.version,
      environment: snapshot.environment,
      logs: []
    };

    this.currentDeployment = rollbackDeployment;
    this.addLog(rollbackDeployment, 'info', `Rolling back to version ${snapshot.version}`);

    try {
      // Restore snapshot
      await this.restoreSnapshot(snapshot);
      
      // Verify rollback
      await this.performHealthChecks(rollbackDeployment);
      
      rollbackDeployment.status = 'completed';
      rollbackDeployment.endTime = new Date();
      
      this.addLog(rollbackDeployment, 'info', 'Rollback completed successfully');
      toast.success('Rollback completed');
    } catch (error) {
      rollbackDeployment.status = 'failed';
      rollbackDeployment.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.addLog(rollbackDeployment, 'error', `Rollback failed: ${rollbackDeployment.error}`);
      toast.error(`Rollback failed: ${rollbackDeployment.error}`);
    }

    this.deploymentHistory.push(rollbackDeployment);
    this.currentDeployment = null;
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentResult | null> {
    if (this.currentDeployment?.id === deploymentId) {
      return this.currentDeployment;
    }
    return this.deploymentHistory.find(d => d.id === deploymentId) || null;
  }

  getDeploymentHistory(): DeploymentResult[] {
    return [...this.deploymentHistory];
  }

  subscribeToDeployment(deploymentId: string, callback: (deployment: DeploymentResult) => void): () => void {
    // In a real implementation, this would use WebSockets or SSE
    const interval = setInterval(() => {
      const deployment = this.currentDeployment?.id === deploymentId ? this.currentDeployment : null;
      if (deployment) {
        callback(deployment);
      }
    }, 1000);

    return () => clearInterval(interval);
  }

  private async runPreDeploymentChecks(deployment: DeploymentResult, config: DeploymentConfig): Promise<void> {
    this.addLog(deployment, 'info', 'Running pre-deployment checks');
    
    // Check version compatibility
    const isCompatible = await platformVersion.checkCompatibility(config.version);
    if (!isCompatible) {
      throw new Error(`Version ${config.version} is not compatible with current platform`);
    }

    // Check environment readiness
    const environmentReady = await this.checkEnvironmentReadiness(config.environment);
    if (!environmentReady) {
      throw new Error(`Environment ${config.environment} is not ready for deployment`);
    }

    // Run self-tests
    const testResults = await platformSelfTest.runQuickTests();
    if (!testResults.passed) {
      throw new Error('Pre-deployment tests failed');
    }
  }

  private async executeDeployment(deployment: DeploymentResult, config: DeploymentConfig): Promise<void> {
    this.addLog(deployment, 'info', `Executing ${config.rollout.strategy} deployment`);

    switch (config.rollout.strategy) {
      case 'immediate':
        await this.immediateDeployment(deployment, config);
        break;
      case 'canary':
        await this.canaryDeployment(deployment, config);
        break;
      case 'blue-green':
        await this.blueGreenDeployment(deployment, config);
        break;
    }
  }

  private async immediateDeployment(deployment: DeploymentResult, _config: DeploymentConfig): Promise<void> {
    // Simulate deployment steps
    const steps = [
      'Downloading platform bundle',
      'Installing dependencies',
      'Building application',
      'Migrating data',
      'Updating configuration',
      'Restarting services'
    ];

    for (const step of steps) {
      this.addLog(deployment, 'info', step);
      await this.simulateDelay(1000 + Math.random() * 2000);
    }
  }

  private async canaryDeployment(deployment: DeploymentResult, config: DeploymentConfig): Promise<void> {
    const percentage = config.rollout.canaryPercentage || 10;
    const duration = config.rollout.canaryDuration || 30;
    
    this.addLog(deployment, 'info', `Starting canary deployment with ${percentage}% traffic`);
    await this.simulateDelay(2000);
    
    this.addLog(deployment, 'info', `Monitoring canary for ${duration} minutes`);
    await this.simulateDelay(3000);
    
    this.addLog(deployment, 'info', 'Canary metrics look good, proceeding with full rollout');
    await this.immediateDeployment(deployment, config);
  }

  private async blueGreenDeployment(deployment: DeploymentResult, _config: DeploymentConfig): Promise<void> {
    this.addLog(deployment, 'info', 'Setting up green environment');
    await this.simulateDelay(3000);
    
    this.addLog(deployment, 'info', 'Running smoke tests on green environment');
    await this.simulateDelay(2000);
    
    this.addLog(deployment, 'info', 'Switching traffic to green environment');
    await this.simulateDelay(1000);
    
    this.addLog(deployment, 'info', 'Decommissioning blue environment');
    await this.simulateDelay(1000);
  }

  private async runPostDeploymentTests(deployment: DeploymentResult, _config: DeploymentConfig): Promise<void> {
    this.addLog(deployment, 'info', 'Running post-deployment tests');
    
    const testResults = await platformSelfTest.runFullTests();
    deployment.metrics = {
      ...deployment.metrics!,
      testsRun: testResults.totalTests,
      testsPassed: testResults.passedTests
    };

    if (!testResults.passed) {
      throw new Error(`Post-deployment tests failed: ${testResults.failedTests} tests failed`);
    }
  }

  private async performHealthChecks(deployment: DeploymentResult): Promise<void> {
    this.addLog(deployment, 'info', 'Performing health checks');
    
    const health = await platformSelfTest.checkHealth();
    if (deployment.metrics) {
      deployment.metrics.healthCheckStatus = health.status;
    }

    if (health.status === 'unhealthy') {
      throw new Error('Health checks failed');
    }
  }

  private async collectMetrics(deployment: DeploymentResult): Promise<DeploymentMetrics> {
    const duration = deployment.endTime!.getTime() - deployment.startTime.getTime();
    const testResults = await platformSelfTest.getLastTestResults();
    const health = await platformSelfTest.checkHealth();

    return {
      duration,
      testsRun: testResults?.totalTests || 0,
      testsPassed: testResults?.passedTests || 0,
      performanceScore: Math.round(Math.random() * 20 + 80), // Simulated
      healthCheckStatus: health.status
    };
  }

  private async createRollbackSnapshot(deploymentId: string): Promise<void> {
    const snapshot: DeploymentSnapshot = {
      id: deploymentId,
      version: await this.getCurrentVersion(),
      environment: 'production', // This would be dynamic
      timestamp: new Date(),
      config: {} // Would include actual config
    };
    
    this.rollbackSnapshots.set(deploymentId, snapshot);
  }

  private async restoreSnapshot(snapshot: DeploymentSnapshot): Promise<void> {
    // Simulate restoration
    await this.simulateDelay(3000);
  }

  private async checkEnvironmentReadiness(environment: DeploymentEnvironment): Promise<boolean> {
    // Simulate environment check
    await this.simulateDelay(500);
    return true;
  }

  private addLog(deployment: DeploymentResult, level: DeploymentLog['level'], message: string, details?: any): void {
    deployment.logs.push({
      timestamp: new Date(),
      level,
      message,
      details
    });
  }

  private generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface DeploymentSnapshot {
  id: string;
  version: string;
  environment: DeploymentEnvironment;
  timestamp: Date;
  config: any;
}

export const selfDeploymentService = new SelfDeploymentService();