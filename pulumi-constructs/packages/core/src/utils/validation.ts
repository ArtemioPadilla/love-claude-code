import { ConstructInput } from '../base/types';

/**
 * Validation utilities for construct inputs
 */

/**
 * Validate required fields
 */
export function validateRequired(args: any, required: string[]): void {
  const missing = required.filter(field => !args[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate input against schema
 */
export function validateInput(value: any, input: ConstructInput): void {
  // Check required
  if (input.required && (value === undefined || value === null)) {
    throw new Error(`Input '${input.name}' is required`);
  }
  
  // Skip validation if not required and no value
  if (!input.required && (value === undefined || value === null)) {
    return;
  }
  
  // Type validation (basic)
  const actualType = typeof value;
  const expectedType = input.type.toLowerCase();
  
  if (expectedType !== 'any' && actualType !== expectedType) {
    throw new Error(`Input '${input.name}' expected type '${input.type}' but got '${actualType}'`);
  }
  
  // Validation rules
  if (input.validation) {
    const { pattern, min, max, enum: enumValues } = input.validation;
    
    // Pattern matching
    if (pattern && typeof value === 'string') {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        throw new Error(`Input '${input.name}' does not match pattern: ${pattern}`);
      }
    }
    
    // Min/max validation
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        throw new Error(`Input '${input.name}' must be at least ${min}`);
      }
      if (max !== undefined && value > max) {
        throw new Error(`Input '${input.name}' must be at most ${max}`);
      }
    }
    
    if (typeof value === 'string') {
      if (min !== undefined && value.length < min) {
        throw new Error(`Input '${input.name}' must be at least ${min} characters`);
      }
      if (max !== undefined && value.length > max) {
        throw new Error(`Input '${input.name}' must be at most ${max} characters`);
      }
    }
    
    // Enum validation
    if (enumValues && enumValues.length > 0) {
      if (!enumValues.includes(value)) {
        throw new Error(`Input '${input.name}' must be one of: ${enumValues.join(', ')}`);
      }
    }
  }
}

/**
 * Validate all inputs against schema
 */
export function validateInputs(args: any, inputs: ConstructInput[]): void {
  for (const input of inputs) {
    const value = args[input.name];
    validateInput(value, input);
  }
}

/**
 * Validate resource name
 */
export function validateResourceName(name: string): void {
  if (!name || name.length === 0) {
    throw new Error('Resource name cannot be empty');
  }
  
  if (name.length > 63) {
    throw new Error('Resource name cannot exceed 63 characters');
  }
  
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
    throw new Error('Resource name must start and end with alphanumeric characters and can only contain lowercase letters, numbers, and hyphens');
  }
}

/**
 * Validate CIDR block
 */
export function validateCIDR(cidr: string): void {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) {
    throw new Error(`Invalid CIDR format: ${cidr}`);
  }
  
  const [ip, prefix] = cidr.split('/');
  const parts = ip.split('.');
  
  // Validate IP parts
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) {
      throw new Error(`Invalid IP address in CIDR: ${cidr}`);
    }
  }
  
  // Validate prefix
  const prefixNum = parseInt(prefix, 10);
  if (prefixNum < 0 || prefixNum > 32) {
    throw new Error(`Invalid prefix length in CIDR: ${cidr}`);
  }
}

/**
 * Validate port number
 */
export function validatePort(port: number): void {
  if (!Number.isInteger(port)) {
    throw new Error('Port must be an integer');
  }
  
  if (port < 1 || port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }
}

/**
 * Validate URL
 */
export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Validate semantic version
 */
export function validateSemver(version: string): void {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
  if (!semverRegex.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
}