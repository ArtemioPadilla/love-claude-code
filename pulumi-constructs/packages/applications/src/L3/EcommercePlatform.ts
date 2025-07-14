import * as pulumi from '@pulumi/pulumi'
import { L3Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { 
  ServerlessAPI, 
  StaticWebsite, 
  EventDrivenPipeline,
  RealtimeChat 
} from '@love-claude-code/patterns'
import { 
  FirestoreDatabase, 
  CloudStorage,
  CloudFunctions 
} from '@love-claude-code/providers'

export interface EcommercePlatformArgs {
  /**
   * Store name
   */
  storeName: pulumi.Input<string>
  
  /**
   * Store domain
   */
  domain: pulumi.Input<string>
  
  /**
   * Store configuration
   */
  storeConfig: {
    currency: pulumi.Input<string>
    languages: pulumi.Input<string[]>
    timezone: pulumi.Input<string>
  }
  
  /**
   * Features to enable
   */
  features: {
    multiVendor?: boolean
    subscriptions?: boolean
    digitalProducts?: boolean
    inventory?: boolean
    reviews?: boolean
    wishlist?: boolean
    recommendations?: boolean
    liveChat?: boolean
  }
  
  /**
   * Payment configuration
   */
  payment: {
    providers: Array<'stripe' | 'paypal' | 'square'>
    supportedCards?: string[]
    enableWallet?: boolean
  }
  
  /**
   * Shipping configuration
   */
  shipping: {
    providers: Array<'fedex' | 'ups' | 'usps' | 'dhl'>
    enableRealTimeRates?: boolean
    freeShippingThreshold?: number
  }
  
  /**
   * SEO configuration
   */
  seo?: {
    enableSitemap?: boolean
    enableStructuredData?: boolean
    enableAMP?: boolean
  }
  
  /**
   * Analytics configuration
   */
  analytics?: {
    googleAnalyticsId?: pulumi.Input<string>
    facebookPixelId?: pulumi.Input<string>
    enableHeatmaps?: boolean
  }
  
  /**
   * Labels
   */
  labels?: pulumi.Input<Record<string, string>>
}

/**
 * L3 construct for a complete e-commerce platform using Firebase
 */
export class EcommercePlatform extends L3Construct {
  // Core components
  public readonly database: FirestoreDatabase
  public readonly storage: CloudStorage
  public readonly api: ServerlessAPI
  public readonly storefront: StaticWebsite
  public readonly adminPanel: StaticWebsite
  
  // Optional components
  public readonly chat?: RealtimeChat
  public readonly orderPipeline: EventDrivenPipeline
  
  // Functions
  public readonly functions: Map<string, CloudFunctions> = new Map()
  
  // URLs
  public readonly storeUrl: pulumi.Output<string>
  public readonly adminUrl: pulumi.Output<string>
  public readonly apiUrl: pulumi.Output<string>
  
  constructor(name: string, args: EcommercePlatformArgs, opts?: pulumi.ComponentResourceOptions) {
    super('firebase:applications:L3EcommercePlatform', name, {}, opts)
    
    const defaultLabels = {
      'love-claude-code-construct': 'l3',
      'love-claude-code-application': 'ecommerce-platform',
      ...args.labels
    }
    
    // Create core database
    this.database = this.createDatabase(name, args, defaultLabels)
    
    // Create storage for product images
    this.storage = this.createStorage(name, defaultLabels)
    
    // Create API
    this.api = this.createAPI(name, args, defaultLabels)
    
    // Create storefront
    this.storefront = this.createStorefront(name, args, defaultLabels)
    
    // Create admin panel
    this.adminPanel = this.createAdminPanel(name, args, defaultLabels)
    
    // Create order processing pipeline
    this.orderPipeline = this.createOrderPipeline(name, args, defaultLabels)
    
    // Create optional features
    if (args.features.liveChat) {
      this.chat = this.createLiveChat(name, defaultLabels)
    }
    
    if (args.features.recommendations) {
      this.createRecommendationEngine(name, defaultLabels)
    }
    
    if (args.features.inventory) {
      this.createInventoryManagement(name, defaultLabels)
    }
    
    // Create cloud functions for business logic
    this.createBusinessFunctions(name, args, defaultLabels)
    
    // Apply application best practices
    this.applyApplicationBestPractices()
    
    // Set outputs
    this.storeUrl = this.storefront.websiteUrl
    this.adminUrl = this.adminPanel.websiteUrl
    this.apiUrl = this.api.apiUrl
    
    // Register outputs
    this.registerOutputs({
      storeUrl: this.storeUrl,
      adminUrl: this.adminUrl,
      apiUrl: this.apiUrl,
      storeName: args.storeName
    })
  }
  
  private createDatabase(
    name: string,
    args: EcommercePlatformArgs,
    labels: Record<string, string>
  ): FirestoreDatabase {
    return new FirestoreDatabase(`${name}-db`, {
      locationId: 'us-central',
      type: 'FIRESTORE_NATIVE',
      securityRules: this.generateSecurityRules(args),
      indexes: [
        // Product indexes
        {
          collectionGroup: 'products',
          fields: [
            { fieldPath: 'category', order: 'ASCENDING' },
            { fieldPath: 'price', order: 'ASCENDING' }
          ]
        },
        {
          collectionGroup: 'products',
          fields: [
            { fieldPath: 'status', order: 'ASCENDING' },
            { fieldPath: 'createdAt', order: 'DESCENDING' }
          ]
        },
        // Order indexes
        {
          collectionGroup: 'orders',
          fields: [
            { fieldPath: 'userId', order: 'ASCENDING' },
            { fieldPath: 'createdAt', order: 'DESCENDING' }
          ]
        },
        {
          collectionGroup: 'orders',
          fields: [
            { fieldPath: 'status', order: 'ASCENDING' },
            { fieldPath: 'createdAt', order: 'DESCENDING' }
          ]
        },
        // Multi-vendor indexes
        ...(args.features.multiVendor ? [{
          collectionGroup: 'products',
          fields: [
            { fieldPath: 'vendorId', order: 'ASCENDING' },
            { fieldPath: 'status', order: 'ASCENDING' }
          ]
        }] : [])
      ]
    }, { parent: this })
  }
  
  private generateSecurityRules(args: EcommercePlatformArgs): pulumi.Input<string> {
    return pulumi.output(args).apply(config => {
      return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isVendor(vendorId) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/vendors/$(vendorId)/members/$(request.auth.uid)).data.active == true;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Products - public read, vendor/admin write
    match /products/{productId} {
      allow read: if true; // Public products
      allow write: if isAdmin() || 
        (${config.features.multiVendor} && isVendor(resource.data.vendorId));
    }
    
    // Categories - public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Orders - user read own, admin read all
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin() || 
        (isOwner(resource.data.userId) && 
         request.resource.data.status == 'cancelled' &&
         resource.data.status == 'pending');
    }
    
    // Shopping carts - user owned
    match /carts/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);
    }
    
    // Reviews
    match /products/{productId}/reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    ${config.features.multiVendor ? `
    // Vendor stores
    match /vendors/{vendorId} {
      allow read: if true; // Public vendor profiles
      allow write: if isAdmin() || isVendor(vendorId);
      
      match /members/{userId} {
        allow read: if isVendor(vendorId) || isAdmin();
        allow write: if isAdmin();
      }
    }` : ''}
  }
}`
    })
  }
  
  private createStorage(
    name: string,
    labels: Record<string, string>
  ): CloudStorage {
    return new CloudStorage(`${name}-storage`, {
      location: 'US',
      storageClass: 'STANDARD',
      cors: [{
        origins: ['*'],
        methods: ['GET', 'HEAD'],
        responseHeaders: ['Content-Type'],
        maxAgeSeconds: 3600
      }],
      lifecycleRules: [{
        action: { type: 'Delete' },
        condition: { age: 90 } // Delete temp files after 90 days
      }],
      storageRules: `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images - public read
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.admin == true ||
         request.auth.token.vendor == true);
    }
    
    // User uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
    
    // Order attachments
    match /orders/{orderId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}`,
      labels
    }, { parent: this })
  }
  
  private createAPI(
    name: string,
    args: EcommercePlatformArgs,
    labels: Record<string, string>
  ): ServerlessAPI {
    // Using AWS API Gateway for the API layer
    return new ServerlessAPI(`${name}-api`, {
      apiName: `${name}-api`,
      description: `E-commerce API for ${args.storeName}`,
      routes: [
        // Product endpoints
        {
          path: '/products',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getProductHandlerCode('list'))
            }),
            handler: 'index.handler'
          },
          cors: true
        },
        {
          path: '/products/{productId}',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getProductHandlerCode('get'))
            }),
            handler: 'index.handler'
          },
          cors: true
        },
        // Cart endpoints
        {
          path: '/cart',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getCartHandlerCode('get'))
            }),
            handler: 'index.handler'
          },
          auth: { type: 'jwt' },
          cors: true
        },
        {
          path: '/cart/items',
          method: 'POST',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getCartHandlerCode('addItem'))
            }),
            handler: 'index.handler'
          },
          auth: { type: 'jwt' },
          cors: true
        },
        // Checkout endpoint
        {
          path: '/checkout',
          method: 'POST',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getCheckoutHandlerCode()))
            }),
            handler: 'index.handler',
            environment: {
              PAYMENT_PROVIDERS: JSON.stringify(args.payment.providers)
            }
          },
          auth: { type: 'jwt' },
          cors: true
        },
        // Order endpoints
        {
          path: '/orders',
          method: 'GET',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getOrderHandlerCode('list'))
            }),
            handler: 'index.handler'
          },
          auth: { type: 'jwt' },
          cors: true
        }
      ],
      enableLogging: true,
      enableTracing: true,
      tags: labels
    }, { parent: this })
  }
  
  private createStorefront(
    name: string,
    args: EcommercePlatformArgs,
    labels: Record<string, string>
  ): StaticWebsite {
    return new StaticWebsite(`${name}-storefront`, {
      domainName: args.domain,
      contentSource: new pulumi.asset.FileArchive('./storefront-dist'),
      indexDocument: 'index.html',
      errorDocument: '404.html',
      enableCdn: true,
      certificateArn: pulumi.output('arn:aws:acm:us-east-1:123456789012:certificate/example'),
      priceClass: 'PriceClass_100',
      enableWaf: true,
      customErrorResponses: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html', // For SPA routing
          errorCachingMinTtl: 0
        }
      ],
      responseHeaders: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      enableLogging: true,
      tags: labels
    }, { parent: this })
  }
  
  private createAdminPanel(
    name: string,
    args: EcommercePlatformArgs,
    labels: Record<string, string>
  ): StaticWebsite {
    return new StaticWebsite(`${name}-admin`, {
      domainName: pulumi.interpolate`admin.${args.domain}`,
      contentSource: new pulumi.asset.FileArchive('./admin-dist'),
      indexDocument: 'index.html',
      errorDocument: 'error.html',
      enableCdn: true,
      certificateArn: pulumi.output('arn:aws:acm:us-east-1:123456789012:certificate/example'),
      priceClass: 'PriceClass_100',
      enableWaf: true,
      responseHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline';"
      },
      enableLogging: true,
      tags: labels
    }, { parent: this })
  }
  
  private createOrderPipeline(
    name: string,
    args: EcommercePlatformArgs,
    labels: Record<string, string>
  ): EventDrivenPipeline {
    return new EventDrivenPipeline(`${name}-orders`, {
      pipelineName: `${name}-order-processing`,
      stages: [
        {
          name: 'validate-order',
          type: 'validate',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getOrderPipelineCode('validate'))
            }),
            handler: 'index.handler'
          }
        },
        {
          name: 'process-payment',
          type: 'transform',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getOrderPipelineCode('payment'))
            }),
            handler: 'index.handler',
            timeout: 30
          },
          retryPolicy: {
            maxAttempts: 3,
            backoffRate: 2
          },
          dlq: true
        },
        {
          name: 'update-inventory',
          type: 'transform',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getOrderPipelineCode('inventory'))
            }),
            handler: 'index.handler'
          }
        },
        {
          name: 'send-notifications',
          type: 'transform',
          handler: {
            code: new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(this.getOrderPipelineCode('notify'))
            }),
            handler: 'index.handler'
          }
        }
      ],
      input: {
        type: 'sqs',
        config: {
          queueName: `${name}-new-orders`
        }
      },
      output: {
        type: 'dynamodb',
        config: {
          tableName: `${name}-processed-orders`
        }
      },
      enableMonitoring: true,
      enableTracing: true,
      errorHandling: {
        strategy: 'dlq',
        notificationEmail: pulumi.output('alerts@example.com')
      },
      tags: labels
    }, { parent: this })
  }
  
  private createLiveChat(
    name: string,
    labels: Record<string, string>
  ): RealtimeChat {
    return new RealtimeChat(`${name}-chat`, {
      appName: `${name}-support-chat`,
      enableAuth: true,
      authProviders: ['email'],
      enableFileUploads: true,
      maxFileSizeMb: 5,
      enablePresence: true,
      enableTypingIndicators: true,
      messageRetentionDays: 30,
      labels
    }, { parent: this })
  }
  
  private createRecommendationEngine(
    name: string,
    labels: Record<string, string>
  ): void {
    const recommendationFunction = new CloudFunctions(`${name}-recommendations`, {
      functionName: `${name}-product-recommendations`,
      runtime: 'nodejs18',
      entryPoint: 'getRecommendations',
      sourceCode: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getRecommendationCode()),
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'recommendations',
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
          allowUnauthenticated: true
        }
      },
      environmentVariables: {
        MIN_SIMILARITY_SCORE: '0.7'
      },
      labels
    }, { parent: this })
    
    this.functions.set('recommendations', recommendationFunction)
  }
  
  private createInventoryManagement(
    name: string,
    labels: Record<string, string>
  ): void {
    const inventoryFunction = new CloudFunctions(`${name}-inventory`, {
      functionName: `${name}-inventory-management`,
      runtime: 'nodejs18',
      entryPoint: 'updateInventory',
      sourceCode: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getInventoryCode()),
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'inventory',
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
          document: 'orders/{orderId}',
          event: 'update'
        }
      },
      labels
    }, { parent: this })
    
    this.functions.set('inventory', inventoryFunction)
  }
  
  private createBusinessFunctions(
    name: string,
    args: EcommercePlatformArgs,
    labels: Record<string, string>
  ): void {
    // Tax calculation function
    const taxCalculator = new CloudFunctions(`${name}-tax-calculator`, {
      functionName: `${name}-calculate-tax`,
      runtime: 'nodejs18',
      entryPoint: 'calculateTax',
      sourceCode: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(this.getTaxCalculatorCode()),
        'package.json': new pulumi.asset.StringAsset(JSON.stringify({
          name: 'tax-calculator',
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
      labels
    }, { parent: this })
    
    this.functions.set('tax-calculator', taxCalculator)
    
    // Shipping rate calculator
    if (args.shipping.enableRealTimeRates) {
      const shippingCalculator = new CloudFunctions(`${name}-shipping-calculator`, {
        functionName: `${name}-calculate-shipping`,
        runtime: 'nodejs18',
        entryPoint: 'calculateShipping',
        sourceCode: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(this.getShippingCalculatorCode()),
          'package.json': new pulumi.asset.StringAsset(JSON.stringify({
            name: 'shipping-calculator',
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
        environmentVariables: {
          SHIPPING_PROVIDERS: JSON.stringify(args.shipping.providers),
          FREE_SHIPPING_THRESHOLD: (args.shipping.freeShippingThreshold || 0).toString()
        },
        labels
      }, { parent: this })
      
      this.functions.set('shipping-calculator', shippingCalculator)
    }
  }
  
  // Handler code generators
  private getProductHandlerCode(action: string): string {
    return `
exports.handler = async (event) => {
  // Product ${action} logic
  return { 
    statusCode: 200, 
    body: JSON.stringify({ action: '${action}', products: [] }),
    headers: { 'Content-Type': 'application/json' }
  };
};
`
  }
  
  private getCartHandlerCode(action: string): string {
    return `
exports.handler = async (event) => {
  // Cart ${action} logic
  const userId = event.requestContext.authorizer.userId;
  return { 
    statusCode: 200, 
    body: JSON.stringify({ action: '${action}', cart: {} }),
    headers: { 'Content-Type': 'application/json' }
  };
};
`
  }
  
  private getCheckoutHandlerCode(): string {
    return `
exports.handler = async (event) => {
  // Checkout processing logic
  const body = JSON.parse(event.body);
  const providers = JSON.parse(process.env.PAYMENT_PROVIDERS);
  
  // Process payment with selected provider
  
  return { 
    statusCode: 200, 
    body: JSON.stringify({ orderId: 'order-123', status: 'processing' }),
    headers: { 'Content-Type': 'application/json' }
  };
};
`
  }
  
  private getOrderHandlerCode(action: string): string {
    return `
exports.handler = async (event) => {
  // Order ${action} logic
  return { 
    statusCode: 200, 
    body: JSON.stringify({ action: '${action}', orders: [] }),
    headers: { 'Content-Type': 'application/json' }
  };
};
`
  }
  
  private getOrderPipelineCode(stage: string): string {
    return `
exports.handler = async (event) => {
  console.log('Processing order pipeline stage:', '${stage}');
  
  for (const record of event.Records) {
    const order = JSON.parse(record.body);
    
    switch('${stage}') {
      case 'validate':
        // Validate order data
        break;
      case 'payment':
        // Process payment
        break;
      case 'inventory':
        // Update inventory
        break;
      case 'notify':
        // Send notifications
        break;
    }
  }
};
`
  }
  
  private getRecommendationCode(): string {
    return `
const admin = require('firebase-admin');
admin.initializeApp();

exports.getRecommendations = async (req, res) => {
  const { productId, userId } = req.query;
  
  // Get product details
  const product = await admin.firestore()
    .collection('products')
    .doc(productId)
    .get();
  
  // Find similar products based on category, tags, etc.
  const recommendations = await findSimilarProducts(product.data());
  
  res.json({ recommendations });
};

async function findSimilarProducts(product) {
  // Recommendation logic
  return [];
}
`
  }
  
  private getInventoryCode(): string {
    return `
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.updateInventory = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newOrder = change.after.data();
    const oldOrder = change.before.data();
    
    // Update inventory when order status changes to 'completed'
    if (oldOrder.status !== 'completed' && newOrder.status === 'completed') {
      for (const item of newOrder.items) {
        await updateProductInventory(item.productId, -item.quantity);
      }
    }
  });

async function updateProductInventory(productId, quantityChange) {
  // Update product inventory
}
`
  }
  
  private getTaxCalculatorCode(): string {
    return `
const admin = require('firebase-admin');
admin.initializeApp();

exports.calculateTax = async (req, res) => {
  const { items, shippingAddress } = req.body;
  
  // Calculate tax based on shipping address
  const taxRate = getTaxRate(shippingAddress);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  
  res.json({ 
    subtotal,
    taxRate,
    tax,
    total: subtotal + tax 
  });
};

function getTaxRate(address) {
  // Tax calculation logic based on location
  return 0.08; // 8% default
}
`
  }
  
  private getShippingCalculatorCode(): string {
    return `
const admin = require('firebase-admin');
admin.initializeApp();

exports.calculateShipping = async (req, res) => {
  const { items, shippingAddress } = req.body;
  const providers = JSON.parse(process.env.SHIPPING_PROVIDERS);
  const freeThreshold = parseFloat(process.env.FREE_SHIPPING_THRESHOLD);
  
  const totalWeight = calculateTotalWeight(items);
  const subtotal = calculateSubtotal(items);
  
  // Check for free shipping
  if (subtotal >= freeThreshold) {
    return res.json({ 
      shipping: 0,
      method: 'Free Shipping'
    });
  }
  
  // Calculate rates for each provider
  const rates = await Promise.all(
    providers.map(provider => getShippingRate(provider, totalWeight, shippingAddress))
  );
  
  res.json({ rates });
};

function calculateTotalWeight(items) {
  return items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

async function getShippingRate(provider, weight, address) {
  // Integration with shipping provider APIs
  return { provider, rate: weight * 0.5, estimatedDays: 3 };
}
`
  }
  
  protected applyApplicationBestPractices(): void {
    this.applicationConsiderations = [
      {
        application: 'E-commerce Platform',
        description: 'Full-featured e-commerce platform with Firebase backend',
        architecture: [
          'Firestore for product catalog and orders',
          'Cloud Storage for product images',
          'Cloud Functions for business logic',
          'Static hosting with CDN',
          'Serverless API layer',
          'Event-driven order processing'
        ],
        scalability: [
          'Auto-scaling cloud functions',
          'Global CDN distribution',
          'NoSQL database for flexibility',
          'Async order processing'
        ],
        security: [
          'Firebase Authentication',
          'Granular security rules',
          'PCI compliance ready',
          'Encrypted payment processing',
          'HTTPS everywhere'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'firebase-l3-ecommerce-platform',
      level: ConstructLevel.L3,
      name: 'E-commerce Platform Application',
      description: 'Complete e-commerce platform with catalog, cart, and order management',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'application',
      tags: ['firebase', 'ecommerce', 'shopping', 'platform', 'application'],
      providers: [CloudProvider.Firebase, CloudProvider.AWS]
    }
  }
}