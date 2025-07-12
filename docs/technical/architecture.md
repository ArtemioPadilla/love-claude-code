# Love Claude Code: Technical Architecture

## Architecture Overview

Love Claude Code employs a hybrid serverless architecture that balances cost efficiency with performance, enabling scale from individual developers to enterprise teams while maintaining sub-200ms response times for most operations.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │───▶│   API Gateway   │───▶│  Lambda Layer   │
└─────────────────┘    └─────────────────┘    │                 │
                                              │ • Auth          │
                                              │ • Quick ops     │
                                              │ • File mgmt     │
                                              └────────┬────────┘
                                                       │
                       ┌─────────────────┐    ┌────────▼────────┐
                       │   WebSocket     │    │   ECS Fargate   │
                       │   (AppSync)     │    │                 │
                       └─────────────────┘    │ • Long sessions │
                                              │ • Heavy builds  │
                                              │ • Containers    │
                                              └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 + TypeScript with Vite for blazing-fast development
- **Editor**: CodeMirror 6 (not Monaco) for superior mobile support and 43% smaller bundle size
- **Layout**: Split.js for resizable panes with responsive design
- **State Management**: Zustand for lightweight, performant state handling
- **Styling**: Tailwind CSS following utility-first approach

### CodeMirror 6 Implementation
```typescript
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

const editor = new EditorView({
  doc: initialCode,
  extensions: [
    basicSetup,
    javascript(),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        sendUpdateToLLM(update.state.doc.toString());
      }
    })
  ],
  parent: document.getElementById('editor')
});
```

CodeMirror 6's modular architecture allows including only needed features, resulting in **70% better mobile retention** compared to Monaco Editor.

## Backend Architecture

### Service Distribution

**Lambda handles**:
- API endpoints and authentication
- File operations (create, read, update, delete)
- Quick code compilations (<15 minutes)
- LLM request orchestration

**Fargate manages**:
- Persistent development sessions
- Complex builds and multi-language support
- Docker container execution
- Real-time collaboration servers

### Infrastructure Components

#### API Gateway
- REST APIs with request transformation
- WebSocket support for real-time features
- Rate limiting and throttling
- Request/response validation

#### Lambda Functions
- 3GB memory allocation for compilation tasks
- Reserved concurrency for predictable performance
- Dead letter queues for failed invocations
- Environment-specific configurations

#### ECS Fargate
- Auto-scaling from 0 to 1000 containers
- Spot instances for cost optimization
- Service discovery for internal communication
- Load balancing across availability zones

## Database Architecture

### Multi-Database Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Aurora Serverless│    │    DynamoDB     │    │     Redis       │
│                 │    │                 │    │                 │
│ • User accounts │    │ • Session state │    │ • Active users  │
│ • Project meta  │    │ • Collab state  │    │ • File cache    │
│ • Code history  │    │ • File metadata │    │ • Cursors       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Aurora Serverless
- Automatic scaling from 0.5 to 16 ACUs
- Point-in-time recovery and automated backups
- Read replicas for high-traffic scenarios
- Connection pooling with RDS Proxy

### DynamoDB
- On-demand billing for unpredictable workloads
- Global secondary indexes for query flexibility
- TTL for automatic session cleanup
- Streams for change data capture

### Redis Cluster
- ElastiCache with automatic failover
- Pub/sub for real-time features
- Sorted sets for leaderboards/analytics
- Geospatial indexes for regional routing

## Claude Integration Architecture

### Development Mode (Direct API)
```python
class HybridClaudeClient:
    def __init__(self, environment="development"):
        if environment == "development":
            self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        elif environment == "production":
            self.client = AnthropicBedrock(
                aws_region=os.getenv("AWS_REGION", "us-west-2")
            )
```

### Production Mode (AWS Bedrock)
- **Models**: Claude 3.5 Sonnet, Claude 3 Haiku for cost optimization
- **Intelligent Routing**: Route simple queries to Haiku ($0.25/1M tokens) vs Sonnet ($3.00/1M tokens)
- **Streaming**: Real-time code generation with WebSocket delivery
- **Context Management**: 180,000 token effective window with smart truncation

### Rate Limiting Strategy
```python
class APIKeyManager:
    def __init__(self, api_keys, requests_per_day_per_key):
        self.api_keys = {}
        for key in api_keys:
            self.api_keys[key] = {
                'daily_limit': requests_per_day_per_key,
                'used_today': 0,
                'available': True
            }
```

## Container Strategy

### Multi-Stage Docker Build
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
CMD ["npm", "start"]
```

### Security Measures
- Non-root user execution
- Read-only root filesystem
- Resource limits (CPU: 0.5 vCPU, Memory: 512MB)
- Network isolation via VPC

## Real-Time Collaboration

### Technology Stack
- **WebSocket**: AWS AppSync Events for managed scaling
- **Collaboration Algorithm**: Operational Transformation (not CRDTs)
- **Presence Awareness**: Cursor positions updated 10x per second
- **Conflict Resolution**: Server-authoritative with optimistic updates

### Implementation
```typescript
interface CollaborationEvent {
  type: 'cursor' | 'edit' | 'selection';
  userId: string;
  timestamp: number;
  data: CursorPosition | EditOperation | SelectionRange;
}

class CollaborationManager {
  broadcastEvent(event: CollaborationEvent) {
    // Operational transformation
    const transformed = this.transformOperation(event);
    
    // Broadcast to all connected clients
    this.websocket.broadcast(transformed);
    
    // Update server state
    this.updateServerState(transformed);
  }
}
```

## Performance Optimization

### Frontend Optimization
- Code splitting with dynamic imports
- React.lazy for route-based splitting
- Service worker for offline functionality
- WebAssembly for compute-intensive tasks

### Backend Optimization
- Connection pooling for database access
- Request batching for Claude API calls
- CDN caching for static assets
- Edge Lambda@Edge for personalization

### Caching Strategy
- CloudFront for static assets (1 year TTL)
- Redis for session data (15 minute TTL)
- DynamoDB for file metadata (1 hour TTL)
- In-memory caching for hot paths

## Monitoring & Observability

### Monitoring Stack
- **Metrics**: CloudWatch for AWS services + custom metrics
- **Tracing**: AWS X-Ray for distributed request tracking
- **Logging**: Structured JSON logs to CloudWatch Logs
- **Alerting**: SNS notifications for critical events

### Key Metrics
- Code execution time (target: <2s for 95th percentile)
- LLM response latency (target: <200ms first token)
- Error rates by service (target: <0.1%)
- Resource utilization per tenant

### Dashboard Configuration
```yaml
dashboards:
  - name: "System Health"
    widgets:
      - type: "metric"
        metric: "AWS/Lambda/Duration"
        statistic: "p95"
      - type: "log_insights"
        query: "fields @timestamp, error | filter error != null"
      - type: "alarm_status"
        alarms: ["HighErrorRate", "LowAvailability"]
```

## Scalability Considerations

### Horizontal Scaling
- Auto-scaling groups for ECS services
- Lambda concurrency limits per function
- Read replicas for Aurora
- Multi-region deployment strategy

### Vertical Scaling
- Lambda memory optimization per function
- Aurora ACU configuration
- Redis cluster node types
- ECS task definitions

### Cost Optimization
- Reserved instances for predictable workloads
- Spot instances for batch processing
- S3 lifecycle policies for old artifacts
- Intelligent tiering for infrequently accessed data