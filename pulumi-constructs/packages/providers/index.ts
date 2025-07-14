/**
 * Provider exports for L1 constructs
 */

// AWS L1 Constructs
export * from './aws/src/L1/S3Bucket'
export * from './aws/src/L1/DynamoDBTable'
export * from './aws/src/L1/Lambda'

// Firebase L1 Constructs
export * from './firebase/src/L1/FirestoreDatabase'
export * from './firebase/src/L1/CloudStorage'
export * from './firebase/src/L1/CloudFunctions'

// Local L1 Constructs
export * from './local/src/L1/PostgresDatabase'

// TODO: Add more L1 constructs as they are implemented
// - AWS: API Gateway, SQS, SNS, Cognito, CloudFront
// - Firebase: Authentication, Realtime Database, Hosting
// - Azure: Storage Account, Cosmos DB, Functions, App Service
// - GCP: Cloud SQL, Pub/Sub, Cloud Run, App Engine
// - Local: Redis, MongoDB, RabbitMQ, MinIO