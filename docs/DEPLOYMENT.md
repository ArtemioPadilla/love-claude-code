# Deployment Guide

## Overview

Love Claude Code supports multiple deployment strategies and providers. This guide covers deployment procedures for development, staging, and production environments across different cloud providers.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Strategies](#deployment-strategies)
- [Provider-Specific Deployment](#provider-specific-deployment)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Rollback Procedures](#rollback-procedures)
- [Security Checklist](#security-checklist)

## Prerequisites

### Required Tools

- **Node.js**: v20+ for building
- **Docker**: For containerized deployments
- **Git**: For version control
- **Cloud CLI Tools** (based on provider):
  - AWS CLI for AWS deployments
  - Firebase CLI for Firebase deployments
  - gcloud CLI for GCP deployments

### Access Requirements

- Cloud provider account with appropriate permissions
- Domain name (optional but recommended)
- SSL certificates (auto-generated with Let's Encrypt)
- API keys securely stored

## Deployment Strategies

### 1. Local Development
Zero-configuration deployment for development and testing.

```bash
# Start local deployment
npm run dev

# Build and run production mode locally
npm run build
npm run start
```

### 2. Docker Deployment
Containerized deployment for consistency across environments.

```bash
# Build Docker images
docker-compose build

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Cloud Deployment
Full production deployment to cloud providers.

## Provider-Specific Deployment

### Firebase Deployment

#### Initial Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore
# - Storage
# - Authentication
```

#### Configuration

```javascript
// firebase.json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "backend",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

#### Deploy Commands

```bash
# Build the application
npm run build

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

# Deploy to specific project
firebase use production
firebase deploy
```

### AWS Deployment

#### Infrastructure Setup

```bash
# Install AWS CDK
npm install -g aws-cdk

# Bootstrap CDK (first time only)
cd infrastructure
cdk bootstrap

# Deploy infrastructure
cdk deploy --all
```

#### Application Deployment

```bash
# Build application
npm run build

# Build Docker images
docker build -t love-claude-code-frontend ./frontend
docker build -t love-claude-code-backend ./backend

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker tag love-claude-code-frontend:latest $ECR_URI/love-claude-code-frontend:latest
docker push $ECR_URI/love-claude-code-frontend:latest

# Update ECS service
aws ecs update-service --cluster love-claude-code --service frontend --force-new-deployment
```

#### S3 + CloudFront (Alternative)

```bash
# Build frontend
cd frontend && npm run build

# Sync to S3
aws s3 sync dist/ s3://love-claude-code-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

### Local Provider Production

For self-hosted deployments using the local provider:

```bash
# Setup production environment
cp .env.example .env.production
# Edit .env.production with production values

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'love-claude-frontend',
      script: 'npm',
      args: 'run serve:frontend',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'love-claude-backend',
      script: './dist/index.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    }
  ]
}
```

## Environment Configuration

### Environment Variables

```bash
# .env.production

# Application
NODE_ENV=production
APP_URL=https://love-claude-code.com
API_URL=https://api.love-claude-code.com

# Security
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
ENCRYPTION_KEY=<32-byte-key>

# Provider Configuration
PROVIDER_TYPE=aws # or firebase, local

# AWS Provider
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Firebase Provider
FIREBASE_PROJECT_ID=love-claude-code-prod
FIREBASE_API_KEY=<api-key>

# AI Services
ANTHROPIC_API_KEY=<api-key>
AWS_BEDROCK_REGION=us-west-2

# Monitoring
SENTRY_DSN=<sentry-dsn>
DATADOG_API_KEY=<api-key>

# Feature Flags
ENABLE_MCP=true
ENABLE_COLLABORATION=false
```

### Secrets Management

#### AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name love-claude-code/production \
  --secret-string file://secrets.json

# Update secret
aws secretsmanager update-secret \
  --secret-id love-claude-code/production \
  --secret-string file://secrets.json
```

#### Firebase Secret Manager

```bash
# Set secret
firebase functions:secrets:set ANTHROPIC_API_KEY

# Access in function
const apiKey = process.env.ANTHROPIC_API_KEY
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Firebase deployment
      - name: Deploy to Firebase Staging
        if: ${{ vars.PROVIDER_TYPE == 'firebase' }}
        run: |
          npm ci
          npm run build
          npm install -g firebase-tools
          firebase use staging
          firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
      
      # AWS deployment
      - name: Deploy to AWS Staging
        if: ${{ vars.PROVIDER_TYPE == 'aws' }}
        run: |
          npm ci
          npm run build
          aws s3 sync frontend/dist s3://${{ vars.S3_BUCKET_STAGING }}
          aws cloudfront create-invalidation --distribution-id ${{ vars.CF_DISTRIBUTION_STAGING }} --paths "/*"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      # Similar to staging but with production targets
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Monitoring alerts set up
- [ ] Rollback plan documented
- [ ] Team notified of deployment

## Monitoring & Maintenance

### Health Checks

```typescript
// backend/src/health.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

app.get('/health/detailed', authenticate, (req, res) => {
  res.json({
    database: await checkDatabase(),
    cache: await checkCache(),
    storage: await checkStorage(),
    external: await checkExternalServices()
  })
})
```

### Monitoring Setup

#### CloudWatch (AWS)

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name LoveClaudeCode \
  --dashboard-body file://cloudwatch-dashboard.json
```

#### Firebase Performance Monitoring

```javascript
// frontend/src/monitoring.ts
import { getPerformance } from 'firebase/performance'

const perf = getPerformance()
// Automatic monitoring of page loads, network requests
```

### Logging

```typescript
// Structured logging
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Usage
logger.info('User logged in', { userId, timestamp: Date.now() })
```

## Rollback Procedures

### Quick Rollback

#### Firebase
```bash
# List recent releases
firebase hosting:releases:list

# Rollback to previous release
firebase hosting:rollback
```

#### AWS (ECS)
```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster love-claude-code \
  --service backend \
  --task-definition backend:123
```

#### Docker
```bash
# Rollback to previous image
docker-compose down
docker-compose up -d --force-recreate love-claude-code:v1.2.3
```

### Database Rollback

```bash
# Always backup before migrations
pg_dump -h localhost -U postgres loveclaudecode > backup.sql

# Rollback migration
npm run migration:rollback

# Restore from backup if needed
psql -h localhost -U postgres loveclaudecode < backup.sql
```

## Security Checklist

### Pre-Deployment Security

- [ ] Dependencies updated and scanned
- [ ] No secrets in code or environment files
- [ ] HTTPS enabled with valid certificates
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection headers set
- [ ] CSP policy configured

### Post-Deployment Security

- [ ] SSL certificate valid and auto-renewing
- [ ] Security headers verified (securityheaders.com)
- [ ] Penetration testing completed
- [ ] Access logs monitored
- [ ] Anomaly detection configured
- [ ] Incident response plan ready

## Scaling Considerations

### Horizontal Scaling

```yaml
# AWS ECS Service
UpdatePolicy:
  MaximumPercent: 200
  MinimumHealthyPercent: 100

DesiredCount: 3
AutoScalingTargetTrackingScalingPolicies:
  - TargetValue: 70
    PredefinedMetricType: ECSServiceAverageCPUUtilization
```

### Vertical Scaling

```bash
# Update instance types
aws ecs update-service \
  --cluster love-claude-code \
  --service backend \
  --task-definition backend:latest \
  --desired-count 5
```

### Database Scaling

```sql
-- Add read replicas
CREATE DATABASE REPLICA loveclaudecode_read1;

-- Partition large tables
CREATE TABLE messages_2024_01 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Troubleshooting Deployments

### Common Issues

#### Build Failures
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

#### Container Issues
```bash
# Check container logs
docker logs love-claude-code-backend

# Inspect container
docker exec -it love-claude-code-backend /bin/sh

# Restart containers
docker-compose restart
```

#### Database Connection Issues
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

## Cost Optimization

### AWS Cost Optimization
- Use Spot instances for non-critical workloads
- Enable S3 lifecycle policies
- Use CloudFront for static assets
- Right-size EC2/ECS instances
- Enable auto-scaling with proper thresholds

### Firebase Cost Optimization
- Enable Firestore offline persistence
- Optimize Cloud Functions cold starts
- Use Firebase Hosting CDN effectively
- Monitor and limit API usage
- Implement proper data retention policies

## Disaster Recovery

### Backup Strategy

```bash
# Automated daily backups
0 2 * * * /scripts/backup.sh

# backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > backup_$DATE.sql.gz
aws s3 cp backup_$DATE.sql.gz s3://backups/loveclaudecode/
```

### Recovery Plan

1. **Data Recovery**: Restore from latest backup
2. **Service Recovery**: Redeploy from last known good state
3. **DNS Failover**: Switch to backup region
4. **Communication**: Notify users of issues
5. **Post-Mortem**: Document and learn from incident

## Resources

- [AWS Deployment Guide](https://aws.amazon.com/getting-started/hands-on/deploy-nodejs-web-app/)
- [Firebase Deployment Guide](https://firebase.google.com/docs/hosting/quickstart)
- [Docker Deployment Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12 Factor App Methodology](https://12factor.net/)

## Getting Help

For deployment assistance:

1. Check the [Troubleshooting](#troubleshooting-deployments) section
2. Review cloud provider documentation
3. Ask in Discord #deployment channel
4. Create an issue with `deployment` label
5. Contact the infrastructure team