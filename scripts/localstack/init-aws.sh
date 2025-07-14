#!/bin/bash
# LocalStack initialization script
# This script runs when LocalStack starts up

echo "Initializing LocalStack resources..."

# Wait for LocalStack to be ready
until awslocal sts get-caller-identity; do
    echo "Waiting for LocalStack to be ready..."
    sleep 2
done

# Create S3 buckets
echo "Creating S3 buckets..."
awslocal s3 mb s3://love-claude-storage || true
awslocal s3 mb s3://love-claude-lambda-deployments || true

# Create DynamoDB tables
echo "Creating DynamoDB tables..."
awslocal dynamodb create-table \
    --table-name love-claude-users \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 || true

awslocal dynamodb create-table \
    --table-name love-claude-projects \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=userId-index,Keys=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 || true

awslocal dynamodb create-table \
    --table-name love-claude-realtime-connections \
    --attribute-definitions \
        AttributeName=connectionId,AttributeType=S \
    --key-schema \
        AttributeName=connectionId,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 || true

awslocal dynamodb create-table \
    --table-name love-claude-realtime-subscriptions \
    --attribute-definitions \
        AttributeName=channelId,AttributeType=S \
        AttributeName=connectionId,AttributeType=S \
    --key-schema \
        AttributeName=channelId,KeyType=HASH \
        AttributeName=connectionId,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=channel-index,Keys=[{AttributeName=channelId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 || true

# Create Cognito User Pool
echo "Creating Cognito User Pool..."
POOL_ID=$(awslocal cognito-idp create-user-pool \
    --pool-name love-claude-users \
    --policies PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true} \
    --auto-verified-attributes email \
    --query 'UserPool.Id' \
    --output text)

echo "User Pool ID: $POOL_ID"

# Create Cognito User Pool Client
CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
    --user-pool-id $POOL_ID \
    --client-name love-claude-web-client \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --query 'UserPoolClient.ClientId' \
    --output text)

echo "Client ID: $CLIENT_ID"

# Create Lambda execution role
echo "Creating Lambda execution role..."
awslocal iam create-role \
    --role-name love-claude-lambda-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' || true

# Attach policies to Lambda role
awslocal iam attach-role-policy \
    --role-name love-claude-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole || true

# Create API Gateway for WebSocket
echo "Creating API Gateway..."
API_ID=$(awslocal apigatewayv2 create-api \
    --name love-claude-websocket \
    --protocol-type WEBSOCKET \
    --route-selection-expression '$request.body.action' \
    --query 'ApiId' \
    --output text)

echo "API Gateway ID: $API_ID"

# Create SNS topics
echo "Creating SNS topics..."
awslocal sns create-topic --name love-claude-notifications || true

# Create SES configuration set
echo "Configuring SES..."
awslocal ses put-configuration-set --configuration-set Name=love-claude-emails || true

# Store configuration in SSM Parameter Store
echo "Storing configuration..."
awslocal ssm put-parameter \
    --name /love-claude/cognito/user-pool-id \
    --value $POOL_ID \
    --type String || true

awslocal ssm put-parameter \
    --name /love-claude/cognito/client-id \
    --value $CLIENT_ID \
    --type String || true

awslocal ssm put-parameter \
    --name /love-claude/api-gateway/websocket-id \
    --value $API_ID \
    --type String || true

echo "LocalStack initialization complete!"