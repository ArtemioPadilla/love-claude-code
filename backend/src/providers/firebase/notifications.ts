import { Messaging, Message, MulticastMessage } from 'firebase-admin/messaging'
import {
  NotificationProvider,
  EmailOptions,
  EmailAttachment,
  PushNotification
} from '../types.js'
import { FirebaseConfig, FirebaseServices } from './types.js'
import { FirebaseMetricsCollector, trackFirebasePerformance } from './utils/metrics.js'
import { FirebaseCacheManager } from './utils/cache.js'
import { withFirebaseRetry, retryableFirebase, FirebaseCircuitBreaker } from './utils/retry.js'
import { logger } from '../aws/utils/logger.js'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import { createTransport, Transporter } from 'nodemailer'

interface EmailTemplate {
  subject: string
  text?: string
  html?: string
  variables?: string[]
}

export class FirebaseNotificationProvider implements NotificationProvider {
  private messaging: Messaging
  private cache: FirebaseCacheManager
  private circuitBreaker: FirebaseCircuitBreaker
  private emailTransporter?: Transporter
  private emailTemplates: Map<string, EmailTemplate> = new Map()
  
  constructor(
    private services: FirebaseServices,
    private config: FirebaseConfig,
    private metrics: FirebaseMetricsCollector
  ) {
    this.messaging = services.messaging
    this.cache = new FirebaseCacheManager(config)
    this.circuitBreaker = new FirebaseCircuitBreaker()
  }
  
  async initialize(): Promise<void> {
    await this.cache.initialize()
    
    // Initialize email transport
    if (process.env.SMTP_HOST) {
      this.emailTransporter = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
      
      // Verify email configuration
      try {
        await this.emailTransporter.verify()
        logger.info('Email transporter configured')
      } catch (error) {
        logger.warn('Email transporter verification failed', { error })
      }
    }
    
    // Initialize default email templates
    this.initializeEmailTemplates()
    
    logger.info('Firebase Notifications provider initialized')
  }
  
  async shutdown(): Promise<void> {
    await this.cache.shutdown()
    if (this.emailTransporter) {
      this.emailTransporter.close()
    }
  }
  
  private initializeEmailTemplates(): void {
    this.emailTemplates.set('welcome', {
      subject: 'Welcome to {{projectName}}!',
      text: 'Hi {{name}},\n\nWelcome to {{projectName}}! We\'re excited to have you on board.\n\nBest regards,\nThe {{projectName}} Team',
      html: '<h2>Hi {{name}},</h2><p>Welcome to <strong>{{projectName}}</strong>! We\'re excited to have you on board.</p><p>Best regards,<br>The {{projectName}} Team</p>',
      variables: ['name', 'projectName']
    })
    
    this.emailTemplates.set('password-reset', {
      subject: 'Reset your password',
      text: 'Hi {{name}},\n\nYou requested a password reset. Click here to reset your password: {{resetLink}}\n\nIf you didn\'t request this, please ignore this email.\n\nBest regards,\nThe {{projectName}} Team',
      html: '<h2>Hi {{name}},</h2><p>You requested a password reset. <a href="{{resetLink}}">Click here to reset your password</a>.</p><p>If you didn\'t request this, please ignore this email.</p><p>Best regards,<br>The {{projectName}} Team</p>',
      variables: ['name', 'resetLink', 'projectName']
    })
    
    this.emailTemplates.set('verification', {
      subject: 'Verify your email address',
      text: 'Hi {{name}},\n\nPlease verify your email address by clicking this link: {{verificationLink}}\n\nBest regards,\nThe {{projectName}} Team',
      html: '<h2>Hi {{name}},</h2><p>Please verify your email address by <a href="{{verificationLink}}">clicking this link</a>.</p><p>Best regards,<br>The {{projectName}} Team</p>',
      variables: ['name', 'verificationLink', 'projectName']
    })
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async sendEmail(options: EmailOptions): Promise<{ id: string }> {
    const messageId = uuidv4()
    
    if (!this.emailTransporter) {
      throw new Error('Email transport not configured')
    }
    
    try {
      // Prepare email options
      const mailOptions: any = {
        from: options.from || process.env.DEFAULT_FROM_EMAIL || `noreply@${this.config.projectId}.firebaseapp.com`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        messageId: `${messageId}@${this.config.projectId}.firebaseapp.com`
      }
      
      // Add attachments if any
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      }
      
      const info = await this.circuitBreaker.execute(() =>
        this.emailTransporter!.sendMail(mailOptions)
      )
      
      await this.metrics.recordSuccess('SendEmail', { 
        recipients: String(Array.isArray(options.to) ? options.to.length : 1) 
      })
      
      return { id: info.messageId || messageId }
    } catch (error: any) {
      logger.error('Send email failed', { error, options })
      await this.metrics.recordError('SendEmail', error)
      throw error
    }
  }
  
  @trackFirebasePerformance
  async sendSMS(to: string, message: string): Promise<{ id: string }> {
    // Firebase doesn't have built-in SMS support
    // You would integrate with a service like Twilio
    
    const messageId = uuidv4()
    
    // For now, log the SMS request
    logger.info('SMS requested (not implemented)', { to, message, messageId })
    
    // In production, integrate with SMS provider
    if (process.env.TWILIO_ACCOUNT_SID) {
      // Example Twilio integration
      try {
        // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        // const result = await twilio.messages.create({
        //   body: message,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: to
        // })
        // return { id: result.sid }
      } catch (error) {
        logger.error('SMS send failed', { error, to })
        throw error
      }
    }
    
    return { id: messageId }
  }
  
  @trackFirebasePerformance
  @retryableFirebase()
  async sendPushNotification(userId: string, notification: PushNotification): Promise<{ id: string }> {
    const messageId = uuidv4()
    
    try {
      // Get user's FCM tokens from cache or database
      const tokensKey = `fcm-tokens:${userId}`
      let tokens = await this.cache.get<string[]>(tokensKey)
      
      if (!tokens || tokens.length === 0) {
        // In production, fetch from database
        tokens = await this.getUserFCMTokens(userId)
        if (tokens.length > 0) {
          await this.cache.set(tokensKey, tokens, 3600) // Cache for 1 hour
        }
      }
      
      if (!tokens || tokens.length === 0) {
        throw new Error(`No FCM tokens found for user ${userId}`)
      }
      
      // Create FCM message
      const message: MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.icon
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            tag: notification.tag,
            ...(notification.badge && { notificationCount: parseInt(notification.badge) })
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              ...(notification.badge && { badge: parseInt(notification.badge) }),
              sound: 'default'
            }
          }
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            tag: notification.tag,
            requireInteraction: notification.requireInteraction,
            data: notification.data
          }
        }
      }
      
      // Send multicast message
      const response = await this.circuitBreaker.execute(() =>
        this.messaging.sendMulticast(message)
      )
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const error = resp.error
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens![idx])
            }
          }
        })
        
        if (failedTokens.length > 0) {
          // Remove invalid tokens
          await this.removeInvalidTokens(userId, failedTokens)
        }
      }
      
      await this.metrics.recordSuccess('SendPushNotification', {
        successCount: String(response.successCount),
        failureCount: String(response.failureCount)
      })
      
      return { id: messageId }
    } catch (error: any) {
      logger.error('Send push notification failed', { error, userId })
      await this.metrics.recordError('SendPushNotification', error)
      throw error
    }
  }
  
  // Helper method to send templated emails
  async sendTemplatedEmail(
    template: string,
    to: string | string[],
    variables: Record<string, string>
  ): Promise<{ id: string }> {
    const emailTemplate = this.emailTemplates.get(template)
    if (!emailTemplate) {
      throw new Error(`Email template not found: ${template}`)
    }
    
    // Replace variables in template
    let subject = emailTemplate.subject
    let text = emailTemplate.text || ''
    let html = emailTemplate.html || ''
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      text = text.replace(regex, value)
      html = html.replace(regex, value)
    }
    
    return this.sendEmail({
      to,
      subject,
      text,
      html
    })
  }
  
  // Token management
  async registerFCMToken(userId: string, token: string): Promise<void> {
    const tokensKey = `fcm-tokens:${userId}`
    const tokens = await this.cache.get<string[]>(tokensKey) || []
    
    if (!tokens.includes(token)) {
      tokens.push(token)
      await this.cache.set(tokensKey, tokens, 3600)
      
      // In production, also store in database
      logger.info('FCM token registered', { userId, token: token.substring(0, 10) + '...' })
    }
  }
  
  async unregisterFCMToken(userId: string, token: string): Promise<void> {
    const tokensKey = `fcm-tokens:${userId}`
    const tokens = await this.cache.get<string[]>(tokensKey) || []
    
    const filtered = tokens.filter(t => t !== token)
    if (filtered.length !== tokens.length) {
      await this.cache.set(tokensKey, filtered, 3600)
      
      // In production, also remove from database
      logger.info('FCM token unregistered', { userId, token: token.substring(0, 10) + '...' })
    }
  }
  
  private async getUserFCMTokens(userId: string): Promise<string[]> {
    // In production, fetch from database
    // For now, return empty array
    return []
  }
  
  private async removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
    const tokensKey = `fcm-tokens:${userId}`
    const tokens = await this.cache.get<string[]>(tokensKey) || []
    
    const validTokens = tokens.filter(t => !invalidTokens.includes(t))
    await this.cache.set(tokensKey, validTokens, 3600)
    
    logger.info('Removed invalid FCM tokens', { 
      userId, 
      removedCount: invalidTokens.length 
    })
  }
  
  // Topic management
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic)
      
      if (response.failureCount > 0) {
        logger.warn('Some topic subscriptions failed', {
          topic,
          successCount: response.successCount,
          failureCount: response.failureCount
        })
      }
      
      await this.metrics.recordSuccess('SubscribeToTopic', { topic })
    } catch (error: any) {
      logger.error('Topic subscription failed', { error, topic })
      await this.metrics.recordError('SubscribeToTopic', error)
      throw error
    }
  }
  
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic)
      
      if (response.failureCount > 0) {
        logger.warn('Some topic unsubscriptions failed', {
          topic,
          successCount: response.successCount,
          failureCount: response.failureCount
        })
      }
      
      await this.metrics.recordSuccess('UnsubscribeFromTopic', { topic })
    } catch (error: any) {
      logger.error('Topic unsubscription failed', { error, topic })
      await this.metrics.recordError('UnsubscribeFromTopic', error)
      throw error
    }
  }
  
  async sendToTopic(topic: string, notification: PushNotification): Promise<{ id: string }> {
    const messageId = uuidv4()
    
    const message: Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.icon
      },
      data: notification.data || {}
    }
    
    try {
      await this.messaging.send(message)
      
      await this.metrics.recordSuccess('SendToTopic', { topic })
      
      return { id: messageId }
    } catch (error: any) {
      logger.error('Send to topic failed', { error, topic })
      await this.metrics.recordError('SendToTopic', error)
      throw error
    }
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    const details: any = {
      cache: await this.cache.healthCheck(),
      circuitBreaker: this.circuitBreaker.status,
      metrics: this.metrics.getSummary()
    }
    
    // Check email transport
    if (this.emailTransporter) {
      try {
        await this.emailTransporter.verify()
        details.email = { status: 'connected' }
      } catch (error) {
        details.email = { 
          status: 'disconnected', 
          error: error instanceof Error ? error.message : 'Unknown' 
        }
      }
    } else {
      details.email = { status: 'not configured' }
    }
    
    // FCM is always available with Firebase Admin
    details.fcm = { status: 'ready' }
    
    return {
      status: 'healthy',
      details
    }
  }
}