# Construct System Architecture Diagram

## High-Level Architecture Flow

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[Love Claude Code UI]
        CC[Construct Catalog]
        C4V[C4 Diagram Viewer]
        Chat[Claude Chat Interface]
    end
    
    subgraph "MCP Integration Layer"
        MCP[MCP Server]
        UITools[UI Testing Tools]
        ProviderTools[Provider Management Tools]
    end
    
    subgraph "Construct Definition Layer"
        YAML[YAML Definitions<br/>/catalog/]
        Types[TypeScript Types<br/>/constructs/types/]
        Store[Construct Store<br/>Zustand]
    end
    
    subgraph "Pulumi Infrastructure Layer"
        Core[Pulumi Core<br/>Base Classes]
        L0[L0 Constructs<br/>Primitive Resources]
        L1[L1 Constructs<br/>Best Practices]
        L2[L2 Constructs<br/>Patterns]
        L3[L3 Constructs<br/>Applications]
    end
    
    subgraph "Provider Abstraction Layer"
        Factory[Provider Factory]
        Local[Local Provider]
        Firebase[Firebase Provider]
        AWS[AWS Provider]
    end
    
    subgraph "Deployment Layer"
        DE[Deployment Engine]
        PE[Preview Engine]
        SM[Stack Manager]
    end
    
    %% User interactions
    UI --> CC
    UI --> C4V
    UI --> Chat
    
    %% MCP connections
    Chat <--> MCP
    MCP --> UITools
    MCP --> ProviderTools
    ProviderTools --> Factory
    
    %% Catalog flow
    CC --> Store
    Store --> YAML
    YAML --> Types
    
    %% Construct hierarchy
    Types --> Core
    Core --> L0
    L0 --> L1
    L1 --> L2
    L2 --> L3
    
    %% Provider connections
    L1 --> Factory
    L2 --> Factory
    L3 --> Factory
    Factory --> Local
    Factory --> Firebase
    Factory --> AWS
    
    %% Deployment flow
    Factory --> DE
    DE --> PE
    DE --> SM
    
    %% C4 generation
    C4V --> Store
    C4V --> L1
    C4V --> L2
    C4V --> L3
```

## Detailed Component Interactions

### 1. Construct Selection Flow

```mermaid
sequenceDiagram
    participant User
    participant CatalogUI
    participant Store
    participant YAML
    participant Pulumi
    
    User->>CatalogUI: Browse constructs
    CatalogUI->>Store: Request constructs
    Store->>YAML: Load definitions
    YAML-->>Store: Return definitions
    Store-->>CatalogUI: Display constructs
    User->>CatalogUI: Select construct
    CatalogUI->>Store: Get construct details
    Store-->>CatalogUI: Show details & config
    User->>CatalogUI: Configure & Deploy
    CatalogUI->>Pulumi: Initialize construct
    Pulumi-->>CatalogUI: Deployment status
```

### 2. MCP Provider Selection Flow

```mermaid
sequenceDiagram
    participant User
    participant Claude
    participant MCP
    participant Advisor
    participant Factory
    
    User->>Claude: "I need a backend for 10k users"
    Claude->>MCP: analyze_project_requirements
    MCP->>Advisor: Analyze needs
    Advisor-->>MCP: Requirements profile
    Claude->>MCP: compare_providers
    MCP->>Factory: Get provider capabilities
    Factory-->>MCP: Provider comparison
    MCP-->>Claude: Comparison results
    Claude-->>User: Recommendation with costs
    User->>Claude: "Use Firebase"
    Claude->>MCP: switch_provider
    MCP->>Factory: Configure Firebase
    Factory-->>MCP: Provider ready
    MCP-->>Claude: Success
```

### 3. C4 Diagram Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant C4Viewer
    participant DiagramGen
    participant Constructs
    participant Renderer
    
    User->>C4Viewer: Open diagram view
    C4Viewer->>DiagramGen: Request diagram
    DiagramGen->>Constructs: Get composition
    Constructs-->>DiagramGen: Construct metadata
    DiagramGen->>DiagramGen: Build graph
    DiagramGen-->>C4Viewer: Diagram data
    C4Viewer->>Renderer: Render with ReactFlow
    Renderer-->>User: Interactive diagram
    User->>C4Viewer: Drill down level
    C4Viewer->>DiagramGen: Get component view
    DiagramGen-->>C4Viewer: Component diagram
    C4Viewer-->>User: Updated view
```

## Construct Composition Architecture

```mermaid
graph LR
    subgraph "Construct Composition"
        Comp[Composition<br/>Definition]
        C1[API Gateway<br/>L2 Construct]
        C2[Lambda Functions<br/>L1 Construct]
        C3[DynamoDB<br/>L1 Construct]
        C4[S3 Bucket<br/>L1 Construct]
        C5[CloudFront<br/>L1 Construct]
    end
    
    subgraph "Generated Infrastructure"
        APIG[API Gateway<br/>Resource]
        Lambda[Lambda<br/>Resources]
        DDB[DynamoDB<br/>Table]
        S3[S3<br/>Bucket]
        CF[CloudFront<br/>Distribution]
    end
    
    Comp --> C1
    Comp --> C2
    Comp --> C3
    Comp --> C4
    Comp --> C5
    
    C1 --> APIG
    C2 --> Lambda
    C3 --> DDB
    C4 --> S3
    C5 --> CF
    
    C1 -.->|connects| C2
    C2 -.->|reads/writes| C3
    C4 -.->|origin| C5
```

## Provider Abstraction Pattern

```mermaid
graph TB
    subgraph "Application Code"
        App[Your Application]
    end
    
    subgraph "Provider Interface"
        Interface[IBackendProvider]
        Auth[IAuthProvider]
        DB[IDatabaseProvider]
        Storage[IStorageProvider]
        Func[IFunctionProvider]
    end
    
    subgraph "Local Implementation"
        LocalAuth[JWT Auth]
        LocalDB[PostgreSQL]
        LocalStorage[File System]
        LocalFunc[Node Process]
    end
    
    subgraph "Firebase Implementation"
        FBAuth[Firebase Auth]
        FBDB[Firestore]
        FBStorage[Cloud Storage]
        FBFunc[Cloud Functions]
    end
    
    subgraph "AWS Implementation"
        AWSAuth[Cognito]
        AWSDB[DynamoDB]
        AWSStorage[S3]
        AWSFunc[Lambda]
    end
    
    App --> Interface
    Interface --> Auth
    Interface --> DB
    Interface --> Storage
    Interface --> Func
    
    Auth -.->|local| LocalAuth
    Auth -.->|firebase| FBAuth
    Auth -.->|aws| AWSAuth
    
    DB -.->|local| LocalDB
    DB -.->|firebase| FBDB
    DB -.->|aws| AWSDB
    
    Storage -.->|local| LocalStorage
    Storage -.->|firebase| FBStorage
    Storage -.->|aws| AWSStorage
    
    Func -.->|local| LocalFunc
    Func -.->|firebase| FBFunc
    Func -.->|aws| AWSFunc
```

## Data Flow Through the System

```mermaid
graph LR
    subgraph "Input"
        UserReq[User Requirements]
        Config[Configuration]
        Code[Application Code]
    end
    
    subgraph "Processing"
        MCP[MCP Analysis]
        ConstructSelect[Construct Selection]
        Composition[Composition Engine]
        Validation[Validation]
    end
    
    subgraph "Generation"
        Pulumi[Pulumi Engine]
        IaC[Infrastructure Code]
        C4[C4 Diagrams]
    end
    
    subgraph "Output"
        Preview[Preview]
        Deploy[Deployment]
        Docs[Documentation]
    end
    
    UserReq --> MCP
    MCP --> ConstructSelect
    Config --> ConstructSelect
    ConstructSelect --> Composition
    Code --> Composition
    Composition --> Validation
    Validation --> Pulumi
    Pulumi --> IaC
    Pulumi --> C4
    IaC --> Preview
    IaC --> Deploy
    C4 --> Docs
```

## Security and Compliance Flow

```mermaid
graph TB
    subgraph "Construct Definition"
        SecDef[Security Requirements<br/>in YAML]
        CompReq[Compliance Tags]
    end
    
    subgraph "Validation Layer"
        SecVal[Security Validator]
        CompVal[Compliance Checker]
        CostVal[Cost Validator]
    end
    
    subgraph "Implementation"
        Encrypt[Encryption<br/>at Rest]
        IAM[IAM Policies]
        Network[Network Security]
        Audit[Audit Logging]
    end
    
    subgraph "Runtime"
        Monitor[Security Monitoring]
        Alerts[Alert System]
        Reports[Compliance Reports]
    end
    
    SecDef --> SecVal
    CompReq --> CompVal
    SecVal --> Encrypt
    SecVal --> IAM
    SecVal --> Network
    CompVal --> Audit
    Encrypt --> Monitor
    IAM --> Monitor
    Network --> Monitor
    Audit --> Reports
    Monitor --> Alerts
```

## Development Workflow

```mermaid
stateDiagram-v2
    [*] --> Browse: Open Catalog
    Browse --> Select: Choose Construct
    Select --> Configure: Set Parameters
    Configure --> Validate: Check Config
    Validate --> Preview: Generate Preview
    Validate --> Browse: Invalid Config
    Preview --> Deploy: Approve Changes
    Preview --> Configure: Modify Config
    Deploy --> Monitor: Track Deployment
    Monitor --> [*]: Success
    Monitor --> Rollback: Failed
    Rollback --> Configure: Fix Issues
```

This architecture demonstrates how Love Claude Code integrates:
- **Construct Catalog** for visual infrastructure selection
- **Pulumi** for infrastructure as code
- **MCP** for intelligent assistance
- **C4 Diagrams** for architecture visualization
- **Multi-Provider** support with consistent interfaces

The system is designed to be modular, extensible, and user-friendly while maintaining enterprise-grade capabilities.