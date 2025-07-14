import { CostEstimate } from '../base/types';

/**
 * Cost calculation utilities
 */

/**
 * Cost calculation periods
 */
export enum CostPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * Convert cost between periods
 */
export function convertCostPeriod(
  amount: number,
  from: CostPeriod,
  to: CostPeriod
): number {
  // Convert to hourly first
  let hourly = amount;
  switch (from) {
    case CostPeriod.HOURLY:
      break;
    case CostPeriod.DAILY:
      hourly = amount / 24;
      break;
    case CostPeriod.MONTHLY:
      hourly = amount / (24 * 30);
      break;
    case CostPeriod.YEARLY:
      hourly = amount / (24 * 365);
      break;
  }
  
  // Convert from hourly to target
  switch (to) {
    case CostPeriod.HOURLY:
      return hourly;
    case CostPeriod.DAILY:
      return hourly * 24;
    case CostPeriod.MONTHLY:
      return hourly * 24 * 30;
    case CostPeriod.YEARLY:
      return hourly * 24 * 365;
  }
}

/**
 * Calculate total cost from estimate
 */
export function calculateTotalCost(
  estimate: CostEstimate,
  usage?: Record<string, number>
): number {
  let total = estimate.baseMonthly;
  
  if (usage) {
    estimate.usageFactors.forEach(factor => {
      const used = usage[factor.name] || factor.typicalUsage || 0;
      total += used * factor.costPerUnit;
    });
  }
  
  return total;
}

/**
 * Format cost for display
 */
export function formatCost(
  amount: number,
  currency: string = 'USD',
  period?: CostPeriod
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  if (period) {
    return `${formatted} per ${period}`;
  }
  
  return formatted;
}

/**
 * Aggregate multiple cost estimates
 */
export function aggregateCosts(estimates: CostEstimate[]): CostEstimate {
  const aggregated: CostEstimate = {
    baseMonthly: 0,
    usageFactors: [],
    notes: []
  };
  
  // Sum base costs
  aggregated.baseMonthly = estimates.reduce(
    (sum, est) => sum + est.baseMonthly,
    0
  );
  
  // Aggregate usage factors
  const factorMap = new Map<string, any>();
  estimates.forEach(est => {
    est.usageFactors.forEach(factor => {
      if (factorMap.has(factor.name)) {
        const existing = factorMap.get(factor.name);
        // For same factors, use the highest cost per unit (conservative estimate)
        if (factor.costPerUnit > existing.costPerUnit) {
          existing.costPerUnit = factor.costPerUnit;
        }
        // Sum typical usage
        existing.typicalUsage = (existing.typicalUsage || 0) + (factor.typicalUsage || 0);
      } else {
        factorMap.set(factor.name, { ...factor });
      }
    });
  });
  
  aggregated.usageFactors = Array.from(factorMap.values());
  
  // Combine notes
  estimates.forEach(est => {
    if (est.notes) {
      aggregated.notes!.push(...est.notes);
    }
  });
  
  // Remove duplicate notes
  aggregated.notes = [...new Set(aggregated.notes)];
  
  return aggregated;
}

/**
 * Common cloud service cost factors
 */
export const CommonCostFactors = {
  // Storage
  STORAGE_GB_MONTH: 'storage-gb-month',
  STORAGE_REQUESTS: 'storage-requests',
  STORAGE_EGRESS_GB: 'storage-egress-gb',
  
  // Compute
  COMPUTE_HOURS: 'compute-hours',
  COMPUTE_REQUESTS: 'compute-requests',
  COMPUTE_GB_SECONDS: 'compute-gb-seconds',
  
  // Database
  DB_STORAGE_GB: 'db-storage-gb',
  DB_READ_UNITS: 'db-read-units',
  DB_WRITE_UNITS: 'db-write-units',
  DB_BACKUP_GB: 'db-backup-gb',
  
  // Network
  DATA_TRANSFER_GB: 'data-transfer-gb',
  LOAD_BALANCER_HOURS: 'lb-hours',
  NAT_GATEWAY_HOURS: 'nat-hours',
  
  // API
  API_REQUESTS: 'api-requests',
  API_CACHE_GB: 'api-cache-gb',
  
  // Monitoring
  LOGS_GB: 'logs-gb',
  METRICS_COUNT: 'metrics-count',
  TRACES_COUNT: 'traces-count'
};

/**
 * Provider-specific cost calculators
 */
export class AWSCostCalculator {
  static calculateLambdaCost(
    requests: number,
    avgDurationMs: number,
    memoryMB: number
  ): number {
    const requestCost = requests * 0.0000002; // $0.20 per 1M requests
    const gbSeconds = (requests * avgDurationMs * memoryMB) / (1000 * 1024);
    const computeCost = gbSeconds * 0.0000166667; // $0.0000166667 per GB-second
    
    return requestCost + computeCost;
  }
  
  static calculateS3Cost(
    storageGB: number,
    requests: number,
    egressGB: number
  ): number {
    const storageCost = storageGB * 0.023; // $0.023 per GB (Standard)
    const requestCost = requests * 0.0004 / 1000; // $0.0004 per 1,000 PUT requests
    const egressCost = Math.max(0, egressGB - 1) * 0.09; // $0.09 per GB (after 1GB free)
    
    return storageCost + requestCost + egressCost;
  }
  
  static calculateDynamoDBCost(
    storageGB: number,
    readUnits: number,
    writeUnits: number
  ): number {
    const storageCost = storageGB * 0.25; // $0.25 per GB
    const readCost = readUnits * 0.00013 * 24 * 30; // $0.00013 per RCU per hour
    const writeCost = writeUnits * 0.00065 * 24 * 30; // $0.00065 per WCU per hour
    
    return storageCost + readCost + writeCost;
  }
}

/**
 * Create a cost breakdown report
 */
export function createCostBreakdown(
  estimate: CostEstimate,
  usage?: Record<string, number>
): {
  total: number;
  breakdown: Array<{ item: string; cost: number; percentage: number }>;
} {
  const breakdown: Array<{ item: string; cost: number; percentage: number }> = [];
  
  // Add base cost
  breakdown.push({
    item: 'Base Infrastructure',
    cost: estimate.baseMonthly,
    percentage: 0 // Calculate later
  });
  
  // Add usage-based costs
  let usageTotal = 0;
  estimate.usageFactors.forEach(factor => {
    const used = usage?.[factor.name] || factor.typicalUsage || 0;
    const cost = used * factor.costPerUnit;
    usageTotal += cost;
    
    if (cost > 0) {
      breakdown.push({
        item: `${factor.name} (${used} ${factor.unit})`,
        cost,
        percentage: 0
      });
    }
  });
  
  const total = estimate.baseMonthly + usageTotal;
  
  // Calculate percentages
  breakdown.forEach(item => {
    item.percentage = (item.cost / total) * 100;
  });
  
  // Sort by cost descending
  breakdown.sort((a, b) => b.cost - a.cost);
  
  return { total, breakdown };
}