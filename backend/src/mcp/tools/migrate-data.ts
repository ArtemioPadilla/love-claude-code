import { MCPToolResult, ProviderType } from '../types.js'
import { migrationService } from '../migration.js'

export async function migrateData(
  args: {
    projectId: string
    fromProvider: ProviderType
    toProvider: ProviderType
    execute?: boolean
    options?: {
      includeUsers?: boolean
      includeData?: boolean
      includeFiles?: boolean
      dryRun?: boolean
    }
  }
): Promise<MCPToolResult> {
  try {
    if (!args.execute) {
      // Just create the plan
      const plan = await migrationService.createMigrationPlan(
        args.projectId,
        args.fromProvider,
        args.toProvider
      )
      
      return {
        success: true,
        data: {
          plan,
          message: 'Migration plan created. Set execute=true to run migration.'
        }
      }
    }
    
    // Execute migration
    const plan = await migrationService.createMigrationPlan(
      args.projectId,
      args.fromProvider,
      args.toProvider
    )
    
    const result = await migrationService.executeMigration(
      args.projectId,
      plan,
      args.options
    )
    
    return {
      success: result.success,
      data: {
        plan,
        result,
        message: result.success ? 
          'Migration completed successfully' : 
          'Migration completed with errors'
      },
      error: result.errors.length > 0 ? result.errors.join(', ') : undefined
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to migrate data'
    }
  }
}