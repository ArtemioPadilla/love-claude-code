import * as pulumi from '@pulumi/pulumi';

/**
 * Construct levels following AWS CDK patterns
 */
export enum ConstructLevel {
  /** L0 - Primitive cloud resources (direct mappings) */
  L0 = 'L0',
  /** L1 - Foundation constructs with sensible defaults */
  L1 = 'L1',
  /** L2 - Pattern constructs (common solutions) */
  L2 = 'L2',
  /** L3 - Application constructs (complete solutions) */
  L3 = 'L3'
}

/**
 * Supported cloud providers
 */
export enum CloudProvider {
  AWS = 'aws',
  FIREBASE = 'firebase',
  AZURE = 'azure',
  GCP = 'gcp',
  LOCAL = 'local'
}

/**
 * Base metadata for all constructs
 */
export interface ConstructMetadata {
  /** Unique identifier for the construct */
  id: string;
  /** Human-readable name */
  name: string;
  /** Construct abstraction level */
  level: ConstructLevel;
  /** Detailed description */
  description: string;
  /** Version following semver */
  version: string;
  /** Author information */
  author: string;
  /** Categories for organization */
  categories: string[];
  /** Supported cloud providers */
  providers: CloudProvider[];
  /** Tags for searchability */
  tags: string[];
  /** License information */
  license?: string;
  /** Repository URL */
  repository?: string;
}

/**
 * Input parameter definition
 */
export interface ConstructInput {
  /** Parameter name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Description of the parameter */
  description: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Default value if not required */
  defaultValue?: any;
  /** Validation rules */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

/**
 * Output value definition
 */
export interface ConstructOutput {
  /** Output name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Description of the output */
  description: string;
  /** Whether this output is sensitive */
  sensitive?: boolean;
}

/**
 * Security considerations for the construct
 */
export interface SecurityConsideration {
  /** Security aspect (e.g., 'encryption', 'access-control') */
  aspect: string;
  /** Description of the security measure */
  description: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Recommendations */
  recommendations: string[];
}

/**
 * Cost estimation model
 */
export interface CostEstimate {
  /** Base monthly cost in USD */
  baseMonthly: number;
  /** Usage-based factors */
  usageFactors: {
    /** Factor name (e.g., 'requests', 'storage-gb') */
    name: string;
    /** Unit of measurement */
    unit: string;
    /** Cost per unit */
    costPerUnit: number;
    /** Typical monthly usage */
    typicalUsage?: number;
  }[];
  /** Additional notes about costs */
  notes?: string[];
}

/**
 * C4 model metadata for diagram generation
 */
export interface C4Metadata {
  /** C4 element type */
  type: 'System' | 'Container' | 'Component' | 'Code';
  /** Technology stack */
  technology?: string;
  /** External system indicator */
  external?: boolean;
  /** Container type for container diagrams */
  containerType?: 'WebApp' | 'MobileApp' | 'Database' | 'MessageBus' | 'FileSystem' | 'Custom';
  /** Position hint for diagram layout */
  position?: {
    x?: number;
    y?: number;
  };
}

/**
 * C4 relationship between constructs
 */
export interface C4Relationship {
  /** Source construct ID */
  from: string;
  /** Target construct ID */
  to: string;
  /** Relationship description */
  description: string;
  /** Technology/protocol used */
  technology?: string;
  /** Relationship type */
  type?: 'sync' | 'async' | 'dataflow';
}

/**
 * Example usage of a construct
 */
export interface ConstructExample {
  /** Example title */
  title: string;
  /** Example description */
  description: string;
  /** Example code */
  code: string;
  /** Programming language */
  language: string;
  /** Highlighted lines */
  highlights?: number[];
}

/**
 * Deployment configuration for a construct
 */
export interface DeploymentConfig {
  /** Required Pulumi providers */
  requiredProviders: string[];
  /** Configuration schema (JSON Schema) */
  configSchema: any;
  /** Environment variables needed */
  environmentVariables?: string[];
  /** Pre-deployment validation */
  preDeploymentChecks?: string[];
  /** Post-deployment validation */
  postDeploymentChecks?: string[];
}

/**
 * Complete construct definition
 */
export interface ConstructDefinition extends ConstructMetadata {
  /** Input parameters */
  inputs: ConstructInput[];
  /** Output values */
  outputs: ConstructOutput[];
  /** Dependencies on other constructs */
  dependencies?: {
    /** Construct ID */
    constructId: string;
    /** Version constraint */
    version: string;
    /** Whether the dependency is optional */
    optional?: boolean;
  }[];
  /** Security considerations */
  security: SecurityConsideration[];
  /** Cost estimation */
  cost: CostEstimate;
  /** C4 diagram metadata */
  c4: C4Metadata;
  /** C4 relationships */
  relationships?: C4Relationship[];
  /** Usage examples */
  examples: ConstructExample[];
  /** Best practices */
  bestPractices: string[];
  /** Deployment configuration */
  deployment: DeploymentConfig;
}

/**
 * Base arguments for all constructs
 */
export interface BaseConstructArgs {
  /** Construct metadata */
  metadata?: Partial<ConstructMetadata>;
  /** Tags to apply to all resources */
  tags?: Record<string, string>;
  /** Whether to enable detailed logging */
  enableLogging?: boolean;
}

/**
 * Result of a construct deployment
 */
export interface ConstructDeploymentResult {
  /** Deployment status */
  status: 'success' | 'failed' | 'partial';
  /** Deployed resources */
  resources: {
    /** Resource URN */
    urn: string;
    /** Resource type */
    type: string;
    /** Resource name */
    name: string;
    /** Resource state */
    state: any;
  }[];
  /** Output values */
  outputs: Record<string, any>;
  /** Deployment duration in seconds */
  duration: number;
  /** Any errors encountered */
  errors?: string[];
  /** Any warnings */
  warnings?: string[];
}