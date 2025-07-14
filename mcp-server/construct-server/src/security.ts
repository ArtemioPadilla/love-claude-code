import {
  ConstructDefinition,
  ConstructComposition,
  CloudProvider,
  SecurityRecommendation,
  SecurityConsideration
} from './types.js'

/**
 * Analyzes security aspects of constructs and compositions
 */
export class SecurityAnalyzer {
  private readonly securityFrameworks = {
    'well-architected': {
      name: 'AWS Well-Architected Framework',
      pillars: ['security', 'reliability', 'performance', 'cost', 'operational']
    },
    'cis': {
      name: 'CIS Controls',
      version: '8.0'
    },
    'nist': {
      name: 'NIST Cybersecurity Framework',
      functions: ['identify', 'protect', 'detect', 'respond', 'recover']
    },
    'owasp': {
      name: 'OWASP Top 10',
      version: '2021'
    }
  }
  
  /**
   * Analyze security for a single construct
   */
  analyzeConstruct(
    construct: ConstructDefinition,
    provider: CloudProvider
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = []
    
    // Check existing security considerations
    construct.security?.forEach(consideration => {
      if (!consideration.mitigation) {
        recommendations.push({
          construct: construct.id,
          type: consideration.type,
          severity: consideration.severity,
          description: consideration.description,
          recommendation: this.generateMitigation(consideration, provider),
          references: this.getSecurityReferences(consideration.type)
        })
      }
    })
    
    // Provider-specific checks
    this.addProviderSpecificRecommendations(construct, provider, recommendations)
    
    // General security checks
    this.addGeneralRecommendations(construct, recommendations)
    
    // Compliance checks
    this.addComplianceRecommendations(construct, provider, recommendations)
    
    return recommendations
  }
  
  /**
   * Analyze security for a composition
   */
  analyzeComposition(
    composition: ConstructComposition,
    provider: CloudProvider,
    catalog: Map<string, ConstructDefinition>
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = []
    
    // Analyze each construct
    composition.constructs.forEach(construct => {
      const definition = catalog.get(construct.constructId)
      if (!definition) return
      
      const constructRecs = this.analyzeConstruct(definition, provider)
      recommendations.push(...constructRecs)
    })
    
    // Composition-level security checks
    this.addCompositionRecommendations(composition, catalog, provider, recommendations)
    
    // Network segmentation
    this.checkNetworkSegmentation(composition, catalog, recommendations)
    
    // Data flow security
    this.checkDataFlowSecurity(composition, catalog, recommendations)
    
    // Remove duplicates and prioritize
    return this.prioritizeRecommendations(recommendations)
  }
  
  /**
   * Generate mitigation for security consideration
   */
  private generateMitigation(
    consideration: SecurityConsideration,
    provider: CloudProvider
  ): string {
    const mitigations: Record<string, Record<CloudProvider, string>> = {
      'encryption': {
        [CloudProvider.AWS]: 'Enable encryption using AWS KMS for data at rest and TLS 1.2+ for data in transit',
        [CloudProvider.Firebase]: 'Enable Firestore encryption and use HTTPS for all client connections',
        [CloudProvider.Azure]: 'Use Azure Key Vault for key management and enable encryption on all storage',
        [CloudProvider.GCP]: 'Use Cloud KMS for encryption keys and enable encryption by default',
        [CloudProvider.Local]: 'Implement AES-256 encryption for sensitive data and use TLS for connections'
      },
      'access-control': {
        [CloudProvider.AWS]: 'Implement least-privilege IAM policies and use AWS Organizations for account management',
        [CloudProvider.Firebase]: 'Configure Firebase Security Rules and use Firebase Auth for user management',
        [CloudProvider.Azure]: 'Use Azure AD for identity management and implement RBAC policies',
        [CloudProvider.GCP]: 'Use Cloud IAM for access control and implement the principle of least privilege',
        [CloudProvider.Local]: 'Implement JWT-based authentication and role-based access control'
      },
      'network': {
        [CloudProvider.AWS]: 'Use VPCs with private subnets, Security Groups, and NACLs for network isolation',
        [CloudProvider.Firebase]: 'Use Firebase App Check and configure allowed domains in Firebase Console',
        [CloudProvider.Azure]: 'Implement Azure Virtual Networks with NSGs and Azure Firewall',
        [CloudProvider.GCP]: 'Use VPC with firewall rules and Cloud Armor for DDoS protection',
        [CloudProvider.Local]: 'Implement network segmentation and use a reverse proxy with rate limiting'
      },
      'compliance': {
        [CloudProvider.AWS]: 'Use AWS Config and Security Hub for compliance monitoring',
        [CloudProvider.Firebase]: 'Enable audit logging and review Firebase compliance certifications',
        [CloudProvider.Azure]: 'Use Azure Policy and Compliance Manager for regulatory compliance',
        [CloudProvider.GCP]: 'Use Cloud Security Command Center and review GCP compliance offerings',
        [CloudProvider.Local]: 'Implement audit logging and conduct regular security assessments'
      }
    }
    
    return mitigations[consideration.type]?.[provider] || 
           'Implement industry best practices for ' + consideration.type
  }
  
  /**
   * Add provider-specific recommendations
   */
  private addProviderSpecificRecommendations(
    construct: ConstructDefinition,
    provider: CloudProvider,
    recommendations: SecurityRecommendation[]
  ): void {
    switch (provider) {
      case CloudProvider.AWS:
        // Check for AWS-specific security features
        if (construct.metadata.category === 'storage') {
          recommendations.push({
            construct: construct.id,
            type: 'S3 Bucket Security',
            severity: 'high',
            description: 'Ensure S3 buckets are not publicly accessible',
            recommendation: 'Enable S3 Block Public Access, use bucket policies, and enable versioning',
            references: ['https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html']
          })
        }
        break
        
      case CloudProvider.Firebase:
        // Check for Firebase-specific security
        if (construct.metadata.category === 'database') {
          recommendations.push({
            construct: construct.id,
            type: 'Firestore Security Rules',
            severity: 'high',
            description: 'Implement comprehensive Firestore security rules',
            recommendation: 'Define granular security rules based on user authentication and data validation',
            references: ['https://firebase.google.com/docs/firestore/security/get-started']
          })
        }
        break
        
      case CloudProvider.Azure:
        // Check for Azure-specific security
        if (construct.metadata.category === 'api') {
          recommendations.push({
            construct: construct.id,
            type: 'API Management Security',
            severity: 'medium',
            description: 'Secure APIs with Azure API Management',
            recommendation: 'Use Azure API Management for rate limiting, authentication, and monitoring',
            references: ['https://docs.microsoft.com/en-us/azure/api-management/api-management-security-policies']
          })
        }
        break
    }
  }
  
  /**
   * Add general security recommendations
   */
  private addGeneralRecommendations(
    construct: ConstructDefinition,
    recommendations: SecurityRecommendation[]
  ): void {
    // Check for logging and monitoring
    if (!construct.metadata.tags.includes('monitoring') && 
        !construct.metadata.tags.includes('logging')) {
      recommendations.push({
        construct: construct.id,
        type: 'Observability',
        severity: 'medium',
        description: 'No logging or monitoring configuration detected',
        recommendation: 'Implement comprehensive logging and monitoring for security events',
        references: ['https://www.cisecurity.org/controls/']
      })
    }
    
    // Check for backup and recovery
    if (construct.metadata.category === 'database' || 
        construct.metadata.category === 'storage') {
      recommendations.push({
        construct: construct.id,
        type: 'Backup and Recovery',
        severity: 'medium',
        description: 'Ensure data backup and recovery procedures',
        recommendation: 'Implement automated backups with encryption and test recovery procedures',
        references: ['https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-34r1.pdf']
      })
    }
  }
  
  /**
   * Add compliance recommendations
   */
  private addComplianceRecommendations(
    construct: ConstructDefinition,
    provider: CloudProvider,
    recommendations: SecurityRecommendation[]
  ): void {
    // Data residency
    if (construct.metadata.tags.includes('pii') || 
        construct.metadata.tags.includes('sensitive')) {
      recommendations.push({
        construct: construct.id,
        type: 'Data Residency',
        severity: 'high',
        description: 'Ensure compliance with data residency requirements',
        recommendation: 'Configure resources in compliant regions and enable data residency controls',
        references: ['https://gdpr.eu/', 'https://www.hhs.gov/hipaa/']
      })
    }
  }
  
  /**
   * Add composition-level recommendations
   */
  private addCompositionRecommendations(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    provider: CloudProvider,
    recommendations: SecurityRecommendation[]
  ): void {
    // Check for defense in depth
    const hasMultipleLayers = composition.constructs.some(c => {
      const def = catalog.get(c.constructId)
      return def?.metadata.tags.includes('security')
    })
    
    if (!hasMultipleLayers) {
      recommendations.push({
        type: 'Defense in Depth',
        severity: 'high',
        description: 'Implement multiple layers of security controls',
        recommendation: 'Add security constructs at different layers (network, application, data)',
        references: ['https://www.nist.gov/']
      })
    }
  }
  
  /**
   * Check network segmentation
   */
  private checkNetworkSegmentation(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    recommendations: SecurityRecommendation[]
  ): void {
    const publicConstructs = composition.constructs.filter(c => {
      const def = catalog.get(c.constructId)
      return def?.metadata.tags.includes('public') || 
             def?.metadata.tags.includes('internet-facing')
    })
    
    const privateConstructs = composition.constructs.filter(c => {
      const def = catalog.get(c.constructId)
      return def?.metadata.tags.includes('private') || 
             def?.metadata.category === 'database'
    })
    
    if (publicConstructs.length > 0 && privateConstructs.length > 0) {
      recommendations.push({
        type: 'Network Segmentation',
        severity: 'high',
        description: 'Ensure proper network isolation between public and private resources',
        recommendation: 'Implement network segmentation using VPCs, subnets, and security groups',
        references: ['https://www.cisecurity.org/controls/']
      })
    }
  }
  
  /**
   * Check data flow security
   */
  private checkDataFlowSecurity(
    composition: ConstructComposition,
    catalog: Map<string, ConstructDefinition>,
    recommendations: SecurityRecommendation[]
  ): void {
    // Check for unencrypted connections
    composition.constructs.forEach(construct => {
      construct.connections?.forEach(conn => {
        if (conn.type === 'sync' && !conn.config?.encrypted) {
          recommendations.push({
            type: 'Data in Transit',
            severity: 'high',
            description: `Unencrypted connection from ${construct.instanceName} to ${conn.targetInstance}`,
            recommendation: 'Enable TLS/SSL encryption for all data in transit',
            references: ['https://www.owasp.org/']
          })
        }
      })
    })
  }
  
  /**
   * Get security references
   */
  private getSecurityReferences(type: string): string[] {
    const references: Record<string, string[]> = {
      'encryption': [
        'https://www.nist.gov/publications/nist-special-publication-800-57-part-1-revision-5',
        'https://owasp.org/www-project-proactive-controls/'
      ],
      'access-control': [
        'https://www.cisecurity.org/controls/',
        'https://owasp.org/www-project-top-ten/'
      ],
      'network': [
        'https://www.sans.org/reading-room/whitepapers/firewalls/',
        'https://www.cisecurity.org/controls/'
      ],
      'compliance': [
        'https://www.iso.org/isoiec-27001-information-security.html',
        'https://www.pcisecuritystandards.org/'
      ]
    }
    
    return references[type] || []
  }
  
  /**
   * Prioritize recommendations
   */
  private prioritizeRecommendations(
    recommendations: SecurityRecommendation[]
  ): SecurityRecommendation[] {
    // Remove duplicates
    const unique = new Map<string, SecurityRecommendation>()
    recommendations.forEach(rec => {
      const key = `${rec.type}-${rec.description}`
      if (!unique.has(key) || 
          this.getSeverityScore(rec.severity) > this.getSeverityScore(unique.get(key)!.severity)) {
        unique.set(key, rec)
      }
    })
    
    // Sort by severity
    return Array.from(unique.values()).sort((a, b) => 
      this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
    )
  }
  
  /**
   * Get severity score
   */
  private getSeverityScore(severity: SecurityRecommendation['severity']): number {
    const scores = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    }
    return scores[severity]
  }
}