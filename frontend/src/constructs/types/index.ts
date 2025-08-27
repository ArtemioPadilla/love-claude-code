/**
 * Frontend types for construct catalog
 * Extended for self-referential architecture
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
 * Type alias for construct levels (for flexible use)
 * @deprecated Use ConstructLevel enum instead for better type safety
 */
export type ConstructLevelType = ConstructLevel;

/**
 * Construct types categorizing the purpose of constructs
 */
export enum ConstructType {
  /** UI components and visual elements */
  UI = 'UI',
  /** Infrastructure and backend services */
  Infrastructure = 'Infrastructure',
  /** Reusable patterns and solutions */
  Pattern = 'Pattern',
  /** Complete application constructs */
  Application = 'Application',
  /** Alias for Pattern (for backward compatibility) */
  PATTERN = 'Pattern'
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
  /** Construct type */
  type: ConstructType;
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

/**
 * Self-referential metadata for constructs
 */
export interface SelfReferentialMetadata {
  /** Whether this construct is part of the platform itself */
  isPlatformConstruct: boolean;
  /** Development method */
  developmentMethod: 'vibe-coded' | 'manual' | 'hybrid';
  /** Percentage of code that was vibe-coded */
  vibeCodingPercentage: number;
  /** Conversation ID if vibe-coded */
  conversationId?: string;
  /** Constructs used to build this construct */
  builtWith?: string[];
  /** Time to create in minutes */
  timeToCreate?: number;
  /** Whether this construct can build other constructs */
  canBuildConstructs?: boolean;
}

/**
 * Platform construct definition
 */
export interface PlatformConstructDefinition extends ConstructDefinition {
  /** Self-referential metadata */
  selfReferential: SelfReferentialMetadata;
  /** Platform-specific capabilities */
  platformCapabilities?: {
    /** Can deploy itself */
    canSelfDeploy?: boolean;
    /** Can update itself */
    canSelfUpdate?: boolean;
    /** Can test itself */
    canSelfTest?: boolean;
    /** Version of platform it belongs to */
    platformVersion?: string;
  };
}

/**
 * Props for rendering construct components
 */
export interface ConstructRenderProps {
  /** Construct instance */
  instance?: any;
  /** Configuration for the construct */
  config?: any;
  /** Callback for interactions */
  onInteraction?: (action: string, data: any) => void;
  /** Whether in preview mode */
  preview?: boolean;
}

/**
 * Construct development project type
 */
export interface ConstructDevelopmentProject {
  /** Project ID */
  id: string;
  /** Construct being developed */
  construct: {
    /** Target level */
    level: ConstructLevel;
    /** Target category */
    category: string;
    /** Current specification */
    specification?: ConstructDefinition;
  };
  /** Development state */
  state: {
    /** Current phase */
    phase: 'specification' | 'testing' | 'implementation' | 'certification';
    /** Specification status */
    specificationComplete: boolean;
    /** Tests generated */
    testsGenerated: boolean;
    /** Implementation status */
    implementationComplete: boolean;
    /** Certification status */
    certificationStatus?: 'pending' | 'in-progress' | 'approved' | 'rejected';
  };
  /** TDD/SDD metadata */
  tddMetadata?: {
    /** Natural language specification */
    naturalLanguageSpec?: string;
    /** Formal specification */
    formalSpec?: any;
    /** Generated tests */
    generatedTests?: TestCase[];
    /** Test coverage */
    coverage?: number;
  };
}

/**
 * Platform evolution metrics
 */
export interface PlatformEvolutionMetrics {
  /** Total number of constructs */
  totalConstructs: number;
  /** Constructs by level */
  constructsByLevel: Record<ConstructLevel, number>;
  /** Vibe-coded constructs */
  vibeCodedConstructs: number;
  /** Platform self-building score (0-100) */
  selfBuildingScore: number;
  /** Features built using the platform */
  featuresBuiltWithPlatform: string[];
  /** Average time to create construct */
  averageConstructCreationTime: number;
  /** Construct reuse percentage */
  constructReusePercentage: number;
}

/**
 * Base interface for construct instances
 */
export interface BaseConstruct {
  /** Get the construct type */
  getType(): ConstructType;
  /** Get the construct level */
  getLevel(): ConstructLevel;
  /** Get construct metadata */
  metadata: ConstructDefinition | PlatformConstructDefinition;
  /** Get construct ID */
  id: string;
  /** Get construct level (property) */
  level: ConstructLevel;
}

/**
 * L0 Primitive construct interface
 */
export interface L0PrimitiveConstruct extends BaseConstruct {
  level: ConstructLevel.L0;
  /** Primitive-specific properties */
  primitiveType: 'ui' | 'infrastructure';
}

/**
 * L1 Configured construct interface
 */
export interface L1ConfiguredConstruct extends BaseConstruct {
  level: ConstructLevel.L1;
  /** Configuration options */
  configure(options: Record<string, any>): void;
}

/**
 * L2 Pattern construct interface
 */
export interface L2PatternConstruct extends BaseConstruct {
  level: ConstructLevel.L2;
  /** Pattern validation */
  validate(): boolean;
  /** Pattern composition */
  compose(): void;
}

/**
 * L3 Application construct interface
 */
export interface L3ApplicationConstruct extends BaseConstruct {
  level: ConstructLevel.L3;
  /** Build the application */
  build(): Promise<void>;
  /** Deploy the application */
  deploy(target: string): Promise<void>;
  /** Start development mode */
  startDevelopment(): Promise<void>;
  /** Start production mode */
  startProduction(): Promise<void>;
  /** Get health status */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, any>;
  }>;
  /** Get application metrics */
  getMetrics(): Promise<Record<string, any>>;
  /** Get application version */
  getVersion(): string;
}

/**
 * Construct dependency definition
 */
export interface ConstructDependency {
  /** Dependency ID */
  id: string;
  /** Dependency level */
  level: ConstructLevel;
  /** Whether optional */
  optional?: boolean;
  /** Version constraint */
  version?: string;
}

/**
 * Provider type for multi-provider support
 */
export type ProviderType = 'local' | 'firebase' | 'aws';

/**
 * Test case for TDD/SDD
 */
export interface TestCase {
  /** Test name */
  name: string;
  /** Test description */
  description: string;
  /** Test code */
  code: string;
  /** Expected outcome */
  expected: any;
  /** Test type */
  type: 'unit' | 'integration' | 'e2e';
}

/**
 * MCP (Model Context Protocol) Tool Definition
 */
export interface MCPTool {
  /** Tool name (unique identifier) */
  name: string;
  /** Tool description */
  description: string;
  /** Tool parameters */
  parameters?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    description?: string;
    enum?: any[];
    default?: any;
  }>;
  /** Tool category */
  category?: string;
  /** Tool version */
  version?: string;
  /** Tool tags for search */
  tags?: string[];
}

/**
 * MCP Tool Response
 */
export interface MCPToolResponse {
  /** Whether the tool execution was successful */
  success: boolean;
  /** Response data */
  data?: any;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    tool: string;
    duration: number;
    timestamp: string;
  };
}

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Server description */
  description?: string;
  /** Enabled tools */
  tools?: string[];
  /** Server endpoints */
  endpoints?: {
    http?: string;
    websocket?: string;
    grpc?: string;
  };
}

/**
 * MCP Extension Definition
 */
export interface MCPExtension {
  /** Extension ID */
  id: string;
  /** Extension name */
  name: string;
  /** Extension description */
  description: string;
  /** Extension tools */
  tools: MCPTool[];
  /** Extension version */
  version: string;
  /** Extension author */
  author: string;
}

/**
 * Construct development phase
 */
export type ConstructPhase = 'specification' | 'test' | 'implementation' | 'certification';

/**
 * Test result for a single test
 */
export interface TestResult {
  /** Test suite name */
  name: string;
  /** Individual test results */
  tests: Array<{
    /** Test name */
    name: string;
    /** Test status */
    status: 'passed' | 'failed' | 'skipped';
    /** Test duration in ms */
    duration?: number;
    /** Error message if failed */
    error?: string;
    /** Code coverage data */
    coverage?: {
      lines: number;
      branches: number;
      functions: number;
    };
  }>;
}

/**
 * Validation result for construct code
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationError[];
}

/**
 * Validation error/warning
 */
export interface ValidationError {
  /** Error path (e.g., 'specification.props[0].name') */
  path: string;
  /** Error message */
  message: string;
}

/**
 * Construct specification schema
 */
export interface ConstructSpecification {
  /** Construct name */
  name: string;
  /** Construct level */
  level: ConstructLevel;
  /** Construct category */
  category: string;
  /** Description */
  description: string;
  /** Props definition */
  props?: Array<{
    name: string;
    type: string;
    required?: boolean;
    default?: any;
    description?: string;
  }>;
  /** Methods definition */
  methods?: Array<{
    name: string;
    description?: string;
    parameters?: Array<{
      name: string;
      type: string;
      required?: boolean;
    }>;
    returns?: {
      type: string;
      description?: string;
    };
  }>;
  /** Dependencies */
  dependencies?: string[];
  /** Examples */
  examples?: Array<{
    title: string;
    code: string;
    description?: string;
  }>;
}

/**
 * Full construct definition including all artifacts
 */
export interface Construct {
  /** Unique ID */
  id: string;
  /** Construct metadata */
  metadata: ConstructMetadata;
  /** YAML specification */
  specification: string;
  /** Implementation code */
  implementation: string;
  /** Test code */
  tests: string;
  /** Documentation */
  documentation: string;
  /** Examples */
  examples: Example[];
}

// Re-export dependency graph types
export type { 
  GraphNode as GraphNodeData,
  GraphEdge as GraphEdgeData,
  GraphLayoutOptions as LayoutConstraints 
} from './dependencyGraph'

// Type aliases for test utilities
export type ConstructSpec = ConstructSpecification
export type BaseConstructor = new (...args: any[]) => BaseConstruct
export interface ConstructValidationResult extends ValidationResult {}

// External integration types
export interface NpmPackageInfo {
  name: string
  version: string
  description?: string
  author?: string
  license?: string
}

// Re-export from external constructs
export type { DockerServiceConfig } from '../L0/external/DockerServicePrimitive'

/**
 * Construct example
 */
export interface Example {
  /** Example title */
  title: string;
  /** Example code */
  code: string;
  /** Example description */
  description?: string;
}