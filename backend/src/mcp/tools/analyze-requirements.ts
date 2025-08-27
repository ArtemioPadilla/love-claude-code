import { ProjectRequirements, MCPToolResult } from '../types.js'
import { providerAdvisor } from '../advisor.js'

export async function analyzeProjectRequirements(
  requirements: ProjectRequirements
): Promise<MCPToolResult> {
  try {
    const recommendations = await providerAdvisor.analyzeAndRecommend(requirements)
    
    return {
      success: true,
      data: {
        recommendations,
        summary: recommendations.length > 0 ? (() => {
          const topChoice = recommendations[0]!
          return {
            topChoice,
            reasoning: `Based on your requirements for a ${requirements.projectType} project with ${requirements.expectedUsers} users, ` +
              `we recommend ${topChoice.provider} because: ${topChoice.reasoning.join(', ')}`
          }
        })() : {
          topChoice: null,
          reasoning: 'No suitable providers found for your requirements'
        }
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        requirementsHash: JSON.stringify(requirements).length // Simple hash
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze requirements'
    }
  }
}