# Love Claude Code - Backend

This is the Node.js backend for Love Claude Code, providing API services and integrations.

## Stack

- Node.js 20 with TypeScript
- AWS Lambda for serverless functions
- ECS Fargate for containerized services
- PostgreSQL (Aurora Serverless) & DynamoDB
- Redis for caching

## Structure

```
backend/
├── src/
│   ├── lambda/         # Lambda function handlers
│   ├── services/       # Business logic
│   ├── models/         # Data models
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── migrations/         # Database migrations
└── tests/              # Backend tests
```

## Development

```bash
npm install
npm run dev
```