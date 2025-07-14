/**
 * Frontend types for construct catalog
 */

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

// Alias for frontend use
export type CoreDeploymentConfig = DeploymentConfig;

/**
 * Complete construct definition base
 */
interface BaseConstructDefinition extends ConstructMetadata {
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
 * Construct display information
 */
export interface ConstructDisplay {
  /** Construct definition */
  definition: ConstructDefinition;
  /** Icon component or URL */
  icon?: string | React.ComponentType;
  /** Preview image URL */
  previewImage?: string;
  /** Category color */
  categoryColor?: string;
  /** Popularity score */
  popularity?: number;
  /** User rating */
  rating?: number;
  /** Number of deployments */
  deploymentCount?: number;
  /** Last updated */
  lastUpdated?: Date;
  /** Featured flag */
  featured?: boolean;
}

/**
 * Construct search filters
 */
export interface ConstructFilters {
  /** Filter by level */
  levels?: ConstructLevel[];
  /** Filter by providers */
  providers?: CloudProvider[];
  /** Filter by categories */
  categories?: string[];
  /** Search query */
  query?: string;
  /** Sort order */
  sortBy?: 'name' | 'popularity' | 'rating' | 'updated' | 'deployments';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Show only featured */
  featuredOnly?: boolean;
  /** Show only community contributed */
  communityOnly?: boolean;
}

/**
 * Construct deployment state
 */
export interface ConstructDeploymentState {
  /** Deployment ID */
  id: string;
  /** Construct ID */
  constructId: string;
  /** Deployment status */
  status: 'idle' | 'validating' | 'previewing' | 'deploying' | 'deployed' | 'failed';
  /** Progress percentage */
  progress: number;
  /** Current step */
  currentStep?: string;
  /** Deployment result */
  result?: any;
  /** Error message */
  error?: string;
  /** Deployment timestamp */
  timestamp: Date;
}

/**
 * Frontend deployment configuration
 */
export interface DeploymentConfiguration extends CoreDeploymentConfig {
  /** UI-specific settings */
  ui?: {
    /** Show advanced options */
    showAdvanced?: boolean;
    /** Auto-deploy on save */
    autoDeploy?: boolean;
    /** Show cost estimates */
    showCostEstimates?: boolean;
  };
}

/**
 * Construct composition state
 */
export interface ConstructComposition {
  /** Composition ID */
  id: string;
  /** Name of the composition */
  name: string;
  /** Constructs in the composition */
  constructs: Array<{
    /** Construct ID */
    constructId: string;
    /** Instance name */
    instanceName: string;
    /** Position in diagram */
    position?: { x: number; y: number };
    /** Configuration */
    config: any;
    /** Connections to other constructs */
    connections?: Array<{
      /** Target construct instance */
      targetInstance: string;
      /** Connection type */
      type: string;
      /** Connection configuration */
      config?: any;
    }>;
  }>;
  /** Composition metadata */
  metadata?: {
    /** Description */
    description?: string;
    /** Tags */
    tags?: string[];
    /** Author */
    author?: string;
  };
}

/**
 * Community contribution
 */
export interface CommunityContribution {
  /** Contribution ID */
  id: string;
  /** Construct definition */
  construct: ConstructDefinition;
  /** Contributor information */
  contributor: {
    /** User ID */
    id: string;
    /** Username */
    username: string;
    /** Avatar URL */
    avatar?: string;
  };
  /** Submission date */
  submittedAt: Date;
  /** Review status */
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  /** Review comments */
  reviewComments?: Array<{
    /** Reviewer */
    reviewer: string;
    /** Comment */
    comment: string;
    /** Timestamp */
    timestamp: Date;
  }>;
  /** Version history */
  versions?: Array<{
    /** Version number */
    version: string;
    /** Change description */
    changes: string;
    /** Release date */
    releaseDate: Date;
  }>;
}


export interface ConstructDefinition extends BaseConstructDefinition {
  /** Additional frontend-specific properties */
  ui?: {
    /** Custom icon */
    icon?: string;
    /** Preview configuration */
    previewConfig?: any;
    /** Form schema for configuration */
    formSchema?: any;
  };
}