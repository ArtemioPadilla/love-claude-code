import { DeploymentEngine, DeploymentConfig, DeploymentProgress } from './deployment-engine';
import { ConstructDefinition, CloudProvider } from '../packages/core/src/base/types';
import * as pulumi from '@pulumi/pulumi/automation';

/**
 * Stack configuration
 */
export interface StackConfig {
  /** Stack name */
  name: string;
  /** Environment (dev, staging, prod) */
  environment: 'development' | 'staging' | 'production';
  /** Cloud provider */
  provider: CloudProvider;
  /** Region/location */
  region: string;
  /** Additional configuration */
  config?: Record<string, any>;
  /** Tags to apply to all resources */
  tags?: Record<string, string>;
}

/**
 * Multi-stack deployment configuration
 */
export interface MultiStackConfig {
  /** Base project name */
  projectName: string;
  /** Construct to deploy */
  construct: ConstructDefinition;
  /** Stack configurations */
  stacks: StackConfig[];
  /** Dependencies between stacks */
  dependencies?: Array<{
    from: string;
    to: string;
    outputs: string[];
  }>;
}

/**
 * Stack deployment result
 */
export interface StackDeploymentResult {
  stackName: string;
  status: 'success' | 'failed' | 'skipped';
  outputs?: Record<string, any>;
  error?: string;
  duration: number;
}

/**
 * Stack manager for orchestrating multi-stack deployments
 */
export class StackManager {
  constructor(private deploymentEngine: DeploymentEngine) {}
  
  /**
   * Deploy multiple stacks with dependency management
   */
  async deployMultiStack(
    config: MultiStackConfig,
    onProgress?: (stack: string, progress: DeploymentProgress) => void
  ): Promise<StackDeploymentResult[]> {
    const results: StackDeploymentResult[] = [];
    const deployedStacks = new Map<string, Record<string, any>>();
    
    // Build dependency graph
    const graph = this.buildDependencyGraph(config);
    
    // Get deployment order
    const deploymentOrder = this.topologicalSort(graph);
    
    // Deploy stacks in order
    for (const stackName of deploymentOrder) {
      const stackConfig = config.stacks.find(s => s.name === stackName);
      if (!stackConfig) {
        results.push({
          stackName,
          status: 'skipped',
          error: 'Stack configuration not found',
          duration: 0
        });
        continue;
      }
      
      const startTime = Date.now();
      
      try {
        // Build deployment configuration
        const deployConfig = this.buildDeploymentConfig(
          config.projectName,
          config.construct,
          stackConfig,
          deployedStacks,
          config.dependencies
        );
        
        // Deploy stack
        const result = await this.deploymentEngine.deployConstruct(
          config.construct,
          deployConfig,
          (progress) => onProgress?.(stackName, progress)
        );
        
        // Store outputs for dependent stacks
        if (result.outputs) {
          deployedStacks.set(stackName, result.outputs);
        }
        
        results.push({
          stackName,
          status: 'success',
          outputs: result.outputs,
          duration: Date.now() - startTime
        });
        
      } catch (error) {
        results.push({
          stackName,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        });
        
        // Stop deployment on failure
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Deploy stacks in parallel where possible
   */
  async deployParallel(
    config: MultiStackConfig,
    onProgress?: (stack: string, progress: DeploymentProgress) => void
  ): Promise<StackDeploymentResult[]> {
    // Build dependency graph
    const graph = this.buildDependencyGraph(config);
    
    // Get deployment waves (stacks that can be deployed in parallel)
    const waves = this.getDeploymentWaves(graph);
    
    const results: StackDeploymentResult[] = [];
    const deployedStacks = new Map<string, Record<string, any>>();
    
    // Deploy each wave
    for (const wave of waves) {
      const wavePromises = wave.map(async (stackName) => {
        const stackConfig = config.stacks.find(s => s.name === stackName);
        if (!stackConfig) {
          return {
            stackName,
            status: 'skipped' as const,
            error: 'Stack configuration not found',
            duration: 0
          };
        }
        
        const startTime = Date.now();
        
        try {
          const deployConfig = this.buildDeploymentConfig(
            config.projectName,
            config.construct,
            stackConfig,
            deployedStacks,
            config.dependencies
          );
          
          const result = await this.deploymentEngine.deployConstruct(
            config.construct,
            deployConfig,
            (progress) => onProgress?.(stackName, progress)
          );
          
          if (result.outputs) {
            deployedStacks.set(stackName, result.outputs);
          }
          
          return {
            stackName,
            status: 'success' as const,
            outputs: result.outputs,
            duration: Date.now() - startTime
          };
          
        } catch (error) {
          return {
            stackName,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime
          };
        }
      });
      
      const waveResults = await Promise.all(wavePromises);
      results.push(...waveResults);
      
      // Stop if any stack in the wave failed
      if (waveResults.some(r => r.status === 'failed')) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Preview all stack deployments
   */
  async previewMultiStack(
    config: MultiStackConfig
  ): Promise<Array<{ stackName: string; preview: any }>> {
    const previews: Array<{ stackName: string; preview: any }> = [];
    
    for (const stackConfig of config.stacks) {
      const deployConfig = this.buildDeploymentConfig(
        config.projectName,
        config.construct,
        stackConfig,
        new Map(),
        []
      );
      
      try {
        const preview = await this.deploymentEngine.previewDeployment({
          construct: config.construct,
          config: deployConfig
        });
        
        previews.push({
          stackName: stackConfig.name,
          preview
        });
      } catch (error) {
        previews.push({
          stackName: stackConfig.name,
          preview: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }
    
    return previews;
  }
  
  /**
   * Destroy multiple stacks in reverse dependency order
   */
  async destroyMultiStack(
    projectName: string,
    stackNames: string[],
    onProgress?: (stack: string, progress: DeploymentProgress) => void
  ): Promise<StackDeploymentResult[]> {
    const results: StackDeploymentResult[] = [];
    
    // Destroy in reverse order
    const reverseOrder = [...stackNames].reverse();
    
    for (const stackName of reverseOrder) {
      const startTime = Date.now();
      
      try {
        await this.deploymentEngine.destroyDeployment(
          projectName,
          stackName,
          (progress) => onProgress?.(stackName, progress)
        );
        
        results.push({
          stackName,
          status: 'success',
          duration: Date.now() - startTime
        });
        
      } catch (error) {
        results.push({
          stackName,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        });
      }
    }
    
    return results;
  }
  
  /**
   * Build dependency graph
   */
  private buildDependencyGraph(config: MultiStackConfig): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    // Initialize all nodes
    config.stacks.forEach(stack => {
      graph.set(stack.name, new Set());
    });
    
    // Add dependencies
    config.dependencies?.forEach(dep => {
      const dependencies = graph.get(dep.to);
      if (dependencies) {
        dependencies.add(dep.from);
      }
    });
    
    return graph;
  }
  
  /**
   * Topological sort for deployment order
   */
  private topologicalSort(graph: Map<string, Set<string>>): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected involving ${node}`);
      }
      
      visiting.add(node);
      
      const dependencies = graph.get(node) || new Set();
      dependencies.forEach(dep => visit(dep));
      
      visiting.delete(node);
      visited.add(node);
      result.push(node);
    };
    
    Array.from(graph.keys()).forEach(node => visit(node));
    
    return result;
  }
  
  /**
   * Get deployment waves for parallel deployment
   */
  private getDeploymentWaves(graph: Map<string, Set<string>>): string[][] {
    const waves: string[][] = [];
    const deployed = new Set<string>();
    const remaining = new Set(graph.keys());
    
    while (remaining.size > 0) {
      const wave: string[] = [];
      
      for (const node of remaining) {
        const dependencies = graph.get(node) || new Set();
        const ready = Array.from(dependencies).every(dep => deployed.has(dep));
        
        if (ready) {
          wave.push(node);
        }
      }
      
      if (wave.length === 0) {
        throw new Error('Circular dependency detected');
      }
      
      waves.push(wave);
      wave.forEach(node => {
        deployed.add(node);
        remaining.delete(node);
      });
    }
    
    return waves;
  }
  
  /**
   * Build deployment configuration for a stack
   */
  private buildDeploymentConfig(
    projectName: string,
    construct: ConstructDefinition,
    stackConfig: StackConfig,
    deployedStacks: Map<string, Record<string, any>>,
    dependencies?: Array<{ from: string; to: string; outputs: string[] }>
  ): DeploymentConfig {
    // Gather outputs from dependencies
    const dependencyOutputs: Record<string, any> = {};
    
    dependencies?.forEach(dep => {
      if (dep.to === stackConfig.name) {
        const outputs = deployedStacks.get(dep.from);
        if (outputs) {
          dep.outputs.forEach(outputName => {
            dependencyOutputs[`${dep.from}:${outputName}`] = outputs[outputName];
          });
        }
      }
    });
    
    return {
      name: `${projectName}-${stackConfig.name}`,
      stackName: stackConfig.name,
      projectName,
      provider: stackConfig.provider,
      providerConfig: {
        region: stackConfig.region,
        ...stackConfig.config
      },
      constructArgs: {
        ...construct.inputs.reduce((args, input) => {
          if (input.defaultValue !== undefined) {
            args[input.name] = input.defaultValue;
          }
          return args;
        }, {} as any),
        dependencies: dependencyOutputs,
        environment: stackConfig.environment,
        tags: {
          ...stackConfig.tags,
          'lcc:environment': stackConfig.environment,
          'lcc:stack': stackConfig.name
        }
      },
      pulumiConfig: stackConfig.config
    };
  }
}

/**
 * Create a stack manager instance
 */
export function createStackManager(deploymentEngine?: DeploymentEngine): StackManager {
  const engine = deploymentEngine || new DeploymentEngine();
  return new StackManager(engine);
}