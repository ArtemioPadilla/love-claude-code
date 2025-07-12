# Love Claude Code: Deployment Guide

This guide covers deploying Love Claude Code to AWS using our infrastructure-as-code setup. We support multiple deployment environments and both automated and manual deployment options.

## Prerequisites

### Required Tools
- AWS CLI v2+ configured with appropriate credentials
- Node.js 20+ and npm
- Docker Desktop (for local testing and builds)
- AWS CDK CLI: `npm install -g aws-cdk`

### AWS Account Setup
- AWS account with appropriate IAM permissions
- Route 53 hosted zone (for custom domains)
- ACM certificate for HTTPS (us-east-1 for CloudFront)

## Environment Configuration

### Environment Types
- **Development**: Single-region, minimal resources, cost-optimized
- **Staging**: Production-like, reduced scale
- **Production**: Multi-AZ, auto-scaling, full monitoring

### Configuration Files
```bash
infrastructure/config/
├── dev.json         # Development environment
├── staging.json     # Staging environment
└── prod.json        # Production environment
```

Example configuration:
```json
{
  "environment": "production",
  "region": "us-west-2",
  "domain": "love-claude-code.dev",
  "scaling": {
    "minInstances": 2,
    "maxInstances": 100,
    "targetCpuUtilization": 70
  },
  "monitoring": {
    "enableXRay": true,
    "logRetentionDays": 30
  }
}
```

## Quick Deployment

### One-Command Deployment
```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires confirmation)
npm run deploy:prod
```

## Manual Deployment Steps

### 1. Bootstrap CDK (First Time Only)
```bash
cd infrastructure
npm install
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 2. Build Applications
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build

# Build Docker images
cd ..
npm run docker:build
```

### 3. Deploy Infrastructure
```bash
cd infrastructure

# Preview changes
cdk diff

# Deploy all stacks
cdk deploy --all

# Or deploy specific stacks
cdk deploy MainStack
cdk deploy DatabaseStack
cdk deploy MonitoringStack
```

## Stack Architecture

### Core Stacks

#### 1. NetworkStack
- VPC with public/private subnets
- NAT gateways for private subnet internet access
- Security groups and NACLs
- VPC endpoints for AWS services

#### 2. DatabaseStack
- Aurora Serverless v2 cluster
- DynamoDB tables with auto-scaling
- ElastiCache Redis cluster
- Database security and backups

#### 3. ComputeStack
- ECS Fargate cluster
- Lambda functions with reserved concurrency
- API Gateway with custom domain
- Application Load Balancer

#### 4. StorageStack
- S3 buckets for code storage and artifacts
- CloudFront distribution for static assets
- S3 lifecycle policies
- Cross-region replication (production)

#### 5. MonitoringStack
- CloudWatch dashboards
- X-Ray tracing
- SNS topics for alerts
- Log aggregation and analysis

## Deployment Configurations

### Development Deployment
```bash
# Minimal cost configuration
export DEPLOY_ENV=dev
export INSTANCE_COUNT=1
export ENABLE_MONITORING=false

npm run deploy:dev
```

### Staging Deployment
```bash
# Production-like but smaller scale
export DEPLOY_ENV=staging
export INSTANCE_COUNT=2
export ENABLE_MONITORING=true

npm run deploy:staging
```

### Production Deployment
```bash
# Full scale with all features
export DEPLOY_ENV=prod
export INSTANCE_COUNT=5
export ENABLE_MONITORING=true
export ENABLE_MULTI_REGION=true

npm run deploy:prod
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build applications
        run: npm run build
      
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          npm run deploy:${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}
```

## Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name LoveClaudeCode-MainStack

# Test endpoints
curl https://api.love-claude-code.dev/health
curl https://love-claude-code.dev

# Check logs
aws logs tail /aws/lambda/love-claude-code-api
```

### 2. Configure DNS
```bash
# Update Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://dns-records.json
```

### 3. Enable Monitoring
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "HighErrorRate" \
  --alarm-description "Alert when error rate is high" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Scaling Configuration

### Auto-Scaling Policies

#### ECS Services
```json
{
  "TargetTrackingScalingPolicies": [
    {
      "TargetValue": 70.0,
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    {
      "TargetValue": 80.0,
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    }
  ]
}
```

#### Lambda Functions
```json
{
  "ReservedConcurrentExecutions": 100,
  "ProvisionedConcurrencyConfig": {
    "AllocatedConcurrentExecutions": 10
  }
}
```

## Security Considerations

### Pre-Deployment Checklist
- [ ] All secrets stored in AWS Secrets Manager
- [ ] IAM roles follow least privilege principle
- [ ] Security groups restrict unnecessary access
- [ ] Encryption enabled for all data stores
- [ ] API authentication configured
- [ ] WAF rules enabled for production

### Secret Management
```bash
# Store secrets
aws secretsmanager create-secret \
  --name love-claude-code/prod/api-keys \
  --secret-string file://secrets.json

# Reference in CDK
const apiKey = Secret.fromSecretNameV2(
  this, 'ApiKey',
  'love-claude-code/prod/api-keys'
);
```

## Rollback Procedures

### Automatic Rollback
CloudFormation automatically rolls back on failure. Monitor the stack events:
```bash
aws cloudformation describe-stack-events \
  --stack-name LoveClaudeCode-MainStack
```

### Manual Rollback
```bash
# Rollback to previous version
npm run deploy:rollback

# Or use CDK directly
cdk deploy --rollback

# Emergency Lambda rollback
aws lambda update-function-code \
  --function-name love-claude-code-api \
  --s3-bucket deployment-artifacts \
  --s3-key previous-version.zip
```

## Cost Optimization

### Development Environment
- Use spot instances for ECS tasks
- Scale to zero when not in use
- Use on-demand DynamoDB pricing
- Minimal CloudFront distribution

### Production Environment
- Reserved instances for predictable workloads
- Intelligent tiering for S3 storage
- Auto-scaling based on actual usage
- CloudFront caching optimization

## Monitoring & Alerts

### Key Metrics to Monitor
- API Gateway 4XX/5XX errors
- Lambda function errors and duration
- ECS task health and resource usage
- Database connection pool usage
- Claude API response times

### Alert Configuration
```bash
# High-level alerts
- API availability < 99.9%
- Error rate > 1%
- Response time > 2 seconds
- Database CPU > 80%
- Failed deployments
```

## Troubleshooting

### Common Issues

#### Stack Creation Failed
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name LoveClaudeCode-MainStack \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Common causes:
# - IAM permission issues
# - Resource limits reached
# - Naming conflicts
```

#### Application Not Accessible
```bash
# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...

# Check ECS service status
aws ecs describe-services \
  --cluster love-claude-code \
  --services main-service
```

#### Database Connection Issues
```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxxxxxxxx

# Verify RDS proxy status
aws rds describe-db-proxies \
  --db-proxy-name love-claude-code-proxy
```

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups, 7-day retention
- **Code**: Git repository + S3 artifact backups
- **Infrastructure**: CDK code in version control

### Recovery Procedures
1. **Data Recovery**: Restore from latest Aurora snapshot
2. **Infrastructure Recovery**: Redeploy using CDK
3. **Application Recovery**: Deploy from S3 artifacts

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 1 hour
- **Recovery Point Objective (RPO)**: 15 minutes

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Rotate API keys quarterly
- Review and optimize costs
- Performance testing before major releases
- Security patching per AWS advisories

### Maintenance Mode
```bash
# Enable maintenance mode
aws ssm put-parameter \
  --name /love-claude-code/maintenance-mode \
  --value "true" \
  --type String \
  --overwrite

# Disable maintenance mode
aws ssm put-parameter \
  --name /love-claude-code/maintenance-mode \
  --value "false" \
  --type String \
  --overwrite
```