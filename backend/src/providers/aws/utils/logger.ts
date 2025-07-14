import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs'

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  metadata?: any
  timestamp: Date
}

class Logger {
  private buffer: LogEntry[] = []
  private cloudWatchClient?: CloudWatchLogsClient
  private logGroupName = '/aws/lambda/love-claude-code'
  private logStreamName = `${new Date().toISOString().split('T')[0]}-${process.env.AWS_LAMBDA_FUNCTION_NAME || 'local'}`
  
  async initialize(config?: any): Promise<void> {
    if (config?.enableCloudWatch && process.env.AWS_REGION) {
      this.cloudWatchClient = new CloudWatchLogsClient({
        region: config.region
      })
      
      // Create log stream if it doesn't exist
      try {
        await this.cloudWatchClient.send(new CreateLogStreamCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName
        }))
      } catch (error: any) {
        if (error.name !== 'ResourceAlreadyExistsException') {
          console.error('Failed to create log stream:', error)
        }
      }
    }
  }
  
  private log(level: LogEntry['level'], message: string, metadata?: any): void {
    const entry: LogEntry = {
      level,
      message,
      metadata,
      timestamp: new Date()
    }
    
    // Always log to console
    const logData = metadata ? `${message} ${JSON.stringify(metadata)}` : message
    switch (level) {
      case 'error':
        console.error(`[ERROR] ${logData}`)
        break
      case 'warn':
        console.warn(`[WARN] ${logData}`)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[DEBUG] ${logData}`)
        }
        break
      default:
        console.log(`[INFO] ${logData}`)
    }
    
    // Buffer for CloudWatch
    if (this.cloudWatchClient) {
      this.buffer.push(entry)
      if (this.buffer.length >= 10) {
        this.flush().catch(console.error)
      }
    }
  }
  
  info(message: string, metadata?: any): void {
    this.log('info', message, metadata)
  }
  
  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata)
  }
  
  error(message: string, metadata?: any): void {
    this.log('error', message, metadata)
  }
  
  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata)
  }
  
  async flush(): Promise<void> {
    if (!this.cloudWatchClient || this.buffer.length === 0) return
    
    const events = this.buffer.map(entry => ({
      message: JSON.stringify({
        level: entry.level,
        message: entry.message,
        metadata: entry.metadata
      }),
      timestamp: entry.timestamp.getTime()
    }))
    
    this.buffer = []
    
    try {
      await this.cloudWatchClient.send(new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: events
      }))
    } catch (error) {
      console.error('Failed to send logs to CloudWatch:', error)
    }
  }
}

export const logger = new Logger()