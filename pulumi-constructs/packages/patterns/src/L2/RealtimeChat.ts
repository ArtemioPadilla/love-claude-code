import * as pulumi from '@pulumi/pulumi'
import * as gcp from '@pulumi/gcp'
import { L2Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { FirestoreDatabase, CloudFunctions, CloudStorage } from '@love-claude-code/providers'

export interface RealtimeChatArgs {
  /**
   * Application name
   */
  appName: pulumi.Input<string>
  
  /**
   * Enable user authentication
   */
  enableAuth?: pulumi.Input<boolean>
  
  /**
   * Authentication providers
   */
  authProviders?: pulumi.Input<Array<'google' | 'github' | 'email'>>
  
  /**
   * Enable file uploads
   */
  enableFileUploads?: pulumi.Input<boolean>
  
  /**
   * Maximum file size in MB
   */
  maxFileSizeMb?: pulumi.Input<number>
  
  /**
   * Enable message encryption
   */
  enableEncryption?: pulumi.Input<boolean>
  
  /**
   * Enable presence tracking
   */
  enablePresence?: pulumi.Input<boolean>
  
  /**
   * Enable typing indicators
   */
  enableTypingIndicators?: pulumi.Input<boolean>
  
  /**
   * Enable push notifications
   */
  enablePushNotifications?: pulumi.Input<boolean>
  
  /**
   * Message retention days
   */
  messageRetentionDays?: pulumi.Input<number>
  
  /**
   * Custom domain for hosting
   */
  customDomain?: pulumi.Input<string>
  
  /**
   * Labels
   */
  labels?: pulumi.Input<Record<string, string>>
}

/**
 * L2 construct for a realtime chat application using Firebase
 */
export class RealtimeChat extends L2Construct {
  public readonly database: FirestoreDatabase
  public readonly storage?: CloudStorage
  public readonly functions: Map<string, CloudFunctions> = new Map()
  public readonly appUrl: pulumi.Output<string>
  
  constructor(name: string, args: RealtimeChatArgs, opts?: pulumi.ComponentResourceOptions) {
    super('firebase:patterns:L2RealtimeChat', name, {}, opts)
    
    const defaultLabels = {
      'love-claude-code-construct': 'l2',
      'love-claude-code-pattern': 'realtime-chat',
      ...args.labels
    }
    
    // Create Firestore database with optimized structure for chat
    this.database = new FirestoreDatabase(`${name}-db`, {
      locationId: 'us-central',
      type: 'FIRESTORE_NATIVE',
      securityRules: this.generateSecurityRules(args),
      indexes: [
        {
          collectionGroup: 'messages',
          fields: [
            { fieldPath: 'channelId', order: 'ASCENDING' },
            { fieldPath: 'timestamp', order: 'DESCENDING' }
          ],
          queryScope: 'COLLECTION'
        },
        {
          collectionGroup: 'messages',
          fields: [
            { fieldPath: 'userId', order: 'ASCENDING' },
            { fieldPath: 'timestamp', order: 'DESCENDING' }
          ],
          queryScope: 'COLLECTION_GROUP'
        }
      ]
    }, { parent: this })
    
    // Create storage bucket for file uploads if enabled
    if (args.enableFileUploads) {
      this.storage = new CloudStorage(`${name}-storage`, {
        location: 'US',
        storageClass: 'STANDARD',
        enableVersioning: false,
        lifecycleRules: [{
          action: { type: 'Delete' },
          condition: { age: args.messageRetentionDays || 90 }
        }],
        storageRules: this.generateStorageRules(args),
        labels: defaultLabels
      }, { parent: this })
    }
    
    // Create cloud functions for chat features
    this.createChatFunctions(name, args, defaultLabels)
    
    // Create hosting configuration
    const hosting = this.createHostingConfiguration(name, args, defaultLabels)
    
    // Apply pattern best practices
    this.applyPatternBestPractices()
    
    // Set outputs
    this.appUrl = args.customDomain ? 
      pulumi.output(`https://${args.customDomain}`) :
      hosting.defaultUrl
    
    // Register outputs
    this.registerOutputs({
      appUrl: this.appUrl,
      databaseName: this.database.databaseName,
      functions: Array.from(this.functions.keys())
    })
  }
  
  private generateSecurityRules(args: RealtimeChatArgs): pulumi.Input<string> {
    return pulumi.output(args).apply(config => {
      const rules = [`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return ${config.enableAuth ? 'request.auth != null' : 'true'};
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function validMessage() {
      return request.resource.data.keys().hasAll(['text', 'userId', 'timestamp']) &&
             request.resource.data.text is string &&
             request.resource.data.text.size() > 0 &&
             request.resource.data.text.size() <= 1000 &&
             request.resource.data.timestamp == request.time;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Channels collection
    match /channels/{channelId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        request.auth.uid in resource.data.members;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() &&
          request.auth.uid in get(/databases/$(database)/documents/channels/$(channelId)).data.members;
        allow create: if isAuthenticated() &&
          request.auth.uid in get(/databases/$(database)/documents/channels/$(channelId)).data.members &&
          validMessage();
        allow update: if isAuthenticated() &&
          isOwner(resource.data.userId) &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['edited', 'editedAt']);
        allow delete: if isAuthenticated() &&
          isOwner(resource.data.userId);
      }
    }`]
      
      if (config.enablePresence) {
        rules.push(`
    // Presence collection
    match /presence/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId);
    }`)
      }
      
      if (config.enableTypingIndicators) {
        rules.push(`
    // Typing indicators
    match /typing/{channelId}/users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId);
    }`)
      }
      
      rules.push(`
  }
}`)
      
      return rules.join('\n')
    })
  }
  
  private generateStorageRules(args: RealtimeChatArgs): pulumi.Input<string> {
    return pulumi.output(args).apply(config => {
      const maxSize = config.maxFileSizeMb || 10
      
      return `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return ${config.enableAuth ? 'request.auth != null' : 'true'};
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidFile() {
      return request.resource.size < ${maxSize} * 1024 * 1024 &&
             request.resource.contentType.matches('image/.*|video/.*|application/pdf');
    }
    
    // User uploads
    match /uploads/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId) && isValidFile();
      allow delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Channel files
    match /channels/{channelId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidFile();
    }
  }
}`
    })
  }
  
  private createChatFunctions(
    name: string,
    args: RealtimeChatArgs,
    labels: Record<string, string>
  ): void {
    // Message processing function
    const messageProcessor = new CloudFunctions(`${name}-message-processor`, {
      functionName: `${name}-process-messages`,
      runtime: 'nodejs18',
      entryPoint: 'processMessage',
      sourceCode: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getMessageProcessorCode(args)),
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'message-processor',
          version: '1.0.0',
          dependencies: {
            'firebase-admin': '^11.0.0',
            'firebase-functions': '^4.0.0'
          }
        }))
      }),
      trigger: {
        type: 'firestore',
        config: {
          document: 'channels/{channelId}/messages/{messageId}',
          event: 'create'
        }
      },
      environmentVariables: {
        ENABLE_ENCRYPTION: args.enableEncryption ? 'true' : 'false',
        ENABLE_PUSH_NOTIFICATIONS: args.enablePushNotifications ? 'true' : 'false'
      },
      labels
    }, { parent: this })
    
    this.functions.set('message-processor', messageProcessor)
    
    // Presence tracking function if enabled
    if (args.enablePresence) {
      const presenceTracker = new CloudFunctions(`${name}-presence-tracker`, {
        functionName: `${name}-track-presence`,
        runtime: 'nodejs18',
        entryPoint: 'trackPresence',
        sourceCode: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(this.getPresenceTrackerCode()),
          'package.json': new pulumi.asset.StringAsset(JSON.stringify({
            name: 'presence-tracker',
            version: '1.0.0',
            dependencies: {
              'firebase-admin': '^11.0.0',
              'firebase-functions': '^4.0.0'
            }
          }))
        }),
        trigger: {
          type: 'https',
          config: {
            allowUnauthenticated: false
          }
        },
        timeout: 540,
        labels
      }, { parent: this })
      
      this.functions.set('presence-tracker', presenceTracker)
    }
    
    // Cleanup function for old messages
    const messageCleanup = new CloudFunctions(`${name}-message-cleanup`, {
      functionName: `${name}-cleanup-messages`,
      runtime: 'nodejs18',
      entryPoint: 'cleanupOldMessages',
      sourceCode: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getCleanupCode(args)),
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'message-cleanup',
          version: '1.0.0',
          dependencies: {
            'firebase-admin': '^11.0.0',
            'firebase-functions': '^4.0.0'
          }
        }))
      }),
      trigger: {
        type: 'pubsub',
        config: {
          topic: 'cleanup-schedule',
          schedule: '0 2 * * *' // Daily at 2 AM
        }
      },
      environmentVariables: {
        RETENTION_DAYS: (args.messageRetentionDays || 90).toString()
      },
      timeout: 540,
      labels
    }, { parent: this })
    
    this.functions.set('message-cleanup', messageCleanup)
  }
  
  private getMessageProcessorCode(args: RealtimeChatArgs): string {
    return `
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.processMessage = functions.firestore
  .document('channels/{channelId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { channelId, messageId } = context.params;
    
    // Process message (e.g., filter profanity, extract mentions)
    const processed = await processMessageContent(message);
    
    // Update message if needed
    if (processed.modified) {
      await snap.ref.update(processed.data);
    }
    
    // Send push notifications if enabled
    if (process.env.ENABLE_PUSH_NOTIFICATIONS === 'true') {
      await sendPushNotifications(channelId, message);
    }
    
    // Update channel last message
    await admin.firestore()
      .collection('channels')
      .doc(channelId)
      .update({
        lastMessage: message.text.substring(0, 100),
        lastMessageTime: message.timestamp,
        lastMessageBy: message.userId
      });
  });

async function processMessageContent(message) {
  // Message processing logic
  return { modified: false, data: message };
}

async function sendPushNotifications(channelId, message) {
  // Push notification logic
}
`
  }
  
  private getPresenceTrackerCode(): string {
    return `
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.trackPresence = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const status = data.status || 'online';
  
  await admin.firestore()
    .collection('presence')
    .doc(userId)
    .set({
      status,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      userId
    });
  
  return { success: true };
});
`
  }
  
  private getCleanupCode(args: RealtimeChatArgs): string {
    return `
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.cleanupOldMessages = functions.pubsub
  .schedule('0 2 * * *')
  .onRun(async (context) => {
    const retentionDays = parseInt(process.env.RETENTION_DAYS || '90');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const batch = admin.firestore().batch();
    let deletedCount = 0;
    
    // Query old messages
    const snapshot = await admin.firestore()
      .collectionGroup('messages')
      .where('timestamp', '<', cutoffDate)
      .limit(500)
      .get();
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(\`Deleted \${deletedCount} old messages\`);
    }
    
    return null;
  });
`
  }
  
  private createHostingConfiguration(
    name: string,
    args: RealtimeChatArgs,
    labels: Record<string, string>
  ): any {
    // In a real implementation, this would configure Firebase Hosting
    // For now, return a mock hosting configuration
    return {
      defaultUrl: pulumi.output(`https://${name}.web.app`)
    }
  }
  
  protected applyPatternBestPractices(): void {
    this.patternConsiderations = [
      {
        pattern: 'Realtime Chat',
        description: 'Scalable realtime chat application with Firebase',
        benefits: [
          'Real-time message synchronization',
          'Offline support',
          'Automatic scaling',
          'Built-in authentication',
          'File upload support',
          'Push notifications'
        ],
        tradeoffs: [
          'Vendor lock-in to Firebase',
          'Limited query capabilities',
          'Cost can scale with usage',
          'Complex security rules'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'firebase-l2-realtime-chat',
      level: ConstructLevel.L2,
      name: 'Realtime Chat Pattern',
      description: 'Complete realtime chat application with Firebase',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'communication',
      tags: ['firebase', 'chat', 'realtime', 'firestore', 'pattern'],
      providers: [CloudProvider.Firebase]
    }
  }
}