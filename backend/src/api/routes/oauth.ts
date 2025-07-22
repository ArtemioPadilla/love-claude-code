import { Router } from 'express'
import fetch from 'node-fetch'

export const oauthRouter = Router()

// OAuth token exchange endpoint
oauthRouter.post('/token', async (req, res) => {
  console.log('OAuth token exchange request received')
  console.log('Request body:', JSON.stringify(req.body, null, 2))
  
  try {
    // Prepare the request body as JSON
    const requestBody = {
      grant_type: req.body.grant_type,
      code: req.body.code,
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri,
      code_verifier: req.body.code_verifier,
      state: req.body.state
    }
    
    console.log('Forwarding request to Anthropic OAuth endpoint...')
    console.log('Request payload:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('https://console.anthropic.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://claude.ai',
        'Referer': 'https://claude.ai/'
      },
      body: JSON.stringify(requestBody)
    })
    
    const responseText = await response.text()
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.error('Token exchange failed:', responseText)
      return res.status(response.status).json({ 
        error: 'Token exchange failed', 
        details: responseText 
      })
    }
    
    try {
      const data = JSON.parse(responseText)
      res.json(data)
    } catch (e) {
      console.error('Failed to parse response:', responseText)
      res.status(500).json({ 
        error: 'Invalid response from OAuth server',
        details: responseText 
      })
    }
  } catch (error) {
    console.error('OAuth proxy error:', error)
    res.status(500).json({ 
      error: 'OAuth server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// OAuth token refresh endpoint
oauthRouter.post('/refresh', async (req, res) => {
  console.log('OAuth token refresh request received')
  console.log('Request body:', JSON.stringify(req.body, null, 2))
  
  try {
    const requestBody = {
      grant_type: 'refresh_token',
      refresh_token: req.body.refresh_token,
      client_id: req.body.client_id
    }
    
    console.log('Forwarding refresh request to Anthropic OAuth endpoint...')
    console.log('Request payload:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('https://console.anthropic.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://claude.ai',
        'Referer': 'https://claude.ai/'
      },
      body: JSON.stringify(requestBody)
    })
    
    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('Token refresh failed:', responseText)
      return res.status(response.status).json({ 
        error: 'Token refresh failed', 
        details: responseText 
      })
    }
    
    try {
      const data = JSON.parse(responseText)
      res.json(data)
    } catch (e) {
      console.error('Failed to parse response:', responseText)
      res.status(500).json({ 
        error: 'Invalid response from OAuth server',
        details: responseText 
      })
    }
  } catch (error) {
    console.error('OAuth refresh error:', error)
    res.status(500).json({ 
      error: 'OAuth server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// OAuth revoke endpoint (best effort)
oauthRouter.post('/revoke', async (req, res) => {
  console.log('OAuth token revoke request received')
  
  try {
    const requestBody = {
      token: req.body.token,
      client_id: req.body.client_id,
      token_type_hint: req.body.token_type_hint || 'access_token'
    }
    
    // Note: The revocation endpoint for OAuth tokens is not publicly documented
    // This is a best-effort attempt based on OAuth 2.0 standards
    const response = await fetch('https://console.anthropic.com/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://claude.ai',
        'Referer': 'https://claude.ai/'
      },
      body: JSON.stringify(requestBody)
    })
    
    // Even if revocation fails on the server side, we return success
    // The client should clear local tokens regardless
    res.json({ success: true })
  } catch (error) {
    console.error('OAuth revoke error:', error)
    // Still return success - client should clear tokens
    res.json({ success: true })
  }
})