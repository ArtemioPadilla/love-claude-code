import { PreviewResult } from '@pulumi/pulumi/automation';
import { ConstructDefinition } from '../packages/core/src/base/types';

/**
 * Preview change types
 */
export enum ChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REPLACE = 'replace',
  SAME = 'same'
}

/**
 * Resource change summary
 */
export interface ResourceChange {
  /** Resource URN */
  urn: string;
  /** Resource type */
  type: string;
  /** Resource name */
  name: string;
  /** Change type */
  changeType: ChangeType;
  /** Properties that will change */
  changes?: string[];
  /** Whether resource will be replaced */
  replace?: boolean;
  /** Reason for replacement */
  replaceReasons?: string[];
}

/**
 * Preview summary
 */
export interface PreviewSummary {
  /** Total resources */
  total: number;
  /** Resources to create */
  create: number;
  /** Resources to update */
  update: number;
  /** Resources to delete */
  delete: number;
  /** Resources to replace */
  replace: number;
  /** Resources that won't change */
  same: number;
  /** Detailed changes */
  changes: ResourceChange[];
  /** Estimated cost impact */
  costImpact?: {
    current: number;
    projected: number;
    difference: number;
  };
}

/**
 * Preview engine for analyzing deployment changes
 */
export class PreviewEngine {
  /**
   * Analyze preview result and create summary
   */
  analyzePreview(previewResult: PreviewResult): PreviewSummary {
    const summary: PreviewSummary = {
      total: 0,
      create: 0,
      update: 0,
      delete: 0,
      replace: 0,
      same: 0,
      changes: []
    };
    
    // Parse stdout to extract resource changes
    const changes = this.parsePreviewOutput(previewResult.stdout);
    
    // Count change types
    changes.forEach(change => {
      summary.total++;
      switch (change.changeType) {
        case ChangeType.CREATE:
          summary.create++;
          break;
        case ChangeType.UPDATE:
          summary.update++;
          break;
        case ChangeType.DELETE:
          summary.delete++;
          break;
        case ChangeType.REPLACE:
          summary.replace++;
          break;
        case ChangeType.SAME:
          summary.same++;
          break;
      }
    });
    
    summary.changes = changes;
    
    // Estimate cost impact if possible
    const costImpact = this.estimateCostImpact(changes);
    if (costImpact) {
      summary.costImpact = costImpact;
    }
    
    return summary;
  }
  
  /**
   * Generate human-readable preview report
   */
  generatePreviewReport(summary: PreviewSummary, construct: ConstructDefinition): string {
    const lines: string[] = [];
    
    lines.push(`# Deployment Preview: ${construct.name}`);
    lines.push('');
    lines.push(`## Summary`);
    lines.push(`- Total resources: ${summary.total}`);
    lines.push(`- To create: ${summary.create}`);
    lines.push(`- To update: ${summary.update}`);
    lines.push(`- To delete: ${summary.delete}`);
    lines.push(`- To replace: ${summary.replace}`);
    lines.push(`- Unchanged: ${summary.same}`);
    lines.push('');
    
    if (summary.costImpact) {
      lines.push(`## Cost Impact`);
      lines.push(`- Current: $${summary.costImpact.current.toFixed(2)}/month`);
      lines.push(`- Projected: $${summary.costImpact.projected.toFixed(2)}/month`);
      lines.push(`- Change: ${summary.costImpact.difference >= 0 ? '+' : ''}$${summary.costImpact.difference.toFixed(2)}/month`);
      lines.push('');
    }
    
    if (summary.create > 0) {
      lines.push(`## Resources to Create`);
      summary.changes
        .filter(c => c.changeType === ChangeType.CREATE)
        .forEach(change => {
          lines.push(`- ${change.type}: ${change.name}`);
        });
      lines.push('');
    }
    
    if (summary.update > 0) {
      lines.push(`## Resources to Update`);
      summary.changes
        .filter(c => c.changeType === ChangeType.UPDATE)
        .forEach(change => {
          lines.push(`- ${change.type}: ${change.name}`);
          if (change.changes && change.changes.length > 0) {
            change.changes.forEach(prop => {
              lines.push(`  - ${prop}`);
            });
          }
        });
      lines.push('');
    }
    
    if (summary.replace > 0) {
      lines.push(`## Resources to Replace`);
      summary.changes
        .filter(c => c.changeType === ChangeType.REPLACE)
        .forEach(change => {
          lines.push(`- ${change.type}: ${change.name}`);
          if (change.replaceReasons && change.replaceReasons.length > 0) {
            lines.push(`  Reasons:`);
            change.replaceReasons.forEach(reason => {
              lines.push(`  - ${reason}`);
            });
          }
        });
      lines.push('');
    }
    
    if (summary.delete > 0) {
      lines.push(`## Resources to Delete`);
      summary.changes
        .filter(c => c.changeType === ChangeType.DELETE)
        .forEach(change => {
          lines.push(`- ${change.type}: ${change.name}`);
        });
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Check if preview contains breaking changes
   */
  hasBreakingChanges(summary: PreviewSummary): boolean {
    // Deletes and replaces are typically breaking
    return summary.delete > 0 || summary.replace > 0;
  }
  
  /**
   * Get risk assessment for the preview
   */
  assessRisk(summary: PreviewSummary): {
    level: 'low' | 'medium' | 'high';
    reasons: string[];
    recommendations: string[];
  } {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';
    
    // Assess based on change types
    if (summary.delete > 0) {
      level = 'high';
      reasons.push(`${summary.delete} resources will be deleted`);
      recommendations.push('Ensure you have backups of any data that will be lost');
    }
    
    if (summary.replace > 0) {
      level = level === 'low' ? 'medium' : level;
      reasons.push(`${summary.replace} resources will be replaced`);
      recommendations.push('Review replaced resources for potential downtime');
    }
    
    // Check for database or storage changes
    const criticalTypes = ['Database', 'Table', 'Bucket', 'Storage'];
    const criticalChanges = summary.changes.filter(change => 
      criticalTypes.some(type => change.type.includes(type)) &&
      (change.changeType === ChangeType.DELETE || change.changeType === ChangeType.REPLACE)
    );
    
    if (criticalChanges.length > 0) {
      level = 'high';
      reasons.push('Critical data resources will be modified');
      recommendations.push('Create backups before proceeding');
      recommendations.push('Consider a maintenance window');
    }
    
    // Cost impact
    if (summary.costImpact && summary.costImpact.difference > 100) {
      level = level === 'low' ? 'medium' : level;
      reasons.push(`Significant cost increase: +$${summary.costImpact.difference.toFixed(2)}/month`);
      recommendations.push('Review cost optimization opportunities');
    }
    
    return { level, reasons, recommendations };
  }
  
  /**
   * Parse preview output to extract changes
   */
  private parsePreviewOutput(output: string): ResourceChange[] {
    const changes: ResourceChange[] = [];
    const lines = output.split('\n');
    
    // Simple parsing - in real implementation would be more robust
    const resourceRegex = /^\s*([\+\-\~\*])\s+(\S+)\s+(.+?)\s+(\[.+?\])?/;
    
    lines.forEach(line => {
      const match = line.match(resourceRegex);
      if (match) {
        const [, operation, type, name] = match;
        
        let changeType: ChangeType;
        switch (operation) {
          case '+':
            changeType = ChangeType.CREATE;
            break;
          case '-':
            changeType = ChangeType.DELETE;
            break;
          case '~':
            changeType = ChangeType.UPDATE;
            break;
          case '*':
            changeType = ChangeType.REPLACE;
            break;
          default:
            changeType = ChangeType.SAME;
        }
        
        changes.push({
          urn: `urn:pulumi:stack::project::${type}::${name}`,
          type,
          name,
          changeType,
          replace: changeType === ChangeType.REPLACE
        });
      }
    });
    
    return changes;
  }
  
  /**
   * Estimate cost impact of changes
   */
  private estimateCostImpact(changes: ResourceChange[]): {
    current: number;
    projected: number;
    difference: number;
  } | null {
    // Simple estimation - in real implementation would use provider cost calculators
    let currentCost = 100; // Placeholder
    let projectedCost = currentCost;
    
    changes.forEach(change => {
      switch (change.changeType) {
        case ChangeType.CREATE:
          // Rough estimates by resource type
          if (change.type.includes('Database')) {
            projectedCost += 50;
          } else if (change.type.includes('Function')) {
            projectedCost += 10;
          } else if (change.type.includes('Storage')) {
            projectedCost += 5;
          } else {
            projectedCost += 2;
          }
          break;
        case ChangeType.DELETE:
          // Assume 20% cost reduction per deleted resource
          projectedCost *= 0.98;
          break;
      }
    });
    
    return {
      current: currentCost,
      projected: projectedCost,
      difference: projectedCost - currentCost
    };
  }
  
  /**
   * Compare two previews
   */
  comparePreview(
    before: PreviewSummary,
    after: PreviewSummary
  ): {
    improved: boolean;
    analysis: string[];
  } {
    const analysis: string[] = [];
    let improved = false;
    
    // Compare totals
    if (after.total < before.total) {
      improved = true;
      analysis.push(`Resource count reduced by ${before.total - after.total}`);
    }
    
    // Compare costs
    if (before.costImpact && after.costImpact) {
      const costDiff = after.costImpact.projected - before.costImpact.projected;
      if (costDiff < 0) {
        improved = true;
        analysis.push(`Cost reduced by $${Math.abs(costDiff).toFixed(2)}/month`);
      }
    }
    
    // Compare breaking changes
    const beforeBreaking = before.delete + before.replace;
    const afterBreaking = after.delete + after.replace;
    if (afterBreaking < beforeBreaking) {
      improved = true;
      analysis.push(`Breaking changes reduced from ${beforeBreaking} to ${afterBreaking}`);
    }
    
    return { improved, analysis };
  }
}