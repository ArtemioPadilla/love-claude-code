import { ConstructLevel, ConstructMetadata } from '../base/types';

/**
 * Tagging utilities for consistent resource tagging
 */

/**
 * Standard tags applied to all resources
 */
export interface StandardTags {
  'lcc:managed-by': string;
  'lcc:construct-level': ConstructLevel;
  'lcc:construct-name': string;
  'lcc:construct-version': string;
  'lcc:environment'?: string;
  'lcc:project'?: string;
  'lcc:owner'?: string;
  'lcc:cost-center'?: string;
  'lcc:created-at': string;
  'lcc:created-by'?: string;
}

/**
 * Create standard tags for a construct
 */
export function createStandardTags(
  metadata: Partial<ConstructMetadata>,
  constructName: string,
  additionalTags?: Record<string, string>
): StandardTags {
  const now = new Date().toISOString();
  
  return {
    'lcc:managed-by': 'love-claude-code',
    'lcc:construct-level': metadata.level || ConstructLevel.L1,
    'lcc:construct-name': constructName,
    'lcc:construct-version': metadata.version || '0.1.0',
    'lcc:created-at': now,
    ...additionalTags
  };
}

/**
 * Merge tags with precedence
 */
export function mergeTags(
  ...tagSets: (Record<string, string> | undefined)[]
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const tags of tagSets) {
    if (tags) {
      Object.assign(result, tags);
    }
  }
  
  return result;
}

/**
 * Filter sensitive tags
 */
export function filterSensitiveTags(
  tags: Record<string, string>,
  sensitiveKeys: string[] = ['secret', 'password', 'key', 'token']
): Record<string, string> {
  const filtered: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(tags)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => 
      lowerKey.includes(sensitive)
    );
    
    if (!isSensitive) {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * Validate tag compliance
 */
export function validateTags(
  tags: Record<string, string>,
  requiredTags: string[] = []
): { valid: boolean; missing: string[] } {
  const missing = requiredTags.filter(tag => !tags[tag]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Create cost allocation tags
 */
export function createCostAllocationTags(
  costCenter: string,
  project: string,
  environment: string,
  owner?: string
): Record<string, string> {
  return {
    'lcc:cost-center': costCenter,
    'lcc:project': project,
    'lcc:environment': environment,
    ...(owner && { 'lcc:owner': owner })
  };
}

/**
 * Create environment-specific tags
 */
export function createEnvironmentTags(
  environment: 'development' | 'staging' | 'production',
  additionalTags?: Record<string, string>
): Record<string, string> {
  const envTags: Record<string, string> = {
    'lcc:environment': environment,
    'lcc:is-production': String(environment === 'production')
  };
  
  // Add environment-specific tags
  switch (environment) {
    case 'development':
      envTags['lcc:auto-shutdown'] = 'true';
      envTags['lcc:cost-optimization'] = 'aggressive';
      break;
    case 'staging':
      envTags['lcc:auto-shutdown'] = 'false';
      envTags['lcc:cost-optimization'] = 'moderate';
      break;
    case 'production':
      envTags['lcc:auto-shutdown'] = 'false';
      envTags['lcc:cost-optimization'] = 'none';
      envTags['lcc:backup-required'] = 'true';
      envTags['lcc:monitoring-required'] = 'true';
      break;
  }
  
  return mergeTags(envTags, additionalTags);
}

/**
 * Create compliance tags
 */
export function createComplianceTags(
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted',
  regulations: string[] = []
): Record<string, string> {
  return {
    'lcc:data-classification': dataClassification,
    'lcc:encryption-required': String(
      dataClassification === 'confidential' || dataClassification === 'restricted'
    ),
    ...(regulations.length > 0 && {
      'lcc:compliance-regulations': regulations.join(',')
    })
  };
}

/**
 * Tag key sanitizer for providers with restrictions
 */
export function sanitizeTagKey(key: string, provider?: string): string {
  let sanitized = key;
  
  // Common restrictions
  sanitized = sanitized.replace(/[^a-zA-Z0-9:_.-]/g, '-');
  
  // Provider-specific restrictions
  switch (provider) {
    case 'aws':
      // AWS allows up to 128 characters for keys
      if (sanitized.length > 128) {
        sanitized = sanitized.substring(0, 128);
      }
      break;
    case 'gcp':
      // GCP requires lowercase
      sanitized = sanitized.toLowerCase();
      // GCP allows up to 63 characters
      if (sanitized.length > 63) {
        sanitized = sanitized.substring(0, 63);
      }
      break;
    case 'azure':
      // Azure allows up to 512 characters
      if (sanitized.length > 512) {
        sanitized = sanitized.substring(0, 512);
      }
      break;
  }
  
  return sanitized;
}

/**
 * Tag value sanitizer
 */
export function sanitizeTagValue(value: string, provider?: string): string {
  let sanitized = value;
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Provider-specific restrictions
  switch (provider) {
    case 'aws':
      // AWS allows up to 256 characters for values
      if (sanitized.length > 256) {
        sanitized = sanitized.substring(0, 256);
      }
      break;
    case 'gcp':
      // GCP allows up to 63 characters
      if (sanitized.length > 63) {
        sanitized = sanitized.substring(0, 63);
      }
      break;
    case 'azure':
      // Azure allows up to 256 characters
      if (sanitized.length > 256) {
        sanitized = sanitized.substring(0, 256);
      }
      break;
  }
  
  return sanitized;
}