import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  CreateTemplateCommand,
  GetTemplateCommand
} from '@aws-sdk/client-ses'
import {
  SNSClient,
  PublishCommand,
  CreateTopicCommand,
  SubscribeCommand
} from '@aws-sdk/client-sns'
import {
  NotificationProvider,
  EmailOptions,
  EmailAttachment,
  PushNotification
} from '../types.js'
import { AWSConfig, getAWSClientConfig } from './utils/config.js'
import { MetricsCollector, trackPerformance } from './utils/metrics.js'
import { logger } from './utils/logger.js'
import { withRetry, CircuitBreaker } from './utils/retry.js'
import { v4 as uuidv4 } from 'uuid'

export class AWSNotificationProvider implements NotificationProvider {
  private sesClient: SESClient
  private snsClient: SNSClient
  private circuitBreaker: CircuitBreaker
  private defaultFromEmail: string
  private snsTopicArn?: string
  
  constructor(
    private config: AWSConfig,
    private metrics: MetricsCollector
  ) {
    this.sesClient = new SESClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.ses
    })
    
    this.snsClient = new SNSClient({
      ...getAWSClientConfig(config),
      endpoint: config.endpoints?.sns
    })
    
    this.circuitBreaker = new CircuitBreaker()
    this.defaultFromEmail = process.env.DEFAULT_FROM_EMAIL || `noreply@${config.projectId}.com`
  }
  
  async initialize(): Promise<void> {
    // Create SNS topic for push notifications
    try {
      const topicName = `${this.config.options.dynamoTablePrefix}notifications`
      const response = await this.snsClient.send(new CreateTopicCommand({
        Name: topicName
      }))
      this.snsTopicArn = response.TopicArn
    } catch (error) {
      logger.warn('Failed to create SNS topic', { error })
    }
    
    // Ensure email templates exist
    await this.ensureEmailTemplates()
    
    logger.info('AWS Notifications provider initialized', {
      defaultFromEmail: this.defaultFromEmail,
      snsTopicArn: this.snsTopicArn
    })
  }
  
  async shutdown(): Promise<void> {
    // Nothing to shutdown
  }
  
  private async ensureEmailTemplates(): Promise<void> {
    const templates = [
      {
        TemplateName: 'welcome',
        SubjectPart: 'Welcome to {{projectName}}!',
        TextPart: 'Hi {{name}},\n\nWelcome to {{projectName}}! We\'re excited to have you on board.\n\nBest regards,\nThe {{projectName}} Team',
        HtmlPart: '<h2>Hi {{name}},</h2><p>Welcome to <strong>{{projectName}}</strong>! We\'re excited to have you on board.</p><p>Best regards,<br>The {{projectName}} Team</p>'
      },
      {
        TemplateName: 'password-reset',
        SubjectPart: 'Reset your password',
        TextPart: 'Hi {{name}},\n\nYou requested a password reset. Click here to reset your password: {{resetLink}}\n\nIf you didn\'t request this, please ignore this email.\n\nBest regards,\nThe {{projectName}} Team',
        HtmlPart: '<h2>Hi {{name}},</h2><p>You requested a password reset. <a href="{{resetLink}}">Click here to reset your password</a>.</p><p>If you didn\'t request this, please ignore this email.</p><p>Best regards,<br>The {{projectName}} Team</p>'
      }
    ]
    
    for (const template of templates) {
      try {
        await this.sesClient.send(new GetTemplateCommand({
          TemplateName: template.TemplateName
        }))
      } catch (error: any) {
        if (error.name === 'TemplateDoesNotExistException') {
          await this.sesClient.send(new CreateTemplateCommand({
            Template: template
          }))
          logger.info(`Created email template: ${template.TemplateName}`)
        }
      }
    }
  }
  
  @trackPerformance
  async sendEmail(options: EmailOptions): Promise<{ id: string }> {
    const messageId = uuidv4()
    const from = options.from || this.defaultFromEmail
    const to = Array.isArray(options.to) ? options.to : [options.to]
    
    try {
      // Convert attachments to SES format
      const attachments = options.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? 
          att.content.toString('base64') : att.content,
        contentType: att.contentType || 'application/octet-stream'
      }))
      
      // Build raw email if we have attachments
      if (attachments && attachments.length > 0) {
        // For attachments, we need to send a raw email
        // This is simplified - in production, use a library like nodemailer
        logger.warn('Email attachments not fully implemented in AWS provider')
      }
      
      const command = new SendEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: to
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8'
          },
          Body: {
            ...(options.text ? {
              Text: {
                Data: options.text,
                Charset: 'UTF-8'
              }
            } : {}),
            ...(options.html ? {
              Html: {
                Data: options.html,
                Charset: 'UTF-8'
              }
            } : {})
          }
        },
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET
      })
      
      const response = await this.circuitBreaker.execute(() =>
        withRetry(() => this.sesClient.send(command), this.config.options.maxRetries)
      )
      
      await this.metrics.recordSuccess('SendEmail', {
        Provider: 'SES',
        Recipients: String(to.length)
      })
      
      return { id: response.MessageId || messageId }
    } catch (error) {
      logger.error('Failed to send email', { error, options })
      await this.metrics.recordError('SendEmail', error as Error)
      throw error
    }
  }
  
  @trackPerformance
  async sendSMS(to: string, message: string): Promise<{ id: string }> {
    const messageId = uuidv4()
    
    try {
      const command = new PublishCommand({
        PhoneNumber: to,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional' // or 'Promotional'
          }
        }
      })
      
      const response = await this.circuitBreaker.execute(() =>
        withRetry(() => this.snsClient.send(command), this.config.options.maxRetries)
      )
      
      await this.metrics.recordSuccess('SendSMS', { Provider: 'SNS' })
      
      return { id: response.MessageId || messageId }
    } catch (error) {
      logger.error('Failed to send SMS', { error, to })
      await this.metrics.recordError('SendSMS', error as Error)
      throw error
    }
  }
  
  @trackPerformance
  async sendPushNotification(userId: string, notification: PushNotification): Promise<{ id: string }> {
    const messageId = uuidv4()
    
    if (!this.snsTopicArn) {
      throw new Error('SNS topic not configured for push notifications')
    }
    
    try {
      // In a real implementation, you would:
      // 1. Look up the user's device tokens from DynamoDB
      // 2. Create platform-specific endpoints (iOS, Android, Web)
      // 3. Send to the appropriate platform endpoint
      
      const message = {
        default: notification.body,
        GCM: JSON.stringify({
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge
          },
          data: notification.data || {}
        }),
        APNS: JSON.stringify({
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            badge: notification.badge ? parseInt(notification.badge) : undefined
          },
          data: notification.data || {}
        })
      }
      
      const command = new PublishCommand({
        TopicArn: this.snsTopicArn,
        Message: JSON.stringify(message),
        MessageStructure: 'json',
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: userId
          }
        }
      })
      
      const response = await this.circuitBreaker.execute(() =>
        withRetry(() => this.snsClient.send(command), this.config.options.maxRetries)
      )
      
      await this.metrics.recordSuccess('SendPushNotification', { Provider: 'SNS' })
      
      return { id: response.MessageId || messageId }
    } catch (error) {
      logger.error('Failed to send push notification', { error, userId, notification })
      await this.metrics.recordError('SendPushNotification', error as Error)
      throw error
    }
  }
  
  // Helper method to send templated emails
  async sendTemplatedEmail(
    template: string,
    to: string | string[],
    data: Record<string, string>
  ): Promise<{ id: string }> {
    const messageId = uuidv4()
    const toAddresses = Array.isArray(to) ? to : [to]
    
    try {
      const command = new SendTemplatedEmailCommand({
        Source: this.defaultFromEmail,
        Destination: {
          ToAddresses: toAddresses
        },
        Template: template,
        TemplateData: JSON.stringify(data),
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET
      })
      
      const response = await this.circuitBreaker.execute(() =>
        withRetry(() => this.sesClient.send(command), this.config.options.maxRetries)
      )
      
      return { id: response.MessageId || messageId }
    } catch (error) {
      logger.error('Failed to send templated email', { error, template, to })
      throw error
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Test SES by getting account sending quota
      await this.sesClient.send(new GetTemplateCommand({
        TemplateName: 'welcome'
      }))
      
      return {
        status: 'healthy',
        details: {
          sesConfigured: true,
          snsTopicArn: this.snsTopicArn,
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