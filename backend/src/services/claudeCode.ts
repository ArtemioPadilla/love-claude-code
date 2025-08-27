import Anthropic from '@anthropic-ai/sdk'
import { createError } from '../middleware/error.js'
import fetch from 'node-fetch'

/**
 * Claude Code OAuth Service
 * 
 * This service attempts to use OAuth tokens with various Claude endpoints
 * to find a working authentication method similar to Claude Code CLI
 */
class ClaudeCodeService {
  private readonly CLAUDE_CODE_ENDPOINTS = {
    // Potential Claude Code API endpoints (to be discovered)
    messages: 'https://api.anthropic.com/v1/messages',
    complete: 'https://api.anthropic.com/v1/complete',
    // Claude Code might use different endpoints
    codeMessages: 'https://api.claude.ai/v1/messages',
    codeComplete: 'https://api.claude.ai/v1/complete',
  }

  /**
   * Test OAuth token with different endpoints
   */
  async testOAuthWithEndpoints(oauthToken: string, message: string) {
    const results: Record<string, any> = {}
    
    // Test 1: Try standard Anthropic API with OAuth token as Bearer
    try {
      console.log('Testing OAuth with standard Anthropic API...')
      const anthropic = new Anthropic({
        apiKey: oauthToken,
        defaultHeaders: {
          'Authorization': `Bearer ${oauthToken}`,
          'anthropic-beta': 'messages-2023-12-15'
        }
      })
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [{ role: 'user', content: message }]
      })
      
      results.anthropicSDK = { success: true, response }
    } catch (error: any) {
      results.anthropicSDK = { 
        success: false, 
        error: error.message,
        status: error.status,
        type: error.type
      }
    }

    // Test 2: Direct API call with OAuth Bearer token
    try {
      console.log('Testing OAuth with direct API call...')
      const response = await fetch(this.CLAUDE_CODE_ENDPOINTS.messages, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'messages-2023-12-15'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [{ role: 'user', content: message }]
        })
      })
      
      const data = await response.text()
      results.directAPI = { 
        success: response.ok, 
        status: response.status,
        data: response.ok ? JSON.parse(data) : data
      }
    } catch (error: any) {
      results.directAPI = { 
        success: false, 
        error: error.message 
      }
    }

    // Test 3: Try claude.ai endpoints (hypothetical)
    try {
      console.log('Testing OAuth with claude.ai endpoints...')
      const response = await fetch(this.CLAUDE_CODE_ENDPOINTS.codeMessages, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://claude.ai',
          'Referer': 'https://claude.ai/'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [{ role: 'user', content: message }]
        })
      })
      
      const data = await response.text()
      results.claudeAI = { 
        success: response.ok, 
        status: response.status,
        data: response.ok ? JSON.parse(data) : data
      }
    } catch (error: any) {
      results.claudeAI = { 
        success: false, 
        error: error.message 
      }
    }

    // Test 4: OAuth token as API key directly
    try {
      console.log('Testing OAuth token as API key...')
      const response = await fetch(this.CLAUDE_CODE_ENDPOINTS.messages, {
        method: 'POST',
        headers: {
          'x-api-key': oauthToken,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [{ role: 'user', content: message }]
        })
      })
      
      const data = await response.text()
      results.apiKey = { 
        success: response.ok, 
        status: response.status,
        data: response.ok ? JSON.parse(data) : data
      }
    } catch (error: any) {
      results.apiKey = { 
        success: false, 
        error: error.message 
      }
    }

    return results
  }

  /**
   * Attempt to use OAuth token with Claude Code approach
   */
  async chatWithOAuth(_messages: any[], oauthToken: string): Promise<string> {
    // First, test which endpoint works
    const testMessage = 'Hello, this is a test message.'
    const testResults = await this.testOAuthWithEndpoints(oauthToken, testMessage)
    
    console.log('OAuth endpoint test results:', JSON.stringify(testResults, null, 2))
    
    // Find the first working method
    const workingMethod = Object.entries(testResults).find(([_, result]) => result.success)
    
    if (!workingMethod) {
      throw createError(
        'OAuth authentication failed with all methods. OAuth tokens from claude.ai may not be compatible with the API.',
        401,
        'OAUTH_NOT_SUPPORTED'
      )
    }
    
    const [methodName, _] = workingMethod
    console.log(`Using ${methodName} for OAuth authentication`)
    
    // Use the working method for the actual request
    // (Implementation would go here based on which method worked)
    
    throw createError(
      'OAuth implementation in progress. Please use API keys for now.',
      501,
      'NOT_IMPLEMENTED'
    )
  }
}

export const claudeCodeService = new ClaudeCodeService()