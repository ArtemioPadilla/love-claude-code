# Love Claude Code - Infrastructure

AWS CDK infrastructure code for deploying Love Claude Code.

## Stack

- AWS CDK 2.0 with TypeScript
- CloudFormation for infrastructure as code
- Multi-environment support (dev, staging, prod)

## Structure

```
infrastructure/
├── src/
│   ├── stacks/         # CDK stack definitions
│   ├── constructs/     # Reusable CDK constructs
│   └── config/         # Environment configurations
├── bin/                # CDK app entry point
└── tests/              # Infrastructure tests
```

## Deployment

```bash
npm install
cdk bootstrap
cdk deploy --all
```