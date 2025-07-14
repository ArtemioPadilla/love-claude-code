import {
  DynamoDBClient,
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteItemCommand,
  TransactWriteItemsCommand,
  DescribeTableCommand,
  AttributeValue
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import {
  DatabaseProvider,
  QueryOptions,
  QueryFilter,
  QueryResult,
  Transaction
} from '../types.js'
import { AWSConfig, getAWSClientConfig } from './utils/config.js'
import { MetricsCollector, trackPerformance } from './utils/metrics.js'
import { logger } from './utils/logger.js'
import { withRetry, CircuitBreaker } from './utils/retry.js'
import { CacheManager } from './utils/cache.js'
import { v4 as uuidv4 } from 'uuid'

export class AWSDatabaseProvider implements DatabaseProvider {
  private client: DynamoDBClient
  private tablePrefix: string
  private cache: CacheManager
  private circuitBreaker: CircuitBreaker
  private tables: Map<string, boolean> = new Map()
  
  constructor(
    private config: AWSConfig,
    private metrics: MetricsCollector
  ) {
    this.client = new DynamoDBClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.dynamodb
    })
    
    this.tablePrefix = config.options.dynamoTablePrefix || ''
    this.cache = new CacheManager(config)
    this.circuitBreaker = new CircuitBreaker()
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    logger.info('AWS Database provider initialized', {
      tablePrefix: this.tablePrefix,
      onDemand: this.config.options.dynamoOnDemand
    })
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
  }
  
  private getTableName(collection: string): string {
    return `${this.tablePrefix}${collection}`
  }
  
  private async ensureTable(collection: string): Promise<void> {
    const tableName = this.getTableName(collection)
    
    if (this.tables.has(tableName)) {
      return
    }
    
    try {
      await this.client.send(new DescribeTableCommand({ TableName: tableName }))
      this.tables.set(tableName, true)
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Create table
        await this.createTable(tableName)
        this.tables.set(tableName, true)
      } else {
        throw error
      }
    }
  }
  
  private async createTable(tableName: string): Promise<void> {
    const command = new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
        { AttributeName: 'gsi1pk', AttributeType: 'S' },
        { AttributeName: 'gsi1sk', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi1',
          KeySchema: [
            { AttributeName: 'gsi1pk', KeyType: 'HASH' },
            { AttributeName: 'gsi1sk', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ...(this.config.options.dynamoOnDemand
            ? {}
            : {
                ProvisionedThroughput: {
                  ReadCapacityUnits: this.config.options.dynamoReadCapacity || 5,
                  WriteCapacityUnits: this.config.options.dynamoWriteCapacity || 5
                }
              })
        }
      ],
      ...(this.config.options.dynamoOnDemand
        ? { BillingMode: 'PAY_PER_REQUEST' }
        : {
            ProvisionedThroughput: {
              ReadCapacityUnits: this.config.options.dynamoReadCapacity || 5,
              WriteCapacityUnits: this.config.options.dynamoWriteCapacity || 5
            }
          })
    })
    
    await this.client.send(command)
    logger.info(`Created DynamoDB table: ${tableName}`)
  }
  
  @trackPerformance
  async create<T>(collection: string, data: Omit<T, 'id'>): Promise<T & { id: string }> {
    await this.ensureTable(collection)
    
    const id = uuidv4()
    const now = new Date().toISOString()
    const item = {
      ...data,
      id,
      sk: 'ITEM',
      createdAt: now,
      updatedAt: now,
      _collection: collection
    }
    
    const command = new PutItemCommand({
      TableName: this.getTableName(collection),
      Item: marshall(item),
      ConditionExpression: 'attribute_not_exists(id)'
    })
    
    await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    // Invalidate list cache
    await this.cache.clear(`list:${collection}:`)
    
    return item as T & { id: string }
  }
  
  @trackPerformance
  @CacheManager.cacheable({ ttl: 300 })
  async get<T>(collection: string, id: string): Promise<T | null> {
    await this.ensureTable(collection)
    
    const command = new GetItemCommand({
      TableName: this.getTableName(collection),
      Key: marshall({ id, sk: 'ITEM' }),
      ConsistentRead: false // Eventually consistent for better performance
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    if (!response.Item) {
      return null
    }
    
    const item = unmarshall(response.Item)
    delete item.sk
    delete item._collection
    
    return item as T
  }
  
  @trackPerformance
  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    await this.ensureTable(collection)
    
    const updateExpressions: string[] = ['#updatedAt = :updatedAt']
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt'
    }
    const expressionAttributeValues: Record<string, AttributeValue> = {
      ':updatedAt': { S: new Date().toISOString() }
    }
    
    // Build update expression
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'sk') {
        const placeholder = `#${key}`
        const valuePlaceholder = `:${key}`
        updateExpressions.push(`${placeholder} = ${valuePlaceholder}`)
        expressionAttributeNames[placeholder] = key
        expressionAttributeValues[valuePlaceholder] = marshall(value)
      }
    })
    
    const command = new UpdateItemCommand({
      TableName: this.getTableName(collection),
      Key: marshall({ id, sk: 'ITEM' }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(id)'
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    // Invalidate caches
    await Promise.all([
      this.cache.delete(`get:${collection}:${id}`),
      this.cache.clear(`list:${collection}:`)
    ])
    
    const updated = unmarshall(response.Attributes!)
    delete updated.sk
    delete updated._collection
    
    return updated as T
  }
  
  @trackPerformance
  async delete(collection: string, id: string): Promise<void> {
    await this.ensureTable(collection)
    
    const command = new DeleteItemCommand({
      TableName: this.getTableName(collection),
      Key: marshall({ id, sk: 'ITEM' }),
      ConditionExpression: 'attribute_exists(id)'
    })
    
    await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    // Invalidate caches
    await Promise.all([
      this.cache.delete(`get:${collection}:${id}`),
      this.cache.clear(`list:${collection}:`)
    ])
  }
  
  @trackPerformance
  async list<T>(collection: string, options?: QueryOptions): Promise<QueryResult<T>> {
    await this.ensureTable(collection)
    
    const limit = options?.limit || 100
    const cacheKey = `list:${collection}:${JSON.stringify(options)}`
    
    // Try cache first
    const cached = await this.cache.get<QueryResult<T>>(cacheKey)
    if (cached) {
      return cached
    }
    
    const command = new QueryCommand({
      TableName: this.getTableName(collection),
      IndexName: 'gsi1',
      KeyConditionExpression: 'gsi1pk = :collection',
      ExpressionAttributeValues: {
        ':collection': { S: collection }
      },
      Limit: limit,
      ExclusiveStartKey: options?.startAfter ? marshall({ id: options.startAfter }) : undefined,
      ScanIndexForward: options?.orderBy?.[0]?.direction !== 'desc'
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    const items = response.Items?.map(item => {
      const unmarshalled = unmarshall(item)
      delete unmarshalled.sk
      delete unmarshalled._collection
      delete unmarshalled.gsi1pk
      delete unmarshalled.gsi1sk
      return unmarshalled
    }) || []
    
    const result: QueryResult<T> = {
      items: items as T[],
      total: response.Count,
      nextPageToken: response.LastEvaluatedKey ? 
        unmarshall(response.LastEvaluatedKey).id : undefined
    }
    
    // Cache result
    await this.cache.set(cacheKey, result, 60) // 1 minute
    
    return result
  }
  
  @trackPerformance
  async query<T>(collection: string, filters: QueryFilter[]): Promise<T[]> {
    await this.ensureTable(collection)
    
    // Build filter expression
    const filterExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, AttributeValue> = {}
    
    filters.forEach((filter, index) => {
      const nameKey = `#field${index}`
      const valueKey = `:value${index}`
      
      expressionAttributeNames[nameKey] = filter.field
      expressionAttributeValues[valueKey] = marshall(filter.value)
      
      switch (filter.operator) {
        case '=':
          filterExpressions.push(`${nameKey} = ${valueKey}`)
          break
        case '!=':
          filterExpressions.push(`${nameKey} <> ${valueKey}`)
          break
        case '<':
          filterExpressions.push(`${nameKey} < ${valueKey}`)
          break
        case '<=':
          filterExpressions.push(`${nameKey} <= ${valueKey}`)
          break
        case '>':
          filterExpressions.push(`${nameKey} > ${valueKey}`)
          break
        case '>=':
          filterExpressions.push(`${nameKey} >= ${valueKey}`)
          break
        case 'contains':
          filterExpressions.push(`contains(${nameKey}, ${valueKey})`)
          break
        case 'in':
          // DynamoDB doesn't have IN operator, use OR
          const values = filter.value as any[]
          const orConditions = values.map((v, i) => {
            const vKey = `${valueKey}_${i}`
            expressionAttributeValues[vKey] = marshall(v)
            return `${nameKey} = ${vKey}`
          })
          filterExpressions.push(`(${orConditions.join(' OR ')})`)
          break
      }
    })
    
    const command = new ScanCommand({
      TableName: this.getTableName(collection),
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    })
    
    const response = await this.circuitBreaker.execute(() =>
      withRetry(() => this.client.send(command), this.config.options.maxRetries)
    )
    
    const items = response.Items?.map(item => {
      const unmarshalled = unmarshall(item)
      delete unmarshalled.sk
      delete unmarshalled._collection
      return unmarshalled
    }) || []
    
    return items as T[]
  }
  
  @trackPerformance
  async batchCreate<T>(collection: string, items: Omit<T, 'id'>[]): Promise<(T & { id: string })[]> {
    await this.ensureTable(collection)
    
    const now = new Date().toISOString()
    const created = items.map(item => ({
      ...item,
      id: uuidv4(),
      sk: 'ITEM',
      createdAt: now,
      updatedAt: now,
      _collection: collection,
      gsi1pk: collection,
      gsi1sk: now
    }))
    
    // DynamoDB limits batch writes to 25 items
    const chunks = []
    for (let i = 0; i < created.length; i += 25) {
      chunks.push(created.slice(i, i + 25))
    }
    
    for (const chunk of chunks) {
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [this.getTableName(collection)]: chunk.map(item => ({
            PutRequest: { Item: marshall(item) }
          }))
        }
      })
      
      await this.circuitBreaker.execute(() =>
        withRetry(() => this.client.send(command), this.config.options.maxRetries)
      )
    }
    
    // Invalidate list cache
    await this.cache.clear(`list:${collection}:`)
    
    return created.map(item => {
      const { sk, _collection, gsi1pk, gsi1sk, ...rest } = item
      return rest
    }) as (T & { id: string })[]
  }
  
  async batchUpdate<T>(collection: string, updates: { id: string; data: Partial<T> }[]): Promise<void> {
    // DynamoDB doesn't support batch updates directly
    // Use parallel individual updates
    await Promise.all(
      updates.map(({ id, data }) => this.update(collection, id, data))
    )
  }
  
  async batchDelete(collection: string, ids: string[]): Promise<void> {
    await this.ensureTable(collection)
    
    // DynamoDB limits batch writes to 25 items
    const chunks = []
    for (let i = 0; i < ids.length; i += 25) {
      chunks.push(ids.slice(i, i + 25))
    }
    
    for (const chunk of chunks) {
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [this.getTableName(collection)]: chunk.map(id => ({
            DeleteRequest: { Key: marshall({ id, sk: 'ITEM' }) }
          }))
        }
      })
      
      await this.circuitBreaker.execute(() =>
        withRetry(() => this.client.send(command), this.config.options.maxRetries)
      )
    }
    
    // Invalidate caches
    await Promise.all([
      ...ids.map(id => this.cache.delete(`get:${collection}:${id}`)),
      this.cache.clear(`list:${collection}:`)
    ])
  }
  
  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    // Implement DynamoDB transaction
    const operations: any[] = []
    
    const tx: Transaction = {
      async get<T>(collection: string, id: string): Promise<T | null> {
        // In a real transaction, this would be part of TransactGetItems
        return this.get(collection, id)
      },
      
      create<T>(collection: string, data: Omit<T, 'id'>): void {
        const id = uuidv4()
        const now = new Date().toISOString()
        operations.push({
          Put: {
            TableName: this.getTableName(collection),
            Item: marshall({
              ...data,
              id,
              sk: 'ITEM',
              createdAt: now,
              updatedAt: now,
              _collection: collection
            }),
            ConditionExpression: 'attribute_not_exists(id)'
          }
        })
      },
      
      update<T>(collection: string, id: string, data: Partial<T>): void {
        // Build update for transaction
        const updateExpressions: string[] = ['#updatedAt = :updatedAt']
        const expressionAttributeNames: Record<string, string> = {
          '#updatedAt': 'updatedAt'
        }
        const expressionAttributeValues: Record<string, AttributeValue> = {
          ':updatedAt': { S: new Date().toISOString() }
        }
        
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'sk') {
            const placeholder = `#${key}`
            const valuePlaceholder = `:${key}`
            updateExpressions.push(`${placeholder} = ${valuePlaceholder}`)
            expressionAttributeNames[placeholder] = key
            expressionAttributeValues[valuePlaceholder] = marshall(value)
          }
        })
        
        operations.push({
          Update: {
            TableName: this.getTableName(collection),
            Key: marshall({ id, sk: 'ITEM' }),
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(id)'
          }
        })
      },
      
      delete(collection: string, id: string): void {
        operations.push({
          Delete: {
            TableName: this.getTableName(collection),
            Key: marshall({ id, sk: 'ITEM' }),
            ConditionExpression: 'attribute_exists(id)'
          }
        })
      }
    }
    
    const result = await callback(tx)
    
    if (operations.length > 0) {
      // Execute transaction
      const command = new TransactWriteItemsCommand({
        TransactItems: operations
      })
      
      await this.circuitBreaker.execute(() =>
        withRetry(() => this.client.send(command), this.config.options.maxRetries)
      )
      
      // Clear caches
      await this.cache.clear()
    }
    
    return result
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // List tables to check connection
      const testTable = this.getTableName('health-check')
      await this.client.send(new DescribeTableCommand({ 
        TableName: this.tablePrefix ? `${this.tablePrefix}users` : 'users'
      }))
      
      return {
        status: 'healthy',
        details: {
          tablePrefix: this.tablePrefix,
          cacheStatus: await this.cache.healthCheck(),
          circuitBreaker: this.circuitBreaker.status
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}