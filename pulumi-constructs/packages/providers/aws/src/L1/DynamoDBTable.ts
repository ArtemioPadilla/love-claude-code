import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { L1Construct, SecurityConsideration, CostModel } from '@love-claude-code/core'
import { ConstructLevel, CloudProvider } from '@love-claude-code/core'

export interface DynamoDBTableArgs {
  /**
   * Table name
   */
  tableName?: pulumi.Input<string>
  
  /**
   * Partition key attribute
   */
  partitionKey: {
    name: pulumi.Input<string>
    type: pulumi.Input<'S' | 'N' | 'B'> // String, Number, Binary
  }
  
  /**
   * Sort key attribute (optional)
   */
  sortKey?: {
    name: pulumi.Input<string>
    type: pulumi.Input<'S' | 'N' | 'B'>
  }
  
  /**
   * Billing mode
   */
  billingMode?: pulumi.Input<'PAY_PER_REQUEST' | 'PROVISIONED'>
  
  /**
   * Read capacity units (for provisioned mode)
   */
  readCapacity?: pulumi.Input<number>
  
  /**
   * Write capacity units (for provisioned mode)
   */
  writeCapacity?: pulumi.Input<number>
  
  /**
   * Enable point-in-time recovery
   */
  enablePointInTimeRecovery?: pulumi.Input<boolean>
  
  /**
   * Enable server-side encryption
   */
  enableEncryption?: pulumi.Input<boolean>
  
  /**
   * KMS key ARN for encryption
   */
  kmsKeyArn?: pulumi.Input<string>
  
  /**
   * Global secondary indexes
   */
  globalSecondaryIndexes?: pulumi.Input<aws.types.input.dynamodb.TableGlobalSecondaryIndex[]>
  
  /**
   * Stream specification
   */
  streamEnabled?: pulumi.Input<boolean>
  streamViewType?: pulumi.Input<'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY'>
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L1 construct for AWS DynamoDB table with security best practices
 */
export class DynamoDBTable extends L1Construct {
  public readonly table: aws.dynamodb.Table
  public readonly tableArn: pulumi.Output<string>
  public readonly tableName: pulumi.Output<string>
  public readonly streamArn: pulumi.Output<string | undefined>
  
  constructor(name: string, args: DynamoDBTableArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:dynamodb:L1Table', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L1',
      'love-claude-code:provider': 'aws',
      'love-claude-code:resource': 'dynamodb-table',
      ...args.tags
    }
    
    // Prepare attributes
    const attributes: aws.types.input.dynamodb.TableAttribute[] = [
      {
        name: args.partitionKey.name,
        type: args.partitionKey.type
      }
    ]
    
    if (args.sortKey) {
      attributes.push({
        name: args.sortKey.name,
        type: args.sortKey.type
      })
    }
    
    // Add attributes from GSIs
    if (args.globalSecondaryIndexes) {
      args.globalSecondaryIndexes.apply(gsis => {
        gsis?.forEach(gsi => {
          // Add hash key if not already present
          if (!attributes.find(attr => attr.name === gsi.hashKey)) {
            attributes.push({ name: gsi.hashKey, type: 'S' }) // Default to string
          }
          // Add range key if present and not already added
          if (gsi.rangeKey && !attributes.find(attr => attr.name === gsi.rangeKey)) {
            attributes.push({ name: gsi.rangeKey, type: 'S' })
          }
        })
      })
    }
    
    // Create the table
    this.table = new aws.dynamodb.Table(`${name}-table`, {
      name: args.tableName,
      attributes: attributes,
      hashKey: args.partitionKey.name,
      rangeKey: args.sortKey?.name,
      billingMode: args.billingMode || 'PAY_PER_REQUEST',
      readCapacity: args.billingMode === 'PROVISIONED' ? (args.readCapacity || 5) : undefined,
      writeCapacity: args.billingMode === 'PROVISIONED' ? (args.writeCapacity || 5) : undefined,
      
      // Point-in-time recovery
      pointInTimeRecovery: {
        enabled: args.enablePointInTimeRecovery !== false
      },
      
      // Encryption
      serverSideEncryption: args.enableEncryption !== false ? {
        enabled: true,
        kmsKeyArn: args.kmsKeyArn
      } : undefined,
      
      // Global secondary indexes
      globalSecondaryIndexes: args.globalSecondaryIndexes,
      
      // Streams
      streamEnabled: args.streamEnabled,
      streamViewType: args.streamEnabled ? (args.streamViewType || 'NEW_AND_OLD_IMAGES') : undefined,
      
      tags: defaultTags
    }, { parent: this })
    
    // Apply security best practices
    this.applySecurityBestPractices()
    
    // Set outputs
    this.tableArn = this.table.arn
    this.tableName = this.table.name
    this.streamArn = this.table.streamArn
    
    // Register outputs
    this.registerOutputs({
      tableArn: this.tableArn,
      tableName: this.tableName,
      streamArn: this.streamArn
    })
  }
  
  protected applySecurityBestPractices(): void {
    this.securityConsiderations = [
      {
        type: 'encryption',
        description: 'Server-side encryption enabled by default',
        recommendation: 'Use customer-managed KMS keys for enhanced security'
      },
      {
        type: 'backup',
        description: 'Point-in-time recovery enabled',
        recommendation: 'Configure backup retention and test recovery procedures'
      },
      {
        type: 'access-control',
        description: 'IAM-based access control',
        recommendation: 'Use fine-grained IAM policies and conditions'
      }
    ]
  }
  
  public getCostModel(): CostModel {
    return {
      provider: CloudProvider.AWS,
      service: 'DynamoDB',
      baseCost: 0,
      usage: {
        storage: {
          cost: 0.25, // Per GB-month
          unit: 'GB-month'
        },
        readCapacity: {
          cost: 0.00013, // Per RCU per hour (provisioned)
          unit: 'RCU-hour'
        },
        writeCapacity: {
          cost: 0.00065, // Per WCU per hour (provisioned)
          unit: 'WCU-hour'
        },
        requests: {
          cost: 0.25, // Per million read/write requests (on-demand)
          unit: 'million requests'
        }
      }
    }
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l1-dynamodb-table',
      level: ConstructLevel.L1,
      name: 'AWS DynamoDB Table',
      description: 'Secure DynamoDB table with encryption, backups, and streams',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'database',
      tags: ['aws', 'dynamodb', 'database', 'nosql', 'serverless'],
      providers: [CloudProvider.AWS]
    }
  }
}