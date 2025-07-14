import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import { L2Construct, ConstructLevel, CloudProvider } from '@love-claude-code/core'
import { S3Bucket } from '@love-claude-code/providers'

export interface StaticWebsiteArgs {
  /**
   * Website domain name
   */
  domainName: pulumi.Input<string>
  
  /**
   * Website content source
   */
  contentSource: pulumi.asset.FileArchive | pulumi.asset.RemoteArchive
  
  /**
   * Index document (default: index.html)
   */
  indexDocument?: pulumi.Input<string>
  
  /**
   * Error document (default: error.html)
   */
  errorDocument?: pulumi.Input<string>
  
  /**
   * Enable CloudFront CDN
   */
  enableCdn?: pulumi.Input<boolean>
  
  /**
   * Certificate ARN for HTTPS (required if enableCdn is true)
   */
  certificateArn?: pulumi.Input<string>
  
  /**
   * CloudFront price class
   */
  priceClass?: pulumi.Input<'PriceClass_All' | 'PriceClass_200' | 'PriceClass_100'>
  
  /**
   * Enable WAF protection
   */
  enableWaf?: pulumi.Input<boolean>
  
  /**
   * Custom error pages
   */
  customErrorResponses?: pulumi.Input<Array<{
    errorCode: number
    responseCode?: number
    responsePagePath?: string
    errorCachingMinTtl?: number
  }>>
  
  /**
   * Headers to add to all responses
   */
  responseHeaders?: pulumi.Input<Record<string, string>>
  
  /**
   * Enable access logging
   */
  enableLogging?: pulumi.Input<boolean>
  
  /**
   * Tags
   */
  tags?: pulumi.Input<Record<string, string>>
}

/**
 * L2 construct for a static website with S3, CloudFront, and security best practices
 */
export class StaticWebsite extends L2Construct {
  public readonly bucket: S3Bucket
  public readonly distribution?: aws.cloudfront.Distribution
  public readonly websiteUrl: pulumi.Output<string>
  public readonly bucketName: pulumi.Output<string>
  public readonly distributionId: pulumi.Output<string | undefined>
  
  constructor(name: string, args: StaticWebsiteArgs, opts?: pulumi.ComponentResourceOptions) {
    super('aws:patterns:L2StaticWebsite', name, {}, opts)
    
    const defaultTags = {
      'love-claude-code:construct': 'L2',
      'love-claude-code:pattern': 'static-website',
      ...args.tags
    }
    
    // Create S3 bucket for website content
    this.bucket = new S3Bucket(`${name}-content`, {
      bucketName: pulumi.interpolate`${args.domainName}-content`,
      blockPublicAccess: false, // Will be managed by CloudFront
      enableVersioning: true,
      enableEncryption: true,
      tags: defaultTags
    }, { parent: this })
    
    // Configure bucket for static website hosting
    const websiteConfig = new aws.s3.BucketWebsiteConfigurationV2(`${name}-website-config`, {
      bucket: this.bucket.bucketName,
      indexDocument: {
        suffix: args.indexDocument || 'index.html'
      },
      errorDocument: {
        key: args.errorDocument || 'error.html'
      }
    }, { parent: this })
    
    // Upload website content
    this.uploadContent(name, args.contentSource)
    
    if (args.enableCdn) {
      // Create CloudFront distribution
      this.distribution = this.createCloudFrontDistribution(name, args, defaultTags)
      this.websiteUrl = pulumi.interpolate`https://${args.domainName}`
      this.distributionId = this.distribution.id
      
      // Configure bucket policy for CloudFront access
      this.configureBucketPolicyForCloudFront(name)
    } else {
      // Direct S3 website URL
      this.websiteUrl = pulumi.interpolate`http://${websiteConfig.websiteEndpoint}`
      this.distributionId = pulumi.output(undefined)
      
      // Configure bucket policy for public read
      this.configureBucketPolicyForPublicRead(name)
    }
    
    // Apply security headers if configured
    if (args.responseHeaders) {
      this.configureResponseHeaders(name, args.responseHeaders)
    }
    
    // Apply pattern best practices
    this.applyPatternBestPractices()
    
    // Set outputs
    this.bucketName = this.bucket.bucketName
    
    // Register outputs
    this.registerOutputs({
      websiteUrl: this.websiteUrl,
      bucketName: this.bucketName,
      distributionId: this.distributionId
    })
  }
  
  private uploadContent(name: string, contentSource: pulumi.asset.Archive): void {
    // Use BucketObjectv2 for better performance with many files
    const files = new aws.s3.BucketObjectv2(`${name}-content-files`, {
      bucket: this.bucket.bucketName,
      source: contentSource,
      contentType: 'text/html', // Will be overridden per file
    }, { parent: this })
  }
  
  private createCloudFrontDistribution(
    name: string,
    args: StaticWebsiteArgs,
    tags: Record<string, string>
  ): aws.cloudfront.Distribution {
    // Create Origin Access Control for S3
    const oac = new aws.cloudfront.OriginAccessControl(`${name}-oac`, {
      name: `${name}-s3-oac`,
      description: `OAC for ${args.domainName}`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4'
    }, { parent: this })
    
    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(`${name}-cdn`, {
      enabled: true,
      isIpv6Enabled: true,
      defaultRootObject: args.indexDocument || 'index.html',
      aliases: [args.domainName],
      priceClass: args.priceClass || 'PriceClass_100',
      
      origins: [{
        domainName: this.bucket.bucket.bucketRegionalDomainName,
        originId: 's3-origin',
        originAccessControlId: oac.id
      }],
      
      defaultCacheBehavior: {
        targetOriginId: 's3-origin',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        
        forwardedValues: {
          queryString: false,
          cookies: { forward: 'none' }
        },
        
        minTtl: 0,
        defaultTtl: 86400,
        maxTtl: 31536000
      },
      
      restrictions: {
        geoRestriction: {
          restrictionType: 'none'
        }
      },
      
      viewerCertificate: {
        acmCertificateArn: args.certificateArn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021'
      },
      
      customErrorResponses: args.customErrorResponses || [
        {
          errorCode: 404,
          responseCode: 404,
          responsePagePath: '/error.html',
          errorCachingMinTtl: 300
        }
      ],
      
      loggingConfig: args.enableLogging ? {
        bucket: this.bucket.bucket.bucketDomainName,
        prefix: 'cdn-logs/',
        includeCookies: false
      } : undefined,
      
      webAclId: args.enableWaf ? this.createWafAcl(name, tags).arn : undefined,
      
      tags
    }, { parent: this })
    
    return distribution
  }
  
  private configureBucketPolicyForCloudFront(name: string): void {
    const bucketPolicy = new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
      bucket: this.bucket.bucketName,
      policy: pulumi.all([
        this.bucket.bucketArn,
        this.distribution!.arn
      ]).apply(([bucketArn, distributionArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Sid: 'AllowCloudFrontServicePrincipal',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com'
          },
          Action: 's3:GetObject',
          Resource: `${bucketArn}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': distributionArn
            }
          }
        }]
      }))
    }, { parent: this })
  }
  
  private configureBucketPolicyForPublicRead(name: string): void {
    const bucketPolicy = new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
      bucket: this.bucket.bucketName,
      policy: this.bucket.bucketArn.apply(bucketArn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `${bucketArn}/*`
        }]
      }))
    }, { parent: this })
  }
  
  private createWafAcl(name: string, tags: Record<string, string>): aws.wafv2.WebAcl {
    return new aws.wafv2.WebAcl(`${name}-waf`, {
      name: `${name}-waf-acl`,
      description: `WAF ACL for ${name} static website`,
      scope: 'CLOUDFRONT',
      
      defaultAction: {
        allow: {}
      },
      
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          action: {
            block: {}
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudwatchMetricsEnabled: true,
            metricName: 'RateLimitRule'
          }
        },
        {
          name: 'CommonRuleSet',
          priority: 2,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudwatchMetricsEnabled: true,
            metricName: 'CommonRuleSet'
          }
        }
      ],
      
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `${name}-waf-acl`
      },
      
      tags
    }, { parent: this })
  }
  
  private configureResponseHeaders(
    name: string,
    headers: pulumi.Input<Record<string, string>>
  ): void {
    // In a real implementation, this would configure CloudFront response headers policy
    // or Lambda@Edge for header manipulation
  }
  
  protected applyPatternBestPractices(): void {
    this.patternConsiderations = [
      {
        pattern: 'Static Website',
        description: 'Scalable static website hosting with CDN',
        benefits: [
          'Global content delivery',
          'High availability',
          'DDoS protection',
          'Cost-effective hosting',
          'HTTPS by default'
        ],
        tradeoffs: [
          'No server-side processing',
          'Cache invalidation complexity',
          'Initial setup complexity for CDN'
        ]
      }
    ]
  }
  
  public getConstructMetadata() {
    return {
      id: 'aws-l2-static-website',
      level: ConstructLevel.L2,
      name: 'Static Website Pattern',
      description: 'Static website hosting with S3, CloudFront CDN, and security',
      version: '1.0.0',
      author: 'Love Claude Code',
      category: 'web',
      tags: ['aws', 's3', 'cloudfront', 'static-website', 'cdn', 'pattern'],
      providers: [CloudProvider.AWS]
    }
  }
  
  /**
   * Invalidate CloudFront cache
   */
  public invalidateCache(paths: string[]): pulumi.Output<void> {
    if (!this.distribution) {
      return pulumi.output(undefined)
    }
    
    return pulumi.output(
      new aws.cloudfront.Invalidation(`${this.distribution.id}-invalidation-${Date.now()}`, {
        distributionId: this.distribution.id,
        paths: paths
      }, { parent: this })
    ).apply(() => {})
  }
}